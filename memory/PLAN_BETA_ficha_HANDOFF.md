# ARROBA BETA · Ficha de empresa · Handoff de sesión

> Documento de traspaso para retomar el trabajo sin contexto previo. Estado a 2026-08-10 tras el cierre de las sub-fases B-0, B-1.1, B-1.2, B-1.3, B-1.4, B-1.5.

---

## 1. Contexto y misión

- **Producto**: ARROBA Matching v1.0 — Ficha de empresa consumida por autenticados y anónimos en la ruta `/es/empresa-f01/[cif]`.
- **Rol de Arroba**: consumidor de Intel (motor externo `intel.arroba.com`). Arroba **nunca calcula ni infiere**; solo consume payloads canónicos (`arroba-identity-v1`, `arroba-financial-v1`, `arroba-valuation-v1`, `arroba-recommendation-v1`, etc.). Cumplimiento estricto **R4/R10** del canon.
- **Fuente de verdad visual**: mockup `arroba.com/mockups/ficha-empresa-f01.html` (referenciada en JSDoc del layout). CSS embebido verbatim en `frontend/src/components/company/layout/fichaMockupCss.ts` bajo scope `.afk`. **Prohibido tocar `fichaMockupCss.ts`**; los keyframes locales van en `<style>` inline del componente.
- **Regla operativa**: si Intel devuelve `null`/vacío en un campo cableado → `<Empty/>` con la copy canónica "Información en preparación · Estamos consolidando este apartado." **Nunca inventar prosa constructiva** (fallback sintético eliminado en B-1.1).
- **Nomenclatura Corporate Finance** obligatoria (B-0.1): prohibidos en UI los términos "motor", "engine", "score" (como label), "proveedor". Únicos labels autorizados con ARROBA:
  - **Veredicto de ARROBA** — Hero, tesis ejecutiva (Intel I-3).
  - **Diagnóstico de ARROBA** — reservado para anillos B-3, futuro.
  - **Valoración cualitativa de ARROBA** — método de valoración (ya activo).
  - **Lectura financiera de ARROBA** — narrativa financiera (ya activo).

---

## 2. Estado actual de preview

| Ámbito | Valor |
|---|---|
| Preview URL público | `https://musing-hellman-9.preview.emergentagent.com/es/empresa-f01/B28184687` |
| Localhost dev | `http://localhost:3000/es/empresa-f01/B28184687` |
| Backend interno | `http://localhost:8001` (FastAPI, supervisor-managed) |
| Backend externo | vía preview URL con prefijo `/api` |
| Credenciales test | `/app/memory/test_credentials.md` (chmod 600 · usuario `test.arroba+neo@arroba.com`) |
| Último `BUILD_ID` frontend | `IYlzYbo7DCw-8tBJvOrc9` (B-1.5 · yarn build 15.68 s) |
| `yarn typecheck` | ✅ 2.81 s |
| `yarn build` | ✅ 15.68 s · 1 warning pre-existente `<img>` (no relacionado) |
| pytest `src/modules/intelligence_layer` | ✅ 130/130 |
| pytest `tests/` completo | ⚠️ 256/287 (31 fallos HARDENING-002, deuda documentada, no regresión) |
| Smoke HTTP | ✅ `/es/inicio` 200 · `/es/login` 200 · `/es/empresa-f01/B28184687` 200 |
| Supervisor | ✅ backend + frontend + mongodb RUNNING |
| Backend mode | `AGENCY_TOOL_MODE=real` contra `intel.arroba.com` |
| Semáforo global | `AGENCY_TOOL_GLOBAL_MAX_CONCURRENT=3` (activo en `agency_tool/client.py`) |
| CIF probado durante toda la sesión | `B28184687` — LABORATORIOS SERVIER · `master_id=mc_36c100bcee4a` · farmacéutica MADRID · CNAE 2120 |

---

## 3. Mapa completo del PLAN_BETA_ficha

Estado de las 4 fases y 21 items del plan original.

### Fase B-0 · Lenguaje y estados

