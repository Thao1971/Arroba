# arroba.com — Identity Spec v1.1.0

> **Spec canónico** · capa 4 del canon (Engines & Specs).
> Fase 1.0.1 del Sprint 1 — primer spec del Identity Platform Sprint.
> Fecha de cierre: 2026-06-25.
>
> **CHANGELOG interno**:
>
> **v1.1.0 (2026-06-25)** — Patch forward-compatibility aprobado por el usuario tras revisión inicial:
> - **Patch I.1**: principio canónico explícito de **separación de 5 capas** `Authentication ⇄ Identity ⇄ Authorization ⇄ Subscription ⇄ Billing` añadido como P-I.0 en §3. Reemplaza la lectura previa de 4 capas que mezclaba Authentication dentro de Identity.
> - **Patch I.2**: nueva sección §18 "Forward-compatibility: identidades externas" — declara el path canónico para asesores externos, despachos, bancos, auditores, etc., sin expandir el alcance del Sprint 1.
> - **Patch I.3**: nueva sección §19 "Forward-compatibility: identidad jurídica/fiscal vs operacional" — declara el path canónico para holding/filial/SPV/sucursal.
> - **Patch I.4**: §16 ampliada con dos claims forward (`identity_tier`, `fiscal_entity_id`) que AUTHORIZATION_SPEC debe aceptar en su contrato ABAC ya en v1.0.
>
> **v1.0.0 (2026-06-25)** — Cierre inicial del spec Fase 1.0.1 Sprint 1.
>
> ---
>
> **Regla cardinal**: este spec define la **plataforma de Identity** como base autónoma. NO contiene referencias a planes, créditos, cuotas, stripe ni billing. Identity es **la 2ª de 5 capas** de la cadena `Authentication ⇄ Identity ⇄ Authorization ⇄ Subscription ⇄ Billing` (ver §3, P-I.0). Las capas superiores **consumen** Identity; Identity NO depende de ellas (excepto Authentication, que provee credenciales validadas).
>
> **Precedencia**: en caso de conflicto entre este spec y la implementación, **gana el spec**. El código se actualiza para alinearse.

---

