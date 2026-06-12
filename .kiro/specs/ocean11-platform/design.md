# Design Document — Ocean11 Platform

## Overview

Ocean11 is an autonomous maritime intelligence platform built for a hackathon demo. It ingests live AIS telemetry, overlays three hardcoded simulated crisis scenarios, continuously scores each vessel's abandonment risk, and auto-triggers a five-agent LangGraph pipeline whenever a vessel's risk score reaches 60 or above. The pipeline produces either a full humanitarian intervention package or a calm "no action needed" summary. A React/Deck.gl dashboard renders the globe map, vessel details, live agent timeline, and escalation reports in real time over a FastAPI WebSocket connection.

All storage is in-memory. No external database, no authentication, no real notifications.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        OCEAN11                              │
│                                                             │
│  Layer 1: Data Ingestion                                    │
│  → AIS Client (aisstream.io WebSocket, up to 500 vessels)   │
│  → Crisis Simulator (3 hardcoded scenarios)                 │
│  → Vessel Registry (static owner/flag/incident data)        │
│                                                             │
│  Layer 2: Risk Intelligence Engine                          │
│  → Rule-based scoring (RISK_FACTORS weights, 0–100 cap)     │
│  → Region boost (Red Sea, Gulf of Aden, W. Africa, SE Asia) │
│  → Pattern detection (stationary days, AIS gaps)            │
│  → Auto-trigger coordinator (threshold=60, cooldown, mutex) │
│                                                             │
│  Layer 3: 5-Agent LangGraph Pipeline                        │
│  → Monitoring → Investigation → Risk ─┬─ Compliance         │
│                                       └──────────────────►  │
│                                                Escalation   │
│                                                             │
│  Layer 4: FastAPI REST + WebSocket                          │
│  → 7 REST endpoints + /ws/feed                             │
│                                                             │
│  Layer 5: React/Deck.gl Dashboard                           │
│  → GlobalMap, StatsBar, VesselPanel, AgentTimeline          │
│  → EscalationReport viewer                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

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
    └── src/
        ├── App.tsx
        ├── components/
        │   ├── GlobalMap.tsx
        │   ├── VesselPanel.tsx
        │   ├── AgentTimeline.tsx
        │   ├── RiskBadge.tsx
        │   ├── EscalationReport.tsx
        │   └── StatsBar.tsx
        ├── store/vesselStore.ts
        ├── hooks/useWebSocket.ts
        └── types/index.ts
```

---

## Data Models

### Vessel

```python
class Vessel(BaseModel):
    mmsi: str
    name: str
    flag_state: str
    vessel_type: str
    owner: str
    operator: str
    latitude: float
    longitude: float
    speed: float        # knots
    heading: float
    last_port: str
    destination: str
    days_stationary: int
    last_ais_signal: datetime
    ais_gap_hours: float
    risk_score: float
    risk_level: str     # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    risk_factors: list[str]
    is_simulated: bool
    abandonment_confirmed: bool
```

### AgentEvent

```python
class AgentEvent(BaseModel):
    event_id: str
    vessel_mmsi: str
    agent_name: str     # "monitoring" | "investigation" | "risk" | "compliance" | "escalation"
    timestamp: datetime
    status: str         # "running" | "complete" | "error"
    input_summary: str
    output_summary: str
    reasoning: str
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

    estimated_crew_size: int
    crew_nationalities: list[str]
    days_abandoned: int
    estimated_unpaid_wages_usd: float

    key_findings: list[str]
    timeline_of_events: list[str]

    applicable_conventions: list[str]
    flag_state_obligations: str
    port_state_options: str

    escalation_targets: list[dict]   # empty list if requires_escalation is False
    recommended_actions: list[str]
    urgency_level: str               # "IMMEDIATE" | "URGENT" | "MONITOR" | "NONE"

    no_action_reason: str | None     # populated when requires_escalation is False
    recheck_interval_hours: int | None
```

### InvestigationState

```python
class InvestigationState(TypedDict):
    vessel: Vessel
    events: list[AgentEvent]
    evidence: list[str]
    risk_assessment: dict
    compliance_findings: dict
    escalation_report: EscalationReport | None
```

### Risk Factors Constants

```python
RISK_FACTORS = {
    "days_stationary_30_plus": 25,
    "days_stationary_60_plus": 40,
    "ais_gap_24h": 15,
    "ais_gap_72h": 30,
    "flag_state_high_risk": 15,
    "owner_dispute_history": 20,
    "prior_itf_incident": 25,
    "no_recent_port_call": 10,
    "crew_complaint_filed": 30,
    "insurance_lapsed": 35,
}
```

---

## Environment Variables

```env
GEMINI_API_KEY=
AISSTREAM_API_KEY=
PORT=8000
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_MAPTILER_KEY=
```

---

## Layer 1: Data Ingestion

### AIS Client (`data/ais_client.py`)

The AIS client maintains a persistent WebSocket connection to `wss://stream.aisstream.io/v0/stream`, subscribes to vessel types 70–89 (cargo and tankers), and maintains an in-memory dict of up to 500 vessels keyed by MMSI.

#### Subscription Message

```python
subscribe_msg = {
    "APIKey": AISSTREAM_API_KEY,
    "BoundingBoxes": [[[-90, -180], [90, 180]]],
    "FiltersShipMMSI": [],
    "FilterMessageTypes": ["PositionReport"],
    "FilterVesselTypes": list(range(70, 90)),
}
```

