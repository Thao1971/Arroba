"""MockLLMProvider — used by pytest. Returns pre-defined JSON/text from a
small registry, never makes network calls. Tests inject this via the factory's
override map."""
from __future__ import annotations

import json
from typing import AsyncIterator, Callable, Literal

from src.modules.copilot.llm.provider import (
    LLMInvalidJSONError,
    Message,
)

# A handler decides the mock response based on the incoming `messages` + system.
# Tests can register new behaviours via `register_response(...)` per test case.
Handler = Callable[[list[Message], str, Literal["text", "json"]], str | dict]


class MockLLMProvider:
    """Deterministic LLM stand-in for tests."""

    name = "mock"

    def __init__(self) -> None:
        self.calls: list[tuple[list[Message], str, str]] = []
        self._handlers: list[Handler] = []
        self._default: str | dict = {
            "summary": "Empresa con datos suficientes para análisis preliminar.",
            "key_metrics": [
                {"label": "EBITDA", "value": "1,1M €", "trend": "up"},
                {"label": "Margen", "value": "20%", "trend": "flat"},
            ],
            "risks": ["Concentración de cliente principal", "Exposición a un único país"],
            "opportunities": ["Internacionalización", "Cross-selling de servicios"],
        }

    def register(self, handler: Handler) -> None:
        """Push a handler; latest registered wins."""
        self._handlers.append(handler)

    def set_default(self, response: str | dict) -> None:
        self._default = response

    async def complete(
        self,
        messages: list[Message],
        system: str,
        response_format: Literal["text", "json"] = "text",
    ) -> str | dict:
        self.calls.append((messages, system, response_format))
        for h in reversed(self._handlers):
            try:
                return h(messages, system, response_format)
            except StopIteration:
                continue
        # Fallback to default.
        if response_format == "json":
            return self._default if isinstance(self._default, dict) else json.loads(self._default)
        return self._default if isinstance(self._default, str) else json.dumps(self._default)

    async def stream(
        self, messages: list[Message], system: str
    ) -> AsyncIterator[str]:
        yield "mock-stream"


def make_invalid_json_provider() -> MockLLMProvider:
    """Convenience factory for the 'Claude returns garbage' test case."""
    mp = MockLLMProvider()

    def handler(msgs, sys, fmt):
        if fmt == "json":
            raise LLMInvalidJSONError("invalid json from mock")
        return "garbage"

    mp.register(handler)
    return mp
