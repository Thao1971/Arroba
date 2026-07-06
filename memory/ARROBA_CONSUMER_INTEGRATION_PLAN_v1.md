# PLAN DE CONSUMIDOR — arroba.com → Intelligence Layer
**Documento operativo único para migrar arroba.com de mocks locales al contrato público `arroba-integration-contract-v1`.**
_Versión: `consumer-integration-plan-v1.1` · 2026-07-06 · Estado: **APROBADO con 10 reglas canónicas — autorizada Fase B.6.a (scaffolding sin API key)**_

Referencias canónicas (leídas íntegramente):
- **PACK v1** — `/app/memory/ARROBA_INTEGRATION_PACK_v1.md` (sha256 `b3853b7c…d98e5` · 27.316 bytes · 554 líneas)
- **CONTRACT v1** — `/app/memory/AGENCY_TOOL_CONTRACT_v1.md` (sha256 `8331dede…266b3` · 45.180 bytes · 505 líneas)

Cuando este plan cita una decisión canónica, se indica `[pack §N.M]` o `[contract §N]`. No se inventan reglas nuevas.

## §0 · Reglas canónicas aprobadas (usuario · 2026-07-06)

- **R1** — Entorno objetivo: **producción** `AGENCY_TOOL_BASE_URL=https://agencias.wearebudadvisors.com`. Preview solo para incidencia crítica.
- **R2** — `AGENCY_TOOL_MODE` es **mecanismo temporal de migración**. Se retira obligatoriamente en B.6.j (AC binario).
- **R3** — `master_companies_mock` **NO se elimina en B.6.a**. Permanece como soporte de desarrollo hasta validar estabilidad completa. Deprecación calendarizada en B.6.j (tras B.6.f estable).
- **R4** — **PROHIBIDO duplicar lógica de negocio en arroba.com**. Toda inteligencia (scoring, valoración, comparables, matching, recomendaciones, señales, ratios, insights, tesis) vive **exclusivamente** en Intelligence Engines. arroba solo consume · orquesta · presenta · conversa · UX. **arroba NUNCA calcula.** Ver §9 para el catálogo detallado de prohibiciones + criterio arquitectónico permanente.
- **R5** — **Contrato interno frontend congelado.** El frontend consume `/api/companies/*` y demás endpoints internos de arroba, **nunca** ve `X-API-Key`, nunca llama a `agencias.wearebudadvisors.com`. Regla 4 de Sprint 1 preservada y ampliada.
- **R6** — **Observabilidad obligatoria desde B.6.a.** 7 métricas mínimas (§3.6): latencia p50/p95/p99 por motor · calls totales · cache hit/miss · 4xx desglosados · 5xx · estado circuit breaker · tiempos medios. `structlog` + endpoint interno `/api/internal/metrics` en JSON.
- **R7** — **Rate limit asumido GLOBAL por API key** hasta confirmación oficial. Desde B.6.a: caché agresiva 2-capas · deduplicación single-flight por `(master_id, engine, payload_hash)` · refresh inteligente en background al 80% de TTL · batch por sección de ficha (una llamada por motor, no una por bloque).
- **R8** — Nuevo orden de sub-fases: `a → b → c → f → d → e → g → h → i → j`. Rationale: tras Master + Financial + Semantic (a-c), saltamos a **B.6.f wiring frontend** para ver la ficha canónica con datos reales lo antes posible. Signal/Recommendation/Transaction/Strategy quedan `UnavailableBlock` hasta sus fases. En B.6.f **el freeze sobre `/empresa/{cif}` se levanta parcialmente** para tocar solo `CompanyPageClient.tsx` y renderers relacionados. Antes de B.6.f el freeze es absoluto.
- **R9** — **Diseño para múltiples proveedores desde el inicio.** El módulo se llama **`intelligence_layer`**, no `agency_tool_client`. Estructura obligatoria con `interfaces/` (contratos abstractos) + `providers/agency_tool/` (implementación concreta) + `router.py` (dispatcher config-driven). Zero coupling entre capas superiores y el nombre del provider.
- **R10** — **Criterio arquitectónico permanente.** Antes de cada endpoint proxy nuevo: **"¿Esta funcionalidad pertenece a arroba o debería vivir en un Intelligence Engine?"** Si es del engine, se marca REQ contra el proveedor y NO se implementa en arroba.

---

## §1 · Inventario de mocks vivos en arroba.com

Todo lo que hoy simula datos/inteligencia en arroba.com y debe ser sustituido por llamadas al contrato `arroba.v1`.

### 1.1 Colecciones Mongo locales (ilegítimas según [pack §1.7 anti-patrones])

| # | Colección | Docs | Fuente actual | Motor `arroba.v1` que la reemplaza | Prioridad |
|---|---|---:|---|---|---|
| 1.1.a | `master_companies_mock` | 19 | Seed `seed_master_companies_e14.py` (4 campos financieros × empresa) | Master (`GET /api/v1/master/{master_id}`) + Financial (`POST /financial-intelligence/analyze`) | **P0** |
| 1.1.b | `platform_stats_mock` | 1 | Seed `seed_platform_stats.py` (números hardcoded de marketing) | **No hay equivalente en el contrato v1**. Decisión: reemplazar por conteos reales derivados vía queries agregadas al Master (`GET /api/v1/master/stats` — auth JWT) o eliminar el bloque (endpoint `/api/platform/stats` alias) | **P2** (endpoint decorativo) |
| 1.1.c | `company_analysis_refreshes` | 2 | Local — rate-limit tracking del CTA "Refrescar análisis" | **Se conserva.** Es estado del usuario en arroba, no de Agency Tool [pack §1.5 filosofía: "workflow del usuario"] | (mantener) |
| 1.1.d | `company_conversations` + `company_conversation_messages` | 8 + 28 | Local — historial del Copilot por empresa/user | **Se conserva.** Es conversación del user con Arroba Copilot, no del motor. Convive con la memoria del contrato (`recommendation-intelligence/memory`, `strategy-intelligence/memory`, `transaction-intelligence/memory`) | (mantener) |
| 1.1.e | `company_watchlists` | 2 | Local | **Se conserva.** Watchlist es del user en arroba. Cuando llegue `push/suscripción` [pack §8 v2] se enriquecerá con `signal-intelligence/analyze` + polling | (mantener + enriquecer en v2) |
| 1.1.f | `workspace_blocks` + `workspace_messages` | 87 + 82 | Local — bloques del Copilot orquestador | **Se conserva.** Son la memoria del Copilot de arroba, no de Agency Tool | (mantener) |

### 1.2 Servicios backend que producen "inteligencia" local (ilegítimos [pack §1.7 · no recalcular valoraciones, no reimplementar matching/scoring])

