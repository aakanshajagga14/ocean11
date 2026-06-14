import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from agents import context
from agents.pipeline import run_pipeline
from config import PORT
from data.ais_client import AISClient
from data.flag_state_data import load_flag_state_risks
from data.simulator import inject_simulated_vessels
from data.vessel_memory import (
    compute_risk_trend,
    get_history,
    get_previous_summary,
    record_investigation,
)
from models import (
    AgentEvent,
    EscalationReport,
    FleetSignal,
    FlagStateRisk,
    InvestigationMemoryEntry,
    InvestigationStartResponse,
    StatsResponse,
    Vessel,
    VesselDetailResponse,
)
from risk.fleet_patterns import compute_fleet_signals, fleet_alerts
from risk.scoring import coordinator, count_pattern_flagged, update_vessel_risk
from data.pipeline_cache import get_cached_report, store_cached_report
from data.vessel_broadcast import (
    BROADCAST_INTERVAL_SEC,
    build_vessel_diff,
    snapshot_vessels,
    vessel_change_key,
)
from data.vessel_registry import registry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

vessels: dict[str, Vessel] = {}
investigations: dict[str, dict] = {}
reports: dict[str, EscalationReport] = {}
ws_connections: list[WebSocket] = []
position_history: dict[str, list[tuple[float, float]]] = {}
stats_counters = {"investigations_today": 0, "reports_generated": 0}
agent_events_by_vessel: dict[str, list[AgentEvent]] = {}
_fleet_alert_sent: set[str] = set()
last_broadcast_state: dict[str, tuple] = {}
pending_pings: set[str] = set()
_stats_dirty = False
_fleet_check_pending = False

ais_client: AISClient | None = None


def compute_stats() -> StatsResponse:
    all_vessels = list(vessels.values())
    real_live = sum(1 for v in all_vessels if not v.is_simulated)
    return StatsResponse(
        total_monitored=len(all_vessels),
        high_risk_count=sum(1 for v in all_vessels if v.risk_level == "HIGH"),
        critical_count=sum(1 for v in all_vessels if v.risk_level == "CRITICAL"),
        investigations_today=stats_counters["investigations_today"],
        reports_generated=stats_counters["reports_generated"],
        real_vessels_live=real_live,
        pattern_flagged_count=count_pattern_flagged(vessels),
    )


async def broadcast(msg: dict) -> None:
    dead: list[WebSocket] = []
    payload = json.dumps(msg, default=str)
    for ws in ws_connections:
        try:
            await ws.send_text(payload)
        except Exception as e:
            logger.warning("WebSocket send failed: %s", e)
            dead.append(ws)
    for ws in dead:
        if ws in ws_connections:
            ws_connections.remove(ws)


async def broadcast_stats() -> None:
    stats = compute_stats()
    await broadcast({"type": "stats_update", "payload": stats.model_dump(mode="json")})


async def on_vessel_ping(mmsi: str) -> None:
    pending_pings.add(mmsi)


async def on_vessel_update(mmsi: str, vessel: Vessel) -> None:
    global _stats_dirty, _fleet_check_pending
    vessels[mmsi] = vessel
    pos_count = len(position_history.get(mmsi, []))
    update_vessel_risk(vessel, registry, position_count=pos_count)
    _stats_dirty = True
    _fleet_check_pending = True

    if (
        vessel.risk_score >= 60
        and not vessel.is_simulated
        and await coordinator.maybe_trigger(vessel)
    ):
        asyncio.create_task(trigger_investigation(mmsi, auto=True))


async def check_fleet_alerts() -> None:
    signals = fleet_alerts(compute_fleet_signals(vessels))
    for signal in signals:
        key = f"{signal.owner}:{int(signal.fleet_pattern_score)}"
        if key in _fleet_alert_sent:
            continue
        _fleet_alert_sent.add(key)
        await broadcast(
            {
                "type": "fleet_alert",
                "owner": signal.owner,
                "fleet_pattern_score": signal.fleet_pattern_score,
                "affected_vessels": signal.affected_vessels,
                "summary": signal.summary,
            }
        )


async def on_alert(mmsi: str, risk_score: float, risk_level: str) -> None:
    await broadcast(
        {"type": "alert", "mmsi": mmsi, "risk_score": risk_score, "risk_level": risk_level}
    )


