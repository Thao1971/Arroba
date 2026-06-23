"""
Valuation calculation engine.
Configurable multiples by category/subcategory.
"""
from typing import Dict, Tuple, Optional
from .scoring import calculate_quality_score, determine_confidence


def calculate_estimate(
    revenue: float,
    ebitda: float,
    growth_12m_pct: Optional[float],
    employee_count: Optional[int],
    recurring_revenue_pct: Optional[float],
    category_id: str,
    subcategory_id: Optional[str],
    multiples_map: Dict,
    weights: Optional[Dict] = None,
    thresholds: Optional[Dict] = None,
) -> Dict:
    """
    Core valuation engine. Returns full result dict.
    multiples_map: {scope_id: {multiple_min, multiple_mid, multiple_max, source}}
    """
    # 1. Resolve multiples
    multiple, multiple_source, has_sub, has_cat = _resolve_multiples(
        category_id, subcategory_id, multiples_map
    )

    # 2. Calculate quality
    quality_score, quality_factor, drivers = calculate_quality_score(
        revenue=revenue,
        ebitda=ebitda,
        growth_12m_pct=growth_12m_pct,
        employee_count=employee_count,
        recurring_revenue_pct=recurring_revenue_pct,
        weights=weights,
        thresholds=thresholds,
    )

    # 3. Calculate valuation
    has_ebitda = ebitda > 0
    if has_ebitda:
        valuation_low = round(ebitda * multiple["min"] * quality_factor, 0)
        valuation_mid = round(ebitda * multiple["mid"] * quality_factor, 0)
        valuation_high = round(ebitda * multiple["max"] * quality_factor, 0)
    else:
        # Fallback: revenue-based with reduced confidence
        rev_factor = 0.5
        valuation_low = round(revenue * rev_factor * 0.85 * quality_factor, 0)
        valuation_mid = round(revenue * rev_factor * quality_factor, 0)
        valuation_high = round(revenue * rev_factor * 1.15 * quality_factor, 0)
        multiple_source = f"{multiple_source} (revenue-based fallback)"

    # 4. Confidence
    confidence = determine_confidence(
        has_ebitda=has_ebitda,
        has_subcategory_multiple=has_sub,
        has_category_multiple=has_cat,
        quality_score=quality_score,
        employee_count=employee_count,
        recurring_revenue_pct=recurring_revenue_pct,
    )

    return {
        "valuation_low": valuation_low,
        "valuation_mid": valuation_mid,
        "valuation_high": valuation_high,
        "quality_score": quality_score,
        "quality_factor": quality_factor,
        "multiple_min": multiple["min"],
        "multiple_mid": multiple["mid"],
        "multiple_max": multiple["max"],
        "multiple_source": multiple_source,
        "confidence_level": confidence,
        "drivers": drivers,
    }


def _resolve_multiples(
    category_id: str,
    subcategory_id: Optional[str],
    multiples_map: Dict,
) -> Tuple[Dict, str, bool, bool]:
    """
    Resolve multiples from subcategory -> category -> global fallback.
    Returns (multiples_dict, source_label, has_subcategory, has_category)
    """
    # Try subcategory first
    if subcategory_id and subcategory_id in multiples_map:
        m = multiples_map[subcategory_id]
        return (
            {"min": m["multiple_min"], "mid": m["multiple_mid"], "max": m["multiple_max"]},
            m.get("source", "subcategory"),
            True,
            True,
        )

    # Try category
    if category_id in multiples_map:
        m = multiples_map[category_id]
        return (
            {"min": m["multiple_min"], "mid": m["multiple_mid"], "max": m["multiple_max"]},
            m.get("source", "category"),
            False,
            True,
        )

    # Global fallback
    return (
        {"min": FALLBACK_MULTIPLES["min"], "mid": FALLBACK_MULTIPLES["mid"], "max": FALLBACK_MULTIPLES["max"]},
        "fallback_global",
        False,
        False,
    )


FALLBACK_MULTIPLES = {
    "min": 3.5,
    "mid": 4.5,
    "max": 5.5,
}
