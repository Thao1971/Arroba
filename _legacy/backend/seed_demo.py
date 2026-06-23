#!/usr/bin/env python3
"""
ARROBA — Seed Script + Demo Data Generator
==========================================
Genera datos realistas con HISTORIAS COMPLETAS para auditar todo el sistema.
Cada deal tiene un narrativo claro, edge cases incluidos.

Uso:
  cd /app/backend && python seed_demo.py

Output: Resumen detallado en consola para validar SIN abrir la UI.
"""
import os
import sys
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

if not MONGO_URL or not DB_NAME:
    print("ERROR: MONGO_URL o DB_NAME no configurados en .env")
    sys.exit(1)

client = MongoClient(MONGO_URL)
db = client[DB_NAME]
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_PASSWORD = "demo2026"
DEMO_HASH = pwd_context.hash(DEMO_PASSWORD)

# Timestamps helpers
NOW = datetime.now(timezone.utc)
def ago(days=0, hours=0, minutes=0):
    return (NOW - timedelta(days=days, hours=hours, minutes=minutes)).isoformat()

# ============================================================
# STEP 0: CLEAN ALL SEED/DEMO DATA
# ============================================================
def clean_db():
    """Wipe all collections used by the demo."""
    collections = [
        "users", "companies", "deals", "engagements",
        "events", "notifications", "time_tracking",
        "dataroom_access_log", "dataroom_documents", "dataroom_permissions",
        "saved_deals", "matches", "teasers", "infomemos",
    ]
    for c in collections:
        result = db[c].delete_many({})
        print(f"  Limpiado {c}: {result.deleted_count} docs")

# ============================================================
# BUYERS (10)
# ============================================================
BUYERS = [
    {
        "user_id": "buyer_pe_madrid_01",
        "email": "carlos.ruiz@capitaliberica.es",
        "first_name": "Carlos",
        "last_name": "Ruiz Martínez",
        "role": "buyer",
        "buyer_profile": {
            "type": "financial_pe",
            "operation_types": ["full_sale", "partial_sale"],
            "ticket_min": 500000,
            "ticket_max": 5000000,
            "revenue_range_min": 1000000,
            "revenue_range_max": 10000000,
            "ebitda_range_min": 200000,
            "ebitda_range_max": 2000000,
            "sectors": ["SEO", "SEM", "Performance"],
            "taxonomy_categories": ["BUD-MKT-SEO", "BUD-MKT-SEM"],
            "geographies": ["Madrid", "España"],
            "urgency": "high",
            "control_preference": "control",
            "profile_complete": True,
        }
    },
    {
        "user_id": "buyer_estrategico_bcn_01",
        "email": "marta.font@groupdigital.cat",
        "first_name": "Marta",
        "last_name": "Font Puig",
        "role": "buyer",
        "buyer_profile": {
            "type": "strategic",
            "operation_types": ["full_sale", "merger"],
            "ticket_min": 1000000,
            "ticket_max": 8000000,
            "revenue_range_min": 2000000,
            "revenue_range_max": 15000000,
            "ebitda_range_min": 400000,
            "ebitda_range_max": 3000000,
            "sectors": ["SEO", "Branding", "Creative"],
            "taxonomy_categories": ["BUD-MKT-SEO", "BUD-CRE-BRAND"],
            "geographies": ["Barcelona", "España", "Europa"],
            "urgency": "medium",
            "control_preference": "flexible",
            "profile_complete": True,
        }
    },
    {
        "user_id": "buyer_vc_london_01",
        "email": "james.harris@techventures.co.uk",
        "first_name": "James",
        "last_name": "Harris",
        "role": "buyer",
        "buyer_profile": {
            "type": "financial_vc",
            "operation_types": ["partial_sale"],
            "ticket_min": 2000000,
            "ticket_max": 20000000,
            "revenue_range_min": 3000000,
            "revenue_range_max": 50000000,
            "ebitda_range_min": 500000,
            "ebitda_range_max": 10000000,
            "sectors": ["Tech", "SaaS", "Digital"],
            "taxonomy_categories": ["BUD-TECH-SAAS", "BUD-MKT-SEO"],
            "geographies": ["España", "Europa", "UK"],
            "urgency": "low",
            "control_preference": "minority",
            "profile_complete": True,
        }
    },
    {
        "user_id": "buyer_fo_bilbao_01",
        "email": "iker.aguirre@familyoffice-norte.es",
        "first_name": "Iker",
        "last_name": "Aguirre Etxebarría",
        "role": "buyer",
        "buyer_profile": {
            "type": "financial_fo",
            "operation_types": ["full_sale", "partial_sale"],
            "ticket_min": 300000,
            "ticket_max": 3000000,
            "revenue_range_min": 500000,
            "revenue_range_max": 5000000,
            "ebitda_range_min": 100000,
            "ebitda_range_max": 1000000,
            "sectors": ["Creative", "Performance", "Media"],
            "taxonomy_categories": ["BUD-CRE-BRAND", "BUD-MKT-PERF"],
            "geographies": ["País Vasco", "España"],
            "urgency": "medium",
            "control_preference": "control",
            "profile_complete": True,
        }
    },
    {
        "user_id": "buyer_holding_val_01",
        "email": "lucia.navarro@holdingmediterraneo.es",
        "first_name": "Lucía",
        "last_name": "Navarro Gil",
        "role": "buyer",
        "buyer_profile": {
            "type": "financial_holding",
            "operation_types": ["full_sale"],
            "ticket_min": 200000,
            "ticket_max": 2000000,
            "revenue_range_min": 400000,
            "revenue_range_max": 4000000,
            "ebitda_range_min": 80000,
            "ebitda_range_max": 800000,
            "sectors": ["Consulting", "Digital", "Creative"],
            "taxonomy_categories": ["BUD-CON-STRAT", "BUD-CRE-BRAND"],
            "geographies": ["Valencia", "España"],
            "urgency": "low",
            "control_preference": "flexible",
            "profile_complete": True,
        }
    },
    {
        "user_id": "buyer_pe_sevilla_02",
        "email": "antonio.moreno@andaluciacapital.es",
        "first_name": "Antonio",
        "last_name": "Moreno López",
        "role": "buyer",
        "buyer_profile": {
            "type": "financial_pe",
            "operation_types": ["full_sale", "partial_sale"],
            "ticket_min": 400000,
            "ticket_max": 4000000,
            "revenue_range_min": 800000,
            "revenue_range_max": 8000000,
            "ebitda_range_min": 150000,
            "ebitda_range_max": 1500000,
            "sectors": ["Consulting", "Strategy", "Digital"],
            "taxonomy_categories": ["BUD-CON-STRAT", "BUD-TECH-SAAS"],
            "geographies": ["Sevilla", "España"],
            "urgency": "high",
            "control_preference": "control",
            "profile_complete": True,
        }
    },
    {
        "user_id": "buyer_estrategico_mad_02",
        "email": "pablo.garcia@nexusdigital.es",
        "first_name": "Pablo",
        "last_name": "García Hernández",
        "role": "buyer",
        "buyer_profile": {
            "type": "strategic",
            "operation_types": ["full_sale", "merger"],
            "ticket_min": 600000,
            "ticket_max": 6000000,
            "revenue_range_min": 1000000,
            "revenue_range_max": 12000000,
            "ebitda_range_min": 200000,
            "ebitda_range_max": 2500000,
            "sectors": ["Strategy", "Consulting", "Performance"],
            "taxonomy_categories": ["BUD-CON-STRAT", "BUD-MKT-PERF"],
            "geographies": ["Madrid", "España"],
            "urgency": "medium",
            "control_preference": "flexible",
            "profile_complete": True,
        }
    },
    {
        "user_id": "buyer_vc_bcn_02",
        "email": "anna.soler@bcnventures.cat",
        "first_name": "Anna",
        "last_name": "Soler Mas",
        "role": "buyer",
        "buyer_profile": {
            "type": "financial_vc",
            "operation_types": ["partial_sale"],
            "ticket_min": 1000000,
            "ticket_max": 10000000,
            "revenue_range_min": 2000000,
            "revenue_range_max": 20000000,
            "ebitda_range_min": 300000,
            "ebitda_range_max": 5000000,
            "sectors": ["Creative", "Content", "Media"],
            "taxonomy_categories": ["BUD-CRE-BRAND", "BUD-MED-SOCIAL"],
            "geographies": ["Barcelona", "España", "Europa"],
            "urgency": "low",
            "control_preference": "minority",
            "profile_complete": True,
        }
    },
    {
        "user_id": "buyer_fo_malaga_02",
        "email": "carmen.delgado@costafamily.es",
        "first_name": "Carmen",
        "last_name": "Delgado Reyes",
        "role": "buyer",
        "buyer_profile": {
            "type": "financial_fo",
            "operation_types": ["full_sale"],
            "ticket_min": 250000,
            "ticket_max": 2500000,
            "revenue_range_min": 500000,
            "revenue_range_max": 5000000,
            "ebitda_range_min": 100000,
            "ebitda_range_max": 1000000,
            "sectors": ["Content", "Digital", "Media"],
            "taxonomy_categories": ["BUD-MED-SOCIAL", "BUD-TECH-SAAS"],
            "geographies": ["Málaga", "Andalucía", "España"],
            "urgency": "medium",
            "control_preference": "control",
            "profile_complete": True,
        }
    },
    {
        "user_id": "buyer_holding_zar_02",
        "email": "jorge.lazaro@aragonholding.es",
        "first_name": "Jorge",
        "last_name": "Lázaro Pardo",
        "role": "buyer",
        "buyer_profile": {
            "type": "financial_holding",
            "operation_types": ["full_sale", "partial_sale"],
            "ticket_min": 200000,
            "ticket_max": 2000000,
            "revenue_range_min": 300000,
            "revenue_range_max": 3000000,
            "ebitda_range_min": 50000,
            "ebitda_range_max": 500000,
            "sectors": ["Performance", "Media", "Creative"],
            "taxonomy_categories": ["BUD-MKT-PERF", "BUD-MED-SOCIAL"],
            "geographies": ["Zaragoza", "España"],
            "urgency": "high",
            "control_preference": "flexible",
            "profile_complete": True,
        }
    },
]

