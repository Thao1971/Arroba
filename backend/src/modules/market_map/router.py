"""FastAPI router for the market_map module — Mapa Empresarial.

Publico, sin `get_current_user`: los datos que sirve (demografia nacional,
rankings de territorio/sector, cruces) son los mismos que Intel ya expone en
`/api/v1/public/*` sin autenticacion. Mismo criterio de apertura que
`/resultados` en el frontend.

Todas las respuestas son 200 con campos `None`/lista vacia en caso de fallo
upstream (R15 - empty honesto): esta pantalla mezcla muchas secciones
independientes en una sola carga, y un 502 en una no debe romper el resto.
"""
from __future__ import annotations

from fastapi import APIRouter, Path, Query

from src.modules.market_map import service

router = APIRouter(prefix="/api/market-map", tags=["market_map"])

_GEO_LEVELS = "^(ccaa|province)$"
_SECTOR_LEVELS = "^(section|division|group)$"
# 2026-09-10 (Home nueva): "sectores mas dinamicos" en Home mezcla niveles CNAE
# (seccion + division) en un unico ranking, tal y como ya lo expone Intel en
# `/sector-intelligence/top-dynamic?level=section,division`. Solo `/sectors`
# necesita esto -- `/sectors/emerging` y `/sectors/{code}/signals` operan
# sobre un unico nivel/sector y se quedan con `_SECTOR_LEVELS`.
_SECTOR_LEVELS_MULTI = "^(section|division|group)(,(section|division|group))*$"
_METRICS = "^(dynamism|size|growth|activity)$"


@router.get("/national")
async def get_national(months: int = Query(12, ge=1, le=36)) -> dict:
    overview = await service.national_overview()
    history = await service.national_history(months)
    return {"kpis": overview, "evolution": history, "months": months}


@router.get("/territories")
async def get_territories(
    level: str = Query("ccaa", regex=_GEO_LEVELS),
    metric: str = Query("dynamism", regex=_METRICS),
    limit: int = Query(10, ge=1, le=52),
) -> dict:
    territories = await service.geo_territories(level, metric, limit)
    return {"level": level, "metric": metric, "territories": territories, "count": len(territories)}


@router.get("/territory/{level}/{code}")
async def get_territory_detail(
    level: str = Path(..., regex=_GEO_LEVELS),
    code: str = Path(..., min_length=1, max_length=8),
) -> dict:
    """Ficha de un territorio. `province` -> tarjeta unica. `ccaa` -> tarjeta
    de la CCAA + `provinces` (sus provincias, para un futuro drill-down) -
    Intel devuelve shapes distintas para cada nivel; aqui se normalizan a un
    unico `territory` plano para que el front no tenga que conocer el detalle.
    """
    raw = await service.geo_territory_detail(level, code)
    if not raw:
        return {"level": level, "code": code, "territory": None, "provinces": None}
    if level == "province":
        return {"level": level, "code": code, "territory": raw.get("province"), "provinces": None}
    return {
        "level": level,
        "code": code,
        "territory": raw.get("ccaa"),
        "provinces": raw.get("provinces"),
    }


@router.get("/sectors")
async def get_sectors(
    level: str = Query(
        "section",
        regex=_SECTOR_LEVELS_MULTI,
        description="Uno o varios niveles CNAE separados por coma (ej. 'section,division').",
    ),
    metric: str = Query("dynamism", regex=_METRICS),
    limit: int = Query(10, ge=1, le=200),
) -> dict:
    sectors = await service.sector_ranking(metric, level, limit)
    return {"level": level, "metric": metric, "sectors": sectors, "count": len(sectors)}


@router.get("/sectors/emerging")
async def get_sectors_emerging(
    level: str = Query("section", regex=_SECTOR_LEVELS),
) -> dict:
    sectors = await service.sector_emerging(level)
    return {"level": level, "sectors": sectors, "count": len(sectors)}


@router.get("/cross/sectors-in/{geo_level}/{geo_code}")
async def get_cross_sectors_in(
    geo_level: str = Path(..., regex=_GEO_LEVELS),
    geo_code: str = Path(..., min_length=1, max_length=8),
    limit: int = Query(21, ge=1, le=21),
) -> dict:
    sectors = await service.cross_sectors_in(geo_level, geo_code, limit)
    return {"geo_level": geo_level, "geo_code": geo_code, "sectors": sectors, "count": len(sectors)}


@router.get("/cross/territory-for/{cnae_section}")
async def get_cross_territory_for(
    cnae_section: str = Path(..., min_length=1, max_length=2),
    geo_level: str = Query("province", regex=_GEO_LEVELS),
    limit: int = Query(20, ge=1, le=52),
) -> dict:
    territories = await service.cross_territory_for(cnae_section, geo_level, limit)
    return {
        "cnae_section": cnae_section.upper(),
        "geo_level": geo_level,
        "territories": territories,
        "count": len(territories),
    }


@router.get("/sector/{cnae_code}")
async def get_sector_detail(
    cnae_code: str = Path(..., min_length=1, max_length=4),
) -> dict:
    """Ficha sectorial: scores + breakdown real de actividad (contratacion
    publica/BORME/Iberinform) + hijos en la jerarquia CNAE + preview de
    empresas si es grupo (nivel mas fino, sin hijos)."""
    raw = await service.sector_detail(cnae_code)
    if not raw:
        return {"cnae_code": cnae_code, "sector": None, "children": [], "companies_preview": None}
    return {
        "cnae_code": cnae_code,
        "sector": raw.get("sector"),
        "children": raw.get("children") or [],
        "children_count": raw.get("children_count", 0),
        "companies_preview": raw.get("companies_preview"),
    }


@router.get("/sector/{cnae_code}/companies")
async def get_sector_companies(
    cnae_code: str = Path(..., min_length=1, max_length=4),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    """Empresas reales del sector (universo ARROBA), ordenadas por facturacion
    - "empresas destacadas". Ver `data_caveat` en la respuesta."""
    raw = await service.sector_companies(cnae_code, limit, offset)
    if not raw:
        return {"cnae_code": cnae_code, "companies": [], "pagination": None, "data_caveat": None}
    return {"cnae_code": cnae_code, **raw}


@router.get("/sector/{cnae_code}/signals")
async def get_sector_signals(
    cnae_code: str = Path(..., min_length=1, max_length=4),
    level: str = Query("section", regex=_SECTOR_LEVELS),
    limit: int = Query(20, ge=1, le=50),
) -> dict:
    """Radar de senales del sector (real, signal-intelligence) - analiza en
    vivo las empresas del universo ARROBA en este CNAE."""
    raw = await service.sector_signals(cnae_code, level, limit)
    if not raw:
        return {
            "cnae_code": cnae_code, "level": level, "companies_analyzed": 0,
            "counts_by_category": {}, "counts_by_type": {}, "top_opportunities": [],
        }
    return {"cnae_code": cnae_code, "level": level, **raw}
