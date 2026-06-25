# arroba.com — Authorization Spec v1.1.0

> **Spec canónico** · capa 4 del canon (Engines & Specs).
> Fase 1.0.2 del Sprint 1 — segundo spec del Identity Platform Sprint.
> Fecha de cierre: 2026-06-25.
>
> **CHANGELOG interno**:
>
> **v1.1.0 (2026-06-25)** — Patch forward-compatibility aprobado por el usuario tras revisión de v1.0:
> - **Patch A.1**: principio canónico **P-A.12 — Authorization Explainability** elevado a requisito arquitectónico. La `Decision` pública incluye 5 campos obligatorios (`policy_ids_matched`, `rule_id_decisive`, `abac_attributes_used`, `missing_requirements`, `reason_code`). Nueva §20 dedicada.
> - **Patch A.2**: campos `valid_from` / `valid_until` añadidos a `policies` y `resource_acls` (default `null`); `expires_at` añadido opcional a `feature_flags`. Motor de decisión filtra por ventana temporal. Nueva §21.
> - **Patch A.3**: declaración forward del modelo `delegations` (delegación temporal de autoridad). NO implementado en v1.1; schema candidato + diferencia canónica con `resource_acls`. Nueva §22.
> - **Patch A.4**: principio canónico **P-A.13 — Authorization orientada a entidades** (no a pantallas/módulos). Revisión confirmada del catálogo de acciones §6 y recursos §7: están centrados en entidades del Entity Framework. Sin renombres pendientes.
>
> **v1.0.0 (2026-06-25)** — Cierre inicial. Aprobadas las 8 decisiones D-A.1-D-A.8 del SPRINT1_ARCHITECTURE_PROPOSAL y las 3 observaciones forward-compatibility del usuario.
>
> ---
>
> **Regla cardinal**: este spec define la **plataforma de Authorization** como la **3ª de 5 capas** de la cadena `Authentication ⇄ Identity ⇄ Authorization ⇄ Subscription ⇄ Billing`. Authorization consume **claims** de Identity. NO conoce planes, créditos, stripe ni billing; los claims relacionados (plan, kyc_status, risk_score) **viajan** a través del contrato ABAC sin que Authorization los origine.
>
> **Precedencia**: en caso de conflicto entre este spec y la implementación, **gana el spec**.

---

