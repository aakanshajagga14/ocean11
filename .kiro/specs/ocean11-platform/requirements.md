# Requirements Document

## Introduction

Ocean11 is an autonomous maritime intelligence platform that detects seafarer abandonment, humanitarian crises, and logistics risks in the global cargo and tanker fleet. The system ingests live AIS telemetry from aisstream.io, overlays three hardcoded simulated crisis scenarios, applies rule-based risk scoring, and automatically triggers a five-agent LangGraph pipeline whenever a vessel's risk score reaches or exceeds 60. The pipeline produces either a full humanitarian intervention package or a calm "no action needed" summary depending on computed risk. A React/Deck.gl dashboard renders the globe map, vessel details, live agent timeline, and escalation reports in real time over a FastAPI WebSocket connection. The platform is designed for demonstration and hackathon judging; it uses in-memory storage only and does not send real notifications or require user authentication.

---

## Glossary

- **AIS**: Automatic Identification System — the maritime radio transponder protocol broadcasting vessel position, speed, heading, and identity.
- **AIS Gap**: A period during which no AIS signal was received from a vessel, measured in hours.
- **AgentEvent**: A Pydantic model recording one agent's execution within the pipeline — including status, input summary, output summary, reasoning trace, and duration.
- **AgentTimeline**: The frontend React component that renders the live ordered sequence of AgentEvents for the currently selected vessel investigation.
- **Compliance Agent**: The fourth LangGraph node; identifies applicable international maritime conventions and flag-state obligations when risk is HIGH or CRITICAL.
- **Cooldown**: A per-vessel lockout period that prevents the pipeline from auto-triggering again for the same vessel until the period has elapsed.
- **Deck.gl**: The WebGL-based geospatial visualization library used for the global vessel map layer.
- **EscalationReport**: A Pydantic model representing the final output of the Escalation Agent, with the exact fields enumerated in Requirement 8.
- **Escalation Agent**: The fifth LangGraph node; either generates a full humanitarian intervention package or outputs a "no action needed" summary with a recheck interval.
- **Gemini**: The `gemini-2.5-flash` model accessed via the `google-genai>=1.0.0` Python SDK, used by all five agents.
- **InvestigationState**: A LangGraph `TypedDict` shared across all five pipeline nodes, accumulating vessel data, evidence, agent events, risk assessment, compliance findings, and the escalation report.
- **Investigation Agent**: The second LangGraph node; gathers corroborating evidence using Gemini with the web search tool enabled.
- **LangGraph**: The Python orchestration library used to define the five-node StateGraph pipeline.
- **MapLibre**: The open-source map rendering library providing the basemap beneath the Deck.gl vessel layer.
- **MLC 2006**: The Maritime Labour Convention 2006 — the primary international instrument governing seafarer rights and flag-state obligations.
- **MMSI**: Maritime Mobile Service Identity — a nine-digit unique identifier for each vessel.
- **Monitoring Agent**: The first LangGraph node; identifies behavioral anomaly signals present in a vessel's telemetry.
- **No-Action Branch**: The pipeline outcome path where `requires_escalation` is `false`, `urgency_level` is `"NONE"` or `"MONITOR"`, `escalation_targets` is empty, and `no_action_reason` and `recheck_interval_hours` are populated.
- **Ocean11**: The autonomous maritime intelligence platform described in this document.
- **Pipeline**: The five-node LangGraph StateGraph: monitoring → investigation → risk → compliance → escalation.
- **Risk Agent**: The third LangGraph node; computes the final risk score (0–100) and urgency classification.
- **Risk Score**: A numeric value between 0 and 100 inclusive representing the estimated abandonment and humanitarian risk for a vessel.
- **Risk Region**: One of the four priority geographic zones — Red Sea, Gulf of Aden, West Africa, South-East Asia — where vessels receive a risk-score boost in the scoring algorithm.
- **Simulated Vessel**: One of the three hardcoded crisis scenarios (SIM001, SIM002, SIM003) that coexist with real AIS vessels in the in-memory store.
- **VesselPanel**: The frontend React component displaying the selected vessel's profile, risk score, and the trigger button for manual pipeline invocation.
- **WebSocket Feed**: The FastAPI `/ws/feed` endpoint that pushes `vessel_update`, `agent_event`, `alert`, and `report_ready` events to connected frontends.
- **Zustand**: The React state management library used by the frontend.

