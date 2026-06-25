# arroba.com — Monetization Spec v1.0.0

> **Capa canónica**: *Engines & Specs* (séptima capa, pendiente de propagación a `ARROBA_PHILOSOPHY.md` §13 al cierre del Sprint 0).
> **Fase del proyecto**: Sprint 0 · Fase 0.6 (**último** de 6 specs).
> **Estado**: borrador para revisión humana.
> **Fecha**: 2026-06-25.
> **Documentos predecesores (lectura obligatoria)**: `TRANSACTION_OS_SPEC v1.1.0` · `TRANSACTION_COPILOT_SPEC v1.1.0` · `COPILOTS_SPEC v1.0.0` · `MEMORY_ENGINE_SPEC v1.0.0` · `AGENTIC_LAYERS_SPEC v1.0.0`.
> **Idioma**: español canónico — **lenguaje de negocio** en secciones comerciales; lenguaje técnico solo donde se etiquete explícitamente.
>
> Este documento es **el contrato económico** del Transaction OS. Está organizado **alrededor de productos, planes, créditos, fees y revenue share** que el usuario reconoce y compra. La arquitectura interna (capabilities, niveles agénticos, especialistas) es **transparente al usuario y a la factura**.
>
> **Decisión canónica fundacional**:
> > *"La monetización no debe modelarse alrededor de las capabilities. Las capabilities son una implementación interna. El usuario nunca compra una capability. El usuario compra valor."* — Principio 1.
> >
> > *"No debe existir ninguna referencia económica directa a CAP-001, CAP-017, L3, L4 ni ningún concepto arquitectónico interno. Esos conceptos pertenecen a la arquitectura. La monetización debe apoyarse en: funcionalidades · productos · servicios · resultados obtenidos."* — Principio 2.
>
> **Documentos del Sprint 0**:
> 1. ✅ `TRANSACTION_OS_SPEC v1.1.0`
> 2. ✅ `TRANSACTION_COPILOT_SPEC v1.1.0`
> 3. ✅ `COPILOTS_SPEC v1.0.0`
> 4. ✅ `MEMORY_ENGINE_SPEC v1.0.0`
> 5. ✅ `AGENTIC_LAYERS_SPEC v1.0.0`
> 6. ← **este documento** (`MONETIZATION_SPEC v1.0.0`) — **cierre del Sprint 0**

---

