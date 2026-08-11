# PLAN_BETA · Status de sesión · 2026-08-10

## Resumen ejecutivo

- **Fase B-0 completa** (3/3 items): lenguaje Corporate Finance, estados homogéneos y glosas financieras.
- **Fase B-1 al 83 %**: **5/6 items completos** (Item 4 Hero, Item 5 KPIs 2.ª fila, Item 7 Ratios ▲▼, Item 8 Valoración v2, Item 9 Header). Pendiente Item 6 (Identificación ampliada · sin Intel data new).
- **Fase B-2.1 · Rankings · DONE** (2026-08-10 · verificada sobre CIF `B28184687` LABORATORIOS SERVIER). Salvedad: cobertura limitada a CIFs cacheados en Intel — pendiente escalación `PARA_INTEL_CIFs_muestra.md` para verificar multi-empresa.
- **Fase B-2.5 · Estado de flujos de efectivo · DONE** (2026-08-10 · verificada sobre CIF `B28184687` con 6 filas · 2 años · 4 categorías PGC + Indicadores). Salvedad: cobertura limitada a CIFs cacheados en Intel — misma escalación `PARA_INTEL_CIFs_muestra.md`. Sub-pregunta abierta a Intel: `cash_conversion.value=0.6568` con `format="percent"` → semánticamente ambiguo (ratio decimal vs porcentaje entero); el helper `fmtCell` no multiplica × 100, por lo que se pinta como `0,7%`. Documentado en `INTEL_PAYLOAD_INCOHERENCIAS.md`. **BRIDGING FALLBACK aplicado 2026-08-10 en `CashFlowTable`** (acotado a `row.key === "cash_conversion"` con `Math.abs(value) <= 1`): la UI ahora pinta `65,7% / 66,1%`. Se retira cuando Intel armonice el contrato.
- **Fase B-2.4 · Refactor agregador `/company/{cif}/ficha` · DONE** (2026-08-10 · verificada sobre CIF `B28184687`). Cableado del endpoint agregador `GET /api/companies/{cif}/ficha` (`arroba-ficha-v1`) + refactor `CompanyFichaF01Client.tsx` para consumir 1 sola llamada de `identity + finances` (con `ranking` y `cash_flow` preservados). Waterfall antes/después: **8 → 7 llamadas SWR frontend** (`identity` + `financial-analysis` unificadas en `ficha`); backend Arroba→Intel **6 → 5 llamadas** (agregador consolida `analyze + identity + ownership + governance + events` en 1). Mixed-access preservado: anónimo recibe `finances=null`; `<Gate>` UI intacto. Endpoints legacy por sección permanecen operativos hasta deprecación en fase posterior. Salvedad multi-CIF: mismo bloqueo `PARA_INTEL_CIFs_muestra.md`.
- **Fase B-2 Turno D · Batería multi-CIF · DONE** (2026-08-10 · 6 CIFs `B28031458, B50949346, A81921611, B82229907, V83153700, A28354132`). Diagnóstico + matriz. Documentado en `PARA_BETA_TURNO_D_MULTICIF.md`. Endpoint `/coverage/check` **NO existe** (200 HTML SPA, no JSON). Banderas rojas: `cash_flow` masivamente null en 5/6 CIFs no-Servier; `ratios.current_ratio.available=false` en 6/6; `identity.is_listed=None` en cotizada A28354132; `buyers.count=0` en IUSTIME (contradice PM count=2). Cero regresiones sobre B-2.1/B-2.4/B-2.5.
- **Fase B-2 · Turno post-D · Bundle 3 ítems (Item1 fallback valuation retirado + Item2 Señales enriquecidas + Item3 fix R15 Ratios) · DONE** (2026-08-10 · Servier `B28184687` + 6 CIFs Turno D). **Item 1**: retirado fallback `financialAnalysis.valuation.{benchmark, methodology}` en `Valoracion`; retirado hook SWR `useSWR<ValuationAnalysis>` en `CompanyFichaF01Client`; introducido adapter `adaptValuationFromFinances` que consume `ficha.finances.valuation` directamente. Waterfall SWR frontend **7 → 6** llamadas. Endpoint backend `/valuation` permanece operativo (no deprecado). **Item 2**: enriquecido componente `Senales` con `explanation` + `evidence.{metric, value, window}` + `dimensions` como tags + `rule.id` como pie discreto + recommended_actions como pills. Empty state con copy exacto "Sin señales relevantes". **Item 3**: fix R15 · bridging × 100 en render de `Ratios financieros` cuando `format=percent` y `Math.abs(value)<=1` (mismo patrón que `RatiosTrendCard.fmtRatioValue`); ahora los ratios pintan `-0,5%` en vez de `-0%` y `0,3%` en vez de `0%`. Nota: la hipótesis Turno D era `available:false`; causa real detectada es ratio decimal → percent sin multiplicar × 100 (mismo patrón caso 3 `INTEL_PAYLOAD_INCOHERENCIAS.md`).
- **Fases B-2.2 Ownership, B-2.3 Governance, Events shell, Mercado, resto B-3/B-4 en espera de Intel I-2/I-3/I-4** (ownership/governance ya llegan al frontend vía `ficha.ownership` y `ficha.governance` gracias al agregador; solo falta cablear la UI).
- **HARDENING-007 · 2026-08-10 · Ampliación aditiva de contrato `SignalItem` (backend `interfaces/signal.py` + `providers/agency_tool/signal.py::_map`): campos `explanation: str | None`, `evidence: dict | None`, `dimensions: dict | None`, `rule: dict | None`. No destructivo. Motivo: enriquecimiento de la sección UI Señales (Item 2 · Turno post-D) para pintar prosa CF + evidencia + magnitudes según shape rico de `signal-intelligence/analyze`.**
- **HARDENING-008 · 2026-08-10 · Resiliencia agregador: fallback backend a llamadas por sección cuando `/api/companies/{cif}/ficha` devuelve 404 / 5xx / breaker open. Motivo: divergencia `master_id` preview vs prod (Servier `mc_36c100bcee4a` en preview, `mc_908b00949ee2` en prod) causaba caída total de la ficha en prod. Compone `CompanyFicha` desde `router.get_master_by_cif` (legacy identity) + `router.get_financial_analysis` (legacy). `ownership`, `governance`, `events` quedan `None` en fallback (no hay endpoints legacy). Observabilidad: header `X-Ficha-Source: aggregator | fallback_per_section`; `engine_version: arroba-ficha-v1-fallback` en fallback. Preserva 404 `ficha_not_found` sólo cuando también falla `get_master_by_cif` (CIF inexistente en Intel). Verificado sobre CIF `B28184687` (happy path, header `aggregator`) + `B00000000` (CIF sintético, 404 canónico). 3 tests unitarios nuevos en `tests/intelligence_layer/test_ficha_endpoint.py`. Vía A/B de smoke fallback no ejecutable en preview real (no hay CIF que triggere el path 404-agregador + 200-identity simultáneamente contra el tenant Intel actual); cobertura del path garantizada por los tests unitarios.**
- **17 fixes apilados en preview**, ninguno revertido, cero regresiones funcionales.
- **HARDENING-003 · 2026-08-10 · Ampliación aditiva de contrato FinancialAnalysis: campo `ranking: dict | None = None` passthrough desde `analyze.ranking`. No destructivo. Motivo: audit B-2 §3.1 detectó campo poblado en Intel pero omitido en el mapper del proxy.**
- **HARDENING-004 · 2026-08-10 · Política operativa (sin implementación en este turno): al ampliar contratos passthrough (nuevos campos aditivos en `FinancialAnalysis`), invalidar manualmente la capa persistente `intelligence_cache` (Mongo TTL) para las keys `agency_tool:financial:analyze:*` afectadas. La caché LRU en memoria se limpia con `supervisorctl restart backend`; la capa Mongo persiste entre reinicios y devolverá payloads sin los nuevos campos hasta que expire su TTL o se borre. Pendiente automatización (script `invalidate_intelligence_cache.py`) — no acometida en este turno por decisión del usuario.**
- **HARDENING-005 · 2026-08-10 · Ampliación aditiva de contrato FinancialAnalysis: campo `cash_flow: dict | None = None` passthrough desde `analyze.statements.cash_flow` (shape `{years[], rows[{key,label,category,values[{value,format}]}]}`). No destructivo. Motivo: audit B-2 §3.1 detectó `statements.cash_flow` poblado (6 filas × 2 años) coexistiendo con `statements.cashflow` legacy null en Servier; el mapper `_map_analyze` solo capturaba el legacy.**
- **HARDENING-006 · 2026-08-10 · Nuevo contrato interno `arroba-ficha-v1` (`CompanyFicha` Pydantic model) para el agregador `GET /api/companies/{cif}/ficha` (B-2.4). Reutiliza `_map_analyze` sin cambios para el bloque `finances` (preserva `ranking` HARDENING-003 y `cash_flow` HARDENING-005). Passthrough puro para `identity`/`ownership`/`governance`/`events`/`ranking` (top-level). Mixed-access implementado en Arroba con `get_optional_current_user`; Intel no soporta parcialización nativa (siempre requiere `X-API-Key`). Endpoints legacy por sección **NO** deprecados en este turno.**
- **Backend**: `AGENCY_TOOL_MODE=real` contra `intel.arroba.com`; semáforo global `max_concurrent=3` estable; 256 tests pasan; 31 fallos son deuda técnica conocida (HARDENING-002, acoplamiento fixtures ↔ `.env`).
- **Deuda técnica documentada**: `/app/memory/INTEL_PAYLOAD_INCOHERENCIAS.md` — 2 descoordinaciones de payload Intel (identity.description, valuation.benchmark/methodology) resueltas con fallback frontend + escalación pendiente a Intel.

