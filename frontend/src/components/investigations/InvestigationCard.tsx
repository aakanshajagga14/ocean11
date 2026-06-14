import { memo } from 'react';
import { Link } from 'react-router-dom';
import { AgentPipelineStepper } from '../agents/AgentPipelineStepper';
import { STITCH } from '../../constants/stitchAssets';
import type { Investigation } from '../../types';

interface InvestigationCardProps {
  investigation: Investigation;
}

function timeAgo(ts: string): string {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return 'just now';
  return `${mins}m ago`;
}

export const InvestigationCard = memo(function InvestigationCard({
  investigation,
}: InvestigationCardProps) {
  const running = investigation.status === 'running';
  const latestEvent = investigation.events[investigation.events.length - 1];
  const liveMessage =
    latestEvent?.output_summary ||
    latestEvent?.input_summary ||
    `${investigation.current_agent ?? 'Risk'} Agent analyzing…`;

  return (
    <div
      className={`self-stretch bg-[#0D1C2D] p-[25px] border border-solid border-[#584237] ${
        running ? 'shadow-[0px_0px_12px_#F9731624]' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col items-start gap-[7px]">
          <div className="flex items-center gap-[23px]">
            <span className="text-[#D4E4FA] text-xl font-bold">{investigation.vessel_name}</span>
            <div className="flex flex-col items-start bg-[#051424] py-1 px-[9px] border border-solid border-[#584237]">
              <span className="text-[#D4E4FA] text-[13px]">MMSI {investigation.vessel_mmsi}</span>
            </div>
          </div>
          <span className="text-[#E0C0B1] text-[11px]">Started {timeAgo(investigation.started_at)}</span>
        </div>
        <div
          className={`flex flex-col items-start py-2.5 px-[9px] border border-solid ${
            investigation.risk_score_so_far != null
              ? 'bg-[#93000A33] border-[#FFB4AB]'
              : 'bg-[#122131] border-[#A78B7D]'
          }`}
        >
          <span className="text-[#FFB4AB] text-[11px]">
            {investigation.risk_score_so_far != null
              ? `Risk: ${Math.round(investigation.risk_score_so_far)} in progress`
              : 'Risk: pending'}
          </span>
        </div>
      </div>

      <AgentPipelineStepper events={investigation.events} />

      {running && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-[#FFB690] w-1.5 h-1.5 rounded-xl" />
            <span className="text-[#D4E4FA] text-sm">{liveMessage}</span>
          </div>
          <Link
            to={`/?mmsi=${investigation.vessel_mmsi}`}
            className="flex items-center gap-1 text-[#FFB690] text-xs font-bold"
          >
            View Live
            <img src={STITCH.invViewLive} alt="" className="w-3.5 h-3.5 object-fill" />
          </Link>
        </div>
      )}
    </div>
  );
});
