import asyncio
from datetime import datetime, timedelta

from config import COOLDOWN_SECONDS, PIPELINE_THRESHOLD, RISK_FACTORS
from data.vessel_registry import HIGH_RISK_FLAG_STATES, VesselRegistry
from models import RiskFactorDetail, Vessel

FACTOR_LABELS: dict[str, str] = {
    "days_stationary_30_plus": "Stationary 30+ days",
    "days_stationary_60_plus": "Stationary 60+ days",
    "ais_gap_24h": "AIS gap 24h+",
    "ais_gap_72h": "AIS gap 72h+",
    "flag_state_high_risk": "High-risk flag state",
    "owner_dispute_history": "Owner dispute history",
    "prior_itf_incident": "Prior ITF incident",
    "no_recent_port_call": "No recent port call",
    "crew_complaint_filed": "Crew complaint filed",
    "insurance_lapsed": "Insurance lapsed",
    "risk_region_boost": "Risk region boost",
}


def _in_risk_region(latitude: float, longitude: float, registry: VesselRegistry) -> bool:
    return registry.in_risk_region(latitude, longitude)


def compute_factor_breakdown(
    vessel: Vessel, registry: VesselRegistry
) -> tuple[list[str], list[RiskFactorDetail], int]:
    factors: list[str] = []
    breakdown: list[RiskFactorDetail] = []
    score = 0

    if vessel.days_stationary >= 60:
        w = RISK_FACTORS["days_stationary_60_plus"]
        factors.append("days_stationary_60_plus")
        breakdown.append(
            RiskFactorDetail(
                factor="days_stationary_60_plus",
                label=f"Stationary {vessel.days_stationary} days",
                weight=w,
            )
        )
        score += w
    elif vessel.days_stationary >= 30:
        w = RISK_FACTORS["days_stationary_30_plus"]
        factors.append("days_stationary_30_plus")
        breakdown.append(
            RiskFactorDetail(
                factor="days_stationary_30_plus",
                label=f"Stationary {vessel.days_stationary} days",
                weight=w,
            )
        )
        score += w

    if vessel.ais_gap_hours >= 72:
        w = RISK_FACTORS["ais_gap_72h"]
        factors.append("ais_gap_72h")
        breakdown.append(
            RiskFactorDetail(
                factor="ais_gap_72h",
                label=f"AIS gap {vessel.ais_gap_hours:.0f}h",
                weight=w,
            )
        )
        score += w
    elif vessel.ais_gap_hours >= 24:
        w = RISK_FACTORS["ais_gap_24h"]
        factors.append("ais_gap_24h")
        breakdown.append(
            RiskFactorDetail(
                factor="ais_gap_24h",
                label=f"AIS gap {vessel.ais_gap_hours:.0f}h",
                weight=w,
            )
        )
        score += w

    if vessel.flag_state in HIGH_RISK_FLAG_STATES:
        w = RISK_FACTORS["flag_state_high_risk"]
        factors.append("flag_state_high_risk")
        breakdown.append(
            RiskFactorDetail(
                factor="flag_state_high_risk",
                label=f"Flag: {vessel.flag_state}",
                weight=w,
            )
        )
        score += w

    enrichment = registry.get_enrichment(vessel.mmsi)
    enrichment_map = [
        ("owner_dispute_history", enrichment.owner_dispute_history),
        ("prior_itf_incident", enrichment.prior_itf_incident),
        ("no_recent_port_call", enrichment.no_recent_port_call),
        ("crew_complaint_filed", enrichment.crew_complaint_filed),
        ("insurance_lapsed", enrichment.insurance_lapsed),
    ]
    for key, applies in enrichment_map:
        if applies:
            w = RISK_FACTORS[key]
            factors.append(key)
            breakdown.append(
                RiskFactorDetail(
                    factor=key,
                    label=FACTOR_LABELS[key],
                    weight=w,
                )
            )
            score += w

    if _in_risk_region(vessel.latitude, vessel.longitude, registry):
        w = registry.region_boost()
        factors.append("risk_region_boost")
        breakdown.append(
            RiskFactorDetail(
                factor="risk_region_boost",
                label="Operating in priority risk region",
                weight=w,
            )
        )
        score += w

    return factors, breakdown, min(score, 100)


