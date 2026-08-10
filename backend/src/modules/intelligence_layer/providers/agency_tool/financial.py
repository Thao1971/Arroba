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
        """Mapea el response del proveedor al contrato interno F0.2.

        Compatibilidad con shape actual y previo:
          * Shape actual (F0.2 · TOTALENERGIES): `statements.{income_statement,
            balance_sheet, cashflow, year, basis}` + `evolution.{points[],
            trend, years, anomaly}` + `assessment.{strengths, weaknesses, risks}`
            + `explainability.data_source`.
          * Shape previo (B.6.b): `income_statement`, `balance_sheet`, `year`,
            `basis` en el root. Mantiene retrocompatibilidad.
        """
        statements = doc.get("statements") or {}
        income_raw = statements.get("income_statement") or doc.get("income_statement") or {}
        balance_raw = statements.get("balance_sheet") or doc.get("balance_sheet") or {}
        cashflow_raw = statements.get("cashflow") if "statements" in doc else doc.get("cashflow")
        year_val = statements.get("year") if "statements" in doc else doc.get("year")
        basis_val = statements.get("basis") if "statements" in doc else doc.get("basis")

        # `evolution` shape actual: {trend, years:int, anomaly:bool, points:[{year,revenue,ebitda,net_income}]}
        evolution_raw = doc.get("evolution") if isinstance(doc.get("evolution"), dict) else None
        # Derivamos `years:list[int]` (ordenado descendente para preservar el
        # shape del proveedor) si el proveedor lo entrega implícitamente vía
        # `evolution.points`. Nunca inventamos años.
        years_list: list[int] = list(doc.get("years") or [])
        if not years_list and evolution_raw:
            points = evolution_raw.get("points") or []
            years_list = [int(p["year"]) for p in points if isinstance(p, dict) and p.get("year") is not None]

        kpis_raw = doc.get("kpis") or {}
        quality_raw = doc.get("financial_quality") or {}
        assessment_raw = doc.get("assessment") if isinstance(doc.get("assessment"), dict) else None
        explainability_raw = doc.get("explainability") if isinstance(doc.get("explainability"), dict) else None

        # `data_source` puede venir en root (shape previo) o dentro de `explainability` (F0.2).
        data_source = doc.get("data_source") or (
            explainability_raw.get("data_source") if explainability_raw else None
        )
        source_version = doc.get("source_version") or (
            explainability_raw.get("source_version") if explainability_raw else None
        )

        # `financial_quality` puede venir con {score, max, rules[], method, ai_used} (F0.2).
        # Copiamos score/assessment y llenamos strengths/weaknesses/risks desde `assessment` si existe.
        fq_kwargs: dict[str, Any] = {}
        if quality_raw:
            fq_kwargs["score"] = quality_raw.get("score")
            fq_kwargs["assessment"] = quality_raw.get("assessment")
            fq_kwargs["strengths"] = list(quality_raw.get("strengths") or [])
            fq_kwargs["weaknesses"] = list(quality_raw.get("weaknesses") or [])
            fq_kwargs["risks"] = list(quality_raw.get("risks") or [])
        if assessment_raw:
            # Enriquecemos con `assessment.*` cuando `financial_quality` no los trae (F0.2).
            if not fq_kwargs.get("strengths"):
                fq_kwargs["strengths"] = [str(s) for s in (assessment_raw.get("strengths") or [])]
            if not fq_kwargs.get("weaknesses"):
                fq_kwargs["weaknesses"] = [str(s) for s in (assessment_raw.get("weaknesses") or [])]
            if not fq_kwargs.get("risks"):
                fq_kwargs["risks"] = [str(s) for s in (assessment_raw.get("risks") or [])]

        return FinancialAnalysis(
            master_id=doc.get("master_id"),
            cif_normalized=doc.get("cif_normalized") or cif_norm,
            identity=doc.get("identity"),
            cnae_code=doc.get("cnae_code")
            or (doc.get("identity", {}) or {}).get("cnae_code"),
            cnae_section=doc.get("cnae_section")
            or (doc.get("identity", {}) or {}).get("cnae_section"),
            provincia=doc.get("provincia")
            or (doc.get("identity", {}) or {}).get("provincia"),
            has_financials=bool(doc.get("has_financials", False)),
            financials_source=doc.get("financials_source"),
            data_source=data_source,
            source_version=source_version,
            audited=doc.get("audited"),
            basis=basis_val,
            year=year_val,
            years=years_list,
            kpis=FinancialKpis(**kpis_raw) if kpis_raw else None,
            income_statement=IncomeStatement(**income_raw) if income_raw else None,
            balance_sheet=BalanceSheet(**balance_raw) if balance_raw else None,
            cashflow=cashflow_raw if isinstance(cashflow_raw, dict) else None,
            ratios=doc.get("ratios") or {},
            financial_quality=FinancialQuality(**fq_kwargs) if fq_kwargs else None,
            solvency=doc.get("solvency"),
            trend=doc.get("trend"),
            anomaly=doc.get("anomaly"),
            deterioration=doc.get("deterioration"),
            evolution=evolution_raw,
            valuation=doc.get("valuation") if isinstance(doc.get("valuation"), dict) else None,
            assessment=assessment_raw,
            ranking=doc.get("ranking") if isinstance(doc.get("ranking"), dict) else None,
            size_band=doc.get("size_band"),
            explainability=explainability_raw,
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
