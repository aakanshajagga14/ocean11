import asyncio
from typing import Callable

broadcast_fn: Callable | None = None
vessel_events: dict[str, list] = {}
reports_store: dict = {}
stats_counters: dict = {"investigations_today": 0, "reports_generated": 0}
state_lock = asyncio.Lock()


def set_broadcast(fn: Callable) -> None:
    global broadcast_fn
    broadcast_fn = fn


async def broadcast(msg: dict) -> None:
    if broadcast_fn:
        await broadcast_fn(msg)


def append_event(mmsi: str, event) -> None:
    vessel_events.setdefault(mmsi, []).append(event)


async def append_state_event(state, event) -> None:
    async with state_lock:
        state["events"].append(event)


async def finalize_state_event(state, event_id: str, complete) -> None:
    async with state_lock:
        state["events"] = [e for e in state["events"] if e.event_id != event_id]
        state["events"].append(complete)
