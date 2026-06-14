/*
 * STITCH AUDIT — page1/page2/page3/page4 (Ocean11 Stitch exports)
 * ----------------------------------------------------------------
 * page1 (Ocean11FullBleedCommandCenter): Navbar, StatsBar (847/23/7/4 mock),
 *   static map background image, map zoom controls, active alerts strip,
 *   VesselPanel with Overview/Voyage/History tabs, risk score card, INVESTIGATE btn.
 * page2 (Ocean11InvestigationsDashboard): Investigation stats, active investigation
 *   cards with 5-agent pipeline stepper, agent activity feed, completed list,
 *   pipeline performance bars (all hardcoded).
 * page3 (Ocean11RefinedAlertsPage): Navbar, alert stat chips, filter tabs,
 *   alert feed rows with INVESTIGATE/DISMISS, recent dismissals (all mock).
 * page4 (Ocean11EscalationReports): Navbar, report stat cards, report grid cards
 *   with urgency stripes (all mock vessel names/scores).
 *
 * MOCK DATA REMOVED: All hardcoded vessel names, scores, counts, agent messages.
 * STYLING: Normalized to Tailwind with ocean-* design tokens from Stitch palette
 *   (#051424 bg, #FFB690 accent, #584237 borders, #122131 cards).
 * SHARED COMPONENTS: Navbar + StatsBar extracted to components/layout/.
 * BROKEN IN STITCH: No routing, alert() handlers, external CDN images for map,
 *   invalid JSX quotes (""Moderate data""), no TypeScript, duplicate nav per page.
 * WIRED TO: FastAPI @ localhost:8000 — /vessels/snapshot, /ws/feed, /investigate, /reports.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { useWebSocket } from './hooks/useWebSocket';
import { LiveMap } from './pages/LiveMap';
import { Investigations } from './pages/Investigations';
import { Reports } from './pages/Reports';
import { Alerts } from './pages/Alerts';

function AppShell() {
  useWebSocket();

  return (
    <div className="h-screen flex flex-col bg-[#050A14] overflow-hidden">
      <Navbar />
      <main className="flex-1 min-h-0 overflow-hidden">
        <Routes>
          <Route path="/" element={<LiveMap />} />
          <Route path="/investigations" element={<Investigations />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