async def vessel_broadcast_loop() -> None:
    global _stats_dirty, _fleet_check_pending
    while True:
        await asyncio.sleep(BROADCAST_INTERVAL_SEC)
        diff = build_vessel_diff(vessels, last_broadcast_state)
        if diff:
            await broadcast({"type": "vessels_batch", "data": diff})
        for mmsi in list(pending_pings):
            await broadcast(
                {"type": "vessel_ping", "mmsi": mmsi, "timestamp": datetime.utcnow().isoformat()}
            )
        pending_pings.clear()
        if _stats_dirty:
            await broadcast_stats()
            _stats_dirty = False
        if _fleet_check_pending:
            await check_fleet_alerts()
            _fleet_check_pending = False


async def _execute_investigation(investigation_id: str, mmsi: str) -> None:
    vessel = vessels.get(mmsi)
    if not vessel:
        await coordinator.on_run_complete(mmsi)
        return

    prev_summary = get_previous_summary(mmsi)
    risk_trend = compute_risk_trend(mmsi, vessel.risk_score)

    async def on_complete(mmsi: str, result: dict) -> None:
        investigations[investigation_id] = result
        report = result.get("escalation_report")
        if report:
            reports[mmsi] = report
            store_cached_report(mmsi, vessel, report)
            record_investigation(
                mmsi,
                report,
                result.get("risk_assessment", {}).get("risk_score", vessel.risk_score),
            )
        await coordinator.on_run_complete(mmsi)
        await broadcast_stats()

    async def on_error(mmsi: str, error: Exception, state: dict) -> None:
        investigations[investigation_id] = state
        await coordinator.on_run_complete(mmsi)

    state = investigations[investigation_id]
    if prev_summary:
        state["previous_investigation_summary"] = prev_summary
    state["risk_trend"] = risk_trend

    result = await run_pipeline(
        vessel,
        investigation_id,
        on_error=on_error,
        on_complete=on_complete,
        initial_state=state,
    )
    investigations[investigation_id] = result
    if result.get("escalation_report"):
        reports[mmsi] = result["escalation_report"]


async def trigger_investigation(
    mmsi: str,
    auto: bool = False,
    background_tasks: BackgroundTasks | None = None,
) -> str | None:
    vessel = vessels.get(mmsi)
    if not vessel:
        return None

    if not auto:
        acquired = await coordinator.acquire_manual(mmsi)
        if not acquired:
            raise HTTPException(
                status_code=409,
                detail="investigation already in progress for this vessel",
            )

    from agents.pipeline import start_investigation

    investigation_id = await start_investigation(vessel, investigations, coordinator)
    stats_counters["investigations_today"] += 1
    agent_events_by_vessel.setdefault(mmsi, [])

    cached = get_cached_report(mmsi, vessel)
    if cached:
        reports[mmsi] = cached
        state = investigations[investigation_id]
        state["status"] = "complete"
        state["escalation_report"] = cached
        investigations[investigation_id] = state
        await broadcast(
            {
                "type": "report_ready",
                "mmsi": mmsi,
                "report_id": cached.report_id,
            }
        )
        await coordinator.on_run_complete(mmsi)
        return investigation_id

    if background_tasks is not None:
        background_tasks.add_task(_execute_investigation, investigation_id, mmsi)
    else:
        asyncio.create_task(_execute_investigation(investigation_id, mmsi))
    return investigation_id


async def auto_trigger_loop() -> None:
    while True:
        for mmsi, vessel in list(vessels.items()):
            if vessel.is_simulated:
                continue
            pos_count = len(position_history.get(mmsi, []))
            update_vessel_risk(vessel, registry, position_count=pos_count)
            if await coordinator.maybe_trigger(vessel):
                try:
                    await trigger_investigation(mmsi, auto=True)
                except Exception as e:
                    logger.error("Auto-trigger failed: %s", e)
                    await coordinator.on_run_complete(mmsi)
        await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ais_client
    context.set_broadcast(broadcast)
    context.reports_store = reports
    context.stats_counters = stats_counters
    context.vessel_events = agent_events_by_vessel

    inject_simulated_vessels(vessels)
    for mmsi, vessel in vessels.items():
        if vessel.is_simulated:
            position_history[mmsi] = [(vessel.longitude, vessel.latitude)]

    ais_client = AISClient(
        vessels,
        on_vessel_update=on_vessel_update,
        on_vessel_ping=on_vessel_ping,
        on_alert=on_alert,
        position_history=position_history,
    )
    await ais_client.start()
    for v in snapshot_vessels(vessels):
        last_broadcast_state[v.mmsi] = vessel_change_key(v)
    asyncio.create_task(vessel_broadcast_loop())
    asyncio.create_task(auto_trigger_loop())

    yield

    if ais_client:
        await ais_client.stop()


