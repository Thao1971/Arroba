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

# HARDENING-038f (2026-09-17 · Daniel opción b) · Mismo patrón background+polling
# que `market_reading` (commit 5861634) aplicado a `market_analysis`. Razón:
# Intel `/api/v1/recommendation-intelligence/comparables` tarda de forma
# consistente 11-14s (verificado con 3 muestras/CIF · Servier, JOCA, GESTEC,
# IUSTIME) y el cap propio del proxy `_FICHA_TIMEOUT_S=7.5s` cancelaba SIEMPRE
# la coroutine → `recs=[]` → pipeline degradado a `companies=1, comparables=[]`.
# Los otros 2 motores del pipeline (resolve · summary) son rápidos (<2s), pero
# el eslabón lento arrastraba al conjunto. Solución: mover TODO el pipeline al
# background con TASK_ANALYSIS_TIMEOUT_S=25s (dentro del pod, fuera del edge 8s)
# y devolver `pending` en el primer hit del cliente. Contrato final:
#     · `{"anchor_id": <id>, "companies":[...], "comparables":[...], "status":"ready"}`
#     · `{"anchor_id": None,  "companies":[],   "comparables":[],   "status":"pending"}`
#     · `{"anchor_id": None,  "companies":[],   "comparables":[],   "status":"unavailable"}`
# TTLs simétricos a market_reading (READY 1h, UNAVAILABLE/TRANSIENT 5min).
TASK_ANALYSIS_TIMEOUT_S: float = 25.0
CACHE_TTL_ANALYSIS_READY: float = 3600.0
CACHE_TTL_ANALYSIS_UNAVAILABLE: float = 300.0
CACHE_TTL_ANALYSIS_TRANSIENT: float = 300.0

_ANALYSIS_MISS = object()
# entry shape: (stored_at, ttl_s, value_dict)
_analysis_cache: dict[str, tuple[float, float, dict[str, Any]]] = {}
_inflight_analysis: dict[str, asyncio.Task[None]] = {}


def _analysis_key(cif: str, limit: int) -> str:
    return f"{cif}:{limit}"


def _analysis_cache_get(key: str) -> Any:
    hit = _analysis_cache.get(key)
    if hit and (time.time() - hit[0]) < hit[1]:
        return hit[2]
    return _ANALYSIS_MISS


def _analysis_cache_put(key: str, value: dict[str, Any], ttl: float) -> None:
    _analysis_cache[key] = (time.time(), ttl, value)


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


# HARDENING-038e (2026-09-17) · Nueva pestaña "Análisis Estratégico" — read-only.
# Consume 3 motores de Intel YA en producción (resolve + comparables +
# company-taxonomy/summary) y los normaliza al modelo que pinta <MercadoTab>:
# revenue/ebitda en M€, growth en %, quality_score = arroba_score (0-100).
# NO toca `market_reading()` — la narrativa diferida y esta lectura analítica
# son features independientes con TTL y contrato propios.


def _eur_to_meur(v: Any) -> float | None:
    """Iberinform guarda facturación/EBITDA en euros; la pestaña los pinta en M€."""
    if v is None:
        return None
    try:
        return round(float(v) / 1_000_000, 3)
    except (TypeError, ValueError):
        return None


async def _post_json_analysis(path: str, body: dict[str, Any]) -> dict[str, Any] | None:
    """POST canónico con cap AMPLIADO (TASK_ANALYSIS_TIMEOUT_S=25s) — SOLO usar
    dentro del background task de `market_analysis`, JAMÁS en el request path
    que atraviesa el edge (~8s). El `_intel_call_ff` interno del cliente sigue
    aplicando (fail-fast propio del wrapper); esta función solo eleva el techo
    superior de espera.
    """
    try:
        resp = await asyncio.wait_for(
            get_agency_tool_client().request("POST", path, json=body),
            timeout=TASK_ANALYSIS_TIMEOUT_S,
        )
    except Exception as exc:  # noqa: BLE001 — degradación honesta (incl. timeout)
        log.warning("copilot.market_analysis.post_fail path=%s error=%s", path, exc)
        return None
    if resp.status_code >= 400:
        log.warning(
            "copilot.market_analysis.http_%d path=%s", resp.status_code, path
        )
        return None
    return resp.json() if resp.content else None


