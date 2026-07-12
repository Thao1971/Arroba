# F0_2_PLAN.md — Planificación completa del Sprint F0.2 · Finanzas

Estado: **BLOQUEADO por dependencia externa** desde 2026-07-06.
Motivo: Agency Tool Master Layer vacío (ver `F0_2_UNBLOCK_CHECKLIST.md`).
Documento activado únicamente cuando el checklist esté 100% verde.

Este documento contiene la planificación completa de F0.2 para que la reanudación sea inmediata en cuanto Agency Tool disponga de datos reales trazables. **Ni una línea de código de producción se escribe hasta el desbloqueo.**

---

## 1 · Objetivo (transcripción canónica del brief del usuario)

> Construir el apartado Finanzas sobre el layout canónico F0.1c. Cero fricción con `CompanyFichaLayout`, `CompanyTopbar`, `CompanyHeaderBlock`, `CompanySectionNav`, `CompanyDealPanel`. Cero herencia del layout legacy.

Aplican en todo momento:

- **R11 · Visual Governance**: el ZIP (`ce-finanzas.jsx`) es la única aprobación visual.
- **R13 · Source of Truth única**: el layout F0.1c es el shell inmutable.
- **R14 · 1 COMP = 1 componente React**: cada `COMP-3001..3007` corresponde a un componente independiente con `@componentId` en JSDoc.
- **R15 · Datos reales o Unavailable**: sin ejercicios ilustrativos, sin interpolación, sin estimaciones, sin narrativa Copilot sin source-grounding contra Agency Tool.

---

## 2 · Alcance funcional · 4 bloques × 3 niveles (enumeración literal del usuario)

### Bloque A · Cuenta de Resultados

**Categorías canónicas (Nivel 2 · orden literal)**:
1. Ingresos
2. Aprovisionamientos
3. Gastos de personal
4. Otros gastos
5. EBITDA
6. EBIT
7. Beneficio

### Bloque B · Balance

**Categorías canónicas (Nivel 2 · orden literal)**:
1. Activo no corriente
2. Activo corriente
3. Patrimonio Neto
4. Pasivo no corriente
5. Pasivo corriente

### Bloque C · Cash Flow

**Categorías canónicas (Nivel 2 · orden literal)**:
1. Operación
2. Inversión
3. Financiación

Estado ACC vigente: **BLOCKED (COMP-3005)**. Se mantiene el bloque completo en `UnavailableBlock` respetando la geometría del ZIP hasta que Agency Tool V2 exponga el shape `cash_flow` documentado. La geometría (ancho, alto, posición) sigue el ZIP para no dejar hueco visual.

### Bloque D · Ratios

**Categorías canónicas (Nivel 2 · orden literal)**:
1. Rentabilidad
2. Liquidez
3. Solvencia
4. Endeudamiento
5. Eficiencia

### Niveles (aplican a los 4 bloques)

- **Nivel 1 · Ejecutivo** (< 1 min): gráficos principales, KPIs clave, conclusiones de Arroba Copilot (source-grounded), señales financieras (si aplica), alertas / anomalías.
- **Nivel 2 · Categorías**: las agrupaciones canónicas enumeradas arriba, exactamente en ese orden.
- **Nivel 3 · Detalle**: todas las partidas disponibles procedentes del Agency Tool. Sin resumir, sin agrupar artificialmente, sin inventar "Otros" que no exista en la fuente. Si una partida no viene → no aparece.

---

## 3 · Mapa COMP-ID → endpoint V2 → componente React → nivel

Los `path` React son **tentativos** y sólo se materializan en el desbloqueo. Se listan aquí para trazabilidad y para que el guard R14 esté preparado.

