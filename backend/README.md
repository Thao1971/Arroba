# arroba.com — Backend (FastAPI monolito modular)

**Etapa 0.4 completada** — Skeleton: auth + users + organizations + billing health + agency_tool_adapter (mock) + health-check.

## Arrancar en el pod (supervisor)

```bash
# El pod ya tiene supervisor configurado. Solo levantar el servicio:
sudo supervisorctl start backend
curl http://localhost:8001/api/health
```

Pre-requisito: MongoDB activo.
```bash
sudo supervisorctl start mongodb
```

## Arrancar en local (sin supervisor)

```bash
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

`server.py` es un shim que importa `app` desde `src/main.py`. Esto mantiene
compatibilidad con el contrato del supervisor (`uvicorn server:app` desde
`/app/backend`) sin contaminar la arquitectura modular real.

## Seed del primer admin (E0.4)

```bash
cd /app/backend
python scripts/seed_admin.py
# → crea/actualiza admin@arroba.dev / Admin1234! (idempotente)
```

Documentación completa en `/app/memory/test_credentials.md`.

## Tests

```bash
cd /app/backend

# Default (rápido, usa mongomock-motor; sin Mongo real necesario)
pytest -q
# → 30 passed, 6 deselected

# Integración real (requiere Mongo en MONGO_URL)
MONGO_URL=mongodb://localhost:27017 pytest -m real_mongo -q
# → 6 passed, 30 deselected

# Lint
ruff check .
ruff format --check .
```

## Estructura

```
src/
  core/
    config.py        Settings via pydantic-settings (lee .env + env vars)
    database.py      Motor async client + init_indexes + audit de índices
    security.py      bcrypt + JWT + session token gen
    logging.py       structlog config (key=value + request_id contextvar)
    exceptions.py    DomainError + handlers + JSON error envelope
  modules/
    auth/            register/login/session/me/logout + cookies HTTPS-aware
    users/           PATCH /users/me
    organizations/   crear org, invitar, aceptar, listar miembros
    billing/         health check (E0 stub Stripe)
    agency_tool_adapter/   mock adapter + admin CRUD master_companies_mock
  shared/
    types.py         Role, OrgRole, SessionStatus, etc.
  main.py            FastAPI app + CORS + middleware + lifespan + custom OpenAPI
server.py            shim para supervisor (`uvicorn server:app`)
scripts/
  seed_admin.py      bootstrap del primer admin (idempotente)
tests/               pytest + mongomock-motor + httpx ASGI
                     + tests `@real_mongo` opt-in para integración real
.env.example         placeholders; el .env real lo aporta el pod
```

## Boundary First

**Cada módulo accede SOLO a sus colecciones.** Cross-module se hace via servicios
expuestos por el módulo dueño (`users.service.get_user`, etc.), nunca leyendo la
colección de otro módulo. Tipos compartidos viven en `shared/types.py`.

El `agency_tool_adapter` es la **única vía** que toca `master_companies_mock`.
Para sustituir mock por real, solo cambia el body de `enrich_company`; ni la
firma ni el shape de `EnrichedCompany` se mueven. Ver REQ-001 en
`/app/_requirements_for_agency_tool/README.md`.

## Endpoints disponibles (E0.4)

| Método + Path | Acceso | Notas |
|---|---|---|
| `GET /api/health` | público | mongo/stripe/emergent_auth env-ok |
| `POST /api/auth/register` | público | cookie httpOnly + Secure si HTTPS |
| `POST /api/auth/login` | público | idem |
| `POST /api/auth/session` | público | intercambia session_id de Emergent OAuth |
| `GET /api/auth/me` | sesión | user + memberships |
| `POST /api/auth/logout` | público | idempotente |
| `GET / PATCH /api/users/me` | sesión | profile |
| `POST /api/organizations` | sesión | crea org + membership owner |
| `GET /api/organizations/mine` | sesión | mis orgs con rol |
| `GET /api/organizations/{org_id}` | miembro | detalle |
| `GET /api/organizations/{org_id}/members` | miembro | lista |
| `POST /api/organizations/{org_id}/invitations` | owner/admin | crea invite |
| `POST /api/invitations/{token}/accept` | sesión | acepta |
| `GET /api/billing/health` | público | stripe sdk + env presence |
| `GET /api/agency-tool/status` | sesión | adapters en mock/real |
| `GET /api/agency-tool/companies/{id}` | sesión | EnrichedCompany + `X-Source` |
| `POST GET PUT DELETE /api/admin/agency-tool/master-companies-mock[/{id}]` | **admin** | CRUD mock |

Spec completo: `GET /api/openapi.json` o `GET /api/docs` (Swagger UI).

## Cookies HTTPS-aware (E0.4)

Las cookies de sesión activan `Secure` automáticamente cuando el request llega
con el header `X-Forwarded-Proto: https` (el proxy del preview lo añade). En
local sin TLS sale sin `Secure` para que las herramientas de test funcionen.

## Auditoría de índices (E0.3.1 + E0.4)

Ningún índice usa `sparse=True`. Todos los campos opcionales unique usan
`partialFilterExpression={"<field>": {"$type": "string"}}` para evitar el bug
de colisión en null. Documentación completa en el docstring de
`src/core/database.py`.

Pattern aplicado a:
- `users.google_id` (unique + partial)
- `organizations.tax_id` (partial, no unique)
- `master_companies_mock.cif` (unique + partial)
