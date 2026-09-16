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

import asyncio
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

# HARDENING-038c · cap de tiempo PROPIO de la ficha, por DEBAJO del corte del
# edge (~8s en Emergent: los motores IA lentos hacían que `_intel_call_ff` (8s)
# devolviese su vacío honesto justo a los ~8.0s y el edge cortaba a ~8.1s → 502
# HTML). Con 7.5s la app SIEMPRE responde antes del edge: rollup (~6.5s) pasa;
# comité/mercado/sucesión (si Intel tarda más) degradan a vacío limpio (JSON),
# nunca 502. El "mostrar dato" de esos 3 depende de que Intel los sirva <7.5s
# (precomputar/cachear la narrativa IA) — HARDENING-038d, lado Intel.
_FICHA_TIMEOUT_S: float = 7.5

# HARDENING-038d (rev 2026-09-16) · Intel expuso su contrato definitivo en
# `/api/v1/company/{cif}/market` en Preview (aún NO en producción):
#     · reading_status="pending"     + reading_ai=null  → generación en curso
#     · reading_status="ready"       + reading_ai=<txt> → narrativa lista
#     · reading_status="unavailable" + reading_ai=null  → sin contexto suficiente
#
# La primera generación de Claude tarda hasta ~30s. `_intel_call_ff` cortaría
# a 8s → nunca veríamos `ready` con una única llamada. Por eso el background
# task hace un LOOP INTERNO: pide `/market` cada 3s durante hasta 27s totales,
# saliendo en cuanto Intel emite `ready` o `unavailable`. Cada llamada HTTP
# individual respeta el cap de 8s del wrapper canónico.
#
# La caché ahora guarda el DICT COMPLETO {reading, status} + su TTL específico
# (antes solo `str|None` con un TTL global), porque los TTLs son distintos por
# tipo de entrada:
#     · READY       → 1h  (narrativa cara de recomputar)
#     · UNAVAILABLE → 5min (Intel puede empezar a tener contexto)
#     · TRANSIENT   → 5min (errores HTTP/timeout del task, no rebombear pero
#                           tampoco dejar la ficha coja durante 1h)
POLL_INTERVAL_S: float = 3.0
TASK_TOTAL_TIMEOUT_S: float = 27.0
PER_HTTP_TIMEOUT_S: float = 8.0
CACHE_TTL_READY: float = 3600.0
CACHE_TTL_UNAVAILABLE: float = 300.0
CACHE_TTL_TRANSIENT: float = 300.0

_MARKET_MISS = object()
# entry shape: (stored_at, ttl_s, value_dict)
_market_cache: dict[str, tuple[float, float, dict[str, Any]]] = {}
_inflight_market: dict[str, asyncio.Task[None]] = {}


def _market_cache_get(cif: str) -> Any:
    """Devuelve `_MARKET_MISS` si no hay entrada o si expiró, o el dict cacheado.

    Distingue "no consultado / TTL expirado" (miss → dispara task) de
    "consultado con resultado conocido" (hit → devolvemos el dict tal cual).
    """
    hit = _market_cache.get(cif)
    if hit and (time.time() - hit[0]) < hit[1]:
        return hit[2]
    return _MARKET_MISS


def _market_cache_put(cif: str, value: dict[str, Any], ttl: float) -> None:
    """TTL parametrizable — no todos los estados aguantan lo mismo en caché."""
    _market_cache[cif] = (time.time(), ttl, value)

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
    """GET canónico + parseo JSON. Devuelve `None` en cualquier error/timeout.

    Doble cap: el propio de `_intel_call_ff` (8s) y `_FICHA_TIMEOUT_S` (7.5s, gana
    el menor) para responder ANTES del corte del edge. `except Exception` amplio
    a propósito (R15): cualquier fallo → vacío honesto, nunca propaga un 500/502.
    """
    try:
        resp = await asyncio.wait_for(
            _intel_call_ff(get_agency_tool_client().request("GET", path)),
            timeout=_FICHA_TIMEOUT_S,
        )
    except Exception as exc:  # noqa: BLE001 — degradación honesta (incl. timeout)
        log.warning("copilot.ficha_proxies.get_fail path=%s error=%s", path, exc)
        return None
    if resp.status_code >= 400:
        log.warning("copilot.ficha_proxies.http_%d path=%s", resp.status_code, path)
        return None
    return resp.json() if resp.content else None


async def _post_json(path: str, body: dict[str, Any]) -> dict[str, Any] | None:
    """POST canónico + cap propio de ficha (7.5s) + captura amplia (ver _get_json)."""
    try:
        resp = await asyncio.wait_for(
            _intel_call_ff(get_agency_tool_client().request("POST", path, json=body)),
            timeout=_FICHA_TIMEOUT_S,
        )
    except Exception as exc:  # noqa: BLE001 — degradación honesta (incl. timeout)
        log.warning("copilot.ficha_proxies.post_fail path=%s error=%s", path, exc)
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
        f"/api/v1/investment-intelligence/rollup-thesis?cnae_value={cnae}"  # Intel espera cnae_value (no cnae_code) — verificado Emergent 2026-08-17
    )
    _cache_put(key, res)
    return res


