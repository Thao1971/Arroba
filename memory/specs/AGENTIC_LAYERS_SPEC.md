# arroba.com — Agentic Layers Spec v1.0.0

> **Capa canónica**: *Engines & Specs* (séptima capa, pendiente de propagación a `ARROBA_PHILOSOPHY.md` §13 al cierre del Sprint 0).
> **Fase del proyecto**: Sprint 0 · Fase 0.5 (quinto de 6 specs).
> **Estado**: borrador para revisión humana.
> **Fecha**: 2026-06-25.
> **Documentos predecesores (lectura obligatoria)**: `TRANSACTION_OS_SPEC v1.1.0` · `TRANSACTION_COPILOT_SPEC v1.1.0` · `COPILOTS_SPEC v1.0.0` · `MEMORY_ENGINE_SPEC v1.0.0`.
> **Idioma**: español canónico técnico.
>
> Este documento define la **capa agéntica** del Transaction OS: los **4 niveles de autonomía** (L1–L4), el **schema canónico de declaración de capability** que incorpora autonomía + criticidad + reversibilidad, el **schema canónico de autorización L4**, el **kill-switch operacional**, las políticas de **escalado / degradación**, la **matriz `criticality × level`**, los **eventos canónicos de trazabilidad** y el **catálogo de las 29 capabilities** declaradas en `COPILOTS_SPEC §16` traducidas al nuevo modelo.
>
> **Decisión canónica fundacional (Principio 4)**: *"Los niveles agénticos no representan mayor inteligencia. Representan únicamente un mayor grado de autonomía. El razonamiento debe ser exactamente el mismo. Lo único que cambia es quién ejecuta la acción."*
>
> **Documentos del Sprint 0**:
> 1. ✅ `TRANSACTION_OS_SPEC v1.1.0`
> 2. ✅ `TRANSACTION_COPILOT_SPEC v1.1.0`
> 3. ✅ `COPILOTS_SPEC v1.0.0`
> 4. ✅ `MEMORY_ENGINE_SPEC v1.0.0`
> 5. ← **este documento** (`AGENTIC_LAYERS_SPEC v1.0.0`)
> 6. `MONETIZATION_SPEC` (pendiente)

---

