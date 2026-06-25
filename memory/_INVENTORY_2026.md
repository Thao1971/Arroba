# arroba.com — Inventario Técnico Exhaustivo (modo solo lectura)

> **Fecha del inventario**: 2026-06-25
> **Modo**: SOLO LECTURA — ningún archivo de producto fue modificado.
> **Propósito**: Línea base real (no narrativa) para estimar el esfuerzo hacia el hito **ARROBA Matching v1.0 — Transaction Operating System**.
> **Cómo leerlo**: cada métrica fue obtenida con `wc -l`, `grep`, `find`, `pytest --collect-only`, `yarn test` y `ls`. Cuando un dato no era medible o no aplicaba se marca `n/d`.

---

## 0. Resumen ejecutivo (TL;DR)

- **Backend**: 8 módulos · 7 670 LOC Python · 48 endpoints (todos bajo `/api`) · 138/138 tests pasan (6 deselected = `real_mongo`).
- **Frontend**: 15 717 LOC TS/TSX · 21 archivos de test · **152/152 tests Vitest pasan**.
- **Documentación canónica**: 6 documentos `/app/memory/*.md` activos + 2 documentos operativos (`CHANGELOG.md`, `ROADMAP.md`).
- **Hito alcanzado**: E1.5.6 (Consolidación Arquitectónica, Entity Framework canonizado). **6 capas canónicas** vivas.
- **Camino hacia ARROBA Matching v1.0**: 14 bloques requeridos; estimación bruta de cobertura **≈ 18 %** (sólo a/m parcialmente cubiertos; resto sin código ni spec).
- **Riesgo dominante**: lagunas documentales P0 sobre **NDA progresivo, Finder Fee, CIS, 4 niveles agénticos, 5 copilots especializados, suscripción por rol**. Sin estos specs, el backend de Transaction OS (E1.6 → E2.0) no puede arrancar con dirección clara.
- **Deuda legacy**: módulo `workspaces` (583 LOC service + 7 endpoints) y UI `/w/{workspace_id}`/`/historial` conviven con el modelo Entity First. Funcionan, pero compiten visualmente y conceptualmente con el patrón nuevo. **No tocar hasta E2.0**; ya documentado en §6.

---

## 1. Documentación

### 1.1 Inventario de `/app/memory/*.md`

| Archivo | Líneas | Tamaño | Última mod. | Propósito declarado | Estado |
|---|---:|---:|---|---|---|
| `ARROBA_PHILOSOPHY.md` | 270 | 8.1 KB | 2026-06-25 | Filosofía canónica v3.0 — derroga modelo Workspace-first | ✅ Vigente |
| `ENTITY_MODEL.md` | 863 | 35 KB | 2026-06-25 | Ontología: catálogo de tipos canónicos de entidad, campos, relaciones (incluye `match` como entidad de primer nivel tras Sprint 0.5 Ciclo B) | ✅ Vigente v1.1.0 |
| `ENTITY_FRAMEWORK.md` | 875 | 39 KB | 2026-06-25 | Arquitectura UX: módulos canónicos por entidad (anatomía completa incluyendo Match) | ✅ Vigente v1.1.0 |
| `DESIGN_SYSTEM.md` | 552 | 27 KB | 2026-06-25 | DS v1.0.0 — Nivel 1 tokens, Nivel 2 componentes, Nivel 3 page patterns | ✅ Vigente |
| `PRD.md` | 794 | 57 KB | 2026-06-25 | Estado del proyecto + roadmap por etapas E0…E2.0 | ✅ Vigente |
| `CHANGELOG.md` | 73 | 9.9 KB | 2026-06-24 | Histórico por fecha | ⚠️ Mezcla entradas vigentes (E1.3/1.4/1.5) con entradas legacy de Mar-Abr 2026 (Buyer Activity, LOI Comparator, Cards marketplace) que no corresponden al código actual |
| `ROADMAP.md` | 28 | 1.6 KB | **2026-04-30** | Backlog priorizado P1/P2/P3 | ❌ **OBSOLETO** — habla de `DealOrchestratedView`, `SellerWizard.js`, "marketplace legacy", "infomemo PDF". Ese código no existe en `/app`. Contradice PRD.md y ARROBA_PHILOSOPHY.md |
| `test_credentials.md` | 144 | 6.1 KB | 2026-06-24 | Credenciales para testing agent | ✅ Vigente |

### 1.2 Capas canónicas declaradas vs. estado real

| # | Capa | Documento de verdad | Estado |
|---|---|---|---|
| 1 | Blueprint Estratégico | `ARROBA_PHILOSOPHY.md` | ✅ |
| 2 | UX Blueprint | `ARROBA_PHILOSOPHY.md` §12 | ✅ |
| 3 | Entity Framework | `ENTITY_FRAMEWORK.md` + `ENTITY_MODEL.md` | ✅ |
| 4 | Engines & Specs | `specs/*` (6 specs canónicos Sprint 0) | ✅ Baseline v1.0 |
| 5 | Design System | `DESIGN_SYSTEM.md` v1.0.0 | ✅ |
| 6 | Diseños (page-specific) | embebidos en PRD §1.5/1.5.5/1.5.6 | 🟡 sólo Empresa |
| 7 | Implementación | código en `/app/frontend` + `/app/backend` | 🟡 sólo Empresa |

### 1.3 Lagunas documentales contra el alcance Matching v1.0

