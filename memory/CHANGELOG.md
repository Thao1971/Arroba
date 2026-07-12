# CHANGELOG — ARROBA Platform

## 🏗 06 Jul 2026 · SPRINT F0.1 · Header + Perfil de la Ficha de Empresa — ENTREGADO

Primera implementación en código bajo la nueva SoT (Sprint F0). Header canónico (6 componentes) + Perfil (6 COMP-P provisionales) montados en la ruta `/[locale]/empresa-f01/[cif]`.

### Reglas y decisiones aplicadas (2026-07-06)
- **Paso 0** · `CanonicalEntityMockupClient.tsx` movido a `/app/_legacy/frontend/canonical_entity_mockup/` (R13). Guard R13 extendido con patrón `CanonicalEntityMockup`. Tabla 2 de `CANONICAL_SCREENS.md` actualizada (L9).
- **Orden global (opción C · híbrido)**: READY primero, BLOCKED como `UnavailableBlock` con COMP-ID declarado.
- **Perfil con COMP-P provisionales** (`COMP-P-0001..0006`) tras la contradicción C2. Registro autoritativo en `sources/empresa_v1/PROVISIONAL_COMPONENTS.md`.
- **C14.5 (acciones sensibles)**: renderizadas visibles + deshabilitadas + Tooltip "Disponible próximamente". Sin handlers.
- **C14.2 (créditos)**: no se consume ninguno en F0.1. Espacio reservado sin contenido.

### Backend
- `interfaces/master.py`: `MasterRecord` ampliado con 13 campos opcionales V2 (`activity`, `activity_status`, `mercantile_status`, `record_status`, `legal_form`, `incorporation_date`, `is_listed`, `listed_market`, `sectors[]`, `description`, `address`, `autonomous_community`, `data_coverage`).
- `interfaces/canonical_ui.py`: `IdentitySection` ampliada + `IdentityRegistryStatus` nuevo.
- `canonical_ui_adapter.py`: `to_identity_section` propaga toda la superficie V2.
- `providers/agency_tool/company_intelligence_v2.py` **NUEVO**: `AgencyToolCompanyIntelligenceV2Provider` que consume `POST /api/v2/company-intelligence/identity`. R12/P3 verificado.
- `router.py`: wrapper `_CompanyIntelligenceV2WithFallback` (V2 → fallback IdentityResolver clásico) tras flag `intelligence_company_v2_enabled` (default `False`).
- `providers/mock/master.py`: mock enriquecido con `v2_identity` opcional.
- `scripts/seed_master_companies_e14.py`: `mc_olmedo` poblado con `v2_identity` derivado del ZIP (`Grupo Olmedo Hoteles`).

### Frontend (12 componentes React con `@componentId`)
Ruta: `/app/frontend/src/components/company/{header,perfil}/`.

| COMP-ID | Componente | Estado |
|---|---|---|
| COMP-1001 | `header/CompanyIdentity.tsx` | READY |
| COMP-1002 | `header/CompanyContext.tsx` | READY |
| COMP-1003 | `header/CompanyPublicStatus.tsx` | READY |
| COMP-1004 | `header/CompanyQuickActions.tsx` | READY (visual · botones deshabilitados) |
| COMP-1005 | `header/ExecutiveSnapshot.tsx` | READY (degrada a UnavailableBlock sin financials) |
| COMP-1010 | `header/UserRelationship.tsx` | BLOCKED · stub UnavailableBlock |
| COMP-P-0001 | `perfil/CompanyAiSummary.tsx` | PROVISIONAL · READY |
| COMP-P-0002 | `perfil/FinancialEvolutionTeaser.tsx` | PROVISIONAL · READY |
| COMP-P-0003 | `perfil/PrimaryKpisGrid.tsx` | PROVISIONAL · READY |
| COMP-P-0004 | `perfil/PositioningKpisGrid.tsx` | PROVISIONAL · BLOCKED |
| COMP-P-0005 | `perfil/IdentityFieldsGrid.tsx` | PROVISIONAL · READY |
| COMP-P-0006 | `perfil/IntelligenceScoresRing.tsx` | PROVISIONAL · BLOCKED |

Contenedores de layout (sin COMP-ID · exentos R14):
- `header/CompanyHeader.tsx`
- `perfil/CompanyPerfil.tsx`
- `CompanyFichaF01Client.tsx`

