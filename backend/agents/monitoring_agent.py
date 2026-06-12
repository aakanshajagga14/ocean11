import time
import uuid
from datetime import datetime

from agents import context
from agents.base import call_gemini
from models import AgentEvent, InvestigationState
from risk.patterns import detect_anomaly_patterns

SYSTEM_PROMPT = """You are the Monitoring Agent for Ocean11 maritime intelligence.
Given vessel telemetry, AIS history, stationary days, AIS gaps, flag state, and risk factors,
identify which behavioral anomaly patterns are present and their severity.

Return JSON:
{
  "anomaly_signals": [
    {"signal_type": "string", "severity": "LOW|MEDIUM|HIGH|CRITICAL", "description": "string"}
  ],
  "summary": "one-line summary",
  "reasoning": "detailed reasoning trace"
}
Only include confirmed anomaly signals with justification."""


async def monitoring_agent(state: InvestigationState) -> dict:
    vessel = state["vessel"]
    start = time.time()
    event_id = str(uuid.uuid4())

    running = AgentEvent(
        event_id=event_id,
        vessel_mmsi=vessel.mmsi,
        agent_name="monitoring",
        timestamp=datetime.utcnow(),
        status="running",
        input_summary=f"Analyzing {vessel.name} — {vessel.days_stationary}d stationary, AIS gap {vessel.ais_gap_hours:.1f}h",
        output_summary="Detecting anomaly patterns...",
        reasoning="",
        duration_ms=0,
    )
    state["events"].append(running)
    context.append_event(vessel.mmsi, running)
    await context.broadcast({"type": "agent_event", "payload": running.model_dump(mode="json")})

    rule_patterns = detect_anomaly_patterns(vessel)
    user_prompt = f"""Vessel: {vessel.name} (MMSI: {vessel.mmsi})
Flag: {vessel.flag_state}, Type: {vessel.vessel_type}
Position: {vessel.latitude}, {vessel.longitude}
Speed: {vessel.speed} kn, Heading: {vessel.heading}
Days stationary: {vessel.days_stationary}, AIS gap: {vessel.ais_gap_hours:.1f}h
Risk score: {vessel.risk_score}, Risk factors: {vessel.risk_factors}
Rule-detected patterns: {rule_patterns}"""

    try:
        result = await call_gemini(SYSTEM_PROMPT, user_prompt)
        signals = result.get("anomaly_signals", rule_patterns)
        if not signals:
            signals = rule_patterns
        summary = result.get("summary", f"{len(signals)} anomalies detected")
        reasoning = result.get("reasoning", str(result))
    except Exception as e:
        signals = rule_patterns
        summary = f"{len(signals)} anomalies detected (fallback)"
        reasoning = f"Gemini unavailable, used rule-based detection: {e}"

    duration = int((time.time() - start) * 1000)
    complete = AgentEvent(
        event_id=event_id,
        vessel_mmsi=vessel.mmsi,
        agent_name="monitoring",
        timestamp=datetime.utcnow(),
        status="complete",
        input_summary=running.input_summary,
        output_summary=summary,
        reasoning=reasoning,
        duration_ms=duration,
    )
    state["events"] = [e for e in state["events"] if e.event_id != event_id]
    state["events"].append(complete)
    context.append_event(vessel.mmsi, complete)
    await context.broadcast({"type": "agent_event", "payload": complete.model_dump(mode="json")})

    return {"anomaly_signals": signals}