| # | Ruta absoluta · función | Rol actual | Motor `arroba.v1` que lo reemplaza | Riesgo eliminación |
|---|---|---|---|---|
| 1.2.a | `/app/backend/src/modules/companies/service.py::build_valuation()` | Fórmula fija `revenue × 1.5` con bandas 0.75-1.30 | `POST /api/v1/financial-intelligence/valuation` | **Bajo** — output ya casa con `ValuationBlock` |
| 1.2.b | `/app/backend/src/modules/companies/service.py::build_comparables()` | Filtro local sobre `master_companies_mock` por sector/región + score sintético `0.92-idx*0.06` | `POST /api/v1/recommendation-intelligence/comparables` (+ `/explain`) | Bajo |
| 1.2.c | `/app/backend/src/modules/companies/service.py::build_score_placeholder()` | Emite `confidence×100` como "score" (semánticamente ambiguo) | `POST /api/v1/financial-intelligence/analyze` → `financial_quality.score` + `POST /api/v1/signal-intelligence/analyze` → `score`, `signal_score` | Bajo |
| 1.2.d | `/app/backend/src/modules/companies/service.py::build_hero()`, `build_kpi_metrics()`, `build_financials_metrics()` | KPIs derivados on-the-fly de los 4 campos locales | `POST /api/v1/financial-intelligence/analyze` → `kpis.{revenue, ebitda, ebitda_margin, revenue_growth_yoy, revenue_cagr, evolution.*}` + `income_statement` + `balance_sheet` + `ratios` | Bajo |
| 1.2.e | `/app/backend/src/modules/companies/service.py::_build_narrative_placeholder()` + `build_narrative()` | Deterministic + LLM Claude 4.6 sobre 4 datos | Se conserva pero **enriquecido**: el LLM ahora recibe payload completo de Financial+Signal+Semantic. La narrativa deja de "extrapolar sobre 4 números" | Medio (cambio de prompt) |
| 1.2.f | `/app/backend/src/modules/companies/advisor.py::_company_payload_for_llm()` | Pasa 4 campos al LLM del Company Advisor | Mismo — recibe payload enriquecido de los motores | Medio |
| 1.2.g | `/app/backend/src/modules/copilot/skills/analyze.py::execute_analyze()` | Skill "Analiza" del Copilot | Thin wrapper que orquesta Financial + Signal + Semantic + Recommendation según [pack §5.4 Copilot] | Medio |
| 1.2.h | `/app/backend/src/modules/copilot/skills/value.py::execute_value()` | Skill "Valora" con fórmula local | Thin wrapper de `POST /api/v1/financial-intelligence/valuation` + opcionalmente `POST /api/v1/strategy-intelligence/thesis` para contexto [pack §5.2] | Bajo |
| 1.2.i | `/app/backend/src/modules/copilot/skills/recommend.py::execute_recommend()` + `_sector_with_adjacent()` + `_companies_by_sector()` | Skill "Recomienda" con filtro local | Thin wrapper de `POST /api/v1/recommendation-intelligence/{comparables|buyers|sellers|opportunities}` [pack §5.3, §5.4] | Bajo |
| 1.2.j | `/app/backend/src/modules/entities/service.py::lookup()` + `/app/backend/src/modules/entities/router.py` `GET /api/entities/lookup` | Búsqueda naïve substring sobre master_companies_mock | `POST /api/v1/semantic-intelligence/search` [pack §5.6 Universal Search] | Bajo |

### 1.3 Módulo adapter completo (rol arqueológico → sustitución completa)

| # | Ruta | Rol | Sustituto en `arroba.v1` |
|---|---|---|---|
| 1.3.a | `/app/backend/src/modules/agency_tool_adapter/` (`service.py`, `models.py`, `enrich_company.py`, `router.py`, `dependencies.py`) | 5 archivos — adapter que lee Mongo local y expone `/api/agency-tool/*`. `ADAPTER_MODE = "mock"` hardcoded. Contrato `EnrichedCompany` mucho más pobre que `master_companies` §6.1 del contrato v1 | **Reemplazado íntegramente** por nuevo módulo `/app/backend/src/modules/agency_tool_client/` (cliente HTTP real). El namespace `agency_tool_adapter` se archiva (no elimina hasta B.6.g para no romper tests que aún lo referencian) |
| 1.3.b | `/app/backend/src/modules/platform/router.py` `GET /api/platform/stats` | Alias frontend-safe del status del adapter (F8 Sprint 1) | **Se conserva** por [Sprint 1 Regla 4 · zero coupling FE→agency]; su implementación cambia bajo el capó: dejará de leer `platform_stats_mock` y usará conteos derivados o degrada a hidden state |
| 1.3.c | `/app/backend/src/modules/agency_tool_adapter/router.py` `GET/POST /api/admin/agency-tool/master-companies-mock` (3 endpoints) | Admin CRUD sobre la colección mock | **Se elimina.** Ya no habrá seed local que administrar |

### 1.4 Seeds locales

| # | Script | Datos que semilla | Destino tras migración |
|---|---|---|---|
| 1.4.a | `/app/backend/scripts/seed_master_companies_e14.py` (303 líneas · 19 empresas × 4 campos) | Empresas seed para demos | **Se archiva.** Los datos reales llegan de `master_companies` de Agency Tool [pack §1.1] |
| 1.4.b | `/app/backend/scripts/seed_platform_stats.py` | Números marketing | **Se elimina** |
| 1.4.c | `/app/backend/scripts/seed_admin.py`, `seed_demo_users.py` | Cuentas admin + demo users | **Se conservan** — es data operativa de arroba, no de Agency Tool |

### 1.5 Frontend — hardcodes y renderers pobres

| # | Ubicación · elemento | Actual | Sustituto |
|---|---|---|---|
| 1.5.a | `CanonicalEntityMockupClient.tsx:614` chips `'Buy & Build'`, `'Captación de capital'`, `'Entrada de socio'` | Array hardcoded en el hero row | `POST /api/v1/signal-intelligence/opportunities` + `POST /api/v1/recommendation-intelligence/opportunities` [pack §5.3] |
| 1.5.b | `CanonicalEntityMockupClient.tsx:548-551` badges `Verificada` + `Auditada · Ernst & Young` | Hardcoded para todos los CIFs | `GET /api/v1/master/{master_id}` → `provenance{}`/`sources[]` para "Verificada"; auditor no está en el contrato v1 · queda `unavailable` |
| 1.5.c | `CanonicalEntityMockupClient.tsx:562` link `castillatermal.com` | Hardcoded | `GET /master/{master_id}` → `contact.web` (§6.1) |
| 1.5.d | `CanonicalEntityMockupClient.tsx:160-256` `DEAL_SCENARIOS` (5 escenarios `venta/compra/financiacion/fusion/none`) | Objeto con terms/actions/timeline hardcoded en el frontend | `POST /api/v1/transaction-intelligence/workspace` + `/next-action` + `/timeline` + `/risk` [pack §5.5] |
| 1.5.e | `CanonicalEntityMockupClient.tsx:1121-1140` array de 3 oportunidades con descripciones | Hardcoded en la sección `oportunidades` | `POST /api/v1/recommendation-intelligence/opportunities` |
| 1.5.f | `CopilotDemoTeaser.tsx` (home hero teaser) + `copilot-demo-script.ts` | Copies de demostración estáticos | **Se conservan** — es marketing del home público, no ficha. Sin cambio |
| 1.5.g | `journey/data.ts` `DEMO_COMPANIES` + `journey/derive.ts` `COMPANIES_DEMO` | Fixtures del onboarding paso a paso | **Se conservan** en B.6.a-e, revisar en B.6.f: onboarding puede usar `semantic-intelligence/search` para elegir empresa real |

### 1.6 Frontend — renderers ausentes que exige el contrato

Renderers que **no existen** hoy y hay que crear para consumir el payload del contrato:

