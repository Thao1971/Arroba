"""Matching engine v1 — Score buyers vs deals based on profile fit"""
import logging
from typing import List, Optional
from database import users_collection, deals_collection, companies_collection
from services.taxonomy import LEGACY_SECTOR_MAPPING

logger = logging.getLogger(__name__)


async def compute_match_score(buyer_profile: dict, deal: dict, company: dict) -> dict:
    """
    Compute match score (0-100) between a buyer profile and a deal.
    Hard filters: taxonomy, size, geography
    Soft scoring: buyer type vs deal type, ticket vs valuation
    """
    score = 0
    max_score = 0
    breakdown = {}

    # ============================
    # HARD FILTERS (pass/fail, but contribute to score)
    # ============================

    # 1. Taxonomy match (30 pts max)
    max_score += 30
    buyer_cats = set(buyer_profile.get("taxonomy_categories", []))
    buyer_sectors = set(buyer_profile.get("sectors", []))
    # Map legacy sectors to taxonomy
    for s in list(buyer_sectors):
        mapped = LEGACY_SECTOR_MAPPING.get(s)
        if mapped:
            buyer_cats.add(mapped)

    company_sectors = set(company.get("sectors", []))
    company_cats = set(company.get("taxonomy_categories", []))
    # Map company legacy too
    for s in list(company_sectors):
        mapped = LEGACY_SECTOR_MAPPING.get(s)
        if mapped:
            company_cats.add(mapped)

    all_buyer = buyer_cats | buyer_sectors
    all_company = company_cats | company_sectors
    overlap = all_buyer & all_company

    if overlap:
        taxonomy_score = min(30, len(overlap) * 15)
        score += taxonomy_score
        breakdown["taxonomy"] = {"score": taxonomy_score, "max": 30, "match": True}
    else:
        breakdown["taxonomy"] = {"score": 0, "max": 30, "match": False}

    # 2. Size match — Revenue (20 pts max)
    max_score += 20
    financials = company.get("financials", [])
    latest = sorted(financials, key=lambda x: x.get("year", 0), reverse=True)[0] if financials else {}
    company_revenue = latest.get("revenue", 0)

    buyer_rev_min = buyer_profile.get("revenue_range_min", 0) or 0
    buyer_rev_max = buyer_profile.get("revenue_range_max") or float("inf")

    if company_revenue > 0:
        if buyer_rev_min <= company_revenue <= buyer_rev_max:
            score += 20
            breakdown["revenue_fit"] = {"score": 20, "max": 20, "match": True}
        elif company_revenue > 0 and buyer_rev_max < float("inf"):
            # Partial match based on proximity
            ratio = min(company_revenue, buyer_rev_max) / max(company_revenue, buyer_rev_max)
            partial = int(ratio * 15)
            score += partial
            breakdown["revenue_fit"] = {"score": partial, "max": 20, "match": False}
        else:
            breakdown["revenue_fit"] = {"score": 0, "max": 20, "match": False}
    else:
        score += 5  # Unknown revenue, small bonus
        breakdown["revenue_fit"] = {"score": 5, "max": 20, "match": None}

    # 3. EBITDA match (15 pts max)
    max_score += 15
    company_ebitda = latest.get("ebitda", 0)
    buyer_ebitda_min = buyer_profile.get("ebitda_range_min", 0) or 0
    buyer_ebitda_max = buyer_profile.get("ebitda_range_max") or float("inf")

    if company_ebitda > 0:
        if buyer_ebitda_min <= company_ebitda <= buyer_ebitda_max:
            score += 15
            breakdown["ebitda_fit"] = {"score": 15, "max": 15, "match": True}
        else:
            breakdown["ebitda_fit"] = {"score": 0, "max": 15, "match": False}
    else:
        breakdown["ebitda_fit"] = {"score": 3, "max": 15, "match": None}

    # 4. Geography (10 pts max)
    max_score += 10
    buyer_geos = set(buyer_profile.get("geographies", []))
    company_country = company.get("country", "")
    company_city = company.get("city", "")

    if not buyer_geos:
        score += 10  # No geo preference = matches all
        breakdown["geography"] = {"score": 10, "max": 10, "match": True}
    elif company_country in buyer_geos or company_city in buyer_geos or "España" in buyer_geos:
        score += 10
        breakdown["geography"] = {"score": 10, "max": 10, "match": True}
    else:
        breakdown["geography"] = {"score": 0, "max": 10, "match": False}

    # ============================
    # SOFT SCORING
    # ============================

    # 5. Operation type match (10 pts max)
    max_score += 10
    buyer_ops = set(buyer_profile.get("operation_types", []))
    deal_ops = set(deal.get("operation_types_allowed", []))

    if not buyer_ops or buyer_ops & deal_ops:
        score += 10
        breakdown["operation_type"] = {"score": 10, "max": 10, "match": True}
    else:
        breakdown["operation_type"] = {"score": 0, "max": 10, "match": False}

    # 6. Ticket vs Valuation (15 pts max)
    max_score += 15
    buyer_ticket_min = buyer_profile.get("ticket_min", 0) or 0
    buyer_ticket_max = buyer_profile.get("ticket_max") or float("inf")
    valuation = deal.get("asking_price") or company.get("valuation", {}).get("valuation_mid", 0) or 0

    if valuation > 0:
        if buyer_ticket_min <= valuation <= buyer_ticket_max:
            score += 15
            breakdown["ticket_fit"] = {"score": 15, "max": 15, "match": True}
        elif buyer_ticket_max < float("inf"):
            ratio = min(valuation, buyer_ticket_max) / max(valuation, buyer_ticket_max)
            partial = int(ratio * 10)
            score += partial
            breakdown["ticket_fit"] = {"score": partial, "max": 15, "match": False}
        else:
            breakdown["ticket_fit"] = {"score": 0, "max": 15, "match": False}
    else:
        score += 5
        breakdown["ticket_fit"] = {"score": 5, "max": 15, "match": None}

    # Normalize to 0-100
    final_score = min(100, int((score / max_score) * 100)) if max_score > 0 else 0

    return {
        "match_score": final_score,
        "affinity": _score_to_affinity(final_score),
        "breakdown": breakdown,
        "hard_filters_pass": all(
            breakdown.get(k, {}).get("match") is not False
            for k in ["taxonomy", "revenue_fit", "geography"]
        )
    }


