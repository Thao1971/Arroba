"""AgencyToolFinancialProvider — llamada al motor `financial-intelligence` (X-API-Key).

Endpoints públicos consumidos (R12: NUNCA `/master/*`):
  * POST /api/v1/financial-intelligence/analyze
  * POST /api/v1/financial-intelligence/valuation
  * GET  /api/v1/financial-intelligence/ratios/catalog

El `engine_version` del proveedor (`financial-intelligence-v1`) se traduce en
el DTO interno a `arroba-financial-v1` (R5: contrato interno decoupled).
"""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from src.core.logging import get_logger
from src.modules.intelligence_layer.interfaces.financial import (
    BalanceSheet,
    ComparablePeer,
    Comparables,
    FinancialAnalysis,
    FinancialKpis,
    FinancialNotFoundError,
    FinancialProvider,
    FinancialProviderError,
    FinancialQuality,
    IncomeStatement,
    RatioDefinition,
    RatiosCatalog,
    Valuation,
    ValuationDetails,
    ValuationRange,
)
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolClient,
    AgencyToolHTTPError,
    get_agency_tool_client,
)

log = get_logger("intelligence_layer.provider.agency_tool.financial")

FINANCIAL_ANALYZE_PATH = "/api/v1/financial-intelligence/analyze"
FINANCIAL_VALUATION_PATH = "/api/v1/financial-intelligence/valuation"
FINANCIAL_RATIOS_CATALOG_PATH = "/api/v1/financial-intelligence/ratios/catalog"

# Nombre del engine que arroba emite al frontend (R5 contrato interno decoupled).
INTERNAL_ENGINE_VERSION = "arroba-financial-v1"


