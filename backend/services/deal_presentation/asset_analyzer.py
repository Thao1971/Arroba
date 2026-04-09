"""
Subagente 1: Analizador de Activos del Deal — detecta datos reales para cada bloque de la ficha.
Devuelve has_data (bool por modulo), content_richness_score, visual_mode, financial_depth, qualitative_depth.
"""


def analyze_assets(deal: dict, company: dict | None, seller_profile: dict | None) -> dict:
    """Analyze real assets for all 14 canonical blocks."""
    teaser = deal.get("teaser") or {}
    overrides = (seller_profile or {}).get("seller_overrides", {}) if seller_profile else {}
    ap = (seller_profile or {}).get("auto_prefilled", {}) if seller_profile else {}
    enrichment = ap.get("enrichment", {})

    # Collect financials from best source
    company_fins = (company or {}).get("financials") or []
    cis_fins = ap.get("financials") or []
    fins = company_fins if company_fins else cis_fins

    # --- Has data per module ---
    has_data = {}

    # 1. Hero — always has something
    has_data["hero"] = True

    # 2. Executive summary
    has_data["executive_summary"] = bool(
        teaser.get("description")
        or (company or {}).get("description")
        or overrides.get("description")
        or enrichment.get("description")
    )

    # 3. Business snapshot
    has_revenue = any(_get_revenue(f) for f in fins)
    has_data["business_snapshot"] = bool(
        has_revenue
        or (company or {}).get("employees_count")
        or overrides.get("employees_count")
    )

    # 4. Financial evolution (multi-year)
    multi_year = len([f for f in fins if _get_revenue(f)]) >= 2
    has_data["financial_evolution"] = multi_year

    # 5. PnL
    has_pnl = any(
        f.get("pnl") or f.get("revenue")
        for f in fins
    )
    has_data["pnl"] = has_pnl

    # 6. Balance
    has_balance = any(f.get("balance") for f in fins)
    has_data["balance"] = has_balance

    # 7. Charts (visuals)
    has_data["charts"] = multi_year  # charts make sense with 2+ years

    # 8. Qualitative
    has_data["qualitative"] = bool(
        overrides.get("founder_dependency")
        or overrides.get("recurring_revenue_pct")
        or overrides.get("client_diversification")
        or enrichment.get("tags")
        or enrichment.get("categories")
    )

    # 9. Visual assets
    has_logo = bool(enrichment.get("logo_url") or (company or {}).get("logo_url"))
    has_screenshot = bool(enrichment.get("screenshots"))
    has_data["visual_assets"] = has_logo or has_screenshot

    # 10. Infomemo
    infomemo = deal.get("infomemo") or {}
    has_data["infomemo"] = bool(infomemo.get("generated_at") or infomemo.get("content"))

    # 11. Dataroom
    dataroom = deal.get("dataroom") or {}
    has_data["dataroom"] = bool(dataroom.get("folders") and len(dataroom.get("folders", [])) > 0)

    # 12. Actions panel — always
    has_data["actions_panel"] = True

    # 13. Process state — always
    has_data["process_state"] = True

    # 14. Affinity — depends on matching
    has_data["affinity"] = True

    # 15. Trust footer — always
    has_data["trust_footer"] = True

    # 16. Premium analysis — always available structurally (gated by plan)
    has_data["premium_analysis"] = True

    # --- Financial depth ---
    fin_depth_score = 0
    if has_revenue: fin_depth_score += 1
    if any(_get_ebitda(f) for f in fins): fin_depth_score += 1
    if has_balance: fin_depth_score += 1
    if multi_year: fin_depth_score += 1
    if any(f.get("pnl", {}).get("gross_margin") for f in fins): fin_depth_score += 1

    financial_depth = "deep" if fin_depth_score >= 4 else "standard" if fin_depth_score >= 2 else "basic"

    # --- Qualitative depth ---
    qual_count = sum([
        bool(overrides.get("founder_dependency")),
        bool(overrides.get("recurring_revenue_pct")),
        bool(overrides.get("client_concentration_top5")),
        bool(overrides.get("client_diversification")),
        bool(overrides.get("margin_stability")),
        bool(enrichment.get("description")),
        bool(enrichment.get("tags")),
    ])
    qualitative_depth = "rich" if qual_count >= 5 else "standard" if qual_count >= 2 else "basic"

    # --- Content richness score ---
    data_modules = [k for k, v in has_data.items() if v and k not in ("actions_panel", "process_state", "trust_footer", "premium_analysis", "affinity")]
    max_content = 11  # hero, exec_summary, snapshot, fin_evolution, pnl, balance, charts, qualitative, visual_assets, infomemo, dataroom
    richness = round((len(data_modules) / max_content) * 100)

    if richness >= 65:
        visual_mode = "rich"
    elif richness >= 35:
        visual_mode = "standard"
    else:
        visual_mode = "lean"

    # --- Module headlines ---
    headlines = {
        "hero": teaser.get("headline") or (company or {}).get("trade_name") or "Oportunidad confidencial",
        "executive_summary": "Resumen ejecutivo",
        "business_snapshot": "Snapshot de negocio",
        "financial_evolution": "Evolucion financiera",
        "pnl": "Cuenta de resultados",
        "balance": "Balance resumido",
        "charts": "Graficos financieros",
        "qualitative": "Posicionamiento y cualitativos",
        "visual_assets": "Activos visuales",
        "infomemo": "Information Memorandum",
        "dataroom": "Data Room",
        "actions_panel": "Siguientes acciones",
        "process_state": "Estado del proceso",
        "affinity": "Contexto de afinidad",
        "trust_footer": "Informacion de confianza",
        "premium_analysis": "Analisis Premium Pro+",
    }

    return {
        "has_data": has_data,
        "content_richness_score": richness,
        "visual_mode": visual_mode,
        "financial_depth": financial_depth,
        "qualitative_depth": qualitative_depth,
        "headlines": headlines,
    }


def _get_revenue(f: dict) -> float:
    return f.get("revenue") or (f.get("pnl") or {}).get("revenue") or 0

def _get_ebitda(f: dict) -> float:
    return f.get("ebitda") or (f.get("pnl") or {}).get("ebitda") or 0
