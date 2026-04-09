"""
Orquestador de Presentacion de Deals — Ficha Canonica Unica.
Coordina subagentes y devuelve JSON estructurado con estado por modulo.
"""
from database import db
from services.deal_presentation.asset_analyzer import analyze_assets, _get_revenue, _get_ebitda
from services.deal_presentation.access_rules import compute_module_states, compute_visibility_state, get_buyer_tier_from_plan
from services.deal_presentation.cta_engine import compute_cta_and_actions


async def orchestrate_presentation(deal_id: str, buyer_user_id: str) -> dict:
    """Main orchestrator — returns the canonical deal presentation."""

    # --- 1. Gather data ---
    deal = await db.deals.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        return None

    company_id = deal.get("company_id")
    company = await db.companies.find_one({"company_id": company_id}, {"_id": 0}) if company_id else None

    seller_profile = None
    if company_id:
        seller_profile = await db.seller_company_profiles.find_one({"company_id": company_id}, {"_id": 0})

    buyer_doc = await db.users.find_one({"user_id": buyer_user_id}, {"_id": 0})
    buyer_plan_type = ""
    if buyer_doc:
        sub = buyer_doc.get("subscription") or {}
        buyer_plan_type = sub.get("plan_type", "") if isinstance(sub, dict) else ""
    buyer_tier = get_buyer_tier_from_plan(buyer_plan_type)

    # Contact state
    contact = await db.contact_requests.find_one(
        {"deal_id": deal_id, "buyer_id": buyer_user_id, "status": {"$in": ["pending", "accepted"]}},
        {"_id": 0}, sort=[("created_at", -1)],
    )
    contact_state = contact.get("status") if contact else None

    # NDA
    nda = await db.nda_signatures.find_one(
        {"deal_id": deal_id, "buyer_user_id": buyer_user_id, "status": "signed"},
        {"_id": 0, "signature_id": 1, "signed_at": 1},
    )
    has_nda = bool(nda)

    # Engagement
    engagement = await db.engagements.find_one(
        {"deal_id": deal_id, "buyer_id": buyer_user_id},
        {"_id": 0, "stage": 1, "type": 1},
    )

    # --- 2. Asset Analyzer ---
    assets = analyze_assets(deal, company, seller_profile)

    # --- 3. Access Rules (per-module states) ---
    modules = compute_module_states(buyer_tier, contact_state, has_nda, assets["has_data"])
    visibility_state = compute_visibility_state(buyer_tier, contact_state, has_nda)

    # Inject headlines into modules
    for mod_id, mod in modules.items():
        if mod["state"] != "hidden_only_if_no_data":
            mod["headline"] = assets["headlines"].get(mod_id, "")

    # --- 4. CTA Engine ---
    cta = compute_cta_and_actions(visibility_state, buyer_tier, contact_state, has_nda, engagement)

    # --- 5. Build deal summary (sanitized, never exposes contact info) ---
    deal_summary = _build_deal_summary(deal, company, seller_profile, visibility_state)

    # --- 6. Build financial data for rendering ---
    financial_data = _build_financial_data(deal, company, seller_profile, visibility_state, buyer_tier)

    # --- 7. Build qualitative data ---
    qualitative_data = _build_qualitative_data(seller_profile, visibility_state)

    # --- 8. Compose response ---
    return {
        "deal_id": deal_id,
        "visual_mode": assets["visual_mode"],
        "content_richness_score": assets["content_richness_score"],
        "financial_depth": assets["financial_depth"],
        "qualitative_depth": assets["qualitative_depth"],
        "visibility_state": visibility_state,
        "buyer_tier": buyer_tier,
        "contact_state": contact_state or "none",
        "has_nda": has_nda,
        "modules": modules,
        "deal_summary": deal_summary,
        "financial_data": financial_data,
        "qualitative_data": qualitative_data,
        "primary_cta": cta["primary_cta"],
        "secondary_cta": cta["secondary_cta"],
        "process_timeline": cta["process_timeline"],
        "actions_panel": cta["actions_panel"],
        "premium_modules": {"available": True, "status": "phase_4"} if buyer_tier == "pro+" and has_nda else None,
    }


