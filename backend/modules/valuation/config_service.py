"""
Configuration service for valuation module.
Loads settings and multiples from MongoDB, with sensible defaults.
"""
from typing import Dict, List, Optional
from datetime import datetime, timezone


DEFAULT_SETTINGS = {
    "settings_version": "1.0.0",
    "weights": {
        "ebitda_margin": 0.35,
        "revenue_per_employee": 0.25,
        "recurring_revenue_pct": 0.25,
        "growth_12m_pct": 0.15,
    },
    "thresholds": {
        "ebitda_margin": {"excellent": 25, "good": 15, "average": 8, "below": 0},
        "revenue_per_employee": {"excellent": 120000, "good": 80000, "average": 50000, "below": 30000},
        "recurring_revenue_pct": {"excellent": 70, "good": 50, "average": 30, "below": 10},
        "growth_12m_pct": {"excellent": 20, "good": 10, "average": 5, "below": 0},
    },
    "fallback_rules": {
        "negative_ebitda_strategy": "revenue_based",
        "missing_subcategory": "use_category",
        "missing_category": "use_global_fallback",
    },
    "disclaimer_short": "Estimacion inicial automatica y orientativa. No constituye asesoramiento financiero.",
    "disclaimer_full": (
        "Esta estimacion ha sido generada de forma automatica a partir de los datos facilitados por el usuario "
        "y criterios sectoriales orientativos. No constituye asesoramiento financiero, fiscal ni legal, "
        "ni una valoracion formal independiente. BUD Advisors, S.L., como entidad titular de ARROBA, "
        "no asume responsabilidad por decisiones adoptadas exclusivamente sobre la base de esta estimacion automatica."
    ),
    "premium_price": "1.950",
    "premium_description": (
        "Valoracion experta que amplia la estimacion automatica mediante analisis de comparables, "
        "multiples de mercado, revision sectorial del CIS y descuento de flujos de caja. "
        "Mas completa, mas defendible y mas util para la toma de decisiones reales."
    ),
    "email_subject": "Tu estimacion inicial de valor en ARROBA",
    "active": True,
    "updated_by": "system",
    "updated_at": None,
}


async def get_active_settings(db) -> Dict:
    """Load active valuation settings from DB, or return defaults."""
    doc = await db.valuation_settings.find_one(
        {"active": True},
        {"_id": 0},
    )
    if doc:
        return doc
    return {**DEFAULT_SETTINGS, "updated_at": datetime.now(timezone.utc).isoformat()}


async def get_multiples_map(db) -> Dict:
    """
    Load all active multiples into a dict keyed by scope_id.
    Returns: {scope_id: {multiple_min, multiple_mid, multiple_max, source}}
    """
    cursor = db.valuation_multiples.find(
        {"is_active": True},
        {"_id": 0},
    )
    result = {}
    async for doc in cursor:
        result[doc["scope_id"]] = {
            "multiple_min": doc["multiple_min"],
            "multiple_mid": doc["multiple_mid"],
            "multiple_max": doc["multiple_max"],
            "source": doc.get("source", "manual_override"),
        }
    return result


async def get_public_config(db) -> Dict:
    """Return only public-facing config (no internal weights/thresholds)."""
    settings = await get_active_settings(db)
    return {
        "disclaimer_short": settings.get("disclaimer_short", DEFAULT_SETTINGS["disclaimer_short"]),
        "disclaimer_full": settings.get("disclaimer_full", DEFAULT_SETTINGS["disclaimer_full"]),
        "premium_price": settings.get("premium_price", DEFAULT_SETTINGS["premium_price"]),
        "premium_description": settings.get("premium_description", DEFAULT_SETTINGS["premium_description"]),
    }


async def seed_default_multiples(db):
    """Seed default multiples for all taxonomy categories if none exist."""
    count = await db.valuation_multiples.count_documents({})
    if count > 0:
        return

    from services.taxonomy import TAXONOMY

    now = datetime.now(timezone.utc).isoformat()
    docs = []

    category_multiples = {
        "estrategia_marca_diseno": (3.5, 4.5, 5.5),
        "creatividad_produccion": (3.0, 4.0, 5.0),
        "comunicacion_pr_reputacion": (3.5, 4.5, 5.5),
        "experiencias_activacion": (2.5, 3.5, 4.5),
        "influencer_creator": (3.0, 4.0, 5.5),
        "medios_performance_programmatic": (4.0, 5.0, 6.5),
        "digital_growth_commerce": (4.0, 5.5, 7.0),
        "data_adtech_martech": (5.0, 6.5, 8.0),
        "consultoria_transformacion": (4.0, 5.0, 6.5),
        "soportes_media_owners": (3.0, 4.0, 5.0),
    }

    for cat in TAXONOMY:
        cat_id = cat["id"]
        mins, mids, maxs = category_multiples.get(cat_id, (3.5, 4.5, 5.5))
        docs.append({
            "scope_type": "category",
            "scope_id": cat_id,
            "scope_name": cat["name"],
            "multiple_min": mins,
            "multiple_mid": mids,
            "multiple_max": maxs,
            "source": "CIS",
            "is_active": True,
            "effective_from": now,
            "updated_by": "system_seed",
            "updated_at": now,
        })

    if docs:
        await db.valuation_multiples.insert_many(docs)


async def seed_default_settings(db):
    """Seed default settings if none exist."""
    count = await db.valuation_settings.count_documents({})
    if count > 0:
        return

    now = datetime.now(timezone.utc).isoformat()
    doc = {**DEFAULT_SETTINGS, "updated_at": now}
    await db.valuation_settings.insert_one(doc)
