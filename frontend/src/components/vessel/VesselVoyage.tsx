import { memo, useMemo } from 'react';
import { Ship } from 'lucide-react';
import { buildAisReliabilityBlocks } from '../../utils/formatters';
import type { Vessel } from '../../types';

interface VesselVoyageProps {
  vessel: Vessel;
}

export const VesselVoyage = memo(function VesselVoyage({ vessel }: VesselVoyageProps) {
  const aisBlocks = useMemo(
    () => buildAisReliabilityBlocks(vessel.ais_gap_hours),
    [vessel.ais_gap_hours],
  );

  const gapLabel =
    vessel.ais_gap_hours >= 24
      ? `${Math.round(vessel.ais_gap_hours)}H GAP DETECTED`
      : 'AIS SIGNAL CONTINUOUS';

  const departed = vessel.last_port || 'Unknown';
  const destination = vessel.destination || 'Unknown';

  return (
    <div className="flex flex-col items-start gap-6 w-full">
      <div className="w-full">
        <span className="text-[#E0C0B1] text-[11px] font-bold block mb-3">CURRENT VOYAGE</span>
        <div className="bg-[#122131] border border-solid border-[#584237] rounded-sm p-[17px]">
          <div className="flex items-start justify-between mb-6">
            <div className="flex flex-col items-start">
              <span className="text-[#E0C0B1] text-[10px] font-bold uppercase mb-1">Last Port</span>
              <span className="text-[#D4E4FA] text-lg font-bold">{departed}</span>
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
              <span className="text-[#D4E4FA] text-lg font-bold">{destination}</span>
              <span className="text-[#E0C0B1] text-xs mt-1">
                {vessel.speed > 0.5 ? `${vessel.speed.toFixed(1)} kn` : 'Stationary'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-8 pt-3 border-t border-solid border-[#584237]">
            <div>
              <span className="text-[#E0C0B1] text-[10px] font-bold uppercase block">Flag State</span>
              <span className="text-[#D4E4FA] text-sm font-bold">{vessel.flag_state || '—'}</span>
            </div>
            <div>
              <span className="text-[#E0C0B1] text-[10px] font-bold uppercase block">Vessel Type</span>
              <span className="text-[#D4E4FA] text-sm font-bold">{vessel.vessel_type || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <span className="text-[#E0C0B1] text-[11px] font-bold block mb-3">PORT CALL HISTORY</span>
        <div className="w-full border border-solid border-[#584237] rounded-sm overflow-hidden">
          <p className="text-[#E0C0B1] text-sm p-4 text-center">
            Port call records are not available from AIS telemetry.
          </p>
        </div>
      </div>

      <div className="w-full">
        <span className="text-[#E0C0B1] text-[11px] font-bold block mb-3">AIS SIGNAL HISTORY</span>
        <div className="bg-[#122131] border border-solid border-[#584237] rounded-sm p-[17px]">
          <span className="text-[#E0C0B1] text-[10px] font-bold uppercase block mb-3">
            30-Day Reliability
          </span>
          <div className="flex gap-1 mb-2">
            {aisBlocks.map((block, i) => (
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
          <p
            className={`text-center text-[11px] font-bold tracking-wide ${
              vessel.ais_gap_hours >= 24 ? 'text-[#FFB4AB]' : 'text-[#22C55E]'
            }`}
          >
            {gapLabel}
          </p>
        </div>
      </div>
    </div>
  );
});
