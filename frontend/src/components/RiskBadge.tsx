import type { Vessel } from '../types';

export const RISK_COLORS: Record<Vessel['risk_level'], string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export function RiskBadge({ level, score }: { level: Vessel['risk_level']; score: number }) {
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded"
      style={{ color: RISK_COLORS[level], backgroundColor: `${RISK_COLORS[level]}22` }}
    >
      {score} · {level}
    </span>
  );
}
