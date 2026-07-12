# Sprint F0 · Plan de sub-sprints — Ficha de Empresa

Reconstrucción de la Ficha de Empresa bajo las nuevas SoT canónicas ingeridas el 2026-07-06:
- **SoT visual**: `sources/empresa_v1/empresa_html/` (ZIP oficial)
- **SoT funcional**: `sources/empresa_v1/ACC_v0.1.md` (64 componentes)
- **SoT contrato**: `sources/empresa_v1/ARROBA_V2_INTEGRATION_GUIDE.md` + `arroba.v2.json` (54 endpoints V2)

Reglas transversales (aplicables a todos los sub-sprints):
- **R13** · una única SoT por pantalla. Los mockups previos (`CanonicalEntityMockupClient.tsx`, `CompanyPageClient.tsx` legacy) se retiran cuando arranque el sub-sprint que sustituye su alcance.
- **R14** · un COMP = un componente React. Todo componente declara su `COMP-ID` en JSDoc cabecera.
- **P1** Explainability First · toda inteligencia con Tooltip explicativo.
- **P2** Intelligence over Data · UI prioriza inteligencia sobre datos.
- **P3** Zero Coupling · contratos canónicos `arroba-*-v1`. Zero coupling FE↔V2 externo.
- **R11** · el ZIP oficial constituye aprobación visual explícita; NO requiere lift adicional siempre que la implementación reproduzca fielmente el ZIP.
- **R12** · nunca `/master/*`.
- **BLOCKED components → `UnavailableBlock` con COMP-ID declarado**, nunca oculto ni simulado.

---

## F0.1 · Header + Perfil

**Orden solicitado por el usuario**: 1 · Header · 2 · Perfil.

**COMP-IDs incluidos**:
- **Header** (6 componentes)
  - COMP-1001 · Company Identity · READY
  - COMP-1002 · Company Context · READY
  - COMP-1003 · Company Public Status · READY
  - COMP-1004 · Company Quick Actions · READY (con reserva C14.5 · ver contradicciones)
  - COMP-1005 · Executive Snapshot · READY
  - COMP-1010 · User Relationship · **BLOCKED** (data interna arroba fuera de V2) → stub `UnavailableBlock`
- **Perfil (Resumen)** — reconstrucción visual del bloque "Resumen" del ZIP (`ce-sections1.jsx`). El ACC declara "6. Perfil" en su Índice pero no expone COMP-IDs específicos para "Perfil" en el cuerpo. **Requiere validación C2 antes de arrancar.**

**Endpoints Agency Tool V2 necesarios**:
- `POST /api/v2/company-intelligence/identity` (todo el Header · READY)
- `POST /api/v1/financial-intelligence/analyze` (COMP-1005 Executive Snapshot)
- `POST /api/v1/semantic-intelligence/profile` (Perfil / Resumen)

**Cobertura READY / BLOCKED**:
- READY: 5 componentes Header + Perfil visual.
- BLOCKED: 1 componente Header (COMP-1010 User Relationship → stub).

**Contradicciones ZIP↔ACC pendientes de validación**:
- **C2** (Perfil vs capítulo 6 Finanzas en el Índice ACC) — media · **requiere validación humana antes de arrancar**.
- **C14.5** (acciones sensibles COMP-1004: Descargar NDA, Contactar, etc.) — alta · **requiere validación humana**.
- **C14.2** (créditos consumidos por acciones sensibles) — alta · si aplica a acciones del Header.

**Dependencias con sub-sprints anteriores**: ninguna. F0.1 es el punto de arranque.

**Regla de detención selectiva aplicable**: si aparece contradicción en un componente concreto (ej. COMP-1004 pendiente por C14.5), stub `UnavailableBlock` y seguir con el resto.

**Entregable clave**: brief detallado en `SPRINT_F0_1_BRIEF.md`.

---

## F0.2 · Finanzas

**COMP-IDs incluidos** (7 componentes · Capítulo 6):
- COMP-3001 · Financial Workspace · READY (contenedor)
- COMP-3002 · Financial Intelligence · READY
- COMP-3003 · Income Statement · READY
- COMP-3004 · Balance Sheet · READY
- COMP-3005 · Cash Flow · **BLOCKED** (schema V2 no expone `cash_flow`) → stub
- COMP-3006 · Financial Ratios · READY
- COMP-3007 · Period Selector · READY

