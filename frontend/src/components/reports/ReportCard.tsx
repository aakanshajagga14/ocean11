import { memo } from 'react';
import { STITCH } from '../../constants/stitchAssets';
import type { EscalationReport } from '../../types';

interface ReportCardProps {
  report: EscalationReport;
  onSelect: (report: EscalationReport) => void;
}

const urgencyStripe: Record<EscalationReport['urgency_level'], string> = {
  IMMEDIATE: 'bg-[#FFB4AB]',
  URGENT: 'bg-[#F97316]',
  MONITOR: 'bg-[#F59E0B]',
  NONE: 'bg-[#584237]',
};

const urgencyBadge: Record<EscalationReport['urgency_level'], string> = {
  IMMEDIATE: 'bg-[#FFB4AB1A] text-[#FFB4AB]',
  URGENT: 'bg-[#F973161A] text-[#F97316]',
  MONITOR: 'bg-[#F59E0B1A] text-[#F59E0B]',
  NONE: 'bg-[#58423733] text-[#E0C0B1]',
};

const urgencyLabel: Record<EscalationReport['urgency_level'], string> = {
  IMMEDIATE: 'Immediate',
  URGENT: 'Urgent',
  MONITOR: 'Monitor',
  NONE: 'No Action',
};

const scoreColor: Record<EscalationReport['urgency_level'], string> = {
  IMMEDIATE: 'text-[#FFB4AB]',
  URGENT: 'text-[#F97316]',
  MONITOR: 'text-[#F59E0B]',
  NONE: 'text-[#D4E4FA]',
};

export const ReportCard = memo(function ReportCard({ report, onSelect }: ReportCardProps) {
  const targets = report.escalation_targets?.slice(0, 3) ?? [];

  return (
    <button
      type="button"
      onClick={() => onSelect(report)}
      className="flex flex-1 flex-col items-start bg-[#122131] pt-px mr-4 rounded border border-solid border-[#584237] text-left w-full"
    >
      <div className={`self-stretch h-1 mb-3 mx-px ${urgencyStripe[report.urgency_level]}`} />
      <div className="flex justify-between items-center self-stretch mb-4 mx-[17px]">
        <span className={`py-1 px-2 rounded-sm text-[11px] font-bold ${urgencyBadge[report.urgency_level]}`}>
          {urgencyLabel[report.urgency_level]}
        </span>
        <span className="text-[#E0C0B1] text-[11px]">
          {new Date(report.generated_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <div className="flex flex-col items-start mb-[25px] ml-[17px]">
        <span className="text-[#D4E4FA] text-base">{report.vessel_name}</span>
        <span className="text-[#E0C0B1] text-[11px]">MMSI: {report.vessel_mmsi}</span>
      </div>
      <div className="flex items-center self-stretch mb-[25px] mx-[17px]">
        <div className="flex flex-col items-start">
          <span className="text-[#E0C0B1] text-[11px]">Risk Score</span>
          <span className={`text-sm font-bold ${scoreColor[report.urgency_level]}`}>
            {Math.round(report.risk_score)}/100
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex flex-col items-center">
          <span className="text-[#E0C0B1] text-[11px]">Crew / Days</span>
          <span className="text-[#D4E4FA] text-sm">
            {report.estimated_crew_size ?? '—'} / {report.days_abandoned ?? '—'}d
          </span>
        </div>
        <div className="flex-1" />
      </div>
      <span className="text-[#E0C0B1] text-sm mb-4 mx-[17px] line-clamp-2">
        {report.key_findings[0] || report.no_action_reason || 'Report generated'}
      </span>
      {targets.length > 0 && (
        <div className="flex items-center mb-4 ml-[17px] gap-1 flex-wrap">
          {targets.map((t) => (
            <div
              key={t.org}
              className="flex flex-col items-start bg-[#1C2B3C] py-[5px] px-[9px] rounded-sm border border-solid border-[#584237]"
            >
              <span className="text-[#D4E4FA] text-[11px]">{t.org}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center mb-[17px] ml-[17px] gap-[7px]">
        <span className="text-[#F97316] text-base">VIEW REPORT</span>
        <img src={STITCH.reportViewArrow} alt="" className="w-6 h-6 object-fill" />
      </div>
    </button>
  );
});