# ============================================================
# SELLERS (10) — one per deal
# ============================================================
SELLERS = [
    {"user_id": "seller_seo_madrid_01", "email": "diego.martin@rankingdigital.es", "first_name": "Diego", "last_name": "Martín Sánchez", "company_name": "Ranking Digital S.L.", "company_type": "digital_agency", "city": "Madrid", "region": "Comunidad de Madrid"},
    {"user_id": "seller_creative_bcn_01", "email": "nuria.costa@brillocreativo.cat", "first_name": "Nuria", "last_name": "Costa Rovira", "company_name": "Brillo Creativo S.L.", "company_type": "creative_agency", "city": "Barcelona", "region": "Cataluña"},
    {"user_id": "seller_consult_val_01", "email": "rafael.torres@consultdigital.es", "first_name": "Rafael", "last_name": "Torres Blanco", "company_name": "ConsultDigital Valencia S.L.", "company_type": "consultancy", "city": "Valencia", "region": "Comunidad Valenciana"},
    {"user_id": "seller_tech_sev_01", "email": "elena.romero@techstudio.es", "first_name": "Elena", "last_name": "Romero Vega", "company_name": "Tech Studio Sevilla S.L.", "company_type": "tech_studio", "city": "Sevilla", "region": "Andalucía"},
    {"user_id": "seller_media_bil_01", "email": "aitor.etxebarria@mediapais.es", "first_name": "Aitor", "last_name": "Etxebarría Zubiri", "company_name": "Media País Vasco S.L.", "company_type": "media_agency", "city": "Bilbao", "region": "País Vasco"},
    {"user_id": "seller_perf_mal_01", "email": "rosa.jimenez@clicksur.es", "first_name": "Rosa", "last_name": "Jiménez Molina", "company_name": "ClickSur Performance S.L.", "company_type": "digital_agency", "city": "Málaga", "region": "Andalucía"},
    {"user_id": "seller_strat_mad_01", "email": "fernando.ruiz@stratconsulting.es", "first_name": "Fernando", "last_name": "Ruiz Ortega", "company_name": "Strat Consulting Group S.L.", "company_type": "consultancy", "city": "Madrid", "region": "Comunidad de Madrid"},
    {"user_id": "seller_content_zar_01", "email": "silvia.marco@contenidoszgz.es", "first_name": "Silvia", "last_name": "Marco Serrano", "company_name": "Contenidos Zaragoza S.L.", "company_type": "creative_agency", "city": "Zaragoza", "region": "Aragón"},
    {"user_id": "seller_digital_ast_01", "email": "marcos.fernandez@asturdigital.es", "first_name": "Marcos", "last_name": "Fernández Cuesta", "company_name": "AsturDigital Studio S.L.", "company_type": "tech_studio", "city": "Oviedo", "region": "Asturias"},
    {"user_id": "seller_mobile_can_01", "email": "alba.hernandez@islasapp.es", "first_name": "Alba", "last_name": "Hernández Pérez", "company_name": "Islas App Agency S.L.", "company_type": "digital_agency", "city": "Las Palmas", "region": "Canarias"},
]

# ============================================================
# INSERT USERS
# ============================================================
def insert_users():
    print("\n--- Insertando Usuarios ---")
    count_b = 0
    count_s = 0

    for b in BUYERS:
        doc = {
            "user_id": b["user_id"],
            "email": b["email"],
            "first_name": b["first_name"],
            "last_name": b["last_name"],
            "role": b["role"],
            "password_hash": DEMO_HASH,
            "buyer_profile": b["buyer_profile"],
            "seller_profile": None,
            "advisor_profile": None,
            "deal_manager": None,
            "subscription_id": None,
            "email_verified": True,
            "is_active": True,
            "created_at": ago(days=30),
            "updated_at": ago(days=1),
            "last_login": ago(hours=2),
        }
        db.users.insert_one(doc)
        count_b += 1

    for s in SELLERS:
        doc = {
            "user_id": s["user_id"],
            "email": s["email"],
            "first_name": s["first_name"],
            "last_name": s["last_name"],
            "role": "seller",
            "password_hash": DEMO_HASH,
            "buyer_profile": None,
            "seller_profile": {"company_id": None},
            "advisor_profile": None,
            "deal_manager": None,
            "subscription_id": None,
            "email_verified": True,
            "is_active": True,
            "created_at": ago(days=60),
            "updated_at": ago(days=1),
            "last_login": ago(hours=4),
        }
        db.users.insert_one(doc)
        count_s += 1

    print(f"  Buyers insertados: {count_b}")
    print(f"  Sellers insertados: {count_s}")

# ============================================================
# INSERT COMPANIES
# ============================================================
COMPANIES = []

def build_companies():
    specs = [
        {"company_id": "comp_ranking_digital", "seller": SELLERS[0], "sectors": ["SEO", "SEM", "Performance"], "specializations": ["SEO técnico", "Link building", "Analytics"], "founded_year": 2012, "employees": 45, "revenue": 3200000, "ebitda": 640000, "description": "Agencia SEO líder en Madrid con clientes enterprise."},
        {"company_id": "comp_brillo_creativo", "seller": SELLERS[1], "sectors": ["Branding", "Creative", "UX/UI"], "specializations": ["Identidad visual", "Campañas creativas", "UX Research"], "founded_year": 2015, "employees": 32, "revenue": 2100000, "ebitda": 378000, "description": "Estudio creativo boutique en el Eixample de Barcelona."},
        {"company_id": "comp_consult_valencia", "seller": SELLERS[2], "sectors": ["Consulting", "Digital Transformation"], "specializations": ["Transformación digital", "Estrategia CRM"], "founded_year": 2010, "employees": 18, "revenue": 1400000, "ebitda": 252000, "description": "Consultora digital especializada en pymes del Levante."},
        {"company_id": "comp_tech_studio_sev", "seller": SELLERS[3], "sectors": ["Tech", "SaaS", "Development"], "specializations": ["Desarrollo web", "Apps móviles", "SaaS"], "founded_year": 2018, "employees": 22, "revenue": 1800000, "ebitda": 324000, "description": "Estudio tech en Sevilla con producto SaaS propio."},
        {"company_id": "comp_media_bilbao", "seller": SELLERS[4], "sectors": ["Media", "Social Media", "PR"], "specializations": ["Social Media Management", "Influencer Marketing", "PR Digital"], "founded_year": 2014, "employees": 28, "revenue": 2500000, "ebitda": 450000, "description": "Agencia de medios con fuerte presencia en País Vasco y Navarra."},
        {"company_id": "comp_clicksur_malaga", "seller": SELLERS[5], "sectors": ["Performance", "SEM", "Programmatic"], "specializations": ["Google Ads", "Facebook Ads", "Programmatic Buying"], "founded_year": 2016, "employees": 35, "revenue": 2800000, "ebitda": 504000, "description": "Agencia de performance con alto crecimiento en Costa del Sol."},
        {"company_id": "comp_strat_madrid", "seller": SELLERS[6], "sectors": ["Strategy", "Consulting", "M&A Advisory"], "specializations": ["Due diligence comercial", "Valoración digital", "Integración post-M&A"], "founded_year": 2008, "employees": 55, "revenue": 5200000, "ebitda": 1040000, "description": "Consultora estratégica de referencia para operaciones M&A en digital."},
        {"company_id": "comp_contenidos_zgz", "seller": SELLERS[7], "sectors": ["Content", "Copywriting", "Social Media"], "specializations": ["Content marketing", "Storytelling", "Video"], "founded_year": 2017, "employees": 15, "revenue": 900000, "ebitda": 135000, "description": "Agencia de contenidos en Zaragoza, nicho corporativo."},
        {"company_id": "comp_astur_digital", "seller": SELLERS[8], "sectors": ["Digital", "Development", "Design"], "specializations": ["WordPress", "E-commerce", "Diseño web"], "founded_year": 2019, "employees": 10, "revenue": 600000, "ebitda": 90000, "description": "Estudio digital en Oviedo, centrado en pymes asturianas."},
        {"company_id": "comp_islas_app", "seller": SELLERS[9], "sectors": ["Mobile", "App Development"], "specializations": ["Apps nativas", "React Native", "Flutter"], "founded_year": 2020, "employees": 8, "revenue": 450000, "ebitda": 67500, "description": "Agencia de apps móviles en Canarias, early stage."},
    ]

    for sp in specs:
        s = sp["seller"]
        doc = {
            "company_id": sp["company_id"],
            "owner_id": s["user_id"],
            "owner_type": "seller",
            "legal_name": s["company_name"],
            "trade_name": s["company_name"].replace(" S.L.", ""),
            "cif": None,
            "country": "España",
            "region": s["region"],
            "city": s["city"],
            "company_type": s["company_type"],
            "sectors": sp["sectors"],
            "specializations": sp["specializations"],
            "founded_year": sp["founded_year"],
            "employees_count": sp["employees"],
            "description": sp["description"],
            "highlights": sp["specializations"][:2],
            "financials": [
                {"year": 2024, "revenue": sp["revenue"], "ebitda": sp["ebitda"], "ebitda_margin": round(sp["ebitda"]/sp["revenue"]*100, 1), "growth_rate": 15.0, "data_source": "MANUAL"},
                {"year": 2023, "revenue": int(sp["revenue"]*0.87), "ebitda": int(sp["ebitda"]*0.82), "ebitda_margin": round(sp["ebitda"]*0.82/(sp["revenue"]*0.87)*100, 1), "growth_rate": 12.0, "data_source": "MANUAL"},
            ],
            "valuation_inputs": {
                "founder_dependency": "medium",
                "recurring_revenue_type": "mixed",
                "main_clients": 5,
                "client_retention_rate": 85.0,
                "tech_assets": s["company_type"] == "tech_studio",
                "proprietary_ip": False,
            },
            "valuation": {
                "calculated_at": ago(days=10),
                "ebitda_normalized": sp["ebitda"],
                "multiple_min": 4.0,
                "multiple_max": 7.0,
                "valuation_min": sp["ebitda"] * 4,
                "valuation_max": sp["ebitda"] * 7,
                "drivers": ["Crecimiento sostenido", "Base de clientes diversificada"],
            },
            "documents": [],
            "created_at": ago(days=45),
            "updated_at": ago(days=2),
            "imported_from_api": False,
        }
        COMPANIES.append(doc)
        # Link company to seller
        db.users.update_one({"user_id": s["user_id"]}, {"$set": {"seller_profile.company_id": sp["company_id"]}})

def insert_companies():
    print("\n--- Insertando Empresas ---")
    build_companies()
    for c in COMPANIES:
        db.companies.insert_one(c)
    print(f"  Empresas insertadas: {len(COMPANIES)}")

# ============================================================
# DEALS — 10 STORIES
# ============================================================
DEALS = []

