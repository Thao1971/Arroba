# arroba.com — SPRINT 0 EXECUTIVE SUMMARY v1.0

> **Resumen ejecutivo del Sprint 0 + Sprint 0.5 — Canonical Baseline v1.0**.
> Congelado el 2026-06-25.
>
> Documento orientado a stakeholders. Densidad sobre relleno: cada sección responde a una pregunta concreta de negocio o producto.

---

## Índice

1. [TL;DR (una pantalla)](#1-tldr-una-pantalla)
2. [Contexto: qué problema resolvimos](#2-contexto-qué-problema-resolvimos)
3. [Qué se hizo en el Sprint 0](#3-qué-se-hizo-en-el-sprint-0)
4. [Qué se hizo en el Sprint 0.5](#4-qué-se-hizo-en-el-sprint-05)
5. [Decisiones canónicas tomadas](#5-decisiones-canónicas-tomadas)
6. [Estado del canon tras la baseline](#6-estado-del-canon-tras-la-baseline)
7. [Lo que NO se hizo (out of scope explícito)](#7-lo-que-no-se-hizo-out-of-scope-explícito)
8. [Open items que persisten](#8-open-items-que-persisten)
9. [Próximos hitos](#9-próximos-hitos)
10. [Riesgos detectados y mitigaciones](#10-riesgos-detectados-y-mitigaciones)
11. [Anexo: índice del entregable](#11-anexo-índice-del-entregable)

---

## 1. TL;DR (una pantalla)

**Misión del Sprint 0**: dar al producto una **arquitectura de motores** documentada y canónica antes de seguir construyendo código. arroba.com pasa de ser "una app M&A con un Copilot" a un **Transaction Operating System** con motores nombrados, especificados y conectados entre sí.

**Resultado del Sprint 0**: 6 specs canónicos (`TRANSACTION_OS`, `TRANSACTION_COPILOT`, `COPILOTS`, `MEMORY_ENGINE`, `AGENTIC_LAYERS`, `MONETIZATION`) que constituyen formalmente la **capa 7 del proyecto: Engines & Specs**.

**Misión del Sprint 0.5**: auditar las contradicciones entre los nuevos specs y el canon legacy (`ARROBA_PHILOSOPHY`, `ENTITY_MODEL`, `ENTITY_FRAMEWORK`, `PRD`), tomar decisiones canónicas pendientes y consolidar todo en una **baseline congelada**.

**Resultado del Sprint 0.5**:
- Auditoría completa (Ciclo A).
- Decisiones canónicas confirmadas y propagadas (Ciclo B). Las más importantes:
  - **Match pasa a ser una entidad canónica de primer nivel.**
  - Renombre `client → user`.
  - Fases canónicas del `operation.current_phase`: `nda → im → qa → loi → dd → negotiation → spa → closing → integration`.
  - Capa 7 *Engines & Specs* incorporada formalmente.
- 4 nuevos documentos consolidadores (`CANON_INDEX`, `ENGINE_ARCHITECTURE`, este resumen, `ARCHITECTURE_MAP`).
- Pack distribuible (`canonical_pack_v1.0.zip`).

**Cero código de producto modificado en estos sprints**. La inversión es estratégica: documentación canónica que evita rework futuro.

**Próximo hito**: Sprint 1 — Identidad + Roles + Planes + Billing. **No iniciado**. Requiere aprobación explícita.

---

## 2. Contexto: qué problema resolvimos

### 2.1 El síntoma

Antes del Sprint 0, arroba.com tenía:
- Una filosofía estratégica fuerte (`ARROBA_PHILOSOPHY.md` v3.0).
- Una ontología y arquitectura UX por entidad (`ENTITY_MODEL` + `ENTITY_FRAMEWORK`).
- Implementación parcial (capacidad de analizar empresa, valorar, recomendar) pero **sin un mapa explícito** de los motores que producen esa inteligencia.

El síntoma se manifestó así:
- Nuevas capacidades se discutían sin un vocabulario común para "matching", "valuation", "agentic layer".
- Decisiones sobre persistencia, memoria y autonomía se tomaban *ad hoc* spec-a-spec.
- Conflictos puntuales entre lo que decía la filosofía y lo que decía el código (Match como relación vs entidad, fases del journey, nomenclatura `client` vs `user`).

### 2.2 El diagnóstico

El producto necesitaba una **capa de specs de motores** entre la filosofía y el código. No para escribir más código, sino para **declarar contratos** y reglas que el código debe respetar.

### 2.3 La hipótesis

Producir 6 specs canónicos del Sprint 0, alinearlos con el canon legacy, y congelar una baseline. Eso permitiría que cualquier sprint posterior se construyera sobre un canon estable y consultable.

### 2.4 La validación

El Sprint 0.5 (Ciclo A) auditó las contradicciones y encontró 15 originales canon ↔ legacy y un número significativo de inconsistencias intra-spec. La capacidad de **enumerar** estos open items y **clasificarlos** (G1/G2/G3/G4) valida que los specs son ahora un artefacto manipulable.

---

## 3. Qué se hizo en el Sprint 0

Sprint 0 produjo **6 specs canónicos** en `/app/memory/specs/`:

| Spec | Versión final | Lo que decide |
|---|---|---|
| `TRANSACTION_OS_SPEC.md` | v1.2.0 | Cómo se modela el ciclo end-to-end de una operación: 15 fases canónicas (`T1`…`T15`), estados, transiciones, eventos. |
| `TRANSACTION_COPILOT_SPEC.md` | v1.2.0 | Cómo se comporta el Copilot orquestador de la transacción: intents, herramientas, gobernanza conversacional. |
| `COPILOTS_SPEC.md` | v1.1.0 | El catálogo de Copilots especializados por entidad y su contrato común. |
| `MEMORY_ENGINE_SPEC.md` | v1.1.0 | La capa de memoria: corto plazo, largo plazo, sintetización, hidratación, scopes. |
| `AGENTIC_LAYERS_SPEC.md` | v1.1.0 | Las 4 capas agénticas: perception → reasoning → action → reflection. Gobernanza de autonomía. |
| `MONETIZATION_SPEC.md` | v1.1.0 | El modelo de negocio: planes, gating funcional, fricciones, métricas de monetización. |

> **Nota**: los specs se escribieron en orden secuencial (0.1 → 0.6). Las versiones finales reflejan los cierres del Sprint 0.5 Ciclo B aplicados sobre las versiones iniciales del Sprint 0.

### 3.1 Por qué estos 6 y no otros

Los 6 specs cubren las **dimensiones críticas del producto**:
- **Producto end-to-end** (Transaction OS): el journey M&A completo.
- **Capa conversacional** (Transaction Copilot + Copilots): cómo habla el producto.
- **Capa cognitiva** (Memory Engine + Agentic Layers): cómo piensa y recuerda.
- **Capa de negocio** (Monetization): cómo se paga.

Otros motores (Sources, Data Layer, KG, Embeddings, Signal, Matching, Recommendation, Valuation, Risk, UX Surface) están descritos en `ENGINE_ARCHITECTURE.md` con plantilla canónica, pero no requirieron spec dedicado en este sprint: o están más cerca de infraestructura o ya están parcialmente normados por el `ENTITY_MODEL` / `ENTITY_FRAMEWORK`.

---

## 4. Qué se hizo en el Sprint 0.5

### 4.1 Ciclo A — Auditoría documental

Se produjeron 2 documentos:

| Documento | Contenido |
|---|---|
| `specs/CANON_AUDIT_REPORT.md` | Inventario completo de **contradicciones canon ↔ legacy** (15 originales) y de **inconsistencias intra-spec** detectadas. |
| `specs/OPEN_ITEMS_CLASSIFICATION.md` | Clasificación de open items en 4 grupos: G1 (autocerrables intra-spec), G2 (decisiones canónicas pendientes), G3 (decisiones de producto que requieren input humano), G4 (backlog estratégico). |

**Hallazgos clave del Ciclo A**:
- La capa estratégica trataba Match a veces como entidad, a veces como relación. Decisión necesaria.
- La nomenclatura del actor humano del producto oscilaba entre `client` y `user`. Decisión necesaria.
- Las fases del `Operation.current_phase` aparecían en órdenes ligeramente distintos en diferentes specs. Decisión necesaria.
- `ARROBA_PHILOSOPHY.md` §13 hablaba de 6 capas pero los specs introducían formalmente una nueva capa (Engines & Specs). Decisión necesaria.

### 4.2 Ciclo B — Propagación + ensamblaje

El Ciclo B aplicó las decisiones canónicas G1 y G2 al canon completo y construyó el pack de entrega.

**Fase B.1 — Correcciones intra-spec**:
Cierre de los 17 OPENs G1 (inconsistencias autocerrables) y 9 OPENs G2 (decisiones canónicas confirmadas) en cada uno de los 6 specs. Bump de versiones (v1.2.0 / v1.1.0). CHANGELOG interno por spec.

**Fase B.2 — Propagación a canon legacy**:
- `ARROBA_PHILOSOPHY.md`: §6/§7 reconciliados; §13 ampliada a 7 capas; catálogo abstraído.
- `ENTITY_MODEL.md` → v1.1.0: `client → user`; `match` añadido como §5.7.
- `ENTITY_FRAMEWORK.md` → v1.1.0: `match` con anatomía propia (§11.13); §11.8 Operación con fases canónicas.
- `PRD.md`: sección **🧊 CANONICAL BASELINE v1.0** añadida al inicio.
- `CHANGELOG.md`: entrada `v1.0-canonical-baseline (2026-06-25)`.

**Fases B.3-B.6 — Nuevos documentos consolidadores**:
- `CANON_INDEX.md` — índice maestro navegable.
- `ENGINE_ARCHITECTURE.md` — cadena de inteligencia end-to-end.
- `SPRINT0_EXECUTIVE_SUMMARY.md` — este documento.
- `ARCHITECTURE_MAP.md` — mapa visual ASCII.

**Fase B.7 — Ensamblaje del pack**:
Construcción de `canonical_pack_v1.0/` con estructura `canonical/`, `specs/`, `audit/`, `summary/`. Generación del ZIP `canonical_pack_v1.0.zip`.

**Fase B.8 — Freeze final**:
PRD + CHANGELOG marcan la baseline como **Canonical Baseline v1.0** congelada 2026-06-25.

---

## 5. Decisiones canónicas tomadas

Las decisiones que el Sprint 0.5 confirmó y propagó al canon son:

### 5.1 Match pasa a ser una entidad canónica de primer nivel

**Decisión**: el `match` deja de ser un objeto relacional efímero y pasa a ser una **entidad canónica de primer nivel** con identidad propia, ciclo de vida observable, score, fit_factors desglosados y trazabilidad bidireccional.

**Implicaciones**:
- Tiene ficha (`/match/{id}`) con anatomía propia (`ENTITY_FRAMEWORK.md` §11.13).
- Tiene Copilot especializado: `Match Advisor`.
- Tiene ciclo de vida: `detected → reviewed → contacted → engaged → converted_to_operation | discarded`.
- Permite auditoría (¿por qué se descartó?), reactivación (revisar matches descartados ante nuevos signals), y métricas (conversión `match → operation`).
- Si un match deriva en una operación, queda referenciado como `operation.origin_match_id`.

**Por qué**: la materialización del match como entidad permite gobernar la conversión de oportunidades a operaciones con la misma rigurosidad que el resto del producto.

### 5.2 Renombre `client → user`

Se canoniza `user` como nombre del actor humano del producto. `client` queda decomisionado del modelo. Aplica a `ENTITY_MODEL`, `ENTITY_FRAMEWORK`, `ARROBA_PHILOSOPHY` y los 6 specs.

### 5.3 Renombre `team_arroba → arroba_team`

Se canoniza `arroba_team` para la entidad organizativa interna del equipo arroba.com. Aplica a los specs y al `ENTITY_MODEL`.

### 5.4 Fases del journey M&A: `T1`…`T15`

Se confirma la numeración canónica de las 15 fases del journey en `TRANSACTION_OS_SPEC.md` §3. Cualquier referencia a fases en el resto del canon debe usar este vocabulario.

### 5.5 Fases del `Operation.current_phase`

Orden canónico definitivo: `nda → im → qa → loi → dd → negotiation → spa → closing → integration`. Confirmado en `ENTITY_MODEL.md` §5.8 y `ENTITY_FRAMEWORK.md` §11.8.

### 5.6 Capa 7 — Engines & Specs

Incorporada formalmente en `ARROBA_PHILOSOPHY.md` §13 entre *Entity Framework* y *Design System*. Las 7 capas canónicas son:

1. Blueprint Estratégico
2. UX Blueprint
3. Entity Framework (ontología + arquitectura UX)
4. **Engines & Specs** ← nueva capa formalizada
5. Design System
6. Diseños
7. Implementación

### 5.7 Catálogo de entidades abstraído

El catálogo de tipos del producto se enumera sin cuantificarlos. Se evoluciona por declaración, no por cardinalidad. Cualquier referencia previa a un número específico de tipos queda removida del canon.

---

## 6. Estado del canon tras la baseline

### 6.1 Documentos canónicos y su estado

| Documento | Capa | Versión final | Estado |
|---|---|---|---|
| `ARROBA_PHILOSOPHY.md` | 1 | v3.0 | ✅ Alineado |
| `ARROBA_PHILOSOPHY.md` §12 (UX Blueprint) | 2 | v3.0 | ✅ Alineado |
| `ENTITY_MODEL.md` | 3 | v1.1.0 | ✅ Alineado |
| `ENTITY_FRAMEWORK.md` | 3 | v1.1.0 | ✅ Alineado |
| `specs/TRANSACTION_OS_SPEC.md` | 4 | v1.2.0 | ✅ Alineado |
| `specs/TRANSACTION_COPILOT_SPEC.md` | 4 | v1.2.0 | ✅ Alineado |
| `specs/COPILOTS_SPEC.md` | 4 | v1.1.0 | ✅ Alineado |
| `specs/MEMORY_ENGINE_SPEC.md` | 4 | v1.1.0 | ✅ Alineado |
| `specs/AGENTIC_LAYERS_SPEC.md` | 4 | v1.1.0 | ✅ Alineado |
| `specs/MONETIZATION_SPEC.md` | 4 | v1.1.0 | ✅ Alineado |
| `DESIGN_SYSTEM.md` | 5 | (sin tocar) | ✅ Vigente |
| `CANON_INDEX.md` | meta | v1.0 | ✅ Nuevo |
| `ENGINE_ARCHITECTURE.md` | meta | v1.0 | ✅ Nuevo |
| `SPRINT0_EXECUTIVE_SUMMARY.md` | meta | v1.0 | ✅ Nuevo |
| `ARCHITECTURE_MAP.md` | meta | v1.0 | ✅ Nuevo |
| `PRD.md` | estado | vivo | ✅ Sección baseline añadida |
| `CHANGELOG.md` | estado | vivo | ✅ Entrada baseline añadida |

### 6.2 Cero contradicciones canon ↔ legacy

El informe final del Ciclo B verifica que las **15 contradicciones originales** identificadas en el `CANON_AUDIT_REPORT.md` §13 quedan resueltas o cerradas con justificación. Detalle por contradicción en el informe final entregado al usuario.

---

## 7. Lo que NO se hizo (out of scope explícito)

Para preservar la integridad del freeze, el Sprint 0/0.5 **no tocó**:

- ❌ Código de producto (frontend o backend). Cero modificaciones.
- ❌ Implementación de los motores (siguen igual de mocked/parciales que antes).
- ❌ Diseño visual (no se cambió Design System ni mockups).
- ❌ Tests automatizados (los conteos previos se preservan).
- ❌ Variables de entorno, supervisor, infraestructura.
- ❌ Sprint 1 (Identidad + Roles + Planes + Billing) — **no iniciado**.

Esta disciplina es la que permite congelar la baseline con confianza.

---

## 8. Open items que persisten

Tras el Ciclo B, los OPENs **G1** y **G2** quedan cerrados. Persisten los grupos **G3** y **G4**:

### 8.1 G3 — Decisiones de producto que requieren input humano

Son decisiones que no podían tomarse en el Sprint 0/0.5 sin entrada del usuario o validación de mercado. Algunos ejemplos del catálogo G3:
- Modelo definitivo de límites por plan en `MONETIZATION_SPEC` (cifras concretas).
- Política de retención de memoria por scope (cuánto tiempo retenemos qué).
- Modelo de comisiones por operación cerrada (negocio).
- Estrategia de internacionalización (mercados, idiomas, regulación).
- Política de privacidad de matches cross-org.

Estos items **NO bloquean** el Sprint 1. Se irán resolviendo en su sprint correspondiente.

### 8.2 G4 — Backlog estratégico

Capacidades planeadas a futuro que no son canon todavía. Ejemplos:
- Match Advisor (Copilot especializado) — referenciado pero no especificado en detalle.
- Risk Engine cuantitativo dedicado (hoy embebido en `AnalyzeSkill`).
- Sora-style video generation para teasers (futuro lejano).
- Telegram bot conversational (futuro lejano).

Detalle completo en `specs/OPEN_ITEMS_CLASSIFICATION.md` §3 y §4.

---

## 9. Próximos hitos

### 9.1 Sprint 1 — Identidad + Roles + Planes + Billing

**No iniciado**. Requiere aprobación explícita del usuario.

**Scope tentativo** (sujeto a refinamiento al iniciar el Sprint):
- Modelo de usuario, organización y memberships (alineado con `ENTITY_MODEL.md` post-renombre `user`).
- Roles canónicos (admin, member, viewer) y permisos.
- Planes (free, pro, premium) con gating funcional según `MONETIZATION_SPEC.md`.
- Integración con un proveedor de billing (Stripe / Razorpay / etc.).
- Flujo de upgrade desde locks en la UX.

### 9.2 Sprints posteriores (orden tentativo)

- Sprint 2 — Sources & Data Layer (REQ-001, REQ-002, REQ-008…).
- Sprint 3 — Knowledge Graph + Embeddings.
- Sprint 4 — Signal Engine.
- Sprint 5 — Matching Engine + entidad Match operativa en UX.
- Sprint 6 — Recommendation Engine real (REQ-005).
- Sprint 7 — Valuation Engine real (REQ-004).
- Sprint 8 — Transaction OS operativo (creación, gestión y avance de operaciones).
- Sprint 9 — Catálogo de Copilots especializados completo.
- Sprint 10 — Risk Engine dedicado.

El orden puede variar según prioridades de mercado.

---

## 10. Riesgos detectados y mitigaciones

### 10.1 Riesgo: drift entre spec y código

**Riesgo**: el código actual no implementa todos los specs del Sprint 0. Si se construye nuevo código sin consultar el spec, puede haber drift.

**Mitigación**:
- `CANON_INDEX.md` es la puerta de entrada obligatoria.
- Cada PR debe declarar qué spec referencia.
- Auditorías periódicas (próxima baseline ~ post Sprint 5 estimado).

### 10.2 Riesgo: Match infraestimado

**Riesgo**: elevar Match a entidad de primer nivel multiplica los puntos de gobierno (UX dedicada, Copilot especializado, ciclo de vida).

**Mitigación**:
- Match Advisor entra en backlog G4 con prioridad media.
- El Sprint 5 (Matching Engine) debe construir simultáneamente engine + entidad + ficha mínima + Match Advisor mínimo.

### 10.3 Riesgo: ruptura del freeze

**Riesgo**: alguien edita un documento de la baseline después del freeze sin proceso.

**Mitigación**:
- Toda modificación post-baseline requiere bump de versión + entrada en CHANGELOG global.
- `canonical_pack_v1.0.zip` es la referencia inmutable de la baseline.

### 10.4 Riesgo: G3 sin asignar

**Riesgo**: los open items G3 (decisiones de producto) podrían diluirse sin asignación clara.

**Mitigación**:
- Cada item G3 se asigna a un Sprint específico al iniciar el Sprint correspondiente.
- `ROADMAP.md` debe ir absorbiendo los G3 como inputs.

---

## 11. Anexo: índice del entregable

El entregable físico de los Sprints 0 + 0.5 es:

```
/app/memory/
├── ARROBA_PHILOSOPHY.md            ← capa 1 (alineada)
├── ENTITY_MODEL.md                 ← capa 3 (v1.1.0)
├── ENTITY_FRAMEWORK.md             ← capa 3 (v1.1.0)
├── DESIGN_SYSTEM.md                ← capa 5 (sin tocar)
├── PRD.md                          ← estado (baseline añadida)
├── CHANGELOG.md                    ← estado (baseline añadida)
├── CANON_INDEX.md                  ← meta (NUEVO)
├── ENGINE_ARCHITECTURE.md          ← meta (NUEVO)
├── SPRINT0_EXECUTIVE_SUMMARY.md    ← meta (NUEVO — este documento)
├── ARCHITECTURE_MAP.md             ← meta (NUEVO)
├── canonical_pack_v1.0.zip         ← pack distribuible
├── canonical_pack_v1.0/            ← carpeta fuente del pack
│   ├── README.md
│   ├── canonical/                  ← los 7 canónicos
│   ├── specs/                      ← los 6 specs del Sprint 0
│   ├── audit/                      ← los 2 reportes del Ciclo A
│   └── summary/                    ← los documentos consolidadores
└── specs/
    ├── TRANSACTION_OS_SPEC.md            v1.2.0
    ├── TRANSACTION_COPILOT_SPEC.md       v1.2.0
    ├── COPILOTS_SPEC.md                  v1.1.0
    ├── MEMORY_ENGINE_SPEC.md             v1.1.0
    ├── AGENTIC_LAYERS_SPEC.md            v1.1.0
    ├── MONETIZATION_SPEC.md              v1.1.0
    ├── CANON_AUDIT_REPORT.md
    └── OPEN_ITEMS_CLASSIFICATION.md
```

---

> **Estado del Sprint**: ✅ CERRADO Y CONGELADO el 2026-06-25.
> **Baseline**: `v1.0-canonical-baseline`.
> **Siguiente acción**: esperar aprobación explícita del usuario para iniciar Sprint 1.
