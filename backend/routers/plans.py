"""
Plans & Pricing configuration module.
Serves plan data from DB (seeded defaults) for the pricing page.
Prepared for future admin management.
"""
from fastapi import APIRouter
from database import db
from datetime import datetime, timezone

router = APIRouter(prefix="/plans", tags=["Plans"])

# ─── Default plans seed data ───
DEFAULT_PLANS = [
    # SELLERS
    {
        "plan_id": "seller_free",
        "role_type": "seller",
        "plan_name": "Seller Free",
        "billing_type": "free",
        "monthly_price": 0,
        "annual_price": 0,
        "success_fee_pct": 2.9,
        "revenue_share_pct": None,
        "badge": None,
        "is_highlighted": False,
        "features": [
            "Registro y perfil de vendedor",
            "Alta inicial de compañía",
            "Valoración inicial automática",
            "Borrador de deal",
            "Acceso básico al entorno seller",
        ],
        "is_active": True,
        "sort_order": 1,
    },
    {
        "plan_id": "seller_plus",
        "role_type": "seller",
        "plan_name": "Seller Plus",
        "billing_type": "recurring",
        "monthly_price": 149,
        "annual_price": 1490,
        "success_fee_pct": 2.9,
        "revenue_share_pct": None,
        "badge": None,
        "is_highlighted": True,
        "features": [
            "Todo lo incluido en Free",
            "Publicación activa del deal",
            "Herramientas de preparación del deal",
            "Data room ampliado",
            "Teaser e infomemo asistidos por IA",
            "Seguimiento básico del interés comprador",
            "Readiness y checklist de publicación",
        ],
        "is_active": True,
        "sort_order": 2,
    },
    {
        "plan_id": "seller_premium",
        "role_type": "seller",
        "plan_name": "Seller Premium",
        "billing_type": "recurring",
        "monthly_price": 499,
        "annual_price": 4990,
        "success_fee_pct": 2.9,
        "revenue_share_pct": None,
        "badge": "RECOMENDADO",
        "is_highlighted": False,
        "features": [
            "Todo lo incluido en Plus",
            "Soporte prioritario del equipo ARROBA",
            "Mayor visibilidad en el marketplace",
            "Funcionalidades avanzadas de proceso",
            "Analítica en profundidad del deal",
            "Gestión completa del ciclo de venta",
        ],
        "is_active": True,
        "sort_order": 3,
    },
    # BUYERS
    {
        "plan_id": "buyer_free",
        "role_type": "buyer",
        "plan_name": "Buyer Free",
        "billing_type": "free",
        "monthly_price": 0,
        "annual_price": 0,
        "success_fee_pct": 1.0,
        "revenue_share_pct": None,
        "badge": None,
        "is_highlighted": False,
        "features": [
            "Registro y perfil inversor",
            "Exploración básica del marketplace",
            "Guardar oportunidades",
            "Acceso básico al entorno buyer",
        ],
        "is_active": True,
        "sort_order": 1,
    },
    {
        "plan_id": "buyer_pro",
        "role_type": "buyer",
        "plan_name": "Buyer Pro",
        "billing_type": "recurring",
        "monthly_price": 149,
        "annual_price": 1490,
        "success_fee_pct": 1.0,
        "revenue_share_pct": None,
        "badge": None,
        "is_highlighted": True,
        "features": [
            "Todo lo incluido en Free",
            "Acceso ampliado a deals publicados",
            "Filtros avanzados y búsqueda sectorial",
            "Alertas de nuevas oportunidades",
            "Seguimiento activo de procesos",
            "NDA digital y acceso condicionado",
        ],
        "is_active": True,
        "sort_order": 2,
    },
    {
        "plan_id": "buyer_proplus",
        "role_type": "buyer",
        "plan_name": "Buyer Pro+",
        "billing_type": "recurring",
        "monthly_price": 349,
        "annual_price": 3490,
        "success_fee_pct": 1.0,
        "revenue_share_pct": None,
        "badge": "RECOMENDADO",
        "is_highlighted": False,
        "features": [
            "Todo lo incluido en Pro",
            "Acceso prioritario a nuevos deals",
            "Herramientas avanzadas de análisis",
            "Soporte prioritario del equipo ARROBA",
            "Funcionalidades de equipo y colaboración",
        ],
        "is_active": True,
        "sort_order": 3,
    },
    # ADVISORS
    {
        "plan_id": "advisor_partner",
        "role_type": "advisor",
        "plan_name": "Advisor Partner",
        "billing_type": "revenue_share",
        "monthly_price": None,
        "annual_price": None,
        "success_fee_pct": None,
        "revenue_share_pct": 15,
        "badge": "PARTNER",
        "is_highlighted": True,
        "features": [
            "Acceso completo a la plataforma",
            "Gestión y seguimiento de mandatos",
            "Canalización de operaciones a través de ARROBA",
            "Revenue share del 15% sobre honorarios pactados",
            "Contrato transparente con visibilidad del mandato",
            "Trazabilidad completa de la operación",
        ],
        "is_active": True,
        "sort_order": 1,
    },
]