async def _fetch_analysis_async(cif: str, limit: int) -> None:
    """Background task del análisis estratégico. Corre DENTRO del pod, así que
    puede esperar los 11-14s que Intel necesita para `recommendation-intelligence/
    comparables` sin quemar el edge. Mismo patrón que `_fetch_market_async`
    (commit 5861634): `finally` limpia `_inflight_analysis[cif]` siempre.

    Política de caché al terminar:
        · éxito con `companies >= 1` → `{status:"ready"}` + TTL 1h
        · éxito con `companies == 0`  → `{status:"unavailable"}` + TTL 5min
        · error/timeout total         → `{status:"unavailable"}` + TTL 5min (TRANSIENT)
    """
    key = _analysis_key(cif, limit)
    try:
        resolved = await _post_json_analysis(
            "/api/v2/company-intelligence/resolve", {"cif": cif, "limit": 1}
        )
        if resolved is None:
            _analysis_cache_put(
                key,
                {"anchor_id": None, "companies": [], "comparables": [], "status": "unavailable"},
                ttl=CACHE_TTL_ANALYSIS_TRANSIENT,
            )
            return
        matches = resolved.get("matches") or []
        if not matches:
            _analysis_cache_put(
                key,
                {"anchor_id": None, "companies": [], "comparables": [], "status": "unavailable"},
                ttl=CACHE_TTL_ANALYSIS_UNAVAILABLE,
            )
            return
        anchor = matches[0]
        anchor_id = anchor.get("master_id")
        if not anchor_id:
            _analysis_cache_put(
                key,
                {"anchor_id": None, "companies": [], "comparables": [], "status": "unavailable"},
                ttl=CACHE_TTL_ANALYSIS_UNAVAILABLE,
            )
            return

        comp = await _post_json_analysis(
            "/api/v1/recommendation-intelligence/comparables",
            {"identifier": anchor_id, "limit": limit},
        )
        recs = (comp or {}).get("recommendations") or []

        name_by: dict[str, str] = {}
        score_by: dict[str, float] = {}
        order: list[str] = [anchor_id]
        if anchor.get("legal_name"):
            name_by[anchor_id] = anchor["legal_name"]
        for r in recs:
            cand = r.get("candidate") or {}
            mid = cand.get("master_id")
            if not mid or mid == anchor_id:
                continue
            if mid not in name_by and cand.get("name"):
                name_by[mid] = cand["name"]
            if r.get("score") is not None:
                score_by[mid] = r["score"]
            if mid not in order:
                order.append(mid)

        summ_resp = await _post_json_analysis(
            "/api/v1/company-taxonomy/summary", {"master_ids": order}
        )
        summaries = (summ_resp or {}).get("summaries") or {}

        companies: list[dict[str, Any]] = []
        for mid in order:
            s = summaries.get(mid) or {}
            rev = s.get("revenue")
            q = s.get("arroba_score")
            if rev is None or q is None:
                continue
            growth = s.get("growth_pct")
            province = anchor.get("province") if mid == anchor_id else s.get("city")
            companies.append(
                {
                    "master_id": mid,
                    "name": name_by.get(mid) or mid,
                    "category": s.get("activity_label") or "—",
                    "province": province,
                    "revenue": _eur_to_meur(rev),
                    "ebitda": _eur_to_meur(s.get("ebitda")),
                    "employees": s.get("employees") or 0,
                    "quality_score": q,
                    "growth": None if growth is None else round(growth * 100, 1),
                }
            )

        if not any(c["master_id"] == anchor_id for c in companies):
            _analysis_cache_put(
                key,
                {"anchor_id": None, "companies": [], "comparables": [], "status": "unavailable"},
                ttl=CACHE_TTL_ANALYSIS_UNAVAILABLE,
            )
            return

        present = {c["master_id"] for c in companies}
        comparables_out = [
            {"master_id": mid, "name": name_by.get(mid) or mid, "score": score_by.get(mid)}
            for mid in order
            if mid != anchor_id and mid in present
        ]

        _analysis_cache_put(
            key,
            {
                "anchor_id": anchor_id,
                "companies": companies,
                "comparables": comparables_out,
                "status": "ready",
            },
            ttl=CACHE_TTL_ANALYSIS_READY,
        )
    except asyncio.CancelledError:
        _analysis_cache_put(
            key,
            {"anchor_id": None, "companies": [], "comparables": [], "status": "unavailable"},
            ttl=CACHE_TTL_ANALYSIS_TRANSIENT,
        )
        raise
    except Exception as exc:  # noqa: BLE001 — degradación honesta
        log.warning(
            "copilot.market_analysis.fetch_unexpected cif=%s error=%s", cif, exc
        )
        _analysis_cache_put(
            key,
            {"anchor_id": None, "companies": [], "comparables": [], "status": "unavailable"},
            ttl=CACHE_TTL_ANALYSIS_TRANSIENT,
        )
    finally:
        _inflight_analysis.pop(key, None)


async def market_analysis(cif: str, limit: int = 20) -> dict[str, Any]:
    """Análisis estratégico de mercado (READ-ONLY · contrato ampliado).

    Devuelve SIEMPRE un dict con `status`. Frontend hace polling limitado
    mientras `status === 'pending'`:
        · `{"anchor_id":..., "companies":[...], "comparables":[...], "status":"ready"}`
        · `{"anchor_id": None, "companies":[], "comparables":[], "status":"pending"}`
        · `{"anchor_id": None, "companies":[], "comparables":[], "status":"unavailable"}`

    El pipeline (resolve + recommendation/comparables + company-taxonomy/summary)
    corre en background con TASK_ANALYSIS_TIMEOUT_S=25s (fuera del edge 8s),
    porque `recommendation-intelligence/comparables` de Intel tarda 11-14s de
    forma consistente y antes se perdía por el cap `_FICHA_TIMEOUT_S=7.5s`.
    Tasks deduplicadas por `(cif, limit)`. TTLs diferenciados por tipo (READY 1h,
    UNAVAILABLE/TRANSIENT 5min).
    """
    cif = _cif(cif)
    key = _analysis_key(cif, limit)
    cached = _analysis_cache_get(key)
    if cached is _ANALYSIS_MISS:
        if key not in _inflight_analysis:
            _inflight_analysis[key] = asyncio.create_task(
                _fetch_analysis_async(cif, limit)
            )
        return {
            "anchor_id": None,
            "companies": [],
            "comparables": [],
            "status": "pending",
        }
    return cached

