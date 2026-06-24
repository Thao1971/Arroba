# arroba.com — PRD (estado del proyecto)

> **Última actualización**: 2026-06-24 — **Filosofía v3.0 DEFINITIVA promulgada. E1.5-REWORK (Empresa) — brief en redacción por orquestador.**
> Documento vivo. Lo actualiza el agente al final de cada sub-tarea.

---

## 📜 FUENTE DE VERDAD CANÓNICA

> **Documento maestro de filosofía**: `/app/memory/ARROBA_PHILOSOPHY.md` (v3.0, 2026-06-24).
>
> Este PRD documenta el estado del proyecto. La filosofía estratégica, los principios, las entidades del dominio y el orden de construcción están definidos en ARROBA_PHILOSOPHY.md.
>
> **Si hay conflicto entre PRD y ARROBA_PHILOSOPHY.md, gana ARROBA_PHILOSOPHY.md.**
>
> El modelo `Copilot → Skill → Workspace` queda **derogado**. El modelo correcto es **Entity First + Copilot Transversal**, con entidades principales: Empresa · Sector · Territorio · Valoración · Oportunidad · Transacción.
>
> Versión actual: v3.0 (definitiva) — añadidas sección 5 (Oportunidad vs Transacción), sección 11 (Acción inmediata) y sección 12 completa (Principios UX oficiales).

---

## 🔄 REPOSICIONAMIENTO 2026-06-24 — Filosofía v3.0 promulgada

**Estado**: E1.5 (Workspaces Persistentes) queda **🔄 REPOSICIONADA 2026-06-24**.

**Motivo**: Workspaces deja de ser unidad principal del producto. El código se conserva como capa de memoria/persistencia subordinada a entidades. Ver `ARROBA_PHILOSOPHY.md` sección 5 y 11.

**Bug pendiente (NO ATAQUE PROACTIVO)**:
🐛 **NO ATAQUE PROACTIVO** — In-workspace "Valora X" → 500. El botón "Seguir trabajando" del dock efímero funciona (verificado por tester); enviar un segundo comando desde dentro de `/w/{id}` devuelve 500. Sospecha: mismo patrón de `Content-Type` perdido al spread de headers que arreglamos en `client.ts`, pero en otro endpoint (probablemente `POST /api/workspaces/{id}/messages`). **Solo se arreglará si una entidad concreta lo necesita en E1.5-REWORK o posteriores.**

**Nota de preservación**: Workspaces, `/w/{id}`, historial, compartición team — todo se conserva en código como capa subordinada. **NO borrar**. NO escribir código nuevo sobre estos módulos hasta que el orquestador devuelva el brief de E1.5-REWORK aprobado por el usuario.

**No reanudar E1.5 ni iniciar E1.6 sin instrucción explícita del orquestador.**

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

## ✅ Etapa 1.3 — Copilot Foundation (CERRADA 2026-06-24)

Resumen del cierre:
- Backend: módulo `copilot/` con `POST /api/copilot/skills/search` público, determinista, `X-Source: mock`. Discriminated union `Workspace.blocks[]` (`search_results | empty_state | error | loading`). 10 nuevos tests pytest.
- Frontend: `components/copilot/` con `CopilotProvider`, `CopilotDock` (FAB + panel, Cmd/Ctrl+K, ESC, autofocus, sr-announcer), `Composer`, `ConversationThread`, `WorkspaceArea`. Block Library + `SearchResultsBlock`, `LoadingBlock`, `ErrorBlock`. Orchestrator pipeline `text → routeIntent → executeSkill → Workspace`. 16 nuevos tests vitest.
- REQ-003 emitido para `copilot_search_real` en `/app/_requirements_for_agency_tool/README.md`.
- **Backend 49/49 PASS · Frontend 67/67 PASS**. Lint + typecheck + build verde.
- API surface verificada por tester (TEST 4 PASS). TESTS 1-3 (UI) marcados HUMAN_REQUIRED por infra de browser, aceptados por el usuario.
- Brand refresh E1.3.5 → pendiente, no se ejecuta en esta fase.

---

## ✅ Etapa 1.5 — Workspaces Persistentes (CERRADA 2026-06-24)

