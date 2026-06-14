"""Static flag-state abandonment risk lookup (illustrative ITF/Paris MOU reference data)."""

import json
from pathlib import Path

from models import FlagStateRisk

_DATA_PATH = Path(__file__).parent / "flag_state_risk.json"
_cache: list[FlagStateRisk] | None = None
_lookup: dict[str, FlagStateRisk] | None = None

TIER_COLORS = {
    "LOW": [34, 197, 94],
    "MEDIUM": [234, 179, 8],
    "HIGH": [249, 115, 22],
    "CRITICAL": [239, 68, 68],
}


def load_flag_state_risks() -> list[FlagStateRisk]:
    global _cache, _lookup
    if _cache is None:
        with open(_DATA_PATH, encoding="utf-8") as f:
            raw = json.load(f)
        _cache = [FlagStateRisk(**entry) for entry in raw]
        _lookup = {r.flag_state.lower(): r for r in _cache}
    return _cache


def get_flag_state_risk(flag_state: str) -> FlagStateRisk | None:
    load_flag_state_risks()
    if not _lookup:
        return None
    return _lookup.get(flag_state.lower())


def get_tier_color(flag_state: str) -> list[int]:
    entry = get_flag_state_risk(flag_state)
    if not entry:
        return [100, 116, 139]
    return TIER_COLORS.get(entry.risk_tier, [100, 116, 139])
