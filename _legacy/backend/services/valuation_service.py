from datetime import datetime, timezone
from typing import Dict, List

def calculate_valuation(company: dict) -> dict:
    """
    Calculate valuation range for a company based on financials and inputs.
    Returns a dictionary with valuation range and explanation.
    """
    financials = company.get("financials", [])
    valuation_inputs = company.get("valuation_inputs") or {}
    company_type = company.get("company_type", "digital_agency")
    
    if not financials:
        return {
            "calculated_at": datetime.now(timezone.utc).isoformat(),
            "ebitda_normalized": 0,
            "multiple_min": 0,
            "multiple_max": 0,
            "valuation_min": 0,
            "valuation_max": 0,
            "drivers": ["No hay datos financieros disponibles"]
        }
    
    # Get latest year financials
    latest = sorted(financials, key=lambda x: x.get("year", 0), reverse=True)[0]
    
    revenue = latest.get("revenue", 0)
    ebitda = latest.get("ebitda", 0)
    ebitda_margin = latest.get("ebitda_margin", 0)
    growth_rate = latest.get("growth_rate", 0)
    recurring_pct = latest.get("recurring_revenue_pct", 0)
    concentration = latest.get("client_concentration_top5", 50)
    
    # Calculate EBITDA margin if not provided
    if not ebitda_margin and revenue > 0:
        ebitda_margin = (ebitda / revenue) * 100
    
    # Normalize EBITDA (adjust for founder salary, one-time items, etc.)
    ebitda_normalized = ebitda
    drivers = []
    
    # Base multiple based on company type and size
    base_multiple = get_base_multiple(company_type, revenue, ebitda)
    drivers.append(f"Múltiplo base para {company_type}: {base_multiple}x")
    
    # Positive adjustments
    if recurring_pct and recurring_pct > 70:
        base_multiple += 0.5
        drivers.append(f"+0.5x por alta recurrencia ({recurring_pct}%)")
    elif recurring_pct and recurring_pct > 50:
        base_multiple += 0.25
        drivers.append(f"+0.25x por recurrencia moderada ({recurring_pct}%)")
    
    if growth_rate and growth_rate > 20:
        base_multiple += 0.3
        drivers.append(f"+0.3x por alto crecimiento ({growth_rate}%)")
    elif growth_rate and growth_rate > 10:
        base_multiple += 0.15
        drivers.append(f"+0.15x por crecimiento moderado ({growth_rate}%)")
    
    if concentration and concentration < 30:
        base_multiple += 0.2
        drivers.append("+0.2x por baja concentración de clientes")
    
    if ebitda_margin and ebitda_margin > 25:
        base_multiple += 0.2
        drivers.append(f"+0.2x por alto margen EBITDA ({ebitda_margin:.1f}%)")
    
    # Valuation inputs adjustments
    founder_dependency = valuation_inputs.get("founder_dependency", "medium")
    if founder_dependency == "high":
        base_multiple -= 0.5
        drivers.append("-0.5x por alta dependencia del fundador")
    elif founder_dependency == "low":
        base_multiple += 0.2
        drivers.append("+0.2x por baja dependencia del fundador")
    
    if valuation_inputs.get("tech_assets"):
        base_multiple += 0.2
        drivers.append("+0.2x por activos tecnológicos propios")
    
    if valuation_inputs.get("proprietary_ip"):
        base_multiple += 0.15
        drivers.append("+0.15x por propiedad intelectual")
    
    # Negative adjustments
    if concentration and concentration > 50:
        base_multiple -= 0.3
        drivers.append(f"-0.3x por alta concentración de clientes ({concentration}%)")
    
    if growth_rate and growth_rate < 0:
        base_multiple -= 0.3
        drivers.append(f"-0.3x por decrecimiento ({growth_rate}%)")
    
    # Ensure minimum multiple
    base_multiple = max(base_multiple, 2.0)
    
    # Calculate range (±15%)
    multiple_min = round(base_multiple * 0.85, 2)
    multiple_max = round(base_multiple * 1.15, 2)
    
    valuation_min = round(ebitda_normalized * multiple_min, 0)
    valuation_max = round(ebitda_normalized * multiple_max, 0)
    
    return {
        "calculated_at": datetime.now(timezone.utc).isoformat(),
        "ebitda_normalized": ebitda_normalized,
        "multiple_min": multiple_min,
        "multiple_max": multiple_max,
        "valuation_min": valuation_min,
        "valuation_max": valuation_max,
        "drivers": drivers
    }


def get_base_multiple(company_type: str, revenue: float, ebitda: float) -> float:
    """
    Get base multiple based on company type and size.
    Multiples for digital agencies in Spain/Europe market.
    """
    # Base multiples by type
    type_multiples = {
        "digital_agency": 4.5,
        "creative_agency": 4.0,
        "media_agency": 5.0,
        "tech_studio": 5.5,
        "consultancy": 4.0
    }
    
    base = type_multiples.get(company_type, 4.5)
    
    # Size adjustments
    if revenue > 10_000_000:  # >10M revenue
        base += 0.5
    elif revenue > 5_000_000:  # 5-10M
        base += 0.25
    elif revenue < 1_000_000:  # <1M
        base -= 0.5
    
    # EBITDA size premium
    if ebitda > 2_000_000:
        base += 0.5
    elif ebitda > 1_000_000:
        base += 0.25
    elif ebitda < 200_000:
        base -= 0.25
    
    return base
