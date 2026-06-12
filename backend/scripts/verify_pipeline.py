"""Run integration verification: 3 simulated scenarios + normal vessel no-action."""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

from agents import context
from agents.pipeline import run_pipeline
from data.ais_client import AISClient
from data.simulator import get_simulated_vessels
from models import Vessel


async def noop_broadcast(msg):
    pass


async def verify_simulated():
    print("\n=== Simulated Crisis Scenarios ===")
    results = []
    for vessel in get_simulated_vessels():
        print(f"\nInvestigating {vessel.name} ({vessel.mmsi})...")
        result = await run_pipeline(vessel, f"verify-{vessel.mmsi}")
        report = result.get("escalation_report")
        if not report:
            print(f"  FAIL: No report generated")
            results.append(False)
            continue
        ok = (
            report.requires_escalation
            and report.urgency_level in ("URGENT", "IMMEDIATE")
            and len(report.escalation_targets) >= 1
        )
        agents = [e.agent_name for e in result["events"] if e.status == "complete"]
        print(f"  requires_escalation: {report.requires_escalation}")
        print(f"  urgency_level: {report.urgency_level}")
        print(f"  targets: {len(report.escalation_targets)}")
        print(f"  agents complete: {agents}")
        print(f"  {'PASS' if ok else 'FAIL'}")
        results.append(ok)
    return all(results)


async def verify_normal_vessel():
    print("\n=== Normal Vessel No-Action Branch ===")

    vessel_store: dict[str, Vessel] = {}
    client = AISClient(vessel_store)
    if os.getenv("AISSTREAM_API_KEY"):
        print("Waiting 15s for live AIS data...")
        await client.start()
        await asyncio.sleep(15)
        await client.stop()

    candidate = None
    for v in vessel_store.values():
        if not v.is_simulated and v.speed > 3 and v.days_stationary < 7 and v.risk_score < 60:
            candidate = v
            break

    if not candidate:
        print("No live AIS candidate — using synthetic normal vessel")
        candidate = Vessel(
            mmsi="VERIFY_NORMAL",
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
            last_ais_signal=datetime.utcnow(),
            ais_gap_hours=0.5,
            risk_score=5,
            risk_level="LOW",
            risk_factors=[],
            is_simulated=False,
            abandonment_confirmed=False,
        )

    print(f"Investigating {candidate.name} (MMSI: {candidate.mmsi}, risk: {candidate.risk_score})...")
    result = await run_pipeline(candidate, "verify-normal")
    report = result.get("escalation_report")
    if not report:
        print("  FAIL: No report")
        return False

    ok = (
        not report.requires_escalation
        and report.urgency_level in ("NONE", "MONITOR")
        and report.no_action_reason
        and report.escalation_targets == []
    )
    print(f"  requires_escalation: {report.requires_escalation}")
    print(f"  urgency_level: {report.urgency_level}")
    print(f"  no_action_reason: {report.no_action_reason[:100]}...")
    print(f"  recheck_interval_hours: {report.recheck_interval_hours}")
    print(f"  {'PASS' if ok else 'FAIL'}")
    return ok


async def main():
    if not os.getenv("GEMINI_API_KEY"):
        print("WARNING: GEMINI_API_KEY not set — using rule-based agent fallbacks")

    context.set_broadcast(noop_broadcast)
    context.reports_store = {}
    context.stats_counters = {"investigations_today": 0, "reports_generated": 0}
    context.vessel_events = {}

    sim_ok = await verify_simulated()
    normal_ok = await verify_normal_vessel()

    print("\n=== SUMMARY ===")
    print(f"Simulated scenarios: {'PASS' if sim_ok else 'FAIL'}")
    print(f"No-action branch:      {'PASS' if normal_ok else 'FAIL'}")
    sys.exit(0 if sim_ok and normal_ok else 1)


if __name__ == "__main__":
    asyncio.run(main())
