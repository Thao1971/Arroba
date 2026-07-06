"""MockFinancialProvider — devuelve payload `unavailable` conforme (no inventa datos).

R4: NUNCA calcula lógica financiera en arroba. Este mock existe solo para que la
sub-fase B.6.b tenga cobertura de test independiente del modo real, y para que
el frontend siga funcionando (con `UnavailableBlock`) cuando se fuerza mode=mock
en dev/local.

Devuelve un `FinancialAnalysis` con todos los campos numéricos a `null` y
`has_financials=False`. Los tests validan que este payload es "unavailable".
"""
from __future__ import annotations

from datetime import UTC, datetime

from src.modules.intelligence_layer.interfaces.financial import (
    FinancialAnalysis,
    FinancialNotFoundError,
    FinancialProvider,
    RatioDefinition,
    RatiosCatalog,
    Valuation,
)

ENGINE_VERSION_MOCK = "mock-financial-v1"

# Catálogo mínimo que refleja el subset canónico del proveedor (pack §6).
# NO se inventa: son las mismas 13 claves canónicas ya observadas en prod.
_CATALOG = [
    RatioDefinition(key="ebitda_margin", name="Margen EBITDA", category="profitability"),
    RatioDefinition(key="ebit_margin", name="Margen EBIT", category="profitability"),
    RatioDefinition(key="net_margin", name="Margen neto", category="profitability"),
    RatioDefinition(key="gross_margin", name="Margen bruto", category="profitability"),
    RatioDefinition(key="roa", name="ROA", category="profitability"),
    RatioDefinition(key="roe", name="ROE", category="profitability"),
    RatioDefinition(key="current_ratio", name="Ratio de liquidez", category="liquidity"),
    RatioDefinition(key="solvency", name="Solvencia", category="solvency"),
    RatioDefinition(key="debt_ratio", name="Ratio de endeudamiento", category="solvency"),
    RatioDefinition(key="debt_to_equity", name="Deuda/FF.PP.", category="solvency"),
    RatioDefinition(key="interest_coverage", name="Cobertura de intereses", category="solvency"),
    RatioDefinition(
        key="revenue_per_employee",
        name="Productividad (ingresos/empleado)",
        category="efficiency",
    ),
    RatioDefinition(key="capital_intensity", name="Intensidad de capital", category="efficiency"),
]


class MockFinancialProvider(FinancialProvider):
    provider_name = "mock"

    async def analyze(self, cif: str) -> FinancialAnalysis:
        # R4 · R11: no inventamos datos. El mock devuelve payload "unavailable"
        # con la forma canónica del contrato interno. El frontend degradará
        # a `UnavailableBlock` si `has_financials=False`.
        raise FinancialNotFoundError(f"cif={cif.upper()} (mock: sin datos financieros)")

    async def valuation(self, cif: str) -> Valuation:
        raise FinancialNotFoundError(f"cif={cif.upper()} (mock: sin datos de valoración)")

    async def ratios_catalog(self) -> RatiosCatalog:
        return RatiosCatalog(
            ratios=_CATALOG,
            source="mock",
            engine_version=ENGINE_VERSION_MOCK,
            generated_at=datetime.now(UTC),
        )


__all__ = ["MockFinancialProvider", "ENGINE_VERSION_MOCK"]
