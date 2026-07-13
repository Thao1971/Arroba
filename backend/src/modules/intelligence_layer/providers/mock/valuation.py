"""MockValuationProvider — Sprint F0.3.

Devuelve `has_valuation=False` para cualquier CIF no específicamente sembrado.
En un futuro pueden añadirse fixtures a `master_companies_mock.valuation_mock`
para tests. R15: nunca inventa cifras.
"""
from __future__ import annotations

from src.core.database import get_db
from src.core.logging import get_logger
from src.modules.intelligence_layer.interfaces.valuation import (
    ValuationAnalysis,
    ValuationNotFoundError,
    ValuationProvider,
)

log = get_logger("intelligence_layer.provider.mock.valuation")


class MockValuationProvider(ValuationProvider):
    provider_name = "mock"

    async def analyze_valuation(self, identifier: str) -> ValuationAnalysis:
        ident = identifier.strip().upper()
        doc = None
        if ident.startswith("MC_"):
            doc = await get_db().master_companies_mock.find_one(
                {"master_company_id": ident.lower()}, {"_id": 0}
            )
        else:
            doc = await get_db().master_companies_mock.find_one({"cif": ident}, {"_id": 0})
        if not doc:
            raise ValuationNotFoundError(f"identifier={ident}")

        # Los mocks previos no traen bloque `valuation`; devolvemos has_valuation=False.
        return ValuationAnalysis(
            master_id=doc.get("master_company_id"),
            cif_normalized=doc.get("cif"),
            has_valuation=False,
        )


__all__ = ["MockValuationProvider"]