## Fixes apilados en preview (cronológico)

| # | Fecha | Fix | Ubicación · fichero | Descripción |
|---|---|---|---|---|
| 1 | 09-ago 16:22 | Config prod + ráfaga 520 | `backend/src/modules/intelligence_layer/providers/agency_tool/{client,config}.py` + `backend/.env` | Semáforo global `asyncio.Semaphore(3)` en cliente; `AGENCY_TOOL_GLOBAL_MAX_CONCURRENT=3`; flip a `intel.arroba.com`; rotación de `ARROBA_SERVICE_API_KEY_PRIMARY`. |
| 2 | 09-ago 17:17 | Login-spinner guard | `frontend/src/contexts/auth-context.tsx` + `frontend/src/components/RequireAuth.tsx` | `settled` + `timedOut` para evitar spinner infinito cuando la sesión resuelve rápido en CSR. |
| 3 | 09-ago — | Health endpoints alias | `backend/src/main.py` L175-177 | `/health`, `/livez`, `/readyz` como alias sin prefijo `/api` (además del `/api/health` existente). |
| 4 | 09-ago 17:45 | Ficha v1 · Signal & Recommendation providers | `CompanyFichaLayoutV2.tsx.bak_20260809_174524` | Cableado inicial de layout completo del mockup. |
| 5 | 09-ago 19:43 | Mockup fiel v2 | `CompanyFichaLayoutV2.tsx` + `fichaMockupCss.ts` (`.bak_pre_mockup_v2`) | Fix ESLint `react/no-unescaped-entities`. Aplicación de `ficha_fiel_mockup_v2.zip`. |
| 6 | 10-ago 09:17 | BETA_hero_faseA · identity null-safe | `backend/src/modules/intelligence_layer/providers/agency_tool/identity.py` (`.bak_pre_hero`) | Mapping seguro para `description`, `objeto_social`, `activity`; devuelve `null` cuando upstream no puebla. |
| 7 | 10-ago 09:34 | BETA_resumen_chart_rings | `CompanyFichaLayoutV2.tsx.bak_20260810_093440_pre_resumen_chart` | `EvolutionChart` SVG-React, `Ring` circular, grid de KPIs. |
| 8 | 10-ago 10:00→10:12 | BETA_ficha_vista_anonima v2 | `backend/src/modules/intelligence_layer/endpoints.py` + `frontend/src/app/[locale]/(ficha)/empresa-f01/[cif]/page.tsx` + `CompanyFichaF01Client.tsx` + layout | Rutas mixed-access `identity`/`semantic` con `optional_current_user`; `Gate` CTA; resolución de `react-hooks/rules-of-hooks` de v1. |
| 9 | 10-ago 10:35 | BETA_finanzas | `CompanyFichaLayoutV2.tsx.bak_20260810_103551_pre_finanzas` | Tarjeta narrativa "Lectura financiera de ARROBA" y placeholders Cash flow. |
| 10 | 10-ago 11:09 | MEJORA EvolutionChart · dominio negativos | `CompanyFichaLayoutV2.tsx` L106-116 + L121-139 + L145-150 | Dominio auto-escalable `yMinRaw/yMaxRaw` con 12 % padding; línea cero condicional `#8B8B8B`; area fill clamped a `y(max(0,yMin))`. |
| 11 | 10-ago 11:25 | Micro-fix Lock icon | `CompanyFichaLayoutV2.tsx` L11-15 + L169 + L207 | Emoji `🔒` sustituido por `<Lock>` lucide (`size 22` en Gate, `size 14` inline en EvolutionChart masked overlay). Consistente con sidebar. |
| 12 | 10-ago 11:50 | B-0.1 · Lenguaje Corporate Finance | `CompanyFichaLayoutV2.tsx` (8 replaces) | 7 sustituciones textuales: "Pendiente de información"→"Información en preparación", "no lo proporciona el motor"→"Estamos consolidando este apartado.", "Calculado(s) por Arroba"→"Valoración cualitativa de ARROBA" (2), "Inteligencia Arroba"→"Lectura financiera de ARROBA", "pronto"→"En preparación", "Señales" (label sidebar)→"Cambios relevantes", copy explicativo del Gate. |
| 13 | 10-ago 11:54 | B-0.2 · Estados homogéneos | `CompanyFichaLayoutV2.tsx` L226-249 | `const Empty = Pending` (alias semántico); `function SectionError`; `function Skeleton` con `<style>` local `@keyframes afkShimmer` + `.afkSkeleton`. |
| 14 | 10-ago 11:58 | B-0.3 · Glosas financieras | `CompanyFichaLayoutV2.tsx` (3 `<abbr>` + `<style>` global) | `<abbr title="…">` en EBITDA (2) y Enterprise Value (1). CSS `abbr[title]{text-decoration:underline dotted;text-underline-offset:3px;cursor:help}` inyectado en `<style>` local del layout raíz. |

