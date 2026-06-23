"""
Subagente 3: Compositor de Layout de la Ficha
Decide la estructura visual de la ficha segun riqueza real del contenido.
"""

# Module display config per visual_mode
LAYOUT_CONFIGS = {
    "lean": {
        "hero_style": "minimal",
        "show_sidebar": False,
        "max_sections": 3,
        "financial_display": "summary_only",
        "show_charts": False,
        "show_qualitative": False,
    },
    "standard": {
        "hero_style": "standard",
        "show_sidebar": True,
        "max_sections": 6,
        "financial_display": "table",
        "show_charts": True,
        "show_qualitative": True,
    },
    "rich": {
        "hero_style": "full",
        "show_sidebar": True,
        "max_sections": 10,
        "financial_display": "table_with_charts",
        "show_charts": True,
        "show_qualitative": True,
    },
}

# Section ordering templates
SECTION_ORDER = {
    "lean": ["hero", "summary", "cta"],
    "standard": ["hero", "description", "taxonomy", "financials_summary", "operation", "cta"],
    "rich": [
        "hero", "description", "taxonomy", "financials_detail",
        "charts", "qualitative", "valuation", "operation", "highlights", "cta",
    ],
}


def compose_layout(visual_mode: str, available_modules: list, visibility_state: str) -> dict:
    """Compose the layout structure for the deal presentation."""

    config = LAYOUT_CONFIGS.get(visual_mode, LAYOUT_CONFIGS["standard"])
    base_sections = SECTION_ORDER.get(visual_mode, SECTION_ORDER["standard"])

    # Filter sections by what's actually available
    module_to_section = {
        "description": "description",
        "taxonomy": "taxonomy",
        "financials_revenue": "financials_summary",
        "financials_ebitda": "financials_summary",
        "financials_balance": "financials_detail",
        "financials_multi_year": "financials_detail",
        "financial_charts": "charts",
        "qualitative_signals": "qualitative",
        "valuation": "valuation",
        "operation_types": "operation",
        "pricing_reference": "operation",
        "highlights_ia": "highlights",
        "infomemo": "infomemo",
        "dataroom": "dataroom",
        "logo": "hero",
        "screenshot": "hero",
        "enrichment_cis": "description",
    }

    available_sections = {"hero", "cta"}  # always present
    for mod in available_modules:
        sec = module_to_section.get(mod)
        if sec:
            available_sections.add(sec)

    # Restrict by visibility
    restricted = set()
    if visibility_state in ("LOCKED_CONTACT_REQUIRED", "CONTACT_REQUESTED"):
        restricted = {"financials_detail", "charts", "qualitative", "valuation", "highlights", "infomemo", "dataroom"}
    elif visibility_state == "TEASER_UNLOCKED":
        restricted = {"financials_detail", "infomemo", "dataroom"}
    elif visibility_state == "NDA_AVAILABLE":
        restricted = {"infomemo", "dataroom"}

    sections = []
    for sec in base_sections:
        if sec in available_sections and sec not in restricted:
            sections.append(sec)

    # Post-NDA sections
    if visibility_state in ("NDA_SIGNED", "OPERATIVE_ACCESS"):
        if "infomemo" in available_sections and "infomemo" not in sections:
            sections.insert(-1, "infomemo")
        if "dataroom" in available_sections and "dataroom" not in sections:
            sections.insert(-1, "dataroom")

    return {
        "visual_mode": visual_mode,
        "layout_config": config,
        "sections": sections,
        "section_count": len(sections),
    }
