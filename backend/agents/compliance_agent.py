import time
import uuid
from datetime import datetime

from agents import context
from agents.base import call_gemini
from models import AgentEvent, InvestigationState

SYSTEM_PROMPT = """You are a maritime legal/regulatory analyst for Ocean11.
Under MLC 2006, UNCLOS, and relevant flag state law, identify legal obligations.

CRITICAL BRANCHING:
- If risk_score < 70: return applicable_conventions=[], regulatory_notes="no regulatory concerns identified",
  flag_state_obligations="", port_state_options=""
- If risk_score >= 70: identify MLC 2006, UNCLOS articles, flag-state obligations, port-state options

Return JSON:
{
  "applicable_conventions": ["string"],
  "flag_state_obligations": "string",
  "port_state_options": "string",
  "regulatory_notes": "string",
  "summary": "one-line summary",
  "reasoning": "detailed reasoning trace"
}"""


async def compliance_agent(state: InvestigationState) -> dict:
    vessel = state["vessel"]
    risk_assessment = state.get("risk_assessment") or {}
    risk_score = risk_assessment.get("risk_score", int(vessel.risk_score))
    start = time.time()
    event_id = str(uuid.uuid4())

    running = AgentEvent(
        event_id=event_id,
        vessel_mmsi=vessel.mmsi,
        agent_name="compliance",
        timestamp=datetime.utcnow(),
        status="running",
        input_summary=f"Checking regulatory compliance for {vessel.name} (risk={risk_score})",
        output_summary="Analyzing MLC 2006 and UNCLOS obligations...",
        reasoning="",
        duration_ms=0,
    )
    state["events"].append(running)
    context.append_event(vessel.mmsi, running)
    await context.broadcast({"type": "agent_event", "payload": running.model_dump(mode="json")})

    if risk_score < 70:
        findings = {
            "applicable_conventions": [],
            "flag_state_obligations": "",
            "port_state_options": "",
            "regulatory_notes": "no regulatory concerns identified",
        }
        summary = "No regulatory concerns identified"
        reasoning = (
            f"Risk score {risk_score} below escalation threshold (70). "
            "No international conventions triggered."
        )
    else:
        user_prompt = f"""Vessel: {vessel.name}, Flag: {vessel.flag_state}
Risk score: {risk_score}, Risk level: {risk_assessment.get('risk_level')}
Evidence: {state.get('evidence', [])}
Anomaly signals: {state.get('anomaly_signals', [])}"""

        try:
            result = await call_gemini(SYSTEM_PROMPT, user_prompt)
            findings = {
                "applicable_conventions": result.get("applicable_conventions", ["MLC 2006", "UNCLOS Article 98"]),
                "flag_state_obligations": result.get("flag_state_obligations", ""),
                "port_state_options": result.get("port_state_options", ""),
                "regulatory_notes": result.get("regulatory_notes", ""),
            }
            summary = result.get("summary", "Regulatory analysis complete")
            reasoning = result.get("reasoning", str(result))
        except Exception as e:
            findings = {
                "applicable_conventions": ["MLC 2006", "UNCLOS Article 98"],
                "flag_state_obligations": f"{vessel.flag_state} obligated to ensure crew welfare under MLC 2006",
                "port_state_options": "Nearest port state may exercise port state control",
                "regulatory_notes": "High-risk vessel — conventions apply",
            }
            summary = "MLC 2006 and UNCLOS obligations identified (fallback)"
            reasoning = f"Fallback regulatory analysis: {e}"

    duration = int((time.time() - start) * 1000)
    complete = AgentEvent(
        event_id=event_id,
        vessel_mmsi=vessel.mmsi,
        agent_name="compliance",
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

    return {"compliance_findings": findings}
