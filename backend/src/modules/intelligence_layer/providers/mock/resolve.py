"""MockResolveProvider — Sprint F0.2.

Resuelve CIF → master_id desde la colección `master_companies_mock` cuando
`AGENCY_TOOL_MODE=mock`. Devuelve `ResolveNotFoundError` si no existe.

R15: sólo devuelve datos reales de la propia colección (no interpola).
"""
from __future__ import annotations

from src.core.database import get_db
from src.core.logging import get_logger
from src.modules.intelligence_layer.interfaces.resolve import (
    ResolveNotFoundError,
    ResolveProvider,
    ResolveResult,
)

log = get_logger("intelligence_layer.provider.mock.resolve")


class MockResolveProvider(ResolveProvider):
    provider_name = "mock"

    async def resolve_by_cif(self, cif: str) -> ResolveResult:
        cif_norm = cif.upper().strip()
        doc = await get_db().master_companies_mock.find_one(
            {"cif": cif_norm}, {"_id": 0}
        )
        if not doc:
            raise ResolveNotFoundError(f"cif={cif_norm}")
        return ResolveResult(
            cif=cif_norm,
            master_id=doc["master_company_id"],
            canonical_name=doc.get("legal_name"),
            match_type="cif_exact",
            score=1.0,
        )


__all__ = ["MockResolveProvider"]
