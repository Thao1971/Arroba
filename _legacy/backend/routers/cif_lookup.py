from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from models.user import UserResponse
from routers.auth import get_current_user
from services.cif_lookup_service import lookup_cif
from services.company_resolution_service import resolve_company

router = APIRouter(prefix="/cif", tags=["CIF Lookup"])


class CifLookupResponse(BaseModel):
    found: bool
    source: str
    company_info: dict
    financials: list


@router.get("/{cif}/lookup", response_model=CifLookupResponse)
async def lookup_cif_endpoint(
    cif: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Legacy CIF lookup — kept for backward compat."""
    if not cif or len(cif) < 5:
        raise HTTPException(status_code=400, detail="CIF inválido")
    result = await lookup_cif(cif)
    return CifLookupResponse(**result)


@router.post("/resolve")
async def resolve_company_endpoint(
    cif: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Canonical company resolution.
    Primary: CIS. Fallback: Iberinform direct (transitorio).
    Returns normalized canonical payload for ARROBA.
    """
    if not cif or len(cif) < 5:
        raise HTTPException(status_code=400, detail="CIF inválido")

    result = await resolve_company(
        cif=cif,
        requesting_user=current_user.email,
    )
    return result
