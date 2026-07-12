# ARROBA — Principios Arquitectónicos (v1)

## Rol
Este documento es la **única Source of Truth** para los principios y reglas arquitectónicas de arroba.com.

A partir de su creación, ningún otro documento del canon puede redefinir estos principios ni estas reglas. Solo pueden referenciarlos.

Si un documento del canon histórico contiene una definición previa, se conserva por trazabilidad pero deja de ser autoritativa. La versión válida es la de este archivo.

## Estructura
Este documento contiene 3 principios filosóficos y 3 reglas operativas. Ambos bloques son vinculantes.

---

## Principios

### P1 · Explainability First

- **Definición canónica**: toda unidad de inteligencia presentada al usuario debe ser explicable dentro del mismo contexto de interacción. Origen, método, confianza y límites deben poder consultarse sin abandonar la vista.
- **Propósito**: eliminar la caja negra. El usuario nunca debe verse obligado a aceptar un número, una recomendación o una señal sin poder auditar de dónde viene.
- **Implicaciones**:
  - Cualquier valor de inteligencia (score, valoración, señal, comparable) debe llevar asociada su explicación accesible en el punto de consumo (typ. Tooltip u overlay contextual).
  - Los estados de datos ausentes deben etiquetarse como Unavailable, nunca ocultarse ni sustituirse por estimaciones fabricadas.
  - La UI debe reservar espacio explícito para insights y su explicación.
- **Ejemplos de aplicación**:
  - Tooltip explainability-first del Design System (ver `DESIGN_SYSTEM.md §2.12`).
  - Bloque de anomalías financieras con etiqueta de método y confianza.
- **Referencias**: `DESIGN_SYSTEM.md`, `ARROBA_B6F_DESIGN_PROPOSAL_v1.md` (directriz D1).

### P2 · Intelligence over Data

- **Definición canónica**: *Los datos nunca constituyen el producto. El producto es la inteligencia generada a partir de ellos. Los datos actúan como evidencia, contexto y trazabilidad de dicha inteligencia.*
- **Propósito**: fijar la jerarquía correcta entre dato e inteligencia. arroba.com no es un explorador de datos; es un motor de decisiones.
- **Implicaciones**:
  - La UI debe priorizar señales, recomendaciones y explicaciones sobre tablas crudas.
  - Los datos brutos aparecen como soporte (drill-down, evidencia, contexto), no como pantalla principal.
  - La ausencia de dato no puede degradar el producto a un explorador vacío: la inteligencia debe seguir presente aunque limitada.
- **Ejemplos de aplicación**:
  - Bloques de insights encima de tablas financieras.
  - Directriz D3 del brief B.6.f (espacio dedicado a insights).
- **Referencias**: `ARROBA_PHILOSOPHY.md §12`, `ARROBA_B6F_DESIGN_PROPOSAL_v1.md` (directriz D3).

### P3 · Zero Coupling

- **Definición canónica**: arroba.com no depende estructuralmente del esquema interno de ningún proveedor externo. Todas las integraciones cruzan un contrato canónico `arroba-*-v1` propiedad de arroba, con adaptadores que mapean en un único punto.
- **Propósito**: proteger el producto de cambios de esquema, cambios de proveedor y bloqueos por caja negra externa.
- **Implicaciones**:
  - Ni el frontend ni el backend consumen directamente el shape crudo del proveedor externo. Se consume un modelo canónico mapeado en `intelligence_layer/canonical_ui_adapter.py`.
  - Cualquier proveedor nuevo (Agency Tool, CIS, otros) debe someterse a este contrato antes de entrar en el runtime.
  - La ausencia o inconsistencia del proveedor externo debe ser absorbida por el adaptador, no por la UI.
- **Ejemplos de aplicación**:
  - Contratos `arroba-financial-v1`, `arroba-semantic-v1`, `arroba-identity-v1`.
  - `intelligence_layer/interfaces/canonical_ui.py` como frontera.
- **Referencias**: `ARROBA_CONSUMER_INTEGRATION_PLAN_v1.md`, `DESIGN_SYSTEM.md` (contratos `*Section`).

---

## Reglas operativas

### R11 · Visual Governance