| # | Item | Estado | Referencia | Ficheros | Notas |
|---|---|---|---|---|---|
| 1 | Corregir fugas de lenguaje (7 sustituciones) | ✅ | B-0.1 | `CompanyFichaLayoutV2.tsx` | 6 aplicadas; "Scoring Arroba" no existía. Renombrados: Pendiente de información → Información en preparación; motor → consolidando; Calculado(s) por Arroba → Valoración cualitativa de ARROBA; Inteligencia Arroba → Lectura financiera de ARROBA; pronto → En preparación; Señales (label sidebar) → Cambios relevantes; copy explicativo Gate. |
| 2 | Estados homogéneos (Skeleton / Empty / Error) | ✅ | B-0.2 | idem | `const Empty = Pending` (alias semántico); `function SectionError`; `function Skeleton` con `<style>` local `@keyframes afkShimmer` + `.afkSkeleton`. Copy CF consistente. |
| 3 | Glosas financieras `<abbr>` | ✅ | B-0.3 | idem | Activas: EBITDA×2, Enterprise Value×1. Tras B-1.4: ROA×1, ROE×1 en el card Ratios. CSS `abbr[title]{text-decoration:underline dotted;text-underline-offset:3px;cursor:help}` en `<style>` local del layout raíz. |

### Fase B-1 · Cableado Intel I-1

| # | Item | Estado | Referencia | Ficheros | Notas |
|---|---|---|---|---|---|
| 4 | Hero · descripción + objeto social + Veredicto placeholder | ✅ | B-1.1 + B-1.3 | `CompanyFichaLayoutV2.tsx`, `intelligence-types.ts` | `HeroBlock` extraído (L253) usado en anon+auth. Fallback cascada: `identity.description → identity.objeto_social → financialAnalysis?.identity?.description → financialAnalysis?.identity?.objeto_social → <Empty/>`. Card **Veredicto de ARROBA** con `<Empty/>` hasta Intel I-3 populate. Fallback sintético "opera en su sector, con domicilio en {provincia}" eliminado (cumplimiento R4/R10). Nuevo tipo `FinancialAnalysisIdentity` (subset explícito). |
| 5 | KPIs Resumen 2.ª fila + TrendPill | ✅ | B-1.5 | idem | 2.ª fila `.kgrid` entre 1.ª (Facturación/EBITDA/…) y rankings pending: **CAGR Ingresos (3a)** 9,3 % · **Crecimiento anual** 11,7 % + sub-línea "EBITDA 24,4 %" (con `<abbr>`) · **Fondos propios** 71,5 M € (via `fmtEurCompact` con `Intl.NumberFormat` compact) · **`<TrendPill>`** con `evolution.trend`. Pill: `growth`→verde "● Crecimiento", `stable`→gris "● Estable", `contraction/decline`→rojo "● Contracción", otro→fallback "—". Cero tipos nuevos. **Cash Flow tab del Finanzas sigue con `<Pending/>`** hasta que Intel populate `cashflow` top-level. |
| 6 | Identificación ampliada | ⏳ | — | — | Sin data Intel new. Espera enriquecimiento de campos `identity` aún null: `activity_status`, `sectors[]` completo, `address_full`, `autonomous_community`, `founded_date`. |
| 7 | Ratios financieros con ▲▼ | ✅ | B-1.4 | `CompanyFichaLayoutV2.tsx`, `intelligence-types.ts` | 9 tarjetas grid `.rat-grid` (`auto-fill minmax(180px,1fr)`) dentro del tab `ratios` del segmented `Finanzas`, tras el card existente de percentiles sectoriales (complementario, no reemplazo). Ratios cableados desde `financialAnalysis.ratios.*`: Margen EBITDA/EBIT/neto, ROA (con `<abbr>`), ROE (con `<abbr>`), Solvencia, Ratio de deuda, Ingresos por empleado, Intensidad de capital. Cada tarjeta muestra label + flecha `▲/▼` (verde/rojo) + valor grande + delta con signo ("pp" para %, "€" para eur). Los 3 `available:false` (gross_margin, current_ratio, debt_to_equity) no se renderizan (silencio elegante). Tipo `FinancialAnalysisRatioDetail` ampliado con `+prev_value +delta +trend`. CSS local `.rat-grid/.rat-card`. |
| 8 | Valoración v2 (escenarios + benchmark + metodología) | ✅ | B-1.3 | `CompanyFichaLayoutV2.tsx`, `intelligence-types.ts` | Labels EV renombrados **Bajo/Medio/Alto → Conservador/Base/Optimista** via `scenarios[i].name` con capitalize (fallback tuple `readonly [string,string,string]`). Nuevo card standalone **Benchmark del sector**: pill "Percentil 88 del sector · n=8 peers", `.bmk-row` grid 2 columnas: `Margen EBITDA` (subject 11,3 % vs mediana 3,9 %) e `Ingresos` (164,2 M€ vs 116,0 M€). Nuevo `<details className="method"><summary>Metodología</summary>` al final del componente con texto de 173 chars. **Fallback aplicado** (patch B-1.3.b): `valuation.benchmark ?? financialAnalysis?.valuation?.benchmark ?? null`, mismo para methodology. Nuevos tipos `ValuationScenario` y `ValuationBenchmark`. Flag L517 resuelto (`multiple_basis = 'inferred_reference'`, no "EBITDA" hardcode). CSS local `.perc-pill/.bmk-row`. |
| 9 | Header Guardar/Seguir/Compartir | ✅ | B-1.2 | idem | 3 `onClick` cableados en `.chead .actions`. **Guardar** → `notify({kind:'info', text:'El seguimiento de empresas estará disponible próximamente.'})`. **Seguir** → idem "Las alertas de esta empresa estarán disponibles próximamente.". **Compartir → acción REAL** con `navigator.clipboard.writeText(window.location.href)` + toast success "Enlace copiado al portapapeles." / fallback info "Copia el enlace desde la barra del navegador.". Patrón async defensivo: `onClick={() => { void (async () => {...})(); }}` (previene `@typescript-eslint/no-misused-promises`). `data-testid="btn-guardar|btn-seguir|btn-compartir"` + `aria-label="Compartir"` + `title="Compartir"`. Utility `@/lib/notify` reutilizada (cero deps). Comentario `TODO: cablear a seguimiento/alertas cuando arroba.v2 lo exponga (Plan Intel I-2)`. |

