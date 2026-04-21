import random
import string
import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import DSRRequest, Subject, AuditLog, RequestType, RequestStatus, RiskTier
from services.risk_engine import assess_risk, requires_escalation
from services.email_service import send_otp, send_request_confirmation
from services import ai_draft as ai

router = APIRouter(prefix="/request", tags=["requests"])


class NewRequestBody(BaseModel):
    name: str
    email: str
    request_type: RequestType
    description: str = ""
    modification_data: dict | None = None


class VerifyOTPBody(BaseModel):
    request_id: int
    otp: str


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _log(db: Session, request_id: int, actor: str, action: str, detail: str = ""):
    db.add(AuditLog(request_id=request_id, actor=actor, action=action, detail=detail))


@router.post("/new")
def submit_request(body: NewRequestBody, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(
        Subject.email == body.email,
        Subject.is_deleted == False,
    ).first()

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Email not found in the university database. "
                   "Please use the email address registered with Covenant University.",
        )

    otp = _generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)

    req = DSRRequest(
        subject_email=body.email,
        subject_name=body.name,
        request_type=body.request_type,
        description=body.description,
        status=RequestStatus.PENDING_VERIFICATION,
        otp=otp,
        otp_expires_at=expires,
        modification_data=json.dumps(body.modification_data) if body.modification_data else None,
    )
    db.add(req)
    db.flush()

    _log(db, req.id, "system", "request_created",
         f"New {body.request_type} request from {body.email}")

    try:
        send_otp(body.email, body.name, otp)
        email_sent = True
    except Exception as e:
        email_sent = False
        _log(db, req.id, "system", "email_error", str(e))

    db.commit()

    if not email_sent:
        raise HTTPException(status_code=500, detail=f"Request created (ID #{req.id}) but OTP email failed to send. Check server email configuration.")

    return {"request_id": req.id, "message": "OTP sent to your registered email address."}


@router.post("/verify")
def verify_otp(body: VerifyOTPBody, db: Session = Depends(get_db)):
    req = db.query(DSRRequest).filter(DSRRequest.id == body.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")

    if req.otp_verified:
        raise HTTPException(status_code=400, detail="OTP already used.")

    now = datetime.now(timezone.utc)
    expires = req.otp_expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if now > expires:
        raise HTTPException(status_code=400, detail="OTP has expired. Please submit a new request.")

    if req.otp != body.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")

    req.otp_verified = True
    req.status = RequestStatus.VERIFIED

    subject = db.query(Subject).filter(Subject.email == req.subject_email).first()

    recent_count = db.query(DSRRequest).filter(
        DSRRequest.subject_email == req.subject_email,
        DSRRequest.otp_verified == True,
        DSRRequest.created_at >= datetime.now(timezone.utc) - timedelta(days=7),
    ).count()

    risk_tier, escalation_reason = assess_risk(
        request_type=req.request_type,
        subject_has_special_category=subject.special_category if subject else False,
        recent_request_count=recent_count,
    )

    req.risk_tier = risk_tier
    req.escalation_reason = escalation_reason

    if requires_escalation(risk_tier):
        req.status = RequestStatus.ESCALATED
        _log(db, req.id, "system", "escalated",
             f"Risk tier: {risk_tier}. Reason: {escalation_reason}")
        db.commit()
        return {
            "status": "escalated",
            "risk_tier": risk_tier,
            "message": "Your request requires additional review. You will be notified once processed.",
        }

    # Auto-execute low/medium risk requests
    req.status = RequestStatus.IN_PROGRESS
    _execute_request(req, subject, db)

    send_request_confirmation(req.subject_email, req.subject_name, req.request_type, req.id)

    # AI draft (non-blocking — best effort)
    try:
        draft = ai.generate_draft(
            req.request_type, req.subject_name, req.subject_email, req.description or ""
        )
        if draft:
            req.ai_draft = draft
    except Exception:
        pass

    db.commit()
    return {"status": "completed", "risk_tier": risk_tier, "request_id": req.id}


def _execute_request(req: DSRRequest, subject: Subject | None, db: Session):
    if not subject:
        return

    if req.request_type == RequestType.ACCESS:
        _log(db, req.id, "system", "data_retrieved",
             f"Subject data retrieved: name={subject.name}, email={subject.email}, "
             f"department={subject.department}, role={subject.role}, tags={subject.tags}")
        req.status = RequestStatus.COMPLETED
        req.completed_at = datetime.now(timezone.utc)

    elif req.request_type == RequestType.DELETION:
        _log(db, req.id, "system", "record_deleted",
             f"Subject record deleted: {subject.email} (role={subject.role})")
        subject.is_deleted = True
        req.status = RequestStatus.COMPLETED
        req.completed_at = datetime.now(timezone.utc)

    elif req.request_type == RequestType.MODIFICATION:
        mod_data = {}
        if req.modification_data:
            try:
                mod_data = json.loads(req.modification_data)
            except Exception:
                pass
        changes = []
        for field, value in mod_data.items():
            if hasattr(subject, field):
                old = getattr(subject, field)
                setattr(subject, field, value)
                changes.append(f"{field}: '{old}' → '{value}'")
        _log(db, req.id, "system", "record_modified", "; ".join(changes))
        req.status = RequestStatus.COMPLETED
        req.completed_at = datetime.now(timezone.utc)

    elif req.request_type == RequestType.STOP_PROCESSING:
        subject.opt_out_marketing = True
        subject.stop_processing = True
        old_tags = subject.tags or ""
        tags = set(t.strip() for t in old_tags.split(",") if t.strip())
        tags.update({"opt_out", "stop_marketing"})
        subject.tags = ",".join(tags)
        _log(db, req.id, "system", "processing_stopped",
             f"opt_out_marketing=True, stop_processing=True, tags updated to: {subject.tags}")
        req.status = RequestStatus.COMPLETED
        req.completed_at = datetime.now(timezone.utc)


@router.get("/{request_id}/status")
def get_status(request_id: int, db: Session = Depends(get_db)):
    req = db.query(DSRRequest).filter(DSRRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    return {
        "id": req.id,
        "status": req.status,
        "risk_tier": req.risk_tier,
        "request_type": req.request_type,
        "created_at": req.created_at,
        "completed_at": req.completed_at,
    }
