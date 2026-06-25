# arroba.com — Memory Engine Spec v1.0.0

> **Capa canónica**: *Engines & Specs* (séptima capa, pendiente de propagación a `ARROBA_PHILOSOPHY.md` §13 al cierre del Sprint 0).
> **Fase del proyecto**: Sprint 0 · Fase 0.4 (cuarto de 6 specs).
> **Estado**: borrador para revisión humana.
> **Fecha**: 2026-06-25.
> **Documentos predecesores (lectura obligatoria)**: `TRANSACTION_OS_SPEC v1.1.0` · `TRANSACTION_COPILOT_SPEC v1.1.0` · `COPILOTS_SPEC v1.0.0`.
> **Idioma**: español canónico técnico.
>
> Este documento define el **Memory Engine**: el **motor único de memoria** del Transaction OS. Especifica el catálogo cerrado de tipos de memoria, sus scopes, lifecycle, retención, las **4 reglas inviolables de aislamiento (B3)**, el contrato funcional de acceso (read/write/search/forget), la política GDPR y la trazabilidad. Define **contratos**, no tecnología.
>
> **Decisión canónica del usuario (reiterada)**:
> > *"No debe existir memoria independiente por Copilot. Debe existir un único Memory Engine."*
>
> **Documentos del Sprint 0**:
> 1. ✅ `TRANSACTION_OS_SPEC v1.1.0`
> 2. ✅ `TRANSACTION_COPILOT_SPEC v1.1.0`
> 3. ✅ `COPILOTS_SPEC v1.0.0`
> 4. ← **este documento** (`MEMORY_ENGINE_SPEC v1.0.0`)
> 5. `AGENTIC_LAYERS_SPEC` (pendiente)
> 6. `MONETIZATION_SPEC` (pendiente)

---

