import { Radio } from 'lucide-react';
import { useVesselStore } from '../store/vesselStore';

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ocean-secondary text-sm">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}

export function StatsBar() {
  const stats = useVesselStore((s) => s.stats);
  const wsConnected = useVesselStore((s) => s.wsConnected);
  const activeInvestigation = useVesselStore((s) => s.activeInvestigation);

  return (
    <div className="flex items-center justify-between gap-6 px-6 py-3 bg-ocean-surface border-b border-ocean-border">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-ocean-accent tracking-wide">🛰️ HARBORWATCH AI</span>
        <span
          className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            wsConnected ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'
          }`}
        >
          <Radio className="w-3 h-3" />
          {wsConnected ? 'LIVE' : 'RECONNECTING'}
        </span>
      </div>
      <div className="flex items-center gap-8">
        <StatChip label="Monitored" value={stats.total_monitored} color="text-ocean-primary" />
        <StatChip label="High Risk" value={stats.high_risk_count} color="text-risk-high" />
        <StatChip label="Critical" value={stats.critical_count} color="text-risk-critical" />
        <StatChip
          label="Investigating"
          value={activeInvestigation ? 1 : 0}
          color="text-ocean-accent"
        />
      </div>
    </div>
  );
}
