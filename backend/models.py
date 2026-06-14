from datetime import datetime
from typing import Literal, TypedDict

from pydantic import BaseModel, Field


class RiskFactorDetail(BaseModel):
    factor: str
    label: str
    weight: int
    applies: bool = True


class Vessel(BaseModel):
    mmsi: str
    name: str
    flag_state: str
    vessel_type: str
    owner: str
    operator: str
    latitude: float
    longitude: float
    speed: float
    heading: float
    last_port: str
    destination: str
    days_stationary: int
    last_ais_signal: datetime
    ais_gap_hours: float
    risk_score: float
    risk_level: str
    risk_factors: list[str]
    is_simulated: bool = False
    abandonment_confirmed: bool = False
    risk_score_confidence: float = 1.0
    risk_score_low: float = 0.0
    risk_score_high: float = 100.0
    risk_factor_breakdown: list[RiskFactorDetail] = Field(default_factory=list)
    position_count: int = 0


class AgentEvent(BaseModel):
    event_id: str
    vessel_mmsi: str
    agent_name: Literal[
        "monitoring", "investigation", "risk", "compliance", "escalation"
    ]
    timestamp: datetime
    status: Literal["running", "complete", "error", "timeout"]
    input_summary: str
    output_summary: str
    reasoning: str
    duration_ms: int


class EscalationReport(BaseModel):
    report_id: str
    vessel_mmsi: str
    vessel_name: str
    generated_at: datetime
    risk_score: float
    requires_escalation: bool
    estimated_crew_size: int
    crew_nationalities: list[str]
    days_abandoned: int
    estimated_unpaid_wages_usd: float
    key_findings: list[str]
    timeline_of_events: list[str]
    applicable_conventions: list[str]
    flag_state_obligations: str
    port_state_options: str
    escalation_targets: list[dict]
    recommended_actions: list[str]
    urgency_level: Literal["IMMEDIATE", "URGENT", "MONITOR", "NONE"]
    no_action_reason: str | None = None
    recheck_interval_hours: int | None = None


class StatsResponse(BaseModel):
    total_monitored: int
    high_risk_count: int
    critical_count: int
    investigations_today: int
    reports_generated: int
    real_vessels_live: int = 0
    pattern_flagged_count: int = 0


class InvestigationStartResponse(BaseModel):
    investigation_id: str
    status: str = "started"


class VesselDetailResponse(BaseModel):
    vessel: Vessel
    agent_events: list[AgentEvent] = Field(default_factory=list)


class InvestigationMemoryEntry(BaseModel):
    timestamp: datetime
    risk_score_at_time: float
    requires_escalation: bool
    key_findings_summary: str
    outcome: Literal["escalated", "no-action", "monitor"]


class FleetSignal(BaseModel):
    owner: str
    vessel_count: int
    vessels_with_ais_gaps_24h: int
    vessels_stationary_30d_plus: int
    fleet_pattern_score: float
    affected_vessels: list[str]
    summary: str


class FlagStateRisk(BaseModel):
    flag_state: str
    abandonment_rate_per_1000_vessels: float
    risk_tier: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    vessel_count_global: int


class InvestigationState(TypedDict, total=False):
    investigation_id: str
    vessel: Vessel
    events: list[AgentEvent]
    evidence: list[str]
    anomaly_signals: list[dict]
    risk_assessment: dict
    compliance_findings: dict
    escalation_report: EscalationReport | None
    status: str
    previous_investigation_summary: str | None
    risk_trend: str | None
