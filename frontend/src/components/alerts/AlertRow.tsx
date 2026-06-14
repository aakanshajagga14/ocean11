import { memo } from 'react';
import { STITCH } from '../../constants/stitchAssets';
import type { Alert } from '../../types';

interface AlertRowProps {
  alert: Alert;
  onInvestigate: (mmsi: string) => void;
  onDismiss: (alertId: string) => void;
}

const levelColor: Record<Alert['risk_level'], string> = {
  CRITICAL: 'text-red-500',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-amber-400',
  LOW: 'text-emerald-400',
};

function timeAgo(ts: string): string {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return 'just now';
  return `${mins}m ago`;
}

export const AlertRow = memo(function AlertRow({ alert, onInvestigate, onDismiss }: AlertRowProps) {
  return (
    <div className="flex items-center self-stretch bg-[#0D1B2A] py-[17px] px-5 gap-4 border border-solid border-[#1E3A5F]">
      <div className="flex flex-1 flex-col items-start gap-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-white text-base font-bold mr-2">{alert.vessel_name}</span>
          <div className="flex flex-col items-start bg-[#010F1F] pb-px px-[9px] border border-solid border-[#1E3A5F]">
            <span className="text-[#E0C0B1] text-xs font-bold">{alert.vessel_type}</span>
          </div>
          {alert.alert_types.map((t) => (
            <div
              key={t}
              className="flex flex-col items-start bg-[#EF44441A] py-px px-[5px] border border-solid border-[#EF44444D]"
            >
              <span className="text-red-500 text-[11px]">{t}</span>
            </div>
          ))}
        </div>
        <span className="text-[#E0C0B1] text-sm">{alert.description}</span>
      </div>
      <div className="flex flex-col shrink-0 items-start gap-1">
        <span className="text-[#E0C0B1] text-[13px]">{timeAgo(alert.timestamp)}</span>
        <div className="flex items-center gap-[15px]">
          <div className="flex flex-col items-center">
            <span className="text-[#E0C0B1] text-[11px]">RISK SCORE</span>
            <span className={`text-xl font-bold ${levelColor[alert.risk_level]}`}>
              {Math.round(alert.risk_score)}/100
            </span>
          </div>
          <div className="flex flex-col items-start gap-1">
            <button
              type="button"
              onClick={() => onInvestigate(alert.vessel_mmsi)}
              className="flex items-center bg-[#F97316] text-left py-1 px-4 gap-2.5 rounded-sm border-0"
            >
              <span className="text-[#582200] text-xs font-bold">INVESTIGATE</span>
              <img src={STITCH.alertInvestigate} alt="" className="w-3.5 h-3.5 rounded-sm object-fill" />
            </button>
            <button
              type="button"
              onClick={() => onDismiss(alert.alert_id)}
              className="text-[#E0C0B1] text-[11px] hover:text-white"
            >
              DISMISS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
