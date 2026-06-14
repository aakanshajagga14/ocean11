import { create } from 'zustand';
import type {
  AgentEvent,
  Alert,
  EscalationReport,
  InvestigateButtonState,
  Investigation,
} from '../types';

interface AgentStore {
  investigations: Map<string, Investigation>;
  investigationIds: string[];
  agentEvents: AgentEvent[];
  reports: Map<string, EscalationReport>;
  alerts: Alert[];
  dismissedAlertIds: Set<string>;
  investigateState: Record<string, InvestigateButtonState>;
  selectedReport: EscalationReport | null;
  riskTrend: string | null;

  addInvestigation: (inv: Investigation) => void;
  updateInvestigation: (id: string, patch: Partial<Investigation>) => void;
  addEvent: (event: AgentEvent) => void;
  setReport: (report: EscalationReport) => void;
  addAlert: (alert: Alert) => void;
  setAlerts: (alerts: Alert[]) => void;
  dismissAlert: (alertId: string) => void;
  setInvestigateState: (mmsi: string, state: InvestigateButtonState) => void;
  setSelectedReport: (report: EscalationReport | null) => void;
  registerInvestigationId: (id: string, mmsi: string, vesselName: string) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  investigations: new Map(),
  investigationIds: [],
  agentEvents: [],
  reports: new Map(),
  alerts: [],
  dismissedAlertIds: new Set(),
  investigateState: {},
  selectedReport: null,
  riskTrend: null,

  addInvestigation: (inv) =>
    set((state) => {
      const investigations = new Map(state.investigations);
      investigations.set(inv.investigation_id, inv);
      return { investigations };
    }),

  updateInvestigation: (id, patch) =>
    set((state) => {
      const investigations = new Map(state.investigations);
      const existing = investigations.get(id);
      if (existing) investigations.set(id, { ...existing, ...patch });
      return { investigations };
    }),

  addEvent: (event) =>
    set((state) => {
      const agentEvents = [...state.agentEvents];
      const idx = agentEvents.findIndex((e) => e.event_id === event.event_id);
      if (idx >= 0) agentEvents[idx] = event;
      else agentEvents.unshift(event);

      const investigateState = { ...state.investigateState };
      if (event.status === 'running' && investigateState[event.vessel_mmsi] === 'loading') {
        investigateState[event.vessel_mmsi] = 'running';
      }
      if (event.agent_name === 'escalation' && event.status === 'complete') {
        investigateState[event.vessel_mmsi] = 'done';
      }

      let riskTrend = state.riskTrend;
      if (event.agent_name === 'risk' && event.status === 'complete') {
        if (event.output_summary.includes('INCREASING')) riskTrend = 'INCREASING';
        else if (event.output_summary.includes('DECREASING')) riskTrend = 'DECREASING';
        else if (event.output_summary.includes('STABLE')) riskTrend = 'STABLE';
      }

      const investigations = new Map(state.investigations);
      for (const [id, inv] of investigations) {
        if (inv.vessel_mmsi === event.vessel_mmsi) {
          const events = [...inv.events.filter((e) => e.event_id !== event.event_id), event];
          investigations.set(id, {
            ...inv,
            events,
            current_agent: event.status === 'running' ? event.agent_name : inv.current_agent,
            status: event.agent_name === 'escalation' && event.status === 'complete' ? 'complete' : inv.status,
          });
        }
      }

      return { agentEvents, investigateState, riskTrend, investigations };
    }),

  setReport: (report) =>
    set((state) => {
      const reports = new Map(state.reports);
      reports.set(report.vessel_mmsi, report);
      const investigateState = {
        ...state.investigateState,
        [report.vessel_mmsi]: 'done' as InvestigateButtonState,
      };
      const investigations = new Map(state.investigations);
      for (const [id, inv] of investigations) {
        if (inv.vessel_mmsi === report.vessel_mmsi && inv.status === 'running') {
          investigations.set(id, {
            ...inv,
            status: 'complete',
            completed_at: new Date().toISOString(),
          });
        }
      }
      return { reports, investigateState, investigations };
    }),

  addAlert: (alert) =>
    set((state) => {
      if (state.dismissedAlertIds.has(alert.alert_id)) return state;
      const exists = state.alerts.some((a) => a.alert_id === alert.alert_id);
      if (exists) return state;
      return { alerts: [alert, ...state.alerts].slice(0, 50) };
    }),

  setAlerts: (alerts) => set({ alerts }),

  dismissAlert: (alertId) =>
    set((state) => {
      const dismissedAlertIds = new Set(state.dismissedAlertIds);
      dismissedAlertIds.add(alertId);
      return {
        dismissedAlertIds,
        alerts: state.alerts.filter((a) => a.alert_id !== alertId),
      };
    }),

  setInvestigateState: (mmsi, buttonState) =>
    set((state) => ({
      investigateState: { ...state.investigateState, [mmsi]: buttonState },
    })),

  setSelectedReport: (report) => set({ selectedReport: report }),

  registerInvestigationId: (id, mmsi, vesselName) =>
    set((state) => {
      const investigations = new Map(state.investigations);
      investigations.set(id, {
        investigation_id: id,
        vessel_mmsi: mmsi,
        vessel_name: vesselName,
        started_at: new Date().toISOString(),
        completed_at: null,
        status: 'running',
        current_agent: 'monitoring',
        events: [],
        risk_score_so_far: null,
      });
      const investigationIds = state.investigationIds.includes(id)
        ? state.investigationIds
        : [id, ...state.investigationIds];
      const investigateState = { ...state.investigateState, [mmsi]: 'loading' as InvestigateButtonState };
      return { investigations, investigationIds, investigateState };
    }),
}));
