"""Router dispatcher del intelligence_layer.

Instancia el proveedor concreto según `AGENCY_TOOL_MODE` y orquesta:
  * caché (cache.get_or_compute)
  * circuit breaker (breaker.call)
  * observabilidad (métricas de latencia/status)

Los consumidores (endpoints REST · skills del Copilot) importan `get_master()`
y NUNCA tocan proveedores directamente (Regla R9).

R12 (2026-07-07): en modo `real` se instancia `AgencyToolIdentityResolver`, que
compone `financial-intelligence/analyze` + `semantic-intelligence/search`. NUNCA
llama a `/api/v1/master/*`.
"""
from __future__ import annotations

import time
from typing import Any

from src.core.logging import get_logger
from src.modules.intelligence_layer.cache import (
    IntelligenceCache,
    build_key,
    get_cache,
)
from src.modules.intelligence_layer.circuit_breaker import (
    BreakerOpenError,
    CircuitBreaker,
)
from src.modules.intelligence_layer.config import (
    IntelligenceSettings,
    get_intelligence_settings,
)
from src.modules.intelligence_layer.interfaces.financial import (
    FinancialAnalysis,
    FinancialNotFoundError,
    FinancialProvider,
    FinancialProviderError,
    RatiosCatalog,
    Valuation,
)
from src.modules.intelligence_layer.interfaces.master import (
    MasterNotFoundError,
    MasterProvider,
    MasterProviderError,
    MasterRecord,
)
from src.modules.intelligence_layer.observability import (
    errors_total,
    request_duration_seconds,
    requests_total,
)
from src.modules.intelligence_layer.providers.agency_tool.financial import (
    AgencyToolFinancialProvider,
)
from src.modules.intelligence_layer.providers.agency_tool.identity import (
    AgencyToolIdentityResolver,
)
from src.modules.intelligence_layer.providers.mock.financial import MockFinancialProvider
from src.modules.intelligence_layer.providers.mock.master import MockMasterProvider

log = get_logger("intelligence_layer.router")

# TTL específico para el mapping identidad `cif → master_id` (R12 §0.2.3): 24h.
IDENTITY_MAPPING_TTL_SECONDS = 24 * 60 * 60


