# arroba.com — Transaction OS Spec v1.0.0

> **Capa canónica**: *Engines & Specs* (entre Entity Framework y Design System; ver `ARROBA_PHILOSOPHY.md` §13 — pendiente de actualización al cierre del Sprint 0).
> **Fase del proyecto**: Sprint 0 · Fase 0.1 (primero de 6 specs).
> **Estado**: borrador para revisión humana.
> **Fecha**: 2026-06-25.
> **Autor canónico**: usuario (decisiones) + redacción técnica del agente.
>
> Este documento define la arquitectura funcional del **Transaction Operating System** (TOS): el ciclo completo de una operación corporativa en arroba.com, desde el análisis inicial hasta la integración post-deal. No define implementación. No define visual. Define qué fases existen, qué entidades intervienen, qué artefactos se producen, qué actores participan, qué permisos rigen, qué eventos se registran y cómo se gobierna el ciclo.
>
> **Documentos del Sprint 0 (orden secuencial)**:
> 1. **TRANSACTION_OS_SPEC** ← este documento
> 2. TRANSACTION_COPILOT_SPEC (pendiente)
> 3. COPILOTS_SPEC (pendiente)
> 4. MEMORY_ENGINE_SPEC (pendiente)
> 5. AGENTIC_LAYERS_SPEC (pendiente)
> 6. MONETIZATION_SPEC (pendiente)
>
> Las referencias a estos specs en el texto son **forward references**: el contrato lo declara este documento; la materialización vive en los siguientes.

---

