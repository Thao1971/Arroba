# arroba.com — Entity Model v1.1.0

> **3ª capa canónica del proyecto** (parte 1 de 2). Ver [`ARROBA_PHILOSOPHY.md` §13](./ARROBA_PHILOSOPHY.md).
> Última actualización: 2026-06-25 (Sprint 0.5 Ciclo B — Canonical Baseline v1.0).
>
> **CHANGELOG v1.1.0 (Sprint 0.5 Ciclo B)**:
> - **Match pasa a ser una entidad canónica de primer nivel** (§3 + nueva §5.7). Encapsula el acuerdo bilateral Buyer↔Seller con estados `SOLICITADO → ACEPTADO | RECHAZADO | EXPIRADO`. Reconcilia con `ARROBA_PHILOSOPHY §7` (Matching mecanismo ≠ Match entidad).
> - **`client` → `user`** (§3, §5.6, §5.8, §5.9, §5.10, §5.11, §5.12). Alias `client` deprecated por 6 meses (lectura tolerada).
> - **Enum `Operation.current_phase`** actualizado a `nda → im → qa → loi → dd → negotiation → spa → closing → integration`. `ioi` queda como sub-estado opcional dentro de `loi`. Excluidos `matching` y `teaser` (pertenecen a Discovery Layer / Match).
> - **Catálogo declarado como extensible**: eliminadas las referencias numéricas a una cardinalidad concreta del catálogo (no se habla más de "N tipos canónicos"). El catálogo es enumeración explícita y extensible.
> - Renumeración interna §5.8 → §5.9, §5.9 → §5.10, §5.10 → §5.11, §5.11 → §5.12 para hacer hueco a Match.
> - Roles canónicos del `user` documentados explícitamente (§5.12): `subscriber`, `corporate`, `investor`, `advisor`, `arroba_team`, `admin`. El rol `arroba_team` NO hereda de `admin`.
>
> Este documento define la **ontología de datos** de arroba.com. Qué entidades existen, qué campos comunes comparten, qué relaciones tienen, qué reglas de negocio aplican. Aquí NO se habla de pantallas (eso es `ENTITY_FRAMEWORK.md`) ni de implementación (eso es Mongo/Pydantic en `/app/backend/src/modules/...`).
>
> **Regla de oro**: si hay conflicto entre este documento y la implementación, **gana este documento**. El código se actualiza para alinearse.

---

## Índice