Página: `/app/frontend/src/app/[locale]/(authenticated)/empresa-f01/[cif]/page.tsx`.

### Tests · Guards
- Guard **R14** nuevo: `__tests__/r14_comp_id_declaration_guard.test.ts` — 2 tests. Verifica presencia y unicidad de `@componentId` en `components/company/**`.
- Guard **R13** actualizado con patrón `CanonicalEntityMockup`.
- Pytest **250/250** verde (sin regresiones + los tests R12/R13 previos).
- Vitest **180/180** verde (177 previos + 2 R14 + 1 emergente).

### Entregables
- `sources/empresa_v1/F0_1_SCREENSHOTS/` · 14 capturas (composites + Header full + Perfil full + 12 individuales por COMP).
- `sources/empresa_v1/F0_1_VISUAL_COMPARISON.md` · comparativa side-by-side ZIP ↔ implementación.
- `sources/empresa_v1/PROVISIONAL_COMPONENTS.md` · registro autoritativo de COMP-P.

### Componentes pendientes por dependencia contractual (para promoción futura)
- **COMP-1010** User Relationship — data interna arroba (following/alerts/watchlists) sin backend.
- **COMP-P-0004** Positioning KPIs — Ranking Engine + Innovation Signal ausentes V2 (C13).
- **COMP-P-0006** Intelligence Scores — Scores Engine no expuesto V2.

---


## 🎯 06 Jul 2026 · SPRINT F0 · Ingesta canónica de la nueva SoT de la Ficha de Empresa

- SPRINT F0 · Ingesta canónica de la nueva SoT de la Ficha de Empresa: ZIP visual, ACC v0.1 (66 componentes), Agency Tool V2 (54 endpoints), integration guide V2. Deprecados: ARROBA_UI_VISUAL_REFERENCES.md, AGENCY_TOOL_CONTRACT_v1.md, ARROBA_INTEGRATION_PACK_v1.md, ARROBA_B6F_DESIGN_PROPOSAL_v1.md, ARROBA_CONSUMER_INTEGRATION_PLAN_v1.md (mantenidos como legacy con banner). Añadida regla R14 (Un COMP = un componente React). CanonicalEntityMockupClient.tsx marcado como legacy pendiente de movimiento en F0.1.

---

## 📚 06 Jul 2026 · CANON — Consolidación documental

- CANON · Consolidación documental: creados ARROBA_CANON.md (puerta única) y ARROBA_ARCHITECTURAL_PRINCIPLES.md (SoT de principios y reglas). Archivado ROADMAP.md → _legacy/memory/. Marcado canonical_pack_v1.0/ como snapshot histórico. Añadido banner de referencia canónica a docs afectados. Sin cambios en código.

---

## 🚀 06 Jul 2026 · B.6.c · Semantic Engine (backend) — COMPLETADA

Tercera sub-fase del roadmap: `semantic-intelligence` en producción real. Sigue el mismo patrón que Financial (R12, X-API-Key, cache, breaker, métricas). Backend puro (R11 no aplica).

### Endpoints públicos consumidos (X-API-Key · R12)
- `POST /api/v1/semantic-intelligence/profile`
- `POST /api/v1/semantic-intelligence/similar`
- `POST /api/v1/semantic-intelligence/search`
- `GET /api/v1/semantic-intelligence/profile/schema`
- `GET /api/v1/semantic-intelligence/catalog`

### Nuevos artefactos backend
- `interfaces/semantic.py` — DTOs `SemanticProfile`, `SimilarCompanies`, `SemanticSearchResponse`, `SemanticSchema`, `SemanticCatalog` + `SemanticProvider` ABC.
- `providers/agency_tool/semantic.py` — `AgencyToolSemanticProvider` con emisión `engine_version="arroba-semantic-v1"` (R5).
- `providers/mock/semantic.py` — mock canónico (profile/similar → NotFound · search 200 vacío · schema/catalog estables).
- `router.py` — 5 métodos nuevos: `get_semantic_profile`, `get_semantic_similar`, `semantic_search`, `get_semantic_schema`, `get_semantic_catalog`.

### Endpoints REST arroba (contrato interno frozen)
- `GET /api/companies/{cif}/profile` · auth required
- `GET /api/companies/{cif}/similar?limit=N` · auth required
- `POST /api/entities/semantic-search` · auth required (sustituirá al legacy `/api/entities/lookup` en B.6.f)
- `GET /api/intelligence/semantic-schema` · cache 24h
- `GET /api/intelligence/semantic-catalog` · cache 24h

