# F0_3_DELIVERABLE.md · Sprint F0.3 · Sección Valoración · Entregable mínimo

Fecha: 2026-07-13 07:45 UTC.
Modo backend: `AGENCY_TOOL_MODE=real`.
Caso canónico: `A87803862` · TOTALENERGIES ELECTRICIDAD Y GAS ESPAÑA · `mc_80e03f1e1627`.
Endpoint canónico usado: `POST /api/v1/financial-intelligence/valuation` (proxied vía `GET /api/companies/{cif}/valuation`).

## 1 · URL preview

`https://bda5adf2-2809-4e4d-80da-4a47b994f2fe.preview.emergentagent.com/es/empresa-f01/A87803862` (sidebar → Valoración).

Login: `buyer@arroba.com / Arroba2026!`.

## 2 · Capturas visuales (URLs públicas)

| Estado | URL |
|---|---|
| Nivel 1 · Ejecutiva | `/qa/f0_3/f03_val_level1.jpeg` |
| Nivel 2 · Categorías | `/qa/f0_3/f03_val_level2.jpeg` |
| Nivel 3 · Detalle | `/qa/f0_3/f03_val_level3.jpeg` |
| Nivel 3 · scroll (hipótesis + escenarios) | `/qa/f0_3/f03_val_level3_scroll.jpeg` |
| COMP-4005 + COMP-4007 · BLOCKED | `/qa/f0_3/f03_val_blocked_blocks.jpeg` |
| CTA "Valoración avanzada" | `/qa/f0_3/f03_val_cta.jpeg` |

Base URL preview: `https://bda5adf2-2809-4e4d-80da-4a47b994f2fe.preview.emergentagent.com`.

## 3 · Estado de implementación por componente × nivel

| COMP | Bloque | Nivel 1 | Nivel 2 | Nivel 3 | Motivo si DEGRADED/BLOCKED |
|---|---|---|---|---|---|
| COMP-4001 | Overview (EV, Equity, múltiplo, confianza) | READY | READY | READY | — |
| COMP-4002 | Method (label + descripción + lineage) | READY | READY | READY | — |
| COMP-4003 | Range (bajo · central · alto) | READY | READY | READY | — |
| COMP-4004 | Hypotheses (source-grounded + confidence badge) | READY | READY | READY | — |
| COMP-4005 | EV Bridge | — | — | **BLOCKED** | Motor no expone `valuation.bridge_components`. UnavailableBlock con nota reportada de deuda neta (P1). R15 explícito. |
| COMP-4006 | Scenarios (Bajo/Medio/Alto) | READY* | READY* | READY* | **DEGRADED**: derivados de `range.{low, high}` + EV como central. Sin `scenarios[]` estructurados ni probabilidades. Badge "DEGRADADO · rango del motor" visible. |
| COMP-4007 | Sensitivity | — | — | **BLOCKED** | Motor no expone `valuation.sensitivity`. UnavailableBlock con motivo R15. |

*COMP-4006 aparece siempre (todos los niveles) marcado como DEGRADED. Los datos son reales (deriva del `range` real del motor), sólo la estructura de escenarios múltiples con criterios es lo que falta.

## 4 · Capacidades degradadas / BLOCKED (justificación R15)

- **COMP-4005 EV Bridge**: el motor devuelve `enterprise_value` y `equity_value` finales + hipótesis textual "Deuda neta = 903000.0" pero NO expone `bridge_components` como array escalonado. arroba no construye el bridge sintéticamente.
- **COMP-4006 Scenarios (DEGRADED)**: 3 escenarios Bajo/Medio/Alto derivados de `range.{low, central=EV, high}` reales del motor. La `Equity Value` de cada escenario se calcula restando la deuda neta reportada en `hypotheses[]`, no se estima. Sin `scenarios[]` estructurados con `criteria`/`probability`.
- **COMP-4007 Sensitivity**: motor no expone matriz múltiplo × EBITDA. arroba no genera la matriz en el frontend.
- **Elementos interactivos del ZIP (`SecValoracion`)**: sliders de múltiplo, selectores de comprador y EBITDA base, botón "Recalcular" → **eliminados** por R15 (arroba nunca calcula valoración en el frontend). Sustituidos por lectura pura de los valores del motor.
- **P25/Mediana/P75 y benchmark radar del ZIP**: BLOCKED. Motor no expone múltiplos sectoriales estructurados ni benchmarks por métrica.

## 5 · Trazabilidad P1 (Explainability First)

- Fuente única: `POST /api/v1/financial-intelligence/valuation` (Intelligence Engine v1.0.0 · build 2026-07-12T21:13:26Z).
- Contrato interno UI-facing canónico: `arroba-valuation-v1` (R5).
- `valuation.lineage`:
  - `financials_source`: "master_companies.financials.latest"
  - `basis`: "individual"
  - `year`: 2024
