import { useEffect, useRef, useState } from 'react';
import { getReport } from '../api/reports';
import { mapAgentEvent, mapStats, mapVessel, vesselToAlert } from '../api/mappers';
import { apiFetch } from '../api/client';
import { useAgentStore } from '../store/agentStore';
import { useStatsStore } from '../store/statsStore';
import { useVesselStore } from '../store/vesselStore';
import type {
  ApiAgentEventRaw,
  ApiStatsRaw,
  ApiVesselRaw,
  WebSocketMessage,
} from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

type BackendMessage =
  | { type: 'vessels_batch'; data: ApiVesselRaw[] }
  | { type: 'vessel_update'; mmsi: string; fields: Partial<ApiVesselRaw> }
  | { type: 'agent_event'; payload: ApiAgentEventRaw }
  | { type: 'stats_update'; payload: ApiStatsRaw }
  | { type: 'report_ready'; mmsi: string; report_id: string }
  | { type: 'alert'; mmsi: string; risk_score: number; risk_level: string }
  | { type: 'vessel_ping'; mmsi: string; timestamp: string }
  | {
      type: 'fleet_alert';
      owner: string;
      fleet_pattern_score: number;
      affected_vessels: string[];
      summary: string;
    };

function activeInvestigationCount(): number {
  const invs = useAgentStore.getState().investigations;
  return [...invs.values()].filter((i) => i.status === 'running').length;
}

function handleBackendMessage(msg: BackendMessage): WebSocketMessage | null {
  switch (msg.type) {
    case 'vessels_batch':
      return { type: 'vessel_update', data: msg.data.map((v) => mapVessel(v)) };
    case 'vessel_update': {
      const merged = mapVessel({ ...msg.fields, mmsi: msg.mmsi } as ApiVesselRaw);
      return { type: 'vessel_update', data: [merged] };
    }
    case 'agent_event':
      return { type: 'agent_event', data: mapAgentEvent(msg.payload) };
    case 'stats_update':
      return {
        type: 'stats_update',
        data: mapStats(msg.payload, activeInvestigationCount()),
      };
    case 'report_ready':
      return null;
    case 'alert': {
      const vessel = useVesselStore.getState().vessels.get(msg.mmsi);
      if (!vessel) return null;
      return { type: 'alert', data: vesselToAlert({ ...vessel, risk_score: msg.risk_score, risk_level: msg.risk_level as typeof vessel.risk_level }) };
    }
    default:
      return null;
  }
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initStats() {
      try {
        const raw = await apiFetch<ApiStatsRaw>('/stats');
        useStatsStore.getState().update(mapStats(raw, activeInvestigationCount()));
      } catch {
        /* stats optional on init */
      }
    }
    void initStats();

    function routeMessage(msg: WebSocketMessage) {
      setLastMessage(msg);
      switch (msg.type) {
        case 'vessel_update':
          useVesselStore.getState().updateVessels(msg.data);
          break;
        case 'agent_event':
          useAgentStore.getState().addEvent(msg.data);
          break;
        case 'alert':
          useAgentStore.getState().addAlert(msg.data);
          break;
        case 'stats_update':
          useStatsStore.getState().update(msg.data);
          break;
        case 'report_ready':
          useAgentStore.getState().setReport(msg.data);
          break;
      }
    }

    function connect() {
      const ws = new WebSocket(`${WS_URL}/ws/feed`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted) return;
        backoffRef.current = 1000;
        setConnected(true);
        useStatsStore.getState().setWsConnected(true);
      };

      ws.onmessage = (e) => {
        try {
          const raw = JSON.parse(e.data) as BackendMessage;
          if (raw.type === 'vessel_ping') {
            useVesselStore.getState().flashPing(raw.mmsi);
            return;
          }
          if (raw.type === 'report_ready') {
            getReport(raw.mmsi)
              .then((report) => {
                useAgentStore.getState().setReport(report);
                setLastMessage({ type: 'report_ready', data: report });
              })
              .catch(() => {});
            return;
          }
          const mapped = handleBackendMessage(raw);
          if (mapped) routeMessage(mapped);
        } catch {
          /* ignore malformed */
        }
      };

      ws.onclose = () => {
        setConnected(false);
        useStatsStore.getState().setWsConnected(false);
        if (!mounted) return;
        const delay = Math.min(backoffRef.current, 30000);
        backoffRef.current = Math.min(backoffRef.current * 2, 30000);
        reconnectRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      mounted = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { connected, lastMessage };
}
