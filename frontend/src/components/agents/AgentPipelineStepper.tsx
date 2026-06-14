import { memo } from 'react';
import { STITCH } from '../../constants/stitchAssets';
import type { AgentEvent } from '../../types';

const STEPS = [
  { key: 'monitoring', label: 'Monitoring', icon: STITCH.pipelineMonitoring },
  { key: 'investigation', label: 'Investigation', icon: STITCH.pipelineInvestigation },
  { key: 'risk', label: 'Risk', icon: null },
  { key: 'compliance', label: 'Compliance', icon: STITCH.pipelineCompliance },
  { key: 'escalation', label: 'Escalation', icon: STITCH.pipelineEscalation },
] as const;

function stepStatus(events: AgentEvent[], key: string, index: number): 'done' | 'active' | 'pending' {
  const evts = events.filter((e) => e.agent_name === key);
  if (evts.some((e) => e.status === 'running')) return 'active';
  if (evts.some((e) => e.status === 'complete' || e.status === 'timeout')) return 'done';

  const priorKeys = STEPS.slice(0, index).map((s) => s.key);
  const priorDone = priorKeys.every((k) =>
    events.some((e) => e.agent_name === k && (e.status === 'complete' || e.status === 'timeout')),
  );
  if (priorDone && index === priorKeys.length) return 'active';
  return 'pending';
}

export const AgentPipelineStepper = memo(function AgentPipelineStepper({
  events,
}: {
  events: AgentEvent[];
}) {
  return (
    <div className="flex items-center self-stretch px-2.5 mb-[49px]">
      {STEPS.map((step, index) => {
        const status = stepStatus(events, step.key, index);
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.key} className="contents">
            <div
              className={`flex flex-col items-center gap-2.5 ${
                step.key === 'risk' ? 'shrink-0 mr-9' : 'flex-1'
              } ${index === 0 ? 'mr-[18px]' : index === 1 ? 'mr-[13px]' : index === 3 ? 'mr-4' : ''}`}
            >
              {status === 'active' && step.key === 'risk' ? (
                <div className="items-start p-2 rounded-xl border-2 border-solid border-[#F97316]">
                  <div className="bg-[#F97316] w-2 h-2 rounded-xl" />
                </div>
              ) : status === 'active' && step.key === 'investigation' ? (
                <div className="items-start p-2 rounded-xl border-2 border-solid border-[#F97316]">
                  <div className="bg-[#F97316] w-2 h-2 rounded-xl" />
                </div>
              ) : step.icon ? (
                <img src={step.icon} alt="" className="w-3.5 h-3.5 object-fill" />
              ) : (
                <div className="items-start p-2 rounded-xl border-2 border-solid border-[#F97316]">
                  <div className="bg-[#F97316] w-2 h-2 rounded-xl" />
                </div>
              )}
              <span
                className={`text-[11px] ${
                  status === 'active' ? 'text-[#FFB690]' : 'text-[#D4E4FA]'
                } ${status === 'pending' && step.key !== 'monitoring' && step.key !== 'investigation' ? 'text-[#E0C0B1]' : ''}`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 ${
                  status === 'done' || (index < STEPS.length - 1 && stepStatus(events, STEPS[index + 1].key, index + 1) !== 'pending')
                    ? 'bg-[#F97316]'
                    : 'bg-slate-800'
                } ${index === 0 ? 'mr-3.5' : index === 1 ? 'mr-[37px]' : index === 2 ? 'mr-[17px]' : 'mr-[21px]'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});
