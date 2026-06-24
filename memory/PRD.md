# arroba.com — PRD (estado del proyecto)

> **Última actualización**: 2026-06-24 — E1.1.5 + E1.2 cerradas formalmente. **E1.3 CONGELADA** pendiente del análisis de reconstrucción "ARROBA Matching v1.0".
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

## ✅ Etapa 1.1 — Design System interno + Auth UI + Onboarding conversacional (COMPLETADA)

Cierra la primera capa de UI sobre el backend E0. Mueve el DS a herramienta
interna admin-gated, materializa todo el flujo de auth + onboarding y deja
los placeholders de los 3 workspaces principales.

### Subentregables

| Entregable | Estado | Notas |
|---|---|---|
| **AuthProvider** en RootLayout | ✅ | `auth-context.tsx` con SWR + guard `isOnOAuthCallback()` para Google OAuth futura. |
| **`/internal/design-system`** | ✅ | Movido bajo `(authenticated)/internal/` + `<RequireAuth role="admin">`. Subscriber → redirect a `/`. |
| **`/login`** + **`/registro`** | ✅ | Port limpio de `/_design_intake/auth/*`: BrandPanel negro + form con validación client + iconos Lucide. Google OAuth button = mock deshabilitado (Próximamente). |
| **`/recuperar`** | ✅ | Stub "Próximamente" con link a `/login`. Flujo real diferido a E2 (backend aún no expone reset). |
| **`/onboarding`** | ✅ | **Registration Journey conversacional** (port de `/_design_intake/registro/rj-*.jsx`). Orquestador determinista (sin LLM): `intent` → `about` → `vehicle/company/explore_name` → `confirm` → `branch` → `validation` → `success`. Empresas mock (5) embebidas (E1.2+ → agency-tool real). Commit final: `POST /api/organizations`. |
| **`/organizaciones`** | ✅ | Lista con SWR de `/api/organizations/mine`. Empty state + CTA crear. |
| **`AuthHeader`** | ✅ | Spec estricto: `[Logo] | Analizar  Valorar  Comprar/Vender | [Theme] [User ▼]`. Dropdown: Perfil · Configuración · Design System (admin) · Logout. |
| **Placeholders** `/analizar` `/valorar` `/comprar-vender` | ✅ | `EmptyStateBlock` (primitive nueva en `components/blocks/`) con copy "Disponible en E1.3". Serán sustituidos por BlockOrchestrator. |
| **Placeholders** `/perfil` `/ajustes` | ✅ | EmptyStateBlock. Edición real en sub-fase posterior. |
| **i18n es/en** | ✅ | `messages/{es,en}.json` con `nav`, `auth.*`, `onboarding`, `journey`, `placeholders`, `header`, `brandPanel`, `organizations`. |
| **Tests Vitest** | ✅ | 37/37 verde. Nuevo módulo `lib/journey/derive.test.ts` (normalizeES + searchCompanies + deriveJourney). |
| **`yarn lint / typecheck / build`** | ✅ | Sin warnings. Build genera todas las rutas (12 rutas localizadas). |

### Decisiones de scope

- **Google OAuth**: deferred. Botón visible deshabilitado con tooltip
  "Próximamente". Backend (`POST /api/auth/session`) ya operativo y testeado en
  E0.3.1; wire-up frontend documentado en `/app/backend/README.md` (sección
  "Google OAuth · wire-up deferred (E1.x)").
- **Registration Journey**: conversacional (no form clásico). Port de `rj-*.jsx`
  con orquestador determinista en `/app/[locale]/(authenticated)/onboarding/page.tsx`.
  **Stages eliminados respecto al intake original**: `AuthForm` (usuario ya
  autenticado al entrar al journey, evita doble registro), `Payment` (E1.4 con
  Stripe), `Success.enrichment` (barra de perfil para E2).
- **Onboarding obligatorio**: si `memberships.length === 0` post-login/register,
  redirect forzado a `/onboarding`. Excepción: el header autenticado se muestra
  igual con Theme + logout aunque no haya org (no aplica aquí porque /onboarding
  ya está dentro del (authenticated) group y RequireAuth lo gate-a).
- **/recuperar**: stub. El backend no expone endpoint reset; cuando entre, se
  rellena.
- **3 placeholders de workspaces**: no construimos UI fija; son sustituidos por
  el `BlockOrchestrator` cuando el Copilot (E1.3) materialice cada workspace.

### Tabla de auditoría del intake

