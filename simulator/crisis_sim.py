"""Standalone scenario injector for Ocean11 crisis simulations."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from data.simulator import get_simulated_vessels, inject_simulated_vessels


def main():
    store: dict = {}
    inject_simulated_vessels(store)
    for mmsi, vessel in store.items():
        print(f"{mmsi}: {vessel.name} — risk {vessel.risk_score} ({vessel.risk_level})")
    print(f"\nInjected {len(get_simulated_vessels())} crisis scenarios.")


if __name__ == "__main__":
    main()
