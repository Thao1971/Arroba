from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from models.user import UserResponse
from routers.auth import get_current_user
from services.cif_lookup_service import lookup_cif

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
    """
    Look up financial data by CIF.
    Priority: CIS (internal cache) → Iberinform → Manual fallback
    """
    if not cif or len(cif) < 5:
        raise HTTPException(status_code=400, detail="CIF inválido")

    result = await lookup_cif(cif)
    return CifLookupResponse(**result)
