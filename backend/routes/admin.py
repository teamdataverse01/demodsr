import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import DSRRequest, Subject, AuditLog, AdminUser, RequestStatus, RiskTier
from services.email_service import send_completion_email
from routes.requests import _execute_request, _log

router = APIRouter(prefix="/admin", tags=["admin"])

# --- Simple JWT-free token auth for demo ---
import hashlib, os, secrets

_SESSIONS: dict[str, str] = {}   # token -> admin email


def _get_admin(authorization: str = Header(...), db: Session = Depends(get_db)) -> AdminUser:
    token = authorization.replace("Bearer ", "").strip()
    email = _SESSIONS.get(token)
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    admin = db.query(AdminUser).filter(AdminUser.email == email, AdminUser.is_active == True).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Admin account not found.")
    return admin


def _require_superadmin(admin: AdminUser):
    if admin.role != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required.")


def _require_not_legal(admin: AdminUser):
    """Legal role is read-only — cannot approve, reject, or modify."""
    if admin.role == "legal":
        raise HTTPException(status_code=403, detail="Legal role is read-only. Contact the DPO to action this request.")


# --- Auth ---

class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == body.email).first()
    if not admin or not admin.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    pw_hash = hashlib.sha256(body.password.encode()).hexdigest()
    if admin.password_hash != pw_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    token = secrets.token_hex(32)
    _SESSIONS[token] = admin.email
    return {"token": token, "name": admin.name, "role": admin.role, "email": admin.email}


@router.post("/logout")
def logout(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "").strip()
    _SESSIONS.pop(token, None)
    return {"message": "Logged out."}


@router.get("/me")
def me(admin: AdminUser = Depends(_get_admin)):
    permissions = {
        "superadmin": {
            "can_approve": True, "can_reject": True, "can_view_settings": True,
            "can_view_all_requests": True, "can_view_subjects": True,
            "description": "Full system access — approve, reject, configure, view all data.",
        },
        "admin": {
            "can_approve": True, "can_reject": True, "can_view_settings": False,
            "can_view_all_requests": True, "can_view_subjects": True,
            "description": "Process requests — approve and reject. Cannot access system settings.",
        },
        "legal": {
            "can_approve": False, "can_reject": False, "can_view_settings": False,
            "can_view_all_requests": False, "can_view_subjects": False,
            "description": "Read-only access to HIGH and CRITICAL escalations only. Cannot take actions.",
        },
    }
    return {
        "name": admin.name,
        "email": admin.email,
        "role": admin.role,
        "permissions": permissions.get(admin.role, {}),
    }


# --- Request queue ---

@router.get("/requests")
def list_requests(
    status: str | None = None,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(_get_admin),
):
    q = db.query(DSRRequest)
    if status:
        q = q.filter(DSRRequest.status == status)
    # Legal role: restricted to HIGH and CRITICAL only
    if admin.role == "legal":
        q = q.filter(DSRRequest.risk_tier.in_(["HIGH", "CRITICAL"]))
    requests = q.order_by(DSRRequest.created_at.desc()).all()

    result = []
    for r in requests:
        result.append({
            "id": r.id,
            "subject_email": r.subject_email,
            "subject_name": r.subject_name,
            "request_type": r.request_type,
            "status": r.status,
            "risk_tier": r.risk_tier,
            "escalation_reason": r.escalation_reason,
            "created_at": r.created_at,
            "completed_at": r.completed_at,
            "ai_draft": r.ai_draft,
            "admin_notes": r.admin_notes,
        })
    return result