#### Eviction Policy

When the store reaches 500 entries and a new MMSI arrives, the vessel with the minimum `last_ais_signal` timestamp is evicted before insertion.

```python
def _maybe_evict(self):
    if len(self.vessels) >= MAX_VESSELS:
        oldest_mmsi = min(self.vessels, key=lambda m: self.vessels[m].last_ais_signal)
        del self.vessels[oldest_mmsi]
```

#### AIS Gap Tracking

On every update and on a background 60-second tick:

```python
vessel.ais_gap_hours = (datetime.utcnow() - vessel.last_ais_signal).total_seconds() / 3600
```

#### WebSocket Reconnection State Machine

The client implements a formal connection state machine with exponential backoff:

```
States: CONNECTING → CONNECTED → DISCONNECTED → RECONNECTING
```

```python
class ConnectionState(str, Enum):
    CONNECTING = "CONNECTING"
    CONNECTED = "CONNECTED"
    DISCONNECTED = "DISCONNECTED"
    RECONNECTING = "RECONNECTING"

BACKOFF_BASE = 1       # seconds
BACKOFF_MAX = 60       # seconds
BACKOFF_FACTOR = 2

async def reconnect_loop(self):
    attempt = 0
    while True:
        self.state = ConnectionState.RECONNECTING
        delay = min(BACKOFF_BASE * (BACKOFF_FACTOR ** attempt), BACKOFF_MAX)
        # e.g.: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s, ...
        await asyncio.sleep(delay)
        try:
            self.state = ConnectionState.CONNECTING
            await self._connect()
            self.state = ConnectionState.CONNECTED
            await self._request_backfill()  # send since last_received_timestamp
            attempt = 0  # reset on success
        except Exception:
            attempt += 1

async def _request_backfill(self):
    if self.last_received_timestamp:
        backfill_msg = {
            "APIKey": AISSTREAM_API_KEY,
            "BackfillFrom": self.last_received_timestamp.isoformat(),
            "BoundingBoxes": [[[-90, -180], [90, 180]]],
            "FilterVesselTypes": list(range(70, 90)),
        }
        await self.ws.send(json.dumps(backfill_msg))
```

On every successfully received message, `self.last_received_timestamp = datetime.utcnow()` is recorded so that the backfill request can use it on the next reconnect.

### Crisis Simulator (`data/simulator.py`)

Three hardcoded vessels are injected into the in-memory store at startup. They are never written to disk.

```python
SIMULATED_VESSELS = [
    Vessel(
        mmsi="SIM001", name="MV Esperanza",
        flag_state="Comoros", vessel_type="Bulk Carrier",
        owner="Oceanic Holdings Ltd (disputed)", operator="Unknown",
        latitude=23.5, longitude=58.2,  # off Oman coast
        speed=0.0, heading=0.0,
        last_port="Dubai", destination="Unknown",
        days_stationary=47, ais_gap_hours=2.1,
        last_ais_signal=datetime.utcnow() - timedelta(hours=2),
        risk_score=91, risk_level="CRITICAL",
        risk_factors=["days_stationary_60_plus", "flag_state_high_risk",
                      "owner_dispute_history", "prior_itf_incident"],
        is_simulated=True, abandonment_confirmed=False,
    ),
    Vessel(
        mmsi="SIM002", name="MV Fortuna Star",
        flag_state="Panama", vessel_type="Tanker",
        owner="Maritime Holdings BV", operator="Unknown",
        latitude=14.2, longitude=43.1,  # Red Sea
        speed=0.0, heading=0.0,
        last_port="Djibouti", destination="Unknown",
        days_stationary=31, ais_gap_hours=78.5,
        last_ais_signal=datetime.utcnow() - timedelta(hours=78),
        risk_score=78, risk_level="HIGH",
        risk_factors=["ais_gap_72h", "days_stationary_30_plus",
                      "no_recent_port_call", "insurance_lapsed"],
        is_simulated=True, abandonment_confirmed=False,
    ),
    Vessel(
        mmsi="SIM003", name="MV Konstantinos",
        flag_state="Malta", vessel_type="Container Ship",
        owner="Hellas Shipping SA", operator="Unknown",
        latitude=5.3, longitude=3.4,   # West Africa
        speed=0.0, heading=0.0,
        last_port="Lagos", destination="Unknown",
        days_stationary=62, ais_gap_hours=12.0,
        last_ais_signal=datetime.utcnow() - timedelta(hours=12),
        risk_score=95, risk_level="CRITICAL",
        risk_factors=["days_stationary_60_plus", "crew_complaint_filed",
                      "owner_dispute_history", "prior_itf_incident",
                      "insurance_lapsed"],
        is_simulated=True, abandonment_confirmed=False,
    ),
]
```

### Vessel Registry (`data/vessel_registry.py`)

Provides static enrichment data — high-risk flag states, known ITF incident histories, and owner dispute records — used by the risk engine and agents.

```python
HIGH_RISK_FLAG_STATES = {
    "Comoros", "Palau", "Tuvalu", "Sierra Leone",
    "Belize", "Bolivia", "Mongolia",
}

RISK_REGIONS = [
    {"name": "Red Sea",       "lat_min": 12,  "lat_max": 30,  "lon_min": 32,  "lon_max": 44},
    {"name": "Gulf of Aden",  "lat_min": 10,  "lat_max": 15,  "lon_min": 42,  "lon_max": 52},
    {"name": "West Africa",   "lat_min": -5,  "lat_max": 15,  "lon_min": -20, "lon_max": 10},
    {"name": "SE Asia",       "lat_min": -5,  "lat_max": 22,  "lon_min": 95,  "lon_max": 121},
]

REGION_BOOST = 10   # additive, applied before 100-point cap
```

