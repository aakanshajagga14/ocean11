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
