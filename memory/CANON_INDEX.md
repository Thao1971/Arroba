# arroba.com — CANON INDEX v1.0

> **Índice maestro del canon documental de arroba.com — Canonical Baseline v1.0** (congelada 2026-06-25 tras Sprint 0 + Sprint 0.5).
>
> Este documento NO contiene canon: **referencia** el canon. Es el punto de entrada navegable a toda la documentación canónica del proyecto. Si un documento no aparece aquí, no es canon.
>
> **Regla de precedencia**: en caso de conflicto entre dos documentos, **prevalece el de la capa superior** (capa 1 manda sobre capa 7). Dentro de una capa, la última versión publicada manda.

---

## Índice

0. [Puerta de entrada — `ARROBA_CANON.md`](#0-puerta-de-entrada--arroba_canonmd)
0.1. [Principios y reglas — `ARROBA_ARCHITECTURAL_PRINCIPLES.md`](#01-principios-y-reglas--arroba_architectural_principlesmd)
1. [Mapa de capas canónicas](#1-mapa-de-capas-canónicas)
2. [Capa 1 — Blueprint Estratégico](#2-capa-1--blueprint-estratégico)
3. [Capa 2 — UX Blueprint](#3-capa-2--ux-blueprint)
4. [Capa 3 — Entity Framework (ontología + arquitectura UX)](#4-capa-3--entity-framework-ontología--arquitectura-ux)
5. [Capa 4 — Engines & Specs (Sprint 0)](#5-capa-4--engines--specs-sprint-0)
6. [Capa 5 — Design System](#6-capa-5--design-system)
7. [Capa 6 — Diseños](#7-capa-6--diseños)
8. [Capa 7 — Implementación](#8-capa-7--implementación)
9. [Documentos de auditoría y consolidación](#9-documentos-de-auditoría-y-consolidación)
10. [Documentos transversales](#10-documentos-transversales)
11. [Reglas de evolución del canon](#11-reglas-de-evolución-del-canon)

---

## 0. Puerta de entrada — `ARROBA_CANON.md`

**Path**: `/app/memory/ARROBA_CANON.md`
**Estado**: ✅ Vigente (v1 · 2026-07-06).
**Función**: **puerta de entrada única al canon**. No contiene canon; declara dónde vive el canon vivo, la Source of Truth por ámbito, y la jerarquía de precedencia. Todo agente/humano/proceso que consulte el canon debe empezar aquí.

## 0.1. Principios y reglas — `ARROBA_ARCHITECTURAL_PRINCIPLES.md`

**Path**: `/app/memory/ARROBA_ARCHITECTURAL_PRINCIPLES.md`
**Estado**: ✅ Vigente (v1 · 2026-07-06).
**Función**: **única Source of Truth de principios y reglas arquitectónicas**. Formaliza:
- P1 · Explainability First
- P2 · Intelligence over Data
- P3 · Zero Coupling
- R11 · Visual Governance
- R12 · Nunca `/master/*`
- R13 · Source of Truth única por pantalla

Cualquier otro documento del canon puede referenciarlos pero no redefinirlos.

---

## 1. Mapa de capas canónicas

> **El proyecto está estructurado en siete capas conceptuales en orden estricto de prioridad.** La numeración expresa precedencia (capa 1 > capa 2 > … > capa 7) y orden de construcción.

```
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 1  ·  Blueprint Estratégico                                    │
│           ARROBA_PHILOSOPHY.md (v3.0)                                │
│           Visión, principios, modelo de producto, principios UX.     │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│  CAPA 2  ·  UX Blueprint                                             │
│           ARROBA_PHILOSOPHY.md §12 (Principios UX oficiales)         │
│           Reglas conversacionales transversales del producto.        │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│  CAPA 3  ·  Entity Framework                                         │
│           ENTITY_MODEL.md (v1.1.0) — ontología de datos              │
│           ENTITY_FRAMEWORK.md (v1.1.0) — arquitectura UX por entidad │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│  CAPA 4  ·  Engines & Specs        ✨ Sprint 0 — Canonical Baseline  │
│           specs/TRANSACTION_OS_SPEC.md (v1.2.0)                      │
│           specs/TRANSACTION_COPILOT_SPEC.md (v1.2.0)                 │
│           specs/COPILOTS_SPEC.md (v1.1.0)                            │
│           specs/MEMORY_ENGINE_SPEC.md (v1.1.0)                       │
│           specs/AGENTIC_LAYERS_SPEC.md (v1.1.0)                      │
│           specs/MONETIZATION_SPEC.md (v1.1.0)                        │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│  CAPA 5  ·  Design System                                            │
│           DESIGN_SYSTEM.md — tokens · primitives · estados · variants│
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│  CAPA 6  ·  Diseños                                                  │
│           Producción visual concreta (mockups, prototipos, intake).  │
│           NO vive en /app/memory; vive en /app/_design_intake.       │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────┐
│  CAPA 7  ·  Implementación                                           │
│           Código de producto (frontend/, backend/).                  │
│           Implementa lo que las capas 1-6 declaran.                  │
└──────────────────────────────────────────────────────────────────────┘
```

**Regla cardinal**: ninguna capa puede contradecir a una superior. Si la implementación rompe el spec, **se corrige la implementación**; nunca al revés.

---

## 2. Capa 1 — Blueprint Estratégico

### `ARROBA_PHILOSOPHY.md` (v3.0, definitiva)

**Path**: `/app/memory/ARROBA_PHILOSOPHY.md`
**Estado**: ✅ Canónico · alineado con Sprint 0.5 Ciclo B
**Función**: fuente de verdad estratégica del producto.

**Contenido canónico**:
- §1 Visión y posicionamiento (Transaction Operating System).
- §2 Modelo de producto (Entity First + Copilot Transversal).
- §3-§5 Entidades del dominio: empresa, sector, territorio, valoración, oportunidad, transacción/operación, **match**, advisor, mandato, persona, documento.
- §6-§7 Copilots transversal vs especializados.
- §8-§10 Memoria, monetización, evolución.
- §11 Acción inmediata por entidad.
- **§12 Principios UX oficiales** (capa 2 del proyecto).
- **§13 Capas canónicas** — Mapa de las 7 capas con regla de jerarquía. *Ampliada en Sprint 0.5 Ciclo B con la capa Engines & Specs.*

**Regla de oro**: si hay conflicto entre cualquier documento y `ARROBA_PHILOSOPHY.md`, gana este. El canon legacy ya está alineado tras Sprint 0.5 Ciclo B.

---

## 3. Capa 2 — UX Blueprint

### `ARROBA_PHILOSOPHY.md` §12 — Principios UX oficiales

**Path**: `/app/memory/ARROBA_PHILOSOPHY.md` (sección §12 dentro del documento maestro)
**Estado**: ✅ Canónico
**Función**: principios conversacionales transversales que aplican a cualquier Copilot, cualquier entidad y cualquier sección de la UX.

**Contenido**:
- Patrón canónico **chat → ficha** (la conversación actualiza secciones de la entidad).
- Patrón `section_updates[]` (estructura del delta que produce un Copilot).
- Estados visuales canónicos: `loading`, `empty`, `locked`, `error`, `unavailable`, `updating`.
- Reglas de animación (`animate-section-pulse`) y feedback.
- Reglas de disambiguator cuando el Copilot detecta intent ambigua.

---

## 4. Capa 3 — Entity Framework (ontología + arquitectura UX)

### `ENTITY_MODEL.md` (v1.1.0)

**Path**: `/app/memory/ENTITY_MODEL.md`
**Estado**: ✅ Canónico (Sprint 0.5 Ciclo B)
**Función**: ontología de datos del dominio. Qué entidades existen, qué campos tienen, qué relaciones declaran.

**Contenido canónico**:
- §1 Filosofía ontológica.
- §2 Principios (identidad, slug, versionado, soft delete).
- §3 Catálogo de tipos canónicos *(abstraído: enumerado sin cardinalidad)*.
- §4 Campos comunes.
- §5 Relaciones por entidad (subsecciones por tipo). **§5.7 Match** — entidad canónica de primer nivel (decisión G2.M del Ciclo B).
- §6 Grafo del producto.
- §7 Reglas de negocio.
- §8 Versionado.
- §9 Ejemplos JSON.
- §10 Principios de evolución.

**Decisiones recientes**:
- Renombre `client → user`.
- Match pasa a ser una entidad canónica de primer nivel.

### `ENTITY_FRAMEWORK.md` (v1.1.0)

**Path**: `/app/memory/ENTITY_FRAMEWORK.md`
**Estado**: ✅ Canónico (Sprint 0.5 Ciclo B)
**Función**: arquitectura UX canónica de la ficha de cualquier entidad.

**Contenido canónico**:
- §1-§2 Filosofía y qué es una entidad.
- §3 Anatomía canónica — módulos (Header, Hero, KPIs, Advisor, Insights, Análisis, Señales, Relaciones, Oportunidades, Documentación, Actividad, Acciones).
- §4 Orden obligatorio top→bottom.
- §5 Mapping a primitives del Design System.
- §6 Estados de módulo.
- §7 Responsive.
- §8 Navegación.
- §9 Reglas de composición (obligatorios universales, obligatorios por tipo, prohibidos por tipo, auth-gated).
- §10 Reglas de reutilización (especialización por prop, slots, no bifurcar masivamente).
- §11 Ejemplos completos por entidad. **§11.8 Operación** con fases canónicas. **§11.13 Match** (nuevo en Ciclo B).
- §12 Principios de evolución.

---

## 5. Capa 4 — Engines & Specs (Sprint 0)

> **Capa nueva incorporada formalmente en Sprint 0.5 Ciclo B**. Recoge los 6 specs producidos en Sprint 0 que definen los motores del producto. Cada spec es **fuente de verdad** sobre el motor que describe.

### 5.1 `specs/TRANSACTION_OS_SPEC.md` (v1.2.0)

**Función**: Sistema operativo de la transacción. Cómo arroba.com modela end-to-end el ciclo de una operación M&A.
**Contenido clave**:
- **15 fases canónicas `T1`…`T15`** del journey: origination, mandato, valoración, sourcing, contacto, NDA, IM, QA, IOI, LOI, DD, negotiation, SPA, closing, integration.
- Estados, transiciones permitidas, eventos canónicos por fase.
- Contrato del OS con el Copilot orquestador (`TRANSACTION_COPILOT_SPEC`).
- Modelo de actores y permisos por fase.
- KPIs y métricas operativas del OS.

### 5.2 `specs/TRANSACTION_COPILOT_SPEC.md` (v1.2.0)

**Función**: Copilot orquestador de la transacción. Contrato con el OS.
**Contenido clave**:
- Intents reconocidos por fase del OS.
- Catálogo de herramientas/skills disponibles para el Copilot.
- Reglas de gobernanza conversacional: cuándo proponer vs ejecutar, cuándo escalar a humano.
- Modos: anchored a operación · ephemeral · cross-operation.
- Contrato `section_updates[]` para actualizar la ficha de la operación.

### 5.3 `specs/COPILOTS_SPEC.md` (v1.1.0)

**Función**: catálogo y contrato común de los Copilots especializados por entidad.
**Contenido clave**:
- Catálogo: Company Advisor · Sector Analyst · Territory Analyst · Valuation Advisor · Opportunity Advisor · Deal Advisor · Match Advisor.
- Contrato común: identidad, scope, herramientas, memoria, contract de salida.
- Reglas de hand-off entre Copilots.
- Composición de prompts y grounding por entidad.

### 5.4 `specs/MEMORY_ENGINE_SPEC.md` (v1.1.0)

**Función**: capa de memoria del producto.
**Contenido clave**:
- Memoria corto plazo (turno-a-turno dentro de una conversación).
- Memoria largo plazo (persistente por entidad, por usuario, por organización).
- Sintetización: cuándo comprimir, qué retener, qué descartar.
- Hidratación: cómo cargar el contexto relevante al entrar en una entidad.
- Scopes: `user`, `entity`, `org`, `cross-entity`, `session`.
- Contratos de lectura/escritura desde Copilots y desde la UX.

### 5.5 `specs/AGENTIC_LAYERS_SPEC.md` (v1.1.0)

**Función**: capas agénticas que vertebran cualquier acción autónoma del producto.
**Contenido clave**:
- 4 capas: **perception** (qué observa el sistema), **reasoning** (cómo decide), **action** (qué ejecuta), **reflection** (qué evalúa después).
- Gobernanza: límites de autonomía, escalado a humano, modos seguros.
- Patrones de ejecución: tool-use, multi-step, agente delegado.
- Contrato con el resto de motores.

### 5.6 `specs/MONETIZATION_SPEC.md` (v1.1.0)

**Función**: modelo de negocio del producto.
**Contenido clave**:
- Planes y tiers.
- Gating funcional: qué se bloquea por plan, cómo se comunica el lock.
- Fricciones de upgrade: dónde se invitan los upgrades, qué patrones se evitan.
- Métricas de monetización: activación, conversión, churn, ARPU.
- Reglas de comunicación de precios (sin cifras concretas en spec).

---

## 6. Capa 5 — Design System

### `DESIGN_SYSTEM.md`

**Path**: `/app/memory/DESIGN_SYSTEM.md`
**Estado**: ✅ Canónico (no tocado en Sprint 0/0.5)
**Función**: tokens, primitives, estados, variants, reglas de composición visual.

**Contenido**:
- Nivel 1 — Tokens (color, tipografía, espaciado, radii, motion).
- Nivel 2 — Primitives (NarrativeBlock, MetricsBlock, EmptyStateBlock, LoadingBlock, ErrorBlock, LockedSectionBlur, UnavailableBlock, HeroBlock, CompanyCardBlock, CompanyCardsGridBlock, ValuationBlock, SearchResultsBlock).
- Nivel 3 — Estados y variants.
- Nivel 4 — Responsive y accesibilidad.

---

## 7. Capa 6 — Diseños

**Path**: `/app/_design_intake/` (referencia perpetua de UX)
**Estado**: ✅ Intacto
**Función**: producción visual concreta (mockups, prototipos HTML/JSX vanilla) que sirve de referencia perpetua para la implementación.

> Esta capa no vive en `/app/memory`. El canon documenta la existencia y rol del intake; la producción concreta convive con el código.

---

## 8. Capa 7 — Implementación

**Paths**: `/app/frontend/`, `/app/backend/`
**Estado**: ✅ Intacto (no tocado en Sprint 0/0.5)
**Función**: código de producto que implementa lo que las capas 1-6 declaran.

> El canon no documenta el código: el código se documenta en su README/JSDoc/docstrings.

---

## 9. Documentos de auditoría y consolidación

### 9.1 `specs/CANON_AUDIT_REPORT.md`

**Función**: inventario completo de contradicciones canon ↔ legacy e inconsistencias intra-spec.
**Origen**: Sprint 0.5 Ciclo A.
**Estado**: ✅ Cerrado. Sus hallazgos fueron resueltos o reclasificados en Ciclo B.

### 9.2 `specs/OPEN_ITEMS_CLASSIFICATION.md`

**Función**: clasificación de open items en 4 grupos.
**Origen**: Sprint 0.5 Ciclo A.
**Estado**: ✅ Vigente.
**Grupos**:
- **G1** — Inconsistencias intra-spec autocerrables. Cerradas en Ciclo B.
- **G2** — Decisiones canónicas pendientes. Confirmadas y aplicadas en Ciclo B (G2.M Match, G2.O fases Operación, renombres).
- **G3** — Decisiones de producto que requieren input humano (abiertas, deferidas a futuros sprints).
- **G4** — Backlog estratégico (abierto).

### 9.3 `SPRINT0_EXECUTIVE_SUMMARY.md`

**Función**: resumen ejecutivo del Sprint 0 + Sprint 0.5 para stakeholders.
**Origen**: Sprint 0.5 Ciclo B.

### 9.4 `ENGINE_ARCHITECTURE.md`

**Función**: cadena de inteligencia end-to-end (Fuentes → Data Layer → KG → Embeddings → Signal → Matching → Recommendation → Valuation → Risk → Transaction → Copilots → UX).
**Origen**: Sprint 0.5 Ciclo B.

### 9.5 `ARCHITECTURE_MAP.md`

**Función**: mapa visual ASCII + tablas compactas de la arquitectura completa.
**Origen**: Sprint 0.5 Ciclo B.

### 9.6 `canonical_pack_v1.0.zip`

**Función**: pack distribuible con todo el canon de la baseline v1.0.
**Origen**: Sprint 0.5 Ciclo B.
**Estructura**:
```
canonical_pack_v1.0/
├── README.md
├── canonical/   ARROBA_PHILOSOPHY, PRD, CHANGELOG, CANON_INDEX,
│                ENGINE_ARCHITECTURE, ENTITY_MODEL, ENTITY_FRAMEWORK
├── specs/       6 specs del Sprint 0
├── audit/       CANON_AUDIT_REPORT, OPEN_ITEMS_CLASSIFICATION
└── summary/     SPRINT0_EXECUTIVE_SUMMARY, ARCHITECTURE_MAP
```

---

## 10. Documentos transversales

### 10.1 `PRD.md`

**Path**: `/app/memory/PRD.md`
**Estado**: ✅ Vigente, vivo.
**Función**: estado del proyecto. Lo actualiza el agente al final de cada sub-tarea.
**Nota**: no es canon arquitectónico — es estado. El canon vive en las capas 1-7. El PRD las referencia.

### 10.2 `CHANGELOG.md`

**Path**: `/app/memory/CHANGELOG.md`
**Estado**: ✅ Vigente, vivo.
**Función**: histórico de releases del producto + freezes documentales.
**Última entrada**: `v1.0-canonical-baseline (2026-06-25)`.

### 10.3 `PRD.md` (antes `ROADMAP.md`, ahora archivado)

**Path**: `/app/memory/PRD.md`
**Estado**: ✅ Vigente. Es la Source of Truth de planificación viva según `ARROBA_CANON.md`.
**Función**: absorbe el backlog priorizado. El anterior `ROADMAP.md` ha sido archivado a `/app/_legacy/memory/ROADMAP.md` por decisión canónica (2026-07-06).

### 10.4 `_INVENTORY_2026.md`

**Path**: `/app/memory/_INVENTORY_2026.md`
**Estado**: ✅ Vigente.
**Función**: inventario operativo de assets, decisiones, requisitos abiertos (REQ-XXX).

### 10.5 `test_credentials.md`

**Path**: `/app/memory/test_credentials.md`
**Función**: credenciales para tests automatizados. No canon arquitectónico.

---

## 11. Reglas de evolución del canon

### 11.1 Cómo se añade un documento canónico nuevo

1. Identificar a qué **capa** pertenece (1-7).
2. Crear el documento con su frontmatter (versión, estado, función).
3. Añadir entrada en este `CANON_INDEX.md` en la sección de su capa.
4. Si introduce decisiones que afectan a otras capas, referenciarlas (link cruzado).
5. Bumpear el versionado del documento de capa superior si lo amplifica.

### 11.2 Cómo se modifica un documento canónico existente

1. Bumpear su versión (semver: mayor si rompe contrato, menor si añade, patch si pule).
2. Añadir entrada en su CHANGELOG interno (al inicio del documento).
3. Si la modificación afecta a otro documento canónico, propagarla (con su propio bump).
4. Reflejar en `CHANGELOG.md` global cuando sea release-relevante.

### 11.3 Cómo se decomisiona un documento canónico

1. Marcar como **derogado** en su frontmatter, no borrar.
2. Indicar el documento sucesor.
3. Mover a `/app/memory/_legacy/` con prefijo `DEPRECATED_`.
4. Eliminar referencias en este `CANON_INDEX.md`.

### 11.4 Capas no tocables sin consenso explícito

- **Capa 1** (`ARROBA_PHILOSOPHY.md`): cambio mayor requiere consenso explícito del usuario.
- **Capa 4** (Specs del Sprint 0): cualquier bump mayor requiere justificación documentada en `CHANGELOG` del spec + impacto en otras capas.

### 11.5 Auditorías periódicas

El canon se audita en cada freeze de baseline. La auditoría produce:
- Inventario de contradicciones (formato `CANON_AUDIT_REPORT.md`).
- Clasificación de open items en G1/G2/G3/G4 (formato `OPEN_ITEMS_CLASSIFICATION.md`).
- Propagación de decisiones aplicables (Ciclo B).
- Freeze de la nueva baseline (entrada en `CHANGELOG.md` con etiqueta `vX.Y-canonical-baseline`).

---

> **Estado de la baseline**: `v1.0-canonical-baseline` · congelada 2026-06-25 · cero contradicciones canon ↔ legacy verificadas en el informe final del Sprint 0.5 Ciclo B.
