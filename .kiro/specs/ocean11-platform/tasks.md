# Implementation Plan: Ocean11 Platform

## Overview

Build Ocean11 as a full-stack autonomous maritime intelligence platform following the Section 17 build checklist sequence: Backend Foundation → Data Layer → Agent Pipeline → API + Real-time → Frontend Foundation → Frontend UI → Integration + Verification. All storage is in-memory; no database required.

Language: **Python 3.11** (backend) + **TypeScript / React 18** (frontend).

---

## Tasks

- [ ] 1. Backend Foundation
  - [ ] 1.1 Scaffold FastAPI application with health endpoint
    - Create `backend/main.py` with FastAPI app instance and `GET /health` returning `{"status": "ok"}`
    - Create `backend/config.py` loading all env vars (`GEMINI_API_KEY`, `AISSTREAM_API_KEY`, `PORT`) via `python-dotenv`; define `PIPELINE_THRESHOLD = 60`, `COOLDOWN_SECONDS = 3600`, `MAX_VESSELS = 500`
    - Create `backend/requirements.txt` with pinned versions: `fastapi==0.111.0`, `uvicorn[standard]==0.29.0`, `langgraph==0.1.0`, `google-genai>=1.0.0`, `pydantic==2.7.0`, `python-dotenv==1.0.1`, `httpx==0.27.0`, `websockets==12.0`, `scikit-learn==1.4.0`, `numpy==1.26.0`
    - _Requirements: 16.1, 16.5_

  - [ ] 1.2 Implement all Pydantic models
    - Create `backend/models.py` with `Vessel`, `AgentEvent`, `EscalationReport` (all fields from Requirement 8.1), `InvestigationState` TypedDict, and `StatsResponse`
    - `EscalationReport.urgency_level` must use `Literal["IMMEDIATE", "URGENT", "MONITOR", "NONE"]`
    - `EscalationReport.no_action_reason: str | None` and `recheck_interval_hours: int | None`
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 1.3 Write property test for EscalationReport schema integrity
    - **Property 8: EscalationReport Schema Integrity** — serialize any report to JSON and back; assert structural identity
    - **Property 9: No-Action Branch Invariants** — for any report with `requires_escalation=False`, assert `escalation_targets == []`, `no_action_reason` is non-empty string, `urgency_level in ("NONE","MONITOR")`, `recheck_interval_hours > 0`
    - **Property 10: Escalation Branch Invariants** — for any report with `requires_escalation=True`, assert `no_action_reason is None`, `len(escalation_targets) >= 1`, each target has `org/contact/priority/message`, `urgency_level in ("URGENT","IMMEDIATE")`
    - **Validates: Requirements 8.1, 8.2, 8.3, 7.1, 7.2**

- [ ] 2. Data Layer — AIS Client
  - [ ] 2.1 Implement AIS client with connection state machine
    - Create `backend/data/ais_client.py`
    - Define `ConnectionState` enum: `CONNECTING`, `CONNECTED`, `DISCONNECTED`, `RECONNECTING`
    - Implement `AISClient` with `WebSocket` connection to `wss://stream.aisstream.io/v0/stream`
    - Subscription message filters vessel types 70–89, global bounding box
    - Maintain `self.vessels: dict[str, Vessel]` capped at `MAX_VESSELS`
    - On each message: parse position/speed/heading/destination, update vessel, record `last_received_timestamp = datetime.utcnow()`
    - _Requirements: 1.1, 1.2_

  - [ ] 2.2 Implement eviction policy and AIS gap tracking
    - Implement `_maybe_evict()`: when `len(vessels) >= MAX_VESSELS`, delete vessel with minimum `last_ais_signal`
    - Implement background 60-second tick that updates `ais_gap_hours = (utcnow - last_ais_signal).total_seconds() / 3600` for all vessels
    - _Requirements: 1.4, 1.5_

  - [ ]* 2.3 Write property test for vessel store capacity and eviction
    - **Property 1: Vessel Store Capacity and Eviction** — generate sequences of AIS messages exceeding 500 entries; assert store never exceeds 500 and evicted vessel always has the oldest `last_ais_signal`
    - **Property 2: AIS Gap Calculation Accuracy** — for any vessel with known `last_ais_signal` and current time, assert `ais_gap_hours == (current_time - last_ais_signal).total_seconds() / 3600` within float precision
    - **Validates: Requirements 1.2, 1.4, 1.5**

  - [ ] 2.4 Implement reconnection with exponential backoff and backfill
    - Implement `reconnect_loop()` with states: DISCONNECTED → RECONNECTING → CONNECTING → CONNECTED
    - Backoff: `delay = min(1 * 2^attempt, 60)`; reset attempt counter to 0 on success
    - Implement `_request_backfill()`: send `BackfillFrom: last_received_timestamp.isoformat()` on reconnect
    - _Requirements: 1.3_

  - [ ]* 2.5 Write property test for exponential backoff sequence
    - **Property 3: Exponential Backoff Sequence** — for N failed attempts, assert delay at attempt K equals `min(1 * 2^(K-1), 60)`; verify cap at 60s is exact
    - **Validates: Requirements 1.3**