Documentos **inexistentes hoy** que el hito requiere:

| Spec faltante | Prioridad | Bloquea |
|---|---|---|
| `NDA_SPEC.md` (NDA progresivo: flujo, fases, plantillas, eventos) | **P0** | Bloque f, g, h |
| `FINDER_FEE_SPEC.md` (estructura comisiones, revenue share, closing) | **P0** | Bloque k |
| `CIS_SPEC.md` (contrato CIS, qué firma cliente, qué fija arroba) | **P0** | Bloque l |
| `AGENTIC_LAYERS_SPEC.md` (4 niveles: contextual / preparación / ejecución / automatización) | **P0** | Bloque m |
| `COPILOTS_SPEC.md` (5 copilots: Company, Market, Valuation, Transaction, Advisor — memoria/contexto compartidos) | **P0** | Bloque m |
| `SUBSCRIPTION_SPEC.md` (planes por rol: subscriber / corporate / investor / advisor; cuotas; límites de interacción agéntica) | **P0** | Bloque b |
| `MARKETPLACE_SPEC.md` (motor de matching: criterios, scoring, surface anónimo) | **P1** | Bloque e |
| `DATAROOM_SPEC.md` (estructura, permisos por fase, watermarks) | **P1** | Bloque g |
| `LOI_SPEC.md` (IOI vs LOI, comparator, exclusividad) | **P1** | Bloque h |
| `SIGNALS_SPEC.md` (qué señales se calculan, cómo, cuándo se publican) | **P1** | Bloque j |
| `BUYER_QUAL_SPEC.md` (criterios de calificación, KYC) | **P1** | Bloque d |
| `SELLER_WORKSPACE_SPEC.md` (preparación de venta antes de teaser) | **P1** | Bloque c |
| `ADVISOR_LAYER_SPEC.md` (qué hace un asesor: mandatos, exclusividad, panel) | **P1** | Bloque n |
| `DEAL_WORKSPACE_SPEC.md` (sub-modelo de Operación durante DD/Negociación) | **P2** | Bloque i |

Específicamente: en `ENTITY_MODEL.md` se declaran los tipos canónicos (incluido `operation`, `valuation`, `opportunity`, `mandate`, `match`, `user`, `document`), pero **ninguno tiene `models.py` en backend salvo `company`/`organization`**. Es decir, la ontología existe en papel, no en código.

---

## 2. Backend (FastAPI · Motor · Pydantic v2)

### 2.1 Métricas globales

| Métrica | Valor |
|---|---:|
| LOC Python (src/) | **7 670** |
| Módulos en `src/modules/` | **8** (`auth`, `users`, `organizations`, `billing`, `agency_tool_adapter`, `copilot`, `companies`, `workspaces`) |
| Endpoints REST totales | **48** (incluye `/api/health` y root `/api`) |
| Modelos Pydantic | 92 (suma sobre módulos) |
| Tests | **138 passed**, 0 failed, 6 deselected (`real_mongo`) |
| Tiempo ejecución suite | 14.17 s |
| Mocks declarados | `MockEnrichCompanyAdapter`, `master_companies_mock`, `platform_stats_mock`, `MockLLMProvider`, `agency_tool_adapter.ADAPTER_MODE = "mock"` |

### 2.2 Endpoints por módulo

| Módulo | Prefijo | # endpoints | Endpoints |
|---|---|---:|---|
| `auth` | `/api/auth` | 5 | `POST /register`, `POST /login`, `POST /session`, `GET /me`, `POST /logout` |
| `users` | `/api/users` | 2 | `GET /me`, `PATCH /me` |
| `organizations` | `/api/organizations` | 5 | `POST `, `GET /mine`, `GET /{id}`, `GET /{id}/members`, `POST /{id}/invitations` |
| `invitations` | `/api/invitations` | 1 | `POST /{token}/accept` |
| `billing` | `/api/billing` | 1 | `GET /health` (stub — sólo verifica SDK Stripe + env vars) |
| `agency_tool_adapter` (público anon) | `/api/agency-tool` | 2 | `GET /platform-stats`, `GET /status` |
| `agency_tool_adapter` (público auth) | `/api/agency-tool` | 1 | `GET /companies/{master_company_id}` |
| `agency_tool_adapter` (admin) | `/api/admin/agency-tool` | 10 | CRUD `master-companies-mock` (5) + CRUD `platform-stats-mock` (4) + 1 admin |
| `copilot` | `/api/copilot` | 4 | `POST /skills/search`, `POST /skills/analyze`, `POST /skills/value`, `POST /skills/recommend` |
| `companies` | `/api/companies` | 9 | `GET /by-id/{master_company_id}` (307→canónica), `GET /{cif}`, `GET /{cif}/conversation`, `POST /{cif}/messages`, `POST /{cif}/refresh-analysis`, `POST /{cif}/skills/value`, `POST /{cif}/skills/comparables`, `POST /{cif}/watchlist`, `POST /{cif}/share` |
| `workspaces` | `/api/workspaces` | 7 | `POST`, `GET`, `GET /{id}`, `POST /{id}/extend`, `POST /{id}/share`, `PATCH /{id}`, `DELETE /{id}` |
| `main` | `/api` | 2 | `GET /api/health`, `GET /api` |
| **Total** | | **48** | |

### 2.3 Modelos Pydantic — recuento por módulo