class AgencyToolFinancialProvider(FinancialProvider):
    provider_name = "agency_tool"

    def __init__(self, client: AgencyToolClient | None = None) -> None:
        self._client = client or get_agency_tool_client()

    # ---------- analyze ----------
    async def analyze(self, cif: str) -> FinancialAnalysis:
        cif_norm = cif.upper().strip()
        try:
            resp = await self._client.request(
                "POST", FINANCIAL_ANALYZE_PATH, json={"identifier": cif_norm}
            )
        except AgencyToolHTTPError as exc:
            raise FinancialProviderError(str(exc), error_class=exc.error_class) from exc

        if resp.status_code == 404:
            raise FinancialNotFoundError(f"cif={cif_norm}")
        if resp.status_code in (401, 403):
            raise FinancialProviderError(
                f"unauthorized {resp.status_code}", error_class="unauthorized"
            )
        if resp.status_code >= 500:
            raise FinancialProviderError(
                f"upstream {resp.status_code}", error_class="server_5xx"
            )
        if resp.status_code != 200:
            raise FinancialProviderError(
                f"unexpected {resp.status_code}", error_class="client_4xx"
            )
        try:
            data = resp.json()
        except ValueError as exc:
            raise FinancialProviderError(
                f"invalid JSON: {exc}", error_class="server_5xx"
            ) from exc

        return self._map_analyze(cif_norm, data)

    # ---------- valuation ----------
    async def valuation(self, cif: str) -> Valuation:
        cif_norm = cif.upper().strip()
        try:
            resp = await self._client.request(
                "POST", FINANCIAL_VALUATION_PATH, json={"identifier": cif_norm}
            )
        except AgencyToolHTTPError as exc:
            raise FinancialProviderError(str(exc), error_class=exc.error_class) from exc

        if resp.status_code == 404:
            raise FinancialNotFoundError(f"cif={cif_norm}")
        if resp.status_code in (401, 403):
            raise FinancialProviderError(
                f"unauthorized {resp.status_code}", error_class="unauthorized"
            )
        if resp.status_code >= 500:
            raise FinancialProviderError(
                f"upstream {resp.status_code}", error_class="server_5xx"
            )
        if resp.status_code != 200:
            raise FinancialProviderError(
                f"unexpected {resp.status_code}", error_class="client_4xx"
            )
        try:
            data = resp.json()
        except ValueError as exc:
            raise FinancialProviderError(
                f"invalid JSON: {exc}", error_class="server_5xx"
            ) from exc

        return self._map_valuation(cif_norm, data)

    # ---------- ratios catalog (sin identifier) ----------
    async def ratios_catalog(self) -> RatiosCatalog:
        try:
            resp = await self._client.request("GET", FINANCIAL_RATIOS_CATALOG_PATH)
        except AgencyToolHTTPError as exc:
            raise FinancialProviderError(str(exc), error_class=exc.error_class) from exc
        if resp.status_code != 200:
            raise FinancialProviderError(
                f"catalog status {resp.status_code}",
                error_class="server_5xx" if resp.status_code >= 500 else "client_4xx",
            )
        data = resp.json()
        return RatiosCatalog(
            ratios=[RatioDefinition(**r) for r in (data.get("ratios") or [])],
            source=data.get("source"),
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )

    # ---------- Mapping helpers ----------
    def _map_analyze(self, cif_norm: str, doc: dict[str, Any]) -> FinancialAnalysis:
        kpis_raw = doc.get("kpis") or {}
        income_raw = doc.get("income_statement") or {}
        balance_raw = doc.get("balance_sheet") or {}
        quality_raw = doc.get("financial_quality") or {}

        return FinancialAnalysis(
            master_id=doc.get("master_id"),
            cif_normalized=doc.get("cif_normalized") or cif_norm,
            identity=doc.get("identity"),
            cnae_code=doc.get("cnae_code"),
            cnae_section=doc.get("cnae_section"),
            provincia=doc.get("provincia"),
            has_financials=bool(doc.get("has_financials", False)),
            financials_source=doc.get("financials_source"),
            data_source=doc.get("data_source"),
            source_version=doc.get("source_version"),
            audited=doc.get("audited"),
            basis=doc.get("basis"),
            year=doc.get("year"),
            years=doc.get("years") or [],
            kpis=FinancialKpis(**kpis_raw) if kpis_raw else None,
            income_statement=IncomeStatement(**income_raw) if income_raw else None,
            balance_sheet=BalanceSheet(**balance_raw) if balance_raw else None,
            ratios=doc.get("ratios") or {},
            financial_quality=FinancialQuality(**quality_raw) if quality_raw else None,
            solvency=doc.get("solvency"),
            trend=doc.get("trend"),
            anomaly=doc.get("anomaly"),
            deterioration=doc.get("deterioration"),
            size_band=doc.get("size_band"),
            explainability=doc.get("explainability"),
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )

    def _map_valuation(self, cif_norm: str, doc: dict[str, Any]) -> Valuation:
        val_raw = doc.get("valuation") or {}
        range_raw = val_raw.get("range") or {}
        comp_raw = doc.get("comparables") or {}
        peers = [ComparablePeer(**p) for p in (comp_raw.get("peers") or [])]

        return Valuation(
            master_id=doc.get("master_id"),
            cif_normalized=doc.get("cif_normalized") or cif_norm,
            valuation=ValuationDetails(
                method=val_raw.get("method"),
                multiple=val_raw.get("multiple"),
                multiple_basis=val_raw.get("multiple_basis"),
                enterprise_value=val_raw.get("enterprise_value"),
                equity_value=val_raw.get("equity_value"),
                range=ValuationRange(low=range_raw.get("low"), high=range_raw.get("high"))
                if range_raw
                else None,
                subject_ebitda_margin_percentile=val_raw.get("subject_ebitda_margin_percentile"),
            ),
            comparables=Comparables(
                peers=peers,
                criteria=comp_raw.get("criteria"),
                count=comp_raw.get("count", len(peers)),
            ),
            assumptions=doc.get("assumptions"),
            criteria=doc.get("criteria"),
            confidence=doc.get("confidence"),
            explanation=doc.get("explanation"),
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )


__all__ = [
    "AgencyToolFinancialProvider",
    "INTERNAL_ENGINE_VERSION",
    "FINANCIAL_ANALYZE_PATH",
    "FINANCIAL_VALUATION_PATH",
    "FINANCIAL_RATIOS_CATALOG_PATH",
]
