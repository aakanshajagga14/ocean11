import { RISK_COLORS } from '../types';
import type { Vessel } from '../types';

interface Props {
  level: Vessel['risk_level'];
  score?: number;
}

export function RiskBadge({ level, score }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${RISK_COLORS[level]}22`, color: RISK_COLORS[level] }}
    >
      {score !== undefined ? `${score}/100 ` : ''}
      {level}
    </span>
  );
}
