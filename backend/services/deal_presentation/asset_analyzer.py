"""
Subagente 1: Analizador de Activos del Deal
Analiza qué material real tiene el deal y calcula riqueza de contenido.
"""


def analyze_assets(deal: dict, company: dict | None, seller_profile: dict | None) -> dict:
    """Analyze real assets available for a deal presentation."""
    modules = []
    scores = {}

    # --- Identity ---
    teaser = deal.get("teaser") or {}
    has_logo = bool(company and company.get("logo_url"))
    has_screenshot = bool(
        seller_profile
        and seller_profile.get("auto_prefilled", {}).get("enrichment", {}).get("screenshots")
    )
    has_description = bool(
        teaser.get("description")
        or (company and company.get("description"))
        or (seller_profile and seller_profile.get("seller_overrides", {}).get("description"))
    )
    has_taxonomy = bool(
        (company and company.get("sectors"))
        or (seller_profile and seller_profile.get("auto_prefilled", {}).get("taxonomy", {}).get("category"))
    )

    if has_description:
        modules.append("description")
    if has_taxonomy:
        modules.append("taxonomy")
    if has_logo:
        modules.append("logo")
    if has_screenshot:
        modules.append("screenshot")

    scores["identity"] = sum([has_logo, has_screenshot, has_description, has_taxonomy])

    # --- Financials ---
    fins = []
    if company:
        fins = company.get("financials") or []
    if not fins and seller_profile:
        fins = seller_profile.get("auto_prefilled", {}).get("financials") or []

    has_revenue = any((f.get("revenue") or f.get("pnl", {}).get("revenue")) for f in fins)
    has_ebitda = any((f.get("ebitda") or f.get("pnl", {}).get("ebitda")) for f in fins)
    has_balance = any(f.get("balance") for f in fins)
    has_multi_year = len(fins) >= 2

    if has_revenue:
        modules.append("financials_revenue")
    if has_ebitda:
        modules.append("financials_ebitda")
    if has_balance:
        modules.append("financials_balance")
    if has_multi_year:
        modules.append("financials_multi_year")

    scores["financials"] = sum([has_revenue, has_ebitda, has_balance, has_multi_year])

    # --- Valuation ---
    has_valuation = bool(company and company.get("valuation"))
    if has_valuation:
        modules.append("valuation")
    scores["valuation"] = 1 if has_valuation else 0

    # --- Visuals ---
    has_visuals = bool(deal.get("financial_visuals") or (company and company.get("financial_visuals_id")))
    if has_visuals:
        modules.append("financial_charts")
    scores["visuals"] = 1 if has_visuals else 0

    # --- Qualitative ---
    overrides = (seller_profile or {}).get("seller_overrides", {})
    has_qualitative = bool(
        overrides.get("founder_dependency")
        or overrides.get("recurring_revenue_pct")
        or overrides.get("client_diversification")
    )
    if has_qualitative:
        modules.append("qualitative_signals")
    scores["qualitative"] = 1 if has_qualitative else 0

    # --- Highlights IA ---
    has_highlights = bool(teaser.get("highlights") or deal.get("infomemo", {}).get("generated"))
    if has_highlights:
        modules.append("highlights_ia")
    scores["highlights"] = 1 if has_highlights else 0

    # --- Enrichment CIS ---
    enrichment = (seller_profile or {}).get("auto_prefilled", {}).get("enrichment", {})
    has_enrichment = bool(enrichment.get("description") or enrichment.get("tags"))
    if has_enrichment:
        modules.append("enrichment_cis")
    scores["enrichment"] = 1 if has_enrichment else 0

    # --- Operation ---
    has_operation = bool(
        overrides.get("operation_types")
        or deal.get("operation_types_allowed")
    )
    has_pricing = bool(deal.get("asking_price") or (seller_profile or {}).get("pricing", {}).get("asking_price"))
    if has_operation:
        modules.append("operation_types")
    if has_pricing:
        modules.append("pricing_reference")
    scores["operation"] = sum([has_operation, has_pricing])

    # --- Infomemo ---
    infomemo = deal.get("infomemo") or {}
    has_infomemo = bool(infomemo.get("generated") or infomemo.get("content"))
    if has_infomemo:
        modules.append("infomemo")
    scores["infomemo"] = 1 if has_infomemo else 0

    # --- Dataroom ---
    dataroom = deal.get("dataroom") or {}
    has_dataroom = bool(dataroom.get("folders") or dataroom.get("files"))
    if has_dataroom:
        modules.append("dataroom")
    scores["dataroom"] = 1 if has_dataroom else 0

    # --- Aggregate ---
    max_possible = 15
    total = sum(scores.values())
    content_richness_score = round((total / max_possible) * 100)

    if content_richness_score >= 65:
        visual_mode = "rich"
    elif content_richness_score >= 35:
        visual_mode = "standard"
    else:
        visual_mode = "lean"

    return {
        "content_richness_score": content_richness_score,
        "visual_mode": visual_mode,
        "available_modules": modules,
        "scores_breakdown": scores,
        "total_score": total,
        "max_score": max_possible,
    }
