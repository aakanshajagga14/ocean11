import logging
import uuid
from typing import Any

from langgraph.graph import END, StateGraph

from agents.compliance_agent import compliance_agent
from agents.escalation_agent import escalation_agent
from agents.investigation_agent import investigation_agent
from agents.monitoring_agent import monitoring_agent
from agents.risk_agent import risk_agent
from models import InvestigationState, Vessel

logger = logging.getLogger(__name__)


async def _monitoring_node(state: InvestigationState) -> dict:
    return await monitoring_agent(state)


async def _investigation_node(state: InvestigationState) -> dict:
    return await investigation_agent(state)


async def _risk_node(state: InvestigationState) -> dict:
    return await risk_agent(state)


async def _compliance_node(state: InvestigationState) -> dict:
    return await compliance_agent(state)


async def _escalation_node(state: InvestigationState) -> dict:
    return await escalation_agent(state)


def build_pipeline():
    workflow = StateGraph(InvestigationState)

    workflow.add_node("monitoring_node", _monitoring_node)
    workflow.add_node("investigation_node", _investigation_node)
    workflow.add_node("risk_node", _risk_node)
    workflow.add_node("compliance_node", _compliance_node)
    workflow.add_node("escalation_node", _escalation_node)

    workflow.set_entry_point("monitoring_node")
    workflow.add_edge("monitoring_node", "investigation_node")
    workflow.add_edge("investigation_node", "risk_node")
    workflow.add_edge("risk_node", "compliance_node")
    workflow.add_edge("compliance_node", "escalation_node")
    workflow.add_edge("escalation_node", END)

    return workflow.compile()


pipeline = build_pipeline()


def create_initial_state(vessel: Vessel, investigation_id: str) -> InvestigationState:
    return InvestigationState(
        investigation_id=investigation_id,
        vessel=vessel,
        events=[],
        evidence=[],
        anomaly_signals=[],
        risk_assessment={},
        compliance_findings={},
        escalation_report=None,
        status="running",
    )


async def run_pipeline(
    vessel: Vessel,
    investigation_id: str,
    on_error=None,
    on_complete=None,
) -> InvestigationState:
    state = create_initial_state(vessel, investigation_id)
    try:
        result = await pipeline.ainvoke(state)
        result["status"] = "complete"
        if on_complete:
            await on_complete(vessel.mmsi, result)
        return result
    except Exception as e:
        logger.exception("Pipeline error for %s: %s", vessel.mmsi, e)
        state["status"] = "error"
        if on_error:
            await on_error(vessel.mmsi, e, state)
        return state


async def start_investigation(
    vessel: Vessel,
    investigations: dict,
    coordinator,
) -> str:
    investigation_id = str(uuid.uuid4())
    state = create_initial_state(vessel, investigation_id)
    investigations[investigation_id] = state
    await coordinator.set_investigation_id(investigation_id)
    return investigation_id
