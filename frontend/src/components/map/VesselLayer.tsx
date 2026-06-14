import { useCallback, useMemo } from 'react';
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import { useVesselStore } from '../../store/vesselStore';
import { RISK_RGBA, type Vessel } from '../../types';

interface UseVesselLayersOptions {
  vesselRevision: number;
  pulseScale: number;
  tick: number;
  onClick: (info: PickingInfo<Vessel>) => void;
  onHover: (info: PickingInfo<Vessel>) => void;
  showTrail: boolean;
}

export function useVesselLayers({
  vesselRevision,
  pulseScale,
  tick,
  onClick,
  onHover,
  showTrail,
}: UseVesselLayersOptions) {
  const vessels = useVesselStore((s) => s.vessels);
  const pingFlash = useVesselStore((s) => s.pingFlash);
  const selectedVessel = useVesselStore((s) => s.selectedVessel);

  const vesselList = useMemo(() => Array.from(vessels.values()), [vessels]);
  const now = Date.now();

  return useMemo(() => {
    const scatter = new ScatterplotLayer({
      id: 'vessels',
      data: vesselList,
      getPosition: (v: Vessel) => [v.longitude, v.latitude],
      getFillColor: (v: Vessel) => {
        if (v.is_simulated) return [239, 68, 68, 255] as [number, number, number, number];
        return RISK_RGBA[v.risk_level];
      },
      getRadius: (v: Vessel) => {
        const flashAt = pingFlash.get(v.mmsi);
        const flash = flashAt && now - flashAt < 2000;
        const base = v.is_simulated ? 80000 : 50000;
        const criticalPulse = v.risk_level === 'CRITICAL' ? pulseScale : 1;
        return flash ? base * 1.8 * pulseScale : base * criticalPulse;
      },
      radiusMinPixels: 4,
      radiusMaxPixels: vesselList.some((v) => v.risk_level === 'CRITICAL') ? 18 : 14,
      pickable: true,
      onClick,
      onHover,
      updateTriggers: {
        getPosition: [vesselRevision],
        getFillColor: [vesselRevision],
        getRadius: [vesselRevision, pulseScale, tick, pingFlash.size],
      },
    });

    let trails = null;
    if (showTrail) {
      const trailData = vesselList
        .filter((v) => v.route_history.length >= 2)
        .map((v) => ({
          path: v.route_history.map((p) => [p.longitude, p.latitude] as [number, number]),
          color: RISK_RGBA[v.risk_level],
        }));

      if (!trailData.length && selectedVessel && selectedVessel.route_history.length >= 2) {
        trailData.push({
          path: selectedVessel.route_history.map((p) => [p.longitude, p.latitude]),
          color: RISK_RGBA[selectedVessel.risk_level],
        });
      }

      if (trailData.length) {
        trails = new PathLayer({
          id: 'vessel-trails',
          data: trailData,
          getPath: (d: { path: [number, number][] }) => d.path,
          getColor: (d: { color: [number, number, number, number] }) => [
            d.color[0],
            d.color[1],
            d.color[2],
            120,
          ],
          getWidth: 2,
          widthMinPixels: 1,
          updateTriggers: { getPath: [vesselRevision, selectedVessel?.mmsi] },
        });
      }
    }

    const simulated = vesselList.filter((v) => v.is_simulated);
    const pulseLayer = simulated.length
      ? new ScatterplotLayer({
          id: 'simulated-pulse',
          data: simulated,
          getPosition: (v: Vessel) => [v.longitude, v.latitude],
          getFillColor: [239, 68, 68, Math.floor(80 + pulseScale * 60)],
          getRadius: 120000 * pulseScale,
          radiusMinPixels: 12,
          radiusMaxPixels: 28,
          pickable: false,
          updateTriggers: { getRadius: [pulseScale], getPosition: [vesselRevision] },
        })
      : null;

    return [scatter, trails, pulseLayer].filter(Boolean);
  }, [
    vesselList,
    vesselRevision,
    pulseScale,
    tick,
    pingFlash,
    now,
    onClick,
    onHover,
    showTrail,
    selectedVessel,
  ]);
}

export function useVesselLayerHandlers(setHovered: (v: Vessel | null) => void) {
  const selectVessel = useVesselStore((s) => s.selectVessel);

  const onClick = useCallback(
    (info: PickingInfo<Vessel>) => {
      if (info.object) selectVessel(info.object.mmsi);
    },
    [selectVessel],
  );

  const onHover = useCallback(
    (info: PickingInfo<Vessel>) => {
      setHovered(info.object ?? null);
    },
    [setHovered],
  );

  return { onClick, onHover };
}
