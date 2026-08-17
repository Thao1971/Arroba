# DEPLOY_NOTES · bundle 2026-08-13

> ## 🔴 Push coordinado con Intel (HARDENING-REQ001b + REQ002 + REQ003 + REQ004 + REQ004b)
>
> El push que incluya **HARDENING-REQ001b** (búsqueda semántica NL),
> **HARDENING-REQ002** (página `/resultados`), **HARDENING-REQ003** (4
> modos + paginación server-side), **HARDENING-REQ004** (5º modo
> financiero) y **HARDENING-REQ004b** (parser multi-métrica + sector-scoped
> financiero + fix paginación) debe salir **en la misma ventana** en la
> que Intel ejecute:
>   - Intel redeploy en Prod.
>   - Ejecución de `reembed_semantic_openai.py` contra el Atlas de Prod.
>   - Endpoint `GET /api/v1/company-taxonomy/search` habilitado (rama
>     categórica REQ003 + resolución de `company_ids` para REQ004b sector
>     scoping). En dev pod ya responde con 898 hits para "agencias de
>     marketing" y 62 primary ids para el mismo residual.
>   - Endpoint `POST /api/v1/skills/search` con filtros numéricos + `has_domain`
>     habilitado (rama financiera REQ004). En dev pod ya responde con **25
>     hits** para "revenue_min ≥ 50M" (verificado 100% cumplen filtro), **237
>     hits** para "ebitda_min ≥ 1M" y **975 hits** para combo multi-métrica
>     revenue+employees.
>   - **REQ-004b (Intel)** `skills/search` debe **obedecer `filters.master_company_ids`**
>     como intersección (AND numérico + sector-scope). En dev pod Intel aún
>     **ignora** este filtro (verificado: Q "agencias marketing con EBITDA > 1M"
>     con `sector_scope_ids=62` devuelve 237 = idéntico al screen puro sin
>     residual). Comportamiento post-deploy Intel REQ-004b: intersección
>     ~5-15 hits para esa query.
>   - Emisión de `summary` enriquecido en cada `SearchHit` (revenue, ebitda,
>     ebitda_margin, growth_pct, signal_score, signal_badge, valuation, etc.).
>     En dev pod ya vienen poblados en las ramas taxonomy/semantic; skills/search
>     los emite parcialmente. Verificar en Prod tras el push.
>
> Sin ese re-embed la búsqueda semántica devuelve `empty_response` honesto.
> Sin el endpoint categórico habilitado la rama #3 devuelve 404 y cae al
> path semántico (fallback documentado). Sin `skills/search` la rama
> financiera #2 devuelve 404 y **cae a categorical/semantic** (fall-through
> aditivo, no `<Empty/>`; verificado con filtro absurdo `revenue_min=9.9e18`
> → 898 hits categorical). Sin obediencia a `master_company_ids` (REQ-004b
> Intel latente) → **screen puro** sin sector (aún útil, no error; ver
> comportamiento post-deploy Intel REQ-004b). Sin `summary` la tabla renderiza
> «—» en columnas financieras (degrade gracefully verificado).
>
> **Orden de modos en `_execute_search_real` (REQ004+REQ004b)**:
> `#1 CIF → #2 Financial (skills/search + sector-scoped ids) → #3 Categorical
>  (taxonomy) → #4 Name (resolve) → #5 Semantic (embeddings)`.
> El parser `parse_financial_query` es puro (regex + stdlib, cero I/O) y
> devuelve `None` si no detecta predicado numérico → NO entra la rama #2,
> se preserva el flujo REQ003 intacto para "agencias de marketing",
> "clínicas dentales en Valencia", etc. **REQ004b**: soporta multi-métrica
> (revenue + employees en una sola query) y sector-scoping (residual → ids
> via taxonomy → `master_company_ids` en `skills/search`).
>
> **Push aislado de REQ001b/REQ002/REQ003/REQ004/REQ004b antes del re-embed = feature inerte, inofensivo.**
>
> ### Backlog Intel
> - **REQ-INTEL** soporte de `offset`/`total` en `semantic-intelligence/search`
>   para paginación server-side (hoy slicing local sobre top-K).
> - **REQ-INTEL** `shareholder.type` para DPD granular en ownership.
> - **REQ-INTEL** `finances.provenance` / `market.provenance` consistencia.
> - **REQ-INTEL** `filter_by_signal_badge` server-side en taxonomy/skills
>   (para migrar HARDENING-032 fuera del client-side).
> - **REQ-INTEL** `summary` completo en filas de `skills/search` (hoy parcial;
>   la tabla renderiza «—» gracefully en columnas sin dato).
> - **REQ-INTEL** `skills/search` sectorial-aware residual query · **RESUELTO
>   en Beta por REQ004b vía `master_company_ids`**. Intel aún debe **obedecer**
>   el filtro (dev pod lo ignora). Repro:
>   ```
>   POST /api/v1/skills/search {"query":"","filters":{"ebitda_min":1000000,"master_company_ids":[62 ids]}} → total=237 (dev; espera ~5-15 post-REQ004b)
>   POST /api/v1/skills/search {"query":"","filters":{"ebitda_min":1000000}}                                → total=237
>   ```
> - **REQ-INTEL** `crecimiento` (`growth_pct`) vacío en el 100% de filas por
>   techo de dato histórico 1 año; requiere backfill YoY multi-año.
>
> ### Beta · Parser limitations (post-REQ004b) · edge cases no cubiertos
> * Combos dual con dos rangos separados por "y" (revenue AND ebitda ranges):
>   `"ingresos > 50M y EBITDA entre 1 y 5M"` → detecta solo el segundo.
> * `"5M de facturación"` tras `"más de 100 empleados"` → mapea 5M a
>   `employees_max` (esperado `revenue_max`).
> * `employees_min`/`employees_max` devueltos como `float` en vez de `int`
>   (Intel acepta ambos en JSON; solo estético).
> * Residual con ruido léxico: `"agencias que crezcan >20%"` → residual
>   `"agencias crezcan"` (verbo se cuela). Taxonomy lo ignora al no resolver;
>   cae a screen puro.
> Follow-up: hardening del parser cuando se detecten estos casos en uso real.



