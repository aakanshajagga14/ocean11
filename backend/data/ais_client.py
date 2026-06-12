import asyncio
import json
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Callable

import websockets
from websockets.exceptions import ConnectionClosed

from config import (
    AISSTREAM_API_KEY,
    AIS_WS_URL,
    BACKOFF_BASE,
    BACKOFF_FACTOR,
    BACKOFF_MAX,
    MAX_VESSELS,
)
from data.vessel_registry import registry
from models import Vessel
from risk.scoring import update_vessel_risk

logger = logging.getLogger(__name__)

SHIP_TYPE_MAP = {
    70: "Cargo",
    71: "Cargo Hazardous A",
    72: "Cargo Hazardous B",
    73: "Cargo Hazardous C",
    74: "Cargo Hazardous D",
    75: "Cargo Reserved",
    76: "Cargo Reserved",
    77: "Cargo Reserved",
    78: "Cargo Reserved",
    79: "Cargo No Info",
    80: "Tanker",
    81: "Tanker Hazardous A",
    82: "Tanker Hazardous B",
    83: "Tanker Hazardous C",
    84: "Tanker Hazardous D",
    85: "Tanker Reserved",
    86: "Tanker Reserved",
    87: "Tanker Reserved",
    88: "Tanker Reserved",
    89: "Tanker No Info",
}


class ConnectionState(str, Enum):
    CONNECTING = "CONNECTING"
    CONNECTED = "CONNECTED"
    DISCONNECTED = "DISCONNECTED"
    RECONNECTING = "RECONNECTING"