- [ ] 3. Data Layer — Simulator, Registry, and Risk Engine
  - [ ] 3.1 Implement crisis simulator
    - Create `backend/data/simulator.py` with `SIMULATED_VESSELS` list: SIM001 (MV Esperanza, risk_score=91), SIM002 (MV Fortuna Star, risk_score=78), SIM003 (MV Konstantinos, risk_score=95)
    - Each vessel: `is_simulated=True`, coordinates, risk factors, and all `Vessel` fields as specified in the design
    - Create `inject_simulated_vessels(vessel_store: dict)` function called at startup
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.2 Implement vessel registry
    - Create `backend/data/vessel_registry.py` with `HIGH_RISK_FLAG_STATES` set (Comoros, Palau, Tuvalu, Sierra Leone, Belize, Bolivia, Mongolia)
    - Define `RISK_REGIONS` list with lat/lon bounds for Red Sea, Gulf of Aden, West Africa, SE Asia; `REGION_BOOST = 10`
    - Implement `VesselEnrichment` dataclass with flags: `owner_dispute_history`, `prior_itf_incident`, `no_recent_port_call`, `crew_complaint_filed`, `insurance_lapsed`
    - Implement `VesselRegistry.get_enrichment(mmsi) -> VesselEnrichment`; return zero-flag enrichment for unknown MMSIs
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 3.3 Implement risk scoring engine and auto-trigger coordinator
    - Create `backend/risk/scoring.py` with `compute_risk_score(vessel, registry) -> tuple[float, str]`
    - Apply `RISK_FACTORS` weights exactly as in design (mutually exclusive tiers for stationary/AIS-gap)
    - Apply `REGION_BOOST` if vessel lat/lon in any `RISK_REGION`; cap at 100; assign `risk_level` per thresholds
    - Create `backend/risk/patterns.py` with anomaly pattern detection helpers used by Monitoring Agent
    - Create `PipelineCoordinator` in `backend/risk/scoring.py`: `maybe_trigger()`, `on_run_complete()` with asyncio lock, `active_run`, `cooldowns` dict
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 3.4 Write property tests for risk scoring and pipeline coordinator
    - **Property 4: Risk Score Computation Correctness** — for any subset of risk factor flags, assert `risk_score == min(sum_of_weights + optional_boost, 100)` and `risk_level` matches threshold bands
    - **Property 5: Risk Region Boost** — for two identical vessels differing only in coordinates, assert region vessel has strictly higher score (unless cap prevents difference)
    - **Property 6: Pipeline Singleton Invariant** — simulate concurrent trigger events; assert at most one run active at any instant
    - **Property 7: Cooldown Suppression** — after a run completes at time T with cooldown D, assert all triggers in `(T, T+D)` are suppressed; first trigger after `T+D` is accepted
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 4.2, 4.3, 4.4, 17.4**

