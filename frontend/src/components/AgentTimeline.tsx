import { useState } from 'react';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { useVesselStore } from '../store/vesselStore';
import type { AgentEvent } from '../types';

const AGENTS = [
  { key: 'monitoring', label: 'Monitoring Agent' },
  { key: 'investigation', label: 'Investigation Agent' },
  { key: 'risk', label: 'Risk Agent' },
  { key: 'compliance', label: 'Compliance Agent' },
  { key: 'escalation', label: 'Escalation Agent' },
] as const;

function getAgentStatus(
  agentKey: string,
  events: AgentEvent[],
): { status: 'pending' | 'running' | 'complete' | 'error'; event?: AgentEvent } {
  const agentEvents = events.filter((e) => e.agent_name === agentKey);
  if (!agentEvents.length) return { status: 'pending' };
  const latest = agentEvents[agentEvents.length - 1];
  if (latest.status === 'error') return { status: 'error', event: latest };
  if (latest.status === 'running') return { status: 'running', event: latest };
  return { status: 'complete', event: latest };
}

export function AgentTimeline() {
  const selectedMmsi = useVesselStore((s) => s.selectedMmsi);
  const events = useVesselStore((s) =>
    selectedMmsi ? s.agentEvents[selectedMmsi] || [] : [],
  );
  const report = useVesselStore((s) =>
    selectedMmsi ? s.latestReports[selectedMmsi] : null,
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="h-full overflow-y-auto bg-ocean-card border border-ocean-border rounded-lg p-5">
      <h2 className="text-lg font-bold text-ocean-primary mb-4">Agent Activity Timeline</h2>

      {!selectedMmsi ? (
        <p className="text-ocean-secondary text-sm">Select a vessel to view agent activity</p>
      ) : (
        <div className="space-y-4">
          {AGENTS.map(({ key, label }) => {
            const { status, event } = getAgentStatus(key, events);
            const isEscalation = key === 'escalation';

            return (
              <div key={key}>
                <div
                  className={`flex items-start gap-3 ${
                    status === 'complete' ? 'cursor-pointer' : ''
                  }`}
                  onClick={() =>
                    status === 'complete' && event
                      ? setExpanded(expanded === key ? null : key)
                      : undefined
                  }
                >
                  <div className="mt-0.5">
                    {status === 'pending' && (
                      <Circle className="w-5 h-5 text-slate-600" />
                    )}
                    {status === 'running' && (
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-ocean-accent animate-pulse" />
                        <Loader2 className="w-4 h-4 text-ocean-accent animate-spin" />
                      </div>
                    )}
                    {status === 'complete' && (
                      <CheckCircle2 className="w-5 h-5 text-risk-low" />
                    )}
                    {status === 'error' && (
                      <XCircle className="w-5 h-5 text-risk-critical" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        status === 'pending' ? 'text-slate-500' : 'text-ocean-primary'
                      }`}
                    >
                      {label}
                    </p>
                    <p className="text-xs text-ocean-secondary uppercase tracking-wide">
                      {status}
                    </p>
                    {event && status !== 'pending' && (
                      <p className="text-sm text-ocean-secondary mt-1">{event.output_summary}</p>
                    )}
                    {expanded === key && event?.reasoning && (
                      <pre className="mt-2 p-3 text-xs bg-ocean-surface rounded border border-ocean-border whitespace-pre-wrap text-ocean-secondary max-h-40 overflow-y-auto">
                        {event.reasoning}
                      </pre>
                    )}
                  </div>
                </div>

                {isEscalation && status === 'complete' && report && (
                  report.requires_escalation ? (
                    <div className="rounded-lg border border-red-700/60 bg-red-950/30 p-4 mt-2 escalation-alert-card ml-8">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse urgency-badge-critical">
                        ⚠ {report.urgency_level}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-red-200">
                        {report.key_findings[0] || 'Escalation required'}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-teal-800/40 bg-teal-950/30 p-4 mt-2 no-action-card ml-8">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-900/50 text-teal-300 urgency-badge-monitor">
                        {report.urgency_level}
                      </span>
                      <p className="mt-2 text-sm text-ocean-secondary">
                        {report.no_action_reason}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Recheck in {report.recheck_interval_hours}h
                      </p>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