## Índice

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Glosario](#2-glosario)
3. [Principios canónicos](#3-principios-canónicos)
4. [Catálogo canónico de tipos de memoria](#4-catálogo-canónico-de-tipos-de-memoria)
5. [Aislamiento — las 4 reglas inviolables (B3)](#5-aislamiento--las-4-reglas-inviolables-b3)
6. [Lifecycle de memoria](#6-lifecycle-de-memoria)
7. [Retención](#7-retención)
8. [Lineage y versionado](#8-lineage-y-versionado)
9. [Acceso y políticas de lectura/escritura](#9-acceso-y-políticas-de-lecturaescritura)
10. [Recuperación contextual](#10-recuperación-contextual)
11. [Memoria compartida (Working Context)](#11-memoria-compartida-working-context)
12. [GDPR, privacidad y derecho al olvido](#12-gdpr-privacidad-y-derecho-al-olvido)
13. [Trazabilidad del Memory Engine](#13-trazabilidad-del-memory-engine)
14. [Idempotencia y caching](#14-idempotencia-y-caching)
15. [Boundary First — qué es externo](#15-boundary-first--qué-es-externo)
16. [Integración forward con otros specs](#16-integración-forward-con-otros-specs)
17. [Open Questions](#17-open-questions)

---

## 1. Propósito y alcance

### 1.1 Qué es el Memory Engine

El **Memory Engine** es la **infraestructura transversal de memoria** del Transaction OS. Es **único, centralizado y compartido** entre todos los copilots (Transaction Copilot, Company, Market, Valuation, Advisor), entidades (Empresa, Sector, Territorio, Valoración, Oportunidad, Match, Operación, Mandato, Advisor, Cliente, Organización) y superficies UX (Marketplace, Match Workspace, Deal Workspace, Living Design System).

**Decisión canónica reiterada**: *no existe memoria independiente por Copilot*. La memoria es **un sustrato común** al que cada actor accede bajo políticas estrictas.

### 1.2 Por qué existe

- **Continuidad**: el usuario no debe repetir información al cambiar de página, fase, sesión o entidad.
- **Contexto**: cualquier copilot necesita material previo para responder con calidad.
- **Trazabilidad**: cada dato debe poder rastrearse hasta su origen (usuario, sistema, fuente externa, otro copilot).
- **Conocimiento acumulado**: la plataforma mejora con el uso. Lo aprendido sobre una empresa, sector o flujo se reutiliza.
- **Aislamiento garantizado**: el motor único enforza las **4 reglas inviolables de aislamiento (B3)** a nivel de query, no por convención.
- **GDPR-compliant**: una única infraestructura facilita auditoría, derecho al olvido y retención obligatoria.

### 1.3 Qué NO es el Memory Engine

- **No es MongoDB**. No es Redis. No es Postgres. No es vector DB. No es Neo4j. Es un **spec funcional** de contratos. La elección de tecnología(s) — probable combinación de document store + vector index + append-only audit log — vive en la capa de **Implementación**.
- **No es un motor de búsqueda de la web**. No indexa internet. Indexa memoria propia del Transaction OS.
- **No es la fuente de verdad de las entidades**. La fuente de verdad es la entidad misma (`Company`, `Operation`, etc.); la memoria registra lo que se sabe y se ha hecho sobre las entidades.
- **No es propiedad de ningún copilot**. Los copilots la **usan** (leen/escriben con scope); no la poseen.
- **No es un cache global**. Tiene cache interno (§14) pero su responsabilidad es **persistencia + recuperación contextual con políticas**.

### 1.4 Relación con specs anteriores y forward

| Spec | Relación |
|---|---|
| `TRANSACTION_OS_SPEC v1.1.0` (0.1) | Declara la máquina de estados y el audit log con eventos canónicos (§9 del TOS). El Memory Engine implementa la persistencia del audit y de la memoria de Operation/Match. |
| `TRANSACTION_COPILOT_SPEC v1.1.0` (0.2) | El TC es **el principal consumidor** del Memory Engine: lee de muchos tipos, escribe en Working Context y Operation. Su §8 (Trazabilidad) emite eventos que viven aquí. |
| `COPILOTS_SPEC v1.0.0` (0.3) | Define las 4 reglas B3 (§3.3, §10.2). Este spec las **implementa funcionalmente**. Cada especialista declara sus accesos a memoria (`COPILOTS_SPEC §10`); aquí se valida el contrato. |
| `AGENTIC_LAYERS_SPEC` (0.5, forward) | Define L1/L2/L3/L4. Este spec referencia qué nivel agéntico puede disparar qué tipo de escritura/lectura (§9.5). |
| `MONETIZATION_SPEC` (0.6, forward) | Define costes y cuotas. Este spec referencia qué operaciones de memoria son potencialmente costosas (búsquedas semánticas, consolidaciones grandes). |
| `Risk & Compliance Service` (dependency externa) | Consumidor especial: el Memory Engine expone interfaces de lectura agregada/anonimizada para detección de patrones cross-user. Spec dedicado fuera del Sprint 0. |

### 1.5 Alcance funcional

Este spec define:

1. **11 tipos canónicos de memoria** con scope, propósito, productores, consumidores, lifecycle, retención.
2. **Las 4 reglas inviolables de aislamiento (B3)** documentadas operacionalmente.
3. **Lifecycle** (estados, transiciones, snapshots).
4. **Política de retención** por tipo (10 años Operation; 3 años no-Operation; 2 años conversacional; efímera working context).
5. **Lineage y versionado** de cada entrada.
6. **Contrato de acceso** (read/write/search/forget) por consumidor × tipo.
7. **Recuperación contextual** (queries estructuradas, no descarga total).
8. **GDPR / derecho al olvido**.
9. **Trazabilidad** (eventos canónicos del Memory Engine).
10. **Idempotencia** y caching.

Este spec **NO define**:

- La implementación tecnológica (queda para capa Implementación).
- Esquema final de campos por entidad (vive en `ENTITY_MODEL.md`).
- Pricing / cuotas (en `MONETIZATION_SPEC`).
- Semántica operativa de niveles agénticos (en `AGENTIC_LAYERS_SPEC`).

---

## 2. Glosario

### 2.1 Conceptos centrales

**Memoria**
Conjunto persistente y trazable de **entradas de información** producidas y consumidas por los actores del Transaction OS (usuarios, copilots, sistema, fuentes externas). La memoria es **el sustrato común** sobre el que opera la inteligencia de la plataforma.

**Entrada de memoria** (memory record / artifact)
Unidad atómica de información persistida. Tiene:

- Identificador único.
- Tipo (uno de los 11 del catálogo §4).
- Scope (a qué entidad / actor pertenece).
- Contenido estructurado.
- Lineage (origen y versiones).
- Metadatos (timestamp, autor, confianza, fuentes).
- Estado de lifecycle (§6).

**Tipo de memoria**
Categoría canónica declarada en §4. Cada tipo tiene reglas de scope, retención, acceso y lifecycle propias. **Catálogo cerrado**: añadir un tipo requiere actualizar este spec.

**Scope**
La **partición** de la memoria por entidad o actor. Un scope identifica **a quién / a qué pertenece** una entrada:

- `company.{id}` — scope de la entidad Company.
- `operation.{id}` — scope de la entidad Operation.
- `user.{id}` — scope del usuario.
- `org.{id}` — scope de la organización.
- `advisor.{id}` — scope del Advisor.
- `sector.{id}`, `territory.{id}`, `valuation.{id}`, `opportunity.{id}`, `match.{id}`, `mandate.{id}` — scopes de las demás entidades canónicas.
- `shared.{session_id}.{correlation_id}` — scope de la memoria compartida (working context).
- `audit.global` — scope del audit log (lectura siempre filtrada por permisos del solicitante).

Todo acceso a memoria pasa por un **scope solicitado**; el motor valida que el solicitante tiene permisos sobre ese scope.

**Lineage**
Historia trazable del origen y evolución de una entrada de memoria:

- Quién la creó (usuario, copilot específico, sistema, fuente externa).
- Cuándo.
- Con qué confianza.
- Qué fuentes citó.
- Si es una actualización: a qué versión previa reemplaza y por qué.

**Retención**
Política que define **cuánto tiempo** una entrada permanece accesible antes de ser archivada o purgada. Configurable por tipo (§7).

**Aislamiento** (isolation)
Garantía estructural de que ciertas entradas **nunca** sean accesibles cruzadamente entre actores adversariales o no autorizados. Implementado por las 4 reglas inviolables (§5).

**Acceso**
Conjunto de operaciones canónicas sobre la memoria:

- `read` — leer entradas existentes con filtro.
- `write` — crear nueva entrada.
- `update` — generar nueva versión de una entrada existente (no edición destructiva).
- `search` — búsqueda estructurada o semántica con scope explícito.
- `forget` — solicitud GDPR de borrado / anonimización.
- `archive` — mover a estado terminal no purgado.
- `purge` — eliminar definitivamente (sujeto a retención obligatoria).

**Idempotencia**
Garantía de que una misma operación de escritura disparada con el mismo `correlation_id` no produce duplicados ni efectos secundarios adicionales.

**Versionado de memoria**
Cuando una entrada de memoria se actualiza, **NO se sobreescribe**; se crea una nueva versión con incremento de `version` y referencia explícita a la versión anterior en el lineage. El historial completo de versiones es consultable (§8).

### 2.2 Términos auxiliares

**Working Context**
Memoria efímera que el Transaction Copilot construye para una conversación o invocación (§11). No persiste salvo cuando una respuesta del TC genera escrituras explícitas en memoria persistente.

**Snapshot**
Entrada de memoria **inmutable** creada en un instante canónico (NDA firmado, LOI firmado, SPA firmado, Closing declarado). Sirve como prueba probatoria del estado de la información en ese momento.

**Compactación**
Operación opcional de **resumir** memoria vieja (por ejemplo, conversaciones de hace > 12 meses) en una entrada agregada de mayor nivel, preservando lineage al detalle archivado. No es purga; es agregación.

**Embedding**
Representación vectorial densa de una entrada de memoria, usada para búsquedas semánticas. Vive como **metadato** de la entrada; no es la entrada misma.

**k-anonimización**
Técnica que garantiza que una entrada no pueda atribuirse a menos de **k actores distintos**. Usada para exponer agregados cross-organización sin violar B3 (ver §5.4 y `COPILOTS_SPEC [OPEN-C4]`).

---

## 3. Principios canónicos

### 3.1 Memoria única, motor único

> **Principio inviolable.** No existe memoria independiente por copilot, por página, por superficie UX o por proceso interno. **Existe un único Memory Engine** al que todos los actores acceden con políticas de scope y permisos.

Consecuencias:

- Los copilots **no mantienen state propio** entre invocaciones. Si necesitan continuidad, leen del Memory Engine.
- Una conversación, un análisis, una valoración persisten en el Memory Engine; los copilots los **leen y escriben**, no los **poseen**.
- Una nueva superficie UX (futuro `/sector/{slug}`, futuro `/operacion/{id}`) accede a la misma memoria; no construye una memoria paralela.

### 3.2 Continuidad por defecto, aislamiento estricto entre adversarios (B3 literal)

> *"La memoria cross-deal debe estar activada por defecto, pero limitada al mismo usuario, organización o advisor. No obstante: nunca compartir memoria entre organizaciones diferentes; nunca compartir memoria entre compradores y vendedores; nunca compartir memoria entre clientes distintos de un mismo advisor sin autorización explícita; respetar siempre las políticas definidas en MEMORY_ENGINE_SPEC."* — decisión canónica del usuario.

Las 4 reglas inviolables se desarrollan en §5.

### 3.3 Least privilege (B2)

Cada consumidor accede **solo** a lo que su scope autoriza. La verificación se hace **a nivel de query** dentro del Memory Engine, no por convención del consumidor. Un copilot puede pedir un scope; el motor concede solo lo permitido.

### 3.4 Trazabilidad total

Toda lectura y toda escritura de memoria queda registrada en el audit log (§13). Sin excepciones. Esto:

- Soporta auditoría legal (10 años post-cierre de Operation).
- Permite detectar abuso (consultas masivas anómalas).
- Permite respetar GDPR (qué se accedió, cuándo, para qué).

### 3.5 Inmutabilidad de eventos críticos (audit)

Los eventos canónicos críticos declarados en `TRANSACTION_OS_SPEC §9.2` (★) son **inmutables**: no se reescriben ni se borran. Cualquier rectificación se hace con un evento adicional explícito (`audit.correction`) que cita el `event_id` original.

### 3.6 Mutabilidad controlada de memoria de conocimiento

A diferencia del audit log, la memoria de **conocimiento** (narrativas, insights, valoraciones indicativas, drafts) **puede actualizarse**, pero **siempre con lineage**: la versión nueva referencia a la versión anterior; la antigua queda disponible para consulta histórica hasta que cumpla retención.

### 3.7 GDPR-aware

El Memory Engine **respeta el derecho al olvido** dentro de límites legales y contractuales. Una solicitud GDPR del usuario dispara un flujo formal (§12) que:

- Borra / anonimiza la memoria de su `user.{id}` y entradas que el motor puede atribuirle.
- **No borra** entradas con retención obligatoria (audit de Operations cerradas, evidencia legal). Esas se **anonimizan** dentro de los límites permitidos.

### 3.8 Recuperación contextual

Los consumidores **NO descargan toda la memoria**. Piden **contexto relevante** vía queries estructuradas (§10):

- Por entidad, por operación, por keyword.
- Por embedding similarity (búsqueda semántica).
- Por timeframe, freshness.

Esto controla el coste, la latencia y la exposición de información.

### 3.9 Versionado canónico

Cada entrada tiene `version` (entero) y `prev_version_id` cuando aplica. Las consultas pueden pedir la versión actual (default) o una versión histórica concreta. El historial es consultable mientras la entrada no esté purgada.

### 3.10 Privacidad por diseño

- Aislamiento por defecto entre actores adversariales (§5).
- Mínima exposición en respuestas (least privilege).
- Anonimización opcional para agregados cross-organización (k-anonimización).
- Cifrado en reposo y en tránsito a nivel de implementación (Boundary First, §15).
- Logs de acceso obligatorios (§13).

---

## 4. Catálogo canónico de tipos de memoria

> **Catálogo cerrado**. 11 tipos canónicos. Añadir un tipo requiere actualizar este spec.

### 4.1 Tipo 1 — Memoria de Usuario

| Campo | Valor |
|---|---|
| **Nombre canónico** | `user.{user_id}` |
| **Scope** | Usuario individual (`user_id`) |
| **Propósito** | Preferencias personales, contexto cross-deal del usuario, historial conversacional global, autorizaciones L4 vivas, NBA descartadas, configuración de notificaciones, locale |
| **Productores** | Usuario (preferencias explícitas), Sistema (historial automático), Transaction Copilot (NBA, autorizaciones), todos los copilots (writes vía TC) |
| **Consumidores** | Transaction Copilot (siempre); Company, Market, Valuation, Advisor (subset autorizado por scope) |
| **Lifecycle** | Nace al registrarse el usuario; actualizable; archivable; purgable con GDPR (sujeto a obligaciones del audit) |
| **Retención por defecto** | 2 años desde última actividad. Configurable por usuario en preferencias |
| **Política de borrado** | GDPR full: derecho al olvido respetado. Excepción: lo asociado a Operations cerradas que tienen retención obligatoria de 10 años; en ese caso, se anonimiza la atribución (`user_id` → `redacted_user_<hash>`) pero los hechos quedan |

### 4.2 Tipo 2 — Memoria de Empresa

| Campo | Valor |
|---|---|
| **Nombre canónico** | `company.{company_id}` |
| **Scope** | Entidad Company |
| **Propósito** | Conocimiento acumulado sobre una empresa concreta: ficha, narrativas, insights, señales, conversaciones, watchlists, lineage de operaciones donde apareció, comparables individuales |
| **Productores** | Company Copilot (narrativas, insights); Sistema (datos de Agency Tool); Usuario (notas opcionales); otros copilots (lineage cuando la empresa aparece en una operación) |
| **Consumidores** | Company Copilot (lectura/escritura primaria); Valuation Copilot (lectura de financieros); Market Copilot (lectura de público); Advisor Copilot (lectura post-NDA con scope Operation); TC (lectura amplia) |
| **Lifecycle** | Nace al hidratarse la empresa por primera vez; persistente; archivable si la empresa se archiva |
| **Retención por defecto** | 3 años desde última actividad sobre la empresa por **cualquier usuario** (es memoria semi-pública, no específica de un usuario). Audit de operaciones cerradas sobre la empresa: 10 años |
| **Política de borrado** | Solicitudes GDPR del usuario A no borran la memoria de la empresa (no es del usuario, es de la empresa); solo borran las **conversaciones del usuario A** sobre la empresa |

### 4.3 Tipo 3 — Memoria de Sector / Mercado

| Campo | Valor |
|---|---|
| **Nombre canónico** | `sector.{sector_id}` (paralelo: `territory.{territory_id}`) |
| **Scope** | Entidad Sector o Territory |
| **Propósito** | Conocimiento del Market Copilot: tendencias, benchmarks (múltiplos sectoriales, growth medio), dinámica competitiva, agregados anonimizados, conversaciones previas sobre el sector |
| **Productores** | Market Copilot (análisis sectoriales); Sistema (agregados calculados periódicamente); fuentes externas (lineage explícito) |
| **Consumidores** | Market Copilot (primaria); Valuation Copilot (múltiplos de referencia); Company Copilot (contexto al analizar empresa); TC |
| **Lifecycle** | Acumulativa; refresca regularmente; archiva agregados viejos vía compactación |
| **Retención por defecto** | Indefinida (sujeta a compactación). Análisis específicos de un sector: 3 años; agregados estructurales (benchmarks anuales): indefinido |
| **Política de borrado** | No GDPR-aware en agregados (no contiene PII si k-anonimizados correctamente). Casos límite: ver `[OPEN-D1]` |

### 4.4 Tipo 4 — Memoria de Valoración

| Campo | Valor |
|---|---|
| **Nombre canónico** | `valuation.{valuation_id}` |
| **Scope** | Entidad Valuation |
| **Propósito** | Datos del cálculo de la valoración: método, parámetros, inputs, comparables usados, sensibilidades, intervalo de confianza, autor, fecha |
| **Productores** | Valuation Copilot (primaria); puntualmente Company Copilot (datos fuente) |
| **Consumidores** | Valuation Copilot (referencia para futuras valoraciones); TC (al consolidar respuesta de precio); Advisor Copilot (justificación de LOI/SPA); Company Copilot (referencia desde ficha de empresa) |
| **Lifecycle** | Nace en T2 (Valoración) o en T10 (LOI/NBO) o en T12 (Negociación); permanece referenciable; al promoverse de indicativa a "oficial" se versiona |
| **Retención por defecto** | Asociada a Operation: 10 años post-cierre. Aislada (sin Operation): 3 años desde última actividad |
| **Política de borrado** | GDPR del autor anonimiza `requested_by_id`; el cálculo persiste si es relevante para una Operation cerrada |

### 4.5 Tipo 5 — Memoria de Oportunidad

| Campo | Valor |
|---|---|
| **Nombre canónico** | `opportunity.{opportunity_id}` |
| **Scope** | Entidad Opportunity |
| **Propósito** | Tesis, candidatas evaluadas, exclusiones, decisiones de screening, scoring de Compatibilidad, recomendaciones generadas, conversaciones sobre la Opportunity |
| **Productores** | Market Copilot (scoring, recomendaciones); Usuario (criterios, decisiones); Sistema (Compatibility cálculos); TC |
| **Consumidores** | Market Copilot (primaria); Opportunity Advisor (variante de Market); Advisor Copilot (si hay Mandate); TC |
| **Lifecycle** | Nace en T3; vive durante Discovery Layer; sigue activa post-Match (puede generar más Matches en paralelo); termina al `ABANDONADA` o `ARCHIVADA` |
| **Retención por defecto** | 3 años desde última actividad si no llegó a Match; si generó Operation(es), retención de la Operation (10 años post-cierre) |
| **Política de borrado** | GDPR del owner: anonimiza atribución, conserva agregados si la Opportunity generó Operations |

### 4.6 Tipo 6 — Memoria de Match

| Campo | Valor |
|---|---|
| **Nombre canónico** | `match.{match_id}` |
| **Scope** | Entidad Match (ciclo corto) |
| **Propósito** | Solicitud, perfil del Buyer mostrado al Seller, respuesta del Seller (aceptar/rechazar/expirar), notas opcionales, lineage para Operation creada |
| **Productores** | TC (orquestador del Match); Buyer (solicitud, nota opcional); Seller (respuesta); Sistema (timestamps, expiración); Advisor Copilot (revisión, opcional) |
| **Consumidores** | TC; Advisor Copilot (cuando representa una parte); Company Copilot (referencia desde ficha de empresa target post-aceptación) |
| **Lifecycle** | Nace en sub-acción "Solicitud de Match" (`SOLICITADO`); cierra al transitar a `ACEPTADO` / `RECHAZADO` / `EXPIRADO`. Tras `ACEPTADO`, queda como **referencia histórica** (read-only) en lineage de la Operation creada |
| **Retención por defecto** | Si convertido en Operation: 10 años post-cierre de la Operation (es lineage). Si `RECHAZADO`/`EXPIRADO`: 3 años desde el evento terminal |
| **Política de borrado** | GDPR del Buyer o Seller: anonimiza identidades **excepto** si forma parte de lineage de Operation cerrada (retención obligatoria; se anonimiza atribución, no hechos) |

### 4.7 Tipo 7 — Memoria de Operación

| Campo | Valor |
|---|---|
| **Nombre canónico** | `operation.{operation_id}` |
| **Scope** | Entidad Operation |
| **Propósito** | **La memoria más rica del sistema.** Cubre todas las fases T7-T15: NDA, IM, Q&A log, IOI/LOI drafts y firmas, Data Room access log, DD findings, SPA drafts versionados, Closing memo, Integration plan, comparator outputs, cláusula-by-cláusula decisions, condiciones suspensivas tracker, eventos económicos |
| **Productores** | Todos los copilots; usuarios (Buyer + Seller + Advisors); sistema (transitions, condiciones, monetization); capabilities boundary (firma electrónica, notaría, banca) |
| **Consumidores** | Todos los copilots (con scope autorizado); usuarios (Buyer + Seller + Advisors); UI (Deal Workspace); audit |
| **Lifecycle** | Nace al transitar `Match → ACEPTADO`; vive durante T7-T15; cierra en `CERRADA_CON_ÉXITO` / `CERRADA_SIN_ÉXITO` / `CANCELADA`; no purgable hasta cumplir retención |
| **Retención por defecto** | **10 años post-cierre** (compliance M&A) — incluye audit log de la Operation, todos los documentos firmados, decisiones materiales |
| **Política de borrado** | **NO** se borra. GDPR no aplica retroactivamente sobre Operation cerrada; se anonimiza atribución (`user_id` → `redacted_user_<hash>`) pero los hechos legales quedan |

### 4.8 Tipo 8 — Memoria de Advisor

| Campo | Valor |
|---|---|
| **Nombre canónico** | `advisor.{advisor_id}` |
| **Scope** | Entidad Advisor — **fuertemente particionada por cliente** del Advisor |
| **Propósito** | Playbooks personales del Advisor, plantillas custom, mandatos activos, métricas históricas (operaciones cerradas, valor total, multiplo medio, NPS), preferencias |
| **Productores** | Advisor Copilot (sub-entradas por cliente); Advisor usuario (playbooks, plantillas); Sistema (métricas calculadas) |
| **Consumidores** | Advisor Copilot (primaria); TC (al ofrecer servicios del advisor) |
| **Lifecycle** | Nace al alta del Advisor; cuerpo principal persistente; sub-entradas por cliente siguen lifecycle de mandato/operación |
| **Retención por defecto** | Cuerpo Advisor: 3 años desde última actividad. Sub-entradas atadas a Operation: 10 años (retención de Operation) |
| **Política de borrado** | GDPR del Advisor: anonimiza identidad del Advisor; los mandatos y operaciones quedan con `redacted_advisor_<hash>`. Las plantillas custom se borran (no son hechos contractuales) |

### 4.9 Tipo 9 — Memoria de Organización

| Campo | Valor |
|---|---|
| **Nombre canónico** | `org.{org_id}` |
| **Scope** | Organización |
| **Propósito** | Configuración org-wide, preferencias compartidas, membresías y roles, audit org-level, lineage de Operations donde la organización ha participado |
| **Productores** | Owner / admins de la org; Sistema; TC |
| **Consumidores** | Todos los miembros con permisos; copilots (cuando el actor pertenece a la org); TC |
| **Lifecycle** | Nace al crear la org; vive mientras la org esté `active`; archiva al `suspended` / `archived` |
| **Retención por defecto** | Mientras la org esté `active`; tras archivado: 10 años (compliance) si tuvo Operations; 3 años en otro caso |
| **Política de borrado** | GDPR de la org (vía owner): proceso formal con consentimiento de todos los miembros; lineage de Operations cerradas se anonimiza, no se borra |

### 4.10 Tipo 10 — Memoria de Audit

| Campo | Valor |
|---|---|
| **Nombre canónico** | `audit.global` (segmentado por `entity_type` + `entity_id`) |
| **Scope** | Global, pero **toda lectura se filtra por permisos del solicitante** |
| **Propósito** | **Registro inmutable** de todos los eventos canónicos del TOS (definidos en `TRANSACTION_OS_SPEC §9.1`), del Transaction Copilot (`TRANSACTION_COPILOT_SPEC §8.1`), de los especialistas (`COPILOTS_SPEC §11.1`) y del Memory Engine (§13.2) |
| **Productores** | TODOS los componentes del TOS |
| **Consumidores** | Auditores autorizados, `arroba_team`, `admin`, Risk & Compliance Service (resultados agregados). **Cada usuario ve sólo los eventos que le conciernen.** |
| **Lifecycle** | Append-only; **inmutable**; rectificaciones se hacen con `audit.correction` que cita el evento original |
| **Retención por defecto** | **10 años post-cierre** de la Operation referenciada (compliance M&A). Para eventos no atados a Operation (Discovery Layer abandonado): 3 años. Para eventos del Memory Engine (`memory.read`, `memory.write`): 1 año por defecto (volumen alto, valor decreciente) |
| **Política de borrado** | **NO se borra**. GDPR anonimiza atribución (`actor_user_id` → `redacted_user_<hash>`); los hechos quedan |

### 4.11 Tipo 11 — Memoria Compartida (Working Context)

| Campo | Valor |
|---|---|
| **Nombre canónico** | `shared.{session_id}.{correlation_id}` |
| **Scope** | Sesión conversacional + invocación |
| **Propósito** | Contexto consolidado que el TC construye para una invocación (o serie en cadena) y pasa a especialistas. Incluye subset autorizado de memorias persistentes + findings previos en la misma sesión |
| **Productores** | TC exclusivamente (es el constructor del Working Context) |
| **Consumidores** | TC y los especialistas que invoca (cada uno recibe el subset autorizado para su capacidad) |
| **Lifecycle** | **Efímero**: nace al construirse el contexto, vive durante la(s) invocación(es) en cadena, expira al cerrar la sesión o tras N minutos de inactividad |
| **Retención por defecto** | **No persistente**. Solo metadatos básicos (que existió, quién lo construyó, cuándo) quedan en audit |
| **Política de borrado** | Se descarta automáticamente. Sin GDPR específico (no es PII persistida) |

### 4.12 Resumen del catálogo

| # | Tipo | Persistencia | Retención por defecto | GDPR-aware |
|---|---|---|---|---|
| 1 | Usuario | Persistente | 2 años última actividad | Sí |
| 2 | Empresa | Persistente | 3 años última actividad | Solo conversaciones del usuario |
| 3 | Sector / Mercado | Persistente | 3 años (análisis) / indefinido (agregados) | k-anon |
| 4 | Valoración | Persistente | 10 años (con Op) / 3 años (sin Op) | Anonimiza autor |
| 5 | Oportunidad | Persistente | 3 años / retención Op | Anonimiza owner |
| 6 | Match | Persistente | retención Op / 3 años | Anonimiza partes |
| 7 | Operación | Persistente | **10 años post-cierre** | NO se borra; anonimiza |
| 8 | Advisor | Persistente | 3 años / retención Op | Anonimiza identidad |
| 9 | Organización | Persistente | mientras activa / 10 años / 3 años | Proceso formal |
| 10 | Audit | **Inmutable** | 10 años / 3 años / 1 año (memoria) | NO se borra; anonimiza |
| 11 | Compartida (Working) | **Efímera** | Sesión / minutos | No aplica |

---

## 5. Aislamiento — las 4 reglas inviolables (B3)

> Las 4 reglas son **literales del usuario** y **no negociables**. El Memory Engine las enforza **a nivel de query**: ninguna petición que viole una regla devuelve resultados. El consumidor no necesita conocer la lógica; el motor lo garantiza.

### 5.1 Regla 1 — Nunca compartir memoria entre organizaciones diferentes

**Definición**: ninguna entrada de memoria producida por o sobre la `organization.{org_A}` puede ser leída por miembros, copilots o sistemas en contexto de `organization.{org_B}` (`org_A ≠ org_B`).

**Implementación funcional (invariante)**:

- Cada `read`/`search` lleva un `actor.org_id` declarado.
- El motor filtra por `entry.org_owner_id == actor.org_id` para tipos org-scoped (`company` solo cuando es propiedad privada de la org, `opportunity`, `mandate`, `valuation` privadas, `org.{id}`, `operation.{id}` desde la perspectiva de su org).
- Entradas con `visibility=public` (ficha pública de Company, agregados de Sector k-anonimizados) son accesibles cross-org porque **no son propiedad** de una org.

**Casos límite**:

| Caso | Comportamiento |
|---|---|
| Usuario miembro de dos orgs (org_A y org_B) | Cada sesión declara `actor.org_id` activo; solo lee memoria de la org activa. Cambiar de org reinicia el working context |
| Org A vende activo a Org B (Operation entre dos orgs distintas) | Cada org ve solo **su lado** del scope `operation.{id}` (sus documentos, sus conversaciones, sus advisors). El audit log compartido lo ve `arroba_team` |
| Mismo usuario actúa como buyer en una org y seller en otra | Aplica regla 2 (Buyer↔Seller) además de regla 1 |

**Excepciones gobernadas**: ninguna por defecto. `admin` puede excepcionalmente acceder cross-org para auditoría regulatoria (con `admin.audit_accessed` registrado).

### 5.2 Regla 2 — Nunca compartir memoria entre compradores y vendedores

**Definición**: dentro del scope `operation.{id}` o `match.{id}`, los actores que actúan como **Buyer** y los que actúan como **Seller** **no comparten** ciertos sub-buckets:

- Buyer NO ve el Q&A privado interno del Seller (sus notas).
- Seller NO ve la cualificación detallada interna del Buyer (su tesis interna, fondos no declarados).
- Ambos ven lo **compartido** (NDA firmado, IM liberado, LOI firmada, Data Room según permisos por fase, audit común).

**Implementación funcional (invariante)**:

- Cada entrada de memoria en `operation.{id}` lleva campo `side_visibility: "buyer" | "seller" | "shared" | "advisor_buyer" | "advisor_seller" | "arroba_team_only"`.
- El motor filtra por `actor.role_in_operation` (derivado de la pertenencia al Match/Operation).
- La matriz de permisos por fase (`TRANSACTION_OS_SPEC §8.1`) refina qué se considera `shared` en cada momento del ciclo.

**Casos límite**:

| Caso | Comportamiento |
|---|---|
| Misma organización es Buyer en Operation A y Seller en Operation B | Reglas se aplican **por operación**; no hay transferencia automática de memoria de A a B (aunque ambos sean misma org) |
| Mismo usuario es Buyer en T11 y luego cambia a Seller en otra Operation | Cada Operation tiene su propio scope; los roles se evalúan por operación |
| Usuario representa al Seller pero también es watcher de la empresa target (watchlist propia anterior) | El motor distingue `user.{id}.watchlist` (memoria personal del usuario, no contaminada por su rol en la Operation) de `operation.{id}.seller_side_*` (memoria del rol). El usuario ve ambas pero el copilot que se invoca con `actor.role = seller` solo ve el lado seller en su working context |

**Excepciones gobernadas**: `arroba_team` puede acceder a ambos lados con marca `arroba_team.cross_side_accessed` en audit, solo en mediación de disputa declarada formalmente.

### 5.3 Regla 3 — Nunca compartir memoria entre clientes distintos de un mismo Advisor sin autorización explícita

**Definición**: un Advisor que opera mandatos para Cliente A y Cliente B **no puede** mezclar memoria de uno con otro. El Advisor Copilot, al ser invocado, ve solo el scope del cliente actual.

**Implementación funcional (invariante)**:

- `advisor.{advisor_id}` está particionado en sub-buckets: `advisor.{advisor_id}.client.{client_id}`.
- Cada sub-bucket es accesible solo cuando `actor.current_mandate_id` pertenece a ese cliente.
- El cuerpo principal del Advisor (`advisor.{advisor_id}.playbooks_general`, `advisor.{advisor_id}.metrics_aggregated`) sí es accesible cross-mandato (es memoria del Advisor, no del cliente).

**Casos límite**:

| Caso | Comportamiento |
|---|---|
| Advisor opera dos mandatos en sectores competidores (Cliente A vende empresa de sector X; Cliente B compra en sector X) | El Advisor Copilot, al actuar para A, no ve nada de B y viceversa. El cuerpo del Advisor (playbooks generales del sector X) sí puede ser usado en ambos |
| Cliente A autoriza explícitamente al Advisor a reutilizar su memoria en otro mandato (B) | Se registra `consent.advisor_cross_client_authorized` con `client_id_source = A`, `client_id_target = B`, `expires_at`. El motor permite el cross-acceso solo dentro del scope autorizado y plazo |
| Advisor abandona un mandato y se le contrata para otro distinto del mismo cliente | Mismo cliente: continuidad permitida (no cruza clientes) |

**Excepciones gobernadas**: solo con consentimiento explícito del cliente origen (registrado como entrada de memoria propia con `consent.*`).

### 5.4 Regla 4 — Respetar siempre las políticas definidas en este Memory Engine Spec

**Definición**: las reglas 1-3 no son las únicas. **Toda política declarada en este spec** (retención, GDPR, lineage, scopes, lifecycle, niveles agénticos vs. tipos de memoria, …) es **inviolable** y se enforza a nivel de query/operación.

**Implementación funcional**:

- Cada operación pasa por un **policy gate** centralizado antes de aplicarse.
- El policy gate **rechaza** la operación si viola cualquier política (B3 reglas 1-3, retención obligatoria sobre purge, falta de scope sobre read, etc.).
- El motor emite `memory.access_denied` con `reason` declarado.

**Casos límite**:

| Caso | Comportamiento |
|---|---|
| Solicitud de purga sobre `operation.{id}` aún dentro de retención obligatoria | `memory.purge_denied` con `reason: "retention_not_met"` |
| Lectura cross-org sin scope autorizado | `memory.access_denied` con `reason: "cross_org_isolation"` |
| Escritura con `correlation_id` ya usado en otra escritura distinta | Idempotencia (§14) → la nueva escritura se descarta o se versiona explícitamente |
| Acceso del `arroba_team` a memoria pre-firma sin disputa declarada | `memory.access_denied` con `reason: "no_mediation_open"` (a confirmar en spec del Risk & Compliance Service) |

### 5.5 Agregados anonimizados cross-organización (k-anonimización)

Este apartado cubre `[OPEN-C4]` de `COPILOTS_SPEC` ("uso de agregados anonimizados cross-organización por Market Copilot").

**Política propuesta**:

- Algunos análisis sectoriales se benefician de agregar datos cross-organización (ej. "múltiplos medios de transacciones del sector").
- Para exponer estos agregados sin violar regla 1, se aplican dos requisitos:
  1. **k-anonimización**: el agregado debe representar al menos **k** entidades distintas (`k ≥ 5` por defecto, configurable por política sectorial).
  2. **Aprobación del Risk & Compliance Service**: el agregado solo se expone si el servicio verifica que no permite re-identificación.

**Quién genera estos agregados**: el Memory Engine de forma programada (jobs internos), no en demanda del usuario. Se almacenan como `sector.{id}.aggregates[]` con metadata `k_value` y `risk_compliance_approved_at`.

**Cierra `[OPEN-C4]`**: el Market Copilot **puede** leer agregados k-anonimizados aprobados; **no puede** generar agregados cross-org en demanda.

---

## 6. Lifecycle de memoria

### 6.1 Estados canónicos

```
              ┌─────────────┐
              │   CREATED   │   recién insertada; no operativa todavía
              └──────┬──────┘
                     │ commit
                     ▼
              ┌─────────────┐
        ┌────►│   ACTIVE    │   operativa; leíble y referenciable
        │     └──────┬──────┘
        │            │
        │  unarchive │ archive condition (retención mínima cumplida o trigger explícito)
        │            ▼
        │     ┌─────────────┐
        │     │  ARCHIVED   │   retenida pero no activa; consultable bajo permiso
        │     └──────┬──────┘
        │            │
        │            │ retention max alcanzado o forget aprobado
        │            ▼
        │     ┌─────────────┐
        └─────│   PURGED    │   eliminada; queda traza en audit `memory.purged`
              └─────────────┘
```

### 6.2 Reglas de transición

| Transición | Trigger | Permitido por |
|---|---|---|
| `CREATED → ACTIVE` | Commit exitoso de la operación de escritura | Sistema |
| `ACTIVE → ARCHIVED` | Retención mínima cumplida + condición de archivado (entidad asociada en estado terminal, sin actividad reciente, etc.) | Sistema (job programado) |
| `ARCHIVED → ACTIVE` | Reactivación por uso (consulta + decisión humana o trigger automático) | Sistema, con audit |
| `ARCHIVED → PURGED` | Retención máxima alcanzada O solicitud GDPR aprobada | Sistema, validado por policy gate |
| `ACTIVE → PURGED` | Solo en casos excepcionales (entrada corrupta, decisión `admin`) | `admin`, con `admin.purge_emergency` en audit |

### 6.3 Snapshots inmutables

En **momentos canónicos** del ciclo TOS, el motor crea **snapshots inmutables** del estado relevante de la memoria. Son entradas especiales que sirven como prueba probatoria.

**Momentos canónicos para snapshot**:

| Momento | Qué se snapshot | Ubicación |
|---|---|---|
| `match.solicited` | Estado del Teaser consumido + perfil Buyer en el momento de la solicitud | `match.{id}.snapshot_at_solicitud` |
| `match.accepted` | Estado completo del Match antes de la conversión a Operation | `operation.{id}.lineage.match_snapshot` |
| `nda.fully_signed` | Estado del NDA y de quién firma | `operation.{id}.snapshot_nda` |
| `loi.fully_signed` | Estado de la LOI + valoraciones de referencia + condiciones | `operation.{id}.snapshot_loi` |
| `spa.fully_signed` | Estado del SPA + DD report + condiciones suspensivas | `operation.{id}.snapshot_spa` |
| `closing.declared` | Estado completo de las condiciones suspensivas cumplidas + Closing memo | `operation.{id}.snapshot_closing` |
| `integration.completed` | Estado final del Integration plan + hitos cumplidos | `operation.{id}.snapshot_integration` |

**Propiedades de los snapshots**:

- **Inmutables**: no se modifican ni se borran (salvo `admin.purge_emergency` extremo).
- **Versionables**: si una entrada referenciada cambia tras el snapshot, el snapshot **mantiene** la versión congelada de aquel momento.
- **Compresibles**: pueden almacenarse en cold storage tras X años; siguen consultables con latencia mayor.

### 6.4 Compactación / agregación

Política opcional para reducir volumen de memoria vieja sin perder valor:

- **Cuándo aplica**: conversaciones de hace > 12 meses sin actividad, eventos de audit operacionales (no críticos) de hace > 5 años, sub-entradas de baja relevancia.
- **Cómo se hace**: el motor genera una **entrada agregada** que resume las antiguas, preservando lineage al detalle archivado. Las antiguas pasan a `ARCHIVED` o `PURGED` según retención.
- **No aplica a**:
  - Eventos críticos del audit (★).
  - Documentos firmados (NDA, LOI, SPA).
  - Closing memo, Integration plan.
  - Snapshots de §6.3.

`[OPEN-D2]`: política exacta de compactación (umbrales, frecuencia, qué se considera "baja relevancia") pendiente de afinar con uso real.

### 6.5 Reactivación

Una entrada `ARCHIVED` puede volver a `ACTIVE`:

- Por uso explícito (un copilot pide context que requiere la entrada archivada).
- Por evento del TOS (una Operation cerrada se reabre por orden judicial → memoria asociada vuelve a ser activa).
- Por solicitud administrativa.

Reactivación queda en audit (`memory.reactivated`).

---

## 7. Retención

### 7.1 Tabla maestra de retención por tipo

| Tipo | Retención mínima (legal/contractual) | Retención por defecto | Retención máxima (configurable) | GDPR-aware |
|---|---|---|---|---|
| **Usuario** | n/a | 2 años desde última actividad | indefinido (por opt-in) | Sí (borrado completo salvo enlaces a Op cerrada) |
| **Empresa** | n/a | 3 años última actividad sobre la empresa | indefinido | Solo conversaciones del usuario solicitante |
| **Sector / Mercado** | n/a | 3 años análisis específicos / indefinido agregados | indefinido | k-anon (no PII) |
| **Valoración** | 10 años si vinculada a Op cerrada | 10 años / 3 años aislada | indefinido | Anonimiza autor |
| **Oportunidad** | 10 años si generó Op | 3 años / retención Op | indefinido | Anonimiza owner |
| **Match** | 10 años si convertido en Op | retención Op / 3 años terminales | indefinido | Anonimiza partes |
| **Operación** | **10 años post-cierre** (compliance M&A) | 10 años post-cierre | indefinido | **NO se borra**, anonimiza |
| **Advisor (cuerpo)** | n/a | 3 años última actividad | indefinido | Anonimiza identidad |
| **Advisor (sub-cliente)** | retención del Mandato/Op | retención Mandato/Op | retención Mandato/Op | Hereda |
| **Organización** | 10 años si tuvo Op | mientras activa / 10 años / 3 años | indefinido | Proceso formal |
| **Audit (★ críticos)** | **10 años post-Op** | 10 años post-Op | indefinido | **NO se borra**, anonimiza |
| **Audit (no críticos: lecturas/escrituras Memory)** | n/a | 1 año por defecto | 3 años configurable | Anonimiza |
| **Audit (no-Op: Discovery abandonado)** | n/a | 3 años | indefinido | Anonimiza |
| **Compartida (Working)** | n/a | sesión / minutos | n/a | No aplica |

### 7.2 Decisiones de retención canónicas (a confirmar)

Las decisiones de partida del brief se asumen como **canónicas** salvo revisión:

| Decisión | Estado |
|---|---|
| Operation memory + audit: **10 años post cierre de la Operation** (cierre = fin de fase 15 Integración) | ✅ Canónico |
| Memoria de empresa no asociada a Operation: **3 años desde última actividad** por defecto | ✅ Canónico |
| Memoria conversacional del usuario: **2 años desde última actividad** por defecto (configurable) | ✅ Canónico |
| Memoria compartida (working context): **vida = duración de la sesión / invocación** (no persistente) | ✅ Canónico |

### 7.3 Política de archivado (cold storage conceptual)

Tras retención mínima cumplida y N meses sin actividad, una entrada **puede** moverse de "active storage" a "cold storage":

- Sigue consultable, pero con latencia mayor (segundos/minutos vs ms).
- Coste menor para el sistema.
- Visible para auditoría y para reactivación bajo demanda.

La decisión de qué tecnología materializa cold storage es de **implementación** (Boundary First). Aquí se declara la **capability conceptual**.

### 7.4 Política de GDPR-forget

Cuando un usuario solicita "olvidarme":

1. Memoria de `user.{id}` se borra integralmente (excepto enlaces a Operations cerradas con retención obligatoria).
2. Memoria de `company.{id}` no es del usuario, **no se borra**; sí se borran sus **conversaciones del usuario** sobre la empresa.
3. Memorias de `valuation`, `opportunity`, `match`, `operation` donde el usuario participó: se **anonimiza** la atribución (`user_id` → `redacted_user_<hash>`), no se borran hechos.
4. Audit log: se anonimiza atribución, **no se borra** evento.
5. El proceso GDPR queda en audit (`memory.forget_request` + `memory.forget_executed`).

Detalle operativo en §12.

---

## 8. Lineage y versionado

### 8.1 Identificador único

Cada entrada tiene:

- `id`: identificador único globalmente (UUID o prefijo + hash).
- `type`: uno de los 11 del catálogo.
- `scope`: scope canónico (§2.1).
- `version`: entero, incremental.
- `prev_version_id`: `id` de la versión anterior, si aplica.

### 8.2 Política de versionado

- **Una entrada nunca se sobreescribe.** Una "actualización" crea **una nueva versión** con `prev_version_id` apuntando a la anterior.
- La **versión actual** es la que más alto `version` tiene en su línea de versiones.
- Las versiones antiguas siguen consultables hasta cumplir retención (`ACTIVE` o `ARCHIVED`).
- Una entrada **purgada** se borra junto con todas sus versiones.

### 8.3 Lineage consultable

Para cualquier entrada, se puede responder:

- **Quién la creó**: `created_by: { kind: "user"|"copilot"|"system"|"external", id: "...", role: "..." }`.
- **Cuándo**: `created_at`.
- **Con qué confianza**: `confidence: 0.0..1.0` (para entradas de conocimiento).
- **Qué fuentes citó**: `citations: [{ source, source_id, accessed_at }]`.
- **Versión anterior** (si actualización): `prev_version_id`.
- **Quién la actualizó**: `updated_by`, `updated_at` (para la versión actual).
- **Cadena de versiones** hasta la actual: consultable como lista cronológica.

### 8.4 Política para fuentes externas

Fuentes externas posibles:

- **Agency Tool** (mock o real): datos de empresas.
- **Risk & Compliance Service**: resultados de KYC, screening.
- **Capabilities boundary** (firma electrónica, notaría, banca): confirmaciones.
- **CIS** (Contrato Inicial de Servicios): firmas y aceptaciones.
- **Web scraping autorizado** (futuro).
- **Knowledge Graph propio** (futuro).

Cada fuente externa se marca en `citations.source` con identificador canónico. El Memory Engine **no asume veracidad** de fuentes externas; el consumidor decide su tratamiento.

### 8.5 Resolución de conflictos en actualizaciones concurrentes

Si dos copilots intentan actualizar la **misma versión actual** de una entrada (race condition):

1. **Política base**: **last-write-wins por timestamp**, con la salvedad de que el escritor "perdedor" queda registrado como versión paralela (`branch_version_id`) para revisión manual.
2. **Excepción para entradas con `confidence`**: si dos escrituras coliden y tienen `confidence` declarado, prevalece la de mayor confianza; la otra queda como branch.
3. **Excepción para audit**: append-only, no hay conflicto posible.
4. **Excepción para Operation post-firma**: documentos firmados (`signed_by_ids` no vacío) son **inmutables** (`ENTITY_MODEL.md §7.3`); cualquier intento de update se rechaza con `memory.update_denied: "post_signature_immutable"`.

`[OPEN-D3]`: política de branches paralelos (cuándo se reconcilian manualmente; cuándo expiran). Probablemente requiere UX de admin.

---

## 9. Acceso y políticas de lectura/escritura

### 9.1 Matriz canónica copilot × tipo × operación

> **Leyenda**: ✓ permitido por defecto · 🔒 permitido con scope explícito y aprobación · ✗ prohibido · — no aplica.

| Tipo de memoria | Company | Market | Valuation | Advisor | TC | UI usuario |
|---|---|---|---|---|---|---|
| **Usuario** (`user.{id}`) | 🔒 R (preferencias relevantes) | 🔒 R (preferencias) | 🔒 R (preferencias) | 🔒 R (preferencias) | ✓ R/W | ✓ R/W propio |
| **Empresa** (`company.{id}`) | ✓ R/W | ✓ R (público) | ✓ R (financieros) | 🔒 R (post-NDA) | ✓ R | ✓ R según permisos |
| **Sector** (`sector.{id}`) | ✓ R (público) | ✓ R/W | ✓ R (múltiplos) | 🔒 R | ✓ R | ✓ R público |
| **Territorio** (`territory.{id}`) | ✓ R | ✓ R/W | 🔒 R | 🔒 R | ✓ R | ✓ R público |
| **Valoración** (`valuation.{id}`) | ✓ R (referencia) | 🔒 R | ✓ R/W | 🔒 R (justificar precio) | ✓ R | 🔒 R según permisos |
| **Oportunidad** (`opportunity.{id}`) | 🔒 R | ✓ R/W | 🔒 R | 🔒 R (con Mandate) | ✓ R | ✓ R/W si owner |
| **Match** (`match.{id}`) | 🔒 R (target post-aceptación) | ✗ | ✗ | 🔒 R (representando) | ✓ R/W | ✓ R según rol |
| **Operación** (`operation.{id}`) | 🔒 R (datos empresa) | ✗ | 🔒 R (justificación precio) | ✓ R/W (representando) | ✓ R/W | ✓ R según rol y fase |
| **Advisor (cuerpo)** | ✗ | ✗ | ✗ | ✓ R/W propio | ✓ R | ✓ R/W propio |
| **Advisor (sub-cliente)** | ✗ | ✗ | ✗ | ✓ R/W si scope cliente | ✓ R | 🔒 R con autorización |
| **Organización** (`org.{id}`) | 🔒 R | 🔒 R | 🔒 R | 🔒 R | ✓ R | ✓ R/W si rol org |
| **Audit propio** | — | — | — | — | ✓ W (emite eventos) | ✓ R propio |
| **Audit ajeno** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Compartida (Working)** | ✓ R (subset autorizado) | ✓ R (subset) | ✓ R (subset) | ✓ R (subset) | ✓ R/W | ✗ |

Política derivada:

- **Especialistas** acceden por **dominio** + **scope autorizado** en la invocación (`COPILOTS_SPEC §9.1 permissions.scopes`).
- **TC** tiene acceso **amplio** (orquestador) — ve más, decide menos.
- **UI usuario** accede según su rol activo (subscriber / corporate / investor / advisor) y su scope (propias entidades, operaciones donde participa).
- **`arroba_team`**: ver §9.6 (accesos especiales).
- **`admin`**: ver §9.6.

### 9.2 Operaciones canónicas

```
read(scope, filter, limit, version="latest") → entries[]
search(scope, query, kind="structured"|"semantic", limit) → entries[]
write(scope, entry, correlation_id) → entry_id, version
update(entry_id, patch, correlation_id) → new_entry_id, new_version
archive(entry_id, reason) → ok
purge(entry_id, reason, requires_admin) → ok | denied
forget(user_id, reason) → process_id  (asíncrono, ver §12)
```

Todas las operaciones pasan por el **policy gate** (§5.4) antes de aplicarse.

### 9.3 Política de escritura

- Cada `write` o `update` requiere `correlation_id` para idempotencia (§14).
- Escrituras de tipos `Operation`, `Audit`, `Match` requieren `agentic_level` declarado (L1/L2/L3/L4). Escrituras de niveles superiores (L3/L4) requieren además referencia a la autorización del usuario (ver `AGENTIC_LAYERS_SPEC` forward).
- Escrituras sobre snapshots inmutables (§6.3) se rechazan con `memory.update_denied: "snapshot_immutable"`.
- Escrituras sobre documentos firmados (`signed_by_ids` no vacío) se rechazan con `memory.update_denied: "post_signature_immutable"`.

### 9.4 Política de lectura

- Cada `read` declara el `scope` solicitado; el motor filtra por reglas B3 + scope autorizado.
- Cada `read` declara `freshness` opcional (`latest` por defecto, o versión histórica concreta).
- Cada `read` declara `include_archived: bool` (false por defecto; los archivados no aparecen).
- Cada `read` lleva límite de tamaño (`limit` y `max_tokens_in_payload`) para evitar payloads inflados (§10).

### 9.5 Niveles agénticos vs operaciones de memoria

Forward a `AGENTIC_LAYERS_SPEC` (0.5), propuesta inicial:

| Nivel agéntico | Qué operaciones de memoria puede disparar |
|---|---|
| **L1 (conversacional)** | `read`, `search` |
| **L2 (preparación)** | + `write` de drafts (con flag `draft=true`) |
| **L3 (ejecución asistida)** | + `write` / `update` de entradas oficiales (post-confirmación humana del usuario) |
| **L4 (automatización autorizada)** | + `write` / `update` autorizados por `authorization_id` previo |

El detalle exacto (qué tipos de entrada admiten L4, qué autorizaciones requieren) se materializa en `AGENTIC_LAYERS_SPEC`.

### 9.6 Accesos especiales — `arroba_team` y `admin`

**`arroba_team`**:

- Lectura `audit.global` filtrada por mediación de disputa declarada (con `arroba_team.mediation_open` activa).
- Lectura puntual de `operation.{id}` pre-firma SOLO en disputa.
- **No escribe** en `Operation`, `Match`, documentos firmados.
- **No purga**.
- Cualquier acceso queda en audit (`arroba_team.accessed` con `reason`).

**`admin`**:

- Lectura completa para auditoría regulatoria.
- Purga de emergencia (`admin.purge_emergency`) con justificación.
- Reactivación de `ARCHIVED → ACTIVE`.
- Aprobación de excepciones a las 4 reglas B3 (excepcionales, registradas).

Ningún rol accede a **audit cross-user** directamente. La detección de patrones se delega al `Risk & Compliance Service` (dependency externa).

---

## 10. Recuperación contextual

### 10.1 Filosofía

Los consumidores **NO descargan toda la memoria**. Piden contexto **relevante y acotado**.

Razones:

- Control de **coste** (LLMs cobran por token; payloads inflados son caros).
- Control de **latencia** (downloads grandes ralentizan).
- Control de **exposición** (cuanto menos memoria viaja, menos riesgo de fuga).
- **Calidad**: contexto curado supera a contexto exhaustivo en muchas tareas.

### 10.2 Tipos de query

| Tipo | Descripción | Cuándo se usa |
|---|---|---|
| **Por entidad** (`get_entity_memory`) | Devuelve todo o subset de una entidad concreta (`company.{id}`, `operation.{id}`). | Cuando se necesita visión completa de la entidad activa. |
| **Por operación** (`get_operation_context`) | Subset de `operation.{id}` filtrado por fase y rol. | Cuando un copilot opera dentro de una fase. |
| **Por keyword** (`search_keyword`) | Búsqueda estructurada sobre campos textuales declarados. | Búsqueda específica (ej. "cláusulas de earn-out"). |
| **Por embedding similarity** (`search_semantic`) | Búsqueda vectorial dentro de un scope. | Recuperar conversaciones / documentos similares a una pregunta. |
| **Por timeframe** (`get_recent`) | Entradas con `updated_at > X`. | "Qué ha cambiado en esta operación esta semana". |
| **Por lineage** (`get_lineage`) | Versionado histórico de una entrada. | "Cómo llegó este dato aquí". |

### 10.3 Política de tamaño

Cada query lleva límite explícito:

- `limit: N` (número máximo de entradas devueltas, default 20).
- `max_tokens_in_payload: T` (tamaño máximo en tokens estimados, default 4000).
- `truncate_strategy: "head"|"tail"|"summarize"` (qué hacer si excede; default `summarize` con marca explícita).

### 10.4 Política de freshness

- **`latest`** (default): solo la versión actual de cada entrada.
- **`historical_at: timestamp`**: estado en un instante pasado (consulta a snapshot o reconstrucción por versiones).
- **`include_archived: bool`**: incluir entradas archivadas (false por defecto).

### 10.5 Política de prioridad

Para queries semánticas (`search_semantic`), el motor aplica una **función de scoring** que combina:

- **Similarity score** (embedding distance).
- **Freshness** (entradas recientes priorizadas, decay configurable).
- **Confidence** (entradas con mayor `confidence` priorizadas).
- **Relevance to phase** (entradas asociadas a la fase activa priorizadas).

Detalles de scoring son **implementación**, no spec. El spec declara que **estas dimensiones se consideran**.

### 10.6 Contrato funcional

Esta sección define **contratos funcionales**, no implementación de retrieval. La tecnología subyacente (embedding model, vector index, ranking) vive en la capa de Implementación.

`[OPEN-D4]`: parámetros default exactos (`limit`, `max_tokens`, decay rate) probables a calibrar con uso real.

---

## 11. Memoria compartida (Working Context)

### 11.1 Naturaleza

El **Working Context** es **memoria efímera** que el Transaction Copilot construye para una conversación o invocación (o cadena de invocaciones). Vive solo durante la sesión activa y los minutos posteriores.

### 11.2 Cómo se construye

Cuando el TC recibe un turno del usuario:

1. Identifica `entity_active`, `phase`, `actor`, `intent`.
2. Consulta el Memory Engine con queries acotadas (§10) para obtener:
   - Memoria de la entidad activa.
   - Memoria del usuario relevante.
   - Findings de turnos anteriores en la misma sesión.
   - Subset autorizado de otras memorias relacionadas.
3. **Consolida** ese material en un `working_context_payload` estructurado.
4. Lo guarda como `shared.{session_id}.{correlation_id}`.

### 11.3 Cómo se pasa a un especialista

En cada invocación a un especialista (contrato `COPILOTS_SPEC §9.1`), el TC adjunta como `context.memory_subset` el subset del Working Context que el especialista necesita y al que tiene scope autorizado.

El especialista **NO recibe** el Working Context completo. Solo el subset filtrado.

### 11.4 Cuándo se descarta

- Al cerrar la sesión del usuario.
- Tras N minutos de inactividad (default 30, configurable).
- Al cambiar de entidad activa (se construye uno nuevo).
- Cuando el TC explícitamente lo invalida (cambio crítico de contexto, ej. nuevo Match aceptado).

### 11.5 Persistencia

El Working Context **no se persiste**. Solo metadatos básicos quedan en audit:

- `memory.working_context_created` (con `session_id`, `correlation_id`, fuentes consultadas).
- `memory.working_context_passed_to_specialist` (con `specialist`, `subset_size`).
- `memory.working_context_discarded` (con `reason: "session_ended" | "timeout" | "context_invalidated"`).

Si una respuesta del TC genera escrituras persistentes (drafts, decisiones, transiciones), esas escrituras se materializan como entradas en las memorias persistentes correspondientes; el Working Context queda como antecedente trazable.

### 11.6 Cobertura de scope

El Working Context **respeta** las 4 reglas B3:

- No mezcla memoria cross-org.
- No mezcla buyer↔seller.
- No mezcla clientes cross-mandato de un advisor.
- Respeta retención y aislamiento.

---

## 12. GDPR, privacidad y derecho al olvido

### 12.1 Tipos de memoria por tratamiento GDPR

| Tipo | Tratamiento GDPR |
|---|---|
| **Usuario** | GDPR-full: borrado completo salvo enlaces a Op cerrada (se anonimiza atribución) |
| **Empresa** | GDPR-parcial: borra conversaciones del usuario; no borra ficha de empresa |
| **Sector / Mercado** | No-PII si k-anonimizado correctamente; sin acción GDPR |
| **Valoración** | Anonimiza autor; conserva cálculo si Op cerrada |
| **Oportunidad** | Anonimiza owner; conserva agregados si Op cerrada |
| **Match** | Anonimiza partes; conserva lineage si Op creada |
| **Operación** | **NO se borra**; anonimiza atribuciones |
| **Advisor** | Anonimiza identidad; conserva mandatos como `redacted_advisor_<hash>` |
| **Organización** | Proceso formal con consentimiento de miembros |
| **Audit** | **NO se borra**; anonimiza atribuciones |
| **Compartida (Working)** | Efímera; no aplica GDPR específico |

### 12.2 Tipos de memoria con retención obligatoria que prevalece sobre forget

- **Operation** post-cierre durante 10 años (compliance M&A).
- **Audit critical (★)** durante 10 años.
- **Documentos firmados** (NDA, LOI, SPA, Closing memo) durante 10 años o más según jurisdicción.

Para estos, el "forget" no borra; **anonimiza** la atribución del usuario solicitante:

- `created_by.user_id` → `redacted_user_<hash>`.
- `signed_by_ids[]` → reemplazado por `redacted_signer_<hash>` (la firma sigue siendo legalmente válida; solo se redacta la identidad ante consultas internas del sistema).
- Snapshots (§6.3) son inmutables por definición; mantienen el hash redactado pero no se modifican.

### 12.3 Proceso `forget_request`

```
Usuario solicita forget   ──► memory.forget_request emitido al audit
                                      │
                                      ▼
                         Validación: ¿qué retención obligatoria aplica?
                                      │
                ┌─────────────────────┼─────────────────────┐
                ▼                     ▼                     ▼
        Entradas borrables    Entradas anonimizables   Entradas con retención
                │                     │                     ▼
                │                     │             Mantener; anonimizar atribución
                ▼                     ▼                     │
            Borrar              Anonimizar                  │
                │                     │                     │
                └─────────────────────┴─────────────────────┘
                                      │
                                      ▼
                      memory.forget_executed con resumen detallado
                                      │
                                      ▼
                          Notificación al usuario con el resumen
```

### 12.4 Qué se borra, qué se anonimiza, qué se conserva

- **Borrar**: memoria de usuario aislada de Ops cerradas, conversaciones del usuario sobre entidades, preferencias, NBA descartadas, drafts no vinculados.
- **Anonimizar**: atribuciones en Operations cerradas, en Audit, en Matches convertidos, en Valoraciones de Ops cerradas.
- **Conservar**: hechos contractuales, firmas legales, eventos críticos del audit (★), snapshots, agregados k-anonimizados, datos públicos de Empresas (no son del usuario).

### 12.5 Consentimiento

Cuándo el usuario debe dar consentimiento explícito:

- **Cross-deal memory opt-out**: si en algún momento el usuario quiere desactivar la continuidad por defecto entre sus propias Operations. Por defecto está activada (decisión B3); el usuario puede opt-out.
- **Advisor cross-client memory**: el cliente origen debe autorizar explícitamente que un Advisor reutilice memoria suya en otro mandato (regla 3, §5.3).
- **Compartición agregada externa**: si en el futuro un agregado de mercado se comparte fuera del sistema (publicación, dataset), requiere consentimiento informado.

Detalle de UI/UX del consentimiento vive en Design System.

### 12.6 Auditoría del proceso GDPR mismo (meta-audit)

Cada `forget_request` y cada `forget_executed` queda en audit:

- Identidad del solicitante.
- Fecha de la solicitud.
- Tipos de entrada afectados (resumen).
- Decisiones tomadas (borrar / anonimizar / conservar) con justificación.
- Resultado.
- Validación por `admin` si la solicitud involucra retención obligatoria parcial.

Esta meta-auditoría es **inmutable** y consultable por reguladores.

---

## 13. Trazabilidad del Memory Engine

### 13.1 Política general

**Cada lectura y cada escritura genera evento de audit.** La granularidad puede ajustarse por política de muestreo (§13.3), pero el principio de trazabilidad total se respeta.

### 13.2 Eventos canónicos del Memory Engine

- `memory.read` — lectura completada (con `scope`, `consumer`, `entry_count`, `payload_size`).
- `memory.write` — escritura completada (con `scope`, `producer`, `entry_id`, `version`).
- `memory.update` — actualización completada (`prev_version_id` → `new_version_id`).
- `memory.archive` — entrada movida a `ARCHIVED`.
- `memory.purge` — entrada movida a `PURGED`.
- `memory.purge_denied` — purga rechazada por política (`reason`).
- `memory.access_denied` — acceso rechazado (lectura o escritura) con `reason`.
- `memory.forget_request` — solicitud GDPR recibida.
- `memory.forget_executed` — solicitud GDPR procesada (con resumen).
- `memory.working_context_created` / `_passed_to_specialist` / `_discarded`.
- `memory.snapshot_created` — snapshot inmutable creado en momento canónico.
- `memory.reactivated` — `ARCHIVED → ACTIVE`.
- `memory.update_denied` — actualización rechazada (`reason: "snapshot_immutable" | "post_signature_immutable" | ...`).

### 13.3 Política de muestreo

No todas las lecturas necesitan log detallado:

- **Lecturas críticas** (datos de Operations, documentos firmados, KYC): **siempre** loguean.
- **Lecturas semánticas en working context construction**: pueden agruparse en un evento agregado por sesión (`memory.read_batch_in_session`).
- **Lecturas técnicas internas** (resolución de lineage, expansión de scopes): pueden muestrearse (1:N) para reducir volumen.

`[OPEN-D5]`: parámetros exactos de muestreo a calibrar con uso real.

### 13.4 Vinculación con audit del TC y especialistas

Cada evento del Memory Engine lleva:

- `correlation_id`: liga la operación al turno conversacional del usuario.
- `parent_event_id`: el evento del TC o especialista que disparó la operación.
- `session_id`.
- `actor` (usuario o copilot que originó).

Esto permite reconstruir, dado un turno del usuario, **todo** lo que pasó: TC delegó → especialista invocado → memoria leída → working context construido → escrituras propuestas → escritura aplicada (o rechazada).

### 13.5 Retención de eventos del Memory Engine

Como declarado en §4.10:

- Eventos críticos (★) atados a Operation: **10 años** post-cierre Operation.
- Eventos del Memory Engine (lecturas/escrituras): **1 año** por defecto (volumen alto, valor decreciente).
- Eventos no-Op: **3 años**.

---

## 14. Idempotencia y caching

### 14.1 Idempotencia de escrituras

Cada `write` / `update` lleva `correlation_id` obligatorio. El motor mantiene un **cache de idempotencia** durante una ventana (default 5 minutos, configurable):

- Si llega una escritura con `correlation_id` ya visto y mismo payload → **no se aplica** (retorna el resultado original).
- Si llega con `correlation_id` ya visto pero payload distinto → **se rechaza** con `memory.write_denied: "correlation_id_collision"` (sospecha de bug del consumidor).

Esto soporta reintentos seguros del TC y especialistas.

### 14.2 Cache de lecturas frecuentes

El motor mantiene cache de lecturas para:

- Entidades con alta volumetría de acceso (ficha pública de empresas top, benchmarks sectoriales actualizados).
- Working Contexts dentro de la misma sesión (no re-consultar Memory si el subset ya fue construido).

**TTL de cache de lecturas**:

| Tipo | TTL default |
|---|---|
| Ficha pública empresa | 5 minutos |
| Benchmarks sectoriales | 1 hora |
| Memoria conversacional reciente | 30 segundos |
| Working Context activo | duración de la sesión |
| Documentos firmados (inmutables) | 24 horas |

`[OPEN-D6]`: TTLs exactos a calibrar con uso real.

### 14.3 Política de invalidación

- **Por escritura/update**: cuando una entrada se actualiza, el cache de esa entrada se invalida.
- **Por evento canónico**: ciertos eventos del TOS invalidan caches relevantes (ej. `loi.fully_signed` invalida cache de la Operation y de sus snapshots previos).
- **Por TTL**: caducidad automática.
- **Por petición explícita**: el TC puede pedir invalidar cuando detecta cambios externos.

---

## 15. Boundary First — qué es externo

### 15.1 Filosofía

El Memory Engine **define contratos**. La materialización tecnológica vive en la capa de Implementación:

- Document store (probablemente Mongo o equivalente).
- Vector index (probablemente Qdrant / Pinecone / pgvector).
- Append-only audit log (probablemente kafka topic o equivalente).
- Cold storage (probablemente S3 / Glacier).
- Cache (probablemente Redis).

Estas elecciones son **independientes** del spec. El spec puede sobrevivir cambios tecnológicos sin alterar contratos externos.

### 15.2 Dependencias externas declaradas

#### Risk & Compliance Service

Servicio externo (spec dedicado fuera del Sprint 0, declarado en `COPILOTS_SPEC §2.8`). El Memory Engine:

- **Expone** interfaces de lectura **agregada/anonimizada** para que el servicio detecte patrones cross-user.
- **Consume** resultados del servicio (flags de fraude, KYC verde/rojo) cuando el TC los consulta para mediar decisiones.
- **NO comparte** memoria PII cross-user con el servicio; solo agregados k-anonimizados.

`[OPEN-D7]`: contrato exacto entre Memory Engine y Risk & Compliance Service — pendiente del spec dedicado.

#### CIS (Contrato Inicial de Servicios)

`CIS_SPEC` (laguna P0, fuera Sprint 0). Cuando se materialice:

- Aceptación del CIS por una Organization queda en `org.{id}.cis_acceptances[]` con firma y timestamp.
- Cambios en condiciones del CIS generan nueva versión; aceptaciones previas referencian la versión aceptada.

#### Capabilities boundary (firma electrónica, notaría, banca)

Confirmaciones de cada capability boundary entran como entradas en `operation.{id}.documents[]` con `citations.source` declarando el proveedor.

### 15.3 Knowledge Graph propio (futuro)

Posibilidad futura de modelar relaciones entre entidades como grafo navegable. Si se materializa, el Memory Engine se extendería con:

- Tipo nuevo: `graph_edges` (relaciones tipadas entre entidades canónicas).
- Operaciones nuevas: `traverse`, `find_path`.

No se materializa en este spec. `[OPEN-D8]`: si añadir o no en versión posterior.

---

## 16. Integración forward con otros specs

### 16.1 De `AGENTIC_LAYERS_SPEC` (0.5) necesito

| Necesidad | Detalle |
|---|---|
| Definición operativa de L1/L2/L3/L4 | Para validar la matriz §9.5 (qué operaciones de memoria puede disparar cada nivel) |
| Schema de **autorizaciones L4** | El Memory Engine valida `authorization_id` antes de aplicar escrituras L4. Necesita conocer el esquema |
| Política de **escalado** | Cuándo una acción de nivel inferior se eleva a superior (cuotas, plan) |
| Política de **cuotas** | Qué tipos de operaciones de memoria son sensibles a plan |
| **Kill-switch** L4 | Mecanismo de revocación inmediata: cuando se revoca una autorización, escrituras L4 pendientes deben detenerse |

### 16.2 De `MONETIZATION_SPEC` (0.6) necesito

| Necesidad | Detalle |
|---|---|
| Qué operaciones consumen **créditos** | Probablemente: `search_semantic` (LLM-backed), `compactación`, `working_context_construction` grandes |
| Diferenciación por plan | Qué cuotas de memoria activa permite cada plan (subscriber / corporate / investor / advisor) |
| Coste de **valoración avanzada** y persistencia | CAP-017 de `COPILOTS_SPEC` requiere persistir resultados; cuánto vale, cómo se cobra |
| **Revenue share** | Cómo se atribuyen costes en operaciones donde participan Advisors |

### 16.3 Hacia el Risk & Compliance Service (dependency externa, fuera Sprint 0)

| Necesidad | Detalle |
|---|---|
| Contrato de lectura agregada k-anonimizada | Qué puede leer el servicio sin violar B3 |
| Contrato de consulta de resultados | Cómo el TC consulta flags al servicio |
| Eventos a propagar al servicio | `match.solicited` masivo, `copilot.specialist_denied` repetido, `arroba_team.accessed` cross-side |

---

## 17. Open Questions

> Numeración D1-Dn (D = Spec 0.4). NO se inventan respuestas; se marca como `[OPEN]` con propuesta cuando aplica.

| ID | Pregunta | Propuesta de este spec | Estado |
|---|---|---|---|
| **D1** | Memoria de Sector/Mercado: ¿GDPR-aware o no? | No-PII si k-anonimizada correctamente. Casos límite (sector con 1-2 actores) deberán omitirse | **ABIERTO** — política exacta de k por sector |
| **D2** | Política exacta de compactación (umbrales, frecuencia) | Por defecto: compactar conversaciones > 12 meses sin actividad; eventos de audit operacionales > 5 años; nunca compactar críticos (★), firmados, snapshots | **ABIERTO** — afinar con uso real |
| **D3** | Política de branches paralelos en conflictos de escritura concurrente | Last-write-wins por timestamp; perdedor queda como `branch_version_id` para revisión manual | **ABIERTO** — UX de admin |
| **D4** | Parámetros default exactos de recuperación contextual (`limit`, `max_tokens_in_payload`, decay rate) | Default: `limit=20`, `max_tokens=4000`, decay logarítmico de freshness | **ABIERTO** — calibrar |
| **D5** | Política exacta de muestreo de audit del Memory Engine | Críticas siempre loguean; lecturas técnicas se muestrean 1:N (N a determinar) | **ABIERTO** — calibrar |
| **D6** | TTLs exactos del cache de lecturas | Defaults: ficha empresa 5m, sectoriales 1h, conversación reciente 30s, working context = sesión, firmados 24h | **ABIERTO** — calibrar |
| **D7** | Contrato exacto entre Memory Engine y Risk & Compliance Service | Pendiente del spec dedicado al servicio | **ABIERTO** — dependencia spec externo |
| **D8** | Knowledge Graph propio en versión posterior | No se materializa en v1.0.0. Reservar como extensión futura | **ABIERTO** — roadmap |
| **D9** | ¿Quién genera los agregados k-anonimizados? Frecuencia | Sistema (jobs internos); frecuencia por sector según volumetría. `k ≥ 5` default | **ABIERTO** — política operativa |
| **D10** | Política de **multi-tenant** físico (un Mongo compartido vs uno por org) | Decisión de implementación; este spec exige aislamiento lógico estricto a nivel de query (suficiente si se enforza correctamente) | **ABIERTO** — implementación |
| **D11** | ¿Se permite "snapshot bajo demanda" del usuario (no solo en momentos canónicos)? | Probable NO en v1.0.0 (los 7 momentos canónicos son suficientes; añadir más fragmenta). Reservar para versión futura | **ABIERTO** — confirmación |
| **D12** | Política sobre embeddings: ¿se conservan permanentemente o se recalculan? | Probable: se conservan pero se invalidan cuando cambia el modelo de embedding (rebuild en background) | **ABIERTO** — operativa |
| **D13** | Soft-delete vs hard-delete en purga | Default: soft-delete con flag `purged_at` durante 30 días de gracia; hard-delete tras grace period. GDPR puede pedir hard-delete inmediato | **ABIERTO** — confirmación GDPR |
| **D14** | Cuando una Organization se archiva: ¿qué pasa con la memoria de sus Empresas que estaban en watchlists de otras orgs? | Las watchlists de otras orgs siguen referenciando, pero ven solo lo público. Confirmar | **ABIERTO** — confirmación |
| **D15** | Política de migración de versiones del spec | Cambios menor: aplican automáticamente. Cambios mayor (v2.0.0): operaciones en curso completan con spec original; nuevas usan v2 | **ABIERTO** — alineado con TOS §12 |

### Lagunas estructurales a resolver en specs 0.5 / 0.6

**Para `AGENTIC_LAYERS_SPEC` (0.5)**:

- Definición operativa de L1/L2/L3/L4 con criterios precisos.
- Schema de `authorization_id` para L4: `scope`, `expiration`, `kill_switch`, `specialist_authorized`.
- Cuotas por plan que afectan al Memory Engine (cuántas búsquedas semánticas, cuántas escrituras, cuántos snapshots).

**Para `MONETIZATION_SPEC` (0.6)**:

- Lista cerrada de operaciones de memoria que consumen crédito.
- Tarifas por operación (búsqueda semántica grande, compactación, generación de embeddings).
- Planes con límites: cuánto Working Context activo permite cada plan, cuántas Operations simultáneas, retención máxima.
- Revenue share Advisor / Plataforma cuando se devenga Success Fee.

**Dependencias externas (fuera Sprint 0)**:

- **Risk & Compliance Service spec** (P0) — sin él, agregados cross-org no se exponen seguros.
- **CIS_SPEC** (P0) — define cuándo y cómo se aceptan condiciones plataforma, persistencia en `org.{id}`.
- **DATAROOM_SPEC** (P1) — define estructura de documentos en `operation.{id}.dataroom_*`.
- **ADVISOR_LAYER_SPEC** (P1) — define memoria `advisor.{id}` con más detalle (playbooks, plantillas, métricas).
- **NDA_SPEC, LOI_SPEC** (P0/P1) — plantillas y eventos asociados.

---

> **Fin del documento.** — `v1.0.0` — pendiente de revisión humana.