### Testing
- 23 nuevos tests unit + endpoints (`test_semantic.py`, `test_semantic_endpoints.py`).
- **239/239 pytest** total (216 previos + 23 nuevos).
- R12 permanente: 10/10 tests verdes.
- Single-flight: 3 requests concurrentes al mismo search → 1 sola llamada al proveedor (verificado).

### Smoke E2E real
```
POST /api/entities/semantic-search {"query":"hotel","limit":5}
  → 200 · count=0 · backend=local-topk-v1 · engine_version=arroba-semantic-v1 · sin leak
GET /api/companies/B47820150/profile           → 404 profile_not_found (Master Layer vacío)
GET /api/companies/B47820150/similar?limit=5   → 404 similar_not_found
GET /api/intelligence/semantic-schema          → 200 · engine_version=arroba-semantic-v1
GET /api/intelligence/semantic-catalog         → 200 · engine_version=arroba-semantic-v1
```

### Métricas Prometheus activas
- `intelligence_layer_requests_total{engine="semantic", method="profile|similar|search|schema|catalog", ...}`
- Cache hits/misses por capa memory/mongo
- Circuit breaker state = closed (0.0)

---

## 🚀 06 Jul 2026 · B.6.b · Financial Engine (backend) — COMPLETADA

Segunda sub-fase del roadmap Agency Tool: `financial-intelligence` en producción real.

### Endpoints públicos consumidos (X-API-Key · R12)
- `POST /api/v1/financial-intelligence/analyze`
- `POST /api/v1/financial-intelligence/valuation`
- `GET /api/v1/financial-intelligence/ratios/catalog`

### Nuevos artefactos backend
- `interfaces/financial.py` — DTOs Pydantic `FinancialAnalysis`, `Valuation`, `RatiosCatalog`, `ComparablePeer` (schema pack §6.2/§6.3 completo).
- `providers/agency_tool/financial.py` — `AgencyToolFinancialProvider` con emisión `engine_version="arroba-financial-v1"` (R5).
- `providers/mock/financial.py` — mock que devuelve `NotFound` o catálogo canónico mínimo (R4).
- `router.py` — 3 métodos nuevos: `get_financial_analysis(cif)`, `get_valuation(cif)`, `get_ratios_catalog()`.
- 3 endpoints REST: `GET /api/companies/{cif}/financial-analysis`, `GET /api/companies/{cif}/valuation`, `GET /api/intelligence/ratios/catalog`.

### Contrato interno decoupled (R5)
- `engine_version="arroba-financial-v1"` en todas las respuestas. El nombre del proveedor (`financial-intelligence-v1`) **jamás** llega al frontend (verificado en tests).

### Testing
- 19 nuevos tests unit + endpoints (`test_financial.py`, `test_financial_endpoints.py`).
- **216/216 pytest** total (197 previos + 19 nuevos).
- R12 sigue en verde (10/10 tests de regresión permanente).

### Smoke E2E real
```
/api/companies/B47820150/financial-analysis  → 404 financial_not_found (Master Layer vacío)
/api/companies/B47820150/valuation           → 404 valuation_not_found
/api/intelligence/ratios/catalog             → 200 · 13 ratios canónicos · engine_version=arroba-financial-v1
```

---

## 🔒 06 Jul 2026 · R12 · arroba nunca consume `/api/v1/master/*` (canónica permanente)

### Regla operativa
- Los 4 endpoints `/api/v1/master/*` (auth JWT admin, fuera del snapshot público) **jamás** son invocados por arroba.
- Toda integración se realiza contra el contrato público `arroba.v1` con `X-API-Key`.
- Resolución de identidad vía `IdentityResolver` que compone `financial-intelligence/analyze` + `semantic-intelligence/search`.
- Guard runtime en `AgencyToolClient.request()` bloquea físicamente cualquier request a `/master/*`.
- Test de regresión permanente `test_r12_regression.py` con allowlist explícita.

### Refactor código
- Eliminado `providers/agency_tool/master.py` (llamaba a `GET /master/{id}`).
- Nuevo `providers/agency_tool/identity.py` con `AgencyToolIdentityResolver`.
- 10 tests de regresión R12 (grep estático + guard runtime + comportamiento del resolver).