| Asset | Reutilizado | Portado | Ignorado | Motivo |
|---|---|---|---|---|
| `Login.html` | ✓ (visual) | E1.1 | | port a `/login/page.tsx`. |
| `auth/login-app.jsx` | | **E1.1** | | port: `<AuthShell>`, `<AuthField>`, AuthPrimary button. |
| `auth/auth-ui.jsx` | | **E1.1** | | port: `BrandPanel`, `AuthShell`, `AuthField` (iconos Lucide en lugar de SVG inline). |
| `auth/recuperar-app.jsx` | | | ✓ E2 | flujo recovery no entra en E1.1; stub "Próximamente" creado. |
| `Registro.html` | ✓ (visual) | | | clásico simple para crear cuenta; el journey conversacional vive en `/onboarding`. |
| `registro/rj-app.jsx` | | **E1.1** | | port a `onboarding/page.tsx`: orquestador de stages + handlers. |
| `registro/rj-ui.jsx` | | **E1.1** | | port a `components/journey/{Bubbles,Answers,CompanyPicker}.tsx`. |
| `registro/rj-validation.jsx` | | **E1.1** | | port parcial: `ValidationStep.tsx`. Skip `Payment`/`Success.enrichment` (E1.4/E2). |
| `registro/rj-data.js` | | **E1.1** | | port a `lib/journey/data.ts` (typed). Empresas mock embebidas; agency-tool real entra en E1.2+. |
| `assets/arroba-copilot.js` | | | ⏸ E1.3 | dock + composer aún no. |
| `assets/arroba-composer.js` | | | ⏸ E1.3 | idem. |
| `Design System.html` + `ds/*.jsx` | ✓ | | | el DS Next.js ya existe (E0.2); movido a `/internal/design-system` con admin gate. |

### Páginas creadas en E1.1 (rutas, sin prefijo de locale por `localePrefix:'never'`)

| Ruta | Tipo | Comportamiento |
|---|---|---|
| `/` | Pública | Landing con CTA login/register. Si autenticado: redirect a `/onboarding` (sin orgs) o `/organizaciones`. |
| `/login` | Pública | Form email/password. Google = mock disabled. Post-login: `/onboarding` si no hay org, else `next` o `/organizaciones`. |
| `/registro` | Pública | Form nombre/email/password con strength check. Post-register: siempre a `/onboarding`. |
| `/recuperar` | Pública | Stub "Próximamente" + back to `/login`. |
| `/onboarding` | Auth-gated | Registration Journey conversacional. Si memberships≥1 (y stage ≠ success) → redirect a `/organizaciones`. |
| `/organizaciones` | Auth-gated | Lista de orgs del user via `/api/organizations/mine`. |
| `/analizar` `/valorar` `/comprar-vender` | Auth-gated | EmptyStateBlock "Disponible en E1.3". |
| `/perfil` `/ajustes` | Auth-gated | EmptyStateBlock. |
| `/internal/design-system` | Auth-gated · admin | RequireAuth role=admin. Subscriber → redirect `/`. |

---

## ⏳ Lo que sigue queda para E1.2+

## ✅ Etapa 1.1.5 + E1.2 — Home pública + Block Library v0 (CERRADAS 2026-06-24)

Resumen del cierre:
- Home pública en español funcional sobre la nueva Block Library v0.
- Block Library v0 (5 bloques): `HeroBlock`, `CTABlock`, `FeatureCardBlock`, `MetricsBlock` (Configurable + Data, 5 estados), `EmptyStateBlock`.
- Platform Stats Mock: endpoint público `GET /api/agency-tool/platform-stats` + admin CRUD del singleton + `scripts/seed_platform_stats.py` idempotente.
- REQ-002 emitido al Agency Tool en `/app/_requirements_for_agency_tool/README.md` (público sin auth, swap mock↔real sin cambio de firma).
- CopilotDemoMock determinista pre-grabado con shape compatible con el protocolo Copilot+Skill futuro.
- Tests **backend 39/39** + **frontend 51/51** (14 nuevos: 10 blocks + 4 copilot demo). Lint + typecheck + build verde.
- Light + dark + monocromo verificados.

### Block Library v0 — 5 bloques

| Bloque | Tipo | Estados soportados | Uso en home |
|---|---|---|---|
| `HeroBlock` | Configurable | static-only | hero principal + variant `banner` (moat) |
| `CTABlock` | Configurable | static-only | CTA final |
| `FeatureCardBlock` | Configurable | static-only | 3 movimientos, 5 capas, 6 oportunidades, 3 agent-ready |
| `MetricsBlock` | **Configurable + Data** | loading · empty · error · unavailable · success | KPIs de la home (modo `data`) consumiendo `/api/agency-tool/platform-stats` |
| `EmptyStateBlock` | Configurable | static (anticipo E1.1) | placeholders `/analizar /valorar /comprar-vender /perfil /ajustes` |