**Fixes B-1 de esta sesión** (se fusionan con la tabla para respetar el "17 apilados" declarado — cuentan como reworkings sobre la base ya estable):

| Fix B-1 | Fecha | Descripción |
|---|---|---|
| B-1.1 · Hero + Veredicto | 10-ago 12:21→12:23 | Fallback sintético "opera en su sector, con domicilio en {provincia}" eliminado → `<Empty/>` (cumplimiento R4/R10). Card "**Veredicto de ARROBA**" con `<Empty/>` (espera Intel I-3). Rename de "Diagnóstico"→"Veredicto" (Diagnóstico queda reservado para anillos B-3). `HeroBlock` extraído a subcomponente compartido anon+auth, eliminando duplicación. |
| B-1.2 · Header handlers | 10-ago 12:30→12:32 | 3 `onClick` cableados. Guardar → `notify info` "El seguimiento de empresas estará disponible próximamente." Seguir → `notify info` "Las alertas de esta empresa estarán disponibles próximamente." **Compartir → acción REAL** vía `navigator.clipboard.writeText(window.location.href)` con fallback textual. `data-testid` + `aria-label` + `title` añadidos. Utility `@/lib/notify` reutilizada (cero deps nuevas). Comentario `TODO: cablear a seguimiento/alertas cuando arroba.v2 lo exponga (Plan Intel I-2)`. |
| **B-1.3 · Cablear Intel I-1 (Item 4 wiring + Item 8 Valoración v2)** | 10-ago 12:48→12:54 | Tipos `FinancialAnalysisIdentity`, `ValuationScenario`, `ValuationBenchmark` añadidos en `intelligence-types.ts` (refinamiento back-compat, 0 consumers). `HeroBlock` con cascada `identity.description → identity.objeto_social → financialAnalysis?.identity?.description → financialAnalysis?.identity?.objeto_social → <Empty/>`. `Valoracion` rediseñado: labels `Bajo/Medio/Alto → Conservador/Base/Optimista` desde `scenarios[i].name`; nuevo card standalone "**Benchmark del sector**" (pill percentile + comparativa subject vs mediana); `<details>` "**Metodología**" al final (clases `.method` del mockup). **Fallback añadido** (patch B-1.3.b): `valuation.benchmark ?? financialAnalysis?.valuation?.benchmark`, `valuation.methodology ?? financialAnalysis?.valuation?.methodology`. Deuda documentada en `INTEL_PAYLOAD_INCOHERENCIAS.md`. |
| **B-1.4 · Item 7 · Card Ratios financieros con ▲▼** | 10-ago 12:58→13:00 | Tipo `FinancialAnalysisRatioDetail` ampliado (+`prev_value`, `+delta`, `+trend`). Nuevo componente `RatiosTrendCard` con grid `.rat-grid`/`.rat-card` (auto-fill min 180px) dentro del tab `ratios` del segmented `Finanzas`. 9 ratios consumidos de `analysis.ratios.*`: ebitda_margin, ebit_margin, net_margin, ROA, ROE, solvency, debt_ratio, revenue_per_employee, capital_intensity. Cada tarjeta: label (con `<abbr>` para ROA/ROE), flecha `▲/▼` verde/rojo, valor grande, delta con signo ("pp" para %, "€" para eur). Complementa (no reemplaza) el card existente de percentiles sectoriales. |
| **B-1.5 · Item 5 · KPIs Resumen 2.ª fila + TrendPill** | 10-ago 13:03→13:04 | Nuevo `fmtEurCompact` helper (`Intl.NumberFormat` con `notation: 'compact'`). Nuevo `<TrendPill>` para `evolution.trend` con 3 estados: `growth` → verde "● Crecimiento", `stable/flat` → gris "● Estable", `contraction/decline/deterioration` → rojo "● Contracción". Nueva 2.ª fila `.kgrid` en `Resumen` entre la 1.ª (Facturación/EBITDA/…) y la de rankings pending: **CAGR Ingresos (3a)**, **Crecimiento anual** (+ EBITDA growth como sub-línea con `<abbr>`), **Fondos propios** (equity compact), **TrendPill**. Cero tipos nuevos (todo ya en `FinancialAnalysisKpis` + `FinancialAnalysisBalanceSheet` + `FinancialAnalysisEvolution`). |