**Endpoints V2 necesarios**:
- `POST /api/v1/financial-intelligence/analyze` (income + balance + ratios)
- `GET /api/v1/financial-intelligence/ratios/catalog`

**Cobertura**: READY 6/7 · BLOCKED 1 (COMP-3005 Cash Flow → stub).

**Contradicciones**: C14.4 (histórico 2020-2023 real vs ilustrativo) — alta · requiere confirmación del endpoint que trae la serie histórica.

**Dependencias**: F0.1 (Header identidad).

---

## F0.3 · Valoración

**COMP-IDs incluidos** (8 componentes · Capítulo 7 · incluye COMP-0008 fuera de rango):
- COMP-4001 · Valuation Section · READY
- COMP-0008 · Connected Intelligence · READY (composición semantic+signal+recommendation)
- COMP-4002 · Valuation Intelligence · READY
- COMP-4003 · Valuation Summary · READY
- COMP-4004 · Valuation Methods · READY
- COMP-4005 · Enterprise Value Bridge · **BLOCKED** (schema `/valuation` sin `bridge_components` documentado) → stub
- COMP-4006 · Valuation Scenarios · **BLOCKED** (sin endpoint `/valuation/scenarios`) → stub
- COMP-4007 · Sensitivity Analysis · **BLOCKED** (matriz sin documentar) → stub

**Endpoints V2 necesarios**:
- `POST /api/v1/financial-intelligence/valuation`
- `POST /api/v1/semantic-intelligence/similar`
- `POST /api/v1/signal-intelligence/analyze`
- `POST /api/v1/recommendation-intelligence/explain`

**Cobertura**: READY 5/8 · BLOCKED 3 (valoración avanzada → stubs).

**Contradicciones**: C5 (COMP-0008 fuera de rango), C11 (avanzados no visibles en ZIP). Ambos baja/media.

**Dependencias**: F0.1 (Header identidad), F0.2 (Finanzas base).

---

## F0.4 · Propiedad

**COMP-IDs incluidos** (6 componentes · Capítulo 8):
- COMP-5001 · Ownership Section · **BLOCKED**
- COMP-5002 · Ownership Intelligence · **BLOCKED**
- COMP-5003 · Ownership Overview · **BLOCKED**
- COMP-5004 · Shareholders · **BLOCKED**
- COMP-5005 · Corporate Group · **BLOCKED**
- COMP-5006 · Ownership Network · **BLOCKED** (además requiere Knowledge Graph Engine)

**Endpoints V2 necesarios**: ❌ **Ownership Engine no existe en V2**. Toda la sección BLOCKED.

**Cobertura**: READY 0/6 · BLOCKED 6.

**Decisión de arranque F0.4**: implementar los 6 componentes como stubs `UnavailableBlock` con COMP-ID declarado. Documentar la dependencia contractual pendiente al usuario y a Agency Tool. Esta sección no se vuelve funcional hasta ampliación V2.

**Contradicciones**: C9 (COMP-5006 sin grafo visual en ZIP).

**Dependencias**: F0.1.

---

## F0.5 · Gobierno

**COMP-IDs incluidos** (7 componentes · Capítulo 9):
- COMP-6001 · Governance Section · **BLOCKED**
- COMP-6002 · Governance Intelligence · **BLOCKED**
- COMP-6003 · Governance Overview · **BLOCKED**
- COMP-6004 · Board Members · **BLOCKED**
- COMP-6005 · Executives · **BLOCKED**
- COMP-6006 · Legal Representatives · **BLOCKED**
- COMP-6007 · Governance Timeline · **BLOCKED**

**Endpoints V2 necesarios**: ❌ **Governance Engine no existe en V2**. Toda la sección BLOCKED.

**Cobertura**: READY 0/7 · BLOCKED 7.

**Decisión**: mismos stubs que F0.4.

**Contradicciones**: C10 (COMP-6007 sin timeline visual en ZIP).

**Dependencias**: F0.1.

---

## F0.6 · Mercado

**COMP-IDs incluidos** (7 componentes · Capítulo 10):
- COMP-7001-7007 · READY (todos)

