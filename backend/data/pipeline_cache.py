"""Pipeline result cache — skip Gemini if investigated recently with same anomalies."""

from datetime import datetime, timedelta

from models import EscalationReport, Vessel

CACHE_TTL_SECONDS = 3600
_cache: dict[str, dict] = {}


def anomaly_fingerprint(vessel: Vessel) -> str:
    factors = ",".join(sorted(vessel.risk_factors))
    return f"{factors}|{vessel.days_stationary}|{vessel.ais_gap_hours:.1f}|{int(vessel.risk_score)}"


def get_cached_report(mmsi: str, vessel: Vessel) -> EscalationReport | None:
    entry = _cache.get(mmsi)
    if not entry:
        return None
    if datetime.utcnow() - entry["cached_at"] > timedelta(seconds=CACHE_TTL_SECONDS):
        return None
    if entry["fingerprint"] != anomaly_fingerprint(vessel):
        return None
    return entry["report"]


def store_cached_report(mmsi: str, vessel: Vessel, report: EscalationReport) -> None:
    _cache[mmsi] = {
        "report": report,
        "cached_at": datetime.utcnow(),
        "fingerprint": anomaly_fingerprint(vessel),
    }