**Resumen del cierre**:
- **Modelo de datos**: 3 colecciones (`workspaces`, `workspace_messages`, `workspace_blocks`) con índices por org/created_by/updated_at + order. Visibility enum amplio (`private|team|organization|public`); UI solo expone `private↔team`.
- **6 endpoints** bajo `/api/workspaces`: create / list / detail / extend (POST messages) / share / patch (title) / delete (archive soft). Todos auth-protected. `X-Active-Org` header para multi-org.
- **`intent_router.py` espejo del TS**: el endpoint `messages` ejecuta el orchestrator en backend; el dock efímero sigue ejecutándolo en frontend. Test de parity backend↔frontend evita derivas.
- **Frontend completo**: páginas `/es/w/[id]` y `/es/historial`. `OrgSwitcher` en el header (static/dropdown según memberships). `CopilotProvider` con modo anchored automático según URL. `OpenWorkspaceButton` ("Seguir trabajando") que promueve estado efímero a persistente. `RecentWorkspacesPanel` dropdown en el dock con últimos 10 + link a historial.
- **Auto-título determinista**: primera query del user con verbo stripped + capitalize + truncate 80 chars. Cero LLM aquí.
- **Cross-org safety**: redirect a `/es/historial` cuando el user abre un workspace de otra org sin acceso. Auto-switch a la org del workspace cuando sí tiene membership.
- **Compartición team verificada E2E**: buyer → comparte → seller misma org lo ve.
- **Limpieza**: borradas las rutas obsoletas `/es/analizar`, `/es/valorar`, `/es/comprar-vender` (prohibidas por Copilot First).
- **Demo users seed**: 4 usuarios (`buyer/seller/advisor/equipo@arroba.com` con password `Arroba2026!`) + 1 org "ARROBA Demo Org" (B99999999). Idempotente.
- **Tests**: Backend **110/110 PASS** (24 nuevos), Frontend **97/97 PASS** (11 nuevos). Lint + typecheck + build verde.
- **Sin REQ nuevo emitido** al Agency Tool. Snapshot del workspace para enviar al Deal Workspace futuro vendrá cuando exista el caso de uso (no proyectado a priori).

**Capturas visuales**:
- `/app/screenshots/e15_historial_light.png` — historial con un workspace `Equipo`.
- `/app/screenshots/e15_historial_dark.png` — mismo, tema dark.
- `/app/screenshots/e15_workspace_detail_light.png` — workspace abierto con header (badges Análisis + Equipo · botones Hacer privado + Archivar · lápiz edit) + thread (user msg + assistant + HeroBlock) + dock anchored abierto con composer activo.
- `/app/screenshots/e15_seller_sees_team_workspace.png` — seller@arroba.com (avatar SD) viendo en su historial el workspace creado por buyer (avatar BD en la captura del owner) gracias a `visibility=team`.

---

## ✅ Etapa 1.4 — Intelligence Skills (CERRADA 2026-06-24)

**Resumen del cierre**:
- **Backend** — adapter `EnrichCompanyAdapter` (Boundary First Mock/Real + factory por env) en `/app/backend/src/modules/agency_tool_adapter/enrich_company.py`. Skills `analyze`, `value`, `recommend` en `/app/backend/src/modules/copilot/skills/` consumiendo `LLMProvider` (Protocol; Claude vía emergentintegrations en runtime, MockLLMProvider en tests). 3 endpoints nuevos públicos `POST /api/copilot/skills/{analyze,value,recommend}`.
- **Modelo de bloques ampliado** — `HeroBlock`, `MetricsBlock`, `CompanyCardBlock`, `CompanyCardsGridBlock`, `ValuationBlock`, `NarrativeBlock` (discriminated union por `type`).
- **Value Skill simplificada** — fórmula determinista `central = revenue * 1.5`, rango `[0.75×, 1.30×]`, sin múltiplos por sector. La inteligencia real llega vía REQ-004.
- **Recommend Skill** — LLM-assisted intent router (3 subtipos: `similar_to_company` / `opportunities_by_sector` / `list_by_sector`) + heuristic fallback. Body determinista por el adapter mock; REQ-005 sustituirá el cuerpo sin cambiar la firma. **Fallback graceful por cobertura baja** (housekeeping post-E1.4): cuando un sector tiene <3 empresas mock, el grid se completa con sectores adyacentes y la narrativa lo declara explícitamente.
- **Frontend** — `route-intent.ts` detecta verbos `analiza` / `valora` / `recomienda` (NFD + lower, accent- y case-insensitive). `dispatch.ts` rutea a la skill correcta. `CopilotProvider` persiste `lastQuery`; `ErrorBlock.onRetry` replay con `lastQuery` (no más fallback a `/help`).
- **4 nuevos blocks frontend** — `ValuationBlock`, `NarrativeBlock`, `CompanyCardBlock`, `CompanyCardsGridBlock` con tokens canónicos + Light + Dark.
- **`WorkspaceArea.tsx`** — renderer único, registra los 10 tipos de bloques.
- **REQ-004 + REQ-005** emitidos en `/app/_requirements_for_agency_tool/README.md`.
- **Seed E1.4** — `scripts/seed_master_companies_e14.py` (idempotente). 13 empresas mock cubriendo los 8 sectores obligatorios; Alimentación tiene 3 empresas (Conservas, Riojana, Lácteos).
- **Tests** — Backend **86/86 PASS** (49 anteriores + 37 nuevos: 11 enrich_company_adapter + 9 copilot_analyze + 7 copilot_value + 10 copilot_recommend). Frontend **86/86 PASS** (67 anteriores + 19 nuevos).
- **Verificación visual** — capturas en Light y Dark con Claude real respondiendo (`Analyze`, `Value`, `Recommend`, `ErrorBlock + Reintentar`).
- **Verificación tester** — 7/9 PASS · 1 FAIL resuelto en housekeeping (Recommend alimentación) · 2 HUMAN_REQUIRED (browser infra) · 1 BLOCKER infra resuelto (URL del tester apuntaba a otro pod; URL real del pod actual es `https://bda5adf2-2809-4e4d-80da-4a47b994f2fe.preview.emergentagent.com/`).
- **Tokens reales consumidos** — orientativo ≈ 8-12k tokens (4-6 llamadas Claude Sonnet 4.6 en smoke E2E).

