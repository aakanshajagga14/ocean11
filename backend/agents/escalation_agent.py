import time
import uuid
from datetime import datetime

from agents import context
from agents.base import call_gemini
from data.vessel_registry import registry
from models import AgentEvent, EscalationReport, InvestigationState

SYSTEM_PROMPT = """You are the Escalation Agent for Ocean11 humanitarian maritime response.
Generate a complete escalation package OR a no-action summary.

CRITICAL BRANCHING (MANDATORY):
- If risk_score < 70: requires_escalation=false, populate no_action_reason and recheck_interval_hours,
  escalation_targets=[], urgency_level="NONE" or "MONITOR"
- If risk_score >= 70: requires_escalation=true, populate escalation_targets with org/contact/priority/message,
  urgency_level="URGENT" or "IMMEDIATE", no_action_reason=null

The default outcome for risk_score below 70 is requires_escalation: false.
Do NOT produce a full intervention package unless risk score is 70 or above.

Return JSON matching EscalationReport fields:
{
  "requires_escalation": bool,
  "estimated_crew_size": int,
  "crew_nationalities": ["string"],
  "days_abandoned": int,
  "estimated_unpaid_wages_usd": float,
  "key_findings": ["string"],
  "timeline_of_events": ["string"],
  "applicable_conventions": ["string"],
  "flag_state_obligations": "string",
  "port_state_options": "string",
  "escalation_targets": [{"org": "string", "contact": "string", "priority": 1, "message": "string"}],
  "recommended_actions": ["string"],
  "urgency_level": "IMMEDIATE|URGENT|MONITOR|NONE",
  "no_action_reason": "string or null",
  "recheck_interval_hours": int or null,
  "summary": "one-line summary",
  "reasoning": "detailed reasoning trace"
}"""


def enforce_escalation_branch(report_data: dict, risk_score: int, vessel_mmsi: str) -> dict:
    enrichment = registry.get_enrichment(vessel_mmsi)

    if risk_score < 70:
        report_data["requires_escalation"] = False
        report_data["escalation_targets"] = []
        report_data["no_action_reason"] = report_data.get("no_action_reason") or (
            f"Vessel does not meet escalation threshold (risk score {risk_score}/100). "
            "Normal operational indicators — active AIS, no abandonment evidence, "
            "no regulatory triggers. Continue routine monitoring."
        )
        report_data["recheck_interval_hours"] = report_data.get("recheck_interval_hours") or 24
        if report_data.get("urgency_level") not in ("NONE", "MONITOR"):
            report_data["urgency_level"] = "MONITOR"
        report_data["applicable_conventions"] = []
        report_data["flag_state_obligations"] = ""
        report_data["port_state_options"] = ""
    else:
        report_data["requires_escalation"] = True
        report_data["no_action_reason"] = None
        report_data["recheck_interval_hours"] = None
        if report_data.get("urgency_level") not in ("URGENT", "IMMEDIATE"):
            report_data["urgency_level"] = "IMMEDIATE" if risk_score >= 85 else "URGENT"
        targets = report_data.get("escalation_targets") or []
        if not targets:
            targets = [
                {
                    "org": "ITF Seafarers Trust",
                    "contact": "itf@itf.org.uk",
                    "priority": 1,
                    "message": f"Urgent: Possible seafarer abandonment case for MMSI {vessel_mmsi}. "
                    "Request immediate welfare check and intervention.",
                },
                {
                    "org": "Flag State Authority",
                    "contact": "flag.state@maritime.gov",
                    "priority": 2,
                    "message": f"Notification of high-risk vessel under your flag. Risk score: {risk_score}.",
                },
            ]
        report_data["escalation_targets"] = targets
        if not report_data.get("estimated_crew_size"):
            report_data["estimated_crew_size"] = enrichment.crew_size or 15
        if not report_data.get("crew_nationalities"):
            report_data["crew_nationalities"] = enrichment.crew_nationalities or ["Unknown"]

    return report_data


