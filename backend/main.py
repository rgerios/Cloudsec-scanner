import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from db import get_session, init_db
from models import (
    Credential,
    CredentialCreate,
    CredentialRead,
    ScanResult,
    ScanResultDetail,
    ScanResultSummary,
)
from reports.pdf_generator import generate_pdf
from services import (
    cloudtrail_check,
    ec2_check,
    iam_check,
    kms_check,
    network_check,
    rds_check,
    s3_check,
)

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

app = FastAPI(title="CloudSec Scanner", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScanRequest(BaseModel):
    account_id: Optional[str] = Field(default=None, description="AWS account number")
    role_name: Optional[str] = Field(default=None, description="IAM role name to assume")
    credential_id: Optional[int] = Field(
        default=None, description="Identifier of a stored credential"
    )


latest_results: Dict = {}


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.post("/credentials", response_model=CredentialRead, status_code=status.HTTP_201_CREATED)
def create_credential(
    credential_in: CredentialCreate, session: Session = Depends(get_session)
) -> CredentialRead:
    existing = session.exec(
        select(Credential).where(
            (Credential.account_id == credential_in.account_id)
            & (Credential.role_name == credential_in.role_name)
            & (Credential.name == credential_in.name)
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uma credencial com este nome, account_id e role_name já existe.",
        )

    credential = Credential(**credential_in.dict())
    session.add(credential)
    session.commit()
    session.refresh(credential)

    return credential


@app.get("/credentials", response_model=List[CredentialRead])
def list_credentials(session: Session = Depends(get_session)) -> List[CredentialRead]:
    credentials = session.exec(
        select(Credential).order_by(Credential.created_at.desc())
    ).all()
    return list(credentials)


@app.delete("/credentials/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credential(credential_id: int, session: Session = Depends(get_session)) -> None:
    credential = session.get(Credential, credential_id)
    if not credential:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credencial não encontrada.")
    session.delete(credential)
    session.commit()


@app.get(
    "/credentials/{credential_id}/history",
    response_model=List[ScanResultSummary],
)
def get_history(credential_id: int, session: Session = Depends(get_session)) -> List[ScanResultSummary]:
    credential = session.get(Credential, credential_id)
    if not credential:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credencial não encontrada.")

    results = session.exec(
        select(ScanResult)
        .where(ScanResult.credential_id == credential_id)
        .order_by(ScanResult.executed_at.desc())
    ).all()

    return [
        ScanResultSummary(
            id=scan.id,
            executed_at=scan.executed_at,
            score=scan.score,
            high_count=scan.high_count,
            medium_count=scan.medium_count,
            low_count=scan.low_count,
        )
        for scan in results
    ]


@app.get("/history/{scan_id}", response_model=ScanResultDetail)
def get_scan_detail(scan_id: int, session: Session = Depends(get_session)) -> ScanResultDetail:
    scan = session.get(ScanResult, scan_id)
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Histórico não encontrado.")

    findings = json.loads(scan.findings_json or "[]")

    return ScanResultDetail(
        id=scan.id,
        executed_at=scan.executed_at,
        score=scan.score,
        high_count=scan.high_count,
        medium_count=scan.medium_count,
        low_count=scan.low_count,
        findings=findings,
    )


@app.post("/scan")
def run_scan(request: ScanRequest, session: Session = Depends(get_session)) -> Dict:
    global latest_results

    credential: Optional[Credential] = None
    account_id = request.account_id
    role_name = request.role_name

    if request.credential_id is not None:
        credential = session.get(Credential, request.credential_id)
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Credencial não encontrada."
            )
        account_id = credential.account_id
        role_name = credential.role_name

    if not account_id or not role_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informe account_id e role_name ou uma credencial armazenada.",
        )

    scanners = [
        iam_check.check_iam,
        s3_check.check_s3,
        cloudtrail_check.check_trail,
        network_check.check_sg,
        kms_check.check_kms,
        ec2_check.check_ec2,
        rds_check.check_rds,
    ]

    findings: List[Dict] = []
    for scanner in scanners:
        try:
            findings.extend(scanner(account_id, role_name))
        except Exception as exc:  # pragma: no cover - safeguard against unexpected failures
            logger.exception("Scanner %s failed: %s", scanner.__name__, exc)

    score = 100
    severity_impact = {"High": 30, "Medium": 10, "Low": 5}
    severity_breakdown = {"High": 0, "Medium": 0, "Low": 0}

    for finding in findings:
        severity = finding.get("severity")
        if severity in severity_impact:
            score -= severity_impact[severity]
            severity_breakdown[severity] += 1

    score = max(0, min(100, score))

    scan_record: Optional[ScanResult] = None
    if credential:
        scan_record = ScanResult(
            credential_id=credential.id,
            score=score,
            high_count=severity_breakdown["High"],
            medium_count=severity_breakdown["Medium"],
            low_count=severity_breakdown["Low"],
            findings_json=json.dumps(findings),
        )
        session.add(scan_record)
        session.commit()
        session.refresh(scan_record)

    latest_results = {
        "findings": findings,
        "score": score,
        "severity_breakdown": severity_breakdown,
        "account_id": account_id,
        "role_name": role_name,
        "credential_id": credential.id if credential else None,
        "scan_id": scan_record.id if scan_record else None,
    }

    return latest_results


@app.get("/export")
def export_report():
    if not latest_results:
        raise HTTPException(status_code=400, detail="Nenhum scan executado ainda.")

    reports_dir = Path(__file__).resolve().parent / "reports"
    pdf_path = reports_dir / "cloudsec_report.pdf"

    generate_pdf(latest_results, str(pdf_path))

    return FileResponse(
        path=str(pdf_path),
        filename="cloudsec_report.pdf",
        media_type="application/pdf",
    )
