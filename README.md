# Ocean11 — HarborWatch AI

Autonomous maritime intelligence platform that detects seafarer abandonment, humanitarian crises, and logistics risks using a 5-agent LangGraph pipeline.

## Quick Start

### 1. Environment Variables

Create `backend/.env`:

```env
GEMINI_API_KEY=your_key_here          # Google AI Studio
AISSTREAM_API_KEY=your_key_here       # Free at aisstream.io
PORT=8000
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_MAPTILER_KEY=your_key_here       # Optional — free at maptiler.com
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:5173

## Architecture

```
Monitoring → Investigation → Risk → Compliance → Escalation
```

All five agents share one `InvestigationState` and call `gemini-2.5-flash` via `google-genai`.

### No-Crisis Branch (Hard Requirement)

- `risk_score < 70` → `requires_escalation: false`, calm monitoring summary
- `risk_score >= 70` → full intervention package with ITF/flag-state targets

## Demo Scenarios

Three simulated crisis vessels are always on the map:

| MMSI   | Vessel           | Risk | Situation                          |
|--------|------------------|------|------------------------------------|
| SIM001 | MV Esperanza     | 91   | 47 days stationary off Oman        |
| SIM002 | MV Fortuna Star  | 78   | AIS dark 72h, Red Sea              |
| SIM003 | MV Konstantinos  | 95   | Crew complaint, owner unreachable  |

Click a vessel → **INVESTIGATE** → watch the agent timeline fire sequentially.

## API Endpoints

| Method | Path                          | Description              |
|--------|-------------------------------|--------------------------|
| GET    | `/health`                     | Health check             |
| GET    | `/vessels`                    | List vessels             |
| GET    | `/vessels/{mmsi}`             | Vessel detail + events   |
| POST   | `/vessels/{mmsi}/investigate` | Trigger 5-agent pipeline |
| GET    | `/investigations/{id}`        | Pipeline state           |
| GET    | `/reports/{mmsi}`             | Latest escalation report |
| GET    | `/stats`                      | Dashboard stats          |
| WS     | `/ws/feed`                    | Real-time event stream   |

## Verification

```bash
cd backend
python scripts/verify_pipeline.py
```

Tests:
1. All 3 simulated scenarios → `requires_escalation: true`, urgency `URGENT` or `IMMEDIATE`
2. Normal low-risk vessel → `requires_escalation: false` with `no_action_reason`

```bash
pytest tests/test_integration.py -v
```

## Crisis Simulator (Standalone)

```bash
python simulator/crisis_sim.py
```
