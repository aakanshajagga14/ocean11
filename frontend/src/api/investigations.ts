import { apiFetch } from './client';
import { mapAgentEvent } from './mappers';
import type { AgentEvent, ApiAgentEventRaw, Investigation } from '../types';

interface InvestigationStartResponse {
  investigation_id: string;
  status: string;
}

interface InvestigationStateRaw {
  investigation_id?: string;
  status?: string;
  vessel?: { mmsi: string; name: string; risk_score?: number };
  events?: ApiAgentEventRaw[];
  escalation_report?: Record<string, unknown>;
}

export async function triggerInvestigation(mmsi: string): Promise<string> {
  const res = await apiFetch<InvestigationStartResponse>(`/vessels/${mmsi}/investigate`, {
    method: 'POST',
  });
  return res.investigation_id;
}

export async function getInvestigation(id: string): Promise<Investigation> {
  const raw = await apiFetch<InvestigationStateRaw>(`/investigations/${id}`);
  const events = (raw.events ?? []).map(mapAgentEvent);
  const lastRunning = [...events].reverse().find((e) => e.status === 'running');

  return {
    investigation_id: id,
    vessel_mmsi: raw.vessel?.mmsi ?? '',
    vessel_name: raw.vessel?.name ?? '',
    started_at: events[0]?.timestamp ?? new Date().toISOString(),
    completed_at: raw.status === 'complete' ? new Date().toISOString() : null,
    status: raw.status === 'complete' ? 'complete' : raw.status === 'error' ? 'failed' : 'running',
    current_agent: lastRunning?.agent_name ?? null,
    events,
    risk_score_so_far: raw.vessel?.risk_score ?? null,
  };
}

export async function getAllInvestigations(ids: string[]): Promise<Investigation[]> {
  const results = await Promise.allSettled(ids.map((id) => getInvestigation(id)));
  return results
    .filter((r): r is PromiseFulfilledResult<Investigation> => r.status === 'fulfilled')
    .map((r) => r.value);
}

export function eventsForVessel(events: AgentEvent[], mmsi: string): AgentEvent[] {
  return events.filter((e) => e.vessel_mmsi === mmsi);
}
