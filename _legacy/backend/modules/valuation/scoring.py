"""
Quality scoring engine for valuation leads.
Produces a quality_score (0-100) and quality_factor (0.7-1.3)
that adjusts the EBITDA multiple.
"""
from typing import Dict, Tuple, List


def calculate_quality_score(
    revenue: float,
    ebitda: float,
    growth_12m_pct: float | None,
    employee_count: int | None,
    recurring_revenue_pct: float | None,
    weights: Dict | None = None,
    thresholds: Dict | None = None,
) -> Tuple[float, float, List[Dict]]:
    """
    Returns (quality_score 0-100, quality_factor 0.7-1.3, drivers[])
    """
    w = weights or DEFAULT_WEIGHTS
    t = thresholds or DEFAULT_THRESHOLDS

    drivers = []
    total_score = 0.0
    total_weight = 0.0

    # 1. EBITDA margin
    ebitda_margin = (ebitda / revenue * 100) if revenue > 0 and ebitda > 0 else 0
    margin_score = _score_range(ebitda_margin, t["ebitda_margin"])
    total_score += margin_score * w.get("ebitda_margin", 0.35)
    total_weight += w.get("ebitda_margin", 0.35)
    drivers.append({
        "factor": "Margen EBITDA",
        "impact": _impact_label(margin_score),
        "description": f"{ebitda_margin:.1f}% de margen operativo" if ebitda_margin > 0 else "EBITDA negativo o no disponible",
    })

    # 2. Revenue per employee (efficiency)
    if employee_count and employee_count > 0:
        rev_per_emp = revenue / employee_count
        efficiency_score = _score_range(rev_per_emp, t["revenue_per_employee"])
        total_score += efficiency_score * w.get("revenue_per_employee", 0.25)
        total_weight += w.get("revenue_per_employee", 0.25)
        drivers.append({
            "factor": "Eficiencia del equipo",
            "impact": _impact_label(efficiency_score),
            "description": f"{rev_per_emp:,.0f} EUR por empleado",
        })
    else:
        total_weight += w.get("revenue_per_employee", 0.25)
        drivers.append({
            "factor": "Eficiencia del equipo",
            "impact": "neutral",
            "description": "Sin datos de empleados",
        })

    # 3. Recurring revenue
    rec_pct = recurring_revenue_pct or 0
    recurrence_score = _score_range(rec_pct, t["recurring_revenue_pct"])
    total_score += recurrence_score * w.get("recurring_revenue_pct", 0.25)
    total_weight += w.get("recurring_revenue_pct", 0.25)
    drivers.append({
        "factor": "Recurrencia de ingresos",
        "impact": _impact_label(recurrence_score),
        "description": f"{rec_pct:.0f}% de ingresos recurrentes" if rec_pct > 0 else "Sin ingresos recurrentes declarados",
    })

    # 4. Growth
    growth = growth_12m_pct if growth_12m_pct is not None else 0
    growth_score = _score_range(growth, t["growth_12m_pct"])
    total_score += growth_score * w.get("growth_12m_pct", 0.15)
    total_weight += w.get("growth_12m_pct", 0.15)
    drivers.append({
        "factor": "Crecimiento 12 meses",
        "impact": _impact_label(growth_score),
        "description": f"{growth:+.1f}% interanual" if growth_12m_pct is not None else "Sin datos de crecimiento",
    })

    quality_score = round((total_score / total_weight) * 100 if total_weight > 0 else 50, 1)
    quality_factor = _score_to_factor(quality_score)

    return quality_score, quality_factor, drivers


def _score_range(value: float, thresholds: Dict) -> float:
    """Score a value between 0.0-1.0 based on threshold tiers."""
    if value >= thresholds.get("excellent", 999999):
        return 1.0
    elif value >= thresholds.get("good", 999999):
        return 0.75
    elif value >= thresholds.get("average", 999999):
        return 0.5
    elif value >= thresholds.get("below", -999999):
        return 0.25
    else:
        return 0.1


def _score_to_factor(score: float) -> float:
    """Convert quality score (0-100) to multiplicative factor (0.7-1.3)."""
    return round(0.7 + (score / 100) * 0.6, 3)


def _impact_label(score: float) -> str:
    if score >= 0.75:
        return "positivo"
    elif score >= 0.5:
        return "neutral"
    else:
        return "negativo"


def determine_confidence(
    has_ebitda: bool,
    has_subcategory_multiple: bool,
    has_category_multiple: bool,
    quality_score: float,
    employee_count: int | None,
    recurring_revenue_pct: float | None,
) -> str:
    """Determine confidence level: alta, media, baja."""
    points = 0
    if has_ebitda:
        points += 3
    if has_subcategory_multiple:
        points += 2
    elif has_category_multiple:
        points += 1
    if quality_score >= 60:
        points += 1
    if employee_count and employee_count > 0:
        points += 1
    if recurring_revenue_pct is not None:
        points += 1

    if points >= 6:
        return "alta"
    elif points >= 3:
        return "media"
    return "baja"


# --- Configurable defaults ---
DEFAULT_WEIGHTS = {
    "ebitda_margin": 0.35,
    "revenue_per_employee": 0.25,
    "recurring_revenue_pct": 0.25,
    "growth_12m_pct": 0.15,
}

DEFAULT_THRESHOLDS = {
    "ebitda_margin": {"excellent": 25, "good": 15, "average": 8, "below": 0},
    "revenue_per_employee": {"excellent": 120000, "good": 80000, "average": 50000, "below": 30000},
    "recurring_revenue_pct": {"excellent": 70, "good": 50, "average": 30, "below": 10},
    "growth_12m_pct": {"excellent": 20, "good": 10, "average": 5, "below": 0},
}