Bundle acumulado listo para push manual a Prod (`beta.arroba.com`). Todos los
cambios validados en dev pod contra Servier `B28184687` (auth + anon).

## Contenido del bundle

| ID              | Alcance                                              | Estado |
|:----------------|:-----------------------------------------------------|:------:|
| HARDENING-021   | Explicabilidad · Fase 1 (Tips) + Fase 2 (SrcDot) + Fase 3 (MethodDetails) | ✅ |
| HARDENING-004   | Backend · `POST /api/admin/cache/purge` (X-Admin-Token) | ✅ |
| HARDENING-022   | Redistribución Resumen · 7 bloques 1:1 spec           | ✅ |
| HARDENING-022b  | Wiring shapes reales Intel · retirado fallback verdict | ✅ |
| HARDENING-004b  | Pytest smoke `/purge` · 8/8 verdes en 50 ms          | ✅ |
| HARDENING-022c  | Cleanup Resumen · -177 L (5 items retirados)          | ✅ |
| GLOSARIO        | 5 keys nuevas (FACTURACION · ACTIVOS_TOTALES · QUALITY_SCORE · BUYER_FIT_SCORE · OPPORTUNITY_SCORE) | ✅ |
| HARDENING-005   | `scripts/post_deploy.sh` orquesta purge + smoke      | ✅ |
| HARDENING-022d  | Bundle correctivo · tooltips + rings sin focus azul + fallback verdict restaurado | ✅ |
| HARDENING-022e  | Root cause: colisión `.ring` con Tailwind utility · rename a `.aring` · verificado Blink+WebKit | ✅ |
| HARDENING-023   | DN/EBITDA display 3 estados (empty / no_debt / ebitda_neg / ratio) · unit test 11/11 PASS | ✅ |
| HARDENING-024   | BFF relay + DPD del bloque `opportunity` (Pydantic + provider + endpoint) · pytest 3/3 | ✅ |
| HARDENING-025   | Frontend cableado `opportunity` + Copilot dispatch chips + DN/EBITDA extraído a `@/lib/companies/dn-ebitda` · vitest 22/22 nuevos | ✅ |
| HARDENING-026   | Reskin `CopilotDock` (barra inferior anclada + panel colapsable) · elimina composer muerto y 3 chips R15 · vitest 36/36 Copilot | ✅ |
| HARDENING-REQ001| Intel real + hero search funcional + PlatformStats reshape (4 métricas) · reutiliza `AgencyToolClient` canónico (retry / dual-key / circuit breaker) · **NO añade nuevo cliente S2S** · pytest 12/12 platform_stats + vitest 104/104 · rewrite `/empresa/` → `/empresa-f01/` en 6 sitios | ✅ |
| HARDENING-REQ001b| Búsqueda semántica NL vía Intel `/api/v1/semantic-intelligence/search` · reutiliza `AgencyToolClient` canónico · `WorkspaceArea` navega a `/empresa-f01/{cif}` al hacer click en un resultado · **inerte hasta re-embed Intel** | ✅ |
| HARDENING-REQ002| Página pública `/resultados?q=...` con tabla rica (ingresos, EBITDA, crecim., score señales, actualizado) · Exportar CSV activo · Comparar/Columnas "Próximamente" · Orchestrator redirige search NL a `/resultados` en vez de pintar dentro del dock · **columnas financieras en «—» hasta que Intel emita `summary` en `SearchHit`** | ✅ |
| HARDENING-REQ003| Buscador 4 modos (CIF · categórico · nombre · NL) + paginación server-side (`offset`/`total`) + fail-fast 8s + política empty honesto en modo real (sin fallback a mock, R15) · `_row_to_item` helper único · nueva rama categórica llama `company-taxonomy/search` · smoke dev pod: CIF `B28184687` → ficha · "agencias de marketing" → 898 hits paginadas · "Servier" → disambiguation · "clínicas dentales en Valencia" → 49 hits semantic | ✅ |
| HARDENING-REQ004 | 5º modo · financial search (parser NL puro `financial_query.py` + rama `#2 FINANCIAL` con retorno tri-estado + fallback a categorical/semantic) · cliente canónico + `_intel_call_ff` · pytest 7/7 + smoke 5 queries (25 hits revenue≥50M, 62 hits combo EBITDA+empleados, fall-through OK) | ✅ |
| HARDENING-REQ004b| Parser multi-métrica + sector-scoped financiero (`_taxonomy_company_ids` resuelve residual→`master_company_ids`) + fix pagination `pt-8 pb-40` en `/resultados` · pytest 9/9 (7 originales + 2 combo) · smoke 5 queries · resuelve gap REQ-INTEL sectorial-aware residual (Beta scopea; Intel dev aún ignora → post-deploy REQ-004b Intel intersectará) | ✅ |
| HARDENING-BETA-para-emergent | Aterrizaje aislado de 4 blocks presentacionales (SingleExerciseChart · MarketReadingBlock · InvestmentCommitteeBlock · OpportunityThesisBlock) + preview interna `/{locale}/internal/blocks-preview` con mock data · **NO cableado a `CompanyFichaLayoutV2.tsx`** (regla monolito preservada · decisión de scope b2) · **NO proxies backend** (decisión de scope c3, HARDENING-038) · smoke tests 5/5 · TSC verde | ✅ |
| HARDENING-BETA-preview-scenarios | Selector `?scenario=proceed\|proceed_with_conditions\|pass` en `/internal/blocks-preview` con 3 mocks override del veredicto neutral · `useSearchParams` en `Suspense` + `Link scroll={false}` + `key={scenario}` para remount limpio · mini-fuzz visual de los 3 estados canónicos del Committee sin backend | ✅ |
| HARDENING-REQ004c | Parser margen EBITDA + comparador "al/del" (aditivo sobre REQ004b · `financial_query.py` 194 LOC · **10/10 pytests** · 9 REQ004b regresión + 1 nuevo `test_ebitda_margin`) · Intel dev responde 500 hits para `margen > 15%` y `> 30%` · growth vs margen desambiguado por contexto (`"crezcan >20%"` sigue siendo growth, no margen) · sólo `financial_query.py` + `test_financial_query.py` (ficheros `intel/*` del zip son del otro repo) | ✅ |
| HARDENING-028   | `post_deploy.sh` blindado · Paso 0 rebuild+restart local · Paso 6 smoke retry backoff (~5 min) contra `/api/platform/stats` | ✅ |
| HARDENING-029   | Retiro ruta legacy `/empresa/[cif]` · regex `ENTITY_COMPANY_RE` → `/empresa-f01/` · 3 tests de tools migrados | ✅ |
| HARDENING-032   | Chips filtro `signal_badge` client-side (crecimiento + excluir riesgo) en `/resultados` · 8 unit tests · empty state extra | ✅ |
| HARDENING-033   | CTA contextual post-filtrado (`auth → /me/watchlists/new` · `anon → /registro?next=`) · 4 unit tests | ✅ |
| HARDENING-037   | Wiring dinámico via `sectionRegistry.tsx` (Mercado · Oportunidades · Comité) + retirado nav `sucesion`/`sector` · monolito lifted temporalmente (autorizado por usuario) · `data-testid="section-{active}"` en wrapper · 3 blocks presentacionales renderizando desde adapters `layout/adapters.ts` (undefined explícito para campos sin fuente Intel) | ✅ |
| HARDENING-038   | 5 proxies backend JWT-gated bajo `/api/companies/{cif}/*` (committee POST · committee/export · succession · rollup · market-reading) · cliente canónico `get_agency_tool_client()` + `_intel_call_ff` · cache TTL vía módulo compartido · 502 estructurado en fallo upstream (nunca 500) · sin cookie → 401 verificado local | ✅ |
| HARDENING-038-hotfix-rollup | Hotfix 1 línea sobre `intel_ficha_proxies.rollup_thesis()`: query param Intel `cnae_code` → `cnae_value` (Emergent verificó que Intel `investment-intelligence/rollup-thesis` espera `cnae_value` desde 2026-08-17). Preview post-fix: `/rollup` devuelve **200 JSON** en 6.5s con `fragmentation.hhi`, `cnae_value=C`, etc. Bundle sigue en **28 unidades** consolidadas (hotfix intra-bundle, no incrementa contador). | ✅ |
| HARDENING-038c-hotfix-timeout | Cap propio de ficha `_FICHA_TIMEOUT_S=7.5s` con `asyncio.wait_for` envolviendo `_intel_call_ff` en `_get_json`/`_post_json`. Resuelve carrera edge Emergent preview (~7.6-8.1s) vs `_intel_call_ff` (8s) que devolvía HTML 502 antes de que el backend emitiera 502 JSON estructurado. `except Exception` amplio (R15 · degradación honesta cubre también `asyncio.TimeoutError`). Preview post-fix: `market-reading` **200 JSON payload real** (5.75s) · `succession` **200 JSON payload real** con administrador (0.93s) · `rollup` **200 JSON payload** (1.69s cache) · **committee POST sigue 502 HTML** (motor IA `investment-decision/analyze` excede 7.5s → backend responde 502 JSON en 7.504s local, edge Emergent preview corta antes). Contrato de API sano en 4 de 5 rutas. Bundle sigue en **28 unidades** consolidadas. Committee requerirá HARDENING-038d (Intel: precomputar/cachear narrativa IA o convertir committee en async lanzar+consultar). | ✅ parcial (4/5) |
| HARDENING-038b   | Cableado de datos server-side de las 3 pestañas Intel. `CompanyFichaF01Client.tsx` añade 3 `useSWR` auth-gated (`marketReading` · `succession` · `rollup`) con `catch→null` tolerante. `CompanyFichaLayoutV2.tsx` recibe 3 props opcionales pass-through y llama adapter con `props.opportunity ?? null, props.succession, props.rollup`. `adapters.ts` extiende con `mapSell(succession)`/`mapBuy(rollup)` + tipos `SuccessionRaw`/`RollupRaw`; R15 estricto (targets solo si `name+fit_score numérico`, `viable` derivado de `viable` o `targets.length>0`). `marketBlockToContextView(market, reading?)`. 7 tests nuevos en `adapters.test.ts`. Preview verificado: **Mercado renderiza `reading` IA real** (`"La compañía ocupa una posición de liderazgo inequívoco... HHI de 10.000..."`). | ✅ |
| HARDENING-030    | Logos reales ARROBA en cabecera `AuthHeader.tsx`, panel auth `BrandPanel.tsx` (variante blanca `/brand/logo-white.png`), footer público `PublicFooter.tsx`. Assets: `public/brand/logo.png` (reemplaza crop) + `public/brand/logo-white.png` (nuevo). | ✅ |
| HARDENING-030b   | Botón minimizar Copilot dock con FAB circular + `ChevronDown` + persistencia `localStorage['arroba_dock_min']`. data-testids `copilot-dock-collapse` y `copilot-dock-restore` verificados en preview (click collapse → FAB, click restore → dock). | ✅ |
| HARDENING-031    | Filtros `/resultados` persistidos en URL query (`sector`, `growth=1`, `norisk=1`, `page=N`). `useRef prevQ` para distinguir primer montaje (hidrata desde URL) de nueva búsqueda (reset). `router.replace` con `{scroll:false}`. Preview verificado: click filtro → URL `?q=...&growth=1` · reload → filtro persiste. | ✅ |
| HARDENING-038d   | **P1 futuro (fuera de scope bundle 28)**. Lado Intel: async lanzar+consultar en `investment-decision/analyze` o precomputar/cachear narrativa IA para que `committee POST` responda <7.5s. Frontend hoy degrada limpio: al click "Ver deliberación" con motor Intel inactivo → mensaje neutro **"No hemos podido reunir al comité en este momento. Reintentar"** (verificado en preview). | ⏳ |

