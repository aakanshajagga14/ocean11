import { useEffect, useRef } from 'react';
import { useVesselStore } from '../store/vesselStore';
import type { EscalationReport, WsFeedMessage } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

async function fetchReport(mmsi: string): Promise<EscalationReport> {
  const res = await fetch(`${API_URL}/reports/${mmsi}`);
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}

async function fetchStats() {
  const res = await fetch(`${API_URL}/stats`);
  if (!res.ok) return;
  return res.json();
}

async function fetchVessels() {
  const res = await fetch(`${API_URL}/vessels?limit=500`);
  if (!res.ok) return [];
  return res.json();
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const store = useVesselStore();

  useEffect(() => {
    let mounted = true;

    async function init() {
      const vessels = await fetchVessels();
      if (mounted && vessels.length) store.setVessels(vessels);
      const stats = await fetchStats();
      if (mounted && stats) store.updateStats(stats);
    }
    init();

    function connect() {
      const ws = new WebSocket(`${WS_URL}/ws/feed`);
      wsRef.current = ws;

      ws.onopen = () => {
        store.setWsConnected(true);
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data) as WsFeedMessage;
          switch (msg.type) {
            case 'vessel_update':
              store.upsertVessel({ mmsi: msg.mmsi, ...msg.fields });
              break;
            case 'agent_event':
              store.appendAgentEvent(msg.payload);
              break;
            case 'alert':
              break;
            case 'report_ready':
              fetchReport(msg.mmsi).then((r) => store.setReport(msg.mmsi, r));
              break;
          }
        } catch {
          /* ignore parse errors */
        }
      };

      ws.onclose = () => {
        store.setWsConnected(false);
        if (mounted) {
          reconnectRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();
    }

    connect();

    const statsInterval = setInterval(async () => {
      const stats = await fetchStats();
      if (stats) store.updateStats(stats);
    }, 10000);

    return () => {
      mounted = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      clearInterval(statsInterval);
    };
  }, []);
}