| COMP-ID | Nombre canónico | Path React previsto | Endpoint V2 consumido | Campos leídos (tentativo) | Niveles donde aparece |
|---|---|---|---|---|---|
| COMP-3001 | Financial Overview | `components/company/finanzas/FinancialOverview.tsx` | `POST /api/v1/financial-intelligence/analyze` | `evolution.years[]`, `evolution.series[]` (revenue, ebitda, net_income), `data_coverage`, `metadata.source`, `metadata.updated_at` | **N1** (agregado ejecutivo · 4-6 KPIs + chart trend) |
| COMP-3002 | Income Statement (Cuenta de Resultados) | `components/company/finanzas/IncomeStatement.tsx` | `POST /api/v1/financial-intelligence/analyze` (`income_statement`) | Todas las partidas del income statement por ejercicio (`fiscal_year`, `revenue`, `procurement`, `personnel_expenses`, `other_expenses`, `ebitda`, `ebit`, `net_income`, resto disponible en respuesta) | **N1** (chart 3-5 años + KPIs) · **N2** (tabla 7 categorías × N años) · **N3** (todas las partidas raw sin agrupar) |
| COMP-3003 | Balance Sheet | `components/company/finanzas/BalanceSheet.tsx` | `POST /api/v1/financial-intelligence/analyze` (`balance_sheet`) | `assets.non_current`, `assets.current`, `equity`, `liabilities.non_current`, `liabilities.current`, resto disponible | **N1** (chart estructura + KPIs) · **N2** (tabla 5 categorías × N años) · **N3** (todas las partidas raw del balance) |
| COMP-3004 | Ratios | `components/company/finanzas/RatiosBlock.tsx` | `POST /api/v1/financial-intelligence/analyze` (`ratios`) | Cada ratio con `key`, `value`, `year`, `category` ∈ {rentabilidad, liquidez, solvencia, endeudamiento, eficiencia} | **N1** (chips destacados por categoría · sólo si viene explícito) · **N2** (tabla 5 categorías × ratios canónicos) · **N3** (todos los ratios entregados por V2) |
| **COMP-3005** | **Cash Flow** | `components/company/finanzas/CashFlow.tsx` | ❌ **No expuesto V2** | — | **N1/N2/N3 → BLOCKED · stub `UnavailableBlock`** con geometría idéntica al ZIP. Motivo: capacidad Agency Tool V2 no documentada. |
| COMP-3006 | Financial Trends / Evolution | `components/company/finanzas/FinancialTrends.tsx` | `POST /api/v1/financial-intelligence/analyze` (`evolution` + `trends`) | Series completas por serie (revenue, ebitda, net_income, working_capital…), `cagr` si viene explícito | **N1** (chart evolución agregado) · **N2** (subseries por categoría) — si sólo hay N ejercicios reales, se pintan sólo esos N |
| COMP-3007 | Financial Anomalies | `components/company/finanzas/FinancialAnomalies.tsx` | `POST /api/v1/financial-intelligence/analyze` (`anomalies`) **+** opcional `POST /api/v1/signal-intelligence/analyze` (financial signals) | `anomalies[].year`, `.severity`, `.type`, `.description`, `.source` | **N1** (alertas card con top-3 anomalías) · **N2/N3** (lista completa con severidad) |

### COMP-P provisionales que probablemente emerjan (registrar en `PROVISIONAL_COMPONENTS.md` al implementar)

Reservados por si el ZIP `ce-finanzas.jsx` expone sub-bloques sin COMP-ID en ACC v0.1:

| COMP-P | Slot potencial | Motivo provisional |
|---|---|---|
| COMP-P-1001 | Slot "Vista comparativa histórica" del ZIP | Sub-bloque no listado en el capítulo 6 del ACC. |
| COMP-P-1002 | Slot "Notas de auditoría" | ACC no expone el sub-bloque en el capítulo 6. |
| COMP-P-1003 | Slot "Comentarios ejecutivos" (fila superior de Finanzas) | Cabecera narrativa del ZIP. |

(Los COMP-P finales se asignan sólo cuando el componente exista.)

---

## 4 · Slots de interpretación · Arroba Copilot

**Regla R15 aplicada literalmente**: la narrativa Copilot en Finanzas se alimenta **exclusivamente** de campos que Agency Tool V2 ya provee. Si un slot no tiene fuente V2 conocida, se marca `UnavailableBlock` con motivo "Interpretación pendiente de capacidad V2".

| Slot Copilot | Bloque host | Fuente V2 esperada | Comportamiento sin fuente |
|---|---|---|---|
| Copilot · Overview | COMP-3001 · Financial Overview (N1) | `analyze.executive_summary` (si el schema V2 lo expone) o combinación `signals[]` + `anomalies[]` con textos textuales de V2 | `UnavailableBlock`: "Interpretación pendiente · capacidad Agency Tool no documentada" |
| Copilot · Cuenta de Resultados | COMP-3002 · Income Statement (N1) | `analyze.income_statement.notes[]` o `analyze.narrative.income_statement` si viene | `UnavailableBlock` con el mismo motivo |
| Copilot · Balance | COMP-3003 · Balance Sheet (N1) | `analyze.balance_sheet.notes[]` o narrativa equivalente V2 | `UnavailableBlock` |
| Copilot · Ratios | COMP-3004 · Ratios (N1) | `analyze.ratios.notes[]` · `recommendation_intelligence` con targeting explícito financiero | `UnavailableBlock` |
| Copilot · Cash Flow | COMP-3005 · Cash Flow (N1) | — (bloque completo BLOCKED) | Absorbido por el stub del propio COMP-3005 |
| Copilot · Anomalías | COMP-3007 · Financial Anomalies (N1) | `anomalies[].description` viene poblado por V2 · no requiere generación adicional | Se muestra 1:1 el texto de `anomalies[i].description` |

