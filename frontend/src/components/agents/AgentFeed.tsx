import { memo } from 'react';
import type { AgentEvent } from '../../types';

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

const AGENT_LABELS: Record<AgentEvent['agent_name'], string> = {
  monitoring: 'Monitoring Agent',
  investigation: 'Investigation Agent',
  risk: 'Risk Agent',
  compliance: 'Compliance Agent',
  escalation: 'Escalation Agent',
};

export const AgentFeed = memo(function AgentFeed({ events }: { events: AgentEvent[] }) {
  if (!events.length) {
    return (
      <div className="flex flex-col items-start bg-[#0D1C2D] pt-[17px] px-[17px] border border-solid border-[#584237]">
        <span className="text-[#E0C0B1] text-sm pb-4">Waiting for agent activity…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start bg-[#0D1C2D] pt-[17px] px-[17px] gap-[33px] border border-solid border-[#584237] max-h-[520px] overflow-y-auto">
      {events.slice(0, 20).map((event) => (
        <div key={event.event_id} className="flex flex-col items-start gap-1 w-full">
          <div className="flex items-center w-full">
            <span className="text-[#FFB690] text-xs font-bold mr-auto">
              {AGENT_LABELS[event.agent_name]}
            </span>
            <span className="text-[#E0C0B1] text-[11px]">{timeAgo(event.timestamp)}</span>
          </div>
          <div className="flex items-start gap-2">
            <div
              className="w-1.5 h-1.5 rounded-xl mt-1.5 shrink-0"
              style={{
                background:
                  event.status === 'complete' || event.status === 'timeout'
                    ? '#10b981'
                    : event.status === 'running'
                      ? '#F59E0B'
                      : '#ef4444',
              }}
            />
            <span className="text-[#E0C0B1] text-sm">
              {event.input_summary || event.output_summary}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
});