- `valuation.multiple`: 6.5 · `valuation.multiple_basis`: "inferred_reference".
- `valuation.confidence`: 0.6 · `confidence_level` derivado: **medium** (arroba lo enriquece).
- `valuation.hypotheses` (2 items reales, sin generación LLM propia):
  1. "Múltiplo EV/EBITDA sectorial (sección D) = 6.5x (REFERENCIA inferida)"
  2. "Deuda neta = deuda financiera - caja = 903000.0"
- Cache backend: 1h.

## 6 · Cumplimiento reglas

- ✅ **R15 · Datos reales o Unavailable**: `range` real del motor. Bridge/Sensitivity BLOCKED con motivo trazable. Sin sliders, sin cálculo frontend.
- ✅ **R14 · Un COMP = un componente React**: COMP-4001..4007 con `@componentId` en JSDoc. Guard `r14_comp_id_declaration_guard.test.ts` pasa.
- ✅ **R13 · SoT única**: nueva sección en `components/company/valoracion/`. Layout F0.1c intacto. Componentes F0.1/F0.2 no tocados.
- ✅ **R5 · Contrato interno decoupled**: `engine_version="arroba-valuation-v1"` (nunca `financial-intelligence-v1`).
- ✅ **P1 · Explainability first**: badge de confianza en COMP-4004, lineage visible en COMP-4002, badge "DEGRADADO · rango del motor" en COMP-4006.
- ✅ **P3 · Zero Coupling**: proxy `AgencyToolValuationProvider` mapea el shape del proveedor al contrato canónico. Ratios, multiples y range enriquecidos con `central=EV` derivado (arroba).
- ✅ **F0.2-OP1..OP6**: CIF como identificador de entrada. `master_id` cacheado en backend, no expuesto al usuario final. Contratos `arroba.v1/v2` congelados (se creó `arroba-valuation-v1` nuevo · aprobación autorizada por el brief F0.3).
- ✅ **F0.2 APROBADA** en canon (`CHANGELOG.md` · `PRD.md`). Cash Flow y Balance multi-año permanecen BLOCKED BY DATA.

## 7 · Fuente de la narrativa Copilot (§P1 + P2)

- `hypotheses[]` (textuales del motor · source-grounded).
- `confidence_level` derivado + `confidence` numérica.
- `multiple_basis` + `lineage` (año, basis, fuente).
- Ninguna narrativa LLM propia de arroba. Cuando el motor no expone contenido → `UnavailableBlock` con motivo trazable.

## 8 · Resultado de los tests

- **Pytest**: **287 passed, 6 deselected** (276 F0.2 + 11 F0.3: +7 valuation unit · +4 valuation endpoint · retención de auth guard del endpoint viejo actualizado).
- **Vitest**: **200 passed** (189 F0.2 + 11 F0.3).
- **TypeScript**: `tsc --noEmit` verde.
- **Guard R14**: 🟢 verde con COMP-4001..4007 declarados.
- **Guard R12** (no `/master/*`): 🟢 verde.

## 9 · Incidencias encontradas

- El endpoint viejo `GET /api/companies/{cif}/valuation` devolvía el schema `Valuation` (subset del bloque `valuation` embebido en `financial-analyze`). **Eliminado** y reemplazado por el nuevo endpoint `ValuationAnalysis` con contrato `arroba-valuation-v1`. Test viejo (`test_valuation_returns_404_in_mock_mode`) actualizado; los tests canónicos viven en `test_valuation_endpoint.py`.
- El identificador `master_id` (formato `mc_[0-9a-f]{12}`) llega en minúsculas del `resolve`. El router forzaba `.upper()` antes de llamar al endpoint dedicado, causando 404. **Corregido**: sólo se normaliza a mayúsculas cuando el identificador no empieza por `mc_`.
- Cache mongo `intelligence_cache` limpiado al arrancar F0.3 para forzar refresh con el nuevo mapper.

## 10 · Confirmación reglas F0.3

- ✅ Todos los datos proceden EXCLUSIVAMENTE del Intelligence Engine (`POST /api/v1/financial-intelligence/valuation`).
- ✅ Cero acceso directo al Data Layer.
- ✅ Cero JWT admin ni endpoints internos.
- ✅ Cero mocks Arroba-specific ni datos simulados.
- ✅ Contratos `arroba.v1`/`arroba.v2` (schemas públicos) NO modificados. Se creó `arroba-valuation-v1` como contrato interno **nuevo** (autorizado por el brief · no existe versión previa).
- ✅ Layout F0.1c intacto. COMP F0.1/F0.2 aprobados no tocados.
- ✅ COMP-0008 (ACC contradicción C5) omitido en F0.3: el ZIP `SecValoracion` no tiene un bloque visualmente aislado que le corresponda.

## 11 · Modo backend al terminar

- `AGENCY_TOOL_MODE=real` mantenido (según brief F0.2 Paso 6, aplicable también a F0.3).
- `INTELLIGENCE_COMPANY_V2_ENABLED=true` activo.
- Backend RUNNING · cache `intelligence_cache` con TTL 1h para valuation.

## 12 · Histórico

- v1 · 2026-07-13 · 07:45 UTC · entregable mínimo F0.3 · caso canónico TOTALENERGIES visible en producción.