Reglas negativas (bloquean cualquier improvisación):
- **Prohibido** enviar prompt a EMERGENT_LLM_KEY para generar narrativa Copilot sin dato subyacente V2.
- **Prohibido** redactar frases genéricas "que suenan a Copilot" si no hay fuente V2 auditable.
- Cualquier necesidad de LLM propio se escala al usuario ANTES de implementarla.

---

## 5 · Ubicación en el layout F0.1c

- Ruta única: `/es/empresa-f01/[cif]` con `CompanySectionNav.section === 'finanzas'`.
- Slot: `content column` del `CompanyFichaLayout` (columna central 678 px).
- Trigger: click en `[data-testid="section-nav-item-finanzas"]` cambia `section` local a `'finanzas'`.
- Cuando `section === 'finanzas'`, en lugar del actual `SectionPlaceholder`, el content column renderiza `<CompanyFinanzas ...>` (nuevo orquestador · sin COMP-ID · contenedor de layout).
- **Cero cambios** en `CompanyTopbar`, `CompanyHeaderBlock`, `CompanyDealBanner`, `CompanySectionNav`, `CompanyDealPanel`, `CompanyComposerStub`, `CompanyOpportunityRow`.
- La `CompanySectionNav` ya marca el item activo con pill roja (funcional desde F0.1b).

---

## 6 · Estrategia de degradación (R15)

Los 3 estados obligatorios se manejan explícitamente en cada COMP:

| Estado | Trigger | Comportamiento UI |
|---|---|---|
| **Completo** | `evolution.years.length ≥ N` y todas las series pobladas | Renderiza normalmente: chart + tabla + KPIs. |
| **Parcial** | Faltan ejercicios (ej. sólo 2021, 2022 · falta 2020, 2023) | Renderiza sólo los ejercicios disponibles. Cada año ausente lleva chip "Sin datos para 20XX" con Tooltip apuntando a `metadata.source`. **Nunca** se interpola. |
| **Vacío** | `evolution.years == []` o el endpoint devuelve `MasterNotFound` | El COMP entero degrada a `UnavailableBlock` con motivo "Sin ejercicios disponibles en la fuente" + Tooltip "Última verificación: `metadata.updated_at ?? '—'`". |

Para el bloque Finanzas completo:
- Si TODOS los COMP-3001..3007 caen a vacío → sección Finanzas muestra un único `UnavailableBlock` full-height con motivo "Sin datos financieros disponibles en Agency Tool para esta empresa" + botón "Volver al Resumen".

---

## 7 · Contratos canónicos internos (schema documental · sin implementación)

Los adaptadores del `intelligence_layer` mapearán la respuesta cruda V2 a estos contratos canónicos internos. Se mantiene P3 (Zero Coupling): la UI NUNCA consume el shape crudo.

### 7.1 · `arroba-financial-overview-v1` (extensión del ya existente `FinancialSection`)

```
{
  metadata: { source, source_url?, updated_at, engine_version, confidence? },
  evolution: {
    years: number[],                     // sólo ejercicios REALES (R15)
    series: [
      { key, label, unit, values: number[] }   // longitud === years.length
    ]
  },
  kpis?: [{ key, label, value, unit, year, delta_yoy?, source_url? }],
  data_coverage: { [field]: bool }
}
```

### 7.2 · `arroba-income-statement-v1`

```
{
  metadata: { source, source_url?, updated_at, engine_version },
  years: number[],                        // sólo ejercicios reales
  categories: [                           // orden canónico · 7 items literales
    { key: "ingresos" | "aprovisionamientos" | "gastos_personal" | "otros_gastos"
         | "ebitda" | "ebit" | "beneficio",
      label,
      values: number[],
      values_by_line?: [                  // detalle N3 (todas las partidas raw sin agrupar)
        { line_key, line_label, values: number[] }
      ],
      source_url? }
  ],
  narrative?: { type: "note" | "highlight", text, source }[],
  data_coverage: { [field]: bool }
}
```

### 7.3 · `arroba-balance-v1`

