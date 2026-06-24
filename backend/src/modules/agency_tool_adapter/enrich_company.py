"""EnrichCompanyAdapter — Boundary First abstraction.

The Copilot Skills (Analyze, Recommend, future Compare/Brief) depend on a
single canonical surface to fetch enriched company data:

  - `enrich(master_company_id, profile)` → EnrichedCompany
  - `find_by_name(name_query, limit)` → list[EnrichedCompany] (best-effort
    resolver used by Analyze when the user mentions a company by name).

Two implementations:

  - `MockEnrichCompanyAdapter` — reads from `master_companies_mock` collection
    (current E1.4 mode). Honors X-Source: mock at the router layer.
  - `RealEnrichCompanyAdapter` — stub raising NotImplementedError. Will be
    swapped to an HTTPX client against the Agency Tool real endpoint once
    REQ-001 lands.

Selected by env var `ENRICH_COMPANY_SOURCE=mock|real`. Tests can also inject
an adapter via `set_override(...)` (singleton override) to keep MockLLMProvider
behaviours composable with adapter behaviours per test.
"""
from __future__ import annotations

import re
import unicodedata
from typing import Any, Protocol, runtime_checkable

from src.core.config import get_settings
from src.core.database import get_db
from src.core.exceptions import NotFoundError
from src.core.logging import get_logger
from src.modules.agency_tool_adapter.models import (
    EnrichedCompany,
    Financials,
    Lineage,
    Profile,
)
from src.modules.agency_tool_adapter import service as adapter_service

log = get_logger("agency_tool_adapter.enrich_company")


@runtime_checkable
class EnrichCompanyAdapter(Protocol):
    """Canonical contract every implementation must honour."""

    name: str

    async def enrich(
        self, master_company_id: str, profile: Profile = "full"
    ) -> EnrichedCompany: ...

    async def find_by_name(
        self, name_query: str, limit: int = 5
    ) -> list[EnrichedCompany]: ...


class MockEnrichCompanyAdapter:
    """Reads from `master_companies_mock` collection. E1.4 default."""

    name = "mock"

    async def enrich(
        self, master_company_id: str, profile: Profile = "full"
    ) -> EnrichedCompany:
        # Delegate to the existing service so we keep one single read path.
        return await adapter_service.enrich_company(master_company_id, profile)

    async def find_by_name(
        self, name_query: str, limit: int = 5
    ) -> list[EnrichedCompany]:
        """Fuzzy lookup. Used by Skills to resolve a company name in a query.

        Strategy: normalise (NFD + lower + strip diacritics + collapse spaces),
        then score against name/legal_name/cif. Returns at most `limit`
        candidates sorted by score desc. Empty list when nothing matches.
        """
        q = _normalize(name_query)
        if not q:
            return []
        db = get_db()
        raw = await db.master_companies_mock.find({}, {"_id": 0}).to_list(length=500)
        scored: list[tuple[float, dict[str, Any]]] = [
            (s, d) for d in raw if (s := _score_name(q, d)) > 0
        ]
        scored.sort(key=lambda x: (-x[0], (x[1].get("legal_name") or "").lower()))
        log.info(
            "[MOCK] enrich.find_by_name",
            query=name_query,
            matched=len(scored),
        )
        out: list[EnrichedCompany] = []
        for _, doc in scored[:limit]:
            fin = Financials(**doc["financials"]) if doc.get("financials") else None
            out.append(
                EnrichedCompany(
                    master_company_id=doc["master_company_id"],
                    cif=doc.get("cif"),
                    legal_name=doc["legal_name"],
                    sector=doc.get("sector"),
                    region=doc.get("region"),
                    country=doc.get("country", "ES"),
                    financials=fin,
                    confidence=float(doc.get("confidence", 0.85)),
                    lineage=Lineage(doc.get("lineage", "normalized")),
                    valid_until=doc.get("valid_until"),
                    signals=[],
                    scores={},
                    recommendations=[],
                    source="mock",
                )
            )
        return out


class RealEnrichCompanyAdapter:
    """Slot reserved for the Agency Tool real endpoint (REQ-001).
    Today raises NotImplementedError so flipping `ENRICH_COMPANY_SOURCE=real`
    fails loudly until the client is wired up."""

    name = "real"

    async def enrich(
        self, master_company_id: str, profile: Profile = "full"
    ) -> EnrichedCompany:
        raise NotImplementedError(
            "RealEnrichCompanyAdapter pendiente de REQ-001. "
            "Cambia ENRICH_COMPANY_SOURCE=mock o entrega REQ-001."
        )

    async def find_by_name(
        self, name_query: str, limit: int = 5
    ) -> list[EnrichedCompany]:
        raise NotImplementedError(
            "RealEnrichCompanyAdapter.find_by_name pendiente de REQ-001."
        )


# ---------------------------------------------------------------------------
# Factory + test override
# ---------------------------------------------------------------------------
_override: EnrichCompanyAdapter | None = None


def set_override(adapter: EnrichCompanyAdapter | None) -> None:
    """Tests only. Pass None to restore env-driven default."""
    global _override
    _override = adapter


def get_enrich_company_adapter() -> EnrichCompanyAdapter:
    """Returns the configured adapter. Honors `set_override(...)` first."""
    if _override is not None:
        return _override
    settings = get_settings()
    mode = (settings.enrich_company_source or "mock").lower().strip()
    if mode == "real":
        return RealEnrichCompanyAdapter()
    if mode == "mock":
        return MockEnrichCompanyAdapter()
    # Unknown value → fail fast. Boundary First leaves no room for guesses.
    raise ValueError(
        f"ENRICH_COMPANY_SOURCE='{settings.enrich_company_source}' no soportado. "
        f"Valores válidos: mock, real."
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _normalize(s: str) -> str:
    """NFD lower strip diacritics + collapse whitespace. Mirrors the frontend's
    normalizeES so both sides match the same query string."""
    text = unicodedata.normalize("NFD", s or "")
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text


def _score_name(q_norm: str, doc: dict[str, Any]) -> float:
    """Score by name / legal_name match. CIF gives a separate strong boost.

    Exact name → 1.0; startswith → 0.85; substring → 0.7; word-overlap → 0.55.
    CIF substring (after stripping separators) → 0.92.
    """
    name = _normalize(str(doc.get("name") or doc.get("legal_name") or ""))
    legal = _normalize(str(doc.get("legal_name") or ""))
    cif = re.sub(r"[\s.\-]", "", _normalize(str(doc.get("cif") or "")))
    q_cif = re.sub(r"[\s.\-]", "", q_norm)
    if q_cif and len(q_cif) >= 3 and q_cif in cif:
        return 0.92
    candidate = legal or name
    if not candidate or not q_norm:
        return 0.0
    if candidate == q_norm:
        return 1.0
    if candidate.startswith(q_norm):
        return 0.85
    if q_norm in candidate:
        return 0.7
    # Word-overlap fallback: require ≥1 token of >=4 chars to overlap.
    cand_tokens = {t for t in candidate.split() if len(t) >= 4}
    q_tokens = {t for t in q_norm.split() if len(t) >= 4}
    if cand_tokens & q_tokens:
        return 0.55
    return 0.0


__all__ = [
    "EnrichCompanyAdapter",
    "MockEnrichCompanyAdapter",
    "RealEnrichCompanyAdapter",
    "get_enrich_company_adapter",
    "set_override",
]