- **Definición canónica**: ninguna implementación visual puede iniciarse sin aprobación explícita del usuario del diseño o mockup correspondiente.
- **Propósito**: prevenir desviaciones estéticas o estructurales que erosionen la coherencia del producto.
- **Implicaciones**:
  - El freeze visual es por defecto ON. Requiere lift explícito del usuario para arrancar una fase de implementación frontend.
  - Ningún componente visual entra en producción sin pasar por el ciclo diseño → aprobación → implementación.
- **Ejemplos de aplicación**:
  - Freeze visual sobre B.6.f hasta aprobación del mockup canónico.
- **Referencias**: `ARROBA_CONSUMER_INTEGRATION_PLAN_v1.md §0`, `CANONICAL_SCREENS.md`.

### R12 · Nunca `/master/*`

- **Definición canónica**: arroba.com no invoca directamente los endpoints `/api/v1/master/*` del proveedor externo Agency Tool. La resolución de identidad se hace pasando el CIF a los endpoints estándar consumidos vía `intelligence_layer`.
- **Propósito**: evitar el acoplamiento a un layout interno del proveedor y respetar Zero Coupling.
- **Implicaciones**:
  - El BFF proxy `intelligence_layer` es la única frontera con el proveedor.
  - Los 404s del proveedor no se ocultan con datos fabricados; se reflejan como Unavailable.
- **Referencias**: `ARROBA_CONSUMER_INTEGRATION_PLAN_v1.md §0.2`, `ARROBA_INTEGRATION_PACK_v1.md`.

### R13 · Source of Truth única

- **Definición canónica**: cada pantalla del producto tiene un único archivo de referencia que actúa como Source of Truth visual y estructural. No puede haber dos archivos activos que compitan por representar la misma pantalla.
- **Propósito**: eliminar la posibilidad de regresiones visuales por convivencia de layouts.
- **Implicaciones**:
  - `CANONICAL_SCREENS.md` mantiene el registro autoritativo de pantallas activas.
  - Los layouts obsoletos se mueven a `/app/_legacy/` y un guard automático (`__tests__/canonical_screens_guard.test.ts`) impide su importación.
  - Layouts de una columna quedan explícitamente prohibidos para la ficha de empresa; ver `ARROBA_UI_VISUAL_REFERENCES.md`.
- **Referencias**: `CANONICAL_SCREENS.md`, `ARROBA_UI_VISUAL_REFERENCES.md`.

### R14 · Un COMP = un componente React

- **Definición canónica**: cada componente identificado en el ACC con un COMP-XXXX corresponde a exactamente un componente React en la implementación. No se permiten componentes React que agrupen múltiples COMP-XXXX, ni componentes React sin COMP-ID asociado en la Ficha de Empresa.
- **Propósito**: garantizar trazabilidad 1:1 entre canon funcional y código, y permitir cobertura medible del ACC.
- **Implicaciones**:
  - Cada componente React debe declarar en un JSDoc o comentario cabecera su COMP-ID.
  - Los tests deben verificar la cobertura del ACC por COMP-ID.
  - Un componente marcado como BLOCKED en el ACC debe existir en el árbol React como stub (renderizando `UnavailableBlock`) con su COMP-ID declarado.
- **Referencias**: `sources/empresa_v1/ACC_v0.1.md`.

---

### R15 · Datos reales o Unavailable

- **Definición canónica** (cita literal del usuario, aprobada durante F0.2 · 2026-07-06):
  > "El histórico financiero de arroba.com debe estar formado EXCLUSIVAMENTE por datos reales. QUEDA EXPRESAMENTE PROHIBIDO: generar ejercicios ilustrativos; interpolar ejercicios inexistentes; estimar cifras para completar series; simular históricos con fines visuales.
  > Cuando la información histórica sea incompleta: mostrar únicamente los ejercicios realmente disponibles; indicar claramente la ausencia de información; degradar la visualización cuando sea necesario; mantener siempre la trazabilidad de la fuente."
