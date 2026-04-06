"""
Financial Visuals — generate and persist reusable chart configs
from validated financial data. Used in Seller Wizard, Teaser, Infomemo.
"""
from typing import Dict, List, Optional
from datetime import datetime, timezone
from database import db
import logging

logger = logging.getLogger(__name__)

CHART_DEFINITIONS = [
    {"id": "revenue_trend", "label": "Evolución de facturación", "chart_type": "bar", "default_teaser": True, "default_infomemo": True},
    {"id": "ebitda_trend", "label": "Evolución de EBITDA", "chart_type": "bar", "default_teaser": True, "default_infomemo": True},
    {"id": "adjusted_ebitda_trend", "label": "Evolución de EBITDA ajustado", "chart_type": "bar", "default_teaser": False, "default_infomemo": True},
    {"id": "ebitda_margin_pct", "label": "Margen EBITDA %", "chart_type": "line", "default_teaser": True, "default_infomemo": True},
    {"id": "revenue_vs_ebitda", "label": "Facturación vs EBITDA", "chart_type": "dual_bar", "default_teaser": False, "default_infomemo": True},
    {"id": "pnl_summary", "label": "Cuenta de resultados resumida", "chart_type": "waterfall", "default_teaser": False, "default_infomemo": True},
    {"id": "balance_summary", "label": "Balance resumido", "chart_type": "stacked_bar", "default_teaser": False, "default_infomemo": True},
    {"id": "cost_mix", "label": "Mix de costes sobre ingresos", "chart_type": "stacked_bar", "default_teaser": False, "default_infomemo": True},
    {"id": "net_result_trend", "label": "Evolución del resultado", "chart_type": "bar", "default_teaser": False, "default_infomemo": True},
    {"id": "kpi_cards", "label": "KPIs financieros derivados", "chart_type": "kpi_grid", "default_teaser": True, "default_infomemo": True},
]


def generate_financial_visuals(financials: List[Dict]) -> Dict:
    """
    Generate chart data configs from validated financials.
    Returns dict of chart_id -> {enabled, data_complete, data, chart_type, use_in_teaser, use_in_infomemo}
    """
    if not financials:
        return {}

    years = sorted([f.get("year") for f in financials if f.get("year")], reverse=True)
    fin_by_year = {f["year"]: f for f in financials if f.get("year")}

    visuals = {}

    for chart_def in CHART_DEFINITIONS:
        chart_id = chart_def["id"]
        data = _build_chart_data(chart_id, years, fin_by_year)
        visuals[chart_id] = {
            "label": chart_def["label"],
            "chart_type": chart_def["chart_type"],
            "enabled": data.get("has_data", False),
            "data_complete": data.get("complete", False),
            "data": data.get("series", {}),
            "use_in_teaser": chart_def["default_teaser"] if data.get("has_data") else False,
            "use_in_infomemo": chart_def["default_infomemo"] if data.get("has_data") else False,
        }

    return visuals


