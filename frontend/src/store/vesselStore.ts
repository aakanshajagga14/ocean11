import { create } from 'zustand';
import type { Vessel } from '../types';

interface VesselStore {
  vessels: Map<string, Vessel>;
  vesselRevision: number;
  selectedVessel: Vessel | null;
  pingFlash: Map<string, number>;
  showFlagLayer: boolean;
  showTrailLayer: boolean;

  updateVessels: (diffs: Vessel[]) => void;
  setVesselSnapshot: (vessels: Vessel[]) => void;
  selectVessel: (mmsi: string) => void;
  clearSelection: () => void;
  flashPing: (mmsi: string) => void;
  setRouteHistory: (mmsi: string, history: Vessel['route_history']) => void;
  toggleFlagLayer: () => void;
  toggleTrailLayer: () => void;
}

export const useVesselStore = create<VesselStore>((set, get) => ({
  vessels: new Map(),
  vesselRevision: 0,
  selectedVessel: null,
  pingFlash: new Map(),
  showFlagLayer: false,
  showTrailLayer: true,

  updateVessels: (diffs) =>
    set((state) => {
      if (!diffs.length) return state;
      const vessels = new Map(state.vessels);
      for (const v of diffs) {
        const existing = vessels.get(v.mmsi);
        vessels.set(v.mmsi, existing ? { ...existing, ...v } : v);
      }
      const selected = state.selectedVessel
        ? vessels.get(state.selectedVessel.mmsi) ?? null
        : null;
      return { vessels, vesselRevision: state.vesselRevision + 1, selectedVessel: selected };
    }),

  setVesselSnapshot: (vesselList) =>
    set(() => {
      const vessels = new Map<string, Vessel>();
      vesselList.forEach((v) => vessels.set(v.mmsi, v));
      return { vessels, vesselRevision: 1, selectedVessel: null };
    }),

  selectVessel: (mmsi) => {
    const vessel = get().vessels.get(mmsi) ?? null;
    set({ selectedVessel: vessel });
  },

  clearSelection: () => set({ selectedVessel: null }),

  flashPing: (mmsi) =>
    set((state) => {
      const pingFlash = new Map(state.pingFlash);
      pingFlash.set(mmsi, Date.now());
      return { pingFlash };
    }),

  setRouteHistory: (mmsi, history) =>
    set((state) => {
      const vessels = new Map(state.vessels);
      const v = vessels.get(mmsi);
      if (v) vessels.set(mmsi, { ...v, route_history: history });
      const selectedVessel =
        state.selectedVessel?.mmsi === mmsi && v
          ? { ...v, route_history: history }
          : state.selectedVessel;
      return { vessels, selectedVessel, vesselRevision: state.vesselRevision + 1 };
    }),

  toggleFlagLayer: () => set((s) => ({ showFlagLayer: !s.showFlagLayer })),
  toggleTrailLayer: () => set((s) => ({ showTrailLayer: !s.showTrailLayer })),
}));
