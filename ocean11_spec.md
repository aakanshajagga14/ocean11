# Ocean11 — Full Product Spec
> Feed this to Kiro for architecture planning, then Cursor for implementation.

---

## 1. One-Line Pitch

**Ocean11 is an autonomous maritime intelligence platform that detects seafarer abandonment, humanitarian crises, and logistics risks before they become global emergencies.**

---

## 2. The Problem

Every year, hundreds of vessels are abandoned by their owners — crews left stranded offshore without pay, food, fuel, or legal help for months or years. The ITF (International Transport Workers' Federation) tracks this manually, reactively, via complaints. There is no intelligent system that detects abandonment *before* it becomes a crisis.

Compounding this: the Red Sea crisis, Houthi attacks, and geopolitical sanctions have made 2024–2026 the most stressed maritime environment since WW2. Abandoned seafarers are the invisible human cost nobody is talking about.

**Ocean11 changes this with a fully autonomous 5-agent pipeline: detect → investigate → assess → verify compliance → escalate.**

---

## 3. Hackathon Theme Fit

| Theme | Fit |
|---|---|
| **Logistics & Transit** | Core — vessel monitoring, port disruption, supply chain risk |
| **Agentic & Autonomous Systems** | Core — 5 specialized AI agents operating as a pipeline |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      HARBORWATCH AI                         │
│                                                             │
│  Layer 1: Data Ingestion                                    │
│  → Real AIS stream (aisstream.io) + simulated crisis data   │
│  → Vessel registry + ITF incident records                   │
│  → Maritime news via web search                             │
│                                                             │
│  Layer 2: Risk Intelligence Engine                          │
│  → Risk scoring (0–100) per vessel                          │
│  → Pattern detection (anchoring, inactivity, AIS gaps)      │
│  → Rule-based heuristics + anomaly detection                │
│                                                             │
│  Layer 3: 5-Agent LangGraph Pipeline                        │
│  → Monitoring Agent    — detects anomalies                  │
│  → Investigation Agent — gathers evidence                   │
│  → Risk Agent          — scores and prioritizes             │
│  → Compliance Agent    — checks legal/labor regulations     │
│  → Escalation Agent    — generates intervention package     │
│                                                             │
│  Layer 4: Dashboard                                         │
│  → Deck.gl global vessel map                                │
│  → Live agent activity timeline                             │
│  → Vessel intelligence panel                                │
│  → Escalation report viewer                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, uvicorn |
| Agent Framework | LangGraph (pipeline orchestration) + CrewAI-style agent roles |
| AI Model | `gemini-2.5-flash` via `google-genai>=1.0.0` |
| AIS Data | aisstream.io WebSocket (real) + Python simulator (crisis scenarios) |
| Risk Engine | Rule-based heuristics + isolation forest (scikit-learn) |
| Real-time | FastAPI WebSocket |
| Frontend | React 18 + Vite, TypeScript |
| Map | Deck.gl + MapLibre GL (no API key needed) |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand |
| Charts | Recharts |

---

## 6. File Structure

```
ocean11/
├── backend/
│   ├── main.py                    # FastAPI app, all routes, WebSocket
│   ├── models.py                  # Pydantic schemas
│   ├── config.py                  # Env vars, constants
│   ├── data/
│   │   ├── ais_client.py          # aisstream.io WebSocket client
│   │   ├── simulator.py           # Simulated abandonment scenarios
│   │   └── vessel_registry.py     # Static vessel/owner/flag data
│   ├── risk/
│   │   ├── scoring.py             # Risk score calculation
│   │   └── patterns.py            # Anomaly detection rules
│   ├── agents/
│   │   ├── pipeline.py            # LangGraph pipeline definition
│   │   ├── monitoring_agent.py    # Agent 1: anomaly detection
│   │   ├── investigation_agent.py # Agent 2: evidence gathering
│   │   ├── risk_agent.py          # Agent 3: risk assessment
│   │   ├── compliance_agent.py    # Agent 4: regulatory check
│   │   └── escalation_agent.py   # Agent 5: intervention package
│   └── requirements.txt
├── simulator/
│   └── crisis_sim.py              # Standalone scenario injector
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── GlobalMap.tsx          # Deck.gl vessel map
    │   │   ├── VesselPanel.tsx        # Selected vessel details
    │   │   ├── AgentTimeline.tsx      # Live agent activity feed
    │   │   ├── RiskBadge.tsx          # Color-coded risk score
    │   │   ├── EscalationReport.tsx   # Final agent output
    │   │   └── StatsBar.tsx           # Top stats strip
    │   ├── store/
    │   │   └── vesselStore.ts
    │   ├── hooks/
    │   │   └── useWebSocket.ts
    │   └── types/
    │       └── index.ts
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## 7. Data Models

### Vessel
```python
class Vessel(BaseModel):
    mmsi: str                        # Maritime Mobile Service Identity
    name: str
    flag_state: str                  # e.g. "Panama", "Liberia"
    vessel_type: str                 # e.g. "Bulk Carrier", "Tanker"
    owner: str
    operator: str
    
    # Position
    latitude: float
    longitude: float
    speed: float                     # knots
    heading: float
    
    # Status
    last_port: str
    destination: str
    days_stationary: int
    last_ais_signal: datetime
    ais_gap_hours: float             # hours since last AIS ping
    
    # Risk
    risk_score: float                # 0–100
    risk_level: str                  # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    risk_factors: list[str]
    
    # Flags
    is_simulated: bool               # True for demo scenarios
    abandonment_confirmed: bool
```

### AgentEvent
```python
class AgentEvent(BaseModel):
    event_id: str
    vessel_mmsi: str
    agent_name: str                  # "monitoring" | "investigation" | "risk" | "compliance" | "escalation"
    timestamp: datetime
    status: str                      # "running" | "complete" | "error"
    input_summary: str               # What the agent received
    output_summary: str              # What the agent produced
    reasoning: str                   # Gemini's reasoning trace
    duration_ms: int
```

### EscalationReport
```python
class EscalationReport(BaseModel):
    report_id: str
    vessel_mmsi: str
    vessel_name: str
    generated_at: datetime
    risk_score: float
    
    requires_escalation: bool        # False = "no action needed" branch
    
    # Crew
    estimated_crew_size: int
    crew_nationalities: list[str]
    days_abandoned: int
    estimated_unpaid_wages_usd: float
    
    # Evidence
    key_findings: list[str]
    timeline_of_events: list[str]
    
    # Legal (empty if requires_escalation is False)
    applicable_conventions: list[str]  # e.g. "MLC 2006", "UNCLOS Article 98"
    flag_state_obligations: str
    port_state_options: str
    
    # Actions
    escalation_targets: list[dict]   # [{org, contact, priority, message}] — empty if no action needed
    recommended_actions: list[str]
    urgency_level: str               # "IMMEDIATE" | "URGENT" | "MONITOR" | "NONE"
    
    # No-action branch fields
    no_action_reason: str | None     # explanation when requires_escalation is False
    recheck_interval_hours: int | None
```

### RiskFactors (constants)
```python
RISK_FACTORS = {
    "days_stationary_30_plus": 25,
    "days_stationary_60_plus": 40,
    "ais_gap_24h": 15,
    "ais_gap_72h": 30,
    "flag_state_high_risk": 15,       # Panama, Comoros, Palau etc
    "owner_dispute_history": 20,
    "prior_itf_incident": 25,
    "no_recent_port_call": 10,
    "crew_complaint_filed": 30,
    "insurance_lapsed": 35,
}
```

---

## 8. LangGraph Agent Pipeline

### Pipeline Definition
```python
# agents/pipeline.py
# LangGraph StateGraph with 5 nodes (agents)
# Each node receives the shared InvestigationState and adds to it

class InvestigationState(TypedDict):
    vessel: Vessel
    events: list[AgentEvent]          # appended by each agent
    evidence: list[str]               # gathered by investigation agent
    risk_assessment: dict             # produced by risk agent
    compliance_findings: dict         # produced by compliance agent
    escalation_report: EscalationReport | None

# Graph flow:
# monitoring_node → investigation_node → risk_node → compliance_node → escalation_node
# Each node is a async function that calls Gemini with structured context
```

### Agent 1 — Monitoring Agent
**Trigger:** Vessel risk score crosses threshold (≥60) OR manual trigger from dashboard
**Input:** Raw vessel telemetry, AIS history, risk factors
**Job:** Detect which specific behavioral anomalies are present
**Output:** List of confirmed anomaly signals with severity
**Gemini prompt focus:** "Given this vessel's behavior over the last N days, which of these anomaly patterns are present and how severe?"

### Agent 2 — Investigation Agent
**Trigger:** Monitoring agent output
**Input:** Anomaly signals + vessel profile
**Job:** Autonomously gather corroborating evidence — cross-reference owner history, flag state record, prior ITF incidents, maritime news
**Output:** Evidence package with source citations
**Gemini prompt focus:** "You are a maritime investigator. Given these anomaly signals, what additional evidence would you expect to find, and what does the available data tell us?"
**Note:** Uses Gemini's web search tool to pull live maritime news about the vessel/owner

### Agent 3 — Risk Assessment Agent
**Trigger:** Investigation agent output
**Input:** Anomaly signals + evidence package
**Job:** Calculate final risk score, classify urgency, prioritize against other active cases
**Output:** Risk report with score breakdown and urgency classification
**Gemini prompt focus:** "As a maritime risk analyst, score this vessel's abandonment risk from 0-100 and justify each contributing factor."

### Agent 4 — Compliance Agent
**Trigger:** Risk agent output (only if risk ≥ 70)
**Input:** Vessel flag state, crew nationalities, risk assessment
**Job:** Identify which international conventions apply, what the flag state is obligated to do, what port state options exist
**Output:** Legal/regulatory analysis
**Gemini prompt focus:** "Under MLC 2006, UNCLOS, and relevant flag state law, what are the legal obligations and available enforcement mechanisms for this vessel?"

### Agent 5 — Escalation Agent
**Trigger:** Compliance agent output
**Input:** Full investigation state
**Job:** Generate complete humanitarian intervention package — who to contact, what to say, in what order, with what urgency. **If risk score < 70 or compliance agent finds no actionable concerns, output a "NO ACTION NEEDED" summary instead of a full intervention package** — explaining why the vessel does not currently warrant escalation, with a recommended re-check interval.
**Output:** Full EscalationReport including draft messages to ITF, flag state authority, nearest port state, relevant NGOs — OR a low-urgency summary report
**Gemini prompt focus:** "Generate a complete escalation package for this maritime case. If the case does not meet escalation thresholds, explain why and recommend monitoring frequency instead."

---

## 9. API Endpoints

### GET `/vessels`
Returns all currently monitored vessels (real AIS + simulated).
Query params: `?risk_level=HIGH&limit=50`

### GET `/vessels/{mmsi}`
Returns full vessel profile + current risk score + all agent events.

### POST `/vessels/{mmsi}/investigate`
Manually trigger the full 5-agent pipeline for a vessel.
Returns: `{ investigation_id, status: "started" }`

### GET `/investigations/{investigation_id}`
Returns current pipeline state — which agents have run, their outputs.

### GET `/reports/{mmsi}`
Returns the latest EscalationReport for a vessel.

### GET `/stats`
Returns: `{ total_monitored, high_risk_count, critical_count, investigations_today, reports_generated }`

### WebSocket `/ws/feed`
Pushes real-time events:
- `vessel_update` — position/risk score change
- `agent_event` — an agent started/completed
- `alert` — new HIGH/CRITICAL vessel detected
- `report_ready` — escalation report generated

---

## 9.5. CRITICAL DESIGN REQUIREMENT — The "No Crisis" Branch

**This is a hard requirement, not optional.**

The pipeline MUST support a non-crisis outcome. If every vessel that enters the pipeline produces a full intervention package with ITF escalation, flag state notification, and "IMMEDIATE" urgency — the system is broken, regardless of how good the individual agent outputs look.

**Why this matters:**
- Most real vessels are NOT being abandoned. If Ocean11 flags everything as critical, it has zero credibility as a triage tool — it's just noise.
- Judges WILL test this. Clicking "Investigate" on a normal, moving, recently-active vessel and getting back "CRITICAL — escalate to ITF immediately" is an instant red flag that the system doesn't actually reason about risk.
- The Compliance and Escalation agents are not allowed to assume escalation is the default outcome. The default outcome for a healthy vessel is **"NO ACTION NEEDED"** with a recheck interval.

**Concretely, this means:**

1. **Risk Agent** must be capable of outputting LOW or MEDIUM risk scores (not just HIGH/CRITICAL), with reasoning that genuinely reflects normal vessel behavior (recent port call, active AIS, no ownership disputes).

2. **Compliance Agent** must be able to output "no regulatory concerns identified" — empty `applicable_conventions`, no flag state obligations triggered — when risk is LOW/MEDIUM.

3. **Escalation Agent** must branch on `requires_escalation`:
   - If `risk_score < 70` → `requires_escalation: false`, populate `no_action_reason` and `recheck_interval_hours`, leave `escalation_targets` empty, `urgency_level: "NONE"` or `"MONITOR"`.
   - If `risk_score >= 70` → full intervention package as originally specced.

4. **Frontend AgentTimeline** must visually render the "no action needed" outcome distinctly from a full escalation — e.g. a calm green/blue summary card, NOT styled like an alert.

5. **Test coverage requirement:** the integration verification step must explicitly test the pipeline against AT LEAST ONE real, normal, low-risk vessel from the live AIS feed — not just the 3 simulated crisis scenarios. If this test produces a "CRITICAL/escalate" result for a normal vessel, the risk scoring and agent prompts must be revised before the build is considered complete.

---

### Real Data (MapLibre background)
```python
# data/ais_client.py
# Connect to aisstream.io free WebSocket
# Filter: vessel types 70-89 (cargo), 80-89 (tankers)
# Ingest: MMSI, position, speed, heading, destination
# Store: in-memory dict keyed by MMSI (max 500 vessels)
# Refresh: live WebSocket stream
```

### Simulated Crisis Scenarios
```python
# simulator/crisis_sim.py
# 3 pre-built scenarios injected on top of real map:

SCENARIO_1 = {
    "name": "MV Esperanza",
    "mmsi": "SIM001",
    "situation": "Bulk carrier, 47 days stationary off Oman coast",
    "crew": 18, "nationalities": ["Philippines", "India", "Myanmar"],
    "days_unpaid": 47, "risk_score": 91,
    "owner": "Oceanic Holdings Ltd (disputed)",
    "flag_state": "Comoros",  # known high-risk flag
}

SCENARIO_2 = {
    "name": "MV Fortuna Star", 
    "mmsi": "SIM002",
    "situation": "Tanker, AIS dark for 72h, last seen Red Sea",
    "crew": 22, "nationalities": ["Ukraine", "Georgia", "India"],
    "days_unpaid": 31, "risk_score": 78,
}

SCENARIO_3 = {
    "name": "MV Konstantinos",
    "mmsi": "SIM003", 
    "situation": "Container ship, crew complaint filed with ITF, owner unreachable",
    "crew": 14, "nationalities": ["Greece", "Philippines"],
    "days_unpaid": 62, "risk_score": 95,
}
```

---

## 11. Gemini Integration

### Model
`gemini-2.5-flash` via `google-genai>=1.0.0`

### Web Search Tool
Enable for Investigation Agent only — to pull live maritime news about vessels/owners:
```python
tools = [{"type": "web_search_20250305", "name": "web_search"}]
```

### Structured Output
All agents return JSON. System prompt always ends with:
```
Respond ONLY in the specified JSON format. No preamble, no markdown, no explanation outside the JSON structure.
```

---

## 12. Frontend — Command Center

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  🛰️ HARBORWATCH AI          [LIVE] ●   492 vessels monitored │
│  12 HIGH RISK   3 CRITICAL   7 INVESTIGATIONS ACTIVE         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                    DECK.GL WORLD MAP                         │
│                                                              │
│   [vessels as dots, color = risk level]                      │
│   [simulated vessels pulse with animation]                   │
│   [click vessel → opens VesselPanel]                         │
│                                                              │
├─────────────────────────┬────────────────────────────────────┤
│  VESSEL PANEL           │  AGENT ACTIVITY TIMELINE           │
│  ─────────────────────  │  ─────────────────────────────     │
│  MV Esperanza           │  ● Monitoring Agent    COMPLETE    │
│  MMSI: SIM001           │    "3 anomalies detected"          │
│  Flag: Comoros          │  ◐ Investigation Agent  RUNNING    │
│  Risk: 91/100 ████████  │    "Searching maritime news..."    │
│  47 days stationary     │  ○ Risk Agent           PENDING    │
│  18 crew aboard         │  ○ Compliance Agent     PENDING    │
│  $84,000 unpaid wages   │  ○ Escalation Agent     PENDING    │
│                         │                                    │
│  [▶ INVESTIGATE]        │  [View Full Report]                │
└─────────────────────────┴────────────────────────────────────┘
```

### Map Layer Design (Deck.gl)
```javascript
// ScatterplotLayer for all vessels
// Color encoding:
// LOW    → [34, 197, 94, 180]   (green)
// MEDIUM → [234, 179, 8, 180]   (yellow)  
// HIGH   → [249, 115, 22, 180]  (orange)
// CRITICAL → [239, 68, 68, 255] (red, full opacity)
// Simulated → pulse animation using ScenegraphLayer

// PathLayer for vessel route history (last 10 positions)
// TextLayer for vessel name labels on hover
```

### Color System
```
Background:     #050a14  (deep ocean dark)
Surface:        #0d1b2a
Cards:          #112240
Border:         #1e3a5f
Primary text:   #e2e8f0
Secondary text: #94a3b8
Accent:         #38bdf8  (maritime blue)

Risk colors:
CRITICAL:       #ef4444
HIGH:           #f97316
MEDIUM:         #eab308
LOW:            #22c55e
```

### Agent Timeline Animation
- Each agent node shows: icon + name + status (pending/running/complete)
- Running state: pulsing blue dot + spinner
- Complete state: green checkmark + summary line
- Clicking any complete agent shows its full reasoning trace

---

## 13. Environment Variables

```env
# backend/.env
GEMINI_API_KEY=your_key_here
AISSTREAM_API_KEY=your_key_here     # free at aisstream.io
PORT=8000

# frontend/.env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_MAPTILER_KEY=your_key_here     # free at maptiler.com, for MapLibre basemap
```

---

## 14. Requirements

### backend/requirements.txt
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
langgraph==0.1.0
google-genai>=1.0.0
pydantic==2.7.0
python-dotenv==1.0.1
httpx==0.27.0
websockets==12.0
scikit-learn==1.4.0
numpy==1.26.0
```

### frontend package.json dependencies
```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "@deck.gl/react": "^9.0.0",
  "@deck.gl/layers": "^9.0.0",
  "maplibre-gl": "^4.0.0",
  "recharts": "^2.12.0",
  "zustand": "^4.5.0",
  "tailwindcss": "^3.4.0",
  "lucide-react": "^0.383.0",
  "@shadcn/ui": "latest",
  "typescript": "^5.4.0"
}
```

---

## 15. Demo Script (For Judges — 3 Minutes)

**Act 1 — The Scale (20 sec)**
> "Right now, 500 ships worldwide are abandoned by their owners. Crews trapped. Unpaid. No food. No legal help. The ITF tracks this with spreadsheets. We built the intelligent layer they don't have."

**Act 2 — The Map (30 sec)**
> Show Deck.gl globe. Real vessels moving. Point out the three pulsing red/orange simulated vessels. "Every dot is a real vessel. These three — flagged by Ocean11 as critical risk."

**Act 3 — Trigger the Pipeline (90 sec)**
> Click MV Esperanza. Show vessel panel: 47 days stationary, 18 crew, $84k unpaid wages, Comoros flag. Hit INVESTIGATE.
> Watch the agent timeline fire sequentially:
> - Monitoring: "3 anomalies confirmed — extended inactivity, AIS irregularities, high-risk flag state"
> - Investigation: "Owner Oceanic Holdings Ltd has 2 prior ITF incidents. No port call in 51 days. Maritime news: owner linked to disputed vessel in 2023."
> - Risk: "Score: 91/100. CRITICAL. Highest priority active case."
> - Compliance: "MLC 2006 Article IV applies. Comoros flag state obligated to intervene within 72h."
> - Escalation: "Report generated. 4 escalation targets identified."

**Act 4 — The Report (30 sec)**
> Open escalation report. Show draft message to ITF Pacific. Show flag state notification. Show nearest port state authority. "This took 90 seconds. Manual investigation takes weeks."

**Act 5 — The Vision (10 sec)**
> "Ocean11 is not a dashboard. It's the intelligence layer for humanitarian maritime response."

---

## 16. What NOT to Build

- ❌ Real email/notification sending (show draft, don't send)
- ❌ User authentication
- ❌ Historical database / PostgreSQL (in-memory for demo)
- ❌ Neo4j graph (mention in pitch as future, skip in build)
- ❌ Mobile responsive layout
- ❌ Multiple simultaneous pipeline runs

**Ship the demo, not the product.**

---

## 17. Build Checklist (Single Iteration)

### Backend Foundation
- [ ] FastAPI skeleton + `/health`
- [ ] Pydantic models (Vessel, AgentEvent, EscalationReport, InvestigationState)
- [ ] Config + env var loading

### Data Layer
- [ ] AIS client (aisstream.io WebSocket, ingest 200–500 vessels, reconnect + backfill on drop)
- [ ] Crisis simulator (3 scenarios, injected on top of real data)
- [ ] Vessel registry (static owner/flag/incident data)
- [ ] Risk scoring engine + pattern detection

### Agent Pipeline
- [ ] LangGraph pipeline scaffold (5 nodes, shared InvestigationState)
- [ ] Monitoring Agent (Gemini call + structured output)
- [ ] Investigation Agent (Gemini + web search tool, with graceful fallback if search fails/empty)
- [ ] Risk Agent
- [ ] Compliance Agent
- [ ] Escalation Agent — including the "no action needed / low urgency" branch for non-critical vessels
- [ ] Wire pipeline to `/vessels/{mmsi}/investigate`

### API + Real-time
- [ ] `/vessels`, `/vessels/{mmsi}`, `/investigations/{id}`, `/reports/{mmsi}`, `/stats`
- [ ] WebSocket `/ws/feed` pushing agent events, vessel updates, alerts, report-ready

### Frontend Foundation
- [ ] Vite + React + TypeScript + Tailwind setup
- [ ] Zustand store + WebSocket hook
- [ ] Type definitions matching backend Pydantic models

### Frontend UI
- [ ] Deck.gl + MapLibre map with real + simulated vessels, color-coded risk layers
- [ ] StatsBar (top strip)
- [ ] VesselPanel (click vessel → details + investigate button)
- [ ] AgentTimeline (live firing animation, all states: pending/running/complete, plus "no action needed" state)
- [ ] EscalationReport viewer

### Integration + Verification
- [ ] Connect frontend to live backend end-to-end
- [ ] Test all 5 agents firing in sequence on each of the 3 simulated scenarios
- [ ] Test the low-urgency branch on a non-critical real vessel
- [ ] README + setup instructions (env vars, API keys, run commands)

---

## 18. Pitch Framing

**The problem nobody talks about:** Seafarer abandonment is a maritime crisis invisible to the world. 500 ships. Thousands of trapped humans. Right now.

**Why now:** Red Sea crisis, Houthi attacks, geopolitical sanctions — maritime is the most stressed it's been since WW2. Abandonment cases are accelerating.

**Why agentic:** Manual investigation takes weeks. Ocean11 does it in 90 seconds. The pipeline doesn't sleep, doesn't have a caseload, doesn't miss signals at 3am.

**Why us:** Nobody has built the intelligent layer for humanitarian maritime response. Not the ITF. Not Lloyd's. Not the IMO. The data exists. The AI exists. We connected them.

---

*Ocean11 — "The intelligence layer for humanitarian maritime response."*
