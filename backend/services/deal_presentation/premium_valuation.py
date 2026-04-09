"""
Premium Valuation & Benchmark Layer
Valoracion con escenarios + quality score + parametros visibles + metodologia.
Usa el motor existente de /modules/valuation/ como fuente canonica.
"""
from database import db
from modules.valuation.scoring import calculate_quality_score


async def compute_premium_valuation(financials: list, category: str, employees: int | None, overrides: dict | None) -> dict:
    """Compute full valuation with scenarios, quality score, and methodology."""
    if not financials:
        return {"available": False}

    sorted_fins = sorted(financials, key=lambda f: f.get("year", 0), reverse=True)
    latest = sorted_fins[0]
    pnl = latest.get("pnl") or {}

    revenue = pnl.get("revenue") or latest.get("revenue") or 0
    ebitda = pnl.get("ebitda") or latest.get("ebitda") or 0
    emp = latest.get("employees") or employees or 0

    if revenue <= 0:
        return {"available": False, "reason": "Sin datos de facturacion suficientes"}

    ebitda_margin = (ebitda / revenue * 100) if revenue > 0 else 0
    rev_per_emp = (revenue / emp) if emp > 0 else 0

    # Growth
    growth = 0
    if len(sorted_fins) >= 2:
        prev = sorted_fins[1]
        prev_rev = (prev.get("pnl") or {}).get("revenue") or prev.get("revenue") or 0
        if prev_rev > 0:
            growth = ((revenue - prev_rev) / prev_rev) * 100

    # Qualitative inputs
    ov = overrides or {}
    recurring_pct = float(ov.get("recurring_revenue_pct") or 0)

    # --- Quality Score (from existing engine) ---
    settings = await db.valuation_settings.find_one({}, {"_id": 0})
    weights = (settings or {}).get("weights", {"ebitda_margin": 0.35, "revenue_per_employee": 0.25, "recurring_revenue_pct": 0.25, "growth_12m_pct": 0.15})
    thresholds = (settings or {}).get("thresholds", {})

    quality_score, quality_factor, drivers = calculate_quality_score(
        revenue=revenue,
        ebitda=ebitda,
        growth_12m_pct=growth,
        employee_count=emp or None,
        recurring_revenue_pct=recurring_pct or None,
        weights=weights,
        thresholds=thresholds,
    )

    # --- Multiples (from category config) ---
    mult_doc = await db.valuation_multiples.find_one(
        {"scope_type": "category", "scope_name": {"$regex": category, "$options": "i"}},
        {"_id": 0}
    )
    if not mult_doc:
        # Try by scope_id
        cat_id = category.lower().replace(" ", "_").replace(",", "").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
        mult_doc = await db.valuation_multiples.find_one({"scope_id": {"$regex": cat_id[:15], "$options": "i"}}, {"_id": 0})

    multiple = {
        "min": (mult_doc or {}).get("multiple_min", 3.5),
        "mid": (mult_doc or {}).get("multiple_mid", 4.5),
        "max": (mult_doc or {}).get("multiple_max", 5.5),
    }

    # --- Valuation Scenarios ---
    scenarios = {}
    method = "ebitda" if ebitda > 0 else "revenue"

    if method == "ebitda":
        scenarios = {
            "conservative": {
                "label": "Conservador",
                "ev": round(ebitda * multiple["min"] * quality_factor),
                "multiple": round(multiple["min"] * quality_factor, 2),
                "description": "Escenario prudente con multiplo minimo ajustado por quality score.",
            },
            "base": {
                "label": "Base",
                "ev": round(ebitda * multiple["mid"] * quality_factor),
                "multiple": round(multiple["mid"] * quality_factor, 2),
                "description": "Escenario central con multiplo medio de la categoria.",
            },
            "optimistic": {
                "label": "Optimista",
                "ev": round(ebitda * multiple["max"] * quality_factor),
                "multiple": round(multiple["max"] * quality_factor, 2),
                "description": "Escenario favorable con multiplo maximo y quality score.",
            },
        }
    else:
        rev_factor = 0.5
        scenarios = {
            "conservative": {"label": "Conservador", "ev": round(revenue * rev_factor * 0.85 * quality_factor), "multiple": round(rev_factor * 0.85 * quality_factor, 2)},
            "base": {"label": "Base", "ev": round(revenue * rev_factor * quality_factor), "multiple": round(rev_factor * quality_factor, 2)},
            "optimistic": {"label": "Optimista", "ev": round(revenue * rev_factor * 1.15 * quality_factor), "multiple": round(rev_factor * 1.15 * quality_factor, 2)},
        }

    # --- Equity Value (simplified: EV - net debt) ---
    bal = latest.get("balance") or {}
    net_debt = None
    equity_adjustments = None
    if bal:
        ncl = bal.get("non_current_liabilities") or 0
        cl = bal.get("current_liabilities") or 0
        ca = bal.get("current_assets") or 0
        net_debt = ncl + cl - ca
        equity_adjustments = {
            "net_debt": round(net_debt),
            "description": "Deuda neta = Pasivo no corriente + Pasivo corriente - Activo corriente" if net_debt > 0 else "Posicion de caja neta (activo corriente supera pasivos)",
        }

    # --- Parameters visible ---
    parameters = {
        "ebitda_base": round(ebitda),
        "ebitda_type": "EBITDA reportado",
        "method": "EBITDA x Multiplo" if method == "ebitda" else "Revenue x Factor",
        "category": category,
        "multiple_range": {"min": multiple["min"], "mid": multiple["mid"], "max": multiple["max"]},
        "quality_factor": round(quality_factor, 2),
        "quality_score": round(quality_score, 1),
        "year": latest.get("year"),
    }

    # --- Methodology ---
    methodology = {
        "title": "Metodologia de valoracion",
        "steps": [
            {"step": "EBITDA base", "description": f"Se utiliza el EBITDA reportado del ejercicio {latest.get('year')}: {ebitda:,.0f} EUR."},
            {"step": "Multiplo de categoria", "description": f"Se aplica el rango de multiplos para '{category}': {multiple['min']}x — {multiple['max']}x (fuente: CIS)."},
            {"step": "Quality Score", "description": f"Se ajusta por un factor de calidad ({quality_factor:.2f}x) basado en: margen EBITDA, eficiencia, recurrencia y crecimiento."},
            {"step": "Enterprise Value", "description": "EV = EBITDA x Multiplo x Quality Factor. Se calculan tres escenarios: conservador, base y optimista."},
        ],
        "definitions": {
            "Enterprise Value (EV)": "Valor total de la empresa antes de ajustes de deuda. Incluye el valor del negocio operativo.",
            "Equity Value": "Valor para el accionista = EV - Deuda neta. Refleja lo que el comprador pagaria por las participaciones.",
            "Quality Score": "Puntuacion de 0 a 100 que mide la calidad del negocio en base a margen, eficiencia, recurrencia e ingresos y crecimiento.",
            "Multiplo": "Factor que se aplica al EBITDA para estimar el valor. Depende del sector, tamano y calidad del activo.",
        },
        "disclaimer": "Esta valoracion es orientativa y no constituye una tasacion formal. Los multiplos y escenarios son referencias basadas en datos del mercado MadTech espanol. BUD Advisors, S.L.",
    }

    return {
        "available": True,
        "quality_score": round(quality_score, 1),
        "quality_factor": round(quality_factor, 2),
        "quality_drivers": drivers,
        "scenarios": scenarios,
        "parameters": parameters,
        "equity_adjustments": equity_adjustments,
        "methodology": methodology,
        "source": "CIS + Motor Valoracion ARROBA",
    }
