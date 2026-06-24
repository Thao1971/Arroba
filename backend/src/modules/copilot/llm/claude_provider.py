"""Claude provider via emergentintegrations.LlmChat.

Tests NEVER import this concrete provider directly. They use
`MockLLMProvider` via dependency injection so no tokens are consumed.
"""
from __future__ import annotations

import asyncio
import json
import re
import uuid
from typing import AsyncIterator, Literal

from src.core.config import get_settings
from src.core.logging import get_logger
from src.modules.copilot.llm.provider import (
    LLMInvalidJSONError,
    LLMTimeoutError,
    LLMUpstreamError,
    Message,
)

log = get_logger("copilot.llm.claude")


class ClaudeProvider:
    """`with_model("anthropic", "claude-sonnet-4-6")` Wrapper."""

    name = "claude"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        settings = get_settings()
        self._api_key = api_key or settings.emergent_llm_key
        self._model = model or settings.llm_model or "claude-sonnet-4-6"
        self._timeout = settings.llm_timeout_seconds or 8

    async def complete(
        self,
        messages: list[Message],
        system: str,
        response_format: Literal["text", "json"] = "text",
    ) -> str | dict:
        try:
            # Local import keeps the rest of the codebase importable even if
            # emergentintegrations is uninstalled (tests stub the provider).
            from emergentintegrations.llmchat import LlmChat, UserMessage  # type: ignore
        except Exception as exc:  # pragma: no cover - infra failure
            raise LLMUpstreamError(f"emergentintegrations not available: {exc}") from exc

        session_id = "sess_" + uuid.uuid4().hex[:12]
        sys_prompt = system
        if response_format == "json":
            sys_prompt = (
                system
                + "\n\nIMPORTANTE: Devuelve ÚNICAMENTE JSON válido. "
                "No incluyas texto antes o después, ni Markdown, ni triple backticks."
            )

        chat = (
            LlmChat(api_key=self._api_key, session_id=session_id, system_message=sys_prompt)
            .with_model("anthropic", self._model)
        )

        # Concatenate prior turns; the library accepts one UserMessage per call.
        rendered = "\n\n".join(
            f"[{m['role']}] {m['content']}" for m in messages
        ) or "(empty)"

        async def _call(user_text: str) -> str:
            return await chat.send_message(UserMessage(text=user_text))

        try:
            response = await asyncio.wait_for(_call(rendered), timeout=self._timeout)
        except asyncio.TimeoutError as exc:
            log.warning("[LLM] claude timeout (first attempt)", model=self._model)
            await asyncio.sleep(2)
            try:
                response = await asyncio.wait_for(_call(rendered), timeout=self._timeout)
            except asyncio.TimeoutError as exc2:
                log.error("[LLM] claude timeout (retry)", model=self._model)
                raise LLMTimeoutError("LLM timed out after retry") from exc2
        except Exception as exc:  # pragma: no cover - network failure
            log.error("[LLM] claude upstream error", err=str(exc))
            raise LLMUpstreamError(str(exc)) from exc

        if response_format == "text":
            return str(response)
        return _parse_json_strict(str(response))

    async def stream(
        self, messages: list[Message], system: str
    ) -> AsyncIterator[str]:  # pragma: no cover - reserved for E1.5
        raise NotImplementedError("ClaudeProvider.stream lands in E1.5")
        yield ""  # never reached, makes type-checker happy


def _parse_json_strict(raw: str) -> dict:
    """Tolerate the most common Claude formatting glitches before giving up."""
    text = (raw or "").strip()
    # Strip ```json fences or ``` fences if the model added them anyway.
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL | re.IGNORECASE)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        log.error("[LLM] invalid json from claude", excerpt=text[:300])
        raise LLMInvalidJSONError(f"Claude returned invalid JSON: {exc}") from exc