def _build_chart_data(chart_id: str, years: List[int], fin_by_year: Dict) -> Dict:
    """Build chart-specific data series."""
    def _pnl(year, field):
        f = fin_by_year.get(year, {})
        pnl = f.get("pnl", {})
        val = pnl.get(field) if isinstance(pnl, dict) else None
        if val is not None:
            return val
        return f.get(field)

    def _bal(year, field):
        f = fin_by_year.get(year, {})
        bal = f.get("balance", {})
        val = bal.get(field) if isinstance(bal, dict) else None
        if val is not None:
            return val
        return f.get(field)

    sorted_years = sorted(years)

    if chart_id == "revenue_trend":
        vals = {y: _pnl(y, "revenue") for y in sorted_years}
        has = any(v for v in vals.values() if v)
        return {"has_data": has, "complete": all(v for v in vals.values() if True), "series": {"years": sorted_years, "values": [vals.get(y) for y in sorted_years]}}

    if chart_id == "ebitda_trend":
        vals = {y: _pnl(y, "ebitda") for y in sorted_years}
        has = any(v for v in vals.values() if v)
        return {"has_data": has, "complete": all(v for v in vals.values()), "series": {"years": sorted_years, "values": [vals.get(y) for y in sorted_years]}}

    if chart_id == "adjusted_ebitda_trend":
        vals = {y: _pnl(y, "adjusted_ebitda") for y in sorted_years}
        has = any(v for v in vals.values() if v)
        return {"has_data": has, "complete": all(v for v in vals.values()), "series": {"years": sorted_years, "values": [vals.get(y) for y in sorted_years]}}

    if chart_id == "ebitda_margin_pct":
        margins = {}
        for y in sorted_years:
            rev = _pnl(y, "revenue")
            ebitda = _pnl(y, "ebitda")
            if rev and ebitda and rev > 0:
                margins[y] = round((ebitda / rev) * 100, 1)
        has = len(margins) > 0
        return {"has_data": has, "complete": len(margins) == len(sorted_years), "series": {"years": sorted_years, "values": [margins.get(y) for y in sorted_years]}}

    if chart_id == "revenue_vs_ebitda":
        revs = [_pnl(y, "revenue") for y in sorted_years]
        ebits = [_pnl(y, "ebitda") for y in sorted_years]
        has = any(r for r in revs if r) and any(e for e in ebits if e)
        return {"has_data": has, "complete": all(revs) and all(ebits), "series": {"years": sorted_years, "revenue": revs, "ebitda": ebits}}

    if chart_id == "pnl_summary":
        latest = sorted_years[-1] if sorted_years else None
        if not latest:
            return {"has_data": False, "complete": False, "series": {}}
        rev = _pnl(latest, "revenue")
        has = bool(rev)
        return {"has_data": has, "complete": has, "series": {
            "year": latest,
            "revenue": rev,
            "supplies": _pnl(latest, "supplies"),
            "personnel": _pnl(latest, "personnel_expenses"),
            "operating_expenses": _pnl(latest, "operating_expenses"),
            "ebitda": _pnl(latest, "ebitda"),
            "net_result": _pnl(latest, "net_result"),
        }}

    if chart_id == "balance_summary":
        latest = sorted_years[-1] if sorted_years else None
        if not latest:
            return {"has_data": False, "complete": False, "series": {}}
        nca = _bal(latest, "non_current_assets")
        ca = _bal(latest, "current_assets")
        has = bool(nca or ca)
        return {"has_data": has, "complete": has, "series": {
            "year": latest,
            "non_current_assets": nca, "current_assets": ca,
            "equity": _bal(latest, "equity"),
            "non_current_liabilities": _bal(latest, "non_current_liabilities"),
            "current_liabilities": _bal(latest, "current_liabilities"),
        }}

    if chart_id == "cost_mix":
        latest = sorted_years[-1] if sorted_years else None
        if not latest:
            return {"has_data": False, "complete": False, "series": {}}
        rev = _pnl(latest, "revenue") or 0
        has = rev > 0
        return {"has_data": has, "complete": has, "series": {
            "year": latest, "revenue": rev,
            "supplies": _pnl(latest, "supplies"),
            "personnel": _pnl(latest, "personnel_expenses"),
            "other_opex": _pnl(latest, "operating_expenses"),
        }}

    if chart_id == "net_result_trend":
        vals = {y: _pnl(y, "net_result") for y in sorted_years}
        has = any(v for v in vals.values() if v is not None)
        return {"has_data": has, "complete": all(v is not None for v in vals.values()), "series": {"years": sorted_years, "values": [vals.get(y) for y in sorted_years]}}

    if chart_id == "kpi_cards":
        revs = [_pnl(y, "revenue") for y in sorted_years if _pnl(y, "revenue")]
        ebits = [_pnl(y, "ebitda") for y in sorted_years if _pnl(y, "ebitda")]
        adj_ebits = [_pnl(y, "adjusted_ebitda") for y in sorted_years if _pnl(y, "adjusted_ebitda")]

        cagr_rev = _cagr(revs) if len(revs) >= 2 else None
        cagr_ebitda = _cagr(ebits) if len(ebits) >= 2 else None
        avg_margin = None
        if revs and ebits:
            margins = [(e / r * 100) for r, e in zip(revs, ebits) if r > 0]
            avg_margin = round(sum(margins) / len(margins), 1) if margins else None

        has = bool(revs)
        return {"has_data": has, "complete": has, "series": {
            "cagr_revenue": cagr_rev,
            "cagr_ebitda": cagr_ebitda,
            "avg_ebitda_margin": avg_margin,
            "adjusted_vs_reported": (adj_ebits[-1] if adj_ebits else None, ebits[-1] if ebits else None),
        }}

    return {"has_data": False, "complete": False, "series": {}}


def _cagr(values: list) -> Optional[float]:
    if len(values) < 2 or not values[0] or values[0] <= 0:
        return None
    n = len(values) - 1
    end = values[-1]
    start = values[0]
    if start <= 0 or end <= 0:
        return None
    return round(((end / start) ** (1 / n) - 1) * 100, 1)


async def save_financial_visuals(company_id: str, visuals: Dict, company_master_id: str = None):
    """Persist financial visuals for a company."""
    doc = {
        "company_id": company_id,
        "company_master_id": company_master_id,
        "financial_visuals": visuals,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.financial_visuals.update_one(
        {"company_id": company_id},
        {"$set": doc},
        upsert=True,
    )


async def get_financial_visuals(company_id: str) -> Optional[Dict]:
    """Get stored financial visuals for a company."""
    doc = await db.financial_visuals.find_one({"company_id": company_id}, {"_id": 0})
    return doc