## Índice

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Glosario canónico](#2-glosario-canónico)
3. [Principios arquitectónicos](#3-principios-arquitectónicos)
4. [Máquina de estados global](#4-máquina-de-estados-global)
5. [Las 15 fases canónicas](#5-las-15-fases-canónicas)
6. [Deal Workspace](#6-deal-workspace)
7. [Catálogo canónico de artefactos](#7-catálogo-canónico-de-artefactos)
8. [Permisos y visibilidad progresiva](#8-permisos-y-visibilidad-progresiva)
9. [Trazabilidad y audit](#9-trazabilidad-y-audit)
10. [Reglas de gobierno](#10-reglas-de-gobierno)
11. [Integración con otros specs](#11-integración-con-otros-specs)
12. [Versionado y evolución](#12-versionado-y-evolución)
13. [Anexo — Diagrama del ciclo completo](#13-anexo--diagrama-del-ciclo-completo)
14. [Anexo — Open Questions](#14-anexo--open-questions)

---

## 1. Propósito y alcance

### 1.1 Qué es el Transaction OS

El **Transaction Operating System (TOS)** es la infraestructura funcional de arroba.com que orquesta el **ciclo completo** de una operación corporativa M&A, desde el análisis de empresa inicial hasta la integración post-deal. No es un módulo aislado: es la capa transversal sobre la que reposan Empresa, Valoración, Oportunidad, Match y Operación.

El TOS materializa la frase del usuario:

> "arroba.com como Transaction Operating System: una infraestructura donde Arroba Copilot acompaña al usuario en el ciclo completo de una operación corporativa (analizar → valorar → encontrar → negociar → ejecutar → cerrar → integrar)."

### 1.2 Qué NO es el Transaction OS

El TOS **no es**:

- **Un marketplace**. No es un tablón donde se publican deals y se navegan por filtros. La superficie de descubrimiento existe (Marketplace, ver bloque `e` del inventario), pero está subordinada al ciclo TOS.
- **Un CRM**. No gestiona contactos sueltos, pipelines comerciales genéricos ni outreach masivo. El pipeline es contextual a una `Opportunity`, un `Match` o una `Operation`.
- **Un Data Room aislado**. El Data Room es una **capacidad** dentro de la fase de Due Diligence; no es el producto. Vive subordinado a la `Operation`.
- **Una suite de tres productos pegados con cinta** (marketplace + CRM + Data Room separados). Es **un sistema operativo transaccional unificado**: una sola máquina de estados, una sola memoria, un solo audit log, una sola capa agéntica que recorre todo el ciclo.

### 1.3 Posición en las capas canónicas

`ARROBA_PHILOSOPHY.md` §13 declara seis capas. Este Sprint 0 incorpora una **séptima capa** entre Entity Framework y Design System, llamada **Engines & Specs**, donde vivirán los 6 specs:

```
Blueprint Estratégico
   ↓
UX Blueprint
   ↓
Entity Framework  (ENTITY_MODEL + ENTITY_FRAMEWORK)
   ↓
Engines & Specs   ← este documento y los 5 siguientes
   ↓
Design System
   ↓
Diseños
   ↓
Implementación
```

La actualización formal de `ARROBA_PHILOSOPHY.md` §13 con esta capa adicional se ejecuta **al cierre del Sprint 0**, cuando los 6 specs estén aprobados. Hasta entonces, este spec asume la capa pero no modifica el documento jerárquico.

### 1.4 Alcance funcional

El TOS define, sin ambigüedad:

1. Qué fases existen en una operación M&A en arroba.com (las 15).
2. Qué entidades intervienen y cuándo (Empresa, Valoración, Oportunidad, **Match**, Operación, Documento, Mandato).
3. Qué máquina de estados gobierna cada entidad transaccional.
4. Qué artefactos canónicos se producen y consumen en cada fase.
5. Qué actores tienen qué permisos en qué fase sobre qué artefactos.
6. Qué eventos son canónicos para el audit log.
7. Cómo se gobiernan los abortos, pausas, retrocesos y abandonos.

El TOS **no define** (eso lo harán los specs 0.2-0.6):

- Cómo razona el Transaction Copilot dentro de una fase (→ `TRANSACTION_COPILOT_SPEC`).
- Qué copilots especializados se invocan en cada fase (→ `COPILOTS_SPEC`).
- Qué memoria se lee/escribe y dónde se persiste (→ `MEMORY_ENGINE_SPEC`).
- Qué nivel agéntico admite cada interacción (L1/L2/L3/L4) (→ `AGENTIC_LAYERS_SPEC`).
- Qué eventos generan ingresos y cómo se reparten (→ `MONETIZATION_SPEC`).

---

## 2. Glosario canónico

> Todos los términos definidos aquí tienen significado **exclusivo** en este spec. Si aparecen en otros documentos canónicos con un sentido distinto, prevalece el de este glosario para todo el dominio Transaction OS.

### 2.1 Términos del flujo

**Recomendación**
Sugerencia generada por la plataforma para emparejar un activo (empresa, oportunidad) con una contraparte potencial. Es **unidireccional** (sistema → usuario) y **no vinculante**. Una Recomendación expira si no es accionada. Genera 0..N intentos de match. **Una Recomendación no es un Match.**

**Compatibilidad**
Score numérico que cuantifica el potencial de fit entre dos activos (por ejemplo, una `Opportunity` y una `Company` candidata). Es una **señal**, no un compromiso. La Compatibilidad alimenta el motor de Recomendaciones. **Una Compatibilidad no es un Match.**

**Match** *(definición canónica — cita textual al usuario)*
> *"El Match representa el inicio formal de una posible operación. No representa una recomendación. No representa una similitud. No representa una oportunidad. Representa el momento en que comprador y vendedor aceptan mutuamente continuar. Desde ese instante nace una nueva entidad persistente dentro de arroba.com. A partir del Match comienza el Transaction OS."*

Aclaración canónica adicional aprobada por el usuario:

> *"El Match NO es un evento puntual. Es una entidad persistente de transición. Representa el acuerdo mutuo entre comprador y vendedor para iniciar una posible operación. Tiene identidad propia, estado, participantes, fechas, condiciones y trazabilidad. La Operación nace únicamente cuando el Match evoluciona hacia una transacción."*

Cardinalidad canónica: **1 `Opportunity` → N `Match` (0..N)** · **1 `Match` → 0..1 `Operation`**. Toda `Operation` nace de un `Match`. No toda `Opportunity` produce `Match`. No todo `Match` evoluciona a `Operation`.

`Match` es **entidad canónica de primer nivel** (su incorporación formal a `ENTITY_MODEL.md` se hace al cierre del Sprint 0).

**Opportunity / Oportunidad**
Entidad persistente que formaliza una **tesis de transacción potencial** (buy-side o sell-side) de un cliente. Una Opportunity puede no tener contraparte aún. Genera Recomendaciones que pueden o no derivar en Matches. Una Opportunity **puede abandonarse** sin haber generado ningún Match.

**Operation / Operación**
Entidad persistente que representa la **ejecución completa de una transacción** desde el Match hasta el final de la integración post-deal. Es el contenedor central del TOS post-Match. Su `current_phase` recorre las fases canónicas declaradas en `ENTITY_MODEL.md` §5.7.

**Transacción**
Sinónimo coloquial de Operación en lenguaje de usuario. Técnicamente, el dominio usa **Operation**. Esta dualidad se mantiene por compatibilidad con `ARROBA_PHILOSOPHY.md` §5/§6.

### 2.2 Artefactos del ciclo

**Teaser**
Documento anónimo (o semi-anónimo) que presenta una oportunidad de inversión sin revelar la identidad de la empresa. Se entrega tras Match. Visible al Buyer pre-NDA.

**NDA (Non-Disclosure Agreement)**
Acuerdo de confidencialidad bilateral. Firmado por ambas partes desbloquea acceso al Information Memorandum y al Data Room. Existen NDAs progresivos (escalonados por nivel de información revelada); el detalle vive en `NDA_SPEC.md` (laguna identificada).

**Information Memorandum (IM)**
Documento estructurado y exhaustivo sobre la empresa target, accesible solo post-NDA. Contiene datos financieros, comerciales, operativos, riesgos.

**IOI (Indication of Interest)** *(sub-estado opcional dentro de fase LOI/NBO)*
Comunicación **no vinculante** del Buyer expresando interés tras revisar el IM. No es un compromiso firme. Su uso es opcional; algunas operaciones saltan directamente a LOI/NBO. Compatibilidad hacia atrás con `ENTITY_MODEL.md` §5.7 (`current_phase` enum mantiene `ioi`).

**LOI (Letter of Intent) / NBO (Non-Binding Offer)**
Oferta **vinculante** en términos económicos esenciales (precio, estructura, condiciones suspensivas) con cláusulas de exclusividad temporal. La LOI/NBO **firmada por ambas partes** es el punto canónico en que el `Match` evoluciona a `Operation` (ver `[OPEN-A11]` en §14 y §4.4).

**Due Diligence (DD)**
Fase de revisión exhaustiva de la empresa target por parte del Buyer y sus asesores. Incluye análisis financiero, legal, fiscal, comercial, técnico, ESG.

**Data Room**
Repositorio documental seguro con permisos granulares, watermarks, audit de accesos. **Es una capacidad** (no entidad canónica, ver `ARROBA_PHILOSOPHY.md` §7) que vive dentro de la fase DD de una `Operation`. Su spec detallado: `DATAROOM_SPEC.md` (laguna).

**Q&A log**
Registro estructurado de preguntas del Buyer y respuestas del Seller durante DD. Inmutable una vez cerrado.

**SPA (Sale-Purchase Agreement)**
Contrato de compraventa **vinculante y definitivo**. Su firma por ambas partes formaliza el acuerdo legal de la operación, sujeto a condiciones suspensivas (closing).

**Closing**
Acto jurídico-económico en el que se ejecutan las contraprestaciones del SPA (pago, transferencia de acciones, formalización notarial). El Closing **cierra la fase legal** de la operación. **No cierra la entidad `Operation`**: la Operación permanece activa hasta el final de la integración post-deal.

**Integración post-operación**
Fase posterior al Closing en la que las partes ejecutan el plan de integración acordado (sistemas, equipos, gobernanza, sinergias). El cierre de esta fase es lo que termina el ciclo de vida de la `Operation` (estado `CERRADA_CON_ÉXITO`).

### 2.3 Actores

**Seller**
Parte vendedora. Puede ser una persona física propietaria, un equipo directivo, un fondo, una sociedad mercantil representada por sus apoderados. En el TOS, el Seller actúa típicamente desde una `Opportunity` sell-side o como dueño de una `Company` susceptible de venta.

**Buyer**
Parte compradora. Puede ser un industrial, un fondo, un family office, un comprador estratégico. Actúa típicamente desde una `Opportunity` buy-side.

**Advisor**
Profesional acreditado (M&A advisor, valuator, due-diligencer). En el TOS puede actuar **representando** al Seller, **representando** al Buyer, o **operando** un Mandato propio. Tiene su entidad canónica `advisor` (`ENTITY_MODEL.md` §3) y un copilot dedicado (`Advisor Copilot`, ver `COPILOTS_SPEC.md`).

**Equipo arroba** *(`arroba_team`)*
Operadores internos de la plataforma. Intervienen en moderación, mediación de disputas, validación de hitos críticos (NDA, SPA), soporte de incidencias. Marcar `[OPEN-A9]`: ¿es un rol Pydantic nuevo (`Role.arroba_team`) o sub-permiso del rol `admin`?

**Sistema** *(`system`)*
Actor no-humano que ejecuta acciones automatizadas autorizadas (notificaciones, transiciones automáticas, indexaciones, cobros). Las acciones del Sistema **siempre** dejan traza en el audit log.

### 2.4 Conceptos transversales

**Trazabilidad**
Capacidad de reconstruir, en cualquier momento, qué actor hizo qué acción sobre qué entidad/artefacto, cuándo y con qué consecuencia. Es **obligatoria** en todas las fases del TOS.

**Audit log**
Estructura inmutable que registra cada **evento canónico** (ver §9). Una entrada del audit log no puede modificarse ni borrarse — sólo añadirse otra entrada que la rectifica (con referencia explícita).

**Deal Workspace**
**Vista UX orquestadora** sobre una `Operation` (o sobre un `Match` activo aún no convertido en `Operation`). No es entidad canónica nueva (`ARROBA_PHILOSOPHY.md` §8: "Workspace = memoria, persistencia, contexto, entorno de trabajo. No es entidad."). Ver §6 para detalle.

**Reversibilidad acotada**
Política según la cual algunas transiciones permiten retroceder y otras no. Ej: pasar de IM a NDA no es legítimo (el conocimiento ya está revelado), pero pausar una operación en DD y reanudarla en DD sí lo es.

**Permisos progresivos**
Modelo de visibilidad que **se abre** a medida que avanzan las fases y se firman los artefactos correspondientes. Antes de NDA: visibilidad mínima. Post-NDA: visibilidad ampliada. Post-LOI: visibilidad casi total. Post-Closing: cualquier información sigue siendo accesible solo a las partes (no se vuelve pública).

---

## 3. Principios arquitectónicos

### 3.1 Entity First

Match, Operation y los artefactos canónicos (Teaser, NDA, IM, IOI, LOI, DD report, SPA, Closing memo, Integration plan) **son entidades** o **viven asociados a entidades**, no flotando en el chat ni en pantallas dispersas. Cumple `ARROBA_PHILOSOPHY.md` §2 ("Entity First en producto").

### 3.2 Estado explícito

Cada entidad transaccional (`Opportunity`, `Match`, `Operation`) tiene **un estado declarado** dentro de un enum cerrado. Las transiciones son explícitas, no implícitas. Nunca un estado se infiere de la presencia de un documento o de un timestamp.

### 3.3 Permisos progresivos

Lo que ve cada actor en cada momento depende de **(fase + estado + consentimiento explícito + artefactos firmados)**. La visibilidad **se abre** con el avance del proceso; nunca se "expande mágicamente" por inferencia del LLM.

### 3.4 Trazabilidad total

Toda acción que tenga consecuencia material en el ciclo (creación de entidad, transición de estado, firma de artefacto, invitación a contraparte, abandono, pausa) genera **al menos un** evento de audit log. Sin excepciones. Esta es la base de la auditabilidad legal del TOS.

### 3.5 Recomendación ≠ Match ≠ Operation

Tres conceptos distintos del ciclo de vida, con cardinalidades específicas:

```
Opportunity  ──genera──►  Recomendaciones  ──pueden originar──►  Match  ──puede evolucionar a──►  Operation
   (1)                          (N)                              (0..N)                          (0..1)
```

**Una Recomendación nunca se convierte directamente en Operation.** El paso por Match es obligatorio (ver §4 máquina de estados).

### 3.6 Reversibilidad acotada

Las transiciones del TOS se clasifican en:

- **Hacia adelante** (avance): permitidas si se cumplen condiciones (artefacto firmado, validación humana, etc.).
- **Pausa**: permitidas casi siempre (`EN_PAUSA`); la operación reanuda en el mismo estado.
- **Retroceso explícito**: permitidas **solo** en transiciones específicas declaradas en §4 y §10. La mayoría de transiciones **no admiten retroceso**.
- **Aborto / cancelación**: permitida en casi cualquier fase con consecuencias específicas (ver §10).

### 3.7 Inteligencia delegada

El TOS define **qué fases existen** y **qué transiciones son legítimas**, pero **no define cómo razona** la inteligencia dentro de una fase. La capa agéntica vive en:

- `TRANSACTION_COPILOT_SPEC` — orquestador conversacional general del TOS.
- `COPILOTS_SPEC` — copilots especializados (Company, Market, Valuation, Transaction, Advisor).
- `AGENTIC_LAYERS_SPEC` — los 4 niveles de autonomía (L1 conversacional · L2 preparación · L3 ejecución asistida · L4 automatización autorizada).

El TOS los **referencia**, no los define.

### 3.8 Boundary First

Las interacciones con sistemas externos se modelan como **contratos abstractos**, no como implementaciones de proveedor:

- **Firma electrónica** → capability "Firma con valor legal y trazabilidad probatoria". Proveedor concreto (DocuSign, EU eIDAS, etc.) se decide en implementación.
- **CIS (Contrato Inicial de Servicios)** → capability "Aceptación de condiciones plataforma vinculadas a Organization". Detalle en `CIS_SPEC.md` (laguna).
- **Billing** → capability "Captura de pagos + emisión de eventos económicos". Detalle en `MONETIZATION_SPEC.md`.
- **Almacenamiento de documentos** → capability "Object storage con permisos granulares y watermarks". Detalle en `DATAROOM_SPEC.md` (laguna).

Este principio replica el `Boundary First` ya usado en `agency_tool_adapter` (ver `_INVENTORY_2026.md` §2.4).

---

## 4. Máquina de estados global

### 4.1 Estados de `Opportunity` (pre-Match)

```
                     ┌──────────────────┐
                     │     BORRADOR     │   tesis aún no publicada / sin candidatas
                     └────────┬─────────┘
                              │ publicar
                              ▼
                     ┌──────────────────┐
              ┌─────►│      ACTIVA      │   genera Recomendaciones, screening en curso
              │      └────────┬─────────┘
              │ reactivar     │
              │               ├──► EN_PAUSA  ──reanudar──► ACTIVA
              │               │
              │               │ uno o más Matches creados
              │               ▼
              │      ┌──────────────────┐
              │      │  CON_MATCH(ES)   │   ≥1 Match vivo. La Opportunity sigue activa
              │      └────────┬─────────┘   (puede generar más Matches en paralelo)
              │               │
              │               │ abandono
              │               ▼
              └──────┐ ┌──────────────────┐
                     │ │    ABANDONADA    │   terminal — el cliente decide cerrar la tesis
                     │ └──────────────────┘
                     │
                     └─ archivar (admin) ──► ARCHIVADA (terminal)
```

### 4.2 Estados de `Match` (la mini-máquina aprobada por el usuario)

```
                  Opportunity activa genera Recomendaciones
                              │
                              │ Recomendación accionada por ambas partes
                              ▼
                     ┌──────────────────┐
                     │  PROPUESTO       │   una parte ha aceptado, la otra pendiente
                     └────────┬─────────┘
                              │ aceptación mutua
                              ▼
                     ┌──────────────────┐
              ┌─────►│     ACTIVO       │   acuerdo formal de continuar (Match canónico)
              │      └────────┬─────────┘
              │               │
   reanudar   │               ├──► EN_PAUSA  ──reanudar──► ACTIVO
              │               │
              │               │ progresan a Teaser / NDA / IM / Q&A / IOI
              │               ▼
              │      ┌────────────────────┐
              │      │   EN_EVOLUCIÓN     │   intercambio activo de información (T6→T9)
              │      └────────┬───────────┘
              │               │
              │               │ LOI/NBO firmada por ambas partes (fase 10)
              │               ▼
              │      ┌────────────────────────────┐
              │      │ CONVERTIDO_EN_OPERACIÓN    │   terminal exitoso del Match;
              │      └────────────────────────────┘   nace la Operation con `mandate_id` y
              │                                       hereda el Match.id como lineage
              │
              └──────────────► ABANDONADO (terminal) ── alguna parte se retira pre-LOI
                                                       o no se cumple condición temporal
```

Estados terminales de `Match`: `CONVERTIDO_EN_OPERACIÓN` (éxito) · `ABANDONADO` (no éxito) · `ARCHIVADO` (admin).

### 4.3 Estados de `Operation` (post-Match)

```
       Match.estado = CONVERTIDO_EN_OPERACIÓN
                  │
                  ▼
       ┌────────────────────────┐
       │  FORMALIZACIÓN_INICIAL │   se materializa el contenedor Operation; LOI ya firmada
       └──────────┬─────────────┘
                  │
                  ▼
       ┌────────────────────────┐
       │   DD_EN_CURSO          │   fase 11: Due Diligence + Data Room + Q&A
       └──────────┬─────────────┘
                  │
                  ▼
       ┌────────────────────────┐
       │   NEGOCIACIÓN          │   fase 12: ajustes finales, cláusulas, earn-out (ver [OPEN-A4])
       └──────────┬─────────────┘
                  │
                  ▼
       ┌────────────────────────┐
       │   SPA_FIRMADO          │   fase 13: contrato definitivo firmado, pendiente closing
       └──────────┬─────────────┘
                  │
                  ▼
       ┌────────────────────────┐
       │   CLOSING_LEGAL        │   fase 14: ejecución jurídica (notaría, transferencias)
       └──────────┬─────────────┘
                  │
                  ▼
       ┌────────────────────────┐
       │ INTEGRACIÓN_EN_CURSO   │   fase 15: ejecución del plan post-deal
       └──────────┬─────────────┘
                  │
                  ▼
       ┌────────────────────────┐
       │ CERRADA_CON_ÉXITO      │   terminal positivo
       └────────────────────────┘

       Transiciones laterales desde cualquier estado activo:
         ──► EN_PAUSA            (reanudable al mismo estado)
         ──► CERRADA_SIN_OPERACIÓN  (terminal — alguna parte se retira post-LOI)
         ──► CANCELADA           (terminal — cancelación administrativa/legal)
```

Estados terminales de `Operation`: `CERRADA_CON_ÉXITO` · `CERRADA_SIN_OPERACIÓN` · `CANCELADA` · `ARCHIVADA` (admin).

### 4.4 Punto de transición `Match → Operation` (decisión canónica)

**Propuesta canónica de este spec** (cubre `[OPEN-A11]`):

> El `Match` evoluciona a `Operation` en el momento en que la **LOI/NBO está firmada por ambas partes** (final de la fase 10).

**Razón**:

- Antes de la LOI/NBO, las partes están en exploración: pueden retirarse libremente sin consecuencias contractuales mayores. El Match cubre esa exploración bajo un acuerdo formal de continuar (`ACTIVO` / `EN_EVOLUCIÓN`).
- La LOI/NBO es el primer instrumento **vinculante** del proceso (con cláusulas de exclusividad, condiciones suspensivas, breakage fee si aplica). En este punto el compromiso es ya "una operación".
- Esta elección es **compatible** con `ENTITY_MODEL.md` §5.7, donde `Operation.current_phase` arranca en `matching` o posterior. El cambio canónico que introduce este spec: `matching` deja de ser un valor válido de `Operation.current_phase` (ese estado pasa a `Match`). El primer valor válido para `Operation.current_phase` es **`loi` (cuando la LOI/NBO está firmada por ambas partes)**.

**Alternativas consideradas y descartadas**:

- *Match → Operation tras NDA firmado (fase 7)*: demasiado pronto. Un NDA no compromete económicamente; las partes pueden retirarse sin obligación material. Tratarlo como Operation infla el conteo de operaciones reales.
- *Match → Operation tras SPA firmado (fase 13)*: demasiado tarde. Toda la DD, Q&A y negociación quedaría modelada como Match, lo que rompe la semántica del Match como "transición exploratoria" y carga al Match con responsabilidades que la entidad `Operation` debe asumir.

`[OPEN-A11]` queda abierto para confirmación del usuario; mi propuesta es la línea base de este spec.

### 4.5 Reglas de transición — quién puede disparar qué

> Notación: ✓ permitido sin condición · 🔒 permitido con condición declarada · ✗ prohibido.

| Transición | Seller | Buyer | Advisor (cualquier lado) | Equipo arroba | Sistema |
|---|---|---|---|---|---|
| Crear `Opportunity` | ✓ (sell-side) | ✓ (buy-side) | 🔒 con `Mandate` | ✗ | ✗ |
| `Opportunity.publicar` | ✓ | ✓ | 🔒 con `Mandate` | ✗ | ✗ |
| Generar Recomendaciones | ✗ | ✗ | ✗ | ✗ | ✓ (motor de matching) |
| Aceptar Recomendación → `Match.PROPUESTO` | ✓ | ✓ | 🔒 representando | ✗ | ✗ |
| `Match.PROPUESTO → ACTIVO` (aceptación mutua) | 🔒 (segunda parte) | 🔒 (segunda parte) | 🔒 representando | ✗ | ✓ (al detectar segunda firma) |
| `Match → EN_EVOLUCIÓN` (firma NDA) | 🔒 firma | 🔒 firma | 🔒 representando | ✗ | ✓ |
| `Match → CONVERTIDO_EN_OPERACIÓN` (LOI firmada) | 🔒 firma | 🔒 firma | 🔒 representando | 🔒 validación opcional | ✓ |
| `Operation → DD_EN_CURSO` | ✓ | ✓ | ✓ | ✗ | ✓ |
| `Operation → SPA_FIRMADO` | 🔒 firma | 🔒 firma | ✗ (solo asiste) | 🔒 validación opcional | ✓ |
| `Operation → CLOSING_LEGAL → INTEGRACIÓN` | 🔒 cumplir suspensivas | 🔒 cumplir suspensivas | ✗ | 🔒 verificación | ✓ |
| `Operation → CERRADA_CON_ÉXITO` | 🔒 ambas confirman | 🔒 ambas confirman | ✗ | 🔒 validación | ✓ |
| `Operation → CERRADA_SIN_OPERACIÓN` | ✓ unilateral post-LOI | ✓ unilateral post-LOI | ✗ | 🔒 mediación | ✗ |
| Cancelar (`Match` o `Operation → CANCELADA`) | ✓ unilateral | ✓ unilateral | ✗ | ✓ administrativa | ✗ |
| Pausar (`EN_PAUSA`) | ✓ | ✓ | 🔒 representando | ✓ | ✗ |
| Reanudar de `EN_PAUSA` | 🔒 ambas partes | 🔒 ambas partes | 🔒 representando | ✓ | ✗ |
| Archivar (terminal admin) | ✗ | ✗ | ✗ | ✓ (`admin`) | ✗ |

---

## 5. Las 15 fases canónicas

> Las fases **1–5 son pre-Match**: trabajan sobre Empresa, Valoración, Oportunidad y Recomendaciones. El TOS formal aún no ha arrancado.
> Las fases **6–15 son post-Match**: trabajan inicialmente sobre `Match`. A partir del momento en que la LOI/NBO se firma (final de fase 10), el contenedor activo pasa a ser `Operation`.

---

### Fase 1 — Análisis inicial

**Propósito**: el usuario (Seller o Buyer) entiende el activo (su empresa o las empresas candidatas). Es el punto de entrada al ecosistema arroba.

**Estado inicial requerido**: usuario autenticado con visibilidad a la ficha de Empresa.
**Estado final**: ficha de Empresa con `analisis` (narrative) actualizado, KPIs visibles, score y señales presentes.
**Actores principales**: Seller (sobre su empresa) o Buyer (sobre candidatas), Sistema, Company Copilot.

**Información consumida**:
- Datos de la ficha Empresa (Agency Tool / `master_companies_mock`).
- Histórico de conversaciones previas sobre la empresa (memoria de empresa).
- Señales públicas (`signals`).

**Información generada / artefactos**:
- Análisis narrativo (sección `narrative` de la ficha).
- Insights (sección `insights`).
- Conversación persistida (`company_conversations`).

**Herramientas utilizadas**:
- `Skill analyze` (existente).
- Bloques: NarrativeBlock, MetricsBlock, CompanyCard.

**Motores de IA implicados**:
- **Company Copilot** (L1 conversacional, L2 preparación de análisis). Detalle en `COPILOTS_SPEC.md`.

**Acciones automáticas**:
- Hidratar la ficha desde `EnrichCompanyAdapter`.
- Registrar consulta en historial del usuario.

**Acciones con aprobación explícita del usuario**:
- "Refrescar análisis" (rate-limited, generador de narrative).
- Guardar empresa en `watchlist`.

**Memoria utilizada**:
- **Memoria de empresa** (lectura/escritura): conversaciones, narrativas previas.
- **Memoria de usuario** (lectura/escritura): historial de consultas. Detalle en `MEMORY_ENGINE_SPEC.md`.

**Permisos por rol**:
- Anónimo: ficha pública parcial.
- Subscriber/Buyer/Seller/Advisor autenticado: ficha completa.
- Admin/`arroba_team`: ficha completa + metadatos de auditoría.

**Trazabilidad**:
- Evento `company.viewed` (qué usuario, qué empresa, cuándo).
- Evento `company.analysis_refreshed` (rate limiter + LLM call).

**Transiciones permitidas**:
- → Fase 2 (Valoración) si el usuario quiere cuantificar.
- → Fase 3 (Identificación) si el usuario ya tiene el activo claro y busca contrapartes.
- Sin transición (consulta puntual sin progresión).

**Riesgos / consideraciones**:
- Análisis basado en `mock` (Agency Tool no productivo). La calidad del análisis está condicionada por la fuente.

---

### Fase 2 — Valoración

**Propósito**: cuantificar el valor económico potencial del activo. Indicativa (rápida, deterministic) o avanzada (LLM/expert-assisted).

**Estado inicial requerido**: Empresa identificada y con datos financieros mínimos.
**Estado final**: entidad `Valuation` persistida y asociada a la `Company`.
**Actores principales**: Seller, Buyer, Advisor (cualquier rol con interés legítimo), Valuation Copilot.

**Información consumida**:
- Datos financieros de la Empresa (revenue, EBITDA, etc.).
- Comparables (otras empresas del sector).
- Método elegido (`revenue_multiple` · `ebitda_multiple` · `dcf` · `comparable_transactions`).

**Información generada / artefactos**:
- Entidad `Valuation` (con valor central + banda).
- Documento `Valuation report` (opcional).
- Bloque `ValuationBlock` en la ficha de Empresa.

**Herramientas utilizadas**:
- `Skill value` (existente, determinista).
- Skills futuros: DCF, múltiplos personalizados, screening por buyer profile (laguna en `_INVENTORY_2026.md` §5.2.1).

**Motores de IA implicados**:
- **Valuation Copilot** (L2 preparación: borradores de valoraciones avanzadas).

**Acciones automáticas**:
- Calcular valoración indicativa con `Skill value`.

**Acciones con aprobación explícita del usuario**:
- "Solicitar valoración avanzada" (toast "Próximamente: E1.8" en el código actual; capability futura).
- Aceptar/rechazar resultado de valoración.

**Memoria utilizada**:
- **Memoria de empresa**: histórico de valoraciones.
- **Memoria de valoración** (si la valoración tiene ficha propia).

**Permisos por rol**:
- Valoración indicativa: cualquier autenticado.
- Valoración avanzada: solo dueño de la Empresa, Advisor con Mandato, o Buyer con `Match.ACTIVO` sobre la Empresa.

**Trazabilidad**:
- Evento `valuation.created` (id, method, central_value, requested_by).

**Transiciones permitidas**:
- → Fase 3 (identificación de contrapartes).
- → Fase 5 (Matching directo si la valoración alimentaba una Opportunity ya activa).
- Sin transición (valoración puntual de referencia).

**Riesgos / consideraciones**:
- Valoración indicativa no debe interpretarse como compromiso de precio.
- Auditoría legal: la `Valuation` debe quedar fechada y referenciada en `lineage` si llega a usarse en una LOI.

---

### Fase 3 — Identificación y búsqueda de compradores/vendedores compatibles

**Propósito**: el usuario formaliza su intención (vender o comprar) en una `Opportunity` y arranca el motor de búsqueda de contrapartes.

**Estado inicial requerido**: usuario autenticado con plan que habilite creación de `Opportunity` (ver `MONETIZATION_SPEC`).
**Estado final**: entidad `Opportunity` creada en estado `ACTIVA`.
**Actores principales**: Seller o Buyer, Advisor (si actúa con `Mandate`), Market Copilot, Opportunity Advisor.

**Información consumida**:
- La Empresa target (sell-side) o los criterios de búsqueda (buy-side: sectores, territorios, ticket size, tesis).
- Mandato (si el Advisor actúa en representación).

**Información generada / artefactos**:
- Entidad `Opportunity`.
- Tesis formalizada (texto narrativo + criterios estructurados).

**Herramientas utilizadas**:
- Formulario de creación de Opportunity (UX).
- `Skill recommend` (existente, alimenta el motor de matching de la fase 5).

**Motores de IA implicados**:
- **Market Copilot** (análisis de mercado / sector / territorio): contexto para definir tesis.
- **Opportunity Advisor** (copilot especializado de la entidad Opportunity, ver `COPILOTS_SPEC.md`).

**Acciones automáticas**:
- Inicialización de candidatas en `Opportunity.candidate_company_ids` (vacío o pre-poblado).

**Acciones con aprobación explícita del usuario**:
- Publicar Opportunity (de `BORRADOR` a `ACTIVA`).
- Definir criterios de exclusión.

**Memoria utilizada**:
- **Memoria de usuario**: tesis previas, sectores favoritos.
- **Memoria de oportunidad**: se inicializa aquí.

**Permisos por rol**:
- Seller: crea sell-side Opportunity sobre su propia empresa o empresa que controle.
- Buyer: crea buy-side Opportunity con criterios libres.
- Advisor: crea cualquier side con `Mandate` válido.

**Trazabilidad**:
- Evento `opportunity.created`.
- Evento `opportunity.published`.

**Transiciones permitidas**:
- → Fase 4 (Screening) cuando aparezcan candidatas.
- → `EN_PAUSA` (pausar la búsqueda).
- → `ABANDONADA` (cerrar la tesis).

**Riesgos / consideraciones**:
- Tesis ambiguas generan recomendaciones malas. El Market Copilot debe ayudar a estructurar.

---

### Fase 4 — Screening y priorización de candidatos

**Propósito**: refinar la lista de candidatas, descartar las inviables, priorizar por compatibilidad.

**Estado inicial requerido**: `Opportunity.ACTIVA` con al menos 1 candidata.
**Estado final**: `Opportunity.candidate_company_ids` filtrada y priorizada; `pipeline_stage_by_company_id` actualizado.
**Actores principales**: dueño de la Opportunity, Advisor (si aplica), Market Copilot.

**Información consumida**:
- Datos enriquecidos de candidatas (ficha Empresa).
- Compatibilidad (score del motor de matching).
- Criterios del usuario (exclusiones, tags).

**Información generada / artefactos**:
- Lista priorizada de candidatas (`Opportunity.candidate_company_ids` ordenada).
- Razones de descarte (auditadas).

**Herramientas utilizadas**:
- Skill recommend (existente).
- Skills futuros: screenings avanzados.

**Motores de IA implicados**:
- **Opportunity Advisor / Market Copilot**: razonamientos de fit, riesgo, exclusiones.

**Acciones automáticas**:
- Cálculo continuo de Compatibilidad para candidatas nuevas.
- Sugerencia de descartes evidentes (filtros duros).

**Acciones con aprobación explícita del usuario**:
- Aprobar/rechazar candidata.
- Reordenar prioridad.
- Marcar candidata como `out_of_scope`.

**Memoria utilizada**:
- **Memoria de oportunidad**: razones de descarte, conversaciones de screening.

**Permisos por rol**:
- Solo el dueño de la Opportunity y su Advisor (si tiene Mandate vinculado).

**Trazabilidad**:
- Evento `opportunity.candidate_added`.
- Evento `opportunity.candidate_excluded` (con motivo).
- Evento `opportunity.candidate_priority_changed`.

**Transiciones permitidas**:
- → Fase 5 (Matching) cuando el dueño decide accionar candidatas concretas.
- → Vuelta a fase 3 si la tesis necesita reformularse.

**Riesgos / consideraciones**:
- Sesgo del motor de matching. Se debe permitir override humano siempre.

---

### Fase 5 — Matching

**Propósito**: la plataforma genera **Recomendaciones** (sistema → usuario) entre la `Opportunity` y candidatas priorizadas. Si una recomendación obtiene **aceptación mutua** del Seller y el Buyer correspondientes, **nace un `Match`** (estado inicial `ACTIVO`).

**Estado inicial requerido**: `Opportunity.ACTIVA` con candidatas priorizadas (fase 4 ejecutada).
**Estado final (positivo)**: ≥ 1 `Match` en estado `ACTIVO` asociado a la `Opportunity`.
**Actores principales**: Seller y Buyer (ambos requeridos para aceptación mutua), Advisor (representando), Sistema (motor de matching), Market Copilot, Opportunity Advisor.

**Información consumida**:
- Compatibility scores.
- Disponibilidad/interés activo de la contraparte.
- Restricciones de exclusividad existentes.

**Información generada / artefactos**:
- Recomendaciones (efímeras o persistidas según política).
- **Entidad `Match`** (estado inicial `PROPUESTO`, transita a `ACTIVO` con aceptación mutua).

**Herramientas utilizadas**:
- Motor de matching (`MARKETPLACE_SPEC.md` — laguna).
- UI de aceptación de Recomendación.

**Motores de IA implicados**:
- **Market Copilot / Opportunity Advisor** (L2 preparación de las Recomendaciones con razones).
- **Sistema** ejecuta el matching scoring.

**Acciones automáticas**:
- Generar Recomendaciones según criterios.
- Detectar aceptación mutua y transitar `Match.PROPUESTO → ACTIVO`.

**Acciones con aprobación explícita del usuario**:
- Aceptar una Recomendación (paso 1: una parte).
- Aceptar la contra-Recomendación (paso 2: la otra parte → nace `Match.ACTIVO`).
- Rechazar Recomendación (con motivo, opcional).

**Memoria utilizada**:
- **Memoria de oportunidad**: histórico de recomendaciones y aceptaciones.
- **Memoria de match**: se inicializa al transicionar a `ACTIVO`.

**Permisos por rol**:
- Recomendaciones visibles solo al dueño de la Opportunity correspondiente.
- Aceptación mutua: requiere acción explícita de ambas partes (no se infiere).
- Equipo arroba puede mediar pero no aceptar en nombre de las partes.

**Trazabilidad**:
- Evento `recommendation.generated`.
- Evento `recommendation.accepted_by_party` (qué parte).
- Evento **`match.created`** (inmutable, ver §9).

**Transiciones permitidas**:
- → Fase 6 (Teaser) automáticamente al transicionar `Match → ACTIVO`.
- Vuelta a fase 4 si todas las recomendaciones son rechazadas.

**Riesgos / consideraciones**:
- Garantizar que la aceptación es **mutua y consciente** — no inferible por silencio.
- Anti-spam: una parte que rechaza N veces a la misma contraparte debe poder bloquearla.

---

### Fase 6 — Acceso al Teaser

**Propósito**: el Buyer accede al Teaser anónimo o semi-anónimo del activo. El Seller controla qué se revela en este nivel.

**Estado inicial requerido**: `Match.ACTIVO`.
**Estado final**: Buyer ha consumido el Teaser; `Match` transita conceptualmente a `EN_EVOLUCIÓN` (si decide avanzar) o `ABANDONADO` (si declina).
**Actores principales**: Buyer (lector), Seller (autor / aprobador), Advisor (si lo asiste), Transaction Copilot.

**Información consumida**:
- Ficha de Empresa (extractos anonimizables).
- Valoración (si el Seller decide exponer rango).

**Información generada / artefactos**:
- **Artefacto `Teaser`** (Documento canónico, ver §7).
- Registro de acceso del Buyer al Teaser.

**Herramientas utilizadas**:
- Skill futuro: "Generar teaser anónimo" (laguna, L2 preparación).
- Anonimizador de campos.

**Motores de IA implicados**:
- **Transaction Copilot** (L2 preparación del Teaser draft).
- **Company Copilot** (fuente de datos de la empresa).

**Acciones automáticas**:
- Registro de acceso al Teaser.
- Watermarks por usuario consumidor.

**Acciones con aprobación explícita del usuario**:
- Seller: aprobar Teaser para liberación.
- Buyer: solicitar avance al NDA.
- Buyer: declinar (transita el Match a `ABANDONADO`).

**Memoria utilizada**:
- **Memoria de match**: conversaciones, accesos.
- **Memoria de empresa**: lineage del teaser (qué datos se incluyeron).

**Permisos por rol**:
- Buyer del Match: lectura.
- Seller del Match: lectura + edición pre-aprobación.
- Equipo arroba: lectura (auditoría).
- Resto: prohibido.

**Trazabilidad**:
- Evento `teaser.released`.
- Evento `teaser.accessed_by_buyer`.
- Evento `match.entered_evolution` (al solicitar avance al NDA).

**Transiciones permitidas**:
- → Fase 7 (NDA) si el Buyer solicita avanzar.
- `Match → ABANDONADO` si el Buyer declina.
- Pausa.

**Riesgos / consideraciones**:
- Filtración de identidad si el Teaser no está bien anonimizado. **`[OPEN-A10]`**: ¿el Teaser puede mostrarse a usuarios no registrados? Propuesta inicial: **NO** — el Teaser solo es visible post-Match. Para superficie pública, se usa la ficha pública parcial (sin Teaser propietario).

---

### Fase 7 — Firma del NDA

**Propósito**: ambas partes firman un Non-Disclosure Agreement que desbloquea el acceso al Information Memorandum y al Data Room.

**Estado inicial requerido**: `Match.EN_EVOLUCIÓN`, Teaser consumido, Buyer ha solicitado avance.
**Estado final**: NDA firmado por ambas partes; visibilidad expandida automáticamente.
**Actores principales**: Buyer, Seller, Advisor (si actúa por delegación), Equipo arroba (testigo opcional), capability de firma electrónica.

**Información consumida**:
- Plantilla NDA (Boundary First: proveedor de plantilla / firma se decide en impl).
- Identidades de ambas partes.

**Información generada / artefactos**:
- **Documento `NDA`** (canónico, `Document.kind = "nda"`, `signed_by_ids = [seller, buyer]`).
- Evento `nda.signed` (inmutable, ver §9).

**Herramientas utilizadas**:
- Capability firma electrónica.
- Plantilla NDA (estándar inicial; `NDA_SPEC.md` — laguna).

**Motores de IA implicados**:
- **Transaction Copilot** (L3 ejecución asistida: "Confirmar firma" con aprobación humana explícita).
- **Advisor Copilot** (L2 revisión de la plantilla).

**Acciones automáticas**:
- Abrir acceso a IM y Data Room una vez verificada la doble firma.
- Notificar a contraparte y advisors.

**Acciones con aprobación explícita del usuario**:
- Cada parte firma (acción manual con consentimiento informado).

**Memoria utilizada**:
- **Memoria de match**: el NDA firmado queda referenciado.
- **Memoria de empresa**: opcional — el Seller ve qué buyers tienen NDA activo.

**Permisos por rol**:
- Buyer y Seller del Match: ambos deben firmar.
- Advisors: pueden revisar pero no firmar en nombre (excepto con poder específico documentado).
- Equipo arroba: lectura (auditoría).

**Trazabilidad**:
- Evento `nda.template_loaded`.
- Evento `nda.signed_by_party` (cada parte).
- Evento **`nda.fully_signed`** (inmutable, dispara expansión de permisos).

**Transiciones permitidas**:
- → Fase 8 (IM) al completar la doble firma.
- Aborto: `Match.ABANDONADO` si una parte no firma en ventana acordada.

**Riesgos / consideraciones**:
- NDA progresivo: estructura de NDAs por nivel de revelación (NDA-básico, NDA-completo). Detalle en `NDA_SPEC.md` (laguna P0).

---

### Fase 8 — Acceso al Information Memorandum (IM)

**Propósito**: el Buyer accede al Information Memorandum: documento exhaustivo y estructurado sobre la empresa target.

**Estado inicial requerido**: NDA firmado por ambas partes (`nda.fully_signed`).
**Estado final**: Buyer ha consumido el IM; decisión de avanzar (a Q&A / IOI / LOI) o declinar.
**Actores principales**: Buyer (consumidor), Seller (autor), Advisor (si asiste), Transaction Copilot.

**Información consumida**:
- Datos completos de la ficha Empresa.
- Valoraciones aplicables.
- Documentos asociados (memoria mercantil, financieros).

**Información generada / artefactos**:
- **Documento `Information Memorandum`** (canónico, `Document.kind = "im"`).
- Registro de accesos del Buyer.

**Herramientas utilizadas**:
- Skill futuro: "Generar IM draft" (L2 preparación).
- Editor estructurado de IM.

**Motores de IA implicados**:
- **Transaction Copilot** (L2 borrador del IM).
- **Company Copilot** (datos fuente).

**Acciones automáticas**:
- Indexar IM en el Data Room.
- Watermarks por acceso.

**Acciones con aprobación explícita del usuario**:
- Seller: aprobar IM para liberación.
- Buyer: solicitar avance a Q&A / oferta.

**Memoria utilizada**:
- **Memoria de match**: histórico de accesos y conversaciones sobre el IM.

**Permisos por rol**:
- Buyer post-NDA: lectura completa.
- Seller: lectura + edición pre-aprobación.
- Advisors (con NDA propio): lectura.
- Equipo arroba: lectura (auditoría).

**Trazabilidad**:
- Evento `im.released`.
- Evento `im.accessed_by_buyer` (cada acceso, con timestamp).

**Transiciones permitidas**:
- → Fase 9 (Q&A) — natural.
- → Fase 10 (LOI/NBO) directamente si el Buyer tiene clara su oferta.
- Aborto: `Match.ABANDONADO`.

**Riesgos / consideraciones**:
- Filtración: el IM es el documento más sensible pre-LOI. Watermarks + audit log obligatorios.

---

### Fase 9 — Preguntas y respuestas (Q&A)

**Propósito**: intercambio estructurado entre Buyer y Seller para aclarar puntos del IM antes de avanzar a oferta.

**Estado inicial requerido**: IM consumido por el Buyer.
**Estado final**: Q&A log cerrado o pausado; el Buyer dispone de información suficiente para emitir oferta.
**Actores principales**: Buyer (preguntador), Seller (respondedor), Advisors de ambos lados, Transaction Copilot.

**Información consumida**:
- Preguntas del Buyer (libre o pre-estructuradas).
- Datos de la Empresa, IM, valoraciones.

**Información generada / artefactos**:
- **Artefacto `Q&A log`** (estructurado, asociado al Match).

**Herramientas utilizadas**:
- UI de preguntas estructuradas.
- Skill futuro: "DD questions auto" (L2 — generador de preguntas estándar).

**Motores de IA implicados**:
- **Transaction Copilot** (L2 sugerencia de preguntas estándar por sector).
- **Advisor Copilot** (L2 ayuda al Seller a estructurar respuestas).

**Acciones automáticas**:
- Indexar Q&A log con tags por categoría (financieros, legales, comerciales, etc.).

**Acciones con aprobación explícita del usuario**:
- Buyer envía pregunta.
- Seller envía respuesta (con aprobación de su Advisor opcional).
- Cierre del Q&A log (mutuo).

**Memoria utilizada**:
- **Memoria de match**: Q&A log persistido.
- Posiblemente **Memoria de empresa**: respuestas relevantes generales se propagan al lineage.

**Permisos por rol**:
- Buyer y Seller del Match: lectura/escritura.
- Advisors: lectura/escritura representando a su parte.
- Equipo arroba: lectura (auditoría).

**Trazabilidad**:
- Evento `qa.question_posted`.
- Evento `qa.answer_posted`.
- Evento `qa.log_closed`.

**Transiciones permitidas**:
- → Fase 10 (LOI/NBO) cuando el Buyer está listo para emitir oferta.
- Pausa.
- Aborto.

**Riesgos / consideraciones**:
- Sesgo: el Seller puede omitir o demorar respuestas críticas. El audit log preserva la evidencia.

---

### Fase 10 — Presentación de la Oferta Indicativa (LOI / NBO)

**Propósito**: el Buyer emite una oferta. El sub-estado **IOI (opcional)** permite indicar interés no vinculante antes de la LOI/NBO vinculante. La LOI/NBO firmada por ambas partes es el **punto canónico de transición `Match → Operation`**.

**Estado inicial requerido**: Q&A suficiente o Buyer dispuesto a saltar Q&A.
**Estado final**: LOI/NBO firmada por ambas partes ⇒ nace la `Operation` (transición canónica).
**Actores principales**: Buyer (emisor), Seller (receptor + contraoferente), Advisors, capability de firma electrónica.

#### Sub-estados de fase 10

```
[IOI (opcional)] ──► LOI_PRESENTADA ──► LOI_ACEPTADA            ╗
                                  ──► LOI_NEGOCIADA ──► ...     ║ punto de transición
                                  ──► LOI_RECHAZADA             ╝ Match → Operation
```

- **IOI** (opcional, no vinculante): el Buyer comunica interés con un rango de precio. No es compromiso.
- **LOI_PRESENTADA**: el Buyer firma una oferta vinculante con cláusulas (precio, exclusividad, condiciones suspensivas).
- **LOI_ACEPTADA**: el Seller la firma sin cambios ⇒ transición `Match → Operation` (`Operation.current_phase = loi`).
- **LOI_NEGOCIADA**: el Seller propone contra-condiciones; vuelve a `LOI_PRESENTADA` con nuevos términos.
- **LOI_RECHAZADA**: el Seller la rechaza; `Match → ABANDONADO` (o vuelta a Q&A).

**Información consumida**:
- IM, Q&A log, Valoración(es) de referencia.

**Información generada / artefactos**:
- (opcional) **Documento `IOI`** (`Document.kind = "ioi"`).
- **Documento `LOI/NBO`** (`Document.kind = "loi"`, `signed_by_ids = [buyer, seller]`).
- **Entidad `Operation`** (nace al firmar ambas partes).

**Herramientas utilizadas**:
- Plantilla LOI (`LOI_SPEC.md` — laguna).
- Capability firma electrónica.
- Skill futuro: "LOI draft" (L2 preparación).

**Motores de IA implicados**:
- **Transaction Copilot** (L2 draft LOI, comparator si hay multi-bidder).
- **Advisor Copilot** (L2 revisión de cláusulas).

**Acciones automáticas**:
- Verificar doble firma → crear `Operation` y migrar contexto del `Match` (memoria, accesos, audit).
- Notificar a partes interesadas.

**Acciones con aprobación explícita del usuario**:
- Buyer: presentar IOI/LOI.
- Seller: aceptar/negociar/rechazar.
- Ambos: firmar LOI definitiva.

**Memoria utilizada**:
- **Memoria de match**: LOI lineage.
- **Memoria de operación**: nace al firmar.

**Permisos por rol**:
- Buyer y Seller: emitir/recibir.
- Advisors: revisar.
- Equipo arroba: validación opcional crítica (ver §10).

**Trazabilidad**:
- Evento `ioi.presented` (opcional).
- Evento `loi.presented`.
- Evento `loi.negotiated`.
- Evento `loi.rejected` (terminal del Match).
- Evento **`loi.fully_signed`** (inmutable, dispara transición `Match → Operation`).
- Evento **`match.converted_to_operation`** (inmutable, ver §9).
- Evento `operation.created`.

**Transiciones permitidas**:
- → Fase 11 (DD) tras LOI firmada.
- `Match.ABANDONADO` si LOI rechazada y no hay reapertura.
- Pausa.

**Riesgos / consideraciones**:
- Exclusividad temporal: la LOI suele incluir cláusula de exclusividad. La plataforma debe **prevenir** que el Seller acepte LOIs simultáneas de varios Buyers durante el plazo de exclusividad.

---

### Fase 11 — Due Diligence (DD)

**Propósito**: revisión exhaustiva del Buyer (y sus asesores) sobre la empresa target. Incluye **Data Room** como repositorio central + interacciones de análisis.

**Estado inicial requerido**: `Operation.FORMALIZACIÓN_INICIAL`.
**Estado final**: DD report emitido, hallazgos consolidados.
**Actores principales**: Buyer + advisors del Buyer (financieros, legales, fiscales, técnicos), Seller (proveedor de información), Transaction Copilot.

**Información consumida**:
- Documentos del Data Room (financieros completos, contratos, laboral, fiscal, propiedad intelectual, ESG, etc.).
- Q&A log fase 9.

**Información generada / artefactos**:
- **Documento `DD report`** (`Document.kind = "dd_report"`).
- **Q&A log de DD** (continuación del de fase 9 o nuevo).
- Hallazgos clasificados (red flags, yellow flags, ok).

**Herramientas utilizadas**:
- Data Room (`DATAROOM_SPEC.md` — laguna).
- Skill futuro: "Análisis de Data Room" (L2).
- Skill futuro: "Comparación de contratos" (L2).

**Motores de IA implicados**:
- **Transaction Copilot** (L2 análisis automatizado de documentos).
- **Advisor Copilot** (L2 estructura de hallazgos).

**Acciones automáticas**:
- Indexar documentos del Data Room.
- Watermarks por usuario y por documento.
- Audit de cada acceso.

**Acciones con aprobación explícita del usuario**:
- Subir documento al Data Room (Seller).
- Solicitar documento adicional (Buyer).
- Cerrar DD (Buyer, con o sin red flags).

**Memoria utilizada**:
- **Memoria de operación**: hallazgos, Q&A.
- **Memoria de empresa**: documentos relevantes pueden quedar en lineage de la ficha (con flags de confidencialidad).

**Permisos por rol**:
- Buyer + advisors del Buyer: lectura del Data Room.
- Seller + advisors del Seller: escritura del Data Room.
- Equipo arroba: lectura (auditoría).

**Trazabilidad**:
- Evento `dataroom.opened`.
- Evento `dataroom.document_uploaded`.
- Evento `dataroom.document_accessed` (cada acceso, por usuario).
- Evento `dd.report_emitted`.

**Transiciones permitidas**:
- → Fase 12 (Negociación) tras DD report.
- Pausa.
- `Operation.CERRADA_SIN_OPERACIÓN` si red flags terminales.

**Riesgos / consideraciones**:
- DD prolongada erosiona el deal. La plataforma debe tracker el "tiempo en DD" como KPI visible.

---

### Fase 12 — Negociación

**Propósito**: ajuste final de términos del SPA: precio, estructura, earn-out, garantías, indemnities, condiciones suspensivas, cláusulas de no competencia. **`[OPEN-A4]`**: ¿se añade como valor `current_phase = "negotiation"` al enum o se modela como sub-estado interno entre `dd` y `spa`? Propuesta del spec: **añadir** `negotiation` al enum, ya que el usuario la declara explícitamente como fase canónica.

**Estado inicial requerido**: DD report emitido.
**Estado final**: términos del SPA acordados, draft listo para firma.
**Actores principales**: Buyer, Seller, Advisors de ambos lados (centrales en esta fase), Transaction Copilot, Advisor Copilot.

**Información consumida**:
- DD report.
- LOI/NBO vinculante.
- Valoraciones de referencia actualizadas.

**Información generada / artefactos**:
- Drafts del SPA (versionados).
- Acuerdos parciales (earn-out, ajustes, garantías).

**Herramientas utilizadas**:
- Editor colaborativo de SPA draft.
- Skill futuro: "Earn-out clauses" (L2).
- Skill futuro: "Comparación de contratos" (L2).

**Motores de IA implicados**:
- **Advisor Copilot** (L2 propuestas de cláusulas, L3 redacción asistida con confirmación).
- **Transaction Copilot** (L1 conversacional, L2 resúmenes).

**Acciones automáticas**:
- Versionado automático del SPA draft.
- Diff entre versiones.

**Acciones con aprobación explícita del usuario**:
- Cada cambio de cláusula requiere aprobación de ambos lados.
- Cerrar negociación → habilitar firma SPA.

**Memoria utilizada**:
- **Memoria de operación**: drafts, decisiones por cláusula.

**Permisos por rol**:
- Buyer + Advisors Buyer: lectura/escritura representando.
- Seller + Advisors Seller: lectura/escritura representando.
- Equipo arroba: lectura (auditoría).

**Trazabilidad**:
- Evento `spa.draft_versioned` (con autor + diff).
- Evento `spa.clause_agreed`.
- Evento `negotiation.closed`.

**Transiciones permitidas**:
- → Fase 13 (firma SPA).
- Pausa.
- `Operation.CERRADA_SIN_OPERACIÓN` si negociación rota.

**Riesgos / consideraciones**:
- Conflictos de interés Advisor ↔ parte representada. El audit debe registrar quién propuso qué.

---

### Fase 13 — Firma del SPA

**Propósito**: ambas partes firman el SPA (Sale-Purchase Agreement) definitivo. Es el contrato vinculante final.

**Estado inicial requerido**: SPA draft consensuado.
**Estado final**: SPA firmado por ambas partes; condiciones suspensivas activas.
**Actores principales**: Buyer, Seller (firmantes), Advisors (testigos), Equipo arroba (validación crítica), capability firma electrónica con valor legal.

**Información consumida**:
- SPA draft consensuado.
- Identidades, poderes, validaciones legales.

**Información generada / artefactos**:
- **Documento `SPA`** (`Document.kind = "spa"`, `signed_by_ids = [seller, buyer]`).

**Herramientas utilizadas**:
- Capability firma electrónica con valor legal (notarial si aplica).

**Motores de IA implicados**:
- **Advisor Copilot** (L2 último review pre-firma).
- **Transaction Copilot** (L3 ejecución asistida — coordinación de la firma).

**Acciones automáticas**:
- Verificación de doble firma.
- Bloquear edición del documento firmado (inmutabilidad post-firma, `ENTITY_MODEL.md` §7.3).
- Activar condiciones suspensivas declaradas.

**Acciones con aprobación explícita del usuario**:
- Cada firma (con consentimiento informado).

**Memoria utilizada**:
- **Memoria de operación**: SPA firmado queda en lineage permanente.

**Permisos por rol**:
- Buyer y Seller: firman.
- Advisors: revisión final.
- Equipo arroba: validación crítica opcional (sello de auditoría externa).

**Trazabilidad**:
- Evento `spa.signed_by_party`.
- Evento **`spa.fully_signed`** (inmutable, crítico).

**Transiciones permitidas**:
- → Fase 14 (Closing legal).
- `Operation.CANCELADA` si no se cumplen condiciones suspensivas en plazo.

**Riesgos / consideraciones**:
- Inmutabilidad post-firma estricta. Cualquier modificación posterior es addendum versionado, no edición.

---

### Fase 14 — Closing legal

**Propósito**: ejecución de las contraprestaciones del SPA: pago, transferencia de acciones/participaciones, formalización notarial, cumplimiento de condiciones suspensivas.

**Estado inicial requerido**: SPA firmado, condiciones suspensivas cumpliéndose.
**Estado final**: Closing declarado; cierre jurídico de la operación. **La `Operation` NO pasa a estado terminal aquí.**
**Actores principales**: Buyer, Seller (ejecutores), Advisors, Notario / fedatario (Boundary), Banco (Boundary).

**Información consumida**:
- SPA.
- Verificaciones de condiciones suspensivas.
- Confirmaciones bancarias / notariales.

**Información generada / artefactos**:
- **Documento `Closing memo`** (registro del cierre con todas las pruebas).
- Confirmaciones de pago y transferencia.

**Herramientas utilizadas**:
- Capability boundary con notaría / fedatario.
- Capability boundary con bancos (eventos de pago).
- Tracker de condiciones suspensivas.

**Motores de IA implicados**:
- **Transaction Copilot** (L1 explicaciones al usuario sobre el cierre).
- **Sistema** (verificación automática de hitos).

**Acciones automáticas**:
- Marcar cada condición suspensiva cumplida.
- Disparar evento `monetization.closing_event` (ver `MONETIZATION_SPEC`).

**Acciones con aprobación explícita del usuario**:
- Confirmación de pago recibido (Seller).
- Confirmación de transferencia ejecutada (Buyer).
- Declaración formal de Closing.

**Memoria utilizada**:
- **Memoria de operación**: Closing memo, eventos económicos.

**Permisos por rol**:
- Buyer y Seller: ejecutan y confirman.
- Advisors: asisten.
- Equipo arroba: validación obligatoria (sello).

**Trazabilidad**:
- Evento `closing.condition_met` (por cada condición).
- Evento **`closing.declared`** (inmutable, dispara billing y transición a fase 15).
- Evento `monetization.fee_due` (ver `MONETIZATION_SPEC`).

**Transiciones permitidas**:
- → Fase 15 (Integración) — automática tras Closing declarado.
- `Operation.CANCELADA` si una condición suspensiva no se cumple en plazo definitivo.

**Riesgos / consideraciones**:
- Fee de cierre (Finder Fee / Success Fee) se devenga aquí (detalle en `MONETIZATION_SPEC.md`).
- Ausencia del Closing no equivale a cancelación inmediata — hay margen de plazo.

---

### Fase 15 — Integración post-operación

**Propósito**: ejecución del plan de integración post-deal acordado entre las partes (sistemas, equipos, gobernanza, sinergias). Su cierre marca el fin definitivo del ciclo de vida de la `Operation`.

**Estado inicial requerido**: `Closing.declared`.
**Estado final**: `Operation.CERRADA_CON_ÉXITO` cuando la integración se declara completada.
**Actores principales**: Buyer (típicamente lidera), Seller (apoyo decreciente), Advisors (asisten), Transaction Copilot.

**Información consumida**:
- SPA (cláusulas de integración).
- Plan de integración acordado.

**Información generada / artefactos**:
- **Documento `Integration plan`** (con hitos, owners, deadlines).
- Reportes de progreso periódicos.

**Herramientas utilizadas**:
- Tracker de hitos.
- Skill futuro: "Integración post-deal" (L2 — automatización de check-ins).

**Motores de IA implicados**:
- **Transaction Copilot** (L1 conversacional, L2 borradores de reportes, L4 recordatorios autorizados).

**Acciones automáticas**:
- Recordatorios de hitos (L4, previa autorización del usuario).
- Reportes periódicos de progreso.

**Acciones con aprobación explícita del usuario**:
- Marcar hito cumplido.
- Declarar integración completada (acuerdo de ambas partes).

**Memoria utilizada**:
- **Memoria de operación**: cierre permanente.
- **Memoria de empresa**: la operación queda en el lineage de la empresa target.

**Permisos por rol**:
- Buyer + Seller: ejecutores.
- Advisors: asistencia.
- Equipo arroba: lectura (auditoría).

**Trazabilidad**:
- Evento `integration.milestone_completed`.
- Evento **`integration.completed`** (inmutable, dispara `Operation.CERRADA_CON_ÉXITO`).
- Evento `operation.closed_with_success`.

**Transiciones permitidas**:
- → `Operation.CERRADA_CON_ÉXITO` (terminal positivo).
- Pausa.
- `Operation.CERRADA_SIN_OPERACIÓN` si la integración aborta tras Closing (caso atípico, requiere intervención Equipo arroba).

**Riesgos / consideraciones**:
- Esta fase suele extenderse meses o años. El TOS debe permitir reducir intensidad de seguimiento progresivamente.
- En caso de integración fallida post-Closing, la entidad `Operation` queda registrada como ejecutada legalmente (SPA firmado, Closing declarado) pero con integración no exitosa. Esa distinción es legalmente relevante.

---

## 6. Deal Workspace

### 6.1 Naturaleza

El **Deal Workspace** es la **vista UX orquestadora** sobre una entidad transaccional activa (`Match` en fases 6-10 antes de la conversión, o `Operation` en fases 10-15). **No es entidad canónica nueva.** Respeta `ARROBA_PHILOSOPHY.md` §8 ("Workspace = memoria/persistencia/contexto; no es entidad").

`[OPEN-A7]`: ¿la URL canónica es `/operacion/{id}` (Entity Framework §11.8 ya declarado) y el "Deal Workspace" es simplemente el nombre que damos a la composición de los 12 módulos del Entity Framework sobre Operation? Propuesta inicial del spec: **sí**, no se crea URL nueva. El "Deal Workspace" es **la ficha `/operacion/{id}`**. Cuando el contenedor activo es aún `Match` (fases 6-10 pre-LOI), la URL es `/match/{id}` (ruta nueva a declarar al cierre del Sprint 0).

### 6.2 Acceso y vistas por actor

Cada actor ve un Deal Workspace **proyectado** según su rol y la fase actual:

| Actor | Vista del Deal Workspace |
|---|---|
| **Buyer** | Foco en Teaser → IM → Q&A → DD findings → SPA negotiation. Acceso al Data Room (lectura). |
| **Seller** | Foco en estado del proceso, contrapartes activas, documentos pendientes. Acceso al Data Room (escritura). |
| **Advisor** | Vista de su lado representado (Buyer o Seller); más herramientas de copilot. |
| **Equipo arroba** | Vista completa con audit visible. Sin capacidad de firmar en nombre. |
| **Sistema** | No-vista; ejecuta jobs. |

### 6.3 Composición por fase

El Deal Workspace **reutiliza los 12 módulos del Entity Framework** (`ENTITY_FRAMEWORK.md` §11.8 para Operation). Activos por fase:

| Fase | Módulos clave activos |
|---|---|
| 6 Teaser | Header (anonimizado) · Hero (resumen) · Documentación (Teaser único) · Acciones ("Solicitar avance al NDA") |
| 7 NDA | Header · Documentación (NDA pendiente) · Acciones ("Firmar") · Actividad |
| 8 IM | Header · Documentación (IM disponible) · Análisis · Acciones |
| 9 Q&A | Header · Actividad (Q&A timeline) · Acciones |
| 10 LOI | Header · Documentación (IOI/LOI drafts) · Actividad · Acciones |
| 11 DD | Header · KPIs (días, docs pendientes) · Documentación (Data Room) · Señales (hallazgos) · Acciones |
| 12 Negociación | Header · Documentación (SPA drafts) · Actividad · Acciones |
| 13 SPA | Header · Documentación (SPA pendiente firma) · Acciones |
| 14 Closing | Header · KPIs (condiciones suspensivas) · Actividad · Acciones |
| 15 Integración | Header · KPIs (hitos) · Actividad (progreso) · Acciones |

### 6.4 Conexión con Memory Engine y Copilots

El Deal Workspace **lee y escribe** en:

- **Memoria de match** (fases 6-10 pre-LOI).
- **Memoria de operación** (post-LOI hasta cierre).
- **Memoria compartida entre copilots** (cuando intervienen Company / Market / Valuation / Advisor copilots — ver `COPILOTS_SPEC.md`).

El Deal Workspace **no almacena estado propio**: es **proyección** de la entidad subyacente.

---

## 7. Catálogo canónico de artefactos

| # | Artefacto | Document.kind | Fase que lo produce | Fase(s) consumidoras | Inmutable post-firma |
|---|---|---|---|---|---|
| 1 | Memoria mercantil | `mercantile_memory` | Fase 1 (fuente externa) | 1, 2, 6, 8 | No (snapshot por descarga) |
| 2 | Valuation report | (anexo) | 2 | 5, 10, 12 | No (versionable) |
| 3 | Teaser | `teaser` | 6 | 6, 7 | Sí, cuando se libera |
| 4 | NDA | `nda` | 7 | 7-15 | **Sí** (post-firma) |
| 5 | Information Memorandum (IM) | `im` | 8 | 8-13 | Sí, cuando se libera |
| 6 | Q&A log | (estructurado, no doc) | 9 + 11 | 9-15 (referencias) | Inmutable al cerrarse |
| 7 | IOI (opcional) | `ioi` | 10 (sub-estado) | 10 | Sí, cuando se emite |
| 8 | LOI / NBO | `loi` | 10 | 10-15 | **Sí** (post-firma) |
| 9 | DD report | `dd_report` | 11 | 11-15 | Sí, cuando se emite |
| 10 | SPA | `spa` | 12 (drafts) → 13 (firma) | 13-15 | **Sí** (post-firma) |
| 11 | Closing memo | (canónico nuevo) | 14 | 14-15 | Sí |
| 12 | Integration plan | (canónico nuevo) | 15 | 15 | No (versionable) |
| 13 | Match certificate | (canónico nuevo) | Fin de fase 5 | 6-15 | Sí (inmutable desde su creación) |
| 14 | Mandate | (referencia a entidad) | Pre-fase 3 (opcional) | 3-15 | Inmutable post-firma cliente↔advisor |
| 15 | Audit log entries | (eventos) | Todas las fases | Auditoría | **Sí siempre** |

**Notas**:
- Los `Document.kind` con asterisco (Closing memo, Integration plan, Match certificate) son **kinds canónicos nuevos** a añadir al enum de `ENTITY_MODEL.md` §5.9 al cierre del Sprint 0.
- "Inmutable post-firma" sigue `ENTITY_MODEL.md` §7.3.

---

## 8. Permisos y visibilidad progresiva

### 8.1 Matriz global resumen

Notación: `R` lectura · `W` escritura · `S` firma · `─` sin acceso.

| Artefacto | Pre-Match (público) | Match.PROPUESTO | Match.ACTIVO (T6) | Post-NDA (T7+) | Post-LOI (Operation T10+) | Post-SPA (T13+) | Post-Closing | Post-Integración |
|---|---|---|---|---|---|---|---|---|
| Ficha pública Empresa | `R` (todos) | `R` | `R` | `R` | `R` | `R` | `R` | `R` |
| Datos completos Empresa | `─` | `─` Buyer · `R` Seller | `R` Buyer · `R` Seller | `R` ambos | `R` ambos | `R` ambos | `R` ambos | `R` ambos |
| Teaser | `─` | `─` | `R` Buyer · `RW` Seller | `R` | `R` | `R` | `R` | `R` |
| NDA | `─` | `─` | `─` | `RS` ambos | `R` (firmado) | `R` | `R` | `R` |
| IM | `─` | `─` | `─` | `R` Buyer · `RW` Seller | `R` ambos | `R` | `R` | `R` |
| Q&A log | `─` | `─` | `─` | `RW` ambos | `RW` ambos | `R` (cerrado) | `R` | `R` |
| IOI | `─` | `─` | `─` | `─` | `R` ambos | `R` | `R` | `R` |
| LOI | `─` | `─` | `─` | `─` | `RWS` ambos | `R` (firmada) | `R` | `R` |
| Data Room | `─` | `─` | `─` | `─` | `R` Buyer · `RW` Seller | `R` ambos | `R` ambos | `R` ambos |
| DD report | `─` | `─` | `─` | `─` | `─` | `RW` (en fase 11) | `R` | `R` |
| SPA (draft) | `─` | `─` | `─` | `─` | `─` | `RW` ambos (T12) | `R` (firmado) | `R` |
| SPA (firmado) | `─` | `─` | `─` | `─` | `─` | `─` | `R` | `R` |
| Closing memo | `─` | `─` | `─` | `─` | `─` | `─` | `R` | `R` |
| Integration plan | `─` | `─` | `─` | `─` | `─` | `─` | `─` | `RW` ambos |
| Audit log (sus propias acciones) | `R` | `R` | `R` | `R` | `R` | `R` | `R` | `R` |
| Audit log (completo del Match/Operation) | `─` | `─` | `─` | `─` | `─` | `─` | `R` parte | `R` parte |

### 8.2 Reglas de gating canónicas

- **Identidad Empresa target** queda anonimizada en Teaser; se revela tras NDA firmado.
- **IM** no visible hasta NDA firmado (`nda.fully_signed`).
- **Data Room** no visible hasta LOI firmada (`loi.fully_signed`) ⇒ `Operation` activa.
- **SPA draft** no editable hasta DD report emitido.
- **Closing memo** no accesible hasta `closing.declared`.
- **Integration plan** se materializa post-Closing.

### 8.3 Excepciones controladas

- **Equipo arroba** puede consultar artefactos pre-firma para mediación de disputas, con audit visible a las partes (`audit.team_arroba_accessed`).
- **Admin** puede acceder a cualquier artefacto **post-Closing** para auditoría regulatoria; cualquier acceso queda en audit.

`[OPEN-A10]` Teaser anónimo: ¿permitir vista pública del Teaser anonimizado? Propuesta canónica de este spec: **NO**. Pre-Match no hay Teaser; la superficie pública sólo expone la ficha parcial estándar.

---

## 9. Trazabilidad y audit

### 9.1 Eventos canónicos del Audit Log

Lista exhaustiva (extensible solo por nueva versión del spec):

**Pre-Match**:
- `company.viewed`
- `company.analysis_refreshed`
- `valuation.created`
- `opportunity.created`
- `opportunity.published`
- `opportunity.candidate_added` / `_excluded` / `_priority_changed`
- `recommendation.generated`
- `recommendation.accepted_by_party`

**Match**:
- **`match.created`** ★ inmutable crítico
- `match.entered_active`
- `match.entered_evolution`
- `match.paused` / `match.resumed`
- `match.abandoned`
- **`match.converted_to_operation`** ★ inmutable crítico

**Fases TOS post-Match**:
- `teaser.released` / `teaser.accessed_by_buyer`
- **`nda.fully_signed`** ★ inmutable crítico
- `im.released` / `im.accessed_by_buyer`
- `qa.question_posted` / `qa.answer_posted` / `qa.log_closed`
- `ioi.presented`
- `loi.presented` / `loi.negotiated` / `loi.rejected`
- **`loi.fully_signed`** ★ inmutable crítico (dispara nacimiento de Operation)
- `operation.created`
- `dataroom.opened` / `dataroom.document_uploaded` / `dataroom.document_accessed`
- `dd.report_emitted`
- `spa.draft_versioned` / `spa.clause_agreed`
- `negotiation.closed`
- **`spa.fully_signed`** ★ inmutable crítico
- `closing.condition_met`
- **`closing.declared`** ★ inmutable crítico (dispara billing y fase 15)
- `monetization.fee_due`
- `integration.milestone_completed`
- **`integration.completed`** ★ inmutable crítico
- `operation.closed_with_success`
- `operation.closed_without_success`
- `operation.cancelled` (genérico)
- `operation.paused` / `operation.resumed`

**Gobierno**:
- `arroba_team.accessed`
- `admin.action_taken`

### 9.2 Inmutabilidad

Los eventos marcados con ★ son **inmutables y críticos**. Una vez emitidos no pueden modificarse ni eliminarse. Cualquier rectificación se hace con un evento adicional explícito que cite el evento original.

Resto de eventos: inmutables por defecto. Cualquier necesidad de "rectificación" genera un nuevo evento de tipo `audit.correction` con referencia al `event_id` corregido.

### 9.3 Acceso al audit log

| Quién | Qué ve |
|---|---|
| Cada parte | Sus propias acciones + acciones que la afectan (NDA firmado por contraparte, LOI presentada hacia ella, etc.) |
| Advisor representando | Lo mismo que su parte representada |
| Equipo arroba | Vista parcial relevante para mediación (cuando hay incidencia) |
| Admin | Acceso total (con `admin.audit_accessed` registrado) |

### 9.4 Retención

Audit log se conserva **mínimo 10 años** post-cierre de la Operation (compliance M&A). Detalle de retención y archivado en `MEMORY_ENGINE_SPEC.md`.

---

## 10. Reglas de gobierno

### 10.1 Inicio de operación

Quién puede iniciar el ciclo TOS (es decir, crear una `Opportunity` o aceptar una Recomendación que genere un Match):

- **Subscriber/Corporate/Investor**: con plan activo que habilite (ver `MONETIZATION_SPEC`).
- **Advisor**: con `Mandate` válido.
- **Equipo arroba / Admin**: no inician operaciones (sólo intervienen para soporte/moderación).

### 10.2 Aborto y cancelación

- **Cancelar `Opportunity`** (pre-Match): unilateral, sin consecuencias.
- **Abandonar `Match`** (pre-LOI): unilateral, queda en audit; la contraparte se notifica.
- **Cancelar `Operation` post-LOI**: con consecuencias contractuales declaradas en LOI/NBO (breakage fee, exclusividad rota). El sistema persiste el estado `CERRADA_SIN_OPERACIÓN` con motivo.
- **Cancelación administrativa** (`Equipo arroba` / `Admin`): por incumplimiento de términos plataforma, fraude detectado, requerimiento legal. Audit y notificación obligatorios.

### 10.3 Pausa

- Cualquier parte puede solicitar pausa.
- La pausa **conserva** estado, artefactos, accesos.
- Reanudar requiere acción de **ambas** partes (excepto pausa unilateral en fases pre-NDA).
- Pausa indefinida (> 12 meses): auto-cancelación con notificación previa. `[OPEN-A8]` confirmar plazo.

### 10.4 Abandono unilateral

- **Pre-NDA**: libre. Audit registra.
- **Post-NDA**: la parte que abandona queda registrada; consecuencias reputacionales (ver bloque `j` del inventario).
- **Post-LOI**: implicaciones legales según LOI/NBO firmada.
- **Post-SPA**: implicaciones legales según SPA (típicamente penalizaciones severas).

### 10.5 Intervención Equipo arroba

Se activa por:

- Solicitud explícita de una parte (mediación).
- Detección automática de incidencia (red flag por el motor).
- Petición legal / regulatoria.

Capacidades de Equipo arroba: lectura, anotaciones, congelar entidad temporalmente, escalar a Admin. **No firma en nombre.**

### 10.6 Intervención Advisor

- Solo si existe `Mandate` activo asociado al actor representado.
- Capacidad de propuesta y revisión; firma solo con poder específico documentado.
- Advisors de ambos lados pueden coexistir en un Match/Operation.

### 10.7 Reversibilidad

Transiciones reversibles (con condiciones):

| Transición | Reversible | Condición |
|---|---|---|
| Cualquier estado activo → EN_PAUSA → mismo estado | ✓ | ambas partes acuerdan reanudar |
| LOI_PRESENTADA → LOI_NEGOCIADA → LOI_PRESENTADA | ✓ | negociación iterativa |
| NDA firmado → "olvidar" NDA | ✗ | información ya revelada, irreversible |
| LOI firmada → "deshacer" LOI | ✗ | salir solo vía LOI_RECHAZADA → Match.ABANDONADO o cancelación |
| SPA firmado → "deshacer" SPA | ✗ | solo vía addendum versionado |
| Closing declarado → reabrir | ✗ | irreversible salvo orden judicial |

---

## 11. Integración con otros specs

### 11.1 Conexión con `TRANSACTION_COPILOT_SPEC` (0.2)

El TRANSACTION_COPILOT_SPEC definirá el comportamiento del **Transaction Copilot** como orquestador conversacional general dentro del TOS. Este spec le entrega:

- El catálogo de fases (§5) que debe conocer.
- La máquina de estados (§4) que debe respetar.
- Los artefactos (§7) que puede ayudar a producir.
- Los eventos canónicos (§9) que debe emitir cuando dispare acciones.

### 11.2 Conexión con `COPILOTS_SPEC` (0.3)

El COPILOTS_SPEC definirá los **5 copilots especializados**: Company / Market / Valuation / Transaction / Advisor. Este spec declara, por fase, cuáles intervienen:

| Fase | Copilots invocados |
|---|---|
| 1 Análisis | Company |
| 2 Valoración | Valuation, Company |
| 3 Identificación | Market, Opportunity (sub-variante de Market) |
| 4 Screening | Market, Opportunity |
| 5 Matching | Market, Opportunity |
| 6 Teaser | Transaction, Company |
| 7 NDA | Transaction, Advisor |
| 8 IM | Transaction, Company |
| 9 Q&A | Transaction, Advisor |
| 10 LOI | Transaction, Advisor, Valuation |
| 11 DD | Transaction, Advisor, Company |
| 12 Negociación | Advisor (central), Transaction |
| 13 SPA | Advisor, Transaction |
| 14 Closing | Transaction |
| 15 Integración | Transaction |

### 11.3 Conexión con `MEMORY_ENGINE_SPEC` (0.4)

Tipos de memoria que el MEMORY_ENGINE_SPEC debe definir y este spec referencia:

- **Memoria de empresa** (fases 1, 2, 6, 8, 11; lineage permanente).
- **Memoria de valoración** (fase 2; vinculada a empresa).
- **Memoria de oportunidad** (fases 3-5).
- **Memoria de match** (fases 5-10 pre-LOI).
- **Memoria de operación** (fases 10-15).
- **Memoria de usuario** (transversal a todas las fases para personalización).
- **Memoria de advisor** (asociada al rol; histórico transversal).
- **Memoria compartida entre copilots** (capa de contexto cruzado).
- **Audit log** (persistencia inmutable, retención 10 años).

### 11.4 Conexión con `AGENTIC_LAYERS_SPEC` (0.5)

Por fase, los niveles agénticos permitidos (referencia, detalle en AGENTIC_LAYERS_SPEC):

| Fase | L1 | L2 | L3 | L4 |
|---|---|---|---|---|
| 1 Análisis | ✓ | ✓ | — | — |
| 2 Valoración | ✓ | ✓ | — | — |
| 3 Identificación | ✓ | ✓ | — | — |
| 4 Screening | ✓ | ✓ | ✓ | — |
| 5 Matching | ✓ | ✓ | ✓ | — |
| 6 Teaser | ✓ | ✓ | — | — |
| 7 NDA | ✓ | ✓ | ✓ | — |
| 8 IM | ✓ | ✓ | — | — |
| 9 Q&A | ✓ | ✓ | ✓ | — |
| 10 LOI | ✓ | ✓ | ✓ | — |
| 11 DD | ✓ | ✓ | ✓ | ✓ (notificaciones) |
| 12 Negociación | ✓ | ✓ | ✓ | — |
| 13 SPA | ✓ | ✓ | ✓ | — |
| 14 Closing | ✓ | ✓ | — | ✓ (verificación condiciones suspensivas) |
| 15 Integración | ✓ | ✓ | ✓ | ✓ (recordatorios hitos) |

Convención: ✓ permitido por política · — no aplicable o explícitamente prohibido en esta fase. Detalle del **scope de L4** en cada fase: `AGENTIC_LAYERS_SPEC.md`.

### 11.5 Conexión con `MONETIZATION_SPEC` (0.6)

Eventos del TOS que generan eventos económicos (detalle de pricing, splits, taxes en MONETIZATION_SPEC):

| Evento canónico | Tipo de cobro | Quién paga | Quién recibe |
|---|---|---|---|
| `match.created` | (Opcional) Match fee | Buyer y/o Seller | Plataforma |
| `nda.fully_signed` | (Opcional) Access fee al IM | Buyer | Plataforma |
| `loi.fully_signed` | (Opcional) Engagement fee | Buyer | Plataforma |
| **`closing.declared`** | **Success Fee / Finder Fee** | Seller (típicamente) o ambos | Plataforma + Advisors (revenue share) |
| `integration.completed` | (Opcional) Retention fee | Buyer | Plataforma |

### 11.6 Conexión con specs de Boundary (lagunas P0/P1 fuera del Sprint 0)

- `NDA_SPEC.md` (P0): plantillas NDA progresivos, fases de revelación.
- `CIS_SPEC.md` (P0): condiciones generales plataforma, aceptación por organización.
- `DATAROOM_SPEC.md` (P1): permisos, watermarks, índices.
- `LOI_SPEC.md` (P1): plantilla LOI, comparator multi-bidder.
- `MARKETPLACE_SPEC.md` (P1): motor de matching, scoring.

Estos specs **no son** parte del Sprint 0 — son lagunas P0/P1 declaradas en `_INVENTORY_2026.md` §7.

---

## 12. Versionado y evolución

### 12.1 Versión del TOS

Este documento es **`v1.0.0`**. Cambios futuros:

- **v1.0.x (patch)**: clarificaciones, correcciones tipográficas, ajustes en redacción sin cambio funcional.
- **v1.x.0 (menor)**: ajuste interno a una fase existente (más detalle, refinamiento de permisos, nuevo evento de audit). No cambia el contrato externo.
- **v2.0.0 (mayor)**: cambio en el conjunto de fases (añadir/eliminar/reordenar), cambio en la máquina de estados global, cambio en la cadena `Opportunity → Match → Operation`. Requiere migración explícita de operaciones en curso.

### 12.2 Operaciones en curso al cambiar de versión

- Cambios **patch** y **menor**: las operaciones en curso continúan con el spec activo en su creación; los cambios se aplican automáticamente.
- Cambios **mayor (v2.0)**: las operaciones en curso **se completan con su spec original** salvo que el usuario solicite migración explícita y la migración esté formalizada en un `migration_plan` del documento.

### 12.3 Política de deprecaciones

Una fase del flujo no puede eliminarse "en silencio". Si se decide eliminarla:

1. Marcar la fase como `deprecated` en el documento.
2. Mantener compatibilidad **2 versiones menores** mínimo (operaciones nuevas no la usan; en curso siguen).
3. Eliminar en v2.0.0 explícita.

---

## 13. Anexo — Diagrama del ciclo completo

```
═══════════════════════════════════════════════════════════════════════════════
                            CICLO TRANSACTION OS — 15 FASES
═══════════════════════════════════════════════════════════════════════════════

──── PRE-MATCH ────────────────────────────────────────────────────────────────

  Empresa     Valoración    Opportunity    Opportunity   Opportunity+Match
    │             │              │              │              │
    ▼             ▼              ▼              ▼              ▼
  [ T1 ]  ──►  [ T2 ]  ──►   [ T3 ]   ──►   [ T4 ]   ──►   [ T5 ]
  Análisis    Valoración    Identif.       Screening    Matching
   inicial                  + búsqueda     + prioriz.   (genera
                            contrapartes                Recomend.
                                                        → MATCH)

──── TRANSACTION OS FORMAL (sobre Match, luego Operation) ─────────────────────

   ┌─────────────────────────── MATCH activo ──────────────────────────────┐
   │                                                                       │
   ▼                                                                       │
[ T6 ] ──► [ T7 ] ──► [ T8 ] ──► [ T9 ] ──► [ T10 ] ╗                      │
 Teaser     NDA        IM        Q&A         IOI    ║ ◄── transición       │
                                            (opt)  ║      Match → Operation│
                                             LOI/   ║      (LOI fully_signed)
                                             NBO    ║                      │
                                                    ╚══════════════════════╝
                                                              │
                                  ────── OPERATION activa ────┘
                                                              ▼
                                                          [ T11 ]
                                                           DD + Data Room
                                                              │
                                                              ▼
                                                          [ T12 ]
                                                           Negociación
                                                              │
                                                              ▼
                                                          [ T13 ]
                                                           SPA firmado
                                                              │
                                                              ▼
                                                          [ T14 ]
                                                           Closing legal
                                                              │
                                                              ▼
                                                          [ T15 ]
                                                           Integración
                                                              │
                                                              ▼
                                                   ┌─────────────────────┐
                                                   │ CERRADA_CON_ÉXITO   │
                                                   └─────────────────────┘

Estados terminales alternativos en cualquier fase activa:
  EN_PAUSA  (reanudable)
  CERRADA_SIN_OPERACIÓN  (alguna parte se retira post-LOI)
  CANCELADA  (administrativa / legal)
  ARCHIVADA  (admin)

Eventos críticos inmutables (★):
  match.created · match.converted_to_operation · nda.fully_signed ·
  loi.fully_signed · spa.fully_signed · closing.declared · integration.completed

═══════════════════════════════════════════════════════════════════════════════
```

---

## 14. Anexo — Open Questions

Lista consolidada de decisiones funcionales que este documento **no resuelve** y deben cerrarse en pasos posteriores. Marcar resolución con fecha y referencia al spec que la cierra.

| ID | Pregunta | Propuesta del spec | Estado |
|---|---|---|---|
| ~~A1~~ | ¿Match es entidad o evento? | Entidad persistente de transición | **CERRADO** por usuario 2026-06-25 |
| ~~A2~~ | Cardinalidad Match ↔ Operation | 1 Match → 0..1 Operation | **CERRADO** por usuario 2026-06-25 |
| ~~A3~~ | IOI vs LOI: separadas o fusionadas | IOI sub-estado opcional dentro de fase LOI/NBO | **CERRADO** por usuario 2026-06-25 |
| **A4** | "Negociación" (fase 12): ¿enum valor en `Operation.current_phase` o sub-estado interno? | Añadir `negotiation` al enum entre `dd` y `spa` | **ABIERTO** — confirmación usuario |
| ~~A5~~ | Integración post-deal: entidad nueva o fase de Operation | Fase 15 dentro de la misma `Operation` | **CERRADO** por usuario 2026-06-25 |
| **A6** | Fases pre-Match (1-5): ¿son parte formal del TOS o "ciclo previo"? | TOS formal arranca en T6. T1-T5 son ciclo previo que reutiliza entidades Empresa/Valoración/Oportunidad | **ABIERTO** — confirmación usuario |
| **A7** | `Deal Workspace` URL canónica | Reutilizar `/operacion/{id}` (Entity Framework §11.8); para Match activo pre-conversión usar `/match/{id}` | **ABIERTO** — confirmación usuario |
| **A8** | Pausa indefinida: ¿qué plazo dispara auto-cancelación? | Propuesta: 12 meses sin actividad | **ABIERTO** — pendiente decisión negocio |
| **A9** | `Equipo arroba`: ¿rol nuevo (`Role.arroba_team`) o sub-permiso del `admin`? | Rol nuevo `arroba_team` con permisos acotados de mediación/auditoría | **ABIERTO** — definirá `COPILOTS_SPEC` y `SUBSCRIPTION_SPEC` |
| **A10** | ¿Teaser accesible a usuarios no registrados? | NO. Teaser solo post-Match. Superficie pública = ficha pública parcial estándar | **ABIERTO** — confirmación usuario |
| **A11** | ¿En qué fase exacta el Match se convierte en Operation? | Tras LOI/NBO firmada por ambas partes (fin de fase 10) | **ABIERTO** — confirmación usuario (decisión canónica propuesta del spec) |

### Lagunas documentales detectadas (fuera del Sprint 0)

Lagunas que este spec **no cubre** y que aparecen como dependencias en el ciclo TOS. Referenciadas en el inventario `_INVENTORY_2026.md` §7.

**P0 — bloquean implementación de fases concretas**:

- `NDA_SPEC.md` — plantillas, NDA progresivo, niveles de revelación. Necesario para fases 7 y 8.
- `CIS_SPEC.md` — condiciones generales plataforma, aceptación por Organization. Necesario para Onboarding pre-fase 3.
- Especificación de **firma electrónica** (capability Boundary): proveedor concreto, evidencia probatoria, archivo notarial. Necesario para fases 7, 10, 13.

**P1 — bloquean superficies concretas**:

- `DATAROOM_SPEC.md` — estructura, permisos por fase, watermarks. Necesario para fase 11.
- `LOI_SPEC.md` — plantilla, comparator multi-bidder, exclusividad. Necesario para fase 10.
- `MARKETPLACE_SPEC.md` — motor de matching, scoring Compatibilidad. Necesario para fase 5.
- `BUYER_QUAL_SPEC.md` — calificación del Buyer (KYC, tesis, fondos). Necesario antes de fase 5.
- `SIGNALS_SPEC.md` — qué señales se calculan, cuándo se publican. Transversal.

**P2 — sub-modelos avanzados**:

- `EARNOUT_SPEC.md` — cláusulas, fórmulas. Necesario para fase 12.
- `ADVISOR_LAYER_SPEC.md` — flujo del advisor humano y revenue share. Necesario para varias fases.

### Decisiones canónicas pendientes de propagar al cierre del Sprint 0

Cuando los 6 specs del Sprint 0 estén aprobados, se actualizan:

1. **`ENTITY_MODEL.md`**:
   - Añadir entidad `match` como tipo canónico nº 13.
   - Añadir relaciones `opportunity → matches[]` (1:N), `match → operation` (1:0..1).
   - Renombrar / consolidar el enum `Operation.current_phase` para reflejar las fases del TOS (eliminar `matching` del enum y añadir `negotiation`, `closing`, `integration`).
   - Añadir nuevos `Document.kind`: `closing_memo`, `integration_plan`, `match_certificate`.
2. **`ARROBA_PHILOSOPHY.md`**:
   - §6: añadir `negotiation` e `integración post-operación` a la enumeración de fases.
   - §7: revisar la frase "Matching no es entidad" — el Matching como mecanismo NO es entidad, pero el `Match` resultante SÍ es entidad. Aclarar la distinción.
   - §13: añadir la capa "Engines & Specs" entre Entity Framework y Design System.
3. **`ENTITY_FRAMEWORK.md`**:
   - Añadir §11.13 (Match) con los módulos canónicos activos.
   - Actualizar §11.8 (Operation) si las fases del TOS modifican su definición.

> **Fin del documento.** — `v1.0.0` — pendiente de revisión humana.