```
{
  metadata: { source, source_url?, updated_at, engine_version },
  years: number[],
  categories: [                           // orden canónico · 5 items literales
    { key: "activo_no_corriente" | "activo_corriente" | "patrimonio_neto"
         | "pasivo_no_corriente" | "pasivo_corriente",
      label,
      values: number[],
      values_by_line?: [ ... ]
      source_url? }
  ],
  narrative?: [{ text, source }],
  data_coverage: { [field]: bool }
}
```

### 7.4 · `arroba-cashflow-v1` (documento reservado · Cash Flow BLOCKED)

Definido documentalmente para preparar el terreno. Estructura tentativa:

```
{
  metadata: { source, source_url?, updated_at, engine_version },
  years: number[],
  categories: [                           // orden canónico · 3 items literales
    { key: "operacion" | "inversion" | "financiacion",
      label,
      values: number[],
      values_by_line?: [ ... ] }
  ],
  data_coverage: { [field]: bool }
}
```

Sólo se activa cuando Agency Tool V2 exponga `cash_flow`. Hasta entonces el COMP-3005 renderiza `UnavailableBlock`.

### 7.5 · `arroba-ratios-v1`

```
{
  metadata: { source, source_url?, updated_at, engine_version },
  years: number[],
  categories: [                           // orden canónico · 5 items literales
    { key: "rentabilidad" | "liquidez" | "solvencia" | "endeudamiento" | "eficiencia",
      label,
      ratios: [
        { key, label, values: number[], unit: "%" | "x" | "€" | null,
          benchmark?, source_url? }
      ] }
  ],
  data_coverage: { [field]: bool }
}
```

### 7.6 · `arroba-financial-anomalies-v1`

```
{
  metadata: { source, source_url?, updated_at, engine_version },
  anomalies: [
    { year, severity: "info" | "warning" | "critical",
      type, description, source_url? }
  ]
}
```

Todos los campos `source`, `source_url`, `updated_at` deben propagarse SIN transformar desde el proveedor hasta el DOM (P3 + R15).

---

## 8 · Tests planeados

Se documentan aquí para preparación; no se implementan hasta el desbloqueo.

### Backend (pytest)

- `test_finanzas_income_statement_adapter.py`: mapping V2 → `arroba-income-statement-v1` (fixtures con 3 escenarios: completo · parcial · vacío).
- `test_finanzas_balance_adapter.py`: idem para `arroba-balance-v1`.
- `test_finanzas_ratios_adapter.py`: idem para `arroba-ratios-v1`.
- `test_finanzas_anomalies_adapter.py`: idem para `arroba-financial-anomalies-v1`.
- `test_finanzas_cashflow_stub.py`: verifica que el endpoint devuelve `UnavailableBlock`-shaped stub cuando Cash Flow no está expuesto.
- `test_r15_no_interpolation.py`: fixture con series parciales (2021, 2023) → verificar que el adaptador NO rellena 2022.
- `test_r15_source_propagation.py`: cada campo mostrable en la UI tiene `source` y `updated_at` no vacíos.

### Frontend (vitest)

- `CompanyFinanzas.test.tsx`: orquestador renderiza los 7 COMP en orden.
- `IncomeStatement.test.tsx`: 3 escenarios (completo · parcial · vacío) + presencia de Tooltip source/updated_at.
- `BalanceSheet.test.tsx`, `RatiosBlock.test.tsx`, `FinancialAnomalies.test.tsx`, `FinancialTrends.test.tsx`, `FinancialOverview.test.tsx`: análogos.
- `CashFlow.test.tsx`: verifica `UnavailableBlock` con motivo `capacidad V2 pendiente` + COMP-3005 declarado.
- `r14_comp_id_declaration_guard.test.ts`: se extiende para verificar que `components/company/finanzas/` cumple 1 COMP = 1 componente.
- Guard R13 sigue verde (no se toca layout global).

### Verificación visual

- Overlay pixel-diff contra `ce-finanzas.jsx` renderizado del ZIP. Objetivo Δh ≤ ±2 px por bloque, geometría idéntica en placeholders.
- Screenshots en `sources/empresa_v1/F0_2_REFERENCE/` (`zip_finanzas_*.png` + `impl_finanzas_*.png`).
- Exposición en `/public/qa/f0_2/` (mismo patrón que F0.1c).

---

## 9 · Precondiciones de arranque

Todas las precondiciones deben estar en verde antes de escribir código. La lista se sigue en `F0_2_UNBLOCK_CHECKLIST.md`.

## Historial

- v1 · 2026-07-06 · creación durante la pausa oficial de F0.2 tras confirmar que Agency Tool Master Layer está vacío.
