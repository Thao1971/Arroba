"""LLM Provider abstraction. Allows the rest of the codebase to depend on a
single Protocol regardless of the actual model behind it (Claude, GPT-5.2,
Mock, etc.). Selected at runtime via `LLM_PROVIDER` env."""
from .factory import get_llm_provider
from .provider import LLMProvider, Message

__all__ = ["LLMProvider", "Message", "get_llm_provider"]
