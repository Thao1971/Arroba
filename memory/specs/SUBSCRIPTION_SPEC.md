# arroba.com — Subscription Spec v1.0.0

> **Spec canónico** · capa 4 del canon (Engines & Specs).
> Fase 1.0.3 del Sprint 1 — tercer spec del Identity Platform Sprint.
> Fecha de cierre: 2026-06-25.
>
> **CHANGELOG interno**:
>
> **v1.0.0 (2026-06-25)** — Cierre inicial. Aprobadas las 5 decisiones D-S.1-D-S.5 del SPRINT1_ARCHITECTURE_PROPOSAL, las decisiones F6 / F34 / F35 del Sprint 0, la política de overage D4 y las 10 lagunas declaradas en AUTHORIZATION_SPEC §16 cerradas en este spec.
>
> ---
>
> **Regla cardinal**: este spec define la **plataforma de Subscription** como la **4ª de 5 capas** de la cadena `Authentication ⇄ Identity ⇄ Authorization ⇄ Subscription ⇄ Billing`. Subscription consume claims de Identity + decisiones de Authorization. Subscription **NO conoce stripe**, NO emite facturas, NO procesa pagos. Emite **eventos económicos** que Billing consume.
>
> **Precedencia**: en caso de conflicto entre este spec y la implementación, **gana el spec**.

---