1. [Filosofía](#1-filosofía)
2. [Principios](#2-principios)
3. [Tipos de entidad](#3-tipos-de-entidad)
4. [Campos comunes](#4-campos-comunes)
5. [Relaciones por entidad](#5-relaciones-por-entidad)
6. [El grafo del producto](#6-el-grafo-del-producto)
7. [Reglas de negocio](#7-reglas-de-negocio)
8. [Versionado](#8-versionado)
9. [Ejemplos completos (JSON)](#9-ejemplos-completos-json)
10. [Principios de evolución](#10-principios-de-evolución)

---

## 1. Filosofía

arroba.com es un producto **entity-first**. Toda la inteligencia, la memoria
y las acciones del usuario se materializan sobre entidades canónicas. El
chat (Copilot) es una interfaz; las entidades son el producto
(`ARROBA_PHILOSOPHY.md` §12).

Sin una ontología de datos compartida ocurren tres patologías:

1. **Duplicación silenciosa** — la misma empresa con nombres ligeramente
   distintos se inserta dos veces; las relaciones se pierden.
2. **Pantallas que dictan modelo** — cada nueva ficha inventa su forma de
   serializar datos, y los consumidores (chat, search, exports) se rompen.
3. **Memoria fragmentada** — la conversación sobre una entidad no se puede
   reconstruir porque cada mensaje guarda referencias inconsistentes.

El Entity Model resuelve estas tres patologías declarando:

- **Identidad única** por entidad (`id` interno + `slug` humano).
- **Conjunto cerrado de tipos** (no se inventan tipos en una pantalla).
- **Relaciones como ciudadanos de primera clase** (no se infieren de joins).
- **Campos comunes obligatorios** (timestamps, propietario, visibility).
- **Trazabilidad** (lineage de dónde vino el dato).
- **Versionado del esquema** (un nuevo campo no rompe consumidores viejos).

---

## 2. Principios

### 2.1 Identidad única
Toda entidad tiene **dos identificadores** complementarios:

- `id` — opaco, generado por el backend, estable de por vida. Ej. `mc_kitchen_studio_5h2x`. Usado por las relaciones internas.
- `slug` — human-readable, único por tipo, derivado del nombre normalizado. Ej. `kitchen-studio-sl`. Usado en URLs.

Algunos tipos tienen además **identificadores externos** (`CIF`, `NIF`, `LinkedIn URL`). Esos NO son la identidad — son atributos consultables. Si el CIF cambia (rebrand legal), `id` y `slug` permanecen.

### 2.2 Conjunto cerrado de tipos
Existe **una sola lista oficial de tipos** (§3). Una nueva pantalla que
necesite un tipo nuevo PRIMERO debe añadirlo aquí. No hay tipos "ad hoc"
generados por endpoints o por el LLM.

### 2.3 Relaciones como ciudadanos de primera clase
Las relaciones tienen tipo, dirección y atributos propios. Ejemplos:

- `company → sector` (cardinalidad 1, dirección obligatoria).
- `opportunity → companies[]` (cardinalidad N, con score).
- `transaction → mandate` (cardinalidad 1).

No es legítimo "inferir" la sector de una empresa filtrando todas las
empresas de un sector. La relación se almacena explícita.

### 2.4 Trazabilidad (lineage)
Toda entidad guarda de dónde vinieron sus datos:

- `source` — `mock` | `agency_tool_real` | `user_input` | `ai_inferred`.
- `lineage[]` — array opcional de pasos por los que pasó el dato.
- `confidence` — número [0,1] cuando aplica (datos inferidos).

### 2.5 Campos comunes obligatorios
Toda entidad tiene los campos descritos en §4. No hay excepciones. Si una
entidad nueva no necesita uno, lo deja `null`; pero el campo existe en el
esquema.

### 2.6 Versionado del esquema
Cada entidad declara `schema_version`. Los consumidores (chat, exports,
search) saben tolerar versiones anteriores. Añadir un campo es
retrocompatible; eliminar uno requiere migración explícita.

### 2.7 Visibility y propiedad
Toda entidad tiene un **propietario** (`owner: org_id | user_id | system`) y
una **visibility** (`public` | `private` | `team` | `system`). Las
operaciones de lectura/escritura validan ambos.

---

## 3. Tipos de entidad

arroba.com declara el siguiente catálogo de tipos canónicos. Cada tipo
tiene su propio módulo backend (`/app/backend/src/modules/{type}s/`) y su
propia colección Mongo cuando aplica. **El catálogo es extensible**: las
versiones futuras pueden añadir tipos sin modificar este principio.

| Tipo | Singular | Descripción | URL canónica | Estado E1.5.6 |
|---|---|---|---|---|
| `company` | Empresa | Sociedad mercantil identificada por CIF/NIF | `/empresa/{cif}` | ✅ implementado |
| `sector` | Sector | Vertical económica (ej. "Software", "Restauración") | `/sector/{slug}` | 🔵 E1.6 |
| `territory` | Territorio | Región geográfica (país, comunidad, provincia, ciudad) | `/territorio/{slug}` | 🔵 E1.7 |
| `person` | Persona | Individuo identificado (fundador, advisor, etc.) | `/persona/{slug}` | 🔵 backlog |
| `advisor` | Advisor | Profesional acreditado en arroba (asesor M&A, valuator) | `/advisor/{slug}` | 🔵 backlog |
| `mandate` | Mandato | Encargo formal de un cliente a un advisor (buy-side / sell-side) | `/mandato/{id}` | 🔵 backlog |
| `match` | Match | Acuerdo bilateral Buyer↔Seller que abre la Operación | `/match/{id}` (vista histórica) | 🔵 E2.0 |
| `operation` | Operación | Proceso M&A en ejecución (Transaction OS, multi-fase) | `/operacion/{id}` | 🔵 E2.0 |
| `valuation` | Valoración | Estimación de valor (indicativa o avanzada) | `/valoracion/{id}` | 🔵 E1.8 |
| `document` | Documento | PDF, memoria mercantil, teaser, IM, SPA, etc. | `/documento/{id}` | 🔵 backlog |
| `opportunity` | Oportunidad | Tesis de inversión / desinversión, con candidatos | `/oportunidad/{id}` | 🔵 E1.9 |
| `user` | Usuario | Persona física que ejecuta acciones (search, watchlist) | (sin ficha pública) | ✅ implementado como `users` |
| `organization` | Organización | Cuenta multi-usuario (workspace owner) | `/org/{slug}` | ✅ implementado |

**Match pasa a ser una entidad canónica de primer nivel** (decisión Sprint 0.5 Ciclo B). Encapsula el acuerdo bilateral Buyer↔Seller con estados `SOLICITADO → ACEPTADO | RECHAZADO | EXPIRADO`. La transición `ACEPTADO` genera la `operation` correspondiente. Modelo completo en `TRANSACTION_OS_SPEC §4` y ficha en `ENTITY_FRAMEWORK §11.13`.

**Nota canónica sobre nomenclatura**: en versiones previas el tipo `client` referenciaba a "Persona física que ejecuta acciones". A partir de Sprint 0.5 Ciclo B se canoniza como `user` para alinear con la implementación actual (`users` en backend) y con los 6 specs del Sprint 0. **`client` queda como alias deprecated por 6 meses** (lectura tolerada; escritura desaconsejada).

**Nota**: `user` y `organization` son entidades **operacionales** del producto (autenticación, ownership), no entidades de dominio M&A.

---

## 4. Campos comunes

Todos los tipos comparten estos campos. Implementación canónica:
`/app/backend/src/modules/common/base_entity.py` (a crear en E1.6+).

### 4.1 Identidad

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | string | ✅ | Identificador opaco interno (ej. `mc_kitchen_studio_5h2x`) |
| `slug` | string | ✅ | Identificador humano único por tipo (ej. `kitchen-studio-sl`) |
| `type` | enum | ✅ | Uno de los tipos canónicos declarados en §3 |
| `schema_version` | int | ✅ | Versión del esquema. Inicia en 1 |

### 4.2 Naming

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | ✅ | Nombre canónico para UI (ej. "Kitchen Studio, S.L.") |
| `short_name` | string | ❌ | Versión corta opcional (ej. "Kitchen") |
| `description` | string | ❌ | Microcopy 1-2 frases |
| `aliases` | string[] | ❌ | Otros nombres reconocibles (rebrands, nombres comerciales) |

### 4.3 Estado y taxonomía

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `status` | enum | ✅ | `active` \| `inactive` \| `archived` \| `pending` |
| `tags` | string[] | ❌ | Etiquetas libres para filtrado |

### 4.4 Propiedad y visibilidad

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `owner_type` | enum | ✅ | `org` \| `user` \| `system` |
| `owner_id` | string | ✅ | ID del propietario |
| `visibility` | enum | ✅ | `public` \| `private` \| `team` \| `system` |
| `shared_with` | string[] | ❌ | IDs explícitos cuando `visibility=team` |

### 4.5 Timestamps

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `created_at` | datetime UTC | ✅ | Cuándo se creó |
| `updated_at` | datetime UTC | ✅ | Última actualización |
| `archived_at` | datetime UTC | ❌ | Cuándo se archivó (si `status=archived`) |

### 4.6 Trazabilidad

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `source` | enum | ✅ | `mock` \| `agency_tool_real` \| `user_input` \| `ai_inferred` \| `import` |
| `lineage` | object[] | ❌ | Pasos por los que pasó el dato (auditoría) |
| `confidence` | float [0,1] | ❌ | Confianza global del registro (solo si `source` es derivado) |

### 4.7 Identificadores externos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `external_ids` | object | ❌ | Mapa `provider → id`. Ej. `{ "cif": "B12345678", "linkedin": "..." }` |

### 4.8 Metadata libre

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `metadata` | object | ❌ | Bolsa de campos no canónicos. Usar con cautela; preferir promover a campo tipado en una versión nueva. |

---

## 5. Relaciones por entidad

Las relaciones se modelan como **referencias tipadas** desde el lado
dominante. Cuando una relación es N:N, se materializa una entidad de unión
explícita (ej. `company_sector_membership`).

### 5.1 Empresa (`company`)

| Relación | Cardinalidad | Tipo | Notas |
|---|---|---|---|
| `sector_id` | 1 | `sector` | Sector principal. Empresa pertenece a 1 sector. |
| `secondary_sector_ids` | N | `sector[]` | Sectores secundarios (multi-sector). |
| `territory_id` | 1 | `territory` | Sede principal. |
| `secondary_territory_ids` | N | `territory[]` | Otras sedes. |
| `founder_ids` | N | `person[]` | Fundadores conocidos. |
| `key_people_ids` | N | `person[]` | C-level, board. |
| `valuation_ids` | N | `valuation[]` | Valoraciones realizadas sobre esta empresa. |
| `opportunity_ids` | N | `opportunity[]` | Oportunidades que incluyen esta empresa. |
| `mandate_ids` | N | `mandate[]` | Mandatos cuyo objetivo es esta empresa. |
| `document_ids` | N | `document[]` | Documentos asociados (memoria mercantil, teaser, IM). |

### 5.2 Sector (`sector`)

| Relación | Cardinalidad | Tipo | Notas |
|---|---|---|---|
| `parent_sector_id` | 0..1 | `sector` | Sector padre en taxonomía jerárquica. |
| `child_sector_ids` | N | `sector[]` | Subsectores. |
| `company_ids` | N (computada) | `company[]` | Empresas del sector (no se almacena directamente; se computa desde `company.sector_id`). |

### 5.3 Territorio (`territory`)

| Relación | Cardinalidad | Tipo | Notas |
|---|---|---|---|
| `parent_territory_id` | 0..1 | `territory` | País → Comunidad → Provincia → Ciudad. |
| `child_territory_ids` | N | `territory[]` | Subdivisión territorial. |
| `company_ids` | N (computada) | `company[]` | Empresas con sede en este territorio. |

### 5.4 Persona (`person`)

| Relación | Cardinalidad | Tipo | Notas |
|---|---|---|---|
| `current_company_ids` | N | `company[]` | Empresas donde trabaja actualmente. |
| `past_company_ids` | N | `company[]` | Historial laboral. |
| `advisor_id` | 0..1 | `advisor` | Si la persona es advisor en arroba, link. |

### 5.5 Advisor (`advisor`)

| Relación | Cardinalidad | Tipo | Notas |
|---|---|---|---|
| `person_id` | 1 | `person` | El advisor SIEMPRE tiene una persona detrás. |
| `mandate_ids` | N | `mandate[]` | Mandatos activos. |
| `specialization_sector_ids` | N | `sector[]` | Sectores en los que es experto. |
| `specialization_territory_ids` | N | `territory[]` | Territorios donde opera. |

### 5.6 Mandato (`mandate`)

| Relación | Cardinalidad | Tipo | Notas |
|---|---|---|---|
| `user_id` | 1 | `user` | Usuario que encarga el mandato. |
| `advisor_id` | 1 | `advisor` | Profesional que ejecuta. |
| `target_company_ids` | N | `company[]` | Empresa(s) objeto del mandato. |
| `side` | enum | — | `buy_side` \| `sell_side`. |
| `operation_ids` | N | `operation[]` | Operaciones lanzadas desde este mandato. |

### 5.7 Match (`match`)

| Relación | Cardinalidad | Tipo | Notas |
|---|---|---|---|
| `buyer_user_id` | 1 | `user` | Buyer que activa la Solicitud. |
| `seller_user_id` | 1 | `user` | Seller que acepta o rechaza. |
| `target_company_id` | 1 | `company` | Empresa objeto del Match. |
| `opportunity_id` | 0..1 | `opportunity` | Oportunidad origen del Buyer. |
| `mandate_id` | 0..1 | `mandate` | Mandato origen (Buy-side o Sell-side). |
| `operation_id` | 0..1 | `operation` | Operation generada al aceptarse. NULL si `RECHAZADO`/`EXPIRADO`. |
| `status` | enum | — | `SOLICITADO` \| `ACEPTADO` \| `RECHAZADO` \| `EXPIRADO`. |
| `requested_at` | datetime | — | Cuándo se solicitó. |
| `accepted_at` | datetime | — | Cuándo se aceptó. NULL si no se llegó a aceptar. |
| `expires_at` | datetime | — | TTL configurable; expiración automática. |

> Modelo completo del Match en `TRANSACTION_OS_SPEC §4` y ficha en `ENTITY_FRAMEWORK §11.13`. El Match es la entidad puente entre Discovery Layer y Transaction Layer.

### 5.8 Operación (`operation`)

| Relación | Cardinalidad | Tipo | Notas |
|---|---|---|---|
| `match_id` | 1 | `match` | Match origen (canónico). Toda Operation nace de un Match `ACEPTADO`. |
| `mandate_id` | 0..1 | `mandate` | Mandato origen si existe formalmente. |
| `target_company_id` | 1 | `company` | Empresa objeto. |
| `counterparty_company_ids` | N | `company[]` | Contrapartes (compradores/vendedores potenciales). |
| `document_ids` | N | `document[]` | NDA, IM, LOI, SPA, etc. |
| `valuation_ids` | N | `valuation[]` | Valoraciones aplicadas en el proceso. |
| `current_phase` | enum | — | `nda` \| `im` \| `qa` \| `loi` \| `dd` \| `negotiation` \| `spa` \| `closing` \| `integration`. |

> **Notas canónicas sobre `current_phase`** (Sprint 0.5 Ciclo B):
> - Operation arranca en `nda` (la fase de Discovery Layer — `matching`, `teaser` — vive en el Match, no en Operation).
> - `ioi` (Indication of Interest) es **sub-estado opcional dentro de `loi`**, no valor independiente del enum.
> - `negotiation` se ubica entre `dd` y `spa`.
> - `integration` cierra el ciclo tras `closing` (corresponde a T15 del Transaction OS).
> - El detalle canónico vive en `TRANSACTION_OS_SPEC v1.2.0 §4.3 + §6 (T7-T15)`.

### 5.9 Valoración (`valuation`)

| Relación | Cardinalidad | Tipo | Notas |
|---|---|---|---|
| `target_company_id` | 1 | `company` | Empresa valorada. |
| `comparable_company_ids` | N | `company[]` | Comparables utilizadas. |
| `requested_by_id` | 1 | `user` \| `advisor` | Quién la pidió. |
| `method` | enum | — | `revenue_multiple` \| `ebitda_multiple` \| `dcf` \| `comparable_transactions`. |
| `mandate_id` | 0..1 | `mandate` | Si nace de un mandato concreto. |

### 5.10 Documento (`document`)

| Relación | Cardinalidad | Tipo | Notas |
|---|---|---|---|
| `subject_type` | enum | — | A qué entidad se asocia (`company`, `operation`, `mandate`, `match`, ...). |
| `subject_id` | 1 | depende | ID de la entidad sujeto. |
| `kind` | enum | — | `mercantile_memory` \| `teaser` \| `nda` \| `im` \| `ioi` \| `loi` \| `dd_report` \| `spa` \| `other`. |
| `signed_by_ids` | N | `user[]` \| `advisor[]` | Firmantes (cuando aplica). |

### 5.11 Oportunidad (`opportunity`)

| Relación | Cardinalidad | Tipo | Notas |
|---|---|---|---|
| `owner_user_id` | 1 | `user` | Usuario que define la tesis. |
| `sector_ids` | N | `sector[]` | Sectores objetivo. |
| `territory_ids` | N | `territory[]` | Territorios objetivo. |
| `candidate_company_ids` | N | `company[]` | Candidatas detectadas. |
| `pipeline_stage_by_company_id` | map | — | `company_id → 'identified' | 'contacted' | 'in_talks' | 'proposal' | 'closed'`. |
| `mandate_id` | 0..1 | `mandate` | Si escala a mandato formal. |

### 5.12 Usuario (`user`) / Organización (`organization`)

Operacionales. Ya implementados como `users` + `organizations` + `memberships`. Sus relaciones se enfocan a:

| Relación | Cardinalidad | Notas |
|---|---|---|
| `user → organization[]` (memberships) | N | Multi-tenant. |
| `user → watchlist company[]` | N | Empresas guardadas. |
| `user → opportunity[]` (owned) | N | Tesis propias. |
| `user → match[]` (as buyer or seller) | N | Matches en los que participa. |

> **Roles canónicos del `user`** (alineado con `TRANSACTION_OS_SPEC v1.2.0 §14`):
> - `subscriber` · `corporate` · `investor` · `advisor` · `arroba_team` · `admin`
> - El rol `arroba_team` es **específico nuevo** y **NO hereda** automáticamente de `admin` (decisión Sprint 0.5 Ciclo B sobre `[OPEN-C11]`).

---

## 6. El grafo del producto

Narrativa visual del grafo (top-to-bottom de dominio):

```
                   ┌──────────────┐
                   │   Territory  │◄──────────────────┐
                   └──────┬───────┘                   │
                          │ (parent/child)            │
                          ▼                           │
                   ┌──────────────┐                   │
            ┌─────►│    Sector    │                   │
            │      └──────┬───────┘                   │
            │             │ (parent/child)            │
            │             ▼                           │
            │      ┌──────────────┐                   │
            │      │   Company    │───────────────────┘
            │      └──────┬───────┘
            │             │
            │             │ has many
            │             ▼
            │      ┌──────────────┐    ┌──────────────┐
            └──────┤  Valuation   │    │   Document   │
                   └──────────────┘    └──────┬───────┘
                                              │
                          ┌───────────────────┘
                          ▼
                   ┌──────────────┐
                   │   Operation  │◄───── Match ◄── Mandate ◄── Advisor ◄── Person
                   └──────────────┘
                          ▲
                          │ may originate from
                          │
                   ┌──────┴───────┐
                   │ Opportunity  │◄── User (owner)
                   └──────────────┘
```

Lecturas obligatorias:

- Una **Empresa** vive en un **Sector** y un **Territorio**. Esos son los
  primeros dos ejes de navegación canónicos.
- Una **Oportunidad** es la formalización de una tesis del **Usuario**; sus
  candidatas son **Empresas**.
- Un **Mandato** convierte una oportunidad informal en un encargo formal con
  un **Advisor** acreditado.
- Un **Match** representa el acuerdo bilateral Buyer↔Seller (resultado del
  mecanismo Matching). Cuando se acepta, genera la Operación.
- Una **Operación** es la ejecución del proceso M&A a través de las fases
  canónicas T7-T15 del Transaction OS (NDA → Integración).
- Una **Valoración** se asocia a una **Empresa** y puede vivir embebida en
  su ficha o como entidad propia (si es avanzada / mandataria).
- Un **Documento** se asocia a cualquier otra entidad (`subject_type` +
  `subject_id`).

---

## 7. Reglas de negocio

### 7.1 Cardinalidades obligatorias
- Toda `company` debe tener `sector_id` y `territory_id`.
- Todo `advisor` debe tener `person_id`.
- Todo `mandate` debe tener `user_id` + `advisor_id` + al menos un
  `target_company_id`.
- Todo `match` debe tener `buyer_user_id` + `seller_user_id` + `target_company_id`.
- Toda `operation` debe tener `match_id` + `target_company_id`.
- Toda `valuation` debe tener `target_company_id` + `method`.

### 7.2 Visibility cascading
La visibility de una entidad **no se hereda** de su relación. Una `valuation`
puede ser `private` aunque su `company` sea `public`. Cada entidad declara
la suya.

### 7.3 Inmutabilidad post-firma
Los documentos firmados (`document` con `signed_by_ids` no vacío) son
**inmutables**. Cambios generan una nueva versión (ver §8).

### 7.4 Estados terminales
- `archived` es terminal: una entidad archivada no puede volver a `active`.
- `closed` (solo en `operation`) es terminal.

### 7.5 Ownership transfer
Transferir `owner_id` requiere acción explícita del propietario actual +
aceptación del nuevo. No es side-effect de ninguna otra operación.

### 7.6 Identifiers únicos
- `slug` único por tipo (ej. dos empresas no pueden tener mismo slug, pero
  un `slug` de empresa puede coincidir con un `slug` de sector — son
  espacios distintos).
- `cif` único entre todas las companies activas.
- `id` único globalmente (incluye type como prefijo: `mc_*`, `s_*`, `t_*`).

### 7.7 Lineage de chat → entidad
Cuando una entidad se crea o actualiza desde una conversación del
Copilot, el `lineage` registra:
```json
{
  "step": "ai_extracted",
  "source_conversation_id": "conv_...",
  "source_message_id": "msg_...",
  "confidence": 0.83,
  "at": "2026-06-24T08:12:00Z"
}
```

---

## 8. Versionado

### 8.1 schema_version
Entero monotónico por tipo. Se incrementa cuando:
- Se añade un campo obligatorio (no opcional).
- Se cambia el tipo de un campo existente.
- Se elimina o renombra un campo.

Añadir un campo opcional **no** sube la versión.

### 8.2 Compatibilidad
Los consumidores deben tolerar `schema_version <= current`. Cuando leen una
versión más vieja, normalizan al esquema actual (default values, derived
fields).

### 8.3 Migración explícita
Subir `schema_version` requiere un script de migración en
`/app/backend/scripts/migrations/{type}_{from}_{to}.py` que actualiza
en bulk los registros existentes.

### 8.4 Versionado de documentos firmados
Un `document` firmado no se modifica. Una "nueva versión" es un **nuevo
documento** con `metadata.replaces = <doc_id_anterior>`. El anterior pasa a
`status=archived`.

---

## 9. Ejemplos completos (JSON)

Cada ejemplo respeta el esquema canónico. Los campos opcionales aparecen
solo si tienen valor.

### 9.1 `company` — Kitchen Studio

```json
{
  "id": "mc_kitchen_studio_5h2x",
  "slug": "kitchen-studio-sl",
  "type": "company",
  "schema_version": 1,
  "name": "Kitchen Studio, S.L.",
  "short_name": "Kitchen",
  "description": "Software de gestión hostelera para PyMEs.",
  "aliases": ["Kitchen Studio", "KitchenStudio"],
  "status": "active",
  "tags": ["saas", "horeca", "spain"],
  "owner_type": "system",
  "owner_id": "system",
  "visibility": "public",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2026-06-24T08:00:00Z",
  "source": "mock",
  "confidence": 0.92,
  "external_ids": {
    "cif": "B86540112",
    "linkedin": "company/kitchen-studio-sl"
  },
  "sector_id": "s_software",
  "secondary_sector_ids": ["s_horeca"],
  "territory_id": "t_madrid",
  "founder_ids": ["p_lucia_perez_4f1z"],
  "valuation_ids": ["v_kitchen_studio_2026_q1"],
  "opportunity_ids": [],
  "metadata": {
    "revenue_eur": 5400000,
    "ebitda_eur": 1080000,
    "employees": 32,
    "fiscal_year": 2024
  }
}
```

### 9.2 `sector` — Software

```json
{
  "id": "s_software",
  "slug": "software",
  "type": "sector",
  "schema_version": 1,
  "name": "Software",
  "description": "Empresas que comercializan productos o servicios de software, incluyendo SaaS, software a medida, y plataformas digitales.",
  "status": "active",
  "tags": ["digital", "b2b", "b2c"],
  "owner_type": "system",
  "owner_id": "system",
  "visibility": "public",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2026-06-01T00:00:00Z",
  "source": "user_input",
  "parent_sector_id": "s_tecnologia",
  "child_sector_ids": ["s_software_saas", "s_software_custom"]
}
```

### 9.3 `territory` — Madrid

```json
{
  "id": "t_madrid",
  "slug": "madrid",
  "type": "territory",
  "schema_version": 1,
  "name": "Comunidad de Madrid",
  "short_name": "Madrid",
  "status": "active",
  "tags": ["spain", "capital"],
  "owner_type": "system",
  "owner_id": "system",
  "visibility": "public",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "source": "user_input",
  "parent_territory_id": "t_spain",
  "external_ids": {
    "iso_3166_2": "ES-MD",
    "ine": "13"
  }
}
```

### 9.4 `person` — Lucía Pérez

```json
{
  "id": "p_lucia_perez_4f1z",
  "slug": "lucia-perez",
  "type": "person",
  "schema_version": 1,
  "name": "Lucía Pérez",
  "description": "Fundadora & CEO de Kitchen Studio.",
  "status": "active",
  "owner_type": "system",
  "owner_id": "system",
  "visibility": "public",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "source": "ai_inferred",
  "confidence": 0.78,
  "external_ids": {
    "linkedin": "in/lucia-perez-kitchen"
  },
  "current_company_ids": ["mc_kitchen_studio_5h2x"]
}
```

### 9.5 `advisor` — María Romero (M&A)

```json
{
  "id": "a_maria_romero_8b3y",
  "slug": "maria-romero-ma",
  "type": "advisor",
  "schema_version": 1,
  "name": "María Romero",
  "description": "Asesora M&A especializada en SaaS B2B.",
  "status": "active",
  "tags": ["m&a", "saas", "spain"],
  "owner_type": "system",
  "owner_id": "system",
  "visibility": "public",
  "created_at": "2025-09-10T09:00:00Z",
  "updated_at": "2026-06-20T16:00:00Z",
  "source": "user_input",
  "person_id": "p_maria_romero_8b3y",
  "specialization_sector_ids": ["s_software", "s_software_saas"],
  "specialization_territory_ids": ["t_spain"],
  "mandate_ids": ["m_kitchen_studio_sellside_2026"]
}
```

### 9.6 `mandate` — Sell-side de Kitchen Studio

```json
{
  "id": "m_kitchen_studio_sellside_2026",
  "slug": "kitchen-studio-sellside-2026",
  "type": "mandate",
  "schema_version": 1,
  "name": "Sell-side Kitchen Studio · 2026",
  "status": "active",
  "owner_type": "org",
  "owner_id": "org_a720ff5087aa",
  "visibility": "team",
  "created_at": "2026-02-12T10:00:00Z",
  "updated_at": "2026-06-20T16:00:00Z",
  "source": "user_input",
  "side": "sell_side",
  "client_id": "u_lucia_perez_kitchen",
  "advisor_id": "a_maria_romero_8b3y",
  "target_company_ids": ["mc_kitchen_studio_5h2x"],
  "operation_ids": []
}
```

### 9.7 `operation` — Sell-side operación de Kitchen Studio

```json
{
  "id": "op_kitchen_studio_2026_06",
  "slug": "op-kitchen-studio-2026-06",
  "type": "operation",
  "schema_version": 1,
  "name": "Venta Kitchen Studio (mandato M-2026)",
  "status": "active",
  "owner_type": "org",
  "owner_id": "org_a720ff5087aa",
  "visibility": "team",
  "created_at": "2026-06-01T09:00:00Z",
  "updated_at": "2026-06-24T08:00:00Z",
  "source": "user_input",
  "mandate_id": "m_kitchen_studio_sellside_2026",
  "target_company_id": "mc_kitchen_studio_5h2x",
  "counterparty_company_ids": ["mc_competitor_a", "mc_competitor_b"],
  "document_ids": ["doc_teaser_kitchen_2026", "doc_nda_kitchen_2026"],
  "valuation_ids": ["v_kitchen_studio_2026_q1"],
  "current_phase": "teaser"
}
```

### 9.8 `valuation` — Kitchen Studio (revenue multiple)

```json
{
  "id": "v_kitchen_studio_2026_q1",
  "slug": "v-kitchen-studio-2026-q1",
  "type": "valuation",
  "schema_version": 1,
  "name": "Valoración Kitchen Studio Q1 2026 — multiplo ingresos",
  "status": "active",
  "owner_type": "user",
  "owner_id": "u_lucia_perez_kitchen",
  "visibility": "private",
  "created_at": "2026-03-01T11:00:00Z",
  "updated_at": "2026-03-01T11:00:00Z",
  "source": "mock",
  "target_company_id": "mc_kitchen_studio_5h2x",
  "method": "revenue_multiple",
  "comparable_company_ids": ["mc_competitor_a", "mc_competitor_b"],
  "requested_by_id": "u_lucia_perez_kitchen",
  "metadata": {
    "central_value_eur": 8100000,
    "low_value_eur": 6075000,
    "high_value_eur": 10530000,
    "multiple_value": 1.5,
    "currency": "EUR"
  }
}
```

### 9.9 `document` — Teaser anónimo

```json
{
  "id": "doc_teaser_kitchen_2026",
  "slug": "teaser-kitchen-2026",
  "type": "document",
  "schema_version": 1,
  "name": "Teaser anónimo Kitchen Studio 2026",
  "status": "active",
  "owner_type": "org",
  "owner_id": "org_a720ff5087aa",
  "visibility": "team",
  "created_at": "2026-06-15T14:00:00Z",
  "updated_at": "2026-06-15T14:00:00Z",
  "source": "user_input",
  "subject_type": "operation",
  "subject_id": "op_kitchen_studio_2026_06",
  "kind": "teaser",
  "signed_by_ids": [],
  "metadata": {
    "blob_url": "s3://arroba-docs/teasers/kitchen-2026.pdf",
    "anonymised": true
  }
}
```

### 9.10 `opportunity` — Buy-side SaaS Horeca

```json
{
  "id": "opp_buyside_saas_horeca_2026",
  "slug": "buyside-saas-horeca-2026",
  "type": "opportunity",
  "schema_version": 1,
  "name": "Buy-side SaaS Horeca Iberia",
  "description": "Tesis: adquirir 2-3 SaaS verticales de gestión hostelera en España y Portugal con EBITDA > 500k€.",
  "status": "active",
  "owner_type": "user",
  "owner_id": "u_buyer_inversor",
  "visibility": "private",
  "created_at": "2026-05-10T16:00:00Z",
  "updated_at": "2026-06-24T08:00:00Z",
  "source": "user_input",
  "sector_ids": ["s_software_saas", "s_horeca"],
  "territory_ids": ["t_spain", "t_portugal"],
  "candidate_company_ids": ["mc_kitchen_studio_5h2x", "mc_competitor_a"],
  "pipeline_stage_by_company_id": {
    "mc_kitchen_studio_5h2x": "in_talks",
    "mc_competitor_a": "identified"
  },
  "mandate_id": null
}
```

### 9.11 `client` (compatibilidad con `user` actual)

```json
{
  "id": "u_lucia_perez_kitchen",
  "slug": "lucia-perez-kitchen",
  "type": "client",
  "schema_version": 1,
  "name": "Lucía Pérez",
  "status": "active",
  "owner_type": "system",
  "owner_id": "system",
  "visibility": "system",
  "created_at": "2024-02-01T10:00:00Z",
  "updated_at": "2026-06-20T16:00:00Z",
  "source": "user_input",
  "external_ids": {
    "email": "lucia@kitchen-studio.com"
  },
  "metadata": {
    "role_in_org_default": "operator"
  }
}
```

### 9.12 `organization`

```json
{
  "id": "org_a720ff5087aa",
  "slug": "arroba-demo-org",
  "type": "organization",
  "schema_version": 1,
  "name": "ARROBA Demo Org",
  "status": "active",
  "owner_type": "system",
  "owner_id": "system",
  "visibility": "system",
  "created_at": "2026-01-15T09:00:00Z",
  "updated_at": "2026-06-24T08:00:00Z",
  "source": "user_input",
  "external_ids": {
    "tax_id": "B99999999"
  }
}
```

---

## 10. Principios de evolución

### 10.1 Añadir un nuevo tipo de entidad

1. Editar §3 (tabla de tipos) añadiendo la nueva fila.
2. Editar §5 (relaciones por entidad) añadiendo la sección 5.X.
3. Definir si tiene URL canónica.
4. Crear ejemplo JSON en §9.
5. Crear módulo backend `/app/backend/src/modules/{type}s/`.
6. Crear página en `/app/frontend/src/app/[locale]/{type}/[slug]/page.tsx` (usando `ENTITY_FRAMEWORK.md`).
7. Si tiene Copilot especializado, declararlo en `ARROBA_PHILOSOPHY.md` §12.

### 10.2 Añadir un nuevo campo a un tipo existente

- **Campo opcional**: no requiere subir `schema_version`. Solo se añade en
  §4 (si es común) o §5 (si es relación). Los consumidores antiguos lo
  ignorarán.
- **Campo obligatorio**: requiere subir `schema_version`. Migración
  obligatoria.

### 10.3 Renombrar un campo

1. Subir `schema_version`.
2. Mantener el campo viejo como alias por una versión (deprecation period).
3. Marcar el viejo como deprecated en este documento.
4. Migración explícita que rellena el nuevo y elimina el viejo.

### 10.4 Eliminar un tipo

Solo si nadie consume. Requiere:
1. Marcar `status=archived` en todos los registros existentes.
2. Eliminar de §3.
3. Documentar en CHANGELOG la razón.

### 10.5 Crear una nueva relación

Si es N:N y tiene atributos propios, crea una entidad de unión explícita
(ej. `company_sector_membership` si una empresa puede estar en varios
sectores con weights).

Si es 1:N o N:1 simple, añade el campo en §5 del lado dominante.

---

> **Fuente de verdad complementaria**: `/app/memory/ENTITY_FRAMEWORK.md` (arquitectura UX) declara cómo se **muestran** estas entidades. Este documento (`ENTITY_MODEL.md`) declara cómo **existen**.
