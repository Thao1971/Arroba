"""Tests para el BONUS de BUGFIX-2026-09-09 · Daniel (Punto 1):

`/resolve` ya devuelve `matches[i].summary` con revenue/ebitda/... Beta pasa
ese summary directamente al `SearchResultsBlock` en `/resultados`, sin una
segunda llamada de enrichment. Los tests cubren:

  (a) `pathname="/resultados"` + `matches[i].summary` presente
      → `results[i].summary` no-nulo con los mismos números
      → `results[i].master_company_id == matches[i].master_id` (el `mc_...`)
  (b) `pathname="/resultados"` + `matches[i].summary` ausente
      → `results[i].summary is None` (R15 — la UI pinta "—")
  (c) `pathname != "/resultados"` (caso dock)
      → devuelve `disambiguation` sin financials (regresión cero para el dock)

Mock strategy:
  - `_intel_call_ff` (módulo-nivel) se parchea para devolver un `Response`
    fake con el shape del `/resolve` (el único endpoint Intel que se toca
    en la rama #4). Beta llama `_intel_call_ff` DESDE la closure `_resolve`
    interna → parcheándolo a nivel módulo interceptamos esa llamada
    igualmente (no se puede parchear la closure directamente).
  - `_try_taxonomy` se parchea con `AsyncMock(return_value=None)` para
    que la rama #4 no reintente taxonomy y llegue directo al bloque
    disambiguation/enrichment que queremos ejercitar.
"""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.modules.copilot import service as copilot_service
from src.modules.copilot.models import (
    SearchSkillRequest,
    SkillContext,
)

pytestmark = pytest.mark.asyncio


_RESOLVE_MATCHES_WITH_SUMMARY = {
    "count": 2,
    "matches": [
        {
            "master_id": "mc_36c100bcee4a",
            "cif": "B28184687",
            "legal_name": "LABORATORIOS SERVIER",
            "cnae_section": "C",
            "province": "MADRID",
            "score": 1.0,
            "summary": {
                "revenue": 164200180.0,
                "ebitda": 18511020.0,
                "ebitda_margin": 0.1127,
                "growth_pct": 0.1173,
                "signal_score": 62,
                "signal_badge": "comprando",
                "employees": 346,
                "year": 2024,
                "city": "Madrid",
            },
        },
        {
            "master_id": "mc_aaa000bbb111",
            "cif": "B99999999",
            "legal_name": "SERVIER PHARMA IBÉRICA",
            "cnae_section": "G",
            "province": "BARCELONA",
            "score": 0.92,
            "summary": {
                "revenue": 8100000.0,
                "ebitda": 620000.0,
                "employees": 41,
                "year": 2024,
                "city": "Barcelona",
            },
        },
    ],
}

_RESOLVE_MATCHES_WITHOUT_SUMMARY = {
    "count": 2,
    "matches": [
        {
            "master_id": "mc_deadbeef1234",
            "cif": "A12345678",
            "legal_name": "EMPRESA SIN DATOS",
            "cnae_section": "M",
            "province": "SEVILLA",
            "score": 0.9,
            # summary omitido a propósito
        },
        {
            "master_id": "mc_deadbeef5678",
            "cif": "A87654321",
            "legal_name": "OTRA EMPRESA SIN DATOS",
            "cnae_section": "M",
            "province": "SEVILLA",
            "score": 0.87,
        },
    ],
}


def _mk_request(query: str, pathname: str) -> SearchSkillRequest:
    return SearchSkillRequest(
        query=query,
        context=SkillContext(pathname=pathname, locale="es", user_id=None),
    )


def _fake_response(json_payload: dict) -> SimpleNamespace:
    """Simula `httpx.Response` con lo mínimo que Beta usa: `status_code` +
    `json()` sincrónico. Beta no toca `.text`/`.headers` en este flujo."""
    return SimpleNamespace(status_code=200, json=lambda: json_payload)


async def test_resultados_summary_passthrough_from_resolve() -> None:
    """(a) `pathname=/resultados` + summary presente → results[0].summary poblado."""
    with patch.object(
        copilot_service,
        "_intel_call_ff",
        new=AsyncMock(return_value=_fake_response(_RESOLVE_MATCHES_WITH_SUMMARY)),
    ), patch.object(
        copilot_service, "_try_taxonomy", new=AsyncMock(return_value=None)
    ):
        req = _mk_request("servier", "/resultados")
        resp = await copilot_service._execute_search_real(req, "servier", "servier")

    assert resp.workspace is not None, "esperaba workspace no-nulo para /resultados"
    blocks = resp.workspace.blocks
    assert len(blocks) == 1
    block = blocks[0]
    assert block.type == "search_results"
    results = block.props.results
    assert len(results) == 2
    r = results[0]
    assert r.master_company_id == "mc_36c100bcee4a"
    assert r.name == "LABORATORIOS SERVIER"
    assert r.cif == "B28184687"
    assert r.summary is not None
    assert r.summary["revenue"] == 164200180.0
    assert r.summary["ebitda"] == 18511020.0
    assert r.summary["signal_score"] == 62


async def test_resultados_summary_missing_is_none_r15() -> None:
    """(b) `pathname=/resultados` + summary ausente → results[0].summary is None (R15)."""
    with patch.object(
        copilot_service,
        "_intel_call_ff",
        new=AsyncMock(return_value=_fake_response(_RESOLVE_MATCHES_WITHOUT_SUMMARY)),
    ), patch.object(
        copilot_service, "_try_taxonomy", new=AsyncMock(return_value=None)
    ):
        req = _mk_request("servier", "/resultados")
        resp = await copilot_service._execute_search_real(req, "servier", "servier")

    assert resp.workspace is not None
    results = resp.workspace.blocks[0].props.results
    assert len(results) == 2
    r = results[0]
    assert r.master_company_id == "mc_deadbeef1234"
    assert r.summary is None, "R15: sin summary → None, nunca se fabrica"


async def test_dock_no_pathname_returns_disambiguation() -> None:
    """(c) `pathname != /resultados` → disambiguation intacta, sin financials."""
    with patch.object(
        copilot_service,
        "_intel_call_ff",
        new=AsyncMock(return_value=_fake_response(_RESOLVE_MATCHES_WITH_SUMMARY)),
    ), patch.object(
        copilot_service, "_try_taxonomy", new=AsyncMock(return_value=None)
    ):
        # pathname distinto = simula el dock (no /resultados)
        req = _mk_request("servier", "/inicio")
        resp = await copilot_service._execute_search_real(req, "servier", "servier")

    assert resp.workspace is None, "el dock nunca debe montar workspace en rama #4 disambiguation"
    assert resp.disambiguation is not None
    assert len(resp.disambiguation) == 2
    item = resp.disambiguation[0]
    assert item.master_company_id == "mc_36c100bcee4a"
    assert item.cif == "B28184687"
    # DisambiguationItem no expone summary — comportamiento intocable del dock
    assert not hasattr(item, "summary") or getattr(item, "summary", None) is None
