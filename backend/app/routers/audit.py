from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.database import get_db
from app.models import AuditLog, ThreatEvent
from app.schemas import AuditLogOut
from app.routers.auth import RoleChecker

router = APIRouter(
    prefix="/api/audit",
    tags=["Audit & Metrics"]
)

# Admin role verification helper
admin_role_only = RoleChecker(["admin"])

@router.get("/logs", response_model=List[AuditLogOut])
def get_logs(
    session_id: Optional[str] = None,
    action_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Retrieves execution logs, filtered by action or session.
    """
    query = db.query(AuditLog)
    if session_id:
        query = query.filter(AuditLog.session_id == session_id)
    if action_filter:
        query = query.filter(AuditLog.firewall_action == action_filter)
        
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).offset(offset).all()

@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    """
    Calculates aggregated threat dashboard metrics.
    """
    total_requests = db.query(func.count(AuditLog.id)).scalar() or 0
    total_blocked = db.query(func.count(AuditLog.id)).filter(AuditLog.firewall_action == "REJECT").scalar() or 0
    total_rewrites = db.query(func.count(AuditLog.id)).filter(AuditLog.firewall_action == "REWRITE").scalar() or 0
    
    # Calculate average risk score
    avg_risk = db.query(func.avg(AuditLog.risk_score)).scalar()
    avg_risk_score = round(float(avg_risk), 1) if avg_risk is not None else 0.0
    
    # Threat classifications breakdown
    threat_breakdown = {
        "direct_injection": 0,
        "jailbreak": 0,
        "leakage": 0,
        "role_confusion": 0,
        "nested_instruction": 0,
        "unicode_obfuscation": 0
    }
    
    threats = db.query(ThreatEvent.threat_type, func.count(ThreatEvent.id)).group_by(ThreatEvent.threat_type).all()
    for t_type, count in threats:
        if t_type in threat_breakdown:
            threat_breakdown[t_type] = count
            
    # Token count & cost aggregation
    total_tokens = db.query(func.sum(AuditLog.tokens_used)).scalar() or 0
    total_cost = db.query(func.sum(AuditLog.cost)).scalar() or 0.0
    
    # Generate threat history sparkline data (last 7 days/intervals)
    # We can group audit logs by day
    today = datetime.utcnow()
    sparkline = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        start_day = datetime(day.year, day.month, day.day, 0, 0, 0)
        end_day = datetime(day.year, day.month, day.day, 23, 59, 59)
        
        count = db.query(func.count(AuditLog.id)).filter(
            AuditLog.timestamp >= start_day,
            AuditLog.timestamp <= end_day
        ).scalar() or 0
        
        blocked = db.query(func.count(AuditLog.id)).filter(
            AuditLog.timestamp >= start_day,
            AuditLog.timestamp <= end_day,
            AuditLog.firewall_action == "REJECT"
        ).scalar() or 0
        
        sparkline.append({
            "day": day.strftime("%a"),
            "requests": count,
            "blocked": blocked
        })

    return {
        "total_requests": total_requests,
        "total_blocked": total_blocked,
        "total_rewrites": total_rewrites,
        "average_risk_score": avg_risk_score,
        "threat_breakdown": threat_breakdown,
        "total_tokens": total_tokens,
        "total_cost": round(total_cost, 2),
        "history": sparkline
    }

@router.post("/clear")
def clear_logs(db: Session = Depends(get_db), current_user = Depends(admin_role_only)):
    """
    Deletes all audit records and threat records. (Admin only)
    """
    try:
        db.query(ThreatEvent).delete()
        db.query(AuditLog).delete()
        db.commit()
        return {"detail": "Audit trails cleared successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clear logs action failed: {str(e)}"
        )

# Helper to import Optional
from typing import Optional