## Env vars en Prod (post-REQ-001)

**Imprescindible para salir del modo mock**:
- `AGENCY_TOOL_MODE=real` (canónico, ya existía en `IntelligenceSettings`). Toggle único global. No hay `ADAPTER_MODE` separado — se descartó del zip REQ-001.

**Ya existentes (NO tocar en Prod, ya funcionan para el `/ficha`)**:
- `AGENCY_TOOL_BASE_URL=https://intel.arroba.com`
- `ARROBA_SERVICE_API_KEY_PRIMARY=<clave>` (reutilizada por REQ-001 sin duplicar)
- `ARROBA_SERVICE_API_KEY_SECONDARY=<clave>` (fallback rotación, opcional)
- `ARROBA_ADMIN_TOKEN=<token>` (para `/api/admin/*`)

## Paso post-deploy · re-seed de `platform_stats_mock`

El shape público de `PlatformStats` cambió a las 4 métricas canónicas REQ-001. La colección `platform_stats_mock` de Prod contiene el shape legacy (8 métricas) → hay que sobrescribir el singleton. El usuario ejecuta:

```bash
curl -X POST "https://beta.arroba.com/api/admin/agency-tool/platform-stats-mock" \
  -H "X-Admin-Token: $ARROBA_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companies_analyzed": 24992,
    "active_opportunities": 672190,
    "market_movements": 28458,
    "signals_detected": 6159,
    "confidence": 1.0,
    "lineage": "raw"
  }'
```