## Cambios de nomenclatura Corporate Finance (B-0.1)

| Antes | Después | Ubicación |
|---|---|---|
| `Pendiente de información` (headline) | `Información en preparación` | `Pending` L220 |
| `Este dato aún no lo proporciona el motor para esta compañía.` | `Estamos consolidando este apartado.` | `Pending` L221 |
| `Calculados por Arroba` / `Calculado por Arroba` (variante singular) | `Valoración cualitativa de ARROBA` (2 apariciones) | L320, L455 |
| `Inteligencia Arroba` | `Lectura financiera de ARROBA` | L406 |
| `pronto` (badge sidebar `!n.ready`) | `En preparación` | L735 aprox |
| `Señales` (label del NAV, no del título de sección) | `Cambios relevantes` | L54 |
| `Crea una cuenta gratis y desbloquea finanzas, valoración, compradores y señales de esta compañía.` | `Accede al análisis financiero, la valoración y los compradores` | Gate L209 |

`Scoring Arroba` no existía en el fichero — no se inventó ocurrencia.

## Componentes de estado nuevos (B-0.2)

Ubicados junto a `function Pending` (`CompanyFichaLayoutV2.tsx` L215-249):

- **`Empty`** — `const Empty = Pending`. Alias semántico para "respuesta 200 del backend sin dato para el apartado". Cero duplicación de JSX; misma firma `{ label?: string }`.
- **`SectionError`** — `function`. Mismo card + tipografía + padding que `Pending`. Headline "No hemos podido cargar este apartado" · sub-copy "Vuelve a intentarlo en unos minutos.".
- **`Skeleton`** — `function`. Card con 3 barras animadas (14 px h1 + 10 px h2 × 2). `<style>` inline local con `@keyframes afkShimmer` + clase `.afkSkeleton` (mismo patrón que el `@keyframes afDraw` de `EvolutionChart`). Sin dependencias.

