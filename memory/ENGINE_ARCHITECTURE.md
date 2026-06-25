# arroba.com — ENGINE ARCHITECTURE v1.0

> **Cadena de inteligencia canónica de arroba.com — Canonical Baseline v1.0** (congelada 2026-06-25 tras Sprint 0 + Sprint 0.5).
>
> Este documento describe los **motores** que componen el producto y cómo se conectan entre sí. Es la traducción **horizontal** de la capa 4 (Engines & Specs) del canon: complementa los 6 specs del Sprint 0 declarando la **pipeline** que los conecta.
>
> **Regla de oro**: este documento NO sustituye a los specs. Si hay conflicto, gana el spec del motor (`/app/memory/specs/*`).

---

## Índice

1. [Filosofía de la cadena de inteligencia](#1-filosofía-de-la-cadena-de-inteligencia)
2. [Mapa de motores (overview)](#2-mapa-de-motores-overview)
3. [Plantilla canónica por motor](#3-plantilla-canónica-por-motor)
4. [Engine — Sources](#4-engine--sources)
5. [Engine — Data Layer](#5-engine--data-layer)
6. [Engine — Knowledge Graph](#6-engine--knowledge-graph)
7. [Engine — Embeddings](#7-engine--embeddings)
8. [Engine — Signal](#8-engine--signal)
9. [Engine — Matching](#9-engine--matching)
10. [Engine — Recommendation](#10-engine--recommendation)
11. [Engine — Valuation](#11-engine--valuation)
12. [Engine — Risk](#12-engine--risk)
13. [Engine — Transaction (OS)](#13-engine--transaction-os)
14. [Engine — Copilots (Agentic Layer)](#14-engine--copilots-agentic-layer)
15. [Engine — UX Surface](#15-engine--ux-surface)
16. [Flujo end-to-end ilustrativo](#16-flujo-end-to-end-ilustrativo)
17. [Contratos entre motores](#17-contratos-entre-motores)
18. [Gobierno de la cadena](#18-gobierno-de-la-cadena)
19. [Evolución y versionado](#19-evolución-y-versionado)

---

## 1. Filosofía de la cadena de inteligencia

La inteligencia de arroba.com **no vive en un solo motor**. Vive en una **cadena** donde cada eslabón:

- **Consume** salidas de motores upstream.
- **Aporta una transformación cualitativa** (no solo un pase de datos).
- **Produce** salidas que motores downstream consumen.
- **Es observable**: cada motor expone trazas, métricas y un contrato verificable.
- **Es sustituible**: cada motor puede tener una implementación mock y una real (Boundary First).

La cadena se construye de **derecha a izquierda** desde la perspectiva de valor: lo que el usuario percibe (UX) es el último eslabón, pero el primero en diseñarse. Lo que el motor de fuentes ingiere es el primer eslabón en ejecución, pero el último en diseñarse.

**Principios**:

1. **Cada motor habla un dialecto del dominio**. No hay un modelo de datos único que atraviese toda la cadena; hay **traducciones canónicas** entre dialectos (definidas en §17).
2. **Idempotencia donde sea posible**. Re-ejecutar un motor sobre la misma entrada produce el mismo output (excepto motores estocásticos por diseño, como Copilots LLM).
3. **Trazabilidad bidireccional**. Cualquier output debe poder rastrearse hacia atrás a sus inputs (auditoría) y hacia adelante a sus consumidores (impact analysis).
4. **Fail open soft, never silent**. Si un motor falla, los downstream **deben** recibir un objeto explícito de "no disponible" con razón; nunca un null silencioso.

---

## 2. Mapa de motores (overview)

```
┌──────────────┐
│   SOURCES    │  Adapters externos (BORME, Agency Tool, prensa, BBDD propias)
└──────┬───────┘
       │   datos crudos heterogéneos
       ▼
┌──────────────┐
│  DATA LAYER  │  Normalización, deduplicación, identidad canónica
└──────┬───────┘
       │   entidades canónicas (companies, sectors, territories, persons, …)
       ▼
┌──────────────┐
│  KNOWLEDGE   │  Grafo del producto: relaciones entre entidades
│    GRAPH     │
└───┬──────┬───┘
    │      │
    │      └────────────────────────┐
    ▼                               ▼
┌──────────────┐              ┌──────────────┐
│  EMBEDDINGS  │              │   SIGNAL     │  Detección de eventos relevantes
│              │              │              │
└──────┬───────┘              └──────┬───────┘
       │                             │
       │   vectores semánticos       │   eventos tipados
       └─────────────┬───────────────┘
                     ▼
              ┌──────────────┐
              │   MATCHING   │  Empareja origen ↔ destino (objeto `match`)
              └──────┬───────┘
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ RECOMMEND│  │VALUATION │  │   RISK   │
└─────┬────┘  └─────┬────┘  └─────┬────┘
      │             │             │
      └─────────────┼─────────────┘
                    ▼
             ┌──────────────┐
             │ TRANSACTION  │  El OS (TRANSACTION_OS_SPEC.md)
             │     (OS)     │  15 fases T1…T15
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │   COPILOTS   │  Agentic layer: perception → reasoning →
             │              │  action → reflection
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │  UX SURFACE  │  Entity Framework: fichas, secciones, dock
             └──────────────┘
```

**Dirección de los datos**: top → bottom (ingesta → presentación).
**Dirección del feedback**: bottom → top (cada motor downstream puede retroalimentar con métricas a los upstream).

---

## 3. Plantilla canónica por motor

Cada motor (secciones §4-§15) sigue esta plantilla:

| Campo | Descripción |
|---|---|
| **Propósito** | Una frase. Qué transforma este motor. |
| **Inputs** | De qué motores upstream consume. Estructura de datos esperada. |
| **Outputs** | A qué motores downstream alimenta. Estructura producida. |
| **Spec canónico** | Documento de la capa 4 que es fuente de verdad (cuando aplica). |
| **Entidades canónicas tocadas** | Tipos del `ENTITY_MODEL.md` que produce, lee o muta. |
| **Estado del producto** | `mock` · `partial` · `prod` (a nivel canónico, no de código). |
| **REQs externos** | REQ-XXX abiertos en `/app/_requirements_for_agency_tool/`. |
| **Modos** | Determinista, estocástico, híbrido. |
| **Observabilidad** | Qué traza, qué expone como métrica. |
| **Riesgos / fallbacks** | Qué pasa si el upstream falla. |

---

## 4. Engine — Sources

| Campo | Detalle |
|---|---|
| **Propósito** | Ingesta de información del mundo exterior y de sistemas internos. Es la "boca" del producto. |
| **Inputs** | Mundo (APIs públicas, BORME, prensa, contratación pública, BBDD propias, Agency Tool, uploads de usuarios). |
| **Outputs** | Stream de "documentos crudos" con `source_type`, `source_id`, `timestamp`, `payload`. Alimenta a Data Layer. |
| **Spec canónico** | (No tiene spec dedicado; convenciones distribuidas en cada adapter.) |
| **Entidades canónicas tocadas** | Ninguna directamente — produce material pre-canónico. |
| **Estado** | `partial` — adapter mock existente para companies (Agency Tool mock). Resto del catálogo de fuentes pendiente. |
| **REQs externos** | REQ-001 (Agency Tool real), REQ-008 (señales BORME/prensa), REQ-010 (M&A reciente sectorial). |
| **Modos** | Determinista por fuente. Pull (cron) vs push (webhook) por fuente. |
| **Observabilidad** | Tasa de ingesta, latencia por fuente, schema drift, freshness por entidad. |
| **Riesgos / fallbacks** | Fuente caída → marca entidades afectadas como `freshness=stale` y notifica downstream. Nunca silencia. |

**Reglas canónicas**:
- Cada fuente declara un **adapter** con interfaz uniforme: `fetch(scope) -> RawDocument[]`.
- Adapters MOCK conviven con REAL desde día uno (Boundary First).
- Header `X-Source: {mock|real}` propagado por toda la cadena.

---

## 5. Engine — Data Layer

| Campo | Detalle |
|---|---|
| **Propósito** | Normalizar, deduplicar y dotar de identidad canónica a las entidades. |
| **Inputs** | `RawDocument[]` de Sources. |
| **Outputs** | Entidades canónicas tipadas (`ENTITY_MODEL.md`): company, sector, territory, person, etc. |
| **Spec canónico** | `ENTITY_MODEL.md` (ontología); convenciones de identidad en §2. |
| **Entidades canónicas tocadas** | **Todas las primitivas** (company, sector, territory, person, advisor, document, organization, user). Crea, actualiza, deduplica. |
| **Estado** | `partial` — companies normalizadas; resto en backlog. |
| **REQs externos** | REQ-001 (datos canónicos de companies), REQ-002 (sectorización fiable). |
| **Modos** | Determinista. Reglas explícitas de identidad (CIF, slug, dedupe por similitud nominal). |
| **Observabilidad** | Nº entidades por tipo, tasa de deduplicación, conflictos de identidad (`identity_collisions`). |
| **Riesgos / fallbacks** | Conflicto de identidad → queda en `pending_review` y se notifica al equipo. Nunca colapsa dos entidades distintas silenciosamente. |

**Reglas canónicas**:
- Identidad por **slug + id** (`ENTITY_MODEL.md` §4). CIF para companies.
- Soft delete universal (`deleted_at`).
- Versionado de campos: cualquier cambio a una entidad crea una `entity_revision`.

---

## 6. Engine — Knowledge Graph

| Campo | Detalle |
|---|---|
| **Propósito** | Modelar las relaciones tipadas entre entidades canónicas. |
| **Inputs** | Entidades canónicas del Data Layer. |
| **Outputs** | Grafo dirigido tipado: `(node_a)-[edge_type {meta}]->(node_b)`. |
| **Spec canónico** | `ENTITY_MODEL.md` §5 (relaciones por entidad) y §6 (grafo del producto). |
| **Entidades canónicas tocadas** | Aristas: `belongs_to_sector`, `located_in`, `competes_with`, `acquired_by`, `advised_by`, `mandate_of`, `match_origin`, `match_destination`, `derived_operation`, etc. |
| **Estado** | `partial` — relaciones core (company↔sector, company↔territory) operativas. |
| **REQs externos** | REQ-002 (sectorización), REQ-006 (relaciones M&A históricas). |
| **Modos** | Determinista (reglas) + asistido (LLM propone aristas, humano valida en alta confianza). |
| **Observabilidad** | Densidad del grafo, nº aristas por tipo, edge confidence distribution. |
| **Riesgos / fallbacks** | Arista de baja confianza → marcada `low_confidence=true`, oculta en UX pero presente para auditoría. |

**Reglas canónicas**:
- Cada arista declara `source` (de qué fuente nació) y `confidence` (0-1).
- Aristas son **versionadas**: aparición, evolución, decaimiento (cuando dejan de ser válidas).

---

## 7. Engine — Embeddings

| Campo | Detalle |
|---|---|
| **Propósito** | Producir representaciones vectoriales de entidades, secciones de texto, y queries de usuario para permitir búsqueda semántica y matching. |
| **Inputs** | Entidades canónicas (Data Layer) + textos asociados (descripciones, narratives, queries). |
| **Outputs** | Vectores normalizados con metadatos: `entity_id`, `embedding_type` (`semantic`, `intent`, `style`), `dim`, `model_version`. |
| **Spec canónico** | `MEMORY_ENGINE_SPEC.md` (la memoria usa embeddings para hidratación). |
| **Entidades canónicas tocadas** | No crea entidades; produce **embeddings asociados a** company, sector, person, document, opportunity, mandate, conversation. |
| **Estado** | `mock` — embeddings sintéticos en tests; modelo real pendiente. |
| **REQs externos** | REQ-007 (proveedor de embeddings y SLA). |
| **Modos** | Determinista por (input, model_version). |
| **Observabilidad** | Coste por entidad, latencia, drift por re-embedding. |
| **Riesgos / fallbacks** | Modelo no disponible → cae a búsqueda textual clásica con flag `degraded_semantic=true`. |

**Reglas canónicas**:
- **Una entidad puede tener múltiples embeddings** (uno por dimensión semántica).
- Los embeddings tienen `model_version`. Cambio de modelo = re-embedding planificado.

---

## 8. Engine — Signal

| Campo | Detalle |
|---|---|
| **Propósito** | Detectar **eventos relevantes** sobre entidades y exponerlos como hechos tipados. |
| **Inputs** | RawDocuments de Sources (prensa, BORME, contratación) + cambios del Data Layer + grafo (KG). |
| **Outputs** | `Signal[]` tipados: `change_of_control`, `funding_round`, `executive_change`, `new_office`, `public_contract`, `merger_filing`, etc. Cada señal: `entity_id`, `type`, `severity`, `timestamp`, `source`, `citations`. |
| **Spec canónico** | (No spec dedicado; reglas distribuidas en `ENTITY_MODEL.md` y los Copilots especializados). |
| **Entidades canónicas tocadas** | Lee: company, sector, territory, person. Produce: objetos `signal` (no son entidades canónicas pero tienen identidad propia). |
| **Estado** | `mock` — `UnavailableBlock` en UX. REQ-008 pendiente. |
| **REQs externos** | REQ-008 (BORME + prensa), REQ-009 (contratación pública), REQ-010 (M&A sectorial). |
| **Modos** | Híbrido — reglas explícitas + LLM clasificador. |
| **Observabilidad** | Nº señales/día, false positive rate (cuando el humano descarta), precisión por tipo. |
| **Riesgos / fallbacks** | Señal de baja severidad → silenciada en UX (`severity < threshold`), conservada para auditoría. |

**Reglas canónicas**:
- Toda señal cita su(s) fuente(s) con URL/identificador externo.
- Toda señal tiene `severity` ∈ `low|medium|high|critical`.
- Las señales son **inmutables** una vez emitidas; correcciones son nuevas señales que referencian la anterior.

---

## 9. Engine — Matching

| Campo | Detalle |
|---|---|
| **Propósito** | Emparejar dos extremos (mandato↔company, opportunity↔company, company↔company) produciendo objetos `match` con score, razones y trazabilidad. |
| **Inputs** | KG (relaciones), Embeddings (similitud semántica), Signal (señales activas que activan matches), entidades canónicas. |
| **Outputs** | Entidades **`match`** (canónicas de primer nivel — decisión Sprint 0.5 G2.M). Cada match: `id`, `match_type`, `origin`, `destination`, `score`, `fit_factors`, `phase`, `audit_trail`. |
| **Spec canónico** | `ENTITY_MODEL.md` §5.7; anatomía UX en `ENTITY_FRAMEWORK.md` §11.13. |
| **Entidades canónicas tocadas** | Crea: `match`. Lee: company, mandate, opportunity, sector, territory. Puede derivar: `operation`. |
| **Estado** | `mock` — engine de matching determinista basado en grafo + heurísticas. Versión real pendiente. |
| **REQs externos** | REQ-005 (recommend engine real), REQ-011 (matching engine cross-org). |
| **Modos** | Determinista (matchers explícitos) + asistido (LLM expone razones legibles). |
| **Observabilidad** | Nº matches/día, distribución de score, tasa de conversión `match → operation`, tasa de descarte con motivo. |
| **Riesgos / fallbacks** | Engine offline → no se generan nuevos matches; los existentes siguen siendo navegables. Nunca emite matches con score sin razones legibles. |

**Reglas canónicas**:
- **Match es entidad canónica de primer nivel**. Tiene ficha (`/match/{id}`), Copilot especializado (`Match Advisor`), ciclo de vida observable.
- Ciclo de vida: `detected → reviewed → contacted → engaged → converted_to_operation | discarded`.
- Si un `match` se convierte en `operation`, queda referenciado como `operation.origin_match_id`.
- Todo match tiene **fit_factors[]** desglosado por dimensión (sectorial, financiero, geográfico, estratégico) — no solo un score global.

---

## 10. Engine — Recommendation

| Campo | Detalle |
|---|---|
| **Propósito** | Sugerir acciones, entidades, oportunidades al usuario en función del contexto actual. |
| **Inputs** | Entidad actual (UX), historial del usuario (Memory), grafo (KG), embeddings, matches activos. |
| **Outputs** | Recomendaciones tipadas: `recommend_company`, `recommend_opportunity`, `recommend_action`, `recommend_next_step`. Cada una con `reason` legible. |
| **Spec canónico** | Skills definidas en `COPILOTS_SPEC.md` y comportamiento integrado en `TRANSACTION_COPILOT_SPEC.md`. |
| **Entidades canónicas tocadas** | Lee todas, no muta. Produce sugerencias asociadas a la sesión actual. |
| **Estado** | `partial` — heuristic fallback + LLM router operativo (`route-intent.ts`). REQ-005 pendiente. |
| **REQs externos** | REQ-005 (recommend engine real). |
| **Modos** | Híbrido — LLM router de intents + scoring determinista. |
| **Observabilidad** | CTR de recomendaciones, conversión, dwell time post-recomendación. |
| **Riesgos / fallbacks** | LLM router falla → cae a heurísticas. Heurísticas insuficientes → empty state con CTA explícito. |

**Reglas canónicas**:
- Toda recomendación tiene **razón visible** ("Te lo sugerimos porque…").
- Recomendaciones no son persistentes — son derivadas del contexto de sesión.
- Recomendar `match` ya existente NO crea uno nuevo; navega al existente.

---

## 11. Engine — Valuation

| Campo | Detalle |
|---|---|
| **Propósito** | Producir valoraciones cuantitativas de empresas con metodología trazable. |
| **Inputs** | Entidades canónicas (company + comparables del KG + financieros del Data Layer), embeddings para comparables semánticos, señales (afectan ajustes). |
| **Outputs** | Entidad `valuation` con `central_value`, `range_low`, `range_high`, `method`, `comparables_used[]`, `assumptions[]`, `confidence`. |
| **Spec canónico** | `ENTITY_MODEL.md` §5 (entidad valuation); UX en `ENTITY_FRAMEWORK.md` §11.4. |
| **Entidades canónicas tocadas** | Crea: `valuation`. Lee: `company`, otras `valuation` (comparables). |
| **Estado** | `partial` — versión simplificada determinista (`central = revenue * 1.5`). Versión real pendiente. |
| **REQs externos** | REQ-004 (Agency Tool Valuation Engine). |
| **Modos** | Híbrido — fórmulas deterministas + LLM para narrative justificativa. |
| **Observabilidad** | Valoraciones por sector/territorio, dispersión vs precios reales en operaciones cerradas, tasa de re-valoración. |
| **Riesgos / fallbacks** | Datos financieros insuficientes → `valuation.confidence='low'` y disclaimer explícito. Nunca emite valoración sin disclaimer si los inputs son insuficientes. |

**Reglas canónicas**:
- Toda valoración cita comparables y método.
- Toda valoración tiene **rango**, no solo punto central.
- Cambios de método versionan la valoración (`valuation_revision`).

---

## 12. Engine — Risk

| Campo | Detalle |
|---|---|
| **Propósito** | Identificar riesgos asociados a entidades y operaciones, tipificarlos y proponer mitigaciones. |
| **Inputs** | Company (Data Layer), grafo (relaciones), señales recientes, valoraciones, fase de la operación (`Transaction OS`). |
| **Outputs** | `Risk[]` tipados: `financial`, `legal`, `regulatory`, `reputational`, `operational`, `strategic`. Cada riesgo con `severity`, `likelihood`, `mitigation`. |
| **Spec canónico** | (No spec dedicado; integrado en `TRANSACTION_OS_SPEC.md` fase DD y en narrative del `AnalyzeSkill`.) |
| **Entidades canónicas tocadas** | Lee todas, produce `risk` asociadas a `company`, `operation` o `valuation`. |
| **Estado** | `mock` — riesgos extraídos por `AnalyzeSkill` (LLM). Engine dedicado pendiente. |
| **REQs externos** | REQ-012 (risk engine cuantitativo). |
| **Modos** | Híbrido — reglas explícitas (compliance) + LLM (análisis cualitativo). |
| **Observabilidad** | Distribución de riesgos por tipo, tasa de mitigación efectiva (cuando el riesgo se cierra). |
| **Riesgos / fallbacks** | Engine fallido → riesgos del último análisis se conservan con flag `stale=true`. |

**Reglas canónicas**:
- Todo riesgo tiene **mitigación propuesta** (puede ser "no acción", pero explícito).
- Riesgos de severity `critical` bloquean transiciones de fase en el OS (`TRANSACTION_OS_SPEC.md`).

---

## 13. Engine — Transaction (OS)

| Campo | Detalle |
|---|---|
| **Propósito** | Sistema operativo del ciclo end-to-end de una operación M&A. Define fases, estados, transiciones, eventos. |
| **Inputs** | Entidades canónicas (`mandate`, `opportunity`, `match`, `company`), valoraciones, riesgos, señales relevantes a la operación. |
| **Outputs** | Estado canónico de cada `operation`: `current_phase ∈ {nda, im, qa, loi, dd, negotiation, spa, closing, integration}`, `journey_phase ∈ T1…T15`, `events[]`, `documents[]`, `counterparts[]`. |
| **Spec canónico** | **`TRANSACTION_OS_SPEC.md` (v1.2.0)** — fuente de verdad. |
| **Entidades canónicas tocadas** | Crea y muta: `operation`, `document`, eventos. Lee: `mandate`, `opportunity`, `match`, `company`, `valuation`, `risk`. |
| **Estado** | `mock` — modelo canónico definido en spec. Implementación de producto pendiente (Sprint posteriores). |
| **REQs externos** | (Ninguno externo — es producto puro.) |
| **Modos** | Determinista. Las transiciones de fase son reglas explícitas. |
| **Observabilidad** | Tiempo medio por fase, tasa de avance T1→T15, tasa de drop por fase, conversión `match → operation`. |
| **Riesgos / fallbacks** | Transición inválida → bloqueada con motivo legible en UX. Riesgo crítico en fase DD → bloquea SPA hasta resolución. |

**Reglas canónicas**:
- Fases canónicas del journey: `T1`…`T15` (ver `TRANSACTION_OS_SPEC.md` §3).
- Fases canónicas del `operation.current_phase`: `nda → im → qa → loi → dd → negotiation → spa → closing → integration` (decisión G2.O del Ciclo B).
- Toda transición de fase emite un evento canónico (`phase_transition`) con `from`, `to`, `actor`, `timestamp`.

---

## 14. Engine — Copilots (Agentic Layer)

| Campo | Detalle |
|---|---|
| **Propósito** | Capa agéntica del producto. Orquesta perception → reasoning → action → reflection sobre el resto de motores para conversar con el usuario y ejecutar tareas. |
| **Inputs** | Estado de todos los motores upstream + memoria (Memory Engine) + intent del usuario. |
| **Outputs** | `section_updates[]` (delta para la UX), nuevos objetos canónicos creados/mutados (delegando a motores específicos), conversaciones persistidas. |
| **Spec canónico** | **`COPILOTS_SPEC.md` (v1.1.0)** — catálogo y contrato común. **`TRANSACTION_COPILOT_SPEC.md` (v1.2.0)** — el Copilot de transacción. **`AGENTIC_LAYERS_SPEC.md` (v1.1.0)** — las 4 capas agénticas. **`MEMORY_ENGINE_SPEC.md` (v1.1.0)** — memoria. |
| **Entidades canónicas tocadas** | Lee y opera sobre **todas**. Persiste `conversation` y `memory_item`. |
| **Estado** | `partial` — Copilot transversal + Company Advisor operativo. Resto del catálogo pendiente. |
| **REQs externos** | REQ-005 (recommend), REQ-013 (Match Advisor). |
| **Modos** | Estocástico (LLM) + determinista (tool execution). |
| **Observabilidad** | Latencia turn-to-turn, coste por turn, tasa de tool-use, tasa de escalado a humano, satisfacción (NPS local). |
| **Riesgos / fallbacks** | LLM provider caído → fallback a respuestas precomputadas + degradación visible. Tool execution falla → mensaje claro en el dock. |

**Reglas canónicas**:
- **Las 4 capas agénticas** del `AGENTIC_LAYERS_SPEC.md` se ejecutan **en orden** en cada turno: perception (qué hay) → reasoning (qué hacer) → action (hacerlo) → reflection (qué aprender).
- Toda acción que muta estado canónico (crea operación, descarta match, avanza fase) requiere **confirmación humana explícita** salvo en modo `autonomous` (definido por plan + permiso).
- Memoria respeta `scope`: una memoria de entidad no contamina otra.
- Copilots especializados se invocan **dentro del scope de su entidad**. El transversal navega entre entidades.

---

## 15. Engine — UX Surface

| Campo | Detalle |
|---|---|
| **Propósito** | Última capa de la cadena. Convierte los outputs de los motores en experiencia visual coherente. |
| **Inputs** | `section_updates[]` de Copilots + estado canónico de todas las entidades + permisos del usuario. |
| **Outputs** | Renderizado de fichas, dock conversacional, navegación, estados visuales. |
| **Spec canónico** | **`ENTITY_FRAMEWORK.md` (v1.1.0)** — anatomía y composición. **`DESIGN_SYSTEM.md`** — visual. **`ARROBA_PHILOSOPHY.md` §12** — principios UX. |
| **Entidades canónicas tocadas** | Lee todas; no muta directamente (delega via Copilots o acciones tipificadas). |
| **Estado** | `prod` parcial — Empresa implementada; resto pendiente. |
| **REQs externos** | (Ninguno externo — capa de producto.) |
| **Modos** | Determinista (composición declarativa de secciones). |
| **Observabilidad** | Tiempo en ficha, tasa de uso del dock por entidad, tasa de upgrade desde locks. |
| **Riesgos / fallbacks** | Datos faltantes → `EmptyStateBlock` con CTA. Permiso insuficiente → `LockedSectionBlur`. REQ pendiente → `UnavailableBlock` con REQ-XXX visible. |

**Reglas canónicas**:
- Orden top→bottom de secciones es **estricto** (`ENTITY_FRAMEWORK.md` §4).
- Cada sección sabe comportarse en los **estados canónicos**: loading, empty, locked, error, unavailable, updating.
- El dock conversacional es **único** para todo el producto (CopilotProvider global).

---

## 16. Flujo end-to-end ilustrativo

> **Escenario**: usuario en `/empresa/B12345678` (Kitchen Studio, S.L.) escribe "encuentra compradores potenciales".

```
1. UX Surface
   ├─ Detecta intent del Copilot transversal.
   └─ Envía turno al Copilot con contexto: entidad actual = company B12345678.

2. Copilots (Agentic Layer)
   ├─ Perception: lee company, su sector, su valoración reciente, sus señales.
   ├─ Reasoning: identifica skill = "recommend_buyers_for_company".
   ├─ Action: invoca Recommendation Engine con scope { company, intent: "find_buyers" }.
   └─ Reflection: registra en memoria que el usuario pidió compradores en esta entidad.

3. Recommendation Engine
   ├─ Consulta KG: empresas relacionadas por sector/territorio/competidores.
   ├─ Consulta Embeddings: empresas semánticamente similares al perfil objetivo.
   ├─ Consulta Matching: ¿hay matches activos con esta company como destino?
   └─ Devuelve lista de candidatos rankados con razones.

4. Matching Engine (en paralelo)
   ├─ Para cada candidato sin match previo: evalúa fit_factors.
   ├─ Si fit > threshold y no existe match → crea entidad `match` (estado: detected).
   └─ Devuelve los match IDs al Recommendation.

5. Recommendation Engine
   └─ Compone `recommend_companies` con razones legibles + links a `match`.

6. Copilots
   └─ Compone `section_updates[]`:
       - Sección "Oportunidades" → enriquecida con candidatas.
       - Sección "Acciones" → añade "Convertir match en operación".

7. UX Surface
   └─ Aplica `section_updates`, anima `section-pulse`, dock confirma.

8. Memory Engine (en background)
   └─ Sintetiza el turno en memoria long-term scope=company B12345678.

9. Signal Engine (continuo)
   └─ Si más adelante una de las candidatas tiene un evento `funding_round` →
      retroalimenta a Matching Engine para re-scoring del match.
```

**Trazabilidad**: cualquier candidate mostrado al usuario puede rastrearse hasta la fuente que originó el dato (Sources), pasando por Data Layer → KG → Matching → Recommendation → Copilot → UX.

---

## 17. Contratos entre motores

> **Cada par de motores conectados habla un dialecto definido.** Aquí se listan los contratos canónicos. Estos contratos son **el qué**, no el cómo (el cómo vive en el spec del motor receptor).

| Pareja (upstream → downstream) | Contrato | Spec de referencia |
|---|---|---|
| Sources → Data Layer | `RawDocument { source_type, source_id, timestamp, payload, citations }` | (convención distribuida) |
| Data Layer → KG | `CanonicalEntity { type, id, slug, fields, revision }` | `ENTITY_MODEL.md` §4 |
| KG → Embeddings | `EntityForEmbedding { entity_id, text_corpus, dimensions[] }` | `MEMORY_ENGINE_SPEC.md` |
| KG → Signal | `EntityForSignalScan { entity_id, recent_changes[] }` | (convención) |
| KG/Embeddings → Matching | `MatchableEntity { entity_id, vectors, relations }` | `ENTITY_MODEL.md` §5.7 |
| Matching → Recommendation | `MatchObject { id, score, fit_factors[], origin, destination }` | `ENTITY_MODEL.md` §5.7 |
| Recommendation/Valuation/Risk → Copilots | `EngineOutput { type, payload, citations, confidence }` | `COPILOTS_SPEC.md` |
| Copilots → UX | `section_updates[] { section_id, action: 'set'|'patch'|'lock'|'unavailable', data }` | `ARROBA_PHILOSOPHY.md` §12 |
| OS → Copilots | `OperationState { operation_id, current_phase, journey_phase, allowed_transitions[] }` | `TRANSACTION_OS_SPEC.md` |
| Signal → Matching/Recommendation | `Signal { entity_id, type, severity, timestamp, citations }` | (convención) |
| Cualquier motor → Memory | `MemoryItem { scope, key, value, ttl, citations }` | `MEMORY_ENGINE_SPEC.md` |

**Reglas comunes de los contratos**:
- Todos los outputs incluyen `citations[]` cuando se basan en fuentes externas.
- Todos los outputs incluyen `confidence ∈ [0,1]` cuando hay incertidumbre.
- Todos los outputs incluyen `timestamp` (creación) y, si aplica, `valid_until`.
- Todos los outputs son **inmutables**; correcciones son outputs nuevos que referencian al anterior.

---

## 18. Gobierno de la cadena

### 18.1 Quién decide cambios

| Tipo de cambio | Decisor |
|---|---|
| Nuevo motor en la cadena | Decisión canónica (capa 1 + capa 4) — requiere consenso usuario + spec dedicado. |
| Nuevo contrato entre motores | Capa 4 — spec del motor receptor versionado. |
| Cambio de modelo interno de un motor | El motor (versión patch o minor). |
| Cambio de un spec del Sprint 0 | Versión menor: spec versionado. Versión mayor: requiere baseline freeze. |

### 18.2 Modos de degradación

Cuando un motor cae, los downstream **deben** comportarse así:

| Motor caído | Comportamiento esperado de downstream |
|---|---|
| Sources | Data Layer marca entidades como `stale`. UX muestra `freshness` indicators. |
| Data Layer | KG, Embeddings, Signal en pausa. UX muestra banner "datos no actualizándose". |
| KG | Matching y Recommendation degradan a queries textuales. Bandera `degraded_graph=true`. |
| Embeddings | Matching y Recommendation caen a heurísticas. `degraded_semantic=true`. |
| Signal | Sin señales nuevas; UX muestra señales existentes con timestamp visible. |
| Matching | No se crean nuevos matches; los existentes siguen navegables. |
| Recommendation | Empty state con CTA "Volver a intentar". |
| Valuation | Valoraciones existentes navegables; nuevas bloqueadas con motivo. |
| Risk | Análisis previo conservado con `stale=true`. |
| Transaction (OS) | Lectura disponible; escritura (transiciones de fase) bloqueada con motivo. |
| Copilots | Dock muestra mensaje claro y permite reintentar. |
| UX Surface | (Es la capa terminal; no aplica.) |

### 18.3 Observabilidad transversal

Cada motor debe exponer al menos:
- `health` (`up`, `degraded`, `down`).
- `latency_p50`, `latency_p99`.
- `error_rate` (últimos N minutos).
- `throughput` (operaciones/min).
- `version` (semver del motor).

---

## 19. Evolución y versionado

### 19.1 Cómo se añade un motor nuevo a la cadena

1. Identificar **qué transformación cualitativa nueva** aporta.
2. Crear su spec en `/app/memory/specs/` si es de la capa 4. Si es más bajo nivel (infraestructura), basta convención documentada.
3. Declarar contratos: upstream e inputs, downstream y outputs (§17).
4. Añadir entrada en este documento (§4-§15).
5. Bumpear este `ENGINE_ARCHITECTURE.md` a versión menor.

### 19.2 Cómo se decomisiona un motor

1. Marcar como **deprecated** en su sección.
2. Definir motor sucesor + contrato de migración.
3. Mantener compatibilidad durante una baseline completa (deprecation window).
4. Decomisionar en la siguiente baseline.

### 19.3 Versionado de este documento

- Patch (v1.0.x): clarificaciones, corrección de erratas.
- Menor (v1.x.0): nuevo motor, nuevo contrato, cambio de modo en un motor.
- Mayor (vX.0.0): reorganización estructural de la cadena (orden de motores, eliminación de un motor).

---

> **Fuentes de verdad relacionadas**:
> - `/app/memory/specs/TRANSACTION_OS_SPEC.md` · `TRANSACTION_COPILOT_SPEC.md` · `COPILOTS_SPEC.md` · `MEMORY_ENGINE_SPEC.md` · `AGENTIC_LAYERS_SPEC.md` · `MONETIZATION_SPEC.md`
> - `/app/memory/ENTITY_MODEL.md` (ontología de las entidades que producen/consumen los motores)
> - `/app/memory/ENTITY_FRAMEWORK.md` (UX surface)
> - `/app/memory/ARROBA_PHILOSOPHY.md` (capa 1 estratégica)
>
> Este documento (`ENGINE_ARCHITECTURE.md`) declara la **cadena horizontal** que conecta los motores definidos en los specs verticales.
