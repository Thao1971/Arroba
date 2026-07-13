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
from src.modules.intelligence_layer.interfaces.resolve import (
    ResolveNotFoundError,
    ResolveProvider,
    ResolveProviderError,
    ResolveResult,
)
from src.modules.intelligence_layer.interfaces.semantic import (
    SemanticCatalog,
    SemanticNotFoundError,
    SemanticProfile,
    SemanticProvider,
    SemanticProviderError,
    SemanticSchema,
    SemanticSearchResponse,
    SimilarCompanies,
)
from src.modules.intelligence_layer.interfaces.valuation import (
    ValuationAnalysis,
    ValuationNotFoundError,
    ValuationProvider,
    ValuationProviderError,
)
from src.modules.intelligence_layer.observability import (
    errors_total,
    request_duration_seconds,
    requests_total,
)
from src.modules.intelligence_layer.providers.agency_tool.company_intelligence_v2 import (
    AgencyToolCompanyIntelligenceV2Provider,
)
from src.modules.intelligence_layer.providers.agency_tool.financial import (
    AgencyToolFinancialProvider,
)
from src.modules.intelligence_layer.providers.agency_tool.identity import (
    AgencyToolIdentityResolver,
)
from src.modules.intelligence_layer.providers.agency_tool.resolve import (
    AgencyToolResolveProvider,
)
from src.modules.intelligence_layer.providers.agency_tool.semantic import (
    AgencyToolSemanticProvider,
)
from src.modules.intelligence_layer.providers.agency_tool.valuation import (
    AgencyToolValuationProvider,
)
from src.modules.intelligence_layer.providers.mock.financial import MockFinancialProvider
from src.modules.intelligence_layer.providers.mock.master import MockMasterProvider
from src.modules.intelligence_layer.providers.mock.resolve import MockResolveProvider
from src.modules.intelligence_layer.providers.mock.semantic import MockSemanticProvider
from src.modules.intelligence_layer.providers.mock.valuation import MockValuationProvider

log = get_logger("intelligence_layer.router")