- **Propósito**: eliminar cualquier dato ficticio en la Ficha de Empresa. Un número mostrado por arroba.com debe poder verificarse contra Agency Tool o una URL pública, con timestamp y proveniencia explícitos. Todo lo que no sea trazable se degrada a `UnavailableBlock`.
- **Aplicabilidad**: Cuenta de Resultados, Balance, Cash Flow, Ratios, Gráficos de evolución, Comparativas históricas, cualquier bloque expuesto por el `intelligence_layer` que muestre magnitudes numéricas o narrativa derivada.
- **Implicaciones**:
  - Todo campo mostrado en la UI debe tener `source` y `updated_at` propagados desde el proveedor de datos (Agency Tool o fuente pública).
  - Cuando una serie histórica esté incompleta, se renderizan únicamente los ejercicios realmente disponibles. Los años ausentes se marcan explícitamente ("Sin datos para 20XX") o se omiten con nota visible; **nunca** se interpolan.
  - Cuando un bloque completo carezca de datos, se degrada a `UnavailableBlock` con motivo explícito y con tooltip apuntando a la última fecha de verificación de la fuente.
  - Prohibido generar narrativa Copilot (interpretaciones, recomendaciones, valoraciones) que no venga del propio Agency Tool o de una fuente pública referenciable. Cualquier necesidad de LLM propio para narrativa debe escalarse al usuario antes de implementarla; nunca se emite texto "que suena a Copilot" sin dato subyacente.
  - Aplica también a los datos de mocks: los mocks sólo pueden contener datos reales verificables (bien del Agency Tool en modo `real`, bien ingeridos manualmente desde fuentes públicas con URL registrada). Ningún mock puede completar huecos con cifras generadas.
- **Referencias**:
  - Brief F0.2 (2026-07-06 · autorización del sprint).
  - Contradicción C14.4 del ZIP resuelta por el usuario.
- **Trazabilidad obligatoria**: `data_source`, `source_url` (cuando exista) y `updated_at` deben persistirse desde el proveedor hasta el DOM. Los adaptadores canónicos (`canonical_ui_adapter.py`) propagan estos campos sin transformarlos.

---

## Precedencia
Cuando exista conflicto entre este documento y cualquier otro del canon histórico, prevalece este documento. La jerarquía global del canon está definida en `ARROBA_CANON.md`.

## Reglas operativas F0.2 (añadidos 2026-07-12 · desbloqueo oficial)

Las siguientes reglas quedan fijadas como operativas del sprint F0.2. Complementan P3 (Zero Coupling) y R12 (nunca `/master/*`). Prevalecen sobre cualquier documento operativo previo del sprint.

- **F0.2-OP1 · CIF es el identificador de entrada para Arroba**. El usuario final introduce y ve CIFs. Nunca se le pide ni se le expone `master_id` en URLs, breadcrumbs, o cualquier superficie visible.
- **F0.2-OP2 · `POST /api/v2/company-intelligence/resolve` es el mecanismo oficial de resolución CIF → `master_id`**. Cualquier flujo que requiera `master_id` para llamadas posteriores debe pasar por este endpoint. El proxy Arroba lo expone Zero Coupling; el shape crudo del proveedor no llega ni al backend consumidor ni al frontend.
- **F0.2-OP3 · `master_id` es identificador interno estable**. Se usa exclusivamente para cache (`intelligence_cache`), navegación programática interna y llamadas post-resolve. Nunca aparece al usuario final ni en URLs públicas.
- **F0.2-OP4 · Arroba no usa endpoints administrativos ni JWT**. Solo `X-API-Key` sobre contratos públicos del Intelligence Engine (reafirma R12).
- **F0.2-OP5 · Arroba no accede directamente al Data Layer**. Toda información pasa por el Intelligence Engine (reafirma P3).
- **F0.2-OP6 · Contratos `arroba.v1` y `arroba.v2` CONGELADOS durante F0.2**. Ninguna modificación en `sources/empresa_v1/arroba.v2.json` ni en los contratos internos canónicos (`arroba-identity-v2`, `arroba-financial-v1`, `arroba-semantic-v1`) hasta cierre oficial de F0.2. Ampliaciones/nuevos campos requieren aprobación explícita del usuario.

Referencias operativas:
- Desbloqueo oficial documentado en `sources/empresa_v1/F0_2_SMOKE_20260712_03.md`.
- Caso canónico validado en producción: `A87803862` (TOTALENERGIES · `mc_80e03f1e1627`).

---

## Historial
- v1 · 2026-07-06 · creación inicial tras decisión canónica del usuario durante fase de análisis ARROBA Matching.
- v1.1 · 2026-07-06 · **R15 añadida** tras autorización de Sprint F0.2 (Finanzas) — resuelve contradicción C14.4 (histórico ilustrativo).
- v1.2 · 2026-07-12 · Añadidas reglas operativas F0.2-OP1..OP6 tras desbloqueo oficial · caso canónico A87803862 validado · contratos v1+v2 congelados durante F0.2.
