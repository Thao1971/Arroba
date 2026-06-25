# arroba.com — Entity Framework v1.0.0

> **3ª capa canónica del proyecto** (parte 2 de 2). Ver [`ARROBA_PHILOSOPHY.md` §13](./ARROBA_PHILOSOPHY.md).
> Última actualización: 2026-06-24 (E1.5.6 — canonización).
>
> Este documento define la **arquitectura UX canónica** de cualquier ficha de entidad en arroba.com. Qué módulos pueden aparecer, en qué orden, cómo se reutilizan, cuándo se omiten, cómo se especializan. Aquí NO se habla de ontología de datos (eso es [`ENTITY_MODEL.md`](./ENTITY_MODEL.md)) ni de tokens/CSS/colores (eso es [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)).
>
> **Regla de oro**: si hay conflicto entre este documento y la implementación, **gana este documento**. El código se actualiza para alinearse.

---

## Índice

1. [Filosofía](#1-filosofía)
2. [Qué es una entidad](#2-qué-es-una-entidad)
3. [Anatomía canónica — los 12 módulos](#3-anatomía-canónica--los-12-módulos)
4. [Orden obligatorio](#4-orden-obligatorio)
5. [Componentes reutilizables](#5-componentes-reutilizables)
6. [Estados de módulo](#6-estados-de-módulo)
7. [Responsive](#7-responsive)
8. [Navegación](#8-navegación)
9. [Reglas de composición](#9-reglas-de-composición)
10. [Reglas de reutilización](#10-reglas-de-reutilización)
11. [Ejemplos completos por entidad](#11-ejemplos-completos-por-entidad)
12. [Principios de evolución](#12-principios-de-evolución)

---

## 1. Filosofía

arroba.com tiene **una sola anatomía de ficha**. No hay "página de
Empresa", "página de Sector", "página de Valoración" como cosas
distintas. Hay **una** ficha de entidad. Cada tipo concreto **activa**,
**omite** y **especializa** los mismos módulos.

Por qué:

- **Coherencia cognitiva**: el usuario aprende UNA estructura y la
  reconoce en cualquier entidad. Empresa, Sector, Persona y Operación
  comparten el mismo lenguaje visual y la misma jerarquía de información.
- **Composición sobre rediseño**: una nueva entidad no se "diseña" — se
  **configura** declarando qué módulos activa y con qué datos.
- **Velocidad de evolución**: añadir una entidad nueva no implica un
  rediseño visual; el Design System (4ª capa) ya tiene los building
  blocks. El Entity Framework declara cómo se ensamblan canónicamente.
- **Predicción del comportamiento**: el chat (Copilot) sabe qué módulos
  existen en cualquier ficha, así que sus updates (`section_updates[]`,
  ver `ARROBA_PHILOSOPHY.md` §12) funcionan en cualquier entidad sin
  re-aprendizaje.

### Qué NO es el Entity Framework

- **NO es el Design System** — no define tokens, colores, espaciados.
  Eso vive en `DESIGN_SYSTEM.md`.
- **NO es la ontología** — no declara qué entidades existen ni qué
  campos tienen. Eso vive en `ENTITY_MODEL.md`.
- **NO es navegación global** — no define el header del producto, el
  footer, el dock global. Solo define la **ficha** de una entidad.
- **NO es un sistema de plantillas configurables por el usuario** — los
  12 módulos y su orden son canónicos. El usuario no reordena.

---

## 2. Qué es una entidad

Una **entidad** en arroba.com es un objeto del dominio M&A que tiene:

- Identidad propia (`id` + `slug`, ver `ENTITY_MODEL.md` §4).
- Página propia (URL canónica `/{type}/{identifier}`).
- Posiblemente un Copilot especializado (`ARROBA_PHILOSOPHY.md` §12).
- Memoria propia (conversaciones, watchlist, exports).

### Los 12 tipos canónicos (resumen)

| Tipo | URL | Ejemplo |
|---|---|---|
| `company` | `/empresa/{cif}` | Kitchen Studio, S.L. |
| `sector` | `/sector/{slug}` | Software |
| `territory` | `/territorio/{slug}` | Madrid |
| `person` | `/persona/{slug}` | Lucía Pérez |
| `advisor` | `/advisor/{slug}` | María Romero |
| `mandate` | `/mandato/{id}` | Sell-side Kitchen 2026 |
| `operation` | `/operacion/{id}` | Venta Kitchen Q2 2026 |
| `valuation` | `/valoracion/{id}` | Valoración Kitchen Q1 |
| `document` | `/documento/{id}` | Teaser Kitchen |
| `opportunity` | `/oportunidad/{id}` | Buy-side SaaS Horeca |
| `client` | (sin ficha pública) | usuario interno |
| `organization` | `/org/{slug}` | ARROBA Demo Org |

Detalle ontológico completo en `ENTITY_MODEL.md` §3.

---

## 3. Anatomía canónica — los 12 módulos

Toda ficha de entidad se compone declarativamente con **doce módulos**.
Cada módulo es un concepto UX, no un componente React específico (los
componentes viven en `src/components/entity/base/`, y la traducción al
Design System está en `DESIGN_SYSTEM.md` §2).

### 3.1 Header

**Propósito**: identificar la entidad y exponer sus acciones primarias.

**Contenido típico**:
- Avatar/iniciales o icono del tipo de entidad.
- Nombre canónico (text-h1).
- Identificadores (CIF, slug, ID).
- Sector / territorio / tipología (text-body-sm muted).
- Score badge (cuando aplica).
- Acciones tipificadas (watchlist, share, request-valuation, activate-opportunity, download, claim) + dropdown "Más".

**Cuándo aparece**: siempre (módulo obligatorio universal).

**Cuándo se omite**: nunca.

**Especialización**: cada tipo define qué acciones tipificadas activa.
Empresa activa las 6; Sector solo activa watchlist + share + download;
Operación añade "Avanzar fase" y "Invitar contraparte".

### 3.2 Hero

**Propósito**: dar contexto narrativo de la entidad en una banda visual
destacada.

**Contenido típico**:
- Eyebrow (text-caption uppercase, ej. "ANÁLISIS DE EMPRESA").
- Título grande (text-h2 o text-display).
- Subtitle 1-2 frases.
- Variant tone (light / dark / info).

**Cuándo aparece**: en entidades **públicas** que necesitan contexto
narrativo inicial (Empresa, Sector, Territorio, Oportunidad). En
entidades operacionales (Mandato, Operación, Valoración) puede
**omitirse** porque el Header ya identifica unívocamente.

**Cuándo se omite**: Person, Advisor (el Header con el avatar ya es el
hero implícito).

**Especialización**: el eyebrow indica el tipo ("ANÁLISIS DE EMPRESA",
"SECTOR · SOFTWARE", "TERRITORIO · MADRID"), el subtitle aporta el
storytelling propio.

### 3.3 KPIs (Métricas clave)

**Propósito**: 3-6 indicadores cuantitativos destacados en grid.

**Contenido típico**:
- Para Empresa: Ingresos, EBITDA, Margen, Empleados.
- Para Sector: nº de empresas, growth, multiplo medio, fragmentación.
- Para Territorio: nº de empresas, sectores top, empleo, PIB.
- Para Operación: fase actual, contrapartes en juego, días en proceso.

**Cuándo aparece**: siempre que la entidad tiene métricas relevantes.

**Cuándo se omite**: Document (un PDF no tiene métricas), Person (no son
las métricas el lenguaje canónico).

**Especialización**: las 4-6 métricas son distintas por tipo, pero la
**presentación** es idéntica (MetricsGrid del Design System §2.5).

### 3.4 Advisor (Copilot especializado)

**Propósito**: punto de entrada al chat contextualizado en esta entidad.

**Contenido típico**: NO es una sección con contenido propio — es la
**identidad del dock** cuando el usuario está en la ficha. El dock
muestra "✦ {Type} Advisor de {nombre}" y todas las conversaciones se
asocian a esta entidad (`company_conversations`, `sector_conversations`,
etc.).

**Cuándo aparece**: en toda entidad que tiene Copilot especializado
(Empresa, Sector, Territorio, Valoración, Oportunidad, Operación → 6
especialistas listados en `ARROBA_PHILOSOPHY.md` §12).

**Cuándo se omite**: Document, Person, Advisor, Client, Organization (no
tienen Copilot especializado propio).

**Especialización**: el system prompt del Copilot (en backend) referencia
el tipo y la entidad concreta para grounding.

### 3.5 Insights

**Propósito**: análisis cualitativo no narrativo — bullets cortos de
información sintetizada.

**Contenido típico**: 3-6 puntos clave generados por el Copilot o
extraídos de datos (ej. "EBITDA por encima de la media sectorial",
"Concentración geográfica en Madrid").

**Cuándo aparece**: en entidades **analizables** (Empresa, Sector,
Territorio, Oportunidad, Valoración).

**Cuándo se omite**: entidades operacionales puras (Mandato, Document).

**Especialización**: los insights son tipados — `strength`, `weakness`,
`signal`, `risk`. Cada tipo de entidad puede mostrar un subset.

### 3.6 Análisis (Narrative del analista)

**Propósito**: lectura cualitativa del analista IA — texto en prosa con
estructura `summary + key_points + risks + opportunities + citations`.

**Contenido típico**: el bloque `narrative` del Design System §3.10.

**Cuándo aparece**: en entidades **analizables**. Es el corazón del
"chat → ficha" de la philosophy §12.

**Cuándo se omite**: entidades operacionales puras.

**Especialización**: el title cambia ("Lectura del analista" en Empresa,
"Análisis sectorial" en Sector). El esquema del bloque es idéntico.

### 3.7 Señales

**Propósito**: eventos externos relevantes para esta entidad.

**Contenido típico**:
- BORME (cambios societarios, ampliaciones de capital).
- Contratación pública.
- Cambios en directorio.
- Menciones en prensa.
- Movimientos del sector (M&A reciente).

**Cuándo aparece**: en Empresa (señales propias), Sector (señales
agregadas), Territorio (señales regionales), Oportunidad (señales de
candidatas).

**Cuándo se omite**: Person, Advisor, Document, Client, Organization,
Mandato, Operación.

**Especialización**: el tipo de señales y su fuente varían; la
presentación es una lista cronológica con icono + título + microcopy.

### 3.8 Relaciones

**Propósito**: navegación contextual a entidades relacionadas.

**Contenido típico**:
- Para Empresa: comparables (otras `company`), sector padre, territorio,
  fundadores (`person`).
- Para Sector: subsectores, sectores hermanos, empresas top.
- Para Territorio: subterritorios, sectores top en este territorio.
- Para Operación: contrapartes (`company`), mandato origen, documentos
  asociados.

**Cuándo aparece**: en toda entidad con relaciones canónicas declaradas
(`ENTITY_MODEL.md` §5).

**Cuándo se omite**: Document (sus relaciones son simples y se muestran
en el Header), Client.

**Especialización**: usa `CompanyCardsGridBlock`, `EntityCardsGrid` (a
crear en E1.6) u otros componentes del DS según el tipo de relación.

### 3.9 Oportunidades

**Propósito**: oportunidades activas asociadas a esta entidad.

**Contenido típico**:
- En Empresa: oportunidades buy-side donde es candidata + sell-side
  donde es target.
- En Sector: oportunidades activas que apuntan a este sector.
- En Territorio: oportunidades activas en esta región.
- En Oportunidad: las **candidatas** (este es el contenido principal).

**Cuándo aparece**: cuando hay >=1 oportunidad asociada.

**Cuándo se omite**: cuando no hay ninguna (aparece como
`EmptyStateBlock` con CTA "Activar oportunidad" del header).

**Especialización**: en `Opportunity`, este módulo se convierte en el
módulo central (`pipeline_stage_by_company_id`).

### 3.10 Documentación

**Propósito**: documentos asociados a la entidad.

**Contenido típico**:
- En Empresa: memoria mercantil, perfil, financieros descargables.
- En Operación: teaser, NDA, IM, IOI, LOI, SPA (organizados por fase).
- En Mandato: contrato de mandato, anexos.
- En Valoración: el PDF de la valoración + soporting documents.

**Cuándo aparece**: cuando hay documentos asociados.

**Cuándo se omite**: en entidades efímeras (Person, Sector, Territorio
en su estado actual; podría activarse en el futuro si añadimos PDFs
sectoriales).

**Especialización**: la estructura de carpetas/categorías cambia por
tipo (en Operación se organiza por fase).

### 3.11 Actividad

**Propósito**: timeline de eventos recientes en la entidad.

**Contenido típico**:
- Quién creó/actualizó qué y cuándo.
- Conversaciones recientes del Copilot.
- Eventos del sistema (refreshes, exports, shares).
- Cambios en pipeline (en Operación, Oportunidad).

**Cuándo aparece**: en entidades **operacionales** (Mandato, Operación,
Oportunidad, Valoración). En Empresa/Sector/Territorio se muestra solo
si el usuario tiene la entidad en watchlist o si es admin.

**Cuándo se omite**: en entidades sin actividad propia (Document estático).

**Especialización**: el tipo de eventos varía. Componente común
`ActivityTimeline` (a crear en E1.6+).

### 3.12 Acciones (Next Best Actions)

**Propósito**: 3-4 atajos a las capacidades clave conectadas con esta
entidad.

**Contenido típico**:
- En Empresa: "Compárala con otra", "Analiza riesgos", "Detecta
  oportunidades".
- En Sector: "Lista empresas", "Compara con sector vecino", "Detecta
  oportunidades en el sector".
- En Operación: "Avanzar fase", "Invitar contraparte", "Abrir Data Room".

**Cuándo aparece**: siempre (módulo obligatorio universal cuando el
usuario está autenticado).

**Cuándo se omite**: para usuarios anónimos (se reemplaza por
`LockedSectionBlur`).

**Especialización**: las acciones son tipadas; cada tipo de entidad
declara las suyas. La presentación es uniforme (grid 3-4 cards).

---

## 4. Orden obligatorio

El orden top→bottom canónico es **estricto**. Una ficha de entidad
respeta esta secuencia incluso cuando omite módulos:

```
1.  Breadcrumb (no es un módulo, es chrome de navegación)
2.  Header                       ← obligatorio
3.  Hero                          ← opcional (no en Person/Advisor)
4.  KPIs                          ← opcional (no en Document/Person)
5.  Insights                      ← opcional
6.  Análisis (Narrative)          ← opcional (no en operacionales puras)
7.  Señales                       ← opcional
8.  Relaciones                    ← opcional
9.  Oportunidades                 ← opcional (central en Opportunity)
10. Documentación                 ← opcional
11. Actividad                     ← opcional
12. Acciones (Next Best Actions)  ← obligatorio si autenticado
```

**Advisor (módulo 3.4)** NO ocupa una posición en la ficha — vive en el
**dock** lateral/bottom-sheet, no en el flujo principal. Es por eso que
no aparece en esta lista numerada.

### Por qué este orden

1. **Identificación primero**: Header.
2. **Storytelling después**: Hero ("qué es esto y por qué importa").
3. **Hechos cuantitativos**: KPIs.
4. **Insights cualitativos cortos**: Insights.
5. **Análisis profundo**: Análisis (Narrative).
6. **Contexto externo**: Señales (cambios fuera de la entidad que afectan).
7. **Contexto interno**: Relaciones (otras entidades vinculadas).
8. **Oportunidades**: cómo activar valor desde aquí.
9. **Documentación**: backup material.
10. **Actividad**: qué ha pasado recientemente.
11. **Acciones**: cómo seguir trabajando.

Es un embudo de **identidad → narrativa → datos → análisis → contexto → acción**.

---

## 5. Componentes reutilizables

Cada módulo del §3 se traduce a una o más primitives del Design System.
La tabla de mapping canónica:

| Módulo (UX) | Component(s) del DS | Notas |
|---|---|---|
| Header | `EntityHeader` (re-export de `CompanyHeader` en v1.0.0) | Especializa por `entityType`. |
| Hero | `HeroBlock` (DS §2.x) | Variant `light`/`dark`/`info`. |
| KPIs | `MetricsBlock` o `MetricsGrid` (DS §2.5-2.6) | 1/2/3/4 col responsive. |
| Advisor | `CopilotDock` + `entity_context` | No es un block; vive en el dock global. |
| Insights | `NarrativeBlock` (DS) con `key_points` extendido o `MetricsGrid` con flags. | A canonizar mejor en E1.6. |
| Análisis | `NarrativeBlock` (DS §2) + `RefreshButton` en slot action. | Canonizado en E1.5-REWORK. |
| Señales | (a crear `SignalsTimeline` en E1.6+) o `UnavailableBlock` con REQ-008. | Hoy `UnavailableBlock`. |
| Relaciones | `CompanyCardsGridBlock` (DS) + futuro `EntityCardsGrid`. | Composición de cards tipadas. |
| Oportunidades | `CompanyCardsGridBlock` con badge de pipeline stage. | A enriquecer en E1.9. |
| Documentación | (a crear `DocumentList` en E1.6+) o `EmptyStateBlock`. | |
| Actividad | (a crear `ActivityTimeline` en E1.6+) o `EmptyStateBlock`. | |
| Acciones | (custom `NextBestActions` grid) + `LockedSectionBlur` anon. | En Empresa ya implementado. |

**Componentes base orquestadores** (E1.5.6 nuevo):

- `EntitySection` — wrapper semántico de cada módulo. Equivale al
  `EntitySectionWrapper` actual. Cada sección tiene `id` (anchor),
  `title`, `description`, `action` (slot derecho), `children`.
- `EntitySections` — orquestador del orden canónico. Recibe un array
  declarativo de secciones a renderizar y aplica el orden del §4.

**Detalle por componente**: ver `DESIGN_SYSTEM.md` Nivel 2.

---

## 6. Estados de módulo

Cada módulo (independientemente del tipo) debe saber comportarse en 5
estados canónicos:

| Estado | Cuándo | Componente DS | Descripción |
|---|---|---|---|
| **Loading** | Datos en vuelo | `LoadingBlock` | Skeleton placeholder. |
| **Empty** | Sin datos en este contexto | `EmptyStateBlock` | Microcopy + CTA opcional. |
| **Locked** | Auth-gated, usuario anónimo | `LockedSectionBlur` | Blur + CTA registro. |
| **Error** | Fallo recuperable | `ErrorBlock` | Microcopy + replay. |
| **Unavailable** | Pendiente de REQ-XXX externo | `UnavailableBlock` | REQ + ETA visible. |
| **Updating** | Recibió un `section_update` reciente | normal + `animate-section-pulse` | 700ms highlight rojo sutil. |

Regla clara: **siempre uno de estos**, nunca un módulo vacío sin
explicación. Detalle visual de cada uno en `DESIGN_SYSTEM.md` §3.10.

---

## 7. Responsive

El orden canónico §4 se mantiene en todos los viewports. Lo que cambia
es la **densidad** y la **interacción con el dock**.

| Breakpoint | Layout | Dock |
|---|---|---|
| `<640px` (mobile) | 1 columna; Header stack vertical; MetricsGrid 1-col; Relaciones 1-col | Bottom-sheet 50% altura |
| `640-768px` (small tablet) | 1-2 columnas; Header lado-a-lado compacto; MetricsGrid 2-col | Lateral compacto |
| `768-1024px` (tablet) | 2 columnas; MetricsGrid 2-col; Relaciones 2-col | Lateral compacto |
| `≥1024px` (desktop) | layout completo; MetricsGrid 4-col; Relaciones 3-col | Lateral expandible |
| `≥1280px` (large) | max-width content (`max-w-7xl`) + espacios laterales | Lateral expandible |

**Mobile**: las acciones tipificadas del Header se colapsan en un
dropdown "Más". Visible solo: watchlist + share + 1 acción principal.

**Tablet+**: hasta 6 acciones visibles + dropdown "Más" con el resto.

---

## 8. Navegación

### 8.1 Entry points
- **Search global** (header del producto) → si la query es CIF/nombre
  exacto → redirige directo a `/empresa/{cif}` (Entity Resolution,
  implementado en E1.5-REWORK). Si hay ambigüedad → disambiguator en el
  dock.
- **Watchlist** (Dashboard / Historial) → grid de empresas guardadas.
- **Click en card de relación** → navega a la ficha de la entidad
  relacionada.
- **URL directa** (`/empresa/{cif}`, `/sector/{slug}`, etc.).

### 8.2 Breadcrumbs
Obligatorios en toda ficha. Patrón:

```
Inicio › {Capability} › {Tipo plural} › {Nombre}
```

Ejemplos:
- `Inicio › Analizar › Empresas › Kitchen Studio, S.L.`
- `Inicio › Analizar › Sectores › Software`
- `Inicio › Comprar/Vender › Oportunidades › Buy-side SaaS Horeca`

El segundo nivel (`Capability`) es informativo, no funcional. El click
en `{Tipo plural}` lleva al listado correspondiente cuando exista (E1.6+).

### 8.3 Transiciones entre entidades

- **Hover en card de relación** → preview/tooltip con KPIs principales (a
  implementar en E1.6+).
- **Click** → navegación dura. NO se usan modals/drawers para fichas
  completas. Cada ficha tiene URL única.
- **Volver** → el browser back funciona. El estado del dock persiste
  entre fichas (la conversación se hidrata desde `/conversation` cuando
  la entidad lo soporta).

### 8.4 Búsqueda contextual

Cuando el dock está en `entity_context`, el composer prioriza
intenciones que actualicen secciones de la entidad actual. Si el usuario
escribe una query que apunta a OTRA entidad (ej. "Kitchen Studio" mientras
está en `/sector/software`), el dock muestra un disambiguator antes de
navegar.

---

## 9. Reglas de composición

### 9.1 Módulos obligatorios universales

Solo dos:

- **Header** (siempre).
- **Acciones** (Next Best Actions) si el usuario está autenticado.

Todos los demás son opcionales por tipo.

### 9.2 Módulos obligatorios por tipo

| Tipo | Obligatorios adicionales |
|---|---|
| `company` | Hero · KPIs · Análisis (en autenticado) |
| `sector` | Hero · KPIs · Análisis (en autenticado) · Relaciones (empresas top) |
| `territory` | Hero · KPIs · Relaciones (empresas top) |
| `person` | (ningún adicional; el Header con avatar es el hero) |
| `advisor` | KPIs (operaciones cerradas, sectores) · Relaciones (mandatos activos) |
| `mandate` | KPIs (días en curso, contrapartes) · Documentación · Actividad |
| `operation` | KPIs · Documentación · Actividad |
| `valuation` | Hero · KPIs (valor central, banda) · Análisis · Documentación |
| `document` | (mínimo: Header con metadata + preview) |
| `opportunity` | Hero · Oportunidades (las candidatas) · Análisis · Actividad |

### 9.3 Módulos prohibidos por tipo

| Tipo | Prohibidos |
|---|---|
| `client` | (no tiene ficha pública) |
| `document` | KPIs, Análisis (un PDF no se analiza con NarrativeBlock) |
| `person` | KPIs (no es el lenguaje canónico de una persona) |

### 9.4 Módulos auth-gated

En usuarios anónimos, los siguientes módulos siempre van como `LockedSectionBlur`:

- Análisis (siempre locked anon).
- Insights (siempre locked anon).
- Señales (siempre locked anon).
- Oportunidades (siempre locked anon).
- Documentación (siempre locked anon).
- Acciones (siempre locked anon).

Públicos para anónimos: Header (resumido), Hero, KPIs (versión resumida),
Relaciones (top-3 sin link).

### 9.5 Composición declarativa

Una ficha se declara con un array de secciones:

```ts
const sections: EntitySectionDescriptor[] = [
  { id: 'resumen',     module: 'hero',      data: ..., state: 'ready' },
  { id: 'kpis',        module: 'kpis',      data: ..., state: 'ready' },
  { id: 'insights',    module: 'insights',  data: null, state: 'locked' },
  { id: 'analisis',    module: 'analisis',  data: ..., state: 'ready' },
  { id: 'senales',     module: 'senales',   data: null, state: 'unavailable', req: 'REQ-008' },
  { id: 'relaciones',  module: 'relaciones', data: ..., state: 'ready' },
  { id: 'oportunidades', module: 'oportunidades', data: [], state: 'empty' },
  { id: 'acciones',    module: 'acciones',  data: ..., state: 'ready' },
];

<EntitySections entityType="company" sections={sections} />
```

`EntitySections` aplica el orden canónico §4 incluso si el array viene
desordenado.

---

## 10. Reglas de reutilización

### 10.1 Especialización por prop, no por archivo

Un módulo NO se duplica por tipo. `EntityHeader` es un único componente
que recibe `entityType` y configura su comportamiento (icono por defecto,
acciones tipificadas, etc.).

```tsx
// ❌ NO
<CompanyHeader cif="..." />
<SectorHeader slug="..." />
<TerritoryHeader slug="..." />

// ✅ SÍ
<EntityHeader entityType="company"  identifier="B12345678" actions={...} />
<EntityHeader entityType="sector"   identifier="software"   actions={...} />
<EntityHeader entityType="territory" identifier="madrid"     actions={...} />
```

**Caveat E1.5.6**: la ficha de Empresa ya existe con `CompanyHeader`
como container smart. Decidimos mantenerlo como **wrapper** de
`EntityHeader` porque concentra la lógica específica de Empresa
(toggle watchlist, share, toasts E1.8/E1.9). El componente
presentacional puro es `EntityHeader` en `base/`.

### 10.2 Slots de composición para casos extremos

Cuando un módulo necesita variar significativamente por tipo, se usa el
patrón **slot**:

```tsx
<EntityHeader
  entityType="operation"
  identifier="op-kitchen-2026"
  actions={[...]}
  slotBelow={<OperationPhaseSelector />}  // slot opcional
/>
```

Los slots se documentan en el JSDoc del componente.

### 10.3 Discriminador `entityType` siempre presente

Toda primitiva base (`EntityHeader`, `EntityHero`, `EntityKpis`, etc.)
acepta `entityType` aunque no lo use. Esto permite añadir `data-entity-type`
en el DOM para QA, testing y CSS condicional futuro.

### 10.4 No bifurcar via `if (entityType === 'company')` masivo

Si una primitiva acumula >3 ramas `if (entityType)`, es señal de que
necesitamos un slot o un sub-componente. Refactorizar.

### 10.5 Promover datos comunes

Cuando un campo se repite en >3 tipos, promoverlo a campo común
(`ENTITY_MODEL.md` §4). El componente base lo consume sin saber qué tipo
es.

---

## 11. Ejemplos completos por entidad

Cada ejemplo declara: módulos activos · estado en mobile/auth-anon ·
especializaciones · advisor especializado.

### 11.1 Empresa (`company`) — ✅ implementado E1.5-REWORK

| # | Módulo | Activo | Estado | Notas |
|---|---|---|---|---|
| 1 | Header | ✅ | autenticado: 6 acciones · anónimo: solo identificación | `EntityHeader` |
| 2 | Hero | ✅ | público | "ANÁLISIS DE EMPRESA" |
| 3 | KPIs | ✅ | público resumido · auth completo | Ingresos · EBITDA · Margen · Empleados |
| 4 | Advisor | ✅ | dock "✦ Company Advisor de {nombre}" | E1.5-REWORK |
| 5 | Insights | 🟡 parcial | locked anon · auth: usar `NarrativeBlock` con keypoints | A canonizar mejor en E1.6 |
| 6 | Análisis | ✅ | locked anon · auth + RefreshButton | E1.5-REWORK |
| 7 | Señales | 🟡 unavailable | REQ-008 pendiente | `UnavailableBlock` |
| 8 | Relaciones | ✅ | locked anon · auth: comparables grid | `CompanyCardsGridBlock` |
| 9 | Oportunidades | 🟡 empty | empty state | Activable desde el CTA del header |
| 10 | Documentación | 🟡 link | "Descargar memoria mercantil" en header | Sin sección propia (todavía) |
| 11 | Actividad | 🔵 hidden | no implementado en E1.5 | E1.6+ |
| 12 | Acciones | ✅ | locked anon · auth: 3 cards | "Compárala", "Analiza riesgos", "Detecta oportunidades" |

### 11.2 Sector (`sector`) — 🔵 E1.6

| # | Módulo | Activo | Estado | Notas |
|---|---|---|---|---|
| 1 | Header | ✅ | watchlist + share + download | Icono = book / chart |
| 2 | Hero | ✅ | "SECTOR · {parent}" | Descripción del sector |
| 3 | KPIs | ✅ | empresas activas · growth YoY · multiplo medio · fragmentación HHI | |
| 4 | Advisor | ✅ | "✦ Sector Analyst de Software" | |
| 5 | Insights | ✅ | locked anon | Tendencias, consolidación |
| 6 | Análisis | ✅ | locked anon · auth + RefreshButton | |
| 7 | Señales | 🟡 unavailable | M&A reciente en el sector | REQ-010 |
| 8 | Relaciones | ✅ | empresas top, subsectores, sectores hermanos | |
| 9 | Oportunidades | ✅ | oportunidades activas en este sector | |
| 10 | Documentación | 🔵 opcional | informes sectoriales (futuro) | |
| 11 | Actividad | 🔵 opt-in | si usuario tiene sector en watchlist | |
| 12 | Acciones | ✅ | "Lista empresas top", "Compara con sector vecino", "Activa oportunidad" | |

### 11.3 Territorio (`territory`) — 🔵 E1.7

| # | Módulo | Activo | Notas |
|---|---|---|---|
| 1 | Header | ✅ | Icono = map-pin |
| 2 | Hero | ✅ | "TERRITORIO · {parent}" + mapa SVG estático |
| 3 | KPIs | ✅ | nº empresas · sectores top · empleo · PIB |
| 4 | Advisor | ✅ | "✦ Territory Analyst de Madrid" |
| 5 | Insights | ✅ | locked anon |
| 6 | Análisis | ✅ | locked anon |
| 7 | Señales | 🟡 unavailable | M&A en la región |
| 8 | Relaciones | ✅ | sub-territorios, sectores top, empresas top |
| 9 | Oportunidades | ✅ | oportunidades regionales |
| 10 | Documentación | 🔵 | |
| 11 | Actividad | 🔵 opt-in | |
| 12 | Acciones | ✅ | "Lista empresas", "Compara con territorio vecino" |

### 11.4 Valoración (`valuation`) — 🔵 E1.8

| # | Módulo | Activo | Notas |
|---|---|---|---|
| 1 | Header | ✅ | Nombre de la empresa valorada + fecha + método + autor |
| 2 | Hero | ✅ | valor central destacado (display 72) |
| 3 | KPIs | ✅ | valor central · low · high · multiplo · confianza |
| 4 | Advisor | ✅ | "✦ Valuation Advisor de {empresa}" |
| 5 | Insights | ✅ | razones que justifican el multiplo |
| 6 | Análisis | ✅ | narrative cualitativa |
| 7 | Señales | ❌ omitido | no aplica |
| 8 | Relaciones | ✅ | comparables utilizadas + empresa valorada |
| 9 | Oportunidades | ❌ omitido | no aplica |
| 10 | Documentación | ✅ | PDF de la valoración + supporting documents |
| 11 | Actividad | ✅ | quién la vio, cuándo se actualizó |
| 12 | Acciones | ✅ | "Descargar PDF", "Compartir con equipo", "Marcar como definitiva" |

### 11.5 Oportunidad (`opportunity`) — 🔵 E1.9

| # | Módulo | Activo | Notas |
|---|---|---|---|
| 1 | Header | ✅ | side: buy/sell · scope · status |
| 2 | Hero | ✅ | la tesis (editable) |
| 3 | KPIs | ✅ | candidatas · en pipeline · cerradas · días activa |
| 4 | Advisor | ✅ | "✦ Opportunity Advisor" |
| 5 | Insights | ✅ | candidatas con mejor fit, señales activas |
| 6 | Análisis | ✅ | narrative |
| 7 | Señales | ✅ | señales activas de candidatas |
| 8 | Relaciones | ✅ | sector(s), territorio(s) objetivo |
| 9 | Oportunidades (CENTRAL) | ✅ | grid de candidatas con pipeline stage |
| 10 | Documentación | 🔵 opcional | teasers, NDAs lanzados |
| 11 | Actividad | ✅ | movimientos de pipeline, conversaciones, exports |
| 12 | Acciones | ✅ | "Activar matching", "Enviar teaser anónimo", "Escalar a mandato" |

### 11.6 Persona (`person`) — 🔵 backlog

| # | Módulo | Activo | Notas |
|---|---|---|---|
| 1 | Header | ✅ | avatar + nombre + role |
| 2 | Hero | ❌ omitido | el header con avatar grande ES el hero |
| 3 | KPIs | ❌ omitido | no es el lenguaje de una persona |
| 4 | Advisor | ❌ omitido | no tiene Copilot especializado |
| 5 | Insights | 🔵 | si llega lineage suficiente |
| 6 | Análisis | 🔵 opcional | breve narrativa |
| 7 | Señales | 🔵 opcional | menciones públicas |
| 8 | Relaciones | ✅ | empresa actual + historial + advisors asociados |
| 9 | Oportunidades | ❌ omitido | |
| 10 | Documentación | ❌ omitido | |
| 11 | Actividad | ❌ omitido | |
| 12 | Acciones | ✅ | "Ver empresa actual", "Ver historial", "Conectar (LinkedIn)" |

### 11.7 Advisor (`advisor`) — 🔵 backlog

| # | Módulo | Activo | Notas |
|---|---|---|---|
| 1 | Header | ✅ | avatar + nombre + acreditación |
| 2 | Hero | ✅ | descripción + sectores y territorios de especialización |
| 3 | KPIs | ✅ | operaciones cerradas · valor total · multiplo medio · NPS |
| 4 | Advisor | ❌ omitido | un advisor humano no tiene Copilot propio |
| 5 | Insights | 🔵 | testimonios |
| 6 | Análisis | ❌ omitido | |
| 7 | Señales | ❌ omitido | |
| 8 | Relaciones | ✅ | mandatos activos · sectores · territorios |
| 9 | Oportunidades | ❌ omitido | |
| 10 | Documentación | 🔵 | acreditaciones, casos publicados |
| 11 | Actividad | ✅ | operaciones recientes |
| 12 | Acciones | ✅ | "Contactar", "Ver perfil completo", "Solicitar mandato" |

### 11.8 Operación (`operation`) — 🔵 E2.0

| # | Módulo | Activo | Notas |
|---|---|---|---|
| 1 | Header | ✅ | empresa target (o anonimizada si pre-NDA) + fase + counterparts visible si NDA firmado |
| 2 | Hero | 🔵 opcional | resumen breve del proceso |
| 3 | KPIs | ✅ | días en fase actual · contrapartes activas · documentos pendientes |
| 4 | Advisor | ✅ | "✦ Deal Advisor" |
| 5 | Insights | ✅ | siguientes pasos críticos |
| 6 | Análisis | 🔵 opcional | due diligence narrativa |
| 7 | Señales | ✅ | eventos relevantes (NDA firmado, IOI recibido) |
| 8 | Relaciones | ✅ | mandato origen, valoraciones aplicadas |
| 9 | Oportunidades | ❌ omitido | |
| 10 | Documentación (CENTRAL) | ✅ | organizada por fase: teaser, NDA, IM, IOI, LOI, DD, SPA |
| 11 | Actividad | ✅ | timeline detallado |
| 12 | Acciones | ✅ | "Avanzar fase", "Invitar contraparte", "Abrir Data Room" |

---

## 12. Principios de evolución

### 12.1 Añadir un nuevo módulo (13º)

Requiere:
1. Justificación en `ARROBA_PHILOSOPHY.md` (qué patrón nuevo no encaja
   en los 12 actuales).
2. Sección 3.13 nueva en este documento con propósito + contenido +
   cuándo aparece + cuándo se omite + especialización.
3. Lugar en el orden canónico §4 (nuevo número de posición).
4. Mapping al Design System §5 o creación de primitives nuevos.
5. Actualización de §9.2 y §11 declarando para cada tipo si lo activa
   u omite.

Cambiar el orden de los 12 actuales requiere consenso explícito; rompe la
expectativa cognitiva del usuario.

### 12.2 Añadir un nuevo tipo de entidad

Ya definido en `ENTITY_MODEL.md` §10.1. Una vez ahí:
1. Añadir su fila en §11 (ejemplo completo: qué módulos activa, cuáles
   omite, qué especializa).
2. Verificar §9.2 / §9.3 (módulos obligatorios y prohibidos).
3. Decidir si tiene Advisor especializado (`ARROBA_PHILOSOPHY.md` §12).

### 12.3 Especialización de un módulo para un tipo nuevo

Por defecto se usa la primitiva base. Si necesita variación visual:
1. Probar primero con prop `entityType` + variantes existentes.
2. Si no basta, añadir slot tipado (§10.2).
3. Solo en último caso, crear un sub-componente específico
   (`EntityHeaderOperation`), y solo si no se puede generalizar.

### 12.4 Cambio del Design System

Si una primitiva del DS cambia (DESIGN_SYSTEM.md sube de versión), este
documento NO se actualiza salvo que el mapping del §5 también cambie. Las
referencias a "MetricsBlock" siguen siendo válidas aunque internamente el
componente cambie.

### 12.5 Versionado

Este documento sube de versión cuando:
- Se añade/elimina un módulo (cambio mayor: v2.0).
- Se cambia el orden canónico (cambio mayor: v2.0).
- Se añade un nuevo tipo de entidad o se especializa su composición
  (cambio menor: v1.x).
- Se añade un slot o se documenta un caveat (patch: v1.0.x).

---

> **Fuentes de verdad relacionadas**:
> - `ARROBA_PHILOSOPHY.md` (estrategia + UX principles)
> - `ENTITY_MODEL.md` (ontología de datos)
> - `DESIGN_SYSTEM.md` (visual: tokens + primitives)
>
> Este documento (`ENTITY_FRAMEWORK.md`) declara la **arquitectura UX** que conecta los tres.
