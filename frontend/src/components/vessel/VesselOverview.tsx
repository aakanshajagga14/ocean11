import { memo } from 'react';
import { STITCH } from '../../constants/stitchAssets';
import { buildConfidenceNote, buildRiskProjection } from '../../utils/formatters';
import type { Vessel } from '../../types';

interface VesselOverviewProps {
  vessel: Vessel;
}

export const VesselOverview = memo(function VesselOverview({ vessel }: VesselOverviewProps) {
  const score = Math.round(vessel.risk_score);
  const low = Math.round(vessel.risk_score_range.low);
  const high = Math.round(vessel.risk_score_range.high);
  const conf = vessel.risk_score_confidence;

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-col items-start bg-[#122131] p-[17px] gap-4 rounded-sm border border-solid border-[#584237] w-full">
        <div className="flex items-start w-full">
          <div className="flex flex-col shrink-0 items-start gap-[3px]">
            <span className="text-[#E0C0B1] text-[11px] font-bold">RISK SCORE</span>
            <span className="text-[#F97316] text-[44px] font-bold leading-none">
              {score} /100
            </span>
          </div>
          <div className="flex flex-col shrink-0 items-start mt-[13px] ml-auto gap-2">
            <img src={STITCH.riskChart} alt="" className="w-16 h-8 object-fill" />
            <span className="text-[#FFB4AB] text-[11px] font-bold ml-3.5">
              {vessel.risk_level === 'CRITICAL' ? 'Critical' : vessel.risk_level}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-start w-full">
          <div className="flex items-center mb-1 w-full">
            <span className="text-[#E0C0B1] text-[10px] font-bold mr-auto">
              Confidence Interval ({conf.toFixed(2)})
            </span>
            <span className="text-[#E0C0B1] text-[10px] font-bold">
              Range: {low} - {high}
            </span>
          </div>
          <div className="flex flex-col items-start bg-[#273647] w-full pl-[55%] pr-[11px] mb-3 rounded-xl h-2 justify-center">
            <div className="items-start bg-[#F973164D] pl-8 pr-[7px] rounded-xl w-full">
              <div className="bg-[#F97316] w-3 h-1.5 rounded-xl" />
            </div>
          </div>
          <span className="text-[#E0C0B1] text-[11px]">{buildConfidenceNote(vessel)}</span>
        </div>
      </div>

      <div className="flex flex-col items-start ml-3.5 gap-1 w-full">
        <span className="text-[#F97316] text-[11px] font-bold">System Projection</span>
        <span className="text-[#D4E4FA] text-sm">{buildRiskProjection(vessel)}</span>
      </div>

      <div className="flex items-center gap-3 w-full">
        <div className="flex flex-col shrink-0 items-start bg-[#122131] py-[9px] pl-[13px] pr-[65px] gap-1 rounded-sm border border-solid border-[#584237]">
          <span className="text-[#E0C0B1] text-[11px]">DAYS STATIONARY</span>
          <span className="text-[#D4E4FA] text-xl font-bold">{vessel.days_stationary} days</span>
        </div>
        <div className="flex flex-col shrink-0 items-start bg-[#122131] py-[9px] pl-[13px] pr-[117px] gap-1 rounded-sm border border-solid border-[#584237]">
          <span className="text-[#E0C0B1] text-[11px]">AIS GAP</span>
          <span className="text-[#D4E4FA] text-xl font-bold">
            {Math.round(vessel.ais_gap_hours)} h
          </span>
        </div>
      </div>
    </div>
  );
});