class IntelligenceRouter:
    """Fachada única. Un consumidor externo NUNCA ve nombres de proveedor."""

    def __init__(
        self,
        *,
        settings: IntelligenceSettings | None = None,
        cache: IntelligenceCache | None = None,
    ) -> None:
        self.settings = settings or get_intelligence_settings()
        self.cache = cache or get_cache()
        self._master_provider: MasterProvider | None = None
        self._financial_provider: FinancialProvider | None = None
        self._breakers: dict[tuple[str, str], CircuitBreaker] = {}

    # ---------- Proveedor Master (Identity) ----------
    def _get_master_provider(self) -> MasterProvider:
        if self._master_provider is None:
            if self.settings.agency_tool_mode == "real":
                # R12: en modo real usamos IdentityResolver que compone
                # Financial+Semantic engines públicos. Nunca /master/*.
                self._master_provider = AgencyToolIdentityResolver()
            else:
                self._master_provider = MockMasterProvider()
        return self._master_provider

    # ---------- Proveedor Financial (§6.2/§6.3) ----------
    def _get_financial_provider(self) -> FinancialProvider:
        if self._financial_provider is None:
            if self.settings.agency_tool_mode == "real":
                self._financial_provider = AgencyToolFinancialProvider()
            else:
                self._financial_provider = MockFinancialProvider()
        return self._financial_provider

    def _get_breaker(self, provider: str, engine: str) -> CircuitBreaker:
        key = (provider, engine)
        if key not in self._breakers:
            self._breakers[key] = CircuitBreaker(
                provider=provider,
                engine=engine,
                threshold=self.settings.agency_tool_breaker_threshold,
                timeout_s=float(self.settings.agency_tool_breaker_timeout_s),
            )
        return self._breakers[key]

    # ---------- API pública ----------
    async def get_master_by_cif(self, cif: str) -> MasterRecord:
        return await self._call_master(method="get_by_cif", identifier=cif.upper())

    async def get_master_by_id(self, master_id: str) -> MasterRecord:
        return await self._call_master(method="get_by_id", identifier=master_id)

    async def _call_master(self, *, method: str, identifier: str) -> MasterRecord:
        provider = self._get_master_provider()
        engine = "master"
        provider_name = provider.provider_name
        # TTL 24h para identidad (R12 §0.2.3), con override configurable.
        ttl = self.settings.ttl_for("master") or IDENTITY_MAPPING_TTL_SECONDS
        breaker = self._get_breaker(provider_name, engine)
        cache_key = build_key(
            provider=provider_name,
            engine=engine,
            method=method,
            master_id=identifier,
        )

        async def _compute() -> dict[str, Any]:
            start = time.monotonic()

            async def _invoke() -> MasterRecord:
                if method == "get_by_id":
                    return await provider.get_by_id(identifier)
                if method == "get_by_cif":
                    return await provider.get_by_cif(identifier)
                raise ValueError(f"método desconocido: {method}")

            try:
                record = await breaker.call(_invoke)
            except BreakerOpenError:
                errors_total.labels(
                    provider=provider_name, engine=engine, error_class="server_5xx"
                ).inc()
                requests_total.labels(
                    provider=provider_name, engine=engine, method=method, status="breaker_open"
                ).inc()
                raise
            except MasterNotFoundError:
                requests_total.labels(
                    provider=provider_name, engine=engine, method=method, status="not_found"
                ).inc()
                raise
            except MasterProviderError as exc:
                errors_total.labels(
                    provider=provider_name, engine=engine, error_class=exc.error_class
                ).inc()
                requests_total.labels(
                    provider=provider_name, engine=engine, method=method, status="error"
                ).inc()
                raise
            finally:
                request_duration_seconds.labels(
                    provider=provider_name, engine=engine, method=method
                ).observe(time.monotonic() - start)

            requests_total.labels(
                provider=provider_name, engine=engine, method=method, status="ok"
            ).inc()
            return record.model_dump(mode="json")

        try:
            payload = await self.cache.get_or_compute(
                engine=engine,
                key=cache_key,
                ttl_s=ttl,
                compute=_compute,
                error_ttl_s=self.settings.intelligence_cache_error_ttl_seconds,
            )
        except MasterNotFoundError:
            raise
        return MasterRecord.model_validate(payload)

    # ================================================================
    # Financial Engine (B.6.b · §6.2/§6.3)
    # ================================================================

    async def get_financial_analysis(self, cif: str) -> FinancialAnalysis:
        """`POST /financial-intelligence/analyze` con caché + breaker + métricas."""
        return FinancialAnalysis.model_validate(
            await self._call_financial(method="analyze", identifier=cif.upper())
        )

    async def get_valuation(self, cif: str) -> Valuation:
        """`POST /financial-intelligence/valuation` con caché + breaker + métricas."""
        return Valuation.model_validate(
            await self._call_financial(method="valuation", identifier=cif.upper())
        )

    async def get_ratios_catalog(self) -> RatiosCatalog:
        """`GET /financial-intelligence/ratios/catalog` cacheado 24h (identifier-less)."""
        provider = self._get_financial_provider()
        engine = "financial"
        provider_name = provider.provider_name
        cache_key = build_key(
            provider=provider_name, engine=engine, method="ratios_catalog", master_id="_"
        )
        ttl = 24 * 60 * 60  # catálogo estable — 24h

        async def _compute() -> dict[str, Any]:
            start = time.monotonic()
            try:
                catalog = await provider.ratios_catalog()
            except FinancialProviderError as exc:
                errors_total.labels(
                    provider=provider_name, engine=engine, error_class=exc.error_class
                ).inc()
                requests_total.labels(
                    provider=provider_name, engine=engine, method="ratios_catalog", status="error"
                ).inc()
                raise
            finally:
                request_duration_seconds.labels(
                    provider=provider_name, engine=engine, method="ratios_catalog"
                ).observe(time.monotonic() - start)
            requests_total.labels(
                provider=provider_name, engine=engine, method="ratios_catalog", status="ok"
            ).inc()
            return catalog.model_dump(mode="json")

        payload = await self.cache.get_or_compute(
            engine=engine,
            key=cache_key,
            ttl_s=ttl,
            compute=_compute,
            error_ttl_s=self.settings.intelligence_cache_error_ttl_seconds,
        )
        return RatiosCatalog.model_validate(payload)

    async def _call_financial(self, *, method: str, identifier: str) -> dict[str, Any]:
        provider = self._get_financial_provider()
        engine = "financial"
        provider_name = provider.provider_name
        ttl = self.settings.ttl_for("financial")
        breaker = self._get_breaker(provider_name, engine)
        cache_key = build_key(
            provider=provider_name, engine=engine, method=method, master_id=identifier
        )

        async def _compute() -> dict[str, Any]:
            start = time.monotonic()

            async def _invoke():
                if method == "analyze":
                    return await provider.analyze(identifier)
                if method == "valuation":
                    return await provider.valuation(identifier)
                raise ValueError(f"método desconocido: {method}")

            try:
                record = await breaker.call(_invoke)
            except BreakerOpenError:
                errors_total.labels(
                    provider=provider_name, engine=engine, error_class="server_5xx"
                ).inc()
                requests_total.labels(
                    provider=provider_name, engine=engine, method=method, status="breaker_open"
                ).inc()
                raise
            except FinancialNotFoundError:
                requests_total.labels(
                    provider=provider_name, engine=engine, method=method, status="not_found"
                ).inc()
                raise
            except FinancialProviderError as exc:
                errors_total.labels(
                    provider=provider_name, engine=engine, error_class=exc.error_class
                ).inc()
                requests_total.labels(
                    provider=provider_name, engine=engine, method=method, status="error"
                ).inc()
                raise
            finally:
                request_duration_seconds.labels(
                    provider=provider_name, engine=engine, method=method
                ).observe(time.monotonic() - start)

            requests_total.labels(
                provider=provider_name, engine=engine, method=method, status="ok"
            ).inc()
            return record.model_dump(mode="json")

        try:
            payload = await self.cache.get_or_compute(
                engine=engine,
                key=cache_key,
                ttl_s=ttl,
                compute=_compute,
                error_ttl_s=self.settings.intelligence_cache_error_ttl_seconds,
            )
        except FinancialNotFoundError:
            raise
        return payload


# Instancia global reutilizada por endpoints y otros consumidores.
_router: IntelligenceRouter | None = None


def get_intelligence_router() -> IntelligenceRouter:
    global _router
    if _router is None:
        _router = IntelligenceRouter()
    return _router


def reset_intelligence_router_for_tests() -> None:
    """Limpia router + cache para tests aislados."""
    global _router
    _router = None


__all__ = [
    "IntelligenceRouter",
    "get_intelligence_router",
    "reset_intelligence_router_for_tests",
    "IDENTITY_MAPPING_TTL_SECONDS",
]