- [ ] 4. Checkpoint — Data layer complete
  - Ensure AIS client, simulator, registry, and risk scoring all unit-test cleanly. Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Agent Pipeline — LangGraph Scaffold and Gemini Client
  - [ ] 5.1 Create LangGraph pipeline scaffold and Gemini helper
    - Create `backend/agents/pipeline.py` with `StateGraph(InvestigationState)`, five nodes wired in order: `monitoring_node → investigation_node → (risk_node || compliance_node) → escalation_node`
    - Set entry point to `monitoring_node`; compile to `pipeline` module-level object
    - Implement `call_gemini(system_prompt, user_prompt, tools=None) -> dict` in a shared `backend/agents/base.py` using `client.aio.models.generate_content` with `gemini-2.5-flash`, `response_mime_type="application/json"`, and the `JSON_SUFFIX` appended to system instructions
    - Define `INVESTIGATION_TOOLS = [{"type": "web_search_20250305", "name": "web_search"}]`
    - Implement pipeline-level error handler: on exception in any node, record `AgentEvent(status="error")`, broadcast over WebSocket, halt pipeline, call `coordinator.on_run_complete()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 16.2_

- [ ] 6. Agent Pipeline — Monitoring Agent
  - [ ] 6.1 Implement Monitoring Agent
    - Create `backend/agents/monitoring_agent.py`
    - Write unique Gemini system prompt: focus on vessel behavioral anomaly detection — stationary days, AIS gaps, flag state, known risk factors; output ONLY confirmed anomaly signals
    - Input: `InvestigationState.vessel` (AIS history, days stationary, gaps, flag, risk factors)
    - Implement structured JSON output parsing: parse array of `{signal_type, severity: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", description}` objects
    - Record `AgentEvent(status="running")` before Gemini call; record `AgentEvent(status="complete", output_summary=..., reasoning=..., duration_ms=...)` after
    - Broadcast `agent_event` over WebSocket at both transitions
    - Handle error: on exception, record `AgentEvent(status="error", output_summary=str(e), reasoning="")`, broadcast, re-raise to trigger pipeline halt
    - _Requirements: 5.4, 5.5, 6.1, 10.3_

- [ ] 7. Agent Pipeline — Investigation Agent
  - [ ] 7.1 Implement Investigation Agent
    - Create `backend/agents/investigation_agent.py`
    - Write unique Gemini system prompt: maritime investigator role — given anomaly signals, gather corroborating evidence from maritime news and owner history; output structured evidence package
    - Enable web search tool: pass `tools=INVESTIGATION_TOOLS` to `call_gemini`
    - Implement structured JSON output parsing: parse `{findings: list[str], source_citations: list[str], web_search_status: "ok"|"web_search_unavailable"}`
    - Implement fallback: if web search raises or returns no results, catch exception, set `web_search_status: "web_search_unavailable"`, populate `findings` from in-memory vessel enrichment data
    - Record `AgentEvent(status="running")` before call; `AgentEvent(status="complete")` after; broadcast both over WebSocket
    - Handle error case identically to Monitoring Agent
    - _Requirements: 5.4, 5.5, 6.2, 6.3, 10.3_

- [ ] 8. Agent Pipeline — Risk Agent
  - [ ] 8.1 Implement Risk Agent
    - Create `backend/agents/risk_agent.py`
    - Write unique Gemini system prompt: maritime risk analyst role — score 0–100, justify each factor; explicitly instruct model to score conservatively and output LOW/MEDIUM scores for vessels with normal behavior (recent port calls, continuous AIS, no disputes)
    - Implement structured JSON output parsing: parse `{risk_score: int, risk_level: str, factor_breakdown: [{factor, weight, applies, justification}], overall_justification: str}`
    - Store output in `InvestigationState.risk_assessment`
    - Record `AgentEvent(status="running")` before call; `AgentEvent(status="complete")` after; broadcast both
    - Handle error case identically to Monitoring Agent
    - _Requirements: 5.4, 5.5, 6.4, 6.5, 10.3_

- [ ] 9. Agent Pipeline — Compliance Agent
  - [ ] 9.1 Implement Compliance Agent
    - Create `backend/agents/compliance_agent.py`
    - Write unique Gemini system prompt: legal/regulatory analyst — if `risk_score < 70`, output `{applicable_conventions: [], regulatory_notes: "no regulatory concerns identified"}`; if `>= 70`, identify MLC 2006, UNCLOS, flag-state obligations, port-state options
    - Read `risk_score` from `InvestigationState.risk_assessment`
    - Implement structured JSON output parsing: parse `{applicable_conventions: list[str], flag_state_obligations: str, port_state_options: str, regulatory_notes: str}`
    - Store output in `InvestigationState.compliance_findings`
    - Record `AgentEvent(status="running")` before call; `AgentEvent(status="complete")` after; broadcast both
    - Handle error case identically to Monitoring Agent
    - _Requirements: 5.4, 5.5, 6.6, 6.7, 10.3_

- [ ] 10. Agent Pipeline — Escalation Agent
  - [ ] 10.1 Implement Escalation Agent — core structure
    - Create `backend/agents/escalation_agent.py`
    - Write unique Gemini system prompt: humanitarian intervention coordinator role; append explicit instruction: "The default outcome for a vessel with risk_score below 70 is requires_escalation: false. Do not produce a full intervention package unless the risk score is 70 or above."
    - Input: full `InvestigationState` (vessel, evidence, risk_assessment, compliance_findings)
    - Implement structured JSON output parsing: parse complete `EscalationReport` object from Gemini response
    - Store completed report in `InvestigationState.escalation_report`
    - Record `AgentEvent(status="running")` before call; `AgentEvent(status="complete")` after; broadcast both
    - Handle error case identically to other agents
    - _Requirements: 5.4, 5.5, 10.3_

  - [ ] 10.2 Implement requires_escalation branching logic
    - After parsing Gemini output, enforce hard branching rules in Python (not relying solely on Gemini):
      - If `risk_score < 70`: override `requires_escalation = False`, ensure `escalation_targets = []`, ensure `no_action_reason` is non-empty string, ensure `recheck_interval_hours` is positive int, set `urgency_level` to `"NONE"` or `"MONITOR"`
      - If `risk_score >= 70`: override `requires_escalation = True`, ensure `escalation_targets` has at least one entry with `org/contact/priority/message`, ensure `no_action_reason = None`, set `urgency_level` to `"URGENT"` or `"IMMEDIATE"`
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 10.3 Implement no-action branch field population
    - When `requires_escalation = False`: populate `no_action_reason` with plain-language explanation; populate `recheck_interval_hours` with positive integer; leave `escalation_targets` as `[]`; set `urgency_level = "NONE"` or `"MONITOR"`
    - When `requires_escalation = True`: populate `escalation_targets` with at least one `{org, contact, priority, message}` entry; set `urgency_level = "URGENT"` or `"IMMEDIATE"`; ensure `no_action_reason = None`
    - _Requirements: 7.1, 7.2_

  - [ ]* 10.4 Write property test for escalation branch routing
    - **Property 11: Risk Score Determines Escalation Branch** — for any `risk_score < 70`, assert `requires_escalation == False`; for any `risk_score >= 70`, assert `requires_escalation == True` (test the Python enforcement layer, not Gemini output)
    - **Validates: Requirements 7.1, 7.2, 7.3, 18.1**

- [ ] 11. Agent Pipeline — Error Handling and Pipeline Wiring
  - [ ] 11.1 Implement pipeline-level error handling
    - In `pipeline.py`, wrap each node invocation in try/except
    - On exception: create `AgentEvent(status="error", output_summary=str(e), reasoning="")`, append to state, broadcast over WebSocket, call `coordinator.on_run_complete(mmsi)`, halt pipeline (return partial state)
    - _Requirements: 5.5_

  - [ ]* 11.2 Write property test for agent error pipeline halt
    - **Property 14: Agent Error Halts Pipeline** — for any pipeline execution where node K raises, assert `AgentEvent(status="error")` exists for K, and no `AgentEvent` records exist for nodes K+1..5
    - **Validates: Requirements 5.5**

- [ ] 12. Checkpoint — Agent pipeline complete
  - All five agents implemented, wired in LangGraph graph, error handling tested. Ensure all tests pass, ask the user if questions arise.

- [ ] 13. API + Real-Time Layer
  - [ ] 13.1 Implement all REST endpoints
    - In `backend/main.py`, implement module-level singletons: `vessels: dict[str, Vessel]`, `investigations: dict[str, InvestigationState]`, `reports: dict[str, EscalationReport]`, `ws_connections: list[WebSocket]`, `stats_counters`
    - Inject simulated vessels at startup via `inject_simulated_vessels(vessels)`
    - Start AIS client as background asyncio task at startup
    - Start risk scoring background loop as asyncio task
    - `GET /vessels`: return vessel list; support `risk_level` filter and `limit` (default 50) query params; _Requirements: 9.1_
    - `GET /vessels/{mmsi}`: return full vessel + all AgentEvents; 404 if not found; _Requirements: 9.2, 9.8_
    - `POST /vessels/{mmsi}/investigate`: start pipeline; return `{investigation_id, status: "started"}`; 409 if coordinator busy; _Requirements: 9.3, 9.4_
    - `GET /investigations/{investigation_id}`: return current InvestigationState; 404 if not found; _Requirements: 9.5, 9.8_
    - `GET /reports/{mmsi}`: return latest EscalationReport; 404 if not found; _Requirements: 9.6, 9.8_
    - `GET /stats`: return `{total_monitored, high_risk_count, critical_count, investigations_today, reports_generated}`; _Requirements: 9.7_

  - [ ] 13.2 Implement WebSocket feed and broadcast helpers
    - Implement `GET /ws/feed` endpoint; add/remove connections from `ws_connections` list
    - Implement `broadcast(msg: dict)` helper that sends to all active connections; on per-client failure, log and skip
    - Wire broadcast calls: `vessel_update` after every AIS/score update; `agent_event` on each AgentEvent creation; `alert` when `risk_level` transitions to HIGH or CRITICAL; `report_ready` when Escalation Agent writes report
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 14. Checkpoint — Backend complete
  - All 7 routes and WebSocket feed operational. Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Frontend Foundation
  - [ ] 15.1 Scaffold Vite + React + TypeScript + Tailwind project
    - Create `frontend/` with `npm create vite@latest` (React + TypeScript template)
    - Install dependencies: `react@^18.3.0`, `react-dom@^18.3.0`, `@deck.gl/react@^9.0.0`, `@deck.gl/layers@^9.0.0`, `maplibre-gl@^4.0.0`, `recharts@^2.12.0`, `zustand@^4.5.0`, `tailwindcss@^3.4.0`, `lucide-react@^0.383.0`
    - Configure `tailwind.config.js` with `ocean` and `risk` color extensions exactly as in design
    - Create `frontend/.env` with `VITE_API_URL` and `VITE_WS_URL` variables
    - _Requirements: 16.3, 16.4_

  - [ ] 15.2 Implement TypeScript type definitions
    - Create `frontend/src/types/index.ts` with all interfaces: `Vessel`, `AgentEvent`, `EscalationReport`, `EscalationTarget`, `StatsResponse`, `WsFeedMessage` union type — matching backend Pydantic models exactly
    - _Requirements: 8.1, 16.4_

  - [ ] 15.3 Implement Zustand store
    - Create `frontend/src/store/vesselStore.ts` implementing `VesselStore` interface: `vessels`, `selectedMmsi`, `activeInvestigation`, `latestReports`, `agentEvents`, `stats` state slices
    - Implement actions: `setSelectedMmsi`, `upsertVessel`, `appendAgentEvent`, `setReport`, `updateStats`
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 15.4 Implement WebSocket hook
    - Create `frontend/src/hooks/useWebSocket.ts`
    - On `vessel_update`: call `store.upsertVessel`
    - On `agent_event`: call `store.appendAgentEvent`
    - On `alert`: trigger toast or store notification
    - On `report_ready`: fetch `GET /reports/{mmsi}` and call `store.setReport`
    - On `onclose`: reconnect after 3 seconds
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 16. Frontend UI — GlobalMap
  - [ ] 16.1 Implement GlobalMap component
    - Create `frontend/src/components/GlobalMap.tsx`
    - Initialize MapLibre basemap via `maplibre-gl` using `VITE_MAPTILER_KEY` (or blank style for no-key fallback)
    - Implement `ScatterplotLayer` for all vessels; `getFillColor` maps `risk_level` to RGBA values as specified in design
    - Implement `ScenegraphLayer` for `is_simulated=true` vessels with pulse animation (`_animations: {"*": {speed: 2}}`)
    - Implement `PathLayer` for last 10 positions of selected vessel
    - Implement `TextLayer` for vessel name on hover
    - On click: call `store.setSelectedMmsi(object.mmsi)`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 17. Frontend UI — StatsBar and VesselPanel
  - [ ] 17.1 Implement StatsBar component
    - Create `frontend/src/components/StatsBar.tsx`
    - Display Monitored, High Risk, Critical, Investigating counts from Zustand store
    - Update in real time via `vessel_update` events (re-derive counts from store)
    - Use `text-risk-high`, `text-risk-critical`, `text-ocean-accent` color classes
    - _Requirements: 11.2_

  - [ ] 17.2 Implement VesselPanel component
    - Create `frontend/src/components/VesselPanel.tsx`
    - Display all vessel fields: name, MMSI, flag state, vessel type, owner, operator, speed, heading, last port, destination, days stationary, AIS gap hours, risk score, risk level, risk factors list
    - Render risk score bar: `width: {risk_score}%`, `backgroundColor: RISK_COLORS[risk_level]`
    - Implement INVESTIGATE button: `POST /vessels/{mmsi}/investigate`; disable while investigation active; re-enable on complete or error
    - On 409 response: display inline message "Another investigation is currently in progress"
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 18. Frontend UI — AgentTimeline
  - [ ] 18.1 Implement AgentTimeline component — base states
    - Create `frontend/src/components/AgentTimeline.tsx`
    - Render five pipeline nodes in order: Monitoring, Investigation, Risk, Compliance, Escalation
    - `pending` state: hollow gray circle, grayed name
    - `running` state: `animate-pulse` blue dot + spinner icon
    - `complete` state: green checkmark + `output_summary` text; click to expand full `reasoning` field
    - `error` state: red X + error message text
    - Derive node states from `store.agentEvents[selectedMmsi]` array
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ] 18.2 Implement no-action card (teal/green styling)
    - When Escalation node completes with `requires_escalation: false`, render:
      ```tsx
      <div className="rounded-lg border border-teal-800/40 bg-teal-950/30 p-4 mt-2 no-action-card">
      ```
    - Urgency badge: `bg-teal-900/50 text-teal-300 urgency-badge-monitor` class — NO `animate-pulse`
    - Display `no_action_reason` text and `recheck_interval_hours` as "Recheck in Xh"
    - This card MUST NOT include `animate-pulse`, `text-red-*`, `bg-red-*`, `text-orange-*`, `bg-orange-*` classes
    - _Requirements: 14.5, 14.6_

  - [ ] 18.3 Implement escalation alert card (red styling)
    - When Escalation node completes with `requires_escalation: true`, render:
      ```tsx
      <div className="rounded-lg border border-red-700/60 bg-red-950/30 p-4 mt-2 escalation-alert-card">
      ```
    - Urgency badge: `bg-red-600 text-white animate-pulse urgency-badge-critical`
    - Display first key finding prominently
    - _Requirements: 14.5_

  - [ ]* 18.4 Write DOM assertion test for no-action-card node
    - **Property 12: AgentTimeline No-Action Rendering** — render `AgentTimeline` with a report where `requires_escalation=False`; assert DOM contains `.no-action-card`; assert no element within Escalation node has `escalation-alert-card`, `animate-pulse`, `bg-red-*`, `text-red-*`, `bg-orange-*`, or `text-orange-*` class
    - **Validates: Requirements 14.5, 14.6**

