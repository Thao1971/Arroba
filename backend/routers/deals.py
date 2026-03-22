from fastapi import APIRouter, HTTPException, Depends, Query, Request
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from database import deals_collection, companies_collection, ndas_collection, lois_collection, users_collection
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
    
    # If deal is published, recalculate matching
    if updated.get("status") in ("published", "nda", "evaluation"):
        from services.match_alerts_service import check_and_trigger_matches_for_deal
        await check_and_trigger_matches_for_deal(deal_id)
    
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
    
    # Trigger match alerts for all compatible buyers
    from services.match_alerts_service import check_and_trigger_matches_for_deal
    await check_and_trigger_matches_for_deal(deal_id)
    
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
    request: Request,
    current_user: UserResponse = Depends(get_current_user)
):
    """Buyer signs NDA — no friction, no manual approval required.
    Legal tracking: saves ip, user_id, deal_id, timestamp."""
    if current_user.role not in ["buyer", "seller", "advisor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    if deal["status"] == "draft":
        raise HTTPException(status_code=400, detail="Deal not published yet")
    
    # Check if already signed
    existing_nda = any(nda["buyer_id"] == current_user.user_id for nda in deal.get("ndas_signed", []))
    if existing_nda:
        return {"message": "NDA already signed", "has_access": True}
    
    now = datetime.now(timezone.utc).isoformat()
    client_ip = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("x-forwarded-for", "")
    real_ip = forwarded.split(",")[0].strip() if forwarded else client_ip
    
    # Add NDA to deal — immediate access, no approval step
    nda_record = {
        "buyer_id": current_user.user_id,
        "signed_at": now,
        "ip": real_ip,
        "document_id": None
    }
    
    await deals_collection.update_one(
        {"deal_id": deal_id},
        {
            "$push": {"ndas_signed": nda_record},
            "$inc": {"metrics.ndas_signed_count": 1},
            "$set": {"updated_at": now}
        }
    )
    
    # Create NDA record in separate collection for legal tracking
    from models.transactions import NdaInDB
    nda = NdaInDB(deal_id=deal_id, buyer_id=current_user.user_id)
    nda_dict = nda.model_dump()
    nda_dict["signed_at"] = nda_dict["signed_at"].isoformat()
    nda_dict["created_at"] = nda_dict["created_at"].isoformat()
    nda_dict["ip"] = real_ip
    nda_dict["user_agent"] = request.headers.get("user-agent", "")
    await ndas_collection.insert_one(nda_dict)
    
    # Track event
    from services.events_service import track_event
    await track_event("NDA_SIGNED", deal_id=deal_id, user_id=current_user.user_id, ip=real_ip)

    # In-app notification + email placeholder for seller
    from services.notification_service import notify_nda_signed
    from services.email_service import send_email
    buyer_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or "Comprador"
    await notify_nda_signed(deal["owner_id"], deal_id, current_user.user_id, buyer_name)
    seller = await users_collection.find_one({"user_id": deal["owner_id"]}, {"_id": 0})
    if seller:
        await send_email(seller.get("email", ""), "NDA_SIGNED", {
            "seller_name": seller.get("first_name", ""),
            "buyer_name": buyer_name,
            "deal_title": deal.get("title", deal_id),
            "deal_url": f"/seller/deal/{deal_id}",
        })

    return {"message": "NDA signed successfully", "nda_id": nda.nda_id, "has_access": True}


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


@router.get("/{deal_id}/page")
async def get_deal_page(
    deal_id: str,
    request: Request
):
    """Get deal page data for buyers. Returns teaser (public) or full info (post-NDA).
    Tracks DEAL_VIEWED event."""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if deal["status"] == "draft":
        raise HTTPException(status_code=404, detail="Deal not found")

    # Track view event
    from services.events_service import track_event
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "")
    await track_event("DEAL_VIEWED", deal_id=deal_id, ip=client_ip.split(",")[0].strip())
    await deals_collection.update_one({"deal_id": deal_id}, {"$inc": {"metrics.teaser_views": 1}})

    # Check if user is authenticated and has NDA
    has_nda = False
    is_owner = False
    user_id = None
    try:
        from routers.auth import get_current_user
        user = await get_current_user(request)
        user_id = user.user_id
        is_owner = deal["owner_id"] == user_id
        has_nda = any(nda["buyer_id"] == user_id for nda in deal.get("ndas_signed", []))
    except Exception:
        pass  # unauthenticated

    # Base response (pre-NDA = teaser only)
    teaser = deal.get("teaser_full") or deal.get("teaser", {})
    response = {
        "deal_id": deal_id,
        "status": deal["status"],
        "operation_types_allowed": deal.get("operation_types_allowed", []),
        "asking_price": deal.get("asking_price") if has_nda or is_owner else None,
        "price_negotiable": deal.get("price_negotiable", True),
        "teaser": teaser,
        "has_nda": has_nda,
        "is_owner": is_owner,
        "is_authenticated": user_id is not None,
        "created_at": deal.get("created_at"),
    }

    # Add price range even pre-NDA (from teaser)
    if not has_nda and not is_owner:
        response["price_range"] = teaser.get("revenue_range")

    # Post-NDA: add full infomemo + company identity
    if has_nda or is_owner:
        response["infomemo"] = deal.get("infomemo")

        company = await companies_collection.find_one(
            {"company_id": deal["company_id"]},
            {"_id": 0}
        )
        if company:
            response["company"] = {
                "legal_name": company.get("legal_name"),
                "trade_name": company.get("trade_name"),
                "city": company.get("city"),
                "country": company.get("country"),
                "website": company.get("website"),
                "sectors": company.get("sectors"),
                "founded_year": company.get("founded_year"),
                "employees_count": company.get("employees_count"),
            }

        # Activity log for post-NDA
        nda_record = next((n for n in deal.get("ndas_signed", []) if n["buyer_id"] == user_id), None)
        response["activity_log"] = []
        if nda_record:
            response["activity_log"].append({
                "type": "NDA_SIGNED",
                "date": nda_record.get("signed_at"),
                "label": "NDA firmado"
            })
        response["activity_log"].append({
            "type": "INFO_MEMO_VIEWED",
            "date": datetime.now(timezone.utc).isoformat(),
            "label": "Infomemo consultado"
        })

        # Track infomemo view
        if has_nda:
            await track_event("INFO_MEMO_VIEWED", deal_id=deal_id, user_id=user_id)

    return response


