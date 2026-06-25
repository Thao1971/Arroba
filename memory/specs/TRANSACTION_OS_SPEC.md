# arroba.com — Transaction OS Spec v1.2.0

> **Capa canónica**: *Engines & Specs* (entre Entity Framework y Design System; ver `ARROBA_PHILOSOPHY.md` §13 — pendiente de actualización al cierre del Sprint 0).
> **Fase del proyecto**: Sprint 0 · Fase 0.1 (primero de 6 specs).
> **Estado**: borrador para revisión humana — v1.2.0 incorpora correcciones del Sprint 0.5 Ciclo B sobre v1.1.0.
> **Fecha**: 2026-06-25.
> **Autor canónico**: usuario (decisiones) + redacción técnica del agente.
>
> Este documento define la arquitectura funcional del **Transaction Operating System** (TOS): el ciclo completo de una operación corporativa en arroba.com, desde el análisis inicial hasta la integración post-deal. No define implementación. No define visual. Define qué fases existen, qué entidades intervienen, qué artefactos se producen, qué actores participan, qué permisos rigen, qué eventos se registran y cómo se gobierna el ciclo.
>
> **Cambios v1.2.0 frente a v1.1.0** (Sprint 0.5 Ciclo B):
> - Numeración canónica de fases: `T1`–`T15` reemplaza la notación "Fase N" / "fase N" en todo el documento (decisión Sprint 0.5 #8 NM-03/CX-09).
> - Cierre formal de `[OPEN-A8]` con decisión del usuario: tokens JWT 24h · refresh 30d · sesión 1h inactiva.
> - Cierre formal de `[OPEN-A12]` con resolución cruzada en `TRANSACTION_COPILOT_SPEC §12 B1` y `COPILOTS_SPEC §6.3`.
>
> **Cambios v1.1.0 frente a v1.0.0** (correcciones canónicas):
> - Introducción de **Discovery Layer** y **Transaction Layer** como las dos etapas del mismo TOS.
> - **Teaser** pertenece al Discovery Layer y es visible a buyers cualificados del Marketplace **antes** del Match.
> - El **Match aceptado por ambas partes crea inmediatamente la Operation** (la LOI deja de ser el punto de conversión).
> - `Match` tiene ciclo de vida corto (SOLICITADO → ACEPTADO/RECHAZADO/EXPIRADO).
> - `Operation.current_phase` arranca en `nda` y añade `negotiation` entre `dd` y `spa`.
> - **`arroba_team`** queda formalizado como rol específico nuevo, **sin herencia** de permisos `admin`.
> - URLs canónicas dobles: `/match/{id}` (workspace corto de Match) + `/operacion/{id}` (Deal Workspace completo de Operation).
> - Política de caducidad NO fijada en este spec; queda como `[OPEN-A8]`.
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
6. [Deal Workspace y Match Workspace](#6-deal-workspace-y-match-workspace)
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

### 1.2 Discovery Layer + Transaction Layer

**El Transaction OS como sistema existe desde el principio.** Internamente se divide en **dos grandes etapas, ambas parte del mismo TOS**:

- **Discovery Layer** (fases 1-6 + sub-acción "Solicitud de Match"): análisis, valoración, búsqueda, screening, matching, marketplace, card resumida, teaser anonimizado, solicitud de Match. **Todavía no existe una Operación.** La entidad activa puede ser `Company`, `Valuation`, `Opportunity` o `Match` (en estado `SOLICITADO`).
- **Transaction Layer** (fases 7-15): comienza cuando existe un Match **aceptado por ambas partes**. A partir de ahí, comienza el proceso formal de la transacción. **Existe una Operación.** La entidad activa es `Operation`.

La **frontera** entre las dos capas es la aceptación del Match: en el momento exacto en que el Seller acepta la solicitud de Match del Buyer, nace la `Operation` y el ciclo entra en el Transaction Layer.

```
Discovery Layer                    │  Transaction Layer
───────────────────────────────────┼────────────────────────────────
T1 → T2 → T3 → T4 → T5 → T6 + req  │  T7 → T8 → T9 → T10 → T11 →
  Análisis,  ...  Marketplace,     │  NDA, IM, Q&A, LOI/NBO, DD,
  Teaser, Solicitud de Match       │  T12 → T13 → T14 → T15
                                   │  Negociación, SPA, Closing,
                                   │  Integración
                  ▲                │  ▲
                  │                │  │
           Match SOLICITADO  ──►   Match ACEPTADO ⇒ nace Operation
```

### 1.3 Qué NO es el Transaction OS

El TOS **no es**:

- **Un marketplace**. El Marketplace es una **superficie de descubrimiento** dentro del Discovery Layer, no el producto. La transacción no se "compra del catálogo".
- **Un CRM**. No gestiona contactos sueltos ni outreach masivo. El pipeline es contextual a una `Opportunity`, un `Match` o una `Operation`.
- **Un Data Room aislado**. El Data Room es una **capacidad** dentro de la fase Due Diligence; vive subordinado a la `Operation`.
- **Una suite de tres productos pegados con cinta** (marketplace + CRM + Data Room separados). Es **un sistema operativo transaccional unificado**: una máquina de estados, una memoria, un audit log, una capa agéntica que recorre todo el ciclo.

### 1.4 Posición en las capas canónicas

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

### 1.5 Alcance funcional

El TOS define, sin ambigüedad:

1. Qué fases existen en una operación M&A en arroba.com (las 15) y a qué capa pertenece cada una.
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

### 2.1 Capas del TOS

**Discovery Layer**
Primera etapa del TOS. Cubre fases 1-6 + sub-acción "Solicitud de Match". Aún no existe `Operation`. La entidad activa puede ser `Company`, `Valuation`, `Opportunity` o `Match` (en estado `SOLICITADO`). El Teaser anonimizado vive en esta capa y se publica al Marketplace cualificado.

**Transaction Layer**
Segunda etapa del TOS. Comienza con la aceptación mutua del Match. Cubre fases 7-15. La entidad activa es `Operation`.

### 2.2 Términos del flujo

**Recomendación**
Sugerencia generada por la plataforma para emparejar un activo (empresa, oportunidad) con una contraparte potencial. Es **unidireccional** (sistema → usuario) y **no vinculante**. Una Recomendación expira si no es accionada. Genera 0..N intentos de Match. **Una Recomendación no es un Match.**

**Compatibilidad**
Score numérico que cuantifica el potencial de fit entre dos activos (por ejemplo, una `Opportunity` y una `Company` candidata). Es una **señal**, no un compromiso. La Compatibilidad alimenta el motor de Recomendaciones y la priorización del Marketplace. **Una Compatibilidad no es un Match.**

**Marketplace**
Superficie del Discovery Layer en la que buyers cualificados navegan **cards resumidas** (Teasers anonimizados) de activos publicados por sellers. El Marketplace **no es el producto**; es una superficie de descubrimiento dentro del TOS.

**Match** *(definición canónica — cita textual al usuario)*
> *"El Match representa el inicio formal de una posible operación. No representa una recomendación. No representa una similitud. No representa una oportunidad. Representa el momento en que comprador y vendedor aceptan mutuamente continuar. Desde ese instante nace una nueva entidad persistente dentro de arroba.com. A partir del Match comienza el Transaction OS."*

Aclaración canónica adicional aprobada por el usuario:

> *"El Match NO es un evento puntual. Es una entidad persistente de transición. Representa el acuerdo mutuo entre comprador y vendedor para iniciar una posible operación. Tiene identidad propia, estado, participantes, fechas, condiciones y trazabilidad. La Operación nace únicamente cuando el Match evoluciona hacia una transacción."*

Cardinalidad canónica: **1 `Opportunity` → N `Match`** (0..N) · **1 `Match` → 0..1 `Operation`**. Toda `Operation` nace de un `Match`. No toda `Opportunity` produce `Match`. **Todo `Match` aceptado crea inmediatamente una `Operation`; ningún `Match` rechazado o expirado crea `Operation`.**

`Match` es **entidad canónica de primer nivel**, **de ciclo de vida corto** (su incorporación formal a `ENTITY_MODEL.md` se hace al cierre del Sprint 0). Sus estados son acotados: `SOLICITADO → ACEPTADO | RECHAZADO | EXPIRADO`. Tras la aceptación, el Match queda registrado de forma inmutable como `lineage` de la `Operation` recién creada.

**Solicitud de Match**
Acción del Buyer, **dentro del Discovery Layer**, que crea un `Match` en estado `SOLICITADO` apuntando a un activo cuyo Teaser ha consumido. La acción se dispara desde el Teaser anonimizado o desde la card del Marketplace. No es vinculante; el Seller puede aceptar, rechazar o dejar expirar.

**Opportunity / Oportunidad**
Entidad persistente que formaliza una **tesis de transacción potencial** (buy-side o sell-side) de un cliente. Una Opportunity puede no tener contraparte aún. Genera Recomendaciones y publica en Marketplace si es sell-side. Una Opportunity **puede abandonarse** sin haber generado ningún Match.

**Operation / Operación**
Entidad persistente que representa la **ejecución completa de una transacción** desde el Match aceptado hasta el final de la integración post-deal. Es el contenedor central del Transaction Layer. **Nace inmediatamente al aceptarse el Match.** Su `current_phase` arranca en `nda` y recorre las fases declaradas en §4.3.

**Transacción**
Sinónimo coloquial de Operación en lenguaje de usuario. Técnicamente, el dominio usa **Operation**.

### 2.3 Artefactos del ciclo

**Card resumida**
Vista mínima del activo en el Marketplace: rango sectorial, geografía aproximada, rango de revenue, tags. **No identifica** la empresa. Pertenece al Discovery Layer.

**Teaser anonimizado público**
Documento estructurado del Discovery Layer, **visible a buyers cualificados del Marketplace sin necesidad de Match**. No revela identidad de la empresa. Su propósito: permitir al buyer evaluar si solicitar un Match.

**NDA (Non-Disclosure Agreement)**
Acuerdo de confidencialidad bilateral firmado en fase 7. Su firma desbloquea acceso al Information Memorandum y al Data Room. Existen NDAs progresivos; el detalle vive en `NDA_SPEC.md` (laguna identificada).

**Information Memorandum (IM)**
Documento exhaustivo y estructurado sobre la empresa target. **Identifica** la empresa. Solo accesible post-NDA.

**IOI (Indication of Interest)** *(sub-estado opcional dentro de T10 LOI/NBO)*
Comunicación **no vinculante** del Buyer expresando interés tras revisar el IM. No es compromiso. Su uso es opcional. Compatibilidad hacia atrás con `ENTITY_MODEL.md` §5.7 (`current_phase` enum mantiene `ioi`).

**LOI (Letter of Intent) / NBO (Non-Binding Offer)**
Oferta **vinculante** en términos económicos esenciales (precio, estructura, condiciones suspensivas) con cláusulas de exclusividad temporal. La LOI/NBO firmada por ambas partes **es una fase de la Operation**, no el momento en que la Operation nace.

**Due Diligence (DD)**
Fase de revisión exhaustiva de la empresa target por parte del Buyer y sus asesores.

**Data Room**
Repositorio documental seguro con permisos granulares, watermarks, audit de accesos. **Es una capacidad** (no entidad canónica, ver `ARROBA_PHILOSOPHY.md` §7) que vive dentro de la fase DD de una `Operation`. Spec detallado: `DATAROOM_SPEC.md` (laguna).

**Q&A log**
Registro estructurado de preguntas del Buyer y respuestas del Seller durante Q&A y DD. Inmutable una vez cerrado.

**SPA (Sale-Purchase Agreement)**
Contrato de compraventa **vinculante y definitivo**. Su firma por ambas partes formaliza el acuerdo legal de la operación, sujeto a condiciones suspensivas.

**Closing**
Acto jurídico-económico en el que se ejecutan las contraprestaciones del SPA (pago, transferencia de acciones, formalización notarial). El Closing **cierra la fase legal** de la operación. **No cierra la entidad `Operation`**: ésta permanece activa hasta el final de la integración post-deal.

**Integración post-operación**
Fase posterior al Closing en la que las partes ejecutan el plan de integración acordado. Su cierre marca el fin del ciclo de vida de la `Operation` (estado `CERRADA_CON_ÉXITO`).

### 2.4 Actores

**Seller**
Parte vendedora.

**Buyer**
Parte compradora. Para acceder al Marketplace y ver Teasers anonimizados debe ser un **Buyer cualificado** (criterios de elegibilidad — ver `BUYER_QUAL_SPEC.md`, laguna P1).

**Advisor**
Profesional acreditado (M&A advisor, valuator). En el TOS puede actuar representando al Seller, al Buyer, o operando un Mandato propio. Tiene entidad canónica `advisor` (`ENTITY_MODEL.md` §3) y copilot dedicado (`Advisor Copilot`, ver `COPILOTS_SPEC.md`).

**Equipo arroba** *(`arroba_team`)*
**Rol específico nuevo** dentro de `Role` (`ENTITY_MODEL.md` pendiente de actualización al cierre del Sprint 0). Operadores internos de la plataforma. **NO hereda automáticamente los permisos de `admin`.** Sus capacidades están **acotadas**: lectura para mediación, anotaciones en audit log, congelar entidad temporalmente, escalado a `admin`. No firma artefactos legales en nombre de las partes. Sus accesos a información sensible quedan registrados visibles a las partes.

**Admin**
Rol de superusuario de plataforma. Capacidades amplias (auditoría regulatoria, archivado, intervención excepcional). No es sinónimo de `arroba_team`.

**Sistema** *(`system`)*
Actor no-humano que ejecuta acciones automatizadas autorizadas (notificaciones, transiciones automáticas, indexaciones, cobros). Las acciones del Sistema **siempre** dejan traza en el audit log.

### 2.5 Conceptos transversales

**Trazabilidad**
Capacidad de reconstruir, en cualquier momento, qué actor hizo qué acción sobre qué entidad/artefacto, cuándo y con qué consecuencia. Es **obligatoria** en todas las fases del TOS.

**Audit log**
Estructura inmutable que registra cada **evento canónico** (ver §9). Una entrada del audit log no puede modificarse ni borrarse — sólo añadirse otra entrada que la rectifica (con referencia explícita).

**Match Workspace**
**Vista UX mínima** sobre una entidad `Match` activa en el Discovery Layer. URL canónica `/match/{id}`. Espacio corto donde se gestionan: solicitud, revisión por el Seller, aceptación o rechazo, y conversión a Operation. Cierra al transitar `Match → ACEPTADO`.

**Deal Workspace**
**Vista UX orquestadora** sobre una entidad `Operation`. URL canónica `/operacion/{id}`. Espacio completo del Transaction Layer. Ver §6.

Ambas vistas son **proyecciones** de la entidad subyacente, no entidades nuevas (respeta `ARROBA_PHILOSOPHY.md` §8: "Workspace = memoria/persistencia/contexto, no entidad").

**Reversibilidad acotada**
Política según la cual algunas transiciones permiten retroceder y otras no.

**Permisos progresivos**
Modelo de visibilidad que **se abre** a medida que avanzan las fases y se firman los artefactos correspondientes. En el Discovery Layer la visibilidad de la ficha sobre la empresa target está anonimizada (Teaser). En el Transaction Layer post-NDA: visibilidad ampliada. Post-LOI: visibilidad casi total. Post-Closing: la información sigue siendo accesible solo a las partes.

---

## 3. Principios arquitectónicos

### 3.1 Entity First

Match, Operation y los artefactos canónicos (Teaser, NDA, IM, IOI, LOI, DD report, SPA, Closing memo, Integration plan) **son entidades** o **viven asociados a entidades**, no flotando en el chat ni en pantallas dispersas. Cumple `ARROBA_PHILOSOPHY.md` §2 ("Entity First en producto").

### 3.2 Estado explícito

Cada entidad transaccional (`Opportunity`, `Match`, `Operation`) tiene **un estado declarado** dentro de un enum cerrado. Las transiciones son explícitas, no implícitas.

### 3.3 Permisos progresivos

Lo que ve cada actor en cada momento depende de **(capa + fase + estado + artefactos firmados + cualificación previa)**. La visibilidad se abre con el avance del proceso; nunca se expande por inferencia del LLM. El Teaser anonimizado del Discovery Layer es visible a **buyers cualificados**, no a usuarios anónimos en internet abierto.

### 3.4 Trazabilidad total

Toda acción con consecuencia material (creación de entidad, transición de estado, firma de artefacto, invitación a contraparte, abandono, pausa) genera **al menos un** evento de audit log. Sin excepciones.

### 3.5 Recomendación ≠ Compatibilidad ≠ Match ≠ Operation

Cuatro conceptos distintos del ciclo de vida:

```
Opportunity ──genera──► Recomendaciones ──exposición──► Marketplace ──Buyer solicita──► Match (SOLICITADO)
   (1)                       (N)                        (Teaser)                          (0..N)
                                                                                              │
                                                                                  Seller acepta│
                                                                                              ▼
                                                                                       Operation (0..1)
```

**Una Recomendación nunca se convierte directamente en Operation.** El paso por Match (solicitado + aceptado) es obligatorio.

### 3.6 Discovery Layer + Transaction Layer son dos etapas del mismo TOS

Las dos capas no son productos distintos. Son **dos etapas** del mismo sistema operativo transaccional, con la **misma máquina de eventos**, **el mismo audit log**, **la misma memoria continua** y **el mismo Transaction Copilot** orquestando ambas. El paso entre ellas es la aceptación del Match.

### 3.7 Reversibilidad acotada

Las transiciones del TOS se clasifican en:

- **Hacia adelante** (avance): permitidas si se cumplen condiciones (artefacto firmado, validación humana, etc.).
- **Pausa**: permitidas casi siempre (`EN_PAUSA`); reanudar requiere acuerdo bilateral.
- **Retroceso explícito**: permitidas **solo** en transiciones específicas declaradas en §4 y §10.
- **Aborto / cancelación**: permitida en casi cualquier fase con consecuencias específicas (ver §10).

### 3.8 Inteligencia delegada

El TOS define **qué fases existen** y **qué transiciones son legítimas**, pero **no define cómo razona** la inteligencia dentro de una fase. La capa agéntica vive en:

- `TRANSACTION_COPILOT_SPEC` — orquestador conversacional general del TOS.
- `COPILOTS_SPEC` — copilots especializados (Company, Market, Valuation, Transaction, Advisor).
- `AGENTIC_LAYERS_SPEC` — los 4 niveles de autonomía (L1 conversacional · L2 preparación · L3 ejecución asistida · L4 automatización autorizada).

El TOS los **referencia**, no los define.

### 3.9 Boundary First

Las interacciones con sistemas externos se modelan como **contratos abstractos**, no como implementaciones de proveedor:

- **Firma electrónica** → capability "Firma con valor legal y trazabilidad probatoria".
- **CIS (Contrato Inicial de Servicios)** → capability "Aceptación de condiciones plataforma vinculadas a Organization".
- **Billing** → capability "Captura de pagos + emisión de eventos económicos".
- **Almacenamiento de documentos** → capability "Object storage con permisos granulares y watermarks".

Este principio replica el `Boundary First` ya usado en `agency_tool_adapter` (ver `_INVENTORY_2026.md` §2.4).

---

## 4. Máquina de estados global

> Notación: la máquina se divide en dos bloques visuales correspondientes a Discovery Layer y Transaction Layer. El `Match` es la **frontera** entre ambas.

### 4.1 Estados de `Opportunity` (Discovery Layer)

```
                     ┌──────────────────┐
                     │     BORRADOR     │   tesis aún no publicada
                     └────────┬─────────┘
                              │ publicar
                              ▼
                     ┌──────────────────┐
              ┌─────►│      ACTIVA      │   visible/operativa; puede publicar al Marketplace
              │      └────────┬─────────┘   (si sell-side) y generar Recomendaciones
              │ reactivar     │
              │               ├──► EN_PAUSA  ──reanudar──► ACTIVA
              │               │
              │               │ uno o más Matches solicitados
              │               ▼
              │      ┌──────────────────┐
              │      │  CON_MATCH(ES)   │   ≥1 Match vivo. La Opportunity sigue activa
              │      └────────┬─────────┘   (puede generar más Matches en paralelo)
              │               │
              │               │ abandono / archivado
              │               ▼
              └──────┐ ┌──────────────────┐
                     │ │    ABANDONADA    │   terminal — el cliente cierra la tesis
                     │ └──────────────────┘
                     │
                     └─ archivar (admin) ──► ARCHIVADA (terminal)
```

### 4.2 Estados de `Match` (frontera Discovery → Transaction)

`Match` es una entidad **de ciclo corto**. Sus estados son acotados:

```
        Buyer ve Teaser en Marketplace y dispara "Solicitud de Match"
                              │
                              ▼
                     ┌──────────────────┐
                     │   SOLICITADO     │   Match creado; el Seller revisa al Buyer cualificado
                     └────────┬─────────┘   y decide
                              │
       ┌──────────────────────┼──────────────────────┐
       │ Seller acepta        │ Seller rechaza       │ ventana de respuesta expirada
       ▼                      ▼                      ▼
┌─────────────┐        ┌────────────┐         ┌────────────┐
│  ACEPTADO   │        │ RECHAZADO  │ (term.) │  EXPIRADO  │ (terminal)
└──────┬──────┘        └────────────┘         └────────────┘
       │ Sistema crea Operation INMEDIATAMENTE
       ▼
  (Operation nace con current_phase = `nda` y Match.id queda en lineage)
       │
       └──► el Match queda CERRADO/archivado tras la conversión; no admite reapertura
```

`ACEPTADO` es estado **terminal positivo** del Match: cierra el Match e inicia la `Operation`.
`RECHAZADO` y `EXPIRADO` son estados terminales sin Operation.

Tras `ACEPTADO`, la URL `/match/{id}` queda como **vista histórica** (lineage); la URL activa de trabajo es `/operacion/{id}`.

### 4.3 Estados de `Operation` (Transaction Layer)

`Operation.current_phase` (enum canónico — actualizable en `ENTITY_MODEL.md` al cierre del Sprint 0):

```
       Match.estado = ACEPTADO  ⇒  Operation creada con current_phase = `nda`
                                                  │
                                                  ▼
              ┌──────────┐
              │   nda    │ ──► NDA firmado por ambas partes
              └────┬─────┘
                   ▼
              ┌──────────┐
              │    im    │ ──► IM liberado al Buyer; consumo
              └────┬─────┘
                   ▼
              ┌──────────┐
              │    qa    │ ──► Q&A activo
              └────┬─────┘
                   ▼
              ┌──────────────────────────────┐
              │   loi  (con sub-estado IOI   │ ──► LOI/NBO firmada por ambas partes
              │   opcional)                  │
              └────┬─────────────────────────┘
                   ▼
              ┌──────────┐
              │    dd    │ ──► Data Room abierto + DD report emitido
              └────┬─────┘
                   ▼
              ┌──────────────┐
              │ negotiation  │ ──► SPA draft consensuado    [enum nuevo]
              └────┬─────────┘
                   ▼
              ┌──────────┐
              │   spa    │ ──► SPA firmado por ambas partes
              └────┬─────┘
                   ▼
              ┌──────────┐
              │ closing  │ ──► Condiciones suspensivas cumplidas + Closing declarado
              └────┬─────┘
                   ▼
              ┌──────────────┐
              │ integration  │ ──► Plan ejecutado; integración declarada completada
              └────┬─────────┘     [enum nuevo]
                   ▼
       ┌────────────────────────┐
       │  CERRADA_CON_ÉXITO     │  terminal positivo
       └────────────────────────┘

       Transiciones laterales desde cualquier fase activa:
         ──► EN_PAUSA               (reanudable al mismo estado)
         ──► CERRADA_SIN_ÉXITO      (terminal — alguna parte se retira con consecuencias)
         ──► CANCELADA              (terminal — cancelación administrativa o legal)
         ──► ARCHIVADA              (terminal admin)
```

**Notas sobre el enum `Operation.current_phase`**:

- `Operation.current_phase` **arranca en `nda`**; no admite `matching` ni `teaser` (esos pertenecen al Discovery Layer / Match).
- Valores nuevos respecto al enum actual de `ENTITY_MODEL.md` §5.7: `negotiation` (entre `dd` y `spa`) e `integration` (después de `closing`). La actualización formal se hace al cierre del Sprint 0.
- `qa` se mantiene como fase tras `im`; el Q&A operativo de T11 (DD) reutiliza el mismo log con un sub-bloque "Q&A DD".

### 4.4 Reglas de transición — quién puede disparar qué

> Notación: ✓ permitido sin condición · 🔒 permitido con condición declarada · ✗ prohibido.

| Transición | Seller | Buyer | Advisor (cualquier lado) | Equipo arroba | Sistema |
|---|---|---|---|---|---|
| Crear `Opportunity` | ✓ (sell-side) | ✓ (buy-side) | 🔒 con `Mandate` | ✗ | ✗ |
| Publicar `Opportunity` (Marketplace si sell-side) | ✓ | ✓ | 🔒 con `Mandate` | ✗ | ✗ |
| Generar Recomendaciones / Compatibility scoring | ✗ | ✗ | ✗ | ✗ | ✓ (motor) |
| Publicar Teaser anonimizado al Marketplace | ✓ Seller | ✗ | 🔒 representando | ✗ | ✗ |
| Solicitar Match (`Match → SOLICITADO`) | ✗ | ✓ (cualificado) | 🔒 representando | ✗ | ✗ |
| Aceptar Match (`Match → ACEPTADO`) ⇒ crea Operation | ✓ Seller | ✗ | 🔒 representando | ✗ | ✓ (al detectar aceptación, crea `Operation`) |
| Rechazar Match (`Match → RECHAZADO`) | ✓ Seller | ✗ | 🔒 representando | ✗ | ✗ |
| Expirar Match (`Match → EXPIRADO`) | ✗ | ✗ | ✗ | ✗ | ✓ (al vencer ventana, ver `[OPEN-A8]`) |
| `Operation.current_phase = nda → im` (NDA firmado) | 🔒 firma | 🔒 firma | 🔒 representando | ✗ | ✓ |
| `Operation → spa` (LOI firmada) | 🔒 firma | 🔒 firma | 🔒 representando | ✗ | ✓ |
| `Operation → closing` (SPA firmado) | 🔒 firma | 🔒 firma | ✗ (solo asiste) | 🔒 validación opcional | ✓ |
| `Operation → integration` (Closing declarado) | 🔒 condiciones suspensivas | 🔒 condiciones suspensivas | ✗ | 🔒 verificación | ✓ |
| `Operation → CERRADA_CON_ÉXITO` (integración completada) | 🔒 ambas confirman | 🔒 ambas confirman | ✗ | 🔒 validación | ✓ |
| `Operation → CERRADA_SIN_ÉXITO` | ✓ unilateral post-LOI | ✓ unilateral post-LOI | ✗ | 🔒 mediación | ✗ |
| `Match` o `Operation → CANCELADA` | ✓ unilateral | ✓ unilateral | ✗ | ✓ administrativa | ✗ |
| Pausar (`EN_PAUSA`) | ✓ | ✓ | 🔒 representando | ✓ | ✗ |
| Reanudar de `EN_PAUSA` | 🔒 ambas partes | 🔒 ambas partes | 🔒 representando | ✓ | ✗ |
| Archivar (terminal admin) | ✗ | ✗ | ✗ | ✗ | ✗ (solo `admin`) |

---

## 5. Las 15 fases canónicas

> Las fases se agrupan en dos capas. La **frontera** es la aceptación del Match: en el instante en que el Seller acepta, nace la `Operation` y entramos al Transaction Layer.
>
> **Discovery Layer (fases 1-6 + sub-acción "Solicitud de Match")** — sobre `Company`, `Valuation`, `Opportunity`, `Match.SOLICITADO`.
> **Transaction Layer (fases 7-15)** — sobre `Operation`.

═════════════════════════════════════════════════════════════════════════════
### 🟦 DISCOVERY LAYER
═════════════════════════════════════════════════════════════════════════════

### T1 — Análisis inicial

**Capa**: Discovery.
**Propósito**: el usuario (Seller o Buyer) entiende el activo (su empresa o las empresas candidatas).

**Estado inicial requerido**: usuario autenticado con visibilidad a la ficha de Empresa.
**Estado final**: ficha de Empresa con `analisis` (narrative) actualizado, KPIs visibles, señales presentes.
**Actores principales**: Seller (sobre su empresa) o Buyer (sobre candidatas), Sistema, Company Copilot.

**Información consumida**:
- Datos de la ficha Empresa (Agency Tool / `master_companies_mock`).
- Histórico de conversaciones previas sobre la empresa.
- Señales públicas.

**Información generada / artefactos**:
- Análisis narrativo (sección `narrative` de la ficha).
- Insights (sección `insights`).
- Conversación persistida (`company_conversations`).

**Herramientas utilizadas**:
- Skill `analyze` (existente).
- Bloques: NarrativeBlock, MetricsBlock, CompanyCard.

**Motores de IA implicados**:
- **Company Copilot** (L1 conversacional, L2 preparación de análisis). Detalle en `COPILOTS_SPEC.md`.

**Acciones automáticas**:
- Hidratar ficha desde `EnrichCompanyAdapter`.
- Registrar consulta en historial del usuario.

**Acciones con aprobación explícita del usuario**:
- "Refrescar análisis" (rate-limited).
- Guardar empresa en `watchlist`.

**Memoria utilizada**:
- **Memoria de empresa** (lectura/escritura).
- **Memoria de usuario** (lectura/escritura).

**Permisos por rol**:
- Anónimo: ficha pública parcial.
- Subscriber/Buyer/Seller/Advisor autenticado: ficha completa.
- `arroba_team`/Admin: ficha completa + metadatos auditoría.

**Trazabilidad**:
- Evento `company.viewed`.
- Evento `company.analysis_refreshed`.

**Transiciones permitidas**:
- → T2 (Valoración).
- → T3 (Identificación) si el usuario ya tiene el activo claro.
- Sin transición (consulta puntual).

**Riesgos / consideraciones**:
- Análisis basado en `mock` (Agency Tool no productivo todavía).

---

### T2 — Valoración

**Capa**: Discovery.
**Propósito**: cuantificar el valor económico del activo (indicativa o avanzada).

**Estado inicial requerido**: Empresa identificada con datos financieros mínimos.
**Estado final**: entidad `Valuation` persistida y asociada a la `Company`.
**Actores principales**: Seller, Buyer, Advisor, Valuation Copilot.

**Información consumida**:
- Datos financieros de la Empresa.
- Comparables.
- Método (`revenue_multiple` · `ebitda_multiple` · `dcf` · `comparable_transactions`).

**Información generada / artefactos**:
- Entidad `Valuation` (valor central + banda).
- Documento `Valuation report` (opcional).
- Bloque `ValuationBlock` en la ficha.

**Herramientas utilizadas**:
- Skill `value` (existente, determinista).
- Skills futuros: DCF, múltiplos personalizados.

**Motores de IA implicados**:
- **Valuation Copilot** (L2 borradores de valoraciones avanzadas).

**Acciones automáticas**:
- Calcular valoración indicativa.

**Acciones con aprobación explícita del usuario**:
- "Solicitar valoración avanzada".
- Aceptar/rechazar resultado.

**Memoria utilizada**:
- **Memoria de empresa** (histórico de valoraciones).
- **Memoria de valoración** (si tiene ficha propia).

**Permisos por rol**:
- Valoración indicativa: cualquier autenticado.
- Valoración avanzada: solo dueño Empresa, Advisor con Mandato, o Buyer con `Match.ACEPTADO` (post-Match) sobre la Empresa.

**Trazabilidad**:
- Evento `valuation.created`.

**Transiciones permitidas**:
- → T3 o T5 según contexto.

**Riesgos / consideraciones**:
- Indicativa ≠ compromiso de precio.
- Auditoría legal: la Valuation queda fechada y referenciada en `lineage` si se usa en LOI.

---

### T3 — Identificación y búsqueda de compradores/vendedores compatibles

**Capa**: Discovery.
**Propósito**: el usuario formaliza su intención en una `Opportunity` y arranca la búsqueda de contrapartes.

**Estado inicial requerido**: usuario con plan que habilite creación de Opportunity.
**Estado final**: entidad `Opportunity` en estado `ACTIVA`.
**Actores principales**: Seller, Buyer, Advisor con Mandate, Market Copilot, Opportunity Advisor.

**Información consumida**:
- Empresa target (sell-side) o criterios (buy-side).
- Mandato si aplica.

**Información generada / artefactos**:
- Entidad `Opportunity`.
- Tesis formalizada.

**Herramientas utilizadas**:
- Formulario de creación de Opportunity.
- Skill `recommend` (alimenta motor de matching de T5).

**Motores de IA implicados**:
- **Market Copilot** (análisis de mercado/sector/territorio).
- **Opportunity Advisor** (copilot especializado de la Opportunity, ver `COPILOTS_SPEC.md`).

**Acciones automáticas**:
- Inicializar `Opportunity.candidate_company_ids`.

**Acciones con aprobación explícita del usuario**:
- Publicar Opportunity (de `BORRADOR` a `ACTIVA`).
- Definir criterios de exclusión.

**Memoria utilizada**:
- **Memoria de usuario** (tesis previas).
- **Memoria de oportunidad** (se inicializa).

**Permisos por rol**:
- Seller: crea sell-side sobre su empresa.
- Buyer: crea buy-side con criterios libres.
- Advisor: con `Mandate` válido.

**Trazabilidad**:
- `opportunity.created`, `opportunity.published`.

**Transiciones permitidas**:
- → T4 cuando aparezcan candidatas / publicación al Marketplace.
- `EN_PAUSA` o `ABANDONADA`.

**Riesgos / consideraciones**:
- Tesis ambiguas → recomendaciones malas. Market Copilot ayuda a estructurar.

---

### T4 — Screening y priorización de candidatos

**Capa**: Discovery.
**Propósito**: refinar candidatas, descartar inviables, priorizar por Compatibilidad.

**Estado inicial requerido**: `Opportunity.ACTIVA` con ≥1 candidata.
**Estado final**: candidatas filtradas y priorizadas; `pipeline_stage_by_company_id` actualizado.
**Actores principales**: dueño de la Opportunity, Advisor (si aplica), Market Copilot.

**Información consumida**:
- Datos enriquecidos.
- Compatibility scores.
- Criterios y exclusiones del usuario.

**Información generada / artefactos**:
- Lista priorizada de candidatas.
- Razones de descarte (auditadas).

**Herramientas utilizadas**:
- Skill `recommend`.
- Skills futuros: screenings avanzados, screening por buyer profile.

**Motores de IA implicados**:
- **Opportunity Advisor / Market Copilot**.

**Acciones automáticas**:
- Cálculo continuo de Compatibility para candidatas nuevas.
- Sugerencia de descartes obvios.

**Acciones con aprobación explícita del usuario**:
- Aprobar/rechazar candidata.
- Reordenar prioridad.

**Memoria utilizada**:
- **Memoria de oportunidad** (razones de descarte, conversaciones).

**Permisos por rol**:
- Dueño Opportunity + su Advisor.

**Trazabilidad**:
- `opportunity.candidate_added` / `_excluded` / `_priority_changed`.

**Transiciones permitidas**:
- → T5 (Matching).
- Vuelta a T3 si la tesis necesita reformularse.

**Riesgos / consideraciones**:
- Sesgo del motor. Override humano siempre disponible.

---

### T5 — Matching

**Capa**: Discovery.
**Propósito**: la plataforma genera **Recomendaciones** (sistema → usuario) y, en sell-side, publica el **Teaser anonimizado** en el Marketplace para que buyers cualificados lo descubran. El Match aún **no nace** aquí; solo se preparan las condiciones para que el Buyer lo solicite (sub-acción tras T6).

**Estado inicial requerido**: `Opportunity.ACTIVA` con candidatas priorizadas (T4) y, si sell-side, Teaser preparado para publicación (ver T6).
**Estado final**: Recomendaciones visibles a actores cualificados; Teaser publicado al Marketplace (sell-side).
**Actores principales**: Seller, Buyer cualificado, Advisor, Sistema, Market Copilot, Opportunity Advisor.

**Información consumida**:
- Compatibility scores.
- Criterios de Marketplace (sectores, geografías, tamaños).
- Restricciones de exclusividad existentes.

**Información generada / artefactos**:
- **Recomendaciones** (sistema → buyer / sistema → seller). Persistencia configurable.
- Publicación al Marketplace (sell-side).

**Herramientas utilizadas**:
- Motor de matching (`MARKETPLACE_SPEC.md` — laguna).
- UI de descubrimiento (cards resumidas).

**Motores de IA implicados**:
- **Market Copilot / Opportunity Advisor** (L2 razones de recomendación).
- **Sistema** ejecuta scoring.

**Acciones automáticas**:
- Generar Recomendaciones.
- Indexar Teasers en Marketplace.

**Acciones con aprobación explícita del usuario**:
- Buyer: revisar Recomendaciones / navegar Marketplace.
- Seller: aprobar publicación al Marketplace.

**Memoria utilizada**:
- **Memoria de oportunidad** (histórico recomendaciones).

**Permisos por rol**:
- Recomendaciones visibles solo al dueño de la Opportunity correspondiente.
- Marketplace visible a buyers cualificados (rol + criterios).

**Trazabilidad**:
- `recommendation.generated`.
- `marketplace.listing_published`.

**Transiciones permitidas**:
- → T6 (consumo del Teaser).
- Vuelta a T4 si las recomendaciones son rechazadas en masa.

**Riesgos / consideraciones**:
- Calidad del scoring. Se prioriza precision sobre recall en niveles iniciales del producto.

---

### T6 — Acceso al Teaser anonimizado público

**Capa**: Discovery.
**Propósito**: el Buyer cualificado consume el **Teaser anonimizado** del activo desde el Marketplace para decidir si **solicita un Match**. El Teaser **no identifica** la empresa; permite valorar el activo sin exponer la identidad del Seller.

**Estado inicial requerido**: Teaser publicado al Marketplace (T5). El Buyer cumple criterios de cualificación.
**Estado final**: el Buyer decide solicitar Match (ver sub-acción posterior) o declina.
**Actores principales**: Buyer cualificado (lector), Seller (autor/aprobador previo), Advisor representando, Transaction Copilot.

**Información consumida**:
- Datos de la ficha Empresa (extracciones anonimizadas).
- Valoración (si el Seller decide exponer rango).

**Información generada / artefactos**:
- **Artefacto `Teaser anonimizado público`** (Documento canónico, ver §7).
- Registro de visualización por buyer (con watermark anonimizado).

**Herramientas utilizadas**:
- Skill futuro: "Generar teaser anónimo" (L2).
- Anonimizador de campos (capability).

**Motores de IA implicados**:
- **Transaction Copilot** (L2 borrador del Teaser).
- **Company Copilot** (datos fuente).

**Acciones automáticas**:
- Registrar acceso al Teaser.
- Watermarks por usuario (no identifican empresa, identifican consumidor).

**Acciones con aprobación explícita del usuario**:
- Seller: aprobar el Teaser para publicación.
- Buyer: solicitar Match (ver sub-acción) o declinar.

**Memoria utilizada**:
- **Memoria de empresa**: lineage del Teaser (qué datos se incluyeron, qué se anonimizó).
- **Memoria de oportunidad** (sell-side).

**Permisos por rol**:
- **Buyer cualificado** (subscriber/buyer/corporate/investor que cumpla criterios Marketplace): **lectura** del Teaser sin necesidad de Match. **No** se expone a usuarios anónimos en internet abierto.
- Seller: lectura + edición pre-aprobación.
- `arroba_team`: lectura (auditoría).
- Resto: prohibido.

**Trazabilidad**:
- `teaser.released_to_marketplace`.
- `teaser.accessed_by_buyer` (con buyer_id + watermark).

**Transiciones permitidas**:
- → Sub-acción "Solicitud de Match" (siguiente bloque).
- Sin transición (buyer declina; no se crea Match).

**Riesgos / consideraciones**:
- Calidad de la anonimización: si el Teaser revela inadvertidamente la identidad, se viola la confidencialidad del Seller. **Capability obligatoria**: revisor automático de anonimización + revisor humano (Equipo arroba) para Teasers de alto valor.

---

### Sub-acción — Solicitud de Match (frontera entre Discovery y Transaction)

**Capa**: Discovery (cierra el bloque).
**Propósito**: el Buyer dispara la creación de un `Match` en estado `SOLICITADO`. Es la única vía canónica para iniciar el camino hacia una Operation.

**Estado inicial requerido**: Buyer cualificado ha consumido el Teaser (T6).
**Estado final**: entidad `Match` creada en estado `SOLICITADO`, asociada a la `Opportunity` del Seller y al `Buyer`.
**Actores principales**: Buyer (solicitante), Seller (receptor de la notificación), Advisor representando, Sistema, Transaction Copilot.

**Información consumida**:
- Teaser consumido.
- Datos de cualificación del Buyer.

**Información generada / artefactos**:
- **Entidad `Match`** (estado `SOLICITADO`).
- Notificación al Seller.

**Herramientas utilizadas**:
- UI "Solicitar Match" desde el Teaser o desde la card del Marketplace.
- Validador de cualificación del Buyer.

**Motores de IA implicados**:
- **Transaction Copilot** (L1 conversacional, L2 ayuda al Buyer a redactar nota de solicitud opcional).

**Acciones automáticas**:
- Crear `Match.SOLICITADO`.
- Notificar al Seller (y a su Advisor si aplica).
- Iniciar contador de ventana de respuesta (plazo de aceptación — ver `[OPEN-A8]` política de caducidad configurable).

**Acciones con aprobación explícita del usuario**:
- Buyer: enviar Solicitud de Match.
- Seller (en respuesta): aceptar, rechazar o dejar expirar.

**Memoria utilizada**:
- **Memoria de match**: se inicializa.
- **Memoria de oportunidad**: registra el match solicitado.

**Permisos por rol**:
- Buyer cualificado: solicitar.
- Seller: ver lista de Match.SOLICITADOS sobre su Opportunity.

**Trazabilidad**:
- **`match.solicited`** ★ inmutable crítico.

**Transiciones permitidas**:
- → Aceptación del Seller ⇒ `Match.ACEPTADO` ⇒ nace `Operation` ⇒ entra Transaction Layer (T7).
- → Rechazo del Seller ⇒ `Match.RECHAZADO` (terminal sin Operation).
- → Expiración del plazo de respuesta ⇒ `Match.EXPIRADO` (terminal sin Operation).

**Riesgos / consideraciones**:
- Spam de solicitudes por buyer no cualificado: capa de cualificación obligatoria (`BUYER_QUAL_SPEC.md` — laguna P1).
- Anti-abuso: un buyer que recibe N rechazos consecutivos del mismo seller queda **bloqueado** para ese seller. Detalle en `MARKETPLACE_SPEC.md`.

═════════════════════════════════════════════════════════════════════════════
### 🟥 TRANSACTION LAYER
═════════════════════════════════════════════════════════════════════════════

> **Frontera operativa**: el Seller acepta la Solicitud de Match ⇒ `Match.ACEPTADO` ⇒ Sistema crea inmediatamente la `Operation` con `current_phase = nda` ⇒ entra Transaction Layer.
>
> A partir de aquí todas las fases trabajan sobre la entidad `Operation`. La entidad `Match` queda como **lineage histórico** (URL `/match/{id}` se conserva en modo solo-lectura).

### T7 — Firma del NDA

**Capa**: Transaction.
**Propósito**: ambas partes firman un Non-Disclosure Agreement que desbloquea el acceso al Information Memorandum y al Data Room.

**Estado inicial requerido**: `Operation.current_phase = nda` (recién creada).
**Estado final**: NDA firmado por ambas partes; visibilidad expandida automáticamente; `current_phase = im`.
**Actores principales**: Buyer, Seller, Advisor (si actúa por delegación), `arroba_team` (auditoría), capability firma electrónica.

**Información consumida**:
- Plantilla NDA (Boundary First).
- Identidades de ambas partes (ahora visibles entre sí — el Match aceptado las revela).

**Información generada / artefactos**:
- **Documento `NDA`** (`Document.kind = "nda"`, `signed_by_ids = [seller, buyer]`).
- Evento `nda.fully_signed`.

**Herramientas utilizadas**:
- Capability firma electrónica.
- Plantilla NDA (estándar inicial; `NDA_SPEC.md` — laguna P0).

**Motores de IA implicados**:
- **Transaction Copilot** (L3 ejecución asistida: "Confirmar firma" con aprobación humana explícita).
- **Advisor Copilot** (L2 revisión de plantilla).

**Acciones automáticas**:
- Abrir acceso a IM y Data Room una vez verificada la doble firma.
- Notificar a contraparte y advisors.
- Transicionar `current_phase = im`.

**Acciones con aprobación explícita del usuario**:
- Cada parte firma (consentimiento informado).

**Memoria utilizada**:
- **Memoria de operación**: NDA firmado.
- **Memoria de empresa**: opcional — qué buyers tienen NDA activo.

**Permisos por rol**:
- Buyer y Seller: firman.
- Advisors: revisan; firman sólo con poder específico documentado.
- `arroba_team`: lectura (auditoría).

**Trazabilidad**:
- `nda.template_loaded`.
- `nda.signed_by_party`.
- **`nda.fully_signed`** ★ inmutable crítico.

**Transiciones permitidas**:
- → T8 (`current_phase = im`).
- Aborto: si una parte no firma en ventana acordada ⇒ `Operation.CERRADA_SIN_ÉXITO` (consecuencias menores; ver §10).

**Riesgos / consideraciones**:
- NDA progresivo (niveles de revelación). Detalle en `NDA_SPEC.md`.

---

### T8 — Acceso al Information Memorandum (IM)

**Capa**: Transaction.
**Propósito**: el Buyer accede al IM, documento exhaustivo y **no anonimizado** sobre la empresa target.

**Estado inicial requerido**: `current_phase = im`. NDA firmado (`nda.fully_signed`).
**Estado final**: el Buyer ha consumido el IM; decisión de avanzar (Q&A / IOI / LOI) o declinar.
**Actores principales**: Buyer (consumidor), Seller (autor), Advisor, Transaction Copilot.

**Información consumida**:
- Datos completos de la ficha Empresa.
- Valoraciones aplicables.
- Documentos asociados.

**Información generada / artefactos**:
- **Documento `Information Memorandum`** (`Document.kind = "im"`).
- Registro de accesos.

**Herramientas utilizadas**:
- Skill futuro: "Generar IM draft" (L2).
- Editor estructurado de IM.

**Motores de IA implicados**:
- **Transaction Copilot** (L2 borrador del IM).
- **Company Copilot** (datos fuente).

**Acciones automáticas**:
- Indexar IM en el Data Room (preparatoria de DD).
- Watermarks por acceso.
- Transición a `current_phase = qa` cuando el Buyer pasa a preguntas o salta directo a LOI.

**Acciones con aprobación explícita del usuario**:
- Seller: aprobar IM para liberación.
- Buyer: solicitar avance.

**Memoria utilizada**:
- **Memoria de operación**: histórico de accesos y conversaciones sobre el IM.

**Permisos por rol**:
- Buyer post-NDA: lectura completa.
- Seller: lectura + edición pre-aprobación.
- Advisors (con NDA propio): lectura.
- `arroba_team`: lectura (auditoría).

**Trazabilidad**:
- `im.released`.
- `im.accessed_by_buyer`.

**Transiciones permitidas**:
- → T9 (Q&A) — natural.
- → T10 (LOI/NBO) directamente si el Buyer tiene oferta clara.
- Aborto: `Operation.CERRADA_SIN_ÉXITO`.

**Riesgos / consideraciones**:
- Filtración: el IM es el documento más sensible pre-LOI. Watermarks + audit obligatorios.

---

### T9 — Preguntas y respuestas (Q&A)

**Capa**: Transaction.
**Propósito**: intercambio estructurado entre Buyer y Seller para aclarar puntos del IM antes de avanzar a oferta.

**Estado inicial requerido**: `current_phase = qa`.
**Estado final**: Q&A log cerrado o pausado.
**Actores principales**: Buyer, Seller, Advisors de ambos lados, Transaction Copilot.

**Información consumida**:
- Preguntas del Buyer.
- Datos de la Empresa, IM, valoraciones.

**Información generada / artefactos**:
- **Artefacto `Q&A log`** (estructurado).

**Herramientas utilizadas**:
- UI de preguntas estructuradas.
- Skill futuro: "DD questions auto" (L2).

**Motores de IA implicados**:
- **Transaction Copilot** (L2 sugerencia de preguntas estándar por sector).
- **Advisor Copilot** (L2 ayuda al Seller a estructurar respuestas).

**Acciones automáticas**:
- Indexar Q&A log con tags por categoría.

**Acciones con aprobación explícita del usuario**:
- Buyer envía pregunta.
- Seller envía respuesta.
- Cierre del log (mutuo).

**Memoria utilizada**:
- **Memoria de operación**: Q&A log persistido.

**Permisos por rol**:
- Buyer y Seller: lectura/escritura.
- Advisors: lectura/escritura representando.
- `arroba_team`: lectura (auditoría).

**Trazabilidad**:
- `qa.question_posted`.
- `qa.answer_posted`.
- `qa.log_closed`.

**Transiciones permitidas**:
- → T10 cuando Buyer emite oferta.
- Pausa.
- Aborto.

**Riesgos / consideraciones**:
- Sesgo del Seller (omisiones). El audit preserva la evidencia.

---

### T10 — Presentación de la Oferta Indicativa (LOI / NBO)

**Capa**: Transaction.
**Propósito**: el Buyer emite oferta. El sub-estado **IOI (opcional)** permite indicar interés no vinculante antes de la LOI/NBO vinculante.

**Estado inicial requerido**: `current_phase = loi`.
**Estado final**: LOI/NBO firmada por ambas partes ⇒ avance a T11 (`current_phase = dd`).
**Actores principales**: Buyer, Seller, Advisors, capability firma electrónica.

#### Sub-estados de fase 10

```
[IOI (opcional)] ──► LOI_PRESENTADA ──► LOI_ACEPTADA       ──► current_phase = dd
                                  ──► LOI_NEGOCIADA ──► ...
                                  ──► LOI_RECHAZADA ──► Operation.CERRADA_SIN_ÉXITO
```

- **IOI**: no vinculante; opcional. El Buyer comunica interés con rango de precio.
- **LOI_PRESENTADA**: el Buyer firma oferta vinculante.
- **LOI_ACEPTADA**: el Seller firma sin cambios ⇒ avance a fase 11.
- **LOI_NEGOCIADA**: Seller propone contra-condiciones; vuelve a `LOI_PRESENTADA`.
- **LOI_RECHAZADA**: Seller rechaza ⇒ Operation termina sin éxito (o vuelta a Q&A si se reabre).

**Información consumida**:
- IM, Q&A log, Valoraciones de referencia.

**Información generada / artefactos**:
- (opcional) **Documento `IOI`** (`Document.kind = "ioi"`).
- **Documento `LOI/NBO`** (`Document.kind = "loi"`, `signed_by_ids = [buyer, seller]`).

**Herramientas utilizadas**:
- Plantilla LOI (`LOI_SPEC.md` — laguna).
- Capability firma electrónica.
- Skill futuro: "LOI draft" (L2).

**Motores de IA implicados**:
- **Transaction Copilot** (L2 draft LOI; comparator multi-bidder si aplica).
- **Advisor Copilot** (L2 revisión cláusulas).

**Acciones automáticas**:
- Verificar doble firma → transicionar `current_phase = dd`.
- Activar cláusulas de exclusividad declaradas.

**Acciones con aprobación explícita del usuario**:
- Buyer: presentar IOI/LOI.
- Seller: aceptar/negociar/rechazar.
- Ambos: firmar LOI definitiva.

**Memoria utilizada**:
- **Memoria de operación**: LOI lineage.

**Permisos por rol**:
- Buyer y Seller: emitir/recibir.
- Advisors: revisar.
- `arroba_team`: lectura (auditoría); validación opcional crítica (ver §10).

**Trazabilidad**:
- `ioi.presented` (opcional).
- `loi.presented`.
- `loi.negotiated`.
- `loi.rejected`.
- **`loi.fully_signed`** ★ inmutable crítico.

**Transiciones permitidas**:
- → T11 (DD).
- `Operation.CERRADA_SIN_ÉXITO` si LOI rechazada y no reapertura.
- Pausa.

**Riesgos / consideraciones**:
- Exclusividad temporal: la LOI suele incluir cláusula. La plataforma debe **prevenir** que el Seller acepte LOIs simultáneas durante el plazo.

---

### T11 — Due Diligence (DD)

**Capa**: Transaction.
**Propósito**: revisión exhaustiva del Buyer (y sus asesores) sobre la empresa target. Incluye **Data Room** + interacciones de análisis.

**Estado inicial requerido**: `current_phase = dd`.
**Estado final**: DD report emitido; transición a `current_phase = negotiation`.
**Actores principales**: Buyer + advisors del Buyer, Seller (proveedor de información), Transaction Copilot, Advisor Copilot.

**Información consumida**:
- Documentos del Data Room (financieros, contratos, laboral, fiscal, IP, ESG).
- Q&A log fase 9.

**Información generada / artefactos**:
- **Documento `DD report`** (`Document.kind = "dd_report"`).
- Q&A log de DD (continuación o nuevo).
- Hallazgos clasificados (red flags / yellow flags / ok).

**Herramientas utilizadas**:
- Data Room (`DATAROOM_SPEC.md` — laguna).
- Skill futuro: "Análisis de Data Room" (L2).
- Skill futuro: "Comparación de contratos" (L2).

**Motores de IA implicados**:
- **Transaction Copilot** (L2 análisis automatizado de documentos, L4 notificaciones de hitos autorizadas).
- **Advisor Copilot** (L2 estructura de hallazgos).

**Acciones automáticas**:
- Indexar documentos.
- Watermarks por usuario y por documento.
- Audit de cada acceso.

**Acciones con aprobación explícita del usuario**:
- Subir documento (Seller).
- Solicitar documento adicional (Buyer).
- Cerrar DD (Buyer).

**Memoria utilizada**:
- **Memoria de operación**: hallazgos, Q&A.
- **Memoria de empresa**: documentos relevantes con flags de confidencialidad.

**Permisos por rol**:
- Buyer + advisors Buyer: lectura del Data Room.
- Seller + advisors Seller: escritura del Data Room.
- `arroba_team`: lectura (auditoría).

**Trazabilidad**:
- `dataroom.opened`.
- `dataroom.document_uploaded`.
- `dataroom.document_accessed`.
- `dd.report_emitted`.

**Transiciones permitidas**:
- → T12 (Negociación).
- Pausa.
- `Operation.CERRADA_SIN_ÉXITO` si red flags terminales.

**Riesgos / consideraciones**:
- DD prolongada erosiona el deal. Tracker de tiempo en DD como KPI.

---

### T12 — Negociación

**Capa**: Transaction.
**Propósito**: ajuste final de términos del SPA: precio, estructura, earn-out, garantías, indemnities, condiciones suspensivas, no competencia.

**Estado inicial requerido**: `current_phase = negotiation`. DD report emitido. (`negotiation` es valor canónico del enum `Operation.current_phase`, añadido entre `dd` y `spa`.)
**Estado final**: términos consensuados; draft SPA listo para firma; transición a `current_phase = spa`.
**Actores principales**: Buyer, Seller, Advisors (centrales), Transaction Copilot, Advisor Copilot.

**Información consumida**:
- DD report.
- LOI/NBO firmada.
- Valoraciones actualizadas.

**Información generada / artefactos**:
- Drafts SPA versionados.
- Acuerdos parciales (earn-out, garantías).

**Herramientas utilizadas**:
- Editor colaborativo de SPA draft.
- Skill futuro: "Earn-out clauses" (L2).
- Skill futuro: "Comparación de contratos" (L2).

**Motores de IA implicados**:
- **Advisor Copilot** (L2 propuestas de cláusulas, L3 redacción asistida con confirmación).
- **Transaction Copilot** (L1 conversacional, L2 resúmenes).

**Acciones automáticas**:
- Versionado automático del draft.
- Diff entre versiones.

**Acciones con aprobación explícita del usuario**:
- Cada cambio de cláusula requiere aprobación de ambos lados.
- Cerrar negociación → habilitar firma SPA.

**Memoria utilizada**:
- **Memoria de operación**: drafts, decisiones por cláusula.

**Permisos por rol**:
- Buyer + Advisors Buyer: lectura/escritura representando.
- Seller + Advisors Seller: lectura/escritura representando.
- `arroba_team`: lectura (auditoría).

**Trazabilidad**:
- `spa.draft_versioned`.
- `spa.clause_agreed`.
- `negotiation.closed`.

**Transiciones permitidas**:
- → T13 (`current_phase = spa`).
- Pausa.
- `Operation.CERRADA_SIN_ÉXITO` si negociación rota.

**Riesgos / consideraciones**:
- Conflictos de interés Advisor ↔ representado. Audit registra quién propuso qué.

---

### T13 — Firma del SPA

**Capa**: Transaction.
**Propósito**: firma del SPA definitivo. Contrato vinculante final.

**Estado inicial requerido**: `current_phase = spa`. SPA draft consensuado.
**Estado final**: SPA firmado por ambas partes; condiciones suspensivas activas; transición a `current_phase = closing`.
**Actores principales**: Buyer, Seller (firmantes), Advisors (testigos), `arroba_team` (validación crítica), capability firma electrónica con valor legal.

**Información consumida**:
- SPA draft consensuado.
- Identidades, poderes, validaciones legales.

**Información generada / artefactos**:
- **Documento `SPA`** (`Document.kind = "spa"`, `signed_by_ids = [seller, buyer]`).

**Herramientas utilizadas**:
- Capability firma electrónica con valor legal.

**Motores de IA implicados**:
- **Advisor Copilot** (L2 último review pre-firma).
- **Transaction Copilot** (L3 ejecución asistida — coordinación).

**Acciones automáticas**:
- Verificación de doble firma.
- Bloqueo de edición (inmutabilidad post-firma, `ENTITY_MODEL.md` §7.3).
- Activar condiciones suspensivas declaradas.

**Acciones con aprobación explícita del usuario**:
- Cada firma (consentimiento informado).

**Memoria utilizada**:
- **Memoria de operación**: SPA firmado en lineage permanente.

**Permisos por rol**:
- Buyer y Seller: firman.
- Advisors: revisión final.
- `arroba_team`: validación crítica opcional (sello de auditoría externa).

**Trazabilidad**:
- `spa.signed_by_party`.
- **`spa.fully_signed`** ★ inmutable crítico.

**Transiciones permitidas**:
- → T14 (`current_phase = closing`).
- `Operation.CANCELADA` si condiciones suspensivas no cumplidas en plazo.

**Riesgos / consideraciones**:
- Inmutabilidad post-firma estricta. Modificaciones posteriores son addenda versionados.

---

### T14 — Closing legal

**Capa**: Transaction.
**Propósito**: ejecución de las contraprestaciones del SPA: pago, transferencia, formalización notarial, cumplimiento de suspensivas.

**Estado inicial requerido**: `current_phase = closing`. SPA firmado.
**Estado final**: Closing declarado. **La `Operation` NO pasa a estado terminal aquí.** Transición a `current_phase = integration`.
**Actores principales**: Buyer, Seller, Advisors, Notario / fedatario (Boundary), Banco (Boundary).

**Información consumida**:
- SPA.
- Verificaciones de condiciones suspensivas.
- Confirmaciones bancarias / notariales.

**Información generada / artefactos**:
- **Documento `Closing memo`** (registro del cierre con pruebas).
- Confirmaciones de pago y transferencia.

**Herramientas utilizadas**:
- Capability boundary con notaría / fedatario.
- Capability boundary con bancos.
- Tracker de condiciones suspensivas.

**Motores de IA implicados**:
- **Transaction Copilot** (L1 explicaciones, L4 verificación autorizada de hitos).
- **Sistema** (verificación automática).

**Acciones automáticas**:
- Marcar cada condición suspensiva cumplida.
- Disparar `monetization.fee_due` (ver `MONETIZATION_SPEC`).

**Acciones con aprobación explícita del usuario**:
- Confirmación de pago recibido (Seller).
- Confirmación de transferencia ejecutada (Buyer).
- Declaración formal de Closing.

**Memoria utilizada**:
- **Memoria de operación**: Closing memo, eventos económicos.

**Permisos por rol**:
- Buyer y Seller: ejecutan y confirman.
- Advisors: asisten.
- `arroba_team`: validación obligatoria (sello).

**Trazabilidad**:
- `closing.condition_met`.
- **`closing.declared`** ★ inmutable crítico.
- `monetization.fee_due`.

**Transiciones permitidas**:
- → T15 (`current_phase = integration`).
- `Operation.CANCELADA` si una suspensiva no se cumple en plazo definitivo.

**Riesgos / consideraciones**:
- Fee de cierre (Finder Fee / Success Fee) se devenga aquí (`MONETIZATION_SPEC.md`).
- Ausencia del Closing en plazo ≠ cancelación inmediata.

---

### T15 — Integración post-operación

**Capa**: Transaction.
**Propósito**: ejecución del plan de integración acordado. Su cierre marca el fin definitivo del ciclo de vida de la `Operation`.

**Estado inicial requerido**: `current_phase = integration` (Closing declarado).
**Estado final**: `Operation.CERRADA_CON_ÉXITO`.
**Actores principales**: Buyer (típicamente lidera), Seller (apoyo decreciente), Advisors, Transaction Copilot.

**Información consumida**:
- SPA (cláusulas de integración).
- Plan de integración acordado.

**Información generada / artefactos**:
- **Documento `Integration plan`** (hitos, owners, deadlines).
- Reportes de progreso periódicos.

**Herramientas utilizadas**:
- Tracker de hitos.
- Skill futuro: "Integración post-deal" (L2 automatización de check-ins).

**Motores de IA implicados**:
- **Transaction Copilot** (L1, L2, L4 recordatorios autorizados).

**Acciones automáticas**:
- Recordatorios de hitos (L4 previa autorización).
- Reportes periódicos.

**Acciones con aprobación explícita del usuario**:
- Marcar hito cumplido.
- Declarar integración completada (acuerdo de ambas partes).

**Memoria utilizada**:
- **Memoria de operación**: cierre permanente.
- **Memoria de empresa**: la operación queda en lineage de la empresa target.

**Permisos por rol**:
- Buyer + Seller: ejecutores.
- Advisors: asistencia.
- `arroba_team`: lectura (auditoría).

**Trazabilidad**:
- `integration.milestone_completed`.
- **`integration.completed`** ★ inmutable crítico.
- `operation.closed_with_success`.

**Transiciones permitidas**:
- → `Operation.CERRADA_CON_ÉXITO`.
- Pausa.
- `Operation.CERRADA_SIN_ÉXITO` si la integración aborta tras Closing (caso atípico; requiere intervención `arroba_team`).

**Riesgos / consideraciones**:
- Fase larga (meses/años). Reducir intensidad de seguimiento progresivamente.
- Integración fallida post-Closing: la `Operation` queda registrada como ejecutada legalmente pero con integración no exitosa. Distinción legalmente relevante.

---

## 6. Deal Workspace y Match Workspace

### 6.1 Match Workspace (Discovery Layer)

**Vista UX mínima** sobre la entidad `Match` en estado `SOLICITADO`. URL canónica **`/match/{id}`**. Discovery Layer.

**Capacidades**:
- Buyer: ver el estado de su Solicitud, el Teaser referenciado, contraargumentos opcionales.
- Seller: revisar la cualificación del Buyer, aceptar, rechazar o dejar expirar.
- Advisor representando: asistir a su parte.
- `arroba_team`: lectura (auditoría).

**Ciclo de vida del Match Workspace**:
- Se crea con `match.solicited`.
- Cierra (modo solo-lectura) al transitar el Match a un estado terminal:
  - `ACEPTADO` → la actividad migra al Deal Workspace (`/operacion/{id}`); `/match/{id}` queda como referencia histórica.
  - `RECHAZADO` o `EXPIRADO` → `/match/{id}` queda como registro histórico.

**Composición**: subconjunto mínimo de los módulos del Entity Framework (Header con anonimización parcial, Hero con la propuesta, Acciones).

### 6.2 Deal Workspace (Transaction Layer)

**Vista UX orquestadora** sobre una entidad `Operation`. URL canónica **`/operacion/{id}`**. Transaction Layer. **No es entidad canónica nueva.** Respeta `ARROBA_PHILOSOPHY.md` §8.

### 6.3 Vistas por actor

Cada actor ve un Deal Workspace **proyectado** según su rol y la fase actual:

| Actor | Vista del Deal Workspace |
|---|---|
| **Buyer** | Foco en IM → Q&A → DD findings → SPA negotiation. Acceso al Data Room (lectura). |
| **Seller** | Foco en estado del proceso, contrapartes activas, documentos pendientes. Acceso al Data Room (escritura). |
| **Advisor** | Vista del lado representado; más herramientas de copilot. |
| **`arroba_team`** | Vista completa con audit visible. **No** firma. |
| **Sistema** | No-vista; ejecuta jobs. |

### 6.4 Composición por fase

El Deal Workspace **reutiliza los 12 módulos del Entity Framework** (`ENTITY_FRAMEWORK.md` §11.8 para Operation). Activos por fase:

| Fase | Módulos clave activos |
|---|---|
| 7 NDA | Header · Documentación (NDA pendiente) · Acciones ("Firmar") · Actividad |
| 8 IM | Header · Documentación (IM disponible) · Análisis · Acciones |
| 9 Q&A | Header · Actividad (Q&A timeline) · Acciones |
| 10 LOI | Header · Documentación (IOI/LOI drafts) · Actividad · Acciones |
| 11 DD | Header · KPIs (días, docs pendientes) · Documentación (Data Room) · Señales (hallazgos) · Acciones |
| 12 Negociación | Header · Documentación (SPA drafts) · Actividad · Acciones |
| 13 SPA | Header · Documentación (SPA pendiente firma) · Acciones |
| 14 Closing | Header · KPIs (condiciones suspensivas) · Actividad · Acciones |
| 15 Integración | Header · KPIs (hitos) · Actividad (progreso) · Acciones |

### 6.5 Conexión con Memory Engine y Copilots

El Deal Workspace **lee y escribe** en:

- **Memoria de operación** (post-Match aceptado hasta cierre).
- **Memoria de match** (referencia histórica, solo lectura).
- **Memoria compartida entre copilots** (ver `COPILOTS_SPEC.md`).

El Deal Workspace **no almacena estado propio**: es **proyección** de la `Operation` subyacente.

---

## 7. Catálogo canónico de artefactos

| # | Artefacto | Document.kind | Capa | Fase que lo produce | Fase(s) consumidoras | Inmutable post-firma |
|---|---|---|---|---|---|---|
| 1 | Memoria mercantil | `mercantile_memory` | Discovery | 1 (fuente externa) | 1, 2, 6, 8 | No (snapshot) |
| 2 | Valuation report | (anexo `valuation`) | Discovery | 2 | 5, 10, 12 | No (versionable) |
| 3 | Card resumida (Marketplace) | (vista, no documento) | Discovery | 5 | 6 | n/a |
| 4 | **Teaser anonimizado público** | `teaser` | **Discovery** | 6 | 6 (consumido por buyers cualificados sin Match) | Sí, cuando se libera |
| 5 | NDA | `nda` | Transaction | 7 | 7-15 | **Sí** (post-firma) |
| 6 | Information Memorandum (IM) | `im` | Transaction | 8 | 8-13 | Sí, cuando se libera |
| 7 | Q&A log | (estructurado) | Transaction | 9 + 11 | 9-15 | Inmutable al cerrarse |
| 8 | IOI (opcional) | `ioi` | Transaction | 10 (sub-estado) | 10 | Sí, cuando se emite |
| 9 | LOI / NBO | `loi` | Transaction | 10 | 10-15 | **Sí** (post-firma) |
| 10 | DD report | `dd_report` | Transaction | 11 | 11-15 | Sí, cuando se emite |
| 11 | SPA | `spa` | Transaction | 12 (drafts) → 13 (firma) | 13-15 | **Sí** (post-firma) |
| 12 | Closing memo | `closing_memo` *(canónico nuevo)* | Transaction | 14 | 14-15 | Sí |
| 13 | Integration plan | `integration_plan` *(canónico nuevo)* | Transaction | 15 | 15 | No (versionable) |
| 14 | Match certificate | `match_certificate` *(canónico nuevo)* | Frontera | Sub-acción "Solicitud de Match" (al aceptarse) | Lineage permanente de la Operation | Sí (inmutable desde su creación) |
| 15 | Mandate | (referencia a entidad) | Pre-T3 (opcional) | 3-15 | Inmutable post-firma cliente↔advisor |
| 16 | Audit log entries | (eventos) | Ambas | Todas las fases | Auditoría | **Sí siempre** |

**Notas**:
- Los `Document.kind` marcados como *canónico nuevo* (Closing memo, Integration plan, Match certificate) se añaden al enum de `ENTITY_MODEL.md` §5.9 al cierre del Sprint 0.
- "Teaser" del Discovery Layer **NO es** equivalente al "Teaser" entendido como artefacto post-NDA en otros modelos M&A. Es **anonimizado** y **visible a buyers cualificados sin Match**.
- "Inmutable post-firma" sigue `ENTITY_MODEL.md` §7.3.

---

## 8. Permisos y visibilidad progresiva

### 8.1 Matriz global resumen

Notación: `R` lectura · `W` escritura · `S` firma · `─` sin acceso.

| Artefacto | Anónimo internet | Buyer cualificado Marketplace (sin Match) | Match.SOLICITADO | Match.ACEPTADO ⇒ Operation T7+ | Post-NDA (T8+) | Post-LOI (T11+) | Post-SPA (T13+) | Post-Closing | Post-Integración |
|---|---|---|---|---|---|---|---|---|---|
| Ficha pública Empresa | `R` | `R` | `R` | `R` | `R` | `R` | `R` | `R` | `R` |
| Datos completos Empresa | `─` | `─` | `─` Buyer · `R` Seller | `R` Buyer · `R` Seller | `R` ambos | `R` ambos | `R` ambos | `R` ambos | `R` ambos |
| Card resumida Marketplace | `─` | `R` | `R` | n/a | n/a | n/a | n/a | n/a | n/a |
| **Teaser anonimizado público** | `─` | **`R`** (cualquier buyer cualificado) | `R` | `R` Buyer del Match | `R` | `R` | `R` | `R` | `R` |
| Cualificación del Buyer | `─` | (sus propios datos) | `R` Seller | `R` Seller, ambos advisors | `R` | `R` | `R` | `R` | `R` |
| Match metadatos | `─` | `─` | `RW` Buyer · `RW` Seller | `R` (histórico) | `R` | `R` | `R` | `R` | `R` |
| NDA | `─` | `─` | `─` | `RS` ambos (T7) | `R` (firmado) | `R` | `R` | `R` | `R` |
| IM | `─` | `─` | `─` | `─` (T7) | `R` Buyer · `RW` Seller | `R` ambos | `R` | `R` | `R` |
| Q&A log | `─` | `─` | `─` | `─` | `RW` ambos (T9) | `R` (cerrado) | `R` | `R` | `R` |
| IOI | `─` | `─` | `─` | `─` | `─` | `R` ambos (T10) | `R` | `R` | `R` |
| LOI | `─` | `─` | `─` | `─` | `─` | `RWS` ambos | `R` (firmada) | `R` | `R` |
| Data Room | `─` | `─` | `─` | `─` | `─` | `R` Buyer · `RW` Seller (T11) | `R` ambos | `R` ambos | `R` ambos |
| DD report | `─` | `─` | `─` | `─` | `─` | `─` | `RW` (T11) → `R` | `R` | `R` |
| SPA (draft) | `─` | `─` | `─` | `─` | `─` | `─` | `RW` ambos (T12) | `R` (firmado) | `R` |
| SPA (firmado) | `─` | `─` | `─` | `─` | `─` | `─` | `─` | `R` | `R` |
| Closing memo | `─` | `─` | `─` | `─` | `─` | `─` | `─` | `R` | `R` |
| Integration plan | `─` | `─` | `─` | `─` | `─` | `─` | `─` | `─` | `RW` ambos |
| Audit log (sus propias acciones) | `R` (sólo evento `company.viewed` propio) | `R` propio | `R` propio | `R` propio | `R` propio | `R` propio | `R` propio | `R` propio | `R` propio |
| Audit log (completo del Match/Operation) | `─` | `─` | `─` (parte) | `─` (sólo eventos sobre uno mismo) | `─` (parte) | `─` (parte) | `─` (parte) | `R` parte | `R` parte |

### 8.2 Permisos del rol `arroba_team`

`arroba_team` es **rol específico nuevo, sin herencia de `admin`**. Sus capacidades son **acotadas**:

| Acción | `arroba_team` | `admin` |
|---|---|---|
| Lectura de cualquier audit log | ✓ (con marca `arroba_team.accessed`) | ✓ |
| Lectura de artefactos pre-firma | 🔒 sólo en mediación de disputa | ✓ |
| Lectura de artefactos post-Closing | ✓ | ✓ |
| Firma de NDA/LOI/SPA en nombre de partes | ✗ | ✗ |
| Validación crítica (sello) en NDA / SPA / Closing | ✓ (opcional) | ✓ |
| Congelar `Match` o `Operation` temporalmente | ✓ | ✓ |
| Archivar `Match` / `Operation` (terminal) | ✗ | ✓ |
| Cancelación administrativa | 🔒 con aprobación de `admin` | ✓ |
| Acceso a memoria global de copilots para mediación | ✓ (auditado) | ✓ |

### 8.3 Reglas de gating canónicas

- **Card resumida** y **Teaser anonimizado** del Discovery Layer son visibles a **buyers cualificados** del Marketplace; NO a usuarios anónimos en internet abierto; NO requieren Match.
- **Identidad de la Empresa target** se revela **al aceptarse el Match** (transición a Transaction Layer). El NDA refuerza la confidencialidad legal.
- **IM** no visible hasta NDA firmado (`nda.fully_signed`).
- **Q&A log** no escribible hasta IM consumido.
- **Data Room** no visible hasta LOI firmada (`loi.fully_signed`).
- **SPA draft** no editable hasta DD report emitido.
- **Closing memo** no accesible hasta `closing.declared`.
- **Integration plan** se materializa post-Closing.

### 8.4 Excepciones controladas

- **`arroba_team`** puede consultar artefactos pre-firma para mediación de disputas, con audit visible a las partes (`audit.arroba_team_accessed`).
- **`admin`** puede acceder a cualquier artefacto **post-Closing** para auditoría regulatoria; cualquier acceso queda en audit.

---

## 9. Trazabilidad y audit

### 9.1 Eventos canónicos del Audit Log

Lista exhaustiva (extensible solo por nueva versión del spec):

**Discovery Layer**:
- `company.viewed`
- `company.analysis_refreshed`
- `valuation.created`
- `opportunity.created`
- `opportunity.published`
- `opportunity.candidate_added` / `_excluded` / `_priority_changed`
- `recommendation.generated`
- `marketplace.listing_published`
- `teaser.released_to_marketplace`
- `teaser.accessed_by_buyer`

**Frontera (Match)**:
- **`match.solicited`** ★ inmutable crítico
- **`match.accepted`** ★ inmutable crítico (dispara `operation.created`)
- `match.rejected` ★ (terminal sin Operation)
- `match.expired` ★ (terminal sin Operation)

**Transaction Layer**:
- `operation.created`
- `nda.template_loaded` / `nda.signed_by_party`
- **`nda.fully_signed`** ★ inmutable crítico
- `im.released` / `im.accessed_by_buyer`
- `qa.question_posted` / `qa.answer_posted` / `qa.log_closed`
- `ioi.presented`
- `loi.presented` / `loi.negotiated` / `loi.rejected`
- **`loi.fully_signed`** ★ inmutable crítico
- `dataroom.opened` / `dataroom.document_uploaded` / `dataroom.document_accessed`
- `dd.report_emitted`
- `spa.draft_versioned` / `spa.clause_agreed`
- `negotiation.closed`
- **`spa.fully_signed`** ★ inmutable crítico
- `closing.condition_met`
- **`closing.declared`** ★ inmutable crítico (dispara billing y T15)
- `monetization.fee_due`
- `integration.milestone_completed`
- **`integration.completed`** ★ inmutable crítico
- `operation.closed_with_success`
- `operation.closed_without_success`
- `operation.cancelled`
- `operation.paused` / `operation.resumed`

**Gobierno**:
- `arroba_team.accessed`
- `admin.action_taken`

### 9.2 Inmutabilidad

Los eventos marcados con ★ son **inmutables y críticos**. Una vez emitidos no pueden modificarse ni eliminarse. Cualquier rectificación se hace con un evento adicional explícito que cite el evento original.

Resto de eventos: inmutables por defecto. Rectificaciones generan `audit.correction` con referencia al `event_id` corregido.

### 9.3 Acceso al audit log

| Quién | Qué ve |
|---|---|
| Cada parte | Sus propias acciones + acciones que la afectan (solicitud de match recibida, NDA firmado por contraparte, LOI presentada, etc.) |
| Advisor representando | Lo mismo que su parte representada |
| `arroba_team` | Vista parcial relevante para mediación (cuando hay incidencia), con marca de acceso |
| `admin` | Acceso total (con `admin.audit_accessed` registrado) |

### 9.4 Retención

Audit log se conserva **mínimo 10 años** post-cierre de la Operation (compliance M&A). Detalle de retención y archivado en `MEMORY_ENGINE_SPEC.md`.

---

## 10. Reglas de gobierno

### 10.1 Inicio de operación

Quién puede iniciar el ciclo TOS:

- **Subscriber/Corporate/Investor**: con plan activo (ver `MONETIZATION_SPEC`).
- **Advisor**: con `Mandate` válido.
- **`arroba_team` / `admin`**: no inician operaciones (sólo intervienen para soporte/moderación).

### 10.2 Aborto y cancelación

- **Cancelar `Opportunity`** (pre-Match): unilateral, sin consecuencias.
- **Abandonar `Match`** (pre-aceptación): el Buyer puede retirar la Solicitud antes de la respuesta del Seller; el Seller puede `RECHAZAR` o dejar `EXPIRAR`.
- **Cancelar `Operation` pre-LOI**: unilateral, consecuencias menores (audit + reputación).
- **Cancelar `Operation` post-LOI**: con consecuencias contractuales declaradas en LOI/NBO (breakage fee, exclusividad rota). El sistema persiste `CERRADA_SIN_ÉXITO` con motivo.
- **Cancelación administrativa** (`arroba_team` con aprobación `admin` / `admin`): por incumplimiento, fraude detectado, requerimiento legal. Audit y notificación obligatorios.

### 10.3 Pausa

- Cualquier parte puede solicitar pausa.
- La pausa **conserva** estado, artefactos, accesos.
- Reanudar requiere acción de **ambas** partes.
- **`[OPEN-A8]` Política de caducidad configurable.** Pendiente de decidir en spec dedicado o configuración dinámica. No se fija aquí ningún plazo absoluto.

### 10.4 Abandono unilateral

- **Pre-Match**: libre. Audit registra.
- **Post-Match / pre-NDA**: la parte que abandona queda registrada; consecuencias reputacionales (ver bloque `j` del inventario).
- **Post-NDA / pre-LOI**: implicaciones contractuales del NDA.
- **Post-LOI**: implicaciones legales según LOI/NBO.
- **Post-SPA**: implicaciones legales según SPA (típicamente penalizaciones severas).

### 10.5 Intervención `arroba_team`

Se activa por:

- Solicitud explícita de una parte (mediación).
- Detección automática de incidencia (red flag por el motor).
- Petición legal / regulatoria.

Capacidades: lectura, anotaciones, congelar entidad temporalmente, escalar a `admin`. **No firma en nombre.** **No archiva.** **No cancela administrativamente sin aprobación de `admin`.**

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
| Match.SOLICITADO → eliminado | ✗ | una vez creado el Match, su estado terminal queda en audit |
| NDA firmado → "olvidar" NDA | ✗ | información ya revelada, irreversible |
| LOI firmada → "deshacer" LOI | ✗ | salir solo vía cancelación con consecuencias |
| SPA firmado → "deshacer" SPA | ✗ | sólo vía addendum versionado |
| Closing declarado → reabrir | ✗ | irreversible salvo orden judicial |

---

## 11. Integración con otros specs

### 11.1 Conexión con `TRANSACTION_COPILOT_SPEC` (0.2)

El TRANSACTION_COPILOT_SPEC definirá el Transaction Copilot como orquestador conversacional general del TOS. Este spec le entrega:

- El catálogo de fases (§5) y la división Discovery/Transaction.
- La máquina de estados (§4) que debe respetar.
- Los artefactos (§7) que puede ayudar a producir.
- Los eventos canónicos (§9) que debe emitir cuando dispare acciones.

### 11.2 Conexión con `COPILOTS_SPEC` (0.3)

Por fase, los copilots especializados invocados:

| Fase | Capa | Copilots invocados |
|---|---|---|
| 1 Análisis | Discovery | Company |
| 2 Valoración | Discovery | Valuation, Company |
| 3 Identificación | Discovery | Market, Opportunity (variante Market) |
| 4 Screening | Discovery | Market, Opportunity |
| 5 Matching | Discovery | Market, Opportunity |
| 6 Teaser | Discovery | Transaction, Company |
| Sub-acción Solicitud de Match | Frontera | Transaction |
| 7 NDA | Transaction | Transaction, Advisor |
| 8 IM | Transaction | Transaction, Company |
| 9 Q&A | Transaction | Transaction, Advisor |
| 10 LOI | Transaction | Transaction, Advisor, Valuation |
| 11 DD | Transaction | Transaction, Advisor, Company |
| 12 Negociación | Transaction | Advisor (central), Transaction |
| 13 SPA | Transaction | Advisor, Transaction |
| 14 Closing | Transaction | Transaction |
| 15 Integración | Transaction | Transaction |

### 11.3 Conexión con `MEMORY_ENGINE_SPEC` (0.4)

Tipos de memoria referenciados:

- **Memoria de empresa** (fases 1, 2, 6, 8, 11; lineage permanente).
- **Memoria de valoración** (T2).
- **Memoria de oportunidad** (fases 3-5).
- **Memoria de match** (sub-acción + fases que aún viven como Match; pasa a referencia tras conversión).
- **Memoria de operación** (fases 7-15).
- **Memoria de usuario** (transversal).
- **Memoria de advisor** (transversal).
- **Memoria compartida entre copilots** (capa de contexto cruzado).
- **Audit log** (persistencia inmutable, retención 10 años).

### 11.4 Conexión con `AGENTIC_LAYERS_SPEC` (0.5)

Niveles agénticos permitidos por fase:

| Fase | Capa | L1 | L2 | L3 | L4 |
|---|---|---|---|---|---|
| 1 Análisis | Discovery | ✓ | ✓ | — | — |
| 2 Valoración | Discovery | ✓ | ✓ | — | — |
| 3 Identificación | Discovery | ✓ | ✓ | — | — |
| 4 Screening | Discovery | ✓ | ✓ | ✓ | — |
| 5 Matching | Discovery | ✓ | ✓ | ✓ | — |
| 6 Teaser | Discovery | ✓ | ✓ | — | — |
| Sub-acción Solicitud de Match | Frontera | ✓ | ✓ | ✓ | — |
| 7 NDA | Transaction | ✓ | ✓ | ✓ | — |
| 8 IM | Transaction | ✓ | ✓ | — | — |
| 9 Q&A | Transaction | ✓ | ✓ | ✓ | — |
| 10 LOI | Transaction | ✓ | ✓ | ✓ | — |
| 11 DD | Transaction | ✓ | ✓ | ✓ | ✓ (notificaciones) |
| 12 Negociación | Transaction | ✓ | ✓ | ✓ | — |
| 13 SPA | Transaction | ✓ | ✓ | ✓ | — |
| 14 Closing | Transaction | ✓ | ✓ | — | ✓ (verificación condiciones) |
| 15 Integración | Transaction | ✓ | ✓ | ✓ | ✓ (recordatorios) |

Detalle de scope de L4 por fase: `AGENTIC_LAYERS_SPEC.md`.

### 11.5 Conexión con `MONETIZATION_SPEC` (0.6)

Eventos del TOS que disparan eventos económicos (detalle de pricing en MONETIZATION_SPEC):

| Evento canónico | Tipo de cobro | Quién paga | Quién recibe |
|---|---|---|---|
| `marketplace.listing_published` | (Opcional) Listing fee | Seller | Plataforma |
| `match.solicited` | (Opcional) Solicitation fee | Buyer | Plataforma |
| `match.accepted` ⇒ `operation.created` | (Opcional) Match fee | Buyer y/o Seller | Plataforma |
| `nda.fully_signed` | (Opcional) Access fee al IM | Buyer | Plataforma |
| `loi.fully_signed` | (Opcional) Engagement fee | Buyer | Plataforma |
| **`closing.declared`** | **Success Fee / Finder Fee** | Seller (típicamente) o ambos | Plataforma + Advisors (revenue share) |
| `integration.completed` | (Opcional) Retention fee | Buyer | Plataforma |

### 11.6 Conexión con specs de Boundary (lagunas P0/P1 fuera del Sprint 0)

- `NDA_SPEC.md` (P0): plantillas NDA progresivos, fases de revelación.
- `CIS_SPEC.md` (P0): condiciones generales plataforma, aceptación por organización.
- `DATAROOM_SPEC.md` (P1): permisos, watermarks, índices.
- `LOI_SPEC.md` (P1): plantilla LOI, comparator multi-bidder.
- `MARKETPLACE_SPEC.md` (P1): motor de matching, scoring, anti-spam.
- `BUYER_QUAL_SPEC.md` (P1): cualificación del Buyer pre-Marketplace.

---

## 12. Versionado y evolución

### 12.1 Versión del TOS

Este documento es **`v1.1.0`** (sucede a `v1.0.0` con las 7 correcciones canónicas del usuario).

Cambios futuros:

- **v1.1.x (patch)**: clarificaciones, correcciones tipográficas, ajustes en redacción sin cambio funcional.
- **v1.x.0 (menor)**: ajuste interno a una fase existente (más detalle, refinamiento de permisos, nuevo evento de audit). No cambia el contrato externo.
- **v2.0.0 (mayor)**: cambio en el conjunto de fases (añadir/eliminar/reordenar), cambio en la máquina de estados global, cambio en la cadena `Opportunity → Match → Operation`. Requiere migración explícita de operaciones en curso.

### 12.2 Operaciones en curso al cambiar de versión

- Cambios **patch** y **menor**: las operaciones en curso continúan con el spec activo en su creación; los cambios se aplican automáticamente.
- Cambios **mayor (v2.0)**: las operaciones en curso **se completan con su spec original** salvo migración explícita formalizada en `migration_plan`.

### 12.3 Política de deprecaciones

Una fase no se elimina "en silencio":

1. Marcar como `deprecated` en el documento.
2. Mantener compatibilidad **2 versiones menores** mínimo.
3. Eliminar en v2.0.0 explícita.

---

## 13. Anexo — Diagrama del ciclo completo

```
═════════════════════════════════════════════════════════════════════════════════
                          CICLO TRANSACTION OS — 15 FASES
═════════════════════════════════════════════════════════════════════════════════

┌─────────────────────── DISCOVERY LAYER ────────────────────────────────────────┐
│                                                                                │
│  Empresa     Valoración   Opportunity   Opportunity   Opp+Recom    Buyer       │
│    │             │             │              │            │      cualif.     │
│    ▼             ▼             ▼              ▼            ▼         ▼         │
│  [ T1 ] ─► [ T2 ] ─►       [ T3 ] ─►      [ T4 ] ─►   [ T5 ] ─►  [ T6 ]        │
│  Análisis  Valoración    Identif.        Screening   Matching   Teaser         │
│   inicial                  + búsqueda      + prioriz. (Recom.   anonimizado    │
│                            contrapartes               + Market)  público       │
│                                                                    │           │
│                                                                    ▼           │
│                                                            ┌───────────────┐   │
│                                                            │ Sub-acción:   │   │
│                                                            │ Solicitud     │   │
│                                                            │ de Match      │   │
│                                                            └───────┬───────┘   │
│                                                                    │           │
│                                                          Match.SOLICITADO     │
└────────────────────────────────────────────────────────────────────┬───────────┘
                                                                     │
                              ◄─── FRONTERA: SELLER ACEPTA ──────────┘
                              │
                  Match.ACEPTADO  ⇒  Sistema crea Operation INMEDIATAMENTE
                              │       (current_phase = `nda`)
                              ▼
┌─────────────────────── TRANSACTION LAYER ──────────────────────────────────────┐
│                                                                                │
│   [ T7 ] ─► [ T8 ] ─► [ T9 ] ─► [ T10 ] ─► [ T11 ] ─► [ T12 ] ─►              │
│     NDA      IM        Q&A      IOI/LOI     DD          Negociación           │
│                                              + Data Room                       │
│                                                                                │
│   ─► [ T13 ] ─► [ T14 ] ─► [ T15 ]                                            │
│        SPA       Closing    Integración                                        │
│       firmado    legal      post-deal                                          │
│                                  │                                             │
│                                  ▼                                             │
│                       ┌─────────────────────┐                                  │
│                       │ CERRADA_CON_ÉXITO   │                                  │
│                       └─────────────────────┘                                  │
└────────────────────────────────────────────────────────────────────────────────┘

Estados terminales alternativos en cualquier fase activa:
  EN_PAUSA                  (reanudable, ver [OPEN-A8] política de caducidad)
  CERRADA_SIN_ÉXITO         (alguna parte se retira post-LOI / fallos suspensivos)
  CANCELADA                 (administrativa / legal)
  ARCHIVADA                 (admin)

Eventos críticos inmutables (★):
  match.solicited · match.accepted · nda.fully_signed · loi.fully_signed ·
  spa.fully_signed · closing.declared · integration.completed

═════════════════════════════════════════════════════════════════════════════════
```

---

## 14. Anexo — Open Questions

Lista consolidada de decisiones tras la corrección v1.1.0:

| ID | Pregunta | Resolución / Propuesta | Estado |
|---|---|---|---|
| ~~A1~~ | ¿Match es entidad o evento? | Entidad persistente de transición de ciclo corto | **CERRADO** 2026-06-25 |
| ~~A2~~ | Cardinalidad Match ↔ Operation | 1 Match → 0..1 Operation | **CERRADO** 2026-06-25 |
| ~~A3~~ | IOI vs LOI | IOI sub-estado opcional dentro de T10 | **CERRADO** 2026-06-25 |
| ~~A4~~ | "Negociación" (T12) | Valor canónico `negotiation` del enum `Operation.current_phase` entre `dd` y `spa` | **CERRADO** 2026-06-25 |
| ~~A5~~ | Integración: entidad nueva o fase de Operation | T15 dentro de la misma `Operation` (no entidad nueva) | **CERRADO** 2026-06-25 |
| ~~A6~~ | Fases pre-Match (1-5): ¿parte formal del TOS o ciclo previo? | Discovery Layer (parte formal del TOS). Transaction Layer comienza tras Match aceptado | **CERRADO** 2026-06-25 |
| ~~A7~~ | `Deal Workspace` URL canónica | URLs dobles: `/match/{id}` (Match Workspace) + `/operacion/{id}` (Deal Workspace). Coexisten | **CERRADO** 2026-06-25 |
| ~~A8~~ | Política de caducidad | **Tokens JWT 24h · refresh 30d · sesión 1h inactiva.** Decisión Sprint 0.5 (Ciclo B G2) | **CERRADO** 2026-06-25 |
| ~~A9~~ | `arroba_team`: rol nuevo o sub-permiso de `admin` | Rol específico nuevo `arroba_team`. **NO hereda** automáticamente permisos de `admin` | **CERRADO** 2026-06-25 |
| ~~A10~~ | Teaser accesible a usuarios anónimos | NO a anónimos en internet abierto. SÍ a **buyers cualificados** del Marketplace sin Match | **CERRADO** 2026-06-25 |
| ~~A11~~ | Cuándo Match → Operation | Inmediatamente al **`Match.ACEPTADO`**. La Operation nace con `current_phase = nda`. LOI deja de ser punto de conversión | **CERRADO** 2026-06-25 |
| ~~A12~~ | Persistencia de Recomendaciones (T5) | Persistir las accionadas; efímeras las no accionadas. Resuelto en `TRANSACTION_COPILOT_SPEC §12 B1` + `COPILOTS_SPEC §6.3` | **CERRADO** 2026-06-25 |
| **A13** | Reapertura tras `LOI_RECHAZADA` | El spec menciona "vuelta a Q&A si se reabre" pero no formaliza la transición de retroceso | **ABIERTO** |
| **A14** | Doble Match competitivo (mismo Seller, varios Buyers) | El spec asume exclusividad post-LOI pero NO prohíbe múltiples Match.ACEPTADO simultáneos pre-LOI. Decisión pendiente | **ABIERTO** |

### Lagunas documentales detectadas (fuera del Sprint 0)

**P0 — bloquean implementación de fases concretas**:
- `NDA_SPEC.md` — plantillas, NDA progresivo, niveles de revelación. Fases 7-8.
- `CIS_SPEC.md` — condiciones generales plataforma. Onboarding pre-fase 3.
- Especificación de **firma electrónica** (Boundary): proveedor concreto, evidencia probatoria, archivo notarial. Fases 7, 10, 13.

**P1 — bloquean superficies concretas**:
- `DATAROOM_SPEC.md` — estructura, permisos por fase, watermarks. Fase 11.
- `LOI_SPEC.md` — plantilla, comparator multi-bidder, exclusividad. Fase 10.
- `MARKETPLACE_SPEC.md` — motor de matching, scoring Compatibilidad, anti-spam. Fase 5.
- `BUYER_QUAL_SPEC.md` — cualificación del Buyer. Pre-T5 / fase 6.
- `SIGNALS_SPEC.md` — qué señales se calculan, cuándo se publican. Transversal.

**P2 — sub-modelos avanzados**:
- `EARNOUT_SPEC.md` — cláusulas, fórmulas. Fase 12.
- `ADVISOR_LAYER_SPEC.md` — flujo del advisor humano y revenue share. Varias fases.

### Decisiones canónicas pendientes de propagar al cierre del Sprint 0

Cuando los 6 specs del Sprint 0 estén aprobados, se actualizan:

1. **`ENTITY_MODEL.md`**:
   - Añadir entidad `match` como tipo canónico (ciclo corto: `SOLICITADO → ACEPTADO/RECHAZADO/EXPIRADO`).
   - Añadir relaciones `opportunity → matches[]` (1:N), `match → operation` (1:0..1).
   - Reescribir el enum `Operation.current_phase` (eliminar `matching`, mantener `nda`, `im`, `qa`, `ioi`, `loi`, `dd`; añadir `negotiation`, `closing`, `integration`).
   - Añadir nuevos `Document.kind`: `closing_memo`, `integration_plan`, `match_certificate`.
   - Añadir rol `arroba_team` al `Role` enum.
2. **`ARROBA_PHILOSOPHY.md`**:
   - §5/§6: actualizar la enumeración de fases incluyendo `negotiation` e `integración post-operación`.
   - §7: aclarar la distinción "Matching (mecanismo) no es entidad / `Match` (resultado) sí es entidad de ciclo corto".
   - §13: añadir la capa "Engines & Specs" entre Entity Framework y Design System.
3. **`ENTITY_FRAMEWORK.md`**:
   - Añadir §11.13 (Match): módulos canónicos mínimos del Match Workspace.
   - Actualizar §11.8 (Operation): reflejar que `current_phase` arranca en `nda` y reflejar `negotiation` e `integration`.

> **Fin del documento.** — `v1.1.0` — pendiente de revisión humana.
