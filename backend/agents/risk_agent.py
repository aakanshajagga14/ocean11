import time
import uuid
from datetime import datetime

from agents import context
from agents.base import call_gemini
from data.vessel_registry import registry
from models import AgentEvent, InvestigationState
from risk.scoring import compute_risk_score, risk_level_from_score

SYSTEM_PROMPT = """You are a maritime risk analyst for Ocean11.
Score vessel abandonment risk from 0-100 based on anomaly signals and evidence.

CRITICAL INSTRUCTIONS:
- Score CONSERVATIVELY. Normal operating vessels with recent port calls, continuous AIS,
  speed > 5 knots, days_stationary < 7, and no ownership disputes MUST score below 30 (LOW).
- Vessels with active AIS, moving at cruising speed, no risk factors: score 5-20 (LOW).
- Only score 70+ when there is STRONG evidence of abandonment (60+ days stationary,
  crew complaints, owner disputes, AIS dark 72h+, prior ITF incidents).
- Simulated crisis vessels with 30+ days stationary and multiple risk factors: score 70-100.

Return JSON:
{
  "risk_score": 0-100,
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "factor_breakdown": [{"factor": "string", "weight": 0, "applies": true, "justification": "string"}],
  "overall_justification": "string",
  "summary": "one-line summary",
  "reasoning": "detailed reasoning trace"
}"""


async def risk_agent(state: InvestigationState) -> dict:
    vessel = state["vessel"]
    signals = state.get("anomaly_signals", [])
    evidence = state.get("evidence", [])
    start = time.time()
    event_id = str(uuid.uuid4())

    running = AgentEvent(
        event_id=event_id,
        vessel_mmsi=vessel.mmsi,
        agent_name="risk",
        timestamp=datetime.utcnow(),
        status="running",
        input_summary=f"Scoring risk for {vessel.name} with {len(evidence)} evidence items",
        output_summary="Computing abandonment risk score...",
        reasoning="",
        duration_ms=0,
    )
    state["events"].append(running)
    context.append_event(vessel.mmsi, running)
    await context.broadcast({"type": "agent_event", "payload": running.model_dump(mode="json")})

    computed_score, factors, computed_level = compute_risk_score(vessel, registry)

    user_prompt = f"""Vessel: {vessel.name} (MMSI: {vessel.mmsi}, simulated={vessel.is_simulated})
Speed: {vessel.speed} kn, Days stationary: {vessel.days_stationary}, AIS gap: {vessel.ais_gap_hours:.1f}h
Flag: {vessel.flag_state}, Owner: {vessel.owner}
Risk factors: {vessel.risk_factors}
Anomaly signals: {signals}
Evidence: {evidence}
Rule-based computed score: {computed_score} ({computed_level})
IMPORTANT: If this is a normal moving vessel (speed>5, stationary<7, no disputes), score LOW (under 30).
If simulated crisis with 30+ days stationary and multiple factors, score 70+."""

    factor_breakdown: list = []
    overall = ""
    try:
        result = await call_gemini(SYSTEM_PROMPT, user_prompt)
        risk_score = int(result.get("risk_score", computed_score))
        risk_level = result.get("risk_level", risk_level_from_score(risk_score))
        summary = result.get("summary", f"Score: {risk_score}/100. {risk_level}.")
        reasoning = result.get("reasoning", result.get("overall_justification", str(result)))
        factor_breakdown = result.get("factor_breakdown", [])
        overall = result.get("overall_justification", summary)
    except Exception as e:
        risk_score = int(computed_score)
        risk_level = computed_level
        summary = f"Score: {risk_score}/100. {risk_level}. (rule-based fallback)"
        reasoning = f"Rule-based scoring fallback: {e}"
        factor_breakdown = [{"factor": f, "applies": True} for f in factors]
        overall = summary

    if not vessel.is_simulated and vessel.speed > 5 and vessel.days_stationary < 7 and vessel.ais_gap_hours < 24:
        risk_score = min(risk_score, 25)
        risk_level = "LOW"

    if vessel.is_simulated and vessel.risk_score >= 70:
        risk_score = max(risk_score, int(vessel.risk_score))
        risk_level = risk_level_from_score(risk_score)

    assessment = {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "factor_breakdown": factor_breakdown,
        "overall_justification": overall,
    }

    duration = int((time.time() - start) * 1000)
    complete = AgentEvent(
        event_id=event_id,
        vessel_mmsi=vessel.mmsi,
        agent_name="risk",
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

    return {"risk_assessment": assessment}
