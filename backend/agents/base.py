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
# Gemini web search grounding tool for Investigation Agent

_client: genai.Client | None = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        if GEMINI_API_KEY:
            os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
        _client = genai.Client(api_key=GEMINI_API_KEY or None)
    return _client


async def call_gemini(
    system_prompt: str,
    user_prompt: str,
    tools: list[Any] | None = None,
) -> dict:
    client = get_client()
    config_kwargs: dict[str, Any] = {
        "system_instruction": system_prompt + "\n\n" + JSON_SUFFIX,
        "response_mime_type": "application/json",
    }
    if tools:
        config_kwargs["tools"] = tools

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(**config_kwargs),
        )
        text = response.text or "{}"
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Gemini returned non-JSON, wrapping response")
        return {"raw_response": response.text}
    except Exception as e:
        logger.error("Gemini API error: %s", e)
        raise