### Flip a `AGENCY_TOOL_MODE=real`
- Smoke test v2 aprobado (health 200 + financial/analyze 404 canónico + semantic/search 200).
- Latencias < 200ms. Zero 429/500. Zero 401/403.
- E2E post-flip: `/api/companies/B47820150/identity` → `404 master_not_found` canónico (Master Layer vacío en prod).
- Métricas registran `provider="agency_tool"` correctamente.

### Actualizaciones documentales
- `ARROBA_INTEGRATION_PACK_v1.md` v1.1 → nueva §0 "Principios de consumo desde arroba.com".
- `ARROBA_CONSUMER_INTEGRATION_PLAN_v1.md` v1.5 → §0.2 (R12) + §3.1 refactor + §7.10 (Master Layer vacío) + AC B.6.a actualizados.

---

## 🏗️ 06 Jul 2026 — Fase B.6.a · Scaffolding `intelligence_layer` (backend puro, sin llamadas HTTP reales)

Andamiaje multi-proveedor sobre motores externos. Reemplaza el `agency_tool_adapter` monolítico por una capa desacoplada con abstract interfaces + providers concretos + caché + circuit breaker + métricas Prometheus. **`agency_tool_adapter` sigue vivo** (deprecación calendarizada en B.6.j).

### Regla canónica añadida — R11 (Gobernanza del Frontend · Aprobación Visual Previa)
- Ninguna implementación de UI comienza sin diseño aprobado por el usuario. Aplica desde B.6.b en adelante. Detalle: `ARROBA_CONSUMER_INTEGRATION_PLAN_v1.md` §10.

### 4 decisiones técnicas B.6.a (usuario 2026-07-07)
- Circuit breaker propio async (~90 líneas, sin `pybreaker`), 4 transiciones canónicas testeadas.
- Caché TTL 900s global + overrides por motor + error TTL 30s.
- Métricas Prometheus (`text/plain; version=0.0.4`).
- Slots API key `_PRIMARY` + `_SECONDARY` con fallback automático 401/403.

### Componentes creados (12 archivos backend + 4 archivos test)
- `src/modules/intelligence_layer/{config,observability,circuit_breaker,cache,router,endpoints}.py`
- `src/modules/intelligence_layer/interfaces/master.py` (DTO schema §6.1 + `MasterProvider` ABC)
- `src/modules/intelligence_layer/providers/mock/master.py` (traduce `master_companies_mock` → §6.1)
- `src/modules/intelligence_layer/providers/agency_tool/{client,master}.py` (scaffolding real, sin llamadas)
- `tests/intelligence_layer/{test_circuit_breaker,test_cache,test_router,test_identity_endpoint}.py` (30 tests)

### Endpoints nuevos
- `GET /api/companies/{cif}/identity` → schema §6.1 completo (auth requerida).
- `GET /api/internal/metrics` → 7 métricas canónicas (Counter/Histogram/Gauge).

### Métricas canónicas
- `intelligence_layer_requests_total{provider,engine,method,status}`
- `intelligence_layer_request_duration_seconds{provider,engine,method}` (histogram)
- `intelligence_layer_cache_hits_total{engine,layer}` · `_misses_total{engine,layer}`
- `intelligence_layer_circuit_breaker_state{provider,engine}` (0=closed, 1=half_open, 2=open)
- `intelligence_layer_errors_total{provider,engine,error_class}`
- `intelligence_layer_deduplication_hits_total{engine}`

### DB
- Nueva colección `intelligence_cache` (índice sobre `expires_at`, no-TTL nativo · expira runtime).

### Envs añadidas (`.env`)
- `AGENCY_TOOL_MODE=mock` (temporal, retirada en B.6.j)
- `AGENCY_TOOL_BASE_URL=https://agencias.wearebudadvisors.com`
- `ARROBA_SERVICE_API_KEY_PRIMARY=<recibida>` (nunca commiteada · `.env` gitignoreado)
- `ARROBA_SERVICE_API_KEY_SECONDARY=` (vacío intencionalmente)
- Circuit breaker + caché TTLs + metrics token (todos con defaults sensatos)

