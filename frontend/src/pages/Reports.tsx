import { memo, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReportCard } from '../components/reports/ReportCard';
import { ReportDetail } from '../components/reports/ReportDetail';
import { STITCH } from '../constants/stitchAssets';
import { STITCH_REPORT_STATS } from '../constants/vesselMockData';
import { getAllReports } from '../api/reports';
import { useAgentStore } from '../store/agentStore';
import { useVesselStore } from '../store/vesselStore';

export const Reports = memo(function Reports() {
  const storedReports = useAgentStore((s) => s.reports);
  const selectedReport = useAgentStore((s) => s.selectedReport);
  const setSelectedReport = useAgentStore((s) => s.setSelectedReport);
  const setReport = useAgentStore((s) => s.setReport);
  const vessels = useVesselStore((s) => s.vessels);
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reports = useMemo(
    () =>
      Array.from(storedReports.values()).sort(
        (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime(),
      ),
    [storedReports],
  );

  useEffect(() => {
    const mmsiParam = params.get('mmsi');
    if (mmsiParam && storedReports.has(mmsiParam)) {
      setSelectedReport(storedReports.get(mmsiParam)!);
    }
  }, [params, storedReports, setSelectedReport]);

  useEffect(() => {
    const candidates = Array.from(vessels.values())
      .filter((v) => v.is_simulated || v.risk_score >= 50)
      .map((v) => v.mmsi)
      .filter((mmsi) => !storedReports.has(mmsi));

    if (!candidates.length) return;

    setLoading(true);
    getAllReports(candidates.slice(0, 10))
      .then((fetched) => {
        fetched.forEach((r) => setReport(r));
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, [vessels, storedReports, setReport]);

  const stats = useMemo(() => {
    const escalated = reports.filter((r) => r.requires_escalation).length;
    const monitored = reports.filter((r) => !r.requires_escalation && r.urgency_level === 'MONITOR').length;
    const noAction = reports.filter((r) => !r.requires_escalation && r.urgency_level === 'NONE').length;
    return {
      total: reports.length || STITCH_REPORT_STATS.total,
      escalated: escalated || STITCH_REPORT_STATS.escalated,
      monitored: monitored || STITCH_REPORT_STATS.monitored,
      noAction: noAction || STITCH_REPORT_STATS.noAction,
    };
  }, [reports]);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#051424]">
      <div className="flex flex-col pt-6 pb-[38px] px-6 gap-6">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[#D4E4FA] text-[32px] font-bold block">Escalation Reports</span>
            <span className="text-[#E0C0B1] text-sm">AI-generated humanitarian intervention packages</span>
          </div>
          <div className="flex items-center mt-5 gap-4">
            <button
              type="button"
              className="flex items-center bg-[#1C2B3C] text-left py-2 px-[17px] gap-1 rounded border border-solid border-[#584237]"
            >
              <span className="text-[#D4E4FA] text-sm">All Urgency Levels</span>
              <img src={STITCH.reportFilter} alt="" className="w-3.5 h-3.5 rounded object-fill" />
            </button>
            <button
              type="button"
              className="flex items-center bg-[#F97316] text-left py-2 px-6 gap-1 rounded border-0"
            >
              <img src={STITCH.reportExport} alt="" className="w-3.5 h-3.5 rounded object-fill" />
              <span className="text-[#582200] text-base">Export All</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {[
            { label: 'Total Reports', value: stats.total, color: 'text-[#D4E4FA]' },
            { label: 'Escalated', value: stats.escalated, color: 'text-[#FFB4AB]' },
            { label: 'Monitored', value: stats.monitored, color: 'text-[#F97316]' },
            { label: 'No Action', value: stats.noAction, color: 'text-[#D4E4FA]' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="flex flex-1 flex-col items-start bg-[#122131] py-[17px] pl-[17px] rounded border border-solid border-[#584237]"
            >
              <span className="text-[#E0C0B1] text-xs font-bold">{label}</span>
              <span className={`text-2xl font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {loading && <p className="text-[#E0C0B1] text-sm">Loading reports…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {reports.length === 0 ? (
          <p className="text-[#E0C0B1] bg-[#122131] border border-solid border-[#584237] p-8 text-center">
            No reports yet. Run an investigation from the Live Map to generate escalation packages.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reports.map((report) => (
              <ReportCard key={report.report_id} report={report} onSelect={setSelectedReport} />
            ))}
          </div>
        )}
      </div>

      {selectedReport && (
        <ReportDetail report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
});