| Módulo | `models.py` líneas | # `class` (BaseModel/Enum) |
|---|---:|---:|
| `copilot` | 377 | **32** |
| `companies` | 299 | 17 |
| `workspaces` | 192 | 15 |
| `agency_tool_adapter` | 169 | 11 |
| `organizations` | 111 | 10 |
| `auth` | 59 | 6 |
| `users` | 6 | 1 |
| `billing` | — | 0 (sin modelos) |

### 2.4 Servicios (capa de negocio) — líneas

| Módulo | `service.py` |
|---|---:|
| `companies` | **846** |
| `workspaces` | 583 |
| `agency_tool_adapter` | 294 |
| `copilot` | 259 |
| `organizations` | 182 |
| `auth` | 164 |
| `users` | 22 |

### 2.5 Colecciones MongoDB en uso

14 colecciones referenciadas desde `/app/backend/src`:

1. `users`
2. `user_sessions`
3. `organizations`
4. `memberships`
5. `org_invitations`
6. `master_companies_mock` 🟡 *mock*
7. `platform_stats_mock` 🟡 *mock*
8. `company_conversations`
9. `company_conversation_messages`
10. `company_watchlists`
11. `company_analysis_refreshes`
12. `workspaces`
13. `workspace_messages`
14. `workspace_blocks`

### 2.6 Roles canónicos declarados

`src/shared/types.py`:

- `Role`: `anonymous` · `subscriber` · `corporate` · `investor` · `advisor` · `admin`
- `OrgRole`: `owner` · `admin` · `operator`
- `OrgStatus`: `active` · `suspended` · `archived`
- `MembershipStatus`: `pending` · `active` · `removed`
- `InvitationStatus`: `pending` · `accepted` · `expired` · `cancelled`

**Observación crítica**: los roles `subscriber`/`corporate`/`investor`/`advisor` existen como `Enum` pero **no hay lógica de pricing/cuotas/permisos diferenciados** asociada a ellos en código (sólo en el modelo `UserPublic.role`). El módulo `billing` es un stub que sólo verifica disponibilidad del SDK Stripe.

### 2.7 Capa LLM (`copilot/llm/`)

| Archivo | Líneas | Rol |
|---|---:|---|
| `provider.py` | 55 | Contrato abstracto + `Message`, `LLMTimeoutError`, `LLMInvalidJSONError`, `LLMUpstreamError` |
| `factory.py` | 64 | Selección por `settings.llm_provider` |
| `claude_provider.py` | 108 | Claude Sonnet 4.6 vía `emergentintegrations.LlmChat` (import dinámico) |
| `gpt52_provider.py` | 39 | Stub GPT-5.2 (no usado por default) |
| `mock_provider.py` | 77 | Provider determinista para tests |

### 2.8 Skills (Copilot global)

| Skill | Archivo | Líneas | Estado |
|---|---|---:|---|
| `analyze` | `skills/analyze.py` | 402 | ✅ activo |
| `recommend` | `skills/recommend.py` | 563 | ✅ activo |
| `value` | `skills/value.py` | 316 | ✅ activo (deterministic, no LLM) |
| `search` | dispatched via `copilot/service.py` | — | ✅ activo |
| `company_resolver` | `skills/company_resolver.py` | 107 | helper |

### 2.9 Backend Tests

```
tests/__init__.py
conftest.py
test_agency_tool_adapter.py
test_auth.py
test_companies_advisor.py
test_cookies_https.py
test_copilot_analyze.py
test_copilot_recommend.py
test_copilot_search.py
test_copilot_value.py
test_enrich_company_adapter.py
test_exceptions.py
test_health.py
test_intent_router.py
test_organizations.py
test_platform_stats.py
test_real_mongo.py        # deselected by default
test_users.py
test_workspaces.py
```

Resultado: **138 passed, 6 deselected, 0 failed** (`pytest -q`, 14.17 s).

---

## 3. Frontend (Next.js 14 App Router · React 18 · TypeScript · Tailwind)

### 3.1 Métricas globales

| Métrica | Valor |
|---|---:|
| LOC TS/TSX (`src/`) | **15 717** |
| Archivos `.test.tsx`/`.test.ts` | **21** |
| Tests Vitest | **152 passed / 152** |
| Tiempo ejecución suite | 9.86 s |
| Componentes (carpetas en `components/`) | 8 (`auth`, `blocks`, `copilot`, `ds`, `entity`, `home`, `journey`, `layout`) + `RequireAuth.tsx` |
| Páginas (page.tsx) | 13 |
| Locales soportados | `es`, `en` (next-intl 3.26.5) |

### 3.2 Páginas (`src/app/[locale]/`)

**Públicas** (`(public)`):
- `/` — home (`page.tsx`)
- `/login`
- `/registro`
- `/recuperar`

**Autenticadas** (`(authenticated)`):
- `/ajustes`
- `/historial` 🟠 *legacy listado de workspaces*
- `/onboarding` (chat-driven, 9 stages: intent → about → vehicle → company → confirm → branch → validation → success)
- `/organizaciones`
- `/perfil`
- `/w/{workspace_id}` 🟠 *Workspace-first legacy*
- `/internal/design-system` (Living DS)

**Entidad canónica** (modelo nuevo):
- `/empresa/{cif}` ✅ — único patrón Entity First implementado

### 3.3 Componentes — recuento por carpeta

