"""
Premium Benchmark Layer — Posicionamiento comparativo dentro de la categoria.
Determinista, basado en datos de todas las empresas de la misma categoria.
"""
from database import db
import math


async def compute_benchmark(financials: list, category: str, employees: int | None) -> dict:
    """Compute category percentiles and benchmark comparison."""
    if not financials or not category:
        return {"available": False, "category": category}

    latest = sorted(financials, key=lambda f: f.get("year", 0), reverse=True)[0]
    pnl = latest.get("pnl") or {}
    revenue = pnl.get("revenue") or latest.get("revenue") or 0
    ebitda = pnl.get("ebitda") or latest.get("ebitda") or 0
    margin = (ebitda / revenue * 100) if revenue > 0 else 0
    emp = latest.get("employees") or employees or 0
    efficiency = (revenue / emp) if emp > 0 else 0

    # Compute CAGR for growth
    growth = 0
    if len(financials) >= 2:
        sorted_fins = sorted(financials, key=lambda f: f.get("year", 0))
        first = sorted_fins[0]
        last = sorted_fins[-1]
        r0 = (first.get("pnl") or {}).get("revenue") or first.get("revenue") or 0
        r1 = (last.get("pnl") or {}).get("revenue") or last.get("revenue") or 0
        n = (last.get("year", 0) - first.get("year", 0))
        if n > 0 and r0 > 0 and r1 > 0:
            growth = ((r1 / r0) ** (1/n) - 1) * 100

    # Get category peers from database
    peers = await _get_category_peers(category)

    if len(peers) < 3:
        # Not enough data for meaningful percentiles
        return {
            "available": False,
            "category": category,
            "peer_count": len(peers),
            "reason": "Insuficientes empresas en la categoria para benchmark robusto",
        }

    # Compute percentiles
    percentiles = {}
    metrics = {
        "revenue": revenue,
        "ebitda": ebitda,
        "ebitda_margin": margin,
        "growth": growth,
        "efficiency": efficiency,
    }

    peer_metrics = {
        "revenue": [p["revenue"] for p in peers if p.get("revenue")],
        "ebitda": [p["ebitda"] for p in peers if p.get("ebitda")],
        "ebitda_margin": [p["margin"] for p in peers if p.get("margin")],
        "growth": [p["growth"] for p in peers if p.get("growth") is not None],
        "efficiency": [p["efficiency"] for p in peers if p.get("efficiency")],
    }

    for metric_key, value in metrics.items():
        peer_values = peer_metrics.get(metric_key, [])
        if peer_values and value:
            pct = _compute_percentile(value, peer_values)
            percentiles[metric_key] = {
                "value": round(value, 1),
                "percentile": pct,
                "label": _percentile_label(pct),
                "peer_median": round(_median(peer_values), 1),
                "peer_p75": round(_percentile_value(peer_values, 75), 1),
            }

    # Quality score (composite)
    if percentiles:
        weights = {"ebitda_margin": 0.3, "growth": 0.25, "efficiency": 0.25, "revenue": 0.1, "ebitda": 0.1}
        quality_score = 0
        total_weight = 0
        for k, w in weights.items():
            if k in percentiles:
                quality_score += percentiles[k]["percentile"] * w
                total_weight += w
        quality_score = round(quality_score / total_weight) if total_weight > 0 else 0

        percentiles["quality_score"] = {
            "value": quality_score,
            "percentile": quality_score,
            "label": _percentile_label(quality_score),
            "description": "Puntuacion compuesta ponderada: margen (30%), crecimiento (25%), eficiencia (25%), facturacion (10%), EBITDA (10%)",
        }

    # vs_category comparison
    vs_category = {}
    for k, p in percentiles.items():
        if k == "quality_score":
            continue
        pct = p["percentile"]
        if pct >= 75:
            vs_category[k] = "top_quartile"
        elif pct >= 50:
            vs_category[k] = "above_median"
        elif pct >= 25:
            vs_category[k] = "below_median"
        else:
            vs_category[k] = "bottom_quartile"

    return {
        "available": True,
        "category": category,
        "peer_count": len(peers),
        "percentiles": percentiles,
        "vs_category": vs_category,
        "source": "CIS + ARROBA",
    }


async def _get_category_peers(category: str) -> list:
    """Get financial metrics for all companies in the same category."""
    peers = []

    # From companies collection (seed data)
    cursor = db.companies.find(
        {"sectors": {"$elemMatch": {"$regex": category, "$options": "i"}}},
        {"_id": 0, "financials": 1, "employees_count": 1}
    )
    async for comp in cursor:
        fins = comp.get("financials") or []
        if fins:
            f = sorted(fins, key=lambda x: x.get("year", 0), reverse=True)[0]
            rev = f.get("revenue") or 0
            ebt = f.get("ebitda") or 0
            emp = comp.get("employees_count") or 0
            if rev > 0:
                peers.append({
                    "revenue": rev,
                    "ebitda": ebt,
                    "margin": (ebt / rev * 100) if rev > 0 else 0,
                    "efficiency": (rev / emp) if emp > 0 else 0,
                    "growth": None,
                })

    # From seller profiles (CIS data, richer)
    cursor2 = db.seller_company_profiles.find(
        {"auto_prefilled.taxonomy.category": {"$regex": category, "$options": "i"}},
        {"_id": 0, "auto_prefilled.financials": 1}
    )
    async for prof in cursor2:
        fins = prof.get("auto_prefilled", {}).get("financials") or []
        if fins:
            f = sorted(fins, key=lambda x: x.get("year", 0), reverse=True)[0]
            pnl = f.get("pnl") or {}
            rev = pnl.get("revenue") or 0
            ebt = pnl.get("ebitda") or 0
            emp = f.get("employees") or 0
            gr = None
            if len(fins) >= 2:
                sf = sorted(fins, key=lambda x: x.get("year", 0))
                r0 = (sf[0].get("pnl") or {}).get("revenue") or 0
                r1 = (sf[-1].get("pnl") or {}).get("revenue") or 0
                n = sf[-1].get("year", 0) - sf[0].get("year", 0)
                if n > 0 and r0 > 0:
                    gr = ((r1/r0)**(1/n)-1)*100
            if rev > 0:
                peers.append({
                    "revenue": rev,
                    "ebitda": ebt,
                    "margin": (ebt / rev * 100) if rev > 0 else 0,
                    "efficiency": (rev / emp) if emp > 0 else 0,
                    "growth": gr,
                })

    return peers


def _compute_percentile(value: float, distribution: list) -> int:
    sorted_dist = sorted(distribution)
    count_below = sum(1 for v in sorted_dist if v < value)
    return min(99, max(1, round((count_below / len(sorted_dist)) * 100)))


def _median(values: list) -> float:
    s = sorted(values)
    n = len(s)
    if n == 0: return 0
    if n % 2 == 0: return (s[n//2 - 1] + s[n//2]) / 2
    return s[n//2]


def _percentile_value(values: list, pct: int) -> float:
    s = sorted(values)
    idx = int(len(s) * pct / 100)
    return s[min(idx, len(s)-1)]


def _percentile_label(pct: int) -> str:
    if pct >= 90: return "Excepcional"
    if pct >= 75: return "Top quartile"
    if pct >= 50: return "Por encima de la media"
    if pct >= 25: return "Por debajo de la media"
    return "Cuartil inferior"
