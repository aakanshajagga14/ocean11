import { memo } from 'react';
import { STITCH } from '../../constants/stitchAssets';
import { useVesselStore } from '../../store/vesselStore';

export const MapControls = memo(function MapControls() {
  const showTrailLayer = useVesselStore((s) => s.showTrailLayer);
  const toggleTrailLayer = useVesselStore((s) => s.toggleTrailLayer);

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col items-center gap-2">
      <button
        type="button"
        className="flex flex-col items-start bg-[#1C2B3C] text-left p-2 rounded-sm border border-solid border-[#584237]"
      >
        <img src={STITCH.mapLayers} alt="" className="w-6 h-6 rounded-sm object-fill" />
      </button>
      <button
        type="button"
        className="flex flex-col items-start bg-[#1C2B3C] text-left p-2 rounded-sm border border-solid border-[#584237]"
      >
        <img src={STITCH.mapLocate} alt="" className="w-6 h-6 rounded-sm object-fill" />
      </button>
      <div className="bg-[#584237] w-8 h-px" />
      <button
        type="button"
        onClick={toggleTrailLayer}
        className={`flex flex-col items-start text-left p-2 rounded-sm border border-solid ${
          showTrailLayer
            ? 'bg-[#F97316] border-[#F97316]'
            : 'bg-[#1C2B3C] border-[#584237]'
        }`}
      >
        <img src={STITCH.mapRoute} alt="" className="w-6 h-6 rounded-sm object-fill" />
      </button>
      <div className="flex flex-col items-start bg-[#1C2B3C] p-px rounded-sm border border-solid border-[#584237]">
        <span className="text-[#D4E4FA] text-sm text-center w-10">+</span>
        <div className="bg-[#584237] w-10 h-px" />
        <span className="text-[#D4E4FA] text-sm text-center w-10">−</span>
      </div>
    </div>
  );
});
