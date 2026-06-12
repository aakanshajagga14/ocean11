import { useWebSocket } from './hooks/useWebSocket';
import { StatsBar } from './components/StatsBar';
import { GlobalMap } from './components/GlobalMap';
import { VesselPanel } from './components/VesselPanel';
import { AgentTimeline } from './components/AgentTimeline';
import { EscalationReportViewer } from './components/EscalationReport';

function App() {
  useWebSocket();

  return (
    <div className="h-screen flex flex-col bg-ocean-bg overflow-hidden">
      <StatsBar />
      <div className="flex-1 min-h-0 grid grid-rows-[1fr_auto]">
        <div className="min-h-0 border-b border-ocean-border">
          <GlobalMap />
        </div>
        <div className="grid grid-cols-2 gap-4 p-4 h-80 min-h-[320px]">
          <div className="flex flex-col gap-3 min-h-0">
            <VesselPanel />
            <EscalationReportViewer />
          </div>
          <AgentTimeline />
        </div>
      </div>
    </div>
  );
}

export default App;