**Endpoints V2 necesarios**:
- `POST /api/v1/semantic-intelligence/profile`
- `POST /api/v1/semantic-intelligence/similar`
- `POST /api/v1/signal-intelligence/sector`
- `POST /api/v1/signal-intelligence/territory`
- `POST /api/v1/signal-intelligence/history`
- `POST /api/v1/signal-intelligence/opportunities`
- `POST /api/v1/recommendation-intelligence/comparables`
- `POST /api/v1/strategy-intelligence/thesis`
- `POST /api/v1/strategy-intelligence/risk`

**Cobertura**: READY 7/7. Sub-sprint completamente desbloqueado.

**Contradicciones**: ninguna aplicable.

**Dependencias**: F0.1.

---

## F0.7 · Rankings

**COMP-IDs incluidos** (2 componentes · Capítulo 11):
- COMP-8001 · Rankings Section · **BLOCKED**
- COMP-8002 · Ranking Cards · **BLOCKED**

**Endpoints V2 necesarios**: ❌ **Ranking Engine no existe explícito en V2**. Derivación parcial vía `/recommendation-intelligence/comparables` + percentiles posible pero no canónica.

**Cobertura**: READY 0/2 · BLOCKED 2.

**Decisión**: stubs `UnavailableBlock`. Escalar al usuario si vale la pena derivar rankings de comparables o esperar Ranking Engine.

**Contradicciones**: C13 (rankings visibles en ZIP pero backend ausente).

**Dependencias**: F0.1.

---

## F0.8 · Comparativa

**COMP-IDs incluidos** (7 componentes · Capítulo 12):
- COMP-9001-9007 · READY (todos)

**Endpoints V2 necesarios**:
- `POST /api/v1/recommendation-intelligence/comparables`
- `POST /api/v1/semantic-intelligence/similar`
- `POST /api/v1/signal-intelligence/opportunities`
- `POST /api/v1/recommendation-intelligence/explain`
- `POST /api/v1/financial-intelligence/analyze` (para COMP-9007 Financial Comparison)

**Cobertura**: READY 7/7.

**Contradicciones**:
- C4 (COMP-9003 duplicado · resuelto por ACC como Competitive Positioning).
- C14.3 (universo de comparación persistente por usuario+empresa) — **alta** · requiere validación humana antes de arrancar F0.8.

**Dependencias**: F0.1, F0.2, F0.6.

---

## F0.9 · Señales

**COMP-IDs incluidos** (2 componentes · Capítulo 13):
- COMP-10001 · Signals Section · READY
- COMP-10002 · Signals Timeline · READY

**Endpoints V2 necesarios**:
- `POST /api/v1/signal-intelligence/analyze`
- `POST /api/v1/signal-intelligence/catalog`
- `POST /api/v1/signal-intelligence/history`
- `GET  /api/v1/signal-intelligence/signal/{signal_id}`

**Cobertura**: READY 2/2.

**Contradicciones**: ninguna.

**Dependencias**: F0.1.

---

## F0.10 · Oportunidades

**COMP-IDs incluidos** (1 componente · Capítulo 14):
- COMP-11001 · Opportunities Section · READY

**Endpoints V2 necesarios**:
- `POST /api/v1/signal-intelligence/opportunities`
- `POST /api/v1/strategy-intelligence/thesis`
- `POST /api/v1/strategy-intelligence/scenarios`

**Cobertura**: READY 1/1.

**Contradicciones**: ninguna.

**Dependencias**: F0.1, F0.9.

---

## F0.11 · Registros Públicos + Documentos

**COMP-IDs incluidos** (5 componentes · Capítulo 15):
- COMP-12001 · Sources Section · **BLOCKED**
- COMP-12002 · Corporate Registry Events · **BLOCKED**
- COMP-12003 · Annual Accounts Registry · **BLOCKED**
- COMP-12004 · Registry Information · **BLOCKED**
- COMP-12005 · Documents Section · **BLOCKED**

**Endpoints V2 necesarios**: ❌ **Registry Engine + Document Engine no existen en V2**. Parcial `/transaction-intelligence/documents` con semántica transaccional distinta.

**Cobertura**: READY 0/5 · BLOCKED 5.

**Decisión**: stubs `UnavailableBlock`.

**Contradicciones**: implícitas (BLOCKED por V2).

**Dependencias**: F0.1.

