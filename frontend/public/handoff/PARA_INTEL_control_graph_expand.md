# PARA INTEL · Solicitud REQ · Vecindario de nodo del grafo de control (click-to-expand)

> **Emisor**: Arroba.com (equipo de producto).
> **Destinatario**: Equipo Intelligence Engine.
> **Fecha**: 2026-08-13.
> **Prioridad Intel**: **P2 · posición #2** en la cola (tras Punto 1 = nombres reales del `control_graph`).
> **Bloqueante para deploy actual**: **NO**. La interacción en frontend está montada con hook defensivo + placeholder "Vecindario en preparación". Cuando Intel entregue el `expand[]` por nodo, la UI lo consume sin refactor.

---

## 1. Contexto de producto

Tras la entrega del `control_graph` v2 (`shareholders/subsidiaries/graph{nodes,edges}/distribution/ubo/narrative`), Arroba ha cableado la sección **Propiedad** con tres vistas (Árbol / Distribución / Grafo) reproduciendo el mockup canónico `ficha-empresa-f01.html` **1:1**.

La vista **Grafo** implementa un motor SVG interactivo (`interactiveGraph`) con **pan + zoom + hover-highlight + drag-de-nodo + click-to-expand**. El comportamiento **click-to-expand** requiere que cada nodo tipo `shareholder` / `ubo` publique el **vecindario de participaciones cruzadas** de esa entidad: al hacer click sobre un accionista, el grafo despliega las **otras empresas** donde ese accionista aparece como accionista o UBO, con animación radial `rdIn` (0.7 s cubic-bezier).

**Estado actual**: los nodos del payload `control_graph.graph.nodes[]` no traen la clave `expand[]`. Al hacer click, el frontend muestra un placeholder textual _"Vecindario en preparación · en cuanto Intel publique el mapa de participaciones cruzadas del nodo seleccionado, se desplegarán aquí sus conexiones"_ y **no fabrica datos** (R15).

Este REQ pide a Intel que **pueble `expand[]` en cada nodo tipo `shareholder` / `ubo`** del `control_graph.graph.nodes`, con el shape idéntico al que Arroba ya consume desde el mockup canónico.

---

## 2. Petición formal · shape propuesto

### 2.1 · Ruta preferida (aditivo, no rompe contrato v2)

**Opción A · integrada en `control_graph.graph.nodes[]`** (preferida por Arroba):

```json
{
  "control_graph": {
    "available": true,
    "company": { "master_id": "mc_36c100bcee4a", "name": "LABORATORIOS SERVIER" },
    "graph": {
      "nodes": [
        {
          "id": "sh:1",
          "label": "Accionista principal",
          "kind": "shareholder",
          "expand": [
            {
              "id": "sh:1::participacion:1",
              "label": "OTRA COMPAÑÍA 1",
              "r": 15,
              "color": "#7aa0e0",
              "edgeColor": "#FF5757",
              "edgeLabel": "62%",
              "dashed": false
            },
            {
              "id": "sh:1::participacion:2",
              "label": "OTRA COMPAÑÍA 2",
              "r": 15,
              "color": "#7aa0e0",
              "edgeColor": "#8a827a",
              "edgeLabel": "18%",
              "dashed": true
            }
          ]
        },
        { "id": "sh:2", "label": "Accionista minoritario", "kind": "shareholder", "expand": [] },
        { "id": "ubo:1", "label": "Beneficiario último", "kind": "ubo", "expand": [ /* ... */ ] }
      ],
      "edges": [ /* ... */ ]
    },
    "engine_version": "arroba-company-ficha-v1"
  }
}
```

**Opción B · endpoint dedicado** (aceptable si `expand` bloatea `/ficha`):

```
GET /api/v1/company/{cif}/control-graph/neighborhood?node_id={id}&authenticated={true|false}
  → {
      "anchored_at": "sh:1",
      "expand": [ /* mismo shape 2.2 */ ],
      "engine_version": "arroba-control-graph-neighborhood-v1"
    }
```

**Decisión Arroba**: Opción A es más eficiente (una sola call `/ficha`) pero **infla el payload** si el vecindario es grande. Opción B es lazy pero requiere una call adicional. Preferimos **Opción A con truncado al top-N** (§4.a).

### 2.2 · Objeto `expand[i]` · campos requeridos

