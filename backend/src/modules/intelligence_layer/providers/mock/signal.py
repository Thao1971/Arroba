"""MockSignalProvider — señales de ejemplo para desarrollo (modo mock).

No llama a la red. Devuelve un `SignalAnalysis` determinista para que la ficha
se pueda ver sin el motor real. En modo `real` se usa AgencyToolSignalProvider.
"""
from __future__ import annotations

from datetime import UTC, datetime

from src.modules.intelligence_layer.interfaces.signal import (
    SignalAnalysis,
    SignalItem,
    SignalScore,
    SignalProvider,
)

INTERNAL_ENGINE_VERSION = "arroba-signal-v1"


class MockSignalProvider(SignalProvider):
    provider_name = "mock"

    async def analyze(self, cif: str) -> SignalAnalysis:
        cif_norm = cif.upper().strip()
        items = [
            SignalItem(
                signal_id="mock-growth",
                signal_type="revenue_growth",
                category="opportunity",
                severity="medium",
                polarity="positive",
                title="Crecimiento de ingresos sostenido",
                confidence=0.72,
                detected_at="2026-06-30",
            ),
            SignalItem(
                signal_id="mock-succession",
                signal_type="succession_risk",
                category="risk",
                severity="low",
                polarity="negative",
                title="Edad media del consejo elevada",
                confidence=0.55,
                detected_at="2026-05-15",
            ),
        ]
        return SignalAnalysis(
            master_id=f"mock_{cif_norm}",
            cif_normalized=cif_norm,
            signals=items,
            score=SignalScore(signal_score=68, method="mock"),
            counts_by_category={"opportunity": 1, "risk": 1},
            engine_version=INTERNAL_ENGINE_VERSION,
            generated_at=datetime.now(UTC),
        )


__all__ = ["MockSignalProvider"]