---

## F0.12 · Next Best Actions + Copilot (transversal)

**COMP-IDs incluidos** (3 componentes · Capítulo 16 + COMP-2001-2003 Vista Ejecutiva):
- COMP-2001 · Executive Metrics · READY
- COMP-2002 · Arroba Copilot · READY (composición)
- COMP-2003 · Next Step Panel · READY
- COMP-13001 · Next Best Actions · READY
- COMP-13002 · Recommendation Explainability · READY
- COMP-13003 · Recommendation Prioritization · READY

**Endpoints V2 necesarios**:
- `POST /api/v1/recommendation-intelligence/next-action` (nota: en V2 vive bajo `transaction-intelligence/next-action`)
- `POST /api/v1/recommendation-intelligence/explain`
- `POST /api/v1/recommendation-intelligence/matching`
- `POST /api/v1/transaction-intelligence/next-action`
- `POST /api/v1/transaction-intelligence/workflow`
- `POST /api/v1/strategy-intelligence/*`

**Cobertura**: READY 6/6.

**Contradicciones**: C3 (Vista Ejecutiva distribuida en múltiples JSX vs ACC modela sección dedicada) — media · requiere decisión de agrupación física.

**Dependencias**: transversal · se puede iterar en paralelo desde F0.1.

---

## Resumen agregado

| Sub-sprint | Sección | Total COMP | READY | BLOCKED | Contradicciones bloqueantes |
|---|---|---|---|---|---|
| F0.1 | Header + Perfil | 6 (+Perfil visual) | 5 | 1 (stub) | C2, C14.5, C14.2 |
| F0.2 | Finanzas | 7 | 6 | 1 (stub Cash Flow) | C14.4 |
| F0.3 | Valoración | 8 | 5 | 3 (stubs avanzados) | C5, C11 |
| F0.4 | Propiedad | 6 | 0 | 6 (todos stub) | Ownership Engine ausente V2 |
| F0.5 | Gobierno | 7 | 0 | 7 (todos stub) | Governance Engine ausente V2 |
| F0.6 | Mercado | 7 | 7 | 0 | — |
| F0.7 | Rankings | 2 | 0 | 2 (stubs) | Ranking Engine ausente V2 |
| F0.8 | Comparativa | 7 | 7 | 0 | C14.3 |
| F0.9 | Señales | 2 | 2 | 0 | — |
| F0.10 | Oportunidades | 1 | 1 | 0 | — |
| F0.11 | Registros + Documentos | 5 | 0 | 5 (stubs) | Registry + Document Engines ausentes V2 |
| F0.12 | NBA + Copilot | 6 (2001-2003 + 13001-13003) | 6 | 0 | C3 |
| **TOTAL** | | **64** | **39 (60,9 %)** | **25 (39,1 %)** | 8 contradicciones documentadas |

## Estado del plan

**Pendiente de aprobación explícita del usuario** antes de arrancar F0.1. El plan es una propuesta canónica basada en:
- El orden solicitado por el usuario (1 Header → 13 Documentos).
- El mapeo motor lógico ACC → endpoint V2 documentado en `ACC_COMPONENT_INDEX.md`.
- Las contradicciones documentadas en `CONTRADICTIONS.md`.

Cambios sugeridos al usuario (opcionales, para su decisión):
1. **Alternar dependencias**: F0.6 Mercado, F0.9 Señales, F0.10 Oportunidades y F0.12 NBA+Copilot son 100 % READY. Podrían intercalarse temprano para maximizar avance con endpoints estables.
2. **Agrupar BLOCKED**: F0.4 Propiedad, F0.5 Gobierno, F0.7 Rankings y F0.11 Registros+Documentos suman 20 componentes BLOCKED. Se pueden abordar juntos en un mini-sprint "stubs" de 1 día para dejar todo el árbol de la ficha con presencia visual (aunque degradada), antes de resolver los sub-sprints funcionales.
3. **Priorizar contradicciones altas**: C14.5 (acciones sensibles), C14.3 (universo comparativa) y C14.4 (histórico Finanzas) deben aclararse antes de arrancar sus sub-sprints correspondientes (F0.1, F0.8, F0.2).

## Historial
- v1 · 2026-07-06 · plan inicial tras ingesta canónica F0.0.
