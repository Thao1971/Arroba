from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List, Optional

from database import companies_collection
from models.company import (
    CompanyCreate, CompanyInDB, CompanyResponse, CompanyUpdate, 
    FinancialsUpdate, Valuation
)
from models.user import UserResponse
from routers.auth import get_current_user
from services.valuation_service import calculate_valuation
from utils.helpers import generate_acronym

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post("", response_model=CompanyResponse)
async def create_company(
    company_data: CompanyCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new company"""
    if current_user.role not in ["seller", "advisor"]:
        raise HTTPException(status_code=403, detail="Only sellers and advisors can create companies")
    
    # Check if user already has a company (for sellers)
    if current_user.role == "seller":
        existing = await companies_collection.find_one({"owner_id": current_user.user_id})
        if existing:
            raise HTTPException(status_code=400, detail="Seller already has a company")
    
    # Generate acronym
    acronym = generate_acronym(company_data.legal_name, company_data.founded_year)
    
    # Get company data and set the acronym
    company_dict = company_data.model_dump()
    company_dict["acronym"] = acronym
    
    company = CompanyInDB(
        **company_dict,
        owner_id=current_user.user_id,
        owner_type=current_user.role
    )
    
    company_dict = company.model_dump()
    company_dict["created_at"] = company_dict["created_at"].isoformat()
    company_dict["updated_at"] = company_dict["updated_at"].isoformat()
    
    await companies_collection.insert_one(company_dict)
    
    return CompanyResponse(**company.model_dump())


@router.get("", response_model=List[CompanyResponse])
async def list_my_companies(
    current_user: UserResponse = Depends(get_current_user)
):
    """List companies owned by current user"""
    cursor = companies_collection.find(
        {"owner_id": current_user.user_id},
        {"_id": 0}
    )
    
    companies = await cursor.to_list(100)
    return [CompanyResponse(**c) for c in companies]


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get company details"""
    company = await companies_collection.find_one(
        {"company_id": company_id},
        {"_id": 0}
    )
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check ownership
    if company["owner_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this company")
    
    return CompanyResponse(**company)


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    update_data: CompanyUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update company details"""
    company = await companies_collection.find_one(
        {"company_id": company_id},
        {"_id": 0}
    )
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this company")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await companies_collection.update_one(
        {"company_id": company_id},
        {"$set": update_dict}
    )
    
    updated = await companies_collection.find_one(
        {"company_id": company_id},
        {"_id": 0}
    )
    
    return CompanyResponse(**updated)


@router.post("/{company_id}/financials", response_model=CompanyResponse)
async def update_financials(
    company_id: str,
    financials_data: FinancialsUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update company financials"""
    company = await companies_collection.find_one(
        {"company_id": company_id},
        {"_id": 0}
    )
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Convert financials to dict
    financials_list = [f.model_dump() for f in financials_data.financials]
    
    update_dict = {
        "financials": financials_list,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if financials_data.valuation_inputs:
        update_dict["valuation_inputs"] = financials_data.valuation_inputs.model_dump()
    
    await companies_collection.update_one(
        {"company_id": company_id},
        {"$set": update_dict}
    )
    
    updated = await companies_collection.find_one(
        {"company_id": company_id},
        {"_id": 0}
    )
    
    return CompanyResponse(**updated)


@router.post("/{company_id}/calculate-valuation", response_model=CompanyResponse)
async def calculate_company_valuation(
    company_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Calculate valuation for a company"""
    company = await companies_collection.find_one(
        {"company_id": company_id},
        {"_id": 0}
    )
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not company.get("financials"):
        raise HTTPException(status_code=400, detail="No financial data available")
    
    # Calculate valuation
    valuation = calculate_valuation(company)
    
    await companies_collection.update_one(
        {"company_id": company_id},
        {"$set": {
            "valuation": valuation,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated = await companies_collection.find_one(
        {"company_id": company_id},
        {"_id": 0}
    )
    
    return CompanyResponse(**updated)


@router.get("/{company_id}/valuation")
async def get_valuation(
    company_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get valuation details for a company"""
    company = await companies_collection.find_one(
        {"company_id": company_id},
        {"_id": 0}
    )
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not company.get("valuation"):
        raise HTTPException(status_code=404, detail="Valuation not calculated yet")
    
    return company["valuation"]