# TTL específico para el mapping identidad `cif → master_id` (R12 §0.2.3): 24h.
IDENTITY_MAPPING_TTL_SECONDS = 24 * 60 * 60
# F0.2 · TTL del cache `resolve` (CIF → master_id + canonical_name). 24h por
# defecto (identificación estable en el proveedor). Ver `intelligence_cache`.
RESOLVE_MAPPING_TTL_SECONDS = 24 * 60 * 60
# F0.3 · TTL del cache de valoración (equity/EV/multiplier). 1h por defecto
# (equivalente al de financial-analyze; la valoración depende del bloque
# financiero del ejercicio auditado).
VALUATION_TTL_SECONDS = 60 * 60


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
        self._semantic_provider: SemanticProvider | None = None
        self._resolve_provider: ResolveProvider | None = None
        self._valuation_provider: ValuationProvider | None = None
        self._breakers: dict[tuple[str, str], CircuitBreaker] = {}

    # ---------- Proveedor Master (Identity) ----------
    def _get_master_provider(self) -> MasterProvider:
        if self._master_provider is None:
            if self.settings.agency_tool_mode == "real":
                # Sprint F0.1: si el flag `intelligence_company_v2_enabled` está
                # activo, arroba consume el nuevo endpoint canónico público
                # `/api/v2/company-intelligence/identity`. Si no, mantiene el
                # resolver compositivo Financial+Semantic (R12).
                if self.settings.intelligence_company_v2_enabled:
                    self._master_provider = _CompanyIntelligenceV2WithFallback()
                else:
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

    # ---------- Proveedor Semantic (§6.5) ----------
    def _get_semantic_provider(self) -> SemanticProvider:
        if self._semantic_provider is None:
            if self.settings.agency_tool_mode == "real":
                self._semantic_provider = AgencyToolSemanticProvider()
            else:
                self._semantic_provider = MockSemanticProvider()
        return self._semantic_provider

    # ---------- Proveedor Resolve (F0.2 · CIF → master_id) ----------
    def _get_resolve_provider(self) -> ResolveProvider:
        if self._resolve_provider is None:
            if self.settings.agency_tool_mode == "real":
                self._resolve_provider = AgencyToolResolveProvider()
            else:
                self._resolve_provider = MockResolveProvider()
        return self._resolve_provider

    # ---------- Proveedor Valuation (F0.3) ----------
    def _get_valuation_provider(self) -> ValuationProvider:
        if self._valuation_provider is None:
            if self.settings.agency_tool_mode == "real":
                self._valuation_provider = AgencyToolValuationProvider()
            else:
                self._valuation_provider = MockValuationProvider()
        return self._valuation_provider

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

    # ================================================================
    # Resolve Engine (F0.2 · CIF → master_id)
    # ================================================================

    async def resolve_by_cif(self, cif: str) -> ResolveResult:
        """`POST /company-intelligence/resolve` con caché aside 24h + breaker + métricas.

        Cache key canónica: `resolve:{cif}` (indirectamente via `build_key`).
        En caso de `count=0` en el proveedor → `ResolveNotFoundError`
        (canónico 404 en el endpoint público).
        """
        provider = self._get_resolve_provider()
        engine = "resolve"
        provider_name = provider.provider_name
        cif_norm = cif.upper().strip()
        ttl = RESOLVE_MAPPING_TTL_SECONDS
        breaker = self._get_breaker(provider_name, engine)
        cache_key = build_key(
            provider=provider_name,
            engine=engine,
            method="resolve_by_cif",
            master_id=cif_norm,
        )

        async def _compute() -> dict[str, Any]:
            start = time.monotonic()

            async def _invoke() -> ResolveResult:
                return await provider.resolve_by_cif(cif_norm)

            try:
                record = await breaker.call(_invoke)
            except BreakerOpenError:
                errors_total.labels(
                    provider=provider_name, engine=engine, error_class="server_5xx"
                ).inc()
                requests_total.labels(
                    provider=provider_name,
                    engine=engine,
                    method="resolve_by_cif",
                    status="breaker_open",
                ).inc()
                raise
            except ResolveNotFoundError:
                requests_total.labels(
                    provider=provider_name,
                    engine=engine,
                    method="resolve_by_cif",
                    status="not_found",
                ).inc()
                raise
            except ResolveProviderError as exc:
                errors_total.labels(
                    provider=provider_name, engine=engine, error_class=exc.error_class
                ).inc()
                requests_total.labels(
                    provider=provider_name,
                    engine=engine,
                    method="resolve_by_cif",
                    status="error",
                ).inc()
                raise
            finally:
                request_duration_seconds.labels(
                    provider=provider_name, engine=engine, method="resolve_by_cif"
                ).observe(time.monotonic() - start)

            requests_total.labels(
                provider=provider_name,
                engine=engine,
                method="resolve_by_cif",
                status="ok",
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
        except ResolveNotFoundError:
            raise
        return ResolveResult.model_validate(payload)

    # ================================================================
    # Valuation Engine (F0.3 · financial-intelligence/valuation)
    # ================================================================

    async def analyze_valuation(self, identifier: str) -> ValuationAnalysis:
        """`POST /financial-intelligence/valuation` con cache 1h + breaker + métricas.

        `identifier` puede ser CIF o `master_id`. Errores canónicos:
          * `ValuationNotFoundError` → 404 en el proveedor.
          * `ValuationProviderError` → 5xx / unauthorized.
        """
        provider = self._get_valuation_provider()
        engine = "valuation"
        provider_name = provider.provider_name
        # No forzar upper: master_id llega en minúsculas (`mc_*`); CIF puede
        # llegar en cualquier case → normalizamos sólo si parece CIF.
        ident_raw = identifier.strip()
        ident_norm = ident_raw.upper() if not ident_raw.lower().startswith("mc_") else ident_raw
        ttl = VALUATION_TTL_SECONDS
        breaker = self._get_breaker(provider_name, engine)
        cache_key = build_key(
            provider=provider_name,
            engine=engine,
            method="analyze_valuation",
            master_id=ident_norm,
        )

        async def _compute() -> dict[str, Any]:
            start = time.monotonic()

            async def _invoke() -> ValuationAnalysis:
                return await provider.analyze_valuation(ident_norm)

            try:
                record = await breaker.call(_invoke)
            except BreakerOpenError:
                errors_total.labels(
                    provider=provider_name, engine=engine, error_class="server_5xx"
                ).inc()
                requests_total.labels(
                    provider=provider_name,
                    engine=engine,
                    method="analyze_valuation",
                    status="breaker_open",
                ).inc()
                raise
            except ValuationNotFoundError:
                requests_total.labels(
                    provider=provider_name,
                    engine=engine,
                    method="analyze_valuation",
                    status="not_found",
                ).inc()
                raise
            except ValuationProviderError as exc:
                errors_total.labels(
                    provider=provider_name, engine=engine, error_class=exc.error_class
                ).inc()
                requests_total.labels(
                    provider=provider_name,
                    engine=engine,
                    method="analyze_valuation",
                    status="error",
                ).inc()
                raise
            finally:
                request_duration_seconds.labels(
                    provider=provider_name, engine=engine, method="analyze_valuation"
                ).observe(time.monotonic() - start)

            requests_total.labels(
                provider=provider_name,
                engine=engine,
                method="analyze_valuation",
                status="ok",
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
        except ValuationNotFoundError:
            raise
        return ValuationAnalysis.model_validate(payload)

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

    # ================================================================
    # Semantic Engine (B.6.c · §6.5)
    # ================================================================

    async def get_semantic_profile(self, cif: str) -> SemanticProfile:
        return SemanticProfile.model_validate(
            await self._call_semantic(method="profile", identifier=cif.upper(), extra=None)
        )

    async def get_semantic_similar(self, cif: str, limit: int = 10) -> SimilarCompanies:
        return SimilarCompanies.model_validate(
            await self._call_semantic(
                method="similar", identifier=cif.upper(), extra={"limit": limit}
            )
        )

    async def semantic_search(
        self, query: str, limit: int = 10, cnae_section: str | None = None
    ) -> SemanticSearchResponse:
        """`POST /semantic-intelligence/search`. Cache por (query, limit, cnae)."""
        provider = self._get_semantic_provider()
        engine = "semantic"
        provider_name = provider.provider_name
        # Búsqueda: TTL corto porque el índice puede cambiar más rápido que identidad.
        ttl = min(self.settings.ttl_for("semantic"), 900)  # tope a 15 min
        breaker = self._get_breaker(provider_name, engine)
        cache_key = build_key(
            provider=provider_name,
            engine=engine,
            method="search",
            master_id=query.strip().lower(),
            payload={"limit": limit, "cnae_section": cnae_section},
        )

        async def _compute() -> dict[str, Any]:
            start = time.monotonic()

            async def _invoke():
                return await provider.search(query, limit=limit, cnae_section=cnae_section)

            try:
                record = await breaker.call(_invoke)
            except BreakerOpenError:
                errors_total.labels(
                    provider=provider_name, engine=engine, error_class="server_5xx"
                ).inc()
                requests_total.labels(
                    provider=provider_name, engine=engine, method="search", status="breaker_open"
                ).inc()
                raise
            except SemanticProviderError as exc:
                errors_total.labels(
                    provider=provider_name, engine=engine, error_class=exc.error_class
                ).inc()
                requests_total.labels(
                    provider=provider_name, engine=engine, method="search", status="error"
                ).inc()
                raise
            finally:
                request_duration_seconds.labels(
                    provider=provider_name, engine=engine, method="search"
                ).observe(time.monotonic() - start)

            requests_total.labels(
                provider=provider_name, engine=engine, method="search", status="ok"
            ).inc()
            return record.model_dump(mode="json")

        payload = await self.cache.get_or_compute(
            engine=engine,
            key=cache_key,
            ttl_s=ttl,
            compute=_compute,
            error_ttl_s=self.settings.intelligence_cache_error_ttl_seconds,
        )
        return SemanticSearchResponse.model_validate(payload)

    async def get_semantic_schema(self) -> SemanticSchema:
        return SemanticSchema.model_validate(
            await self._call_semantic_static(method="schema", ttl_s=24 * 60 * 60)
        )

    async def get_semantic_catalog(self) -> SemanticCatalog:
        return SemanticCatalog.model_validate(
            await self._call_semantic_static(method="catalog", ttl_s=24 * 60 * 60)
        )

    async def _call_semantic(
        self, *, method: str, identifier: str, extra: dict | None
    ) -> dict[str, Any]:
        provider = self._get_semantic_provider()
        engine = "semantic"
        provider_name = provider.provider_name
        ttl = self.settings.ttl_for("semantic")
        breaker = self._get_breaker(provider_name, engine)
        cache_key = build_key(
            provider=provider_name, engine=engine, method=method,
            master_id=identifier, payload=extra,
        )

        async def _compute() -> dict[str, Any]:
            start = time.monotonic()

            async def _invoke():
                if method == "profile":
                    return await provider.profile(identifier)
                if method == "similar":
                    limit = (extra or {}).get("limit", 10)
                    return await provider.similar(identifier, limit=limit)
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
            except SemanticNotFoundError:
                requests_total.labels(
                    provider=provider_name, engine=engine, method=method, status="not_found"
                ).inc()
                raise
            except SemanticProviderError as exc:
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
        except SemanticNotFoundError:
            raise
        return payload

    async def _call_semantic_static(
        self, *, method: str, ttl_s: int
    ) -> dict[str, Any]:
        """Endpoints sin identifier: schema, catalog. Cache larga."""
        provider = self._get_semantic_provider()
        engine = "semantic"
        provider_name = provider.provider_name
        cache_key = build_key(
            provider=provider_name, engine=engine, method=method, master_id="_"
        )

        async def _compute() -> dict[str, Any]:
            start = time.monotonic()
            try:
                if method == "schema":
                    record = await provider.schema()
                elif method == "catalog":
                    record = await provider.catalog()
                else:
                    raise ValueError(f"método estático desconocido: {method}")
            except SemanticProviderError as exc:
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

        payload = await self.cache.get_or_compute(
            engine=engine,
            key=cache_key,
            ttl_s=ttl_s,
            compute=_compute,
            error_ttl_s=self.settings.intelligence_cache_error_ttl_seconds,
        )
        return payload


# Instancia global reutilizada por endpoints y otros consumidores.
_router: IntelligenceRouter | None = None


class _CompanyIntelligenceV2WithFallback(MasterProvider):
    """Wrapper F0.1 · intenta V2 (`/company-intelligence/identity`) y hace fallback
    al resolver compositivo clásico (Financial→Semantic) si el V2 devuelve error
    NO-404. En 404 lógico del V2 se respeta y se propaga a arroba como 404
    canónico (no se hace fallback en 404: significa "no existe la empresa").
    """

    provider_name = "agency_tool"

    def __init__(self) -> None:
        self._v2 = AgencyToolCompanyIntelligenceV2Provider()
        self._legacy = AgencyToolIdentityResolver()

    async def get_by_id(self, master_id: str) -> MasterRecord:
        try:
            return await self._v2.get_by_id(master_id)
        except MasterNotFoundError:
            raise
        except MasterProviderError as exc:
            log.warning(
                "company_intelligence_v2.fallback_to_legacy",
                error_class=exc.error_class,
                message=str(exc),
            )
            return await self._legacy.get_by_id(master_id)

    async def get_by_cif(self, cif: str) -> MasterRecord:
        try:
            return await self._v2.get_by_cif(cif)
        except MasterNotFoundError:
            raise
        except MasterProviderError as exc:
            log.warning(
                "company_intelligence_v2.fallback_to_legacy",
                error_class=exc.error_class,
                message=str(exc),
            )
            return await self._legacy.get_by_cif(cif)


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
    "RESOLVE_MAPPING_TTL_SECONDS",
    "VALUATION_TTL_SECONDS",
]
