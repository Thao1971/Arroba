# B-2.4 · Fase 0 diagnóstica · Shape del agregador `/company/{cif}/ficha`

**Fecha**: 2026-08-10
**Sesión**: BETA · Sub-step 2.1 (Fase 0 previa al refactor B-2.4)
**Fuente Intel**: `GET https://intel.arroba.com/api/v1/company/B28184687/ficha` con `X-API-Key` S2S primary. CIF Servier `B28184687`, único CIF resuelto en la muestra (cf. `PARA_INTEL_CIFs_muestra.md`).

## Payload observado · claves top-level

```
{
  "cif": "B28184687",
  "engine_version": "...",
  "identifier": "...",
  "master_id": "...",
  "identity": { ... },           // shape rico, DISTINTO del /section/identity legacy
  "finances": { ... },           // idéntico a POST /financial-intelligence/analyze
  "ownership": { ... },          // nuevo, disponible para B-2.2
  "governance": { ... },         // nuevo, disponible para B-2.3
  "events": { ... },             // stub · sólo availability keys
  "ranking": { ... }             // duplicado top-level; coincide con finances.ranking
}
```

Tamaño total: **22 426 bytes** en un solo response. HTTP 200 en ≈2.68 s (latencia dominada por el subquery `analyze`, que solo tarda ≈2.23 s por sí mismo; los cinco bloques restantes suman ~0.4 s).

## Comparación con contratos actuales por sección

| Sección | Fuente actual (Arroba proxy) | Presente en `/ficha` | Shape coincide 1:1 | Diffs / banderas |
|---|---|---|---|---|
| `identity` | `GET /api/companies/{cif}/section/identity` → `IdentitySection` (shape UI-consumable) | ✅ (top-level) | ❌ **parcialmente** | El agregador expone `IdentityCard` **rico** con 33 claves (`activity`, `sectors`, `mercantile_status`, `data_coverage`, `provenance_fields`, ...); el `IdentitySection` legacy tiene un shape UI-consumable simplificado. **Decisión**: mapear el agregador a `IdentitySection` reutilizando el mapper existente (o extenderlo). |
| `finances` | `POST /api/companies/{cif}/financial-analysis` → `FinancialAnalysis` | ✅ | ✅ **1:1** | `finances` incluye exactamente las mismas claves que `analyze`: `statements.{income_statement, balance_sheet, cash_flow, cashflow, employees, year, basis}`, `evolution`, `kpis`, `ratios` (dict), `valuation`, `assessment`, `financial_quality`, `ranking`, `identity`, `has_financials`, `data_source`, `basis`, `year`, `years`, `cif_normalized`, `master_id`, `engine_version`, `generated_at`, `comparables`, `confidence`, `explainability`. **Reutilizamos `_map_analyze` sin cambios**. |
| `finances.ranking` (B-2.1) | idem finances | ✅ | ✅ **1:1** | 4 claves `sector_revenue_percentile`, `market_position`, `locality_position`, `explain`. **Sin regresión B-2.1**. |
| `finances.statements.cash_flow` (B-2.5) | idem finances | ✅ | ✅ **1:1** | `{years[2], rows[6]}` — 6 filas: `cf_operating`, `cf_capex`, `cf_financing`, `cf_net_change`, `free_cash_flow`, `cash_conversion`. **Sin regresión B-2.5**. |
| `valuation` | `GET /api/companies/{cif}/valuation` → `ValuationAnalysis` | ⚠️ **solo en `finances.valuation`** | ⚠️ | El agregador NO expone `valuation` top-level. `finances.valuation` incluye las mismas 14 claves (`benchmark`, `benchmark_scope`, `confidence`, `ebitda_margin_percentile`, `enterprise_value`, `equity_value`, `hypotheses`, `lineage`, `method`, `methodology`, `multiple`, `multiple_basis`, `range`, `scenarios`). **De hecho, el `finances.valuation` del agregador es **más rico** que `/valuation` (que devolvía `benchmark=null` y `methodology=""`; cf. `INTEL_PAYLOAD_INCOHERENCIAS.md` caso 2). No renderizamos `valuation` a partir del agregador en este turno — el fallback existente ya lo hace desde `financialAnalysis.valuation`. |
| `ownership` | (no cableado) | ✅ | N/A · nuevo | Claves: `available`, `cif`, `control`, `coverage`, `engine_version`, `identifier`, `shareholders`. **Habilita B-2.2** sin llamada extra. |
| `governance` | (no cableado) | ✅ | N/A · nuevo | Claves: `available`, `cif`, `coverage`, `engine_version`, `identifier`, `officers`. **Habilita B-2.3** sin llamada extra. |
| `events` | (no cableado) | ✅ | N/A · stub | Solo `available`, `cif`, `engine_version`, `identifier`. Sin datos aún. |
| `semantic` | `GET /api/companies/{cif}/section/semantic` → `SemanticSection` | ❌ | N/A | **Fuera del agregador**. Sigue como llamada independiente. |
| `signal` | `GET /api/companies/{cif}/signals` → `SignalAnalysis` | ❌ | N/A | **Fuera del agregador**. Sigue como llamada independiente. |
| `buyers` / `opportunities` | `GET /api/companies/{cif}/buyers`, `.../opportunities` | ❌ | N/A | **Fuera del agregador**. Siguen como llamadas independientes. |
| `financial` (section, UI-consumable con `{years, rows[]}`) | `GET /api/companies/{cif}/section/financial` → `FinancialSection` | ❌ | N/A | **Fuera del agregador**. Este shape se construye actualmente en el backend Arroba (`_map_financial_section`) a partir de `income_statement`/`balance_sheet` + `evolution.points`. El agregador entrega `finances.statements.{income_statement, balance_sheet}` como dicts planos, no como tablas UI. **Sigue como llamada independiente por ahora**. |

