"""Throttled vessel WebSocket broadcasting — diff-only, capped at 300."""

from datetime import datetime

from models import Vessel

FRONTEND_VESSEL_CAP = 300
BROADCAST_INTERVAL_SEC = 2.0


def vessel_change_key(v: Vessel) -> tuple:
    return (
        round(v.latitude, 4),
        round(v.longitude, 4),
        round(v.speed, 2),
        round(v.risk_score, 1),
        v.risk_level,
    )


def select_vessels_for_frontend(vessels: dict[str, Vessel]) -> list[Vessel]:
    all_v = list(vessels.values())
    simulated = [v for v in all_v if v.is_simulated]
    real = [v for v in all_v if not v.is_simulated]
    real.sort(
        key=lambda v: (
            -v.risk_score,
            -(v.last_ais_signal.timestamp() if v.last_ais_signal else 0),
        )
    )
    cap = max(0, FRONTEND_VESSEL_CAP - len(simulated))
    return simulated + real[:cap]


def build_vessel_diff(
    vessels: dict[str, Vessel],
    last_broadcast_state: dict[str, tuple],
) -> list[dict]:
    selected = select_vessels_for_frontend(vessels)
    changed: list[dict] = []
    for v in selected:
        key = vessel_change_key(v)
        if last_broadcast_state.get(v.mmsi) == key:
            continue
        last_broadcast_state[v.mmsi] = key
        changed.append(v.model_dump(mode="json"))
    return changed


def snapshot_vessels(vessels: dict[str, Vessel]) -> list[Vessel]:
    return select_vessels_for_frontend(vessels)
