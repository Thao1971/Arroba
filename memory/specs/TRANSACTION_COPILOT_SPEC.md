# arroba.com — Transaction Copilot Spec v1.1.0

> **Capa canónica**: *Engines & Specs* (séptima capa, pendiente de propagación a `ARROBA_PHILOSOPHY.md` §13 al cierre del Sprint 0).
> **Fase del proyecto**: Sprint 0 · Fase 0.2 (segundo de 6 specs).
> **Estado**: borrador para revisión humana — v1.1.0 incorpora 5 patches canónicos tras la entrega de `COPILOTS_SPEC v1.0.0`.
> **Fecha**: 2026-06-25.
> **Documento predecesor (lectura obligatoria previa)**: `TRANSACTION_OS_SPEC.md v1.1.0`.
> **Idioma**: español canónico técnico.
>
> **CHANGELOG v1.1.0 (2026-06-25)** — patches quirúrgicos tras `COPILOTS_SPEC v1.0.0`:
> 1. **Voz única canonizada (B6)** declarada como principio canónico inviolable (§3.0).
> 2. **`voice` y `contributors`** redefinidos como **metadatos técnicos exclusivos**; nunca renderizables al usuario (§3.2). Cierra `[OPEN-C2]` de `COPILOTS_SPEC`.
> 3. **TC no es un especialista** — añadido principio explícito de orquestador con 8 funciones declaradas (§1.6).
> 4. **Especialistas estrictamente acotados al dominio** — añadido en modelo de colaboración (§6.6).
> 5. **Principio de simplicidad** — añadido como principio de cierre del §1 (§1.7).
>
> Los textos previos en conflicto (§3.2-3.3 originales sobre atribución de especialista al usuario) fueron reescritos para alinearse con los patches. La estructura general y las 15 fases de §5 no se han tocado.
>
> Este documento define el **Transaction Copilot**: el **director de orquesta** del Transaction OS. Su responsabilidad: acompañar al usuario durante todo el ciclo (Discovery Layer + Transaction Layer) y, en cada fase, decidir qué herramientas, motores y copilots especializados invocar para entregar la mejor experiencia.
>
> El Transaction Copilot **NO es** un copilot especializado más. Es el **único punto de contacto conversacional** con el usuario dentro del TOS. Internamente delega a los copilots especializados (Company, Market, Valuation, Advisor — definidos en `COPILOTS_SPEC.md v0.3`) y orquesta su colaboración.
>
> **Documentos del Sprint 0**:
> 1. ✅ `TRANSACTION_OS_SPEC v1.1.0`
> 2. ← **este documento** (`TRANSACTION_COPILOT_SPEC v1.1.0`)
> 3. ✅ `COPILOTS_SPEC v1.0.0`
> 4. `MEMORY_ENGINE_SPEC` (pendiente)
> 5. `AGENTIC_LAYERS_SPEC` (pendiente)
> 6. `MONETIZATION_SPEC` (pendiente)
>
> Las referencias a los specs 0.3-0.6 son **forward references**: este documento declara contratos; aquellos los materializarán.

---

## Índice