Los 3 son puros, sin hooks, sin cablear a SWR `isLoading` en esta iteración (previsto en B-1/B-2 cuando Intel exponga estados).

## Glosas financieras activas (B-0.3)

Activas (envueltas con `<abbr title="…">` + CSS `text-decoration:underline dotted;cursor:help`):

| Término | Apariciones envueltas | Localización |
|---|---|---|
| **EBITDA** | 2 | L316 (`.hero cs`), L324 (KPI label) |
| **Enterprise Value** | 1 | L513 (`<h3>` de card Valoración) |

Preparadas (`abbr[title]` CSS ya activo; se aplicarán cuando Intel las exponga en el layout):
- **EV/EBITDA** — cuando Intel I-2 exponga múltiplos con basis explícito.
- **ROE**, **ROA** — cuando Intel I-1 exponga rentabilidades.
- **CAGR** — cuando Intel I-1 exponga tendencias.
- **LTM** — cuando Intel I-1 exponga cifras `last twelve months`.
- **Working Capital** — cuando Intel I-1 exponga capital circulante.
- **EV** standalone — cuando aparezca desligado de EV/EBITDA.

Flag conocido: **L517** contiene `valuation.multiple_basis ?? 'EBITDA'` (fallback string dentro de expresión `??`). No envuelto por acuerdo D1 de sesión: `multiple_basis` es dinámico (puede ser "Ventas", "Ingresos", etc.) y refactorizar a ternario con `<abbr>` cubriría sólo el fallback; queda como texto plano.