### Regla mantenida
- Tests pytest NUNCA llaman a Claude real. `MockLLMProvider` inyectado vía `set_override`.
- Skills no importan `claude_provider` ni `emergentintegrations` directamente — todas dependen del Protocol `LLMProvider` y `get_llm_provider()`.

### Empresas mock sembradas por E1.4 (13)

| ID | Razón social | Sector | Región |
|---|---|---|---|
| mc_kitchen | Kitchen Studio, S.L. | Software | Madrid |
| mc_novaledger | NovaLedger SaaS, S.L. | Software | Barcelona |
| mc_bridge | Bridge Creative Agency, S.L. | Marketing | Madrid |
| mc_atlantica | Cadena Hotelera Atlántica, S.L. | Hoteles | Galicia |
| mc_forjas | Forjas del Duero, S.A. | Industria | Castilla y León |
| mc_termo | Termoplásticos Levante, S.L. | Industria | C. Valenciana |
| mc_vitalis | Clínicas Vitalis, S.L. | Salud | Madrid |
| mc_dental | Dental Care Iberia, S.L. | Salud | Cataluña |
| mc_conservas | Conservas del Cantábrico, S.L. | Alimentación | Cantabria |
| mc_riojana | Bodegas Riojana Norte, S.A. | Alimentación | La Rioja |
| mc_lacteos | Lácteos del Atlántico, S.L. | Alimentación | Galicia |
| mc_asesorapro | AsesoraPro Consultoría, S.L. | Servicios profesionales | Madrid |
| mc_calzados | Calzados Ribera, S.L. | Retail | C. Valenciana |

---

## 🟢 Etapa 1.5 — Workspaces Persistentes (EN CURSO desde 2026-06-24)

**Filosofía** (reforzada por el usuario):
- Un workspace NO es una página. Es **memoria persistente de trabajo**.
- El Copilot continúa el pensamiento; el usuario NO "lanza consultas", trabaja sobre una misma oportunidad.
- Modelo mental: `Copilot → Skill → Blocks → Workspace → Memoria continua`.
- Experiencia tipo Notion + Claude Projects (no buscador tradicional).

**Scope dentro**:
- Persistencia MongoDB de Workspaces (3 colecciones: `workspaces`, `workspace_messages`, `workspace_blocks`).
- 6 endpoints CRUD bajo `/api/workspaces` (POST, GET list, GET item, POST messages para extender, POST share, DELETE archive, PATCH title).
- Página `/es/w/[workspace_id]/page.tsx` que renderiza el workspace + dock en modo "anchored".
- Página `/es/historial/page.tsx` con filtros (tipo + estado).
- Botón "Abrir workspace" en el dock efímero → POST /api/workspaces → redirect.
- Acceso rápido del dock con los 10 últimos workspaces.
- Compartición simple: visibility `private` ↔ `team` (el resto de visibilities quedan en el enum pero no en UI).
- Cambio de organización activa refresca historial + acceso rápido; navega a `/es/historial` si el workspace activo pertenece a otra org.