---

## Layer 2: Risk Intelligence Engine

### Risk Scoring (`risk/scoring.py`)

The scoring function is a pure, side-effect-free computation that can be called anytime a vessel record is updated.

```python
def compute_risk_score(vessel: Vessel, registry: VesselRegistry) -> tuple[float, str]:
    score = 0

    # Stationary — mutually exclusive tiers; 60+ replaces 30+
    if vessel.days_stationary >= 60:
        score += RISK_FACTORS["days_stationary_60_plus"]
    elif vessel.days_stationary >= 30:
        score += RISK_FACTORS["days_stationary_30_plus"]

    # AIS gap — mutually exclusive tiers; 72h replaces 24h
    if vessel.ais_gap_hours >= 72:
        score += RISK_FACTORS["ais_gap_72h"]
    elif vessel.ais_gap_hours >= 24:
        score += RISK_FACTORS["ais_gap_24h"]

    # Flag state
    if vessel.flag_state in registry.HIGH_RISK_FLAG_STATES:
        score += RISK_FACTORS["flag_state_high_risk"]

    # Historical signals (from vessel_registry enrichment)
    enrichment = registry.get_enrichment(vessel.mmsi)
    if enrichment.owner_dispute_history:
        score += RISK_FACTORS["owner_dispute_history"]
    if enrichment.prior_itf_incident:
        score += RISK_FACTORS["prior_itf_incident"]
    if enrichment.no_recent_port_call:
        score += RISK_FACTORS["no_recent_port_call"]
    if enrichment.crew_complaint_filed:
        score += RISK_FACTORS["crew_complaint_filed"]
    if enrichment.insurance_lapsed:
        score += RISK_FACTORS["insurance_lapsed"]

    # Region boost
    if _in_risk_region(vessel.latitude, vessel.longitude):
        score += REGION_BOOST

    # Cap at 100
    score = min(score, 100)

    # Level classification
    if score >= 80:
        level = "CRITICAL"
    elif score >= 60:
        level = "HIGH"
    elif score >= 30:
        level = "MEDIUM"
    else:
        level = "LOW"

    return score, level
```

### Auto-Trigger Coordinator

The coordinator runs as a background asyncio task, checks vessel scores after every AIS update, and emits pipeline invocations respecting the singleton and cooldown constraints.

```python
PIPELINE_THRESHOLD = 60
COOLDOWN_SECONDS = 3600  # 1 hour per vessel

class PipelineCoordinator:
    def __init__(self):
        self.active_run: str | None = None        # MMSI of the currently running investigation
        self.cooldowns: dict[str, datetime] = {}  # MMSI → cooldown_expires_at
        self._lock = asyncio.Lock()

    async def maybe_trigger(self, vessel: Vessel) -> bool:
        async with self._lock:
            if vessel.risk_score < PIPELINE_THRESHOLD:
                return False
            if self.active_run is not None:
                return False
            cooldown_expires = self.cooldowns.get(vessel.mmsi)
            if cooldown_expires and datetime.utcnow() < cooldown_expires:
                return False
            self.active_run = vessel.mmsi
            return True

    async def on_run_complete(self, mmsi: str):
        async with self._lock:
            self.active_run = None
            self.cooldowns[mmsi] = datetime.utcnow() + timedelta(seconds=COOLDOWN_SECONDS)
```

---

## Layer 3: Five-Agent LangGraph Pipeline

### Pipeline Graph (`agents/pipeline.py`)

The pipeline uses LangGraph's `StateGraph` with five nodes. After `investigation_node`, both `risk_node` and `compliance_node` can execute concurrently (fan-out), then `escalation_node` fans back in.

```python
from langgraph.graph import StateGraph, END

workflow = StateGraph(InvestigationState)

workflow.add_node("monitoring_node",    monitoring_agent)
workflow.add_node("investigation_node", investigation_agent)
workflow.add_node("risk_node",          risk_agent)
workflow.add_node("compliance_node",    compliance_agent)
workflow.add_node("escalation_node",    escalation_agent)

workflow.set_entry_point("monitoring_node")

workflow.add_edge("monitoring_node",    "investigation_node")
workflow.add_edge("investigation_node", "risk_node")
workflow.add_edge("investigation_node", "compliance_node")
workflow.add_edge("risk_node",          "escalation_node")
workflow.add_edge("compliance_node",    "escalation_node")
workflow.add_edge("escalation_node",    END)

pipeline = workflow.compile()
```

### Gemini Integration

All five agents use `gemini-2.5-flash` via the `google-genai>=1.0.0` SDK. The Investigation Agent is the only one that receives the web search tool.

```python
from google import genai

client = genai.Client()  # uses GEMINI_API_KEY from environment

# Investigation Agent only:
INVESTIGATION_TOOLS = [{"type": "web_search_20250305", "name": "web_search"}]

# System prompt suffix for ALL agents:
JSON_SUFFIX = (
    "Respond ONLY in the specified JSON format. "
    "No preamble, no markdown, no explanation outside the JSON structure."
)

# Example agent invocation:
async def call_gemini(system_prompt: str, user_prompt: str, tools=None) -> dict:
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_prompt,
        config=genai.types.GenerateContentConfig(
            system_instruction=system_prompt + "\n\n" + JSON_SUFFIX,
            tools=tools,
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)
```

