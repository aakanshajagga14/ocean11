"""Integration verification for Ocean11 pipeline."""

import asyncio
import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from agents import context
from agents.pipeline import run_pipeline
from data.simulator import get_simulated_vessels
from models import Vessel


@pytest.fixture
def mock_broadcast():
    async def _noop(msg):
        pass

    context.set_broadcast(_noop)
    context.reports_store = {}
    context.stats_counters = {"investigations_today": 0, "reports_generated": 0}
    context.vessel_events = {}


@pytest.mark.asyncio
@pytest.mark.parametrize("mmsi", ["SIM001", "SIM002", "SIM003"])
async def test_simulated_scenarios_escalate(mmsi, mock_broadcast):
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not set")

    vessel = next(v for v in get_simulated_vessels() if v.mmsi == mmsi)
    result = await run_pipeline(vessel, f"test-{mmsi}")

    assert result["status"] == "complete"
    report = result.get("escalation_report")
    assert report is not None
    assert report.requires_escalation is True
    assert report.urgency_level in ("URGENT", "IMMEDIATE")
    assert len(report.escalation_targets) >= 1

    agent_names = [e.agent_name for e in result["events"] if e.status == "complete"]
    for name in ["monitoring", "investigation", "risk", "compliance", "escalation"]:
        assert name in agent_names


@pytest.mark.asyncio
async def test_normal_vessel_no_action(mock_broadcast):
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not set")

    normal_vessel = Vessel(
        mmsi="TEST_NORMAL",
        name="MV Pacific Trader",
        flag_state="Singapore",
        vessel_type="Bulk Carrier",
        owner="Pacific Shipping Pte Ltd",
        operator="Pacific Shipping Pte Ltd",
        latitude=1.29,
        longitude=103.85,
        speed=12.5,
        heading=90.0,
        last_port="Singapore",
        destination="Shanghai",
        days_stationary=0,
        last_ais_signal=__import__("datetime").datetime.utcnow(),
        ais_gap_hours=0.5,
        risk_score=5,
        risk_level="LOW",
        risk_factors=[],
        is_simulated=False,
        abandonment_confirmed=False,
    )

    result = await run_pipeline(normal_vessel, "test-normal")
    report = result.get("escalation_report")
    assert report is not None
    assert report.requires_escalation is False
    assert report.urgency_level in ("NONE", "MONITOR")
    assert report.no_action_reason
    assert report.escalation_targets == []
    assert report.recheck_interval_hours and report.recheck_interval_hours > 0


if __name__ == "__main__":
    asyncio.run(test_simulated_scenarios_escalate("SIM001", None))
