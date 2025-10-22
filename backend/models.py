from datetime import datetime
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class CredentialBase(SQLModel):
    name: str
    account_id: str
    role_name: str
    description: Optional[str] = None


class Credential(CredentialBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    scans: List["ScanResult"] = Relationship(back_populates="credential")


class CredentialCreate(CredentialBase):
    pass


class CredentialRead(CredentialBase):
    id: int
    created_at: datetime


class ScanResultBase(SQLModel):
    executed_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    score: int
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    findings_json: str


class ScanResult(ScanResultBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    credential_id: Optional[int] = Field(default=None, foreign_key="credential.id")

    credential: Optional[Credential] = Relationship(back_populates="scans")


class ScanResultRead(ScanResultBase):
    id: int
    credential_id: Optional[int]


class ScanResultSummary(SQLModel):
    id: int
    executed_at: datetime
    score: int
    high_count: int
    medium_count: int
    low_count: int


class ScanResultDetail(ScanResultSummary):
    findings: List[dict]