### Agent 1 — Monitoring Agent (`agents/monitoring_agent.py`)

**Responsibility:** Detect behavioral anomaly signals in the vessel's telemetry.

**Input:** `InvestigationState.vessel` (AIS history, stationary days, AIS gaps, flag state, risk factors)

**Output:** Structured list of anomaly signals, each with `signal_type`, `severity` (`"LOW"` | `"MEDIUM"` | `"HIGH"` | `"CRITICAL"`), and `description`.

**Gemini prompt focus:** "Given this vessel's behavior over the last N days, which of these anomaly patterns are present and how severe? Return only confirmed anomaly signals with justification."

**No web search tool** — operates on in-memory data only.

### Agent 2 — Investigation Agent (`agents/investigation_agent.py`)

**Responsibility:** Gather corroborating evidence using live maritime news.

**Input:** Anomaly signals from monitoring + vessel profile.

**Output:** Evidence package: `{ findings: list[str], source_citations: list[str], web_search_status: "ok" | "web_search_unavailable" }`.

**Web search enabled:** `tools=INVESTIGATION_TOOLS`

**Fallback:** If web search returns no results or raises an exception, the agent sets `web_search_status: "web_search_unavailable"` and populates `findings` from in-memory vessel enrichment data only.

### Agent 3 — Risk Agent (`agents/risk_agent.py`)

**Responsibility:** Produce the definitive risk score and classification.

**Input:** Anomaly signals + evidence package.

**Output:**
```json
{
  "risk_score": 0-100,
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "factor_breakdown": [
    {"factor": "days_stationary_60_plus", "weight": 40, "applies": true, "justification": "..."}
  ],
  "overall_justification": "..."
}
```

The agent MUST be capable of outputting LOW and MEDIUM scores for vessels exhibiting normal behavior (recent port calls, continuous AIS, no disputes). The prompt explicitly instructs the model to score conservatively and only escalate when evidence is strong.

### Agent 4 — Compliance Agent (`agents/compliance_agent.py`)

**Responsibility:** Identify applicable international conventions and obligations.

**Input:** Full investigation state including `risk_assessment.risk_score`.

**Branching logic (enforced in prompt):**
- If `risk_score < 70`: Output `{ applicable_conventions: [], regulatory_notes: "no regulatory concerns identified" }`
- If `risk_score >= 70`: Identify MLC 2006, UNCLOS articles, flag-state obligations, port-state options.

### Agent 5 — Escalation Agent (`agents/escalation_agent.py`)

**Responsibility:** Produce the final `EscalationReport`. This agent is the only one that writes to `InvestigationState.escalation_report`.

**Input:** Full `InvestigationState` (all prior outputs).

**Hard branching requirement:**
- If `risk_score < 70`: `requires_escalation = False`, populate `no_action_reason` and `recheck_interval_hours`, set `escalation_targets = []`, `urgency_level = "NONE"` or `"MONITOR"`, `no_action_reason = null` stays null.
- If `risk_score >= 70`: `requires_escalation = True`, populate `escalation_targets` with at least one `{ org, contact, priority, message }` entry, `urgency_level = "URGENT"` or `"IMMEDIATE"`, `no_action_reason = null`.

The prompt suffix for this agent explicitly states: "The default outcome for a vessel with risk_score below 70 is requires_escalation: false. Do not produce a full intervention package unless the risk score is 70 or above."

### Error Handling

If any agent node raises an unhandled exception:
1. A `AgentEvent` is created with `status: "error"`, `output_summary` containing the exception message, and `reasoning: ""`.
2. The event is appended to `InvestigationState.events` and broadcast over `/ws/feed` as an `agent_event` message.
3. The pipeline halts — subsequent nodes remain in their initial (unexecuted) state.
4. `PipelineCoordinator.on_run_complete()` is called so the lock and cooldown are released.

---

## Components and Interfaces

The system is composed of five major components. Their interfaces are defined in detail in the sections below.

| Component | Module | Role |
|-----------|--------|------|
| AIS Client | `data/ais_client.py` | WebSocket ingestion, eviction, reconnect |
| Crisis Simulator | `data/simulator.py` | Injects 3 hardcoded crisis vessels |
| Risk Engine | `risk/scoring.py` + `risk/patterns.py` | Computes risk score and emits auto-triggers |
| LangGraph Pipeline | `agents/pipeline.py` + 5 agent modules | Five-agent autonomous investigation |
| FastAPI App | `main.py` | REST API, WebSocket feed, in-memory store |
| React Dashboard | `frontend/src/` | Map, panels, timeline, reports |

---

## Layer 4: Backend API

### FastAPI Application (`main.py`)

#### REST Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/vessels` | List vessels. Query params: `risk_level` (string), `limit` (int, default 50). |
| `GET`  | `/vessels/{mmsi}` | Full vessel profile + risk score + all AgentEvents. 404 if not found. |
| `POST` | `/vessels/{mmsi}/investigate` | Start pipeline. Returns `{ investigation_id, status: "started" }`. 409 if pipeline busy. |
| `GET`  | `/investigations/{investigation_id}` | Current InvestigationState including per-node status. 404 if not found. |
| `GET`  | `/reports/{mmsi}` | Most recent EscalationReport for vessel. 404 if not found. |
| `GET`  | `/stats` | `{ total_monitored, high_risk_count, critical_count, investigations_today, reports_generated }` |
| `WS`   | `/ws/feed` | Real-time event feed (see below). |

