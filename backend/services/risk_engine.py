from models import RiskTier, RequestType


def assess_risk(
    request_type: RequestType,
    subject_has_special_category: bool,
    recent_request_count: int,
    academic_status: str = "active",
    has_legal_hold: bool = False,
    outstanding_balance: bool = False,
    is_research_participant: bool = False,
) -> tuple[RiskTier, str | None]:
    # Legal hold blocks ALL request types — cannot touch data under investigation
    if has_legal_hold:
        return (
            RiskTier.CRITICAL,
            "Active legal hold on this record. Data cannot be modified or deleted "
            "until the hold is lifted by the DPO or Legal team.",
        )

    # Expelled/suspended student requesting deletion — disciplinary records must be retained
    if academic_status in ("expelled", "suspended") and request_type == RequestType.DELETION:
        return (
            RiskTier.HIGH,
            f"Subject status is '{academic_status}'. Disciplinary records must be retained "
            "for appeals, legal proceedings, and institutional documentation. Deletion requires DPO approval.",
        )

    # Outstanding financial obligation — financial records legally required
    if outstanding_balance and request_type == RequestType.DELETION:
        return (
            RiskTier.HIGH,
            "Subject has an outstanding financial obligation. Financial records cannot be deleted "
            "while a balance exists. Requires Finance and DPO sign-off.",
        )

    # Research participant deletion — data may be in published datasets
    if is_research_participant and request_type == RequestType.DELETION:
        return (
            RiskTier.HIGH,
            "Subject is a research participant. Deletion may affect published or ongoing research datasets. "
            "Requires review by the Data Governance Committee.",
        )

    # Deceased subject — authority of requestor must be verified
    if academic_status == "deceased":
        return (
            RiskTier.HIGH,
            "Subject is recorded as deceased. Requestor authority (executor, next-of-kin) "
            "must be verified before any action is taken.",
        )

    # Volume abuse — 3+ requests in 7 days
    if recent_request_count >= 3:
        return (
            RiskTier.CRITICAL,
            f"Multiple recent requests from same identity ({recent_request_count} in last 7 days) "
            "— potential automated or coordinated attempt.",
        )

    # Special category data (health, biometric, etc.)
    if subject_has_special_category:
        return (
            RiskTier.HIGH,
            "Special category data detected (health/biometric information). "
            "Human review required before proceeding.",
        )

    if request_type == RequestType.DELETION:
        return (RiskTier.MEDIUM, None)

    return (RiskTier.LOW, None)


def requires_escalation(tier: RiskTier) -> bool:
    return tier in (RiskTier.HIGH, RiskTier.CRITICAL)
