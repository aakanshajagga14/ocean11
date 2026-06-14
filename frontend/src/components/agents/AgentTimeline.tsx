import { memo } from 'react';
import type { AgentEvent } from '../../types';

const AGENTS = [
  { key: 'monitoring', label: 'Monitoring Agent' },
  { key: 'investigation', label: 'Investigation Agent' },
  { key: 'risk', label: 'Risk Agent' },
  { key: 'compliance', label: 'Compliance Agent' },
  { key: 'escalation', label: 'Escalation Agent' },
] as const;

function latestEvent(events: AgentEvent[], agentKey: string): AgentEvent | undefined {
  const filtered = events.filter((e) => e.agent_name === agentKey);
  return filtered[filtered.length - 1];
}

export const AgentTimeline = memo(function AgentTimeline({
  events,
  compact = false,
}: {
  events: AgentEvent[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {AGENTS.map(({ key, label }) => {
        const event = latestEvent(events, key);
        const status = !event
          ? 'pending'
          : event.status === 'running'
            ? 'running'
            : event.status === 'error'
              ? 'error'
              : event.status === 'timeout'
                ? 'timeout'
                : 'complete';

        return (
          <div key={key} className="flex items-start gap-3">
            <div className="mt-1 w-2 h-2 rounded-full shrink-0"
              style={{
                background:
                  status === 'complete' || status === 'timeout'
                    ? '#10b981'
                    : status === 'running'
                      ? '#f97316'
                      : status === 'error'
                        ? '#ef4444'
                        : '#475569',
                boxShadow: status === 'running' ? '0 0 8px #f97316' : undefined,
              }}
            />
            <div>
              <p className={`text-sm font-medium ${status === 'pending' ? 'text-slate-500' : 'text-ocean-primary'}`}>
                {label}
              </p>
              {event && (
                <p className="text-xs text-ocean-muted mt-0.5">{event.output_summary}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
