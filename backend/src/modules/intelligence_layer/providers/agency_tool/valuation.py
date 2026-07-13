"""AgencyToolValuationProvider — Sprint F0.3.

Proxy Zero Coupling contra el endpoint canónico:

    POST /api/v1/financial-intelligence/valuation
        {"identifier": "<CIF>" | "<master_id>"}
        → 200 { master_id, cif_normalized, valuation{…}, engine_version, generated_at }

R5: `engine_version` del proveedor NUNCA se propaga al contrato interno.
R12/P3: sólo rutas públicas con `X-API-Key`. `valuation.bridge_components`,
`scenarios` y `sensitivity` NO se rellenan (motor no los expone en F0.3).
"""
from __future__ import annotations

from typing import Any

from src.core.logging import get_logger
from src.modules.intelligence_layer.interfaces.valuation import (
    ValuationAnalysis,
    ValuationLineage,
    ValuationNotFoundError,
    ValuationProvider,
    ValuationProviderError,
    ValuationRange,
)
from src.modules.intelligence_layer.providers.agency_tool.client import (
    AgencyToolClient,
    AgencyToolHTTPError,
    get_agency_tool_client,
)

log = get_logger("intelligence_layer.provider.agency_tool.valuation")

VALUATION_PATH = "/api/v1/financial-intelligence/valuation"

METHOD_LABEL_MAP = {
    "ev_ebitda": "EV/EBITDA sectorial",
    "dcf": "Flujos de caja descontados",
    "revenue_multiple": "Múltiplo sobre ingresos",
    "book_value": "Valor contable",
    "peer_comparables": "Comparables cotizados",
}


def _confidence_level(value: float | None) -> str | None:
    if value is None:
        return None
    if value >= 0.75:
        return "high"
    if value >= 0.5:
        return "medium"
    return "low"


class AgencyToolValuationProvider(ValuationProvider):
    provider_name = "agency_tool"

    def __init__(self, client: AgencyToolClient | None = None) -> None:
        self._client = client or get_agency_tool_client()

    async def analyze_valuation(self, identifier: str) -> ValuationAnalysis:
        ident = identifier.strip()
        try:
            resp = await self._client.request(
                "POST",
                VALUATION_PATH,
                json={"identifier": ident},
            )
        except AgencyToolHTTPError as exc:
            raise ValuationProviderError(str(exc), error_class=exc.error_class) from exc

        if resp.status_code == 404:
            raise ValuationNotFoundError(f"identifier={ident}")
        if resp.status_code in (401, 403):
            raise ValuationProviderError(
                f"valuation unauthorized {resp.status_code}",
                error_class="unauthorized",
            )
        if resp.status_code >= 500:
            raise ValuationProviderError(
                f"valuation upstream {resp.status_code}",
                error_class="server_5xx",
            )
        if resp.status_code != 200:
            raise ValuationProviderError(
                f"valuation unexpected status {resp.status_code}",
                error_class="client_4xx",
            )
        try:
            data: dict[str, Any] = resp.json()
        except ValueError as exc:
            raise ValuationProviderError(
                f"invalid JSON body: {exc}",
                error_class="server_5xx",
            ) from exc

        v = data.get("valuation") or {}
        method = v.get("method")
        method_label = METHOD_LABEL_MAP.get(str(method)) if method else None
        confidence = v.get("confidence")
        confidence_level = _confidence_level(confidence)

        # Range con `central` derivado del enterprise_value.
        r = v.get("range") or {}
        canonical_range = ValuationRange(
            low=r.get("low"),
            central=v.get("enterprise_value"),
            high=r.get("high"),
        )

        lineage_raw = v.get("lineage") or {}
        lineage = (
            ValuationLineage(
                financials_source=lineage_raw.get("financials_source"),
                basis=lineage_raw.get("basis"),
                year=lineage_raw.get("year"),
            )
            if lineage_raw
            else None
        )

        has_valuation = bool(v) and v.get("enterprise_value") is not None

        return ValuationAnalysis(
            master_id=data.get("master_id"),
            cif_normalized=data.get("cif_normalized"),
            method=method,
            method_label=method_label,
            multiple=v.get("multiple"),
            multiple_basis=v.get("multiple_basis"),
            enterprise_value=v.get("enterprise_value"),
            equity_value=v.get("equity_value"),
            range=canonical_range if (canonical_range.low or canonical_range.high or canonical_range.central) else None,
            confidence=confidence,
            confidence_level=confidence_level,
            hypotheses=list(v.get("hypotheses") or []),
            lineage=lineage,
            bridge_components=v.get("bridge_components"),
            scenarios=v.get("scenarios"),
            sensitivity=v.get("sensitivity") if isinstance(v.get("sensitivity"), dict) else None,
            has_valuation=has_valuation,
        )


__all__ = ["AgencyToolValuationProvider", "VALUATION_PATH", "METHOD_LABEL_MAP"]