def build_deals():
    # Helper to build a deal dict
    def make_deal(deal_id, company_idx, status, asking_price, teaser, ndas=None, lois=None, shortlist=None, exclusivity=None, metrics=None, published_days_ago=None, status_history=None):
        c = COMPANIES[company_idx]
        s = SELLERS[company_idx]
        d = {
            "deal_id": deal_id,
            "company_id": c["company_id"],
            "owner_id": s["user_id"],
            "status": status,
            "status_history": status_history or [{"status": "draft", "changed_at": ago(days=40), "changed_by": s["user_id"]}],
            "operation_types_allowed": ["full_sale"],
            "asking_price": asking_price,
            "price_negotiable": True,
            "price_vs_valuation_flag": False,
            "teaser": teaser,
            "infomemo": {"generated_at": ago(days=20), "content": f"Infomemo detallado de {c['legal_name']}. Empresa fundada en {c['founded_year']} con {c['employees_count']} empleados...", "version": 1},
            "dataroom": {"folders": []},
            "access_requests": [],
            "ndas_signed": ndas or [],
            "lois": lois or [],
            "shortlist": shortlist,
            "exclusivity": exclusivity,
            "metrics": metrics or {"views": 0, "teaser_views": 0, "access_requests_count": 0, "ndas_signed_count": 0, "lois_received_count": 0},
            "matching_scores": [],
            "readiness_score": 0,
            "readiness_checklist": [],
            "deal_manager": None,
            "closing": None,
            "created_at": ago(days=35),
            "updated_at": ago(hours=6),
            "activated_at": ago(days=30) if status != "draft" else None,
            "published_at": ago(days=published_days_ago) if published_days_ago else None,
        }
        return d

    # -----------------------------------------------------------
    # DEAL 1: HOT DEAL — Agencia SEO Madrid
    # 3 buyers, 2 LOIs, 1 exclusividad, alta actividad DR
    # -----------------------------------------------------------
    DEALS.append(make_deal(
        deal_id="deal_hot_seo_01",
        company_idx=0,
        status="exclusivity",
        asking_price=3500000,
        teaser={
            "headline": "Agencia SEO líder en Madrid — Alta rentabilidad",
            "description": "Oportunidad de adquirir una agencia SEO consolidada con 45 empleados, clientes enterprise y EBITDA de 640K.",
            "highlights": ["EBITDA 640K (20%)", "45 empleados", "Clientes Fortune 500 España"],
            "revenue_display": "3.2M",
            "ebitda_display": "640K",
            "sector_display": "SEO / Performance",
            "geography_display": "Madrid",
            "year_founded": 2012,
        },
        ndas=[
            {"buyer_id": "buyer_pe_madrid_01", "signed_at": ago(days=25)},
            {"buyer_id": "buyer_estrategico_bcn_01", "signed_at": ago(days=22)},
            {"buyer_id": "buyer_vc_london_01", "signed_at": ago(days=20)},
        ],
        lois=[{"loi_id": "eng_hot_seo_pe"}, {"loi_id": "eng_hot_seo_strat"}],
        shortlist={"buyers": ["buyer_pe_madrid_01", "buyer_estrategico_bcn_01"], "created_at": ago(days=8), "created_by": "seller_seo_madrid_01"},
        exclusivity={"buyer_id": "buyer_pe_madrid_01", "granted_at": ago(days=3), "terms": "60 días de exclusividad para due diligence"},
        metrics={"views": 156, "teaser_views": 312, "access_requests_count": 3, "ndas_signed_count": 3, "lois_received_count": 2},
        published_days_ago=28,
        status_history=[
            {"status": "draft", "changed_at": ago(days=35), "changed_by": "seller_seo_madrid_01"},
            {"status": "published", "changed_at": ago(days=28), "changed_by": "seller_seo_madrid_01"},
            {"status": "exclusivity", "changed_at": ago(days=3), "changed_by": "seller_seo_madrid_01", "notes": "Exclusividad otorgada a buyer_pe_madrid_01"},
        ],
    ))

    # -----------------------------------------------------------
    # DEAL 2: MUCHO INTERES, POCA CONVERSION — Agencia Creativa BCN
    # 5 NDAs, 3 interests, 0 LOIs
    # -----------------------------------------------------------
    DEALS.append(make_deal(
        deal_id="deal_interest_creative_02",
        company_idx=1,
        status="published",
        asking_price=2000000,
        teaser={
            "headline": "Estudio creativo boutique en Barcelona",
            "description": "Agencia creativa con identidad fuerte, 32 empleados y cartera de clientes premium.",
            "highlights": ["Marca reconocida", "32 empleados", "Clientes premium retail"],
            "revenue_display": "2.1M",
            "ebitda_display": "378K",
            "sector_display": "Branding / Creative",
            "geography_display": "Barcelona",
            "year_founded": 2015,
        },
        ndas=[
            {"buyer_id": "buyer_estrategico_bcn_01", "signed_at": ago(days=18)},
            {"buyer_id": "buyer_fo_bilbao_01", "signed_at": ago(days=16)},
            {"buyer_id": "buyer_holding_val_01", "signed_at": ago(days=15)},
            {"buyer_id": "buyer_estrategico_mad_02", "signed_at": ago(days=14)},
            {"buyer_id": "buyer_vc_bcn_02", "signed_at": ago(days=12)},
        ],
        metrics={"views": 89, "teaser_views": 234, "access_requests_count": 5, "ndas_signed_count": 5, "lois_received_count": 0},
        published_days_ago=20,
        status_history=[
            {"status": "draft", "changed_at": ago(days=25), "changed_by": "seller_creative_bcn_01"},
            {"status": "published", "changed_at": ago(days=20), "changed_by": "seller_creative_bcn_01"},
        ],
    ))

    # -----------------------------------------------------------
    # DEAL 3: BUYER FANTASMA — Consultora Digital Valencia
    # 1 NDA, infomemo visto, 0 actividad después
    # -----------------------------------------------------------
    DEALS.append(make_deal(
        deal_id="deal_ghost_consult_03",
        company_idx=2,
        status="published",
        asking_price=1200000,
        teaser={
            "headline": "Consultora digital en Valencia — Nicho pymes",
            "description": "Consultora con 18 empleados especializada en transformación digital para pymes.",
            "highlights": ["18 empleados", "Alta retención clientes", "Nicho Levante"],
            "revenue_display": "1.4M",
            "ebitda_display": "252K",
            "sector_display": "Consulting / Digital",
            "geography_display": "Valencia",
            "year_founded": 2010,
        },
        ndas=[
            {"buyer_id": "buyer_holding_val_01", "signed_at": ago(days=14)},
        ],
        metrics={"views": 23, "teaser_views": 67, "access_requests_count": 1, "ndas_signed_count": 1, "lois_received_count": 0},
        published_days_ago=18,
        status_history=[
            {"status": "draft", "changed_at": ago(days=22), "changed_by": "seller_consult_val_01"},
            {"status": "published", "changed_at": ago(days=18), "changed_by": "seller_consult_val_01"},
        ],
    ))

    # -----------------------------------------------------------
    # DEAL 4: DEAL MUERTO — Tech Studio Sevilla
    # Publicado, 0 actividad
    # -----------------------------------------------------------
    DEALS.append(make_deal(
        deal_id="deal_dead_tech_04",
        company_idx=3,
        status="published",
        asking_price=1800000,
        teaser={
            "headline": "Estudio tech con SaaS propio en Sevilla",
            "description": "Estudio tech con producto SaaS y equipo de 22 personas.",
            "highlights": ["Producto SaaS propio", "22 empleados", "MRR creciente"],
            "revenue_display": "1.8M",
            "ebitda_display": "324K",
            "sector_display": "Tech / SaaS",
            "geography_display": "Sevilla",
            "year_founded": 2018,
        },
        metrics={"views": 5, "teaser_views": 18, "access_requests_count": 0, "ndas_signed_count": 0, "lois_received_count": 0},
        published_days_ago=15,
        status_history=[
            {"status": "draft", "changed_at": ago(days=20), "changed_by": "seller_tech_sev_01"},
            {"status": "published", "changed_at": ago(days=15), "changed_by": "seller_tech_sev_01"},
        ],
    ))

    # -----------------------------------------------------------
    # DEAL 5: EDGE CASE — LOI sin actividad (Media Bilbao)
    # Buyer con LOI pero 0 data room, bajo tiempo
    # -----------------------------------------------------------
    DEALS.append(make_deal(
        deal_id="deal_loi_sin_act_05",
        company_idx=4,
        status="published",
        asking_price=2500000,
        teaser={
            "headline": "Agencia de medios líder en País Vasco",
            "description": "Agencia de medios con 28 empleados y fuerte presencia regional.",
            "highlights": ["28 empleados", "Líder regional", "Cartera diversificada"],
            "revenue_display": "2.5M",
            "ebitda_display": "450K",
            "sector_display": "Media / Social",
            "geography_display": "Bilbao",
            "year_founded": 2014,
        },
        ndas=[
            {"buyer_id": "buyer_pe_madrid_01", "signed_at": ago(days=12)},
        ],
        lois=[{"loi_id": "eng_loi_sin_act_pe"}],
        metrics={"views": 34, "teaser_views": 78, "access_requests_count": 1, "ndas_signed_count": 1, "lois_received_count": 1},
        published_days_ago=16,
        status_history=[
            {"status": "draft", "changed_at": ago(days=20), "changed_by": "seller_media_bil_01"},
            {"status": "published", "changed_at": ago(days=16), "changed_by": "seller_media_bil_01"},
        ],
    ))

    # -----------------------------------------------------------
    # DEAL 6: EDGE CASE — Alta actividad sin LOI (Performance Málaga)
    # Buyer con altísima actividad DR pero sin LOI
    # -----------------------------------------------------------
    DEALS.append(make_deal(
        deal_id="deal_alta_act_06",
        company_idx=5,
        status="published",
        asking_price=2800000,
        teaser={
            "headline": "Agencia de performance en alta trayectoria — Málaga",
            "description": "Agencia de performance digital con crecimiento del 25% anual.",
            "highlights": ["35 empleados", "Crecimiento 25% YoY", "Tecnología propia"],
            "revenue_display": "2.8M",
            "ebitda_display": "504K",
            "sector_display": "Performance / SEM",
            "geography_display": "Málaga",
            "year_founded": 2016,
        },
        ndas=[
            {"buyer_id": "buyer_fo_bilbao_01", "signed_at": ago(days=10)},
            {"buyer_id": "buyer_holding_zar_02", "signed_at": ago(days=8)},
        ],
        metrics={"views": 67, "teaser_views": 145, "access_requests_count": 2, "ndas_signed_count": 2, "lois_received_count": 0},
        published_days_ago=14,
        status_history=[
            {"status": "draft", "changed_at": ago(days=18), "changed_by": "seller_perf_mal_01"},
            {"status": "published", "changed_at": ago(days=14), "changed_by": "seller_perf_mal_01"},
        ],
    ))

    # -----------------------------------------------------------
    # DEAL 7: EDGE CASE — Shortlist llena (Strat Consulting Madrid)
    # 3 buyers en shortlist + 1 extra intentando entrar
    # -----------------------------------------------------------
    DEALS.append(make_deal(
        deal_id="deal_shortlist_full_07",
        company_idx=6,
        status="published",
        asking_price=5000000,
        teaser={
            "headline": "Consultora estratégica de referencia — Madrid",
            "description": "Firma de consultoría con 55 empleados y EBITDA de 1M, especializada en M&A digital.",
            "highlights": ["55 empleados", "EBITDA 1M+", "Referente en M&A digital"],
            "revenue_display": "5.2M",
            "ebitda_display": "1.04M",
            "sector_display": "Strategy / Consulting",
            "geography_display": "Madrid",
            "year_founded": 2008,
        },
        ndas=[
            {"buyer_id": "buyer_vc_london_01", "signed_at": ago(days=15)},
            {"buyer_id": "buyer_pe_sevilla_02", "signed_at": ago(days=14)},
            {"buyer_id": "buyer_estrategico_mad_02", "signed_at": ago(days=13)},
            {"buyer_id": "buyer_vc_bcn_02", "signed_at": ago(days=11)},
        ],
        lois=[{"loi_id": "eng_short_vc_lon"}, {"loi_id": "eng_short_pe_sev"}, {"loi_id": "eng_short_strat_mad"}],
        shortlist={"buyers": ["buyer_vc_london_01", "buyer_pe_sevilla_02", "buyer_estrategico_mad_02"], "created_at": ago(days=5), "created_by": "seller_strat_mad_01"},
        metrics={"views": 112, "teaser_views": 267, "access_requests_count": 4, "ndas_signed_count": 4, "lois_received_count": 3},
        published_days_ago=18,
        status_history=[
            {"status": "draft", "changed_at": ago(days=22), "changed_by": "seller_strat_mad_01"},
            {"status": "published", "changed_at": ago(days=18), "changed_by": "seller_strat_mad_01"},
        ],
    ))

    # -----------------------------------------------------------
    # DEAL 8: EDGE CASE — Exclusividad prematura (Contenidos Zaragoza)
    # Exclusividad a buyer con baja actividad
    # -----------------------------------------------------------
    DEALS.append(make_deal(
        deal_id="deal_excl_prematura_08",
        company_idx=7,
        status="exclusivity",
        asking_price=700000,
        teaser={
            "headline": "Agencia de contenidos corporativos — Zaragoza",
            "description": "Agencia de contenidos con nicho en sector corporativo, 15 empleados.",
            "highlights": ["15 empleados", "Nicho corporativo", "Contratos anuales"],
            "revenue_display": "900K",
            "ebitda_display": "135K",
            "sector_display": "Content / Copywriting",
            "geography_display": "Zaragoza",
            "year_founded": 2017,
        },
        ndas=[
            {"buyer_id": "buyer_pe_sevilla_02", "signed_at": ago(days=10)},
            {"buyer_id": "buyer_fo_malaga_02", "signed_at": ago(days=9)},
        ],
        lois=[{"loi_id": "eng_excl_prem_pe"}],
        exclusivity={"buyer_id": "buyer_pe_sevilla_02", "granted_at": ago(days=2), "terms": "45 días"},
        metrics={"views": 28, "teaser_views": 56, "access_requests_count": 2, "ndas_signed_count": 2, "lois_received_count": 1},
        published_days_ago=12,
        status_history=[
            {"status": "draft", "changed_at": ago(days=16), "changed_by": "seller_content_zar_01"},
            {"status": "published", "changed_at": ago(days=12), "changed_by": "seller_content_zar_01"},
            {"status": "exclusivity", "changed_at": ago(days=2), "changed_by": "seller_content_zar_01", "notes": "Exclusividad prematura a buyer_pe_sevilla_02"},
        ],
    ))

    # -----------------------------------------------------------
    # DEAL 9: EDGE CASE — Data Room vacío (Digital Asturias)
    # NDA firmado pero data room sin documentos
    # -----------------------------------------------------------
    DEALS.append(make_deal(
        deal_id="deal_dr_vacio_09",
        company_idx=8,
        status="published",
        asking_price=500000,
        teaser={
            "headline": "Estudio digital en Asturias — Precio atractivo",
            "description": "Estudio digital pequeño, 10 empleados, con potencial de crecimiento.",
            "highlights": ["10 empleados", "Precio accesible", "Mercado local fidelizado"],
            "revenue_display": "600K",
            "ebitda_display": "90K",
            "sector_display": "Digital / Design",
            "geography_display": "Oviedo, Asturias",
            "year_founded": 2019,
        },
        ndas=[
            {"buyer_id": "buyer_fo_malaga_02", "signed_at": ago(days=7)},
        ],
        metrics={"views": 15, "teaser_views": 42, "access_requests_count": 1, "ndas_signed_count": 1, "lois_received_count": 0},
        published_days_ago=10,
        status_history=[
            {"status": "draft", "changed_at": ago(days=14), "changed_by": "seller_digital_ast_01"},
            {"status": "published", "changed_at": ago(days=10), "changed_by": "seller_digital_ast_01"},
        ],
    ))

    # -----------------------------------------------------------
    # DEAL 10: BORRADOR — Mobile Canarias
    # Draft, no publicado
    # -----------------------------------------------------------
    DEALS.append(make_deal(
        deal_id="deal_borrador_10",
        company_idx=9,
        status="draft",
        asking_price=350000,
        teaser={
            "headline": "Agencia de apps móviles en Canarias",
            "description": "Agencia joven especializada en desarrollo de apps móviles.",
            "highlights": ["8 empleados", "React Native / Flutter", "Mercado turístico"],
            "revenue_display": "450K",
            "ebitda_display": "67K",
            "sector_display": "Mobile / App Dev",
            "geography_display": "Las Palmas, Canarias",
            "year_founded": 2020,
        },
        metrics={"views": 0, "teaser_views": 0, "access_requests_count": 0, "ndas_signed_count": 0, "lois_received_count": 0},
        status_history=[
            {"status": "draft", "changed_at": ago(days=5), "changed_by": "seller_mobile_can_01"},
        ],
    ))

