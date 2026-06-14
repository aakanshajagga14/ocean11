import { memo, useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { getVesselHistory } from '../../api/vessels';
import { INVESTIGATION_OUTCOME_STYLE } from '../../utils/formatters';
import type { InvestigationMemoryEntry } from '../../types';

interface VesselHistoryProps {
  mmsi: string;
  currentScore: number;
}

export const VesselHistory = memo(function VesselHistory({ mmsi, currentScore }: VesselHistoryProps) {
  const [history, setHistory] = useState<InvestigationMemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getVesselHistory(mmsi)
      .then((data) => {
        if (mounted) setHistory(data);
      })
      .catch(() => {
        if (mounted) setHistory([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [mmsi]);

  const chartData = useMemo(() => {
    if (history.length === 0) {
      return [{ score: currentScore }];
    }
    return [
      ...history.map((h) => ({ score: Math.round(h.risk_score_at_time) })),
      { score: Math.round(currentScore) },
    ];
  }, [history, currentScore]);

  const trendStart = chartData[0]?.score ?? currentScore;
  const trendEnd = chartData[chartData.length - 1]?.score ?? currentScore;

  return (
    <div className="flex flex-col items-start gap-6 w-full">
      <div className="w-full">
        <span className="text-[#E0C0B1] text-[11px] font-bold block mb-3">INVESTIGATION HISTORY</span>
        {loading ? (
          <p className="text-[#E0C0B1] text-sm">Loading history…</p>
        ) : history.length === 0 ? (
          <p className="text-[#E0C0B1] text-sm bg-[#122131] border border-solid border-[#584237] rounded-sm p-4">
            No prior investigations for this vessel.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((inv, i) => (
              <div
                key={`${inv.timestamp}-${i}`}
                className="bg-[#122131] border border-solid border-[#584237] rounded-sm p-4 flex justify-between items-start"
              >
                <div>
                  <p className="text-[#D4E4FA] font-bold">
                    {new Date(inv.timestamp).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-[#E0C0B1] text-xs mt-1">
                    Risk Score: {Math.round(inv.risk_score_at_time)}
                  </p>
                  {inv.key_findings_summary && (
                    <p className="text-[#E0C0B1] text-xs mt-1">{inv.key_findings_summary}</p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-sm border border-solid uppercase ${
                    INVESTIGATION_OUTCOME_STYLE[inv.outcome] ?? 'text-[#E0C0B1] border-[#584237]'
                  }`}
                >
                  {inv.outcome}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full">
        <span className="text-[#E0C0B1] text-[11px] font-bold block mb-3">RISK TREND</span>
        <div className="bg-[#122131] border border-solid border-[#584237] rounded-sm p-4 h-[180px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 24, right: 8, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="stitchRiskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F97316" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 100]} hide />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#F97316"
                strokeWidth={2.5}
                fill="url(#stitchRiskGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <span className="absolute left-3 top-3 text-[#F97316] font-bold text-sm">{trendStart}</span>
          <span className="absolute right-3 top-1 text-[#F97316] font-bold text-sm">{trendEnd}</span>
          <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] text-[#E0C0B1]">
            <span>EARLIER</span>
            <span>CURRENT</span>
          </div>
        </div>
      </div>
    </div>
  );
});