## Índice

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Glosario](#2-glosario)
3. [Principios canónicos](#3-principios-canónicos)
4. [Modelo de datos canónico](#4-modelo-de-datos-canónico)
5. [Ciclo de vida y estados](#5-ciclo-de-vida-y-estados)
6. [Sesiones, tokens y autenticación](#6-sesiones-tokens-y-autenticación)
7. [Verificación progresiva](#7-verificación-progresiva)
8. [Profiles — gestión y completeness](#8-profiles--gestión-y-completeness)
9. [Invitaciones](#9-invitaciones)
10. [Multi-tenant y aislamiento](#10-multi-tenant-y-aislamiento)
11. [Eventos canónicos del Identity Engine](#11-eventos-canónicos-del-identity-engine)
12. [APIs canónicas (mapa)](#12-apis-canónicas-mapa)
13. [Boundary First — qué es externo](#13-boundary-first--qué-es-externo)
14. [Política de seguridad](#14-política-de-seguridad)
15. [Migración del código actual](#15-migración-del-código-actual)
16. [Integración forward con AUTHORIZATION_SPEC](#16-integración-forward-con-authorization_spec)
17. [Open Questions (OPEN-I*)](#17-open-questions-open-i)

---

## 1. Propósito y alcance

### 1.1 Qué es la plataforma de Identity

La plataforma de **Identity** es la capa autónoma de arroba.com responsable de **declarar y gestionar quién existe en el sistema**: usuarios, organizaciones, equipos, relaciones de pertenencia, perfiles tipados de actividad, verificaciones y sesiones.

Identity es la capa que el resto del producto consume cuando necesita saber:
- "¿Quién es el actor de esta petición?"
- "¿A qué organización pertenece?"
- "¿Qué perfiles tipados tiene?"
- "¿Está verificado?"
- "¿Cuál es su riesgo declarado?"
- "¿En qué teams participa?"

### 1.2 Posición canónica en la cadena

```
   ┌─────────────────────────────────────────────────────────────────┐
   │  Identity   ───►  Authorization  ───►  Subscription  ───►  Billing
   └─────────────────────────────────────────────────────────────────┘
        ▲
        │
        │  Identity es la base autónoma:
        │  no depende de las otras tres capas.
        │  Authorization la consume.
        │  Subscription consume Authorization.
        │  Billing consume Subscription.
```

Identity expone **claims** (afirmaciones declarativas sobre el actor) que las capas superiores transforman en decisiones de permiso, asignaciones de plan o eventos económicos. Identity NO toma esas decisiones.

### 1.3 Qué NO cubre este spec

- 🚫 **Authorization**: políticas, RBAC, ABAC, ACLs, feature flags. Cubierto en `AUTHORIZATION_SPEC.md`.
- 🚫 **Subscription**: planes, créditos, cuotas, entitlements, gating. Cubierto en `SUBSCRIPTION_SPEC.md`.
- 🚫 **Billing**: stripe, facturación, eventos económicos del Transaction OS. Cubierto en `BILLING_SPEC.md`.
- 🚫 **Memoria de identidad**: la memoria viva del usuario (preferencias adaptativas, historial conversacional). Pertenece a `MEMORY_ENGINE_SPEC.md`.
- 🚫 **Acciones del Copilot sobre identidad**: cómo el Copilot interactúa con el modelo de identidad. Pertenece a `TRANSACTION_COPILOT_SPEC.md` + `COPILOTS_SPEC.md`.

### 1.4 Relación con `ENTITY_MODEL.md`

El `ENTITY_MODEL.md` (capa 3) declara `user` y `organization` como entidades canónicas del producto. Este spec **especializa** esa declaración con el modelo operacional completo:

| Aspecto | `ENTITY_MODEL.md` | `IDENTITY_SPEC.md` |
|---|---|---|
| Catálogo | Declara que existen | Implementa la plataforma |
| Identidad | Slug + ID canónico | Cómo se genera, valida, indexa |
| Relaciones | Declarativas (user ↔ org) | Mecanismo (memberships) |
| Ciclo de vida | Filosófico | Estados + transiciones |

Cualquier campo declarado aquí que añada información sobre `user` o `organization` se considera **extensión técnica** del modelo canónico, no contradicción.

### 1.5 Relación con `_INVENTORY_2026.md` y código actual

El estado actual del código relevante:

| Módulo backend | Estado | Decisión Sprint 1 |
|---|---|---|
| `auth/` (402 líneas) — email/password + Emergent Google OAuth + sessions | Productivo | **Reutilizar** tal cual; extender con claims canónicos. |
| `users/` (48 líneas) — GET/PATCH /me | Stub mínimo | **Extender amplio**: ~150 líneas nuevas para campos canónicos. |
| `organizations/` (352 líneas) — orgs + memberships + invitations CRUD | Productivo básico | **Extender**: ~200 líneas para teams, ownership transfer, KYC org. |
| `billing/` (21 líneas) — stub Stripe SDK check | Stub | **NO TOCAR** en Identity. Otra capa. |
| `shared/types.py` (Role enum, OrgRole, …) | Productivo | **Extender** con `arroba_team` (decisión C11), `role.member`, `role.guest`. |

Detalle de migración en §15.

---

## 2. Glosario

| Término | Definición canónica |
|---|---|
| **User** | Persona física registrada en arroba.com. Entidad raíz de Identity. Atómica: NUNCA dos `user` representan a la misma persona. |
| **Organization** (Org) | Persona jurídica o entidad agrupadora registrada. Un user pertenece a 0..N orgs vía `memberships`. |
| **Team** | Subdivisión interna de una organización. Entidad de primer nivel (no atributo). Un membership puede asociarse a 0..N teams. |
| **Membership** | Relación canónica `(user, org)` con `role` específico para esa org. Tabla pivote N:M. Una persona puede ser `admin` en Org A y `operator` en Org B simultáneamente. |
| **Role** (en membership) | Rol funcional del user dentro de UNA organización: `owner | admin | operator | member | guest`. Distinto del `role_global` del usuario. |
| **Role global** | Categoría transversal del actor a nivel plataforma: `anonymous | subscriber | corporate | investor | advisor | arroba_team | admin`. Determina **qué clase de actor** es, no qué puede hacer dentro de UNA org. |
| **Ownership** | Doble campo en entidades con ciclo de vida: `created_by` (inmutable, provenance) + `owner_id` (mutable, governance, transferible). |
| **Profile** | Perfil tipado especializado del user: `professional`, `advisor`, `corporate`, `investor`. 4 colecciones separadas con FK. Un user puede tener 0..N perfiles activos. |
| **Invitation** | Token emitido por `owner`/`admin` de una org para incorporar a un user (existente o no) como nueva membership. |
| **KYC** | Know-Your-Customer. Verificación de identidad documental/regulatoria. Gated por contexto (LOI, SPA, Closing). |
| **Verification** | Estado de comprobación de un canal del user: `email`, `phone`, `document`. Cada uno con su flow independiente. |
| **Session** | Sesión activa vinculada a un user, con token JWT 24h, refresh 30d, idle timeout 1h. |
| **Token** | Cadena firmada que transporta claims del user. JWT con shape canónico definido en §6. |
| **Claim** | Afirmación declarativa sobre el actor que viaja en el token o se computa al solicitar `/me`. Ejemplo: `email_verified: true`. |
| **Verification State** | Estado canónico de un canal de verificación: `none | pending | verified | failed | expired`. |
| **Profile Completeness** | Score 0-100 calculado por reglas declarativas sobre los campos rellenados de un perfil. NO hardcoded; vive en config. |
| **Identity Engine** | Conjunto cohesionado de servicios backend que implementa este spec. NO un servicio físico separado en v1; vive embebido en `/app/backend/src/modules/`. |
| **`arroba_team_flag`** | Booleano derivado: `True` si el user tiene `role_global = arroba_team`. Claim canónico. Usado por capas superiores para mediación interna. |
| **Tenant** | Sinónimo operacional de `organization` cuando el contexto subraya el aislamiento. Toda query con datos por-org debe filtrar por `tenant`. |

---

## 3. Principios canónicos

> Estos principios son **invariantes** del Identity Engine. Cualquier evolución debe respetarlos o producir bump mayor con justificación documentada.

### P-I.0 — Separación canónica de 5 capas (principio arquitectónico)

```
Authentication  ⇄  Identity  ⇄  Authorization  ⇄  Subscription  ⇄  Billing
```

Cada capa tiene un dominio propio, **separado** del resto:

| Capa | Pregunta canónica | Qué declara |
|---|---|---|
| **Authentication** | "¿quién dice ser quién dice ser?" | Credenciales, tokens, OAuth, sesiones, refresh, MFA futuro |
| **Identity** | "¿quién es esta persona/entidad y qué la describe?" | Usuarios, organizaciones, teams, memberships, perfiles tipados, verificación, relaciones |
| **Authorization** | "¿qué puede hacer esta identidad en este contexto?" | Permisos, policies declarativas, ACLs, feature flags, decisiones cacheables |
| **Subscription** | "¿qué plan, créditos, cuota y restricciones tiene?" | Planes configurables, ledger de créditos, entitlements, gates |
| **Billing** | "¿cuánto cobramos y cómo?" | Stripe, facturas, IVA, eventos económicos del Transaction OS |

**Dirección del flujo de claims**: cada capa solo **consume claims** de la inferior. Nunca al revés. Identity no conoce planes; Authorization no conoce stripe; Billing no conoce credenciales.

**Por qué 5 y no 4**: Authentication (validación de identidad declarada) e Identity (descripción de quién es esa identidad) son responsabilidades distintas. Authentication maneja credenciales y sesión; Identity maneja qué describe a esa persona/entidad. La separación permite, por ejemplo, sustituir el proveedor de auth (Emergent Google OAuth → enterprise SSO futuro) sin tocar Identity.

**Forma operacional v1**: en este Sprint, Authentication vive físicamente en el módulo `auth/` (cookies, sesiones, OAuth exchange) e Identity en `users/` + `organizations/` + `teams/` + `profiles/` + `kyc/`. El JWT (Authentication) transporta claims **rellenados por Identity** al momento de su emisión y refresh.

### P-I.1 — Identity es la base autónoma

Identity **no importa** símbolos ni colecciones de Authorization, Subscription o Billing. Identity puede ser arrancado, testeado y desplegado sin esas capas.

**Forma operacional**: el módulo `identity` del backend (servicios + repos + models) declara sus dependencies hacia abajo (Mongo, Redis si aplica, adapters externos) pero **nunca** hacia las capas superiores.

### P-I.2 — N:M user ↔ organization

Un user puede pertenecer simultáneamente a múltiples organizaciones. La relación se materializa en `memberships`, no en un campo `user.organization_id`.

**Consecuencia operativa**: las queries que listan datos de un user **no asumen una sola org**. El frontend tiene un concepto explícito de `active_org_id` (la org actualmente seleccionada en la UX), persistido en la sesión.

### P-I.3 — Team es entidad de primer nivel

`team` tiene su propia colección, su propio ciclo de vida, su propia identidad. **No** es un campo libre en `membership`. Las consecuencias estructurales son:

- `team` se puede archivar sin perder la pertenencia histórica de sus miembros.
- Authorization puede declarar policies sobre `team_id` (ej. "el team Legal de Org X tiene acceso al Data Room").
- Un team puede tener su propio `owner_id` distinto del `owner_id` de la org.

### P-I.4 — Ownership separado: provenance + governance

Toda entidad de Identity con ciclo de vida declara dos campos:

- **`created_by`** — `user_id` del creador. Inmutable después de creación. Sirve para auditoría y provenance.
- **`owner_id`** — `user_id` del propietario administrativo actual. Mutable, transferible. Sirve para governance (decisiones administrativas, derecho de archivado, etc.).

En `users`, `created_by = NULL` para auto-registros; `owner_id = user_id` siempre que el user esté activo (un user es siempre propietario de sí mismo a efectos administrativos).

### P-I.5 — Perfiles tipados separados

Los 4 perfiles (`professional`, `advisor`, `corporate`, `investor`) viven en **4 colecciones separadas con FK** al user. Razones canónicas:

- Cada perfil tiene su propio ciclo de vida, completeness, KYC contextual, eventos.
- Indexación dedicada por sector / geografía / ticket size en cada perfil sin contaminar `users`.
- Authorization puede preguntar `has_profile('advisor', user_id)` sin cargar el documento completo del user.
- Un user puede ser Advisor en una org cliente y Corporate empleado en su empresa empleadora simultáneamente.

### P-I.6 — Boundary First para KYC

KYC se implementa con **adapter mock en v1** con interfaz idéntica a la futura integración real (Onfido / Veriff / Sumsub / Stripe Identity). El producto NO conoce el proveedor; conoce el contrato.

### P-I.7 — Verificación progresiva

- **Email**: obligatorio en registro. Sin verificación, el user puede explorar pero NO crear org ni aceptar invitación.
- **Phone**: opcional. Adapter Twilio (mock v1).
- **Document / KYC**: NO se exige al registro. Gated por **contexto de acción** (LOI, SPA, Closing, Finder Fee execution).

**Principio derivado**: nunca frenar la activación temprana del user con verificaciones innecesarias para la acción que está intentando.

### P-I.8 — Aislamiento lógico estricto (D10)

Todas las colecciones que contengan datos por-org incluyen `org_id` indexado. Toda query que lea o muta datos de una org **filtra por `org_id`** declarado, no derivado de joins externos.

**Test de aislamiento**: por cada endpoint `/api/organizations/{org_id}/...`, un test pytest verifica que un user sin membership activa en esa org recibe 403.

### P-I.9 — Least privilege

Por defecto, ningún user tiene acceso a nada que no haya sido explícitamente concedido (vía role en membership o invitation aceptada). Identity declara las concesiones; Authorization las evalúa.

### P-I.10 — Idioma y preferencias respetadas

- `user.language` (default `es`) gobierna toda comunicación al user (emails, push, voice del Copilot).
- `user.timezone` afecta cualquier renderizado de fecha/hora.
- `user.preferences` es un sub-doc libre que el frontend puebla y consume (toggle de telemetría, modo oscuro, etc.). El backend NO interpreta estas claves; solo las almacena y devuelve.

### P-I.11 — Soft delete por defecto

Toda eliminación de `user`, `organization`, `team`, `membership`, `profile` es **soft delete** (`status = deleted`, `deleted_at` timestamp). La eliminación física sólo se ejecuta por proceso GDPR explícito (§14.5).

### P-I.12 — Atomicidad de email

`email` en `users` es identificador único universal. NUNCA dos users con el mismo email simultáneamente activos. Un email puede reutilizarse SI el user previo está `deleted` (hard-delete o ≥30d en `deleted`).

---

## 4. Modelo de datos canónico

> **Convenciones**: tipos en notación Pydantic-like. `?` indica opcional. Índices listados explícitamente. Constraints declarativos.

### 4.1 `users` — colección raíz

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | `ObjectId` | sí | auto | — |
| `user_id` | `str` (prefijo `user_`) | sí | autogen | `unique` |
| `email` | `str` (lower) | sí | — | **`unique` partial (donde `status != deleted`)**, formato RFC 5322 |
| `email_verified` | `bool` | sí | `false` | — |
| `email_verified_at` | `datetime` | no | `null` | requerido si `email_verified = true` |
| `phone` | `str` (E.164) | no | `null` | regex `^\+\d{6,15}$` |
| `phone_verified` | `bool` | sí | `false` | — |
| `phone_verified_at` | `datetime` | no | `null` | requerido si `phone_verified = true` |
| `password_hash` | `str` (bcrypt) | no | `null` | obligatorio si `auth_providers` incluye `email` y no incluye `google` |
| `auth_providers` | `list[str]` | sí | `[]` | valores ∈ `{email, google}` |
| `google_id` | `str` | no | `null` | `unique` partial |
| `display_name` | `str` | no | `null` | length 1-200 |
| `avatar_url` | `str` (URL) | no | `null` | — |
| `language` | `str` (ISO 639-1) | sí | `"es"` | ∈ `{es, en, fr, pt, de, it}` |
| `timezone` | `str` (IANA TZ) | sí | `"Europe/Madrid"` | validable contra zoneinfo |
| `preferences` | `dict` | sí | `{}` | sub-doc libre, no interpretado por backend |
| `status` | `enum` | sí | `"pending_verification"` | ∈ `{pending_verification, active, suspended, deleted}` |
| `role_global` | `enum` | sí | `"subscriber"` | ∈ canon `{anonymous, subscriber, corporate, investor, advisor, arroba_team, admin}` |
| `kyc_status` | `enum` | sí | `"none"` | ∈ `{none, pending, verified, failed, expired}` |
| `kyc_provider` | `str` | no | `null` | nombre del adapter (mock o real futuro) |
| `kyc_provider_ref` | `str` | no | `null` | referencia opaca del proveedor |
| `kyc_verified_at` | `datetime` | no | `null` | requerido si `kyc_status = verified` |
| `kyc_expires_at` | `datetime` | no | `null` | si `verified`, default `verified_at + 365d` |
| `risk_score` | `int` (0-100) | sí | `0` | — |
| `risk_assessed_at` | `datetime` | no | `null` | — |
| `risk_source` | `str` | no | `null` | nombre del Risk & Compliance Service (forward dependency) |
| `last_login_at` | `datetime` | no | `null` | — |
| `created_by` | `str` | no | `null` | `user_id` del invitador si aplica; `null` si auto-registro |
| `owner_id` | `str` | sí | `=user_id` | siempre `=user_id` para `user` (auto-ownership) |
| `created_at` | `datetime` | sí | `now()` | — |
| `updated_at` | `datetime` | sí | `now()` | actualizado en cada mutación |
| `deleted_at` | `datetime` | no | `null` | requerido si `status = deleted` |

**Índices**:
- `email` (partial: `status != "deleted"`, unique)
- `google_id` (partial: `auth_providers contains "google"`, unique)
- `status`
- `role_global`
- `kyc_status`
- `created_at`

**Validaciones**:
- Al menos un proveedor de auth: `auth_providers` no vacío.
- Si `auth_providers` incluye `email`, `password_hash` requerido.
- Si `auth_providers` incluye `google`, `google_id` requerido.
- `email_verified_at <= now()`.
- `kyc_expires_at > kyc_verified_at`.

**Eventos generados**: ver §11 (lista de `identity.user.*`).

### 4.2 `organizations` — persona jurídica o agrupador

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | `ObjectId` | sí | auto | — |
| `org_id` | `str` (prefijo `org_`) | sí | autogen | `unique` |
| `name` | `str` | sí | — | length 2-200 |
| `slug` | `str` | sí | derivado de `name` | `unique`, regex `^[a-z0-9-]+$`, length 3-50 |
| `org_type` | `enum` | sí | — | ∈ `{corporate, advisor, investor, platform_internal}` |
| `country` | `str` (ISO 3166-1 alpha-2) | sí | `"ES"` | — |
| `tax_id` | `str` | no | `null` | formato CIF/NIF si `country=ES`, otros si UE/global |
| `vat_id` | `str` | no | `null` | formato EU VAT si UE |
| `vies_validated` | `bool` | sí | `false` | sólo `true` si VAT ID validado contra VIES |
| `vies_validated_at` | `datetime` | no | `null` | requerido si `vies_validated = true` |
| `legal_address` | `dict` | no | `null` | sub-doc con `street`, `city`, `region`, `postal_code`, `country` |
| `created_by` | `str` (user_id) | sí | — | **inmutable** |
| `owner_id` | `str` (user_id) | sí | `=created_by` inicial | mutable; transferible vía endpoint dedicado |
| `kyc_status` | `enum` | sí | `"none"` | ∈ `{none, pending, verified, failed, expired}` (org-level, para corporate verification) |
| `kyc_verified_at` | `datetime` | no | `null` | — |
| `kyc_expires_at` | `datetime` | no | `null` | — |
| `risk_score` | `int` (0-100) | sí | `0` | — |
| `risk_assessed_at` | `datetime` | no | `null` | — |
| `status` | `enum` | sí | `"active"` | ∈ `{active, suspended, archived, deleted}` |
| `archived_at` | `datetime` | no | `null` | requerido si `status = archived` |
| `archived_by` | `str` (user_id) | no | `null` | requerido si `status = archived` |
| `created_at` | `datetime` | sí | `now()` | — |
| `updated_at` | `datetime` | sí | `now()` | — |
| `deleted_at` | `datetime` | no | `null` | requerido si `status = deleted` |

**Índices**:
- `slug` (unique)
- `tax_id` (partial: not null, unique)
- `vat_id` (partial: not null, unique)
- `country`
- `org_type`
- `status`
- `created_by`

**Validaciones**:
- `name` y `slug` no vacíos.
- Si `country = ES`, `tax_id` debe coincidir con regex de CIF/NIF.
- `created_by` debe existir en `users` y NO tener `status = deleted`.
- `owner_id` debe ser miembro **activo** de la org (membership con `status = active`).
- `archived_by` debe tener `role = owner` o `role = admin` en esa org en el momento del archivado.

**Eventos**: `identity.org.created`, `identity.org.archived`, `identity.org.ownership_transferred`.

### 4.3 `memberships` — relación N:M user ↔ org

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | `ObjectId` | sí | auto | — |
| `membership_id` | `str` (`mem_`) | sí | autogen | `unique` |
| `user_id` | `str` | sí | — | FK a `users.user_id` |
| `org_id` | `str` | sí | — | FK a `organizations.org_id` |
| `role` | `enum` | sí | — | ∈ `{owner, admin, operator, member, guest}` |
| `team_ids` | `list[str]` | sí | `[]` | FK a `teams.team_id`; lista posiblemente vacía |
| `status` | `enum` | sí | `"pending"` | ∈ `{pending, active, suspended, revoked}` |
| `invited_by` | `str` (user_id) | no | `null` | requerido si la membership nace de invitación |
| `invitation_id` | `str` | no | `null` | FK a `invitations.invitation_id` si aplica |
| `joined_at` | `datetime` | no | `null` | requerido si `status = active`; momento de aceptación |
| `revoked_at` | `datetime` | no | `null` | requerido si `status = revoked` |
| `revoked_by` | `str` (user_id) | no | `null` | requerido si `revoked` |
| `created_at` | `datetime` | sí | `now()` | — |
| `updated_at` | `datetime` | sí | `now()` | — |

**Índices**:
- **Compuesto unique parcial**: `(user_id, org_id)` donde `status ∈ {pending, active, suspended}`. **No** unique si `status = revoked` (permite re-invitación tras revocación).
- `org_id`
- `user_id`
- `role`
- `status`
- `team_ids` (multikey)

**Validaciones**:
- Solo una membership **activa** por `(user_id, org_id)`.
- `team_ids` deben pertenecer a la misma `org_id`.
- Si `role = owner`, debe coincidir con `organizations.owner_id` (consistencia: sólo el owner de la org tiene membership con role `owner`).
- Transición `pending → active` requiere `users.email_verified = true`.

**Eventos**: `identity.membership.created`, `identity.membership.role_changed`, `identity.membership.team_changed`, `identity.membership.revoked`, `identity.membership.suspended`, `identity.membership.activated`.

### 4.4 `teams` — entidad de primer nivel

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | `ObjectId` | sí | auto | — |
| `team_id` | `str` (`team_`) | sí | autogen | `unique` |
| `org_id` | `str` | sí | — | FK a `organizations.org_id` |
| `name` | `str` | sí | — | length 1-100 |
| `slug` | `str` | sí | derivado | regex `^[a-z0-9-]+$`, length 1-50; `unique` dentro de `org_id` |
| `description` | `str` | no | `null` | length ≤ 500 |
| `is_default` | `bool` | sí | `false` | exactamente UN team con `is_default=true` por org (el team "All members" automático) |
| `created_by` | `str` (user_id) | sí | — | inmutable |
| `owner_id` | `str` (user_id) | sí | `=created_by` inicial | mutable |
| `member_count` | `int` | sí | `0` | **cached**; recomputado al cambiar `memberships.team_ids` |
| `status` | `enum` | sí | `"active"` | ∈ `{active, archived}` |
| `archived_at` | `datetime` | no | `null` | requerido si `status = archived` |
| `archived_by` | `str` (user_id) | no | `null` | requerido si `archived` |
| `created_at` | `datetime` | sí | `now()` | — |
| `updated_at` | `datetime` | sí | `now()` | — |

**Índices**:
- `(org_id, slug)` unique
- `org_id`
- `is_default`
- `status`

**Validaciones**:
- `created_by` debe ser miembro activo de la org y tener `role ∈ {owner, admin}`.
- `is_default = true` exclusivo por `org_id`.
- Archivar un team NO elimina las `memberships.team_ids` históricas; el `team_id` desaparece visualmente pero permanece referenciable para auditoría.

**Eventos**: `identity.team.created`, `identity.team.renamed`, `identity.team.archived`, `identity.team.ownership_transferred`.

### 4.5 `invitations` — incorporación de un user a una org

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | `ObjectId` | sí | auto | — |
| `invitation_id` | `str` (`inv_`) | sí | autogen | `unique` |
| `org_id` | `str` | sí | — | FK a `organizations.org_id` |
| `email` | `str` (lower) | sí | — | formato RFC 5322; **NO** necesariamente existente en `users` |
| `role` | `enum` | sí | `"operator"` | mismo enum que `memberships.role` excepto `owner` (no se puede invitar como owner; sólo se transfiere ownership) |
| `team_ids` | `list[str]` | sí | `[]` | propuestos al momento de la invitación |
| `invited_by` | `str` (user_id) | sí | — | debe tener `role ∈ {owner, admin}` en `org_id` |
| `status` | `enum` | sí | `"pending"` | ∈ `{pending, accepted, declined, expired, revoked}` |
| `token` | `str` | sí | autogen | **hash bcrypt** del token plano; el token plano se envía solo en el email |
| `token_expires_at` | `datetime` | sí | `now() + 7d` | configurable por org en futuro, no en v1 |
| `accepted_by` | `str` (user_id) | no | `null` | requerido si `status = accepted` |
| `accepted_at` | `datetime` | no | `null` | requerido si `accepted` |
| `declined_at` | `datetime` | no | `null` | — |
| `revoked_at` | `datetime` | no | `null` | — |
| `revoked_by` | `str` (user_id) | no | `null` | — |
| `created_at` | `datetime` | sí | `now()` | — |

**Índices**:
- `(org_id, email, status)` con `status = pending` único (no doble invitación pendiente al mismo email en la misma org)
- `token` (hash) — buscado por `accept`
- `token_expires_at`
- `status`

**Validaciones**:
- `invited_by` debe tener role ∈ `{owner, admin}` y membership `active` en `org_id` en el momento de la creación.
- `role` no puede ser `owner` (ver constraint arriba).
- Si el `email` pertenece a un user con membership **activa** en la misma org, la creación falla con `already_member`.
- `accepted_by.email` debe coincidir con `email` de la invitación.

**Eventos**: `identity.invitation.created`, `identity.invitation.accepted`, `identity.invitation.declined`, `identity.invitation.expired`, `identity.invitation.revoked`.

### 4.6 `professional_profile` — perfil profesional genérico

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | `ObjectId` | sí | auto | — |
| `profile_id` | `str` (`prof_`) | sí | autogen | `unique` |
| `user_id` | `str` | sí | — | FK a `users.user_id`, **único** |
| `headline` | `str` | no | `null` | length ≤ 200 |
| `bio` | `str` | no | `null` | length ≤ 2000 |
| `current_company` | `str` | no | `null` | length ≤ 200 |
| `current_role` | `str` | no | `null` | length ≤ 100 |
| `years_experience` | `int` | no | `null` | 0..70 |
| `industries` | `list[str]` | sí | `[]` | slugs de sectores reconocidos por el catálogo |
| `geographies` | `list[str]` | sí | `[]` | slugs de territorios |
| `linkedin_url` | `str` (URL) | no | `null` | regex linkedin.com/in/... |
| `expertise_tags` | `list[str]` | sí | `[]` | tags libres normalizados |
| `completeness_score` | `int` (0-100) | sí | `0` | recomputado en cada actualización |
| `created_by` | `str` | sí | `=user_id` | inmutable |
| `owner_id` | `str` | sí | `=user_id` | siempre `=user_id` |
| `created_at` | `datetime` | sí | `now()` | — |
| `updated_at` | `datetime` | sí | `now()` | — |

**Índices**: `user_id` unique, `industries` multikey, `geographies` multikey.

### 4.7 `advisor_profile`

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id`, `profile_id`, `user_id` | (idem 4.6) | — | — | — |
| `firm_name` | `str` | no | `null` | length ≤ 200 |
| `firm_url` | `str` (URL) | no | `null` | — |
| `mandate_focus` | `dict` | sí | `{}` | sub-doc: `sectors`, `ticket_size_min_eur`, `ticket_size_max_eur`, `geographies`, `stages` |
| `historical_deals_count` | `int` | no | `null` | ≥ 0 |
| `historical_deals_volume_eur` | `int` | no | `null` | ≥ 0 |
| `compliance_certifications` | `list[str]` | sí | `[]` | tags normalizados (CFA, MiFID II, etc.) |
| `languages_spoken` | `list[str]` | sí | `[]` | ISO 639-1 |
| `mandate_active_count` | `int` | sí | `0` | **cached**; recomputado al cambiar `mandates` (ver `ENTITY_MODEL.md`) |
| `completeness_score`, `created_at`, `updated_at`, `created_by`, `owner_id` | (idem) | — | — | — |

**Índices**: `user_id` unique, `mandate_focus.sectors` multikey, `mandate_focus.geographies` multikey.

### 4.8 `corporate_profile`

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id`, `profile_id`, `user_id` | (idem) | — | — | — |
| `company_size_band` | `enum` | no | `null` | ∈ `{micro, small, mid, large, enterprise}` |
| `sector` | `str` | no | `null` | slug |
| `role_in_company` | `str` | no | `null` | C-level, VP, director, manager, contributor |
| `decision_authority_level` | `enum` | sí | `"observer"` | ∈ `{proxy, observer, decision_maker, blocker}` |
| `mandate_type` | `enum` | no | `null` | ∈ `{sell_side, buy_side, both}` |
| `completeness_score`, ... | (idem) | — | — | — |

**Índices**: `user_id` unique, `sector`, `mandate_type`.

### 4.9 `investor_profile`

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id`, `profile_id`, `user_id` | (idem) | — | — | — |
| `investor_type` | `enum` | sí | — | ∈ `{pe, vc, family_office, sovereign, corporate_dev, individual}` |
| `aum_band` | `enum` | no | `null` | ∈ `{<10M, 10-50M, 50-250M, 250M-1B, >1B}` |
| `ticket_size_min_eur` | `int` | no | `null` | ≥ 0 |
| `ticket_size_max_eur` | `int` | no | `null` | ≥ `ticket_size_min_eur` |
| `geographies` | `list[str]` | sí | `[]` | slugs |
| `sectors` | `list[str]` | sí | `[]` | slugs |
| `stage_focus` | `list[str]` | sí | `[]` | ∈ `{seed, series_a, series_b, growth, buyout, distressed, secondary}` |
| `completeness_score`, ... | (idem) | — | — | — |

**Índices**: `user_id` unique, `investor_type`, `sectors` multikey, `geographies` multikey, `stage_focus` multikey.

### 4.10 Colecciones auxiliares

#### 4.10.1 `verification_attempts`

| Campo | Tipo | Notas |
|---|---|---|
| `_id`, `attempt_id` | — | — |
| `user_id` | FK | — |
| `kind` | enum `{email, phone, document}` | |
| `provider` | str | `mock` o nombre del adapter real |
| `provider_ref` | str | opaco |
| `status` | enum `{pending, succeeded, failed, expired}` | |
| `payload_redacted` | dict | snapshot de inputs no-sensibles |
| `created_at`, `completed_at` | datetimes | |

**Índices**: `(user_id, kind, status)`, `provider_ref`.

#### 4.10.2 `sessions`

| Campo | Tipo | Notas |
|---|---|---|
| `_id`, `session_id` | — | (reutiliza colección `user_sessions` actual) |
| `user_id`, `ip`, `user_agent` | — | (existente) |
| `created_at`, `expires_at` | — | (existente) |
| `last_active_at` | datetime | **nuevo** — usado para detectar idle timeout 1h |
| `revoked_at` | datetime | **nuevo** — para logout y revocación remota |
| `active_org_id` | str | **nuevo** — org actualmente seleccionada en esta sesión |

**Índices**: `session_id` unique, `user_id`, `expires_at`, `last_active_at`.

#### 4.10.3 `identity_audit_log`

Para cambios sensibles (role, ownership transfer, deletion). 

| Campo | Tipo | Notas |
|---|---|---|
| `_id`, `event_id` | — | — |
| `ts` | datetime | indexado |
| `actor_user_id` | FK | quién hizo el cambio |
| `subject_type` | enum `{user, organization, membership, team, profile, invitation}` | |
| `subject_id` | str | id de la entidad afectada |
| `action` | str | ej. `role_changed`, `ownership_transferred` |
| `before_snapshot` | dict | campos relevantes antes |
| `after_snapshot` | dict | campos relevantes después |
| `reason` | str? | si la mutación lo requiere |

**Índices**: `ts`, `(subject_type, subject_id, ts)`, `actor_user_id`.

**Retención**: 3 años post-última actividad (`OPEN-C14` del Sprint 0).

---

## 5. Ciclo de vida y estados

### 5.1 User

```
       ┌─────────────────────┐
       │ pending_verification│
       └──────────┬──────────┘
                  │ email verified
                  ▼
       ┌─────────────────────┐
       │       active        │◄────────────┐
       └──┬──────────┬───────┘             │
          │          │ kyc verified        │ reactivated
          │          ▼                     │ (admin/arroba_team)
          │  ┌──────────────┐              │
          │  │ active + kyc │              │
          │  └──────┬───────┘              │
          │         │ kyc expired          │
          │         ▼                      │
          │  ┌─────────────┐               │
          │  │ active +    │               │
          │  │ kyc_expired │               │
          │  └─────────────┘               │
          │                                │
          │  suspended by admin            │
          ▼                                │
       ┌─────────────────────┐             │
       │     suspended       │─────────────┘
       └──────────┬──────────┘
                  │ deleted (GDPR / user request / admin)
                  ▼
       ┌─────────────────────┐
       │      deleted        │ (soft)
       └─────────────────────┘
```

**Transiciones**:

| De → A | Quién dispara | Evento emitido |
|---|---|---|
| `pending_verification → active` | Sistema (email verificado) | `identity.user.email_verified` |
| `active → suspended` | `admin` o `arroba_team` (con razón) | `identity.user.suspended` |
| `suspended → active` | `admin` o `arroba_team` | `identity.user.reactivated` |
| `active|suspended → deleted` | User (GDPR), `admin` o sistema | `identity.user.deleted` |
| `none → pending → verified|failed → expired` (kyc) | KYC adapter callback | `identity.user.kyc_*` |

### 5.2 Organization

```
   created ──► active ──► archived (soft)
                  │           │
                  │           └──► reactivated (admin)
                  │
                  └──► suspended (admin/compliance)
                  │
                  └──► deleted (hard, sólo GDPR/legal)
```

**Transiciones**:

| De → A | Quién | Evento |
|---|---|---|
| `(none) → active` | `created_by` (user) | `identity.org.created` |
| `active → archived` | `owner_id` o `admin` | `identity.org.archived` |
| `archived → active` | `admin` o `arroba_team` | `identity.org.unarchived` |
| `active → suspended` | `admin` (compliance) | `identity.org.suspended` |
| `* → deleted` | `admin` con justificación legal | `identity.org.deleted` |

**Reglas**:
- Archivado de org: todas sus `memberships` mantienen su estado pero quedan inertes (no se pueden activar nuevas, no se pueden invitar nuevos members, no se pueden crear teams).
- Watchlists referenciadas en otras orgs siguen funcionando sobre la `company` declarada (no sobre la `org`), según decisión D14 del Sprint 0.

### 5.3 Membership

```
   pending ──► active ──► suspended ──► active
       │         │                ▲
       │         │                │
       │         └──► revoked     │
       │                          │
       └──► revoked (antes de aceptar)
                                  
   revoked es terminal (pero el (user, org) puede ser re-invitado, creando una membership nueva)
```

**Transiciones**:

| De → A | Quién | Evento |
|---|---|---|
| `(none) → pending` | Sistema al aceptar invitación | `identity.membership.created` |
| `pending → active` | Sistema cuando el user verifica email | `identity.membership.activated` |
| `active → suspended` | `owner`/`admin` de la org | `identity.membership.suspended` |
| `suspended → active` | `owner`/`admin` | `identity.membership.activated` |
| `* → revoked` | `owner`/`admin` (o el propio user para abandonar) | `identity.membership.revoked` |

**Reglas**:
- El `owner` de una org tiene membership `role = owner` única e intransferible (excepto vía ownership transfer, ver §5.6).
- Un user no puede revocar su propia membership si es el `owner` (debe transferir primero).
- Una membership `revoked` permite re-invitación posterior (nueva fila).

### 5.4 Invitation

```
   created (pending)
       │
       ├──► accepted ── crea membership
       ├──► declined  (terminal)
       ├──► expired   (tras 7d)
       └──► revoked   (por owner/admin antes de aceptar)
```

| De → A | Quién | Evento |
|---|---|---|
| `(none) → pending` | `owner`/`admin` crea invitación | `identity.invitation.created` |
| `pending → accepted` | Invitee user con cuenta válida | `identity.invitation.accepted` |
| `pending → declined` | Invitee | `identity.invitation.declined` |
| `pending → expired` | Sistema (cron) | `identity.invitation.expired` |
| `pending → revoked` | `owner`/`admin` | `identity.invitation.revoked` |

### 5.5 Team

```
   created (active) ──► archived (terminal soft)
```

| De → A | Quién | Evento |
|---|---|---|
| `(none) → active` | `owner`/`admin` de la org | `identity.team.created` |
| `active → archived` | `owner_id` del team o `admin` de la org | `identity.team.archived` |

**Regla especial**: el team con `is_default=true` (el "All members" por defecto) **no se puede archivar**. Su archivado lanza error `default_team_cannot_be_archived`.

### 5.6 Transferencia de ownership

**Aplica a**: `organization`, `team` (en futuro, también a `mandate`, `operation`, etc., vía contrato similar — pero esos viven en otros specs).

**Flujo**:
1. `owner_id` actual emite `POST /api/{entity}/{id}/transfer-ownership` con `new_owner_id`.
2. Sistema valida que `new_owner_id` tiene `membership.status = active` y `role ∈ {owner, admin}` en la misma org (para teams) o en la org misma.
3. Si OK: `owner_id` cambia. `created_by` permanece inmutable.
4. Evento `identity.{entity}.ownership_transferred` emitido con `from_user_id`, `to_user_id`.
5. Audit log obligatorio.
6. Si la entidad es `organization`: la membership con `role = owner` se mueve al nuevo user. El user antiguo conserva membership con `role = admin` (no se le revoca automáticamente).

---

## 6. Sesiones, tokens y autenticación

### 6.1 Métodos de autenticación soportados

1. **Email + Password** (clásico). Hash bcrypt cost 12.
2. **Google OAuth** via Emergent (ya operativo en `/app/backend/src/modules/auth/`). Reutilizado.
3. **Magic link** — **NO en v1** (forward para v2; `OPEN-I.5`).

### 6.2 Flow de login

```
   1. Cliente → POST /api/auth/login {email, password}
      ó       → POST /api/auth/session {emergent_session_id}
   2. Backend valida credenciales / valida sesión Emergent
   3. Backend crea sesión en Mongo (`sessions` colección) con:
        session_id, user_id, ip, user_agent, expires_at = now+24h,
        last_active_at = now, active_org_id = primer org del user o null
   4. Backend genera JWT con claims canónicos (ver 6.4)
   5. Cookie HTTPOnly Secure SameSite=Lax con session_id
   6. Response 200/201 { user: UserPublic, session_expires_at, jwt? }
```

**Cookie de sesión** (existente, reutilizada):
- Nombre: `arroba_session`
- Atributos: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.

### 6.3 Tokens y duraciones (decisión A8 del Sprint 0)

| Token | Duración | Persistencia |
|---|---|---|
| Access token (JWT) | **24h** | No persistido en backend (firmado, validado por firma) |
| Refresh token | **30d** | Persistido en `refresh_tokens` (nueva colección, ver 6.5) con hash |
| Session (cookie) | 24h con sliding window | Persistida en `sessions` con `last_active_at` |
| Idle timeout | **1h** sin actividad | Si `now - last_active_at > 1h` y la sesión es interactiva, requiere re-autenticación |

**Sliding window de session**: cada request autenticada actualiza `last_active_at = now`. Si supera idle de 1h, la sesión se considera **stale** y se exige re-auth incluso si `expires_at` aún no ha llegado.

### 6.4 Claims canónicos en el token

> El JWT (o el payload de `/api/auth/me`) transporta los claims que las capas superiores (Authorization, Subscription) usarán como input.

```json
{
  "iss": "arroba.com",
  "sub": "user_xxxxxxxx",
  "iat": 1719312000,
  "exp": 1719398400,
  "session_id": "sess_xxxxxxxx",
  "email": "lucia@example.com",
  "email_verified": true,
  "phone_verified": false,
  "role_global": "advisor",
  "active_org_id": "org_xxxxxxxx",
  "memberships": [
    {"org_id": "org_aaa", "role": "owner", "team_ids": ["team_default", "team_legal"]},
    {"org_id": "org_bbb", "role": "operator", "team_ids": ["team_default"]}
  ],
  "kyc_status": "verified",
  "kyc_expires_at": "2027-06-25T00:00:00Z",
  "risk_score": 12,
  "language": "es",
  "arroba_team_flag": false,
  "profile_kinds": ["advisor", "professional"]
}
```

**Notas**:
- `memberships[]` incluye solo memberships con `status = active`.
- `active_org_id` puede ser `null` si el user no pertenece a ninguna org todavía.
- `profile_kinds[]` deriva de qué perfiles existen para el user.
- `arroba_team_flag` es `true` SI y SOLO SI `role_global = arroba_team`.
- El JWT NO incluye campos PII detallados (bio, dirección, etc.); para esos hay que consultar `/api/users/{id}`.

### 6.5 Refresh tokens

**Nueva colección `refresh_tokens`**:

| Campo | Tipo | Notas |
|---|---|---|
| `_id`, `refresh_id` | — | — |
| `user_id` | FK | — |
| `session_id` | FK | — |
| `token_hash` | str | bcrypt del refresh token plano |
| `family_id` | str | refresh token rotation: una "familia" de refresh tokens; rotación crea nuevo y revoca anterior |
| `expires_at` | datetime | now + 30d |
| `revoked_at` | datetime? | si rotado o revocado explícitamente |
| `created_at` | datetime | — |

**Flow de refresh**:
1. Cliente → `POST /api/auth/refresh {refresh_token}`.
2. Backend valida hash, expiración, `revoked_at = null`.
3. Si OK: genera nuevo refresh + nuevo JWT; revoca anterior (rotation).
4. **Reuse detection**: si se usa un refresh ya revocado, se revoca toda la `family_id` (signal de robo).

### 6.6 Política de revocación

| Trigger | Acción |
|---|---|
| Logout explícito | Marca `sessions.revoked_at = now`; revoca `refresh_tokens` de la session. |
| Cambio de password | Revoca **todas** las sessions y refresh tokens del user (force re-login en todos los devices). |
| Suspensión del user | Revoca todas. |
| Cambio de `role_global` | Revoca todas (forza re-issuance del JWT con nuevos claims). |
| Cambio de `kyc_status` a `verified` o `expired` | Revoca el JWT actual (los siguientes requests obtendrán nuevo JWT con claim actualizado) — implementado vía short JWT TTL + refresh. |
| Detección de reuse | Revoca toda la `family_id`. |

### 6.7 Multi-device sessions

- Un user puede tener **N sesiones activas simultáneas** (móvil + desktop + tablet).
- `GET /api/auth/sessions` lista las sesiones del user.
- `DELETE /api/auth/sessions/{id}` revoca una específica.
- `DELETE /api/auth/sessions` revoca todas excepto la actual.

---

## 7. Verificación progresiva

### 7.1 Filosofía

> "No frenar la activación temprana del user con verificaciones innecesarias para la acción que está intentando."

Esto se traduce en tres canales independientes con **gating por contexto de acción**, no por estado global del user.

### 7.2 Email — obligatoria

- **Cuándo**: al primer login post-registro (auto-registro o invitación aceptada).
- **Cómo**:
  1. Sistema genera `verification_attempts` con `kind = email`, token único, expiración 24h.
  2. Email enviado con link `https://arroba.com/verify/{token}`.
  3. Click → `POST /api/auth/verify-email {token}`.
  4. `users.email_verified = true`, `email_verified_at = now`.
  5. Si el user vino de invitación, su membership transita `pending → active`.
- **Acciones gated mientras `email_verified = false`**:
  - 🚫 `POST /api/organizations` (crear org).
  - 🚫 `POST /api/invitations/{token}/accept` (aceptar invitación).
  - 🚫 Cualquier escritura de profile.
  - ✅ Lectura general (fichas públicas) sigue permitida.
- **Reenvío**: `POST /api/auth/resend-verify-email` con rate limit (3 / hora).

### 7.3 Phone — opcional

- **Cuándo**: en cualquier momento desde el panel del user.
- **Cómo**:
  1. `POST /api/users/me/verify-phone/start {phone}` — sistema envía SMS con OTP 6 dígitos vía adapter Twilio mock.
  2. `POST /api/users/me/verify-phone/confirm {otp}` — sistema valida OTP, marca `phone_verified = true`.
- **Gate**: ninguna acción actual de v1 lo exige duramente. Es **opt-in** para fortalecer la cuenta y como segundo factor en futuro 2FA (no en Sprint 1).
- **Rate limit**: 3 intentos OTP por phone por hora; 5 por día.

### 7.4 Document / KYC — gated por contexto

- **Cuándo**: **NO** al registro. Se exige cuando el user intenta una acción del Transaction OS que lo requiere:
  - Firmar LOI (fase T10).
  - Firmar SPA (fase T13).
  - Closing (fase T14).
  - Execution de Finder Fee / Success Fee (vía Billing futuro).
  - Operaciones donde `risk_score > threshold` (configurable por Authorization).
- **Cómo**:
  1. La acción gated llama internamente a `identity.require_kyc(user_id, level)`.
  2. Si `user.kyc_status != "verified"` o `kyc_expires_at < now`, retorna error `kyc_required` con el `level` exigido.
  3. Frontend redirige al user a flow KYC.
  4. `POST /api/kyc/initiate` — sistema crea `verification_attempts` y delega al adapter. Mock devuelve URL sandbox con auto-success en 5s.
  5. Adapter (mock o real) llama webhook `POST /api/kyc/webhook` con `status, provider_ref, payload_redacted`.
  6. Sistema actualiza `users.kyc_status` y emite `identity.user.kyc_verified` (o `kyc_failed`).
- **Re-verificación**: cuando `kyc_expires_at < now`, la siguiente acción sensible vuelve a exigir el flow completo.

### 7.5 Política de expiración

| Verificación | Expiración default | Comentario |
|---|---|---|
| Email | sin expiración (válido para siempre) | el email es identidad; si cambia, se re-verifica el nuevo |
| Phone | sin expiración (válido para siempre) | idem |
| KYC | 12 meses (`kyc_verified_at + 365d`) | regulatorio; configurable global por jurisdicción en futuro |

### 7.6 Política de fallo

Cuando el adapter retorna `failed` (KYC rechazado por proveedor):
- `users.kyc_status = "failed"`.
- Evento `identity.user.kyc_failed` con `reason_code`.
- El user puede reintentar tras 24h (rate limit) con nueva attempt.
- Si falla 3 veces consecutivas: bloqueo soft + notificación a `arroba_team` para revisión humana.

---

## 8. Profiles — gestión y completeness

### 8.1 Política de creación

- **Explícita**: el user los crea desde el panel; nunca se autocrean al registro.
- **0..N por user**: un user puede tener simultáneamente profile professional + profile advisor + profile investor (típicamente un Advisor independiente con inversión personal).
- **Unicidad**: cada perfil es único por `(user_id, kind)`. No se puede crear dos `advisor_profile` para el mismo user.

### 8.2 Reglas de unicidad y solapamiento

**Pregunta canónica**: ¿un mismo user puede ser `advisor` en una org y `corporate` employee en otra org distinta simultáneamente?

**Respuesta**: **SÍ**. Los perfiles son del **user** (no de la org). Sus memberships en distintas orgs pueden tener distinto `role` (en la Org Cliente A puede ser `operator`; en su empresa empleadora B puede ser `member`). Sus perfiles tipados son ortogonales al membership.

Implicación: **un mismo user puede aparecer como Advisor en una operación M&A y como Corporate Buyer en otra operación distinta**. Esto se gestiona en Authorization vía policies que evalúan `claim.memberships[].role`, no en Identity.

### 8.3 Completeness score

**Reglas declarativas** (vivirán en config Mongo o YAML; **NO hardcoded**):

```
professional_profile completeness:
  weights:
    headline: 10
    bio: 15
    current_company: 10
    current_role: 10
    years_experience: 5
    industries: 15 (>=1)
    geographies: 10 (>=1)
    linkedin_url: 15
    expertise_tags: 10 (>=3)
  total: 100
```

(Cada profile_kind tiene su tabla de weights; suma 100. Score actual = suma de weights de campos rellenados que pasan validación mínima.)

**Recomputación**: en cada `PATCH` sobre el profile. El nuevo score se guarda en `completeness_score`. Si cambia, se emite `identity.profile.completeness_changed`.

### 8.4 Visibilidad de perfiles

Forward dependency a Authorization:
- Algunos campos del perfil son **públicos** (visibles para `anonymous`).
- Otros son **internos** (visibles solo dentro de la org del user o para contrapartes en una operación activa).
- Otros son **privados** (visibles solo para el user mismo o `arroba_team`).

Identity declara el campo `visibility_level` por field (en config); Authorization evalúa.

**Para v1** (declarativo, sin lógica todavía):
- Públicos: `headline`, `current_role`, `industries`, `geographies` (limitados), `expertise_tags`, `firm_name`, `investor_type`.
- Internos: `current_company`, `bio`, `years_experience`, `linkedin_url`, `mandate_focus`, `aum_band`.
- Privados: `compliance_certifications`, `historical_deals_volume_eur`, `risk_score`, `kyc_*`.

### 8.5 Eventos

`identity.profile.created`, `identity.profile.updated`, `identity.profile.completeness_changed`, `identity.profile.deleted`.

---

## 9. Invitaciones

### 9.1 Quién puede invitar

**Decisión usuario**: solo `owner` o `admin` de la org. **NO `operator`**, **NO `member`**, **NO `guest`**.

Validación en endpoint: `POST /api/organizations/{org_id}/invitations` exige que `invited_by.membership_in(org_id).role ∈ {owner, admin}` y `status = active`.

### 9.2 Flow canónico

```
1. owner/admin → POST /api/organizations/{org_id}/invitations
                  {email, role, team_ids[]}
2. Sistema valida:
     - invited_by.role ∈ {owner, admin}
     - email no tiene membership activa en esta org
     - role != owner (no se invita como owner; sólo se transfiere ownership)
     - team_ids pertenecen a la org
3. Sistema genera token plano (32 bytes random base64url)
4. Sistema crea invitations{ ..., token=bcrypt(token_plano), token_expires_at=now+7d }
5. Sistema envía email al invitee con link
     /accept-invitation?token={token_plano}
6. Frontend recibe token → POST /api/invitations/{token}/accept
7a. Si el email NO tiene cuenta:
     - Sistema crea user{status=pending_verification, role_global=subscriber}
     - Envía email de verificación al MISMO email
     - Crea membership{status=pending} (transita a active al verificar email)
7b. Si el email tiene cuenta:
     - Crea directamente membership{status=active}
8. Evento identity.invitation.accepted
9. Evento identity.membership.created
```

### 9.3 Plantilla del email

Referencia a UX. El backend NO genera HTML aquí; sólo invoca al adapter de email con:
```
template_id: "invitation_v1"
variables:
  org_name, inviter_display_name, role, team_names[], 
  accept_url (con token plano), expires_at
locale: invitee.language o fallback "es"
```

### 9.4 Revocación

`DELETE /api/invitations/{id}` por `owner`/`admin`:
- `invitations.status = revoked`, `revoked_at = now`, `revoked_by = actor`.
- Si el invitee intenta aceptar después, recibe `invitation_revoked`.
- Evento `identity.invitation.revoked`.

### 9.5 Expiración

Cron job (background, frecuencia 1h):
- Busca `invitations` con `status = pending` y `token_expires_at < now`.
- Actualiza `status = expired`, emite `identity.invitation.expired`.

### 9.6 Reinvitación

Si una invitación expira o se revoca, `owner`/`admin` puede crear una **nueva** invitación al mismo email (siempre que el email no tenga ya una membership activa). La invitación previa queda en histórico.

### 9.7 Auto-join blocking

No existe "invitación abierta" en v1 (un link compartible sin destinatario). Toda invitación es `(email, org)` específica.

---

## 10. Multi-tenant y aislamiento

### 10.1 Modelo (decisión D10 del Sprint 0)

**Mongo compartido con aislamiento lógico estricto.**

- **Una sola instancia Mongo** comparte todas las colecciones de todos los tenants.
- **Toda colección que contenga datos por-org incluye `org_id`** como campo indexado.
- **Toda query** que lea/mute datos por-org **incluye `org_id` en el filtro**.

### 10.2 Convención por colección

| Colección | Tiene `org_id`? | Filtro obligatorio en queries |
|---|---|---|
| `users` | No (un user es entidad global) | — |
| `organizations` | (es ella misma) | — |
| `memberships` | Sí | `org_id` + `user_id` |
| `teams` | Sí | `org_id` |
| `invitations` | Sí | `org_id` |
| `professional_profile` | No (perfil del user, global) | — |
| `advisor_profile` | No | — |
| `corporate_profile` | No (pero referencia opcional a `org_id` empleadora) | — |
| `investor_profile` | No | — |
| `sessions` | No (sesión del user) | — |
| `verification_attempts` | No | — |
| `identity_audit_log` | A veces (cuando subject es entidad org-bound) | — |
| `refresh_tokens` | No | — |

### 10.3 Cross-org: prohibido por defecto

- Un user con membership activa en Org A NO puede leer datos de Org B (a menos que tenga también membership activa en B, lo cual es un caso legítimo distinto).
- Endpoint `GET /api/organizations/{org_id}/members` retorna 403 si el actor no tiene membership activa en `org_id`.
- Endpoint `GET /api/teams/{team_id}` retorna 403 si el actor no tiene membership activa en el `org_id` del team.

### 10.4 Excepciones canónicas

| Caso | Quién | Por qué |
|---|---|---|
| `arroba_team` mediación | Users con `role_global = arroba_team` | Mediación operativa documentada (resolución OPEN-B2 del Sprint 0) |
| `admin` global | `role_global = admin` | Soporte / debugging — siempre auditado |
| Watchlists referenciando companies públicas | Cualquier user autenticado | Las watchlists referencian la `company` (entidad pública del catálogo), no la `org`. Cumple D14. |

Toda excepción está sujeta a `identity_audit_log`.

### 10.5 Cambio de `active_org_id`

- El frontend mantiene `active_org_id` en la sesión persistida (`sessions.active_org_id`).
- `POST /api/auth/switch-org {org_id}`:
  1. Valida que `user.memberships[].org_id` incluye `org_id` con `status = active`.
  2. Actualiza `sessions.active_org_id`.
  3. Emite nuevo JWT con `active_org_id` actualizado.
  4. Evento `identity.session.org_switched`.

---

## 11. Eventos canónicos del Identity Engine

### 11.1 Catálogo

```
identity.user.created
identity.user.email_verified
identity.user.phone_verified
identity.user.kyc_pending
identity.user.kyc_verified
identity.user.kyc_failed
identity.user.kyc_expired
identity.user.role_global_changed
identity.user.suspended
identity.user.reactivated
identity.user.deleted

identity.org.created
identity.org.updated
identity.org.archived
identity.org.unarchived
identity.org.suspended
identity.org.deleted
identity.org.ownership_transferred
identity.org.kyc_pending
identity.org.kyc_verified
identity.org.kyc_failed
identity.org.kyc_expired
identity.org.vies_validated

identity.membership.created
identity.membership.activated
identity.membership.role_changed
identity.membership.team_changed
identity.membership.suspended
identity.membership.revoked

identity.team.created
identity.team.renamed
identity.team.archived
identity.team.ownership_transferred

identity.invitation.created
identity.invitation.accepted
identity.invitation.declined
identity.invitation.expired
identity.invitation.revoked

identity.profile.created
identity.profile.updated
identity.profile.deleted
identity.profile.completeness_changed

identity.session.started
identity.session.ended
identity.session.expired
identity.session.idle_timeout
identity.session.org_switched
identity.token.refreshed
identity.token.revoked
identity.token.reuse_detected
```

### 11.2 Estructura común de evento

```json
{
  "event_id": "evt_xxxxxxxx",
  "event_type": "identity.user.email_verified",
  "ts": "2026-06-25T14:30:00.000Z",
  "correlation_id": "corr_xxxxxxxx",
  "actor": {
    "user_id": "user_xxxxxxxx",
    "role_global": "subscriber",
    "session_id": "sess_xxxxxxxx"
  },
  "subject": {
    "type": "user",
    "id": "user_xxxxxxxx"
  },
  "payload": {
    "email": "lucia@example.com",
    "verified_at": "2026-06-25T14:30:00.000Z"
  },
  "tenant": null,
  "source": "identity"
}
```

### 11.3 Productores y consumidores

| Evento | Productor | Consumidores |
|---|---|---|
| `identity.user.email_verified` | Identity Engine | Authorization (claim refresh), Memory Engine (hidratación inicial), Notification Service |
| `identity.user.kyc_verified` | Identity Engine | Authorization (re-evaluación de gates), Subscription (re-evaluación de entitlements gated por KYC) |
| `identity.user.role_global_changed` | Identity Engine | Authorization (invalida caché de policies para ese user) |
| `identity.org.created` | Identity Engine | Subscription (puede crear plan default `anonymous`/`subscriber` para esa org), Memory Engine |
| `identity.org.archived` | Identity Engine | Authorization (revoca permisos org-scoped), Transaction OS (notifica si hay operations activas) |
| `identity.org.ownership_transferred` | Identity Engine | Authorization, Notification |
| `identity.membership.role_changed` | Identity Engine | Authorization (invalida caché) |
| `identity.membership.revoked` | Identity Engine | Authorization, Memory Engine (purge memoria scope=membership) |
| `identity.invitation.created` | Identity Engine | Notification Service (envía email) |
| `identity.team.archived` | Identity Engine | Authorization (revoca permisos team-scoped) |
| `identity.profile.completeness_changed` | Identity Engine | UX (muestra prompt si <80%), Subscription (algunos gates exigen perfil completo) |
| `identity.session.idle_timeout` | Identity Engine | UX (forza re-auth modal) |
| `identity.token.reuse_detected` | Identity Engine | Security Service (forward), Notification (alerta al user) |

> **Forward dependency**: cuando otros engines no existen todavía, los eventos se emiten igualmente (no se bloquean). Los consumidores se suscriben asíncronamente.

### 11.4 Transporte

- **v1**: eventos persistidos en colección `event_bus` con `consumed_by[]`. Pulling por consumidores en background tasks.
- **v2+**: migración a NATS / Redis Streams si el volumen lo justifica (no en Sprint 1).

---

## 12. APIs canónicas (mapa)

> Verbo + path + propósito. Detalle de payloads en cada PR de implementación. NO OpenAPI completo.

### 12.1 Auth & Session

| Verbo | Path | Propósito |
|---|---|---|
| POST | `/api/auth/register` | Registro email/password. Crea user `pending_verification`. |
| POST | `/api/auth/login` | Login email/password. Crea session. |
| POST | `/api/auth/session` | Exchange Emergent Google session_id → arroba session. |
| POST | `/api/auth/logout` | Logout idempotente. |
| POST | `/api/auth/refresh` | Refresh token rotation. |
| POST | `/api/auth/verify-email` | Confirma token de email. |
| POST | `/api/auth/resend-verify-email` | Reenvía email (rate-limited). |
| POST | `/api/auth/switch-org` | Cambia `active_org_id` en la sesión. |
| GET | `/api/auth/me` | Devuelve `UserPublic` + `memberships[]` + claims. |
| GET | `/api/auth/sessions` | Lista sesiones activas del user. |
| DELETE | `/api/auth/sessions/{session_id}` | Revoca una sesión. |
| DELETE | `/api/auth/sessions` | Revoca todas excepto la actual. |

### 12.2 Users

| Verbo | Path | Propósito |
|---|---|---|
| GET | `/api/users/me` | Detalle del user actual (compat con `/api/auth/me`). |
| PATCH | `/api/users/me` | Actualiza `display_name`, `language`, `timezone`, `preferences`. |
| GET | `/api/users/{id}` | Lectura pública/parcial de otro user (campos según visibilidad). |
| DELETE | `/api/users/me` | Soft delete (GDPR self-service); revoca todo. |
| POST | `/api/users/me/verify-phone/start` | Inicia OTP phone. |
| POST | `/api/users/me/verify-phone/confirm` | Confirma OTP. |

### 12.3 Organizations

| Verbo | Path | Propósito |
|---|---|---|
| POST | `/api/organizations` | Crea org. Quien la crea queda como `owner` y único member. |
| GET | `/api/organizations/mine` | Orgs del user actual con su membership. |
| GET | `/api/organizations/{id}` | Detalle (con permisos). |
| PATCH | `/api/organizations/{id}` | Editar (name, legal_address, etc.). Sólo `owner`/`admin`. |
| POST | `/api/organizations/{id}/transfer-ownership` | Transfiere `owner_id`. Sólo `owner`. |
| POST | `/api/organizations/{id}/archive` | Archiva. Sólo `owner`. |
| POST | `/api/organizations/{id}/unarchive` | Desarchiva. Sólo `admin` o `arroba_team`. |
| POST | `/api/organizations/{id}/vies-validate` | Dispara validación VAT ID contra VIES. |

### 12.4 Memberships

| Verbo | Path | Propósito |
|---|---|---|
| GET | `/api/organizations/{org_id}/memberships` | Lista memberships. Sólo members de la org. |
| GET | `/api/memberships/{id}` | Detalle. |
| PATCH | `/api/memberships/{id}` | Cambia `role` y/o `team_ids`. Sólo `owner`/`admin`. |
| DELETE | `/api/memberships/{id}` | Revoca. Sólo `owner`/`admin` (o el user mismo si no es `owner`). |
| POST | `/api/memberships/{id}/suspend` | Suspende. |
| POST | `/api/memberships/{id}/activate` | Activa (desde suspended). |

### 12.5 Teams

| Verbo | Path | Propósito |
|---|---|---|
| POST | `/api/organizations/{org_id}/teams` | Crea team. Sólo `owner`/`admin`. |
| GET | `/api/organizations/{org_id}/teams` | Lista teams. |
| GET | `/api/teams/{id}` | Detalle. |
| PATCH | `/api/teams/{id}` | Edita (name, description, owner_id). |
| POST | `/api/teams/{id}/archive` | Archiva (no para `is_default=true`). |
| POST | `/api/teams/{id}/transfer-ownership` | Transfiere team ownership. |

### 12.6 Invitations

| Verbo | Path | Propósito |
|---|---|---|
| POST | `/api/organizations/{org_id}/invitations` | Crea invitación. Sólo `owner`/`admin`. |
| GET | `/api/organizations/{org_id}/invitations` | Lista invitaciones de la org. |
| POST | `/api/invitations/{token}/accept` | Acepta (auth requerido o crea user). |
| POST | `/api/invitations/{token}/decline` | Declina. |
| DELETE | `/api/invitations/{id}` | Revoca (sólo `owner`/`admin`). |
| POST | `/api/invitations/{id}/resend` | Reenvía email. |

### 12.7 Profiles

| Verbo | Path | Propósito |
|---|---|---|
| POST | `/api/users/me/profiles/professional` | Crea perfil profesional del user actual. |
| GET | `/api/users/me/profiles/professional` | Lee propio. |
| PATCH | `/api/users/me/profiles/professional` | Actualiza propio. |
| DELETE | `/api/users/me/profiles/professional` | Soft delete propio. |
| GET | `/api/users/{id}/profiles/professional` | Lectura con filtro de visibilidad. |
| (mismas rutas para `/advisor`, `/corporate`, `/investor`) | | |

### 12.8 KYC

| Verbo | Path | Propósito |
|---|---|---|
| POST | `/api/kyc/initiate` | Inicia flow KYC para el user actual. Adapter devuelve sandbox URL (mock) o real URL. |
| POST | `/api/kyc/webhook` | Endpoint público con HMAC. Recibe callback del adapter. |
| GET | `/api/kyc/status/{user_id}` | Consulta estado actual (con permisos). |

### 12.9 Audit (admin/arroba_team only)

| Verbo | Path | Propósito |
|---|---|---|
| GET | `/api/admin/identity/audit?subject_id=...&from=...&to=...` | Consulta audit log de Identity. |

---

## 13. Boundary First — qué es externo

### 13.1 Filosofía

Identity declara **adapters** abstractos para todo proveedor externo. v1 entrega **mocks** que satisfacen el contrato; cuando llega proveedor real, sólo se sustituye el adapter sin tocar callers.

### 13.2 Catálogo de adapters

| Adapter | Contrato | Mock v1 | Real futuro |
|---|---|---|---|
| **EmailAdapter** | `send(template_id, to, locale, variables) → message_id` | adapter que **logguea + no envía** (dev) o usa Resend si `EMAIL_PROVIDER=resend` | Resend / SendGrid / AWS SES |
| **SmsAdapter** | `send_otp(phone, otp) → message_id`; `verify_otp(phone, otp) → bool` | adapter que **logguea el OTP** + auto-success (dev) | Twilio / Vonage |
| **KycAdapter** | `initiate(user_id, level) → SandboxResponse`; `webhook → KycUpdate` | adapter que devuelve sandbox URL + auto-completa en 5s o por trigger manual | Onfido / Veriff / Sumsub / Stripe Identity |
| **ViesAdapter** | `validate(vat_id) → ViesResult { valid, company_name?, registered_address? }` | adapter local con regex EU VAT + cache positivo 7d | Servicio VIES de la Comisión Europea |
| **EmergentGoogleOAuthAdapter** | `exchange_session(session_id) → UserPayload` | **REAL** desde v1 (reutiliza existente) | (ya real) |
| **RiskComplianceAdapter** | `assess(user_id, context) → { risk_score, factors[] }` | adapter que devuelve `risk_score = 0` para todos | Risk & Compliance Service (forward dependency, ver `MEMORY_ENGINE_SPEC §15`) |

### 13.3 Convenciones

- Toda adapter ejecuta en background si la latencia >200ms estimada.
- Toda adapter es invocada vía interface; nunca por import directo del SDK.
- Toda adapter incluye `provider_ref` opaco en la respuesta (para diagnóstico).
- Toda adapter respeta `X-Source: mock|real` header (visible en logs).
- Falla del adapter NO crashea Identity: degrada explícitamente y emite evento `identity.adapter.error`.

### 13.4 Configuración por env

```
EMAIL_PROVIDER=mock          # mock | resend | sendgrid
SMS_PROVIDER=mock            # mock | twilio
KYC_PROVIDER=mock            # mock | onfido | veriff | sumsub | stripe_identity
VIES_PROVIDER=local          # local (cache+regex) | vies_real
RISK_PROVIDER=mock           # mock | service
```

---

## 14. Política de seguridad

### 14.1 Password policy

- **Mínimo 8 caracteres** (existente).
- **Sin restricción de complejidad** (no exigimos mayúscula/dígito/símbolo) — mejor passphrase larga que password complejo corto, según NIST 800-63B.
- **Lista negra**: 10.000 passwords más comunes (lib `zxcvbn` opcional) — banear los top 100 obligatoriamente.
- **No rotación obligatoria**: solo se fuerza change tras detección de breach.
- **Cambio voluntario**: `POST /api/auth/change-password` — revoca todas las sessions.

### 14.2 Rate limiting

| Endpoint | Límite | Ventana |
|---|---|---|
| `POST /api/auth/login` | 5 | 5 min por IP+email |
| `POST /api/auth/register` | 3 | 1h por IP |
| `POST /api/auth/resend-verify-email` | 3 | 1h por user |
| `POST /api/users/me/verify-phone/start` | 3 | 1h por user |
| `POST /api/users/me/verify-phone/confirm` | 5 | 15 min por user |
| `POST /api/kyc/initiate` | 3 | 24h por user |
| `POST /api/invitations/{token}/accept` | 10 | 1h por IP |

Implementación con `slowapi` o `fastapi-limiter` (decisión técnica en PR, no canon).

### 14.3 Brute force protection

- 5 logins fallidos consecutivos en 5 min → bloqueo soft del email durante 15 min (responde 429 sin revelar si email existe).
- 20 fallidos en 24h → bloqueo hard (24h), email al user notificando intento.
- Detección de patrón de credential stuffing: si N IPs distintas fallan login con N emails distintos en M minutos → bloqueo de IP origen.

### 14.4 Account lockout

- Bloqueo soft (auto-reset tras ventana).
- Bloqueo hard (requiere `arroba_team` / `admin` para desbloquear).
- User notificado por email en cualquier bloqueo.

### 14.5 GDPR — derechos del titular

| Derecho | Implementación |
|---|---|
| **Acceso** (Art. 15) | `GET /api/users/me` retorna todos los datos PII del user (puede ampliarse a un export ZIP en futuro). |
| **Rectificación** (Art. 16) | `PATCH /api/users/me` y profiles. |
| **Supresión** (Art. 17) | `DELETE /api/users/me` → soft delete inmediato; hard delete tras 30d salvo retención legal obligatoria. |
| **Portabilidad** (Art. 20) | Endpoint futuro `GET /api/users/me/export` (no v1, `OPEN-I.7`). |
| **Oposición** (Art. 21) | Manual vía `arroba_team`. |

**Hard delete process** (post 30d soft):
1. User entry → solo `user_id`, `deleted_at` permanecen para integridad referencial.
2. PII (email, name, phone) → hash unidireccional.
3. Profiles → eliminados.
4. Sessions, tokens → eliminados.
5. Audit log → conservado 3 años (legal); referencias a `user_id` permanecen.

### 14.6 Auditing de cambios sensibles

Operaciones que **siempre** generan entrada en `identity_audit_log`:
- Cambio de `role` en membership.
- Transferencia de ownership (org, team).
- Cambio de `role_global` del user.
- Suspensión / reactivación de user u org.
- Archivado / desarchivado de org o team.
- KYC status change.
- Bloqueo / desbloqueo de cuenta.
- Login desde IP nueva (geo distinta) — notifica al user.

### 14.7 Aislamiento de datos PII

- `password_hash`, `google_id`, `kyc_provider_ref` **nunca** se devuelven en responses públicos.
- `phone` solo al user mismo (no en `GET /api/users/{id}`).
- Logs estructurados redactan PII (`email` → `e***@***.com`).

---

## 15. Migración del código actual

### 15.1 Resumen

| Componente actual | Líneas actuales | Acción Sprint 1 | Líneas estimadas tras Sprint 1 |
|---|---:|---|---:|
| `auth/cookies.py`, `dependencies.py`, `models.py`, `router.py`, `service.py` | 402 | **Reutilizar**, extender claims | 500-600 |
| `users/models.py`, `router.py`, `service.py` | 48 | **Extender ampliamente** | 250-350 |
| `organizations/models.py`, `router.py`, `service.py` | 352 | **Extender** con teams, ownership transfer | 600-800 |
| `shared/types.py` (enums) | ~40 | **Extender** roles + nuevos enums | ~100 |
| (nuevo) `teams/` módulo | 0 | **Crear** | 300-500 |
| (nuevo) `profiles/` módulo (4 tipos) | 0 | **Crear** | 600-900 |
| (nuevo) `kyc/` módulo + adapter mock | 0 | **Crear** | 200-300 |
| (nuevo) `verification/` (email + phone) | en `auth` | **Extender** desde auth | 200-300 |

### 15.2 Detalle por archivo

#### `auth/models.py` (existente, 60 líneas)

- ✅ **Mantener**: `RegisterPayload`, `LoginPayload`, `SessionExchangePayload`, `UserInDB`, `UserPublic`, `AuthResponse`.
- 🟡 **Extender `UserInDB`**: añadir todos los campos canónicos del §4.1 (language, timezone, preferences, phone, phone_verified, kyc_*, risk_*, status, deleted_at, owner_id).
- 🟡 **Extender `UserPublic`**: añadir `language`, `timezone`, `phone_verified`, `kyc_status`, `risk_score`, `profile_kinds[]`, `arroba_team_flag`.
- ➕ **Nuevo**: `Claims` (TypedDict para el payload del JWT).
- ➕ **Nuevo**: `RefreshTokenPayload`, `RefreshResponse`.

#### `auth/service.py` (existente, 165 líneas)

- ✅ **Mantener**: `register_user`, `login_user`, `exchange_emergent_session`, `resolve_session`, `logout`, `get_user_public`.
- 🟡 **Extender**: `_create_session` añade `last_active_at` y `active_org_id`.
- 🟡 **Extender**: `resolve_session` aplica idle timeout (1h).
- ➕ **Nuevo**: `refresh_access_token`, `revoke_all_sessions(user_id)`, `revoke_session(session_id)`, `switch_active_org(session_id, org_id)`.
- ➕ **Nuevo**: `build_claims(user) → Claims`.

#### `auth/router.py` (existente, 97 líneas)

- ✅ **Mantener**: `/register`, `/login`, `/session`, `/me`, `/logout`.
- ➕ **Nuevo**: `/refresh`, `/verify-email`, `/resend-verify-email`, `/switch-org`, `/sessions` (GET, DELETE).

#### `users/models.py` (existente, 7 líneas)

- 🟡 **Reescribir**: `UpdateMePayload` extender con `language`, `timezone`, `preferences`, `phone` (con validación).

#### `users/service.py` (existente, 23 líneas)

- 🟡 **Extender**: `update_me` aceptar campos canónicos.
- ➕ **Nuevo**: `delete_me` (soft).
- ➕ **Nuevo**: `start_phone_verification`, `confirm_phone_verification`.

#### `users/router.py` (existente, 21 líneas)

- ✅ **Mantener**: `GET /me`, `PATCH /me`.
- ➕ **Nuevo**: `DELETE /me`, `POST /me/verify-phone/start`, `POST /me/verify-phone/confirm`.
- ➕ **Nuevo**: `GET /api/users/{id}` (lectura pública con filtro de visibilidad).

#### `organizations/models.py` (existente, 112 líneas)

- ✅ **Mantener**: `CreateOrgPayload`, `OrgInDB`, `OrgPublic`, `MembershipInDB`, `MembershipPublic`, `InvitationInDB`, `InvitationPublic`.
- 🟡 **Extender `OrgInDB`**: añadir `slug`, `org_type`, `vat_id`, `vies_validated`, `legal_address`, `owner_id` (separado de `created_by`), `kyc_*`, `risk_*`, `archived_*`.
- 🟡 **Extender `MembershipInDB`**: añadir `team_ids: list[str]`, ampliar `role` enum a `{owner, admin, operator, member, guest}`.
- 🟡 **Extender `InvitationInDB`**: añadir `team_ids[]`, hash del token (no plain).
- ➕ **Nuevo**: `TransferOwnershipPayload`, `ArchiveOrgPayload`.

#### `organizations/service.py` (existente, 220 líneas est.)

- 🟡 **Extender**: `create_org` añade owner_id, slug autogeneration, validación VAT.
- 🟡 **Extender**: `create_invitation` valida `invited_by.role ∈ {owner, admin}` (decisión usuario).
- 🟡 **Extender**: `accept_invitation` actualiza `team_ids` de la nueva membership.
- ➕ **Nuevo**: `transfer_ownership`, `archive_org`, `unarchive_org`, `change_membership_role`, `change_membership_teams`, `suspend_membership`.

#### `shared/types.py` (existente)

- 🟡 **Extender `Role`**: añadir `arroba_team`.
- 🟡 **Extender `OrgRole`**: añadir `member`, `guest` (manteniendo `owner`, `admin`, `operator`).
- ➕ **Nuevos enums**: `KycStatus`, `UserStatus`, `OrgType`, `OrgStatus` (ya existe; sólo añadir valores), `TeamStatus`, `SessionStatus`, `RefreshTokenStatus`, `ProfileKind`, `VerificationKind`, `VerificationStatus`.

#### `teams/` (nuevo módulo)

- Estructura paralela a `organizations/`:
  - `models.py`: `TeamInDB`, `TeamPublic`, `CreateTeamPayload`, `UpdateTeamPayload`.
  - `service.py`: `create_team`, `get_team`, `list_teams`, `update_team`, `archive_team`, `transfer_team_ownership`, `bootstrap_default_team`.
  - `router.py`: endpoints §12.5.

#### `profiles/` (nuevo módulo)

- 4 sub-módulos: `professional`, `advisor`, `corporate`, `investor`.
- Cada uno con `models.py`, `service.py`, `router.py`.
- Helper común `profiles/completeness.py` con la tabla declarativa de weights.

#### `kyc/` (nuevo módulo)

- `adapter.py`: interface `KycAdapter`, implementación `KycAdapterMock`, factory por env.
- `service.py`: `initiate`, `handle_webhook`, `get_status`.
- `router.py`: endpoints §12.8.

### 15.3 Compatibilidad regresiva

**Promesa**: ningún endpoint existente cambia su URL ni su contract en Sprint 1.

- `/api/auth/me` sigue retornando `UserPublic` + `memberships`. Solo se **añaden** campos. (Frontend que ignore campos nuevos sigue funcionando.)
- `/api/organizations/{id}` añade campos a `OrgPublic`. Compatible.
- `/api/organizations/{id}/invitations` mantiene flow; sólo se añade validación `invited_by.role ∈ {owner, admin}`. (Si el frontend actual invita siempre desde owner/admin, no se rompe.)

**Migración Mongo**:
- Script `migrations/2026_06_25_identity_v1.py` que:
  - Añade campos default a documentos existentes.
  - Crea índices nuevos.
  - Crea team `is_default` por cada org existente.
  - Migra `users.role` → `users.role_global` (rename con alias deprecated).

### 15.4 Tests existentes

| Test | Acción |
|---|---|
| `test_auth.py` (existente, PASS) | **Extender** con tests de claims canónicos, refresh tokens, idle timeout. |
| `test_users.py` (existente, PASS) | **Extender** con verificación phone, soft delete, fields canónicos. |
| `test_organizations.py` (existente, PASS) | **Extender** con transfer ownership, archive, role restrictions. |
| `test_teams.py` | **Nuevo**. |
| `test_profiles_*.py` (4 archivos) | **Nuevos**. |
| `test_kyc.py` | **Nuevo**. |
| `test_invitations.py` | **Nuevo** (separado de organizations). |
| `test_sessions.py` | **Nuevo**. |
| `test_isolation.py` | **Nuevo** — matriz de aislamiento cross-org. |

---

## 16. Integración forward con AUTHORIZATION_SPEC

> Lista de **outputs** que Identity expone a Authorization. Identity NO declara cómo Authorization los usa; esa lógica vive en `AUTHORIZATION_SPEC.md`.

### 16.1 Claims canónicos disponibles en el token

```
user_id, email, email_verified, phone_verified,
role_global, active_org_id, memberships[],
kyc_status, kyc_expires_at, risk_score,
language, arroba_team_flag, profile_kinds[],
identity_tier, fiscal_entity_id
```

**Claims forward-compatibles añadidos en v1.1.0** (declarados ya en el contrato; materialización plena en futuras versiones):

| Claim | Tipo | Default v1.1 | Significado | Forward |
|---|---|---|---|---|
| `identity_tier` | `enum {"internal", "external"}` | `"internal"` (constante en v1.1; toda identidad cubierta por `memberships` es `internal`) | Distingue identidades plenas (members de una org) de identidades externas (advisors externos, despachos, bancos, auditores, etc.) | Sprint 1.5 o 2 materializa `external` con scopes reducidos y offboarding automático (§18). |
| `fiscal_entity_id` | `str | null` | `null` (constante en v1.1; cada org tiene una sola entidad fiscal operativa) | Identifica la entidad fiscal específica del contexto (holding, filial, SPV, sucursal) | Sprint futuro introduce colección `fiscal_entities` y `organization.primary_fiscal_entity_id` (§19). |

**Implicación para AUTHORIZATION_SPEC (1.0.2)**: el contrato ABAC debe **aceptar** estos dos atributos ya en v1.0, aunque su evaluación efectiva en v1.1 sea constante. Cuando se materialicen plenamente, las policies que ya los referenciaban funcionan sin cambios estructurales.

### 16.2 Accessors cross-module (Boundary First desde Identity)

| Accessor | Retorno | Uso esperado |
|---|---|---|
| `identity.get_user(user_id) → UserPublic` | UserPublic | Authorization lo invoca al cachear claims fresh. |
| `identity.get_memberships(user_id) → list[Membership]` | list | Authorization filtra por `org_id` para evaluar policies. |
| `identity.get_org(org_id) → OrgPublic` | OrgPublic | Authorization consulta `status`, `kyc_status`. |
| `identity.has_profile(user_id, kind) → bool` | bool | Authorization en gates "advisor_only", "investor_only". |
| `identity.is_member(user_id, org_id) → bool` | bool | Para checks de aislamiento. |
| `identity.member_role(user_id, org_id) → Role | None` | Role | Authorization mapea a permissions. |
| `identity.has_team(user_id, team_id) → bool` | bool | Para policies team-scoped. |

### 16.3 Eventos críticos que invalidan caché de Authorization

Authorization debe **suscribirse** y reaccionar (invalidación de caché de policies) a:
- `identity.user.role_global_changed`
- `identity.user.suspended` / `identity.user.deleted`
- `identity.user.kyc_verified` / `identity.user.kyc_failed` / `identity.user.kyc_expired`
- `identity.membership.role_changed`
- `identity.membership.team_changed`
- `identity.membership.revoked`
- `identity.team.archived`
- `identity.org.archived` / `identity.org.suspended`

### 16.4 Lo que Identity NO decide (responsabilidad de Authorization)

- ❌ Si un user con `role_global = subscriber` puede leer una operación específica.
- ❌ Si un membership con `role = operator` puede invitar (la respuesta es NO por decisión usuario, pero quien LO ENFORCE es Authorization).
- ❌ Si un user con `kyc_status = none` puede firmar una LOI (no — pero quien lo ENFORCE es Authorization que consume el claim).
- ❌ Si un team específico tiene acceso a un Data Room concreto.

### 16.5 Contract version

Identity declara una version del shape de claims: `claims.version = "1.0"`. Authorization debe codificar el shape esperado. Cambios mayores en claims bumpean este version.

---

## 17. Open Questions (OPEN-I*)

> Open items detectados durante la redacción. Clasificación G3 (pueden esperar) o G2 (requieren input antes de implementar) según `OPEN_ITEMS_CLASSIFICATION.md`.

| OPEN | Pregunta | Propuesta | Clasificación |
|---|---|---|---|
| **OPEN-I.1** | ¿`slug` de `organization` editable post-creación? | NO en v1; `slug` inmutable. Migración futura con redirect. | G3 |
| **OPEN-I.2** | ¿Política de re-uso de email tras `user.deleted`? | Email reutilizable tras hard-delete (30d post soft) o tras anonimización. | G3 |
| **OPEN-I.3** | ¿Auto-asignar `team is_default` a toda nueva membership? | SÍ; la membership nueva entra siempre en el team `All members`. Pueden quitarse luego. | G3 |
| **OPEN-I.4** | ¿`role_global` puede mutar libremente o requiere proceso (ej. promoción a `advisor`)? | Mutación libre solo por `admin`/`arroba_team`. User no se auto-promueve; debe completar profile correspondiente + revisión. | G3 |
| **OPEN-I.5** | ¿Magic link login en v1 o forward? | **Forward** a v2; no en Sprint 1. | G3 |
| **OPEN-I.6** | ¿2FA TOTP / passkeys / WebAuthn en Sprint 1? | **Forward** a Sprint 2. v1 sólo password + Google OAuth. | G3 |
| **OPEN-I.7** | ¿GDPR portability export en v1? | **Forward**; `GET /api/users/me/export` queda como REQ. | G3 |
| **OPEN-I.8** | ¿Plantillas de email gestionadas en backend (i18n por locale) o por proveedor (Resend templates)? | **En proveedor** (Resend) con vars; backend pasa `template_id` y `locale`. | G3 |
| **OPEN-I.9** | ¿`vies_validate` automático al crear org con VAT ID o explícito vía endpoint? | **Explícito** vía endpoint; UX puede invocarlo automáticamente desde el flow. | G3 |
| **OPEN-I.10** | ¿`identity.org.kyc_*` (KYC org-level) usa el mismo adapter que user-level? | **Sí**, mismo `KycAdapter` con `subject_type` parameter. Permite contratos distintos por provider real futuro. | G3 |
| **OPEN-I.11** | ¿`active_org_id` en sesión persiste cross-device o por-device? | **Por-device** (vive en `sessions`, no en `users`). El user puede tener una org activa en mobile y otra en desktop. | G3 |
| **OPEN-I.12** | ¿`team.is_default` se crea automáticamente al crear org o requiere acción? | **Automáticamente** al crear org. Nombre `"All members"`, slug `"all-members"`. | G3 |
| **OPEN-I.13** | ¿Política de `corporate_profile.org_id` cuando el user trabaja en una org no registrada en arroba? | Permitir `org_id = null` con campo `current_company_name` libre. Cuando esa empresa se registre, ofrecer migración opcional. | G3 |
| **OPEN-I.14** | ¿`profile_kinds[]` derivado en tiempo real (cada request) o cached en `users`? | **Cached** en `users.profile_kinds[]`; actualizado vía evento `identity.profile.created/deleted`. | G3 |
| **OPEN-I.15** | ¿`risk_score` lo expone el JWT o solo `/me`? | **Solo `/me`** (no en JWT) por privacidad y para evitar inflar token. Authorization lo consulta vía `identity.get_user`. | G3 |
| **OPEN-I.16** | ¿Notificación de "login desde dispositivo nuevo" en v1? | **Forward**; v1 sólo audita, no notifica. | G3 |
| **OPEN-I.17** | ¿`identity_audit_log` accesible al user mismo o solo a `admin`/`arroba_team`? | **Solo `admin`/`arroba_team`** en v1. El user puede ver SUS sessions (§12.1) pero no el audit completo. | G3 |
| **OPEN-I.18** | ¿`organization.org_type = platform_internal` reservado solo para `arroba_team` org? | **Sí**. Sólo `arroba_team` users pueden crear orgs de este tipo. Validación canónica. | G3 |
| **OPEN-I.19** | ¿Multi-email por user en futuro? | Forward (no v1). | G3 |
| **OPEN-I.20** | ¿Política de `display_name` no único entre users? | **No único**. Dos users pueden llamarse "Lucía Pérez". Diferenciación visual usa `email` o `user_id` parcial. | G3 |

---

## 18. Forward-compatibility: identidades externas

> **Estado en v1.0 / v1.1**: el modelo actual cubre las identidades externas mediante mecanismos canónicos ya presentes, sin necesidad de colecciones nuevas en este Sprint.

### 18.1 Mecanismos disponibles en v1.1

| Mecanismo | Caso de uso típico | Cobertura |
|---|---|---|
| `organization.org_type = "advisor"` | Despachos M&A boutique que actúan como entidades plenas (firma propia, equipo propio, mandatos propios) | Cubierto |
| `organization.org_type = "investor"` | Family offices, VC, PE con identidad plena | Cubierto |
| `membership.role = "guest"` | Persona externa con acceso limitado a una org (ej. abogado externo invitado a UN deal) | Cubierto |
| `invitation` | Path de incorporación | Cubierto |

### 18.2 Forward-extension declarada (NO implementar en Sprint 1)

Cuando el caso requiera distinguir **identidades externas** sin necesidad de promoverlas a una `org` propia ni a una `membership` plena:

**Opción A — Atributo en `membership`**:
- Añadir campo `membership.external_relationship_type` opcional.
- Enum candidato: `advisor_external`, `legal_counsel`, `auditor`, `bank_counterparty`, `notary`, `regulator_observer`, `tax_consultant`.

**Opción B — Colección dedicada `external_relationships`** (más limpia para muchos casos):
- `external_relationships`: `id`, `org_id`, `user_id`, `relationship_type`, `scope_operations[]`, `scope_capabilities[]`, `granted_by`, `expires_at`.
- Permite que la identidad externa exista **sin** ocupar slot de `membership` (que está conceptualmente para members plenos de la org).

La decisión entre A y B se toma cuando llegue el sprint de implementación.

### 18.3 Política canónica forward para externas

- **Scopes reducidos por defecto**: solo lectura sobre los contextos específicos para los que fueron invitadas (ej. solo el Data Room de la operación X).
- **Offboarding automático**: al cerrar (`integration` phase) o cancelar la operación que motivó el acceso, el `external_relationship` expira automáticamente.
- **Trazabilidad obligatoria**: toda invitación a identidad externa requiere `granted_by` con `role ∈ {owner, admin}` y queda en `identity_audit_log`.
- **`identity_tier = "external"`**: las identidades externas viajarán con este claim, permitiendo que Authorization aplique policies más restrictivas (ej. nunca pueden ver agregados cross-operation).

### 18.4 Contrato ABAC forward

`AUTHORIZATION_SPEC.md` (1.0.2) debe aceptar `identity_tier` como atributo ABAC contextual. En v1.1 toda identity tiene `identity_tier = "internal"` (constante). Cuando se materialicen las identidades externas, las policies ya las distinguirán.

### 18.5 Garantía de no-rotura

Ningún campo del modelo Identity v1.1 quedará obsoleto al introducir el mecanismo definitivo. Tanto la opción A como la B son **aditivas**: añaden columnas o tablas, no modifican las existentes.

---

## 19. Forward-compatibility: identidad jurídica/fiscal vs operacional

> **Estado en v1.0 / v1.1**: cada `organization` mantiene un único `tax_id` + `country` que representan la **entidad fiscal operativa principal**. Suficiente para el Sprint 1.

### 19.1 Problema canónico

En M&A real, una empresa cliente puede tener estructura compleja:
- **Holding** con varias **filiales** (cada una entidad fiscal distinta).
- **SPV** (Special Purpose Vehicle) creada específicamente para una operación.
- **Sucursales/branches** en jurisdicciones fiscales diferentes.
- **Joint Ventures** con identidad jurídica propia.

La `organization` operativa (la que opera en la plataforma, contrata el plan, recibe facturas) puede coincidir o no con la entidad jurídica que firma un SPA.

### 19.2 Forward-extension declarada (NO implementar en Sprint 1)

Colección candidata `fiscal_entities`:

| Campo | Tipo | Propósito |
|---|---|---|
| `fiscal_entity_id` | `str` (`fent_`) | identidad canónica |
| `organization_id` | FK | org operativa que gestiona esta entidad |
| `legal_form` | enum | `sl`, `sa`, `slu`, `sicav`, `spv`, `branch`, `partnership`, etc. |
| `country` | `str` (ISO-2) | jurisdicción fiscal |
| `tax_id` | `str` | CIF/NIF/EIN/otros según país |
| `vat_id` | `str?` | EU VAT si aplica |
| `vies_validated` | `bool` | validación VAT contra VIES |
| `parent_fiscal_entity_id` | FK self? | holding-filial relationship |
| `governance_authority_user_id` | FK user | quién tiene autoridad de gobierno sobre esta entidad |
| `purpose` | enum | `operational`, `holding`, `spv_per_deal`, `branch`, etc. |
| `created_at`, `archived_at`, ... | — | ciclo de vida estándar |

**Path de migración**:
- En v1.1, los campos `organization.tax_id`/`country`/`vat_id` se preservan.
- Al introducir `fiscal_entities`, se crea automáticamente UNA entrada con `purpose = "operational"` por org, copiando esos campos.
- `organization.primary_fiscal_entity_id` (FK) apunta a ella.
- Las nuevas entidades fiscales se añaden como filas adicionales sin tocar la fila operativa.

### 19.3 Casos de uso forward

| Caso | Modelo |
|---|---|
| Empresa holding ESP + filial UK | `organization` ESP con `primary_fiscal_entity_id` apuntando a entidad ESP; entidad UK como `fiscal_entity` con `parent_fiscal_entity_id` |
| SPV creado por operación | `fiscal_entity` con `purpose = "spv_per_deal"`, vinculado a la `operation` que lo originó |
| Sucursal franquiciada | `fiscal_entity` con `purpose = "branch"`, `country` distinto |
| Joint Venture | `fiscal_entity` con `purpose = "operational"` y eventualmente una `organization` propia si las dos partes deciden gestionarla en la plataforma |

### 19.4 Contrato ABAC forward

`AUTHORIZATION_SPEC.md` debe aceptar `fiscal_entity_id` como atributo ABAC contextual opcional. En v1.1, este claim es `null` para toda identidad (porque solo existe una entidad fiscal implícita). Cuando se materialice, las policies que ya lo referenciaban funcionan sin cambios.

### 19.5 Implicaciones forward para Billing

(Forward declarado; este spec NO desarrolla)

- Una sola `organization` puede facturar a múltiples `fiscal_entities`: el Stripe customer y la dirección legal varían por entidad fiscal.
- IVA y reverse charge se calculan por `fiscal_entity`, no por `organization`.
- Cada `economic_event` del Transaction OS lleva opcionalmente `fiscal_entity_id` para asignarlo correctamente.

### 19.6 Garantía de no-rotura

`organization.tax_id` v1.1 sigue siendo válido. Cuando se introduzca `fiscal_entities`, el campo NO se elimina; queda como **shortcut** del campo equivalente en la primary fiscal entity (mantenido en sincronía vía evento `identity.fiscal_entity.updated`).

---

## Cierre del spec

Este documento es **fuente de verdad** sobre la plataforma de Identity de arroba.com. Cualquier desviación en código requiere bump de versión + propagación a `CHANGELOG.md`.

**Versión actual**: `v1.1.0`.
**Estado**: ✅ Cerrado con patch forward-compatibility aplicado (Patches I.1-I.4). Pendiente aprobación del usuario antes de implementar.
**Próxima fase**: 1.0.2 — `AUTHORIZATION_SPEC.md` (en redacción tras este patch).

> **Fuentes canónicas referenciadas**:
> - `/app/memory/ARROBA_PHILOSOPHY.md` (capa 1)
> - `/app/memory/ENTITY_MODEL.md` (capa 3 — declara `user`, `organization`, `match`)
> - `/app/memory/ENTITY_FRAMEWORK.md` (capa 3 — arquitectura UX)
> - `/app/memory/specs/MEMORY_ENGINE_SPEC.md` (Risk & Compliance forward dependency)
> - `/app/memory/SPRINT1_ARCHITECTURE_PROPOSAL.md` (input arquitectónico de la fase 1.A)
> - `/app/memory/specs/CANON_AUDIT_REPORT.md` + `OPEN_ITEMS_CLASSIFICATION.md` (resoluciones G2 que aplican: A8, B2, C11, D10, D14, E16)
