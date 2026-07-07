# ARROBA.COM — Filosofía canónica v3.0 (definitiva)

> Nota canónica: los principios (P1 Explainability First, P2 Intelligence over Data, P3 Zero Coupling) y reglas (R11, R12, R13) referenciados en este documento están formalizados en 'ARROBA_ARCHITECTURAL_PRINCIPLES.md'. Puerta de entrada al canon: 'ARROBA_CANON.md'.


> **Fuente de verdad estratégica del producto.**
> Sustituye cualquier interpretación previa basada en el modelo `Copilot → Skill → Workspace`.
> Promulgada por el usuario el 2026-06-24. Esta versión es definitiva.

---

# REORIENTACIÓN DEFINITIVA DE ARROBA.COM — FILOSOFÍA V3.0

## IMPORTANTE

Se ha promulgado oficialmente ARROBA_PHILOSOPHY.md como fuente de verdad principal.

A partir de ahora, cualquier decisión de producto, UX o arquitectura debe respetar este documento.

Si existe conflicto entre PRD y ARROBA_PHILOSOPHY.md, prevalece ARROBA_PHILOSOPHY.md.

⸻

## 1. El modelo Copilot → Skill → Workspace queda derogado

NO estamos construyendo ChatGPT Projects ni Claude Projects.

NO estamos construyendo una aplicación centrada en conversaciones.

El modelo `Copilot → Skill → Workspace` queda oficialmente derogado.

⸻

## 2. Filosofía correcta

Copilot First en interacción.

Entity First en producto.

La inteligencia se adapta al producto.

El producto NO se adapta a la inteligencia.

⸻

## 3. Entidades principales del dominio

**Analizar**: Empresa, Sector, Territorio.

**Valorar**: Valoración.

**Comprar / Vender**: Oportunidad.

**Ejecutar**: Transacción.

⸻

## 4. La empresa es la entidad central

Tal y como establece el Blueprint:

> "Company: Entidad central del sistema."

La ficha de empresa es uno de los activos más importantes de arroba.com. El Copilot es contextual sobre la empresa. NO al revés.

⸻

## 5. Oportunidad, Match y Transacción

La Oportunidad es una entidad de descubrimiento.

El **Match** es una entidad canónica de primer nivel: representa el acuerdo bilateral entre Buyer y Seller que abre la puerta a la Operación.

La Transacción (Operación) es una entidad de ejecución.

No todas las oportunidades se convierten en una transacción. Pero toda transacción nace de un Match aceptado.

La secuencia correcta es: Oportunidad → Matching (mecanismo) → **Match** (entidad) → Operación.

⸻

## 6. Transaction OS

La Transacción puede ser **Buy-side** o **Sell-side**.

Dentro de una Transacción viven capacidades y fases.

**Matching** es el mecanismo que activa Solicitudes. El **Match** (resultado del acuerdo bilateral) es la entidad que sella el acceso al Transaction Layer.

### Fases canónicas del ciclo M&A

El Transaction OS define el ciclo completo en **15 fases canónicas** organizadas en dos capas:

- **Discovery Layer**: T1 Análisis · T2 Estrategia · T3 Mandato · T4 Screening · T5 Match request · T6 Liberación al marketplace.
- **Transaction Layer**: T7 Apertura de Operación · T8 IM · T9 Q&A · T10 LOI · T11 Due Diligence · T12 Negociación · T13 SPA · T14 Closing legal · T15 Integración post-deal.

Dentro de Due Diligence (T11) viven: Data Room, Q&A, Documentos.

> El detalle canónico de cada fase, sus eventos y su matriz de visibilidad vive en `/app/memory/specs/TRANSACTION_OS_SPEC.md v1.2.0`.

⸻

## 7. Qué NO son entidades

NO son entidades principales: Workspace, Data Room, Q&A, Equipo, Actividad.

Son **capacidades o componentes** funcionales que viven dentro de entidades.

> Reconciliación canónica con `ENTITY_MODEL.md`: **Match**, **Mandate** y **Document** **SÍ son entidades canónicas de primer orden**. La regla "Matching no es entidad" sigue siendo cierta para el **mecanismo** de matching, pero el **Match resultante** (acuerdo bilateral con estados `SOLICITADO`/`ACEPTADO`/`RECHAZADO`/`EXPIRADO`) es entidad de pleno derecho declarada en `TRANSACTION_OS_SPEC §4` y modelada en `ENTITY_MODEL.md`.

