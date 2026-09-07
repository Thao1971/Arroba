"""Tests para `_enrich_disambiguation_with_financials` (punto 9, 2026-09-07).

Contexto: `/resultados` reutilizaba los candidatos de `disambiguation`
(pensados originalmente para el dropdown compacto del dock, sin financials)
para pintar filas de la tabla de resultados — de ahí que Facturación/EBITDA
salieran en blanco para queries como "servier" que resuelven a 1-5 candidatos
por nombre. Opción elegida con Daniel (C, de 3 evaluadas): NO tocar el
matching de `/resolve` (preciso y fiable) ni usar el léxico de `skills/search`
(el propio código documenta que falla con sectores en inglés/residuales
cortos) — en vez de eso, una única llamada a `skills/search` filtrada por
`master_company_ids` para traer financials de los candidatos ya resueltos.

Estos tests mockean `get_agency_tool_client()` directamente (mismo patrón que
`test_entities_investor.py`), sin pasar por el endpoint HTTP completo — la
función bajo test es pura respecto a I/O salvo esa única llamada.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.copilot import service as copilot_service
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolHTTPError,
)

pytestmark = pytest.mark.asyncio


def _fake_client(*, status_code: int = 200, json_body: dict | None = None, raises: Exception | None = None):
    client = MagicMock()
    if raises is not None:
        async def _raise(*_a, **_kw):
            raise raises
        client.request = _raise
        return client
    resp = MagicMock()
    resp.status_code = status_code
    resp.json = MagicMock(return_value=json_body or {})
    client.request = AsyncMock(return_value=resp)
    return client


def _candidate(master_id: str, cif: str, name: str, *, score: float = 0.9) -> dict:
    return {
        "master_id": master_id,
        "cif": cif,
        "legal_name": name,
        "cnae_section": "C",
        "province": "MADRID",
        "score": score,
    }


def _skills_search_payload(rows: list[dict]) -> dict:
    """Shape plano (`results` + `total`) — uno de los dos que ya acepta
    `_financial_search_results` para la respuesta de `skills/search`."""
    return {"results": rows, "total": len(rows)}


async def test_enrich_success_all_candidates_get_summary(monkeypatch):
    """Caso feliz: 2 candidatos resueltos, Intel devuelve financials para
    ambos vía `skills/search` filtrado por `master_company_ids`."""
    candidates = [
        _candidate("mc_servier", "B28184687", "LABORATORIOS SERVIER"),
        _candidate("mc_other", "B99999999", "SERVIER OTRA S.L.", score=0.7),
    ]
    rows = [
        {
            "master_id": "mc_servier", "cif": "B28184687", "name": "LABORATORIOS SERVIER",
            "cnae_section": "C", "city": "MADRID", "score": 1.0,
            "summary": {"revenue": 164_200_000, "ebitda": 18_500_000},
        },
        {
            "master_id": "mc_other", "cif": "B99999999", "name": "SERVIER OTRA S.L.",
            "cnae_section": "C", "city": "MADRID", "score": 1.0,
            "summary": {"revenue": 2_000_000, "ebitda": 300_000},
        },
    ]
    fake = _fake_client(status_code=200, json_body=_skills_search_payload(rows))
    monkeypatch.setattr(copilot_service, "get_agency_tool_client", lambda: fake)

    items = await copilot_service._enrich_disambiguation_with_financials(candidates)

    assert items is not None
    assert len(items) == 2
    assert items[0].master_company_id == "mc_servier"
    assert items[0].summary == {"revenue": 164_200_000, "ebitda": 18_500_000}
    assert items[1].master_company_id == "mc_other"
    assert items[1].summary == {"revenue": 2_000_000, "ebitda": 300_000}
    # La llamada real pide exactamente los ids resueltos, nada de léxico.
    fake.request.assert_awaited_once()
    _, kwargs = fake.request.call_args
    assert kwargs["json"]["query"] == ""
    assert kwargs["json"]["filters"]["master_company_ids"] == ["mc_servier", "mc_other"]


async def test_enrich_partial_missing_summary_stays_honest_dash(monkeypatch):
    """R15: si Intel no devuelve financials para uno de los candidatos (empresa
    real sin datos, no un fallo), esa fila se queda con `summary=None` — no se
    fabrica un dato ni se descarta la fila del resultado."""
    candidates = [
        _candidate("mc_servier", "B28184687", "LABORATORIOS SERVIER"),
        _candidate("mc_sin_datos", "B11111111", "EMPRESA SIN DATOS S.L.", score=0.6),
    ]
    rows = [
        {
            "master_id": "mc_servier", "cif": "B28184687", "name": "LABORATORIOS SERVIER",
            "cnae_section": "C", "city": "MADRID", "score": 1.0,
            "summary": {"revenue": 164_200_000, "ebitda": 18_500_000},
        },
        # mc_sin_datos no aparece en la respuesta de Intel (sin financials).
    ]
    fake = _fake_client(status_code=200, json_body=_skills_search_payload(rows))
    monkeypatch.setattr(copilot_service, "get_agency_tool_client", lambda: fake)

    items = await copilot_service._enrich_disambiguation_with_financials(candidates)

    assert items is not None
    assert len(items) == 2
    assert items[0].summary == {"revenue": 164_200_000, "ebitda": 18_500_000}
    assert items[1].master_company_id == "mc_sin_datos"
    assert items[1].name == "EMPRESA SIN DATOS S.L."
    assert items[1].cif == "B11111111"
    assert items[1].summary is None


async def test_enrich_returns_none_on_http_error(monkeypatch):
    """Fallo HTTP de Intel (4xx/5xx) → `None`, el caller sigue con el
    `disambiguation` sin enriquecer en vez de romper la búsqueda entera."""
    candidates = [_candidate("mc_servier", "B28184687", "LABORATORIOS SERVIER")]
    fake = _fake_client(status_code=500, json_body={})
    monkeypatch.setattr(copilot_service, "get_agency_tool_client", lambda: fake)

    items = await copilot_service._enrich_disambiguation_with_financials(candidates)

    assert items is None


async def test_enrich_returns_none_on_network_failure(monkeypatch):
    """Timeout/red caída (`AgencyToolHTTPError` propagado por `_intel_call_ff`)
    → `None`, mismo comportamiento degradado que un 5xx."""
    candidates = [_candidate("mc_servier", "B28184687", "LABORATORIOS SERVIER")]
    fake = _fake_client(raises=AgencyToolHTTPError(
        status_code=0, error_class="timeout", message="search_timeout_8s",
    ))
    monkeypatch.setattr(copilot_service, "get_agency_tool_client", lambda: fake)

    items = await copilot_service._enrich_disambiguation_with_financials(candidates)

    assert items is None


async def test_enrich_returns_none_when_no_candidates_have_master_id(monkeypatch):
    """Defensivo: si por lo que sea ningún candidato trae `master_id`, no se
    llama a Intel en absoluto (nada que pedir)."""
    fake = _fake_client(status_code=200, json_body={})
    monkeypatch.setattr(copilot_service, "get_agency_tool_client", lambda: fake)

    items = await copilot_service._enrich_disambiguation_with_financials([{"cif": "B123"}])

    assert items is None
    fake.request.assert_not_called()


async def test_enrich_accepts_workspace_shaped_payload(monkeypatch):
    """`skills/search` puede emitir shape `workspace.blocks[]` en vez del
    plano `results[]` (mismo doble-shape que ya acepta `_financial_search_results`
    más arriba en este módulo) — debe leerse igual de bien."""
    candidates = [_candidate("mc_servier", "B28184687", "LABORATORIOS SERVIER")]
    workspace_payload = {
        "workspace": {
            "blocks": [
                {
                    "type": "search_results",
                    "props": {
                        "query": "servier",
                        "total": 1,
                        "results": [
                            {
                                "master_id": "mc_servier", "cif": "B28184687",
                                "name": "LABORATORIOS SERVIER", "cnae_section": "C",
                                "city": "MADRID", "score": 1.0,
                                "summary": {"revenue": 164_200_000, "ebitda": 18_500_000},
                            }
                        ],
                    },
                }
            ]
        }
    }
    fake = _fake_client(status_code=200, json_body=workspace_payload)
    monkeypatch.setattr(copilot_service, "get_agency_tool_client", lambda: fake)

    items = await copilot_service._enrich_disambiguation_with_financials(candidates)

    assert items is not None
    assert len(items) == 1
    assert items[0].summary == {"revenue": 164_200_000, "ebitda": 18_500_000}
