# B-2 · Turno D · Batería de verificación multi-CIF

**Fecha**: 2026-08-10
**Modo**: DIAGNÓSTICO puro (NO retirar fallbacks, NO cablear Señales, NO integrar `/coverage/check` en UI, NO modificar código de app).
**Muestra**: 6 CIFs provistos por PM · queries directas a Intel + carga UI logueada sobre el agregador ya cableado (B-2.4 · `arroba-ficha-v1`).
**Scripts ephemeral generados**: `/app/backend/scripts/turno_d_multicif.py` (queries backend).

---

## 1 · Fase 0 · endpoint `/coverage/check`

**Veredicto: el endpoint NO existe en la API Intel.**

- Patrones probados (todos HTTP 404):
  - `GET /api/v1/coverage/check?cif=X`
  - `POST /api/v1/coverage/check` body `{cif}`
  - `GET /api/v1/company/{cif}/coverage/check`
  - `POST /api/v1/company/{cif}/coverage/check`
  - `GET /api/v1/company/{cif}/coverage`
  - Variantes `/api/v1/data-coverage/check`, `/api/v1/data-quality/check`, `/api/v1/intelligence-coverage/check`, `/api/v1/company/{cif}/availability`.
- Patrón que devuelve HTTP 200: `GET /coverage/check` — **NO es un endpoint API**: devuelve el SPA HTML del Agency Tools Hub de BUD Advisors (Intel front-end interno). Content-type `text/html`.
- **Fallback funcional adoptado**: `GET /api/v1/company/{cif}/ficha` (agregador ya cableado en B-2.4). El shape del `finances.has_financials`, `identity` no vacío, `ownership.available`, `governance.available`, `events.available` sirve como proxy de cobertura por sección. Latencia p50 observada del agregador ≈ **3.4 s** (rango 3.09 s – 4.33 s en los 6 CIFs).

**Sub-pregunta a Intel/PM**: ¿existe algún endpoint público (o previsto en Intel I-2) que exponga cobertura por CIF sin necesidad de traer el payload completo? Semántica esperada: `{ available, sections: {...}, warnings: [] }`.

---

## 2 · Matriz maestra

