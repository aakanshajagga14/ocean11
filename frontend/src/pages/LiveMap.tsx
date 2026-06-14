import { memo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlobalMap } from '../components/map/GlobalMap';
import { MapAlertsStrip } from '../components/map/MapAlertsStrip';
import { StatsBar } from '../components/layout/StatsBar';
import { VesselPanel } from '../components/vessel/VesselPanel';
import { useVessels } from '../hooks/useVessels';
import { useVesselStore } from '../store/vesselStore';
import { useStatsStore } from '../store/statsStore';

export const LiveMap = memo(function LiveMap() {
  const stats = useStatsStore((s) => s.stats);
  const [params] = useSearchParams();
  const selectVessel = useVesselStore((s) => s.selectVessel);
  const { loading, error } = useVessels();

  useEffect(() => {
    const mmsi = params.get('mmsi');
    if (mmsi) selectVessel(mmsi);
  }, [params, selectVessel]);

  return (
    <div className="flex flex-col h-full">
      <StatsBar stats={stats} variant="map" />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 relative">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-ocean-bg/80 text-ocean-muted">
              Loading vessel snapshot…
            </div>
          )}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-900/80 text-red-200 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}
          <GlobalMap />
          <MapAlertsStrip />
        </div>
        <VesselPanel />
      </div>
    </div>
  );
});
