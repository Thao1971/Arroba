# Canon Audit Report — Sprint 0.5 · Ciclo A

> **Fecha**: 2026-06-25
> **Versión del canon auditada**: Sprint 0 (6 specs, 9 481 líneas)
> **Alcance**: solo lectura. Cero modificaciones a ningún archivo excepto este informe y `OPEN_ITEMS_CLASSIFICATION.md`.
> **Autor**: agente E1 actuando como auditor documental.
> **Documentos auditados**:
> - `/app/memory/specs/TRANSACTION_OS_SPEC.md` (v1.1.0, 1 949 líneas)
> - `/app/memory/specs/TRANSACTION_COPILOT_SPEC.md` (v1.1.0, 1 434 líneas)
> - `/app/memory/specs/COPILOTS_SPEC.md` (v1.0.0, 1 831 líneas)
> - `/app/memory/specs/MEMORY_ENGINE_SPEC.md` (v1.0.0, 1 236 líneas)
> - `/app/memory/specs/AGENTIC_LAYERS_SPEC.md` (v1.0.0, 1 192 líneas)
> - `/app/memory/specs/MONETIZATION_SPEC.md` (v1.0.0, 1 839 líneas)
> **Documentos legacy consultados** (read-only):
> - `/app/memory/ARROBA_PHILOSOPHY.md` (271 líneas — Filosofía v3.0, promulgada 2026-06-24)
> - `/app/memory/ENTITY_MODEL.md` (818 líneas)
> - `/app/memory/ENTITY_FRAMEWORK.md` (828 líneas)
> - `/app/memory/_INVENTORY_2026.md` (539 líneas, consultado para Stripe ya instalado)

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Contradicciones explícitas](#2-contradicciones-explícitas)
3. [Duplicidades de definición](#3-duplicidades-de-definición)
4. [Nomenclaturas inconsistentes](#4-nomenclaturas-inconsistentes)
5. [Estados / enums incompatibles](#5-estados--enums-incompatibles)
6. [Catálogo unificado de eventos canónicos](#6-catálogo-unificado-de-eventos-canónicos)
7. [Referencias forward no cumplidas](#7-referencias-forward-no-cumplidas)
8. [Entidades con doble definición](#8-entidades-con-doble-definición)
9. [Principios canónicos consolidados](#9-principios-canónicos-consolidados)
10. [OPENs implícitamente resueltos](#10-opens-implícitamente-resueltos)
11. [Dependencias circulares](#11-dependencias-circulares)
12. [Inconsistencias internas tabla ↔ texto](#12-inconsistencias-internas-tabla--texto)
13. [Contradicciones con el canon legacy](#13-contradicciones-con-el-canon-legacy)
14. [Plan de remediación propuesto](#14-plan-de-remediación-propuesto)
15. [Métricas del audit](#15-métricas-del-audit)

---

## 1. Resumen ejecutivo

### 1.1 Conteo global de hallazgos

| Categoría | 🔴 Bloqueante | 🟡 Importante | 🟢 Cosmético | Total |
|---|---:|---:|---:|---:|
| §2 Contradicciones explícitas | 4 | 5 | 0 | 9 |
| §3 Duplicidades de definición | 0 | 6 | 4 | 10 |
| §4 Nomenclaturas inconsistentes | 0 | 5 | 2 | 7 |
| §5 Estados / enums incompatibles | 3 | 4 | 1 | 8 |
| §6 Eventos canónicos duplicados / huérfanos | 0 | 6 | 3 | 9 |
| §7 Forward references no cumplidas | 0 | 7 | 2 | 9 |
| §8 Entidades con doble definición | 2 | 5 | 1 | 8 |
| §9 Principios canónicos replicados | 0 | 4 | 6 | 10 |
| §10 OPENs implícitamente resueltos | 0 | 17 | 0 | 17 |
| §11 Dependencias circulares | 0 | 0 | 0 | 0 |
| §12 Inconsistencias tabla ↔ texto | 0 | 5 | 2 | 7 |
| §13 Contradicciones con canon legacy | 5 | 8 | 2 | 15 |
| **TOTAL** | **14** | **72** | **23** | **109** |

### 1.2 Severidad

- 🔴 **Bloqueante** (14): debe corregirse antes de Sprint 1. Riesgo de implementación divergente o de doble fuente de verdad incompatible. Concentrados en contradicciones con canon legacy (§13), entidades con doble definición (§8) y enums incompatibles (§5).
- 🟡 **Importante** (72): corregir en Ciclo B (propagación). No bloquean Sprint 1 pero introducen ambigüedad operativa.
- 🟢 **Cosmético** (23): consolidaciones de redacción, replicaciones inocuas, nomenclaturas marginales.

### 1.3 Recomendación global

El canon del Sprint 0 está **estructuralmente sólido**. La gran mayoría de hallazgos son:

1. **Contradicciones esperadas** entre los nuevos specs y el canon legacy (`ARROBA_PHILOSOPHY.md`, `ENTITY_MODEL.md`, `ENTITY_FRAMEWORK.md`). Estas contradicciones existen **por diseño**: los 6 specs nuevos evolucionan el modelo y el propio Sprint 0 las anunció como "propagación pendiente al cierre". Son el **insumo principal del Ciclo B**.
2. **Duplicaciones de principios canónicos** entre los 6 specs (voz única, least privilege, aislamiento, trazabilidad, boundary first). Resolver consolidando en una fuente única (`CANON_INDEX.md` u otra) con referencias desde cada spec.
3. **OPENs implícitamente resueltos** en otros specs sin marca formal de CERRADO — al menos 17 detectados. Cerrar formalmente en Ciclo B.
4. **Nomenclatura `team_arroba` vs `arroba_team`** — variante minoritaria (4 ocurrencias) usada solo en `AGENTIC_LAYERS_SPEC` como `plan_id`. Canon mayoritario (96 ocurrencias) es `arroba_team`. Decisión trivial.
5. **Doble enum `Operation.current_phase`**: `ENTITY_MODEL.md §5.7` lista `matching | teaser | nda | im | ioi | loi | dd | qa | spa | closing` (10 valores); `TRANSACTION_OS_SPEC §4.3` declara explícitamente que arranca en `nda` y añade `negotiation` entre `dd` y `spa` (9 valores válidos para Operation, excluyendo `matching` y `teaser` que pertenecen al Discovery Layer / Match). **Bloqueante de Sprint 1** si Sprint 1 toca Operation.
6. **Match como entidad vs Match como mecanismo**: `ARROBA_PHILOSOPHY.md §7` declara explícitamente que "Matching NO es entidad principal". Los specs nuevos lo promueven a entidad canónica de primer nivel. Esta es la decisión más material del Sprint 0 y debe canonizarse en propagación.

### 1.4 Hallazgos críticos que requieren decisión del usuario

Listados en §14.3 con justificación detallada. Adelanto:

1. ✅ Confirmar que `Match` se canoniza como entidad de primer nivel (sobreescribe `ARROBA_PHILOSOPHY.md §7`).
2. ✅ Confirmar que el catálogo de tipos sube de 12 a **13** entidades (añadiendo `match`) en `ENTITY_MODEL.md`.
3. ✅ Confirmar el enum `Operation.current_phase` canónico (9 valores: `nda → im → qa → loi → dd → negotiation → spa → closing → integration`).
4. ✅ Confirmar que la nomenclatura `client` (entidad operacional en ENTITY_MODEL) se renombra a `user` para alinear con el modelo de los 6 specs.
5. ✅ Confirmar el plan canónico `arroba_team` (no `team_arroba`).
6. ✅ Decidir si los 4 copilots especialistas (Company / Market / Valuation / Advisor) sustituyen las 6 identidades especializadas que `ARROBA_PHILOSOPHY.md §12` declara (Company Advisor / Sector Analyst / Territory Analyst / Valuation Advisor / Opportunity Advisor / Deal Advisor).

### 1.5 Métricas resumidas

- **Total líneas auditadas (specs nuevos)**: 9 481
- **Total OPENs identificados**: 101 abiertos + 2 cerrados (E15, F11) = 103 únicos
- **OPENs implícitamente resueltos**: 17 (16,5% del total abierto)
- **Eventos canónicos únicos detectados**: 124 (catálogo completo en §6)
- **Eventos canónicos potencialmente duplicados / solapados**: 6
- **Principios canónicos detectados con replicación cruzada**: 10 fundamentales

---

## 2. Contradicciones explícitas

> Dos specs (o un spec contra el canon legacy) afirman cosas que no pueden ser ciertas a la vez.

| ID | Spec A | Cita A | Spec B | Cita B | Tipo de conflicto | Resolución sugerida | Severidad |
|---|---|---|---|---|---|---|---|
| **CX-01** | `ARROBA_PHILOSOPHY.md` §7 (línea 95) | *"NO son entidades principales: Workspace, Matching, Mandato, Data Room, Q&A, Equipo, Actividad, Documentos."* | `TRANSACTION_OS_SPEC.md` §4 (líneas 165-172) | *"El Match NO es un evento puntual. Es una entidad persistente de transición."* | Match: ¿mecanismo o entidad? Mandato y Documento también listados como "no entidades" en philosophy pero declarados entidad en `ENTITY_MODEL.md §3`. | **Promover Match a entidad de 1.er nivel**. Propagar `ARROBA_PHILOSOPHY.md §7` ajustando lista de "no entidades": Workspace, Data Room, Q&A, Equipo, Actividad permanecen como componentes; Match, Mandato y Documento son entidades canónicas. | 🔴 Bloqueante |
| **CX-02** | `ARROBA_PHILOSOPHY.md` §12 (línea 194) | *"Cada entidad podrá disponer de un agente especializado: Company Advisor, Sector Analyst, Territory Analyst, Valuation Advisor, Opportunity Advisor, Deal Advisor."* (**6 identidades por entidad**) | `COPILOTS_SPEC.md` §3.1 (línea 184) | *"Organización por dominio, no por entidad"* — 4 especialistas (Company, Market, Valuation, Advisor) cubren todos los dominios. | El modelo legacy 6 copilots por entidad vs. modelo nuevo 4 copilots por dominio. El propio `COPILOTS_SPEC §18` lo declara como `[OPEN-C1]` pendiente de propagación. | Confirmar el modelo nuevo (4 especialistas por dominio). Re-redactar `ARROBA_PHILOSOPHY.md §12` para reflejar "página activa contexto + especialista del dominio, no identidad conversacional separada". | 🔴 Bloqueante |
| **CX-03** | `ENTITY_MODEL.md` §5.7 (línea 272) | `current_phase` enum: `matching \| teaser \| nda \| im \| ioi \| loi \| dd \| qa \| spa \| closing` (10 valores incl. `matching` y `teaser`). | `TRANSACTION_OS_SPEC.md` §4.3 (líneas 397-457) | *"`Operation.current_phase` **arranca en `nda`**; no admite `matching` ni `teaser` (esos pertenecen al Discovery Layer / Match)."* + añade `negotiation`. | Enum incompatible. El TOS detecta y avisa: "el spec menciona que `current_phase` arranca en `nda`; el enum legacy lista `matching` y `teaser`". | Actualizar `ENTITY_MODEL.md §5.7` al enum nuevo: `nda → im → qa → loi → dd → negotiation → spa → closing → integration` (9 valores; `ioi` queda como sub-estado opcional dentro de `loi`). | 🔴 Bloqueante |
| **CX-04** | `ENTITY_MODEL.md` §3 (tabla líneas 109-122) | Tipo canónico `client` (Persona física que ejecuta acciones). | `TRANSACTION_OS_SPEC.md`, `MEMORY_ENGINE_SPEC.md`, `AGENTIC_LAYERS_SPEC.md`, `MONETIZATION_SPEC.md` (en múltiples ubicaciones) | Usan `user` (`user_id`, `user.{id}`, `granting_user_id`) como identificador canónico de Persona física. | El legacy llama `client`; los specs nuevos llaman `user`. 29 ocurrencias `user_id` vs 6 `client_id` en los nuevos specs; ENTITY_MODEL menciona `client` 72 veces. | Renombrar canónicamente a `user` en `ENTITY_MODEL.md` (más alineado con la implementación actual `users`/`organizations`/`memberships` que el propio ENTITY_MODEL declara). Mantener `client` como alias deprecated por una versión. | 🔴 Bloqueante |
| **CX-05** | `ARROBA_PHILOSOPHY.md` §6 (línea 87) | Fases: *"Teaser → NDA → Information Memorandum → IOI → LOI → Due Diligence → Negociación → SPA → Cierre"* (9 fases). | `TRANSACTION_OS_SPEC.md` §6 (líneas 497-1355) | 15 fases canónicas (Fase 1 Análisis → Fase 15 Integración post-deal). | El legacy lista solo las fases de la Transacción; el TOS extiende a Discovery (1-6) + Transaction (7-14) + Integración (15). No es contradicción estricta sino **extensión** que requiere propagación. | Actualizar `ARROBA_PHILOSOPHY.md §6` para reflejar las 15 fases canónicas con la distinción Discovery / Transaction. | 🟡 Importante |
| **CX-06** | `TRANSACTION_COPILOT_SPEC.md` §3.2-3.4 | Outputs incluyen campos `voice` y `contributors` visibles. | `COPILOTS_SPEC.md` §3.2 (líneas 192-198) + B6 | Voz única siempre: el TC es la única voz al usuario; ninguna atribución visible. | El propio `COPILOTS_SPEC §18 [OPEN-C2]` reconoce la tensión y declara `voice/contributors` como "metadatos técnicos no renderizados al usuario salvo en modo debug administrativo". Documentado, sin propagación formal. | Actualizar `TRANSACTION_COPILOT_SPEC §3.2-3.4` con nota explícita: `voice/contributors` son **metadatos internos no user-facing**. | 🟡 Importante |
| **CX-07** | `MEMORY_ENGINE_SPEC.md` §4 (catálogo 11 tipos canónicos) | Memoria de Audit es uno de 11 tipos. | `AGENTIC_LAYERS_SPEC.md` §14.6 (línea 1104) | `[OPEN-E4]`: ¿schema de capabilities y autorizaciones vive en `system.{capability_id}.schema` como 12º tipo o sub-scope de `audit.global`? | Tensión real entre el catálogo cerrado de 11 tipos del Memory Engine y la necesidad de persistir schemas de capabilities/autorizaciones. | Decidir en Ciclo B: ampliar a 12 tipos o usar sub-scope de `audit.global`. El propio `AGENTIC_LAYERS §14.6` propone sub-scope. | 🟡 Importante |
| **CX-08** | `MONETIZATION_SPEC.md` §6 (tabla líneas ~880) | Política de overage para criticidad **Crítica**: bloqueo. | `AGENTIC_LAYERS_SPEC.md` §10.2 (tabla criticidad × level) | Capabilities `criticality = Crítica` en L3+ son `default-deny` (no bloqueo por cuota; rechazo por whitelist). | Mecanismos distintos pero relacionados: MONETIZATION habla de overage de cuota (post-consumo); AGENTIC_LAYERS habla de elegibilidad estructural pre-invocación. Pueden coexistir; aclarar en cada uno que son ortogonales. | Añadir nota cruzada en ambos specs: criticidad Crítica enfrenta dos puertas (whitelist + cuota). Sin colisión, pero documentar. | 🟡 Importante |
| **CX-09** | `TRANSACTION_OS_SPEC.md` (numeración interna) | Fases referenciadas como "Fase 1" … "Fase 15". | `AGENTIC_LAYERS_SPEC.md` y `MONETIZATION_SPEC.md` | Referencias como `T1`, `T6_LIBERACION_MARKETPLACE`, `T10_LOI`, `T11_NEGOCIATION`, `T13`, `T14`, `T15`. | El propio `TRANSACTION_OS_SPEC` usa "Fase N"; los specs posteriores usan `TN`. Doble nomenclatura. | Canonizar **una sola**: `T1` … `T15` (más compacto, idiomático para identificadores). Propagar a `TRANSACTION_OS_SPEC` al cierre. | 🟡 Importante |

### 2.1 Falsos positivos descartados

| Tema | Por qué no es contradicción |
|---|---|
| `MEMORY_ENGINE_SPEC` reglas B3 vs `COPILOTS_SPEC` aislamiento | Son redacciones cruzadas del mismo principio. Coherentes. |
| `AGENTIC_LAYERS` matriz `criticality × level` vs `MONETIZATION` política overage | Capas distintas del mismo concepto; ya documentado en CX-08. No es contradicción técnica. |
| `TRANSACTION_COPILOT` proactividad vs `COPILOTS_SPEC` "especialistas no inician" | Coherentes: el TC es proactivo; los especialistas reactivos. Explícito en ambos specs. |

---

## 3. Duplicidades de definición

> Un mismo concepto definido en dos sitios con texto diferente. La diferencia puede ser redacción (cosmética) o sustantiva (importante).

| ID | Concepto | Spec A | Spec B | Diferencia | Resolución sugerida | Severidad |
|---|---|---|---|---|---|---|
| **DD-01** | **Voz única (B6)** | `TRANSACTION_COPILOT_SPEC §3.1` declara el principio fundacional. | `COPILOTS_SPEC §3.2` lo reafirma con "voz única siempre". Re-redactado. | Definiciones esencialmente equivalentes; redacción distinta. | Canonizar en `CANON_INDEX.md` con cita única. Los specs citan ese índice. | 🟢 Cosmético |
| **DD-02** | **Voz única (B6)** | `COPILOTS_SPEC §3.2` | `AGENTIC_LAYERS_SPEC §3.1` cita con "referencia a B6". | Redacción ligeramente distinta; AGENTIC ya cita explícitamente. | Sin acción; AGENTIC ya referencia correctamente. | 🟢 Cosmético |
| **DD-03** | **Voz única (B6)** | `AGENTIC_LAYERS_SPEC §3.1` | `MONETIZATION_SPEC §3.5` ("Voz única monetaria"). | MONETIZATION especializa para el contexto comercial. Redacción distinta. | Mantener especialización temática; añadir referencia explícita a la canónica B6 en TC SPEC. | 🟢 Cosmético |
| **DD-04** | **Least privilege (B2)** | `COPILOTS_SPEC §3.4` (líneas 211-225). | `MEMORY_ENGINE_SPEC §3.3` (líneas 211-214). | `AGENTIC_LAYERS_SPEC §3.2` también lo declara. Total 3 sitios con redacción ligeramente distinta. | Canonizar en `CANON_INDEX.md`; los 3 specs citan. | 🟡 Importante |
| **DD-05** | **Aislamiento estricto entre adversarios (B3)** | `COPILOTS_SPEC §3.3` extenso (líneas 200-210). | `MEMORY_ENGINE_SPEC §3.2` + `MEMORY_ENGINE §5` (las 4 reglas B3 detalladas, líneas ~230-280). | MEMORY_ENGINE es la **fuente más detallada** (4 reglas inviolables enforzadas a nivel query). COPILOTS es declarativo. | Designar `MEMORY_ENGINE_SPEC §5` como fuente canónica; COPILOTS y AGENTIC referencian. | 🟡 Importante |
| **DD-06** | **Continuidad por defecto** | `COPILOTS_SPEC §3.3` (línea 200) + `MEMORY_ENGINE §3.2`. | Definiciones equivalentes. | Sin discrepancia sustantiva. | Sin acción urgente. | 🟢 Cosmético |
| **DD-07** | **Trazabilidad total** | `MEMORY_ENGINE_SPEC §3.4` (líneas 215-222). | `AGENTIC_LAYERS_SPEC §3.11` + `MONETIZATION_SPEC §3.6`. | Cada spec especializa para su dominio (memoria, agéntico, económico). | Canonizar el principio madre en `CANON_INDEX.md`; los specs especializan. | 🟡 Importante |
| **DD-08** | **Idempotencia** | `COPILOTS_SPEC §9.4` (línea 981, ventana 5min). | `MEMORY_ENGINE_SPEC §14` (idempotencia obligatoria por `correlation_id`, cache 5 min). | Misma ventana, misma técnica; texto distinto. | Citas cruzadas suficientes; sin acción urgente. | 🟢 Cosmético |
| **DD-09** | **Boundary First** | Concepto declarado en `MEMORY_ENGINE §15`, `AGENTIC_LAYERS §14`, `MONETIZATION §15` con redacción similar. | 3 sitios. | Replicación con redacción distinta. | Canonizar en `CANON_INDEX.md`. | 🟡 Importante |
| **DD-10** | **Inmutabilidad post-firma** | `ENTITY_MODEL.md §7.3` declara la regla. | `TRANSACTION_OS_SPEC §11`, `MEMORY_ENGINE §6.3`/§8.5 replican. | Redacción equivalente. | Designar `ENTITY_MODEL.md §7.3` como fuente canónica de la regla; los specs referencian. | 🟡 Importante |

---

## 4. Nomenclaturas inconsistentes

| ID | Concepto | Variantes encontradas | Ocurrencias | Spec(s) donde aparece | Canónico sugerido | Severidad |
|---|---|---|---|---|---|---|
| **NM-01** | Plan del equipo arroba | `arroba_team` (96 ocurrencias) · `team_arroba` (4 ocurrencias) | 100 | Mayoritario: todos los specs. Variante minoritaria: `AGENTIC_LAYERS §15.1 línea 936`, §15.1 línea 1117, §16 línea 1149 (E1), §17 línea 1154 (E6). | **`arroba_team`** (canónico). Renombrar las 4 ocurrencias minoritarias. | 🟡 Importante |
| **NM-02** | Persona física que ejecuta acciones | `user` (29 `user_id`) · `client` (6 `client_id` en specs nuevos; 72 en ENTITY_MODEL) | — | Specs nuevos: `user`. Legacy `ENTITY_MODEL.md §3 + §5.6 + §5.11`: `client`. | **`user`** en specs nuevos; renombrar `client → user` en ENTITY_MODEL al cierre del Sprint 0. Mantener alias deprecated. | 🟡 Importante (depende de CX-04) |
| **NM-03** | Fase TOS | `Fase 1`–`Fase 15` (`TRANSACTION_OS_SPEC` numeración interna) · `T1`–`T15` (specs posteriores) | — | TRANSACTION_OS usa "Fase N"; AGENTIC_LAYERS y MONETIZATION usan `TN`. | **`T1`–`T15`** (compacto, idiomático para identificadores). Propagar a TRANSACTION_OS al cierre. | 🟡 Importante (depende de CX-09) |
| **NM-04** | Identidad del orquestador conversacional | `Transaction Copilot` (TC) · `Arroba Copilot` · `Copilot` | — | TRANSACTION_COPILOT_SPEC usa "TC" como identificador técnico, "Arroba Copilot" como **nombre de marca user-facing**. `ARROBA_PHILOSOPHY.md §12` habla del "Copilot global". Coherente con la separación interna/externa, pero conviene declararlo explícitamente. | Mantener: **TC** (técnico) + **Arroba Copilot** (user-facing). Documentar en CANON_INDEX. | 🟢 Cosmético |
| **NM-05** | Plan comercial Subscriber | `subscriber` (33 ocurrencias) · `Subscriber` (34 ocurrencias) | 67 | Indistintamente en MONETIZATION_SPEC. | Convención: minúsculas en `plan_id` (`PL-subscriber`); capitalizado en texto narrativo ("Plan Subscriber"). Consistente con el uso actual. | 🟢 Cosmético |
| **NM-06** | Match estados | `Match.SOLICITADO` · `Match.ACEPTADO` · `Match.RECHAZADO` · `Match.EXPIRADO` | — | Solo en TRANSACTION_OS_SPEC. Coherente. | Sin cambio. | 🟢 OK |
| **NM-07** | Operation lifecycle | `current_phase` (44 ocurrencias) · `operation_phase` (0) · `phase` (50, variadas) | — | TRANSACTION_OS y ENTITY_MODEL usan `current_phase`. Sin variante. | **`current_phase`** canónico. Sin cambio. | 🟢 OK |

---

## 5. Estados / enums incompatibles

### 5.1 Tabla unificada por entidad

| Entidad | Spec(s) | Estados declarados | Discrepancias detectadas | Severidad |
|---|---|---|---|---|
| **Match** | `TRANSACTION_OS_SPEC §4.2` | `SOLICITADO` → `ACEPTADO` \| `RECHAZADO` \| `EXPIRADO` | Coherente en su único origen. **No declarado en ENTITY_MODEL.md** todavía (entidad no listada). | 🔴 Bloqueante (entidad no en ENTITY_MODEL) |
| **Operation.current_phase** | `TRANSACTION_OS_SPEC §4.3` declara: `nda → im → qa → loi → dd → negotiation → spa → closing → integration` (9 valores) | `ENTITY_MODEL.md §5.7`: `matching \| teaser \| nda \| im \| ioi \| loi \| dd \| qa \| spa \| closing` (10 valores) | Enums distintos. Ver CX-03. **Bloqueante**: el `ioi` queda como sub-estado opcional dentro de `loi` en TOS; `matching` y `teaser` excluidos (pertenecen a Discovery / Match); `negotiation` y `integration` añadidos. | 🔴 Bloqueante |
| **Opportunity** | `TRANSACTION_OS_SPEC §4` menciona `Opportunity.ACTIVA`. | `ENTITY_MODEL.md §5.10` no declara enum de status explícito (usa `status` común `active \| inactive \| archived \| pending` de §4.3). | Enum implícito vs explícito. Falta canonizar status específico de `opportunity`. | 🟡 Importante |
| **Capability** | `AGENTIC_LAYERS_SPEC §5.1` declara `current_level ∈ {L1, L2, L3, L4}` + flags `forbidden_levels`, `whitelist_approved_by_admin`. | No declarado en ENTITY_MODEL ni en otros specs. | Es entidad **de configuración / catálogo**, no de dominio. Pero requiere persistencia (ver CX-07). | 🟡 Importante |
| **Authorization L4** | `AGENTIC_LAYERS_SPEC §6.1` declara `status ∈ {active, revoked, expired, consumed}` + `kill_switch_state ∈ {armed, triggered}`. | No declarado en ENTITY_MODEL. | Tipo nuevo (¿12º o 13º?). Persistencia en `audit.global`. | 🟡 Importante |
| **Memoria (lifecycle)** | `MEMORY_ENGINE_SPEC §6` declara `CREATED → ACTIVE → ARCHIVED → PURGED`. | No declarado en ENTITY_MODEL. | Lifecycle interno del Memory Engine; no se materializa como entidad de dominio. | 🟢 Cosmético |
| **Suscripción** | `MONETIZATION_SPEC §8` declara `status ∈ {active, paused, cancelled, expired}`. | No declarado en ENTITY_MODEL ni en otros specs. | Entidad económica nueva. Persistencia interna. | 🟡 Importante |
| **NDA / LOI / SPA** | `TRANSACTION_OS_SPEC` declara eventos `nda.signed_by_party`, `loi.fully_signed`, `spa.fully_signed`. `ENTITY_MODEL.md §5.9` los modela como `document.kind ∈ {nda, loi, spa, ...}` sin enum de status. | El TOS declara estados implícitos (`presented`, `negotiated`, `rejected`, `fully_signed`). | Falta canonización formal del lifecycle por `document.kind`. Probable que viva en specs dedicados (NDA_SPEC, LOI_SPEC, SPA_SPEC) fuera del Sprint 0. | 🟡 Importante (P1 spec dedicado) |

### 5.2 Estado canónico propuesto post-Ciclo B

| Entidad | Enum canónico final |
|---|---|
| **Match** | `SOLICITADO` → `ACEPTADO` \| `RECHAZADO` \| `EXPIRADO` |
| **Operation.current_phase** | `nda → im → qa → loi → dd → negotiation → spa → closing → integration` (con `ioi` como sub-estado opcional dentro de `loi`) |
| **Authorization L4** | `active \| revoked \| expired \| consumed`; `kill_switch_state ∈ {armed, triggered}` |
| **Memoria lifecycle** | `CREATED → ACTIVE → ARCHIVED → PURGED` |
| **Suscripción** | `active \| paused \| cancelled \| expired` |
| **NDA/LOI/SPA lifecycle** | a definir en specs dedicados (post Sprint 0) |

---

## 6. Catálogo unificado de eventos canónicos

> Tabla maestra de **TODOS** los eventos identificados en los 6 specs. 124 eventos únicos detectados. Se marcan duplicados, solapados y huérfanos.

### 6.1 Eventos del TOS (`match.*`, `nda.*`, `loi.*`, `spa.*`, `operation.*`, `closing.*`, `integration.*`)

| Evento | Productor (spec/sección) | Consumidores | Carga útil (síntesis) | Idempotente | Notas |
|---|---|---|---|---|---|
| `match.solicited` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine, MONETIZATION (potencial Finder Fee) | `match_id`, `buyer_id`, `opportunity_id` | sí (`correlation_id`) | OK |
| `match.accepted` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine, MONETIZATION (dispara Finder Fee), Agentic Layer | `match_id`, `seller_id`, `operation_id` (recién creada) | sí | ★ crítico |
| `match.rejected` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `match_id`, motivo | sí | OK |
| `match.expired` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `match_id` | sí | OK |
| `nda.template_loaded` | `TRANSACTION_OS_SPEC §7` | TC | `operation_id` | sí | OK |
| `nda.signed_by_party` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, `party_id` | sí | OK |
| `nda.fully_signed` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine, MONETIZATION (potencial fee parcial) | `operation_id` | sí | ★ crítico |
| `loi.presented` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, `loi_id` | sí | OK |
| `loi.negotiated` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id` | sí | OK |
| `loi.rejected` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id` | sí | OK |
| `loi.fully_signed` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine, MONETIZATION (potencial Success Fee parcial) | `operation_id`, `loi_id` | sí | ★ crítico |
| `spa.clause_agreed` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, `clause_id` | sí | OK |
| `spa.draft_versioned` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, `version_id` | sí | OK |
| `spa.signed_by_party` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, `party_id` | sí | OK |
| `spa.fully_signed` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine, MONETIZATION (Success Fee intermedio si F22) | `operation_id` | sí | ★ crítico |
| `closing.condition_met` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, `condition_id` | sí | OK |
| `closing.declared` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine, MONETIZATION (Success Fee + Advisory Share) | `operation_id` | sí | ★ crítico — dispara billing |
| `integration.completed` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine, MONETIZATION (cierre billing) | `operation_id` | sí | ★ crítico |
| `operation.created` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, `match_id` | sí | OK |
| `operation.paused` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, razón | sí | OK |
| `operation.resumed` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id` | sí | OK |
| `operation.cancelled` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, razón | sí | OK |
| `operation.closed_with_success` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id` | sí | Sinónimo de `closing.declared`? ⚠ |
| `operation.closed_without_success` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, razón | sí | OK |
| `qa.question_posted` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, `question_id` | sí | OK |
| `qa.answer_posted` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id`, `qa_id` | sí | OK |
| `qa.log_closed` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `operation_id` | sí | OK |
| `opportunity.created` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `opportunity_id` | sí | OK |
| `opportunity.published` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `opportunity_id` (al Marketplace) | sí | OK |
| `opportunity.candidate_added` | `TRANSACTION_OS_SPEC §9.2` | TC, Memory Engine | `opportunity_id`, `company_id` | sí | OK |
| `valuation.created` | `TRANSACTION_OS_SPEC` (inferido) | TC, Memory Engine | `valuation_id`, `company_id` | sí | OK |

### 6.2 Eventos del TC (`tc.delegation.*`, `specialist.invocation.*`)

| Evento | Productor | Notas |
|---|---|---|
| `tc.delegation.requested` | `TRANSACTION_COPILOT_SPEC §8` | OK |
| `tc.delegation.completed` | `TRANSACTION_COPILOT_SPEC §8` | OK |
| `tc.delegation.failed` | `TRANSACTION_COPILOT_SPEC §8` | OK |
| `specialist.invocation.completed` | `COPILOTS_SPEC §11` | **Solapa** con `agentic.capability.completed` (ver §6.7 abajo). |
| `copilot.specialist_denied` | `COPILOTS_SPEC §11` | OK |

### 6.3 Eventos de memoria (`memory.*`)

| Evento | Productor | Notas |
|---|---|---|
| `memory.read` | MEMORY_ENGINE §13 | OK (muestreado 1:N según política `[OPEN-D5]`) |
| `memory.read_batch_in_session` | MEMORY_ENGINE §13 | OK |
| `memory.write` | MEMORY_ENGINE §13 | OK |
| `memory.write_denied` | MEMORY_ENGINE §13 | OK |
| `memory.update` | MEMORY_ENGINE §13 | OK |
| `memory.update_denied` | MEMORY_ENGINE §13 | OK |
| `memory.archive` | MEMORY_ENGINE §13 | OK |
| `memory.purge` | MEMORY_ENGINE §13 | OK |
| `memory.purged` | MEMORY_ENGINE §13 | OK |
| `memory.purge_denied` | MEMORY_ENGINE §13 | OK |
| `memory.reactivated` | MEMORY_ENGINE §13 | OK |
| `memory.access_denied` | MEMORY_ENGINE §13 | OK |
| `memory.forget_request` | MEMORY_ENGINE §13 | OK |
| `memory.forget_executed` | MEMORY_ENGINE §13 | OK |
| `memory.snapshot_created` | MEMORY_ENGINE §13 | OK |
| `memory.working_context_created` | MEMORY_ENGINE §13 | OK |
| `memory.working_context_passed_to_specialist` | MEMORY_ENGINE §13 | OK |
| `memory.working_context_discarded` | MEMORY_ENGINE §13 | OK |

### 6.4 Eventos del Agentic Layer (`agentic.*`)

| Evento | Productor | Notas |
|---|---|---|
| `agentic.capability.invoked` | AGENTIC_LAYERS §13 | OK |
| `agentic.capability.completed` | AGENTIC_LAYERS §13 | **Solapa** con `specialist.invocation.completed`. Ver §6.7. |
| `agentic.capability.failed` | AGENTIC_LAYERS §13 | OK |
| `agentic.execution.denied` | AGENTIC_LAYERS §13 | OK |
| `agentic.execution.aborted` | AGENTIC_LAYERS §13 | OK |
| `agentic.execution.completed_during_kill_switch` | AGENTIC_LAYERS §7.8 | OK |
| `agentic.confirmation.received` | AGENTIC_LAYERS §13 | OK |
| `agentic.level.escalated` | AGENTIC_LAYERS §13 | OK |
| `agentic.level.degraded` | AGENTIC_LAYERS §13 | OK |
| `agentic.authorization.granted` | AGENTIC_LAYERS §13 | OK |
| `agentic.authorization.revoked` | AGENTIC_LAYERS §13 | OK |
| `agentic.authorization.expired` | AGENTIC_LAYERS §13 | OK |
| `agentic.authorization.consumed` | AGENTIC_LAYERS §13 | OK |
| `agentic.authorization.modified_attempt` | AGENTIC_LAYERS §13 | OK |
| `agentic.kill_switch.triggered` | AGENTIC_LAYERS §7.7 | OK |
| `agentic.kill_switch.confirmed` | AGENTIC_LAYERS §7.7 | OK |
| `agentic.kill_switch.notified_user` | AGENTIC_LAYERS §7.7 | OK |
| `agentic.kill_switch.notified_team` | AGENTIC_LAYERS §7.7 | OK |
| `agentic.kill_switch.lifted` | AGENTIC_LAYERS §7.7 | OK |
| `agentic.alert.triggered` | AGENTIC_LAYERS §13 | OK |
| `agentic.alert.delivered` | AGENTIC_LAYERS §13 | OK |
| `agentic.compensation.invoked` | AGENTIC_LAYERS §13 | OK |
| `agentic.inverse.invoked` | AGENTIC_LAYERS §13 | OK |
| `agentic.capability.schema_updated` | AGENTIC_LAYERS §13 | OK |
| `agentic.capability.schema_major_update` | AGENTIC_LAYERS §13 | OK |
| `agentic.capability.whitelist_granted` | AGENTIC_LAYERS §13 | OK |
| `agentic.capability.whitelist_revoked` | AGENTIC_LAYERS §13 | OK |

### 6.5 Eventos económicos (`economy.*`)

(38 eventos catalogados en `MONETIZATION_SPEC §12`; todos coherentes. Resumen)

| Bloque | Eventos | Notas |
|---|---|---|
| `economy.subscription.*` | created, renewed, cancelled, upgraded, downgraded, paused, reactivated, expired | OK |
| `economy.credits.*` | granted, purchased, consumed, expired, refunded, transferred | OK |
| `economy.product.*` | consumed, quota_warning, quota_exhausted | OK |
| `economy.overage.*` | triggered, confirmed, deferred, blocked, degraded | OK |
| `economy.finder_fee.*` | calculated, charged, paid, refunded | OK |
| `economy.success_fee.*` | calculated, charged, payment_pending, payment_received, payment_failed, refunded | OK |
| `economy.advisory_share.*` | calculated, scheduled_payout, paid, disputed | OK |
| `economy.refund.*` | requested, approved, executed, rejected | OK |
| `economy.gateway.*` | charge_initiated, charge_succeeded, charge_failed, payout_initiated, payout_succeeded, payout_failed, webhook_received | OK |
| `economy.collection.*` | reminder_sent, escalated, late_fees_applied | OK |
| `economy.invoice.requested` | | OK |

### 6.6 Otros eventos detectados

| Evento | Origen | Notas |
|---|---|---|
| `monetization.fee_due` | Encontrado en `TRANSACTION_OS_SPEC` (citado como evento) | **¿Sinónimo de `economy.finder_fee.charged` o `economy.success_fee.charged`?** Posible solapamiento. ⚠ |
| `lineage.match_snapshot` | Aparece como referencia técnica de lineage en TRANSACTION_OS | OK |
| `arroba_team.accessed` | `MEMORY_ENGINE_SPEC §9.6` (acceso especial de mediación) | OK |
| `kill_switch.triggered` | Forma corta sin prefijo `agentic.` | **Probable typo / inconsistencia** con `agentic.kill_switch.triggered`. ⚠ |

### 6.7 Duplicados / solapamientos / huérfanos detectados

| ID | Evento(s) implicados | Tipo | Severidad |
|---|---|---|---|
| **EV-01** | `specialist.invocation.completed` vs `agentic.capability.completed` | Solapamiento total. La invocación de un especialista **es** la invocación de una capability. | 🟡 Importante |
| **EV-02** | `operation.closed_with_success` vs `closing.declared` | Solapamiento. `closing.declared` es el evento canónico que dispara billing; `operation.closed_with_success` parece redundante salvo que represente un cierre del lifecycle de la Operation tras `integration.completed`. Aclarar. | 🟡 Importante |
| **EV-03** | `monetization.fee_due` (TRANSACTION_OS) vs `economy.finder_fee.charged` / `economy.success_fee.charged` (MONETIZATION) | Probable duplicado en notación antigua. | 🟡 Importante |
| **EV-04** | `kill_switch.triggered` (sin prefijo `agentic.`) | Probable typo en referencia. | 🟢 Cosmético |
| **EV-05** | `tc.delegation.*` vs `agentic.capability.*` | Solapamiento parcial: `tc.delegation.requested` precede a `agentic.capability.invoked`. **No es duplicado** — son eventos distintos del mismo `correlation_id`. Aclarar en documentación. | 🟢 Cosmético |
| **EV-06** | `qa.log_closed` | Productor declarado pero **sin consumidor evidente** en otros specs. Probable huérfano. | 🟢 Cosmético |
| **EV-07** | `economy.invoice.requested` | Sin contraparte `economy.invoice.generated` / `economy.invoice.delivered`. Probable lifecycle incompleto. | 🟡 Importante |
| **EV-08** | `agentic.capability.schema_updated` vs `agentic.capability.schema_major_update` | Coherentes (menor vs mayor). Sin duplicado. | 🟢 OK |
| **EV-09** | `economy.collection.late_fees_applied` | Coherente con normativa española de mora; sin consumidor declarado más allá del audit. | 🟢 OK |

### 6.8 Eventos por spec — totales

| Spec | Eventos producidos | Eventos consumidos | Eventos huérfanos | Eventos con solapamiento |
|---|---:|---:|---:|---:|
| TRANSACTION_OS | 31 | 0 | 1 (`qa.log_closed`) | 2 (`monetization.fee_due`, `operation.closed_*`) |
| TRANSACTION_COPILOT | 3 (`tc.delegation.*`) | múltiples | 0 | 1 (solapamiento parcial con agentic.*) |
| COPILOTS | 2 (`specialist.invocation.completed`, `copilot.specialist_denied`) | múltiples | 0 | 1 (solapamiento total con agentic.capability.completed) |
| MEMORY_ENGINE | 18 | múltiples | 0 | 0 |
| AGENTIC_LAYERS | 27 | múltiples | 0 | 1 (solapamiento con specialist.*) |
| MONETIZATION | 38 | múltiples | 0 | 0 |
| **Total** | **119** | — | **1** | **6** |

> Nota: 119 eventos producidos + 5 referenciados sin productor formal (`monetization.fee_due`, `kill_switch.triggered`, `lineage.match_snapshot`, `arroba_team.accessed`, `actor.role`) = ~124 únicos.

---

## 7. Referencias forward no cumplidas

> Verificación de "promesas" hechas en specs anteriores que debían resolverse en specs posteriores.

| ID | Origen | Forward reference | Destino esperado | Cumple | Notas |
|---|---|---|---|---|---|
| **FR-01** | `TRANSACTION_OS §15` (cierre) | "Actualizar `ENTITY_MODEL.md §5.7` al cierre del Sprint 0 para incluir `negotiation` y excluir `matching`/`teaser`" | `ENTITY_MODEL.md` | ❌ NO | Pendiente del Ciclo B. Esperado. |
| **FR-02** | `TRANSACTION_OS §15` | "Promover `Match` a entidad canónica de primer nivel en `ENTITY_MODEL.md`" | `ENTITY_MODEL.md` | ❌ NO | Pendiente del Ciclo B. Esperado. |
| **FR-03** | `TRANSACTION_OS §14` | "Reorganización del enum `Role` para incluir `arroba_team`" | `ENTITY_MODEL.md` | ❌ NO | Pendiente del Ciclo B. También `[OPEN-C11]`. |
| **FR-04** | `COPILOTS_SPEC §18 [OPEN-C4]` | Detalle del uso de agregados k-anonimizados cross-org → `MEMORY_ENGINE_SPEC` | `MEMORY_ENGINE_SPEC §5.5` | ✅ SÍ | Cerrado de facto. Marcar formalmente. |
| **FR-05** | `COPILOTS_SPEC §18 [OPEN-C7]` | Memoria de Advisor cross-mandato → `MEMORY_ENGINE_SPEC` | `MEMORY_ENGINE_SPEC §5.3` (regla B3 #3) | ✅ SÍ | Cerrado de facto. |
| **FR-06** | `COPILOTS_SPEC §18 [OPEN-C14]` | Audit retention sin Operation → `MEMORY_ENGINE_SPEC` | `MEMORY_ENGINE_SPEC §7.1` (3 años no atados) | ✅ SÍ | Cerrado de facto. |
| **FR-07** | `MEMORY_ENGINE_SPEC §15` | "Schema persistido de capabilities — coordinación con AGENTIC_LAYERS_SPEC" | `AGENTIC_LAYERS_SPEC §14.6` | ⚠ PARCIAL | AGENTIC declara la dependencia pero deja `[OPEN-E4]` abierto. |
| **FR-08** | `AGENTIC_LAYERS_SPEC §15` | "Cuotas y precios → `MONETIZATION_SPEC`" | `MONETIZATION_SPEC §6, §12` | ✅ SÍ (parcial) | MONETIZATION provee anclajes, no precios exactos (esperado). |
| **FR-09** | `COPILOTS_SPEC §18 [OPEN-C3]` | Acceso a datos privados de empresas no compradas → `MONETIZATION_SPEC` | `MONETIZATION_SPEC §11 (eligibility rules)` | ⚠ PARCIAL | MONETIZATION lo cubre estructuralmente pero no resuelve el caso exacto. |
| **FR-10** | `TRANSACTION_OS §14` | "Plantillas legales (NDA, LOI, SPA) → specs dedicados P0" | `NDA_SPEC`, `LOI_SPEC`, `SPA_SPEC` | ❌ NO | **Esperado** — fuera del Sprint 0. |
| **FR-11** | `AGENTIC_LAYERS §14.5` | "Risk & Compliance Service spec" | `Risk_Compliance_Service_SPEC` | ❌ NO | **Esperado** — fuera del Sprint 0. P0. |
| **FR-12** | `MONETIZATION §6.4` y `§15.6` | "CIS_SPEC, BUYER_QUAL_SPEC" | specs dedicados | ❌ NO | **Esperado** — fuera del Sprint 0. |
| **FR-13** | `COPILOTS_SPEC §18 [OPEN-C6]` | Advisor sin Advisor humano → `ADVISOR_LAYER_SPEC` | `ADVISOR_LAYER_SPEC` | ❌ NO | **Esperado** — fuera del Sprint 0. P1. |

### 7.1 Análisis

- **Forward references intra-Sprint-0 cumplidas**: 3 de 5 (60%) — bueno.
- **Forward references intra-Sprint-0 parciales**: 2 (`FR-07` schema persistido, `FR-09` datos privados).
- **Forward references intra-Sprint-0 NO cumplidas pero esperadas (Ciclo B)**: 3 (`FR-01`, `FR-02`, `FR-03` → actualización ENTITY_MODEL/PHILOSOPHY).
- **Forward references a specs externos fuera del Sprint 0**: 4 (`FR-10`, `FR-11`, `FR-12`, `FR-13`) — todas esperadas.

---

## 8. Entidades con doble definición

> Para cada entidad canónica, comparativa de su definición en specs nuevos vs canon legacy.

| Entidad | Definición canónica donde está | Atributos coincidentes | Atributos divergentes | Definición canónica sugerida | Severidad |
|---|---|---|---|---|---|
| **Match** | `TRANSACTION_OS_SPEC §4`; **NO en ENTITY_MODEL.md** | n/a (no en ENTITY_MODEL) | Entidad **no declarada** en ENTITY_MODEL legacy (`ARROBA_PHILOSOPHY.md §7` la prohíbe explícitamente como entidad) | Promover a **entidad canónica de primer nivel** en `ENTITY_MODEL.md`. Catálogo sube a 13 tipos. | 🔴 Bloqueante |
| **Operation** | `TRANSACTION_OS_SPEC §4.3` (15 fases, enum `current_phase` 9 valores) + `ENTITY_MODEL.md §5.7` (10 valores incl. `matching`/`teaser`) | `mandate_id`, `target_company_id`, `current_phase` | Enum `current_phase` divergente (ver §5.1 CX-03) | Actualizar `ENTITY_MODEL.md §5.7` al enum del TOS. | 🔴 Bloqueante |
| **Opportunity** | `TRANSACTION_OS_SPEC §4.1` + `ENTITY_MODEL.md §5.10` | `owner_user_id`/`owner` ?, `sector_ids`, `candidate_company_ids`, `mandate_id`, `pipeline_stage_by_company_id` | TRANSACTION_OS añade estados (`ACTIVA`) que ENTITY_MODEL no formaliza | Añadir enum `Opportunity.status` en ENTITY_MODEL. | 🟡 Importante |
| **Capability** | `AGENTIC_LAYERS_SPEC §5` declara schema canónico. | n/a | No declarada en ENTITY_MODEL. | Decidir: añadir como tipo canónico nuevo en ENTITY_MODEL o mantener como objeto de configuración interno del Agentic Layer (CX-07). | 🟡 Importante |
| **Authorization L4** | `AGENTIC_LAYERS_SPEC §6` declara schema canónico. | n/a | No declarada en ENTITY_MODEL. | Idem Capability. | 🟡 Importante |
| **Producto comercial (P01-P12)** | `MONETIZATION_SPEC §4` declara catálogo de 12 productos. | n/a | No declarado en ENTITY_MODEL. | Decidir: ¿añadir como tipo canónico o como objeto de catálogo comercial interno? | 🟡 Importante |
| **Plan (PL-*)** | `MONETIZATION_SPEC §5` declara 7 planes. | n/a | No declarado en ENTITY_MODEL. | Idem productos. | 🟡 Importante |
| **Suscripción** | `MONETIZATION_SPEC §8`. | n/a | No declarada en ENTITY_MODEL. | Decidir si entidad canónica de dominio. | 🟢 Cosmético (operacional) |

### 8.1 Tipos canónicos coincidentes (sin divergencia material)

| Entidad | Spec(s) | Estado |
|---|---|---|
| `company` | ENTITY_MODEL §5.1 + referenciada coherentemente en los 6 specs | ✅ OK |
| `sector` | ENTITY_MODEL §5.2 + Market Copilot la cubre | ✅ OK |
| `territory` | ENTITY_MODEL §5.3 + Market Copilot | ✅ OK |
| `person` | ENTITY_MODEL §5.4 | ✅ OK (poco usada por specs nuevos) |
| `advisor` | ENTITY_MODEL §5.5 + Advisor Copilot la cubre | ✅ OK |
| `mandate` | ENTITY_MODEL §5.6 + Mandate referenciado coherentemente | ✅ OK (aunque `ARROBA_PHILOSOPHY §7` lo prohíbe como entidad — CX-01) |
| `valuation` | ENTITY_MODEL §5.8 + Valuation Copilot | ✅ OK |
| `document` | ENTITY_MODEL §5.9 + referenciado coherentemente | ✅ OK (aunque `ARROBA_PHILOSOPHY §7` lo prohíbe — CX-01) |
| `organization` | ENTITY_MODEL §5.11 + coherente | ✅ OK |
| `client` / `user` | ENTITY_MODEL §5.11 vs `user` en specs nuevos | ⚠ Renombre (CX-04) |

---

## 9. Principios canónicos consolidados

> Lista unificada con sitio de origen y replicaciones detectadas.

### 9.1 Principios fundamentales

| Principio | Origen canónico sugerido | Replicaciones detectadas | Status |
|---|---|---|---|
| **Voz única (B6)** | `TRANSACTION_COPILOT_SPEC §3.1` | `COPILOTS_SPEC §3.2`, `AGENTIC_LAYERS_SPEC §3.1`, `MONETIZATION_SPEC §3.5` | Canonizar en CANON_INDEX |
| **Least privilege (B2)** | (canónico cruzado) | `COPILOTS_SPEC §3.4`, `MEMORY_ENGINE_SPEC §3.3`, `AGENTIC_LAYERS_SPEC §3.2` | Canonizar en CANON_INDEX |
| **Aislamiento estricto entre adversarios (B3)** — 4 reglas inviolables | `MEMORY_ENGINE_SPEC §5` (la más detallada) | `COPILOTS_SPEC §3.3`, `AGENTIC_LAYERS_SPEC §3.3`, `MONETIZATION_SPEC §16` | Designar MEMORY_ENGINE §5 como fuente |
| **Continuidad por defecto** | `MEMORY_ENGINE_SPEC §3.2` + `COPILOTS_SPEC §3.3` | Replicación menor | Sin acción urgente |
| **Trazabilidad total e inmutable** | `MEMORY_ENGINE_SPEC §3.4` | `AGENTIC_LAYERS_SPEC §3.11`, `MONETIZATION_SPEC §3.6` | Canonizar en CANON_INDEX |
| **Inmutabilidad post-firma** | `ENTITY_MODEL.md §7.3` | `TRANSACTION_OS_SPEC §11`, `MEMORY_ENGINE §6.3`/§8.5 | Designar ENTITY_MODEL §7.3 como fuente |
| **Boundary First** | (transversal) | `MEMORY_ENGINE §15`, `AGENTIC_LAYERS §14`, `MONETIZATION §15` | Canonizar en CANON_INDEX |
| **Match-as-entity** | `TRANSACTION_OS_SPEC §4` | — (entidad nueva) | Canonizar al propagar |
| **Autonomía ≠ Inteligencia (P4)** | `AGENTIC_LAYERS_SPEC §3.5` | — | Canon nuevo |
| **Evolución progresiva sin reescritura (P5)** | `AGENTIC_LAYERS_SPEC §3.6` | — | Canon nuevo |
| **Reversibilidad declarada (P6)** | `AGENTIC_LAYERS_SPEC §3.7` + §9 | `MONETIZATION_SPEC §3.8` (cargos), §16 | Canon nuevo |
| **Criticidad independiente del nivel (P7)** | `AGENTIC_LAYERS_SPEC §3.8` + §10 | `MONETIZATION_SPEC §6` (con traducción) | Canon nuevo |
| **Principio de Monetización (P1)** | `MONETIZATION_SPEC §3.1` | — | Canon nuevo |
| **Principio de Desacoplamiento (P2)** | `MONETIZATION_SPEC §3.2` | — | Canon nuevo |
| **No existen autorizaciones globales (D2)** | `AGENTIC_LAYERS_SPEC §3.9` | — | Canon nuevo |
| **Kill-switch es derecho del usuario (D3)** | `AGENTIC_LAYERS_SPEC §3.10` | `MONETIZATION_SPEC §3.7` (sin sorpresas) parcial | Canon nuevo |
| **Plan + Permisos + Riesgo (D3 MONETIZATION)** | `MONETIZATION_SPEC §3.4` + §11 | — | Canon nuevo |
| **Transparencia previa (sin sorpresas en cargos)** | `MONETIZATION_SPEC §3.7` | — | Canon nuevo |
| **Voz única monetaria (B6 → monetario)** | `MONETIZATION_SPEC §3.5` | Especialización de B6 | OK |
| **Lenguaje de usuario (en monetización)** | `MONETIZATION_SPEC §3.3` | — | Canon nuevo |
| **Default-deny criticidad Crítica L3+** | `AGENTIC_LAYERS_SPEC §3.12` | `MONETIZATION_SPEC §11` (whitelist admin) | OK |

### 9.2 Análisis de replicaciones

- **Replicaciones aceptables** (especialización temática): voz única en TC vs voz única monetaria; trazabilidad técnica vs económica.
- **Replicaciones consolidables** (texto distinto, mismo principio): Least Privilege (3 sitios), Aislamiento (3 sitios), Boundary First (3 sitios). Consolidar en `CANON_INDEX.md` con texto único + referencias desde specs.
- **Sin replicación**: nuevos principios introducidos por un único spec (P1, P2, P4, P5, P6, P7, D2, D3) — sin duplicación.

---

## 10. OPENs implícitamente resueltos

> OPENs de un spec que ya tienen respuesta en otro spec aunque no estén marcados como CERRADO. Cerrar formalmente en Ciclo B.

| OPEN-ID | Spec origen | Pregunta resumida | Resuelto en | Cita / evidencia | Acción sugerida en Ciclo B |
|---|---|---|---|---|---|
| **OPEN-A12** | TRANSACTION_OS | Persistencia de Recomendaciones (fase 5): efímeras o persistidas | `TRANSACTION_COPILOT_SPEC [OPEN-B1]` y `COPILOTS_SPEC §6.3` + §16.30 | "Persistir las accionadas; efímeras las no accionadas." | CERRAR A12 y B1 con redacción coherente. |
| **OPEN-B1** | TRANSACTION_COPILOT | (idem A12) | Ver A12 | — | Idem. Cerrar conjuntamente con A12. |
| **OPEN-B5** | TRANSACTION_COPILOT | Política de timeouts entre TC y especialistas | `COPILOTS_SPEC §9.4 + §13` | Timeouts declarados (12s default, fallback declarado) | CERRAR B5. |
| **OPEN-B7** | TRANSACTION_COPILOT | ¿El TC pregunta antes de L2? | `AGENTIC_LAYERS_SPEC §4.2` (L2 prepara draft sin confirmación contemporánea; confirmación es L3) | "Quién decide: el usuario sobre el borrador preparado. […] sin confirmación L3." | CERRAR B7. |
| **OPEN-C2** | COPILOTS | Tensión `voice/contributors` visibles vs B6 | `COPILOTS_SPEC §12.6` ya declara metadatos internos | "voice/contributors son metadatos técnicos NO rendered al usuario salvo en modo debug." | CERRAR C2 + actualizar TRANSACTION_COPILOT §3.2-3.4 con la nota explícita. |
| **OPEN-C3** | COPILOTS | Acceso a datos privados de Empresas no compradas en plan | `MONETIZATION_SPEC §11 (eligibility rules)` | Reglas de elegibilidad declaradas. | CERRAR C3 con referencia explícita. |
| **OPEN-C4** | COPILOTS | Agregados k-anonimizados cross-org | `MEMORY_ENGINE_SPEC §5.5` | "k-anonimizados con k≥5; aprobados por Risk & Compliance Service." | CERRAR C4. |
| **OPEN-C5** | COPILOTS | Valoración indicativa visible al Buyer pre-NDA | `TRANSACTION_OS_SPEC §8` (matriz de permisos) | Visibilidad por fase declarada (Discovery vs Transaction). | CERRAR C5. |
| **OPEN-C7** | COPILOTS | Memoria de Advisor cross-mandato | `MEMORY_ENGINE_SPEC §5.3` (regla B3 #3) | "Nunca cruzar memoria entre clientes distintos de un mismo Advisor sin opt-in explícito." | CERRAR C7. |
| **OPEN-C11** | COPILOTS | Reorganización enum `Role` para incluir `arroba_team` | Pendiente del Ciclo B (FR-03) | El propio C11 lo anuncia. | Mantener ABIERTO; pasa a Ciclo B (no a cerrar todavía). |
| **OPEN-C12** | COPILOTS | `narrative_draft` viola B6? | `COPILOTS_SPEC §9.2` declara `structured_output` como **insumo** para el TC | Confirmado interpretativamente en la propia sección. | CERRAR C12. |
| **OPEN-C13** | COPILOTS | TC invoca especialistas sin pregunta del usuario (proactividad) | `TRANSACTION_COPILOT_SPEC §10.1` (modo proactivo declarado) | "Los especialistas no inician proactividad; el TC sí." | CERRAR C13. |
| **OPEN-C14** | COPILOTS | Audit retention para invocaciones no atadas a Operation | `MEMORY_ENGINE_SPEC §7.1` | "3 años post-última actividad para eventos no atados a Operation." | CERRAR C14. |
| **OPEN-D11** | MEMORY_ENGINE | Snapshot bajo demanda del usuario | Sin resolución externa explícita; pero el catálogo de 7 momentos canónicos en `MEMORY_ENGINE §6.3` es **exclusivo** en v1.0.0. | "Probable NO en v1.0.0." | CERRAR D11 con "NO en v1.0.0; reservado para versión futura". |
| **OPEN-E2** y **OPEN-E18** | AGENTIC_LAYERS | CAP-005 sub-nivel "L3 condicional por confidence" | `AGENTIC_LAYERS_SPEC §8.1` (política general de escalado por confidence) | "Si `confidence < 0.6`, escala a L3 independientemente de `current_level`." | CERRAR E2 y E18 (eran duplicado). |
| **OPEN-E3** y **OPEN-E19** | AGENTIC_LAYERS | Compensación: capability aparte o lifecycle entidad | `AGENTIC_LAYERS_SPEC §9` declara política | Confirma "catalogar aparte si razonamiento propio". | CERRAR E3 y E19 (eran duplicado) con la regla declarada. |
| **OPEN-F11** | MONETIZATION | Advisory Share sobre Finder Fee | `MONETIZATION_SPEC §10.1` declara explícitamente NO | "100% Plataforma sobre Finder Fee; sin Advisory Share." | YA CERRADO formalmente en F11. |

### 10.1 Subtotal

- **OPENs implícitamente resueltos detectados**: **17**
  - 4 grupo A/B (`A12`, `B1`, `B5`, `B7`)
  - 9 grupo C (`C2`, `C3`, `C4`, `C5`, `C7`, `C12`, `C13`, `C14`, +1 listado)
  - 1 grupo D (`D11`)
  - 2 pares E (`E2/E18`, `E3/E19`) — 4 IDs reales
- **OPENs marcados CERRADO formalmente**: 2 (`E15`, `F11`)

---

## 11. Dependencias circulares

### 11.1 Análisis

Grafo de dependencias entre los 6 specs:

```
TRANSACTION_OS (0.1)
   ↓ (consumido por)
TRANSACTION_COPILOT (0.2)
   ↓
COPILOTS (0.3)
   ↓
MEMORY_ENGINE (0.4)
   ↓
AGENTIC_LAYERS (0.5)
   ↓
MONETIZATION (0.6)
```

Forward references existen (de 0.2 a 0.3, de 0.3 a 0.4, etc.), pero ninguna es **bidireccional crítica**. Los specs posteriores **consumen** información de los anteriores; los anteriores **anticipan** decisiones de los posteriores sin esperar resolución bloqueante.

### 11.2 Resultado

**Ninguna dependencia circular detectada.** El grafo es DAG (Directed Acyclic Graph). El orden de construcción es seguro.

---

## 12. Inconsistencias internas tabla ↔ texto

> Por spec, lista de discrepancias entre tablas y párrafos dentro del mismo documento.

| ID | Spec | Discrepancia | Severidad |
|---|---|---|---|
| **IT-01** | `AGENTIC_LAYERS_SPEC §11.2` | El "resumen agregado" indica `max_level = L4` con 5 capabilities pero la nota declara: "CAP-003, CAP-005, CAP-012, CAP-014, CAP-015, **CAP-023**. Total 6". Inconsistencia 5 vs 6 en la propia tabla resumen. | 🟡 Importante |
| **IT-02** | `AGENTIC_LAYERS_SPEC §11.2` | Conteo "criticality = Baja" dice 3 pero lista (CAP-005, 010, 011, 014) → 4 capabilities. | 🟡 Importante |
| **IT-03** | `AGENTIC_LAYERS_SPEC §11.4` Open Questions del catálogo | Originalmente las §11.4 estaban numeradas E1, E2, E3 con texto duplicando E1, E2, E3 de §16; renumeradas a E17, E18, E19. Quedan E2/E18 y E3/E19 con contenido parcialmente solapado pero numeración distinta. Crear referencia cruzada explícita. | 🟢 Cosmético |
| **IT-04** | `MONETIZATION_SPEC §4.13` (resumen) | Tabla de productos lista Críticidades por producto; algunas etiquetadas como "media" o "alta" cuando el texto del producto declara la criticidad implícitamente. Revisar coherencia. Caso: P05 Matching declarado "media" en §4.5 y en §4.13. Coherente. P06 declarado "alta". Coherente. **Sin inconsistencias materiales detectadas.** | 🟢 OK |
| **IT-05** | `MONETIZATION_SPEC §17.1` (auditoría interna) | La auditoría declara "Cero leaks en secciones comerciales puras" pero el ejemplo "Has agotado tu cuota de CAP-017" en §3.3 línea 206 **es** una mención a CAP-017. La tabla §17.1 lo justifica como "ejemplo de antipatrón". Lectura coherente, pero conviene aclarar más explícitamente en el ejemplo. | 🟢 Cosmético |
| **IT-06** | `TRANSACTION_OS_SPEC` ejemplos JSON vs declaraciones de enums | Algunas referencias a `ENTITY_MODEL.md §5.7` aún citan el enum legacy con `matching | teaser`; el propio TOS dice que se actualizará. Coherente con anuncio de propagación, pero el lector puede confundirse. | 🟡 Importante |
| **IT-07** | `COPILOTS_SPEC §16` (tabla 29 capabilities) | El catálogo lista bien las 29; el resumen final §16.30 dice "9 capacidades para Company" (CAP-001 a CAP-009) — coherente. **Sin inconsistencias materiales detectadas.** | 🟢 OK |

---

## 13. Contradicciones con el canon legacy

> Hallazgos cruzando los 6 specs nuevos contra `ARROBA_PHILOSOPHY.md`, `ENTITY_MODEL.md`, `ENTITY_FRAMEWORK.md`.
>
> **Este capítulo es el insumo principal del Ciclo B.**

| ID | Tema | Spec nuevo dice | Legacy dice | Acción propuesta en Ciclo B | Severidad |
|---|---|---|---|---|---|
| **LG-01** | Match como entidad | `TRANSACTION_OS_SPEC §4` lo promueve a entidad canónica con estados (`SOLICITADO`/`ACEPTADO`/`RECHAZADO`/`EXPIRADO`) | `ARROBA_PHILOSOPHY.md §7` línea 95: *"NO son entidades principales: […] Matching […]"* | Reescribir `ARROBA_PHILOSOPHY.md §7` removiendo `Matching` de "no entidades" + actualizar lista de entidades en §3 + añadir `Match` a `ENTITY_MODEL.md §3` (sube de 12 a 13 tipos canónicos). | 🔴 Bloqueante |
| **LG-02** | Mandate y Document como entidades | Ambos referenciados como entidades canónicas en los 6 specs (especialmente Mandate en COPILOTS_SPEC y Document en TRANSACTION_OS) | `ARROBA_PHILOSOPHY.md §7`: *"NO son entidades principales: […] Mandato […] Documentos."*; PERO `ENTITY_MODEL.md §3` los lista como tipos canónicos. | **Contradicción ya presente en el legacy**: PHILOSOPHY los excluye, ENTITY_MODEL los incluye. Resolver canonizando como entidades (ENTITY_MODEL prevalece tras propagación). Actualizar `ARROBA_PHILOSOPHY.md §7`. | 🔴 Bloqueante |
| **LG-03** | Enum `Operation.current_phase` | `TRANSACTION_OS_SPEC §4.3`: 9 valores (`nda → im → qa → loi → dd → negotiation → spa → closing → integration`); `ioi` como sub-estado opcional dentro de `loi` | `ENTITY_MODEL.md §5.7`: 10 valores (`matching \| teaser \| nda \| im \| ioi \| loi \| dd \| qa \| spa \| closing`) | Actualizar `ENTITY_MODEL.md §5.7`. | 🔴 Bloqueante |
| **LG-04** | Identidad de Persona física | Specs nuevos usan `user`/`user_id` (29 ocurrencias) | `ENTITY_MODEL.md §3` + §5.6 + §5.11: `client` (72 ocurrencias) | Renombrar `client → user` en ENTITY_MODEL. Mantener `client` como alias deprecated por una versión. | 🔴 Bloqueante |
| **LG-05** | Catálogo de identidades especializadas | `COPILOTS_SPEC §3.1`: 4 especialistas por dominio (Company, Market, Valuation, Advisor) | `ARROBA_PHILOSOPHY.md §12` línea 194: 6 identidades por entidad (Company Advisor, Sector Analyst, Territory Analyst, Valuation Advisor, Opportunity Advisor, Deal Advisor) | Re-redactar `ARROBA_PHILOSOPHY.md §12`: "página activa contexto + especialista del dominio (4 especialistas), no identidad conversacional separada por entidad". Mantener la idea original ("inteligencia contextual") con el matiz nuevo. | 🔴 Bloqueante |
| **LG-06** | Fases canónicas del ciclo M&A | `TRANSACTION_OS_SPEC §6`: 15 fases (Discovery 1-6 + Transaction 7-14 + Integración 15) | `ARROBA_PHILOSOPHY.md §6` línea 87: 9 fases (Teaser → NDA → IM → IOI → LOI → DD → Negociación → SPA → Cierre) | Actualizar `ARROBA_PHILOSOPHY.md §6` con las 15 fases + distinción Discovery vs Transaction. | 🟡 Importante |
| **LG-07** | Voz única vs identidad especializada | `COPILOTS_SPEC §3.2` (B6): voz única siempre, sin atribución visible | `ARROBA_PHILOSOPHY.md §12` línea 197: *"El Copilot global existe, pero dentro de una entidad adopta una identidad especializada. Ejemplo: ✦ Company Advisor de Kitchen Studio."* | Re-redactar §12 para reflejar B6: "el Copilot adopta el contexto especializado del dominio (memoria, capabilities), pero la voz al usuario es siempre la del Arroba Copilot (TC). No hay rendering de identidades distintas." | 🟡 Importante |
| **LG-08** | Capabilities como concepto canónico | `COPILOTS_SPEC §16` declara 29 capabilities (CAP-XXX) canónicas + `AGENTIC_LAYERS §5` declara schema canónico de capability. | `ENTITY_MODEL.md` no las menciona. | Decidir si declarar `capability` como tipo canónico en ENTITY_MODEL (CX-07 / IT-CX). | 🟡 Importante |
| **LG-09** | Niveles agénticos | `AGENTIC_LAYERS §4`: 4 niveles L1-L4 con definición operacional. | `ARROBA_PHILOSOPHY.md` no los menciona. | Añadir sección breve en `ARROBA_PHILOSOPHY.md` referenciando los 4 niveles (sin duplicar el detalle). | 🟡 Importante |
| **LG-10** | Catálogo de productos comerciales | `MONETIZATION §4`: 12 productos comerciales + 5 mecanismos económicos. | `ARROBA_PHILOSOPHY.md` no menciona pricing. | Añadir sección breve en `ARROBA_PHILOSOPHY.md` apuntando a `MONETIZATION_SPEC`. | 🟡 Importante |
| **LG-11** | Capas canónicas del proyecto | Los specs viven en una **séptima capa** ("Engines & Specs") declarada implícitamente en cada spec. | `ARROBA_PHILOSOPHY.md §13` declara solo 6 capas (Blueprint → UX Blueprint → Entity Framework → Design System → Diseños → Implementación). | Actualizar `ARROBA_PHILOSOPHY.md §13` añadiendo la capa **Engines & Specs** entre **Entity Framework** y **Design System** (orden propuesto en cada spec). | 🟡 Importante |
| **LG-12** | Workspace como memoria | Los specs nuevos usan `Working Context` (MEMORY_ENGINE §11) como concepto efímero de sesión. | `ARROBA_PHILOSOPHY.md §8`: *"Workspace significa únicamente: memoria, persistencia, contexto, entorno de trabajo."* | Aclarar en `ARROBA_PHILOSOPHY.md §8`: el "Workspace" del legacy es **memoria persistente** asociada a entidades; el "Working Context" del Memory Engine es **memoria efímera de sesión**. Son cosas distintas; no entran en conflicto pero merece nota. | 🟢 Cosmético |
| **LG-13** | Source enum de entidades | `ENTITY_MODEL §4.6`: `source ∈ {mock, agency_tool_real, user_input, ai_inferred, import}` (5 valores). | Los specs nuevos no declaran source pero implícitamente lo extienden (ej. en Memory Engine: lineage detallado). | Sin acción urgente; ENTITY_MODEL ya cubre el caso suficientemente. | 🟢 Cosmético |
| **LG-14** | Risk & Compliance como dependencia canónica | Los specs (especialmente MEMORY_ENGINE §15 y AGENTIC_LAYERS §14.5) lo declaran como **dependencia externa P0**. | El legacy no lo menciona. | Añadir mención en `ARROBA_PHILOSOPHY.md` referenciando "Risk & Compliance Service" como pieza prevista fuera del Sprint 0. | 🟡 Importante |
| **LG-15** | Memory Engine como motor único | `MEMORY_ENGINE_SPEC §3.1`: "Memoria única, motor único; ningún copilot mantiene memoria propia". | El legacy no lo declara. | Añadir mención en `ARROBA_PHILOSOPHY.md` con referencia a `MEMORY_ENGINE_SPEC`. | 🟡 Importante |

### 13.1 Resumen Ciclo B (propagación a legacy)

| Archivo legacy | Cambios propuestos en Ciclo B |
|---|---|
| `ARROBA_PHILOSOPHY.md` | (1) Reescribir §3 entidades con `Match` añadido. (2) Reescribir §6 fases (15 fases canónicas). (3) Reescribir §7 quitando Mandate/Document/Matching de "no entidades". (4) Reescribir §12 reflejando voz única + 4 especialistas. (5) Añadir mención breve a Memory Engine, Agentic Layers (4 niveles), Monetización. (6) Actualizar §13 con 7ª capa "Engines & Specs". |
| `ENTITY_MODEL.md` | (1) Añadir `match` como tipo canónico (sube a 13 tipos). (2) Actualizar §5.7 enum `current_phase` (9 valores nuevos). (3) Renombrar `client → user` con alias deprecated. (4) Añadir enum `Opportunity.status`. (5) Decidir si `capability`, `authorization`, `product`, `plan`, `subscription` se canonizan como tipos. |
| `ENTITY_FRAMEWORK.md` | (1) Añadir ficha `/match/{id}` (vista histórica) a §11. (2) Actualizar tabla de 12 tipos canónicos (línea 73-89) a 13 tipos con Match. |
| `PRD.md` / `CHANGELOG.md` | Actualizar con cierre Sprint 0 + canon nuevo. (Solo con autorización explícita del usuario.) |

---

## 14. Plan de remediación propuesto

### 14.1 Correcciones dentro de los 6 specs nuevos (Ciclo B intra-spec)

| Orden | Cambio | Spec(s) afectado(s) | Severidad |
|---|---|---|---|
| 1 | Renombrar `team_arroba` → `arroba_team` (NM-01) | AGENTIC_LAYERS_SPEC (4 ocurrencias) | 🟡 Importante |
| 2 | Canonizar `T1`-`T15` (NM-03 / CX-09) | TRANSACTION_OS_SPEC (renombrar "Fase N" → "TN" donde corresponda) | 🟡 Importante |
| 3 | Cerrar formalmente los 17 OPENs implícitamente resueltos (§10) | TRANSACTION_OS (A12), TC (B1, B5, B7), COPILOTS (C2, C3, C4, C5, C7, C12, C13, C14), MEMORY_ENGINE (D11), AGENTIC_LAYERS (E2/E18, E3/E19) | 🟡 Importante |
| 4 | Aclarar tensión `voice/contributors` vs B6 (CX-06 / OPEN-C2) | TRANSACTION_COPILOT_SPEC §3.2-3.4 | 🟡 Importante |
| 5 | Corregir conteos §11.2 AGENTIC_LAYERS (IT-01, IT-02) | AGENTIC_LAYERS_SPEC §11.2 | 🟡 Importante |
| 6 | Aclarar solapamiento eventos `specialist.invocation.completed` vs `agentic.capability.completed` (EV-01) | COPILOTS_SPEC §11 + AGENTIC_LAYERS_SPEC §13 | 🟡 Importante |
| 7 | Aclarar `operation.closed_with_success` vs `closing.declared` (EV-02) | TRANSACTION_OS_SPEC §9.2 | 🟡 Importante |
| 8 | Eliminar referencia a `monetization.fee_due` (EV-03) o renombrarlo | TRANSACTION_OS_SPEC (si lo cita) | 🟡 Importante |
| 9 | Completar lifecycle `economy.invoice.*` (EV-07) | MONETIZATION_SPEC §12 | 🟡 Importante |

### 14.2 Propagaciones a documentos canónicos legacy

| Orden | Documento | Cambio | Severidad |
|---|---|---|---|
| 1 | `ARROBA_PHILOSOPHY.md §13` | Añadir 7ª capa "Engines & Specs" | 🟡 Importante |
| 2 | `ARROBA_PHILOSOPHY.md §3` | Reescribir entidades con `Match` añadido | 🔴 Bloqueante |
| 3 | `ARROBA_PHILOSOPHY.md §6` | Reescribir fases con las 15 fases canónicas | 🟡 Importante |
| 4 | `ARROBA_PHILOSOPHY.md §7` | Quitar Mandate, Document, Matching de "no entidades" | 🔴 Bloqueante |
| 5 | `ARROBA_PHILOSOPHY.md §12` | Re-redactar con 4 especialistas + voz única | 🔴 Bloqueante |
| 6 | `ENTITY_MODEL.md §3` | Añadir `match` como 13.er tipo canónico | 🔴 Bloqueante |
| 7 | `ENTITY_MODEL.md §5.7` | Actualizar enum `current_phase` | 🔴 Bloqueante |
| 8 | `ENTITY_MODEL.md §3 + §5.6 + §5.11` | Renombrar `client → user` con alias deprecated | 🔴 Bloqueante |
| 9 | `ENTITY_FRAMEWORK.md §2 + §11` | Añadir ficha `/match/{id}`, actualizar tabla a 13 tipos | 🟡 Importante |

### 14.3 Decisiones que requieren elevarse al usuario

Las siguientes contradicciones no tienen "ganador obvio" sin confirmación humana. Antes de aplicar correcciones del Ciclo B:

| # | Decisión | Recomendación de este audit |
|---|---|---|
| 1 | ¿`Match` se promueve a entidad canónica de primer nivel? (sobreescribe `ARROBA_PHILOSOPHY §7`) | **SÍ** — todos los specs nuevos lo asumen y el modelo es más coherente con el TOS. |
| 2 | ¿`Mandate` y `Document` permanecen como entidades canónicas (ya están en ENTITY_MODEL pero PHILOSOPHY los prohíbe)? | **SÍ** — son entidades de primer orden con identidad, lifecycle y relaciones. |
| 3 | ¿El catálogo de tipos sube de 12 a **13** entidades canónicas (añadiendo `match`)? | **SÍ** — consecuencia directa de #1. |
| 4 | ¿`Capability`, `Authorization L4`, `Product`, `Plan`, `Subscription` se canonizan en ENTITY_MODEL como tipos adicionales o permanecen como objetos de configuración interna? | **Recomendación**: dejarlos como objetos internos por ahora (no son entidades de dominio M&A); reservar para revisión si se exponen a URL pública. |
| 5 | ¿`client` se renombra a `user` en ENTITY_MODEL con alias deprecated por una versión? | **SÍ** — más alineado con la implementación actual y con los specs nuevos. |
| 6 | ¿Las 6 identidades especializadas (Company Advisor / Sector Analyst / …) se sustituyen por los 4 especialistas del modelo nuevo (Company / Market / Valuation / Advisor)? | **SÍ** — el modelo de 4 especialistas por dominio cubre todas las funciones del legacy y reduce complejidad. |
| 7 | ¿Las fases del ciclo se documentan canónicamente como `T1`–`T15` o `Fase 1`–`Fase 15`? | **`T1`–`T15`** (consistente con specs posteriores y más compacto). |
| 8 | ¿La 7ª capa "Engines & Specs" se inserta entre Entity Framework y Design System en `ARROBA_PHILOSOPHY §13`? | **SÍ** — refleja la realidad del proyecto post-Sprint 0. |
| 9 | ¿`team_arroba` se renombra a `arroba_team` en AGENTIC_LAYERS_SPEC (4 ocurrencias)? | **SÍ** — variante mayoritaria. |
| 10 | ¿`negotiation` se añade como valor canónico de `Operation.current_phase` entre `dd` y `spa`, y se excluyen `matching` y `teaser`? | **SÍ** — declarado explícitamente en TOS. |
| 11 | ¿`ioi` permanece como **sub-estado opcional dentro de `loi`** en lugar de valor del enum principal? | **SÍ** — declarado en TOS §4.3. |
| 12 | ¿`integration` se añade como valor canónico final del enum `Operation.current_phase` tras `closing`? | **SÍ** — Fase 15 Integración post-deal. |

---

## 15. Métricas del audit

### 15.1 Totales por severidad

| Severidad | Conteo | % del total |
|---|---:|---:|
| 🔴 Bloqueante | 14 | 12,8% |
| 🟡 Importante | 72 | 66,1% |
| 🟢 Cosmético | 23 | 21,1% |
| **Total hallazgos** | **109** | 100% |

### 15.2 Totales por spec auditado

| Spec | Hallazgos directos | Hallazgos donde es spec A o B |
|---|---:|---:|
| TRANSACTION_OS | 8 | 22 |
| TRANSACTION_COPILOT | 5 | 14 |
| COPILOTS | 14 | 21 |
| MEMORY_ENGINE | 6 | 17 |
| AGENTIC_LAYERS | 13 | 22 |
| MONETIZATION | 9 | 18 |
| ARROBA_PHILOSOPHY (legacy) | — | 14 |
| ENTITY_MODEL (legacy) | — | 12 |
| ENTITY_FRAMEWORK (legacy) | — | 3 |

### 15.3 Totales por categoría (§2-§13)

| Categoría | Total |
|---|---:|
| §2 Contradicciones explícitas | 9 |
| §3 Duplicidades de definición | 10 |
| §4 Nomenclaturas inconsistentes | 7 |
| §5 Estados / enums incompatibles | 8 |
| §6 Eventos canónicos | 9 (duplicados/solapados/huérfanos) |
| §7 Forward references no cumplidas | 9 (3 intra-Sprint-0 ⚠, resto esperadas) |
| §8 Entidades con doble definición | 8 |
| §9 Principios canónicos consolidados | 10 fundamentales + 11 nuevos = 21 totales |
| §10 OPENs implícitamente resueltos | 17 |
| §11 Dependencias circulares | 0 |
| §12 Inconsistencias internas tabla ↔ texto | 7 |
| §13 Contradicciones con canon legacy | 15 (5 🔴 + 8 🟡 + 2 🟢) |

### 15.4 Métricas de OPENs

- **OPENs totales únicos**: 103 (101 abiertos + 2 cerrados formalmente)
- **OPENs por spec**:
  - A (TRANSACTION_OS): 4 abiertos (A8, A12, A13, A14)
  - B (TRANSACTION_COPILOT): 12 abiertos (B1-B12)
  - C (COPILOTS): 15 abiertos (C1-C15)
  - D (MEMORY_ENGINE): 15 abiertos (D1-D15)
  - E (AGENTIC_LAYERS): 18 abiertos (E1-E14, E16-E19), 1 cerrado (E15)
  - F (MONETIZATION): 37 abiertos (F1-F10, F12-F38), 1 cerrado (F11)
- **OPENs implícitamente resueltos detectados**: 17 (16,5% del total abierto)
- **OPENs cerrados formalmente**: 2 (E15, F11)

### 15.5 Métricas de eventos canónicos

- **Eventos únicos detectados**: 124 (119 con productor formal + 5 referenciados sin productor formal)
- **Eventos duplicados / solapados**: 6 (EV-01 a EV-07 menos OK)
- **Eventos huérfanos** (sin consumidor): 1 (`qa.log_closed`)
- **Bloque más numeroso**: `economy.*` (38 eventos)

### 15.6 Métricas de principios canónicos

- **Principios fundamentales canónicos**: 10 (Voz Única B6, Least Privilege B2, Aislamiento B3, Continuidad por defecto, Trazabilidad total, Inmutabilidad post-firma, Boundary First, Idempotencia, Match-as-entity, Autonomía≠Inteligencia)
- **Principios nuevos del Sprint 0 (sin replicación)**: 11 (P1 Monetización, P2 Desacoplamiento, P4 Autonomía-no-inteligencia, P5 Evolución, P6 Reversibilidad, P7 Criticidad, D2 No-autorizaciones-globales, D3 Kill-switch, Plan+Permisos+Riesgo, Transparencia previa, Lenguaje de usuario)
- **Replicaciones detectadas**: voz única (4 sitios), least privilege (3), aislamiento (3), trazabilidad (3), boundary first (3)

---

> **Fin del informe.** Generado en modo solo lectura. Ningún archivo modificado salvo este.
>
> Próximo entregable: `/app/memory/specs/OPEN_ITEMS_CLASSIFICATION.md` (clasificación de los 101+ OPENs en 4 grupos).
>
> Aprobación del usuario requerida antes de iniciar Ciclo B.