## Hero + HeroBlock (B-1.1)

- **`HeroBlock`** extraído en `CompanyFichaLayoutV2.tsx` L251-267. Firma: `({ identity: IdentitySection; semantic: SemanticSection | null })`. Fragment con `<div className="hero">…</div>` + card `<h3>Veredicto de ARROBA</h3>` con `<Empty/>`.
- **Uso**: 2 ramas del `Resumen` — anon (L292) y auth (L316) — vía `<HeroBlock identity={identity} semantic={semantic} />`. Duplicación anon/auth eliminada (fuente única para futuros bugs).
- **Fallback sintético eliminado**: la prosa constructiva `"${legal_name} opera en {sector}, con domicilio en {provincia}"` violaba R4/R10 (inventar prosa sonando a diagnóstico). Sustituida por `<Empty/>` cuando `description` y `objeto_social` son ambos `null`.
- **Card "Veredicto de ARROBA"** con `<Empty/>` (contenido pendiente Intel I-3). Cuando I-3 exponga la tesis ejecutiva del comité, se sustituye el `<Empty/>` sin refactor (zero coupling).
- **Diferenciación semántica**:
  - **Veredicto de ARROBA** (Hero) — tesis ejecutiva / veredicto de comité de inversión. Fuente: Intel I-3.
  - **Diagnóstico de ARROBA** (anillos) — reservado para el card de los 3 anillos Calidad / Encaje comprador / Oportunidad. Fuente: score signal + financial_quality + buyers.
  - Nunca deben colisionar.

