from fastapi import FastAPI
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import init_db, close_db, db
from config import CORS_ORIGINS

# Import routers
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.marketplace import router as marketplace_router
from routers.companies import router as companies_router
from routers.deals import router as deals_router
from routers.infomemo import router as infomemo_router
from routers.subscriptions import router as subscriptions_router
from routers.cif_lookup import router as cif_lookup_router
from routers.teaser import router as teaser_router
from routers.taxonomy import router as taxonomy_router
from routers.engagements import router as engagements_router
from routers.matching import router as matching_router
from routers.dataroom import router as dataroom_router
from routers.notifications import router as notifications_router
from routers.tracking import router as tracking_router
from routers.coaching import router as coaching_router
from routers.conversations import router as conversations_router
from modules.valuation.router import router as valuation_router
from routers.plans import router as plans_router
from routers.nda import router as nda_router
from routers.buyer_certification import router as buyer_cert_router
from routers.billing import router as billing_router
from routers.seller_profiles import router as seller_profiles_router
from routers.contact_requests import router as contact_requests_router
from routers.deal_presentation import router as deal_presentation_router
from routers.admin import router as admin_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized")
    # Init object storage
    try:
        from services.storage_service import init_storage
        init_storage()
    except Exception as e:
        logger.warning(f"Object storage init deferred: {e}")
    # Seed valuation defaults
    try:
        from modules.valuation.config_service import seed_default_multiples, seed_default_settings
        await seed_default_multiples(db)
        await seed_default_settings(db)
    except Exception as e:
        logger.warning(f"Valuation seed deferred: {e}")
    # Seed plans
    try:
        from routers.plans import seed_plans
        await seed_plans(db)
    except Exception as e:
        logger.warning(f"Plans seed deferred: {e}")
    # Seed NDA template
    try:
        from routers.nda import seed_nda_template
        await seed_nda_template()
    except Exception as e:
        logger.warning(f"NDA template seed deferred: {e}")
    yield
    # Shutdown
    logger.info("Closing database connection...")
    await close_db()
    logger.info("Database connection closed")


# Create the main app
app = FastAPI(
    title="Arroba API",
    description="API para la plataforma de compraventa y fusión de agencias digitales",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(marketplace_router, prefix="/api")
app.include_router(companies_router, prefix="/api")
app.include_router(deals_router, prefix="/api")
app.include_router(infomemo_router, prefix="/api")
app.include_router(subscriptions_router, prefix="/api")
app.include_router(cif_lookup_router, prefix="/api")
app.include_router(teaser_router, prefix="/api")
app.include_router(taxonomy_router, prefix="/api")
app.include_router(engagements_router, prefix="/api")
app.include_router(matching_router, prefix="/api")
app.include_router(dataroom_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(tracking_router, prefix="/api")
app.include_router(coaching_router, prefix="/api")
app.include_router(conversations_router, prefix="/api")
app.include_router(valuation_router, prefix="/api")
app.include_router(plans_router, prefix="/api")
app.include_router(nda_router, prefix="/api")
app.include_router(buyer_cert_router, prefix="/api")
app.include_router(billing_router, prefix="/api")
app.include_router(seller_profiles_router, prefix="/api")
app.include_router(contact_requests_router, prefix="/api")
app.include_router(deal_presentation_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/api")
async def root():
    """API root endpoint"""
    return {
        "name": "Arroba API",
        "version": "1.0.0",
        "description": "Plataforma de compraventa y fusión de agencias digitales"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "arroba-api"}


@app.get("/api/exports/documentacion")
async def download_docs():
    """Download all documentation as ZIP — generates on demand if missing"""
    from fastapi.responses import FileResponse
    import os
    import zipfile
    zip_path = "/app/exports/arroba_documentacion.zip"
    sources = [
        ("/app/MANUAL_APLICACION_ARROBA.md", "MANUAL_APLICACION_ARROBA.md"),
        ("/app/memory/PRD.md", "PRD.md"),
        ("/app/memory/CHANGELOG.md", "CHANGELOG.md"),
        ("/app/memory/ROADMAP.md", "ROADMAP.md"),
    ]
    if not os.path.exists(zip_path):
        os.makedirs("/app/exports", exist_ok=True)
        existing = [(src, name) for src, name in sources if os.path.exists(src)]
        if not existing:
            raise HTTPException(404, "No hay documentación disponible.")
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for src, name in existing:
                zf.write(src, name)
    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename="arroba_documentacion.zip"
    )


@app.get("/api/exports/manual")
async def download_manual():
    """Download platform manual as Markdown"""
    from fastapi.responses import FileResponse
    import os
    path = "/app/MANUAL_PLATAFORMA.md"
    if not os.path.exists(path):
        from fastapi import HTTPException
        raise HTTPException(404, "Manual no encontrado.")
    return FileResponse(path, media_type="text/markdown", filename="MANUAL_PLATAFORMA.md")