| Carpeta | Archivos `.tsx`/`.ts` (no test) | Notas |
|---|---:|---|
| `components/auth/` | 5 | `AuthField`, `AuthShell`, `BrandPanel`, `Divider`, `index` |
| `components/blocks/` | 15 | Block Library del Copilot: `CTABlock`, `CompanyCardBlock`, `CompanyCardsGridBlock`, `EmptyStateBlock`, `ErrorBlock`, `FeatureCardBlock`, `HeroBlock`, `LoadingBlock`, `MetricsBlock`, `MetricsGrid`, `NarrativeBlock`, `RefreshButton`, `SearchResultsBlock`, `UnavailableBlock`, `ValuationBlock` |
| `components/copilot/` | 7 + index | `Composer`, `ConversationThread`, `CopilotDock`, `CopilotProvider`, `OpenWorkspaceButton`, `RecentWorkspacesPanel`, `WorkspaceArea` 🟠 (últimos 3 son legacy) |
| `components/ds/` | 10 + index | `Alert`, `Avatar`, `Badge`, `Button`, `Card`, `ConfidenceBadge`, `Divider`, `Input`, `Spinner`, `ThemeSwitcher` |
| `components/entity/` | 4 + `base/` | `CompanyHeader`, `CompanyPageClient`, `EntitySectionWrapper`, `LockedSectionBlur` |
| `components/entity/base/` | **11** primitivos + `EntitySections` + `types.ts` + `index.ts` | Ver §3.4 |
| `components/home/` | 2 + script | `CopilotDemoMock`, `PublicFooter`, `copilot-demo-script.ts` |
| `components/journey/` | 5 | Onboarding chat-driven |
| `components/layout/` | 2 + index | `AuthHeader`, `OrgSwitcher` |

### 3.4 Entity Framework base — módulos canónicos implementados

`src/components/entity/base/`:

| # | Módulo canónico | Componente | Estado |
|---|---|---|---|
| 1 | Header | `EntityHeader.tsx` | ✅ |
| 2 | Hero | `EntityHero.tsx` | ✅ |
| 3 | KPIs | `EntityMetrics.tsx` | ✅ |
| 4 | Advisor | `EntityAdvisor.tsx` | ✅ |
| 5 | Insights | `EntityInsights.tsx` | ✅ |
| 6 | Análisis | `EntityAnalisis.tsx` | ✅ |
| 7 | Señales | `EntitySignals.tsx` | ✅ |
| 8 | Relaciones | `EntityRelations.tsx` | ✅ |
| 9 | **Oportunidades** | ❌ **no existe** `EntityOpportunities.tsx` | **FALTA** |
| 10 | Documentación | `EntityDocuments.tsx` | ✅ |
| 11 | Actividad | `EntityActivity.tsx` | ✅ |
| 12 | Acciones | `EntityActions.tsx` | ✅ |
| — | Orquestador | `EntitySections.tsx` | ✅ |
| — | Tipos compartidos | `types.ts` (12 EntityTypeId · 12 EntityModuleId · 7 EntityModuleState · orden canónico) | ✅ |

**Único consumidor real**: `CompanyHeader.tsx` (refactorizado en E1.5.6) y `CompanyPageClient.tsx` (compone 8 secciones: resumen, identidad, financieros, score, comparables, valuation, analisis, actions). Las 5 entidades restantes (`sector`, `territory`, `valuation`, `opportunity`, `operation`) no tienen páginas ni servicios backend.

### 3.5 Librerías internas (`src/lib/`)

| Submódulo | Archivos | Rol |
|---|---|---|
| `api/` | `client.ts`, `types.ts` (+ tests) | Cliente fetch tipado de los 48 endpoints |
| `companies/` | `types.ts` | DTOs cliente para `/api/companies/*` |
| `journey/` | `data.ts`, `derive.ts` (+ test) | Onboarding |
| `orchestrator/` | `index.ts`, `next-best-actions.ts`, `route-intent.ts`, `types.ts` (+ tests) | Detección de intent cliente (mirror del backend `intent_router.py`) |
| `workspaces/` | `types.ts`, `useActiveOrg.ts` | Estado activeOrg + tipos workspace |
| raíz | `cn.ts`, `contrast.ts`, `format.ts`, `notify.ts`, `search-neutral.ts`, `theme.ts`, `tokens.ts`, `validators.ts` | Utilidades |

### 3.6 Estado de tests Vitest

```
 Test Files  21 passed (21)
      Tests  152 passed (152)
```

Cobertura especialmente densa en: `entity-framework.test.tsx` (10), `blocks.test.tsx` (15), `design-system-primitives.test.tsx` (11), `workspace-area.test.tsx` (11), `copilot-dock.test.tsx` (3 E2E), `company-page-client.test.tsx` (6 incl. CustomEvent flow).

### 3.7 Patrón de comunicación Copilot ⇄ Ficha

`CopilotProvider` (chat) → `POST /api/companies/{cif}/messages` → respuesta con `section_updates` → `dispatchEvent(new CustomEvent('arroba:company-section-update', { detail: { cif, section_updates } }))` → `CompanyPageClient` aplica `applySectionUpdates()`.

**Esto es el único copilot especializado vivo** — `Company Advisor` (`backend/src/modules/companies/advisor.py`). Cumple sólo el **Nivel 1** del modelo agéntico de 4 niveles.

---

## 4. Stack & dependencias

