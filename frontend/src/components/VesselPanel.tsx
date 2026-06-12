import { useState } from 'react';
import { Play, Ship } from 'lucide-react';
import { useVesselStore } from '../store/vesselStore';
import { RISK_COLORS } from '../types';
import { RiskBadge } from './RiskBadge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function VesselPanel() {
  const selectedMmsi = useVesselStore((s) => s.selectedMmsi);
  const vessel = useVesselStore((s) => (selectedMmsi ? s.vessels[selectedMmsi] : null));
  const activeInvestigation = useVesselStore((s) => s.activeInvestigation);
  const setActiveInvestigation = useVesselStore((s) => s.setActiveInvestigation);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const investigating =
    loading || (activeInvestigation && activeInvestigation.mmsi === selectedMmsi);

  async function handleInvestigate() {
    if (!vessel) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/vessels/${vessel.mmsi}/investigate`, {
        method: 'POST',
      });
      if (res.status === 409) {
        setError('Another investigation is currently in progress');
        return;
      }
      if (!res.ok) throw new Error('Investigation failed');
      const data = await res.json();
      setActiveInvestigation({ mmsi: vessel.mmsi, investigation_id: data.investigation_id });
    } catch {
      setError('Failed to start investigation');
    } finally {
      setLoading(false);
    }
  }

  if (!vessel) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-ocean-secondary p-6 bg-ocean-card border border-ocean-border rounded-lg">
        <Ship className="w-12 h-12 mb-3 opacity-40" />
        <p>Select a vessel on the map</p>
      </div>
    );
  }

  const enrichment = vessel.is_simulated
    ? { crew: vessel.mmsi === 'SIM001' ? 18 : vessel.mmsi === 'SIM002' ? 22 : 14,
        wages: vessel.mmsi === 'SIM001' ? 84000 : vessel.mmsi === 'SIM002' ? 46500 : 93000 }
    : null;

  return (
    <div className="h-full overflow-y-auto bg-ocean-card border border-ocean-border rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-ocean-primary">{vessel.name}</h2>
          <p className="text-sm text-ocean-secondary">MMSI: {vessel.mmsi}</p>
        </div>
        <RiskBadge level={vessel.risk_level} score={Math.round(vessel.risk_score)} />
      </div>

      <div className="w-full h-3 bg-ocean-border rounded-full overflow-hidden mb-4">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${vessel.risk_score}%`,
            backgroundColor: RISK_COLORS[vessel.risk_level],
          }}
        />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
        <dt className="text-ocean-secondary">Flag</dt>
        <dd>{vessel.flag_state}</dd>
        <dt className="text-ocean-secondary">Type</dt>
        <dd>{vessel.vessel_type}</dd>
        <dt className="text-ocean-secondary">Owner</dt>
        <dd className="col-span-1 truncate">{vessel.owner}</dd>
        <dt className="text-ocean-secondary">Operator</dt>
        <dd>{vessel.operator}</dd>
        <dt className="text-ocean-secondary">Speed</dt>
        <dd>{vessel.speed.toFixed(1)} kn</dd>
        <dt className="text-ocean-secondary">Heading</dt>
        <dd>{vessel.heading.toFixed(0)}°</dd>
        <dt className="text-ocean-secondary">Last Port</dt>
        <dd>{vessel.last_port}</dd>
        <dt className="text-ocean-secondary">Destination</dt>
        <dd>{vessel.destination}</dd>
        <dt className="text-ocean-secondary">Days Stationary</dt>
        <dd>{vessel.days_stationary}</dd>
        <dt className="text-ocean-secondary">AIS Gap</dt>
        <dd>{vessel.ais_gap_hours.toFixed(1)}h</dd>
      </dl>

      {enrichment && (
        <div className="mb-4 p-3 bg-ocean-surface rounded border border-ocean-border text-sm">
          <p>{enrichment.crew} crew aboard</p>
          <p className="text-risk-critical font-semibold">
            ${enrichment.wages.toLocaleString()} unpaid wages
          </p>
        </div>
      )}

      {vessel.risk_factors.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-ocean-secondary mb-1">Risk Factors</p>
          <div className="flex flex-wrap gap-1">
            {vessel.risk_factors.map((f) => (
              <span
                key={f}
                className="text-xs px-2 py-0.5 rounded bg-ocean-surface border border-ocean-border"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-risk-critical mb-2">{error}</p>}

      <button
        onClick={handleInvestigate}
        disabled={!!investigating}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-ocean-accent text-ocean-bg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <Play className="w-4 h-4" />
        {investigating ? 'INVESTIGATING...' : 'INVESTIGATE'}
      </button>
    </div>
  );
}