### Fase B-2 · Intel I-2 (watchlist + alerts + propiedad + mercado + rankings + documentos + deal)

Todos los items dependen de la llegada del ZIP/spec Intel I-2. No hay implementación en preview.

| # | Item | Estado | Trigger Intel |
|---|---|---|---|
| 10 | Watchlist (cablear botón Guardar del Header) | ⏳ | `POST /users/{id}/watchlist` — cuando Intel exponga la persistencia. |
| 11 | Alerts (cablear botón Seguir del Header) | ⏳ | `POST /alerts` con filtros CIF. |
| 12 | Propiedad / control (cadena participaciones, UBO) | ⏳ | Endpoint `arroba-ownership-v1` a definir. |
| 13 | Sinergias con mejor comprador (recomendación explicada) | ⏳ | Enriquecimiento de `recommendation.explanations` en Intel I-2. |
| 14 | Mercado & sector (HHI, fragmentación, comparables) | ⏳ | Nuevo endpoint sectorial. |
| 15 | Rankings sectoriales con evidencia (rellenar la 3.ª fila kgrid pending) | ⏳ | Campos `ranking_market`, `ranking_sector`, `market_position`, `locality_position`, `innovation_score` inexistentes hoy. |

Otras piezas B-2 que aparecen en el plan del usuario:
- Documentos: BORME parseado + documentos subidos por usuario.
- Deal / próxima acción (banner rojo del mockup).

### Fase B-3 · Intel I-3 (veredicto ejecutivo + sucesión + gobierno + registros BORME)

| # | Item | Estado | Trigger Intel |
|---|---|---|---|
| 16 | **Veredicto de ARROBA** con contenido real | ⏳ | Sustituir `<Empty/>` del card Veredicto por narrativa CF cuando Intel populate `financial_quality.assessment`. |
| 17 | **Diagnóstico de ARROBA** (anillos Calidad / Encaje comprador / Oportunidad) | ⏳ | Nuevo card con 3 anillos. Fuente: score signal + financial_quality + buyers. |
| 18 | Sucesión + Gobierno + Sector & roll-up + BORME estructurado | ⏳ | Múltiples endpoints/campos en `arroba-intelligence-v1`. |

### Fase B-4 · Intel I-4 (Copilot + comparación + export + grafo + buscador)

| # | Item | Estado | Trigger Intel |
|---|---|---|---|
| 19 | Copilot conversacional embebido en la ficha (composer inferior `.cop-*` del mockup) | ⏳ | Intel Copilot endpoint. |
| 20 | Comparación empresa vs mediana sector (bars horizontales dinámicos) + Exportar informe (PDF con marcas de agua) | ⏳ | Extensión benchmark + servicio PDF. |
| 21 | Grafo de compradores potenciales (visual `.mtbl` con me-highlight) + Buscador universal (`/api/search` typeahead) | ⏳ | Nuevos endpoints Intel + servicio search. |

**Nota**: los items 10-21 se han enumerado según el mapa mental del plan original. Cuando llegue el ZIP/spec Intel I-2/I-3/I-4, verificar y ajustar la numeración exacta contra el fichero fuente del cliente.

---

## 4. Los 17 fixes apilados (cronológicos)

