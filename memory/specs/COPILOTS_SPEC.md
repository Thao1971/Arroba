# arroba.com — Copilots Spec v1.0.0

> **Capa canónica**: *Engines & Specs* (séptima capa, pendiente de propagación a `ARROBA_PHILOSOPHY.md` §13 al cierre del Sprint 0).
> **Fase del proyecto**: Sprint 0 · Fase 0.3 (tercero de 6 specs).
> **Estado**: borrador para revisión humana.
> **Fecha**: 2026-06-25.
> **Documentos predecesores (lectura obligatoria)**: `TRANSACTION_OS_SPEC v1.1.0`, `TRANSACTION_COPILOT_SPEC v1.0.0`.
> **Idioma**: español canónico, técnico.
>
> Este documento define los **4 copilots especializados** del Transaction OS — **Company**, **Market**, **Valuation**, **Advisor** — y su **modelo de colaboración** con el Transaction Copilot (TC). Establece la organización por **dominio de conocimiento**, no por entidad o página. Define el contrato canónico de invocación, las políticas de memoria y audit, y el catálogo cerrado de capacidades L2.
>
> El **Transaction Copilot NO se redefine aquí**: vive en `TRANSACTION_COPILOT_SPEC v1.0.0`. Este spec lo trata como pieza ya canonizada del sistema.
>
> **Documentos del Sprint 0**:
> 1. ✅ `TRANSACTION_OS_SPEC v1.1.0`
> 2. ✅ `TRANSACTION_COPILOT_SPEC v1.0.0`
> 3. ← **este documento** (`COPILOTS_SPEC v1.0.0`)
> 4. `MEMORY_ENGINE_SPEC` (pendiente)
> 5. `AGENTIC_LAYERS_SPEC` (pendiente)
> 6. `MONETIZATION_SPEC` (pendiente)

---

## Índice