def _build_deal_summary(deal, company, profile, state):
    teaser = deal.get("teaser") or {}
    overrides = (profile or {}).get("seller_overrides", {}) if profile else {}
    ap = (profile or {}).get("auto_prefilled", {}) if profile else {}
    enrichment = ap.get("enrichment", {})

    # Best sources
    fins = (company or {}).get("financials") or ap.get("financials") or []
    latest = sorted(fins, key=lambda f: f.get("year", 0), reverse=True)[0] if fins else {}

    summary = {
        "title": teaser.get("headline") or (company or {}).get("trade_name") or "Oportunidad confidencial",
        "description": teaser.get("description") or overrides.get("description") or enrichment.get("description"),
        "sector": ap.get("taxonomy", {}).get("category") or ((company or {}).get("sectors") or [None])[0],
        "subcategory": ap.get("taxonomy", {}).get("subcategory"),
        "city": (company or {}).get("city") or ap.get("identity", {}).get("city"),
        "province": ap.get("identity", {}).get("province"),
        "country": "Espana",
        "employees": overrides.get("employees_count") or (company or {}).get("employees_count"),
        "founded_year": overrides.get("founded_year") or (company or {}).get("founded_year"),
        "operation_types": deal.get("operation_types_allowed") or overrides.get("operation_types") or [],
        "status": deal.get("status"),
        "logo_url": enrichment.get("logo_url") or (company or {}).get("logo_url"),
        "screenshots": enrichment.get("screenshots") or [],
    }

    # Financial metrics
    if latest:
        summary["revenue"] = _get_revenue(latest)
        summary["ebitda"] = _get_ebitda(latest)
        summary["ebitda_margin"] = latest.get("ebitda_margin") or (latest.get("pnl") or {}).get("ebitda_margin")
        summary["year"] = latest.get("year")

    # Gated by state
    if state not in ("LOCKED_CONTACT_REQUIRED", "CONTACT_REQUESTED"):
        summary["asking_price"] = deal.get("asking_price")

    if state == "OPERATIVE_ACCESS":
        val = (company or {}).get("valuation")
        if val:
            summary["valuation_range"] = {"min": val.get("valuation_min"), "max": val.get("valuation_max")}

    # NEVER expose
    for f in ("phone", "email", "contact_email", "contact_phone", "website", "street", "address", "postal_code"):
        summary.pop(f, None)

    return summary


def _build_financial_data(deal, company, profile, state, tier):
    """Build financial data arrays for chart/table rendering."""
    ap = (profile or {}).get("auto_prefilled", {}) if profile else {}
    company_fins = (company or {}).get("financials") or []
    cis_fins = ap.get("financials") or []
    fins = company_fins if company_fins else cis_fins

    if not fins:
        return None

    # Sort by year descending
    sorted_fins = sorted(fins, key=lambda f: f.get("year", 0), reverse=True)

    # For preview states, return summary only
    years = []
    for f in sorted_fins:
        year_data = {"year": f.get("year")}

        # Revenue/EBITDA always available in snapshot
        year_data["revenue"] = _get_revenue(f)
        year_data["ebitda"] = _get_ebitda(f)
        year_data["ebitda_margin"] = f.get("ebitda_margin") or (f.get("pnl") or {}).get("ebitda_margin")
        year_data["employees"] = f.get("employees")

        # PnL detail — only post-NDA
        if state == "OPERATIVE_ACCESS":
            pnl = f.get("pnl") or {}
            year_data["pnl"] = {
                "revenue": pnl.get("revenue") or f.get("revenue"),
                "supplies": pnl.get("supplies"),
                "gross_margin": pnl.get("gross_margin"),
                "personnel_expenses": pnl.get("personnel_expenses"),
                "operating_expenses": pnl.get("operating_expenses"),
                "ebitda": pnl.get("ebitda") or f.get("ebitda"),
                "depreciation": pnl.get("depreciation"),
                "operating_result": pnl.get("operating_result"),
                "net_result": pnl.get("net_result"),
            }

            bal = f.get("balance") or {}
            if bal:
                year_data["balance"] = {
                    "non_current_assets": bal.get("non_current_assets"),
                    "current_assets": bal.get("current_assets"),
                    "equity": bal.get("equity"),
                    "non_current_liabilities": bal.get("non_current_liabilities"),
                    "current_liabilities": bal.get("current_liabilities"),
                }

        years.append(year_data)

    # Compute CAGR if multi-year
    cagr = {}
    if len(years) >= 2:
        first = years[-1]
        last = years[0]
        n = last["year"] - first["year"]
        if n > 0 and first.get("revenue") and first["revenue"] > 0:
            cagr["revenue"] = round(((last["revenue"] / first["revenue"]) ** (1/n) - 1) * 100, 1)
        if n > 0 and first.get("ebitda") and first["ebitda"] > 0 and last.get("ebitda") and last["ebitda"] > 0:
            cagr["ebitda"] = round(((last["ebitda"] / first["ebitda"]) ** (1/n) - 1) * 100, 1)

    return {"years": years, "cagr": cagr, "source": "CIS" if cis_fins and not company_fins else "ARROBA"}


def _build_qualitative_data(profile, state):
    if not profile:
        return None

    overrides = profile.get("seller_overrides", {})
    ap = profile.get("auto_prefilled", {})
    enrichment = ap.get("enrichment", {})

    data = {}

    if overrides.get("founder_dependency"):
        data["founder_dependency"] = overrides["founder_dependency"]
    if overrides.get("recurring_revenue_pct"):
        data["recurring_revenue_pct"] = overrides["recurring_revenue_pct"]
    if overrides.get("client_concentration_top5"):
        data["client_concentration_top5"] = overrides["client_concentration_top5"]
    if overrides.get("client_diversification"):
        data["client_diversification"] = overrides["client_diversification"]
    if overrides.get("margin_stability"):
        data["margin_stability"] = overrides["margin_stability"]
    if enrichment.get("tags"):
        data["tags"] = enrichment["tags"]

    return data if data else None
