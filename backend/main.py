import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from agents import context
from agents.pipeline import run_pipeline
from config import PORT
from data.ais_client import AISClient
from data.simulator import inject_simulated_vessels
from models import (
    AgentEvent,
    EscalationReport,
    InvestigationStartResponse,
    StatsResponse,
    Vessel,
    VesselDetailResponse,
)
from risk.scoring import coordinator, update_vessel_risk
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

ais_client: AISClient | None = None


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


async def on_vessel_update(mmsi: str, vessel: Vessel) -> None:
    prev = vessels.get(mmsi)
    vessels[mmsi] = vessel
    fields: dict[str, Any] = vessel.model_dump(mode="json")
    await broadcast({"type": "vessel_update", "mmsi": mmsi, "fields": fields})

    if (
        vessel.risk_score >= 60
        and not vessel.is_simulated
        and await coordinator.maybe_trigger(vessel)
    ):
        asyncio.create_task(trigger_investigation(mmsi, auto=True))


async def on_alert(mmsi: str, risk_score: float, risk_level: str) -> None:
    await broadcast(
        {"type": "alert", "mmsi": mmsi, "risk_score": risk_score, "risk_level": risk_level}
    )


async def trigger_investigation(mmsi: str, auto: bool = False) -> str | None:
    vessel = vessels.get(mmsi)
    if not vessel:
        return None

    if not auto:
        acquired = await coordinator.acquire_manual(mmsi)
        if not acquired:
            raise HTTPException(status_code=409, detail="investigation already in progress")

    from agents.pipeline import start_investigation

    investigation_id = await start_investigation(vessel, investigations, coordinator)
    stats_counters["investigations_today"] += 1
    agent_events_by_vessel.setdefault(mmsi, [])

    async def _run():
        async def on_complete(mmsi: str, result: dict) -> None:
            investigations[investigation_id] = result
            if result.get("escalation_report"):
                reports[mmsi] = result["escalation_report"]
            await coordinator.on_run_complete(mmsi)

        async def on_error(mmsi: str, error: Exception, state: dict) -> None:
            investigations[investigation_id] = state
            await coordinator.on_run_complete(mmsi)

        result = await run_pipeline(
            vessel,
            investigation_id,
            on_error=on_error,
            on_complete=on_complete,
        )
        investigations[investigation_id] = result
        if result.get("escalation_report"):
            reports[mmsi] = result["escalation_report"]

    asyncio.create_task(_run())
    return investigation_id


async def auto_trigger_loop() -> None:
    while True:
        for mmsi, vessel in list(vessels.items()):
            if vessel.is_simulated:
                continue
            update_vessel_risk(vessel, registry)
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
        on_alert=on_alert,
        position_history=position_history,
    )
    await ais_client.start()
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


@app.get("/vessels/{mmsi}", response_model=VesselDetailResponse)
async def get_vessel(mmsi: str):
    vessel = vessels.get(mmsi)
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    events = agent_events_by_vessel.get(mmsi, [])
    if mmsi in context.vessel_events:
        events = context.vessel_events.get(mmsi, events)
    return VesselDetailResponse(vessel=vessel, agent_events=events)


@app.post("/vessels/{mmsi}/investigate", response_model=InvestigationStartResponse)
async def investigate_vessel(mmsi: str):
    if mmsi not in vessels:
        raise HTTPException(status_code=404, detail="Vessel not found")
    if await coordinator.is_busy():
        raise HTTPException(status_code=409, detail="investigation already in progress")
    investigation_id = await trigger_investigation(mmsi, auto=False)
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
    all_vessels = list(vessels.values())
    active = 1 if await coordinator.is_busy() else 0
    return StatsResponse(
        total_monitored=len(all_vessels),
        high_risk_count=sum(1 for v in all_vessels if v.risk_level == "HIGH"),
        critical_count=sum(1 for v in all_vessels if v.risk_level == "CRITICAL"),
        investigations_today=stats_counters["investigations_today"],
        reports_generated=stats_counters["reports_generated"],
    )


@app.get("/vessels/{mmsi}/trail")
async def get_vessel_trail(mmsi: str):
    trail = position_history.get(mmsi, [])
    return {"mmsi": mmsi, "positions": trail}


@app.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket):
    await websocket.accept()
    ws_connections.append(websocket)
    try:
        for v in vessels.values():
            await websocket.send_text(
                json.dumps(
                    {
                        "type": "vessel_update",
                        "mmsi": v.mmsi,
                        "fields": v.model_dump(mode="json"),
                    },
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
