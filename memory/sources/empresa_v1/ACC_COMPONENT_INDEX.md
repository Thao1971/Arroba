# ACC · Component Index (canónico F0)

Índice tabular de los **64 componentes** oficialmente declarados en `ACC_v0.1.md` (metadatos `id: COMP-XXXX`). El ACC declara "66 componentes" en su nota de normalización (línea 208 y 246) — la SoT autoritativa por metadatos son 64. Ver §Inconsistencias declaradas por el ACC.

## Convenciones de mapeo

- **Capacidades Agency Tool (endpoints)** — el ACC NO cita endpoints REST literales; cita **motores lógicos** ("Financial Intelligence Engine", "Ownership Engine", "Signal Engine", etc.). Cada motor se ha mapeado 1:N al grupo de paths correspondiente en `arroba.v2.json` según la siguiente tabla:

| Motor lógico ACC | Grupo V2 (paths) |
|---|---|
| Company Entity Engine / Company Intelligence Engine | `/api/v2/company-intelligence/identity` |
| Financial Intelligence Engine / Financial Statements Engine / Ratio Engine | `/api/v1/financial-intelligence/{analyze, ratios/catalog}` |
| Valuation Engine | `/api/v1/financial-intelligence/valuation` |
| Market Intelligence Engine | `/api/v1/semantic-intelligence/*` + `/api/v1/signal-intelligence/{sector, territory}` |
| Comparison Engine | `/api/v1/recommendation-intelligence/comparables` + `/api/v1/semantic-intelligence/similar` |
| Signal Engine | `/api/v1/signal-intelligence/{analyze, catalog, history, opportunities, sector, signal/{id}, territory}` |
| Opportunity Engine | `/api/v1/signal-intelligence/opportunities` + `/api/v1/strategy-intelligence/*` |
| Ranking Engine | ❌ NO existe en V2 |
| Ownership Engine / Knowledge Graph Engine | ❌ NO existe en V2 |
| Governance Engine | ❌ NO existe en V2 |
| Document Engine / Registry Engine | ❌ NO existe en V2 (parcial: `/transaction-intelligence/documents`) |
| Next Best Action Engine | `/api/v1/recommendation-intelligence/{next-action}` (nota: en V2 vive como `transaction-intelligence/next-action`) + `/recommendation-intelligence/explain` |
| Explainability Engine | `/api/v1/recommendation-intelligence/explain` |
| Matching Engine | `/api/v1/recommendation-intelligence/matching` |
| Transaction OS / Workflow Engine | `/api/v1/transaction-intelligence/*` |
| Copilot Context Engine / User Context Engine | Composición interna arroba + `/api/v1/strategy-intelligence/*` |

- **Estado READY / BLOCKED**:
  - **READY**: todos los motores del componente están cubiertos por endpoints existentes en `arroba.v2.json`.
  - **BLOCKED**: al menos un motor requerido NO existe en V2 (Ownership, Governance, Ranking, Document, Registry) o el componente depende de campos derivados sin exposición documentada.

## Tabla maestra (64 componentes)