#### WebSocket Feed (`/ws/feed`)

The server maintains a list of active WebSocket connections and broadcasts to all of them.

**Message types:**

```typescript
type WsFeedMessage =
  | { type: "vessel_update"; mmsi: string; fields: Partial<Vessel> }
  | { type: "agent_event";   payload: AgentEvent }
  | { type: "alert";         mmsi: string; risk_score: number; risk_level: string }
  | { type: "report_ready";  mmsi: string; report_id: string }
```

**Broadcast triggers:**
- `vessel_update`: emitted after every AIS message is processed or risk score is recomputed.
- `agent_event`: emitted by each agent when transitioning to `"running"`, `"complete"`, or `"error"`.
- `alert`: emitted when a vessel's `risk_level` transitions to `"HIGH"` or `"CRITICAL"`.
- `report_ready`: emitted when the Escalation Agent writes a completed `EscalationReport` to the in-memory store.

#### In-Memory Store Structure

```python
# main.py (module-level singletons)
vessels: dict[str, Vessel] = {}                        # MMSI → Vessel
investigations: dict[str, InvestigationState] = {}     # investigation_id → state
reports: dict[str, EscalationReport] = {}              # MMSI → latest report
ws_connections: list[WebSocket] = []
stats_counters = { "investigations_today": 0, "reports_generated": 0 }
```

---

## Layer 5: Frontend

### Color System

```
Background:     #050a14
Surface:        #0d1b2a
Cards:          #112240
Border:         #1e3a5f
Primary text:   #e2e8f0
Secondary text: #94a3b8
Accent:         #38bdf8

Risk CRITICAL:  #ef4444
Risk HIGH:      #f97316
Risk MEDIUM:    #eab308
Risk LOW:       #22c55e
```

### Tailwind CSS Config Extension

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      ocean: {
        bg:       "#050a14",
        surface:  "#0d1b2a",
        card:     "#112240",
        border:   "#1e3a5f",
        accent:   "#38bdf8",
      },
      risk: {
        critical: "#ef4444",
        high:     "#f97316",
        medium:   "#eab308",
        low:      "#22c55e",
      },
    },
  },
}
```

### Dashboard Layout (`App.tsx`)

```
┌──────────────────────────────────────────────────────────────┐
│  StatsBar (full width)                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              GlobalMap (full width, Deck.gl)                 │
│                                                              │
├─────────────────────────┬────────────────────────────────────┤
│  VesselPanel            │  AgentTimeline                     │
│  (left half)            │  (right half)                      │
└─────────────────────────┴────────────────────────────────────┘
```

The layout uses `grid-rows` and `grid-cols` in Tailwind. Desktop-only; no responsive breakpoints required.

### GlobalMap (`components/GlobalMap.tsx`)

Uses Deck.gl 9.x over MapLibre GL 4.x.

**Layers:**

```javascript
// ScatterplotLayer — all vessels, color by risk_level
new ScatterplotLayer({
  id: "vessels",
  data: vessels,
  getPosition: (v) => [v.longitude, v.latitude],
  getFillColor: (v) => {
    switch (v.risk_level) {
      case "LOW":      return [34,  197,  94, 180];
      case "MEDIUM":   return [234, 179,   8, 180];
      case "HIGH":     return [249, 115,  22, 180];
      case "CRITICAL": return [239,  68,  68, 255];
    }
  },
  pickable: true,
  onClick: ({ object }) => setSelectedVessel(object),
});

// ScenegraphLayer — simulated vessels only, with pulse animation
new ScenegraphLayer({
  id: "simulated-vessels",
  data: vessels.filter((v) => v.is_simulated),
  scenegraph: "/assets/vessel.glb",
  getPosition: (v) => [v.longitude, v.latitude],
  getColor: (v) => [239, 68, 68, 255],
  // pulse animation via _animations prop
  _animations: { "*": { speed: 2 } },
});

// PathLayer — last 10 positions of selected vessel
new PathLayer({
  id: "vessel-trail",
  data: selectedVesselTrail,
  getPath: (d) => d.positions,
  getColor: [56, 189, 248, 200],
  getWidth: 2,
});

// TextLayer — vessel name on hover
new TextLayer({
  id: "vessel-labels",
  data: hoveredVessel ? [hoveredVessel] : [],
  getText: (v) => v.name,
  getPosition: (v) => [v.longitude, v.latitude],
  getColor: [226, 232, 240, 255],
  getSize: 14,
  getAlignmentBaseline: "bottom",
});
```

### VesselPanel (`components/VesselPanel.tsx`)

Displays the selected vessel's full profile. Key elements:

- Name, MMSI, flag state, vessel type, owner, operator
- Speed, heading, last port, destination
- Days stationary, AIS gap hours
- Risk score bar (proportional fill, colored by `risk_level`)
- Risk factors list
- INVESTIGATE button: calls `POST /vessels/{mmsi}/investigate`, disables while active
- 409 inline error: `"Another investigation is currently in progress"`

```tsx
<div className="w-full h-3 bg-ocean-border rounded-full overflow-hidden">
  <div
    className="h-full transition-all duration-500"
    style={{
      width: `${vessel.risk_score}%`,
      backgroundColor: RISK_COLORS[vessel.risk_level],
    }}
  />
