# ARROBA.COM — Filosofía canónica v3.0 (definitiva)

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

## 5. Oportunidad y Transacción

La Oportunidad es una entidad de descubrimiento.

La Transacción es una entidad de ejecución.

No todas las oportunidades se convierten en una transacción. Pero toda transacción nace de una oportunidad.

La secuencia correcta es: Oportunidad → Matching → Transacción.

⸻

## 6. Transaction OS

La Transacción puede ser **Buy-side** o **Sell-side**.

Dentro de una Transacción viven capacidades y fases.

**Matching**: mecanismo que permite iniciar una operación. NO es una entidad.

### Fases de la operación

Teaser → NDA → Information Memorandum → IOI → LOI → Due Diligence → Negociación → SPA → Cierre.

Dentro de Due Diligence viven: Data Room, Q&A, Documentos.

⸻

## 7. Qué NO son entidades

NO son entidades principales: Workspace, Matching, Mandato, Data Room, Q&A, Equipo, Actividad, Documentos.

Son capacidades o componentes.

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

### Company Advisor

Cada entidad podrá disponer de un agente especializado: Company Advisor, Sector Analyst, Territory Analyst, Valuation Advisor, Opportunity Advisor, Deal Advisor.

El Copilot global existe, pero dentro de una entidad adopta una identidad especializada.

Ejemplo: ✦ Company Advisor de Kitchen Studio.

La inteligencia es contextual.

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
