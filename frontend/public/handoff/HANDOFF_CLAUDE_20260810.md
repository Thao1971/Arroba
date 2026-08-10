# HANDOFF · Contexto consolidado para agente sucesor (Claude)

## 0. Metadata

- **Fecha de generación**: 2026-08-10 (Europe/Madrid).
- **Autor (agente)**: E1 · Emergent Labs (sesión post-Turno D).
- **Versión del documento**: 1.0.
- **Documentos consolidados y supersedidos**:
  - Supersede `PLAN_BETA_ficha_HANDOFF.md` (handoff previo, sesión anterior).
  - Consolida `PLAN_BETA_status_20260810.md`, `INTEL_PAYLOAD_INCOHERENCIAS.md`, `PARA_BETA_B24_FICHA_SHAPE.md`, `PARA_BETA_TURNO_D_MULTICIF.md`, `PARA_BETA_B2_FASE0_AUDIT.md`, `PARA_INTEL_CIFs_muestra.md`. Estos siguen vigentes como fuente de detalle.
- **Rama Git activa**: `170426` (branch id emitido por el runtime del pod; ramas humanas no expuestas en el entorno preview · pendiente de confirmación sobre nombre convencional en repositorio origen).
- **Entorno**:
  - Preview URL: `https://musing-hellman-9.preview.emergentagent.com` (fresh, sincronizado con esta sesión).
  - Producción: `beta.arroba.com` (desactualizada respecto al preview desde la sesión anterior + esta).

---

## 1. Resumen ejecutivo

- **Fase B-0** completa: nomenclatura Corporate Finance, estados homogéneos (`Empty`, `Pending`, `SectionError`, `Skeleton`), glosas financieras (`<abbr>` tooltips).
- **Fase B-1** al 83 % (5/6): Hero + Veredicto placeholder, Header handlers, Valoración v2, 9 Ratios ▲▼, KPIs 2.ª fila. Pendiente Item 6 (Identificación ampliada) por falta de datos Intel.
- **B-2.1 · Rankings + 2.ª fila KPIs** DONE con `HARDENING-003` (passthrough `ranking` en `FinancialAnalysis`).
- **B-2.5 · Estado de flujos de efectivo** DONE con `HARDENING-005` (passthrough `cash_flow`) + bridging Cash Conversion.
- **B-2.4 · Refactor agregador `/company/{cif}/ficha`** DONE con `HARDENING-006` (contrato `arroba-ficha-v1` en backend + adapter en frontend). Waterfall SWR frontend **8 → 7**.
- **Turno D · Batería diagnóstica multi-CIF** (6 CIFs) DONE. Hallazgos operativos, ninguna regresión.
- **Bundle post-D** DONE con `HARDENING-007` (passthrough enriquecido de `SignalItem`): (1) retirada del fallback `valuation.benchmark/methodology` (waterfall **7 → 6**); (2) sección Señales enriquecida (`explanation`, `evidence`, `dimensions`, `rule`); (3) fix R15 en Ratios (bridging × 100 a rentabilidad, mismo patrón que Cash Conversion).
- **Verificación testing_agent** del bundle post-D: 100 % PASS (13/13 subchecks; iteration_35.json).
- **Estado global del proyecto**: capa B-2 (Fase 0 auditoría + Rankings + Cash Flow + Refactor agregador + Turno D + Bundle post-D) cerrada; Ownership / Governance / Events / Item 6 esperan cableado UI o datos Intel.
- **Riesgo principal vivo**: dependencia de Intel para poblar `cash_flow`, `current_ratio`, `is_listed`, `identity.description` y desglose de deuda en 5/6 CIFs no-Servier; sin más datos, la UI degrada correctamente a `<Empty/>` pero el valor percibido para catálogo general es limitado.

---

## 2. Reglas vigentes que Claude debe respetar

- **R4 / R10 · Null → `<Empty/>`, nunca inventar**. Si un subcampo no llega, se degrada; nunca se rellena con placeholder textual ni con "N/A".
- **R11 · Frontend UI freeze salvo cambios acotados y verificados**. Toda intervención UI requiere aprobación explícita del usuario y testing agent tras implementar.
- **R13 · Source of truth única**: `CompanyFichaLayoutV2.tsx` es el layout activo de la Ficha F01. Ficheros `.bak_*` son legacy no consumido; no reutilizar.
- **R15 · Datos reales o `<Empty/>`**. Cero prosa sintética. Cero cálculo derivado en frontend. Cualquier transformación de escala (bridging) debe ser acotada, documentada en `INTEL_PAYLOAD_INCOHERENCIAS.md` y retirable cuando Intel armonice el contrato.
- **Zero Coupling**: el backend Arroba absorbe cualquier diferencia del proveedor Intel. Los contratos internos son `arroba-*-v1` (financial, valuation, identity, semantic, signal, recommendation, ficha). El frontend nunca consume payloads raw de Intel.
- **Mixed-access** implementado en `/api/companies/{cif}/ficha`: anónimo recibe `finances=None` y sigue viendo `identity`, `ownership`, `governance`, `events`, `ranking`. Autenticado recibe payload completo. Igual criterio para los endpoints por sección.
- **Política DPD** (Datos Personales Directos): pendiente aplicar al cablear B-2.2 Ownership y B-2.3 Governance. Regla acordada: anónimo = agregado por rol/entidad sin nombres físicos; autenticado = detalle completo. **La anonimización se hace en el backend (mapper), nunca en el frontend**.
- **STOP disciplinado por ítem**. No encadenar sin revisión del usuario. Cada finalización requiere reporte + evidencia.
- **Sin deploy a producción sin autorización explícita del usuario**. Preview siempre; producción solo cuando el usuario lo ordena.

---

## 3. Items completados en esta sesión (cronológico)

### 3.1 · Fase 0 · Auditoría B-2 de endpoints Intel
- **Objetivo**: mapear la disponibilidad de datos del proveedor Intel para las secciones aún no cableadas (rankings, cash_flow, ownership, governance, events, agregador `/ficha`, control-synergy, coverage).
- **Cambios**: solo documentación. Doc creado: `PARA_BETA_B2_FASE0_AUDIT.md`.
- **Verificación**: curl S2S contra Intel; muestra Servier `B28184687`.
- **CIF**: `B28184687`.
- **HARDENING**: N/A.

