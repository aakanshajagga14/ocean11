from typing import Callable

broadcast_fn: Callable | None = None
vessel_events: dict[str, list] = {}
reports_store: dict = {}
stats_counters: dict = {"investigations_today": 0, "reports_generated": 0}


def set_broadcast(fn: Callable) -> None:
    global broadcast_fn
    broadcast_fn = fn


async def broadcast(msg: dict) -> None:
    if broadcast_fn:
        await broadcast_fn(msg)


def append_event(mmsi: str, event) -> None:
    vessel_events.setdefault(mmsi, []).append(event)
