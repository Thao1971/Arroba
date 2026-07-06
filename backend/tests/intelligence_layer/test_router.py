"""Tests del IntelligenceRouter (dispatcher + caché + breaker + métricas)."""
from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from src.modules.intelligence_layer.cache import (
    IntelligenceCache,
    MemoryCache,
    MongoCache,
    reset_cache_for_tests,
)
from src.modules.intelligence_layer.config import (
    IntelligenceSettings,
    reset_intelligence_settings_cache,
)
from src.modules.intelligence_layer.interfaces.master import (
    Classification,
    Contact,
    Financials,
    Identity,
    Location,
    MasterNotFoundError,
    MasterProvider,
    MasterProviderError,
    MasterRecord,
    Ownership,
    Size,
)
from src.modules.intelligence_layer.router import (
    IntelligenceRouter,
    reset_intelligence_router_for_tests,
)


def _sample_record(master_id: str = "mc_abc") -> MasterRecord:
    return MasterRecord(
        master_id=master_id,
        cif_normalized="B47820150",
        status="active",
        identity=Identity(legal_name="Acme SL", cif="B47820150", country="ES"),
        classification=Classification(cnae_description="Consultoría"),
        location=Location(provincia="Madrid", pais="ES"),
        contact=Contact(),
        size=Size(),
        financials=Financials(),
        ownership=Ownership(),
    )


class _FakeProvider(MasterProvider):
    provider_name = "fake"

    def __init__(self) -> None:
        self.get_by_cif = AsyncMock()  # type: ignore[assignment]
        self.get_by_id = AsyncMock()  # type: ignore[assignment]

    # Métodos abstractos "cumplidos" — se sobreescriben en __init__.
    async def get_by_id(self, master_id: str):  # noqa: D401,F811
        raise NotImplementedError

    async def get_by_cif(self, cif: str):  # noqa: D401,F811
        raise NotImplementedError


@pytest.fixture(autouse=True)
def _reset_intel_state():
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()
    reset_intelligence_settings_cache()
    yield
    reset_intelligence_router_for_tests()
    reset_cache_for_tests()
    reset_intelligence_settings_cache()


@pytest.mark.asyncio
async def test_router_dispatches_to_mock_by_default(mock_db, monkeypatch):
    """Con AGENCY_TOOL_MODE=mock el router usa MockMasterProvider (lee master_companies_mock)."""
    from src.modules.intelligence_layer.providers.mock.master import MockMasterProvider

    settings = IntelligenceSettings(agency_tool_mode="mock")
    router = IntelligenceRouter(
        settings=settings,
        cache=IntelligenceCache(memory=MemoryCache(), mongo=MongoCache()),
    )
    provider = router._get_master_provider()
    assert isinstance(provider, MockMasterProvider)
    assert provider.provider_name == "mock"


@pytest.mark.asyncio
async def test_router_dispatches_to_agency_tool_when_real(mock_db):
    from src.modules.intelligence_layer.providers.agency_tool.identity import (
        AgencyToolIdentityResolver,
    )

    settings = IntelligenceSettings(
        agency_tool_mode="real",
        arroba_service_api_key_primary="test-key",
    )
    router = IntelligenceRouter(
        settings=settings,
        cache=IntelligenceCache(memory=MemoryCache(), mongo=MongoCache()),
    )
    provider = router._get_master_provider()
    assert isinstance(provider, AgencyToolIdentityResolver)
    assert provider.provider_name == "agency_tool"


@pytest.mark.asyncio
async def test_router_caches_master_record(mock_db):
    """La segunda llamada con la misma CIF debe venir de cache (compute 1 sola vez)."""
    settings = IntelligenceSettings(agency_tool_mode="mock")
    router = IntelligenceRouter(
        settings=settings,
        cache=IntelligenceCache(memory=MemoryCache(), mongo=MongoCache()),
    )
    fake = _FakeProvider()
    fake.get_by_cif.return_value = _sample_record()
    router._master_provider = fake  # inyección

    r1 = await router.get_master_by_cif("B47820150")
    r2 = await router.get_master_by_cif("B47820150")
    assert r1.master_id == r2.master_id == "mc_abc"
    assert fake.get_by_cif.await_count == 1  # segunda vino de cache


@pytest.mark.asyncio
async def test_router_propagates_not_found(mock_db):
    settings = IntelligenceSettings(agency_tool_mode="mock")
    router = IntelligenceRouter(
        settings=settings,
        cache=IntelligenceCache(memory=MemoryCache(), mongo=MongoCache()),
    )
    fake = _FakeProvider()
    fake.get_by_cif.side_effect = MasterNotFoundError("no existe")
    router._master_provider = fake

    with pytest.raises(MasterNotFoundError):
        await router.get_master_by_cif("B99999999")


@pytest.mark.asyncio
async def test_router_opens_breaker_after_threshold_failures(mock_db):
    settings = IntelligenceSettings(
        agency_tool_mode="mock",
        agency_tool_breaker_threshold=2,
        agency_tool_breaker_timeout_s=30,
    )
    router = IntelligenceRouter(
        settings=settings,
        cache=IntelligenceCache(memory=MemoryCache(), mongo=MongoCache()),
    )
    fake = _FakeProvider()
    # get_by_id devuelve error de proveedor; usamos IDs distintos para evitar la
    # caché de error, que también rechazaría llamadas.
    fake.get_by_id.side_effect = MasterProviderError("boom", error_class="server_5xx")
    router._master_provider = fake

    from src.modules.intelligence_layer.circuit_breaker import BreakerOpenError

    for i in range(2):
        with pytest.raises(MasterProviderError):
            await router.get_master_by_id(f"mc_{i}")
    # tercera llamada: el breaker está open → rechazada sin llamar al proveedor
    with pytest.raises(BreakerOpenError):
        await router.get_master_by_id("mc_x")
    assert fake.get_by_id.await_count == 2  # confirmed: 3rd never reached provider


@pytest.mark.asyncio
async def test_router_records_prometheus_metrics(mock_db):
    settings = IntelligenceSettings(agency_tool_mode="mock")
    router = IntelligenceRouter(
        settings=settings,
        cache=IntelligenceCache(memory=MemoryCache(), mongo=MongoCache()),
    )
    fake = _FakeProvider()
    fake.get_by_cif.return_value = _sample_record()
    router._master_provider = fake

    await router.get_master_by_cif("B47820150")
    await router.get_master_by_cif("B47820150")

    from prometheus_client import generate_latest

    from src.modules.intelligence_layer.observability import REGISTRY

    body = generate_latest(REGISTRY).decode("utf-8")
    assert "intelligence_layer_requests_total" in body
    assert 'engine="master"' in body