### Testing
- **30/30 nuevos** tests intelligence_layer verdes.
- **187/187** pytest total (157 previos + 30 nuevos, sin regresiones).
- Circuit breaker: verificadas las 4 transiciones + 1-probe-only en half_open + reset de contador.
- Caché: TTL, LRU, single-flight, error cache, TTL=0 (event-driven).
- Endpoint `/identity`: schema §6.1 completo, 404, auth requerida, cache hits.
- Auditoría de fugas de API key: 0 leaks en `/metrics` ni `/openapi.json`.

### Smoke test manual (backend real, modo mock)
```
GET /api/companies/B47820150/identity
→ 200 OK
→ X-Intelligence-Mode: mock · X-Provider: mock
→ Body: MasterRecord §6.1 (Grupo Olmedo Hoteles, S.L.)
→ Cache: 1 miss + N hits en memoria
```

### Bloqueadores externos
- Ninguno actualmente. La API key `_PRIMARY` está en `.env` local pero NO se usa (flag en `mock`).
- Smoke test controlado contra `agencias.wearebudadvisors.com` pendiente de arranque por orquestador.

---

## 🧊 25 Jun 2026 — v1.0-canonical-baseline (Sprint 0 + Sprint 0.5) — FROZEN

> **Canonical Baseline v1.0 congelada**. Sprint puramente documental: cero modificaciones en código de producto. Establece la capa 7 (*Engines & Specs*) y consolida el canon legacy con los specs del Sprint 0.

### Sprint 0 — Engines & Specs (6 specs canónicos en `/app/memory/specs/`)

- **`TRANSACTION_OS_SPEC.md` v1.2.0** — Sistema operativo de la transacción. 15 fases canónicas (`T1`…`T15`), estados, transiciones, journey M&A end-to-end.
- **`TRANSACTION_COPILOT_SPEC.md` v1.2.0** — Copilot orquestador. Contrato con OS, intents, herramientas, gobierno conversacional.
- **`COPILOTS_SPEC.md` v1.1.0** — Catálogo y contrato común de Copilots especializados por entidad.
- **`MEMORY_ENGINE_SPEC.md` v1.1.0** — Memoria: corto plazo, largo plazo, sintetización, hidratación, scopes.
- **`AGENTIC_LAYERS_SPEC.md` v1.1.0** — Capas agénticas (perception → reasoning → action → reflection), gobernanza, límites de autonomía.
- **`MONETIZATION_SPEC.md` v1.1.0** — Modelo de negocio: planes, gating funcional, fricciones de upgrade, métricas.

### Sprint 0.5 Ciclo A — Auditoría documental

- **`specs/CANON_AUDIT_REPORT.md`** — Inventario de contradicciones (15 originales canon ↔ legacy) e inconsistencias intra-spec.
- **`specs/OPEN_ITEMS_CLASSIFICATION.md`** — 4 grupos: G1 autocerrables · G2 decisiones canónicas pendientes · G3 input humano necesario · G4 backlog estratégico.

### Sprint 0.5 Ciclo B — Propagación + ensamblaje

**Decisiones canónicas confirmadas y propagadas**:
- **Match pasa a ser una entidad canónica de primer nivel** (decisión G2.M). Materializa el resultado del motor de matching con identidad propia, ciclo de vida observable (`detected → reviewed → contacted → engaged → converted_to_operation | discarded`), score y trazabilidad bidireccional. Ver `ENTITY_MODEL.md` §5.7 y `ENTITY_FRAMEWORK.md` §11.13.
- **Renombre `client → user`**: actor humano del producto, aplicado en todo el canon.
- **Renombre `team_arroba → arroba_team`**: nomenclatura interna del equipo, aplicado.
- **Fases del journey**: numeradas `T1`…`T15` (`TRANSACTION_OS_SPEC.md` §3).
- **Fases de `Operation.current_phase`**: orden canónico `nda → im → qa → loi → dd → negotiation → spa → closing → integration` (G2.O resuelto).
- **Catálogo abstraído**: el conjunto de tipos del producto se enumera y evoluciona por declaración, no por cardinalidad.
- **Capa 7 — Engines & Specs**: incorporada formalmente en `ARROBA_PHILOSOPHY.md` §13 entre *Entity Framework* y *Design System*.

