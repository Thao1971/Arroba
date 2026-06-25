# arroba.com — Sprint 1 Architecture Proposal v1.0

> **Fase 1.A — Propuesta arquitectónica del Identity Platform Sprint.**
> Documento puramente arquitectónico, paso previo a `IDENTITY_SPEC.md` y `AUTHORIZATION_SPEC.md`.
> Fecha: 2026-06-25.
> Autor: agente E1 sobre Canonical Baseline v1.0.
>
> **Restricciones de esta fase**:
> - 🚫 Cero código modificado.
> - 🚫 No se crean los specs canónicos todavía (`IDENTITY_SPEC.md`, `AUTHORIZATION_SPEC.md`, `SUBSCRIPTION_SPEC.md`, `BILLING_SPEC.md`).
> - 🚫 No se modifica el canon ni los specs de la baseline.
> - ✅ Solo este documento.
> - ✅ Datos del código actual extraídos del inventario real.

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Mapa de la plataforma transversal](#2-mapa-de-la-plataforma-transversal)
3. [Inventario de reutilización](#3-inventario-de-reutilización)
4. [Decisiones arquitectónicas mayores](#4-decisiones-arquitectónicas-mayores)
5. [Modelo de datos propuesto](#5-modelo-de-datos-propuesto)
6. [Contratos API propuestos](#6-contratos-api-propuestos)
7. [Integraciones externas necesarias](#7-integraciones-externas-necesarias)
8. [Plan de implementación por fase](#8-plan-de-implementación-por-fase)
9. [Tests strategy](#9-tests-strategy)
10. [Estimación de esfuerzo](#10-estimación-de-esfuerzo)
11. [Riesgos identificados y mitigaciones](#11-riesgos-identificados-y-mitigaciones)
12. [Hitos y checkpoints sugeridos](#12-hitos-y-checkpoints-sugeridos)
13. [Decisiones canónicas del Sprint 0 que aplican](#13-decisiones-canónicas-del-sprint-0-que-aplican)
14. [Lagunas que requieren decisión humana antes de IDENTITY_SPEC](#14-lagunas-que-requieren-decisión-humana-antes-de-identity_spec)

---

## 1. Resumen ejecutivo

### 1.1 Visión

arroba.com tiene una base de auth funcional (email/password + Emergent Google OAuth + sesiones) y un modelo embrionario de orgs + memberships + invitaciones. Pero no tiene **plataforma**: no hay un modelo de identidad que admita perfiles tipados (Advisor / Corporate / Investor) ni un modelo de autorización declarativo que el resto del producto pueda consumir sin acoplarse.

**Sprint 1 — Identity Platform Sprint** construye esa **plataforma transversal**: identidad rica + autorización declarativa + suscripciones configurables + billing real. Su valor no es funcional sino arquitectónico: cualquier capacidad futura (Marketplace, Transaction OS, Data Room, Matching, Advisor Layer) podrá consumirla sin volver a modificarla.

La capa **debe ser estable**. Si Sprint 1 sale frágil, todo el resto del producto se construirá apoyado sobre un cimiento que tendrá que refactorizarse, y ese refactor será costoso (toca permisos en todas partes, contratos de billing, etc.). Esto justifica la disciplina del approach del usuario: construir Identity primero, no parchear Stripe primero.

### 1.2 Orden de implementación

```
Identity ──► Authorization ──► Subscription ──► Billing
   1.1            1.2              1.3            1.4
```

Cada capa **consume** la inferior; ninguna depende de la superior. Implementación en orden 1.1 → 1.2 → 1.3 → 1.4. Lectura de dependencias en orden inverso (Billing depende de todo lo anterior).

### 1.3 Estimación total (rango honesto)

**Anclado a referencias internas del proyecto**:
- Sprint 0 + 0.5 (puro documento, 6 specs + audit + propagación + pack): ~**12-15 CW** (Credit-Weight units).
- E1.5.6 (canonización 3ª capa + 11 componentes nuevos + refactor + tests + docs): ~**6-8 CW**.
- E1.5 Workspaces persistentes (3 colecciones + 6 endpoints + intent router espejo + frontend completo + multi-org + tests): ~**8-10 CW**.

**Estimación Sprint 1 (rango low–high)**:

| Fase | Low | High | Notas |
|---|---:|---:|---|
| 1.0 Specs (`IDENTITY_SPEC` + `AUTHORIZATION_SPEC` + `SUBSCRIPTION_SPEC` + `BILLING_SPEC`) | 4 | 6 | Documental denso |
| 1.1 Identity (backend + frontend + tests) | 8 | 14 | Extensión amplia del módulo `users` + perfiles tipados + verificación |
| 1.2 Authorization (motor declarativo + policies + audit) | 9 | 16 | Núcleo crítico; coste alto por diseño + tests de matriz |
| 1.3 Subscription (planes + cuotas + créditos + entitlements) | 7 | 12 | Ledger de consumo + reset + multi-bucket |
| 1.4 Billing (Stripe real + facturación + reconciliación) | 8 | 14 | Stripe Metered + webhook + idempotencia |
| Cross-cutting (CI, observabilidad, doc, regresión) | 3 | 5 | Distribuido entre fases |
| **Total Sprint 1** | **39** | **67** | ~3× Sprint 0+0.5 en el bajo; ~5× en el alto |

**Recomendación**: planificar con **~50 CW** (mediana). Marcar fases 1.2 y 1.4 como los principales focos de riesgo. Reservar 10% de buffer para tests de seguridad de la matriz de autorización.

### 1.4 Por qué arroba.com lo necesita ahora

1. **Antes** de implementar Matching real, debe existir un modelo de quién puede ver qué Match (autorización).
2. **Antes** de implementar Data Room, debe existir gating por entitlements (suscripción + KYC + permisos).
3. **Antes** de cobrar fees del Transaction OS, debe existir un billing reconciliable.
4. **Antes** de permitir Advisors con sus propios mandatos, debe existir perfil profesional + ownership.

La plataforma habilita el resto. No es opcional.

---

## 2. Mapa de la plataforma transversal

### 2.1 Diagrama de capas

```
   ┌─────────────────────────────────────────────────────────────────┐
   │  CAPA DE PRODUCTO (no se toca en Sprint 1)                      │
   │  Transaction OS · Marketplace · Data Room · Matching · Memory · │
   │  Copilots · Agentic Layer · UX Surface                          │
   └─────────────────────────────────────────────────────────────────┘
                            ▲           ▲           ▲
                            │ entitle-  │ check_    │ resolve_
                            │ ments     │ permission│ entity
                            │           │           │
   ┌────────────────────────┴───────────┴───────────┴───────────────┐
   │  PLATAFORMA TRANSVERSAL — Sprint 1                              │
   │                                                                  │
   │  ┌────────────────────────────────────────────────────────────┐ │
   │  │ 1.4 BILLING                                                │ │
   │  │     Stripe · Facturación · Eventos económicos              │ │
   │  └─────────────────────┬──────────────────────────────────────┘ │
   │                        │ consume                                 │
   │  ┌─────────────────────▼──────────────────────────────────────┐ │
   │  │ 1.3 SUBSCRIPTION                                           │ │
   │  │     Planes · Créditos · Cuotas · Entitlements · Overage    │ │
   │  └─────────────────────┬──────────────────────────────────────┘ │
   │                        │ consume                                 │
   │  ┌─────────────────────▼──────────────────────────────────────┐ │
   │  │ 1.2 AUTHORIZATION                                          │ │
   │  │     RBAC · Policies · Permissions · Feature Flags          │ │
   │  │     Audit log · Decisión policy engine                     │ │
   │  └─────────────────────┬──────────────────────────────────────┘ │
   │                        │ consume                                 │
   │  ┌─────────────────────▼──────────────────────────────────────┐ │
   │  │ 1.1 IDENTITY                                               │ │
   │  │     User · Org · Team · Membership · Profiles · KYC        │ │
   │  └────────────────────────────────────────────────────────────┘ │
   │                                                                  │
   └─────────────────────────────────────────────────────────────────┘
```

### 2.2 Contratos hacia arriba (qué exporta cada capa)

| Capa | Contrato canónico (qué exponen los servicios cross-module) |
|---|---|
| 1.1 Identity | `get_identity(user_id, org_id?) → IdentityClaims`. `IdentityClaims` incluye: `user_id`, `role` (canónico Sprint 0), `active_org_id`, `memberships[]`, `profile_kinds[]`, `kyc_status`, `verification_state`. |
| 1.2 Authorization | `check_permission(claims, action, resource) → Decision`. `resolve_entitlements(claims) → Entitlements`. `evaluate_feature_flag(flag_id, claims) → bool`. |
| 1.3 Subscription | `get_plan(org_id) → Plan`. `get_quota_usage(user_id, bucket) → Usage`. `consume_credit(user_id, bucket, amount) → Result`. `is_product_enabled(plan, product) → bool`. |
| 1.4 Billing | `create_checkout(plan_id, customer) → CheckoutSession`. `record_economic_event(event) → InvoiceItem`. `get_invoice_history(customer) → Invoice[]`. |

### 2.3 Cómo la capa de producto consume sin acoplarse

**Patrón canónico**: el código de producto NUNCA importa colecciones de la plataforma directamente. Importa **servicios** que devuelven **claims** o **decisions**.

Ejemplo conceptual (NO es código a escribir todavía):

```
# ❌ Acoplamiento prohibido
db.user_memberships.find(...)           # NO

# ✅ Acoplamiento desacoplado
identity.get_identity(user_id, org_id)    # SÍ
authorization.check_permission(claims, "operation:read", op_id)   # SÍ
subscription.is_product_enabled(plan, "matching")   # SÍ
```

Esto significa:
- El motor de Matching (Sprint 5+) puede preguntar "¿puede este user ver este match?" sin saber qué es un plan ni cómo funcionan los entitlements.
- El Data Room (futuro) puede preguntar "¿es este documento accesible?" sin tocar Mongo de organizations.
- El Copilot puede preguntar "¿este feature está habilitado en este turno?" sin importar de qué plan se trate.

### 2.4 Cascada de evaluación canónica

Cuando una capacidad de producto se invoca, el orden de evaluación es:

```
1. Identity:       ¿quién es el actor? (claims)
2. Authorization:  ¿puede hacer esta acción sobre este recurso?
3. Subscription:   ¿su plan habilita este producto?
4. Subscription:   ¿tiene cuota / créditos para esto?
5. (acción)
6. Billing:        registra evento económico si aplica
```

Si cualquier paso 1-4 deniega, la acción NO se ejecuta. Cada denegación se audita.

---

## 3. Inventario de reutilización

> **Fuente**: extracción directa de `/app/backend/src/modules/`, `/app/frontend/src/`, `/app/backend/tests/`. Conteos al 2026-06-25.

### 3.1 Estado actual del backend (sumario)

| Módulo | Líneas totales | Estado | Función actual |
|---|---:|---|---|
| `auth/` (models, service, router, cookies, dependencies) | 402 | ✅ Productivo | Email/password + Emergent Google OAuth + sessions |
| `users/` (models, service, router) | 48 | 🟡 Mínimo | Solo `GET /me` + `PATCH /me` (full_name) |
| `organizations/` (models, service, router) | 352 | ✅ Productivo | Orgs, memberships, invitations CRUD básico |
| `billing/` (router) | 21 | 🟡 Stub | Solo `GET /billing/health` verificando SDK Stripe |
| `shared/types.py` (enums) | ~40 | ✅ Productivo | `Role` (6), `OrgRole`, `OrgStatus`, `MembershipStatus`, `InvitationStatus` |
| Tests existentes (pytest) | 20 archivos | ✅ Productivos | Incluye `test_auth.py`, `test_users.py`, `test_organizations.py`, `test_real_mongo.py` |

### 3.2 Estado actual del frontend (sumario relevante)

| Módulo | Estado | Función actual |
|---|---|---|
| `components/auth/` (AuthField, AuthShell, BrandPanel, Divider, GoogleButton) | ✅ Productivo | Componentes UI de login/registro |
| `lib/api/client.ts` | ✅ Productivo | Cliente API tipado base |
| `lib/api/companies-client.ts` | ✅ Productivo | Cliente API para companies |
| OrgSwitcher (header autenticado) | ✅ Productivo | Multi-org switching |

### 3.3 Reutilización por fase (con datos reales)

#### Fase 1.1 — Identity

| Bloque | Reutilizable (líneas existentes) | Adaptable (líneas a tocar) | Nuevo (líneas estimadas) | % esfuerzo |
|---|---:|---:|---:|---:|
| Auth (email/password + OAuth) | 402 reutilizables tal cual | ~50 (añadir hooks de KYC / verification state) | 0 | 5% |
| User base model | 48 (todo el módulo `users/`) | ~80 (campos profile_kinds, preferences, locale, verification, kyc) | ~150 (perfiles tipados + endpoints) | 25% |
| Organizations + Memberships + Invitations | 352 reutilizables | ~60 (añadir `team_id`, ownership distinto a `created_by`, soft-delete) | ~200 (entidad `team`, transferencia de ownership, KYC corporate) | 30% |
| Perfiles Advisor / Corporate / Investor | 0 | 0 | ~600-900 (3 modelos + servicios + endpoints + tests) | 35% |
| KYC integration (si se decide externa) | 0 | 0 | ~150-300 (adapter Boundary First + estados + webhook) | 5% |
| **Subtotal 1.1 backend** | ~800 | ~190 | ~1.100-1.500 | — |
| Frontend 1.1 (pages de perfil + onboarding profile_kind) | 0 | ~150 (extender Auth flows) | ~500-800 | — |

#### Fase 1.2 — Authorization

| Bloque | Reutilizable | Adaptable | Nuevo (líneas estimadas) | % esfuerzo |
|---|---:|---:|---:|---:|
| Role enum (6 valores) | ~10 | ~5 (añadir `arroba_team`, decisión G2) | 0 | 5% |
| `get_current_user` dependency | reutilizable | ~20 (extender a `get_current_claims`) | 0 | 5% |
| RBAC base (matriz rol × acción) | 0 | 0 | ~300-500 | 25% |
| Policy engine + evaluator | 0 | 0 | ~400-700 (mapper YAML/Mongo → in-memory rules + caché) | 30% |
| Feature flags | 0 | 0 | ~150-250 (servicio + cache + endpoints admin) | 10% |
| Resource ACL (per-entity access) | 0 | 0 | ~300-500 (modelo + service + caché) | 20% |
| Audit log de decisiones | 0 | 0 | ~150-250 (colección + service) | 5% |
| **Subtotal 1.2 backend** | ~15 | ~25 | ~1.300-2.200 | — |
| Frontend 1.2 (admin panel de policies, feature flag UI) | 0 | 0 | ~300-500 | — |

#### Fase 1.3 — Subscription

| Bloque | Reutilizable | Adaptable | Nuevo (líneas estimadas) | % esfuerzo |
|---|---:|---:|---:|---:|
| Plan model | 0 | 0 | ~200-300 (entidad + repo Mongo configurable) | 15% |
| Entitlements (productos habilitados) | 0 | 0 | ~150-250 | 10% |
| Quota ledger (consumo + reset) | 0 | 0 | ~400-700 (ledger event-sourced + agregaciones) | 30% |
| Credit buckets (multi-bucket) | 0 | 0 | ~300-500 | 20% |
| Overage policy | 0 | 0 | ~150-200 | 10% |
| Soft/hard gates (KYC, risk, plan) | 0 | 0 | ~150-250 (compositor de gates) | 15% |
| **Subtotal 1.3 backend** | 0 | 0 | ~1.350-2.200 | — |
| Frontend 1.3 (planes, créditos, upgrade UX) | 0 | ~100 (extender LockedSectionBlur con plan upgrade CTA) | ~400-600 | — |

#### Fase 1.4 — Billing

| Bloque | Reutilizable | Adaptable | Nuevo (líneas estimadas) | % esfuerzo |
|---|---:|---:|---:|---:|
| Stripe SDK install + key | reutilizable (instalado) | 0 | 0 | 0% |
| `billing/health` stub | 21 (se mantiene como diagnóstico) | 0 | 0 | 0% |
| Stripe customer mapping | 0 | 0 | ~150-250 | 10% |
| Subscription lifecycle (create / upgrade / cancel) | 0 | 0 | ~300-500 | 20% |
| Metered billing (créditos como meter) | 0 | 0 | ~250-400 | 15% |
| Webhooks (idempotencia + reconciliación) | 0 | 0 | ~300-500 | 20% |
| Invoice + facturación electrónica España | 0 | 0 | ~400-700 (Verifactu/SII opt) | 25% |
| Eventos económicos del Transaction OS | 0 | 0 | ~150-250 (adapter, NO toca OS) | 10% |
| **Subtotal 1.4 backend** | 21 | 0 | ~1.550-2.600 | — |
| Frontend 1.4 (billing portal, historial, facturas) | 0 | 0 | ~500-800 | — |

### 3.4 Lectura honesta del inventario

**Lo que YA tenemos sólido**: Auth (Emergent Google + email/password), Organizations + Memberships + Invitations. Esto es ~800 líneas de backend útiles que no toca Sprint 1 (excepto extensiones puntuales).

**Lo que YA tenemos como semilla**: `users/` (48 líneas) y `billing/` (21 líneas) son **stubs reales**, no productivos. Hay que construir prácticamente todo encima.

**Lo que es genuinamente nuevo**: Perfiles tipados, todo el Authorization platform, todo el Subscription engine, todo el Billing real. **~75% del esfuerzo del Sprint 1 es código nuevo**, no extensión.

**Costo real estimado de backend nuevo** (suma de "Nuevo" en las 4 fases): ~**5.300-8.500 líneas** de código backend en Sprint 1, más ~**1.700-2.700 líneas** de frontend, más ~**2.000-3.500 líneas** de tests. Total: **9.000-14.700 líneas** producidas en Sprint 1.

Esta cifra debe usarse como sanity check al cierre de cada fase.

---

## 4. Decisiones arquitectónicas mayores

> Cada decisión presenta: **pregunta + 2-3 opciones + recomendación con justificación**. Estas decisiones son **input necesario** para escribir `IDENTITY_SPEC.md` y `AUTHORIZATION_SPEC.md` (entregables de las fases 1.0 posteriores a la aprobación de esta propuesta).

### 4.1 Identity

#### D-I.1 — Relación user ↔ organization

**Pregunta**: ¿`user.organization_id` 1:N (un usuario pertenece a una organización principal) o N:M con `memberships` (un usuario puede pertenecer a múltiples orgs simultáneamente)?

**Opciones**:
- (a) 1:N: simplicidad máxima; cada user tiene UNA `organization_id`.
- (b) N:M vía `memberships`: cada user puede pertenecer a varias orgs simultáneamente, con un `active_org_id` en sesión (modelo actual de E1.5).
- (c) Híbrido: `primary_org_id` + `memberships[]` adicionales.

**Recomendación**: **(b)** — ya está implementado parcialmente (orgs + memberships + invitations + OrgSwitcher + `X-Active-Org` header). Es el modelo más alineado con M&A real (un Advisor puede asesorar a varios clientes, un investor puede invertir desde varias entidades, un usuario de arroba_team es member de la org interna).

**Justificación**: la opción (a) es más simple pero contradice E1.5 y bloquea Advisor multi-cliente. La opción (c) introduce ambigüedad sin valor claro.

#### D-I.2 — Team como entidad o como atributo

**Pregunta**: ¿`team` es una entidad propia o un atributo de `membership`?

**Opciones**:
- (a) Entidad `team` con `team_id`, `org_id`, `name`, `members[]`. Una org puede tener múltiples teams; cada membership pertenece opcionalmente a un team.
- (b) Atributo `team` (string libre o enum) en `membership`. Simplicidad.
- (c) Sin teams en v1; reservado para Sprint 2+.

**Recomendación**: **(a)** — entidad propia, con `team_id` referenciable desde `Authorization` policies. Justificación: Data Room (futuro) necesita asignar acceso a un team completo (ej. "el team M&A de Banco X firma este NDA"). Sin entidad `team`, esa funcionalidad obliga a renombrarlo todo en Sprint 2.

#### D-I.3 — Ownership: provenance vs governance

**Pregunta**: ¿`ownership` modela quién creó qué (provenance) o quién tiene control administrativo (governance)? ¿O ambos en dos campos distintos?

**Opciones**:
- (a) Un solo campo `owner_id` ambiguo.
- (b) Dos campos: `created_by` (provenance, inmutable) + `owner_id` (governance, transferible).
- (c) Tres: `created_by` + `owner_id` + `delegated_admins[]`.

**Recomendación**: **(b)** — alineado con el modelo `_INVENTORY_2026.md` y con `OrgInDB.created_by` ya implementado. `created_by` es inmutable y sirve para auditoría; `owner_id` es transferible y dispara permisos administrativos. La opción (c) se puede añadir en Sprint 2 sin romper contrato.

**Aplicabilidad**: la pareja `created_by` + `owner_id` debe canonizarse en TODAS las entidades del producto que tengan ciclo de vida (Operation, Mandate, Match, Valuation, Document, Opportunity).

#### D-I.4 — Perfiles tipados: sub-doc o entidades separadas

**Pregunta**: ¿Perfiles `professional`, `advisor`, `corporate`, `investor` son sub-documentos de `user` o entidades separadas con FK?

**Opciones**:
- (a) Sub-documentos opcionales en `user`: `user.profiles = {professional: {...}, advisor: {...}, ...}`.
- (b) Entidades separadas con FK: colección `profiles_advisor`, `profiles_corporate`, etc.
- (c) Una única colección `user_profiles` polimórfica con discriminador `kind`.

**Recomendación**: **(b)** — entidades separadas. Justificación:
- Cada perfil tiene su propio ciclo de vida, KYC state, verificación, completitud (un Advisor puede tener perfil avanzado mientras su perfil Corporate está vacío).
- Permite indexación dedicada (ej. buscar advisors por sector).
- Permite extender el modelo sin reescribir `user`.
- Authorization puede preguntar `has_profile('advisor')` sin cargar todo el user.

#### D-I.5 — KYC: integración externa en este sprint o solo modelado

**Pregunta**: ¿Integrar con un proveedor externo (Onfido / Veriff / Sumsub / Stripe Identity) en Sprint 1 o solo modelar los estados?

**Opciones**:
- (a) Solo modelar estados (`unverified | pending | approved | rejected | expired`) con webhooks abstractos; integración real en Sprint 3+.
- (b) Integración real con UN proveedor (Stripe Identity por afinidad con Billing).
- (c) Adapter Boundary First con MOCK + REAL switcheable (igual que `EnrichCompanyAdapter`).

**Recomendación**: **(c)** — adapter Boundary First. Mock en v1 + REAL diferido a Sprint 1.5 si el usuario lo aprueba o Sprint 3 si no. Justificación: el modelo de estados y el contrato del adapter quedan canónicos, y la implementación real se hace cuando haya datos reales para verificar. Esto es coherente con el patrón ya validado en `EnrichCompanyAdapter`.

#### D-I.6 — Tipos de verificación en v1

**Pregunta**: ¿Cuáles verificaciones se implementan en v1?

**Opciones**:
- (a) Solo email.
- (b) Email + teléfono.
- (c) Email + teléfono + documento (vía KYC).
- (d) Email + teléfono + documento + corporate domain (verifica que el correo `@empresa.com` corresponde a una empresa con CIF real).

**Recomendación**: **(b)** en v1 hard + **(c)** como contract listo (adapter mock) + **(d)** diferido a Sprint 2. Justificación: email + teléfono cubre la mayoría de fricciones de onboarding; documento queda contractualmente preparado para activarse cuando el usuario apruebe coste de KYC; corporate domain es valor agregado de Sprint 2.

### 4.2 Authorization

#### D-A.1 — RBAC puro vs RBAC + ABAC

**Pregunta**: ¿Solo RBAC (rol → permisos) o RBAC + ABAC (atributos contextuales: hora del día, IP, plan, KYC status, riesgo)?

**Opciones**:
- (a) RBAC puro.
- (b) RBAC + ABAC con atributos limitados (plan, KYC, risk_score).
- (c) RBAC + ABAC completo (cualquier atributo del contexto).

**Recomendación**: **(b)** — el spec `MEMORY_ENGINE_SPEC.md` y `MONETIZATION_SPEC.md` exigen que las decisiones consideren Plan + Permisos + Riesgo (decisión canónica Sprint 0). RBAC puro no basta. ABAC completo es over-engineering hoy.

**Justificación**: la decisión canónica del Sprint 0 dice literalmente "Plan + Permisos + Riesgo determinan acceso a productos sensibles" (resolución OPEN-C3). Esto exige ABAC limitado.

#### D-A.2 — Policy engine externo vs propio

**Pregunta**: ¿OPA (Open Policy Agent) / Cerbos / Casbin / motor propio embebido en Python?

**Opciones**:
- (a) Motor propio embebido (~400-700 líneas).
- (b) OPA como sidecar (decisión vía HTTP).
- (c) Cerbos embebido.
- (d) Casbin embebido (Python-native).

**Recomendación**: **(a)** motor propio embebido para v1, con interfaz tan parecida a OPA como sea razonable. Justificación:
- Latencia: cada check_permission debe responder en <2 ms; sidecar añade overhead que no necesitamos.
- Control: las policies son nuestras y cambian a la velocidad del producto; no necesitamos un ecosistema externo.
- Migración futura: si crece la complejidad y queremos OPA en Sprint 5+, la interfaz `check_permission(claims, action, resource) → Decision` es la misma; podemos cambiar el motor sin tocar el código del producto.

**Riesgo**: motor propio puede tener bugs sutiles. Mitigación: matriz exhaustiva de tests (rol × acción × recurso × plan × kyc_status) en el Sprint.

#### D-A.3 — Formato de policies

**Pregunta**: ¿Policies declaradas en YAML / JSON / Python / tabla Mongo?

**Opciones**:
- (a) YAML en disco (`/app/backend/policies/*.yaml`), cargadas al arrancar.
- (b) JSON en Mongo (colección `auth_policies`).
- (c) Python (DSL interno).
- (d) Híbrido: YAML para policies fijas + Mongo para policies dinámicas (feature flags, overrides admin).

**Recomendación**: **(d)** — YAML en disco para el cuerpo principal (versionable en git, revisable en PR) + Mongo para overrides dinámicos limitados (ej. feature flag por org, suspensión temporal). Justificación: trazabilidad + agilidad. Las policies críticas no deben modificarse sin PR.

#### D-A.4 — Feature flags

**Pregunta**: ¿Propios o externos (LaunchDarkly, Unleash, Flagsmith)?

**Opciones**:
- (a) Propios (colección `feature_flags` + service + endpoints admin).
- (b) LaunchDarkly (gestionado, caro).
- (c) Unleash (open-source, self-hosted).
- (d) Flagsmith (open-source, self-hosted).

**Recomendación**: **(a)** propios. Justificación: complejidad actual no justifica externo. Mantenemos los flags en Mongo con TTL y caché in-memory. La interfaz `evaluate_feature_flag(flag_id, claims) → bool` permite migración futura.

#### D-A.5 — Resolución de conflictos de policy

**Pregunta**: deny-overrides / permit-overrides / unanimous / first-match.

**Opciones**:
- (a) **deny-overrides**: si alguna policy deniega, denegar.
- (b) **permit-overrides**: si alguna policy permite, permitir.
- (c) **unanimous**: requiere acuerdo unánime para permitir.
- (d) **first-match**: orden de evaluación importa.

**Recomendación**: **(a) deny-overrides**. Justificación: seguridad por defecto. En M&A, sobre-permitir es catastrófico (data leak); sub-permitir es molesto pero reparable. `deny-overrides` es el estándar de OPA y el más seguro.

#### D-A.6 — Audit log de decisiones

**Pregunta**: ¿Cada decisión o solo las denegaciones?

**Opciones**:
- (a) Todas las decisiones.
- (b) Solo denegaciones.
- (c) Todas pero con sampling (1% de PERMIT, 100% de DENY).

**Recomendación**: **(c) sampling**. Justificación: el coste de almacenar 100% es alto (cada request hace múltiples checks); el valor de auditar PERMIT es bajo (caso normal). DENY 100% es esencial para detectar abuso. PERMIT 1% es suficiente para reconstruir patrones.

**Resoluciones aplicables**: OPEN-B2 del Sprint 0 (`TC puede leer audit logs cross-user`) — la respuesta canónica fue "NO por defecto; solo `arroba_team`/`admin` cuando se escala". Esto exige que el audit log exista y sea accesible para roles `arroba_team`/`admin`.

#### D-A.7 — ACL por recurso vs cálculo on-the-fly

**Pregunta**: ¿Tabla de ACL por recurso (`operation_acl`, `match_acl`, …) o cálculo on-the-fly desde policies?

**Opciones**:
- (a) ACL por recurso (precomputed): tabla denormalizada con `(resource_id, user_id, permissions[])`.
- (b) On-the-fly: cada check_permission ejecuta las policies sobre el contexto.
- (c) Híbrido: on-the-fly + caché por (claims, action, resource) con TTL.

**Recomendación**: **(c) híbrido**. Justificación: on-the-fly como verdad, caché agresiva (TTL 60s + invalidación al cambiar membership/role/plan). ACL precomputada es difícil de mantener consistente cuando cambian policies o roles.

#### D-A.8 — Caché de decisiones

**Pregunta**: TTL y estrategia de invalidación.

**Recomendación**:
- TTL: 60 segundos para PERMIT, 0 segundos para DENY (no se cachea para que correcciones de policy se apliquen instantáneamente).
- Invalidación explícita ante eventos: cambio de role, cambio de membership, cambio de plan, cambio de policy.
- Caché en memoria con eviction LRU (capacity ~10.000 entries por proceso).

### 4.3 Subscription

#### D-S.1 — Planes configurables: Mongo vs código

**Pregunta**: ¿Planes como entidades configurables en Mongo o como código?

**Opciones**:
- (a) Planes en Mongo (`plans` collection) con admin UI/API.
- (b) Planes en código (constants module).
- (c) Híbrido: planes base en código + overrides en Mongo.

**Recomendación**: **(a) Planes en Mongo**. Justificación: la directiva del usuario es explícita ("todo configurable, nada hardcodeado"). Esto implica que se pueda crear un nuevo plan sin redeploy. El admin UI puede llegar en Sprint 2; en Sprint 1 basta con seed + endpoints CRUD admin-only.

#### D-S.2 — Quotas: ledger vs contador con reset

**Pregunta**: ¿Cuotas con ledger de consumo (event-sourcing) o contador con reset periódico?

**Opciones**:
- (a) Ledger de consumo: cada consumo es un evento (`{user_id, bucket, amount, ts, reason}`); usage = agregación.
- (b) Contador con reset: `{user_id, bucket, used, reset_at}` actualizado in-place.
- (c) Híbrido: contador para lecturas rápidas + ledger para auditoría.

**Recomendación**: **(c) híbrido**. Justificación: ledger es la fuente de verdad (necesario para reconciliación con Billing, auditoría, refunds). Contador es la lectura rápida. Sin ledger no podemos justificar por qué un usuario quedó sin cuota.

#### D-S.3 — Overage: política única o por plan

**Pregunta**: ¿Política única de overage o configurable por plan?

**Recomendación**: **configurable por plan**. Cada plan declara su `overage_policy: {strict | soft | metered}`:
- `strict`: bloquea al llegar al límite.
- `soft`: permite consumir pero notifica.
- `metered`: permite consumir y factura por unidad excedida (depende de Billing).

Justificación: planes Subscriber → strict; Corporate/Investor → metered; Advisor → metered con cap.

#### D-S.4 — Créditos: monolítico vs multi-bucket

**Pregunta**: ¿Integer monolítico de créditos o multi-bucket (créditos de Valoración, créditos de Matching, etc.)?

**Opciones**:
- (a) Monolítico: un solo balance, cualquier acción consume del mismo pool.
- (b) Multi-bucket: buckets tipados (`valoracion`, `matching`, `analyze`, `signals`).
- (c) Híbrido: bucket principal + buckets restringidos para ciertas acciones.

**Recomendación**: **(b) multi-bucket**. Justificación: el `MONETIZATION_SPEC.md` (Sprint 0) ya distingue "productos" y precios por producto. Un bucket único oculta la realidad de coste. Multi-bucket permite que el usuario sepa exactamente qué le queda.

Buckets propuestos en v1: `valuation`, `matching`, `analysis`, `signal`, `recommendation`. Cada uno con `granted`, `used`, `remaining`, `expires_at`.

#### D-S.5 — Restricciones por riesgo/KYC: hard vs soft gate

**Pregunta**: ¿Hard gate (no se ejecuta) o soft gate (se ejecuta degradado)?

**Recomendación**: **hard gate** para acciones con consecuencias económicas o legales (firmar NDA, invitar contraparte, descargar dataroom). **Soft gate** para acciones de exploración (ver fichas, ejecutar `analyze` con respuesta degradada y CTA "completa KYC para análisis completo"). La política se declara por capability en el spec de cada motor.

Justificación: en M&A, fricciones razonables generan confianza. Bloquear duro lo legal/económico es esperado. Bloquear duro la exploración es hostil.

### 4.4 Billing

#### D-B.1 — Modelo Stripe

**Pregunta**: ¿Subscription + Metered Billing (créditos como meter)? ¿Subscription + Invoice items? ¿Customer Balance + Pay-as-you-go?

**Opciones**:
- (a) Subscription + Metered Billing: el plan es subscription; el consumo de créditos es meter; overage se cobra al final del ciclo.
- (b) Subscription + Invoice items: cada evento económico crea un invoice item.
- (c) Customer Balance: el usuario tiene un balance; las acciones lo consumen.

**Recomendación**: **(a) Subscription + Metered Billing**. Justificación:
- Es el patrón estándar de Stripe para SaaS B2B con consumo variable.
- Permite múltiples meters por subscription (un meter por bucket de créditos).
- Stripe maneja la consolidación al final del ciclo.
- El ledger interno del Subscription engine se reconcilia 1:1 contra el meter de Stripe.

**Riesgo**: Stripe Metered Billing tiene reglas estrictas de reporte (debe enviarse cada usage event en una ventana razonable). Hay que diseñar con idempotencia desde el inicio.

#### D-B.2 — Multi-moneda en v1

**Pregunta**: ¿Multi-moneda en v1 o solo EUR?

**Recomendación**: **solo EUR en v1**. Multi-moneda añade complejidad de pricing (mismo plan en USD ≠ EUR convertido), reporting fiscal, conversión de meters. Reservar para Sprint 3+ con expansión internacional.

#### D-B.3 — Facturación electrónica España (Verifactu, SII)

**Pregunta**: ¿Integración nativa o documento generado y envío manual?

**Opciones**:
- (a) Integración nativa con SII (Suministro Inmediato de Información de la AEAT).
- (b) Verifactu (Sistemas de Facturación Verificables, ley 11/2021).
- (c) PDF generado por nosotros + envío manual.
- (d) Tercero (Factorial, Sage, FacturaDirecta, Holded).

**Recomendación**: **(d) tercero adapter Boundary First**. En v1, mock + diferir a Sprint 2+ con un proveedor confirmado por el usuario. Justificación: facturación electrónica española tiene normativa cambiante (Verifactu entra en vigor escalonado); construirlo nosotros es duplicar esfuerzo. El adapter abstrae la decisión.

#### D-B.4 — IVA y reverse charge UE

**Pregunta**: ¿Tratamiento de IVA español, reverse charge para empresas UE con VAT ID, sin IVA para no-UE?

**Recomendación**: implementar en v1 con tabla simple:
- ES + VAT ID válido → IVA 21%.
- UE + VAT ID válido + B2B → reverse charge (0% IVA, nota "Reverse charge").
- UE + sin VAT ID + B2C → IVA del país del consumidor (OSS).
- No-UE → sin IVA.

Esto exige validación de VAT ID vía VIES (servicio de la Comisión Europea); existen libs Python (`vatnumber`, `pyvat`).

#### D-B.5 — Reconciliación con Transaction OS

**Pregunta**: ¿Cómo se reconcilian Finder Fee, Success Fee, Advisory Share del Transaction OS con Billing?

**Recomendación**: **eventos canónicos** del OS (`closing.declared`, `spa.fully_signed`) emiten eventos económicos consumidos por Billing. El OS NO conoce Stripe; emite el evento; Billing decide qué crear (invoice item, customer balance debit, etc.).

Contrato:
```
Transaction OS → emits → "economic_event"
                  {operation_id, type: finder_fee|success_fee|advisory_share, amount, currency, parties[]}
Billing → consumes → creates InvoiceItem(s)
```

Esto preserva la regla de no-acoplamiento: Sprint 1 NO modifica Transaction OS.

---

## 5. Modelo de datos propuesto

> **Mapa**, no esquema completo. Esquemas detallados pertenecen a los specs canónicos (`IDENTITY_SPEC.md`, `AUTHORIZATION_SPEC.md`, `SUBSCRIPTION_SPEC.md`, `BILLING_SPEC.md`).

### 5.1 Colecciones de la Fase 1.1 — Identity

| Colección | Campos clave | Índices |
|---|---|---|
| `users` (existente, extendida) | `user_id, email, role, locale, timezone, preferences{}, verification{email, phone, document}, kyc_status, kyc_provider_ref, created_by, owner_id (=user_id por defecto), created_at, updated_at, last_login, deleted_at` | `email unique`, `kyc_status`, `verification.email.verified` |
| `user_sessions` (existente) | sin cambios | sin cambios |
| `organizations` (existente, extendida) | `org_id, legal_name, tax_id, vat_id, country, created_by, owner_id, plan_type, kyc_status, status, soft_delete{archived_at, archived_by}` | `tax_id unique partial`, `vat_id unique partial`, `country`, `status` |
| `org_teams` (nueva) | `team_id, org_id, name, slug, lead_user_id, created_by, created_at` | `org_id+slug unique` |
| `memberships` (existente, extendida) | `membership_id, user_id, org_id, team_id?, role_in_org, status, accepted_at, removed_at` | `user_id+org_id unique active`, `org_id+team_id` |
| `invitations` (existente) | sin cambios | sin cambios |
| `user_profiles_professional` (nueva) | `profile_id, user_id, title, bio, linkedin_url, public_email, completeness_score` | `user_id unique` |
| `user_profiles_advisor` (nueva) | `profile_id, user_id, accreditations[], sectors[], territories[], languages[], deals_closed_public_count, kyc_status, completeness_score` | `user_id unique`, `sectors`, `territories` |
| `user_profiles_corporate` (nueva) | `profile_id, user_id, company_role, org_id, sectors_interest[], deal_sizes[], territories_interest[], kyc_status` | `user_id+org_id` |
| `user_profiles_investor` (nueva) | `profile_id, user_id, investor_type (vc/pe/family_office/angel/strategic), check_size_band, sectors_interest[], stages[], territories_interest[], kyc_status` | `user_id unique`, `investor_type`, `sectors_interest` |
| `verification_attempts` (nueva) | `attempt_id, user_id, kind (email/phone/document), status, provider, provider_ref, created_at, completed_at` | `user_id+kind`, `provider_ref` |
| `kyc_records` (nueva) | `kyc_id, subject_type (user/org), subject_id, provider, provider_ref, status, completed_at, expires_at, risk_score, raw_payload_ref` | `subject_id+status`, `provider_ref` |

### 5.2 Colecciones de la Fase 1.2 — Authorization

| Colección | Campos clave | Índices |
|---|---|---|
| `auth_policies` (nueva, override Mongo) | `policy_id, effective_from, effective_until, scope, rule_yaml_text, applies_to_roles[], applies_to_orgs[], priority, created_by` | `effective_from`, `scope` |
| `feature_flags` (nueva) | `flag_id, key, description, default_value, conditions[], created_at, updated_at` | `key unique` |
| `resource_acls` (nueva, opt) | `acl_id, resource_type, resource_id, subject_type (user/team/org), subject_id, permissions[], granted_by, granted_at, expires_at?` | `resource_type+resource_id`, `subject_id` |
| `authz_audit_log` (nueva) | `event_id, ts, claims_snapshot, action, resource_type, resource_id, decision (permit/deny), reason, policy_refs[]` | `ts`, `claims_snapshot.user_id+ts`, `decision+ts` |

### 5.3 Colecciones de la Fase 1.3 — Subscription

| Colección | Campos clave | Índices |
|---|---|---|
| `plans` (nueva, configurable) | `plan_id, key (subscriber/corporate/investor/advisor), display_name, currency, base_price_cents, billing_period (monthly/yearly), credit_grants[{bucket, amount, reset_period}], entitlements[product_ids], overage_policy, gates{kyc_required, plan_min_kyc_level}` | `key unique`, `effective_from` |
| `subscriptions` (nueva) | `subscription_id, customer_type (user/org), customer_id, plan_id, status (active/paused/cancelled/past_due), started_at, current_period_start, current_period_end, stripe_subscription_id?` | `customer_id+status`, `stripe_subscription_id unique` |
| `credit_ledger` (nueva) | `entry_id, subscription_id, customer_id, bucket, amount (signed), reason (grant/consume/refund/expire), reference_type, reference_id, ts` | `customer_id+bucket+ts`, `subscription_id+ts` |
| `credit_balances` (nueva, cached) | `customer_id, bucket, granted, used, remaining, last_recomputed_at` | `customer_id+bucket unique` |
| `entitlements_grants` (nueva) | `grant_id, subscription_id, product_id, granted_at, expires_at, source (plan/addon/promo)` | `subscription_id+product_id` |
| `quota_consumption_events` (nueva) | (alias del ledger; mismo contenido orientado a observabilidad) | — |

### 5.4 Colecciones de la Fase 1.4 — Billing

| Colección | Campos clave | Índices |
|---|---|---|
| `stripe_customers` (nueva) | `stripe_customer_id, customer_type, customer_id, default_payment_method, vat_id, country, created_at` | `customer_id unique`, `stripe_customer_id unique` |
| `invoices` (nueva) | `invoice_id, stripe_invoice_id, customer_id, subscription_id?, status, currency, total_cents, tax_cents, items[{description, amount_cents, kind}], issued_at, due_at, paid_at?` | `customer_id+issued_at`, `stripe_invoice_id unique` |
| `economic_events` (nueva) | `event_id, source (transaction_os/subscription/manual), source_ref, type (finder_fee/success_fee/advisory_share/credit_overage), amount_cents, currency, parties[], status (pending/billed/cancelled), billed_invoice_id?` | `source+source_ref unique`, `status+ts` |
| `stripe_webhook_events` (nueva, idempotencia) | `event_id (stripe id), type, payload_ref, processed_at, status, error?` | `event_id unique` |
| `payment_methods` (nueva) | `payment_method_id, stripe_pm_id, customer_id, kind (card/sepa_debit), brand?, last4, expires?, is_default, created_at` | `customer_id+is_default` |

### 5.5 Reglas transversales sobre el modelo

- Toda colección con ciclo de vida tiene `created_at`, `updated_at`, `deleted_at` (soft-delete).
- Toda colección con ownership tiene `created_by` (inmutable) + `owner_id` (transferible).
- Toda colección con auditoría tiene un `ts` indexado.
- IDs siempre prefijados (`user_xxx`, `org_xxx`, `mem_xxx`, `inv_xxx`, `team_xxx`, `kyc_xxx`, `plan_xxx`, `sub_xxx`, `inv_xxx` para invoices ⚠️ ¡colisión con invitations! → renombrar a `bill_xxx`).
- Multi-tenancy lógica: cada query crítica debe filtrar por `org_id` cuando aplique. Decisión D10 del Sprint 0 (Mongo compartido con aislamiento lógico) se respeta.

---

## 6. Contratos API propuestos

> **Mapa de endpoints**, no OpenAPI completo. Cada endpoint con verbo + path + propósito. Detalles (payloads, responses, status codes) pertenecen a los specs canónicos.

### 6.1 Fase 1.1 — Identity

**Auth (existente, sin cambios estructurales)**:
- `POST /api/auth/register` — registro email/password.
- `POST /api/auth/login` — login email/password.
- `POST /api/auth/session` — exchange Emergent Google.
- `POST /api/auth/logout` — logout idempotente.
- `GET /api/auth/me` — retorna user + memberships.

**Users (extendido)**:
- `GET /api/users/me` — ya existe; ampliar payload con `profile_kinds[]`, `kyc_status`, `verification`.
- `PATCH /api/users/me` — extender campos (locale, timezone, preferences).
- `POST /api/users/me/verify/email/start` — inicia verificación email.
- `POST /api/users/me/verify/email/confirm` — confirma con token.
- `POST /api/users/me/verify/phone/start` — inicia verificación phone (SMS provider).
- `POST /api/users/me/verify/phone/confirm` — confirma con OTP.
- `POST /api/users/me/kyc/start` — inicia KYC (via adapter Boundary First).
- `GET /api/users/me/kyc/status` — consulta estado.
- `POST /api/users/me/transfer-ownership` — transfiere ownership de una entidad propia (con auth reforzada).

**Profiles tipados**:
- `POST /api/users/me/profiles/professional` — crea/actualiza perfil professional.
- `GET /api/users/me/profiles/professional` — lee.
- (Mismo patrón para `/advisor`, `/corporate`, `/investor`).
- `GET /api/users/{user_id}/profiles/{kind}` — lectura pública (con permisos).

**Organizations (existente, extendido)**:
- `POST /api/organizations` — crear org (existente).
- `GET /api/organizations/mine` — listar las mías (existente).
- `GET /api/organizations/{org_id}` — detalle (existente).
- `PATCH /api/organizations/{org_id}` — editar metadata (nuevo).
- `POST /api/organizations/{org_id}/archive` — soft-delete (nuevo).
- `GET /api/organizations/{org_id}/members` — listar (existente).
- `POST /api/organizations/{org_id}/invitations` — invitar (existente).
- `POST /api/invitations/{token}/accept` — aceptar (existente).
- `DELETE /api/organizations/{org_id}/invitations/{inv_id}` — cancelar invitación (nuevo).

**Teams (nuevo)**:
- `POST /api/organizations/{org_id}/teams` — crear team.
- `GET /api/organizations/{org_id}/teams` — listar.
- `GET /api/teams/{team_id}` — detalle.
- `POST /api/teams/{team_id}/members` — añadir member existente.
- `DELETE /api/teams/{team_id}/members/{user_id}` — remover.
- `PATCH /api/teams/{team_id}` — renombrar.

### 6.2 Fase 1.2 — Authorization

**Internal API (cross-module, no expuesta en REST público)**:
- `check_permission(claims, action, resource) → Decision`.
- `resolve_entitlements(claims) → Entitlements`.
- `evaluate_feature_flag(flag_id, claims) → bool`.

**Admin REST (sólo `admin` / `arroba_team`)**:
- `GET /api/admin/policies` — listar policies.
- `POST /api/admin/policies` — crear policy override (Mongo).
- `PATCH /api/admin/policies/{policy_id}` — modificar.
- `DELETE /api/admin/policies/{policy_id}` — desactivar.
- `GET /api/admin/feature-flags` — listar flags.
- `PATCH /api/admin/feature-flags/{flag_id}` — actualizar.
- `GET /api/admin/authz/audit?user_id=…` — consultar audit log de autorización.
- `GET /api/admin/resource-acls/{resource_type}/{resource_id}` — listar ACL de un recurso.
- `POST /api/admin/resource-acls` — conceder ACL excepcional.
- `DELETE /api/admin/resource-acls/{acl_id}` — revocar.

**Endpoint público de claims** (limited, sólo para consumo del frontend):
- `GET /api/auth/claims` — retorna claims efectivas del usuario actual (role, active_org, memberships, profile_kinds, entitlements activas). Frontend lo usa para renderizar UI condicionada (LockedSectionBlur, etc.).

### 6.3 Fase 1.3 — Subscription

**Customer-facing**:
- `GET /api/me/subscription` — subscription activa.
- `GET /api/me/credits` — balances multi-bucket.
- `GET /api/me/credits/history?bucket=valuation` — ledger filtrado.
- `GET /api/me/entitlements` — productos habilitados (derivado del plan).
- `POST /api/me/subscription/upgrade` — inicia upgrade (delega a Billing).
- `POST /api/me/subscription/cancel` — cancela.

**Plans (lectura pública)**:
- `GET /api/plans` — listar planes públicos.
- `GET /api/plans/{plan_key}` — detalle.

**Admin**:
- `POST /api/admin/plans` — crear plan.
- `PATCH /api/admin/plans/{plan_id}` — modificar.
- `POST /api/admin/credits/grant` — conceder créditos excepcionales.
- `GET /api/admin/subscriptions` — listar todas.

### 6.4 Fase 1.4 — Billing

**Customer-facing**:
- `POST /api/billing/checkout` — crear checkout session (delega a Stripe).
- `GET /api/billing/portal` — URL de Stripe Customer Portal.
- `GET /api/me/invoices` — historial de facturas.
- `GET /api/me/invoices/{invoice_id}` — detalle.
- `GET /api/me/invoices/{invoice_id}/pdf` — descarga PDF.
- `GET /api/me/payment-methods` — listar.
- `POST /api/me/payment-methods/default` — cambiar default.

**Webhooks**:
- `POST /api/webhooks/stripe` — recibe eventos Stripe (idempotente).

**Admin**:
- `GET /api/admin/billing/economic-events` — listar eventos pendientes.
- `POST /api/admin/billing/economic-events/{event_id}/bill` — marcar como facturable.
- `POST /api/admin/billing/refund` — refund (con razón).

**Internal API (consumido por Transaction OS futuro)**:
- `emit_economic_event(operation_id, kind, amount, parties) → EventRef` — interfaz que el OS futuro invocará.

---

## 7. Integraciones externas necesarias

### 7.1 Stripe (Billing — uso real)

**Estado actual**: SDK instalado, `billing/health` stub verifica presencia. No hay uso real.
**Alcance Sprint 1**: Customers, Subscriptions, Metered Billing, Invoices, Customer Portal, Webhooks.
**Coste estimado**: 1,4% + 0,25 € por transacción europea (estándar Stripe).
**Riesgo**: alto si no se diseña idempotencia desde el inicio. Mitigación: tabla `stripe_webhook_events` con `event_id unique`.
**Alternativas consideradas**: Adyen (caro, B2B enterprise), PayPal (no encaja con SaaS subscription), Razorpay (no opera en EU para empresas españolas como primario).

### 7.2 Proveedor de KYC (opcional v1)

**Estado actual**: cero.
**Alcance Sprint 1 (recomendación)**: adapter Boundary First con MOCK. Integración real diferida.
**Opciones para fase real (Sprint 1.5 o Sprint 3)**:
| Proveedor | Coste por verify | Pros | Contras |
|---|---|---|---|
| Stripe Identity | ~1,50 € | Integrado con Stripe; cero infra extra | Limitado (solo documento, no AML) |
| Onfido | ~3-5 € | Mercado europeo maduro; AML | Setup más pesado |
| Veriff | ~2-4 € | Pricing competitivo; europeo | Menor reconocimiento |
| Sumsub | ~2-4 € | KYC + AML + monitoring | UI menos pulida |

**Recomendación**: Stripe Identity por cercanía con Billing si solo se necesita documento. Onfido si AML es necesario en v1 (no recomendado para Sprint 1).

### 7.3 Email transactional (verificación + invitaciones)

**Estado actual**: cero (no se envían emails reales).
**Alcance Sprint 1**: emails de verificación (link con token) e invitaciones.
**Opciones**:
| Proveedor | Coste 10k emails/mes | Pros | Contras |
|---|---|---|---|
| Resend | ~3-5 € | API moderna, React Email, alemán/UE | Más reciente |
| SendGrid | ~15-20 € | Reconocimiento, infraestructura | UI pesada |
| Mailgun | ~15 € | Robusto | UI legacy |
| Postmark | ~15 € | Excelente entregabilidad transactional | Solo transactional |

**Recomendación**: **Resend** por DX moderna y coste, mediante `integration_playbook_expert_v2`.

### 7.4 SMS (verificación phone)

**Estado actual**: cero.
**Alcance Sprint 1**: SMS OTP para verificación de phone.
**Opciones**:
- Twilio SMS (~0,04 € por SMS en España).
- Vonage (similar).
- Stripe Identity también incluye verificación phone (si ya usamos Stripe Identity, evita doble integración).

**Recomendación**: **Twilio SMS** si phone verification es prioritaria; **diferir** si la mayoría de usuarios verifican por email.

### 7.5 VIES (validación VAT ID UE)

**Estado actual**: cero.
**Alcance Sprint 1**: validación de VAT ID en checkout para reverse charge.
**Coste**: 0 € (servicio gratuito de la Comisión Europea).
**Riesgo**: VIES tiene downtime ocasional; cachear validaciones positivas con TTL 7d.
**Lib**: `pyvat` o `vatnumber`.

### 7.6 Facturación electrónica española (diferida)

**Estado actual**: cero.
**Alcance Sprint 1**: adapter Boundary First mock. Real diferido.
**Opciones futuras**: Holded, FacturaDirecta, Sage Business Cloud, integración nativa con SII/Verifactu.
**Riesgo**: normativa Verifactu en transición (ley 11/2021). Esperar a operadores con integración madura.

### 7.7 Resumen de integraciones

| Integración | Sprint 1 | Coste mensual estimado | Riesgo |
|---|---|---|---|
| Stripe | ✅ Real | Variable (1,4% transacciones) | Medio (idempotencia) |
| KYC | 🟡 Mock | 0 € | Bajo |
| Email (Resend) | ✅ Real | ~5 € | Bajo |
| SMS (Twilio) | 🟡 Opcional | ~0 base + uso | Bajo |
| VIES | ✅ Real | 0 € | Bajo |
| Facturación electrónica | 🟡 Mock | 0 € | Diferido |

---

## 8. Plan de implementación por fase

> Cada sub-fase con criterios de aceptación **verificables**. No "implementación lista", sino métricas observables.

### 8.0 Fase 1.0 — Specs canónicos (paso previo a código)

| Sub-fase | Contenido | Criterio de aceptación |
|---|---|---|
| 1.0.a | `IDENTITY_SPEC.md` v1.0 | Documento entregado al usuario para aprobación. Define modelo de identidad completo, contratos, decisiones D-I.1-D-I.6 cerradas. |
| 1.0.b | `AUTHORIZATION_SPEC.md` v1.0 | Idem. Cierra D-A.1-D-A.8. |
| 1.0.c | `SUBSCRIPTION_SPEC.md` v1.0 | Idem. Cierra D-S.1-D-S.5. |
| 1.0.d | `BILLING_SPEC.md` v1.0 | Idem. Cierra D-B.1-D-B.5. |

**Hito crítico**: ningún código se escribe hasta que los 4 specs estén aprobados por el usuario.

### 8.1 Fase 1.1 — Identity

#### Sub-fase 1.1.a — Extensión del modelo `user` + verificación email

**Contenido**:
- Extender `users.models.UserInDB` con campos canónicos (locale, timezone, preferences, verification, kyc_status).
- Endpoints `POST /api/users/me/verify/email/{start,confirm}`.
- Integración con Resend.
- Tests pytest unitarios + integración.

**Criterio de aceptación**:
- `GET /api/users/me` devuelve schema extendido con `verification.email.verified: false` para users nuevos.
- `POST /verify/email/start` envía email real (verificable en Resend dashboard).
- `POST /verify/email/confirm` cambia `verification.email.verified` a true.
- Token expira en 24h.
- 100% PASS en `test_users_verification.py`.

#### Sub-fase 1.1.b — Teams + ownership transferible

**Contenido**:
- Colección `org_teams` + service + endpoints CRUD.
- Añadir `team_id` a `memberships`.
- Endpoints de ownership transfer.

**Criterio de aceptación**:
- `POST /organizations/{org_id}/teams` crea team y es listable.
- `POST /teams/{team_id}/members` añade member existente (de la misma org).
- `POST /users/me/transfer-ownership` transfiere ownership de una entidad (test con `organization`).
- `created_by` permanece inmutable tras transferencia; `owner_id` cambia.

#### Sub-fase 1.1.c — Perfiles tipados (Professional, Advisor, Corporate, Investor)

**Contenido**:
- 4 colecciones de perfiles + services + endpoints.
- Completeness score derivado de campos rellenados.
- `user.profile_kinds[]` derivada de los perfiles existentes.

**Criterio de aceptación**:
- `POST /users/me/profiles/advisor` crea perfil; `GET` lo lee.
- `user.profile_kinds` incluye `advisor` tras creación.
- `completeness_score` calculado y observable.
- Lectura pública con permisos: `GET /users/{user_id}/profiles/advisor` retorna 200 para anónimos con campos públicos; 200 con todo para `advisor`/`admin`/`arroba_team`; 200 con campos limitados para resto.

#### Sub-fase 1.1.d — KYC adapter (mock)

**Contenido**:
- `KycAdapter` (interface) + `KycAdapterMock` + factory por env.
- Endpoints `POST /users/me/kyc/start` + `GET /users/me/kyc/status`.
- Colección `kyc_records`.

**Criterio de aceptación**:
- Endpoint funciona end-to-end con adapter mock.
- Estados transicionan correctamente: `unverified → pending → approved | rejected`.
- Header `X-Source: mock` presente en responses.
- REQ-KYC-001 emitido en `/app/_requirements_for_agency_tool/` para la versión real.

#### Sub-fase 1.1.e — Frontend (perfiles + verificación)

**Contenido**:
- Páginas `/es/profile/{professional,advisor,corporate,investor}`.
- Componentes de verificación (email confirmed banner, "verifica tu email" CTA).
- Onboarding multi-step para elegir profile_kinds.

**Criterio de aceptación**:
- Flujo E2E: usuario nuevo → completa profile_kind → ve banner verifica email → recibe email → click → verificación marcada en backend.
- Vitest + Playwright en verde.

### 8.2 Fase 1.2 — Authorization

#### Sub-fase 1.2.a — Core RBAC + ABAC limitado

**Contenido**:
- Motor `policy_engine.py` que carga YAML de `/app/backend/policies/`.
- `Decision` type, `Claims` type, `Resource` type.
- `check_permission` con soporte ABAC limitado (plan, kyc_status, risk_score).
- Caché in-memory con TTL.

**Criterio de aceptación**:
- `check_permission(claims, "company:read", company)` retorna `permit` para usuario subscriber con plan activo.
- `check_permission(claims, "operation:write", op)` retorna `deny` para usuario sin membership en la org de la operación.
- Latencia P99 < 5 ms para 1000 requests concurrentes.
- Matriz de tests rol × acción × recurso × plan × kyc cubierta al 100% para acciones críticas.

#### Sub-fase 1.2.b — Feature flags

**Contenido**:
- Colección `feature_flags` + service + endpoints admin.
- `evaluate_feature_flag` con condiciones por role/plan/org.

**Criterio de aceptación**:
- `evaluate_feature_flag("new_match_ui", claims)` retorna true/false según conditions.
- Admin puede crear/modificar flags vía API.

#### Sub-fase 1.2.c — Resource ACLs

**Contenido**:
- Colección `resource_acls`.
- `check_permission` consulta primero policies, luego ACLs específicas (para overrides).

**Criterio de aceptación**:
- ACL concedida a un user para un `operation_id` específico hace que `check_permission` retorne permit.
- ACL revocada → permit deja de aplicar inmediatamente (TTL de caché respetado).

#### Sub-fase 1.2.d — Audit log de decisiones

**Contenido**:
- Colección `authz_audit_log`.
- Sampling configurable (PERMIT 1% / DENY 100%).
- Endpoint admin para consultar.

**Criterio de aceptación**:
- Toda denegación registrada con razón.
- 1% de permits sampleados.
- Endpoint admin retorna log filtrable.

#### Sub-fase 1.2.e — Integración con resto del producto

**Contenido**:
- Dependency `get_current_claims` para FastAPI.
- Helper `require_permission(action, resource_extractor)` decorator.
- Documentación de cómo otros módulos deben consumir.

**Criterio de aceptación**:
- Al menos UN endpoint existente (ej. `GET /api/companies/{cif}`) refactorizado para usar `require_permission`.
- 100% tests previos siguen pasando (no regresión).

### 8.3 Fase 1.3 — Subscription

#### Sub-fase 1.3.a — Plans configurables

**Contenido**:
- Colección `plans` + seed script con 5 planes base (anonymous, subscriber, corporate, investor, advisor).
- Endpoints CRUD admin.
- Endpoint público de listado.

**Criterio de aceptación**:
- `GET /api/plans` retorna 5 planes.
- Admin puede crear nuevo plan sin redeploy.
- Plan carga sin caché de proceso (cambios en Mongo se reflejan en <5s).

#### Sub-fase 1.3.b — Credit ledger + balances

**Contenido**:
- Colección `credit_ledger` + `credit_balances`.
- Service con `grant`, `consume`, `refund`.
- Recompute periódico de balances vs ledger.

**Criterio de aceptación**:
- `consume_credit(user, "valuation", 1)` decrementa balance.
- `grant_credit(user, "valuation", 100)` incrementa.
- Si balance.remaining = recomputed_from_ledger.remaining para 1000 users muestreados.

#### Sub-fase 1.3.c — Entitlements + gates

**Contenido**:
- `is_product_enabled(plan, product) → bool`.
- Helper `gate_or_raise(claims, product)` para uso desde otros módulos.
- Compositor de gates: plan + kyc + risk + custom.

**Criterio de aceptación**:
- Usuario plan `subscriber` sin KYC: `gate_or_raise(claims, "data_room_download")` lanza `KycRequiredError`.
- Usuario plan `subscriber` con KYC: permite.
- Tests con todas las combinaciones plan × kyc × producto.

#### Sub-fase 1.3.d — Subscriptions lifecycle (sin Stripe)

**Contenido**:
- Crear subscription en estado `active` manualmente.
- Cambiar plan.
- Cancelar (transición a `cancelled`).
- Pausar (transición a `paused`).

**Criterio de aceptación**:
- `POST /me/subscription/upgrade` cambia plan_id y refresca entitlements.
- Cancelación deja subscription `cancelled` pero períodos previos consultables.

#### Sub-fase 1.3.e — Frontend (planes + créditos)

**Contenido**:
- Página `/es/pricing` con tarjetas de planes (vienen del backend, NO hardcoded).
- Componente `CreditBalanceBadge` en header.
- Página `/es/me/credits` con historial.

**Criterio de aceptación**:
- Cambio en `plans` en Mongo se refleja en `/es/pricing` en <5s.
- Badge de balance actualizado en tiempo real tras consumo.

### 8.4 Fase 1.4 — Billing

#### Sub-fase 1.4.a — Stripe customers + payment methods

**Contenido**:
- Crear `stripe_customers` al primer checkout.
- Sync payment methods.
- Endpoint admin para forzar resync.

**Criterio de aceptación**:
- Usuario que se registra y nunca paga: NO tiene `stripe_customer_id` (lazy).
- Usuario que va a `/checkout`: crea customer + retorna URL Stripe.

#### Sub-fase 1.4.b — Subscriptions con Stripe + meters

**Contenido**:
- `POST /billing/checkout` crea checkout session.
- Webhook `checkout.session.completed` crea `subscription` interna.
- Meters por bucket (valuation, matching, etc.).

**Criterio de aceptación**:
- E2E test contra Stripe sandbox: usuario va a checkout, completa, webhook recibido, subscription `active` en Mongo.
- Idempotencia: si webhook se reenvía, no duplica.

#### Sub-fase 1.4.c — Metered usage reporting

**Contenido**:
- Cada `consume_credit` emite un usage record a Stripe en background (queue).
- Idempotencia por (`subscription_id`, `bucket`, `ledger_entry_id`).

**Criterio de aceptación**:
- Stripe dashboard muestra meter consumo en sincronía con `credit_ledger`.
- Reintento manual de usage record no duplica.

#### Sub-fase 1.4.d — Invoices + reconciliación

**Contenido**:
- Webhook `invoice.finalized` crea `invoices` interno.
- Webhook `invoice.paid` actualiza estado.
- Webhook `invoice.payment_failed` notifica.
- IVA y reverse charge calculados por tabla.

**Criterio de aceptación**:
- Invoice generada en Stripe ↔ invoice en Mongo consistentes (campos clave).
- Stripe Tax / cálculo manual de IVA verificado para ES + UE + no-UE.

#### Sub-fase 1.4.e — Economic events del Transaction OS (adapter)

**Contenido**:
- `emit_economic_event` interface.
- Colección `economic_events`.
- Cron job (o background task) que procesa pending → invoice items.

**Criterio de aceptación**:
- Adapter aceptado por el equipo del Transaction OS (no se modifica el OS; solo se publica el contrato).
- Test simulando `closing.declared` → invoice item creado correctamente.

#### Sub-fase 1.4.f — Frontend (billing portal + historial)

**Contenido**:
- Página `/es/me/billing` con redirect a Stripe Customer Portal.
- Página `/es/me/invoices` con historial filtrable + descarga PDF.

**Criterio de aceptación**:
- Usuario puede ver historial y descargar facturas.
- Stripe Portal funcional (cancelar suscripción, actualizar método de pago).

---

## 9. Tests strategy

### 9.1 Backend (pytest)

**Niveles**:
- **Unit**: cada service con mocks de DB + integraciones externas. Cobertura ≥85% en `auth`, `users`, `organizations`, `subscription`, `billing`, `authorization`.
- **Integration**: contra `mongomock-motor` (default) + opcionales contra Mongo real (`@pytest.mark.real_mongo`).
- **E2E**: flujos críticos contra el servicio real local con httpx (registro → verificación → perfil → checkout → webhook).
- **Security**: matriz de autorización exhaustiva (rol × acción × recurso × plan × kyc). Generada con `pytest.parametrize` para garantizar cobertura.

**Reglas**:
- Stripe: tests integrados solo contra **sandbox** + mock para tests rápidos.
- KYC: solo mock en CI.
- Email: dummy provider en tests (no envío real).

### 9.2 Frontend (vitest + Playwright)

**Niveles**:
- **Vitest**: componentes individuales (planes, balance badge, profile forms).
- **Playwright**: flujos E2E (register → verify email → complete profile → upgrade plan → see credits in header).

**Cobertura mínima por fase**:
- 1.1 Identity: 90% en `services` + 80% en `routers` + flujos E2E críticos.
- 1.2 Authorization: 95% en `policy_engine` + 100% en matriz de autorización para acciones críticas.
- 1.3 Subscription: 90% en `credit_ledger` + 85% en `service` (incluye edge cases de overage).
- 1.4 Billing: 80% (la integración Stripe limita lo testeable en CI; resto cubierto con sandbox manual).

### 9.3 Tests de regresión

- **Cada fase**: ejecutar la suite completa anterior; los 138/138 pytest existentes deben seguir verdes.
- **Cada PR**: lint + typecheck + tests (CI).
- **Pre-cierre de Sprint 1**: ejecución completa de la suite end-to-end manual contra entorno preview.

### 9.4 Tests específicos de seguridad

| Caso | Cómo se prueba |
|---|---|
| User A no puede leer `operation` de Org B | Test con 2 users, 2 orgs; intentar `GET /api/operations/{id}` cross-org → 403. |
| Anónimo no puede ver Data Room | Test sin cookie → 401 / 403 según endpoint. |
| KYC required hace gate hard en download | Test sin KYC → 403 con mensaje "kyc_required". |
| Soft gate degrada respuesta | Test sin KYC sobre `/analyze` → 200 con flag `degraded=true`. |
| Audit log captura denegación | Test deniega + verifica entrada en `authz_audit_log`. |
| Caché de decisión invalida al cambiar role | Test promueve user a admin → siguiente check ve el cambio. |

---

## 10. Estimación de esfuerzo

### 10.1 Referencia interna (anclas)

| Sprint / fase anterior | Esfuerzo aproximado (CW) | Composición |
|---|---:|---|
| Sprint 0 + 0.5 (canónico) | 12-15 | 6 specs + audit + propagación + ZIP + 4 docs consolidadores |
| E1.5.6 (Entity Framework canon) | 6-8 | 11 componentes nuevos + refactor + tests + docs |
| E1.5 (Workspaces persistentes) | 8-10 | Backend (6 endpoints + 3 colecciones) + Frontend completo + multi-org |
| E1.4 (Intelligence Skills) | 6-8 | 3 skills + LLM router + Block Library nueva |
| E1.3 (Copilot Foundation) | 4-6 | CopilotProvider + Dock + Block Library base |

### 10.2 Estimación Sprint 1 (rango por fase)

| Fase | Sub-fases | Líneas estimadas (back + front + tests) | CW low | CW high | Notas |
|---|---|---:|---:|---:|---|
| 1.0 Specs | a, b, c, d | 4 documentos × ~1.000-1.500 líneas | 4 | 6 | Anclado al Sprint 0 |
| 1.1 Identity | a-e | ~1.500-2.500 back · ~600-900 front · ~600-900 tests | 8 | 14 | Mediana ~11 |
| 1.2 Authorization | a-e | ~1.300-2.200 back · ~300-500 front · ~700-1.100 tests | 9 | 16 | Mediana ~12; alto por seguridad |
| 1.3 Subscription | a-e | ~1.350-2.200 back · ~400-600 front · ~600-900 tests | 7 | 12 | Mediana ~9 |
| 1.4 Billing | a-f | ~1.550-2.600 back · ~500-800 front · ~700-1.100 tests | 8 | 14 | Mediana ~11; Stripe + facturación |
| Cross-cutting | (CI, observabilidad, doc, regresión) | — | 3 | 5 | Distribuido |
| **TOTAL** | | **~9.000-14.700 líneas** | **39** | **67** | Mediana **~50** |

### 10.3 Incertidumbres marcadas

| Item | Incertidumbre | Mitigación |
|---|---|---|
| Matriz de tests de Authorization | Alta — depende de cuántas acciones × recursos terminemos teniendo | Definir matriz mínima en el spec y crecer |
| Facturación electrónica España | Alta — normativa Verifactu cambiando | Adapter Boundary First; diferir real |
| KYC real | Alta — depende de proveedor elegido | Mock en v1; decisión clara en Sprint 1.5 |
| Stripe Metered Billing | Media — primera implementación real | Time-boxed; si > 3 días de bloqueo, escalar |
| Verificación SMS | Baja — Twilio es estándar | — |

### 10.4 Recomendación de planificación

- Asumir **50 CW** como objetivo mediano.
- Reservar **+10%** (5 CW) para imprevistos en Authorization (matriz exhaustiva) y Billing (idempotencia Stripe).
- Si en Hito 2 (post-Authorization) el consumo real supera el 50% del rango high, **revisar scope** antes de Subscription.
- Marcar **decisiones diferidas** explícitamente para retomar en Sprint 1.5 si son críticas.

---

## 11. Riesgos identificados y mitigaciones

### Top 10 riesgos

| # | Riesgo | Prob. | Impacto | Mitigación propuesta |
|---|---|---|---|---|
| R1 | Matriz de Authorization mal diseñada → permisos sobreabiertos | Media | Alto | Tests exhaustivos rol×acción×recurso×plan×kyc; revisión específica `arroba_team` en cada acción crítica; deny-overrides por defecto. |
| R2 | Webhooks Stripe sin idempotencia → duplicación de invoices/usage | Media | Alto | Tabla `stripe_webhook_events` con `event_id unique`; tests que reinyecten el mismo evento. |
| R3 | Quota ledger inconsistente con balances cacheados | Media | Medio | Recompute periódico automático; alerta si discrepancia detectada. |
| R4 | Cambio de policy NO se propaga (caché agresiva) | Baja | Alto | TTL corto (60s); invalidación explícita ante eventos de cambio de role/plan/policy. |
| R5 | KYC mock → real cambia el contrato y rompe consumidores | Media | Medio | Adapter Boundary First desde día 1; tests de contrato. |
| R6 | Stripe Customer Portal expone datos sensibles inesperadamente | Baja | Alto | Configurar portal con allowlist mínima; auditar antes de prod. |
| R7 | Facturación electrónica España bloquea cierre Sprint 1 | Alta | Bajo | Diferir explícitamente; mock en Sprint 1 + REQ-BILL-FACTUR-001 emitido. |
| R8 | Falta de teams en v1 fuerza refactor en Sprint 2 (Data Room) | Baja | Alto | Construir teams en 1.1.b; no es opcional. |
| R9 | Latencia de `check_permission` degrada UX | Media | Medio | Caché in-memory + benchmarks P99 < 5 ms; perfil temprano. |
| R10 | Cambio de modelo de identidad (user ↔ org) en Sprint 2 | Media | Crítico | Decisión D-I.1 sólida desde inicio; no permitir N:M ambiguo. |

### Riesgos arquitectónicos transversales (no en top 10 pero relevantes)

- **Acoplamiento sutil**: cuidar que ningún módulo del producto importe Mongo collections de la plataforma directamente. Code review explícito.
- **Cambios en specs durante implementación**: la fase 1.0 cierra los specs; cambios posteriores requieren bump de versión + propagación.
- **Coste de testing E2E**: Stripe sandbox + Resend dev mailbox + KYC mock — preparar entorno de tests dedicado.

---

## 12. Hitos y checkpoints sugeridos

> Cada hito requiere **aprobación explícita del usuario** antes de pasar al siguiente. Sin aprobación, no se inicia trabajo de la siguiente fase.

| Hito | Después de | Entregable | Decisión que toma el usuario |
|---|---|---|---|
| **H1** | Esta propuesta (Fase 1.A) | `SPRINT1_ARCHITECTURE_PROPOSAL.md` | Aprobar el approach + responder a las decisiones D-I.x, D-A.x, D-S.x, D-B.x. |
| **H2** | Fase 1.0.a (IDENTITY_SPEC) | `IDENTITY_SPEC.md` v1.0 | Aprobar el spec antes de implementar 1.1. |
| **H3** | Fase 1.0.b (AUTHORIZATION_SPEC) | `AUTHORIZATION_SPEC.md` v1.0 | Aprobar antes de implementar 1.2. |
| **H4** | Fase 1.0.c (SUBSCRIPTION_SPEC) | `SUBSCRIPTION_SPEC.md` v1.0 | Aprobar antes de implementar 1.3. |
| **H5** | Fase 1.0.d (BILLING_SPEC) | `BILLING_SPEC.md` v1.0 | Aprobar antes de implementar 1.4. |
| **H6** | Fase 1.1 implementada y testeada | Identity backend + frontend + tests verdes | Validar el contrato exportado de Identity antes de seguir. |
| **H7** | Fase 1.2 implementada | Authorization completo + matriz de tests | Validar la matriz de permisos. |
| **H8** | Fase 1.3 implementada | Subscription + planes seed + créditos | Validar planes y créditos antes de integrar Stripe real. |
| **H9** | Fase 1.4 implementada | Billing con Stripe sandbox funcional | Validar contra Stripe sandbox antes de pasar a producción. |
| **H10** | Cierre Sprint 1 | Sprint 1 cerrado · canon Sprint 1 versionado · CHANGELOG actualizado | Aprobar cierre y autorizar Sprint 2. |

### Frecuencia de checkpoints intermedios

Dentro de cada fase, recomiendo **mini-checkpoint por sub-fase** (1.1.a, 1.1.b, …). El usuario puede aceptarlos por defecto (silent approval con timeout) o pedir revisión explícita. Esto evita doom loops.

---

## 13. Decisiones canónicas del Sprint 0 que aplican

> Estas decisiones de la Canonical Baseline v1.0 **condicionan** el Sprint 1. Ninguna puede ignorarse sin abrir contradicción contra el canon.

### 13.1 OPENs G2 ya cerrados que aplican

| OPEN | Decisión | Aplicación en Sprint 1 |
|---|---|---|
| **A8** | Tokens JWT 24h, refresh 30d, sesión inactividad 1h | Implementar exactamente esos valores en Auth + Authorization (sessions). |
| **B2** | TC no lee audit cross-user por defecto; solo `arroba_team`/`admin` cuando se escala | Authorization audit log accesible solo para roles `arroba_team`/`admin`. |
| **C11** | Rol `arroba_team` distinto de `admin` | Añadir `arroba_team` al enum `Role` en Sprint 1.1.a. |
| **D10** | Mongo compartido con aislamiento lógico estricto | Cada query crítica filtra por `org_id`; tests verifican aislamiento. |
| **D14** | Watchlists referencian `company` (no `org`); archivado de org no las afecta | Decisión arquitectónica de Identity: las watchlists son por user/org pero referencian companies como entidades públicas. |
| **E16** | `admin` no se salta política §5.3 (siempre flujo) | Authorization niega bypass total; admin puede acelerar revisión, no saltar audit. |
| **F6** | Tope autorización L4 Subscriber 30 días | Implementar en Subscription engine como gate. |
| **F34** | Sin freemium adicional en v1.0; Anonymous = único modo gratuito | Plans seed: solo Anonymous (público), Subscriber+ son de pago. |
| **F35** | Sin descuentos por volumen en Sprint 1 | Subscription engine no implementa volume discounts. |

### 13.2 Roles canónicos del Sprint 0

Catálogo final que Sprint 1 debe implementar:

| Role | Origen | Función |
|---|---|---|
| `anonymous` | Existente | Visitantes sin auth. |
| `subscriber` | Existente | Usuario individual con plan Subscriber. |
| `corporate` | Existente | Usuario corporate (empleado de empresa con plan Corporate). |
| `investor` | Existente | Inversor con plan Investor. |
| `advisor` | Existente | Advisor con plan Advisor. |
| **`arroba_team`** | Nuevo (G2.C11) | Equipo interno de arroba. NO hereda permisos de `admin`. Distinción explícita. |
| `admin` | Existente | Superadmin de la plataforma. |

### 13.3 Otras decisiones del Sprint 0 aplicables

| Decisión | Aplicación |
|---|---|
| **Plan + Permisos + Riesgo determinan acceso** (OPEN-C3) | Authorization debe combinar los tres en cada `check_permission` para acciones sensibles. |
| **Memory cross-deal aislada por defecto** | Identity no expone cross-deal memory; ese aislamiento se aplica en Memory Engine consumiendo claims. |
| **Voz única del Copilot** | Identity no afecta directamente, pero exposiciones públicas de perfiles deben evitar contradecir el modelo (no exponer "Copilot identities" en perfiles). |
| **Least privilege** | Toda Authorization decisión por defecto deniega; explicit permit. |
| **`team_arroba → arroba_team`** | Aplicado en el rol y en cualquier mención canónica. |
| **Catálogo abstraído** | Identity no menciona conteos numéricos del catálogo de entidades. |
| **Fases canónicas Operation** | Billing reconcilia eventos económicos según las fases `nda → … → integration`. |
| **Match como entidad** | Authorization debe permitir `check_permission` sobre `resource_type = match`. |

---

## 14. Lagunas que requieren decisión humana antes de IDENTITY_SPEC

> Las siguientes preguntas requieren respuesta del usuario antes de escribir `IDENTITY_SPEC.md`. No tienen "ganador obvio" sin input.

### Top 5 lagunas críticas

1. **¿KYC integración real en Sprint 1 o solo mock?**
   - Opción A: mock + diferir real (recomendado por mí; baja riesgo Sprint 1).
   - Opción B: integración con Stripe Identity en Sprint 1.5 (un poco más caro pero produce funcionalidad real desde inicio).
   - Necesito tu decisión antes de redactar la sección "KYC" del IDENTITY_SPEC.

2. **¿Tipos de verificación habilitados en v1?**
   - Email-only / Email+Phone / Email+Phone+Document.
   - Cada nivel implica integración (Resend para email, Twilio para phone, KYC para document).
   - Tu decisión define la lista de endpoints `/verify/*`.

3. **¿Perfiles "Advisor" / "Corporate" / "Investor" como entidades separadas (recomendado) o sub-docs?**
   - Las consecuencias son largas: indexación, ciclo de vida, schema de actualización.
   - Si tienes una preferencia o restricción que yo no veo, dímelo antes del spec.

4. **¿Cuántos teams por organización son razonables en v1?**
   - Sin límite duro (configurable por plan) / límite duro (ej. max 5 en Subscriber, 20 en Corporate) / sin teams en v1 (diferir a Sprint 2).
   - Define UX (selector de team vs lista plana).

5. **¿Política de invitaciones: cualquier member invita o solo owner/admin?**
   - Hoy en `OrgRole` existen `owner`, `admin`, `operator`. ¿`operator` puede invitar? ¿Solo `owner`/`admin`? ¿Configurable por org?
   - Esta decisión impacta la matriz de Authorization en 1.2.

### Lagunas adicionales (no top 5 pero importantes)

6. **¿`user.locale` y `user.timezone` se infieren del navegador o se piden explícitamente?**
7. **¿Onboarding de profile_kinds: obligatorio elegir uno al registrarse o opcional?**
8. **¿`organization.tax_id` validación contra registro mercantil (Agency Tool) en v1 o solo formato?**
9. **¿`org.archive` es soft-delete permanente o reversible (con permisos especiales)?**
10. **¿Audit log de Identity (cambios de role, transferencias de ownership): retention 1 año, 3 años, indefinida?**

---

## 15. Cierre

Este documento es **Fase 1.A** del Sprint 1. Es input para el usuario.

Próxima fase tras tu aprobación: **Fase 1.0** (escribir los 4 specs canónicos: IDENTITY_SPEC, AUTHORIZATION_SPEC, SUBSCRIPTION_SPEC, BILLING_SPEC).

Nada de código de producto se ha modificado. Nada del canon Sprint 0 ha sido alterado. El pack `canonical_pack_v1.0.zip` permanece inmutable.

A la espera de tu revisión y respuesta a las decisiones D-I.x / D-A.x / D-S.x / D-B.x + las 5 lagunas top.

---

> **Documento generado**: 2026-06-25 (Fase 1.A — propuesta arquitectónica).
> **No se inicia ninguna otra fase sin aprobación explícita.**
