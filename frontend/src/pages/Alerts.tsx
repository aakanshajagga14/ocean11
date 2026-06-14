import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsBar } from '../components/layout/StatsBar';
import { AlertRow } from '../components/alerts/AlertRow';
import { STITCH } from '../constants/stitchAssets';
import { getAlerts, dismissAlert } from '../api/alerts';
import { useAgentStore } from '../store/agentStore';
import { useStatsStore } from '../store/statsStore';
import { useVesselStore } from '../store/vesselStore';
import type { Alert } from '../types';

export const Alerts = memo(function Alerts() {
  const stats = useStatsStore((s) => s.stats);
  const wsAlerts = useAgentStore((s) => s.alerts);
  const setAlerts = useAgentStore((s) => s.setAlerts);
  const selectVessel = useVesselStore((s) => s.selectVessel);
  const navigate = useNavigate();
  const [alerts, setLocalAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | Alert['risk_level']>('ALL');

  useEffect(() => {
    setLoading(true);
    getAlerts()
      .then((data) => {
        setLocalAlerts(data);
        setAlerts(data);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load alerts'))
      .finally(() => setLoading(false));
  }, [setAlerts]);

  const merged = useMemo(() => {
    const map = new Map<string, Alert>();
    [...alerts, ...wsAlerts].forEach((a) => map.set(a.alert_id, a));
    return Array.from(map.values()).sort((a, b) => b.risk_score - a.risk_score);
  }, [alerts, wsAlerts]);

  const filtered = useMemo(
    () => (filter === 'ALL' ? merged : merged.filter((a) => a.risk_level === filter)),
    [merged, filter],
  );

  function handleInvestigate(mmsi: string) {
    selectVessel(mmsi);
    navigate(`/?mmsi=${mmsi}`);
  }

  function handleDismiss(alertId: string) {
    dismissAlert(alertId);
    setLocalAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
  }

  const filters: ('ALL' | Alert['risk_level'])[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#050A14]">
      <StatsBar stats={stats} variant="alerts" />
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-white text-[32px] font-bold block">ACTIVE ALERTS</span>
            <span className="text-[#E0C0B1] text-sm">
              Real-time anomaly detection across monitored vessels
            </span>
          </div>
          <div className="flex items-center gap-[9px]">
            <div className="flex items-center bg-[#122131] py-1 rounded-sm px-1">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={
                    filter === f
                      ? 'bg-[#F97316] py-[3px] px-4 rounded-sm text-[#582200] text-xs font-bold mx-1'
                      : 'text-[#E0C0B1] text-xs font-bold px-4'
                  }
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center py-[9px] rounded-sm border border-solid border-[#1E3A5F]">
              <img src={STITCH.alertMarkRead} alt="" className="w-3.5 h-3.5 ml-[17px] mr-1 rounded-sm object-fill" />
              <span className="text-[#E0C0B1] text-xs font-bold mr-7">MARK ALL READ</span>
            </div>
          </div>
        </div>

        {loading && <p className="text-[#E0C0B1] mb-4">Loading alerts…</p>}
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="flex flex-col gap-2 mb-10">
          {filtered.length === 0 ? (
            <p className="text-[#E0C0B1] bg-[#0D1B2A] border border-solid border-[#1E3A5F] p-8 text-center">
              No active alerts matching filter.
            </p>
          ) : (
            filtered.map((alert) => (
              <AlertRow
                key={alert.alert_id}
                alert={alert}
                onInvestigate={handleInvestigate}
                onDismiss={handleDismiss}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});
