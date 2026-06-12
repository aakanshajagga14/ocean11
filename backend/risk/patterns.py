from models import Vessel


def detect_anomaly_patterns(vessel: Vessel) -> list[dict]:
    """Rule-based anomaly pattern detection for Monitoring Agent context."""
    patterns: list[dict] = []

    if vessel.days_stationary >= 60:
        patterns.append(
            {
                "signal_type": "extended_stationary",
                "severity": "CRITICAL",
                "description": f"Vessel stationary for {vessel.days_stationary} days",
            }
        )
    elif vessel.days_stationary >= 30:
        patterns.append(
            {
                "signal_type": "prolonged_stationary",
                "severity": "HIGH",
                "description": f"Vessel stationary for {vessel.days_stationary} days",
            }
        )

    if vessel.ais_gap_hours >= 72:
        patterns.append(
            {
                "signal_type": "ais_dark",
                "severity": "CRITICAL",
                "description": f"AIS gap of {vessel.ais_gap_hours:.1f} hours",
            }
        )
    elif vessel.ais_gap_hours >= 24:
        patterns.append(
            {
                "signal_type": "ais_gap",
                "severity": "MEDIUM",
                "description": f"AIS gap of {vessel.ais_gap_hours:.1f} hours",
            }
        )

    if vessel.speed < 0.5 and vessel.days_stationary < 7:
        patterns.append(
            {
                "signal_type": "drifting",
                "severity": "LOW",
                "description": "Vessel drifting at near-zero speed",
            }
        )

    for factor in vessel.risk_factors:
        patterns.append(
            {
                "signal_type": factor,
                "severity": "HIGH" if factor in vessel.risk_factors[:2] else "MEDIUM",
                "description": f"Risk factor present: {factor}",
            }
        )

    return patterns
