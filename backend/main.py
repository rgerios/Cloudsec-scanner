import logging
import os
from pathlib import Path
from typing import Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

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

app = FastAPI(title="CloudSec Scanner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScanRequest(BaseModel):
    account_id: str
    role_name: str


latest_results: Dict = {}


@app.post("/scan")
def run_scan(request: ScanRequest) -> Dict:
    global latest_results

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
            findings.extend(scanner(request.account_id, request.role_name))
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

    latest_results = {
        "findings": findings,
        "score": score,
        "severity_breakdown": severity_breakdown,
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
