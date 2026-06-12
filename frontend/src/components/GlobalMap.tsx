import { useCallback, useEffect, useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useVesselStore } from '../store/vesselStore';
import { RISK_RGBA, type Vessel } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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

const INITIAL_VIEW = {
  longitude: 20,
  latitude: 20,
  zoom: 1.5,
  pitch: 0,
  bearing: 0,
};

type TrailData = { positions: [number, number][] };

export function GlobalMap() {
  const vessels = useVesselStore((s) => Object.values(s.vessels));
  const selectedMmsi = useVesselStore((s) => s.selectedMmsi);
  const setSelectedMmsi = useVesselStore((s) => s.setSelectedMmsi);
  const vesselTrails = useVesselStore((s) => s.vesselTrails);
  const setVesselTrail = useVesselStore((s) => s.setVesselTrail);
  const [hovered, setHovered] = useState<Vessel | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => p + 1), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedMmsi) return;
    fetch(`${API_URL}/vessels/${selectedMmsi}/trail`)
      .then((r) => r.json())
      .then((data: { positions?: [number, number][] }) => {
        if (data.positions) setVesselTrail(selectedMmsi, data.positions);
      })
      .catch(() => {});
  }, [selectedMmsi, setVesselTrail]);

  const vesselList = useMemo(() => vessels, [vessels]);
  const simulated = useMemo(() => vesselList.filter((v) => v.is_simulated), [vesselList]);
  const pulseScale = 1 + Math.sin(pulse * 0.8) * 0.4;

  const onClick = useCallback(
    (info: PickingInfo<Vessel>) => {
      if (info.object) setSelectedMmsi(info.object.mmsi);
    },
    [setSelectedMmsi],
  );

  const layers = useMemo(() => {
    const scatter = new ScatterplotLayer({
      id: 'vessels',
      data: vesselList,
      getPosition: (v: Vessel) => [v.longitude, v.latitude],
      getFillColor: (v: Vessel) => RISK_RGBA[v.risk_level] ?? RISK_RGBA.LOW,
      getRadius: (v: Vessel) => (v.is_simulated ? 80000 * pulseScale : 50000),
      radiusMinPixels: 4,
      radiusMaxPixels: 14,
      pickable: true,
      onClick,
      onHover: (info: PickingInfo<Vessel>) => setHovered(info.object ?? null),
      updateTriggers: {
        getRadius: [pulseScale],
      },
    });

    const pulseLayer = new ScatterplotLayer({
      id: 'simulated-pulse',
      data: simulated,
      getPosition: (v: Vessel) => [v.longitude, v.latitude],
      getFillColor: [239, 68, 68, Math.floor(80 + pulseScale * 60)],
      getRadius: 120000 * pulseScale,
      radiusMinPixels: 12,
      radiusMaxPixels: 28,
      pickable: false,
      updateTriggers: {
        getRadius: [pulseScale],
        getFillColor: [pulseScale],
      },
    });

    const trail =
      selectedMmsi && vesselTrails[selectedMmsi]?.length
        ? new PathLayer({
            id: 'vessel-trail',
            data: [{ positions: vesselTrails[selectedMmsi] }],
            getPath: (d: TrailData) => d.positions,
            getColor: [56, 189, 248, 200],
            getWidth: 2,
            widthMinPixels: 2,
          })
        : null;

    const labels = hovered
      ? new TextLayer({
          id: 'vessel-labels',
          data: [hovered],
          getPosition: (v: Vessel) => [v.longitude, v.latitude],
          getText: (v: Vessel) => v.name,
          getColor: [226, 232, 240, 255],
          getSize: 14,
          getPixelOffset: [0, -20],
          getAlignmentBaseline: 'bottom',
        })
      : null;

    return [scatter, pulseLayer, trail, labels].filter(Boolean);
  }, [vesselList, simulated, pulseScale, onClick, hovered, selectedMmsi, vesselTrails]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <DeckGL
        initialViewState={INITIAL_VIEW}
        controller
        layers={layers}
        getCursor={() => 'pointer'}
      >
        <Map mapStyle={MAP_STYLE as string} attributionControl={false} />
      </DeckGL>
    </div>
  );
}