### 4.1 Backend (`/app/backend/requirements.txt`)

```
fastapi==0.115.12
uvicorn==0.32.1
pydantic==2.12.5
pydantic-settings==2.6.1
email-validator==2.3.0
python-dotenv==1.2.1
motor==3.6.0
pymongo==4.9.2
PyJWT==2.9.0
passlib==1.7.4
bcrypt==4.1.3
python-multipart==0.0.22
httpx==0.28.1
structlog==24.4.0
stripe==14.4.0           # SDK presente, sin uso real (sólo health stub)
pytest==8.3.3
pytest-asyncio==0.24.0
mongomock-motor==0.0.34
asgi-lifespan==2.1.0
ruff==0.7.4
```

Plus: `emergentintegrations` importado dinámicamente en `claude_provider.py` (no en requirements.txt — gestionado por el entorno Emergent).

### 4.2 Frontend (`/app/frontend/package.json`)

**Dependencias de runtime**:
```
clsx 2.1.1
lucide-react 0.577.0
next 14.2.35
next-intl 3.26.5
react 18.3.1
react-dom 18.3.1
swr ^2.4.2
tailwind-merge 3.6.0
```

**Dev**: `vitest 2.1.9`, `@testing-library/react 16.3.0`, `tailwindcss 3.4.17`, `typescript 5.7.3`, `jsdom 25.0.1`, `eslint 8.57.1`, `prettier 3.4.2`, `@vitejs/plugin-react 4.7.0`.

Package manager: `yarn 1.22.22`.

### 4.3 Observaciones de stack

- **No hay** Zustand/Redux/Jotai → estado global mínimo (Context `auth-context.tsx` + `useActiveOrg` + CustomEvents).
- **No hay** form library (RHF/Formik) → forms manuales con validadores en `lib/validators.ts`.
- **No hay** UI kit shadcn/Radix instalado — el DS propio (`components/ds/`) cubre los primitivos.
- **No hay** librería de animación (Framer Motion ausente) — transiciones CSS-only por tokens.
- **No hay** WebSocket/SSE → la actualización en vivo de la ficha es via response + CustomEvent, no streaming.

---

## 5. Mapeo hacia ARROBA Matching v1.0 — Transaction Operating System

### 5.1 Matriz de 14 bloques funcionales (a–n)

Convención: cobertura % es estimación bruta basada en (presencia de modelo backend + endpoint + componente frontend + spec doc). REUTILIZABLE = se aprovecha lo actual; ADAPTAR = exige cambio significativo; NUEVO = construir desde cero.

| Bloque | Cobertura % | Evidencia actual | Gap | Veredicto |
|---|---:|---|---|---|
| **a. Identidad / Roles** | 55 % | `Role` enum (6 valores), `OrgRole` (3), `MembershipStatus`, JWT + cookies (`test_cookies_https.py`), Onboarding chat-driven, 5 endpoints `/auth`, 5 `/organizations` | Sin segmentación por **plan** (subscriber vs corporate vs investor vs advisor); sin enforcement de permisos por rol; sin KYC; sin verificación de empresa | **ADAPTAR** |
| **b. Pricing / Billing** | 5 % | `/api/billing/health` stub. Stripe SDK 14.4 instalado, `stripe_api_key` + `stripe_webhook_secret` en `Settings` (vacíos por defecto) | Sin productos, sin price IDs, sin checkout, sin webhook handler, sin métricas de uso/cuota, sin upgrade flow UI, sin SUBSCRIPTION_SPEC | **NUEVO** |
| **c. Seller Workspace** | 10 % | `workspaces` module (583 LOC) + `/w/{id}` page + Block Library (15 blocks) → puede actuar como "workspace de venta" si se especializa | No hay UI ni modelo dedicado a "preparación de venta" (teaser draft, comparables curados, valoración auditada). El módulo workspaces actual es genérico chat-first y es **legacy** según ARROBA_PHILOSOPHY v3.0 | **ADAPTAR** (sobre Entity Framework) |
| **d. Buyer Qualification** | 0 % | Ninguna evidencia en código. Sin `BuyerProfile`, sin formulario, sin scoring, sin endpoint | Todo. Tesis de inversión, ticket size, sectores objetivo, geografías, exclusiones, prueba de fondos | **NUEVO** |
| **e. Marketplace / Matching** | 0 % | `recommend` skill produce "empresas similares" (info, no matching real) | Motor de match entre `Opportunity` y `BuyerProfile`. Sin colección, sin endpoint, sin UI, sin spec | **NUEVO** |
| **f. NDA progresivo** | 0 % | Sólo menciones textuales en docs (`ARROBA_PHILOSOPHY.md` §6) | Modelo NDA, plantillas, firma, escalado progresivo (NDA básico → revealed teaser → NDA completo → IM), evento de auditoría | **NUEVO** |
| **g. Data Room** | 0 % | Ninguna evidencia. `EntityDocuments.tsx` es un componente vacío de presentación | Storage de archivos (S3-like), permisos por fase, watermarks, audit log, índices por categoría (financials, legal, contracts) | **NUEVO** |
| **h. LOI / Exclusividad** | 0 % | Mención textual en `ENTITY_FRAMEWORK.md` "Documentación por fase: LOI" | Modelo LOI, IOI vs LOI, exclusividad temporal, comparator de LOIs en multi-bidder | **NUEVO** |
| **i. Deal Workspace** | 5 % | `workspaces` module existe (genérico) | Especialización por fase de operación (Teaser → NDA → IM → IOI → LOI → DD → Negociación → SPA → Cierre). Sin máquina de estados, sin pageclient `/operacion/{id}` | **NUEVO** (puede reusar primitivos Entity) |
| **j. Reputación / Señales** | 15 % | `EntitySignals.tsx` (presentacional), `companies/refresh-analysis` endpoint, `company_analysis_refreshes` collection. Hay un campo `score` declarado en `CompanyHeaderInfo` | Sin algoritmo real de señales, sin streaming de eventos, sin reputación de buyers/sellers/advisors. Score actual viene del Agency Tool mock | **ADAPTAR** |
| **k. Finder Fee / Closing** | 0 % | Ninguna evidencia en código ni docs (sólo mención en PRD §1.5-REWORK como "fuera de scope") | Modelo FeeAgreement, captura del fee al cierre (Stripe), revenue share advisor/plataforma, reporting | **NUEVO** |
| **l. CIS (Contrato Inicial de Servicios)** | 0 % | 2 menciones en CHANGELOG (legacy, pre-Filosofía v3.0). Sin modelo, sin endpoint, sin spec | Modelo Contract, flujo de firma, asociación a Organization, condiciones por plan | **NUEVO** |
| **m. Capa Agéntica** (4 niveles) | 20 % | Ver §5.2 — Nivel 1 cubierto en `company` únicamente; Nivel 2 con 4/~20 capacidades; Nivel 3/4 inexistentes | Falta extender Nivel 1 a 4 entidades más, completar 16 capacidades de Nivel 2, diseñar UX de Nivel 3, implementar runner de Nivel 4 | **ADAPTAR + NUEVO** |
| **n. Advisor Layer** | 5 % | `Role.advisor` declarado. `companies/advisor.py` es un "Company Advisor" (copilot interno), **no** un módulo para asesores humanos | Sin panel advisor, sin mandatos, sin asignación buyer↔advisor, sin pipeline visible al advisor, sin revenue share UI | **NUEVO** |

