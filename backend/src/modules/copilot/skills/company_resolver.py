"""Resolver: given a free-text query (e.g. "analiza Kitchen Studio"), strip the
verb prefix and best-guess the company name. Returns up to N candidates from
the EnrichCompanyAdapter so the Skill can either pick one (single best match)
or ask the user to disambiguate (≥2 with similar score)."""
from __future__ import annotations

import re
import unicodedata

from src.modules.agency_tool_adapter.enrich_company import (
    EnrichCompanyAdapter,
    get_enrich_company_adapter,
)
from src.modules.agency_tool_adapter.models import EnrichedCompany

# Verbs we strip when resolving the company name candidate from a free-text
# query. Accent-insensitive. Order matters → longer phrases first.
_VERB_PREFIXES = [
    "analiza la empresa",
    "analizar la empresa",
    "analisame la empresa",
    "analizame la empresa",
    "analiza",
    "analizar",
    "analisame",
    "analizame",
    "valora la empresa",
    "valorar la empresa",
    "valorame la empresa",
    "valoramela empresa",
    "valora",
    "valorar",
    "valorame",
    "cuanto vale",
    "cuanto vale la empresa",
    "recomienda empresas similares a",
    "recomienda empresas parecidas a",
    "empresas similares a",
    "empresas parecidas a",
    "companias similares a",
    "companias parecidas a",
    "companies similar to",
    "similar to",
    "recomienda",
    "recomiendame",
    "que recomiendas",
    "informacion de",
    "informacion sobre",
    "ficha de",
    "ficha sobre",
    "tell me about",
    "analyze",
    "value",
]


def _normalize(s: str) -> str:
    text = unicodedata.normalize("NFD", s or "")
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", text.lower().strip())


def strip_verb_prefix(query: str) -> str:
    """Remove a leading verb prefix from the query, leaving the candidate name.

    Returns the trimmed remainder. If no prefix is detected, returns the
    original (trimmed) string.
    """
    q = (query or "").strip()
    q_norm = _normalize(q)
    # Sort by length desc so multiword phrases win over single-word ones.
    for prefix in sorted(_VERB_PREFIXES, key=len, reverse=True):
        p_norm = _normalize(prefix)
        if q_norm.startswith(p_norm):
            # Slice the original string by the length of the matching prefix in
            # the normalised view; close enough for short prefixes (we never
            # introduce/remove characters during normalisation other than
            # diacritic marks which never appear in our verb list).
            cut = len(prefix)
            tail = q[cut:].strip()
            # Cleanup common joiners.
            tail = re.sub(r"^[\s,:;?¿!¡\-—]+", "", tail)
            return tail
    return q


async def resolve_company(
    query: str,
    *,
    adapter: EnrichCompanyAdapter | None = None,
    limit: int = 5,
) -> tuple[str, list[EnrichedCompany]]:
    """Resolve the company name candidate from a free-text query.

    Returns `(name_candidate, matches)`:
      - `name_candidate` is the text we believe identifies the company.
      - `matches` is the list of EnrichedCompany hits sorted by relevance.
    """
    name_candidate = strip_verb_prefix(query)
    adapter = adapter or get_enrich_company_adapter()
    if not name_candidate:
        return ("", [])
    matches = await adapter.find_by_name(name_candidate, limit=limit)
    return (name_candidate, matches)


__all__ = ["resolve_company", "strip_verb_prefix"]