def insert_deals():
    print("\n--- Insertando Deals ---")
    build_deals()
    for d in DEALS:
        db.deals.insert_one(d)
    print(f"  Deals insertados: {len(DEALS)}")

# ============================================================
# ENGAGEMENTS — INTEREST + LOI
# ============================================================
ENGAGEMENTS = []

def build_engagements():
    # --- DEAL 1: Hot SEO ---
    # buyer_pe_madrid_01: LOI + EXCLUSIVITY
    ENGAGEMENTS.append({
        "engagement_id": "eng_hot_seo_pe",
        "deal_id": "deal_hot_seo_01",
        "buyer_id": "buyer_pe_madrid_01",
        "type": "LOI",
        "stage": "EXCLUSIVITY",
        "valuation_range_min": 3000000,
        "valuation_range_max": 3800000,
        "operation_type": "full_sale",
        "message": "Interesados en adquirir el 100%. Equipo de due diligence preparado.",
        "valuation_offer": 3400000,
        "structure": "cash",
        "acquisition_percentage": 100.0,
        "conditions": "Sujeto a DD satisfactoria. Permanencia fundador 12 meses.",
        "is_binding": False,
        "legal_accepted": True,
        "buyer_name": "Carlos Ruiz Martínez",
        "buyer_type": "financial",
        "created_at": ago(days=24),
        "updated_at": ago(days=3),
        "viewed_at": ago(days=23),
        "upgraded_to_loi_at": ago(days=15),
    })

    # buyer_estrategico_bcn_01: LOI + SHORTLISTED
    ENGAGEMENTS.append({
        "engagement_id": "eng_hot_seo_strat",
        "deal_id": "deal_hot_seo_01",
        "buyer_id": "buyer_estrategico_bcn_01",
        "type": "LOI",
        "stage": "SHORTLISTED",
        "valuation_range_min": 2800000,
        "valuation_range_max": 3500000,
        "operation_type": "merger",
        "message": "Buscamos sinergias con nuestra división de branding.",
        "valuation_offer": 3100000,
        "structure": "mixed",
        "acquisition_percentage": 100.0,
        "conditions": "Earn-out 20% a 3 años.",
        "is_binding": False,
        "legal_accepted": True,
        "buyer_name": "Marta Font Puig",
        "buyer_type": "strategic",
        "created_at": ago(days=21),
        "updated_at": ago(days=8),
        "viewed_at": ago(days=20),
        "upgraded_to_loi_at": ago(days=12),
    })

    # buyer_vc_london_01: INTEREST only + VIEWED
    ENGAGEMENTS.append({
        "engagement_id": "eng_hot_seo_vc",
        "deal_id": "deal_hot_seo_01",
        "buyer_id": "buyer_vc_london_01",
        "type": "INTEREST",
        "stage": "VIEWED",
        "valuation_range_min": 3000000,
        "valuation_range_max": 4000000,
        "operation_type": "partial_sale",
        "message": "Explorando inversión minoritaria.",
        "legal_accepted": True,
        "buyer_name": "James Harris",
        "buyer_type": "financial",
        "created_at": ago(days=19),
        "updated_at": ago(days=18),
        "viewed_at": ago(days=18),
    })

    # --- DEAL 2: Mucho interés, poca conversión ---
    for idx, (bid, bname, btype) in enumerate([
        ("buyer_estrategico_bcn_01", "Marta Font Puig", "strategic"),
        ("buyer_fo_bilbao_01", "Iker Aguirre Etxebarría", "financial"),
        ("buyer_holding_val_01", "Lucía Navarro Gil", "financial"),
    ]):
        ENGAGEMENTS.append({
            "engagement_id": f"eng_creative_interest_{idx+1}",
            "deal_id": "deal_interest_creative_02",
            "buyer_id": bid,
            "type": "INTEREST",
            "stage": "VIEWED",
            "valuation_range_min": 1500000,
            "valuation_range_max": 2200000,
            "operation_type": "full_sale",
            "message": f"Interesados en conocer más sobre la agencia.",
            "legal_accepted": True,
            "buyer_name": bname,
            "buyer_type": btype,
            "created_at": ago(days=17 - idx),
            "updated_at": ago(days=14 - idx),
            "viewed_at": ago(days=14 - idx),
        })
    # 2 more interests that are still SUBMITTED (unviewed)
    for idx, (bid, bname, btype) in enumerate([
        ("buyer_estrategico_mad_02", "Pablo García Hernández", "strategic"),
        ("buyer_vc_bcn_02", "Anna Soler Mas", "financial"),
    ]):
        ENGAGEMENTS.append({
            "engagement_id": f"eng_creative_interest_{idx+4}",
            "deal_id": "deal_interest_creative_02",
            "buyer_id": bid,
            "type": "INTEREST",
            "stage": "SUBMITTED",
            "valuation_range_min": 1600000,
            "valuation_range_max": 2300000,
            "operation_type": "full_sale",
            "message": f"Nos gustaría explorar esta oportunidad.",
            "legal_accepted": True,
            "buyer_name": bname,
            "buyer_type": btype,
            "created_at": ago(days=13 - idx),
            "updated_at": ago(days=13 - idx),
        })

    # --- DEAL 3: Buyer Fantasma ---
    ENGAGEMENTS.append({
        "engagement_id": "eng_ghost_holding",
        "deal_id": "deal_ghost_consult_03",
        "buyer_id": "buyer_holding_val_01",
        "type": "INTEREST",
        "stage": "VIEWED",
        "valuation_range_min": 900000,
        "valuation_range_max": 1300000,
        "operation_type": "full_sale",
        "message": "Evaluando oportunidades en Valencia.",
        "legal_accepted": True,
        "buyer_name": "Lucía Navarro Gil",
        "buyer_type": "financial",
        "created_at": ago(days=13),
        "updated_at": ago(days=12),
        "viewed_at": ago(days=12),
    })

    # --- DEAL 5: LOI sin actividad ---
    ENGAGEMENTS.append({
        "engagement_id": "eng_loi_sin_act_pe",
        "deal_id": "deal_loi_sin_act_05",
        "buyer_id": "buyer_pe_madrid_01",
        "type": "LOI",
        "stage": "VIEWED",
        "valuation_range_min": 2000000,
        "valuation_range_max": 2800000,
        "operation_type": "full_sale",
        "message": "Interesados en la agencia.",
        "valuation_offer": 2300000,
        "structure": "cash",
        "acquisition_percentage": 100.0,
        "conditions": "Sujeto a revisión financiera.",
        "is_binding": False,
        "legal_accepted": True,
        "buyer_name": "Carlos Ruiz Martínez",
        "buyer_type": "financial",
        "created_at": ago(days=11),
        "updated_at": ago(days=8),
        "viewed_at": ago(days=10),
        "upgraded_to_loi_at": ago(days=8),
    })

    # --- DEAL 6: Alta actividad sin LOI ---
    ENGAGEMENTS.append({
        "engagement_id": "eng_alta_act_fo",
        "deal_id": "deal_alta_act_06",
        "buyer_id": "buyer_fo_bilbao_01",
        "type": "INTEREST",
        "stage": "VIEWED",
        "valuation_range_min": 2200000,
        "valuation_range_max": 3000000,
        "operation_type": "full_sale",
        "message": "Estamos haciendo un análisis profundo.",
        "legal_accepted": True,
        "buyer_name": "Iker Aguirre Etxebarría",
        "buyer_type": "financial",
        "created_at": ago(days=9),
        "updated_at": ago(days=2),
        "viewed_at": ago(days=8),
    })
    ENGAGEMENTS.append({
        "engagement_id": "eng_alta_act_holding",
        "deal_id": "deal_alta_act_06",
        "buyer_id": "buyer_holding_zar_02",
        "type": "INTEREST",
        "stage": "VIEWED",
        "valuation_range_min": 2000000,
        "valuation_range_max": 2800000,
        "operation_type": "full_sale",
        "message": "Interesados.",
        "legal_accepted": True,
        "buyer_name": "Jorge Lázaro Pardo",
        "buyer_type": "financial",
        "created_at": ago(days=7),
        "updated_at": ago(days=5),
        "viewed_at": ago(days=6),
    })

    # --- DEAL 7: Shortlist llena ---
    for bid, bname, btype, eid, stage in [
        ("buyer_vc_london_01", "James Harris", "financial", "eng_short_vc_lon", "SHORTLISTED"),
        ("buyer_pe_sevilla_02", "Antonio Moreno López", "financial", "eng_short_pe_sev", "SHORTLISTED"),
        ("buyer_estrategico_mad_02", "Pablo García Hernández", "strategic", "eng_short_strat_mad", "SHORTLISTED"),
        ("buyer_vc_bcn_02", "Anna Soler Mas", "financial", "eng_short_vc_bcn", "VIEWED"),
    ]:
        is_loi = stage == "SHORTLISTED"
        ENGAGEMENTS.append({
            "engagement_id": eid,
            "deal_id": "deal_shortlist_full_07",
            "buyer_id": bid,
            "type": "LOI" if is_loi else "INTEREST",
            "stage": stage,
            "valuation_range_min": 4000000,
            "valuation_range_max": 5500000,
            "operation_type": "full_sale",
            "message": "Gran interés en esta firma.",
            "valuation_offer": 4800000 if is_loi else None,
            "structure": "mixed" if is_loi else None,
            "acquisition_percentage": 100.0 if is_loi else None,
            "conditions": "Condiciones estándar." if is_loi else None,
            "is_binding": False,
            "legal_accepted": True,
            "buyer_name": bname,
            "buyer_type": btype,
            "created_at": ago(days=14),
            "updated_at": ago(days=5),
            "viewed_at": ago(days=13),
            "upgraded_to_loi_at": ago(days=9) if is_loi else None,
        })

    # --- DEAL 8: Exclusividad prematura ---
    ENGAGEMENTS.append({
        "engagement_id": "eng_excl_prem_pe",
        "deal_id": "deal_excl_prematura_08",
        "buyer_id": "buyer_pe_sevilla_02",
        "type": "LOI",
        "stage": "EXCLUSIVITY",
        "valuation_range_min": 500000,
        "valuation_range_max": 800000,
        "operation_type": "full_sale",
        "message": "Precio atractivo para nuestro portfolio.",
        "valuation_offer": 650000,
        "structure": "cash",
        "acquisition_percentage": 100.0,
        "is_binding": False,
        "legal_accepted": True,
        "buyer_name": "Antonio Moreno López",
        "buyer_type": "financial",
        "created_at": ago(days=9),
        "updated_at": ago(days=2),
        "viewed_at": ago(days=8),
        "upgraded_to_loi_at": ago(days=5),
    })
    ENGAGEMENTS.append({
        "engagement_id": "eng_excl_prem_fo",
        "deal_id": "deal_excl_prematura_08",
        "buyer_id": "buyer_fo_malaga_02",
        "type": "INTEREST",
        "stage": "VIEWED",
        "valuation_range_min": 500000,
        "valuation_range_max": 750000,
        "operation_type": "full_sale",
        "message": "Evaluando la oportunidad.",
        "legal_accepted": True,
        "buyer_name": "Carmen Delgado Reyes",
        "buyer_type": "financial",
        "created_at": ago(days=8),
        "updated_at": ago(days=6),
        "viewed_at": ago(days=7),
    })

    # --- DEAL 9: DR vacío ---
    ENGAGEMENTS.append({
        "engagement_id": "eng_dr_vacio_fo",
        "deal_id": "deal_dr_vacio_09",
        "buyer_id": "buyer_fo_malaga_02",
        "type": "INTEREST",
        "stage": "VIEWED",
        "valuation_range_min": 350000,
        "valuation_range_max": 550000,
        "operation_type": "full_sale",
        "message": "Precio accesible, quiero ver Data Room.",
        "legal_accepted": True,
        "buyer_name": "Carmen Delgado Reyes",
        "buyer_type": "financial",
        "created_at": ago(days=6),
        "updated_at": ago(days=5),
        "viewed_at": ago(days=5),
    })

