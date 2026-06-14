import { memo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STITCH } from '../../constants/stitchAssets';
import { useAgentStore } from '../../store/agentStore';
import { useVesselStore } from '../../store/vesselStore';
import { useInvestigation } from '../../hooks/useInvestigation';
import { STITCH_VESSEL } from '../../constants/vesselMockData';
import type { AgentEvent, InvestigateButtonState } from '../../types';
import { VesselHistory } from './VesselHistory';
import { VesselOverview } from './VesselOverview';
import { VesselVoyage } from './VesselVoyage';

const AGENTS = ['monitoring', 'investigation', 'risk', 'compliance', 'escalation'] as const;

type Tab = 'overview' | 'voyage' | 'history';

function agentStatus(name: (typeof AGENTS)[number], events: AgentEvent[]) {
  const evts = events.filter((e) => e.agent_name === name);
  if (!evts.length) return 'pending';
  const latest = evts[evts.length - 1];
  if (latest.status === 'running') return 'running';
  if (latest.status === 'complete' || latest.status === 'timeout') return 'complete';
  return 'error';
}

export const VesselPanel = memo(function VesselPanel() {
  const vessel = useVesselStore((s) => s.selectedVessel);
  const clearSelection = useVesselStore((s) => s.clearSelection);
  const events = useAgentStore((s) =>
    vessel ? s.agentEvents.filter((e) => e.vessel_mmsi === vessel.mmsi) : [],
  );
  const [tab, setTab] = useState<Tab>('overview');

  const displayName = vessel?.name?.toUpperCase() || STITCH_VESSEL.name;
  const { state, error, startInvestigation, retry } = useInvestigation(
    vessel?.mmsi ?? null,
    displayName,
  );

  if (!vessel) {
    return (
      <div className="h-full flex items-center justify-center bg-[#051424] border-l border-solid border-[#584237] text-[#E0C0B1] p-6">
        <p className="text-sm">Select a vessel on the map</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'voyage', label: 'Voyage' },
    { key: 'history', label: 'History' },
  ];

  return (
    <aside className="w-[420px] shrink-0 h-full overflow-y-auto bg-[#051424] border-l border-solid border-[#584237] flex flex-col">
      {/* Header — Stitch Vessel Focus */}
      <div className="pt-4 px-4 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-[#E0C0B1] text-[11px] font-bold block mb-1">Vessel Focus</span>
            <span className="text-[#D4E4FA] text-sm font-bold block mb-2">{displayName}</span>
            <div className="flex items-center gap-2">
              <span className="bg-[#FFB4AB1A] py-0.5 px-2 rounded-sm text-[#FFB4AB] text-[11px] font-bold">
                {STITCH_VESSEL.riskLabel}
              </span>
              <span className="text-[#E0C0B1] text-[11px]">{STITCH_VESSEL.imo}</span>
            </div>
          </div>
          <button type="button" onClick={clearSelection} className="text-[#E0C0B1] hover:opacity-80">
            <img src={STITCH.closePanel} alt="" className="w-6 h-6 object-fill" />
          </button>
        </div>

        {/* Last photo strip */}
        <div
          className="flex items-center gap-2 py-2 px-3 mb-2 rounded-sm"
          style={{ background: 'linear-gradient(180deg, #051424, transparent)' }}
        >
          <img src={STITCH.camera} alt="" className="w-3.5 h-3.5 object-fill" />
          <span className="text-[#E0C0B1] text-[11px]">{STITCH_VESSEL.lastPhoto}</span>
        </div>

        {/* Tabs — Stitch style */}
        <div className="flex items-center bg-[#051424] py-[11px] mb-4 gap-6">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`text-xs font-bold capitalize ${
                tab === key ? 'text-[#FFB690]' : 'text-[#E0C0B1]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 flex-1 pb-4">
        {tab === 'overview' && <VesselOverview vessel={vessel} />}
        {tab === 'voyage' && <VesselVoyage />}
        {tab === 'history' && <VesselHistory />}
      </div>

      {/* Footer — Stitch buttons + agent progress when investigating */}
      <div className="flex flex-col items-start bg-[#122131] p-4 gap-4 border-t border-solid border-[#584237]">
        <InvestigateFooter
          state={state}
          mmsi={vessel.mmsi}
          onStart={startInvestigation}
          onRetry={retry}
          events={events}
        />
        {error && <p className="text-[#FFB4AB] text-xs">{error}</p>}
      </div>
    </aside>
  );
});

function InvestigateFooter({
  state,
  mmsi,
  onStart,
  onRetry,
  events,
}: {
  state: InvestigateButtonState;
  mmsi: string;
  onStart: () => void;
  onRetry: () => void;
  events: AgentEvent[];
}) {
  const showAgents = state === 'loading' || state === 'running' || state === 'done';

  if (state === 'done') {
    return (
      <>
        <Link
          to={`/reports?mmsi=${mmsi}`}
          className="w-full flex items-center justify-center bg-[#22c55e] py-3.5 rounded-sm text-white text-sm font-bold"
        >
          VIEW REPORT →
        </Link>
        <button
          type="button"
          className="w-full flex items-center justify-center bg-transparent py-3 rounded-sm border border-solid border-[#F97316] text-[#F97316] text-sm font-bold"
        >
          MONITOR ON WATCHLIST
        </button>
      </>
    );
  }

  if (state === 'error') {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="w-full flex items-center justify-center bg-[#93000A] py-3.5 rounded-sm text-[#FFB4AB] text-sm font-bold"
      >
        RETRY INVESTIGATION
      </button>
    );
  }

  if (state === 'loading' || state === 'running') {
    return (
      <>
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-2 bg-[#9A3412] py-3.5 rounded-sm text-[#552100] text-sm font-bold opacity-90"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Agents Deploying...
        </button>
        {showAgents && (
          <div className="w-full space-y-2">
            {AGENTS.map((name) => {
              const st = agentStatus(name, events);
              return (
                <div key={name} className="flex items-center gap-2 text-[11px]">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background:
                        st === 'complete'
                          ? '#22c55e'
                          : st === 'running'
                            ? '#F97316'
                            : '#475569',
                      boxShadow: st === 'running' ? '0 0 6px #F97316' : undefined,
                    }}
                  />
                  <span className={st === 'running' ? 'text-[#FFB690]' : 'text-[#E0C0B1]'}>
                    {name.charAt(0).toUpperCase() + name.slice(1)} Agent
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onStart}
        className="w-full flex items-center justify-center gap-3 bg-[#F97316] py-3.5 rounded-sm border-0 text-[#552100] text-sm font-bold"
      >
        <img src={STITCH.investigateBtn} alt="" className="w-5 h-5 rounded-sm object-fill" />
        START INVESTIGATION
      </button>
      <button
        type="button"
        className="w-full flex items-center justify-center gap-3 bg-transparent py-3 rounded-sm border border-solid border-[#F97316] text-[#F97316] text-sm font-bold"
      >
        <img src={STITCH.watchlistBtn} alt="" className="w-6 h-6 rounded-sm object-fill" />
        MONITOR ON WATCHLIST
      </button>
    </>
  );
}