| # | Fecha | Fix | Ficheros | Backup más reciente relevante | Descripción 1 línea |
|---|---|---|---|---|---|
| 1 | 09-ago 16:22 | Ráfaga 520 (semáforo cap=3) | `backend/src/modules/intelligence_layer/providers/agency_tool/{client,config}.py` + `backend/.env` | (varios .bak backend) | Semáforo global `asyncio.Semaphore(3)` previene bursts 520 Cloudflare desde Intel. |
| 2 | 09-ago 17:17 | Login-spinner guard | `frontend/src/contexts/auth-context.tsx` + `frontend/src/components/RequireAuth.tsx` | ídem | Flags `settled` + `timedOut` evitan spinner infinito en CSR cuando la sesión resuelve rápido. |
| 3 | 09-ago 19:43 | Ficha fiel mockup v2 | `CompanyFichaLayoutV2.tsx` + `fichaMockupCss.ts` | `.bak_20260809_194331_pre_mockup_v2` | Aplicación del ZIP v2 tras fix ESLint `react/no-unescaped-entities`. |
| 4 | 10-ago 09:17 | BETA_hero_faseA · identity null-safe | `backend/src/modules/intelligence_layer/providers/agency_tool/identity.py` | `.bak_pre_hero` | Mapping seguro `description/objeto_social/activity` que devuelve `null` en vez de crash cuando upstream no puebla. |
| 5 | 10-ago 09:34 | BETA_resumen_chart_rings | `CompanyFichaLayoutV2.tsx` | `.bak_20260810_093440_pre_resumen_chart` | `EvolutionChart` SVG-React con `@keyframes afDraw` + `Ring` circular animado + grid KPIs. |
| 6 | 10-ago 10:12 | BETA_vista_anonima v2 | `backend/src/modules/intelligence_layer/endpoints.py` + `page.tsx` + `CompanyFichaF01Client.tsx` + layout | `.bak_pre_v2` | Mixed-access `identity`/`semantic` con `optional_current_user`, sin `RequireAuth` en la página anónima, `<Gate>` CTA. Resolución de `react-hooks/rules-of-hooks` del v1. |
| 7 | 10-ago 10:35 | BETA_finanzas | `CompanyFichaLayoutV2.tsx` | `.bak_20260810_103551_pre_finanzas` | Tarjeta narrativa "Lectura financiera de ARROBA" y Cash Flow tab placeholder. |
| 8 | 10-ago 11:09 | EvolutionChart negativos | `CompanyFichaLayoutV2.tsx` L106-116 + L121-139 + L145-150 | `.bak_pre_negatives` | Dominio auto-escalable `yMinRaw/yMaxRaw` con 12 % padding; línea cero condicional `#8B8B8B` cuando la serie cruza cero; area fill clamped a `y(Math.max(0,yMin))`. |
| 9 | 10-ago 11:25 | Candado Lock icon | `CompanyFichaLayoutV2.tsx` L11-15 + L169 + L207 | `.bak_pre_lock_icon` | Emoji `🔒` sustituido por `<Lock>` de `lucide-react` (`size 22` en Gate, `size 14` inline en EvolutionChart masked). Familia visual coherente con el sidebar. |
| 10 | 10-ago 11:50 | B-0.1 · Lenguaje CF | `CompanyFichaLayoutV2.tsx` | `.bak_pre_b01_lang` | 6 sustituciones textuales (headline + sub-copy + labels sidebar + Gate). |
| 11 | 10-ago 11:54 | B-0.2 · Estados homogéneos | idem | `.bak_pre_b02_states` | `Empty` alias + `SectionError` + `Skeleton` con `@keyframes afkShimmer`. |
| 12 | 10-ago 11:58 | B-0.3 · Glosas `<abbr>` | idem | `.bak_pre_b03_tooltips` | EBITDA×2 + Enterprise Value×1 envueltos + CSS global `abbr[title]{...}` en `<style>` local. Flag L517 (fallback en `??`) documentado sin envolver. |
| 13 | 10-ago 12:23 | B-1.1 · HeroBlock + Veredicto | idem | `.bak_pre_b11_hero_fix` | HeroBlock extraído compartido anon+auth. Card Veredicto de ARROBA con `<Empty/>`. Fallback sintético eliminado. |
| 14 | 10-ago 12:32 | B-1.2 · Header handlers (Compartir real) | idem | `.bak_pre_b12_share_real` | 3 `onClick`: Guardar/Seguir avisos + Compartir con `navigator.clipboard.writeText` real. |
| 15 | 10-ago 12:54 | B-1.3 · Cablear Intel I-1 (Items 4 + 8) | `CompanyFichaLayoutV2.tsx` + `intelligence-types.ts` | `.bak_pre_b13_fallback` | Fallback cascada `HeroBlock.description`; escenarios EV con nombres CF; card Benchmark del sector; `<details>` Metodología. Fallbacks para benchmark/methodology desde `/financial-analysis`. Deuda documentada en `INTEL_PAYLOAD_INCOHERENCIAS.md`. |
| 16 | 10-ago 13:00 | B-1.4 · Ratios ▲▼ (9 tarjetas) | idem | `.bak_pre_b14_ratios` | `RatiosTrendCard` con grid auto-fill. 9 ratios desde `analysis.ratios.*` con `value`, `delta`, `trend`. Tipo `FinancialAnalysisRatioDetail` ampliado. |
| 17 | 10-ago 13:04 | B-1.5 · KPIs 2.ª fila + TrendPill | idem | `.bak_pre_b15_kpis` | Nueva fila `.kgrid` (CAGR, Crecimiento anual, Fondos propios, TrendPill). `fmtEurCompact` con `Intl.NumberFormat`. `TrendPill` con 3 estados de color. |