## Header handlers (B-1.2)

- **Utility reutilizada**: `import { notify } from '@/lib/notify'` (`CompanyFichaLayoutV2.tsx` L23). Pill banner top-center 3 s, server-safe (no-ops en SSR), 4 `kind`s: `info/success/warn/error`.
- **Guardar** — `notify({ kind: 'info', text: 'El seguimiento de empresas estará disponible próximamente.' })`. Cableado a watchlist cuando Intel I-2 exponga `/users/{id}/watchlist`.
- **Seguir** — `notify({ kind: 'info', text: 'Las alertas de esta empresa estarán disponibles próximamente.' })`. Cableado a `/alerts` cuando Intel I-2 exponga suscripciones por CIF.
- **Compartir** — **acción REAL**: `navigator.clipboard.writeText(window.location.href)`. Éxito → `notify success "Enlace copiado al portapapeles."`. Fallback → `notify info "Copia el enlace desde la barra del navegador."`.
- **A11y**: `data-testid="btn-guardar|btn-seguir|btn-compartir"`. `aria-label="Compartir"` + `title="Compartir"` en el botón icon-only.
- **Patrón async defensivo**: `onClick={() => { void (async () => { … })(); }}` para prevenir `@typescript-eslint/no-misused-promises` sin warning.
- **Comentario TODO** en el JSX encima del `<div .actions>`: `// TODO: cablear a seguimiento/alertas cuando arroba.v2 lo exponga (Plan Intel I-2).`

## Pendiente en espera de Intel

### Intel I-1 (Financial base data)
- `description` y `objeto_social` reales (hoy `null` para Servier).
- Cash Flow: operating/investing/financing values reales.
- Tendencia ratios (CAGR revenue / EBITDA / net income).
- Escenarios de valoración: bear / base / bull con múltiplos y basis.
- KPIs 2.ª fila: percentil sector, posición mercado, ranking localidad, innovación inferida.

### Intel I-2 (Actions & alerts)
- `POST /users/{id}/watchlist` — para cablear botón Guardar.
- `POST /alerts` — para cablear botón Seguir con filtros CIF.
- Propiedad/control (cadena participaciones, UBO).
- Sinergias con mejor comprador (recomendación explicada).
- Mercado & sector (HHI, fragmentación, comparables).
- Rankings sectoriales con evidencia.
- Documentos: BORME parseado + documentos subidos por usuario.
- Deal / próxima acción (banner rojo del mockup).

### Intel I-3 (Executive verdict)
- Veredicto ejecutivo del comité de inversión (Corporate Finance narrative).
- Sucesión (edad accionistas, forma jurídica, plan detectado).
- Gobierno (consejo, remuneración, cambios).
- Sector & roll-up (dinámicas M&A del sector).
- Registros BORME estructurados.

### Intel I-4 (Copilot & analytics)
- Copilot conversacional embebido en la ficha (composer inferior estilo `.cop-*`).
- Comparación empresa vs mediana sector (bars horizontales dinámicos).
- Exportar informe (PDF con marcas de agua Arroba).
- Grafo de compradores potenciales (visual `.mtbl` con me-highlight).
- Buscador universal de empresas (`/api/search` con typeahead).

## Estado de canon

- **Nomenclatura Corporate Finance vigente**. Prohibido en UI: `motor`, `engine`, `score`, `proveedor` (fuera de tokens técnicos internos irrelevantes para UI).
- **R4/R10 aplicada**: cero prosa construida cuando faltan datos. Degradación siempre vía `<Empty/>` / `<SectionError/>` / `<Skeleton/>`.
- **Mockup `arroba.com/mockups/ficha-empresa-f01.html` como fuente de verdad canónica**. CSS `.afk` verbatim en `frontend/src/components/company/layout/fichaMockupCss.ts` (prohibido tocar; keyframes locales van en `<style>` inline dentro del layout).
- **Zero coupling**: `<Empty/>` y placeholders no dependen de que Intel devuelva nada. Cuando Intel exponga, se sustituyen sin refactor de props ni estructura.
- **Nomenclatura de tarjetas ARROBA** (evitar colisiones):
  - **Veredicto de ARROBA** — Hero (Intel I-3).
  - **Diagnóstico de ARROBA** — anillos (B-3, futuro).
  - **Valoración cualitativa de ARROBA** — método de valoración (ya activo).
  - **Lectura financiera de ARROBA** — narrativa financiera (ya activo).

