import asyncio
import json
import logging
import os
from typing import Any

from google import genai
from google.genai import types

from config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

JSON_SUFFIX = (
    "Respond ONLY in the specified JSON format. "
    "No preamble, no markdown, no explanation outside the JSON structure."
)

INVESTIGATION_TOOLS = [{"google_search": {}}]

AGENT_MAX_TOKENS = {
    "monitoring": 300,
    "investigation": 500,
    "risk": 300,
    "compliance": 400,
    "escalation": 800,
}

GEMINI_TIMEOUT_SEC = 15
GEMINI_RETRY_DELAY_SEC = 2

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        if GEMINI_API_KEY:
            os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
        _client = genai.Client(api_key=GEMINI_API_KEY or None)
    return _client


def _is_retryable(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "429" in msg or "resource_exhausted" in msg or "503" in msg or "unavailable" in msg


async def call_gemini(
    system_prompt: str,
    user_prompt: str,
    tools: list[Any] | None = None,
    max_tokens: int = 512,
    agent_name: str = "agent",
) -> dict:
    client = get_client()
    config_kwargs: dict[str, Any] = {
        "system_instruction": system_prompt + "\n\n" + JSON_SUFFIX,
        "max_output_tokens": max_tokens,
    }
    if tools:
        config_kwargs["tools"] = tools
    else:
        config_kwargs["response_mime_type"] = "application/json"

    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=user_prompt,
                    config=types.GenerateContentConfig(**config_kwargs),
                ),
                timeout=GEMINI_TIMEOUT_SEC,
            )
            text = (response.text or "{}").strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            return json.loads(text)
        except asyncio.TimeoutError:
            logger.warning("%s agent Gemini timeout after %ss", agent_name, GEMINI_TIMEOUT_SEC)
            raise
        except json.JSONDecodeError as e:
            logger.warning("Gemini returned non-JSON for %s: %s", agent_name, e)
            raw = ""
            try:
                raw = response.text or ""
            except NameError:
                pass
            return {"raw_response": raw}
        except Exception as e:
            last_exc = e
            if _is_retryable(e) and attempt == 0:
                logger.warning("%s agent retry after rate limit: %s", agent_name, e)
                await asyncio.sleep(GEMINI_RETRY_DELAY_SEC)
                continue
            logger.error("Gemini API error (%s): %s", agent_name, e)
            raise
    if last_exc:
        raise last_exc
    return {}