## Índice

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Glosario](#2-glosario)
3. [Principios canónicos](#3-principios-canónicos)
4. [Modelo de datos canónico (Mongo)](#4-modelo-de-datos-canónico-mongo)
5. [Catálogo canónico de roles](#5-catálogo-canónico-de-roles)
6. [Catálogo canónico de acciones](#6-catálogo-canónico-de-acciones)
7. [Catálogo canónico de recursos](#7-catálogo-canónico-de-recursos)
8. [Schema canónico de policy (declarativa)](#8-schema-canónico-de-policy-declarativa)
9. [Motor de decisión](#9-motor-de-decisión)
10. [Feature flags](#10-feature-flags)
11. [Resource-level ACL](#11-resource-level-acl)
12. [`arroba_team` — el rol especial](#12-arroba_team--el-rol-especial)
13. [Audit log y sampling](#13-audit-log-y-sampling)
14. [Eventos canónicos del Authorization Engine](#14-eventos-canónicos-del-authorization-engine)
15. [APIs canónicas (mapa)](#15-apis-canónicas-mapa)
16. [Integración forward con SUBSCRIPTION_SPEC](#16-integración-forward-con-subscription_spec)
17. [Migración del código actual](#17-migración-del-código-actual)
18. [Boundary First — qué es externo](#18-boundary-first--qué-es-externo)
19. [Open Questions (OPEN-A2-*)](#19-open-questions-open-a2-)

---

## 1. Propósito y alcance

### 1.1 Qué es Authorization Platform

La **Authorization Platform** es la capa declarativa de arroba.com responsable de **decidir qué puede hacer cada identidad en cada contexto**.

Authorization responde a la pregunta canónica:

> "Dado un **sujeto** con ciertas **claims**, una **acción** sobre un **recurso** y un **contexto** determinado, ¿se permite o se deniega?"

La capa NO almacena identidades (eso es Identity), NO administra credenciales (eso es Authentication), NO gestiona planes ni créditos (eso es Subscription), NO cobra (eso es Billing). Authorization es **una función pura**: `(subject, action, resource, context) → Decision`.

### 1.2 Posición canónica: 3ª capa de las 5

```
   ┌──────────────────────────────────────────────────────────────┐
   │ Authentication ⇄ Identity ⇄ Authorization ⇄ Subscription ⇄  │
   │ Billing                                                       │
   └──────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │  Authorization es la 3ª capa.
                              │  Consume claims de Identity.
                              │  Es consumida por Subscription
                              │  (que la combina con planes).
                              │  No conoce Billing.
```

**Direccionalidad de los claims**:
- Authorization recibe del JWT (firmado por Authentication, poblado por Identity): `user_id`, `role_global`, `active_org_id`, `memberships[]`, `kyc_status`, `risk_score`, `language`, `arroba_team_flag`, `profile_kinds[]`, `identity_tier`, `fiscal_entity_id`.
- Authorization recibe del runtime (in-request): `plan` (forward, lo añadirá Subscription en su contrato), `feature_flags_evaluated`, atributos del `resource`.
- Authorization NO genera claims; solo los **consume** y **decide**.

### 1.3 Qué NO cubre este spec

- 🚫 **Authentication**: validación de credenciales, OAuth exchange, refresh tokens, MFA. Cubierto en IDENTITY_SPEC §6 (y, conceptualmente, en una futura `AUTHENTICATION_SPEC` cuando crezca).
- 🚫 **Identity**: usuarios, organizaciones, memberships, perfiles, KYC. Cubierto en `IDENTITY_SPEC.md`.
- 🚫 **Subscription**: planes, créditos, cuotas, gates por plan, entitlements. Cubierto en `SUBSCRIPTION_SPEC.md`.
- 🚫 **Billing**: stripe, facturas, eventos económicos. Cubierto en `BILLING_SPEC.md`.
- 🚫 **Memoria/almacenamiento de datos por entidad**: las policies declaran *quién puede ver qué*, no *qué se muestra*. La renderización es responsabilidad de la capa de producto.
- 🚫 **Risk & Compliance**: el motor de cálculo de `risk_score` vive fuera (forward dependency). Authorization **consume** el claim.

### 1.4 Relación con IDENTITY_SPEC

Authorization **depende lógicamente** de Identity. Specifically:

| Identity provee | Authorization consume |
|---|---|
| `role_global` | Atributo principal del subject |
| `memberships[]` (role, status, team_ids per org) | Roles por contexto org |
| `active_org_id` | Resolución del `org_id` del recurso vs subject |
| `kyc_status`, `kyc_expires_at` | Condición ABAC (gating de acciones sensibles) |
| `risk_score` | Condición ABAC (gating por riesgo) |
| `profile_kinds[]` | Condición ABAC (e.g., "solo advisors pueden firmar tal cosa") |
| `arroba_team_flag` | Bypass especial documentado (§12) |
| `identity_tier` (forward) | Distingue internal vs external |
| `fiscal_entity_id` (forward) | Distingue entidad fiscal del contexto |

**Importante**: Authorization **NO consulta colecciones de Identity directamente**. Consume los claims del JWT y, cuando necesita información fresca (post-eventos invalidadores), invoca los accessors públicos declarados en IDENTITY_SPEC §16 (`identity.get_user`, `identity.get_memberships`, etc.).

### 1.5 Forward declarations relevantes en este spec

Tres atributos del contrato ABAC que el spec **declara hoy aunque su materialización plena llegue en sprints futuros**:

1. **`identity_tier`** ∈ `{"internal", "external"}`. En v1.0 default constante `"internal"` (cobertura completa por memberships). Forward: identidades externas (IDENTITY_SPEC §18).
2. **`fiscal_entity_id`** ∈ `str | null`. En v1.0 default constante `null`. Forward: entidades fiscales múltiples por org (IDENTITY_SPEC §19).
3. **`plan`** ∈ enum de planes (será definido en SUBSCRIPTION_SPEC). En v1.0 puede ser constante `"unknown"` o derivar de la org default. Forward: Subscription puebla el claim.

Estas variables aparecen ya en el schema de policy (§8) y en el motor (§9). El usuario podrá escribir policies que las referencien; en v1.0 esas referencias evalúan al default constante.

---

## 2. Glosario

| Término | Definición canónica |
|---|---|
| **Subject** | Identidad activa de la request. Conjunto de claims (`subject_claims`) producido por Identity y firmado por Authentication. Caso especial: subject puede ser un `service` (background job, webhook) con claims de servicio. |
| **Action** | Verbo canónico sobre un recurso, en notación `{dominio}.{verbo}` o `{dominio}.{subdomain}.{verbo}`. Ejemplo: `membership.invite`, `operation.read`, `capability.invoke.CAP-005`. Lista cerrada en §6. |
| **Resource** | Objeto sobre el que se ejecuta la action. Tipo + identificador: `{type}.{id}` (ej. `operation.op_xxx`). Lista cerrada de tipos en §7. |
| **Context** | Atributos contextuales no derivables del subject ni del resource: hora del día, IP origen, `tenant`/`active_org_id` cuando difiere del `resource.org_id`, `feature_flags_evaluated`, `request_id`. |
| **Policy** | Declaración formal `(subject_match, resource_match, action_match, condition) → effect`. Vive en YAML core (inmutable, deployment-time) o en Mongo override (dinámico, runtime). |
| **Permission** | Capacidad efectiva resultante. NO se almacena explícitamente; se **deriva** de la evaluación de policies. (Excepción: ACLs persistentes, §11.) |
| **Role** | Etiqueta agrupadora canónica del subject. Distinguimos `role_global` (a nivel plataforma) de `membership.role` (a nivel org). Lista cerrada en §5. |
| **Scope** | Conjunto de recursos a los que aplica una decisión: scope `org`, `team`, `operation`, `resource_specific`, `global`. |
| **Entitlement** | (Forward de Subscription) Producto/feature habilitado por el plan del subject. Authorization NO emite entitlements; los consume si están presentes en claims. |
| **Feature Flag** | Booleano controlado por reglas que activa/desactiva capacidades específicas en runtime sin redeploy. Vive en colección `feature_flags`. |
| **Claim** | Afirmación firmada sobre el subject. Origen: Identity (vía JWT) o Subscription (futuro, vía claim joiner). |
| **Decision** | Resultado de la evaluación: `permit` | `deny`, con `reason`, `matched_policies[]`, `latency_ms`. |
| **Audit Decision** | Registro persistido de una `Decision` (con sampling por defecto). Vive en `authz_audit_log`. |
| **Cache key** | Tupla `(subject_id, action, resource_id, context_hash)` usada para cachear decisiones según §9.3. |
| **Override** | Policy dinámica almacenada en Mongo que **complementa** (con misma o mayor prioridad) las policies de YAML core. Auditoría obligatoria al crear/modificar. |
| **Effect** | Salida atómica de una policy individual: `permit` o `deny`. |
| **Conflict resolution** | Estrategia para combinar effects de múltiples policies match. Canónica: **deny-overrides** (D-A.5). |
| **ABAC** | Attribute-Based Access Control. Condiciones evaluadas sobre atributos del subject + resource + context, no solo sobre role. |
| **RBAC** | Role-Based Access Control. Decisiones basadas en role. Authorization combina **RBAC + ABAC limitado**. |
| **Identity Tier** | Atributo forward del subject: `"internal"` (member pleno) | `"external"` (advisor externo, despacho, banco, auditor, etc.). Default `"internal"` en v1.0. |
| **Fiscal Entity** | Atributo forward del context: `fiscal_entity_id` opcional, default `null` en v1.0. Para casos holding/filial/SPV. |
| **Service subject** | Caso especial de subject sin user humano: background jobs, webhooks idempotentes, cron tasks. `subject.kind = "service"`, claims propios. |

---

## 3. Principios canónicos

> Invariantes del Authorization Engine. Cualquier evolución debe respetarlos o producir bump mayor con justificación documentada.

### P-A.0 — Separación canónica de 5 capas

```
Authentication ⇄ Identity ⇄ Authorization ⇄ Subscription ⇄ Billing
```

Authorization es **la 3ª capa**:
- **Consume** claims de Identity (vía JWT) y de Subscription (vía claim joiner, forward).
- **No conoce** credenciales (Authentication), tax IDs (Identity §19 forward), stripe customers (Billing).
- **Es consumida por** Subscription cuando este último necesita decidir si un gating se aplica antes o después.

### P-A.1 — Declarativa, no embebida

**Las policies son datos, no código**. Toda regla de acceso vive como YAML (inmutable, deployment-time) o como documento Mongo (dinámico, runtime). El motor evalúa policies; **nunca** contiene lógica de negocio hardcoded del tipo `if user.role == "admin"`.

**Consecuencia operativa**: ningún módulo del producto codifica permisos. Toda decisión pasa por `authz.check(subject, action, resource, context)`. La policy se ajusta sin tocar código.

### P-A.2 — Deny-overrides por defecto (D-A.5)

Si **alguna** policy match produce `deny`, la decisión final es `deny`, sin importar cuántas permits haya. Seguridad por defecto.

**Razón canónica**: en M&A, sobre-permitir es catastrófico (data leak); sub-permitir es molesto pero reparable. Stripe Identity, OPA, AWS IAM siguen el mismo principio.

### P-A.3 — Default deny (no policy → deny)

Si **ninguna** policy match con `permit`, la decisión es `deny`. Ausencia de policy ≠ ausencia de restricción.

**Excepción**: ciertas acciones públicas (lectura de fichas anónimas) tienen policy explícita `permit` para `subject_match.role_global = "anonymous"`. No hay "permit implícito".

### P-A.4 — Least privilege total

Cada role tiene el **mínimo** conjunto de permisos necesarios para su función canónica. Promoción de permisos requiere policy explícita, no herencia transitiva.

**Consecuencia**: el role global `admin` **NO hereda** automáticamente `arroba_team`. El role `arroba_team` **NO hereda** automáticamente `admin`. Cada uno tiene su matriz declarada (§5, §12).

### P-A.5 — Auditable y trazable

Cada decisión `permit` o `deny` es **rastreable** hasta las policies que la produjeron. El audit log persiste:
- Claims del subject (snapshot redactado).
- Action y resource.
- Policies que match.
- Effect resultante.
- Latencia.

Sampling: 100% DENY + 1% PERMIT (D-A.6).

### P-A.6 — Cacheable pero invalidable

Las decisiones son cacheables con **TTL corto** (60s PERMIT, 0s DENY) y **invalidación explícita** ante eventos que cambian el contexto (D-A.7, D-A.8).

**Por qué TTL 0s en DENY**: una corrección de policy (otorgar acceso) debe propagarse instantáneamente. Una concesión cacheada (PERMIT) puede mantenerse 60s sin riesgo grave.

### P-A.7 — Forward-compatible

El contrato ABAC acepta atributos cuyo valor en v1.0 es constante:
- `identity_tier`: default `"internal"`.
- `fiscal_entity_id`: default `null`.
- `plan`: default `"unknown"` (lo poblará Subscription).

Las policies pueden referenciar estos atributos hoy mismo; cuando se materialicen, las policies funcionan sin cambios.

### P-A.8 — Latencia acotada

- Decisión cacheada: **<2 ms P95** (in-memory lookup).
- Decisión fría (no cacheada): **<20 ms P95** (evaluación full policy set).
- Decisión con consulta cross-module (e.g., resolver fresh memberships post-evento): **<50 ms P95**.

### P-A.9 — Voz única en denegaciones

Toda denegación visible al user atraviesa el patrón canónico del Copilot/UX (alineado con `ARROBA_PHILOSOPHY.md §12`). Authorization emite el `Decision` con `reason`; la traducción a UX (`LockedSectionBlur`, modal de upgrade, mensaje de KYC requerido) corresponde a la capa de producto.

### P-A.10 — Aislamiento Mongo lógico estricto (D10 Sprint 0)

Las colecciones de Authorization (`policies`, `feature_flags`, `resource_acls`, `authz_audit_log`) viven en el Mongo compartido. Toda query crítica filtra por `org_id` cuando aplique. Las policies que referencian `subject.active_org_id` operan dentro del tenant solicitante.

### P-A.11 — `arroba_team` opera bajo trazabilidad reforzada (B2, C11)

El rol `arroba_team` tiene permisos de mediación documentados (§12), siempre con `audit_level = "extended"` y, en ciertos casos, requiere "razón" obligatoria.

### P-A.12 — Authorization Explainability (requisito arquitectónico)

El motor debe ser **completamente explicable**. No basta con devolver `permit` o `deny`. Cada `Decision` pública incluye obligatoriamente:

| Campo | Tipo | Propósito |
|---|---|---|
| `policy_ids_matched` | `list[str]` | Policies que contribuyeron a la decisión (incluyendo ACLs si aplicaron) |
| `rule_id_decisive` | `str` \| `null` | Regla que produjo el efecto final (primer `deny` en deny-overrides; o `permit` más prioritario) |
| `abac_attributes_used` | `list[str]` | Qué atributos del contexto fueron evaluados (`plan`, `kyc_status`, `risk_score`, `identity_tier`, `fiscal_entity_id`, etc.) |
| `missing_requirements` | `list[str]` | En `deny`: qué requisitos faltaban (`kyc_required: verified`, `plan_required: corporate+`, `membership_required: owner\|admin`, etc.). En `permit`: lista vacía. |
| `reason_code` | `str` | Código canónico de la decisión (i18n en frontend; ver OPEN-A2-20). Lista cerrada documentada en §20.4. |

**Usos canónicos de la explainability**:
- **Arroba Copilot**: explica al user por qué no puede hacer X y propone remedio concreto.
- **Auditoría**: trazabilidad regulatoria (GDPR, sector financiero, MiCA si aplica).
- **Soporte (`arroba_team`)**: mediación informada.
- **Depuración**: equipo técnico.

**No es feature de UX, es requisito arquitectónico**. Toda `Decision` lleva estos campos siempre. La UX decide cuándo y cómo mostrarlos.

Detalle completo del contrato en §20.

### P-A.13 — Authorization orientada a entidades (no a pantallas)

La autorización **NO** se modela alrededor de pantallas, módulos o features de la aplicación. Se modela alrededor del **Entity Framework canónico** (`ENTITY_MODEL.md` + `ENTITY_FRAMEWORK.md`).

El motor canónico responde preguntas como:

| Pregunta canónica | Resource canónico | Acción canónica |
|---|---|---|
| ¿Puede este subject editar **esta Empresa**? | `company.{cif}` | `company.update` |
| ¿Puede acceder a **este Match**? | `match.{id}` | `match.read` |
| ¿Puede participar en **esta Operación**? | `operation.{id}` | `operation.read` / `operation.advance_phase` |
| ¿Puede leer **este Documento**? | `document.{id}` | `document.read` |
| ¿Puede abrir **este Data Room** (forward)? | `dataroom.{id}` | `dataroom.read` |
| ¿Puede generar valoración sobre **esta Oportunidad**? | `opportunity.{id}` | `valuation.create` |

**Implicaciones**:
- El catálogo de `resource_types` (§7) **es** el catálogo de entidades del Entity Framework (incluyendo Match como entidad canónica, decisión Sprint 0).
- Las acciones se nombran en términos de entidad: `company.read`, `match.accept`, `operation.advance_phase`, **NO** `dashboard.view` ni `settings_page.access`.
- Las pantallas frontend consultan permisos sobre las **entidades** que muestran, no sobre las pantallas en sí. Una pantalla con N entidades hace N checks (bulk endpoint §15.3 lo facilita).
- Cuando una nueva pantalla aparece, **NO** se añaden acciones nuevas; la pantalla reusa las acciones existentes sobre las entidades que renderiza.

**Cobertura**: revisión confirmada del catálogo §6 al cierre v1.1: las **107 acciones canónicas** están todas centradas en entidades del Entity Framework + dominios transversales (Identity, Authorization mismo, Subscription/Billing forward). Cero acciones "de pantalla" residuales. Cualquier propuesta futura de añadir acciones debe pasar el filtro: ¿corresponde a una **entidad** del Entity Framework o a un **dominio transversal canónico**? Si no, se reescribe en términos de entidad o se rechaza.

---

## 4. Modelo de datos canónico (Mongo)

> Convenciones: tipos Pydantic-like. Índices declarados. Soft-delete por defecto. IDs prefijados.

### 4.1 `policies` — policies de Mongo (overrides dinámicos)

> Las policies del YAML core viven en disco (`/app/backend/policies/*.yaml`); este colección almacena las **overrides** que admin/`arroba_team` pueden crear sin redeploy.

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | ObjectId | sí | auto | — |
| `policy_id` | `str` (`pol_`) | sí | autogen | unique |
| `name` | `str` | sí | — | length 3-200 |
| `description` | `str` | no | `null` | length ≤ 2000 |
| `version` | `int` | sí | `1` | bumped on each update |
| `enabled` | `bool` | sí | `true` | toggle rápido sin borrar |
| `priority` | `int` | sí | `100` | mayor = más prioritario (50-9999); reservado <50 para core; 9999 reservado para emergency override |
| `subject_match` | `dict` | sí | `{}` | declarativo (ver §8) |
| `resource_match` | `dict` | sí | `{}` | declarativo |
| `action_match` | `list[str]` | sí | `[]` | acciones del catálogo §6 |
| `condition` | `dict` | sí | `{}` | ABAC declarativo |
| `effect` | enum | sí | — | `"permit"` \| `"deny"` |
| `sourcing` | enum | sí | `"mongo_override"` | `"yaml_core"` \| `"mongo_override"` |
| `created_by` | `str` (user_id) | sí | — | quien creó (debe ser `admin` o `arroba_team`) |
| `created_at` | `datetime` | sí | now() | — |
| `updated_at` | `datetime` | sí | now() | — |
| `updated_by` | `str` (user_id) | no | `null` | quien hizo último update |
| `audit_reason` | `str` | sí | — | razón obligatoria al crear/modificar |
| `effective_from` | `datetime` | no | `null` | fecha desde la que aplica; default = `created_at`. **Alias canónico**: `valid_from` (ver §21). |
| `effective_until` | `datetime` | no | `null` | fecha de expiración opcional. **Alias canónico**: `valid_until` (ver §21). |
| `valid_from` | `datetime` | no | `null` | (forward-compatible, ver §21) sinónimo de `effective_from`. Si ambos presentes, debe coincidir. |
| `valid_until` | `datetime` | no | `null` | (forward-compatible, ver §21) sinónimo de `effective_until`. Si ambos presentes, debe coincidir. |

**Índices**:
- `policy_id` unique.
- `enabled` + `priority` (compuesto, descendente por priority).
- `action_match` (multikey).
- `resource_match.type` (extracted field).
- `effective_until` (TTL si quieres expiración automática).

**Validaciones**:
- `effect ∈ {"permit", "deny"}`.
- `subject_match`, `resource_match`, `condition` deben ser shapes válidos (ver §8).
- `sourcing = "yaml_core"` es **read-only** desde la API (solo el loader puede crear).
- Al crear `mongo_override`, `created_by.role_global ∈ {"admin", "arroba_team"}` enforced en el endpoint.

**Eventos**: `authz.policy.created`, `authz.policy.updated`, `authz.policy.disabled`, `authz.policy.deleted`.

### 4.2 `feature_flags`

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | ObjectId | sí | auto | — |
| `flag_id` | `str` (`flag_`) | sí | autogen | unique |
| `key` | `str` | sí | — | unique, slug-format (e.g., `new_match_ui`, `enable_kyc_strict`) |
| `description` | `str` | no | `null` | — |
| `enabled` | `bool` | sí | `false` | global toggle |
| `default_value` | `bool` | sí | `false` | valor si ninguna rule matches |
| `rules` | `list[dict]` | sí | `[]` | lista ordenada de condiciones (ver §10) |
| `created_by` | `str` (user_id) | sí | — | — |
| `created_at` | `datetime` | sí | now() | — |
| `updated_at` | `datetime` | sí | now() | — |
| `expires_at` | `datetime` | no | `null` | (forward-compatible, ver §21) TTL opcional global de la flag; al expirar, se devuelve `default_value` con `reason: "flag_expired"`. |
| `audit_reason` | `str` | sí | — | razón obligatoria |

**Índices**: `key` unique, `enabled`.

**Eventos**: `authz.feature_flag.created`, `authz.feature_flag.toggled`, `authz.feature_flag.deleted`.

### 4.3 `resource_acls` — concesiones persistentes a recursos específicos

> Usadas cuando la decisión NO se puede derivar de policies generales: ej. compartir un Data Room con un user externo específico, conceder acceso temporal de un advisor a una operación concreta.

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | ObjectId | sí | auto | — |
| `acl_id` | `str` (`acl_`) | sí | autogen | unique |
| `resource_type` | `str` | sí | — | de catálogo §7 |
| `resource_id` | `str` | sí | — | id específico |
| `subject_type` | enum | sí | — | `"user"` \| `"org"` \| `"team"` \| `"membership"` |
| `subject_id` | `str` | sí | — | id del subject |
| `roles_granted` | `list[str]` | sí | `[]` | roles efectivos sobre ese recurso (e.g., `["data_room.viewer"]`) |
| `actions_granted` | `list[str]` | sí | `[]` | acciones específicas (alternativa más fina a `roles_granted`) |
| `effect` | enum | sí | `"permit"` | normalmente permit; deny ACL es rare pero válido (ban de un user de UN recurso) |
| `granted_by` | `str` (user_id) | sí | — | con role apropiado (owner/admin de la org dueña del recurso) |
| `granted_at` | `datetime` | sí | now() | — |
| `valid_from` | `datetime` | no | `null` | (forward-compatible, ver §21) ventana de validez inferior; `null` = activa desde `granted_at`. |
| `expires_at` | `datetime` | no | `null` | TTL opcional (automatic revocation). **Alias canónico**: `valid_until` (ver §21). Mantenido por compatibilidad. |
| `valid_until` | `datetime` | no | `null` | (forward-compatible, ver §21) sinónimo de `expires_at`. Si ambos presentes, debe coincidir. |
| `revoked_at` | `datetime` | no | `null` | soft delete |
| `revoked_by` | `str` (user_id) | no | `null` | — |
| `reason` | `str` | sí | — | trazabilidad obligatoria |
| `context_event_id` | `str` | no | `null` | si nace de un evento (e.g., acceso por LOI firmada), referencia al evento del Transaction OS |

**Índices**:
- `(resource_type, resource_id, subject_id)` compuesto.
- `(subject_type, subject_id)`.
- `expires_at` (TTL).

**Eventos**: `authz.acl.granted`, `authz.acl.revoked`, `authz.acl.expired`.

### 4.4 `authz_audit_log` — registros persistidos de decisiones (con sampling)

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | ObjectId | sí | auto | — |
| `decision_id` | `str` (`dec_`) | sí | autogen | unique |
| `ts` | datetime | sí | now() | indexado |
| `subject_id` | `str` | sí | — | user_id o service_id |
| `subject_type` | enum | sí | — | `"user"` \| `"service"` |
| `subject_claims_snapshot` | `dict` | sí | — | claims usados (redactado: sin email plano si privacidad lo exige) |
| `action` | `str` | sí | — | acción evaluada |
| `resource_type` | `str` | sí | — | — |
| `resource_id` | `str` | no | `null` | nulo para acciones sobre recurso "tipo" sin id específico |
| `resource_context` | `dict` | sí | `{}` | atributos del resource usados |
| `effect` | enum | sí | — | `"permit"` \| `"deny"` |
| `policy_ids_matched` | `list[str]` | sí | `[]` | policies que contribuyeron |
| `policy_id_decisive` | `str` | no | `null` | la policy que determinó el effect final (en deny-overrides: la primera deny encontrada) |
| `reason` | `str` | sí | — | humano-legible |
| `latency_ms` | `int` | sí | — | total |
| `cache_hit` | `bool` | sí | `false` | — |
| `audit_level` | enum | sí | `"standard"` | `"standard"` \| `"extended"` (para `arroba_team` y casos sensibles) |
| `correlation_id` | `str` | no | `null` | request_id u operation_id si aplica |

**Índices**:
- `(subject_id, ts desc)`.
- `(effect, ts desc)`.
- `(action, ts desc)`.
- `(resource_type, resource_id, ts desc)`.

**Política de muestreo** (D-A.6):
- 100% de `deny` siempre persistidos.
- **1%** de `permit` persistidos (sampling estadístico).
- 100% de decisiones con `audit_level = "extended"` (ej. todas las del `arroba_team`).

**Retención**:
- 10 años para decisiones cuyo `resource_type ∈ {operation, nda, loi, spa, document_legal}` (alineado con `MEMORY_ENGINE §7`).
- 3 años para el resto.

**Eventos**: `authz.decision.permitted`, `authz.decision.denied` (estos eventos son emitidos siempre; el sampling controla solo la **persistencia** en este collection).

### 4.5 `authz_decision_cache` — caché in-process

> NO es una colección Mongo: es **estructura in-memory** declarada aquí para completar el modelo.

```
key = sha256(subject_id + action + resource_id + context_hash)
value = (effect, ts, ttl_seconds, policy_ids_matched)
ttl = 60s para permit, 0s para deny
eviction = LRU cap 10.000 entries por proceso
```

Invalidación explícita (ver §9.3) por eventos:
- `identity.user.role_global_changed`
- `identity.user.suspended` | `identity.user.kyc_verified` | `identity.user.kyc_failed` | `identity.user.kyc_expired`
- `identity.membership.role_changed` | `identity.membership.team_changed` | `identity.membership.revoked`
- `identity.org.archived` | `identity.org.suspended`
- `identity.team.archived`
- `subscription.plan.changed` (forward)
- `authz.policy.created` | `authz.policy.updated` | `authz.policy.disabled` | `authz.policy.deleted`
- `authz.feature_flag.toggled`
- `authz.acl.granted` | `authz.acl.revoked`

---

## 5. Catálogo canónico de roles

> Distinguimos **dos planos** de role:
>
> - **`role_global`** (en `users.role_global`, viaja en el JWT): categoría del actor a nivel plataforma.
> - **`membership.role`** (en `memberships.role`): rol funcional dentro de UNA organización.
>
> Authorization evalúa **ambos** según el contexto del recurso.

### 5.1 Tabla maestra de roles

| Rol | Plano | Descripción | Permisos base |
|---|---|---|---|
| **`anonymous`** | global | Sin sesión válida o token expirado | Lectura pública limitada (fichas anónimas, /api/plans, etc.) |
| **`subscriber`** | global | Usuario individual con plan Subscriber | Crear org propia, gestionar perfiles, consumir capabilities según plan |
| **`corporate`** | global | Usuario corporate (empleado de empresa cliente) | Acceso a operaciones de su org, gestionar mandatos buy-side/sell-side |
| **`investor`** | global | Inversor (PE/VC/family office/sovereign/corporate dev/individual) | Acceso a marketplace de oportunidades, evaluar deals, suscribir intereses |
| **`advisor`** | global | M&A advisor independiente o de boutique | Crear mandatos por clientes, gestionar matching cross-cliente, recibir Advisory Share |
| **`arroba_team`** | global | Equipo interno operadores de arroba.com | Mediación operativa (ver §12), escalamiento, supervisión documentada. **NO hereda `admin`** (C11) |
| **`admin`** | global | Admin de sistema (operaciones de plataforma) | Configuración global, gestión de planes, recovery, system-level. **NO sobreescribe §5.3 agentic** (E16) |
| **`owner`** | membership | Propietario administrativo de la org | Todo sobre su org (incluyendo archivar, transferir ownership) |
| **`admin`** | membership | Admin de org | Casi todo, **excepto** transferir ownership, archivar org final |
| **`operator`** | membership | Operador de org (ejecuta tareas) | Gestión de operaciones, lectura completa de org; **NO invitar** (decisión usuario) |
| **`member`** | membership | Miembro estándar | Acceso a recursos según teams asignados |
| **`guest`** | membership | Invitado limitado | Solo lo explícitamente concedido (típicamente vía `resource_acls`) |

### 5.2 Matriz de roles efectivos por contexto

**Regla canónica**: para una request `(subject, action, resource)`:

1. Si `resource` tiene `org_id`, se evalúa el `membership.role` del subject en esa org (si tiene membership activa).
2. Se evalúa también el `role_global` del subject.
3. Las policies combinan ambos vía `subject_match` (§8).

**Ejemplo**:
- Subject: user con `role_global = "advisor"`, membership en Org X con `role = "owner"`, membership en Org Y con `role = "operator"`.
- Action: `mandate.create` sobre `resource = { type: "mandate", org_id: "X" }`.
- Authorization evalúa: `subject_match.role_global = "advisor"` AND `subject_match.membership_role(org_id=X) = "owner"`. Permitido por policy `P-MANDATE-CREATE-OWNER`.
- Mismo subject sobre Org Y: `subject_match.membership_role(org_id=Y) = "operator"` → policy `P-MANDATE-CREATE-OWNER` no match. Si no hay policy con `operator`, deny default.

### 5.3 Reglas especiales

| Regla | Justificación canónica |
|---|---|
| `role_global = "admin"` **NO implica** `role_global = "arroba_team"` y viceversa. | C11 — Sprint 0 |
| `role_global = "admin"` **NO sobreescribe** los niveles agénticos (§5.3 de AGENTIC_LAYERS_SPEC). | E16 — Sprint 0 |
| `membership.role = "operator"` **NO puede** invitar (action `invitation.send`). | Decisión Sprint 1 usuario |
| `membership.role = "owner"` es **único por org** y se mueve solo vía ownership transfer (IDENTITY_SPEC §5.6). | IDENTITY_SPEC |
| Subject con `kyc_status != "verified"` **no puede** ejecutar acciones del catálogo `kyc_gated_actions` (definido §6). | Decisión Sprint 1 + verificación progresiva |

---

## 6. Catálogo canónico de acciones

> Lista **cerrada** de verbos canónicos. Cada acción es un string `{dominio}.{verbo}` o `{dominio}.{subdomain}.{verbo}`. Las policies referencian acciones de esta lista.

### 6.1 Dominio Identity (29 acciones)

```
user.read
user.read.private          (campos PII propios o admin)
user.update
user.delete                (soft, GDPR self-service o admin)
user.suspend               (admin/arroba_team)
user.reactivate            (admin/arroba_team)
user.change_role_global    (admin/arroba_team)

org.read
org.read.private           (campos sensibles: kyc, tax_id detail)
org.create
org.update
org.archive                (owner)
org.unarchive              (admin/arroba_team)
org.suspend                (admin compliance)
org.transfer_ownership     (owner)
org.vies_validate

membership.read
membership.update          (role, teams)
membership.suspend
membership.revoke

team.create
team.read
team.update
team.archive
team.transfer_ownership

invitation.send            (owner/admin only)
invitation.read
invitation.revoke
invitation.resend

profile.read
profile.read.private
profile.create
profile.update
profile.delete
```

### 6.2 Dominio Transaction OS (32 acciones)

```
opportunity.read
opportunity.read.detail
opportunity.create
opportunity.update
opportunity.archive

mandate.read
mandate.read.detail
mandate.create
mandate.update
mandate.assign_advisor
mandate.archive

match.read
match.read.detail
match.solicit                  (proponer a una contraparte)
match.accept                   (aceptar como contraparte)
match.decline
match.archive

operation.read
operation.read.detail
operation.create
operation.advance_phase
operation.assign_member
operation.archive

nda.read
nda.sign                       (kyc_gated)
nda.cancel

loi.submit                     (kyc_gated)
loi.read
loi.read.detail
loi.cancel

spa.draft
spa.sign                       (kyc_gated)
spa.read.detail

dd.task.read
dd.task.complete
dd.report.read
```

### 6.3 Dominio Capabilities (3 acciones genéricas + N parametrizadas)

```
capability.list                                # lista capabilities disponibles
capability.invoke.{CAP-XXX}                    # invocar capability X (parametrizado)
capability.read_history                         # leer histórico propio
```

> `{CAP-XXX}` se materializa en runtime con cada capability del catálogo de `AGENTIC_LAYERS_SPEC`. Las policies pueden hacer match por prefijo (e.g., `capability.invoke.CAP-005.*`).

### 6.4 Dominio Data Room (10 acciones, forward — modelado pero no implementado en Sprint 1)

```
dataroom.read
dataroom.list_documents
dataroom.upload_document
dataroom.download_document         (kyc_gated)
dataroom.delete_document
dataroom.create_folder
dataroom.share_with_user
dataroom.share_with_team
dataroom.revoke_share
dataroom.audit_access
```

### 6.5 Dominio Catálogo (entidades canónicas — 8 acciones)

```
company.read.public
company.read.private               (campos pre-NDA limitados)
sector.read
territory.read
valuation.read
valuation.read.detail              (gated por plan/kyc)
document.read.public
document.read.private
```

### 6.6 Dominio Authorization (mismo, 12 acciones)

```
policy.read
policy.create                      (admin/arroba_team)
policy.update                      (admin/arroba_team)
policy.disable                     (admin/arroba_team)
policy.delete                      (admin)

feature_flag.read
feature_flag.toggle                (admin)

acl.read
acl.grant
acl.revoke

audit_log.read                     (admin/arroba_team in mediation context)
audit_log.read.own                 (user lee sus propias decisiones)
```

### 6.7 Dominio Subscription (forward — declaradas para que las policies las puedan referenciar)

```
plan.read
plan.change                        (subject sobre su propia subscription)
quota.read
overage.approve                    (admin/arroba_team)
entitlement.read
credit.consume                     (interno, no exposable directamente)
```

### 6.8 Dominio Billing (forward)

```
invoice.read
invoice.read.own
payment_method.read.own
payment_method.update.own
checkout.start
billing.portal.access
economic_event.emit                (interno desde Transaction OS)
```

### 6.9 Acciones kyc-gated (canónicas)

Lista cerrada de acciones que **requieren** `subject.kyc_status = "verified"` (sin importar policy adicional):

```
nda.sign
loi.submit
spa.sign
dataroom.download_document
operation.advance_phase             (cuando target phase ∈ {dd, negotiation, spa, closing})
economic_event.emit                 (interno)
checkout.start
```

Para estas acciones, Authorization evalúa el claim `kyc_status` **antes** de las policies. Si `kyc_status != "verified"`, deny con `reason = "kyc_required"`.

### 6.10 Conteo total

- Identity: 29
- Transaction OS: 32
- Capabilities: 3 + N parametrizadas
- Data Room (forward): 10
- Catálogo: 8
- Authorization: 12
- Subscription (forward): 6
- Billing (forward): 7

**Total fijo declarado**: ~107 acciones canónicas en v1.0 (excluyendo capability parametrizadas, que crecen con cada CAP-XXX).

---

## 7. Catálogo canónico de recursos

> Lista cerrada de tipos de recurso. Cada uno con su modelo de identificación y atributos disponibles para policy matching.

### 7.1 Tabla maestra

| Tipo | Identificación | Atributos disponibles en `resource_match` |
|---|---|---|
| `user` | `user.{user_id}` | `user_id`, `role_global`, `org_id` (active), `kyc_status` |
| `organization` | `organization.{org_id}` | `org_id`, `org_type`, `status`, `country` |
| `team` | `team.{team_id}` | `team_id`, `org_id`, `is_default` |
| `membership` | `membership.{membership_id}` | `membership_id`, `user_id`, `org_id`, `role`, `team_ids` |
| `invitation` | `invitation.{invitation_id}` | `invitation_id`, `org_id`, `role`, `email` |
| `profile` | `profile.{kind}.{profile_id}` | `profile_id`, `user_id`, `kind` (∈ professional/advisor/corporate/investor) |
| `opportunity` | `opportunity.{opp_id}` | `opp_id`, `org_id`, `visibility`, `phase` |
| `mandate` | `mandate.{mandate_id}` | `mandate_id`, `org_id`, `advisor_user_id`, `side` (sell/buy), `status` |
| `match` | `match.{match_id}` | `match_id`, `match_type`, `phase`, `origin_org_id`, `destination_org_id`, `score` |
| `operation` | `operation.{op_id}` | `op_id`, `org_id` (buyer + seller), `current_phase`, `journey_phase`, `target_company_id` |
| `nda` | `nda.{nda_id}` | `nda_id`, `operation_id`, `signers[]` |
| `loi` | `loi.{loi_id}` | `loi_id`, `operation_id`, `submitter_user_id`, `submitter_org_id` |
| `spa` | `spa.{spa_id}` | `spa_id`, `operation_id`, `signers[]`, `status` |
| `dd_task` | `dd_task.{task_id}` | `task_id`, `operation_id`, `assignee_user_id` |
| `dd_report` | `dd_report.{report_id}` | `report_id`, `operation_id`, `visibility` |
| `company` | `company.{cif}` | `cif`, `country`, `sector`, `visibility` |
| `sector` | `sector.{slug}` | `slug` |
| `territory` | `territory.{slug}` | `slug` |
| `valuation` | `valuation.{valuation_id}` | `valuation_id`, `company_cif`, `org_id` (requester), `visibility` |
| `document` | `document.{document_id}` | `document_id`, `org_id`, `dataroom_id`, `kind`, `visibility` |
| `dataroom` | `dataroom.{dataroom_id}` | `dataroom_id`, `operation_id`, `visibility` |
| `capability_invocation` | `capability_invocation.{inv_id}` | `inv_id`, `capability_id`, `user_id`, `current_level` |
| `authorization` | `authorization.{authorization_id}` | `authorization_id`, `capability_id`, `granted_at`, `expires_at` (de AGENTIC_LAYERS_SPEC L4) |
| `policy` | `policy.{policy_id}` | `policy_id`, `sourcing` (yaml_core/mongo_override) |
| `feature_flag` | `feature_flag.{flag_id}` | `flag_id`, `enabled` |
| `acl` | `acl.{acl_id}` | `acl_id`, `resource_type`, `resource_id`, `subject_type` |
| `audit_log_entry` | `audit_log_entry.{decision_id}` | `decision_id`, `subject_id`, `audit_level` |
| `subscription` (forward) | `subscription.{sub_id}` | (definido en SUBSCRIPTION_SPEC) |
| `invoice` (forward) | `invoice.{inv_id}` | (definido en BILLING_SPEC) |

### 7.2 Atributos universales disponibles

Todos los recursos exponen estos atributos genéricos para policy matching (cuando aplique):
- `created_by` (user_id)
- `owner_id` (user_id)
- `created_at`, `updated_at`
- `status` o equivalente

### 7.3 Resolución de `org_id` del recurso

Las policies normalmente comparan `subject.active_org_id` o `subject.memberships[].org_id` con `resource.org_id`. Cuando el recurso tiene múltiples `org_id` (ej. `operation` tiene buyer y seller), la sintaxis declarativa permite:

```yaml
resource_match:
  type: "operation"
  org_id_in: ["{{subject.active_org_id}}"]   # match si subject.active_org_id ∈ {buyer_org_id, seller_org_id}
```

### 7.4 Atributos sensibles redactados en audit

Algunos atributos NO se incluyen en `audit_log.resource_context` por privacidad:
- `user.email` → solo `user_id`.
- `mandate.target_company_id` cuando `operation.current_phase = "nda"` (no se ha firmado NDA) → solo `match_id`.
- `valuation.detail_values` → solo `valuation_id` + `visibility`.

---

## 8. Schema canónico de policy (declarativa)

### 8.1 Estructura YAML core (deployment-time, inmutable)

```yaml
# /app/backend/policies/identity/P-IDENTITY-MEMBER-001.yaml

policy_id: "P-IDENTITY-MEMBER-001"
name: "Owners and admins can manage memberships in their own org"
description: |
  Permite a owners/admins de una org gestionar (read/update/suspend/revoke) las
  memberships de esa org. No aplica cross-org.
priority: 100
enabled: true
sourcing: yaml_core

subject_match:
  role_global_in: ["subscriber", "corporate", "investor", "advisor", "arroba_team", "admin"]
  membership_role_in_active_org: ["owner", "admin"]
  identity_tier_in: ["internal"]   # forward; en v1.0 redundante pero declarado

resource_match:
  type: "membership"
  org_id: "{{subject.active_org_id}}"

action_match:
  - "membership.read"
  - "membership.update"
  - "membership.suspend"
  - "membership.revoke"

condition:
  all_of:
    - claim: "kyc_status"
      not_in: ["suspended_kyc_review"]
    - claim: "active_org_id"
      not_null: true

effect: permit
```

### 8.2 Variables interpoladas

Sintaxis Jinja-like restringida a un subconjunto seguro:

| Variable | Origen | Ejemplo |
|---|---|---|
| `{{subject.user_id}}` | claim | `user_xxxx` |
| `{{subject.active_org_id}}` | claim | `org_xxxx` |
| `{{subject.role_global}}` | claim | `"advisor"` |
| `{{subject.memberships}}` | claim | lista |
| `{{subject.kyc_status}}` | claim | `"verified"` |
| `{{subject.risk_score}}` | claim | `12` |
| `{{subject.profile_kinds}}` | claim | `["advisor"]` |
| `{{subject.identity_tier}}` | claim forward | `"internal"` |
| `{{subject.fiscal_entity_id}}` | claim forward | `null` |
| `{{subject.plan}}` | claim forward (Subscription) | `"corporate_pro"` |
| `{{subject.arroba_team_flag}}` | claim | `true`/`false` |
| `{{resource.org_id}}` | attribute | `org_yyyy` |
| `{{resource.type}}` | attribute | `"operation"` |
| `{{context.ip}}` | runtime | `"1.2.3.4"` |
| `{{context.now}}` | runtime | timestamp |
| `{{context.feature_flag(<key>)}}` | runtime evaluator | boolean |

> Las variables son **read-only**. No hay funciones aritméticas ni concatenación de strings en el DSL.

### 8.3 Operadores de match

#### En `subject_match` y `resource_match`:

```yaml
field: "literal_value"             # equals
field_in: ["a", "b"]               # in
field_not_in: ["c"]                # not in
field_starts_with: "prefix_"
field_matches_regex: "^pattern$"
field_null: true | false           # is null
membership_role_in_active_org: ["owner", "admin"]   # shortcut canónico
membership_role_in_org: { org_id: "{{subject.active_org_id}}", roles: ["owner"] }
team_membership_includes: "team_xxx"
```

#### En `condition` (ABAC):

```yaml
condition:
  all_of:
    - claim: "plan"
      in: ["corporate_pro", "advisor_pro"]
    - claim: "kyc_status"
      eq: "verified"
    - claim: "risk_score"
      lte: 50
  any_of: []
  not:
    - claim: "kyc_status"
      eq: "expired"
```

Combinadores: `all_of`, `any_of`, `not`. Anidables.

### 8.4 Sintaxis canónica de `effect`

`effect: permit` o `effect: deny`. No hay `effect: maybe` ni efectos parametrizados.

### 8.5 Validación de policies al cargar

Al arrancar (YAML core) o al crear (Mongo override), el motor valida:
- `policy_id` único.
- `subject_match`, `resource_match`, `action_match`, `condition` shapes válidos.
- Todas las acciones en `action_match` pertenecen al catálogo §6.
- Todos los `resource_match.type` pertenecen al catálogo §7.
- Todas las variables `{{...}}` interpoladas son resolvables.
- `priority ∈ [50, 9999]` (50-99 reservado a core, 100-9000 a overrides, 9001-9999 a emergencias).

Falla de validación: policy NO se carga (YAML) o create NO se acepta (Mongo override) con error explícito.

### 8.6 Organización de YAML core en disco

```
/app/backend/policies/
├── identity/
│   ├── P-IDENTITY-USER-001.yaml         # user.read public
│   ├── P-IDENTITY-USER-002.yaml         # user.update self
│   ├── P-IDENTITY-MEMBER-001.yaml       # member management owner/admin
│   ├── P-IDENTITY-INVITE-001.yaml       # invite only owner/admin
│   └── ...
├── transaction_os/
│   ├── P-OP-001.yaml                    # operation.read for org members
│   ├── P-NDA-001.yaml                   # nda.sign kyc-gated
│   └── ...
├── capabilities/
│   ├── P-CAP-001.yaml                   # capability.list for authenticated
│   ├── P-CAP-005.yaml                   # capability.invoke.CAP-005
│   └── ...
├── catalog/
│   ├── P-COMPANY-001.yaml               # company.read.public
│   └── ...
├── authorization/
│   ├── P-POLICY-001.yaml                # policy.read/create admin only
│   └── ...
└── arroba_team/
    ├── P-AT-MEDIATION-001.yaml          # arroba_team mediation rules
    └── ...
```

### 8.7 Ejemplo completo — policy crítica de `arroba_team`

```yaml
policy_id: "P-AT-AUDIT-LOG-READ-001"
name: "arroba_team can read audit logs during active mediation"
description: |
  arroba_team puede leer audit logs cross-user SOLO cuando existe
  una mediación activa (registrada en mediations collection) que
  cubra el subject del audit_log_entry.
  
  Cierra OPEN-B2 del Sprint 0.
priority: 200
enabled: true
sourcing: yaml_core

subject_match:
  role_global: "arroba_team"

resource_match:
  type: "audit_log_entry"

action_match:
  - "audit_log.read"

condition:
  all_of:
    - context: "mediation_active_for_subject"
      eq: true
    - claim: "kyc_status"
      eq: "verified"

effect: permit

audit_level: extended                 # Toda decisión sobre esta policy queda 100% en audit
required_audit_reason: true           # arroba_team debe declarar razón al acceder
```

---

## 9. Motor de decisión

### 9.1 Algoritmo canónico

```
def check(subject_claims, action, resource, context) -> Decision:
    # 1. Pre-flight: kyc-gated actions
    if action in KYC_GATED_ACTIONS and subject_claims.kyc_status != "verified":
        return Decision(deny, reason="kyc_required", policy_decisive="(builtin: kyc_gate)")

    # 2. Pre-flight: identity_tier check (forward)
    # En v1.0 noop pero el contrato existe.
    if subject_claims.identity_tier == "external" and action not in EXTERNAL_ALLOWED_ACTIONS:
        return Decision(deny, reason="external_identity_restricted", policy_decisive="(builtin: external_gate)")

    # 3. Cache lookup
    cache_key = sha256(subject_claims.user_id, action, resource.id, context.hash())
    cached = cache.get(cache_key)
    if cached is not None:
        return cached.with_cache_hit()

    # 4. Filtrar policies aplicables
    policies = policy_store.filter(
        action=action,
        resource_type=resource.type,
        enabled=True,
        effective_at=context.now
    )

    matched = []
    for policy in sort_by_priority_desc(policies):
        if matches(policy.subject_match, subject_claims) \
           and matches(policy.resource_match, resource) \
           and evaluates_true(policy.condition, subject_claims, resource, context):
            matched.append(policy)

    # 5. ACLs específicas (overlay)
    acl_decisions = check_resource_acls(subject_claims, action, resource)

    # 6. Combinar con deny-overrides
    all_effects = [p.effect for p in matched] + [a.effect for a in acl_decisions]
    if "deny" in all_effects:
        effect = "deny"
        decisive = first_deny(matched + acl_decisions)
        reason = decisive.reason or "denied_by_policy"
    elif "permit" in all_effects:
        effect = "permit"
        decisive = highest_priority_permit(matched)
        reason = "permitted_by_policy"
    else:
        effect = "deny"
        decisive = None
        reason = "no_matching_policy_default_deny"

    # 7. Cachear
    cache.put(cache_key, effect, ttl=60 if effect == "permit" else 0)

    # 8. Audit (con sampling)
    sample = (effect == "deny") or (random() < 0.01) or (decisive and decisive.audit_level == "extended")
    if sample:
        persist_audit_log(...)

    # 9. Emit eventos
    emit("authz.decision.permitted" or "authz.decision.denied", ...)

    return Decision(effect, reason, matched, latency_ms)
```

### 9.2 Latencias objetivo

| Caso | P50 | P95 | P99 |
|---|---:|---:|---:|
| Cache hit | <0.5 ms | <2 ms | <5 ms |
| Cache miss (sin cross-module fetch) | <5 ms | <20 ms | <40 ms |
| Cache miss + cross-module fetch (e.g., post-invalidation) | <15 ms | <50 ms | <100 ms |
| Bulk check (lista de N decisions) | linear con caching agresivo | — | — |

Benchmark target: 10.000 decisiones/segundo por proceso.

### 9.3 Caché in-process

**Estructura**: LRU diccionario en memoria, cap 10.000 entries por proceso.

**Cache key**:
```
sha256_hex(
   subject.user_id +
   action +
   resource.type + resource.id +
   sha256(canonical_json(context_relevant))
)
```

`context_relevant` solo incluye los campos del context que pueden cambiar la decisión (ej. `feature_flags_evaluated`, hora del día si alguna policy la usa). Esto se computa al cargar las policies (extracted dependencies).

**TTL**:
- `permit`: **60 segundos**.
- `deny`: **0 segundos** (NO cacheado). Razón: corrección de policy (otorgar acceso) debe propagarse inmediatamente.

**Invalidación por evento**:

| Evento | Invalidación |
|---|---|
| `identity.user.role_global_changed { user_id }` | `cache.invalidate_by_subject(user_id)` |
| `identity.user.suspended` / `deleted` / `kyc_*` | `cache.invalidate_by_subject(user_id)` |
| `identity.membership.role_changed` / `team_changed` / `revoked` | `cache.invalidate_by_subject(user_id)` |
| `identity.org.archived` / `suspended` | `cache.invalidate_by_resource_org(org_id)` (todas las decisiones donde resource.org_id == X) + `cache.invalidate_by_subject_with_membership(org_id)` |
| `identity.team.archived` | `cache.invalidate_by_resource_team(team_id)` |
| `subscription.plan.changed { customer_id }` (forward) | `cache.invalidate_by_subject(user_id)` o `cache.invalidate_by_org(org_id)` según ámbito del plan |
| `authz.policy.created/updated/disabled/deleted` | `cache.invalidate_all()` |
| `authz.feature_flag.toggled` | `cache.invalidate_all()` (las flags pueden afectar muchas policies; invalidación gruesa es segura) |
| `authz.acl.granted/revoked` | `cache.invalidate_by_resource(type, id)` |

### 9.4 Multi-proceso y consistencia

En despliegue v1 con 1 proceso uvicorn, la caché es local y los eventos se procesan in-process. Cuando escalemos a N réplicas:

- **Opción A (preferida v1)**: cache local + eventos vía pub/sub Redis. Cada réplica invalida su caché al recibir el evento.
- **Opción B**: cache compartida Redis (mayor latencia). No recomendada para v1.

Authorization NO necesita garantías estrictas de consistencia entre réplicas: el TTL 60s acota la inconsistencia máxima.

### 9.5 Modo de fallo (degradación elegante)

Si el motor falla en cargar las policies de YAML al arrancar:
- **Modo seguro**: el motor arranca con **default deny global** y emite alerta a `arroba_team`. Solo `admin` puede recuperarlo vía endpoint de recovery.

Si una policy en runtime lanza excepción durante evaluación:
- Se loguea con `policy_id`.
- Esa policy se ignora (no match) — NO crasha la request.
- Si el ratio de excepciones supera 1% en 1 min, la policy se desactiva automáticamente con alerta.

### 9.6 Composición con feature flags

Las policies pueden referenciar feature flags vía `{{context.feature_flag(<key>)}}`:

```yaml
condition:
  all_of:
    - context: "feature_flag('enable_strict_kyc')"
      eq: true
```

El evaluator de la flag se invoca lazily al evaluar la policy.

---

## 10. Feature flags

### 10.1 Modelo de evaluación

Una feature flag se evalúa con el siguiente algoritmo:

```
def is_enabled(flag_key, subject_claims) -> bool:
    flag = feature_flags.find(key=flag_key)
    if not flag or not flag.enabled:
        return False

    for rule in flag.rules:
        if rule_matches(rule, subject_claims):
            return rule.value
    return flag.default_value
```

### 10.2 Schema de rule

```json
{
  "rule_id": "r_xxx",
  "match": {
    "role_global_in": ["advisor", "investor"],
    "plan_in": ["corporate_pro", "advisor_pro"],
    "org_id_in": ["org_aaa"],
    "kyc_status": "verified",
    "percent_rollout": 25
  },
  "value": true,
  "priority": 100
}
```

**`percent_rollout`**: 0-100. Hash deterministically `(flag_key, subject.user_id)` → bucket 0-99. Si bucket < `percent_rollout`, match. Permite rollouts graduales estables.

Las rules se evalúan ordenadas por `priority` descendente; primera match gana.

### 10.3 Patrones de uso

| Patrón | Ejemplo |
|---|---|
| Feature gating | `is_enabled("new_match_ui", claims)` → mostrar nueva UI |
| Kill switch | `is_enabled("matching_engine_v2", claims)` → si false, fallback a v1 |
| Beta access | rules con `org_id_in: [...]` para early adopters |
| Gradual rollout | `percent_rollout: 10` → 20 → 50 → 100 |

### 10.4 Evaluación desde policies

Una policy puede referenciar:
```yaml
condition:
  all_of:
    - context: "feature_flag('experimental_match_ux')"
      eq: true
```

Esto permite **policies condicionadas por flag**: ej. permitir una acción solo a usuarios en el rollout.

### 10.5 Eventos

```
authz.feature_flag.created { flag_id, key, default_value, created_by }
authz.feature_flag.toggled { flag_id, key, enabled_before, enabled_after, by }
authz.feature_flag.rule_added { flag_id, rule_id }
authz.feature_flag.evaluated { flag_id, key, subject_id, result } (sampleado 0.1% para metrics)
```

### 10.6 Audit

Toda creación/modificación/eliminación de flag persiste:
- `actor_user_id` (debe ser `admin`).
- `audit_reason` obligatoria.
- `before_snapshot` / `after_snapshot`.

---

## 11. Resource-level ACL

### 11.1 Cuándo usar ACL vs policy

| Escenario | Solución canónica |
|---|---|
| Owner de org X puede gestionar memberships de X | **Policy** (declarativa, aplica a todos los owners de cualquier org) |
| Advisor externo invitado al Data Room de operación Y específica | **ACL** (`resource_acls`) — no es expresable como policy general |
| Operator de org X puede ver TODAS las operations de X | **Policy** |
| User Z compartió la oportunidad W con user Z' por enlace | **ACL** |
| Ban de user H del Data Room de operación K (excepción) | **ACL con `effect = deny`** |
| Acceso temporal del notario externo a un SPA durante 7 días | **ACL con `expires_at`** |

**Regla**: si la decisión depende de **datos persistidos** (ej. "el user X fue específicamente invitado a este recurso Y"), es ACL. Si depende solo de **atributos del subject** (role, plan, kyc), es policy.

### 11.2 Flujo de concesión

```
1. owner/admin de org dueña → POST /api/authz/acl/grant
     {resource_type, resource_id, subject_type, subject_id,
      roles_granted | actions_granted, expires_at, reason}
2. Sistema valida:
     - granted_by tiene autoridad sobre el resource (owner/admin de la org dueña)
     - subject_id existe (si tipo "user")
     - resource_id existe
     - expires_at razonable (si null o futuro)
3. Sistema crea resource_acls entry
4. Evento authz.acl.granted
5. Invalida cache para (resource_type, resource_id)
```

### 11.3 Evaluación

`check_resource_acls(subject, action, resource)`:
- Busca entries en `resource_acls` donde:
  - `resource_type` + `resource_id` match resource.
  - `subject_type + subject_id` match subject (o `subject_type = "team"` y subject.member_of(team_id)).
  - `expires_at IS NULL OR expires_at > now`.
  - `revoked_at IS NULL`.
- Si action ∈ `actions_granted`: produce `permit`.
- Si `effect = "deny"`: produce `deny` (rara, pero válida).
- Si match con `roles_granted`: se mapea a permisos del rol (definidos en otra tabla canónica).

### 11.4 ACL vs policy: cómo se combinan

ACL y policy producen ambos un `Decision`. Se combinan con **deny-overrides** igual que policies entre sí:
- Si ACL dice `permit` y policy dice `deny` → **deny**.
- Si ACL dice `deny` y policy dice `permit` → **deny**.
- Si ACL dice `permit` y no hay policy match → **permit** (porque la ACL es explícita).
- Si ACL no aplica y policies no match → **deny** (default).

### 11.5 Expiración automática

Las ACL con `expires_at` se purgan vía TTL Mongo. Al expirar:
- Evento `authz.acl.expired`.
- Invalidación de caché.

### 11.6 Uso típico (Sprint 1 vs forward)

| Caso | Sprint 1 | Forward |
|---|---|---|
| ACLs para identidades externas | Mínimo (sólo `guest` membership) | Plenas (`external_relationships` §18 IDENTITY_SPEC) |
| ACLs para Data Room sharing | No (Data Room no implementado en Sprint 1) | Sí |
| ACLs para mandate sharing | No | Sí |
| ACLs para deny específico | Soportado | Soportado |

---

## 12. `arroba_team` — el rol especial

> Esta sección **cierra OPEN-B2 del Sprint 0** y declara el contrato completo del rol `arroba_team`.

### 12.1 Naturaleza del rol

`arroba_team` es el rol asignado a los **operadores internos** del equipo arroba.com. Su función es **mediación operativa**:
- Resolver disputas entre contrapartes.
- Asistir users en situaciones bloqueantes.
- Supervisar operaciones de alto riesgo.
- Ejecutar acciones administrativas que ningún usuario externo puede.

**NO es un admin glorificado**. Sus permisos son **acotados** y siempre **auditados**.

### 12.2 Permisos canónicos (matriz operativa)

| Acción | Permiso `arroba_team` | Condición |
|---|---|---|
| **Identity** | | |
| `user.read.private` (cross-user) | ✅ permitido | sólo durante mediación activa registrada |
| `user.suspend` / `reactivate` | ✅ | con `audit_reason` obligatoria |
| `user.change_role_global` | ❌ | **NO** (solo `admin`) |
| `user.delete` | ❌ | **NO** (solo `admin` y solo GDPR) |
| `org.suspend` | ✅ | con `audit_reason` |
| `org.read.private` cross-org | ✅ | mediación activa |
| `org.transfer_ownership` | ❌ | NO (decisión del owner actual) |
| **Transaction OS** | | |
| `operation.read.detail` cross-org | ✅ | mediación activa registrada para esa operation |
| `operation.advance_phase` | ❌ | NO (decisión de las contrapartes) |
| `nda.cancel` | ✅ | mediación activa + ambas contrapartes consintieron |
| `loi.read.detail` cross-org | ✅ | mediación activa |
| `match.solicit` / `accept` | ❌ | NO (no opera como contraparte) |
| **Authorization** | | |
| `audit_log.read` cross-user | ✅ | sólo dentro de scope de mediación activa (policy P-AT-AUDIT-LOG-READ-001) |
| `policy.create` / `update` | ✅ | con `audit_reason` y aprobación cruzada (futuro: dos `arroba_team` deben aprobar; v1: un `arroba_team` con audit obligatorio) |
| `policy.delete` | ❌ | NO (sólo `admin`) |
| `feature_flag.toggle` | ✅ | con `audit_reason` |
| **Capabilities** | | |
| `capability.invoke.{CAP-XXX}` | ✅ con restricciones | NO puede sobreescribir `current_level` agéntico §5.3 (resolución E16) |
| `capability.read_history` cross-user | ✅ | mediación activa |
| **Subscription/Billing (forward)** | | |
| `plan.change` cross-customer | ✅ | con `audit_reason` (asistencia comercial) |
| `overage.approve` | ✅ | — |
| `invoice.read` cross-customer | ✅ | mediación activa o asistencia |

### 12.3 Concepto de "mediación activa"

Una **mediación** es un objeto canónico (colección `mediations`, no declarada en este spec — se define en `MEMORY_ENGINE_SPEC §15` forward) que registra:
- `mediation_id`
- `mediator_user_id` (un `arroba_team`)
- `subjects_covered` (users / orgs / operations)
- `started_at`
- `expires_at` (default 7 días, renovable con justificación)
- `reason`
- `audit_trail`

Una mediación es **explícita**: el `arroba_team` la inicia formalmente vía endpoint, registra el motivo, y la mediación queda en log. Solo durante mediación activa el `arroba_team` puede invocar permisos cross-user/cross-org sensibles.

**Sin mediación activa**, `arroba_team` opera como un user normal con permisos limitados (lectura pública, acciones sobre sus propias entidades).

### 12.4 Audit reforzado

Toda acción de `arroba_team` con `audit_level = "extended"`:
- Persistida 100% en `authz_audit_log` (sin sampling).
- Notificación opcional al sujeto afectado (configurable por policy).
- Revisión periódica mensual por `admin`.

### 12.5 Restricciones canónicas

| Restricción | Justificación |
|---|---|
| `arroba_team` NO hereda permisos de `admin` | C11 Sprint 0 |
| `arroba_team` NO puede sobreescribir niveles agénticos §5.3 | E16 Sprint 0 |
| `arroba_team` NO puede operar como contraparte en una operación M&A | Conflicto de interés |
| `arroba_team` NO puede ver `audit_log` fuera de mediación activa | OPEN-B2 Sprint 0 |
| `arroba_team` NO puede modificar `users.email` o `users.password_hash` | Inmutables a este rol |

### 12.6 Onboarding de `arroba_team`

Un user con `role_global = "arroba_team"` se asigna SOLO por `admin` con `audit_reason`. No hay path de auto-promoción. Cuando se asigna:
- Evento `identity.user.role_global_changed { from: X, to: "arroba_team" }`.
- Notificación al user.
- Onboarding obligatorio (futuro: training).

### 12.7 Offboarding

Cuando un user deja de ser `arroba_team`:
- `admin` ejecuta `user.change_role_global` con `audit_reason`.
- Todas sus mediaciones activas pasan a `closed_force` con notificación al `admin`.
- Revoke todas las sessions del user.
- 30 días de retención del audit_log con `audit_level = extended` accesible para auditoría externa.

---

## 13. Audit log y sampling

### 13.1 Política de muestreo (D-A.6)

| Caso | Persistencia |
|---|---|
| `effect = "deny"` (cualquier subject) | **100%** |
| `effect = "permit"` (caso general) | **1%** (sampling random) |
| Cualquier decisión con `audit_level = "extended"` | **100%** |
| Cualquier decisión de subject con `role_global = "arroba_team"` | **100%** |
| Cualquier decisión sobre recurso de tipo `nda`, `loi`, `spa`, `economic_event`, `dataroom` | **100%** |
| Cualquier decisión durante `mediation_active` | **100%** |

El sampling se controla en runtime con flag `authz.audit.permit_sampling_rate` (default 0.01). Configurable por `admin`.

### 13.2 Estructura del log entry

Ver §4.4 (`authz_audit_log`).

### 13.3 Retención

Categoría A — vinculados a operación M&A formalizada:
- Decisiones cuyo `resource_type ∈ {operation, nda, loi, spa, dd_report, economic_event, dataroom}`.
- **Retención: 10 años** (alineado con `MEMORY_ENGINE §7` y obligación legal estimada).

Categoría B — resto:
- **Retención: 3 años** (resolución OPEN-C14 Sprint 0).

### 13.4 Acceso al audit log

| Quién | Qué puede leer | Cómo |
|---|---|---|
| `admin` | Todo | `GET /api/authz/audit-log?...` |
| `arroba_team` | Solo dentro de `mediation_active` (cierre B2) | mismo endpoint con check de mediación |
| User regular | Solo sus propios DENY recientes | `GET /api/authz/me/decisions/recent` |
| External (Risk & Compliance Service) | Stream filtrado (forward dependency) | webhook futuro |

### 13.5 Forward: integración con Risk & Compliance Service

El Risk & Compliance Service (RCS) es un servicio externo previsto (forward dependency declarada en `MEMORY_ENGINE_SPEC §15`). El RCS puede:
- Suscribirse a un stream de denegaciones (eventos `authz.decision.denied`).
- Analizar patrones cross-user (anti-fraud, money laundering, etc.).
- **NO** tiene acceso directo a `authz_audit_log` para queries arbitrarias; consume stream.

### 13.6 Privacidad en audit

El `subject_claims_snapshot` redacta antes de persistir:
- `email`: hash + dominio (`hash:abc1234@example.com`).
- `phone`: hash.
- `kyc_provider_ref`: completamente.
- `risk_score`: preservado.

---

## 14. Eventos canónicos del Authorization Engine

### 14.1 Catálogo

```
authz.policy.created
authz.policy.updated
authz.policy.disabled
authz.policy.enabled
authz.policy.deleted

authz.feature_flag.created
authz.feature_flag.toggled
authz.feature_flag.rule_added
authz.feature_flag.rule_removed
authz.feature_flag.deleted
authz.feature_flag.evaluated         (sampled 0.1%)

authz.decision.permitted
authz.decision.denied

authz.acl.granted
authz.acl.revoked
authz.acl.expired

authz.cache.invalidated_for_subject
authz.cache.invalidated_for_resource
authz.cache.invalidated_for_org
authz.cache.invalidated_all

authz.engine.policy_load_failed
authz.engine.degraded_mode_entered
authz.engine.degraded_mode_exited
authz.engine.high_deny_rate_detected   (alerta automática)
```

### 14.2 Estructura común

Idéntica a Identity events (§11.2 de IDENTITY_SPEC). Productor: `Authorization Engine`. Consumidores: Risk & Compliance (forward), Notification Service (sólo para denegaciones críticas), Memory Engine (para almacenar contexto), Monitoring/Observability.

### 14.3 Productores y consumidores

| Evento | Productor | Consumidores |
|---|---|---|
| `authz.decision.permitted` | Authz Engine | Monitoring (latencia, throughput) |
| `authz.decision.denied` | Authz Engine | Risk & Compliance (forward), UX (notificación al user si aplica), Monitoring |
| `authz.policy.created/updated/deleted` | Admin/`arroba_team` via API | Audit, Monitoring |
| `authz.feature_flag.toggled` | Admin via API | Cache invalidation, Frontend (refresh) |
| `authz.acl.granted/revoked/expired` | API or TTL | Cache invalidation |
| `authz.engine.degraded_mode_entered` | Sistema (fallo) | Alert manager (PagerDuty equiv.) |

---

## 15. APIs canónicas (mapa)

### 15.1 Policies (admin / `arroba_team` only)

| Verbo | Path | Propósito |
|---|---|---|
| GET | `/api/authz/policies` | Lista policies. Filtros por `enabled`, `sourcing`, `action`, `resource_type`. |
| GET | `/api/authz/policies/{policy_id}` | Detalle. |
| POST | `/api/authz/policies` | Crea Mongo override. Body: shape canónico §8. Header `X-Audit-Reason` obligatorio. |
| PATCH | `/api/authz/policies/{policy_id}` | Update Mongo override. NO permite YAML core. |
| POST | `/api/authz/policies/{policy_id}/disable` | Disable rápido (toggle `enabled = false`). |
| POST | `/api/authz/policies/{policy_id}/enable` | Reactivar. |
| DELETE | `/api/authz/policies/{policy_id}` | Hard delete (solo `admin`, Mongo override). |
| POST | `/api/authz/policies/validate` | Valida YAML/JSON sin persistir (dry-run). |
| POST | `/api/authz/policies/reload-yaml` | Recarga YAML core desde disco (admin). |

### 15.2 Feature flags

| Verbo | Path | Propósito |
|---|---|---|
| GET | `/api/authz/feature-flags` | Lista. |
| GET | `/api/authz/feature-flags/{flag_id}` | Detalle. |
| POST | `/api/authz/feature-flags` | Crea (admin). |
| PATCH | `/api/authz/feature-flags/{flag_id}` | Update incl. toggle. |
| DELETE | `/api/authz/feature-flags/{flag_id}` | Hard delete. |
| GET | `/api/authz/feature-flags/evaluate?key={k}` | Evalúa la flag para el subject actual. |

### 15.3 Decision check (interno + SDK + REST)

| Verbo | Path | Propósito |
|---|---|---|
| POST | `/api/authz/check` | Body: `{action, resource, context?}`. Subject derivado del token. Response: `200 {effect: permit, reason, policy_ids_matched}` o `403 {effect: deny, reason}`. |
| POST | `/api/authz/check/batch` | Body: lista de `(action, resource)`. Response: lista de decisions. |

**SDK Python interno** (cross-module):
```python
from src.modules.authz import check, require

# Function-style
decision = check(action="operation.read", resource=op, claims=current_claims)

# Decorator-style (FastAPI)
@require("operation.read", resource_extractor=lambda req: get_operation(req.path_params["op_id"]))
async def get_operation_endpoint(...): ...
```

### 15.4 ACLs

| Verbo | Path | Propósito |
|---|---|---|
| GET | `/api/authz/acl?resource_type={t}&resource_id={id}` | Lista ACLs sobre un recurso. |
| GET | `/api/authz/acl/by-subject?subject_type={t}&subject_id={id}` | Lista ACLs concedidas a un subject. |
| POST | `/api/authz/acl/grant` | Concede. Auth check: granter debe tener autoridad sobre el recurso. |
| POST | `/api/authz/acl/revoke/{acl_id}` | Revoca. |

### 15.5 Audit log

| Verbo | Path | Propósito |
|---|---|---|
| GET | `/api/authz/audit-log?{filters}` | Lista (admin / `arroba_team` en mediación). Filtros: `subject_id`, `action`, `resource_type`, `effect`, `from`, `to`. |
| GET | `/api/authz/audit-log/{decision_id}` | Detalle. |

### 15.6 Self-service `me`

| Verbo | Path | Propósito |
|---|---|---|
| GET | `/api/authz/me/permissions` | Devuelve un resumen "qué puedo hacer" para el subject actual. Útil para UX (mostrar/ocultar botones). |
| GET | `/api/authz/me/feature-flags` | Devuelve el map de flags evaluadas para el subject. |
| GET | `/api/authz/me/decisions/recent` | Lista las últimas N denegaciones del subject (para que sepa por qué no puede hacer X). |

### 15.7 Mediación (administra el contexto de `arroba_team`)

| Verbo | Path | Propósito |
|---|---|---|
| POST | `/api/authz/mediations/start` | `arroba_team` inicia mediación. Body: `{subjects_covered[], reason, expected_duration}`. |
| GET | `/api/authz/mediations/active` | Mediaciones del `arroba_team` actual. |
| POST | `/api/authz/mediations/{id}/close` | Cierra mediación. |
| POST | `/api/authz/mediations/{id}/extend` | Extiende `expires_at` con justificación. |

---

## 16. Integración forward con SUBSCRIPTION_SPEC

> Cómo Authorization se conecta con Subscription cuando esta llegue (Fase 1.0.3 del Sprint 1).

### 16.1 Claim joiner

Subscription expondrá el accessor:
```python
subscription.get_plan_claim(user_id, active_org_id) -> PlanClaim
# PlanClaim = { plan_key, plan_tier, entitlements[], quota_state, payment_status }
```

Authentication/Identity ya carga claims al emitir JWT; en el **refresh** o cada **N segundos cacheado**, se invoca `subscription.get_plan_claim` y se inyecta en `subject_claims.plan`.

### 16.2 Combinación canónica de permisos

Una acción puede requerir:
1. **Authorization permit** (subject tiene permission canónico).
2. **Subscription entitlement** (plan habilita el producto).
3. **Subscription quota** (queda cuota/crédito disponible).

La combinación canónica:

```
allowed = authz.check(...) == permit
       AND subscription.has_entitlement(plan, product)
       AND subscription.has_quota(user, product, amount)
```

Authorization NO valida (2) ni (3). El llamador del check (el endpoint del producto) combina las tres.

### 16.3 Eventos económicos

Authorization **NO** emite eventos económicos. Cuando una acción autorizada **tiene coste** (consume crédito, dispara billing futuro), es Subscription quien emite. Authorization solo permitirá la acción si el subject tiene permission y kyc adecuado.

### 16.4 Policies que referencian `plan`

Las policies pueden usar el claim `{{subject.plan}}` desde v1.0 (aunque sea constante):

```yaml
condition:
  claim: "plan"
  in: ["corporate_pro", "advisor_pro", "investor_premium"]
```

En v1.0, `subject.plan = "unknown"` (Subscription no existe). Las policies que requieren un plan específico **deny** por default (correcto: si no sabemos el plan, no permitimos features premium).

### 16.5 Cache invalidation

Cuando `subscription.plan.changed { user_id, org_id }` se emite, Authorization invalida cache por subject:

```python
on_event("subscription.plan.changed", handler=lambda evt: cache.invalidate_by_subject(evt.user_id))
```

---

## 17. Migración del código actual

### 17.1 Estado base

Hoy en `/app/backend/`:
- **Roles**: enum `Role` con 6 valores en `shared/types.py`. Falta `arroba_team` (decisión C11). Falta `member`, `guest` en `OrgRole`.
- **Authorization explícita**: **no existe motor**. Los endpoints actuales hacen check ad-hoc tipo `if user.role == "subscriber": ...` o no comprueban nada.
- **Policies declarativas**: **cero**. Hay que arrancar de scratch el catálogo YAML.
- **Tests de seguridad**: solo el básico `test_auth.py` y `test_organizations.py` (login, registro, creación).

### 17.2 Plan de migración

#### Fase 17.2.a — Fundación (no rompe nada)
1. Extender enum `Role` añadiendo `arroba_team`. Extender `OrgRole` añadiendo `member`, `guest`.
2. Crear módulo `/app/backend/src/modules/authz/` con:
   - `engine.py`: motor de decisión.
   - `policy_store.py`: carga YAML + Mongo.
   - `cache.py`: LRU in-memory.
   - `models.py`: Pydantic models de Policy, FeatureFlag, ResourceAcl, AuditLogEntry.
   - `router.py`: endpoints §15.
3. Crear directorio `/app/backend/policies/` vacío con README.
4. Crear primeras 10-15 policies YAML básicas (las imprescindibles para arrancar):
   - `P-IDENTITY-USER-001` user.read public.
   - `P-IDENTITY-USER-002` user.update self.
   - `P-IDENTITY-MEMBER-001` member management owner/admin.
   - `P-IDENTITY-INVITE-001` invite only owner/admin (decisión usuario).
   - `P-ORG-001` org.read for members.
   - `P-ORG-002` org.update owner/admin.
   - `P-ORG-003` org.archive owner only.
   - `P-COMPANY-001` company.read.public anonymous OK.
   - `P-AT-AUDIT-LOG-READ-001` arroba_team audit log conditional.
   - `P-POLICY-ADMIN-001` policy.* admin only.

#### Fase 17.2.b — Wire-up (cambio incremental)

Por cada endpoint existente, añadir check:
```python
@router.get("/api/organizations/{org_id}")
async def get_org(org_id: str, claims = Depends(get_current_claims)):
    decision = await authz.check(
        action="org.read",
        resource={"type": "organization", "id": org_id, "org_id": org_id},
        claims=claims
    )
    if decision.effect != "permit":
        raise HTTPException(403, decision.reason)
    # ... resto del handler
```

Comenzar por endpoints sensibles (`organizations`, `memberships`, `invitations`). Después extender a `users`, `auth`. Finalmente al resto.

**Promesa**: ningún endpoint cambia URL ni response shape. Solo se añade el check antes del handler.

#### Fase 17.2.c — Tests de seguridad

Crear `tests/test_authz_matrix.py` con matriz exhaustiva:

```python
@pytest.mark.parametrize("role,action,resource_org,expect", [
    ("anonymous", "org.read", "any", "deny"),
    ("subscriber", "org.read", "own", "permit"),
    ("subscriber", "org.read", "other", "deny"),
    ("owner", "org.archive", "own", "permit"),
    ("admin_membership", "org.archive", "own", "deny"),  # solo owner
    ("operator", "invitation.send", "own", "deny"),       # decisión Sprint 1
    ("arroba_team", "audit_log.read", "any", "deny"),     # sin mediación
    ("arroba_team", "audit_log.read", "any", "permit", {"mediation_active": True}),
    # ... 100+ casos
])
def test_authz_matrix(role, action, resource_org, expect, context=None):
    ...
```

### 17.3 Compatibilidad regresiva

- Mientras la migración esté incompleta, endpoints sin check pasan por **default permit** (sólo durante migración, deshabilitado pre-prod).
- Flag de runtime `authz.enforce_strict` (default `false` en dev/staging, `true` en prod). Cuando `true`, endpoints sin check explícito **fallan** con 500 (error de configuración).
- En migration completion, el flag pasa a `true` por default.

### 17.4 Datos seed iniciales

Migración Mongo `2026_06_25_authz_v1.py`:
- Crea índices de las 4 colecciones (`policies`, `feature_flags`, `resource_acls`, `authz_audit_log`).
- Seed inicial: zero policies en Mongo (todo viene del YAML core).
- Seed de feature flags: `{key: "matching_engine_v2", enabled: false}` y `{key: "kyc_strict_mode", enabled: false}` como ejemplos.

---

## 18. Boundary First — qué es externo

### 18.1 Dependencias internas con contratos explícitos

| Dependencia | Tipo | Contrato consumido |
|---|---|---|
| **Identity** | Interno | `identity.get_user`, `identity.get_memberships`, `identity.is_member`, `identity.has_profile`, `identity.member_role`. Eventos suscritos: ver §9.3. |
| **Subscription** (forward) | Interno | `subscription.get_plan_claim`. Eventos suscritos: `subscription.plan.changed`. |

### 18.2 Dependencias externas (forward, NO Sprint 1)

| Adapter | Contrato | Estado v1.0 | Futuro |
|---|---|---|---|
| **OPA** (Open Policy Agent) | Migración alternativa del motor | NO — motor propio embebido | Posible en Sprint 5+ si crece complejidad |
| **Cerbos** | Alternativa similar | NO | Idem |
| **Casbin** | Alternativa similar | NO | Idem |
| **Risk & Compliance Service** | Recibe stream de `authz.decision.denied` | NO — RCS no existe | Sprint 3+ |
| **External SIEM** (Datadog, Splunk) | Audit log streaming | NO | Future |

### 18.3 Patrón de migración futura a OPA

Si en Sprint N decidimos migrar a OPA:
- Las policies YAML actuales son **convertibles** a Rego con un traductor automatizado (subset que controlamos).
- El motor `authz.check()` cambia internamente pero el contrato público (signature) se mantiene.
- Cache, audit, ACL, feature flags se preservan tal cual.

Esto justifica el diseño actual: motor propio simple, contrato estable.

---

## 19. Open Questions (OPEN-A2-*)

> Prefijo `OPEN-A2-*` para distinguir de los OPENs del Sprint 0 (`OPEN-A*`, `OPEN-B*`, etc.).

| OPEN | Pregunta | Propuesta | Clasificación |
|---|---|---|---|
| **OPEN-A2-1** | ¿`audit.permit_sampling_rate` configurable por endpoint o global? | Global en v1.0; por endpoint en Sprint 3+ si volumen lo justifica. | G3 |
| **OPEN-A2-2** | ¿Policy `priority` numérica o lexical (e.g., `priority: high`)? | Numérica (50-9999) para flexibilidad. | G3 (resuelto en spec) |
| **OPEN-A2-3** | ¿Las policies del YAML core pueden ser **desactivadas** vía Mongo override sin tocar disco? | SÍ. Override Mongo con `policy_id` igual y `enabled: false` desactiva la del YAML. Requiere `audit_reason` obligatoria. | G3 |
| **OPEN-A2-4** | ¿Caché compartida Redis en v1.0 (multi-replica)? | NO en v1.0 (single replica). Solo cache local. Cuando escalemos: pub/sub Redis para invalidación. | G3 |
| **OPEN-A2-5** | ¿Bulk endpoint `/api/authz/check/batch` válido para frontend (renderizar muchos botones)? | SÍ. El frontend consulta una vez por página con lista de `(action, resource)`. | G3 |
| **OPEN-A2-6** | ¿`audit_log.read.own` requiere auth o expone una snapshot al user? | Requiere auth; expone snapshot solo de **denegaciones recientes** (últimas 50). | G3 |
| **OPEN-A2-7** | ¿`arroba_team` puede iniciar mediación de oficio (sin solicitud del user) o solo a petición? | En v1: a petición del user O por evento de alto riesgo (e.g., score >X). En Sprint 2+: refinar. | G3 |
| **OPEN-A2-8** | ¿Notificación al user cuando alguien (admin/`arroba_team`) consulta su `user.read.private`? | NO en v1.0 (privacidad de la operación de soporte). Sprint 2+: opcional notificación delayed. | G3 |
| **OPEN-A2-9** | ¿Mediation requiere aprobación cruzada (2 `arroba_team` deben firmar)? | NO en v1 (1 `arroba_team` con audit). Sprint 2+: dual approval para casos de máximo riesgo. | G3 |
| **OPEN-A2-10** | ¿Schema de `policy.condition` extensible vía plugins (custom evaluators)? | NO en v1. Schema cerrado (`claim`, `context`, operadores básicos). Sprint 5+: evaluar. | G3 |
| **OPEN-A2-11** | ¿Versión semántica de las policies en YAML (semver del set completo)? | NO en v1. Cada policy tiene `version`. El set completo se versiona vía git tags del repo. | G3 |
| **OPEN-A2-12** | ¿Allowlist de IPs para `arroba_team` (restricción de ubicación)? | NO en v1. Sprint 3+: posible con `context.ip` matching en policies. | G3 |
| **OPEN-A2-13** | ¿`feature_flag.evaluated` event sampleado 0.1% suficiente para detectar bugs en rollout? | Sí en v1. Si bug serio sospechado, override temporal a 100% para flag específica. | G3 |
| **OPEN-A2-14** | ¿`resource_acls` admite `subject_type = "external_relationship"` ya en v1.0 (forward) o se difiere? | Schema lo admite (campo enum extensible), pero no se implementan handlers para él en v1. Cuando llegue `external_relationships` (Sprint 2), se activa sin migración. | G3 |
| **OPEN-A2-15** | ¿`policy.create` vía API exige `admin` puro o `arroba_team` también puede? | `arroba_team` puede crear con `audit_reason` y restricción de `effect = permit` (no deny). `admin` puede ambos. | G3 |
| **OPEN-A2-16** | ¿`cache.invalidate_all()` ante cualquier cambio de policy es demasiado agresivo? | Sí potencialmente, pero v1 prioriza correctness. Sprint 3+: invalidación más fina (`by_action(action)`, `by_resource_type(type)`). | G3 |
| **OPEN-A2-17** | ¿`context.now` para policies time-based en v1.0? | Soportado pero ningún use case canónico inicial. Reservado. | G3 |
| **OPEN-A2-18** | ¿Authorization log expuesto al user vía `/me/decisions/recent` revela demasiado sobre policies internas? | El log solo expone `(action, resource_id, effect, reason_simplified, ts)`. NO expone `policy_ids_matched`. | G3 |
| **OPEN-A2-19** | ¿`arroba_team` durante mediación puede modificar policies de la org mediada? | NO. Mediación es contexto de **lectura ampliada** + acciones documentadas (e.g., cancel NDA con consentimiento). NO permite modificar policies. | G3 |
| **OPEN-A2-20** | ¿Internacionalización de `reason` en denegaciones para UX? | Backend devuelve `reason_code` (string canónico, e.g., `"kyc_required"`). Frontend mapea a i18n por `subject.language`. | G3 |

---

## 20. Authorization Explainability (canónica)

> Materialización del principio **P-A.12** (§3). La explainability no es un add-on; es la forma canónica en que el motor expone sus decisiones.

### 20.1 Contrato de `Decision`

Toda invocación de `authz.check(...)` retorna un objeto `Decision` con la siguiente shape **obligatoria**:

```python
Decision = {
  # Núcleo (ya presente en v1.0)
  "effect": "permit" | "deny",
  "reason": str,                          # texto humano-legible interno
  "latency_ms": int,
  "cache_hit": bool,

  # Explainability (P-A.12, obligatorios en v1.1)
  "policy_ids_matched": list[str],        # ej. ["P-IDENTITY-MEMBER-001", "P-AT-AUDIT-001"]
  "rule_id_decisive": str | None,         # ej. "P-IDENTITY-MEMBER-001" (la que ganó)
  "abac_attributes_used": list[str],      # ej. ["plan", "kyc_status", "active_org_id"]
  "missing_requirements": list[Requirement],  # vacía en permit
  "reason_code": str,                     # código canónico (§20.4)
}

Requirement = {
  "kind": "kyc" | "plan" | "membership" | "feature_flag" | "acl" | "identity_tier" | "custom",
  "expected": Any,                        # ej. "verified", "corporate+", "owner|admin"
  "current": Any,                         # ej. "none", "subscriber", "operator"
  "fix_hint": str,                        # canónico: lo que el frontend traduce a CTA
}
```

### 20.2 Resolución de `missing_requirements`

Cuando `effect = "deny"`, el motor calcula **qué faltaba** examinando las policies que NO matched y las pre-flight checks:

| Origen del deny | `missing_requirements[].kind` | Ejemplo |
|---|---|---|
| Pre-flight KYC gate (§9.1) | `"kyc"` | `{expected: "verified", current: "none", fix_hint: "complete_kyc"}` |
| Pre-flight `identity_tier` gate | `"identity_tier"` | `{expected: "internal", current: "external", fix_hint: "request_internal_membership"}` |
| Ninguna policy con `permit` matched, faltaba `membership.role` | `"membership"` | `{expected: ["owner", "admin"], current: "operator", fix_hint: "request_role_change"}` |
| Policy condition referenciaba `plan` (forward) | `"plan"` | `{expected: "corporate+", current: "subscriber", fix_hint: "upgrade_plan"}` |
| `feature_flag` requerido off | `"feature_flag"` | `{expected: "new_match_ui = true", current: "false", fix_hint: "feature_unavailable"}` |
| No había `resource_acl` para subject externo | `"acl"` | `{expected: "explicit_grant", current: "none", fix_hint: "request_explicit_access"}` |
| Custom condition (e.g., `risk_score <= 50`) | `"custom"` | `{expected: "risk_score <= 50", current: "78", fix_hint: "contact_arroba_team"}` |

**Regla canónica**: si hay múltiples `missing_requirements`, se devuelven **todas** (no se corta en la primera). El frontend decide cuál presentar al user (típicamente la más accionable).

### 20.3 Algoritmo de generación

```python
def build_missing_requirements(subject, action, resource, context, policies_evaluated):
    reqs = []
    
    # 1. Pre-flight KYC
    if action in KYC_GATED_ACTIONS and subject.kyc_status != "verified":
        reqs.append(Requirement(kind="kyc", expected="verified",
                                current=subject.kyc_status, fix_hint="complete_kyc"))
    
    # 2. Pre-flight identity_tier
    if subject.identity_tier == "external" and action not in EXTERNAL_ALLOWED_ACTIONS:
        reqs.append(Requirement(kind="identity_tier", expected="internal",
                                current="external", fix_hint="request_internal_membership"))
    
    # 3. Análisis de policies que rechazaron en subject_match
    for policy in policies_evaluated:
        if not policy.matched_subject and policy.effect == "permit":
            # Esta policy hubiera permitido si el subject cumpliera
            req = derive_requirement_from_subject_match(policy.subject_match, subject)
            if req:
                reqs.append(req)
    
    # 4. Análisis de condition (ABAC) no satisfecha
    for policy in policies_evaluated:
        if policy.matched_subject and policy.matched_resource and not policy.condition_satisfied:
            req = derive_requirement_from_condition(policy.condition, subject)
            if req:
                reqs.append(req)
    
    return dedupe(reqs)
```

### 20.4 Catálogo canónico de `reason_code`

Lista cerrada. Traducción i18n en frontend.

**Permit codes**:
```
permit_by_policy
permit_by_acl
permit_anonymous_public
permit_self_action
```

**Deny codes**:
```
deny_default_no_match
deny_by_policy
deny_by_acl
deny_kyc_required
deny_kyc_expired
deny_kyc_failed
deny_identity_tier_restricted
deny_plan_insufficient
deny_plan_unknown                  # subject.plan = "unknown" durante migración
deny_membership_required
deny_membership_role_insufficient
deny_membership_revoked
deny_membership_suspended
deny_org_archived
deny_org_suspended
deny_user_suspended
deny_user_deleted
deny_resource_archived
deny_resource_not_found            # cuando policy depende de attribute de resource ausente
deny_risk_score_too_high
deny_feature_flag_disabled
deny_arroba_team_no_mediation
deny_arroba_team_outside_mediation_scope
deny_delegation_expired            # forward
deny_external_acl_required
deny_capability_authorization_required  # cuando AGENTIC_LAYERS exige L4
deny_engine_degraded               # modo seguro post-fallo
deny_other
```

Convención: prefijo `permit_` o `deny_` + razón canónica. Cualquier nuevo code requiere bump menor del spec.

### 20.5 Visibilidad de campos al subject

Una `Decision` se devuelve **completa** al subject si el subject es:
- El propio sujeto consultando `me/permissions` o `me/decisions/recent`.
- Un `admin` o `arroba_team` (con mediación, para cross-user).

Para subjects regulares consultando otros subjects: **NO** se exponen `policy_ids_matched` ni `abac_attributes_used` (información sensible sobre cómo funcionan las policies). Solo `effect`, `reason_code` y `missing_requirements` (con `fix_hint` simplificado).

**Resuelve OPEN-A2-18**: `/me/decisions/recent` expone `(action, resource_id, effect, reason_code, missing_requirements_count, ts)`. No expone `policy_ids_matched`.

### 20.6 Audit log con explainability

`authz_audit_log.policy_ids_matched`, `.policy_id_decisive` ya están en schema §4.4. Se añaden:
- `audit.abac_attributes_used`: lista (persistida 100%).
- `audit.missing_requirements`: lista (persistida 100% solo en denegaciones).
- `audit.reason_code`: code canónico (siempre persistido).

### 20.7 Uso por Arroba Copilot

El Copilot transversal (`TRANSACTION_COPILOT_SPEC §10`) consume `Decision.missing_requirements` para responder al user:

> Usuario: "¿Por qué no puedo firmar este NDA?"
> Copilot lee Decision con `missing_requirements: [{kind: "kyc", expected: "verified", current: "none", fix_hint: "complete_kyc"}]`.
> Copilot responde: "Para firmar este NDA necesitas completar la verificación KYC. ¿Quieres iniciarla ahora?" + CTA.

Esto es **canónico**: el Copilot no inventa explicaciones; las deriva del contrato de explainability.

---

## 21. Forward-compatibility: permisos temporales

> Todo permiso modelado en el sistema debe **poder** tener vigencia temporal. En v1.1 los campos están en schema con default `null` (sin expiración). Las funcionalidades v1.1 que ya los usan: `effective_from`/`effective_until` en policies (introducidos en v1.0) y `expires_at` en `resource_acls`.

### 21.1 Schema canónico forward-compatible

Todas las entidades de Authorization que conceden permisos exponen pareja `valid_from` / `valid_until`:

| Entidad | Campos canónicos | Aliases preservados | Default |
|---|---|---|---|
| `policies` | `valid_from`, `valid_until` | `effective_from`, `effective_until` (v1.0) | `null` |
| `resource_acls` | `valid_from`, `valid_until` | `expires_at` ↔ `valid_until` (v1.0) | `null` |
| `feature_flags` | `expires_at` (global TTL de la flag) | — | `null` |
| `delegations` (forward §22) | `valid_from`, `valid_until` (obligatorio en este caso) | — | `valid_until` es **obligatorio** |

Cuando ambos alias están presentes, **deben coincidir** (validación al crear/actualizar). Si solo uno está presente, se interpreta automáticamente como el otro.

### 21.2 Motor: filtrado por ventana temporal

El evaluador, antes de considerar una policy/ACL aplicable, verifica:

```python
def is_within_temporal_window(entity, now):
    vf = entity.valid_from or entity.effective_from or entity.granted_at
    vu = entity.valid_until or entity.effective_until or entity.expires_at
    if vf is not None and now < vf:
        return False
    if vu is not None and now > vu:
        return False
    return True
```

Si el resultado es `False`, la entidad **se ignora** (no match). NO produce ni `permit` ni `deny`; simplemente no se considera. Si todas las policies aplicables están fuera de ventana, el resultado es `deny_default_no_match`.

### 21.3 Cache invalidation y ventanas temporales

Una policy/ACL con `valid_until` próximo invalida automáticamente:
- TTL del cache de decisiones que la usaron = `min(60s, valid_until - now)`.
- Job cron cada 60s detecta entradas cuyo `valid_until` pasó y emite `authz.acl.expired` o `authz.policy.expired`.

### 21.4 Casos de uso forward que esto habilita

| Caso | Mecanismo |
|---|---|
| Data Room con expiración 7 días | `resource_acls` con `valid_until = now + 7d` |
| Abogado externo con acceso temporal a una operation | `resource_acls` con `valid_from`/`valid_until` + `subject_type = "external_relationship"` (forward IDENTITY_SPEC §18) |
| Auditor con acceso a SPA durante DD window | `resource_acls` con ventana acotada |
| Permiso extraordinario `arroba_team` para mediación | `mediations` con `expires_at`; las policies que dependen de "mediation_active" se cierran al expirar |
| Policy de "modo elecciones" (durante 2 semanas) | `policies` con `valid_from`/`valid_until` |
| Feature flag con sunset planificado | `feature_flags.expires_at` |
| Promoción temporal de acceso a Beta | `feature_flags` con `expires_at` + rules de rollout |

### 21.5 Garantía de no rotura

- Toda entidad existente en Mongo con `valid_from = null` y `valid_until = null` sigue funcionando como antes (siempre válida).
- Los aliases v1.0 (`effective_from`, `effective_until`, `expires_at`) se mantienen leídos por el motor sin cambios.
- Migración Mongo `2026_06_25_authz_v1_1.py`: añade campos default `null` a documentos existentes; idempotente.

### 21.6 Audit

Cualquier mutación a campos `valid_*` requiere `audit_reason` obligatoria si la entidad ya estaba activa.

---

## 22. Forward-compatibility: delegación temporal de autoridad

> **Estado en v1.1**: NO implementada. Solo se declara el modelo conceptual para evitar refactor cuando se implemente.

### 22.1 Concepto canónico

Un usuario con **autoridad** sobre un recurso (ej. CEO/owner sobre una `operation`) puede **delegar temporalmente** parte de su autoridad a otro miembro del equipo, **sin cambiar roles ni memberships permanentes**.

Ejemplo: durante 5 días de vacaciones del CEO, delega `loi.submit` sobre la operación X al CFO. Cuando expira la ventana, la autoridad vuelve al CEO automáticamente.

### 22.2 Diferencia canónica con `resource_acls`

| Concepto | Naturaleza | Ejemplo |
|---|---|---|
| `resource_acls` | Concesión de **acceso** a un recurso a un subject que normalmente no lo tendría | Compartir Data Room con un abogado externo |
| `delegations` (forward) | Transferencia temporal de **autoridad ejecutiva** (firmar, aprobar, autorizar L4) de un user a otro | CEO delega firma de LOI al CFO durante 5 días |

Las **ACL** dicen "este subject puede leer/escribir este recurso"; las **delegations** dicen "este subject puede actuar **en nombre de** ese otro subject sobre este recurso, durante esta ventana".

### 22.3 Schema candidato

```yaml
delegations:
  _id: ObjectId
  delegation_id: str (deleg_)
  
  delegator_user_id: FK user          # quien delega su autoridad
  delegate_user_id: FK user           # quien recibe la autoridad
  
  resource_type: enum                 # del catálogo §7
  resource_id: str                    # id del resource específico
  
  delegated_actions: list[str]        # subset del catálogo §6; debe ser subset de las acciones que el delegator puede realizar
  
  reason: str                         # obligatorio
  
  valid_from: datetime
  valid_until: datetime               # obligatorio (no perpetua)
  
  status: enum [active, revoked, expired]
  
  created_at: datetime
  created_by: user_id                 # = delegator
  revoked_at: datetime | null
  revoked_by: user_id | null
  
  audit_trail: list[dict]             # historial de cambios/usos
```

### 22.4 Motor (forward)

El motor de decisión añadirá un paso adicional **DESPUÉS** de evaluar policies + ACLs, **ANTES** de aplicar deny-overrides:

```
[v1.1 actual]
1. Pre-flight (KYC, identity_tier)
2. Cache lookup
3. Policies match
4. ACLs match
5. Deny-overrides
6. Cache + audit

[v1.2 forward con delegations]
1. Pre-flight (KYC, identity_tier)
2. Cache lookup
3. Policies match
4. ACLs match
5. Delegations match     # NUEVO: ¿alguna delegación activa concede esta action?
6. Deny-overrides
7. Cache + audit
```

Una delegación activa produce un effect `permit` adicional con el `delegator_user_id` registrado como contexto.

### 22.5 Constraints canónicos

| Constraint | Razón |
|---|---|
| `delegator` debe **poder ejecutar** la acción él mismo en el momento de delegar. | No se puede delegar una autoridad que no se tiene. |
| `valid_until` obligatorio; sin perpetuas. | Delegación ≠ transferencia de role. |
| `valid_until - valid_from <= 90 días` (configurable por plan). | Evita degeneración en transferencia de facto. |
| Acciones críticas (`spa.sign`, `org.transfer_ownership`) **NO** son delegables en v1.2. Pueden añadirse a futuro con doble autorización. | Imposibles de revertir; riesgo legal. |
| Delegations son **no transitivas**: el delegate NO puede delegar a su vez. | Evita cadenas confusas. |
| `delegate` queda registrado en audit como "actuando_en_nombre_de delegator" en cada acción ejecutada. | Trazabilidad. |

### 22.6 Eventos canónicos (forward)

```
authz.delegation.created
authz.delegation.invoked        # cuando el delegate ejecuta una acción gracias a la delegación
authz.delegation.revoked
authz.delegation.expired
```

### 22.7 APIs candidatas (forward)

```
POST   /api/authz/delegations              # crear (delegator)
GET    /api/authz/delegations/mine         # mis delegaciones (como delegator o delegate)
POST   /api/authz/delegations/{id}/revoke
GET    /api/authz/delegations/active-for-me # las que actualmente me dan autoridad sobre recursos
```

### 22.8 Garantía v1.1

- El contrato del motor `authz.check(...)` permanece **idéntico** entre v1.1 y la futura v1.2 que añada delegations.
- Las policies actuales no se ven afectadas.
- Las ACL actuales no se ven afectadas.
- El frontend que en v1.1 nunca consulta delegations sigue funcionando cuando se introduzcan.

---

## Cierre del spec

Este documento es **fuente de verdad** sobre la plataforma de Authorization de arroba.com. Cualquier desviación en código requiere bump de versión + propagación a `CHANGELOG.md`.

**Versión actual**: `v1.1.0`.
**Estado**: ✅ Cerrado con patches A.1-A.4 aplicados (Explainability canónica, permisos temporales forward, delegations forward, principio de Authorization orientada a entidades). Pendiente aprobación del usuario antes de redactar SUBSCRIPTION_SPEC (Fase 1.0.3).
**Próxima fase**: 1.0.3 — `SUBSCRIPTION_SPEC.md` (en redacción tras este patch).

> **Fuentes canónicas referenciadas**:
> - `/app/memory/specs/IDENTITY_SPEC.md` v1.1.0 (capa anterior)
> - `/app/memory/ARROBA_PHILOSOPHY.md` §12 (Principios UX), §13 (capas)
> - `/app/memory/specs/AGENTIC_LAYERS_SPEC.md` (capabilities, niveles L1-L4, §5.3)
> - `/app/memory/specs/MEMORY_ENGINE_SPEC.md` (Risk & Compliance Service forward dependency)
> - `/app/memory/specs/CANON_AUDIT_REPORT.md` + `OPEN_ITEMS_CLASSIFICATION.md` (resoluciones G2: B2, C11, D10, E16)
> - `/app/memory/SPRINT1_ARCHITECTURE_PROPOSAL.md` (decisiones D-A.1-D-A.8 aprobadas)
