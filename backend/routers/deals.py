from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import List, Optional

from database import deals_collection, companies_collection, ndas_collection, lois_collection
from models.deal import (
    DealCreate, DealInDB, DealResponse, DealUpdate, DealPublicResponse,
    Teaser, StatusHistory, AccessRequest, NdaSigned, Shortlist, Exclusivity
)
from models.user import UserResponse
from routers.auth import get_current_user
from utils.helpers import round_financial_display

router = APIRouter(prefix="/deals", tags=["Deals"])


def build_teaser_from_company(company: dict) -> dict:
    """Build teaser data from company info"""
    financials = company.get("financials", [])
    latest = sorted(financials, key=lambda x: x.get("year", 0), reverse=True)[0] if financials else {}
    
    revenue = latest.get("revenue", 0)
    ebitda = latest.get("ebitda", 0)
    
    return {
        "headline": company.get("trade_name") or company.get("legal_name"),
        "description": company.get("description", ""),
        "highlights": company.get("highlights", []),
        "revenue_display": round_financial_display(revenue) if revenue else "N/D",
        "ebitda_display": round_financial_display(ebitda) if ebitda else "N/D",
        "sector_display": ", ".join(company.get("sectors", [])[:3]),
        "geography_display": f"{company.get('city', '')}, {company.get('country', 'España')}",
        "year_founded": company.get("founded_year")
    }