---

## Requirements

### Requirement 1 — AIS Data Ingestion

**User Story:** As a maritime intelligence operator, I want Ocean11 to ingest live AIS data for global cargo and tanker vessels, so that the platform has accurate, up-to-date positional intelligence as its foundation.

#### Acceptance Criteria

1. WHEN the backend starts, THE AIS Client SHALL open a WebSocket connection to aisstream.io and subscribe to vessel types 70–89 (cargo and tanker classifications).
2. WHILE the WebSocket connection is open, THE AIS Client SHALL maintain an in-memory store of up to 500 vessels keyed by MMSI, updating each vessel's position, speed, heading, and destination upon receipt of each AIS message.
3. WHEN the aisstream.io WebSocket connection drops, THE AIS Client SHALL attempt to reconnect with exponential back-off and SHALL request a backfill of missed messages upon successful reconnection.
4. IF the in-memory vessel store reaches 500 entries, THEN THE AIS Client SHALL evict the vessel with the oldest `last_ais_signal` timestamp before inserting a new entry.
5. THE AIS Client SHALL record `ais_gap_hours` for each vessel as the elapsed time in hours since the most recent received AIS message.

---

### Requirement 2 — Simulated Crisis Scenarios

**User Story:** As a demo operator, I want three pre-built crisis scenarios always present on the map alongside real vessels, so that judges can see compelling high-risk cases without depending on real-time AIS data producing them organically.

#### Acceptance Criteria

1. WHEN the backend starts, THE Simulator SHALL inject exactly three simulated vessels — MV Esperanza (MMSI: SIM001), MV Fortuna Star (MMSI: SIM002), and MV Konstantinos (MMSI: SIM003) — into the in-memory vessel store.
2. THE Simulator SHALL assign risk scores of 91, 78, and 95 to SIM001, SIM002, and SIM003 respectively, with the `is_simulated` flag set to `true` on each.
3. WHILE the backend is running, THE in-memory vessel store SHALL allow real AIS vessels and simulated vessels to coexist and be retrievable through the same `GET /vessels` endpoint.
4. THE Simulator SHALL not write vessel data to any persistent database or file system.

---

### Requirement 3 — Risk Scoring Engine

**User Story:** As an intelligence analyst, I want each vessel to carry a continuously updated risk score based on observable behavioral signals, so that the monitoring system can prioritize vessels most likely to require intervention.

#### Acceptance Criteria

1. WHEN a vessel record is updated, THE Risk Engine SHALL recompute the vessel's `risk_score` by summing the weighted risk factor contributions defined in `RISK_FACTORS` and capping the result at 100.
2. THE Risk Engine SHALL apply the following additive weights: `days_stationary_30_plus` (+25), `days_stationary_60_plus` (+40, replacing the 30-day weight), `ais_gap_24h` (+15), `ais_gap_72h` (+30, replacing the 24-hour weight), `flag_state_high_risk` (+15), `owner_dispute_history` (+20), `prior_itf_incident` (+25), `no_recent_port_call` (+10), `crew_complaint_filed` (+30), `insurance_lapsed` (+35).
3. WHERE a vessel's last known position falls within a Risk Region (Red Sea, Gulf of Aden, West Africa, South-East Asia), THE Risk Engine SHALL apply an additive priority boost to the vessel's risk score before the 100-point cap.
4. THE Risk Engine SHALL assign `risk_level` as `"LOW"` for scores 0–29, `"MEDIUM"` for 30–59, `"HIGH"` for 60–79, and `"CRITICAL"` for 80–100.
5. IF a vessel's computed `risk_score` reaches or exceeds 60 and no pipeline run for that vessel is currently active and the per-vessel cooldown period has not elapsed, THEN THE Risk Engine SHALL emit an auto-trigger event to the Pipeline Coordinator to initiate a new investigation for that vessel.

---

### Requirement 4 — Continuous Auto-Trigger with Cooldown

**User Story:** As an intelligence operator, I want the pipeline to fire automatically when a vessel crosses the risk threshold, without requiring manual action, so that high-risk vessels are never silently missed.

#### Acceptance Criteria

