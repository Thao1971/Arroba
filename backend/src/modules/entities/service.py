"""Servicio del módulo entities.

Dispatcher canónico multi-tipo. En Sprint 1 solo `company` está poblado.
El resto de tipos devuelven [] hasta que en sprints futuros lleguen los
motores de resolución correspondientes (Regla 2 del brief).
"""
from __future__ import annotations

import asyncio
import re
import time
import unicodedata
from collections.abc import Awaitable, Callable
from typing import Any

from src.core.logging import get_logger
from src.modules.agency_tool_adapter.enrich_company import (
    get_enrich_company_adapter,
)
from src.modules.entities.models import EntityLookupResult, EntityType
from src.modules.intelligence_layer.config import get_intelligence_settings
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolHTTPError,
    get_agency_tool_client,
)
# `investor` (CNMV) usa el mismo esquema Bearer que `mandates` — ver nota
# larga en `_resolve_investor`. Cliente DISTINTO del de arriba (X-API-Key).
from src.modules.mandates.client import (
    MandatesHTTPError,
    get_mandates_client,
)

log = get_logger("entities.service")

# Regex español canónico de CIF/NIF: letra inicial + 8 caracteres.
_CIF_RE = re.compile(r"^[A-Z][0-9]{7}[0-9A-J]$")

_INTEL_TIMEOUT_S = 8.0


async def _intel_call_ff(coro: Any) -> Any:
    """Mismo patrón fail-fast que `copilot/service.py::_intel_call_ff` — timeout
    duro de 8s sobre la llamada a Intel; si expira, se trata como cualquier
    otro fallo (el resolver degrada a `[]`, nunca inventa datos)."""
    try:
        return await asyncio.wait_for(coro, timeout=_INTEL_TIMEOUT_S)
    except asyncio.TimeoutError as exc:
        raise AgencyToolHTTPError(
            status_code=0, error_class="timeout",
            message=f"entities_timeout_{int(_INTEL_TIMEOUT_S)}s",
        ) from exc


def _norm(s: str) -> str:
    """Minúsculas + sin acentos, para comparar substrings de forma robusta."""
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.lower().strip()


# Catálogos de Intel para `sector`/`territory`: son listas fijas y pequeñas
# (21 secciones CNAE + 88 divisiones · 19 CCAA + 52 provincias), sin motor de
# búsqueda por texto del lado de Intel. Se cachean en proceso (TTL 1h) y se
# filtran aquí por substring — no hace falta pedirle nada nuevo a Intel.
_CATALOG_TTL_S = 3600.0
_cnae_catalog_cache: dict[str, Any] = {"data": None, "ts": 0.0}
_geo_catalog_cache: dict[str, Any] = {"data": None, "ts": 0.0}


async def _get_cnae_catalog() -> list[dict[str, Any]] | None:
    # Mismo gate que `copilot/service.py::execute_search`: en modo mock no
    # tocamos Intel — devolvemos None (→ el resolver degrada a []), nunca
    # datos inventados. Consistente con Regla R15 ("nunca pilotos").
    if get_intelligence_settings().agency_tool_mode != "real":
        return None
    now = time.monotonic()
    if _cnae_catalog_cache["data"] is not None and now - _cnae_catalog_cache["ts"] < _CATALOG_TTL_S:
        return _cnae_catalog_cache["data"]
    try:
        resp = await _intel_call_ff(
            get_agency_tool_client().request("GET", "/api/v1/public/cnae/catalog")
        )
        if resp.status_code >= 400:
            return None
        catalog = resp.json().get("catalog") or []
    except AgencyToolHTTPError as exc:
        log.warning("entities.cnae_catalog.failed", error=str(exc))
        return None
    _cnae_catalog_cache["data"] = catalog
    _cnae_catalog_cache["ts"] = now
    return catalog


