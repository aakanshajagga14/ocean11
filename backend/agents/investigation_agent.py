import asyncio
import time
import uuid
from datetime import datetime

from agents import context
from agents.base import INVESTIGATION_TOOLS, AGENT_MAX_TOKENS, call_gemini
from data.vessel_registry import registry
from models import AgentEvent, InvestigationState

SYSTEM_PROMPT = """You are a maritime investigator for Ocean11.
Given anomaly signals and vessel profile, gather corroborating evidence about the vessel and owner.
Cross-reference owner history, flag state record, prior ITF incidents, and maritime news.

Return JSON:
{
  "findings": ["string"],
  "source_citations": ["string"],
  "web_search_status": "ok" | "web_search_unavailable",
  "summary": "one-line summary",
  "reasoning": "detailed reasoning trace"
}
If no external news is available, use in-memory vessel data and set web_search_status accordingly."""


def _fallback_evidence(vessel, enrichment, web_error: str) -> tuple[list[str], list[str], str, str]:
    findings: list[str] = []
    if enrichment.owner_notes:
        findings.append(enrichment.owner_notes)
    if enrichment.prior_itf_incident:
        findings.append(f"Prior ITF incident on record for {vessel.owner}")
    if enrichment.owner_dispute_history:
        findings.append(f"Owner dispute history: {vessel.owner}")
    if enrichment.crew_complaint_filed:
        findings.append("Active crew complaint filed with ITF")
    if enrichment.insurance_lapsed:
        findings.append("Vessel insurance reported lapsed")
    if vessel.days_stationary >= 30:
        findings.append(f"No port call in {vessel.days_stationary}+ days")
    if vessel.ais_gap_hours >= 24:
        findings.append(f"AIS dark period: {vessel.ais_gap_hours:.1f} hours")
    if not findings:
        findings.append(
            f"Vessel {vessel.name} operating normally — speed {vessel.speed} kn, "
            f"recent AIS signal, no enrichment flags"
        )
    citations = ["In-memory vessel registry", "AIS telemetry"]
    summary = f"Evidence from {len(findings)} sources (web_search_unavailable)"
    reasoning = f"Web search unavailable ({web_error}). Used in-memory enrichment data."
    return findings, citations, summary, reasoning


async def investigation_agent(state: InvestigationState) -> dict:
    vessel = state["vessel"]
    signals = state.get("anomaly_signals", [])
    start = time.time()
    event_id = str(uuid.uuid4())

    running = AgentEvent(
        event_id=event_id,
        vessel_mmsi=vessel.mmsi,
        agent_name="investigation",
        timestamp=datetime.utcnow(),
        status="running",
        input_summary=f"Investigating {len(signals)} anomaly signals for {vessel.name}",
        output_summary="Searching maritime news and owner records...",
        reasoning="",
        duration_ms=0,
    )
    await context.append_state_event(state, running)
    context.append_event(vessel.mmsi, running)
    await context.broadcast({"type": "agent_event", "payload": running.model_dump(mode="json")})

    enrichment = registry.get_enrichment(vessel.mmsi)
    user_prompt = f"""Vessel: {vessel.name} (MMSI: {vessel.mmsi})
Owner: {vessel.owner}, Flag: {vessel.flag_state}
Anomaly signals: {signals}
Enrichment: owner_dispute={enrichment.owner_dispute_history}, itf_incident={enrichment.prior_itf_incident},
crew_complaint={enrichment.crew_complaint_filed}, insurance_lapsed={enrichment.insurance_lapsed}
Owner notes: {enrichment.owner_notes}
Last port: {vessel.last_port}, Destination: {vessel.destination}"""

    findings: list[str] = []
    citations: list[str] = []
    web_status = "ok"
    summary = "Evidence package compiled"
    reasoning = ""
    event_status = "complete"

    try:
        result = await call_gemini(
            SYSTEM_PROMPT,
            user_prompt,
            tools=INVESTIGATION_TOOLS,
            max_tokens=AGENT_MAX_TOKENS["investigation"],
            agent_name="investigation",
        )
        findings = result.get("findings", [])
        citations = result.get("source_citations", [])
        web_status = result.get("web_search_status", "ok")
        summary = result.get("summary", summary)
        reasoning = result.get("reasoning", str(result))
        if not findings:
            raise ValueError("Empty findings from web search")
    except asyncio.TimeoutError:
        web_status = "web_search_unavailable"
        findings, citations, summary, reasoning = _fallback_evidence(
            vessel, enrichment, "agent timed out after 15s"
        )
        summary = "Agent timed out — proceeding with available data"
        event_status = "timeout"
    except Exception as e:
        web_status = "web_search_unavailable"
        findings, citations, summary, reasoning = _fallback_evidence(vessel, enrichment, str(e))

    duration = int((time.time() - start) * 1000)
    complete = AgentEvent(
        event_id=event_id,
        vessel_mmsi=vessel.mmsi,
        agent_name="investigation",
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

    evidence = findings + [f"[{c}]" for c in citations]
    return {"evidence": evidence, "findings": findings, "web_search_status": web_status}