</div>
```

### AgentTimeline (`components/AgentTimeline.tsx`)

Renders the five pipeline nodes in execution order.

**Node states:**
- `pending`: hollow gray circle, grayed-out name
- `running`: pulsing blue dot (`animate-pulse` class), spinner icon
- `complete`: green checkmark, `output_summary` text, clickable to expand reasoning
- `error`: red X, error message

**Critical: No-Action vs Escalation Visual Differentiation**

The Escalation node (last in the timeline) renders differently depending on `requires_escalation`:

```tsx
// requires_escalation: FALSE — calm, non-alert styling
<div className="
  rounded-lg border border-teal-800/40
  bg-teal-950/30
  p-4 mt-2
  no-action-card          // CSS marker class
">
  <span className="
    inline-flex items-center gap-1.5 px-2 py-0.5
    rounded-full text-xs font-medium
    bg-teal-900/50 text-teal-300
    urgency-badge-monitor   // CSS marker class
  ">
    {report.urgency_level}  {/* "NONE" or "MONITOR" */}
  </span>
  <p className="mt-2 text-sm text-ocean-secondary">
    {report.no_action_reason}
  </p>
  <p className="mt-1 text-xs text-slate-500">
    Recheck in {report.recheck_interval_hours}h
  </p>
</div>

// requires_escalation: TRUE — alert styling
<div className="
  rounded-lg border border-red-700/60
  bg-red-950/30
  p-4 mt-2
  escalation-alert-card   // CSS marker class
">
  <span className="
    inline-flex items-center gap-1.5 px-2 py-0.5
    rounded-full text-xs font-bold
    bg-red-600 text-white
    animate-pulse
    urgency-badge-critical  // CSS marker class
  ">
    ⚠ {report.urgency_level}  {/* "URGENT" or "IMMEDIATE" */}
  </span>
  <p className="mt-2 text-sm font-semibold text-red-200">
    {report.key_findings[0]}
  </p>
</div>
```

**Key constraint:** The `no-action-card` branch MUST NOT include `animate-pulse`, `text-red-*`, `bg-red-*`, `text-orange-*`, or `bg-orange-*` classes. Tests should assert the DOM for these class names.

### EscalationReport Viewer (`components/EscalationReport.tsx`)

Auto-displays when a `report_ready` WebSocket event arrives for the selected vessel.

**requires_escalation: true layout:**
- Urgency badge (red/orange, pulsing)
- Key findings list
- Timeline of events
- Applicable conventions
- Flag state obligations
- Port state options
- Recommended actions
- Escalation targets (org, contact, priority, draft message)

**requires_escalation: false layout (calm style):**
- Urgency badge in muted teal/gray, no pulsing
- `no_action_reason` paragraph
- `recheck_interval_hours` displayed as "Recheck in Xh"
- No escalation targets section rendered

### StatsBar (`components/StatsBar.tsx`)

```tsx
<div className="flex items-center gap-6 px-6 py-3 bg-ocean-surface border-b border-ocean-border">
  <StatChip label="Monitored"    value={stats.total_monitored}    color="text-ocean-primary" />
  <StatChip label="High Risk"    value={stats.high_risk_count}    color="text-risk-high" />
  <StatChip label="Critical"     value={stats.critical_count}     color="text-risk-critical" />
  <StatChip label="Investigating" value={activeInvestigations}    color="text-ocean-accent" />
</div>
```

Updated in real-time via `vessel_update` WebSocket events.

### Zustand Store (`store/vesselStore.ts`)

```typescript
interface VesselStore {
  vessels: Record<string, Vessel>;
  selectedMmsi: string | null;
  activeInvestigation: { mmsi: string; investigation_id: string } | null;
  latestReports: Record<string, EscalationReport>;
  agentEvents: Record<string, AgentEvent[]>;  // mmsi → events
  stats: StatsResponse;

  setSelectedMmsi: (mmsi: string | null) => void;
  upsertVessel: (vessel: Partial<Vessel> & { mmsi: string }) => void;
  appendAgentEvent: (event: AgentEvent) => void;
  setReport: (mmsi: string, report: EscalationReport) => void;
  updateStats: (stats: StatsResponse) => void;
}
```

### WebSocket Hook (`hooks/useWebSocket.ts`)

```typescript
function useWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data) as WsFeedMessage;
      switch (msg.type) {
        case "vessel_update":
          store.upsertVessel({ mmsi: msg.mmsi, ...msg.fields });
          break;
        case "agent_event":
          store.appendAgentEvent(msg.payload);
          break;
        case "alert":
          // Could trigger a toast notification
          break;
        case "report_ready":
          // Fetch full report and update store
          fetchReport(msg.mmsi).then((r) => store.setReport(msg.mmsi, r));
          break;
      }
    };

    ws.current.onclose = () => {
      // Reconnect after 3 seconds
      setTimeout(() => reconnect(), 3000);
    };

    return () => ws.current?.close();
  }, [url]);
}
```

### TypeScript Types (`types/index.ts`)

```typescript
export interface Vessel {
  mmsi: string;
  name: string;
  flag_state: string;
  vessel_type: string;
  owner: string;
  operator: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  last_port: string;
  destination: string;
  days_stationary: number;
  last_ais_signal: string;  // ISO datetime string
  ais_gap_hours: number;
  risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_factors: string[];
  is_simulated: boolean;
  abandonment_confirmed: boolean;
}