class AISClient:
    def __init__(
        self,
        vessel_store: dict[str, Vessel],
        on_vessel_update: Callable | None = None,
        on_alert: Callable | None = None,
        position_history: dict[str, list[tuple[float, float]]] | None = None,
    ) -> None:
        self.vessels = vessel_store
        self.on_vessel_update = on_vessel_update
        self.on_alert = on_alert
        self.position_history = position_history or {}
        self.state = ConnectionState.DISCONNECTED
        self.last_received_timestamp: datetime | None = None
        self._ws = None
        self._running = False
        self._previous_risk_levels: dict[str, str] = {}

    def _maybe_evict(self) -> None:
        if len(self.vessels) >= MAX_VESSELS:
            real_vessels = {
                m: v for m, v in self.vessels.items() if not v.is_simulated
            }
            if not real_vessels:
                return
            oldest_mmsi = min(
                real_vessels, key=lambda m: real_vessels[m].last_ais_signal
            )
            del self.vessels[oldest_mmsi]

    def _subscribe_message(self) -> dict:
        return {
            "APIKey": AISSTREAM_API_KEY,
            "BoundingBoxes": [[[-90, -180], [90, 180]]],
            "FiltersShipMMSI": [],
            "FilterMessageTypes": ["PositionReport"],
            "FilterVesselTypes": list(range(70, 90)),
        }

    def _backfill_message(self) -> dict | None:
        if not self.last_received_timestamp:
            return None
        return {
            "APIKey": AISSTREAM_API_KEY,
            "BackfillFrom": self.last_received_timestamp.isoformat(),
            "BoundingBoxes": [[[-90, -180], [90, 180]]],
            "FilterVesselTypes": list(range(70, 90)),
        }

    def _parse_position_report(self, data: dict) -> Vessel | None:
        try:
            meta = data.get("MetaData", {})
            message = data.get("Message", {})
            pos_report = message.get("PositionReport", {})
            if not pos_report:
                return None

            mmsi = str(meta.get("MMSI") or pos_report.get("UserID", ""))
            if not mmsi:
                return None

            now = datetime.utcnow()
            lat = float(pos_report.get("Latitude", 0))
            lon = float(pos_report.get("Longitude", 0))
            speed = float(pos_report.get("Sog", 0) or 0)
            heading = float(pos_report.get("Cog", 0) or 0)
            ship_type = int(pos_report.get("ShipType", 80))
            vessel_type = SHIP_TYPE_MAP.get(ship_type, "Cargo/Tanker")
            name = meta.get("ShipName", "").strip() or f"Vessel {mmsi}"

            existing = self.vessels.get(mmsi)
            if existing and existing.is_simulated:
                return None

            prev_lat = existing.latitude if existing else lat
            prev_lon = existing.longitude if existing else lon

            days_stationary = existing.days_stationary if existing else 0
            if speed < 0.5:
                if existing:
                    days_stationary = existing.days_stationary + 1
                else:
                    days_stationary = 0
            else:
                days_stationary = 0

            vessel = Vessel(
                mmsi=mmsi,
                name=name,
                flag_state=existing.flag_state if existing else "Unknown",
                vessel_type=vessel_type,
                owner=existing.owner if existing else "Unknown",
                operator=existing.operator if existing else "Unknown",
                latitude=lat,
                longitude=lon,
                speed=speed,
                heading=heading,
                last_port=existing.last_port if existing else "Unknown",
                destination=existing.destination if existing else "Unknown",
                days_stationary=days_stationary,
                last_ais_signal=now,
                ais_gap_hours=0.0,
                risk_score=existing.risk_score if existing else 0,
                risk_level=existing.risk_level if existing else "LOW",
                risk_factors=existing.risk_factors if existing else [],
                is_simulated=False,
                abandonment_confirmed=False,
            )

            update_vessel_risk(vessel, registry)

            if mmsi not in self.vessels:
                self._maybe_evict()
            self.vessels[mmsi] = vessel

            trail = self.position_history.setdefault(mmsi, [])
            if not trail or (trail[-1][0] != lon or trail[-1][1] != lat):
                trail.append((lon, lat))
                if len(trail) > 10:
                    self.position_history[mmsi] = trail[-10:]

            prev_level = self._previous_risk_levels.get(mmsi)
            if (
                prev_level
                and prev_level not in ("HIGH", "CRITICAL")
                and vessel.risk_level in ("HIGH", "CRITICAL")
                and self.on_alert
            ):
                asyncio.create_task(
                    self.on_alert(mmsi, vessel.risk_score, vessel.risk_level)
                )
            self._previous_risk_levels[mmsi] = vessel.risk_level

            if self.on_vessel_update:
                asyncio.create_task(self.on_vessel_update(mmsi, vessel))

            return vessel
        except Exception as e:
            logger.warning("Failed to parse AIS message: %s", e)
            return None

    async def _request_backfill(self) -> None:
        if self._ws is None:
            return
        backfill = self._backfill_message()
        if backfill:
            await self._ws.send(json.dumps(backfill))
            logger.info("Requested AIS backfill from %s", backfill.get("BackfillFrom"))

    async def _connect_and_listen(self) -> None:
        self.state = ConnectionState.CONNECTING
        async with websockets.connect(AIS_WS_URL) as ws:
            self._ws = ws
            self.state = ConnectionState.CONNECTED
            await ws.send(json.dumps(self._subscribe_message()))
            await self._request_backfill()
            logger.info("AIS WebSocket connected and subscribed")

            async for raw in ws:
                self.last_received_timestamp = datetime.utcnow()
                try:
                    data = json.loads(raw)
                    self._parse_position_report(data)
                except json.JSONDecodeError:
                    continue

    async def reconnect_loop(self) -> None:
        attempt = 0
        while self._running:
            try:
                self.state = ConnectionState.RECONNECTING if attempt > 0 else ConnectionState.CONNECTING
                if attempt > 0:
                    delay = min(BACKOFF_BASE * (BACKOFF_FACTOR ** attempt), BACKOFF_MAX)
                    logger.info("AIS reconnect attempt %d in %ds", attempt, delay)
                    await asyncio.sleep(delay)
                await self._connect_and_listen()
                attempt = 0
            except ConnectionClosed as e:
                self.state = ConnectionState.DISCONNECTED
                logger.warning("AIS WebSocket closed: %s", e)
                attempt += 1
            except Exception as e:
                self.state = ConnectionState.DISCONNECTED
                logger.error("AIS connection error: %s", e)
                attempt += 1
            finally:
                self._ws = None

    async def gap_update_loop(self) -> None:
        while self._running:
            now = datetime.utcnow()
            for mmsi, vessel in list(self.vessels.items()):
                if vessel.is_simulated:
                    continue
                gap = (now - vessel.last_ais_signal).total_seconds() / 3600
                if abs(vessel.ais_gap_hours - gap) > 0.01:
                    vessel.ais_gap_hours = gap
                    prev_level = vessel.risk_level
                    update_vessel_risk(vessel, registry)
                    if self.on_vessel_update:
                        await self.on_vessel_update(mmsi, vessel)
                    if (
                        prev_level not in ("HIGH", "CRITICAL")
                        and vessel.risk_level in ("HIGH", "CRITICAL")
                        and self.on_alert
                    ):
                        await self.on_alert(mmsi, vessel.risk_score, vessel.risk_level)
            await asyncio.sleep(60)

    async def start(self) -> None:
        self._running = True
        if not AISSTREAM_API_KEY:
            logger.warning("AISSTREAM_API_KEY not set — AIS client will not connect")
            return
        asyncio.create_task(self.reconnect_loop())
        asyncio.create_task(self.gap_update_loop())

    async def stop(self) -> None:
        self._running = False
