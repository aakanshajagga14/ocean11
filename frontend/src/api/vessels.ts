import { apiFetch } from './client';
import { mapVessel } from './mappers';
import type { ApiVesselRaw, InvestigationMemoryEntry, Vessel } from '../types';

export async function getVesselSnapshot(): Promise<Vessel[]> {
  const raw = await apiFetch<ApiVesselRaw[]>('/vessels/snapshot');
  return raw.map((v) => mapVessel(v));
}

export async function getVessels(limit = 500): Promise<Vessel[]> {
  const raw = await apiFetch<ApiVesselRaw[]>(`/vessels?limit=${limit}`);
  return raw.map((v) => mapVessel(v));
}

export async function getVessel(mmsi: string): Promise<Vessel> {
  const res = await apiFetch<{ vessel: ApiVesselRaw }>(`/vessels/${mmsi}`);
  return mapVessel(res.vessel);
}

export async function getVesselHistory(mmsi: string): Promise<InvestigationMemoryEntry[]> {
  return apiFetch<InvestigationMemoryEntry[]>(`/vessels/${mmsi}/history`);
}

export async function getVesselTrail(
  mmsi: string,
): Promise<Array<{ latitude: number; longitude: number; timestamp: string }>> {
  const res = await apiFetch<{ positions: [number, number][] }>(`/vessels/${mmsi}/trail`);
  return (res.positions ?? []).map(([longitude, latitude], i) => ({
    latitude,
    longitude,
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
  }));
}
