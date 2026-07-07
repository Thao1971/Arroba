# arroba.com — ARCHITECTURE MAP v1.0

> **Mapa visual y tablas compactas de la arquitectura de arroba.com — Canonical Baseline v1.0** (congelada 2026-06-25).
>
> Documento orientado a comprensión rápida. ASCII art + tablas. NO sustituye al canon: lo visualiza.

---

## Índice

1. [Mapa de capas canónicas](#1-mapa-de-capas-canónicas)
2. [Mapa de la cadena de motores](#2-mapa-de-la-cadena-de-motores)
3. [Mapa de entidades canónicas](#3-mapa-de-entidades-canónicas)
4. [Mapa del journey de transacción (T1…T15)](#4-mapa-del-journey-de-transacción-t1t15)
5. [Mapa de fases de `operation.current_phase`](#5-mapa-de-fases-de-operationcurrent_phase)
6. [Mapa del catálogo de Copilots](#6-mapa-del-catálogo-de-copilots)
7. [Mapa de las capas agénticas](#7-mapa-de-las-capas-agénticas)
8. [Mapa de la memoria](#8-mapa-de-la-memoria)
9. [Mapa de la composición UX por entidad](#9-mapa-de-la-composición-ux-por-entidad)
10. [Mapa de monetización](#10-mapa-de-monetización)
11. [Mapa de archivos canónicos](#11-mapa-de-archivos-canónicos)

---

## 1. Mapa de capas canónicas

```
            CAPA 1 ───── Blueprint Estratégico              ┐
                         ARROBA_PHILOSOPHY.md (v3.0)        │  Estrategia
                                                            │
            CAPA 2 ───── UX Blueprint                       │
                         ARROBA_PHILOSOPHY.md §12           ┘

            CAPA 3 ───── Entity Framework                   ┐
                         ENTITY_MODEL.md  (v1.1.0)          │  Producto
                         ENTITY_FRAMEWORK.md (v1.1.0)       │
                                                            │
            CAPA 4 ───── Engines & Specs        ✨ NUEVO    │
                         specs/TRANSACTION_OS_SPEC          │
                         specs/TRANSACTION_COPILOT_SPEC     │
                         specs/COPILOTS_SPEC                │
                         specs/MEMORY_ENGINE_SPEC           │
                         specs/AGENTIC_LAYERS_SPEC          │
                         specs/MONETIZATION_SPEC            ┘

            CAPA 5 ───── Design System                      ┐
                         DESIGN_SYSTEM.md                   │
                                                            │  Realización
            CAPA 6 ───── Diseños                            │
                         /app/_design_intake/               │
                                                            │
            CAPA 7 ───── Implementación                     │
                         /app/frontend, /app/backend        ┘

            Regla: capa N nunca contradice a capa N-1.
```

| Capa | Propósito | Quién manda en conflictos |
|---|---|---|
| 1 | Visión, principios, modelo de producto | Sobre todas las demás |
| 2 | Reglas conversacionales transversales | Sobre 3, 4, 5, 6, 7 |
| 3 | Ontología + arquitectura UX | Sobre 4, 5, 6, 7 |
| 4 | Motores y contratos | Sobre 5, 6, 7 |
| 5 | Tokens + primitives + estados | Sobre 6, 7 |
| 6 | Producción visual concreta | Sobre 7 |
| 7 | Código | (última capa) |

---

## 2. Mapa de la cadena de motores

```
                ┌──────────┐
                │ SOURCES  │  Mundo externo + uploads
                └────┬─────┘
                     │
                ┌────▼─────┐
                │   DATA   │  Normalización + identidad canónica
                │  LAYER   │
                └────┬─────┘
                     │
                ┌────▼─────┐
                │ KNOWLEDGE│  Grafo dirigido tipado
                │   GRAPH  │  (nodes = entidades, edges = relaciones)
                └─┬──────┬─┘
                  │      │
        ┌─────────┘      └──────────┐
        ▼                            ▼
   ┌─────────┐                  ┌─────────┐
   │EMBEDDIN-│                  │ SIGNAL  │  Eventos tipados (BORME, prensa, …)
   │   GS    │                  │         │
   └────┬────┘                  └────┬────┘
        │                            │
        └──────────┬─────────────────┘
                   ▼
              ┌─────────┐
              │MATCHING │  Produce entidades `match` (1er nivel)
              └────┬────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
   ┌──────┐   ┌──────┐    ┌──────┐
   │RECOMM│   │VALUA-│    │ RISK │
   │ END  │   │ TION │    │      │
   └───┬──┘   └──┬───┘    └──┬───┘
       │         │           │
       └─────────┼───────────┘
                 ▼
         ┌──────────────┐
         │TRANSACTION OS│  15 fases T1…T15 · current_phase
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │   COPILOTS   │  Agentic: perception → reasoning → action → reflection
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │  UX SURFACE  │  Entity Framework · Design System
         └──────────────┘
```

| Motor | Spec / Doc canónico | Estado |
|---|---|---|
| Sources | (convención por adapter) | partial |
| Data Layer | `ENTITY_MODEL.md` | partial |
| Knowledge Graph | `ENTITY_MODEL.md` §5-§6 | partial |
| Embeddings | `MEMORY_ENGINE_SPEC.md` | mock |
| Signal | (convención + `AnalyzeSkill`) | mock |
| Matching | `ENTITY_MODEL.md` §5.7 + `ENTITY_FRAMEWORK.md` §11.13 | mock |
| Recommendation | `COPILOTS_SPEC.md` | partial |
| Valuation | `ENTITY_MODEL.md` §5 + simplificación E1.4 | partial |
| Risk | embebido en Analyze | mock |
| Transaction OS | `TRANSACTION_OS_SPEC.md` | mock |
| Copilots | `COPILOTS_SPEC.md` + `TRANSACTION_COPILOT_SPEC.md` + `AGENTIC_LAYERS_SPEC.md` + `MEMORY_ENGINE_SPEC.md` | partial |
| UX Surface | `ENTITY_FRAMEWORK.md` + `DESIGN_SYSTEM.md` | prod parcial |

---

## 3. Mapa de entidades canónicas

```
       PRIMARIAS DEL DOMINIO                  ACTORES                  TRANSACCIONALES
       ─────────────────────                  ───────                  ──────────────
        ┌──────────┐                        ┌──────────┐               ┌──────────┐
        │ company  │←─────related───────────│ person   │       ┌──────│ mandate  │
        └────┬─────┘                        └──────────┘       │      └────┬─────┘
             │                                                  │           │
             │ in                                                │           │ origin
             ▼                                                   ▼           ▼
        ┌──────────┐                                       ┌──────────┐ ┌──────────┐
        │ sector   │                                       │ advisor  │ │opportunity│
        └────┬─────┘                                       └──────────┘ └────┬─────┘
             │                                                                │
             │ in                                                              │ source
             ▼                                                                 ▼
        ┌──────────┐                                                     ┌──────────┐
        │territory │                                                     │  match   │ ✨ 1er nivel
        └──────────┘                                                     └────┬─────┘
                                                                               │
                                                                               │ converts_to
                                                                               ▼
        ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
        │valuation │         │ document │         │   user   │         │operation │
        └──────────┘         └──────────┘         └──────────┘         └──────────┘

                                ┌──────────────┐
                                │ organization │
                                └──────────────┘
```

| Tipo | URL | Spec / Ficha |
|---|---|---|
| `company` | `/empresa/{cif}` | ✅ implementada |
| `sector` | `/sector/{slug}` | 🔵 E1.6 |
| `territory` | `/territorio/{slug}` | 🔵 E1.7 |
| `person` | `/persona/{slug}` | 🔵 backlog |
| `advisor` | `/advisor/{slug}` | 🔵 backlog |
| `mandate` | `/mandato/{id}` | 🔵 backlog |
| `operation` | `/operacion/{id}` | 🔵 E2.0 |
| `valuation` | `/valoracion/{id}` | 🔵 E1.8 |
| `document` | `/documento/{id}` | 🔵 backlog |
| `opportunity` | `/oportunidad/{id}` | 🔵 E1.9 |
| **`match`** ✨ | `/match/{id}` | 🔵 backlog (Sprint 5) |
| `user` | (sin ficha pública) | (modelo interno) |
| `organization` | `/org/{slug}` | (existente como `arroba_team` y demo) |

> ✨ Match pasa a ser una entidad canónica de primer nivel (decisión Sprint 0.5 Ciclo B).

---

## 4. Mapa del journey de transacción (T1…T15)

```
   ORIGINATION    │     SOURCING       │     PROCESS         │       CLOSE        │ INTEGRATION
   ───────────    │     ────────       │     ───────         │       ─────        │ ───────────

   T1  Origin   ──┐                    │                     │                    │
   T2  Mandate    │   T4  Sourcing  ──┐│                     │                    │
   T3  Valuation ─┘   T5  Outreach ───┘│   T6   NDA      ────┐                    │
                                       │   T7   Info Memo    │                    │
                                       │   T8   Q&A          │                    │
                                       │   T9   IOI          │                    │
                                       │   T10  LOI          │                    │
                                       │   T11  DD       ────│  T12 Negotiation──┐│
                                       │                     │  T13 SPA          ││
                                       │                     │  T14 Closing      ││
                                       │                     │                   │└──┐
                                       │                     │                   │   ▼
                                       │                     │                   │  T15 Integration
```

| Fase | Nombre | Quién lidera | Spec |
|---|---|---|---|
| T1 | Origination | Mandante / advisor / sistema | `TRANSACTION_OS_SPEC.md` §3 |
| T2 | Mandate | Mandante + advisor | id. |
| T3 | Valuation | Valuation engine | id. |
| T4 | Sourcing | Matching engine + user | id. |
| T5 | Outreach | User + Copilot | id. |
| T6 | NDA | User + counterparts | id. |
| T7 | Info Memo | User | id. |
| T8 | Q&A | Counterparts | id. |
| T9 | IOI | Counterparts | id. |
| T10 | LOI | Counterparts | id. |
| T11 | DD | Counterparts + Risk | id. |
| T12 | Negotiation | Counterparts | id. |
| T13 | SPA | Counterparts + legal | id. |
| T14 | Closing | Legal + bancos | id. |
| T15 | Integration | Comprador + target | id. |

---

## 5. Mapa de fases de `operation.current_phase`

> Fases canónicas del campo `current_phase` de una `operation`. Orden estricto. Las transiciones inválidas son bloqueadas por el Transaction OS.

```
   ┌─────┐    ┌────┐    ┌────┐    ┌─────┐    ┌────┐    ┌────────────┐    ┌─────┐    ┌─────────┐    ┌─────────────┐
   │ nda │ ─► │ im │ ─► │ qa │ ─► │ loi │ ─► │ dd │ ─► │ negotiation │ ─► │ spa │ ─► │ closing │ ─► │ integration │
   └─────┘    └────┘    └────┘    └─────┘    └────┘    └────────────┘    └─────┘    └─────────┘    └─────────────┘
```

| current_phase | Acciones típicas | Bloqueos |
|---|---|---|
| `nda` | Firmar NDA con counterpart | Sin acceso al IM hasta firma |
| `im` | Compartir Information Memo | — |
| `qa` | Responder a preguntas | — |
| `loi` | Recibir Letter of Intent | — |
| `dd` | Due diligence | Risk crítico bloquea avance a `negotiation` |
| `negotiation` | Negociar términos | — |
| `spa` | Firmar Sale & Purchase Agreement | — |
| `closing` | Cierre legal y bancario | — |
| `integration` | Integración post-cierre | (estado terminal) |

---

## 6. Mapa del catálogo de Copilots

```
                       ┌──────────────────────────────┐
                       │  COPILOT TRANSVERSAL         │
                       │  (global, en cualquier ruta) │
                       └─────────────┬────────────────┘
                                     │
       ┌─────────────┬───────────────┼───────────────┬──────────────┐
       ▼             ▼               ▼               ▼              ▼
  ┌─────────┐  ┌─────────┐    ┌────────────┐   ┌─────────────┐ ┌─────────┐
  │ Company │  │ Sector  │    │ Territory  │   │ Valuation   │ │  Match  │ ✨
  │ Advisor │  │ Analyst │    │  Analyst   │   │  Advisor    │ │ Advisor │
  └─────────┘  └─────────┘    └────────────┘   └─────────────┘ └─────────┘
                                       │
                       ┌───────────────┴────────────────┐
                       ▼                                ▼
                  ┌─────────────┐                ┌──────────────┐
                  │ Opportunity │                │     Deal     │
                  │   Advisor   │                │   Advisor    │
                  └─────────────┘                └──────────────┘
```

| Copilot | Scope | Especialización |
|---|---|---|
| Transversal | global | Navega, busca, dispara skills |
| Company Advisor | `company` | Análisis, valoración, comparables |
| Sector Analyst | `sector` | Tendencias, consolidación |
| Territory Analyst | `territory` | Empresas top, sectores regionales |
| Valuation Advisor | `valuation` | Justifica método y comparables |
| Opportunity Advisor | `opportunity` | Gestiona candidatas y pipeline |
| Deal Advisor | `operation` | Avanza fases, gestiona documentos |
| **Match Advisor** ✨ | `match` | Justifica score, propone conversión a operación |

Spec: `COPILOTS_SPEC.md` (catálogo + contrato común) + `TRANSACTION_COPILOT_SPEC.md` (Deal Advisor).

---

## 7. Mapa de las capas agénticas

```
           ┌────────────────────────────────────────────────┐
           │  TURN START                                    │
           └───────────────────────┬────────────────────────┘
                                   ▼
           ┌────────────────────────────────────────────────┐
           │  ① PERCEPTION                                  │
           │     ¿qué hay en el contexto?                   │
           │     entidad actual, memoria, signals, etc.     │
           └───────────────────────┬────────────────────────┘
                                   ▼
           ┌────────────────────────────────────────────────┐
           │  ② REASONING                                   │
           │     ¿qué hacer? Skill matching, planning       │
           └───────────────────────┬────────────────────────┘
                                   ▼
           ┌────────────────────────────────────────────────┐
           │  ③ ACTION                                      │
           │     Ejecutar: invocar engines, mutar canónicas │
           │     SIEMPRE confirmar humanamente cambios      │
           │     irreversibles (salvo plan autónomo)        │
           └───────────────────────┬────────────────────────┘
                                   ▼
           ┌────────────────────────────────────────────────┐
           │  ④ REFLECTION                                  │
           │     ¿qué aprendimos? Sintetizar en memoria,    │
           │     ajustar futuras decisiones                 │
           └───────────────────────┬────────────────────────┘
                                   ▼
           ┌────────────────────────────────────────────────┐
           │  TURN END                                      │
           └────────────────────────────────────────────────┘
```

Spec: `AGENTIC_LAYERS_SPEC.md`.

---

## 8. Mapa de la memoria

```
                   ┌──────────────────────────────────┐
                   │       MEMORY ENGINE              │
                   │                                  │
                   │  ┌────────────────────────────┐  │
                   │  │  SHORT-TERM (per-turn)     │  │
                   │  │  contexto del turno actual │  │
                   │  └────────────────────────────┘  │
                   │                                  │
                   │  ┌────────────────────────────┐  │
                   │  │  LONG-TERM (persistent)    │  │
                   │  │  scopes:                   │  │
                   │  │   · user                   │  │
                   │  │   · entity                 │  │
                   │  │   · org                    │  │
                   │  │   · cross-entity           │  │
                   │  │   · session                │  │
                   │  └────────────────────────────┘  │
                   │                                  │
                   │  ┌────────────────────────────┐  │
                   │  │  SYNTHESIS                 │  │
                   │  │  cuándo comprimir          │  │
                   │  │  qué retener / descartar   │  │
                   │  └────────────────────────────┘  │
                   │                                  │
                   │  ┌────────────────────────────┐  │
                   │  │  HYDRATION                 │  │
                   │  │  cargar contexto al entrar │  │
                   │  │  en una entidad            │  │
                   │  └────────────────────────────┘  │
                   └──────────────────────────────────┘
```

Spec: `MEMORY_ENGINE_SPEC.md`.

---

## 9. Mapa de la composición UX por entidad

```
                  ┌────────────────────────────────────────┐
                  │   ANATOMÍA CANÓNICA DE UNA FICHA       │
                  │                                        │
                  │   1.  Breadcrumb        (chrome)       │
                  │   2.  Header            obligatorio    │
                  │   3.  Hero              opcional       │
                  │   4.  KPIs              opcional       │
                  │   5.  Insights          opcional       │
                  │   6.  Análisis          opcional       │
                  │   7.  Señales           opcional       │
                  │   8.  Relaciones        opcional       │
                  │   9.  Oportunidades     opcional       │
                  │   10. Documentación     opcional       │
                  │   11. Actividad         opcional       │
                  │   12. Acciones          obligatorio    │
                  │                            (si auth)   │
                  │                                        │
                  │   ➕ Advisor: vive en el dock, no en   │
                  │      el flujo principal.               │
                  └────────────────────────────────────────┘

       Cada tipo de entidad ACTIVA / OMITE / ESPECIALIZA estos módulos.
       El orden es ESTRICTO. La especialización es declarativa.
```

Spec: `ENTITY_FRAMEWORK.md` §3, §4, §11.

---

## 10. Mapa de monetización

```
   ANON      FREE      PRO       PREMIUM        ENTERPRISE
   ────      ────      ───       ───────        ──────────
   header    fichas    +chat     +advisors      +SLA
   resumido  públicas  +alerts   +memoria       +cross-org
   no chat   no chat   +export   +signals
                       +match    +valoración
                                 propia
```

| Plan | Lo que activa | Lo que mantiene locked |
|---|---|---|
| Anon | Header resumido + Hero + KPIs (resumidos) + Relaciones (top-3) | todo lo demás |
| Free | + chat básico transversal + fichas públicas completas | advisors especializados, match, signals, memoria persistente |
| Pro | + match activo + signals + memory user + export | advisors especializados (algunos), valoración propia |
| Premium | + advisors completos + valoración propia + signals premium | cross-org matching |
| Enterprise | + SLA + cross-org matching + integraciones custom | (top tier) |

Spec: `MONETIZATION_SPEC.md`. Cifras concretas pendientes (G3, decisión de producto).

---

## 11. Mapa de archivos canónicos

```
/app/memory/
│
├── ARROBA_PHILOSOPHY.md             ← CAPA 1 + CAPA 2 (§12 = UX Blueprint)
│
├── ENTITY_MODEL.md                  ← CAPA 3 (ontología)
├── ENTITY_FRAMEWORK.md              ← CAPA 3 (arquitectura UX)
│
├── specs/
│   ├── TRANSACTION_OS_SPEC.md       ← CAPA 4
│   ├── TRANSACTION_COPILOT_SPEC.md  ← CAPA 4
│   ├── COPILOTS_SPEC.md             ← CAPA 4
│   ├── MEMORY_ENGINE_SPEC.md        ← CAPA 4
│   ├── AGENTIC_LAYERS_SPEC.md       ← CAPA 4
│   ├── MONETIZATION_SPEC.md         ← CAPA 4
│   ├── CANON_AUDIT_REPORT.md        ← AUDIT
│   └── OPEN_ITEMS_CLASSIFICATION.md ← AUDIT
│
├── DESIGN_SYSTEM.md                 ← CAPA 5
│
├── CANON_INDEX.md                   ← META (navegación)
├── ENGINE_ARCHITECTURE.md           ← META (motores)
├── SPRINT0_EXECUTIVE_SUMMARY.md     ← META (resumen)
├── ARCHITECTURE_MAP.md              ← META (este documento)
│
├── PRD.md                           ← ESTADO (vivo)
├── CHANGELOG.md                     ← ESTADO (vivo)
├── ARROBA_CANON.md                  ← CANON (puerta única)
├── ARROBA_ARCHITECTURAL_PRINCIPLES.md ← CANON (principios y reglas)
├── _INVENTORY_2026.md               ← ESTADO (vivo)
├── test_credentials.md              ← OPERATIVO
│
├── canonical_pack_v1.0.zip          ← PACK distribuible
└── canonical_pack_v1.0/             ← (carpeta fuente)
    ├── README.md
    ├── canonical/
    ├── specs/
    ├── audit/
    └── summary/
```

| Tipo | Carácter |
|---|---|
| **CANÓNICOS** | Declaran la arquitectura. No se modifican sin proceso. |
| **AUDIT** | Inventarios y clasificaciones de open items. Vigentes hasta su próxima auditoría. |
| **META** | Navegación, mapas, resúmenes. Generados en Sprint 0.5 Ciclo B. |
| **ESTADO** | Documentos vivos del proyecto. Se actualizan en cada sub-tarea. |
| **OPERATIVO** | Credenciales y similares. No canon. |
| **PACK** | Entregable inmutable de la baseline. |

---

> **Esta es la versión visual del canon.** Para consultar la versión textual completa, ver `CANON_INDEX.md` y los documentos referenciados.