def insert_engagements():
    print("\n--- Insertando Engagements ---")
    build_engagements()
    for e in ENGAGEMENTS:
        db.engagements.insert_one(e)
    print(f"  Engagements insertados: {len(ENGAGEMENTS)}")
    interests = sum(1 for e in ENGAGEMENTS if e["type"] == "INTEREST")
    lois = sum(1 for e in ENGAGEMENTS if e["type"] == "LOI")
    print(f"  Interests: {interests} | LOIs: {lois}")

# ============================================================
# TIME TRACKING — Simulate buyer time on sections
# ============================================================
def insert_time_tracking():
    print("\n--- Insertando Time Tracking ---")
    records = []

    # DEAL 1 HOT: buyer_pe_madrid_01 = HEAVY user
    for section, seconds in [("deal_page", 1200), ("infomemo", 900), ("data_room", 1500)]:
        for i in range(3):
            records.append({"buyer_id": "buyer_pe_madrid_01", "deal_id": "deal_hot_seo_01", "section": section, "session_id": f"sess_hot_pe_{section}_{i}", "session_seconds": min(seconds, 1800), "created_at": ago(days=20-i*3), "updated_at": ago(days=20-i*3)})

    # buyer_estrategico_bcn_01 on deal 1 = moderate
    for section, seconds in [("deal_page", 600), ("infomemo", 480), ("data_room", 720)]:
        records.append({"buyer_id": "buyer_estrategico_bcn_01", "deal_id": "deal_hot_seo_01", "section": section, "session_id": f"sess_hot_strat_{section}", "session_seconds": seconds, "created_at": ago(days=18), "updated_at": ago(days=18)})

    # buyer_vc_london_01 on deal 1 = light
    records.append({"buyer_id": "buyer_vc_london_01", "deal_id": "deal_hot_seo_01", "section": "deal_page", "session_id": "sess_hot_vc_dp", "session_seconds": 180, "created_at": ago(days=17), "updated_at": ago(days=17)})
    records.append({"buyer_id": "buyer_vc_london_01", "deal_id": "deal_hot_seo_01", "section": "infomemo", "session_id": "sess_hot_vc_im", "session_seconds": 120, "created_at": ago(days=17), "updated_at": ago(days=17)})

    # DEAL 2: Moderate time from 3 buyers
    for idx, bid in enumerate(["buyer_estrategico_bcn_01", "buyer_fo_bilbao_01", "buyer_holding_val_01"]):
        records.append({"buyer_id": bid, "deal_id": "deal_interest_creative_02", "section": "deal_page", "session_id": f"sess_creative_{idx}_dp", "session_seconds": 300, "created_at": ago(days=15-idx), "updated_at": ago(days=15-idx)})
        records.append({"buyer_id": bid, "deal_id": "deal_interest_creative_02", "section": "infomemo", "session_id": f"sess_creative_{idx}_im", "session_seconds": 240, "created_at": ago(days=15-idx), "updated_at": ago(days=15-idx)})

    # DEAL 3 GHOST: buyer_holding_val_01 — viewed infomemo briefly, then disappeared
    records.append({"buyer_id": "buyer_holding_val_01", "deal_id": "deal_ghost_consult_03", "section": "deal_page", "session_id": "sess_ghost_dp", "session_seconds": 90, "created_at": ago(days=13), "updated_at": ago(days=13)})
    records.append({"buyer_id": "buyer_holding_val_01", "deal_id": "deal_ghost_consult_03", "section": "infomemo", "session_id": "sess_ghost_im", "session_seconds": 60, "created_at": ago(days=13), "updated_at": ago(days=13)})

    # DEAL 5 LOI SIN ACTIVIDAD: buyer_pe_madrid_01 — minimal time
    records.append({"buyer_id": "buyer_pe_madrid_01", "deal_id": "deal_loi_sin_act_05", "section": "deal_page", "session_id": "sess_loisinact_dp", "session_seconds": 120, "created_at": ago(days=11), "updated_at": ago(days=11)})

    # DEAL 6 ALTA ACTIVIDAD: buyer_fo_bilbao_01 — VERY HIGH time
    for section, seconds in [("deal_page", 1800), ("infomemo", 1200), ("data_room", 1800)]:
        for i in range(4):
            records.append({"buyer_id": "buyer_fo_bilbao_01", "deal_id": "deal_alta_act_06", "section": section, "session_id": f"sess_alta_fo_{section}_{i}", "session_seconds": min(seconds, 1800), "created_at": ago(days=8-i*2), "updated_at": ago(days=8-i*2)})
    # buyer_holding_zar_02 — low time
    records.append({"buyer_id": "buyer_holding_zar_02", "deal_id": "deal_alta_act_06", "section": "deal_page", "session_id": "sess_alta_holding_dp", "session_seconds": 150, "created_at": ago(days=6), "updated_at": ago(days=6)})

    # DEAL 7 SHORTLIST: moderate time for shortlisted buyers
    for bid in ["buyer_vc_london_01", "buyer_pe_sevilla_02", "buyer_estrategico_mad_02"]:
        for section, seconds in [("deal_page", 600), ("infomemo", 500), ("data_room", 900)]:
            records.append({"buyer_id": bid, "deal_id": "deal_shortlist_full_07", "section": section, "session_id": f"sess_short_{bid}_{section}", "session_seconds": seconds, "created_at": ago(days=10), "updated_at": ago(days=10)})
    # buyer_vc_bcn_02 (4th, not shortlisted) — also good time
    for section, seconds in [("deal_page", 500), ("infomemo", 400), ("data_room", 600)]:
        records.append({"buyer_id": "buyer_vc_bcn_02", "deal_id": "deal_shortlist_full_07", "section": section, "session_id": f"sess_short_bcn_{section}", "session_seconds": seconds, "created_at": ago(days=9), "updated_at": ago(days=9)})

    # DEAL 8 EXCL PREMATURA: buyer_pe_sevilla_02 — LOW activity
    records.append({"buyer_id": "buyer_pe_sevilla_02", "deal_id": "deal_excl_prematura_08", "section": "deal_page", "session_id": "sess_excl_pe_dp", "session_seconds": 90, "created_at": ago(days=8), "updated_at": ago(days=8)})
    # buyer_fo_malaga_02 — some time
    records.append({"buyer_id": "buyer_fo_malaga_02", "deal_id": "deal_excl_prematura_08", "section": "deal_page", "session_id": "sess_excl_fo_dp", "session_seconds": 200, "created_at": ago(days=7), "updated_at": ago(days=7)})
    records.append({"buyer_id": "buyer_fo_malaga_02", "deal_id": "deal_excl_prematura_08", "section": "infomemo", "session_id": "sess_excl_fo_im", "session_seconds": 180, "created_at": ago(days=7), "updated_at": ago(days=7)})

    # DEAL 9 DR VACIO: buyer_fo_malaga_02 — visited but nothing to see
    records.append({"buyer_id": "buyer_fo_malaga_02", "deal_id": "deal_dr_vacio_09", "section": "deal_page", "session_id": "sess_drvacio_dp", "session_seconds": 120, "created_at": ago(days=5), "updated_at": ago(days=5)})

    if records:
        db.time_tracking.insert_many(records)
    print(f"  Registros de tiempo insertados: {len(records)}")

