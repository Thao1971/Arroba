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
from src.modules.intelligence_layer.interfaces.ficha import (
    CompanyFicha,
    INTERNAL_FICHA_ENGINE_VERSION,
)
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
FICHA_AGGREGATE_PATH = "/api/v1/company/{cif}/ficha"  # B-2.4 · agregador Intel

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

    # ---------- ficha aggregator (B-2.4) ----------
    async def fetch_ficha(self, cif: str) -> CompanyFicha:
        """`GET /company/{cif}/ficha` — response agregador con todos los bloques.

        Reutiliza `_map_analyze` para el bloque `finances` (preserva `ranking`
        B-2.1 y `cash_flow` B-2.5). Resto de bloques (`identity`, `ownership`,
        `governance`, `events`, `ranking` top-level) son passthrough puro
        (`dict | None`), respetando R15 (no derivar, no filtrar).
        """
        cif_norm = cif.upper().strip()
        path = FICHA_AGGREGATE_PATH.format(cif=cif_norm)
        try:
            resp = await self._client.request("GET", path)
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

        # `finances`: reutilizamos `_map_analyze` para preservar el contrato
        # `FinancialAnalysis` intacto (mismo shape que `/financial-analysis`,
        # con ranking + cash_flow ya cableados en HARDENING-003 / HARDENING-005).
        finances_raw = data.get("finances")
        finances = (
            self._map_analyze(cif_norm, finances_raw)
            if isinstance(finances_raw, dict) and finances_raw
            else None
        )
        return CompanyFicha(
            cif_normalized=data.get("cif") or data.get("cif_normalized") or cif_norm,
            master_id=data.get("master_id"),
            finances=finances,
            identity=data.get("identity") if isinstance(data.get("identity"), dict) else None,
            ownership=data.get("ownership") if isinstance(data.get("ownership"), dict) else None,
            governance=data.get("governance") if isinstance(data.get("governance"), dict) else None,
            events=data.get("events") if isinstance(data.get("events"), dict) else None,
            ranking=data.get("ranking") if isinstance(data.get("ranking"), dict) else None,
            # HARDENING-012 (2026-08-12) · passthrough puro del bloque `market`
            # top-level entregado por Intel (`arroba-company-ficha-v1`).
            market=data.get("market") if isinstance(data.get("market"), dict) else None,
            # HARDENING-014 (2026-08-13) · passthrough puro del bloque `control_graph`
            # top-level (grafo de propiedad · shareholders / participadas / UBO / nodes / edges / narrative).
            # La anonimización DPD para visitante anónimo se aplica en el endpoint
            # `get_company_ficha` (`_anonymize_control_graph`), no aquí. Se preserva el
            # shape Intel exacto para consumo auth.
            control_graph=data.get("control_graph") if isinstance(data.get("control_graph"), dict) else None,
            # HARDENING-024 (2026-08-14) · passthrough puro del bloque `opportunity`
            # top-level entregado por Intel (thesis.narrative + chips). Bloque gateado:
            # la nulificación DPD para visitante anónimo se aplica en el endpoint
            # `get_company_ficha` (`opportunity: None` en `update_dict`).
            opportunity=data.get("opportunity") if isinstance(data.get("opportunity"), dict) else None,
            engine_version=INTERNAL_FICHA_ENGINE_VERSION,
        )

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
            # Fase 5 (2026-09-01) · passthrough puro, mismo patrón que HARDENING-021
            # con `provenance` (antes se descartaba en silencio por `extra="ignore"`).
            iberinform_ratios=doc.get("iberinform_ratios") if isinstance(doc.get("iberinform_ratios"), dict) else None,
            financial_quality=FinancialQuality(**fq_kwargs) if fq_kwargs else None,
            solvency=doc.get("solvency"),
            trend=doc.get("trend"),
            anomaly=doc.get("anomaly"),
            deterioration=doc.get("deterioration"),
            evolution=evolution_raw,
            valuation=doc.get("valuation") if isinstance(doc.get("valuation"), dict) else None,
            assessment=assessment_raw,
            ranking=doc.get("ranking") if isinstance(doc.get("ranking"), dict) else None,
            cash_flow=statements.get("cash_flow") if isinstance(statements.get("cash_flow"), dict) else None,
            size_band=doc.get("size_band"),
            explainability=explainability_raw,
            # HARDENING-021 · Fase 2 (2026-08-13) · passthrough procedencia por métrica.
            # Fix del silent drop análogo al de `comparables` (HARDENING-020).
            provenance=doc.get("provenance") if isinstance(doc.get("provenance"), dict) else None,
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
