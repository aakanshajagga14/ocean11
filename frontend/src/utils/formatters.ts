import type { Vessel } from '../types';

export function riskLevelLabel(level: Vessel['risk_level']): string {
  const labels: Record<Vessel['risk_level'], string> = {
    CRITICAL: 'Critical Risk',
    HIGH: 'High Risk',
    MEDIUM: 'Medium Risk',
    LOW: 'Low Risk',
  };
  return labels[level] ?? level;
}

export function riskBadgeClass(level: Vessel['risk_level']): string {
  const classes: Record<Vessel['risk_level'], string> = {
    CRITICAL: 'bg-[#FFB4AB1A] text-[#FFB4AB]',
    HIGH: 'bg-[#F973161A] text-[#F97316]',
    MEDIUM: 'bg-[#FBBF241A] text-[#FBBF24]',
    LOW: 'bg-[#22C55E1A] text-[#22C55E]',
  };
  return classes[level] ?? 'bg-[#273647] text-[#E0C0B1]';
}

export function timeAgo(ts: string): string {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatLastSignal(vessel: Vessel): string {
  const when = timeAgo(vessel.last_ais_signal);
  const place = vessel.destination || `${vessel.latitude.toFixed(1)}°, ${vessel.longitude.toFixed(1)}°`;
  return `Last AIS: ${when} • ${place}`;
}

export function buildRiskProjection(vessel: Vessel): string {
  if (vessel.risk_factors.length) {
    return vessel.risk_factors.slice(0, 3).join('. ') + '.';
  }
  if (vessel.risk_score >= 70) {
    return 'Elevated abandonment risk based on current telemetry and behavioral patterns.';
  }
  if (vessel.risk_score >= 50) {
    return 'Moderate risk indicators detected. Continued monitoring recommended.';
  }
  return 'No significant risk indicators at this time.';
}

export function buildConfidenceNote(vessel: Vessel): string {
  if (vessel.ais_gap_hours >= 24) {
    return `Reduced data confidence — AIS gap of ${Math.round(vessel.ais_gap_hours)}h detected`;
  }
  if (vessel.risk_score_confidence < 0.8) {
    return `Moderate data confidence (${vessel.risk_score_confidence.toFixed(2)})`;
  }
  return 'High data confidence — continuous AIS coverage';
}

export function buildAisReliabilityBlocks(aisGapHours: number): ('ok' | 'gap')[] {
  const blocks: ('ok' | 'gap')[] = Array(10).fill('ok');
  if (aisGapHours >= 72) {
    blocks.fill('gap', 5, 10);
  } else if (aisGapHours >= 24) {
    blocks.fill('gap', 7, 10);
  } else if (aisGapHours >= 6) {
    blocks[9] = 'gap';
  }
  return blocks;
}

export const INVESTIGATION_OUTCOME_STYLE: Record<string, string> = {
  escalated: 'text-[#FFB4AB] border-[#FFB4AB] bg-[#FFB4AB1A]',
  monitor: 'text-[#FFB690] border-[#FFB690] bg-[#FFB6901A]',
  'no-action': 'text-[#22C55E] border-[#22C55E] bg-[#22C55E1A]',
};