app = FastAPI(title="Ocean11 — HarborWatch AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "Ocean11 API",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "frontend": "http://localhost:5173",
        "message": "This is the API server. Open the UI at http://localhost:5173 (run: cd frontend && npm run dev).",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/vessels", response_model=list[Vessel])
async def list_vessels(
    risk_level: str | None = Query(None),
    limit: int = Query(50, ge=1, le=500),
):
    result = list(vessels.values())
    if risk_level:
        result = [v for v in result if v.risk_level == risk_level.upper()]
    result.sort(key=lambda v: v.risk_score, reverse=True)
    return result[:limit]


@app.get("/vessels/snapshot", response_model=list[Vessel])
async def get_vessel_snapshot():
    return snapshot_vessels(vessels)


@app.get("/vessels/{mmsi}", response_model=VesselDetailResponse)
async def get_vessel(mmsi: str):
    vessel = vessels.get(mmsi)
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    events = agent_events_by_vessel.get(mmsi, [])
    if mmsi in context.vessel_events:
        events = context.vessel_events.get(mmsi, events)
    return VesselDetailResponse(vessel=vessel, agent_events=events)


@app.get("/vessels/{mmsi}/history", response_model=list[InvestigationMemoryEntry])
async def get_vessel_history(mmsi: str):
    if mmsi not in vessels:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return get_history(mmsi)


@app.post("/vessels/{mmsi}/investigate", response_model=InvestigationStartResponse)
async def investigate_vessel(mmsi: str, background_tasks: BackgroundTasks):
    if mmsi not in vessels:
        raise HTTPException(status_code=404, detail="Vessel not found")
    if await coordinator.is_vessel_busy(mmsi):
        raise HTTPException(
            status_code=409,
            detail="investigation already in progress for this vessel",
        )
    investigation_id = await trigger_investigation(mmsi, auto=False, background_tasks=background_tasks)
    return InvestigationStartResponse(investigation_id=investigation_id or "", status="started")


@app.get("/investigations/{investigation_id}")
async def get_investigation(investigation_id: str):
    state = investigations.get(investigation_id)
    if not state:
        raise HTTPException(status_code=404, detail="Investigation not found")
    serializable = dict(state)
    if serializable.get("vessel"):
        serializable["vessel"] = serializable["vessel"].model_dump(mode="json")
    if serializable.get("events"):
        serializable["events"] = [
            e.model_dump(mode="json") if hasattr(e, "model_dump") else e
            for e in serializable["events"]
        ]
    if serializable.get("escalation_report"):
        serializable["escalation_report"] = serializable["escalation_report"].model_dump(
            mode="json"
        )
    return serializable


@app.get("/reports/{mmsi}", response_model=EscalationReport)
async def get_report(mmsi: str):
    report = reports.get(mmsi)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    return compute_stats()


@app.get("/fleets", response_model=list[FleetSignal])
async def get_fleets():
    return compute_fleet_signals(vessels)


@app.get("/flag-states/risk", response_model=list[FlagStateRisk])
async def get_flag_state_risk():
    return load_flag_state_risks()


@app.get("/vessels/{mmsi}/trail")
async def get_vessel_trail(mmsi: str):
    trail = position_history.get(mmsi, [])
    return {"mmsi": mmsi, "positions": trail}


@app.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket):
    await websocket.accept()
    ws_connections.append(websocket)
    try:
        stats = compute_stats()
        await websocket.send_text(
            json.dumps(
                {"type": "stats_update", "payload": stats.model_dump(mode="json")},
                default=str,
            )
        )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in ws_connections:
            ws_connections.remove(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
