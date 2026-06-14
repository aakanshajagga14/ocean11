import { memo, useEffect, useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { TextLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getVesselTrail } from '../../api/vessels';
import { useVesselStore } from '../../store/vesselStore';
import type { Vessel } from '../../types';
import { MapControls } from './MapControls';
import { useVesselLayerHandlers, useVesselLayers } from './VesselLayer';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

const MAP_STYLE: string | Record<string, unknown> = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`
  : {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    };

const INITIAL_VIEW = { longitude: 20, latitude: 20, zoom: 1.5, pitch: 0, bearing: 0 };

function formatTooltip(v: Vessel): string {
  return `${v.name} — ${Math.round(v.risk_score)}/100\n${v.risk_level}`;
}

function GlobalMapInner() {
  const vesselRevision = useVesselStore((s) => s.vesselRevision);
  const showTrailLayer = useVesselStore((s) => s.showTrailLayer);
  const selectedVessel = useVesselStore((s) => s.selectedVessel);
  const setRouteHistory = useVesselStore((s) => s.setRouteHistory);
  const [hovered, setHovered] = useState<Vessel | null>(null);
  const [pulse, setPulse] = useState(0);
  const [tick, setTick] = useState(0);

  const { onClick, onHover } = useVesselLayerHandlers(setHovered);
  const pulseScale = 1 + Math.sin(pulse * 0.8) * 0.4;

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => p + 1), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedVessel?.mmsi) return;
    getVesselTrail(selectedVessel.mmsi)
      .then((history) => setRouteHistory(selectedVessel.mmsi, history))
      .catch(() => {});
  }, [selectedVessel?.mmsi, setRouteHistory]);

  const vesselLayers = useVesselLayers({
    vesselRevision,
    pulseScale,
    tick,
    onClick,
    onHover,
    showTrail: showTrailLayer,
  });

  const labelLayer = useMemo(() => {
    if (!hovered) return null;
    return new TextLayer({
      id: 'hover-label',
      data: [hovered],
      getPosition: (v: Vessel) => [v.longitude, v.latitude],
      getText: (v: Vessel) => formatTooltip(v),
      getColor: [212, 228, 250, 255],
      getSize: 12,
      getPixelOffset: [0, -28],
    });
  }, [hovered]);

  const layers = useMemo(
    () => [...vesselLayers, labelLayer].filter(Boolean),
    [vesselLayers, labelLayer],
  );

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <MapControls />
      <DeckGL initialViewState={INITIAL_VIEW} controller layers={layers} getCursor={() => 'pointer'}>
        <Map mapStyle={MAP_STYLE as string} attributionControl={false} />
      </DeckGL>
    </div>
  );
}

export const GlobalMap = memo(GlobalMapInner);
