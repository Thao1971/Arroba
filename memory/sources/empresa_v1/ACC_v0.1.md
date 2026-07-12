# ARROBA Component Catalog (ACC)

> Official Functional Specification

**Status:** Living Document  
**Owner:** ARROBA Product Team  
**Audience:** Product · UX · Frontend · Backend · Data · AI · QA  
**Source of Truth:** Este documento constituye la especificación funcional oficial de arroba.com.

<a id="metadatos-del-documento"></a>
## Metadatos del documento

```yaml
title: "ARROBA Component Catalog (ACC)"
document_type: "Especificación funcional de producto (Source of Truth funcional)"
company: "arroba.com"
version: "0.1 (Draft) — normalización de formato aplicada, sin cambios de contenido"
owner: "ARROBA Product Team"
audience: ["Product", "UX", "Frontend", "Backend", "Data", "AI", "QA"]
language: "es"
last_format_normalization: "2026-07-11"
scope: "Comportamiento funcional de todos los componentes de arroba.com, independiente de su implementación técnica. No describe código, frameworks, arquitectura de software ni infraestructura."
source_of_truth_for: "Funcionalidad"
related_documents:
  - name: "Blueprint"
    answers: "¿Qué es arroba.com?"
  - name: "ZIP Oficial"
    answers: "¿Cómo debe verse?"
  - name: "Agency Tool (arroba.v1)"
    answers: "¿Qué información consume arroba?"
components_defined: 66
chapters_in_index: 23
```

**Nota para agentes de desarrollo (p. ej. Emergent u otras IA de construcción de producto):**
Este documento es la especificación funcional. No contiene código ni arquitectura técnica:
las decisiones de stack, esquema de base de datos e implementación deben derivarse de este
comportamiento, no inventarse. Antes de generar código, revisar primero la sección
[Notas de normalización](#notas-de-normalizacion) para conocer las inconsistencias detectadas
en el documento original.

<a id="como-leer-este-documento"></a>
## Cómo leer este documento

- Cada componente se identifica con un código único `COMP-XXXX` (ver [3. Convenciones Globales](#3-convenciones-globales)).
- Cada componente sigue siempre la misma plantilla de 12 campos, definida en [2. Metodología](#2-metodologia): Objetivo, Responsabilidad, Referencia visual, Elementos, Estados, UX Behaviour, Business Rules, Arroba Intelligence, Integración Backend, Dependencias, Casos especiales, Acceptance Criteria y Relación con otros componentes.
- Los campos de cada componente están en encabezados de nivel 4 (`####`); los componentes y subsecciones numeradas están en nivel 3 (`###`); los capítulos están en nivel 2 (`##`). Esta jerarquía se ha normalizado para que sea consistente en todo el documento (ver [Notas de normalización](#notas-de-normalizacion)).
- Cada bloque de metadatos de componente (`id / name / section / status / owner / version`) es el identificador canónico de ese componente; úsalo para nombrar entidades, endpoints o modelos de datos derivados.
- El documento **describe comportamiento, nunca código**. Las Business Rules son el equivalente más cercano a lógica de negocio explícita y deben tratarse como reglas de validación/autorización a implementar.

<a id="control-de-versiones"></a>
## Control de versiones

| Versión | Estado | Descripción |
|----------|--------|-------------|
| 0.1 | Draft | Inicio de consolidación del ACC |
| 1.0 | Planned | Primera versión funcional completa |

## Índice

- [Metadatos del documento](#metadatos-del-documento)
- [Cómo leer este documento](#como-leer-este-documento)
- [Control de versiones](#control-de-versiones)
- [Glosario](#glosario)
- [Notas de normalización (QA)](#notas-de-normalizacion)
- [0. Introducción](#0-introduccion)
  - [0.1 Propósito](#01-proposito)
  - [0.2 Objetivos](#02-objetivos)
  - [0.3 Alcance](#03-alcance)
  - [0.4 Relación con otros documentos](#04-relacion-con-otros-documentos)
  - [0.5 Source of Truth](#05-source-of-truth)
- [1. Filosofía](#1-filosofia)
  - [1.1 Filosofía de Producto](#11-filosofia-de-producto)
  - [1.2 Filosofía de Datos](#12-filosofia-de-datos)
  - [1.3 Filosofía de Inteligencia](#13-filosofia-de-inteligencia)
  - [1.4 Filosofía de Narrativa](#14-filosofia-de-narrativa)
  - [1.5 Filosofía de Memoria](#15-filosofia-de-memoria)
  - [1.6 Filosofía de Navegación](#16-filosofia-de-navegacion)
  - [1.7 Filosofía de Componentes](#17-filosofia-de-componentes)
  - [1.8 Three Layer Experience](#18-three-layer-experience)
- [2. Metodología](#2-metodologia)
- [3. Convenciones Globales](#3-convenciones-globales)
- [4. Header](#4-header)
  - [COMP-1001 — Company Identity](#comp-1001-company-identity)
  - [COMP-1002 — Company Context](#comp-1002-company-context)
  - [COMP-1003 — Company Public Status](#comp-1003-company-public-status)
  - [COMP-1004 — Company Quick Actions](#comp-1004-company-quick-actions)
  - [COMP-1005 — Executive Snapshot](#comp-1005-executive-snapshot)
  - [COMP-1010 — User Relationship](#comp-1010-user-relationship)
  - [Estado del Capítulo 4](#estado-del-capitulo-4)
  - [Decisiones arquitectónicas consolidadas durante el Capítulo 4](#decisiones-arquitectonicas-consolidadas-durante-el-capitulo-4)
- [5. Executive Vista](#5-executive-vista)
  - [5.1 Objetivo](#51-objetivo)
  - [5.2 Responsabilidades](#52-responsabilidades)
  - [5.3 Arquitectura funcional](#53-arquitectura-funcional)
  - [5.4 Layout](#54-layout)
  - [5.5 Principios](#55-principios)
  - [5.6 Componentes](#56-componentes)
  - [5.7 Componentes eliminados](#57-componentes-eliminados)
  - [5.8 Navegación](#58-navegacion)
  - [5.9 Business Rules Globales](#59-business-rules-globales)
  - [5.10 Dependencias](#510-dependencias)
  - [5.11 Relación con el Header](#511-relacion-con-el-header)
  - [5.12 COMP-2001 — Executive Metrics](#512-comp-2001-executive-metrics)
  - [5.13 COMP-2002 — Arroba Copilot](#513-comp-2002-arroba-copilot)
  - [5.14 COMP-2003 — Next Step Panel](#514-comp-2003-next-step-panel)
  - [Estado del Capítulo 5](#estado-del-capitulo-5)
  - [6.1 COMP-3001 — Financial Workspace](#61-comp-3001-financial-workspace)
  - [6.2 COMP-3002 — Financial Intelligence](#62-comp-3002-financial-intelligence)
  - [6.3 COMP-3003 — Income Statement](#63-comp-3003-income-statement)
  - [6.4 COMP-3004 — Balance Sheet](#64-comp-3004-balance-sheet)
  - [6.5 COMP-3005 — Cash Flow](#65-comp-3005-cash-flow)
  - [6.6 COMP-3006 — Financial Ratios](#66-comp-3006-financial-ratios)
  - [6.7 COMP-3007 — Period Selector](#67-comp-3007-period-selector)
  - [7.1 COMP-4001 — Valuation Section](#71-comp-4001-valuation-section)
  - [COMP-0008 — Connected Intelligence](#comp-0008-connected-intelligence)
  - [7.2 COMP-4002 — Valuation Intelligence](#72-comp-4002-valuation-intelligence)
  - [7.3 COMP-4003 — Valuation Summary](#73-comp-4003-valuation-summary)
  - [7.4 COMP-4004 — Valuation Methods](#74-comp-4004-valuation-methods)
  - [7.5 COMP-4005 — Enterprise Value Bridge](#75-comp-4005-enterprise-value-bridge)
  - [7.6 COMP-4006 — Valuation Scenarios](#76-comp-4006-valuation-scenarios)
  - [7.7 COMP-4007 — Sensitivity Analysis](#77-comp-4007-sensitivity-analysis)
  - [8.1 COMP-5001 — Ownership Section](#81-comp-5001-ownership-section)
  - [8.2 COMP-5002 — Ownership Intelligence](#82-comp-5002-ownership-intelligence)
  - [8.3 COMP-5003 — Ownership Overview](#83-comp-5003-ownership-overview)
  - [8.4 COMP-5004 — Shareholders](#84-comp-5004-shareholders)
  - [8.5 COMP-5005 — Corporate Group](#85-comp-5005-corporate-group)
  - [8.6 COMP-5006 — Ownership Network](#86-comp-5006-ownership-network)
  - [9.1 COMP-6001 — Governance Section](#91-comp-6001-governance-section)
  - [9.2 COMP-6002 — Governance Intelligence](#92-comp-6002-governance-intelligence)
  - [9.3 COMP-6003 — Governance Overview](#93-comp-6003-governance-overview)
  - [9.4 COMP-6004 — Board Members](#94-comp-6004-board-members)
  - [9.5 COMP-6005 — Executives](#95-comp-6005-executives)
  - [9.6 COMP-6006 — Legal Representatives](#96-comp-6006-legal-representatives)
  - [9.7 COMP-6007 — Governance Timeline](#97-comp-6007-governance-timeline)
  - [10.1 COMP-7001 — Market Section](#101-comp-7001-market-section)
  - [10.2 COMP-7002 — Market Intelligence](#102-comp-7002-market-intelligence)
  - [10.3 COMP-7003 — Market Overview](#103-comp-7003-market-overview)
  - [10.4 COMP-7004 — Market Size & Structure](#104-comp-7004-market-size-structure)
  - [10.5 COMP-7005 — Market Trends](#105-comp-7005-market-trends)
  - [10.6 COMP-7006 — Market Positioning](#106-comp-7006-market-positioning)
  - [10.7 COMP-7007 — Market Risks & Opportunities](#107-comp-7007-market-risks-opportunities)
  - [11.1 COMP-8001 — Rankings Section](#111-comp-8001-rankings-section)
  - [11.2 COMP-8002 — Ranking Cards](#112-comp-8002-ranking-cards)
  - [12.1 COMP-9001 — Comparison Universe](#121-comp-9001-comparison-universe)
  - [12.2 COMP-9002 — Executive Comparison](#122-comp-9002-executive-comparison)
  - [12.3 COMP-9003 — Comparable Companies](#123-comp-9003-comparable-companies)
  - [12.3 COMP-9003 — Competitive Positioning](#123-comp-9003-competitive-positioning)
  - [12.4 COMP-9004 — Opportunity Map](#124-comp-9004-opportunity-map)
  - [12.5 COMP-9005 — Competitive Gaps](#125-comp-9005-competitive-gaps)
  - [12.6 COMP-9006 — Competitive Difference Matrix](#126-comp-9006-competitive-difference-matrix)
  - [12.7 COMP-9007 — Financial Comparison](#127-comp-9007-financial-comparison)
  - [13.1 COMP-10001 — Signals Section](#131-comp-10001-signals-section)
  - [13.2 COMP-10002 — Signals Timeline](#132-comp-10002-signals-timeline)
  - [14.1 COMP-11001 — Opportunities Section](#141-comp-11001-opportunities-section)
  - [15.1 COMP-12001 — Sources Section](#151-comp-12001-sources-section)
  - [15.2 COMP-12002 — Corporate Registry Events](#152-comp-12002-corporate-registry-events)
  - [15.3 COMP-12003 — Annual Accounts Registry](#153-comp-12003-annual-accounts-registry)
  - [15.4 COMP-12004 — Registry Information](#154-comp-12004-registry-information)
  - [15.5 COMP-12005 — Documents Section](#155-comp-12005-documents-section)
  - [16.1 COMP-13001 — Next Best Actions](#161-comp-13001-next-best-actions)
  - [16.2 COMP-13002 — Recommendation Explainability](#162-comp-13002-recommendation-explainability)
  - [16.3 COMP-13003 — Recommendation Prioritization](#163-comp-13003-recommendation-prioritization)

<a id="glosario"></a>
## Glosario

| Término | Definición | Fuente en este documento |
|---|---|---|
| **ACC** | ARROBA Component Catalog: especificación funcional oficial de arroba.com. | 0.1 Propósito |
| **Blueprint** | Documento que responde "¿Qué es arroba.com?". Describe la visión del producto. | 0.4 Relación con otros documentos |
| **ZIP Oficial** | Documento que responde "¿Cómo debe verse?". Es la referencia visual/UX; el ACC nunca rediseña. | 0.4 / 2. Metodología |
| **Agency Tool (`arroba.v1`)** | Sistema/contrato que responde "¿Qué información consume arroba?". Calcula; el frontend solo representa. | 0.4 / 2. Metodología |
| **Source of Truth (SoT)** | Documento de referencia autorizado por dominio: Visión→Blueprint, UX→ZIP Oficial, Funcionalidad→ACC, Datos→Agency Tool, Contratos→arroba.v1, Implementación→Código. | 0.5 Source of Truth |
| **COMP-XXXX** | Identificador único de componente. El primer dígito indica el área funcional (ver tabla de Numeración). | 3. Convenciones Globales |
| **BR-XXXX-NNN** | Identificador de Business Rule dentro de un componente o capítulo. | Recurrente en Business Rules |
| **DA-XXXX-NNN** | Identificador de Decisión Arquitectónica consolidada. | Recurrente en Decisiones arquitectónicas |
| **Master ID** | Identificador interno de la empresa; nunca se muestra al usuario. | COMP-1001 Business Rules |
| **Three Layer Experience** | Modelo de tres capas de toda pantalla: Information Layer (describe), Intelligence Layer (interpreta), Action Layer (permite actuar). | 1.8 Three Layer Experience |
| **Estados de componente** | Todo componente contempla, cuando aplique: Loading, Ready, Partial, Empty, Error, No Permission, Premium Locked. | 3. Convenciones Globales |
| **Arroba Intelligence** | Campo de la plantilla de componente donde se documenta la interpretación por IA (nunca sustituye datos, siempre explicable/trazable/contextual/accionable). | 1.3 Filosofía de Inteligencia |

<a id="notas-de-normalizacion"></a>
## Notas de normalización (QA)

Esta sección documenta de forma transparente los cambios de **formato** aplicados a este
documento y las inconsistencias del **contenido original** detectadas durante el proceso,
para que el equipo de producto las revise. No se ha modificado ningún Business Rule,
Acceptance Criteria ni descripción funcional; solo la presentación.

### Cambios de formato aplicados

1. **Jerarquía de encabezados normalizada.** El original usaba `#` y `##` de forma
   intercambiable para el mismo tipo de elemento (p. ej. un capítulo y un campo de
   componente podían compartir nivel). Se re-niveló todo el documento de forma
   consistente: `#` documento · `##` capítulo · `###` subsección/componente ·
   `####` campo del componente · `#####`/`######` elementos anidados (estados,
   principios, reglas individuales, sub-bloques).
2. **Separadores `---` reducidos de ~2.350 a 128.** Con la jerarquía de encabezados
   ya consistente, la mayoría de los `---` (usados como separador visual entre casi
   cada párrafo) dejaron de aportar información estructural. Se conservaron
   únicamente los que delimitan los bloques de metadatos `id/name/section/...` de
   cada componente.
3. **Índice reconstruido con enlaces reales** a cada capítulo, subsección y
   componente, en lugar de una lista de texto plano.
4. **Glosario añadido**, consolidando en un solo lugar términos ya definidos a lo
   largo del documento (Blueprint, Agency Tool, COMP-XXXX, Source of Truth, etc.).
5. Se añadió el bloque de metadatos estándar (id/name/section/status/owner/version) a los componentes COMP-1001, COMP-1002, COMP-1003, COMP-1004, COMP-1005, que eran los únicos de los 66 componentes definidos que carecían de él. Los valores de status, owner y version se alinearon con el valor por defecto usado en el resto del documento (Approved / Product / 1.0); la sección se asignó según el capítulo en el que están ubicados (Header).
6. **12 referencias de inventario simplificadas.** Cuando un componente-contenedor
   listaba sus sub-componentes como encabezados sueltos (`## COMP-3002` + nombre en
   la línea siguiente), se convirtieron en una viñeta simple para no duplicar
   encabezados con la definición completa de ese mismo componente, que aparece más
   adelante en el documento.
7. **Una duplicación exacta de contenido eliminada:** la sección `10.1 COMP-7001 —
   Market Section` estaba repetida palabra por palabra dos veces seguidas; se
   conservó una sola copia.
8. **Una valla de código huérfana eliminada.** En el campo "Inventario inicial de
   KPIs" de COMP-2001 (Executive Metrics) había un bloque de código abierto que
   nunca se cerraba correctamente. En un conversor estricto de Markdown (incluido
   el `.docx` generado a partir de este documento) eso provocaba que un tramo de
   contenido real (encabezados y listas del propio COMP-2001 y COMP-2002) se
   mostrara como texto plano en lugar de con su formato correcto. Se eliminó la
   marca de código sobrante; no se modificó ningún texto visible.

### Inconsistencias del contenido original (no corregidas, solo señaladas)

- **Numeración de capítulos.** El Índice declara 23 capítulos (0 a 22), incluyendo
  "6. Perfil" y "7. Finanzas" como capítulos separados. Sin embargo, en el cuerpo del
  documento nunca aparece un capítulo con título "6. Perfil": el contenido bajo el
  prefijo `6.x` corresponde en realidad a componentes de Finanzas (serie COMP-3xxx,
  rango 3000 según la tabla de Numeración), y el contenido bajo `7.x` corresponde a
  Valoración (serie COMP-4xxx, rango 4000). Recomendación: el equipo de producto
  debería confirmar si "Perfil" es un capítulo pendiente de escribir o si el Índice
  necesita renumerarse.
- **`COMP-9003` tiene dos títulos consecutivos.** En el capítulo 12 (Comparativa)
  aparecen dos encabezados seguidos con el mismo código y número (`12.3 COMP-9003`):
  uno como "Comparable Companies" y, justo debajo, el mismo id como "Competitive
  Positioning" (este último con el bloque de metadatos y todo el contenido). Todo
  indica que "Comparable Companies" es un título anterior no eliminado tras un
  renombramiento; el nombre vigente según el frontmatter es **Competitive
  Positioning**.
- **`COMP-0008` no sigue el rango numérico de su capítulo.** Aparece dentro del
  capítulo de Valoración (rango 4000) con un id fuera de esa serie
  (`COMP-0008 — Connected Intelligence`), a diferencia del resto de componentes de
  ese capítulo (`COMP-4001`...`COMP-4007`).
- **Un `status: Draft` aislado.** De los 66 bloques de metadatos, 65 declaran
  `status: Approved` y uno `status: Draft`; puede ser intencional (componente aún
  no cerrado) o un valor no actualizado — se deja igual, solo se señala.

<a id="0-introduccion"></a>
## 0. Introducción

<a id="01-proposito"></a>
### 0.1 Propósito

El ARROBA Component Catalog (ACC) constituye la especificación funcional oficial de arroba.com.

Describe el comportamiento funcional de todos los componentes de la plataforma independientemente de su implementación tecnológica.

El ACC conecta:

- Blueprint
- Diseño (ZIP oficial)
- Agency Tool (`arroba.v1`)
- Implementación

El ACC nunca describe código.

El ACC describe comportamiento.

<a id="02-objetivos"></a>
### 0.2 Objetivos

El ACC persigue cinco objetivos fundamentales.

###### Objetivo 1

Eliminar interpretaciones durante el desarrollo.

###### Objetivo 2

Mantener una única definición funcional de cada componente.

###### Objetivo 3

Convertirse en la documentación permanente del producto.

###### Objetivo 4

Reducir deuda funcional.

###### Objetivo 5

Permitir que cualquier nuevo miembro del equipo comprenda arroba.com leyendo únicamente este documento.

<a id="03-alcance"></a>
### 0.3 Alcance

El ACC documenta:

- Componentes
- Estados
- Flujos
- Reglas de negocio
- Navegación
- UX Behaviour
- Dependencias
- Integraciones
- Casos especiales
- Acceptance Criteria

No documenta:

- Código
- Frameworks
- Arquitectura software
- Infraestructura
- Diseño visual detallado

<a id="04-relacion-con-otros-documentos"></a>
### 0.4 Relación con otros documentos

###### Blueprint

Responde:

> ¿Qué es arroba.com?

###### ACC

Responde:

> ¿Cómo funciona arroba.com?

###### Agency Tool (`arroba.v1`)

Responde:

> ¿Qué información consume arroba?

###### ZIP Oficial

Responde:

> ¿Cómo debe verse?

<a id="05-source-of-truth"></a>
### 0.5 Source of Truth

| Dominio | SoT |
|----------|-----|
| Visión | Blueprint |
| UX | ZIP Oficial |
| Funcionalidad | ACC |
| Datos | Agency Tool |
| Contratos | arroba.v1 |
| Implementación | Código |

<a id="1-filosofia"></a>
## 1. Filosofía

<a id="11-filosofia-de-producto"></a>
### 1.1 Filosofía de Producto

Todo componente existe para ayudar al usuario a comprender mejor una empresa o avanzar en un proceso.

No existen componentes decorativos.

Todo componente responde una pregunta.

<a id="12-filosofia-de-datos"></a>
### 1.2 Filosofía de Datos

Arroba consume entidades.

Nunca consume fuentes.

Las fuentes pertenecen al Data Layer.

<a id="13-filosofia-de-inteligencia"></a>
### 1.3 Filosofía de Inteligencia

La IA no sustituye los datos.

Los interpreta.

Toda inteligencia deberá ser:

- explicable
- trazable
- contextual
- accionable

<a id="14-filosofia-de-narrativa"></a>
### 1.4 Filosofía de Narrativa

Las narrativas no se almacenan.

Se generan dinámicamente utilizando hechos estructurados.

La IA nunca inventa actividades.

La IA traduce lenguaje jurídico a lenguaje empresarial.

<a id="15-filosofia-de-memoria"></a>
### 1.5 Filosofía de Memoria

Arroba recuerda trabajo.

Nunca conversaciones.

La memoria pertenece a:

- oportunidades
- valoraciones
- alertas
- seguimientos
- operaciones

<a id="16-filosofia-de-navegacion"></a>
### 1.6 Filosofía de Navegación

La navegación responde:

> ¿Dónde quiero ir?

Los workflows responden:

> ¿Qué debo hacer ahora?

<a id="17-filosofia-de-componentes"></a>
### 1.7 Filosofía de Componentes

Un componente representa una responsabilidad funcional.

Nunca una implementación técnica.

<a id="18-three-layer-experience"></a>
### 1.8 Three Layer Experience

Toda pantalla pertenece a una o varias capas.

###### Information Layer

Describe la realidad.

###### Intelligence Layer

Interpreta la realidad.

###### Action Layer

Permite actuar sobre la realidad.

<a id="2-metodologia"></a>
## 2. Metodología

Todo componente seguirá exactamente la misma estructura.

```
Objetivo

Responsabilidad

Referencia visual

Elementos

Estados

UX Behaviour

Business Rules

Arroba Intelligence

Integración Backend

Dependencias

Casos especiales

Acceptance Criteria

Relación con otros componentes
```

No se admitirán excepciones.

#### Principios metodológicos

- El ACC nunca rediseña.
- El ZIP es la referencia visual.
- El frontend representa.
- Agency Tool calcula.
- Toda decisión aprobada pasa al ACC.
- Ninguna funcionalidad se desarrolla antes de documentarse.

<a id="3-convenciones-globales"></a>
## 3. Convenciones Globales

#### Nomenclatura

```
COMP-XXXX
```

Ejemplo.

```
COMP-1001
Company Identity
```

#### Numeración

| Área | Rango |
|------|-------|
| Header |1000|
| Executive Vista |2000|
| Finanzas |3000|
| Valoración |4000|
| Propiedad |5000|
| Objetivos |6000|
| Mercado |7000|
| Rankings |8000|
| Comparativa |9000|
| Señales |10000|
| Oportunidades |11000|

#### Estados

Todos los componentes deberán contemplar cuando aplique:

- Loading
- Ready
- Partial
- Empty
- Error
- No Permission
- Premium Locked

<a id="4-header"></a>
## 4. Header

#### Objetivo

El Header constituye el punto de entrada a la Ficha de Empresa.

Debe permitir que cualquier usuario identifique la empresa, comprenda su contexto y pueda comenzar a trabajar sobre ella en menos de un minuto.

No sustituye al resto de módulos.

Introduce la empresa.

#### Responsabilidades

- Identificar la empresa.
- Proporcionar contexto.
- Mostrar estados públicos.
- Permitir acciones rápidas.
- Introducir la inteligencia.
- Mostrar la relación privada del usuario.

#### Arquitectura funcional

```
Header

├── Company Identity

├── Company Context

├── Company Public Status

├── Company Quick Actions

├── Executive Snapshot

└── User Relationship
```

#### Principios

- Identificación inmediata.
- Contexto antes que detalle.
- Inteligencia antes que análisis.
- Separación entre información pública y privada.
- Acciones sin fricción.

#### Reglas globales

El Header permanece visible durante toda la navegación.

Nunca modifica su layout.

Toda la información procede de Agency Tool.

El frontend no implementa lógica de negocio.

<a id="comp-1001-company-identity"></a>
### COMP-1001 — Company Identity

---

id: COMP-1001

name: Company Identity

section: Header

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Responder:

> ¿Qué empresa tengo delante?

#### Responsabilidad

Mostrar la identidad pública y estable de la empresa.

No interpreta.

No analiza.

No recomienda.

#### Elementos

- Logo.
- Razón social.
- Nombre comercial.
- CIF.
- Sitio web.
- Estado de cotización.
- Mercado.

#### Información excluida

No muestra:

- EBITDA.
- Facturación.
- Ratios.
- Alertas.
- Riesgos.
- Información privada.

#### Business Rules

- El CIF es el identificador visible principal.
- El Master ID nunca será visible.
- El estado de cotización nunca se inferirá.
- La web deberá ser oficial.
- El componente nunca dependerá del usuario.

#### Casos especiales

Empresa sin logotipo.

↓

Avatar por defecto.

Empresa cotizada.

↓

Mostrar badge correspondiente.

#### Acceptance Criteria

- Identifica inequívocamente la empresa.
- Funciona con datos parciales.
- Consume únicamente Agency Tool.
- No contiene lógica de negocio.

<a id="comp-1002-company-context"></a>
### COMP-1002 — Company Context

---

id: COMP-1002

name: Company Context

section: Header

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Responder:

> ¿Qué tipo de empresa es?

#### Responsabilidad

Contextualizar la empresa utilizando narrativa empresarial generada por IA.

No interpreta.

No recomienda.

No valora.

#### Elementos

- Executive Description.
- Why it Matters.
- Sectores.
- Actividades.
- Cobertura geográfica.
- Hechos corporativos.

#### Principios

- Basado en hechos.
- Lenguaje empresarial.
- Narrativa corta.
- Escaneable.

#### Business Rules

- La narrativa nunca se almacena.
- Se genera dinámicamente.
- El objeto social constituye la fuente principal.
- La IA nunca inventa actividades.
- El frontend nunca genera la narrativa.

#### Acceptance Criteria

- Traduce correctamente el objeto social.
- No utiliza lenguaje jurídico.
- Funciona con datos parciales.
- Consume exclusivamente Agency Tool.

<a id="comp-1003-company-public-status"></a>
### COMP-1003 — Company Public Status

---

id: COMP-1003

name: Company Public Status

section: Header

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Responder:

> ¿Existe alguna situación estratégica pública que deba conocer?

#### Estados soportados

- Buscando comprador.
- Buscando inversor.
- Buscando financiación.
- Comprando empresas.
- Buscando socios estratégicos.

#### Business Rules

- Los estados pertenecen a la empresa.
- Nunca al usuario.
- Deben estar verificados.
- Nunca se mostrarán estados incompatibles.

#### Acceptance Criteria

- Solo muestra estados públicos.
- Es idéntico para todos los usuarios.
- Desaparece automáticamente cuando no existe ningún estado.

<a id="comp-1004-company-quick-actions"></a>
### COMP-1004 — Company Quick Actions

---

id: COMP-1004

name: Company Quick Actions

section: Header

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Responder:

> ¿Qué puedo hacer con esta empresa?

No responde:

> ¿Qué debería hacer?

Eso pertenece al Next Step Panel.

#### Acciones

- Seguir.
- Comparar.
- Crear valoración.
- Crear oportunidad.
- Compartir.
- Exportar.

##### Decisión arquitectónica

Toda operación nace previamente como una oportunidad.

Nunca existe "Crear operación".

#### Business Rules

- Las acciones nunca ejecutan procesos largos.
- Siempre inician un workflow.
- Nunca modifican directamente la empresa.
- No contienen inteligencia.

#### Acceptance Criteria

- Todas las acciones funcionan mediante workflows.
- Respetan permisos.
- Consumen exclusivamente Agency Tool.

<a id="comp-1005-executive-snapshot"></a>
### COMP-1005 — Executive Snapshot

---

id: COMP-1005

name: Executive Snapshot

section: Header

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Responder:

> Si solo dispusiera de un minuto, ¿qué debería saber?

Constituye el principal componente de inteligencia del Header.

#### Cognitive Intelligence Pattern

Siempre responderá cinco preguntas.

###### 1.

¿Qué tengo delante?

###### 2.

¿Por qué merece atención?

###### 3.

¿Qué comprobaría?

###### 4.

¿Qué haría ahora?

###### 5.

¿Con qué confianza?

#### Principios

- Inteligencia antes que información.
- Explicabilidad.
- Acción.
- Confianza.

#### Business Rules

- Nunca inventa información.
- Toda afirmación es explicable.
- Las recomendaciones no son obligatorias.
- No sustituye al análisis completo.

#### Decisiones consolidadas

El Executive Snapshot constituye el principal componente de inteligencia de la Ficha de Empresa.

Todo Snapshot seguirá obligatoriamente el Cognitive Intelligence Pattern.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- Responda correctamente al Cognitive Intelligence Pattern.
- No replique información ya visible en otros componentes.
- Explique todas sus conclusiones.
- Consuma exclusivamente información procedente de Agency Tool (`arroba.v1`).
- No implemente lógica de negocio en el frontend.

#### Relación con otros componentes

Company Context responde:

> ¿Qué tipo de empresa es?

Executive Snapshot responde:

> ¿Por qué debería prestarle atención?

Executive Metrics responderá:

> ¿Cómo está económicamente?

Next Step Panel responderá:

> ¿Qué debería hacer ahora?

Arroba Copilot responderá:

> ¿Cómo puedo hacerlo?

Cada componente responde una única pregunta.

Nunca deberán solaparse.

<a id="comp-1010-user-relationship"></a>
### COMP-1010 — User Relationship

---

id: COMP-1010

name: User Relationship

section: Header

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

User Relationship representa toda la información privada existente entre el usuario y la empresa.

Mientras el resto del Header describe la empresa, User Relationship describe la relación que el usuario mantiene con ella.

Responde a una única pregunta.

> **¿Qué relación tengo con esta empresa?**

Nunca modifica la información pública.

Nunca modifica la identidad de la empresa.

Nunca modifica el Executive Snapshot.

Constituye la primera capa privada de la plataforma.

#### Responsabilidad

Mostrar el estado actual del trabajo del usuario sobre una empresa.

No representa conversaciones.

No representa inteligencia.

No representa información pública.

Representa únicamente trabajo realizado.

#### Principios

#### Memoria de trabajo

arroba recuerda trabajo.

No conversaciones.

#### Contexto privado

Dos usuarios distintos podrán visualizar exactamente la misma empresa y observar contenidos completamente diferentes en User Relationship.

#### Persistencia

La relación permanece aunque el usuario abandone la empresa.

##### No intrusivo

Nunca sustituye la información pública.

Simplemente añade contexto personal.

#### Elementos

##### UR-001 Estado de seguimiento

Indica si el usuario sigue la empresa.

Ejemplos.

- No seguida.
- Siguiendo.
- Seguimiento prioritario.

##### UR-002 Última actividad

Última acción relevante realizada por el usuario.

Ejemplos.

- Valoración creada hace 3 días.
- Comparativa realizada ayer.
- Oportunidad abierta.
- Informe exportado.

No constituye un historial completo.

Únicamente el último evento relevante.

##### UR-003 Valoraciones

Resumen de las valoraciones existentes.

Ejemplo.

```
2 valoraciones

Última actualización

Hace 12 días
```

##### UR-004 Oportunidades

Resumen de oportunidades activas.

Ejemplo.

```
1 oportunidad abierta

Estado

Contacto inicial
```

No representa el workflow.

Únicamente informa de su existencia.

##### UR-005 Alertas

Número de alertas activas.

Ejemplos.

- Cambios financieros.
- Nuevas señales.
- Noticias relevantes.
- Cambio de estado público.

##### UR-006 Watchlists

Listas personalizadas donde el usuario ha incorporado la empresa.

Ejemplos.

- Industriales.
- Targets 2026.
- Empresas seguidas.

##### UR-007 Notas privadas

Indicador de existencia.

Nunca muestra el contenido.

#### Información deliberadamente excluida

User Relationship nunca mostrará:

- Información pública.
- Estados estratégicos.
- Workflow.
- Timeline.
- Señales globales.
- Riesgos públicos.
- Información perteneciente a otros usuarios.

#### Estados

##### Ready

Estado normal.

##### Empty

El usuario nunca ha interactuado con la empresa.

Se mostrará:

> Aún no has trabajado con esta empresa.

##### Loading

Esperando contexto del usuario.

##### Error

No se ha podido recuperar la información privada.

La empresa continuará mostrándose normalmente.

#### UX Behaviour

El componente deberá actualizarse inmediatamente tras cualquier acción realizada por el usuario.

Ejemplos.

Crear valoración.

↓

Actualizar User Relationship.

Seguir empresa.

↓

Actualizar User Relationship.

Crear oportunidad.

↓

Actualizar User Relationship.

No será necesario recargar la ficha.

#### Business Rules

##### BR-1010-001

Toda la información pertenece exclusivamente al usuario conectado.

##### BR-1010-002

Dos usuarios nunca compartirán User Relationship.

##### BR-1010-003

La eliminación de una valoración actualizará automáticamente el componente.

##### BR-1010-004

Las oportunidades cerradas desaparecerán del resumen activo.

##### BR-1010-005

El componente nunca calculará información.

Únicamente representará el estado recibido.

#### Arroba Intelligence

User Relationship no genera inteligencia.

Sin embargo constituye uno de los principales contextos consumidos por:

- Arroba Copilot.
- Recommendation Engine.
- Next Step Panel.
- Opportunity Engine.

Su valor reside en proporcionar memoria contextual.

#### Integración Backend

Agency Tool (`arroba.v1`)

Información requerida.

- Following Status.
- User Activity.
- Active Opportunities.
- Valuations.
- Alerts.
- Watchlists.
- Private Notes Indicator.

Toda la agregación pertenece a Agency Tool.

#### Dependencias

Depende de:

- Usuario autenticado.
- Empresa.
- Opportunity Engine.
- Valuation Engine.
- Alert Engine.

No depende del resto del Header.

#### Casos especiales

##### Usuario nuevo

No existe historial.

El componente mostrará el estado Empty.

##### Organización

Podrá ampliarse con información compartida por la organización.

Esta funcionalidad no forma parte de la versión inicial.

##### Usuario Advisor

El componente podrá distinguir entre:

- trabajo propio;
- trabajo para clientes.

No modifica la estructura del componente.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- Muestre exclusivamente información privada.
- Nunca replique información pública.
- Se actualice automáticamente tras cada acción.
- Sea completamente distinto para usuarios diferentes.
- No implemente lógica de negocio en el frontend.
- Consuma exclusivamente información procedente de Agency Tool (`arroba.v1`).

#### Relación con otros componentes

Company Identity

↓

Describe la empresa.

Company Context

↓

Describe el negocio.

Company Public Status

↓

Describe el estado estratégico público.

Executive Snapshot

↓

Interpreta la empresa.

User Relationship

↓

Describe la relación privada del usuario.

Next Step Panel

↓

Describe el trabajo actual.

Esta separación constituye uno de los principios fundamentales de la arquitectura funcional de arroba.com.

<a id="estado-del-capitulo-4"></a>
### Estado del Capítulo 4

##### Header

| Código | Componente | Estado |
|---------|------------|--------|
| COMP-1001 | Company Identity | ✅ |
| COMP-1002 | Company Context | ✅ |
| COMP-1003 | Company Public Status | ✅ |
| COMP-1004 | Company Quick Actions | ✅ |
| COMP-1005 | Executive Snapshot | ✅ |
| COMP-1010 | User Relationship | ✅ |

<a id="decisiones-arquitectonicas-consolidadas-durante-el-capitulo-4"></a>
### Decisiones arquitectónicas consolidadas durante el Capítulo 4

##### DA-0001

El ZIP constituye la única Source of Truth visual.

##### DA-0002

Toda operación nace previamente como una oportunidad.

##### DA-0003

La IA genera narrativas.

Nunca las almacena.

##### DA-0004

Executive Overview se elimina como componente independiente.

Su responsabilidad queda repartida entre:

- Company Context.
- Executive Snapshot.

##### DA-0005

El Header representa tres dimensiones claramente diferenciadas.

#### Información pública

- Company Identity
- Company Context
- Company Public Status

###### Inteligencia

- Executive Snapshot

#### Contexto privado

- User Relationship

###### Acción

- Company Quick Actions

**Fin del Capítulo 4 — Header**

<a id="5-executive-vista"></a>
## 5. Executive Vista

<a id="51-objetivo"></a>
### 5.1 Objetivo

Executive Vista constituye el centro de decisión de la Ficha de Empresa.

Mientras el Header identifica y contextualiza la entidad, Executive Vista transforma esa información en una visión ejecutiva que permite al usuario decidir si merece la pena profundizar en el análisis o iniciar una acción.

Executive Vista responde a una única pregunta:

> **¿Qué necesito saber para decidir mi siguiente paso sobre esta empresa?**

No pretende sustituir los módulos especializados.

No sustituye Finanzas.

No sustituye Valoración.

No sustituye Mercado.

Su misión consiste en ofrecer una visión ejecutiva integrada.

<a id="52-responsabilidades"></a>
### 5.2 Responsabilidades

Executive Vista es responsable de:

- resumir la situación económica;
- mostrar los principales indicadores ejecutivos;
- interpretar dichos indicadores;
- conectar la información con el workflow del usuario;
- orientar la siguiente decisión.

Nunca pretende sustituir el análisis detallado.

<a id="53-arquitectura-funcional"></a>
### 5.3 Arquitectura funcional

Executive Vista se compone de tres capas claramente diferenciadas.

```text
Executive Vista

Information Layer

    Executive Metrics

──────────────────────────

Intelligence Layer

    Arroba Copilot

──────────────────────────

Action Layer

    Next Step Panel
```

Estas capas representan tres responsabilidades completamente distintas.

Nunca deberán mezclarse.

<a id="54-layout"></a>
### 5.4 Layout

La disposición visual viene determinada exclusivamente por el ZIP oficial.

Executive Vista ocupa la columna central de la Ficha de Empresa.

El Next Step Panel permanece en la columna derecha.

La navegación permanece en la columna izquierda.

Arroba Copilot permanece disponible durante toda la navegación.

El ACC no modifica esta distribución.

<a id="55-principios"></a>
### 5.5 Principios

Executive Vista se construye siguiendo los siguientes principios.

#### Visión ejecutiva

Toda la información deberá poder comprenderse en menos de dos minutos.

##### De mayor a menor profundidad

El usuario siempre comienza leyendo Executive Vista.

Posteriormente decide si desea acceder a:

- Finanzas.
- Valoración.
- Mercado.
- Comparativa.
- Señales.

Nunca al revés.

##### Inteligencia contextual

Toda interpretación deberá depender exclusivamente de la empresa visualizada.

Nunca del usuario.

##### Acción contextual

Las acciones recomendadas dependerán del trabajo del usuario.

Nunca modificarán la información pública.

##### Continuidad

Executive Vista nunca constituye un punto final.

Siempre conduce al siguiente análisis.

<a id="56-componentes"></a>
### 5.6 Componentes

Executive Vista está formada por los siguientes componentes.

| Código | Componente | Estado |
|----------|-------------------------------|---------|
|COMP-2001|Executive Metrics|Draft|
|COMP-2002|Arroba Copilot (Contextual)|Draft|
|COMP-2003|Next Step Panel|Approved|

<a id="57-componentes-eliminados"></a>
### 5.7 Componentes eliminados

Durante la consolidación del ACC se elimina el siguiente componente.

| Código | Componente | Motivo |
|----------|---------------------------|-----------------------------|
|COMP-2006|Executive Overview|Duplicidad funcional|

Su responsabilidad queda absorbida por:

- Company Context.
- Executive Snapshot.

<a id="58-navegacion"></a>
### 5.8 Navegación

Executive Vista constituye el punto de entrada hacia:

- Finanzas.
- Valoración.
- Comparativa.
- Mercado.
- Señales.
- Oportunidades.

No contiene información exhaustiva.

Contiene accesos inteligentes.

<a id="59-business-rules-globales"></a>
### 5.9 Business Rules Globales

##### BR-2000-001

Executive Vista nunca mostrará información duplicada respecto al Header.

##### BR-2000-002

Toda interpretación deberá estar soportada por Agency Tool.

##### BR-2000-003

Los componentes de Executive Vista deberán poder evolucionar independientemente.

##### BR-2000-004

La ausencia de un componente nunca impedirá visualizar el resto.

##### BR-2000-005

Executive Vista nunca contendrá workflows completos.

Los workflows pertenecen exclusivamente al Next Step Panel.

<a id="510-dependencias"></a>
### 5.10 Dependencias

Executive Vista depende de:

- Company Entity.
- Agency Tool (`arroba.v1`).
- Arroba Copilot.
- User Context.
- Opportunity Engine.

No depende de módulos especializados.

<a id="511-relacion-con-el-header"></a>
### 5.11 Relación con el Header

Header responde:

> ¿Qué empresa estoy viendo?

Executive Vista responde:

> ¿Qué necesito saber para decidir?

Finanzas responde:

> ¿Cómo está realmente la empresa?

Valoración responde:

> ¿Cuánto vale?

Oportunidades responde:

> ¿Qué puedo hacer con ella?

Esta secuencia constituye el recorrido natural del usuario dentro de la Ficha de Empresa.

<a id="512-comp-2001-executive-metrics"></a>
### 5.12 COMP-2001 — Executive Metrics

---

id: COMP-2001

name: Executive Metrics

section: Executive Vista

status: Draft

owner: Product

version: 1.0

---

#### Objetivo

Executive Metrics resume la situación económica de una empresa utilizando un conjunto reducido de indicadores ejecutivos.

Su misión consiste en responder:

> **¿Cómo está económicamente esta empresa?**

No pretende sustituir el módulo Finanzas.

No muestra detalle contable.

No representa evolución histórica completa.

Proporciona una fotografía económica inmediata.

#### Responsabilidad

Mostrar exclusivamente los indicadores económicos considerados estratégicos para una primera lectura ejecutiva.

Todos los indicadores deberán:

- ser comparables;
- ser explicables;
- ser trazables;
- ser consistentes entre empresas.

#### Principios

##### Simplicidad

Menos métricas.

Más comprensión.

##### Comparabilidad

Siempre que exista información, cada indicador deberá poder compararse con:

- sector;
- histórico;
- percentil.

##### Explicabilidad

Todo indicador dispondrá de:

- definición;
- fuente;
- fecha de actualización;
- explicación.

#### Navegabilidad

Cada métrica constituye una puerta de entrada al análisis detallado.

Nunca un punto final.

#### Inventario inicial de KPIs

Los KPIs definitivos se obtendrán del ZIP oficial.

Hasta el momento quedan aprobados los siguientes.

- Facturación
- EBITDA
- Margen EBITDA
- Beneficio Neto
- Deuda Financiera Neta
- CAGR (3 o 5 años cuando exista)
- Número de empleados
- EV (cuando exista)
- Equity Value (cuando exista)

#### KPIs aprobados

Hasta el momento quedan congelados los siguientes indicadores ejecutivos.

| KPI | Estado |
|------|---------|
| Facturación | ✅ |
| EBITDA | ✅ |
| Margen EBITDA | ✅ |
| Beneficio Neto | ✅ |
| Deuda Financiera Neta | ✅ |
| CAGR 3 años (si existe) | ✅ |
| CAGR 5 años (si existe) | ✅ |
| Empleados | ✅ |
| Enterprise Value (cuando exista) | ✅ |
| Equity Value (cuando exista) | ✅ |

La incorporación de nuevos indicadores requerirá aprobación explícita del ACC.

#### Orden de presentación

Los indicadores deberán seguir siempre el mismo orden.

##### 1. Tamaño

- Facturación
- Empleados

##### 2. Rentabilidad

- EBITDA
- Margen EBITDA
- Beneficio Neto

##### 3. Crecimiento

- CAGR

##### 4. Solvencia

- Deuda Financiera Neta

##### 5. Valor

- Enterprise Value
- Equity Value

Este orden responde a una lectura ejecutiva natural:

Tamaño

↓

Rentabilidad

↓

Crecimiento

↓

Riesgo

↓

Valor

#### Información complementaria

Cada KPI podrá mostrar información secundaria.

Ejemplos.

Facturación

↓

+8,2 %

vs año anterior

EBITDA

↓

Percentil 82

sector

Margen EBITDA

↓

Superior al sector

CAGR

↓

5 años

Nunca se mostrará información secundaria si no existe soporte suficiente.

#### Tooltip

Todos los KPIs deberán utilizar el componente Tooltip definido por el Design System.

El Tooltip incluirá obligatoriamente.

#### Definición

Qué representa el indicador.

#### Fórmula

Cuando proceda.

#### Fuente

Motor que lo genera.

##### Fecha de actualización

Última actualización disponible.

##### Nivel de confianza

Cuando proceda.

##### Enlace

Ver análisis completo.

#### Estados

##### Loading

Skeleton completo.

Nunca valores parciales.

##### Ready

Estado normal.

##### Partial

Algunos indicadores no disponibles.

Los indicadores ausentes permanecerán visibles mostrando:

"No disponible"

Nunca desaparecerán.

##### Empty

No existe información económica suficiente.

Se mostrará un mensaje estándar.

##### Premium Locked

Cuando el indicador pertenezca a un plan superior.

Se seguirá el patrón oficial de monetización.

#### UX Behaviour

Cada KPI deberá poder pulsarse.

La navegación dependerá del indicador.

Ejemplos.

Facturación

↓

Finanzas → Cuenta de Resultados

EBITDA

↓

Finanzas → EBITDA

Margen EBITDA

↓

Ratios

Deuda Financiera Neta

↓

Balance

Enterprise Value

↓

Valoración

Equity Value

↓

Valoración

Nunca abrirán ventanas independientes.

Siempre navegarán dentro de la ficha.

#### Business Rules

##### BR-2001-001

Todos los KPIs procederán exclusivamente de Agency Tool.

##### BR-2001-002

El frontend nunca recalculará indicadores.

##### BR-2001-003

La ausencia de un KPI nunca modificará el layout.

##### BR-2001-004

Todos los indicadores deberán utilizar exactamente el mismo formato visual.

##### BR-2001-005

Las comparaciones sectoriales utilizarán siempre el mismo universo definido por Agency Tool.

Nunca por el frontend.

##### BR-2001-006

El histórico utilizado para CAGR deberá corresponder al periodo realmente disponible.

Nunca se estimará.

##### BR-2001-007

Enterprise Value y Equity Value únicamente aparecerán cuando exista una valoración disponible.

No se calcularán implícitamente.

##### BR-2001-008

Cuando una empresa cotice, los indicadores financieros seguirán representando información fundamental.

Nunca sustituirán métricas bursátiles.

#### Arroba Intelligence

Executive Metrics representa información.

No inteligencia.

Sin embargo cada KPI podrá ser enriquecido mediante:

- comparación sectorial;
- percentil;
- evolución;
- anomalías;
- tendencias.

La interpretación pertenece al Executive Snapshot.

No a Executive Metrics.

#### Integración Backend

Agency Tool (`arroba.v1`)

Información requerida.

- Revenue
- EBITDA
- EBITDA Margin
- Net Income
- Net Financial Debt
- CAGR
- Employees
- Enterprise Value
- Equity Value

Información complementaria.

- Sector Percentiles
- Historical Series
- Confidence
- Updated At

Toda agregación pertenece a Agency Tool.

#### Dependencias

Executive Metrics depende de:

- Financial Intelligence Engine
- Valuation Engine
- Company Entity

No depende de:

- Usuario
- Workflow
- Oportunidades

#### Casos especiales

##### Empresa de nueva creación

No existe CAGR.

El KPI permanecerá visible indicando:

"No disponible".

##### Empresa sin valoración

Enterprise Value

↓

No disponible.

Equity Value

↓

No disponible.

##### Empresa cotizada

Se mantienen exactamente los mismos KPIs.

La condición de cotizada se comunica exclusivamente desde Company Identity.

No modifica Executive Metrics.

##### Empresa con información parcial

Solo se muestran indicadores verificables.

Nunca se interpolan.

Nunca se estiman.

#### Acceptance Criteria

Executive Metrics se considerará correctamente implementado cuando:

- Muestre los KPIs aprobados por el ACC.
- Mantenga siempre el mismo orden.
- Todos los KPIs dispongan de Tooltip.
- Todos sean navegables.
- Funcione correctamente con información parcial.
- No implemente lógica de negocio.
- Consuma exclusivamente Agency Tool (`arroba.v1`).

#### Relación con otros componentes

Company Context

↓

Describe.

Executive Snapshot

↓

Interpreta.

Executive Metrics

↓

Cuantifica.

Next Step Panel

↓

Orienta.

Arroba Copilot

↓

Explica.

Executive Vista se construye sobre la combinación de estos cinco niveles.

#### Decisiones arquitectónicas consolidadas

##### DA-2001-001

Executive Metrics nunca sustituye Finanzas.

##### DA-2001-002

Todos los KPIs son navegables.

##### DA-2001-003

Los KPIs nunca contienen inteligencia interpretativa.

Solo representan información cuantitativa enriquecida.

##### DA-2001-004

Toda interpretación económica pertenece al Executive Snapshot y a Arroba Copilot.

Nunca a Executive Metrics.

Fin de COMP-2001.

<a id="513-comp-2002-arroba-copilot"></a>
### 5.13 COMP-2002 — Arroba Copilot

---

id: COMP-2002

name: Arroba Copilot

section: Executive Vista

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Arroba Copilot constituye la interfaz universal de interacción de arroba.com.

Su misión consiste en permitir que cualquier usuario pueda comprender, analizar y actuar sobre una empresa mediante lenguaje natural, utilizando toda la inteligencia disponible en la plataforma.

Arroba Copilot no sustituye la navegación.

No sustituye los módulos especializados.

No sustituye los motores de inteligencia.

Su responsabilidad consiste en convertir la inteligencia de arroba.com en una experiencia conversacional sencilla, contextual y accionable.

Responde a una única pregunta.

> ¿Cómo puedo obtener el máximo valor de esta empresa utilizando arroba?

#### Responsabilidad

Arroba Copilot actúa como orquestador de capacidades.

No posee conocimiento propio.

No almacena información.

No calcula indicadores.

No interpreta datos directamente.

Su responsabilidad consiste en:

- comprender la intención del usuario;
- identificar el contexto activo;
- consultar los motores adecuados;
- construir una respuesta comprensible;
- proponer acciones cuando proceda.

#### Filosofía

Arroba Copilot no es un chatbot.

Es una interfaz de trabajo.

Su objetivo no consiste en mantener conversaciones largas.

Su objetivo consiste en reducir el tiempo necesario para analizar una empresa y ejecutar una acción.

Cada interacción debe acercar al usuario a una decisión.

#### Principios

##### Context First

Toda conversación comienza sobre un contexto.

El usuario nunca deberá explicar sobre qué empresa está trabajando cuando ya se encuentre dentro de su ficha.

##### Intelligence First

Las respuestas deberán construirse utilizando prioritariamente información estructurada procedente de los Intelligence Engines.

La IA únicamente organiza y explica dicha información.

##### Explainability

Toda conclusión deberá poder justificarse.

Cuando una recomendación proceda de un motor de inteligencia, el usuario deberá poder conocer:

- por qué se genera;
- qué información la soporta;
- cuál es su nivel de confianza.

##### Action First

Siempre que sea posible, la conversación deberá finalizar con una acción concreta.

Ejemplos:

- abrir Finanzas;
- crear una valoración;
- iniciar una oportunidad;
- comparar con el sector;
- exportar un informe.

##### Non Intrusive

Arroba Copilot nunca sustituye la interfaz.

La complementa.

El usuario puede realizar cualquier tarea tanto mediante la navegación tradicional como mediante conversación.

##### Capacidades

Arroba Copilot podrá:

##### Explicar

Interpretar información visible.

Ejemplos.

¿Por qué ha disminuido el EBITDA?

¿Qué significa esta señal?

Explícame este múltiplo.

##### Analizar

Solicitar análisis completos.

Ejemplos.

Analiza esta empresa.

Analiza el sector.

Analiza la valoración.

##### Comparar

Comparar empresas.

Comparar sectores.

Comparar periodos.

Comparar valoraciones.

##### Recomendar

Responder preguntas del tipo.

¿Qué revisarías?

¿Qué riesgos ves?

¿Qué oportunidades identificas?

Todas las recomendaciones deberán apoyarse en datos verificables.

##### Navegar

Abrir automáticamente módulos de la plataforma.

Ejemplos.

Muéstrame Finanzas.

↓

Abrir módulo Finanzas.

Compara con el sector.

↓

Abrir Comparativa.

##### Ejecutar acciones

Iniciar workflows.

Ejemplos.

Crear valoración.

Crear oportunidad.

Seguir empresa.

Exportar informe.

Las acciones críticas requerirán siempre confirmación.

#### Información deliberadamente excluida

Arroba Copilot nunca:

- modifica datos corporativos;
- altera métricas;
- cambia estados de una empresa;
- ejecuta acciones irreversibles sin confirmación;
- inventa información.

#### Estados

##### Disponible

Estado normal.

##### Procesando

Consultando motores y preparando respuesta.

##### Acción disponible

Existe una acción ejecutable.

#### Información insuficiente

No existe información suficiente para responder con fiabilidad.

El Copilot deberá indicarlo explícitamente.

##### Error

No ha sido posible completar la petición.

#### UX Behaviour

Arroba Copilot permanece disponible durante toda la navegación por la plataforma.

El contexto cambia automáticamente al cambiar de entidad.

El usuario nunca deberá reiniciar la conversación para seguir trabajando sobre la misma empresa.

Las respuestas deberán ser:

- breves;
- estructuradas;
- accionables.

Cuando una respuesta requiera mayor profundidad, el Copilot dirigirá al usuario al módulo correspondiente.

#### Business Rules

##### BR-2002-001

Toda respuesta utilizará el contexto activo.

##### BR-2002-002

Toda afirmación deberá estar soportada por información verificable.

##### BR-2002-003

Cuando no exista información suficiente, el Copilot deberá indicarlo expresamente.

Nunca completará información mediante inferencias no soportadas.

##### BR-2002-004

Las recomendaciones deberán indicar su nivel de confianza cuando proceda.

##### BR-2002-005

El Copilot nunca sustituye la navegación.

La acelera.

##### BR-2002-006

El Copilot nunca sustituye a los Intelligence Engines.

Los orquesta.

#### Integración Backend

El comportamiento funcional de Arroba Copilot depende de los motores de inteligencia definidos en la arquitectura de arroba.com.

El detalle de dichos motores se documenta en sus correspondientes especificaciones funcionales.

El presente componente actúa exclusivamente como interfaz de orquestación.

#### Dependencias

Arroba Copilot depende de:

- Context Engine.
- Intelligence Engines.
- User Permissions.
- Company Entity.

No depende de ningún módulo concreto de la Ficha de Empresa.

#### Casos especiales

##### Sin contexto activo

El Copilot funcionará en modo global.

Podrá responder consultas generales sobre la plataforma o realizar búsquedas.

##### Contexto Empresa

Todas las respuestas utilizarán automáticamente la empresa abierta.

##### Contexto Sector

Las respuestas utilizarán el sector activo.

##### Contexto Oportunidad

Las respuestas incorporarán el estado de la oportunidad correspondiente.

##### Contexto Operación

Las respuestas utilizarán el Transaction Workspace como contexto de trabajo.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- utilice automáticamente el contexto activo;
- permita analizar la empresa mediante lenguaje natural;
- pueda abrir módulos de la plataforma;
- pueda iniciar workflows autorizados;
- nunca invente información;
- nunca implemente lógica de negocio propia;
- actúe exclusivamente como interfaz de acceso a los motores de inteligencia.

#### Relación con otros componentes

Executive Snapshot

↓

Resume la empresa.

Executive Metrics

↓

Resume la situación económica.

Next Step Panel

↓

Prioriza la siguiente acción.

Arroba Copilot

↓

Permite comprender, explorar y ejecutar cualquier capacidad de la plataforma mediante lenguaje natural.

##### Referencias

La especificación de los siguientes elementos se documenta en sus respectivos capítulos y no forma parte de este componente:

- Memory & Context Architecture.
- Intelligence Engines.
- Transaction OS.
- Recommendation Engine.
- Permission Model.
- Narrative Engine.

Arroba Copilot consume dichos servicios, pero no define su comportamiento.

#### Decisiones arquitectónicas consolidadas

##### DA-2002-001

Arroba Copilot constituye la interfaz universal de interacción de arroba.com.

##### DA-2002-002

Toda interacción es contextual.

##### DA-2002-003

El Copilot orquesta capacidades.

Nunca implementa inteligencia propia.

##### DA-2002-004

La especificación funcional de los motores consumidos pertenece a sus respectivos documentos canónicos.

Fin de COMP-2002.

<a id="514-comp-2003-next-step-panel"></a>
### 5.14 COMP-2003 — Next Step Panel

---

id: COMP-2003

name: Next Step Panel

section: Executive Vista

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Next Step Panel constituye el principal componente de acción de toda la Ficha de Empresa.

Su misión consiste en indicar cuál es el siguiente paso de mayor valor que el usuario puede realizar sobre la empresa en el contexto actual.

Responde a una única pregunta.

> **¿Qué debería hacer ahora?**

No responde:

> ¿Qué puedo hacer?

Esa responsabilidad pertenece a Company Quick Actions.

No responde:

> ¿Cómo puedo hacerlo?

Esa responsabilidad pertenece a Arroba Copilot.

No responde:

> ¿Qué empresa estoy viendo?

Esa responsabilidad pertenece al Header.

El Next Step Panel constituye el puente entre la inteligencia y la ejecución.

#### Responsabilidad

Guiar al usuario durante todo el ciclo de vida de una oportunidad o de una operación.

Su misión consiste en reducir la incertidumbre sobre el siguiente paso.

Nunca sustituye al usuario.

Nunca ejecuta acciones automáticamente.

Prioriza.

Orienta.

Explica.

#### Principios

##### Workflow First

El panel siempre representa un workflow.

Nunca una colección de acciones inconexas.

##### One Next Step

Existe una única acción recomendada.

Nunca varias acciones principales simultáneamente.

##### Context Driven

La recomendación depende del contexto actual.

No depende únicamente de la empresa.

Tiene en cuenta:

- empresa;
- usuario;
- oportunidad;
- operación;
- organización (cuando aplique).

##### Explainability

Toda recomendación deberá responder:

¿Por qué esta acción?

¿Por qué ahora?

¿Qué ocurre si no la realizo?

##### Continuidad

El usuario nunca pierde el contexto.

Al volver a la empresa continuará exactamente donde lo dejó.

#### Arquitectura funcional

Next Step Panel se divide en cuatro bloques.

```text
Next Step Panel

──────────────────────────

Workflow Context

──────────────────────────

Next Best Action

──────────────────────────

Timeline

──────────────────────────

Activity Summary
```

Cada bloque responde una pregunta distinta.

##### NSP-001 Workflow Context

#### Objetivo

Responder.

> ¿En qué proceso estoy?

Ejemplos.

Sin oportunidad.

↓

"No existe ninguna oportunidad abierta."

Oportunidad abierta.

↓

"Buscando comprador"

Operación activa.

↓

"Due Diligence"

Financiación.

↓

"Preparando ronda"

El Workflow Context nunca representa tareas.

Representa únicamente el proceso activo.

##### NSP-002 Next Best Action

#### Objetivo

Responder.

> ¿Cuál es la siguiente acción de mayor valor?

Ejemplos.

Crear oportunidad.

↓

Solicitar NDA.

↓

Analizar valoración.

↓

Contactar comprador.

↓

Actualizar información financiera.

Solo existe una acción principal.

Podrán existir acciones secundarias.

Nunca competirán visualmente.

##### NSP-003 Timeline

#### Objetivo

Mostrar visualmente el estado del workflow.

No constituye un gestor de tareas.

Representa exclusivamente el progreso.

Ejemplo.

```text
Crear oportunidad

───────────────●

Contacto inicial

───────────────●

NDA

───────────────●

IOI

───────────────○

LOI

───────────────○

Due Diligence

───────────────○

SPA

───────────────○

Closing
```

Estados.

● completado

◉ activo

○ pendiente

Nunca se mostrarán estados inexistentes.

Nunca se mostrará progreso ficticio.

##### NSP-004 Activity Summary

#### Objetivo

Responder.

> ¿Qué ha ocurrido recientemente?

Ejemplos.

Hace dos días se creó una oportunidad.

↓

Se recibió documentación financiera.

↓

El comprador aceptó el NDA.

↓

Se actualizó la valoración.

No pretende sustituir el Transaction OS.

Únicamente resume actividad relevante.

#### Información deliberadamente excluida

Next Step Panel nunca mostrará:

- Cuenta de resultados.
- Ratios.
- Executive Snapshot.
- Información pública.
- Chat completo.
- Timeline completo de eventos.
- Documentación.

Todo ello pertenece a otros módulos.

#### Estados

##### Sin contexto

No existe oportunidad.

El panel propondrá iniciar una.

##### Oportunidad

Existe una oportunidad activa.

El panel muestra el workflow correspondiente.

##### Operación

Existe una operación activa.

El panel cambia automáticamente al workflow de operación.

##### Finalizado

La operación ha concluido.

El panel mostrará acciones posteriores.

Ejemplos.

Archivar.

↓

Reabrir.

↓

Crear nueva oportunidad.

#### UX Behaviour

El panel permanece visible durante toda la navegación por la empresa.

La recomendación principal aparece siempre en la parte superior.

El Timeline permanece inmediatamente debajo.

El resumen de actividad aparece al final.

Nunca cambia de posición.

#### Business Rules

##### BR-2003-001

Solo podrá existir una Next Best Action.

##### BR-2003-002

Toda recomendación deberá estar justificada.

##### BR-2003-003

El Timeline representa estados.

Nunca tareas.

##### BR-2003-004

El Activity Summary representa únicamente actividad reciente.

Nunca constituye un historial completo.

##### BR-2003-005

El panel nunca modifica automáticamente el workflow.

Toda transición requiere una acción del usuario o un evento del sistema.

##### BR-2003-006

La ausencia de una oportunidad no constituye un error.

Representa un estado válido del sistema.

#### Integración Backend

El comportamiento completo del workflow se define en:

- Transaction OS
- Opportunity Engine
- Recommendation Engine

El Next Step Panel consume dichos motores.

No implementa lógica de transición.

#### Dependencias

Depende de:

- User Context
- Opportunity Engine
- Transaction OS
- Recommendation Engine

No depende de:

- Executive Metrics
- Executive Snapshot
- Company Context

#### Casos especiales

##### Sin oportunidad

La recomendación principal será:

Crear oportunidad.

##### Varias oportunidades

Se mostrará exclusivamente la oportunidad activa.

El cambio de oportunidad se realizará desde el módulo Oportunidades.

Nunca desde el panel.

##### Operación pausada

El Timeline conservará el estado alcanzado.

El panel propondrá la acción necesaria para reanudar el proceso.

##### Operación finalizada

El workflow se cerrará visualmente.

No desaparecerá hasta que el usuario archive la operación.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- Muestre siempre una única Next Best Action.
- Represente correctamente el estado del workflow.
- Mantenga el Timeline sincronizado con Transaction OS.
- Funcione sin oportunidades activas.
- Nunca implemente lógica de negocio en el frontend.
- Consuma exclusivamente motores oficiales.

#### Relación con otros componentes

Company Quick Actions

↓

¿Qué puedo hacer?

Executive Snapshot

↓

¿Por qué debería analizar esta empresa?

Next Step Panel

↓

¿Qué debería hacer ahora?

Arroba Copilot

↓

¿Cómo puedo hacerlo?

Los cuatro componentes representan niveles distintos de la experiencia y nunca deberán intercambiar responsabilidades.

#### Decisiones arquitectónicas consolidadas

##### DA-2003-001

El Next Step Panel constituye el único componente autorizado para recomendar la siguiente acción del usuario.

##### DA-2003-002

El Timeline representa estados del workflow.

Nunca tareas.

##### DA-2003-003

Solo puede existir una Next Best Action activa.

##### DA-2003-004

El panel consume Transaction OS.

Nunca implementa la lógica del workflow.

Fin de COMP-2003.

<a id="estado-del-capitulo-5"></a>
### Estado del Capítulo 5

| Código | Componente | Estado |
|---------|------------|--------|
| COMP-2001 | Executive Metrics | ✅ |
| COMP-2002 | Arroba Copilot (Contextual) | ✅ |
| COMP-2003 | Next Step Panel | ✅ |
| COMP-2006 | Executive Overview | ❌ Eliminado |

El Capítulo 5 queda funcionalmente cerrado.

<a id="61-comp-3001-financial-workspace"></a>
### 6.1 COMP-3001 — Financial Workspace

---

id: COMP-3001

name: Financial Workspace

section: Finanzas

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Financial Workspace constituye el espacio de trabajo financiero de una empresa.

Su misión consiste en ofrecer una visión completa de la realidad económico-financiera de una compañía combinando información estructurada, inteligencia contextual y herramientas de análisis.

Responde a una única pregunta.

> **¿Cómo es la realidad financiera de esta empresa?**

No responde:

> ¿Cuánto vale?

Eso pertenece al módulo de Valoración.

No responde:

> ¿Cómo se compara con otras?

Eso pertenece a Comparativa.

No responde:

> ¿Qué debería hacer?

Eso pertenece al Next Step Panel.

#### Responsabilidad

Financial Workspace concentra toda la información económico-financiera de la empresa.

No calcula indicadores.

No interpreta directamente los datos.

No ejecuta valoraciones.

Su responsabilidad consiste en organizar la información financiera de forma progresiva para facilitar su comprensión.

#### Filosofía

Financial Workspace sigue el principio:

> **Primero comprender. Después analizar. Finalmente profundizar.**

La inteligencia siempre precede a los datos.

Los datos siempre preceden al detalle.

El detalle siempre precede al histórico.

#### Arquitectura funcional

Financial Workspace está compuesto por los siguientes componentes.

```text
Financial Workspace

──────────────────────────

Financial Intelligence

──────────────────────────

Financial Navigation

    • Cuenta de Resultados

    • Balance

    • Cash Flow

    • Ratios

──────────────────────────

Financial Viewer

──────────────────────────

Period Selector
```

Cada componente podrá evolucionar de forma independiente.

##### Navegación interna

El Workspace dispone de una navegación propia.

Esta navegación nunca modifica la navegación principal de la ficha.

Su única responsabilidad consiste en cambiar el bloque financiero visualizado.

Las pestañas oficiales son:

- Cuenta de Resultados
- Balance
- Cash Flow
- Ratios

No podrán añadirse nuevas pestañas sin modificar el ACC.

#### Principios

##### Intelligence First

Toda sección financiera comienza con una interpretación realizada por Arroba.

El usuario comprende antes de analizar.

##### Progressive Disclosure

Toda la información financiera se presenta en varios niveles de profundidad.

Nunca se muestra todo simultáneamente.

##### Consistencia

Las cuatro áreas financieras siguen exactamente el mismo comportamiento.

Nunca cambian de interacción.

##### Comparabilidad

Toda información financiera podrá compararse con:

- ejercicios anteriores;
- sector;
- percentiles;
- comparables (cuando proceda).

Las reglas de comparación pertenecen a los motores de inteligencia y no al Workspace.

##### Explicabilidad

Toda interpretación financiera deberá poder justificarse mediante datos verificables.

##### Multi-Level Insight Pattern

Financial Workspace constituye la implementación de referencia del patrón multinivel de arroba.com.

Cada bloque financiero seguirá siempre cuatro niveles de lectura.

##### Nivel 1

Financial Intelligence

La IA explica qué está ocurriendo.

##### Nivel 2

Vista Ejecutiva

Resumen gráfico.

Principales indicadores.

Conclusiones rápidas.

##### Nivel 3

Vista Analítica

Partidas agregadas.

Categorías financieras.

Indicadores principales.

##### Nivel 4

Vista Detallada

Todas las cuentas disponibles.

Sin agregaciones.

Con posibilidad de analizar la evolución temporal.

Este patrón deberá reutilizarse en los futuros Workspaces cuando resulte aplicable.

#### Componentes

- **COMP-3002** — Financial Intelligence

- **COMP-3003** — Income Statement

- **COMP-3004** — Balance Sheet

- **COMP-3005** — Cash Flow

- **COMP-3006** — Financial Ratios

- **COMP-3007** — Period Selector

#### Estados

###### Loading

El Workspace carga de forma independiente cada bloque.

La ausencia de un bloque no impide visualizar el resto.

###### Ready

Información disponible.

###### Partial

Existe información parcial.

Las secciones afectadas mostrarán su estado correspondiente.

###### Empty

No existe información financiera suficiente.

El Workspace permanecerá operativo.

###### Error

Error de recuperación de información.

No afecta al resto de la ficha.

#### UX Behaviour

El usuario podrá cambiar entre:

- Cuenta de Resultados;
- Balance;
- Cash Flow;
- Ratios;

sin abandonar el Workspace.

El cambio entre pestañas nunca reiniciará:

- el ejercicio seleccionado;
- el nivel de visualización;
- el contexto activo.

#### Business Rules

##### BR-3001-001

Toda la información financiera procede exclusivamente de Agency Tool.

##### BR-3001-002

Financial Workspace nunca implementa lógica financiera.

##### BR-3001-003

La inteligencia financiera constituye un componente independiente.

Nunca forma parte de las tablas financieras.

##### BR-3001-004

Todas las áreas financieras comparten el mismo patrón de navegación.

##### BR-3001-005

Todas las áreas reutilizan el mismo selector temporal.

##### BR-3001-006

El Workspace nunca modifica información financiera.

Representa exclusivamente información disponible.

#### Integración Backend

Financial Workspace consume información procedente de:

- Financial Intelligence Engine
- Financial Statements Engine
- Ratio Engine

La definición funcional de dichos motores pertenece a sus respectivos documentos canónicos.

#### Dependencias

Depende de:

- Company Entity
- Financial Intelligence
- Financial Statements
- User Permissions

No depende de:

- Valoración
- Comparativa
- Transaction OS

#### Casos especiales

##### Empresa sin cuentas disponibles

El Workspace permanece accesible.

Cada bloque mostrará el estado correspondiente.

#### Información parcial

Las secciones disponibles continuarán funcionando.

Nunca se ocultará una pestaña por falta de datos.

##### Ejercicios incompletos

Los periodos no disponibles aparecerán deshabilitados.

Nunca desaparecerán.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- estructure correctamente las cuatro áreas financieras;
- mantenga la navegación interna independiente;
- conserve el contexto entre pestañas;
- implemente el patrón multinivel;
- no implemente lógica financiera;
- consuma exclusivamente información procedente de Agency Tool.

#### Relación con otros componentes

Executive Vista

↓

Introduce la situación económica.

Financial Workspace

↓

Permite comprender la realidad financiera.

Valoración

↓

Transforma la información financiera en valor empresarial.

Comparativa

↓

Sitúa esa realidad frente al mercado.

##### Blueprint Candidates

##### BC-3001-001 — Multi-Level Insight Pattern

Todo Workspace podrá organizar su información en cuatro niveles de profundidad:

1. Inteligencia.
2. Vista ejecutiva.
3. Vista analítica.
4. Vista detallada.

Este patrón nace en Financial Workspace y podrá reutilizarse en otros módulos de la plataforma.

#### Decisiones arquitectónicas consolidadas

##### DA-3001-001

Financial Workspace constituye un Workspace completo y no un único componente.

##### DA-3001-002

La inteligencia financiera siempre precede a la información financiera.

##### DA-3001-003

Las cuatro áreas financieras comparten una arquitectura común.

##### DA-3001-004

El patrón Multi-Level Insight pasa a formar parte de la arquitectura funcional de arroba.com.

Fin de COMP-3001.

<a id="62-comp-3002-financial-intelligence"></a>
### 6.2 COMP-3002 — Financial Intelligence

---

id: COMP-3002

name: Financial Intelligence

section: Financial Workspace

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Financial Intelligence constituye la capa de interpretación financiera de arroba.com.

Su misión consiste en transformar estados financieros complejos en una explicación ejecutiva comprensible antes de que el usuario analice las cifras.

Responde a una única pregunta.

> **¿Qué está ocurriendo financieramente en esta empresa?**

No responde:

> ¿Cuáles son las cifras?

Eso pertenece a:

- Cuenta de Resultados.
- Balance.
- Cash Flow.
- Ratios.

No responde:

> ¿Cuánto vale?

Eso pertenece a Valoración.

#### Responsabilidad

Financial Intelligence interpreta.

Nunca calcula.

Nunca modifica datos.

Nunca sustituye las cuentas anuales.

Su responsabilidad consiste en identificar los mensajes financieros más relevantes para el usuario.

#### Filosofía

Financial Intelligence sigue un principio fundamental.

> **Las cifras explican qué ocurrió. La inteligencia explica por qué importa.**

El objetivo no consiste en producir más texto.

Consiste en reducir el tiempo necesario para comprender una empresa.

#### Principios

##### Executive First

La explicación debe poder leerse en menos de un minuto.

##### Explainability

Toda afirmación deberá estar respaldada por información verificable.

##### No Hallucinations

Nunca se realizarán afirmaciones que no puedan justificarse mediante datos.

##### Neutralidad

Financial Intelligence interpreta.

Nunca recomienda comprar o vender.

Nunca emite opiniones.

##### Contexto

La interpretación siempre tendrá en cuenta:

- tamaño;
- sector;
- evolución histórica;
- consistencia financiera.

Nunca analizará un dato de forma aislada.

#### Arquitectura funcional

Financial Intelligence se estructura en cinco bloques.

```text
Financial Intelligence

──────────────────────────

Executive Summary

──────────────────────────

Strengths

──────────────────────────

Weaknesses

──────────────────────────

Key Findings

──────────────────────────

Financial Outlook
```

Cada bloque responde a una pregunta distinta.

##### FI-001 Executive Summary

#### Objetivo

Responder.

> ¿Cuál es la situación financiera general?

Debe proporcionar una visión ejecutiva de la empresa utilizando un lenguaje claro y orientado al negocio.

##### FI-002 Strengths

#### Objetivo

Identificar los principales puntos fuertes.

Ejemplos.

- elevada rentabilidad;
- crecimiento sostenido;
- bajo endeudamiento;
- generación positiva de caja;
- estabilidad de márgenes.

Nunca se mostrarán fortalezas no soportadas por datos.

##### FI-003 Weaknesses

#### Objetivo

Identificar los principales aspectos que requieren atención.

Ejemplos.

- deterioro de márgenes;
- caída del beneficio;
- tensión financiera;
- incremento del endeudamiento;
- pérdida de eficiencia.

No representan conclusiones definitivas.

Representan hechos observables.

##### FI-004 Key Findings

#### Objetivo

Destacar los hallazgos financieros más relevantes.

Ejemplos.

- cambio significativo respecto al ejercicio anterior;
- anomalías detectadas;
- tendencias consistentes;
- evolución destacable.

Este bloque resume únicamente los aspectos de mayor impacto.

##### FI-005 Financial Outlook

#### Objetivo

Explicar cuál parece ser la dirección financiera de la compañía según la información disponible.

No realiza predicciones.

No estima resultados futuros.

Describe tendencias observadas.

Ejemplos.

- mejora progresiva;
- estabilidad;
- deterioro;
- elevada volatilidad.

#### Estados

##### Loading

Generando interpretación.

##### Ready

Interpretación disponible.

##### Partial

Información suficiente para generar parte del análisis.

##### Empty

Información insuficiente.

##### Error

No ha sido posible generar la interpretación.

El resto del Workspace continuará funcionando.

#### UX Behaviour

Financial Intelligence siempre aparece al comienzo del Financial Workspace.

El usuario lee primero la interpretación.

Posteriormente accede a:

- Cuenta de Resultados.
- Balance.
- Cash Flow.
- Ratios.

Nunca al contrario.

#### Business Rules

##### BR-3002-001

Toda afirmación deberá derivarse de información verificable.

##### BR-3002-002

La inteligencia nunca sustituirá los estados financieros.

##### BR-3002-003

Las fortalezas y debilidades deberán actualizarse automáticamente cuando cambien los datos financieros.

##### BR-3002-004

Financial Outlook describirá tendencias observadas.

Nunca realizará predicciones.

##### BR-3002-005

El componente nunca contendrá recomendaciones de inversión.

##### BR-3002-006

Toda la interpretación financiera deberá generarse utilizando exclusivamente los motores oficiales de inteligencia.

#### Integración Backend

Financial Intelligence consume:

- Financial Intelligence Engine.
- Financial Statements Engine.
- Ratio Engine.

La lógica de interpretación pertenece íntegramente a dichos motores.

El componente representa exclusivamente el resultado.

#### Dependencias

Depende de:

- Financial Statements.
- Financial Intelligence Engine.
- Company Entity.

No depende de:

- Usuario.
- Oportunidades.
- Transaction OS.

#### Casos especiales

##### Empresa sin histórico suficiente

La interpretación se limitará al ejercicio disponible.

#### Información parcial

Solo se analizarán los bloques con soporte suficiente.

##### Empresa de reciente creación

No se generarán comparaciones históricas inexistentes.

##### Empresa inactiva

La interpretación reflejará dicha situación.

Nunca intentará completar información ausente.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- proporcione una interpretación ejecutiva clara;
- identifique fortalezas y debilidades relevantes;
- destaque los principales hallazgos financieros;
- describa tendencias observadas sin realizar predicciones;
- nunca invente información;
- no implemente lógica de negocio;
- consuma exclusivamente los motores oficiales de Financial Intelligence.

#### Relación con otros componentes

Executive Snapshot

↓

Resume la empresa.

Financial Intelligence

↓

Interpreta la situación financiera.

Income Statement

↓

Presenta la cuenta de resultados.

Balance Sheet

↓

Presenta la situación patrimonial.

Cash Flow

↓

Presenta los flujos de caja.

Financial Ratios

↓

Presenta los principales indicadores financieros.

#### Decisiones arquitectónicas consolidadas

##### DA-3002-001

Toda sección financiera comienza por la interpretación y continúa con los datos.

##### DA-3002-002

Financial Intelligence explica.

Nunca recomienda.

##### DA-3002-003

Las tendencias descritas siempre proceden de información histórica disponible.

Nunca de predicciones.

##### DA-3002-004

La inteligencia financiera constituye una capa independiente y reutilizable dentro de la arquitectura de arroba.com.

Fin de COMP-3002.

<a id="63-comp-3003-income-statement"></a>
### 6.3 COMP-3003 — Income Statement

---

id: COMP-3003

name: Income Statement

section: Financial Workspace

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Income Statement representa la Cuenta de Resultados de la empresa.

Su misión consiste en permitir al usuario comprender cómo genera ingresos, cómo incurre en costes y cómo transforma esa actividad en beneficio.

Responde a una única pregunta.

> **¿Cómo gana dinero esta empresa?**

No interpreta.

No valora.

No compara.

Representa la realidad económica.

La interpretación pertenece a Financial Intelligence.

#### Responsabilidad

Mostrar la evolución de la Cuenta de Resultados utilizando distintos niveles de profundidad sin perder consistencia.

Debe permitir que un CEO obtenga una visión en segundos y que un analista pueda llegar al máximo nivel de detalle sin abandonar el Workspace.

#### Filosofía

La misma información debe poder leerse con distintos niveles de profundidad.

Nunca existen varias cuentas de resultados.

Existe una única Cuenta de Resultados presentada con distintos niveles de lectura.

#### Arquitectura funcional

```text
Income Statement

────────────────────────

Ejecutiva

────────────────────────

Negocio

────────────────────────

Detalle

────────────────────────

Evolución
```

Cada nivel representa exactamente la misma información con diferente profundidad.

##### Nivel 1 — Executive View

#### Objetivo

Permitir comprender la evolución económica en menos de un minuto.

Incluye exclusivamente los grandes indicadores.

Ejemplo.

- Revenue
- Gross Margin
- EBITDA
- EBIT
- Net Income

Cada indicador incorpora una representación gráfica simplificada.

No muestra partidas contables.

##### Nivel 2 — Analytical View

#### Objetivo

Agrupar la Cuenta de Resultados en grandes categorías.

Ejemplos.

- Ingresos
- Aprovisionamientos
- Gastos de Personal
- Otros Gastos de Explotación
- Amortizaciones
- Resultado Financiero
- Impuestos
- Beneficio Neto

El usuario comienza a comprender la composición del resultado.

##### Nivel 3 — Detailed View

#### Objetivo

Mostrar todas las cuentas disponibles.

No existen agregaciones adicionales.

Se respetará la estructura oficial del modelo financiero utilizado por Agency Tool.

##### Nivel 4 — Historical View

#### Objetivo

Analizar la evolución temporal.

Permite comparar ejercicios.

No constituye una comparativa sectorial.

La comparación sectorial pertenece al Workspace Comparativa.

#### Navegación

El cambio entre niveles nunca modifica:

- el ejercicio;
- el contexto;
- el resto del Workspace.

El usuario podrá cambiar libremente entre niveles.

#### Visualizaciones

Income Statement podrá utilizar:

- tablas;
- gráficos;
- waterfall charts;
- sparklines;
- indicadores de tendencia.

La selección de visualización pertenece al Design System.

No al ACC.

#### Estados

##### Loading

Skeleton completo.

##### Ready

Información disponible.

##### Partial

Información parcial.

Las partidas ausentes aparecerán como "No disponible".

##### Empty

No existe Cuenta de Resultados.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

El nivel de visualización elegido permanecerá activo mientras el usuario permanezca en el Financial Workspace.

El cambio entre pestañas no reiniciará el nivel seleccionado.

#### Business Rules

##### BR-3003-001

Toda la información procede exclusivamente de Agency Tool.

##### BR-3003-002

El frontend nunca recalculará partidas.

##### BR-3003-003

Todos los niveles representan exactamente la misma Cuenta de Resultados.

Nunca existen diferencias entre ellos.

##### BR-3003-004

Las agregaciones pertenecen al modelo financiero oficial.

Nunca al frontend.

##### BR-3003-005

Las partidas mantendrán siempre el mismo orden entre ejercicios.

##### BR-3003-006

Las cifras podrán visualizarse en valor absoluto o porcentaje cuando proceda.

Las reglas de cálculo pertenecen a Agency Tool.

#### Integración Backend

Income Statement consume exclusivamente el modelo financiero oficial definido por Agency Tool (`arroba.v1`).

No implementa cálculos propios.

#### Dependencias

Depende de:

- Financial Statements Engine
- Company Entity
- Period Selector

No depende de:

- Valoración
- Comparativa
- Transaction OS

#### Casos especiales

##### Empresa sin Cuenta de Resultados

El componente mostrará el estado Empty.

#### Información parcial

Las partidas no disponibles permanecerán visibles indicando su ausencia.

##### Cambio de ejercicio

Toda la Cuenta de Resultados se actualizará automáticamente.

El nivel de visualización permanecerá inalterado.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente una única Cuenta de Resultados;
- permita navegar entre los cuatro niveles de lectura;
- mantenga el contexto del usuario;
- funcione correctamente con información parcial;
- no implemente lógica financiera;
- consuma exclusivamente Agency Tool (`arroba.v1`).

#### Relación con otros componentes

Financial Intelligence

↓

Interpreta.

Income Statement

↓

Explica cómo genera beneficio la empresa.

Balance Sheet

↓

Explica qué posee y cómo se financia.

Cash Flow

↓

Explica cómo genera y utiliza caja.

Financial Ratios

↓

Resume el rendimiento mediante indicadores.

##### Blueprint Candidates

##### BC-3003-001 — Progressive Financial Reading

Toda información financiera deberá poder visualizarse con distintos niveles de profundidad sin modificar su significado.

#### Decisiones arquitectónicas consolidadas

##### DA-3003-001

Existe una única Cuenta de Resultados.

Los distintos niveles representan únicamente diferentes profundidades de lectura.

##### DA-3003-002

La interpretación financiera pertenece a Financial Intelligence.

La Cuenta de Resultados representa exclusivamente información estructurada.

##### DA-3003-003

El nivel de visualización constituye una preferencia de navegación y nunca modifica los datos.

Fin de COMP-3003.

<a id="64-comp-3004-balance-sheet"></a>
### 6.4 COMP-3004 — Balance Sheet

---

id: COMP-3004

name: Balance Sheet

section: Financial Workspace

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Balance Sheet representa la situación patrimonial y financiera de la empresa en una fecha determinada.

Su misión consiste en permitir al usuario comprender qué posee la empresa, cómo está financiada y cuál es la solidez de su estructura financiera.

Responde a una única pregunta.

> **¿Cómo está estructurado el patrimonio de esta empresa?**

No interpreta.

No recomienda.

No valora.

Representa la fotografía patrimonial de la compañía.

La interpretación pertenece a Financial Intelligence.

#### Responsabilidad

Mostrar el Balance de Situación utilizando el patrón de lectura multinivel definido por arroba.com.

El usuario debe poder obtener una visión ejecutiva en segundos y profundizar hasta el máximo nivel de detalle sin abandonar el Workspace.

#### Filosofía

El Balance no debe entenderse como una lista de cuentas.

Debe entenderse como la representación de la estructura económica y financiera del negocio.

Su objetivo es responder:

- ¿Qué tiene la empresa?
- ¿Cómo está financiado?
- ¿Cómo ha evolucionado?

#### Arquitectura funcional

```text
Balance Sheet

────────────────────────

Ejecutiva

────────────────────────

Negocio

────────────────────────

Detalle

────────────────────────

Evolución
```

Los cuatro niveles representan exactamente el mismo Balance.

Únicamente cambia la profundidad de lectura.

##### Nivel 1 — Ejecutiva

#### Objetivo

Permitir comprender la situación patrimonial en menos de un minuto.

Incluye únicamente los grandes indicadores.

Ejemplo.

- Activo Total
- Patrimonio Neto
- Pasivo Total
- Deuda Financiera
- Fondo de Maniobra

Los indicadores se acompañan de representaciones gráficas simplificadas.

No se muestran partidas contables.

##### Nivel 2 — Negocio

#### Objetivo

Explicar cómo está estructurado el patrimonio de la empresa mediante grandes categorías.

Ejemplo.

###### Activo

- Activo No Corriente
- Activo Corriente

###### Patrimonio Neto

- Capital
- Reservas
- Resultado

###### Pasivo

- Pasivo No Corriente
- Pasivo Corriente

El usuario comprende la estructura financiera sin necesidad de analizar todas las cuentas.

##### Nivel 3 — Detalle

#### Objetivo

Mostrar todas las partidas disponibles del Balance.

No existen agregaciones adicionales.

La estructura seguirá el modelo financiero oficial definido por Agency Tool.

##### Nivel 4 — Evolución

#### Objetivo

Analizar la evolución temporal del Balance.

Permite observar cambios en:

- activos;
- patrimonio;
- pasivos;
- endeudamiento;
- liquidez.

No constituye una comparativa sectorial.

#### Navegación

El cambio entre niveles nunca modifica:

- ejercicio seleccionado;
- contexto;
- pestaña activa.

El usuario podrá alternar libremente entre los cuatro niveles.

#### Visualizaciones

El Balance podrá representarse mediante:

- tablas;
- gráficos de composición;
- gráficos de evolución;
- waterfall charts;
- indicadores de tendencia.

La representación visual pertenece al Design System.

#### Estados

##### Loading

Skeleton completo.

##### Ready

Información disponible.

##### Partial

Información parcial.

Las partidas no disponibles permanecerán visibles indicando su ausencia.

##### Empty

No existe Balance disponible.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

El nivel de lectura seleccionado permanecerá activo durante toda la navegación del Financial Workspace.

El cambio de ejercicio actualizará automáticamente toda la información.

Nunca modificará el nivel de visualización elegido.

#### Business Rules

##### BR-3004-001

Toda la información procede exclusivamente de Agency Tool.

##### BR-3004-002

El frontend nunca recalculará partidas patrimoniales.

##### BR-3004-003

Los cuatro niveles representan exactamente el mismo Balance.

Nunca existen diferencias de información.

##### BR-3004-004

Las agregaciones pertenecen al modelo financiero oficial.

Nunca al frontend.

##### BR-3004-005

Las partidas mantendrán siempre el mismo orden entre ejercicios.

##### BR-3004-006

El Balance representa una fotografía patrimonial correspondiente al ejercicio seleccionado.

Nunca mezcla información de distintos ejercicios.

#### Integración Backend

Balance Sheet consume exclusivamente el modelo financiero oficial definido por Agency Tool (`arroba.v1`).

Toda transformación pertenece al backend.

#### Dependencias

Depende de:

- Financial Statements Engine
- Company Entity
- Period Selector

No depende de:

- Valoración
- Comparativa
- Transaction OS

#### Casos especiales

##### Empresa sin Balance disponible

El componente mostrará el estado Empty.

#### Información parcial

Las partidas ausentes permanecerán visibles indicando "No disponible".

##### Cambio de ejercicio

Todo el Balance se actualizará automáticamente manteniendo el mismo nivel de lectura.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente el Balance de Situación;
- implemente los cuatro niveles de lectura;
- mantenga el contexto del usuario;
- funcione con información parcial;
- no implemente lógica financiera;
- consuma exclusivamente Agency Tool (`arroba.v1`).

#### Relación con otros componentes

Financial Intelligence

↓

Interpreta la situación financiera.

Income Statement

↓

Explica cómo genera beneficio la empresa.

Balance Sheet

↓

Explica qué posee la empresa y cómo está financiada.

Cash Flow

↓

Explica cómo genera y utiliza caja.

Financial Ratios

↓

Resume el comportamiento financiero mediante indicadores.

#### Decisiones arquitectónicas consolidadas

##### DA-3004-001

Existe un único Balance.

Los distintos niveles representan únicamente diferentes profundidades de lectura.

##### DA-3004-002

La interpretación patrimonial pertenece exclusivamente a Financial Intelligence.

##### DA-3004-003

El patrón de lectura "Ejecutiva → Negocio → Detalle → Evolución" es obligatorio para el Balance.

##### DA-3004-004

El Balance constituye la representación oficial de la estructura patrimonial de la empresa dentro del Financial Workspace.

Fin de COMP-3004.

<a id="65-comp-3005-cash-flow"></a>
### 6.5 COMP-3005 — Cash Flow

---

id: COMP-3005

name: Cash Flow

section: Financial Workspace

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Cash Flow representa la capacidad real de la empresa para generar y utilizar efectivo.

Su misión consiste en permitir al usuario comprender cómo entra y sale el dinero de la compañía y evaluar la sostenibilidad financiera del negocio.

Responde a una única pregunta.

> **¿Cómo genera y consume caja esta empresa?**

No interpreta.

No recomienda.

No valora.

Representa los flujos de efectivo.

La interpretación pertenece a Financial Intelligence.

#### Responsabilidad

Mostrar el Estado de Flujos de Efectivo utilizando el patrón de lectura multinivel definido por arroba.com.

El componente debe permitir comprender rápidamente la capacidad de generación de caja y profundizar posteriormente en el detalle de cada flujo.

#### Filosofía

El beneficio no siempre implica generación de caja.

Cash Flow permite comprender la liquidez real del negocio.

Su objetivo es responder:

- ¿Genera caja?
- ¿En qué utiliza esa caja?
- ¿Cómo financia su crecimiento?

#### Arquitectura funcional

```text
Cash Flow

────────────────────────

Ejecutiva

────────────────────────

Negocio

────────────────────────

Detalle

────────────────────────

Evolución
```

Los cuatro niveles representan exactamente el mismo Estado de Flujos de Efectivo.

Solo cambia la profundidad de lectura.

##### Nivel 1 — Ejecutiva

#### Objetivo

Comprender la generación de caja en menos de un minuto.

Incluye únicamente los principales indicadores.

Ejemplos.

- Flujo Operativo
- Flujo de Inversión
- Flujo de Financiación
- Variación Neta de Caja
- Caja Final

Los indicadores se presentan mediante gráficos ejecutivos y visualizaciones simplificadas.

##### Nivel 2 — Negocio

#### Objetivo

Explicar cómo se genera y utiliza el efectivo.

Agrupa la información en tres grandes bloques.

###### Actividad Operativa

Caja generada por el negocio.

###### Actividad de Inversión

Uso de caja para crecimiento e inversiones.

###### Actividad de Financiación

Movimientos relacionados con deuda, dividendos y capital.

El usuario comprende el comportamiento financiero sin necesidad de revisar todas las partidas.

##### Nivel 3 — Detalle

#### Objetivo

Mostrar todas las partidas del Estado de Flujos de Efectivo.

La estructura seguirá el modelo financiero oficial definido por Agency Tool.

No existirán agregaciones adicionales.

##### Nivel 4 — Evolución

#### Objetivo

Analizar la evolución temporal de los flujos de caja.

Permite detectar:

- estabilidad;
- crecimiento;
- deterioro;
- cambios de comportamiento.

No constituye una comparativa sectorial.

#### Navegación

El usuario podrá cambiar libremente entre los cuatro niveles.

El cambio de nivel nunca modificará:

- el ejercicio seleccionado;
- la pestaña activa;
- el contexto del Workspace.

#### Visualizaciones

Cash Flow podrá representarse mediante:

- tablas;
- gráficos de barras;
- gráficos de cascada;
- gráficos temporales;
- indicadores de tendencia.

La selección de visualizaciones pertenece al Design System.

#### Estados

##### Loading

Skeleton completo.

##### Ready

Información disponible.

##### Partial

Información parcial.

Las partidas no disponibles permanecerán visibles indicando su ausencia.

##### Empty

No existe Estado de Flujos de Efectivo disponible.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

El nivel de lectura permanecerá activo durante toda la navegación del Financial Workspace.

El cambio de ejercicio actualizará automáticamente toda la información sin modificar el nivel seleccionado.

#### Business Rules

##### BR-3005-001

Toda la información procede exclusivamente de Agency Tool.

##### BR-3005-002

El frontend nunca recalculará flujos de caja.

##### BR-3005-003

Los cuatro niveles representan exactamente el mismo Estado de Flujos de Efectivo.

##### BR-3005-004

Las agregaciones pertenecen exclusivamente al modelo financiero oficial.

##### BR-3005-005

Las partidas mantendrán siempre el mismo orden entre ejercicios.

##### BR-3005-006

El Cash Flow representa exclusivamente el ejercicio seleccionado.

#### Integración Backend

Cash Flow consume exclusivamente el modelo financiero oficial definido por Agency Tool (`arroba.v1`).

Toda transformación pertenece al backend.

#### Dependencias

Depende de:

- Financial Statements Engine
- Company Entity
- Period Selector

No depende de:

- Valoración
- Comparativa
- Transaction OS

#### Casos especiales

##### Empresa sin Estado de Flujos de Efectivo

El componente mostrará el estado Empty.

#### Información parcial

Las partidas ausentes permanecerán visibles indicando "No disponible".

##### Cambio de ejercicio

Todo el Estado de Flujos de Efectivo se actualizará automáticamente manteniendo el nivel de lectura.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente el Estado de Flujos de Efectivo;
- implemente el patrón "Ejecutiva → Negocio → Detalle → Evolución";
- mantenga el contexto del usuario;
- funcione correctamente con información parcial;
- no implemente lógica financiera;
- consuma exclusivamente Agency Tool (`arroba.v1`).

#### Relación con otros componentes

Financial Intelligence

↓

Interpreta la situación financiera.

Income Statement

↓

Explica la rentabilidad.

Balance Sheet

↓

Explica la estructura patrimonial.

Cash Flow

↓

Explica la generación y utilización del efectivo.

Financial Ratios

↓

Resume el comportamiento financiero mediante indicadores.

#### Decisiones arquitectónicas consolidadas

##### DA-3005-001

Existe un único Estado de Flujos de Efectivo.

Los cuatro niveles representan únicamente distintas profundidades de lectura.

##### DA-3005-002

La interpretación de los flujos pertenece exclusivamente a Financial Intelligence.

##### DA-3005-003

El patrón "Ejecutiva → Negocio → Detalle → Evolución" es obligatorio para Cash Flow.

##### DA-3005-004

Cash Flow constituye la representación oficial de la liquidez y la generación de caja dentro del Financial Workspace.

Fin de COMP-3005.

<a id="66-comp-3006-financial-ratios"></a>
### 6.6 COMP-3006 — Financial Ratios

---

id: COMP-3006

name: Financial Ratios

section: Financial Workspace

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Financial Ratios constituye el componente encargado de sintetizar el comportamiento financiero de una empresa mediante indicadores comparables.

Su misión consiste en transformar decenas de métricas financieras en una lectura rápida de la calidad económica del negocio.

Responde a una única pregunta.

> **¿Qué dicen los principales indicadores sobre la salud financiera de esta empresa?**

No interpreta.

No recomienda.

No sustituye a Financial Intelligence.

Representa indicadores financieros estructurados.

#### Responsabilidad

Presentar los principales ratios financieros organizados según preguntas de negocio y no según clasificación contable.

El objetivo es facilitar una comprensión rápida tanto a empresarios como a inversores y asesores.

#### Filosofía

Los ratios no existen para ser leídos.

Existen para responder preguntas.

Por ello, arroba.com organiza los indicadores según la decisión que ayudan a tomar.

#### Arquitectura funcional

```text
Financial Ratios

────────────────────────

Ejecutiva

────────────────────────

Negocio

────────────────────────

Detalle

────────────────────────

Evolución
```

Los cuatro niveles representan exactamente los mismos indicadores.

Únicamente cambia la profundidad del análisis.

##### Nivel 1 — Ejecutiva

#### Objetivo

Ofrecer una visión inmediata del estado financiero de la empresa.

Incluye exclusivamente los indicadores considerados críticos.

Ejemplos.

- Rentabilidad
- Solvencia
- Liquidez
- Endeudamiento
- Eficiencia
- Crecimiento

Cada indicador incorpora un estado visual.

- Excelente
- Bueno
- Correcto
- Atención
- Crítico

La definición de dichos estados pertenece a Agency Tool.

##### Nivel 2 — Negocio

#### Objetivo

Agrupar los ratios según las preguntas que ayudan a responder.

##### ¿Es rentable?

Ejemplos.

- Margen EBITDA
- Margen Neto
- ROE
- ROA

##### ¿Es solvente?

Ejemplos.

- Ratio de Solvencia
- Endeudamiento
- Cobertura de intereses

##### ¿Tiene liquidez?

Ejemplos.

- Current Ratio
- Quick Ratio

##### ¿Es eficiente?

Ejemplos.

- Rotación de activos
- Productividad
- Conversión de beneficios

##### ¿Crece?

Ejemplos.

- CAGR ingresos
- CAGR EBITDA
- Evolución beneficio

La lista definitiva de ratios dependerá del modelo financiero oficial.

##### Nivel 3 — Detalle

#### Objetivo

Mostrar todos los ratios disponibles.

Cada indicador incluirá:

- valor;
- definición;
- fórmula (cuando proceda);
- explicación;
- fecha de actualización.

##### Nivel 4 — Evolución

#### Objetivo

Analizar la evolución histórica de todos los indicadores.

Permite detectar:

- mejora;
- deterioro;
- estabilidad;
- volatilidad.

No realiza comparaciones sectoriales.

#### Navegación

El usuario podrá cambiar libremente entre los cuatro niveles.

El cambio de nivel nunca modificará:

- el ejercicio;
- el contexto;
- el resto del Workspace.

#### Visualizaciones

Financial Ratios podrá representarse mediante:

- tablas;
- tarjetas;
- gauges;
- gráficos temporales;
- indicadores de tendencia.

La representación visual pertenece al Design System.

#### Estados

##### Loading

Skeleton completo.

##### Ready

Información disponible.

##### Partial

Algunos ratios no disponibles.

Permanecerán visibles indicando su ausencia.

##### Empty

No existe información suficiente para calcular indicadores.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

El nivel seleccionado permanecerá activo durante toda la navegación del Financial Workspace.

El cambio de ejercicio actualizará automáticamente todos los indicadores.

#### Business Rules

##### BR-3006-001

Todos los ratios proceden exclusivamente de Agency Tool.

##### BR-3006-002

El frontend nunca recalculará indicadores.

##### BR-3006-003

Todos los niveles representan exactamente los mismos ratios.

##### BR-3006-004

Las agrupaciones pertenecen al ACC.

Los cálculos pertenecen a Agency Tool.

##### BR-3006-005

Las definiciones de cada ratio deberán estar disponibles mediante Tooltip.

##### BR-3006-006

Cuando un ratio no pueda calcularse se indicará explícitamente.

Nunca se estimará.

#### Integración Backend

Financial Ratios consume exclusivamente el modelo oficial de ratios definido por Agency Tool (`arroba.v1`).

Toda la lógica de cálculo pertenece al backend.

#### Dependencias

Depende de:

- Ratio Engine
- Financial Statements Engine
- Company Entity
- Period Selector

No depende de:

- Valoración
- Comparativa
- Transaction OS

#### Casos especiales

##### Empresa sin información suficiente

El componente permanecerá operativo mostrando los ratios disponibles.

##### Cambio de ejercicio

Todos los indicadores se actualizarán automáticamente.

El nivel de lectura permanecerá inalterado.

##### Ratios no aplicables

Los indicadores no calculables aparecerán como:

"No disponible"

Nunca desaparecerán.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- organice los ratios por preguntas de negocio;
- implemente el patrón "Ejecutiva → Negocio → Detalle → Evolución";
- funcione correctamente con información parcial;
- no implemente lógica financiera;
- consuma exclusivamente Agency Tool (`arroba.v1`).

#### Relación con otros componentes

Financial Intelligence

↓

Interpreta.

Income Statement

↓

Presenta la rentabilidad.

Balance Sheet

↓

Presenta la estructura financiera.

Cash Flow

↓

Presenta la generación de caja.

Financial Ratios

↓

Sintetiza el comportamiento financiero mediante indicadores.

##### Blueprint Candidates

##### BC-3006-001 — Business Question Pattern

Siempre que sea posible, los indicadores deberán organizarse según las preguntas que ayudan a responder y no según su clasificación técnica.

Este principio podrá reutilizarse en otros Workspaces analíticos.

#### Decisiones arquitectónicas consolidadas

##### DA-3006-001

Los ratios se organizan por preguntas de negocio.

No por familias contables.

##### DA-3006-002

Existe un único conjunto de ratios.

Los cuatro niveles representan distintas profundidades de lectura.

##### DA-3006-003

La interpretación pertenece exclusivamente a Financial Intelligence.

Financial Ratios representa indicadores estructurados.

Fin de COMP-3006.

<a id="67-comp-3007-period-selector"></a>
### 6.7 COMP-3007 — Period Selector

---

id: COMP-3007

name: Period Selector

section: Financial Workspace

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Period Selector constituye el componente responsable de controlar el contexto temporal de todo el Financial Workspace.

Su misión consiste en garantizar que todos los componentes financieros trabajen siempre sobre el mismo ejercicio o período de análisis.

Responde a una única pregunta.

> **¿Qué período financiero estoy analizando?**

No modifica los datos.

No recalcula información.

Únicamente modifica el contexto temporal.

#### Responsabilidad

Mantener sincronizados todos los componentes financieros respecto al mismo período.

Cuando el usuario cambie de ejercicio deberán actualizarse automáticamente:

- Financial Intelligence
- Income Statement
- Balance Sheet
- Cash Flow
- Financial Ratios

sin perder el resto del contexto.

#### Filosofía

El período constituye un contexto del Workspace.

No un filtro independiente.

El usuario cambia de ejercicio.

No cambia de pantalla.

#### Principios

##### Single Source of Time

Todo el Financial Workspace trabaja siempre sobre un único período activo.

Nunca existen ejercicios distintos dentro del mismo Workspace.

##### Context Persistence

El ejercicio seleccionado permanece mientras el usuario navega entre:

- Cuenta de Resultados
- Balance
- Cash Flow
- Ratios

##### Automatic Synchronization

Todos los componentes reaccionan automáticamente al cambio de período.

Nunca requieren actualización manual.

##### Availability Awareness

Solo podrán seleccionarse períodos realmente disponibles.

Nunca se ofrecerán ejercicios inexistentes.

#### Arquitectura funcional

```text
Period Selector

────────────────────────

Current Period

↓

Available Periods

↓

Period Context

↓

Workspace Refresh
```

#### Componentes

##### Current Period

Muestra el ejercicio actualmente activo.

Ejemplo.

```text
Ejercicio analizado

2024
```

##### Available Periods

Lista cronológica de ejercicios disponibles.

Ejemplo.

- 2024
- 2023
- 2022
- 2021
- 2020

El orden será siempre descendente.

Más reciente primero.

##### Period Context

El ejercicio seleccionado pasa a convertirse en el contexto temporal del Workspace.

Todos los componentes lo consumen automáticamente.

##### Workspace Refresh

El cambio de período actualiza:

- Financial Intelligence
- Income Statement
- Balance Sheet
- Cash Flow
- Financial Ratios

La navegación permanece exactamente igual.

#### Estados

##### Loading

Recuperando ejercicios disponibles.

##### Ready

Lista disponible.

##### Single Period

Solo existe un ejercicio.

El selector permanece visible pero deshabilitado.

##### Empty

No existen ejercicios disponibles.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

El selector permanece siempre visible en la parte superior del Financial Workspace.

El cambio de ejercicio nunca:

- modifica la pestaña activa;
- modifica el nivel de lectura;
- modifica el scroll del usuario (cuando sea técnicamente posible).

Únicamente cambia el contexto temporal.

#### Business Rules

##### BR-3007-001

Solo podrán seleccionarse ejercicios disponibles.

##### BR-3007-002

Todos los componentes deberán utilizar exactamente el mismo período.

##### BR-3007-003

El cambio de período actualizará automáticamente todo el Workspace.

##### BR-3007-004

El período constituye un contexto compartido.

Nunca un filtro individual por componente.

##### BR-3007-005

El selector mostrará el ejercicio más reciente disponible por defecto.

Salvo que el usuario haya seleccionado previamente otro durante la sesión.

#### Integración Backend

El listado de ejercicios disponibles y el período activo proceden exclusivamente de Agency Tool (`arroba.v1`).

El frontend nunca infiere ejercicios.

Nunca genera períodos.

#### Dependencias

Depende de:

- Company Entity
- Financial Statements Engine

Es consumido por:

- Financial Intelligence
- Income Statement
- Balance Sheet
- Cash Flow
- Financial Ratios

#### Casos especiales

##### Empresa con un único ejercicio

El selector permanecerá visible.

No permitirá cambios.

##### Empresa con históricos incompletos

Solo aparecerán los ejercicios realmente disponibles.

##### Cambio de empresa

El período activo se reinicializa utilizando el ejercicio más reciente disponible para esa empresa.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- mantenga sincronizado todo el Financial Workspace;
- actualice automáticamente todos los componentes financieros;
- conserve la pestaña activa;
- conserve el nivel de lectura seleccionado;
- nunca implemente lógica temporal propia;
- consuma exclusivamente Agency Tool (`arroba.v1`).

#### Relación con otros componentes

Period Selector

↓

Define el contexto temporal.

Financial Intelligence

↓

Interpreta el período activo.

Income Statement

↓

Representa el período activo.

Balance Sheet

↓

Representa el período activo.

Cash Flow

↓

Representa el período activo.

Financial Ratios

↓

Representan el período activo.

#### Decisiones arquitectónicas consolidadas

##### DA-3007-001

El período constituye un contexto del Workspace.

Nunca un filtro independiente.

##### DA-3007-002

Todos los componentes financieros comparten siempre el mismo contexto temporal.

##### DA-3007-003

El cambio de período nunca modifica la navegación ni el nivel de lectura.

Únicamente actualiza la información.

Fin de COMP-3007.

##### Estado del Sprint ACC-03

| Código | Componente | Estado |
|---------|------------|--------|
| COMP-3001 | Financial Workspace | ✅ |
| COMP-3002 | Financial Intelligence | ✅ |
| COMP-3003 | Income Statement | ✅ |
| COMP-3004 | Balance Sheet | ✅ |
| COMP-3005 | Cash Flow | ✅ |
| COMP-3006 | Financial Ratios | ✅ |
| COMP-3007 | Period Selector | ✅ |

##### Sprint ACC-03 — Financial Workspace

**Estado: COMPLETADO ✅**

<a id="71-comp-4001-valuation-section"></a>
### 7.1 COMP-4001 — Valuation Section

---

id: COMP-4001

name: Valuation Section

section: Valoración

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Valuation Section constituye el módulo de valoración de la Ficha de Empresa.

Su misión consiste en permitir que cualquier usuario comprenda cuánto vale una empresa, cómo se ha obtenido dicha valoración y cuáles son las principales variables que la explican.

Responde a una única pregunta.

> **¿Cuál es el valor estimado de esta empresa?**

No pretende sustituir un informe de valoración completo.

No constituye un modelo financiero.

No permite construir una valoración desde cero.

Representa la valoración disponible para la empresa dentro de la Ficha.

#### Responsabilidad

Valuation Section organiza toda la información relativa al valor de una empresa.

Incluye:

- interpretación ejecutiva;
- resultado de la valoración;
- métodos utilizados;
- escenarios;
- sensibilidad;
- drivers de valor.

No modifica hipótesis.

No ejecuta cálculos.

Representa información generada por los motores oficiales de valoración.

#### Filosofía

La valoración no debe comenzar mostrando un número.

Debe comenzar respondiendo:

> **¿Por qué vale lo que vale?**

El usuario comprende primero.

Analiza después.

#### Arquitectura funcional

```text
Valuation Section

────────────────────────

Valuation Intelligence

────────────────────────

Valuation Summary

────────────────────────

Valuation Methods

────────────────────────

Valuation Scenarios

────────────────────────

Sensitivity Analysis

────────────────────────

Value Drivers
```

Cada componente representa una dimensión distinta de la valoración.

#### Navegación

Valuation Section constituye un único módulo de la Ficha.

La navegación entre componentes se realiza mediante scroll vertical.

No existen pestañas independientes.

#### Principios

##### Intelligence First

Toda valoración comienza por una interpretación.

Nunca por una tabla.

##### Explainability

Todo valor deberá poder justificarse.

El usuario deberá comprender:

- qué metodología se ha utilizado;
- qué hipótesis son relevantes;
- qué variables explican el resultado.

##### Transparencia

Nunca se mostrará un valor sin contexto.

##### Consistencia

Toda la sección utilizará el mismo contexto temporal y la misma información financiera.

##### No Edición

La Ficha de Empresa muestra una valoración.

No permite construirla.

#### Componentes

- **COMP-4002** — Valuation Intelligence
Interpretación ejecutiva de la valoración.

- **COMP-4003** — Valuation Summary
Resultado ejecutivo.

- **COMP-4004** — Valuation Methods
Métodos utilizados.

- **COMP-4005** — Valuation Scenarios
Escenarios de valoración.

- **COMP-4006** — Sensitivity Analysis
Impacto de las principales hipótesis.

- **COMP-4007** — Value Drivers
Variables que más influyen en el valor.

#### Estados

##### Loading

Recuperando valoración.

##### Ready

Valoración disponible.

##### Partial

Existe información parcial.

La sección permanecerá operativa.

##### Empty

No existe valoración disponible.

El usuario podrá generar una nueva valoración mediante el workflow correspondiente.

##### Error

No ha sido posible recuperar la valoración.

#### UX Behaviour

La navegación por la sección nunca modifica el contexto de la Ficha.

El usuario puede acceder libremente a cualquiera de los bloques.

El Next Step Panel permanece visible.

Arroba Copilot permanece disponible durante toda la navegación.

#### Business Rules

##### BR-4001-001

Toda valoración procede exclusivamente de Agency Tool.

##### BR-4001-002

La Ficha nunca recalcula una valoración.

##### BR-4001-003

Toda interpretación pertenece a Valuation Intelligence.

##### BR-4001-004

Toda la sección utiliza un único contexto temporal.

##### BR-4001-005

La ausencia de una valoración constituye un estado válido.

Nunca un error.

#### Integración Backend

Valuation Section consume:

- Valuation Engine
- Financial Intelligence Engine
- Company Entity

La lógica de valoración pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Financial Statements
- Valuation Engine

No depende de:

- Opportunity Engine
- Transaction OS
- Marketplace

#### Casos especiales

##### Empresa sin valoración

La sección mostrará el estado Empty.

El usuario podrá iniciar una valoración desde la acción correspondiente.

##### Valoración desactualizada

Se mostrará la fecha de cálculo.

La lógica para determinar la vigencia pertenece al motor de valoración.

##### Información financiera insuficiente

Solo se mostrarán los bloques que puedan justificarse.

Nunca se estimará una valoración sin soporte suficiente.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- estructure correctamente la sección de valoración;
- permita comprender el resultado sin abandonar la ficha;
- mantenga una separación clara entre interpretación y datos;
- funcione correctamente con información parcial;
- no implemente lógica de valoración;
- consuma exclusivamente Agency Tool (`arroba.v1`).

#### Relación con otros componentes

Financial Workspace

↓

Proporciona la información financiera.

Valuation Section

↓

Transforma esa información en una estimación de valor.

Comparativa

↓

Permite contextualizar la valoración frente al mercado.

Oportunidades

↓

Utiliza la valoración como apoyo a la toma de decisiones.

#### Decisiones arquitectónicas consolidadas

##### DA-4001-001

Valuation Section pertenece a la Ficha de Empresa.

No constituye el Valuation Workspace completo de arroba.com.

##### DA-4001-002

Toda valoración comienza por una explicación y no por un resultado numérico.

##### DA-4001-003

La Ficha representa valoraciones.

La creación, edición y gestión de valoraciones pertenecen a otros módulos de la plataforma.

Fin de COMP-4001.

<a id="comp-0008-connected-intelligence"></a>
### COMP-0008 — Connected Intelligence

---

id: COMP-0008

name: Connected Intelligence

scope: Company Entity Page

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Connected Intelligence constituye el componente encargado de conectar el análisis realizado por un módulo con las decisiones que puede tomar el usuario.

Su misión consiste en responder una única pregunta.

> ¿Y esto qué implica?

No resume información.

No repite datos.

No sustituye al Arroba Copilot.

No sustituye al Next Step Panel.

Conecta el análisis con la toma de decisiones.

#### Responsabilidad

Todo módulo analítico de la Ficha de Empresa finalizará mediante un bloque de Connected Intelligence.

Su responsabilidad consiste en:

- sintetizar las implicaciones del análisis;
- conectar con otros módulos de la ficha;
- orientar el siguiente análisis recomendado;
- ayudar al usuario a comprender el impacto del resultado obtenido.

#### Filosofía

Arroba no termina mostrando información.

Arroba termina ayudando a tomar decisiones.

Connected Intelligence constituye la transición entre el análisis y la acción.

#### Principios

##### Connected

Las conclusiones nunca permanecen aisladas.

Siempre se conectan con el resto de la ficha.

##### Action Oriented

Toda implicación debe ayudar al usuario a decidir cuál es el siguiente paso.

##### Explainable

Toda implicación deberá estar soportada por información verificable.

##### Contextual

Las conclusiones dependerán siempre de la empresa analizada.

Nunca existirán textos genéricos.

##### Estructura

Connected Intelligence podrá incluir uno o varios de los siguientes bloques.

##### Implicación principal

¿Qué significa realmente este análisis?

##### Aspectos a revisar

¿Qué debería revisar el usuario antes de continuar?

##### Relación con otros módulos

¿Qué otra información de la ficha puede ayudar a confirmar esta conclusión?

Ejemplos.

- Finanzas
- Valoración
- Mercado
- Comparativa
- Señales

##### Próximo análisis recomendado

¿Qué debería consultar ahora el usuario?

#### UX Behaviour

Connected Intelligence aparecerá siempre al final del contenido principal del módulo.

Constituye el cierre natural del análisis.

No reemplaza los botones de navegación.

No reemplaza el Next Step Panel.

#### Business Rules

##### BR-CI-001

Nunca repetirá literalmente el contenido del módulo.

##### BR-CI-002

Nunca realizará afirmaciones sin soporte.

##### BR-CI-003

Nunca recomendará acciones incompatibles con el contexto del usuario.

##### BR-CI-004

Las implicaciones deberán actualizarse automáticamente cuando cambien los datos analizados.

#### Dependencias

Connected Intelligence consume:

- Intelligence Engines
- Recommendation Engine
- Company Context

La lógica pertenece a dichos motores.

El componente representa exclusivamente el resultado.

##### Workspaces donde aparecerá

Executive Vista

Finanzas

Valoración

Propiedad

Gobierno

Mercado

Rankings

Comparativa

Señales

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- conecte el análisis con la toma de decisiones;
- no replique el contenido del módulo;
- utilice únicamente información verificable;
- dirija al usuario hacia el siguiente análisis cuando proceda;
- mantenga un comportamiento consistente en toda la Ficha de Empresa.

#### Decisiones arquitectónicas

##### DA-CI-001

Todo módulo analítico de la Ficha de Empresa finalizará mediante Connected Intelligence.

##### DA-CI-002

Connected Intelligence constituye un componente transversal reutilizable.

##### DA-CI-003

Su misión consiste en transformar información en comprensión y comprensión en decisión.

Fin de COMP-0008.

<a id="72-comp-4002-valuation-intelligence"></a>
### 7.2 COMP-4002 — Valuation Intelligence

---

id: COMP-4002

name: Valuation Intelligence

section: Valuation

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Valuation Intelligence constituye la capa de interpretación de la valoración de la empresa.

Su misión consiste en explicar el resultado obtenido antes de mostrar los modelos de valoración.

Responde a una única pregunta.

> **¿Por qué la empresa vale lo que vale?**

No calcula valoraciones.

No modifica hipótesis.

No sustituye el modelo financiero.

Interpreta el resultado generado por el Valuation Engine.

#### Responsabilidad

Traducir una valoración financiera en una explicación comprensible para cualquier usuario.

Su responsabilidad consiste en identificar los factores que realmente explican el valor obtenido.

Nunca muestra únicamente un número.

Siempre explica su significado.

#### Filosofía

Una valoración aislada tiene poco valor.

Lo importante no es conocer el Enterprise Value.

Lo importante es comprender qué factores explican ese valor.

#### Principios

##### Explain Before Numbers

La explicación siempre precede a las cifras.

##### Explainability

Toda conclusión deberá estar soportada por información verificable.

##### Contextual

La interpretación dependerá del contexto de la empresa.

Nunca será una plantilla estática.

##### Neutral

Valuation Intelligence explica.

Nunca recomienda comprar o vender.

Nunca sustituye el criterio profesional del usuario.

#### Arquitectura funcional

```text
Valuation Intelligence

────────────────────────

Executive Summary

────────────────────────

Value Narrative

────────────────────────

Key Drivers

────────────────────────

Risk Factors

────────────────────────

Confidence
```

Los bloques podrán variar según la información disponible.

La estructura no será necesariamente fija.

##### Executive Summary

#### Objetivo

Responder en menos de un minuto:

> ¿Cuál es la conclusión principal de esta valoración?

Debe poder leerse de forma independiente.

##### Value Narrative

#### Objetivo

Explicar qué factores justifican el valor obtenido.

Ejemplos.

- elevada rentabilidad;
- fuerte crecimiento;
- estabilidad del negocio;
- elevada generación de caja;
- liderazgo competitivo.

No describe cifras.

Describe los factores que las explican.

##### Key Drivers

#### Objetivo

Identificar las variables con mayor impacto sobre la valoración.

Ejemplos.

- EBITDA;
- crecimiento;
- márgenes;
- deuda;
- generación de caja;
- recurrencia.

No representa sensibilidad.

Únicamente identifica los drivers.

##### Risk Factors

#### Objetivo

Explicar qué elementos reducen o limitan el valor.

Ejemplos.

- elevada concentración de clientes;
- caída de márgenes;
- endeudamiento;
- baja generación de caja;
- elevada incertidumbre sectorial.

Todos los riesgos deberán estar soportados por información verificable.

##### Confidence

#### Objetivo

Explicar el nivel de confianza de la valoración.

El cálculo pertenece al Valuation Engine.

El componente únicamente representa el resultado.

#### Estados

##### Loading

Generando interpretación.

##### Ready

Interpretación disponible.

##### Partial

Información suficiente para interpretar parcialmente la valoración.

##### Empty

No existe valoración disponible.

##### Error

No ha sido posible generar la interpretación.

#### UX Behaviour

Valuation Intelligence aparece siempre al comienzo de la sección Valoración.

Constituye el punto de entrada del módulo.

El usuario comprende primero.

Analiza después.

#### Business Rules

##### BR-4002-001

Toda interpretación deberá estar soportada por información verificable.

##### BR-4002-002

Nunca se realizarán predicciones.

##### BR-4002-003

Nunca se emitirán recomendaciones de inversión.

##### BR-4002-004

Toda explicación deberá actualizarse automáticamente cuando cambie la valoración.

##### BR-4002-005

Los factores identificados deberán ser coherentes con los métodos de valoración utilizados.

#### Integración Backend

Valuation Intelligence consume:

- Valuation Engine
- Financial Intelligence Engine
- Market Intelligence Engine

Toda la lógica pertenece exclusivamente a dichos motores.

#### Dependencias

Depende de:

- Company Entity
- Valuation Engine
- Financial Statements

No depende de:

- Opportunity Engine
- Marketplace
- Transaction OS

#### Casos especiales

##### Valoración parcial

El componente interpretará únicamente la información disponible.

##### Valoración desactualizada

La interpretación se generará sobre la última valoración disponible.

#### Información insuficiente

El componente indicará expresamente que no existe información suficiente para elaborar determinadas conclusiones.

Nunca completará información mediante inferencias no soportadas.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- explique el resultado de la valoración antes de mostrar las cifras;
- identifique los principales drivers de valor;
- identifique los principales factores de riesgo;
- muestre el nivel de confianza de la valoración;
- nunca implemente lógica de valoración;
- consuma exclusivamente los motores oficiales.

#### Relación con otros componentes

Financial Intelligence

↓

Explica la situación financiera.

Valuation Intelligence

↓

Explica el valor de la empresa.

Valuation Summary

↓

Presenta el resultado de la valoración.

Connected Intelligence

↓

Conecta la valoración con el siguiente análisis recomendado.

#### Decisiones arquitectónicas

##### DA-4002-001

Toda valoración comienza por una explicación.

Nunca por un número.

##### DA-4002-002

Valuation Intelligence interpreta.

Nunca calcula.

##### DA-4002-003

La valoración constituye una conclusión explicable.

Nunca una cifra aislada.

Fin de COMP-4002.

<a id="73-comp-4003-valuation-summary"></a>
### 7.3 COMP-4003 — Valuation Summary

---

id: COMP-4003

name: Valuation Summary

section: Valuation

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Valuation Summary constituye el resumen ejecutivo de la valoración de la empresa.

Su misión consiste en presentar el resultado de la valoración de forma clara, comprensible y visual, permitiendo al usuario conocer inmediatamente el rango de valor estimado y sus principales referencias.

Responde a una única pregunta.

> **¿Cuál es el valor estimado de esta empresa?**

No explica el resultado.

No desarrolla las hipótesis.

No muestra el modelo de valoración.

Representa exclusivamente el resultado ejecutivo.

#### Responsabilidad

Mostrar el resultado consolidado de la valoración.

Incluye:

- Enterprise Value (EV)
- Equity Value
- Rango de valoración
- Valor central
- Fecha de valoración
- Nivel de confianza

No calcula ninguna cifra.

Toda la información procede del Valuation Engine.

#### Filosofía

La valoración debe entenderse como un rango razonable.

Nunca como una cifra exacta.

El objetivo consiste en ayudar al usuario a comprender el orden de magnitud del valor.

#### Arquitectura funcional

```text
Valuation Summary

────────────────────────

Enterprise Value

────────────────────────

Equity Value

────────────────────────

Valuation Range

────────────────────────

Confidence

────────────────────────

Valuation Date
```

##### VS-001 Enterprise Value

#### Objetivo

Mostrar el Enterprise Value obtenido por el modelo de valoración.

Cuando existan varios métodos de valoración, se mostrará el valor consolidado.

##### VS-002 Equity Value

#### Objetivo

Mostrar el Equity Value resultante.

Cuando proceda, el usuario podrá consultar el Bridge EV → Equity desde el componente correspondiente.

El cálculo no se realiza en este componente.

##### VS-003 Valuation Range

#### Objetivo

Representar el intervalo de valoración.

Ejemplo.

```text
Valor estimado

18,5 M€

Rango razonable

17,2 M€ — 20,1 M€
```

El rango sustituye a una visión excesivamente determinista del valor.

##### VS-004 Confidence

#### Objetivo

Mostrar el nivel de confianza asociado a la valoración.

El cálculo pertenece al Valuation Engine.

El componente únicamente representa el resultado.

##### VS-005 Valuation Date

#### Objetivo

Indicar la fecha de cálculo de la valoración.

Permite al usuario conocer la vigencia del análisis.

#### Estados

##### Loading

Calculando valoración.

##### Ready

Valoración disponible.

##### Partial

Solo existe parte de la información.

##### Empty

No existe valoración disponible.

##### Error

No ha sido posible recuperar la valoración.

#### UX Behaviour

Valuation Summary aparece inmediatamente después de Valuation Intelligence.

Constituye el primer bloque cuantitativo de la sección.

Debe poder comprenderse en menos de treinta segundos.

#### Business Rules

##### BR-4003-001

Siempre que exista un rango de valoración, éste tendrá prioridad sobre una cifra única.

##### BR-4003-002

Enterprise Value y Equity Value deberán mostrarse claramente diferenciados.

##### BR-4003-003

La fecha de valoración será obligatoria.

##### BR-4003-004

El componente nunca recalculará el valor.

##### BR-4003-005

La ausencia de valoración constituye un estado válido.

Nunca un error funcional.

#### Integración Backend

Valuation Summary consume exclusivamente:

- Valuation Engine

Toda la lógica de valoración pertenece al backend.

#### Dependencias

Depende de:

- Company Entity
- Valuation Engine

No depende de:

- Financial Workspace
- Opportunity Engine
- Transaction OS

#### Casos especiales

##### Empresa sin valoración

El componente mostrará el estado Empty.

Podrá ofrecer la acción:

"Generar valoración"

si el usuario dispone de permisos.

##### Valoración pendiente de actualización

Se mostrará la fecha de cálculo disponible.

La decisión sobre la vigencia pertenece al Valuation Engine.

##### Múltiples valoraciones

Cuando existan varias valoraciones oficiales, el componente mostrará únicamente la valoración activa definida por el sistema.

La selección de versiones no pertenece a la Ficha de Empresa.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- muestre claramente Enterprise Value y Equity Value;
- represente un rango de valoración cuando exista;
- indique la fecha de valoración;
- represente el nivel de confianza;
- no implemente lógica de cálculo;
- consuma exclusivamente el Valuation Engine.

#### Relación con otros componentes

Valuation Intelligence

↓

Explica el resultado.

Valuation Summary

↓

Presenta el resultado ejecutivo.

Valuation Methods

↓

Explica cómo se ha obtenido.

Connected Intelligence

↓

Conecta la valoración con el siguiente análisis.

#### Decisiones arquitectónicas

##### DA-4003-001

La valoración se comunica mediante un rango siempre que sea posible.

##### DA-4003-002

Enterprise Value y Equity Value constituyen conceptos distintos y deberán representarse de forma independiente.

##### DA-4003-003

Valuation Summary representa resultados.

Nunca métodos.

Nunca hipótesis.

Nunca sensibilidad.

Fin de COMP-4003.

<a id="74-comp-4004-valuation-methods"></a>
### 7.4 COMP-4004 — Valuation Methods

---

id: COMP-4004

name: Valuation Methods

section: Valoración

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Valuation Methods constituye el componente encargado de explicar cómo se ha obtenido la valoración de la empresa.

Su misión consiste en proporcionar transparencia sobre las metodologías utilizadas, permitiendo al usuario comprender el origen del valor estimado sin necesidad de acceder al modelo financiero completo.

Responde a una única pregunta.

> **¿Cómo se ha calculado esta valoración?**

No realiza cálculos.

No permite modificar hipótesis.

No ejecuta simulaciones.

Representa exclusivamente las metodologías utilizadas por el Valuation Engine.

#### Responsabilidad

Mostrar de forma clara:

- los métodos de valoración aplicados;
- el peso de cada método (cuando proceda);
- el resultado obtenido por cada uno;
- el método utilizado para obtener la valoración consolidada.

Su responsabilidad consiste en explicar el proceso.

Nunca en recalcularlo.

#### Filosofía

La valoración debe ser transparente.

El usuario debe poder comprender por qué un método aporta más valor que otro y cómo se alcanza el resultado final.

La confianza nace de la trazabilidad.

#### Principios

##### Explainability

Toda metodología deberá poder explicarse.

##### Transparency

El usuario debe conocer qué métodos intervienen en la valoración.

##### Consistency

Todos los métodos utilizarán el mismo contexto financiero y temporal.

##### No Editing

La Ficha de Empresa representa métodos.

No permite modificarlos.

#### Arquitectura funcional

```text
Valuation Methods

────────────────────────

Methods Overview

↓

Method Cards

↓

Consolidated Result
```

##### VM-001 Methods Overview

#### Objetivo

Presentar una visión general de las metodologías empleadas.

Ejemplo.

- Múltiplos de mercado
- Transacciones comparables
- Descuento de Flujos de Caja (DCF)
- Valor contable ajustado

La disponibilidad dependerá del tipo de valoración.

##### VM-002 Method Cards

#### Objetivo

Mostrar cada metodología de forma independiente.

Cada tarjeta podrá incluir:

- nombre del método;
- descripción breve;
- resultado obtenido;
- estado (utilizado / complementario / no disponible).

No mostrará el modelo matemático completo.

##### VM-003 Consolidated Result

#### Objetivo

Explicar cómo se obtiene la valoración consolidada.

Cuando intervengan varios métodos, el componente deberá indicar cuál constituye la referencia principal.

Nunca ocultará que existen resultados distintos entre metodologías.

#### Estados

##### Loading

Recuperando metodologías.

##### Ready

Información disponible.

##### Partial

Solo existen algunas metodologías.

##### Empty

No existen métodos disponibles.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

Valuation Methods aparece inmediatamente después de Valuation Summary.

Cada metodología se presenta de forma independiente y puede expandirse para consultar información adicional.

El componente mantiene una lectura ejecutiva por defecto.

#### Business Rules

##### BR-4004-001

Los métodos proceden exclusivamente del Valuation Engine.

##### BR-4004-002

El frontend nunca recalculará resultados.

##### BR-4004-003

La explicación de cada metodología deberá mantenerse coherente con la valoración consolidada.

##### BR-4004-004

Cuando un método no resulte aplicable deberá indicarse explícitamente.

Nunca se ocultará su ausencia.

##### BR-4004-005

El componente representa metodologías.

Nunca permite su edición.

#### Integración Backend

Valuation Methods consume:

- Valuation Engine

Toda la lógica pertenece al backend.

#### Dependencias

Depende de:

- Company Entity
- Valuation Engine
- Valuation Summary

No depende de:

- Opportunity Engine
- Transaction OS
- Marketplace

#### Casos especiales

##### Valoración basada en un único método

El componente mostrará únicamente dicho método como referencia principal.

##### Métodos parcialmente disponibles

Solo se mostrarán los métodos con soporte suficiente.

Los restantes aparecerán como "No disponible".

##### Valoración pendiente de actualización

El componente mostrará la última metodología disponible junto con la fecha de cálculo de la valoración.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- identifique claramente las metodologías utilizadas;
- explique el propósito de cada una;
- muestre el resultado asociado a cada método cuando proceda;
- indique cómo se obtiene la valoración consolidada;
- no implemente lógica de valoración;
- consuma exclusivamente el Valuation Engine.

#### Relación con otros componentes

Valuation Intelligence

↓

Explica el resultado.

Valuation Summary

↓

Presenta el valor obtenido.

Valuation Methods

↓

Explica cómo se ha calculado.

Connected Intelligence

↓

Conecta la valoración con el siguiente análisis.

#### Decisiones arquitectónicas

##### DA-4004-001

Toda valoración deberá indicar las metodologías utilizadas para obtener el resultado.

##### DA-4004-002

La explicación de las metodologías forma parte de la Ficha de Empresa.

La configuración y parametrización de dichas metodologías pertenece al Valuation Workspace de la plataforma.

##### DA-4004-003

Valuation Methods representa el proceso de cálculo.

Nunca ejecuta ni modifica una valoración.

Fin de COMP-4004.

<a id="75-comp-4005-enterprise-value-bridge"></a>
### 7.5 COMP-4005 — Enterprise Value Bridge

---

id: COMP-4005

name: Enterprise Value Bridge

section: Valoración

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Enterprise Value Bridge constituye el componente encargado de explicar la transición entre el Enterprise Value y el Equity Value.

Su misión consiste en mostrar de forma transparente cómo el valor económico de la empresa se transforma en el valor atribuible a los accionistas.

Responde a una única pregunta.

> **¿Cómo se obtiene el Equity Value a partir del Enterprise Value?**

No calcula la valoración.

No modifica hipótesis.

Representa exclusivamente el puente de valor generado por el Valuation Engine.

#### Responsabilidad

Mostrar la reconciliación completa entre:

- Enterprise Value (EV)
- Ajustes de deuda neta
- Otros ajustes de valoración
- Equity Value

El componente permite comprender qué parte del valor corresponde realmente al accionista.

#### Filosofía

Dos empresas con el mismo Enterprise Value pueden tener Equity Values completamente distintos.

Comprender esa diferencia constituye uno de los elementos más importantes de cualquier valoración.

El Bridge transforma una cifra abstracta en una realidad económica.

#### Principios

##### Transparency

Todos los ajustes deberán ser visibles.

Nunca existirán ajustes implícitos.

##### Traceability

Cada ajuste deberá poder rastrearse hasta su origen.

##### Explainability

El usuario deberá comprender por qué cada ajuste aumenta o disminuye el valor.

##### Consistency

Todos los importes deberán corresponder al mismo ejercicio y a la misma valoración.

#### Arquitectura funcional

```text
Enterprise Value

↓

Net Debt

↓

Financial Adjustments

↓

Non Operating Assets / Liabilities

↓

Other Valuation Adjustments

↓

Equity Value
```

La estructura exacta dependerá del modelo de valoración utilizado.

##### EVB-001 Enterprise Value

#### Objetivo

Mostrar el Enterprise Value consolidado utilizado como punto de partida.

Este valor procede directamente de Valuation Summary.

##### EVB-002 Net Debt

#### Objetivo

Representar el efecto de la deuda financiera neta sobre el valor del accionista.

Cuando proceda podrá desglosarse en:

- deuda financiera;
- caja y equivalentes;
- otros instrumentos financieros.

##### EVB-003 Financial Adjustments

#### Objetivo

Representar los ajustes financieros adicionales definidos por el modelo de valoración.

Solo aparecerán cuando existan.

##### EVB-004 Non Operating Assets & Liabilities

#### Objetivo

Mostrar activos y pasivos no operativos que afecten al Equity Value.

Ejemplos.

- activos no estratégicos;
- inversiones financieras;
- pasivos extraordinarios.

##### EVB-005 Other Adjustments

#### Objetivo

Representar cualquier otro ajuste incorporado por el Valuation Engine.

El componente nunca genera ajustes propios.

##### EVB-006 Equity Value

#### Objetivo

Mostrar el Equity Value final atribuible al accionista.

Debe coincidir exactamente con el mostrado en Valuation Summary.

#### Visualización

El Bridge deberá representarse preferentemente mediante una visualización tipo waterfall.

Cuando no sea posible, podrá utilizarse una representación tabular.

La elección pertenece al Design System.

#### Estados

##### Loading

Recuperando información.

##### Ready

Bridge disponible.

##### Partial

Solo existen algunos ajustes.

##### Empty

No existe información suficiente para construir el Bridge.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

El usuario podrá expandir cada ajuste para consultar información adicional cuando exista.

La visualización permanecerá siempre sincronizada con la valoración activa.

#### Business Rules

##### BR-4005-001

Enterprise Value y Equity Value deberán coincidir exactamente con Valuation Summary.

##### BR-4005-002

Todos los ajustes deberán proceder exclusivamente del Valuation Engine.

##### BR-4005-003

El frontend nunca recalculará el Bridge.

##### BR-4005-004

Los ajustes aparecerán en el mismo orden definido por el modelo de valoración.

##### BR-4005-005

No podrán ocultarse ajustes por motivos de diseño.

La representación visual podrá simplificarse.

La información nunca.

#### Integración Backend

Enterprise Value Bridge consume:

- Valuation Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Valuation Summary
- Company Entity
- Valuation Engine

No depende de:

- Financial Workspace
- Opportunity Engine
- Transaction OS

#### Casos especiales

##### Sin deuda financiera

El Bridge mostrará un paso directo entre Enterprise Value y Equity Value.

##### Ajustes no aplicables

Los bloques correspondientes no se mostrarán.

#### Información parcial

Solo se representarán los ajustes disponibles.

Nunca se estimarán ajustes inexistentes.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente la transición entre Enterprise Value y Equity Value;
- identifique todos los ajustes relevantes;
- mantenga consistencia con Valuation Summary;
- no implemente lógica financiera;
- consuma exclusivamente el Valuation Engine.

#### Relación con otros componentes

Valuation Summary

↓

Presenta el resultado.

Enterprise Value Bridge

↓

Explica cómo se obtiene el valor del accionista.

Valuation Scenarios

↓

Analiza distintos escenarios de valoración.

Connected Intelligence

↓

Conecta la valoración con la toma de decisiones.

#### Decisiones arquitectónicas

##### DA-4005-001

Enterprise Value Bridge constituye un componente obligatorio de la sección Valoración.

##### DA-4005-002

El Bridge representa la reconciliación oficial entre Enterprise Value y Equity Value.

##### DA-4005-003

La lógica del Bridge pertenece exclusivamente al Valuation Engine.

El componente representa el resultado.

Fin de COMP-4005.

<a id="76-comp-4006-valuation-scenarios"></a>
### 7.6 COMP-4006 — Valuation Scenarios

---

id: COMP-4006

name: Valuation Scenarios

section: Valoración

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Valuation Scenarios constituye el componente encargado de representar los distintos escenarios de valoración calculados para una empresa.

Su misión consiste en ayudar al usuario a comprender cómo varía el valor estimado bajo diferentes hipótesis razonables.

Responde a una única pregunta.

> **¿Cómo cambia la valoración bajo distintos escenarios?**

No modifica hipótesis.

No ejecuta simulaciones.

No recalcula valoraciones.

Representa exclusivamente los escenarios generados por el Valuation Engine.

#### Responsabilidad

Mostrar los distintos escenarios de valoración disponibles.

Cada escenario representa una combinación coherente de hipótesis definida por el modelo de valoración.

El componente no explica los métodos utilizados.

El componente no analiza la sensibilidad de cada variable.

Su misión consiste únicamente en representar los diferentes resultados posibles.

#### Filosofía

Una valoración nunca debe entenderse como una cifra única.

Toda valoración representa un rango de resultados razonables.

Los escenarios permiten comprender la incertidumbre inherente a cualquier proceso de valoración.

#### Principios

##### Range over Point Estimate

El usuario debe pensar en intervalos.

Nunca en cifras absolutas.

##### Transparency

Todo escenario deberá identificarse claramente.

##### Consistency

Todos los escenarios deberán construirse utilizando el mismo modelo de valoración.

##### Comparability

Los escenarios deberán poder compararse fácilmente entre sí.

#### Arquitectura funcional

```text
Valuation Scenarios

────────────────────────

Conservador

↓

Base

↓

Optimista
```

La arquitectura admite escenarios adicionales cuando el modelo de valoración los defina.

##### VS-001 Conservative Scenario

#### Objetivo

Representar el escenario más prudente.

Corresponde a las hipótesis más conservadoras aceptadas por el modelo.

##### VS-002 Base Scenario

#### Objetivo

Representar el escenario considerado más probable.

Constituye la referencia principal de la valoración.

Todos los demás componentes de la Ficha utilizarán este escenario salvo indicación expresa.

##### VS-003 Optimistic Scenario

#### Objetivo

Representar el escenario con mayor creación potencial de valor.

No representa una predicción.

Representa un supuesto alternativo.

#### Visualización

Cada escenario podrá representarse mediante:

- tarjeta ejecutiva;
- gráfico comparativo;
- barra de rango;
- tabla resumen.

La elección pertenece al Design System.

#### Estados

##### Loading

Recuperando escenarios.

##### Ready

Escenarios disponibles.

##### Partial

Solo existen algunos escenarios.

##### Empty

No existen escenarios disponibles.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

El escenario Base permanecerá seleccionado por defecto.

El usuario podrá consultar el resto de escenarios sin abandonar la sección.

El cambio de escenario no modificará el resto de módulos de la Ficha.

#### Business Rules

##### BR-4006-001

Todos los escenarios proceden exclusivamente del Valuation Engine.

##### BR-4006-002

El escenario Base constituye la referencia oficial de la Ficha de Empresa.

##### BR-4006-003

El frontend nunca recalculará escenarios.

##### BR-4006-004

Los escenarios deberán representarse siempre en el mismo orden:

- Conservador
- Base
- Optimista

salvo que el modelo oficial defina otro diferente.

##### BR-4006-005

La ausencia de escenarios constituye un estado válido.

Nunca un error funcional.

#### Integración Backend

Valuation Scenarios consume exclusivamente:

- Valuation Engine

Toda la lógica pertenece al backend.

#### Dependencias

Depende de:

- Company Entity
- Valuation Engine
- Valuation Summary

No depende de:

- Financial Workspace
- Transaction OS
- Marketplace

#### Casos especiales

##### Valoración con escenario único

El componente mostrará únicamente el escenario disponible.

##### Escenarios incompletos

Solo se representarán los escenarios calculados por el motor.

Nunca se estimarán escenarios adicionales.

##### Cambio de valoración

Los escenarios se actualizarán automáticamente con la valoración activa.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente los escenarios disponibles;
- permita compararlos de forma sencilla;
- mantenga el escenario Base como referencia principal;
- no implemente lógica de valoración;
- consuma exclusivamente el Valuation Engine.

#### Relación con otros componentes

Valuation Summary

↓

Presenta la valoración principal.

Enterprise Value Bridge

↓

Explica cómo se obtiene el Equity Value.

Valuation Scenarios

↓

Muestra cómo varía la valoración bajo distintos escenarios.

Sensitivity Analysis

↓

Explica qué variables provocan esos cambios.

Connected Intelligence

↓

Conecta la valoración con la siguiente decisión.

#### Decisiones arquitectónicas

##### DA-4006-001

La Ficha de Empresa representa escenarios.

Nunca permite construirlos ni modificarlos.

##### DA-4006-002

El escenario Base constituye la referencia oficial utilizada por el resto de la Ficha.

##### DA-4006-003

Los escenarios representan alternativas de valoración.

Nunca predicciones.

Fin de COMP-4006.

<a id="77-comp-4007-sensitivity-analysis"></a>
### 7.7 COMP-4007 — Sensitivity Analysis

---

id: COMP-4007

name: Sensitivity Analysis

section: Valoración

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Sensitivity Analysis constituye el componente encargado de representar cómo varía la valoración de la empresa cuando cambian las principales hipótesis del modelo.

Su misión consiste en ayudar al usuario a comprender qué variables tienen un mayor impacto sobre el valor obtenido.

Responde a una única pregunta.

> **¿Qué ocurre con la valoración si cambian las principales hipótesis?**

No modifica hipótesis.

No recalcula modelos.

No permite simulaciones libres.

Representa exclusivamente los análisis de sensibilidad generados por el Valuation Engine.

#### Responsabilidad

Mostrar el impacto de las principales variables sobre la valoración.

Su responsabilidad consiste en explicar la robustez del resultado obtenido.

No representa escenarios completos.

No representa métodos de valoración.

Representa únicamente la sensibilidad del valor frente a cambios concretos.

#### Filosofía

Toda valoración depende de determinadas hipótesis.

El usuario debe comprender cuáles son las variables críticas antes de confiar en un resultado.

La sensibilidad permite medir la estabilidad de la valoración.

#### Principios

##### Explainability

Toda variación deberá estar claramente identificada.

##### Traceability

Cada sensibilidad deberá indicar la variable que provoca el cambio.

##### Transparency

Nunca se ocultarán variaciones significativas.

##### Consistency

Todas las sensibilidades deberán construirse sobre la valoración Base.

#### Arquitectura funcional

```text
Sensitivity Analysis

────────────────────────

Variable

↓

Valor Base

↓

Rango Analizado

↓

Impacto sobre EV

↓

Impacto sobre Equity Value
```

##### Variables habituales

El modelo podrá analizar, entre otras:

- EBITDA
- Crecimiento
- Margen EBITDA
- Múltiplo
- WACC
- CAPEX
- Capital Circulante
- Deuda Neta

La disponibilidad dependerá del método de valoración utilizado.

#### Visualización

La sensibilidad podrá representarse mediante:

- matriz bidimensional;
- tornado chart;
- spider chart;
- waterfall;
- tabla de sensibilidad.

La representación concreta pertenece al Design System.

#### Estados

##### Loading

Generando análisis.

##### Ready

Información disponible.

##### Partial

Solo existen sensibilidades para algunas variables.

##### Empty

No existe análisis de sensibilidad.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

El usuario podrá identificar inmediatamente:

- qué variable tiene mayor impacto;
- qué variable tiene menor impacto;
- cuál es el rango razonable de variación.

No será necesario interpretar tablas complejas para obtener estas conclusiones.

#### Business Rules

##### BR-4007-001

Todas las sensibilidades proceden exclusivamente del Valuation Engine.

##### BR-4007-002

El frontend nunca recalculará sensibilidades.

##### BR-4007-003

Toda sensibilidad deberá construirse respecto al escenario Base.

##### BR-4007-004

Las variables deberán mantener siempre el mismo orden de representación para una misma metodología.

##### BR-4007-005

El componente nunca permitirá modificar hipótesis desde la Ficha de Empresa.

#### Integración Backend

Sensitivity Analysis consume exclusivamente:

- Valuation Engine

Toda la lógica pertenece al backend.

#### Dependencias

Depende de:

- Company Entity
- Valuation Engine
- Valuation Summary

No depende de:

- Financial Workspace
- Transaction OS
- Marketplace

#### Casos especiales

##### Método sin sensibilidad

El componente mostrará el estado Empty.

##### Sensibilidad parcial

Solo se representarán las variables disponibles.

Nunca se estimarán sensibilidades inexistentes.

##### Cambio de valoración

El análisis se actualizará automáticamente utilizando la valoración activa.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente el impacto de las principales variables;
- permita identificar rápidamente los drivers más sensibles;
- mantenga consistencia con la valoración Base;
- no implemente lógica de valoración;
- consuma exclusivamente el Valuation Engine.

#### Relación con otros componentes

Valuation Summary

↓

Presenta el resultado.

Enterprise Value Bridge

↓

Explica la transición hasta el Equity Value.

Valuation Scenarios

↓

Representa distintos escenarios de valoración.

Sensitivity Analysis

↓

Explica qué variables provocan los cambios de valor.

Connected Intelligence

↓

Ayuda a interpretar el impacto de dichas variaciones.

#### Decisiones arquitectónicas

##### DA-4007-001

La Ficha de Empresa representa sensibilidades.

Nunca permite construir modelos de sensibilidad.

##### DA-4007-002

Toda sensibilidad se calcula respecto a la valoración Base.

##### DA-4007-003

Sensitivity Analysis explica la robustez de una valoración.

Nunca sustituye al modelo de valoración.

Fin de COMP-4007.

##### Estado del Capítulo 7 — Valoración

| Código | Componente | Estado |
|---------|------------|--------|
| COMP-4001 | Valuation Section | ✅ |
| COMP-4002 | Valuation Intelligence | ✅ |
| COMP-4003 | Valuation Summary | ✅ |
| COMP-4004 | Valuation Methods | ✅ |
| COMP-4005 | Enterprise Value Bridge | ✅ |
| COMP-4006 | Valuation Scenarios | ✅ |
| COMP-4007 | Sensitivity Analysis | ✅ |

##### Sprint ACC-04 — Valoración

**Estado: COMPLETADO ✅**

<a id="81-comp-5001-ownership-section"></a>
### 8.1 COMP-5001 — Ownership Section

---

id: COMP-5001

name: Ownership Section

section: Propiedad

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Ownership Section constituye el módulo de la Ficha de Empresa encargado de representar la estructura de propiedad y control de una compañía.

Su misión consiste en permitir que el usuario comprenda quién controla la empresa, cómo se distribuye la propiedad y cuáles son las relaciones societarias relevantes.

Responde a una única pregunta.

> **¿Quién es el propietario de esta empresa y cómo está estructurada su propiedad?**

No interpreta la información.

No realiza análisis de gobierno corporativo.

No evalúa riesgos.

Representa exclusivamente la estructura de propiedad disponible.

#### Responsabilidad

Ownership Section organiza toda la información relativa a la titularidad de la empresa.

Incluye:

- accionistas;
- participaciones;
- beneficiarios efectivos (cuando proceda);
- sociedades matrices;
- filiales;
- participaciones relevantes;
- estructura del grupo.

No calcula relaciones societarias.

No modifica información registral.

Representa información consolidada procedente de las fuentes oficiales.

#### Filosofía

Comprender una empresa exige comprender quién la controla.

La propiedad constituye un elemento esencial para cualquier proceso de:

- inversión;
- adquisición;
- financiación;
- análisis competitivo;
- due diligence.

#### Principios

##### Transparency

La estructura de propiedad debe ser comprensible de un solo vistazo.

##### Traceability

Toda relación societaria deberá poder rastrearse hasta su fuente.

##### Entity First

La información se representa mediante entidades.

Nunca mediante texto libre.

##### Explainability

Toda relación de propiedad deberá poder justificarse.

#### Arquitectura funcional

```text
Ownership Section

────────────────────────

Ownership Overview

↓

Shareholders

↓

Ownership Structure

↓

Corporate Group

↓

Related Entities
```

Cada bloque representa una dimensión distinta de la estructura societaria.

#### Navegación

Ownership Section constituye un único módulo de la Ficha.

La navegación se realiza mediante scroll vertical.

Todos los bloques permanecen sincronizados.

##### Ownership Overview

#### Objetivo

Proporcionar una visión ejecutiva de la estructura de propiedad.

Debe responder rápidamente:

- ¿Empresa independiente?
- ¿Forma parte de un grupo?
- ¿Existe un accionista dominante?
- ¿Existe control compartido?

##### Shareholders

#### Objetivo

Representar los principales accionistas.

Cada accionista podrá mostrar:

- nombre;
- porcentaje;
- tipo de entidad;
- relación con la empresa.

No representa el historial de cambios.

##### Ownership Structure

#### Objetivo

Mostrar la distribución de la propiedad.

Preferentemente mediante una representación visual.

Ejemplos.

- estructura accionarial;
- organigrama societario;
- ownership tree.

La representación concreta pertenece al Design System.

##### Corporate Group

#### Objetivo

Representar la pertenencia a un grupo empresarial.

Podrá incluir:

- sociedad dominante;
- filiales;
- sociedades hermanas;
- sociedades participadas.

##### Related Entities

#### Objetivo

Mostrar otras entidades relacionadas relevantes.

Ejemplos.

- sociedades vinculadas;
- holdings;
- vehículos societarios;
- sociedades participadas.

#### Estados

##### Loading

Recuperando estructura societaria.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información societaria suficiente.

##### Error

No ha sido posible recuperar la estructura de propiedad.

#### UX Behaviour

Ownership Section mantiene el mismo patrón visual que el resto de módulos de la Ficha.

El usuario puede recorrer toda la estructura sin abandonar el contexto de la empresa.

Las entidades relacionadas podrán abrir su propia Ficha de Empresa.

#### Business Rules

##### BR-5001-001

Toda la información societaria procede exclusivamente de fuentes oficiales integradas en Agency Tool.

##### BR-5001-002

El frontend nunca reconstruirá relaciones societarias.

##### BR-5001-003

Toda entidad representada deberá existir como entidad normalizada.

##### BR-5001-004

Las relaciones de propiedad deberán mantenerse consistentes en toda la plataforma.

##### BR-5001-005

La ausencia de información constituye un estado válido.

Nunca un error funcional.

#### Integración Backend

Ownership Section consume:

- Ownership Engine
- Company Entity Engine

Toda la lógica de consolidación pertenece al backend.

#### Dependencias

Depende de:

- Company Entity
- Ownership Engine

No depende de:

- Transaction OS
- Marketplace
- Opportunity Engine

#### Casos especiales

##### Empresa independiente

El componente representará explícitamente que la empresa no pertenece a un grupo conocido.

##### Grupo empresarial complejo

La representación podrá simplificarse visualmente manteniendo acceso al detalle completo.

#### Información parcial

Solo se mostrarán relaciones verificadas.

Nunca se inferirán relaciones societarias.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente la estructura de propiedad;
- identifique accionistas y grupo empresarial;
- permita navegar entre entidades relacionadas;
- no implemente lógica societaria;
- consuma exclusivamente los motores oficiales.

#### Relación con otros componentes

Executive Vista

↓

Resume la empresa.

Ownership Section

↓

Explica quién controla la empresa.

Governance Section

↓

Explica cómo se gobierna la empresa.

Connected Intelligence

↓

Conecta la estructura de propiedad con sus implicaciones.

#### Decisiones arquitectónicas

##### DA-5001-001

Ownership Section representa la estructura de propiedad.

Nunca la interpreta.

##### DA-5001-002

Toda relación societaria se representa mediante entidades normalizadas.

Nunca mediante texto libre.

##### DA-5001-003

La navegación entre empresas constituye un comportamiento nativo del componente.

Fin de COMP-5001.

<a id="82-comp-5002-ownership-intelligence"></a>
### 8.2 COMP-5002 — Ownership Intelligence

---

id: COMP-5002

name: Ownership Intelligence

section: Propiedad

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Ownership Intelligence constituye la capa de interpretación de la estructura de propiedad de una empresa.

Su misión consiste en explicar qué implica la composición accionarial y la estructura societaria antes de mostrar el detalle de las entidades relacionadas.

Responde a una única pregunta.

> **¿Qué significa realmente esta estructura de propiedad?**

No interpreta aspectos financieros.

No interpreta el gobierno corporativo.

No realiza recomendaciones de inversión.

Explica exclusivamente la estructura de propiedad.

#### Responsabilidad

Traducir una estructura societaria compleja en una explicación sencilla para el usuario.

Su misión consiste en identificar los aspectos más relevantes relacionados con:

- concentración accionarial;
- control efectivo;
- independencia;
- pertenencia a grupos;
- complejidad societaria.

Nunca sustituye a la información registral.

La complementa.

#### Filosofía

Conocer quién posee una empresa resulta más útil cuando se comprende qué implica esa estructura.

Ownership Intelligence convierte relaciones societarias en conocimiento accionable.

#### Principios

##### Explainability

Toda conclusión deberá estar soportada por datos verificables.

##### Neutrality

El componente interpreta.

Nunca juzga.

Nunca recomienda.

##### Entity Driven

Las conclusiones se generan a partir de entidades y relaciones.

Nunca mediante texto estático.

##### Contextual

La interpretación dependerá de la estructura concreta de cada empresa.

Nunca existirá una narrativa genérica.

#### Arquitectura funcional

```text
Ownership Intelligence

────────────────────────

Executive Summary

↓

Ownership Insights

↓

Control Analysis

↓

Corporate Structure

↓

Key Findings
```

La estructura podrá adaptarse dinámicamente según la información disponible.

##### OI-001 Executive Summary

#### Objetivo

Responder en menos de un minuto:

> ¿Cómo está estructurada la propiedad de esta empresa?

Debe proporcionar una visión ejecutiva fácilmente comprensible.

##### OI-002 Ownership Insights

#### Objetivo

Identificar los principales aspectos relevantes de la estructura accionarial.

Ejemplos.

- elevada concentración;
- capital muy distribuido;
- presencia de un holding;
- empresa familiar;
- participación institucional.

##### OI-003 Control Analysis

#### Objetivo

Explicar quién ejerce el control efectivo.

Cuando sea posible deberá distinguir entre:

- propiedad;
- control;
- influencia significativa.

##### OI-004 Corporate Structure

#### Objetivo

Interpretar la complejidad de la estructura societaria.

Ejemplos.

- grupo simple;
- grupo internacional;
- múltiples filiales;
- estructura holding.

##### OI-005 Key Findings

#### Objetivo

Destacar los hallazgos más relevantes relacionados con la propiedad.

Solo incluirá hechos soportados por información verificable.

#### Estados

##### Loading

Generando interpretación.

##### Ready

Interpretación disponible.

##### Partial

Información suficiente para generar parte del análisis.

##### Empty

No existe información societaria suficiente.

##### Error

No ha sido posible generar la interpretación.

#### UX Behaviour

Ownership Intelligence aparece siempre al inicio de la sección Propiedad.

El usuario comprende primero la estructura.

Posteriormente accede al detalle de accionistas y relaciones societarias.

#### Business Rules

##### BR-5002-001

Toda interpretación deberá estar respaldada por información verificable.

##### BR-5002-002

Nunca se inferirá un beneficiario efectivo cuando no exista soporte suficiente.

##### BR-5002-003

El componente nunca modificará relaciones societarias.

##### BR-5002-004

La interpretación se actualizará automáticamente cuando cambie la estructura de propiedad.

##### BR-5002-005

El componente nunca emitirá recomendaciones sobre operaciones corporativas.

#### Integración Backend

Ownership Intelligence consume:

- Ownership Intelligence Engine
- Ownership Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente a dichos motores.

#### Dependencias

Depende de:

- Company Entity
- Ownership Engine
- Ownership Intelligence Engine

No depende de:

- Governance Engine
- Transaction OS
- Marketplace

#### Casos especiales

##### Empresa independiente

La interpretación destacará que no existen relaciones societarias relevantes conocidas.

##### Grupo empresarial

La interpretación explicará el papel de la empresa dentro del grupo.

#### Información parcial

Solo se interpretarán relaciones verificadas.

Nunca se completará información mediante inferencias.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- explique de forma sencilla la estructura de propiedad;
- identifique el control efectivo cuando sea posible;
- destaque los principales hallazgos societarios;
- nunca modifique información registral;
- consuma exclusivamente los motores oficiales de Ownership Intelligence.

#### Relación con otros componentes

Executive Snapshot

↓

Resume la empresa.

Ownership Intelligence

↓

Interpreta la estructura de propiedad.

Ownership Section

↓

Representa accionistas y relaciones societarias.

Governance Section

↓

Describe la estructura de gobierno.

Connected Intelligence

↓

Explica las implicaciones de la estructura de propiedad.

#### Decisiones arquitectónicas

##### DA-5002-001

Toda sección de Propiedad comienza por una interpretación ejecutiva.

##### DA-5002-002

Ownership Intelligence interpreta la estructura societaria.

Nunca modifica ni calcula relaciones de propiedad.

##### DA-5002-003

La interpretación de la propiedad constituye una capa independiente y reutilizable dentro de la arquitectura de arroba.com.

Fin de COMP-5002.

<a id="83-comp-5003-ownership-overview"></a>
### 8.3 COMP-5003 — Ownership Overview

---

id: COMP-5003

name: Ownership Overview

section: Propiedad

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Ownership Overview constituye el resumen ejecutivo de la estructura de propiedad de la empresa.

Su misión consiste en ofrecer una visión inmediata de quién controla la compañía y cómo se distribuye su capital.

Responde a una única pregunta.

> **¿Cómo está distribuida la propiedad de esta empresa?**

No interpreta.

No analiza riesgos.

No explica implicaciones.

Representa únicamente la estructura de propiedad consolidada.

La interpretación pertenece a Ownership Intelligence.

#### Responsabilidad

Mostrar de forma resumida la estructura accionarial de la empresa.

Incluye, cuando exista información disponible:

- accionista de control;
- principales accionistas;
- porcentaje de participación;
- estructura de control;
- pertenencia a grupo empresarial.

No muestra el detalle completo de todas las participaciones.

Ese comportamiento pertenece a los componentes específicos de la sección.

#### Filosofía

El usuario debe comprender la estructura de propiedad en menos de un minuto.

La información más relevante debe aparecer antes que el detalle societario.

#### Principios

##### Executive First

La información deberá poder comprenderse de un vistazo.

##### Entity First

Los propietarios siempre se representan mediante entidades.

Nunca mediante texto libre.

##### Transparency

Toda participación mostrada deberá proceder de una fuente verificable.

##### Consistency

La información resumida deberá coincidir exactamente con el detalle mostrado en el resto de la sección.

#### Arquitectura funcional

```text
Ownership Overview

────────────────────────

Ownership Type

↓

Main Shareholder

↓

Top Shareholders

↓

Ownership Distribution

↓

Corporate Group
```

##### OO-001 Ownership Type

#### Objetivo

Identificar el tipo de estructura de propiedad.

Ejemplos.

- Empresa independiente
- Empresa familiar
- Grupo empresarial
- Filial
- Sociedad holding
- Sociedad participada

La clasificación pertenece al Ownership Engine.

##### OO-002 Main Shareholder

#### Objetivo

Mostrar el principal accionista o entidad controladora.

Cuando no exista control identificable se indicará expresamente.

##### OO-003 Top Shareholders

#### Objetivo

Representar los principales accionistas de la compañía.

Cada accionista podrá mostrar:

- entidad;
- porcentaje;
- tipo de participación.

El número máximo de accionistas visibles pertenece al Design System.

##### OO-004 Ownership Distribution

#### Objetivo

Representar visualmente la distribución del capital.

La representación podrá utilizar:

- gráfico circular;
- barras;
- árbol de propiedad;
- esquema societario.

La representación concreta pertenece al Design System.

##### OO-005 Corporate Group

#### Objetivo

Indicar si la empresa forma parte de un grupo.

Cuando proceda podrá mostrar:

- sociedad matriz;
- posición dentro del grupo;
- número de filiales.

El detalle completo pertenece al componente Corporate Group.

#### Estados

##### Loading

Recuperando estructura accionarial.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente.

##### Error

No ha sido posible recuperar la estructura de propiedad.

#### UX Behaviour

Ownership Overview aparece inmediatamente después de Ownership Intelligence.

Debe poder comprenderse completamente en menos de un minuto.

Constituye la entrada al resto de componentes de Propiedad.

#### Business Rules

##### BR-5003-001

Toda la información procede exclusivamente del Ownership Engine.

##### BR-5003-002

El componente nunca recalculará porcentajes de participación.

##### BR-5003-003

Toda entidad representada deberá existir como entidad normalizada.

##### BR-5003-004

Ownership Overview representa exclusivamente la información más relevante.

Nunca sustituye al detalle completo.

##### BR-5003-005

La ausencia de información constituye un estado válido.

Nunca un error funcional.

#### Integración Backend

Ownership Overview consume:

- Ownership Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Ownership Engine

No depende de:

- Governance Engine
- Transaction OS
- Marketplace

#### Casos especiales

##### Empresa sin accionistas identificados

El componente mostrará explícitamente que no existe información disponible.

##### Empresa perteneciente a un grupo

Ownership Overview identificará la sociedad dominante y el rol de la empresa dentro del grupo.

##### Participaciones indirectas

Solo se representarán cuando hayan sido consolidadas por el Ownership Engine.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- resuma correctamente la estructura accionarial;
- identifique el accionista principal;
- represente la distribución de la propiedad;
- mantenga consistencia con el resto de la sección;
- no implemente lógica societaria;
- consuma exclusivamente el Ownership Engine.

#### Relación con otros componentes

Ownership Intelligence

↓

Interpreta la estructura.

Ownership Overview

↓

Resume la propiedad.

Shareholders

↓

Presenta el detalle de accionistas.

Corporate Group

↓

Presenta la estructura societaria completa.

Connected Intelligence

↓

Explica las implicaciones de la propiedad.

#### Decisiones arquitectónicas

##### DA-5003-001

Ownership Overview constituye el resumen ejecutivo de la estructura de propiedad.

##### DA-5003-002

La representación visual de la propiedad pertenece al Design System.

##### DA-5003-003

Toda la información representada deberá mantenerse sincronizada con el Ownership Engine.

Fin de COMP-5003.

<a id="84-comp-5004-shareholders"></a>
### 8.4 COMP-5004 — Shareholders

---

id: COMP-5004

name: Shareholders

section: Propiedad

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Shareholders constituye el componente encargado de representar el detalle de los propietarios de una empresa.

Su misión consiste en permitir al usuario conocer quiénes son los accionistas de la compañía, cuál es su participación y qué papel desempeñan dentro de la estructura de propiedad.

Responde a una única pregunta.

> **¿Quiénes son los propietarios de esta empresa?**

No interpreta.

No analiza.

No recomienda.

Representa exclusivamente la información accionarial disponible.

#### Responsabilidad

Mostrar el detalle de los accionistas de la empresa.

Cada accionista constituye una entidad independiente.

Cada participación representa una relación entre entidades.

El componente nunca modifica dichas relaciones.

#### Filosofía

La propiedad debe entenderse como una red de entidades.

No como una lista de nombres.

Cada accionista constituye un punto de entrada para continuar navegando por el tejido empresarial.

#### Principios

##### Entity First

Todo accionista es una entidad.

Nunca un texto.

##### Relationship Driven

La información relevante es la relación existente entre empresa y accionista.

##### Navigation First

Toda entidad debe poder abrir su propia ficha.

##### Transparency

Solo se representarán participaciones verificadas.

#### Arquitectura funcional

```text
Shareholders

────────────────────────

Shareholder List

↓

Ownership %

↓

Entity Type

↓

Ownership Role

↓

Navigation
```

##### SH-001 Shareholder List

#### Objetivo

Mostrar todos los accionistas conocidos de la empresa.

Cada fila representa una única entidad.

##### SH-002 Ownership %

#### Objetivo

Mostrar el porcentaje de participación correspondiente.

Cuando no exista información suficiente se indicará:

"No disponible"

Nunca se estimará un porcentaje.

##### SH-003 Entity Type

#### Objetivo

Identificar la naturaleza del accionista.

Ejemplos.

- Persona física
- Sociedad
- Holding
- Fondo
- Administración Pública
- Fundación
- Otro

La clasificación pertenece al Ownership Engine.

##### SH-004 Ownership Role

#### Objetivo

Indicar el papel que desempeña la entidad.

Ejemplos.

- Accionista mayoritario
- Accionista minoritario
- Sociedad dominante
- Sociedad participada

##### SH-005 Navigation

#### Objetivo

Permitir abrir la ficha de cualquier entidad relacionada.

La navegación constituye una funcionalidad nativa del componente.

#### Estados

##### Loading

Recuperando accionistas.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existen accionistas identificados.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

Los accionistas aparecerán ordenados por porcentaje de participación cuando dicha información exista.

La representación visual podrá utilizar:

- tabla;
- tarjetas;
- lista enriquecida.

La elección pertenece al Design System.

#### Business Rules

##### BR-5004-001

Todos los accionistas deberán corresponder a entidades normalizadas.

##### BR-5004-002

Los porcentajes nunca serán calculados por el frontend.

##### BR-5004-003

Las entidades relacionadas deberán poder abrir su propia Ficha de Empresa.

##### BR-5004-004

Nunca se ocultarán accionistas por motivos de diseño.

La representación podrá simplificarse.

La información nunca.

##### BR-5004-005

La ausencia de porcentaje constituye un estado válido.

#### Integración Backend

Shareholders consume:

- Ownership Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Ownership Engine

No depende de:

- Governance Engine
- Transaction OS
- Marketplace

#### Casos especiales

##### Accionista único

El componente mostrará una única entidad.

##### Múltiples accionistas

Se representarán todos los accionistas disponibles.

##### Participaciones desconocidas

La entidad aparecerá igualmente indicando que el porcentaje no está disponible.

##### Accionistas sin ficha propia

La navegación permanecerá deshabilitada hasta que exista una entidad normalizada.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente todos los accionistas conocidos;
- muestre el porcentaje de participación cuando exista;
- permita navegar hacia las entidades relacionadas;
- no implemente lógica societaria;
- consuma exclusivamente el Ownership Engine.

#### Relación con otros componentes

Ownership Intelligence

↓

Interpreta la estructura.

Ownership Overview

↓

Resume la propiedad.

Shareholders

↓

Presenta el detalle de los propietarios.

Corporate Group

↓

Presenta las relaciones societarias del grupo.

Connected Intelligence

↓

Explica las implicaciones de la estructura accionarial.

#### Decisiones arquitectónicas

##### DA-5004-001

Todo accionista constituye una entidad navegable.

##### DA-5004-002

La relación entre empresa y accionista constituye una relación del Knowledge Graph de arroba.com.

##### DA-5004-003

Shareholders representa relaciones de propiedad.

Nunca las interpreta.

Fin de COMP-5004.

<a id="85-comp-5005-corporate-group"></a>
### 8.5 COMP-5005 — Corporate Group

---

id: COMP-5005

name: Corporate Group

section: Propiedad

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Corporate Group constituye el componente encargado de representar la posición de una empresa dentro de su estructura societaria.

Su misión consiste en permitir que el usuario comprenda cómo se relaciona la empresa con el resto de entidades del grupo empresarial.

Responde a una única pregunta.

> **¿Dónde se sitúa esta empresa dentro de su grupo?**

No interpreta la estructura.

No determina el control.

No analiza riesgos.

Representa exclusivamente las relaciones societarias existentes.

#### Responsabilidad

Representar la estructura corporativa de la empresa.

Incluye, cuando exista información disponible:

- sociedad matriz;
- sociedades participadas;
- filiales;
- sociedades hermanas;
- sociedades controladas;
- posición dentro del grupo.

Cada entidad constituye un nodo independiente.

Cada participación constituye una relación del grafo empresarial.

#### Filosofía

Las empresas no deben entenderse de forma aislada.

Deben entenderse dentro de la red empresarial a la que pertenecen.

Corporate Group convierte una estructura societaria compleja en una representación fácilmente navegable.

#### Principios

##### Entity First

Todas las compañías se representan mediante entidades.

Nunca mediante texto libre.

##### Graph First

El grupo empresarial constituye un grafo.

Nunca una lista.

##### Navigation First

Cada entidad podrá abrir su propia Ficha de Empresa.

##### Traceability

Toda relación societaria deberá proceder de una fuente verificable.

#### Arquitectura funcional

```text
Corporate Group

────────────────────────

Parent Company

↓

Current Company

↓

Subsidiaries

↓

Sister Companies

↓

Related Companies
```

La profundidad representada dependerá de la información disponible.

##### CG-001 Parent Company

#### Objetivo

Identificar la sociedad dominante inmediata.

Cuando no exista sociedad matriz conocida se indicará expresamente.

##### CG-002 Current Company

#### Objetivo

Representar visualmente la empresa actualmente analizada.

Constituye el nodo central del componente.

##### CG-003 Subsidiaries

#### Objetivo

Mostrar las sociedades controladas por la empresa.

Cada filial constituye una entidad navegable.

##### CG-004 Sister Companies

#### Objetivo

Representar otras sociedades pertenecientes al mismo grupo.

Solo aparecerán cuando exista una relación societaria verificable.

##### CG-005 Related Companies

#### Objetivo

Mostrar otras entidades relevantes del grupo.

Su visualización dependerá de la complejidad de la estructura societaria.

#### Estados

##### Loading

Recuperando estructura del grupo.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Standalone Company

La empresa no pertenece a ningún grupo conocido.

##### Error

No ha sido posible recuperar la estructura societaria.

#### UX Behaviour

Corporate Group utilizará preferentemente una representación gráfica jerárquica.

El usuario podrá:

- centrar la vista en cualquier entidad;
- expandir o contraer ramas del grupo;
- navegar directamente hacia otra empresa.

La representación concreta pertenece al Design System.

#### Business Rules

##### BR-5005-001

Toda entidad deberá corresponder a una entidad normalizada.

##### BR-5005-002

Las relaciones societarias procederán exclusivamente del Ownership Engine.

##### BR-5005-003

El frontend nunca reconstruirá árboles societarios.

##### BR-5005-004

La empresa analizada ocupará siempre la posición central de la visualización.

##### BR-5005-005

La ausencia de grupo constituye un estado válido.

Nunca un error.

#### Integración Backend

Corporate Group consume:

- Ownership Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Ownership Engine

No depende de:

- Governance Engine
- Transaction OS
- Marketplace

#### Casos especiales

##### Empresa independiente

La representación mostrará únicamente la empresa analizada.

##### Grupo complejo

El componente podrá simplificar inicialmente la representación.

El usuario podrá expandir progresivamente las ramas del grupo.

##### Relaciones parciales

Solo se representarán relaciones verificadas.

Nunca se inferirán sociedades inexistentes.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente la estructura del grupo empresarial;
- permita navegar entre entidades relacionadas;
- identifique claramente la posición de la empresa analizada;
- no implemente lógica societaria;
- consuma exclusivamente el Ownership Engine.

#### Relación con otros componentes

Ownership Intelligence

↓

Interpreta la estructura.

Ownership Overview

↓

Resume la propiedad.

Shareholders

↓

Presenta los propietarios directos.

Corporate Group

↓

Representa la estructura completa del grupo empresarial.

Connected Intelligence

↓

Explica las implicaciones de la estructura societaria.

#### Decisiones arquitectónicas

##### DA-5005-001

Corporate Group constituye la representación gráfica oficial de la estructura societaria dentro de la Ficha de Empresa.

##### DA-5005-002

Toda entidad del grupo será navegable cuando exista una Ficha de Empresa asociada.

##### DA-5005-003

La estructura societaria forma parte del Knowledge Graph de arroba.com y se representa mediante relaciones entre entidades.

Fin de COMP-5005.

<a id="86-comp-5006-ownership-network"></a>
### 8.6 COMP-5006 — Ownership Network

---

id: COMP-5006

name: Ownership Network

section: Propiedad

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Ownership Network constituye el componente encargado de representar gráficamente la red completa de relaciones societarias de una empresa.

Su misión consiste en permitir que el usuario comprenda de un vistazo todas las conexiones de propiedad existentes entre la empresa analizada y el resto de entidades relacionadas.

Responde a una única pregunta.

> **¿Cómo se relaciona esta empresa con el resto del ecosistema societario?**

No interpreta dichas relaciones.

No calcula participaciones.

No determina el control efectivo.

Representa exclusivamente las relaciones existentes en el Knowledge Graph.

#### Responsabilidad

Representar el ecosistema societario completo de la empresa.

Incluye, cuando exista información disponible:

- accionistas;
- matriz;
- filiales;
- sociedades hermanas;
- participadas;
- holdings;
- beneficiarios efectivos;
- entidades relacionadas.

Cada nodo representa una entidad.

Cada conexión representa una relación societaria.

#### Filosofía

La propiedad no es una jerarquía.

Es una red.

Comprender esa red permite descubrir relaciones que una estructura tradicional no muestra.

Ownership Network convierte el Knowledge Graph en una herramienta de exploración.

#### Principios

##### Graph Native

Toda la representación utiliza un grafo.

Nunca una lista.

##### Entity First

Cada nodo representa una entidad única.

##### Relationship First

Lo importante son las conexiones.

No únicamente los porcentajes.

##### Progressive Disclosure

El grafo muestra inicialmente únicamente las relaciones principales.

El usuario podrá expandir progresivamente nuevos niveles.

#### Arquitectura funcional

```text
Ownership Network

────────────────────────

Current Company

↓

Direct Shareholders

↓

Corporate Group

↓

Related Companies

↓

Extended Network
```

La profundidad del grafo dependerá de la información disponible.

##### ON-001 Current Company

#### Objetivo

Representar la empresa actualmente analizada.

Constituye el nodo central del grafo.

##### ON-002 Direct Shareholders

#### Objetivo

Representar los propietarios directos.

Cada conexión podrá mostrar:

- porcentaje;
- tipo de participación;
- naturaleza de la relación.

##### ON-003 Corporate Group

#### Objetivo

Mostrar las relaciones societarias pertenecientes al grupo empresarial.

##### ON-004 Related Companies

#### Objetivo

Representar entidades vinculadas por relaciones de propiedad.

##### ON-005 Extended Network

#### Objetivo

Permitir explorar niveles adicionales del grafo.

La expansión será progresiva.

Nunca se cargará la red completa por defecto.

#### Estados

##### Loading

Construyendo el grafo.

##### Ready

Grafo disponible.

##### Partial

Solo existen algunas relaciones.

##### Standalone Company

La empresa no mantiene relaciones societarias conocidas.

##### Error

No ha sido posible construir el grafo.

#### UX Behaviour

Ownership Network utilizará una representación interactiva.

El usuario podrá:

- mover nodos;
- centrar entidades;
- expandir relaciones;
- contraer ramas;
- navegar a cualquier entidad.

El comportamiento visual pertenece al Design System.

#### Business Rules

##### BR-5006-001

Todo nodo corresponde a una entidad normalizada.

##### BR-5006-002

Toda relación procede exclusivamente del Ownership Engine.

##### BR-5006-003

El frontend nunca calculará relaciones societarias.

##### BR-5006-004

La empresa analizada permanecerá siempre como nodo central.

##### BR-5006-005

Las relaciones se cargarán de forma progresiva.

Nunca se descargará el grafo completo por defecto.

#### Integración Backend

Ownership Network consume:

- Ownership Engine
- Knowledge Graph Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Ownership Engine
- Knowledge Graph Engine

No depende de:

- Governance Engine
- Transaction OS
- Marketplace

#### Casos especiales

##### Empresa sin relaciones

El grafo mostrará únicamente la empresa.

##### Red societaria compleja

La representación limitará inicialmente la profundidad para preservar el rendimiento.

##### Relaciones pendientes de verificación

Solo se mostrarán relaciones verificadas.

Nunca relaciones inferidas.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente el grafo societario;
- permita navegar entre entidades;
- mantenga la empresa analizada como nodo central;
- cargue progresivamente las relaciones;
- no implemente lógica societaria;
- consuma exclusivamente Ownership Engine y Knowledge Graph Engine.

#### Relación con otros componentes

Ownership Intelligence

↓

Interpreta.

Ownership Overview

↓

Resume.

Shareholders

↓

Presenta relaciones directas.

Corporate Group

↓

Presenta la estructura jerárquica.

Ownership Network

↓

Representa el ecosistema completo de relaciones.

Connected Intelligence

↓

Explica las implicaciones de la red societaria.

#### Decisiones arquitectónicas

##### DA-5006-001

Ownership Network constituye la representación gráfica del Knowledge Graph societario dentro de la Ficha de Empresa.

##### DA-5006-002

La exploración del grafo será progresiva para garantizar la escalabilidad.

##### DA-5006-003

Todas las relaciones representadas deberán proceder exclusivamente del Knowledge Graph oficial de arroba.com.

Fin de COMP-5006.

<a id="91-comp-6001-governance-section"></a>
### 9.1 COMP-6001 — Governance Section

---

id: COMP-6001

name: Governance Section

section: Gobierno

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Governance Section constituye el módulo de la Ficha de Empresa encargado de representar la estructura de gobierno corporativo de una compañía.

Su misión consiste en permitir que el usuario comprenda quién dirige la empresa, cómo se organiza la toma de decisiones y cuáles son los órganos de gobierno existentes.

Responde a una única pregunta.

> **¿Quién gobierna esta empresa?**

No interpreta.

No evalúa la calidad del gobierno corporativo.

No emite recomendaciones.

Representa exclusivamente la información disponible sobre administración y gobierno.

#### Responsabilidad

Governance Section organiza toda la información relativa al gobierno de la empresa.

Incluye:

- órgano de administración;
- administradores;
- apoderados;
- directivos;
- cargos relevantes;
- representación legal;
- historial de nombramientos (cuando exista).

No interpreta relaciones de poder.

No evalúa riesgos.

Representa información procedente de fuentes oficiales.

#### Filosofía

Propiedad y Gobierno son conceptos distintos.

La propiedad explica quién posee la empresa.

El gobierno explica quién toma las decisiones.

Comprender ambos resulta imprescindible para analizar una compañía.

#### Principios

##### Transparency

Toda la estructura de gobierno deberá ser fácilmente comprensible.

##### Entity First

Todas las personas y organizaciones se representan mediante entidades.

Nunca mediante texto libre.

##### Traceability

Todo cargo deberá poder justificarse mediante una fuente verificable.

##### Temporal Consistency

Toda la información deberá corresponder al período de vigencia indicado.

#### Arquitectura funcional

```text
Governance Section

────────────────────────

Governance Intelligence

↓

Governance Overview

↓

Board Members

↓

Executives

↓

Legal Representatives
```

Cada bloque representa una dimensión distinta del gobierno corporativo.

#### Navegación

Governance Section constituye un único módulo de la Ficha.

La navegación se realiza mediante scroll vertical.

Todos los bloques permanecen sincronizados.

#### Estados

##### Loading

Recuperando información de gobierno.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

Governance Section mantiene el mismo patrón de navegación que el resto de módulos de la Ficha.

Todas las personas y entidades relacionadas podrán abrir su ficha cuando exista.

#### Business Rules

##### BR-6001-001

Toda la información procede exclusivamente de fuentes oficiales integradas en Agency Tool.

##### BR-6001-002

El frontend nunca reconstruirá órganos de gobierno.

##### BR-6001-003

Toda persona representada deberá corresponder a una entidad normalizada cuando sea posible.

##### BR-6001-004

La ausencia de información constituye un estado válido.

Nunca un error funcional.

#### Integración Backend

Governance Section consume:

- Governance Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Governance Engine

No depende de:

- Ownership Engine
- Transaction OS
- Marketplace

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente la estructura de gobierno;
- permita navegar por personas y entidades relacionadas;
- mantenga consistencia con el resto de la Ficha;
- no implemente lógica societaria;
- consuma exclusivamente el Governance Engine.

#### Relación con otros componentes

Ownership Section

↓

Explica quién posee la empresa.

Governance Section

↓

Explica quién la gobierna.

Connected Intelligence

↓

Explica las implicaciones de la estructura de gobierno.

#### Decisiones arquitectónicas

##### DA-6001-001

Governance Section representa exclusivamente la estructura de gobierno.

Nunca interpreta su calidad.

##### DA-6001-002

Toda persona u organización representada constituye una entidad navegable cuando exista una ficha asociada.

##### DA-6001-003

La estructura de gobierno constituye un módulo independiente de la estructura de propiedad.

Fin de COMP-6001.

<a id="92-comp-6002-governance-intelligence"></a>
### 9.2 COMP-6002 — Governance Intelligence

---

id: COMP-6002

name: Governance Intelligence

section: Gobierno

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Governance Intelligence constituye la capa de interpretación del gobierno corporativo de la empresa.

Su misión consiste en explicar cómo está organizada la dirección de la compañía y qué implicaciones tiene dicha estructura para la gestión del negocio.

Responde a una única pregunta.

> **¿Cómo está gobernada esta empresa?**

No interpreta aspectos financieros.

No interpreta la estructura accionarial.

No realiza recomendaciones.

Explica exclusivamente la estructura de gobierno corporativo.

#### Responsabilidad

Traducir la estructura de gobierno en una explicación ejecutiva comprensible.

Su misión consiste en identificar aspectos relevantes relacionados con:

- composición del órgano de administración;
- concentración de cargos;
- estabilidad del equipo directivo;
- estructura de representación;
- organización del gobierno.

Nunca sustituye la información registral.

La complementa.

#### Filosofía

Conocer quién dirige una empresa resulta mucho más útil cuando se comprende cómo está organizada la toma de decisiones.

Governance Intelligence transforma información registral en conocimiento empresarial.

#### Principios

##### Explainability

Toda conclusión deberá estar soportada por datos verificables.

##### Neutrality

El componente interpreta.

Nunca juzga.

Nunca recomienda.

##### Entity Driven

Las conclusiones se generan a partir de personas, cargos y relaciones.

Nunca mediante texto estático.

##### Contextual

Cada empresa posee una estructura de gobierno distinta.

La interpretación dependerá del contexto específico.

#### Arquitectura funcional

```text
Governance Intelligence

────────────────────────

Executive Summary

↓

Governance Insights

↓

Leadership Analysis

↓

Management Structure

↓

Key Findings
```

La estructura podrá adaptarse dinámicamente según la información disponible.

##### GI-001 Executive Summary

#### Objetivo

Responder rápidamente:

> ¿Cómo está organizada la dirección de esta empresa?

Debe proporcionar una visión ejecutiva fácilmente comprensible.

##### GI-002 Governance Insights

#### Objetivo

Identificar los principales aspectos relevantes del gobierno corporativo.

Ejemplos.

- administrador único;
- consejo de administración;
- dirección profesionalizada;
- gestión familiar;
- representación compartida.

##### GI-003 Leadership Analysis

#### Objetivo

Explicar cómo se distribuyen las responsabilidades de dirección.

Podrá destacar:

- concentración de cargos;
- separación entre administración y gestión;
- diversidad de perfiles.

##### GI-004 Management Structure

#### Objetivo

Interpretar la organización de la dirección ejecutiva.

Ejemplos.

- estructura simple;
- estructura matricial;
- equipo ejecutivo consolidado.

##### GI-005 Key Findings

#### Objetivo

Destacar los principales hechos relevantes relacionados con el gobierno corporativo.

Solo incluirá información verificable.

#### Estados

##### Loading

Generando interpretación.

##### Ready

Interpretación disponible.

##### Partial

Información suficiente para generar parte del análisis.

##### Empty

No existe información suficiente.

##### Error

No ha sido posible generar la interpretación.

#### UX Behaviour

Governance Intelligence aparece siempre al inicio de la sección Gobierno.

El usuario comprende primero la organización de la empresa.

Posteriormente accede al detalle de personas y cargos.

#### Business Rules

##### BR-6002-001

Toda interpretación deberá estar respaldada por información verificable.

##### BR-6002-002

Nunca se inferirán relaciones no soportadas por datos oficiales.

##### BR-6002-003

El componente nunca modificará la estructura de gobierno.

##### BR-6002-004

La interpretación se actualizará automáticamente cuando cambie la información registral.

##### BR-6002-005

El componente nunca emitirá recomendaciones sobre la calidad del gobierno.

#### Integración Backend

Governance Intelligence consume:

- Governance Intelligence Engine
- Governance Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente a dichos motores.

#### Dependencias

Depende de:

- Company Entity
- Governance Engine
- Governance Intelligence Engine

No depende de:

- Ownership Engine
- Transaction OS
- Marketplace

#### Casos especiales

##### Administrador único

La interpretación destacará una estructura de gobierno centralizada.

##### Consejo de administración

La interpretación explicará la organización del órgano colegiado.

#### Información parcial

Solo se interpretarán hechos verificables.

Nunca se completará información mediante inferencias.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- explique de forma sencilla la estructura de gobierno;
- identifique los principales elementos organizativos;
- destaque los hallazgos más relevantes;
- nunca modifique información oficial;
- consuma exclusivamente los motores oficiales de Governance Intelligence.

#### Relación con otros componentes

Ownership Intelligence

↓

Interpreta la estructura de propiedad.

Governance Intelligence

↓

Interpreta la estructura de gobierno.

Governance Overview

↓

Resume los órganos de gobierno.

Connected Intelligence

↓

Explica las implicaciones del modelo de gobierno.

#### Decisiones arquitectónicas

##### DA-6002-001

Toda sección de Gobierno comienza por una interpretación ejecutiva.

##### DA-6002-002

Governance Intelligence interpreta la estructura de gobierno.

Nunca modifica ni calcula cargos.

##### DA-6002-003

La interpretación del gobierno constituye una capa independiente y reutilizable dentro de la arquitectura de arroba.com.

Fin de COMP-6002.

<a id="93-comp-6003-governance-overview"></a>
### 9.3 COMP-6003 — Governance Overview

---

id: COMP-6003

name: Governance Overview

section: Gobierno

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Governance Overview constituye el resumen ejecutivo de la estructura de gobierno corporativo de la empresa.

Su misión consiste en ofrecer una visión inmediata de cómo se organiza la dirección de la compañía y quiénes ocupan los principales órganos de decisión.

Responde a una única pregunta.

> **¿Cómo está organizada la dirección de esta empresa?**

No interpreta.

No evalúa la calidad del gobierno.

No analiza riesgos.

Representa exclusivamente la estructura de gobierno consolidada.

La interpretación pertenece a Governance Intelligence.

#### Responsabilidad

Mostrar de forma resumida la organización del gobierno corporativo.

Incluye, cuando exista información disponible:

- tipo de órgano de administración;
- principales cargos;
- representantes legales;
- apoderados;
- fecha del último nombramiento relevante.

No muestra el detalle histórico.

Ese comportamiento pertenece a los componentes específicos de la sección.

#### Filosofía

El usuario debe comprender la organización de la empresa en menos de un minuto.

La información más relevante debe aparecer antes que el detalle registral.

#### Principios

##### Executive First

La organización de la empresa debe comprenderse de un solo vistazo.

##### Entity First

Todos los cargos se representan mediante personas o entidades normalizadas.

Nunca mediante texto libre.

##### Transparency

Toda la información deberá proceder de fuentes verificadas.

##### Consistency

La información resumida deberá coincidir exactamente con el detalle mostrado en el resto de la sección.

#### Arquitectura funcional

```text
Governance Overview

────────────────────────

Governance Model

↓

Main Decision Makers

↓

Executive Structure

↓

Legal Representation

↓

Appointments Summary
```

##### GO-001 Governance Model

#### Objetivo

Identificar el modelo de administración vigente.

Ejemplos.

- Administrador único
- Administradores solidarios
- Administradores mancomunados
- Consejo de administración

La clasificación pertenece al Governance Engine.

##### GO-002 Main Decision Makers

#### Objetivo

Mostrar las principales personas responsables de la dirección de la empresa.

Cada registro podrá incluir:

- nombre;
- cargo;
- fecha de nombramiento;
- estado del cargo.

##### GO-003 Executive Structure

#### Objetivo

Representar la estructura ejecutiva de forma resumida.

Podrá incluir:

- Dirección General;
- Dirección Financiera;
- Dirección Comercial;
- otras direcciones relevantes.

La disponibilidad dependerá de la información existente.

##### GO-004 Legal Representation

#### Objetivo

Identificar quién ostenta la representación legal de la empresa.

Cuando existan varios representantes se indicará el régimen de representación.

##### GO-005 Appointments Summary

#### Objetivo

Mostrar un resumen de los nombramientos vigentes más relevantes.

No sustituye al historial completo.

#### Estados

##### Loading

Recuperando estructura de gobierno.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente.

##### Error

No ha sido posible recuperar la estructura de gobierno.

#### UX Behaviour

Governance Overview aparece inmediatamente después de Governance Intelligence.

Debe poder comprenderse completamente en menos de un minuto.

Constituye la entrada al resto de componentes de Gobierno.

#### Business Rules

##### BR-6003-001

Toda la información procede exclusivamente del Governance Engine.

##### BR-6003-002

El frontend nunca recalculará cargos ni relaciones.

##### BR-6003-003

Toda persona representada deberá corresponder a una entidad normalizada cuando sea posible.

##### BR-6003-004

Governance Overview representa exclusivamente la información más relevante.

Nunca sustituye al detalle completo.

##### BR-6003-005

La ausencia de información constituye un estado válido.

Nunca un error funcional.

#### Integración Backend

Governance Overview consume:

- Governance Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Governance Engine

No depende de:

- Ownership Engine
- Transaction OS
- Marketplace

#### Casos especiales

##### Empresa sin cargos vigentes

El componente mostrará explícitamente que no existe información disponible.

##### Consejo de administración

El componente resumirá la composición del órgano.

El detalle completo pertenecerá al componente Board Members.

#### Información parcial

Solo se representarán cargos verificados.

Nunca se inferirán nombramientos.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- resuma correctamente la estructura de gobierno;
- identifique el modelo de administración;
- represente los principales cargos;
- mantenga consistencia con el resto de la sección;
- no implemente lógica de gobierno;
- consuma exclusivamente el Governance Engine.

#### Relación con otros componentes

Governance Intelligence

↓

Interpreta la estructura.

Governance Overview

↓

Resume el gobierno corporativo.

Board Members

↓

Presenta el detalle del órgano de administración.

Executives

↓

Presenta el equipo directivo.

Connected Intelligence

↓

Explica las implicaciones del modelo de gobierno.

#### Decisiones arquitectónicas

##### DA-6003-001

Governance Overview constituye el resumen ejecutivo del gobierno corporativo.

##### DA-6003-002

La representación visual del gobierno pertenece al Design System.

##### DA-6003-003

Toda la información representada deberá mantenerse sincronizada con el Governance Engine.

Fin de COMP-6003.

<a id="94-comp-6004-board-members"></a>
### 9.4 COMP-6004 — Board Members

---

id: COMP-6004

name: Board Members

section: Gobierno

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Board Members constituye el componente encargado de representar el órgano de administración de la empresa.

Su misión consiste en permitir que el usuario conozca quiénes forman parte del órgano de gobierno y cuál es el papel que desempeña cada uno de sus miembros.

Responde a una única pregunta.

> **¿Quién forma parte del órgano de administración?**

No interpreta.

No evalúa el desempeño.

No analiza la calidad del gobierno.

Representa exclusivamente la composición del órgano de administración.

#### Responsabilidad

Mostrar el detalle completo del órgano de administración vigente.

Incluye, cuando exista información disponible:

- consejeros;
- presidente;
- vicepresidente;
- secretario;
- vocales;
- administrador único;
- administradores solidarios;
- administradores mancomunados.

Cada persona constituye una entidad independiente.

Cada cargo constituye una relación entre una persona y la empresa.

#### Filosofía

El órgano de administración constituye el máximo órgano de decisión de la compañía.

El usuario debe comprender rápidamente quién participa en él y qué responsabilidad ejerce cada miembro.

#### Principios

##### Entity First

Todas las personas se representan como entidades.

Nunca como texto libre.

##### Role First

Lo importante no es únicamente quién forma parte del órgano.

También qué función desempeña.

##### Traceability

Todo nombramiento deberá poder justificarse mediante una fuente verificable.

##### Temporal Consistency

Solo se mostrarán cargos vigentes, salvo que el usuario solicite consultar el histórico.

#### Arquitectura funcional

```text
Board Members

────────────────────────

Board Composition

↓

Member Cards

↓

Roles

↓

Appointment Information

↓

Navigation
```

##### BM-001 Board Composition

#### Objetivo

Mostrar un resumen del órgano de administración.

Ejemplos.

- Consejo de Administración
- Administrador Único
- Administradores Solidarios
- Administradores Mancomunados

##### BM-002 Member Cards

#### Objetivo

Representar cada miembro del órgano mediante una tarjeta individual.

Cada tarjeta podrá incluir:

- nombre;
- fotografía (cuando exista);
- cargo;
- fecha de nombramiento;
- estado del cargo.

##### BM-003 Roles

#### Objetivo

Mostrar el rol desempeñado por cada miembro.

Ejemplos.

- Presidente
- Consejero
- Secretario
- Vocal
- Administrador

##### BM-004 Appointment Information

#### Objetivo

Representar la información registral del nombramiento.

Podrá incluir:

- fecha de nombramiento;
- fecha de vencimiento;
- vigencia;
- régimen de actuación.

##### BM-005 Navigation

#### Objetivo

Permitir acceder a la ficha de cualquier persona cuando exista una entidad asociada.

#### Estados

##### Loading

Recuperando miembros del órgano.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información disponible.

##### Error

No ha sido posible recuperar la composición del órgano.

#### UX Behaviour

Los miembros aparecerán agrupados por función.

Dentro de cada grupo se ordenarán por relevancia institucional.

La representación visual pertenece al Design System.

#### Business Rules

##### BR-6004-001

Todos los miembros procederán exclusivamente del Governance Engine.

##### BR-6004-002

El frontend nunca modificará cargos ni nombramientos.

##### BR-6004-003

Cada persona representada deberá corresponder a una entidad normalizada cuando exista.

##### BR-6004-004

Los cargos deberán corresponder al período de vigencia seleccionado.

##### BR-6004-005

La ausencia de fotografía nunca impedirá representar un miembro.

#### Integración Backend

Board Members consume:

- Governance Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Governance Engine

No depende de:

- Ownership Engine
- Marketplace
- Transaction OS

#### Casos especiales

##### Administrador Único

El componente representará una única persona.

##### Consejo de Administración

Todos los miembros aparecerán organizados por rol.

#### Información parcial

Solo se mostrarán los cargos verificados.

Nunca se inferirán nombramientos.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente el órgano de administración;
- identifique el rol de cada miembro;
- permita navegar hacia las personas relacionadas cuando exista una ficha;
- no implemente lógica de gobierno;
- consuma exclusivamente el Governance Engine.

#### Relación con otros componentes

Governance Intelligence

↓

Interpreta la estructura.

Governance Overview

↓

Resume el gobierno.

Board Members

↓

Presenta el órgano de administración.

Executives

↓

Presenta el equipo directivo.

Connected Intelligence

↓

Explica las implicaciones de la composición del órgano.

#### Decisiones arquitectónicas

##### DA-6004-001

El órgano de administración constituye una colección de entidades y cargos.

Nunca una lista de texto.

##### DA-6004-002

Los cargos se representan como relaciones temporales entre una persona y una empresa.

##### DA-6004-003

Board Members representa exclusivamente la composición vigente del órgano de administración.

El histórico de nombramientos pertenece a un componente específico cuando exista.

Fin de COMP-6004.

<a id="95-comp-6005-executives"></a>
### 9.5 COMP-6005 — Executives

---

id: COMP-6005

name: Executives

section: Gobierno

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Executives constituye el componente encargado de representar el equipo directivo de la empresa.

Su misión consiste en permitir que el usuario comprenda quién dirige la gestión diaria de la compañía y cuáles son sus principales responsabilidades.

Responde a una única pregunta.

> **¿Quién dirige el día a día de esta empresa?**

No representa la propiedad.

No representa el órgano de administración.

No interpreta la organización.

Representa exclusivamente el equipo ejecutivo.

#### Responsabilidad

Mostrar los principales responsables ejecutivos de la empresa.

Incluye, cuando exista información disponible:

- CEO
- Director General
- Director Financiero (CFO)
- Director Comercial (CCO)
- Director de Operaciones (COO)
- Director de Tecnología (CTO)
- Director de Recursos Humanos (CHRO)
- Otros directivos relevantes

Cada directivo constituye una entidad independiente.

Cada cargo representa una relación temporal entre la persona y la empresa.

#### Filosofía

Gobernar y gestionar no son lo mismo.

El órgano de administración define la estrategia.

El equipo ejecutivo la ejecuta.

Comprender ambos niveles resulta esencial para analizar una empresa.

#### Principios

##### Entity First

Todos los directivos se representan mediante entidades.

Nunca mediante texto libre.

##### Role First

La responsabilidad del cargo es tan importante como la persona que lo ocupa.

##### Navigation First

Cada persona deberá poder abrir su propia ficha cuando exista.

##### Temporal Consistency

Solo se mostrarán cargos vigentes.

#### Arquitectura funcional

```text
Executives

────────────────────────

Executive Team

↓

Executive Cards

↓

Responsibilities

↓

Reporting Structure

↓

Navigation
```

##### EX-001 Executive Team

#### Objetivo

Mostrar una visión general del equipo directivo.

Incluye el número de directivos identificados y los principales cargos.

##### EX-002 Executive Cards

#### Objetivo

Representar cada directivo mediante una tarjeta individual.

Cada tarjeta podrá incluir:

- nombre;
- fotografía (cuando exista);
- cargo;
- fecha de nombramiento;
- antigüedad;
- estado del cargo.

##### EX-003 Responsibilities

#### Objetivo

Identificar el ámbito de responsabilidad de cada directivo.

Ejemplos.

- Dirección General
- Finanzas
- Operaciones
- Comercial
- Tecnología
- Marketing
- Personas

##### EX-004 Reporting Structure

#### Objetivo

Representar, cuando exista información suficiente, la estructura jerárquica del equipo ejecutivo.

No constituye un organigrama completo.

Representa únicamente las relaciones ejecutivas principales.

##### EX-005 Navigation

#### Objetivo

Permitir acceder a la ficha de cualquier directivo cuando exista una entidad asociada.

#### Estados

##### Loading

Recuperando equipo directivo.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente sobre el equipo ejecutivo.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

Los directivos aparecerán ordenados por nivel de responsabilidad.

La representación visual podrá utilizar:

- tarjetas;
- lista enriquecida;
- vista jerárquica.

La elección pertenece al Design System.

#### Business Rules

##### BR-6005-001

Todos los directivos proceden exclusivamente del Governance Engine.

##### BR-6005-002

El frontend nunca modificará cargos ejecutivos.

##### BR-6005-003

Cada directivo deberá corresponder a una entidad normalizada cuando exista.

##### BR-6005-004

Solo se representarán cargos vigentes.

##### BR-6005-005

La ausencia de información constituye un estado válido.

#### Integración Backend

Executives consume:

- Governance Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Governance Engine

No depende de:

- Ownership Engine
- Marketplace
- Transaction OS

#### Casos especiales

##### CEO también Administrador

La persona aparecerá tanto en Board Members como en Executives.

No constituye una duplicidad.

Cada componente representa una función distinta.

##### Empresa sin información ejecutiva

El componente mostrará el estado Empty.

#### Información parcial

Solo se representarán los directivos verificados.

Nunca se inferirán cargos.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente el equipo ejecutivo;
- identifique el ámbito de responsabilidad de cada directivo;
- permita navegar hacia las personas relacionadas;
- no implemente lógica organizativa;
- consuma exclusivamente el Governance Engine.

#### Relación con otros componentes

Governance Intelligence

↓

Interpreta la estructura.

Governance Overview

↓

Resume el gobierno.

Board Members

↓

Representa el órgano de administración.

Executives

↓

Representa el equipo ejecutivo.

Connected Intelligence

↓

Explica las implicaciones de la estructura directiva.

#### Decisiones arquitectónicas

##### DA-6005-001

El equipo ejecutivo constituye una capa distinta del órgano de administración.

##### DA-6005-002

Una misma persona podrá aparecer en varios componentes cuando desempeñe funciones diferentes.

##### DA-6005-003

Executives representa exclusivamente la gestión ejecutiva de la empresa.

Nunca la estructura de propiedad ni el órgano societario.

Fin de COMP-6005.

<a id="96-comp-6006-legal-representatives"></a>
### 9.6 COMP-6006 — Legal Representatives

---

id: COMP-6006

name: Legal Representatives

section: Gobierno

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Legal Representatives constituye el componente encargado de representar las personas y entidades con capacidad de representación legal de la empresa.

Su misión consiste en permitir que el usuario comprenda quién puede actuar jurídicamente en nombre de la compañía y bajo qué régimen de representación.

Responde a una única pregunta.

> **¿Quién puede representar legalmente a esta empresa?**

No interpreta.

No analiza riesgos legales.

No evalúa poderes.

Representa exclusivamente la información registral disponible.

#### Responsabilidad

Mostrar todas las personas o entidades con capacidad de representación legal.

Incluye, cuando exista información disponible:

- administradores;
- representantes legales;
- apoderados;
- apoderados solidarios;
- apoderados mancomunados;
- representantes permanentes;
- otros cargos con facultades de representación.

Cada representante constituye una entidad independiente.

Cada representación constituye una relación jurídica entre la empresa y dicha entidad.

#### Filosofía

No todas las personas que dirigen una empresa pueden representarla legalmente.

Y no todos los representantes legales forman parte del equipo directivo.

La representación legal constituye una dimensión propia del gobierno corporativo.

#### Principios

##### Legal Accuracy

Toda representación deberá corresponder exactamente a la información registral.

##### Entity First

Todos los representantes se representan mediante entidades.

Nunca mediante texto libre.

##### Traceability

Toda representación deberá indicar su origen y vigencia.

##### Temporal Consistency

Solo se mostrarán representaciones vigentes, salvo consulta expresa del histórico.

#### Arquitectura funcional

```text
Legal Representatives

────────────────────────

Representatives List

↓

Representation Type

↓

Powers

↓

Validity

↓

Navigation
```

##### LR-001 Representatives List

#### Objetivo

Mostrar todas las personas o entidades con capacidad de representación.

Cada registro representa una relación jurídica independiente.

##### LR-002 Representation Type

#### Objetivo

Identificar el tipo de representación.

Ejemplos.

- Administrador
- Representante Legal
- Apoderado
- Apoderado Solidario
- Apoderado Mancomunado
- Representante Permanente

La clasificación pertenece al Governance Engine.

##### LR-003 Powers

#### Objetivo

Mostrar el régimen de actuación cuando exista información disponible.

Ejemplos.

- Individual
- Solidaria
- Mancomunada
- Conjunta

El componente representa únicamente la modalidad de representación.

Nunca el contenido íntegro de los poderes.

##### LR-004 Validity

#### Objetivo

Representar la vigencia del nombramiento.

Podrá incluir:

- fecha de nombramiento;
- fecha de finalización;
- estado del cargo.

##### LR-005 Navigation

#### Objetivo

Permitir acceder a la ficha de cualquier representante cuando exista una entidad asociada.

#### Estados

##### Loading

Recuperando representantes legales.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existen representantes identificados.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

Los representantes aparecerán agrupados por tipo de representación.

Dentro de cada grupo se ordenarán por relevancia jurídica.

La representación visual pertenece al Design System.

#### Business Rules

##### BR-6006-001

Toda la información procede exclusivamente del Governance Engine.

##### BR-6006-002

El frontend nunca modificará relaciones de representación.

##### BR-6006-003

Cada representante deberá corresponder a una entidad normalizada cuando exista.

##### BR-6006-004

La modalidad de representación deberá respetar exactamente la información registral.

##### BR-6006-005

La ausencia de representantes constituye un estado válido.

#### Integración Backend

Legal Representatives consume:

- Governance Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Governance Engine

No depende de:

- Ownership Engine
- Marketplace
- Transaction OS

#### Casos especiales

##### Un representante con varios poderes

La persona aparecerá una única vez mostrando todas las modalidades de representación asociadas.

##### Representación compartida

El componente indicará expresamente cuando la actuación requiera la intervención conjunta de varias personas.

#### Información parcial

Solo se representarán representantes verificados.

Nunca se inferirán poderes.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente todos los representantes legales;
- identifique el tipo de representación;
- muestre el régimen de actuación cuando exista;
- permita navegar hacia las personas relacionadas;
- no implemente lógica jurídica;
- consuma exclusivamente el Governance Engine.

#### Relación con otros componentes

Governance Intelligence

↓

Interpreta la estructura.

Governance Overview

↓

Resume el gobierno.

Board Members

↓

Representa el órgano de administración.

Executives

↓

Representa la gestión ejecutiva.

Legal Representatives

↓

Representa quién puede actuar jurídicamente en nombre de la empresa.

Connected Intelligence

↓

Explica las implicaciones de la estructura de representación.

#### Decisiones arquitectónicas

##### DA-6006-001

La representación legal constituye una dimensión independiente del gobierno corporativo.

##### DA-6006-002

Una persona podrá aparecer simultáneamente como administrador, directivo y representante legal cuando desempeñe dichas funciones.

##### DA-6006-003

Legal Representatives representa exclusivamente la capacidad jurídica de representación.

Nunca interpreta el alcance de los poderes.

Fin de COMP-6006.

<a id="97-comp-6007-governance-timeline"></a>
### 9.7 COMP-6007 — Governance Timeline

---

id: COMP-6007

name: Governance Timeline

section: Gobierno

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Governance Timeline constituye el componente encargado de representar la evolución temporal del gobierno corporativo de una empresa.

Su misión consiste en permitir que el usuario comprenda cómo ha evolucionado la dirección de la compañía a lo largo del tiempo.

Responde a una única pregunta.

> **¿Cómo ha cambiado el gobierno de esta empresa?**

No interpreta.

No identifica causas.

No evalúa la calidad del gobierno.

Representa exclusivamente los eventos registrados relacionados con los órganos de gobierno.

#### Responsabilidad

Mostrar cronológicamente los principales cambios de gobierno.

Incluye, cuando exista información disponible:

- nombramientos;
- ceses;
- renovaciones;
- cambios de cargo;
- modificaciones del órgano de administración;
- modificaciones en la representación legal.

Cada evento representa un hecho verificable.

Nunca una interpretación.

#### Filosofía

La estructura actual solo representa una fotografía.

La evolución temporal permite comprender la estabilidad y transformación del gobierno corporativo.

#### Principios

##### Timeline First

Toda la información se organiza cronológicamente.

##### Event Driven

Cada elemento representa un evento.

Nunca un estado.

##### Traceability

Todo evento deberá indicar:

- fecha;
- fuente;
- entidad afectada.

##### Explainability

Cada cambio deberá poder justificarse mediante documentación oficial.

#### Arquitectura funcional

```text
Governance Timeline

────────────────────────

Chronological Events

↓

Appointments

↓

Dismissals

↓

Role Changes

↓

Governance Changes
```

##### GT-001 Chronological Events

#### Objetivo

Representar todos los eventos en orden temporal descendente.

El evento más reciente aparecerá primero.

##### GT-002 Appointments

#### Objetivo

Mostrar todos los nombramientos registrados.

Cada evento podrá incluir:

- persona;
- cargo;
- fecha;
- órgano.

##### GT-003 Dismissals

#### Objetivo

Representar los ceses registrados.

El componente nunca interpretará los motivos.

##### GT-004 Role Changes

#### Objetivo

Mostrar cambios de responsabilidad de una misma persona.

Ejemplo.

Consejero

↓

Presidente

##### GT-005 Governance Changes

#### Objetivo

Representar modificaciones relevantes del modelo de gobierno.

Ejemplos.

- Administrador Único → Consejo de Administración
- Consejo → Administradores Solidarios

#### Estados

##### Loading

Recuperando histórico.

##### Ready

Histórico disponible.

##### Partial

Histórico parcialmente disponible.

##### Empty

No existe histórico disponible.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

El Timeline será navegable cronológicamente.

El usuario podrá:

- expandir un evento;
- consultar el detalle;
- acceder a la entidad relacionada;
- consultar la fuente.

#### Business Rules

##### BR-6007-001

Todos los eventos proceden exclusivamente del Governance Engine.

##### BR-6007-002

El Timeline nunca reconstruirá eventos.

##### BR-6007-003

Todos los eventos deberán estar fechados.

##### BR-6007-004

Cada evento deberá mantener un enlace a su fuente oficial.

##### BR-6007-005

La ausencia de histórico constituye un estado válido.

#### Integración Backend

Governance Timeline consume:

- Governance Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Governance Engine

No depende de:

- Ownership Engine
- Marketplace
- Transaction OS

#### Casos especiales

##### Sin histórico

Se mostrará únicamente la estructura vigente.

#### Información parcial

Solo se representarán eventos verificados.

Nunca se inferirán cambios históricos.

##### Cambios múltiples en una misma fecha

Los eventos se agruparán cronológicamente manteniendo su independencia.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente la evolución temporal del gobierno corporativo;
- permita consultar el detalle de cada evento;
- mantenga el orden cronológico;
- no implemente lógica de reconstrucción histórica;
- consuma exclusivamente el Governance Engine.

#### Relación con otros componentes

Governance Intelligence

↓

Interpreta la estructura.

Governance Overview

↓

Representa la situación actual.

Board Members

↓

Representa los miembros vigentes.

Executives

↓

Representa el equipo directivo.

Legal Representatives

↓

Representa la representación jurídica.

Governance Timeline

↓

Representa la evolución histórica del gobierno.

Connected Intelligence

↓

Explica las implicaciones de la evolución del gobierno.

#### Decisiones arquitectónicas

##### DA-6007-001

Governance Timeline representa hechos históricos.

Nunca interpretaciones.

##### DA-6007-002

Cada cambio de gobierno constituye un evento independiente del Knowledge Graph de arroba.com.

##### DA-6007-003

La evolución histórica del gobierno forma parte de la trazabilidad completa de la empresa.

Fin de COMP-6007.

<a id="101-comp-7001-market-section"></a>
### 10.1 COMP-7001 — Market Section

---

id: COMP-7001

name: Market Section

section: Mercado

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Market Section constituye el módulo de la Ficha de Empresa encargado de representar el mercado en el que opera una compañía.

Su misión consiste en proporcionar el contexto competitivo necesario para comprender el entorno de la empresa.

Responde a una única pregunta.

> **¿En qué mercado compite esta empresa?**

No analiza la empresa.

No calcula la valoración.

No interpreta la situación financiera.

Representa el contexto del mercado.

#### Responsabilidad

Market Section organiza toda la información relativa al mercado donde opera la empresa.

Incluye:

- descripción del mercado;
- tamaño;
- crecimiento;
- madurez;
- concentración;
- tendencias;
- riesgos;
- oportunidades;
- posicionamiento.

No analiza competidores individuales.

No sustituye al Market Intelligence Engine.

#### Filosofía

Ninguna empresa puede analizarse de forma aislada.

Debe entenderse siempre dentro del mercado en el que compite.

#### Principios

##### Context First

Antes de analizar la empresa debe comprenderse el mercado.

##### Explainability

Toda afirmación sobre el mercado deberá estar soportada por fuentes verificables.

##### Dynamic

El mercado evoluciona.

La información deberá actualizarse automáticamente.

##### Intelligence First

El usuario debe comprender primero el mercado.

Después analizar la empresa.

#### Arquitectura funcional

```text
Market Section

────────────────────────

Market Intelligence

↓

Market Overview

↓

Market Size

↓

Growth

↓

Competitive Landscape

↓

Trends

↓

Risks & Opportunities
```

#### Navegación

Market Section constituye un único módulo de la Ficha.

La navegación se realiza mediante scroll vertical.

Todos los bloques permanecen sincronizados.

#### Estados

##### Loading

Recuperando información de mercado.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente sobre el mercado.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

Market Section mantiene el mismo patrón de navegación que el resto de módulos de la Ficha.

Cada bloque puede expandirse sin abandonar el contexto de la empresa.

#### Business Rules

##### BR-7001-001

Toda la información procede exclusivamente del Market Intelligence Engine.

##### BR-7001-002

El frontend nunca calculará indicadores de mercado.

##### BR-7001-003

Toda afirmación deberá estar respaldada por fuentes identificables.

##### BR-7001-004

La ausencia de información constituye un estado válido.

#### Integración Backend

Market Section consume:

- Market Intelligence Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Market Intelligence Engine

No depende de:

- Financial Engine
- Ownership Engine
- Governance Engine
- Transaction OS

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente el contexto de mercado;
- mantenga sincronizados todos los bloques del módulo;
- no implemente lógica de mercado;
- consuma exclusivamente el Market Intelligence Engine.

#### Relación con otros componentes

Executive Vista

↓

Resume la empresa.

Market Section

↓

Explica el mercado donde opera.

Comparativa

↓

Compara la empresa frente al mercado.

Connected Intelligence

↓

Explica las implicaciones del contexto competitivo.

#### Decisiones arquitectónicas

##### DA-7001-001

Market Section representa el contexto competitivo de la empresa.

Nunca su rendimiento financiero.

##### DA-7001-002

Todo el módulo consume exclusivamente información procedente del Market Intelligence Engine.

##### DA-7001-003

La información de mercado constituye un contexto común reutilizable por el resto de módulos de la Ficha.

Fin de COMP-7001.

<a id="102-comp-7002-market-intelligence"></a>
### 10.2 COMP-7002 — Market Intelligence

---

id: COMP-7002

name: Market Intelligence

section: Mercado

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Market Intelligence constituye la capa de interpretación del mercado en el que opera la empresa.

Su misión consiste en explicar las características del sector, su evolución y las implicaciones que dicho entorno tiene para la compañía.

Responde a una única pregunta.

> **¿Qué está ocurriendo en el mercado donde opera esta empresa?**

No analiza la empresa.

No analiza competidores individuales.

No calcula indicadores financieros.

Interpreta exclusivamente el mercado.

#### Responsabilidad

Traducir información sectorial compleja en una explicación comprensible.

Su misión consiste en identificar:

- situación del mercado;
- momento del ciclo;
- principales tendencias;
- factores de crecimiento;
- riesgos;
- oportunidades;
- dinámica competitiva.

Nunca sustituye los datos.

Los interpreta.

#### Filosofía

Comprender una empresa exige comprender primero el mercado en el que compite.

Market Intelligence proporciona el contexto necesario para interpretar posteriormente la información financiera y estratégica.

#### Principios

##### Intelligence First

El usuario comprende primero el mercado.

Después analiza la empresa.

##### Explainability

Toda afirmación deberá estar respaldada por información verificable.

##### Contextual

La interpretación dependerá del mercado específico de la empresa.

Nunca existirá un texto genérico.

##### Dynamic

La interpretación evolucionará conforme cambien las condiciones del mercado.

#### Arquitectura funcional

```text
Market Intelligence

────────────────────────

Executive Summary

↓

Market Situation

↓

Growth Drivers

↓

Competitive Dynamics

↓

Risks

↓

Opportunities

↓

Confidence
```

##### MI-001 Executive Summary

#### Objetivo

Responder en menos de un minuto:

> ¿Cómo se encuentra actualmente este mercado?

Debe proporcionar una visión ejecutiva fácilmente comprensible.

##### MI-002 Market Situation

#### Objetivo

Interpretar la situación actual del mercado.

Ejemplos.

- mercado en expansión;
- mercado maduro;
- mercado en consolidación;
- mercado fragmentado;
- mercado altamente concentrado.

##### MI-003 Growth Drivers

#### Objetivo

Explicar qué factores impulsan el crecimiento del mercado.

Ejemplos.

- digitalización;
- regulación;
- internacionalización;
- innovación;
- cambios demográficos.

##### MI-004 Competitive Dynamics

#### Objetivo

Interpretar el nivel de competencia existente.

Podrá destacar aspectos como:

- intensidad competitiva;
- barreras de entrada;
- concentración;
- diferenciación.

##### MI-005 Risks

#### Objetivo

Identificar los principales riesgos del mercado.

Solo se mostrarán riesgos respaldados por datos verificables.

##### MI-006 Opportunities

#### Objetivo

Identificar las principales oportunidades del mercado.

Las oportunidades deberán proceder exclusivamente del Market Intelligence Engine.

##### MI-007 Confidence

#### Objetivo

Representar el nivel de confianza asociado al análisis de mercado.

El cálculo pertenece al backend.

El componente únicamente representa el resultado.

#### Estados

##### Loading

Generando interpretación.

##### Ready

Interpretación disponible.

##### Partial

Información suficiente para generar parte del análisis.

##### Empty

No existe información suficiente sobre el mercado.

##### Error

No ha sido posible generar la interpretación.

#### UX Behaviour

Market Intelligence aparece siempre al inicio de la sección Mercado.

Constituye el punto de entrada del módulo.

El usuario comprende primero el contexto.

Posteriormente accede al detalle del mercado.

#### Business Rules

##### BR-7002-001

Toda interpretación deberá estar soportada por información verificable.

##### BR-7002-002

Nunca se realizarán predicciones no respaldadas por el modelo.

##### BR-7002-003

La interpretación se actualizará automáticamente cuando cambie la información del mercado.

##### BR-7002-004

El componente nunca modificará indicadores de mercado.

##### BR-7002-005

Toda conclusión deberá mantener coherencia con los datos representados en el resto de la sección.

#### Integración Backend

Market Intelligence consume:

- Market Intelligence Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente a dichos motores.

#### Dependencias

Depende de:

- Company Entity
- Market Intelligence Engine

No depende de:

- Financial Engine
- Ownership Engine
- Governance Engine
- Transaction OS

#### Casos especiales

##### Mercado sin información suficiente

El componente mostrará el estado Empty.

##### Mercado en actualización

La interpretación se generará utilizando la última información disponible.

#### Información parcial

Solo se interpretarán hechos verificables.

Nunca se completará información mediante inferencias.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- explique claramente la situación del mercado;
- identifique riesgos y oportunidades;
- interprete la dinámica competitiva;
- represente el nivel de confianza;
- no implemente lógica analítica propia;
- consuma exclusivamente el Market Intelligence Engine.

#### Relación con otros componentes

Executive Snapshot

↓

Resume la empresa.

Market Intelligence

↓

Interpreta el mercado.

Market Overview

↓

Representa los indicadores del mercado.

Connected Intelligence

↓

Explica las implicaciones para la empresa.

#### Decisiones arquitectónicas

##### DA-7002-001

Toda sección de Mercado comienza por una interpretación ejecutiva.

##### DA-7002-002

Market Intelligence interpreta el mercado.

Nunca calcula indicadores.

##### DA-7002-003

La interpretación del mercado constituye una capa independiente y reutilizable dentro de la arquitectura de arroba.com.

Fin de COMP-7002.

<a id="103-comp-7003-market-overview"></a>
### 10.3 COMP-7003 — Market Overview

---

id: COMP-7003

name: Market Overview

section: Mercado

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Market Overview constituye el resumen ejecutivo del mercado donde opera la empresa.

Su misión consiste en ofrecer una visión cuantitativa inmediata del tamaño, evolución y características principales del mercado.

Responde a una única pregunta.

> **¿Cómo es este mercado?**

No interpreta.

No analiza la empresa.

No realiza predicciones.

Representa exclusivamente indicadores estructurados del mercado.

La interpretación pertenece a Market Intelligence.

#### Responsabilidad

Mostrar los principales indicadores del mercado.

Incluye, cuando exista información disponible:

- tamaño del mercado;
- crecimiento anual;
- número de compañías;
- grado de concentración;
- rentabilidad media;
- fragmentación;
- madurez del mercado.

No representa competidores individuales.

No representa rankings.

#### Filosofía

El usuario debe comprender el mercado en menos de un minuto.

La información más relevante debe aparecer antes del análisis detallado.

#### Principios

##### Executive First

Los indicadores clave deberán comprenderse de un vistazo.

##### Data First

Todos los indicadores proceden exclusivamente del Market Intelligence Engine.

Nunca del frontend.

##### Explainability

Todo indicador deberá indicar su fuente y fecha de actualización cuando proceda.

##### Consistency

Todos los indicadores deberán corresponder al mismo ámbito temporal.

#### Arquitectura funcional

```text
Market Overview

────────────────────────

Market Size

↓

Growth

↓

Companies

↓

Concentration

↓

Profitability

↓

Market Maturity
```

##### MO-001 Market Size

#### Objetivo

Mostrar el tamaño estimado del mercado.

Podrá expresarse mediante:

- ingresos;
- volumen económico;
- número de operaciones;
- cualquier otra métrica definida por el Market Intelligence Engine.

##### MO-002 Growth

#### Objetivo

Representar la evolución reciente del mercado.

Ejemplos.

- crecimiento anual;
- CAGR;
- evolución histórica.

##### MO-003 Companies

#### Objetivo

Mostrar el número de compañías identificadas dentro del mercado analizado.

Cuando proceda podrá diferenciar:

- compañías activas;
- compañías analizadas;
- cobertura del dataset.

##### MO-004 Concentration

#### Objetivo

Representar el grado de concentración del mercado.

Ejemplos.

- muy fragmentado;
- fragmentado;
- moderadamente concentrado;
- altamente concentrado.

La clasificación pertenece al Market Intelligence Engine.

##### MO-005 Profitability

#### Objetivo

Mostrar los principales indicadores agregados del mercado.

Ejemplos.

- margen EBITDA mediano;
- margen bruto mediano;
- rentabilidad media;
- productividad.

Los indicadores disponibles dependerán del mercado analizado.

##### MO-006 Market Maturity

#### Objetivo

Representar el estado de desarrollo del mercado.

Ejemplos.

- emergente;
- crecimiento;
- maduro;
- consolidación.

La clasificación pertenece al Market Intelligence Engine.

#### Estados

##### Loading

Recuperando indicadores.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente sobre el mercado.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

Market Overview aparece inmediatamente después de Market Intelligence.

Debe poder comprenderse completamente en menos de un minuto.

Constituye la entrada al análisis cuantitativo del mercado.

#### Business Rules

##### BR-7003-001

Todos los indicadores proceden exclusivamente del Market Intelligence Engine.

##### BR-7003-002

El frontend nunca recalculará métricas de mercado.

##### BR-7003-003

Todos los indicadores deberán corresponder al mismo período temporal.

##### BR-7003-004

Cuando una métrica no esté disponible deberá mostrarse explícitamente.

Nunca se estimará.

##### BR-7003-005

La ausencia de información constituye un estado válido.

Nunca un error funcional.

#### Integración Backend

Market Overview consume:

- Market Intelligence Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Market Intelligence Engine

No depende de:

- Financial Engine
- Ownership Engine
- Governance Engine
- Transaction OS

#### Casos especiales

##### Mercado parcialmente cubierto

El componente mostrará el nivel de cobertura disponible cuando proceda.

##### Información histórica limitada

Solo se representarán períodos con información verificada.

##### Cambio de clasificación sectorial

Los indicadores se recalcularán automáticamente utilizando la nueva clasificación.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente los principales indicadores del mercado;
- mantenga consistencia temporal;
- funcione con información parcial;
- no implemente lógica analítica;
- consuma exclusivamente el Market Intelligence Engine.

#### Relación con otros componentes

Market Intelligence

↓

Interpreta el mercado.

Market Overview

↓

Resume cuantitativamente el mercado.

Rankings

↓

Posiciona la empresa dentro del mercado.

Comparative Analysis

↓

Compara la empresa frente al mercado.

Connected Intelligence

↓

Explica las implicaciones del contexto de mercado.

#### Decisiones arquitectónicas

##### DA-7003-001

Market Overview constituye el resumen cuantitativo oficial del mercado.

##### DA-7003-002

Toda la información procede exclusivamente del Market Intelligence Engine.

##### DA-7003-003

Market Overview representa datos.

Market Intelligence representa conocimiento.

Fin de COMP-7003.

<a id="104-comp-7004-market-size-structure"></a>
### 10.4 COMP-7004 — Market Size & Structure

---

id: COMP-7004

name: Market Size & Structure

section: Mercado

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Market Size & Structure constituye el componente encargado de representar el tamaño y la estructura económica del mercado en el que opera la empresa.

Su misión consiste en ayudar al usuario a comprender la dimensión real del mercado y cómo se distribuye entre sus principales segmentos.

Responde a una única pregunta.

> **¿Cuál es el tamaño y la estructura de este mercado?**

No interpreta.

No realiza predicciones.

No analiza la empresa.

Representa exclusivamente información estructurada del mercado.

#### Responsabilidad

Mostrar la dimensión económica del mercado.

Incluye, cuando exista información disponible:

- tamaño total;
- evolución histórica;
- segmentación;
- distribución;
- concentración;
- peso relativo de cada segmento.

No representa empresas individuales.

No representa rankings.

#### Filosofía

Antes de analizar una empresa es necesario comprender el mercado donde genera su actividad.

El tamaño constituye únicamente una parte del análisis.

La estructura explica cómo se distribuye dicho mercado.

#### Principios

##### Structure First

No basta con conocer el tamaño.

Debe comprenderse cómo está organizado.

##### Explainability

Toda cifra deberá indicar:

- fuente;
- fecha;
- cobertura.

##### Comparable

Todas las métricas deberán utilizar la misma unidad de medida.

##### Dynamic

El componente reflejará automáticamente las actualizaciones del Market Intelligence Engine.

#### Arquitectura funcional

```text
Market Size & Structure

────────────────────────

Total Market Size

↓

Historical Evolution

↓

Market Segments

↓

Segment Distribution

↓

Market Concentration
```

##### MSS-001 Total Market Size

#### Objetivo

Representar el tamaño total del mercado.

Podrá expresarse mediante:

- facturación;
- número de empresas;
- volumen económico;
- otras métricas oficiales.

##### MSS-002 Historical Evolution

#### Objetivo

Mostrar la evolución histórica del tamaño del mercado.

El período dependerá de la información disponible.

##### MSS-003 Market Segments

#### Objetivo

Representar los principales segmentos que componen el mercado.

Cada segmento podrá mostrar:

- nombre;
- dimensión;
- participación;
- evolución.

##### MSS-004 Segment Distribution

#### Objetivo

Representar visualmente el peso relativo de cada segmento.

Podrá utilizar:

- barras;
- donut;
- treemap;
- stacked bars.

La representación pertenece al Design System.

##### MSS-005 Market Concentration

#### Objetivo

Mostrar cómo se distribuye el mercado entre los principales operadores.

Ejemplos.

- muy fragmentado;
- fragmentado;
- concentrado;
- muy concentrado.

La clasificación pertenece al Market Intelligence Engine.

#### Estados

##### Loading

Recuperando tamaño del mercado.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

El componente aparece inmediatamente después de Market Overview.

Debe permitir comprender el tamaño del mercado en menos de un minuto.

Toda representación gráfica será interactiva cuando proceda.

#### Business Rules

##### BR-7004-001

Toda la información procede exclusivamente del Market Intelligence Engine.

##### BR-7004-002

El frontend nunca recalculará métricas de mercado.

##### BR-7004-003

Todas las visualizaciones deberán utilizar exactamente los mismos datos.

##### BR-7004-004

Las cifras deberán mantenerse sincronizadas con el período temporal activo.

##### BR-7004-005

Cuando exista información parcial se mostrará explícitamente el nivel de cobertura.

#### Integración Backend

Market Size & Structure consume:

- Market Intelligence Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Market Intelligence Engine

No depende de:

- Financial Engine
- Governance Engine
- Ownership Engine
- Transaction OS

#### Casos especiales

##### Mercado sin segmentación

El componente mostrará únicamente el tamaño agregado.

##### Segmentación parcial

Solo se representarán segmentos verificados.

##### Cambio de clasificación sectorial

La segmentación se actualizará automáticamente.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente el tamaño del mercado;
- muestre la distribución por segmentos cuando exista;
- mantenga consistencia temporal;
- no implemente lógica analítica;
- consuma exclusivamente el Market Intelligence Engine.

#### Relación con otros componentes

Market Intelligence

↓

Interpreta el mercado.

Market Overview

↓

Resume los indicadores.

Market Size & Structure

↓

Explica la dimensión y composición del mercado.

Rankings

↓

Posiciona la empresa dentro del mercado.

Connected Intelligence

↓

Explica las implicaciones de la estructura del mercado.

#### Decisiones arquitectónicas

##### DA-7004-001

Market Size & Structure constituye la representación oficial del tamaño y composición del mercado.

##### DA-7004-002

La segmentación del mercado pertenece al Market Intelligence Engine.

Nunca al frontend.

##### DA-7004-003

Toda representación deberá mantenerse consistente con el resto del análisis de mercado.

Fin de COMP-7004.

<a id="105-comp-7005-market-trends"></a>
### 10.5 COMP-7005 — Market Trends

---

id: COMP-7005

name: Market Trends

section: Mercado

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Market Trends constituye el componente encargado de representar las principales tendencias que están transformando el mercado donde opera la empresa.

Su misión consiste en ayudar al usuario a comprender qué fuerzas están impulsando la evolución del sector y cómo pueden afectar a la empresa.

Responde a una única pregunta.

> **¿Qué tendencias están transformando este mercado?**

No interpreta el impacto sobre la empresa.

No realiza predicciones financieras.

No recomienda estrategias.

Representa exclusivamente las tendencias identificadas por el Market Intelligence Engine.

#### Responsabilidad

Mostrar las principales tendencias estructurales del mercado.

Incluye, cuando exista información disponible:

- digitalización;
- consolidación;
- internacionalización;
- regulación;
- inteligencia artificial;
- sostenibilidad;
- innovación;
- cambios en la demanda;
- cambios tecnológicos.

No analiza empresas concretas.

No representa oportunidades individuales.

#### Filosofía

Los mercados evolucionan continuamente.

Comprender esas transformaciones permite interpretar mejor la situación actual de cualquier empresa.

#### Principios

##### Dynamic

Las tendencias evolucionan constantemente.

El componente deberá actualizarse automáticamente.

##### Explainability

Toda tendencia deberá estar soportada por información verificable.

##### Contextual

Las tendencias dependerán del mercado específico de la empresa.

Nunca existirán tendencias genéricas.

##### Neutral

El componente representa tendencias.

No las juzga.

#### Arquitectura funcional

```text
Market Trends

────────────────────────

Trend Cards

↓

Trend Description

↓

Impact Level

↓

Time Horizon

↓

Confidence
```

##### MT-001 Trend Cards

#### Objetivo

Representar cada tendencia mediante una tarjeta independiente.

Cada tendencia constituye una unidad de análisis.

##### MT-002 Trend Description

#### Objetivo

Explicar de forma resumida la naturaleza de la tendencia.

La descripción deberá ser comprensible para un usuario no especializado.

##### MT-003 Impact Level

#### Objetivo

Representar la intensidad estimada de la tendencia sobre el mercado.

Ejemplos.

- Muy Alto
- Alto
- Medio
- Bajo

La clasificación pertenece al Market Intelligence Engine.

##### MT-004 Time Horizon

#### Objetivo

Representar el horizonte temporal esperado de la tendencia.

Ejemplos.

- Corto plazo
- Medio plazo
- Largo plazo

##### MT-005 Confidence

#### Objetivo

Mostrar el nivel de confianza asociado a cada tendencia.

El cálculo pertenece exclusivamente al Market Intelligence Engine.

#### Estados

##### Loading

Recuperando tendencias.

##### Ready

Información disponible.

##### Partial

Solo existen algunas tendencias identificadas.

##### Empty

No existen tendencias disponibles.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

Las tendencias aparecerán ordenadas por relevancia.

El usuario podrá expandir cada tendencia para consultar información adicional.

La representación visual pertenece al Design System.

#### Business Rules

##### BR-7005-001

Todas las tendencias proceden exclusivamente del Market Intelligence Engine.

##### BR-7005-002

El frontend nunca clasificará tendencias.

##### BR-7005-003

Toda tendencia deberá indicar su nivel de impacto.

##### BR-7005-004

Las tendencias deberán mantenerse sincronizadas con el mercado activo.

##### BR-7005-005

La ausencia de tendencias constituye un estado válido.

#### Integración Backend

Market Trends consume:

- Market Intelligence Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Market Intelligence Engine

No depende de:

- Financial Engine
- Ownership Engine
- Governance Engine
- Transaction OS

#### Casos especiales

##### Tendencias emergentes

Se representarán como tendencias con bajo nivel de confianza cuando así lo determine el motor.

##### Tendencias finalizadas

No aparecerán salvo que formen parte de un análisis histórico.

#### Información parcial

Solo se representarán tendencias verificadas.

Nunca se generarán tendencias mediante el frontend.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente las principales tendencias del mercado;
- identifique su impacto y horizonte temporal;
- mantenga consistencia con el resto del análisis de mercado;
- no implemente lógica analítica;
- consuma exclusivamente el Market Intelligence Engine.

#### Relación con otros componentes

Market Intelligence

↓

Interpreta el mercado.

Market Overview

↓

Resume el mercado.

Market Size & Structure

↓

Explica la estructura del mercado.

Market Trends

↓

Explica cómo está evolucionando el mercado.

Connected Intelligence

↓

Explica las implicaciones de dichas tendencias para la empresa.

#### Decisiones arquitectónicas

##### DA-7005-001

Market Trends representa tendencias estructurales del mercado.

Nunca representa acontecimientos puntuales.

##### DA-7005-002

Toda tendencia deberá estar respaldada por información verificable y actualizable.

##### DA-7005-003

La interpretación de las tendencias pertenece a Market Intelligence.

Market Trends representa exclusivamente la información estructurada.

Fin de COMP-7005.

<a id="106-comp-7006-market-positioning"></a>
### 10.6 COMP-7006 — Market Positioning

---

id: COMP-7006

name: Market Positioning

section: Mercado

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Market Positioning constituye el componente encargado de representar la posición competitiva de la empresa dentro de su mercado.

Su misión consiste en ayudar al usuario a comprender dónde se sitúa la compañía respecto al resto de empresas del sector.

Responde a una única pregunta.

> **¿Qué posición ocupa esta empresa dentro de su mercado?**

No interpreta.

No realiza recomendaciones.

No calcula rankings.

Representa exclusivamente el posicionamiento calculado por el Market Intelligence Engine.

#### Responsabilidad

Mostrar la posición competitiva de la empresa dentro del mercado.

Incluye, cuando exista información disponible:

- posición relativa;
- percentil;
- tamaño relativo;
- liderazgo;
- cuota de mercado estimada (cuando exista);
- posicionamiento competitivo;
- distancia respecto a la mediana sectorial.

No sustituye al módulo de Rankings.

No sustituye al módulo Comparativa.

#### Filosofía

El tamaño absoluto de una empresa aporta poco contexto.

Su posición relativa dentro del mercado permite comprender realmente su relevancia competitiva.

#### Principios

##### Relative Context

Toda empresa debe analizarse respecto a su mercado.

Nunca de forma aislada.

##### Explainability

Todo indicador deberá poder justificarse mediante datos verificables.

##### Dynamic

La posición deberá actualizarse automáticamente cuando cambie el mercado.

##### Neutral

El componente representa una posición.

Nunca emite un juicio.

#### Arquitectura funcional

```text
Market Positioning

────────────────────────

Position Summary

↓

Percentile

↓

Relative Size

↓

Competitive Tier

↓

Market Distance
```

##### MP-001 Position Summary

#### Objetivo

Mostrar una visión ejecutiva del posicionamiento competitivo.

Ejemplo.

Empresa situada entre el 10% de mayor tamaño del sector.

##### MP-002 Percentile

#### Objetivo

Representar el percentil ocupado por la empresa.

El cálculo pertenece exclusivamente al Market Intelligence Engine.

##### MP-003 Relative Size

#### Objetivo

Mostrar el tamaño relativo de la empresa respecto al mercado.

Ejemplos.

- Muy pequeña
- Pequeña
- Media
- Grande
- Muy grande

La clasificación pertenece al backend.

##### MP-004 Competitive Tier

#### Objetivo

Representar el nivel competitivo de la empresa.

Ejemplos.

- Líder
- Challenger
- Especialista
- Nicho
- Emergente

La clasificación pertenece al Market Intelligence Engine.

##### MP-005 Market Distance

#### Objetivo

Representar la distancia de la empresa respecto a la mediana del mercado.

Podrá expresarse mediante:

- ingresos;
- EBITDA;
- empleados;
- otros indicadores definidos por el backend.

#### Estados

##### Loading

Calculando posicionamiento.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente.

##### Error

No ha sido posible calcular el posicionamiento.

#### UX Behaviour

Market Positioning aparece después de Market Trends.

Debe permitir comprender la posición competitiva de la empresa en menos de un minuto.

Toda representación gráfica pertenece al Design System.

#### Business Rules

##### BR-7006-001

Todo el posicionamiento procede exclusivamente del Market Intelligence Engine.

##### BR-7006-002

El frontend nunca calculará percentiles.

##### BR-7006-003

Toda clasificación competitiva deberá proceder del backend.

##### BR-7006-004

La posición deberá actualizarse automáticamente cuando cambie el mercado de referencia.

##### BR-7006-005

La ausencia de posicionamiento constituye un estado válido.

#### Integración Backend

Market Positioning consume:

- Market Intelligence Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Market Intelligence Engine

No depende de:

- Rankings Engine
- Comparative Engine
- Transaction OS

#### Casos especiales

##### Mercado con cobertura parcial

El componente mostrará el nivel de cobertura utilizado para calcular el posicionamiento.

##### Empresa fuera del universo principal

El componente indicará expresamente que el posicionamiento es parcial.

##### Cambio de clasificación sectorial

El posicionamiento se recalculará automáticamente.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente la posición competitiva de la empresa;
- identifique el percentil correspondiente;
- muestre el tamaño relativo;
- mantenga consistencia con el resto del análisis de mercado;
- no implemente lógica analítica;
- consuma exclusivamente el Market Intelligence Engine.

#### Relación con otros componentes

Market Intelligence

↓

Interpreta el mercado.

Market Overview

↓

Resume el mercado.

Market Size & Structure

↓

Explica la dimensión del mercado.

Market Trends

↓

Explica la evolución.

Market Positioning

↓

Sitúa la empresa dentro del mercado.

Rankings

↓

Permite comparar la empresa con el resto del universo.

Connected Intelligence

↓

Explica las implicaciones del posicionamiento competitivo.

#### Decisiones arquitectónicas

##### DA-7006-001

Market Positioning representa la posición relativa de la empresa.

Nunca realiza comparaciones individuales.

##### DA-7006-002

Toda la lógica de posicionamiento pertenece al Market Intelligence Engine.

##### DA-7006-003

El posicionamiento constituye el puente entre el análisis del mercado y el módulo de Rankings.

Fin de COMP-7006.

<a id="107-comp-7007-market-risks-opportunities"></a>
### 10.7 COMP-7007 — Market Risks & Opportunities

---

id: COMP-7007

name: Market Risks & Opportunities

section: Mercado

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Market Risks & Opportunities constituye el componente encargado de representar los principales riesgos y oportunidades existentes en el mercado donde opera la empresa.

Su misión consiste en ayudar al usuario a comprender qué factores externos pueden favorecer o limitar el desarrollo futuro del negocio.

Responde a una única pregunta.

> **¿Qué factores del mercado favorecen o amenazan a esta empresa?**

No analiza riesgos internos.

No analiza riesgos financieros.

No interpreta la empresa.

Representa exclusivamente riesgos y oportunidades derivados del mercado.

#### Responsabilidad

Mostrar los principales factores externos que afectan al mercado.

Incluye, cuando exista información disponible:

- riesgos estructurales;
- riesgos regulatorios;
- riesgos tecnológicos;
- riesgos competitivos;
- oportunidades de crecimiento;
- oportunidades de consolidación;
- oportunidades derivadas de tendencias sectoriales.

No representa riesgos específicos de la empresa.

#### Filosofía

El mercado genera continuamente amenazas y oportunidades.

Comprenderlas permite interpretar mejor el potencial de una empresa.

#### Principios

##### Opportunity & Risk Together

Toda oportunidad debe analizarse junto con los riesgos existentes.

##### Explainability

Todo riesgo u oportunidad deberá estar respaldado por información verificable.

##### Dynamic

El componente evolucionará conforme cambie el mercado.

##### Neutral

El componente representa hechos.

Nunca recomienda estrategias.

#### Arquitectura funcional

```text
Market Risks & Opportunities

────────────────────────

Executive Summary

↓

Key Opportunities

↓

Key Risks

↓

Market Drivers

↓

Confidence
```

##### MRO-001 Executive Summary

#### Objetivo

Proporcionar una visión ejecutiva del equilibrio entre riesgos y oportunidades del mercado.

Debe responder en menos de un minuto:

- ¿Es un mercado atractivo?
- ¿Se encuentra en expansión?
- ¿Presenta riesgos relevantes?

##### MRO-002 Key Opportunities

#### Objetivo

Representar las principales oportunidades identificadas.

Ejemplos.

- consolidación sectorial;
- crecimiento internacional;
- digitalización;
- inteligencia artificial;
- nuevas regulaciones favorables;
- incremento de demanda.

Cada oportunidad incluirá:

- descripción;
- impacto;
- horizonte temporal.

##### MRO-003 Key Risks

#### Objetivo

Representar los principales riesgos del mercado.

Ejemplos.

- presión competitiva;
- cambios regulatorios;
- concentración de clientes;
- disrupción tecnológica;
- reducción de márgenes.

Cada riesgo incluirá:

- descripción;
- impacto;
- horizonte temporal.

##### MRO-004 Market Drivers

#### Objetivo

Mostrar los factores que impulsan o limitan la evolución del mercado.

Ejemplos.

- innovación;
- inflación;
- demografía;
- consumo;
- inversión;
- financiación.

##### MRO-005 Confidence

#### Objetivo

Representar el nivel de confianza asociado al análisis.

El cálculo pertenece exclusivamente al Market Intelligence Engine.

#### Estados

##### Loading

Generando análisis.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente.

##### Error

No ha sido posible recuperar el análisis.

#### UX Behaviour

Las oportunidades aparecerán siempre antes que los riesgos.

Dentro de cada bloque los elementos se ordenarán por impacto.

Cada elemento podrá expandirse para consultar mayor detalle.

#### Business Rules

##### BR-7007-001

Toda la información procede exclusivamente del Market Intelligence Engine.

##### BR-7007-002

Nunca se generarán riesgos mediante reglas del frontend.

##### BR-7007-003

Toda oportunidad deberá disponer de soporte documental.

##### BR-7007-004

El análisis se actualizará automáticamente cuando cambie el mercado.

##### BR-7007-005

La ausencia de riesgos u oportunidades constituye un estado válido.

#### Integración Backend

Market Risks & Opportunities consume:

- Market Intelligence Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Market Intelligence Engine

No depende de:

- Financial Engine
- Ownership Engine
- Governance Engine
- Transaction OS

#### Casos especiales

##### Mercado estable

El componente podrá mostrar un número reducido de riesgos y oportunidades.

##### Mercado altamente dinámico

El componente priorizará los elementos con mayor impacto esperado.

#### Información parcial

Solo se representarán riesgos y oportunidades verificadas.

Nunca se inferirán automáticamente.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente los principales riesgos del mercado;
- represente correctamente las principales oportunidades;
- identifique los drivers del mercado;
- mantenga consistencia con el resto del análisis de mercado;
- no implemente lógica analítica;
- consuma exclusivamente el Market Intelligence Engine.

#### Relación con otros componentes

Market Intelligence

↓

Interpreta el mercado.

Market Overview

↓

Resume el mercado.

Market Size & Structure

↓

Explica la dimensión.

Market Trends

↓

Explica la evolución.

Market Positioning

↓

Sitúa la empresa.

Market Risks & Opportunities

↓

Resume las amenazas y oportunidades del entorno competitivo.

Connected Intelligence

↓

Explica cómo el contexto de mercado puede afectar a la empresa.

#### Decisiones arquitectónicas

##### DA-7007-001

Los riesgos y oportunidades pertenecen al mercado.

No a la empresa.

##### DA-7007-002

Toda la lógica pertenece al Market Intelligence Engine.

##### DA-7007-003

Market Risks & Opportunities constituye el cierre analítico de la sección Mercado antes de pasar al siguiente módulo de la Ficha.

Fin de COMP-7007.

<a id="111-comp-8001-rankings-section"></a>
### 11.1 COMP-8001 — Rankings Section

---

id: COMP-8001

name: Rankings Section

section: Rankings

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Rankings Section constituye el módulo de la Ficha de Empresa encargado de posicionar la empresa dentro de su universo comparable.

Su misión consiste en mostrar, de forma objetiva y cuantificable, la posición relativa de la empresa frente al resto del mercado.

Responde a una única pregunta.

> **¿Dónde se sitúa esta empresa respecto a las demás?**

No interpreta.

No recomienda.

No explica las diferencias.

Representa exclusivamente rankings calculados por el Ranking Engine.

#### Responsabilidad

Mostrar la posición relativa de la empresa utilizando distintos criterios.

Incluye, cuando exista información disponible:

- ranking nacional;
- ranking sectorial;
- ranking provincial;
- ranking autonómico;
- ranking por tamaño;
- ranking por crecimiento;
- ranking por rentabilidad;
- ranking por valoración;
- ranking ESG (cuando exista).

No realiza comparaciones empresa contra empresa.

Ese comportamiento pertenece a Comparativa.

#### Filosofía

El tamaño absoluto aporta poco contexto.

La posición relativa permite comprender inmediatamente la relevancia competitiva de una empresa.

#### Principios

##### Relative Position

Toda posición se calcula respecto a un universo.

Nunca de forma absoluta.

##### Explainability

Todo ranking deberá indicar:

- universo utilizado;
- criterio;
- fecha de actualización.

##### Dynamic

La posición se actualizará automáticamente.

##### Consistency

Todos los rankings utilizarán exactamente el mismo universo de referencia.

#### Arquitectura funcional

```text
Rankings Section

────────────────────────

Ranking Intelligence

↓

Executive Ranking

↓

Financial Rankings

↓

Growth Rankings

↓

Profitability Rankings

↓

Specialized Rankings
```

#### Navegación

Rankings constituye una sección independiente de la Ficha.

Todos los rankings pertenecen al mismo universo de comparación.

#### Estados

##### Loading

Calculando rankings.

##### Ready

Rankings disponibles.

##### Partial

Solo algunos rankings disponibles.

##### Empty

No existe información suficiente.

##### Error

No ha sido posible calcular los rankings.

#### UX Behaviour

La navegación mantiene el mismo patrón que el resto de módulos.

Cada ranking podrá expandirse para consultar información adicional.

#### Business Rules

##### BR-8001-001

Todos los rankings proceden exclusivamente del Ranking Engine.

##### BR-8001-002

El frontend nunca calculará posiciones.

##### BR-8001-003

Todos los rankings deberán indicar el universo utilizado.

##### BR-8001-004

La ausencia de un ranking constituye un estado válido.

#### Integración Backend

Rankings Section consume:

- Ranking Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Ranking Engine

No depende de:

- Market Intelligence Engine
- Comparative Engine
- Transaction OS

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente la posición relativa de la empresa;
- mantenga consistencia entre rankings;
- no implemente lógica de cálculo;
- consuma exclusivamente el Ranking Engine.

#### Relación con otros componentes

Market Positioning

↓

Sitúa la empresa en el mercado.

Rankings

↓

Calcula su posición objetiva.

Comparative Analysis

↓

Permite compararla con empresas concretas.

Connected Intelligence

↓

Explica qué implica esa posición.

#### Decisiones arquitectónicas

##### DA-8001-001

Rankings representa posiciones.

Nunca comparaciones.

##### DA-8001-002

Toda la lógica pertenece al Ranking Engine.

##### DA-8001-003

Los rankings constituyen una sección independiente dentro de la Ficha de Empresa.

Fin de COMP-8001.

<a id="112-comp-8002-ranking-cards"></a>
### 11.2 COMP-8002 — Ranking Cards

---

id: COMP-8002

name: Ranking Cards

section: Rankings

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Ranking Cards constituye el componente encargado de representar la posición relativa de la empresa en distintos ámbitos de comparación.

Su misión consiste en permitir al usuario comprender rápidamente cómo se posiciona la empresa respecto a diferentes universos de referencia.

Responde a una única pregunta.

> ¿Cómo se posiciona esta empresa?

#### Responsabilidad

Cada tarjeta representa un ranking independiente.

Ejemplos.

- Mercado
- Sector
- Localidad
- Nivel de Innovación

La incorporación de nuevos rankings no requiere modificar el componente.

Cada ranking constituye una instancia del mismo componente.

#### Filosofía

Todos los rankings deben representarse exactamente igual.

Solo cambia:

- universo;
- métrica;
- posición;
- descripción.

Nunca cambia la interacción.

##### Arquitectura

```text
Ranking Card

──────────────────────

Título

↓

Indicador visual

↓

Resultado

↓

Descripción

↓

Acción
```

##### RC-001 Título

Nombre del ranking.

Ejemplos.

- Mercado
- Sector
- Localidad
- Nivel de Innovación

##### RC-002 Indicador

Representación gráfica de la posición.

El componente utilizará el indicador oficial del Design System.

Nunca implementará lógica de cálculo.

##### RC-003 Resultado

Representa el resultado principal.

Ejemplos.

- #3 de 47
- P88
- #1 de 6
- Alto

El formato dependerá del tipo de ranking.

##### RC-004 Descripción

Explica el universo utilizado.

Ejemplos.

- Hoteles termales · España
- CNAE 5510
- Olmedo (Valladolid)

##### RC-005 Acción

Cada tarjeta incorpora una única acción.

**Ver Top 10**

La acción abre el detalle completo del ranking correspondiente.

#### Estados

##### Loading

Calculando ranking.

##### Ready

Ranking disponible.

##### Empty

No existe información.

##### Error

No ha sido posible recuperar el ranking.

#### UX Behaviour

Todas las tarjetas mantienen:

- mismo tamaño;
- misma estructura;
- mismo comportamiento.

Únicamente cambia el contenido.

#### Business Rules

##### BR-8002-001

Todas las tarjetas utilizan exactamente el mismo componente.

##### BR-8002-002

El frontend nunca calcula posiciones.

##### BR-8002-003

Cada tarjeta representa un único universo de comparación.

##### BR-8002-004

La acción "Ver Top 10" deberá abrir el ranking correspondiente manteniendo el contexto de la empresa.

#### Integración Backend

Consume:

- Ranking Engine

Toda la lógica pertenece exclusivamente al backend.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente cualquier tipo de ranking utilizando la misma estructura;
- permita acceder al Top 10 correspondiente;
- mantenga un comportamiento homogéneo para todos los rankings;
- no implemente lógica de cálculo;
- consuma exclusivamente el Ranking Engine.

#### Decisiones arquitectónicas

##### DA-8002-001

Todos los rankings de la Ficha de Empresa utilizan un único componente reutilizable.

##### DA-8002-002

Los nuevos rankings se incorporarán mediante configuración.

Nunca mediante nuevos componentes.

Fin de COMP-8002.

<a id="121-comp-9001-comparison-universe"></a>
### 12.1 COMP-9001 — Comparison Universe

---

id: COMP-9001

name: Comparison Universe

section: Comparativa

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Comparison Universe constituye el componente encargado de definir el universo de comparación sobre el que se construye todo el análisis comparativo de la empresa.

Su misión consiste en permitir al usuario comprender inmediatamente contra qué empresas está siendo comparada la compañía y modificar dicho universo cuando lo considere necesario.

Responde a una única pregunta.

> **¿Con quién estoy comparando esta empresa?**

No realiza comparaciones.

No calcula indicadores.

No interpreta resultados.

Define exclusivamente el universo utilizado por todos los componentes de Comparativa.

#### Responsabilidad

Representar el conjunto de empresas que constituye el benchmark de referencia.

Incluye:

- número de comparables;
- criterios utilizados para construir el universo;
- origen del universo;
- acción para modificarlo.

Todo el resto del módulo Comparativa depende de este componente.

#### Filosofía

Una comparación solo tiene valor si el universo de referencia es correcto.

Antes de analizar resultados, el usuario debe comprender contra quién se está comparando la empresa.

#### Principios

##### Benchmark First

Toda comparación parte de un universo de referencia.

Nunca de una empresa aislada.

##### Transparency

El usuario debe conocer exactamente cómo se ha construido el universo.

##### Editable

El universo podrá modificarse cuando el usuario disponga de permisos.

Toda modificación afectará automáticamente al resto del módulo Comparativa.

##### Explainability

El sistema deberá explicar por qué cada empresa pertenece al universo seleccionado.

#### Arquitectura funcional

```text
Comparison Universe

────────────────────────

Universe Summary

↓

Universe Criteria

↓

Universe Size

↓

Modify Universe
```

##### CU-001 Universe Summary

#### Objetivo

Mostrar un resumen ejecutivo del universo de comparación.

Ejemplo.

> Universo de comparación: 5 empresas.

##### CU-002 Universe Criteria

#### Objetivo

Explicar los criterios utilizados para construir el universo.

Podrán incluir:

- sector;
- CNAE;
- actividad;
- localización;
- tamaño;
- modelo de negocio;
- inteligencia de Arroba.

La descripción será generada automáticamente por el Comparison Engine.

##### CU-003 Universe Size

#### Objetivo

Mostrar el número de empresas que forman parte del benchmark.

El componente nunca mostrará el listado completo.

Ese comportamiento pertenece al componente de Empresas Comparables.

##### CU-004 Modify Universe

#### Objetivo

Permitir modificar el universo de comparación.

La acción abrirá el selector de empresas comparables.

Las modificaciones se aplicarán inmediatamente al resto de componentes de Comparativa.

#### Estados

##### Loading

Construyendo universo.

##### Ready

Universo disponible.

##### Partial

Universo parcialmente disponible.

##### Empty

No existe un universo de comparación definido.

##### Error

No ha sido posible construir el universo.

#### UX Behaviour

El componente aparece siempre al inicio de la sección Comparativa.

Constituye el punto de partida obligatorio del análisis.

Cuando el usuario modifica el universo:

- se recalculan automáticamente todos los indicadores comparativos;
- se actualizan los percentiles;
- se actualizan fortalezas, debilidades y oportunidades;
- se actualizan gráficos y tablas.

#### Business Rules

##### BR-9001-001

Todo universo procede exclusivamente del Comparison Engine.

##### BR-9001-002

El frontend nunca construirá universos de comparación.

##### BR-9001-003

Toda modificación del universo invalidará automáticamente los resultados comparativos anteriores.

##### BR-9001-004

Los criterios utilizados para construir el universo deberán mostrarse siempre al usuario.

##### BR-9001-005

El componente nunca realiza cálculos comparativos.

Únicamente define el benchmark utilizado.

#### Integración Backend

Comparison Universe consume:

- Comparison Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Comparison Engine

No depende de:

- Ranking Engine
- Market Intelligence Engine
- Transaction OS

#### Casos especiales

##### Universo automático

El sistema construirá el benchmark utilizando los criterios definidos por Arroba Intelligence.

##### Universo personalizado

El usuario podrá sustituir el universo automático por uno propio.

El resto del módulo utilizará inmediatamente dicho universo.

##### Universo insuficiente

Cuando el número de comparables sea inferior al mínimo establecido por el motor, el componente mostrará una advertencia indicando que los resultados pueden perder representatividad.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente el universo de comparación;
- explique cómo se ha construido;
- permita modificar el benchmark cuando proceda;
- actualice automáticamente el resto de la sección;
- no implemente lógica de comparación;
- consuma exclusivamente el Comparison Engine.

#### Relación con otros componentes

Market Positioning

↓

Posiciona la empresa en el mercado.

Comparison Universe

↓

Define contra quién se compara.

Executive Comparison

↓

Analiza el resultado de la comparación.

Comparable Companies

↓

Presenta las empresas del benchmark.

Connected Intelligence

↓

Explica qué implican las diferencias detectadas.

#### Decisiones arquitectónicas

##### DA-9001-001

Todo el módulo Comparativa depende de un único universo de comparación.

##### DA-9001-002

El universo constituye un componente independiente y reutilizable.

##### DA-9001-003

La modificación del universo provoca el recálculo completo del análisis comparativo.

Fin de COMP-9001.

<a id="122-comp-9002-executive-comparison"></a>
### 12.2 COMP-9002 — Executive Comparison

---

id: COMP-9002

name: Executive Comparison

section: Comparativa

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Executive Comparison constituye el componente encargado de resumir, de forma ejecutiva, la posición relativa de la empresa frente al universo de comparación seleccionado.

Su misión consiste en responder, en menos de un minuto, a la pregunta:

> **¿Cómo está esta empresa respecto a sus comparables?**

No sustituye al análisis financiero.

No sustituye a la valoración.

No sustituye a los rankings.

Sintetiza el resultado del análisis comparativo.

#### Responsabilidad

Executive Comparison resume el comportamiento relativo de la empresa mediante una combinación de indicadores cuantitativos y conclusiones ejecutivas.

Incluye:

- percentiles;
- fortalezas;
- debilidades;
- oportunidades.

Todo el contenido procede del Comparison Engine.

#### Filosofía

Una comparación útil no consiste en mostrar cientos de ratios.

Consiste en responder rápidamente:

- ¿Dónde destaca la empresa?
- ¿Dónde está por detrás?
- ¿Qué oportunidades tiene?

#### Principios

##### Executive First

Todo el componente debe poder comprenderse en menos de un minuto.

##### Benchmark Driven

Toda conclusión se obtiene respecto al universo de comparación activo.

Nunca de forma absoluta.

##### Explainability

Cada conclusión deberá estar respaldada por indicadores objetivos.

##### Action Oriented

El componente identifica oportunidades de mejora.

Nunca realiza recomendaciones estratégicas.

#### Arquitectura funcional

```text
Executive Comparison

────────────────────────

Executive KPIs

↓

Strengths

↓

Weaknesses

↓

Opportunities
```

##### EC-001 Executive KPIs

#### Objetivo

Mostrar los principales indicadores comparativos.

Cada indicador representa la posición relativa de la empresa frente al benchmark.

Ejemplos.

- Margen EBITDA
- Crecimiento
- Productividad
- Tamaño
- Calidad Global

El número de indicadores dependerá de la configuración del Comparison Engine.

##### EC-002 Strengths

#### Objetivo

Identificar los aspectos en los que la empresa supera al universo de comparación.

Cada fortaleza deberá:

- estar soportada por datos;
- ser fácilmente comprensible;
- indicar implícitamente el motivo.

Ejemplo.

- Margen EBITDA situado en el percentil 92.
- Balance muy solvente.
- Elevada integración vertical.

##### EC-003 Weaknesses

#### Objetivo

Identificar los aspectos donde la empresa se sitúa por debajo del benchmark.

Ejemplos.

- Tamaño inferior al líder del segmento.
- Baja productividad relativa.
- Escasa presencia geográfica.

Nunca se realizarán inferencias sin soporte objetivo.

##### EC-004 Opportunities

#### Objetivo

Identificar oportunidades derivadas del análisis comparativo.

Ejemplos.

- Consolidación del mercado.
- Incremento de productividad.
- Expansión geográfica.
- Diversificación.

Las oportunidades siempre proceden del Comparison Engine.

#### Estados

##### Loading

Generando comparación.

##### Ready

Comparación disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente para generar la comparación.

##### Error

No ha sido posible generar el análisis.

#### UX Behaviour

Executive Comparison aparece inmediatamente después de Comparison Universe.

Los KPIs se muestran siempre en la parte superior.

Las fortalezas, debilidades y oportunidades aparecen agrupadas visualmente.

Todo el bloque constituye un único componente.

#### Business Rules

##### BR-9002-001

Toda la información procede exclusivamente del Comparison Engine.

##### BR-9002-002

El frontend nunca calcula percentiles.

##### BR-9002-003

Las fortalezas deberán estar respaldadas por indicadores objetivos.

##### BR-9002-004

Las debilidades nunca se generarán mediante reglas del frontend.

##### BR-9002-005

Las oportunidades proceden exclusivamente del modelo de inteligencia.

#### Integración Backend

Executive Comparison consume:

- Comparison Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Comparison Universe
- Comparison Engine

No depende de:

- Ranking Engine
- Financial Engine
- Transaction OS

#### Casos especiales

##### Universo modificado

Toda la información del componente se recalculará automáticamente.

##### Comparación insuficiente

Cuando el benchmark no sea representativo, el componente mostrará una advertencia indicando que las conclusiones tienen baja confianza.

#### Información parcial

Solo se mostrarán conclusiones verificadas.

Nunca se completarán mediante inferencias.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente la posición relativa de la empresa;
- muestre los principales percentiles;
- identifique fortalezas, debilidades y oportunidades;
- se actualice automáticamente al modificar el universo;
- no implemente lógica de comparación;
- consuma exclusivamente el Comparison Engine.

#### Relación con otros componentes

Comparison Universe

↓

Define el benchmark.

Executive Comparison

↓

Resume el resultado de la comparación.

Comparable Companies

↓

Presenta las empresas utilizadas como referencia.

Detailed Comparison

↓

Permite analizar las diferencias empresa a empresa.

#### Decisiones arquitectónicas

##### DA-9002-001

Executive Comparison constituye el resumen ejecutivo oficial del módulo Comparativa.

##### DA-9002-002

Fortalezas, Debilidades y Oportunidades forman parte del mismo componente.

No constituyen componentes independientes.

##### DA-9002-003

Toda modificación del universo provoca el recálculo completo del componente.

Fin de COMP-9002.	

<a id="123-comp-9003-comparable-companies"></a>
### 12.3 COMP-9003 — Comparable Companies

<a id="123-comp-9003-competitive-positioning"></a>
### 12.3 COMP-9003 — Competitive Positioning

---

id: COMP-9003

name: Competitive Positioning

section: Comparativa

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Competitive Positioning constituye el componente encargado de representar visualmente la posición competitiva de la empresa frente al universo de comparación seleccionado.

Su misión consiste en mostrar, de forma intuitiva, cómo se distribuyen las principales capacidades competitivas de la empresa respecto a sus comparables.

Responde a una única pregunta.

> ¿Dónde es competitiva esta empresa y dónde no?

No interpreta.

No genera recomendaciones.

No calcula indicadores.

Representa exclusivamente la información calculada por el Comparison Engine.

#### Responsabilidad

Mostrar la posición relativa de la empresa utilizando una representación gráfica multidimensional.

Incluye:

- perfil competitivo;
- indicadores comparativos;
- empresas de referencia;
- acceso al Advisor.

Todo el contenido procede del Comparison Engine.

#### Filosofía

Las comparaciones son mucho más fáciles de comprender mediante patrones visuales que mediante tablas.

El objetivo del componente es permitir identificar fortalezas y debilidades de un solo vistazo.

#### Principios

##### Visual First

La representación gráfica constituye el elemento principal del componente.

##### Benchmark Driven

Toda comparación utiliza exclusivamente el universo activo.

##### Explainability

Cada indicador representado deberá corresponder exactamente a un KPI calculado por el backend.

##### Advisor Ready

El usuario podrá iniciar una conversación contextual con Arroba Advisor desde el propio componente.

#### Arquitectura funcional

```text
Competitive Positioning

────────────────────────

Competitive Radar

↓

Position Indicators

↓

Comparable Companies

↓

Advisor Action
```

##### CP-001 Competitive Radar

#### Objetivo

Representar gráficamente el perfil competitivo de la empresa.

La representación visual pertenece al Design System.

##### CP-002 Position Indicators

#### Objetivo

Mostrar los principales indicadores comparativos.

Ejemplos.

- Calidad
- Crecimiento
- Margen EBITDA
- Productividad
- Salud financiera

Cada indicador mostrará el percentil correspondiente.

##### CP-003 Comparable Companies

#### Objetivo

Mostrar las principales empresas utilizadas como referencia visual.

El listado constituye únicamente un acceso rápido al benchmark.

El detalle completo pertenece al componente Comparison Universe.

##### CP-004 Advisor Action

#### Objetivo

Permitir iniciar una conversación contextual con Arroba Advisor utilizando el contexto completo del análisis comparativo.

#### Estados

##### Loading

Generando representación competitiva.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente para representar el posicionamiento.

##### Error

No ha sido posible generar la representación.

#### UX Behaviour

El radar y los indicadores permanecen sincronizados.

Toda modificación del universo recalcula automáticamente la representación.

La acción "Preguntar al Advisor" mantiene el contexto completo del análisis.

#### Business Rules

##### BR-9003-001

Toda la información procede exclusivamente del Comparison Engine.

##### BR-9003-002

El frontend nunca calculará indicadores competitivos.

##### BR-9003-003

Las empresas mostradas corresponderán siempre al benchmark activo.

##### BR-9003-004

Toda modificación del benchmark actualizará automáticamente el componente.

##### BR-9003-005

El radar constituye una representación visual.

Nunca una fuente de cálculo.

#### Integración Backend

Competitive Positioning consume:

- Comparison Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Comparison Universe
- Comparison Engine

No depende de:

- Ranking Engine
- Financial Engine
- Transaction OS

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente visualmente la posición competitiva;
- muestre los indicadores comparativos;
- mantenga sincronización con el benchmark;
- permita consultar el Advisor;
- no implemente lógica de cálculo;
- consuma exclusivamente el Comparison Engine.

#### Relación con otros componentes

Comparison Universe

↓

Define el benchmark.

Executive Comparison

↓

Resume la comparación.

Competitive Positioning

↓

Representa visualmente el posicionamiento competitivo.

Competitive Opportunity Map

↓

Analiza el potencial competitivo.

#### Decisiones arquitectónicas

##### DA-9003-001

El radar constituye únicamente una visualización del posicionamiento competitivo.

##### DA-9003-002

Toda la lógica de comparación pertenece exclusivamente al Comparison Engine.

##### DA-9003-003

Competitive Positioning constituye la representación gráfica oficial del análisis comparativo dentro de la Ficha de Empresa.

Fin de COMP-9003.

<a id="124-comp-9004-opportunity-map"></a>
### 12.4 COMP-9004 — Opportunity Map

---

id: COMP-9004

name: Opportunity Map

section: Comparativa

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Opportunity Map constituye el componente encargado de representar visualmente la posición competitiva de la empresa y de sus comparables dentro del mercado.

Su misión consiste en identificar de forma inmediata qué compañías presentan el mayor potencial competitivo y en qué zona se sitúa la empresa analizada.

Responde a una única pregunta.

> **¿Dónde se encuentra esta empresa dentro del mapa competitivo del mercado?**

No interpreta.

No recomienda adquisiciones.

No calcula métricas.

Representa exclusivamente la información generada por el Comparison Engine.

#### Responsabilidad

Representar el universo de comparación sobre un plano bidimensional.

Cada punto representa una empresa.

La empresa analizada aparece destacada respecto al resto.

#### Filosofía

Una posición competitiva es mucho más fácil de comprender cuando puede verse dentro del conjunto del mercado.

El objetivo del componente es mostrar el contexto completo de la competencia.

#### Principios

##### Visual First

La representación principal es un mapa bidimensional.

##### Benchmark Driven

Todas las empresas pertenecen al benchmark activo.

##### Explainability

Los ejes deberán estar claramente definidos.

Nunca existirán mapas ambiguos.

##### Interactive

Cada empresa podrá explorarse individualmente.

#### Arquitectura funcional

```text
Opportunity Map

────────────────────────

Scatter Plot

↓

Competitive Zones

↓

Legend

↓

Company Detail
```

##### OM-001 Scatter Plot

#### Objetivo

Representar todas las empresas del benchmark.

Cada empresa constituye un punto.

La empresa analizada aparecerá resaltada.

##### OM-002 Competitive Zones

#### Objetivo

Dividir el mapa en zonas competitivas.

Ejemplos.

- Oportunidad alta
- Competido
- Saturado
- Poco atractivo

La clasificación pertenece al Comparison Engine.

##### OM-003 Legend

#### Objetivo

Explicar el significado de cada zona.

La leyenda forma parte obligatoria del componente.

##### OM-004 Company Detail

#### Objetivo

Al situar el cursor sobre una empresa se mostrará:

- nombre;
- métricas utilizadas;
- posición exacta;
- acceso a su Ficha de Empresa.

#### Estados

##### Loading

Generando mapa.

##### Ready

Mapa disponible.

##### Partial

Solo existen algunos comparables.

##### Empty

No existe información suficiente.

##### Error

No ha sido posible generar el mapa.

#### UX Behaviour

El usuario podrá:

- hacer hover sobre cualquier empresa;
- seleccionar una empresa;
- abrir su ficha;
- comprender inmediatamente el significado de cada cuadrante.

La representación pertenece al Design System.

#### Business Rules

##### BR-9004-001

Todos los puntos proceden exclusivamente del Comparison Engine.

##### BR-9004-002

El frontend nunca calculará coordenadas.

##### BR-9004-003

La empresa analizada aparecerá siempre destacada.

##### BR-9004-004

Los cuadrantes serán definidos exclusivamente por el backend.

##### BR-9004-005

Toda modificación del benchmark regenerará el mapa.

#### Integración Backend

Opportunity Map consume:

- Comparison Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Comparison Universe
- Comparison Engine

No depende de:

- Ranking Engine
- Financial Engine
- Transaction OS

#### Casos especiales

##### Benchmark reducido

Cuando el universo contenga pocas empresas el mapa continuará mostrándose manteniendo las mismas reglas de representación.

##### Empresas sin datos suficientes

No aparecerán en el mapa hasta disponer de las métricas necesarias.

##### Cambio de ejes

Los ejes del gráfico podrán variar según el tipo de análisis definido por el Comparison Engine.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente todas las empresas del benchmark;
- identifique claramente la empresa analizada;
- muestre las zonas competitivas;
- permita explorar cualquier empresa;
- no implemente lógica de cálculo;
- consuma exclusivamente el Comparison Engine.

#### Relación con otros componentes

Comparison Universe

↓

Define el benchmark.

Executive Comparison

↓

Resume la comparación.

Competitive Positioning

↓

Representa el perfil competitivo.

Opportunity Map

↓

Sitúa visualmente a todas las empresas del universo.

Competitive Gaps

↓

Identifica las áreas de mejora.

#### Decisiones arquitectónicas

##### DA-9004-001

Opportunity Map constituye la representación espacial oficial del universo de comparación.

##### DA-9004-002

Cada punto representa una Company Entity.

Nunca una métrica agregada.

##### DA-9004-003

La definición de ejes y cuadrantes pertenece exclusivamente al Comparison Engine.

Fin de COMP-9004.

<a id="125-comp-9005-competitive-gaps"></a>
### 12.5 COMP-9005 — Competitive Gaps

---

id: COMP-9005

name: Competitive Gaps

section: Comparativa

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Competitive Gaps constituye el componente encargado de identificar las principales brechas competitivas de la empresa respecto al universo de comparación seleccionado.

Su misión consiste en mostrar, de forma objetiva, en qué dimensiones la empresa presenta ventaja, desventaja o una posición similar frente a sus comparables.

Responde a una única pregunta.

> **¿Dónde están las mayores diferencias competitivas respecto al mercado?**

No interpreta.

No propone acciones.

No calcula indicadores.

Representa exclusivamente las diferencias calculadas por el Comparison Engine.

#### Responsabilidad

Mostrar las principales brechas competitivas de la empresa.

Cada brecha representa una dimensión comparativa independiente.

Ejemplos:

- Escala
- Productividad
- Margen EBITDA
- Calidad
- Solvencia
- Endeudamiento

El número de dimensiones dependerá del modelo comparativo utilizado.

#### Filosofía

No todas las diferencias tienen la misma importancia.

El objetivo del componente es permitir identificar rápidamente dónde existe una ventaja competitiva consolidada y dónde aparecen oportunidades claras de mejora.

#### Principios

##### Relative Comparison

Toda brecha se calcula respecto al benchmark activo.

Nunca de forma absoluta.

##### Explainability

Cada diferencia deberá estar respaldada por un indicador cuantificable.

##### Visual First

Las diferencias deberán comprenderse de un vistazo.

##### Consistency

Todas las dimensiones utilizarán la misma escala visual.

#### Arquitectura funcional

```text
Competitive Gaps

────────────────────────

Gap List

↓

Gap Indicator

↓

Performance Level

↓

Gap Classification
```

##### CG-001 Gap List

#### Objetivo

Representar todas las dimensiones competitivas analizadas.

Cada dimensión constituye una fila independiente.

##### CG-002 Gap Indicator

#### Objetivo

Mostrar el nivel relativo alcanzado por la empresa.

La representación pertenece al Design System.

##### CG-003 Performance Level

#### Objetivo

Mostrar el percentil o nivel alcanzado por la empresa en dicha dimensión.

Ejemplos.

- P58
- P63
- P82
- P92

##### CG-004 Gap Classification

#### Objetivo

Clasificar cada dimensión utilizando una única categoría.

Ejemplos.

- Ventaja
- Similar
- Desventaja

La clasificación pertenece exclusivamente al Comparison Engine.

#### Estados

##### Loading

Calculando diferencias.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existen suficientes datos comparativos.

##### Error

No ha sido posible calcular las diferencias.

#### UX Behaviour

Las dimensiones aparecerán ordenadas por relevancia.

Las ventajas utilizarán la codificación visual positiva del Design System.

Las desventajas utilizarán la codificación visual negativa.

Las posiciones similares utilizarán el estado neutro.

#### Business Rules

##### BR-9005-001

Todas las diferencias proceden exclusivamente del Comparison Engine.

##### BR-9005-002

El frontend nunca calculará percentiles.

##### BR-9005-003

Toda clasificación deberá corresponder exactamente con el resultado del backend.

##### BR-9005-004

La modificación del benchmark recalculará automáticamente todas las brechas.

##### BR-9005-005

El componente nunca interpretará las causas de una diferencia.

#### Integración Backend

Competitive Gaps consume:

- Comparison Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Comparison Universe
- Comparison Engine

No depende de:

- Ranking Engine
- Financial Engine
- Transaction OS

#### Casos especiales

##### Benchmark reducido

El componente continuará representando únicamente las dimensiones con suficiente información.

##### Indicador no disponible

La dimensión permanecerá visible indicando que no existe información suficiente.

##### Cambio del universo

Todas las brechas se recalcularán automáticamente.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente todas las dimensiones comparativas;
- muestre el nivel alcanzado en cada una;
- clasifique cada dimensión como Ventaja, Similar o Desventaja;
- permanezca sincronizado con el benchmark activo;
- no implemente lógica analítica;
- consuma exclusivamente el Comparison Engine.

#### Relación con otros componentes

Comparison Universe

↓

Define el benchmark.

Executive Comparison

↓

Resume el análisis.

Competitive Positioning

↓

Representa el perfil competitivo.

Opportunity Map

↓

Sitúa la empresa dentro del mercado.

Competitive Gaps

↓

Identifica las principales diferencias competitivas.

Financial Comparison

↓

Cuantifica dichas diferencias mediante métricas financieras.

#### Decisiones arquitectónicas

##### DA-9005-001

Competitive Gaps constituye el componente oficial para representar las brechas competitivas de la empresa.

##### DA-9005-002

Toda la clasificación procede exclusivamente del Comparison Engine.

##### DA-9005-003

Las categorías Ventaja, Similar y Desventaja forman parte del lenguaje visual estándar de arroba.com.

Fin de COMP-9005.

<a id="126-comp-9006-competitive-difference-matrix"></a>
### 12.6 COMP-9006 — Competitive Difference Matrix

---

id: COMP-9006

name: Competitive Difference Matrix

section: Comparativa

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Competitive Difference Matrix constituye el componente encargado de comparar la empresa analizada frente a cada una de las empresas del universo de comparación.

Su misión consiste en identificar rápidamente en qué métricas cada comparable supera, iguala o queda por debajo de la empresa analizada.

Responde a una única pregunta.

> **¿Cómo se comporta cada comparable respecto a mi empresa?**

No interpreta.

No realiza recomendaciones.

No calcula indicadores.

Representa exclusivamente los resultados generados por el Comparison Engine.

#### Responsabilidad

Mostrar una matriz comparativa empresa contra empresa.

Cada fila representa una empresa comparable.

Cada columna representa una métrica.

Cada celda representa la diferencia relativa frente a la empresa analizada.

#### Filosofía

Las comparaciones individuales permiten detectar rápidamente quién destaca en cada dimensión.

No buscan encontrar un ganador absoluto.

Buscan explicar dónde existen diferencias competitivas.

#### Principios

##### Company vs Company

Cada fila representa una única empresa comparable.

Nunca un agregado.

##### Relative Comparison

Todas las diferencias se calculan respecto a la empresa analizada.

Nunca respecto a la media.

##### Explainability

Cada diferencia deberá estar respaldada por un indicador objetivo.

##### Visual Consistency

Toda la matriz utilizará la codificación visual estándar del Design System.

#### Arquitectura funcional

```text
Competitive Difference Matrix

────────────────────────

Comparable Company

↓

Comparison Metrics

↓

Relative Difference

↓

Visual Status
```

##### CDM-001 Comparable Company

#### Objetivo

Mostrar todas las empresas pertenecientes al benchmark.

Cada fila corresponde a una única empresa.

##### CDM-002 Comparison Metrics

#### Objetivo

Representar las métricas comparadas.

Ejemplos.

- Revenue
- EBITDA
- Margen
- Revenue / Employee
- Quality Score

Las métricas disponibles pertenecen al Comparison Engine.

##### CDM-003 Relative Difference

#### Objetivo

Mostrar la diferencia porcentual respecto a la empresa analizada.

El componente nunca calcula diferencias.

Solo las representa.

##### CDM-004 Visual Status

#### Objetivo

Representar visualmente cada comparación.

Estados.

- Mejor que la empresa
- Similar
- Peor que la empresa

La clasificación procede exclusivamente del backend.

#### Estados

##### Loading

Calculando diferencias.

##### Ready

Comparativa disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existen empresas suficientes para comparar.

##### Error

No ha sido posible generar la matriz.

#### UX Behaviour

La primera columna permanecerá fija.

Las métricas podrán desplazarse horizontalmente.

Cada celda utilizará la codificación cromática oficial del Design System.

Al seleccionar una empresa podrá abrirse directamente su Ficha de Empresa.

#### Business Rules

##### BR-9006-001

Toda la información procede exclusivamente del Comparison Engine.

##### BR-9006-002

El frontend nunca calculará diferencias porcentuales.

##### BR-9006-003

La empresa analizada constituye siempre la referencia de comparación.

##### BR-9006-004

Toda modificación del benchmark actualizará automáticamente la matriz.

##### BR-9006-005

La ausencia de una métrica constituye un estado válido.

Nunca se estimará.

#### Integración Backend

Competitive Difference Matrix consume:

- Comparison Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Comparison Universe
- Comparison Engine

No depende de:

- Ranking Engine
- Financial Engine
- Transaction OS

#### Casos especiales

##### Benchmark reducido

La matriz mostrará únicamente las empresas disponibles.

##### Métrica no disponible

La celda aparecerá vacía indicando ausencia de información.

##### Cambio del universo

Toda la matriz se recalculará automáticamente.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente todas las empresas comparables;
- muestre las diferencias por métrica;
- utilice la codificación visual estándar;
- permanezca sincronizado con el benchmark activo;
- no implemente lógica de cálculo;
- consuma exclusivamente el Comparison Engine.

#### Relación con otros componentes

Comparison Universe

↓

Define el benchmark.

Executive Comparison

↓

Resume el análisis.

Competitive Positioning

↓

Representa el perfil competitivo.

Opportunity Map

↓

Sitúa la empresa dentro del mercado.

Competitive Gaps

↓

Identifica las principales diferencias.

Competitive Difference Matrix

↓

Compara empresa por empresa.

Financial Comparison

↓

Presenta las métricas agregadas del benchmark.

#### Decisiones arquitectónicas

##### DA-9006-001

Cada fila representa una Company Entity.

##### DA-9006-002

La empresa analizada constituye siempre la referencia de comparación.

##### DA-9006-003

Toda la lógica comparativa pertenece exclusivamente al Comparison Engine.

Fin de COMP-9006.

<a id="127-comp-9007-financial-comparison"></a>
### 12.7 COMP-9007 — Financial Comparison

---

id: COMP-9007

name: Financial Comparison

section: Comparativa

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Financial Comparison constituye el componente encargado de comparar las principales métricas financieras de la empresa frente al universo de comparación.

Su misión consiste en permitir al usuario comprender inmediatamente cómo se sitúa la empresa respecto a la mediana, el Top 25 %, el Top 10 % y el líder del mercado.

Responde a una única pregunta.

> **¿Cómo se comparan los principales indicadores financieros de esta empresa respecto a sus comparables?**

No interpreta.

No genera recomendaciones.

No calcula métricas.

Representa exclusivamente la información producida por el Comparison Engine.

#### Responsabilidad

Mostrar una tabla comparativa de indicadores financieros.

Cada fila representa una métrica.

Cada columna representa un nivel de referencia del mercado.

#### Filosofía

El usuario debe poder responder en segundos preguntas como:

- ¿Estoy por encima de la mediana?
- ¿Qué me falta para entrar en el Top 25?
- ¿Qué diferencia me separa del líder?

La comparación debe ser inmediata.

#### Principios

##### Benchmark First

Toda comparación utiliza el universo activo.

##### Explainability

Cada valor deberá indicar exactamente el benchmark utilizado.

##### Readability

La tabla debe poder leerse sin necesidad de interpretar gráficos.

##### Consistency

Todas las métricas deberán utilizar exactamente el mismo período temporal.

#### Arquitectura funcional

```text
Financial Comparison

────────────────────────

Metric

↓

Company

↓

Median

↓

Top 25

↓

Top 10

↓

Leader
```

##### FC-001 Metric

#### Objetivo

Mostrar la métrica comparada.

Ejemplos.

- Ventas
- EBITDA
- Margen EBITDA
- Deuda Neta / EBITDA
- Ventas / Empleado

Las métricas disponibles pertenecen al Comparison Engine.

##### FC-002 Company

#### Objetivo

Mostrar el valor correspondiente a la empresa analizada.

Constituye siempre la columna de referencia.

##### FC-003 Median

#### Objetivo

Mostrar el valor mediano del benchmark.

Nunca la media.

##### FC-004 Top 25

#### Objetivo

Mostrar el valor representativo del percentil 75 del benchmark.

La metodología pertenece al Comparison Engine.

##### FC-005 Top 10

#### Objetivo

Mostrar el valor representativo del Top 10 % del benchmark.

##### FC-006 Leader

#### Objetivo

Mostrar el mejor valor registrado dentro del benchmark.

La definición de "mejor" dependerá de cada métrica y pertenece al backend.

#### Estados

##### Loading

Calculando comparación.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información suficiente.

##### Error

No ha sido posible generar la comparativa.

#### UX Behaviour

Las métricas aparecerán en un orden fijo definido por el Comparison Engine.

La primera columna permanecerá fija durante el desplazamiento horizontal.

Las columnas de referencia utilizarán la codificación cromática oficial del Design System.

#### Business Rules

##### BR-9007-001

Toda la información procede exclusivamente del Comparison Engine.

##### BR-9007-002

El frontend nunca calculará medianas ni percentiles.

##### BR-9007-003

Todas las columnas utilizarán el mismo benchmark.

##### BR-9007-004

Toda modificación del universo actualizará automáticamente la tabla.

##### BR-9007-005

Cuando una métrica no esté disponible se mostrará explícitamente como "No disponible".

Nunca se estimará.

#### Integración Backend

Financial Comparison consume:

- Comparison Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Comparison Universe
- Comparison Engine

No depende de:

- Financial Engine
- Ranking Engine
- Transaction OS

#### Casos especiales

##### Benchmark reducido

La comparación continuará mostrándose indicando el tamaño del universo utilizado.

##### Métrica no disponible

La fila permanecerá visible indicando ausencia de información.

##### Cambio del universo

Toda la tabla se recalculará automáticamente.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- compare correctamente la empresa con la mediana, Top 25, Top 10 y líder;
- represente todas las métricas disponibles;
- mantenga consistencia temporal;
- permanezca sincronizado con el benchmark activo;
- no implemente lógica de cálculo;
- consuma exclusivamente el Comparison Engine.

#### Relación con otros componentes

Comparison Universe

↓

Define el benchmark.

Executive Comparison

↓

Resume el análisis.

Competitive Positioning

↓

Representa el perfil competitivo.

Competitive Difference Matrix

↓

Compara empresa frente a empresa.

Financial Comparison

↓

Compara la empresa frente a los principales niveles del mercado.

Competitive Gaps

↓

Resume dónde existe ventaja o desventaja competitiva.

#### Decisiones arquitectónicas

##### DA-9007-001

La empresa analizada constituye siempre la primera columna de referencia.

##### DA-9007-002

La mediana es la referencia estadística principal del benchmark.

Nunca la media.

##### DA-9007-003

Financial Comparison constituye la tabla financiera oficial del módulo Comparativa.

Fin de COMP-9007.

<a id="131-comp-10001-signals-section"></a>
### 13.1 COMP-10001 — Signals Section

---

id: COMP-10001

name: Signals Section

section: Señales

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Signals Section constituye el módulo de la Ficha de Empresa encargado de representar todas las señales relevantes detectadas sobre la compañía.

Su misión consiste en permitir que el usuario conozca, de un vistazo, qué hechos relevantes están ocurriendo alrededor de la empresa y cuáles requieren atención.

Responde a una única pregunta.

> **¿Qué está ocurriendo actualmente en esta empresa?**

No interpreta.

No recomienda.

No calcula señales.

Representa exclusivamente las señales generadas por el Signal Engine.

#### Responsabilidad

Signals Section organiza todas las señales detectadas para una empresa.

Incluye, cuando exista información disponible:

- señales financieras;
- señales mercantiles;
- señales societarias;
- señales comerciales;
- señales laborales;
- señales judiciales;
- señales reputacionales;
- señales estratégicas.

Cada señal constituye un evento independiente.

#### Filosofía

La Ficha de Empresa representa el estado de una compañía.

Las Señales representan su evolución.

Mientras el resto de módulos describen qué es una empresa, Señales explica qué está ocurriendo en ella.

#### Principios

##### Event Driven

Cada señal representa un hecho.

Nunca una opinión.

##### Timeline Ready

Todas las señales poseen una dimensión temporal.

##### Explainability

Toda señal deberá poder justificarse mediante datos o fuentes verificables.

##### Near Real Time

Las señales deberán actualizarse automáticamente cuando existan nuevos eventos.

#### Arquitectura funcional

```text
Signals Section

────────────────────────

Signals Feed

↓

Signal Filters

↓

Signal Detail

↓

Timeline

↓

Advisor Actions
```

La composición exacta dependerá de la información disponible para la empresa.

#### Navegación

Signals constituye una sección independiente de la Ficha de Empresa.

Todos sus componentes permanecen sincronizados.

Los filtros afectan a toda la sección.

#### Estados

##### Loading

Recuperando señales.

##### Ready

Señales disponibles.

##### Partial

Información parcialmente disponible.

##### Empty

No existen señales relevantes.

##### Error

No ha sido posible recuperar las señales.

#### UX Behaviour

Signals mantiene el mismo patrón de navegación que el resto de módulos de la Ficha.

Las señales se presentan ordenadas por relevancia y fecha.

La representación visual pertenece al Design System.

#### Business Rules

##### BR-10001-001

Todas las señales proceden exclusivamente del Signal Engine.

##### BR-10001-002

El frontend nunca genera señales.

##### BR-10001-003

Cada señal deberá mantener una referencia a su origen.

##### BR-10001-004

Las señales podrán agruparse por categoría.

##### BR-10001-005

La ausencia de señales constituye un estado válido.

#### Integración Backend

Signals Section consume:

- Signal Engine
- Company Entity Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Signal Engine

No depende de:

- Financial Engine
- Comparison Engine
- Ranking Engine
- Transaction OS

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente las señales de la empresa;
- permita navegar por ellas;
- permanezca sincronizado con el Signal Engine;
- no implemente lógica de generación;
- consuma exclusivamente el Signal Engine.

#### Relación con otros componentes

Executive Vista

↓

Resume la empresa.

Comparativa

↓

Compara la empresa con el mercado.

Signals Section

↓

Representa los hechos relevantes que afectan a la empresa.

#### Decisiones arquitectónicas

##### DA-10001-001

Signals constituye un módulo independiente de la Ficha de Empresa.

##### DA-10001-002

Toda la inteligencia de generación de señales pertenece exclusivamente al Signal Engine.

##### DA-10001-003

Signals representa hechos verificables.

Nunca interpretaciones.

Fin de COMP-10001.

<a id="132-comp-10002-signals-timeline"></a>
### 13.2 COMP-10002 — Signals Timeline

---

id: COMP-10002

name: Signals Timeline

section: Señales

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Signals Timeline constituye el componente encargado de representar cronológicamente todas las señales relevantes detectadas sobre una empresa.

Su misión consiste en ofrecer una visión priorizada y temporal de los hechos más relevantes inferidos por Arroba Intelligence a partir de los datos de la compañía.

Responde a una única pregunta.

> ¿Qué hechos relevantes caracterizan actualmente a esta empresa?

No calcula señales.

No interpreta información.

No genera inteligencia.

Representa exclusivamente las señales generadas por el Signal Engine.

#### Responsabilidad

Mostrar todas las señales detectadas para la empresa.

Cada señal constituye un evento independiente.

Cada evento dispone de:

- título;
- explicación;
- categoría;
- ejercicio de referencia;
- nivel de relevancia.

#### Filosofía

Una señal representa un hecho.

No una opinión.

No una recomendación.

El objetivo consiste en sintetizar grandes volúmenes de información empresarial en eventos fácilmente comprensibles.

#### Principios

##### Event First

Cada fila representa un único evento.

Nunca un agregado.

##### Explainability

Toda señal deberá poder justificarse mediante datos verificables.

##### Timeline Driven

Las señales mantienen una secuencia temporal.

##### Readability

Cada señal deberá comprenderse en menos de diez segundos.

#### Arquitectura funcional

```text
Signals Timeline

────────────────────────

Timeline

↓

Signal Card

↓

Category

↓

Reference Year

↓

Signal Detail
```

##### ST-001 Timeline

#### Objetivo

Representar todas las señales en una línea temporal vertical.

La línea temporal constituye la navegación principal del componente.

##### ST-002 Signal Card

#### Objetivo

Cada tarjeta representa una única señal.

Incluye:

- título;
- descripción;
- metadatos.

##### ST-003 Category

#### Objetivo

Clasificar cada señal mediante una categoría normalizada.

Ejemplos.

- Rentabilidad
- Solvencia
- Auditoría
- Capital
- Apalancamiento
- Estructura

Las categorías pertenecen al Signal Engine.

##### ST-004 Reference Year

#### Objetivo

Mostrar el ejercicio al que corresponde la señal.

La fecha nunca será inferida por el frontend.

##### ST-005 Signal Detail

#### Objetivo

Representar la explicación completa de la señal.

La descripción procede íntegramente del Signal Engine.

#### Estados

##### Loading

Generando señales.

##### Ready

Señales disponibles.

##### Partial

Información parcialmente disponible.

##### Empty

No existen señales detectadas.

##### Error

No ha sido posible recuperar las señales.

#### UX Behaviour

Las señales aparecen ordenadas por prioridad y cronología.

Cada tarjeta mantiene el mismo diseño visual.

Las categorías utilizan la codificación cromática oficial del Design System.

Toda la línea temporal mantiene el mismo espaciado y jerarquía visual.

#### Business Rules

##### BR-10002-001

Todas las señales proceden exclusivamente del Signal Engine.

##### BR-10002-002

El frontend nunca genera señales.

##### BR-10002-003

Cada señal pertenece a una única categoría.

##### BR-10002-004

Toda señal mantiene su ejercicio de referencia.

##### BR-10002-005

La ausencia de señales constituye un estado válido.

#### Integración Backend

Signals Timeline consume:

- Signal Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Signal Engine

No depende de:

- Financial Engine
- Comparison Engine
- Ranking Engine
- Transaction OS

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente todas las señales;
- mantenga el orden cronológico;
- muestre categoría y ejercicio;
- no implemente lógica de generación;
- consuma exclusivamente el Signal Engine.

#### Relación con otros componentes

Signals Section

↓

Contiene el módulo.

Signals Timeline

↓

Representa todos los eventos detectados.

#### Decisiones arquitectónicas

##### DA-10002-001

Signals Timeline constituye la representación oficial de las señales de una empresa.

##### DA-10002-002

Cada tarjeta representa exactamente una señal generada por el Signal Engine.

##### DA-10002-003

Las señales representan hechos verificables.

Nunca recomendaciones ni opiniones.

Fin de COMP-10002.

<a id="141-comp-11001-opportunities-section"></a>
### 14.1 COMP-11001 — Opportunities Section

---

id: COMP-11001

name: Opportunities Section

section: Oportunidades

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Opportunities Section constituye el módulo de la Ficha de Empresa encargado de representar las oportunidades de decisión empresarial identificadas por Arroba Intelligence.

Su misión consiste en presentar las oportunidades detectadas para una empresa a partir del análisis combinado de sus datos financieros, societarios, estratégicos y de mercado.

Responde a una única pregunta.

> **¿Qué oportunidades relevantes ha identificado Arroba para esta empresa?**

No calcula oportunidades.

No realiza recomendaciones.

No ejecuta operaciones.

Representa exclusivamente las oportunidades generadas por el Opportunity Engine.

#### Responsabilidad

Agrupar todas las oportunidades disponibles para una empresa.

Cada oportunidad constituye un caso de negocio independiente.

El módulo mantiene todas las oportunidades sincronizadas con el Opportunity Engine.

#### Filosofía

Las oportunidades representan hipótesis de decisión empresarial.

No son alertas.

No son señales.

No son recomendaciones cerradas.

Constituyen posibles escenarios de creación de valor.

#### Principios

##### Opportunity First

Cada oportunidad representa una decisión potencial.

##### Explainability

Toda oportunidad deberá justificar por qué ha sido generada.

##### Confidence Driven

Cada oportunidad incorpora un nivel de confianza.

##### Action Ready

Cada oportunidad puede transformarse en una operación dentro de arroba.com.

#### Arquitectura funcional

```text
Opportunities Section

────────────────────────

Opportunity Cards
```

#### Estados

##### Loading

Generando oportunidades.

##### Ready

Oportunidades disponibles.

##### Partial

Información parcialmente disponible.

##### Empty

No existen oportunidades detectadas.

##### Error

No ha sido posible generar oportunidades.

#### Business Rules

##### BR-11001-001

Todas las oportunidades proceden exclusivamente del Opportunity Engine.

##### BR-11001-002

El frontend nunca genera oportunidades.

##### BR-11001-003

La ausencia de oportunidades constituye un estado válido.

#### Integración Backend

Consume:

- Opportunity Engine

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente todas las oportunidades disponibles;
- permanezca sincronizado con el Opportunity Engine;
- no implemente lógica de generación.

#### Decisiones arquitectónicas

##### DA-11001-001

Las oportunidades representan hipótesis de creación de valor.

Nunca recomendaciones automáticas.

Fin de COMP-11001.

<a id="151-comp-12001-sources-section"></a>
### 15.1 COMP-12001 — Sources Section

---

id: COMP-12001

name: Sources Section

section: Fuentes

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Sources Section constituye el módulo de la Ficha de Empresa encargado de proporcionar acceso a todas las fuentes documentales utilizadas para construir la entidad y su inteligencia.

Su misión consiste en ofrecer trazabilidad completa sobre el origen de la información mostrada en la Ficha de Empresa.

Responde a una única pregunta.

> **¿De dónde procede esta información?**

No interpreta.

No genera inteligencia.

No modifica documentos.

Representa exclusivamente las fuentes documentales asociadas a la empresa.

#### Responsabilidad

Agrupar todos los documentos y registros disponibles para una empresa.

Incluye:

- registros públicos;
- documentos;
- fuentes oficiales;
- documentación aportada;
- documentación privada (cuando exista autorización).

#### Filosofía

Toda afirmación realizada por Arroba debe poder trazarse hasta una fuente verificable.

La confianza en la inteligencia depende de la calidad de sus fuentes.

#### Principios

##### Source of Truth

Toda información debe mantener un vínculo con su origen.

##### Traceability

Cada documento conserva su procedencia y fecha.

##### Explainability

El usuario debe poder consultar la fuente utilizada.

#### Permissions

El acceso a determinados documentos dependerá de los permisos del usuario.

#### Arquitectura funcional

```text
Sources Section

────────────────────────

Public Records

↓

Documents
```

#### Estados

##### Loading

Recuperando documentación.

##### Ready

Fuentes disponibles.

##### Partial

Documentación parcialmente disponible.

##### Empty

No existen documentos asociados.

##### Error

No ha sido posible recuperar las fuentes.

#### Business Rules

##### BR-12001-001

Toda fuente mantiene trazabilidad completa.

##### BR-12001-002

El frontend nunca modifica documentos.

##### BR-12001-003

Los permisos de acceso pertenecen al backend.

#### Integración Backend

Consume:

- Document Engine
- Registry Engine

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- agrupe correctamente todas las fuentes;
- permita acceder a cada bloque documental;
- mantenga la trazabilidad completa.

#### Decisiones arquitectónicas

##### DA-12001-001

Sources constituye el último módulo de la Ficha de Empresa.

##### DA-12001-002

Toda la inteligencia representada en la Ficha debe poder trazarse hasta una fuente documental.

Fin de COMP-12001.

<a id="152-comp-12002-corporate-registry-events"></a>
### 15.2 COMP-12002 — Corporate Registry Events

---

id: COMP-12002

name: Corporate Registry Events

section: Registros Públicos

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Corporate Registry Events constituye el componente encargado de representar los principales actos societarios inscritos en el Registro Mercantil relativos a la empresa.

Su misión consiste en ofrecer una visión estructurada y cronológica de los hechos societarios oficialmente registrados.

Responde a una única pregunta.

> **¿Qué hechos societarios oficiales se han inscrito sobre esta empresa?**

No interpreta.

No genera eventos.

No modifica información registral.

Representa exclusivamente la información procedente del Registry Engine.

#### Responsabilidad

Mostrar los principales actos inscritos en el Registro Mercantil.

Incluye, cuando exista información disponible:

- nombramientos;
- ceses;
- apoderamientos;
- auditorías;
- modificaciones estatutarias;
- ampliaciones o reducciones de capital;
- cualquier otro acto registral relevante.

Cada fila representa un acto registral independiente.

#### Filosofía

El Registro Mercantil constituye la fuente oficial para comprender la evolución jurídica de una sociedad.

Este componente resume dicha información de forma estructurada y fácilmente consultable.

#### Principios

##### Registry First

Toda la información procede del Registro Mercantil.

##### Event Based

Cada fila representa un único acto registral.

##### Explainability

Cada acto mantiene su referencia registral y fecha.

##### Chronological

Los actos se presentan ordenados cronológicamente.

#### Arquitectura funcional

```text
Corporate Registry Events

────────────────────────

Registry Event Table

↓

Year

↓

Event Type

↓

Registry Detail
```

##### CRE-001 Registry Event Table

#### Objetivo

Representar todos los actos registrales disponibles mediante una tabla estructurada.

##### CRE-002 Year

#### Objetivo

Mostrar el ejercicio correspondiente al acto registral.

##### CRE-003 Event Type

#### Objetivo

Clasificar el acto registral.

Ejemplos.

- Nombramientos
- Apoderamientos
- Auditoría
- Estatutos
- Capital

La clasificación pertenece al Registry Engine.

##### CRE-004 Registry Detail

#### Objetivo

Mostrar la descripción oficial del acto inscrito.

El texto procede íntegramente del Registro Mercantil.

#### Estados

##### Loading

Recuperando actos registrales.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existen actos registrales.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

Los actos se presentan en formato tabular.

Las filas mantienen un orden cronológico descendente.

Toda la representación utiliza el Design System oficial.

#### Business Rules

##### BR-12002-001

Todos los actos proceden exclusivamente del Registry Engine.

##### BR-12002-002

El frontend nunca modifica descripciones registrales.

##### BR-12002-003

Cada fila representa exactamente un acto registral.

##### BR-12002-004

Los actos deberán mantenerse sincronizados con la información registral disponible.

#### Integración Backend

Consume:

- Registry Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Registry Engine

No depende de:

- Financial Engine
- Comparison Engine
- Transaction OS

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente los actos registrales;
- mantenga el orden cronológico;
- clasifique correctamente cada acto;
- no implemente lógica registral;
- consuma exclusivamente el Registry Engine.

#### Relación con otros componentes

Sources Section

↓

Agrupa todas las fuentes.

Corporate Registry Events

↓

Representa los actos inscritos en el Registro Mercantil.

Annual Accounts Registry

↓

Representa las cuentas depositadas.

Registry Information

↓

Representa la información registral permanente.

#### Decisiones arquitectónicas

##### DA-12002-001

Corporate Registry Events constituye la representación oficial de los actos registrales de la empresa.

##### DA-12002-002

Cada fila representa un único acto inscrito.

Nunca un resumen generado por IA.

Fin de COMP-12002.
<a id="153-comp-12003-annual-accounts-registry"></a>
### 15.3 COMP-12003 — Annual Accounts Registry

---

id: COMP-12003

name: Annual Accounts Registry

section: Registros Públicos

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Annual Accounts Registry constituye el componente encargado de representar el historial de cuentas anuales depositadas por la empresa en el Registro Mercantil.

Su misión consiste en ofrecer una visión estructurada de los ejercicios depositados y del estado de cada depósito.

Responde a una única pregunta.

> **¿Qué cuentas anuales ha depositado oficialmente esta empresa?**

No interpreta.

No analiza estados financieros.

No calcula indicadores.

Representa exclusivamente la información registral procedente del Registry Engine.

#### Responsabilidad

Mostrar el histórico de cuentas anuales depositadas.

Cada fila representa un depósito registral independiente.

Incluye, cuando exista información disponible:

- ejercicio;
- tipo de cuentas;
- estado del depósito;
- auditor;
- enlace al documento oficial (cuando exista).

#### Filosofía

Las cuentas depositadas constituyen la principal fuente oficial de información financiera de una sociedad.

Este componente permite verificar rápidamente qué información financiera existe y cuál es su estado.

#### Principios

##### Registry First

Toda la información procede del Registro Mercantil.

##### One Filing = One Row

Cada fila representa un único depósito oficial.

##### Traceability

Cada depósito mantiene su ejercicio y estado.

##### Consistency

Todos los depósitos utilizan la misma estructura de representación.

#### Arquitectura funcional

```text
Annual Accounts Registry

────────────────────────

Annual Accounts Table

↓

Fiscal Year

↓

Account Type

↓

Filing Status

↓

Auditor
```

##### AAR-001 Annual Accounts Table

#### Objetivo

Representar todos los depósitos de cuentas anuales disponibles.

Cada fila corresponde a un único depósito.

##### AAR-002 Fiscal Year

#### Objetivo

Mostrar el ejercicio económico al que corresponden las cuentas.

##### AAR-003 Account Type

#### Objetivo

Identificar el tipo de cuentas depositadas.

Ejemplos.

- Individuales
- Consolidadas
- Abreviadas
- Pymes

La clasificación procede del Registry Engine.

##### AAR-004 Filing Status

#### Objetivo

Mostrar el estado oficial del depósito.

Ejemplos.

- Depositadas
- Auditadas
- Pendientes
- No disponibles

El estado nunca será calculado por el frontend.

##### AAR-005 Auditor

#### Objetivo

Mostrar el auditor inscrito para ese ejercicio cuando exista.

El nombre procede íntegramente del Registro Mercantil.

#### Estados

##### Loading

Recuperando cuentas anuales.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existen depósitos registrados.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

Los ejercicios aparecen ordenados de más reciente a más antiguo.

Todas las filas mantienen la misma estructura visual.

Cuando exista documentación asociada, podrá abrirse desde la propia fila.

#### Business Rules

##### BR-12003-001

Toda la información procede exclusivamente del Registry Engine.

##### BR-12003-002

El frontend nunca modifica estados de depósito.

##### BR-12003-003

Cada fila representa exactamente un depósito registral.

##### BR-12003-004

El histórico deberá mantenerse sincronizado con el Registro Mercantil.

##### BR-12003-005

La ausencia de depósitos constituye un estado válido.

#### Integración Backend

Consume:

- Registry Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Registry Engine

No depende de:

- Financial Engine
- Comparison Engine
- Transaction OS

#### Casos especiales

##### Ejercicio sin auditor

La columna Auditor permanecerá vacía indicando "No disponible".

##### Depósitos múltiples para un mismo ejercicio

Cada depósito se representará como un registro independiente.

##### Documentación no accesible

El depósito seguirá siendo visible aunque el documento asociado no pueda descargarse.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente el histórico de cuentas depositadas;
- identifique el tipo de cuentas;
- muestre el estado oficial del depósito;
- identifique el auditor cuando exista;
- no implemente lógica financiera;
- consuma exclusivamente el Registry Engine.

#### Relación con otros componentes

Sources Section

↓

Agrupa todas las fuentes.

Corporate Registry Events

↓

Representa los actos registrales.

Annual Accounts Registry

↓

Representa el histórico oficial de cuentas depositadas.

Registry Information

↓

Representa la información registral permanente.

#### Decisiones arquitectónicas

##### DA-12003-001

Cada fila representa un único depósito oficial de cuentas anuales.

##### DA-12003-002

El estado del depósito pertenece exclusivamente al Registry Engine.

##### DA-12003-003

Annual Accounts Registry constituye la representación oficial del histórico de depósitos financieros dentro de la Ficha de Empresa.

Fin de COMP-12003.

<a id="154-comp-12004-registry-information"></a>
### 15.4 COMP-12004 — Registry Information

---

id: COMP-12004

name: Registry Information

section: Registros Públicos

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Registry Information constituye el componente encargado de representar la información registral permanente de una empresa.

Su misión consiste en ofrecer una visión resumida de los principales atributos jurídicos y administrativos inscritos oficialmente.

Responde a una única pregunta.

> **¿Cuál es la situación registral actual de esta empresa?**

No interpreta.

No genera inteligencia.

No modifica información.

Representa exclusivamente los datos oficiales procedentes del Registry Engine.

#### Responsabilidad

Mostrar la ficha registral básica de la empresa.

Incluye, cuando exista información disponible:

- situación mercantil;
- país;
- moneda funcional;
- capital social;
- modelo de cuentas;
- tipo de cuenta;
- cualquier otro atributo registral permanente.

Cada dato representa el estado vigente de la sociedad.

#### Filosofía

No toda la información del Registro Mercantil son eventos.

Existen atributos permanentes que describen el estado jurídico actual de la empresa.

Este componente centraliza esa información.

#### Principios

##### Current State

El componente representa siempre la situación vigente.

Nunca el histórico.

##### Registry First

Toda la información procede del Registro Mercantil.

##### Explainability

Cada dato mantiene trazabilidad hacia su origen registral.

##### Readability

La información debe poder consultarse de un vistazo.

#### Arquitectura funcional

```text
Registry Information

────────────────────────

Registry Attributes

↓

Legal Status

↓

Administrative Data

↓

Financial Filing Profile
```

##### RI-001 Registry Attributes

#### Objetivo

Representar todos los atributos registrales disponibles mediante una cuadrícula uniforme.

Cada atributo constituye un campo independiente.

##### RI-002 Legal Status

#### Objetivo

Mostrar la situación jurídica actual de la empresa.

Ejemplos.

- Activa
- En liquidación
- Disuelta
- Concurso
- Extinguida

La clasificación procede exclusivamente del Registry Engine.

##### RI-003 Administrative Data

#### Objetivo

Representar la información administrativa permanente.

Ejemplos.

- País
- Moneda
- Provincia
- Registro competente

Los campos visibles dependerán de la información disponible.

##### RI-004 Financial Filing Profile

#### Objetivo

Mostrar los atributos permanentes relacionados con el depósito de cuentas.

Ejemplos.

- Modelo de balance
- Tipo de cuentas
- Régimen contable

No representa depósitos individuales.

Ese comportamiento pertenece a **Annual Accounts Registry**.

#### Estados

##### Loading

Recuperando información registral.

##### Ready

Información disponible.

##### Partial

Información parcialmente disponible.

##### Empty

No existe información registral suficiente.

##### Error

No ha sido posible recuperar la información.

#### UX Behaviour

Los atributos se muestran en formato de cuadrícula.

Todos los campos mantienen la misma jerarquía visual.

Los valores no disponibles aparecerán explícitamente como:

**No disponible**

Nunca se ocultarán campos por ausencia de información.

#### Business Rules

##### BR-12004-001

Toda la información procede exclusivamente del Registry Engine.

##### BR-12004-002

El frontend nunca modifica atributos registrales.

##### BR-12004-003

Cada atributo representa el estado vigente de la empresa.

##### BR-12004-004

La ausencia de un dato constituye un estado válido.

##### BR-12004-005

El componente nunca representa información histórica.

#### Integración Backend

Consume:

- Registry Engine

Toda la lógica pertenece exclusivamente al backend.

#### Dependencias

Depende de:

- Company Entity
- Registry Engine

No depende de:

- Financial Engine
- Comparison Engine
- Transaction OS

#### Casos especiales

##### Información incompleta

Los atributos disponibles seguirán representándose manteniendo la estructura del componente.

##### Cambio de situación registral

El componente reflejará automáticamente el nuevo estado cuando sea actualizado por el Registry Engine.

##### Campo no aplicable

El valor aparecerá como **No disponible**.

Nunca se eliminará la fila correspondiente.

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente la situación registral vigente;
- muestre todos los atributos disponibles;
- mantenga la trazabilidad con el Registro Mercantil;
- no implemente lógica registral;
- consuma exclusivamente el Registry Engine.

#### Relación con otros componentes

Sources Section

↓

Agrupa todas las fuentes.

Corporate Registry Events

↓

Representa los actos inscritos.

Annual Accounts Registry

↓

Representa el histórico de depósitos.

Registry Information

↓

Representa la situación registral vigente.

Documents

↓

Permite acceder a la documentación asociada.

#### Decisiones arquitectónicas

##### DA-12004-001

Registry Information representa exclusivamente el estado actual de la empresa.

Nunca eventos históricos.

##### DA-12004-002

Todos los atributos proceden exclusivamente del Registry Engine.

##### DA-12004-003

Registry Information constituye la ficha registral oficial de la empresa dentro de arroba.com.

Fin de COMP-12004.

<a id="155-comp-12005-documents-section"></a>
### 15.5 COMP-12005 — Documents Section

---

id: COMP-12005

name: Documents Section

section: Documentos

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Documents Section constituye el módulo de la Ficha de Empresa encargado de centralizar todos los documentos e informes disponibles para una compañía.

Su misión consiste en ofrecer un punto único de acceso a toda la documentación generada por Arroba o disponible para esa empresa.

Responde a una única pregunta.

> ¿Qué documentación puedo consultar sobre esta empresa?

No genera informes.

No calcula información.

No almacena documentos.

Representa exclusivamente el catálogo disponible para la empresa.

#### Responsabilidad

Agrupar todos los documentos disponibles.

Incluye:

- informes gratuitos;
- informes premium;
- informes financieros;
- valoraciones;
- memorias;
- documentación descargable.

#### Filosofía

La Ficha de Empresa debe constituir el punto único de acceso a toda la documentación disponible sobre la entidad.

#### Principios

##### One Entry Point

Toda la documentación se consulta desde un único módulo.

##### Product Catalog

Cada documento constituye un producto documental.

#### Permissions

La disponibilidad dependerá del plan, permisos y créditos del usuario.

##### Consistency

Todos los documentos mantienen exactamente la misma representación visual.

#### Arquitectura funcional

```text
Documents Section

────────────────────────

Document Catalog
```

#### Estados

##### Loading

Recuperando documentos.

##### Ready

Catálogo disponible.

##### Empty

No existen documentos.

##### Error

No ha sido posible recuperar el catálogo.

#### Business Rules

##### BR-12005-001

Todos los documentos proceden exclusivamente del Document Engine.

##### BR-12005-002

El frontend nunca genera informes.

##### BR-12005-003

La disponibilidad depende de permisos y licencias.

#### Integración Backend

Consume:

- Document Engine

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente correctamente el catálogo documental;
- permanezca sincronizado con el Document Engine;
- no implemente lógica documental.

#### Decisiones arquitectónicas

##### DA-12005-001

Documents constituye el punto único de acceso a la documentación de la empresa.

Fin de COMP-12005.

<a id="161-comp-13001-next-best-actions"></a>
### 16.1 COMP-13001 — Next Best Actions

---

id: COMP-13001

name: Next Best Actions

section: Intelligence

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Next Best Actions constituye el componente encargado de identificar y priorizar las acciones que generan mayor valor para el usuario en el contexto actual.

Su misión consiste en transformar la inteligencia generada por arroba.com en acciones concretas, explicables y ejecutables.

Responde a una única pregunta.

> ¿Cuál es la mejor acción que debería realizar ahora?

No ejecuta acciones.

No modifica entidades.

No toma decisiones por el usuario.

Prioriza y presenta las acciones recomendadas por el Next Best Action Engine.

#### Responsabilidad

Representar una lista priorizada de acciones recomendadas.

Cada acción constituye una propuesta independiente.

Puede originarse a partir de:

- Company Intelligence
- Comparison Engine
- Opportunity Engine
- Signal Engine
- Transaction OS
- Matching Engine
- Agenda
- Copilot

#### Filosofía

Arroba no solo informa.

Ayuda a decidir.

Toda inteligencia debe poder transformarse en una acción.

#### Principios

##### Action First

Toda recomendación debe poder ejecutarse.

##### Explainability

Cada acción deberá explicar claramente por qué ha sido propuesta.

##### Context Aware

Las acciones dependen del contexto:

- empresa;
- operación;
- usuario;
- organización;
- momento.

##### Prioritized

Las acciones aparecen ordenadas por valor esperado.

Nunca cronológicamente.

#### Arquitectura funcional

Next Best Actions

↓

Action List

↓

Action Card

↓

Explanation

↓

Confidence

↓

Primary Action

↓

Secondary Actions

##### NBA-001 Action List

Representa el conjunto priorizado de acciones recomendadas.

##### NBA-002 Action Card

Cada tarjeta representa una única acción.

Incluye:

- título;
- descripción;
- confianza;
- impacto esperado;
- urgencia;
- origen.

##### NBA-003 Explanation

Explica por qué Arroba recomienda esa acción.

Debe estar respaldada por datos.

##### NBA-004 Confidence

Nivel de confianza calculado por el Intelligence Engine.

Expresado como porcentaje o nivel cualitativo.

##### NBA-005 Primary Action

Acción principal.

Ejemplos.

- Activar oportunidad
- Contactar comprador
- Solicitar valoración
- Descargar informe
- Abrir Data Room
- Iniciar Match
- Actualizar información

##### NBA-006 Secondary Actions

Acciones alternativas relacionadas.

Nunca sustituyen a la acción principal.

#### Estados

Loading

Ready

Empty

Error

#### UX Behaviour

Las acciones aparecen ordenadas por prioridad.

El usuario puede:

- ejecutar;
- posponer;
- descartar;
- solicitar explicación;
- preguntar al Copilot.

#### Business Rules

BR-13001-001

Todas las acciones proceden exclusivamente del Next Best Action Engine.

BR-13001-002

El frontend nunca calcula prioridades.

BR-13001-003

Cada acción mantiene una explicación verificable.

BR-13001-004

Toda acción posee un identificador único y trazabilidad.

BR-13001-005

Las acciones pueden caducar cuando cambia el contexto.

#### Integración Backend

Consume:

- Next Best Action Engine

Recibe contexto de:

- Company Entity
- Opportunity Engine
- Signal Engine
- Comparison Engine
- Transaction OS
- Matching Engine
- Copilot Context Engine

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente acciones priorizadas;
- explique el motivo de cada recomendación;
- permita ejecutar la acción principal;
- mantenga sincronización con el contexto activo;
- no implemente lógica de priorización.

#### Decisiones arquitectónicas

DA-13001-001

Las acciones nunca son reglas hardcodeadas.

Siempre son generadas por el Next Best Action Engine.

DA-13001-002

Toda acción debe ser explicable.

DA-13001-003

Una acción siempre debe poder convertirse en una operación dentro de arroba.com.

Fin de COMP-13001.

##### OC-006 Opportunity Timeline

#### Objetivo

Representar el recorrido previsto que seguirá una oportunidad una vez activada.

Su misión consiste en anticipar al usuario las siguientes fases del proceso y permitir comprender el impacto de su decisión.

Responde a una única pregunta.

> ¿Qué ocurrirá después de activar esta oportunidad?

#### Filosofía

Toda oportunidad representa un posible flujo de trabajo.

El usuario debe conocer desde el primer momento cuál será el recorrido previsto hasta alcanzar un resultado.

##### Representación

El Timeline representa exclusivamente el flujo recomendado por Arroba.

Ejemplo.

Opportunity

↓

Activar oportunidad

↓

Validación automática

↓

Preparación de información

↓

Contacto inicial

↓

Matching

↓

Transaction Workspace

↓

Data Room

↓

Due Diligence

↓

Closing

#### Estados

Cada fase podrá encontrarse en uno de los siguientes estados.

- Pendiente
- Disponible
- En curso
- Completada
- Bloqueada
- No aplicable

#### UX Behaviour

El Timeline se muestra expandido al abrir una oportunidad.

Cada fase permite consultar:

- objetivo;
- requisitos;
- información disponible;
- acciones relacionadas.

La fase actual aparece destacada.

Las fases futuras permanecen visibles para facilitar la planificación.

#### Business Rules

BR-11002-006

El Timeline procede exclusivamente del Next Best Action Engine y del Transaction OS.

BR-11002-007

El frontend nunca construye flujos.

BR-11002-008

Las fases pueden variar según el tipo de oportunidad.

Ejemplos.

- Buy & Build
- Venta
- Captación de capital
- Entrada de socio

Cada una posee un flujo específico.

#### Integración Backend

Consume:

- Next Best Action Engine
- Transaction OS
- Workflow Engine

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- represente el recorrido previsto de la oportunidad;
- identifique claramente la fase actual;
- permita comprender las siguientes acciones;
- permanezca sincronizado con el Transaction OS;
- no implemente lógica de workflow.

#### Decisiones arquitectónicas

DA-11002-004

Toda oportunidad mantiene asociado un Timeline de ejecución.

DA-11002-005

El Timeline constituye la transición entre Opportunity Engine y Transaction OS.

Nunca es generado por el frontend.

<a id="162-comp-13002-recommendation-explainability"></a>
### 16.2 COMP-13002 — Recommendation Explainability

---

id: COMP-13002

name: Recommendation Explainability

section: Intelligence

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Recommendation Explainability constituye el componente encargado de justificar de forma transparente cada Next Best Action propuesta por Arroba.

Su misión consiste en permitir que el usuario comprenda exactamente qué hechos, señales, comparativas y modelos han llevado al sistema a recomendar una determinada acción.

Responde a una única pregunta.

> ¿Por qué Arroba me recomienda hacer esto?

No genera recomendaciones.

No modifica prioridades.

No ejecuta acciones.

Explica exclusivamente las recomendaciones generadas por el Next Best Action Engine.

#### Responsabilidad

Cada recomendación mantiene asociada una explicación estructurada.

La explicación puede incluir:

- señales relevantes;
- oportunidades detectadas;
- métricas comparativas;
- indicadores financieros;
- contexto del mercado;
- estado de la operación;
- comportamiento histórico.

#### Filosofía

La confianza en la IA depende de su capacidad para explicar sus decisiones.

Toda recomendación deberá poder justificarse mediante información verificable.

#### Principios

##### Explainable AI

Ninguna recomendación carece de explicación.

##### Traceability

Cada argumento mantiene referencia a su fuente.

##### Evidence Based

Las explicaciones se construyen exclusivamente mediante hechos.

Nunca mediante opiniones.

##### Layered

La explicación podrá visualizarse en distintos niveles.

- Resumen ejecutivo.
- Explicación ampliada.
- Evidencias completas.

#### Arquitectura funcional

Recommendation Explainability

↓

Executive Reason

↓

Evidence List

↓

Supporting Signals

↓

Supporting Metrics

↓

Source References

##### RE-001 Executive Reason

Resumen ejecutivo.

Una única frase que explique la recomendación.

##### RE-002 Evidence List

Listado de evidencias utilizadas.

Cada evidencia representa un hecho verificable.

##### RE-003 Supporting Signals

Señales utilizadas para generar la recomendación.

##### RE-004 Supporting Metrics

Indicadores cuantitativos utilizados.

##### RE-005 Source References

Origen de cada evidencia.

Puede incluir:

- Iberinform
- Registro Mercantil
- Company Intelligence
- Opportunity Engine
- Comparison Engine
- Transaction OS

#### Estados

Loading

Ready

Empty

Error

#### UX Behaviour

La explicación aparece expandible.

El usuario puede profundizar progresivamente.

Cada evidencia puede abrir su origen.

#### Business Rules

BR-13002-001

Toda explicación procede exclusivamente del Explainability Engine.

BR-13002-002

El frontend nunca genera explicaciones.

BR-13002-003

Cada recomendación mantiene una explicación asociada.

BR-13002-004

Toda evidencia mantiene trazabilidad completa.

#### Integración Backend

Consume:

- Explainability Engine

Recibe información de:

- Next Best Action Engine
- Signal Engine
- Opportunity Engine
- Comparison Engine
- Company Intelligence Engine
- Transaction OS

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- explique completamente cada recomendación;
- permita navegar hasta las evidencias;
- mantenga trazabilidad completa;
- no implemente lógica de inferencia.

#### Decisiones arquitectónicas

DA-13002-001

Ninguna recomendación podrá presentarse sin explicación.

DA-13002-002

Toda explicación deberá poder auditarse completamente.

Fin de COMP-13002.

<a id="163-comp-13003-recommendation-prioritization"></a>
### 16.3 COMP-13003 — Recommendation Prioritization

---

id: COMP-13003

name: Recommendation Prioritization

section: Intelligence

status: Approved

owner: Product

version: 1.0

---

#### Objetivo

Recommendation Prioritization constituye el componente encargado de ordenar todas las recomendaciones generadas por Arroba según su valor esperado para el usuario.

Su misión consiste en garantizar que la acción mostrada como Next Best Action sea siempre la más relevante en el contexto actual.

Responde a una única pregunta.

> ¿Cuál es la siguiente mejor acción para este usuario en este momento?

No genera recomendaciones.

No ejecuta acciones.

No modifica workflows.

Prioriza exclusivamente las recomendaciones generadas por el Next Best Action Engine.

#### Responsabilidad

Evaluar todas las recomendaciones disponibles y construir un ranking dinámico.

La priorización considera múltiples dimensiones simultáneamente.

Ejemplos.

- impacto esperado;
- urgencia;
- probabilidad de éxito;
- esfuerzo requerido;
- contexto del usuario;
- estado de la operación;
- disponibilidad de información;
- confianza del modelo.

#### Filosofía

La mejor recomendación no es siempre la más rentable.

Es la que maximiza el valor esperado para el usuario en ese momento concreto.

#### Principios

##### Context First

La prioridad depende del contexto.

Nunca es fija.

##### Dynamic Ranking

La priorización cambia automáticamente cuando cambia el contexto.

##### Explainability

Toda prioridad debe poder explicarse.

##### Deterministic Ordering

Ante el mismo contexto, el orden obtenido siempre será el mismo.

#### Arquitectura funcional

Recommendation Prioritization

↓

Recommendation Queue

↓

Priority Score

↓

Business Impact

↓

Urgency

↓

Confidence

↓

Execution Cost

##### RP-001 Recommendation Queue

Lista ordenada de recomendaciones.

##### RP-002 Priority Score

Puntuación global utilizada para ordenar las recomendaciones.

El cálculo pertenece exclusivamente al backend.

##### RP-003 Business Impact

Valor esperado de la acción.

##### RP-004 Urgency

Nivel de urgencia asociado.

Ejemplos.

- Alta
- Media
- Baja

##### RP-005 Confidence

Nivel de confianza del modelo.

##### RP-006 Execution Cost

Estimación relativa del esfuerzo necesario para ejecutar la acción.

#### Estados

Loading

Ready

Empty

Error

#### UX Behaviour

El usuario visualizará únicamente la recomendación con mayor prioridad.

Podrá desplegar el resto de recomendaciones ordenadas.

Cada modificación del contexto recalculará automáticamente la cola.

#### Business Rules

BR-13003-001

La priorización pertenece exclusivamente al Next Best Action Engine.

BR-13003-002

El frontend nunca calcula prioridades.

BR-13003-003

Toda recomendación mantiene una prioridad única dentro de su contexto.

BR-13003-004

Las prioridades se recalculan automáticamente cuando cambia el contexto.

#### Integración Backend

Consume:

- Next Best Action Engine

Recibe contexto de:

- Company Intelligence Engine
- Opportunity Engine
- Signal Engine
- Comparison Engine
- Transaction OS
- User Context Engine

#### Acceptance Criteria

El componente se considerará correctamente implementado cuando:

- ordene correctamente todas las recomendaciones;
- mantenga un único Next Best Action activo;
- permita explicar el motivo de la prioridad;
- permanezca sincronizado con el contexto;
- no implemente lógica de priorización en el frontend.

#### Decisiones arquitectónicas

DA-13003-001

Solo puede existir un Next Best Action activo para un mismo contexto.

DA-13003-002

El resto de recomendaciones permanecen disponibles como alternativas priorizadas.

DA-13003-003

La priorización constituye una capacidad transversal reutilizable por toda la plataforma.

Fin de COMP-13003.