async def _get_geo_catalog() -> list[dict[str, Any]] | None:
    if get_intelligence_settings().agency_tool_mode != "real":
        return None
    now = time.monotonic()
    if _geo_catalog_cache["data"] is not None and now - _geo_catalog_cache["ts"] < _CATALOG_TTL_S:
        return _geo_catalog_cache["data"]
    try:
        resp = await _intel_call_ff(
            get_agency_tool_client().request("GET", "/api/v1/public/geo-intelligence/catalog")
        )
        if resp.status_code >= 400:
            return None
        catalog = resp.json().get("catalog") or []
    except AgencyToolHTTPError as exc:
        log.warning("entities.geo_catalog.failed", error=str(exc))
        return None
    _geo_catalog_cache["data"] = catalog
    _geo_catalog_cache["ts"] = now
    return catalog


async def _resolve_sector(query: str, limit: int) -> list[EntityLookupResult]:
    """Resuelve entidades tipo `sector` contra el catálogo CNAE público de
    Intel (secciones → divisiones → grupos). Sin motor de búsqueda en Intel
    para esto: se trae el catálogo completo (cacheado) y se filtra aquí por
    substring, insensible a mayúsculas/acentos.
    """
    q = (query or "").strip()
    if not q:
        return []
    catalog = await _get_cnae_catalog()
    if not catalog:
        return []
    q_norm = _norm(q)
    results: list[EntityLookupResult] = []

    def _maybe_add(code: str, label: str, level: str, parent_label: str | None) -> bool:
        if not label or q_norm not in _norm(label):
            return len(results) >= limit
        results.append(
            EntityLookupResult(
                type="sector",
                id=f"cnae:{code}",
                display_name=label,
                secondary_label=parent_label or {"section": "Sección CNAE", "division": "División CNAE", "group": "Grupo CNAE"}.get(level),
                icon="grid",
            )
        )
        return len(results) >= limit

    for section in catalog:
        if _maybe_add(section.get("code", ""), section.get("label", ""), "section", None):
            return results[:limit]
        for division in section.get("divisions") or []:
            if _maybe_add(division.get("code", ""), division.get("label", ""), "division", section.get("label")):
                return results[:limit]
            for group in division.get("groups") or []:
                if _maybe_add(group.get("code", ""), group.get("label", ""), "group", division.get("label")):
                    return results[:limit]
    log.info("entities.resolve.sector", query=q, count=len(results))
    return results[:limit]


async def _resolve_territory(query: str, limit: int) -> list[EntityLookupResult]:
    """Resuelve entidades tipo `territory` contra el catálogo geográfico
    público de Intel (CCAA → provincias). Mismo patrón que `_resolve_sector`:
    catálogo fijo cacheado, filtrado por substring en Beta.

    FIX 2026-09-06 · Daniel: cuando la query coincide con una provincia (p.ej.
    "Sevilla"), se devuelven la provincia Y su comunidad autónoma como dos
    entidades independientes -- antes la CCAA solo aparecía como
    `secondary_label` de contexto, sin ser navegable por su cuenta. Ahora
    "Territorios" puede mostrar ambos niveles jerárquicos como chips
    separados. Se evita duplicar la misma CCAA si varias provincias
    coincidentes la comparten, o si la CCAA ya matcheó por nombre.
    """
    q = (query or "").strip()
    if not q:
        return []
    catalog = await _get_geo_catalog()
    if not catalog:
        return []
    q_norm = _norm(q)
    results: list[EntityLookupResult] = []
    added_ccaa_codes: set[str] = set()

    def _add_ccaa(code: str, label: str) -> None:
        if code in added_ccaa_codes:
            return
        results.append(
            EntityLookupResult(
                type="territory",
                id=f"ccaa:{code}",
                display_name=label,
                secondary_label="Comunidad autónoma",
                icon="map",
            )
        )
        added_ccaa_codes.add(code)

    for ccaa in catalog:
        code = ccaa.get("code", "")
        label = ccaa.get("label", "")
        if label and q_norm in _norm(label):
            _add_ccaa(code, label)
            if len(results) >= limit:
                return results[:limit]
        for province in ccaa.get("provinces") or []:
            p_label = province.get("label", "")
            if p_label and q_norm in _norm(p_label):
                _add_ccaa(code, label)
                if len(results) >= limit:
                    return results[:limit]
                results.append(
                    EntityLookupResult(
                        type="territory",
                        id=f"province:{province.get('code', '')}",
                        display_name=p_label,
                        secondary_label=label,
                        icon="map",
                    )
                )
                if len(results) >= limit:
                    return results[:limit]
    log.info("entities.resolve.territory", query=q, count=len(results))
    return results[:limit]


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


