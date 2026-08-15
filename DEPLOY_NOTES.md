# DEPLOY_NOTES · bundle 2026-08-13

> ## 🔴 Push coordinado con Intel (HARDENING-REQ001b + REQ002 + REQ003 + REQ004)
>
> El push que incluya **HARDENING-REQ001b** (búsqueda semántica NL),
> **HARDENING-REQ002** (página `/resultados`), **HARDENING-REQ003** (4
> modos + paginación server-side) y **HARDENING-REQ004** (5º modo
> financiero) debe salir **en la misma ventana** en la que Intel ejecute:
>   - Intel redeploy en Prod.
>   - Ejecución de `reembed_semantic_openai.py` contra el Atlas de Prod.
>   - Endpoint `GET /api/v1/company-taxonomy/search` habilitado (rama
>     categórica REQ003). En dev pod ya responde con 898 hits para
>     "agencias de marketing".
>   - Endpoint `POST /api/v1/skills/search` con filtros numéricos + `has_domain`
>     habilitado (rama financiera REQ004). En dev pod ya responde con **62
>     hits** para "agencias con EBITDA > 1M y más de 100 empleados" y **12
>     hits** para "empresas con ingresos > 50M".
>   - Emisión de `summary` enriquecido en cada `SearchHit` (revenue, ebitda,
>     ebitda_margin, growth_pct, signal_score, signal_badge, valuation, etc.).
>     En dev pod ya vienen poblados en las ramas taxonomy/semantic; skills/search
>     los emite parcialmente (revenue+ebitda+growth+signal en Q2; parcial en Q1).
>     Verificar en Prod tras el push.
>
> Sin ese re-embed la búsqueda semántica devuelve `empty_response` honesto.
> Sin el endpoint categórico habilitado la rama #3 devuelve 404 y cae al
> path semántico (fallback documentado). Sin `skills/search` la rama
> financiera #2 devuelve 404 y **cae a categorical/semantic** (fall-through
> aditivo, no `<Empty/>`; verificado con filtro absurdo `revenue_min=9.9e18`
> → 898 hits categorical). Sin `summary` la tabla renderiza «—» en columnas
> financieras (degrade gracefully verificado).
>
> **Orden de modos en `_execute_search_real` (REQ004)**:
> `#1 CIF → #2 Financial (skills/search) → #3 Categorical (taxonomy) →
>  #4 Name (resolve) → #5 Semantic (embeddings)`.
> El parser `parse_financial_query` es puro (regex + stdlib, cero I/O) y
> devuelve `None` si no detecta predicado numérico → NO entra la rama #2,
> se preserva el flujo REQ003 intacto para "agencias de marketing",
> "clínicas dentales en Valencia", etc.
>
> **Push aislado de REQ001b/REQ002/REQ003/REQ004 antes del re-embed = feature inerte, inofensivo.**
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
> - **REQ-INTEL** `skills/search` sectorial-aware residual query
>   Cuando `skills/search` recibe `query` no-vacío junto con filtros numéricos,
>   aplicar el `query` como CNAE-hint / taxonomy-hint (misma lógica que
>   `company-taxonomy/search`) en vez de full-text sobre `name`.
>   Sin esto, queries mixtas tipo "agencias de marketing con EBITDA > 1M"
>   degradan silenciosamente a fall-through categorical (898 hits sectoriales
>   sin AND numérico).
>   Repro:
>   ```
>   POST /api/v1/skills/search {"query":"agencias marketing","filters":{"ebitda_min":1000000}} → total=0
>   POST /api/v1/skills/search {"query":"","filters":{"ebitda_min":1000000}}                    → total=237
>   GET  /api/v1/company-taxonomy/search?q=agencias%20de%20marketing                            → total=898
>   ```
>   Universo esperado: intersección ~5-15 hits.


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
| HARDENING-028   | `post_deploy.sh` blindado · Paso 0 rebuild+restart local · Paso 6 smoke retry backoff (~5 min) contra `/api/platform/stats` | ✅ |

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