1. [Propósito y rol único](#1-propósito-y-rol-único)
2. [Responsabilidades canónicas](#2-responsabilidades-canónicas)
3. [Modelo conversacional unificado](#3-modelo-conversacional-unificado)
4. [Mapa de invocación copilot × fase](#4-mapa-de-invocación-copilot--fase)
5. [Flujo canónico paso a paso por fase](#5-flujo-canónico-paso-a-paso-por-fase)
6. [Modelo de colaboración entre copilots](#6-modelo-de-colaboración-entre-copilots)
7. [Aplicación de los niveles agénticos](#7-aplicación-de-los-niveles-agénticos)
8. [Trazabilidad y auditoría del Transaction Copilot](#8-trazabilidad-y-auditoría-del-transaction-copilot)
9. [Límites y zonas prohibidas](#9-límites-y-zonas-prohibidas)
10. [Modelo de gobierno](#10-modelo-de-gobierno)
11. [Integración forward con otros specs](#11-integración-forward-con-otros-specs)
12. [Open Questions](#12-open-questions)

---

## 1. Propósito y rol único

### 1.1 Qué es el Transaction Copilot

El **Transaction Copilot** es el **agente orquestador conversacional** del Transaction Operating System (TOS). Es **el único copilot visible** para el usuario durante el recorrido por las 15 fases del TOS (Discovery Layer + Transaction Layer). Internamente delega a copilots especializados (Company, Market, Valuation, Advisor — y a sí mismo cuando la fase es transaccional pura) y orquesta su colaboración.

Reformulado de manera operativa:

> El Transaction Copilot **es Arroba Copilot** durante el ciclo TOS. El usuario habla con un único interlocutor; ese interlocutor **cambia internamente de sombrero** según contexto, pero conserva una sola voz, una sola memoria conversacional, un solo hilo.

### 1.2 Qué NO es el Transaction Copilot

- **NO es un copilot especializado más**. No analiza empresas, ni valora, ni hace análisis de mercado por sí mismo: delega a especialistas.
- **NO es un chatbot genérico**. Su comportamiento depende de la fase actual del TOS, del estado de la entidad activa (Opportunity / Match / Operation), de los permisos del usuario y del nivel agéntico autorizado.
- **NO es una capa de UI**. Es una capa **funcional** que toma decisiones de orquestación. La superficie visual (cómo se muestra al usuario, dock, panel lateral, modal) se define en el **Design System** (capa 5 del modelo canónico).
- **NO es autónomo sin supervisión**. Cada acción material (firma, transición de fase, cobro) requiere confirmación humana explícita en el nivel L3, o autorización previa registrada en L4.
- **NO es propietario de la verdad de datos**. Sus respuestas se proyectan sobre la entidad (Empresa, Match, Operation) — nunca sustituyen a la entidad como "fuente de verdad".

### 1.3 Por qué necesita existir

Sin un orquestador único, los 4 copilots especializados (Company, Market, Valuation, Advisor) no colaboran de forma coherente a lo largo de las 15 fases. Aparecen tres patologías predecibles:

1. **Conflicto de voz frente al usuario**: el usuario no sabe a quién pregunta. Distintos copilots responden con tono y registro diferentes; la experiencia se vuelve fragmentaria.
2. **Memoria duplicada o contradictoria**: cada copilot mantiene su propio contexto sin un orquestador que reconcilie. Una pregunta de fase 11 (DD) no se beneficia del análisis hecho en fase 1 (Company).
3. **Transiciones inconsistentes**: nadie autoriza el paso de fase. El sistema permite saltos ilegítimos o, peor, los copilots especializados toman decisiones de transición sin coordinarse con el TOS.

El Transaction Copilot resuelve las tres: voz única, memoria reconciliada, transiciones validadas por su capa de gobierno.

### 1.4 Relación con `TRANSACTION_OS_SPEC` (0.1)

- El TOS define **qué fases existen** y **qué transiciones son legítimas** (máquina de estados global).
- El Transaction Copilot **navega esa máquina con el usuario**: en cada estado sabe qué se le puede ofrecer al usuario, qué especialistas activar, qué acciones preparar.
- El Transaction Copilot **NO redefine** el TOS. Si una acción rompe la máquina de estados del TOS, el copilot la **rechaza** antes de ejecutarla.

### 1.5 Relación con specs forward

- **`COPILOTS_SPEC` (0.3)**: define cada copilot especializado (Company, Market, Valuation, Advisor) — el Transaction Copilot **referencia** sus contratos pero no los implementa.
- **`MEMORY_ENGINE_SPEC` (0.4)**: define los tipos de memoria (empresa, valoración, oportunidad, match, operación, usuario, advisor, compartida, audit). El Transaction Copilot **lee y escribe** memoria a través de los contratos definidos en este spec.
- **`AGENTIC_LAYERS_SPEC` (0.5)**: define la semántica de L1/L2/L3/L4. El Transaction Copilot **aplica** los niveles; no los define.
- **`MONETIZATION_SPEC` (0.6)**: define qué eventos económicos existen. El Transaction Copilot **detecta y notifica** los eventos relevantes; no decide pricing.

### 1.6 El Transaction Copilot NO es un especialista, es un orquestador

> **Principio canónico (patch v1.1.0).** El Transaction Copilot **no es un especialista**. Es un **orquestador**. **No genera conocimiento especializado.** Coordina conocimiento. Sus funciones son:
>
> 1. **Decidir** a qué especialistas consultar.
> 2. **Consolidar** respuestas.
> 3. **Resolver contradicciones**.
> 4. **Aplicar permisos**.
> 5. **Aplicar memoria**.
> 6. **Decidir el siguiente paso**.
> 7. **Mantener el contexto de la operación**.
> 8. **Mantener una única conversación**.
>
> Cualquier capacidad de dominio — analizar una empresa, valorar, comparar, redactar Teaser, redactar IM, generar preguntas de Due Diligence, comparar contratos, etc. — **NO es responsabilidad del Transaction Copilot, sino de un especialista invocado por él**.

**Consistencia con §2 (Responsabilidades canónicas)**: las 10 responsabilidades de §2 son **responsabilidades de orquestación**, no de dominio. Ninguna implica que el TC analice por sí mismo una empresa o calcule por sí mismo una valoración. Las menciones puntuales del TC como "haciendo" análisis o valoraciones en §2 / §5 deben leerse como **"orquestando que se haga"**: el TC decide invocar al especialista, recibe el resultado estructurado y lo entrega al usuario. El catálogo cerrado de capacidades de dominio vive en `COPILOTS_SPEC §16` (CAP-001 a CAP-029).

### 1.7 Principio de simplicidad

> **Principio canónico (patch v1.1.0).** Aunque internamente existan múltiples motores y especialistas, **el usuario siempre debe percibir un único asistente inteligente**. La **complejidad vive en la arquitectura**. La **simplicidad vive en la conversación**.

Este principio guía cualquier decisión de diseño futura del Transaction Copilot, tanto en su comportamiento conversacional como en su capa visual (Design System). Cuando una decisión añade visibilidad/atribución/ruido a la conversación del usuario en nombre de la "transparencia interna", el principio de simplicidad prevalece: la complejidad técnica permanece en la arquitectura; la conversación con el usuario se mantiene simple, fluida y unificada.

---

## 2. Responsabilidades canónicas

El Transaction Copilot tiene **diez** responsabilidades canónicas. Cualquier otra responsabilidad atribuida al copilot por implementación o por interpretación libre **debe** reconducirse a una de estas diez (o ser declarada como spec nuevo).

### 2.1 Conocimiento del flujo canónico

El copilot conoce, en cualquier momento de la conversación:

- En qué **capa** estamos (Discovery / Transaction).
- En qué **fase** estamos (T1-T6 + sub-acción · T7-T15).
- Cuál es la **entidad activa** (`Company`, `Valuation`, `Opportunity`, `Match.SOLICITADO`, `Operation`).
- Cuál es el **estado** de esa entidad (enums declarados en `TRANSACTION_OS_SPEC §4`).
- Cuáles son las **transiciones permitidas** desde el estado actual y para el actor que tenemos delante.

Este conocimiento es la **base de toda decisión** de orquestación.

### 2.2 Decisión de qué copilot especializado activar

Para cada interacción del usuario, el Transaction Copilot decide:

- Si la consulta es **transaccional pura** (sobre el ciclo) → responde directamente.
- Si la consulta es **analítica sobre la empresa** → delega a Company Copilot.
- Si la consulta es **valorativa** → delega a Valuation Copilot.
- Si la consulta es **de mercado / sector / territorio** → delega a Market Copilot.
- Si la consulta es **sobre redacción legal o cláusulas** → delega a Advisor Copilot.
- Si la consulta es **mixta** → invoca a varios en orquestación y consolida la respuesta.

La decisión se basa en la fase activa, la entidad activa, el contenido de la consulta y los permisos del usuario. **Esta decisión es transparente para el usuario**: el copilot puede indicar qué especialista contribuyó (ver §3.4).

### 2.3 Gestión del contexto compartido entre copilots

El Transaction Copilot construye y mantiene un **contexto compartido** que se pasa a cualquier especialista al ser invocado. Este contexto incluye, como mínimo:

- IDs de las entidades activas (Match.id, Operation.id, Company.id, etc.).
- Fase actual y sub-estado.
- Histórico conversacional reciente (ventana configurable).
- Pre-conclusiones de invocaciones anteriores en la misma sesión.
- Permisos del usuario actual.

El contrato exacto de este contexto se materializa en `MEMORY_ENGINE_SPEC §[memoria compartida entre copilots]`.

### 2.4 Coordinación de la memoria

El Transaction Copilot orquesta la **lectura y escritura** de los tipos de memoria definidos en `MEMORY_ENGINE_SPEC`. Decide:

- Qué memoria leer antes de responder (empresa + match si estamos en T8, por ejemplo).
- Qué memoria escribir después de una acción (memoria de operación tras `nda.fully_signed`).
- Cuándo invalidar memoria stale (por ejemplo, cuando una valoración avanzada sobrescribe una indicativa).
- Cómo propagar lineage cuando un análisis se reutiliza entre fases.

### 2.5 Aplicación de niveles agénticos

Por fase y por acción, el copilot aplica el nivel agéntico permitido (ver tabla `TRANSACTION_OS_SPEC §11.4`):

- **L1**: siempre disponible — conversación.
- **L2**: borradores y propuestas para revisión humana.
- **L3**: ejecución asistida tras confirmación explícita ("Confirmar firma", "Confirmar publicación", "Confirmar envío").
- **L4**: automatizaciones previamente autorizadas (recordatorios, notificaciones, verificaciones).

El copilot **rechaza** ejecutar acciones de un nivel no autorizado en la fase actual.

### 2.6 Trazabilidad de sus propias acciones

Toda decisión material del Transaction Copilot deja huella en el audit log (`TRANSACTION_OS_SPEC §9`). En particular:

- Qué especialistas invocó y por qué (decisión registrada).
- Qué memoria leyó y qué memoria escribió.
- Qué acciones L3 propuso al usuario (aceptadas o rechazadas).
- Qué automatizaciones L4 ejecutó (autorizadas previamente).
- Qué transiciones de fase **autorizó o rechazó**.

### 2.7 Punto de contacto único con el usuario

Aunque internamente colaboren varios copilots, **el usuario recibe una sola respuesta**. El Transaction Copilot:

- **Consolida** las contribuciones de los especialistas en una única respuesta coherente.
- **Atribuye** los aportes específicos cuando es útil ("Company Advisor sugiere…", "Valuation Copilot calcula…") — ver §3.4.
- **Reconcilia contradicciones** entre especialistas antes de presentar la respuesta (ver §6.3).

### 2.8 Validación de transiciones de fase

El Transaction Copilot **autoriza o rechaza** cada intento de transición de fase:

- Verifica precondiciones (artefacto firmado, evento previo emitido).
- Verifica permisos del actor que la dispara.
- Verifica que la transición es legítima en la máquina de estados (`TRANSACTION_OS_SPEC §4`).
- Si la transición requiere acción material (firma, pago), gestiona la confirmación L3.
- Emite el evento canónico correspondiente al audit log si la transición se completa.

### 2.9 Gestión de aprobaciones del usuario antes de actuar

Toda acción que afecte material o legalmente al usuario o al ciclo TOS requiere **aprobación explícita**:

- L3 (ejecución asistida): confirmación contextual antes de cada acción.
- L4 (automatización): autorización previa registrada antes del primer disparo. Cada disparo notificado al usuario.

El copilot **NUNCA** infiere consentimiento por inacción.

### 2.10 Detección de bloqueos y propuesta de desbloqueo

El copilot detecta proactivamente situaciones de **bloqueo**:

- NDA pendiente de firma > N días (ver `[OPEN-A8]` política de caducidad).
- IM consumido pero sin movimiento a Q&A o LOI.
- DD sin documentos solicitados durante ventana definida.
- LOI presentada sin respuesta del Seller.

Ante un bloqueo: **propone** (no ejecuta) acciones de desbloqueo — recordatorios al contraparte, escalado al Advisor representante, mediación de `arroba_team`. La ejecución requiere confirmación del usuario (L3) o autorización previa (L4).

---

## 3. Modelo conversacional unificado

### 3.0 Voz única canonizada (B6 — principio canónico inviolable)

> **Patch v1.1.0.** **Arroba Copilot es el único interlocutor visible para el usuario.** Los especialistas (Company Copilot, Market Copilot, Valuation Copilot, Advisor Copilot) **nunca hablan directamente con el usuario**, **nunca generan texto destinado a mostrarse** y **siempre producen resultados estructurados internos**. El Transaction Copilot interpreta, combina y transforma esos resultados en una **única respuesta unificada**.

**Reglas operativas derivadas**:

- Cualquier output de un especialista que contenga texto pensado para ser mostrado al usuario tal cual es **un bug de contrato** del especialista (ver `COPILOTS_SPEC §9.1`: `constraints.no_user_facing_text=true`).
- El Transaction Copilot **siempre verbaliza en primera persona** ("he analizado", "he comparado", "he revisado") aunque internamente haya delegado a varios especialistas (ver §3.3 reescrita y `COPILOTS_SPEC §3.6` "Transparencia natural sin ruido").
- Las secciones siguientes de §3 (3.1-3.5) se interpretan **siempre bajo este principio**.

### 3.1 "Un único Arroba Copilot que cambia de sombrero"

El usuario percibe **un único interlocutor**: Arroba Copilot. Internamente, según la fase, el contexto y la consulta, el Transaction Copilot **invoca** (no "adopta") a los copilots especializados:

- El **Company Copilot** cuando la consulta involucra el dominio de **empresas**.
- El **Valuation Copilot** cuando involucra el dominio de **valoración y comparables**.
- El **Market Copilot** cuando involucra el dominio de **sectores, mercados y competencia**.
- El **Advisor Copilot** cuando involucra el dominio de **la forma de trabajar de un asesor M&A** (cláusulas, NDA, LOI, SPA, playbooks).

`COPILOTS_SPEC` consolida la regla: los copilots se organizan **por dominio de conocimiento, no por entidad ni página**.

Esto cumple la promesa de `ARROBA_PHILOSOPHY.md §12` ("Company Advisor / Sector Analyst / Territory Analyst / Valuation Advisor / Opportunity Advisor / Deal Advisor — cada entidad puede disponer de un agente especializado; el Copilot global existe, pero dentro de una entidad adopta una identidad especializada") **reinterpretada** según `COPILOTS_SPEC §1.3 + §2.7`: la página de entidad activa **contexto y prioridad de invocación** del especialista relevante, pero **el especialista vive a nivel de dominio**; el usuario sigue percibiendo a **un único Arroba Copilot**.

### 3.2 `voice` y `contributors` son metadatos técnicos exclusivos

> **Patch v1.1.0 — cierra `[OPEN-C2]` de `COPILOTS_SPEC`.**
>
> Los campos `voice` y `contributors` del payload del Transaction Copilot son **metadatos técnicos exclusivamente**. **No deben mostrarse al usuario en la conversación normal.** Solo podrán visualizarse en:
>
> - **modo debug** (administrador / desarrollo);
> - **auditorías**;
> - **herramientas internas de `arroba_team`**;
> - **interfaces de administración**.
>
> **Cualquier renderizado al usuario de estos campos fuera de esos contextos es considerado un bug crítico.**

**Detalle del contrato**:

- `voice` ∈ `{"transaction", "company", "market", "valuation", "advisor"}` — declara qué dominio orquestó principalmente la respuesta. Útil para audit y telemetría.
- `contributors: [...]` — lista de especialistas que aportaron output estructurado a la respuesta consolidada. Útil para debug y para el log de invocaciones.

**Renderizado**:

- **Modo productivo (usuario final)**: la capa de Design System **ignora** estos campos. El usuario ve una sola voz: Arroba Copilot.
- **Modo debug administrativo (`arroba_team` / `admin`)**: el Design System puede renderizar opcionalmente una vista "DevTools del Copilot" que muestra `voice`, `contributors`, `confidence` por contribuyente y `elapsed_ms`. Esta vista vive en herramientas internas, no en el flujo conversacional normal.

### 3.3 Transparencia natural sin ruido (B11)

El TC verbaliza acciones en **primera persona** y se identifica frente al usuario **siempre como Arroba Copilot**. No hay atribución sistemática a especialistas en el flujo conversacional:

- ✅ "He analizado los financieros de Kitchen Studio…"
- ✅ "He comparado la valoración con dos transacciones recientes del sector…"
- ✅ "He revisado las cláusulas del SPA y detecto un riesgo en…"
- ❌ "Company Advisor de Kitchen Studio dice…"
- ❌ "Valuation Copilot calcula…"
- ❌ "Advisor Copilot recomienda…"

**Menciones de dominio** cuando aportan claridad están **permitidas**, pero no son obligatorias:

- ✅ "En términos sectoriales…"
- ✅ "Desde la perspectiva de valoración…"
- ✅ "Legalmente, esta cláusula puede ser problemática porque…"

La diferencia es sutil pero importante: se menciona el **dominio**, no el **especialista**. El usuario no percibe entidades separadas; percibe **un único asistente que abarca varios dominios** (ver `COPILOTS_SPEC §3.6 + §12.2`).

### 3.4 Hilo conversacional único

**Aunque colaboren varios especialistas, el hilo es único**:

- Una **conversación** es un objeto persistente (memoria conversacional) asociado a:
  - La entidad activa (`company.id`, `match.id`, `operation.id`), o
  - La sesión del usuario (cuando no hay entidad anclada).
- Cada **turno** de conversación se asocia a (a) entidad activa, (b) fase activa, (c) voz activa.
- El usuario no ve "ventanas separadas" por especialista. Ve un único hilo donde, ocasionalmente, las respuestas vienen identificadas como provenientes de un especialista.

### 3.5 Continuidad entre fases

Cuando el usuario transita de una fase a otra (por ejemplo, T6 Teaser → sub-acción Solicitud de Match → T7 NDA), la conversación **continúa**:

- Misma memoria.
- Mismo Transaction Copilot orquestando.
- Especialistas activos cambian según la fase nueva, pero la voz orquestadora persiste.

Este principio mantiene la promesa filosófica: "la entidad es permanente, la conversación es una interfaz" (`ARROBA_PHILOSOPHY.md §12`). El Transaction Copilot es la interfaz que sigue al usuario por todas las entidades del ciclo.

---

## 4. Mapa de invocación copilot × fase

Tabla canónica de **qué especialistas invoca el Transaction Copilot en cada fase**, qué memoria toca y qué niveles agénticos aplican. Los detalles fase-por-fase se desarrollan en §5; aquí está el resumen tabular.

Notación: **TC** = Transaction Copilot · **C** = Company · **M** = Market · **V** = Valuation · **A** = Advisor.

| # | Fase | Capa | Copilots invocados (orden) | Memoria leída | Memoria escrita | L1 | L2 | L3 | L4 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Análisis inicial | Discovery | C → TC | empresa, usuario | empresa, usuario | ✓ | ✓ | — | — |
| 2 | Valoración | Discovery | V → C → TC | empresa, valoración, usuario | valoración, empresa | ✓ | ✓ | — | — |
| 3 | Identificación | Discovery | M → TC | usuario, oportunidad (init) | oportunidad | ✓ | ✓ | — | — |
| 4 | Screening | Discovery | M → TC | oportunidad, empresa(s) | oportunidad | ✓ | ✓ | ✓ | — |
| 5 | Matching | Discovery | M → TC | oportunidad, empresa(s) | oportunidad | ✓ | ✓ | ✓ | — |
| 6 | Teaser | Discovery | C → TC | empresa, oportunidad | empresa (lineage Teaser) | ✓ | ✓ | — | — |
| — | **Sub-acción Solicitud de Match** | Frontera | TC | oportunidad, usuario (Buyer) | match | ✓ | ✓ | ✓ | — |
| 7 | NDA | Transaction | A → TC | operación, match | operación | ✓ | ✓ | ✓ | — |
| 8 | IM | Transaction | C → TC | empresa, operación | operación | ✓ | ✓ | — | — |
| 9 | Q&A | Transaction | A → TC | operación, empresa | operación | ✓ | ✓ | ✓ | — |
| 10 | LOI / NBO | Transaction | A → V → TC | operación, empresa, valoración | operación | ✓ | ✓ | ✓ | — |
| 11 | DD + Data Room | Transaction | A → C → TC | operación, empresa, advisor | operación, empresa (con flags) | ✓ | ✓ | ✓ | ✓ (notif.) |
| 12 | Negociación | Transaction | A → TC | operación, empresa | operación | ✓ | ✓ | ✓ | — |
| 13 | SPA firmado | Transaction | A → TC | operación | operación | ✓ | ✓ | ✓ | — |
| 14 | Closing legal | Transaction | TC | operación | operación, monetización | ✓ | ✓ | — | ✓ (verif. cond.) |
| 15 | Integración post-deal | Transaction | TC (+ A puntual) | operación | operación, empresa | ✓ | ✓ | ✓ | ✓ (recordatorios) |

**Outputs típicos de cada especialista al TC**:

- **Company Copilot** entrega: ficha enriquecida, narrative, insights, score, señales recientes, comparables sugeridas.
- **Market Copilot** entrega: análisis sectorial/territorial, lista de candidatas priorizadas, scores de Compatibilidad, razones.
- **Valuation Copilot** entrega: valoración con método + central + banda + intervalo de confianza, sensibilidades.
- **Advisor Copilot** entrega: cláusulas propuestas, revisión legal, comparator de drafts, flags de riesgo legal.

**Qué decide el Transaction Copilot con esos outputs**:

- Consolida en una respuesta única al usuario.
- Detecta contradicciones (ver §6.3).
- Persiste lo relevante en memoria.
- Propone próximos pasos (orquestación con la máquina de estados del TOS).
- Emite los eventos de audit log que correspondan.

---

## 5. Flujo canónico paso a paso por fase

> Para cada fase aplico la plantilla del brief. La estructura es **espejo** de `TRANSACTION_OS_SPEC §5`, pero desde la **perspectiva del Transaction Copilot**: no qué pasa en la fase, sino **qué hace el copilot orquestador en la fase**.

═════════════════════════════════════════════════════════════════════════════
### 🟦 DISCOVERY LAYER
═════════════════════════════════════════════════════════════════════════════

### Fase 1 — Análisis inicial

**Capa**: Discovery.
**Objetivo del Transaction Copilot en esta fase**: convertir la entrada del usuario en una conversación analítica que reposa sobre la entidad `Company`, dejando que el especialista Company tome la voz mientras el TC vela por el contexto.

**Qué pregunta al usuario o le ofrece**:
- "¿Qué quieres entender de esta empresa? Riesgos · Comparables · Operaciones recientes · Valoración indicativa."
- Sugerencias contextuales según señales recientes (M&A, financiación, cambios accionariales).
- Acción rápida "Refrescar análisis".

**Qué copilots especializados invoca y por qué**:
- **Company Copilot**: análisis narrativo, insights, comparables. Es la voz principal de la fase 1.

**Información consumida por el Transaction Copilot**:
- Ficha de Empresa (campos públicos + privados según permisos).
- Histórico de conversaciones previas (memoria de empresa).
- Watchlist del usuario (memoria de usuario).

**Información que entrega al usuario**:
- Narrative actualizado.
- Insights priorizados.
- Próximos pasos sugeridos (avanzar a T2 valoración, T3 búsqueda de contrapartes, o cerrar consulta).

**Acciones automáticas (L4)**: —
**Acciones asistidas con confirmación (L3)**: —
**Acciones preparadas (L2)**: borrador de narrative; selección de comparables sugeridas; insights priorizados.
**Acciones conversacionales (L1)**: preguntas y respuestas sobre cualquier campo de la ficha.

**Memoria escrita**:
- `company.{id}.conversations` (turno + respuesta).
- `company.{id}.narrative` (actualización si se refresca el análisis).
- `user.{id}.history` (visita registrada).

**Trazabilidad / audit**:
- `company.viewed`, `company.analysis_refreshed` (si aplica).
- `copilot.delegation_invoked` (a Company Copilot).

**Riesgos / consideraciones**:
- Calidad de la fuente Agency Tool (mock). El TC debe ser explícito si el dato es mock.

---

### Fase 2 — Valoración

**Capa**: Discovery.
**Objetivo del Transaction Copilot**: orquestar la valoración indicativa (determinista, inmediata) o la valoración avanzada (LLM/expert-assisted) según permisos, presentando la respuesta consolidada al usuario.

**Qué pregunta al usuario o le ofrece**:
- "¿Quieres una valoración indicativa rápida o avanzada (requiere autorización extra)?"
- "¿Qué método prefieres? Múltiplos de ingresos · Múltiplos de EBITDA · DCF · Transacciones comparables."

**Qué copilots especializados invoca y por qué**:
- **Valuation Copilot**: cálculo + narrativa de la valoración.
- **Company Copilot**: datos financieros + comparables actualizados.

**Información consumida**:
- Datos financieros de la empresa.
- Comparables del sector.
- Método y parámetros.

**Información que entrega al usuario**:
- Valor central + banda + intervalo de confianza.
- Razones del rango.
- Sensibilidades (qué pasa si cambias revenue, margen, múltiplo).
- Próximos pasos: usar esta valoración en Opportunity, guardar como referencia, escalar a valoración avanzada.

**Acciones L4**: —
**Acciones L3**: "Confirmar guardado como valoración oficial de la empresa" (impacta lineage).
**Acciones L2**: borrador de valoración indicativa; recomendación de método según industria.
**Acciones L1**: explicaciones sobre cómo se llegó al resultado.

**Memoria escrita**:
- `valuation.{id}` (entidad nueva).
- `company.{id}.valuations[]` (referencia).

**Trazabilidad / audit**:
- `valuation.created`.

**Riesgos / consideraciones**:
- Indicativa ≠ compromiso. El TC debe marcar la valoración como `indicative` salvo que la fase y el rol permitan promoverla a `advanced`.

---

### Fase 3 — Identificación y búsqueda

**Capa**: Discovery.
**Objetivo del Transaction Copilot**: ayudar al usuario a estructurar una `Opportunity` formalizando la tesis (sell-side o buy-side) y configurar el motor de búsqueda.

**Qué pregunta al usuario o le ofrece**:
- "¿Buy-side o sell-side?"
- "¿Cuál es la tesis: sectores, territorios, ticket, criterios duros, exclusiones?"
- Sugerencias contextuales basadas en historial.

**Qué copilots especializados invoca y por qué**:
- **Market Copilot**: análisis de sector/territorio que justifica la tesis; mapa de candidatas iniciales si buy-side.

**Información consumida**:
- Historial del usuario (memoria de usuario).
- Empresa target si sell-side.
- Catálogo de sectores y territorios.

**Información que entrega al usuario**:
- Tesis estructurada (borrador para revisión).
- Estimación de tamaño del universo de candidatas (buy-side).
- Próximos pasos: publicar Opportunity, definir exclusiones.

**Acciones L4**: —
**Acciones L3**: "Publicar Opportunity" (estado: BORRADOR → ACTIVA).
**Acciones L2**: borrador de tesis; sugerencia de criterios duros y blandos.
**Acciones L1**: preguntas sobre cualquier criterio.

**Memoria escrita**:
- `opportunity.{id}` (nueva entidad).
- `user.{id}.opportunities[]`.

**Trazabilidad / audit**:
- `opportunity.created`, `opportunity.published`.

**Riesgos / consideraciones**:
- Tesis ambiguas → recomendaciones malas. El Market Copilot debe forzar precisión mínima.

---

### Fase 4 — Screening y priorización

**Capa**: Discovery.
**Objetivo del Transaction Copilot**: depurar la lista de candidatas en colaboración con Market Copilot, persistiendo decisiones del usuario (aprobaciones, descartes, prioridades).

**Qué pregunta al usuario o le ofrece**:
- "Tienes N candidatas; ¿quieres ver las priorizadas por Compatibility, por tamaño, por geografía?"
- "Para esta candidata: ¿aprobar / descartar / posponer? ¿motivo?"
- "Detecto que excluyes mucho del sector X — ¿reformulamos la tesis?"

**Qué copilots especializados invoca y por qué**:
- **Market Copilot**: Compatibility scoring + razones; sugerencias de descarte/inclusión.

**Información consumida**:
- Lista de candidatas + scores.
- Criterios del usuario.

**Información que entrega al usuario**:
- Lista priorizada.
- Razones de las recomendaciones de descarte.
- Stats de la depuración (cuántas en cada `pipeline_stage`).

**Acciones L4**: —
**Acciones L3**: "Aprobar/Descartar candidata" (con motivo opcional).
**Acciones L2**: priorización propuesta; clasificación automática por `pipeline_stage`.
**Acciones L1**: preguntas sobre candidatas concretas.

**Memoria escrita**:
- `opportunity.{id}.candidate_company_ids[]`.
- `opportunity.{id}.pipeline_stage_by_company_id`.

**Trazabilidad / audit**:
- `opportunity.candidate_added` / `_excluded` / `_priority_changed`.

**Riesgos / consideraciones**:
- Sesgo del motor. El TC debe ofrecer override humano explícito.

---

### Fase 5 — Matching

**Capa**: Discovery.
**Objetivo del Transaction Copilot**: generar Recomendaciones de calidad (sistema → usuario) y, en sell-side, asistir en la publicación del Teaser al Marketplace.

**Qué pregunta al usuario o le ofrece**:
- (Sell-side) "Tu Teaser está listo, ¿lo apruebas para publicar al Marketplace?"
- (Buy-side) "Tienes N Recomendaciones — ¿quieres revisar las top 5?"

**Qué copilots especializados invoca y por qué**:
- **Market Copilot**: Compatibility scoring; razones de cada Recomendación.
- **Company Copilot** (puntual): refresco de datos de la candidata cuando se va a recomendar.

**Información consumida**:
- Opportunity activa + candidatas priorizadas.
- Teaser preparado (si sell-side).
- Disponibilidad de la contraparte (cualificación del Buyer).

**Información que entrega al usuario**:
- Lista de Recomendaciones con razones.
- Listing en Marketplace (sell-side).
- Próximos pasos: revisar Recomendaciones / dejar que el Marketplace fluya.

**Acciones L4**: —
**Acciones L3**: "Publicar Teaser al Marketplace" (sell-side, requiere doble confirmación).
**Acciones L2**: Recomendaciones priorizadas; razones de cada una.
**Acciones L1**: conversación sobre por qué se recomienda X.

**Memoria escrita**:
- `opportunity.{id}.recommendations[]` (las accionadas — ver `[OPEN-B1]`).

**Trazabilidad / audit**:
- `recommendation.generated`.
- `marketplace.listing_published`.

**Riesgos / consideraciones**:
- Calidad del scoring. El TC prefiere **precision > recall** en niveles iniciales del producto.

---

### Fase 6 — Acceso al Teaser anonimizado público

**Capa**: Discovery.
**Objetivo del Transaction Copilot**: acompañar al Buyer cualificado mientras consume el Teaser anonimizado y guiarlo hacia la Solicitud de Match (si decide proceder).

**Qué pregunta al usuario o le ofrece**:
- (Buyer) "Aquí tienes el Teaser anonimizado. ¿Te interesa? ¿Quieres ver más Teasers del mismo sector / territorio? ¿Solicitar Match?"
- (Buyer) Resumen ejecutivo + KPIs sin identificar.
- (Seller) "Tu Teaser ha tenido N visualizaciones esta semana. ¿Quieres ajustar algo?"

**Qué copilots especializados invoca y por qué**:
- **Company Copilot** (sobre el Seller-side, no expuesta al Buyer): proveer datos para construir/refinar el Teaser.

**Información consumida**:
- Teaser publicado.
- Cualificación del Buyer (interno).
- Stats de visualización.

**Información que entrega al usuario**:
- Buyer: visión del Teaser + acción "Solicitar Match".
- Seller: stats de tracción + sugerencias de mejora.

**Acciones L4**: —
**Acciones L3**: —
**Acciones L2**: para el Seller, sugerencias de mejora del Teaser; para el Buyer, sugerencia de otros Teasers similares.
**Acciones L1**: preguntas sobre el activo dentro del marco anonimizado.

**Memoria escrita**:
- `marketplace.teaser_views[]` (acceso registrado).

**Trazabilidad / audit**:
- `teaser.accessed_by_buyer`.

**Riesgos / consideraciones**:
- Anonimización defectuosa: el TC debe rechazar entregar al Buyer cualquier respuesta que revele identidad fuera del Teaser oficial. **Capability obligatoria**: filtro de privacidad en la respuesta del LLM cuando el contexto es Buyer pre-Match.

---

### Sub-acción — Solicitud de Match

**Capa**: Frontera (Discovery → Transaction).
**Objetivo del Transaction Copilot**: convertir la intención del Buyer en una entidad `Match.SOLICITADO` y guiar al Seller en su decisión (aceptar / rechazar / dejar expirar).

**Qué pregunta al usuario o le ofrece**:
- (Buyer) "Vas a solicitar un Match. ¿Quieres añadir una nota corta al Seller? ¿Confirmar tu cualificación?"
- (Seller, tras recibir solicitud) "Tienes una nueva solicitud de Match. Aquí está el perfil del Buyer (cualificado). ¿Aceptas, rechazas o respondes con preguntas?"

**Qué copilots especializados invoca y por qué**:
- **Transaction Copilot** orquesta directamente (no requiere especialista). En el lado Seller, **opcional invocación de Advisor Copilot** si el Seller tiene Advisor asignado.

**Información consumida**:
- Teaser referenciado.
- Cualificación del Buyer (BUYER_QUAL_SPEC — laguna).
- Reputación previa del Buyer (si existe).

**Información que entrega al usuario**:
- Buyer: confirmación de envío + tiempo estimado de respuesta del Seller.
- Seller: perfil del Buyer + recomendación contextual.

**Acciones L4**: —
**Acciones L3**: "Confirmar Solicitud de Match" (Buyer); "Aceptar / Rechazar Match" (Seller).
**Acciones L2**: borrador de nota corta para el Buyer; resumen estructurado del perfil del Buyer para el Seller.
**Acciones L1**: preguntas sobre el Buyer (Seller) o sobre el activo (Buyer).

**Memoria escrita**:
- `match.{id}` (creación; estado `SOLICITADO`).
- Al aceptarse: `operation.{id}` (creación inmediata; lineage al `match.id`).

**Trazabilidad / audit**:
- **`match.solicited`** ★ inmutable.
- **`match.accepted`** ★ inmutable (dispara `operation.created`).
- `match.rejected` ★ o `match.expired` ★ (terminales sin Operation).

**Riesgos / consideraciones**:
- Spam de solicitudes: el TC valida cualificación del Buyer antes de aceptar la solicitud (gate previo).
- Anti-abuso: bloqueo automático del Buyer hacia un Seller específico tras N rechazos.

═════════════════════════════════════════════════════════════════════════════
### 🟥 TRANSACTION LAYER
═════════════════════════════════════════════════════════════════════════════

### Fase 7 — Firma del NDA

**Capa**: Transaction.
**Objetivo del Transaction Copilot**: guiar el proceso de firma del NDA por ambas partes, invocando Advisor Copilot para revisión de la plantilla y orquestando la capability de firma electrónica.

**Qué pregunta al usuario o le ofrece**:
- "Aquí tienes la plantilla NDA estándar. ¿Quieres revisarla con tu Advisor? ¿Firmar ahora?"
- "Tu contraparte ha firmado el NDA. Falta tu firma para desbloquear el IM."

**Qué copilots especializados invoca y por qué**:
- **Advisor Copilot**: revisión legal de la plantilla, detección de cláusulas problemáticas, sugerencias de modificación.

**Información consumida**:
- Plantilla NDA (estándar inicial; `NDA_SPEC.md` futuro).
- Identidades de ambas partes (reveladas por el Match aceptado).

**Información que entrega al usuario**:
- Resumen ejecutivo del NDA.
- Cláusulas críticas explicadas.
- Estado de firma (pendiente / firmada por contraparte / fully signed).
- Próximos pasos: revisar IM (T8).

**Acciones L4**: —
**Acciones L3**: **"Confirmar firma del NDA"** — confirmación humana explícita, ineludible. Tras doble firma, el TC transita `current_phase = im`.
**Acciones L2**: borrador de cláusula modificada; análisis de riesgo legal.
**Acciones L1**: explicación de cualquier cláusula.

**Memoria escrita**:
- `operation.{id}.documents[]` (NDA).
- `match.{id}` queda como referencia histórica.

**Trazabilidad / audit**:
- `nda.template_loaded`.
- `nda.signed_by_party`.
- **`nda.fully_signed`** ★.

**Riesgos / consideraciones**:
- NDA progresivo (`NDA_SPEC.md`): cuando exista, el TC ofrecerá la versión apropiada según el nivel de revelación.
- Firma electrónica: el TC NO firma en nombre del usuario; siempre L3 explícito.

---

### Fase 8 — Acceso al Information Memorandum (IM)

**Capa**: Transaction.
**Objetivo del Transaction Copilot**: facilitar la lectura del IM al Buyer, asistir al Seller en su preparación, y preparar la transición a Q&A.

**Qué pregunta al usuario o le ofrece**:
- (Buyer) "Aquí tienes el IM. ¿Quieres un resumen ejecutivo? ¿Análisis de riesgos automático? ¿Preparar preguntas para el Seller?"
- (Seller) "Tu IM está listo para liberación. ¿Lo apruebas? ¿Quieres añadir secciones extra?"

**Qué copilots especializados invoca y por qué**:
- **Company Copilot**: datos fuente del IM (financieros, comerciales, operativos).

**Información consumida**:
- Ficha completa de la empresa.
- Valoraciones aplicables.
- Documentos asociados (memoria mercantil, financieros).

**Información que entrega al usuario**:
- Buyer: IM consumible + resumen ejecutivo opcional + listado preliminar de Q&A.
- Seller: status de consumo del Buyer.

**Acciones L4**: —
**Acciones L3**: "Aprobar IM para liberación" (Seller); "Marcar IM como consumido" (Buyer, implícito o explícito).
**Acciones L2**: borrador de resumen ejecutivo (Buyer); borrador de IM (Seller); preguntas Q&A preliminares (Buyer).
**Acciones L1**: explicaciones sobre cualquier sección del IM.

**Memoria escrita**:
- `operation.{id}.documents[]` (IM).
- `operation.{id}.im_access_log[]`.

**Trazabilidad / audit**:
- `im.released`.
- `im.accessed_by_buyer`.

**Riesgos / consideraciones**:
- Filtración: el IM es el documento más sensible pre-LOI. Watermarks por consumidor obligatorios.

---

### Fase 9 — Preguntas y respuestas (Q&A)

**Capa**: Transaction.
**Objetivo del Transaction Copilot**: estructurar el intercambio de preguntas y respuestas entre Buyer y Seller, ayudar a ambos a redactar de forma productiva.

**Qué pregunta al usuario o le ofrece**:
- (Buyer) "¿Quieres usar una checklist estándar de preguntas para sector X? ¿Añadir preguntas custom?"
- (Seller) "Tienes N preguntas pendientes. ¿Quieres que prepare borradores de respuesta?"

**Qué copilots especializados invoca y por qué**:
- **Advisor Copilot**: ayuda al Seller a estructurar respuestas defendibles; identifica preguntas con riesgo legal.

**Información consumida**:
- IM.
- Datos de la empresa.
- Q&A logs previos del sector (anonimizados, opcional).

**Información que entrega al usuario**:
- Lista de Q&A estructurada por categoría (financieros, legales, comerciales, ESG).
- Resumen del estado: pendientes, respondidas, declinadas.
- Próximos pasos: cerrar Q&A o continuar.

**Acciones L4**: —
**Acciones L3**: "Enviar respuesta" (Seller); "Enviar pregunta" (Buyer); "Cerrar Q&A log".
**Acciones L2**: borrador de pregunta (Buyer); borrador de respuesta (Seller); clasificación automática.
**Acciones L1**: conversación sobre cualquier Q&A.

**Memoria escrita**:
- `operation.{id}.qa_log[]`.

**Trazabilidad / audit**:
- `qa.question_posted`.
- `qa.answer_posted`.
- `qa.log_closed`.

**Riesgos / consideraciones**:
- Sesgo del Seller (omisión). El TC NO puede inventar respuestas que el Seller no proporcione; sólo asiste en la redacción.

---

### Fase 10 — Presentación de la Oferta Indicativa (LOI / NBO)

**Capa**: Transaction.
**Objetivo del Transaction Copilot**: orquestar la presentación de la oferta, su negociación y su firma, con apoyo del Advisor Copilot (cláusulas) y del Valuation Copilot (justificación del precio).

**Qué pregunta al usuario o le ofrece**:
- (Buyer) "¿Quieres presentar una IOI no vinculante antes de la LOI vinculante? ¿Plantilla estándar de LOI o personalizada?"
- (Seller) "Te ha llegado una LOI por X€ con cláusulas Y. Aquí tienes el análisis del Advisor Copilot. ¿Aceptas, negocias o rechazas?"

**Qué copilots especializados invoca y por qué**:
- **Advisor Copilot**: revisión legal de cláusulas, sugerencias de modificación.
- **Valuation Copilot**: justificación o crítica del precio ofrecido vs. valoración de referencia.

**Información consumida**:
- IM, Q&A log.
- Valoraciones de referencia.

**Información que entrega al usuario**:
- IOI/LOI con explicación.
- Análisis "alineado con valoración" / "por encima / por debajo".
- Comparator multi-bidder si aplica.

**Acciones L4**: —
**Acciones L3**: "Presentar IOI" (Buyer); "Presentar LOI vinculante" (Buyer); "Aceptar / Negociar / Rechazar LOI" (Seller); "Firmar LOI" (ambas partes).
**Acciones L2**: borrador de LOI; sugerencias de cláusula; comparator.
**Acciones L1**: explicación de cualquier cláusula.

**Memoria escrita**:
- `operation.{id}.documents[]` (IOI, LOI drafts, LOI firmada).

**Trazabilidad / audit**:
- `ioi.presented`.
- `loi.presented` / `_negotiated` / `_rejected`.
- **`loi.fully_signed`** ★.

**Riesgos / consideraciones**:
- Exclusividad: la LOI suele incluir cláusula. El TC debe prevenir activamente que el Seller acepte LOIs simultáneas durante el plazo declarado.

---

### Fase 11 — Due Diligence (DD)

**Capa**: Transaction.
**Objetivo del Transaction Copilot**: orquestar el Data Room, el flujo de subida/consumo de documentos, el análisis automatizado y el Q&A de DD. Es la fase más intensa en colaboración entre especialistas.

**Qué pregunta al usuario o le ofrece**:
- (Buyer) "Aquí está el Data Room. ¿Quieres que el Advisor Copilot prepare un análisis automatizado por categoría? ¿Generar lista priorizada de hallazgos?"
- (Seller) "Faltan N documentos solicitados por el Buyer. ¿Quieres ayuda para preparar los pendientes?"

**Qué copilots especializados invoca y por qué**:
- **Advisor Copilot**: análisis legal/contractual del Data Room; estructura de hallazgos (red/yellow/ok flags).
- **Company Copilot**: contexto adicional sobre la empresa target cuando aparecen señales nuevas.

**Información consumida**:
- Data Room (todos los documentos).
- Q&A log de fase 9.
- Memoria de empresa para señales relevantes.

**Información que entrega al usuario**:
- Resumen estructurado por categoría (financieros, legales, fiscales, comerciales, técnicos, ESG).
- Lista de red flags / yellow flags / ok.
- Lista de Q&A pendientes generadas a partir del DD.
- DD report draft (al cerrar la fase).

**Acciones L4**: **recordatorios automatizados** al Seller sobre documentos pendientes (autorización previa requerida).
**Acciones L3**: "Subir documento" (Seller); "Solicitar documento adicional" (Buyer); "Cerrar DD" (Buyer).
**Acciones L2**: clasificación automática de documentos; resumen por documento; identificación automática de cláusulas críticas.
**Acciones L1**: conversación sobre cualquier documento del Data Room.

**Memoria escrita**:
- `operation.{id}.dataroom_access_log[]`.
- `operation.{id}.dd_findings[]`.
- `operation.{id}.documents[]` (DD report).
- `company.{id}.lineage[]` (cuando un hallazgo del Data Room afecta a la ficha permanente de la empresa, con flag de confidencialidad).

**Trazabilidad / audit**:
- `dataroom.opened`.
- `dataroom.document_uploaded`.
- `dataroom.document_accessed`.
- `dd.report_emitted`.

**Riesgos / consideraciones**:
- DD prolongada erosiona el deal. El TC debe surfacear KPIs de "tiempo en DD" y proponer cierres parciales.
- Confidencialidad: el TC NO debe filtrar hallazgos al Buyer fuera del Data Room ni al Seller fuera del Q&A.

---

### Fase 12 — Negociación

**Capa**: Transaction.
**Objetivo del Transaction Copilot**: orquestar la negociación del SPA con Advisor Copilot como protagonista; versionar drafts; consolidar acuerdos por cláusula.

**Qué pregunta al usuario o le ofrece**:
- "Tu Advisor propone modificación en la cláusula de earn-out. ¿Quieres revisarla con su contexto completo? ¿Aceptarla / proponer contra-propuesta?"
- "La contraparte ha aceptado N cláusulas; quedan M pendientes."

**Qué copilots especializados invoca y por qué**:
- **Advisor Copilot** (central): cláusulas, drafts, diffs, riesgo legal, proposiciones.

**Información consumida**:
- DD report.
- LOI firmada.
- Valoraciones actualizadas (puede invocarse Valuation Copilot puntualmente para reajustes).

**Información que entrega al usuario**:
- Drafts SPA versionados con diffs visibles.
- Estado de acuerdo por cláusula.
- Identificación de cláusulas no estándar / alto riesgo.

**Acciones L4**: —
**Acciones L3**: "Aceptar cláusula" / "Proponer contra-redacción" / "Versionar draft" / "Cerrar negociación".
**Acciones L2**: borrador de contra-cláusula; comparator entre versiones.
**Acciones L1**: explicación de cualquier cláusula.

**Memoria escrita**:
- `operation.{id}.spa_drafts[]` (versionados).
- `operation.{id}.clause_decisions[]`.

**Trazabilidad / audit**:
- `spa.draft_versioned`.
- `spa.clause_agreed`.
- `negotiation.closed`.

**Riesgos / consideraciones**:
- Conflictos de interés del Advisor: el TC registra siempre **quién propuso qué** (autor de cláusula).

---

### Fase 13 — Firma del SPA

**Capa**: Transaction.
**Objetivo del Transaction Copilot**: orquestar la firma final del SPA con verificación cruzada y, opcionalmente, sello de `arroba_team`.

**Qué pregunta al usuario o le ofrece**:
- "El SPA está listo para firma. Tu Advisor ha hecho el último review. ¿Confirmas firma?"
- "Tu contraparte ha firmado. Falta tu firma."

**Qué copilots especializados invoca y por qué**:
- **Advisor Copilot**: último review pre-firma; checklist de elementos faltantes.

**Información consumida**:
- SPA draft consensuado.
- Identidades + poderes.

**Información que entrega al usuario**:
- Resumen final del SPA.
- Checklist de pre-firma completada.
- Estado de la doble firma.
- Próximos pasos: condiciones suspensivas, fase 14.

**Acciones L4**: —
**Acciones L3**: **"Confirmar firma del SPA"** (cada parte). Tras doble firma, transita `current_phase = closing`.
**Acciones L2**: revisión final automatizada; checklist.
**Acciones L1**: explicaciones finales.

**Memoria escrita**:
- `operation.{id}.documents[]` (SPA firmado, inmutable).

**Trazabilidad / audit**:
- `spa.signed_by_party`.
- **`spa.fully_signed`** ★.

**Riesgos / consideraciones**:
- Inmutabilidad post-firma. Modificaciones posteriores son addenda versionados, no edición del SPA.

---

### Fase 14 — Closing legal

**Capa**: Transaction.
**Objetivo del Transaction Copilot**: rastrear las condiciones suspensivas, coordinar capability boundaries (notaría, banco), declarar el Closing.

**Qué pregunta al usuario o le ofrece**:
- "Faltan N condiciones suspensivas. ¿Quieres ver el detalle? ¿Quieres recibir recordatorios automáticos cuando una se cumpla?"
- "Todas las condiciones se han cumplido. ¿Declaras Closing?"

**Qué copilots especializados invoca y por qué**:
- En esta fase el TC opera **sin delegación** salvo consultas puntuales a Advisor Copilot (interpretación de una condición suspensiva).

**Información consumida**:
- SPA.
- Confirmaciones bancarias / notariales (boundary).

**Información que entrega al usuario**:
- Estado de las condiciones suspensivas (tracker).
- Eventos de cumplimiento.
- Closing memo borrador.

**Acciones L4**: **verificación automatizada de hitos** (cuando se autoriza previamente al sistema a marcar hitos como cumplidos al recibir confirmación bancaria/notarial).
**Acciones L3**: "Declarar Closing" (ambas partes).
**Acciones L2**: borrador de Closing memo; tracker de condiciones.
**Acciones L1**: explicaciones sobre cualquier condición.

**Memoria escrita**:
- `operation.{id}.documents[]` (Closing memo).
- `operation.{id}.monetization_events[]` (Success Fee devengada).

**Trazabilidad / audit**:
- `closing.condition_met`.
- **`closing.declared`** ★ (dispara `monetization.fee_due` y transición a fase 15).

**Riesgos / consideraciones**:
- Plazo de cumplimiento de suspensivas: el TC alerta al usuario cuando se aproxima el límite.
- Fee devengado: el TC notifica al usuario y al Advisor representante (revenue share).

---

### Fase 15 — Integración post-operación

**Capa**: Transaction.
**Objetivo del Transaction Copilot**: acompañar la integración a lo largo de meses/años con recordatorios autorizados, reportes periódicos y check-ins.

**Qué pregunta al usuario o le ofrece**:
- "Tu plan de integración tiene N hitos. ¿Cuál marcamos como cumplido?"
- "Han pasado 30 días sin movimiento. ¿Quieres un check-in con la contraparte?"

**Qué copilots especializados invoca y por qué**:
- **Advisor Copilot** (puntual): interpretación de cláusulas de integración que generen disputa.

**Información consumida**:
- SPA (cláusulas de integración).
- Plan de integración.
- Histórico de check-ins.

**Información que entrega al usuario**:
- Tracker de hitos.
- Reportes periódicos.
- Alertas de bloqueo.

**Acciones L4**: **recordatorios autorizados** + **reportes periódicos** (cadencia configurada en autorización).
**Acciones L3**: "Marcar hito cumplido" / "Declarar integración completada" (acuerdo de ambas partes).
**Acciones L2**: borrador de reporte; sugerencia de próximos hitos.
**Acciones L1**: conversación sobre cualquier hito.

**Memoria escrita**:
- `operation.{id}.integration_log[]`.
- `operation.{id}.documents[]` (Integration plan + actualizaciones).
- Al cerrar: `company.{id}.lineage[]` (operación queda en historial permanente de la empresa).

**Trazabilidad / audit**:
- `integration.milestone_completed`.
- **`integration.completed`** ★ → `operation.closed_with_success`.

**Riesgos / consideraciones**:
- Fase larga: el TC debe reducir intensidad de seguimiento progresivamente (de semanal a mensual a trimestral).

---

## 6. Modelo de colaboración entre copilots

### 6.1 Patrón de delegación

El Transaction Copilot delega siguiendo este patrón:

```
Usuario  ──► Transaction Copilot
                │
                │ 1. Identifica tipo de consulta (transaccional / analítica / valorativa / mercado / legal)
                │ 2. Selecciona especialista(s)
                │ 3. Construye contexto compartido
                │ 4. Invoca especialista(s) en paralelo o secuencial
                ▼
        Company / Market / Valuation / Advisor
                │
                │ Cada especialista responde con: { content, structured_output, citations, confidence }
                ▼
        Transaction Copilot
                │ 5. Consolida (ver §6.2)
                │ 6. Resuelve contradicciones (ver §6.3)
                │ 7. Persiste en memoria (lineage)
                │ 8. Empaqueta respuesta con voz y atribución
                ▼
        Usuario
```

### 6.2 Patrón de consolidación

Cuando varios especialistas contribuyen a una misma respuesta:

- **Acumulación** (caso fácil): los aportes son complementarios. Ejemplo: Company aporta análisis cualitativo, Valuation aporta número. El TC concatena con secciones claras.
- **Síntesis** (caso medio): los aportes se solapan. El TC sintetiza la versión más informada, citando las fuentes.
- **Selección con justificación** (caso difícil): los aportes son contradictorios. Ver §6.3.

### 6.3 Resolución de contradicciones

Si dos especialistas dan respuestas contradictorias, el Transaction Copilot:

1. **No silencia ninguna**. Las dos respuestas quedan en memoria con su `confidence` declarado.
2. **Prioriza por dominio**: en valoración, prevalece Valuation. En análisis sectorial, prevalece Market. En cláusulas legales, prevalece Advisor. En datos de empresa, prevalece Company.
3. **Cuando la contradicción es transversal** (ej. Valuation propone X, pero los datos de Company sugieren Y): el TC presenta **ambas respuestas explícitamente** al usuario y solicita decisión humana.
4. **Registra la contradicción** en audit log (`copilot.contradiction_detected`) para mejora posterior del sistema.

**Voz final frente al usuario**: el Transaction Copilot es siempre quien firma la respuesta consolidada. Los especialistas contribuyen, pero el TC es **el único que habla**.

### 6.4 Compartición de memoria

El Transaction Copilot expone a los especialistas un **subconjunto del contexto compartido** según el principio de **least privilege**:

| Especialista | Memoria accesible (lectura) |
|---|---|
| Company Copilot | `company.{id}`, `user.{id}.preferences`, `operation.{id}.metadata` (sólo metadata, no detalles legales) |
| Market Copilot | `opportunity.{id}`, `company.{id}.public`, agregados sectoriales |
| Valuation Copilot | `company.{id}.financials`, `valuation.{id}` previas, comparables |
| Advisor Copilot | `operation.{id}.documents`, plantillas legales, `match.{id}.metadata` |

La memoria de **otras operaciones del mismo usuario** se aísla por defecto (información sensible no se filtra cross-deal).

### 6.5 "Consulta interna" vs. "respuesta al usuario"

Diferenciación explícita:

- **Consulta interna** (TC → especialista): texto y datos pasados al especialista para que razone. Estructurado. **No se muestra al usuario** salvo en modo debug.
- **Respuesta al usuario** (TC → usuario): texto final consolidado con voz coherente. **Sí se muestra**.

Esta separación queda registrada en audit:

- `copilot.internal_query` (consulta interna).
- `copilot.user_response` (respuesta consolidada al usuario).

### 6.6 Especialistas estrictamente acotados al dominio (patch v1.1.0)

> **Patch v1.1.0 — principio canónico.**
>
> **Cada especialista responde únicamente sobre su dominio.** **No debe intentar resolver preguntas fuera de él.** Si necesita información de otro dominio, **deberá solicitarla al Transaction Copilot mediante `response.recommendations`**. **Nunca invocará directamente a otro especialista.**

**Reglas operativas derivadas**:

- Si una invocación al **Company Copilot** incluye una pregunta valorativa (ej. "¿cuánto vale esta empresa?"), el especialista debe devolver `status: "partial"` o `status: "denied"` con `recommendations: [{ next_step: "consult_valuation_copilot", rationale: "..." }]`. **No debe inventar valoración**.
- Si una invocación al **Valuation Copilot** incluye una pregunta sobre dinámica sectorial, debe declarar la necesidad de `Market Copilot` en `recommendations`. **No debe inferir sectorialmente**.
- Si una invocación al **Market Copilot** requiere datos legales/contractuales (ej. cláusulas estándar de un sector), debe declarar la necesidad de `Advisor Copilot`. **No debe redactar legal**.
- Si una invocación al **Advisor Copilot** requiere datos cuantitativos de valoración, debe declarar la necesidad de `Valuation Copilot`. **No debe valorar por sí mismo**.

**Quién enforza esta regla**:

1. El **contrato canónico de invocación** (`COPILOTS_SPEC §9`) declara `capability` explícita y obligatoria; capacidades fuera del dueño se rechazan automáticamente.
2. El **Transaction Copilot** valida que cada `capability` solicitada pertenezca al especialista invocado (ver `COPILOTS_SPEC §16` para la lista cerrada de capacidades por dueño).
3. Cualquier intento de un especialista de invocar a otro **directamente** queda registrado como `copilot.forbidden_cross_invocation_attempted` y rechazado por la capa de orquestación.

**Consistencia**: refuerza lo declarado en `COPILOTS_SPEC §13.2` ("Los especialistas NO se invocan entre sí") y `§3.7` ("Outputs estructurados, no narrativos"). Esta sección lo eleva a **principio explícito** también dentro de `TRANSACTION_COPILOT_SPEC`.

---

## 7. Aplicación de los niveles agénticos

> Este spec **no define** los niveles; eso es `AGENTIC_LAYERS_SPEC`. Aquí declara **cómo el Transaction Copilot los aplica**.

### 7.1 L1 — Conversacional

**Siempre disponible** en cualquier fase del TOS para cualquier rol autorizado. No requiere autorización adicional.

Cobertura: explicaciones, exploración, preguntas y respuestas, comparaciones, hipotéticos, resúmenes, traducciones de jerga.

**Política del Transaction Copilot**:
- Responder con datos reales cuando estén disponibles.
- Marcar explícitamente cuando un dato es indicativo / mock / inferido.
- Nunca afirmar información que no haya verificado en memoria o entidad subyacente.

### 7.2 L2 — Preparación inteligente

**Disponible en casi todas las fases**. El copilot prepara un borrador (output revisable por humano) y se lo presenta al usuario para revisión.

Cobertura: borradores de Teaser, IM, LOI, SPA, valuación avanzada, narrative análisis, clasificación de documentos, comparator de drafts, análisis de Data Room, resumen ejecutivo, DD questions auto, comparación contratos, checklists, integración post-deal, screening por buyer profile, IOI draft.

**Política del Transaction Copilot**:
- Etiquetar siempre el output como **borrador**.
- Mostrar el `confidence` cuando aplique.
- Permitir al usuario aceptar, modificar o rechazar.
- Persistir el borrador con lineage al especialista que lo generó.

### 7.3 L3 — Ejecución asistida con confirmación explícita

**Disponible en fases que admiten acciones materiales**. El copilot **propone** y, tras confirmación explícita del usuario, **ejecuta**.

Cobertura típica: firmar NDA, firmar LOI, firmar SPA, enviar pregunta de Q&A, publicar Teaser al Marketplace, aceptar/rechazar Match, declarar Closing, declarar integración completada, marcar hito.

**Política del Transaction Copilot**:
- **Una confirmación = una acción**. No agrupar firmas.
- **Doble confirmación** para acciones legales críticas (firma de SPA, declaración de Closing).
- Idempotencia: si la acción ya se ejecutó (timestamp + hash), no se repite.
- Cancelable hasta el commit final.

### 7.4 L4 — Automatización autorizada previamente

**Disponible solo en fases declaradas explícitamente** (ver tabla `TRANSACTION_OS_SPEC §11.4`): fase 11 (notificaciones DD), fase 14 (verificación condiciones), fase 15 (recordatorios + reportes).

**Política del Transaction Copilot**:
- **Autorización previa** registrada en `operation.{id}.automation_grants[]` con scope, expiración y kill-switch.
- **Cada ejecución** notificada al usuario (no se ejecuta en silencio).
- **Auditable** evento por evento.
- **Revocable** por el usuario en cualquier momento.
- **No expansiva**: una autorización L4 cubre exclusivamente el scope declarado, no se generaliza.

---

## 8. Trazabilidad y auditoría del Transaction Copilot

### 8.1 Eventos canónicos del Copilot

Adicionales a los eventos del TOS (`TRANSACTION_OS_SPEC §9`):

- `copilot.session_started` / `copilot.session_ended` (con entidad ancla si la hay).
- `copilot.delegation_invoked` (a qué especialista, por qué, con qué contexto).
- `copilot.internal_query` (consulta interna a especialista).
- `copilot.contradiction_detected` (cuando dos especialistas entran en conflicto).
- `copilot.action_proposed` (L3 propuesta al usuario).
- `copilot.action_accepted` / `copilot.action_rejected` (decisión del usuario sobre la propuesta L3).
- `copilot.automation_authorized` (concesión de autorización L4).
- `copilot.automation_executed` (ejecución de L4 autorizada).
- `copilot.automation_revoked` (revocación de autorización L4).
- `copilot.user_response` (respuesta final entregada al usuario).
- `copilot.memory_read` / `copilot.memory_written` (con scope).
- `copilot.transition_authorized` / `copilot.transition_rejected` (validación de cambio de fase).

### 8.2 Diferenciación acciones autónomas vs. aprobadas

Cada evento del copilot lleva un campo `agentic_level: "L1" | "L2" | "L3" | "L4"` y un campo `human_approval: bool` que diferencia:

- **L1 / L2**: `human_approval = N/A` (son respuestas o borradores, no acciones materiales).
- **L3**: `human_approval = true` siempre antes de `copilot.action_executed`.
- **L4**: `human_approval = true` en el evento `copilot.automation_authorized` (anterior); falso en cada `copilot.automation_executed` (posteriores, cubiertos por la autorización previa).

### 8.3 Vinculación a fase / Match / Operation

Todo evento del copilot lleva los campos:

- `entity_type: "company" | "valuation" | "opportunity" | "match" | "operation"`
- `entity_id`
- `current_phase` (si aplica)
- `session_id` (conversación ancla)

Esto permite reconstruir, dada una `Operation`, **todo el árbol de decisiones del copilot** que la afectó.

### 8.4 Quién consulta el log del Copilot

| Quién | Qué ve |
|---|---|
| Cada parte | Eventos del copilot que afecten a sus entidades (operation, match propios) |
| Advisor representando | Lo mismo que su parte |
| `arroba_team` | Vista parcial relevante para mediación (con marca `arroba_team.copilot_log_accessed`) |
| `admin` | Acceso total (auditado) |

### 8.5 Retención

Mismo criterio que el audit log general del TOS: **mínimo 10 años post-cierre**. Detalle en `MEMORY_ENGINE_SPEC`.

---

## 9. Límites y zonas prohibidas

El Transaction Copilot **NO PUEDE** hacer las siguientes acciones bajo ninguna circunstancia. Cualquier intento queda registrado como `copilot.forbidden_action_attempted` y rechazado.

### 9.1 Acciones legales

- ❌ Firmar artefactos legales (NDA, LOI, SPA) **en nombre del usuario** sin confirmación L3 explícita por evento.
- ❌ Modificar el SPA tras `spa.fully_signed`.
- ❌ Modificar el NDA tras `nda.fully_signed`.
- ❌ Modificar el LOI tras `loi.fully_signed`.
- ❌ Aprobar Match en nombre del Seller.
- ❌ Solicitar Match en nombre del Buyer sin instrucción explícita.

### 9.2 Acciones de ciclo

- ❌ Crear `Match` sin la sub-acción explícita "Solicitud de Match" del Buyer.
- ❌ Crear `Operation` directamente (sólo el sistema, tras `match.accepted`).
- ❌ Cerrar `Operation` (CERRADA_CON_ÉXITO / CERRADA_SIN_ÉXITO) sin acuerdo bilateral de las partes (o intervención `admin`).
- ❌ Saltar fases ignorando la máquina de estados del TOS.
- ❌ Forzar transiciones cuando faltan precondiciones (artefacto firmado, evento emitido).
- ❌ Cancelar administrativamente (eso es `arroba_team` con `admin` o `admin` directamente).

### 9.3 Acciones de memoria y datos

- ❌ Acceder a memoria de operaciones **ajenas** al usuario actual.
- ❌ Filtrar información identificativa de una empresa en respuestas al Buyer **pre-aceptación de Match** (Discovery Layer).
- ❌ Compartir entre operaciones distintas del mismo usuario información sensible sin autorización explícita (la memoria por defecto está aislada cross-deal).
- ❌ Persistir información sensible fuera de los buckets canónicos definidos en `MEMORY_ENGINE_SPEC`.

### 9.4 Acciones agénticas

- ❌ Ejecutar L3 sin confirmación humana inmediatamente previa.
- ❌ Ejecutar L4 sin autorización previa registrada.
- ❌ Ampliar el scope de una autorización L4 sin nueva autorización del usuario.
- ❌ Ejecutar L4 tras la `expiration` declarada en la autorización.
- ❌ Ejecutar acción material si la fase actual no admite el nivel necesario (ver `TRANSACTION_OS_SPEC §11.4`).

### 9.5 Acciones financieras

- ❌ Disparar `monetization.fee_due` fuera del evento canónico que lo justifica (en este spec, sólo `closing.declared` lo dispara).
- ❌ Cobrar al usuario directamente: el cobro siempre pasa por el módulo `billing` (boundary, capability Stripe en el futuro).
- ❌ Modificar `revenue_share` con advisors (eso vive en `MONETIZATION_SPEC`).

### 9.6 Acciones de identidad

- ❌ Revelar la identidad de una empresa target a un Buyer pre-Match (Discovery Layer).
- ❌ Compartir la cualificación detallada de un Buyer con un Seller fuera del flujo de Solicitud de Match.
- ❌ Suplantar a un actor (firmar como Advisor sin Mandate explícito, hablar en nombre de `arroba_team`, etc.).

---

## 10. Modelo de gobierno

### 10.1 Proactividad vs. reactividad

El Transaction Copilot opera en dos modos:

- **Reactivo**: responde a consultas del usuario. Modo por defecto.
- **Proactivo**: emite mensajes / notificaciones / propuestas sin que el usuario haya preguntado. Sólo en circunstancias declaradas:
  - Eventos críticos: notificar al Seller que llegó una `match.solicited`, notificar al Buyer que se firmó `nda.fully_signed`, etc.
  - Bloqueos detectados: "El IM lleva consumido 14 días sin que avance la fase. ¿Quieres preparar Q&A?"
  - Recordatorios L4 autorizados.
  - Hitos cercanos a vencer.

El nivel de proactividad es **configurable** por el usuario (ver §10.3 política de notificaciones).

### 10.2 Configuración y silenciamiento

El usuario puede:

- Silenciar **temporalmente** todas las notificaciones proactivas (`silenced_until: timestamp`).
- Silenciar por **canal**: dock conversacional, email, push, in-app.
- Silenciar por **operación**: "no me notifiques de esta operación durante X días".
- Mantener siempre activas las **notificaciones críticas** (firmas pendientes, eventos terminales). El silenciamiento NO cubre eventos críticos.

### 10.3 Política de notificaciones

**Notificaciones críticas** (siempre se entregan):
- `match.solicited` al Seller.
- `match.accepted` al Buyer.
- `nda.fully_signed`, `loi.fully_signed`, `spa.fully_signed`, `closing.declared`, `integration.completed`.
- `monetization.fee_due`.
- Vencimiento próximo de plazos legales.

**Notificaciones operativas** (silenciables):
- Propuestas L2 sin solicitud previa.
- Recordatorios L4.
- Sugerencias de "siguiente mejor acción".

### 10.4 Política de "siguiente mejor acción"

Al final de cada respuesta, el Transaction Copilot puede ofrecer la **siguiente mejor acción** (NBA) basada en:

- Fase actual.
- Estado de la entidad.
- Permisos del usuario.
- Historial reciente.

Reglas:

- **Máximo 3 NBA** por respuesta.
- Cada NBA tiene **acción + razón**.
- NBA **nunca** dispara acción L3 sin nuevo turno de confirmación.
- El usuario puede desactivar las NBA en configuración.

### 10.5 Escalamiento

El Transaction Copilot **escala** automáticamente cuando:

- Detecta una **contradicción crítica** entre especialistas (ej. Valuation y Company en desacuerdo extremo sobre un dato fundamental).
- Detecta un **bloqueo prolongado** entre partes que no responden.
- Detecta un **posible fraude o abuso** (intentos repetidos de acciones prohibidas, accesos sospechosos).
- Recibe **petición explícita del usuario** de mediación.

Escalado: → `arroba_team` (mediación) → `admin` (intervención crítica).

---

## 11. Integración forward con otros specs

### 11.1 De `COPILOTS_SPEC` (0.3) necesito

| Necesidad | Detalle |
|---|---|
| Contrato de invocación de Company Copilot | Schema de input (entity_id + intent), schema de output (content + structured_output + confidence + lineage) |
| Contrato de invocación de Market Copilot | Idem para análisis sectorial/territorial y matching |
| Contrato de invocación de Valuation Copilot | Idem para valoraciones indicativas + avanzadas |
| Contrato de invocación de Advisor Copilot | Idem para revisión legal, drafts, cláusulas |
| Catálogo de **~20 capacidades de Nivel 2** distribuidas entre los 4 especialistas | Tabla canónica capacidad ↔ copilot dueño |
| Política de timeouts y reintentos | Cuánto espera el TC a un especialista antes de degradar |
| Modelo de identidad visible al usuario | "Company Advisor de X", "Sector Analyst Y", etc. |

### 11.2 De `MEMORY_ENGINE_SPEC` (0.4) necesito

| Necesidad | Detalle |
|---|---|
| Contrato de lectura/escritura de **memoria de empresa** | Permisos, scope, lineage |
| Contrato de **memoria de match** y **memoria de operación** | Cómo se inicializa, qué se hereda al transitar Match → Operation |
| Contrato de **memoria de usuario** | Preferencias, historial, autorizaciones L4 |
| Contrato de **memoria compartida entre copilots** | Estructura, permisos cruzados, expiración |
| Contrato de **audit log** | Cómo el TC emite eventos, cómo se garantiza inmutabilidad |
| Política de **retención** | 10 años + tiering |
| Política de **borrado** | GDPR / right-to-be-forgotten vs. retención legal |

### 11.3 De `AGENTIC_LAYERS_SPEC` (0.5) necesito

| Necesidad | Detalle |
|---|---|
| Definición exacta de L1 | Qué cuenta como "respuesta conversacional" |
| Definición exacta de L2 | Qué cuenta como "borrador revisable" |
| Definición exacta de L3 | Estructura del ciclo "propuesta → confirmación → ejecución" |
| Definición exacta de L4 | Estructura de las autorizaciones, scope, expiración, kill-switch |
| Política de **escalado de nivel** | Cómo un usuario pasa de "todo en L1" a habilitar L3/L4 |
| Cuotas / límites | Cuántas acciones L3/L4 permitidas por plan (referenciado a `MONETIZATION_SPEC`) |

### 11.4 De `MONETIZATION_SPEC` (0.6) necesito

| Necesidad | Detalle |
|---|---|
| Catálogo de **eventos económicos** detectables por el TC | Lista cerrada de eventos que disparan billing |
| Cómo se materializa un evento económico | Quién paga, quién recibe, cuándo, cómo |
| Diferenciación **plan-based** | Qué capacidades del TC dependen del plan del usuario |
| Política de **revenue share con advisors** | Cómo el TC notifica al advisor cuando se devenga su parte |
| Cobranza | Boundary con Stripe / proveedor de pago |

---

## 12. Open Questions

> Numeración B1-Bn (B = Spec 0.2). Si el canon no resuelve algo, queda `[OPEN]` sin inventar respuesta.

| ID | Pregunta | Propuesta de este spec | Estado |
|---|---|---|---|
| **B1** | Persistencia de Recomendaciones (fase 5): ¿efímeras o persistidas? | Persistir las accionadas y un buffer N de las propuestas recientes; efímeras el resto. Política exacta a definir | **ABIERTO** (relacionado con `[OPEN-A12]` del TOS spec) |
| **B2** | ¿El Transaction Copilot puede leer audit logs de otros usuarios para detectar patrones (red flags, fraude)? | NO por defecto. Solo `arroba_team`/`admin` cuando se escala. El TC opera con datos de la(s) operación(es) del usuario actual | **ABIERTO** — confirmación negocio |
| **B3** | Memoria cross-deal de un mismo usuario | Por defecto aislada. ¿Permitir opt-in del usuario "el TC puede aprender de mis operaciones anteriores"? | **ABIERTO** — decisión de privacidad |
| **B4** | Modelo LLM subyacente al TC | El TC debe ser **agnóstico de modelo** (interface uniforme). Soportar Claude Sonnet 4.6 (actual) + alternativas. Detalle de provider en factory backend, no en este spec | **ABIERTO** (operativo, no de producto) |
| **B5** | Política de timeouts entre TC y especialistas | Propuesta: 12s por especialista, degradación elegante (fallback determinista cuando aplica). Detalle exacto en `COPILOTS_SPEC` | **ABIERTO** — a resolver en 0.3 |
| **B6** | Cuándo el TC debe "ceder la palabra completamente" a un especialista | Propuesta: cuando la respuesta del especialista es estructurada (tabla, valoración, draft) y no requiere consolidación. Detalle UX en Design System. | **ABIERTO** — decisión UX |
| **B7** | Política de "consulta al usuario" antes de actuar | El TC pregunta antes de acciones materiales (siempre L3), pero ¿pregunta antes de L2 que escribe memoria? Propuesta: NO; L2 son borradores etiquetados como tales | **ABIERTO** — confirmación |
| **B8** | Multi-usuario en la misma sesión / Workspace | Si Buyer y Seller están simultáneamente en `/operacion/{id}`, ¿hablan al mismo TC? Propuesta: cada uno tiene su sesión privada pero el TC ve el estado compartido. Conversación cruzada se canaliza vía Q&A oficial, no chat conjunto | **ABIERTO** — modelo de presencia |
| **B9** | Memoria de Advisor cross-mandato | Un Advisor opera varias operaciones. ¿El TC le permite aprovechar patrones cross-mandato? Por defecto NO (cada Mandate aislado); puede haber opt-in | **ABIERTO** — privacy + competitive |
| **B10** | Fallback determinista del TC | Cuando el LLM falla, ¿qué responde el TC? Propuesta: respuesta determinista por fase (catálogo cerrado de "lo siento, no puedo procesar tu consulta ahora; te ofrezco las acciones disponibles en esta fase: …") | **ABIERTO** — implementación |
| **B11** | Identidad visible cuando un especialista contribuye | El spec declara "voice + contributors". El detalle exacto del rendering (badge, color, prefijo) es DS. Pero, ¿el TC siempre **debe** declarar contribuyentes o sólo cuando es relevante? | **ABIERTO** — decisión UX |
| **B12** | Coste y modelos | ¿El TC usa modelos distintos para L1 (rápido y barato) vs. L2 (más caro, mejor)? Recomendable. Materialización en factory backend | **ABIERTO** (operativo) |

### Lagunas detectadas para resolver en specs 0.3–0.6

**`COPILOTS_SPEC` (0.3)** — debe responder:
- Catálogo cerrado de las **~20 capacidades L2** y a qué especialista pertenece cada una.
- Contrato exacto de **input/output** de cada especialista.
- Modelo de **identidad visible** ("Company Advisor de X", etc.).
- Política de **timeouts y reintentos**.
- Modo de **memoria propia** de cada especialista vs memoria compartida.

**`MEMORY_ENGINE_SPEC` (0.4)** — debe responder:
- Esquema canónico de los **9 tipos de memoria** declarados.
- Política de **retención** (10 años post-cierre confirmados).
- Política de **borrado por GDPR**.
- Modelo de **lineage**.
- **Aislamiento cross-deal y cross-user** por defecto.

**`AGENTIC_LAYERS_SPEC` (0.5)** — debe responder:
- Definición operativa exacta de L1/L2/L3/L4.
- Modelo de **autorizaciones L4** (scope, expiración, kill-switch).
- **Cuotas** por plan (forward a Monetization).

**`MONETIZATION_SPEC` (0.6)** — debe responder:
- Catálogo cerrado de **eventos económicos**.
- Política de **revenue share advisor / plataforma**.
- Modelo de **planes** (subscriber / corporate / investor / advisor) con cuotas y límites.
- **Boundary Stripe** (cuando se implemente).

---

> **Fin del documento.** — `v1.0.0` — pendiente de revisión humana.
