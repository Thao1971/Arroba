from fastapi import FastAPI
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import init_db, close_db
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