Verificación:
```bash
curl -s "https://beta.arroba.com/api/platform/stats" | jq '{companies_analyzed, active_opportunities, market_movements, signals_detected, provenance}'
```
Con `AGENCY_TOOL_MODE=real` el body debería venir de Intel directamente (`provenance: live`, sin necesidad del re-seed anterior). Si el re-seed se aplica primero, sirve de fallback offline.

## Smoke home post-push
- Home pública (anon): las 4 tarjetas de métricas cargan con números reales (grid `md:grid-cols-4`, sin la 8ª "cross_sectors").
- Buscador hero: escribir un CIF (`B28184687`) → navega a `/es/empresa-f01/B28184687`. Escribir una razón social → resultados/desambiguación.
- Chrome + Safari.

Detalle completo por bloque: `/app/memory/PLAN_BETA_status_20260810.md`.

## Verificaciones pre-push

- `yarn typecheck` verde (1.9 s).
- `yarn build` verde (17.3 s) · First Load JS shared **87.3 kB** (baseline, sin regresión).
- **⚠️ Regla operativa preview dev**: tras cada `yarn build`, ejecutar `sudo supervisorctl restart frontend`. Next.js con `next start` cachea el manifest en memoria del proceso Node y no hot-reloadea con nuevos builds — sin restart el pod sigue sirviendo la build anterior. Verificar con `ls -la /app/frontend/.next/BUILD_ID` (mtime) vs `supervisorctl status frontend` (uptime): si el uptime es anterior al mtime, restart obligatorio.
- `pytest tests/test_admin_cache_purge.py -m smoke` · **8/8 passed in 0.05 s**.
- Curl `/api/companies/B28184687/ficha?authenticated=true` responde con los shapes 022b (`identity.activity_es`, `verified`, `auditor`, `linkedin_url`, `description_source`, `finances.has_financials`, `finances.provenance.kpis.net_debt_ebitda`).