# ============================================================
# DATA ROOM ACCESS LOG — Simulate downloads, views, access
# ============================================================
def insert_dataroom_activity():
    print("\n--- Insertando Data Room Activity ---")
    logs = []

    # DEAL 1 HOT: buyer_pe_madrid_01 = 8 downloads, many views
    for i in range(8):
        logs.append({"buyer_id": "buyer_pe_madrid_01", "deal_id": "deal_hot_seo_01", "document_id": f"doc_hot_{i}", "action": "DOWNLOAD", "folder": ["financiero", "legal", "comercial", "operaciones"][i % 4], "timestamp": ago(days=18-i*2)})
    for i in range(5):
        logs.append({"buyer_id": "buyer_pe_madrid_01", "deal_id": "deal_hot_seo_01", "document_id": None, "action": "DATA_ROOM_ACCESSED", "folder": None, "timestamp": ago(days=20-i*3)})

    # buyer_estrategico_bcn_01 on deal 1 = 3 downloads
    for i in range(3):
        logs.append({"buyer_id": "buyer_estrategico_bcn_01", "deal_id": "deal_hot_seo_01", "document_id": f"doc_hot_strat_{i}", "action": "DOWNLOAD", "folder": "financiero", "timestamp": ago(days=16-i*2)})
    logs.append({"buyer_id": "buyer_estrategico_bcn_01", "deal_id": "deal_hot_seo_01", "document_id": None, "action": "DATA_ROOM_ACCESSED", "folder": None, "timestamp": ago(days=17)})

    # buyer_vc_london_01 on deal 1 = 0 downloads (just viewed)
    logs.append({"buyer_id": "buyer_vc_london_01", "deal_id": "deal_hot_seo_01", "document_id": None, "action": "DATA_ROOM_ACCESSED", "folder": None, "timestamp": ago(days=16)})

    # DEAL 2: minimal DR activity
    for bid in ["buyer_estrategico_bcn_01", "buyer_fo_bilbao_01"]:
        logs.append({"buyer_id": bid, "deal_id": "deal_interest_creative_02", "document_id": None, "action": "DATA_ROOM_ACCESSED", "folder": None, "timestamp": ago(days=14)})

    # DEAL 5 LOI SIN ACTIVIDAD: 0 DR logs (that's the edge case)
    # Nothing here intentionally

    # DEAL 6 ALTA ACTIVIDAD: buyer_fo_bilbao_01 = 12 downloads
    for i in range(12):
        logs.append({"buyer_id": "buyer_fo_bilbao_01", "deal_id": "deal_alta_act_06", "document_id": f"doc_alta_{i}", "action": "DOWNLOAD", "folder": ["financiero", "legal", "comercial", "operaciones", "equipo"][i % 5], "timestamp": ago(days=7-i%4)})
    for i in range(6):
        logs.append({"buyer_id": "buyer_fo_bilbao_01", "deal_id": "deal_alta_act_06", "document_id": None, "action": "DATA_ROOM_ACCESSED", "folder": None, "timestamp": ago(days=8-i)})
    # buyer_holding_zar_02 = 1 download
    logs.append({"buyer_id": "buyer_holding_zar_02", "deal_id": "deal_alta_act_06", "document_id": "doc_alta_holding_0", "action": "DOWNLOAD", "folder": "financiero", "timestamp": ago(days=5)})

    # DEAL 7 SHORTLIST: moderate activity
    for bid in ["buyer_vc_london_01", "buyer_pe_sevilla_02", "buyer_estrategico_mad_02"]:
        for i in range(3):
            logs.append({"buyer_id": bid, "deal_id": "deal_shortlist_full_07", "document_id": f"doc_short_{bid}_{i}", "action": "DOWNLOAD", "folder": "financiero", "timestamp": ago(days=9-i)})
        logs.append({"buyer_id": bid, "deal_id": "deal_shortlist_full_07", "document_id": None, "action": "DATA_ROOM_ACCESSED", "folder": None, "timestamp": ago(days=10)})
    # buyer_vc_bcn_02 (4th) = 2 downloads
    for i in range(2):
        logs.append({"buyer_id": "buyer_vc_bcn_02", "deal_id": "deal_shortlist_full_07", "document_id": f"doc_short_bcn_{i}", "action": "DOWNLOAD", "folder": "financiero", "timestamp": ago(days=8-i)})

    # DEAL 8 EXCL PREMATURA: buyer_pe_sevilla_02 = 0 downloads (premature!)
    logs.append({"buyer_id": "buyer_pe_sevilla_02", "deal_id": "deal_excl_prematura_08", "document_id": None, "action": "DATA_ROOM_ACCESSED", "folder": None, "timestamp": ago(days=7)})

    # DEAL 9 DR VACIO: buyer tried to access but nothing there
    logs.append({"buyer_id": "buyer_fo_malaga_02", "deal_id": "deal_dr_vacio_09", "document_id": None, "action": "DATA_ROOM_ACCESSED", "folder": None, "timestamp": ago(days=4)})

    if logs:
        db.dataroom_access_log.insert_many(logs)
    print(f"  Registros de acceso DR insertados: {len(logs)}")