| # | COMP-ID | Nombre | Sección | Capacidades Agency Tool (endpoints) | Estado | Motivo si BLOCKED | Dependencias |
|---|---|---|---|---|---|---|---|
| 1 | COMP-1001 | Company Identity | Header | `/api/v2/company-intelligence/identity` | READY | | — |
| 2 | COMP-1002 | Company Context | Header | `/api/v2/company-intelligence/identity` | READY | | COMP-1001 |
| 3 | COMP-1003 | Company Public Status | Header | `/api/v2/company-intelligence/identity` (campos derivados: status, following, deal) | READY | | COMP-1001 |
| 4 | COMP-1004 | Company Quick Actions | Header | Identity + acciones internas arroba (create watchlist, download NDA, etc.) | READY | | COMP-1001, COMP-1003 |
| 5 | COMP-1005 | Executive Snapshot | Header | `/api/v2/company-intelligence/identity` + `/api/v1/financial-intelligence/analyze` | READY | | COMP-1001, COMP-2001 |
| 6 | COMP-1010 | User Relationship | Header | ❌ Following / Alerts / Watchlists NO son capacidades de Agency Tool | BLOCKED | Data interna arroba (fuera del contrato V2). Requiere backend arroba dedicado. | COMP-1001 |
| 7 | COMP-2001 | Executive Metrics | Executive Vista | `/api/v1/financial-intelligence/analyze` + `/api/v1/financial-intelligence/valuation` + `/api/v1/semantic-intelligence/profile` | READY | | COMP-1001, Finanzas ready |
| 8 | COMP-2002 | Arroba Copilot | Executive Vista | Composición `/api/v1/strategy-intelligence/*` + `/api/v1/transaction-intelligence/*` + `/api/v1/recommendation-intelligence/*` | READY | | Transversal — no bloquea F0 |
| 9 | COMP-2003 | Next Step Panel | Executive Vista | `/api/v1/recommendation-intelligence/next-action` (nota: en V2 vive como `transaction-intelligence/next-action`) + `/recommendation-intelligence/explain` | READY | | COMP-2001 |
| 10 | COMP-3001 | Financial Workspace | Finanzas | Contenedor (delegates) | READY | | Todos los COMP-3xxx |
| 11 | COMP-3002 | Financial Intelligence | Financial Workspace | `/api/v1/financial-intelligence/analyze` | READY | | COMP-3001 |
| 12 | COMP-3003 | Income Statement | Financial Workspace | `/api/v1/financial-intelligence/analyze` (bloque `income_statement`) | READY | | COMP-3001 |
| 13 | COMP-3004 | Balance Sheet | Financial Workspace | `/api/v1/financial-intelligence/analyze` (bloque `balance_sheet`) | READY | | COMP-3001 |
| 14 | COMP-3005 | Cash Flow | Financial Workspace | `/api/v1/financial-intelligence/analyze` (bloque `cash_flow`) | **BLOCKED** | El schema de `/analyze` en V2 no expone bloque `cash_flow` documentado. Requiere ampliación del contrato o cálculo indirecto. | COMP-3001 |
| 15 | COMP-3006 | Financial Ratios | Financial Workspace | `/api/v1/financial-intelligence/analyze` + `/api/v1/financial-intelligence/ratios/catalog` | READY | | COMP-3001 |
| 16 | COMP-3007 | Period Selector | Financial Workspace | Coordinador (deriva años de `/analyze.years`) | READY | | COMP-3001 |
| 17 | COMP-4001 | Valuation Section | Valoración | `/api/v1/financial-intelligence/valuation` + `/api/v2/company-intelligence/identity` | READY | | COMP-3xxx |
| 18 | COMP-0008 | Connected Intelligence | Valoración (fuera de rango) | Composición `/api/v1/semantic-intelligence/similar` + `/api/v1/signal-intelligence/*` + `/api/v1/recommendation-intelligence/explain` | READY | | Transversal |
| 19 | COMP-4002 | Valuation Intelligence | Valoración | `/api/v1/financial-intelligence/valuation` + `/api/v1/semantic-intelligence/*` + `/api/v1/signal-intelligence/sector` | READY | | COMP-4001 |
| 20 | COMP-4003 | Valuation Summary | Valoración | `/api/v1/financial-intelligence/valuation` (EV, equity, range) | READY | | COMP-4001 |
| 21 | COMP-4004 | Valuation Methods | Valoración | `/api/v1/financial-intelligence/valuation` (methods array) | READY | | COMP-4001 |
| 22 | COMP-4005 | Enterprise Value Bridge | Valoración | `/api/v1/financial-intelligence/valuation` (campos derivados `bridge_components`) | **BLOCKED** | El schema de `/valuation` puede no exponer bloque `bridge_components` estructurado. Requiere confirmación del backend V2. | COMP-4001 |
| 23 | COMP-4006 | Valuation Scenarios | Valoración | `/api/v1/financial-intelligence/valuation` con inputs alternativos (múltiples llamadas) | **BLOCKED** | Requiere endpoint `/valuation/scenarios` dedicado o múltiples llamadas parametrizadas cuya semántica no está declarada en V2. | COMP-4001 |
| 24 | COMP-4007 | Sensitivity Analysis | Valoración | `/api/v1/financial-intelligence/valuation` (matriz de sensibilidad) | **BLOCKED** | Análisis de sensibilidad no está documentado como capacidad V2. | COMP-4001 |
| 25 | COMP-5001 | Ownership Section | Propiedad | ❌ **Ownership Engine** | **BLOCKED** | Ownership Engine no existe en V2. Todos los COMP-5xxx quedan bloqueados hasta ampliación del contrato. | — |
| 26 | COMP-5002 | Ownership Intelligence | Propiedad | ❌ Ownership Intelligence Engine | **BLOCKED** | idem | COMP-5001 |
| 27 | COMP-5003 | Ownership Overview | Propiedad | ❌ Ownership Engine | **BLOCKED** | idem | COMP-5001 |
| 28 | COMP-5004 | Shareholders | Propiedad | ❌ Ownership Engine | **BLOCKED** | idem | COMP-5001 |
| 29 | COMP-5005 | Corporate Group | Propiedad | ❌ Ownership Engine (grupos + participadas) | **BLOCKED** | idem | COMP-5001 |
| 30 | COMP-5006 | Ownership Network | Propiedad | ❌ Ownership Engine + Knowledge Graph Engine | **BLOCKED** | Knowledge Graph Engine no existe en V2 (roadmap PENDING). | COMP-5001 |
| 31 | COMP-6001 | Governance Section | Gobierno | ❌ **Governance Engine** | **BLOCKED** | Governance Engine no existe en V2. Todos los COMP-6xxx bloqueados. | — |
| 32 | COMP-6002 | Governance Intelligence | Gobierno | ❌ Governance Intelligence Engine | **BLOCKED** | idem | COMP-6001 |
| 33 | COMP-6003 | Governance Overview | Gobierno | ❌ Governance Engine | **BLOCKED** | idem | COMP-6001 |
| 34 | COMP-6004 | Board Members | Gobierno | ❌ Governance Engine | **BLOCKED** | idem | COMP-6001 |
| 35 | COMP-6005 | Executives | Gobierno | ❌ Governance Engine | **BLOCKED** | idem | COMP-6001 |
| 36 | COMP-6006 | Legal Representatives | Gobierno | ❌ Governance Engine | **BLOCKED** | idem | COMP-6001 |
| 37 | COMP-6007 | Governance Timeline | Gobierno | ❌ Governance Engine (histórico + eventos BORME) | **BLOCKED** | idem | COMP-6001 |
| 38 | COMP-7001 | Market Section | Mercado | `/api/v1/semantic-intelligence/*` + `/api/v1/signal-intelligence/sector` | READY | | — |
| 39 | COMP-7002 | Market Intelligence | Mercado | `/api/v1/semantic-intelligence/profile` + `/api/v1/signal-intelligence/sector` + `/api/v1/strategy-intelligence/thesis` | READY | | COMP-7001 |
| 40 | COMP-7003 | Market Overview | Mercado | `/api/v1/semantic-intelligence/profile` + `/api/v1/signal-intelligence/sector` | READY | | COMP-7001 |
| 41 | COMP-7004 | Market Size & Structure | Mercado | `/api/v1/signal-intelligence/sector` + `/api/v1/signal-intelligence/territory` | READY | | COMP-7001 |
| 42 | COMP-7005 | Market Trends | Mercado | `/api/v1/signal-intelligence/sector` + `/api/v1/signal-intelligence/history` | READY | | COMP-7001 |
| 43 | COMP-7006 | Market Positioning | Mercado | `/api/v1/semantic-intelligence/similar` + `/api/v1/recommendation-intelligence/comparables` | READY | | COMP-7001 |
| 44 | COMP-7007 | Market Risks & Opportunities | Mercado | `/api/v1/signal-intelligence/opportunities` + `/api/v1/strategy-intelligence/risk` | READY | | COMP-7001 |
| 45 | COMP-8001 | Rankings Section | Rankings | ❌ **Ranking Engine** | **BLOCKED** | Ranking Engine no existe explícito en V2. Derivable parcialmente vía `/recommendation-intelligence/comparables` + percentiles, pero requiere semántica de ranking dedicada. | — |
| 46 | COMP-8002 | Ranking Cards | Rankings | ❌ Ranking Engine | **BLOCKED** | idem | COMP-8001 |
| 47 | COMP-9001 | Comparison Universe | Comparativa | `/api/v1/recommendation-intelligence/comparables` + `/api/v1/semantic-intelligence/similar` | READY | | — |
| 48 | COMP-9002 | Executive Comparison | Comparativa | `/api/v1/recommendation-intelligence/comparables` (KPIs agregados) | READY | | COMP-9001 |
| 49 | COMP-9003 | Competitive Positioning | Comparativa | `/api/v1/recommendation-intelligence/comparables` + `/api/v1/semantic-intelligence/similar` | READY | | COMP-9001 |
| 50 | COMP-9004 | Opportunity Map | Comparativa | `/api/v1/signal-intelligence/opportunities` + `/api/v1/recommendation-intelligence/comparables` | READY | | COMP-9001 |
| 51 | COMP-9005 | Competitive Gaps | Comparativa | `/api/v1/recommendation-intelligence/comparables` + `/api/v1/recommendation-intelligence/explain` | READY | | COMP-9001 |
| 52 | COMP-9006 | Competitive Difference Matrix | Comparativa | `/api/v1/recommendation-intelligence/comparables` (matrix) | READY | | COMP-9001 |
| 53 | COMP-9007 | Financial Comparison | Comparativa | `/api/v1/financial-intelligence/analyze` + `/api/v1/recommendation-intelligence/comparables` | READY | | COMP-3xxx, COMP-9001 |
| 54 | COMP-10001 | Signals Section | Señales | `/api/v1/signal-intelligence/analyze` + `/api/v1/signal-intelligence/catalog` | READY | | — |
| 55 | COMP-10002 | Signals Timeline | Señales | `/api/v1/signal-intelligence/history` + `/api/v1/signal-intelligence/signal/{signal_id}` | READY | | COMP-10001 |
| 56 | COMP-11001 | Opportunities Section | Oportunidades | `/api/v1/signal-intelligence/opportunities` + `/api/v1/strategy-intelligence/thesis` + `/api/v1/strategy-intelligence/scenarios` | READY | | COMP-10xxx recommended |
| 57 | COMP-12001 | Sources Section | Fuentes | ❌ Document Engine + Registry Engine | **BLOCKED** | Ninguno de los dos motores está expuesto en V2. Parcial: `/transaction-intelligence/documents` cubre docs transaccionales, no fuentes canónicas de la ficha. | — |
| 58 | COMP-12002 | Corporate Registry Events | Registros Públicos | ❌ Registry Engine (BORME events) | **BLOCKED** | Registry Engine no existe en V2. | COMP-12001 |
| 59 | COMP-12003 | Annual Accounts Registry | Registros Públicos | ❌ Registry Engine (cuentas depositadas) | **BLOCKED** | Registry Engine no existe en V2. | COMP-12001 |
| 60 | COMP-12004 | Registry Information | Registros Públicos | ❌ Registry Engine | **BLOCKED** | idem | COMP-12001 |
| 61 | COMP-12005 | Documents Section | Documentos | ❌ Document Engine | **BLOCKED** | Document Engine dedicado no existe en V2 (existe `/transaction-intelligence/documents` con semántica transaccional distinta). | COMP-12001 |
| 62 | COMP-13001 | Next Best Actions | Intelligence | `/api/v1/recommendation-intelligence/next-action` (nota: en V2 el path vive bajo `transaction-intelligence/next-action`) + `/api/v1/recommendation-intelligence/matching` + `/api/v1/recommendation-intelligence/explain` | READY | | Composición transversal |
| 63 | COMP-13002 | Recommendation Explainability | Intelligence | `/api/v1/recommendation-intelligence/explain` | READY | | COMP-13001 |
| 64 | COMP-13003 | Recommendation Prioritization | Intelligence | `/api/v1/recommendation-intelligence/matching` + `/api/v1/recommendation-intelligence/next-action` | READY | | COMP-13001 |

