import { memo } from 'react';
import { STITCH } from '../../constants/stitchAssets';
import type { Stats } from '../../types';

interface StatsBarProps {
  stats: Stats;
  variant?: 'map' | 'investigations' | 'alerts' | 'reports';
}

function MapStatCard({
  iconSrc,
  iconBg,
  value,
  label,
}: {
  iconSrc: string;
  iconBg: string;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex flex-1 items-center bg-[#122131] py-[17px] rounded-sm border border-solid border-[#584237]">
      <button
        type="button"
        className={`flex flex-col shrink-0 items-start text-left p-2 ml-[17px] mr-4 rounded-sm border-0 ${iconBg}`}
      >
        <img src={iconSrc} alt="" className="w-6 h-6 rounded-sm object-fill" />
      </button>
      <div className="flex flex-col items-start">
        <span className="text-[#D4E4FA] text-[32px] leading-none">{value}</span>
        <span className="text-[#E0C0B1] text-xs font-bold">{label}</span>
      </div>
    </div>
  );
}

function InvStatCard({
  label,
  value,
  iconSrc,
}: {
  label: string;
  value: string | number;
  iconSrc: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-start bg-[#122131] py-[17px] pr-[17px] gap-3 border border-solid border-[#584237]">
      <div className="flex justify-between items-center self-stretch ml-[17px]">
        <span className="text-[#E0C0B1] text-xs font-bold">{label}</span>
        <img src={iconSrc} alt="" className="w-3.5 h-3.5 object-fill" />
      </div>
      <span className="text-[#D4E4FA] text-[32px] font-bold ml-[17px]">{value}</span>
    </div>
  );
}

export const StatsBar = memo(function StatsBar({ stats, variant = 'map' }: StatsBarProps) {
  if (variant === 'investigations') {
    return (
      <div className="flex items-center gap-4 px-6 py-4 bg-[#051424]">
        <InvStatCard
          label="ACTIVE INVESTIGATIONS"
          value={stats.investigations_active}
          iconSrc={STITCH.invStatActive}
        />
        <InvStatCard
          label="COMPLETED TODAY"
          value={stats.investigations_completed_today}
          iconSrc={STITCH.invStatCompleted}
        />
        <InvStatCard
          label="AVG PIPELINE TIME"
          value={stats.avg_pipeline_time_seconds ? `${stats.avg_pipeline_time_seconds} s` : '—'}
          iconSrc={STITCH.invStatPipeline}
        />
        <InvStatCard
          label="ESCALATIONS GENERATED"
          value={stats.escalations_generated}
          iconSrc={STITCH.invStatEscalations}
        />
      </div>
    );
  }

  if (variant === 'alerts') {
    const mediumCount = Math.max(
      0,
      stats.active_alerts - stats.critical_count - stats.high_risk_count,
    );
    return (
      <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-[#050A14]">
        {[
          {
            label: 'TOTAL ALERTS',
            value: String(stats.active_alerts).padStart(2, '0'),
            icon: null,
          },
          {
            label: 'CRITICAL',
            value: String(stats.critical_count).padStart(2, '0'),
            icon: STITCH.alertCriticalIcon,
          },
          { label: 'HIGH', value: String(stats.high_risk_count).padStart(2, '0'), icon: null },
          { label: 'MEDIUM', value: String(mediumCount).padStart(2, '0'), icon: null },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="flex flex-col items-start bg-[#0D1B2A] py-[17px] pl-[17px] gap-1 border border-solid border-[#1E3A5F]"
          >
            <span className="text-[#E0C0B1] text-xs font-bold">{label}</span>
            {icon ? (
              <div className="flex items-center gap-2.5">
                <span className="text-white text-2xl font-bold">{value}</span>
                <img src={icon} alt="" className="w-6 h-6 object-fill" />
              </div>
            ) : (
              <span className="text-white text-2xl font-bold">{value}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-6 py-4 bg-[#051424]">
      <MapStatCard
        iconSrc={STITCH.statVessels}
        iconBg="bg-[#3A4859]"
        value={stats.total_monitored}
        label="Vessels Monitored"
      />
      <MapStatCard
        iconSrc={STITCH.statHighRisk}
        iconBg="bg-[#93000A4D]"
        value={stats.high_risk_count + stats.critical_count}
        label="High Risk Vessels"
      />
      <MapStatCard
        iconSrc={STITCH.statAlerts}
        iconBg="bg-[#F9731633]"
        value={stats.active_alerts}
        label="Active Alerts"
      />
      <MapStatCard
        iconSrc={STITCH.statInvestigations}
        iconBg="bg-[#273647]"
        value={stats.investigations_active}
        label="Active Investigations"
      />
    </div>
  );
});