@router.post("", response_model=DealResponse)
async def create_deal(
    deal_data: DealCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new deal (draft)"""
    if current_user.role not in ["seller", "advisor"]:
        raise HTTPException(status_code=403, detail="Only sellers and advisors can create deals")
    
    # Verify company ownership
    company = await companies_collection.find_one(
        {"company_id": deal_data.company_id},
        {"_id": 0}
    )
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if company["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to create deal for this company")
    
    # Check if company already has active deal
    existing_deal = await deals_collection.find_one({
        "company_id": deal_data.company_id,
        "status": {"$nin": ["closed", "dropped"]}
    })
    
    if existing_deal:
        raise HTTPException(status_code=400, detail="Company already has an active deal")
    
    # Build teaser from company data
    teaser = build_teaser_from_company(company)
    
    # Create deal
    deal = DealInDB(
        company_id=deal_data.company_id,
        owner_id=current_user.user_id,
        operation_types_allowed=deal_data.operation_types_allowed,
        asking_price=deal_data.asking_price,
        price_negotiable=deal_data.price_negotiable,
        teaser=Teaser(**teaser),
        status_history=[StatusHistory(
            status="draft",
            changed_by=current_user.user_id,
            notes="Deal created"
        )]
    )
    
    # Calculate readiness
    deal.readiness_checklist = [
        {"item": "Datos básicos de la compañía", "completed": bool(company.get("legal_name"))},
        {"item": "Datos financieros", "completed": bool(company.get("financials"))},
        {"item": "Descripción del negocio", "completed": bool(company.get("description"))},
        {"item": "Valoración calculada", "completed": bool(company.get("valuation"))},
        {"item": "Precio de venta definido", "completed": bool(deal_data.asking_price)},
    ]
    completed = sum(1 for item in deal.readiness_checklist if item["completed"])
    deal.readiness_score = (completed / len(deal.readiness_checklist)) * 100
    
    deal_dict = deal.model_dump()
    deal_dict["created_at"] = deal_dict["created_at"].isoformat()
    deal_dict["updated_at"] = deal_dict["updated_at"].isoformat()
    
    await deals_collection.insert_one(deal_dict)
    
    return DealResponse(**deal.model_dump())


@router.get("", response_model=List[DealResponse])
async def list_my_deals(
    status: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user)
):
    """List deals owned by current user"""
    filter_query = {"owner_id": current_user.user_id}
    
    if status:
        filter_query["status"] = status
    
    cursor = deals_collection.find(filter_query, {"_id": 0}).sort("created_at", -1)
    deals = await cursor.to_list(100)
    
    return [DealResponse(**d) for d in deals]


@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get deal details (owner only or admin)"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Check authorization
    if deal["owner_id"] != current_user.user_id and current_user.role != "admin":
        # Check if buyer has NDA access
        has_nda = any(nda["buyer_id"] == current_user.user_id for nda in deal.get("ndas_signed", []))
        if not has_nda:
            raise HTTPException(status_code=403, detail="Not authorized to view this deal")
    
    return DealResponse(**deal)


@router.put("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: str,
    update_data: DealUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update deal details"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {}
    
    for key, value in update_data.model_dump().items():
        if value is not None:
            if key == "teaser" and isinstance(value, dict):
                # Merge teaser updates
                current_teaser = deal.get("teaser", {})
                current_teaser.update(value)
                update_dict["teaser"] = current_teaser
            else:
                update_dict[key] = value
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await deals_collection.update_one(
        {"deal_id": deal_id},
        {"$set": update_dict}
    )
    
    updated = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    return DealResponse(**updated)


@router.post("/{deal_id}/activate", response_model=DealResponse)
async def activate_deal(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Activate deal for publication (requires active subscription)"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if deal["status"] != "draft":
        raise HTTPException(status_code=400, detail="Deal must be in draft status to activate")
    
    # TODO: Check subscription status
    # For now, allow activation without subscription for testing
    
    now = datetime.now(timezone.utc).isoformat()
    
    await deals_collection.update_one(
        {"deal_id": deal_id},
        {
            "$set": {
                "status": "published",
                "activated_at": now,
                "published_at": now,
                "updated_at": now
            },
            "$push": {
                "status_history": {
                    "status": "published",
                    "changed_at": now,
                    "changed_by": current_user.user_id,
                    "notes": "Deal activated and published"
                }
            }
        }
    )
    
    updated = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    return DealResponse(**updated)


@router.post("/{deal_id}/request-access")
async def request_deal_access(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Buyer requests access to a deal"""
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can request access")
    
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["status"] not in ["published"]:
        raise HTTPException(status_code=400, detail="Deal is not accepting access requests")
    
    # Check if already requested
    existing = any(req["buyer_id"] == current_user.user_id for req in deal.get("access_requests", []))
    if existing:
        raise HTTPException(status_code=400, detail="Access already requested")
    
    # TODO: Check buyer subscription
    
    await deals_collection.update_one(
        {"deal_id": deal_id},
        {
            "$push": {
                "access_requests": {
                    "buyer_id": current_user.user_id,
                    "requested_at": datetime.now(timezone.utc).isoformat(),
                    "status": "pending"
                }
            },
            "$inc": {"metrics.access_requests_count": 1},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Access requested successfully"}


@router.post("/{deal_id}/approve-access/{buyer_id}")
async def approve_access(
    deal_id: str,
    buyer_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Seller approves buyer access request"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update access request status
    await deals_collection.update_one(
        {"deal_id": deal_id, "access_requests.buyer_id": buyer_id},
        {"$set": {
            "access_requests.$.status": "approved",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Access approved"}


@router.post("/{deal_id}/sign-nda")
async def sign_nda(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Buyer signs NDA for a deal"""
    if current_user.role != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can sign NDAs")
    
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Check if access was approved
    access_request = next(
        (req for req in deal.get("access_requests", []) 
         if req["buyer_id"] == current_user.user_id and req["status"] == "approved"),
        None
    )
    
    if not access_request:
        raise HTTPException(status_code=400, detail="Access not approved yet")
    
    # Check if already signed
    existing_nda = any(nda["buyer_id"] == current_user.user_id for nda in deal.get("ndas_signed", []))
    if existing_nda:
        raise HTTPException(status_code=400, detail="NDA already signed")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Add NDA to deal
    await deals_collection.update_one(
        {"deal_id": deal_id},
        {
            "$push": {
                "ndas_signed": {
                    "buyer_id": current_user.user_id,
                    "signed_at": now,
                    "document_id": None
                }
            },
            "$inc": {"metrics.ndas_signed_count": 1},
            "$set": {
                "status": "nda" if deal["status"] == "published" else deal["status"],
                "updated_at": now
            }
        }
    )
    
    # Create NDA record
    from models.transactions import NdaInDB
    nda = NdaInDB(
        deal_id=deal_id,
        buyer_id=current_user.user_id
    )
    
    nda_dict = nda.model_dump()
    nda_dict["signed_at"] = nda_dict["signed_at"].isoformat()
    nda_dict["created_at"] = nda_dict["created_at"].isoformat()
    
    await ndas_collection.insert_one(nda_dict)
    
    return {"message": "NDA signed successfully", "nda_id": nda.nda_id}


@router.get("/{deal_id}/infomemo")
async def get_infomemo(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get infomemo (requires signed NDA)"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Check if user is owner or has signed NDA
    is_owner = deal["owner_id"] == current_user.user_id
    has_nda = any(nda["buyer_id"] == current_user.user_id for nda in deal.get("ndas_signed", []))
    
    if not is_owner and not has_nda and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="NDA required to view infomemo")
    
    if not deal.get("infomemo"):
        raise HTTPException(status_code=404, detail="Infomemo not generated yet")
    
    # Get company details for full info
    company = await companies_collection.find_one(
        {"company_id": deal["company_id"]},
        {"_id": 0}
    )
    
    return {
        "infomemo": deal["infomemo"],
        "company": {
            "legal_name": company.get("legal_name"),
            "trade_name": company.get("trade_name"),
            "city": company.get("city"),
            "country": company.get("country"),
            "website": company.get("website"),
            "linkedin": company.get("linkedin"),
            "sectors": company.get("sectors"),
            "founded_year": company.get("founded_year"),
            "employees_count": company.get("employees_count")
        }
    }


@router.post("/{deal_id}/shortlist")
async def create_shortlist(
    deal_id: str,
    buyer_ids: List[str],
    current_user: UserResponse = Depends(get_current_user)
):
    """Create shortlist of buyers"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await deals_collection.update_one(
        {"deal_id": deal_id},
        {
            "$set": {
                "shortlist": {
                    "buyers": buyer_ids,
                    "created_at": now,
                    "created_by": current_user.user_id
                },
                "status": "shortlist",
                "updated_at": now
            },
            "$push": {
                "status_history": {
                    "status": "shortlist",
                    "changed_at": now,
                    "changed_by": current_user.user_id,
                    "notes": f"Shortlist created with {len(buyer_ids)} buyers"
                }
            }
        }
    )
    
    return {"message": "Shortlist created"}


@router.post("/{deal_id}/grant-exclusivity/{buyer_id}")
async def grant_exclusivity(
    deal_id: str,
    buyer_id: str,
    days: int = 30,
    current_user: UserResponse = Depends(get_current_user)
):
    """Grant exclusivity to a buyer"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=days)
    
    await deals_collection.update_one(
        {"deal_id": deal_id},
        {
            "$set": {
                "exclusivity": {
                    "buyer_id": buyer_id,
                    "granted_at": now.isoformat(),
                    "expires_at": expires.isoformat(),
                    "terms": f"{days} days exclusivity"
                },
                "status": "exclusivity",
                "updated_at": now.isoformat()
            },
            "$push": {
                "status_history": {
                    "status": "exclusivity",
                    "changed_at": now.isoformat(),
                    "changed_by": current_user.user_id,
                    "notes": f"Exclusivity granted to buyer for {days} days"
                }
            }
        }
    )
    
    return {"message": "Exclusivity granted"}


@router.post("/{deal_id}/close")
async def close_deal(
    deal_id: str,
    final_price: float,
    buyer_id: str,
    notes: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Close a deal"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["owner_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await deals_collection.update_one(
        {"deal_id": deal_id},
        {
            "$set": {
                "closing": {
                    "closed_at": now,
                    "final_price": final_price,
                    "buyer_id": buyer_id,
                    "notes": notes,
                    "evidence_documents": []
                },
                "status": "closed",
                "updated_at": now
            },
            "$push": {
                "status_history": {
                    "status": "closed",
                    "changed_at": now,
                    "changed_by": current_user.user_id,
                    "notes": f"Deal closed at {final_price}€"
                }
            }
        }
    )
    
    return {"message": "Deal closed successfully"}


@router.post("/{deal_id}/drop")
async def drop_deal(
    deal_id: str,
    reason: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Drop/cancel a deal"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await deals_collection.update_one(
        {"deal_id": deal_id},
        {
            "$set": {
                "status": "dropped",
                "updated_at": now
            },
            "$push": {
                "status_history": {
                    "status": "dropped",
                    "changed_at": now,
                    "changed_by": current_user.user_id,
                    "notes": reason or "Deal dropped"
                }
            }
        }
    )
    
    return {"message": "Deal dropped"}


# Import timedelta at top level
from datetime import timedelta