**Documentos legacy actualizados**:
- `ARROBA_PHILOSOPHY.md` — §6, §7, §13 reconciliados; §13 ampliada a 7 capas; catálogo abstraído.
- `ENTITY_MODEL.md` v1.1.0 — `client → user`; `match` añadido como entidad canónica de primer nivel (§5.7); catálogo abstraído.
- `ENTITY_FRAMEWORK.md` v1.1.0 — `match` con anatomía propia (§11.13); §11.8 Operación con fases canónicas; catálogo abstraído.
- `PRD.md` — sección **🧊 CANONICAL BASELINE v1.0** añadida al inicio; cardinalidad eliminada del cuerpo.

**Nuevos documentos canónicos**:
- `CANON_INDEX.md` — Índice maestro navegable del canon completo.
- `ENGINE_ARCHITECTURE.md` — Cadena de inteligencia: Fuentes → Data Layer → KG → Embeddings → Signal → Matching → Recommendation → Valuation → Risk → Transaction → Copilots → UX.
- `SPRINT0_EXECUTIVE_SUMMARY.md` — Resumen ejecutivo del Sprint 0 + 0.5 para stakeholders.
- `ARCHITECTURE_MAP.md` — Mapa visual ASCII + tablas compactas.
- `canonical_pack_v1.0.zip` — Pack distribuible con README + `/canonical` + `/specs` + `/audit` + `/summary`.

### Reglas vivas tras la baseline

1. Los 6 specs del Sprint 0 son **fuente de verdad** sobre la arquitectura del producto. En conflicto con código heredado, **gana el spec**.
2. El canon legacy queda alineado con los specs (cero contradicciones canon ↔ legacy verificadas en el informe final).
3. Cualquier evolución posterior empieza por modificar el spec correspondiente + bumpear versión + reflejar en este CHANGELOG.
4. Sprint 1 (Identidad + Roles + Planes + Billing) **no se inicia hasta aprobación explícita del usuario**.

---

## 24 Jun 2026 — E1.5 Workspaces Persistentes

- **Modelo de datos** (3 colecciones MongoDB): `workspaces`, `workspace_messages`, `workspace_blocks`. Índices por `organization_id+state+updated_at`, `created_by+updated_at`, `workspace_id+order`. Visibilidades soportadas en schema: `private | team | organization | public`. UI E1.5 solo expone `private ↔ team`.
- **6 endpoints** bajo `/api/workspaces`: `POST /` (create) · `GET /` (list filtrado por org + state) · `GET /{id}` (detail con access control) · `POST /{id}/messages` (extend — el orchestrator backend decide la skill via `intent_router.py`) · `POST /{id}/share` (toggle private↔team) · `PATCH /{id}` (title) · `DELETE /{id}` (soft archive). Todos requieren auth; `X-Active-Org` header opcional para multi-org.
- **`intent_router.py` espejo** del TS — única fuente de verdad de la lista de verbos. Test `test_intent_router.py::test_parity_with_frontend_verb_list` impide derivas silenciosas.
- **Frontend**:
  - Página `/es/w/[workspace_id]` (client + SWR): renderiza Workspace persistente, header con título inline editable, badge tipo + visibility, botón `Compartir con mi equipo` / `Hacer privado`, botón `Archivar`.
  - Página `/es/historial`: lista con filtros tipo (`Todos | Análisis | Valoraciones | Recomendaciones | Búsquedas | Mixto`) + estado (`Activos | Archivados`). Empty state contextual.
  - `OrgSwitcher`: dropdown en el header autenticado. Estático cuando hay 1 membership; dropdown con marcas cuando ≥2. Persiste `arroba.active_org_id` en localStorage. Emite `arroba:active-org-changed` cuando cambia.
  - `CopilotProvider` modo "anchored": detecta `/w/{id}` por URL, llama a `POST /workspaces/{id}/messages` y mergea el delta. Modo ephemeral E1.4 intacto en cualquier otra ruta.
  - `OpenWorkspaceButton` ("Seguir trabajando"): aparece en el dock efímero cuando hay ≥1 par user/assistant. Click → POST `/api/workspaces` → router.push(`/es/w/{id}`). Anónimo → `/es/login?next=/es/historial`.
  - `RecentWorkspacesPanel`: dropdown en el header del dock con los 10 últimos workspaces de la org activa + link a `/es/historial`.
