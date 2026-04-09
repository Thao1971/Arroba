"""
Premium Quant Layer — KPIs financieros avanzados deterministas.
Calcula ratios desde datos CIS (PnL + Balance). GPT no interviene aqui.
"""

KPI_DEFINITIONS = {
    "debt_ratio": {
        "label": "Ratio de endeudamiento",
        "formula": "(Pasivo total) / (Activo total)",
        "description": "Mide que proporcion de los activos esta financiada con deuda. Menor es mejor.",
        "interpretation": {"low": [0, 0.4], "medium": [0.4, 0.7], "high": [0.7, 1.5]},
        "unit": "x",
    },
    "working_capital": {
        "label": "Fondo de maniobra",
        "formula": "Activo corriente - Pasivo corriente",
        "description": "Capacidad de la empresa para cubrir sus obligaciones a corto plazo. Positivo es sano.",
        "interpretation_type": "absolute",
        "unit": "EUR",
    },
    "liabilities_to_ebitda": {
        "label": "Pasivo / EBITDA",
        "formula": "(Pasivo total) / EBITDA",
        "description": "Anos que tardaria en pagar toda su deuda con el EBITDA actual. Menor es mejor.",
        "interpretation": {"low": [0, 2], "medium": [2, 4], "high": [4, 20]},
        "unit": "x",
    },
    "ebitda_to_assets": {
        "label": "EBITDA / Activo",
        "formula": "EBITDA / Activo total",
        "description": "Rendimiento del activo medido por EBITDA. Mayor indica mayor eficiencia.",
        "interpretation": {"low": [0, 0.1], "medium": [0.1, 0.25], "high": [0.25, 1]},
        "unit": "%",
    },
    "revenue_per_employee": {
        "label": "Facturacion por empleado",
        "formula": "Facturacion / Numero de empleados",
        "description": "Productividad media por empleado. Valores altos indican eficiencia operativa.",
        "interpretation_type": "benchmark",
        "unit": "EUR",
    },
    "ebitda_per_employee": {
        "label": "EBITDA por empleado",
        "formula": "EBITDA / Numero de empleados",
        "description": "Rentabilidad media generada por cada empleado. Clave en agencias de servicios.",
        "interpretation_type": "benchmark",
        "unit": "EUR",
    },
    "net_debt_to_ebitda": {
        "label": "Deuda neta / EBITDA",
        "formula": "(Pasivo no corriente + Pasivo corriente - Activo corriente) / EBITDA",
        "description": "Deuda neta relativa al EBITDA. Negativo indica posicion de caja neta (muy sano).",
        "interpretation": {"low": [-10, 1], "medium": [1, 3], "high": [3, 20]},
        "unit": "x",
    },
    "ebitda_margin": {
        "label": "Margen EBITDA",
        "formula": "EBITDA / Facturacion x 100",
        "description": "Porcentaje de la facturacion que se convierte en EBITDA. Mide rentabilidad operativa.",
        "interpretation": {"low": [0, 10], "medium": [10, 20], "high": [20, 100]},
        "unit": "%",
    },
}


def compute_premium_kpis(financials: list, employees: int | None) -> dict:
    """Compute advanced KPIs from CIS financial data."""
    if not financials:
        return {"kpis": {}, "available": False}

    # Use most recent year with balance
    sorted_fins = sorted(financials, key=lambda f: f.get("year", 0), reverse=True)
    latest = sorted_fins[0]
    pnl = latest.get("pnl") or {}
    bal = latest.get("balance") or {}
    year = latest.get("year")

    revenue = pnl.get("revenue") or latest.get("revenue") or 0
    ebitda = pnl.get("ebitda") or latest.get("ebitda") or 0
    emp = latest.get("employees") or employees or 0

    nca = bal.get("non_current_assets") or 0
    ca = bal.get("current_assets") or 0
    eq = bal.get("equity") or 0
    ncl = bal.get("non_current_liabilities") or 0
    cl = bal.get("current_liabilities") or 0

    total_assets = nca + ca
    total_liabilities = ncl + cl

    kpis = {}

    # Debt ratio
    if total_assets > 0:
        v = round(total_liabilities / total_assets, 2)
        kpis["debt_ratio"] = _build_kpi("debt_ratio", v)

    # Working capital
    wc = ca - cl
    kpis["working_capital"] = _build_kpi("working_capital", round(wc))

    # Liabilities / EBITDA
    if ebitda > 0:
        v = round(total_liabilities / ebitda, 2)
        kpis["liabilities_to_ebitda"] = _build_kpi("liabilities_to_ebitda", v)

    # EBITDA / Assets
    if total_assets > 0:
        v = round((ebitda / total_assets) * 100, 1)
        kpis["ebitda_to_assets"] = _build_kpi("ebitda_to_assets", v)

    # Revenue per employee
    if emp > 0 and revenue > 0:
        v = round(revenue / emp)
        kpis["revenue_per_employee"] = _build_kpi("revenue_per_employee", v)

    # EBITDA per employee
    if emp > 0 and ebitda > 0:
        v = round(ebitda / emp)
        kpis["ebitda_per_employee"] = _build_kpi("ebitda_per_employee", v)

    # Net debt / EBITDA
    if ebitda > 0:
        net_debt = ncl + cl - ca
        v = round(net_debt / ebitda, 2)
        kpis["net_debt_to_ebitda"] = _build_kpi("net_debt_to_ebitda", v)

    # EBITDA margin
    if revenue > 0:
        v = round((ebitda / revenue) * 100, 1)
        kpis["ebitda_margin"] = _build_kpi("ebitda_margin", v)

    return {
        "kpis": kpis,
        "year": year,
        "source": "CIS",
        "available": len(kpis) >= 3,
    }


def _build_kpi(kpi_id: str, value) -> dict:
    defn = KPI_DEFINITIONS.get(kpi_id, {})
    result = {
        "value": value,
        "label": defn.get("label", kpi_id),
        "formula": defn.get("formula", ""),
        "description": defn.get("description", ""),
        "unit": defn.get("unit", ""),
    }

    # Interpretation
    interp = defn.get("interpretation")
    if interp:
        for level, (lo, hi) in interp.items():
            if lo <= (value if value >= 0 else value) <= hi:
                result["level"] = level
                break
        if "level" not in result:
            result["level"] = "high" if value > 0 else "low"

        level_labels = {"low": "Bajo", "medium": "Medio", "high": "Alto"}
        result["level_label"] = level_labels.get(result.get("level"), "")

    return result