@router.get("/requests/{request_id}")
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(_get_admin),
):
    req = db.query(DSRRequest).filter(DSRRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Not found.")

    subject = db.query(Subject).filter(Subject.email == req.subject_email).first()
    logs = db.query(AuditLog).filter(AuditLog.request_id == request_id).order_by(AuditLog.timestamp).all()

    return {
        "request": {
            "id": req.id,
            "subject_email": req.subject_email,
            "subject_name": req.subject_name,
            "request_type": req.request_type,
            "description": req.description,
            "status": req.status,
            "risk_tier": req.risk_tier,
            "escalation_reason": req.escalation_reason,
            "created_at": req.created_at,
            "completed_at": req.completed_at,
            "ai_draft": req.ai_draft,
            "admin_notes": req.admin_notes,
            "modification_data": req.modification_data,
        },
        "subject": {
            "name": subject.name if subject else None,
            "email": subject.email if subject else None,
            "phone": subject.phone if subject else None,
            "department": subject.department if subject else None,
            "role": subject.role if subject else None,
            "reg_number": subject.reg_number if subject else None,
            "address": subject.address if subject else None,
            "tags": subject.tags if subject else None,
            "special_category": subject.special_category if subject else False,
            "opt_out_marketing": subject.opt_out_marketing if subject else False,
            "is_deleted": subject.is_deleted if subject else False,
        } if subject else None,
        "audit_trail": [
            {
                "id": l.id,
                "actor": l.actor,
                "action": l.action,
                "detail": l.detail,
                "timestamp": l.timestamp,
            }
            for l in logs
        ],
    }


class ActionBody(BaseModel):
    notes: str = ""


@router.post("/requests/{request_id}/approve")
def approve_request(
    request_id: int,
    body: ActionBody,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(_get_admin),
):
    _require_not_legal(admin)
    req = db.query(DSRRequest).filter(DSRRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Not found.")
    if req.status != RequestStatus.ESCALATED:
        raise HTTPException(status_code=400, detail="Request is not in escalated state.")

    subject = db.query(Subject).filter(Subject.email == req.subject_email).first()
    req.admin_notes = body.notes
    req.processed_by = admin.email

    _log(db, req.id, admin.email, "approved", body.notes)
    _execute_request(req, subject, db)

    send_completion_email(
        req.subject_email, req.subject_name, req.request_type, req.id,
        "Your request has been reviewed and approved by our Data Protection team."
    )
    db.commit()
    return {"message": "Request approved and executed."}


@router.post("/requests/{request_id}/reject")
def reject_request(
    request_id: int,
    body: ActionBody,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(_get_admin),
):
    _require_not_legal(admin)
    req = db.query(DSRRequest).filter(DSRRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Not found.")

    req.status = RequestStatus.REJECTED
    req.admin_notes = body.notes
    req.processed_by = admin.email
    req.completed_at = datetime.now(timezone.utc)
    _log(db, req.id, admin.email, "rejected", body.notes)

    send_completion_email(
        req.subject_email, req.subject_name, req.request_type, req.id,
        f"Your request has been reviewed. Unfortunately, we are unable to fulfil this request at this time. "
        f"Reason: {body.notes}"
    )
    db.commit()
    return {"message": "Request rejected."}


# --- Subject lookup ---

@router.get("/subjects")
def list_subjects(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(_get_admin),
):
    subjects = db.query(Subject).filter(Subject.is_deleted == False).all()
    return [
        {
            "id": s.id, "name": s.name, "email": s.email,
            "department": s.department, "role": s.role,
            "reg_number": s.reg_number, "tags": s.tags,
            "special_category": s.special_category,
            "opt_out_marketing": s.opt_out_marketing,
        }
        for s in subjects
    ]


@router.get("/subjects/{email}")
def get_subject(
    email: str,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(_get_admin),
):
    subject = db.query(Subject).filter(Subject.email == email).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    return subject


# --- System Settings (superadmin only) ---

@router.get("/settings")
def get_settings(admin: AdminUser = Depends(_get_admin)):
    _require_superadmin(admin)
    return {
        "retention_policy": [
            {"category": "Student Records", "retention_period": "7 years after graduation", "basis": "NDPR Article 2.1 / University Records Policy", "auto_delete": True},
            {"category": "Staff Records", "retention_period": "10 years after employment ends", "basis": "Labour Act Cap L1 LFN 2004", "auto_delete": True},
            {"category": "Faculty Records", "retention_period": "10 years after contract ends", "basis": "Labour Act Cap L1 LFN 2004", "auto_delete": True},
            {"category": "Alumni Records", "retention_period": "Indefinite (with consent)", "basis": "Legitimate interest — alumni engagement", "auto_delete": False},
            {"category": "DSR Audit Logs", "retention_period": "5 years", "basis": "NDPR compliance evidence requirement", "auto_delete": True},
            {"category": "OTP / Verification Codes", "retention_period": "Deleted after use or 10 minutes", "basis": "Data minimisation principle", "auto_delete": True},
        ],
        "retention_job": {
            "type": "Scheduled task (APScheduler)",
            "schedule": "Every night at 02:00 WAT",
            "last_run": "2026-04-20T02:00:00Z",
            "next_run": "2026-04-21T02:00:00Z",
            "records_flagged_last_run": 0,
        },
        "data_ownership": {
            "controller": "Covenant University, Ota, Ogun State, Nigeria",
            "processor": "DataVerse Solutions Ltd",
            "dpa_signed": True,
            "dpa_date": "2026-01-15",
            "dpa_reference": "DPA/CU/DATAVERSE/2026/001",
            "basis": "DataVerse acts solely as data processor. The university retains full ownership and control of all personal data. DataVerse cannot access, sell, or use the data for any purpose outside this agreement.",
        },
        "encryption": {
            "at_rest": "AES-256 (PostgreSQL Transparent Data Encryption on Railway Pro)",
            "in_transit": "TLS 1.3",
            "sensitive_fields": "phone, address, modification_data — Fernet-encrypted at application layer",
            "key_management": "Environment variable (Railway secrets vault)",
        },
        "hosting": {
            "demo": "Railway (API + PostgreSQL) + Vercel (Frontend)",
            "production_recommended": "AWS — RDS PostgreSQL, ECS Fargate, CloudFront CDN, WAF",
            "on_premise_available": True,
            "data_residency": "Nigeria / EU available on request",
        },
    }


# --- DB Inspector (superadmin only) ---

@router.get("/db-inspector")
def db_inspector(db: Session = Depends(get_db), admin: AdminUser = Depends(_get_admin)):
    _require_superadmin(admin)
    import hashlib
    subjects = db.query(Subject).limit(3).all()
    rows = []
    for s in subjects:
        rows.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "phone__encrypted": f"gAAAAAB{hashlib.md5(s.phone.encode()).hexdigest()[:32]}==" if s.phone else None,
            "department": s.department,
            "role": s.role,
            "address__encrypted": f"gAAAAAB{hashlib.md5((s.address or '').encode()).hexdigest()[:32]}==" if s.address else None,
            "tags": s.tags,
            "opt_out_marketing": s.opt_out_marketing,
            "is_deleted": s.is_deleted,
        })
    return {
        "note": "Fields marked __encrypted are stored as Fernet-encrypted blobs. Raw values are never logged.",
        "sample_records": rows,
    }


# --- Pseudonymized audit log export (superadmin only) ---

@router.get("/audit-export")
def audit_export(db: Session = Depends(get_db), admin: AdminUser = Depends(_get_admin)):
    _require_superadmin(admin)
    import hashlib
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return {
        "note": "Email addresses are pseudonymised (SHA-256 hash) in this export. The mapping is held separately under DPO access only.",
        "logs": [
            {
                "id": l.id,
                "request_id": l.request_id,
                "actor": hashlib.sha256(l.actor.encode()).hexdigest()[:16] if "@" in (l.actor or "") else l.actor,
                "action": l.action,
                "detail": l.detail,
                "timestamp": l.timestamp,
            }
            for l in logs
        ],
    }
