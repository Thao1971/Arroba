import uuid
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from starlette.middleware.base import BaseHTTPMiddleware

from src.core.config import get_settings
from src.core.database import close_client, get_db, init_indexes
from src.core.exceptions import register_exception_handlers
from src.core.logging import configure_logging, get_logger
from src.modules.agency_tool_adapter.router import (
    admin_router as agency_tool_admin_router,
)
from src.modules.agency_tool_adapter.router import (
    public_anon_router as agency_tool_public_anon_router,
)
from src.modules.agency_tool_adapter.router import (
    public_router as agency_tool_public_router,
)
from src.modules.copilot.router import public_router as copilot_router
from src.modules.companies.router import router as companies_router
from src.modules.entities.router import router as entities_router
from src.modules.intelligence_layer.endpoints import (
    companies_intel_router,
    entities_semantic_router,
    intelligence_router as intelligence_layer_router,
    internal_router as intelligence_internal_router,
)
from src.modules.platform.router import router as platform_router
from src.modules.workspaces.router import router as workspaces_router
from src.modules.auth.router import router as auth_router
from src.modules.billing.router import router as billing_router
from src.modules.organizations.router import (
    inv_router as invitations_router,
)
from src.modules.organizations.router import (
    orgs_router as organizations_router,
)
from src.modules.users.router import router as users_router

configure_logging()
log = get_logger("main")
settings = get_settings()


OPENAPI_TAGS = [
    {"name": "health", "description": "Service health & component env presence."},
    {"name": "auth", "description": "Register, login, OAuth session exchange, me, logout."},
    {"name": "users", "description": "Authenticated user profile."},
    {"name": "organizations", "description": "Orgs, memberships, invitations."},
    {"name": "billing", "description": "Stripe health check (E0 stub)."},
    {
        "name": "agency-tool",
        "description": (
            "Agency Tool adapter (public surface). E0.4: mock; reads from "
            "master_companies_mock. Real implementation tracked as REQ-001."
        ),
    },
    {
        "name": "agency-tool-admin",
        "description": "Admin CRUD over master_companies_mock (mock data only).",
    },
    {
        "name": "companies",
        "description": (
            "Entity-first company pages (E1.5-REWORK). GET /api/companies/{cif} "
            "is mixed-access (anonymous gets sections 1-3 + locked_sections). "
            "Auth endpoints persist conversation + watchlist + share."
        ),
    },
]


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Attaches a request_id to structlog contextvars for the duration of the request."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
        token = structlog.contextvars.bind_contextvars(
            request_id=request_id, path=request.url.path, method=request.method
        )
        try:
            response: Response = await call_next(request)
        finally:
            structlog.contextvars.unbind_contextvars("request_id", "path", "method")
            del token  # explicit
        response.headers["X-Request-ID"] = request_id
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("startup.begin", env=settings.env, db=settings.db_name)
    try:
        await init_indexes()
        log.info("startup.indexes_ready")
    except Exception as e:  # pragma: no cover
        log.error("startup.index_failure", error=str(e))
    log.info("startup.ready")
    yield
    await close_client()
    log.info("shutdown.complete")


app = FastAPI(
    title="arroba.com API",
    description="M&A platform for digital agencies — Etapa 0.4 (skeleton complete).",
    version="0.0.2",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestContextMiddleware)

register_exception_handlers(app)

# Routers (all under /api)
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(organizations_router, prefix="/api")
app.include_router(invitations_router, prefix="/api")
app.include_router(billing_router, prefix="/api")
app.include_router(agency_tool_public_anon_router, prefix="/api")
app.include_router(agency_tool_public_router, prefix="/api")
app.include_router(agency_tool_admin_router, prefix="/api")
app.include_router(copilot_router, prefix="/api")
app.include_router(companies_router)
app.include_router(companies_intel_router)
app.include_router(intelligence_layer_router)
app.include_router(entities_semantic_router)
app.include_router(entities_router)
app.include_router(platform_router, prefix="/api")
app.include_router(workspaces_router, prefix="/api")
app.include_router(intelligence_internal_router)


@app.get("/api/health", tags=["health"])
async def health(response: Response) -> dict:
    mongo_status = "connected"
    try:
        await get_db().command("ping")
    except Exception:
        mongo_status = "error"
    response.headers["Cache-Control"] = "no-store"
    return {
        "status": "ok",
        "mongo": mongo_status,
        "stripe": "env-ok" if settings.stripe_api_key else "env-missing",
        "emergent_auth": "env-ok" if settings.emergent_auth_url else "env-missing",
        "environment": settings.env,
        "version": "0.0.2",
    }


@app.get("/api", include_in_schema=False)
async def root() -> dict:
    return {"name": "arroba.com API", "version": "0.0.1", "stage": "E0.3"}


# ── Root-level health probes for Kubernetes/Emergent ─────────────────────────
# Cero lógica, sin chequeo de dependencias (Mongo, etc.).
# Existen SOLO para satisfacer los sondeos de la plataforma en la raíz.
# El /api/health de arriba mantiene el chequeo completo intacto.
@app.get("/health", include_in_schema=False)
@app.get("/livez", include_in_schema=False)
@app.get("/readyz", include_in_schema=False)
async def health_root() -> dict:
    return {"status": "ok"}


def _custom_openapi() -> dict:
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title="arroba.com API",
        version="0.0.2",
        description="M&A platform for digital agencies. Etapa 0 — Foundation.",
        routes=app.routes,
        tags=OPENAPI_TAGS,
    )
    schema["info"]["x-stage"] = "E0.4"
    schema["info"]["x-boundary-first"] = True
    app.openapi_schema = schema
    return schema


app.openapi = _custom_openapi  # type: ignore[assignment]
