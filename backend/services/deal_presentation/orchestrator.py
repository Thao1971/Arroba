"""
Orquestador de Presentacion de Deals
Coordina los 5 subagentes y devuelve JSON estructurado para el frontend.
"""
from database import db
from services.deal_presentation.asset_analyzer import analyze_assets
from services.deal_presentation.access_rules import compute_access
from services.deal_presentation.layout_compositor import compose_layout
from services.deal_presentation.cta_engine import compute_cta


async def orchestrate_presentation(deal_id: str, buyer_user_id: str) -> dict:
    """Main orchestrator — calls all sub-agents and returns structured JSON."""

    # --- Gather data ---
    deal = await db.deals.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        return None

    company_id = deal.get("company_id")
    company = None
    if company_id:
        company = await db.companies.find_one({"company_id": company_id}, {"_id": 0})

    seller_profile = None
    if company_id:
        seller_profile = await db.seller_company_profiles.find_one(
            {"company_id": company_id}, {"_id": 0}
        )

    # Buyer info
    buyer = await db.users.find_one({"user_id": buyer_user_id}, {"_id": 0})
    buyer_plan = _get_buyer_plan(buyer) if buyer else "free"

    # Contact state
    contact = await db.contact_requests.find_one(
        {"deal_id": deal_id, "buyer_id": buyer_user_id},
        {"_id": 0},
        sort=[("created_at", -1)],
    )
    contact_state = contact.get("status") if contact else None

    # NDA state
    nda = await db.nda_signatures.find_one(
        {"deal_id": deal_id, "buyer_user_id": buyer_user_id, "status": "signed"},
        {"_id": 0, "signature_id": 1},
    )
    has_nda = bool(nda)

    # Engagement stage
    engagement = await db.engagements.find_one(
        {"deal_id": deal_id, "buyer_id": buyer_user_id},
        {"_id": 0, "stage": 1, "type": 1},
    )
    engagement_stage = engagement.get("stage") if engagement else None

    # --- Subagent 1: Asset Analyzer ---
    assets = analyze_assets(deal, company, seller_profile)

    # --- Subagent 2: Access Rules ---
    access = compute_access(buyer_plan, contact_state, has_nda, engagement_stage)

    # --- Subagent 3: Layout Compositor ---
    layout = compose_layout(
        assets["visual_mode"],
        assets["available_modules"],
        access["visibility_state"],
    )

    # --- Subagent 4: CTA Engine ---
    cta = compute_cta(access["visibility_state"], access["buyer_tier"], contact_state)

    # --- Build modules_visible (what to actually show) ---
    modules_visible = _filter_modules(
        assets["available_modules"],
        access["visibility_state"],
        access["buyer_tier"],
    )

    # --- Premium modules placeholder (Phase 4) ---
    premium_modules = None
    if access["buyer_tier"] == "pro+" and has_nda:
        premium_modules = {
            "available": True,
            "type": "premium_analysis",
            "status": "ready",
        }

    # --- Compose response ---
    # Build sanitized deal summary (never expose direct contact info)
    deal_summary = _build_deal_summary(deal, company, seller_profile, access["visibility_state"])

    return {
        "deal_id": deal_id,
        "visual_mode": assets["visual_mode"],
        "content_richness_score": assets["content_richness_score"],
        "visibility_state": access["visibility_state"],
        "buyer_tier": access["buyer_tier"],
        "contact_state": contact_state or "none",
        "has_nda": has_nda,
        "teaser_visible": access["teaser_visible"],
        "card_only": access["card_only"],
        "modules_visible": modules_visible,
        "layout": layout,
        "allowed_actions": access["allowed_actions"],
        "locked_actions": access["locked_actions"],
        "primary_cta": cta["primary_cta"],
        "secondary_cta": cta["secondary_cta"],
        "upgrade_prompts": access["upgrade_prompts"],
        "premium_modules": premium_modules,
        "deal_summary": deal_summary,
    }


def _get_buyer_plan(buyer: dict) -> str:
    sub = buyer.get("subscription") or {}
    pt = ""
    if isinstance(sub, dict):
        pt = sub.get("plan_type", "") or ""
    elif hasattr(sub, "plan_type"):
        pt = getattr(sub, "plan_type", "") or ""
    if "proplus" in pt or "pro+" in pt:
        return "pro+"
    if "pro" in pt:
        return "pro"
    return "free"


def _filter_modules(available: list, visibility_state: str, tier: str) -> list:
    """Filter modules by what this buyer can actually see."""
    # Pre-contact: only basic modules
    if visibility_state in ("LOCKED_CONTACT_REQUIRED", "CONTACT_REQUESTED"):
        allowed = {"description", "taxonomy", "logo", "operation_types"}
        if tier in ("pro", "pro+"):
            allowed.update({"financials_revenue", "financials_ebitda"})
        return [m for m in available if m in allowed]

    # Teaser unlocked: add financials summary
    if visibility_state == "TEASER_UNLOCKED":
        blocked = {"financials_balance", "infomemo", "dataroom"}
        return [m for m in available if m not in blocked]

    # NDA available: same as teaser unlocked
    if visibility_state == "NDA_AVAILABLE":
        blocked = {"infomemo", "dataroom"}
        return [m for m in available if m not in blocked]

    # Post-NDA: everything
    return available


def _build_deal_summary(deal: dict, company: dict | None, profile: dict | None, state: str) -> dict:
    """Build sanitized deal summary — never expose contact info."""
    teaser = deal.get("teaser") or {}
    overrides = (profile or {}).get("seller_overrides", {}) if profile else {}

    summary = {
        "title": teaser.get("headline") or deal.get("title") or (company or {}).get("trade_name") or "Oportunidad confidencial",
        "sector": (
            (profile or {}).get("auto_prefilled", {}).get("taxonomy", {}).get("category")
            or (company or {}).get("sectors", [None])[0] if company and company.get("sectors") else None
        ),
        "city": (company or {}).get("city"),
        "employees_range": overrides.get("employees_count") or (company or {}).get("employees_count"),
    }

    # Financials only if allowed
    if state not in ("LOCKED_CONTACT_REQUIRED", "CONTACT_REQUESTED") or True:
        # Always show high-level metrics in card (anonymized)
        fins = (company or {}).get("financials") or []
        if not fins and profile:
            fins = (profile.get("auto_prefilled") or {}).get("financials") or []
        if fins:
            latest = sorted(fins, key=lambda f: f.get("year", 0), reverse=True)[0]
            summary["revenue"] = latest.get("revenue") or (latest.get("pnl") or {}).get("revenue")
            summary["ebitda"] = latest.get("ebitda") or (latest.get("pnl") or {}).get("ebitda")
            summary["year"] = latest.get("year")

    # Asking price only post-contact
    if state not in ("LOCKED_CONTACT_REQUIRED", "CONTACT_REQUESTED"):
        summary["asking_price"] = deal.get("asking_price")

    # Valuation only post-NDA
    if state in ("NDA_SIGNED", "OPERATIVE_ACCESS"):
        val = (company or {}).get("valuation")
        if val:
            summary["valuation_range"] = {
                "min": val.get("valuation_min"),
                "max": val.get("valuation_max"),
            }

    # NEVER expose these
    for field in ("phone", "email", "contact_email", "contact_phone", "website", "street", "address"):
        summary.pop(field, None)

    return summary
