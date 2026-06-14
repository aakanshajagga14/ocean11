import asyncio
import time
import uuid
from datetime import datetime

from agents import context
from agents.base import AGENT_MAX_TOKENS, call_gemini
from data.vessel_memory import compute_risk_trend
from data.vessel_registry import registry
from models import AgentEvent, InvestigationState
from risk.scoring import compute_risk_confidence, compute_risk_range, compute_risk_score, risk_level_from_score

SYSTEM_PROMPT = """You are a maritime risk analyst for Ocean11.
Score vessel abandonment risk from 0-100 based on anomaly signals and evidence.

CRITICAL INSTRUCTIONS:
- Score CONSERVATIVELY. Normal operating vessels with recent port calls, continuous AIS,
  speed > 5 knots, days_stationary < 7, and no ownership disputes MUST score below 30 (LOW).
- Vessels with active AIS, moving at cruising speed, no risk factors: score 5-20 (LOW).
- Only score 70+ when there is STRONG evidence of abandonment (60+ days stationary,
  crew complaints, owner disputes, AIS dark 72h+, prior ITF incidents).
- Simulated crisis vessels with 30+ days stationary and multiple risk factors: score 70-100.
- Output risk_score_range as {low, high} — wider when data confidence is low.
- If confidence < 0.5, explicitly note missing data in reasoning (e.g. no AIS in 48h).

Return JSON:
{
  "risk_score": 0-100,
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "risk_score_range": {"low": 0, "high": 100},
  "factor_breakdown": [{"factor": "string", "weight": 0, "applies": true, "justification": "string"}],
  "overall_justification": "string",
  "summary": "one-line summary",
  "reasoning": "detailed reasoning trace"
}"""


def _confidence_notes(vessel, confidence: float) -> str:
    notes = []
    if vessel.ais_gap_hours >= 48:
        notes.append(f"No AIS data in last {vessel.ais_gap_hours:.0f}h — risk score has wide uncertainty")
    if vessel.position_count < 3:
        notes.append("Limited position history — confidence reduced")
    if vessel.owner in ("Unknown", ""):
        notes.append("Owner/registry data unavailable")
    if confidence < 0.5 and not notes:
        notes.append("Incomplete telemetry — wide uncertainty band applied")
    return " ".join(notes)


async def risk_agent(state: InvestigationState) -> dict:
    vessel = state["vessel"]
    signals = state.get("anomaly_signals", [])
    evidence = state.get("evidence", [])
    risk_trend = state.get("risk_trend") or compute_risk_trend(vessel.mmsi, vessel.risk_score)
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
    await context.append_state_event(state, running)
    context.append_event(vessel.mmsi, running)
    await context.broadcast({"type": "agent_event", "payload": running.model_dump(mode="json")})

    computed_score, factors, computed_level = compute_risk_score(vessel, registry)
    confidence = vessel.risk_score_confidence or compute_risk_confidence(vessel, registry)
    range_low, range_high = compute_risk_range(computed_score, confidence)
    prev_summary = state.get("previous_investigation_summary")

    user_prompt = f"""Vessel: {vessel.name} (MMSI: {vessel.mmsi}, simulated={vessel.is_simulated})
Speed: {vessel.speed} kn, Days stationary: {vessel.days_stationary}, AIS gap: {vessel.ais_gap_hours:.1f}h
Flag: {vessel.flag_state}, Owner: {vessel.owner}
Risk factors: {vessel.risk_factors}
Anomaly signals: {signals}
Evidence: {evidence}
Rule-based computed score: {computed_score} ({computed_level})
Confidence: {confidence} → suggested range {range_low}-{range_high}
Risk trend vs prior investigation: {risk_trend}
Previous investigation: {prev_summary or 'None'}
IMPORTANT: If this is a normal moving vessel (speed>5, stationary<7, no disputes), score LOW (under 30).
If simulated crisis with 30+ days stationary and multiple factors, score 70+."""

    factor_breakdown: list = []
    overall = ""
    event_status = "complete"
    try:
        result = await call_gemini(
            SYSTEM_PROMPT,
            user_prompt,
            max_tokens=AGENT_MAX_TOKENS["risk"],
            agent_name="risk",
        )
        risk_score = int(result.get("risk_score", computed_score))
        risk_level = result.get("risk_level", risk_level_from_score(risk_score))
        summary = result.get("summary", f"Score: {risk_score}/100. {risk_level}.")
        reasoning = result.get("reasoning", result.get("overall_justification", str(result)))
        factor_breakdown = result.get("factor_breakdown", [])
        overall = result.get("overall_justification", summary)
        score_range = result.get("risk_score_range", {})
        if score_range:
            range_low = float(score_range.get("low", range_low))
            range_high = float(score_range.get("high", range_high))
    except asyncio.TimeoutError:
        risk_score = int(computed_score)
        risk_level = computed_level
        summary = "Agent timed out — proceeding with available data"
        reasoning = "Risk agent timed out after 15s; used rule-based scoring."
        factor_breakdown = [{"factor": f, "applies": True} for f in factors]
        overall = summary
        event_status = "timeout"
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
        range_low, range_high = compute_risk_range(risk_score, confidence)

    if vessel.is_simulated and vessel.risk_score >= 70:
        risk_score = max(risk_score, int(vessel.risk_score))
        risk_level = risk_level_from_score(risk_score)
        range_low, range_high = compute_risk_range(risk_score, confidence)

    conf_notes = _confidence_notes(vessel, confidence)
    if conf_notes:
        reasoning = f"{reasoning}\n\nData quality: {conf_notes}"

    assessment = {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_score_range": {"low": range_low, "high": range_high},
        "risk_score_confidence": confidence,
        "risk_trend": risk_trend,
        "factor_breakdown": factor_breakdown,
        "overall_justification": overall,
    }

    duration = int((time.time() - start) * 1000)
    complete = AgentEvent(
        event_id=event_id,
        vessel_mmsi=vessel.mmsi,
        agent_name="risk",
        timestamp=datetime.utcnow(),
        status=event_status,
        input_summary=running.input_summary,
        output_summary=f"{summary} Trend: {risk_trend}. Range: {range_low:.0f}–{range_high:.0f} (conf {confidence:.0%})",
        reasoning=reasoning,
        duration_ms=duration,
    )
    await context.finalize_state_event(state, event_id, complete)
    context.append_event(vessel.mmsi, complete)
    await context.broadcast({"type": "agent_event", "payload": complete.model_dump(mode="json")})

    return {"risk_assessment": assessment, "risk_trend": risk_trend}
