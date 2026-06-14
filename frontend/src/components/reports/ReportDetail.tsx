import { memo } from 'react';
import { X } from 'lucide-react';
import type { EscalationReport } from '../../types';

interface ReportDetailProps {
  report: EscalationReport;
  onClose: () => void;
}

export const ReportDetail = memo(function ReportDetail({ report, onClose }: ReportDetailProps) {
  const escalated = report.requires_escalation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="bg-ocean-nav border border-ocean-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-ocean-border sticky top-0 bg-ocean-nav">
          <div>
            <h2 className="text-ocean-primary text-xl font-bold">{report.vessel_name}</h2>
            <p className="text-ocean-muted text-sm">MMSI {report.vessel_mmsi}</p>
          </div>
          <button type="button" onClick={onClose} className="text-ocean-muted hover:text-ocean-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {escalated ? (
            <div className="p-4 rounded border border-red-700/60 bg-red-950/30">
              <span className="text-red-300 font-bold text-sm">⚠ {report.urgency_level}</span>
              <p className="text-red-200 text-sm mt-2">{report.key_findings[0]}</p>
            </div>
          ) : (
            <div className="p-4 rounded border border-emerald-800/40 bg-emerald-950/20">
              <span className="text-emerald-400 font-bold text-sm">No Action Needed</span>
              <p className="text-ocean-primary text-sm mt-2">{report.no_action_reason}</p>
            </div>
          )}

          <section>
            <h4 className="text-ocean-muted text-xs font-bold mb-2">Key Findings</h4>
            <ul className="list-disc pl-4 text-sm space-y-1">
              {report.key_findings.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>

          {report.timeline_of_events.length > 0 && (
            <section>
              <h4 className="text-ocean-muted text-xs font-bold mb-2">Timeline</h4>
              <ul className="text-sm space-y-1 text-ocean-muted">
                {report.timeline_of_events.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </section>
          )}

          {report.escalation_targets.length > 0 && (
            <section>
              <h4 className="text-ocean-muted text-xs font-bold mb-2">Escalation Targets</h4>
              {report.escalation_targets.map((t, i) => (
                <div key={i} className="mb-2 p-3 bg-ocean-card rounded border border-ocean-border text-sm">
                  <p className="font-semibold">{t.org}</p>
                  <p className="text-ocean-muted">{t.contact}</p>
                  <p className="italic mt-1">{t.message}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
});
