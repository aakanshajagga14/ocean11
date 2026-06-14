import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { vesselToAlert } from '../../api/mappers';
import { useAgentStore } from '../../store/agentStore';
import { useVesselStore } from '../../store/vesselStore';
import { riskBadgeClass, timeAgo } from '../../utils/formatters';

export const MapAlertsStrip = memo(function MapAlertsStrip() {
  const vesselRevision = useVesselStore((s) => s.vesselRevision);
  const vessels = useVesselStore((s) => s.vessels);
  const wsAlerts = useAgentStore((s) => s.alerts);

  const topAlerts = useMemo(() => {
    const fromVessels = Array.from(vessels.values())
      .filter(
        (v) => v.risk_score >= 50 || v.risk_level === 'HIGH' || v.risk_level === 'CRITICAL',
      )
      .sort((a, b) => b.risk_score - a.risk_score)
      .map(vesselToAlert);

    const merged = new Map<string, ReturnType<typeof vesselToAlert>>();
    [...fromVessels, ...wsAlerts].forEach((a) => merged.set(a.alert_id, a));

    return Array.from(merged.values())
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 3);
  }, [vessels, vesselRevision, wsAlerts]);

  if (topAlerts.length === 0) {
    return (
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col bg-[#0D1C2D] py-[18px] px-4 gap-2 border-t border-solid border-[#584237]">
        <div className="flex justify-between items-center">
          <span className="text-[#D4E4FA] text-xs font-bold">Active Alerts</span>
          <Link to="/alerts" className="text-[#FFB690] text-xs font-bold hover:underline">
            View all
          </Link>
        </div>
        <p className="text-[#E0C0B1] text-[11px]">No active alerts — all vessels within normal parameters.</p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col bg-[#0D1C2D] py-[18px] px-4 gap-2 border-t border-solid border-[#584237]">
      <div className="flex justify-between items-center">
        <span className="text-[#D4E4FA] text-xs font-bold">Active Alerts</span>
        <Link to="/alerts" className="text-[#FFB690] text-xs font-bold hover:underline">
          View all
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {topAlerts.map((alert, i) => (
          <div
            key={alert.alert_id}
            className={`flex flex-col bg-[#122131] pt-[13px] px-4 gap-1 border border-solid border-[#584237] ${
              i < 2 ? 'flex-1' : 'shrink-0'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[#D4E4FA] text-sm font-bold">{alert.vessel_name}</span>
              <span
                className={`py-0.5 px-1.5 rounded-sm text-[10px] font-bold ${riskBadgeClass(alert.risk_level)}`}
              >
                {alert.risk_level}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#E0C0B1] text-[11px]">{alert.description}</span>
              <span className="text-[#E0C0B1] text-[10px]">{timeAgo(alert.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