- [ ] 19. Frontend UI — EscalationReport Viewer
  - [ ] 19.1 Implement EscalationReport viewer component
    - Create `frontend/src/components/EscalationReport.tsx`
    - Auto-display when `report_ready` WebSocket event arrives for selected vessel
    - `requires_escalation: true` layout: urgency badge (red/orange pulsing), key findings list, timeline of events, applicable conventions, flag state obligations, port state options, recommended actions, escalation targets with org/contact/priority/draft message
    - `requires_escalation: false` layout: muted teal urgency badge (no pulse), `no_action_reason` paragraph, `recheck_interval_hours` as "Recheck in Xh", no escalation targets section
    - Show loading skeleton until `report_ready` event arrives
    - _Requirements: 15.1, 15.2, 15.3_

- [ ] 20. Frontend UI — App layout and RiskBadge
  - [ ] 20.1 Implement App layout and RiskBadge
    - Create `frontend/src/components/RiskBadge.tsx`: color-coded badge component for risk level
    - Update `frontend/src/App.tsx` with grid layout: `StatsBar` (full width top), `GlobalMap` (full width), `VesselPanel` (left half) + `AgentTimeline` (right half) below map; desktop-only, no responsive breakpoints
    - Mount `useWebSocket` hook in `App.tsx` connecting to `VITE_WS_URL/ws/feed`
    - _Requirements: 11.1, 11.2, 11.3_

