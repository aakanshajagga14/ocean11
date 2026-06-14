from datetime import datetime, timedelta

from data.vessel_registry import registry
from models import Vessel
from risk.scoring import compute_risk_range, risk_level_from_score, update_vessel_risk

SIM_SCORES = {"SIM001": 91, "SIM002": 78, "SIM003": 95}


def get_simulated_vessels() -> list[Vessel]:
    now = datetime.utcnow()
    return [
        Vessel(
            mmsi="SIM001",
            name="MV Esperanza",
            flag_state="Comoros",
            vessel_type="Bulk Carrier",
            owner="Oceanic Holdings Ltd (disputed)",
            operator="Unknown",
            latitude=23.5,
            longitude=58.2,
            speed=0.0,
            heading=0.0,
            last_port="Dubai",
            destination="Unknown",
            days_stationary=47,
            ais_gap_hours=2.1,
            last_ais_signal=now - timedelta(hours=2),
            risk_score=91,
            risk_level="CRITICAL",
            risk_factors=[
                "days_stationary_60_plus",
                "flag_state_high_risk",
                "owner_dispute_history",
                "prior_itf_incident",
            ],
            is_simulated=True,
            abandonment_confirmed=False,
        ),
        Vessel(
            mmsi="SIM002",
            name="MV Fortuna Star",
            flag_state="Panama",
            vessel_type="Tanker",
            owner="Maritime Holdings BV",
            operator="Unknown",
            latitude=14.2,
            longitude=43.1,
            speed=0.0,
            heading=0.0,
            last_port="Djibouti",
            destination="Unknown",
            days_stationary=31,
            ais_gap_hours=78.5,
            last_ais_signal=now - timedelta(hours=78),
            risk_score=78,
            risk_level="HIGH",
            risk_factors=[
                "ais_gap_72h",
                "days_stationary_30_plus",
                "no_recent_port_call",
                "insurance_lapsed",
            ],
            is_simulated=True,
            abandonment_confirmed=False,
        ),
        Vessel(
            mmsi="SIM003",
            name="MV Konstantinos",
            flag_state="Malta",
            vessel_type="Container Ship",
            owner="Hellas Shipping SA",
            operator="Unknown",
            latitude=5.3,
            longitude=3.4,
            speed=0.0,
            heading=0.0,
            last_port="Lagos",
            destination="Unknown",
            days_stationary=62,
            ais_gap_hours=12.0,
            last_ais_signal=now - timedelta(hours=12),
            risk_score=95,
            risk_level="CRITICAL",
            risk_factors=[
                "days_stationary_60_plus",
                "crew_complaint_filed",
                "owner_dispute_history",
                "prior_itf_incident",
                "insurance_lapsed",
            ],
            is_simulated=True,
            abandonment_confirmed=False,
        ),
    ]


def inject_simulated_vessels(vessel_store: dict) -> None:
    for vessel in get_simulated_vessels():
        update_vessel_risk(vessel, registry, position_count=10)
        spec_score = SIM_SCORES.get(vessel.mmsi, vessel.risk_score)
        vessel.risk_score = float(spec_score)
        vessel.risk_level = risk_level_from_score(spec_score)
        low, high = compute_risk_range(spec_score, vessel.risk_score_confidence)
        vessel.risk_score_low = low
        vessel.risk_score_high = high
        vessel_store[vessel.mmsi] = vessel