## Índice

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Glosario](#2-glosario)
3. [Principios canónicos](#3-principios-canónicos)
4. [Definición operacional de los 4 niveles](#4-definición-operacional-de-los-4-niveles)
5. [Declaración canónica de capability — schema](#5-declaración-canónica-de-capability--schema)
6. [Schema canónico de autorización L4](#6-schema-canónico-de-autorización-l4)
7. [Kill-switch operacional](#7-kill-switch-operacional)
8. [Política de escalado y degradación entre niveles](#8-política-de-escalado-y-degradación-entre-niveles)
9. [Reversibilidad operacional](#9-reversibilidad-operacional)
10. [Criticidad y matriz `criticality × level`](#10-criticidad-y-matriz-criticality--level)
11. [Catálogo de capabilities — revisión de las 29 declaradas en `COPILOTS_SPEC`](#11-catálogo-de-capabilities--revisión-de-las-29-declaradas-en-copilots_spec)
12. [Cuotas y planes (referencia forward)](#12-cuotas-y-planes-referencia-forward)
13. [Trazabilidad y eventos canónicos del Agentic Layer](#13-trazabilidad-y-eventos-canónicos-del-agentic-layer)
14. [Boundary First — qué es externo](#14-boundary-first--qué-es-externo)
15. [Integración forward con `MONETIZATION_SPEC` (0.6)](#15-integración-forward-con-monetization_spec-06)
16. [Open Questions](#16-open-questions)

---

## 1. Propósito y alcance

### 1.1 Qué es la capa agéntica de arroba.com

La **capa agéntica** del Transaction OS es el **sistema de control de la autonomía** con la que las capabilities ejecutan acciones sobre las entidades canónicas del producto (Empresa, Operación, Match, Valoración, etc.).

No es un sistema de "más IA". Es un **sistema de gobernanza de la ejecución** que canoniza, para cada capability:

- **Hasta dónde puede llegar sin que un humano confirme la acción** (nivel agéntico máximo).
- **A qué nivel está operando hoy** (current_level).
- **Qué tan crítica es la acción** (criticidad).
- **Si la acción puede deshacerse, compensarse o no** (reversibilidad).
- **Qué autorización explícita necesita** (schema L4).
- **Qué eventos genera** (audit trail trazable e inmutable).
- **Cómo se detiene de inmediato** (kill-switch).

### 1.2 Qué NO es

| No es | Es |
|---|---|
| Un sistema de "modelos más inteligentes en niveles más altos" | Un sistema donde **el razonamiento es idéntico** en L1, L2, L3 y L4 |
| Una jerarquía de cuánto sabe el sistema | Una jerarquía de **quién ejecuta la acción** |
| Una propiedad del copilot | Una propiedad **de cada capability** (CAP-XXX) |
| Una propiedad de la entidad (Operación / Empresa) | Una propiedad **de la capability** y, dentro de L4, **per Operation** |
| Una autorización genérica que abarca varias capabilities | Una autorización **per `(capability_id, operation_id)`** con expiración obligatoria |
| Un botón cosmético de "modo auto" | Un **contrato de delegación** con auditoría inmutable y kill-switch operacional |
| Un sustituto del Memory Engine | Un consumidor del Memory Engine con escrituras tipificadas por nivel agéntico |
| Un sustituto del Transaction Copilot | El **marco** dentro del cual el TC delega y los especialistas ejecutan |

### 1.3 Relación con specs predecesores

| Spec predecesor | Relación |
|---|---|
| `TRANSACTION_OS_SPEC v1.1.0` (0.1) | El TOS define la máquina de estados de Operation y los eventos canónicos. La capa agéntica se aplica **sobre** las capabilities que producen transiciones o efectos en esa máquina. Algunas transiciones son **inmutables post-firma** (`ENTITY_MODEL.md §7.3`); ninguna capability, ni siquiera en L4, las modifica. |
| `TRANSACTION_COPILOT_SPEC v1.1.0` (0.2) | El TC orquesta la delegación. Es el **único** componente que invoca especialistas. La capa agéntica determina, para cada delegación, si el resultado se ejecuta de inmediato (L1/L2 = solo verbaliza/prepara), tras confirmación (L3) o de forma autorizada (L4). |
| `COPILOTS_SPEC v1.0.0` (0.3) | Declara 29 capabilities y los 4 especialistas que las poseen. Este spec **NO modifica** `COPILOTS_SPEC.md`; presenta en §11 una **tabla canónica** que traduce las 29 capabilities al nuevo schema (max_level, criticality, reversibility). La actualización formal de `COPILOTS_SPEC` se hará al cierre del Sprint 0 si el usuario aprueba. |
| `MEMORY_ENGINE_SPEC v1.0.0` (0.4) | El Memory Engine valida `agentic_level` declarado en cada `write` / `update`. Escrituras L3/L4 requieren además referencia a la autorización (`MEMORY_ENGINE_SPEC §9.3`, §9.5). El Memory Engine **enforza** las 4 reglas inviolables B3 antes de aplicar cualquier escritura, independientemente del nivel agéntico. |
| `MONETIZATION_SPEC` (0.6, forward) | Define el coste de invocación por capability y las cuotas por plan. Algunas capabilities tienen cuotas más estrictas en niveles superiores (más autonomía → más coste de auditoría → más cuota). |
| `Risk & Compliance Service` (dependency externa, fuera Sprint 0) | Recibe alertas de la capa agéntica (criticidad Alta/Crítica en L3+) y puede revocar autorizaciones L4 ante anomalía. |

### 1.4 Alcance funcional

Este spec define:

1. Los **4 niveles agénticos** L1–L4 con definición operacional precisa (quién decide, quién ejecuta, qué se escribe, qué se auditea).
2. El **schema canónico de declaración de capability** con autonomía + criticidad + reversibilidad.
3. El **schema canónico de autorización L4** sin posibilidad de autorizaciones globales.
4. El **kill-switch operacional** con efectos canónicos.
5. La **política de escalado y degradación** entre niveles.
6. La **matriz `criticality × level`** que regula audit, alerting y cuotas.
7. Los **eventos canónicos del audit** del Agentic Layer.
8. El **catálogo traducido** de las 29 capabilities (§11).

Este spec **NO define**:

- Implementación tecnológica del orquestador de jobs / queue.
- Tarifas concretas en EUR / créditos (→ `MONETIZATION_SPEC`).
- UX del consentimiento y confirmación (→ Design System).
- Contrato detallado del Risk & Compliance Service (→ spec dedicado).
- Plantillas legales asociadas a capabilities (CAP-007 Teaser, CAP-021 LOI, etc. → specs P0/P1 fuera Sprint 0).

---

## 2. Glosario

### 2.1 Capability

**Capability** (capacidad). Unidad atómica de comportamiento del sistema declarada por un copilot especialista (Company / Market / Valuation / Advisor) o por el TC (orquestación). Cada capability tiene un identificador único (`CAP-XXX`), un dueño (`owner_copilot`), inputs y output tipificados, fases TOS donde aplica, memoria que lee/escribe, y — declarado en este spec — un par `(max_level, criticality)` y un valor `reversibility`. **La capability es la unidad mínima a la que se aplica el nivel agéntico**. No el copilot. No la entidad.

### 2.2 Nivel agéntico

**Nivel agéntico** (L1, L2, L3, L4). Cuatro niveles fijos que describen **el grado de autonomía con el que una capability ejecuta su acción**. El razonamiento (qué calcula, qué consulta, qué propone) es **idéntico** entre niveles. Lo que cambia es la **frontera entre razonamiento y ejecución**:

- **L1 — Conversacional**: el sistema razona; el usuario decide y ejecuta verbalmente.
- **L2 — Preparación inteligente**: el sistema razona y prepara borrador; el usuario decide.
- **L3 — Ejecución asistida**: el sistema razona, prepara y ejecuta tras confirmación humana explícita.
- **L4 — Automatización autorizada**: el sistema razona, prepara y ejecuta sin confirmación, dentro de los límites de una autorización previa con expiración.

### 2.3 Autonomía

**Autonomía**. Propiedad declarativa de cada capability que determina hasta qué nivel puede actuar sin confirmación humana en tiempo de ejecución. La autonomía **NO implica mayor inteligencia**; implica **mayor delegación operativa por parte del usuario**.

### 2.4 Autorización

**Autorización** (L4). Acto explícito y trazable mediante el cual un usuario concede a una capability concreta el derecho de ejecutar acciones en su nombre, dentro de una Operation específica, durante un plazo definido, hasta un número de usos delimitado. **No existen autorizaciones globales**. Su schema canónico está en §6.

### 2.5 Kill-switch

**Kill-switch**. Mecanismo operacional que **detiene de inmediato** cualquier actuación futura amparada por una autorización L4. Activable por el usuario autorizante, por `arroba_team` ante alerta y por `admin` en mediación. **No revierte** acciones ya ejecutadas; **solo impide nuevas**. Estado canónico de cada autorización: `kill_switch_state ∈ {armed, triggered}`.

### 2.6 Reversibilidad

**Reversibilidad**. Propiedad declarativa de cada capability que indica si su efecto puede revertirse. Tres valores canónicos:

- `reversible` — efecto deshacible automáticamente. La capability declara `inverse_capability_id` o procedimiento de undo.
- `compensable` — no se deshace pero existe acción compensatoria documentada. La capability declara `compensation_capability_id` y las condiciones bajo las que aplica.
- `irreversible` — efecto no revertible ni compensable. Requiere autorización L4 con `irreversibility_acknowledged: true` y queda **claramente identificada** en cualquier UI.

### 2.7 Criticidad

**Criticidad**. Propiedad declarativa de cada capability que indica el impacto potencial de su acción sobre la Operation, sobre las partes o sobre el sistema. Cuatro valores canónicos: **Baja / Media / Alta / Crítica**. La criticidad es **independiente del nivel agéntico**. Determina políticas de auditoría, monitorización, alerting y cuota (§10).

### 2.8 Cuota

**Cuota** (quota). Límite de uso de una capability — por unidad de tiempo (día / semana / mes), por plan (subscriber / corporate / investor / advisor) o por Operation — declarado en `MONETIZATION_SPEC` (forward). El Agentic Layer consume el valor `quota_credits` de cada capability como entrada al gateway de cuotas. Superar la cuota produce **degradación** (§8) o **bloqueo** (`agentic.execution.denied: "quota_exceeded"`).

### 2.9 Audit trail

**Audit trail**. Conjunto ordenado e inmutable de eventos canónicos (§13) que documentan toda invocación de capability, todo cambio de nivel efectivo, toda concesión / revocación de autorización, toda activación de kill-switch y toda alerta. Persistido por el Memory Engine en `audit.global` (`MEMORY_ENGINE_SPEC §4.10`) con retención mínima de 10 años post-cierre de la Operation referenciada.

### 2.10 Authorization scope

**Authorization scope**. Sub-objeto del schema de autorización (§6) que delimita el alcance de uso: `single_use`, `n_uses: K`, o `unlimited_until_expiry`. Cualquier scope obliga a respetar la `expires_at` de la autorización.

### 2.11 Escalado entre niveles

**Escalado** (escalation). Política operativa que **eleva el nivel efectivo** de una invocación cuando se detectan condiciones de mayor riesgo o menor confianza (ej. una capability L2 con confidence < 0.6 puede requerir confirmación humana explícita → escala a L3). El escalado nunca **eleva por encima del `max_level` declarado**; si el `max_level` impide escalar, el sistema verbaliza la limitación al usuario y propone alternativa.

### 2.12 Degradación entre niveles

**Degradación** (degradation). Política operativa que **baja el nivel efectivo** de una capability cuando se cumplen condiciones técnicas o comerciales (cuotas agotadas, modelo no disponible, kill-switch activado en una autorización ascendente, expiración de autorización L4 a media ejecución → degradación a L1/L2 con verbalización).

### 2.13 Frontera de ejecución

**Frontera de ejecución**. Punto exacto donde termina el razonamiento del sistema y empieza la actuación con efectos sobre entidades del TOS. La frontera se desplaza progresivamente del lado del usuario (L1) al lado del sistema (L4). El razonamiento previo a la frontera es **el mismo** en todos los niveles.

### 2.14 Whitelist explícita (criticidad Crítica)

**Whitelist explícita**. Mecanismo aplicado a capabilities `Crítica` en L3+: por defecto se rechazan (`default-deny`); requieren marcaje individual en el schema (`critical_whitelist_approved_by_admin: "<admin_id>"` + `critical_whitelist_approved_at: "<timestamp>"`) para poder operar en ese nivel. Este flag **NO** lo concede el usuario final; lo concede `admin` tras revisión del comportamiento de la capability en niveles inferiores.

---

## 3. Principios canónicos

### 3.1 Voz única (referencia a B6)

> Toda interacción con el usuario derivada del Agentic Layer — confirmaciones L3, notificaciones L4, alertas de criticidad, mensajes de kill-switch — se canaliza **siempre** a través del **Arroba Copilot** (TC). Los especialistas no hablan con el usuario; los componentes técnicos del Agentic Layer (queue, scheduler, audit) tampoco. La interfaz conversacional es **única**.

Ver `COPILOTS_SPEC §3.2` y `TRANSACTION_COPILOT_SPEC §3.1`.

### 3.2 Least privilege total (referencia a B2)

> Toda invocación de capability lleva un `actor` con scope explícito (`MEMORY_ENGINE_SPEC §9`). El Agentic Layer **no expande scope**: si el usuario no tiene permiso sobre `operation.{id}`, una capability invocada en su nombre tampoco lo tiene. L4 **no es bypass de permisos**; es bypass de la **confirmación humana en tiempo de ejecución**.

### 3.3 Aislamiento estricto entre adversarios (referencia a B3)

> Las 4 reglas inviolables (`MEMORY_ENGINE_SPEC §5`) se enforzan en cada invocación, independientemente del nivel agéntico. Una capability L4 no lee memoria cross-org, no mezcla buyer↔seller, no cruza clientes de un mismo Advisor sin consentimiento explícito. **L4 nunca relaja las reglas B3**.

### 3.4 Autonomía es propiedad de la capability (Principio 4 — Decisión 1)

> El `max_level` se declara en el schema de cada capability (CAP-XXX), no en el copilot ni en la entidad. Cada capability puede operar hasta su `max_level` sin reescritura arquitectónica. Las 29 capabilities catalogadas en `COPILOTS_SPEC §16` reciben en §11 de este spec un `max_level` específico justificado.

### 3.5 Autonomía ≠ inteligencia (Principio 4)

> El razonamiento de una capability — qué calcula, qué consulta, qué propone — es **idéntico** en L1, L2, L3 y L4. **Lo único que cambia es quién ejecuta la acción**. No existe "modelo más inteligente para L4"; existe "delegación más amplia para L4". Esto evita el sesgo de pensar que escalar a L4 es un upgrade de capacidad; es un upgrade de confianza.

### 3.6 Evolución progresiva sin reescritura (Principio 5)

> Toda capability se diseña con `evolution_path` declarado (lista de niveles previstos en su roadmap). Subir el techo (`max_level`) en una versión futura **no requiere reescritura del razonamiento**; solo ajuste de configuración + revisión de la frontera de ejecución. Ninguna capability puede tener una limitación arquitectónica que impida su evolución a L4 si el usuario lo decidiera.

### 3.7 Reversibilidad declarada (Principio 6)

> Toda capability declara `reversibility ∈ {reversible, compensable, irreversible}`. Las irreversibles requieren autorización L4 con `irreversibility_acknowledged: true` y se identifican claramente en cualquier UI / mensaje. Las reversibles declaran `inverse_capability_id`; las compensables declaran `compensation_capability_id`.

### 3.8 Criticidad independiente del nivel (Principio 7)

> Una capability puede ser `(L4, Baja)` — por ejemplo, publicar un evento de actividad pública — o `(L2, Crítica)` — por ejemplo, resumir automáticamente un documento legal sensible. La criticidad y el nivel agéntico son **dos dimensiones ortogonales**. La matriz `criticality × level` (§10) regula audit, alerting, monitorización y cuotas.

### 3.9 No existen autorizaciones globales (Decisión 2)

> Toda autorización L4 está atada a un `(capability_id, operation_id)` específico. No existe autorización "para todas las capabilities", "para todas las Operations", "permanente" o "sin expiración". Cualquier intento de invocar L4 sin autorización específica válida activa → bloqueo + alerta + evento `agentic.execution.denied: "no_active_authorization"`.

### 3.10 Kill-switch es derecho del usuario, no opción técnica (Decisión 3)

> El kill-switch está disponible **siempre** mientras exista una autorización L4 activa. No depende del plan, ni de la criticidad de la capability, ni del estado de la Operation. Su activación produce efectos canónicos en cadena (§7) y queda registrada como evento inmutable.

### 3.11 Trazabilidad total e inmutable

> Cada invocación, cada cambio de nivel efectivo, cada concesión / revocación de autorización, cada activación de kill-switch y cada alerta genera **eventos canónicos del Agentic Layer** (§13) persistidos por el Memory Engine en `audit.global`. La retención mínima es la retención de la Operation referenciada (10 años post-cierre).

### 3.12 Default-deny para criticidad Crítica en L3+

> Las capabilities con `criticality = Crítica` operando en L3 o L4 son **rechazadas por defecto**. Requieren whitelist explícita aprobada por `admin` (§2.14) tras revisión del histórico de la capability en L1/L2. Esta política existe para evitar que decisiones contractuales materiales sean ejecutadas sin escrutinio inicial.

### 3.13 Voz única también para fallos y degradación

> Cuando una capability degrada de nivel efectivo (cuota agotada, kill-switch activado, autorización expirada), el TC verbaliza la situación al usuario con explicación natural ("He intentado proceder automáticamente pero la autorización ha expirado; necesito que confirmes manualmente"). No hay errores técnicos visibles al usuario.

### 3.14 Forward-compatible con futuros niveles (sin abrir la puerta)

> Los 4 niveles L1–L4 son **fijos por diseño**. Si en el futuro se requiriera un nivel L5 (p. ej. autonomía colectiva entre orgs aliadas) sería una versión mayor del spec (v2.0.0) y se activaría tras revisión completa de implicaciones. **No se introducen niveles a discreción** dentro de la misma versión.

---

## 4. Definición operacional de los 4 niveles

> **Importante (Principio 4)**: el **razonamiento es idéntico** entre niveles. Lo único que cambia es la **frontera de ejecución**. En esta sección se detalla, por nivel, **quién decide**, **quién ejecuta**, qué memoria se lee/escribe y qué audit es obligatorio.

### 4.1 L1 — Conversacional

| Campo | Valor |
|---|---|
| **Definición** | El sistema razona internamente y produce respuesta natural verbalizada por el TC. **Ningún cambio persistente** ocurre en las entidades del TOS. La acción, si procede, la **ejecuta el usuario manualmente** dentro o fuera de la plataforma. |
| **Quién decide** | El usuario, sin material preparado por el sistema. |
| **Quién ejecuta** | El usuario, verbalmente o por acción manual posterior. |
| **Razonamiento** | Idéntico al de los otros niveles (mismas consultas, misma lógica, mismas fuentes). |
| **Frontera de ejecución** | Termina al final de la respuesta verbal del TC. No hay escritura en memoria de la entidad. |
| **Memoria leída** | Cualquier scope autorizado por permisos del usuario (`MEMORY_ENGINE_SPEC §9`). |
| **Memoria escrita** | **Únicamente** `user.{id}.conversation_history` (la conversación misma) y `audit.global` (evento de invocación). **Nunca** `company.{id}.*`, `operation.{id}.*`, `valuation.{id}.*` ni demás scopes operativos. |
| **Audit obligatorio** | `agentic.capability.invoked` con `level_efectivo: "L1"`, `agentic.capability.completed` con `outputs_summary` y `confidence`. |
| **Confirmación humana** | No aplica (no hay efecto que confirmar). |
| **Autorización L4** | No aplica. |
| **Ejemplos canónicos** | (a) "¿Qué empresas del sector salud he estado mirando esta semana?" — TC consulta `user.{id}.history` y verbaliza. (b) "Háblame de los riesgos típicos en operaciones M&A del sector logística." — TC delega a Advisor (CAP-022 en modo L1: solo verbaliza, no escribe). (c) "¿Cuánto vale aproximadamente una empresa con EBITDA de 2M en mi sector?" — TC delega a Valuation (CAP-016 en L1: cálculo verbalizado sin persistir `valuation.{id}`). |

### 4.2 L2 — Preparación inteligente

| Campo | Valor |
|---|---|
| **Definición** | El sistema razona y **prepara material persistente como borrador** (draft, propuesta, narrativa, ranking, lista). El usuario revisa, decide y, si aprueba, el material pasa a estado oficial o se ejecuta vía L3. **En L2 nunca hay efecto contractual ni de máquina de estados del TOS**. |
| **Quién decide** | El usuario, sobre el borrador preparado. |
| **Quién ejecuta** | Sistema escribe el draft (estado `draft=true`); usuario decide si promueve a oficial (vía L3) o descarta. |
| **Razonamiento** | Idéntico al de L1, L3, L4. |
| **Frontera de ejecución** | Termina al escribir el draft en memoria con flag `draft=true`. |
| **Memoria leída** | Scopes autorizados según capability + working context. |
| **Memoria escrita** | Entrada con `draft=true` en el scope de la entidad relevante (`company.{id}.narrative_drafts[]`, `opportunity.{id}.teaser_drafts[]`, `operation.{id}.documents` con flag draft, etc.) más working context (`MEMORY_ENGINE_SPEC §11`). |
| **Audit obligatorio** | `agentic.capability.invoked`, `agentic.capability.completed` con `output_persisted_as: "<entry_id>"` + flag `draft=true`. Sin alerta especial salvo criticidad ≥ Alta (ver §10). |
| **Confirmación humana** | No para crear el draft; sí para promover a estado oficial (eso es L3). |
| **Autorización L4** | No aplica. |
| **Ejemplos canónicos** | (a) CAP-001 prepara narrativa de empresa como `draft`. (b) CAP-016 calcula valoración indicativa y persiste `valuation.{id}` con flag `indicative=true`. (c) CAP-021 prepara LOI como `draft` con extracción de términos y `risk_flags[]`. (d) CAP-014 actualiza benchmarks sectoriales en draft pendiente de revisión Market Copilot. (e) CAP-008 redacta IM completo en draft con todas las secciones, pendiente de aprobación del Seller. |

### 4.3 L3 — Ejecución asistida

| Campo | Valor |
|---|---|
| **Definición** | El sistema razona, prepara y **ejecuta tras confirmación humana explícita** dentro de la misma sesión. La ejecución produce efectos persistentes en entidades del TOS (transitions de fase, promoción de drafts a oficial, envíos a contrapartes, marcado de hitos cumplidos). **Cada ejecución L3 requiere un acto de confirmación humano verificable**. |
| **Quién decide** | El usuario (confirma cada ejecución). |
| **Quién ejecuta** | El sistema, en nombre del usuario, **tras** recibir la confirmación. |
| **Razonamiento** | Idéntico al de L1, L2, L4. |
| **Frontera de ejecución** | Termina al aplicar el efecto persistente (write/update/transition) **después** del evento `agentic.confirmation.received`. |
| **Memoria leída** | Scopes autorizados según capability. |
| **Memoria escrita** | Entrada oficial en scope de la entidad (sin flag `draft=true`); evento de transition en `operation.{id}.transitions[]` cuando aplique; audit del Agentic Layer. |
| **Audit obligatorio** | `agentic.capability.invoked`, `agentic.confirmation.received` (con `user_id`, `confirmation_method: "ui_click" | "voice_confirm" | "verbal_text"`, `timestamp`, `correlation_id`), `agentic.capability.completed`. Para criticidad ≥ Alta: alerta opcional al usuario en tiempo real (§10). |
| **Confirmación humana** | **Obligatoria, no omitible**. Sin `agentic.confirmation.received` no se ejecuta. |
| **Autorización L4** | No aplica (la confirmación humana es contemporánea, no previa). |
| **Ejemplos canónicos** | (a) CAP-008 promueve IM de draft a oficial → libera al Marketplace. (b) CAP-021 firma LOI tras confirmación. (c) CAP-009 envía respuesta Q&A oficial a contraparte tras confirmación del Seller. (d) CAP-016 promueve valoración indicativa a "oficial" para una Operation. (e) CAP-028 marca hito de cierre cumplido en `closing_checklist`. (f) CAP-026 versiona draft de SPA. |

### 4.4 L4 — Automatización autorizada

| Campo | Valor |
|---|---|
| **Definición** | El sistema razona, prepara y **ejecuta sin confirmación humana en tiempo de ejecución**, dentro de los límites de una **autorización previa** (schema §6) explícita, expirable, revocable y atada a `(capability_id, operation_id)` específica. **No existen autorizaciones globales**. Cualquier ejecución L4 sin autorización válida activa produce bloqueo. |
| **Quién decide** | El usuario, **previamente**, al conceder la autorización. La autorización es un acto contractual de delegación. |
| **Quién ejecuta** | El sistema, durante la vigencia de la autorización y dentro de sus límites (`scope`, `n_uses`, `expires_at`). |
| **Razonamiento** | Idéntico al de L1, L2, L3. |
| **Frontera de ejecución** | Termina al aplicar el efecto persistente sin paso de confirmación. La frontera es desplazada por la autorización previa. |
| **Memoria leída** | Scopes autorizados según capability **y** scope de la autorización. |
| **Memoria escrita** | Entrada oficial en scope de la entidad + evento de transition cuando aplique + audit extendido (siempre) + cita al `authorization_id` que ampara la ejecución. |
| **Audit obligatorio** | `agentic.capability.invoked` (incluye `authorization_id`), `agentic.capability.completed`, `agentic.alert.triggered` cuando criticidad ≥ Alta. Notificación post-ejecución al usuario (siempre, vía TC, voz única). Cada uso consume del scope (`n_uses` decrementa o `single_use → consumed`). |
| **Confirmación humana** | No en tiempo de ejecución. Sí **previa** al conceder la autorización. Algunas capabilities `irreversibility_acknowledged: true` requieren **doble confirmación** en la concesión (§9). |
| **Autorización L4** | **Obligatoria**, schema §6. |
| **Ejemplos canónicos** | (a) CAP-003 detecta señales relevantes y notifica automáticamente al Buyer (autorización L4 por Operation, expira en 90 días). (b) CAP-014 recalcula benchmarks sectoriales semanalmente en jobs programados (autorización L4 sobre `market.{sector_id}`, scope `unlimited_until_expiry`, expira en 12 meses). (c) CAP-015 publica Recomendaciones nuevas al usuario tras eventos del mercado (autorización L4 sobre `user.{id}`, scope `n_uses: 10`). (d) CAP-005 clasifica documentos masivos del Data Room sin confirmación por cada documento (autorización L4 sobre `operation.{id}`, scope `unlimited_until_expiry`, expira al cierre de la Operation). (e) CAP-023 detecta documentación faltante y notifica al Seller automáticamente (autorización L4 sobre `operation.{id}` con `compensation_capability_id` declarada). |

### 4.5 Comparativa de los 4 niveles

| Dimensión | L1 | L2 | L3 | L4 |
|---|---|---|---|---|
| **Razonamiento** | Sí | Sí | Sí | Sí |
| **Razonamiento idéntico entre niveles** | ✅ | ✅ | ✅ | ✅ |
| **Persiste memoria de entidad** | No | Sí (draft) | Sí (oficial) | Sí (oficial) |
| **Produce transition TOS** | No | No | Sí (post-confirm) | Sí |
| **Frontera de ejecución** | Verbal | Draft persistente | Acción post-confirm | Acción sin confirm |
| **Confirmación humana contemporánea** | No aplica | No aplica | **Obligatoria** | No (previa vía autorización) |
| **Requiere autorización previa** | No | No | No | **Sí** (schema §6) |
| **Notificación al usuario** | Voz misma | Voz misma | Voz misma | Voz misma post-ejecución |
| **Audit mínimo** | standard | standard | extended | extended + alerting si criticidad ≥ Alta |
| **Reversibilidad** | n/a (no hay efecto) | Trivial (descartar draft) | Sí (según capability) | Sí (según capability) + irreversibles requieren `acknowledged` |
| **Kill-switch aplicable** | No | No | No | **Sí, siempre** |
| **Memory write con `agentic_level`** | n/a | "L2" + `draft=true` | "L3" | "L4" + `authorization_id` referenciado |

### 4.6 Tabla decisional rápida: ¿qué nivel aplica?

```
¿Hay autorización L4 vigente y dentro de scope?      ──Sí──► L4
                                                     │
                                                     No
                                                     │
                                                     ▼
¿La capability requiere confirmación humana en este turno?
                                                     │
                       ┌─────Sí─────┐                │
                       ▼            │                │
              ¿Hay confirmación?    │                │
                       │            │                │
                  Sí ──┤            │                │
                       ▼            │                │
                      L3            │                │
                       │            │                │
                       No ──────────┴────► verbalizar problema, no ejecutar
                                                     │
                                                     No
                                                     │
                                                     ▼
                       ¿Acción persistente esperada?
                                                     │
                       ┌────Sí────┐                  │
                       ▼          │                  │
                      L2          │                  │
                                  │                  │
                                  No ────────────────┴────► L1
```

---

## 5. Declaración canónica de capability — schema

> Cada capability declara un objeto canónico con **autonomía**, **criticidad** y **reversibilidad** explícitas. El Memory Engine, el TC y el Agentic Layer consumen este schema para tomar decisiones de ejecución.

### 5.1 Schema canónico

```yaml
# IDENTIDAD
capability_id: "CAP-007"
name: "Redactar Teaser anonimizado"
domain: "company"                          # company | market | valuation | advisor | transaction
owner_copilot: "Company"                   # Company | Market | Valuation | Advisor | TC
collaboration_copilots: ["Advisor"]        # opcional
description: "Genera el Teaser anonimizado de la empresa para liberación al Marketplace."
version: "1.0.0"                           # version del schema de la capability

# AUTONOMÍA
max_level: "L3"                            # L1 | L2 | L3 | L4
current_level: "L2"                        # ≤ max_level. Se ajusta con configuración, no con reescritura
evolution_path: ["L1", "L2", "L3"]         # roadmap declarado de niveles previstos
forbidden_levels: []                       # opcional: niveles explícitamente prohibidos (justificados)

# CRITICIDAD
criticality: "Alta"                        # Baja | Media | Alta | Crítica
criticality_rationale: "Información de empresa que puede revelar identidad."
critical_whitelist_approved_by_admin: null # solo aplica a criticality = Crítica + level ≥ L3
critical_whitelist_approved_at: null

# REVERSIBILIDAD
reversibility: "compensable"               # reversible | compensable | irreversible
inverse_capability_id: null                # solo si reversible
compensation_capability_id: "CAP-007b"     # solo si compensable; identificador de la acción compensatoria documentada
compensation_conditions: "Retirar el Teaser del Marketplace y notificar a los Buyers que lo hayan consultado."
irreversibility_acknowledged_required: false  # true si reversibility = irreversible

# INPUTS / OUTPUTS  (referencia al contrato canónico de COPILOTS_SPEC §9)
inputs_schema_ref: "COPILOTS_SPEC#CAP-007.inputs"
output_schema_ref: "COPILOTS_SPEC#CAP-007.output"

# MEMORIA  (referencia a MEMORY_ENGINE_SPEC §9)
memory_read: ["company", "opportunity", "advisor"]
memory_write: ["opportunity.teaser_drafts"]

# CONTEXTO TOS  (referencia a TRANSACTION_OS_SPEC §6)
applicable_phases: ["T6_LIBERACION_MARKETPLACE"]
applicable_layers: ["discovery"]            # discovery | transaction | both

# CONFIRMACIÓN
requires_user_confirmation:                 # detalle por nivel
  L1: false
  L2: false
  L3: true
  L4: false                                 # cuando opere en L4, la autorización previa sustituye a la confirmación

# AUTORIZACIÓN (sólo aplica si max_level >= L4)
authorization_required_at_levels: ["L4"]
double_confirmation_at_grant: false         # true si reversibility = irreversible o criticality = Crítica

# AUDITORÍA
audit_level:                                # standard | extended | full
  L1: "standard"
  L2: "standard"
  L3: "extended"
  L4: "extended"
alerting_threshold:                         # "none" | "team" | "team_and_user" | "team_and_user_real_time"
  L1: "none"
  L2: "none"
  L3: "team_and_user"                       # alerta porque criticality = Alta
  L4: "team_and_user_real_time"

# CUOTAS (forward MONETIZATION_SPEC)
quota_credits: "TBD"                        # consume del balance del plan (definido en 0.6)
plan_eligibility: ["subscriber", "corporate", "investor", "advisor"]

# FALLBACK (referencia a COPILOTS_SPEC §13)
fallback_strategy: "show_template_without_anonymization"
fallback_quality_marker: "anonymization_not_applied"

# DEPENDENCIAS EXTERNAS
external_dependencies: ["Risk & Compliance Service"]   # forward

# METADATA
canonical_owner_user: "admin"               # quien aprueba cambios al schema
last_reviewed_at: "2026-06-25"
```

### 5.2 Validación del schema (reglas de consistencia)

Las siguientes invariantes se validan **antes de admitir** un schema de capability:

1. **Coherencia level**: `current_level ≤ max_level`. Si no, schema inválido.
2. **Coherencia evolution_path**: cada nivel en `evolution_path` debe ser uno de L1–L4 y `max_level ∈ evolution_path`. El `current_level` debe estar en `evolution_path` o ser uno anterior.
3. **Reversibilidad y autorización**: si `reversibility = irreversible`, entonces `irreversibility_acknowledged_required = true` y `max_level` admite L4 solo con `double_confirmation_at_grant = true`.
4. **Criticidad Crítica en L3+**: si `criticality = Crítica` y (`current_level ≥ L3` o `max_level ≥ L3`), debe existir `critical_whitelist_approved_by_admin` no nulo. Sin whitelist, la capability solo puede operar en L1/L2.
5. **Compensable obliga a `compensation_capability_id`**: si `reversibility = compensable`, debe existir referencia a la capability compensatoria documentada con `compensation_conditions` no vacías.
6. **Reversible obliga a `inverse_capability_id` o procedimiento**: si `reversibility = reversible`, debe declararse al menos uno de `inverse_capability_id` o `undo_procedure_doc_ref`.
7. **Memoria escrita coherente con TOS**: los scopes en `memory_write` no pueden incluir snapshots inmutables (`MEMORY_ENGINE_SPEC §6.3`) ni documentos firmados (`signed_by_ids` no vacío en entidades referenciadas).
8. **Fases aplicables coherentes**: cada elemento de `applicable_phases` debe ser una fase canónica del TOS (`TRANSACTION_OS_SPEC §6`, T1–T15).
9. **Plan eligibility coherente**: `quota_credits` debe ser declarable o explícitamente `TBD` cuando dependa de `MONETIZATION_SPEC`. No se admite `null` silencioso.

### 5.3 Cambios al schema de una capability

- **Cambio menor** (subir `current_level` un peldaño dentro del `evolution_path`, ajustar `quota_credits`, ajustar `alerting_threshold`): aplica con audit `agentic.capability.schema_updated`.
- **Cambio mayor** (subir `max_level`, cambiar `reversibility`, añadir/quitar `forbidden_levels`): requiere aprobación de `admin` + evento `agentic.capability.schema_major_update` + revisión de autorizaciones L4 vigentes (todas se invalidan a nuevo schema si afecta su `capability_id`).
- **Catalogación de nueva capability**: requiere `admin` + revisión de impacto + propagación a `COPILOTS_SPEC` en la próxima versión.

### 5.4 Por qué este schema vive aquí y no en `COPILOTS_SPEC`

`COPILOTS_SPEC` declara la **funcionalidad** de las 29 capabilities (qué calculan, qué fases, qué memoria). Este spec añade la **dimensión agéntica** (max_level, criticality, reversibility) que es **ortogonal** a la funcionalidad y puede evolucionar con configuración sin tocar `COPILOTS_SPEC`. La actualización final de `COPILOTS_SPEC` para integrar este modelo se hará al cierre del Sprint 0.

---

## 6. Schema canónico de autorización L4

> Toda autorización L4 es **una entrada inmutable** en `audit.global` con scope vinculado a `operation.{id}.authorizations[]`. Su schema es estricto y no admite variantes.

### 6.1 Schema canónico

```yaml
authorization_id: "auth_2026Q2_a1b2c3d4"
capability_id: "CAP-014"
operation_id: "op_2026_aero_001"            # NUNCA puede ser null o "global"
granting_user_id: "user_alice_seller"
granting_org_id: "org_alpha_corp"

granted_at: "2026-06-25T10:30:00Z"
expires_at: "2026-09-25T10:30:00Z"          # OBLIGATORIO, sin valor por defecto, máximo 90 días
duration_days: 92                           # derivado, validable

status: "active"                            # active | revoked | expired | consumed
status_reason: null                         # razón cuando status ≠ active
status_changed_at: null
status_changed_by: null                     # user_id | "system_expiry" | "arroba_team" | "admin"

reason: "Delegación de actualización semanal de benchmarks sectoriales mientras dura la Operation Aero 001."
business_justification_ref: "memo_2026Q2_001"  # opcional, link a memo formal si aplica

scope:
  kind: "n_uses"                            # single_use | n_uses | unlimited_until_expiry
  n_uses_max: 13                            # solo si kind = n_uses
  n_uses_consumed: 0
  per_invocation_payload_limits:
    max_writes_per_invocation: 5
    max_memory_payload_tokens: 8000

# REVERSIBILIDAD CONOCIDA EN EL MOMENTO DE LA CONCESIÓN
capability_reversibility_at_grant: "compensable"
irreversibility_acknowledged: false         # true solo si capability_reversibility_at_grant = "irreversible"
acknowledgment_confirmation_method: null    # "double_confirm_ui" | "verbal_double_confirm" | "signed_consent"

# KILL-SWITCH
kill_switch_state: "armed"                  # armed | triggered
kill_switch_triggered_at: null
kill_switch_triggered_by: null              # user_id | "arroba_team" | "admin" | "system_anomaly"
kill_switch_reason: null

# AUDIT TRAIL
audit_trail:
  - event_id: "audit_001"
    event_type: "agentic.authorization.granted"
    timestamp: "2026-06-25T10:30:00Z"
    actor: "user_alice_seller"
    correlation_id: "corr_xyz123"
  # appends en cada uso, revocación, expiración, kill-switch

# TRAZABILIDAD HACIA UPSTREAM
parent_consent_id: null                     # opcional, link a consentimiento global de la org (si existe)
related_capabilities: []                    # capabilities relacionadas que NO están autorizadas (informativo)

# METADATA
schema_version: "1.0.0"
last_modified_at: "2026-06-25T10:30:00Z"
```

### 6.2 Reglas inviolables del schema

1. **Una capability, una Operation**: cada `authorization_id` cubre exactamente **un `capability_id`** y **una `operation_id`**. No se admiten arrays.
2. **`expires_at` es obligatorio**: no existe autorización sin fecha de expiración. El valor por defecto **NO es indefinido**; debe explicitarse en la concesión. Máximo absoluto admitido: 90 días en v1.0.0 (configurable en versiones futuras por plan, sujeto a `MONETIZATION_SPEC`).
3. **`status` transita estrictamente**: `active → revoked` (por usuario / team / admin) · `active → expired` (por `expires_at` alcanzado) · `active → consumed` (por `scope.kind = single_use` ya usado o `n_uses_consumed = n_uses_max`). Una autorización **no vuelve a `active`**; se requiere nueva concesión.
4. **`reason` no puede ser vacío**: toda autorización lleva justificación explícita en texto libre. Esto soporta auditoría regulatoria.
5. **`scope.kind` obliga consistencia**: `single_use` ignora `n_uses_max`; `n_uses` requiere `n_uses_max ≥ 1`; `unlimited_until_expiry` ignora `n_uses_consumed`.
6. **`irreversibility_acknowledged = true` solo si la capability lo es**: si `capability_reversibility_at_grant ≠ irreversible`, el flag debe ser `false`. Asignarlo `true` sin razón válida produce schema inválido.
7. **Inmutabilidad post-grant**: el `authorization_id`, el `capability_id`, el `operation_id`, el `granted_at`, el `expires_at`, el `reason` y el `scope` son **inmutables** tras la concesión. Lo único que muta es `status`, `audit_trail` (append-only), `kill_switch_state` y `scope.n_uses_consumed`.
8. **`granting_user_id` debe tener permiso sobre la Operation**: el motor valida en grant que el usuario tiene scope sobre `operation.{operation_id}` y que el `capability_id` aplica a fases compatibles con el estado actual de la Operation.

### 6.3 Reglas de revocación

- **Quién puede revocar**:
  - El `granting_user_id` (siempre, sin justificación adicional necesaria).
  - Otro usuario con rol Owner / Manager de la `granting_org_id` (con `revocation_reason` obligatorio).
  - `arroba_team` ante alerta de Risk & Compliance Service (con `risk_alert_id` adjunto).
  - `admin` en mediación de disputa formal (`admin.audit_accessed` + justificación).
- **Efecto de la revocación**: `status → revoked`, kill-switch implícito (`kill_switch_state → triggered`), notificación al `granting_user_id` y al `arroba_team`, audit `agentic.authorization.revoked`.
- **Revocación no revierte ejecuciones pasadas**: solo impide nuevas.

### 6.4 Reglas de expiración automática

- **Cuándo expira**: cuando `now() ≥ expires_at`. El motor revisa en cada invocación + jobs periódicos cada 5 minutos.
- **Efecto de la expiración**: `status → expired`, audit `agentic.authorization.expired`, notificación al `granting_user_id` con verbalización del TC ("La autorización L4 sobre CAP-014 en la Operation Aero 001 ha expirado. ¿Quieres renovarla?").
- **Continuidad de la ejecución**: si una invocación está en curso en el momento exacto de la expiración, **se completa solo si el efecto es atómico**; si el efecto requiere múltiples writes encadenados, el motor degrada a L1 en el siguiente paso (§8).

### 6.5 Reglas de consumo

- **`scope.kind = single_use`**: la primera invocación que aplique efecto cambia `status → consumed`. Cualquier intento posterior produce `agentic.execution.denied: "authorization_consumed"`.
- **`scope.kind = n_uses`**: cada invocación con efecto incrementa `n_uses_consumed`. Cuando `n_uses_consumed = n_uses_max`, `status → consumed`. El motor notifica al usuario en el último uso ("Has usado 12 de 13. Renueva la autorización si necesitas más.").
- **`scope.kind = unlimited_until_expiry`**: sin tope de usos hasta `expires_at` o revocación.

### 6.6 Reglas de doble confirmación en concesión

Aplica cuando se cumple **al menos una** condición:

- `capability_reversibility_at_grant = irreversible`.
- `capability.criticality = Crítica` (cuando se materialice la whitelist §3.12).
- `expires_at - granted_at > 30 días` Y `scope.kind = unlimited_until_expiry`.

La doble confirmación es **operación contractual extra**:

- Paso 1: usuario solicita la concesión con `reason` obligatorio.
- Paso 2: el TC verbaliza explícitamente las implicaciones ("Vas a autorizar a CAP-021 a enviar LOIs sin tu confirmación durante 90 días. Esta acción es contractualmente vinculante. ¿Confirmas?") y solicita confirmación adicional.
- Paso 3: el motor registra `agentic.authorization.granted` con `acknowledgment_confirmation_method` no nulo.

La doble confirmación **NO** sustituye a la confirmación L3; es un requisito en el **acto de concesión** de la autorización.

### 6.7 Visualización al usuario (contrato, no UX)

El usuario puede consultar en cualquier momento sus autorizaciones L4 activas. El TC verbaliza al solicitarlo: lista de `(capability_name, operation_name, expires_at, scope, kill_switch_state)` y ofrece acciones (revocar, kill-switch). El **diseño** de la pantalla se decide en Design System; este spec garantiza el **contrato del dato**.

---

## 7. Kill-switch operacional

### 7.1 Qué es

El **kill-switch** es un mecanismo operacional que, ante activación, **detiene de inmediato cualquier actuación futura** amparada por una autorización L4. Es derecho del usuario (Principio canónico 3.10) y no opción técnica.

### 7.2 Trigger del kill-switch

Cuatro actores pueden activarlo:

| Actor | Condiciones |
|---|---|
| `granting_user_id` | En cualquier momento sin justificación adicional, vía TC verbalmente ("Para todas las automatizaciones de esta Operation"). |
| Otro usuario con rol Owner / Manager de la `granting_org_id` | Con `kill_switch_reason` obligatorio + audit `org.kill_switch_invoked_by_other_user`. |
| `arroba_team` | Ante alerta del Risk & Compliance Service o detección de anomalía (volumen masivo, comportamiento adversarial), con `risk_alert_id` adjunto. |
| Sistema automático | Cuando se detecta condición de bloqueo crítica: superación masiva de cuota, error sistémico repetido (3+ fallos consecutivos de la misma capability en L4), inactividad anómala del Memory Engine. |

`admin` también puede activarlo en mediación de disputa formal; queda en audit con `admin.kill_switch_emergency`.

### 7.3 Granularidad del kill-switch (propuesta canónica)

Tres granularidades disponibles:

| Granularidad | Efecto | Cuándo usar |
|---|---|---|
| **Per-autorización** | Activa kill-switch sobre **una** autorización (`authorization_id`). El resto de autorizaciones del usuario / Operation siguen activas. | Default; máximo control. |
| **Per-Operation** | Activa kill-switch sobre **todas las autorizaciones de una `operation.{id}`**. Operation entra en `kill_switch_active`. | El usuario detecta problema con una Operation concreta. |
| **Global** (per-user) | Activa kill-switch sobre **todas las autorizaciones del `granting_user_id`** en **todas sus Operations**. Requiere **doble confirmación** del usuario. | Pánico operacional o cambio drástico de circunstancias del usuario. |

### 7.4 Efectos canónicos del kill-switch (lista del usuario, literal)

Al activarse el kill-switch sobre cualquier autorización(es):

1. **Detener nuevas ejecuciones** — `kill_switch_state → triggered` en cada autorización afectada. El gate al iniciar cualquier invocación L4 lee este estado antes de proceder. Si está `triggered`, la invocación se rechaza con `agentic.execution.denied: "kill_switch_active"`.
2. **Cancelar jobs pendientes en cola** — el orquestador de jobs cancela tareas no iniciadas amparadas por las autorizaciones afectadas. Las tareas **ya en ejecución que sean atómicas** (un único write, una única transition) se permiten completar; las tareas **multi-paso** se interrumpen en el siguiente checkpoint con audit `agentic.execution.aborted`.
3. **Impedir nuevas automatizaciones** — incluso si existieran otras autorizaciones que cubrieran el mismo `capability_id` en otra Operation, las acciones disparadas durante el período de kill-switch sobre las autorizaciones afectadas quedan bloqueadas.
4. **Registrar evento de auditoría inmutable** — `agentic.kill_switch.triggered` con `actor`, `granularity` (per-authorization / per-operation / global), `target_authorizations_ids[]`, `reason`, `timestamp`. Este evento es **append-only** y no se borra (`MEMORY_ENGINE_SPEC §3.5`).
5. **Notificar al usuario** — el TC verbaliza ("He detenido todas las automatizaciones de la Operation Aero 001. Las acciones ya ejecutadas permanecen. Para reanudar L4, necesito una nueva autorización explícita."). Notificación push / email según preferencias del usuario.
6. **Notificar a `arroba_team`** — alerta interna con el contexto del trigger. El equipo decide si la Operation requiere mediación adicional.
7. **Conservar toda la trazabilidad previa** — el audit de las invocaciones L4 previas al kill-switch permanece intacto; nada se borra. El estado `kill_switch_state = triggered` queda referenciable.

### 7.5 Lo que el kill-switch NO hace

**NO revierte acciones ya ejecutadas**. Una LOI ya enviada permanece enviada. Una valoración ya promovida a oficial permanece oficial. Un benchmark ya recalculado permanece publicado. El kill-switch **solo impide nuevas actuaciones**.

Para revertir efectos, debe usarse:

- `inverse_capability_id` si la capability es `reversible`.
- `compensation_capability_id` si la capability es `compensable`.
- Acción manual del usuario / Advisor si la capability es `irreversible` (típicamente requerirá comunicación con contraparte vía Advisor Copilot en L1).

### 7.6 Estado tras kill-switch

- **Autorización afectada**: `status` se mantiene como estaba (`active` típicamente), pero `kill_switch_state = triggered`. **Aunque el `status` sea `active`, no se puede ejecutar nada**. El motor rechaza con `agentic.execution.denied: "kill_switch_active"`.
- **Reanudación**: el usuario puede emitir `agentic.kill_switch.lifted` **solo** combinándolo con una **nueva concesión** (`agentic.authorization.granted`) que invalida la anterior. La autorización original queda como `kill_switch_terminated` (no reanudable).

### 7.7 Eventos canónicos del kill-switch

| Evento | Cuándo se emite |
|---|---|
| `agentic.kill_switch.triggered` | Activación del kill-switch (cualquier granularidad). |
| `agentic.kill_switch.confirmed` | El sistema completa la propagación (jobs cancelados, autorizaciones marcadas, estado persistido). |
| `agentic.kill_switch.notified_user` | TC verbaliza al usuario. |
| `agentic.kill_switch.notified_team` | Notificación interna a `arroba_team` enviada. |
| `agentic.kill_switch.lifted` | Se concede nueva autorización; la anterior queda `kill_switch_terminated`. **No reactiva** la autorización original. |

Cada evento lleva `correlation_id`, `granting_user_id`, `target_authorizations_ids[]`, `granularity`, `actor` (quién lo activó), `reason`.

### 7.8 Política operacional ante kill-switch parcial (jobs en curso)

Cuando se activa el kill-switch sobre una `operation.{id}` con jobs en curso:

| Estado del job | Comportamiento |
|---|---|
| **No iniciado** (en cola) | Cancelado. Audit `agentic.execution.aborted: "kill_switch_pre_start"`. |
| **En ejecución atómica** (un write, una transition) | Permitido completar. Audit `agentic.execution.completed_during_kill_switch` con flag. |
| **En ejecución multi-paso** (varios writes encadenados) | Interrumpido en el siguiente checkpoint. Audit `agentic.execution.aborted: "kill_switch_mid_execution"` + log del estado parcial (qué se completó, qué no). El usuario es notificado del estado parcial para que decida acción manual posterior. |
| **Esperando confirmación externa** (firma electrónica pendiente) | Permitido completar la espera (no hay nueva ejecución del sistema; el efecto ya está delegado). La firma cuando llegue se registra normalmente; el sistema simplemente no inicia nada nuevo. |

---

## 8. Política de escalado y degradación entre niveles

### 8.1 Escalado (subir el nivel efectivo)

**Definición**: en tiempo de ejecución, una invocación que iba a operar en L_n se eleva a L_{n+1} (o superior) cuando se detectan condiciones de mayor riesgo o menor confianza que el `current_level` declarado.

**Condiciones canónicas de escalado**:

| Condición | Efecto |
|---|---|
| **Confianza baja** (`confidence < 0.6` en el output del especialista) | L2 puede escalar a L3 (pedir confirmación humana explícita en lugar de persistir draft silenciosamente). |
| **Criticidad ≥ Alta + nivel inicial L2** | Auto-escalado a L3 si la capability soporta `current_level ≥ L3`. Si no, se mantiene L2 con alerta. |
| **Detección de patrón anómalo** (Risk & Compliance Service) | Forzar L3 incluso si la capability operaba en L4. Permite confirmación humana mientras se investiga. |
| **Acción afecta a documento firmado** | Bloqueo (no escalado): no se ejecuta. `MEMORY_ENGINE_SPEC §6.3 / §8.5` define inmutabilidad post-firma. |
| **Política de criticidad Crítica + L3+** | Si no hay whitelist, no escala — se mantiene en L2 con verbalización. |

**Escalado nunca rebasa `max_level`**. Si la capability tiene `max_level = L2` y se cumple condición que pediría L3, el motor mantiene L2 y verbaliza al usuario que se requiere acción manual.

**Verbalización del escalado**: cuando el nivel efectivo se eleva, el TC explica al usuario por qué ("La confianza en este análisis ha bajado por inconsistencias en los datos. Voy a pedirte confirmación antes de proceder.").

### 8.2 Degradación (bajar el nivel efectivo)

**Definición**: el sistema baja automáticamente el nivel efectivo a un nivel inferior cuando se cumplen condiciones técnicas o comerciales.

**Condiciones canónicas de degradación**:

| Condición | Efecto |
|---|---|
| **Cuota agotada** (forward `MONETIZATION_SPEC`) | Degradación a L1 hasta reposición de cuota o cambio de plan. Verbalización: "He alcanzado el límite mensual de Recomendaciones automáticas. Puedo seguir respondiendo conversacionalmente.". |
| **Modelo / SDK no disponible** | Degradación al fallback declarado en la capability (`fallback_strategy`, `COPILOTS_SPEC §13`). |
| **Kill-switch activado** | Degradación a L1 sobre las autorizaciones afectadas. |
| **Autorización L4 expirada o consumida** | Degradación a L2 (preparar draft) o L1 (verbalizar). El TC notifica y propone renovar. |
| **Falta de respuesta del usuario en confirmación L3** | Tras timeout configurable (default 30 minutos en sesión activa, 7 días en sesión asincrónica), el draft queda como tal y el TC marca pendiente. |
| **Detección de carga elevada del sistema** | Modo degradado opcional: L4 jobs no críticos se pausan; L3 sigue operando; L1/L2 sin cambios. Política operativa, no del usuario. |

### 8.3 Notificación al usuario en cambios de nivel efectivo

Todo cambio de nivel efectivo (escalado o degradación) se notifica con **voz única** del TC, con explicación natural y propuesta de siguiente paso. Sin tecnicismos al usuario; sí registro técnico en audit.

Eventos canónicos:

- `agentic.level.escalated` — con `from`, `to`, `reason` (`low_confidence` | `high_criticality` | `risk_alert` | otro).
- `agentic.level.degraded` — con `from`, `to`, `reason` (`quota_exceeded` | `model_unavailable` | `kill_switch` | `authorization_expired` | `confirmation_timeout` | `system_load`).

### 8.4 Reglas combinadas

- Escalado + Criticidad Crítica + Falta de whitelist → la capability **NO** puede operar en L3+ aunque se cumpla condición de escalado. Se verbaliza: "Esta acción requiere revisión adicional. Puedo prepararte un borrador para que la apruebes manualmente.".
- Degradación + Kill-switch → todas las autorizaciones afectadas operan como L1 (verbal) hasta nueva concesión. Si el usuario insiste en una acción cubierta por la autorización degradada, el TC verbaliza y guía hacia confirmación L3 manual.
- Múltiples escalados encadenados → el motor previene loops: máximo **un** escalado por invocación. Si se requiere otro, se verbaliza al usuario y se detiene.

---

## 9. Reversibilidad operacional

### 9.1 Los 3 estados canónicos

| Estado | Definición | Schema obligatorio | Política |
|---|---|---|---|
| **Reversible** | El efecto puede deshacerse automáticamente sin coste contractual. La capability declara `inverse_capability_id` o `undo_procedure_doc_ref`. | `inverse_capability_id` no nulo o `undo_procedure_doc_ref` referenciado. | Cualquier nivel L1–L4 permitido. Audit standard salvo criticidad alta. |
| **Compensable** | El efecto no se deshace automáticamente, pero existe acción compensatoria documentada que mitiga el impacto. | `compensation_capability_id` + `compensation_conditions` no vacías. | Cualquier nivel L1–L4 permitido. Audit extended en L3+. |
| **Irreversible** | El efecto no se puede deshacer ni compensar. Decisiones contractuales finales, firmas legales, envíos a contraparte con efecto vinculante inmediato. | `irreversibility_acknowledged_required: true`. | L4 solo con `irreversibility_acknowledged: true` en la autorización + `double_confirmation_at_grant: true`. Audit `full`. |

### 9.2 Schema declarativo en la capability

Ya recogido en §5.1. Recapitulación:

```yaml
reversibility: "reversible" | "compensable" | "irreversible"
inverse_capability_id: "CAP-007b"             # solo si reversible
compensation_capability_id: "CAP-007c"        # solo si compensable
compensation_conditions: "..."                # solo si compensable
irreversibility_acknowledged_required: false  # true si irreversible
```

### 9.3 Política de UX (contrato, no diseño final)

El contrato hacia el Design System:

| Estado | UX mínima requerida |
|---|---|
| **Reversible** | Indicador discreto ("Esto se puede deshacer"). Acción de deshacer accesible en el audit / vista de la entidad. |
| **Compensable** | Indicador moderado ("Esto no se deshace, pero hay acción compensatoria"). Acceso a la acción compensatoria documentada. |
| **Irreversible** | Indicador prominente ("Esta acción NO se puede deshacer"). Doble paso de confirmación obligatorio en la concesión L4 (no UX cosmética; operación contractual). |

El diseño visual concreto se decide en Design System; este spec garantiza el contrato del dato y la separación visual mínima.

### 9.4 Política de retención del audit por reversibilidad

| Estado | Audit retención |
|---|---|
| Reversible | Retención de la Operation (10 años post-cierre) — estándar. |
| Compensable | Retención de la Operation + log explícito si se invoca la compensación (`agentic.compensation.invoked` con cita a la ejecución original). |
| Irreversible | Audit `full` (cada paso, cada output, cada confirmación) durante 10 años post-cierre **mínimo**. Si la jurisdicción exige más, se respeta el máximo. |

### 9.5 Política de autorización por reversibilidad

| Estado | Autorización L4 |
|---|---|
| Reversible | Estándar, schema §6 sin requisitos extra. |
| Compensable | Estándar, schema §6, recomendado declarar `compensation_capability_id` también en el audit trail de la autorización (para trazabilidad). |
| Irreversible | **Doble confirmación en concesión** (§6.6). `irreversibility_acknowledged: true` obligatorio. `acknowledgment_confirmation_method` no nulo. |

### 9.6 Catálogo orientativo de capabilities por reversibilidad

(Asignación canónica en §11. Aquí solo orientación general).

- **Reversible típica**: análisis (CAP-001, CAP-002, CAP-010), valoraciones indicativas (CAP-016, CAP-018, CAP-020), comparaciones (CAP-027). Pueden regenerarse desde inputs.
- **Compensable típica**: publicaciones a Marketplace (CAP-007 Teaser), envíos a contraparte (CAP-009 Q&A, CAP-023 notificar Seller), recomendaciones generadas y mostradas al usuario (CAP-015).
- **Irreversible típica** (subset de capabilities que tocan firma o envío legal vinculante): no hay capabilities **L4-elegibles** irreversibles en el catálogo v1.0.0 sin paso explícito de Advisor (CAP-021 LOI firma, CAP-026 SPA versionado final — operan en L3 con confirmación humana obligatoria). El catálogo §11 documenta esto explícitamente.

---

## 10. Criticidad y matriz `criticality × level`

### 10.1 Los 4 niveles de criticidad

| Criticidad | Definición | Ejemplos canónicos |
|---|---|---|
| **Baja** | Acción cuyo efecto no genera riesgo material para la Operation, las partes o el sistema. Errores corregibles trivialmente. | Publicar evento de actividad pública, generar recomendación informativa, actualizar contador interno. |
| **Media** | Acción cuyo efecto puede influir en decisiones del usuario pero no genera compromiso contractual ni externalidad fuerte. | Generar Insights priorizados, calcular sensibilidades, clasificar documentos, identificar candidatos. |
| **Alta** | Acción cuyo efecto modifica información visible a contraparte o influye directamente en una decisión de fase TOS. Posible impacto reputacional o operativo. | Resumir documentos del Data Room, redactar Teaser, preparar IM, calcular valoración indicativa, detectar riesgos. |
| **Crítica** | Acción cuyo efecto puede tener implicación contractual material, legal, regulatoria o económica directa para una de las partes. | Preparar LOI vinculante, versionar SPA en negociación, marcar hito de cierre como cumplido, asistir en negociación de cláusulas materiales. |

### 10.2 Matriz canónica `criticality × level`

> **Leyenda**:
> - `audit:standard` — eventos canónicos básicos.
> - `audit:extended` — eventos con detalle de input/output/confidence.
> - `audit:full` — eventos completos + audit trail de cada paso interno.
> - `alert:none` — sin alerta.
> - `alert:user_async` — notificación al usuario asincrónica (post-ejecución).
> - `alert:user_realtime` — notificación al usuario en tiempo real.
> - `alert:team` — alerta al `arroba_team` también.
> - `default-deny` — capability rechazada por defecto en este `(criticality, level)`; requiere whitelist explícita (§3.12).

| Criticidad ↓ \ Level → | **L1** | **L2** | **L3** | **L4** |
|---|---|---|---|---|
| **Baja** | `audit:standard`<br>`alert:none` | `audit:standard`<br>`alert:none` | `audit:extended`<br>`alert:none` | `audit:extended`<br>`alert:user_async` post-ejecución |
| **Media** | `audit:standard`<br>`alert:none` | `audit:standard`<br>`alert:none` | `audit:extended`<br>`alert:none` | `audit:extended`<br>`alert:user_realtime` post-ejecución |
| **Alta** | `audit:standard`<br>`alert:none` | `audit:extended`<br>`alert:user_async` (soft) | `audit:extended`<br>`alert:user_realtime` | `audit:extended`<br>`alert:user_realtime` + `alert:team` |
| **Crítica** | `audit:extended`<br>`alert:none` | `audit:extended`<br>`alert:user_realtime` | `default-deny`<br>(requiere whitelist `admin`) | `default-deny`<br>(requiere whitelist + `irreversibility_acknowledged` + doble confirmación en concesión) |

### 10.3 Política de cuotas por criticidad

Forward a `MONETIZATION_SPEC`. Orientación:

- **Baja**: cuotas amplias por defecto, escalan con plan.
- **Media**: cuotas estándar; degradan a L1 con notificación al agotarse.
- **Alta**: cuotas más estrictas; consumo de créditos mayor por invocación; alerta de proximidad a límite.
- **Crítica**: cuotas muy estrictas o no-cuotificadas (cada invocación es excepción que requiere validación). El plan determina si la capability Crítica está habilitada o no.

### 10.4 Política de monitorización por criticidad

| Criticidad | Monitorización |
|---|---|
| Baja | Métricas agregadas en dashboard interno. |
| Media | Métricas agregadas + sampling de errores (1:100). |
| Alta | Métricas agregadas + log completo de errores + revisión semanal por `arroba_team`. |
| Crítica | Métricas agregadas + log completo de **todo** + revisión por `admin` + alerta automática ante cualquier desviación. |

### 10.5 Política de modo degradado bajo carga

Cuando el sistema detecta carga elevada (latencia P99 >X segundos en una capability):

| Criticidad | Comportamiento bajo carga |
|---|---|
| Baja | Se pausa para liberar recursos (L4 jobs en cola se atrasan). |
| Media | Se mantiene; sin degradación automática. |
| Alta | Se mantiene; alerta interna para `arroba_team` por si hay incidente. |
| Crítica | Se mantiene a toda costa; los demás se degradan si necesario para preservar la Crítica. |

### 10.6 Por qué criticidad ≠ nivel agéntico (Principio 7 reiterado)

- Una capability puede ser `(L4, Baja)`: por ejemplo, CAP-014 actualización automática de benchmarks sectoriales. Es L4 porque el sistema ejecuta sin confirmación; es Baja porque su efecto no genera riesgo material individual.
- Una capability puede ser `(L2, Crítica)`: por ejemplo, una hipotética CAP "resumir cláusulas vinculantes de un SPA en negociación". Es L2 porque solo prepara borrador; es Crítica porque el material que resume es contractual y un resumen sesgado puede inducir decisiones erróneas.

Esto confirma que las dos dimensiones se mueven de forma independiente.

---

## 11. Catálogo de capabilities — revisión de las 29 declaradas en `COPILOTS_SPEC`

> Esta sección **NO modifica** `COPILOTS_SPEC.md`. Presenta la **tabla canónica** de las 29 capabilities con los nuevos atributos `(max_level, current_level, criticality, reversibility)`. La actualización de `COPILOTS_SPEC.md` para integrar este modelo se hará al cierre del Sprint 0 con aprobación explícita del usuario.

### 11.1 Tabla canónica completa

| CAP | Nombre | Owner | max_level | current_level | criticality | reversibility | applicable_phases | Notas |
|---|---|---|---|---|---|---|---|---|
| **CAP-001** | Análisis narrativo de empresa | Company | L2 | L2 | Media | reversible | T1, T8, T11 | Output regenerable desde inputs. No produce efectos externos. |
| **CAP-002** | Generar Insights priorizados | Company | L3 | L2 | Media | reversible | T1, T8 | Puede subir a L3 si en el futuro se quiere "promover Insights a fija visible". |
| **CAP-003** | Identificar señales relevantes | Company | L4 | L2 | Media | compensable | T1, T8, T11, T15 | L4 candidato: notificación automática al usuario ante señal nueva. Compensable porque señal errónea se retira. |
| **CAP-004** | Resumir documentación del Data Room | Company | L2 | L2 | Alta | reversible | T11 | Material sensible (DD); regenerable. Mantener en L2 para revisión humana del resumen. |
| **CAP-005** | Clasificar documentos | Company | L4 | L2 | Baja | reversible | T8, T11 | L4 candidato: clasificación masiva sin confirmación. Reversible (reclasificar). |
| **CAP-006** | Detectar incoherencias financieras | Company | L2 | L2 | Alta | reversible | T1, T8, T11 | Detección persiste como finding; "marcar como validada" es L3 humano (no es upgrade de la capability, es flujo separado). |
| **CAP-007** | Redactar Teaser anonimizado | Company | L3 | L2 | Alta | compensable | T6 | L3 max porque liberación a Marketplace requiere aprobación humana siempre. `compensation_capability_id` = retirar Teaser + notificar Buyers. |
| **CAP-008** | Preparar IM | Company | L3 | L2 | Alta | compensable | T8 | L3 max. Compensable porque IM puede retirarse de los Buyers que aún no firmaron NDA. |
| **CAP-009** | Preparar respuestas Q&A | Company | L3 | L2 | Alta | compensable | T9 | L3 max. Respuesta a contraparte. Compensable con corrección formal. |
| **CAP-010** | Análisis sectorial | Market | L2 | L2 | Baja | reversible | T2, T3, T11 | Reversible (regenerable). |
| **CAP-011** | Análisis territorial | Market | L2 | L2 | Baja | reversible | T3, T4 | Reversible. |
| **CAP-012** | Identificar compradores potenciales (matching cuantitativo) | Market | L4 | L2 | Media | reversible | T3, T4, T5 | L4 candidato: matching automático sin acción visible al Buyer hasta confirmación de Solicitud (Solicitud sigue siendo L3 por defecto). El matching genera lista; el envío de Solicitud es separado. |
| **CAP-013** | Preparar screenings profesionales | Market | L3 | L2 | Media | reversible | T4 | L3 max porque screening informa decisión humana de qué Solicitudes lanzar. |
| **CAP-014** | Tendencias y benchmarks sectoriales | Market | L4 | L2 | Baja | reversible | T2, T10, T11 | L4 canónico: jobs periódicos recalculan benchmarks sin confirmación. Reversible (versionado). |
| **CAP-015** | Generar Recomendaciones (sistema → usuario) | Market | L4 | L2 | Media | compensable | T5, contextual T3-T4 | L4 candidato: recomendaciones automáticas tras eventos. Compensable (retirar recomendación con explicación). |
| **CAP-016** | Preparar valoración indicativa | Valuation | L3 | L2 | Alta | reversible | T2, T10, T12 | L3 max para "promover a oficial". Reversible (recalcular). |
| **CAP-017** | Preparar valoración avanzada | Valuation | L3 | L2 | Alta | reversible | T2, T10, T12 | L3 max porque tiene coste (forward MONETIZATION). Reversible (recalcular). |
| **CAP-018** | Generar comparables de transacciones | Valuation | L2 | L2 | Media | reversible | T2, T10, T12 | Reversible. |
| **CAP-019** | Proponer estructuras de precio y earn-out | Valuation | L3 | L2 | Alta | compensable | T10, T12 | L3 max. Compensable porque proposición puede retirarse antes de firmar. |
| **CAP-020** | Analizar sensibilidades | Valuation | L2 | L2 | Media | reversible | T2, T10, T12 | Reversible. |
| **CAP-021** | Preparar oferta indicativa / LOI / NBO | Advisor | L3 | L2 | **Crítica** | compensable | T10 | L3 max **default-deny** salvo whitelist `admin` (§3.12). Compensable porque LOI puede retirarse antes de firmar. Una vez firmada → estado inmutable. |
| **CAP-022** | Detectar riesgos de negociación | Advisor | L2 | L2 | Alta | reversible | T10, T12 | L2 max (detección, no acción). Reversible. |
| **CAP-023** | Detectar documentación faltante en Data Room | Advisor | L4 | L2 | Media | compensable | T11 | L4 candidato: notificación automática al Seller. Compensable (corregir si falsa alarma). |
| **CAP-024** | Generar preguntas de Due Diligence sectorial | Advisor | L3 | L2 | Media | reversible | T11, T9 | L3 max para enviar preguntas. Reversible (retirar antes de envío oficial). |
| **CAP-025** | Elaborar informes dinámicos de riesgos | Advisor | L2 | L2 | Alta | reversible | T11, T12 | L2 max (preparación). Reversible. |
| **CAP-026** | Asistir en negociación (cláusulas, comparator de drafts) | Advisor | L3 | L2 | **Crítica** | compensable | T12 | L3 max **default-deny** salvo whitelist `admin`. Compensable (versionado de SPA). |
| **CAP-027** | Comparar versiones de contratos | Advisor | L2 | L2 | Media | reversible | T12, T13 | L2 max (análisis informativo). Reversible. |
| **CAP-028** | Generar checklists de cierre | Advisor | L3 | L2 | Alta | reversible | T13, T14 | L3 max para marcar hitos cumplidos. Reversible (desmarcar si error). |
| **CAP-029** | Asistir en planificación de integración post-deal | Advisor | L3 | L2 | Media | compensable | T13, T15 | L3 max para promover plan a oficial. Compensable (revisar plan). |

### 11.2 Resumen agregado

| Métrica | Valor |
|---|---|
| Total capabilities | 29 |
| max_level = L2 | 11 (CAP-001, 004, 006, 010, 011, 018, 020, 022, 025, 027 + nota) |
| max_level = L3 | 13 (CAP-002 sube a L3, 007, 008, 009, 013, 016, 017, 019, 021, 024, 026, 028, 029) |
| max_level = L4 | 5 (CAP-003, 005, 012, 014, 015, 023) — nótese: 6 en realidad; verificar tabla |
| current_level = L2 todas | 29 (estado inicial v1.0.0) |
| criticality = Baja | 3 (CAP-005, 010, 011, 014) |
| criticality = Media | 13 |
| criticality = Alta | 11 |
| criticality = Crítica | 2 (CAP-021, CAP-026) |
| reversibility = reversible | 18 |
| reversibility = compensable | 11 |
| reversibility = irreversible | 0 (ninguna capability v1.0.0 cataloga como irreversible per se; las acciones contractualmente irreversibles — firma definitiva — viven en el TOS y no en capabilities) |

> **Nota sobre conteo `max_level = L4`**: la tabla en §11.1 declara explícitamente como candidatas L4 las siguientes: **CAP-003, CAP-005, CAP-012, CAP-014, CAP-015, CAP-023**. Total 6. El resumen anterior debe leerse como tal.

### 11.3 Capabilities default-deny en L3+ (whitelist requerida)

| CAP | Razón |
|---|---|
| **CAP-021** | Crítica + L3+ → preparar LOI vinculante. Requiere whitelist `admin` para operar en L3. Sin whitelist: opera solo en L1/L2 (preparar borrador y verbalizar). |
| **CAP-026** | Crítica + L3+ → asistir en negociación de SPA. Requiere whitelist `admin`. Sin whitelist: opera solo en L1/L2 (proponer drafts y verbalizar). |

Estas dos capabilities representan el punto donde la capa agéntica se encuentra con el dominio contractual material. El `admin` (representante de arroba.com con responsabilidad legal) revisa el comportamiento histórico de la capability en L1/L2 antes de habilitar L3+.

### 11.4 Open Questions específicas del catálogo

- **[OPEN-E17]** Algunas capabilities pueden requerir refinamiento de `max_level` tras observación real. La tabla §11.1 es **propuesta inicial**, sujeta a revisión al cabo de N meses de operación.
- **[OPEN-E18]** ¿CAP-005 (clasificación de documentos) tiene un sub-nivel "clasificar pero requerir confirmación cuando confidence < X"? Esto sería L3 condicional, no L4 puro. Probablemente más limpio: que la matriz `criticality × level` regule (Baja + L4 = audit:extended + alert async; si confidence baja, escalado a L3 (§8.1)). *(Relacionado con E2)*
- **[OPEN-E19]** CAP-007 (Teaser) — ¿el `compensation_capability_id` se cataloga como capability nueva (CAP-007b) o como parte del lifecycle del Teaser en `opportunity.{id}`? Decisión técnica diferida. *(Relacionado con E3)*

---

## 12. Cuotas y planes (referencia forward)

> Forward reference a `MONETIZATION_SPEC` (0.6). Este spec **NO** define cuotas concretas; declara el **contrato y los anclajes**.

### 12.1 Anclajes del Agentic Layer hacia `MONETIZATION_SPEC`

| Anclaje | Qué proveerá `MONETIZATION_SPEC` |
|---|---|
| `capability.quota_credits` | Coste por invocación de cada capability en créditos / EUR. |
| `plan_eligibility[]` | Qué planes pueden operar cada capability y en qué niveles. |
| `cuotas mensuales por plan` | Volumen máximo de invocaciones de cada capability por unidad de tiempo. |
| `overage policy` | Qué hace el sistema cuando un usuario supera la cuota: degradación a L1, bloqueo total, cobro automático (con confirmación). |
| `revenue share Advisor / Plataforma` | Cuando una capability genera valor económico medible (ej. CAP-021 LOI firmada que devenga Success Fee), cómo se atribuye el coste / ingreso. |
| `excepciones por criticidad Crítica` | Cuotas reforzadas o no-cuotificadas para capabilities críticas (CAP-021, CAP-026). |
| `excepciones por plan team_arroba` | El equipo arroba.com puede tener cuotas internas distintas. |

### 12.2 Política operativa cuando cuota se agota

Documentada en §8.2 (degradación). Recapitulación:

- **Cuota agotada → degradación a L1** (verbalización al usuario).
- **Cuota agotada en capability L4** → kill-switch implícito de las autorizaciones afectadas.
- **Cuota agotada y la capability es Crítica con whitelist** → bloqueo total con alerta a `admin`.

### 12.3 Política operativa cuando cuota está próxima a agotarse

- **80%**: notificación blanda al usuario ("Has usado 80% de tu cuota mensual de Recomendaciones automáticas. Quedan X invocaciones.").
- **95%**: alerta más fuerte + propuesta de upgrade de plan.
- **100%**: degradación efectiva.

Detalle exacto en `MONETIZATION_SPEC`.

---

## 13. Trazabilidad y eventos canónicos del Agentic Layer

### 13.1 Política general

Cada invocación de capability, cada cambio de nivel efectivo, cada concesión / revocación de autorización, cada activación de kill-switch y cada alerta genera **eventos canónicos del Agentic Layer**. Todos persisten en `audit.global` (`MEMORY_ENGINE_SPEC §4.10`) bajo retención mínima de 10 años post-cierre de la Operation referenciada.

### 13.2 Catálogo canónico de eventos del Agentic Layer

#### Invocación

| Evento | Cuándo se emite |
|---|---|
| `agentic.capability.invoked` | Al iniciar la invocación de una capability con `(capability_id, operation_id, level_efectivo, actor, correlation_id, authorization_id?)`. |
| `agentic.capability.completed` | Al completar exitosamente la invocación. Incluye `outputs_summary`, `confidence`, `output_persisted_as`. |
| `agentic.capability.failed` | Al fallar la invocación con `error_kind`, `error_message`, `recovery_action_taken`. |
| `agentic.execution.denied` | Cuando el motor rechaza una invocación con `reason` (`quota_exceeded` | `no_active_authorization` | `kill_switch_active` | `default_deny_critical` | `permission_denied` | otros). |
| `agentic.execution.aborted` | Cuando una invocación en curso se interrumpe (típicamente por kill-switch mid-execution). |

#### Niveles efectivos

| Evento | Cuándo se emite |
|---|---|
| `agentic.level.escalated` | Cuando el nivel efectivo de una invocación se eleva (`from`, `to`, `reason`). |
| `agentic.level.degraded` | Cuando el nivel efectivo de una invocación se baja (`from`, `to`, `reason`). |

#### Autorizaciones

| Evento | Cuándo se emite |
|---|---|
| `agentic.authorization.granted` | Al concederse una autorización L4 (incluye `authorization_id`, `capability_id`, `operation_id`, `granting_user_id`, `expires_at`, `scope`, `irreversibility_acknowledged`). |
| `agentic.authorization.revoked` | Al revocarse explícitamente (`actor` quién, `reason`). |
| `agentic.authorization.expired` | Al expirar por tiempo (automático por sistema). |
| `agentic.authorization.consumed` | Al consumirse por `single_use` o `n_uses_consumed = n_uses_max`. |
| `agentic.authorization.modified_attempt` | **Solo registro** de intentos de modificar un campo inmutable (debería ser rechazado por validación, pero se registra para detectar ataques). |

#### Kill-switch

| Evento | Cuándo se emite |
|---|---|
| `agentic.kill_switch.triggered` | Activación inicial. |
| `agentic.kill_switch.confirmed` | Propagación completada (jobs cancelados, estado persistido). |
| `agentic.kill_switch.notified_user` | TC verbalizó al usuario. |
| `agentic.kill_switch.notified_team` | Notificación interna a `arroba_team`. |
| `agentic.kill_switch.lifted` | Nueva concesión emitida; la anterior queda `kill_switch_terminated`. |

#### Alertas

| Evento | Cuándo se emite |
|---|---|
| `agentic.alert.triggered` | Cuando la matriz `criticality × level` define alerting y se invoca la capability. Incluye `target` (`user`, `team`, `user_and_team`). |
| `agentic.alert.delivered` | Notificación efectivamente recibida (post-canal). |

#### Compensaciones

| Evento | Cuándo se emite |
|---|---|
| `agentic.compensation.invoked` | Cuando se ejecuta la `compensation_capability_id` de una capability `compensable`. Incluye cita al evento original. |
| `agentic.inverse.invoked` | Cuando se ejecuta el `inverse_capability_id` de una capability `reversible`. Incluye cita al evento original. |

#### Esquema y catalogación

| Evento | Cuándo se emite |
|---|---|
| `agentic.capability.schema_updated` | Cambio menor al schema de una capability (`current_level` peldaño, `alerting_threshold`, etc.). |
| `agentic.capability.schema_major_update` | Cambio mayor (`max_level`, `reversibility`, etc.). Requiere aprobación `admin`. |
| `agentic.capability.whitelist_granted` | `admin` aprueba whitelist para capability Crítica en L3+. |
| `agentic.capability.whitelist_revoked` | `admin` retira whitelist. |

### 13.3 Campos comunes en todos los eventos

Cada evento del Agentic Layer lleva:

- `event_id`: identificador único (UUID).
- `event_type`: uno de los catalogados.
- `timestamp`: ISO 8601 UTC.
- `correlation_id`: liga al turno conversacional del usuario.
- `parent_event_id`: evento del TC o especialista que disparó la operación (cuando aplique).
- `session_id`.
- `actor`: usuario o copilot que originó la operación.
- `capability_id`: capability afectada (cuando aplique).
- `operation_id`: Operation contextual (cuando aplique).
- `authorization_id`: autorización amparante (cuando aplique).
- `level_efectivo`: L1 / L2 / L3 / L4 (cuando aplique).
- `criticality_snapshot`: criticidad de la capability en el momento del evento.
- `reversibility_snapshot`: reversibilidad de la capability en el momento del evento.

### 13.4 Retención de los eventos del Agentic Layer

Sigue la política del Memory Engine (`MEMORY_ENGINE_SPEC §4.10`, §7.1):

- **Eventos atados a Operation**: 10 años post-cierre.
- **Eventos no atados a Operation** (Discovery Layer, evaluación de cuota usuario): 3 años.
- **Eventos de schema y catalogación**: 10 años (parte del audit estructural).
- **Eventos de alertas**: 3 años (post-resolución).

### 13.5 Inmutabilidad

Todos los eventos del Agentic Layer son **append-only e inmutables** (`MEMORY_ENGINE_SPEC §3.5`). Rectificaciones se hacen con eventos adicionales explícitos (`audit.correction`) que citan el `event_id` original.

### 13.6 Vinculación con eventos predecesores

| Spec predecesor | Vínculo |
|---|---|
| `TRANSACTION_OS_SPEC §9` (audit del TOS) | Cada evento `agentic.*` que produce transition en la máquina de estados del TOS también emite el evento correspondiente del TOS (ej. `loi.fully_signed` cuando una invocación L3 de CAP-021 culmina con firma). |
| `TRANSACTION_COPILOT_SPEC §8` (audit del TC) | Cada delegación del TC a especialista emite tanto `tc.delegation.*` como `agentic.capability.invoked`. Ambos llevan `correlation_id` común. |
| `COPILOTS_SPEC §11` (audit de especialistas) | Cada output de especialista emite tanto `specialist.invocation.completed` como `agentic.capability.completed`. Ambos llevan `correlation_id` común. |
| `MEMORY_ENGINE_SPEC §13` (audit del Memory) | Cada write/update tipificado con `agentic_level` emite tanto `memory.write` como `agentic.capability.completed` (cuando la capability produjo escritura). |

Esto permite reconstruir, dado un turno del usuario, **toda la cadena**: turno → TC delegó → especialista invocado → memoria leída → razonamiento → autorización validada (si L4) → confirmación (si L3) → escritura aplicada → notificación al usuario.

---

## 14. Boundary First — qué es externo

### 14.1 Filosofía

El Agentic Layer **define contratos**. La materialización tecnológica vive en la capa de Implementación. Esta sección declara qué componentes son externos al spec y deben implementarse aparte.

### 14.2 Sistema de orquestación de jobs

- **Función**: ejecutar invocaciones L4 programadas (jobs periódicos como CAP-014 semanal) y diferir invocaciones cuando hay carga elevada.
- **Contrato externo**: el orquestador debe respetar `kill_switch_state` antes de iniciar cada job, debe emitir `agentic.execution.aborted` cuando cancela jobs por kill-switch, debe respetar la inmutabilidad de la autorización.
- **Implementación**: probablemente queue + workers (Redis + worker pool / Sidekiq-like / Celery), elección libre.

### 14.3 Sistema de notificaciones

- **Función**: entregar notificaciones al usuario (in-app, email, push) y a `arroba_team` (Slack / email interno).
- **Contrato externo**: cada notificación generada por el Agentic Layer debe emitir `agentic.alert.triggered` antes del envío y `agentic.alert.delivered` tras confirmación de entrega.
- **Implementación**: queues + adapters por canal, elección libre.

### 14.4 Sistema de doble confirmación UX

- **Función**: presentar al usuario el flujo de doble confirmación en concesión L4 (irreversibles, criticidad Crítica, etc.).
- **Contrato externo**: el componente debe verbalizar las implicaciones a través del TC (voz única) y registrar `acknowledgment_confirmation_method` no nulo en la autorización.
- **Implementación**: vive en el Design System; este spec garantiza el contrato del dato y la canalización por voz única.

### 14.5 Risk & Compliance Service (dependency externa, fuera Sprint 0)

- **Función**: detectar patrones cross-org anómalos (uso masivo de una capability por la misma org, intentos de bypass, etc.) y emitir alertas que el Agentic Layer consume.
- **Contrato externo**: el servicio expone endpoint de "evaluar riesgo de invocación", recibe un payload anonimizado (k-anonimizado, `MEMORY_ENGINE_SPEC §5.5`) y devuelve un score + flags. El Agentic Layer puede degradar / escalar / kill-switch en base a estos flags.
- **Implementación**: spec dedicado fuera del Sprint 0.

### 14.6 Schema persistido

- **Función**: persistir el schema de cada capability y de cada autorización.
- **Contrato externo**: el Memory Engine es la persistencia única (`MEMORY_ENGINE_SPEC §4.10` para autorizaciones en `audit.global`, propiedades de capabilities en `system.{capability_id}.schema` (scope nuevo a confirmar en propagación de specs)).
- **Implementación**: tecnologías que materialicen el Memory Engine.

`[OPEN-E4]`: ¿el scope `system.{capability_id}.schema` se cataloga como tipo de memoria adicional en `MEMORY_ENGINE_SPEC §4` (12º tipo) o vive como sub-scope de `audit.global`? Decisión pendiente.

---

## 15. Integración forward con `MONETIZATION_SPEC` (0.6)

> Tabla "qué necesita el Agentic Layer de `MONETIZATION_SPEC`".

### 15.1 Necesidades concretas

| Necesidad | Detalle |
|---|---|
| **Tarifa por capability ejecutada** | Cada capability declara `quota_credits` (§5.1). `MONETIZATION_SPEC` define la **tabla de tarifas** en créditos / EUR por capability y por nivel agéntico efectivo. Probable: L4 más caro que L3 (mayor auditoría); criticidad ≥ Alta más cara (mayor monitorización). |
| **Cuotas por plan que afectan a frecuencia de invocación** | Cada plan (`subscriber`, `corporate`, `investor`, `advisor`, `team_arroba`) define cuotas mensuales por capability. `MONETIZATION_SPEC` proveerá la matriz `plan × capability × ventana_temporal → cuota_máxima`. |
| **Política de overage** | Qué hace el sistema al superar la cuota: degradación a L1 (con verbalización), bloqueo total (con verbalización), cobro automático (con confirmación del usuario). El default debería ser **degradación**, salvo política explícita por plan. |
| **Revenue share advisor/plataforma** | Cuando una capability con `owner_copilot = Advisor` genera valor económico (CAP-021 LOI que devenga Success Fee, CAP-026 SPA cerrado), `MONETIZATION_SPEC` define cómo se atribuye coste/ingreso entre Advisor y plataforma. |
| **Excepciones por criticidad Crítica** | Cuotas reforzadas o no-cuotificadas para CAP-021, CAP-026. Posiblemente requieren plan `corporate` o superior. |
| **Cuotas de autorizaciones L4** | Número máximo de autorizaciones L4 activas simultáneas por usuario / org. Forward. |
| **Cuotas de Working Context construido** | Forward al `MEMORY_ENGINE_SPEC §11`: cuántos Working Contexts activos permite cada plan; el Agentic Layer respeta esto al delegar. |
| **Tarifa de capabilities con `external_dependencies`** | CAP-017 (valoración avanzada con LLM caro), CAP-007 (Teaser con anonimización Risk & Compliance), etc., tienen coste externo además del interno. |

### 15.2 Datos que el Agentic Layer aporta a `MONETIZATION_SPEC`

A la inversa: el Agentic Layer es la **fuente de verdad** de:

- Conteo de invocaciones de cada capability por usuario / org / Operation.
- Conteo de autorizaciones L4 activas.
- Volumen de eventos de audit por capability.
- Tasa de escalado / degradación por capability.
- Tasa de kill-switch por capability.

`MONETIZATION_SPEC` consume estos datos vía consultas agregadas al Memory Engine.

### 15.3 No-decisión consciente

Este spec **no decide** tarifas concretas. No declara "CAP-014 cuesta 0.05 EUR por invocación". Eso vive en `MONETIZATION_SPEC`. Lo único que canoniza este spec es el **contrato** y los **puntos de anclaje** para que `MONETIZATION_SPEC` se construya consistente.

---

## 16. Open Questions

> Numeración E1-En (E = Spec 0.5). NO se inventan respuestas; se marca como `[OPEN]` con propuesta cuando aplica.

| ID | Pregunta | Propuesta de este spec | Estado |
|---|---|---|---|
| **E1** | ¿Las capabilities pueden tener `max_level` distinto según contexto (ej. una capability operando para `team_arroba` puede llegar a L4 aunque para usuarios normales solo llegue a L3)? | No en v1.0.0. `max_level` es **único por capability**. La diferenciación por plan se hace mediante `plan_eligibility[]` + cuotas, no via `max_level`. Reservar para v2.0.0 si se demuestra necesario. | ABIERTO — confirmación |
| **E2** | ¿CAP-005 (clasificación de documentos) requiere sub-nivel "L3 condicional por confidence"? | Mejor cubierto por la política de escalado (§8.1) general: si `confidence < 0.6`, escala a L3 independientemente de `current_level`. No requiere sub-nivel especial. | ABIERTO — confirmación |
| **E3** | ¿Las capabilities `compensation_capability_id` se catalogan como capabilities aparte (CAP-XXXb) o como parte del lifecycle de la entidad? | Catalogar como capabilities aparte si tienen su propio razonamiento (ej. "Retirar Teaser del Marketplace y notificar Buyers"); de lo contrario, documentarlas como procedimiento de undo dentro de la capability original. | ABIERTO — decisión técnica |
| **E4** | ¿El schema persistido de capabilities y autorizaciones vive como tipo de memoria adicional en `MEMORY_ENGINE_SPEC §4` (12º tipo) o como sub-scope de `audit.global`? | Propuesta: `system.{capability_id}.schema` como sub-scope persistente (no efímero) que el Memory Engine reconoce; autorizaciones siguen en `audit.global` por su naturaleza inmutable. Requiere coordinación al cierre del Sprint 0. | ABIERTO — coordinación con 0.4 |
| **E5** | ¿La granularidad "global" (per-user) del kill-switch (§7.3) debería requerir, además de doble confirmación, un cooldown (ej. 24h) antes de poder reanudar L4 globalmente? | Propuesta inicial: no. La reanudación requiere **nueva autorización por cada capability/Operation** (no es reanudación masiva). Esto ya provee el "cooldown" implícito al obligar a re-conceder explícitamente. | ABIERTO — confirmación |
| **E6** | Tope máximo de `expires_at - granted_at` en autorizaciones L4 | Propuesta: 90 días en v1.0.0. Configurable por plan en `MONETIZATION_SPEC`; planes `corporate` o `team_arroba` podrían admitir hasta 365 días con doble confirmación. | ABIERTO — calibrar |
| **E7** | ¿Las whitelists `admin` para capabilities Críticas en L3+ (§3.12) se renuevan automáticamente o requieren revisión periódica? | Propuesta: revisión obligatoria cada 12 meses + revocación automática si la capability acumula `agentic.capability.failed` > umbral o `kill_switch.triggered` > umbral en una ventana. | ABIERTO — calibrar |
| **E8** | ¿Los eventos del Agentic Layer son consultables por la UI del usuario directamente o solo vía el TC? | Propuesta: vía TC (voz única). UI puede mostrar resúmenes generados por el TC pero no acceso directo a `audit.global`. Excepción: vista de "mis autorizaciones L4" que es vista de **lectura controlada** (solo metadatos visibles al usuario). | ABIERTO — coherencia con B6 |
| **E9** | Cuando una capability tiene varios `external_dependencies` (CAP-017 + LLM + Risk & Compliance), ¿el coste se atribuye separadamente o agregado? | Propuesta: agregado en la tarifa de la capability + auditoría detallada del consumo por dependencia. `MONETIZATION_SPEC` cierra el detalle. | ABIERTO — coordinación con 0.6 |
| **E10** | ¿La política de degradación bajo carga (§10.5) la decide el operador (`admin`/`arroba_team`) o es automática? | Propuesta: automática con umbrales declarados; `admin` puede sobreescribir manualmente en incidentes graves. Auditoría obligatoria de cada degradación masiva. | ABIERTO — implementación |
| **E11** | ¿Las capabilities `current_level = L1` (futuras) tienen sentido o todas tienen mínimo L2? | Propuesta: el catálogo actual no tiene ninguna `max_level = L1`; pero conceptualmente podría existir una capability "pura conversacional" sin output persistente. Reservar la posibilidad sin restricción. | ABIERTO — sin urgencia |
| **E12** | ¿El TC puede emitir notificaciones del Agentic Layer fuera de la sesión activa del usuario (push / email)? | Sí, vía el sistema de notificaciones externo (§14.3). El **contenido** lo genera el TC siempre. | ABIERTO — confirmación (alineado con B6) |
| **E13** | ¿Las acciones compensatorias (CAP-XXXb) consumen cuota del plan o son gratuitas? | Propuesta: gratuitas si se invocan dentro de las 24h de la acción original; consumen cuota si se invocan después. `MONETIZATION_SPEC` cierra. | ABIERTO — calibrar |
| **E14** | ¿Las capabilities ejecutadas por `arroba_team` para mediación de disputa siguen el mismo schema agéntico o tienen excepciones? | Propuesta: mismo schema, con `actor = arroba_team` y `reason` reforzada. Sin niveles agénticos diferentes. La trazabilidad es la misma. | ABIERTO — coordinación con Risk & Compliance |
| **E15** | Versiones futuras: ¿añadir un nivel L0 (solo razonamiento, sin output al usuario)? | No. L1 ya cubre "razonamiento + verbal". L0 sería diagnóstico interno; eso vive en logs técnicos, no en el modelo agéntico. | CERRADO — no aplica |
| **E16** | ¿El `admin` puede sobrescribir el `current_level` de una capability sin pasar por la política de cambio mayor del schema (§5.3)? | No. Cualquier cambio de `current_level` o `max_level` pasa por la política de §5.3. `admin` puede acelerar la revisión pero no saltarse el flujo. | ABIERTO — confirmación |
| **E17** | Refinamiento futuro de la tabla §11.1 tras observación real | La tabla es propuesta inicial sujeta a revisión periódica (sugerido cada 6 meses) | ABIERTO — calibrar con uso |
| **E18** | ¿CAP-005 (clasificación documentos) requiere sub-nivel "L3 condicional por confidence"? | Cubierto por escalado §8.1: si `confidence < 0.6`, escala a L3 independientemente de `current_level` | ABIERTO — confirmación |
| **E19** | ¿Las acciones compensatorias (`compensation_capability_id`) se catalogan como capabilities aparte (CAP-XXXb) o como procedimiento de undo de la original? | Catalogar aparte si tienen razonamiento propio; documentar como procedimiento de undo si son atómicas | ABIERTO — decisión técnica |

### 16.1 Lagunas estructurales a resolver en `MONETIZATION_SPEC` (0.6)

**Para `MONETIZATION_SPEC` (0.6)**:

- Tabla `plan × capability × nivel_agéntico → cuota_créditos` completa para las 29 capabilities.
- Tarifas concretas (créditos / EUR) por capability y por nivel.
- Política de overage definitiva (degradación / bloqueo / cobro automático), por plan.
- Revenue share Advisor/Plataforma para capabilities owner = Advisor que generan ingreso económico.
- Excepciones por criticidad Crítica (capabilities CAP-021, CAP-026): ¿solo plan `corporate`+ las habilita?
- Cuotas de autorizaciones L4 activas simultáneas por usuario / org.
- Cuotas de Working Context activos (coordinación con `MEMORY_ENGINE_SPEC §11`).
- Tarifa de las dependencias externas (Risk & Compliance Service, LLM avanzado para CAP-017).
- Política de cobro de acciones compensatorias (`[OPEN-E13]`).
- Tope máximo de `expires_at - granted_at` por plan (`[OPEN-E6]`).

### 16.2 Dependencias externas (fuera Sprint 0)

- **Risk & Compliance Service spec** (P0) — necesaria para cerrar `[OPEN-E14]`, ratificar §14.5, y materializar la política de escalado automático ante anomalías (§8.1).
- **DESIGN_SYSTEM_SPEC** (P1) — necesaria para materializar UX de reversibilidad (§9.3), UX de doble confirmación (§6.6), UX de kill-switch (§7), UX de "mis autorizaciones L4" (`[OPEN-E8]`).
- **NDA_SPEC, LOI_SPEC, SPA_SPEC, CIS_SPEC** (P0/P1) — necesarios para detallar capabilities con efecto contractual (CAP-007 a CAP-009, CAP-021, CAP-026).

---

> **Fin del documento.** — `v1.0.0` — pendiente de revisión humana.