Todos los backups (`.bak_<TS>_pre_<tag>`) están junto al fichero original y son restaurables individualmente.

---

## 5. Cambios canónicos aplicados

### 5.1 Nomenclatura Corporate Finance (B-0.1)

Prohibidos en UI (aún permitidos como tokens técnicos internos irrelevantes para el usuario final):
- `motor`, `engine`
- `score` como label visible (permitido como campo backend, ej. `financial_quality.score`)
- `proveedor`

Reemplazos aplicados y activos:

| Antes | Después |
|---|---|
| Pendiente de información | Información en preparación |
| Este dato aún no lo proporciona el motor para esta compañía. | Estamos consolidando este apartado. |
| Calculados por Arroba · Calculado por Arroba (variante singular) | Valoración cualitativa de ARROBA |
| Inteligencia Arroba | Lectura financiera de ARROBA |
| pronto (badge sidebar `!n.ready`) | En preparación |
| Señales (label sidebar) | Cambios relevantes |
| Crea una cuenta gratis y desbloquea finanzas, valoración, compradores y señales… | Accede al análisis financiero, la valoración y los compradores |
| 💲 Equity Value…devuelto por el motor. | Equity Value ajustado por deuda financiera neta. Valor de referencia calculado con la metodología de ARROBA. |
| El motor devuelve la explicación, no solo el número | Explicación detrás del número, no sólo la cifra |

### 5.2 Componentes de estado disponibles (B-0.2)

Todos en `CompanyFichaLayoutV2.tsx`, cerca de `function Pending`:

| Componente | Firma | Uso |
|---|---|---|
| `Pending` | `({ label?: string }): JSX` | Fallback semántico general (existía pre-canon). |
| `Empty` | `= Pending` (alias) | Respuesta 200 del backend sin dato para el apartado. |
| `SectionError` | `(): JSX` | Fallo de red o 4xx/5xx al cargar un apartado. |
| `Skeleton` | `(): JSX` | Estado de carga con shimmer `@keyframes afkShimmer` + `.afkSkeleton`. |

### 5.3 Glosas `<abbr>` activas y preparadas

Activas hoy (envueltas):
- **EBITDA** — 2 apariciones inline + 1 en KPI label + 2 en cards KPIs 2.ª fila (B-1.5) + 9 en ratios (B-1.4) según sub-línea EBITDA growth.
- **Enterprise Value** — 1 en `<h3>` de card Valoración.
- **ROA** — 1 en tarjeta ratio (B-1.4).
- **ROE** — 1 en tarjeta ratio (B-1.4).

CSS global vía `<style>` local del layout raíz:
```css
abbr[title]{text-decoration:underline dotted;text-underline-offset:3px;cursor:help}
```

Preparadas para envolver cuando Intel las exponga:
- **EV/EBITDA** — cuando aparezca la ratio como cadena literal.
- **CAGR** — actualmente solo en label "CAGR Ingresos (3a)", pendiente envolver.
- **LTM** — pendiente aparición.
- **Working Capital** — pendiente aparición.
- **EV standalone** — pendiente aparición desligado de EV/EBITDA.

### 5.4 Fallbacks Intel documentados

Deuda técnica formal en `/app/memory/INTEL_PAYLOAD_INCOHERENCIAS.md`. Resumen:

| Campo | Endpoint canónico (null hoy) | Endpoint que sí puebla | Consumidor | Fallback aplicado |
|---|---|---|---|---|
| `identity.description` | `/section/identity` | `/financial-analysis.identity.description` | `HeroBlock` | B-1.3 · cascada en `fallbackDescription` |
| `identity.objeto_social` | idem | `/financial-analysis.identity.objeto_social` | `HeroBlock` | B-1.3 · idem |
| `valuation.benchmark` | `/valuation` | `/financial-analysis.valuation.benchmark` | `Valoracion` | B-1.3.b · `const b = valuation.benchmark ?? (financialAnalysis?.valuation as {...})?.benchmark ?? null` |
| `valuation.methodology` | idem | `/financial-analysis.valuation.methodology` | `Valoracion` | idem |

---

## 6. Backlog explícito

### 6.1 Pendiente Intel populate (campos exactos)

- `/api/companies/{cif}/financial-analysis.cashflow` (top-level, hoy `null`) → habilita Cash Flow tab en `Finanzas`.
- `/api/companies/{cif}/financial-analysis.financial_quality.assessment` (`null`) → narrativa Corporate Finance para card Lectura financiera y card Veredicto de ARROBA.
- `/api/companies/{cif}/financial-analysis.financial_quality.weaknesses` (`[]`) → lista de debilidades bajo el assessment.
- `/api/companies/{cif}/financial-analysis.financial_quality.risks` (`[]`) → lista de riesgos bajo el assessment.
- `/api/companies/{cif}/financial-analysis.assessment.strengths/weaknesses/risks` (`n=1/0/0`) — duplicado de financial_quality, útil o eliminable según decisión Intel.
- `/api/companies/{cif}/section/semantic.value_proposition` (`null`) → subtítulo Hero + fallback de descripción.
- `/api/companies/{cif}/financial-analysis.balance_sheet.st_debt` / `lt_debt` / `financial_debt` (`null`) → desglose deuda para Item 6 Identificación ampliada.
- `/api/companies/{cif}/financial-analysis.valuation.sensitivity` (`null`) → análisis sensibilidad tornado plot.
- `/api/companies/{cif}/financial-analysis.kpis.employees_total` / `ebit_margin` / `gross_margin` (`null`) → completar KPIs 1.ª fila.
- `/api/companies/{cif}/section/signal` — endpoint devuelve **404** hoy; se espera ruta canónica en Intel para señales/cambios relevantes.
- `/api/companies/{cif}/section/financial.rows.variation` y `.benchmark` — hoy `null` celda a celda; enriquecer tabla de P&L, Balance y Ratios con variación YoY y percentil sectorial por fila.

### 6.2 Pendiente Intel armonización (retirar fallbacks)

Referencia detallada en `/app/memory/INTEL_PAYLOAD_INCOHERENCIAS.md`. Cuando Intel armonice, aplicar las 3-4 líneas de retirada por caso (grep → sustituir → typecheck).

- Exponer `identity.description` y `identity.objeto_social` en `/section/identity` (hoy solo en `/financial-analysis.identity.*`).
- Exponer `valuation.benchmark` y `valuation.methodology` en `/valuation` (hoy solo en `/financial-analysis.valuation.*`).

### 6.3 Pendiente Intel spec/ZIP

- **Intel I-2** → arranca B-2 (watchlist, alerts, propiedad, mercado, rankings, documentos, deal banner).
- **Intel I-3** → arranca B-3 (veredicto narrativo, sucesión, gobierno, sector & roll-up, BORME estructurado).
- **Intel I-4** → arranca B-4 (Copilot, comparación, export PDF, grafo, buscador universal).

### 6.4 Pendiente ARROBA (no depende de Intel)

- **HARDENING-002**: 31 pytest fixtures asumen `ENRICH_COMPANY_SOURCE=mock` pero el `.env` está en `real` → deben mockear la variable explícitamente. Fichero probable: `backend/tests/`.
- **Sprint F0.4 Propiedad**: requiere ZIP mockup del cliente. Pendiente autorización.
- **Endpoint agregado `/api/companies/{cif}/dossier`**: fix "bonito" a la ráfaga 520 — serializar toda la ficha server-side en una llamada única para el cliente.
- **Determinismo ranking `recommendation-intelligence/opportunities`**: observado orden inconsistente (CUNI vs GLG) entre requests consecutivos. Investigar.
- **Análisis "ARROBA Matching v1.0"** (3 documentos que el usuario mencionó al inicio de un ciclo previo pero no envió).

