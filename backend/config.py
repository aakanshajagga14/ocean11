import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
AISSTREAM_API_KEY: str = os.getenv("AISSTREAM_API_KEY", "")
PORT: int = int(os.getenv("PORT", "8000"))

PIPELINE_THRESHOLD: int = 60
COOLDOWN_SECONDS: int = 3600
MAX_VESSELS: int = 500

BACKOFF_BASE: int = 1
BACKOFF_MAX: int = 60
BACKOFF_FACTOR: int = 2

AIS_WS_URL: str = "wss://stream.aisstream.io/v0/stream"

RISK_FACTORS: dict[str, int] = {
    "days_stationary_30_plus": 25,
    "days_stationary_60_plus": 40,
    "ais_gap_24h": 15,
    "ais_gap_72h": 30,
    "flag_state_high_risk": 15,
    "owner_dispute_history": 20,
    "prior_itf_incident": 25,
    "no_recent_port_call": 10,
    "crew_complaint_filed": 30,
    "insurance_lapsed": 35,
}

REGION_BOOST: int = 10
