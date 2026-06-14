import { memo, useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import {
  STITCH_INVESTIGATIONS,
  STITCH_RISK_TREND,
  STITCH_STATUS_STYLE,
} from '../../constants/vesselMockData';

export const VesselHistory = memo(function VesselHistory() {
  const chartData = useMemo(
    () => [
      { score: STITCH_RISK_TREND.start },
      { score: STITCH_RISK_TREND.start + 8 },
      { score: STITCH_RISK_TREND.start + 15 },
      { score: STITCH_RISK_TREND.start + 22 },
      { score: STITCH_RISK_TREND.end },
    ],
    [],
  );

  return (
    <div className="flex flex-col items-start gap-6 w-full">
      <div className="w-full">
        <span className="text-[#E0C0B1] text-[11px] font-bold block mb-3">INVESTIGATION HISTORY</span>
        <div className="flex flex-col gap-3">
          {STITCH_INVESTIGATIONS.map((inv) => (
            <div
              key={inv.id}
              className="bg-[#122131] border border-solid border-[#584237] rounded-sm p-4 flex justify-between items-start"
            >
              <div>
                <p className="text-[#D4E4FA] font-bold">{inv.id}</p>
                <p className="text-[#E0C0B1] text-xs mt-1">
                  {inv.date} • Risk Score: {inv.riskScore}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-sm border border-solid ${STITCH_STATUS_STYLE[inv.status]}`}
              >
                {inv.status}
              </span>
            </div>
          ))}
        </div>
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
              <YAxis domain={[40, 100]} hide />
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
          <span className="absolute left-3 top-3 text-[#F97316] font-bold text-sm">
            {STITCH_RISK_TREND.start}
          </span>
          <span className="absolute right-3 top-1 text-[#F97316] font-bold text-sm">
            {STITCH_RISK_TREND.end}
          </span>
          <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] text-[#E0C0B1]">
            <span>LAST 6 MONTHS</span>
            <span>CURRENT</span>
          </div>
        </div>
      </div>
    </div>
  );
});