# ============================================================
# EVENTS — Platform events
# ============================================================
def insert_events():
    print("\n--- Insertando Eventos ---")
    events = []

    # DEAL 1 events
    events.append({"event_type": "DEAL_PUBLISHED", "deal_id": "deal_hot_seo_01", "user_id": "seller_seo_madrid_01", "metadata": {}, "created_at": ago(days=28)})
    for bid in ["buyer_pe_madrid_01", "buyer_estrategico_bcn_01", "buyer_vc_london_01"]:
        events.append({"event_type": "NDA_SIGNED", "deal_id": "deal_hot_seo_01", "user_id": bid, "metadata": {}, "created_at": ago(days=22)})
    events.append({"event_type": "INTEREST_SUBMITTED", "deal_id": "deal_hot_seo_01", "user_id": "buyer_pe_madrid_01", "metadata": {}, "created_at": ago(days=24)})
    events.append({"event_type": "INTEREST_SUBMITTED", "deal_id": "deal_hot_seo_01", "user_id": "buyer_estrategico_bcn_01", "metadata": {}, "created_at": ago(days=21)})
    events.append({"event_type": "INTEREST_SUBMITTED", "deal_id": "deal_hot_seo_01", "user_id": "buyer_vc_london_01", "metadata": {}, "created_at": ago(days=19)})
    events.append({"event_type": "LOI_SUBMITTED", "deal_id": "deal_hot_seo_01", "user_id": "buyer_pe_madrid_01", "metadata": {"valuation_offer": 3400000}, "created_at": ago(days=15)})
    events.append({"event_type": "LOI_SUBMITTED", "deal_id": "deal_hot_seo_01", "user_id": "buyer_estrategico_bcn_01", "metadata": {"valuation_offer": 3100000}, "created_at": ago(days=12)})
    events.append({"event_type": "BUYER_SHORTLISTED", "deal_id": "deal_hot_seo_01", "user_id": "seller_seo_madrid_01", "metadata": {"buyer_id": "buyer_pe_madrid_01"}, "created_at": ago(days=8)})
    events.append({"event_type": "BUYER_SHORTLISTED", "deal_id": "deal_hot_seo_01", "user_id": "seller_seo_madrid_01", "metadata": {"buyer_id": "buyer_estrategico_bcn_01"}, "created_at": ago(days=8)})
    events.append({"event_type": "EXCLUSIVITY_GRANTED", "deal_id": "deal_hot_seo_01", "user_id": "seller_seo_madrid_01", "metadata": {"buyer_id": "buyer_pe_madrid_01"}, "created_at": ago(days=3)})

    # DEAL 2 events
    events.append({"event_type": "DEAL_PUBLISHED", "deal_id": "deal_interest_creative_02", "user_id": "seller_creative_bcn_01", "metadata": {}, "created_at": ago(days=20)})
    for bid in ["buyer_estrategico_bcn_01", "buyer_fo_bilbao_01", "buyer_holding_val_01", "buyer_estrategico_mad_02", "buyer_vc_bcn_02"]:
        events.append({"event_type": "NDA_SIGNED", "deal_id": "deal_interest_creative_02", "user_id": bid, "metadata": {}, "created_at": ago(days=16)})
        events.append({"event_type": "INTEREST_SUBMITTED", "deal_id": "deal_interest_creative_02", "user_id": bid, "metadata": {}, "created_at": ago(days=15)})

    # DEAL 3 events
    events.append({"event_type": "DEAL_PUBLISHED", "deal_id": "deal_ghost_consult_03", "user_id": "seller_consult_val_01", "metadata": {}, "created_at": ago(days=18)})
    events.append({"event_type": "NDA_SIGNED", "deal_id": "deal_ghost_consult_03", "user_id": "buyer_holding_val_01", "metadata": {}, "created_at": ago(days=14)})
    events.append({"event_type": "INTEREST_SUBMITTED", "deal_id": "deal_ghost_consult_03", "user_id": "buyer_holding_val_01", "metadata": {}, "created_at": ago(days=13)})

    # DEAL 4 events
    events.append({"event_type": "DEAL_PUBLISHED", "deal_id": "deal_dead_tech_04", "user_id": "seller_tech_sev_01", "metadata": {}, "created_at": ago(days=15)})

    # DEAL 5 events
    events.append({"event_type": "DEAL_PUBLISHED", "deal_id": "deal_loi_sin_act_05", "user_id": "seller_media_bil_01", "metadata": {}, "created_at": ago(days=16)})
    events.append({"event_type": "NDA_SIGNED", "deal_id": "deal_loi_sin_act_05", "user_id": "buyer_pe_madrid_01", "metadata": {}, "created_at": ago(days=12)})
    events.append({"event_type": "LOI_SUBMITTED", "deal_id": "deal_loi_sin_act_05", "user_id": "buyer_pe_madrid_01", "metadata": {"valuation_offer": 2300000}, "created_at": ago(days=8)})

    # DEAL 6 events
    events.append({"event_type": "DEAL_PUBLISHED", "deal_id": "deal_alta_act_06", "user_id": "seller_perf_mal_01", "metadata": {}, "created_at": ago(days=14)})
    events.append({"event_type": "NDA_SIGNED", "deal_id": "deal_alta_act_06", "user_id": "buyer_fo_bilbao_01", "metadata": {}, "created_at": ago(days=10)})
    events.append({"event_type": "INTEREST_SUBMITTED", "deal_id": "deal_alta_act_06", "user_id": "buyer_fo_bilbao_01", "metadata": {}, "created_at": ago(days=9)})
    events.append({"event_type": "NDA_SIGNED", "deal_id": "deal_alta_act_06", "user_id": "buyer_holding_zar_02", "metadata": {}, "created_at": ago(days=8)})
    events.append({"event_type": "INTEREST_SUBMITTED", "deal_id": "deal_alta_act_06", "user_id": "buyer_holding_zar_02", "metadata": {}, "created_at": ago(days=7)})

    # DEAL 7 events
    events.append({"event_type": "DEAL_PUBLISHED", "deal_id": "deal_shortlist_full_07", "user_id": "seller_strat_mad_01", "metadata": {}, "created_at": ago(days=18)})
    for bid in ["buyer_vc_london_01", "buyer_pe_sevilla_02", "buyer_estrategico_mad_02", "buyer_vc_bcn_02"]:
        events.append({"event_type": "NDA_SIGNED", "deal_id": "deal_shortlist_full_07", "user_id": bid, "metadata": {}, "created_at": ago(days=14)})
        events.append({"event_type": "INTEREST_SUBMITTED", "deal_id": "deal_shortlist_full_07", "user_id": bid, "metadata": {}, "created_at": ago(days=13)})
    for bid in ["buyer_vc_london_01", "buyer_pe_sevilla_02", "buyer_estrategico_mad_02"]:
        events.append({"event_type": "LOI_SUBMITTED", "deal_id": "deal_shortlist_full_07", "user_id": bid, "metadata": {}, "created_at": ago(days=9)})
        events.append({"event_type": "BUYER_SHORTLISTED", "deal_id": "deal_shortlist_full_07", "user_id": "seller_strat_mad_01", "metadata": {"buyer_id": bid}, "created_at": ago(days=5)})

    # DEAL 8 events
    events.append({"event_type": "DEAL_PUBLISHED", "deal_id": "deal_excl_prematura_08", "user_id": "seller_content_zar_01", "metadata": {}, "created_at": ago(days=12)})
    events.append({"event_type": "NDA_SIGNED", "deal_id": "deal_excl_prematura_08", "user_id": "buyer_pe_sevilla_02", "metadata": {}, "created_at": ago(days=10)})
    events.append({"event_type": "LOI_SUBMITTED", "deal_id": "deal_excl_prematura_08", "user_id": "buyer_pe_sevilla_02", "metadata": {"valuation_offer": 650000}, "created_at": ago(days=5)})
    events.append({"event_type": "EXCLUSIVITY_GRANTED", "deal_id": "deal_excl_prematura_08", "user_id": "seller_content_zar_01", "metadata": {"buyer_id": "buyer_pe_sevilla_02"}, "created_at": ago(days=2)})

    # DEAL 9 events
    events.append({"event_type": "DEAL_PUBLISHED", "deal_id": "deal_dr_vacio_09", "user_id": "seller_digital_ast_01", "metadata": {}, "created_at": ago(days=10)})
    events.append({"event_type": "NDA_SIGNED", "deal_id": "deal_dr_vacio_09", "user_id": "buyer_fo_malaga_02", "metadata": {}, "created_at": ago(days=7)})
    events.append({"event_type": "INTEREST_SUBMITTED", "deal_id": "deal_dr_vacio_09", "user_id": "buyer_fo_malaga_02", "metadata": {}, "created_at": ago(days=6)})

    for e in events:
        e.setdefault("ip", None)
    if events:
        db.events.insert_many(events)
    print(f"  Eventos insertados: {len(events)}")

# ============================================================
# NOTIFICATIONS — Sample notifications for sellers
# ============================================================
def insert_notifications():
    print("\n--- Insertando Notificaciones ---")
    import uuid as _uuid
    notifs = []

    def n(recipient, event_type, deal_id, actor_id, actor_name, message, days_ago, read=False):
        return {
            "notification_id": f"notif_{_uuid.uuid4().hex[:12]}",
            "recipient_id": recipient,
            "event_type": event_type,
            "deal_id": deal_id,
            "actor_id": actor_id,
            "actor_name": actor_name,
            "message": message,
            "read": read,
            "group_count": 1,
            "grouped_meta": [],
            "created_at": ago(days=days_ago),
            "updated_at": ago(days=days_ago),
        }

    # Deal 1 notifications for seller
    notifs.append(n("seller_seo_madrid_01", "INTEREST_SUBMITTED", "deal_hot_seo_01", "buyer_pe_madrid_01", "Carlos Ruiz", "Carlos Ruiz ha enviado interés", 24, True))
    notifs.append(n("seller_seo_madrid_01", "LOI_SUBMITTED", "deal_hot_seo_01", "buyer_pe_madrid_01", "Carlos Ruiz", "Carlos Ruiz ha enviado una LOI por 3.4M", 15, True))
    notifs.append(n("seller_seo_madrid_01", "LOI_SUBMITTED", "deal_hot_seo_01", "buyer_estrategico_bcn_01", "Marta Font", "Marta Font ha enviado una LOI por 3.1M", 12, True))
    notifs.append(n("seller_seo_madrid_01", "DOCUMENT_DOWNLOADED", "deal_hot_seo_01", "buyer_pe_madrid_01", "Carlos Ruiz", "Carlos Ruiz descargó documentos del Data Room", 10, True))

    # Deal 2 notifications
    notifs.append(n("seller_creative_bcn_01", "INTEREST_SUBMITTED", "deal_interest_creative_02", "buyer_estrategico_bcn_01", "Marta Font", "Marta Font ha enviado interés", 17, True))
    notifs.append(n("seller_creative_bcn_01", "INTEREST_SUBMITTED", "deal_interest_creative_02", "buyer_estrategico_mad_02", "Pablo García", "Pablo García ha enviado interés", 13, False))
    notifs.append(n("seller_creative_bcn_01", "INTEREST_SUBMITTED", "deal_interest_creative_02", "buyer_vc_bcn_02", "Anna Soler", "Anna Soler ha enviado interés", 12, False))

    # Deal 6 — high activity notification
    notifs.append(n("seller_perf_mal_01", "DOCUMENT_DOWNLOADED", "deal_alta_act_06", "buyer_fo_bilbao_01", "Iker Aguirre", "Iker Aguirre descargó 12 documentos del Data Room", 3, False))

    # Deal 7 — shortlist full notification
    notifs.append(n("seller_strat_mad_01", "LOI_SUBMITTED", "deal_shortlist_full_07", "buyer_vc_bcn_02", "Anna Soler", "Anna Soler ha enviado interés (shortlist llena)", 8, False))

    # Deal 9 — DR vacío
    notifs.append(n("seller_digital_ast_01", "INTEREST_SUBMITTED", "deal_dr_vacio_09", "buyer_fo_malaga_02", "Carmen Delgado", "Carmen Delgado ha enviado interés — Data Room vacío", 6, False))

    if notifs:
        db.notifications.insert_many(notifs)
    print(f"  Notificaciones insertadas: {len(notifs)}")

