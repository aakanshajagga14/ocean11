"""Cross-vessel fleet pattern detection by owner."""

from collections import defaultdict

from models import FleetSignal, Vessel


def compute_fleet_signals(vessels: dict[str, Vessel]) -> list[FleetSignal]:
    by_owner: dict[str, list[Vessel]] = defaultdict(list)
    for vessel in vessels.values():
        owner = (vessel.owner or "").strip()
        if not owner or owner.lower() == "unknown":
            continue
        by_owner[owner].append(vessel)

    signals: list[FleetSignal] = []
    for owner, fleet in by_owner.items():
        if len(fleet) < 2:
            continue

        ais_gaps = sum(1 for v in fleet if v.ais_gap_hours >= 24)
        stationary = sum(1 for v in fleet if v.days_stationary >= 30)
        high_risk = sum(1 for v in fleet if v.risk_score >= 60)

        score = min(
            100,
            ais_gaps * 18 + stationary * 22 + high_risk * 15 + (len(fleet) - 1) * 5,
        )

        affected = [
            v.mmsi
            for v in fleet
            if v.ais_gap_hours >= 24 or v.days_stationary >= 30 or v.risk_score >= 30
        ]

        if ais_gaps >= 2 or stationary >= 2:
            summary = (
                f"{owner} — {max(ais_gaps, stationary)} of {len(fleet)} vessels "
                f"showing anomalies — possible systemic issue"
            )
        elif score >= 40:
            summary = (
                f"{owner} — {len(affected)} of {len(fleet)} vessels flagged "
                f"by pattern detection"
            )
        else:
            summary = f"{owner} — {len(fleet)} vessels monitored, elevated watch"

        signals.append(
            FleetSignal(
                owner=owner,
                vessel_count=len(fleet),
                vessels_with_ais_gaps_24h=ais_gaps,
                vessels_stationary_30d_plus=stationary,
                fleet_pattern_score=round(score, 1),
                affected_vessels=affected if affected else [v.mmsi for v in fleet],
                summary=summary,
            )
        )

    signals.sort(key=lambda s: s.fleet_pattern_score, reverse=True)
    return signals


def fleet_alerts(signals: list[FleetSignal], threshold: float = 60) -> list[FleetSignal]:
    return [s for s in signals if s.fleet_pattern_score >= threshold]