1. [Propósito y alcance](#1-propósito-y-alcance)
2. [Glosario](#2-glosario)
3. [Principios canónicos](#3-principios-canónicos)
4. [Arquitectura general](#4-arquitectura-general)
5. [Company Copilot](#5-company-copilot)
6. [Market Copilot](#6-market-copilot)
7. [Valuation Copilot](#7-valuation-copilot)
8. [Advisor Copilot](#8-advisor-copilot)
9. [Contrato canónico de invocación](#9-contrato-canónico-de-invocación)
10. [Memoria y acceso](#10-memoria-y-acceso)
11. [Trazabilidad y audit](#11-trazabilidad-y-audit)
12. [Modelo de identidad y voz única](#12-modelo-de-identidad-y-voz-única)
13. [Colaboración entre copilots](#13-colaboración-entre-copilots)
14. [Gestión de errores y degraded mode](#14-gestión-de-errores-y-degraded-mode)
15. [Niveles agénticos por copilot](#15-niveles-agénticos-por-copilot)
16. [Catálogo de capacidades L2](#16-catálogo-de-capacidades-l2)
17. [Integración forward con otros specs](#17-integración-forward-con-otros-specs)
18. [Open Questions](#18-open-questions)

---

## 1. Propósito y alcance

### 1.1 Qué cubre este spec

Este documento define:

- Los **4 copilots especializados**: Company, Market, Valuation, Advisor.
- El **principio fundamental** de organización: **por dominio de conocimiento, no por entidad ni página**.
- El **contrato canónico de invocación** entre Transaction Copilot y especialistas.
- Las **políticas de memoria, audit y aislamiento** específicas para los especialistas.
- El **modelo de voz única**: el usuario nunca habla directamente con un especialista; siempre con Arroba Copilot (TC).
- El **catálogo cerrado de capacidades L2** distribuidas entre los 5 copilots (4 especialistas + TC).
- El **modelo de colaboración** y la **gestión de errores** cuando un especialista falla o discrepa.

### 1.2 Qué NO cubre este spec

- El **Transaction Copilot**: ya definido íntegramente en `TRANSACTION_COPILOT_SPEC v1.0.0`. Aquí se referencia como pieza ya canonizada.
- El **detalle operativo de los 4 niveles agénticos** (L1/L2/L3/L4): vive en `AGENTIC_LAYERS_SPEC` (0.5). Este spec **referencia** los niveles y los aplica.
- Los **9 tipos de memoria** y sus esquemas: viven en `MEMORY_ENGINE_SPEC` (0.4). Este spec **referencia** y declara qué memoria toca cada especialista.
- La **monetización** de las capacidades (qué consume crédito, cómo se cobra): vive en `MONETIZATION_SPEC` (0.6). Este spec puede **señalar** qué capacidades son típicamente de alto coste, pero no fija precios.
- El **Risk & Compliance Service** (detección de fraude, KYC reforzado, screening regulatorio): se referencia como **dependencia externa** y se marca laguna documental.
- Las **decisiones visuales** (cómo se renderiza la identidad del copilot): viven en el **Design System** (capa 5).

### 1.3 Principio fundamental — organización por dominio

> *Los cinco copilots no deben organizarse por tipo de entidad, sino por dominio de conocimiento.*
> *— decisión canónica del usuario, 2026-06-25.*

Esta es la decisión arquitectónica más importante del spec. Tiene consecuencias inmediatas:

- **Company Copilot** conoce **empresas**, independientemente de la página en la que el usuario esté navegando. Si un usuario está en `/operacion/{id}` y pregunta sobre la solvencia financiera del target, **se invoca Company Copilot** — no porque haya una "ficha de empresa" en pantalla, sino porque el dominio del conocimiento solicitado es **empresa**.
- **Market Copilot** conoce **sectores, mercados y competencia**, independientemente de si el usuario está en `/sector/{slug}`, en `/oportunidad/{id}` o en `/operacion/{id}`. Si pregunta sobre tendencias sectoriales durante una DD (fase 11), se invoca Market.
- **Valuation Copilot** conoce **valoración y comparables**: aplica cuando hay que valorar — en fase 2 (Valoración) pero también en fase 10 (LOI/NBO, para justificar precio) o fase 12 (Negociación, para ajustes con base en hallazgos de DD).
- **Advisor Copilot** conoce **la forma de trabajar de un asesor M&A**: mandatos, screening, NDAs, advisor playbooks, métricas de éxito. Es transversal a todo el TOS y central en las fases 7-13.
- **Transaction Copilot** conoce **el proceso completo de una operación**: la máquina de estados, las transiciones, los artefactos canónicos, los permisos por fase. Es el orquestador.

**Implicación clave**: la asociación "Company Copilot = página /empresa/{cif}" que mantiene `ARROBA_PHILOSOPHY.md §12` ("Company Advisor / Sector Analyst / Territory Analyst / ... — cada entidad puede disponer de un agente especializado") se reinterpreta así: **la página de entidad puede ofrecer una "vista especializada" del Copilot relevante (Company en /empresa, Valuation en /valoracion, etc.), pero el especialista vive a nivel de dominio**, no como propiedad de la página. La página es un **punto de entrada** al dominio; el especialista es **el dominio en sí**.

Este punto se documenta como `[OPEN-C1]` en §18 para validación cruzada con `ARROBA_PHILOSOPHY.md` al cierre del Sprint 0.

### 1.4 Relación con specs predecesores

- **TRANSACTION_OS_SPEC (0.1)**: define las 15 fases, la máquina de estados, los artefactos canónicos. Este spec **respeta** todo lo declarado en 0.1 y especifica qué copilots intervienen en cada fase (refinando la tabla `0.1 §11.2`).
- **TRANSACTION_COPILOT_SPEC (0.2)**: define el orquestador. Este spec **respeta** todo lo declarado en 0.2 y, donde detecta tensión, lo marca como `[OPEN-C*]` (caso del modelo de voz, ver §12).

---

## 2. Glosario

### 2.1 Arroba Copilot

**Único interlocutor visible para el usuario** dentro del TOS. Es la **manifestación pública** del Transaction Copilot. El usuario nunca habla con Company / Market / Valuation / Advisor directamente. Habla con "Arroba Copilot".

Internamente, "Arroba Copilot" es el **alias UX** del Transaction Copilot. En este spec usamos:

- **Arroba Copilot** cuando hablamos de **lo que el usuario percibe**.
- **Transaction Copilot (TC)** cuando hablamos de **la lógica interna de orquestación**.

Son la misma pieza vista desde dos lados.

### 2.2 Copilot especialista

Cualquiera de los 4 agentes de dominio definidos en este spec: **Company**, **Market**, **Valuation**, **Advisor**. Cada uno:

- Tiene un **dominio de conocimiento** exclusivo.
- Recibe **invocaciones** del TC, nunca del usuario.
- Devuelve **outputs estructurados** al TC, nunca texto narrativo destinado al usuario.
- Opera bajo **least privilege**: accede solo a la memoria que necesita.

### 2.3 Dominio de conocimiento

Conjunto de saberes, datos, prácticas y razonamientos que pertenecen a un campo específico. Los 5 dominios canónicos del TOS son:

| Dominio | Copilot dueño |
|---|---|
| **Empresas** (sociedades, identidad, financieros, señales, comparables individuales) | Company |
| **Sectores, mercados y competencia** (análisis sectorial, territorial, tendencias, dinámica competitiva) | Market |
| **Valoración y comparables** (métodos, múltiplos, DCF, comparables de transacciones, sensibilidades) | Valuation |
| **Forma de trabajar de un asesor M&A** (mandatos, screening, NDAs, playbooks, métricas de éxito de un asesor) | Advisor |
| **Proceso completo de una operación** (15 fases, máquina de estados, artefactos, permisos, gobierno) | Transaction |

### 2.4 Capacidad (capability)

Unidad funcional de **trabajo concreto** que un copilot sabe hacer. Ejemplos: "preparar valoración por múltiplos de EBITDA", "redactar un Teaser anonimizado", "generar preguntas de Due Diligence sector retail".

Cada capacidad:

- Pertenece a **un copilot dueño** (puede involucrar a otros como colaboradores, pero el dueño es uno).
- Tiene **inputs canónicos** y **output canónico estructurado**.
- Opera a un **nivel agéntico declarado** (L1/L2/L3/L4 — ver §15 y `AGENTIC_LAYERS_SPEC`).
- Está asociada a **una o más fases del TOS** (ver §16).

Catálogo cerrado en §16. Una nueva capacidad requiere actualizar este spec.

### 2.5 Invocación / Delegación

**Invocación**: el TC llama a un especialista con un input canónico (request) y espera un output estructurado (response). Ver §9.

**Delegación**: el TC traslada una parte de una conversación con el usuario a uno o varios especialistas, conservando él la voz frente al usuario. Una delegación contiene una o varias invocaciones.

Diferencia clave: la **invocación** es el contrato técnico request/response; la **delegación** es la decisión de orquestación que activa una o varias invocaciones.

### 2.6 Voz única

**Único principio inviolable** del modelo conversacional: solo Arroba Copilot habla con el usuario. Los especialistas **nunca** producen texto destinado al usuario. Sus outputs son **estructurados** (datos, recomendaciones, alertas, drafts en formato canónico) que el TC consolida y verbaliza.

Ver §12 para detalle del modelo.

### 2.7 Diferencia entre "especialista" y "página de entidad"

Pieza terminológica crítica para evitar confusión con `ARROBA_PHILOSOPHY.md §12`:

| Concepto | Qué es | Dónde vive |
|---|---|---|
| **Copilot especialista** | Agente de dominio que sabe sobre un campo de conocimiento (empresas, mercados, valoración, advisory) | Capa "Engines & Specs"; invisible al usuario |
| **Página de entidad** | Vista UX de una entidad concreta (`/empresa/{cif}`, `/operacion/{id}`, …) | Capa Entity Framework + Design System; visible al usuario |
| **"Vista especializada" del Copilot en una página** | Cuando el usuario navega a `/empresa/X`, Arroba Copilot prepara contextualmente sus respuestas activando con prioridad al especialista Company; pero **sigue siendo Arroba Copilot** quien habla, no "Company Copilot" | Comportamiento UX del Arroba Copilot |

Es decir: la página activa **contexto** y **prioridad de invocación** del especialista relevante, no una identidad conversacional separada.

### 2.8 Risk & Compliance Service (dependency forward)

Servicio externo, **fuera del scope de los 6 specs del Sprint 0**, encargado de:

- Detección de fraude.
- KYC reforzado (Know Your Customer).
- Screening regulatorio (sanciones, PEP, AML).
- Detección de patrones de abuso cross-user.

Ningún copilot (incluido TC) accede a **audit logs de otros usuarios** directamente. La detección de fraude **se delega** a este servicio. El copilot consulta **resultados** del servicio cuando el usuario tiene permisos para verlos.

Spec de Risk & Compliance: **laguna documental P0** marcada en §17.

---

## 3. Principios canónicos

### 3.1 Organización por dominio, no por entidad

Repetido por su centralidad arquitectónica (§1.3):

- Los 5 copilots se organizan **por dominio de conocimiento**.
- Una página de entidad **activa contexto y prioridad** de un especialista, pero no le pertenece.
- Cualquier especialista puede ser invocado en cualquier fase del TOS si hay competencia sobre su dominio.

### 3.2 Voz única siempre (decisión B6)

> *"No quiero que los especialistas hablen directamente con el usuario. El usuario siempre conversa con Arroba Copilot. … La respuesta siempre deberá llegar con una única voz. Solo en casos excepcionales de depuración o diagnóstico podrá mostrarse qué especialista ha participado."*

**Principio inviolable**. Los 4 especialistas **devuelven outputs estructurados internos** al TC. Nunca producen texto narrativo destinado al usuario. El TC **consolida y verbaliza**.

Ver §12 para implementación funcional.

### 3.3 Continuidad por defecto, aislamiento estricto entre adversarios (decisión B3)

> *"La memoria cross-deal debe estar activada por defecto, pero limitada al mismo usuario, organización o advisor. … No obstante: nunca compartir memoria entre organizaciones diferentes; nunca compartir memoria entre compradores y vendedores; nunca compartir memoria entre clientes distintos de un mismo advisor sin autorización explícita; respetar siempre las políticas definidas en MEMORY_ENGINE_SPEC."*

**Regla maestra**:

- ✅ **Permitido por defecto**: continuidad cross-deal dentro de un mismo usuario / dentro de una misma organización / dentro de un mismo advisor (cuando son sus propios mandatos).
- ❌ **Prohibido por defecto**: organizaciones diferentes; Buyer ↔ Seller; clientes distintos de un mismo Advisor (sin opt-in explícito del cliente).

Las 4 reglas son **literales** y **no negociables** en este spec. La implementación técnica (cómo se garantiza el aislamiento) vive en `MEMORY_ENGINE_SPEC` (0.4).

### 3.4 Least privilege total (decisión B2)

Cada especialista accede **solo** a:

- La memoria del dominio que le compete (ver §10).
- Los identificadores y artefactos pasados explícitamente en la invocación (ver §9).
- Los servicios externos declarados como herramientas suyas (ver fichas §5-§8).

Ningún especialista:

- Accede a memoria de **otro especialista** sin contrato explícito (la "memoria compartida entre copilots" pasa por el TC, ver `MEMORY_ENGINE_SPEC`).
- Accede a memoria de **otras operaciones** del mismo usuario salvo dentro de los límites de la regla 3.3.
- Lee directamente **audit logs cross-user** (ver §3.5).
- Recibe el **contexto entero** de la conversación del usuario; solo el subset relevante.

### 3.5 Sin acceso directo a audit cross-user (decisión B2)

> *"El Transaction Copilot no debe tener acceso libre a los audit logs de otros usuarios. … La detección de fraude debe realizarse mediante un servicio específico de Risk & Compliance. El Copilot únicamente podrá consultar el resultado de ese servicio cuando el usuario tenga permisos para ello. No accederá directamente al histórico de otros usuarios."*

**Reglas inmediatas**:

- Ningún copilot (incluido TC) consulta el audit log de otros usuarios.
- La **detección de patrones cross-user** (fraude, abuso, anomalías) **se delega** al Risk & Compliance Service.
- Los copilots pueden **consultar resultados** del servicio (ej. "este Buyer tiene flag verde de Risk & Compliance") cuando el usuario en sesión tiene permisos para verlos.
- El servicio Risk & Compliance es **dependencia externa**; su contrato no se define aquí.

### 3.6 Transparencia natural sin ruido (decisión B11)

> *"Quiero transparencia suficiente, pero sin ruido. Arroba Copilot podrá indicar de forma natural: 'He analizado la empresa', 'He comparado compañías similares', 'He revisado la valoración'. No es necesario indicar continuamente qué especialista ha realizado cada tarea. Cuando una conclusión dependa claramente de un dominio concreto, podrá mencionarse de forma contextual. La experiencia debe sentirse como un único asistente inteligente, no como cinco asistentes diferentes."*

**Patrón canónico**:

- El TC verbaliza en **primera persona** ("he analizado", "he comparado", "he revisado") aunque internamente haya delegado.
- **Sin atribución sistemática** ("Company Advisor sugiere…", "Valuation Copilot calcula…") — eso fragmenta la experiencia.
- **Menciones de dominio** cuando aportan claridad ("en términos sectoriales", "desde la valoración") están permitidas, pero no obligatorias.
- Un usuario consume la experiencia como "un único asistente inteligente".

Este principio **resuelve la tensión** con `TRANSACTION_COPILOT_SPEC §3.2-3.4` donde se mencionaba "atribución sutil del especialista". Esa atribución pasa de "decisión UX por defecto" a "metadato técnico interno opcional" (ver §12 y `[OPEN-C2]`).

### 3.7 Outputs estructurados, no narrativos

Consecuencia directa de §3.2 y §3.4. Los 4 especialistas devuelven al TC objetos canónicos con:

- `structured_output` (datos, listas, tablas, drafts en formato schema-validado).
- `findings` (hallazgos relevantes, etiquetados por categoría).
- `confidence` (nivel de confianza global y por hallazgo).
- `citations` (referencias a memoria, artefactos, fuentes externas).
- `recommendations` (próximos pasos sugeridos, no texto al usuario).
- `internal_notes` (notas para el TC; nunca para el usuario).

El TC convierte ese paquete estructurado en una respuesta conversacional en su voz única.

### 3.8 Composabilidad

Cualquier especialista puede ser invocado en cualquier fase del TOS **si hay competencia sobre su dominio**. La tabla `TRANSACTION_COPILOT_SPEC §4` (mapa copilot × fase) es **el patrón típico**, pero no la única configuración legítima.

Ejemplos de composabilidad legítima:

- En fase 11 (DD), invocar **Market Copilot** para entender un riesgo sectorial detectado en el Data Room (no era patrón típico, pero es válido).
- En fase 5 (Matching), invocar **Valuation Copilot** para cuantificar la diferencia de valoración entre Recomendaciones.
- En fase 15 (Integración), invocar **Company Copilot** para evaluar el impacto post-deal sobre la ficha de la target.

El TC decide.

---

## 4. Arquitectura general

### 4.1 Diagrama del sistema

```
                ┌──────────────────────────────────────┐
                │              USUARIO                 │
                └────────────────┬─────────────────────┘
                                 │ habla
                                 ▼
                ┌──────────────────────────────────────┐
                │     ARROBA COPILOT (visible)         │   ← única voz
                │     == Transaction Copilot (interno) │
                └────────────────┬─────────────────────┘
                                 │ orquesta
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       ┌─────────────┐    ┌────────────┐    ┌──────────────┐
       │  Company    │    │   Market   │    │  Valuation   │
       │  Copilot    │    │   Copilot  │    │  Copilot     │
       └──────┬──────┘    └──────┬─────┘    └──────┬───────┘
              │                  │                  │
              │           ┌──────────────┐          │
              │           │   Advisor    │          │
              │           │   Copilot    │          │
              │           └──────┬───────┘          │
              │                  │                  │
              ▼                  ▼                  ▼
       ┌─────────────────────────────────────────────────┐
       │              MEMORY ENGINE  (forward 0.4)        │
       │  empresa · valoración · oportunidad · match ·    │
       │  operación · usuario · advisor · compartida ·    │
       │  audit log                                       │
       └─────────────────────────────────────────────────┘
                              │
                              │ resultados de
                              │ patrones cross-user
                              ▼
       ┌─────────────────────────────────────────────────┐
       │  RISK & COMPLIANCE SERVICE (dependencia ext.)    │
       │  fraude · KYC · screening · patrones de abuso    │
       └─────────────────────────────────────────────────┘
```

### 4.2 Reglas estructurales

1. El **usuario** habla solo con **Arroba Copilot**.
2. **Arroba Copilot** (= TC) es el **único orquestador**.
3. Los 4 **especialistas** solo son invocados por el TC. Nunca se invocan entre sí directamente.
4. La **memoria** vive en `MEMORY_ENGINE` (forward 0.4); todos los copilots la leen/escriben **bajo políticas de aislamiento** (§10).
5. **Risk & Compliance Service** es **dependencia externa**; el TC y los especialistas **consultan resultados**, no procesan audit cross-user.
6. El **audit log** del TOS (definido en 0.1 §9) registra todas las invocaciones, delegaciones y eventos relevantes (§11).

### 4.3 Flujo de una consulta típica

```
1. Usuario al TC:    "¿Qué tan caro es comprar Kitchen Studio?"
                          │
2. TC analiza:        intent=valuation + entity=company
                      ↓
3. TC delega:        Valuation Copilot (primario) + Company Copilot (contexto)
                          │
4. Especialistas devuelven:
       - Company:    { financials: {...}, signals: [...], confidence: 0.85 }
       - Valuation:  { central: 18.4M, band: [15.2, 22.1], method: "ebitda_mult", ... }
                          │
5. TC consolida:     "He revisado los datos financieros y la valoración indicativa.
                      Para Kitchen Studio estimo un rango de 15-22 M€, con valor central
                      ~18.4 M€ usando múltiplos de EBITDA. ¿Quieres ver las sensibilidades?"
                          │
6. Audit:            copilot.delegation_invoked × 2
                     copilot.internal_query × 2
                     copilot.user_response × 1
```

El usuario percibe **una sola voz**, una sola respuesta, en primera persona.

---

## 5. Company Copilot

**Dominio**: conocimiento sobre **empresas** (cualquier empresa, cualquier país, cualquier sector). Identidad, datos básicos, financieros, comerciales, operativos, señales públicas, eventos corporativos, lineage histórico de operaciones, watchlist del usuario sobre la empresa.

### 5.1 Capacidades L2 (sub-conjunto del catálogo §16)

- **CAP-001** Análisis narrativo de empresa.
- **CAP-002** Generar Insights priorizados.
- **CAP-003** Identificar señales relevantes.
- **CAP-004** Resumir documentación del Data Room.
- **CAP-005** Clasificar documentos.
- **CAP-006** Detectar incoherencias en datos financieros (colaboración con Valuation, dueño Company).
- **CAP-007** Redactar Teaser anonimizado (colaboración con Advisor, co-dueño Company).
- **CAP-008** Preparar Information Memorandum (colaboración con Advisor, co-dueño Company).
- **CAP-009** Preparar respuestas Q&A (colaboración con Advisor, co-dueño Company).

### 5.2 Capacidades L1 (conversacionales)

Siempre disponibles:

- Responder preguntas sobre **cualquier campo** de la ficha de Empresa al que el usuario en sesión tiene acceso (público, post-NDA, post-LOI, según permisos).
- Explicar señales, hallazgos, hitos históricos.
- Comparar dos empresas de forma cualitativa (datos básicos, sin valoración — eso es Valuation).
- Sugerir empresas similares (a nivel cualitativo; el matching cuantitativo es Market).
- Listar operaciones históricas y eventos corporativos.

### 5.3 Capacidades L3/L4 (forward `AGENTIC_LAYERS_SPEC` 0.5)

- **L3** Ejecución asistida con confirmación:
  - Refrescar el análisis narrativo (rate-limited).
  - Marcar una incoherencia detectada como "validada por el usuario".
  - Promover un draft de Teaser a "aprobado para publicación".
- **L4** Automatización autorizada previa:
  - Recordatorios periódicos sobre cambios en señales de empresas en watchlist (cuando el usuario lo autoriza).
  - Refresh automático del análisis al detectar evento corporativo crítico (M&A, financiación, cambio accionarial).

Detalle operativo de L3/L4 en `AGENTIC_LAYERS_SPEC`.

### 5.4 Herramientas utilizadas

- **EnrichCompanyAdapter** (Boundary First, hoy `MockEnrichCompanyAdapter`; real pendiente).
- **Data Layer**: ficha de Empresa, comparables, señales (mocks + reales según `_INVENTORY_2026.md`).
- **Skill `analyze`** existente (`/api/copilot/skills/analyze`).
- **Memory Engine** (forward) para conversaciones de la empresa, watchlists, lineage.
- **LLM** (Claude Sonnet 4.6 vía Emergent LLM Key; modelo agnóstico — ver `[OPEN-B4]` del TC spec).

### 5.5 Tipos de memoria leídos

(Nomenclatura forward de `MEMORY_ENGINE_SPEC`):

- **Memoria de empresa** (`company.{id}.*`): conversaciones, narrativas, watchlist, lineage de operaciones, fichero enriquecido.
- **Memoria de usuario** (`user.{id}.*`): historial sobre la empresa, preferencias.
- **Memoria compartida entre copilots** (`shared.{session_id}.*`): subset autorizado para esta invocación.

### 5.6 Tipos de memoria escritos

- **Memoria de empresa**: nueva narrativa, nuevos insights, watermarks de accesos del usuario.
- **Memoria de operación** (`operation.{id}.*`): solo cuando la invocación viene en contexto de Operation activa (fases 8, 11, etc.); escribe documentos derivados (IM draft, Q&A responses draft) en buckets controlados.
- **Audit log**: eventos canónicos (§11).

### 5.7 Cuándo lo invoca el Transaction Copilot

Matriz de fases TOS donde Company es típicamente invocado (refina `TRANSACTION_COPILOT_SPEC §4`):

| Fase | Rol de Company | Frecuencia esperada |
|---|---|---|
| T1 Análisis | **Primario** | Alta |
| T2 Valoración | Apoyo (datos financieros, comparables individuales) | Media |
| T3 Identificación | Apoyo (fichas de candidatas) | Media-Baja |
| T4 Screening | Apoyo (datos enriquecidos por candidata) | Media |
| T5 Matching | Apoyo (refresh datos al recomendar) | Baja |
| T6 Teaser | **Co-primario** con Advisor (datos para construir Teaser) | Alta |
| T7 NDA | — | Nula |
| T8 IM | **Primario** | Alta |
| T9 Q&A | Co-primario con Advisor | Alta |
| T10 LOI | Apoyo (datos para sustentar oferta) | Baja |
| T11 DD | Apoyo intensivo (análisis Data Room, hallazgos) | Alta |
| T12 Negociación | Apoyo puntual | Baja |
| T13 SPA | — | Nula |
| T14 Closing | — | Nula |
| T15 Integración | Apoyo (impacto post-deal sobre la ficha de la target) | Baja |

### 5.8 Cuándo lo invoca el usuario indirectamente

Cuando el usuario:

- Navega a `/empresa/{cif}` y abre el dock conversacional: el TC prepara contexto con Company como especialista prioritario.
- Pregunta sobre "esta empresa" en cualquier página: si hay entidad Empresa anclada en la sesión, Company se activa.
- Solicita refrescar análisis, ver comparables individuales, ver señales recientes.

### 5.9 Outputs estructurados típicos

```
{
  "voice": "company",
  "narrative_draft": "<texto narrativo apto para que el TC lo verbalice o resuma>",
  "insights": [
    { "topic": "growth", "summary": "...", "confidence": 0.8 },
    { "topic": "risk", "summary": "...", "confidence": 0.6 }
  ],
  "signals": [
    { "kind": "funding", "date": "2025-11-12", "headline": "..." }
  ],
  "findings": [
    { "kind": "data_inconsistency", "severity": "yellow", "details": "..." }
  ],
  "citations": [
    { "source": "agency_tool.master_companies", "id": "mc_kitchen_studio_5h2x" },
    { "source": "memory.company.conversations", "id": "msg_..." }
  ],
  "confidence": 0.78,
  "recommendations": [
    { "next_step": "request_valuation", "rationale": "..." }
  ],
  "internal_notes": "Datos pre-2024 con baja calidad; sugerir refresh."
}
```

El TC consume este JSON y lo convierte en respuesta conversacional. **El campo `narrative_draft`** puede ser texto pre-verbalizado, pero el TC tiene libertad para reformularlo o resumirlo en su voz.

### 5.10 Riesgos y zonas prohibidas

- ❌ Hablar directamente con el usuario.
- ❌ Acceder a memoria de **otras empresas no involucradas** en la sesión actual sin justificación contextual.
- ❌ Revelar identidad de Empresa en contexto Discovery Layer pre-Match (cuando el output puede llegar al Buyer).
- ❌ Mezclar datos de empresas de **organizaciones diferentes** en una misma respuesta (aislamiento §3.3).
- ❌ Consultar audit cross-user.
- ❌ Inventar datos cuando el `EnrichCompanyAdapter` no devuelve nada: debe declarar `confidence: 0` o `data_unavailable: true`.

### 5.11 Open questions específicas

- `[OPEN-C3]` ¿Company Copilot tiene acceso a datos privados de Empresas que el usuario NO ha comprado en su plan? Propuesta: solo si la empresa está en `master_companies_mock` con `visibility=public` o si el usuario ha pagado por enrich. Detalle en `MONETIZATION_SPEC`.

---

## 6. Market Copilot

**Dominio**: conocimiento sobre **sectores, mercados y competencia**. Análisis sectorial, dinámica competitiva, agregados, tendencias macroeconómicas, territorios geográficos, motor de matching cuantitativo entre Opportunity y Companies candidatas.

### 6.1 Capacidades L2

- **CAP-010** Análisis sectorial.
- **CAP-011** Análisis territorial.
- **CAP-012** Identificar compradores potenciales (matching cuantitativo).
- **CAP-013** Preparar screenings (colaboración con Advisor, co-dueño Market).
- **CAP-014** Tendencias y benchmarks sectoriales.
- **CAP-015** Generar Recomendaciones (sistema → usuario) en fase 5.

### 6.2 Capacidades L1

- Responder preguntas sobre sectores, sub-sectores y territorios.
- Comparar dinámicas sectoriales.
- Explicar tendencias macro relevantes para una tesis.
- Listar empresas activas en un sector/territorio (a alto nivel; el detalle de cada una lo da Company).
- Razonar sobre por qué una candidata es "fit" para una Opportunity (a nivel cualitativo; el scoring cuantitativo es output estructurado).

### 6.3 Capacidades L3/L4

- **L3** Ejecución asistida:
  - Generar lote de Recomendaciones tras refinar criterios (fase 5).
  - Aplicar filtros nuevos a una Opportunity y recalcular Compatibility scores.
- **L4** Automatización autorizada:
  - Refresh periódico de Compatibility de candidatas activas (semanal por defecto, configurable).
  - Alerta proactiva ante aparición de nuevas candidatas que cumplan criterios duros de una Opportunity activa.

### 6.4 Herramientas utilizadas

- **Skill `recommend`** existente (`/api/copilot/skills/recommend`).
- **Data Layer**: agregados sectoriales (mocks por ahora; reales pendientes).
- **Motor de matching** (laguna `MARKETPLACE_SPEC` P1).
- **Memory Engine** para memoria de oportunidad, sector, territorio.
- **LLM** para análisis cualitativo.

### 6.5 Tipos de memoria leídos

- **Memoria de oportunidad** (`opportunity.{id}.*`): tesis, candidatas, exclusiones, decisiones de screening previas.
- **Memoria de sector** (`sector.{id}.*`) — laguna `MEMORY_ENGINE`: agregados, tendencias, conversaciones previas sobre el sector.
- **Memoria de territorio** (`territory.{id}.*`) — laguna: agregados regionales.
- **Memoria de empresa** (`company.{id}.public`): solo datos públicos de candidatas.
- **Memoria compartida**: subset autorizado.

### 6.6 Tipos de memoria escritos

- **Memoria de oportunidad**: scoring, Recomendaciones generadas, razones, decisiones.
- **Memoria de sector**: lineage de tendencias, conversaciones.
- **Audit log**.

### 6.7 Cuándo lo invoca el Transaction Copilot

| Fase | Rol de Market | Frecuencia |
|---|---|---|
| T1 Análisis | Apoyo (contexto sectorial al analizar empresa) | Baja |
| T2 Valoración | Apoyo (múltiplos sectoriales) | Media |
| T3 Identificación | **Primario** | Alta |
| T4 Screening | **Primario** | Alta |
| T5 Matching | **Primario** | Alta |
| T6 Teaser | Apoyo (cómo posicionar el activo en el sector) | Baja |
| T7-T9 | — | Nula |
| T10 LOI | Apoyo (validación con múltiplos sectoriales) | Baja |
| T11 DD | Apoyo (riesgos sectoriales que aparecen) | Media-Baja |
| T12-T14 | — | Nula |
| T15 Integración | Apoyo (sinergias sectoriales) | Baja |

### 6.8 Cuándo lo invoca el usuario indirectamente

- Navega a `/sector/{slug}` o `/territorio/{slug}` (cuando esas páginas existan, E1.6-E1.7).
- Pregunta sobre tendencias, competencia, agregados sectoriales en cualquier página.
- Crea o edita una Opportunity.

### 6.9 Outputs estructurados típicos

```
{
  "voice": "market",
  "sector_summary": "...",
  "candidates": [
    {
      "company_id": "mc_xxx",
      "compatibility_score": 0.82,
      "reasons": ["sector_match", "size_match", "geo_match"],
      "anti_reasons": ["recent_funding_might_block"]
    }
  ],
  "trends": [
    { "topic": "consolidación", "direction": "up", "evidence": [...] }
  ],
  "benchmarks": {
    "median_ebitda_multiple": 8.4,
    "median_revenue_growth_yoy": 0.18
  },
  "confidence": 0.71,
  "recommendations": [
    { "next_step": "narrow_thesis_by_size", "rationale": "..." }
  ],
  "internal_notes": "Universo posible: 47 candidatas; top 12 con score > 0.6."
}
```

### 6.10 Riesgos y zonas prohibidas

- ❌ Hablar directamente con el usuario.
- ❌ Cruzar memoria de Opportunities **de diferentes organizaciones** (§3.3).
- ❌ Inferir scoring cuando no hay datos suficientes; debe declarar `confidence` bajo.
- ❌ Sugerir candidatas que estén en `Opportunity.exclusions` o que pertenezcan a la misma organización del Buyer (conflicto de interés).
- ❌ Filtrar identidad de candidatas pre-Match a un Buyer que no debe verlas.

### 6.11 Open questions

- `[OPEN-C4]` ¿Market Copilot puede usar agregados anonimizados de Opportunities cross-organización para mejorar sus scores (sin revelar identidades)? Propuesta: solo si los agregados están **k-anonimizados** y aprobados por el `Risk & Compliance Service`. Detalle en `MEMORY_ENGINE_SPEC`.

---

## 7. Valuation Copilot

**Dominio**: conocimiento sobre **valoración y comparables**. Métodos de valoración (múltiplos de revenue, EBITDA, DCF, transacciones comparables), sensibilidades, intervalos de confianza, estructura de precio, earn-out, ajustes por hallazgos de DD.

### 7.1 Capacidades L2

- **CAP-016** Preparar valoración indicativa (determinista, sin LLM).
- **CAP-017** Preparar valoración avanzada (LLM/expert-assisted, multi-método).
- **CAP-018** Generar comparables de transacciones.
- **CAP-019** Proponer estructuras de precio y earn-out (colaboración con Advisor, co-dueño Valuation).
- **CAP-020** Analizar sensibilidades (qué pasa si cambian inputs clave).

### 7.2 Capacidades L1

- Explicar métodos de valoración.
- Razonar sobre rangos: por qué la banda es 15-22 M€ y no 10-30 M€.
- Comparar dos valoraciones de la misma empresa con métodos distintos.
- Explicar el impacto de un hallazgo de DD sobre la valoración (ajustes).

### 7.3 Capacidades L3/L4

- **L3**:
  - "Guardar como valoración oficial de la empresa" (impacta lineage permanente).
  - "Promover de indicativa a avanzada" (requiere permisos + cobro `MONETIZATION_SPEC`).
- **L4**:
  - Recalcular valoración automáticamente cuando hay nuevos datos financieros (autorización previa).

### 7.4 Herramientas utilizadas

- **Skill `value`** existente (`/api/copilot/skills/value`, determinista).
- **Skills futuros**: DCF, múltiplos personalizados, comparables de transacciones.
- **Data Layer**: financieros de la empresa, comparables, benchmarks sectoriales (vía Market).
- **Memory Engine**.

### 7.5 Tipos de memoria leídos

- **Memoria de valoración** (`valuation.{id}.*`) — laguna `MEMORY_ENGINE`: histórico de valoraciones de la misma empresa.
- **Memoria de empresa**: financieros, comparables, lineage.
- **Memoria de sector**: múltiplos de referencia (vía Market).
- **Memoria de operación**: cuando la valoración es contextual a una Operation (fases 10, 12).

### 7.6 Tipos de memoria escritos

- **Memoria de valoración**: nueva valoración persistida (indicativa o avanzada).
- **Memoria de empresa**: referencia a la nueva valoración (`company.{id}.valuations[]`).
- **Audit log**.

### 7.7 Cuándo lo invoca el Transaction Copilot

| Fase | Rol de Valuation | Frecuencia |
|---|---|---|
| T1 Análisis | — | Nula |
| T2 Valoración | **Primario** | Alta |
| T3 Identificación | Apoyo puntual | Baja |
| T4-T5 | Apoyo puntual | Baja |
| T6 Teaser | Apoyo (rango opcional a exponer) | Baja |
| T7-T9 | Apoyo en preguntas sobre precio | Baja |
| T10 LOI | **Primario** (justificación o crítica del precio ofrecido) | Alta |
| T11 DD | Apoyo (ajustes por hallazgos) | Media |
| T12 Negociación | **Primario** (estructura de precio, earn-out) | Alta |
| T13-T15 | — | Nula |

### 7.8 Cuándo lo invoca el usuario indirectamente

- Navega a `/valoracion/{id}` (cuando esa página exista, E1.8).
- Pregunta sobre precio, valor, múltiplos en cualquier página.
- Edita o solicita nueva valoración.

### 7.9 Outputs estructurados típicos

```
{
  "voice": "valuation",
  "central_value": 18400000,
  "currency": "EUR",
  "band": { "low": 15200000, "high": 22100000, "confidence_interval": 0.8 },
  "method": "ebitda_multiple",
  "method_params": {
    "ebitda_ttm": 2300000,
    "multiple_central": 8.0,
    "multiple_range": [6.6, 9.6],
    "source_of_multiples": "sector_benchmark_2025q4"
  },
  "sensitivities": [
    { "variable": "ebitda", "delta_pct": +10, "value_change": +1.84e6 },
    { "variable": "multiple", "delta_pct": +10, "value_change": +1.84e6 }
  ],
  "comparables": [
    { "company_id": "mc_yyy", "transaction_date": "2024-09-01", "multiple": 8.2 }
  ],
  "confidence": 0.74,
  "recommendations": [
    { "next_step": "request_advanced_dcf", "rationale": "negocio con capex relevante" }
  ],
  "internal_notes": "Banda calculada con sample n=12 comparables sector horeca-software."
}
```

### 7.10 Riesgos y zonas prohibidas

- ❌ Hablar directamente con el usuario.
- ❌ Emitir valoración avanzada sin permisos del usuario (plan, rol).
- ❌ Marcar una valoración como "oficial" sin acción L3 explícita.
- ❌ Confundir indicativa con compromiso de precio en el output.
- ❌ Usar comparables de operaciones confidenciales en curso (vendría de memoria que no le corresponde — aislamiento §3.3).

### 7.11 Open questions

- `[OPEN-C5]` ¿La valoración indicativa puede ser visible al Buyer pre-NDA? Propuesta: NO. Solo el rango opcional que el Seller decida exponer en el Teaser. Detalle en `MEMORY_ENGINE_SPEC` y `TRANSACTION_OS_SPEC §8` (matriz de permisos).

---

## 8. Advisor Copilot

**Dominio**: conocimiento sobre la **forma de trabajar de un asesor M&A**. Mandatos, screening profesional, NDAs (estructura, niveles, plantillas), Information Memorandum (estructura, secciones críticas), LOIs, SPAs, earn-out, indemnities, cláusulas, advisor playbooks, métricas de éxito de un advisor (operaciones cerradas, valor, multiplo medio, NPS).

### 8.1 Capacidades L2

- **CAP-021** Preparar ofertas indicativas / LOI / NBO (colaboración con Valuation, co-dueño Advisor).
- **CAP-022** Detectar riesgos de negociación (colaboración con TC, dueño Advisor).
- **CAP-023** Detectar documentación faltante en Data Room (colaboración con TC).
- **CAP-024** Generar preguntas de Due Diligence sectorial.
- **CAP-025** Elaborar informes dinámicos de riesgos legales/contractuales.
- **CAP-026** Asistir en negociación (cláusulas, comparator de drafts).
- **CAP-027** Comparar versiones de contratos (drafts SPA, addenda).
- **CAP-028** Generar checklists de cierre.
- **CAP-029** Asistir en planificación de integración post-deal (colaboración con Market + TC).

### 8.2 Capacidades L1

- Explicar cualquier cláusula legal o contractual del flujo M&A.
- Razonar sobre estructura de earn-out, no competencia, indemnities.
- Comparar plantillas (NDA estándar vs NDA progresivo, LOI vinculante vs IOI).
- Resumir prácticas estándar del sector M&A para una operación dada.

### 8.3 Capacidades L3/L4

- **L3**:
  - "Promover draft de cláusula a SPA pendiente revisión".
  - "Enviar pregunta Q&A al Seller en nombre del Advisor".
- **L4**:
  - Notificación al Seller sobre documentos pendientes en DD (autorización previa).
  - Recordatorio de hitos de integración post-deal (cadencia configurada).

### 8.4 Herramientas utilizadas

- **Plantillas legales** (Boundary First: proveedor concreto se decide en implementación).
- **Comparator de drafts**.
- **Memory Engine**.
- **LLM** para redacción legal asistida.

### 8.5 Tipos de memoria leídos

- **Memoria de advisor** (`advisor.{id}.*`) — laguna `MEMORY_ENGINE`: playbooks personales, plantillas custom, mandatos activos, métricas históricas.
- **Memoria de mandato** (`mandate.{id}.*`).
- **Memoria de operación**: drafts SPA, Q&A log, DD findings, NDA y LOI firmados, condiciones suspensivas.
- **Memoria de match**: contexto inicial.
- **Memoria compartida**.

### 8.6 Tipos de memoria escritos

- **Memoria de operación**: SPA drafts versionados, cláusulas propuestas, comparator outputs, checklists de cierre.
- **Memoria de advisor**: actualización de playbooks (cuando el usuario lo autoriza), nuevas plantillas custom.
- **Audit log**.

### 8.7 Cuándo lo invoca el Transaction Copilot

| Fase | Rol de Advisor | Frecuencia |
|---|---|---|
| T1 Análisis | — | Nula |
| T2 Valoración | Apoyo (precedentes contractuales) | Baja |
| T3 Identificación | Apoyo (cuando hay Mandate) | Baja |
| T4 Screening | Apoyo (filtros profesionales) | Media |
| T5 Matching | Apoyo (representando partes con Mandate) | Baja |
| T6 Teaser | **Co-primario** con Company (forma legal del Teaser) | Alta |
| T7 NDA | **Primario** (revisión plantilla, riesgos legales) | Alta |
| T8 IM | Co-primario con Company (forma del IM) | Alta |
| T9 Q&A | **Primario** (estructura de respuestas defendibles, riesgos legales) | Alta |
| T10 LOI | **Co-primario** con Valuation | Alta |
| T11 DD | Apoyo intensivo (hallazgos legales) | Alta |
| T12 Negociación | **Primario** (cláusulas, comparator) | Muy alta |
| T13 SPA | **Primario** (último review pre-firma) | Alta |
| T14 Closing | Apoyo (interpretación de condiciones suspensivas) | Media |
| T15 Integración | Apoyo (interpretación de cláusulas de integración) | Media |

### 8.8 Cuándo lo invoca el usuario indirectamente

- Navega a `/operacion/{id}` en fases 7-13 (Deal Workspace).
- Pregunta sobre cláusulas, NDA, LOI, SPA, riesgo legal, prácticas de mercado.
- Edita un Mandate.
- Navega a `/advisor/{slug}` (cuando esa página exista, backlog).

### 8.9 Outputs estructurados típicos

```
{
  "voice": "advisor",
  "clauses_review": [
    {
      "clause_id": "earn_out_3.2",
      "issue": "trigger demasiado vago",
      "severity": "yellow",
      "suggested_redraft": "...",
      "rationale": "..."
    }
  ],
  "missing_documents": [
    { "kind": "tax_return_2024", "severity": "red", "reason": "..." }
  ],
  "comparator": [
    {
      "version_from": "spa_v3",
      "version_to": "spa_v4",
      "diffs": [...]
    }
  ],
  "dd_questions_generated": [
    { "category": "legal", "question": "...", "rationale": "..." }
  ],
  "playbook_match": {
    "playbook_id": "horeca_acquisition_2024",
    "fit_score": 0.81
  },
  "confidence": 0.79,
  "recommendations": [
    { "next_step": "request_clause_change_3.2", "rationale": "..." }
  ],
  "internal_notes": "Cliente nuevo; usar plantilla estándar primer pase."
}
```

### 8.10 Riesgos y zonas prohibidas

- ❌ Hablar directamente con el usuario.
- ❌ **Firmar artefactos legales en nombre del usuario** (consistente con `TRANSACTION_COPILOT_SPEC §9.1`). La firma siempre es acción L3 del usuario humano.
- ❌ Reutilizar cláusulas de **mandatos de otros clientes del mismo advisor** sin autorización explícita del cliente origen (§3.3).
- ❌ Compartir plantillas custom entre advisors de organizaciones diferentes.
- ❌ Emitir conclusiones legales definitivas: siempre `confidence` + `recommendation` con margen para revisión humana.

### 8.11 Open questions

- `[OPEN-C6]` ¿Advisor Copilot puede actuar **sin advisor humano** asignado al usuario (es decir, asistir directamente al Buyer/Seller que no tiene Advisor con Mandate)? Propuesta: SÍ a nivel L1/L2 (asistencia conversacional y borradores). NO a nivel L3/L4 que requieran firma o vinculación contractual. Detalle a confirmar en `ADVISOR_LAYER_SPEC` (laguna P1).
- `[OPEN-C7]` La "memoria de advisor" cross-mandato: confirmar si por defecto **on dentro del mismo cliente** y **off entre clientes distintos del mismo advisor** (consistente con regla §3.3 "nunca compartir memoria entre clientes distintos de un mismo advisor sin autorización explícita"). Sí, por consistencia. Pero conviene formalizarlo en `MEMORY_ENGINE_SPEC`.

---

## 9. Contrato canónico de invocación

### 9.1 Request — TC → Especialista

Estructura mínima (schema validable):

```json
{
  "correlation_id": "req_<uuid>",
  "session_id": "sess_<uuid>",
  "parent_event_id": "<id del evento audit que originó la invocación>",
  "specialist": "company" | "market" | "valuation" | "advisor",
  "capability": "CAP-XXX",          // del catálogo §16
  "intent": "<descripción semántica corta del propósito>",
  "agentic_level": "L1" | "L2" | "L3-prepare" | "L3-execute" | "L4-execute",
  "phase": {
    "tos_phase": "T1"|"T2"|...|"T15"|"match_request",
    "layer": "discovery" | "frontier" | "transaction"
  },
  "entities": {
    "company_ids": [],
    "valuation_ids": [],
    "opportunity_ids": [],
    "match_ids": [],
    "operation_ids": [],
    "mandate_ids": [],
    "primary_entity": { "type": "...", "id": "..." }
  },
  "actor": {
    "user_id": "...",
    "role": "subscriber" | "corporate" | "investor" | "advisor" | "arroba_team" | "admin",
    "org_id": "..."
  },
  "permissions": {
    "scopes": ["read:company.public", "read:operation.{id}", "write:operation.{id}.documents", ...]
  },
  "context": {
    "user_query": "<texto del usuario, opcional; el especialista NO lo verbaliza>",
    "memory_subset": { /* solo el subset autorizado para esta invocación */ },
    "prior_findings": [ /* findings de invocaciones previas en la misma sesión */ ]
  },
  "constraints": {
    "max_tokens_response": 4096,
    "time_budget_ms": 12000,
    "must_cite": true,
    "must_declare_confidence": true,
    "no_user_facing_text": true
  },
  "schema_version": 1
}
```

**Notas**:

- `correlation_id` permite **trazabilidad cross-invocación**: cada turno del usuario puede generar N invocaciones, todas vinculadas al mismo `parent_event_id`.
- `permissions.scopes` es la **mínima información** que el especialista necesita para operar bajo least privilege. Si no está, no puede leer.
- `constraints.no_user_facing_text = true` es **inviolable**: el especialista NO produce texto destinado al usuario (decisión B6).

### 9.2 Response — Especialista → TC

Estructura mínima:

```json
{
  "correlation_id": "req_<uuid>",
  "specialist": "company"|"market"|"valuation"|"advisor",
  "capability": "CAP-XXX",
  "status": "ok" | "partial" | "low_confidence" | "denied" | "timeout" | "error",
  "structured_output": { /* schema específico de la capacidad */ },
  "findings": [ /* hallazgos relevantes */ ],
  "citations": [ /* referencias a memoria, artefactos, fuentes */ ],
  "confidence": 0.0..1.0,
  "recommendations": [
    { "next_step": "...", "rationale": "...", "agentic_level_required": "L1"|"L2"|"L3"|"L4" }
  ],
  "memory_writes_proposed": [
    { "scope": "operation.{id}.documents", "patch": {...}, "requires_user_approval": true }
  ],
  "internal_notes": "<notas para el TC; nunca para el usuario>",
  "narrative_draft": null | "<opcional, texto pre-verbalizado para que el TC consolide/resuma>",
  "elapsed_ms": 4321,
  "schema_version": 1
}
```

**Reglas del response**:

- `status` declara el resultado de la invocación. `denied` (el especialista rechaza por falta de permisos), `low_confidence` (responde pero avisa), `partial` (responde parcial), `timeout`/`error` (no respondió).
- `memory_writes_proposed` no se aplica automáticamente; el TC decide si pasarlas al `MEMORY_ENGINE` (algunas pueden requerir aprobación del usuario — L3).
- `narrative_draft` es opcional. Si está presente, es **insumo** para el TC, no salida final.
- `no_user_facing_text` aplica: el especialista NO firma con voz propia, no saluda al usuario, no incluye llamados a la acción dirigidos al usuario en `internal_notes`.

### 9.3 Campos obligatorios

| Campo | Obligatorio en request | Obligatorio en response |
|---|---|---|
| `correlation_id` | ✓ | ✓ |
| `session_id` | ✓ | — |
| `parent_event_id` | ✓ | — |
| `specialist` | ✓ | ✓ |
| `capability` | ✓ (excepto en L1 puro) | ✓ |
| `intent` | ✓ | — |
| `agentic_level` | ✓ | — |
| `phase` | ✓ | — |
| `actor.user_id`, `actor.role`, `actor.org_id` | ✓ | — |
| `permissions.scopes` | ✓ | — |
| `constraints.no_user_facing_text` | ✓ (siempre `true` en producción) | — |
| `status` | — | ✓ |
| `structured_output` | — | ✓ (excepto si `status=denied` o `timeout`) |
| `confidence` | — | ✓ |
| `citations` | — | ✓ si `must_cite=true` |
| `schema_version` | ✓ | ✓ |

### 9.4 Manejo de errores

| status | Significado | Acción del TC |
|---|---|---|
| `ok` | Resultado completo y fiable | Consolidar normalmente |
| `partial` | Resultado parcial (faltan datos) | Consolidar lo disponible; marcar al usuario que falta info |
| `low_confidence` | Respondió pero el especialista no está seguro (`confidence < umbral`) | Consolidar con disclaimer; eventualmente pedir confirmación al usuario antes de actuar |
| `denied` | El especialista rechaza por falta de permisos | NO consolidar; el TC informa al usuario que no puede atender; sugiere alternativa |
| `timeout` | Sin respuesta en `time_budget_ms` | Degraded mode (§14): reintento o fallback |
| `error` | Excepción interna | Degraded mode; log de error técnico |

### 9.5 Idempotencia y versionado

- **Idempotencia**: cada request con el mismo `correlation_id` que llegue dos veces (re-envío) debe producir la misma response. El especialista cachea por `correlation_id` durante una ventana corta (5 minutos por defecto, configurable en `[OPEN-C8]`).
- **Versionado**: `schema_version` permite evolucionar el contrato sin romper consumidores antiguos. Cambios menores (campos opcionales nuevos) no incrementan versión; cambios mayores sí (con periodo de compatibilidad de 2 versiones menores como en `TRANSACTION_OS_SPEC §12.3`).

### 9.6 Naturaleza del contrato

Este es un **contrato funcional**, no implementación. La **encarnación técnica** (HTTP/gRPC, in-process Python, etc.) la decide la capa de implementación. Lo que **NO** puede cambiar:

- El conjunto de campos obligatorios.
- La regla `no_user_facing_text=true`.
- La política de status codes.
- La estructura de `structured_output` por capacidad (definida en §16).

---

## 10. Memoria y acceso

### 10.1 Tipos de memoria accesibles por copilot

Resumen normativo (forward `MEMORY_ENGINE_SPEC`):

| Copilot | Lee | Escribe |
|---|---|---|
| **Company** | empresa, sector (público), territorio (público), usuario, compartida | empresa, operación (cuando hay contexto Operation activa, en buckets controlados), audit |
| **Market** | oportunidad, sector, territorio, empresa (público), compartida | oportunidad, sector, territorio, audit |
| **Valuation** | valoración, empresa (financieros), sector (múltiplos), operación (drafts y artefactos), compartida | valoración, empresa (referencia), operación, audit |
| **Advisor** | mandato, advisor, operación, match, empresa (post-NDA), compartida | operación, advisor (con autorización), audit |
| **Transaction Copilot** | TODOS los anteriores (en modo orquestación; el TC ve más, decide menos) | audit, compartida, transiciones de fase |

### 10.2 Regla B3 — Continuidad por defecto, aislamiento entre adversarios

Cuatro reglas **literales** y **no negociables**:

1. ✅ **Permitido por defecto**: continuidad cross-deal dentro del **mismo usuario**, **misma organización** o **mismo advisor** (cuando son sus propios mandatos).
2. ❌ **Prohibido**: compartir memoria entre **organizaciones diferentes**.
3. ❌ **Prohibido**: compartir memoria entre **Buyer y Seller** de cualquier Match/Operation. Ni siquiera dentro de la misma organización si actúan como adversarios en una operación.
4. ❌ **Prohibido**: compartir memoria entre **clientes distintos de un mismo Advisor** sin autorización explícita del cliente origen.

**Quién enforza** estas reglas: el `MEMORY_ENGINE` a nivel de query (rechazo en lectura). Los especialistas confían en el engine y **no replican** la lógica de aislamiento, salvo verificaciones defensivas.

### 10.3 Patrones de lectura y escritura

**Lectura** (read-many):
- Cada especialista declara en el request los **scopes** que necesita (`permissions.scopes`).
- El `MEMORY_ENGINE` valida cada scope y devuelve solo lo autorizado.
- Si un scope se deniega, el engine devuelve `{ scope: "...", denied: true }` y el especialista continúa con lo disponible (status `partial`).

**Escritura** (write-controlled):
- Toda escritura es **propuesta** en `response.memory_writes_proposed` y aplicada por el TC (no por el especialista directamente).
- Escrituras críticas (artefactos firmados, transiciones de fase, valoraciones promovidas a oficiales) requieren confirmación humana L3.
- Escrituras rutinarias (logs, lineage, watermarks) se aplican automáticamente.

### 10.4 Aislamiento entre invocaciones

Una invocación NO transfiere automáticamente datos a la siguiente, ni dentro de la misma sesión. La **continuidad** se logra mediante:

- El TC pasa explícitamente `context.prior_findings` cuando es relevante.
- La memoria persistida vive en el `MEMORY_ENGINE`, no en variables de proceso del especialista.

Esto evita **fugas accidentales** entre invocaciones que tocan operaciones distintas en la misma sesión del usuario.

### 10.5 Sin acceso directo a audit cross-user (B2)

Repetido por su criticidad:

- Ningún especialista (ni el TC) consulta el audit log de **otros usuarios**.
- La detección de patrones cross-user se delega al **Risk & Compliance Service** (dependency external).
- El especialista puede recibir como input `risk_compliance_result` (consultado por el TC al servicio si el usuario tiene permisos). El especialista NO consulta el servicio directamente.

---

## 11. Trazabilidad y audit

### 11.1 Eventos canónicos del especialista

Añadidos a los eventos del TOS (`TRANSACTION_OS_SPEC §9`) y del TC (`TRANSACTION_COPILOT_SPEC §8.1`):

- `copilot.specialist_invoked` (qué especialista, qué capacidad, correlation_id).
- `copilot.specialist_response` (status, confidence, elapsed_ms, citation_count).
- `copilot.specialist_denied` (cuando el especialista rechaza por permisos).
- `copilot.specialist_timeout`.
- `copilot.specialist_low_confidence` (sub-tipo de response).
- `copilot.specialist_contradiction_with` (cuando un especialista marca contradicción con otro).
- `copilot.specialist_memory_read` (con scope autorizado).
- `copilot.specialist_memory_write_proposed` (propuesta de escritura).
- `copilot.specialist_capability_executed` (al cerrar la invocación con éxito).

### 11.2 Vinculación al audit del TC

Cada evento del especialista lleva:

- `correlation_id`: une invocaciones relacionadas en un mismo turno conversacional.
- `parent_event_id`: el evento de orquestación del TC que originó la invocación (`copilot.delegation_invoked` definido en `TRANSACTION_COPILOT_SPEC §8.1`).
- `session_id`: la conversación del usuario.
- `entity_type` + `entity_id` + `phase`: contexto del TOS.

Esto permite, dada cualquier consulta del usuario, **reconstruir el árbol de decisiones** entero: TC → especialistas invocados → memoria leída → propuestas de escritura → respuesta consolidada.

### 11.3 Diferenciación: acciones autónomas vs delegadas vs aprobadas

| Tipo | Definición | Cómo se distingue en audit |
|---|---|---|
| **Autónoma** | El especialista ejecuta sin pedir nada (L1/L2 puro: análisis, borrador) | `agentic_level: "L1"` o `"L2"`, `human_approval: false` (no aplica) |
| **Delegada** | El TC delega al especialista, pero la acción material la confirma el usuario después | `agentic_level: "L3-prepare"` (especialista) + `L3-execute` (TC tras confirmación) |
| **Aprobada** | El usuario autorizó previamente (L4); el especialista ejecuta | `agentic_level: "L4-execute"`, `authorization_id: "..."` referenciado |

### 11.4 Política de retención

Mismos criterios que el audit log general del TOS: **mínimo 10 años post-cierre** de la `Operation` cuando aplica. Para invocaciones que **no** se atan a Operation (Discovery Layer no convertido en Match), la retención es **3 años post-última actividad**. Detalle final en `MEMORY_ENGINE_SPEC`.

### 11.5 Risk & Compliance: destino de eventos relevantes

Eventos que **deben** propagarse al `Risk & Compliance Service` (cuando exista, dependency forward):

- `copilot.specialist_denied` (señal de intento de acceso indebido).
- `copilot.specialist_contradiction_with` (señal de inconsistencia).
- `match.solicited` con `actor.role = subscriber` que ha sido bloqueado N veces (señal de spam).
- Acciones del `arroba_team` accediendo a memoria/artefactos pre-firma.

El TC es el **emisor canónico** hacia Risk & Compliance; los especialistas no contactan al servicio directamente.

---

## 12. Modelo de identidad y voz única

### 12.1 Reglas inviolables (B6)

1. El usuario habla **siempre y solo** con Arroba Copilot.
2. Los 4 especialistas **nunca** producen texto destinado al usuario.
3. La respuesta al usuario **siempre** lleva una sola voz: la de Arroba Copilot (TC).
4. Solo en **modo debug administrativo** (no productivo) se muestra al usuario qué especialistas contribuyeron, y solo para `arroba_team` / `admin`.

### 12.2 Patrón de transparencia natural (B11)

El TC verbaliza acciones en **primera persona**:

- ✅ "He analizado los financieros de Kitchen Studio…"
- ✅ "He comparado la valoración con dos transacciones recientes del sector…"
- ✅ "He revisado las cláusulas del SPA y detecto un riesgo en…"
- ❌ "Company Advisor de Kitchen Studio dice…"
- ❌ "Valuation Copilot calcula…"
- ❌ "Advisor Copilot recomienda…"

**Menciones de dominio** cuando aportan claridad están **permitidas**, pero no son obligatorias:

- ✅ "En términos sectoriales, …"
- ✅ "Desde la perspectiva de valoración, …"
- ✅ "Legalmente, esta cláusula puede ser problemática porque…"

La diferencia es sutil pero importante: se menciona el **dominio**, no el **especialista**. El usuario no percibe entidades separadas; percibe **un único asistente que abarca varios dominios**.

### 12.3 Modo debug administrativo

Para `arroba_team` y `admin`, en interfaces específicas de auditoría/diagnóstico:

- Se puede mostrar la **traza interna** de una respuesta: qué especialistas contribuyeron, con qué `confidence`, en qué `elapsed_ms`, qué `findings` aportaron, qué `memory_writes_proposed` se generaron.
- Esta traza **NO** es accesible en el flujo conversacional normal del usuario.
- Se materializa típicamente como una vista "DevTools del Copilot" en el panel admin.

### 12.4 Evitar fragmentación de personalidad

Riesgos a controlar:

- **Cambios bruscos de registro**: si Company devuelve un draft formal y Valuation devuelve datos numéricos secos, el TC debe **unificar el registro** en su respuesta.
- **Contradicciones de tono**: si Company dice "empresa sólida" y Advisor dice "riesgo legal alto", el TC consolida con matices, no plantea conflicto al usuario sin contexto.
- **Pérdida de hilo**: si la conversación cambia de fase (T6 → T7), el TC mantiene continuidad ("hemos visto el Teaser, ahora te muestro el NDA…").

### 12.5 Política de menciones de dominio

Menciones de dominio recomendadas (no obligatorias):

| Cuando responde sobre… | El TC puede decir naturalmente… |
|---|---|
| Empresa | "He revisado la empresa…" / "En cuanto al activo…" / "Sobre Kitchen Studio…" |
| Sector | "En el sector…" / "Sectorialmente…" / "El benchmark sectorial…" |
| Valoración | "La valoración indica…" / "Desde el punto de vista de precio…" / "Calculando…" |
| Legal / Advisor | "Legalmente…" / "En términos contractuales…" / "Mirando el SPA…" |
| Proceso / TOS | "En esta fase…" / "Para avanzar al siguiente paso…" / "El proceso requiere…" |

### 12.6 Tensión con `TRANSACTION_COPILOT_SPEC §3.2-3.4`

`TRANSACTION_COPILOT_SPEC v1.0.0 §3.2` declara que cada respuesta lleva un campo `voice: "transaction" | "company" | …` y un campo `contributors: [...]`. Tras la decisión B6, este spec **reinterpreta** esos campos:

- `voice` y `contributors` siguen existiendo como **metadatos técnicos del payload** (útiles para audit, debug, telemetría).
- **NO se renderizan visualmente al usuario** en modo productivo.
- La capa visual (Design System) ignora estos campos por defecto; los puede usar **solo** en modo debug administrativo.

Este matiz queda registrado como `[OPEN-C2]` en §18: confirmar al cierre del Sprint 0 si el spec 0.2 se actualiza para reflejar este matiz o se deja como está (la decisión B6 prevalece de facto).

---

## 13. Colaboración entre copilots

### 13.1 Patrón canónico

```
Usuario  ─►  Arroba Copilot (TC)  ─►  Especialista A
                  │                        │
                  │                        ▼
                  │                  output estructurado
                  │                        │
                  ▼  ◄───────────────────  │
              Consolidación
                  │
                  │  (eventualmente, en paralelo o secuencial)
                  ▼
              Especialista B  ─►  output estructurado  ─►  TC consolida
                  │
                  ▼
                Usuario (con voz única del TC)
```

### 13.2 Los especialistas NO se invocan entre sí

**Regla absoluta**: ningún especialista puede invocar a otro especialista directamente. Toda colaboración **pasa por el TC**.

Razones:

- **Trazabilidad**: el TC es el punto central de audit; las invocaciones cruzadas sin TC son invisibles para el log.
- **Permisos**: el TC valida `permissions.scopes` antes de cada invocación; cross-invocaciones podrían saltarse esta capa.
- **Aislamiento**: el TC enforza least privilege; los especialistas no son aware del scope completo.
- **Voz única**: si Advisor invocara a Company y luego escribiera respuesta al usuario, fragmentaríamos la voz.

Si un especialista detecta que necesita input de otro, lo **declara** en `response.recommendations`:

```
"recommendations": [
  { "next_step": "consult_valuation_copilot", "rationale": "needed to justify price" }
]
```

El TC decide si invocar al otro especialista.

### 13.3 Orden de invocación cuando hay varios necesarios

El TC decide. Patrones típicos:

- **Secuencial**: A primero porque su output alimenta a B (ej. Company → Valuation: primero datos financieros, luego cálculo).
- **Paralelo**: A y B son independientes (ej. Market + Advisor en T10: precio + cláusulas).
- **Iterativo**: A, luego B reacciona a A, luego A reacciona a B (raro; típicamente solo en T12 negociación intensa).

Patrones documentados en `TRANSACTION_COPILOT_SPEC §4` (mapa por fase). Composiciones atípicas son válidas (§3.8) siempre que el TC las justifique en `copilot.delegation_invoked.rationale`.

### 13.4 Manejo de contradicciones

Cuando dos especialistas dan outputs contradictorios:

1. El TC **no silencia** ninguno; ambos `structured_output` quedan en memoria con su `confidence`.
2. El TC **prioriza por dominio**: en valoración prevalece Valuation; en análisis sectorial prevalece Market; en cláusulas legales prevalece Advisor; en datos de empresa prevalece Company.
3. Si la contradicción es **transversal** (cruza dominios), el TC presenta ambas perspectivas al usuario y solicita decisión humana.
4. El TC emite `copilot.contradiction_detected` y, si la contradicción se repite N veces en el mismo dominio, alerta al `Risk & Compliance Service` (señal de inconsistencia interna).

Detalle también en `TRANSACTION_COPILOT_SPEC §6.3`.

### 13.5 Memoria compartida vía Memory Engine

Los especialistas comparten información a través del `MEMORY_ENGINE`, no a través de mensajes directos. Mecanismo:

- Especialista A escribe en `memory_writes_proposed`.
- TC aplica al `MEMORY_ENGINE`.
- Especialista B, en una invocación posterior (misma sesión o futura), lee del `MEMORY_ENGINE`.

Esto:

- Mantiene el TC como punto central de auditoría.
- Permite que la memoria persistida sea reusable cross-invocación y cross-sesión.
- Aísla naturalmente cuando los scopes son incompatibles (B no tiene permiso al bucket donde A escribió).

---

## 14. Gestión de errores y degraded mode

### 14.1 Timeouts por especialista

| Especialista | `time_budget_ms` por defecto |
|---|---|
| Company | 8 000 |
| Market | 12 000 |
| Valuation | 10 000 (indicativa) / 30 000 (avanzada) |
| Advisor | 12 000 |

Valores configurables; pueden variar por capacidad concreta (ver §16).

### 14.2 Política de reintentos

- **1 reintento** automático si `status: timeout` o `status: error` técnico.
- **0 reintentos** si `status: denied` (permisos faltantes) — informar al usuario.
- **0 reintentos** si `status: low_confidence` — consolidar con disclaimer.
- **0 reintentos** si el especialista ya respondió `partial` con datos válidos.

### 14.3 Fallback determinista cuando un especialista no puede responder

Cada capacidad declara un **fallback determinista** cuando es posible. Ejemplos:

- **Company CAP-001 (análisis narrativo)**: fallback = mostrar los datos clave de la ficha sin narrativa generada. El TC lo verbaliza con plantilla determinista.
- **Valuation CAP-016 (valoración indicativa)**: ya es determinista (skill `value` no LLM); no requiere fallback.
- **Valuation CAP-017 (valoración avanzada)**: fallback = valoración indicativa + nota "valoración avanzada no disponible".
- **Market CAP-012 (matching cuantitativo)**: fallback = ordenamiento simple por compatibility numérica precalculada.
- **Advisor CAP-026 (asistencia en negociación)**: fallback = mostrar plantilla estándar + checklist sin razonamiento custom.

Cuando una capacidad **no tiene fallback razonable** (típicamente capacidades muy específicas de LLM), el TC informa al usuario con un mensaje canónico determinista.

### 14.4 Degraded mode global

Cuando un especialista entero no está disponible (servicio caído, presupuesto agotado, etc.):

- El TC **continúa** con los especialistas disponibles.
- Las capacidades que **dependen** del especialista caído entran en fallback determinista o se degradan a "no disponible".
- El TC **notifica al usuario** de la limitación temporal en su voz única ("Ahora mismo no puedo profundizar en valoración avanzada; te ofrezco la indicativa.").
- Se emite evento `copilot.specialist_unavailable` al audit log.

### 14.5 Política de circuit breaker

Si un especialista falla **N veces consecutivas** en una ventana de tiempo:

- Se abre **circuit breaker**: durante T minutos no se invoca; las capacidades degradan a fallback.
- El TC respeta el circuit breaker en sus decisiones de delegación.
- Tras T minutos, **half-open**: una invocación de prueba; si éxito, cierra el circuit; si error, prolonga.

Valores N y T configurables; defaults en `[OPEN-C9]`.

### 14.6 Errores no recuperables

Casos en los que el TC **NO puede continuar**:

- Memoria corrupta o inaccesible (`MEMORY_ENGINE` caído).
- Conflicto de permisos no resoluble (entidades ambiguas, sesión expirada).
- Restricciones de plan agotadas (cuotas — ver `MONETIZATION_SPEC`).

En estos casos: respuesta determinista al usuario explicando la situación + acción sugerida (refrescar sesión, contactar soporte, upgrade de plan).

---

## 15. Niveles agénticos por copilot

> Definiciones operativas de L1/L2/L3/L4 viven en `AGENTIC_LAYERS_SPEC` (0.5). Aquí se declara hasta qué nivel puede llegar cada especialista y por qué.

### 15.1 Resumen por copilot

| Copilot | L1 | L2 | L3 | L4 |
|---|---|---|---|---|
| Company | ✅ | ✅ | ✅ (marcar incoherencias, promover drafts) | ✅ (recordatorios watchlist, refresh automático) |
| Market | ✅ | ✅ | ✅ (re-screening, generar lote de Recomendaciones) | ✅ (refresh periódico Compatibility, alertas nuevas candidatas) |
| Valuation | ✅ | ✅ | ✅ (promover indicativa a oficial, escalar a avanzada) | ✅ (recálculo automático ante nuevos datos) |
| Advisor | ✅ | ✅ | ✅ (promover draft de cláusula, enviar Q&A) | ✅ (recordatorios DD, recordatorios integración) |

Todos los especialistas cubren L1-L4 en su dominio. **Las acciones materiales** (firma, transición de fase, cancelación) **NO** son L4 de ningún especialista: viven en el TC y siempre requieren L3 (`TRANSACTION_COPILOT_SPEC §7.3`).

### 15.2 Restricciones L3/L4 por fase

Una capacidad declara su nivel agéntico **máximo posible**, pero el TC **restringe** según fase:

- Fases 1-3 (Discovery temprano): típicamente L1/L2.
- Fase 4-5 (Screening/Matching): L1/L2/L3.
- Fases 6-15 (Discovery tardío + Transaction): L1/L2/L3, con L4 selectivo (11 DD, 14 Closing, 15 Integración).

Detalle en `TRANSACTION_OS_SPEC §11.4` (matriz por fase).

### 15.3 Autorización L4

L4 requiere **autorización previa registrada** del usuario:

```json
{
  "authorization_id": "auth_<uuid>",
  "scope": "company.{id}.watchlist_alerts",
  "actor": "user_<id>",
  "granted_at": "2026-06-25T...",
  "expires_at": "2026-12-25T...",
  "kill_switch": "revocable any time",
  "specialist_authorized": "company"
}
```

El especialista verifica la autorización antes de cada ejecución L4. Detalle operativo en `AGENTIC_LAYERS_SPEC §[autorizaciones L4]`.

---

## 16. Catálogo de capacidades L2

> Catálogo cerrado. Una nueva capacidad requiere actualizar este spec. Cada capacidad pertenece a **un dueño** (puede involucrar a otros como colaboradores).
>
> Notación de dueño: **C** = Company · **M** = Market · **V** = Valuation · **A** = Advisor · **TC** = Transaction Copilot. Cuando aparecen dos siglas, la primera es el dueño y la segunda colaborador.

### CAP-001 — Análisis narrativo de empresa

| Campo | Valor |
|---|---|
| **Dueño** | C |
| **Inputs** | `company_id`, `prior_findings` opcional |
| **Output** | `{ narrative_draft, insights[], signals[], confidence }` |
| **Memoria leída** | `company.{id}.*`, `user.{id}.history` |
| **Memoria escrita** | `company.{id}.narrative` (con lineage) |
| **Fases** | T1 principalmente; T8, T11 con contexto Operation |
| **Aprobación usuario** | NO (es L2 borrador) |

### CAP-002 — Generar Insights priorizados

| Campo | Valor |
|---|---|
| **Dueño** | C |
| **Inputs** | `company_id`, `priority_themes` opcional |
| **Output** | `{ insights[] con topic, summary, severity, confidence }` |
| **Memoria leída** | `company.{id}.*` |
| **Memoria escrita** | `company.{id}.insights` |
| **Fases** | T1, T8 |
| **Aprobación usuario** | NO |

### CAP-003 — Identificar señales relevantes

| Campo | Valor |
|---|---|
| **Dueño** | C |
| **Inputs** | `company_id`, `since_date` opcional |
| **Output** | `{ signals[] con kind, date, headline, severity }` |
| **Memoria leída** | `company.{id}.signals`, fuentes externas |
| **Memoria escrita** | `company.{id}.signals` (actualización) |
| **Fases** | T1, T8, T11, T15 |
| **Aprobación usuario** | NO |

### CAP-004 — Resumir documentación del Data Room

| Campo | Valor |
|---|---|
| **Dueño** | C |
| **Inputs** | `operation_id`, `document_id[]` o filtros por categoría |
| **Output** | `{ summary_per_document[], cross_doc_insights[], confidence }` |
| **Memoria leída** | `operation.{id}.documents`, `company.{id}.financials` |
| **Memoria escrita** | `operation.{id}.dd_summaries[]` |
| **Fases** | T11 |
| **Aprobación usuario** | NO |

### CAP-005 — Clasificar documentos

| Campo | Valor |
|---|---|
| **Dueño** | C |
| **Inputs** | `document_id` o `document_batch_id` |
| **Output** | `{ classified[] con kind, sub_category, confidence }` |
| **Memoria leída** | metadata del documento |
| **Memoria escrita** | `document.{id}.classification` |
| **Fases** | T8, T11 |
| **Aprobación usuario** | NO |

### CAP-006 — Detectar incoherencias en datos financieros

| Campo | Valor |
|---|---|
| **Dueño** | C (colaboración V) |
| **Inputs** | `company_id` o `operation_id` |
| **Output** | `{ inconsistencies[] con severity, source_a, source_b, rationale }` |
| **Memoria leída** | `company.{id}.financials`, comparables, IM, Data Room |
| **Memoria escrita** | `company.{id}.findings`, `operation.{id}.findings` |
| **Fases** | T1, T8, T11 |
| **Aprobación usuario** | NO para detección; SÍ (L3) para "marcar como validada" |

### CAP-007 — Redactar Teaser anonimizado

| Campo | Valor |
|---|---|
| **Dueño** | C (colaboración A) |
| **Inputs** | `company_id`, `opportunity_id`, `anonymization_level` |
| **Output** | `{ teaser_draft, anonymization_report, citations[] }` |
| **Memoria leída** | `company.{id}.public + private`, `opportunity.{id}` |
| **Memoria escrita** | `opportunity.{id}.teaser_drafts[]` |
| **Fases** | T6 |
| **Aprobación usuario** | SÍ (L3) para "aprobar Teaser para Marketplace" |

### CAP-008 — Preparar Information Memorandum (IM)

| Campo | Valor |
|---|---|
| **Dueño** | C (colaboración A) |
| **Inputs** | `operation_id`, `template_id`, `sections_requested[]` |
| **Output** | `{ im_draft estructurado por secciones, citations[], confidence }` |
| **Memoria leída** | `company.{id}.*`, `valuation.{id}.*` |
| **Memoria escrita** | `operation.{id}.documents` (IM draft) |
| **Fases** | T8 |
| **Aprobación usuario** | SÍ (L3) para "aprobar IM para liberación" |

### CAP-009 — Preparar respuestas Q&A

| Campo | Valor |
|---|---|
| **Dueño** | C (colaboración A) |
| **Inputs** | `operation_id`, `qa_question_id[]` |
| **Output** | `{ answers_drafted[], legal_warnings[] (vía A), confidence }` |
| **Memoria leída** | `operation.{id}.qa_log`, `company.{id}.*`, IM, Data Room |
| **Memoria escrita** | `operation.{id}.qa_log` (drafts) |
| **Fases** | T9 |
| **Aprobación usuario** | SÍ (L3) para enviar respuesta |

### CAP-010 — Análisis sectorial

| Campo | Valor |
|---|---|
| **Dueño** | M |
| **Inputs** | `sector_id`, `depth`, `timeframe` |
| **Output** | `{ sector_summary, trends[], benchmarks, competitive_dynamics }` |
| **Memoria leída** | `sector.{id}.*`, agregados de empresas en el sector |
| **Memoria escrita** | `sector.{id}.analyses[]` |
| **Fases** | T2, T3, T11 |
| **Aprobación usuario** | NO |

### CAP-011 — Análisis territorial

| Campo | Valor |
|---|---|
| **Dueño** | M |
| **Inputs** | `territory_id`, `depth` |
| **Output** | `{ territory_summary, economic_indicators, regulatory_notes }` |
| **Memoria leída** | `territory.{id}.*` |
| **Memoria escrita** | `territory.{id}.analyses[]` |
| **Fases** | T3, T4 |
| **Aprobación usuario** | NO |

### CAP-012 — Identificar compradores potenciales (matching cuantitativo)

| Campo | Valor |
|---|---|
| **Dueño** | M |
| **Inputs** | `opportunity_id`, `top_n`, `min_compatibility_score` |
| **Output** | `{ candidates[] con compatibility_score, reasons[], anti_reasons[] }` |
| **Memoria leída** | `opportunity.{id}`, agregados sectoriales, `company.{id}.public` |
| **Memoria escrita** | `opportunity.{id}.candidate_company_ids`, scoring lineage |
| **Fases** | T3, T4, T5 |
| **Aprobación usuario** | NO (genera, no aprueba) |

### CAP-013 — Preparar screenings profesionales

| Campo | Valor |
|---|---|
| **Dueño** | M (colaboración A) |
| **Inputs** | `opportunity_id`, `screening_template_id` (advisor playbook), `criteria_override` |
| **Output** | `{ screened_candidates[] con razones detalladas y validación advisor }` |
| **Memoria leída** | `opportunity.{id}`, `mandate.{id}`, `advisor.{id}.playbooks` |
| **Memoria escrita** | `opportunity.{id}.screenings[]` |
| **Fases** | T4 |
| **Aprobación usuario** | SÍ (L3) para guardar screening como referencia |

### CAP-014 — Tendencias y benchmarks sectoriales

| Campo | Valor |
|---|---|
| **Dueño** | M |
| **Inputs** | `sector_id`, `timeframe`, `benchmark_kinds[]` (multiples, growth, EBITDA %, etc.) |
| **Output** | `{ benchmarks, time_series[], peer_set }` |
| **Memoria leída** | `sector.{id}.*` |
| **Memoria escrita** | `sector.{id}.benchmarks` |
| **Fases** | T2, T10, T11 |
| **Aprobación usuario** | NO |

### CAP-015 — Generar Recomendaciones (sistema → usuario)

| Campo | Valor |
|---|---|
| **Dueño** | M |
| **Inputs** | `user_id`, `entity_context`, `count` |
| **Output** | `{ recommendations[] con razón y next_step sugerido }` |
| **Memoria leída** | `user.{id}.history`, `opportunity.{id}`, agregados |
| **Memoria escrita** | `opportunity.{id}.recommendations`, `user.{id}.recent_recommendations` |
| **Fases** | T5 (principalmente), también contextual en T3-T4 |
| **Aprobación usuario** | NO para generar; el usuario decide accionar |

### CAP-016 — Preparar valoración indicativa

| Campo | Valor |
|---|---|
| **Dueño** | V |
| **Inputs** | `company_id`, `method` (`revenue_multiple` / `ebitda_multiple` / `dcf` / `comparable_transactions`), `params` opcionales |
| **Output** | `{ central_value, band, method, sensitivities, comparables[], confidence }` |
| **Memoria leída** | `company.{id}.financials`, `sector.{id}.benchmarks`, `valuation.{id}.previous[]` |
| **Memoria escrita** | `valuation.{id}` (nueva entidad), `company.{id}.valuations[]` |
| **Fases** | T2; también T10, T12 con contexto Operation |
| **Aprobación usuario** | NO para calcular; SÍ (L3) para promover a "oficial" |

### CAP-017 — Preparar valoración avanzada

| Campo | Valor |
|---|---|
| **Dueño** | V |
| **Inputs** | `company_id`, `methods[]` (multi-método), `assumptions`, `permission_token` (plan / paywall) |
| **Output** | `{ multi_method_results[], reconciliation, sensitivity_analysis, expert_notes }` |
| **Memoria leída** | superset de CAP-016 + datos privados con permiso |
| **Memoria escrita** | `valuation.{id}` (avanzada), `company.{id}.valuations[]` |
| **Fases** | T2, T10, T12 |
| **Aprobación usuario** | SÍ (L3) para encargar (puede tener coste — `MONETIZATION_SPEC`) |

### CAP-018 — Generar comparables de transacciones

| Campo | Valor |
|---|---|
| **Dueño** | V |
| **Inputs** | `company_id`, `lookback_period`, `geo_scope`, `size_scope` |
| **Output** | `{ comparables[] con multiples, transaction_date, deal_structure }` |
| **Memoria leída** | base de comparables sectoriales, transacciones públicas |
| **Memoria escrita** | `valuation.{id}.comparables[]` |
| **Fases** | T2, T10, T12 |
| **Aprobación usuario** | NO |

### CAP-019 — Proponer estructuras de precio y earn-out

| Campo | Valor |
|---|---|
| **Dueño** | V (colaboración A) |
| **Inputs** | `operation_id`, `valuation_id`, `risk_profile` |
| **Output** | `{ structures[] con base + earn_out + triggers + escrow + warranties }` |
| **Memoria leída** | `operation.{id}`, `valuation.{id}`, `advisor.{id}.playbooks` |
| **Memoria escrita** | `operation.{id}.price_structures[]` |
| **Fases** | T10, T12 |
| **Aprobación usuario** | SÍ (L3) para llevar a contraparte |

### CAP-020 — Analizar sensibilidades

| Campo | Valor |
|---|---|
| **Dueño** | V |
| **Inputs** | `valuation_id`, `variables[]` (revenue, EBITDA, multiple, discount rate, etc.), `deltas[]` |
| **Output** | `{ sensitivity_table, tornado_chart_data, breakeven_points }` |
| **Memoria leída** | `valuation.{id}` |
| **Memoria escrita** | `valuation.{id}.sensitivities[]` |
| **Fases** | T2, T10, T12 |
| **Aprobación usuario** | NO |

### CAP-021 — Preparar oferta indicativa / LOI / NBO

| Campo | Valor |
|---|---|
| **Dueño** | A (colaboración V) |
| **Inputs** | `operation_id`, `valuation_id`, `template_id`, `terms` |
| **Output** | `{ loi_draft, terms_extracted, risk_flags[], valuation_consistency_check }` |
| **Memoria leída** | `operation.{id}`, `valuation.{id}`, `advisor.{id}.playbooks` |
| **Memoria escrita** | `operation.{id}.documents` (IOI/LOI draft) |
| **Fases** | T10 |
| **Aprobación usuario** | SÍ (L3) para presentar oferta |

### CAP-022 — Detectar riesgos de negociación

| Campo | Valor |
|---|---|
| **Dueño** | A (colaboración TC) |
| **Inputs** | `operation_id`, `current_drafts[]` |
| **Output** | `{ risks[] con kind, severity, mitigations, contractual_anchors[] }` |
| **Memoria leída** | `operation.{id}.*`, plantillas legales, casuística histórica |
| **Memoria escrita** | `operation.{id}.findings` (legal) |
| **Fases** | T10, T12 |
| **Aprobación usuario** | NO para detectar; SÍ (L3) para "marcar riesgo como aceptado" |

### CAP-023 — Detectar documentación faltante en Data Room

| Campo | Valor |
|---|---|
| **Dueño** | A (colaboración TC) |
| **Inputs** | `operation_id`, `industry_template` |
| **Output** | `{ missing_documents[] con kind, severity, deadline_recommended }` |
| **Memoria leída** | `operation.{id}.dataroom_index`, plantillas DD por sector |
| **Memoria escrita** | `operation.{id}.dd_gap_analysis` |
| **Fases** | T11 |
| **Aprobación usuario** | NO (detección); SÍ (L3) para notificar a Seller |

### CAP-024 — Generar preguntas de Due Diligence sectorial

| Campo | Valor |
|---|---|
| **Dueño** | A |
| **Inputs** | `operation_id`, `sector_id`, `dd_areas[]` |
| **Output** | `{ questions_by_category[] con priority, rationale }` |
| **Memoria leída** | `operation.{id}`, plantillas DD sector, `mandate.{id}` |
| **Memoria escrita** | `operation.{id}.qa_log` (drafts) |
| **Fases** | T11 (principalmente), T9 |
| **Aprobación usuario** | SÍ (L3) para enviar preguntas al Seller |

### CAP-025 — Elaborar informes dinámicos de riesgos

| Campo | Valor |
|---|---|
| **Dueño** | A |
| **Inputs** | `operation_id`, `risk_categories[]`, `as_of_date` |
| **Output** | `{ risk_report estructurado por categoría con findings + mitigations + heat_map }` |
| **Memoria leída** | `operation.{id}.*`, `findings[]`, `dd_summaries[]` |
| **Memoria escrita** | `operation.{id}.risk_reports[]` |
| **Fases** | T11, T12 |
| **Aprobación usuario** | NO |

### CAP-026 — Asistir en negociación

| Campo | Valor |
|---|---|
| **Dueño** | A (colaboración TC) |
| **Inputs** | `operation_id`, `clause_id` o `topic` |
| **Output** | `{ counter_clause_drafts[], precedents[], leverage_analysis }` |
| **Memoria leída** | `operation.{id}.spa_drafts[]`, `advisor.{id}.playbooks` |
| **Memoria escrita** | `operation.{id}.spa_drafts[]` (nueva versión) |
| **Fases** | T12 |
| **Aprobación usuario** | SÍ (L3) para versionar el draft |

### CAP-027 — Comparar versiones de contratos

| Campo | Valor |
|---|---|
| **Dueño** | A |
| **Inputs** | `document_id_from`, `document_id_to` |
| **Output** | `{ diffs[] estructurados por cláusula con severity_change }` |
| **Memoria leída** | versiones de los documentos |
| **Memoria escrita** | `operation.{id}.comparator_results[]` |
| **Fases** | T12, T13 |
| **Aprobación usuario** | NO |

### CAP-028 — Generar checklists de cierre

| Campo | Valor |
|---|---|
| **Dueño** | A (colaboración TC) |
| **Inputs** | `operation_id`, `spa_id` |
| **Output** | `{ checklist[] con condiciones suspensivas + owners + deadlines }` |
| **Memoria leída** | `operation.{id}.documents` (SPA) |
| **Memoria escrita** | `operation.{id}.closing_checklist` |
| **Fases** | T13, T14 |
| **Aprobación usuario** | NO (es preparación); SÍ (L3) para marcar hitos cumplidos |

### CAP-029 — Asistir en planificación de integración post-deal

| Campo | Valor |
|---|---|
| **Dueño** | A (colaboración M, TC) |
| **Inputs** | `operation_id`, `integration_themes[]` (HR, sistemas, gobernanza, sinergias) |
| **Output** | `{ integration_plan_draft con hitos, owners, dependencias, KPIs }` |
| **Memoria leída** | `operation.{id}.documents` (SPA), `company.{id}.*`, `sector.{id}.benchmarks` |
| **Memoria escrita** | `operation.{id}.documents` (Integration plan draft) |
| **Fases** | T13 (preparación), T15 (ejecución/ajustes) |
| **Aprobación usuario** | SÍ (L3) para promover a plan oficial |

### 16.30 Resumen del catálogo

29 capacidades L2 distribuidas:

- **Company**: 9 capacidades (CAP-001 a CAP-009)
- **Market**: 6 capacidades (CAP-010 a CAP-015)
- **Valuation**: 5 capacidades (CAP-016 a CAP-020)
- **Advisor**: 9 capacidades (CAP-021 a CAP-029)

Total: 29. Algunas tienen co-propiedad cruzada (Company × Advisor; Valuation × Advisor; Market × Advisor).

---

## 17. Integración forward con otros specs

### 17.1 De `MEMORY_ENGINE_SPEC` (0.4) necesito

| Necesidad | Detalle |
|---|---|
| Esquema canónico de los 9 tipos de memoria | empresa, valoración, oportunidad, match, operación, usuario, advisor, compartida, audit |
| **Modelo de aislamiento literal (B3)** | Implementación de las 4 reglas de §3.3 + §10.2 |
| Contratos de **scope-based access** | `permissions.scopes` validados a nivel de query |
| Política de **lineage** | Cómo se traza el origen de cada dato |
| Política de **retención** | 10 años post-Operation; 3 años post-actividad para datos no vinculados a Operation |
| Política de **borrado** | GDPR vs retención legal |
| Esquema de **memoria de sector / territorio / advisor / mandato** | Estos tipos están referenciados en este spec pero todavía no formalizados |
| Modelo de **memoria compartida entre copilots** | Cómo se construye, expira, audita |
| **Idempotencia** del cache por `correlation_id` | TTL del cache (default 5 minutos) |

### 17.2 De `AGENTIC_LAYERS_SPEC` (0.5) necesito

| Necesidad | Detalle |
|---|---|
| Definición operativa de L1/L2/L3/L4 | Schema exacto del ciclo "propuesta → confirmación → ejecución" para L3, autorización para L4 |
| Estructura de **autorizaciones L4** | `authorization_id`, scope, expiration, kill_switch, specialist_authorized |
| Política de **escalado** entre niveles | Cómo un usuario pasa de "todo L1" a habilitar L3/L4 |
| Política de **cuotas** | Cuántas acciones L3/L4 permitidas por plan |
| Modo `debug` administrativo para `arroba_team`/`admin` | Trazas de las invocaciones |

### 17.3 De `MONETIZATION_SPEC` (0.6) necesito

| Necesidad | Detalle |
|---|---|
| Qué capacidades L2 consumen **crédito** | Catálogo cap × coste estimado |
| Diferenciación por **plan** | Qué especialistas / capacidades están disponibles en cada plan |
| **Eventos económicos** que el TC notifica | Más allá del `closing.declared` que devenga Success Fee |
| Cobro de **valoración avanzada** | CAP-017 típicamente tiene coste; cómo se gatilla |
| **Revenue share con advisors** | Cuando un Advisor opera con Mandate, parte del fee al cliente |

### 17.4 Lagunas externas detectadas (fuera del Sprint 0)

- **Risk & Compliance Service spec** (P0, dependency forward) — sin él, no se puede materializar la detección cross-user.
- **Catálogo de herramientas concretas** (data sources, APIs externas): probablemente vivirá en un `DATA_LAYER_SPEC` o similar.
- **ADVISOR_LAYER_SPEC** (P1) — necesario para detallar memoria de advisor, plantillas, métricas, revenue share.
- **MARKETPLACE_SPEC** (P1) — necesario para detallar matching cuantitativo de CAP-012, CAP-015.
- **DATAROOM_SPEC** (P1) — necesario para detallar CAP-004, CAP-005, CAP-023.
- **NDA_SPEC**, **LOI_SPEC**, **CIS_SPEC** (P0/P1) — necesarios para plantillas legales que usan CAP-007, CAP-008, CAP-021.

---

## 18. Open Questions

> Numeración C1-Cn (C = Spec 0.3). Si el canon no resuelve algo, queda `[OPEN]` sin inventar respuesta.

| ID | Pregunta | Propuesta de este spec | Estado |
|---|---|---|---|
| **C1** | Reinterpretación de `ARROBA_PHILOSOPHY.md §12` ("cada entidad puede disponer de un agente especializado") como "página activa contexto, especialista vive en dominio" | La página activa **contexto** y **prioridad de invocación** del especialista relevante, no una identidad conversacional separada (§2.7). Confirmar al cierre del Sprint 0 si se actualiza `ARROBA_PHILOSOPHY.md` para reflejar el matiz | **ABIERTO** — confirmar al cierre Sprint 0 |
| **C2** | Tensión con `TRANSACTION_COPILOT_SPEC §3.2-3.4` (campos `voice` y `contributors` visibles) vs B6 (voz única, no atribución visible) | `voice` y `contributors` son **metadatos técnicos**, NO se renderizan al usuario salvo en modo debug administrativo (§12.6). Confirmar si se actualiza el spec 0.2 para reflejar esto explícitamente o se deja como está (B6 prevalece de facto) | **ABIERTO** — confirmar al cierre Sprint 0 |
| **C3** | Acceso de Company Copilot a datos privados de Empresas no compradas en el plan del usuario | Propuesta: solo si `master_companies.visibility=public` o si el usuario pagó por enrich. Detalle final en `MONETIZATION_SPEC` | **ABIERTO** — se cierra en 0.6 |
| **C4** | Uso de agregados anonimizados cross-organización por Market Copilot | Propuesta: solo agregados k-anonimizados y aprobados por `Risk & Compliance Service`. Detalle en `MEMORY_ENGINE_SPEC` (0.4) | **ABIERTO** — se cierra en 0.4 |
| **C5** | Visibilidad de la valoración indicativa al Buyer pre-NDA | Propuesta: NO. Solo el rango opcional que el Seller decida exponer en el Teaser (decisión consistente con `TRANSACTION_OS_SPEC §8`) | **ABIERTO** — confirmar |
| **C6** | Advisor Copilot operando **sin Advisor humano** asignado | Propuesta: SÍ a L1/L2 (asistencia + borradores); NO a L3/L4 que requieran vinculación contractual. Detalle final en `ADVISOR_LAYER_SPEC` (laguna P1 fuera del Sprint 0) | **ABIERTO** — pendiente spec dedicado |
| **C7** | Memoria de Advisor cross-mandato: on dentro del mismo cliente; off entre clientes distintos del mismo advisor sin opt-in | Propuesta: confirmar consistente con regla §3.3 y formalizar en `MEMORY_ENGINE_SPEC` | **ABIERTO** — se cierra en 0.4 |
| **C8** | TTL del cache de idempotencia por `correlation_id` | Propuesta: 5 minutos default; configurable por capacidad | **ABIERTO** — operativo |
| **C9** | Parámetros N (fallos consecutivos) y T (ventana) del circuit breaker | Propuesta: N=3, T=5 minutos default; configurable por especialista | **ABIERTO** — operativo |
| **C10** | Risk & Compliance Service: cuándo se especifica | Spec dedicado fuera del Sprint 0; dependencia P0. ¿Crear en Sprint 1 o más tarde? Decisión de roadmap | **ABIERTO** — decisión de roadmap |
| **C11** | Reorganización del enum `Role` para incluir `arroba_team` | Confirmar en `ENTITY_MODEL.md` al cierre del Sprint 0 (ya prevista en `TRANSACTION_OS_SPEC §14`). Aquí solo se refleja la decisión | **ABIERTO** — propagación a 0.1 + ENTITY_MODEL |
| **C12** | ¿`narrative_draft` en `structured_output` es lícito o rompe el principio B6? | Decisión interpretativa: es **insumo** para el TC, no salida final. El TC puede reformularlo, resumirlo o ignorarlo. NO viola B6 mientras el TC sea el único que verbaliza al usuario. | **ABIERTO** — confirmación interpretativa |
| **C13** | ¿El TC puede invocar a un especialista **sin que el usuario haya preguntado** (proactividad)? | Sí, dentro del modo proactivo descrito en `TRANSACTION_COPILOT_SPEC §10.1`. Los especialistas no inician proactividad; el TC sí | **ABIERTO** — confirmación interpretativa |
| **C14** | Audit retention para invocaciones que no se atan a Operation | Propuesta: 3 años post-última actividad. Detalle en `MEMORY_ENGINE_SPEC` | **ABIERTO** — se cierra en 0.4 |
| **C15** | Especialistas devolviendo `narrative_draft` en idioma del usuario | Propuesta: SÍ; el TC pasa `locale` en `context`. No forma parte de los campos obligatorios del request en §9.1 hoy; añadir o no | **ABIERTO** — decisión de operación |

### Lagunas estructurales a resolver en specs 0.4-0.6

**Para `MEMORY_ENGINE_SPEC` (0.4)**:

- Formalización de los 9 tipos de memoria con esquema (campos, índices, lineage).
- Implementación operativa de las 4 reglas de aislamiento de B3.
- Esquemas de `memoria de sector`, `territorio`, `advisor`, `mandato` (este spec los referencia pero no los detalla).
- Policy de retención (10 años Operations; 3 años no-Operation).
- Mecanismo de **memoria compartida entre copilots** (cómo se construye, expira, audita).
- Política GDPR / borrado.
- Caching de idempotencia.

**Para `AGENTIC_LAYERS_SPEC` (0.5)**:

- Definición operativa exacta de L1/L2/L3/L4.
- Schema de **autorizaciones L4** (scope, expiration, kill_switch, specialist).
- Política de escalado entre niveles.
- Cuotas por plan (forward a 0.6).

**Para `MONETIZATION_SPEC` (0.6)**:

- Catálogo capacidad × coste.
- Planes (subscriber / corporate / investor / advisor) con qué especialistas / capacidades incluyen.
- Eventos económicos detectables por TC.
- Revenue share con advisors.
- Boundary Stripe.

**Dependencias externas (fuera Sprint 0)**:

- Risk & Compliance Service spec (P0).
- ADVISOR_LAYER_SPEC (P1).
- MARKETPLACE_SPEC (P1).
- DATAROOM_SPEC (P1).
- NDA_SPEC, LOI_SPEC, CIS_SPEC (P0/P1).

---

> **Fin del documento.** — `v1.0.0` — pendiente de revisión humana.