## Distribución por sección

| Sección | Total | READY | BLOCKED |
|---|---|---|---|
| Header (Capítulo 4) | 6 | 5 | 1 (COMP-1010) |
| Executive Vista (Capítulo 5) | 3 | 3 | 0 |
| Finanzas (Capítulo 6) | 7 | 6 | 1 (COMP-3005 Cash Flow) |
| Valoración (Capítulo 7) | 8 | 5 | 3 (COMP-4005, 4006, 4007) |
| Propiedad (Capítulo 8) | 6 | 0 | 6 (todo) |
| Gobierno (Capítulo 9) | 7 | 0 | 7 (todo) |
| Mercado (Capítulo 10) | 7 | 7 | 0 |
| Rankings (Capítulo 11) | 2 | 0 | 2 (todo) |
| Comparativa (Capítulo 12) | 7 | 7 | 0 |
| Señales (Capítulo 13) | 2 | 2 | 0 |
| Oportunidades (Capítulo 14) | 1 | 1 | 0 |
| Registros + Documentos (Capítulo 15) | 5 | 0 | 5 (todo) |
| Next Best Actions (Capítulo 16) | 3 | 3 | 0 |
| **TOTAL** | **64** | **39 (60,9 %)** | **25 (39,1 %)** |

## Inconsistencias declaradas por el ACC

