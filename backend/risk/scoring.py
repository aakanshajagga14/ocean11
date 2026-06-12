import asyncio
from datetime import datetime, timedelta

from config import COOLDOWN_SECONDS, PIPELINE_THRESHOLD, RISK_FACTORS
from data.vessel_registry import HIGH_RISK_FLAG_STATES, VesselRegistry
from models import Vessel


def _in_risk_region(latitude: float, longitude: float, registry: VesselRegistry) -> bool:
    return registry.in_risk_region(latitude, longitude)


def compute_risk_score(
    vessel: Vessel, registry: VesselRegistry
) -> tuple[float, list[str], str]:
    score = 0
    factors: list[str] = []

    if vessel.days_stationary >= 60:
        score += RISK_FACTORS["days_stationary_60_plus"]
        factors.append("days_stationary_60_plus")
    elif vessel.days_stationary >= 30:
        score += RISK_FACTORS["days_stationary_30_plus"]
        factors.append("days_stationary_30_plus")

    if vessel.ais_gap_hours >= 72:
        score += RISK_FACTORS["ais_gap_72h"]
        factors.append("ais_gap_72h")
    elif vessel.ais_gap_hours >= 24:
        score += RISK_FACTORS["ais_gap_24h"]
        factors.append("ais_gap_24h")

    if vessel.flag_state in HIGH_RISK_FLAG_STATES:
        score += RISK_FACTORS["flag_state_high_risk"]
        factors.append("flag_state_high_risk")

    enrichment = registry.get_enrichment(vessel.mmsi)
    if enrichment.owner_dispute_history:
        score += RISK_FACTORS["owner_dispute_history"]
        factors.append("owner_dispute_history")
    if enrichment.prior_itf_incident:
        score += RISK_FACTORS["prior_itf_incident"]
        factors.append("prior_itf_incident")
    if enrichment.no_recent_port_call:
        score += RISK_FACTORS["no_recent_port_call"]
        factors.append("no_recent_port_call")
    if enrichment.crew_complaint_filed:
        score += RISK_FACTORS["crew_complaint_filed"]
        factors.append("crew_complaint_filed")
    if enrichment.insurance_lapsed:
        score += RISK_FACTORS["insurance_lapsed"]
        factors.append("insurance_lapsed")

    if _in_risk_region(vessel.latitude, vessel.longitude, registry):
        score += registry.region_boost()
        factors.append("risk_region_boost")

    score = min(score, 100)

    if score >= 80:
        level = "CRITICAL"
    elif score >= 60:
        level = "HIGH"
    elif score >= 30:
        level = "MEDIUM"
    else:
        level = "LOW"

    return score, factors, level  # type: ignore[return-value]


def risk_level_from_score(score: float) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


def update_vessel_risk(vessel: Vessel, registry: VesselRegistry) -> Vessel:
    score, factors, level = compute_risk_score(vessel, registry)  # type: ignore[misc]
    vessel.risk_score = score
    vessel.risk_factors = factors
    vessel.risk_level = level
    return vessel


class PipelineCoordinator:
    def __init__(self) -> None:
        self.active_run: str | None = None
        self.active_investigation_id: str | None = None
        self.cooldowns: dict[str, datetime] = {}
        self._lock = asyncio.Lock()

    async def maybe_trigger(self, vessel: Vessel) -> bool:
        async with self._lock:
            if vessel.risk_score < PIPELINE_THRESHOLD:
                return False
            if self.active_run is not None:
                return False
            cooldown_expires = self.cooldowns.get(vessel.mmsi)
            if cooldown_expires and datetime.utcnow() < cooldown_expires:
                return False
            self.active_run = vessel.mmsi
            return True

    async def acquire_manual(self, mmsi: str) -> bool:
        async with self._lock:
            if self.active_run is not None:
                return False
            self.active_run = mmsi
            return True

    async def set_investigation_id(self, investigation_id: str) -> None:
        async with self._lock:
            self.active_investigation_id = investigation_id

    async def on_run_complete(self, mmsi: str) -> None:
        async with self._lock:
            self.active_run = None
            self.active_investigation_id = None
            self.cooldowns[mmsi] = datetime.utcnow() + timedelta(seconds=COOLDOWN_SECONDS)

    async def is_busy(self) -> bool:
        async with self._lock:
            return self.active_run is not None


coordinator = PipelineCoordinator()