## Índice

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Glosario](#2-glosario)
3. [Principios canónicos](#3-principios-canónicos)
4. [Modelo de datos canónico (Mongo)](#4-modelo-de-datos-canónico-mongo)
5. [`PlanClaim` — el contrato canónico de Subscription hacia arriba](#5-planclaim--el-contrato-canónico-de-subscription-hacia-arriba)
6. [Política de cuotas, créditos y overage](#6-política-de-cuotas-créditos-y-overage)
7. [Orden canónico de evaluación end-to-end](#7-orden-canónico-de-evaluación-end-to-end)
8. [Migración inicial — `plan = "unknown"`](#8-migración-inicial--plan--unknown)
9. [Forward-compatibility: fiscal_entity_id × planes](#9-forward-compatibility-fiscal_entity_id--planes)
10. [Eventos canónicos del Subscription Engine](#10-eventos-canónicos-del-subscription-engine)
11. [APIs canónicas (mapa)](#11-apis-canónicas-mapa)
12. [Integración forward con BILLING_SPEC](#12-integración-forward-con-billing_spec)
13. [Seed YAML inicial de los 7 planes](#13-seed-yaml-inicial-de-los-7-planes)
14. [Open Questions (OPEN-S-*)](#14-open-questions-open-s-)

---

## 1. Propósito y alcance

### 1.1 Qué es Subscription Platform

La **Subscription Platform** es la capa declarativa de arroba.com que responde a la pregunta canónica:

> "Dado un `subject` (user u org) y un `active_org_id` activo, ¿qué **plan** tiene, qué **productos** habilita, qué **cuotas/créditos** quedan disponibles y bajo qué **política de overage**?"

Subscription **NO**:
- Cobra (eso es Billing).
- Conoce Stripe (eso es Billing).
- Emite facturas (eso es Billing).
- Decide si una identidad puede hacer una acción **por rol/permiso** (eso es Authorization).

Subscription **SÍ**:
- Resuelve el plan vigente del subject en el contexto de su `active_org_id`.
- Mantiene el ledger inmutable de consumos por bucket de créditos.
- Aplica políticas de overage (strict/soft/metered) según criticidad.
- Emite eventos económicos (`subscription.overage.confirmed`, `subscription.renewal.processed`) que Billing consume.
- Expone el `PlanClaim` que Authorization y la capa de producto consultan.

### 1.2 Posición canónica: 4ª capa de las 5

```
Authentication ⇄ Identity ⇄ Authorization ⇄ Subscription ⇄ Billing
                                                  ▲
                                                  │ 4ª capa
                                                  │ Consume Identity (claims) + Authorization (decisiones)
                                                  │ Emite eventos económicos a Billing
```

**Direccionalidad de los claims**:
- **Recibe** (de Identity): `user_id`, `active_org_id`, `memberships[]`, `kyc_status`, `risk_score`, `identity_tier`, `fiscal_entity_id` (forward), `arroba_team_flag`.
- **Recibe** (de Authorization): para acciones gated, la `Decision` ya emitida (`permit` previo a consumir cuota).
- **Produce**: `PlanClaim` consumible por Authorization (vía claim joiner) y por la capa de producto (vía endpoint `me/plan`).
- **Emite a Billing**: `subscription.overage.confirmed`, `subscription.renewal.processed`, eventos de cambio de plan que requieran prorrateo/refund/charge.

### 1.3 Qué NO cubre este spec

- 🚫 **Stripe / pasarelas de pago / customer balance**: cubierto en `BILLING_SPEC.md`.
- 🚫 **Facturación electrónica española (Verifactu/SII)**: forward, en `BILLING_SPEC.md`.
- 🚫 **Cálculo de IVA / reverse charge**: en `BILLING_SPEC.md`.
- 🚫 **Pricing concreto** (cuántos euros cuesta un plan): pertenece a `MONETIZATION_SPEC` (capa estratégica) y a Billing (cálculo efectivo).
- 🚫 **Catálogo de productos comerciales P01-P12**: declarado en `MONETIZATION_SPEC §4`; este spec lo referencia, no lo redefine.
- 🚫 **Permisos**: si un user puede o no realizar una acción es responsabilidad de Authorization. Subscription solo gestiona elegibilidad por plan + cuota.
- 🚫 **Risk score** (cómo se calcula): forward dependency Risk & Compliance Service. Subscription **consume** el claim, no lo origina.

### 1.4 Relación con AUTHORIZATION_SPEC

| Authorization (capa 3) provee | Subscription (capa 4) consume |
|---|---|
| `Decision { effect: permit | deny, ... }` para acciones gated | Solo procede a `consume_quota` si Authorization permitió |
| `criticality_of_triggering_action` en contexto de evaluación | Determina política de overage (D4) |
| Eventos `authz.decision.permitted` | Trigger interno para verificar quota cuando la acción consume crédito |

| Subscription (capa 4) provee | Authorization (capa 3) consume |
|---|---|
| `PlanClaim { plan_key, plan_tier, entitlements[], buckets, in_overage, overage_policy }` | Atributos ABAC: `{{subject.plan_key}}`, `{{subject.plan_tier}}`, `{{subject.in_overage}}`, `{{subject.entitlements}}` |
| Evento `subscription.plan_changed` | Invalidación de caché de decisiones |
| Evento `subscription.overage.confirmed` | Audit + invalidación de claim cache |

### 1.5 Relación con MONETIZATION_SPEC (Sprint 0)

`MONETIZATION_SPEC.md v1.1.0` (capa 4 estratégica) declara:
- **12 productos comerciales** P01-P12 (lista canónica de qué se monetiza).
- **5 mecanismos económicos** M01-M05 (créditos, suscripciones, finder fee, success fee, advisory share).
- **7 planes** (Anonymous, Subscriber, Corporate, Investor, Advisor, `arroba_team`, Admin).

Este spec **operacionaliza** ese catálogo:
- Implementa el almacenamiento Mongo de planes (configurables, D-S.1).
- Implementa el ledger de créditos (D-S.2, D-S.4).
- Define las políticas de overage (D-S.3, D4).
- Provee el `PlanClaim`.

Cualquier conflicto entre este spec y MONETIZATION → **gana MONETIZATION** (es la fuente estratégica). Este spec solo implementa.

---

## 2. Glosario

| Término | Definición canónica |
|---|---|
| **Plan** | Configuración declarativa de un nivel de servicio: créditos incluidos por bucket, productos habilitados, cuotas no-de-crédito, política de overage, reglas de elegibilidad. Vive en colección `plans` (Mongo), seeded desde YAML al deploy. |
| **Plan Tier** | Entero canónico comparable entre planes (Anonymous=0, Subscriber=1, Corporate=3, etc.). Permite expresar "plan corporate+" como `plan_tier >= 3`. |
| **Subscription** | Instancia activa de un Plan asociada a un subject (`user` u `org`). Vive en colección `subscriptions`. Una `subscription` activa por subject. |
| **Quota** | Límite de uso. Dos clases canónicas: (a) **créditos** (multi-bucket, consumibles, restauran en renewal); (b) **límites operacionales** (`operations_active_max`, `data_rooms_max`, `seats_max`). |
| **Credit (bucket)** | Unidad consumible tipada. 5 buckets canónicos: `valuation`, `matching`, `analysis`, `signal`, `recommendation` (D-S.4). |
| **BucketLedger** | Colección inmutable de eventos de crédito (`grant`, `consume`, `refund`, `expire`, `rollover`, `overage_add`). Fuente de verdad. |
| **Bucket Balance** | Caché agregada del ledger por (subscription, bucket). NO fuente de verdad; reconstruible. |
| **Overage** | Consumo más allá del balance. Política configurable por plan: `strict` | `soft` | `metered` (D-S.3). |
| **Entitlement** | Producto/capability habilitado por un plan. Lista de strings (e.g., `["P01", "P02", "P04", "CAP-005", "CAP-018"]`). Forma derivada del plan + grants administrativos. |
| **PlanClaim** | Snapshot canónico del estado de subscription que viaja a Authorization y a la capa de producto. Definido en §5. |
| **Plan Eligibility** | Conjunto de condiciones que un subject debe cumplir para activar un plan: KYC, plan_tier mínimo, risk_score, etc. (Plan + Permisos + Riesgo del Sprint 0). |
| **Plan Change Event** | Mutación atómica de subscription (`plan_changed`) con auditoría, política de carryover de créditos, y evento económico a Billing si aplica. |
| **Hard Gate** | Bloqueo absoluto: la acción NO se ejecuta. Usado para acciones legales/económicas críticas sin entitlement o sin KYC. |
| **Soft Gate** | Ejecución degradada: la acción se ejecuta con respuesta reducida (modo L1). Usado para acciones de exploración. |
| **Plan Resolution** | Algoritmo que, dado `(user_id, active_org_id)`, determina qué subscription aplica. Detallado en §5.3. |
| **Renewal** | Transición canónica de subscription al siguiente período: refresca créditos, registra prorrateos, emite eventos. |
| **Rollover** | Política opcional por bucket: créditos no consumidos pasan al siguiente período (con cap). |
| **Carryover Policy** | Cómo se tratan créditos restantes al cambiar de plan (upgrade/downgrade). Configurable. |
| **Starter Subscription** | Subscription creada automáticamente al primer login post-migración para users sin plan resuelto. Plan `subscriber` con créditos iniciales (§8). |
| **`unlimited` (sentinel)** | Valor canónico string `"unlimited"` para indicar que un bucket no tiene cap (uso interno para `arroba_team`/`admin`). |

---

## 3. Principios canónicos

> Invariantes del Subscription Engine. Cualquier evolución debe respetarlos o producir bump mayor con justificación documentada.

### P-S.0 — Separación canónica de 5 capas

```
Authentication ⇄ Identity ⇄ Authorization ⇄ Subscription ⇄ Billing
```

Subscription es **la 4ª capa**:
- **Consume** claims de Identity y decisiones de Authorization.
- **Es consumida por** Billing (vía eventos económicos) y por Authorization (vía `PlanClaim`).
- **No conoce** Stripe ni pasarelas de pago.

### P-S.1 — Subscription consume Authorization, no al revés

Una acción gated atraviesa Authorization **antes** de Subscription. Subscription solo se invoca para acciones **ya autorizadas** por rol/policy/ACL.

**Excepción canónica**: Authorization puede consultar atributos del `PlanClaim` (`plan_key`, `plan_tier`, `entitlements`, `in_overage`) en sus policies como **input ABAC**. Esto es un patrón de **consulta** (read-only), no un acoplamiento estructural.

### P-S.2 — Subscription NO conoce Stripe

Cualquier referencia a Stripe, pasarelas de pago, customer IDs externos, payment methods, invoice IDs, **NO** vive aquí. Vive en `BILLING_SPEC.md`.

Subscription emite **eventos económicos** declarativos (`{kind, amount, currency, reason, correlation_id}`) que Billing consume y traduce a operaciones Stripe.

### P-S.3 — Planes son datos (no código)

Los planes viven en colección `plans` (Mongo). Se cargan al primer deploy desde YAML seed (`/app/backend/plans_seed/*.yaml`). Después, mutaciones se hacen vía API admin con `audit_reason`. **Cero hardcoding** de planes en código (decisión D-S.1).

**Consecuencia**: `admin` puede crear/modificar planes en runtime sin redeploy. Los cambios disparan eventos `plan.created` / `plan.updated` que invalidan caches.

### P-S.4 — Quotas declarativas y multi-bucket (D-S.4)

Los créditos son **multi-bucket** (`valuation`, `matching`, `analysis`, `signal`, `recommendation`). Cada bucket tiene su propio balance, su propia política de overage, su propia política de rollover.

**Razón canónica**: un user que consumió todos sus créditos de `matching` puede seguir usando `analysis` sin bloqueo. Un balance único enmascararía la realidad de coste.

Para añadir un nuevo bucket: bump menor del spec + migración. Los buckets son un **catálogo cerrado**, no extensible por config.

### P-S.5 — Ledger inmutable es fuente de verdad

Cada movimiento de crédito (`grant`, `consume`, `refund`, `expire`, `rollover`, `overage_add`) es una entrada **inmutable** en `bucket_ledger`. Nunca se actualizan entradas existentes. Las correcciones son entradas nuevas con `correlation_id` al original.

`bucket_balances` es **caché** reconstruible. Si hay discrepancia entre ledger y balance, **gana el ledger** y el balance se recomputa.

### P-S.6 — Plan + Permisos + Riesgo (Sprint 0)

La elegibilidad para una acción **no depende solo del plan**. Es un compuesto canónico:

```
allowed = Authorization.permit
       AND Subscription.has_entitlement(plan, product)
       AND Subscription.has_quota(bucket, amount)
       AND Subscription.passes_eligibility(plan, kyc_status, risk_score)
```

Si cualquiera falla, la acción se rechaza. La política de cómo se rechaza (hard vs soft gate) depende de la **criticidad** de la acción (P-S.7).

### P-S.7 — Hard gate vs soft gate por criticidad (D-S.5, D4 Sprint 0)

| Criticidad de la acción | Comportamiento sin entitlement | Comportamiento sin quota |
|---|---|---|
| Baja | Soft gate (respuesta degradada L1) | Soft gate (degradado + ledger) |
| Media | Soft gate | Soft gate |
| Alta | Hard gate | Confirmación overage requerida |
| Crítica | Hard gate | Hard gate |

La criticidad es atributo de la action (definida por la capa de producto) y viaja en el contexto.

### P-S.8 — Forward-compatible para multi-fiscal-entity

El schema declara `forward_compat.fiscal_entity_scope` en `plans` y `fiscal_entity_id` opcional en `subscriptions`. En v1.0 ambos son constantes (`primary_only` / `null`). Cuando se materialicen `fiscal_entities` (IDENTITY_SPEC §19), Subscription soportará planes por entidad fiscal sin migración estructural.

### P-S.9 — Forward-compatible para permisos temporales

Los `entitlements` declaran `valid_from` / `valid_until` opcionales (default `null`). Alineado con AUTHORIZATION_SPEC §21.

### P-S.10 — Aislamiento Mongo lógico estricto (D10 Sprint 0)

Las colecciones de Subscription viven en Mongo compartido. Toda query crítica filtra por `subject_id` y, cuando aplique, por `org_id`. Cross-tenant queries solo permitidas a `admin` con `audit_reason`.

### P-S.11 — `arroba_team` y `admin` con créditos ilimitados (sentinel)

Para `arroba_team` y `admin`, los buckets contienen sentinel `"unlimited"`. El motor reconoce este valor y **siempre** devuelve `permitted=true` en `has_quota`. NO se persisten entradas `consume` para estos roles en el ledger (evita inflar).

**Razón canónica**: estos roles operan en mediación o sistema; sus consumos no son comerciales y no deben distorsionar métricas.

### P-S.12 — Renewals son atómicas y auditadas

Cada transición de período de subscription es **atómica**: grant del nuevo período + expire/rollover del anterior en una única operación lógica (idempotente). Audit obligatorio.

---

## 4. Modelo de datos canónico (Mongo)

### 4.1 `plans` — configuración declarativa de planes (D-S.1)

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | ObjectId | sí | auto | — |
| `plan_key` | `str` | sí | — | unique, slug; ∈ catálogo `{anonymous, subscriber, corporate, investor, advisor, arroba_team, admin}` en v1.0 |
| `plan_tier` | `int` | sí | — | comparable entre planes; canónico: anonymous=0, subscriber=1, corporate=3, investor=3, advisor=3, arroba_team=8, admin=9 |
| `name` | `str` | sí | — | display name |
| `description` | `str` | no | `null` | — |
| `status` | enum | sí | `"active"` | `"active"` \| `"deprecated"` |
| `version` | `int` | sí | `1` | bumped on update |
| `billing_period_months` | `int \| null` | sí | — | `1` (mensual), `12` (anual), `null` (pay-as-you-go o sin recurrencia) |
| `included_credits` | `dict` | sí | `{}` | mapping `bucket -> int | "unlimited"`; e.g., `{valuation: 50, matching: 20, ...}` |
| `included_products` | `list[str]` | sí | `[]` | productos del catálogo MONETIZATION_SPEC (P01..P12) + capabilities (CAP-XXX) |
| `overage_policy` | enum | sí | `"strict"` | `"strict"` \| `"soft"` \| `"metered"` (D-S.3) |
| `overage_rules_by_bucket` | `dict` | no | `{}` | override por bucket: `{matching: "metered", analysis: "soft"}` |
| `default_max_authorization_days` | `int` | sí | `30` | tope L4 (decisión F6 Sprint 0 para Subscriber=30; Corporate=90; etc.) |
| `seats_max` | `int \| "unlimited"` | sí | — | usuarios máximos en la org (si aplica) |
| `quotas` | `dict` | sí | `{}` | operaciones no-de-crédito: `{operations_active_max, data_rooms_max, invitations_per_month, mandates_active_max, ...}` |
| `rollover_policy` | `dict` | sí | `{}` | por bucket: `{matching: {enabled: true, cap_months: 1}}` |
| `eligibility_rules` | `dict` | sí | `{}` | ver §4.1.1 |
| `forward_compat` | `dict` | sí | `{fiscal_entity_scope: "primary_only"}` | reservado |
| `created_at` | datetime | sí | now() | — |
| `updated_at` | datetime | sí | now() | — |
| `audit_reason` | `str` | sí | — | razón obligatoria al crear/actualizar |

**Índices**: `plan_key` unique, `status`, `plan_tier`.

#### 4.1.1 `eligibility_rules` shape

```yaml
eligibility_rules:
  base:                                  # condiciones para activar el plan
    kyc_required: false                  # default Subscriber no exige KYC
    risk_score_max: 100                  # no restricción
    identity_tier_in: ["internal"]       # forward; v1.0 noop
  
  for_critical_products:                 # condiciones extra para productos críticos
    products: ["P03", "P05", "P09"]      # del catálogo MONETIZATION
    kyc_required: true
    risk_score_max: 50
    membership_role_min: "admin"
  
  for_arroba_team_only: false            # bandera para planes internos
```

#### 4.1.2 Ejemplo canónico — Plan Corporate

```yaml
plan_key: corporate
plan_tier: 3
name: "Corporate"
description: "Para empresas con mandatos M&A activos."
status: active
version: 1
billing_period_months: 12

included_credits:
  valuation: 50
  matching: 20
  analysis: 100
  signal: 200
  recommendation: 50

included_products:
  - P01    # valoración pública
  - P02    # valoración interna
  - P04    # búsqueda básica
  - P05    # marketplace de oportunidades
  - P07    # signals canónicos
  - CAP-005
  - CAP-018

overage_policy: metered
overage_rules_by_bucket:
  matching: metered
  valuation: confirmed_charge

default_max_authorization_days: 90

seats_max: 10
quotas:
  operations_active_max: 3
  data_rooms_max: 5
  invitations_per_month: 50
  mandates_active_max: 5

rollover_policy:
  analysis: { enabled: true, cap_months: 1 }

eligibility_rules:
  base:
    kyc_required: false
    risk_score_max: 100
  for_critical_products:
    products: [P03, P09]
    kyc_required: true
    risk_score_max: 50

forward_compat:
  fiscal_entity_scope: primary_only

audit_reason: "Initial seed v1.0"
```

### 4.2 `subscriptions` — instancia activa por subject

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | ObjectId | sí | auto | — |
| `subscription_id` | `str` (`sub_`) | sí | autogen | unique |
| `plan_key` | `str` | sí | — | FK a `plans.plan_key` |
| `plan_version_at_start` | `int` | sí | — | versión del plan al activar (para mantener términos si plan se actualiza) |
| `subject_type` | enum | sí | — | `"user"` \| `"org"` |
| `subject_id` | `str` | sí | — | `user_id` o `org_id` según `subject_type` |
| `fiscal_entity_id` | `str \| null` | sí | `null` | (forward IDENTITY_SPEC §19) v1.0 siempre `null` |
| `status` | enum | sí | — | `"active"` \| `"trialing"` \| `"paused"` \| `"cancelled"` \| `"expired"` |
| `started_at` | datetime | sí | now() | — |
| `expires_at` | datetime \| `null` | no | calculado | `null` para planes sin recurrencia o `unlimited` |
| `cancelled_at` | datetime \| `null` | no | `null` | — |
| `cancelled_by` | user_id \| `null` | no | `null` | — |
| `auto_renew` | bool | sí | `true` | — |
| `current_period_start` | datetime | sí | started_at | actualizado en cada renewal |
| `current_period_end` | datetime | sí | started_at + period | — |
| `seats_used` | `int` | sí | `1` | cached, recomputado |
| `in_overage` | bool | sí | `false` | derivado de balances, recomputado al consume |
| `metadata` | `dict` | sí | `{}` | extensión libre (no interpretada por motor) |
| `created_at` | datetime | sí | now() | — |
| `updated_at` | datetime | sí | now() | — |

**Índices**:
- `subscription_id` unique.
- `(subject_type, subject_id, status)` compuesto; **unique parcial** donde `status ∈ {active, trialing, paused}` (una sola activa por subject).
- `plan_key`.
- `current_period_end` (para cron de renewal).

**Validaciones**:
- Una sola subscription en estado no-terminal por `(subject_type, subject_id)`.
- Si `subject_type = "user"` y el user pertenece a una org con subscription activa, el `PlanClaim` resuelto prioriza la subscription **de la org activa** (ver §5.3). La subscription del user persiste para casos sin org activa.
- `cancelled_at` requerido si `status = "cancelled"`.
- `plan_key` debe existir en `plans` y tener `status = "active"` al momento de crear (NO al consultar; subscriptions sobre planes deprecated siguen activas).

**Eventos**: `subscription.created`, `subscription.activated`, `subscription.paused`, `subscription.resumed`, `subscription.cancelled`, `subscription.expired`, `subscription.plan_changed`.

### 4.3 `bucket_ledger` — ledger inmutable (D-S.2)

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | ObjectId | sí | auto | — |
| `ledger_id` | `str` (`led_`) | sí | autogen | unique |
| `subscription_id` | `str` | sí | — | FK |
| `subject_type`, `subject_id` | denormalized | sí | — | desde subscription, para queries rápidas |
| `bucket` | enum | sí | — | `valuation` \| `matching` \| `analysis` \| `signal` \| `recommendation` |
| `entry_type` | enum | sí | — | `grant` \| `consume` \| `refund` \| `expire` \| `rollover` \| `overage_add` \| `manual_adjustment` |
| `delta` | `int` | sí | — | positivo para grant/refund/rollover/overage_add; negativo para consume/expire |
| `balance_after` | `int` | sí | — | snapshot post-aplicación (redundante; permite verificación) |
| `reason` | `str` | sí | — | humano-legible |
| `correlation_id` | `str` | no | `null` | request_id / action_id / period_id que originó el movimiento |
| `triggered_by` | enum | sí | — | `"user"` \| `"system_renewal"` \| `"system_expire"` \| `"admin"` \| `"arroba_team"` |
| `triggered_by_user_id` | user_id \| `null` | no | `null` | si `triggered_by ∈ {admin, arroba_team}` |
| `audit_reason` | `str \| null` | no | `null` | obligatorio si triggered_by ∈ {admin, arroba_team, manual_adjustment} |
| `created_at` | datetime | sí | now() | indexado |

**Índices**:
- `ledger_id` unique.
- `(subscription_id, bucket, created_at desc)` (para reconstruir balance).
- `(subject_id, bucket, created_at desc)`.
- `(entry_type, created_at desc)`.

**Reglas canónicas**:
- **Inmutable**: NO se permiten `UPDATE` ni `DELETE`. Las correcciones son entradas nuevas con `entry_type = "manual_adjustment"` y `correlation_id` al original.
- `balance_after` debe ser ≥ 0 si `overage_policy = "strict"`. Si la política permite overage, puede ser negativo temporalmente.
- Toda escritura emite evento `subscription.bucket.{entry_type}`.

### 4.4 `bucket_balances` — caché reconstruible

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | ObjectId | sí | auto | — |
| `subscription_id` | `str` | sí | — | FK |
| `subject_id`, `subject_type` | denormalized | sí | — | — |
| `bucket` | enum | sí | — | (5 valores canónicos) |
| `balance_current` | `int` | sí | `0` | puede ser negativo si overage |
| `hard_limit` | `int \| "unlimited"` | sí | — | desde plan.included_credits |
| `last_ledger_id` | `str \| null` | sí | `null` | último entry computado |
| `recalculated_at` | datetime | sí | now() | — |
| `in_overage` | bool | sí | `false` | true si `balance_current < 0` |

**Índices**:
- `(subscription_id, bucket)` unique.
- `(subject_id, bucket)`.

**Política**:
- Recomputado **al instante** en cada consume (post-write al ledger).
- Job background cada 1h verifica consistencia: si `balance_current ≠ sum(ledger deltas)`, alerta + recompute forzado.
- Si la caché se corrompe (e.g., race condition), drop y reconstruir en próximo read.

### 4.5 `entitlements` — productos habilitados por subscription

| Campo | Tipo | Req. | Default | Constraint |
|---|---|---|---|---|
| `_id` | ObjectId | sí | auto | — |
| `entitlement_id` | `str` (`ent_`) | sí | autogen | unique |
| `subscription_id` | `str` | sí | — | FK |
| `entitlement_key` | `str` | sí | — | producto (P01..P12) o capability (CAP-XXX) |
| `granted_by` | enum | sí | — | `"plan_default"` \| `"manual_admin"` \| `"promo"` |
| `granted_at` | datetime | sí | now() | — |
| `granted_by_user_id` | user_id \| `null` | no | `null` | si `granted_by = manual_admin` |
| `valid_from` | datetime \| `null` | no | `null` | (forward-compatible §21 AUTHZ) |
| `valid_until` | datetime \| `null` | no | `null` | (forward-compatible §21 AUTHZ) |
| `status` | enum | sí | `"active"` | `"active"` \| `"revoked"` |
| `revoked_at` | datetime \| `null` | no | `null` | — |
| `revoked_by_user_id` | user_id \| `null` | no | `null` | — |
| `audit_reason` | `str \| null` | no | `null` | obligatorio si `granted_by = manual_admin` |

**Índices**:
- `entitlement_id` unique.
- `(subscription_id, entitlement_key, status)` compuesto.
- `valid_until` (cron de expiración).

**Reglas**:
- Entitlements `plan_default` se materializan al crear/cambiar plan (snapshot del `plan.included_products`).
- Entitlements `manual_admin` requieren `admin` o `arroba_team` + `audit_reason`.
- Revocación: soft (no DELETE), con `revoked_at` y `audit_reason`.

### 4.6 `plan_change_events` — historial de cambios de plan

| Campo | Tipo | Req. | Default |
|---|---|---|---|
| `_id` | ObjectId | sí | auto |
| `event_id` | `str` (`pce_`) | sí | autogen |
| `subscription_id` | `str` | sí | — |
| `old_plan_key` | `str` | sí | — |
| `old_plan_version` | `int` | sí | — |
| `new_plan_key` | `str` | sí | — |
| `new_plan_version` | `int` | sí | — |
| `reason` | `str` | sí | — |
| `triggered_by` | enum | sí | — `"user"` \| `"admin"` \| `"arroba_team"` \| `"system_renewal"` \| `"system_overage_upgrade"` |
| `triggered_by_user_id` | user_id \| `null` | no | `null` |
| `effective_at` | datetime | sí | now() |
| `previous_period_end` | datetime \| `null` | no | `null` |
| `credit_carryover_policy_applied` | `dict` | sí | `{}` |
| `economic_event_id_to_billing` | `str \| null` | no | `null` (forward) |
| `audit_trail` | `list[dict]` | sí | `[]` |
| `created_at` | datetime | sí | now() |

**Carryover policies canónicas** (en `credit_carryover_policy_applied`):

| Tipo cambio | Política canónica |
|---|---|
| Upgrade (tier mayor) | Buckets restantes del plan anterior se mantienen + grants nuevos del nuevo plan. |
| Downgrade (tier menor) | Buckets restantes capped al nuevo `hard_limit`; excedente se marca `expire` con `reason="downgrade_excess"`. |
| Cambio entre planes de mismo tier | Buckets restantes se mantienen; nuevos grants según diferencias. |
| Cancelación | Buckets restantes se mantienen hasta `current_period_end`; al expirar, `entry_type=expire`. |

### 4.7 `overage_events` — instancias de overage detectado

| Campo | Tipo | Req. | Default |
|---|---|---|---|
| `_id` | ObjectId | sí | auto |
| `overage_id` | `str` (`ovr_`) | sí | autogen |
| `subscription_id` | `str` | sí | — |
| `bucket` | enum | sí | — |
| `amount_overaged` | `int` | sí | — (positivo) |
| `criticality_of_triggering_action` | enum | sí | — `"baja"` \| `"media"` \| `"alta"` \| `"critica"` |
| `triggering_action` | `str` | sí | — (e.g., `"capability.invoke.CAP-005"`) |
| `triggering_resource` | `dict` | no | `null` |
| `policy_applied` | enum | sí | — `"degraded_to_L1"` \| `"confirmed_charge"` \| `"upgrade_required"` \| `"blocked"` |
| `user_response` | enum \| `null` | no | `null` | `"confirmed"` \| `"upgraded"` \| `"declined"` \| `"pending"` |
| `user_responded_at` | datetime \| `null` | no | `null` |
| `economic_event_id_to_billing` | `str \| null` | no | `null` (forward) |
| `correlation_id` | `str` | sí | — | request id |
| `created_at` | datetime | sí | now() |
| `resolved_at` | datetime \| `null` | no | `null` |

**Índices**: `(subscription_id, created_at desc)`, `(subscription_id, user_response, created_at desc)`, `policy_applied`.

---

## 5. `PlanClaim` — el contrato canónico de Subscription hacia arriba

### 5.1 Shape canónico (resuelve laguna 1)

```yaml
plan_claim:
  # Metadatos de resolución
  claim_version: "1.0"
  resolved_at: "2026-06-25T10:30:00Z"
  source:
    subject_type: "user" | "org"
    subject_id: "user_xxxx" | "org_xxxx"
    active_org_id: "org_xxxx" | null     # contexto actual (per-device, IDENTITY_SPEC §6)
  
  # Plan vigente
  subscription_id: "sub_xxxx"
  plan_key: "corporate"
  plan_tier: 3
  plan_version_at_start: 1
  
  # Productos habilitados
  entitlements: ["P01", "P02", "P04", "P05", "P07", "CAP-005", "CAP-018"]
  
  # Estado de cuotas
  buckets:
    valuation:
      balance: 23                          # actual; puede ser negativo si overage
      hard_limit: 50                       # del plan; "unlimited" para arroba_team/admin
      in_overage: false
    matching:
      balance: 0
      hard_limit: 20
      in_overage: false
    analysis:
      balance: 87
      hard_limit: 100
      in_overage: false
    signal:
      balance: 195
      hard_limit: 200
      in_overage: false
    recommendation:
      balance: 48
      hard_limit: 50
      in_overage: false
  
  # Política
  in_overage: false                        # OR de todos los buckets
  overage_policy: "metered"
  overage_rules_by_bucket:
    matching: "metered"
    valuation: "confirmed_charge"
  
  # Quotas operacionales (no-créditos)
  quotas:
    operations_active_max: 3
    operations_active_used: 1
    data_rooms_max: 5
    data_rooms_used: 0
    invitations_per_month_max: 50
    invitations_used_this_month: 12
  
  # Elegibilidad para productos críticos
  eligibility_critical:
    products: ["P03", "P09"]
    kyc_required: true
    risk_score_max: 50
    current_kyc_status: "verified"
    current_risk_score: 12
    eligible_for_critical: true
  
  # Authorization ABAC inputs derivados (espejo conveniente)
  abac_hints:
    plan_key: "corporate"
    plan_tier: 3
    plan_tier_at_least_corporate: true
    in_overage: false
    entitlements_set: ["P01", "P02", ...]   # alias para policies que usan `entitlement IN ...`
  
  # Vencimiento
  subscription_expires_at: "2027-06-25T00:00:00Z"
  current_period_end: "2026-07-25T00:00:00Z"
  
  # Cache hint
  claim_cached_ttl_seconds: 300            # 5 minutos (ver §5.4)
  claim_expires_at: "2026-06-25T10:35:00Z"
  
  # Forward
  forward:
    fiscal_entity_id: null                 # (IDENTITY_SPEC §19) v1.0 siempre null
    fiscal_entity_scope: "primary_only"
```

### 5.2 Granularidad (resuelve laguna 3)

**Algoritmo canónico de Plan Resolution**:

```python
def resolve_plan_claim(user_id, active_org_id, request_context):
    """
    Decide qué subscription aplica al subject en este contexto.
    """
    # Caso 1: contexto de org activa
    if active_org_id is not None:
        # Verificar membership activa
        membership = identity.member_role(user_id, active_org_id)
        if membership is None or membership.status != "active":
            # User no es miembro activo de esta org; fallback a su subscription personal
            return resolve_plan_claim(user_id, active_org_id=None, request_context=request_context)
        
        # La org tiene su propia subscription
        org_sub = subscriptions.find(subject_type="org", subject_id=active_org_id, status_active)
        if org_sub is not None:
            return build_plan_claim(org_sub, source_org=active_org_id)
        
        # La org NO tiene subscription propia (raro); fallback a subscription del user
        # (e.g., user creó la org pero no asignó plan; queda en starter)
    
    # Caso 2: sin org activa o fallback
    user_sub = subscriptions.find(subject_type="user", subject_id=user_id, status_active)
    if user_sub is not None:
        return build_plan_claim(user_sub, source_user=user_id)
    
    # Caso 3: ninguno (anómalo) — crear starter
    user_sub = create_starter_subscription(user_id)
    return build_plan_claim(user_sub, source_user=user_id)
```

**Reglas canónicas**:
- **Default**: subscription por org cuando el subject actúa en contexto de org.
- **Multi-org**: el `active_org_id` (per-device, IDENTITY_SPEC §6) determina qué subscription aplica.
- **Sin org activa**: subscription del user (típicamente Subscriber individual o Investor independiente).
- **Advisor multi-cliente**: cada cliente (org) tiene su propia subscription; el Advisor (user) puede tener su propia subscription Advisor además. Cuando el Advisor opera "en su consultoría" (active_org_id = su firma), aplica subscription de su firma. Cuando opera "en cliente X" (active_org_id = X), aplica subscription de X. Si la firma del Advisor consume créditos del cliente X (firma del Advisor mediando), se registra contra la subscription del cliente X con `triggered_by_user_id = advisor`.

### 5.3 Inyección en JWT (resuelve laguna 2)

**Decisión canónica v1.0**: **lazy con cache TTL 5 minutos**.

Motivación:
- El JWT lleva `subject_id`, `active_org_id` y `arroba_team_flag` (claims de Identity).
- **NO** lleva el `PlanClaim` completo (puede cambiar mid-session por consumo de cuota, overage, plan change).
- Authorization, cuando una policy consulta `{{subject.plan_key}}` o similar, invoca internamente `subscription.get_plan_claim(user_id, active_org_id)`.

**Caché compartida**:
- Authorization mantiene una caché in-memory de `PlanClaim` por `(user_id, active_org_id)` con TTL 300s.
- Subscription emite eventos invalidadores: `subscription.plan_changed`, `subscription.activated`, `subscription.paused`, `subscription.overage.confirmed`, `subscription.bucket.consumed` (solo si el bucket cambió `in_overage`).
- Authorization se suscribe a estos eventos y purga su caché por subject afectado.

**Alternativa rechazada**: incluir `plan_key + plan_tier` en JWT con re-firma en `plan.change`. Rechazada porque:
- Requiere coordinación cross-capa más estrecha.
- El claim de buckets necesariamente queda fuera del JWT (cambia muy a menudo).
- La complejidad de tener dos fuentes (JWT parcial + lazy lookup completo) no compensa.

**Optimización futura (forward, NO v1.0)**: cuando el volumen lo justifique, replicar cache vía Redis pub/sub entre réplicas.

### 5.4 Cache lifecycle

```
[T0] Authorization request → resuelve PlanClaim para (user, active_org)
  ├─ Cache miss → Subscription engine resuelve y guarda (TTL 300s)
  └─ Cache hit → reusa

[T0+200s] Subscription emite subscription.plan_changed
  ├─ Authorization cache: invalidate_by_subject(user_id)

[T0+250s] Nueva request → cache miss → resuelve fresh

[T0+550s] Nueva request → cache miss (TTL expirado natural) → resuelve fresh
```

### 5.5 Entitlements como gating (resuelve laguna 4)

**Política canónica**:
- **Hard gate**: si el `entitlement_key` requerido para la acción NO está en `plan_claim.entitlements`, la acción retorna **403** con:
  - `reason_code: "deny_plan_insufficient"`
  - `missing_requirements: [{kind: "plan", expected: "plan_with_entitlement_X", current: <plan_key>, fix_hint: "upgrade_plan"}]`
- **Soft gate**: NO se aplica para entitlements. Los soft gates solo aplican a **quotas** (cuando hay entitlement pero falta crédito).

**Razón**: un entitlement representa "este producto está habilitado en mi plan". Si no lo está, la respuesta degradada no tiene sentido (el producto no existe en el plan).

### 5.6 Contrato `subscription.has_quota` (resuelve laguna 5)

```python
def has_quota(
    subject_id: str,
    bucket: Literal["valuation","matching","analysis","signal","recommendation"],
    amount: int = 1,
    active_org_id: str | None = None,
    criticality: Literal["baja","media","alta","critica"] = "media",
) -> QuotaCheck:
    """
    Devuelve QuotaCheck:
      permitted: bool
      balance_after_if_consumed: int      # puede ser negativo si overage permitido
      in_overage: bool                     # estado resultante
      overage_policy: str                  # strict | soft | metered
      policy_to_apply: str                 # degraded_to_L1 | confirmed_charge | blocked | proceed
      missing_requirements: list           # rellenado si NO permitted
    """
```

**Lógica canónica**:

```python
plan_claim = resolve_plan_claim(subject_id, active_org_id)
bucket_state = plan_claim.buckets[bucket]
hard_limit = bucket_state.hard_limit

if hard_limit == "unlimited":
    return QuotaCheck(permitted=True, ..., policy_to_apply="proceed")

new_balance = bucket_state.balance - amount

if new_balance >= 0:
    return QuotaCheck(permitted=True, balance_after_if_consumed=new_balance,
                      in_overage=False, policy_to_apply="proceed")

# Going into overage
overage_policy = plan_claim.overage_rules_by_bucket.get(bucket) or plan_claim.overage_policy

if overage_policy == "strict":
    return QuotaCheck(permitted=False, policy_to_apply="blocked",
                      missing_requirements=[{kind:"plan", expected: f"more_credits:{bucket}"}])

# soft o metered → criticidad decide
if criticality in ("baja", "media"):
    return QuotaCheck(permitted=True, balance_after_if_consumed=new_balance,
                      in_overage=True, overage_policy=overage_policy,
                      policy_to_apply="degraded_to_L1")
elif criticality == "alta":
    return QuotaCheck(permitted=False,  # requiere confirmación user
                      policy_to_apply="confirmed_charge",
                      missing_requirements=[{kind:"plan", expected:"user_confirmation_for_overage"}])
elif criticality == "critica":
    return QuotaCheck(permitted=False, policy_to_apply="blocked",
                      missing_requirements=[{kind:"plan", expected:"upgrade_required"}])
```

`consume_quota(...)` se invoca DESPUÉS de `has_quota(...)` cuando la acción se ejecuta efectivamente. Persiste en `bucket_ledger`. Emite `subscription.bucket.consumed`. Si `in_overage = true` y `policy_applied = confirmed_charge`, espera respuesta del user (otro endpoint) antes de cobrar (forward Billing).

---

## 6. Política de cuotas, créditos y overage

### 6.1 Política de overage por criticidad (D-S.5, D4 Sprint 0)

| Criticidad | Sin entitlement (gating de producto) | Con entitlement, sin quota (overage) |
|---|---|---|
| **Baja** | Soft gate: ejecuta degradado L1; respuesta limitada; NO consume. | Soft gate: degradación L1; entrada `consume` en ledger con `reason="degraded_overage"`; sigue contando. |
| **Media** | Soft gate. | Soft gate igual que baja. |
| **Alta** | Hard gate: 403 + `missing_requirement: plan`. | Confirmación requerida: la acción NO se ejecuta; UX presenta CTA (confirmar charge o upgrade). |
| **Crítica** | Hard gate. | Hard gate: bloqueo total; UX presenta CTA upgrade. |

### 6.2 Atributos de policy disponibles (resuelve laguna 7)

Las policies de Authorization pueden referenciar:

```yaml
condition:
  all_of:
    - claim: "plan_key"
      in: ["corporate", "advisor", "investor"]
    - claim: "plan_tier"
      gte: 3
    - claim: "in_overage"
      eq: false
    - claim: "entitlements_set"
      contains: "P05"
```

Variables interpoladas:
- `{{subject.plan_key}}`
- `{{subject.plan_tier}}`
- `{{subject.in_overage}}`
- `{{subject.entitlements}}` (alias `entitlements_set` para policies con operador `contains`)
- `{{subject.subscription_id}}`
- `{{subject.current_period_end}}`

**Uso típico**: Authorization puede **denegar antes** de que Subscription verifique cuota, evitando work.

```yaml
policy_id: P-VALUATION-PREMIUM-001
description: "P02 (valoración interna premium) requiere plan_tier >= 3 y no estar en overage de valuation"
subject_match:
  role_global_in: [corporate, advisor, investor]
condition:
  all_of:
    - claim: plan_tier
      gte: 3
    - claim: entitlements_set
      contains: P02
action_match: [valuation.create_premium]
resource_match:
  type: company
effect: permit
```

### 6.3 Flow canónico de consumo de cuota

```
1. UX → POST /api/valuations/{cif}/run
2. Backend → Authorization.check("valuation.run", resource=company, claims)
3. Authorization OK (rol + entitlement P01 vía policy) → proceed
4. Backend → Subscription.has_quota(user, "valuation", amount=1, criticality="alta")
5a. Si permitted=true, policy_to_apply="proceed" → ejecutar acción
    └─ Subscription.consume_quota(...) → ledger entry → balance update
    └─ Evento subscription.bucket.consumed
    └─ Respuesta 200
5b. Si policy_to_apply="degraded_to_L1" → ejecutar versión degradada
    └─ Subscription.consume_quota(... reason="degraded_overage")
    └─ Evento subscription.overage.degraded
    └─ Respuesta 200 con flag {degraded: true}
5c. Si policy_to_apply="confirmed_charge" → no ejecutar; pedir confirmación
    └─ Crea overage_events { user_response: pending }
    └─ Evento subscription.overage.confirm_required
    └─ Respuesta 402 Payment Required + CTA
5d. Si policy_to_apply="blocked" → no ejecutar
    └─ Evento subscription.overage.blocked
    └─ Respuesta 402 + CTA upgrade
```

### 6.4 Confirmación de overage

```
1. UX → POST /api/subscription/me/overage/{overage_id}/confirm
2. Backend valida:
   - overage_id pertenece al user
   - user_response = pending
3. Subscription.consume_quota(... entry_type="overage_add", reason="user_confirmed")
4. Emit subscription.overage.confirmed { amount, bucket, correlation_id }
5. (Billing forward consumirá este evento para crear invoice item)
6. UX puede re-intentar la acción original → ahora has_quota retornará permitted=true
```

### 6.5 Rollover y renewal

**Rollover policy por bucket**:
```yaml
rollover_policy:
  analysis: { enabled: true, cap_months: 1 }    # créditos restantes pasan al siguiente período, capped 1 mes
  matching: { enabled: false }                   # créditos expiran al fin del período
```

**Algoritmo de renewal**:
```
1. Cron diario detecta subscriptions con current_period_end <= now y auto_renew=true.
2. Por cada bucket:
   a. balance_at_end = balance_current
   b. Si rollover.enabled:
        carryover = min(balance_at_end, plan.included_credits[bucket] * cap_months)
        Entry "rollover" amount=carryover (positivo) en ledger con reason="period_rollover"
        Entry "expire" amount=balance_at_end - carryover (negativo) con reason="period_expire"
      Else:
        Entry "expire" amount=balance_at_end (negativo)
   c. Entry "grant" amount=plan.included_credits[bucket] con reason="period_renewal"
3. Update subscription: current_period_start = now, current_period_end = now + period_months
4. Emit subscription.renewal.processed + subscription.bucket.granted (x5)
5. (Billing forward consumirá renewal.processed para emitir factura del período)
```

### 6.6 `arroba_team` y `admin` — créditos ilimitados

Cuando el subject tiene `role_global ∈ {arroba_team, admin}`:
- `PlanClaim.buckets[*].hard_limit = "unlimited"`.
- `PlanClaim.buckets[*].balance = 999_999_999` (sentinel para frontend).
- `has_quota` siempre retorna `permitted=true, policy_to_apply="proceed"`.
- **NO se persisten entradas** en `bucket_ledger` para estos roles (regla P-S.11).

Para auditar acciones de `arroba_team`, se usan los eventos de Authorization (`authz.decision.permitted`) + `identity_audit_log`, NO el ledger de créditos.

---

## 7. Orden canónico de evaluación end-to-end

> Pipeline canónica que **toda acción gated** atraviesa. Define la **secuencia obligatoria** y resuelve la **laguna 8** (KYC + Plan: orden de evaluación).

```
┌──────────────────────────────────────────────────────────────────────┐
│  ACCIÓN GATED — ej. POST /api/operations/{id}/loi/submit             │
└────────────────────────────┬─────────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PASO 1 — AUTHENTICATION (Identity §6)                               │
│  Validar token. Si inválido → 401 unauthenticated.                   │
└────────────────────────────┬─────────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PASO 2 — IDENTITY claims (Identity §6.4)                            │
│  Resolver: user_id, active_org_id, kyc_status, risk_score,           │
│  memberships, identity_tier, arroba_team_flag, etc.                  │
│  Si user.status != active → 403 deny_user_suspended.                 │
└────────────────────────────┬─────────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PASO 3 — AUTHORIZATION (motor §9)                                   │
│  Pre-flight gates: KYC, identity_tier.                               │
│  Policies + ACLs + deny-overrides.                                   │
│  Authorization puede consultar PlanClaim como ABAC input.            │
│  Si deny → 403 con explainability (Decision con missing_reqs).       │
└────────────────────────────┬─────────────────────────────────────────┘
                             ▼  permit
┌──────────────────────────────────────────────────────────────────────┐
│  PASO 4 — SUBSCRIPTION entitlement check (§5.5)                      │
│  Si la acción requiere entitlement X y plan_claim.entitlements no    │
│  lo incluye → 403 deny_plan_insufficient + missing_requirements.     │
└────────────────────────────┬─────────────────────────────────────────┘
                             ▼  entitled
┌──────────────────────────────────────────────────────────────────────┐
│  PASO 5 — SUBSCRIPTION quota check (§5.6)                            │
│  has_quota(subject, bucket, amount, criticality).                    │
│  Si permitted=false → 402 (overage flow) o 403 (strict block).       │
└────────────────────────────┬─────────────────────────────────────────┘
                             ▼  permitted
┌──────────────────────────────────────────────────────────────────────┐
│  PASO 6 — EJECUTAR la acción canónica                                │
│  El handler de producto invoca su lógica (Transaction OS, Memory,    │
│  Copilots, etc.).                                                    │
└────────────────────────────┬─────────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PASO 7 — SUBSCRIPTION consume_quota                                 │
│  Persistir entrada en bucket_ledger. Recompute balance.              │
│  Emit subscription.bucket.consumed.                                  │
└────────────────────────────┬─────────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PASO 8 — AUTHORIZATION audit Decision                                │
│  Persistir en authz_audit_log (con sampling 100% deny / 1% permit).  │
└────────────────────────────┬─────────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PASO 9 — BILLING emit economic event (si aplica)                    │
│  Si la acción genera economic_event (e.g., finder_fee al closing,    │
│  overage confirmado), Subscription emite a Billing (§12).            │
└──────────────────────────────────────────────────────────────────────┘
```

**Justificación del orden KYC → Plan** (resuelve laguna 8):
- KYC es **condición ABAC en Authorization** (paso 3). Si falta, deny **antes** de evaluar plan/cuota. Razón: si el subject no puede legalmente realizar la acción, no tiene sentido consumir cuota ni evaluar entitlements.
- Plan/Entitlement (paso 4) y Quota (paso 5) se evalúan **después**. Si Authorization permitió pero el plan no tiene entitlement, no se consume cuota.

**Consumo de cuota solo tras ejecución exitosa**: si la acción ejecutada en paso 6 falla (excepción del handler), `consume_quota` NO se ejecuta. Esto previene cobrar cuota por acciones fallidas. (Excepción: acciones idempotentes con `correlation_id` previo ya consumieron; el cliente re-intenta y obtiene el mismo resultado sin doble cobro.)

---

## 8. Migración inicial — `plan = "unknown"`

> Resuelve **laguna 9**: qué hacer con users sin subscription resuelta.

### 8.1 Política canónica

**Tratamiento como `subscriber` default**, no como `anonymous` ni como error.

### 8.2 Mecanismo: Starter Subscription

Al primer **login autenticado post-migración** (o post-registro nuevo), si `resolve_plan_claim(user_id)` no encuentra subscription activa, el motor:

1. Crea automáticamente una `subscription` con:
   - `plan_key = "subscriber"`
   - `plan_version_at_start = current version`
   - `subject_type = "user"`, `subject_id = user_id`
   - `status = "active"`
   - `started_at = now`
   - `current_period_start = now`
   - `current_period_end = now + 1 month`
   - `auto_renew = true`
2. Materializa entitlements y créditos iniciales del plan `subscriber`.
3. Emite evento `subscription.created_on_migration { user_id, reason: "auto_starter" }`.
4. Audit con `triggered_by = "system_renewal"`.

### 8.3 Ajustes manuales por `arroba_team`

Si un user llega con expectativa de un plan distinto (e.g., Corporate que pagó antes pero su subscription quedó en limbo), `arroba_team` puede:

```
POST /api/admin/subscriptions/{sub_id}/change-plan
  body: { new_plan_key: "corporate", reason: "migration_manual", audit_reason: "..." }
```

Esto crea `plan_change_events` con `triggered_by = "arroba_team"`.

### 8.4 Plan `"unknown"` como estado transitorio

Solo durante la **muy primera request** post-migración antes de la creación del starter:
- `PlanClaim.plan_key = "unknown"` ephemero, no persistido.
- Authorization que evalúe policies con `condition.claim: plan_key, in: [...]` → deny con `reason_code: "deny_plan_unknown"`.
- La UX detecta y redirige a flow de onboarding.

Tras el primer login que crea el starter, `plan_key = "subscriber"` permanece estable.

---

## 9. Forward-compatibility: fiscal_entity_id × planes

> Resuelve **laguna 10**. En v1.0 NO se implementa; se declara el path.

### 9.1 Estado en v1.0

- Cada `organization` tiene una sola `subscription`.
- `subscriptions.fiscal_entity_id = null` siempre.
- `plans.forward_compat.fiscal_entity_scope = "primary_only"` para todos.

### 9.2 Forward: subscription por fiscal_entity

Cuando se materialice `fiscal_entities` (IDENTITY_SPEC §19):

**Opción A — Una subscription por org, planes por fiscal_entity (subset)**:
- La `subscription` sigue siendo por `org` (subject_type=org).
- Cada `fiscal_entity` puede tener su propio plan **subset** del plan de la org.
- `PlanClaim.forward.fiscal_entity_id` indica qué entidad fiscal está activa en el contexto.

**Opción B — Múltiples subscriptions por org (una por fiscal_entity)**:
- Una `subscription` por `(org, fiscal_entity)`.
- El `PlanClaim` se resuelve por `(active_org_id, active_fiscal_entity_id)`.
- Más flexibilidad pero más complejidad operativa.

**Recomendación canónica** (a confirmar en sprint futuro): **Opción A** para casos simples; **Opción B** disponible vía `plans.forward_compat.fiscal_entity_scope = "all_fiscal_entities"`.

### 9.3 Migración prevista

Cuando se introduzcan `fiscal_entities`:
- Para cada `subscription` actual, se rellena `fiscal_entity_id = org.primary_fiscal_entity_id`.
- Eventos: `subscription.fiscal_entity_assigned { sub_id, fiscal_entity_id }`.
- `plans` existentes mantienen `fiscal_entity_scope = primary_only` por defecto.

### 9.4 Impacto en Billing forward

Cuando Billing facture, consultará `subscription.fiscal_entity_id` para resolver el `stripe_customer_id` correcto. Si `null`, usa la org primary. Si presente, usa el customer asociado a la `fiscal_entity` específica (modelado en `BILLING_SPEC.md` forward).

---

## 10. Eventos canónicos del Subscription Engine

### 10.1 Catálogo

**Lifecycle de subscription**:
```
subscription.created
subscription.activated
subscription.trialing_started
subscription.trialing_ended
subscription.paused
subscription.resumed
subscription.cancelled
subscription.expired
subscription.plan_changed
subscription.renewal.scheduled
subscription.renewal.processed
subscription.renewal.failed
subscription.created_on_migration
subscription.fiscal_entity_assigned       (forward)
```

**Entitlements**:
```
subscription.entitlement.granted
subscription.entitlement.revoked
subscription.entitlement.expired
```

**Ledger de buckets**:
```
subscription.bucket.granted
subscription.bucket.consumed
subscription.bucket.refunded
subscription.bucket.expired
subscription.bucket.rolled_over
subscription.bucket.overage_added
subscription.bucket.manual_adjustment
```

**Overage**:
```
subscription.quota.exceeded
subscription.overage.degraded
subscription.overage.confirm_required
subscription.overage.confirmed
subscription.overage.declined
subscription.overage.blocked
```

**Admin / Plan**:
```
plan.created
plan.updated
plan.deprecated
```

### 10.2 Payload canónico de `subscription.plan_changed` (resuelve laguna 6)

```json
{
  "event_id": "evt_xxx",
  "event_type": "subscription.plan_changed",
  "ts": "2026-06-25T10:30:00Z",
  "correlation_id": "corr_xxx",
  
  "subscription_id": "sub_xxx",
  "subject_type": "org",
  "subject_id": "org_xxx",
  "active_org_id": "org_xxx",
  
  "old_plan_key": "subscriber",
  "old_plan_version": 1,
  "old_plan_tier": 1,
  "new_plan_key": "corporate",
  "new_plan_version": 1,
  "new_plan_tier": 3,
  
  "transition_type": "upgrade",
  "effective_at": "2026-06-25T10:30:00Z",
  
  "credit_carryover_applied": {
    "valuation": {"carried_over": 5, "expired": 0, "new_grant": 50},
    "matching": {"carried_over": 0, "expired": 8, "new_grant": 20}
  },
  
  "triggered_by": "user",
  "triggered_by_user_id": "user_xxx",
  "audit_reason": null,
  
  "previous_period_end": "2026-07-25T00:00:00Z",
  "new_period_end": "2027-06-25T00:00:00Z",
  
  "billing_action_required": true,
  "economic_event_to_billing_id": "ee_xxx"
}
```

### 10.3 Productores y consumidores

| Evento | Productor | Consumidores |
|---|---|---|
| `subscription.plan_changed` | Subscription | Authorization (invalidar cache), Billing (emitir charge/refund), Audit, Memory Engine, Notification |
| `subscription.bucket.consumed` | Subscription | Authorization (re-evaluar `in_overage`), Monitoring |
| `subscription.overage.confirmed` | Subscription | Billing (crear invoice item), Authorization (re-evaluar caché), Notification |
| `subscription.overage.confirm_required` | Subscription | UX (mostrar modal), Notification (opcional email) |
| `subscription.overage.blocked` | Subscription | UX (mostrar CTA upgrade) |
| `subscription.renewal.processed` | Subscription | Billing (crear invoice del período), Authorization (refresh claim) |
| `subscription.created_on_migration` | Subscription | Audit, Notification (welcome) |
| `plan.created` / `plan.updated` | Admin via API | Subscription cache invalidation, Audit |

---

## 11. APIs canónicas (mapa)

### 11.1 Self-service `me`

| Verbo | Path | Propósito |
|---|---|---|
| GET | `/api/subscription/me` | Devuelve `PlanClaim` resuelto para subject + active_org actual. |
| GET | `/api/subscription/me/plan` | Detalle del plan vigente. |
| GET | `/api/subscription/me/quotas` | Balances actuales por bucket + quotas operacionales. |
| GET | `/api/subscription/me/ledger?bucket={bucket}&from={ts}` | Ledger filtrado del subject. |
| GET | `/api/subscription/me/entitlements` | Productos habilitados. |
| GET | `/api/subscription/me/overages?status={pending|confirmed|...}` | Overage events del subject. |
| POST | `/api/subscription/me/upgrade` | Inicia upgrade. Body: `{new_plan_key, reason}`. Genera `plan_change_event` + delega Billing para charge. |
| POST | `/api/subscription/me/downgrade` | Idem para downgrade. Toma efecto al fin del período actual. |
| POST | `/api/subscription/me/cancel` | Cancela. Body: `{reason}`. `cancelled_at = now`, subscription sigue activa hasta `current_period_end`. |
| POST | `/api/subscription/me/resume` | Si está cancelled antes de `expires_at`, reactiva auto_renew. |
| POST | `/api/subscription/me/overage/{overage_id}/confirm` | Confirma overage charge. |
| POST | `/api/subscription/me/overage/{overage_id}/decline` | Rechaza; bloquea acción asociada. |

### 11.2 Public — Plans

| Verbo | Path | Propósito |
|---|---|---|
| GET | `/api/plans` | Lista planes públicos (status=active). |
| GET | `/api/plans/{plan_key}` | Detalle. |

### 11.3 Internal API (cross-module)

Funciones Python invocables por otros módulos:

```python
subscription.resolve_plan_claim(user_id, active_org_id) -> PlanClaim
subscription.has_entitlement(plan_claim, entitlement_key) -> bool
subscription.has_quota(subject_id, bucket, amount, active_org_id, criticality) -> QuotaCheck
subscription.consume_quota(subject_id, bucket, amount, reason, correlation_id, ...) -> LedgerEntry
subscription.refund_quota(subject_id, bucket, amount, reason, correlation_id) -> LedgerEntry
```

### 11.4 REST internal/SDK (también expuesto admin/`arroba_team`)

| Verbo | Path | Propósito |
|---|---|---|
| POST | `/api/subscription/check-entitlement` | Body: `{entitlement_key, subject_id?, active_org_id?}`. Default subject = current. |
| POST | `/api/subscription/check-quota` | Body: `{bucket, amount?, criticality?}`. Default subject = current. |
| POST | `/api/subscription/consume-quota` | **Solo cross-module interno**, no exponer a frontend. |

### 11.5 Admin / `arroba_team`

| Verbo | Path | Propósito |
|---|---|---|
| GET | `/api/admin/subscriptions` | Lista con filtros. |
| GET | `/api/admin/subscriptions/{sub_id}` | Detalle. |
| POST | `/api/admin/subscriptions/{sub_id}/change-plan` | Cambio manual con `audit_reason`. |
| POST | `/api/admin/subscriptions/{sub_id}/adjust-credits` | Body: `{bucket, delta, reason, audit_reason}`. Crea `manual_adjustment` en ledger. |
| POST | `/api/admin/subscriptions/{sub_id}/grant-entitlement` | Body: `{entitlement_key, valid_from?, valid_until?, audit_reason}`. |
| POST | `/api/admin/subscriptions/{sub_id}/revoke-entitlement` | Idem. |
| POST | `/api/admin/subscriptions/{sub_id}/pause` | Pausa. |
| POST | `/api/admin/subscriptions/{sub_id}/cancel` | Cancela forzosamente. |
| POST | `/api/admin/plans` | CRUD planes (`admin`). |
| GET | `/api/admin/plans` | — |
| PATCH | `/api/admin/plans/{plan_key}` | Actualiza (bumpea version). |
| POST | `/api/admin/plans/{plan_key}/deprecate` | Marca deprecated. |
| POST | `/api/admin/plans/reload-seed` | Recarga seed YAML (admin, idempotente). |

### 11.6 Webhooks (forward, Billing → Subscription)

Para confirmar charges procesados por Billing:

| Verbo | Path | Propósito |
|---|---|---|
| POST | `/api/subscription/billing-callback/charge-confirmed` | Billing notifica que un `economic_event` se cobró exitosamente. Subscription marca overage como `paid`. |
| POST | `/api/subscription/billing-callback/charge-failed` | Idem. Subscription revierte overage (entry `refund` en ledger) o suspende. |

---

## 12. Integración forward con BILLING_SPEC

> Cómo Subscription se conecta con Billing (Fase 1.0.4 del Sprint 1).

### 12.1 Qué Subscription expone a Billing

**Eventos económicos** (canónicos):

```python
subscription.emit_economic_event(
    kind: Literal["subscription_charge", "overage_charge", "refund", "credit_adjustment"],
    subject_type: Literal["user", "org"],
    subject_id: str,
    amount_units: int,                # cantidad neutra; Billing lo convierte a EUR/USD
    currency_hint: str = "EUR",       # Billing decide la moneda final
    correlation_id: str,
    metadata: dict,                   # {plan_key, bucket, overage_id, period_id, etc.}
)
```

Esto es **API interna**, no expuesta como REST. Billing se suscribe a estos eventos.

### 12.2 Triggers principales

| Trigger en Subscription | Evento → Billing | Acción esperada de Billing |
|---|---|---|
| `subscription.plan_changed { upgrade }` | `economic_event { kind: "subscription_charge", amount: prorated_amount }` | Crea invoice item / charge inmediato |
| `subscription.plan_changed { downgrade }` | `economic_event { kind: "refund", amount: prorated_refund }` (si política lo permite) | Crea credit note |
| `subscription.renewal.processed` | `economic_event { kind: "subscription_charge", amount: period_amount }` | Crea invoice del nuevo período |
| `subscription.overage.confirmed` | `economic_event { kind: "overage_charge", amount: overaged * unit_price }` | Invoice item adicional |
| `subscription.cancelled` (sin refund) | (ningún evento si no hay refund) | — |
| `manual_adjustment` por admin | `economic_event { kind: "credit_adjustment" }` (si tiene impacto monetario) | Optional charge/refund |

### 12.3 Qué Subscription NO hace

- **NO crea invoices** (eso lo hace Billing).
- **NO interactúa con Stripe** (Billing tiene el SDK).
- **NO calcula IVA / reverse charge** (Billing aplica las reglas fiscales).
- **NO almacena payment methods** (Billing los gestiona).
- **NO sabe si el cobro tuvo éxito** hasta recibir webhook callback (§11.6).

### 12.4 Reconciliación

Periódica (job diario):
- Subscription enumera `economic_events` emitidos en últimas 24h.
- Compara con confirmaciones recibidas vía webhook.
- Si hay eventos sin confirmar tras X horas → alerta `subscription.billing.reconciliation_lag`.

### 12.5 Forward `fiscal_entity_id`

Cuando se introduzcan `fiscal_entities`:
- Subscription incluye `fiscal_entity_id` en el `economic_event`.
- Billing resuelve el `stripe_customer_id` correcto por entidad fiscal (cada entidad fiscal puede tener distinto VAT ID, dirección legal, etc.).

---

## 13. Seed YAML inicial de los 7 planes

> Estructura completa de los planes seed. **Valores numéricos concretos (créditos exactos, días) son TBD** (decisión comercial pendiente); la estructura es canónica.

### 13.1 `anonymous`

```yaml
plan_key: anonymous
plan_tier: 0
name: "Anonymous"
description: "Visitor sin sesión. Lectura pública limitada."
status: active
version: 1
billing_period_months: null

included_credits: {}                       # cero créditos
included_products:
  - P04                                    # búsqueda básica pública
  
overage_policy: strict
default_max_authorization_days: 0
seats_max: 0
quotas:
  operations_active_max: 0
  data_rooms_max: 0

eligibility_rules:
  base:
    kyc_required: false

forward_compat: { fiscal_entity_scope: primary_only }
audit_reason: "seed v1.0"
```

> **Nota**: Anonymous NO requiere `subscription` activa real. El `PlanClaim` se construye on-the-fly desde el seed para users sin auth. NO permite upgrade vía self-service (decisión F34).

### 13.2 `subscriber`

```yaml
plan_key: subscriber
plan_tier: 1
name: "Subscriber"
description: "Plan individual básico."
status: active
version: 1
billing_period_months: 1

included_credits:
  valuation: TBD
  matching: TBD
  analysis: TBD
  signal: TBD
  recommendation: TBD

included_products:
  - P01    # valoración pública
  - P04    # búsqueda básica
  - CAP-005

overage_policy: strict
default_max_authorization_days: 30          # decisión F6 Sprint 0

seats_max: 1
quotas:
  operations_active_max: 1
  data_rooms_max: 1
  invitations_per_month: 5
  mandates_active_max: 0

eligibility_rules:
  base:
    kyc_required: false
    risk_score_max: 100

forward_compat: { fiscal_entity_scope: primary_only }
audit_reason: "seed v1.0"
```

### 13.3 `corporate`

(Ver §4.1.2 ejemplo completo)

### 13.4 `investor`

```yaml
plan_key: investor
plan_tier: 3
name: "Investor"
description: "Para inversores institucionales o family offices."
status: active
version: 1
billing_period_months: 12

included_credits:
  valuation: TBD
  matching: TBD
  analysis: TBD
  signal: TBD
  recommendation: TBD

included_products:
  - P01
  - P04
  - P05    # marketplace
  - P06    # screening avanzado de oportunidades
  - P07    # signals
  - CAP-005
  - CAP-018

overage_policy: metered
default_max_authorization_days: 90

seats_max: 10
quotas:
  operations_active_max: 5
  data_rooms_max: 10
  invitations_per_month: 30
  mandates_active_max: 0

rollover_policy:
  matching: { enabled: true, cap_months: 1 }

eligibility_rules:
  base:
    kyc_required: false
  for_critical_products:
    products: [P09]
    kyc_required: true
    risk_score_max: 50

forward_compat: { fiscal_entity_scope: primary_only }
```

### 13.5 `advisor`

```yaml
plan_key: advisor
plan_tier: 3
name: "Advisor"
description: "Para asesores M&A independientes y boutiques."
status: active
version: 1
billing_period_months: 12

included_credits:
  valuation: TBD
  matching: TBD
  analysis: TBD
  signal: TBD
  recommendation: TBD

included_products:
  - P01
  - P02
  - P04
  - P05
  - P07
  - P08    # advisory share workflow
  - CAP-005
  - CAP-018
  - CAP-022

overage_policy: metered
default_max_authorization_days: 90

seats_max: 5
quotas:
  operations_active_max: 10
  data_rooms_max: 15
  invitations_per_month: 100
  mandates_active_max: 20

eligibility_rules:
  base:
    kyc_required: true                       # advisors operan con dinero ajeno; KYC obligatorio
    risk_score_max: 50

forward_compat: { fiscal_entity_scope: primary_only }
```

### 13.6 `arroba_team`

```yaml
plan_key: arroba_team
plan_tier: 8
name: "arroba_team (internal)"
description: "Equipo interno operadores. NO disponible vía self-service."
status: active
version: 1
billing_period_months: null

included_credits:
  valuation: "unlimited"
  matching: "unlimited"
  analysis: "unlimited"
  signal: "unlimited"
  recommendation: "unlimited"

included_products:
  - P01
  - P02
  - P03
  - P04
  - P05
  - P06
  - P07
  - P08
  - P09
  - P10
  - P11
  - P12
  - CAP-*                                    # wildcard, todos

overage_policy: strict                       # noop, unlimited
default_max_authorization_days: 365

seats_max: "unlimited"
quotas:
  operations_active_max: "unlimited"
  data_rooms_max: "unlimited"
  invitations_per_month: "unlimited"
  mandates_active_max: "unlimited"

eligibility_rules:
  for_arroba_team_only: true

forward_compat: { fiscal_entity_scope: all_fiscal_entities }
```

### 13.7 `admin`

```yaml
plan_key: admin
plan_tier: 9
name: "Admin (system)"
description: "Admin de sistema. NO disponible vía self-service."
status: active
version: 1
billing_period_months: null

included_credits:
  valuation: "unlimited"
  matching: "unlimited"
  analysis: "unlimited"
  signal: "unlimited"
  recommendation: "unlimited"

included_products: ["*"]                     # todos sin restricción

overage_policy: strict                       # noop
default_max_authorization_days: 365

seats_max: "unlimited"
quotas: { all: "unlimited" }

eligibility_rules:
  for_arroba_team_only: false                # admin es separado

forward_compat: { fiscal_entity_scope: all_fiscal_entities }
```

### 13.8 Reglas de los planes internos

- `arroba_team` y `admin` **NO son asignables vía self-service**. Solo `admin` puede asignar `arroba_team`; sólo bootstrap inicial o `admin` existente puede asignar `admin`.
- Sus subscriptions **no devengan cobros** (Billing los reconoce por `plan_tier >= 8` y los ignora).
- Sus consumos **no se ledgean** (regla P-S.11).
- Sus `default_max_authorization_days = 365` aplica al nivel L4 (AGENTIC_LAYERS_SPEC), pero sigue la regla canónica E16 (NO sobreescribe §5.3).

### 13.9 Estructura de archivos seed

```
/app/backend/plans_seed/
├── anonymous.yaml
├── subscriber.yaml
├── corporate.yaml
├── investor.yaml
├── advisor.yaml
├── arroba_team.yaml
└── admin.yaml
```

Loader: `python -m src.scripts.load_plans_seed` (idempotente; crea si no existe, no sobreescribe si ya hay versión más alta en Mongo).

---

## 14. Open Questions (OPEN-S-*)

> Prefijo `OPEN-S-*` para distinguir de OPENs de specs previos.

| OPEN | Pregunta | Propuesta | Clasificación |
|---|---|---|---|
| **OPEN-S-1** | ¿Valores TBD de créditos (`valuation: TBD`) se resuelven en este spec o en MONETIZATION? | En **MONETIZATION_SPEC** (decisión comercial); este spec solo provee estructura. Resolución: usuario en sprint comercial. | G4 |
| **OPEN-S-2** | ¿Trialing period (free trial) soportado en v1.0? | NO. F34 indica solo Anonymous como modo gratuito. Trials se evalúan en sprint comercial. | G3 |
| **OPEN-S-3** | ¿Prorrateo exacto al hacer upgrade mid-period? | Política canónica: prorrateo lineal por días restantes; Billing ejecuta el cálculo. Subscription emite `economic_event { amount_units: prorated_days }`. | G3 |
| **OPEN-S-4** | ¿Downgrade inmediato o al fin de período? | **Al fin de período** por defecto (evita pérdida de créditos comprados). `arroba_team` puede forzar inmediato con `audit_reason`. | G3 |
| **OPEN-S-5** | ¿Múltiples subscriptions activas por org (e.g., add-on de matching extra)? | NO en v1.0 (regla unicidad). Add-ons se modelan como `entitlements` granted manualmente o vía promo. | G3 |
| **OPEN-S-6** | ¿Cómo se modelan promociones (cupón de 50% off X meses)? | Forward. v1.0 no soporta. Reserva: campo `metadata.promo_code` en `subscription`. | G4 |
| **OPEN-S-7** | ¿`bucket_ledger` permite `entry_type = "consume"` con `correlation_id` duplicado (idempotencia)? | SÍ. El service `consume_quota` busca por `correlation_id` antes de insertar; si existe, devuelve la entrada previa (idempotente). | G3 |
| **OPEN-S-8** | ¿Ledger compartido cross-fiscal_entity cuando se materialicen? | Forward. Probable: un ledger por `(subscription_id, bucket)`, donde la subscription puede ser por org o por fiscal_entity. | G3 |
| **OPEN-S-9** | ¿`PlanClaim.claim_cached_ttl_seconds` ajustable por plan? | NO en v1.0; constante 300s. Future: configurable. | G3 |
| **OPEN-S-10** | ¿Sentinel `"unlimited"` se serializa cómo en frontend? | En la `PlanClaim`, `hard_limit: "unlimited"` y `balance: 999_999_999` (entero alto para evitar parsing de string en frontend). El frontend renderiza "∞" cuando detecta el entero alto + flag implícita. | G3 |
| **OPEN-S-11** | ¿Cómo se mueven entitlements al cambiar de plan? | Al `plan_changed`: revoke entitlements `granted_by = plan_default` del plan viejo; grant los del nuevo. Entitlements `manual_admin` se conservan salvo override explícito. | G3 |
| **OPEN-S-12** | ¿`subscription.bucket.consumed` se emite para acciones de `arroba_team`/`admin`? | NO (P-S.11). El audit vive en Authorization. | G3 |
| **OPEN-S-13** | ¿Renewal failed (e.g., Billing reportó charge_failed) qué hace? | Subscription transita a `past_due` (sub-estado de `active`) por 7 días; emite `subscription.renewal.failed`; tras 7 días sin éxito, `expired`. | G3 |
| **OPEN-S-14** | ¿`overage_policy = "soft"` registra ledger negativo o consume_with_flag? | Registra `consume` con `entry_type = "consume"` + `reason="degraded_overage"` + `balance_after` puede ser negativo. La caché refleja el negativo (`in_overage = true`). | G3 |
| **OPEN-S-15** | ¿Cambio de plan en organización con seats_max menor que seats_used? | Bloquea downgrade hasta reducir seats. Si `admin`/`arroba_team` forzan, primero suspenden memberships excedentes con `audit_reason`. | G3 |
| **OPEN-S-16** | ¿`plan.included_products` admite wildcards (`CAP-*`)? | SÍ. Para `arroba_team`/`admin`. El motor expande al consultar entitlements (no se materializan todas las entradas en `entitlements`). | G3 |
| **OPEN-S-17** | ¿`subscription.pause` mantiene créditos o los expira? | Mantiene (no expiran durante pause). Al `resume`, `current_period_end` se recalcula extendiendo por la duración de pause. Auditoría obligatoria. | G3 |
| **OPEN-S-18** | ¿Quotas operacionales (`operations_active_max`) se trackean en `PlanClaim` o se evalúan al usarse? | **Trackean en PlanClaim** (campo `quotas.operations_active_used`). Al crear una `operation`, Transaction OS consulta y el motor de Subscription verifica `operations_active_used < max`. | G3 |
| **OPEN-S-19** | ¿Múltiples currencies en el futuro afectan al ledger? | Ledger en **unidades neutras** (créditos enteros); Billing decide la moneda al facturar. Sin impacto en ledger. | G3 |
| **OPEN-S-20** | ¿`arroba_team` puede ver subscriptions cross-customer sin mediación? | Solo con mediación activa (regla AUTHORIZATION_SPEC §12). Sin mediación, GET en admin/subscriptions retorna 403. | G3 |

---

## Cierre del spec

Este documento es **fuente de verdad** sobre la plataforma de Subscription de arroba.com. Cualquier desviación en código requiere bump de versión + propagación a `CHANGELOG.md`.

**Versión actual**: `v1.0.0`.
**Estado**: ✅ Cerrado. Pendiente aprobación del usuario antes de redactar BILLING_SPEC (Fase 1.0.4).
**Próxima fase**: 1.0.4 — `BILLING_SPEC.md` (no se inicia sin aprobación).

> **Fuentes canónicas referenciadas**:
> - `/app/memory/specs/IDENTITY_SPEC.md` v1.1.0 (Identity claims)
> - `/app/memory/specs/AUTHORIZATION_SPEC.md` v1.1.0 (decisiones, explainability, permisos temporales forward)
> - `/app/memory/specs/MONETIZATION_SPEC.md` v1.1.0 (catálogo P01-P12, mecanismos M01-M05, 7 planes)
> - `/app/memory/specs/AGENTIC_LAYERS_SPEC.md` (default_max_authorization_days, F6, L4)
> - `/app/memory/specs/CANON_AUDIT_REPORT.md` + `OPEN_ITEMS_CLASSIFICATION.md` (F6, F34, F35, D4, D10, E16)
> - `/app/memory/SPRINT1_ARCHITECTURE_PROPOSAL.md` (decisiones D-S.1-D-S.5)
