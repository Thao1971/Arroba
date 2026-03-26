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
    # ── SELLERS ──
    {
        "plan_id": "seller_free",
        "role_type": "seller",
        "plan_name": "Seller Free",
        "plan_tagline": "Empieza a preparar la venta de tu agencia y publícala en ARROBA con una visibilidad básica.",
        "billing_type": "free",
        "monthly_price": 0,
        "annual_price": 0,
        "annual_discount_pct": 10,
        "success_fee_pct": 2.9,
        "revenue_share_pct": None,
        "monthly_interaction_limit": 0,
        "badge": None,
        "is_highlighted": False,
        "features": [
            "Alta inicial de compañía",
            "Valoración inicial automática",
            "Ficha inicial de venta",
            "Publicación básica en marketplace",
            "Visibilidad limitada de la operación",
        ],
        "is_active": True,
        "sort_order": 1,
    },
    {
        "plan_id": "seller_plus",
        "role_type": "seller",
        "plan_name": "Seller Plus",
        "plan_tagline": "Activa tu operación y gestiona el interés comprador desde ARROBA.",
        "billing_type": "recurring",
        "monthly_price": 149,
        "annual_price": 1609,
        "annual_discount_pct": 10,
        "success_fee_pct": 2.9,
        "revenue_share_pct": None,
        "monthly_interaction_limit": 5,
        "badge": None,
        "is_highlighted": True,
        "features": [
            "Todo lo incluido en Free",
            "Operación activa en la plataforma",
            "Dashboard de la operación",
            "Herramientas de preparación de la venta",
            "Data room ampliado",
            "Teaser e infomemo asistidos por IA",
            "Seguimiento del interés comprador",
            "Hasta 5 interacciones al mes",
        ],
        "is_active": True,
        "sort_order": 2,
    },
    {
        "plan_id": "seller_premium",
        "role_type": "seller",
        "plan_name": "Seller Premium",
        "plan_tagline": "Prepara la operación con más acompañamiento, más visibilidad y apoyo directo del equipo de ARROBA.",
        "billing_type": "recurring",
        "monthly_price": 499,
        "annual_price": 5389,
        "annual_discount_pct": 10,
        "success_fee_pct": 2.9,
        "revenue_share_pct": None,
        "monthly_interaction_limit": -1,
        "badge": "RECOMENDADO",
        "is_highlighted": False,
        "features": [
            "Todo lo incluido en Plus",
            "Teaser asistido por el equipo de ARROBA",
            "Infomemo asistido por el equipo de ARROBA",
            "Soporte prioritario",
            "Mayor visibilidad dentro de la plataforma",
            "Herramientas avanzadas de gestión",
            "Más profundidad analítica",
            "Interacciones ilimitadas",
        ],
        "is_active": True,
        "sort_order": 3,
    },
    # ── BUYERS ──
    {
        "plan_id": "buyer_free",
        "role_type": "buyer",
        "plan_name": "Buyer Free",
        "plan_tagline": "Explora oportunidades y crea tu perfil inversor dentro de ARROBA.",
        "billing_type": "free",
        "monthly_price": 0,
        "annual_price": 0,
        "annual_discount_pct": 10,
        "success_fee_pct": 1.0,
        "revenue_share_pct": None,
        "monthly_interaction_limit": 0,
        "badge": None,
        "is_highlighted": False,
        "features": [
            "Registro y perfil inversor",
            "Exploración básica del marketplace",
            "Guardado de oportunidades",
            "Sugerencias iniciales de oportunidades",
        ],
        "is_active": True,
        "sort_order": 1,
    },
    {
        "plan_id": "buyer_pro",
        "role_type": "buyer",
        "plan_name": "Buyer Pro",
        "plan_tagline": "Accede a más oportunidades y organiza mejor tu búsqueda de adquisiciones.",
        "billing_type": "recurring",
        "monthly_price": 149,
        "annual_price": 1609,
        "annual_discount_pct": 10,
        "success_fee_pct": 1.0,
        "revenue_share_pct": None,
        "monthly_interaction_limit": 5,
        "badge": None,
        "is_highlighted": True,
        "features": [
            "Todo lo incluido en Free",
            "Acceso ampliado a operaciones",
            "Filtros avanzados",
            "Alertas de nuevas oportunidades",
            "Seguimiento de oportunidades",
            "NDA y acceso condicionado según permisos",
            "Hasta 5 interacciones al mes",
        ],
        "is_active": True,
        "sort_order": 2,
    },
    {
        "plan_id": "buyer_proplus",
        "role_type": "buyer",
        "plan_name": "Buyer Pro+",
        "plan_tagline": "Pensado para compradores más activos que necesitan más prioridad, más capacidad de seguimiento y más profundidad.",
        "billing_type": "recurring",
        "monthly_price": 349,
        "annual_price": 3769,
        "annual_discount_pct": 10,
        "success_fee_pct": 1.0,
        "revenue_share_pct": None,
        "monthly_interaction_limit": -1,
        "badge": "RECOMENDADO",
        "is_highlighted": False,
        "features": [
            "Todo lo incluido en Pro",
            "Acceso prioritario a nuevos deals",
            "Herramientas avanzadas de seguimiento",
            "Soporte prioritario",
            "Interacciones ilimitadas",
        ],
        "is_active": True,
        "sort_order": 3,
    },
    # ── ADVISORS ──
    {
        "plan_id": "advisor_free",
        "role_type": "advisor",
        "plan_name": "Advisor Free",
        "plan_tagline": "Empieza a canalizar operaciones a través de ARROBA con un mandato activo.",
        "billing_type": "free",
        "monthly_price": 0,
        "annual_price": None,
        "annual_discount_pct": None,
        "success_fee_pct": None,
        "revenue_share_pct": 15,
        "monthly_interaction_limit": -1,
        "badge": None,
        "is_highlighted": False,
        "advisor_rules": {
            "max_active_mandates": 1,
        },
        "features": [
            "1 mandato activo gratis",
            "Acceso básico a la plataforma",
            "Gestión inicial de oportunidades",
            "Comisión del 15% sobre los honorarios pactados con su cliente",
            "Visibilidad sobre mandato y honorarios",
        ],
        "conditions": [],
        "is_active": True,
        "sort_order": 1,
    },
    {
        "plan_id": "advisor_pro",
        "role_type": "advisor",
        "plan_name": "Advisor Pro",
        "plan_tagline": "Pensado para asesores que gestionan varias operaciones activas dentro de ARROBA.",
        "billing_type": "recurring",
        "monthly_price": 250,
        "annual_price": None,
        "annual_discount_pct": None,
        "success_fee_pct": None,
        "revenue_share_pct": 15,
        "monthly_interaction_limit": -1,
        "badge": "PARTNER",
        "is_highlighted": True,
        "advisor_rules": {
            "min_active_mandates": 2,
            "allowed_commitment_months": [6, 12],
        },
        "features": [
            "Todo lo incluido en Advisor Free",
            "A partir de 2 mandatos activos",
            "Gestión recurrente de múltiples oportunidades",
            "Comisión del 15% sobre los honorarios pactados con su cliente",
            "Contratación mínima de 6 o 12 meses",
            "Trazabilidad contractual y validación de honorarios",
        ],
        "conditions": [
            "Contratación mínima de 6 o 12 meses",
            "No disponible en modalidad mensual",
            "Es necesaria trazabilidad contractual para validar honorarios y liquidaciones",
        ],
        "is_active": True,
        "sort_order": 2,
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

INTERACTION_TYPES = [
    {"type": "interest", "label": "Interés enviado o recibido", "weight": 1},
    {"type": "contact_unlock", "label": "Contacto desbloqueado", "weight": 1},
    {"type": "meeting_scheduled", "label": "Reunión solicitada o agendada", "weight": 1},
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
        "answer": "Los advisors operan bajo un modelo de revenue share. ARROBA retiene el 15% de los honorarios pactados entre el advisor y su cliente, siempre bajo contrato transparente y con visibilidad completa del mandato. El primer mandato es gratuito. A partir de 2 mandatos activos, se aplica una cuota de 250 €/mes con contratación mínima de 6 o 12 meses.",
    },
    {
        "question": "¿Qué documentación puede exigir la plataforma?",
        "answer": "ARROBA puede solicitar documentación que acredite la existencia del mandato, los honorarios pactados y la validez de la operación. Esto garantiza transparencia y protección para todas las partes.",
    },
    {
        "question": "¿Cómo se calculan los honorarios variables?",
        "answer": "Los honorarios variables se calculan sobre el valor final de la transacción cerrada (en el caso de sellers y buyers) o sobre los honorarios declarados por el advisor. Las condiciones exactas se detallan en el contrato de cada servicio.",
    },
    {
        "question": "¿Qué cuenta como interacción?",
        "answer": "Las interacciones son acciones activas dentro de la plataforma: intereses enviados o recibidos, contactos desbloqueados y reuniones solicitadas o agendadas. Cada una consume una unidad de tu límite mensual. Los planes Free pueden recibir notificaciones, pero necesitan subir de nivel para gestionar la interacción completa.",
    },
]


async def seed_plans(database):
    """Seed default plans if none exist. Drop and reseed if structure changed."""
    existing = await database.plans.find_one({"plan_id": "advisor_free"}, {"_id": 0})
    if not existing:
        await database.plans.delete_many({})
        await database.transaction_fee_rules.delete_many({})

    count = await database.plans.count_documents({})
    if count > 0:
        return

    now = datetime.now(timezone.utc).isoformat()
    docs = [{**p, "created_at": now, "updated_at": now} for p in DEFAULT_PLANS]
    await database.plans.insert_many(docs)

    fee_docs = [{**f, "created_at": now, "updated_at": now} for f in DEFAULT_FEE_RULES]
    await database.transaction_fee_rules.insert_many(fee_docs)


@router.get("/public")
async def get_public_plans():
    """Get all active plans grouped by role, fee rules, FAQ, and interaction types."""
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
        "interaction_types": INTERACTION_TYPES,
    }