**Cobertura ponderada bruta hacia v1.0**: ≈ **18 %** (suma simple de %, dividida entre 14). Mayoría son NUEVO.

### 5.2 Capa Agéntica — desagregada

#### 5.2.1 Cobertura por nivel

| Nivel | Definición | Cobertura % | Evidencia | Gap |
|---|---|---:|---|---|
| **Nivel 1**: Copilot contextual por entidad | El copilot conoce de qué entidad estás hablando y actualiza su ficha | **20 %** (1 de 5 entidades núcleo) | `Company Advisor` vivo: `POST /api/companies/{cif}/messages` → `section_updates` → `CustomEvent('arroba:company-section-update')`. 28 tests Vitest específicos del flujo en `copilot-provider-entity.test.tsx` + `company-page-client.test.tsx`. Backend test `test_companies_advisor.py` cubre fallback determinista | Falta para Sector, Territorio, Valoración, Oportunidad, Transacción |
| **Nivel 2**: Preparación inteligente de acciones (~20 capacidades) | Borrador de outputs revisables por humano | **20 %** (4 de ~20) | Capacidades cubiertas: `analyze` (análisis empresa con narrative), `value` (valoración indicativa determinista), `recommend` (similares + por sector), `comparables` (vía `companies/skills/comparables`). | Faltan: **screenings avanzados**, **teasers**, **Information Memorandum (IM) draft**, **LOI draft**, **earn-out clauses**, **riesgos sectoriales**, **análisis de Data Room**, **resúmenes ejecutivos**, **clasificación de docs**, **DD questions auto**, **comparación de contratos**, **checklists de cierre**, **integración post-deal**, **valoraciones avanzadas (DCF, múltiplos personalizados)**, **screening por buyer profile**, **IOI draft** |
| **Nivel 3**: Ejecución asistida con confirmación explícita | El agente propone acciones y, tras "Confirmar", las ejecuta vía API | **0 %** | Ninguna evidencia. `SuggestedAction` enum existe en `companies/models.py` pero sólo se renderiza como sugerencia, no como acción ejecutable con confirmación | Diseñar UX de confirmación, modelo `AgenticAction`, audit trail, idempotencia |
| **Nivel 4**: Automatizaciones previamente autorizadas y trazables | Tareas recurrentes ejecutadas sin intervención (con autorización previa) | **0 %** | Ninguna evidencia. No hay scheduler, no hay workflow engine, no hay `automation_grants` | Engine de jobs (Celery / APScheduler), modelo de autorizaciones, trazabilidad por hash, kill-switch |

#### 5.2.2 Cobertura por copilot especializado

| Copilot especializado | Cobertura % | Evidencia | Gap |
|---|---:|---|---|
| **Company Copilot** | **70 %** | `companies/advisor.py` (clase `CompanyAdvisor`, fallback determinista, timeout 12s + 1 retry, JSON estricto, tests). 32 modelos copilot dedicados, integración Claude Sonnet 4.6 | Memoria larga (más allá de la conversación), compartir contexto con otros copilots, ToolUse |
| **Market Copilot** (Sector + Territorio) | **5 %** | Skill `recommend` puede dar listado por sector. No hay copilot contextual sobre `/sector/{slug}` ni `/territorio/{slug}` (esas páginas no existen) | Todo: páginas, copilot dedicado, ingesta de señales sectoriales, memoria sectorial |
| **Valuation Copilot** | **5 %** | Skill `value` (determinista, sin LLM). No es copilot conversacional. No tiene página `/valoracion/{id}` | Copilot conversacional, persistencia de valoraciones por ID, comparación entre escenarios, audit trail |
| **Transaction Copilot** | **0 %** | Inexistente. No hay módulo `transaction`, `operation`, `deal` en backend ni frontend | Todo |
| **Advisor Copilot** | **0 %** | Inexistente. Confusión nominal: `companies/advisor.py` es "Company Advisor" interno, no un copilot para asesores humanos | Todo (panel advisor, asignación, pipeline, revenue) |