**Scope fuera**:
- Stripe, créditos, finder/success fee, billing.
- Viewer/Editor permissions granulares.
- Public link sharing y visibility `organization` / `public` como UI.
- Rutas dedicadas tipo `/es/analizar/*`, `/es/valorar/*`, `/es/comprar-vender/*`, `/es/empresa/*`, `/es/deal/*` (siguen PROHIBIDAS).
- Universal Search como página, Comentarios / Presencia en tiempo real, Notifications.
- Otras Skills además de las 4 existentes.

**Anterior**:

**Resumen del cierre**:
- **Backend** — adapter `EnrichCompanyAdapter` (Boundary First Mock/Real + factory por env) en `/app/backend/src/modules/agency_tool_adapter/enrich_company.py`. Skills `analyze`, `value`, `recommend` en `/app/backend/src/modules/copilot/skills/` consumiendo `LLMProvider` (Protocol; Claude vía emergentintegrations en runtime, MockLLMProvider en tests). 3 endpoints nuevos públicos `POST /api/copilot/skills/{analyze,value,recommend}`.
- **Modelo de bloques ampliado** — `HeroBlock`, `MetricsBlock`, `CompanyCardBlock`, `CompanyCardsGridBlock`, `ValuationBlock`, `NarrativeBlock` (discriminated union por `type`).
- **Value Skill simplificada** — fórmula determinista `central = revenue * 1.5`, rango `[0.75×, 1.30×]`, sin múltiplos por sector. La inteligencia real llega vía REQ-004.
- **Recommend Skill** — LLM-assisted intent router (3 subtipos: `similar_to_company` / `opportunities_by_sector` / `list_by_sector`) + heuristic fallback. Body determinista por el adapter mock; REQ-005 sustituirá el cuerpo sin cambiar la firma.
- **Frontend** — `route-intent.ts` detecta verbos `analiza` / `valora` / `recomienda` (NFD + lower, accent- y case-insensitive). `dispatch.ts` rutea a la skill correcta. `CopilotProvider` persiste `lastQuery`; `ErrorBlock.onRetry` replay con `lastQuery` (no más fallback a `/help`).
- **4 nuevos blocks frontend** — `ValuationBlock`, `NarrativeBlock`, `CompanyCardBlock`, `CompanyCardsGridBlock` con tokens canónicos + Light + Dark.
- **`WorkspaceArea.tsx`** — renderer único, registra los 10 tipos de bloques (`search_results` · `empty_state` · `error` · `loading` · `hero` · `metrics` · `company_card` · `company_cards_grid` · `valuation` · `narrative`).
- **REQ-004 + REQ-005** emitidos en `/app/_requirements_for_agency_tool/README.md` con payloads, schemas, SLA y criterios de aceptación accionables.
- **Seed E1.4** — `scripts/seed_master_companies_e14.py` (idempotente, upsert por `master_company_id`). 12 empresas cubriendo los 8 sectores obligatorios.
- **Tests** — Backend **84/84 PASS** (49 anteriores + 35 nuevos: 11 enrich_company_adapter + 9 copilot_analyze + 7 copilot_value + 8 copilot_recommend). Frontend **86/86 PASS** (67 anteriores + 19 nuevos: 7 route-intent + 4 blocks E1.4 + 8 workspace-area E1.4). Lint + typecheck + build verde en frontend; ruff verde en backend.
- **Verificación visual** — capturas en Light y Dark con Claude real respondiendo (`Analyze`, `Value`, `Recommend`, `ErrorBlock + Reintentar`).
- **Tokens reales consumidos** — orientativo ≈ 8-12k tokens (4-6 llamadas a Claude Sonnet 4.6 vía Emergent LLM Key durante smoke E2E).

### Regla mantenida
- Tests pytest NUNCA llaman a Claude real. `MockLLMProvider` inyectado vía `set_override`.
- Skills no importan `claude_provider` ni `emergentintegrations` directamente — todas dependen del Protocol `LLMProvider` y `get_llm_provider()`.

### Empresas mock sembradas por E1.4 (12)