## Secuencia de deploy (5 pasos)

```bash
# 1. Sync token admin en panel Emergent Prod (env var ARROBA_ADMIN_TOKEN)
#    Generar valor con:  python3 -c "import secrets; print(secrets.token_urlsafe(48))"

# 2. Deploy del bundle desde el panel (Save to GitHub → Deploy).

# 3. Post-deploy automatizado:
export ARROBA_ADMIN_TOKEN='<valor-sincronizado-en-Prod>'
bash scripts/post_deploy.sh
# Exit 0 → OK. Exit 1 → revisar output y logs backend.

# 4. Smoke visual manual en https://beta.arroba.com/es/empresa-f01/B28184687:
#    (auth con test.arroba+neo@arroba.com según /app/memory/test_credentials.md)
#    ▸ Cabecera renovada con URL clicable + badges Verificada + Auditada · ERNST & YOUNG
#    ▸ 4 KPIs T2 (Facturación · EBITDA · DN/EBITDA · Activos totales) con sparklines + SrcDot
#    ▸ T3 Resumen prosa oscura con disclaimer "generada por IA"
#    ▸ T4 Tesis de oportunidad como prosa continua (opportunity.thesis.narrative en Prod)
#    ▸ Chips oportunidades en cabecera (opportunity.chips[] en Prod)
#    ▸ T5 Detalles de la compañía (rename Identificación) sin bloque legacy debajo
#    ▸ T6 Diagnóstico 3 rings sin card wrapper, tooltips activos (hover en labels)
#    ▸ T7 Evolución al final

# 5. Si algún check falla → rollback vía panel Emergent + reporte al equipo.
```