Textualmente reproducidas de `ACC_v0.1.md · Notas de normalización` (líneas 225-248):

- **Numeración de capítulos**. El Índice declara 23 capítulos (0 a 22), incluyendo "6. Perfil" y "7. Finanzas" como capítulos separados. Sin embargo, en el cuerpo del documento nunca aparece un capítulo con título "6. Perfil": el contenido bajo el prefijo `6.x` corresponde en realidad a componentes de Finanzas (serie COMP-3xxx, rango 3000), y el contenido bajo `7.x` corresponde a Valoración (serie COMP-4xxx, rango 4000). **Recomendación**: el equipo de producto debe confirmar si "Perfil" es un capítulo pendiente de escribir o si el Índice necesita renumerarse.

- **`COMP-9003` tiene dos títulos consecutivos**. En el capítulo 12 (Comparativa) aparecen dos encabezados seguidos con el mismo código y número (`12.3 COMP-9003`): uno como "Comparable Companies" y, justo debajo, el mismo id como "Competitive Positioning". Todo indica que "Comparable Companies" es un título anterior no eliminado tras un renombramiento; el nombre vigente según el frontmatter es **Competitive Positioning**.

- **`COMP-0008` no sigue el rango numérico de su capítulo**. Aparece dentro del capítulo de Valoración (rango 4000) con un id fuera de esa serie (`COMP-0008 — Connected Intelligence`), a diferencia del resto de componentes de ese capítulo (`COMP-4001`...`COMP-4007`).

- **Un `status: Draft` aislado**. De los 66 bloques de metadatos, 65 declaran `status: Approved` y uno `status: Draft` (COMP-2001 Executive Metrics — verificado por grep).

- **Recuento 64 vs 66 declarado**. El ACC afirma "66 componentes" en dos puntos de la nota de normalización (L208 y L246), pero la SoT autoritativa (`grep '^id: COMP-'`) devuelve **64** IDs únicos. Discrepancia numerativa +2. Se documenta también en `CONTRADICTIONS.md`.