| # | Renderer necesario | Payload origen | Ubicación destino |
|---|---|---|---|
| 1.6.a | `PLBlock` (P&L multi-año) | `financial-intelligence/analyze` → `income_statement` | `components/blocks/PLBlock.tsx` |
| 1.6.b | `BalanceBlock` | idem → `balance_sheet` | idem |
| 1.6.c | `RatiosGridBlock` con tooltip fórmula | idem → `ratios.*` + `GET /financial-intelligence/ratios/catalog` | idem |
| 1.6.d | `RevenueEvolutionBlock` (gráfica multi-año) | idem → `kpis.evolution.{revenue,ebitda,net_income}` | idem |
| 1.6.e | `RadarBlock` (5 ejes calidad/crecimiento/margen/productividad/salud) | idem → `financial_quality.{score, strengths, weaknesses, risks}` | idem |
| 1.6.f | `SignalsListBlock` (polaridad · severidad · `act-v1` inline) | `signal-intelligence/analyze` → `signals[]` | `components/blocks/SignalsListBlock.tsx` |
| 1.6.g | `SemanticProfileBlock` (activities/products/markets/keywords chips) | `semantic-intelligence/profile` → `semantic_profile.*` | idem |
| 1.6.h | `OwnershipTreeBlock` (matriz última + participadas jerárquicas) | `GET /master/{master_id}` → `ownership.*` + `master_relationships` | idem |
| 1.6.i | `TransactionWorkspacePanel` (reemplaza `<CanonicalDealPanel>` hardcoded) | `transaction-intelligence/workspace` | `components/blocks/TransactionWorkspacePanel.tsx` |
| 1.6.j | `NextActionCard` (next-best-action del Copilot transaccional) | `transaction-intelligence/next-action` | idem |
| 1.6.k | `ThesisBlock` (5 dimensiones + score + narrative) | `strategy-intelligence/thesis` | idem |

---

## §2 · GAP arroba actual ↔ `arroba.v1`

Base: matrices de Fase B.5 y B.5.2 (32 bloques + 7 motores). Actualización con [pack §2.1] Base URLs oficiales y [pack §3] 53 rutas totales del snapshot congelado.

**Recuento final** (endpoints del snapshot público `arroba.v1.json` según [pack §3]): **53 rutas** = motores puros (§4.1-4.6). Los 4 endpoints administrativos `/api/v1/master/*` (§4.0 contrato) están fuera del snapshot público — se usan solo para lectura administrativa (auth JWT, no `X-API-Key`). En el consumidor arroba usamos exclusivamente **1** de esos 4 endpoints: `GET /api/v1/master/{master_id}` (identidad canónica).

Distribución por tipo de GAP:

| Tipo GAP | Definición | Ejemplos | Volumen |
|---|---|---|---|
| **GAP de wiring puro** | Endpoint operativo en el contrato + falta cliente/proxy/renderer en arroba | Financial `analyze/valuation/catalog`, Signal `analyze/history/catalog`, Semantic `profile/similar/search`, Recommendation `comparables/buyers/sellers`, Transaction `workspace/next-action/timeline/risk` | ~85% de los 53 endpoints |
| **GAP de modelo** | El renderer frontend actual no puede representar el payload sin nuevo componente | `PLBlock`, `BalanceBlock`, `RatiosGridBlock`, `RadarBlock`, `SignalsListBlock`, `SemanticProfileBlock`, `OwnershipTreeBlock`, `TransactionWorkspacePanel`, `NextActionCard`, `ThesisBlock` (11 renderers nuevos § 1.6) | ~10 renderers nuevos |
| **GAP de contrato** | Payload marcado `unavailable` por el proveedor | Recommendation `investors`/`advisors` [pack §8 diferido a v2 · contract §7 🟡]; Transaction v2 endpoints (IOI/LOI/SPA/closing) | 2 endpoints + roadmap v2 |
| **GAP de arquitectura** | Cambio de responsabilidad (cliente ↔ servidor) | `entities/lookup` naïve local → `semantic-intelligence/search`; skills `analyze/value/recommend` → thin wrappers | 4 servicios |

**GAP concreto por motor** (ver §Tarea 6 de Fase B.5.2 para el detalle 7×8; en este plan no lo repetimos).

---

## §3 · Arquitectura del consumidor en arroba.com

### 3.1 Cliente HTTP

- **Módulo nuevo:** `/app/backend/src/modules/agency_tool_client/`
  - `client.py`: `AgencyToolClient` con `httpx.AsyncClient` (timeout 30s por defecto, `connect=5s` [pack §6.3 ejemplo Python]).
  - **Reintentos:** backoff exponencial `1s → 2s → 4s`, máximo 3 intentos. Respeta `Retry-After` en `429` [pack §2.3, §6.2].
  - **Circuit breaker (opcional B.6.g+):** tras 5 `5xx` consecutivos en 60s, corta llamadas al motor y devuelve `{status:"unavailable",reason:"agency_tool_down"}` durante 30s.
  - **Concurrencia por motor:** semáforo interno para no saturar (max 20 concurrentes por motor, ajustable via env).
  - **Base URL:** `AGENCY_TOOL_BASE_URL` env — [pack §2.1]:
    - Prod: `https://agencias.wearebudadvisors.com`
    - Preview: `https://data-factory-hub.preview.emergentagent.com`
- **OpenAPI-generated types:** consumir el snapshot congelado `arroba.v1.json` [pack §3] para generar tipos Pydantic. **No inventamos DTOs a mano.** Comando: `openapi-python-client generate --url ${AGENCY_TOOL_BASE_URL}/api/v1/openapi/arroba.v1.json` [pack §3] → tipos en `agency_tool_client/dto/`.
- **7 sub-módulos por motor:** `financial.py`, `signal.py`, `semantic.py`, `recommendation.py`, `strategy.py`, `transaction.py`, `master.py`. Cada uno expone métodos 1:1 con los endpoints del contrato ([pack §4]).

### 3.2 Autenticación

- **Cabecera:** `X-API-Key: <ARROBA_SERVICE_API_KEY>` en **todas** las llamadas a motores [pack §2.2].
- **Fuente:** env var `ARROBA_SERVICE_API_KEY` (secret de servidor, nunca en logs ni openapi de arroba). Cargada en `Settings` class de `src/core/config.py`.
- **Rotación sin downtime:** [pack §7.1 runbook]. arroba admite dos slots activos temporalmente (`ARROBA_SERVICE_API_KEY_PRIMARY` + `_SECONDARY`) durante la rotación. Health check en boot: `GET /api/v1/health` con la primary; si falla, usa secondary; alerta en logs [pack §7.3 monitorización].
- **Prohibición explícita:** el frontend **nunca ve la API key**. Solo el backend arroba habla con Agency Tool (server-to-server) [pack §2.2, §5 playbook: "orquesta desde el backend de arroba"]. Regla 4 de Sprint 1 (zero-coupling FE→agency) se preserva.

### 3.3 BFF / Proxy

- **Ubicación:** los proxies internos que consume el frontend siguen viviendo bajo `/app/backend/src/modules/companies/` (por ficha) + módulos existentes (`entities`, `platform`, `copilot`).
- **Contrato interno que arroba expone al frontend:** se mantiene la superficie `/api/companies/{cif}/*` de Sprint 1 (para no romper `CompanyPageClient.tsx` durante la migración) más nuevos endpoints granulares por motor:
  - `GET /api/companies/{cif}/financial` → invoca `financial-intelligence/analyze` + `/valuation`
  - `GET /api/companies/{cif}/signals` → `signal-intelligence/analyze` + `/history`
  - `GET /api/companies/{cif}/semantic` → `semantic-intelligence/profile` + `/similar`
  - `GET /api/companies/{cif}/recommendations?type={comparables|buyers|sellers|opportunities|matching}` → `recommendation-intelligence/{type}`
  - `GET /api/companies/{cif}/strategy` → `strategy-intelligence/thesis` + `/scenarios`
  - `GET /api/companies/{cif}/transactions/current` → `transaction-intelligence/workspace` para la operación activa del user
  - `GET /api/companies/{cif}/ownership` → `master/{master_id}` subset `ownership + master_relationships`
