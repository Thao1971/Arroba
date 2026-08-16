"""HARDENING-038 · Proxies Intel de la ficha (comité, sucesión, roll-up, mercado).

Refactorizado al cliente canónico `get_agency_tool_client()` + `_intel_call_ff`
(precedente REQ003/REQ004/REQ004b): retry / dual-key / semáforo / circuit
breaker heredados + fail-fast uniforme.

Política de error (R15 · empty honesto):
    · Timeout / `AgencyToolHTTPError` → `log.warning` + return `None`.
    · La UI degrada con `<Empty/>` / "En preparación" — nunca fabrica datos.

Caché TTL en memoria (`_TTL_S`) para amortiguar coste (los motores Intel son
caros). Sin persistencia — reinicio de pod vacía la caché (aceptable).

Estas funciones se exponen en `companies.router` como rutas JWT
`/api/companies/{cif}/{committee,succession,rollup,market-reading}` — la
service-key S2S NO viaja al navegador.
"""
from __future__ import annotations

import logging
import re
import time
from typing import Any

from src.modules.copilot.service import _intel_call_ff
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolHTTPError,
    get_agency_tool_client,
)

log = logging.getLogger(__name__)

# Los motores del comité + IA de sucesión pueden tardar más que el buscador
# (8s). No obstante el wrapper `_intel_call_ff` fija su propio cap (8s
# uniforme, precedente REQ003). Si Intel emite tiempos mayores, subir aquí
# se hace en HARDENING-038b tras spec.
_TTL_S: float = 3600.0  # 1h por resultado (caro de recomputar)
_cache: dict[str, tuple[float, Any]] = {}

# Lente del comité → perfil de comprador del motor `investment-decision/analyze`.
LENS_PROFILE: dict[str, str | None] = {
    "neutral": None,
    "buyer": "strategic",
    "investor": "private_equity",
}


def _cache_get(key: str) -> Any | None:
    hit = _cache.get(key)
    if hit and (time.time() - hit[0]) < _TTL_S:
        return hit[1]
    return None


def _cache_put(key: str, value: Any) -> None:
    if value is not None:
        _cache[key] = (time.time(), value)


def _cif(c: str) -> str:
    return re.sub(r"[\s.\-]", "", (c or "").upper())


async def _get_json(path: str) -> dict[str, Any] | None:
    """GET canónico + parseo JSON. Devuelve `None` en error HTTP/timeout."""
    try:
        resp = await _intel_call_ff(
            get_agency_tool_client().request("GET", path)
        )
    except AgencyToolHTTPError as exc:
        log.warning("copilot.ficha_proxies.upstream_error path=%s error=%s", path, exc)
        return None
    if resp.status_code >= 400:
        log.warning("copilot.ficha_proxies.http_%d path=%s", resp.status_code, path)
        return None
    return resp.json() if resp.content else None


async def _post_json(path: str, body: dict[str, Any]) -> dict[str, Any] | None:
    try:
        resp = await _intel_call_ff(
            get_agency_tool_client().request("POST", path, json=body)
        )
    except AgencyToolHTTPError as exc:
        log.warning("copilot.ficha_proxies.upstream_error path=%s error=%s", path, exc)
        return None
    if resp.status_code >= 400:
        log.warning("copilot.ficha_proxies.http_%d path=%s", resp.status_code, path)
        return None
    return resp.json() if resp.content else None


async def committee_analyze(cif: str, lens: str = "neutral") -> dict[str, Any] | None:
    """POST `investment-decision/analyze` con perfil según lente.

    Cacheado por `(cif, lens)`. `lens` debe validarse en la capa router
    (ver `companies.router`) antes de llegar aquí.
    """
    cif = _cif(cif)
    key = f"committee:{cif}:{lens}"
    cached = _cache_get(key)
    if cached is not None:
        return cached
    body: dict[str, Any] = {"cif": cif}
    prof = LENS_PROFILE.get(lens)
    if prof:
        body["buyer_profile"] = {"type": prof}
    res = await _post_json("/api/v1/investment-decision/analyze", body)
    _cache_put(key, res)
    return res


async def committee_export(decision_id: str, fmt: str = "pdf") -> dict[str, Any] | None:
    """GET del payload exportable de una decisión (acción de créditos).

    `decision_id` debe validarse en la capa router (regex alfanumérico).
    Sin caché: cada export puede ser distinto.
    """
    return await _get_json(
        f"/api/v1/investment-decision/decision/{decision_id}/export-payload?format={fmt}"
    )


async def succession_profile(cif: str) -> dict[str, Any] | None:
    """GET `signal-intelligence/succession-profile/{cif}`. Cacheado por cif."""
    cif = _cif(cif)
    key = f"succession:{cif}"
    cached = _cache_get(key)
    if cached is not None:
        return cached
    res = await _get_json(f"/api/v1/signal-intelligence/succession-profile/{cif}")
    _cache_put(key, res)
    return res


async def rollup_thesis(cif: str, cnae: str | None = None) -> dict[str, Any] | None:
    """GET `investment-intelligence/rollup-thesis` para el sector de la empresa.

    Si no llega el `cnae`, se resuelve por CIF vía `company-intelligence/resolve`.
    Cacheado por `cnae` (mismo sector → misma tesis).
    """
    cif = _cif(cif)
    if not cnae:
        resolved = await _post_json(
            "/api/v2/company-intelligence/resolve", {"cif": cif, "limit": 1}
        )
        matches = (resolved or {}).get("matches") or []
        if matches:
            cnae = matches[0].get("cnae_code") or matches[0].get("cnae_section")
    if not cnae:
        return None
    key = f"rollup:{cnae}"
    cached = _cache_get(key)
    if cached is not None:
        return cached
    res = await _get_json(
        f"/api/v1/investment-intelligence/rollup-thesis?cnae_code={cnae}"
    )
    _cache_put(key, res)
    return res


async def market_reading(cif: str) -> str | None:
    """Lectura de mercado en prosa (Intel `market.reading_ai`).

    Intel emite el string dentro del bloque `market` de `/ficha?section=market`;
    aquí se expone suelto para la nueva pestaña Mercado. Cacheado por cif.
    """
    cif = _cif(cif)
    key = f"market_reading:{cif}"
    cached = _cache_get(key)
    if cached is not None:
        return cached
    res = await _get_json(f"/api/v1/company/{cif}/ficha?section=market")
    reading = None
    if isinstance(res, dict):
        market = res.get("market") or {}
        reading = market.get("reading_ai") or market.get("reading")
    _cache_put(key, reading)
    return reading
