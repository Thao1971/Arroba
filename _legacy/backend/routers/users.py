from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List, Optional

from database import users_collection
from models.user import (
    UserResponse, UpdateUserProfile, UpdateBuyerProfile, BuyerProfile
)
from routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: UserResponse = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    update_data: UpdateUserProfile,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update current user profile"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        return current_user
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await users_collection.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_dict}
    )
    
    user_doc = await users_collection.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return UserResponse(**user_doc)


@router.put("/me/buyer-profile", response_model=UserResponse)
async def update_buyer_profile(
    profile_data: UpdateBuyerProfile,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update buyer profile"""
    if current_user.role != "buyer":
        raise HTTPException(status_code=400, detail="User is not a buyer")
    
    current_profile = current_user.buyer_profile or BuyerProfile()
    profile_dict = current_profile.model_dump()
    for key, value in profile_data.model_dump().items():
        if value is not None:
            profile_dict[key] = value
    
    # Compute profile_complete
    profile_dict["profile_complete"] = bool(
        profile_dict.get("type") and
        profile_dict.get("operation_types") and
        (profile_dict.get("taxonomy_categories") or profile_dict.get("sectors")) and
        profile_dict.get("ticket_min") is not None and
        profile_dict.get("revenue_range_min") is not None and
        profile_dict.get("ebitda_range_min") is not None
    )
    
    await users_collection.update_one(
        {"user_id": current_user.user_id},
        {"$set": {
            "buyer_profile": profile_dict,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Track event
    if profile_dict["profile_complete"]:
        from services.events_service import track_event
        await track_event("BUYER_PROFILE_COMPLETED", user_id=current_user.user_id)
        # Trigger match alerts for this buyer
        from services.match_alerts_service import check_and_trigger_matches_for_buyer
        await check_and_trigger_matches_for_buyer(current_user.user_id)
    
    user_doc = await users_collection.find_one(
        {"user_id": current_user.user_id}, {"_id": 0}
    )
    return UserResponse(**user_doc)


@router.put("/me/role")
async def change_role(
    role: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Change user role (buyer, seller, advisor)"""
    if role not in ["buyer", "seller", "advisor"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    update_data = {
        "role": role,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Initialize profile for new role if needed
    if role == "buyer" and not current_user.buyer_profile:
        update_data["buyer_profile"] = BuyerProfile().model_dump()
    elif role == "seller" and not current_user.seller_profile:
        update_data["seller_profile"] = {"company_id": None}
    elif role == "advisor" and not current_user.advisor_profile:
        update_data["advisor_profile"] = {"firm_name": None, "mandate_ids": []}
    
    await users_collection.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_data}
    )
    
    user_doc = await users_collection.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return UserResponse(**user_doc)