- **Auto-título determinista**: primera query del user, sin verbo de comando, primer carácter capitalizado, truncado a 80 chars en el último espacio. Sin LLM, sin coste.
- **Cross-org safety**: si el user accede a `/es/w/{id}` de una org a la que no pertenece, redirect a `/es/historial` con toast. Si pertenece pero la activa es otra, se ajusta `activeOrgId` automáticamente.
- **Compartición team** verificada E2E: buyer crea workspace privado → comparte team → seller (otra cuenta misma org) lo ve en `/es/historial` y puede leerlo (lectura sí, extender no).
- **Limpieza de rutas obsoletas**: borradas `/es/analizar`, `/es/valorar`, `/es/comprar-vender` (prohibidas por Copilot First).
- **Demo users seed**: `scripts/seed_demo_users.py` crea 4 usuarios + 1 org "ARROBA Demo Org" (B99999999) idempotente. Credenciales en `/app/memory/test_credentials.md`.
- **Tests**: Backend **110/110 PASS** (24 nuevos: 16 workspaces + 8 intent_router parity). Frontend **97/97 PASS** (11 nuevos: 5 OpenWorkspaceButton + 3 OrgSwitcher + 3 HistoryPage). Lint + typecheck + build verde.
- **Housekeeping E1.4**: 2 tests añadidos a `test_copilot_recommend.py` (cobertura sectorial baja → fallback con sectores adyacentes; cobertura alta → solo estrictos). +1 empresa al seed (`mc_lacteos`, Lácteos del Atlántico). Smoke E2E real contra preview: `oportunidades en alimentación` → 3 cards Alimentación.

## 24 Jun 2026 — E1.4 Intelligence Skills

- **Backend** — adapter `EnrichCompanyAdapter` (Boundary First, Mock/Real + factory por `ENRICH_COMPANY_SOURCE`). Skills `analyze` / `value` / `recommend` con `POST /api/copilot/skills/{analyze,value,recommend}` (`X-Source: mock`). Discriminated union de bloques ampliada a 10 tipos: `search_results` · `empty_state` · `error` · `loading` · `hero` · `metrics` · `company_card` · `company_cards_grid` · `valuation` · `narrative`.
- **Value Skill simplificada** — fórmula determinista `central = revenue * 1.5`, rango `[0.75×, 1.30×]`. Sin múltiplos por sector. La inteligencia real llega vía REQ-004 (Agency Tool Valuation Engine).
- **Recommend Skill** — LLM-assisted intent router (Claude Sonnet 4.6 vía Emergent LLM Key) en 3 subtipos: `similar_to_company` / `opportunities_by_sector` / `list_by_sector`. Heuristic fallback cuando el LLM falla. Body devuelto por adapter mock; REQ-005 lo sustituirá.
- **Analyze Skill** — LLM-powered (Claude Sonnet 4.6). 1 reintento de JSON strict + fallback de narrativa. Workspace: Hero + Metrics + CompanyCard + Narrative.
- **Frontend** — `route-intent.ts` detecta verbos (analiza/valora/recomienda/empresas similares a/empresas en …) accent- y case-insensitive vía NFD. `dispatch.ts` rutea a `apiClient.copilot.{search,analyze,value,recommend}`. `CopilotProvider` persiste `lastQuery`; `ErrorBlock.onRetry` replay con `lastQuery` (no más fallback a `/help`).
- **Block Library E1.4** — `ValuationBlock` (valor central + rango + disclaimer), `NarrativeBlock` (summary + key_points + risks + opportunities), `CompanyCardBlock`, `CompanyCardsGridBlock` (3 subtipos). Tokens canónicos en Light + Dark.
- **REQ-004 + REQ-005** emitidos en `/app/_requirements_for_agency_tool/README.md`. Payloads, schemas, SLA y criterios de aceptación accionables.
- **Seed E1.4** — `scripts/seed_master_companies_e14.py` añade 12 empresas mock cubriendo los 8 sectores obligatorios (Software, Marketing, Hoteles, Industria, Salud, Alimentación, Servicios profesionales, Retail).
- **Tests** — Backend **84/84 PASS** (35 nuevos). Frontend **86/86 PASS** (19 nuevos). Tests pytest NUNCA pegan a Claude real — `MockLLMProvider` inyectado vía `set_override`.
- **`emergentintegrations`** — import path corregido a `emergentintegrations.llm.chat` (era `emergentintegrations.llmchat`).
- **Verificación visual** — capturas Light + Dark de Analyze, Value, Recommend, Error+Retry con Claude real respondiendo.

