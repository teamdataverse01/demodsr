from models import RiskTier, RequestType


def assess_risk(
    request_type: RequestType,
    subject_has_special_category: bool,
    recent_request_count: int,  # requests from same email in last 7 days
) -> tuple[RiskTier, str | None]:
    """
    Deterministic risk engine — no AI involved.
    Returns (RiskTier, escalation_reason_or_None).
    """
    if recent_request_count >= 3:
        return (
            RiskTier.CRITICAL,
            f"Multiple recent requests from same identity ({recent_request_count} in last 7 days) "
            "— potential automated or coordinated attempt.",
        )

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
