# arroba.com — PRD (estado del proyecto)

> **Última actualización**: 2026-09-09 — **🟢 Batch Beta contraparte Intel (3 puntos + amend `name_parts`) aplicado en preview · verificado · sin deploy**.
>
> ### 2026-09-09 · Batch Beta contraparte Intel (3 puntos)
>
> **Estado:** ✅ Aplicado en preview, verificado, sin deploy.
>
> **Punto 1 BONUS · Eliminación `_enrich_disambiguation_with_financials()`**
> - Motivo: `/resolve` ya devuelve `matches[i].summary` completo (revenue, ebitda, ebitda_margin, growth_pct, signal_score, valuation, employees, year, city). La segunda llamada a `/skills/search` con `master_company_ids` era redundante y además tenía un join imposible (Intel usa `mc_...` en `/resolve` y UUID en `/skills/search`, el join nunca casaba → `summary=None` → UI "—").
> - Cambio: en rama `#4 resolve by name` de `_execute_search_real()`, cuando `pathname == "/resultados"`, montar `SearchResultsBlock` directamente con los datos de `matches[i]`. Comportamiento del dock intacto (sin `pathname == "/resultados"` sigue devolviendo `disambiguation`).
> - Función `_enrich_disambiguation_with_financials()` eliminada. Fichero de tests `test_copilot_search_disambiguation_enrichment.py` eliminado (deprecated).
> - Nuevo test `test_copilot_search_resolve_summary_passthrough.py` añadido para cubrir el path BONUS (3 tests verdes).
>
> **Punto 2 · sort_by/sort_dir · Grupo A (5 columnas)**
> - Añadidos `sort_by?: string | null` y `sort_dir?: 'asc' | 'desc' | null` a `SearchSkillRequest` (frontend `types.ts` + backend Pydantic `copilot/models.py`).
> - `apiClient.copilot.search()` reenvía ambos campos.
> - Backend `_execute_search_real()` / `_try_taxonomy()` / `_taxonomy_search()` / `_semantic_search_results()` / `_financial_search_results()` hace passthrough a Intel como query params o campos del payload. Beta NO ordena — solo pasa.
> - Whitelist Grupo A (frontend `SORT_A_MAP`): `empresa→name`, `facturacion→revenue`, `ebitda→ebitda`, `empleados→employees`, `cif→cif`.
> - Grupo B (Crecimiento %, Score señales, Valoración, Score Arroba) mantiene `useMemo(sortedRows)` front-only.
> - `toggleSort()` en `resultados/page.tsx` resetea a página 0 al ordenar por Grupo A (dispara `fetchResults(q, 0, {sort_by, sort_dir})`).
> - Log de verificación: `GET https://intel.arroba.com/api/v1/company-taxonomy/search?...&sort_by=revenue&sort_dir=desc "HTTP/1.1 200 OK"` — passthrough OK. Intel devuelve 200 pero aún no reordena server-side (feature latente upstream, la UI ya está lista).
>
> **Punto 3 · Buscador predictivo `/api/companies/suggest` + amend `name_parts`**
> - Proxy fino `GET /api/companies/suggest` en Beta (`companies/router.py` L60-86), passthrough a Intel `/api/v1/companies/suggest`, fail-fast ~8s. En cualquier error (404 upstream, timeout, excepción) devuelve `{"suggestions": [], "source": "error"}`.
> - `apiClient.companies.suggest(q, limit)` en frontend.
> - Componente dropdown **inline** bajo el buscador principal de `/resultados` (justificación: único consumidor, depende del state local del input, <60 líneas). Debounce ~200ms, arranque en 2 chars, flechas/Enter/Escape, accesibilidad `role="combobox"` + `role="listbox"` + `role="option"` + `aria-activedescendant`. Selección → `/empresa-f01/{cif}`. Enter sin selección → búsqueda normal.
> - Amend `name_parts`: Intel devuelve `{before, match, after}` por resultado. Dropdown renderiza `<span>{before}</span><strong className="font-semibold text-text">{match}</strong><span>{after}</span>`. Fallback a `legal_name` sin resaltado si `name_parts` no viene (R15: no fabricar highlight en Beta con `indexOf` propio). Estilo `font-semibold text-text` elegido por convención de `_result-cta.tsx` en el mismo directorio.
> - Verificación upstream: `GET https://intel.arroba.com/api/v1/companies/suggest?q=serv → HTTP 404` — endpoint upstream latente. Beta cae al fallback silencioso (dropdown no se abre). Cuando Intel despliegue, tanto el dropdown como el highlight de `name_parts` se activan automáticamente sin más cambios de código.
>
> **Baseline post-batch**
> - pytest: **327 passed / 37 legacy failures** (-3 respecto a 330 por eliminación de `test_copilot_search_disambiguation_enrichment.py`).
> - vitest: 257 passed / 1 legacy R14 (atoms Tip/SrcDot/MethodDetails).
> - tsc: 0 errores (`Done in 6.99s`).
> - build: OK (`Done in 20.57s`) · `/resultados` 12.4 kB · shared 87.3 kB.
> - supervisor: backend + frontend RUNNING tras restart.
>
> **No desplegado.** Queda en preview `musing-hellman-9.preview.emergentagent.com` hasta autorización explícita de Daniel.
>
> **Contraparte Intel (informativo, no aplica a este pod):** batch conjunto de 3 puntos — fix desempate paginación, `sort_by`/`sort_dir` en 2 endpoints, endpoint nuevo `/api/v1/companies/suggest` con `name_parts`. Puntos 2 y 3 de Beta dependen del deploy de esas contrapartes en Intel para funcionar completos.
>
> **Nota de proceso:** el snippet de test `test_copilot_search_resolve_summary_passthrough.py` incluido en el brief de este batch tenía dos bugs (import `SearchContext` en vez de `SkillContext`, aridad de `_execute_search_real` — pide 3 args `request, q, q_norm`, no 1). Reescrito en la verificación real de pytest — cubre los 3 casos originales, mock a nivel módulo de `_intel_call_ff` (la closure interna `_resolve` no es parcheable). Regla de proceso acordada: en futuros brief con tests nuevos, verificar firma de las funciones referenciadas con `grep` antes de escribir el test.
>
> ---
>
> **Última actualización previa**: 2026-09-07 — **🟢 Pack Beta-290826-deploy-pendiente aplicado parcialmente: 13 Bucket B en preview · 4 Bucket C elevados a Daniel · sin deploy**. Autorización literal del usuario en `MENSAJE_BETA_backlog_completo.md` interno del ZIP.
>
> **Fuente**: `Beta-290826_deploy_pendiente_20260907_115714.zip` (244 KB, 37 ficheros técnicos + 2 mds trazabilidad). Triage diff-first archivo por archivo:
>
> - **Bucket A (17 ficheros idénticos)** — skip (bloques 16 dark mode + 17 DealAsideCard + market_map + sector/[code] + territorio/[level]/[code] + Sidebar + SpainMap + hotfix build 28/08 + resto de identidades).
> - **Bucket B (13 ficheros aplicados)** — pack es superset funcional del HEAD del pod. Aplicados vía `cp` idempotente:
>   1. `backend/tests/test_copilot_search_disambiguation_enrichment.py` (nuevo, 6 tests bloque 20)
>   2. `backend/tests/test_copilot_search_related_entities.py` (+38 líneas, 5→8 tests bloque 19)
>   3. `backend/tests/test_entities_sector_territory.py` (+38 líneas, 4→12 tests bloque 19)
>   4. `backend/src/modules/copilot/service.py` (+125 líneas · bloque 19 workspace/related_entities + bloque 20 `_enrich_disambiguation_with_financials`)
>   5. `backend/src/modules/entities/service.py` (+26 líneas · fix bloque 19)
>   6. `frontend/src/app/[locale]/(public)/layout.tsx` (+4)
>   7. `frontend/src/app/[locale]/(authenticated)/mapa-empresarial/page.tsx` (mismos counts semánticos + SpainMap extra)
>   8. `frontend/src/app/[locale]/(authenticated)/resultados/page.tsx` (bloque 15 secciones separadas · `relatedEntityHref` preservado)
>   9. `frontend/src/lib/api/client.ts` (+11 · endpoint `resolve`)
>   10. `frontend/src/lib/companies/types.ts` (+17 · `CompanyResolveResponse`)
>   11. `frontend/tailwind.config.ts` (+10)
>   12. `frontend/src/components/company/layout/fichaMockupCss.ts` (no-op semántico, solo orden CSS)
>   13. `frontend/src/components/company/FichaLoadingScreen.tsx` (+156 líneas · bloque 21 pulido: tema activo con tokens semánticos + `Recuerda` configurables + destello CIF)
> - **Bucket C (4 ficheros ELEVADOS a Daniel — NO aplicados)** — el pack borraría trabajo del pod:
>   - `frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` (+91 HEAD-only) — pack borra P4 identidad (audited/balance_model/last_balance_year), P3 (`resolveSingleExerciseCascade`), Fase 2 (`capitalMarkets`/CNMV/BME), Fase 5 (hero cards Calidad/Score de solvencia + icono ámbar `verified===false`), HARDENING-023 (`computeDnEbitdaState` DN/EBITDA 4 estados).
>   - `frontend/src/components/company/CompanyFichaF01Client.tsx` (+23 HEAD-only) — pack borra los 3 campos identity en `adaptIdentityFromFicha` + `capitalMarkets` passthrough (Fase 2). Wiring de `FichaLoadingScreen` sí lo tiene el pack.
>   - `frontend/src/app/[locale]/internal/blocks-preview/page.tsx` (+1 HEAD-only) — cambio trivial de className (`bg-warning/10` pack vs `bg-warning-subtle/40` HEAD). C leve.
>   - `frontend/src/components/blocks/committee/InvestmentCommitteeBlock.tsx` (+1 HEAD-only) — mismo patrón trivial (`bg-danger/10` pack vs `bg-danger-subtle/40` HEAD). C leve.
>
> **Verificación consolidada post-aplicación**:
> - `yarn tsc --noEmit` → **0 errores** ✅
> - `yarn build` → **verde (20.84s)** ✅
> - `yarn vitest run` global → **257 passed / 1 legacy R14** ✅
> - `yarn vitest run SingleExerciseChart.test.ts` → **12/12** ✅ (P3 intacto)
> - `yarn eslint src --max-warnings=0` → **4 warnings legacy** en ficheros no tocados ✅
> - `pytest` global → **330 passed / 37 legacy HARDENING-002** ✅ (+9 tests nuevos bloques 19+20)
> - Tests específicos bloques 19+20: `pytest test_copilot_search_related_entities.py test_copilot_search_disambiguation_enrichment.py test_entities_sector_territory.py` → **23 passed** ✅
>
> **Smoke curl backend preview**:
> - Bloque 19 · `POST /api/copilot/skills/search "Sevilla"` → **`related_entities n=2` con `('territory', 'ccaa:01', 'Andalucía')` + `('territory', 'province:41', 'Sevilla')`** ✅ (antes: null en producción). Fix verificado.
> - Bloque 20 · función `_enrich_disambiguation_with_financials` presente en L722, llamada en L502 tras `resolve → 1-5 candidatos`. 6 tests unitarios verdes. Runtime smoke no forzó rama `disambiguation` (todas las queries fueron por `workspace`), pero cobertura test = OK.
>
> **Trazabilidad**: `MANIFEST.md` y `MENSAJE_BETA_backlog_completo.md` del ZIP copiados a `/app/memory/PENDING_FIXES/Beta-290826_deploy_pendiente_*_20260907.md`.
>
> **NO DESPLEGADO**. Preview only. Daniel dispara el deploy desde el panel Emergent tras decidir los 4 Cs.
>
> **Contexto previo (2026-09-05)** — Fix 1 dark mode `.afk` + Fix 2 DealAsideCard aditivo (bloques 16-17 del pack, ambos ya en el HEAD del pod y confirmados en producción vía curl).
>
> **Fix 1 · Modo oscuro `.afk` en `fichaMockupCss.ts` + 5 anchors en `CompanyFichaLayoutV2.tsx` (2026-09-05)** — ✅ APLICADO. Causa raíz: la paleta `.afk` no tenía variante `[data-dark]` y 5 sitios usaban colores literales (`#fff`, `#eef0f2`, `#fff9e6`, `#f5f6f8`) en vez de `var(--n*)`.
>
> - **1a** · Insertado `[data-dark] .afk{ ... }` en `fichaMockupCss.ts` tras `.afk .arrobamark svg{...}`, con overrides de `--n0..--n900` y tintes semitransparentes (`--red-tint`, `--red-tint2`, `--ok-tint`, `--warn-tint`, `--info-tint`).
> - **1b·B1** · Skeleton `background:linear-gradient(90deg,#eef0f2 0%,#f5f6f8 40%,#eef0f2 80%)` → `var(--n200)/(--n100)/(--n200)`.
> - **1b·B2** · Card `.intel` `linear-gradient(180deg, var(--red-tint), #fff)` → `..., var(--n0))`.
> - **1b·B3** · `.sig-actions .a` `background:#fff` → `var(--n0)`.
> - **1b·B4** (×2 con `replace_all`) · Banner `background:'#fff9e6'` → `'var(--warn-tint)'`.
> - **1b·B5** · Pill inline `background:'#fff'` → `'var(--n0)'`.
>
> Verificado E2E: en `<html data-dark>`, tokens `.afk` resueltos en `computedStyle` → `--n0:#211F1C`, `--n50:#171513`, `--n200:#3A3733`, `--n900:#FAF8F5`, `--warn-tint:rgba(199,125,24,.20)`, `--red-tint:rgba(255,87,87,.14)`. En modo claro: `--n0:#FFFFFF` (cero regresión). Screenshot `/app/docs/bundle_pending_fixes/fix1_dark_mode_afk.jpeg` muestra Servier con fondos oscuros, gráfico de evolución legible, anillos y aside "Pendiente" contrastados correctamente.
>
> **Fix 2 · `DealAsideCard` aditivo persona-aware (2026-09-05)** — ✅ APLICADO. Nueva funcionalidad opcional para la columna derecha `aside.deal`: prop `dealAside?: DealAsideState | null`, tipos exportados (`DealPersona`, `DealActionItem`, `DealStep`, `DealReportItem`, `DealAsideState`), componente `DealAsideCard` con 9 iconos lucide (`Lock`/`Shield`/`Folder`/`Files`/`File`/`GitCompare`/`Users`/`FileText`/`Gauge`), soporte de acciones con `locked` + `lockNote`, `steps` STAGES_V1, y bloque opcional `reports`. Cablado en `<aside className="deal">` con render condicional: `props.dealAside ? <DealAsideCard /> : <>card Pendiente</>`.
>
> - **2a** · Insertadas 6 reglas CSS en `fichaMockupCss.ts` tras anchor A: `.afk .dbtn.locked`, `:hover`, `.crd`, `.locknote`, `.reports`, `.reports .ph`.
> - **2b** · Import `lucide-react` extendido con 4 iconos (`File, Folder, Gauge, Shield`) manteniendo orden alfabético.
> - **2c** · Prop `dealAside?` documentado en `CompanyFichaLayoutV2Props` + bloque completo de tipos y `DealAsideCard` (aprox. 130 líneas nuevas fuera de la interface). `Fragment` ya estaba en el import de React desde antes.
> - **2d** · `<aside className="deal">` cablado con `props.dealAside ? <DealAsideCard state={props.dealAside} /> : <>...</>`. Cero regresión: sin prop → mismo card "Pendiente" con eyebrow "Próxima acción".
>
> Verificado E2E en Servier `/es/empresa-f01/B28184687`: `dealAside` undefined → renderiza el card estático "Pendiente" con texto "Estado de la compañía / En cuanto se determine, aquí verás la recomendación de actuación". DOM aside default: `dcard=1, dgrid=0, dacts=0, locked-btn=0, locknote=0, reports=0` (esperado). Screenshot `/app/docs/bundle_pending_fixes/fix2_dealaside_default.jpeg`.
>
> **Verificación consolidada (2026-09-05)**:
> - `yarn tsc --noEmit` → **0 errores** ✅
> - `yarn build` → **verde (19.19s)** ✅
> - `yarn vitest run` → **257 passed / 1 legacy R14** ✅
> - `yarn vitest run SingleExerciseChart.test.ts` → **12/12** ✅
> - `yarn eslint src --max-warnings=0` → **4 warnings legacy** en ficheros no tocados ✅
> - `pytest` → **321 passed / 37 legacy HARDENING-002** ✅
>
> **NO DESPLEGADO**. Preview Beta only. Daniel advierte: no desplegar hasta confirmar que el fix `_mag()` de ratios está en el pod Intel para no mezclar despliegues.
>
> **Contexto previo (2026-09-04)** — Hotfixes Bloque A + B + P1: P4 en monolito V2 + fix legacy `working_capital` categoría/formato + reconciliación visual `SingleExerciseChart`. Sanity PRM A08698060 (1,9 M€ · 771 k€ · 41,4 %) intacto.
>
> **P1 · Reconciliación visual `SingleExerciseChart.tsx` (2026-09-04)** — ✅ APLICADO. 5 cambios idempotentes sobre el fichero actual (que ya tenía hotfix P3 con rama 3a `profit_loss` primario). El helper `resolveSingleExerciseCascade` NO se toca; tests P3 #10/#11/#12 pasan tal cual (12/12 vitest).
>
> - **a)** `LABEL_RESERVE = 28` px + `BAR_MAX_H = CHART_H - LABEL_RESERVE` — las 3 fórmulas de escala (`baseFromBottom`, `revH`, `ebH`) ahora multiplican por `BAR_MAX_H` en vez de `CHART_H`, reservando hueco arriba para que la etiqueta de valor nunca se salga.
> - **b)** Barra Facturación `bg-brand-primary` → `bg-brand-accent` (= `--arroba-black` = `#0C0C0E`). Swatch de leyenda "Facturación" alineado. Consistencia con `FinancialEvolution.tsx` multi-año (Ingresos en negro/tinta).
> - **c)** Icono píldora "Un solo ejercicio" `BarChart3` → `LineChart` (lucide-react). Alineado con `MetricsBlock.tsx` y `FinancialEvolutionTeaser.tsx`.
> - **d)** Retirada la línea base (eje cero) `<div class="absolute ... border-t border-border-default">` bajo las barras. Sin lectura adicional; visualmente leía como marco no usado en el resto de charts.
> - **e)** Cabecera JSDoc actualizada con bloque `FIX-2026-09-01 (Daniel, revisión visual)` explicando las 4 justificaciones.
>
> Verificado E2E: `/es/empresa-f01/A08698060` PRM Internacional muestra `Resultados 2024 · Facturación 1,9 M€ (barra negra) · EBITDA 771 k€ (barra verde) · Margen EBITDA 41,4 %` con etiquetas dentro del gráfico. Sanity Servier `/es/empresa-f01/B28184687` no renderiza `SingleExerciseChart` (multi-año 2022-2024 sigue con `FinancialEvolution`). Hotfix P3 rama 3a intacto.
>
> **Bloque A · P4 en `CompanyFichaLayoutV2.tsx` (2026-09-04)** — ✅ APLICADO. +21 líneas al bloque inline "Detalles de la compañía" (T5). 3 filas condicionales R15 con testids `detalles-audited/detalles-balance-model/detalles-last-balance-year`. Se hidratan cuando Intel emita FASE0 completa.
>
> **Bloque B · Fix legacy `working_capital` en `canonical_ui_adapter.py` (2026-09-04)** — ✅ APLICADO. +18 líneas. Remapeo `category_raw=="working_capital"→"liquidity"` en ambos shapes (F0.2 dict + B.6.b float) + heurístico ampliado (`dso/dpo/inventory_days/cash_conversion_cycle→days`, `working_capital→currency`). Verificado backend + UI: `Fondo de maniobra 35,7 M€`, `Periodo medio de cobro 45 días` en bucket LIQUIDEZ de Servier.
>
> **Verificación consolidada (2026-09-04)**:
> - `yarn tsc --noEmit` → **0 errores** ✅
> - `yarn build` → **verde** ✅
> - `yarn vitest run` → **257 passed / 1 legacy R14** ✅
> - `yarn vitest run SingleExerciseChart.test.ts` → **12/12** ✅ (baseline 9 + P3 hotfix #10/#11/#12)
> - `yarn eslint` → **4 warnings legacy** en ficheros no tocados ✅
> - `pytest` → **321 passed / 37 legacy HARDENING-002** ✅
>
> **Sanity anti-regresión**: PRM `A08698060` sigue mostrando `1,9 M€ · 771 k€ · 41,4 %`. Rama 3a `profit_loss` primario intacta.
>
> **NO DESPLEGADO. Preview only.**
>
> **Contexto previo (2026-09-01)** — Pack PENDING_FIXES aplicado en preview (P3 Mercados de capitales + P4 Fase 0 campos identificación + P5 Fase 5 Ratios Iberinform · P2 SingleExerciseChart visual DIFERIDO por conflicto con hotfix P3 · sin deploy).
>
> **Bloque A · P4 en `CompanyFichaLayoutV2.tsx` (2026-09-04)** — ✅ APLICADO. +21 líneas al bloque inline "Detalles de la compañía" (T5, líneas ~785). 3 filas condicionales añadidas con el mismo patrón visual `.idrow`:
>
> - `Cuentas auditadas` ← `identity.audited` (data-testid `detalles-audited`)
> - `Modelo de balance` ← `identity.balance_model` (data-testid `detalles-balance-model`)
> - `Último ejercicio depositado` ← `identity.last_balance_year` (data-testid `detalles-last-balance-year`)
>
> Passthrough puro (R15): solo renderiza fila si Intel provee valor; nada se fabrica. Cuando Intel despliegue FASE0 completa, aparecerán automáticamente. Verificado E2E en Servier `/es/empresa-f01/B28184687`: tarjeta "Detalles de la compañía" renderiza correctamente todos los campos existentes (Razón social, CIF, CNAE, Domicilio, Capital social, Web, Resultado neto, Empleados) y las 3 filas nuevas están ausentes por Intel devolver `null` (comportamiento R15 correcto).
>
> **Bloque B · Fix legacy `working_capital` en `canonical_ui_adapter.py::to_financial_section()` (2026-09-04)** — ✅ APLICADO. +18 líneas. Dos correcciones semánticas compartidas por los dos shapes de `analysis.ratios` (F0.2 dict y B.6.b float):
>
> 1. **Remapeo categoría**: `category_raw == "working_capital"` → `"liquidity"` antes de la validación (aplicado post-lectura, pre-check `valid`). Sin este remapeo, el bucket `"working_capital"` no pasaba el `valid` set y caía a `"profitability"` por defecto.
> 2. **Heurístico de formato ampliado**: nuevas ramas `elif k in ("dso","dpo","inventory_days","cash_conversion_cycle"): fmt="days"` y `elif k == "working_capital": fmt="currency"`.
>
> Verificado por curl al backend (`B28350882`): `dso→liquidity/days`, `inventory_days→liquidity/days`, `working_capital→liquidity/currency`, cero ratios quedan con `category=working_capital`. Verificado E2E visual en `/es/empresa-f01/B28184687` pestaña Finanzas > Ratios: bucket LIQUIDEZ muestra `Periodo medio de cobro 45 días`, `Periodo medio de pago -8 días`, `Días de existencias -129 días`, `Ciclo de conversión de caja -76 días`, `Fondo de maniobra 35,7 M€`. Antes del fix, todos habrían mostrado formato `×` incorrecto y `working_capital` habría caído a Rentabilidad. Iberinform `_IBERINFORM_FALLBACK_ONLY` sigue funcionando: sin filas duplicadas.
>
> **Verificación consolidada (2026-09-04)**:
> - `yarn tsc --noEmit` → **0 errores** ✅
> - `yarn build` → **verde** ✅
> - `yarn vitest run` → **257 passed / 1 legacy R14** ✅ (sin regresión)
> - `yarn eslint` → **4 warnings legacy pre-existentes** en ficheros no tocados ✅
> - `pytest` → **321 passed / 37 legacy HARDENING-002** ✅ (sin regresión)
>
> **Sanity anti-regresión**: `/es/empresa-f01/A08698060` (PRM Internacional single-year) sigue mostrando `Facturación 1,9 M€ · EBITDA 771 k€ · Activos totales 2,4 M€` y "Un solo ejercicio" reconocido. Hotfix P3 intacto.
>
> **NO DESPLEGADO. Preview only.**
>
> **Contexto previo (2026-09-01)** — Pack PENDING_FIXES aplicado en preview (P3 Mercados de capitales + P4 Fase 0 campos identificación + P5 Fase 5 Ratios Iberinform · P2 SingleExerciseChart visual DIFERIDO por conflicto con hotfix P3 · sin deploy).
>
> **Pack PENDING_FIXES (2026-09-01)** — 3 de 5 puntos aplicados idempotentemente al pie de la letra:
>
> - **P1 · Bundle 300826** — SKIP · ya en preview verificado.
> - **P2 · SingleExerciseChart visual** — **SKIP DELIBERADO** · el `.fixed.tsx` no contiene la rama 3a `profit_loss` primario del hotfix P3 (A08698060 PRM Internacional). Daniel decidió diferirlo — se reconciliará en un pack visual+P3 posterior. `.fixed.tsx` archivado en `/app/memory/PENDING_FIXES/` para esa reconciliación.
> - **P3 · Fase 2 Mercados de capitales** — ✅ APLICADO. 5 ficheros tocados: `intelligence-types.ts` (nuevos types `CapitalMarketsBlock/Listing/Regulated/Buyers` + `CompanyFicha.capital_markets`), `adapters.ts` (import `CapitalMarketsBlock` + prop capitalMarkets + helper `capitalMarketsToView`), `CompanyFichaLayoutV2.tsx` (type import + prop `capitalMarkets` + llamada `marketBlockToContextView(...)`), `CompanyFichaF01Client.tsx` (prop `capitalMarkets={ficha?.capital_markets ?? null}`), `MarketReadingBlock.tsx` (reemplazo completo con nueva sección `<section>` "Mercados de capitales"). Verificado E2E en `/es/empresa-f01/A08698060` → tarjeta NO aparece (correcto, PRM no cotiza + `capital_markets: null` desde Intel), degradación limpia sin banner de error ni hueco. R15 puro. Se activará automáticamente cuando Intel despliegue su `FASE2_CAPITAL_MARKETS_PATCH.md`.
> - **P4 · Fase 0 · 3 campos dormidos identificación** — ✅ APLICADO literalmente donde el patch pide (3 ficheros: `intelligence-types.ts::IdentitySection` + `CompanyFichaF01Client.tsx::adaptIdentityFromFicha` + `IdentityFieldsGrid.tsx`). ⚠️ **Anomalía observada**: `IdentityFieldsGrid` se importa desde `CompanyPerfil.tsx` que usa `CompanyFichaLayout` V1, pero la Ficha F01 activa usa `CompanyFichaLayoutV2.tsx` (monolito), que renderiza su propio bloque "Detalles de la compañía" inline (líneas ~3050-3160) sin invocar `IdentityFieldsGrid`. Los 3 campos nuevos están cableados hasta `identity.audited/balance_model/last_balance_year` pero NO se pintan en la Ficha F01 V2 activa. **No adapté a ciegas** — reportado como observación. Requiere decisión de Daniel: (a) añadir 3 filas al bloque inline de V2 (fuera del scope actual, solo P5 autoriza tocar V2 para hero cards), o (b) esperar a que V1 vuelva a usarse en algún flujo, o (c) reconciliar el patch original.
> - **P5 · Fase 5 · 16 ratios Iberinform + 2 hero cards** — ✅ APLICADO. 6 ficheros tocados: `financial.py` (DTO `iberinform_ratios: dict | None`), `providers/agency_tool/financial.py` (passthrough en `_map_analyze`), `canonical_ui.py` (`RatioFormat` +`days` + `FinancialRatioItem.verified`), `canonical_ui_adapter.py` (tabla `_IBERINFORM_RATIO_META` con los 16 ratios + `_IBERINFORM_FALLBACK_ONLY` + merge post-arroba en `to_financial_section`), `intelligence-types.ts` (frontend types simétricos + `FinancialAnalysis.iberinform_ratios`), `CompanyFichaLayoutV2.tsx` (paso 6a `fmtCell` formato `days` + paso 6b hero cards `Calidad`/`Score de solvencia` con `Ring` + icono ámbar `!` para `verified === false`, todo condicionado a existencia del dato). Verificado E2E: hero card "Calidad 75" ✅ visible (viene de `fq?.score` de arroba, no depende de Iberinform). Hero card "Score de solvencia" **oculta correctamente** porque Intel aún no envía `iberinform_ratios.solvency_score` (comportamiento R15 esperado). Icono ámbar tampoco aparece (0 ratios `verified: false` porque Intel no ha desplegado FASE5). 16 filas de ratios de arroba pintan como siempre. **Cero regresión, se hidratará solo cuando Intel despliegue.**
>
> **Verificación consolidada (2026-09-01 · post-pack)**:
> - `yarn tsc --noEmit` → **0 errores** ✅
> - `yarn build` → **verde** ✅
> - `yarn vitest run` → **257 passed / 1 legacy R14** ✅ (mismo estado que pre-pack)
> - `yarn eslint src` → **4 warnings legacy pre-existentes** (BrandPanel/CompanyTopbar/PublicFooter con `<img>` + useRevealOnScroll) — ninguno nuevo ✅
> - `pytest` → **321 passed / 37 legacy HARDENING-002** ✅ (mismo estado que pre-pack)
>
> **Sanity anti-regresión**: `/es/empresa-f01/A08698060` (PRM Internacional single-year) sigue mostrando `SingleExerciseChart` con "Resultados 2024 · Facturación 1,9 M€ · EBITDA 771 k€ · Margen EBITDA 41,4 %". Hotfix P3 intacto — punto 2 correctamente evitado.
>
> **Bug preexistente detectado, fuera del scope del pack**: en la tarjeta "Ratios financieros", los 4 ratios legacy de arroba en categoría `working_capital` (Periodo medio de cobro, Días de existencias, Fondo de maniobra, Ciclo de conversión de caja) salen con formato incorrecto (`46,5×` en vez de `46,5 días`). El propio `.md` de FASE5 documenta este bug preexistente explícitamente y decide NO abordarlo en este pack. Requiere patch separado para forzar `format: "days"` en esos 4 ratios en `to_financial_section()`.
>
> **NO DESPLEGADO. Awaiting user go/no-go antes de deploy conjunto con Intel-140826.**
>
> **Estado previo (2026-08-31)** — 🟢 Hotfix P3 A08698060 · verificado en preview.
>
> **Hotfix P3 · shape real `profit_loss` primaria (2026-08-31)** — repro real de Daniel: PRM Internacional `A08698060`, empresa de un solo ejercicio 2024, con header mostrando `Facturación 1,9M€ · EBITDA 771 k€` pero "Evolución financiera" caía a "Información en preparación". Causa raíz: el shape del agregador para esta empresa era `financial.evolution: null` + `financialAnalysis.evolution.points: []` + `profit_loss: {years:[2024], rows:[revenue, ebitda...]}`. `resolveSingleExerciseCascade` P3 solo aplicaba `profit_loss` como *completa-KPIs-faltantes* cuando ya había `out` de otra fuente — no como fuente primaria del año. Fix mínimo: nueva rama **(3a) `profit_loss` como fuente PRIMARIA** cuando legacy y evoPoints están vacíos y `profit_loss.years.length === 1`. La rama existente pasa a llamarse **(3b) `profit_loss` completando KPIs faltantes**. R15 final acotado solo a la rama (3a): si tras leer profit_loss primaria revenue Y ebitda siguen null → `null`; para las ramas 1/2 se preserva el comportamiento HARDENING-030c (año conocido con KPIs null → punto válido, gráfico pinta «—» explícito). Verificación E2E preview: `/es/empresa-f01/A08698060` → renderiza `SingleExerciseChart` con "Resultados 2024 · Facturación 1,9 M€ · EBITDA 771 k€ · Margen EBITDA 41,4 %". Sanity multi-año Servier B28184687: NO renderiza SingleExerciseChart (correcto, sigue EvolutionChart multi-año). 3 tests nuevos añadidos a `SingleExerciseChart.test.ts`: P3-hotfix-repro-A08698060 (fixture con shape real: `revenue=1_861_978.24`, `ebitda=770_599.86` en `profit_loss.rows`), P3-hotfix-empty-years (guarda), P3-hotfix-rows-sin-kpis (R15). 12/12 vitest verdes. Vitest total: 257/258 (era 254/255, +3 tests nuevos, 1 legacy R14 esperado).
>
> **Lote 2026-08-30 · 8 puntos idempotentes** — aplicados sobre el preview sin deploy. Todos con evidencia + verificación consolidada (`pytest`, `tsc`, `eslint`, `build`, `vitest`, Tailwind CLI check) + smoke E2E S1→S8.
>
> - **P1 · Tailwind sistémico** — `frontend/src/styles/tokens.css` + `frontend/tailwind.config.ts` reemplazados completos. Introduce triplete RGB para brand/surface/text/border/feedback en LIGHT + overrides DARK (§2b `--x-rgb`). BUGFIX-2026-08-29: `bg-success/60`, `bg-danger/50`, etc. ahora compilan a `rgb(var(--x-rgb) / 0.6)` en vez de invisible.
> - **P2 · `items-end` → `items-stretch`** — un swap de 1 línea en el contenedor de barras del gráfico "Altas y bajas" de `/mapa-empresarial`.
> - **P3 · SingleExerciseChart · fallback profit_loss** — extendido `resolveSingleExerciseCascade` con 3er parámetro opcional `profitLoss`. **Hotfix 2026-08-31**: añadida rama (3a) profit_loss como fuente PRIMARIA (ver arriba).
> - **P4 · Ficha Territorial nueva** — `frontend/src/app/[locale]/(authenticated)/territorio/[level]/[code]/page.tsx` (~260 líneas). Verificado E2E: `/es/territorio/ccaa/13` (Madrid) renderiza con datos reales Intel.
> - **P5 · `copilot/service.py` reemplazado** — ~600 líneas. BUGFIX-2026-08-30 central en rama #4: `_try_taxonomy(q, offset)` antes de disambiguation. Panaderías→74 resultados verificado.
> - **P6 · Resultados en 3 secciones** — `resultados/page.tsx` separa `relatedEntities` en Sectores/Territorios/Otros con helper `relatedEntityHref`.
> - **P7 · Enlace "Ficha →" en `TerritoryRow`** — 19 enlaces detectados en `/mapa-empresarial`.
> - **P8 · `FichaLoadingScreen.tsx` nuevo** — 140 líneas, `@componentId COMP-P-0007`. E2E verificado: swap fluido loader→ficha en Servier + PRM Internacional.
>
> **NO DESPLEGADO. Awaiting user go/no-go antes de coordinar deploy conjunto con Intel-290826.**
>
> **Estado previo (2026-08-16)** — 🟢 HARDENING-037 + HARDENING-038 CERRADOS (bundle 28 unidades).
>
> **Lote 2026-08-30 · 8 puntos idempotentes** — aplicados sobre el preview sin deploy. Todos con evidencia + verificación consolidada (`pytest`, `tsc`, `eslint`, `build`, `vitest`, Tailwind CLI check) + smoke E2E S1→S8.
>
> - **P1 · Tailwind sistémico** — `frontend/src/styles/tokens.css` + `frontend/tailwind.config.ts` reemplazados completos. Introduce triplete RGB para brand/surface/text/border/feedback en LIGHT + overrides DARK (§2b `--x-rgb`). BUGFIX-2026-08-29: `bg-success/60`, `bg-danger/50`, etc. ahora compilan a `rgb(var(--x-rgb) / 0.6)` en vez de invisible (Tailwind necesita `<alpha-value>` sintaxis para generar variantes de opacidad). Verificado en pipeline Tailwind CLI + preview: barras Altas/Bajas del gráfico "Evolución" en `/mapa-empresarial` ahora visibles con opacidad correcta.
> - **P2 · `items-end` → `items-stretch`** — un swap de 1 línea en el contenedor de barras del gráfico "Altas y bajas" de `/mapa-empresarial`. Las 13 columnas mensuales rellenan el alto completo con `justify-end` interno, altas apilan encima de bajas correctamente.
> - **P3 · SingleExerciseChart · fallback profit_loss** — extendido `resolveSingleExerciseCascade` con 3er parámetro opcional `profitLoss` (`FinancialTableBlock`). Cuando la fuente elegida trae `year` pero `revenue`/`ebitda` vienen `null` (empresas cuya `evolution`/agregador no traen KPIs pero sí Cuenta de Resultados completa), se completa cada campo individualmente desde `profit_loss.rows[]` del mismo año. Keys buscadas: `revenue|net_revenue|total_revenue|ingresos|importe_neto_cifra_negocios` y `ebitda|ebitda_result`. Nunca sintetiza — lee literalmente el `cell.value`. Consumo en `CompanyFichaLayoutV2.tsx` pasa `financial?.profit_loss ?? null` al helper. 2 nuevos tests unitarios (9/9 vitest verdes en `SingleExerciseChart.test.ts`).
> - **P4 · Ficha Territorial nueva** — `frontend/src/app/[locale]/(authenticated)/territorio/[level]/[code]/page.tsx` (~260 líneas, componente `FichaTerritorialPage`). Consume `apiClient.marketMap.territory(level, geoCode)` + `crossSectorsIn(level, geoCode, 10)`. Estructura: breadcrumb + KPIs (Dinamismo, Empresas activas, Tamaño, Crecimiento) + Card "Altas y bajas" (INE Demografía) + Card "Sectores destacados" (`EstimadoBadge` + concentración `x media nacional`) + Card "Provincias" (drill-down solo si `level==='ccaa' && provinces.length>0`) + Card "Lo que esta ficha todavía no tiene" (R15 honestidad). Verificado E2E: `/es/territorio/ccaa/13` (Madrid) renderiza con datos reales Intel (Dinamismo 75 · 536.353 empresas activas · Altas 1807/Bajas 294/Balance 1513 · 8 sectores destacados con `x media nacional`).
> - **P5 · `copilot/service.py` reemplazado** — ~600 líneas. Constante `_SEARCH_TIMEOUT_S = 8.0` + wrapper `_intel_call_ff`. `execute_search` público → `_execute_search_impl` + enriquecimiento `_related_entities_chips` (never bloquea si falla). 5 ramas ordenadas: #1 CIF → #2 financial (`_taxonomy_company_ids` para scoping sectorial) → #3 categorical (`_try_taxonomy`) → #4 concrete-name → #5 semantic. **BUGFIX-2026-08-30 CENTRAL**: en rama #4, tras resolve-by-name sin match fuerte, se invoca `await _try_taxonomy(q, offset)` ANTES de caer a disambiguation. Si Intel reconoce la query como sector → devuelve la lista completa (ej. "panaderías" → 74 resultados). Si Intel NO reconoce (ej. "aceros"/"carnicerías" — falta alias en NODE_ALIASES Intel), sigue con disambiguation 1-5 como antes. `_try_taxonomy` factorizado con retry `_taxonomy_retry_variant` (inserta "de" entre las 2 primeras palabras) como red genérica. Comentarios `REVERTIDO 2026-08-29` documentales preservados. E2E verificado: `panaderías → 74 total`, `aceros → 1 disambiguation` (bugfix del código correcto; solución completa depende de Intel expandir aliases).
> - **P6 · Resultados en 3 secciones** — `resultados/page.tsx` separa `relatedEntities` en `sectorMatches` (type='sector'), `territoryMatches` (type='territory'), `otherMatches` (investor/company/otros). Cada tipo con su cabecera (`Building2 Sectores` / `MapPin Territorios` / `Users Empresas` como label sobre la tabla). Nuevo helper `relatedEntityHref(e)` navega a `/sector/{code}` (via prefix `cnae:`), `/territorio/{level}/{code}` (via prefix `ccaa:`/`province:`), `/empresa-f01/{cif}` (via id CIF) — evita el antipatrón anterior de relanzar búsqueda de texto por `display_name`. Sub-secciones vacías se ocultan (no cabeceras vacías). Data-testids: `resultados-sector-matches`, `resultados-territory-matches`, `resultados-related-entities`, `resultados-empresas-label`. Sección "Empresas" solo aparece cuando hay resultados de otras entidades encima (para no duplicar cabecera con la tabla).
> - **P7 · Enlace "Ficha →" en `TerritoryRow`** — reemplazo del `<button>` exterior por `<div>` + `<button>` interior (selección) + `<Link href={/territorio/${t.geo_level}/${t.geo_id}}>Ficha →</Link>` a la derecha. Mismo patrón visual que "Ficha →" en `SectorRow`. Verificado: 19 enlaces detectados en `/mapa-empresarial`, navegación a `/territorio/ccaa/13` funciona (ver P4 verificado E2E).
> - **P8 · `FichaLoadingScreen.tsx` nuevo** — 140 líneas, componente `FichaLoadingScreen(cif, ready, onSettled)`. Dark hero con radial-gradient, insignia arroba-red + `Sparkles` + `animate-ping`, título "CARGANDO FICHA", CIF header, barra de progreso arroba-red (0-100% via `effectiveStage/STAGES.length`), 3 pasos con estado done/active/pending (`Building2` / `TrendingUp` / `FileCheck`), nota PDF al pie. `STAGE_DELAY_MS=[900,1400]` ritmo cosmético, `SETTLE_MS=220` swap corto. Respeta `prefers-reduced-motion` (skip a 0ms). Enchufado en `CompanyFichaF01Client.tsx` con `showReal` state gate: mostrar loader mientras `fichaLoading || !showReal` (excepto si hay error, salta al error immediately). Sustituye el `LoadingBlock` genérico. `@componentId COMP-P-0007` añadido al JSDoc para no romper el R14 guard. E2E verificado: loader aparece con CIF B28184687, animate-ping activo, progreso 0→100% en ~2.3s, swap fluido a ficha real "LABORATORIOS SERVIER" (192ms de latencia Intel).
>
> **Verificación consolidada** (2026-08-30 · dev pod preview):
> - `yarn tsc --noEmit` → **0 errores** ✅
> - `yarn build` → **verde, incluye nueva ruta `/[locale]/territorio/[level]/[code]` (2.83 kB · 122 kB First Load JS)** ✅
> - `yarn vitest run` → **254 passed / 1 legacy R14 (3 atoms pre-existentes: Tip/SrcDot/MethodDetails)** ✅ (mi `FichaLoadingScreen` NO es offender nuevo — declara `@componentId COMP-P-0007`)
> - `pytest` → **321 passed / 37 legacy pre-existentes (HARDENING-002, unrelated)** ✅ (los 41 tests directamente relacionados con `service.py`/`financial_query.py`/`platform_stats.py`/`copilot_search_related_entities.py`/`taxonomy_retry_variant.py` = 41/41 verdes)
> - `yarn eslint src` → **0 errores, 4 warnings legacy pre-existentes** (BrandPanel, CompanyTopbar, PublicFooter con `<img>`; useRevealOnScroll hook) — ninguno introducido por el Lote 30-08 ✅
> - Tailwind CLI check → `.bg-success\/60 { background-color: rgb(var(--success-rgb) / 0.6); }` compila, `.bg-danger\/50 { background-color: rgb(var(--danger-rgb) / 0.5); }` compila (10 refs `success-rgb` en output) ✅
>
> **Smoke S1→S8** (screenshots en `/app/docs/bundle300826_screenshots/`):
> - **S1** · `bg-success/60` visible en `/mapa-empresarial` (13 barras Altas + 13 Bajas, computed `rgba(21,128,61,0.6)`) ✅
> - **S2** · `.h-32.items-stretch` presente en el contenedor del gráfico Evolución ✅
> - **S3** · Fallback `profit_loss` en `SingleExerciseChart` cubierto por 2 tests unitarios nuevos (P3 con año matching → completa, P3 sin año → mantiene null) — 9/9 vitest ✅
> - **S4** · `/es/territorio/ccaa/13` (Madrid) renderiza breadcrumb + KPIs + Altas/Bajas + Sectores destacados + Provincias drill-down + R15 honestidad ✅
> - **S5a** · Buscar "panaderías" → **74 resultados en tabla** (no dropdown 1-5) — BUGFIX-2026-08-30 funciona ✅
> - **S5b** · Buscar "aceros" → 1 disambiguation. **Comportamiento correcto**: la rama #4 ahora prueba taxonomy (verificado en logs `GET /api/v1/company-taxonomy/search?q=aceros`), Intel devuelve 0 rows para esa query (falta alias en NODE_ALIASES Intel), luego cae a disambiguation con el único nombre de empresa que matchea. **La solución completa requiere que Intel añada aliases** para "aceros"/"carnicerías" — Beta ya intenta el flujo correcto ⚠️ (Intel-side pending)
> - **S6** · Estructura de 3 secciones (Sectores/Territorios/Empresas) presente en el DOM y compilada. `relatedEntities` viene vacío desde Intel en este entorno (`entities.resolve.sector count=0` en logs) — no se pinta render visible, pero la lógica está lista para cuando Intel devuelva datos. Verificado por presencia de 4 data-testids en el compilado + build limpio ✅ (estructural)
> - **S7** · 19 enlaces `<Link href="/territorio/{level}/{code}">Ficha →</Link>` en `/mapa-empresarial`, navegación probada `/territorio/ccaa/13` ✅
> - **S8** · Loader `FichaLoadingScreen` aparece en `/empresa-f01/B28184687` con insignia arroba-red + animate-ping + 3 pasos + barra de progreso → swap fluido a ficha real "LABORATORIOS SERVIER" ✅
>
> **NO DESPLEGADO. Awaiting user go/no-go antes de coordinar deploy conjunto con Intel-290826.**
>
> **Estado previo (2026-08-16)** — 🟢 HARDENING-037 + HARDENING-038 CERRADOS (bundle 28 unidades · pendiente `e1_tester` + go/no-go usuario · sin deploy).
>
> **HARDENING-037 · Cableado layout via `sectionRegistry.tsx`** (monolito lifted por autorización explícita del usuario). El monolito `CompanyFichaLayoutV2.tsx` deja de tener el switch de render hardcodeado para las 3 secciones nuevas (Mercado · Oportunidades · Comité). Ahora resuelve `getSection(active)?.render(ctx)` **antes** del switch inline (líneas 3220-3259) y el registro declarativo `frontend/src/components/company/layout/sectionRegistry.tsx` mapea cada `SectionId` → block presentacional (MarketReadingBlock · OpportunityThesisBlock · InvestmentCommitteeBlock). Wrapper canónico `<section data-testid="section-{active}">` habilita smoke E2E sin scraping DOM frágil. Retirados del `NAV[]`: `sucesion` y `sector` (absorbidos por `oportunidades` con `sell`/`buy` en `OpportunityThesisView`). Nuevo módulo `layout/adapters.ts` con funciones puras `marketBlockToContextView` + `opportunityToThesisView` bajo R15 estricto: todo campo sin fuente Intel → `undefined` explícito (los blocks renderizan `<Empty/>` internamente).
>
> **HARDENING-038 · 5 proxies backend Intel JWT-gated** bajo `/api/companies/{cif}/*` (`POST /committee?lens=`, `GET /committee/export/{decision_id}`, `GET /succession`, `GET /rollup`, `GET /market-reading`). Todos en `backend/src/modules/companies/router.py` con `Depends(get_current_user)` → **401 sin cookie** verificado localmente. Cliente canónico `get_agency_tool_client()` + `_intel_call_ff` (fail-fast 8s) en `backend/src/modules/copilot/intel_ficha_proxies.py`. Mapa lens→`buyer_profile`: `neutral=None` · `buyer=strategic` · `investor=private_equity`. Errores upstream → **502 estructurado** `{"detail":"http_error","code":"http_502"}` (nunca 500, nunca filtrar detalle Intel).
>
> **Degradación honesta verificada (smoke dev pod, `B28184687` `test.arroba+neo@arroba.com` autenticado)** — Screenshots R15 en `/app/docs/bundle28_screenshots/`:
> - **committee POST** · **succession** · **rollup** → 502 upstream (motores Intel dev inactivos). Frontend: idle state en Comité, "No hemos detectado oportunidades..." en Oportunidades.
> - **market-reading** → 200 con `reading` real (Intel dev sí lo expone).
> - **Sin cookie** → 401 en las 5 rutas.
> - 3 capturas: `bundle28_market.jpeg` (Mercado con título · área vacía por `ficha.market=null`) · `bundle28_opportunities.jpeg` (Empty explícito) · `bundle28_committee.jpeg` (idle con 10 celdas de especialistas + botón "Ver deliberación del comité").
>
> **Verificación conjunta**: `yarn tsc --noEmit` verde (0 errors) · `yarn build` verde (First Load JS shared 87.3 kB, sin regresión) · `pytest` **283 passed / 37 legacy pre-existentes** (HARDENING-002 · 31 tests broken by design + 6 aditivos legacy no relacionados con bundle 28; grep confirma **0 fallos** relacionados con committee/succession/rollup/market/intel_ficha) · Vitest **238 passed / 1 legacy pre-existente** (R14 guard sobre `atoms/{Tip,SrcDot,MethodDetails}.tsx` — commits pre-bundle 28, verificado con stash) · `curl /api/openapi.json` confirma las 5 rutas + smoke curl valida 401→200 flujo auth.
>
> **Refactoring pending intel_ficha_proxies tests**: no hay pytest específico para el módulo nuevo (`intel_ficha_proxies.py`). Cubierto por curl E2E dev pod. Backlog INTEL: cuando los motores Intel dev estén activos, añadir 5 tests unitarios mockeando `AgencyToolClient` que validen contrato + fallback empty.
>
> **Bundle final: 28 unidades** (27 previas + 1 nueva: HARDENING-037/038 doble). **NO desplegado. Awaiting `e1_tester` external validation + user go/no-go.**
>
> **Docs vivos actualizados**: `/app/DEPLOY_NOTES.md` (tabla contenido + sección "Cableado HARDENING-037 + HARDENING-038 · resuelto en bundle 28" + "Screenshots R15 · bundle 28" + "Cableado pendiente · HARDENING-038b (congelado)"), `/app/docs/HARDENING-037_puntos_extension.md`, `/app/docs/HARDENING-038_proxies.md`, `/app/docs/HARDENING-038b_opportunity_full_wiring.md`.
>
> **Estado previo (2026-08-15)** — 🟢 HARDENING-BETA-preview-scenarios + HARDENING-REQ004c CERRADOS (2 tickets aditivos paralelos).
>
> **HARDENING-REQ004c · Parser margen EBITDA + comparador "al/del"** — Extiende el parser financiero (REQ004/004b) con la métrica que faltaba: `ebitda_margin_min`/`ebitda_margin_max`. Los comparadores `_GTE`/`_LTE` ahora aceptan "al"/"del" (`"superior al"`, `"más del"`, `"menor del"`). Los predicados con `%` se **desambiguan por contexto** vía `_pct_metric()` que mira 32 chars atrás + 18 adelante: si aparece `margen`/`rentabilidad` → `ebitda_margin_*`; si aparece `crec|crezc|growth` → `growth_min`; si no → nada. Contrato preservado, 10/10 tests (9 REQ004b regresión + 1 nuevo `test_ebitda_margin`). Smoke dev pod: `"margen EBITDA > 15%"` → 500 hits · `"margen de EBITDA superior al 30%"` (comparador "al") → 500 hits · `"crezcan más de 20%"` → 50 hits growth (NO confundido con margen) · REQ004 (`EBITDA > 1M`) → 237 hits regresión idéntica · REQ003 (`agencias de marketing`) → 898 categorical regresión idéntica. Cherry-pick limpio: sólo `financial_query.py` + `test_financial_query.py` de Beta (los ficheros `intel/*` del zip son del otro repo).
>
> **HARDENING-BETA-preview-scenarios · Mini-fuzz visual del veredicto Committee** — Extiende `/{locale}/internal/blocks-preview` con selector `?scenario=proceed|proceed_with_conditions|pass` que sobreescribe el mock `neutral` para renderizar los 3 estados canónicos del `InvestmentCommitteeBlock` sin backend Intel. `SCENARIO_OVERRIDES: Record<Scenario, CommitteeResult>` con 3 mocks completos (recommendation + score + confidence + summary + conditions + deliberación por especialista, incluyendo el escenario `pass` con vetos legal/riesgo materializados). Implementación: `useSearchParams` envuelto en `Suspense` (requerido por Next 14 App Router), `Link scroll={false}` para navegación sin refresh, `key={scenario}` en el bloque committee para forzar remount limpio (resetea state idle→loading→done). El switcher sólo aplica a la lente `neutral`; buyer/investor conservan sus mocks originales (evita matriz 4×3 sin señal adicional). Data-testids: `blocks-preview-scenario-switcher`, `blocks-preview-scenario-{proceed|proceed_with_conditions|pass}` con `data-active` toggling.
>
> **Verificación conjunta**: `yarn tsc --noEmit` verde · `yarn build` verde · Vitest **5/5** aterrizaje verdes (regresión sana) · pytest **10/10** financial_query + **10/10** copilot_search (regresión REQ003/004/004b) · Screenshots Playwright con los 3 escenarios renderizando: proceed (84/100 confianza 89%, todos avanzar) · proceed_with_conditions (68/100 confianza 72%, mix), pass (38/100 confianza 83%, TODOS "No avanzar" con ⛔ Veto explícito en Legal + Riesgo materializados con litigio AT-2023-4471 y deterioro operativo).
>
> **Bundle 27** (25 previas + 2 nuevas: REQ004c + preview-scenarios) — superseded por bundle 28.
>
> **Estado previo (2026-08-15)** — 🟢 HARDENING-BETA-para-emergent CERRADO (aterrizaje aislado de 4 blocks + preview interna con mock data).
>
> **HARDENING-BETA-para-emergent · Aterrizaje aislado de 4 blocks** — El zip `BETA_para_emergent.zip` traía 30% ya aplicado (REQ004/004b consolidado, `financial_query.py` idéntico + `service.py` con regresión pre-REQ001-REFACTOR + `page.tsx` con regresión pre-HARDENING-032/033) + 70% componentes nuevos huérfanos que el zip pedía cablear al layout monolítico prohibido. **Cherry-pick por decisión de scope**: (a2) aterrizar los 4 blocks aislados en `/app/frontend/src/components/blocks/{committee,financial,market,opportunity}/`, (b2) mantener bloqueo `CompanyFichaLayoutV2.tsx` — NO cableado, (c3) NO proxies backend. Los 4 componentes (948 LOC totales) son 100% presentacionales (0 fetches, 0 apiClient), accesibles hoy solo desde `/{locale}/internal/blocks-preview` con mock data plausible (banner "página interna · mock data · no usar en producción" + `noindex/nofollow` meta). El componente `InvestmentCommitteeBlock` recibe `runCommittee(cif, lens) → Promise<CommitteeResult>` inyectado (aquí un stub con delay 400ms); flujo idle → loading → done verificado en Playwright. Ampliaciones planificadas: **HARDENING-037** (cableado layout, requiere decisión arquitectónica sobre monolito) y **HARDENING-038** (4 proxies backend: `committee/succession/rollup/market-reading`, todos con cliente canónico + cache TTL + empty honesto).
>
> **Verificación**: `yarn tsc --noEmit` verde · `yarn build` verde · Vitest **87/87** verdes (5 nuevos aterrizaje + 82 regresión) · **grep confirma 0 referencias a los 4 blocks en `CompanyFichaLayoutV2.tsx`** (regla monolito preservada) · Screenshot Playwright con los 4 blocks renderizando (committee incluso testeado en flujo idle→loading→done vía stub). Regresión REQ003/REQ004/REQ004b/HARDENING-032/033 intacta.
>
> **Bundle final: 25 unidades** (24 previas + 1 nueva HARDENING-BETA-para-emergent). No deploy.
>
> **Estado previo (2026-08-15)** — 🟢 HARDENING-REQ004b CERRADO (parser multi-métrica + sector-scoped financiero + fix paginación).
>
> **HARDENING-REQ004b · Multi-métrica + sector-scoped + fix pagination** — 3 cambios aditivos: (1) **Parser rewrite** con clasificación por contexto: cada número se asigna a su métrica correcta (`_classify` mira 30 chars atrás + 20 adelante para tokens `emplead|trabajad|plantilla` vs `ebitda` vs `ingres|factur|ventas|revenue|euro|€`). Habilita combos: `"empresas de más de 1M€ con menos de 100 empleados"` → `{revenue_min:1M, employees_max:100}`. Contrato preservado (`{filters, residual} | None`), 7 casos originales verdes + 2 combo nuevos (9/9). (2) **`service.py` sector-scoped**: nuevo helper `_taxonomy_company_ids(residual, _SECTOR_ID_CAP=3000)` que resuelve el residual a `company_ids` via `company-taxonomy/search?primary_only=true`, refactorizado al cliente canónico (`get_agency_tool_client()` + `_intel_call_ff` 8s). En `_financial_search_results` se scopea el payload: `if residual → master_company_ids=ids + query=""`. Si taxonomy no resuelve → screen puro sin sector (no fall-through a categorical). Este cambio **resuelve el gap REQ-INTEL sectorial-aware residual** documentado en REQ004 verificación: Beta resuelve sector→ids en vez de delegar full-text a Intel. (3) **`resultados/page.tsx`**: 1 clase CSS `py-8` → `pt-8 pb-40` en el contenedor root — la paginación ya no queda tapada por el dock del Copilot anclado al fondo.
>
> **Cherry-pick quirúrgico** (mismo patrón REQ001b/003/004): el zip trae regresión en `service.py` (reintroduce `intel_get`/`intel_post` paralelos) y `page.tsx` (destruye HARDENING-032/033 completos). Aplicados solo: `financial_query.py` completo, `test_financial_query.py` completo, helper `_taxonomy_company_ids` refactorizado al canónico, scoping en `_financial_search_results`, 1 clase CSS. Log estructurado `financial_search_dispatched {filters_keys, has_residual, sector_scope_ids}` para observabilidad.
>
> **Verificación E2E dev pod, real Intel** — 5 queries + log confirmations + screenshot:
> - Q1 `"empresas de más de 1M€ con menos de 100 empleados"` → parser combo `{revenue_min:1M, employees_max:100}` · **975 hits** financial multi-métrica ✅
> - Q2 `"agencias de marketing con EBITDA > 1M"` → parser `{ebitda_min:1M}` + residual `"agencias marketing"` → taxonomy resuelve **62 primary ids** (`sector_scope_ids=62` en log) → payload con `master_company_ids` a Intel → **237 hits** (Intel dev aún ignora `master_company_ids`; post-deploy Intel REQ-004b → intersección ~5-15) ✅
> - Q3 `"empresas con ingresos superiores a 50 millones"` → **25 hits** REQ004 preservado ✅
> - Q4 `"agencias de marketing"` (sin numérico) → parse `None` → **898 hits** categorical REQ003 idéntico ✅
> - Q5 `"clínicas dentales en Valencia"` → parse `None` → **49 hits** semantic REQ001b idéntico ✅
>
> **Regresión**: `pytest test_financial_query.py` → **9/9** (7 originales + 2 combo) · `pytest test_copilot_search.py + test_platform_stats.py` → **19/19** · `yarn tsc --noEmit` verde · `yarn build` verde · Screenshot Playwright: contenedor `pt-8 pb-40` aplicado, `py-8` residual = False, paginación visible con espacio ~160px bajo (dock no la tapa).
>
> **Bundle final: 24 unidades** (23 previas + 1 nueva REQ004b). Gate ampliado: Intel REQ-004b (`master_company_ids` en `skills/search`) es el desbloqueo final del feature sector+financiero (screen puro funciona ya; intersección post-Intel-REQ-004b). Sin REQ-004b Intel → screen puro sin sector documentado, comportamiento aceptable.
>
> **Estado previo (2026-08-15)** — 🟢 HARDENING-REQ004 CERRADO (5º modo · financial search).
>
> **HARDENING-REQ004 · Búsqueda por financieros (5º modo)** — Nuevo parser `financial_query.py` puro, rama `#2 FINANCIAL` entre CIF y CATEGORICAL, helper `_financial_search_results` refactorizado al canónico. Retorno tri-estado (Response · None fall-through · propaga error). Verificación E2E: 25 hits para revenue≥50M (100% cumplen), 62 hits para combo EBITDA+empleados, fall-through OK con filtro absurdo. Bundle: 23 unidades.
>
> **Orden final de modos**: `#1 CIF → #2 FINANCIAL (REQ004+REQ004b) → #3 CATEGORICAL (REQ003) → #4 NAME → #5 SEMANTIC`.
>
> **Estado previo (2026-08-15)** — 🟢 HARDENING-029 + HARDENING-032 + HARDENING-033 CERRADOS.
>
> **HARDENING-033 · CTA contextual sobre `/resultados` filtrado** — CTA discreto sobre la tabla cuando ≥1 chip signal_badge está activo. Variantes por auth: autenticado → `/{locale}/me/watchlists/new?q=&signals=` (stub Fase 2); anónimo → `/{locale}/registro?next=<URL-encoded>`. Componente aislado en `_result-cta.tsx`, 4 unit tests, decisión stub page > `#tbd`.
>
> **HARDENING-029 · Retiro de ruta legacy `/empresa/[cif]`** — Directorio eliminado. Regex `ENTITY_COMPANY_RE` en `CopilotProvider.tsx` migrado a `/empresa-f01/`. Verificación: `/es/empresa/{cif}` → 404 · `/es/empresa-f01/{cif}` → 200.
>
> **HARDENING-032 · Chips filtro `signal_badge` client-side en `/resultados`** — Utilidades puras en `_signal-filter.ts`, 2 toggles combinables AND. 8 unit tests. Empty state extra.
>
> **Estado previo (2026-08-14)** — 🟢 HARDENING-REQ003 CERRADO. Buscador 4 modos ordenados en `_execute_search_real`: CIF → categórico (`company-taxonomy/search`) → nombre (resolve) → NL exploratorio (`semantic-intelligence/search`). Fail-fast 8s vía `_intel_call_ff`. Política de fallback: fallo Intel → `_empty_response` honesto. Paginación server-side con `PAGE_SIZE=12`. Rechazados 3 ficheros del zip que regresaban a REQ001 (cliente paralelo).
> Documento vivo. Lo actualiza el agente al final de cada sub-tarea.
>
> **Orden final de modos**: `#1 CIF → #2 FINANCIAL (REQ004) → #3 CATEGORICAL (REQ003) → #4 NAME → #5 SEMANTIC`.
>
> **Verificación E2E dev pod, real Intel** — 5 queries + edge case fall-through:
> - Q1 `"empresas con ingresos superiores a 50 millones"` → **12 hits** financial ✅
> - Q2 `"agencias con EBITDA > 1M y más de 100 empleados"` → **62 hits** financial + paginación page=2 sirve items distintos ✅
> - Q3 `"agencias de marketing"` (sin numérico) → parse `None` → **898 hits** categorical REQ003 idéntico ✅
> - Q4 `"B28184687"` → CIF navigate_to `/empresa-f01/B28184687` ✅
> - Q5 `"clínicas dentales en Valencia"` → parse `None` → **49 hits** semantic REQ001b idéntico ✅
> - EDGE `"agencias de marketing con ingresos > 9,9×10¹⁸ millones"` → parse SÍ + Intel 0 rows → **fall-through a categorical 898 hits** (no `<Empty/>`, comportamiento aditivo verificado) ✅
>
> **Regresión**: `pytest test_financial_query.py` → **7/7** · `pytest test_copilot_search.py` + `test_platform_stats.py` → **19/19** · `yarn tsc --noEmit` verde · Screenshot Playwright confirma tabla poblada + chips REQ032 ortogonales + CTA REQ033 activa en flujo financial.
>
> **Ortogonalidad verificada** con features previas: HARDENING-032 chips signal_badge se aplican encima de la rama financial sin regresión (growth ON → 3 filas Alto crecimiento sobre 62 base). HARDENING-033 CTA aparece con copy anon ("Crea una cuenta para hacer seguimiento diario") cuando ≥1 chip activo.
>
> **Bundle final: 23 unidades** (22 previas + 1 nueva REQ004). Gate ampliado: Intel debe desplegar `skills/search` con filtros numéricos + `summary` **junto con** taxonomy + semantic re-embed. Sin cualquiera de esas piezas → fallback documentado a modo siguiente (feature latente, no error).
>
> **Estado previo (2026-08-15)** — 🟢 HARDENING-029 + HARDENING-032 + HARDENING-033 CERRADOS.
>
> **HARDENING-033 · CTA contextual sobre `/resultados` filtrado** — Detección de intención transaccional: cuando el usuario activa ≥1 chip `signal_badge` (HARDENING-032), aparece un CTA discreto sobre la tabla proponiendo el siguiente paso. Variantes por auth: (a) autenticado → `Link` a `/{locale}/me/watchlists/new?q=…&signals=…` (stub Fase 2 gated por `RequireAuth`, replicando patrón `perfil/page.tsx` con `EmptyStateBlock`, incluye botón "Volver a los resultados" preservando `q`); (b) anónimo → `Link` a `/{locale}/registro?next=<URL-encoded>` (futuro-proof: `/registro` no consume `next` hoy). Copy: "3 candidatos filtrados hoy. Crea una cuenta para hacer seguimiento diario." / "3 candidatos filtrados. ¿Guardar esta búsqueda como watchlist?" con variante singular/plural. Cero visual nuevo (mismos tokens que la action bar). No renderiza cuando ambos toggles OFF. Componente aislado en `resultados/_result-cta.tsx` (prefix `_` para excluir de Next.js route interpretation). 4 unit tests cubriendo los 3 invariantes + edge case ambos-ON con encoding correcto.
>
> **HARDENING-029 · Retiro de ruta legacy `/empresa/[cif]`** — Directorio `/app/frontend/src/app/[locale]/empresa/` eliminado. Regex `ENTITY_COMPANY_RE` en `CopilotProvider.tsx` migrado de `/empresa/` a `/empresa-f01/` (bug latente: sin esto, la ruta canónica dejaba de activar `entity_context` en el Copilot). 3 tests de tools (`companies-client`, `copilot-provider-entity`, `company-page-client`) actualizados a nuevo pathname. Comentarios documentales migrados en 10 archivos front/back. Verificación: `/es/empresa/{cif}` → **404** · `/es/empresa-f01/{cif}` → **200** · `orchestrator/index.ts` regex intacto (matchea ambas defensivamente en dispatch cliente).
>
> **HARDENING-032 · Chips filtro `signal_badge` client-side en `/resultados`** — Utilidades puras (`isGrowthBadge`, `isRiskBadge`, `applySignalFilter`) extraídas a `resultados/_signal-filter.ts` (Next.js App Router prohíbe exports arbitrarios desde `page.tsx`). 2 toggles combinables con AND: `filter-chip-growth` (Sólo alto crecimiento) + `filter-chip-exclude-risk` (Excluir riesgo). Estado local React, sin URL ni localStorage (HARDENING-031 aborda persistencia). Matching literal case-insensitive con token-map defensivo ES+EN (Intel emite hoy `alto_crecimiento`, `riesgo` en snake_case ES). Empty state extra cuando filtro deja `pageRows` vacío en la página actual pero `rows.length > 0`. 8 unit tests verdes cubriendo predicados + combinatoria AND + edge cases (null/undefined/case-sensitivity).
>
> **Estado previo (2026-08-14)** — 🟢 HARDENING-REQ003 CERRADO. Buscador 4 modos ordenados en `_execute_search_real`: (1) CIF → resolve → `/empresa-f01/{cif}`; (2) **categórico** → `company-taxonomy/search` con `offset`/`total` server-side → `/resultados` paginado; (3) nombre → resolve (único o disambiguation); (4) NL exploratorio → `semantic-intelligence/search` con slicing local. Fail-fast 8s vía `asyncio.wait_for` sobre el `AgencyToolClient` canónico. Política de fallback en modo real: fallo Intel → `_empty_response` honesto (R15, sin caer a mock). `SearchSkillRequest.offset` + `SearchResultItem.summary` aditivos. `resultados/page.tsx` paginación con `PAGE_SIZE=12`. Rechazados 3 ficheros del zip que regresaban a REQ001 (`intel_client.py`, `core/config.py adapter_mode`, `agency_tool_adapter/service.py intel_get`). Smoke dev pod: los 4 modos verdes end-to-end con Intel real (898 hits categórico, paginación 1→2 de 75). Fail-fast test unit: `dt=8.01s < 9s` + `empty_response` sin excepción.
> Documento vivo. Lo actualiza el agente al final de cada sub-tarea.


---

## 🟢 Estado activo · 2026-08-11 · LOTE B-2 COMPLETO

**Matriz consolidada** (ver `PLAN_BETA_status_20260810.md` para detalle):

| Ítem | Estado | CIF ref |
| :--- | :----- | :-- |
| B-2.1 Rankings backend passthrough | ✅ DONE | Bundle Turno D |
| B-2.2 Ownership con DPD (nombres ocultos anon) | ✅ DONE | `B28184687` Servier |
| B-2.3 Governance con DPD (5 roles ES agregados) | ✅ DONE | `B28184687` Servier |
| B-2.4 Refactor agregador `/ficha` (SWR 8→6) | ✅ DONE | Multi-CIF |
| B-2.5 Cash Flow UI + bridging (HARDENING-005) | ✅ DONE | Servier |
| B-2 Events shell BORME | ✅ DONE | Servier `available:false` → Empty |
| B-2 Item 6.a Identificación ampliada (34 campos) | ✅ DONE | Servier 4 subgrupos |
| B-2 Item 6.b Estructura de deuda | ✅ DONE | Servier st=2,4M€ · lt=Empty · fin=2,4M€ |
| B-2 Signals enriquecidos (HARDENING-007) | ✅ DONE | Multi-CIF |
| B-2 Fix R15 ratios rentabilidad (bridging) | ✅ DONE | Multi-CIF |
| B-2 Fallback resiliencia (HARDENING-008) | ✅ DONE | N/A |
| B-2 REQ-INTEL `shareholder.type` P3 | ✅ EMITTED | `PARA_INTEL_shareholder_type.md` |

**Sprint F0.3 · Valoración · ENTREGABLE MÍNIMO COMPLETADO** (2026-07-13).
**Sprint F0.2 · Finanzas · ✅ APROBADO**.

**Backlog priorizado (2026-08-11 · post B-2 cierre)**:
- 🔴 **DEPLOY ÚNICO A PROD** del lote B-2 completo. Pendiente user action: sync env vars vía Emergent Panel (`_KEY_ONETIME.txt` sigue vivo hasta confirmación).
- **P1** Mercado (rankings sectoriales) · Comparativa multi-empresa · Sector & Roll-up.
- **P1** Registros públicos · Documentos (dos secciones NAV pendientes).
- **P2** control-synergy (bloqueado por `buyers.count=0`).
- **P2** HARDENING-004 (TTL automático caché Mongo).
- **P2** HARDENING-002 (31 pytests backend con env coupling · despriorizado).
- **P2** Retirada fallback `identity.description` (cobertura Intel 1/6).
- **P3** REQ-INTEL `shareholder.type` (esperando entrega Intel).

**Sprint F0.4..F0.12** continúan pendientes por precedencia normal.


---

## 🔴 Estado histórico · 2026-07-06

**Sprint F0.2 · Finanzas · BLOQUEADO por dependencia externa** desde 2026-07-06 hasta 2026-07-12.
- **Motivo**: Agency Tool Master Layer vacío (0/13 CIFs con datos tras sondeos del 2026-07-06 y 2026-07-12 21:04/21:18).
- **Resuelto**: el 2026-07-12 21:53 UTC el usuario proporcionó el caso canónico `A87803862` validado por el equipo del Intelligence Engine. Los 3 endpoints devuelven 200 con datos reales.
- **Prohibida** cualquier solución temporal en Arroba: no poblar mocks financieros propios · no crear empresas especiales para la UI · no scraping · no modificar contratos.
- **Regla nueva canónica** activada durante el bloqueo: **R15 · Datos reales o Unavailable** (`memory/ARROBA_ARCHITECTURAL_PRINCIPLES.md`). Sustituye para siempre cualquier lógica "histórico ilustrativo" · resuelve la contradicción C14.4.
- **Reglas operativas F0.2-OP1..OP6** activadas el 2026-07-12 tras desbloqueo (`ARROBA_ARCHITECTURAL_PRINCIPLES.md`).


---

## 🧊 CANONICAL BASELINE v1.0 — 2026-06-25 (Sprint 0 + Sprint 0.5)

**Estado**: ✅ CERRADA Y CONGELADA · *frozen baseline*

Sprint puramente documental (cero código de producto). Establece la **capa 7 — Engines & Specs** del proyecto y consolida el canon a través de una auditoría completa y un Ciclo de propagación.

### Sprint 0 — Specs canónicos (6 documentos en `/app/memory/specs/`)

| Spec | Versión final | Función |
|---|---|---|
| `TRANSACTION_OS_SPEC.md` | v1.2.0 | Sistema operativo de la transacción: 15 fases canónicas (`T1`…`T15`), estados, transiciones y journey M&A end-to-end. |
| `TRANSACTION_COPILOT_SPEC.md` | v1.2.0 | Copilot orquestador de la transacción: contrato con OS, intents, herramientas, gobierno conversacional. |
| `COPILOTS_SPEC.md` | v1.1.0 | Catálogo y contrato común de los Copilots especializados por entidad. |
| `MEMORY_ENGINE_SPEC.md` | v1.1.0 | Capa de memoria: corto plazo, largo plazo, sintetización, hidratación, scopes. |
| `AGENTIC_LAYERS_SPEC.md` | v1.1.0 | Capas agénticas (perception → reasoning → action → reflection), gobernanza, límites de autonomía. |
| `MONETIZATION_SPEC.md` | v1.1.0 | Modelo de negocio: planes, gating funcional, fricciones de upgrade, métricas de monetización. |

### Sprint 0.5 — Ciclo A (auditoría) + Ciclo B (propagación + ensamblaje)

| Documento | Tipo | Resultado |
|---|---|---|
| `specs/CANON_AUDIT_REPORT.md` | Auditoría | Inventario completo de contradicciones (15 originales canon ↔ legacy) e inconsistencias intra-spec. |
| `specs/OPEN_ITEMS_CLASSIFICATION.md` | Clasificación | 4 grupos (G1: inconsistencias intra-spec autocerrables · G2: decisiones canónicas pendientes confirmadas en Ciclo B · G3: decisiones de producto que requieren input humano · G4: backlog estratégico). |
| `ARROBA_PHILOSOPHY.md` | Propagación | §6, §7, §13 reconciliados. Catálogo abstraído. **Match pasa a ser una entidad canónica de primer nivel**. §13 ampliada a 7 capas con Engines & Specs. |
| `ENTITY_MODEL.md` | Propagación → v1.1.0 | `client → user`. `match` añadido como entidad canónica de primer nivel (§5.7). Catálogo abstraído. |
| `ENTITY_FRAMEWORK.md` | Propagación → v1.1.0 | `match` con anatomía propia (§11.13). §11.8 Operación con fases canónicas `nda → im → qa → loi → dd → negotiation → spa → closing → integration`. Catálogo abstraído. |
| `PRD.md` | Propagación | Esta sección + cardinalidad eliminada del cuerpo. |
| `CHANGELOG.md` | Freeze | Entrada `v1.0-canonical-baseline (2026-06-25)`. |
| `CANON_INDEX.md` | Nuevo | Índice maestro navegable del canon completo. |
| `ENGINE_ARCHITECTURE.md` | Nuevo | Cadena de inteligencia: Fuentes → Data Layer → KG → Embeddings → Signal → Matching → Recommendation → Valuation → Risk → Transaction → Copilots → UX. |
| `SPRINT0_EXECUTIVE_SUMMARY.md` | Nuevo | Resumen ejecutivo del Sprint 0 + 0.5 para stakeholders. |
| `ARCHITECTURE_MAP.md` | Nuevo | Mapa visual ASCII + tablas compactas de la arquitectura. |
| `canonical_pack_v1.0.zip` | Pack | Pack distribuible con `/canonical`, `/specs`, `/audit`, `/summary` y README. |

### Decisiones canónicas confirmadas en Ciclo B

- **Match**: pasa a ser una entidad canónica de primer nivel. Materializa el resultado del motor de matching con identidad propia, ciclo de vida observable (`detected → reviewed → contacted → engaged → converted_to_operation | discarded`), score y trazabilidad bidireccional. Ver `ENTITY_MODEL.md` §5.7 y `ENTITY_FRAMEWORK.md` §11.13.
- **Renombre `client → user`**: actor humano del producto. Aplicado en todo el canon.
- **Renombre `team_arroba → arroba_team`**: nomenclatura interna del equipo. Aplicado.
- **Fases del journey**: numeradas `T1`…`T15` (`TRANSACTION_OS_SPEC.md` §3).
- **Fases del `Operation.current_phase`**: `nda → im → qa → loi → dd → negotiation → spa → closing → integration` (`ENTITY_MODEL.md` §5.8 + `ENTITY_FRAMEWORK.md` §11.8).
- **Capa 7 — Engines & Specs**: incorporada formalmente en `ARROBA_PHILOSOPHY.md` §13 entre *Entity Framework* y *Design System*.
- **Catálogo abstraído**: el conjunto de tipos del producto se enumera y se evoluciona por declaración, no por cardinalidad.

### Reglas que el Sprint 0/0.5 deja vivas

1. Los 6 specs del Sprint 0 son **fuente de verdad** sobre la arquitectura del producto. Si hay conflicto con código heredado, gana el spec.
2. El canon legacy (`ARROBA_PHILOSOPHY`, `ENTITY_MODEL`, `ENTITY_FRAMEWORK`, `PRD`, `CHANGELOG`) queda alineado con los specs.
3. Cualquier evolución posterior empieza por modificar el spec correspondiente + bumpear su versión + reflejar en `CHANGELOG.md`.
4. Sprint 1 (Identidad + Roles + Planes + Billing) **no se inicia hasta aprobación explícita del usuario**.

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
>
> El proyecto tiene **siete capas canónicas**: Blueprint Estratégico · UX Blueprint · **Entity Framework** (E1.5.6) · **Engines & Specs** (Sprint 0 · 6 specs canónicos) · Design System (E1.5.5) · Diseños (Claude) · Implementación (Emergent). Documentado en §13 de ARROBA_PHILOSOPHY.md.
>
> Fuentes de verdad por capa: `ARROBA_PHILOSOPHY.md` (estrategia + UX), `ENTITY_FRAMEWORK.md` (arquitectura UX), `ENTITY_MODEL.md` (ontología), `/app/memory/specs/*` (engines & specs canónicos), `DESIGN_SYSTEM.md` (visual).

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
| **E1.5-REWORK** | Empresa | ✅ **CERRADA 2026-06-24 (verificada por e1_tester 9/9)** |
| **E1.5.5** | Brand Refresh | ✅ **CERRADA 2026-06-24** — Empresa Polish + Design System v1.0.0 (552 líneas, 3 niveles). Verificada 3/4 PASS por e1_tester + 1 HUMAN_REQUIRED por limitación viewport (no fallo de producto). |
| **E1.5.6** | Consolidación Arquitectónica | ✅ **CERRADA 2026-06-24** — Entity Framework como 3ª capa canónica + Entity Model (ontología) + 11 componentes base + refactor CompanyHeader (sin regresión visual) |
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

## ✅ Etapa 1.5-REWORK — Empresa (Entity First) (CERRADA · 2026-06-24)

Materialización de la **filosofía v3.0 §12 «La ficha es la verdad»**. El chat
deja de generar páginas paralelas: ahora actualiza secciones in-place de la
Empresa Entity Page (`/empresa/{cif}`).

### Resumen de cierre

- **Backend**: 138/138 pytest PASS (114 previos + 24 nuevos en
  `test_companies_advisor.py`).
- **Frontend**: 131/131 Vitest PASS (102 previos + 29 nuevos para E1.5-REWORK).
- **Verificación independiente `e1_tester`**: 9/9 PASS + 1 warning (banner de
  `/w/{id}` solo verificable contra data legacy; sin impacto).
- **Filosofía v3.0 §12 verificada end-to-end**: el chat actualiza secciones
  in-place de la ficha; la URL nunca abandona `/empresa/{cif}`; el thread del
  dock muestra solo `response_text`, sin bloques sueltos.

### Highlights de implementación

- **Company Advisor**: prompt endurecido con la regla canónica §12 + few-shot
  ejemplos. Cuando la query toca {riesgos, oportunidades, análisis, resumen,
  lectura, fortalezas, debilidades, perspectiva}, DEBE emitir
  `section_updates` con `section="narrative"`. Para queries triviales
  (saludos, agradecimientos) devuelve `[]`.
- **Fallback determinista** (`_ensure_section_update_when_needed`): si el LLM
  omite el `section_updates` y `_detect_section_intent()` matchea un patrón
  de actualización clara, sintetizamos un `narrative` block desde
  `response_text` (extrayendo bullets para `risks` u `opportunities` según
  contexto). Red de seguridad para Claude no determinista.
- **RefreshAnalysisButton** con **optimistic cooldown 60s client-side** tras
  éxito (no hace falta esperar al 429 del backend). Si llega 429, parsea los
  segundos restantes del body y arranca el countdown apropiado.
- **Ruta canonical** `/empresa/{cif}` (uppercase forzado tanto en URL como en
  detección de pathname para el `entity_context` del Copilot).
- **Dock en modo `entity_context`**: `CopilotProvider.send()` redirige a
  `apiClient.companies.sendMessage()` y despacha
  `window.dispatchEvent(new CustomEvent("arroba:company-section-update"))`
  con `{cif, section_updates}`. `state.workspace` permanece `null`.
- **Search reposicionada con 6 paths**: Entity Resolution (CIF/nombre exacto)
  → redirige directo a `/empresa/{cif}` sin pasar por workspace.
- **Retrocompatibilidad `/historial`**: intacta, los workspaces legacy se
  siguen listando y reabriendo (sin queries nuevas).

### Variantes de contrato a recordar

| Aspecto | Forma estable |
|---|---|
| Body request envío de mensaje | `{ "query": str, "context": { "locale": str, "pathname": str } }` (NO `prompt` ni `message`). |
| Shape `CompanyDetailResponse.header` | `{ "cif": str, "name": str, "sector"?: str, "region"?: str, "country"?: str, "initials"?: str, "score"?: int }` (no `legal_name` ni `master_company_id` aquí). |
| Rate-limit `/skills/analyze` | HTTP **429** con `body.detail` = `"Espera Ns."` + header `Retry-After: N` (segundos). Cliente debe consumir ambas fuentes. |
| Estructura `section_updates[]` | `[{ "section": "narrative"\|"valuation"\|"comparables"\|"metrics"\|"signals"\|"identity", "block": BlockSpec }]` — el `section` es el discriminador (sin `id` top-level). |
| `CustomEvent` channel | `arroba:company-section-update` con `detail: { cif: str, section_updates: SectionUpdate[] }`. El listener filtra por `cif`. |

### Subentregables

| Entregable | Estado | Notas |
|---|---|---|
| **`/empresa/[cif]`** (ruta mixta anónima + autenticada) | ✅ | Server-side rendering con hidratación; 3 secciones públicas + 5 LockedSectionBlur cuando anónimo; 8 secciones cuando autenticado. |
| **Backend `companies`** | ✅ | CRUD + Skills + Rate Limiting + LLM Advisor. |
| **Company Advisor** | ✅ | Copilot scoped a UNA empresa. Prompt endurecido + fallback determinista. |
| **`CustomEvent("arroba:company-section-update")`** | ✅ | `CopilotProvider` (entity_context) despacha; `CompanyPageClient` escucha y actualiza secciones in-place. |
| **`RefreshAnalysisButton`** | ✅ | Optimistic cooldown 60s + parseo de Retry-After en 429. |
| **`CompanyHeader` (acciones)** | ✅ | Toggle watchlist + share-with-team gated por watchlist. Toasts «Próximamente: E1.8» y «Próximamente: E1.9». |
| **Entity Resolution en `/copilot/search`** | ✅ | CIF / nombre exacto → `navigate_to=/empresa/{cif}`. |
| **`apiClient.companies.*` SDK** | ✅ | `Content-Type: application/json` preservado (regresión cubierta por test). |
| **Tests Vitest E1.5-REWORK** | ✅ | 29 tests nuevos. |
| **Verificación E2E (`e1_tester`)** | ✅ | 9/9 PASS + 1 warn. |

### P0 resuelto

**Bug**: Claude real devolvía `section_updates: []` aunque la query era
explícitamente sobre riesgos → la ficha nunca se refrescaba → el chat parecía
colgado.

**Fix**: prompt endurecido (philosophy v3.0 §12 incrustada) + fallback
determinista `_ensure_section_update_when_needed()` que sintetiza un
narrative block desde el `response_text` cuando se detecta una intención
clara de actualizar sección (`_detect_section_intent()` con keywords
acentos-insensibles).

### Decisiones de scope

- Las skills `analyze` (refresh narrativa) y comparables/valuation tienen
  endpoints REST dedicados con rate limit 60s; la valoración avanzada y la
  activación de oportunidad muestran toasts «Próximamente E1.8/E1.9».
- Toggle watchlist y share-with-team operan contra colecciones con índices
  únicos compuestos `(org_id, master_company_id, saved_by, visibility)`.
- TTL de 90 días para `company_analysis_refreshes` (auto-limpieza Mongo).

---

## ✅ Etapa 1.5.5 — Empresa Polish + Design System v1.0.0 (CERRADA · 2026-06-24)

**Canonización de la 5ª capa del proyecto** (Design System) según
`ARROBA_PHILOSOPHY.md` §13. Usa la ficha de Empresa de E1.5-REWORK como
patrón canónico de referencia para las siguientes entidades.

### Resumen de cierre

- **Backend**: 138/138 pytest PASS (sin cambios; fase puramente de frontend).
- **Frontend**: 142/142 Vitest PASS (131 previos + 11 nuevos en `design-system-primitives.test.tsx`).
- **Build + typecheck + lint**: limpio.
- **Cero hardcoded** de hex/rgba/px en `components/{entity,copilot,blocks}` core (auditado).
- **Light + Dark** verificados end-to-end en `/empresa/{cif}` real con `buyer@arroba.com` + en `/internal/design-system`.
- **Responsive** verificado a 390px (mobile), 768px (tablet) y 1920px (desktop).

### Subentregables P0 (must-ship)

| Entregable | Estado | Notas |
|---|---|---|
| **Token audit & hardening** | ✅ | `src/styles/tokens.css` reescrito (~240 líneas) — paleta semántica canónica (brand-*, surface-*, text-*, border-*, success/warning/danger/info, locked-overlay), escalas spacing 4→96, type display/h1-h4/body/body-sm/caption/mono con line-height + tracking, radius 0→full, shadows sm→xl, transitions fast/normal/slow + easings, z-index, gradients. Light + Dark coherentes sin condicionales en componentes. |
| **Tailwind mapping** | ✅ | `tailwind.config.ts` reescrito exponiendo TODOS los nuevos tokens como utilities (`bg-surface-elevated`, `text-h2`, `duration-fast`, `z-modal`, etc.) + 2 keyframes (`section-pulse`, `fade-in-up`). Aliases legacy mantenidos para retrocompat. |
| **11 componentes canónicos** | ✅ | EntityHeader, EntitySection (re-exports estables), LockedSectionBlur, RefreshButton (nuevo, 4 estados con `data-state`), MetricsGrid (nuevo, 1/2/3/4 col + trends), MetricsBlock, EntityEvolutionChart (inline SVG), LoadingBlock, EmptyStateBlock, ErrorBlock, UnavailableBlock (nuevo, distinto de Empty/Locked/Error con `req`+`eta`), Toast (`notify()` helper). |
| **CompanyPageClient migrado a RefreshButton** | ✅ | Sin regresión visual; cobertura test cooldown optimista 60s mantenida. |
| **DESIGN_SYSTEM.md v1.0.0** | ✅ | 552 líneas en `/app/memory/DESIGN_SYSTEM.md`. Nivel 1 (tokens con tabla light/dark/uso), Nivel 2 (11 componentes con anatomía + props + variantes + cuándo NO usar), Nivel 3 (12 Page Patterns: 1 ✅ Company canónico + 6 🔵 templates futuros + 5 🟡 parciales). |
| **Tests Vitest E1.5.5** | ✅ | 11 nuevos en `design-system-primitives.test.tsx`: UnavailableBlock (3), RefreshButton (4 estados), MetricsGrid (4 incluido columns 1/2/3/4). |

### Subentregables P1 (ship-if-time)

| Entregable | Estado | Notas |
|---|---|---|
| **Living `/internal/design-system`** | ✅ | Expandido con `DesignSystemV1Catalog`: theme switcher persistente (toggle `data-dark`), breakpoint badge live, tabla de 16 tokens semánticos con swatches, type scale visual, RefreshButton 4 estados, MetricsGrid 4-col + 2-col, state family (loading/empty/error/unavailable/locked) lado a lado, toast helpers 4 kinds, listado de los 12 Page Patterns con su estado de implementación. |
| **Responsive Empresa** | ✅ | Mobile (<640): header stack vertical, acciones apiladas, MetricsGrid 1-col. Tablet (768-1024): 2-col layout, header lado-a-lado. Desktop (≥1024): 4-col layout completo. Verificado con capturas reales en producción. |

### Subentregables P2 (best-effort)

| Entregable | Estado | Notas |
|---|---|---|
| **Accesibilidad** | 🟡 parcial | `aria-live="polite"` en UnavailableBlock + listener section_updates. `aria-busy` en RefreshButton loading. `:focus-visible` global con focus-ring rojo. `aria-label` en trend icons. Sin axe-core CI todavía (parking para fase posterior). |
| **Microinteracciones** | 🟡 parcial | `transition-colors duration-fast` aplicado a cards/CTAs. `animate-fade-in-up` en dock open. `prefers-reduced-motion` colapsa transitions globalmente. `animate-section-pulse` definido pero no aplicado todavía al section update (deferred). |

### Highlights de implementación

- **Brand identity intacta** — la auditoría de hardcoded migró 4 gradients
  + 3 backgrounds + 1 inline color a tokens (CopilotDock, FeatureCardBlock,
  CTABlock, HeroBlock). Cero cambio visual.
- **Type scale dual** — añadimos la escala canónica del brief (`display/h1-h4/body/body-sm/caption/mono`) sin romper la legacy (`xs/sm/base/...`). Los aliases legacy se mantienen mappeados a los nuevos valores.
- **Theme switching reactivo** — el switcher del Living DS sólo añade/quita
  el atributo `data-dark` en `<html>`. Toda la UI se redibuja
  automáticamente porque solo consumimos CSS vars.
- **EntityHeader sin generalización prematura** — `entity/index.ts`
  re-exporta `CompanyHeader as EntityHeader`. La API canónica está
  documentada; la generalización real llega en E1.6 cuando exista la
  primera Sector Page.

### Page Patterns documentados (Nivel 3)

| # | Pattern | Estado | Fase |
|---|---|---|---|
| 1 | Company Page | ✅ canónico de referencia | E1.5-REWORK |
| 2 | Sector Page | 🔵 template | E1.6 |
| 3 | Territory Page | 🔵 template | E1.7 |
| 4 | Valuation Page | 🔵 template | E1.8 |
| 5 | Opportunity Page | 🔵 template | E1.9 |
| 6 | Transaction Page | 🔵 template | E2.0 |
| 7 | Dashboard | 🟡 parcial | continuo |
| 8 | Search Results | 🟡 parcial | continuo |
| 9 | Assistant / Copilot Dock | 🟡 parcial | E1.5-REWORK |
| 10 | State family (loading/empty/error/locked/unavailable) | ✅ unificado | E1.5.5 |
| 11 | Valuation Result | 🟡 parcial | E1.8 |
| 12 | Marketplace Flows | 🔵 stub | post-E2.0 |

### Capturas de cierre

- `/tmp/ds_v1_light.png` + `/tmp/ds_v1_dark.png` — Living DS catalog.
- `/tmp/empresa_v1_light.png` + `/tmp/empresa_v1_dark.png` — ficha Empresa polished.
- `/tmp/empresa_v1_mobile.png` (390px) + `/tmp/empresa_v1_tablet.png` (768px) — responsive.

---

## ✅ Etapa 1.5.6 — Consolidación Arquitectónica (CERRADA · 2026-06-24)

**Canonización de la 3ª capa del proyecto** (Entity Framework) según
`ARROBA_PHILOSOPHY.md` §13 (en aquel momento 6 capas; ampliada a **7
capas** en Sprint 0.5 Ciclo B con la incorporación formal de la capa
*Engines & Specs*). Sin modificar
comportamiento, sin nuevas entidades, sin cambios de navegación ni Design
System: solo infraestructura conceptual + arquitectónica para que las
próximas entidades (Sector, Territorio, Valoración, Oportunidad, Persona,
Advisor, Mandato, Operación) sean **composición de módulos existentes**.

### Resumen de cierre

- **Backend**: 138/138 pytest PASS (sin cambios; fase 100% conceptual + frontend).
- **Frontend**: 152/152 Vitest PASS (142 previos + 10 nuevos en
  `entity-framework.test.tsx` cubriendo EntityHeader + EntitySections).
- **Build + typecheck + lint**: limpio.
- **Cero regresión visual** en `/empresa/{cif}`: capturas before vs after
  light + dark idénticas pixel-a-pixel.
- **Cero regresión funcional**: el flujo P0 de E1.5-REWORK (chat refresca
  sección) sigue intacto. Todos los testids canónicos
  (`company-header`, `company-header-actions`, `company-action-*`)
  preservados tras el refactor.

### Subentregables

| Entregable | Estado | Notas |
|---|---|---|
| **`/app/memory/ARROBA_PHILOSOPHY.md` §13 actualizado** | ✅ | 5 capas → **6 capas** insertando Entity Framework entre UX Blueprint y Design System. Regla de jerarquía actualizada. |
| **`/app/memory/ENTITY_MODEL.md`** | ✅ | Apartados canónicos: filosofía + principios + catálogo de tipos canónicos (incluye `match` como entidad de primer nivel) + campos comunes + relaciones por entidad + grafo del producto + reglas de negocio + versionado + ejemplos JSON + principios de evolución. Versión v1.1.0 tras Sprint 0.5 Ciclo B. |
| **`/app/memory/ENTITY_FRAMEWORK.md`** | ✅ | Apartados canónicos: filosofía + qué es una entidad + anatomía canónica de módulos + orden obligatorio + mapping al DS + estados + responsive + navegación + reglas de composición + reglas de reutilización + ejemplos completos por tipo (incluye Match en §11.13) + principios de evolución. Versión v1.1.0 tras Sprint 0.5 Ciclo B. |
| **11 componentes base** en `src/components/entity/base/` | ✅ | EntityHeader (real presentational base), EntityHero, EntityMetrics, EntityInsights, EntityAnalisis, EntityAdvisor, EntitySignals, EntityRelations, EntityActions, EntityDocuments, EntityActivity + EntitySections (orquestador canónico del orden §4) + types.ts (EntityTypeId, EntityModuleId, EntityModuleState, EntityHeaderAction, EntitySectionDescriptor, DEFAULT_SECTION_IDS, CANONICAL_MODULE_ORDER) + barrel `index.ts`. Cada componente con JSDoc canónico (propósito, props, especialización, ejemplos). |
| **Refactor `CompanyHeader`** | ✅ | Convertido a smart container que mantiene 100% de la lógica (watchlist, share, toasts E1.8/E1.9) y delega a `EntityHeader` base. Mantiene todos los testids canónicos: `company-header`, `company-header-name`, `company-header-subtitle`, `company-header-score`, `company-header-actions`, `company-action-{watchlist,share,request-valuation,activate-opportunity,download-memory,claim}`, `company-action-more`. Añade `data-entity-type="company"` al root. |
| **Tests Vitest E1.5.6** | ✅ | 10 nuevos en `entity-framework.test.tsx`: EntityHeader (5 — data-entity-type, score badge, derive initials, actions row visibility, stable testids + click handlers) + EntitySections (5 — canonical sort, locked state, unavailable state con REQ/ETA, action slot only on ready, data attributes). |
| **PRD actualizado** | ✅ | Fila E1.5.5 ✅ + Fila E1.5.6 ✅ + referencias canónicas a `ENTITY_FRAMEWORK.md` + `ENTITY_MODEL.md` desde la sección "FUENTE DE VERDAD CANÓNICA". |

### Decisiones de diseño

- **EntityHeader presentacional + container smart**: el primitivo base es
  puro (sin estado, sin API calls). El container (`CompanyHeader`) compone
  el array `actions: EntityHeaderAction[]` y mantiene toda la lógica
  específica de Empresa. Esto preserva 100% testids actuales sin que el
  primitivo conozca terminología company-specific.
- **`entityType` como discriminador**: todas las primitivas base aceptan
  `entityType` y lo exponen como `data-entity-type` en el DOM. Hoy no
  cambia comportamiento; mañana permite specialisation por CSS, analytics
  y QA.
- **No generalización prematura**: NO se creó SectorHeader / TerritoryHeader
  / ValuationHeader / OpportunityHeader. Solo se documentan en
  `ENTITY_FRAMEWORK.md` §11 con sus módulos activos/omitidos. La
  implementación real se hace en E1.6+ cuando exista la página.
- **EntitySections es la API objetivo**: el `CompanyPageClient` actual NO
  consume el orquestador `EntitySections` para evitar regresión durante
  E1.5.6. Las primeras consumidoras serán las páginas de E1.6 en
  adelante. Hoy el contrato está testeado y verificable.
- **Wrappers thin = añaden data attrs, no markup**: EntityHero, EntityMetrics,
  EntityInsights, EntityAnalisis, EntityRelations son pass-throughs de
  ~10 líneas sobre los primitives del DS añadiendo solo
  `data-entity-section` y `data-entity-type`. Cero cambio visual.

### Hierarquía actualizada de capas canónicas

```
1. Blueprint Estratégico         (PHILOSOPHY)
        ↓
2. UX Blueprint                  (PHILOSOPHY §12)
        ↓
3. Entity Framework              (ENTITY_FRAMEWORK + ENTITY_MODEL)   ✨ E1.5.6
        ↓
4. Design System                 (DESIGN_SYSTEM)                     E1.5.5
        ↓
5. Diseños (Claude)
        ↓
6. Implementación (Emergent)
```

### Verificación visual

Capturas before vs after del refactor (Kitchen Studio, S.L.):

- `/tmp/empresa_before_light.png` ↔ `/tmp/empresa_after_light.png` — idénticas.
- `/tmp/empresa_before_dark.png` ↔ `/tmp/empresa_after_dark.png` — idénticas.

Todos los componentes canónicos del header verificados con Playwright en
producción: name, actions row, watchlist toggle (con estado "En tu
cartera"), share, request-valuation, activate-opportunity (primary
red), download-memory, claim, more-dropdown. `data-entity-type="company"`
confirmado en el root.

### Files key

- Docs: `memory/ENTITY_FRAMEWORK.md` (828 líneas), `memory/ENTITY_MODEL.md` (818 líneas), `memory/ARROBA_PHILOSOPHY.md` §13 actualizado a 6 capas.
- Componentes base: `frontend/src/components/entity/base/{types,EntityHeader,EntityHero,EntityMetrics,EntityInsights,EntityAnalisis,EntityAdvisor,EntitySignals,EntityRelations,EntityActions,EntityDocuments,EntityActivity,EntitySections,index}.{ts,tsx}` — 14 archivos.
- Refactor: `frontend/src/components/entity/CompanyHeader.tsx` (de container monolítico → smart container delegando a EntityHeader base).
- Tests: `frontend/src/components/entity/base/entity-framework.test.tsx` (10 tests).
- PRD: sección E1.5.6 CERRADA agregada.

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

---

## ✅ Sprint 1 — Primer flujo vertical arroba.com (F0-F9 CERRADO · 2026-07-04)

Materialización de las 5 reglas arquitectónicas del brief E2E (Composer permanente en layout, `entities/lookup` genérico, Ficha declarativa vía `EntitySections`, cero acoplamiento FE→Agency Tool, C16 grep limpio).

### Resumen de cierre por fase

| Fase | Entregable | Estado | Notas |
|---|---|---|---|
| F0 | Seed Grupo Olmedo + Clínica Vet Vallés + `test_credentials.md` actualizado | ✅ | Fork anterior |
| F1 | Backend endpoints: `GET /api/entities/lookup` genérico multi-tipo, `GET /api/companies/{cif}` DTO extendido aditivo, `GET /api/users/me/watchlist` | ✅ | Fork anterior · 154 tests verde |
| F2 | 4 primitives frontend (`IdentityCard`, `SignalsTimeline`, `DocumentList`, `ActivityTimeline`) | ✅ | Fork anterior |
| F3 | `CopilotProvider` extendido con `useEntityContext()` hook + tipo `EntityContext` multi-tipo | ✅ | Fork anterior |
| F4 | Composer permanente hoisted al layout raíz `[locale]/layout.tsx` (Regla 1) | ✅ | Fork anterior + verificación en este sprint |
| F5 | Home privada (`/inicio`) con saludo dinámico + `FeatureCardBlock` shell + `CompanyCardsGridBlock` watchlist (cuando existe) | ✅ | **Movida de `/` a `/inicio` para resolver colisión con landing público. `(public)/page.tsx` redirige auth users a `/inicio`.** |
| F6 | `CompanyPageClient.tsx` refactor 100 % declarativo vía `<EntitySections/>` con **12 módulos canónicos** (header/hero/kpis/insights/analisis/senales/relaciones/oportunidades/documentacion/actividad/acciones/advisor). Módulos no entregados en estado `unavailable` con `req`/`eta`. | ✅ | Sección analisis lleva `RefreshButton` en slot `action`. Sección oportunidades acoge la valoración indicativa. Senales/documentacion/actividad quedan `unavailable`. |
| F7 | `useEntityContext().publish()` en mount + `publish(null)` en unmount (Regla 1). `animate-section-pulse` 700 ms al recibir `section_updates` o refresh de análisis (state `updating` en EntitySections). | ✅ | Publica para autenticados y anónimos por igual. |
| F8 | **Nomenclatura canónica**: `source: 'mock'\|'real'` → `provenance: 'demo'\|'live'` en tipos frontend + alias backend `GET /api/platform/stats` (Regla 4: FE nunca habla lenguaje del proveedor). `CopilotDemoMock` → `CopilotDemoTeaser`. `home-hero-search-mock` → `home-hero-search-teaser`. Todos los comentarios "Agency Tool" purgados. Journey `MockCompany`/`COMPANIES_MOCK` → `DemoCompany`/`COMPANIES_DEMO`. | ✅ | **C16 grep: 0 ocurrencias de `agency\|adapter\|mock` en `frontend/src` fuera de tests.** |
| F9 | Suites completas verde | ✅ | **Backend 157/157 pytest** (154 previos + 3 nuevos alias) · **Frontend 165/165 vitest** · `next build` verde · `tsc --noEmit` limpio. |

### Reglas arquitectónicas verificadas

1. **Regla 1** — Composer vive en `[locale]/layout.tsx` (raíz), no en la página. Se adapta al contexto vía `useEntityContext()` que cualquier Entity Page publica en mount. ✅
2. **Regla 2** — `GET /api/entities/lookup` acepta `types=company,sector,territory,...` (11 tipos canónicos). ✅
3. **Regla 3** — `CompanyPageClient` es composición 100 % declarativa. NO decide layouts locales. Solo elige el estado (`ready`/`locked`/`unavailable`/`updating`) de cada uno de los 12 módulos canónicos y delega a `<EntitySections/>`. ✅
4. **Regla 4** — Ningún URL frontend contiene `agency-tool`. El alias `/api/platform/stats` es la única superficie que el frontend consume. Legacy `agency-tool` sigue vivo en backend para retrocompat interna. ✅
5. **Regla 5 (C16)** — grep `agency\|adapter\|mock` en `frontend/src` product code: **0 hits**. ✅

### Ficheros clave modificados/creados

**Backend**:
- `src/modules/platform/{__init__,router}.py` — nuevo módulo alias `/api/platform/stats`.
- `src/main.py` — includes `platform_router`.
- `tests/test_platform_stats_alias.py` — 3 tests: 404 sin seed, mapping `source:mock`→`provenance:demo`, `source:real`→`provenance:live` (via monkeypatch de `ADAPTER_MODE`).

**Frontend**:
- `src/components/entity/CompanyPageClient.tsx` — reescrito completo (~600 líneas) en modo declarativo.
- `src/components/entity/company-page-client.test.tsx` — 5 tests actualizados a canonical section IDs.
- `src/components/entity/base/EntitySections.tsx` — el `action` slot se conserva también en state `updating` (para que RefreshButton no desaparezca durante el pulse).
- `src/components/copilot/CopilotProvider.tsx` — sin cambios en esta fase (extendido en F3).
- `src/lib/companies/types.ts` — `source: 'mock'|'real'` → `provenance: 'demo'|'live'`.
- `src/lib/orchestrator/types.ts` — mismo cambio en 4 respuestas de skill.
- `src/lib/api/types.ts` — `PlatformStats.source` → `.provenance` + comentario limpio.
- `src/lib/api/client.ts` — `apiClient.agencyTool.platformStats` → `apiClient.platform.stats` hitting `/api/platform/stats`.
- `src/components/blocks/{MetricsBlock,SearchResultsBlock,UnavailableBlock}.tsx` — copy + endpoint + data attrs actualizados.
- `src/components/home/CopilotDemoTeaser.tsx` (renombrado desde `CopilotDemoMock.tsx`) + `copilot-demo-teaser.test.tsx` (renombrado).
- `src/app/[locale]/(public)/page.tsx` — copy hero + redirect auth users a `/inicio`.
- `src/app/[locale]/(authenticated)/inicio/page.tsx` — Home privada (movida de `/` para resolver colisión).
- `src/lib/journey/{data,derive}.ts`, `components/journey/{CompanyConfirm,CompanyPicker}.tsx`, `app/[locale]/(authenticated)/onboarding/page.tsx` — `MockCompany`→`DemoCompany`, `COMPANIES_MOCK`→`COMPANIES_DEMO`, comentarios limpios.
- `src/components/entity/base/EntitySignals.tsx` — comentario "Agency Tool real" → "real data provider".
- `src/components/copilot/copilot-dock.test.tsx` — mocks `useAuth` autenticado + `useActiveOrg` + fetch router por URL para test isolation.

### Rutas para lanzar `e1_tester`

- **Preview URL**: la definida en `REACT_APP_BACKEND_URL` del pod actual (Next runs on 3000; ingress route `/api/*` to 8001).
- **Landing público (marketing)**: `/` → `/es` (`data-testid="public-home"`).
- **Home privada (dashboard)**: `/inicio` → `/es/inicio` (`data-testid="home-privada"`). Requiere sesión.
- **Ficha empresa canonical**: `/empresa/B47820150` → `/es/empresa/B47820150` (Grupo Olmedo Hoteles, S.L.). CIF alternativo: `B08540200` (Clínica Veterinaria Vallés).
- **Testids clave** para `e1_tester`:
  - Home privada: `home-privada`, `home-privada-greeting`, `home-privada-card-analyze`, `home-privada-card-value`, `home-privada-card-operation`, `home-privada-cartera` (cuando watchlist tiene items).
  - Ficha empresa (autenticado): `entity-section-hero`, `entity-section-kpis`, `entity-section-insights`, `entity-section-analisis`, `entity-section-senales`, `entity-section-relaciones`, `entity-section-oportunidades`, `entity-section-documentacion`, `entity-section-actividad`, `entity-section-acciones`, `company-refresh-analysis`, `entity-actions`, `company-header-name`.
  - Ficha empresa (anónimo): `entity-section-{analisis,senales,relaciones,oportunidades,acciones}-locked`.

### Credenciales (sin cambios respecto al fork anterior)

Ver `/app/memory/test_credentials.md` sección "Sprint 1".

### Riesgos residuales / cosas que NO se han tocado

1. La ficha de empresa mantiene el layout `[locale]/empresa/[cif]/layout.tsx` con su **propio** `CopilotProvider + CopilotDock` (mixed-access sin `(authenticated)`/`(public)` groups). Esto duplica el provider raíz. Funciona (React tolera Providers anidados) pero es candidato a limpieza en un sprint futuro (P2 · consolidación).
2. `POST /api/copilot/skills/analyze` sigue devolviendo campo `source` (no `provenance`) en el body — el frontend nunca lo consume, así que no hay bug funcional, pero el body sigue teniendo un campo "legacy". Cambiar el shape del body es breaking change para consumidores externos, se deja para un sprint futuro.
3. El módulo `agency_tool_adapter` sigue existiendo en el backend con endpoints `/api/agency-tool/*` (para retrocompat interna). No se elimina — solo el frontend deja de hablarlo. Renombrado o retiro programado para un Sprint futuro cuando el proveedor real (REQ-001) entregue.
4. **Screenshot smoke**: en localhost `next start` el fetch a `/api/companies/...` devuelve 404 porque no hay proxy interno; sí funciona a través del ingress del preview URL. Los tests unit-level cubren con fixtures deterministas.

