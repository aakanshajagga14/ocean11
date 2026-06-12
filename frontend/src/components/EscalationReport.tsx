import { useVesselStore } from '../store/vesselStore';

export function EscalationReportViewer() {
  const selectedMmsi = useVesselStore((s) => s.selectedMmsi);
  const report = useVesselStore((s) =>
    selectedMmsi ? s.latestReports[selectedMmsi] : null,
  );
  const activeInvestigation = useVesselStore((s) => s.activeInvestigation);

  if (!selectedMmsi) return null;

  if (!report && activeInvestigation?.mmsi === selectedMmsi) {
    return (
      <div className="p-4 bg-ocean-card border border-ocean-border rounded-lg animate-pulse">
        <div className="h-4 bg-ocean-border rounded w-1/3 mb-3" />
        <div className="h-3 bg-ocean-border rounded w-full mb-2" />
        <div className="h-3 bg-ocean-border rounded w-2/3" />
      </div>
    );
  }

  if (!report) return null;

  if (!report.requires_escalation) {
    return (
      <div className="p-4 bg-ocean-card border border-teal-800/40 rounded-lg no-action-card">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-900/50 text-teal-300 urgency-badge-monitor">
            {report.urgency_level}
          </span>
          <span className="text-sm text-ocean-secondary">No Action Required</span>
        </div>
        <p className="text-sm text-ocean-primary mb-2">{report.no_action_reason}</p>
        <p className="text-xs text-slate-500">
          Recheck in {report.recheck_interval_hours}h
        </p>
        {report.key_findings.length > 0 && (
          <ul className="mt-3 text-xs text-ocean-secondary list-disc pl-4">
            {report.key_findings.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-ocean-card border border-red-700/60 rounded-lg escalation-alert-card max-h-64 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse urgency-badge-critical">
          ⚠ {report.urgency_level}
        </span>
        <span className="text-sm font-semibold text-red-200">Escalation Report</span>
      </div>

      <section className="mb-3">
        <h4 className="text-xs font-semibold text-ocean-secondary mb-1">Key Findings</h4>
        <ul className="text-sm list-disc pl-4 space-y-1">
          {report.key_findings.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </section>

      <section className="mb-3">
        <h4 className="text-xs font-semibold text-ocean-secondary mb-1">Timeline</h4>
        <ul className="text-xs space-y-1 text-ocean-secondary">
          {report.timeline_of_events.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </section>

      {report.applicable_conventions.length > 0 && (
        <section className="mb-3">
          <h4 className="text-xs font-semibold text-ocean-secondary mb-1">Conventions</h4>
          <p className="text-xs">{report.applicable_conventions.join(', ')}</p>
        </section>
      )}

      {report.flag_state_obligations && (
        <section className="mb-3">
          <h4 className="text-xs font-semibold text-ocean-secondary mb-1">Flag State</h4>
          <p className="text-xs text-ocean-secondary">{report.flag_state_obligations}</p>
        </section>
      )}

      <section className="mb-3">
        <h4 className="text-xs font-semibold text-ocean-secondary mb-1">Escalation Targets</h4>
        {report.escalation_targets.map((t, i) => (
          <div key={i} className="mb-2 p-2 bg-ocean-surface rounded border border-ocean-border text-xs">
            <p className="font-semibold">{t.org} (P{t.priority})</p>
            <p className="text-ocean-secondary">{t.contact}</p>
            <p className="mt-1 italic">{t.message}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
