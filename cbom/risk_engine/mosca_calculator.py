from cbom.models import MoscaInput, MoscaResult, RiskLevel


def calculate_mosca_risk(inp: MoscaInput) -> MoscaResult:
    """
    Evaluates Mosca's Theorem:
    x = shelf_life_years (time data must stay secure)
    y = migration_time_years (time to migrate infrastructure to PQC)
    z = qday_years (time until quantum computers break RSA/ECC)

    If (x + y) > z, system is at risk NOW.
    """
    total_required = inp.shelf_life_years + inp.migration_time_years
    urgency_gap = total_required - inp.qday_years
    threat_ratio = total_required / max(inp.qday_years, 0.1)

    is_at_risk = total_required > inp.qday_years

    if urgency_gap >= 5.0 or threat_ratio >= 1.5:
        risk_level = RiskLevel.CRITICAL
        recommendation = (
            "CRITICAL: Immediate action required. Data shelf life + migration timeline exceeds Q-Day by over 5 years. "
            "Implement hybrid PQC (Kyber/Dilithium) immediately for Store-Now-Decrypt-Later assets."
        )
    elif is_at_risk:
        risk_level = RiskLevel.HIGH
        recommendation = (
            "HIGH: Migration timeline exceeds Q-Day estimate. "
            "Prioritize inventorying high-value asymmetric key pairs (RSA/ECDSA) and plan PQC transition within 12 months."
        )
    elif (inp.qday_years - total_required) <= 3.0:
        risk_level = RiskLevel.MEDIUM
        recommendation = (
            "MEDIUM: Near margin. You have less than 3 years buffer before Q-Day risk threshold. "
            "Begin crypto-agility refactoring to prepare for NIST FIPS 203/204 standard adoption."
        )
    else:
        risk_level = RiskLevel.LOW
        recommendation = (
            "LOW: Current migration timeframe fits within expected Q-Day safety margin. "
            "Monitor PQC standardization and implement crypto-agility abstractions."
        )

    return MoscaResult(
        is_at_risk_now=is_at_risk,
        urgency_gap_years=round(urgency_gap, 2),
        threat_ratio=round(threat_ratio, 2),
        risk_level=risk_level,
        recommendation=recommendation
    )