- **Composición de respuestas** (agregación entre motores): el playbook [pack §5.1 Entity Page] pide 5 llamadas en paralelo. El proxy `/api/companies/{cif}` compone las 5 con `asyncio.gather()` y devuelve un DTO agregado con la misma forma actual `sections.*` (compatibilidad Sprint 1) — los datos internos cambian, la forma se preserva.
- **Copilot orquestador** [pack §5.7 Copilot First]: `copilot/skills/*` pasan a ser thin wrappers que agregan resultados de N motores según la intención detectada. `analyze` = Financial+Signal+Semantic; `value` = Financial+Strategy; `recommend` = Recommendation (variantes).

### 3.4 Caché

- **Capa 1 · In-memory** (`asyncio.Lock` + TTL) para latencia sub-request. Key: `(engine, endpoint, master_id, engine_version)`. TTL por endpoint [pack §7]:
  - Master: 300s
  - Financial (`analyze`, `valuation`): 900s (15min)
  - Financial (`ratios/catalog`): 24h
  - Signal (`analyze`, `history`): 300s
  - Signal (`catalog`): 24h
  - Semantic (`profile`, `similar`, `search`): 900s
  - Recommendation (`comparables`, `buyers`, `sellers`, `opportunities`): 300s
  - Recommendation (`catalog`): 24h
  - Strategy (`thesis`): 900s
  - Transaction (`workspace`, `next-action`): **0s (event-driven, no cachear)** — [pack §3.4 estrategia: "El estado transaccional no se cachea en cliente"]
- **Capa 2 · Mongo** (nueva colección `agency_tool_cache`) para persistir entre reinicios del backend. Documento: `{key, engine_version, payload, cached_at, expires_at}`. TTL index Mongo + `expires_at` compound. Solo endpoints con TTL ≥ 300s se persisten (evita ruido).
- **Invalidación:** 
  - Detección de cambio de `engine_version`/`recommendation_version`/`strategy_version` en respuesta [pack §2.5] → invalidar todas las entradas de ese motor.
  - `POST /api/companies/{cif}/refresh?engines=...` desde el CTA "Refrescar análisis" invalida por motor+cif.
  - `Retry-After` en 429 desactiva la caché temporalmente para respetar el rate-limit del proveedor.

### 3.5 Gestión de errores

Mapeo [pack §2.4]:

| Código Agency Tool | Excepción arroba | Comportamiento del proxy | Renderer frontend |
|---|---|---|---|
| `200 OK` | — | Devuelve payload | Ready |
| `200 + {status:"unavailable",reason}` | `AgencyToolUnavailable` | Devuelve estado unavailable con reason | `<UnavailableBlock req="..." eta="Sprint 2">` con reason |
| `400 Bad Request` | `AgencyToolValidationError` | 500 al frontend + log estructurado (bug arroba) | ErrorBlock genérico |
| `401 Missing/Invalid X-API-Key` | `AgencyToolAuthError` | 500 al frontend + **alert crítico** (arroba mis-configurado) | ErrorBlock |
| `403 Forbidden` | `AgencyToolPermissionError` | 500 + alert | ErrorBlock |
| `404 master_not_found` | `AgencyToolNotFound` | 404 al frontend con `master_not_found` | Página 404 canónica de arroba |
| `409 Conflict` (guards state-machine Transaction) | `AgencyToolConflict` | 409 al frontend con `reason` | Toast "Estado obsoleto, refrescando…" + reload |
| `422 Validation` | `AgencyToolValidationError` | 500 + log (bug arroba) | ErrorBlock |
| `429 Rate Limit` | `AgencyToolRateLimit` (con `retry_after`) | Backoff exponencial en cliente (max 3). Si agota → 503 al frontend | Retry silencioso; si 503 → ErrorBlock con CTA retry |
| `5xx` | `AgencyToolServerError` | Reintentar 3× · si persiste → 503 al frontend | ErrorBlock. Circuit breaker abre tras 5 consecutivos |

**Degradación elegante:** cualquier motor caído hace que su(s) sección(es) rendericen `UnavailableBlock` con `reason` visible. El resto de la ficha sigue funcional [pack §1.6 Progressive Enhancement].

### 3.6 Observabilidad

- **Logging estructurado** (`get_logger("agency_tool_client")`):
  - `engine`, `endpoint`, `master_id`, `request_id`, `engine_version` (o `*_version` por motor [pack §2.5]), `latency_ms`, `status_code`, `cache_hit` (bool), `retry_count`.
  - **Nunca loguear la API key** [pack §7.1].
- **Métricas** (a exponer en un futuro Prometheus endpoint):
  - `agency_tool_calls_total{engine,endpoint,status}` — counter
  - `agency_tool_latency_seconds{engine,endpoint}` — histogram (p50, p95, p99)
  - `agency_tool_cache_hits_total{engine,endpoint}` — counter
  - `agency_tool_rate_limit_total{engine}` — counter (esperado ~0)
- **Alertas** (a definir con el user en B.6.h):
  - `429` > 5 en 1min → posible saturación
  - `5xx` > 1% en 5min → Agency Tool degradado
  - Circuit breaker abierto → alerta P1
  - Cambio inesperado de `engine_version` [pack §7.3] → alerta info (posible bump; validar contrato)

### 3.7 Feature flag `AGENCY_TOOL_MODE`

- **Valores:**
  - `mock` (default legacy) — usa el `agency_tool_adapter` actual (mantiene Sprint 1 verde durante la migración). Se elimina al final de B.6.
  - `real` — usa `agency_tool_client` contra la Base URL configurada. Requiere `ARROBA_SERVICE_API_KEY`.
- **Selección:** por env var. En `Settings` de `src/core/config.py`.
- **Rutas hardcoded a `real` cuando la fase corresponda:** cada fase B.6.x fija el motor migrado como `real`; el resto sigue en `mock` hasta que le toque. Esto permite despliegue gradual sin big-bang.
- **NO se contempla `stub`** (el usuario ha decidido "sin stubs" — al arrancar B.6.a se autoriza el flip a `real` con credenciales en el `.env`).

---

## §4 · Mapa funcional experiencia → motores

Basado en [pack §5 playbook] y [contract §5 matriz].