def _score_to_affinity(score: int) -> str:
    """Convert numeric score to display label"""
    if score >= 70:
        return "high"
    elif score >= 40:
        return "medium"
    else:
        return "low"


def affinity_label(affinity: str) -> str:
    """Spanish display label"""
    return {
        "high": "Alta afinidad",
        "medium": "Afinidad media",
        "low": "Baja afinidad"
    }.get(affinity, "Sin datos")


async def get_recommended_deals_for_buyer(user_id: str, limit: int = 20) -> list:
    """Get deals recommended for a buyer, sorted by match score"""
    user = await users_collection.find_one({"user_id": user_id}, {"_id": 0})
    if not user or not user.get("buyer_profile", {}).get("profile_complete"):
        return []

    buyer_profile = user["buyer_profile"]

    # Get all published deals
    cursor = deals_collection.find(
        {"status": {"$in": ["published", "nda", "evaluation"]}},
        {"_id": 0}
    )
    deals = await cursor.to_list(100)

    results = []
    for deal in deals:
        company = await companies_collection.find_one(
            {"company_id": deal["company_id"]}, {"_id": 0}
        )
        if not company:
            continue

        match = await compute_match_score(buyer_profile, deal, company)

        teaser = deal.get("teaser_full") or deal.get("teaser", {})
        results.append({
            "deal_id": deal["deal_id"],
            "match_score": match["match_score"],
            "affinity": match["affinity"],
            "affinity_label": affinity_label(match["affinity"]),
            "hard_filters_pass": match["hard_filters_pass"],
            "teaser": teaser,
            "operation_types_allowed": deal.get("operation_types_allowed", []),
            "status": deal["status"],
            "created_at": deal.get("created_at"),
        })

    # Sort by score descending
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:limit]


async def get_compatible_buyers_for_deal(deal_id: str) -> dict:
    """Get compatible buyer counts for seller activation"""
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        return {"high": 0, "medium": 0, "low": 0, "total": 0}

    company = await companies_collection.find_one(
        {"company_id": deal["company_id"]}, {"_id": 0}
    )
    if not company:
        return {"high": 0, "medium": 0, "low": 0, "total": 0}

    # Get buyers with complete profiles
    cursor = users_collection.find(
        {"role": "buyer", "buyer_profile.profile_complete": True},
        {"_id": 0}
    )
    buyers = await cursor.to_list(500)

    high = 0
    medium = 0
    low = 0

    for buyer in buyers:
        match = await compute_match_score(buyer["buyer_profile"], deal, company)
        if match["affinity"] == "high":
            high += 1
        elif match["affinity"] == "medium":
            medium += 1
        else:
            low += 1

    return {
        "high": high,
        "medium": medium,
        "low": low,
        "total": high + medium + low
    }