| Campo | Tipo | Requerido | Descripción |
|---|---|:-:|---|
| `id` | `string` | ✅ | Identificador único de la participación cruzada. Formato sugerido: `{parent_node_id}::{cif_participada}` o `{parent_node_id}::{i}` si no hay CIF resoluble. |
| `label` | `string` | ✅ | Nombre de la compañía participada (anonimizado por Intel si aplica, siguiendo la política DPD del payload principal). |
| `r` | `number` | ⚠️ | Radio del nodo hijo en el SVG. Default `15`. Intel puede omitir; frontend aplica default. |
| `color` | `string` | ⚠️ | Color de relleno del nodo (hex). Default `#7aa0e0` (azul suave para "participada de tercero"). Intel puede omitir. |
| `edgeColor` | `string` | ⚠️ | Color de la arista padre→hijo. Default `#FF5757` (rojo brand). |
| `edgeLabel` | `string \| null` | ⚠️ | Label numérico sobre la arista (`"62%"` para porcentaje de control). Null-safe. |
| `dashed` | `boolean` | ⚠️ | Arista discontinua (`stroke-dasharray: 4 4`) si `true`. Útil para distinguir participaciones indirectas o minoritarias. Default `false`. |

### 2.3 · Ejemplo completo (Servier · autenticado)

```json
{
  "control_graph": {
    "graph": {
      "nodes": [
        {
          "id": "mc_36c100bcee4a",
          "label": "LABORATORIOS SERVIER",
          "kind": "company"
        },
        {
          "id": "sh:1",
          "label": "Accionista principal",
          "kind": "shareholder",
          "expand": [
            { "id": "sh:1::inv:1", "label": "Sanidad Ibérica SL",   "edgeLabel": "45%", "color": "#7aa0e0" },
            { "id": "sh:1::inv:2", "label": "Cardio Devices SA",    "edgeLabel": "22%", "color": "#7aa0e0" },
            { "id": "sh:1::inv:3", "label": "BioTech Ventures BV",  "edgeLabel": "8%",  "color": "#cbb", "dashed": true }
          ]
        },
        {
          "id": "sh:2",
          "label": "Accionista minoritario",
          "kind": "shareholder",
          "expand": []
        },
        {
          "id": "ubo:1",
          "label": "Beneficiario último",
          "kind": "ubo",
          "expand": [
            { "id": "ubo:1::inv:1", "label": "Familiy Holding Trust", "edgeLabel": "control único", "color": "#0C0C0E" }
          ]
        }
      ]
    }
  }
}
```

Arroba renderiza esto **sin modificar el frontend**: el motor `interactiveGraph` ya lee `n.expand` y despliega los nodos hijos con animación `rdIn` (0.7s cubic-bezier(.3,.7,.3,1)) — comportamiento portado literalmente del mockup canónico.

---

## 3. Comportamiento esperado y edge cases

- **Nodo sin vecindario** (`expand: []`): al click, el nodo muestra brevemente su tooltip pero **no despliega nada**. Frontend NO muestra placeholder — el estado "expand vacío" es válido.
- **Nodo sin `expand` key**: al click, frontend muestra placeholder "Vecindario en preparación" (estado actual). Arroba interpreta `expand === undefined` como "Intel no lo emite todavía"; `expand === []` como "Intel lo emite pero no hay conexiones".
- **DPD (crítico)**:
  - En **anon** (`authenticated=false` o sesión inválida) el backend Arroba nulifica `control_graph` completo (queda sólo el `summary` agregado). El `expand[]` **no viaja al frontend** en anon; el placeholder queda inactivo.
  - En **auth**, Intel debe entregar `expand[]` con los mismos criterios de DPD que ya aplica al payload principal (nombres anonimizados a `"Compañía participada 1"`, `"Empresa afiliada A"`, etc. si Intel aplica anonimización general).
- **Truncado**: si el vecindario excede N compañías, Intel entrega **top-N por relevancia** (control mayoritario primero, luego por % descendente) y añade un flag `truncated: true` a nivel de `expand[]`. Arroba muestra un placeholder textual "+ N conexiones adicionales" cuando `truncated` es `true` (§4.d).
- **Cross-CIF idempotencia**: si el accionista `sh:1` es a su vez el nodo central de otra ficha `X`, `x.control_graph.graph.nodes["mc_..."].expand` debe contener la MISMA lista de participaciones que aparece al expandirlo desde otra ficha `Y`. Simetría requerida.

---

## 4. Sub-preguntas abiertas (respuesta requerida por Intel)

### 4.a · Saltos (depth)

¿El `expand[]` incluye **1 salto** (participaciones directas del accionista) o **N saltos configurable** (`?depth=1|2|3`)?