### 6.5 Pendiente validación

- **CIFs Casos B/C/D/E** para validación visual de EvolutionChart negativos:
  - **Caso A** ✅ validado: `B28184687` LABORATORIOS SERVIER (todo positivo).
  - **Caso B mixto**: el usuario referenció una "empresa de limpieza" con Ingresos ≈ 1,1 M€ / Beneficio neto ≈ −484 k€ pero no compartió CIF.
  - **Casos C/D/E**: sin CIFs identificados.
- **Deploy a `beta.arroba.com`**: los 17 fixes están listos en preview, esperando autorización explícita del usuario. No desplegar sin ese OK.

---

## 7. Instrucciones para retomar

### 7.1 Cuando Intel populate `cashflow` (Item 5 completo)

```bash
curl -sS -c /tmp/sess.jar -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test.arroba+neo@arroba.com","password":"<PW-de-/app/memory/test_credentials.md>"}'
curl -sS -b /tmp/sess.jar "http://localhost:8001/api/companies/B28184687/financial-analysis" \
  | python3 -c "import json, sys; d=json.load(sys.stdin); print('cashflow:', d.get('cashflow'))"
```

Si `cashflow` es no-null → cablear en `CompanyFichaLayoutV2.tsx` dentro del tab `cashflow` del segmented `Finanzas`, sustituir `<Empty/>` actual por la tabla de flujos (operating, investing, financing) reutilizando las clases `.ftable` que ya existen en `fichaMockupCss.ts`.

### 7.2 Cuando Intel populate `financial_quality.assessment/weaknesses/risks`

- Actualizar el card "**Lectura financiera de ARROBA**" (en `Finanzas`) para mostrar el assessment como narrativa + weaknesses/risks como listas cuando poblados.
- Actualizar el card "**Veredicto de ARROBA**" (dentro de `HeroBlock`, L253+) para sustituir `<Empty/>` por render del assessment cuando poblado.
- Consumidor: `financialAnalysis?.financial_quality?.assessment` (string) y `.weaknesses` / `.risks` (arrays).

### 7.3 Cuando llegue Intel I-2 ZIP/spec

Arrancar B-2 completa siguiendo el mismo patrón que en esta sesión:

1. **Fase 0** — Reconocimiento (solo lectura, greps + curl payload) → STOP y reportar mapa.
2. **Luz verde** del usuario con decisiones concretas.
3. **Fase 1** — Aplicación:
   - Backup `.bak_$(date +%Y%m%d_%H%M%S)_pre_b2X_<tag>`.
   - `search_replace` para modificar tipos + layout.
   - `yarn typecheck && yarn build`. STOP si falla.
   - `sudo supervisorctl restart frontend && sleep 6`.
   - Smoke `/es/inicio` `/es/login` `/es/empresa-f01/B28184687` → 200/200/200.
   - Chunk check: `find /app/frontend/.next/static/chunks -name "*.js" | xargs grep -l "<TOKEN>"`.
4. **Reporte final** con backup, diff resumido, BUILD_ID, smoke, chunk check.

### 7.4 Cuando Intel armonice payloads

Retirar fallbacks del frontend en orden seguro:

1. **HeroBlock** (`CompanyFichaLayoutV2.tsx` L253+): eliminar el 3.er y 4.º operando del `fallbackDescription` cascade. Dejar solo `identity.description || identity.objeto_social || null`.
2. **Valoracion**: eliminar `const b = ...` y `const methodology = ...`. Volver a usar `valuation.benchmark` y `valuation.methodology` directamente en los renders.
3. **Import**: eliminar `ValuationBenchmark` del destructuring si ya no se usa (el cast `as {...}` era el único consumer directo).
4. Actualizar `/app/memory/INTEL_PAYLOAD_INCOHERENCIAS.md` marcando los 2 casos como **RESUELTOS** con fecha.
5. `yarn typecheck && yarn build` verde antes de restart.

---

## 8. Convenciones para el agente que continúe

### 8.1 Protocolo de fix

- Cada fix debe ir con **backup previo**: `cp CompanyFichaLayoutV2.tsx CompanyFichaLayoutV2.tsx.bak_$(date +%Y%m%d_%H%M%S)_pre_<tag>`. Los backups son individualmente restaurables.
- `yarn typecheck && yarn build` **verde** ANTES de restart del supervisor.
- Restart supervisor (`sudo supervisorctl restart frontend`) y smoke `/es/inicio` `/es/login` `/es/empresa-f01/B28184687` → 200/200/200 tras cada fix.
- **Chunk verification** con `find /app/frontend/.next/static/chunks -name "*.js" | xargs grep -l "<TOKEN>"` para confirmar que el bundle minificado incluye el cambio. Ojo con:
  - Terser dedupe: literales idénticos se colapsan a 1 aparición en el chunk aunque el JSX los use N veces (esperado).
  - Locale unicode: para strings con acento (`ó`, `ñ`) usar `LC_ALL=C grep -aoc`.