## 24 Jun 2026 — E1.3 Copilot Foundation

- **Backend** — nuevo módulo `src/modules/copilot/` con `POST /api/copilot/skills/search` (público, `X-Source: mock`). Discriminated union `Workspace.blocks[]` con tipos `search_results | empty_state | error | loading`. Service determinista sobre `master_companies_mock` con scoring textual + CIF + sector accent-insensitive. 10 nuevos tests `tests/test_copilot_search.py`. Backend total: **49/49 PASS**.
- **Frontend** — `components/copilot/` con `CopilotProvider`, `CopilotDock` (FAB minimizado / panel expandido, Cmd+K toggle, ESC cierra, autofocus composer, sr-announcer), `Composer` (textarea autoexpand, Enter envía, chips contextuales, slot adjuntos), `ConversationThread` con renderer inline del último workspace.
- **Block Library** — añadidos `SearchResultsBlock` (lista nombre/sector/CIF/score), `LoadingBlock` (skeleton 3 filas), `ErrorBlock` (icono danger + retry). EmptyStateBlock reusado.
- **`lib/orchestrator/`** — pipeline `text → routeIntent → executeSkill → Workspace`. Slash commands `/clear` y `/help` parseados. `nextBestActions` deterministas por pathname (port del `presetsFor` del intake).
- **Montaje** en `(public)/layout.tsx` y `(authenticated)/layout.tsx` con `<CopilotProvider><CopilotDock /></CopilotProvider>`.
- **REQ-003** emitido en `/app/_requirements_for_agency_tool/README.md` con payload, filtros, ranking, paginación y criterios de aceptación para el endpoint real del Agency Tool.
- **Tests frontend** — 16 nuevos (route-intent 5, next-best-actions 4, workspace-area 4, dock E2E 3). Frontend total: **67/67 PASS**.
- **Light + Dark verificados** vía screenshot tool con: dock minimizado, dock expandido con chips, workspace con `SearchResultsBlock` (≥3 resultados), EmptyState con sugerencias, ErrorBlock con retry, Loading typing indicator.
- **`ThemeSwitcher`** — añadido `data-testid="theme-toggle"` para tests automatizados.

## 9 Abr 2026
- **Premium Intelligence Agent — 3 capas para Pro+**
  - Premium Quant: 8 KPIs deterministas (endeudamiento, fondo maniobra, pasivo/EBITDA, EBITDA/activo, rev/empleado, EBITDA/empleado, deuda neta/EBITDA, margen EBITDA) con tooltips, formulas y niveles
  - Premium Benchmark: percentiles por categoria (facturacion, EBITDA, margen, crecimiento, eficiencia, quality score) con barras y comparacion vs mediana/P75
  - Premium AI (GPT-5.2): fortalezas, riesgos, preguntas DD, lectura estrategica, perfil comprador ideal — carga asincrona (no bloquea la ficha)
- **Ficha Canonica Integrada** — DealPageCanonical reemplaza todas las vistas de deal
  - Shell arroba (logo, nav, breadcrumb, badge plan)
  - Subnav sticky con scrollspy (Resumen, Financieros, Infomemo, Data Room, Proceso)
  - 14 bloques modulares con estado por modulo
  - Graficos recharts reales (barras ingresos/EBITDA, CAGR)
  - PnL completo CIS (cascada), Balance CIS, Activos visuales (logo, screenshots)
  - DataRoom integrado con DataRoomBuyerView funcional
  - Tooltips en estado del proceso, acciones clicables
  - Modulos bloqueados visibles con CTA comercial
- **Consolidacion PnL/Balance CIS** — orquestador prefiere datos CIS cuando tienen PnL+Balance
- **Cards marketplace con orquestador** — badges estado, CTA por plan, financials bloqueados Free
- **Orquestador de Presentacion de Deals** — Fases 1-3 con Contact Request System
- **Rutas unificadas** — /explorar/:dealId y /buyer/deal/:dealId → DealPageCanonical

## 7 Abr 2026
- **Seller Company Workspace** — P0 cerrado (7 bugs criticos corregidos)
- **Reconciliacion documental** — LOI Comparator y Buyer Activity Panel operativos, SellerWizard eliminado

## 26-27 Mar 2026
- Buyer Dashboard Premium, NDA Mutuo Digital, Planes V2, Valoracion Publica, Home
