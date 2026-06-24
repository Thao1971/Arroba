"""Backend intent router — mirror of the TS one in `/app/frontend/src/lib/orchestrator/route-intent.ts`.

Kept on the backend so `POST /api/workspaces/{id}/messages` can decide which
Skill to dispatch from the raw query without trusting client-side hints.

The verb lists MUST stay in sync with `frontend/src/lib/orchestrator/route-intent.ts`.
A pytest checks the parity between both at every CI run (see test_intent_router_parity.py).
"""
from __future__ import annotations

import re
import unicodedata
from typing import Literal

SkillIntentKind = Literal["search", "analyze", "value", "recommend"]


# Each verb prefix MUST be already normalised: NFD + diacritic-stripped + lower
# + single-spaced. Longest prefix wins inside each group.
VERB_PREFIXES: dict[SkillIntentKind, list[str]] = {
    "analyze": [
        "analiza la empresa",
        "analizar la empresa",
        "analisame la empresa",
        "analizame la empresa",
        "ficha de la empresa",
        "tell me about",
        "analyze the company",
        "analiza",
        "analizar",
        "analisame",
        "analizame",
        "analyze",
        "ficha de",
        "ficha sobre",
        "informacion de",
        "informacion sobre",
    ],
    "value": [
        "cuanto vale la empresa",
        "cuanto vale",
        "valora la empresa",
        "valorar la empresa",
        "valorame la empresa",
        "valoracion de",
        "valoracion indicativa de",
        "how much is",
        "value the company",
        "valora",
        "valorar",
        "valorame",
        "value",
    ],
    "recommend": [
        "recomienda empresas similares a",
        "recomienda empresas parecidas a",
        "companias similares a",
        "companias parecidas a",
        "empresas similares a",
        "empresas parecidas a",
        "similares a",
        "parecidas a",
        "similar to",
        "companies similar to",
        "oportunidades en",
        "oportunidades de",
        "empresas en",
        "empresas de",
        "companias en",
        "companias de",
        "recomienda",
        "recomiendame",
        "que recomiendas",
        "recommend",
    ],
    "search": [],
}

INTENT_ORDER: list[SkillIntentKind] = ["analyze", "value", "recommend"]


def normalize(s: str) -> str:
    text = unicodedata.normalize("NFD", s or "")
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", text.lower().strip())


def detect_verb_intent(text_norm: str) -> SkillIntentKind | None:
    """Return the matching skill kind or None for plain search."""
    for kind in INTENT_ORDER:
        for prefix in VERB_PREFIXES[kind]:
            if text_norm == prefix or text_norm.startswith(prefix + " "):
                return kind
    return None


def route_intent(query: str) -> SkillIntentKind:
    """Default to `search` when no verb matches (ambiguous queries → search,
    by design — Recommend's sub-router handles its own ambiguity)."""
    text = (query or "").strip()
    if not text:
        return "search"
    n = normalize(text)
    verb = detect_verb_intent(n)
    return verb or "search"


__all__ = [
    "INTENT_ORDER",
    "SkillIntentKind",
    "VERB_PREFIXES",
    "detect_verb_intent",
    "normalize",
    "route_intent",
]
