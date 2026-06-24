"""GPT-5.2 provider slot.

Reserved for E1.x. The class implements the same interface as ClaudeProvider
but raises NotImplementedError on every call. The SDK import is intentionally
omitted so importing this module never crashes when the openai library is
missing.
"""
from __future__ import annotations

from typing import AsyncIterator, Literal

from src.modules.copilot.llm.provider import Message


class GPT52Provider:
    name = "gpt52"

    def __init__(self, *args, **kwargs) -> None:
        # No SDK imports here on purpose. We don't depend on the openai
        # library until this slot is activated.
        pass

    async def complete(
        self,
        messages: list[Message],
        system: str,
        response_format: Literal["text", "json"] = "text",
    ) -> str | dict:
        raise NotImplementedError(
            "GPT-5.2 provider slot reservado. Activar en E1.x"
        )

    async def stream(
        self, messages: list[Message], system: str
    ) -> AsyncIterator[str]:
        raise NotImplementedError(
            "GPT-5.2 provider slot reservado. Activar en E1.x"
        )
        yield ""  # unreachable