| ID | Razón social | Sector | Región |
|---|---|---|---|
| mc_kitchen | Kitchen Studio, S.L. | Software | Madrid |
| mc_novaledger | NovaLedger SaaS, S.L. | Software | Barcelona |
| mc_bridge | Bridge Creative Agency, S.L. | Marketing | Madrid |
| mc_atlantica | Cadena Hotelera Atlántica, S.L. | Hoteles | Galicia |
| mc_forjas | Forjas del Duero, S.A. | Industria | Castilla y León |
| mc_termo | Termoplásticos Levante, S.L. | Industria | C. Valenciana |
| mc_vitalis | Clínicas Vitalis, S.L. | Salud | Madrid |
| mc_dental | Dental Care Iberia, S.L. | Salud | Cataluña |
| mc_conservas | Conservas del Cantábrico, S.L. | Alimentación | Cantabria |
| mc_riojana | Bodegas Riojana Norte, S.A. | Alimentación | La Rioja |
| mc_asesorapro | AsesoraPro Consultoría, S.L. | Servicios profesionales | Madrid |
| mc_calzados | Calzados Ribera, S.L. | Retail | C. Valenciana |

---

## 🟢 Etapa 1.4 — Intelligence Skills (PREVIO — EN CURSO; sustituido por la sección anterior)

**Scope dentro**:
- LLMProvider abstraction backend (`copilot/llm/`): Protocol + claude (vía
  emergentintegrations) + gpt-5.2 stub + mock + factory por env.
- **Analyze Skill** con Claude Sonnet 4.6: extrae empresa de query →
  `EnrichCompanyAdapter` → prompt JSON → workspace con Hero + Metrics +
  CompanyCard + Narrative.
- **Value Skill** determinista (sin LLM): valoración por múltiplo sectorial +
  rango 85%/120% + disclaimer. Workspace con Hero + Valuation + Metrics.
- **Recommend Skill** mock + LLM-assisted intent: subtipos
  `similar_to_company` / `opportunities_by_sector` / `list_by_sector`. Workspace
  con Hero + CompanyCardsGrid.
- Intent Router upgrade frontend: detecta verbos `analiza`, `valora`,
  `recomienda`, `compañías similares a`, etc.
- ErrorBlock replay frontend: `lastQuery` persiste en provider; "Reintentar"
  re-ejecuta misma intent.
- `EnrichCompanyAdapter` Boundary First: mock + real stub + factory por env.
- REQ-004 (Valuation Engine) + REQ-005 (Recommendation Engine) al Agency Tool.

**Scope fuera**: Stripe, créditos, finder fee, Data Room, Deal Workspace,
NDAs, LOI, Workspaces persistentes con URL propia, Universal Search página,
Compare Skill u otras skills no listadas.

**Regla crítica**: tests pytest NUNCA pegan a Claude real. `MockLLMProvider`
vía dependency injection.

**Nota**: el análisis de reconstrucción "ARROBA Matching v1.0" fue **CANCELADO** por
decisión del usuario el 2026-06-24. La fuente de verdad vuelve a ser:
- Blueprint V5 (referenciado por el usuario; en filesystem hay `Arroba Com Blueprint
  Estrategico Arquitectonico V1.docx` + design briefs; "V5" es la versión más
  reciente conocida por el usuario).
- Estado actual de `/app/frontend` y `/app/backend`.
- Decisiones arquitectónicas tomadas durante el desarrollo.

**Prioridad**: construcción.

### Entregado en E1.3 (Copilot Foundation)

- **Backend** — nuevo módulo `src/modules/copilot/`:
  - `POST /api/copilot/skills/search` público, body
    `{ query, context: { locale, pathname, user_id?, org_id? } }`.
  - Response: `Workspace { workspace_id, intent, blocks[] }` con discriminated
    union `search_results | empty_state | error | loading`.
  - Header `X-Source: mock`.
  - Service determinista filtra `master_companies_mock` con scoring textual +
    CIF + sector (accent-insensitive).
  - Tests: `tests/test_copilot_search.py` → **10 nuevos PASS** (happy, by-CIF,
    accent-insensitive, empty state, locale=en, invalid query, extra fields,
    oversized query, no-auth, context con user/org).
- **Frontend** — nuevo árbol `components/copilot/`:
  - `CopilotProvider` (state + persistencia localStorage + dispatch).
  - `CopilotDock` (FAB minimizado / panel expandido; atajo Cmd/Ctrl+K; ESC
    cierra; autofocus composer; sr-announcer).
  - `Composer` (textarea autoexpand 1–8 rows, Enter envía, Shift+Enter newline,
    chips contextuales arriba, slot adjuntos = Plus button con tooltip
    "Próximamente").
  - `ConversationThread` (user/assistant bubbles + último workspace inline).
  - `WorkspaceArea` (renderer switch por `block.type`).
