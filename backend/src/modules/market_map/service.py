"""Market Map — proxies de solo lectura hacia Intel (mismo patron que
`copilot.intel_ficha_proxies`: cliente canonico + cap propio + degradacion
honesta + cache TTL en memoria).

Todos los endpoints de Intel consumidos aqui son `/api/v1/public/*` (sin
service-key ni JWT en Intel). Politica de error (R15): timeout o fallo
upstream -> `None` (funciones "detalle") o lista vacia (funciones "listado"),
nunca una excepcion sin capturar. El router decide como responder al front.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from src.modules.copilot.service import _intel_call_ff
from src.modules.intelligence_layer.providers.agency_tool.client import (
    get_agency_tool_client,
)

log = logging.getLogger(__name__)

# Cache mas larga que la de la ficha (900s vs 3600s de ficha): estos son
# agregados nacionales/territoriales que solo cambian cuando Intel re-sincroniza
# (no por accion del usuario), y varias secciones de la misma pantalla piden el
# mismo dato con distintos parametros en la misma carga de pagina.
_TTL_S: float = 900.0
_cache: dict[str, tuple[float, Any]] = {}

# Mismo cap que `copilot.intel_ficha_proxies` (por debajo del corte del edge
# de Emergent, ~8s) para responder siempre con vacio honesto antes del 502.
_TIMEOUT_S: float = 7.5

_METRIC_PATH: dict[str, str] = {
    "dynamism": "top-dynamic",
    "size": "largest",
    "growth": "fastest-growing",
    "activity": "most-active",
}


def _cache_get(key: str) -> Any | None:
    hit = _cache.get(key)
    if hit and (time.time() - hit[0]) < _TTL_S:
        return hit[1]
    return None


def _cache_put(key: str, value: Any) -> None:
    if value is not None:
        _cache[key] = (time.time(), value)


async def _get_json(path: str) -> dict[str, Any] | None:
    """GET canonico + parseo JSON. `None` en cualquier error/timeout (R15)."""
    try:
        resp = await asyncio.wait_for(
            _intel_call_ff(get_agency_tool_client().request("GET", path)),
            timeout=_TIMEOUT_S,
        )
    except Exception as exc:  # noqa: BLE001 - degradacion honesta (incl. timeout)
        log.warning("market_map.get_fail path=%s error=%s", path, exc)
        return None
    if resp.status_code >= 400:
        log.warning("market_map.http_%d path=%s", resp.status_code, path)
        return None
    return resp.json() if resp.content else None


async def _cached_get_json(key: str, path: str) -> dict[str, Any] | None:
    cached = _cache_get(key)
    if cached is not None:
        return cached
    res = await _get_json(path)
    _cache_put(key, res)
    return res


async def _post_json(path: str, body: dict[str, Any]) -> dict[str, Any] | None:
    """POST canonico (para los endpoints de Intel que solo aceptan POST, ej.
    signal-intelligence/sector). Mismo cap/degradacion que `_get_json`."""
    try:
        resp = await asyncio.wait_for(
            _intel_call_ff(get_agency_tool_client().request("POST", path, json=body)),
            timeout=_TIMEOUT_S,
        )
    except Exception as exc:  # noqa: BLE001 - degradacion honesta (incl. timeout)
        log.warning("market_map.post_fail path=%s error=%s", path, exc)
        return None
    if resp.status_code >= 400:
        log.warning("market_map.http_%d path=%s", resp.status_code, path)
        return None
    return resp.json() if resp.content else None


async def _cached_post_json(key: str, path: str, body: dict[str, Any]) -> dict[str, Any] | None:
    cached = _cache_get(key)
    if cached is not None:
        return cached
    res = await _post_json(path, body)
    _cache_put(key, res)
    return res


# ══════════════════════════════════════════
# Demografia nacional (cabecera KPIs + evolucion)
# ══════════════════════════════════════════

async def national_overview() -> dict[str, Any] | None:
    """KPIs nacionales: empresas activas / nuevas / cerradas / saldo neto."""
    return await _cached_get_json(
        "mm:national:overview", "/api/v1/public/business-demography/overview"
    )


async def national_history(months: int = 12) -> dict[str, Any] | None:
    """Series mensuales (meses/nuevas/cerradas) para el grafico de evolucion."""
    months = max(1, min(int(months), 36))
    return await _cached_get_json(
        f"mm:national:history:{months}",
        f"/api/v1/public/business-demography/history?limit={months}",
    )


# ══════════════════════════════════════════
# Territorio (geo-intelligence)
# ══════════════════════════════════════════

async def geo_territories(level: str, metric: str, limit: int) -> list[dict[str, Any]]:
    """Ranking de territorios (CCAA o provincia) por una de las 4 metricas."""
    path_seg = _METRIC_PATH.get(metric, "top-dynamic")
    res = await _cached_get_json(
        f"mm:geo:{level}:{metric}:{limit}",
        f"/api/v1/public/geo-intelligence/{path_seg}?level={level}&limit={limit}",
    )
    return (res or {}).get("territories") or []


async def geo_territory_detail(level: str, code: str) -> dict[str, Any] | None:
    """Ficha de un territorio concreto (ccaa/{code} incluye sus provincias)."""
    seg = "ccaa" if level == "ccaa" else "province"
    return await _cached_get_json(
        f"mm:geo:detail:{level}:{code}", f"/api/v1/public/geo-intelligence/{seg}/{code}"
    )


# ══════════════════════════════════════════
# Sector (sector-intelligence-v2)
# ══════════════════════════════════════════

async def sector_ranking(metric: str, level: str, limit: int) -> list[dict[str, Any]]:
    """Ranking de sectores (CNAE seccion/division/grupo) por una de las 4 metricas."""
    path_seg = _METRIC_PATH.get(metric, "top-dynamic")
    res = await _cached_get_json(
        f"mm:sector:{level}:{metric}:{limit}",
        f"/api/v1/public/sector-intelligence/{path_seg}?level={level}&limit={limit}",
    )
    return (res or {}).get("sectors") or []


async def sector_emerging(level: str = "section") -> list[dict[str, Any]]:
    """Sectores con senal `emerging_sector`/`sector_expansion`/`high_public_demand`.

    Real, pero a granularidad CNAE oficial (ej. "62 Programacion informatica")
    - no distingue IA/ML de Ciberseguridad de Cloud dentro de esa division.
    """
    res = await _cached_get_json(
        f"mm:sector:emerging:{level}", f"/api/v1/public/sector-intelligence/emerging?level={level}"
    )
    return (res or {}).get("sectors") or []


# ══════════════════════════════════════════
# Cruce sector x territorio (cross-intelligence)
# ══════════════════════════════════════════

async def cross_sectors_in(geo_level: str, geo_code: str, limit: int) -> list[dict[str, Any]]:
    """Que sectores impulsan un territorio (ej. "Sectores que impulsan Madrid")."""
    res = await _cached_get_json(
        f"mm:cross:sectors_in:{geo_level}:{geo_code}:{limit}",
        f"/api/v1/public/cross-intelligence/sectors-in/{geo_level}/{geo_code}?limit={limit}",
    )
    return (res or {}).get("sectors") or []


async def cross_territory_for(cnae_section: str, geo_level: str, limit: int) -> list[dict[str, Any]]:
    """Donde concentra un sector (oportunidad sector x territorio, comparador)."""
    cnae_section = (cnae_section or "").upper()
    res = await _cached_get_json(
        f"mm:cross:territory_for:{cnae_section}:{geo_level}:{limit}",
        f"/api/v1/public/cross-intelligence/territory-for/{cnae_section}?geo_level={geo_level}&limit={limit}",
    )
    return (res or {}).get("territories") or []



# ══════════════════════════════════════════
# Ficha sectorial (drill-down de un CNAE concreto)
# ══════════════════════════════════════════

async def sector_detail(cnae_code: str) -> dict[str, Any] | None:
    """Ficha completa de un CNAE (seccion/division/grupo): scores, breakdown real
    de actividad (contratacion publica/BORME/Iberinform), hijos en la jerarquia
    (divisiones de una seccion, grupos de una division) y, si es grupo, un
    preview de empresas reales."""
    cnae_code = (cnae_code or "").upper() if len(cnae_code or "") == 1 else (cnae_code or "")
    return await _cached_get_json(
        f"mm:sector:detail:{cnae_code}", f"/api/v1/public/sector-intelligence/detail/{cnae_code}"
    )


async def sector_companies(cnae_code: str, limit: int, offset: int) -> dict[str, Any] | None:
    """Empresas reales (universo ya ingerido por ARROBA) de un CNAE, ordenadas
    por facturacion — "empresas destacadas". Paginado; ver `data_caveat` de la
    respuesta (no es lo mismo que `active_companies` del sector, que es una
    estimacion nacional DIRCE redistribuida)."""
    cnae_code = (cnae_code or "").upper() if len(cnae_code or "") == 1 else (cnae_code or "")
    return await _cached_get_json(
        f"mm:sector:companies:{cnae_code}:{limit}:{offset}",
        f"/api/v1/public/sector-intelligence/detail/{cnae_code}/companies?limit={limit}&offset={offset}",
    )


async def sector_signals(cnae_code: str, cnae_level: str, limit: int) -> dict[str, Any] | None:
    """Radar de senales del sector (signal-intelligence, real): analiza en vivo
    las empresas del universo ARROBA en este CNAE y agrega sus senales activas.
    Nivel `section` -> `cnae_section`; `division`/`group` -> `cnae_code`
    (contrato de Intel exige uno u otro, no ambos)."""
    cnae_code = (cnae_code or "").upper() if cnae_level == "section" else (cnae_code or "")
    body: dict[str, Any] = {"limit": max(1, min(int(limit), 50))}
    if cnae_level == "section":
        body["cnae_section"] = cnae_code
    else:
        body["cnae_code"] = cnae_code
    return await _cached_post_json(
        f"mm:sector:signals:{cnae_level}:{cnae_code}:{limit}",
        "/api/v1/signal-intelligence/sector",
        body,
    )
