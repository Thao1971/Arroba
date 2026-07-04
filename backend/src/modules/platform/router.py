"""Public `platform` endpoints (SPRINT 1 · Regla 4).

Este módulo expone alias canónicos de arroba.com para que el frontend nunca
tenga que hablar en lenguaje del proveedor interno de datos:

    GET /api/platform/stats        → estadísticas agregadas de plataforma

Delegan en la implementación existente. La contract-shape es idéntica salvo
por el campo `provenance` (`demo | live`), que sustituye al legacy `source`
(`mock | real`) para cumplir con C16 (Regla 5: cero ocurrencias de las
palabras prohibidas en el código de producto del frontend).
"""

from fastapi import APIRouter, Response

from src.modules.agency_tool_adapter import service as _stats_service
from src.modules.agency_tool_adapter.models import PlatformStats

router = APIRouter(prefix="/platform", tags=["platform"])


def _to_provenance(source: str) -> str:
    """Traduce el campo legacy `source` a la nomenclatura canónica.

    - `mock` → `demo`  (dataset de demostración local)
    - `real` → `live`  (proveedor real en producción)
    - cualquier otro valor se preserva tal cual para no romper contratos.
    """
    if source == "mock":
        return "demo"
    if source == "real":
        return "live"
    return source


@router.get(
    "/stats",
    responses={
        200: {
            "description": (
                "Estadísticas agregadas de la plataforma arroba.com. Público "
                "(sin autenticación). El header `X-Provenance` indica `demo` "
                "o `live`. El body incluye el campo `provenance` con la "
                "misma semántica canónica."
            )
        },
        404: {"description": "Stats singleton not seeded yet."},
    },
)
async def get_platform_stats(response: Response) -> dict:
    """Alias canónico frontal para `platform-stats`.

    El shape del body es idéntico al legacy, pero traducimos el campo
    `source` a `provenance` para que el frontend hable únicamente en la
    nomenclatura de arroba (Regla 5 · C16).
    """
    data = await _stats_service.get_platform_stats()
    body = data.model_dump()
    prov = _to_provenance(str(body.get("source", "")))
    # Mantenemos ambos campos temporalmente para no romper consumidores
    # legacy, pero el canónico es `provenance`.
    body["provenance"] = prov
    response.headers["X-Provenance"] = prov
    return body
