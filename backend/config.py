import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
AISSTREAM_API_KEY = os.getenv("AISSTREAM_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
PORT = int(os.getenv("PORT", "8000"))

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")
if not AISSTREAM_API_KEY:
    raise ValueError("AISSTREAM_API_KEY environment variable is required")

PIPELINE_THRESHOLD: int = int(os.getenv("PIPELINE_THRESHOLD", "60"))
COOLDOWN_SECONDS: int = int(os.getenv("COOLDOWN_SECONDS", "3600"))
MAX_VESSELS: int = int(os.getenv("MAX_VESSELS", "500"))

BACKOFF_BASE: int = int(os.getenv("BACKOFF_BASE", "1"))
BACKOFF_MAX: int = int(os.getenv("BACKOFF_MAX", "60"))
BACKOFF_FACTOR: int = int(os.getenv("BACKOFF_FACTOR", "2"))

AIS_WS_URL: str = os.getenv("AIS_WS_URL", "wss://stream.aisstream.io/v0/stream")

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

REGION_BOOST: int = int(os.getenv("REGION_BOOST", "10"))