- **Block Library nueva**:
  - `SearchResultsBlock` (lista con nombre, sector, CIF, score badge).
  - `LoadingBlock` (skeleton de 3 filas).
  - `ErrorBlock` (icono danger + retry).
- **lib/orchestrator/** — pipeline `text → routeIntent → executeSkill → Workspace`:
  - `routeIntent` parsea `/clear` y `/help`; resto → search.
  - `nextBestActions` da 3 chips deterministas por pathname (port del
    `presetsFor` del intake).
  - `dispatch` invoca `apiClient.copilot.search` y mapea errores a ErrorBlock.
- **Montaje** en `(public)/layout.tsx` + `(authenticated)/layout.tsx`.
- **REQ-003** emitido en `/app/_requirements_for_agency_tool/README.md` con
  payload completo, filtros, ranking, paginación y criterios de aceptación.
- **Tests frontend nuevos**: 16 (route-intent 5 + next-best-actions 4 +
  workspace-area 4 + copilot-dock E2E 3).
- **Verificación**: backend **49/49 PASS** · frontend **67/67 PASS** · lint ·
  typecheck · build OK · light + dark verificados.

**Scope OUT** (sin tocar): LLM real, otras Skills, Deal Workspace, NDAs, Data
Room, LOI, Matching, Marketplace, Universal Search como página, Stripe,
integración CIS real.

---

## 🗄️ Anexo histórico — freeze de E1.3 (CANCELADO el mismo día)

> Texto conservado por trazabilidad. El freeze duró menos de una hora.

E1.3 estuvo brevemente ⏸️ **CONGELADA** el 2026-06-24 a la espera del resultado
de un análisis de reconstrucción mayor (ARROBA Matching v1.0). El usuario
canceló el análisis el mismo día y la etapa volvió a 🟢 EN CURSO (ver sección
anterior). Cancelación oficial: "Phase E1.3 — Copilot Foundation" del orden
2026-06-24.

---

## 🔜 Etapas posteriores

- **E1.4** — Stripe (planes + créditos por interacción) + Skills adicionales (Analyze/Value/Recommend).
- **E1.5** — Workspaces persistentes con URL propia + Block Orchestrator avanzado.
- **E1.x** — Google OAuth wire-up real + `/auth/callback` (backend ya listo desde E0.3.1).
- **E2** — `/recuperar` real, perfil editable, ajustes reales, barra de enriquecimiento progresivo del Success del journey.

---

## 🔄 Reorientación estratégica 2026-06-24 — Etapas siguientes

El producto se realinea con la filosofía v3.0 (`/app/memory/ARROBA_PHILOSOPHY.md`). Orden de construcción aprobado por el usuario:

| Fase | Entidad / Tarea | Estado |
|---|---|---|
| **E1.5-REWORK** | Empresa | 🟢 EN CURSO — implementación iniciada |
| **E1.5.5** | Brand Refresh | 🔵 ENCADENADA tras E1.5 verde |
| **E1.6** | Sector | 🔵 PLANIFICADA |
| **E1.7** | Territorio | 🔵 PLANIFICADA |
| **E1.8** | Valoración | 🔵 PLANIFICADA |
| **E1.9** | Oportunidad | 🔵 PLANIFICADA |
| **E2.0** | Transacción (Transaction OS con: Matching, Teaser, NDA, IM, IOI, LOI, DD, Data Room, Q&A, Negociación, SPA, Cierre) | 🔵 PLANIFICADA |

**Reglas operativas durante la reorientación**:
- NO escribir código de producto hasta que el orquestador devuelva el brief de E1.5-REWORK aprobado por el usuario.
- Conservar TODO el código actual (Block Library, Skills, Copilot, LLMProvider, Workspaces, Historial, OrgSwitcher, EnrichCompanyAdapter, mocks, demo users). No se borra nada.
- `/historial` y `/w/{id}` se mantienen vivos durante E1.5-REWORK como retrocompatibilidad.
- La prioridad de planificación es: **UX > Arquitectura > Implementación**.

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
    ├── ARROBA_PHILOSOPHY.md  fuente de verdad canónica v3.0 (Entity First + Copilot Transversal)
    ├── PRD.md                este archivo
    └── test_credentials.md   cuentas para e1_tester
```
