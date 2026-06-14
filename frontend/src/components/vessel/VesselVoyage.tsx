import { memo } from 'react';
import { Ship } from 'lucide-react';
import {
  STITCH_AIS_BLOCKS,
  STITCH_PORT_CALLS,
  STITCH_VOYAGE,
} from '../../constants/vesselMockData';

export const VesselVoyage = memo(function VesselVoyage() {
  return (
    <div className="flex flex-col items-start gap-6 w-full">
      {/* CURRENT VOYAGE */}
      <div className="w-full">
        <span className="text-[#E0C0B1] text-[11px] font-bold block mb-3">CURRENT VOYAGE</span>
        <div className="bg-[#122131] border border-solid border-[#584237] rounded-sm p-[17px]">
          <div className="flex items-start justify-between mb-6">
            <div className="flex flex-col items-start">
              <span className="text-[#E0C0B1] text-[10px] font-bold uppercase mb-1">Departed</span>
              <span className="text-[#D4E4FA] text-lg font-bold">{STITCH_VOYAGE.departed}</span>
              <span className="text-[#E0C0B1] text-xs mt-1">{STITCH_VOYAGE.departedDate}</span>
            </div>
            <div className="flex items-center flex-1 px-3 pt-5 min-w-[80px]">
              <div className="flex-1 h-px bg-[#584237]" />
              <div className="mx-2 w-7 h-7 rounded-full bg-[#F9731633] border border-solid border-[#F97316] flex items-center justify-center shrink-0">
                <Ship className="w-3.5 h-3.5 text-[#F97316]" />
              </div>
              <div className="flex-1 h-px bg-[#584237]" />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#E0C0B1] text-[10px] font-bold uppercase mb-1">Destination</span>
              <span className="text-[#D4E4FA] text-lg font-bold">{STITCH_VOYAGE.destination}</span>
              <span className="text-[#E0C0B1] text-xs mt-1">{STITCH_VOYAGE.eta}</span>
            </div>
          </div>
          <div className="flex items-center gap-8 pt-3 border-t border-solid border-[#584237]">
            <div>
              <span className="text-[#E0C0B1] text-[10px] font-bold uppercase block">Distance to Go</span>
              <span className="text-[#D4E4FA] text-sm font-bold">{STITCH_VOYAGE.distanceNm}</span>
            </div>
            <div>
              <span className="text-[#E0C0B1] text-[10px] font-bold uppercase block">
                Est. Fuel Consumption
              </span>
              <span className="text-[#D4E4FA] text-sm font-bold">{STITCH_VOYAGE.fuelRate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* LAST 5 PORT CALLS */}
      <div className="w-full">
        <span className="text-[#E0C0B1] text-[11px] font-bold block mb-3">LAST 5 PORT CALLS</span>
        <div className="w-full border border-solid border-[#584237] rounded-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_72px_48px] gap-2 px-3 py-2 border-b border-solid border-[#584237]">
            <span className="text-[#E0C0B1] text-[10px] font-bold uppercase">Port</span>
            <span className="text-[#E0C0B1] text-[10px] font-bold uppercase text-right">Arrival</span>
            <span className="text-[#E0C0B1] text-[10px] font-bold uppercase text-right">Stay</span>
          </div>
          {STITCH_PORT_CALLS.map((row) => (
            <div
              key={row.port}
              className="grid grid-cols-[1fr_72px_48px] gap-2 px-3 py-2.5 border-b border-solid border-[#584237]/60 last:border-0 items-center"
            >
              <span className="text-[#D4E4FA] text-sm flex items-center gap-2">
                <span>{row.flag}</span>
                {row.port}
              </span>
              <span className="text-[#E0C0B1] text-xs text-right">{row.arrival}</span>
              <span className="text-[#D4E4FA] text-xs font-medium text-right">{row.stay}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AIS SIGNAL HISTORY */}
      <div className="w-full">
        <span className="text-[#E0C0B1] text-[11px] font-bold block mb-3">AIS SIGNAL HISTORY</span>
        <div className="bg-[#122131] border border-solid border-[#584237] rounded-sm p-[17px]">
          <span className="text-[#E0C0B1] text-[10px] font-bold uppercase block mb-3">
            30-Day Reliability
          </span>
          <div className="flex gap-1 mb-2">
            {STITCH_AIS_BLOCKS.map((block, i) => (
              <div
                key={i}
                className={`flex-1 h-6 rounded-sm ${
                  block === 'ok' ? 'bg-[#166534]' : 'bg-[#7F1D1D]/80'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-[#E0C0B1] mb-2">
            <span>-30 DAYS</span>
            <span>TODAY</span>
          </div>
          <p className="text-center text-[#FFB4AB] text-[11px] font-bold tracking-wide">
            {STITCH_VOYAGE.gapLabel}
          </p>
        </div>
      </div>
    </div>
  );
});