⸻

## 8. Workspace

Workspace significa únicamente: memoria, persistencia, contexto, entorno de trabajo.

Puede existir sobre una empresa, sector, territorio, valoración, oportunidad o transacción. Pero nunca sustituye a esas entidades.

⸻

## 9. Reutilización

NO borrar nada.

Reutilizar: Block Library, Skills, Copilot, Workspaces, Historial, EnrichCompanyAdapter, Data Layer, Intelligence Engine.

Los workspaces pasan a ser una capa subordinada de memoria.

⸻

## 10. Orden oficial de construcción

**E1.5-REWORK** — Empresa

↓

**E1.5.5** — Brand Refresh

↓

**E1.6** — Sector

↓

**E1.7** — Territorio

↓

**E1.8** — Valoración

↓

**E1.9** — Oportunidad

↓

**E2.0** — Transacción

↓

**Transaction OS** con:

* Matching
* Teaser
* NDA
* Information Memorandum
* IOI
* LOI
* Due Diligence
* Data Room
* Q&A
* Negociación
* SPA
* Cierre

⸻

## 11. Acción inmediata

NO escribir todavía código.

Primero redactar el brief completo de E1.5-REWORK.

La primera entidad visible del producto será `/empresa/{master_company_id}`.

NO `/workspace/{id}`. NO rutas basadas en conversación. NO páginas construidas alrededor del workspace.

El modelo correcto: EMPRESA → COPILOT CONTEXTUAL → SKILLS → BLOCKS → MEMORIA → WORKSPACE.

Objetivo: Bloomberg + PitchBook + Datasite + Notion + Perplexity. No ChatGPT Projects.

⸻

## 12. Principios UX oficiales

### Acceso público a las entidades

Las fichas de empresa deberán tener una parte pública.

El usuario anónimo podrá ver: identidad, descripción, información básica, algunos datos financieros, señales básicas.

Las capacidades avanzadas estarán protegidas mediante registro.

### Especialistas y Copilot orquestador

El **Transaction Copilot** (TC) es el **orquestador único** que conversa con el usuario: la voz única (principio B6). Internamente delega a **cuatro copilots especializados por dominio de conocimiento** (no por entidad):

- **Company Copilot** — narrativa, insights, riesgos y documentación de Empresa.
- **Market Copilot** — análisis sectorial, territorial, matching y recomendaciones.
- **Valuation Copilot** — valoraciones, comparables, sensibilidades y estructuras de precio.
- **Advisor Copilot** — riesgos contractuales, LOI, DD asistida, checklists de cierre.

La página activa el **contexto** y la **prioridad de invocación** del especialista relevante. NO existe una identidad conversacional separada por entidad: el usuario siempre habla con el TC; el TC adopta el contexto especializado del dominio.

> El detalle canónico vive en `/app/memory/specs/COPILOTS_SPEC.md v1.1.0` y `/app/memory/specs/TRANSACTION_COPILOT_SPEC.md v1.2.0`.

### La ficha es la verdad

La información vive en la entidad. No en el chat.

El chat no genera páginas paralelas. El chat modifica, amplía o explica secciones existentes.

Ejemplos:
- "Háblame de los riesgos" → Actualiza Riesgos.
- "Compárala con Making Science" → Actualiza Comparables.
- "¿Qué oportunidades ves?" → Actualiza Oportunidades.

La conversación es una interfaz. La entidad es el producto.

### Search-first navigation

Cuando una búsqueda identifica una entidad concreta: Kitchen Studio → /empresa/{cif}.

No se devolverán listas de tarjetas en el chat. Solo cuando exista ambigüedad aparecerá un pequeño disambiguador.

La navegación principal debe ser: Buscar → Entidad → Copilot contextual → Acciones.

### Memoria asociada a la entidad

La memoria de trabajo pertenece a la entidad. Cada empresa, sector, territorio, oportunidad y transacción tendrán su propio contexto.

Los workspaces son memoria. No son el producto.

### Regla fundamental

Entidad → Copilot especializado → Skills → Bloques → Memoria → Workspace.

Nunca: Copilot → Workspace → Entidad.

### Diferencia con ChatGPT Projects

ChatGPT Projects almacena conversaciones. arroba.com almacena conocimiento sobre entidades.

La conversación es temporal. La entidad es permanente.

⸻

## 13. Capas canónicas del proyecto

