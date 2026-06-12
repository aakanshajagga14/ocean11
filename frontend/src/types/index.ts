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
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_factors: string[];
  is_simulated: boolean;
  abandonment_confirmed: boolean;
}

export interface AgentEvent {
  event_id: string;
  vessel_mmsi: string;
  agent_name: 'monitoring' | 'investigation' | 'risk' | 'compliance' | 'escalation';
  timestamp: string;
  status: 'running' | 'complete' | 'error';
  input_summary: string;
  output_summary: string;
  reasoning: string;
  duration_ms: number;
}

export interface EscalationTarget {
  org: string;
  contact: string;
  priority: number;
  message: string;
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
  escalation_targets: EscalationTarget[];
  recommended_actions: string[];
  urgency_level: 'IMMEDIATE' | 'URGENT' | 'MONITOR' | 'NONE';
  no_action_reason: string | null;
  recheck_interval_hours: number | null;
}

export interface StatsResponse {
  total_monitored: number;
  high_risk_count: number;
  critical_count: number;
  investigations_today: number;
  reports_generated: number;
}

export type WsFeedMessage =
  | { type: 'vessel_update'; mmsi: string; fields: Partial<Vessel> }
  | { type: 'agent_event'; payload: AgentEvent }
  | { type: 'alert'; mmsi: string; risk_score: number; risk_level: string }
  | { type: 'report_ready'; mmsi: string; report_id: string };

export const RISK_COLORS: Record<Vessel['risk_level'], string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export const RISK_RGBA: Record<Vessel['risk_level'], [number, number, number, number]> = {
  LOW: [34, 197, 94, 180],
  MEDIUM: [234, 179, 8, 180],
  HIGH: [249, 115, 22, 180],
  CRITICAL: [239, 68, 68, 255],
};
