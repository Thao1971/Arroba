"""Tests for the EnrichCompanyAdapter Boundary First abstraction.

Covers:
- MockEnrichCompanyAdapter.enrich returns canonical EnrichedCompany.
- MockEnrichCompanyAdapter.find_by_name fuzzy match (accent-insensitive, by
  legal_name, by CIF with separators, no match).
- RealEnrichCompanyAdapter raises NotImplementedError on both surfaces.
- Factory honors ENRICH_COMPANY_SOURCE env + set_override(...).
"""
import pytest

from src.modules.agency_tool_adapter.enrich_company import (
    MockEnrichCompanyAdapter,
    RealEnrichCompanyAdapter,
    get_enrich_company_adapter,
    set_override,
)

pytestmark = pytest.mark.anyio


SEED = [
    {
        "master_company_id": "mc_kitchen",
        "legal_name": "Kitchen Studio, S.L.",
        "cif": "B-86 540 112",
        "sector": "Tecnología y software",
        "region": "Madrid",
        "country": "ES",
        "financials": {
            "revenue": 5_400_000,
            "ebitda": 1_100_000,
            "employees": 32,
            "fiscal_year": 2024,
        },
        "confidence": 0.9,
        "lineage": "normalized",
    },
    {
        "master_company_id": "mc_munoz",
        "legal_name": "Muñoz Comunicación, S.L.",
        "cif": "B85412003",
        "sector": "Marketing y publicidad",
        "region": "Madrid",
    },
    {
        "master_company_id": "mc_olmedo",
        "legal_name": "Grupo Olmedo Hoteles, S.L.",
        "cif": "B-47 594 478",
        "sector": "Hoteles y turismo termal",
        "region": "Valladolid",
    },
]


async def _seed(mock_db) -> None:
    await mock_db.master_companies_mock.insert_many([dict(c) for c in SEED])


async def test_mock_adapter_enrich_returns_canonical_shape(mock_db):
    await _seed(mock_db)
    adapter = MockEnrichCompanyAdapter()
    result = await adapter.enrich("mc_kitchen")
    assert result.master_company_id == "mc_kitchen"
    assert result.legal_name == "Kitchen Studio, S.L."
    assert result.sector == "Tecnología y software"
    assert result.source == "mock"
    assert result.financials is not None
    assert result.financials.revenue == 5_400_000


async def test_mock_adapter_enrich_not_found(mock_db):
    adapter = MockEnrichCompanyAdapter()
    with pytest.raises(Exception):  # NotFoundError
        await adapter.enrich("mc_does_not_exist")


async def test_mock_adapter_find_by_name_exact(mock_db):
    await _seed(mock_db)
    adapter = MockEnrichCompanyAdapter()
    res = await adapter.find_by_name("Kitchen Studio")
    assert len(res) >= 1
    assert res[0].master_company_id == "mc_kitchen"


async def test_mock_adapter_find_by_name_accent_insensitive(mock_db):
    await _seed(mock_db)
    adapter = MockEnrichCompanyAdapter()
    res = await adapter.find_by_name("munoz")
    assert any(c.master_company_id == "mc_munoz" for c in res)


async def test_mock_adapter_find_by_cif_with_separators(mock_db):
    await _seed(mock_db)
    adapter = MockEnrichCompanyAdapter()
    res = await adapter.find_by_name("B-47 594 478")
    assert any(c.master_company_id == "mc_olmedo" for c in res)


async def test_mock_adapter_find_by_name_empty_query_returns_empty(mock_db):
    await _seed(mock_db)
    adapter = MockEnrichCompanyAdapter()
    assert await adapter.find_by_name("") == []
    assert await adapter.find_by_name("    ") == []


async def test_mock_adapter_find_by_name_no_match(mock_db):
    await _seed(mock_db)
    adapter = MockEnrichCompanyAdapter()
    assert await adapter.find_by_name("zzzzz-unknown-xyz") == []


async def test_real_adapter_enrich_raises_not_implemented():
    adapter = RealEnrichCompanyAdapter()
    with pytest.raises(NotImplementedError):
        await adapter.enrich("mc_anything")


async def test_real_adapter_find_by_name_raises_not_implemented():
    adapter = RealEnrichCompanyAdapter()
    with pytest.raises(NotImplementedError):
        await adapter.find_by_name("anything")


async def test_factory_default_is_mock():
    # No override → env says "mock" in test settings.
    set_override(None)
    a = get_enrich_company_adapter()
    assert a.name == "mock"


async def test_factory_honors_override():
    real = RealEnrichCompanyAdapter()
    set_override(real)
    try:
        a = get_enrich_company_adapter()
        assert a is real
    finally:
        set_override(None)
