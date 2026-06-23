# arroba.com — Backend (FastAPI monolito modular)

Etapa 0.3 — Skeleton: auth + users + organizations + billing health + health-check.

## Arrancar (dev)

```bash
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

O bien (con supervisor en el pod):

```bash
sudo supervisorctl start backend
curl http://localhost:8001/api/health
```

## Tests

```bash
pytest -q                  # 15+ tests con mongomock-motor (sin Mongo real)
ruff check .
ruff format --check .
```

## Estructura

```
src/
  core/
    config.py        Settings via pydantic-settings (lee .env y env real)
    database.py      Motor async client + init_indexes + override (tests)
    security.py      bcrypt + JWT + session token gen
    logging.py       structlog config (key=value + request_id)
    exceptions.py    DomainError + handlers + JSON error envelope
  modules/
    auth/            register/login/session/me/logout
    users/           PATCH /users/me
    organizations/   crear org, invitar, aceptar, listar miembros
    billing/         health check (E0 stub)
  shared/
    types.py         Role, OrgRole, SessionStatus, etc.
  main.py            FastAPI app + CORS + middleware + lifespan + custom OpenAPI
server.py            shim para supervisor (`uvicorn server:app`)
tests/               pytest + mongomock-motor + httpx ASGI
.env.example         placeholders; el .env real lo aporta el pod
```

## Boundary First

Cada módulo accede SOLO a sus colecciones. Cross-module se hace via servicios
expuestos por el módulo dueño (`users.service.get_user`, etc.), nunca leyendo la
colección de otro módulo. Tipos compartidos viven en `shared/types.py`.

E0.3 no integra Agency Tool (E0.4) ni Copilot.