**Preferencia Arroba**: **1 salto por defecto**, con parámetro opcional `?depth=N` en Opción B si Intel lo soporta.

### 4.b · Cache-key idempotente

¿El resultado de `expand[]` es idempotente para un mismo `node_id` durante la vigencia del payload principal (TTL 24 h)? ¿O varía con timestamp?

**Preferencia Arroba**: **idempotente durante el TTL del `/ficha`**. Cache-key: `master_id + node_id + authenticated`. Cuando cambia el TTL principal, invalida también `expand[]`.

### 4.c · DPD del vecindario en anon

Confirmado que Arroba nulifica `control_graph` completo en anon (política HARDENING-016). El `expand[]` **nunca llega al frontend** en anon. Sin embargo, si Intel expone Opción B (endpoint dedicado) con `authenticated=false`, ¿qué debe devolver?

**Preferencia Arroba**: Opción B con `authenticated=false` devuelve HTTP 200 con `{ available: false, engine_version }`. Cero PII, cero fabricación.

### 4.d · Truncado por relevancia

Cuando el vecindario excede top-N (Arroba propone N=8), ¿Intel devuelve `truncated: true` + los 8 top por control, o `truncated: true` + una mezcla balanceada por sector? ¿Ordena por % descendente?

**Preferencia Arroba**: **top-8 por % de control descendente** + `truncated: true` cuando quede > 8. Si Intel prefiere otro criterio, documentarlo en `engine_version`.

### 4.e · Co-entrega con Punto 1 (nombres reales)

Punto 1 de la cola Intel (nombres reales del `control_graph`) sigue pendiente. Arroba actualmente muestra `"Accionista principal"`, `"Beneficiario último"`, `"Participada 1"`. Cuando Intel entregue nombres reales, el `expand[]` también debe traer nombres reales de las participaciones cruzadas.

**Preferencia Arroba**: co-entrega Punto 1 + este REQ en el mismo deploy Intel.

---

## 5. Prioridad en la cola Intel (según directiva usuario Arroba 2026-08-13)

| Posición | REQ | Estado |
|:-:|---|---|
| #1 | Nombres reales `control_graph` (accionistas / participadas / UBO) | pendiente |
| **#2** | **`control_graph_expand` (este REQ)** | **emitido 2026-08-13** |
| #3 | `labels_es_batch` (6 familias · 3/6 entregado, 3/6 pendientes) | parcial |
| #4 | `comparables` T5-T10 (peers nominales) | emitido, sigue en cola |
| #5 | Sector & Roll-up E6/E7 | aparcado |

---

## 6. Impacto para Arroba

- **Frontend**: el motor `interactiveGraph` ya está desplegado (HARDENING-018). Consumir `expand[]` cuando Intel lo emita **no requiere refactor**. El placeholder actual (`"Vecindario en preparación"`) se retira automáticamente cuando `n.expand.length > 0`.
- **Backend**: passthrough puro (`HARDENING-014` ya establece `control_graph` como `dict | None`). Sin cambios en `arroba-company-ficha-v1`.
- **UX**: habilita la **exploración por click** del grafo, palanca visual del canon "de acciones a control efectivo".

---

## 7. Formato de entrega esperado

- **Fase 1 (obligatoria)**: `expand[]` en `graph.nodes[i]` para todo nodo `kind: shareholder | ubo`. Campos mínimos: `id`, `label`. Resto con defaults Arroba.
- **Fase 2 (recomendada)**: `edgeLabel` (`"{pct}%"`) + `dashed` (para indirectas / minoritarias).
- **Fase 3 (opcional)**: `depth > 1` con `?depth=2` (Opción B endpoint dedicado).

---

**REQ `control_graph_expand` emitido oficialmente el 2026-08-13.** Arroba queda a la espera de acuse de recibo y estimación de sprint por parte de Intel.

_Referencias cruzadas_:
- `HARDENING-018` (`CompanyFichaLayoutV2.tsx::InteractiveControlGraph`) — motor `interactiveGraph` portado del mockup, listo para `expand[]`.
- `PARA_INTEL_labels_es_batch.md`, `PARA_INTEL_comparables_T5_T10.md`, `PARA_INTEL_market.md`, `PARA_INTEL_shareholder_type.md` (REQs paralelos ya emitidos).
- `ficha-empresa-f01.html` (`interactiveGraph(container, {nodes, edges, ...})` línea 1729) — mockup canónico fuente.
