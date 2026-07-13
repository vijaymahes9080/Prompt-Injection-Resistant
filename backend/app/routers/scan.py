from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import ScanRequest, ScanResponse
from app.security.firewall import scan_input

router = APIRouter(
    prefix="/api/scan",
    tags=["Firewall Scanner"]
)

@router.post("", response_model=ScanResponse)
def scan_text(payload: ScanRequest):
    """
    Scans a given text input for direct and indirect prompt injection attempts.
    Returns normalized text, threat score, action directive, and threat categorization.
    """
    try:
        scan_res = scan_input(payload.text)
        return ScanResponse(
            text=payload.text,
            normalized_text=scan_res["normalized"],
            risk_score=scan_res["score"],
            action=scan_res["action"],
            threat_type=scan_res["threat_type"],
            matched_pattern=scan_res["matched_pattern"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scanning failed: {str(e)}"
        )
