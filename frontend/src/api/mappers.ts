import type {
  AgentEvent,
  Alert,
  ApiAgentEventRaw,
  ApiStatsRaw,
  ApiVesselRaw,
  EscalationReport,
  Stats,
  Vessel,
} from '../types';

export function mapVessel(raw: ApiVesselRaw, routeHistory: Vessel['route_history'] = []): Vessel {
  const level = (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).includes(
    raw.risk_level as Vessel['risk_level'],
  )
    ? (raw.risk_level as Vessel['risk_level'])
    : 'LOW';

  return {
    mmsi: raw.mmsi,
    name: raw.name,
    flag_state: raw.flag_state,
    vessel_type: raw.vessel_type,
    owner: raw.owner,
    operator: raw.operator ?? '',
    latitude: raw.latitude,
    longitude: raw.longitude,
    speed: raw.speed,
    heading: raw.heading,
    last_port: raw.last_port,
    destination: raw.destination,
    days_stationary: raw.days_stationary,
    last_ais_signal: raw.last_ais_signal,
    ais_gap_hours: raw.ais_gap_hours,
    risk_score: raw.risk_score,
    risk_score_confidence: raw.risk_score_confidence ?? 1,
    risk_score_range: {
      low: raw.risk_score_low ?? raw.risk_score,
      high: raw.risk_score_high ?? raw.risk_score,
    },
    risk_level: level,
    risk_factors: raw.risk_factors ?? [],
    risk_trend: 'STABLE',
    is_simulated: raw.is_simulated,
    abandonment_confirmed: raw.abandonment_confirmed,
    route_history: routeHistory,
  };
}

export function mapAgentEvent(raw: ApiAgentEventRaw): AgentEvent {
  return {
    ...raw,
    status: raw.status === 'timeout' ? 'timeout' : raw.status,
  };
}

export function mapStats(raw: ApiStatsRaw, investigationsActive: number): Stats {
  return {
    total_monitored: raw.total_monitored,
    high_risk_count: raw.high_risk_count,
    critical_count: raw.critical_count,
    active_alerts: raw.pattern_flagged_count ?? raw.high_risk_count + raw.critical_count,
    investigations_active: investigationsActive,
    investigations_completed_today: raw.investigations_today,
    avg_pipeline_time_seconds: 0,
    escalations_generated: raw.reports_generated,
  };
}

export function vesselToAlert(v: Vessel): Alert {
  const types: string[] = [];
  if (v.days_stationary >= 14) types.push('STATIONARY');
  if (v.ais_gap_hours >= 24) types.push('AIS DARK');
  if (v.risk_factors.some((f) => f.toLowerCase().includes('owner'))) types.push('OWNER DISPUTE');
  if (types.length === 0 && v.risk_score >= 50) types.push('ELEVATED RISK');

  return {
    alert_id: `alert-${v.mmsi}`,
    vessel_mmsi: v.mmsi,
    vessel_name: v.name,
    vessel_type: v.vessel_type,
    alert_types: types.length ? types : ['ELEVATED RISK'],
    description: buildAlertDescription(v),
    timestamp: v.last_ais_signal,
    risk_score: v.risk_score,
    risk_level: v.risk_level,
    dismissed: false,
  };
}

function buildAlertDescription(v: Vessel): string {
  const parts: string[] = [];
  if (v.days_stationary >= 14) parts.push(`Stationary for ${v.days_stationary} days`);
  if (v.ais_gap_hours >= 24) parts.push(`AIS gap ${v.ais_gap_hours.toFixed(0)}h`);
  if (v.risk_factors.length) parts.push(v.risk_factors.slice(0, 2).join('; '));
  return parts.join('. ') || `Risk score ${Math.round(v.risk_score)}/100`;
}

export function mapReport(raw: Record<string, unknown>): EscalationReport {
  const targets = (raw.escalation_targets as Array<Record<string, unknown>>) ?? [];
  return {
    report_id: String(raw.report_id),
    vessel_mmsi: String(raw.vessel_mmsi),
    vessel_name: String(raw.vessel_name),
    generated_at: String(raw.generated_at),
    risk_score: Number(raw.risk_score),
    requires_escalation: Boolean(raw.requires_escalation),
    estimated_crew_size: Number(raw.estimated_crew_size ?? 0),
    crew_nationalities: (raw.crew_nationalities as string[]) ?? [],
    days_abandoned: Number(raw.days_abandoned ?? 0),
    estimated_unpaid_wages_usd: Number(raw.estimated_unpaid_wages_usd ?? 0),
    key_findings: (raw.key_findings as string[]) ?? [],
    timeline_of_events: (raw.timeline_of_events as string[]) ?? [],
    applicable_conventions: (raw.applicable_conventions as string[]) ?? [],
    flag_state_obligations: String(raw.flag_state_obligations ?? ''),
    port_state_options: String(raw.port_state_options ?? ''),
    escalation_targets: targets.map((t) => ({
      org: String(t.org ?? ''),
      contact: String(t.contact ?? ''),
      priority: String(t.priority ?? '1'),
      message: String(t.message ?? ''),
    })),
    recommended_actions: (raw.recommended_actions as string[]) ?? [],
    urgency_level: (raw.urgency_level as EscalationReport['urgency_level']) ?? 'NONE',
    no_action_reason: (raw.no_action_reason as string | null) ?? null,
    recheck_interval_hours: (raw.recheck_interval_hours as number | null) ?? null,
  };
}