| # | CIF | Empresa | `/coverage` | `/ficha` HTTP | Lat (ms) | identity | finances | ranking | CF rows | `current_ratio` | ownership | governance | events | anomalías |
|---|-----|---------|-------------|---------------|----------|----------|----------|---------|---------|------|-----------|------------|--------|-----------|
| 1 | B28031458 | NCR ESPAÑA | N/D (404) | 200 | 4 327 | Y (desc=—) | Y | Y (sec_pct=100, mkt=#1/5, loc=#1/147) | **0** | `None` (available=False) | avail=False, 0 socios | avail=True, 64 officers | avail=False | CF null; current_ratio null; is_listed null |
| 2 | B50949346 | OPEL EUROPE HOLDINGS | N/D (404) | 200 | 3 390 | Y (desc=—) | Y | Y (sec_pct=98, mkt=#3/13, **loc=None**) | **0** | `None` (available=False) | avail=True, 1 socio | avail=True, 43 officers | avail=False | **`locality_position` null** (degrade UI OK); `current_ratio` esperado 435 → **null**; CF null |
| 3 | A81921611 | PROCOLUIDE INDUSTRIAL | N/D (404) | 200 | 3 484 | Y (desc=—) | Y | Y (sec_pct=98, mkt=#2/6, loc=#3/34) | **0** | `None` (available=False) | avail=False, 0 socios | avail=True, 9 officers | avail=False | CF null; `st_debt/lt_debt/financial_debt` **en shape `balance_sheet` pero valor=None**; `current_ratio` null |
| 4 | B82229907 | FARNELL COMPONENTS | N/D (404) | 200 | 3 087 | Y (desc=—) | Y | Y (sec_pct=99, mkt=#1/5, loc=#1/37) | **0** | `None` (available=False) | avail=True, 1 socio | avail=True, 14 officers | avail=False | CF null; `current_ratio` esperado 3,85 → **null** |
| 5 | V83153700 | AGRUPACIÓN IUSTIME | N/D (404) | 200 | 3 173 | Y (**desc=597 chars**) | Y | Y (sec_pct=79, mkt=#60/201, loc=#3/21) | **0** | `None` (available=False) | avail=False, 0 socios | avail=True, 91 officers | avail=False | Buyers esperado count=2 → **count=0** (contradice expectativa PM); CF null (micro · abreviadas OK) |
| 6 | A28354132 | INNOVATIVE SOLUTIONS ECOSYSTEM | N/D (404) | 200 | 3 244 | Y (desc=—) | Y | Y (sec_pct=32, mkt=#75/124, loc=#49/66) | **0** | `None` (available=False) | avail=True, 2 socios | avail=True, 11 officers | avail=False | **`is_listed=None` aunque es cotizada** (bandera roja); CF null; `listed_market=None` |

### 2.1 · Bandera roja transversal

- **`statements.cash_flow` viene `None` en 5/6 CIFs**. Solo Servier (`B28184687`, no en esta muestra) lo tenía poblado. Contradice la etiqueta "Cash flow ✅" en la muestra PM. La UI degrada a `<Empty label="Estado de flujos de efectivo" />` correctamente (verificado en los 6 con Playwright: contador de "Información en preparación" = 1 en pestaña Cash Flow).
- **`ratios.current_ratio.value` viene `None` en 6/6 CIFs**, con `available: false`. Los valores extremos esperados (OPEL 435, FARNELL 3,85) **no se materializan en el payload** — bandera roja hacia Intel. El resto de ratios (`debt_ratio`, `capital_intensity`, `revenue_per_employee`, `working_capital`) sí tienen valor real en varios CIFs.
- **`identity.is_listed` viene `None` para TODOS incluyendo la cotizada A28354132** — bandera roja: el campo existe en el shape pero Intel no lo popula.
- **Latencias `/buyers` ≈ 10 s por CIF** (rango 9.3 s – 11.6 s). Anómalamente lento para un endpoint que en 5/6 CIFs devuelve `count=0`.

---

## 3 · Sección por CIF

### 3.1 · B28031458 · NCR ESPAÑA

- **Payload snippet**:
  ```
  identity.legal_name = "NCR ESPAÑA"
  identity.description = "" (vacío)
  identity.is_listed = None
  finances.has_financials = True
  finances.ranking = { sector_revenue_percentile: 100, market_position: {rank:1, total:5, scope:"sector CNAE + banda de tamaño (0,3x–3x ingresos)"}, locality_position: {rank:1, total:147, scope:"municipio"} }
  finances.statements.cash_flow = None
  finances.ratios.current_ratio.available = False
  governance.officers = [64 personas · redactado]
  ```
- **UI logueada** (screenshot): hero ✅ "NCR ESPAÑA · CIF B28031458 · Wholesale trade of information and communication technology equipment · MADRID"; Rankings 2ª fila kgrid ✅ (3 KPI cards con dato); pestaña Cash Flow → `<Empty/>` limpio ("Información en preparación"); pestaña Ratios pinta 7 ratios (Margen EBITDA, Margen EBIT, Margen neto, ROA, ROE, Solvencia, Ratio endeudamiento) con `-0%` / `0%` cuando `available=False` — **micro-hallazgo UI**: `fmtCell(0, 'percent')` en Rentabilidad muestra `0%` en vez de `<Empty/>` para valores `null` (posible sub-bug en `Ratios` card component, no relacionado con B-2.4).

### 3.2 · B50949346 · OPEL EUROPE HOLDINGS

- **Payload snippet**: `finances.ranking.locality_position = None` (única sección de ranking anulada de todos los CIFs). Signals: 3 señales (net_loss detectado, `net_income = -31 324 000 €`, severity `risk`).
- **UI logueada**: hero ✅; Rankings kgrid pinta `Posición sectorial #3 de 9` + `Percentil facturación 98º` + **`Posición local · —` (Empty)** — degrade R15 correcto. Ratios muestran `Productividad = 3.704.571,43×` (dato extremo con separador `es-ES` sin overflow) y `Intensidad de capital = 21,55×`.

### 3.3 · A81921611 · PROCOLUIDE INDUSTRIAL

- **Payload snippet** (Item 6 · deuda desglosada):
  ```
  finances.statements.balance_sheet.keys = ["cash", "current_assets", "current_liabilities", "equity",
    "financial_debt", "lt_debt", "non_current_assets", "non_current_liabilities", "st_debt",
    "total_assets", "total_liabilities"]
  balance_sheet.st_debt = None
  balance_sheet.lt_debt = None
  balance_sheet.financial_debt = None
  balance_sheet.equity = 3 181 515,64 €
  balance_sheet.total_assets = 10 690 416,64 €
  finances.kpis con 'debt' = ["debt_to_equity"]
  ```
- **Hallazgo Item 6**: el shape **sí incluye** `st_debt / lt_debt / financial_debt` dentro de `finances.statements.balance_sheet` (no en `ratios`). Para PROCOLUIDE están `None`; falta muestra de un CIF donde Intel los popule para confirmar shape con datos. **Item 6 desbloqueable en frontend**: se puede cablear el bloque "Identificación ampliada · deuda desglosada" leyendo de `financialAnalysis.balance_sheet.{st_debt, lt_debt, financial_debt}` con degradación `<Empty/>` cuando `null`.
- **UI logueada**: ratios OK con Solvencia 29,8 %, ROE 7,9 %.

### 3.4 · B82229907 · FARNELL COMPONENTS

- **Payload snippet**: `finances.ranking = {sector_pct:99, mkt:#1/5, loc:#1/37}`. `current_ratio.available=False`.
- **UI logueada**: KPIs Rankings ✅ 3/3. Cash Flow → `<Empty/>` limpio.

### 3.5 · V83153700 · AGRUPACIÓN IUSTIME

- **Payload snippet**:
  ```
  identity.description = "Prestamos servicios de asesoramiento y gestión a empresas, PYMES,
    autónomos, profesionales..." (597 chars · ÚNICO CIF con description poblada)
  ranking.market_position = {rank:60, total:201}
  ranking.locality_position = {rank:3, total:21}
  buyers.count = 0 (contradice expectativa PM count=2)
  ```
- **UI logueada**: hero ✅ "AGRUPACION IUSTIME · CIF V83153700 · Activities of professional organizations · MADRID". Rankings 3/3 con dato real. **Cash Flow → `<Empty/>` limpio** (no rompe pestaña, cumple expectativa PM sobre micro/abreviadas).

### 3.6 · A28354132 · INNOVATIVE SOLUTIONS ECOSYSTEM (test tipológica "cotizada")

- **Payload snippet**:
  ```
  identity.legal_name = "INNOVATIVE SOLUTIONS ECOSYSTEM"
  identity.is_listed = None  ← ROJO: esperaba True
  identity.listed_market = None
  identity.mercantile_status = None
  finances.ranking = {sector_pct:32, mkt:#75/124, loc:#49/66}
  buyers.count = 5 (única muestra con recommendations válidas)
  ```
- **UI logueada**: hero ✅ "INNOVATIVE SOLUTIONS ECOSYSTEM · CIF A28354132 · Activities of holding companies · MADRID". Resumen: Facturación 93 k€, EBITDA -7 k€, Empleados 1. `Posición sectorial #75 de 124` visible. **NO se pinta indicador `Cotizada en X` porque `is_listed=None`** — R15 respetado.

---

## 4 · Hallazgos para retirada de fallbacks (Turno A)

### 4.1 · `identity.description` (fallback `/section/identity` → `financialAnalysis.identity.description`)

- **Ratio de cobertura**: 1/6 CIFs (solo IUSTIME) tiene `description` poblada en el agregador (597 chars).
- **Recomendación**: **MANTENER fallback**. Con 1/6 (17 %) de cobertura, retirar es prematuro. Sugiero re-medir cuando Intel populen `description` en ≥5/6 CIFs (Intel I-1 pendiente).

### 4.2 · `valuation.benchmark` y `valuation.methodology` (fallback `/valuation` → `financialAnalysis.valuation.*`)

- **Ratio de cobertura via agregador `finances.valuation`**: **6/6 CIFs** ambos campos poblados.
- **Ratio de cobertura via legacy `/valuation`**: no medido en este turno (bandera para Turno A: re-verificar 6/6 antes de retirar).
- **Recomendación**: **RETIRAR con guarda de degradación** en Turno A. Consumir directamente `ficha.finances.valuation.{benchmark, methodology}` y eliminar el hook SWR `useSWR<ValuationAnalysis>` para reducir waterfall 7→6. Guarda mínima: si `benchmark=null` → `<Empty/>` en la card correspondiente.

---

## 5 · Hallazgos para cableado de Señales (Turno B)

### 5.1 · Shape de `/signal-intelligence/analyze`

- **Ratio de cobertura**: 6/6 CIFs devuelven `signals[]` poblado (tamaños 2.6–7.1 KB).
- **Shape rico observado** (ejemplo OPEL):
  ```
  signals[].{
    signal_id, master_id, signal_type ("financial.net_loss"),
    category ("financial"), severity ("risk"|"opportunity"|"info"),
    polarity ("negative"|"positive"),
    dimensions: {impact, confidence, urgency, persistence},
    confidence, detected_at,
    is_composite,
    source: {engine, fields[], source_version},
    evidence: {metric, value, window},
    rule: {id, expression, threshold, threshold_source, baseline, thresholds_version, passed},
    recommended_actions[],
    explanation ("Resultado neto negativo en el último ejercicio."),
    engine_version, taxonomy_version
  }
  ```
- **Recomendación**: **CABLEAR con `<Empty/>` fallback** en Turno B.
  - Consumir `signals[]` desde el hook SWR existente `signalAnalyze(cif)` (ya está en `intelligenceClient`, no requiere refactor backend).
  - Renderizar cada `signal` como card con: `severity` (badge color), `signal_type` (etiqueta español CF via diccionario), `explanation` (bullet literal · R15), `evidence.metric + evidence.value` (contexto), `dimensions.confidence` (barra o percentil).
  - Si `signals[]` vacío → `<Empty label="Señales de oportunidad y riesgo" />`.
  - **Latencia observada**: 3.3–4.7 s por CIF. Aceptable para carga async no bloqueante.

---

## 6 · `/control-synergy` con IUSTIME

- **NO probado**: IUSTIME devolvió `buyers.count = 0` (contradice la expectativa PM de count=2). Sin `top_buyer`, el POST a `/recommendation-intelligence/control-synergy` no se puede parametrizar con datos reales.
- **Estado**: bloqueado → **no se puede desbloquear en este turno**. Traslado al backlog para re-probar cuando Intel populen `buyers` en IUSTIME (o para probar con `B82229907` FARNELL cuyo buyers.count=1 o con `A28354132` cuyo buyers.count=5).
- **Sub-pregunta a Intel/PM**: ¿por qué IUSTIME devuelve `buyers.count=0` cuando PM afirmaba count=2? ¿Motor `recommendation-intelligence` desactualizado?

---

## 7 · Banderas rojas y regresiones

### 7.1 · Regresiones B-2.1 / B-2.4 / B-2.5 (recién cerrados)

- **B-2.1 Rankings**: 6/6 CIFs pintan las 3 KPI cards + explain-card. OPEL degrada `Posición local` a `<Empty/>` porque payload trae `locality_position=None` — comportamiento R15 correcto.
- **B-2.4 Agregador**: 6/6 CIFs `/api/companies/{cif}/ficha` devuelve HTTP 200 con `finances`, `identity`, `ownership`, `governance`, `events`, `ranking` presentes.
- **B-2.5 Cash Flow**: 5/6 CIFs degradan a `<Empty/>` limpio (Servier no está en la muestra; era el único con cash_flow poblado). Bridging `cash_conversion` no se ejercita porque no hay filas de cash_flow.
- **Mixed-access**: no re-probado en este turno (validado en turno anterior sobre Servier, sin cambios).

### 7.2 · Banderas rojas nuevas

1. **`cash_flow` masivamente ausente**: 5/6 CIFs (83 %) devuelven `statements.cash_flow=None`. Contradice etiqueta "Cash flow ✅" en la muestra PM. Sub-pregunta abierta: ¿Servier es un outlier, o falta poblar cash_flow para el resto del catálogo?
2. **`ratios.current_ratio.available=false` en 6/6**. Contradice valores esperados 435 (OPEL) y 3,85 (FARNELL).
3. **`identity.is_listed=None` en cotizada A28354132**. Falla la prueba tipológica "cotizada".
4. **`buyers.count=0` en IUSTIME**. Contradice expectativa PM count=2.
5. **Micro-hallazgo UI (fuera de scope B-2.4, no regresión de este turno)**: en pestaña Ratios, ratios de rentabilidad con `available: false` se pintan como `-0%` / `0%` en vez de `<Empty/>`. Ejemplo: NCR muestra `Margen EBITDA -0%`, `Margen neto 0%`. Rompe convención R15. Registrar como sub-item para B-1.4 Ratios (fuera de este turno).
6. **Latencia `/buyers` ≈10 s**. Anómalamente lento; incompatible con SWR síncrono en el hero de la ficha (bloquea el semáforo `max_concurrent=3` durante 10 s).

---

## 8 · Sub-preguntas para Intel/PM

1. **Cobertura `cash_flow`**: ¿Servier es el único CIF con `statements.cash_flow` poblado, o se está poblando el catálogo progresivamente? Timeline estimado.
2. **`current_ratio.available=false`**: ¿por qué está marcado no disponible cuando en el audit se documentó valor 435 para OPEL y 3,85 para FARNELL? ¿Se calcula bajo demanda con otro trigger?
3. **`identity.is_listed`**: A28354132 se etiquetó "cotizada" en la muestra; Intel devuelve `is_listed=None`. ¿Falta ingesta de listing status, o el CIF no está realmente cotizado?
4. **`buyers.count` IUSTIME**: PM afirmaba count=2; motor devuelve 0. ¿Motor `recommendation-intelligence` re-indexó y se perdieron matches?
5. **`/coverage/check`**: ¿existe API real (no el SPA en `/coverage/check`)? Semántica esperada `{available, sections: {identity, finances, ownership, ...}, warnings[]}`. Utilidad: evitar carga de agregador cuando cobertura es 0 (guarda anticipada).
6. **Deuda desglosada** (`balance_sheet.{st_debt, lt_debt, financial_debt}`): shape confirmado, valores `None` para PROCOLUIDE. ¿Qué CIF de la muestra Intel tendría estos poblados para validar cableado UI de Item 6?
7. **Latencia `/buyers`**: 10 s por CIF es prohibitivo. ¿Se puede optimizar upstream o requiere pattern async (webhook, jobs)?

---

## 9 · Recomendación consolidada por Turno

| Turno | Acción | Cobertura observada | Recomendación |
|---|---|---|---|
| **Turno A** · retirar fallback `description` | Retirar `financialAnalysis.identity.description` como fallback | 1/6 (17 %) | **MANTENER** fallback |
| **Turno A** · retirar fallback `valuation.benchmark/methodology` | Consumir desde `ficha.finances.valuation.*` y retirar hook SWR `/valuation` | 6/6 (100 %) via agregador | **RETIRAR con guarda `<Empty/>`** · reducción waterfall 7→6 |
| **Turno B** · cablear Señales UI | Consumir `signals[]` con card por `signal_type` + `explanation` literal | 6/6 (100 %) | **CABLEAR con `<Empty/>` fallback** |
| **Turno B-2.5 sinergias** · `/control-synergy` | Cablear sobre CIF con buyers.count > 0 | 0 muestras hoy (IUSTIME fallo) | **MANTENER bloqueado** hasta Intel I-1 |
| **Item 6** · deuda desglosada | Cablear balance_sheet.{st_debt, lt_debt, financial_debt} | Shape ✅ 6/6, dato ≤1/6 | **CABLEAR con `<Empty/>` predominante** hasta que Intel populen valores |

---

## 10 · Referencias

- `PARA_BETA_B2_FASE0_AUDIT.md` — audit original.
- `PARA_INTEL_CIFs_muestra.md` — expandir con la nueva muestra de 6 CIFs de este turno.
- `INTEL_PAYLOAD_INCOHERENCIAS.md` — casos 1, 2, 3.
- `PARA_BETA_B24_FICHA_SHAPE.md` — shape agregador `/company/{cif}/ficha`.
- `PLAN_BETA_status_20260810.md` — status general.
- `/app/backend/scripts/turno_d_multicif.py` — script ephemeral (borrable tras revisión).
