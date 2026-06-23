# arroba.com — PRD (estado del proyecto)

> **Última actualización**: Etapa 0 cerrada (E0.1 → E0.4).
> Documento vivo. Lo actualiza el agente al final de cada sub-tarea.

---

## ✅ Etapa 0 — Fundación (COMPLETADA)

Objetivo: dejar la base lista para que en Etapa 1 podamos construir Universal
Search, Ficha de empresa, Valoración, Copilot conversacional y monetización sin
pelearnos con la base. Construcción atómica, "Boundary First" como principio.

### Sub-tareas

| Sub-tarea | Estado | Notas |
|---|---|---|
| **E0.1** — Limpieza estructural | ✅ | Legacy a `/app/_legacy/`; intake en `/app/_design_intake/` intacto; carpetas vacías creadas en `/app/frontend` y `/app/backend`; `/app/_requirements_for_agency_tool/README.md` inicializado. |
| **E0.2** — Frontend skeleton | ✅ | Next.js 14.2.35 + TS estricto + Tailwind + next-intl + Lucide. Tokens canónicos en `src/styles/tokens.css` (single source of truth). DS primitives mínimos. Página `/design-system` con tokens, primitives, contraste WCAG y modo monocromo. 4/4 PASS en e1_tester. |
| **E0.2.5** — Supervisor frontend | ✅ | `yarn start` (Next.js `next start -p 3000 -H 0.0.0.0`) tras `yarn build`. Backup de config legacy en `/app/_legacy/supervisor.frontend.legacy.conf`. |
| **E0.3** — Backend skeleton | ✅ | FastAPI monolito modular. `auth` + `users` + `organizations` + `billing` (stub). MongoDB indexado. structlog key=value con `request_id`. 19/19 PASS en e1_tester. |
| **E0.3.1** — Bugfix sparse-null | ✅ | `users.google_id` y `organizations.tax_id` cambiados de `sparse=True` a `partialFilterExpression={$type: "string"}`. `exclude_none=True` en inserts. Tests `real_mongo` añadidos. Migración idempotente de índices viejos. |
| **E0.4** — Agency Tool adapter | ✅ | Adapter mock con `EnrichedCompany` canónico, CRUD admin sobre `master_companies_mock`, header `X-Source: mock`, log `[MOCK]`. REQ-001 emitido. Cookies HTTPS-aware. Seed admin idempotente. |

### Stack tecnológico congelado

**Frontend** (`/app/frontend/`):
- Next.js 14.2.35 (App Router) · React 18.3.1 · TypeScript 5.7.3 (strict + `noUncheckedIndexedAccess`)
- Tailwind 3.4.17 con todas las clases mapeadas a `var(--*)` de `src/styles/tokens.css`
- next-intl 3.26.5 (locales `es`/`en`, `localePrefix: 'never'`)
- Lucide React 0.577.0 (stroke 1.5)
- next/font/google → Space Grotesk (display) + DM Sans (body) + JetBrains Mono (data)
- Vitest 2.1.9 + @testing-library/react 16.3.0 (21/21 tests verde)
- ESLint + Prettier limpios

**Backend** (`/app/backend/`):
- FastAPI 0.115.12 · Motor 3.6.0 · Pydantic 2.12.5
- pydantic-settings 2.6.1 · PyJWT 2.9.0 · bcrypt 4.1.3 · httpx 0.28.1
- structlog 24.4.0 con `request_id` en contextvars
- Pytest 8.3.3 + mongomock-motor (default) + real Mongo opcional (`@pytest.mark.real_mongo`)
- Ruff 0.7.4 limpio · 30/30 default tests verde · 6/6 real_mongo verde

**Infra**:
- MongoDB 6 local en `localhost:27017`, db `arroba_com`
- Supervisor del pod (READONLY) corre `yarn start` para frontend y `uvicorn server:app` para backend
- Preview URL: `https://musing-hellman-9.preview.emergentagent.com/`