**Concepto compartido pendiente**: una capa común de **memoria** y **contexto** que enlace los 5 copilots (hoy `Company Advisor` tiene memoria propia en `company_conversations` + `company_conversation_messages`, sin federación con otros copilots).

### 5.3 Hitos del orden oficial (`ARROBA_PHILOSOPHY.md` §10) vs estado

| Etapa | Entidad | Estado |
|---|---|---|
| E1.5-REWORK | Empresa | ✅ Cerrada 2026-06-24 |
| E1.5.5 | Brand Refresh + DS | ✅ Cerrada 2026-06-24 |
| E1.5.6 | Consolidación + Entity Framework | ✅ Cerrada 2026-06-24 |
| **E1.6** | **Sector** | 🔵 Planificada — 0 código |
| **E1.7** | **Territorio** | 🔵 Planificada — 0 código |
| **E1.8** | **Valoración** | 🔵 Planificada — 0 código |
| **E1.9** | **Oportunidad** | 🔵 Planificada — 0 código (y módulo Entity #9 también falta) |
| **E2.0** | **Transacción** (Transaction OS completo) | 🔵 Planificada — 0 código |

---

## 6. Zonas a depreciar / legacy

> **No tocar hoy** — sólo identificación. Documento sólo de lectura.

### 6.1 Backend

| Recurso | LOC | Razón | Acción futura |
|---|---:|---|---|
| `src/modules/workspaces/router.py` (7 endpoints) | 99 | Patrón "workspace persistente con bloques" del modelo Copilot→Skill→Workspace que ARROBA_PHILOSOPHY v3.0 derroga (§1) | Mantener como capa de memoria subordinada; renombrar conceptualmente a `WorkspaceMemory` ó depreciar en favor de `EntityMemory` cuando E1.6→E2.0 esté implementado |
| `src/modules/workspaces/service.py` | 583 | Idem | Idem |
| `src/modules/workspaces/models.py` | 192 | 15 modelos para `Workspace`, `WorkspaceBlock`, `WorkspaceMessage` | Idem |
| Colecciones `workspaces`, `workspace_blocks`, `workspace_messages` | — | Datos persistidos del modelo legacy | Migración o coexistencia con `entity_memories` |

### 6.2 Frontend

| Recurso | Razón |
|---|---|
| `src/app/[locale]/(authenticated)/w/[workspace_id]/page.tsx` | Página workspace-first |
| `src/app/[locale]/(authenticated)/historial/page.tsx` | Listado de workspaces persistidos con filtros por skill (`analyze`/`value`/`recommend`/`search`/`mixed`) — anclado al modelo legacy |
| `src/components/copilot/WorkspaceArea.tsx` | Renderiza bloques del workspace en formato chat-first |
| `src/components/copilot/RecentWorkspacesPanel.tsx` | Panel lateral de workspaces recientes |
| `src/components/copilot/OpenWorkspaceButton.tsx` | Botón "Abrir en workspace" que promueve el dock efímero a workspace persistente |

**Nota**: estos componentes tienen tests pasando (11 en `workspace-area.test.tsx`, 3 en `open-workspace-button.test.tsx`, 3 en `copilot-dock.test.tsx`). Borrarlos requiere migrar el patrón "memoria persistente" al Entity Framework primero.

### 6.3 Documentación

| Recurso | Razón |
|---|---|
| `ROADMAP.md` | Habla de `DealOrchestratedView`, `SellerWizard.js`, "marketplace legacy", "infomemo PDF", "Buyer Activity Panel", "LOI Comparator" — **nada de eso existe en `/app`**. Predata la Filosofía v3.0 (2026-04-30 vs 2026-06-24) |
| Bloques del `CHANGELOG.md` con fechas Mar-Abr 2026 (líneas 49-73) | Mencionan features (Seller Company Workspace, Cards marketplace con orquestador, Buyer Dashboard Premium, NDA Mutuo Digital, Planes V2, Valoración Pública) que no existen en el código actual |

---

## 7. Lagunas documentales (recapitulación priorizada)

Cruzando §1.3 con la matriz §5.1:

### P0 — Bloqueadoras para arrancar Matching v1.0

1. **`AGENTIC_LAYERS_SPEC.md`** — 4 niveles agénticos (contextual / preparación / ejecución / automatización) con criterios de aceptación por nivel.
2. **`COPILOTS_SPEC.md`** — 5 copilots especializados (Company / Market / Valuation / Transaction / Advisor) + capa compartida de memoria y contexto. Define el catálogo de las ~20 capacidades de Nivel 2 y a qué copilot pertenece cada una.
3. **`SUBSCRIPTION_SPEC.md`** — planes por rol (subscriber, corporate, investor, advisor) con cuotas de uso agéntico (mensajes, valoraciones, screenings) y límites de Nivel 2/3/4 por plan.
4. **`NDA_SPEC.md`** — NDA progresivo: estructura, plantillas, transiciones de fase, firma, auditoría.
5. **`FINDER_FEE_SPEC.md`** — comisión de cierre: cálculo, captura (Stripe), revenue share advisor/plataforma, reporting.
6. **`CIS_SPEC.md`** — Contrato Inicial de Servicios: qué firma cada parte, vinculación a Organization, validez por plan.

### P1 — Necesarias para fases concretas del proceso

7. `MARKETPLACE_SPEC.md` — matching engine entre `Opportunity` y `BuyerProfile`.
8. `DATAROOM_SPEC.md` — estructura por fase, watermarks, permisos.
9. `LOI_SPEC.md` — IOI vs LOI, exclusividad, comparator multi-bidder.
10. `SIGNALS_SPEC.md` — qué se calcula, qué se publica, fuentes.
11. `BUYER_QUAL_SPEC.md` — calificación KYC + tesis.
12. `SELLER_WORKSPACE_SPEC.md` — pre-venta (teaser draft, valoración auditada, comparables curados).
13. `ADVISOR_LAYER_SPEC.md` — pipeline del advisor humano.

### P2 — Necesarias para sub-modelos avanzados

14. `DEAL_WORKSPACE_SPEC.md` — workspace contextual a una operación abierta.
15. `EARNOUT_SPEC.md` — cláusulas, fórmula, vesting.
16. **Specs de entidad faltantes en código**: `models.py` Pydantic para `sector`, `territory`, `valuation`, `opportunity`, `operation`, `mandate`, `client`, `document`, `person`, `advisor` (los 10 tipos declarados en `ENTITY_MODEL.md` que aún no existen como modelo backend).
17. Limpieza de `ROADMAP.md` para reflejar la realidad post-Filosofía v3.0.

---

## 8. Métricas globales (KPIs duros)

| KPI | Valor |
|---|---:|
| **Documentos canónicos** | 6 (PHILOSOPHY, ENTITY_MODEL, ENTITY_FRAMEWORK, DESIGN_SYSTEM, PRD, +test_credentials/CHANGELOG/ROADMAP operativos) |
| **Capas canónicas declaradas** | 6 |
| **Capas implementadas end-to-end** | 1 (Empresa) de 6 entidades núcleo (Empresa, Sector, Territorio, Valoración, Oportunidad, Transacción) |
| **Backend LOC (Python, `src/`)** | 7 670 |
| **Backend módulos** | 8 |
| **Backend endpoints** | 48 (todos `/api`) |
| **Backend modelos Pydantic** | 92 |
| **Backend tests** | 138 pass / 0 fail / 6 deselected |
| **Frontend LOC (TS+TSX, `src/`)** | 15 717 |
| **Frontend páginas** | 13 |
| **Frontend componentes** | 8 carpetas + `RequireAuth` |
| **Frontend componentes en Entity Framework base** | 11 / 12 (falta `EntityOpportunities`) |
| **Frontend tests** | **152 pass / 0 fail** (21 archivos) |
| **Colecciones MongoDB en uso** | 14 |
| **Colecciones mock declaradas** | 2 (`master_companies_mock`, `platform_stats_mock`) |
| **Adapters externos** | 1 (`MockEnrichCompanyAdapter` — real pendiente vía REQ-001) |
| **Roles de usuario declarados** | 6 (`anonymous`, `subscriber`, `corporate`, `investor`, `advisor`, `admin`) |
| **Roles con lógica de plan/cuota asociada** | 0 |
| **Niveles agénticos cubiertos** | 1 de 4 (Nivel 1 sólo en Company) |
| **Copilots especializados activos** | 1 de 5 (Company Copilot) |
| **Capacidades de Nivel 2 cubiertas** | 4 de ~20 estimadas (analyze, value, recommend, comparables) |
| **Bloques v1.0 (a-n) con cobertura > 50 %** | 2 de 14 (a-Identidad/Roles 55 %, m-Capa Agéntica 20 %; el resto < 15 %) |
| **Bloques v1.0 con cobertura = 0 %** | 8 de 14 (d, e, f, g, h, k, l, parte de n) |
| **Cobertura bruta hacia v1.0** | **≈ 18 %** |

---

## Anexo — Cómo se midió

| Métrica | Comando |
|---|---|
| LOC | `find <path> -name "*.py"/"*.ts*" \| xargs wc -l` |
| Endpoints | `grep -rEh "@(router\|app)\.(get\|post\|put\|patch\|delete)\(" /app/backend/src` |
| Tests backend | `cd /app/backend && python -m pytest -q` |
| Tests frontend | `cd /app/frontend && yarn test` |
| Colecciones Mongo | `grep -rEho 'db\.[a-z_]+' /app/backend/src` |
| Modelos Pydantic | `grep -nE "^class " <modelo>.py` |
| Estado de docs | `wc -l && stat -c%y` sobre `/app/memory/*.md` |

**Nota**: las cifras de cobertura % son estimaciones expertas basadas en presencia de (modelo backend + endpoint + componente frontend + spec canónica) y deben tratarse como **órdenes de magnitud para planificar**, no como SLAs.

> Fin del inventario. — Generado en modo sólo lectura, sin modificar código del producto.
