"""Tests unitarios del `ResolveProvider` — Sprint F0.2.

Cubre:
  * `AgencyToolResolveProvider` mapea el response externo `matches[]` al contrato
    `ResolveResult`.
  * `count=0` → `ResolveNotFoundError`.
  * Errores del proveedor (401/500) mapean a `ResolveProviderError`.
  * `cif_exact` con `score<1.0` emite warning pero no bloquea.
  * `MockResolveProvider` resuelve desde `master_companies_mock`.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.intelligence_layer.interfaces.resolve import (
    ResolveNotFoundError,
    ResolveProviderError,
    ResolveResult,
)
from src.modules.intelligence_layer.providers.agency_tool.resolve import (
    AgencyToolResolveProvider,
    COMPANY_INTELLIGENCE_V2_RESOLVE_PATH,
)
from src.modules.intelligence_layer.providers.mock.resolve import (
    MockResolveProvider,
)


def _mock_client_with(*, status: int, json_body: dict | None = None) -> AsyncMock:
    resp = MagicMock()
    resp.status_code = status
    if json_body is not None:
        resp.json = MagicMock(return_value=json_body)
    else:
        resp.json = MagicMock(side_effect=ValueError("no body"))
    client = MagicMock()
    client.request = AsyncMock(return_value=resp)
    return client


@pytest.mark.asyncio
async def test_agency_tool_resolve_by_cif_ok_maps_first_match():
    client = _mock_client_with(
        status=200,
        json_body={
            "query": {"cif": "A87803862", "name": None},
            "count": 1,
            "matches": [
                {
                    "master_id": "mc_80e03f1e1627",
                    "cif": "A87803862",
                    "legal_name": "TOTALENERGIES ELECTRICIDAD Y GAS ESPAÑA",
                    "province": "MADRID",
                    "cnae_section": "D",
                    "match_type": "cif_exact",
                    "score": 1.0,
                }
            ],
            "capability_version": "company-intelligence-v2",
        },
    )
    provider = AgencyToolResolveProvider(client=client)
    result = await provider.resolve_by_cif("a87803862")

    assert isinstance(result, ResolveResult)
    assert result.cif == "A87803862"
    assert result.resolved is True
    assert result.master_id == "mc_80e03f1e1627"
    assert result.canonical_name == "TOTALENERGIES ELECTRICIDAD Y GAS ESPAÑA"
    assert result.match_type == "cif_exact"
    assert result.score == 1.0
    assert result.engine_version == "arroba-resolve-v1"
    # Verifica shape del payload al proveedor (schema `{"cif": ...}`).
    client.request.assert_awaited_once()
    call = client.request.call_args
    assert call.args[0] == "POST"
    assert call.args[1] == COMPANY_INTELLIGENCE_V2_RESOLVE_PATH
    assert call.kwargs["json"] == {"cif": "A87803862"}


@pytest.mark.asyncio
async def test_agency_tool_resolve_count_zero_raises_not_found():
    client = _mock_client_with(
        status=200,
        json_body={"query": {"cif": "Z99999999"}, "count": 0, "matches": []},
    )
    provider = AgencyToolResolveProvider(client=client)
    with pytest.raises(ResolveNotFoundError):
        await provider.resolve_by_cif("Z99999999")


@pytest.mark.asyncio
async def test_agency_tool_resolve_upstream_500_raises_provider_error():
    client = _mock_client_with(status=502, json_body={"error": "upstream"})
    provider = AgencyToolResolveProvider(client=client)
    with pytest.raises(ResolveProviderError) as exc:
        await provider.resolve_by_cif("A87803862")
    assert exc.value.error_class == "server_5xx"


@pytest.mark.asyncio
async def test_agency_tool_resolve_401_raises_unauthorized():
    client = _mock_client_with(status=401, json_body={"error": "no key"})
    provider = AgencyToolResolveProvider(client=client)
    with pytest.raises(ResolveProviderError) as exc:
        await provider.resolve_by_cif("A87803862")
    assert exc.value.error_class == "unauthorized"


@pytest.mark.asyncio
async def test_agency_tool_resolve_missing_master_id_raises_provider_error():
    client = _mock_client_with(
        status=200,
        json_body={"count": 1, "matches": [{"cif": "A87803862", "match_type": "cif_exact", "score": 1.0}]},
    )
    provider = AgencyToolResolveProvider(client=client)
    with pytest.raises(ResolveProviderError):
        await provider.resolve_by_cif("A87803862")


@pytest.mark.asyncio
async def test_agency_tool_resolve_cif_exact_score_below_one_still_returns():
    """Score anómalo (<1.0 en cif_exact) no bloquea; sólo genera warning."""
    client = _mock_client_with(
        status=200,
        json_body={
            "count": 1,
            "matches": [
                {
                    "master_id": "mc_abc",
                    "cif": "A87803862",
                    "legal_name": "TEST",
                    "match_type": "cif_exact",
                    "score": 0.85,
                }
            ],
        },
    )
    provider = AgencyToolResolveProvider(client=client)
    result = await provider.resolve_by_cif("A87803862")
    assert result.master_id == "mc_abc"
    assert result.score == 0.85


@pytest.mark.asyncio
async def test_mock_resolve_hit(mock_db):
    from datetime import UTC, datetime

    await mock_db.master_companies_mock.insert_one({
        "master_company_id": "mc_test_resolve",
        "cif": "B47820150",
        "legal_name": "Grupo Test",
        "sector": "Servicios",
        "region": "Valladolid",
        "country": "ES",
        "financials": {"revenue": 1_000_000, "ebitda": 100_000, "employees": 10, "fiscal_year": 2024},
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    })
    provider = MockResolveProvider()
    result = await provider.resolve_by_cif("b47820150")
    assert result.master_id == "mc_test_resolve"
    assert result.cif == "B47820150"
    assert result.canonical_name == "Grupo Test"
    assert result.match_type == "cif_exact"
    assert result.score == 1.0


@pytest.mark.asyncio
async def test_mock_resolve_miss_raises_not_found(mock_db):
    provider = MockResolveProvider()
    with pytest.raises(ResolveNotFoundError):
        await provider.resolve_by_cif("Z99999999")