El proyecto se estructura en **siete capas** conceptuales en orden estricto de prioridad:

1. **Blueprint Estratégico** — Visión, entidades, modelo de dominio. Documentado en `ARROBA_PHILOSOPHY.md` (este fichero) + Blueprint v1.0 (`/app/_design_intake/uploads/Arroba Com Blueprint Estrategico Arquitectonico V1.docx`).

2. **UX Blueprint** — Decisiones de experiencia de usuario, navegación, flujos. Documentado en la §12 de este fichero y en el Design Intake (`/app/_design_intake/`).

3. **Entity Framework** — Arquitectura UX canónica: anatomía obligatoria de una ficha de entidad — módulos canónicos (Header, Hero, KPIs, Advisor, Insights, Análisis, Señales, Relaciones, Oportunidades, Documentación, Actividad, Acciones), orden top→bottom, reglas de composición y reutilización, ontología de datos. Documentado en `/app/memory/ENTITY_FRAMEWORK.md` (arquitectura) + `/app/memory/ENTITY_MODEL.md` (ontología). Canonizado en E1.5.6.

4. **Engines & Specs** — Especificaciones funcionales del Transaction OS y sus motores. Documentado en `/app/memory/specs/`:
   - `TRANSACTION_OS_SPEC.md` — el ciclo M&A canónico (T1–T15).
   - `TRANSACTION_COPILOT_SPEC.md` — el orquestador (voz única).
   - `COPILOTS_SPEC.md` — los 4 copilots especializados.
   - `MEMORY_ENGINE_SPEC.md` — el motor único de memoria.
   - `AGENTIC_LAYERS_SPEC.md` — la autonomía controlada (L1–L4).
   - `MONETIZATION_SPEC.md` — el contrato económico (productos, planes, fees).

   Esta capa canoniza los **6 specs del Sprint 0** como **Canonical Baseline v1.0** (congelada 2026-06-25 tras Sprint 0.5 Ciclo B).

5. **Design System** — Sistema visual canónico: tokens, tipografía, espaciados, componentes reutilizables, estados (loading/empty/error), microinteracciones, accesibilidad, responsive. Documentado en `/app/memory/DESIGN_SYSTEM.md`. Canonizado en E1.5.5.

6. **Diseños (Claude)** — Mockups y especificaciones concretas pre-implementación.

7. **Implementación (Emergent)** — Código React/TS/Python ejecutable.

### Regla de jerarquía

Si hay conflicto entre dos capas, **prevalece la capa superior**.

- Blueprint > UX Blueprint > Entity Framework > **Engines & Specs** > Design System > Diseños > Implementación.
- La implementación NUNCA dicta UX. La UX NUNCA dicta Blueprint.
- El Entity Framework sirve al UX Blueprint. Engines & Specs sirve al Entity Framework. El Design System sirve a Engines & Specs y al Entity Framework.
- Los componentes reutilizables NO se diseñan para encajar con el código existente; se diseñan para servir al patrón canónico de las entidades.

### Aplicación

La ficha de Empresa (E1.5-REWORK) es el primer patrón implementado. El Design System se canonizó en E1.5.5 usándola como referencia. El Entity Framework se canoniza en E1.5.6 — define la anatomía + ontología que **todas las entidades del catálogo declarado en `ENTITY_MODEL.md`** (Empresa, Sector, Territorio, Valoración, Oportunidad, Persona, Advisor, Mandate, Operación, Documento, Organization, User, **Match**) heredarán como composición de módulos base, no como rediseño.

⸻

## 14. CHANGELOG

- **v3.0 (2026-06-24)**: redacción original.
- **v3.1 (2026-06-25)** — Sprint 0.5 Ciclo B:
  - §5 reescrita para introducir **Match como entidad canónica de primer nivel** (matiz: Matching es mecanismo, Match es entidad resultante).
  - §6 actualizada con las **15 fases canónicas T1–T15** (Discovery Layer + Transaction Layer).
  - §7 reconciliada con `ENTITY_MODEL.md`: Mandate y Document **SÍ** son entidades canónicas de primer orden; Matching (mecanismo) NO; Match (entidad) SÍ.
  - §12 reescrita: 4 copilots especializados por dominio + Transaction Copilot orquestador (sustituye las 6 identidades legacy).
  - §13 ampliada a **siete capas** con la nueva capa **Engines & Specs** entre Entity Framework y Design System; añadidas referencias a los 6 specs del Sprint 0.