## Prerrequisitos ambiente Prod

- `MONGO_URL` sin cambios (misma base).
- `ARROBA_ADMIN_TOKEN` nuevo — **debe existir antes del deploy**, si no el
  endpoint `/api/admin/cache/purge` responde 503 (fail-safe) y `post_deploy.sh`
  falla en el paso (a).
- Resto de env vars sin tocar.

## Rollback

Vía panel Emergent · botón "Rollback" a checkpoint anterior. El endpoint
`/api/admin/cache/purge` es aditivo (nuevo router), no reemplaza nada: el
rollback no requiere cleanup adicional del cache (los `_id` legacy en Mongo
siguen siendo compatibles con el layout pre-022).

## Notas para el usuario

- El fallback legacy `finances.assessment.verdict` fue **retirado** en 022b.
  Si Intel Prod aún no emite `opportunity.thesis.narrative` para algún CIF,
  ese CIF verá "Información en preparación · Tesis de oportunidad" (R15
  estricto). No es un bug — es el comportamiento intencional post-canon CF.
- La pestaña **Comparativa** sigue stashed en
  `/tmp/wip_comparativa_20260813/comparativa_wip.diff` (no incluida en este bundle).

## Cableado HARDENING-037 + HARDENING-038 · resuelto en bundle 28

Los 4 blocks presentacionales aterrizados por HARDENING-BETA-para-emergent
(MarketReadingBlock · OpportunityThesisBlock · InvestmentCommitteeBlock ·
SingleExerciseChart) ya no viven aislados en `/internal/blocks-preview`.
Bundle 28 los cablea al monolito vía **registro declarativo de secciones** y
añade **5 proxies backend** JWT-gated.

### HARDENING-037 · Cableado layout (monolito lifted por autorización explícita)

- Nuevo módulo `frontend/src/components/company/layout/sectionRegistry.tsx`:
  tabla `EXTENSION_SECTIONS[]` con `{id, label, icon, group, ready, render(ctx)}`
  para las 3 nuevas pestañas (`mercado` · `oportunidades` · `comite`).
- `CompanyFichaLayoutV2.tsx` resuelve `getSection(active)?.render(ctx)` **antes**
  del switch inline (líneas 3220-3259). El monolito solo (1) construye
  `FichaSectionContext` con `cif`, `anon`, `market`, `opportunity` y
  `runCommittee` inyectado, y (2) delega el render al registro.
- Wrapper canónico `<section data-testid="section-{active}">` habilita
  smoke E2E de las 3 pestañas nuevas sin scraping DOM frágil.
- Retirados del `NAV[]`: `sucesion` y `sector` (absorbidos por
  `oportunidades` vía `OpportunityThesisBlock` con `sell`/`buy`).
- Nuevo módulo `frontend/src/components/company/layout/adapters.ts`:
  funciones puras `marketBlockToContextView` + `opportunityToThesisView`
  con **R15 estricto** (todo campo sin fuente Intel → `undefined` explícito;
  los blocks ya renderizan `<Empty/>` cuando reciben `undefined`).

