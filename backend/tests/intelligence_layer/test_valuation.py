"""Tests unitarios del `ValuationProvider` — Sprint F0.3.

Cubre:
  * `AgencyToolValuationProvider` mapea el response `valuation{…}` al contrato
    `arroba-valuation-v1`.
  * `range.central` = `enterprise_value` (arroba enriquece el shape).
  * `confidence_level` derivado (low/medium/high).
  * `method_label` humano derivado del mapping conocido.
  * `bridge_components/scenarios/sensitivity` = `None` en F0.3 (BLOCKED).
  * Errores 404/401/500 mapean a excepciones canónicas.
  * `MockValuationProvider` devuelve `has_valuation=False` para CIFs con
    fixture pero sin bloque valuation.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.modules.intelligence_layer.interfaces.valuation import (
    ValuationAnalysis,
    ValuationNotFoundError,
    ValuationProviderError,
)
from src.modules.intelligence_layer.providers.agency_tool.valuation import (
    AgencyToolValuationProvider,
    VALUATION_PATH,
)
from src.modules.intelligence_layer.providers.mock.valuation import (
    MockValuationProvider,
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
async def test_valuation_maps_canonical_shape_from_totalenergies():
    body = {
        "master_id": "mc_80e03f1e1627",
        "cif_normalized": "A87803862",
        "valuation": {
            "method": "ev_ebitda",
            "multiple": 6.5,
            "multiple_basis": "inferred_reference",
            "enterprise_value": 237536000.0,
            "equity_value": 236633000.0,
            "range": {"low": 201905600.0, "high": 273166400.0},
            "confidence": 0.6,
            "hypotheses": [
                "Múltiplo EV/EBITDA sectorial (sección D) = 6.5x (REFERENCIA inferida)",
                "Deuda neta = deuda financiera - caja = 903000.0",
            ],
            "lineage": {
                "financials_source": "master_companies.financials.latest",
                "basis": "individual",
                "year": 2024,
            },
        },
        "engine_version": "financial-intelligence-v1",
        "generated_at": "2026-07-13T07:27:48.219006+00:00",
    }
    client = _mock_client_with(status=200, json_body=body)
    provider = AgencyToolValuationProvider(client=client)

    result = await provider.analyze_valuation("A87803862")

    assert isinstance(result, ValuationAnalysis)
    assert result.master_id == "mc_80e03f1e1627"
    assert result.cif_normalized == "A87803862"
    assert result.has_valuation is True
    assert result.method == "ev_ebitda"
    assert result.method_label == "EV/EBITDA sectorial"
    assert result.multiple == 6.5
    assert result.multiple_basis == "inferred_reference"
    assert result.enterprise_value == 237536000.0
    assert result.equity_value == 236633000.0
    assert result.range is not None
    assert result.range.low == 201905600.0
    assert result.range.central == 237536000.0  # ← EV canónico como central
    assert result.range.high == 273166400.0
    assert result.confidence == 0.6
    assert result.confidence_level == "medium"
    assert len(result.hypotheses) == 2
    assert "sección D" in result.hypotheses[0]
    assert result.lineage is not None
    assert result.lineage.basis == "individual"
    assert result.lineage.year == 2024
    # F0.3: BLOCKED BY DATA
    assert result.bridge_components is None
    assert result.scenarios is None
    assert result.sensitivity is None
    # R5: contrato interno decoupled
    assert result.engine_version == "arroba-valuation-v1"

    # Verificar shape del payload al proveedor
    client.request.assert_awaited_once()
    call = client.request.call_args
    assert call.args[0] == "POST"
    assert call.args[1] == VALUATION_PATH
    assert call.kwargs["json"] == {"identifier": "A87803862"}


@pytest.mark.asyncio
async def test_valuation_confidence_level_thresholds():
    for c, expected in [(0.9, "high"), (0.75, "high"), (0.6, "medium"), (0.5, "medium"), (0.3, "low"), (0.0, "low"), (None, None)]:
        body = {"master_id": "mc_x", "cif_normalized": "A1", "valuation": {"enterprise_value": 1.0, "confidence": c}}
        client = _mock_client_with(status=200, json_body=body)
        provider = AgencyToolValuationProvider(client=client)
        result = await provider.analyze_valuation("A1")
        assert result.confidence_level == expected, f"c={c} → {result.confidence_level}, expected {expected}"


@pytest.mark.asyncio
async def test_valuation_404_raises_not_found():
    client = _mock_client_with(status=404, json_body={"detail": "not_found"})
    provider = AgencyToolValuationProvider(client=client)
    with pytest.raises(ValuationNotFoundError):
        await provider.analyze_valuation("A87803862")


@pytest.mark.asyncio
async def test_valuation_500_raises_provider_error():
    client = _mock_client_with(status=502, json_body={"error": "upstream"})
    provider = AgencyToolValuationProvider(client=client)
    with pytest.raises(ValuationProviderError) as exc:
        await provider.analyze_valuation("A87803862")
    assert exc.value.error_class == "server_5xx"


@pytest.mark.asyncio
async def test_valuation_401_raises_unauthorized():
    client = _mock_client_with(status=401, json_body={"error": "no key"})
    provider = AgencyToolValuationProvider(client=client)
    with pytest.raises(ValuationProviderError) as exc:
        await provider.analyze_valuation("A87803862")
    assert exc.value.error_class == "unauthorized"


@pytest.mark.asyncio
async def test_valuation_empty_body_has_no_valuation_false():
    """Si el motor devuelve `valuation:{}` sin enterprise_value: `has_valuation=False`."""
    body = {"master_id": "mc_x", "cif_normalized": "A1", "valuation": {}}
    client = _mock_client_with(status=200, json_body=body)
    provider = AgencyToolValuationProvider(client=client)
    result = await provider.analyze_valuation("A1")
    assert result.has_valuation is False
    assert result.enterprise_value is None
    assert result.range is None


@pytest.mark.asyncio
async def test_mock_valuation_returns_no_valuation(mock_db):
    from datetime import UTC, datetime
    await mock_db.master_companies_mock.insert_one({
        "master_company_id": "mc_mock_val",
        "cif": "B12345678",
        "legal_name": "Empresa mock",
        "sector": "Servicios",
        "region": "Madrid",
        "country": "ES",
        "financials": {"revenue": 1_000_000, "ebitda": 100_000, "employees": 10, "fiscal_year": 2024},
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    })
    provider = MockValuationProvider()
    result = await provider.analyze_valuation("B12345678")
    assert result.has_valuation is False
    assert result.master_id == "mc_mock_val"
    assert result.cif_normalized == "B12345678"


@pytest.mark.asyncio
async def test_mock_valuation_missing_raises_not_found(mock_db):
    provider = MockValuationProvider()
    with pytest.raises(ValuationNotFoundError):
        await provider.analyze_valuation("Z99999999")
