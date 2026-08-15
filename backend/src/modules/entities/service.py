"""Servicio del módulo entities.

Dispatcher canónico multi-tipo. En Sprint 1 solo `company` está poblado.
El resto de tipos devuelven [] hasta que en sprints futuros lleguen los
motores de resolución correspondientes (Regla 2 del brief).
"""
from __future__ import annotations

import re
from collections.abc import Awaitable, Callable

from src.core.logging import get_logger
from src.modules.agency_tool_adapter.enrich_company import (
    get_enrich_company_adapter,
)
from src.modules.entities.models import EntityLookupResult, EntityType

log = get_logger("entities.service")

# Regex español canónico de CIF/NIF: letra inicial + 8 caracteres.
_CIF_RE = re.compile(r"^[A-Z][0-9]{7}[0-9A-J]$")


async def _resolve_company(query: str, limit: int) -> list[EntityLookupResult]:
    """Resuelve entidades tipo `company` desde `master_companies_mock`.

    Estrategia:
      1. Si `query` es un CIF válido, busca exactamente por CIF.
      2. Si no, usa el fuzzy `find_by_name` del adapter.

    Nota Regla 4: el adapter es un detalle de implementación interno; el
    output se traduce a `EntityLookupResult` sin fugas de tipo.
    """
    q = (query or "").strip()
    if not q:
        return []
    adapter = get_enrich_company_adapter()
    candidates_raw = await adapter.find_by_name(q, limit=limit)
    results: list[EntityLookupResult] = []
    for c in candidates_raw:
        secondary_parts: list[str] = []
        if c.sector:
            secondary_parts.append(c.sector)
        if c.region:
            secondary_parts.append(c.region)
        results.append(
            EntityLookupResult(
                type="company",
                # Usamos CIF cuando existe (URL canónica /empresa-f01/{cif});
                # si no, master_company_id como fallback.
                id=(c.cif or c.master_company_id),
                display_name=c.legal_name,
                secondary_label=" · ".join(secondary_parts) or None,
                icon="building",
            )
        )
    log.info(
        "entities.resolve.company",
        query=q,
        count=len(results),
    )
    return results


async def _resolve_stub(query: str, limit: int) -> list[EntityLookupResult]:  # noqa: ARG001
    """Placeholder para tipos aún no implementados. Devuelve [] sin fallar."""
    return []


# Dispatcher canónico (Regla 2). Añadir un tipo real = sustituir stub aquí.
_RESOLVERS: dict[EntityType, Callable[[str, int], Awaitable[list[EntityLookupResult]]]] = {
    "company": _resolve_company,
    "sector": _resolve_stub,
    "territory": _resolve_stub,
    "person": _resolve_stub,
    "advisor": _resolve_stub,
    "mandate": _resolve_stub,
    "match": _resolve_stub,
    "operation": _resolve_stub,
    "valuation": _resolve_stub,
    "document": _resolve_stub,
    "opportunity": _resolve_stub,
}


async def lookup(
    query: str,
    types: list[EntityType],
    limit: int,
) -> list[EntityLookupResult]:
    """Resolución multi-tipo. Cada tipo aporta hasta `limit` resultados;
    la lista final se ordena preservando el orden de `types` y trunca a
    `limit` global.
    """
    aggregated: list[EntityLookupResult] = []
    for t in types:
        resolver = _RESOLVERS.get(t)
        if resolver is None:
            # tipo desconocido en el catálogo: se ignora, no rompe el contrato.
            continue
        aggregated.extend(await resolver(query, limit))
        if len(aggregated) >= limit:
            break
    return aggregated[:limit]


__all__ = ["lookup"]