async def escalation_agent(state: InvestigationState) -> dict:
    if state.get("escalation_report"):
        return {}

    vessel = state["vessel"]
    risk_assessment = state.get("risk_assessment", {})
    compliance = state.get("compliance_findings", {})
    risk_score = int(risk_assessment.get("risk_score", vessel.risk_score))
    enrichment = registry.get_enrichment(vessel.mmsi)
    start = time.time()
    event_id = str(uuid.uuid4())

    running = AgentEvent(
        event_id=event_id,
        vessel_mmsi=vessel.mmsi,
        agent_name="escalation",
        timestamp=datetime.utcnow(),
        status="running",
        input_summary=f"Generating {'intervention package' if risk_score >= 70 else 'monitoring summary'} for {vessel.name}",
        output_summary="Preparing escalation report...",
        reasoning="",
        duration_ms=0,
    )
    state["events"].append(running)
    context.append_event(vessel.mmsi, running)
    await context.broadcast({"type": "agent_event", "payload": running.model_dump(mode="json")})

    user_prompt = f"""Vessel: {vessel.name} (MMSI: {vessel.mmsi})
Risk score: {risk_score}
Compliance: {compliance}
Evidence: {state.get('evidence', [])}
Crew size estimate: {enrichment.crew_size}, Nationalities: {enrichment.crew_nationalities}
Days unpaid: {enrichment.days_unpaid or vessel.days_stationary}"""

    try:
        result = await call_gemini(SYSTEM_PROMPT, user_prompt)
        summary = result.get("summary", "Escalation report generated")
        reasoning = result.get("reasoning", str(result))
        report_data = {k: v for k, v in result.items() if k not in ("summary", "reasoning")}
    except Exception as e:
        summary = "Escalation report generated (fallback)"
        reasoning = f"Fallback report generation: {e}"
        report_data = {}

    report_data = enforce_escalation_branch(report_data, risk_score, vessel.mmsi)

    report = EscalationReport(
        report_id=str(uuid.uuid4()),
        vessel_mmsi=vessel.mmsi,
        vessel_name=vessel.name,
        generated_at=datetime.utcnow(),
        risk_score=float(risk_score),
        requires_escalation=report_data["requires_escalation"],
        estimated_crew_size=report_data.get("estimated_crew_size") or enrichment.crew_size or 0,
        crew_nationalities=report_data.get("crew_nationalities") or enrichment.crew_nationalities or [],
        days_abandoned=report_data.get("days_abandoned") or enrichment.days_unpaid or vessel.days_stationary,
        estimated_unpaid_wages_usd=report_data.get("estimated_unpaid_wages_usd")
        or float((enrichment.days_unpaid or vessel.days_stationary) * 1500),
        key_findings=report_data.get("key_findings") or state.get("evidence", [])[:5],
        timeline_of_events=report_data.get("timeline_of_events")
        or [f"Day 0: Last known port call — {vessel.last_port}"],
        applicable_conventions=report_data.get("applicable_conventions")
        or compliance.get("applicable_conventions", []),
        flag_state_obligations=report_data.get("flag_state_obligations")
        or compliance.get("flag_state_obligations", ""),
        port_state_options=report_data.get("port_state_options")
        or compliance.get("port_state_options", ""),
        escalation_targets=report_data.get("escalation_targets", []),
        recommended_actions=report_data.get("recommended_actions")
        or (["Continue monitoring"] if risk_score < 70 else ["Contact ITF immediately", "Notify flag state"]),
        urgency_level=report_data["urgency_level"],
        no_action_reason=report_data.get("no_action_reason"),
        recheck_interval_hours=report_data.get("recheck_interval_hours"),
    )

    context.reports_store[vessel.mmsi] = report
    context.stats_counters["reports_generated"] += 1
    await context.broadcast(
        {
            "type": "report_ready",
            "mmsi": vessel.mmsi,
            "report_id": report.report_id,
        }
    )

    duration = int((time.time() - start) * 1000)
    if not report.requires_escalation:
        reason = report.no_action_reason or "Monitoring recommended"
        output_summary = f"No action needed — {reason[:80]}{'...' if len(reason) > 80 else ''}"
    else:
        output_summary = f"Report generated. {len(report.escalation_targets)} escalation targets identified."
    complete = AgentEvent(
        event_id=event_id,
        vessel_mmsi=vessel.mmsi,
        agent_name="escalation",
        timestamp=datetime.utcnow(),
        status="complete",
        input_summary=running.input_summary,
        output_summary=output_summary,
        reasoning=reasoning,
        duration_ms=duration,
    )
    state["events"] = [e for e in state["events"] if e.event_id != event_id]
    state["events"].append(complete)
    context.append_event(vessel.mmsi, complete)
    await context.broadcast({"type": "agent_event", "payload": complete.model_dump(mode="json")})

    return {"escalation_report": report}
