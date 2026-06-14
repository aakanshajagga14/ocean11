import { create } from 'zustand';
import type { Stats } from '../types';

const defaultStats: Stats = {
  total_monitored: 0,
  high_risk_count: 0,
  critical_count: 0,
  active_alerts: 0,
  investigations_active: 0,
  investigations_completed_today: 0,
  avg_pipeline_time_seconds: 0,
  escalations_generated: 0,
};

interface StatsStore {
  stats: Stats;
  wsConnected: boolean;
  update: (stats: Stats) => void;
  setWsConnected: (connected: boolean) => void;
}

let pendingStats: Stats | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useStatsStore = create<StatsStore>((set) => ({
  stats: defaultStats,
  wsConnected: false,

  setWsConnected: (connected) => set({ wsConnected: connected }),

  update: (stats) => {
    pendingStats = stats;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (pendingStats) set({ stats: pendingStats });
      pendingStats = null;
      debounceTimer = null;
    }, 500);
  },
}));