- [ ] 21. Checkpoint — Frontend complete
  - All UI components rendered, Zustand store wired, WebSocket hook connected. Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Integration + Verification — End-to-End Connection
  - [ ] 22.1 Connect frontend to live backend end-to-end
    - Configure CORS in `backend/main.py` to allow `http://localhost:5173` (Vite dev origin)
    - Verify `useWebSocket` connects to `ws://localhost:8000/ws/feed` and receives live events
    - Verify clicking a vessel on the map populates `VesselPanel` with live backend data
    - Verify pressing INVESTIGATE triggers the pipeline and `AgentTimeline` updates in real time
    - Verify `EscalationReport` viewer auto-populates on `report_ready` event
    - Fix any type mismatches between TypeScript interfaces and actual backend JSON responses
    - _Requirements: 9.1–9.7, 10.1–10.5, 11.1–11.3, 12.1–12.5, 13.1–13.4, 14.1–14.6, 15.1–15.3_

- [ ] 23. Integration + Verification — Simulated Crisis Scenarios
  - [ ] 23.1 Test all 5 agents firing in sequence on each of the 3 simulated scenarios
    - Write `backend/tests/test_integration.py`
    - For each of SIM001, SIM002, SIM003: invoke `run_pipeline_for_mmsi(mmsi)` and assert:
      - All 5 `AgentEvent` records created with `status="complete"`
      - `EscalationReport.requires_escalation == True`
      - `EscalationReport.urgency_level in ("URGENT", "IMMEDIATE")`
      - `len(EscalationReport.escalation_targets) >= 1`
    - Run tests and fix any agent prompt or parsing issue that causes incorrect output
    - _Requirements: 18.3_