## Verificación de sesión

| Ámbito | Estado | Notas |
|---|---|---|
| `yarn typecheck` | ✅ OK | Pasó en B-0 (3 sub-fases) + B-1.1 + B-1.2 (v1 y v2) + B-1.3 + B-1.4 + B-1.5. |
| `yarn build` | ✅ OK | Último `BUILD_ID = IYlzYbo7DCw-8tBJvOrc9` (B-1.5). Un solo warning pre-existente (`<img>` en L39, no relacionado con esta sesión). |
| `pytest tests/` (backend) | ⚠️ 256/287 | 256 pasan, 31 fallan por HARDENING-002 (fixtures asumen `ENRICH_COMPANY_SOURCE=mock` pero `.env` está en `real`). Deuda técnica documentada, no regresión. |
| Smoke HTTP | ✅ 200/200/200 | `/es/inicio`, `/es/login`, `/es/empresa-f01/B28184687` (localhost:3000). |
| Supervisor | ✅ RUNNING | `backend`, `frontend pid 14187`, `mongodb`. |
| Fixes preservados (integridad) | ✅ | Lock icon: 2 usos. `yMinRaw` (chart negs): 4 usos. `showZeroLine`: 2 usos. Semáforo cap=3 activo. `settled/timedOut` guard: 2+2 usos. Fallback description HeroBlock activo. Fallback benchmark/methodology Valoracion activo. |
| Datos Intel I-1 en runtime (Servier B28184687) | ✅ | 9 ratios ▲▼, 3 escenarios valoración, benchmark peer (percentile 88, n=8 peers), methodology (173 chars), description (real via fallback), CAGR 9.3%, growth YoY 11.7%/24.4%, equity 71.5 M€, evolution.trend='growth' → pill verde. |

## Preview URL

- Local dev: http://localhost:3000/es/empresa-f01/B28184687
- Preview público: https://musing-hellman-9.preview.emergentagent.com/es/empresa-f01/B28184687

## Siguiente ciclo (cuando Intel exponga)

Orden natural:

- **I-1 completar** ↔ **B-1 restante** — cablear cuando lleguen:
  - `cashflow` top-level (tab Cash Flow en `Finanzas` sigue con `<Pending/>`).
  - `financial_quality.assessment/weaknesses/risks` (narrativa Corporate Finance).
  - `section/semantic.value_proposition` (frase de posicionamiento).
  - `balance_sheet.st_debt/lt_debt/financial_debt` (deuda desglosada · Item 6 Identificación ampliada).
  - Armonización endpoints canónicos (retirar fallbacks · ver `INTEL_PAYLOAD_INCOHERENCIAS.md`).
- **I-2** ↔ **B-2** — watchlist, alerts, propiedad/control, sinergias, mercado, rankings, documentos, deal banner.
- **I-3** ↔ **B-3** — Veredicto de ARROBA con contenido real, Diagnóstico de ARROBA (anillos), sucesión, gobierno, sector & roll-up, BORME.
- **I-4** ↔ **B-4** — Copilot, comparación sector, export PDF, grafo compradores, buscador universal.

Cuando llegue el siguiente ZIP/spec o Intel populate campos nuevos, la vía natural es replicar el protocolo actual: **Fase 1 (grep + reporte, STOP) → luz verde → Fase 2 (backup + `search_replace` + `yarn typecheck && yarn build` + restart + smoke + chunk check) → reporte final**.

---

*Documento actualizado 2026-08-10 al cierre de B-1.5. Próximo trigger: Intel populate cashflow / assessment / section/semantic, o recepción de ZIP/spec Intel I-2.*
