import { memo } from 'react';
import { Link } from 'react-router-dom';
import { STITCH_MAP_ALERTS } from '../../constants/vesselMockData';

export const MapAlertsStrip = memo(function MapAlertsStrip() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col bg-[#0D1C2D] py-[18px] px-4 gap-2 border-t border-solid border-[#584237]">
      <div className="flex justify-between items-center">
        <span className="text-[#D4E4FA] text-xs font-bold">Active Alerts</span>
        <Link to="/alerts" className="text-[#FFB690] text-xs font-bold hover:underline">
          View all
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {STITCH_MAP_ALERTS.map((alert) => (
          <div
            key={alert.name}
            className={`flex flex-col bg-[#122131] pt-[13px] px-4 gap-1 border border-solid border-[#584237] ${
              alert.flex ? 'flex-1' : 'shrink-0'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[#D4E4FA] text-sm font-bold">{alert.name}</span>
              {alert.badge && (
                <span
                  className={`py-0.5 px-1.5 rounded-sm text-[10px] font-bold ${alert.badgeClass}`}
                >
                  {alert.badge}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#E0C0B1] text-[11px]">{alert.detail}</span>
              {alert.time && <span className="text-[#E0C0B1] text-[10px]">{alert.time}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