### HARDENING-038 · Proxies backend Intel

Cinco endpoints bajo `/api/companies/{cif}/*` en
`backend/src/modules/companies/router.py`, todos gated por
`Depends(get_current_user)` (401 sin cookie) y con cliente canónico
`get_agency_tool_client()` + `_intel_call_ff` (fail-fast 8s) en
`backend/src/modules/copilot/intel_ficha_proxies.py`:

| Método | Ruta                                                        | Intel upstream                                                          | Notas |
|:-------|:------------------------------------------------------------|:------------------------------------------------------------------------|:------|
| POST   | `/api/companies/{cif}/committee?lens=neutral\|buyer\|investor` | `/api/v1/investment-decision/analyze` (mapa lens→`buyer_profile`)     | Cacheado por `(cif, lens)`. |
| GET    | `/api/companies/{cif}/committee/export/{decision_id}?format=pdf\|json` | `/api/v1/investment-decision/{id}/export-payload`             | Export del veredicto. |
| GET    | `/api/companies/{cif}/succession`                           | `signal-intelligence/succession-profile/{cif}`                          | Sub-payload `sell` de Oportunidades. |
| GET    | `/api/companies/{cif}/rollup`                               | `investment-intelligence/rollup-thesis` + `/fragmentation`              | Sub-payload `buy` de Oportunidades. |
| GET    | `/api/companies/{cif}/market-reading`                       | `generate_summary market_reading` (cacheado)                            | Extiende payload actual del bloque Mercado. |

**Degradación honesta verificada (smoke dev pod, `B28184687` autenticado)**:
- committee POST · succession · rollup → **502 estructurado**
  `{"detail":"http_error","code":"http_502"}` — motores Intel dev inactivos.
  Frontend renderiza los `<Empty/>` correspondientes (idle state en Comité,
  "No hemos detectado oportunidades..." en Oportunidades).
- market-reading → **200** con `reading` real (Intel dev sí lo expone).
- Sin cookie → 401 en las 5 rutas.

### Prerrequisitos Intel dev para "lentes al completo"

Post-deploy Intel debe activar los motores (aún inactivos en dev pod):
- `investment-decision/analyze` (Comité 10 especialistas)
- `investment-decision/{id}/export-payload` (Export veredicto)
- `signal-intelligence/succession-profile/{cif}` (Sucesión narrativa)
- `investment-intelligence/rollup-thesis` + `/fragmentation` (Roll-up + fragmentación)

`market-reading` ya está activo. Bundle 28 no bloquea deploy — degrada.


## Screenshots R15 · bundle 28

Ubicación: `/app/docs/bundle28_screenshots/`

| Archivo                              | Pestaña       | Estado renderizado |
|:-------------------------------------|:--------------|:-------------------|
| `bundle28_market.png`                | Mercado       | Título "Mercado" + área vacía (`ficha.market=null` en aggregator, honesto R15). |
| `bundle28_opportunities.png`         | Oportunidades | "No hemos detectado oportunidades de operación con los datos disponibles." |
| `bundle28_committee.png`             | Comité        | Idle: lente `neutral` preseleccionada, 10 celdas de especialistas visibles, botón "Ver deliberación del comité" — sin veredicto (motor Intel inactivo). |

Contexto de las capturas:
- URL: `https://musing-hellman-9.preview.emergentagent.com/empresa-f01/B28184687`
  (Laboratorios Servier · Verificada · Auditada · ERNST & YOUNG).
- Usuario autenticado: `test.arroba+neo@arroba.com` (subscriber, cookie
  `arroba_session=sess_vQ21L1pmnOf24Z0...`, secure+httpOnly).
- Estado Intel real por endpoint (verificado curl local):
  * committee POST → 502 upstream
  * succession → 502 upstream
  * rollup → 502 upstream
  * market-reading → 200 payload real
  * committee/export → no ejercido (requiere `decision_id` de un `analyze` previo)


## Cableado pendiente · HARDENING-038b (post-bundle 28, congelado)

Doc vivo en `/app/docs/HARDENING-038b_opportunity_full_wiring.md`.
Alcance: fetch `succession_profile` + `rollup_thesis` server-side en el
data-loader parent (`CompanyFichaF01Client.tsx`) para poblar `sell.*` y
`buy.*` en `OpportunityThesisView`. Sin motores Intel dev activos hoy no
aporta señal — se retoma cuando el usuario lo autorice.

