# F0_2_DELIVERABLE.md · Sprint F0.2 · Sección Finanzas · Entregable mínimo

Fecha: 2026-07-12 22:32 UTC.
Modo backend: `AGENCY_TOOL_MODE=real` (mantenido durante el sprint · Paso 6 del brief).
Caso canónico: `A87803862` · TOTALENERGIES ELECTRICIDAD Y GAS ESPAÑA · `mc_80e03f1e1627`.

## 1 · URL preview

`https://bda5adf2-2809-4e4d-80da-4a47b994f2fe.preview.emergentagent.com/es/empresa-f01/A87803862`

Login: `buyer@arroba.com / Arroba2026!`. Navegar a la sección **Finanzas** en el sidebar.

## 2 · Capturas visuales (URLs públicas)

| Estado | URL | Notas |
|---|---|---|
| Nivel 1 · Cuenta de resultados | `/qa/f0_2/f02_finanzas_level1.jpeg` | Overview + IntelCard + Evolution real 2022-2024. |
| Nivel 3 · Cuenta de resultados completa | `/qa/f0_2/f02_finanzas_level3_pnl.jpeg` | 9 partidas reales del income_statement 2024 (Iberinform). |
| Nivel 3 · Balance completo | `/qa/f0_2/f02_finanzas_level3_balance.jpeg` | Activo (7,67 M€ + 180,53 M€) · Patrimonio 30,53 M€ · Pasivo 4,19 M€ + 153,48 M€. |
| Cash Flow · BLOCKED | `/qa/f0_2/f02_finanzas_cashflow_blocked.jpeg` | R15 explícito · motor devuelve `cashflow: null`. |
| Ratios · nivel 3 | `/qa/f0_2/f02_finanzas_ratios.jpeg` | Rentabilidad · Liquidez · Solvencia · Eficiencia · reales del motor. |

Base URL preview: `https://bda5adf2-2809-4e4d-80da-4a47b994f2fe.preview.emergentagent.com`.

## 3 · Estado de implementación por bloque × nivel

| COMP | Bloque | Nivel 1 (Ejecutiva) | Nivel 2 (Categorías) | Nivel 3 (Detalle) | Motivo si DEGRADED/BLOCKED |
|---|---|---|---|---|---|
| COMP-3001 | Overview (agregado) | READY | — | — | Se muestra siempre encima de Evolution en nivel 1. |
| COMP-3002 | Cuenta de Resultados | READY | READY | READY | 9 partidas reales. Multi-año sólo YoY vía COMP-3006. |
| COMP-3003 | Balance | READY | READY | READY | 5 grupos reales · último ejercicio. Balance histórico no expuesto por el motor (columnas previas `—`). |
| COMP-3004 | Ratios | READY | READY | READY | 13 ratios reales con `name`, `category`, `formula`, `source`. |
| COMP-3005 | Cash Flow | **BLOCKED** | **BLOCKED** | **BLOCKED** | Motor devuelve `cashflow: null` para el caso canónico (y resto sondeados). R15: no se estima. `UnavailableBlock` geométricamente idéntico al ZIP. |
| COMP-3006 | Evolution / Trends | READY | READY | READY | 3 años reales (2022-2024) para revenue/EBITDA/net_income. YoY y CAGR reales cuando el motor los expone. |
| COMP-3007 | Anomalies | READY | READY | READY | `evolution.anomaly` + `assessment.risks/weaknesses` source-grounded. Sin narrativa LLM propia. |

## 4 · Capacidades degradadas

- **COMP-3005 · Cash Flow · BLOCKED**: el motor `financial-intelligence/analyze v1` no expone el bloque `cashflow` (retorna `null`). La UI degrada a `UnavailableBlock` con mensaje R15 explícito. Cuando el motor lo exponga, activación automática sin cambios de layout.
- **Balance histórico**: el motor devuelve `balance_sheet` sólo para el último ejercicio (`statements.year`). En la tabla nivel 3 las columnas de años previos aparecen como `—` (dato no disponible · R15). YoY sólo se puede calcular vía COMP-3006 sobre `revenue`, `ebitda`, `net_income` que el motor sí entrega en `evolution.points`.
- **Anomalies**: el motor sólo devuelve `evolution.anomaly: bool` (sin `severity`, `title` ni `explanation` estructurados). La UI muestra el flag + `assessment.risks/weaknesses` como fallback source-grounded.

## 5 · Trazabilidad de datos (P1 · Explainability First)

- Fuente única: `POST /api/v1/financial-intelligence/analyze` (Intelligence Engine v1.0.0 · build 2026-07-12T21:13:26Z).
- Contrato interno UI-facing: `arroba-financial-v1` (R5 · congelado durante F0.2).
- `explainability.data_source` = "master_companies + norm_financials (Iberinform)".
- `explainability.source_version` = "iberinform".
- `explainability.basis` = "individual" · `year` = 2024 · `ai_used` = false.
- `explainability.rules_applied` = "KPIs/ratios/quality deterministas; valoración por múltiplos inferidos".
- Cada ratio (13) incluye `source` = "Iberinform statements (Normalized Layer)".
- Cache aside: `resolve` 24h · `financial-analyze` 1h (config `intelligence_layer`).