Cada bloque expone `testId` configurable, raíz con `data-testid="block-{name}"`, soporta Light + Dark, tokens canónicos.

### Componentes puntuales de home

- **`PublicFooter`** — 7 logos institucionales (`INE`, `BOE·BORME`, `BdE`, `CNMV`, `Registradores`, `Comercio`, `Contratación`) en `/public/intake/logos/`. testid `public-footer-logo-{slug}`.
- **`CopilotDemoMock`** — demo determinista pre-grabada (sin LLM). Script en `/src/components/home/copilot-demo-script.ts` con 4 chips (`shortlist`, `valuate`, `teasers`, `signals`), cada uno con respuesta + cards + citación con `✦`. El shape (`chip_id`, `user_message`, `copilot_response`, `cards`, `citation`) es **compatible con el protocolo Copilot real (E1.3)** — siempre que E1.3 se desbloquee tras el análisis Matching v1.0.

### Backend — endpoint `platform_stats`

- `GET /api/agency-tool/platform-stats` — **público sin auth**, header `X-Source: mock`.
- `POST/GET/PUT/DELETE /api/admin/agency-tool/platform-stats-mock` — admin CRUD (singleton).
- `GET /api/agency-tool/status` — público, lista los adapters disponibles (incluye nuevo `platform_stats`).
- Service: `get_platform_stats`, `upsert_platform_stats_mock`, `update_platform_stats_mock`, `delete_platform_stats_mock` en `src/modules/agency_tool_adapter/service.py`.
- Modelo Pydantic `PlatformStats` con 8 campos + `last_updated`, `confidence`, `lineage`, `valid_until`, `source`.
- Seed script `scripts/seed_platform_stats.py` (idempotente, upsert sobre `_key="singleton"`).
- 9 tests específicos `tests/test_platform_stats.py` + 4 tests existentes actualizados (status now public, ya no requiere auth).

### REQ-002 al Agency Tool

Documentado en `/app/_requirements_for_agency_tool/README.md` con criterio explícito "**endpoint público SIN autenticación de usuario**" y mapeo al adapter actual.

---

## ⏸️ Etapa 1.3 — Copilot dock + Composer (CONGELADA - PENDIENTE DE ANÁLISIS DE RECONSTRUCCIÓN)

**Estado**: ⏸️ **CONGELADA** desde 2026-06-24.

**Motivo del freeze**: antes de arrancar E1.3 el orquestador va a ejecutar un
análisis de una posible reconstrucción mayor del producto hacia
**"ARROBA Matching v1.0"** — matching M&A estructurado, NDAs progresivos, data
room, deal workspace, finder fee, capa agéntica, integración CIS, etc. El
resultado de ese análisis puede cambiar el propósito del Copilot y del Block
Orchestrator (de "asistente conversacional transversal" a "orquestador de
proceso de matching"), por lo que cualquier port o implementación previa a la
decisión podría requerir reescritura.

**🚫 No iniciar E1.3 hasta que el orquestador confirme el resultado del análisis ARROBA Matching v1.0.**

Qué NO se debe tocar mientras dure el freeze:
- NO portar `arroba-copilot.js` ni `arroba-composer.js`.
- NO añadir Skills (search, valuation, matching, etc.).
- NO construir el Block Orchestrator real.
- NO ampliar el `CopilotDemoMock` con lógica nueva (el shape ya es compatible y se queda como está).
- NO cambiar los placeholders `/analizar`, `/valorar`, `/comprar-vender` (siguen siendo `EmptyStateBlock`).

Qué SÍ se puede hacer mientras dure el freeze (no requiere reabrir E1.3):
- Bug fixes detectados por `e1_tester` sobre lo ya entregado (E0/E1.1/E1.1.5/E1.2).
- Cambios cosméticos del DS interno si los pide el orquestador.
- Lectura de docs de Matching v1.0 cuando lleguen al intake.

---

## 🔜 Etapas posteriores (sin cambios hasta freeze E1.3)

- **E1.4** — Stripe (planes + créditos por interacción) + Search Skill real.
- **E1.5** — Workspaces dinámicos materializados por Copilot reusando Block Library.
- **E1.x** — Google OAuth wire-up real + `/auth/callback` (backend ya listo desde E0.3.1).
- **E2** — `/recuperar` real, perfil editable, ajustes reales, barra de enriquecimiento progresivo del Success del journey.

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