### 8.2 Reglas de lint Next.js prod (aprendidas a las malas)

- `react-hooks/rules-of-hooks`: los hooks (`useState`, `useMemo`, `useEffect`, `useSWR`) **antes** de cualquier `return` condicional. Nunca dentro de un ternario ni tras un `if (!x) return null`.
- `react/no-unescaped-entities`: comillas rectas en JSX children → escapar con `{'"..."'}` o usar comillas latinas «…». En `title=` attributes NO aplica.
- `@typescript-eslint/no-misused-promises`: `onClick` recibe `() => void`, no `Promise<void>`. Patrón defensivo: `onClick={() => { void (async () => {...})(); }}`.
- `@next/next/no-img-element`: preferir `next/image` sobre `<img>`. Actualmente hay 1 warning pre-existente en L39 (no relacionado con esta sesión, ignorable).

### 8.3 Nomenclatura CF obligatoria (canon B-0.1)

- **Prohibido** en UI (labels visibles al usuario): `motor`, `engine`, `score` (como label), `proveedor`.
- **Permitido** en código/tipos/documentación técnica interna (JSDoc, nombres de variable): OK.
- Cualquier copy nueva debe pasar el filtro: si el usuario final lo lee, aplicar la sustitución de la tabla de la sección 5.1.

### 8.4 Zero coupling y degradación

- Si Intel devuelve `null` en un campo cableado → `<Empty/>` con la copy CF. **Nunca inventar prosa constructiva.**
- Fallbacks a otros endpoints Intel permitidos si el contrato canónico aún no expone el campo → documentar el caso en `/app/memory/INTEL_PAYLOAD_INCOHERENCIAS.md` con los endpoints exactos y el consumidor afectado.
- Cuando Intel armonice, los fallbacks se retiran (ver 7.4).

### 8.5 Comunicación con el usuario

- **Idioma obligatorio**: español (el usuario ha explicitado esta preferencia en múltiples ciclos).
- **Tono**: técnico Corporate Finance. Sin emojis salvo checkmarks (✅ 🔄 ⏳ ❌) y ocasionales indicadores de estado.
- **Protocolo por fase**:
  1. **Fase 0 · reconocimiento** — solo lectura (greps, curls, view_file), STOP y reportar mapa.
  2. **Luz verde del usuario** — con decisiones D1/D2/D3/... concretas.
  3. **Fase 1 · aplicación** — backup + search_replace + typecheck+build+restart+smoke+chunk.
  4. **Reporte final** — con BUILD_ID, backup, diff resumido, verificación.
- El usuario prefiere **sub-fases pequeñas con STOP entre cada una** sobre entregas grandes.
- Nunca invocar `e1_tester`. Nunca desplegar a `beta.arroba.com` sin autorización explícita en el turno.

### 8.6 Ficheros y áreas prohibidas para tocar sin permiso explícito

- `frontend/src/components/company/layout/fichaMockupCss.ts` — CSS canónico verbatim del mockup. Solo se leen sus clases; los estilos nuevos van en `<style>` local del componente.
- `backend/src/modules/intelligence_layer/providers/agency_tool/_map/*` — mapping normalizadores. Cambio requiere autorización.
- `backend/src/modules/intelligence_layer/providers/agency_tool/{client,config}.py` — semáforo y rate limits. Cambio requiere autorización.
- `backend/src/modules/intelligence_layer/providers/agency_tool/identity.py` — mapper de identidad. Cambio requiere autorización.
- `backend/.env` (`MONGO_URL`, `AGENCY_TOOL_MODE`, `AGENCY_TOOL_BASE_URL`, `ARROBA_SERVICE_API_KEY_PRIMARY`, `AGENCY_TOOL_GLOBAL_MAX_CONCURRENT`) — variables protegidas.

---

*Handoff generado 2026-08-10 al cierre de B-1.5. Autor: sesión ARROBA BETA · Ficha de empresa. Documentos hermanos: `/app/memory/PLAN_BETA_status_20260810.md`, `/app/memory/INTEL_PAYLOAD_INCOHERENCIAS.md`, `/app/memory/test_credentials.md`.*