1. WHEN the Risk Engine emits an auto-trigger event for a vessel, THE Pipeline Coordinator SHALL start the five-agent pipeline for that vessel.
2. WHILE a pipeline run is active for a vessel, THE Pipeline Coordinator SHALL suppress additional auto-trigger events for the same vessel.
3. WHEN a pipeline run completes for a vessel, THE Pipeline Coordinator SHALL start a per-vessel cooldown timer and SHALL suppress auto-trigger events for that vessel until the cooldown expires.
4. THE Pipeline Coordinator SHALL support at most one active pipeline run at any time (no concurrent pipeline executions across different vessels).

---

### Requirement 5 — Five-Agent LangGraph Pipeline

**User Story:** As an intelligence operator, I want vessel investigations to be carried out by a structured sequence of specialized AI agents, so that each analytical step is distinct, traceable, and produces verifiable structured output.

#### Acceptance Criteria

1. THE Pipeline SHALL be implemented as a LangGraph `StateGraph` with exactly five nodes executed in the order: `monitoring_node` → `investigation_node` → `risk_node` → `compliance_node` → `escalation_node`.
2. THE Pipeline SHALL share a single `InvestigationState` TypedDict instance across all five nodes, with each node reading from and appending to the shared state.
3. WHEN `risk_node` and `compliance_node` are both ready to execute after `investigation_node` completes, THE Pipeline SHALL execute `risk_node` and `compliance_node` concurrently where LangGraph topology permits parallel fan-out.
4. THE Pipeline SHALL represent each agent as a distinct async Python function that calls `gemini-2.5-flash` via `google-genai>=1.0.0` with a structured JSON output prompt unique to that agent.
5. WHEN any agent node raises an unhandled exception, THE Pipeline SHALL record an `AgentEvent` with `status: "error"` for that node and halt further execution, leaving subsequent nodes in their initial state.

---

### Requirement 6 — Individual Agent Behaviors

**User Story:** As a maritime analyst, I want each agent to have a clearly bounded analytical responsibility and produce verifiable structured output, so that the pipeline's reasoning is transparent and auditable.

#### Acceptance Criteria

1. WHEN `monitoring_node` executes, THE Monitoring Agent SHALL analyze the vessel's AIS history, stationary days, AIS gaps, flag state, and risk factors, then produce a structured list of confirmed anomaly signals each annotated with a severity level.
2. WHEN `investigation_node` executes, THE Investigation Agent SHALL call Gemini with the web search tool enabled to retrieve live maritime news about the vessel and its owner, and SHALL produce a structured evidence package containing findings and source citations.
3. IF the Investigation Agent's web search returns no results or fails, THEN THE Investigation Agent SHALL produce an evidence package populated from available in-memory vessel data and annotate it with `"web_search_unavailable"`.
4. WHEN `risk_node` executes, THE Risk Agent SHALL produce a structured risk report containing a `risk_score` integer between 0 and 100, a `risk_level` classification, and a per-factor score breakdown with justification for each contributing factor.
5. THE Risk Agent SHALL be capable of producing `risk_score` values in the LOW (0–29) and MEDIUM (30–59) ranges with reasoning that reflects normal vessel behavior such as recent port calls, continuous AIS signal, and no ownership disputes.
6. WHEN `compliance_node` executes and the vessel's `risk_score` is below 70, THE Compliance Agent SHALL produce a compliance findings object with an empty `applicable_conventions` list and the text `"no regulatory concerns identified"`.
7. WHEN `compliance_node` executes and the vessel's `risk_score` is 70 or above, THE Compliance Agent SHALL identify applicable international conventions (including MLC 2006 and UNCLOS where relevant), flag-state obligations, and available port-state enforcement options.

---

### Requirement 7 — Escalation Agent — No-Action Branch (Hard Requirement)

**User Story:** As an intelligence operator, I want the Escalation Agent to distinguish between vessels that genuinely warrant intervention and those that do not, so that the platform functions as a credible triage tool rather than a noise generator.

#### Acceptance Criteria

