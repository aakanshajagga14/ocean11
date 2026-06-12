from datetime import datetime
from typing import Literal, TypedDict

from pydantic import BaseModel, Field


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


class AgentEvent(BaseModel):
    event_id: str
    vessel_mmsi: str
    agent_name: Literal[
        "monitoring", "investigation", "risk", "compliance", "escalation"
    ]
    timestamp: datetime
    status: Literal["running", "complete", "error"]
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


class InvestigationStartResponse(BaseModel):
    investigation_id: str
    status: str = "started"


class VesselDetailResponse(BaseModel):
    vessel: Vessel
    agent_events: list[AgentEvent] = Field(default_factory=list)


class InvestigationState(TypedDict):
    investigation_id: str
    vessel: Vessel
    events: list[AgentEvent]
    evidence: list[str]
    anomaly_signals: list[dict]
    risk_assessment: dict
    compliance_findings: dict
    escalation_report: EscalationReport | None
    status: str