## Índice

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Glosario](#2-glosario)
3. [Principios canónicos](#3-principios-canónicos)
4. [Catálogo canónico de productos comerciales](#4-catálogo-canónico-de-productos-comerciales)
5. [Catálogo canónico de planes](#5-catálogo-canónico-de-planes)
6. [Política de overage](#6-política-de-overage)
7. [Créditos como unidad de consumo](#7-créditos-como-unidad-de-consumo)
8. [Suscripciones](#8-suscripciones)
9. [Finder Fee, Success Fee, Advisory Share](#9-finder-fee-success-fee-advisory-share)
10. [Revenue Share Plataforma ↔ Advisor](#10-revenue-share-plataforma--advisor)
11. [Reglas de elegibilidad — Plan + Permisos + Riesgo](#11-reglas-de-elegibilidad--plan--permisos--riesgo)
12. [Eventos económicos canónicos](#12-eventos-económicos-canónicos)
13. [Trazabilidad económica](#13-trazabilidad-económica)
14. [Mapeo interno PRODUCTO → CAPABILITIES (documentación técnica, no user-facing)](#14-mapeo-interno-producto--capabilities-documentación-técnica-no-user-facing)
15. [Boundary First — pasarela de pago y dependencias](#15-boundary-first--pasarela-de-pago-y-dependencias)
16. [Integración con specs ya cerrados (cierre Sprint 0)](#16-integración-con-specs-ya-cerrados-cierre-sprint-0)
17. [Open Questions](#17-open-questions)

---

## 1. Propósito y alcance

### 1.1 Qué es este spec

Este spec es **el contrato económico del Transaction OS**. Define **qué compra el usuario**, **qué incluye cada plan**, **cómo se consumen los créditos**, **cómo se cobran las comisiones por intermediación y éxito**, **cómo se distribuye el revenue con los Advisors**, **qué eventos económicos se registran** y **con qué pasarela externa se materializa el pago**.

Está estructurado **alrededor de productos y resultados** que el usuario reconoce: "Valoración avanzada", "Generación de Teaser", "LOI preparada", "Matching", "Apertura de operación". El usuario nunca interactúa con conceptos arquitectónicos (capabilities, niveles de autonomía, especialistas). El motor decide internamente qué piezas técnicas activar para entregar el producto comprado.

### 1.2 Qué NO es este spec

| No es | Es |
|---|---|
| Una traducción de la arquitectura interna a precio | Un catálogo de productos en el lenguaje del usuario |
| Una facturación por capability ejecutada | Una facturación por producto consumido o suscripción activa |
| Una exposición de niveles de autonomía al cliente | Un contrato que abstrae la autonomía detrás de "modo automático", "delegación", "asistido" |
| Una fuente legal de contratos comerciales | Un acuerdo conceptual; el contrato vinculante vivirá en plantillas legales (`CIS_SPEC`, P0 fuera Sprint 0) |
| Una integración terminada con Stripe | Un contrato funcional con la pasarela como dependencia externa |
| Un precio cerrado | Un esqueleto declarativo con precios marcados `TBD` o `[OPEN-F*]` pendientes de cierre con el usuario |

### 1.3 Relación con specs predecesores

Los 5 specs anteriores son **insumos técnicos**. Este spec habla **el lenguaje del usuario y del negocio**. Toma sus elementos así:

| Spec predecesor | Insumo que aporta |
|---|---|
| `TRANSACTION_OS_SPEC v1.1.0` (0.1) | Las **fases T1–T15** que determinan en qué momento del ciclo se ofrece cada producto y qué **eventos canónicos** disparan fees (Match aceptado → posible Finder Fee; LOI firmada → posible Success Fee parcial; Closing declarado → Success Fee plena). |
| `TRANSACTION_COPILOT_SPEC v1.1.0` (0.2) | El TC es **la voz única** que comunica precios, cuotas, upgrades y consumos al usuario (B6). Antes de delegar, consulta cuotas; informa siempre en lenguaje de producto. |
| `COPILOTS_SPEC v1.0.0` (0.3) | Los especialistas reportan **consumo interno** que el motor de billing traduce a créditos del producto correspondiente. El usuario no ve ese consumo desagregado. |
| `MEMORY_ENGINE_SPEC v1.0.0` (0.4) | **Persistencia** de los eventos económicos en `audit.global` con retención legal contable (10 años post-cierre de Operation; 7 años eventos de suscripción/facturación generales, ajustar según normativa). |
| `AGENTIC_LAYERS_SPEC v1.0.0` (0.5) | La **política de overage** usa internamente la criticidad de la acción para decidir el comportamiento (degradación / confirmación / bloqueo). El usuario **nunca** ve esa palabra; ve la traducción en lenguaje de producto. |

### 1.4 Alcance funcional

Este spec define:

1. **Catálogo de 12 productos comerciales** (§4) + 5 mecanismos económicos (créditos, suscripciones, finder fee, success fee, advisory share).
2. **Catálogo de planes** (§5) — Anonymous, Subscriber, Corporate, Investor, Advisor, arroba_team, Admin — con cuotas declaradas y reglas de elegibilidad.
3. **Política de overage** (§6) en lenguaje de producto, con traducción documentada desde la criticidad interna.
4. **Créditos** como unidad atómica de consumo modular (§7).
5. **Suscripciones** con renovación, cancelación, upgrade/downgrade y créditos roll-over (§8).
6. **Tres mecanismos transaccionales**: Finder Fee, Success Fee, Advisory Share (§9-10).
7. **Reglas de elegibilidad** combinando Plan + Permisos + Riesgo (§11).
8. **Eventos económicos canónicos** vinculados al audit (§12).
9. **Trazabilidad y retención** alineada con normativa contable (§13).
10. **Mapeo interno producto → capabilities** marcado claramente como **documentación técnica de implementación** (§14).
11. **Boundary First** con Stripe / pasarelas como dependencias externas (§15).

Este spec **NO define**:

- Precios concretos en euros (todos como `TBD` o `[OPEN-F*]`).
- Plantillas legales del contrato (CIS).
- UX de pricing, upgrade, paywall (vive en Design System).
- Integración técnica con Stripe (vive en capa Implementación).
- Política fiscal específica por jurisdicción (vive en spec dedicado de Compliance).

---

## 2. Glosario

### 2.1 Producto comercial

**Producto comercial** (producto). Unidad de **valor entregable al usuario** declarada con `product_id` (`P01` … `P12` en v1.0.0). Tiene nombre, descripción en lenguaje de usuario, target users, fase TOS en la que aplica, modelos de pricing disponibles, reglas de elegibilidad y políticas de overage. Lo que el usuario compra. Lo que la factura referencia. **Es el único objeto comercial visible al usuario**.

### 2.2 Plan

**Plan** (`PL-anonymous`, `PL-subscriber`, `PL-corporate`, `PL-investor`, `PL-advisor`, `PL-arroba_team`, `PL-admin`). Conjunto coherente de productos incluidos, cuotas asignadas, créditos mensuales otorgados y reglas de elegibilidad aplicables. Cada usuario pertenece a uno y solo uno (por organización, por sesión activa).

### 2.3 Suscripción

**Suscripción**. Acuerdo recurrente del usuario / organización con la plataforma para acceder a un plan durante un período (mensual o anual). Identificada por `subscription_id`, con `status ∈ {active, paused, cancelled, expired}`, `period_start`, `period_end`, `auto_renew: bool`.

### 2.4 Crédito

**Crédito**. Unidad **atómica e indivisible** de consumo modular sobre los productos. Se obtiene incluido en plan, comprado en bolsa, regalado en promoción o concedido en compensación. Se consume al utilizar productos (cada producto declara su rango estimado de consumo). Tiene caducidad declarada (`expires_at`).

### 2.5 Cuota

**Cuota** (quota). Límite de uso de un producto dentro de un plan durante una ventana temporal (típicamente mensual). Puede expresarse en unidades naturales del producto ("5 valoraciones avanzadas / mes") o en créditos asignados al producto. Superar la cuota dispara la política de overage (§6).

### 2.6 Add-on

**Add-on**. Producto adquirido **fuera del plan** mediante pago puntual o paquete. Ejemplo: bolsa adicional de créditos, ampliación de cuota mensual de un producto concreto, habilitación temporal de un producto avanzado.

### 2.7 Finder Fee

**Finder Fee** (comisión por intermediación). Comisión que la plataforma cobra **al activarse un Match** entre Buyer y Seller previamente desconocidos en el sistema. Compensa la función de descubrimiento y emparejamiento. Detalle en §9.1.

### 2.8 Success Fee

**Success Fee** (comisión por éxito). Comisión que la plataforma cobra **al cerrarse exitosamente una Operación** (`closing.declared`). Es porcentual sobre el valor final de la transacción. Detalle en §9.2.

### 2.9 Advisory Share

**Advisory Share** (revenue share del Advisor). Porcentaje del ingreso económico de un producto que se distribuye al Advisor con mandato activo en la Operación, cuando dicho Advisor ha participado materialmente en el resultado. Detalle en §9.3.

### 2.10 Revenue Share

**Revenue Share**. Mecanismo de distribución del ingreso entre Plataforma y terceros (típicamente Advisors). Generaliza el Advisory Share y puede extenderse en el futuro a otros partners.

### 2.11 Overage

**Overage** (sobreconsumo). Situación en la que el usuario excede la cuota asignada de un producto en su plan. Dispara política definida (§6): degradación a modo básico, confirmación explícita para cobro extra, o bloqueo según naturaleza del producto.

### 2.12 Plan eligibility

**Plan eligibility** (elegibilidad de plan). Conjunto de productos al que un plan da acceso, condicionado a reglas de elegibilidad (§11). Un producto puede estar **incluido** en el plan (sin coste adicional hasta cuota), **disponible como add-on** (con cargo) o **no disponible** (requiere upgrade).

### 2.13 Reglas de elegibilidad

**Reglas de elegibilidad** (`eligibility_rules`). Combinación canónica de cuatro criterios para habilitar productos sensibles: `plan_tier_min` (plan mínimo), `kyc_required` (KYC verificado), `risk_assessment_required` (Risk & Compliance Service score aceptable), `admin_whitelist_required` (whitelist explícita de `admin`). El criterio canónico es **Plan + Permisos + Riesgo**, no únicamente el tipo de plan (decisión D3).

### 2.14 Boundary

**Boundary** (frontera de implementación). Componente externo al spec que materializa una capacidad económica: pasarela de pago (Stripe), facturación electrónica, KYC/AML (servicio externo), notificación de cobros. El spec define **el contrato** con esos componentes, no su implementación.

### 2.15 Lenguaje de usuario

**Lenguaje de usuario**. Vocabulario que respeta el **Principio de Desacoplamiento**: no menciona conceptos arquitectónicos internos. Habla de "Valoración avanzada", "Generación de Teaser", "Modo asistido", "Modo automático", "Cuota agotada", "Sigue funcionando en modo básico". **Nunca** habla de "capability", "L3", "L4", "CAP-021", "nivel agéntico".

### 2.16 Lenguaje técnico (interno)

**Lenguaje técnico**. Vocabulario reservado a la **§14 (mapeo interno)** y a documentación de implementación. Menciona `CAP-XXX`, `L1`/`L2`/`L3`/`L4`, especialistas, criticidad. **Nunca** se filtra al usuario ni a la factura.

---

## 3. Principios canónicos

### 3.1 Principio de Monetización (Principio 1 — canónico literal del usuario)

> *"La monetización no debe modelarse alrededor de las capabilities. Las capabilities son una implementación interna. El usuario nunca compra una capability. El usuario compra valor. Por tanto, MONETIZATION_SPEC debe estructurarse alrededor de productos y resultados, no de capabilities/niveles agénticos."*

Consecuencias:

- El catálogo comercial (§4) está en términos de **productos** y **resultados entregables**.
- Las cuotas se declaran en unidades de producto ("3 valoraciones avanzadas/mes") o en créditos asignables a productos, **nunca** en "invocaciones de CAP-XXX" ni "ejecuciones L3".
- Las comunicaciones al usuario (paywall, upgrade, factura, mensajes de cuota) **siempre** referencian productos comerciales.
- La factura legal lista productos comprados, no capabilities ejecutadas.

### 3.2 Principio de Desacoplamiento (Principio 2 — canónico literal del usuario)

> *"No debe existir ninguna referencia económica directa a CAP-001, CAP-017, L3, L4 ni ningún concepto arquitectónico interno. Esos conceptos pertenecen a la arquitectura. La monetización debe apoyarse en: funcionalidades · productos · servicios · resultados obtenidos. El motor decidirá internamente qué capabilities ejecutar para entregar ese resultado."*

Consecuencias:

- Las únicas secciones de este spec donde aparecen `CAP-XXX` o `L1`–`L4` son **§14 (mapeo interno)** y **§6 (política de overage)**. En §6 el uso es **transitorio** y siempre acompañado de su traducción a lenguaje de producto.
- El mapeo interno **NO se expone al usuario**, **NO se factura a ese nivel**, **NO aparece en planes ni cuotas**.
- Cualquier sección o documento derivado que rompa este principio debe corregirse antes de publicar.
- La sección §14 está explícitamente etiquetada como "documentación técnica de implementación".

### 3.3 Lenguaje de usuario en todo el catálogo comercial

> Todo el catálogo comercial (productos, planes, cuotas, modos, fees, créditos, suscripciones) se expresa en **términos que el usuario reconoce**: el valor entregado, el resultado obtenido, el ciclo en el que aplica. Nunca en términos de arquitectura.

Ejemplos canónicos de traducción:

| Lenguaje técnico interno | Lenguaje de usuario |
|---|---|
| "Has agotado tu cuota de CAP-017" | "Has agotado tu cuota mensual de Valoraciones Avanzadas" |
| "Modo L1 activado por overage" | "Sigue funcionando en modo básico" |
| "Necesitas autorización L4 + whitelist admin" | "Esta acción requiere confirmación adicional según las políticas de tu plan" |
| "Cuota Crítica × L3 en default-deny" | "Esta función avanzada está disponible en planes Corporate o superiores" |

### 3.4 Plan + Permisos + Riesgo (Decisión D3)

> El criterio canónico de habilitación de un producto sensible no es "qué plan tienes" ni "qué nivel agéntico permites". Es la **combinación de tres dimensiones**:
>
> 1. **Plan** compatible (tier mínimo).
> 2. **Permisos** (KYC verificado, consentimientos firmados, autorización del administrador de la organización).
> 3. **Riesgo** (Risk & Compliance Service confirma score aceptable, sin flags de fraude).

Cada producto declara sus `eligibility_rules` combinando estas tres dimensiones. No se hardcodea "solo Corporate"; se declaran las condiciones y el sistema evalúa.

### 3.5 Voz única monetaria (B6)

> Cualquier comunicación de pricing al usuario — paywall, advertencia de cuota, propuesta de upgrade, notificación de cargo — se canaliza **siempre** a través del Arroba Copilot (TC) o de la UI integrada. **Nunca** un "facturador" o "billing agent" separado habla con el usuario. El TC es la voz única.

Consecuencias:

- Cuando una cuota está al 80%, el TC verbaliza ("Has usado el 80% de tus Valoraciones Avanzadas este mes. Quedan 1 más antes de cambiar a modo básico.").
- Cuando un cargo está a punto de aplicarse, el TC explica ("Si confirmas, se añadirán 20 créditos por valor de TBD € a tu siguiente factura.").
- Cuando el plan se renueva, el TC notifica ("Tu plan Corporate se ha renovado automáticamente. Ya tienes nuevos créditos disponibles.").

### 3.6 Trazabilidad económica total

> Cada cobro, cada consumo, cada acceso, cada upgrade y cada refund queda **auditado de forma inmutable** en el Memory Engine bajo retención legal contable.

Esto soporta:

- **Auditoría regulatoria** (normativa contable española / UE, mínimo 7 años para facturación general).
- **Auditoría legal** (eventos vinculados a Operation: 10 años post-cierre).
- **Auditoría interna** del usuario y de su organización.
- **Reconciliación** con los registros de la pasarela externa (Stripe).

### 3.7 Transparencia previa (sin sorpresas)

> El usuario **siempre** conoce el coste **antes** de pagarlo. No existen cargos automáticos sorpresa. Cualquier consumo que exceda la cuota o aplique cobro adicional requiere:
>
> 1. **Notificación previa** del TC con cálculo explícito.
> 2. **Confirmación explícita** del usuario (excepto cargos recurrentes ya autorizados en la suscripción).
> 3. **Audit del consentimiento** persistido.

Excepción: cargos de suscripción ya autorizados al alta del plan se renuevan automáticamente con notificación previa al usuario X días antes (configurable, default 7).

### 3.8 Reversibilidad de cargos dentro de ventanas razonables

> Los cargos pueden revertirse:
>
> - **Refund inmediato**: dentro de 14 días desde el cargo, por solicitud del usuario, sin justificación adicional (alineado con normativa de consumo UE para servicios digitales recién contratados).
> - **Refund condicionado**: hasta 90 días, sujeto a revisión por `arroba_team` (errores documentados, fallos de servicio).
> - **No-refund**: más allá de 90 días, salvo casos excepcionales aprobados por `admin` (fraude detectado, error contable demostrable).

`[OPEN-F1]`: validar plazos exactos con asesoría jurídica española y UE.

### 3.9 Boundary First en pagos

> La pasarela de pago (Stripe en el inventario actual; otras posibles en el futuro) es **dependencia externa**. El spec define qué eventos consume y emite, no cómo se integra. Misma filosofía para facturación electrónica, KYC/AML, y notificación SMTP/SMS.

### 3.10 Tabla de cumplimiento del Principio de Desacoplamiento

> Este spec audita activamente su propio cumplimiento (§ final del documento). Cada sección declara si menciona conceptos internos (`CAP-XXX`, `L1`–`L4`) y, si los menciona, justifica por qué (típicamente §14 mapeo técnico).

---

## 4. Catálogo canónico de productos comerciales

> **Lista cerrada en v1.0.0**: 12 productos comerciales (P01–P12) + 5 mecanismos económicos (M01–M05, secciones propias §7-§10). Extensión del catálogo requiere actualización del spec.

> **Importante**: cada producto incluye una sección `internal_mapping` etiquetada como **documentación técnica**. Esta sección **NO se expone al usuario**, **NO se factura a ese nivel**, **NO aparece en planes ni cuotas comerciales**. Es el único punto del spec donde se citan `CAP-XXX` y niveles agénticos (junto con §14).

### 4.1 P01 — Valoración automática

```yaml
product_id: "P01"
name: "Valoración automática"
description: "Estimación rápida del valor de una empresa o activo a partir de sus datos financieros y benchmarks sectoriales."
value_delivered: "Valoración indicativa con rango (mínimo / central / máximo) y método aplicado, lista en minutos."
typical_outputs:
  - "Informe breve descargable (PDF + ficha en pantalla)"
  - "Datos persistidos en memoria de empresa / Operación"
target_users: ["Subscriber", "Corporate", "Investor", "Advisor"]
phase_in_TOS: ["Discovery — exploración", "post-Match — referencia continua"]
pricing_models_available:
  - "incluido_en_plan"   # con cuota por plan
  - "créditos"           # también desbloqueable con créditos sueltos
add_on_available: true
eligibility_rules:
  plan_tier_min: "subscriber"
  kyc_required: false
  risk_assessment_required: false
  admin_whitelist_required: false
overage_policy_mapping: "media"      # → §6 traduce a "Sigue funcionando en modo básico"
estimated_credit_consumption: "5–10 créditos por valoración"
internal_mapping:                     # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: ["CAP-016", "CAP-018"]
  agentic_levels_default: ["L2"]
```

### 4.2 P02 — Valoración avanzada

```yaml
product_id: "P02"
name: "Valoración avanzada"
description: "Valoración multi-método (revenue multiple, EBITDA multiple, DCF, comparables) con análisis de sensibilidades, propuestas de estructura de precio y earn-out, y narrativa explicativa."
value_delivered: "Informe profundo con cinco perspectivas de precio, gráfico de sensibilidades, escenarios de earn-out y comparativa con transacciones recientes."
typical_outputs:
  - "Informe detallado (PDF descargable + datos persistidos en Operación)"
  - "Tabla de sensibilidades interactiva en pantalla"
  - "Propuestas de estructura de precio (base + earn-out + escrow + warranties)"
target_users: ["Subscriber con add-on", "Corporate", "Investor", "Advisor"]
phase_in_TOS: ["Discovery", "post-Match (T10 LOI, T12 negociación)"]
pricing_models_available:
  - "incluido_en_plan"
  - "add-on"
  - "créditos"
add_on_available: true
eligibility_rules:
  plan_tier_min: "subscriber_with_addon" # o corporate+
  kyc_required: false
  risk_assessment_required: false
  admin_whitelist_required: false
overage_policy_mapping: "alta"   # → §6: "Confirma para añadir uso extra o amplía tu plan"
estimated_credit_consumption: "20–40 créditos por valoración"
internal_mapping:                # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: ["CAP-017", "CAP-018", "CAP-020", "CAP-019"]
  agentic_levels_default: ["L2", "L3"]
```

### 4.3 P03 — Informe premium

```yaml
product_id: "P03"
name: "Informe premium"
description: "Documento de análisis profundo personalizado para una empresa o sector: narrativa, insights priorizados, riesgos identificados, oportunidades, benchmarks sectoriales relevantes."
value_delivered: "Informe ejecutivo profesional, ideal para presentación a comité, inversores o contraparte."
typical_outputs:
  - "Documento PDF profesional (20–40 páginas)"
  - "Versión editable con marca personalizable (si plan Corporate+)"
target_users: ["Corporate", "Investor", "Advisor"]
phase_in_TOS: ["Discovery", "Pre-Match", "post-Match"]
pricing_models_available:
  - "incluido_en_plan"
  - "add-on"
  - "créditos"
add_on_available: true
eligibility_rules:
  plan_tier_min: "corporate"
  kyc_required: false
  risk_assessment_required: false
  admin_whitelist_required: false
overage_policy_mapping: "alta"
estimated_credit_consumption: "30–60 créditos por informe"
internal_mapping:                # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: ["CAP-001", "CAP-002", "CAP-022", "CAP-025"]
  agentic_levels_default: ["L2", "L3"]
```

### 4.4 P04 — Búsqueda avanzada

```yaml
product_id: "P04"
name: "Búsqueda avanzada"
description: "Búsquedas semánticas y sectoriales sobre el marketplace, con filtros profundos (tamaño, geografía, sector, EBITDA, hitos, señales recientes)."
value_delivered: "Lista relevante de empresas u oportunidades que coinciden con criterios complejos, ordenadas por relevancia y con razones explícitas."
typical_outputs:
  - "Lista interactiva de resultados con scoring"
  - "Filtros guardables como tesis recurrente"
  - "Exportación a Excel/CSV (planes Corporate+)"
target_users: ["Subscriber", "Corporate", "Investor", "Advisor"]
phase_in_TOS: ["Discovery — exploración activa"]
pricing_models_available:
  - "incluido_en_plan"
  - "créditos"
add_on_available: false
eligibility_rules:
  plan_tier_min: "subscriber"
  kyc_required: false
  risk_assessment_required: false
  admin_whitelist_required: false
overage_policy_mapping: "baja"  # → §6: "Sigue funcionando en modo básico"
estimated_credit_consumption: "1–3 créditos por búsqueda avanzada"
internal_mapping:                # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: ["CAP-010", "CAP-011", "CAP-014"]
  agentic_levels_default: ["L1", "L2"]
```

### 4.5 P05 — Matching

```yaml
product_id: "P05"
name: "Matching"
description: "Identificación cuantitativa y cualitativa de contrapartes potenciales (compradores para una empresa en venta, o targets para un buyer activo), preparación de screenings profesionales y orquestación hasta el Match aceptado."
value_delivered: "Lista priorizada de candidatos con scoring de compatibilidad, razones detalladas, y soporte para lanzar Solicitudes y gestionar respuestas."
typical_outputs:
  - "Tabla de candidatos con compatibility score"
  - "Recomendaciones automáticas si el usuario lo habilita"
  - "Estado de Solicitudes lanzadas (pendiente / aceptada / rechazada / expirada)"
target_users: ["Subscriber", "Corporate", "Investor", "Advisor"]
phase_in_TOS: ["Discovery — T3 (Mandate), T4 (Screening), T5 (Match request)"]
pricing_models_available:
  - "incluido_en_plan"
  - "créditos"
add_on_available: true
eligibility_rules:
  plan_tier_min: "subscriber"
  kyc_required: true
  risk_assessment_required: false
  admin_whitelist_required: false
overage_policy_mapping: "media"
estimated_credit_consumption: "5–15 créditos por sesión de matching (depende del número de candidatos evaluados)"
internal_mapping:                # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: ["CAP-012", "CAP-013", "CAP-015"]
  agentic_levels_default: ["L2", "L3", "L4 si el usuario habilita Recomendaciones automáticas"]
```

### 4.6 P06 — Apertura de operación

```yaml
product_id: "P06"
name: "Apertura de operación"
description: "Conversión de un Match aceptado en una Operación formal con NDA, espacio de trabajo dedicado y acceso a los productos de la fase de transacción (Data Room, IM, DD, LOI)."
value_delivered: "Acceso completo al espacio de transacción (Deal Workspace) con todas las herramientas necesarias para conducir el deal hasta el cierre."
typical_outputs:
  - "Operation creada en el sistema (referenciada por operation_id)"
  - "Espacio de trabajo dedicado (Deal Workspace) con secciones T7–T15"
  - "Activación de productos de transacción (P07, P09, P10, P11)"
target_users: ["Buyer", "Seller", "Advisor"]
phase_in_TOS: ["T7 — Apertura de Operación"]
pricing_models_available:
  - "incluido_en_plan"  # plan corporate+ típicamente
  - "fee_per_operation" # cobro único al abrir, según plan
add_on_available: false
eligibility_rules:
  plan_tier_min: "subscriber"     # mínimo; planes superiores incluyen más Operations
  kyc_required: true
  risk_assessment_required: true
  admin_whitelist_required: false
overage_policy_mapping: "alta"   # → "Has alcanzado el número máximo de Operations activas en tu plan"
estimated_credit_consumption: "n/a — se cobra por Operation (fee fijo según plan), no por créditos"
internal_mapping:                # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: []          # No es capability; es transición TOS (Match → Operation)
  agentic_levels_default: []
  trigger_event: "match.accepted"
```

### 4.7 P07 — Data Room

```yaml
product_id: "P07"
name: "Data Room"
description: "Repositorio documental gestionado de la Operación, con clasificación automática, control de accesos por fase, registro de quién ha consultado qué, y detección de documentación faltante."
value_delivered: "Espacio seguro y trazable para todos los documentos de la transacción, accesible a las partes autorizadas según fase."
typical_outputs:
  - "Repositorio organizado por categorías (financieros, legales, comerciales, operacionales, etc.)"
  - "Log de accesos por documento y por usuario"
  - "Resúmenes automáticos por documento (planes Corporate+)"
  - "Alertas de documentación faltante (a Seller)"
target_users: ["Buyer", "Seller", "Advisor"]
phase_in_TOS: ["T8 — Liberación del IM", "T11 — Due Diligence", "T12 — Negociación"]
pricing_models_available:
  - "incluido_en_plan"  # con cuota de storage por plan
  - "add-on"            # ampliación de storage o usuarios
add_on_available: true
eligibility_rules:
  plan_tier_min: "subscriber"
  kyc_required: true
  risk_assessment_required: false
  admin_whitelist_required: false
overage_policy_mapping: "media"
estimated_credit_consumption: "depende de procesamiento (resumen / clasificación): 1–5 créditos por documento procesado"
internal_mapping:                # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: ["CAP-004", "CAP-005", "CAP-023"]
  agentic_levels_default: ["L2", "L4 si autorizado para clasificación masiva"]
```

### 4.8 P08 — Generación de Teaser

```yaml
product_id: "P08"
name: "Generación de Teaser"
description: "Documento corto, anonimizado y atractivo para publicar la oportunidad en el marketplace y captar el interés de potenciales compradores sin revelar la identidad de la empresa hasta firmar NDA."
value_delivered: "Teaser anonimizado profesional, listo para liberación al marketplace tras tu aprobación."
typical_outputs:
  - "Documento Teaser (1–3 páginas)"
  - "Informe de anonimización (qué se ha ocultado y por qué)"
  - "Publicación opcional en marketplace (con tu confirmación)"
target_users: ["Seller", "Advisor"]
phase_in_TOS: ["T6 — Liberación al marketplace"]
pricing_models_available:
  - "incluido_en_plan"   # cuota mensual
  - "add-on"
  - "créditos"
add_on_available: true
eligibility_rules:
  plan_tier_min: "subscriber"
  kyc_required: true
  risk_assessment_required: false
  admin_whitelist_required: false
overage_policy_mapping: "alta"
estimated_credit_consumption: "10–25 créditos por Teaser generado"
internal_mapping:                # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: ["CAP-007"]
  agentic_levels_default: ["L2", "L3 para publicación efectiva"]
  compensation_mapped: "Retirar Teaser del marketplace + notificar Buyers que lo consultaron"
```

### 4.9 P09 — Generación de Information Memorandum

```yaml
product_id: "P09"
name: "Generación de Information Memorandum"
description: "Documento extenso y detallado de la empresa en venta, preparado para Buyers que han firmado el NDA. Incluye narrativa de negocio, financieros, equipo, oportunidades, riesgos, valoración indicativa."
value_delivered: "IM completo y profesional, listo para liberación a Buyers cualificados tras tu aprobación."
typical_outputs:
  - "Documento IM estructurado por secciones (30–60 páginas según complejidad)"
  - "Versión editable con marca personalizable (planes Corporate+)"
  - "Liberación controlada a Buyers que firmaron NDA"
target_users: ["Seller", "Advisor"]
phase_in_TOS: ["T8 — Preparación y liberación del IM"]
pricing_models_available:
  - "incluido_en_plan"
  - "add-on"
  - "créditos"
add_on_available: true
eligibility_rules:
  plan_tier_min: "subscriber"
  kyc_required: true
  risk_assessment_required: false
  admin_whitelist_required: false
overage_policy_mapping: "alta"
estimated_credit_consumption: "40–80 créditos por IM completo"
internal_mapping:                # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: ["CAP-008"]
  agentic_levels_default: ["L2", "L3 para liberación efectiva"]
```

### 4.10 P10 — Due Diligence asistida

```yaml
product_id: "P10"
name: "Due Diligence asistida"
description: "Suite de herramientas para la fase de Due Diligence: checklist sectorial sugerido, detección de documentación faltante, generación de preguntas relevantes, resúmenes de documentos, informe de riesgos."
value_delivered: "Apoyo profesional para conducir la DD de forma eficiente y rigurosa, con detección automática de gaps y generación de preguntas pertinentes."
typical_outputs:
  - "Checklist DD sectorial personalizado"
  - "Lista priorizada de preguntas a la contraparte"
  - "Resúmenes automáticos de documentos del Data Room"
  - "Informe consolidado de riesgos identificados"
target_users: ["Buyer", "Advisor"]
phase_in_TOS: ["T11 — Due Diligence"]
pricing_models_available:
  - "incluido_en_plan"
  - "add-on"
  - "créditos"
add_on_available: true
eligibility_rules:
  plan_tier_min: "subscriber"
  kyc_required: true
  risk_assessment_required: false
  admin_whitelist_required: false
overage_policy_mapping: "alta"
estimated_credit_consumption: "20–50 créditos por proceso DD completo"
internal_mapping:                # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: ["CAP-004", "CAP-022", "CAP-023", "CAP-024", "CAP-025"]
  agentic_levels_default: ["L2", "L3 para envío de preguntas"]
```

### 4.11 P11 — LOI

```yaml
product_id: "P11"
name: "LOI"
description: "Preparación profesional de la Carta de Intención (Letter of Intent) o Oferta No Vinculante (NBO), con consistencia de valoración, identificación de riesgos y validación de términos contractuales."
value_delivered: "Documento LOI/NBO preparado por el sistema con apoyo de Advisor, listo para tu firma y envío a la contraparte."
typical_outputs:
  - "Documento LOI / NBO (5–15 páginas)"
  - "Validación de consistencia de valoración con análisis previos"
  - "Identificación de riesgos contractuales"
  - "Propuestas de estructura de precio + earn-out + condiciones"
target_users: ["Buyer", "Advisor"]
phase_in_TOS: ["T10 — Preparación y firma de LOI / NBO"]
pricing_models_available:
  - "incluido_en_plan"  # Corporate+ con whitelist; Subscriber+ con add-on específico
  - "add-on"
  - "créditos"
add_on_available: true
eligibility_rules:
  plan_tier_min: "corporate"            # producto sensible
  kyc_required: true
  risk_assessment_required: true
  admin_whitelist_required: true        # whitelist admin obligatoria por criticidad del documento
overage_policy_mapping: "crítica"       # → §6: "Esta función requiere autorización adicional; contacta con tu administrador o amplía tu plan"
estimated_credit_consumption: "60–120 créditos por LOI completa"
internal_mapping:                # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: ["CAP-021", "CAP-019"]
  agentic_levels_default: ["L2", "L3 con whitelist admin (default-deny en su ausencia)"]
```

### 4.12 P12 — Comparables

```yaml
product_id: "P12"
name: "Comparables"
description: "Identificación y análisis de transacciones comparables recientes (M&A público / privado con datos accesibles) para fundamentar valoración o negociación."
value_delivered: "Tabla curada de transacciones comparables con múltiplos, fechas, estructuras y benchmarks sectoriales relevantes."
typical_outputs:
  - "Tabla de transacciones comparables ordenada por relevancia"
  - "Múltiplos calculados (EV/Revenue, EV/EBITDA, etc.)"
  - "Benchmarks agregados del sector"
target_users: ["Subscriber", "Corporate", "Investor", "Advisor"]
phase_in_TOS: ["Discovery", "T10", "T12"]
pricing_models_available:
  - "incluido_en_plan"
  - "créditos"
add_on_available: true
eligibility_rules:
  plan_tier_min: "subscriber"
  kyc_required: false
  risk_assessment_required: false
  admin_whitelist_required: false
overage_policy_mapping: "media"
estimated_credit_consumption: "5–15 créditos por consulta de comparables"
internal_mapping:                # [DOCUMENTACIÓN TÉCNICA — NO USER-FACING]
  capabilities_used: ["CAP-018", "CAP-014"]
  agentic_levels_default: ["L2"]
```

### 4.13 Resumen del catálogo

| ID | Producto | Target principal | Fase TOS | Pricing | Críticidad mapeada |
|---|---|---|---|---|---|
| P01 | Valoración automática | Subscriber+ | Discovery / post-Match | incluido + créditos | media |
| P02 | Valoración avanzada | Subscriber con add-on / Corporate+ | Discovery / post-Match | incluido + add-on + créditos | alta |
| P03 | Informe premium | Corporate+ | Discovery / post-Match | incluido + add-on + créditos | alta |
| P04 | Búsqueda avanzada | Subscriber+ | Discovery | incluido + créditos | baja |
| P05 | Matching | Subscriber+ | Discovery (T3–T5) | incluido + créditos | media |
| P06 | Apertura de operación | Subscriber+ con KYC + Risk | T7 | incluido + fee_per_operation | alta |
| P07 | Data Room | Subscriber+ | T8 / T11 / T12 | incluido + add-on storage | media |
| P08 | Generación de Teaser | Seller / Advisor | T6 | incluido + add-on + créditos | alta |
| P09 | Generación de IM | Seller / Advisor | T8 | incluido + add-on + créditos | alta |
| P10 | Due Diligence asistida | Buyer / Advisor | T11 | incluido + add-on + créditos | alta |
| P11 | LOI | Corporate+ con KYC + Risk + whitelist | T10 | incluido + add-on + créditos | **crítica** |
| P12 | Comparables | Subscriber+ | Discovery / T10 / T12 | incluido + créditos | media |

---

## 5. Catálogo canónico de planes

> 7 planes definidos en v1.0.0. Los precios concretos quedan como `TBD` o marcados con `[OPEN-F*]` hasta cierre con el usuario.

### 5.1 PL-anonymous — Anonymous

```yaml
plan_id: "PL-anonymous"
name: "Anonymous"
tier_level: 0
target_users: "Visitantes no registrados del marketplace"
pricing:
  base_subscription_monthly_eur: 0
  base_subscription_annual_eur: 0
  included_credits_per_month: 0
  overage_credit_price_eur: "n/a"
included_products:
  - "Visualización pública del marketplace (Teasers anonimizados, agregados sectoriales)"
quotas:
  P04_busqueda_avanzada: "limitada (k búsquedas/sesión, sin filtros profundos)"
  todos_los_demas: "no disponible"
default_max_authorization_days: "n/a"
plan_eligibility:
  for_sensitive_products: "no aplica"
overage_policy: "redirección al alta de cuenta (Subscriber)"
seats: "n/a"
notes:
  - "Sin acceso a Operations ni a contenido detallado."
  - "Conversión: el TC en superficie pública sugiere alta gratuita cuando detecta intent."
```

### 5.2 PL-subscriber — Subscriber

```yaml
plan_id: "PL-subscriber"
name: "Subscriber"
tier_level: 1
target_users: "Personas individuales que evalúan empresas o oportunidades, sin equipo o como freelancers."
pricing:
  base_subscription_monthly_eur: "TBD"           # [OPEN-F2]
  base_subscription_annual_eur: "TBD (descuento por compromiso anual)"  # [OPEN-F3]
  included_credits_per_month: "TBD"               # [OPEN-F4]
  overage_credit_price_eur: "TBD"                 # [OPEN-F5]
included_products:
  - "P01 Valoración automática (cuota mensual)"
  - "P04 Búsqueda avanzada (cuota mensual)"
  - "P05 Matching (cuota mensual)"
  - "P12 Comparables (cuota mensual)"
addon_products:
  - "P02 Valoración avanzada (con add-on o créditos)"
  - "P07 Data Room (limitado, con add-on para más storage)"
  - "P08 Generación de Teaser (con add-on)"
  - "P09 Generación de IM (con add-on)"
  - "P10 Due Diligence asistida (con add-on)"
not_available:
  - "P03 Informe premium"
  - "P11 LOI"
quotas:
  P01_valoracion_automatica: "TBD (sugerido: 10/mes)"
  P04_busqueda_avanzada: "TBD (sugerido: 30/mes)"
  P05_matching: "TBD (sugerido: 5 sesiones/mes)"
  P12_comparables: "TBD (sugerido: 20/mes)"
default_max_authorization_days: 30        # [OPEN-F6] — Subscriber tiene tope más bajo
plan_eligibility:
  for_sensitive_products:
    P06_apertura_operacion: "1 Operation activa por defecto; ampliable con add-on"
    P11_LOI: "no incluido; upgrade requerido"
overage_policy:
  - "Productos críticos: bloqueo + propuesta de upgrade"
  - "Productos altos: confirmación explícita (cobro por overage o upgrade)"
  - "Productos medios/bajos: degradación automática a modo básico"
seats: 1
notes:
  - "Plan de entrada; orientado a uso individual ocasional."
```

### 5.3 PL-corporate — Corporate

```yaml
plan_id: "PL-corporate"
name: "Corporate"
tier_level: 3
target_users: "Empresas medianas/grandes que compran o venden negocios, con equipos internos de M&A o estrategia."
pricing:
  base_subscription_monthly_eur: "TBD"           # [OPEN-F7]
  base_subscription_annual_eur: "TBD"            # [OPEN-F8]
  included_credits_per_month: "TBD"               # [OPEN-F9]
  overage_credit_price_eur: "TBD"
included_products:
  - "P01 Valoración automática (cuota amplia)"
  - "P02 Valoración avanzada (cuota mensual)"
  - "P03 Informe premium (cuota mensual)"
  - "P04 Búsqueda avanzada (cuota amplia)"
  - "P05 Matching (cuota mensual amplia)"
  - "P06 Apertura de operación (incluido hasta N Operations simultáneas)"
  - "P07 Data Room (storage incluido N GB)"
  - "P08 Generación de Teaser (cuota mensual)"
  - "P09 Generación de IM (cuota mensual)"
  - "P10 Due Diligence asistida (cuota mensual)"
  - "P11 LOI (incluido sujeto a whitelist admin + KYC + Risk)"
  - "P12 Comparables (cuota amplia)"
addon_products:
  - "Ampliación de storage Data Room"
  - "Seats adicionales"
  - "Bolsas de créditos extra"
quotas:
  P01_valoracion_automatica: "TBD (sugerido: 50/mes)"
  P02_valoracion_avanzada: "TBD (sugerido: 10/mes)"
  P03_informe_premium: "TBD (sugerido: 3/mes)"
  P05_matching: "TBD (sugerido: 20 sesiones/mes)"
  P06_apertura_operacion: "TBD (sugerido: 3 Operations activas)"
  P08_teaser: "TBD (sugerido: 5/mes)"
  P09_IM: "TBD (sugerido: 3/mes)"
  P10_DD_asistida: "TBD (sugerido: 5/mes)"
  P11_LOI: "TBD (sugerido: 5/mes con whitelist)"
default_max_authorization_days: 90
plan_eligibility:
  for_sensitive_products:
    P11_LOI: "habilitado tras KYC + Risk + whitelist admin"
overage_policy:
  - "Productos críticos: bloqueo + propuesta de upgrade"
  - "Productos altos: confirmación explícita"
  - "Productos medios/bajos: degradación automática"
seats: "TBD (sugerido: 5 incluidos, ampliables)"
notes:
  - "Plan empresarial estándar; pensado para 2–4 deals simultáneos."
  - "Marca personalizable en documentos generados."
```

### 5.4 PL-investor — Investor

```yaml
plan_id: "PL-investor"
name: "Investor"
tier_level: 3
target_users: "Inversores individuales o pequeños fondos (family offices, search funds, VC pequeños) con foco en adquirir."
pricing:
  base_subscription_monthly_eur: "TBD"
  base_subscription_annual_eur: "TBD"
  included_credits_per_month: "TBD"
  overage_credit_price_eur: "TBD"
included_products:
  - "P01 Valoración automática (cuota amplia)"
  - "P02 Valoración avanzada (cuota mensual)"
  - "P04 Búsqueda avanzada (cuota amplia)"
  - "P05 Matching (cuota mensual amplia, foco buyer)"
  - "P06 Apertura de operación (incluido hasta N Operations)"
  - "P10 Due Diligence asistida (cuota amplia, foco buyer)"
  - "P11 LOI (incluido sujeto a whitelist + KYC + Risk)"
  - "P12 Comparables (cuota amplia)"
addon_products:
  - "P03 Informe premium (con créditos)"
  - "P07 Data Room (con add-on)"
not_available:
  - "P08 Teaser y P09 IM (productos de Seller)"
quotas: "similares a Corporate, con sesgo hacia productos de buyer"
default_max_authorization_days: 90
plan_eligibility:
  for_sensitive_products:
    P11_LOI: "habilitado tras KYC + Risk + whitelist admin"
overage_policy: "igual a Corporate"
seats: "TBD (sugerido: 2–5)"
notes:
  - "Variante del Corporate orientada a buy-side."
```

### 5.5 PL-advisor — Advisor

```yaml
plan_id: "PL-advisor"
name: "Advisor"
tier_level: 4
target_users: "Boutiques de M&A, consultoras estratégicas, asesores fiscales/legales especializados que actúan en nombre de Buyer o Seller."
pricing:
  base_subscription_monthly_eur: "TBD"
  base_subscription_annual_eur: "TBD"
  included_credits_per_month: "TBD"
  overage_credit_price_eur: "TBD"
  advisory_share_eligible: true
included_products:
  - "Todos los productos P01–P12 con cuotas amplias y herramientas específicas"
  - "Playbooks personalizables (plantillas custom de IM, LOI, DD)"
  - "Multi-cliente con aislamiento estricto (no se cruza memoria entre mandatos)"
  - "Branding personalizable en documentos generados"
addon_products:
  - "Seats adicionales por equipo"
  - "Ampliación de mandatos simultáneos"
quotas:
  multi_mandate_simultaneous: "TBD (sugerido: 10 mandatos activos)"
  P11_LOI: "TBD (sugerido: ilimitado dentro de mandatos activos, sujeto a whitelist+KYC+Risk)"
  todos: "amplias o ilimitadas dentro de mandatos activos"
default_max_authorization_days: 90        # mismo tope, pero con ampliable hasta 180 mediante doble confirmación
plan_eligibility:
  for_sensitive_products:
    P11_LOI: "habilitado dentro de mandatos activos, tras KYC + Risk + whitelist"
overage_policy:
  - "Productos críticos: bloqueo + propuesta de upgrade o de mandato puntual"
  - "Productos altos: confirmación explícita"
  - "Productos medios/bajos: degradación automática"
seats: "TBD (sugerido: 5–20 incluidos)"
revenue_share:
  enabled: true
  default_split: "70% Advisor / 30% Plataforma sobre Success Fee de Operations cerradas con su mandato"   # [OPEN-F10]
  finder_fee_attribution: "100% Plataforma (no aplica revenue share sobre Finder Fee)"   # [OPEN-F11]
notes:
  - "Plan especial con mecanismo Advisory Share (§9.3, §10)."
  - "Aislamiento estricto entre clientes del mismo advisor (B3 regla 3 — MEMORY_ENGINE §5.3)."
```

### 5.6 PL-arroba_team — arroba_team

```yaml
plan_id: "PL-arroba_team"
name: "arroba_team"
tier_level: "interno"
target_users: "Equipo interno de arroba.com con permisos de mediación, atención al cliente, soporte y operaciones especiales."
pricing:
  base_subscription_monthly_eur: 0     # interno; sin facturación
  base_subscription_annual_eur: 0
  included_credits_per_month: "ilimitado o cuotas internas para evitar abuso"
included_products:
  - "Todos los productos con permisos especiales de mediación (§7.6 AGENTIC_LAYERS, §9.6 MEMORY_ENGINE)"
quotas: "internas, configurables por admin"
default_max_authorization_days: "n/a (no se conceden autorizaciones L4 sobre Operations de clientes)"
plan_eligibility: "interno"
overage_policy: "n/a"
notes:
  - "Acceso especial a audit cross-side en mediación de disputa formal (queda en audit con marca explícita)."
  - "Sin facturación; consumo se registra para métricas internas."
```

### 5.7 PL-admin — Admin

```yaml
plan_id: "PL-admin"
name: "Admin"
tier_level: "superior_interno"
target_users: "Administradores de la plataforma con poder de aprobar whitelists, configurar planes, auditar incidentes."
pricing:
  base_subscription_monthly_eur: 0
  included_credits_per_month: "ilimitado"
included_products:
  - "Todos + poderes de admin (aprobar whitelist para productos críticos, purge de emergencia en Memory Engine, modificación de schema de capabilities)"
quotas: "ilimitadas"
default_max_authorization_days: "n/a"
plan_eligibility:
  for_sensitive_products: "todos habilitados"
overage_policy: "n/a"
notes:
  - "Acceso bajo doble factor + audit reforzado."
  - "Acciones de admin siempre generan eventos `admin.*` específicos."
```

### 5.8 Resumen de planes y elegibilidad

| Plan | tier | Operations simultáneas | LOI (P11) | Add-ons posibles | Advisory Share |
|---|---|---|---|---|---|
| Anonymous | 0 | 0 | no | n/a | no |
| Subscriber | 1 | 1 (extensible) | no (upgrade) | sí | no |
| Corporate | 3 | 3 | sí (whitelist+KYC+Risk) | sí | no |
| Investor | 3 | 3 | sí (whitelist+KYC+Risk) | sí | no |
| Advisor | 4 | 10 mandatos | sí (whitelist+KYC+Risk) | sí | **sí** |
| arroba_team | interno | n/a | n/a (no contrata) | n/a | no |
| Admin | superior | n/a | n/a | n/a | no |

---

## 6. Política de overage

### 6.1 Tabla canónica (Decisión D4)

> Esta sección **es la única** del bloque comercial donde aparece transitoriamente el término "criticidad" como concepto técnico. Acompaña siempre la **traducción a lenguaje de producto** que se comunica al usuario. La criticidad técnica es interna; el usuario nunca la ve.

| Criticidad técnica interna | Política operativa | Traducción al usuario (lenguaje de producto) |
|---|---|---|
| **Baja** | Degradación automática (la función sigue, en modo simplificado) | *"Has agotado tu cuota mensual. La función sigue funcionando en modo básico."* |
| **Media** | Degradación automática (la función sigue, en modo simplificado) | *"Has agotado tu cuota mensual. Puedes seguir usando esta función en modo básico, o ampliar tu plan para acceder al modo completo."* |
| **Alta** | Solicitar confirmación explícita del usuario (cobro por overage o upgrade) | *"Has agotado tu cuota de [producto]. Para continuar puedes:* (a) *Confirmar el cargo extra de X € por uso adicional;* (b) *Ampliar tu plan a [Corporate / Investor] que incluye más usos al mes.* *¿Cómo prefieres seguir?"* |
| **Crítica** | Bloqueo hasta autorización explícita / upgrade de plan | *"Esta función requiere autorización adicional según las políticas de tu plan. Para habilitarla, contacta con tu administrador o amplía tu plan a [Corporate / Investor]."* |

### 6.2 Mapeo producto → política de overage

(De la columna `overage_policy_mapping` de cada producto en §4):

| Producto | Política de overage |
|---|---|
| P01 Valoración automática | media |
| P02 Valoración avanzada | alta |
| P03 Informe premium | alta |
| P04 Búsqueda avanzada | baja |
| P05 Matching | media |
| P06 Apertura de operación | alta |
| P07 Data Room | media |
| P08 Generación de Teaser | alta |
| P09 Generación de IM | alta |
| P10 Due Diligence asistida | alta |
| P11 LOI | **crítica** |
| P12 Comparables | media |

### 6.3 Política operativa en cada caso

**Caso 1 — Cuota agotada en producto de criticidad baja/media (P01, P04, P05, P07, P12)**:

- El sistema continúa sirviendo el producto en **modo básico** sin solicitar nada al usuario.
- El TC notifica una sola vez ("Tu cuota mensual de [producto] está agotada. Sigues teniendo acceso al modo básico hasta el próximo ciclo.").
- El usuario no se detiene en su flujo.
- Al renovarse la suscripción, la cuota se restaura.

**Caso 2 — Cuota agotada en producto de criticidad alta (P02, P03, P06, P08, P09, P10)**:

- El sistema **detiene la siguiente invocación** y abre diálogo con el usuario.
- El TC verbaliza con tres opciones explícitas:
  - (a) Cobro por overage con precio claro.
  - (b) Upgrade de plan con beneficio comparativo claro.
  - (c) Esperar al próximo ciclo (no penaliza, simplemente pospone).
- Sin confirmación explícita del usuario, **no se ejecuta**.
- Evento `economy.overage.triggered` y, según respuesta, `economy.overage.confirmed` o `economy.overage.deferred`.

**Caso 3 — Cuota agotada en producto crítico (P11 LOI)**:

- El sistema **bloquea** la invocación.
- El TC verbaliza claramente: "Esta función requiere autorización adicional según las políticas de tu plan."
- Las opciones que se ofrecen:
  - Contactar con `admin` interno (si la organización tiene admin propio).
  - Ampliar a plan superior.
  - Solicitar uso puntual extraordinario (sujeto a aprobación `arroba_team`).
- Evento `economy.overage.blocked` con razón explícita.

### 6.4 Anti-patrones (qué NO debe ocurrir)

| Anti-patrón | Por qué está prohibido |
|---|---|
| Cobrar automáticamente sin consentimiento del usuario en producto de criticidad alta | Viola Principio 3.7 (transparencia previa). |
| Bloquear producto de criticidad baja agotando cuota | Mala UX; el usuario percibe que la plataforma "se rompe". |
| Pedir confirmación en cada uso de producto de criticidad baja | Fricción innecesaria; mata productividad. |
| Mencionar al usuario "esta cuota se basa en CAP-021 nivel L3" | Viola Principio 3.2 (desacoplamiento) y 3.3 (lenguaje de usuario). |
| Permitir uso ilimitado de producto crítico sin whitelist | Viola D3 (Plan + Permisos + Riesgo). |

---

## 7. Créditos como unidad de consumo

### 7.1 Qué es un crédito

Un **crédito** (€) es la **unidad atómica e indivisible** de consumo modular sobre los productos. Un producto declara su rango estimado de consumo (5–10 créditos para P01, 20–40 para P02, etc.). El sistema descuenta automáticamente del balance del usuario al consumir.

### 7.2 Cómo se obtienen créditos

| Mecanismo | Detalle |
|---|---|
| **Incluido en plan** | Cada plan asigna `included_credits_per_month`. Se otorgan al inicio del ciclo y forman parte del valor del plan. |
| **Bolsa adquirida** | El usuario compra paquetes prepagados de créditos como add-on. Tarifa por bolsa declarada `[OPEN-F12]`. Existirán bolsas con descuento por volumen. |
| **Promoción** | El sistema puede otorgar créditos gratuitos en campañas (lanzamiento, fidelidad, referidos). Visibilidad clara al usuario. |
| **Compensación** | En caso de fallo de servicio documentado o decisión de `arroba_team`, se otorgan créditos compensatorios con marca `compensation: true` en el audit. |
| **Conversión desde Finder/Success Fee** | Posibilidad futura: parte del Success Fee pagado por un cliente se puede convertir en créditos para uso posterior. `[OPEN-F13]`. |

### 7.3 Cómo se consumen

- Cada producto consumido **decrementa el balance de créditos** según `estimated_credit_consumption` del producto (rango); el coste real se calcula al cierre de la invocación y se reporta al usuario.
- **Productos incluidos en plan con cuota suficiente**: NO consumen créditos; consumen cuota del plan.
- **Productos en overage de criticidad alta confirmados por el usuario**: consumen créditos (o se cargan vs. el método de pago configurado, según preferencia).
- **Productos add-on adquiridos a la carta**: consumen créditos.

### 7.4 Bolsas (paquetes prepagados)

Catálogo orientativo de bolsas (precio `TBD`):

| Bolsa | Créditos incluidos | Precio | Descuento vs. crédito unitario |
|---|---|---|---|
| Bolsa S | 50 | `[OPEN-F12]` | 0% |
| Bolsa M | 200 | `[OPEN-F12]` | ~10% |
| Bolsa L | 1000 | `[OPEN-F12]` | ~20% |
| Bolsa XL | 5000 | `[OPEN-F12]` | ~30% |

### 7.5 Caducidad de créditos

- **Créditos incluidos en plan**: caducan al final del ciclo si no se consumen, **salvo política de roll-over** (§7.6).
- **Créditos adquiridos en bolsa**: caducidad por defecto **12 meses** desde la compra. Configurable por plan (`[OPEN-F14]`).
- **Créditos promocionales**: caducidad declarada explícitamente al otorgarlos (típicamente 60–90 días).
- **Créditos compensatorios**: caducidad alineada con créditos adquiridos (12 meses), salvo decisión expresa.

Al acercarse la caducidad, el TC notifica con antelación (sugerido 30 días, configurable).

### 7.6 Política de roll-over

| Plan | Roll-over créditos plan no consumidos |
|---|---|
| Anonymous | n/a |
| Subscriber | **No**; los créditos del plan caducan al cierre del ciclo (consumir o perder). |
| Corporate | **Sí**, hasta 50% del balance mensual puede arrastrarse al siguiente ciclo. `[OPEN-F15]` |
| Investor | **Sí**, igual que Corporate. `[OPEN-F15]` |
| Advisor | **Sí**, hasta 100% del balance mensual puede arrastrarse. `[OPEN-F15]` |
| arroba_team / Admin | n/a |

Los créditos arrastrados consumen primero (FIFO de caducidad); los nuevos del ciclo entran después.

### 7.7 Visibilidad para el usuario

El TC, a petición o proactivamente, informa al usuario:

- Cuántos créditos tiene disponibles (separados por fuente: plan, bolsa, promoción, compensación).
- Qué ha gastado este ciclo y en qué productos (resumen agregado, no por capability).
- Cuándo caducan sus créditos próximos.
- Cuál es la cuota actual de cada producto incluido.
- Cuál es el precio de un upgrade de plan si lo solicita.

El usuario también accede a esta información desde un panel dedicado en la UI (diseño en Design System).

### 7.8 Auditoría de créditos

Cada transacción de crédito (concesión, consumo, expiración, reembolso) genera un evento canónico en `audit.global` (§12, §13). El audit es inmutable; rectificaciones se hacen con eventos `audit.correction`.

---

## 8. Suscripciones

### 8.1 Modelos de pago

| Modelo | Detalle |
|---|---|
| **Mensual** | Cobro recurrente cada 30 días desde fecha de alta. Renovación automática salvo cancelación. |
| **Anual** | Cobro anticipado anual. Descuento típico **15–20%** sobre suma de 12 cobros mensuales. `[OPEN-F16]`. |
| **Personalizado (Advisor)** | Acuerdos puntuales con descuentos / cláusulas especiales para Advisors con mandatos múltiples o de gran volumen. Negociado caso por caso. |

### 8.2 Descuentos por compromiso anual

Política de descuento por anualidad (orientativa, `[OPEN-F16]`):

- Subscriber anual: ~15% descuento.
- Corporate anual: ~20% descuento.
- Investor anual: ~20% descuento.
- Advisor anual: ~25% descuento + condiciones especiales según volumen.

### 8.3 Política de renovación automática

- **Por defecto**: `auto_renew = true` al alta del plan.
- **Notificación previa**: el TC avisa **7 días antes** de la renovación con cálculo explícito del próximo cargo. El usuario puede cancelar antes de ese plazo sin penalización.
- **Confirmación al alta**: en el alta, el usuario debe consentir explícitamente la renovación automática (registro de consentimiento).
- **Modificación en cualquier momento**: el usuario puede desactivar `auto_renew` desde su panel de configuración o pidiéndolo al TC.

### 8.4 Política de cancelación

- **Cancelación inmediata**: el usuario puede cancelar en cualquier momento. La suscripción queda como `cancelled` con `period_end = end_of_current_period`. **El servicio sigue activo hasta `period_end`**; tras esa fecha pasa a Anonymous (mantiene acceso público / cuenta archivada).
- **Refund proporcional**: solo aplicable si la cancelación se hace **dentro de los primeros 14 días** desde el alta (alineado con normativa UE servicios digitales). `[OPEN-F1]`.
- **Cancelación con créditos no consumidos**: los créditos quedan disponibles hasta su caducidad declarada; no se reembolsan en efectivo salvo casos excepcionales.

### 8.5 Período de gracia

- **Pago fallido**: si la pasarela rechaza el cobro de renovación, el sistema entra en **período de gracia de 7 días**. Durante ese plazo:
  - El servicio sigue activo (sin degradación).
  - El TC notifica al usuario y propone actualizar método de pago.
  - Se reintentan cobros automáticos según política de la pasarela.
- **Tras período de gracia**: si el pago sigue fallando, la suscripción pasa a `paused` (servicio suspendido, datos conservados). El usuario puede reactivar pagando los importes pendientes.
- **Suspensión prolongada (> 30 días en `paused`)**: la suscripción pasa a `cancelled`. La cuenta sigue accesible pero sin productos premium.

### 8.6 Upgrade / Downgrade

**Upgrade** (ej. Subscriber → Corporate, Corporate → Advisor):

- Aplica inmediatamente.
- **Prorrateo del cargo actual**: el sistema calcula el importe pendiente del ciclo en curso (lo no consumido del plan actual) y lo descuenta del cargo del nuevo plan.
- Los **créditos no consumidos del plan anterior** se conservan (no se pierden por upgrade).
- Las cuotas se reinician al nivel del nuevo plan.

**Downgrade** (ej. Corporate → Subscriber):

- Aplica **al final del ciclo actual** (no inmediato, para preservar uso pagado).
- El usuario mantiene los beneficios del plan superior hasta el cierre del ciclo.
- Los créditos no consumidos del plan superior se conservan hasta su caducidad declarada.
- En el siguiente ciclo, las cuotas pasan a las del plan inferior.

**Auditoría**: eventos `economy.subscription.upgraded` / `.downgraded` con detalle de prorrateo, créditos transferidos y cambios de cuotas.

### 8.7 Acciones masivas (organización)

Para planes Corporate / Investor / Advisor con `seats > 1`:

- El **owner de la organización** gestiona altas y bajas de seats.
- Cada seat consume contra el plan común; el owner ve el consumo agregado y por usuario.
- Las cuotas se distribuyen según política configurable: pool común o por usuario individual. `[OPEN-F17]`.

---

## 9. Finder Fee, Success Fee, Advisory Share

### 9.1 Finder Fee (comisión por intermediación)

#### 9.1.1 Definición

**Finder Fee** es la comisión que la plataforma cobra **al activarse un Match** entre Buyer y Seller previamente desconocidos en el sistema. Compensa la función de descubrimiento y emparejamiento (Discovery Layer del TOS, T1–T5).

#### 9.1.2 Cuándo se activa

- **Evento disparador**: `match.accepted` (transición canónica del TOS, `TRANSACTION_OS_SPEC §9.2`).
- **Excepción**: si Buyer y Seller ya tenían contacto previo documentado antes de la activación del Match (declarado al lanzar Solicitud y validado por `arroba_team` en disputa), el Finder Fee se reduce o se elimina. `[OPEN-F18]`: criterios exactos.

#### 9.1.3 Quién paga, quién cobra

- **Paga**: por defecto el **Buyer** (parte que activa la Solicitud).
- **Cobra**: la **plataforma**.
- **Alternativa**: si Buyer y Seller acuerdan compartir el Finder Fee, se registra el split en el Match y se aplica al cobro. `[OPEN-F19]`: detalles operativos del split acordado.

#### 9.1.4 Cálculo

- **Modelo base**: importe fijo según plan del Buyer + ajuste por sector / tamaño de la oportunidad. `[OPEN-F20]`: tarifas exactas.
- **Modelo alternativo**: % sobre el valor estimado de la oportunidad (de la valoración indicativa publicada). Sujeto a tope mínimo y máximo. `[OPEN-F20]`.
- La elección del modelo se decide con el usuario en revisión.

#### 9.1.5 Política de retención por la plataforma

- **100% Plataforma** por defecto.
- **No se distribuye Advisory Share sobre Finder Fee** (`[OPEN-F11]` consolidado): el Advisor cobra Advisory Share solo sobre Success Fee.

#### 9.1.6 Política de refund del Finder Fee

- **Refund completo** si el Match resulta inválido por causa imputable a la plataforma (datos incorrectos, vulneración de privacidad demostrada).
- **Refund parcial** si el Match expira sin avanzar a Operation y no es por causa imputable a las partes (`[OPEN-F21]`).
- **No refund** si Buyer y Seller decidieron no avanzar voluntariamente.

### 9.2 Success Fee (comisión por éxito)

#### 9.2.1 Definición

**Success Fee** es la comisión que la plataforma cobra **al cerrarse exitosamente una Operación** (`closing.declared`). Es la **mayor fuente de ingreso de la plataforma** por Operation y compensa toda la cadena de valor (Discovery + Transaction Layer).

#### 9.2.2 Cuándo se activa

- **Evento disparador principal**: `closing.declared` (`TRANSACTION_OS_SPEC §9.2`).
- **Devengo proporcional intermedio (opcional)**: parte puede devengarse al hito `spa.fully_signed` (típicamente 30%) y el resto al `closing.declared`. `[OPEN-F22]`.

#### 9.2.3 Quién paga, quién cobra

- **Paga**: por defecto el **Seller** (parte que obtiene el ingreso económico de la transacción).
- **Alternativa**: Buyer + Seller pueden acordar split en el contrato CIS o en la LOI. Se registra y aplica al cobro.
- **Cobra**: la **plataforma**, con distribución posterior al Advisor (Advisory Share, §9.3) si aplica.

#### 9.2.4 Cálculo

- **Modelo base**: **% sobre el valor final de la transacción** (Enterprise Value cerrado en el SPA). Rango típico mercado M&A: 1–5%.
- **Suelos y techos**: tope mínimo (`floor`) y tope máximo (`cap`) declarados.
- **Banda según plan del Seller**: Subscriber paga % más alto; Corporate / Investor pagan % moderado; Advisor (cuando representa al Seller) negocia % especial.
- `[OPEN-F23]`: % exactos por plan.

#### 9.2.5 Política de cobro

- **Facturación al cierre**: factura emitida en los siguientes X días tras `closing.declared` (`[OPEN-F24]`).
- **Forma de cobro**: vía pasarela configurada o domiciliación bancaria (acordado en CIS).
- **Plazo de pago**: 30 días naturales desde la fecha de factura (estándar B2B en España; ajustar según jurisdicción).
- **Mora**: intereses de demora aplicables según normativa.

#### 9.2.6 Política de refund del Success Fee

- **No refund** una vez cerrada la Operation y declarada `closing`.
- **Refund excepcional** si la Operation se anula judicialmente y la plataforma fue causa material demostrada (`[OPEN-F25]`).

### 9.3 Advisory Share (revenue share para Advisors)

#### 9.3.1 Definición

**Advisory Share** es el porcentaje del Success Fee que se distribuye al **Advisor con mandato activo** en la Operación, cuando dicho Advisor ha participado materialmente en el resultado.

#### 9.3.2 Cuándo se calcula

- **Evento disparador**: `closing.declared` (mismo que Success Fee).
- **Cálculo automático**: tras recibirse el Success Fee del Seller, se aplica el split y se calcula el Advisory Share.

#### 9.3.3 Política de split por defecto

- **70% Advisor / 30% Plataforma** sobre el Success Fee de Operaciones cerradas con su mandato. `[OPEN-F10]`.
- Configurable en el CIS del Advisor (acuerdo individual).
- Aplicable solo a Operaciones donde el Advisor estuvo formalmente vinculado con mandato `active` desde antes del `match.accepted`.

#### 9.3.4 Condiciones de elegibilidad para Advisory Share

- El Advisor debe tener **plan Advisor** (no aplica a Subscriber/Corporate/Investor).
- El Advisor debe tener **mandato activo** sobre el Buyer o el Seller con `status = active` continuo desde antes del Match.
- El Advisor debe haber **firmado el NDA** correspondiente.
- El KYC del Advisor debe estar verificado.

#### 9.3.5 Pago al Advisor

- **Plazo**: dentro de los X días posteriores al cobro efectivo del Success Fee por la plataforma. `[OPEN-F26]` (sugerido: 30 días).
- **Forma**: transferencia bancaria a la cuenta declarada en el CIS del Advisor.
- **Documentación**: el Advisor recibe documento detallado del cálculo (Success Fee bruto, split, importe neto).
- **Facturación inversa**: el Advisor emite factura a la plataforma por el Advisory Share (modelo B2B estándar).

#### 9.3.6 Política de no-pago

- Si el Seller no paga el Success Fee a la plataforma, **el Advisor no cobra Advisory Share** hasta cobro efectivo.
- La plataforma persigue el cobro y notifica al Advisor el estado.
- Eventos `economy.success_fee.payment_pending`, `.payment_received`, `.payment_failed`.

### 9.4 Resumen de los tres mecanismos

| Mecanismo | Evento disparador | Paga | Cobra | Cálculo | Reversibilidad |
|---|---|---|---|---|---|
| Finder Fee | `match.accepted` | Buyer (default) | Plataforma | Importe fijo o % oportunidad | Refund total/parcial según política §9.1.6 |
| Success Fee | `closing.declared` | Seller (default) | Plataforma → Advisor (vía split) | % sobre EV final | No refund salvo excepcional |
| Advisory Share | `closing.declared` + cobro efectivo | Plataforma | Advisor | % sobre Success Fee cobrado | n/a (depende del cobro upstream) |

---

## 10. Revenue Share Plataforma ↔ Advisor (detallado)

### 10.1 Para cada producto donde el Advisor participa

| Producto | Participación Advisor | Revenue Share Plataforma / Advisor | Trigger |
|---|---|---|---|
| P02 Valoración avanzada (en mandato Advisor) | Advisor revisa y promueve a oficial | 100% Plataforma del precio del producto + Advisor cobra honorarios al cliente aparte | Compra del producto por el cliente del Advisor |
| P03 Informe premium (en mandato) | Advisor solicita y revisa | 100% Plataforma + honorarios aparte | Compra |
| P08 Generación de Teaser (en mandato) | Advisor revisa y aprueba para liberación | 100% Plataforma + honorarios aparte | Compra |
| P09 Generación de IM (en mandato) | Advisor revisa y aprueba | 100% Plataforma + honorarios aparte | Compra |
| P10 Due Diligence asistida (en mandato) | Advisor conduce con apoyo del sistema | 100% Plataforma + honorarios aparte | Compra |
| P11 LOI (en mandato) | Advisor prepara y revisa | 100% Plataforma + honorarios aparte | Compra |
| **Success Fee** (al closing) | Advisor con mandato activo | **70% Advisor / 30% Plataforma** | `closing.declared` + Advisor cobra a posteriori |
| **Finder Fee** (al `match.accepted`) | n/a | 100% Plataforma (sin revenue share) | `match.accepted` |

### 10.2 Condiciones generales

- El Advisor cobra Advisory Share **solo sobre Success Fee**.
- Los productos comprados por el cliente del Advisor son ingreso 100% de la plataforma; el Advisor cobra a su cliente sus propios honorarios al margen (modelo de mercado M&A).
- Si dos Advisors participan en la misma Operation (uno por Buyer, uno por Seller), el Advisory Share se calcula sobre el Success Fee de cada parte por separado.

### 10.3 Condiciones especiales para mandatos múltiples

- Advisor con `≥ N mandatos cerrados con éxito` en últimos 12 meses puede negociar split mejorado (`[OPEN-F27]`, sugerido 75/25 a partir de 5 deals/año cerrados).
- Configurado caso por caso en el CIS del Advisor.

### 10.4 Trazabilidad del revenue share

- Cada distribución genera evento `economy.advisory_share.calculated` (al `closing.declared`).
- Cada pago efectivo genera `economy.advisory_share.paid` con cita al evento de cálculo.
- El Advisor consulta su histórico de Advisory Share en panel dedicado (UI Design System).

### 10.5 Política antifraude

- El sistema valida que el Advisor estuvo formalmente vinculado durante toda la Operación.
- Cualquier alteración de mandato post-cierre que pretenda introducir un Advisor "tardío" se detecta y rechaza por `arroba_team`.
- Eventos `economy.advisory_share.disputed` en caso de incidencia, con investigación formal.

---

## 11. Reglas de elegibilidad — Plan + Permisos + Riesgo

### 11.1 Schema canónico de `eligibility_rules`

```yaml
eligibility_rules:
  plan_tier_min: "corporate"          # plan mínimo
  kyc_required: true                  # KYC verificado del usuario / org
  risk_assessment_required: true      # Risk & Compliance Service score aceptable
  admin_whitelist_required: true      # whitelist explícita admin (productos críticos)
  prior_consent_required: false       # consent específico para producto sensible
  min_seniority_org_days: 0           # opcional: tiempo mínimo desde alta de la org
  forbidden_geographies: []           # opcional: sancion / restricción geográfica
```

### 11.2 Aplicación por producto

| Producto | plan_tier_min | kyc | risk | whitelist | prior_consent |
|---|---|---|---|---|---|
| P01 Valoración automática | subscriber | no | no | no | no |
| P02 Valoración avanzada | subscriber+addon | no | no | no | no |
| P03 Informe premium | corporate | no | no | no | no |
| P04 Búsqueda avanzada | subscriber | no | no | no | no |
| P05 Matching | subscriber | **sí** | no | no | no |
| P06 Apertura de operación | subscriber | **sí** | **sí** | no | no |
| P07 Data Room | subscriber | **sí** | no | no | no |
| P08 Generación de Teaser | subscriber | **sí** | no | no | no |
| P09 Generación de IM | subscriber | **sí** | no | no | no |
| P10 Due Diligence asistida | subscriber | **sí** | no | no | no |
| P11 LOI | corporate | **sí** | **sí** | **sí (admin)** | **sí (CIS firmado)** |
| P12 Comparables | subscriber | no | no | no | no |

### 11.3 Flujo operativo de validación

Al solicitar acceso a un producto:

1. El sistema lee `eligibility_rules` del producto.
2. Valida `plan_tier_min` contra el plan activo del usuario / org.
3. Si `kyc_required`, valida que el KYC esté `verified` y vigente.
4. Si `risk_assessment_required`, consulta al Risk & Compliance Service score más reciente (`[OPEN-F28]`: ¿cuánto vive un score? probable 90 días).
5. Si `admin_whitelist_required`, valida que el `admin` de la org cliente o el `admin` plataforma haya aprobado el uso para esta org / usuario.
6. Si `prior_consent_required`, valida que el consentimiento específico (ej. CIS firmado) esté `active`.
7. Si **todo pasa**: el producto se invoca normalmente.
8. Si **algo falla**: el TC verbaliza la condición faltante en lenguaje de producto y guía al usuario hacia el upgrade / paso pendiente.

### 11.4 Verbalización al usuario (ejemplos)

| Condición faltante | Verbalización |
|---|---|
| `plan_tier_min` no alcanzado | *"Este producto está incluido en el plan Corporate o superior. ¿Quieres ver una comparativa de planes?"* |
| KYC no verificado | *"Para acceder a esta función necesito verificar tu identidad (KYC). Es un proceso rápido (5 minutos)."* |
| Risk score insuficiente | *"Tu cuenta requiere una validación adicional antes de habilitar esta función. He notificado al equipo; te contactaremos en X horas."* |
| Whitelist admin no concedida | *"Esta función está pendiente de aprobación de tu administrador. ¿Quieres que le envíe la solicitud automáticamente?"* |
| CIS no firmado | *"Para activar esta función, primero hay que firmar el contrato de servicios (CIS). Te lo paso para revisión."* |

**Ninguna verbalización menciona "criticality", "L3", "L4", "capability" ni "whitelist técnica"**. Todo es lenguaje de producto.

---

## 12. Eventos económicos canónicos

> Todos los eventos del Agentic Layer / Memory Engine viven en `audit.global`. Los eventos económicos llevan prefijo `economy.*` y se persisten con la misma política de retención e inmutabilidad.

### 12.1 Suscripciones

| Evento | Cuándo |
|---|---|
| `economy.subscription.created` | Alta de un nuevo plan (incluye `plan_id`, `user_id`, `org_id`, `payment_method`, `auto_renew`). |
| `economy.subscription.renewed` | Renovación automática exitosa. |
| `economy.subscription.cancelled` | Cancelación voluntaria del usuario. |
| `economy.subscription.upgraded` | Cambio a plan superior (incluye `from`, `to`, `prorate_amount`). |
| `economy.subscription.downgraded` | Cambio a plan inferior. |
| `economy.subscription.paused` | Suspensión por fallo de pago. |
| `economy.subscription.reactivated` | Reactivación tras suspensión. |
| `economy.subscription.expired` | Fin definitivo del ciclo sin renovación. |

### 12.2 Créditos

| Evento | Cuándo |
|---|---|
| `economy.credits.granted` | Concesión de créditos (alta de plan, promoción, compensación). |
| `economy.credits.purchased` | Compra de bolsa de créditos. |
| `economy.credits.consumed` | Consumo de créditos al usar un producto (incluye `product_id`, `credits_used`, `correlation_id`). |
| `economy.credits.expired` | Caducidad de créditos no consumidos. |
| `economy.credits.refunded` | Reembolso de créditos al usuario (compensación, refund de cargo). |
| `economy.credits.transferred` | Transferencia entre seats de una organización (si la política lo permite). |

### 12.3 Productos consumidos

| Evento | Cuándo |
|---|---|
| `economy.product.consumed` | Cada vez que se entrega un producto. Incluye `product_id`, `plan_id`, `user_id`, `org_id`, `operation_id?`, `credits_or_eur`, `quota_remaining`. |
| `economy.product.quota_warning` | Cuando la cuota de un producto alcanza 80% o 95% (notificación previa). |
| `economy.product.quota_exhausted` | Cuando la cuota se agota. Inicia política de overage. |

### 12.4 Overage

| Evento | Cuándo |
|---|---|
| `economy.overage.triggered` | Cuando un producto en overage activa diálogo con el usuario. |
| `economy.overage.confirmed` | Usuario confirma cobro extra. |
| `economy.overage.deferred` | Usuario decide esperar al próximo ciclo. |
| `economy.overage.blocked` | Producto crítico bloqueado por falta de whitelist o plan insuficiente. |
| `economy.overage.degraded` | Producto baja a modo básico automáticamente (criticidad baja/media). |

### 12.5 Fees y Revenue Share

| Evento | Cuándo |
|---|---|
| `economy.finder_fee.calculated` | Al `match.accepted`, calculado el importe del Finder Fee. |
| `economy.finder_fee.charged` | Cobro emitido. |
| `economy.finder_fee.paid` | Cobro recibido por la plataforma. |
| `economy.finder_fee.refunded` | Refund total o parcial aplicado. |
| `economy.success_fee.calculated` | Al `closing.declared`, calculado el Success Fee. |
| `economy.success_fee.charged` | Factura emitida. |
| `economy.success_fee.payment_pending` | Plazo de pago en curso. |
| `economy.success_fee.payment_received` | Cobro efectivo recibido. |
| `economy.success_fee.payment_failed` | Pago rechazado o vencido sin abono. |
| `economy.success_fee.refunded` | Refund excepcional. |
| `economy.advisory_share.calculated` | Cálculo del Advisory Share tras cobro del Success Fee. |
| `economy.advisory_share.scheduled_payout` | Pago programado al Advisor. |
| `economy.advisory_share.paid` | Pago efectivo al Advisor. |
| `economy.advisory_share.disputed` | Disputa o anomalía detectada. |

### 12.6 Refunds

| Evento | Cuándo |
|---|---|
| `economy.refund.requested` | Solicitud del usuario o de `arroba_team`. |
| `economy.refund.approved` | Aprobación por `arroba_team` o automática (dentro de 14 días). |
| `economy.refund.executed` | Refund aplicado por la pasarela. |
| `economy.refund.rejected` | Solicitud rechazada con razón. |

### 12.7 Pasarela

| Evento | Cuándo |
|---|---|
| `economy.gateway.charge_initiated` | Inicio de cobro vía pasarela. |
| `economy.gateway.charge_succeeded` | Cobro exitoso confirmado por la pasarela. |
| `economy.gateway.charge_failed` | Cobro rechazado por la pasarela. |
| `economy.gateway.payout_initiated` | Inicio de pago (típicamente Advisory Share). |
| `economy.gateway.payout_succeeded` | Pago confirmado. |
| `economy.gateway.payout_failed` | Pago rechazado. |
| `economy.gateway.webhook_received` | Webhook entrante de la pasarela (con `event_kind` externo). |

### 12.8 Campos comunes

Cada evento económico lleva:

- `event_id` (UUID).
- `event_type` (de los catalogados).
- `timestamp` (ISO 8601 UTC).
- `correlation_id` (liga al flujo conversacional o al evento del TOS upstream).
- `parent_event_id` (evento que disparó este; típicamente del TOS o del Memory Engine).
- `user_id`, `org_id`.
- `plan_id` (si aplica).
- `product_id` (si aplica).
- `operation_id` (si aplica — eventos atados a Operation).
- `amount_eur` (importe).
- `currency` (default EUR).
- `metadata` (jsonb con detalle según evento).

---

## 13. Trazabilidad económica

### 13.1 Persistencia

Cada evento económico se persiste en `audit.global` (`MEMORY_ENGINE_SPEC §4.10`), siguiendo política inmutable append-only (`MEMORY_ENGINE_SPEC §3.5`).

### 13.2 Retención

Alineada con normativa contable española / UE y con la política general del Memory Engine:

| Tipo de evento | Retención mínima |
|---|---|
| Eventos vinculados a Operation (`operation_id` no nulo) | **10 años post-cierre de la Operation** (`MEMORY_ENGINE_SPEC §4.10`) |
| Eventos de suscripción y facturación general | **7 años** (normativa contable española estándar; ajustar según jurisdicción) |
| Eventos de fees y revenue share | 10 años (parte del audit de Operation) |
| Eventos de refund | 7 años |
| Eventos de gateway (webhooks, reconciliación) | 7 años |

`[OPEN-F29]`: validación final de plazos con asesoría jurídica y contable.

### 13.3 Visibilidad

| Rol | Qué puede ver |
|---|---|
| Usuario individual | Su propio histórico económico (consumo, cargos, refunds, créditos). |
| Owner / Admin de org | Histórico agregado de la org + por seat (con respeto a privacidad). |
| `arroba_team` | Consultas agregadas anonimizadas para detección de patrones; acceso individual solo con mediación de disputa formal. |
| `admin` | Acceso completo bajo doble factor + audit reforzado. |
| Auditor externo (regulatorio) | Acceso bajo solicitud formal según normativa. |

### 13.4 GDPR y datos personales

- El **derecho al olvido** afecta a **la atribución** (anonimización de `user_id` → `redacted_user_<hash>`), no a los **importes contables** ni a los **hechos económicos** (que tienen retención obligatoria por ley contable).
- Tras solicitud GDPR válida, los eventos económicos asociados al usuario se mantienen pero su atribución personal se redacta.
- Documentos legales asociados (facturas, recibos) siguen política de retención obligatoria; PII en ellos se redacta si la normativa lo permite.

### 13.5 Reconciliación con la pasarela

- El sistema reconcilia diariamente sus eventos `economy.*` con los registros de la pasarela externa.
- Discrepancias generan alerta interna a `arroba_team` para investigación.
- Mecanismo configurable (`[OPEN-F30]`).

### 13.6 Reportes regulatorios

- Reportes anuales para autoridades fiscales (modelo según jurisdicción).
- Reportes de facturación electrónica si la jurisdicción lo requiere.
- Reportes regulatorios M&A si aplican (algunas jurisdicciones requieren reporte de transacciones por encima de umbral).
- Detalle operativo de cada reporte vive en spec dedicado de Compliance (P0 fuera Sprint 0).

---

## 14. Mapeo interno PRODUCTO → CAPABILITIES (documentación técnica, no user-facing)

> **AVISO DESTACADO**: esta sección es **documentación técnica de implementación** exclusivamente para los equipos que construyen el sistema. **No se expone al usuario. No aparece en la factura. No se referencia en planes ni cuotas comerciales.** Sirve únicamente para que los equipos sepan qué piezas internas activar al entregar cada producto.
>
> **Esta sección y la §6 son las únicas** donde aparecen identificadores `CAP-XXX` y niveles `L1`–`L4` en este spec.

### 14.1 Tabla canónica

| product_id | nombre del producto | capabilities internas usadas | niveles agénticos default | productos relacionados |
|---|---|---|---|---|
| **P01** | Valoración automática | CAP-016, CAP-018 | L2 | P02, P12 |
| **P02** | Valoración avanzada | CAP-017, CAP-018, CAP-020, CAP-019 | L2, L3 | P01, P12 |
| **P03** | Informe premium | CAP-001, CAP-002, CAP-022, CAP-025 | L2, L3 | P10 |
| **P04** | Búsqueda avanzada | CAP-010, CAP-011, CAP-014 | L1, L2 | P05, P12 |
| **P05** | Matching | CAP-012, CAP-013, CAP-015 | L2, L3, L4 (si autorización Recomendaciones automáticas) | P04, P06 |
| **P06** | Apertura de operación | — (transición TOS `match.accepted → operation.created`, no capability per se) | — | depende de productos T7+ |
| **P07** | Data Room | CAP-004, CAP-005, CAP-023 | L2, L4 (clasificación masiva si autorizado) | P10 |
| **P08** | Generación de Teaser | CAP-007 | L2, L3 | — |
| **P09** | Generación de IM | CAP-008 | L2, L3 | P07 |
| **P10** | Due Diligence asistida | CAP-004, CAP-022, CAP-023, CAP-024, CAP-025 | L2, L3 | P03, P07 |
| **P11** | LOI | CAP-021, CAP-019 | L2, **L3 con whitelist admin obligatoria (default-deny en su ausencia)** | P02, P10 |
| **P12** | Comparables | CAP-018, CAP-014 | L2 | P01, P02 |

### 14.2 Notas técnicas por producto

**P01 — Valoración automática**
- Capability principal: CAP-016 (Valoración indicativa) determinista, sin LLM.
- Apoyo: CAP-018 (Comparables) para enriquecer el cálculo.
- Tipo de criticidad mapeado: Media.
- Reversibilidad: reversible (recalculable).

**P02 — Valoración avanzada**
- Multi-capability: CAP-017 (Valoración avanzada multi-método), CAP-018 (Comparables), CAP-020 (Sensibilidades), CAP-019 (Estructuras de precio y earn-out).
- Tipo de criticidad: Alta.
- Reversibilidad: reversible (recalculable) / compensable (si afecta a negociación en curso).

**P03 — Informe premium**
- Combinación de narrativa (CAP-001), insights (CAP-002), riesgos (CAP-022) e informes consolidados (CAP-025).
- Criticidad: Alta.
- Reversibilidad: reversible (regenerable).

**P04 — Búsqueda avanzada**
- Capability principal: CAP-010 (Sectorial), CAP-011 (Territorial), CAP-014 (Benchmarks).
- Criticidad: Baja.
- Reversibilidad: reversible.

**P05 — Matching**
- Multi-capability: CAP-012 (Matching cuantitativo), CAP-013 (Screenings), CAP-015 (Recomendaciones).
- Niveles: L2 estándar; L4 si el usuario habilita explícitamente "Recomendaciones automáticas" (autorización L4 sobre `user.{id}` con expiración).
- Criticidad: Media.
- Reversibilidad: reversible / compensable.

**P06 — Apertura de operación**
- No es capability per se; es la **transición TOS** `match.accepted → operation.created` (`TRANSACTION_OS_SPEC §6.7`).
- El motor crea la entidad Operation, abre Deal Workspace, activa los productos T7+.
- Criticidad mapeada: Alta (es el inicio del Transaction Layer).
- Reversibilidad: no aplica al producto en sí; sí aplica a las acciones internas de la Operación.

**P07 — Data Room**
- Capabilities: CAP-004 (Resumir DD), CAP-005 (Clasificar documentos), CAP-023 (Detectar documentación faltante).
- L4 candidato para CAP-005 (clasificación masiva sin confirmación por documento) y CAP-023 (notificación automática al Seller).
- Criticidad: Media.
- Reversibilidad: reversible (reclasificar) / compensable (corregir falsa alarma).

**P08 — Generación de Teaser**
- Capability: CAP-007 (Redactar Teaser anonimizado).
- Compensable: existe procedimiento de retirar Teaser del marketplace + notificar Buyers que lo consultaron.
- Criticidad: Alta.

**P09 — Generación de IM**
- Capability: CAP-008 (Preparar IM).
- Compensable: IM puede retirarse de Buyers que aún no firmaron NDA.
- Criticidad: Alta.

**P10 — Due Diligence asistida**
- Multi-capability: CAP-004 (resúmenes), CAP-022 (riesgos), CAP-023 (gap analysis), CAP-024 (preguntas DD), CAP-025 (informes consolidados).
- Criticidad: Alta.
- Reversibilidad: reversible (gap analysis recalculable, preguntas retirables antes de envío).

**P11 — LOI**
- Capability principal: CAP-021 (Preparar LOI/NBO).
- Apoyo: CAP-019 (Estructuras de precio).
- **Criticidad: Crítica**. Default-deny en L3+ sin whitelist `admin`.
- Reversibilidad: compensable (LOI puede retirarse antes de firmar).

**P12 — Comparables**
- Capabilities: CAP-018 (Comparables de transacciones), CAP-014 (Benchmarks sectoriales).
- Criticidad: Media.
- Reversibilidad: reversible.

### 14.3 Datos que el equipo de implementación necesita

- **Schema de capability** declarado en `AGENTIC_LAYERS_SPEC §5` (max_level, current_level, criticality, reversibility, etc.).
- **Schema de autorización L4** declarado en `AGENTIC_LAYERS_SPEC §6`.
- **Matriz `criticality × level`** en `AGENTIC_LAYERS_SPEC §10` (regula audit, alerting, cuotas).
- **Eventos canónicos del Agentic Layer** en `AGENTIC_LAYERS_SPEC §13`.

### 14.4 Reglas estrictas para esta sección

1. Esta sección **NO se enlaza** desde mensajes al usuario, paywalls, UI comercial o factura.
2. El equipo de implementación lee esta sección al diseñar el motor de billing y el orquestador de productos.
3. Cambios en el mapeo `producto → capabilities` (porque una capability cambia, se añade o se quita) **no implican cambios en la cara comercial del producto**: el producto sigue siendo el mismo, su precio sigue siendo el mismo. Lo que cambia es lo que el motor activa internamente.

---

## 15. Boundary First — pasarela de pago y dependencias

### 15.1 Filosofía

El spec define **contratos**. La materialización (Stripe, otras pasarelas, KYC/AML, facturación electrónica) vive en la capa de Implementación. Esta sección declara qué componentes son externos y qué contratos se exigen.

### 15.2 Stripe como dependencia primaria (estado actual)

- Stripe ya está **instalado en el entorno** (según `_INVENTORY_2026.md`), aunque sin uso real al momento de este spec.
- Stripe será la pasarela primaria por defecto en v1.0.0.
- Estructura conceptual: el sistema mantiene su propio modelo de **productos y suscripciones**; Stripe se usa como **proveedor de cobro**, no como source of truth de planes.
- Sincronización: cada evento `economy.*` se mapea a un evento Stripe (charge, subscription update, refund) y se reconcilia diariamente.

### 15.3 Otras pasarelas (futuro)

- El spec **no se cierra a Stripe**. Cualquier pasarela compatible con los eventos canónicos (`economy.gateway.*`) puede materializarse.
- Posibles futuras: Adyen, PayPal, transferencia bancaria SEPA, BBVA o Santander para empresas.
- `[OPEN-F31]`: prioridad de pasarelas adicionales tras Stripe.

### 15.4 Contratos exigidos a cualquier pasarela

- **Webhooks confiables**: la pasarela debe notificar cobros exitosos, fallidos, refunds, disputas. El sistema persiste cada webhook como `economy.gateway.webhook_received`.
- **Idempotencia**: reintentos del sistema o de la pasarela no deben duplicar cobros (clave de idempotencia `correlation_id`).
- **Soporte de suscripciones**: renovación automática, prorrateo en upgrade/downgrade, cancelación con efecto al final del ciclo.
- **Soporte de payouts**: pagos a terceros (Advisor) en cuenta declarada.
- **PCI-DSS compliance**: los datos sensibles de tarjeta no transitan por nuestro backend (siempre vía pasarela).

### 15.5 KYC / AML como dependencia externa

- KYC/AML se materializa con servicio externo dedicado (Stripe Identity, Onfido, Sumsub u otro). `[OPEN-F32]`.
- El sistema recibe del servicio externo el estado: `unverified`, `pending`, `verified`, `rejected`, `expired`.
- Eventos canónicos del lado nuestro: `kyc.requested`, `kyc.completed`, `kyc.expired`, `kyc.rejected`.
- El estado KYC se persiste como atributo del usuario / org y se consulta en `eligibility_rules` (§11).

### 15.6 Facturación electrónica

- Generación de factura legal (PDF firmado, formato Facturae si jurisdicción española lo exige, eFactura en otras jurisdicciones) vive en servicio externo dedicado.
- El sistema dispara el evento `economy.invoice.requested` con todos los datos; el servicio externo genera y devuelve la factura firmada.
- La factura se persiste en `org.{id}.invoices[]` con retención legal contable.
- `[OPEN-F33]`: elección del proveedor de facturación electrónica.

### 15.7 Notificaciones de cobros

- Notificaciones al usuario (email, push, in-app) de eventos económicos pasan por el sistema de notificaciones general (`AGENTIC_LAYERS_SPEC §14.3`).
- Todas pasan por **voz única** del TC; ningún facturador habla directamente al usuario.

### 15.8 Recaudación pendiente y morosidad

- Cuando un cobro queda pendiente más allá del plazo:
  - Se activa flujo de recordatorio automático (configurable, default 3 recordatorios en 30/60/90 días).
  - Tras tope, escalado a `arroba_team` para gestión humana.
  - Intereses de demora aplicables según normativa.
- Eventos: `economy.collection.reminder_sent`, `economy.collection.escalated`, `economy.collection.late_fees_applied`.

---

## 16. Integración con specs ya cerrados (cierre Sprint 0)

> Este es el **último spec del Sprint 0**. Esta sección documenta qué consume MONETIZATION de cada spec previo y completa el ciclo de las **6 piezas canónicas**.

### 16.1 De `TRANSACTION_OS_SPEC v1.1.0` (0.1)

| Insumo | Uso en este spec |
|---|---|
| **Eventos canónicos del ciclo** (`match.accepted`, `nda.fully_signed`, `loi.fully_signed`, `spa.fully_signed`, `closing.declared`, `integration.completed`) | Disparadores de eventos económicos: `match.accepted → economy.finder_fee.*` ; `closing.declared → economy.success_fee.* + economy.advisory_share.*` ; `integration.completed → cierre de la facturación de la Operation` |
| **Fases T1–T15** | Determinan en qué fase aplica cada producto (campo `phase_in_TOS` de cada producto en §4) |
| **Inmutabilidad post-firma** (`ENTITY_MODEL.md §7.3`) | El sistema no permite revertir eventos económicos asociados a transiciones post-firma sin proceso formal |
| **Discovery Layer vs Transaction Layer** | El catálogo distingue productos de Discovery (P04, P05, P12 + P01-P02 indicativos) de productos de Transaction (P06–P11) |

### 16.2 De `TRANSACTION_COPILOT_SPEC v1.1.0` (0.2)

| Insumo | Uso en este spec |
|---|---|
| **Voz única (B6)** | El TC verbaliza todo el comercial al usuario: cuotas, upgrades, cobros, refunds, recordatorios. Ningún componente económico habla por separado. |
| **Working Context** | El TC consulta cuotas y elegibilidad antes de delegar a un especialista. Si la cuota no permite, ofrece overage / upgrade en lenguaje de producto. |
| **Naturalidad y proactividad** | El TC informa proactivamente sobre estado de créditos, próximas renovaciones, oportunidades de upgrade — siempre con tacto, sin convertirse en agente comercial agresivo. |

### 16.3 De `COPILOTS_SPEC v1.0.0` (0.3)

| Insumo | Uso en este spec |
|---|---|
| **Las 29 capabilities** | Son las piezas internas que activamos para entregar cada producto. El mapeo está en §14 (técnico). |
| **Cuándo se invoca cada especialista** | Determina el orden y la composición que el motor sigue al servir un producto. |
| **Outputs estructurados** | El motor de billing puede leer el output del especialista (tamaño, confidence, complejidad) para refinar el coste en créditos dentro del rango declarado. |

### 16.4 De `MEMORY_ENGINE_SPEC v1.0.0` (0.4)

| Insumo | Uso en este spec |
|---|---|
| **Persistencia** | Todos los eventos `economy.*` se persisten en `audit.global` (`MEMORY_ENGINE_SPEC §4.10`). |
| **Retención** | 10 años post-cierre Operation; 7 años eventos generales (§13). |
| **Inmutabilidad** | Audit append-only; rectificaciones con eventos `audit.correction`. |
| **GDPR** | El derecho al olvido anonimiza atribución, no importes (§13.4). |
| **4 reglas B3** | El motor de billing respeta el aislamiento: no expone consumo cross-org, cross-side, cross-cliente-Advisor. |

### 16.5 De `AGENTIC_LAYERS_SPEC v1.0.0` (0.5)

| Insumo | Uso en este spec |
|---|---|
| **Niveles agénticos (L1–L4)** | Internos al motor; **nunca user-facing**. Sirven para mapear productos a capabilities con el nivel adecuado. |
| **Criticidad de la capability** | Determina la política de overage (§6) internamente; se traduce a lenguaje de producto para el usuario. |
| **Schema de autorización L4** | Cuando un producto requiere autorización L4 (CAP-014 actualización semanal de benchmarks, CAP-015 Recomendaciones automáticas, etc.), el schema rige. El producto comercial lo abstrae como "Recomendaciones automáticas activadas". |
| **Kill-switch** | El usuario puede activarlo desde su panel; comercialmente se llama "Desactivar automatizaciones de esta Operación". |
| **Reversibilidad** | Determina la política de refund del producto: productos reversibles permiten refund parcial; compensables permiten compensación; irreversibles requieren whitelist + doble confirmación. |
| **Default-deny criticidad Crítica + L3+** | Materializa el `admin_whitelist_required` en P11 (LOI). |
| **Eventos canónicos `agentic.*`** | Vinculados a `economy.*` vía `correlation_id` común. |

### 16.6 Tabla resumen del ciclo

```
TRANSACTION_OS (0.1) ──► eventos ciclo (match.*, *.signed, closing.*) 
                                      │
                                      ▼
TRANSACTION_COPILOT (0.2) ──► voz única, consulta cuotas antes de delegar
                                      │
                                      ▼
COPILOTS (0.3) ──► capabilities internas
                                      │
                                      ▼
AGENTIC_LAYERS (0.5) ──► nivel agéntico + criticidad + reversibilidad + autorización L4
                                      │
                                      ▼
MEMORY_ENGINE (0.4) ──► persistencia audit + retención + GDPR
                                      │
                                      ▼
MONETIZATION (0.6) ──► PRODUCTOS · PLANES · CRÉDITOS · FEES · REVENUE SHARE
                                      │
                                      ▼
                              Usuario (lenguaje de producto)
```

### 16.7 Cierre del Sprint 0

Con este spec, el Sprint 0 queda **completo en sus 6 piezas canónicas**:

| # | Spec | Foco | Estado |
|---|---|---|---|
| 0.1 | TRANSACTION_OS | El ciclo M&A canónico (15 fases) | ✅ |
| 0.2 | TRANSACTION_COPILOT | El orquestador (voz única) | ✅ |
| 0.3 | COPILOTS | Los 4 especialistas (29 capabilities) | ✅ |
| 0.4 | MEMORY_ENGINE | El motor único de memoria | ✅ |
| 0.5 | AGENTIC_LAYERS | La autonomía controlada (L1–L4) | ✅ |
| 0.6 | MONETIZATION | El contrato económico (productos, fees, planes) | ✅ |

La siguiente fase (fuera del Sprint 0) será la **actualización canónica** de `ARROBA_PHILOSOPHY.md`, `ENTITY_MODEL.md` y `ENTITY_FRAMEWORK.md` para integrar las decisiones de estos 6 specs. Pendiente de aprobación explícita del usuario.

---

## 17. Open Questions

> Numeración F1-Fn (F = Spec 0.6). NO se inventan precios concretos; los valores económicos quedan como `TBD` o `[OPEN]` hasta cierre con el usuario.

| ID | Pregunta | Propuesta del spec | Estado |
|---|---|---|---|
| **F1** | Plazos exactos de refund (immediate / conditional / no-refund) — validación con asesoría jurídica española y UE | Inicial: 14 días immediate / 90 días conditional / >90 días no-refund excepcional | ABIERTO — asesoría legal |
| **F2** | Precio mensual del plan Subscriber | `TBD` | ABIERTO — pricing |
| **F3** | Precio anual del plan Subscriber con descuento por compromiso | `TBD (≈15% descuento sobre 12× mensual)` | ABIERTO — pricing |
| **F4** | Créditos incluidos por mes en Subscriber | `TBD (sugerido: 50–100)` | ABIERTO — pricing |
| **F5** | Precio del crédito unitario en overage Subscriber | `TBD` | ABIERTO — pricing |
| **F6** | Tope máximo de `expires_at − granted_at` autorización L4 en Subscriber | 30 días (más bajo que tope general 90 días) | ABIERTO — confirmación |
| **F7** | Precio mensual del plan Corporate | `TBD` | ABIERTO — pricing |
| **F8** | Precio anual del plan Corporate con descuento | `TBD (≈20% descuento)` | ABIERTO — pricing |
| **F9** | Créditos incluidos por mes en Corporate | `TBD (sugerido: 500–1000)` | ABIERTO — pricing |
| **F10** | % default del Advisory Share | 70% Advisor / 30% Plataforma | ABIERTO — confirmación |
| **F11** | ¿Se distribuye Advisory Share sobre Finder Fee? | No (100% Plataforma sobre Finder Fee) | CERRADO — confirmación |
| **F12** | Precios de las bolsas de créditos | `TBD` (S=50 créditos, M=200, L=1000, XL=5000) | ABIERTO — pricing |
| **F13** | ¿Conversión de Finder/Success Fee en créditos para uso posterior? | Posibilidad futura, no en v1.0.0 | ABIERTO — roadmap |
| **F14** | Caducidad de créditos adquiridos en bolsa | 12 meses default, configurable por plan | ABIERTO — confirmación |
| **F15** | Roll-over de créditos de plan no consumidos | Subscriber: no; Corporate/Investor: hasta 50%; Advisor: hasta 100% | ABIERTO — confirmación |
| **F16** | Descuento por compromiso anual por plan | ≈15% Subscriber, ≈20% Corporate/Investor, ≈25% Advisor | ABIERTO — pricing |
| **F17** | Distribución de cuotas en orgs con `seats > 1`: ¿pool común o por usuario? | Configurable por org; default pool común | ABIERTO — confirmación |
| **F18** | Criterios exactos para reducir/eliminar Finder Fee si hubo contacto previo Buyer-Seller documentado | Mediación de `arroba_team` ante declaración formal en Solicitud | ABIERTO — política |
| **F19** | Detalles operativos del split Buyer-Seller del Finder Fee | Registrado en el Match con consentimiento de ambas partes | ABIERTO — política |
| **F20** | Modelo de cálculo del Finder Fee (importe fijo vs % oportunidad) y tarifas exactas | `TBD` — decisión con el usuario | ABIERTO — pricing |
| **F21** | Refund parcial del Finder Fee cuando Match expira sin avanzar | Política diferenciada según causa | ABIERTO — política |
| **F22** | Devengo intermedio del Success Fee al `spa.fully_signed` | Opcional, ~30% intermedio | ABIERTO — política comercial |
| **F23** | % exactos del Success Fee por plan del Seller | `TBD` — rango M&A 1–5% | ABIERTO — pricing |
| **F24** | Plazo de emisión de factura tras `closing.declared` | `TBD` (sugerido: 7 días) | ABIERTO — política operativa |
| **F25** | Refund excepcional del Success Fee si Operation se anula judicialmente | Sujeto a revisión caso por caso por `admin` | ABIERTO — política |
| **F26** | Plazo de pago de Advisory Share al Advisor tras cobro Success Fee | `TBD` (sugerido: 30 días) | ABIERTO — política operativa |
| **F27** | Split mejorado para Advisors con muchos deals cerrados | `TBD` (sugerido: 75/25 a partir de 5 deals/año) | ABIERTO — política |
| **F28** | Vigencia de un risk score del Risk & Compliance Service | `TBD` (sugerido: 90 días) | ABIERTO — confirmación |
| **F29** | Validación final de plazos de retención de eventos económicos con asesoría jurídica/contable | Inicial: 10/7 años | ABIERTO — asesoría legal |
| **F30** | Mecanismo de reconciliación diaria con pasarela | `TBD` — diferido a implementación | ABIERTO — implementación |
| **F31** | Prioridad de pasarelas adicionales tras Stripe | `TBD` — Adyen, PayPal, transferencia SEPA candidatos | ABIERTO — roadmap |
| **F32** | Proveedor de KYC/AML elegido | `TBD` — Stripe Identity, Onfido, Sumsub candidatos | ABIERTO — implementación |
| **F33** | Proveedor de facturación electrónica | `TBD` — depende de jurisdicción primaria | ABIERTO — implementación |
| **F34** | ¿Existe modalidad freemium en v1.0.0 (más allá de Anonymous)? | Propuesta: no en v1.0.0; Anonymous es el límite gratuito | ABIERTO — confirmación |
| **F35** | Política de descuentos por volumen (orgs con muchas Operations) | `TBD` — descuento progresivo por número de Operations cerradas | ABIERTO — política comercial |
| **F36** | ¿Cómo se factura cuando una Operation involucra entidades de jurisdicciones distintas? | Default: factura desde la jurisdicción de la plataforma (España); ajustar según residencia del cliente | ABIERTO — fiscal |
| **F37** | Política de pagos partidos (Buyer y Seller comparten Finder/Success Fee) | Configurable en CIS; default 100% Buyer Finder + 100% Seller Success | ABIERTO — confirmación |
| **F38** | ¿Productos hereditarios por mandato (un Advisor "regala" un add-on a su cliente)? | Posibilidad futura, no en v1.0.0 | ABIERTO — roadmap |

### 17.1 Cumplimiento del Principio de Desacoplamiento — auditoría interna

Como exige el Principio 3.10 y la regla estricta del brief, este spec audita activamente sus menciones a conceptos arquitectónicos internos.

| Sección | Menciones a `CAP-XXX` | Menciones a `L1`–`L4` / "criticidad técnica" | Justificación |
|---|---|---|---|
| §1 Propósito y alcance | 0 | 0 | Comercial estricto |
| §2 Glosario | 0 | 0 (menciones a "Lenguaje de usuario" y "Lenguaje técnico" como conceptos, no como uso) | Comercial estricto |
| §3 Principios canónicos | 0 (sólo en ejemplos de traducción §3.3 mostrando contrate antipatrones) | 0 | Comercial; los ejemplos de §3.3 muestran cómo NO hablar al usuario, no introducen el concepto al usuario |
| §4 Catálogo de productos | **12** (uno por producto, en sub-sección `internal_mapping` claramente etiquetada como técnica) | **12** (mismo bloque, etiquetada como técnica) | Documentación técnica explícitamente delimitada dentro de cada producto |
| §5 Catálogo de planes | 0 | 0 | Comercial estricto |
| §6 Política de overage | 0 | **1 columna en la tabla** ("Criticidad técnica interna") **acompañada siempre de su traducción** a lenguaje de usuario | Único punto donde la criticidad técnica aparece transitoriamente, con traducción inmediata. Cumple Principio de Desacoplamiento al ofrecer mapeo explícito |
| §7 Créditos | 0 | 0 | Comercial estricto |
| §8 Suscripciones | 0 | 0 | Comercial estricto |
| §9 Fees | 0 | 0 | Comercial estricto |
| §10 Revenue Share | 0 | 0 | Comercial estricto |
| §11 Reglas elegibilidad | 0 | 0 | Comercial estricto |
| §12 Eventos económicos | 0 | 0 | Técnico de eventos `economy.*`, ningún `CAP-XXX` ni nivel agéntico |
| §13 Trazabilidad | 0 | 0 | Comercial / regulatorio |
| **§14 Mapeo interno** | **~30** (mapeo completo) | **~12** (niveles por producto) | **Sección explícitamente etiquetada como documentación técnica de implementación, NO user-facing** |
| §15 Boundary First | 0 | 0 | Técnico de pasarelas |
| §16 Integración con specs | **~30** (citando capabilities y niveles solo donde §14 y §5/6/7/8 lo justifican) | **~10** | Cierre del ciclo Sprint 0; cita capabilities y niveles como insumos técnicos que MONETIZATION consume |
| §17 Open Questions | 0 | 0 (1 mención implícita a "criticality" en F23) | Comercial estricto |

**Conclusión**: el Principio de Desacoplamiento se cumple. Las únicas secciones donde aparecen `CAP-XXX` o `L1`–`L4` son **§14 (mapeo interno, explícitamente técnica), §6 (política de overage con traducción inmediata al lenguaje de producto), §4 (sub-sección `internal_mapping` por producto, etiquetada técnica)** y **§16 (integración con specs predecesores, donde el insumo técnico es relevante para documentar la coherencia)**. **Ninguna sección comercial pura menciona arquitectura interna al usuario.**

---

> **Fin del documento.** — `v1.0.0` — pendiente de revisión humana.
>
> **Cierre del Sprint 0**: con este spec, las 6 piezas canónicas (`TRANSACTION_OS`, `TRANSACTION_COPILOT`, `COPILOTS`, `MEMORY_ENGINE`, `AGENTIC_LAYERS`, `MONETIZATION`) están completas y listas para revisión final humana antes de la fase de actualización canónica de `ARROBA_PHILOSOPHY.md`, `ENTITY_MODEL.md` y `ENTITY_FRAMEWORK.md`.
