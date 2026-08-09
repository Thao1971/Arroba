"""MockRecommendationProvider — compradores de ejemplo (modo mock)."""
from __future__ import annotations

from datetime import UTC, datetime

from src.modules.intelligence_layer.interfaces.recommendation import (
    BuyerItem,
    RecommendationProvider,
    RecommendationSet,
)

INTERNAL_ENGINE_VERSION = "arroba-recommendation-v1"


class MockRecommendationProvider(RecommendationProvider):
    provider_name = "mock"

    async def buyers(self, cif: str, limit: int = 10) -> RecommendationSet:
        cif_norm = cif.upper().strip()
        items = [
            BuyerItem(
                master_id="mock_meridional",
                name="Grupo Hotelero Meridional",
                sector="Hostelería",
                recommendation_type="strategic",
                score=0.91,
                fit_dimensions={"geografía": 0.95, "segmento": 0.92, "tamaño": 0.88},
                reason="Cadena hotelera sin presencia en la zona que quiere entrar en el nicho termal.",
            ),
            BuyerItem(
                master_id="mock_iberia_pe",
                name="Iberia Leisure Capital (PE)",
                sector="Private equity",
                recommendation_type="financial",
                score=0.85,
                fit_dimensions={"tesis": 0.93, "capacidad": 0.90, "segmento": 0.82},
                reason="Fondo con una plataforma hotelera en construcción que busca un add-on rentable.",
            ),
        ][:limit]
        return RecommendationSet(
            master_id=f"mock_{cif_norm}",
            cif_normalized=cif_norm,
            recommendation_type="buyers",
            count=len(items),
            recommendations=items,
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )

    async def opportunities(self, cif: str, limit: int = 10) -> RecommendationSet:
        cif_norm = cif.upper().strip()
        items = [
            BuyerItem(
                master_id="mock_opp_rollup",
                name="Consolidación termal en Castilla y León",
                sector="Roll-up",
                recommendation_type="opportunity",
                score=0.83,
                fit_dimensions={"fragmentación": 0.88, "sinergia": 0.80},
                reason="Mercado fragmentado con varios operadores pequeños integrables.",
            ),
            BuyerItem(
                master_id="mock_opp_expansion",
                name="Expansión a balnearios en el norte",
                sector="Crecimiento",
                recommendation_type="opportunity",
                score=0.74,
                fit_dimensions={"demanda": 0.79, "encaje": 0.71},
                reason="Demanda creciente de bienestar; territorio complementario.",
            ),
        ][:limit]
        return RecommendationSet(
            master_id=f"mock_{cif_norm}",
            cif_normalized=cif_norm,
            recommendation_type="opportunities",
            count=len(items),
            recommendations=items,
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )


__all__ = ["MockRecommendationProvider"]
