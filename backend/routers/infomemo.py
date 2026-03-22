from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from database import deals_collection, companies_collection, infomemos_collection
from models.user import UserResponse
from routers.auth import get_current_user
from services.infomemo_service import generate_infomemo

router = APIRouter(prefix="/infomemo", tags=["Infomemo"])


@router.post("/generate/{company_id}")
async def generate_company_infomemo(
    company_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Generate infomemo for a company using AI"""
    # Get company
    company = await companies_collection.find_one(
        {"company_id": company_id},
        {"_id": 0}
    )
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if company has financials
    if not company.get("financials"):
        raise HTTPException(status_code=400, detail="Company must have financial data to generate infomemo")
    
    # Get active deal for the company
    deal = await deals_collection.find_one(
        {"company_id": company_id, "status": {"$nin": ["closed", "dropped"]}},
        {"_id": 0}
    )
    
    if not deal:
        # Create a minimal deal context if no deal exists
        deal = {
            "operation_types_allowed": ["full_sale"],
            "asking_price": None,
            "price_negotiable": True
        }
    
    # Generate infomemo
    infomemo = await generate_infomemo(company, deal)
    
    # Save infomemo to collection
    infomemo_doc = {
        "company_id": company_id,
        "deal_id": deal.get("deal_id"),
        **infomemo,
        "created_by": current_user.user_id
    }
    
    await infomemos_collection.insert_one(infomemo_doc)
    
    # Update deal with infomemo if exists
    if deal.get("deal_id"):
        await deals_collection.update_one(
            {"deal_id": deal["deal_id"]},
            {"$set": {
                "infomemo": infomemo,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return {
        "message": "Infomemo generated successfully",
        "infomemo": infomemo
    }


@router.get("/{deal_id}")
async def get_deal_infomemo(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get infomemo for a deal"""
    deal = await deals_collection.find_one(
        {"deal_id": deal_id},
        {"_id": 0}
    )
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Check authorization - owner or signed NDA
    is_owner = deal["owner_id"] == current_user.user_id
    has_nda = any(nda["buyer_id"] == current_user.user_id for nda in deal.get("ndas_signed", []))
    
    if not is_owner and not has_nda and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="NDA required to view infomemo")
    
    if not deal.get("infomemo"):
        raise HTTPException(status_code=404, detail="Infomemo not generated")
    
    return deal["infomemo"]


@router.put("/{deal_id}")
async def update_infomemo(
    deal_id: str,
    content: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update/edit infomemo content"""
    deal = await deals_collection.find_one(
        {"deal_id": deal_id},
        {"_id": 0}
    )
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    current_infomemo = deal.get("infomemo", {})
    new_version = current_infomemo.get("version", 0) + 1
    
    updated_infomemo = {
        "generated_at": current_infomemo.get("generated_at", datetime.now(timezone.utc).isoformat()),
        "content": content,
        "version": new_version,
        "file_id": current_infomemo.get("file_id"),
        "edited_at": datetime.now(timezone.utc).isoformat(),
        "edited_by": current_user.user_id
    }
    
    await deals_collection.update_one(
        {"deal_id": deal_id},
        {"$set": {
            "infomemo": updated_infomemo,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Infomemo updated", "version": new_version}