# ============================================================
# VALIDATION SUMMARY
# ============================================================
def print_summary():
    print("\n" + "=" * 70)
    print("  RESUMEN DE VALIDACION — SEED DEMO ARROBA")
    print("=" * 70)

    print(f"\nUsuarios: {db.users.count_documents({})} (Buyers: {db.users.count_documents({'role': 'buyer'})}, Sellers: {db.users.count_documents({'role': 'seller'})})")
    print(f"Empresas: {db.companies.count_documents({})}")
    print(f"Deals: {db.deals.count_documents({})}")
    print(f"Engagements: {db.engagements.count_documents({})} (Interests: {db.engagements.count_documents({'type': 'INTEREST'})}, LOIs: {db.engagements.count_documents({'type': 'LOI'})})")
    print(f"Time Tracking: {db.time_tracking.count_documents({})} registros")
    print(f"Data Room Logs: {db.dataroom_access_log.count_documents({})} registros")
    print(f"Eventos: {db.events.count_documents({})} registros")
    print(f"Notificaciones: {db.notifications.count_documents({})} registros")

    print("\n" + "-" * 70)
    print("  DETALLE POR DEAL (HISTORIA)")
    print("-" * 70)

    stories = {
        "deal_hot_seo_01": "HOT DEAL — Agencia SEO Madrid",
        "deal_interest_creative_02": "MUCHO INTERES POCA CONVERSION — Creativa BCN",
        "deal_ghost_consult_03": "BUYER FANTASMA — Consultora Valencia",
        "deal_dead_tech_04": "DEAL MUERTO — Tech Studio Sevilla",
        "deal_loi_sin_act_05": "EDGE: LOI SIN ACTIVIDAD — Media Bilbao",
        "deal_alta_act_06": "EDGE: ALTA ACTIVIDAD SIN LOI — Performance Malaga",
        "deal_shortlist_full_07": "EDGE: SHORTLIST LLENA — Strat Consulting Madrid",
        "deal_excl_prematura_08": "EDGE: EXCLUSIVIDAD PREMATURA — Contenidos Zaragoza",
        "deal_dr_vacio_09": "EDGE: DATA ROOM VACIO — Digital Asturias",
        "deal_borrador_10": "BORRADOR — Mobile Canarias",
    }

    for deal_id, title in stories.items():
        deal = db.deals.find_one({"deal_id": deal_id}, {"_id": 0})
        if not deal:
            print(f"\n  {deal_id}: NO ENCONTRADO")
            continue

        ndas_count = len(deal.get("ndas_signed", []))
        lois_count = db.engagements.count_documents({"deal_id": deal_id, "type": "LOI"})
        interests_count = db.engagements.count_documents({"deal_id": deal_id, "type": "INTEREST"})
        dr_downloads = db.dataroom_access_log.count_documents({"deal_id": deal_id, "action": "DOWNLOAD"})
        dr_accesses = db.dataroom_access_log.count_documents({"deal_id": deal_id, "action": "DATA_ROOM_ACCESSED"})
        time_records = db.time_tracking.count_documents({"deal_id": deal_id})

        shortlist = deal.get("shortlist", {})
        shortlist_buyers = shortlist.get("buyers", []) if shortlist else []
        exclusivity = deal.get("exclusivity", {})
        excl_buyer = exclusivity.get("buyer_id") if exclusivity else None

        print(f"\n  {title}")
        print(f"  ID: {deal_id} | Estado: {deal['status'].upper()} | Precio: {deal.get('asking_price', 0):,.0f}EUR")
        print(f"  NDAs: {ndas_count} | Interests: {interests_count} | LOIs: {lois_count}")
        print(f"  DR Downloads: {dr_downloads} | DR Accesos: {dr_accesses} | Time Records: {time_records}")
        if shortlist_buyers:
            print(f"  Shortlist ({len(shortlist_buyers)}/3): {shortlist_buyers}")
        if excl_buyer:
            print(f"  Exclusividad: {excl_buyer}")

        # Show intent scores per buyer engagement
        engs = list(db.engagements.find({"deal_id": deal_id}, {"_id": 0}))
        if engs:
            print(f"  Buyers:")
            for e in engs:
                bid = e["buyer_id"]
                buyer = db.users.find_one({"user_id": bid}, {"_id": 0, "first_name": 1, "last_name": 1})
                bname = f"{buyer.get('first_name', '')} {buyer.get('last_name', '')}".strip() if buyer else bid

                # Calculate simple intent indicators
                buyer_downloads = db.dataroom_access_log.count_documents({"deal_id": deal_id, "buyer_id": bid, "action": "DOWNLOAD"})
                time_total = 0
                for tr in db.time_tracking.find({"deal_id": deal_id, "buyer_id": bid}):
                    time_total += tr.get("session_seconds", 0)

                print(f"    - {bname} ({bid})")
                print(f"      Tipo: {e['type']} | Stage: {e['stage']} | DR Downloads: {buyer_downloads} | Tiempo: {time_total//60}min")
                if e.get("valuation_offer"):
                    print(f"      LOI Oferta: {e['valuation_offer']:,.0f}EUR")

    print("\n" + "-" * 70)
    print("  EDGE CASES VERIFICACION")
    print("-" * 70)

    # Edge 1: LOI sin actividad
    pe_loi_dr = db.dataroom_access_log.count_documents({"deal_id": "deal_loi_sin_act_05", "buyer_id": "buyer_pe_madrid_01", "action": "DOWNLOAD"})
    print(f"\n  [EDGE] LOI sin actividad (deal_loi_sin_act_05):")
    print(f"    buyer_pe_madrid_01 tiene LOI pero {pe_loi_dr} descargas DR")

    # Edge 2: Alta actividad sin LOI
    fo_alta_dr = db.dataroom_access_log.count_documents({"deal_id": "deal_alta_act_06", "buyer_id": "buyer_fo_bilbao_01", "action": "DOWNLOAD"})
    fo_alta_loi = db.engagements.find_one({"deal_id": "deal_alta_act_06", "buyer_id": "buyer_fo_bilbao_01", "type": "LOI"})
    print(f"\n  [EDGE] Alta actividad sin LOI (deal_alta_act_06):")
    print(f"    buyer_fo_bilbao_01: {fo_alta_dr} descargas, LOI: {'SI' if fo_alta_loi else 'NO'}")

    # Edge 3: Shortlist llena
    deal7 = db.deals.find_one({"deal_id": "deal_shortlist_full_07"}, {"_id": 0})
    sl7 = (deal7.get("shortlist") or {}).get("buyers", [])
    extra_buyer = db.engagements.find_one({"deal_id": "deal_shortlist_full_07", "buyer_id": "buyer_vc_bcn_02"}, {"_id": 0})
    print(f"\n  [EDGE] Shortlist llena (deal_shortlist_full_07):")
    print(f"    Shortlist: {sl7} ({len(sl7)}/3)")
    print(f"    4o buyer (buyer_vc_bcn_02) stage: {extra_buyer['stage'] if extra_buyer else 'N/A'}")

    # Edge 4: Exclusividad prematura
    pe_excl_dr = db.dataroom_access_log.count_documents({"deal_id": "deal_excl_prematura_08", "buyer_id": "buyer_pe_sevilla_02", "action": "DOWNLOAD"})
    pe_excl_time = 0
    for tr in db.time_tracking.find({"deal_id": "deal_excl_prematura_08", "buyer_id": "buyer_pe_sevilla_02"}):
        pe_excl_time += tr.get("session_seconds", 0)
    print(f"\n  [EDGE] Exclusividad prematura (deal_excl_prematura_08):")
    print(f"    buyer_pe_sevilla_02 en EXCLUSIVIDAD con {pe_excl_dr} descargas y {pe_excl_time//60}min tiempo")

    # Edge 5: DR vacío
    dr9_docs = db.dataroom_documents.count_documents({"deal_id": "deal_dr_vacio_09"})
    print(f"\n  [EDGE] Data Room vacio (deal_dr_vacio_09):")
    print(f"    Documentos en DR: {dr9_docs}")

    print("\n" + "-" * 70)
    print("  CREDENCIALES DE ACCESO")
    print("-" * 70)
    print(f"\n  Password universal: {DEMO_PASSWORD}")
    print(f"\n  Buyers:")
    for b in BUYERS:
        print(f"    {b['user_id']}: {b['email']}")
    print(f"\n  Sellers:")
    for s in SELLERS:
        print(f"    {s['user_id']}: {s['email']}")

    print("\n" + "=" * 70)
    print("  SEED COMPLETADO EXITOSAMENTE")
    print("=" * 70)

# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 70)
    print("  ARROBA — Seed Script Demo Data")
    print("  Generando historias completas para auditoria")
    print("=" * 70)

    print("\n--- Limpiando base de datos ---")
    clean_db()

    insert_users()
    insert_companies()
    insert_deals()
    insert_engagements()
    insert_time_tracking()
    insert_dataroom_activity()
    insert_events()
    insert_notifications()
    print_summary()

if __name__ == "__main__":
    main()