1. WHEN `escalation_node` executes and the vessel's `risk_score` is below 70, THE Escalation Agent SHALL set `requires_escalation` to `false`, populate `no_action_reason` with a plain-language explanation of why escalation is not warranted, populate `recheck_interval_hours` with a positive integer representing the recommended monitoring interval, leave `escalation_targets` as an empty list, and set `urgency_level` to `"NONE"` or `"MONITOR"`.
2. WHEN `escalation_node` executes and the vessel's `risk_score` is 70 or above, THE Escalation Agent SHALL set `requires_escalation` to `true`, populate `escalation_targets` with a list of at least one target object containing `org`, `contact`, `priority`, and `message` fields, set `urgency_level` to `"URGENT"` or `"IMMEDIATE"`, and leave `no_action_reason` as `null`.
3. THE Escalation Agent SHALL NOT default to producing a full intervention package for every vessel; the default outcome for a vessel with `risk_score < 70` is `requires_escalation: false`.

---

### Requirement 8 — EscalationReport Schema

**User Story:** As a frontend developer, I want the EscalationReport to have a fixed, well-defined schema, so that the UI can reliably render both the full escalation and no-action outcomes without runtime errors.

#### Acceptance Criteria

1. THE EscalationReport SHALL include exactly the following fields with the specified types:
   - `requires_escalation: bool`
   - `no_action_reason: str | None`
   - `recheck_interval_hours: int | None`
   - `urgency_level: Literal["IMMEDIATE", "URGENT", "MONITOR", "NONE"]`
   - `escalation_targets: list[dict]`
   - `report_id: str`
   - `vessel_mmsi: str`
   - `vessel_name: str`
   - `generated_at: datetime`
   - `risk_score: float`
   - `estimated_crew_size: int`
   - `crew_nationalities: list[str]`
   - `days_abandoned: int`
   - `estimated_unpaid_wages_usd: float`
   - `key_findings: list[str]`
   - `timeline_of_events: list[str]`
   - `applicable_conventions: list[str]`
   - `flag_state_obligations: str`
   - `port_state_options: str`
   - `recommended_actions: list[str]`
2. WHEN `requires_escalation` is `false`, THE EscalationReport SHALL have `escalation_targets` equal to an empty list and `no_action_reason` set to a non-empty string.
3. WHEN `requires_escalation` is `true`, THE EscalationReport SHALL have `no_action_reason` equal to `null` and `escalation_targets` containing at least one entry.

---

### Requirement 9 — Backend API Endpoints

**User Story:** As a frontend developer, I want a stable REST API for querying vessel data, triggering investigations, and retrieving reports, so that the UI can be developed and tested independently of the agent pipeline.

#### Acceptance Criteria

1. THE API Server SHALL expose `GET /vessels` returning the list of all vessels in the in-memory store, supporting optional query parameters `risk_level` (string filter) and `limit` (integer, default 50).
2. THE API Server SHALL expose `GET /vessels/{mmsi}` returning the full vessel profile, current risk score, and all associated AgentEvents for the requested MMSI.
3. THE API Server SHALL expose `POST /vessels/{mmsi}/investigate` that initiates the five-agent pipeline for the specified vessel and returns `{ "investigation_id": "<uuid>", "status": "started" }`.
4. IF `POST /vessels/{mmsi}/investigate` is called while a pipeline run is already active for any vessel, THEN THE API Server SHALL return HTTP 409 with an error message indicating that another investigation is in progress.
5. THE API Server SHALL expose `GET /investigations/{investigation_id}` returning the current `InvestigationState` for the given investigation ID, including the status of each agent node.
6. THE API Server SHALL expose `GET /reports/{mmsi}` returning the most recent `EscalationReport` for the given vessel MMSI.
7. THE API Server SHALL expose `GET /stats` returning `{ "total_monitored": int, "high_risk_count": int, "critical_count": int, "investigations_today": int, "reports_generated": int }`.
8. IF a `GET` request targets a vessel MMSI or investigation ID that does not exist in the in-memory store, THEN THE API Server SHALL return HTTP 404.

---

### Requirement 10 — Real-Time WebSocket Feed

**User Story:** As a frontend developer, I want a WebSocket endpoint that pushes live events to the browser, so that the UI can reflect vessel position changes, agent progress, and new alerts without polling.

#### Acceptance Criteria