async def _fetch_market_async(cif: str) -> None:
    """Background task: poll interno a Intel `/market` hasta `ready`/`unavailable`.

    Intel V4 (Preview 2026-09-16) responde con `reading_status` en cada hit:
    `pending`|`ready`|`unavailable`. La primera generación de Claude puede
    tardar hasta ~30s, así que este task hace poll cada 3s durante hasta 27s
    totales — cada llamada HTTP individual respeta el cap de 8s del wrapper
    canónico, pero el task en su conjunto puede esperar mucho más porque
    corre DENTRO del pod (no atraviesa el edge).

    Política de caché al terminar:
        · `ready`      → dict + TTL 1h   (narrativa cara de recomputar)
        · `unavailable`→ dict + TTL 5min (Intel puede tener contexto pronto)
        · error/timeout total → dict `unavailable` + TTL 5min (no rebombear)

    El bloque `finally` garantiza que `_inflight_market[cif]` se limpia
    SIEMPRE (éxito, error o cancelación) — imprescindible para no bloquear
    futuros hits del mismo CIF.
    """
    loop = asyncio.get_event_loop()
    start = loop.time()
    last_error = False
    try:
        while (loop.time() - start) < TASK_TOTAL_TIMEOUT_S:
            try:
                resp = await asyncio.wait_for(
                    _intel_call_ff(
                        get_agency_tool_client().request(
                            "GET", f"/api/v1/company/{cif}/market"
                        )
                    ),
                    timeout=PER_HTTP_TIMEOUT_S,
                )
            except asyncio.CancelledError:
                raise
            except (asyncio.TimeoutError, AgencyToolHTTPError) as exc:
                # Error transitorio Intel — no reintentar dentro del task,
                # cachear TRANSIENT para no rebombear.
                log.warning(
                    "copilot.market_reading.fetch_fail cif=%s error=%s", cif, exc
                )
                last_error = True
                break
            except Exception as exc:  # noqa: BLE001 — defensivo
                log.warning(
                    "copilot.market_reading.fetch_unexpected cif=%s error=%s",
                    cif,
                    exc,
                )
                last_error = True
                break

            if resp is None or resp.status_code >= 400 or not resp.content:
                last_error = True
                break

            try:
                data = resp.json()
            except Exception as exc:  # noqa: BLE001 — parseo defensivo
                log.warning(
                    "copilot.market_reading.parse_fail cif=%s error=%s", cif, exc
                )
                last_error = True
                break

            if not isinstance(data, dict):
                last_error = True
                break

            status = data.get("reading_status")
            reading_ai = data.get("reading_ai")

            if status == "ready" and isinstance(reading_ai, str) and reading_ai.strip():
                _market_cache_put(
                    cif,
                    {"reading": reading_ai, "status": "ready"},
                    ttl=CACHE_TTL_READY,
                )
                return

            if status == "unavailable":
                _market_cache_put(
                    cif,
                    {"reading": None, "status": "unavailable"},
                    ttl=CACHE_TTL_UNAVAILABLE,
                )
                return

            if status == "pending":
                # Intel sigue generando: esperar 3s y reintentar dentro del task.
                await asyncio.sleep(POLL_INTERVAL_S)
                continue

            # Status desconocido / ausente: tratamos como error transitorio.
            log.warning(
                "copilot.market_reading.unknown_status cif=%s status=%r", cif, status
            )
            last_error = True
            break

        # Salida del bucle: por timeout total o por `last_error`.
        # En AMBOS casos cacheamos TRANSIENT (5min) — no rebombear pero permitir
        # reintentar antes de 1h. Diferencia con `unavailable` (Intel confirma
        # sin contexto): aquí no hay confirmación, solo se agotó el margen.
        if last_error:
            _market_cache_put(
                cif,
                {"reading": None, "status": "unavailable"},
                ttl=CACHE_TTL_TRANSIENT,
            )
        else:
            _market_cache_put(
                cif,
                {"reading": None, "status": "unavailable"},
                ttl=CACHE_TTL_TRANSIENT,
            )
    except asyncio.CancelledError:
        # Cancelación externa: cachear TRANSIENT y propagar tras el finally.
        _market_cache_put(
            cif,
            {"reading": None, "status": "unavailable"},
            ttl=CACHE_TTL_TRANSIENT,
        )
        raise
    finally:
        _inflight_market.pop(cif, None)


async def market_reading(cif: str) -> dict[str, Any]:
    """Lectura de mercado en prosa (Intel `/api/v1/company/{cif}/market`).

    Contrato ampliado y retrocompatible (`reading` sigue presente):
        · `{"reading": None, "status": "pending"}`     — task en marcha
        · `{"reading": "...", "status": "ready"}`      — narrativa cacheada
        · `{"reading": None, "status": "unavailable"}` — sin contexto o error

    Frontend hace polling limitado (max 10 intentos, 3s entre polls) mientras
    `status === 'pending'`. Cache TTLs diferenciados por tipo de entrada
    (ver constantes `CACHE_TTL_*`). Task deduplicada por CIF.
    """
    cif = _cif(cif)
    cached = _market_cache_get(cif)
    if cached is _MARKET_MISS:
        # No hemos consultado (o TTL expirado): disparar task si no hay uno
        # in-flight ya para este CIF. Devolver `pending` inmediato.
        if cif not in _inflight_market:
            _inflight_market[cif] = asyncio.create_task(_fetch_market_async(cif))
        return {"reading": None, "status": "pending"}
    # Hit: devolver el dict tal cual (ya trae `reading` y `status`).
    return cached
