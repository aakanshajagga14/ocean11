# Ocean11 — HarborWatch AI

**Autonomous maritime intelligence that detects seafarer abandonment, humanitarian crises, and logistics risk before they become global emergencies.**

[![Live Demo](https://img.shields.io/badge/demo-live-orange)](https://frontend-zeta-puce-30.vercel.app)
[![Backend](https://img.shields.io/badge/API-Railway-blue)](https://railway-production-4f75.up.railway.app/health)

---

## Problem Statement

Every year, hundreds of cargo and tanker vessels are abandoned by their owners — crews left stranded offshore without pay, food, fuel, or legal support for months or years. The ITF (International Transport Workers' Federation) tracks these cases manually and reactively, often only after a crew member files a complaint.

There is no intelligent system that:

- Monitors the global fleet continuously for early abandonment signals
- Correlates AIS gaps, prolonged anchoring, flag-state risk, and owner history in real time
- Automatically investigates suspicious vessels and produces actionable intervention packages

Compounding the crisis: Red Sea disruptions, geopolitical sanctions, and flag-of-convenience registries have made 2024–2026 one of the most stressed maritime environments in decades. Abandoned seafarers remain the invisible human cost — detected too late, escalated too slowly.

---

## Solution

**Ocean11 (HarborWatch AI)** is a fully autonomous maritime intelligence platform that:

1. **Ingests live AIS telemetry** from up to 500 cargo and tanker vessels worldwide via [aisstream.io](https://aisstream.io)
2. **Scores every vessel** with a rule-based risk engine (0–100) using stationary days, AIS gaps, flag-state risk, owner disputes, and fleet patterns
3. **Auto-triggers a 5-agent LangGraph pipeline** when risk score reaches 60+ (manual trigger available anytime)
4. **Streams results in real time** to a React command-center dashboard over WebSocket

The pipeline produces either a **full humanitarian escalation package** (ITF contacts, flag-state obligations, MLC 2006 references) or a **calm no-action summary** — depending on evidence, not hype.

---

## Live Deployment

| Service | URL |
|---------|-----|
| **Dashboard** | https://frontend-zeta-puce-30.vercel.app |
| **API + WebSocket** | https://railway-production-4f75.up.railway.app |
| **Health check** | https://railway-production-4f75.up.railway.app/health |
| **API docs** | https://railway-production-4f75.up.railway.app/docs |

> **Architecture note:** Vercel hosts the React frontend. Railway hosts the FastAPI backend with persistent WebSockets (AIS stream + live event feed). Serverless platforms cannot maintain the long-running connections this system requires.

---

## Features

### Real-Time Fleet Monitoring
- Live AIS ingestion for vessel types 70–89 (cargo & tankers)
- Global map with color-coded risk markers (Deck.gl + MapLibre)
- Throttled WebSocket broadcasts for vessel position, risk, and stats updates
- Auto-reconnect with exponential backoff on AIS stream drops

### Risk Intelligence Engine
- Per-vessel risk score (0–100) with confidence intervals
- Pattern detection: prolonged stationary, AIS dark periods, flag-state risk, owner disputes
- Fleet-level anomaly signals (multiple vessels from same owner showing distress patterns)
- Auto-investigation trigger at risk score ≥ 60 for live vessels

### 5-Agent Autonomous Pipeline
- LangGraph-orchestrated sequential + parallel agent workflow
- Each agent powered by **Gemini 2.5 Flash** with structured JSON output
- Live agent timeline visible in the dashboard during investigations
- Cached reports and investigation memory per vessel

### Command Center Dashboard
- **Live Map** — interactive globe, vessel panel, real-time alerts strip
- **Investigations** — active pipeline cards, 5-agent stepper, agent activity feed
- **Reports** — AI-generated escalation packages with urgency levels
- **Alerts** — filterable feed of high-risk vessels with one-click investigate

### Demo Crisis Scenarios
Three simulated vessels are always on the map for reliable demo/judging:

| MMSI | Vessel | Risk | Situation |
|------|--------|------|-----------|
| SIM001 | MV Esperanza | 91 | 47 days stationary off Oman |
| SIM002 | MV Fortuna Star | 78 | AIS dark 72h, Red Sea |
| SIM003 | MV Konstantinos | 95 | Crew complaint, owner unreachable |

Click any vessel → **START INVESTIGATION** → watch agents fire sequentially.

---

## AI Agents

Ocean11 uses five specialized agents in a LangGraph pipeline. All agents share a single `InvestigationState`, emit `AgentEvent` records, and broadcast progress over WebSocket.

```
Monitoring → Investigation → [Risk ∥ Compliance] → Escalation
```

### 1. Monitoring Agent
**Role:** First responder — detects behavioral anomalies from telemetry.

| Capability | Details |
|------------|---------|
| Rule-based pre-screen | Runs `detect_anomaly_patterns()` before LLM call |
| Signal classification | Outputs `anomaly_signals` with severity (LOW → CRITICAL) |
| Context awareness | Compares against previous investigation summary if vessel was seen before |
| Inputs | Days stationary, AIS gap hours, speed, heading, flag state, risk factors |

### 2. Investigation Agent
**Role:** Evidence gatherer — corroborates anomalies with owner and registry data.

| Capability | Details |
|------------|---------|
| Registry cross-reference | Owner dispute history, prior ITF incidents, insurance status |
| Evidence synthesis | Findings + source citations from in-memory enrichment data |
| Graceful fallback | Uses vessel registry when external web search is unavailable |
| Outputs | Structured evidence list feeding Risk and Compliance agents |

### 3. Risk Agent *(runs in parallel with Compliance)*
**Role:** Quantitative analyst — scores abandonment probability.

| Capability | Details |
|------------|---------|
| Conservative scoring | Normal operating vessels score below 30; escalation threshold at 70 |
| Confidence bands | `risk_score_range` widens when AIS data is sparse |
| Factor breakdown | Per-factor weights with justification (stationary days, AIS gaps, flag risk, etc.) |
| Trend tracking | Compares current score against investigation history (`INCREASING` / `STABLE` / `DECREASING`) |

### 4. Compliance Agent *(runs in parallel with Risk)*
**Role:** Legal/regulatory analyst — maps findings to maritime law.

| Capability | Details |
|------------|---------|
| Threshold branching | Risk < 70 → no regulatory concerns; ≥ 70 → full legal analysis |
| Convention mapping | MLC 2006, UNCLOS, flag-state obligations |
| Port-state options | Identifies intervention pathways for distressed crews |
| Outputs | `applicable_conventions`, `flag_state_obligations`, `port_state_options` |

### 5. Escalation Agent
**Role:** Final decision-maker — produces the intervention package or no-action report.

| Capability | Details |
|------------|---------|
| Mandatory branching | `risk_score < 70` → `requires_escalation: false` with monitoring interval |
| Crisis package | `risk_score ≥ 70` → ITF targets, crew estimates, unpaid wages, timeline |
| Urgency levels | `IMMEDIATE`, `URGENT`, `MONITOR`, `NONE` |
| Enforcement layer | `enforce_escalation_branch()` guarantees correct branch even if LLM drifts |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     HARBORWATCH AI (Ocean11)                     │
├──────────────────────────────────────────────────────────────────┤
│  Layer 1 — Data Ingestion                                        │
│    aisstream.io WebSocket  │  Simulated crisis vessels (×3)      │
│    Vessel registry + flag-state risk data                        │
├──────────────────────────────────────────────────────────────────┤
│  Layer 2 — Risk Intelligence                                     │
│    Rule-based scoring (0–100)  │  Fleet pattern detection       │
│    Auto-trigger at score ≥ 60  │  Investigation memory          │
├──────────────────────────────────────────────────────────────────┤
│  Layer 3 — LangGraph Agent Pipeline (Gemini 2.5 Flash)           │
│    Monitoring → Investigation → Risk ∥ Compliance → Escalation   │
├──────────────────────────────────────────────────────────────────┤
│  Layer 4 — FastAPI REST + WebSocket (/ws/feed)                   │
├──────────────────────────────────────────────────────────────────┤
│  Layer 5 — React Dashboard (Vercel)                              │
│    Deck.gl map │ Agent timeline │ Reports │ Alerts               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11, FastAPI, uvicorn |
| Agent orchestration | LangGraph |
| AI model | Gemini 2.5 Flash (`google-genai`) |
| AIS data | [aisstream.io](https://aisstream.io) WebSocket |
| Risk engine | Rule-based heuristics + scikit-learn |
| Real-time | FastAPI WebSocket |
| Frontend | React 18, TypeScript, Vite |
| Map | Deck.gl + MapLibre GL |
| Styling | Tailwind CSS |
| State | Zustand |
| Charts | Recharts |
| Deployment | Vercel (frontend) + Railway (backend, Docker) |

---

## Project Structure

```
ocean11/
├── backend/
│   ├── main.py                 # FastAPI app, routes, WebSocket feed
│   ├── models.py               # Pydantic schemas
│   ├── config.py               # Environment configuration
│   ├── Dockerfile              # Railway production container
│   ├── agents/
│   │   ├── pipeline.py         # LangGraph workflow
│   │   ├── monitoring_agent.py
│   │   ├── investigation_agent.py
│   │   ├── risk_agent.py
│   │   ├── compliance_agent.py
│   │   └── escalation_agent.py
│   ├── data/
│   │   ├── ais_client.py       # Live AIS WebSocket client
│   │   ├── simulator.py        # Crisis scenario injection
│   │   └── vessel_registry.py  # Owner/flag enrichment
│   └── risk/
│       ├── scoring.py          # Risk score calculation
│       ├── patterns.py         # Anomaly detection rules
│       └── fleet_patterns.py   # Cross-vessel fleet signals
└── frontend/
    └── src/
        ├── pages/              # LiveMap, Investigations, Reports, Alerts
        ├── components/         # Map, vessel panel, agent feed, reports
        ├── hooks/              # useWebSocket, useVessels, useInvestigation
        ├── store/              # Zustand stores
        └── api/                # REST client + mappers
```

---

## Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 18+
- API keys: [Google AI Studio](https://aistudio.google.com) (Gemini) + [aisstream.io](https://aisstream.io) (free AIS)

### 1. Backend

```bash
cd backend
cp .env.example .env   # add GEMINI_API_KEY and AISSTREAM_API_KEY
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:8000
npm install --legacy-peer-deps
npm run dev
```

Open **http://localhost:5173**

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `AISSTREAM_API_KEY` | Yes | aisstream.io API key |
| `PORT` | No | Server port (default: 8000) |
| `FRONTEND_URL` | No | CORS origin for production frontend |
| `MAX_VESSELS` | No | AIS vessel cap (default: 500) |
| `PIPELINE_THRESHOLD` | No | Auto-trigger score (default: 60) |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend REST URL |
| `VITE_WS_URL` | Yes | Backend WebSocket URL |
| `VITE_MAPTILER_KEY` | No | MapTiler key for dark map style |

---

## Team

Ocean11 — HarborWatch AI · Maritime intelligence for the crews the world forgot.
