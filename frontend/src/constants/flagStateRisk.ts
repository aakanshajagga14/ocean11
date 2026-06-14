export interface FlagStateRiskEntry {
  flag_state: string;
  abandonment_rate_per_1000_vessels: number;
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  vessel_count_global: number;
}

export const FLAG_TIER_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};
