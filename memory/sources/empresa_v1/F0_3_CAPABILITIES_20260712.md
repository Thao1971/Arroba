# F0_3_CAPABILITIES_20260712.md · Paso 0 F0.3 · Sondeo Valoración

Fecha: 2026-07-13 07:27 UTC.
Modo: `AGENCY_TOOL_MODE=real`.
Identificadores probados: `A87803862` (CIF · TOTALENERGIES) + `mc_80e03f1e1627` (master_id).
Engine build: `financial-intelligence-v1` (build `2026-07-12T21:13:26Z`).

## 1 · Endpoint dedicado (canónico)

| Endpoint | Body | HTTP | Notas |
|---|---|---|---|
| `POST /api/v1/financial-intelligence/valuation` | `{"identifier":"A87803862"}` | **200** | Canónico. Devuelve top-level `master_id`, `cif_normalized`, `valuation{…}`, `engine_version`, `generated_at`. |
| `POST /api/v1/financial-intelligence/valuation` | `{"identifier":"mc_80e03f1e1627"}` | **200** | Mismo shape. |
| `POST /api/v2/valuation` | — | 404 | No existe. |
| `POST /api/v1/valuation` | — | 404 | No existe. |
| `POST /api/v2/financial-intelligence/valuation` | — | 404 | No existe. |
| `GET /api/v1/financial-intelligence/valuation/mc_...` | — | 404 | Sólo POST. |

**Decisión**: usar `POST /api/v1/financial-intelligence/valuation` como fuente canónica para F0.3. El bloque `valuation` de `/analyze` sigue disponible pero como fallback informativo — el endpoint dedicado es más ligero (~300 bytes vs ~7 KB).

## 2 · Shape del response canónico

```json
{
  "master_id": "mc_80e03f1e1627",
  "cif_normalized": "A87803862",
  "valuation": {
    "method": "ev_ebitda",
    "multiple": 6.5,
    "multiple_basis": "inferred_reference",
    "enterprise_value": 237536000.0,
    "equity_value": 236633000.0,
    "range": { "low": 201905600.0, "high": 273166400.0 },
    "confidence": 0.6,
    "hypotheses": [
      "Múltiplo EV/EBITDA sectorial (sección D) = 6.5x (REFERENCIA inferida)",
      "Deuda neta = deuda financiera - caja = 903000.0"
    ],
    "lineage": {
      "financials_source": "master_companies.financials.latest",
      "basis": "individual",
      "year": 2024
    }
  },
  "engine_version": "financial-intelligence-v1",
  "generated_at": "2026-07-13T07:27:48.219006+00:00"
}
```

## 3 · Mapeo de capacidades → COMP-4001..4007

| COMP | Contenido | Estado | Justificación |
|---|---|---|---|
| COMP-4001 · Overview | Método + EV + Equity Value + confidence headline | 🟢 **READY** | `method`, `enterprise_value`, `equity_value`, `confidence` presentes. |
| COMP-4002 · Method | Método aplicado + múltiplo + multiple_basis + lineage | 🟢 **READY** | `method="ev_ebitda"`, `multiple=6.5`, `multiple_basis="inferred_reference"`, `lineage.{financials_source, basis, year}`. |
| COMP-4003 · Range | Bajo (low) · Central (EV) · Alto (high) | 🟢 **READY** | `range.low`, `range.high` presentes. `EV` como punto central. |
| COMP-4004 · Hypotheses | Lista textual de hipótesis + confidence | 🟢 **READY** | `hypotheses[]` array + `confidence=0.6`. |
| COMP-4005 · EV Bridge | Bridge components (EBITDA → EV → Equity) | 🔴 **BLOCKED** | `valuation.bridge_components` NO expuesto. Motor sólo da `enterprise_value` y `equity_value` finales + hipótesis textual de deuda neta. Sin desglose escalonado. |
| COMP-4006 · Scenarios | 3 escenarios Bajo/Medio/Alto | 🟡 **DEGRADED** | Motor entrega `range.{low, high}` + `enterprise_value` como central. Sin `scenarios[]` estructurados con criterios/probabilidades. Rendible como 3 puntos derivados de `range` + `EV`. |
| COMP-4007 · Sensitivity | Matriz sensibilidad (múltiplo × EBITDA) | 🔴 **BLOCKED** | `valuation.sensitivity` NO expuesto. Motor sólo entrega el valor central + rango. Sin grid multidimensional. |

## 4 · Elementos del ZIP `SecValoracion` (ce-sections1.jsx) NO alineados con R15

El ZIP asume interactividad y datos NO expuestos por el motor. Bajo R15 estricto se degradan/bloquean:

| Elemento ZIP | Fuente esperada | Estado |
|---|---|---|
| Slider EBITDA (Reportado/Ajustado/Media) | requiere multi-EBITDA (histórico + ajustes) | 🔴 BLOCKED · sólo EBITDA reportado 2024 disponible. |
| Slider múltiplo interactivo (4x–11x) | requiere motor que devuelva rango de múltiplos + recálculo | 🔴 BLOCKED · el múltiplo lo fija el motor; en Arroba **sólo lectura**. |
| Selector comprador (Financiero/Nacional/Internacional) con factor | requiere `buyer_factor` en motor | 🔴 BLOCKED. |
| P25/Mediana/P75 categoría | requiere `sector_multiples` | 🔴 BLOCKED. |
| Quality Score (0-100) | requiere `quality_score_global` (NO `financial_quality.score`) | 🔴 BLOCKED. |
| Benchmark radar (Quality/EBITDA/Rev-empleado/Salud) | requiere `benchmarks[]` | 🔴 BLOCKED. |
| Metodología expandible | descripción textual del cálculo | 🟢 READY · derivable de `hypotheses` + `multiple_basis` + `lineage`. |
| CTA "Solicitar valoración avanzada" | CTA business · no depende del motor | 🟢 READY (opcional). |
| Deuda financiera neta explícita (5,65M€ en ZIP) | motor entrega en hipótesis 2 (`Deuda neta = 903000`) | 🟢 READY · valor real del motor. |

## 5 · Veredicto Paso 0

**GO** para F0.3 con las siguientes limitaciones:
- COMP-4001..4004 → **READY** (Overview, Method, Range, Hypotheses).
- COMP-4006 → **DEGRADED** (3 puntos derivados de `range.{low, high}` + EV central · sin probabilidades).
- COMP-4005 y COMP-4007 → **BLOCKED BY DATA** (UnavailableBlock con motivo trazable).
- Elementos interactivos del ZIP → **BLOCKED** por R15 (arroba nunca calcula valoración en el frontend).

Cash Flow diseño del ZIP no aplica. Los sliders del ZIP se convierten en **lectura pura** con los valores que el motor entrega.

## 6 · Confidence bajo (0.6) — implicaciones

- El motor devuelve `confidence: 0.6` (nivel medio · consistente con `multiple_basis="inferred_reference"`).
- La UI debe **mostrar el confidence de forma clara** en COMP-4001 y COMP-4004. Es una señal P1 explainability-first para el comprador.

## 7 · Histórico

- v1 · 2026-07-13 · 07:27 UTC · sondeo capacidades Valoración. Veredicto: 4 READY · 1 DEGRADED · 2 BLOCKED.
