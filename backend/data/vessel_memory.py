"""Persistent in-memory investigation history per vessel (Vessel Twin Memory)."""

from datetime import datetime

from models import EscalationReport, InvestigationMemoryEntry

_memory: dict[str, list[InvestigationMemoryEntry]] = {}


def record_investigation(
    mmsi: str,
    report: EscalationReport,
    risk_score: float,
) -> InvestigationMemoryEntry:
    if report.requires_escalation:
        outcome = "escalated"
    elif report.urgency_level == "MONITOR":
        outcome = "monitor"
    else:
        outcome = "no-action"

    findings = report.key_findings[:3] if report.key_findings else []
    if not report.requires_escalation and report.no_action_reason:
        summary = report.no_action_reason[:200]
    else:
        summary = "; ".join(findings) if findings else f"Risk score {risk_score:.0f}"

    entry = InvestigationMemoryEntry(
        timestamp=report.generated_at,
        risk_score_at_time=risk_score,
        requires_escalation=report.requires_escalation,
        key_findings_summary=summary,
        outcome=outcome,
    )
    _memory.setdefault(mmsi, []).append(entry)
    return entry


def get_history(mmsi: str) -> list[InvestigationMemoryEntry]:
    return list(_memory.get(mmsi, []))


def get_previous_summary(mmsi: str) -> str | None:
    history = _memory.get(mmsi, [])
    if not history:
        return None
    prev = history[-1]
    date_str = prev.timestamp.strftime("%Y-%m-%d")
    return (
        f"Investigated on {date_str}. Risk was {prev.risk_score_at_time:.0f}. "
        f"Outcome: {prev.outcome}. {prev.key_findings_summary}"
    )


def compute_risk_trend(mmsi: str, current_score: float) -> str:
    history = _memory.get(mmsi, [])
    if not history:
        return "FIRST_INVESTIGATION"
    prev_score = history[-1].risk_score_at_time
    delta = current_score - prev_score
    if delta >= 8:
        return "INCREASING"
    if delta <= -8:
        return "DECREASING"
    return "STABLE"