- [ ] 24. Integration + Verification — No-Action Branch Test (HARD REQUIREMENT)
  - [ ] 24.1 Test no-action branch against real low-risk vessel
    - Add `test_normal_vessel_no_action()` to `backend/tests/test_integration.py`
    - Select a real vessel from live AIS feed with `risk_score < 60` at test time (or use a mocked low-risk vessel if AIS is unavailable at test runtime)
    - Invoke pipeline; assert `EscalationReport.requires_escalation == False`
    - Assert `EscalationReport.urgency_level in ("NONE", "MONITOR")`
    - Assert `EscalationReport.no_action_reason is not None` and non-empty
    - Assert `EscalationReport.escalation_targets == []`
    - **If this test produces `requires_escalation: true` for a vessel with `risk_score < 60`: revise risk scoring weights in `config.py` and agent prompts in all five agent files before marking this task complete**
    - _Requirements: 18.1, 18.2_

  - [ ] 24.2 Verify coexistence of real and simulated vessels
    - Assert `GET /vessels` returns SIM001, SIM002, SIM003 alongside real AIS vessels in a single response
    - Assert `is_simulated=True` vessels are NOT filtered out when no `risk_level` filter is applied
    - _Requirements: 2.3_

  - [ ]* 24.3 Write property test for vessel coexistence
    - **Property 13: Vessel Coexistence** — for any combination of real and simulated vessels in the store, assert `GET /vessels` returns all of them (up to `limit`) with no filtering by `is_simulated`
    - **Validates: Requirements 2.3**

