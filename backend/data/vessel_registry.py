from dataclasses import dataclass

from config import REGION_BOOST

HIGH_RISK_FLAG_STATES: set[str] = {
    "Comoros",
    "Palau",
    "Tuvalu",
    "Sierra Leone",
    "Belize",
    "Bolivia",
    "Mongolia",
}

RISK_REGIONS: list[dict] = [
    {"name": "Red Sea", "lat_min": 12, "lat_max": 30, "lon_min": 32, "lon_max": 44},
    {"name": "Gulf of Aden", "lat_min": 10, "lat_max": 15, "lon_min": 42, "lon_max": 52},
    {"name": "West Africa", "lat_min": -5, "lat_max": 15, "lon_min": -20, "lon_max": 10},
    {"name": "SE Asia", "lat_min": -5, "lat_max": 22, "lon_min": 95, "lon_max": 121},
]


@dataclass
class VesselEnrichment:
    owner_dispute_history: bool = False
    prior_itf_incident: bool = False
    no_recent_port_call: bool = False
    crew_complaint_filed: bool = False
    insurance_lapsed: bool = False
    crew_size: int = 0
    crew_nationalities: list[str] | None = None
    days_unpaid: int = 0
    owner_notes: str = ""


SIM_ENRICHMENT: dict[str, VesselEnrichment] = {
    "SIM001": VesselEnrichment(
        owner_dispute_history=True,
        prior_itf_incident=True,
        no_recent_port_call=True,
        crew_size=18,
        crew_nationalities=["Philippines", "India", "Myanmar"],
        days_unpaid=47,
        owner_notes="Oceanic Holdings Ltd has 2 prior ITF incidents",
    ),
    "SIM002": VesselEnrichment(
        no_recent_port_call=True,
        insurance_lapsed=True,
        crew_size=22,
        crew_nationalities=["Ukraine", "Georgia", "India"],
        days_unpaid=31,
        owner_notes="Maritime Holdings BV — insurance lapsed",
    ),
    "SIM003": VesselEnrichment(
        owner_dispute_history=True,
        prior_itf_incident=True,
        crew_complaint_filed=True,
        insurance_lapsed=True,
        crew_size=14,
        crew_nationalities=["Greece", "Philippines"],
        days_unpaid=62,
        owner_notes="Hellas Shipping SA — crew complaint filed with ITF, owner unreachable",
    ),
}


class VesselRegistry:
    def get_enrichment(self, mmsi: str) -> VesselEnrichment:
        if mmsi in SIM_ENRICHMENT:
            return SIM_ENRICHMENT[mmsi]
        return VesselEnrichment()

    def in_risk_region(self, latitude: float, longitude: float) -> bool:
        for region in RISK_REGIONS:
            if (
                region["lat_min"] <= latitude <= region["lat_max"]
                and region["lon_min"] <= longitude <= region["lon_max"]
            ):
                return True
        return False

    def region_boost(self) -> int:
        return REGION_BOOST


registry = VesselRegistry()