export interface AgentEvent {
  event_id: string;
  vessel_mmsi: string;
  agent_name: "monitoring" | "investigation" | "risk" | "compliance" | "escalation";
  timestamp: string;
  status: "running" | "complete" | "error";
  input_summary: string;
  output_summary: string;
  reasoning: string;
  duration_ms: number;
}

export interface EscalationReport {
  report_id: string;
  vessel_mmsi: string;
  vessel_name: string;
  generated_at: string;
  risk_score: number;
  requires_escalation: boolean;
  estimated_crew_size: number;
  crew_nationalities: string[];
  days_abandoned: number;
  estimated_unpaid_wages_usd: number;
  key_findings: string[];
  timeline_of_events: string[];
  applicable_conventions: string[];
  flag_state_obligations: string;
  port_state_options: string;
  escalation_targets: EscalationTarget[];
  recommended_actions: string[];
  urgency_level: "IMMEDIATE" | "URGENT" | "MONITOR" | "NONE";
  no_action_reason: string | null;
  recheck_interval_hours: number | null;
}

export interface EscalationTarget {
  org: string;
  contact: string;
  priority: number;
  message: string;
}

export interface StatsResponse {
  total_monitored: number;
  high_risk_count: number;
  critical_count: number;
  investigations_today: number;
  reports_generated: number;
}

export type WsFeedMessage =
  | { type: "vessel_update"; mmsi: string; fields: Partial<Vessel> }
  | { type: "agent_event";   payload: AgentEvent }
  | { type: "alert";         mmsi: string; risk_score: number; risk_level: string }
  | { type: "report_ready";  mmsi: string; report_id: string };
```

---

## Backend Requirements

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

---

## Error Handling

### AIS Client
- **Connection drop**: Transitions to `DISCONNECTED` → `RECONNECTING`, applies exponential backoff, requests backfill on reconnect.
- **Malformed AIS message**: Log and skip; do not update vessel store.
- **Eviction failure**: Should never fail; eviction is synchronous before insertion.

### Risk Engine
- **Unknown MMSI in registry**: Use zero enrichment (all flags false); score from AIS data only.
- **Score overflow**: Always capped to 100 via `min()`.

### LangGraph Pipeline
- **Agent exception**: Record `AgentEvent(status="error")`, broadcast over WebSocket, halt pipeline, release coordinator lock.
- **Gemini API timeout/error**: Raise the exception; caught by the pipeline error handler above.
- **Investigation Agent web search failure**: Populate evidence from in-memory data, set `web_search_status: "web_search_unavailable"`, continue pipeline.
- **409 on manual trigger**: Return HTTP 409 with `{"error": "investigation already in progress"}`.

### WebSocket Feed
- **Client disconnect**: Remove from `ws_connections` list silently.
- **Broadcast failure to one client**: Log and skip that client; continue broadcasting to others.

### Frontend
- **WebSocket disconnect**: `useWebSocket` hook reconnects after 3 seconds. Stale vessel data remains displayed with a visual "reconnecting" indicator.
- **Missing report**: `EscalationReport` viewer shows a loading skeleton until `report_ready` event arrives.
- **409 from POST /investigate**: `VesselPanel` shows inline error message and re-enables the button.

---

## Testing Strategy

**Unit tests** verify specific examples, edge cases, and error conditions for pure functions:
- `compute_risk_score()` with specific factor combinations
- `EscalationReport` schema validation
- Backoff delay sequence calculation
- Escalation branch routing logic

**Property-based tests** verify universal correctness across generated inputs:
- Risk score computation over all factor subsets
- Eviction always removes oldest vessel
- No-action vs escalation branch invariants for all valid report instances
- AgentTimeline DOM assertions for both card states

**Integration tests** verify end-to-end pipeline behavior:
- All three simulated scenarios produce `requires_escalation: True`
- A real vessel with `risk_score < 60` produces `requires_escalation: False`

**Smoke tests** verify configuration and setup:
- AIS WebSocket subscription message is sent with correct vessel types
- Gemini API key is present and client initializes

Minimum 100 iterations per property-based test due to input randomization.

---

## Integration Verification Tests

### Test 1 — No-Action Branch (Hard Requirement)

Select a real vessel from the live AIS feed with `risk_score < 60` at test time. Manually invoke the pipeline. Assert `escalation_report.requires_escalation == False`.

If this test produces `requires_escalation: True` for a vessel with initial risk score below 60, the risk scoring weights and agent prompts must be revised before the build is considered complete.

### Test 2 — Simulated Crisis Scenarios

Run all three simulated scenarios through the pipeline. Assert each produces `requires_escalation: True` and `urgency_level in ("URGENT", "IMMEDIATE")`.

```python
@pytest.mark.asyncio
async def test_simulated_scenarios_escalate():
    for mmsi, expected_urgency in [("SIM001", {"URGENT", "IMMEDIATE"}),
                                    ("SIM002", {"URGENT", "IMMEDIATE"}),
                                    ("SIM003", {"URGENT", "IMMEDIATE"})]:
        report = await run_pipeline_for_mmsi(mmsi)
        assert report.requires_escalation is True
        assert report.urgency_level in expected_urgency