## Mixed-access

- El agregador Intel **exige** `X-API-Key` S2S siempre (HTTP 401 sin key). No hay parcialización nativa.
- La parcialización mixed-access la implementa el backend Arroba (`get_optional_current_user`): usuario anónimo → devolvemos solo `identity` + `ownership`/`governance`/`events` (públicos), `finances=null`. Usuario autenticado → payload completo. **Estrategia idéntica a los endpoints legacy por sección.**

## Latencias observadas (Servier, 2026-08-10, 15:5x UTC)

| Endpoint Intel | Latencia | Notas |
|---|---|---|
| `POST /financial-intelligence/analyze` | **2.23 s** | Dominante · incluye finances completo |
| `GET /company/{cif}/identity` | 0.17 s | Rápido · shape rico |
| `GET /company/{cif}/ficha` (agregador) | **2.68 s** | Suma efectiva ≈ analyze + 0.4 s |

**Conclusión**: el agregador **no penaliza latencia** (0.45 s incremental sobre `analyze` cubre identity+ownership+governance+events+ranking). Libera 3 slots concurrentes del semáforo Arroba (`max_concurrent=3`) por ficha, permitiendo procesar 3× más fichas concurrentes bajo la misma cuota.

## Decisión final tomada tras Fase 0

Procedemos con **Sub-step 2.2 (backend)** y **Sub-step 2.3 (frontend)** con este **alcance ajustado** respecto a la instrucción original:

### Consolidamos en el agregador (5 llamadas → 1)
- `identity` (via mapper enriquecido: agregador `identity` rico → `IdentitySection` UI-consumable).
- `finances` (reutilizando `_map_analyze` sin cambios; preserva B-2.1 Rankings y B-2.5 Cash Flow).
- `ownership`, `governance`, `events` (passthrough puro, listos para B-2.2/B-2.3 en futuro turno).

### Se mantienen fuera del agregador (siguen como SWR independientes)
- `semantic` (no expuesto por Intel en `/ficha`).
- `financial` (section, shape UI-consumable con `{years, rows[]}` — construido por backend Arroba, no por Intel).
- `signal`, `buyers`, `opportunities` (motores separados de recomendación · fuera del scope del agregador).
- `valuation` (endpoint legacy) — el `finances.valuation` del agregador ya cubre esto; el fallback `financialAnalysis.valuation` en el frontend ya funciona (`INTEL_PAYLOAD_INCOHERENCIAS.md` caso 2). **NO retiramos el hook `useSWR<ValuationAnalysis>` en este turno** para no arriesgar regresión visual.

### Waterfall observado antes / después del refactor

| Estado | Llamadas SWR frontend por ficha logueada | Llamadas Arroba → Intel por ficha |
|---|---|---|
| **Antes** (B-2.5) | 8 (identity, semantic, financial, financial-analysis, valuation, signal, buyers, opportunities) | 6 (identity + analyze + financial-section + valuation + signal + buyers/opportunities motor) |
| **Después** (B-2.4) | **6** (**ficha**, semantic, financial, signal, buyers, opportunities) | **4** (**ficha [agregador]** + financial-section + signal + buyers/opportunities motor) |

Reducción neta: **25% menos llamadas SWR frontend** (8 → 6), **33% menos llamadas Arroba → Intel** (6 → 4). Con `max_concurrent=3`, esto significa: hoy una sola ficha consume las 3 slots del semáforo; tras el refactor, una ficha consume 2 slots, dejando 1 slot libre para otra petición concurrente.

## Referencias

- `PARA_BETA_B2_FASE0_AUDIT.md` — audit original de endpoints Intel.
- `PARA_INTEL_CIFs_muestra.md` — limitación multi-CIF (solo Servier resuelve).
- `INTEL_PAYLOAD_INCOHERENCIAS.md` — casos 1, 2, 3.
- `PLAN_BETA_status_20260810.md` — status general de sesión.
