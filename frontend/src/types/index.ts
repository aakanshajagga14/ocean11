export interface Vessel {
  mmsi: string;
  name: string;
  flag_state: string;
  vessel_type: string;
  owner: string;
  operator: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  last_port: string;
  destination: string;
  days_stationary: number;
  last_ais_signal: string;
  ais_gap_hours: number;
  risk_score: number;
  risk_score_confidence: number;
  risk_score_range: { low: number; high: number };
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_factors: string[];
  risk_trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'FIRST_INVESTIGATION';
  is_simulated: boolean;
  abandonment_confirmed: boolean;
  route_history: Array<{ latitude: number; longitude: number; timestamp: string }>;
}

export interface AgentEvent {
  event_id: string;
  vessel_mmsi: string;
  agent_name: 'monitoring' | 'investigation' | 'risk' | 'compliance' | 'escalation';
  timestamp: string;
  status: 'pending' | 'running' | 'complete' | 'timeout' | 'error';
  input_summary: string;
  output_summary: string;
  reasoning: string;
  duration_ms: number;
}

export interface Investigation {
  investigation_id: string;
  vessel_mmsi: string;
  vessel_name: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'complete' | 'failed';
  current_agent: string | null;
  events: AgentEvent[];
  risk_score_so_far: number | null;
}

export interface EscalationReport {
  report_id: string;
  vessel_mmsi: string;
  vessel_name: string;
  generated_at: string;
  risk_score: number;
  requires_escalation: boolean;
  estimated_crew_size: number;
  crew_nationalities: string[];
  days_abandoned: number;
  estimated_unpaid_wages_usd: number;
  key_findings: string[];
  timeline_of_events: string[];
  applicable_conventions: string[];
  flag_state_obligations: string;
  port_state_options: string;
  escalation_targets: Array<{
    org: string;
    contact: string;
    priority: string;
    message: string;
  }>;
  recommended_actions: string[];
  urgency_level: 'IMMEDIATE' | 'URGENT' | 'MONITOR' | 'NONE';
  no_action_reason: string | null;
  recheck_interval_hours: number | null;
}

export interface Alert {
  alert_id: string;
  vessel_mmsi: string;
  vessel_name: string;
  vessel_type: string;
  alert_types: string[];
  description: string;
  timestamp: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dismissed: boolean;
}

export interface Stats {
  total_monitored: number;
  high_risk_count: number;
  critical_count: number;
  active_alerts: number;
  investigations_active: number;
  investigations_completed_today: number;
  avg_pipeline_time_seconds: number;
  escalations_generated: number;
}

export type WebSocketMessage =
  | { type: 'vessel_update'; data: Vessel[] }
  | { type: 'agent_event'; data: AgentEvent }
  | { type: 'alert'; data: Alert }
  | { type: 'stats_update'; data: Stats }
  | { type: 'report_ready'; data: EscalationReport }
  | {
      type: 'fleet_alert';
      data: {
        owner: string;
        fleet_pattern_score: number;
        affected_vessels: string[];
        summary: string;
      };
    };

export type InvestigateButtonState = 'idle' | 'loading' | 'running' | 'done' | 'error';

export const RISK_RGBA: Record<Vessel['risk_level'], [number, number, number, number]> = {
  LOW: [34, 197, 94, 180],
  MEDIUM: [234, 179, 8, 180],
  HIGH: [249, 115, 22, 180],
  CRITICAL: [239, 68, 68, 255],
};

export interface ApiVesselRaw {
  mmsi: string;
  name: string;
  flag_state: string;
  vessel_type: string;
  owner: string;
  operator: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  last_port: string;
  destination: string;
  days_stationary: number;
  last_ais_signal: string;
  ais_gap_hours: number;
  risk_score: number;
  risk_level: string;
  risk_factors: string[];
  is_simulated: boolean;
  abandonment_confirmed: boolean;
  risk_score_confidence?: number;
  risk_score_low?: number;
  risk_score_high?: number;
}

export interface ApiStatsRaw {
  total_monitored: number;
  high_risk_count: number;
  critical_count: number;
  investigations_today: number;
  reports_generated: number;
  real_vessels_live?: number;
  pattern_flagged_count?: number;
}

export interface ApiAgentEventRaw {
  event_id: string;
  vessel_mmsi: string;
  agent_name: AgentEvent['agent_name'];
  timestamp: string;
  status: 'running' | 'complete' | 'error' | 'timeout';
  input_summary: string;
  output_summary: string;
  reasoning: string;
  duration_ms: number;
}

export interface InvestigationMemoryEntry {
  timestamp: string;
  risk_score_at_time: number;
  requires_escalation: boolean;
  key_findings_summary: string;
  outcome: 'escalated' | 'no-action' | 'monitor';
}
