# ACC — Cuenta de Usuario

> Especificación funcional — Documento propio (`cuenta_v1`)

**Status:** Living Document
**Owner:** ARROBA Product Team
**Audience:** Product · UX · Frontend · Backend · Data · QA
**Source of Truth:** Este documento constituye la especificación funcional oficial de las pantallas canónicas **Ajustes** (#8) y **Perfil de usuario** (#9) de `CANONICAL_SCREENS.md`.

```yaml
title: "ACC — Cuenta de Usuario"
document_type: "Especificación funcional de producto (Source of Truth funcional)"
company: "arroba.com"
version: "0.2 (Implementado 2026-09-10 — ver sección Implementación)"
owner: "ARROBA Product Team"
audience: ["Product", "UX", "Frontend", "Backend", "Data", "QA"]
language: "es"
created: "2026-09-10"
updated: "2026-09-10"
scope: "Comportamiento funcional de Ajustes (#8) y Perfil de usuario (#9). No describe código, frameworks, arquitectura técnica ni infraestructura."
source_of_truth_for: "Cuenta de Usuario (transversal a la plataforma, no a una empresa)"
sibling_document: "memory/sources/empresa_v1/ACC_v0.1.md — especificación de la Ficha de Empresa. Documento hermano, no fusionado (ver Decisión DA-14005)."
components_defined: 10
```

## Por qué documento propio y no un capítulo de `ACC_v0.1.md`

`ACC_v0.1.md` especifica componentes de la **Ficha de Empresa** (rangos `COMP-1000` a `COMP-13003`). Cuenta de Usuario no describe una empresa: describe al propio usuario y su relación con arroba como plataforma, y es transversal a todas las fichas. Mezclarlo en el mismo documento habría forzado una numeración y un alcance que no le corresponden. Decisión de Daniel, 2026-09-10 (ver DA-14005).

## Cómo leer este documento

Sigue la misma metodología de 12 campos (Objetivo, Responsabilidad, Referencia visual, Elementos, Estados, UX Behaviour, Business Rules, Arroba Intelligence, Integración Backend, Dependencias, Casos especiales, Acceptance Criteria, Relación con otros componentes) definida en `ACC_v0.1.md` §2. Cada componente usa solo los campos que le aplican — no todos los componentes necesitan los 12.

## Convenciones

- Nomenclatura: `COMP-XXXX`, igual que en `ACC_v0.1.md`.
- Numeración: rango `14000`, reservado y libre en la numeración de `ACC_v0.1.md` (el rango más alto usado allí es `13003`).
- Estados de componente: Loading, Ready, Partial, Empty, Error, No Permission, Premium Locked.

## Estado real de partida (histórico)

`Ajustes` y `Perfil de usuario` eran pantallas canónicas activas (`CANONICAL_SCREENS.md` #8 y #9) pero hasta el 2026-09-10 eran `EmptyStateBlock` placeholder: "Idioma, tema y notificaciones llegarán en una sub-fase posterior" / "La edición del perfil llegará en una sub-fase posterior". Este documento fue la especificación funcional de lo que debía reemplazar esos placeholders. Ver "Implementación — 2026-09-10" para el estado real actual.

## Alcance de implementación — Sprint 1

Las 10 piezas de este documento se abordaron como una única épica, sin fases (decisión Daniel, 2026-09-10). Implementadas directamente por Claude sobre el código de Beta (frontend Next.js), sin pasar por Emergent — decisión explícita de Daniel, 2026-09-10.

## Implementación — 2026-09-10

Las 10 piezas se implementaron directamente sobre `Beta-7926/frontend`, reemplazando el `EmptyStateBlock` de `perfil/page.tsx` y `ajustes/page.tsx` por los componentes reales descritos abajo. Verificado: `tsc --noEmit` limpio, `eslint` limpio, sin regresiones en `org-switcher.test.tsx`.

### Real y cableado a backend (Intel/Beta), no placeholder

- **COMP-14001 Identity Card** — `IdentityCard.tsx`. Edita `full_name` vía `apiClient.users.updateMe()` (`PATCH /api/users/me`, ya existía en backend) + `useAuth().refresh()`. Muestra avatar, badge de rol canónico, verificación de email, resumen de organización activa (`useActiveOrg()`).
- **COMP-14002 Profile Completeness** — `ProfileCompleteness.tsx`. % real por checklist (nombre completo, membership, y para `corporate`/`investor` un mandato activo vía `apiClient.mandates.listMine()`).
- **COMP-14003 Criteria / Thesis** — `CriteriaThesis.tsx`. No se reconstruyó: reutiliza el sistema de **mandatos** ya implementado (`/oportunidades/mandato/*`, proxy a `buyer-mandates` de Intel). Para `corporate`/`investor` lista mandatos reales vía SWR y enlaza a `/oportunidades/mandato/{id}` o a `/nuevo`; para `advisor` remite a gestión de mandatos de cliente en Oportunidades. `FLOWS.md` §1.1 "Buyer Profile Form" quedó confirmado como documentación obsoleta — el mandato es la implementación real.
- **COMP-14005 Language & Theme** — `LanguageTheme.tsx`. Reutiliza `useTheme()` + `<ThemeSwitcher />` (dark mode ya implementado) y el `toggleLocale()` de `Sidebar.tsx` (cookie `NEXT_LOCALE`). 100% real, cero componentes nuevos de backend.
- **COMP-14007 Organization & Team** — `OrganizationTeam.tsx`. Listado real de miembros (`apiClient.organizations.members(activeOrgId)`, endpoint ya existía). Formulario de invitación (email + rol `operator`/`admin`) vía `apiClient.organizations.invite()` (endpoint ya existía y ya exige `role_in_org` owner|admin en servidor). Visibilidad y capacidad de gestión gateadas por `role_in_org` del usuario en la org activa (`canManage`), acorde a BR-14007-001.

### Parcial

- **COMP-14004 Account Security** — `AccountSecurity.tsx`. Solo cerrar sesión es real (`useAuth().logout()`). Cambio de contraseña y listado de sesiones activas no tienen endpoint en backend (`modules/auth/router.py` no los expone) — se muestran como "Próximamente", no como formularios rotos.

### Próximamente honesto (sin endpoint de backend todavía)

- **COMP-14006 Notification Preferences** — `NotificationPreferences.tsx`. Lista los eventos reales ya trackeados (NDA firmada, Interés recibido, Acceso al Data Room, match de alta afinidad, invitación a shortlist, exclusividad, sugerencias de shortlist automático) pero no hay endpoint de preferencias que guardar.
- **COMP-14008 Plan & Billing** — `PlanBilling.tsx`. Backend solo tiene un stub de health-check (`GET /api/billing/health`); no hay Customer/Checkout/webhook de Stripe todavía.
- **COMP-14009 Privacy & Data** — `PrivacyData.tsx`. Sin endpoint de exportación/eliminación de datos ni historial de consentimientos.
- **COMP-14010 Danger Zone** — `DangerZone.tsx`. Sin endpoint de eliminación de cuenta. En vez de un botón roto, enlaza a `mailto:soporte@arroba.com` para gestión manual.

### Hallazgo durante la implementación: invitaciones incompletas de extremo a extremo

El backend permite crear invitaciones (`POST /api/organizations/{org_id}/invitations`) y las valida server-side, pero no existe página de aceptación en frontend (`/invitaciones/[token]`) ni servicio de envío de email. `OrganizationTeam.tsx` lo refleja: tras invitar con éxito, muestra explícitamente que la invitación no llega por email ni tiene página de aceptación todavía — no finge que el flujo está completo.

---

## 1. Cuenta de Usuario (Perfil + Ajustes)

#### Objetivo

Responder dos preguntas distintas, deliberadamente separadas en dos pantallas:

> **Perfil** — ¿quién soy y qué busco en arroba?
> **Ajustes** — ¿cómo quiero que arroba se comporte conmigo?

#### Responsabilidades

- Completar y mantener la identidad del usuario.
- Exponer y permitir editar el criterio de matching (tesis de compra, datos de venta o mandatos, según rol).
- Configurar idioma, tema y notificaciones.
- Gestionar seguridad de la cuenta.
- Gestionar plan y facturación.
- Gestionar privacidad y datos.

#### Arquitectura funcional

```
Cuenta de Usuario

├── Perfil

│   ├── COMP-14001 Identity Card

│   ├── COMP-14002 Profile Completeness

│   ├── COMP-14003 Criteria / Thesis (role-adaptive)

│   └── COMP-14004 Account Security

└── Ajustes

    ├── COMP-14005 Language & Theme

    ├── COMP-14006 Notification Preferences

    ├── COMP-14007 Organization & Team

    ├── COMP-14008 Plan & Billing (Stripe)

    ├── COMP-14009 Privacy & Data

    └── COMP-14010 Danger Zone
```

#### Principios

- Perfil describe al usuario. Ajustes describe el comportamiento de la plataforma. Ninguno de los dos sustituye al otro.
- Ninguna sección duplica datos ya capturados en Registro u Onboarding. Los completa o los corrige.
- El contenido de Perfil se adapta al rol canónico del usuario. Nunca muestra campos de un rol que no tiene.
- Ajustes es transversal. No depende de la empresa activa ni del workspace abierto.

#### Reglas globales

Los datos de Perfil alimentan el Matching Engine.

Cualquier cambio debe re-triggear el cálculo de score.

Los roles canónicos (`subscriber` · `corporate` · `investor` · `advisor` · `arroba_team` · `admin`) no heredan entre sí.

Cuenta de Usuario renderiza condicionalmente por rol. Nunca un formulario único.

Ninguna sección implementa lógica de negocio en el frontend.

---

### COMP-14001 — Identity Card

---

id: COMP-14001

name: Identity Card

section: Perfil

status: Draft

owner: Product

version: 0.1

---

#### Objetivo

Responder:

> ¿Quién soy dentro de arroba?

#### Responsabilidad

Mostrar y permitir editar la identidad básica del usuario.

No decide su criterio de matching.

No decide su rol.

#### Elementos

- Foto / avatar.
- Nombre completo.
- Cargo.
- Teléfono.
- Email de login (solo lectura).
- Organización(es) a las que pertenece, con rol en cada una.
- Rol canónico (`subscriber` / `corporate` / `investor` / `advisor` / `arroba_team` / `admin`) — visible, no editable por el propio usuario.

#### Información excluida

No muestra:

- Criterio de inversión o venta.
- Datos de facturación.
- Historial de actividad transaccional.

#### Business Rules

##### BR-14001-001

El email de login no es editable desde aquí.

El cambio de email requiere un flujo de verificación aparte.

##### BR-14001-002

El rol canónico solo lo modifica `arroba_team` o `admin`.

Nunca el propio usuario.

##### BR-14001-003

Si el usuario pertenece a más de una organización, Identity Card indica cuál es la organización activa.

Coordinado con la pantalla Organizaciones (#7) y con COMP-14007.

#### Estados

##### Ready

Estado normal.

##### Loading

Esperando datos del usuario.

##### Error

No se ha podido recuperar la identidad.

#### Casos especiales

Usuario recién registrado sin organización (onboarding incompleto).

↓

Mostrar CTA a completar onboarding en lugar de los campos de organización.

#### Acceptance Criteria

- Identifica inequívocamente al usuario.
- Nunca permite escalar de rol desde el propio formulario.
- Funciona con datos parciales.

#### Relación con otros componentes

Profile Completeness

↓

Agrega el estado de estos campos.

Organizaciones (#7) / COMP-14007

↓

Fuente de la membership.

---

### COMP-14002 — Profile Completeness

---

id: COMP-14002

name: Profile Completeness

section: Perfil

status: Draft

owner: Product

version: 0.1

---

#### Objetivo

Responder:

> ¿Qué me falta para que arroba pueda recomendarme algo bueno?

#### Responsabilidad

Agregar en un único indicador cuánto del perfil está completo.

Bloquear o advertir sobre acciones que lo requieren.

No calcula matching score.

Solo refleja completitud de datos de entrada.

#### Elementos

- Barra o porcentaje de completitud.
- Checklist de campos pendientes.
- Motivo de cada pendiente (ejemplo: "Sin ticket mínimo definido: no recibirás matches por tamaño").
- CTA directo al campo incompleto.

#### Business Rules

##### BR-14002-001

El porcentaje se calcula únicamente sobre los campos de Criteria relevantes al rol del usuario.

Nunca sobre campos de otro rol.

##### BR-14002-002

"Enviar Interés" en el Marketplace exige perfil completo (regla ya vigente en el flujo Buyer, `FLOWS.md` §1.5).

Profile Completeness es la superficie donde el usuario resuelve ese bloqueo.

##### BR-14002-003

El componente nunca calcula matching score.

Únicamente completitud de datos.

#### Estados

- Ready (100%).
- Partial.
- Empty (usuario recién registrado).

#### Arroba Intelligence

Alimenta al Matching Engine y al Next Step Panel (Ficha de Empresa, `ACC_v0.1.md` Capítulo 5) como señal de "qué le falta a este usuario".

#### Acceptance Criteria

- Nunca da un 100% falso con campos de otro rol sin rellenar.
- Se actualiza inmediatamente tras editar Criteria.

#### Relación con otros componentes

Criteria / Thesis

↓

Fuente de los campos que se miden.

Next Step Panel (Ficha de Empresa)

↓

Consume esta señal como contexto.

---

### COMP-14003 — Criteria / Thesis (role-adaptive)

---

id: COMP-14003

name: Criteria / Thesis

section: Perfil

status: Draft

owner: Product

version: 0.1

---

#### Objetivo

Responder:

> ¿Qué busco, o qué ofrezco, en arroba?

Es el componente central del documento: es el input directo del Matching Engine.

#### Responsabilidad

Renderizar el bloque de campos correspondiente al rol del usuario.

No edita datos de empresa. Solo enlaza a la Ficha de Empresa cuando corresponde.

#### Elementos

##### Comprador (`investor` / `corporate` en rol comprador)

- Tipo: PE, VC, Family Office, Estratégico, Holding.
- Ticket mínimo / máximo.
- Rango de revenue objetivo.
- Rango de EBITDA objetivo.
- Sectores (taxonomía BUD).
- Geografías.
- Urgencia: low / medium / high.
- Preferencia de control: control / minority / flexible.

(Campos ya definidos en `FLOWS.md` §1.1, Buyer Profile Form.)

##### Vendedor (`corporate` en rol vendedor)

- Empresa vinculada: enlace directo a su Ficha de Empresa.
- No se duplican aquí legal_name, CIF, sectores, empleados ni financials — esos campos viven exclusivamente en la Ficha de Empresa (`ACC_v0.1.md`, Capítulos 4-16).

##### Asesor (`advisor`)

- Nombre de la firma (`firm_name`).
- Mandatos activos (`mandate_ids`), con enlace a su gestión.

#### Business Rules

##### BR-14003-001

Nunca coexisten en pantalla campos de más de un rol a la vez.

##### BR-14003-002

Los campos de la empresa vendedora no se editan aquí.

Criteria enlaza a la Ficha de Empresa como única Source of Truth. Evita un segundo lugar con los mismos datos.

##### BR-14003-003

Cualquier cambio en Criteria dispara recálculo del matching score del usuario frente a cada deal publicado (`FLOWS.md` §5).

##### BR-14003-004

Un usuario `advisor` puede alternar entre "trabajo propio" y "trabajo para mandato" (ver COMP-1010 User Relationship, Casos especiales) sin que esto cree un segundo Criteria.

#### Estados

- Ready.
- Empty (nunca completado — usuario con intención "explorar" desde onboarding).
- Partial.

#### Casos especiales

Usuario con intención `explorar` (sin tesis concreta desde onboarding).

↓

Criteria se muestra vacío, con invitación a definirlo cuando quiera.

No bloquea el resto de la plataforma.

#### Acceptance Criteria

- Los campos mostrados dependen exclusivamente del rol canónico y de la intención capturada en onboarding.
- Guardar recalcula completitud y dispara matching.
- Nunca almacena una segunda copia de datos de empresa.

#### Relación con otros componentes

Profile Completeness

↓

Mide estos campos.

Matching Engine (externo)

↓

Los consume como input directo.

Ficha de Empresa, `ACC_v0.1.md` Capítulos 4-16

↓

Source of Truth para el caso Vendedor.

---

### COMP-14004 — Account Security

---

id: COMP-14004

name: Account Security

section: Perfil

status: Draft

owner: Product

version: 0.1

---

#### Objetivo

Responder:

> ¿Mi cuenta está protegida?

#### Elementos

- Cambio de contraseña.
- Sesiones activas: dispositivo, fecha, ubicación aproximada.
- Cierre de sesión remota.
- Estado de vinculación con Google.

#### Business Rules

##### BR-14004-001

Si el usuario se registró con Google, cambiar la contraseña exige primero establecer una.

##### BR-14004-002

Cerrar una sesión remota no cierra la sesión actual.

#### Estados

- Ready.
- Error.

#### Acceptance Criteria

- Nunca expone la contraseña actual.
- Cada sesión listada se puede revocar individualmente.

---

### COMP-14005 — Language & Theme

---

id: COMP-14005

name: Language & Theme

section: Ajustes

status: Draft

owner: Product

version: 0.1

---

#### Objetivo

Configurar idioma y apariencia.

#### Elementos

- Idioma (la plataforma ya usa `next-intl`).
- Tema: claro / oscuro / según sistema.

#### Business Rules

##### BR-14005-001

El tema persiste por usuario, no por dispositivo.

##### BR-14005-002

El cambio de idioma no requiere recargar toda la sesión.

#### Dependencias

El dark mode ya está implementado a nivel de Ficha de Empresa (QA 2026-09-04/05, sin regresiones).

Language & Theme solo expone el control global. No reimplementa theming.

#### Estados

- Ready.

---

### COMP-14006 — Notification Preferences

---

id: COMP-14006

name: Notification Preferences

section: Ajustes

status: Draft

owner: Product

version: 0.1

---

#### Objetivo

Responder:

> ¿De qué quiero que me avisen, y por dónde?

#### Elementos

Matriz evento × canal (email / in-app), agrupada por eventos ya trackeados en el producto:

- `NDA_SIGNED`.
- `INTEREST_SUBMITTED`.
- `DATA_ROOM_ACCESSED` / `DOCUMENT_DOWNLOADED` (relevante para sellers).
- Nuevo match de alta afinidad (≥65, `FLOWS.md` §5).
- Invitación a shortlist.
- Concesión o pérdida de exclusividad.
- Sugerencias de auto-shortlist (`RECOMMENDED_SHORTLIST` / `CONSIDER`).

#### Business Rules

##### BR-14006-001

Los eventos transaccionales críticos (exclusividad otorgada o perdida) no pueden desactivarse por completo.

Solo se puede elegir el canal.

##### BR-14006-002

El resto de eventos admiten opt-out libre.

#### Estados

- Ready.

#### Relación con otros componentes

Cada evento de esta matriz mapea 1:1 a un evento ya trackeado en el Flujo Buyer/Seller (`FLOWS.md`).

Notification Preferences no inventa eventos nuevos. Solo expone control sobre los existentes.

---

### COMP-14007 — Organization & Team

---

id: COMP-14007

name: Organization & Team

section: Ajustes

status: Draft

owner: Product

version: 0.1

---

#### Objetivo

Gestionar miembros y roles de una organización desde Ajustes, sin obligar a salir a la pantalla Organizaciones (#7) para una acción rápida.

#### Decisión de alcance (DA-14003, resuelta 2026-09-10)

Coexisten dos superficies sobre el mismo backend de memberships:

- **Organizaciones (#7)** sigue siendo la gestión completa (crear organización, cambiar entre organizaciones, ver detalle).
- **Ajustes / COMP-14007** añade un acceso directo: tarjeta ligera de la organización activa con acciones rápidas de invitar/revocar, sin navegar fuera de Ajustes.

Ninguna de las dos implementa su propio modelo de datos — ambas leen/escriben las mismas `memberships`.

#### Elementos

- Tarjeta de la organización activa: nombre, nº de miembros, rol del usuario actual en ella.
- Listado de miembros con su rol dentro de la organización.
- Invitar miembro (email + rol).
- Revocar acceso a un miembro.
- Enlace a Organizaciones (#7) para gestión completa (cambiar de organización, crear una nueva, ver histórico).

#### Business Rules

##### BR-14007-001

Solo un usuario con `membership.role_in_org` igual a `owner` o `admin` en la organización activa puede invitar o revocar miembros.

`role_in_org` (`owner | admin | operator`, `lib/api/types.ts`) es un rol **por organización**, distinto y ortogonal al rol canónico de plataforma (`user.role`: `subscriber | corporate | investor | advisor | admin`). Un `admin` de plataforma es equipo arroba; un `owner`/`admin` de organización administra únicamente las organizaciones que ha creado o a las que ha sido invitado con ese rol. Confirmado con Daniel, 2026-09-10 — ver DA-14006.

##### BR-14007-004

Un `operator` puede ver el listado de miembros pero no invitar ni revocar.

##### BR-14007-002

Invitar o revocar desde Ajustes actualiza inmediatamente lo que muestra Organizaciones (#7), y viceversa. Mismo backend, sin caché divergente.

##### BR-14007-003

Revocar el propio acceso del usuario actual requiere confirmación explícita y, si es el único miembro con permiso de administración, se bloquea (ver COMP-14010 BR-14010-001).

#### Estados

- Ready.
- Empty (organización con un único miembro: el propio usuario).

#### Acceptance Criteria

- Invitar/revocar desde Ajustes y desde Organizaciones produce el mismo estado final.
- Nunca permite a un usuario sin rol de administración invitar o revocar.

#### Relación con otros componentes

Organizaciones (#7)

↓

Vista completa; comparte backend de memberships.

Identity Card (COMP-14001)

↓

Muestra la organización activa que aquí se gestiona.

Danger Zone (COMP-14010)

↓

Coordina el caso de único admin al eliminar cuenta.

---

### COMP-14008 — Plan & Billing (Stripe)

---

id: COMP-14008

name: Plan & Billing

section: Ajustes

status: Draft

owner: Product

version: 0.1

---

#### Objetivo

Ver y gestionar el plan de suscripción, con Stripe como proveedor de pagos (decisión Daniel, 2026-09-10 — resuelve DA-14004).

#### Elementos

- Plan actual, alineado con los segmentos ya modelados (Profesional, Advisor, Organización).
- Método de pago (gestionado vía Stripe: Checkout o Customer Portal, no un formulario de tarjeta propio).
- Historial de facturas (Stripe Invoices, reflejado localmente vía webhook).
- Upgrade / downgrade de plan.
- Acceso a Informes Premium como add-on.

#### Business Rules

##### BR-14008-001

Un downgrade nunca es inmediato si hay un periodo de facturación en curso. Aplica en el siguiente ciclo (`subscription.update` con `proration_behavior` acorde).

##### BR-14008-002

Los precios y `price_id` de Stripe no se hardcodean en frontend. Se sirven desde el backend.

##### BR-14008-003

El estado de la suscripción (activa, impagada, cancelada) lo determina exclusivamente el backend a partir de los webhooks de Stripe (`customer.subscription.updated`, `invoice.payment_failed`, etc.), nunca una llamada directa del frontend a Stripe.

##### BR-14008-004

Todo el manejo de datos de tarjeta ocurre en Stripe (Checkout / Elements / Customer Portal). El frontend de arroba nunca almacena ni transmite el PAN.

##### BR-14008-005

Cada evento de webhook se procesa de forma idempotente (Stripe puede reenviar el mismo evento).

#### Estados

- Ready.
- Partial (pago fallido — mostrar banner con CTA a actualizar método de pago).
- Error.

#### Integración Backend

Stripe Customer vinculado 1:1 a la organización (no al usuario individual, dado que la facturación es por organización/segmento).

Sincronización de estado vía webhook, no polling.

#### Acceptance Criteria

- Nunca expone datos de tarjeta fuera del flujo hospedado de Stripe.
- El plan mostrado siempre coincide con el estado que el backend recibió del último webhook procesado.

---

### COMP-14009 — Privacy & Data

---

id: COMP-14009

name: Privacy & Data

section: Ajustes

status: Draft

owner: Product

version: 0.1

---

#### Objetivo

Dar al usuario control sobre sus propios datos.

Especialmente sensible por la naturaleza confidencial de la información M&A que circula por la plataforma (NDAs, Data Room).

#### Elementos

- Exportar datos personales.
- Eliminar datos personales.
- Historial de consentimientos (NDAs firmados, documentos de Data Room accedidos).

#### Business Rules

##### BR-14009-001

La exportación de datos nunca incluye documentos de Data Room de terceros, aunque el usuario los haya visualizado. Solo su propia actividad.

##### BR-14009-002

Eliminar datos personales no elimina Engagements ni NDAs ya firmados (obligación de conservar evidencia transaccional). El usuario se anonimiza; el registro no se borra.

#### Estados

- Draft.

---

### COMP-14010 — Danger Zone

---

id: COMP-14010

name: Danger Zone

section: Ajustes

status: Draft

owner: Product

version: 0.1

---

#### Objetivo

Dar de baja la cuenta.

#### Elementos

- Eliminar cuenta, con doble confirmación.
- Efecto sobre memberships y organizaciones si el usuario es el único admin.

#### Business Rules

##### BR-14010-001

No se puede eliminar una cuenta que sea el único usuario con `role_in_org` `owner` (ver COMP-14007 / BR-14007-001) de una organización con deals activos, sin transferir antes la titularidad.

##### BR-14010-002

Acción irreversible. Requiere reautenticación.

##### BR-14010-003

Si la organización tiene una suscripción Stripe activa (COMP-14008), eliminar la cuenta del único admin bloquea hasta cancelar o transferir la suscripción.

#### Estados

- Draft.

---

## Estado del documento

| Código | Componente | Sección | Estado |
|---------|------------|---------|--------|
| COMP-14001 | Identity Card | Perfil | 🟢 Implementado |
| COMP-14002 | Profile Completeness | Perfil | 🟢 Implementado |
| COMP-14003 | Criteria / Thesis | Perfil | 🟢 Implementado (reutiliza mandatos) |
| COMP-14004 | Account Security | Perfil | 🟠 Parcial (solo logout) |
| COMP-14005 | Language & Theme | Ajustes | 🟢 Implementado |
| COMP-14006 | Notification Preferences | Ajustes | ⚪ Próximamente (sin endpoint) |
| COMP-14007 | Organization & Team | Ajustes | 🟢 Implementado |
| COMP-14008 | Plan & Billing | Ajustes | ⚪ Próximamente (solo stub Stripe) |
| COMP-14009 | Privacy & Data | Ajustes | ⚪ Próximamente (sin endpoint) |
| COMP-14010 | Danger Zone | Ajustes | ⚪ Próximamente (mailto a soporte) |

Alcance de Sprint 1: las 10 piezas, sin fases (decisión Daniel, 2026-09-10). Implementadas 2026-09-10 directamente por Claude sobre `Beta-7926/frontend`, sin pasar por Emergent. Ver "Implementación — 2026-09-10" arriba para el detalle por componente.

## Decisiones arquitectónicas

##### DA-14001

Perfil y Ajustes se mantienen como dos pantallas canónicas separadas, tal y como ya figuran en `CANONICAL_SCREENS.md` (#8 y #9).

Perfil describe identidad y tesis de matching. Ajustes describe comportamiento de la plataforma.

##### DA-14002

Los datos de empresa vendedora no se duplican en Criteria / Thesis.

Criteria enlaza a la Ficha de Empresa como única Source of Truth.

##### DA-14003 — Resuelta 2026-09-10

Organization & Team vive en ambos sitios: Organizaciones (#7) para gestión completa, Ajustes/COMP-14007 para acceso directo (invitar/revocar sin salir de Ajustes). Mismo backend de memberships en ambos casos — ver BR-14007-002.

##### DA-14004 — Resuelta 2026-09-10

Proveedor de pagos: **Stripe**. Plan & Billing (COMP-14008) se especifica sobre Stripe Customer + Checkout/Customer Portal + webhooks, sin manejo propio de tarjetas.

##### DA-14005 — Resuelta 2026-09-10

Cuenta de Usuario abre documento propio (`memory/sources/cuenta_v1/ACC_CUENTA_v0.1.md`), hermano de `empresa_v1/ACC_v0.1.md`, en vez de integrarse como capítulo de este último.

##### DA-14006 — Resuelta 2026-09-10

"Administrador de organización" (a efectos de BR-14007-001 y BR-14010-001) es `membership.role_in_org` igual a `owner` o `admin`, **no** `user.role` de plataforma.

Son dos ejes de rol independientes y ya existen ambos en el contrato de API (`lib/api/types.ts`):

- `user.role`: `subscriber | corporate | investor | advisor | admin` — relación del usuario con arroba como plataforma. `admin` aquí es equipo arroba.
- `membership.role_in_org`: `owner | admin | operator` — relación del usuario con una organización concreta que ha creado o a la que pertenece. Un `owner`/`admin` de organización solo administra esa organización, nunca arroba.

No bloquea desarrollo: el dato ya existe, solo faltaba confirmar cuál de los dos ejes aplica.

**Fin del documento — ACC Cuenta de Usuario v0.1**