@router.get("/{deal_id}/activation-preview")
async def get_activation_preview(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get activation preview for seller before publishing"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if deal["owner_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    company = await companies_collection.find_one(
        {"company_id": deal["company_id"]},
        {"_id": 0}
    )

    # Real matching data
    from services.matching_service import get_compatible_buyers_for_deal
    buyer_stats = await get_compatible_buyers_for_deal(deal_id)

    teaser = deal.get("teaser_full") or deal.get("teaser", {})
    infomemo = deal.get("infomemo")

    return {
        "deal_id": deal_id,
        "status": deal["status"],
        "teaser": teaser,
        "infomemo_preview": infomemo.get("content", "")[:500] + "..." if infomemo and infomemo.get("content") else None,
        "has_teaser": bool(teaser and teaser.get("title", teaser.get("headline"))),
        "has_infomemo": bool(infomemo and infomemo.get("content")),
        "compatible_buyers": buyer_stats,
        "compatible_buyers_high": buyer_stats["high"],
        "compatible_buyers_medium": buyer_stats["medium"],
        "compatible_buyers_message_high": (
            f"{buyer_stats['high']} buyers altamente compatibles"
            if buyer_stats["high"] > 0 else None
        ),
        "compatible_buyers_message_medium": (
            f"{buyer_stats['medium']} buyers potencialmente compatibles"
            if buyer_stats["medium"] > 0 else None
        ),
        "compatible_buyers_fallback": (
            "Tenemos buyers activos buscando este tipo de compañías"
            if buyer_stats["total"] == 0 else None
        ),
        "readiness_score": deal.get("readiness_score", 0),
        "readiness_checklist": deal.get("readiness_checklist", []),
    }


@router.get("/{deal_id}/funnel")
async def get_deal_funnel(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get funnel metrics for a deal"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})

    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    if deal["owner_id"] != current_user.user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    from services.events_service import get_deal_funnel
    funnel = await get_deal_funnel(deal_id)

    return {
        "deal_id": deal_id,
        "funnel": {
            "views": funnel.get("DEAL_VIEWED", 0),
            "teaser_clicks": funnel.get("TEASER_CLICKED", 0),
            "access_requests": funnel.get("ACCESS_REQUESTED", 0),
            "ndas_signed": funnel.get("NDA_SIGNED", 0),
            "infomemo_views": funnel.get("INFO_MEMO_VIEWED", 0),
            "time_spent": funnel.get("TIME_SPENT_ON_DEAL", 0),
        },
        "metrics": deal.get("metrics", {})
    }