DEFAULT_FEE_RULES = [
    {
        "rule_id": "seller_success_fee",
        "role_type": "seller",
        "fee_type": "success_fee",
        "percentage": 2.9,
        "description": "Comisión de éxito aplicable sobre el valor de la transacción cerrada.",
        "effective_from": "2026-01-01",
        "is_active": True,
    },
    {
        "rule_id": "buyer_success_fee",
        "role_type": "buyer",
        "fee_type": "success_fee",
        "percentage": 1.0,
        "description": "Comisión de éxito aplicable sobre el valor de la transacción cerrada.",
        "effective_from": "2026-01-01",
        "is_active": True,
    },
    {
        "rule_id": "advisor_revenue_share",
        "role_type": "advisor",
        "fee_type": "revenue_share",
        "percentage": 15,
        "description": "Revenue share sobre los honorarios pactados por el advisor con su cliente.",
        "effective_from": "2026-01-01",
        "is_active": True,
    },
]

FAQ_ITEMS = [
    {
        "question": "¿Puedo empezar gratis?",
        "answer": "Sí. Tanto sellers como buyers pueden registrarse y acceder a las funcionalidades básicas de la plataforma sin coste. Los planes de pago desbloquean herramientas más avanzadas según tus necesidades.",
    },
    {
        "question": "¿Cuándo se aplica la comisión de éxito?",
        "answer": "La comisión de éxito solo se aplica si la operación se cierra efectivamente. No hay coste adicional por explorar, negociar o recibir ofertas. Es un modelo alineado con el resultado.",
    },
    {
        "question": "¿La comisión de éxito sustituye a la suscripción?",
        "answer": "No. La suscripción da acceso a herramientas y funcionalidades de la plataforma. La comisión de éxito es un componente independiente que solo aplica cuando una transacción se materializa.",
    },
    {
        "question": "¿Cómo funciona el programa Advisor Partner?",
        "answer": "Los advisors operan bajo un modelo de revenue share. ARROBA retiene el 15% de los honorarios pactados entre el advisor y su cliente, siempre bajo contrato transparente y con visibilidad completa del mandato.",
    },
    {
        "question": "¿Qué documentación puede exigir la plataforma?",
        "answer": "ARROBA puede solicitar documentación que acredite la existencia del mandato, los honorarios pactados y la validez de la operación. Esto garantiza transparencia y protección para todas las partes.",
    },
    {
        "question": "¿Cómo se calculan los honorarios variables?",
        "answer": "Los honorarios variables se calculan sobre el valor final de la transacción cerrada (en el caso de sellers y buyers) o sobre los honorarios declarados por el advisor. Las condiciones exactas se detallan en el contrato de cada servicio.",
    },
]


async def seed_plans(database):
    """Seed default plans if none exist."""
    count = await database.plans.count_documents({})
    if count > 0:
        return
    now = datetime.now(timezone.utc).isoformat()
    docs = [{**p, "created_at": now, "updated_at": now} for p in DEFAULT_PLANS]
    await database.plans.insert_many(docs)

    fee_count = await database.transaction_fee_rules.count_documents({})
    if fee_count == 0:
        fee_docs = [{**f, "created_at": now, "updated_at": now} for f in DEFAULT_FEE_RULES]
        await database.transaction_fee_rules.insert_many(fee_docs)


@router.get("/public")
async def get_public_plans():
    """Get all active plans grouped by role, fee rules, and FAQ."""
    plans_cursor = db.plans.find({"is_active": True}, {"_id": 0}).sort("sort_order", 1)
    plans = await plans_cursor.to_list(length=50)

    fees_cursor = db.transaction_fee_rules.find({"is_active": True}, {"_id": 0})
    fees = await fees_cursor.to_list(length=20)

    grouped = {"seller": [], "buyer": [], "advisor": []}
    for p in plans:
        role = p.get("role_type", "seller")
        if role in grouped:
            grouped[role].append(p)

    fee_map = {}
    for f in fees:
        fee_map[f["role_type"]] = f

    return {
        "plans": grouped,
        "fee_rules": fee_map,
        "faq": FAQ_ITEMS,
    }
