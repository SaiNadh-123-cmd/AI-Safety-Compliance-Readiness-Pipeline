from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

class EvidenceItem(BaseModel):
    id: str
    title: str
    status: str
    tone: str

class ComplianceMatrixResponse(BaseModel):
    pillar: str
    controls_mapped: str
    readiness_index: float
    evidence: List[EvidenceItem]

@router.get("/matrix", response_model=ComplianceMatrixResponse)
async def get_compliance_matrix(pillar: str = "GOVERN"):
    return ComplianceMatrixResponse(
        pillar=pillar,
        controls_mapped="47/56",
        readiness_index=82.4,
        evidence=[
            EvidenceItem(id="RT-038", title="Context & data mapping", status="HIGH / IN PROGRESS", tone="red"),
            EvidenceItem(id="PG-014", title="Privacy risk measurement", status="LOW / PASSED", tone="green"),
            EvidenceItem(id="DOC-021", title="Human oversight roles", status="REVIEW REQUIRED", tone="gold"),
            EvidenceItem(id="EV-009", title="Incident response plan", status="NOT STARTED", tone="cyan"),
        ]
    )

@router.get("/dossier")
async def get_executive_dossier(format: str = "json"):
    data = {
        "title": "O&G Executive Readiness Dossier",
        "readiness_index": 82.4,
        "control_coverage": "47/56",
        "open_findings": 6,
        "human_signoffs": 3,
        "boundary_warning": "Not legal advice. Human review required for applicability, risk classification, and deployment."
    }
    return data