| Experiencia arroba | Motores consumidos | Endpoints principales | Ficha canónica sección |
|---|---|---|---|
| **Home privada `/inicio`** | Semantic + Signal + Recommendation | `semantic/search` (Composer), `signal/opportunities`, `recommendation/opportunities`, `recommendation/memory` (watchlist agregada) | — |
| **Composer (Arroba Copilot dock)** | Semantic → cualquiera según intención | `semantic/search` + `semantic/profile` para contexto → según intención [pack §5.4]: Financial+Signal (analizar), Financial+Strategy (valorar), Recommendation (buscar), Strategy (estrategia), Transaction (operar) | Global |
| **Entity Page canónica `/empresa/{cif}`** ([pack §5.1]) | Master + Financial + Signal + Semantic + Recommendation | `master/{id}` + `financial/analyze` + `financial/valuation` + `signal/analyze` + `semantic/profile` + `semantic/similar` + `recommendation/comparables` (5 llamadas en paralelo) | resumen, finanzas, valoración, mercado, señales, oportunidades, gobierno, propiedad |
| **Valoración detallada** ([pack §5.2]) | Financial + Strategy | `financial/valuation` + `strategy/thesis` (contexto) + `strategy/scenarios` | Sección `valoracion` extendida |
| **Marketplace / Oportunidades** ([pack §5.3]) | Recommendation + Signal | `recommendation/opportunities` + `signal/opportunities` | `oportunidades` de la ficha + página global futura |
| **Match/Deal Workspace** ([pack §5.5]) | Transaction (todos) + Master | `transaction/transaction` + `/workspace` + `/next-action` + `/timeline` + `/documents` + `/participants` + `/risk` + `/task` + `/stage` | Right panel `Operación activa` |
| **Watchlist** ([pack §5.6]) | Recommendation + Signal | `recommendation/memory` + `signal/analyze` (polling por CIF guardado) | — |
| **Universal Search (dentro de Composer)** ([pack §5.6]) | Semantic | `semantic/search` | Composer |
| **Onboarding** | Semantic | `semantic/search` para elegir empresa real (sustituye fixtures) | Página onboarding |
| **Copilot orquestador (skill routing)** | Todos según intención [pack §5.4] | Ver skills `analyze/value/recommend` tras thin-wrap | Dock |

---

## §5 · Orden óptimo de migración

**Ruta crítica MVP** confirmada por el usuario:

`#1 Master → #2 Financial → #3 Semantic → #4 Signal → #5 Recommendation core → #6 Recommendation opportunities → #7 Transaction read-only`

Sub-fases granulares (cada una \<7 días, cerrable en una iteración):

| Sub-fase | Motor · endpoints exactos | Entregables cliente + proxy + renderer | Deprecación aplicada |
|---|---|---|---|
| **B.6.a** | Cliente HTTP + Master `GET /master/{master_id}` (1 endpoint) | `agency_tool_client/client.py` + `master.py`; proxy `/api/companies/{cif}/identity` (usa `cif_normalized` → `master_id`); renderer: enriquece `CompanyHeader.tsx` con `provenance`, `sources`, `contact.web` | Sustituye la lectura de `master_companies_mock` en el header del `EnrichedCompany.legal_name/sector/region/country` |
| **B.6.b** | Financial `analyze` (1 endpoint) | `financial.py` con `analyze()`; proxy `/api/companies/{cif}/financial`; renderers `PLBlock`, `BalanceBlock`, `RatiosGridBlock`, `RevenueEvolutionBlock`, `RadarBlock` (5 renderers nuevos) | Elimina `build_kpi_metrics()`, `build_financials_metrics()`, `build_score_placeholder()` en `real` mode |
| **B.6.c** | Financial `valuation` + `ratios/catalog` (2 endpoints) | `financial.valuation()` + `financial.ratios_catalog()`; proxy `/api/companies/{cif}/valuation`; renderer `ValuationBlock` enriquecido con `explanation` + `subject_ebitda_margin_percentile` | Elimina `build_valuation()` (fórmula fija) en `real` mode. Skill `copilot/skills/value.py` pasa a thin wrapper |
| **B.6.d** | Semantic `profile` + `similar` + `search` (3 endpoints) | `semantic.py`; proxy `/api/companies/{cif}/semantic` + reemplaza `/api/entities/lookup` naïve por `semantic-intelligence/search`; renderer `SemanticProfileBlock` | Elimina `entities/service.py::lookup()` filtro substring + `_sector_with_adjacent()`. Composer global usa Universal Search |
| **B.6.e** | Signal `analyze` + `history` + `catalog` (3 endpoints) | `signal.py`; proxy `/api/companies/{cif}/signals`; renderer `SignalsListBlock` con polaridad/severidad/`act-v1` botones | Sección `senales` deja de renderizar `UnavailableBlock` con REQ-006 (canónico Sprint 1); ahora renderiza señales reales |
| **B.6.f** | Recommendation core `comparables` + `explain` + `buyers` + `sellers` (4 endpoints) | `recommendation.py`; proxy `/api/companies/{cif}/recommendations?type=`; renderer `CompanyCardsGridBlock` reutilizado + nuevo `RecommendationExplainSheet` | Elimina `build_comparables()` (filtro local). Skill `copilot/skills/recommend.py` pasa a thin wrapper |
| **B.6.g** | Recommendation `opportunities` + Signal `opportunities` + `sector`/`territory` (4 endpoints) | Endpoints ya en `recommendation.py` y `signal.py`; proxy `/api/companies/{cif}/opportunities`; renderer sección `oportunidades` deja hardcode | Elimina 3 chips + 3 cards hardcoded en el mockup canónico |
| **B.6.h** | Transaction read-only `workspace` + `next-action` + `timeline` + `risk` (4 endpoints) | `transaction.py`; proxy `/api/companies/{cif}/transactions/current`; renderers `TransactionWorkspacePanel` (sustituye `<CanonicalDealPanel>` hardcoded), `NextActionCard`, `TimelineBlock` | Elimina `DEAL_SCENARIOS` object del mockup canónico. Panel derecho consume operación real del user |
| **B.6.i** (opcional / stretch) | Strategy `thesis` + `scenarios` + `decision` (3 endpoints) | `strategy.py`; proxy `/api/companies/{cif}/strategy`; renderer `ThesisBlock` | Nueva capacidad — no había mock previo. Enriquece la sección `valoracion` |
| **B.6.j** (deprecación) | (ninguno) | Elimina completamente `agency_tool_adapter/` (5 archivos). Elimina seeds locales. Elimina colecciones `master_companies_mock` + `platform_stats_mock` (migration script). Elimina flag `AGENCY_TOOL_MODE=mock` (queda solo `real`) | Cierre de migración |

Ruta crítica **B.6.a → B.6.f** = 6 sub-fases · ~15 días efectivos · desbloquea el mockup canónico al 70% real. **B.6.g-i** son enhancement. **B.6.j** es cierre + limpieza.

---

## §6 · Funcionalidades a ELIMINAR de arroba.com

Consolidado con §1. Cada item indica ruta, sustituto, riesgo y sub-fase de deprecación.

