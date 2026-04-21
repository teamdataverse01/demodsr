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
from services.email_service import send_otp, send_completion_email
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

    email_error = None
    try:
        send_otp(body.email, body.name, otp)
    except Exception as e:
        email_error = str(e)
        _log(db, req.id, "system", "email_error", email_error)

    db.commit()

    if email_error:
        # Demo mode: return OTP in response so demo still works if email fails
        return {"request_id": req.id, "message": f"Email delivery failed — demo code: {otp}", "demo_otp": otp}

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
        academic_status=subject.academic_status if subject else "active",
        has_legal_hold=subject.has_legal_hold if subject else False,
        outstanding_balance=subject.outstanding_balance if subject else False,
        is_research_participant=subject.is_research_participant if subject else False,
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
    completion_message = _execute_request(req, subject, db)

    send_completion_email(req.subject_email, req.subject_name, req.request_type, req.id, completion_message)

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


def _execute_request(req: DSRRequest, subject: Subject | None, db: Session) -> str:
    if not subject:
        return "Your request has been processed."

    req.status = RequestStatus.COMPLETED
    req.completed_at = datetime.now(timezone.utc)

    if req.request_type == RequestType.ACCESS:
        data_summary = (
            f"Name: {subject.name}<br>"
            f"Email: {subject.email}<br>"
            f"Student ID: {subject.reg_number or 'N/A'}<br>"
            f"Department: {subject.department or 'N/A'}<br>"
            f"Role: {subject.role or 'N/A'}<br>"
            f"Phone: {'[encrypted — available on verified request to DPO]' if subject.phone else 'N/A'}<br>"
            f"Address: {'[encrypted — available on verified request to DPO]' if subject.address else 'N/A'}<br>"
            f"Special Category Data: {'Yes' if subject.special_category else 'No'}<br>"
            f"Marketing Opt-Out: {'Yes' if subject.opt_out_marketing else 'No'}"
        )
        _log(db, req.id, "system", "data_retrieved",
             f"Access request fulfilled for {subject.email}")
        return f"The following data is held about you by Covenant University:<br><br>{data_summary}"

    elif req.request_type == RequestType.DELETION:
        subject.is_deleted = True
        _log(db, req.id, "system", "record_deleted",
             f"Subject record soft-deleted: {subject.email}")
        return (
            "Your personal data has been removed from the Covenant University DataVerse system. "
            "Anonymised records required for statutory compliance may be retained per our retention policy."
        )

    elif req.request_type == RequestType.MODIFICATION:
        mod_data = {}
        if req.modification_data:
            try:
                mod_data = json.loads(req.modification_data)
            except Exception:
                pass
        changes = []
        change_lines = []
        for field, value in mod_data.items():
            if hasattr(subject, field):
                old = getattr(subject, field)
                setattr(subject, field, value)
                changes.append(f"{field}: '{old}' -> '{value}'")
                change_lines.append(f"<strong>{field.title()}</strong>: updated successfully")
        _log(db, req.id, "system", "record_modified", "; ".join(changes))
        updates = "<br>".join(change_lines) if change_lines else "No changes were applied."
        return f"Your personal data has been updated:<br><br>{updates}"

    elif req.request_type == RequestType.STOP_PROCESSING:
        subject.opt_out_marketing = True
        subject.stop_processing = True
        old_tags = subject.tags or ""
        tags = set(t.strip() for t in old_tags.split(",") if t.strip())
        tags.update({"opt_out", "stop_marketing"})
        subject.tags = ",".join(tags)
        _log(db, req.id, "system", "processing_stopped",
             f"opt_out_marketing=True, stop_processing=True")
        return (
            "Your data will no longer be used for marketing or non-essential processing. "
            "This preference has been recorded and will be honoured immediately."
        )

    return "Your request has been processed."


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
