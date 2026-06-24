"""LLMProvider Protocol — every concrete provider implements this surface."""
from __future__ import annotations

from typing import AsyncIterator, Literal, Protocol, TypedDict, runtime_checkable


class Message(TypedDict):
    role: Literal["user", "assistant"]
    content: str


@runtime_checkable
class LLMProvider(Protocol):
    """Minimal LLM surface for Skills.

    Implementations must be safe to call from FastAPI request handlers and
    obey two contracts:
      - `complete(..., response_format="json")` MUST return a `dict`.
      - `complete(..., response_format="text")` MUST return a `str`.
    On parse failure the provider raises `LLMInvalidJSONError`.
    Timeouts raise `LLMTimeoutError`.
    """

    name: str

    async def complete(
        self,
        messages: list[Message],
        system: str,
        response_format: Literal["text", "json"] = "text",
    ) -> str | dict: ...

    async def stream(
        self, messages: list[Message], system: str
    ) -> AsyncIterator[str]:
        """Reserved for E1.5. Today every Skill consumes `complete`."""
        ...


class LLMError(Exception):
    """Base class for LLM-related failures."""

    code: str = "llm_error"


class LLMTimeoutError(LLMError):
    code = "llm_timeout"


class LLMInvalidJSONError(LLMError):
    code = "llm_invalid_json"


class LLMUpstreamError(LLMError):
    code = "llm_upstream_error"