async def _resolve_investor(query: str, limit: int) -> list[EntityLookupResult]:
    """Resuelve entidades tipo `investor` contra el registro CNMV de Intel
    (gestoras de fondos: SGEIC/SGIIC/ESI/EAF) — `GET /api/v1/cnmv/entities?search=`.

    FIX 2026-08-24 (verificado en vivo contra Intel de producción): este
    endpoint exige `get_current_user` de Intel (JWT o Bearer API-key de su
    `db.api_keys`) — un esquema DISTINTO al `X-API-Key` de
    `AgencyToolClient`/`require_service_key` que usa `_get_cnae_catalog`/
    `_get_geo_catalog`. La primera versión de este resolver usaba
    `AgencyToolClient` por error y siempre devolvía 403.

    La clave Bearer que Beta ya tiene provisionada para el módulo `mandates`
    (`INTEL_MANDATES_BEARER_TOKEN`, ver `mandates/config.py`) resulta ser una
    API-key de cuenta de Intel válida para CUALQUIER ruta protegida por
    `get_current_user` — no solo `buyer-mandates` — porque Intel no la
    restringe por nombre/scope, solo por la cuenta a la que está asociada.
    Confirmado con una llamada real: `curl -H "Authorization: Bearer
    $INTEL_MANDATES_BEARER_TOKEN" .../api/v1/cnmv/entities?search=capital`
    → 200 con datos reales. No hace falta pedir una clave nueva a Intel —
    solo reutilizar `mandates.client.get_mandates_client()` en vez de
    `get_agency_tool_client()`.
    """
    q = (query or "").strip()
    if not q:
        return []
    if get_intelligence_settings().agency_tool_mode != "real":
        return []
    try:
        resp = await _intel_call_ff(
            get_mandates_client().request(
                "GET", "/api/v1/cnmv/entities", params={"search": q, "limit": limit}
            )
        )
        if resp.status_code >= 400:
            log.warning(
                "entities.investor.http_error",
                status=resp.status_code,
                query=q,
            )
            return []
        data = resp.json()
    except MandatesHTTPError as exc:
        log.warning("entities.investor.failed", error=str(exc), query=q)
        return []

    results: list[EntityLookupResult] = []
    for e in (data.get("entities") or [])[:limit]:
        entity_id = e.get("id") or e.get("entity_id")
        name = e.get("name")
        if not entity_id or not name:
            continue  # nunca inventamos un id/nombre — se descarta la fila
        results.append(
            EntityLookupResult(
                type="investor",
                id=str(entity_id),
                display_name=name,
                secondary_label=e.get("entity_type_label") or e.get("entity_type") or None,
                icon="briefcase",
            )
        )
    log.info("entities.resolve.investor", query=q, count=len(results))
    return results


# Dispatcher canónico (Regla 2). Añadir un tipo real = sustituir stub aquí.
_RESOLVERS: dict[EntityType, Callable[[str, int], Awaitable[list[EntityLookupResult]]]] = {
    "company": _resolve_company,
    "sector": _resolve_sector,
    "territory": _resolve_territory,
    "person": _resolve_stub,
    "advisor": _resolve_stub,
    "investor": _resolve_investor,
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