1. THE WebSocket Feed SHALL accept connections at `/ws/feed` and maintain the connection for the lifetime of the browser session.
2. WHEN a vessel's position, speed, or risk score changes, THE WebSocket Feed SHALL broadcast a `vessel_update` message containing the vessel's MMSI and the changed fields.
3. WHEN an agent node transitions to `"running"` or `"complete"` or `"error"` status, THE WebSocket Feed SHALL broadcast an `agent_event` message containing the `AgentEvent` payload.
4. WHEN a vessel's `risk_level` transitions to `"HIGH"` or `"CRITICAL"`, THE WebSocket Feed SHALL broadcast an `alert` message containing the vessel MMSI, risk score, and risk level.
5. WHEN the Escalation Agent completes and an `EscalationReport` is written to the in-memory store, THE WebSocket Feed SHALL broadcast a `report_ready` message containing the vessel MMSI and report ID.

---

### Requirement 11 — Dashboard Layout

**User Story:** As a judge or demo operator, I want a full-screen split-panel dashboard that is always visible without toggling between views, so that the map context and agent activity are simultaneously readable during a live demonstration.

#### Acceptance Criteria

1. THE Dashboard SHALL render a persistent split-panel layout with the `VesselPanel` on the left half and the `AgentTimeline` on the right half below the map at all viewport sizes targeted by the demo environment (desktop only).
2. THE Dashboard SHALL render a `StatsBar` across the top showing total monitored vessels, HIGH risk count, CRITICAL count, and active investigations count, updated in real time via the WebSocket Feed.
3. THE Dashboard SHALL render the Deck.gl + MapLibre map occupying the full width above the split panel, displaying all vessels as color-coded scatter plot dots.

---

### Requirement 12 — Vessel Map Layer

**User Story:** As an operator, I want each vessel on the map to be color-coded by risk level and visually distinguishable from simulated vessels, so that I can immediately identify where attention is required.

#### Acceptance Criteria

1. THE GlobalMap component SHALL render each vessel as a `ScatterplotLayer` dot colored by `risk_level`: LOW → RGBA(34, 197, 94, 180), MEDIUM → RGBA(234, 179, 8, 180), HIGH → RGBA(249, 115, 22, 180), CRITICAL → RGBA(239, 68, 68, 255).
2. WHERE a vessel has `is_simulated: true`, THE GlobalMap component SHALL render that vessel using a pulse animation via `ScenegraphLayer` to visually distinguish it from real AIS vessels.
3. WHEN a user clicks a vessel dot on the map, THE GlobalMap component SHALL update the selected vessel in the Zustand store, causing the VesselPanel to display that vessel's details.
4. THE GlobalMap component SHALL render a `PathLayer` showing the last 10 recorded positions for the selected vessel as a route history trail.
5. WHEN a user hovers over a vessel dot, THE GlobalMap component SHALL render a `TextLayer` label displaying the vessel name.

---

### Requirement 13 — VesselPanel

**User Story:** As an operator, I want a dedicated panel that displays full vessel details and lets me manually trigger an investigation, so that I can act on any vessel regardless of whether it crossed the auto-trigger threshold.

#### Acceptance Criteria

1. WHEN a vessel is selected on the map, THE VesselPanel SHALL display the vessel's name, MMSI, flag state, vessel type, owner, operator, current speed, heading, last port, destination, days stationary, AIS gap hours, risk score, risk level, and risk factors list.
2. THE VesselPanel SHALL display a risk score bar filled proportionally between 0 and 100 and colored according to the `risk_level` color system.
3. WHEN a user clicks the INVESTIGATE button in the VesselPanel, THE VesselPanel SHALL call `POST /vessels/{mmsi}/investigate` and disable the button until the investigation completes or errors.
4. IF the `POST /vessels/{mmsi}/investigate` call returns HTTP 409, THEN THE VesselPanel SHALL display an inline message indicating that another investigation is currently active.

---

### Requirement 14 — AgentTimeline

**User Story:** As an operator or judge, I want to watch the five agents fire in real time with clear visual states, so that the autonomous intelligence process is legible and impressive during a live demo.

#### Acceptance Criteria