### Boundary First — cinco fronteras

1. **arroba.com ↔ Agency Tool**: `EnrichedCompany` único. E0.4 mock. REQ-001 abierto.
2. **frontend ↔ backend**: OpenAPI en `/api/openapi.json` con tags por módulo. Tipos TS generables con `openapi-typescript` (pendiente para E1.x).
3. **módulo ↔ módulo en backend**: ningún router toca colecciones de otro módulo. Cross-module via servicios públicos (`auth.service.get_user_public`, `organizations.service.list_memberships_for_user`).
4. **mock ↔ real**: el adapter mock añade `X-Source: mock` en respuestas y `[MOCK]` en logs. `GET /api/agency-tool/status` lista qué adapters están en mock.
5. **bloque ↔ bloque (Block Library)**: aún no construida. Carpeta vacía `src/components/blocks/.gitkeep` en frontend. E1 la abre.

### Módulos backend activos

- `core/{config,database,security,logging,exceptions}.py`
- `shared/types.py` (enums cross-module)
- `modules/auth/` — register/login/session/me/logout + cookies HTTPS-aware
- `modules/users/` — PATCH /users/me
- `modules/organizations/` — orgs + memberships + invitations
- `modules/billing/` — health stub Stripe
- `modules/agency_tool_adapter/` — mock + admin CRUD + status

### Endpoints públicos (vía `/api/openapi.json`)

`/api/health`, `/api/auth/{register,login,session,me,logout}`, `/api/users/me`,
`/api/organizations`, `/api/organizations/mine`, `/api/organizations/{org_id}`,
`/api/organizations/{org_id}/members`, `/api/organizations/{org_id}/invitations`,
`/api/invitations/{token}/accept`, `/api/billing/health`,
`/api/agency-tool/status`, `/api/agency-tool/companies/{master_company_id}`,
`/api/admin/agency-tool/master-companies-mock` (POST/GET/PUT/DELETE).

---

## ⏳ Lo que NO entra en Etapa 0 (queda para E1+)

- Universal Search funcional.
- Ficha de empresa pública / autenticada con datos reales.
- Valoración (módulo completo con multiples, comparables, escenarios).
- Block Library + Block Orchestrator.
- Copilot conversacional (dock + composer) en frontend.
- Workspaces (Analizar, Valorar, Compra-Venta, Investor, M&A).
- Stripe planes / créditos / facturas (E0.4 solo expone `/api/billing/health` stub).
- Consumo real de signals / scores / recommendations (vendrán del Agency Tool real cuando REQ-001 entregue).
- Endpoint público de promoción admin-to-admin.
- Block Library de bloques entidad / inteligencia / análisis (documentados en `/app/_design_intake/uploads/ARROBA_Design_Brief_V1.docx` Parte B).

---

## 🎯 Etapa 1 — Analizar + Copilot + Monetización (pendiente)

Scope que abrimos cuando E0.4 esté verificada:
1. Workspace **Analizar** con consumo del Agency Tool adapter (mock).
2. Bloques de entidad (Company Header, Financial Summary, Sector Overview, …) según Block Library del Design Brief.
3. Copilot dock + Composer (portado a React+TS desde `/app/_design_intake/assets/arroba-{copilot,composer}.js`).
4. Stripe planes + checkout + créditos por interacción.

---

## 📂 Mapa de carpetas críticas

```
/app/
├── frontend/                 Next.js 14 (producción nueva)
├── backend/                  FastAPI monolito modular (producción nueva)
├── _legacy/                  React 19 + craco / FastAPI legacy (referencia, NO se reutiliza)
├── _design_intake/           47 prototipos HTML+JSX vanilla (referencia perpetua de UX)
├── _requirements_for_agency_tool/  REQ-001 abierto
└── memory/
    ├── PRD.md                este archivo
    └── test_credentials.md   cuentas para e1_tester
```
