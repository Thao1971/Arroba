"""Idempotent seed for E1.4: populates master_companies_mock with a sector-
diverse set of Spanish SMEs for Analyze/Value/Recommend demos.

Usage:
    cd /app/backend
    python scripts/seed_master_companies_e14.py

Sectors covered (mandatory): Software, Marketing, Hoteles, Industria,
Salud, Alimentación, Servicios profesionales, Retail.

Idempotent: upsert by `master_company_id`.
"""
import asyncio
import sys
from datetime import UTC, datetime
from pathlib import Path

# Make `src` importable when run as `python scripts/seed_master_companies_e14.py`.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.database import get_db  # noqa: E402


COMPANIES = [
    # ---------------------------- SOFTWARE (2) ---------------------------
    {
        "master_company_id": "mc_kitchen",
        "legal_name": "Kitchen Studio, S.L.",
        "cif": "B86540112",
        "sector": "Software",
        "region": "Madrid",
        "country": "ES",
        "financials": {
            "revenue": 5_400_000,
            "ebitda": 1_080_000,
            "employees": 32,
            "fiscal_year": 2024,
        },
        "confidence": 0.92,
        "lineage": "normalized",
    },
    {
        "master_company_id": "mc_novaledger",
        "legal_name": "NovaLedger SaaS, S.L.",
        "cif": "B12340001",
        "sector": "Software",
        "region": "Barcelona",
        "country": "ES",
        "financials": {
            "revenue": 8_900_000,
            "ebitda": 2_136_000,
            "employees": 64,
            "fiscal_year": 2024,
        },
        "confidence": 0.88,
        "lineage": "normalized",
    },
    # ---------------------------- MARKETING (1) --------------------------
    {
        "master_company_id": "mc_bridge",
        "legal_name": "Bridge Creative Agency, S.L.",
        "cif": "B91230111",
        "sector": "Marketing",
        "region": "Madrid",
        "country": "ES",
        "financials": {
            "revenue": 3_200_000,
            "ebitda": 416_000,
            "employees": 28,
            "fiscal_year": 2024,
        },
        "confidence": 0.83,
        "lineage": "normalized",
    },
    # ---------------------------- HOTELES (2) ----------------------------
    {
        "master_company_id": "mc_atlantica",
        "legal_name": "Cadena Hotelera Atlántica, S.L.",
        "cif": "B36710222",
        "sector": "Hoteles",
        "region": "Galicia",
        "country": "ES",
        "financials": {
            "revenue": 18_400_000,
            "ebitda": 3_312_000,
            "employees": 210,
            "fiscal_year": 2024,
        },
        "confidence": 0.86,
        "lineage": "normalized",
    },
    {
        "master_company_id": "mc_olmedo",
        "legal_name": "Grupo Olmedo Hoteles, S.L.",
        "cif": "B47820150",
        "sector": "Hoteles",
        "region": "Castilla y León",
        "country": "ES",
        "financials": {
            "revenue": 6_410_000,
            "ebitda": 1_858_900,
            "employees": 82,
            "fiscal_year": 2024,
        },
        "confidence": 0.89,
        "lineage": "normalized",
        # Sprint F0.1 · superficie V2 poblada para demo del Header canónico.
        # Los datos se derivan del ZIP oficial (`cp-data.js`), reflejando la
        # ficha visual entregada por el usuario. Cualquier campo no
        # verificable queda como `None`.
        "v2_identity": {
            "commercial_name": "Castilla Termal Olmedo",
            "activity": "Hoteles y alojamientos similares",
            "activity_status": "En actividad",
            "mercantile_status": "Activa",
            "record_status": "Inscrita",
            "legal_form": "Sociedad Limitada",
            "cnae_code": "5510",
            "incorporation_date": "2003-06-19",
            "is_listed": False,
            "listed_market": None,
            "sectors": [
                "Hoteles termales y balnearios",
                "Turismo de bienestar",
            ],
            "description": (
                "Holding del grupo Castilla Termal, especializado en turismo "
                "termal y de bienestar en edificios históricos rehabilitados "
                "(monasterios y palacios) de Castilla y León, Cantabria y la "
                "Comunidad Valenciana."
            ),
            "address": "Calle Pago de Santi Spiritus, s/n",
            "postal_code": "47410",
            "locality": "Olmedo",
            "autonomous_community": "Castilla y León",
            "capital_social": 4_929_990.30,
            "corporate_purpose": (
                "Explotación de establecimientos hoteleros, termales y de "
                "bienestar; gestión de participaciones societarias en el sector."
            ),
            "website": "https://www.castillatermal.com",
            "domain": "castillatermal.com",
        },
    },
    # ---------------------------- INDUSTRIA (2) --------------------------
    {
        "master_company_id": "mc_forjas",
        "legal_name": "Forjas del Duero, S.A.",
        "cif": "A47220333",
        "sector": "Industria",
        "region": "Castilla y León",
        "country": "ES",
        "financials": {
            "revenue": 23_500_000,
            "ebitda": 2_585_000,
            "employees": 145,
            "fiscal_year": 2024,
        },
        "confidence": 0.81,
        "lineage": "normalized",
    },
    {
        "master_company_id": "mc_termo",
        "legal_name": "Termoplásticos Levante, S.L.",
        "cif": "B46320444",
        "sector": "Industria",
        "region": "Comunidad Valenciana",
        "country": "ES",
        "financials": {
            "revenue": 11_800_000,
            "ebitda": 944_000,
            "employees": 78,
            "fiscal_year": 2024,
        },
        "confidence": 0.74,
        "lineage": "normalized",
    },
    # ---------------------------- SALUD (3) ------------------------------
    {
        "master_company_id": "mc_vitalis",
        "legal_name": "Clínicas Vitalis, S.L.",
        "cif": "B28110555",
        "sector": "Salud",
        "region": "Madrid",
        "country": "ES",
        "financials": {
            "revenue": 14_200_000,
            "ebitda": 2_840_000,
            "employees": 96,
            "fiscal_year": 2024,
        },
        "confidence": 0.9,
        "lineage": "normalized",
    },
    {
        "master_company_id": "mc_valles",
        "legal_name": "Clínica Veterinaria Vallés, S.L.",
        "cif": "B08540200",
        "sector": "Salud",
        "region": "Cataluña",
        "country": "ES",
        "financials": {
            "revenue": 2_150_000,
            "ebitda": 322_500,
            "employees": 18,
            "fiscal_year": 2024,
        },
        "confidence": 0.81,
        "lineage": "normalized",
    },
    {
        "master_company_id": "mc_dental",
        "legal_name": "Dental Care Iberia, S.L.",
        "cif": "B08220666",
        "sector": "Salud",
        "region": "Cataluña",
        "country": "ES",
        "financials": {
            "revenue": 6_700_000,
            "ebitda": 938_000,
            "employees": 54,
            "fiscal_year": 2024,
        },
        "confidence": 0.85,
        "lineage": "normalized",
    },
    # ---------------------------- ALIMENTACIÓN (2) -----------------------
    {
        "master_company_id": "mc_conservas",
        "legal_name": "Conservas del Cantábrico, S.L.",
        "cif": "B39410777",
        "sector": "Alimentación",
        "region": "Cantabria",
        "country": "ES",
        "financials": {
            "revenue": 22_100_000,
            "ebitda": 3_315_000,
            "employees": 175,
            "fiscal_year": 2024,
        },
        "confidence": 0.87,
        "lineage": "normalized",
    },
    {
        "master_company_id": "mc_riojana",
        "legal_name": "Bodegas Riojana Norte, S.A.",
        "cif": "A26320888",
        "sector": "Alimentación",
        "region": "La Rioja",
        "country": "ES",
        "financials": {
            "revenue": 9_300_000,
            "ebitda": 1_581_000,
            "employees": 42,
            "fiscal_year": 2024,
        },
        "confidence": 0.82,
        "lineage": "normalized",
    },
    {
        "master_company_id": "mc_lacteos",
        "legal_name": "Lácteos del Atlántico, S.L.",
        "cif": "B15710112",
        "sector": "Alimentación",
        "region": "Galicia",
        "country": "ES",
        "financials": {
            "revenue": 15_800_000,
            "ebitda": 1_896_000,
            "employees": 112,
            "fiscal_year": 2024,
        },
        "confidence": 0.84,
        "lineage": "normalized",
    },
    # ---------------------- SERVICIOS PROFESIONALES (1) ------------------
    {
        "master_company_id": "mc_asesorapro",
        "legal_name": "AsesoraPro Consultoría, S.L.",
        "cif": "B28330999",
        "sector": "Servicios profesionales",
        "region": "Madrid",
        "country": "ES",
        "financials": {
            "revenue": 4_500_000,
            "ebitda": 720_000,
            "employees": 38,
            "fiscal_year": 2024,
        },
        "confidence": 0.78,
        "lineage": "normalized",
    },
    # ---------------------------- RETAIL (1) -----------------------------
    {
        "master_company_id": "mc_calzados",
        "legal_name": "Calzados Ribera, S.L.",
        "cif": "B03520121",
        "sector": "Retail",
        "region": "Comunidad Valenciana",
        "country": "ES",
        "financials": {
            "revenue": 7_600_000,
            "ebitda": 532_000,
            "employees": 65,
            "fiscal_year": 2024,
        },
        "confidence": 0.71,
        "lineage": "normalized",
    },
]


async def seed_master_companies() -> dict:
    db = get_db()
    now = datetime.now(UTC)
    inserted, updated = 0, 0
    for c in COMPANIES:
        doc = {**c, "updated_at": now, "created_at": now, "created_by": "seed_e14"}
        result = await db.master_companies_mock.update_one(
            {"master_company_id": c["master_company_id"]},
            {"$set": doc, "$setOnInsert": {"_seeded_at": now}},
            upsert=True,
        )
        if result.upserted_id is not None:
            inserted += 1
        else:
            updated += 1
    return {"inserted": inserted, "updated": updated, "total": len(COMPANIES)}


def main() -> None:
    result = asyncio.run(seed_master_companies())
    print(
        f"[seed_master_companies_e14] inserted={result['inserted']} "
        f"updated={result['updated']} total={result['total']}"
    )


if __name__ == "__main__":
    main()