1. THE AgentTimeline SHALL render the five pipeline nodes — Monitoring, Investigation, Risk, Compliance, Escalation — in execution order, each showing an icon, agent name, and current status.
2. WHILE an agent node is in `"running"` status, THE AgentTimeline SHALL display a pulsing blue dot and spinner for that node.
3. WHEN an agent node transitions to `"complete"` status, THE AgentTimeline SHALL display a green checkmark and the agent's `output_summary` text for that node.
4. WHEN a user clicks a completed agent node, THE AgentTimeline SHALL expand a reasoning trace panel showing the agent's full `reasoning` field.
5. WHEN the Escalation Agent completes with `requires_escalation: false`, THE AgentTimeline SHALL render the Escalation node as a calm green or blue summary card that is visually distinct from the red or orange alert styling used for `requires_escalation: true` outcomes.
6. THE AgentTimeline SHALL NOT render a `requires_escalation: false` outcome using alert-style colors (red, orange) or alert-style iconography.

---

### Requirement 15 — EscalationReport Viewer

**User Story:** As a judge, I want to read the final escalation report in a structured, readable format directly in the dashboard, so that I can evaluate the depth and accuracy of the AI-generated analysis.

#### Acceptance Criteria

1. WHEN a `report_ready` WebSocket event is received for the selected vessel, THE EscalationReport Viewer SHALL automatically display the latest EscalationReport for that vessel.
2. WHERE `requires_escalation` is `true`, THE EscalationReport Viewer SHALL display the urgency level, key findings, timeline of events, applicable conventions, flag state obligations, port state options, recommended actions, escalation targets, and draft contact messages.
3. WHERE `requires_escalation` is `false`, THE EscalationReport Viewer SHALL display the `no_action_reason` text, the `recheck_interval_hours` value, and the `urgency_level` badge in a calm, non-alert visual style.

---

### Requirement 16 — Technology Stack Constraints

**User Story:** As a developer, I want the technology choices fixed to the specified stack, so that there are no dependency conflicts and the build is reproducible in the hackathon environment.

#### Acceptance Criteria

1. THE Backend SHALL be implemented in Python 3.11 using FastAPI and uvicorn as the HTTP and WebSocket server.
2. THE Pipeline SHALL use LangGraph `StateGraph` for agent orchestration and SHALL call only `gemini-2.5-flash` via `google-genai>=1.0.0` for all agent LLM invocations.
3. THE Map Layer SHALL be implemented using Deck.gl version 9.x and MapLibre GL version 4.x with no third-party map API key required for basemap rendering.
4. THE Frontend SHALL be implemented in React 18 with TypeScript, Vite as the build tool, Tailwind CSS for styling, and Zustand for client-side state management.
5. THE Backend SHALL use in-memory data structures only; THE Backend SHALL NOT connect to PostgreSQL, Neo4j, SQLite, or any other external database.

---

### Requirement 17 — Out-of-Scope Constraints

**User Story:** As a developer, I want explicit boundaries on what will not be built, so that no time is spent on features outside the demo scope.

#### Acceptance Criteria

1. THE System SHALL NOT send real emails, SMS messages, or push notifications; all escalation contact drafts SHALL be displayed as read-only text within the dashboard.
2. THE System SHALL NOT implement user authentication, session management, or access control of any kind.
3. THE System SHALL NOT implement a mobile-responsive layout; the target viewport is desktop only.
4. THE Pipeline Coordinator SHALL NOT permit more than one simultaneous pipeline run at any given time.

---

### Requirement 18 — Integration Verification (No-Action Test)

**User Story:** As a quality reviewer, I want an integration test that verifies the no-action branch against a real, non-crisis vessel from the live AIS feed, so that the system's triage credibility is confirmed before the build is considered complete.

#### Acceptance Criteria

1. THE Integration Test Suite SHALL include at least one test that selects a real vessel from the live AIS feed with a risk score below 60 at the time of test execution, manually triggers the five-agent pipeline for that vessel, and asserts that the resulting `EscalationReport` has `requires_escalation: false`.
2. WHEN the Integration Test described in criterion 1 produces a result where `requires_escalation: true` for a vessel with an initial risk score below 60, THE Build SHALL be considered incomplete and the risk scoring weights and agent prompts SHALL be revised before resubmission.
3. THE Integration Test Suite SHALL additionally verify all three simulated crisis scenarios (SIM001, SIM002, SIM003) each produce an `EscalationReport` with `requires_escalation: true` and `urgency_level` of `"URGENT"` or `"IMMEDIATE"`.
