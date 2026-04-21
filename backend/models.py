from sqlalchemy import Column, String, Integer, DateTime, Text, Boolean, Enum as SAEnum
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime, timezone
import enum


class Base(DeclarativeBase):
    pass


class RiskTier(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RequestType(str, enum.Enum):
    ACCESS = "access"
    DELETION = "deletion"
    MODIFICATION = "modification"
    STOP_PROCESSING = "stop_processing"


class RequestStatus(str, enum.Enum):
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    IN_PROGRESS = "in_progress"
    ESCALATED = "escalated"
    COMPLETED = "completed"
    REJECTED = "rejected"


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    phone = Column(String(50))
    department = Column(String(200))
    role = Column(String(100))           # student / staff / faculty / alumni
    reg_number = Column(String(100))
    address = Column(Text)
    enrolment_date = Column(String(50))
    tags = Column(String(500), default="")    # comma-separated
    opt_out_marketing = Column(Boolean, default=False)
    stop_processing = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    special_category = Column(Boolean, default=False)  # health/biometric data flag


class DSRRequest(Base):
    __tablename__ = "dsr_requests"

    id = Column(Integer, primary_key=True)
    subject_email = Column(String(200), nullable=False)
    subject_name = Column(String(200), nullable=False)
    request_type = Column(SAEnum(RequestType), nullable=False)
    description = Column(Text)
    status = Column(SAEnum(RequestStatus), default=RequestStatus.PENDING_VERIFICATION)
    risk_tier = Column(SAEnum(RiskTier))
    escalation_reason = Column(Text)
    otp = Column(String(10))
    otp_verified = Column(Boolean, default=False)
    otp_expires_at = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime)
    ai_draft = Column(Text)
    admin_notes = Column(Text)
    processed_by = Column(String(200))
    modification_data = Column(Text)   # JSON string for modification requests


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    request_id = Column(Integer, nullable=False)
    actor = Column(String(200))         # email or "system"
    action = Column(String(200), nullable=False)
    detail = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True)
    email = Column(String(200), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    role = Column(String(100), nullable=False)   # superadmin / admin
    password_hash = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True)
