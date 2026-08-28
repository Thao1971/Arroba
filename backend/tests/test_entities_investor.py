"""Tests para el resolver `investor` de `entities/service.py`.

Contexto (2026-08-24): tipo nuevo, decisión de Daniel (ver ENTITY_MODEL.md
junto a la fila `investor`). Intel SÍ tiene búsqueda por texto real aquí
(`GET /api/v1/cnmv/entities?search=`).

FIX 2026-08-24: la primera versión usaba `get_agency_tool_client()`
(X-API-Key) y siempre devolvía 403 — ese endpoint de Intel exige
`get_current_user` (Bearer). Verificado en vivo contra Intel de producción
que la clave Bearer ya provisionada para `mandates`
(`INTEL_MANDATES_BEARER_TOKEN`) sirve también aquí (Intel no la restringe
por scope, solo por cuenta). El resolver ahora usa
`mandates.client.get_mandates_client()`. Estos tests mockean ESE cliente.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.entities import service
from src.modules.mandates.client import MandatesHTTPError


def _fake_client(*, status_code: int, json_body: dict | None = None, raises: Exception | None = None):
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


@pytest.fixture(autouse=True)
def _force_real_mode(monkeypatch):
    """El resolver solo llama a Intel en modo real — igual que sector/territory."""
    from src.modules.intelligence_layer import config as _il_config
    _il_config.get_intelligence_settings.cache_clear()
    monkeypatch.setenv("AGENCY_TOOL_MODE", "real")
    _il_config.get_intelligence_settings.cache_clear()
    yield
    _il_config.get_intelligence_settings.cache_clear()


@pytest.mark.asyncio
async def test_resolve_investor_happy_path(monkeypatch):
    # Shape real observado contra Intel de producción (curl en vivo, 2026-08-24):
    # entity_id (no `id`), entity_type + entity_type_label.
    body = {
        "entities": [
            {
                "entity_id": "cnmv_e1acb3e18ce7",
                "name": "4FOUNDERS CAPITAL SGEIC, S.A.",
                "entity_type": "sgeic",
                "entity_type_label": "Sociedad Gestora ECR (SGEIC)",
            },
            {
                "entity_id": "cnmv_2",
                "name": "Family Office Norte",
                "entity_type": "eaf",
                "entity_type_label": "Empresa de Asesoramiento Financiero (EAF)",
            },
        ]
    }
    monkeypatch.setattr(service, "get_mandates_client", lambda: _fake_client(status_code=200, json_body=body))
    results = await service._resolve_investor("capital", limit=10)
    assert len(results) == 2
    assert results[0].type == "investor"
    assert results[0].id == "cnmv_e1acb3e18ce7"
    assert results[0].display_name == "4FOUNDERS CAPITAL SGEIC, S.A."
    # Prefiere la etiqueta legible sobre el código crudo.
    assert results[0].secondary_label == "Sociedad Gestora ECR (SGEIC)"
    assert results[0].icon == "briefcase"


@pytest.mark.asyncio
async def test_resolve_investor_falls_back_to_raw_entity_type_without_label(monkeypatch):
    body = {"entities": [{"entity_id": "x1", "name": "Sin label", "entity_type": "esi"}]}
    monkeypatch.setattr(service, "get_mandates_client", lambda: _fake_client(status_code=200, json_body=body))
    results = await service._resolve_investor("x", limit=10)
    assert results[0].secondary_label == "esi"


@pytest.mark.asyncio
async def test_resolve_investor_auth_failure_degrades_to_empty(monkeypatch):
    """403/401 de Intel -> [] en vez de propagar el error (defensa en
    profundidad — no debería pasar ya con la clave correcta, pero si Intel
    revoca la key o cambia el esquema, nunca debe romper la búsqueda)."""
    monkeypatch.setattr(service, "get_mandates_client", lambda: _fake_client(status_code=403))
    results = await service._resolve_investor("meridia", limit=10)
    assert results == []


@pytest.mark.asyncio
async def test_resolve_investor_network_error_degrades_to_empty(monkeypatch):
    monkeypatch.setattr(
        service,
        "get_mandates_client",
        lambda: _fake_client(
            status_code=0,
            raises=MandatesHTTPError(status_code=0, error_class="network", message="boom"),
        ),
    )
    results = await service._resolve_investor("meridia", limit=10)
    assert results == []


@pytest.mark.asyncio
async def test_resolve_investor_skips_rows_without_id_or_name(monkeypatch):
    body = {"entities": [{"name": "Sin id"}, {"entity_id": "x1"}, {"entity_id": "x2", "name": "Válida"}]}
    monkeypatch.setattr(service, "get_mandates_client", lambda: _fake_client(status_code=200, json_body=body))
    results = await service._resolve_investor("x", limit=10)
    assert len(results) == 1
    assert results[0].id == "x2"


@pytest.mark.asyncio
async def test_resolve_investor_empty_query_returns_empty(monkeypatch):
    monkeypatch.setattr(service, "get_mandates_client", lambda: _fake_client(status_code=200, json_body={}))
    assert await service._resolve_investor("", limit=10) == []


@pytest.mark.asyncio
async def test_resolve_investor_mock_mode_never_calls_intel(monkeypatch):
    """Fuera de modo real, no debe llamar a Intel en absoluto."""
    from src.modules.intelligence_layer import config as _il_config
    _il_config.get_intelligence_settings.cache_clear()
    monkeypatch.setenv("AGENCY_TOOL_MODE", "mock")
    _il_config.get_intelligence_settings.cache_clear()

    called = {"n": 0}

    def _client():
        called["n"] += 1
        return _fake_client(status_code=200, json_body={})

    monkeypatch.setattr(service, "get_mandates_client", _client)
    results = await service._resolve_investor("meridia", limit=10)
    assert results == []
    assert called["n"] == 0
