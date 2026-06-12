import { create } from 'zustand';
import type { AgentEvent, EscalationReport, StatsResponse, Vessel } from '../types';

interface VesselStore {
  vessels: Record<string, Vessel>;
  selectedMmsi: string | null;
  activeInvestigation: { mmsi: string; investigation_id: string } | null;
  latestReports: Record<string, EscalationReport>;
  agentEvents: Record<string, AgentEvent[]>;
  stats: StatsResponse;
  wsConnected: boolean;
  vesselTrails: Record<string, [number, number][]>;

  setSelectedMmsi: (mmsi: string | null) => void;
  upsertVessel: (vessel: Partial<Vessel> & { mmsi: string }) => void;
  setVessels: (vessels: Vessel[]) => void;
  appendAgentEvent: (event: AgentEvent) => void;
  setReport: (mmsi: string, report: EscalationReport) => void;
  updateStats: (stats: StatsResponse) => void;
  setActiveInvestigation: (inv: { mmsi: string; investigation_id: string } | null) => void;
  setWsConnected: (connected: boolean) => void;
  setVesselTrail: (mmsi: string, positions: [number, number][]) => void;
}

const defaultStats: StatsResponse = {
  total_monitored: 0,
  high_risk_count: 0,
  critical_count: 0,
  investigations_today: 0,
  reports_generated: 0,
};

export const useVesselStore = create<VesselStore>((set) => ({
  vessels: {},
  selectedMmsi: null,
  activeInvestigation: null,
  latestReports: {},
  agentEvents: {},
  stats: defaultStats,
  wsConnected: false,
  vesselTrails: {},

  setSelectedMmsi: (mmsi) => set({ selectedMmsi: mmsi }),

  upsertVessel: (partial) =>
    set((state) => {
      const existing = state.vessels[partial.mmsi];
      const merged = { ...existing, ...partial } as Vessel;
      const vessels = { ...state.vessels, [partial.mmsi]: merged };
      const high = Object.values(vessels).filter((v) => v.risk_level === 'HIGH').length;
      const critical = Object.values(vessels).filter((v) => v.risk_level === 'CRITICAL').length;
      return {
        vessels,
        stats: {
          ...state.stats,
          total_monitored: Object.keys(vessels).length,
          high_risk_count: high,
          critical_count: critical,
        },
      };
    }),

  setVessels: (vesselList) =>
    set(() => {
      const vessels: Record<string, Vessel> = {};
      vesselList.forEach((v) => {
        vessels[v.mmsi] = v;
      });
      return {
        vessels,
        stats: {
          ...defaultStats,
          total_monitored: vesselList.length,
          high_risk_count: vesselList.filter((v) => v.risk_level === 'HIGH').length,
          critical_count: vesselList.filter((v) => v.risk_level === 'CRITICAL').length,
        },
      };
    }),

  appendAgentEvent: (event) =>
    set((state) => {
      const events = [...(state.agentEvents[event.vessel_mmsi] || [])];
      const idx = events.findIndex((e) => e.event_id === event.event_id);
      if (idx >= 0) events[idx] = event;
      else events.push(event);
      const activeInvestigation =
        event.status === 'complete' && event.agent_name === 'escalation'
          ? null
          : state.activeInvestigation;
      return {
        agentEvents: { ...state.agentEvents, [event.vessel_mmsi]: events },
        activeInvestigation,
      };
    }),

  setReport: (mmsi, report) =>
    set((state) => ({
      latestReports: { ...state.latestReports, [mmsi]: report },
      stats: { ...state.stats, reports_generated: state.stats.reports_generated + 1 },
    })),

  updateStats: (stats) => set({ stats }),

  setActiveInvestigation: (inv) => set({ activeInvestigation: inv }),

  setWsConnected: (connected) => set({ wsConnected: connected }),

  setVesselTrail: (mmsi, positions) =>
    set((state) => ({
      vesselTrails: { ...state.vesselTrails, [mmsi]: positions },
    })),
}));