| # | Ruta absoluta | Sustituto `arroba.v1` | Riesgo | Deprecación en |
|---|---|---|---|---|
| 6.1 | `/app/backend/src/modules/agency_tool_adapter/service.py` (295 líneas) | `agency_tool_client/master.py` + `financial.py` | Bajo | B.6.a inicia, B.6.j elimina |
| 6.2 | `/app/backend/src/modules/agency_tool_adapter/models.py::EnrichedCompany` | Types generados desde `arroba.v1.json` (`master_companies` schema §6.1 contract) | Bajo | B.6.j |
| 6.3 | `/app/backend/src/modules/agency_tool_adapter/enrich_company.py` (`MockEnrichCompanyAdapter`) | `agency_tool_client.master.get_by_id()` | Bajo | B.6.a |
| 6.4 | `/app/backend/src/modules/agency_tool_adapter/router.py` (endpoints `/api/admin/agency-tool/*`) | (eliminado, no hay admin CRUD sobre Master en arroba) | Medio (rompe UI admin si existe) | B.6.j |
| 6.5 | Colección Mongo `master_companies_mock` (19 docs) | `master_companies` en Agency Tool | Bajo (drop tras B.6.a operativo en `real`) | B.6.j (migration script) |
| 6.6 | Colección Mongo `platform_stats_mock` (1 doc) | Sin equivalente directo — endpoint `/api/platform/stats` cambia impl (o se retira) | Medio | B.6.g |
| 6.7 | `service.py::build_valuation()` (fórmula `revenue×1.5`) | `financial-intelligence/valuation` | Bajo | B.6.c |
| 6.8 | `service.py::build_comparables()` (filtro local) | `recommendation-intelligence/comparables` | Bajo | B.6.f |
| 6.9 | `service.py::build_score_placeholder()` (`confidence×100`) | `financial-intelligence/analyze` → `financial_quality.score` | Bajo | B.6.b |
| 6.10 | `service.py::build_hero/kpi_metrics/financials_metrics/identity` | `financial-intelligence/analyze` → `kpis` + `master/{id}` → `identity` | Bajo | B.6.a + B.6.b |
| 6.11 | `service.py::_build_narrative_placeholder()` + `build_narrative()` payload builder | Enriquecido — recibe payload de Financial+Signal+Semantic | Medio (cambia prompt LLM) | B.6.b (payload) + B.6.d,e (contexto) |
| 6.12 | `advisor.py::_company_payload_for_llm()` | Idem #11 | Medio | B.6.b-e |
| 6.13 | `copilot/skills/analyze.py::execute_analyze` + `_company_payload_for_llm` + `_score_of` | Thin wrapper de Financial+Signal+Semantic | Medio | B.6.b + B.6.d + B.6.e |
| 6.14 | `copilot/skills/value.py::execute_value` (fórmula local) | Thin wrapper de `financial-intelligence/valuation` | Bajo | B.6.c |
| 6.15 | `copilot/skills/recommend.py::execute_recommend` + `_sector_with_adjacent` + `_companies_by_sector` | Thin wrapper de `recommendation-intelligence/*` | Bajo | B.6.f |
| 6.16 | `entities/service.py::lookup()` (substring naïve) | `semantic-intelligence/search` | Bajo | B.6.d |
| 6.17 | `scripts/seed_master_companies_e14.py` | (elimina — datos reales llegan de Agency Tool) | Bajo | B.6.j |
| 6.18 | `scripts/seed_platform_stats.py` | (elimina) | Bajo | B.6.g |
| 6.19 | Hardcodes frontend en `CanonicalEntityMockupClient.tsx` (chips, badges, deal scenarios, oportunidades) | Endpoints `signal/opportunities`, `master/{id}`, `transaction/workspace`, `recommendation/opportunities` | Medio (UI visible) | B.6.a (badges) + B.6.g (opps) + B.6.h (deal) |
| 6.20 | Flag `AGENCY_TOOL_MODE=mock` + `ENRICH_COMPANY_SOURCE=mock` en `.env` | (eliminado tras B.6.j) | Bajo | B.6.j |
| 6.21 | `/app/backend/src/modules/platform/router.py::GET /api/platform/stats` (opcional) | Se mantiene la ruta por Regla 4 Sprint 1 pero cambia backend: conteos reales o hidden | Bajo | B.6.g |

**No se elimina:** `company_conversations`, `company_conversation_messages`, `company_watchlists`, `company_analysis_refreshes`, `workspace_blocks`, `workspace_messages`, seeds `seed_admin.py`, `seed_demo_users.py`, `CopilotDemoTeaser`, `journey/data.ts` DEMO_COMPANIES (revisar en B.6.f).

---

## §7 · Riesgos técnicos y dependencias

### 7.1 Rate limit
- **Confirmado 600 req/min por API Key** [pack §2.3] (no por org ni IP). Con la ficha canónica típica (5 motores × 1-2 llamadas), 1 usuario haciendo navegación intensiva = ~20 req/min. 20 usuarios simultáneos = ~400 req/min. **Espacio holgado**.
- Riesgo real: bursts si el Copilot ejecuta `analyze` orquestando 5-8 motores en paralelo → mitigado por semáforo del cliente HTTP (§3.1) y backoff en `429` [pack §6.2].

### 7.2 Latencia y UX
- SLA declarados [contract §8]: Master \<300ms, Financial \<1s, Signal batch pero cacheado, Semantic \<1s.
- Ficha canónica primer paint: 5 llamadas paralelas de las cuales el peor caso es Financial (\<1s) → p95 \<1.2s. **Aceptable** pero exige loading states granulares por motor (no un spinner global).
- **Riesgo:** Strategy `thesis` puede ser lento (evidence_tree + narrative IA). Marcarlo como carga diferida (segundo paint) en `resumen`.

### 7.3 Dependencias entre motores [contract §1 DAG]
```
Foundation (Master) ─► Financial ─► Signal ─► Semantic ─► Recommendation ─► Strategy ─► Transaction
```
- Recommendation depende de Semantic + Financial → orden §5 respeta el DAG.
- Strategy depende de Financial + Semantic + Recommendation → migrar Strategy en B.6.i, no antes.
- Transaction depende de Strategy (`convert`) para crear operaciones → B.6.h read-only + B.6.i Strategy son requisitos para crear operaciones reales.

### 7.4 Schema drift
- Contrato congelado `arroba-integration-contract-v1` [pack §2.5, §8]. Cambios rompedores exigen `arroba-v2` conviviendo.
- Cliente arroba lee `engine_version`/`*_version` de cada respuesta y alerta en logs si cambia inesperadamente [pack §7.3].
- Test de contrato en CI arroba (mirror del `Arroba Public Contract Freeze` [pack §7.3]): validar que los DTO generados desde `arroba.v1.json` se parsean sin `ValidationError`. Fallo → alerta P1.

### 7.5 Riesgo operativo: Agency Tool caído
- Cada motor renderiza `UnavailableBlock` con `reason` [pack §2.4].
- Circuit breaker (§3.1) evita spam. Retry sinuoso: reintentos 3× + backoff → si fallan, degradación completa.
- **La ficha sigue renderizando** con las partes que sí llegaron (Progressive Enhancement [pack §1.6]).

### 7.6 Datos huérfanos arroba
- `company_conversations` + `company_watchlists` + `company_analysis_refreshes` → **arroba local siempre**, no colisionan.
- **Riesgo:** cuando llegue watchlist v2 con push/suscripción [pack §8], el schema `company_watchlists` puede necesitar campo `agency_tool_subscription_id`. Revisitar en Sprint futuro.

### 7.7 Preview vs Producción
- Preview usa **dataset sintético** [pack §7.2 troubleshooting]. Datos reales solo en producción.
- **Consecuencia:** validación E2E del plan solo cierra al 100% cuando el usuario apunta arroba producción a la Base URL producción con datos reales. En preview validamos estructura, no valores.

### 7.8 Rotación de API Key
- Runbook [pack §7.1]: soporte de solape sin downtime. arroba debe implementar dos slots (`_PRIMARY`/`_SECONDARY`) en B.6.a para permitir rotación operativa.

---

## §8 · Roadmap por fases con criterios de aceptación binarios