@pytest.mark.asyncio
async def test_normal_vessel_no_action():
    # Find a vessel with risk_score < 60 from live or mocked AIS
    normal_vessel = get_vessel_below_threshold(threshold=60)
    report = await run_pipeline_for_mmsi(normal_vessel.mmsi)
    assert report.requires_escalation is False
    assert report.urgency_level in ("NONE", "MONITOR")
    assert report.no_action_reason is not None
    assert report.escalation_targets == []
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Vessel Store Capacity and Eviction

*For any* sequence of incoming AIS messages, the in-memory vessel store SHALL never contain more than 500 entries, and when at capacity, the vessel with the oldest `last_ais_signal` timestamp SHALL be evicted to make room for the new entry.

**Validates: Requirements 1.2, 1.4**

---

### Property 2: AIS Gap Calculation Accuracy

*For any* vessel record with a known `last_ais_signal` datetime and a known current time, the computed `ais_gap_hours` SHALL equal `(current_time - last_ais_signal).total_seconds() / 3600` within floating-point precision.

**Validates: Requirements 1.5**

---

### Property 3: Exponential Backoff Sequence

*For any* sequence of N consecutive failed reconnection attempts, the delay before attempt K SHALL equal `min(1 * 2^(K-1), 60)` seconds — specifically: attempt 1 waits 1s, attempt 2 waits 2s, attempt 3 waits 4s, ..., and any attempt beyond the point where the delay reaches 60s waits exactly 60s.

**Validates: Requirements 1.3**

---

### Property 4: Risk Score Computation Correctness

*For any* vessel with a given set of risk factor flags, the computed `risk_score` SHALL equal `min(sum of applicable RISK_FACTORS weights + optional REGION_BOOST, 100)`, and `risk_level` SHALL be `"LOW"` for scores 0–29, `"MEDIUM"` for 30–59, `"HIGH"` for 60–79, `"CRITICAL"` for 80–100.

**Validates: Requirements 3.1, 3.2, 3.4**

---

### Property 5: Risk Region Boost

*For any* two vessels with identical risk factor flags, the vessel whose coordinates fall within a defined Risk Region SHALL have a strictly higher `risk_score` than the vessel outside all Risk Regions, subject to the 100-point cap.

**Validates: Requirements 3.3**

---

### Property 6: Pipeline Singleton Invariant

*For any* sequence of auto-trigger and manual trigger events, the `PipelineCoordinator` SHALL ensure at most one pipeline run is active at any instant, and triggers received while a run is active SHALL be silently dropped.

**Validates: Requirements 4.2, 4.4, 17.4**

---

### Property 7: Cooldown Suppression

*For any* completed pipeline run for vessel V at time T with cooldown duration D, all auto-trigger events for vessel V arriving in the interval `(T, T+D)` SHALL be suppressed, and the first trigger arriving after `T+D` SHALL be accepted (subject to the singleton constraint).

**Validates: Requirements 4.3**

---

### Property 8: Escalation Report Schema Integrity

*For any* `EscalationReport` instance, serializing it to JSON and deserializing it back SHALL produce a structurally identical object with all required fields present and correctly typed.

**Validates: Requirements 8.1**

---

### Property 9: No-Action Branch Invariants

*For any* `EscalationReport` where `requires_escalation` is `False`: `escalation_targets` SHALL be an empty list, `no_action_reason` SHALL be a non-empty string, `urgency_level` SHALL be `"NONE"` or `"MONITOR"`, and `recheck_interval_hours` SHALL be a positive integer.

**Validates: Requirements 7.1, 8.2**

---

### Property 10: Escalation Branch Invariants

*For any* `EscalationReport` where `requires_escalation` is `True`: `no_action_reason` SHALL be `null`, `escalation_targets` SHALL contain at least one entry with `org`, `contact`, `priority`, and `message` fields, and `urgency_level` SHALL be `"URGENT"` or `"IMMEDIATE"`.

**Validates: Requirements 7.2, 8.3**

---

### Property 11: Risk Score Determines Escalation Branch

*For any* vessel investigation state where the Risk Agent output `risk_score` is below 70, the Escalation Agent SHALL produce an `EscalationReport` with `requires_escalation: False`. *For any* investigation state where `risk_score` is 70 or above, the Escalation Agent SHALL produce `requires_escalation: True`.

**Validates: Requirements 7.1, 7.2, 7.3, 18.1**

---

### Property 12: AgentTimeline No-Action Rendering

*For any* render of `AgentTimeline` with an `EscalationReport` where `requires_escalation` is `False`, the rendered DOM SHALL contain elements with the `no-action-card` class and SHALL NOT contain elements with `escalation-alert-card`, `animate-pulse`, `bg-red-*`, `text-red-*`, `bg-orange-*`, or `text-orange-*` classes on the Escalation node card.

**Validates: Requirements 14.5, 14.6**

---

### Property 13: Vessel Coexistence

*For any* combination of real AIS vessels and the three simulated vessels present in the in-memory store, a `GET /vessels` request SHALL return all of them in a single response (subject to the `limit` parameter), with no entries filtered out based on the `is_simulated` flag alone.

**Validates: Requirements 2.3**

---

### Property 14: Agent Error Halts Pipeline

*For any* pipeline execution where agent node K raises an unhandled exception, an `AgentEvent` with `status: "error"` SHALL be recorded for node K, and nodes K+1 through 5 SHALL remain in their initial (unexecuted) state with no `AgentEvent` recorded.

**Validates: Requirements 5.5**
