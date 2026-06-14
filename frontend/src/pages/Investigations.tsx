import { memo, useMemo } from 'react';
import { StatsBar } from '../components/layout/StatsBar';
import { AgentFeed } from '../components/agents/AgentFeed';
import { InvestigationCard } from '../components/investigations/InvestigationCard';
import { STITCH } from '../constants/stitchAssets';
import { useAgentStore } from '../store/agentStore';
import { useStatsStore } from '../store/statsStore';

export const Investigations = memo(function Investigations() {
  const stats = useStatsStore((s) => s.stats);
  const investigations = useAgentStore((s) => s.investigations);
  const agentEvents = useAgentStore((s) => s.agentEvents);

  const active = useMemo(
    () => [...investigations.values()].filter((i) => i.status === 'running'),
    [investigations],
  );
  const completed = useMemo(
    () => [...investigations.values()].filter((i) => i.status === 'complete'),
    [investigations],
  );

  const activeCount = active.length;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#051424]">
      <StatsBar stats={stats} variant="investigations" />
      <div className="px-6 pt-6 pb-10">
        <div className="flex justify-between items-start mb-10">
          <div>
            <span className="text-[#D4E4FA] text-[32px] font-bold block">INVESTIGATIONS</span>
            <span className="text-[#E0C0B1] text-sm">Autonomous 5-agent pipeline activity</span>
          </div>
          <button
            type="button"
            className="flex items-center bg-[#F97316] py-2 px-4 mt-5 gap-2"
          >
            <img src={STITCH.invNewBtn} alt="" className="w-6 h-6 object-fill" />
            <span className="text-[#582200] text-xs font-bold">New Investigation</span>
          </button>
        </div>

        <div className="flex items-start gap-10">
          <div className="flex flex-1 flex-col gap-6">
            <div className="flex items-center">
              <span className="text-[#F97316] text-xs font-bold mr-[17px]">ACTIVE</span>
              <div className="bg-emerald-500 w-2 h-2 mr-2 rounded-xl" />
              <span className="text-[#E0C0B1] text-[11px]">{activeCount} running</span>
            </div>

            {active.length === 0 ? (
              <p className="text-[#E0C0B1] text-sm bg-[#0D1C2D] border border-solid border-[#584237] p-6">
                No active investigations. Trigger one from the Live Map vessel panel.
              </p>
            ) : (
              active.map((inv) => <InvestigationCard key={inv.investigation_id} investigation={inv} />)
            )}

            {completed.length > 0 && (
              <div className="flex flex-col gap-4">
                <span className="text-[#E0C0B1] text-xs font-bold">COMPLETED TODAY</span>
                <div className="flex flex-col gap-2">
                  {completed.map((inv) => (
                    <div
                      key={inv.investigation_id}
                      className="flex justify-between items-center bg-[#122131] py-[9px] px-[17px] border border-solid border-[#584237]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#D4E4FA] text-xl font-bold">{inv.vessel_name}</span>
                        {inv.risk_score_so_far != null && (
                          <div className="flex flex-col items-start bg-[#FFB6901A] py-2 px-[9px] border border-solid border-[#FFB690]">
                            <span className="text-[#FFB690] text-[11px]">
                              RISK {Math.round(inv.risk_score_so_far)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start bg-[#10B98133] py-[3px] px-[9px] border border-solid border-emerald-500">
                        <span className="text-emerald-500 text-[11px] font-bold">COMPLETE</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col shrink-0 gap-4 w-[400px]">
            <div className="flex items-center gap-[27px]">
              <span className="text-[#F97316] text-xs font-bold">AGENT ACTIVITY</span>
              <div className="bg-emerald-500 w-1.5 h-1.5 rounded-xl" />
            </div>
            <AgentFeed events={agentEvents} />
          </div>
        </div>
      </div>
    </div>
  );
});