### Fase B.6.a — Cliente Agency Tool + Master
**Goal:** montar el cliente HTTP base + primer motor (Master). Ver la ficha renderizada con identidad canónica real.
**Scope:** módulo `agency_tool_client/` con `client.py` + `master.py` + `dto/`; env vars `AGENCY_TOOL_BASE_URL` + `ARROBA_SERVICE_API_KEY_PRIMARY/_SECONDARY` + `AGENCY_TOOL_MODE`; proxy `/api/companies/{cif}/identity`.
**Endpoints tocados:** `GET /api/v1/master/{master_id}` (1 de 53).
**Criterios de aceptación:**
- [ ] AC1: `curl -H "X-API-Key: $KEY" ${BASE_URL}/api/v1/health` responde `200` en boot del backend arroba.
- [ ] AC2: `curl ${ARROBA}/api/companies/B47820150/identity` autenticado (buyer@) devuelve JSON con `master_id`, `identity.legal_name`, `classification.cnae_section`, `location.provincia`, `contact.web`, `provenance{}`, `sources[]`.
- [ ] AC3: Header `CompanyHeader.tsx` en producción muestra `contact.web` como link (no hardcode `castillatermal.com`).
- [ ] AC4: Rotación de API Key sin downtime: cambiar `_PRIMARY` en `.env` + `sudo supervisorctl restart backend` → siguiente request devuelve `200` con nueva key sin ventana de fallo.
- [ ] AC5: Logs estructurados emiten `engine=master`, `endpoint=/master/{id}`, `master_id`, `latency_ms`, `cache_hit`.
- [ ] AC6: `pytest` sigue en 157/157 + nuevos tests del cliente (mínimo 8) para 200/401/404/429/500/`unavailable`.
- [ ] AC7: Cliente cachea por `master_id` en Mongo `agency_tool_cache` con TTL 300s.
**Estimación:** 3-4 días.
**Dependencies:** ninguna previa. Bloqueado hasta que el user aporte `AGENCY_TOOL_BASE_URL` + `ARROBA_SERVICE_API_KEY`.
**Test plan:** curl smoke §6.1 pack + UI acceptance abrir `/empresa/B47820150` y verificar link web + `pytest` unitarios + `vitest` no regresa.
**Deprecación aplicada:** —

### Fase B.6.b — Financial `analyze`
**Goal:** Sustituir KPIs, P&L, Balance, Ratios locales por payload real de Financial.
**Scope:** `agency_tool_client/financial.py::analyze()`; proxy `/api/companies/{cif}/financial`; renderers `PLBlock`, `BalanceBlock`, `RatiosGridBlock`, `RevenueEvolutionBlock`, `RadarBlock`.
**Endpoints tocados:** `POST /financial-intelligence/analyze` (1).
**Criterios de aceptación:**
- [ ] AC1: `POST ${BASE_URL}/api/v1/financial-intelligence/analyze` para `B47820150` devuelve `kpis`, `income_statement`, `balance_sheet`, `ratios`, `financial_quality`, `engine_version` (curl con key real).
- [ ] AC2: `/api/companies/{cif}/financial` proxy devuelve el payload agregado con `sections.kpis`, `sections.pl`, `sections.balance`, `sections.ratios`.
- [ ] AC3: Ficha canónica sección `Finanzas` muestra P&L multi-año (revenue, EBITDA, EBIT, net_income al menos 3 años).
- [ ] AC4: Sección `Resumen` sustituye el `MetricsBlock` calculado localmente por el `kpis` real.
- [ ] AC5: `vitest` añade 8+ tests para los 5 renderers nuevos.
- [ ] AC6: `curl /api/companies/B47820150` sigue funcionando (Sprint 1 no rompe).
**Estimación:** 5-6 días (5 renderers nuevos + proxy + cliente).
**Dependencies:** B.6.a.
**Test plan:** curl + smoke UI + tests unitarios + regresión Sprint 1.
**Deprecación aplicada:** `build_kpi_metrics()`, `build_financials_metrics()`, `build_score_placeholder()` en `real` mode.

### Fase B.6.c — Financial `valuation` + `ratios/catalog`
**Goal:** Sustituir fórmula fija `revenue×1.5` por valoración real explicable.
**Scope:** `financial.valuation()` + `ratios_catalog()`; proxy `/api/companies/{cif}/valuation`; `ValuationBlock` enriquecido con `explanation` + tooltip fórmula ratios.
**Endpoints tocados:** `POST /financial-intelligence/valuation` + `GET /financial-intelligence/ratios/catalog` (2).
**Criterios de aceptación:**
- [ ] AC1: Curl real devuelve `enterprise_value`, `equity_value`, `range{low,high}`, `subject_ebitda_margin_percentile`, `comparables.peers[]`, `explanation`.
- [ ] AC2: Sección `Valoración` de la ficha muestra rango + método + explanation textual.
- [ ] AC3: `RatiosGridBlock` tiene tooltip con fórmula por ratio (del catálogo cacheado 24h).
- [ ] AC4: `POST /api/companies/{cif}/skills/value` (skill del Copilot) devuelve el payload real.
**Estimación:** 3 días.
**Dependencies:** B.6.b.
**Test plan:** curl + UI + skill test.
**Deprecación aplicada:** `build_valuation()`, `copilot/skills/value.py::execute_value` fórmula local.

### Fase B.6.d — Semantic `profile` + `similar` + `search`
**Goal:** Composer usa Universal Search real; ficha muestra perfil semántico + empresas similares semánticas.
**Scope:** `semantic.py`; proxy `/api/companies/{cif}/semantic`; sustituye `entities/lookup` en `/api/entities/lookup`; renderer `SemanticProfileBlock`.
**Endpoints tocados:** `profile`, `similar`, `search` (3).
**Criterios de aceptación:**
- [ ] AC1: Composer autocomplete devuelve resultados rankeados por `similarity_score` (no substring).
- [ ] AC2: Ficha sección `Resumen` renderiza `SemanticProfileBlock` con activities/products/markets/keywords chips + value_proposition texto.
- [ ] AC3: Bloque nuevo "Empresas similares" bajo `Mercado` con top-5 similar.
- [ ] AC4: Backward compat: `GET /api/entities/lookup?q=grupo` sigue funcionando (delega a semantic/search internamente).
**Estimación:** 4-5 días.
**Dependencies:** B.6.a.
**Test plan:** curl + Composer UI + regresión entities test.
**Deprecación aplicada:** `entities/service.py::lookup()` substring naïve.

### Fase B.6.e — Signal `analyze` + `history` + `catalog`
**Goal:** Sección `Señales` de la ficha deja de ser `UnavailableBlock` y muestra señales reales.
**Scope:** `signal.py`; proxy `/api/companies/{cif}/signals`; renderer `SignalsListBlock` con polaridad/severidad/`act-v1` botones inline.
**Endpoints tocados:** `analyze`, `history`, `catalog` (3).
**Criterios de aceptación:**
- [ ] AC1: Curl devuelve `signals[]` con `signal_type`, `polarity`, `severity`, `score`, `actions[]`, `signal_score`.
- [ ] AC2: Ficha sección `Señales` renderiza lista con badges de polaridad (verde/rojo/gris) + botón por acción del enum `act-v1`.
- [ ] AC3: Click en acción `analyze`/`value`/`compare` dispara el skill correspondiente del Copilot.
- [ ] AC4: Si Agency Tool devuelve `{status:"unavailable"}` para señales, ficha renderiza `UnavailableBlock` con `reason`.
**Estimación:** 4-5 días.
**Dependencies:** B.6.a.
**Test plan:** curl + UI + `act-v1` action wiring.
**Deprecación aplicada:** REQ-006 de Sprint 1 se cierra (deja de ser "pendiente Sprint 2").