def compute_risk_score(
    vessel: Vessel, registry: VesselRegistry
) -> tuple[float, list[str], str]:
    factors, _, score = compute_factor_breakdown(vessel, registry)
    level = risk_level_from_score(score)
    return float(score), factors, level


def compute_risk_confidence(vessel: Vessel, registry: VesselRegistry) -> float:
    """0.0–1.0 based on data completeness."""
    confidence = 0.35

    gap_hours = vessel.ais_gap_hours
    if gap_hours < 1:
        confidence += 0.25
    elif gap_hours < 6:
        confidence += 0.15
    elif gap_hours < 24:
        confidence += 0.08
    elif gap_hours >= 48:
        confidence -= 0.15

    positions = vessel.position_count
    if positions >= 8:
        confidence += 0.2
    elif positions >= 4:
        confidence += 0.12
    elif positions >= 2:
        confidence += 0.06

    if vessel.owner and vessel.owner not in ("Unknown", ""):
        confidence += 0.08
    if vessel.flag_state and vessel.flag_state not in ("Unknown", ""):
        confidence += 0.05

    enrichment = registry.get_enrichment(vessel.mmsi)
    if (
        enrichment.prior_itf_incident
        or enrichment.owner_dispute_history
        or enrichment.crew_complaint_filed
    ):
        confidence += 0.07

    return round(max(0.1, min(1.0, confidence)), 2)


def compute_risk_range(score: float, confidence: float) -> tuple[float, float]:
    half_width = (1 - confidence) * 40
    low = max(0.0, score - half_width)
    high = min(100.0, score + half_width)
    return round(low, 1), round(high, 1)


def risk_level_from_score(score: float) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


def count_pattern_flagged(vessels: dict[str, Vessel]) -> int:
    return sum(
        1
        for v in vessels.values()
        if v.risk_score >= 30 or len(v.risk_factors) > 0
    )


def update_vessel_risk(
    vessel: Vessel,
    registry: VesselRegistry,
    position_count: int | None = None,
) -> Vessel:
    if position_count is not None:
        vessel.position_count = position_count
    score, factors, level = compute_risk_score(vessel, registry)
    _, breakdown, _ = compute_factor_breakdown(vessel, registry)
    confidence = compute_risk_confidence(vessel, registry)
    low, high = compute_risk_range(score, confidence)

    vessel.risk_score = score
    vessel.risk_factors = factors
    vessel.risk_level = level
    vessel.risk_score_confidence = confidence
    vessel.risk_score_low = low
    vessel.risk_score_high = high
    vessel.risk_factor_breakdown = breakdown
    return vessel


class PipelineCoordinator:
    def __init__(self) -> None:
        self.active_runs: set[str] = set()
        self.active_investigation_ids: dict[str, str] = {}
        self.cooldowns: dict[str, datetime] = {}
        self._lock = asyncio.Lock()

    async def maybe_trigger(self, vessel: Vessel) -> bool:
        async with self._lock:
            if vessel.risk_score < PIPELINE_THRESHOLD:
                return False
            if vessel.mmsi in self.active_runs:
                return False
            cooldown_expires = self.cooldowns.get(vessel.mmsi)
            if cooldown_expires and datetime.utcnow() < cooldown_expires:
                return False
            self.active_runs.add(vessel.mmsi)
            return True

    async def acquire_manual(self, mmsi: str) -> bool:
        async with self._lock:
            if mmsi in self.active_runs:
                return False
            self.active_runs.add(mmsi)
            return True

    async def set_investigation_id(self, mmsi: str, investigation_id: str) -> None:
        async with self._lock:
            self.active_investigation_ids[mmsi] = investigation_id

    async def on_run_complete(self, mmsi: str) -> None:
        async with self._lock:
            self.active_runs.discard(mmsi)
            self.active_investigation_ids.pop(mmsi, None)
            self.cooldowns[mmsi] = datetime.utcnow() + timedelta(seconds=COOLDOWN_SECONDS)

    async def is_busy(self) -> bool:
        async with self._lock:
            return len(self.active_runs) > 0

    async def is_vessel_busy(self, mmsi: str) -> bool:
        async with self._lock:
            return mmsi in self.active_runs


coordinator = PipelineCoordinator()
