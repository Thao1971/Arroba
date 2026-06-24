"""LLM Provider factory. Selects the concrete implementation from env settings.

Importing this module is cheap — concrete providers are imported lazily so a
missing SDK (e.g. openai for GPT-5.2) never blocks the rest of the app from
booting.
"""
from __future__ import annotations

from typing import Callable

from src.core.config import get_settings
from src.modules.copilot.llm.provider import LLMProvider

# Tests inject a provider via this override. Keep production code unaware of it.
_override: LLMProvider | None = None


def set_override(provider: LLMProvider | None) -> None:
    """Used ONLY by tests + tooling. Set to None to restore the env-driven one."""
    global _override
    _override = provider


_BUILDERS: dict[str, Callable[[], LLMProvider]] = {}


def _register(name: str, builder: Callable[[], LLMProvider]) -> None:
    _BUILDERS[name] = builder


def _build_claude() -> LLMProvider:
    from src.modules.copilot.llm.claude_provider import ClaudeProvider
    return ClaudeProvider()


def _build_gpt52() -> LLMProvider:
    from src.modules.copilot.llm.gpt52_provider import GPT52Provider
    return GPT52Provider()


def _build_mock() -> LLMProvider:
    from src.modules.copilot.llm.mock_provider import MockLLMProvider
    return MockLLMProvider()


_register("claude", _build_claude)
_register("gpt52", _build_gpt52)
_register("mock", _build_mock)


def get_llm_provider() -> LLMProvider:
    """Returns the configured provider. Honors `set_override(...)` first.
    Raises ValueError when env config points to an unknown provider name."""
    if _override is not None:
        return _override
    settings = get_settings()
    name = (settings.llm_provider or "claude").lower().strip()
    builder = _BUILDERS.get(name)
    if not builder:
        raise ValueError(
            f"LLM_PROVIDER '{settings.llm_provider}' no soportado. "
            f"Opciones válidas: {sorted(_BUILDERS.keys())}"
        )
    return builder()