### Fase B.6.f — Recommendation core (`comparables` + `explain` + `buyers` + `sellers`)
**Goal:** Comparables reales, buyers/sellers.
**Scope:** `recommendation.py`; proxy `/api/companies/{cif}/recommendations?type=`; `CompanyCardsGridBlock` reutilizado + `RecommendationExplainSheet`.
**Endpoints tocados:** `comparables`, `explain`, `buyers`, `sellers` (4).
**Criterios de aceptación:**
- [ ] AC1: Curl devuelve `items[]` con `fit_score`, `dimensions.{sector,size,geography,financial,semantic}`, `rationale`.
- [ ] AC2: Ficha sección `Mercado` muestra comparables con `fit_score` visible en cada card.
- [ ] AC3: Click en "Por qué es comparable" abre sheet con `explain` (factors + weights + narrative).
- [ ] AC4: Sección `Oportunidades` muestra al menos 1 tarjeta de "Compradores potenciales" y "Vendedores potenciales" si hay signal `for_sale`/`buying`.
**Estimación:** 4-5 días.
**Dependencies:** B.6.b + B.6.d.
**Test plan:** curl + UI + explain sheet.
**Deprecación aplicada:** `build_comparables()` + `_sector_with_adjacent()` + `copilot/skills/recommend.py::execute_recommend` fórmula local.

### Fase B.6.g — Recommendation `opportunities` + Signal `opportunities`/`sector`/`territory`
**Goal:** Oportunidades reales en la ficha + preparación Marketplace.
**Scope:** endpoints ya en clientes anteriores; proxy `/api/companies/{cif}/opportunities`; sección `oportunidades` de la ficha canónica deja hardcodes.
**Endpoints tocados:** `recommendation/opportunities`, `signal/opportunities`, `signal/sector`, `signal/territory` (4).
**Criterios de aceptación:**
- [ ] AC1: Sección `oportunidades` muestra chips reales (no `Buy & Build/Captación/Entrada` hardcoded).
- [ ] AC2: 3 cards descriptivas se llenan con `title`, `rationale`, `fit_score` reales.
- [ ] AC3: Endpoint `/api/companies/{cif}/opportunities` agrega ambas fuentes con dedupe.
- [ ] AC4: Endpoint `/api/platform/stats` cambia impl: si `AGENCY_TOOL_MODE=real`, devuelve conteos vacíos + `X-Provenance: unavailable` (deja de mentir 200 empresas).
**Estimación:** 3 días.
**Dependencies:** B.6.f.
**Test plan:** curl + UI verificando eliminación de hardcodes.
**Deprecación aplicada:** hardcodes de oportunidades en `CanonicalEntityMockupClient.tsx` L614 + L1121; `platform_stats_mock` (drop colección).

### Fase B.6.h — Transaction read-only (`workspace` + `next-action` + `timeline` + `risk`)
**Goal:** Panel derecho "Operación activa" del layout canónico consume datos reales de una transacción del user.
**Scope:** `transaction.py`; proxy `/api/companies/{cif}/transactions/current`; renderers `TransactionWorkspacePanel` (sustituye `<CanonicalDealPanel>`) + `NextActionCard` + `TimelineBlock` + `RiskBlock`.
**Endpoints tocados:** `workspace`, `next-action`, `timeline`, `risk` (4).
**Criterios de aceptación:**
- [ ] AC1: Si el user tiene una transacción activa vinculada al CIF, el panel derecho muestra `current_stage`, `state`, `next_action.recommended_action` con `why` + `confidence`.
- [ ] AC2: Timeline muestra `events[]` reales del OS (no hardcoded).
- [ ] AC3: Si no hay transacción, el panel muestra "Sin operación activa" + CTA "Reclamar mi empresa" (arroba local).
- [ ] AC4: `DEAL_SCENARIOS` object del mockup se elimina; queda solo el estado `none` como fallback UI.
- [ ] AC5: NO se cachea `workspace`/`next-action` (event-driven según §3.4).
**Estimación:** 5 días.
**Dependencies:** B.6.a + B.6.d + B.6.f.
**Test plan:** curl con user que tenga transacción + user sin transacción.
**Deprecación aplicada:** `DEAL_SCENARIOS` (233 líneas hardcoded).

### Fase B.6.i — Strategy `thesis` + `scenarios` + `decision` *(stretch)*
**Goal:** Nueva capacidad — bloque `Estrategia` en la ficha canónica.
**Scope:** `strategy.py`; proxy `/api/companies/{cif}/strategy`; renderer `ThesisBlock`.
**Endpoints tocados:** `thesis`, `scenarios`, `decision` (3).
**Criterios de aceptación:**
- [ ] AC1: Sección nueva "Tesis del Copilot" (dentro de `valoracion` o `resumen`) muestra las 5 dimensiones + score + narrative.
- [ ] AC2: Switcher de escenarios optimista/base/pesimista funcional.
- [ ] AC3: Confianza 7-factor visible como sparkline.
**Estimación:** 5 días.
**Dependencies:** B.6.b + B.6.d + B.6.f.
**Test plan:** curl + UI.
**Deprecación aplicada:** —

### Fase B.6.j — Deprecación y cierre
**Goal:** Eliminar mocks legacy definitivamente + limpiar código.
**Scope:** eliminar módulo `agency_tool_adapter/` completo (5 archivos); drop colecciones Mongo `master_companies_mock` + `platform_stats_mock` (migration script); eliminar seeds `seed_master_companies_e14.py` + `seed_platform_stats.py`; flag `AGENCY_TOOL_MODE` reducido a `real` (sin `mock`); actualizar CI freeze test para validar contrato `arroba.v1`.
**Endpoints tocados:** ninguno del contrato — solo housekeeping arroba.
**Criterios de aceptación:**
- [ ] AC1: `find /app/backend/src -type d -name "agency_tool_adapter"` devuelve vacío.
- [ ] AC2: `db.master_companies_mock.count() == 0`; drop collection.
- [ ] AC3: `db.platform_stats_mock.count() == 0`; drop collection.
- [ ] AC4: Ningún test referencia `master_companies_mock`.
- [ ] AC5: `AGENCY_TOOL_MODE=mock` en `.env` → backend rehúsa arrancar con mensaje explícito "mock mode retired, use real".
- [ ] AC6: `pytest` en 200+/200+ (algún test nuevo del cliente Agency Tool).
- [ ] AC7: C16 grep sigue en 0 en frontend product code.
**Estimación:** 2 días.
**Dependencies:** todas las fases anteriores operativas en `real`.
**Test plan:** full regression suite + freeze test contrato.
**Deprecación aplicada:** todos los items §6.1-6.20.

### Esfuerzo total estimado

| Bloque | Sub-fases | Días | Prereq |
|---|---|:---:|---|
| **Ruta crítica MVP** | B.6.a → B.6.f | 22-25 | Credenciales |
| **Enhancement** | B.6.g + B.6.h | 8 | MVP |
| **Stretch** | B.6.i | 5 | MVP |
| **Cierre** | B.6.j | 2 | Todo lo anterior |
| **Total** | 10 sub-fases | **~37-40 días** | |

MVP standalone: **22-25 días** para dejar la ficha canónica al 70-80% real.

---

## Objetivo cumplido

Con este plan cualquier iteración de arroba.com puede migrar de mocks a `arroba.v1` **sub-fase por sub-fase**, con criterios binarios verificables por `curl` + UI, sin big-bang, respetando el contrato congelado, el DAG canónico, la Regla 4 Sprint 1 (zero coupling FE→agency) y los anti-patrones [pack §1.7]. La deprecación de mocks está calendarizada, no diferida indefinidamente.

**Producción intacta** al terminar este plan: 0 archivos modificados, 3 archivos en `/app/memory/` (contrato + pack + este plan), tests `157/172` verdes.

**Bloqueadores externos:**
1. `ARROBA_SERVICE_API_KEY_PRIMARY` (secret · canal seguro).
2. `AGENCY_TOOL_BASE_URL` (preview o producción — el usuario decide qué entorno usar en B.6.a).