## 6 · Cumplimiento reglas

- ✅ **R15 · Datos reales o Unavailable**: 3 ejercicios reales (2022-2024) para las 3 magnitudes evolutivas. Cash Flow BLOCKED. Columnas P&L/Balance sin dato → `—` (nunca interpolado).
- ✅ **R14 · Un COMP = un componente React**: COMP-3001..3007 con `@componentId` en JSDoc. Guard automatizado `r14_comp_id_declaration_guard.test.ts` pasa.
- ✅ **R13 · SoT única de layout**: nueva sección en `components/company/finanzas/`. Layout F0.1c intacto (topbar, sidebar, header, deal panel).
- ✅ **R5 · Contrato interno decoupled**: `engine_version="arroba-financial-v1"`. `metadata.source` no menciona proveedor externo.
- ✅ **P1 · Explainability first**: IntelCard con `data_source`, `source_version`, `basis`, `year`, `rules_applied`, `ai_used`. Tooltip por ratio con `formula` + `explanation` + `source`.
- ✅ **P3 · Zero Coupling**: el frontend consume EXCLUSIVAMENTE `arroba-*-v1`. El shape crudo del proveedor nunca llega a la UI.
- ✅ **F0.2-OP1 · CIF como identificador de entrada**: usuario navega con `A87803862`. `master_id` (`mc_80e03f1e1627`) queda cacheado en backend, nunca aparece en UI ni URLs.
- ✅ **F0.2-OP6 · Contratos congelados**: `arroba.v1` y `arroba.v2` schemas no modificados. Sólo se extendió el DTO interno `FinancialAnalysis` con campos opcionales para acomodar el shape actual del proveedor.

## 7 · Fuente de la narrativa Copilot (§3.4)

Fuente exclusiva source-grounded (NO LLM propio):
- `analysis.financial_quality.strengths/weaknesses/risks` → aspectos positivos / atención / riesgos.
- `analysis.assessment.strengths/weaknesses/risks` → prioritario cuando el motor lo entrega en `assessment.*`.
- `analysis.evolution.trend` → indicador direccional en el header de la IntelCard.
- `analysis.explainability.{data_source, source_version, basis, year, rules_applied, ai_used}` → evidencia desplegable "¿Por qué Arroba dice esto?".

Si el motor no expone contenido para un bloque → `UnavailableBlock` con mensaje "Interpretación pendiente de capacidad Intelligence Engine". Prohibido generar narrativa LLM propia sin source-grounding.

## 8 · Resultado de los tests

- **Pytest**: **276 passed, 6 deselected** (250 iniciales + 26 nuevos F0.2 · +14 resolve + +3 financial nuevos + +8 canonical adapter + +1 router V2 flag).
- **Vitest**: **189 passed** (180 iniciales + 9 nuevos Finanzas).
- **Guard R14**: 🟢 verde con COMP-3001..3007 declarados.
- **Guard R12** (no `/master/*`): 🟢 verde. Ningún archivo del módulo `intelligence_layer` menciona la ruta prohibida.

## 9 · Incidencias encontradas y resueltas

- El endpoint `/api/v2/company-intelligence/resolve` espera `{"cif":...}` o `{"name":...}`, NO `{"identifier":...}` (schema propio del proveedor · 422 con `identifier`). El proxy Arroba absorbe la divergencia manteniendo el contrato interno canónico.
- El endpoint `/api/v1/financial-intelligence/analyze` cambió su shape a un contenedor `statements.{income_statement, balance_sheet, cashflow, year, basis}` (frente al shape previo B.6.b con estos campos en root). Mapper actualizado con retrocompatibilidad.
- El endpoint devuelve `ratios` como dict `{key: {value, name, category, formula, explanation, source}}` (F0.2) en lugar de `{key: float}` (B.6.b). Mapper aceptando ambos shapes.
- `INTELLIGENCE_COMPANY_V2_ENABLED=true` añadido al `.env` para activar el V2 identity provider en modo real (era el default False).

## 10 · Confirmación reglas F0.2

- ✅ Todos los datos proceden EXCLUSIVAMENTE del Intelligence Engine (`POST /api/v2/company-intelligence/resolve|identity`, `POST /api/v1/financial-intelligence/analyze`).
- ✅ Cero acceso directo al Data Layer.
- ✅ Cero JWT admin ni endpoints internos (`/api/v1/master/*`).
- ✅ Cero mocks Arroba-specific ni datos simulados.
- ✅ Contratos `arroba.v1` y `arroba.v2` (schemas) no modificados.
- ✅ Layout F0.1c aprobado no tocado.
- ✅ COMP F0.1 aprobados (COMP-1001..1005, COMP-1010, COMP-P-0001..0006) no tocados.

## 11 · Backend mode al terminar

- `AGENCY_TOOL_MODE=real` mantiene activo (según Paso 6 del brief).
- `INTELLIGENCE_COMPANY_V2_ENABLED=true` activo (necesario para identity V2 real).
- Backend RUNNING · cache `intelligence_cache` operativo con TTL 24h resolve + 1h financial.

## 12 · Histórico

- v1 · 2026-07-12 · 22:32 UTC · entregable mínimo F0.2 · caso canónico TOTALENERGIES visible en producción.