### 3.2 · B-2.1 · Rankings + 2.ª fila KPIs
- **Objetivo**: pintar 3 KPI cards (Posición sectorial, Posición local, Percentil de facturación) y card "Lectura de posicionamiento" con los bullets literales de `ranking.explain`.
- **Cambios**:
  - Backend: `interfaces/financial.py` (+1 línea `ranking: dict | None`), `providers/agency_tool/financial.py::_map_analyze` (+1 línea passthrough).
  - Frontend: tipos `FinancialAnalysisRanking` en `intelligence-types.ts`; render en `CompanyFichaLayoutV2.tsx` con `data-testid=kpi-market-position`, `kpi-locality-position`, `kpi-sector-percentile`, `rankings-explain-card`.
- **Verificación**: curl backend + Playwright autenticado + regresión anónimo (gate). Payload conforme al audit §3.1 (sector_pct 100, mkt #2 de 9, loc #1 de 34, 3 bullets explain).
- **CIF**: `B28184687`.
- **HARDENING**: `HARDENING-003`.

### 3.3 · B-2.5 · Estado de flujos de efectivo con bridging cash_conversion
- **Objetivo**: pestaña "Flujos de efectivo" con 6 filas × 2 años agrupadas por categoría PGC (Actividades de explotación / inversión / financiación / Variación de tesorería / Indicadores).
- **Cambios**:
  - Backend: `interfaces/financial.py` (+1 línea `cash_flow: dict | None`), `providers/agency_tool/financial.py::_map_analyze` (+1 línea passthrough desde `statements.cash_flow`).
  - Frontend: tipos `CashFlowStatement`, `CashFlowRow`, `CashFlowValue`, `CashFlowRowCategory`; componente `CashFlowTable` en `CompanyFichaLayoutV2.tsx` con `data-testid=cashflow-table` y `data-testid=cashflow-row-<key>`; tab renombrado a "Flujos de efectivo" (`data-testid=finanzas-tab-cashflow`).
  - Bridging local Cash Conversion: si `row.key === 'cash_conversion' && format === 'percent' && Math.abs(value) <= 1` → `value * 100`.
- **Verificación**: curl backend + Playwright (6 rows visibles, `65,7% / 66,1%` pintado, no `0,7%`) + regresión anónimo.
- **CIF**: `B28184687` (único CIF de la muestra con `cash_flow` poblado).
- **HARDENING**: `HARDENING-005`.

### 3.4 · B-2.4 · Refactor al agregador `/company/{cif}/ficha`
- **Objetivo**: 1 sola llamada frontend → 1 sola llamada Arroba → Intel `/company/{cif}/ficha`, en vez de N llamadas por sección.
- **Cambios**:
  - Backend: nuevo `interfaces/ficha.py` con `CompanyFicha` Pydantic (contrato `arroba-ficha-v1`), reutiliza `FinancialAnalysis` para `finances`. Nuevo método `providers/agency_tool/financial.py::fetch_ficha`. Extensión `router.py::get_company_ficha` con caché + breaker. Nuevo endpoint `GET /api/companies/{cif}/ficha` en `endpoints.py` con `get_optional_current_user` (anónimo → `finances=None`).
  - Frontend: nuevo tipo `CompanyFicha` en `intelligence-types.ts`. Método `intelligenceClient.ficha(cif)` en `intelligence-client.ts`. Refactor `CompanyFichaF01Client.tsx`: hook único `useSWR('ficha')` reemplaza `identity` + `financial-analysis`; adapter `adaptIdentityFromFicha` para el shape rico Intel.
  - Endpoints legacy por sección permanecen operativos (no deprecados).
- **Verificación**: curl autenticado + anónimo (`finances=None` confirmado); Playwright con network trace confirmó **8 → 7 llamadas SWR**; regresión B-2.1 + B-2.5 intacta.
- **CIF**: `B28184687`.
- **HARDENING**: `HARDENING-006`.

### 3.5 · Turno D · Batería multi-CIF diagnóstica (6 CIFs)
- **Objetivo**: verificar cobertura Intel en `B28031458, B50949346, A81921611, B82229907, V83153700, A28354132`. Fase 0 previa: descubrimiento de `/coverage/check` (que NO existe como API real; el patrón `GET /coverage/check` sirve el SPA HTML del Agency Tools Hub).
- **Cambios**: cero código. Solo `scripts/turno_d_multicif.py` (ephemeral) y doc `PARA_BETA_TURNO_D_MULTICIF.md`.
- **Verificación**: matriz por CIF; carga UI logueada con Playwright de los 6.
- **Hallazgos clave**: `cash_flow` null en 5/6 (solo Servier lo tiene); `ratios.current_ratio.available=false` en 6/6; `is_listed=None` en la supuesta cotizada `A28354132`; `buyers.count=0` en IUSTIME (contradice expectativa PM count=2); latencia `/buyers` ≈10 s; 6/6 tienen `valuation.benchmark` y `valuation.methodology` poblados en `finances.valuation`; 6/6 tienen ranking; deuda desglosada (`st_debt`, `lt_debt`, `financial_debt`) presente en shape `balance_sheet` pero valor `None` en la muestra.
- **HARDENING**: N/A.

### 3.6 · Bundle post-D · 3 ítems encadenados
Sub-ítem 1 · **Retirada del fallback `valuation.benchmark/methodology`**
- **Objetivo**: consumir `benchmark`/`methodology` desde el agregador (`ficha.finances.valuation`); eliminar el hook SWR legacy `/valuation`.
- **Cambios**: `CompanyFichaF01Client.tsx` (+adapter `adaptValuationFromFinances` L108-140; retirada del `useSWR<ValuationAnalysis>`); `CompanyFichaLayoutV2.tsx::Valoracion` L740-745 (fallback retirado).
- **Verificación**: network trace confirmó **7 → 6 llamadas SWR**; testing_agent 100 % PASS.
- **CIF**: `B28184687` + los 6 CIFs Turno D.
- **HARDENING**: N/A (retirada, no ampliación).

Sub-ítem 2 · **Cableado enriquecido de la sección Señales**
- **Objetivo**: pintar timeline de señales con `explanation`, `evidence`, `dimensions` como chips, `recommended_actions` como pills, `rule.id` como pie mono-font; empty state con copy exacto "Sin señales relevantes".
- **Cambios**:
  - Backend: `interfaces/signal.py::SignalItem` +4 campos aditivos (`explanation`, `evidence`, `dimensions`, `rule`); `providers/agency_tool/signal.py::_map` passthrough puro.
  - Frontend: `intelligence-types.ts::SignalItem` +4 campos opcionales; `CompanyFichaLayoutV2.tsx::Senales` reescrito (L903-995) con `data-testid=senales-section` y `senales-empty`.
- **Verificación**: OPEL `B50949346` 6 señales renderizadas correctamente; Servier `B28184687` empty state visible.
- **CIF**: `B28184687` (empty) + `B50949346` (poblado).
- **HARDENING**: `HARDENING-007`.

Sub-ítem 3 · **Fix R15 en Ratios rentabilidad (bridging × 100)**
- **Objetivo**: eliminar `-0%` / `0%` en la card "Ratios financieros" cuando el valor viene como ratio decimal `[−1, 1]` con `format="percent"`.
- **Cambios**: `CompanyFichaLayoutV2.tsx::Finanzas` L648-655 · bridging local acotado `if (format === 'percent' && Math.abs(value) <= 1) value = value * 100`. Sin tocar `fmtCell` global.
- **Verificación**: Servier ahora pinta Margen EBITDA 11,3 % / ROE 14,2 %; NCR Margen EBITDA -0,5 %; ratios `format='ratio'` como Productividad `261.735,27×` intactos.
- **CIF**: `B28184687` + `B28031458`.
- **HARDENING**: N/A (bridging visible, documentado en `INTEL_PAYLOAD_INCOHERENCIAS.md`).

---

## 4. Arquitectura del backend

### 4.1 · Flujo de datos

```
Cliente (browser)
   │
   ▼ HTTP + cookie arroba_session
Backend Arroba (FastAPI · uvicorn puerto 8001)
   │  · endpoints en src/modules/intelligence_layer/endpoints.py
   │  · routes prefijadas /api/companies/{cif}/*
   │  · get_optional_current_user (mixed-access)
   ▼
IntelligenceRouter (src/modules/intelligence_layer/router.py)
   │  · caché 2 capas (LRU memoria + Mongo TTL)
   │  · semáforo global asyncio.Semaphore(max_concurrent=3)
   │  · CircuitBreaker por proveedor
   ▼
Providers (src/modules/intelligence_layer/providers/agency_tool/)
   │  · financial.py    → /financial-intelligence/analyze,  /financial-intelligence/valuation,  /company/{cif}/ficha
   │  · signal.py       → /signal-intelligence/analyze
   │  · identity.py     → /company/{cif}/identity
   │  · semantic.py     → /company/{cif}/semantic
   │  · recommendation.py → /recommendation-intelligence/buyers, .../opportunities
   ▼
Intel API (intel.arroba.com)
   · X-API-Key S2S (ARROBA_SERVICE_API_KEY del .env)
```

### 4.2 · Endpoints backend expuestos hoy (`endpoints.py`)

| Método | Ruta | Auth | Contrato interno |
|---|---|---|---|
| `GET` | `/api/companies/{cif}/section/identity` | mixed-access | `arroba-identity-v1` |
| `GET` | `/api/companies/{cif}/section/semantic` | mixed-access | `arroba-semantic-v1` |
| `GET` | `/api/companies/{cif}/section/financial` | auth requerida | `arroba-financial-v1` (shape UI-consumable {years, rows}) |
| `GET` | `/api/companies/{cif}/section/valuation` | auth requerida | `arroba-valuation-v1` (proyección UI) |
| `POST` | `/api/companies/{cif}/financial-analysis` | auth requerida | `arroba-financial-v1` (extendido con `ranking`, `cash_flow`) |
| `GET` | `/api/companies/{cif}/valuation` | auth requerida | `arroba-valuation-v1` (legacy · sin consumidores frontend hoy) |
| `GET` | `/api/companies/{cif}/signals` | auth requerida | `arroba-signal-v1` (extendido con `explanation`, `evidence`, `dimensions`, `rule`) |
| `GET` | `/api/companies/{cif}/buyers` | auth requerida | `arroba-recommendation-v1` |
| `GET` | `/api/companies/{cif}/opportunities` | auth requerida | `arroba-recommendation-v1` |
| `GET` | `/api/companies/{cif}/ficha` | mixed-access | `arroba-ficha-v1` (B-2.4) |
| `GET` | `/api/financial-ratios/catalog` | auth requerida | catálogo de ratios |

### 4.3 · Agregador `/api/companies/{cif}/ficha`

- **Shape del payload (`CompanyFicha`)**:
  ```
  {
    cif_normalized: str,
    master_id: str,
    finances: FinancialAnalysis | null,   // null si anónimo
    identity: dict | null,                 // 33 claves ricas Intel
    ownership: dict | null,                // {available, shareholders, control, coverage, ...}
    governance: dict | null,               // {available, officers, coverage, ...}
    events: dict | null,                   // stub {available, ...}
    ranking: dict | null,                  // top-level (duplica finances.ranking)
    engine_version: "arroba-ficha-v1"
  }
  ```
- **Mixed-access**: usa `get_optional_current_user`. Si el usuario es anónimo → `ficha.model_copy(update={"finances": None})`. Resto de bloques quedan visibles.
- **Reutilización**: `finances` se construye vía `_map_analyze(cif_norm, doc["finances"])`, preservando `ranking` (HARDENING-003) y `cash_flow` (HARDENING-005) intactos.

### 4.4 · Endpoints legacy que se mantienen operativos

- `/api/companies/{cif}/section/identity` — sin consumidores frontend en `CompanyFichaF01Client.tsx` tras B-2.4, pero sigue soportado por si otro producto lo usa. Motivo de no deprecación: no se ha auditado el resto de la app; deprecación tras confirmación explícita del usuario.
- `/api/companies/{cif}/section/financial` — **sigue consumido por el frontend** (`FinancialSection` con shape `{years, rows[]}` UI-consumable no expuesto por el agregador Intel). No es sustituible por `ficha.finances`.
- `/api/companies/{cif}/section/semantic` — consumido por `SemanticSection`. Fuera del agregador Intel.
- `/api/companies/{cif}/financial-analysis` — sigue operativo por retrocompatibilidad; el agregador `/ficha` es superconjunto (mismo shape en `finances`). Pendiente deprecación.
- `/api/companies/{cif}/valuation` — sin consumidores frontend tras Bundle post-D. Se mantiene por si algún flujo test/backoffice lo necesita. Deprecable en próxima revisión.
- `/api/companies/{cif}/section/valuation` — sin consumidores frontend recientes. Estado similar a `/valuation`.

### 4.5 · Mappers en `providers/agency_tool/`

- `financial.py::_map_analyze(cif_norm, doc)` — mapea `POST /financial-intelligence/analyze` a `FinancialAnalysis`. **Passthrough**: `ranking`, `cash_flow`, `valuation`, `assessment`, `explainability`, `ratios` (dict), `evolution`, `kpis`, `financial_quality`, `identity` embebido. **Transforma**: `statements.{income_statement, balance_sheet, cashflow}` a subcampos planos; deriva `has_financials` de la presencia de `year`; establece `engine_version = arroba-financial-v1`.
- `financial.py::_map_valuation(cif_norm, doc)` — mapea `/financial-intelligence/valuation` a `Valuation`. Legacy (endpoint sin consumidores frontend en la app actual).
- `financial.py::fetch_ficha(cif) → CompanyFicha` — B-2.4. Llama `GET /company/{cif}/ficha`. Reutiliza `_map_analyze(cif_norm, data["finances"])`. Passthrough puro para `identity`, `ownership`, `governance`, `events`, `ranking`. Sin transformación.
- `signal.py::_map(cif_norm, doc)` — mapea `/signal-intelligence/analyze` a `SignalAnalysis`. **Passthrough enriquecido tras HARDENING-007**: `explanation`, `evidence`, `dimensions`, `rule` además de los campos ya existentes.
- `identity.py`, `semantic.py`, `recommendation.py` — sin cambios en esta sesión.

### 4.6 · Caché de 2 capas

- **Capa 1 · LRU en memoria** (`cache.py::IntelligenceCache`): rápida, se limpia con `supervisorctl restart backend`.
- **Capa 2 · MongoDB persistente**: colección `intelligence_cache`, `_id` con patrón `agency_tool:<method>:<identifier>:<version>` (p.ej. `agency_tool:financial:analyze:B28184687:-`). TTL configurable en settings.
- **Invalidación manual** (obligatoria tras ampliar contratos passthrough):
  ```
  python3 -c "
  import sys, asyncio; sys.path.insert(0, '/app/backend')
  from src.core.database import get_db
  async def m():
      db = get_db()
      res = await db['intelligence_cache'].delete_many({'_id': {'\$regex': 'financial:analyze|financial:ficha'}})
      print('borradas:', res.deleted_count)
  asyncio.run(m())
  "
  ```
- **HARDENING-004 · política**: cada ampliación aditiva (nuevo campo passthrough en `FinancialAnalysis`, `SignalItem`, etc.) requiere invalidación manual de las keys afectadas. Automatización pendiente.

### 4.7 · Semáforo global

- `max_concurrent=3` en el pool HTTPX del proveedor Intel. Limita fanout de llamadas concurrentes. Motivo del refactor B-2.4: agregador `/ficha` libera 3 slots por ficha (antes 4-5 llamadas paralelas por ficha).

---

## 5. Arquitectura del frontend

### 5.1 · Source of truth

- **`/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx`** — layout activo. Ficheros `.bak_*` en el mismo directorio son legacy y **no deben modificarse ni consumirse**.
- **`/app/frontend/src/components/company/CompanyFichaF01Client.tsx`** — orquestador SWR. Consume `intelligenceClient` y pasa datos al layout.

### 5.2 · Hooks SWR activos (post-Bundle post-D)

| Hook (key) | Endpoint | Auth key trigger | Consumidor |
|---|---|---|---|
| `['ficha-b24-aggregate', cif]` | `/api/companies/{cif}/ficha` | siempre (mixed) | `ficha.identity` → `adaptIdentityFromFicha`; `ficha.finances` → prop `financialAnalysis`; `ficha.finances.valuation` → adapter `adaptValuationFromFinances` → prop `valuation` |
| `['ficha-f01-semantic', cif]` | `/api/companies/{cif}/section/semantic` | siempre (mixed) | prop `semantic` |
| `['ficha-f01-financial', cif]` | `/api/companies/{cif}/section/financial` | `isAuthenticated` | prop `financial` (P&L, Balance rows, catálogo Ratios rentabilidad) |
| `['ficha-f01-signal', cif]` | `/api/companies/{cif}/signals` | `isAuthenticated` | prop `signal` (sección Señales enriquecida) |
| `['ficha-f01-buyers', cif]` | `/api/companies/{cif}/buyers` | `isAuthenticated` | prop `buyers` |
| `['ficha-f01-opportunities', cif]` | `/api/companies/{cif}/opportunities` | `isAuthenticated` | prop `opportunities` |

**Total: 6 hooks SWR** (post-Bundle). No hay ningún `useSWR` a `/valuation` legacy.

### 5.3 · Waterfall antes / después

| Sesión | Frontend SWR | Arroba → Intel | Reducción |
|---|---|---|---|
| Pre-sesión | 8 (identity, semantic, financial, financial-analysis, valuation, signal, buyers, opportunities) | 6-7 llamadas paralelas | — |
| Post B-2.4 | 7 (ficha, semantic, financial, valuation, signal, buyers, opportunities) | 5 (`ficha` consolida 4-5 subllamadas Intel) | −12,5 % / −16,6 % |
| **Post-Bundle post-D** | **6** (ficha, semantic, financial, signal, buyers, opportunities) | **4** | **−25 % / −33 %** |

### 5.4 · Adapters activos

- `adaptIdentityFromFicha(raw, cif)` (`CompanyFichaF01Client.tsx` L46-107) — mapea `ficha.identity` (33 claves rich Intel) al `IdentitySection` UI-consumable (shape planar). **Riesgos**: 4 casts `as unknown` para reconciliar `cnae_primary` como objeto anidado; adapter no trivial. Recomendación futura: mover la lógica al backend (mapper `interfaces/identity.py`) para eliminar el adapter del frontend.
- `adaptValuationFromFinances(raw, cif)` (`CompanyFichaF01Client.tsx` L108-140) — mapea `ficha.finances.valuation` (14 claves) al `ValuationAnalysis`. **Deriva `has_valuation` de la presencia de `range` o `equity_value`**. Passthrough puro. **Riesgos**: si Intel introduce un nuevo campo en `valuation`, hay que actualizar el adapter; sin `has_valuation` explícito, el layout depende de la derivación.

### 5.5 · Componentes tocados en la sesión

- `CompanyFichaLayoutV2.tsx` — `HeroBlock` (B-1.1), `Valoracion` (B-1.3 + Bundle Item 1), `Finanzas` incluye `FinTable`, `CashFlowTable` (B-2.5), `RatiosTrendCard` (B-1.4), pestaña Ratios (Bundle Item 3), `Senales` (Bundle Item 2), y layout de Rankings 2.ª fila kgrid (B-2.1).
- `CompanyFichaF01Client.tsx` — refactor B-2.4 + adapters + Bundle Item 1.
- `intelligence-types.ts` — tipos `FinancialAnalysisRanking`, `CashFlowStatement`, `CompanyFicha`, `SignalItem` ampliada.
- `intelligence-client.ts` — método `intelligenceClient.ficha(cif)`.

---

## 6. HARDENING backlog activo

| ID | Descripción | Motivo | Estado | Retirable cuando… |
|---|---|---|---|---|
| HARDENING-002 | 31 pytest backend fallando por acoplamiento fixtures ↔ `.env` (`ENRICH_COMPANY_SOURCE=mock` vs `real`) | Restaurar integridad CI | NO atacado (P2 · pendiente autorización) | Se aíslen fixtures del `.env` productivo (fixture-scoped monkeypatch) |
| HARDENING-003 | Passthrough `ranking: dict | None` en `FinancialAnalysis` desde `analyze.ranking` | Audit B-2 §3.1 detectó `ranking` poblado en Intel pero omitido en mapper | DONE 2026-08-10 | Nunca (contrato aditivo estable) |
| HARDENING-004 | Política operativa · invalidar `intelligence_cache` Mongo al ampliar contratos passthrough | LRU memoria se limpia con restart; Mongo persiste, devuelve payload viejo sin nuevos campos hasta TTL | Manual documentado, sin automatización | Se implemente script `invalidate_intelligence_cache.py` o hook en `router.py` |
| HARDENING-005 | Passthrough `cash_flow: dict | None` en `FinancialAnalysis` desde `analyze.statements.cash_flow` | Coexiste con `statements.cashflow` legacy null; mapper solo capturaba legacy | DONE 2026-08-10 | Nunca (contrato aditivo estable) |
| HARDENING-006 | Nuevo contrato `arroba-ficha-v1` (`CompanyFicha`) + endpoint agregador `GET /api/companies/{cif}/ficha` con mixed-access | Reducir waterfall 8→7 y 6→5, liberar semáforo | DONE 2026-08-10 | Nunca (nuevo contrato estable) |
| HARDENING-007 | Passthrough enriquecido en `SignalItem`: `explanation, evidence, dimensions, rule` | Cablear sección Señales UI con prosa CF + evidencia + magnitudes | DONE 2026-08-10 | Nunca (contrato aditivo estable) |

---

## 7. Bridging fallbacks activos (deuda técnica visible al usuario)

| Componente | Regla exacta | Motivo | ¿Contradice R15? | Condición de retirada |
|---|---|---|---|---|
| `CashFlowTable` (row `cash_conversion`) | `if (row.key === 'cash_conversion' && format === 'percent' && Math.abs(value) <= 1) value *= 100` | Intel entrega `cash_conversion` como ratio decimal con `format=percent`; helper `fmtCell` no × 100 | Bridging visible; documentado en `INTEL_PAYLOAD_INCOHERENCIAS.md` caso 3 | Intel armoniza contrato: (a) `value=65.68` con `format=percent`, o (b) `value=0.6568` con `format=ratio` |
| `Ratios financieros` card (rentabilidad) | `if (r.format === 'percent' && Math.abs(value) <= 1) displayValue = value * 100` | Mismo patrón que el anterior: rentabilidad viene en base 1 con `format=percent` en 6/6 CIFs | Bridging visible; documentado en `INTEL_PAYLOAD_INCOHERENCIAS.md` caso 3 "BRIDGING EXTENDIDO" | Igual que el anterior |
| Fallback `identity.description` desde `financial-analysis.identity.description` | Cascada `identity.description ?? financialAnalysis.identity.description ?? null` en `HeroBlock` | Endpoint `/section/identity` devuelve `description=""` en 5/6 CIFs; solo IUSTIME 1/6 poblado (Turno D) | No contradice R15 (es fallback entre dos fuentes reales, no cálculo) | Cobertura ≥5/6 CIFs en `/section/identity.description` |

---

## 8. Fallbacks retirados en esta sesión

- **`valuation.benchmark`** y **`valuation.methodology`**: se consumían del agregador (`ficha.finances.valuation`) con fallback a `financialAnalysis.valuation.*`. Turno D confirmó cobertura 6/6 vía agregador; `/valuation` legacy devuelve `benchmark=null` y `methodology=""` en 7/7 CIFs. **Retirados el 2026-08-10**. El endpoint backend `/api/companies/{cif}/valuation` permanece operativo pero sin consumidores frontend.

---

## 9. Escalaciones abiertas a PM / Intel (P0)

Las 7 sub-preguntas del Turno D + 1 nueva:

1. **Cobertura `cash_flow` fuera de Servier**: 5/6 CIFs muestran `statements.cash_flow=None`. Servier es el único CIF con las 6 filas pobladas. ¿Es outlier o hay ingesta progresiva? Timeline.
2. **`ratios.current_ratio.available=false` sistemático en 6/6**: valores extremos esperados (OPEL 435, FARNELL 3,85) no se materializan. ¿Trigger de cálculo bajo demanda o falta de datos en balance para calcular liquidez?
3. **`identity.is_listed=None` en la supuesta cotizada** `A28354132`: campo existe en el shape, pero Intel no lo popula. ¿Falta ingesta de listing status?
4. **`buyers.count=0` en IUSTIME** (`V83153700`): contradice expectativa PM de count=2. ¿Motor `recommendation-intelligence` re-indexado y se perdieron matches?
5. **`/coverage/check` API real**: no existe; el patrón `GET /coverage/check` devuelve el SPA HTML del Agency Tools Hub. ¿Roadmap para exponerlo como API JSON con shape `{available, sections: {...}, warnings[]}`?
6. **Deuda desglosada** (`balance_sheet.{st_debt, lt_debt, financial_debt}`): shape presente en 6/6 CIFs, valores `None` para PROCOLUIDE (único caso probado). ¿Qué CIF de muestra tiene estos valores poblados para validar cableado UI de Item 6?
7. **Latencia `/buyers` ≈ 10 s** por CIF: incompatible con SWR síncrono en hero de ficha (bloquea semáforo `max_concurrent=3` durante 10 s). ¿Optimización upstream o pattern async necesario?
8. **(Nueva)** Armonización del contrato `format=percent`: unificar toda la salida Intel a base 100 (o marcar explícitamente `format=ratio` cuando venga en base 1). Retirada de dos bridging (`CashFlowTable::cash_conversion` y `Ratios financieros::rentabilidad`) queda condicionada a esta armonización.

### CIFs de muestra y cobertura observada

| CIF | Empresa | Tipología | Ficha 200 | Ranking | CF | Ratios rentabilidad | Ownership | Governance | is_listed | Buyers | Signals |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B28184687 | LABORATORIOS SERVIER | Grande MAD (baseline) | Y | Y (sec_pct 100, mkt #2/9, loc #1/34) | **Y (6 rows)** | Y (11,3 % / 6,2 %…) | avail=Y | avail=Y | None | 0 (mock) | 0 en test, 6 con motor activo |
| B28031458 | NCR ESPAÑA | Grande MAD | Y | Y (sec_pct 100, mkt #1/5, loc #1/147) | N | Y (rentabilidad ≈ 0, tras fix -0,5 %) | avail=N, 0 socios | avail=Y, 64 officers | None | 0 | 200 (n>0) |
| B50949346 | OPEL EUROPE HOLDINGS | Mid-cap ZAR | Y | Y (sec_pct 98, mkt #3/13, loc None) | N | Y (rentabilidad neg.) | avail=Y, 1 socio | avail=Y, 43 officers | None | 0 | 6 (net_loss) |
| A81921611 | PROCOLUIDE INDUSTRIAL | PYME MAD | Y | Y (sec_pct 98, mkt #2/6, loc #3/34) | N | Y (rentabilidad ≈ 4 %) | avail=N, 0 socios | avail=Y, 9 officers | None | 0 | 200 |
| B82229907 | FARNELL COMPONENTS | PYME TIC BCN | Y | Y (sec_pct 99, mkt #1/5, loc #1/37) | N | Y | avail=Y, 1 socio | avail=Y, 14 officers | None | 1 | 200 |
| V83153700 | AGRUPACIÓN IUSTIME | Micro MAD | Y | Y (sec_pct 79, mkt #60/201, loc #3/21) | N | Y | avail=N, 0 socios | avail=Y, 91 officers | None | 0 | 200 |
| A28354132 | INNOVATIVE SOLUTIONS ECOSYSTEM (tipológica "cotizada") | Holding MAD | Y | Y (sec_pct 32, mkt #75/124, loc #49/66) | N | Y | avail=Y, 2 socios | avail=Y, 11 officers | **None (rojo)** | 5 | 200 |

---

## 10. Items aparcados con prioridad sugerida

1. **B-2.2 · Ownership** (P0 · datos disponibles): consumir `ficha.ownership.{available, shareholders[], control, coverage}`. **Bloqueador previo**: definir con PM la anonimización DPD backend (personas físicas). Cablear UI en `CompanyFichaLayoutV2.tsx`.
2. **B-2.3 · Governance** (P0 · datos disponibles): consumir `ficha.governance.{available, officers[], coverage}`. Mismo bloqueador DPD.
3. **Events shell** (P1 · stub): `ficha.events.available=false` en 6/6. Cablear con `<Empty label="Cambios corporativos" />` como placeholder; sin datos aún.
4. **Item 6 · Identificación ampliada** (P1): 34 campos disponibles en `ficha.identity`, muchos `None` hoy. Cablear UI progresiva con `<Empty/>` predominante.
5. **Item 6 · Deuda desglosada** (P2): shape 6/6 en `balance_sheet.{st_debt, lt_debt, financial_debt}`, valores 1/6 poblados (pendiente verificación con más CIFs). Cablear card "Estructura de deuda" con `<Empty/>` predominante.
6. **control-synergy** (P2 · bloqueado): buyers.count=0 en el caso testeado (IUSTIME). Re-probar con `A28354132` (5 buyers) o `B82229907` (1 buyer).
7. **`/coverage/check` integración** (P3 · bloqueado): endpoint API no existe hoy en Intel. Reactivar tras roadmap Intel.
8. **Retirada fallback `identity.description`** (P2 · bloqueado): cobertura 1/6 en Turno D. Re-medir cuando Intel populen `description` en ≥5/6 CIFs.
9. **HARDENING-002 · 31 pytest fallando** (P2 · no atacado): aislar fixtures del `.env` productivo con monkeypatch scoped.
10. **HARDENING-004 · Automatización invalidación de caché** (P3): script one-shot o hook automático en `router.py` para invalidar Mongo cache al detectar ampliación de contrato.
11. **Micro-hallazgo · Ratios rentabilidad con `available: false`**: si Intel armoniza contrato en base 100, retirar bridging de `Ratios financieros` y de `CashFlowTable::cash_conversion`.

---

## 11. Estado de deploy

- **Preview URL activa**: `https://musing-hellman-9.preview.emergentagent.com`. Sincronizada con esta sesión.
- **Producción**: `beta.arroba.com`. Desactualizada desde la sesión anterior (17 fixes apilados) + toda esta sesión (B-2.1, B-2.5, B-2.4, Turno D, Bundle post-D).
- **Cambios pendientes de deploy a producción**:
  - `HARDENING-003` (ranking passthrough).
  - `HARDENING-005` (cash_flow passthrough) + bridging `cash_conversion`.
  - `HARDENING-006` (nuevo endpoint `/api/companies/{cif}/ficha` + refactor frontend).
  - `HARDENING-007` (SignalItem enriquecido).
  - Bundle post-D · retirada fallback valuation + Senales enriquecida + fix R15 Ratios rentabilidad.
  - Extensión de `INTEL_PAYLOAD_INCOHERENCIAS.md` con caso 3 (bridging cash_conversion + bridging ratios).
  - 5 documentos de handoff publicados en `/handoff/`.
- **Autorización requerida**: el usuario debe pedir explícitamente el push a producción. Ninguna deploy automática desde esta sesión.

---

## 12. Cómo verificar el estado actualmente

### 12.1 · Autenticación (obtener cookie de test)

```
curl -s -c /tmp/cookies.jar -X POST \
  https://musing-hellman-9.preview.emergentagent.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.arroba+neo@arroba.com","password":"YofQgBFAo1wuC0d#"}'
```

### 12.2 · Curl autenticado al agregador `/ficha`

```
curl -s -b /tmp/cookies.jar \
  https://musing-hellman-9.preview.emergentagent.com/api/companies/B28184687/ficha \
  | python3 -m json.tool
```

### 12.3 · Curl anónimo al mismo endpoint (mixed-access)

```
curl -s \
  https://musing-hellman-9.preview.emergentagent.com/api/companies/B28184687/ficha \
  | python3 -m json.tool
# Debe devolver 200 con `finances: null`; resto de bloques presentes.
```

### 12.4 · Pytest acotado

```
cd /app/backend && python3 -m pytest tests/ \
  -k "financial or intelligence_layer or ficha or signal" \
  --no-header -q
# Esperable: 130/130 pass. 31 fallos legacy (HARDENING-002) quedan deselected.
```

### 12.5 · Invalidar caché Mongo de un CIF

```
python3 -c "
import sys, asyncio; sys.path.insert(0, '/app/backend')
from src.core.database import get_db
async def m():
    db = get_db()
    res = await db['intelligence_cache'].delete_many({'_id': {'\$regex': 'B28184687'}})
    print('borradas:', res.deleted_count)
asyncio.run(m())
"
```

### 12.6 · Ruta UI

- **Logueado**: `https://musing-hellman-9.preview.emergentagent.com/es/empresa-f01/{cif}`
- **Anónimo**: mismo URL, sin cookie. Bloque `<Gate>` cubre finanzas, valoración, señales, buyers, opportunities.
- **CIFs disponibles**: `B28184687` (Servier), `B28031458`, `B50949346`, `A81921611`, `B82229907`, `V83153700`, `A28354132`.

### 12.7 · Credenciales de test

- Fichero: `/app/memory/test_credentials.md`.
- Usuario preview: `test.arroba+neo@arroba.com` / `YofQgBFAo1wuC0d#`.
- Cookie: `arroba_session` (path `/`, HttpOnly).

### 12.8 · Nota sobre testing_agent

- **En el último turno funcionó** (iteration_35.json, 100 % PASS, 13/13 subchecks). Considerar recuperar su uso para cambios de UI amplios o bug fixes. Las restricciones que hubo en sesiones anteriores (Playwright sandbox no llegaba a hidratar CSR) parecen mitigadas cuando el test agent orquesta login vía API + espera selectores.

---

## 13. Documentos y descargables publicados

Todos accesibles bajo `https://musing-hellman-9.preview.emergentagent.com/handoff/<archivo>`.

| Archivo | Última mod. | Propósito | Vigencia |
|---|---|---|---|
| `PLAN_BETA_ficha_HANDOFF.md` | 2026-08-10 14:16 | Handoff previo de la sesión anterior | **Supersedido por este handoff** |
| `PLAN_BETA_status_20260810.md` | 2026-08-10 17:29 | Status ejecutivo con HARDENING-003..007 y bundles cerrados | Vigente |
| `INTEL_PAYLOAD_INCOHERENCIAS.md` | 2026-08-10 17:37 | Casos 1, 2 (resuelto), 3 (bridging extendido). Escalación Intel | Vigente |
| `PARA_BETA_B2_FASE0_AUDIT.md` | 2026-08-10 14:56 | Audit inicial de endpoints Intel B-2 | Vigente |
| `PARA_INTEL_CIFs_muestra.md` | 2026-08-10 14:56 | Muestra de CIFs de test y cobertura | Vigente |
| `PARA_BETA_B24_FICHA_SHAPE.md` | 2026-08-10 16:24 | Fase 0 diagnóstica del agregador `/ficha` | Vigente |
| `PARA_BETA_TURNO_D_MULTICIF.md` | 2026-08-10 17:02 | Batería multi-CIF (6 CIFs) · matriz + hallazgos | Vigente |
| `HANDOFF_CLAUDE_20260810.md` | 2026-08-10 (este documento) | Consolidación canónica para agente sucesor | Vigente |

---

## 14. Próximo paso recomendado

Claude debería, en su primer turno, no acometer nada de código todavía. En su lugar, **leer este handoff completo** y **presentar al usuario un plan priorizado corto** con dos vertientes: (a) desbloqueo de UI Ownership + Governance (B-2.2 y B-2.3), que son los dos ítems con mayor volumen de datos ya disponibles vía agregador `/ficha` y que solo requieren cableado + política DPD backend; (b) tarea táctica pequeña para consolidar la producción (deploy) si el usuario está listo para promover los cambios del preview.

El **primer bloqueador crítico a resolver antes de tocar UI** en Ownership o Governance es la **política DPD**: acordar con PM cómo agregar/anonimizar personas físicas en `ficha.ownership.shareholders` y `ficha.governance.officers` cuando el usuario es anónimo, y cómo entregar detalle completo cuando está autenticado. **La anonimización se hace en el mapper backend, nunca en el frontend.** Si el usuario no tiene aún esa política definida, Claude debe pedirla antes de escribir nada.

En paralelo, si el usuario prioriza cerrar el ciclo de handoff en producción, la ruta lógica es: (1) autorización explícita para deploy → (2) push desde preview a `beta.arroba.com` → (3) smoke visual con Playwright + testing_agent contra el dominio productivo → (4) monitorización latencias `/ficha` (agregador nuevo) durante 24 h + fallback rollback disponible.

---

## 15. Anexos

### 15.1 · Muestra de payload `ranking` (Servier `B28184687`)

```
{
  "sector_revenue_percentile": 100,
  "market_position": {
    "rank": 2,
    "total": 9,
    "scope": "sector CNAE + banda de tamaño (0,3x–3x ingresos)"
  },
  "locality_position": {
    "rank": 1,
    "total": 34,
    "scope": "municipio"
  },
  "explain": [
    "Percentil 100 en su sector",
    "#2 de 9 en su sector CNAE + banda de tamaño (0,3x–3x ingresos)",
    "1ª de 34 en Madrid por ingresos de su sector"
  ]
}
```

### 15.2 · Muestra de payload `cash_flow` (Servier `B28184687`)

```
{
  "years": [2023, 2022],
  "rows": [
    { "key": "cf_operating",    "label": "Flujo de caja de explotación (OCF)",  "category": "operating",  "values": [{"value":  9774860.0, "format": "currency"}, {"value": 10441960.0, "format": "currency"}] },
    { "key": "cf_capex",        "label": "Inversiones (Capex)",                 "category": "investing",  "values": [{"value": -5913040.0, "format": "currency"}, {"value": -5683020.0, "format": "currency"}] },
    { "key": "cf_financing",    "label": "Flujo de caja de financiación",       "category": "financing",  "values": [{"value": -9517670.0, "format": "currency"}, {"value":-10894250.0, "format": "currency"}] },
    { "key": "cf_net_change",   "label": "Variación neta de tesorería",         "category": "net_change", "values": [{"value": -5655850.0, "format": "currency"}, {"value":  3862550.0, "format": "currency"}] },
    { "key": "free_cash_flow",  "label": "Flujo de caja libre (FCF)",           "category": "summary",    "values": [{"value":  3861820.0, "format": "currency"}, {"value": 14756800.0, "format": "currency"}] },
    { "key": "cash_conversion", "label": "Conversión de caja (OCF/EBITDA)",     "category": "summary",    "values": [{"value":     0.6568, "format": "percent"},  {"value":     0.6608, "format": "percent"}] }
  ]
}
```

Nota: `cash_conversion.value` viene en base 1 con `format=percent` (contrato incoherente Intel · bridging local × 100 aplicado en `CashFlowTable`).

### 15.3 · Muestra de payload `signals` (OPEL `B50949346`, primer signal, sin PII)

```
{
  "signal_id": "sig_a0a2a758c9ed",
  "master_id": "mc_d1281cec10b8",
  "signal_type": "financial.net_loss",
  "category": "financial",
  "severity": "risk",
  "polarity": "negative",
  "dimensions": {
    "impact": 0.78,
    "confidence": 0.76,
    "urgency": 0.6,
    "persistence": 0.5
  },
  "confidence": 0.76,
  "is_composite": false,
  "source": {
    "engine": "financial-intelligence-v1",
    "fields": ["net_income"],
    "source_version": "iberinform_tab_<hash>"
  },
  "evidence": {
    "metric": "net_income",
    "value": -31324000.0,
    "window": "latest"
  },
  "rule": {
    "id": "financial.net_loss",
    "expression": "net_loss < threshold",
    "threshold": 0.0,
    "threshold_source": "default",
    "baseline": null,
    "thresholds_version": "thr-v1",
    "passed": true
  },
  "recommended_actions": ["analyze", "investigate"],
  "explanation": "Resultado neto negativo en el último ejercicio.",
  "engine_version": "signal-intelligence-v1",
  "taxonomy_version": "tax-v1"
}
```

### 15.4 · Shape del agregador `/ficha` (top-level)

```
{
  "cif": "B28184687",
  "engine_version": "arroba-ficha-v1",
  "identifier": "B28184687",
  "master_id": "<hash>",
  "identity": { /* 33 claves: legal_name, cnae_primary{code,description,section,division},
                   employees_total, website, corporate_purpose, mercantile_status,
                   is_listed, listed_market, activity, activity_status, address,
                   autonomous_community, capital_social, aliases, commercial_name,
                   country, description, domain, incorporation_date, legal_form,
                   locality, objeto_social, postal_code, provenance_fields, province,
                   record_status, sectors, sources, updated_at, capability_version,
                   cnae_secondary, data_coverage */ },
  "finances": {
    /* Bloque idéntico al de POST /financial-intelligence/analyze:
       statements.{income_statement, balance_sheet, cash_flow, cashflow, employees, year, basis},
       evolution, kpis, ratios (dict de 18 ratios con {value, name, category, formula,
       explanation, source, available, percentile, percentile_sample}),
       valuation.{benchmark{peers_count, ebitda_margin_percentile, subject_ebitda_margin,
       median_ebitda_margin, subject_revenue, median_revenue}, methodology, scenarios[],
       range{low,central,high}, multiple, multiple_basis, enterprise_value, equity_value,
       confidence, hypotheses[], lineage, method, ebitda_margin_percentile, benchmark_scope},
       assessment{strengths[], weaknesses[], risks[]},
       financial_quality.{score, assessment}, ranking, identity, has_financials,
       data_source, basis, year, years, cif_normalized, master_id, engine_version,
       generated_at, comparables, confidence, explainability */
  },
  "ownership": { "available": true, "shareholders": [ /* PII · anonimizar en backend */ ],
                 "control": { /* holding hierarchy */ }, "coverage": { /* rate + sources */ } },
  "governance": { "available": true, "officers": [ /* PII · anonimizar en backend */ ],
                  "coverage": { /* rate + sources */ } },
  "events": { "available": false, "engine_version": "..." },
  "ranking": { /* duplicado top-level de finances.ranking · usar finances.ranking */ }
}
```

### 15.5 · Matriz 6-CIF Turno D condensada

Ver sección 9 (mismo contenido, no repetido para brevedad).

### 15.6 · Decisiones de producto tomadas por el usuario en esta sesión

- **B-2.5 · Cash Flow**: pintar tabla con 3 categorías PGC (explotación / inversión / financiación) + Variación de tesorería + Indicadores. Copy exacto en español CF. Cero cálculo de subtotales en frontend.
- **B-2.5 · Bridging cash_conversion**: aprobado bridging local × 100 (acotado a `row.key === 'cash_conversion'`) con comentario prescriptivo y documentación en `INTEL_PAYLOAD_INCOHERENCIAS.md`. Retirable cuando Intel armonice contrato.
- **B-2.4 · Alcance ajustado**: consolidar `identity + finances (con ranking + cash_flow)` en el agregador. `semantic`, `section/financial`, `signals`, `buyers`, `opportunities` siguen como llamadas independientes hasta que Intel exponga esos shapes en `/ficha`.
- **B-2.4 · Mixed-access**: anónimo recibe `finances=None`, resto de bloques visibles. Endpoints legacy operativos.
- **Turno D · Diagnóstico**: solo diagnóstico, sin cablear nada. Reporte generado con matriz + hallazgos + recomendaciones.
- **Bundle post-D · Fallback benchmark/methodology**: retirar (cobertura 6/6 vía agregador). Endpoint `/api/companies/{cif}/valuation` legacy sigue operativo pero sin consumidores.
- **Bundle post-D · Fallback identity.description**: mantener (cobertura 1/6 insuficiente).
- **Bundle post-D · Señales**: cablear con copy exacto "Sin señales relevantes" (sin prefijo "Información en preparación · "). Enriquecer con `explanation`, `evidence`, `dimensions`, `rule`.
- **Bundle post-D · Ratios rentabilidad**: aplicar bridging × 100 (mismo patrón que cash_conversion) para eliminar `-0%` / `0%`. Retirable cuando Intel armonice contrato.
- **Reglas generales confirmadas**: R11 (UI freeze), R13 (source of truth única), R15 (datos reales o Empty), Zero Coupling, STOP disciplinado por ítem, sin deploy sin autorización.

---

## Notas de "pendiente de confirmación"

Este handoff marca como "pendiente de confirmación" únicamente los siguientes puntos, donde no consta información explícita en la documentación memory ni en el código:

1. **Nombre canónico de la rama Git** en el repositorio origen (el pod expone un branch id `170426`).
2. **Ratio exacto de cobertura de `identity.description`** más allá de los 6 CIFs de Turno D + Servier (7 en total, 1 poblado).
3. **Política DPD detallada** para B-2.2 Ownership y B-2.3 Governance: reglas de agregación (por rol, por tipo de entidad, por umbral de participación) para el modo anónimo.
4. **Timeline oficial de Intel I-2 / I-3 / I-4** para poblar cash_flow, current_ratio, is_listed, description y deuda desglosada en más CIFs.
