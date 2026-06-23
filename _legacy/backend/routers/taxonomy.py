from fastapi import APIRouter
from services.taxonomy import TAXONOMY, get_flat_subcategories, LEGACY_SECTOR_MAPPING

router = APIRouter(prefix="/taxonomy", tags=["Taxonomy"])


@router.get("/categories")
async def list_categories():
    """Get full taxonomy hierarchy"""
    return TAXONOMY


@router.get("/subcategories")
async def list_subcategories():
    """Get flat list of all subcategories with parent info"""
    return get_flat_subcategories()


@router.get("/legacy-mapping")
async def get_legacy_mapping():
    """Get mapping from old sector IDs to new taxonomy"""
    return LEGACY_SECTOR_MAPPING