- [ ] 25. README and Setup Instructions
  - [ ] 25.1 Write README.md with complete setup instructions
    - Create `README.md` at workspace root
    - Document all required environment variables: `GEMINI_API_KEY` (get from Google AI Studio), `AISSTREAM_API_KEY` (free at aisstream.io), `PORT` (default 8000), `VITE_API_URL`, `VITE_WS_URL`, `VITE_MAPTILER_KEY` (free at maptiler.com)
    - Backend run commands: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`
    - Frontend run commands: `cd frontend && npm install && npm run dev`
    - Document the 3 simulated scenarios (SIM001/SIM002/SIM003) and how to trigger them
    - Document the no-action test requirement and how to run integration tests
    - _Requirements: 17.1–17.4 (out-of-scope constraints), demo operator guidance_

- [ ] 26. Final Checkpoint — Build Complete
  - All tasks complete. No-action test (Task 24.1) is passing. All 3 simulated scenarios produce `requires_escalation: true`. All 5 agents fire in sequence. Frontend connected to live backend. README complete. **The build is NOT complete unless Task 24.1 is marked done with a passing result.**

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all core tasks are mandatory
- Task 24.1 (no-action branch test) is a **hard requirement** — the build is considered incomplete without it passing
- Each agent task (6, 7, 8, 9, 10) must include: unique Gemini prompt, structured JSON output parsing, `AgentEvent` before/after Gemini call, WebSocket broadcast, and error handling
- The Escalation Agent (Task 10) has additional hard branching: Python-enforced `requires_escalation` logic, not relying on Gemini alone
- Minimum 100 iterations per property-based test (use `@settings(max_examples=100)` with Hypothesis)
- The `no-action-card` CSS class is a required DOM marker for testing; do not rename it
- Backend and frontend can be developed in parallel after Task 14 (backend complete)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "3.1", "3.2"] },
    { "id": 3, "tasks": ["2.5", "3.3"] },
    { "id": 4, "tasks": ["3.4", "5.1"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["7.1"] },
    { "id": 7, "tasks": ["8.1"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["10.1"] },
    { "id": 10, "tasks": ["10.2", "10.3"] },
    { "id": 11, "tasks": ["10.4", "11.1"] },
    { "id": 12, "tasks": ["11.2", "13.1"] },
    { "id": 13, "tasks": ["13.2"] },
    { "id": 14, "tasks": ["15.1", "15.2"] },
    { "id": 15, "tasks": ["15.3", "15.4"] },
    { "id": 16, "tasks": ["16.1", "17.1", "17.2"] },
    { "id": 17, "tasks": ["18.1"] },
    { "id": 18, "tasks": ["18.2", "18.3"] },
    { "id": 19, "tasks": ["18.4", "19.1"] },
    { "id": 20, "tasks": ["20.1"] },
    { "id": 21, "tasks": ["22.1"] },
    { "id": 22, "tasks": ["23.1", "24.1"] },
    { "id": 23, "tasks": ["24.2", "25.1"] },
    { "id": 24, "tasks": ["24.3"] }
  ]
}
```
