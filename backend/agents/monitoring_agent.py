import asyncio
import time
import uuid
from datetime import datetime

from agents import context
from agents.base import AGENT_MAX_TOKENS, call_gemini
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
    await context.append_state_event(state, running)
    context.append_event(vessel.mmsi, running)
    await context.broadcast({"type": "agent_event", "payload": running.model_dump(mode="json")})

    rule_patterns = detect_anomaly_patterns(vessel)
    prev_summary = state.get("previous_investigation_summary")
    prev_block = ""
    if prev_summary:
        prev_block = (
            f"\nThis vessel was previously investigated. At that time: {prev_summary}. "
            "Has the situation changed?"
        )

    user_prompt = f"""Vessel: {vessel.name} (MMSI: {vessel.mmsi})
Flag: {vessel.flag_state}, Type: {vessel.vessel_type}
Position: {vessel.latitude}, {vessel.longitude}
Speed: {vessel.speed} kn, Heading: {vessel.heading}
Days stationary: {vessel.days_stationary}, AIS gap: {vessel.ais_gap_hours:.1f}h
Risk score: {vessel.risk_score}, Risk factors: {vessel.risk_factors}
Rule-detected patterns: {rule_patterns}{prev_block}"""

    event_status = "complete"
    try:
        result = await call_gemini(
            SYSTEM_PROMPT,
            user_prompt,
            max_tokens=AGENT_MAX_TOKENS["monitoring"],
            agent_name="monitoring",
        )
        signals = result.get("anomaly_signals", rule_patterns)
        if not signals:
            signals = rule_patterns
        summary = result.get("summary", f"{len(signals)} anomalies detected")
        reasoning = result.get("reasoning", str(result))
    except asyncio.TimeoutError:
        signals = rule_patterns
        summary = "Agent timed out — proceeding with available data"
        reasoning = "Monitoring agent timed out after 15s; used rule-based detection."
        event_status = "timeout"
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
        status=event_status,
        input_summary=running.input_summary,
        output_summary=summary,
        reasoning=reasoning,
        duration_ms=duration,
    )
    await context.finalize_state_event(state, event_id, complete)
    context.append_event(vessel.mmsi, complete)
    await context.broadcast({"type": "agent_event", "payload": complete.model_dump(mode="json")})

    return {"anomaly_signals": signals}
