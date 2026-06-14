import { apiFetch } from './client';
import { mapReport } from './mappers';
import type { EscalationReport } from '../types';

export async function getReport(mmsi: string): Promise<EscalationReport> {
  const raw = await apiFetch<Record<string, unknown>>(`/reports/${mmsi}`);
  return mapReport(raw);
}

export async function getAllReports(mmsiList: string[]): Promise<EscalationReport[]> {
  const results = await Promise.allSettled(mmsiList.map((mmsi) => getReport(mmsi)));
  return results
    .filter((r): r is PromiseFulfilledResult<EscalationReport> => r.status === 'fulfilled')
    .map((r) => r.value);
}
