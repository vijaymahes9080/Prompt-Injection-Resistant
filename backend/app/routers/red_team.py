from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.routers.auth import RoleChecker
from app.security.red_team import RedTeamSimulator
from app.security.stego_scanner import StegoFileScanner
from app.security.firewall import add_healed_rule

router = APIRouter(
    prefix="/api/red-team",
    tags=["Red vs Blue Lab"]
)

# Admin or operator can access simulation features
operator_or_admin = RoleChecker(["admin", "operator"])

class SimulateRequest(BaseModel):
    target_goal: str
    rounds: Optional[int] = 5

class HealRequest(BaseModel):
    name: str
    pattern: str
    threat_type: str
    weight: int

class MockFileScanRequest(BaseModel):
    filename: str
    content_type: str

@router.post("/simulate")
def run_simulation(payload: SimulateRequest, current_user = Depends(operator_or_admin)):
    """
    Triggers a live Red vs. Blue multi-round simulation attack game.
    """
    try:
        simulator = RedTeamSimulator(target_goal=payload.target_goal)
        rounds = min(max(payload.rounds or 5, 1), 10)
        logs = simulator.run_simulation(steps_count=rounds)
        return {
            "target_goal": payload.target_goal,
            "rounds": rounds,
            "logs": logs
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation failed: {str(e)}"
        )

@router.post("/stego-scan-file")
async def scan_uploaded_file(
    file: UploadFile = File(...),
    current_user = Depends(operator_or_admin)
):
    """
    Ingests and scans an uploaded file for EXIF metadata and pixel steganography.
    """
    try:
        scanner = StegoFileScanner()
        res = scanner.scan_file(file.filename, file.content_type)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File scan failed: {str(e)}"
        )

@router.post("/stego-scan-mock")
def scan_mock_file(
    payload: MockFileScanRequest,
    current_user = Depends(operator_or_admin)
):
    """
    Simulates checking a specific mock filename for demonstration purposes.
    """
    try:
        scanner = StegoFileScanner()
        res = scanner.scan_file(payload.filename, payload.content_type)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Mock file scan failed: {str(e)}"
        )

@router.post("/heal")
def apply_healed_rule(payload: HealRequest, current_user = Depends(operator_or_admin)):
    """
    Installs a self-healing rule dynamically into the prompt firewall ruleset.
    """
    try:
        add_healed_rule(
            name=payload.name,
            pattern=payload.pattern,
            threat_type=payload.threat_type,
            weight=payload.weight
        )
        return {
            "status": "SUCCESS",
            "message": f"Firewall healed. Rule '{payload.name}' injected into current security ruleset.",
            "rule": {
                "name": payload.name,
                "pattern": payload.pattern,
                "threat_type": payload.threat_type,
                "weight": payload.weight
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Healing injection failed: {str(e)}"
        )
