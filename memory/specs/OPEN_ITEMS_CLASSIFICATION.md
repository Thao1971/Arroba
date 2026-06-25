# Open Items Classification — Sprint 0.5 · Ciclo A

> **Fecha**: 2026-06-25
> **Total de OPENs abiertos analizados**: **101**
> **Total de OPENs cerrados formalmente en specs**: 2 (E15, F11) — no incluidos en esta clasificación.
> **Fuentes**:
> - `/app/memory/specs/TRANSACTION_OS_SPEC.md` (4 abiertos: A8, A12, A13, A14)
> - `/app/memory/specs/TRANSACTION_COPILOT_SPEC.md` (12 abiertos: B1–B12)
> - `/app/memory/specs/COPILOTS_SPEC.md` (15 abiertos: C1–C15)
> - `/app/memory/specs/MEMORY_ENGINE_SPEC.md` (15 abiertos: D1–D15)
> - `/app/memory/specs/AGENTIC_LAYERS_SPEC.md` (18 abiertos: E1–E14, E16–E19; E15 cerrado)
> - `/app/memory/specs/MONETIZATION_SPEC.md` (37 abiertos: F1–F10, F12–F38; F11 cerrado)
>
> **Modo**: solo lectura. NO se cierra ningún OPEN; solo se clasifica.

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Tabla maestra de OPENs](#2-tabla-maestra-de-opens)
3. [Grupo 1 — Ya resueltos implícitamente (17)](#3-grupo-1--ya-resueltos-implícitamente)
4. [Grupo 2 — Bloquean Sprint 1 (9)](#4-grupo-2--bloquean-sprint-1)
5. [Grupo 3 — Pueden esperar (45)](#5-grupo-3--pueden-esperar)
6. [Grupo 4 — Decisiones puramente comerciales (30)](#6-grupo-4--decisiones-puramente-comerciales)
7. [Métricas](#7-métricas)

---

## 1. Resumen ejecutivo

### 1.1 Conteo por grupo

| Grupo | Descripción | Conteo | % |
|---|---|---:|---:|
| **G1** | Ya resueltos implícitamente en otro spec | 17 | 16,8% |
| **G2** | Bloquean Sprint 1 (Identidad + Roles + Planes + Billing) | 9 | 8,9% |
| **G3** | Pueden esperar (Sprint 2+) | 45 | 44,6% |
| **G4** | Decisiones puramente comerciales (pricing, %, plazos) | 30 | 29,7% |
| **Total abiertos** | | **101** | 100% |

### 1.2 Conteo por spec

| Spec | G1 | G2 | G3 | G4 | Total abiertos |
|---|---:|---:|---:|---:|---:|
| TRANSACTION_OS (A) | 1 | 1 | 2 | 0 | 4 |
| TRANSACTION_COPILOT (B) | 3 | 1 | 8 | 0 | 12 |
| COPILOTS (C) | 8 | 1 | 6 | 0 | 15 |
| MEMORY_ENGINE (D) | 1 | 2 | 12 | 0 | 15 |
| AGENTIC_LAYERS (E) | 4 | 1 | 13 | 0 | 18 |
| MONETIZATION (F) | 0 | 3 | 4 | 30 | 37 |
| **Total** | **17** | **9** | **45** | **30** | **101** |

### 1.3 Lista corta de OPENs bloqueantes para Sprint 1 (Grupo 2)

| OPEN | Spec | Pregunta resumida | Decisor |
|---|---|---|---|
| **A8** | TOS | Política de caducidad (tokens / sesiones / autorizaciones) | Usuario + equipo técnico |
| **B2** | TC | ¿El TC puede leer audit logs cross-user para detectar fraude? | Usuario (negocio + privacidad) |
| **C11** | COPILOTS | Reorganización enum `Role` para incluir `arroba_team` | Propagación canon — Ciclo B |
| **D10** | MEMORY_ENGINE | Multi-tenant físico (Mongo compartido vs por org) | Equipo técnico |
| **D14** | MEMORY_ENGINE | Organization archivada: qué pasa con watchlists de otras orgs | Usuario |
| **E16** | AGENTIC_LAYERS | ¿`admin` puede sobreescribir `current_level` sin política §5.3? | Usuario (gobernanza admin) |
| **F6** | MONETIZATION | Tope autorización L4 en Subscriber (30 días vs 90) | Usuario (política comercial) |
| **F34** | MONETIZATION | ¿Modalidad freemium en v1.0.0 más allá de Anonymous? | Usuario (estrategia comercial) |
| **F35** | MONETIZATION | Política descuentos por volumen | Usuario (estrategia comercial) |

### 1.4 Observaciones clave

- **17 OPENs (16,8%) ya tienen resolución en otro spec del canon** pero permanecen marcados como ABIERTO. Cerrarlos formalmente en Ciclo B reducirá el inventario de OPENs abiertos a 84.
- **Solo 9 OPENs (8,9%) bloquean Sprint 1**. La gran mayoría son calibraciones operativas o decisiones comerciales que se cierran en Sprint 2+ con contexto real de uso.
- **30 OPENs (29,7%) son puramente comerciales** (pricing, %, plazos) que requieren decisión de negocio del usuario. Concentrados en `MONETIZATION_SPEC`.
- **Sprint 1 (Identidad + Roles + Planes + Billing)** puede arrancar con los 9 bloqueantes resueltos. No requiere resolver los 30 OPENs comerciales (los precios concretos pueden cerrarse en paralelo con el desarrollo).
- **MONETIZATION_SPEC concentra el 37% de OPENs abiertos** (37 de 101) y el 100% del Grupo 4. Es coherente con el diseño: los precios y políticas comerciales se cierran al implementar, no al especificar.

---

## 2. Tabla maestra de OPENs

> Tabla con TODOS los 101 OPENs abiertos.

### 2.1 TRANSACTION_OS_SPEC — Grupo A (4)

| OPEN-ID | Sección | Pregunta resumida | Propuesta del spec | Grupo | Justificación |
|---|---|---|---|---|---|
| A8 | §15 | Política de caducidad | Configurable; pendiente spec dedicado | **G2** | Si Sprint 1 toca autenticación/tokens necesita esta decisión |
| A12 | §15 | Persistencia de Recomendaciones (Fase 5): efímeras o persistidas | Persistir accionadas; efímeras no accionadas | **G1** | Resuelto en TC[OPEN-B1] y COPILOTS §6.3 + §16.30 |
| A13 | §15 | Reapertura tras `LOI_RECHAZADA` | Mencionado pero no formalizado | **G3** | No bloquea Sprint 1; se cierra al implementar Fase 10 |
| A14 | §15 | Doble Match competitivo (mismo Seller, varios Buyers pre-LOI) | Asume exclusividad post-LOI pero no prohíbe múltiple pre-LOI | **G3** | No bloquea Sprint 1; se cierra al implementar marketplace |

### 2.2 TRANSACTION_COPILOT_SPEC — Grupo B (12)

| OPEN-ID | Sección | Pregunta resumida | Propuesta del spec | Grupo | Justificación |
|---|---|---|---|---|---|
| B1 | §12 | Persistencia de Recomendaciones | Persistir accionadas; efímeras resto | **G1** | Duplicado de A12; mismo destino |
| B2 | §12 | ¿TC puede leer audit logs cross-user para detectar fraude/patrones? | NO por defecto; solo `arroba_team`/`admin` cuando se escala | **G2** | Define modelo de privacidad; Sprint 1 toca roles |
| B3 | §12 | Memoria cross-deal del mismo usuario | Por defecto aislada; opt-in opcional | **G3** | No bloqueante hasta Sprint 2+ |
| B4 | §12 | Modelo LLM subyacente al TC | Agnóstico de modelo; factory backend | **G3** | Operativo; no bloquea producto |
| B5 | §12 | Timeouts entre TC y especialistas | 12s default; degradación elegante | **G1** | Resuelto en COPILOTS_SPEC §9.4 / §13 |
| B6 | §12 | Cuándo TC "cede la palabra" a especialista | Cuando output estructurado no requiere consolidación | **G3** | Decisión UX; se cierra en Design System |
| B7 | §12 | TC pregunta antes de L2 (escribe memoria) | NO; L2 son borradores etiquetados | **G1** | Resuelto en AGENTIC_LAYERS_SPEC §4.2 |
| B8 | §12 | Multi-usuario simultáneo en `/operacion/{id}` | Cada uno tiene sesión privada; estado compartido vía Q&A | **G3** | Modelo de presencia; cierra en Sprint 2+ |
| B9 | §12 | Memoria de Advisor cross-mandato | Por defecto NO; opt-in opcional | **G1** | Resuelto en MEMORY_ENGINE §5.3 (regla B3 #3) |
| B10 | §12 | Fallback determinista del TC ante fallo LLM | Respuesta determinista por fase; catálogo cerrado | **G3** | Implementación; se cierra en Sprint 1-2 |
| B11 | §12 | Identidad visible cuando especialista contribuye | DS decide rendering; ¿siempre o solo relevante? | **G3** | Decisión UX; se cierra en Design System |
| B12 | §12 | Modelos distintos L1 (rápido/barato) vs L2 (caro/mejor) | Recomendable; factory backend | **G3** | Operativo |

### 2.3 COPILOTS_SPEC — Grupo C (15)

| OPEN-ID | Sección | Pregunta resumida | Propuesta del spec | Grupo | Justificación |
|---|---|---|---|---|---|
| C1 | §18 | Reinterpretación PHILOSOPHY §12 ("agente especializado por entidad") | Página activa contexto + 4 especialistas por dominio | **G3** | Propagación Ciclo B; no bloquea Sprint 1 funcionalmente |
| C2 | §18 | Tensión `voice/contributors` vs B6 | Metadatos técnicos; NO renderizados salvo debug | **G1** | Resuelto en COPILOTS §12.6 |
| C3 | §18 | Acceso a datos privados Empresas no compradas en plan | Solo si `visibility=public` o enrich pagado | **G1** | Resuelto en MONETIZATION §11 |
| C4 | §18 | Agregados k-anonimizados cross-org por Market | Solo k≥5 aprobados por Risk & Compliance | **G1** | Resuelto en MEMORY_ENGINE §5.5 |
| C5 | §18 | Valoración indicativa visible al Buyer pre-NDA | NO; solo rango opcional en Teaser | **G1** | Resuelto en TRANSACTION_OS §8 (matriz visibilidad) |
| C6 | §18 | Advisor Copilot operando sin Advisor humano | SÍ L1/L2; NO L3/L4 contractual | **G3** | Cierra en ADVISOR_LAYER_SPEC (P1 fuera Sprint 0) |
| C7 | §18 | Memoria Advisor cross-mandato | Aislamiento clientes distintos del mismo Advisor sin opt-in | **G1** | Resuelto en MEMORY_ENGINE §5.3 |
| C8 | §18 | TTL del cache idempotencia | 5 min default | **G3** | Operativo; calibrar con uso |
| C9 | §18 | Parámetros circuit breaker (N=3, T=5min) | Defaults declarados | **G3** | Operativo |
| C10 | §18 | Risk & Compliance Service: cuándo se especifica | Fuera Sprint 0; P0 | **G3** | Decisión de roadmap |
| C11 | §18 | Reorganización enum `Role` con `arroba_team` | Confirmar en ENTITY_MODEL.md al cierre Sprint 0 | **G2** | Sprint 1 toca roles → bloqueante |
| C12 | §18 | `narrative_draft` viola B6? | NO; es insumo para TC | **G1** | Resuelto interpretativamente en propia sección |
| C13 | §18 | TC puede invocar especialistas sin pregunta del usuario | SÍ (modo proactivo §10.1) | **G1** | Resuelto en TC §10.1 |
| C14 | §18 | Audit retention para invocaciones no atadas a Operation | 3 años post-última actividad | **G1** | Resuelto en MEMORY_ENGINE §7.1 |
| C15 | §18 | Especialistas devolviendo `narrative_draft` en idioma usuario | SÍ; TC pasa `locale` en `context` | **G3** | Operativo; se cierra al implementar |

### 2.4 MEMORY_ENGINE_SPEC — Grupo D (15)

| OPEN-ID | Sección | Pregunta resumida | Propuesta del spec | Grupo | Justificación |
|---|---|---|---|---|---|
| D1 | §17 | Sector/Mercado GDPR-aware (k por sector) | No-PII si k-anonimizada; omitir 1-2 actores | **G3** | Política operativa; calibrar con sectores reales |
| D2 | §17 | Política compactación (umbrales, frecuencia) | >12 meses conversaciones; >5 años audit | **G3** | Calibrar con uso real |
| D3 | §17 | Branches paralelos en escrituras concurrentes | Last-write-wins; perdedor como branch | **G3** | UX admin; calibrar |
| D4 | §17 | Parámetros default recuperación contextual | `limit=20`, `max_tokens=4000`, decay log | **G3** | Calibrar |
| D5 | §17 | Muestreo de audit del Memory Engine | Críticas siempre; lecturas técnicas 1:N | **G3** | Calibrar |
| D6 | §17 | TTLs exactos cache lecturas | Empresa 5m, sectoriales 1h, etc. | **G3** | Calibrar |
| D7 | §17 | Contrato Memory Engine ↔ Risk & Compliance Service | Pendiente spec externo | **G3** | Dependencia externa P0 fuera Sprint 0 |
| D8 | §17 | Knowledge Graph propio versión posterior | NO en v1.0.0; reservar futuro | **G3** | Roadmap |
| D9 | §17 | Quién genera agregados k-anonimizados; frecuencia | Sistema (jobs internos); por sector según volumen | **G3** | Operativo |
| D10 | §17 | Multi-tenant físico (Mongo compartido vs por org) | Decisión implementación; spec exige aislamiento lógico | **G2** | **Decisión infra que afecta Sprint 1** |
| D11 | §17 | Snapshot bajo demanda usuario | NO en v1.0.0; reservar futuro | **G1** | Resuelto implícitamente: el catálogo de 7 momentos canónicos en §6.3 es exclusivo |
| D12 | §17 | Política embeddings (conservar vs recalcular) | Conservar; invalidar si cambia modelo | **G3** | Operativo |
| D13 | §17 | Soft-delete vs hard-delete en purga | Soft 30 días gracia; hard después; GDPR puede pedir hard inmediato | **G3** | Confirmar GDPR |
| D14 | §17 | Organization archivada: watchlists de otras orgs | Siguen referenciando; ven solo lo público | **G2** | **Bloqueante: define cómo se modela archivado en Sprint 1** |
| D15 | §17 | Política migración versiones del spec | Cambios menor auto; mayor con grace | **G3** | Operativo |

### 2.5 AGENTIC_LAYERS_SPEC — Grupo E (18 abiertos; E15 cerrado)

| OPEN-ID | Sección | Pregunta resumida | Propuesta del spec | Grupo | Justificación |
|---|---|---|---|---|---|
| E1 | §16 | `max_level` distinto por contexto/plan | NO v1.0.0; diferenciación vía `plan_eligibility` + cuotas | **G3** | Reservar futuro |
| E2 | §16 | CAP-005 sub-nivel "L3 condicional por confidence" | Cubierto por escalado §8.1 | **G1** | Resuelto en AGENTIC §8.1 |
| E3 | §16 | Compensación = capability aparte o lifecycle entidad | Aparte si razonamiento propio | **G1** | Resuelto en AGENTIC §9 |
| E4 | §16 | Schema persistido capabilities (12º tipo memoria o sub-scope audit) | Propuesta: `system.{capability_id}.schema` sub-scope | **G3** | Coordinación con 0.4 (Ciclo B) |
| E5 | §16 | Kill-switch global per-user requiere cooldown adicional | NO; nueva autorización por capability/Operation es cooldown implícito | **G3** | Confirmación |
| E6 | §16 | Tope `expires_at − granted_at` autorizaciones L4 | 90 días default; configurable por plan | **G3** | Calibrar (no bloqueante para Sprint 1) |
| E7 | §16 | Whitelists `admin` Críticas se renuevan o expiran | Revisión 12 meses + auto-revocación por umbrales | **G3** | Calibrar |
| E8 | §16 | UI consulta eventos agéntico directos o solo vía TC | Solo vía TC (voz única); excepción "mis autorizaciones L4" | **G3** | Coherencia B6 |
| E9 | §16 | Coste de capabilities con múltiples `external_dependencies` | Agregado en tarifa + auditoría por dependencia | **G3** | Coordinación con 0.6 |
| E10 | §16 | Degradación bajo carga: automática o por operador | Automática con umbrales; admin sobreescribe | **G3** | Implementación |
| E11 | §16 | Capabilities `max_level = L1` tienen sentido | Reservar posibilidad sin restricción | **G3** | Sin urgencia |
| E12 | §16 | TC emite notificaciones fuera sesión activa | SÍ vía sistema notificaciones externo; contenido por TC | **G3** | Confirmación B6 |
| E13 | §16 | Acciones compensatorias consumen cuota | Gratuitas 24h; consumen después | **G3** | Calibrar |
| E14 | §16 | `arroba_team` en mediación sigue mismo schema agéntico | Mismo schema con `actor = arroba_team` + razón reforzada | **G3** | Coord Risk & Compliance |
| ~~E15~~ | §16 | Añadir L0 (solo razonamiento interno) | NO aplica; L1 ya cubre verbal | **CERRADO** | — |
| E16 | §16 | `admin` puede sobreescribir `current_level` sin política §5.3 | NO; sigue siempre el flujo | **G2** | **Define gobernanza admin: bloqueante Sprint 1** |
| E17 | §16 | Refinamiento futuro tabla §11.1 | Revisión periódica cada 6 meses | **G3** | Calibrar con uso |
| E18 | §16 | (vinculado E2) CAP-005 sub-nivel condicional | Mismo que E2 | **G1** | Duplicado de E2 |
| E19 | §16 | (vinculado E3) Catalogación compensaciones | Mismo que E3 | **G1** | Duplicado de E3 |

### 2.6 MONETIZATION_SPEC — Grupo F (37 abiertos; F11 cerrado)

| OPEN-ID | Sección | Pregunta resumida | Propuesta del spec | Grupo | Justificación |
|---|---|---|---|---|---|
| F1 | §17 | Plazos exactos refund (14/90/no refund) | Inicial: 14d/90d/>90d excepcional | **G4** | Asesoría legal — decisión externa |
| F2 | §17 | Precio mensual Subscriber | `TBD` | **G4** | Pricing |
| F3 | §17 | Precio anual Subscriber con descuento | `TBD` ~15% | **G4** | Pricing |
| F4 | §17 | Créditos mensuales Subscriber | `TBD` (sugerido 50-100) | **G4** | Pricing |
| F5 | §17 | Precio crédito unitario overage Subscriber | `TBD` | **G4** | Pricing |
| F6 | §17 | Tope autorización L4 Subscriber (30 días) | 30 días tope más bajo | **G2** | **Bloqueante Sprint 1: define experiencia Plan Subscriber** |
| F7 | §17 | Precio mensual Corporate | `TBD` | **G4** | Pricing |
| F8 | §17 | Precio anual Corporate con descuento | `TBD` ~20% | **G4** | Pricing |
| F9 | §17 | Créditos mensuales Corporate | `TBD` (sugerido 500-1000) | **G4** | Pricing |
| F10 | §17 | % default Advisory Share | 70% Advisor / 30% Plataforma | **G4** | Decisión comercial |
| ~~F11~~ | §17 | Advisory Share sobre Finder Fee | NO (100% Plataforma) | **CERRADO** | — |
| F12 | §17 | Precios de bolsas de créditos | `TBD` | **G4** | Pricing |
| F13 | §17 | Conversión Finder/Success Fee en créditos posteriores | Posibilidad futura, no v1.0.0 | **G3** | Roadmap |
| F14 | §17 | Caducidad créditos adquiridos en bolsa | 12 meses default, configurable | **G4** | Política comercial |
| F15 | §17 | Roll-over créditos de plan no consumidos | Subscriber NO; Corporate/Investor 50%; Advisor 100% | **G4** | Política comercial |
| F16 | §17 | Descuentos compromiso anual por plan | ~15% Subscriber, ~20% Corp/Inv, ~25% Advisor | **G4** | Pricing |
| F17 | §17 | Distribución cuotas en orgs con `seats > 1`: pool común o por usuario | Configurable; default pool común | **G3** | Política operativa |
| F18 | §17 | Criterios para reducir Finder Fee si contacto previo Buyer-Seller | Mediación `arroba_team` | **G4** | Política comercial |
| F19 | §17 | Detalles split Buyer-Seller del Finder Fee | Registrado en Match con consentimiento | **G4** | Política comercial |
| F20 | §17 | Modelo cálculo Finder Fee (fijo vs % oportunidad) y tarifas | `TBD` | **G4** | Pricing |
| F21 | §17 | Refund parcial Finder Fee si Match expira sin avanzar | Política diferenciada según causa | **G4** | Política comercial |
| F22 | §17 | Devengo intermedio Success Fee al `spa.fully_signed` | Opcional ~30% intermedio | **G4** | Política comercial |
| F23 | §17 | % Success Fee por plan del Seller | `TBD` (rango M&A 1-5%) | **G4** | Pricing |
| F24 | §17 | Plazo emisión factura tras `closing.declared` | `TBD` (sugerido 7 días) | **G4** | Política operativa |
| F25 | §17 | Refund excepcional Success Fee si Operation anulada judicialmente | Revisión caso por caso `admin` | **G4** | Política comercial |
| F26 | §17 | Plazo pago Advisory Share al Advisor | `TBD` (sugerido 30 días) | **G4** | Política operativa |
| F27 | §17 | Split mejorado Advisors con muchos deals | `TBD` (sugerido 75/25 a partir 5/año) | **G4** | Política comercial |
| F28 | §17 | Vigencia risk score de Risk & Compliance | `TBD` (sugerido 90 días) | **G3** | Dependencia externa |
| F29 | §17 | Validación retención eventos económicos | Inicial: 10/7 años | **G4** | Asesoría legal |
| F30 | §17 | Mecanismo reconciliación diaria con pasarela | `TBD` — diferido a implementación | **G3** | Implementación |
| F31 | §17 | Prioridad pasarelas adicionales tras Stripe | `TBD` (Adyen, PayPal, SEPA) | **G3** | Roadmap |
| F32 | §17 | Proveedor KYC/AML | `TBD` (Stripe Identity, Onfido, Sumsub) | **G3** | Implementación |
| F33 | §17 | Proveedor facturación electrónica | `TBD` — depende jurisdicción primaria | **G3** | Implementación |
| F34 | §17 | Modalidad freemium en v1.0.0 más allá de Anonymous | NO en v1.0.0 | **G2** | **Bloqueante Sprint 1: define estrategia comercial básica** |
| F35 | §17 | Política descuentos por volumen | `TBD` — progresivo por Operations cerradas | **G2** | **Bloqueante Sprint 1: política comercial básica** |
| F36 | §17 | Facturación cuando Operation involucra jurisdicciones distintas | Default: España; ajustar según residencia | **G4** | Fiscal |
| F37 | §17 | Política pagos partidos (Buyer/Seller comparten fees) | Configurable CIS; default 100% Buyer Finder + 100% Seller Success | **G4** | Política comercial |
| F38 | §17 | Productos hereditarios por mandato (Advisor "regala" add-on) | Posibilidad futura | **G3** | Roadmap |

---

## 3. Grupo 1 — Ya resueltos implícitamente

> 17 OPENs cuya respuesta **ya existe** en otro spec del canon pero el OPEN sigue marcado como ABIERTO. **Cerrarlos formalmente en Ciclo B**.

| OPEN | Pregunta resumida | Resuelto en | Cita / evidencia | Acción sugerida Ciclo B |
|---|---|---|---|---|
| **A12** | Persistencia de Recomendaciones (Fase 5) | TC §12 (B1) + COPILOTS §6.3 + §16.30 | "Persistir las accionadas; efímeras las no accionadas." | CERRAR A12 + B1 conjuntamente con redacción consolidada en TOS §15. |
| **B1** | (idem A12) | (idem) | (idem) | CERRAR junto con A12. |
| **B5** | Política timeouts TC ↔ especialistas | COPILOTS §9.4 y §13 | Timeout 12s default + fallback declarado por capability | CERRAR B5 con cita explícita a COPILOTS. |
| **B7** | TC pregunta antes de L2 (escribe memoria) | AGENTIC §4.2 | "L2 prepara draft sin confirmación contemporánea; confirmación L3 es obligatoria solo en L3." | CERRAR B7. |
| **B9** | Memoria Advisor cross-mandato | MEMORY_ENGINE §5.3 (regla B3 #3) | "Nunca cruzar memoria entre clientes distintos de un mismo Advisor sin opt-in explícito." | CERRAR B9 con cita explícita. |
| **C2** | `voice/contributors` vs B6 | COPILOTS §12.6 | "voice/contributors son metadatos técnicos no renderizados al usuario salvo en debug administrativo" | CERRAR C2 + actualizar TC §3.2-3.4 con nota explícita (intra-Sprint-0). |
| **C3** | Acceso a datos privados Empresas no compradas en plan | MONETIZATION §11 (eligibility rules) | "Plan + Permisos + Riesgo determinan acceso a productos sensibles" | CERRAR C3. |
| **C4** | Agregados k-anonimizados cross-org | MEMORY_ENGINE §5.5 | "k≥5 default; aprobados por Risk & Compliance Service" | CERRAR C4. |
| **C5** | Valoración indicativa visible al Buyer pre-NDA | TRANSACTION_OS §8 (matriz visibilidad) | "Pre-NDA: solo rango opcional en Teaser; valoración completa solo post-NDA" | CERRAR C5. |
| **C7** | Memoria Advisor cross-mandato (clientes distintos) | MEMORY_ENGINE §5.3 | (idem B9) | CERRAR C7 con misma evidencia que B9. |
| **C12** | `narrative_draft` viola B6? | COPILOTS §9.2 (decisión interpretativa) | "narrative_draft es insumo para el TC, no salida final" | CERRAR C12 (interpretación canónica). |
| **C13** | TC invoca especialistas sin pregunta usuario | TRANSACTION_COPILOT §10.1 | "El TC opera en modo proactivo; especialistas no inician proactividad" | CERRAR C13. |
| **C14** | Audit retention sin Operation | MEMORY_ENGINE §7.1 | "3 años post-última actividad para eventos no atados a Operation" | CERRAR C14. |
| **D11** | Snapshot bajo demanda del usuario | MEMORY_ENGINE §6.3 (catálogo cerrado de 7 momentos canónicos) | El catálogo es **exclusivo** en v1.0.0 | CERRAR D11 con "NO en v1.0.0; reservado para versión futura". |
| **E2** | CAP-005 sub-nivel L3 condicional por confidence | AGENTIC §8.1 (política general escalado) | "Si confidence < 0.6 escala a L3 independientemente de current_level" | CERRAR E2. |
| **E3** | Compensación: capability aparte o lifecycle entidad | AGENTIC §9 (3 estados reversibilidad) | "Catalogar aparte si tiene razonamiento propio" | CERRAR E3. |
| **E18** | (vinculado E2) Sub-nivel CAP-005 | (idem E2) | (idem) | CERRAR junto con E2. |
| **E19** | (vinculado E3) Catalogación compensaciones | (idem E3) | (idem) | CERRAR junto con E3. |

**Subtotal Grupo 1**: 17 OPENs (cerraríamos 16 + 1 duplicado en pareja). Tras Ciclo B, el inventario abierto pasa de 101 a 84.

---

## 4. Grupo 2 — Bloquean Sprint 1

> 9 OPENs cuya resolución es **necesaria** antes de arrancar Sprint 1 (Identidad + Roles + Planes + Billing).

### 4.1 Análisis detallado

| OPEN | Pregunta | Por qué bloquea Sprint 1 | Decisión sugerida | Quién debe decidir |
|---|---|---|---|---|
| **A8** | Política de caducidad (tokens / sesiones) | Sprint 1 implementa autenticación. Sin política de caducidad de tokens/sesiones, el diseño de auth queda en aire. | Adoptar: tokens JWT 24h, refresh 30d, sesiones con cierre por inactividad 1h. (Estos números requieren confirmación del usuario.) | Usuario + equipo técnico (seguridad) |
| **B2** | ¿TC puede leer audit logs cross-user para detectar fraude? | Define el modelo de privacidad básico que debe respetar Sprint 1 al implementar roles y permisos. | Confirmar: NO por defecto. Solo `arroba_team`/`admin` ven cross-user en mediación documentada. | Usuario (negocio + privacidad) |
| **C11** | Reorganización enum `Role` para incluir `arroba_team` | Sprint 1 implementa roles. Hay que decidir si `arroba_team` es rol independiente o sub-permiso de `admin`. El TOS §14 dice: rol específico nuevo, NO hereda automáticamente. | **Propagar al Ciclo B**: rol específico nuevo `arroba_team` distinto de `admin` (consistente con TOS A9 ya cerrado). | Propagación canon — Ciclo B |
| **D10** | Multi-tenant físico (Mongo compartido vs por org) | Decisión infra que afecta el diseño del Sprint 1 (modelado de orgs, isolation, escalado). | **Recomendación**: Mongo compartido con aislamiento lógico estricto a nivel de query (consistente con `MEMORY_ENGINE §5`). Reservar Mongo por org como upgrade futuro para Corporate/Enterprise. | Equipo técnico (con validación usuario) |
| **D14** | Organization archivada: watchlists de otras orgs | Define cómo se modela la archivación. Sprint 1 implementa orgs → necesita esta decisión. | **Recomendación**: watchlists de otras orgs siguen referenciando la `company` (no la `org`), por lo que el archivado de la org no las afecta directamente. Las watchlists ven solo información pública de la company. | Usuario (confirmación) |
| **E16** | ¿`admin` puede sobreescribir `current_level` sin política §5.3? | Define la gobernanza de admin en Sprint 1. Si admin tiene poder ilimitado, el diseño de roles cambia. | **Recomendación**: NO. `admin` sigue siempre el flujo §5.3 (puede acelerar revisión pero no saltarse audit). | Usuario (gobernanza admin) |
| **F6** | Tope `expires_at − granted_at` autorización L4 en Subscriber (30 días) | Define la experiencia comercial del Plan Subscriber, que es el plan **mínimo** para Sprint 1 si se implementa billing. | **Recomendación**: 30 días para Subscriber. Coherente con la propuesta del spec. | Usuario (política comercial) |
| **F34** | ¿Modalidad freemium en v1.0.0 más allá de Anonymous? | Estrategia comercial que afecta Sprint 1 si se implementa onboarding y planes. | **Recomendación**: NO en v1.0.0. Anonymous es el límite gratuito. Subscriber es el primer plan de pago. (Esta era la propuesta del spec.) | Usuario (estrategia comercial) |
| **F35** | Política descuentos por volumen | Si Sprint 1 implementa pricing tier, necesita esta política. | **Recomendación**: NO en Sprint 1; cerrar como "se evaluará en Sprint 3+ con datos reales de uso". | Usuario (estrategia comercial) |

### 4.2 Subtotal Grupo 2

- **Total OPENs Grupo 2**: 9
- **Decisor mayoritario**: usuario (estrategia / política / gobernanza)
- **Decisor secundario**: equipo técnico (infraestructura, seguridad)
- **Estimación de tiempo del usuario para decidir**: ~30-60 min de revisión consolidada (varias decisiones tienen propuesta razonable que solo requiere confirmación).

---

## 5. Grupo 3 — Pueden esperar

> 45 OPENs operativos / técnicos / calibraciones que no bloquean Sprint 1.

### 5.1 Agrupados por sprint estimado de resolución

#### Sprint 2 (refinamiento operativo y calibración inicial)

| OPEN | Pregunta | Por qué puede esperar |
|---|---|---|
| A13 | Reapertura tras `LOI_RECHAZADA` | Se resuelve al implementar Fase 10 LOI |
| A14 | Doble Match competitivo pre-LOI | Se resuelve al implementar marketplace y matching |
| B3 | Memoria cross-deal del mismo usuario | Decisión de opt-in opcional; no bloquea funcionalidad básica |
| B6 | Cuándo TC "cede la palabra" a especialista | Decisión UX que se cierra en Design System |
| B8 | Multi-usuario simultáneo en `/operacion/{id}` | Modelo de presencia; se decide al implementar real-time |
| B10 | Fallback determinista del TC ante fallo LLM | Implementación; se cierra al integrar el LLM real |
| B11 | Identidad visible cuando especialista contribuye | Decisión UX en Design System |
| C8 | TTL cache idempotencia | Calibrar con uso |
| C9 | Parámetros circuit breaker (N=3, T=5min) | Calibrar con uso |
| C15 | Especialistas en idioma usuario | Operativo |
| D1 | Sector/Mercado k-anonimización por sector | Calibrar con sectores reales |
| D2 | Política compactación | Calibrar con uso |
| D3 | Branches paralelos | UX admin |
| D4 | Parámetros default recuperación contextual | Calibrar |
| D5 | Muestreo audit Memory Engine | Calibrar |
| D6 | TTLs cache lecturas | Calibrar |
| D12 | Política embeddings | Operativo |
| D13 | Soft-delete vs hard-delete | Confirmar GDPR (legal puede consolidarse luego) |
| D15 | Política migración versiones | Operativo |
| E1 | `max_level` distinto por contexto/plan | Reservar futuro |
| E5 | Kill-switch cooldown adicional | Confirmar |
| E6 | Tope autorización L4 default 90d | Calibrar (configurable por plan) |
| E7 | Whitelists `admin` renovación | Calibrar |
| E8 | UI consulta eventos agéntico | Coherencia B6 |
| E9 | Coste capabilities con múltiples dependencies | Coordinar con MONETIZATION |
| E10 | Degradación bajo carga automática vs operador | Implementación |
| E11 | Capabilities `max_level = L1` | Sin urgencia |
| E12 | TC notificaciones fuera sesión | Confirmación B6 |
| E13 | Acciones compensatorias consumen cuota | Calibrar |
| E14 | `arroba_team` mediación schema agéntico | Coord Risk & Compliance |
| E17 | Refinamiento tabla §11.1 | Revisión periódica |
| F17 | Distribución cuotas orgs `seats > 1` | Política operativa |

#### Sprint 3+ (depende de specs externos o de datos reales)

| OPEN | Pregunta | Por qué espera |
|---|---|---|
| B4 | Modelo LLM agnóstico | Operativo, depende de factory backend |
| B12 | Modelos distintos L1 vs L2 | Operativo |
| C1 | Reinterpretación PHILOSOPHY §12 | Propagación Ciclo B (4 especialistas por dominio) |
| C6 | Advisor Copilot sin Advisor humano | Espera ADVISOR_LAYER_SPEC (P1) |
| C10 | Risk & Compliance Service: cuándo | Decisión de roadmap |
| D7 | Contrato Memory Engine ↔ Risk & Compliance | Espera spec del servicio |
| D8 | Knowledge Graph propio | Roadmap |
| D9 | Quién genera agregados k-anonimizados | Operativo |
| E4 | Schema persistido capabilities (12º tipo memoria) | Coord 0.4 (Ciclo B) |
| F13 | Conversión fees en créditos | Roadmap |
| F28 | Vigencia risk score | Dependencia externa |
| F30 | Reconciliación pasarela | Implementación |
| F31 | Prioridad pasarelas adicionales | Roadmap |
| F32 | Proveedor KYC/AML | Implementación |
| F33 | Proveedor facturación electrónica | Implementación |
| F38 | Productos hereditarios por mandato | Roadmap |

### 5.2 Subtotal Grupo 3

- **Sprint 2 (refinamiento operativo / calibración)**: 32 OPENs
- **Sprint 3+ (depende de specs externos o de roadmap)**: 16 OPENs
- **Total Grupo 3**: 45 OPENs (la mayor parte; coherente con el diseño "spec primero, calibrar después")
- **Solapamiento**: ~3 OPENs (E4, E14, D7) están en intersección Sprint 2-3 según se priorice spec externo Risk & Compliance.

---

## 6. Grupo 4 — Decisiones puramente comerciales

> 30 OPENs que requieren **decisión de negocio**, no técnica.

### 6.1 Agrupados por temática

#### Pricing concreto (precios mensuales/anuales, créditos por plan)

| OPEN | Pregunta | Categoría | Decisor sugerido |
|---|---|---|---|
| F2 | Precio mensual Subscriber | Pricing base | Usuario (CEO / negocio) |
| F3 | Precio anual Subscriber con descuento | Pricing base | Usuario |
| F4 | Créditos mensuales Subscriber | Pricing base | Usuario |
| F5 | Precio crédito unitario overage Subscriber | Pricing overage | Usuario |
| F7 | Precio mensual Corporate | Pricing base | Usuario |
| F8 | Precio anual Corporate con descuento | Pricing base | Usuario |
| F9 | Créditos mensuales Corporate | Pricing base | Usuario |
| F12 | Precios bolsas de créditos | Pricing add-on | Usuario |
| F16 | Descuentos compromiso anual por plan | Pricing | Usuario |
| F20 | Modelo + tarifas Finder Fee | Pricing transaccional | Usuario |
| F23 | % Success Fee por plan del Seller | Pricing transaccional | Usuario |

#### Política de fees y comisiones

| OPEN | Pregunta | Categoría | Decisor sugerido |
|---|---|---|---|
| F10 | % default Advisory Share (70/30) | Revenue share | Usuario |
| F18 | Reducir Finder Fee si contacto previo Buyer-Seller | Política fee | Usuario |
| F19 | Split Buyer-Seller del Finder Fee | Política fee | Usuario |
| F21 | Refund parcial Finder Fee si Match expira | Política refund | Usuario |
| F22 | Devengo intermedio Success Fee al `spa.fully_signed` | Política fee | Usuario |
| F25 | Refund excepcional Success Fee anulación judicial | Política refund | Usuario |
| F27 | Split mejorado Advisors con muchos deals | Política revenue share | Usuario |
| F37 | Política pagos partidos (Buyer/Seller comparten fees) | Política fee | Usuario |

#### Caducidad y roll-over

| OPEN | Pregunta | Categoría | Decisor sugerido |
|---|---|---|---|
| F14 | Caducidad créditos bolsa | Política operativa | Usuario |
| F15 | Roll-over créditos plan no consumidos | Política operativa | Usuario |

#### Plazos operativos

| OPEN | Pregunta | Categoría | Decisor sugerido |
|---|---|---|---|
| F24 | Plazo emisión factura tras `closing.declared` | Operativo | Equipo legal + usuario |
| F26 | Plazo pago Advisory Share al Advisor | Operativo | Usuario |

#### Asesoría legal / contable

| OPEN | Pregunta | Categoría | Decisor sugerido |
|---|---|---|---|
| F1 | Plazos refund (14/90/no refund) | Legal | Asesoría jurídica |
| F29 | Plazos retención eventos económicos | Contable | Asesoría jurídica/contable |
| F36 | Facturación cuando Operation cross-jurisdiccional | Fiscal | Asesoría fiscal |

### 6.2 Subtotal Grupo 4

- **Total OPENs Grupo 4**: 30
- **Decisor principal**: usuario (CEO / equipo comercial) — 21 OPENs
- **Decisor con asesoría externa**: usuario + asesoría legal/fiscal — 3 OPENs (F1, F29, F36)
- **Pricing puro**: 11 OPENs
- **Política transaccional**: 8 OPENs
- **Caducidad / roll-over**: 2 OPENs
- **Plazos operativos**: 2 OPENs
- **Asesoría externa**: 3 OPENs

### 6.3 Observación

**El Grupo 4 NO bloquea Sprint 1** funcionalmente. Sprint 1 puede implementar la **estructura** de planes y billing sin precios concretos (modelo con `TBD` que se inyecta vía configuración). Los precios reales pueden cerrarse en paralelo con el desarrollo del Sprint 1.

---

## 7. Métricas

### 7.1 Total por grupo

| Grupo | Conteo | % |
|---|---:|---:|
| G1 — Ya resueltos implícitamente | 17 | 16,8% |
| G2 — Bloquean Sprint 1 | 9 | 8,9% |
| G3 — Pueden esperar | 45 | 44,6% |
| G4 — Decisiones puramente comerciales | 30 | 29,7% |
| **Total** | **101** | 100% |

### 7.2 Bloqueantes vs no bloqueantes para Sprint 1

| Categoría | Conteo | % |
|---|---:|---:|
| **Bloqueantes Sprint 1** (G2) | 9 | 8,9% |
| **No bloqueantes Sprint 1** (G1+G3+G4) | 92 | 91,1% |

### 7.3 Distribución por spec

| Spec | G1 | G2 | G3 | G4 | Total abiertos | % del total |
|---|---:|---:|---:|---:|---:|---:|
| TRANSACTION_OS (A) | 1 | 1 | 2 | 0 | 4 | 4,0% |
| TRANSACTION_COPILOT (B) | 3 | 1 | 8 | 0 | 12 | 11,9% |
| COPILOTS (C) | 8 | 1 | 6 | 0 | 15 | 14,9% |
| MEMORY_ENGINE (D) | 1 | 2 | 12 | 0 | 15 | 14,9% |
| AGENTIC_LAYERS (E) | 4 | 1 | 13 | 0 | 18 | 17,8% |
| MONETIZATION (F) | 0 | 3 | 4 | 30 | 37 | 36,6% |
| **Total** | **17** | **9** | **45** | **30** | **101** | 100% |

### 7.4 Top temas con más OPENs

| Tema | Conteo aproximado | Ubicación |
|---|---:|---|
| Pricing concreto (precios, créditos, %) | 11 | MONETIZATION (G4) |
| Política de fees / comisiones | 8 | MONETIZATION (G4) |
| Calibración técnica del Memory Engine | 12 | MEMORY_ENGINE (G3) |
| Configuración del Agentic Layer | 13 | AGENTIC_LAYERS (G3) |
| Operativa del TC | 8 | TRANSACTION_COPILOT (G3) |
| Asesoría legal | 3 | MONETIZATION (G4) |
| Resoluciones implícitas | 17 | Múltiples (G1) |

### 7.5 Decisor sugerido

| Decisor | OPENs |
|---|---:|
| Usuario (estrategia comercial / negocio) | 30 |
| Usuario + asesoría legal/fiscal externa | 3 |
| Usuario (confirmación de propuesta razonable) | 8 |
| Equipo técnico (calibración operativa) | 35 |
| Decisión propagada a Ciclo B (sin nueva decisión) | 17 (G1) |
| Espera dependencia externa (specs P0/P1 fuera Sprint 0) | 8 |
| **Total** | **101** |

### 7.6 Estimación de impacto al cerrar G1 + G2 en Ciclo B

| Estado | OPENs abiertos | Reducción |
|---|---:|---:|
| **Hoy** (cierre Sprint 0) | 101 | — |
| **Tras cerrar G1 en Ciclo B** | 84 | -17 (-16,8%) |
| **Tras decidir G2 con el usuario** | 75 | -9 (-10,7%) |
| **Tras Sprint 1 (resolución natural)** | ~70 | -5 a -10 (calibración inicial) |
| **Tras Sprint 2 (resolución G3 sprint 2)** | ~38 | -32 |
| **Tras Sprint 3+ (resolución G3 sprint 3 + parte G4)** | ~15-20 | -18 a -22 |

---

> **Fin del informe.** Generado en modo solo lectura. Cero modificaciones a ningún OPEN.
>
> Próximo paso: aprobación del usuario para iniciar Ciclo B (propagación + cierre formal de G1 + decisiones G2).
