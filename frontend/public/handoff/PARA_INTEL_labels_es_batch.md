# PARA INTEL · Solicitud REQ · Batch de **labels ES** de la ficha CF

> **Emisor**: Arroba.com (equipo de producto).
> **Destinatario**: Equipo Intelligence Engine.
> **Fecha**: 2026-08-13.
> **Prioridad Intel**: **P2 · posición #2 en la cola de Intel** (tras `control_graph` de Propiedad · máxima prioridad).
> **Bloqueante para deploy actual**: **NO**. Doc-only, se procesa en el mismo lote de idioma que los `narrative` de la Fase B del canon.

---

## 1. Contexto de producto

Tras la aplicación de la **Fase A del `CANON_NARRATIVA_CF_FICHA.md`** (14 sustituciones de copy Beta ya en preview, 2026-08-13), la ficha de empresa (`/companies/{cif}`) ha eliminado los tecnicismos Beta más visibles. Queda un núcleo de **enums crudos y flags booleanos que hoy se traducen en el frontend con tablas locales `Record<string, string>`** — mecanismo que viola el §2 del canon ("prohibido traducir enums en front") y bloquea la **Fase B del canon** (retirar rows técnicos y sustituirlos por prosa CF).

Este REQ agrupa **6 familias de labels ES** que Intel debe emitir dentro del payload `/ficha` (Opción A · aditivo, patrón `HARDENING-012` de passthrough en Arroba) para que el frontend pueda **prescindir por completo** de sus mapas locales de traducción y quedar alineado con el canon.

Este REQ va **en paralelo** a la Fase B del canon (`sector.narrative`, `geo.narrative`, `concentration.narrative`, `position.narrative`). El acuerdo con el usuario Arroba es:

> _"Prosa CF (`narrative`) + labels ES batch, un solo deploy Intel"._

Sin este batch, Arroba no puede aplicar Fase B (dejaría rows en `<Empty/>` con labels crudos → viola R15 + degrada UX).

---

## 2. Petición formal · shape propuesto

### 2.1 Regla de emisión (opción preferida)

Cada label ES se emite como **campo hermano** del token técnico dentro del mismo objeto:

```json
{ "severity": "high", "signal_label": "Relevancia alta" }
```

**Justificación**:
- Preserva idempotencia del token técnico (`severity` sigue disponible para lógica interna, tests, telemetría).
- Elimina joins/diccionarios locales en frontend.
- Compatible con `arroba-*-v1` sin bump semver (aditivo puro).

**Alternativa (aceptable si Intel lo prefiere)**: diccionario global a nivel de sección:

```json
{
  "signals": {
    "items": [ /* ... */ ],
    "labels_es": { "severity": {"high": "Relevancia alta", "medium": "Relevancia media", "low": "Relevancia baja"} }
  }
}
```

**Decisión pedida**: sub-pregunta abierta §4.a.

### 2.2 Versionado del vocabulario

Intel debe emitir un campo `labels_engine_version` a nivel top-level (`"labels_engine_version": "arroba-labels-es-v1"`) o bien un `labels_version` dentro de cada bloque. Ante cambios en el vocabulario (renombrar `"Relevancia alta"` a `"Prioridad alta"`, añadir enum nuevo, etc.), Intel debe **bumpear versión** para que Arroba pueda invalidar caché y notificar a producto.

Sub-pregunta abierta §4.c.

---

## 3. Contrato · 6 familias de labels

### 3.1 · `signal_label` (en `signals.items[*]`)

**Reemplaza**: en Beta hoy, cada item muestra `"{severityLabel}"` seguido de `" · confianza {N}%"` crudo (Anexo A canon, ya sustituido a `"Relevancia {severity.toLowerCase()}"` en Fase A). Intel debe emitir la prosa canónica final para retirar el mapa local.

**Contrato**:
```json
{
  "signals": {
    "items": [
      {
        "id": "growth_momentum_positive",
        "severity": "high",
        "confidence": 0.87,
        "signal_label": "Relevancia alta",
        "signal_narrative": "Crecimiento sostenido con confianza alta del motor.",
        "primary_driver": "revenue_growth",
        "dimensions": { "financial": 0.9, "commercial": 0.8, "operativa": 0.7 }
      }
    ]
  }
}
```

**Enum permitido**:
- `severity: "high"` → `signal_label: "Relevancia alta"`
- `severity: "medium"` → `signal_label: "Relevancia media"`
- `severity: "low"` → `signal_label: "Relevancia baja"`
- `severity: null | "unknown"` → `signal_label: null` (Arroba renderiza row sin badge de relevancia).

**Regla `confidence`**: **NO** emitir `"confianza {N}%"` crudo. La `confidence` sigue disponible como número [0,1] para lógica interna y agregación en `signal_narrative`. Ej. `"Crecimiento sostenido con confianza alta del motor."` (Intel decide glose: `≥0.75` = "confianza alta", `0.5–0.74` = "confianza moderada", `<0.5` = omitir).

### 3.2 · `primary_driver_label` (en `signals.items[*]` y en `hero.primary_driver`)

**Reemplaza**: hoy hero muestra `"Impulsor principal · activity"` (enum crudo). Intel debe emitir CF-friendly.

**Contrato**:
```json
{
  "hero": {
    "primary_driver": "revenue_growth_sustained",
    "primary_driver_label": "Crecimiento sostenido de ingresos"
  }
}
```

**Enum requerido (mínimo, ampliable)**:

| Token técnico | `primary_driver_label` |
|---|---|
| `revenue_growth_sustained` | Crecimiento sostenido de ingresos |
| `revenue_contraction` | Contracción de ingresos |
| `margin_expansion` | Expansión de márgenes |
| `margin_contraction` | Contracción de márgenes |
| `leverage_increase` | Incremento de apalancamiento |
| `leverage_reduction` | Reducción de apalancamiento |
| `working_capital_stress` | Tensión de circulante |
| `working_capital_release` | Liberación de circulante |
| `activity_expansion` | Expansión de la actividad |
| `activity_contraction` | Contracción de la actividad |
| `capex_intensification` | Intensificación de capex |
| `capex_relaxation` | Relajación de capex |
| `equity_reinforcement` | Refuerzo de fondos propios |
| `equity_erosion` | Erosión de fondos propios |

**Fallback**: si Intel encuentra un driver fuera del enum, `primary_driver_label` debe traerse en prosa CF **libre** (nunca token técnico crudo). Ej. `"Concentración de clientes"`, `"Reestructuración accionarial"`. Sin `null` salvo que `primary_driver` también sea `null`.

**Semántica**: `primary_driver_label` es un **título corto** de 2-5 palabras. Cualquier explicación adicional va en `hero.primary_driver_narrative` (fase 2 · prosa CF larga).

### 3.3 · `concentration_label_es` (en `market.concentration` y `ownership.concentration`)

**Reemplaza**: hoy `market.concentration.hhi_band` y `ownership.concentration.hhi_band` devuelven enums (`"low"`, `"moderate"`, `"high"`, `"very_high"`). Frontend los traduce localmente.

**Contrato**:
```json
{
  "market": {
    "concentration": {
      "hhi": 0.184,
      "hhi_band": "moderate",
      "concentration_label_es": "Concentración moderada",
      "narrative": "Sector con concentración moderada según Herfindahl 0,18..."
    }
  },
  "ownership": {
    "concentration": {
      "top1_share": 0.62,
      "hhi": 0.44,
      "hhi_band": "high",
      "concentration_label_es": "Concentración alta (accionista mayoritario)"
    }
  }
}
```

**Enum requerido**:

| `hhi_band` | `concentration_label_es` (mercado) | `concentration_label_es` (ownership) |
|---|---|---|
| `low` | Estructura dispersa | Accionariado disperso |
| `moderate` | Concentración moderada | Concentración moderada |
| `high` | Concentración alta | Concentración alta (accionista mayoritario) |
| `very_high` | Concentración muy alta | Control mayoritario |
| `unknown` / `null` | — (Arroba muestra `<Empty/>`) | — (idem) |

**Regla**: los enums de `market.concentration.hhi_band` y `ownership.concentration.hhi_band` **son independientes** (universos distintos) y tienen labels distintos (contexto sectorial vs accionarial). Intel emite ambos con el mismo campo `concentration_label_es` en su contexto respectivo.

### 3.4 · `cash_flow_labels_es` (en `finances.cash_flow`)

**Reemplaza**: hoy la sección Cash Flow del tab `Finanzas` está en `<Pending/>` porque Intel aún no expone `cashflow` top-level. Cuando lo emita (bloque paralelo · REQ separado si aplica), debe venir con labels ES para las filas.

**Contrato**:
```json
{
  "finances": {
    "cash_flow": {
      "available": true,
      "operating": 21800000,
      "investing": -12400000,
      "financing": -4200000,
      "net_change": 5200000,
      "fcf": 9400000,
      "labels_es": {
        "operating": "Flujo de explotación",
        "investing": "Flujo de inversión",
        "financing": "Flujo de financiación",
        "net_change": "Variación neta de tesorería",
        "fcf": "Free Cash Flow"
      },
      "narrative": "Actividad operativa genera 21,8 M€, capex neto de 12,4 M€ y..."
    }
  }
}
```

**Enum requerido (fijo)**:

| Clave técnica | `cash_flow_labels_es` |
|---|---|
| `operating` | Flujo de explotación |
| `investing` | Flujo de inversión |
| `financing` | Flujo de financiación |
| `net_change` | Variación neta de tesorería |
| `fcf` | Free Cash Flow |

**Regla**: `"Free Cash Flow"` se emite **sin traducir** (uso canónico CF en España). Intel debe respetar la mayúscula y el anglicismo. Sub-pregunta §4.e.

### 3.5 · `governance_role_labels_es` (en `governance.officers[*]` y `governance.board[*]`)

**Reemplaza**: hoy el mapa local `_GOVERNANCE_ROLE_ES` en `CompanyFichaLayoutV2.tsx` traduce `director` → `"Consejero"`, etc. Intel debe emitir el label ES nativo.

**Contrato**:
```json
{
  "governance": {
    "officers": [
      {
        "role": "chairman",
        "role_label_es": "Presidente",
        "name_masked": "J*** P***",
        "since": "2020-04-15"
      },
      {
        "role": "ceo",
        "role_label_es": "Consejero Delegado",
        "name_masked": "M*** L***",
        "since": "2022-11-01"
      }
    ]
  }
}
```

**Enum requerido (mínimo)**:

| `role` (token) | `role_label_es` |
|---|---|
| `chairman` | Presidente |
| `vice_chairman` | Vicepresidente |
| `ceo` | Consejero Delegado |
| `coo` | Director de Operaciones |
| `cfo` | Director Financiero |
| `secretary` | Secretario del Consejo |
| `vice_secretary` | Vicesecretario del Consejo |
| `director` | Consejero |
| `independent_director` | Consejero Independiente |
| `executive_director` | Consejero Ejecutivo |
| `non_executive_director` | Consejero Externo |
| `dominical_director` | Consejero Dominical |
| `sole_administrator` | Administrador Único |
| `joint_administrator` | Administrador Solidario |
| `joint_several_administrator` | Administrador Mancomunado |
| `liquidator` | Liquidador |

**Regla DPD (crítica)**: `role_label_es` **NO expone PII adicional**. Es traducción pura del enum `role`. Debe emitirse **igual para anon y auth**. Se sigue respetando la política actual de aplicar `name_masked` para anon y `name` completo para auth (fuera del alcance de este REQ).

**Fallback**: si Intel encuentra un rol fuera del enum, `role_label_es` viene en prosa CF libre (ej. `"Apoderado General"`) — nunca token técnico crudo.

### 3.6 · `is_listed_label_es` (en `identity`)

**Reemplaza**: hoy el frontend traduce `identity.is_listed: true | false | null` con `fmtYesNo` local ("Sí" / "No" / "—").

**Contrato**:
```json
{
  "identity": {
    "is_listed": false,
    "is_listed_label_es": "No cotizada",
    "listing_market": null,
    "listing_market_label_es": null
  }
}
```

**Enum requerido**:

| `is_listed` | `is_listed_label_es` |
|---|---|
| `true` | Cotizada |
| `false` | No cotizada |
| `null` (desconocido) | En preparación |

**Bonus (opcional, no bloqueante)**: si Intel puede resolver `listing_market` (`"MEXICO_BMV"`, `"MADRID_IBEX"`, `"NYSE"`, etc.), emitir `listing_market_label_es` en prosa CF (ej. `"Cotizada en Bolsa de Madrid (Mercado Continuo)"`). Si no, `null`.

---

## 4. Sub-preguntas abiertas (respuesta requerida por Intel)

### 4.a · Formato de emisión

¿Los labels se emiten como **campo hermano del token** (`{"severity": "high", "signal_label": "Relevancia alta"}`) o como **diccionario aparte a nivel de sección** (`{"signals": {"items": [...], "labels_es": {"severity": {...}}}}`)?

**Preferencia Arroba**: **campo hermano**. Justificación: idempotencia individual del item + no requiere lookup adicional en frontend.

### 4.b · Cobertura contra el test set

¿Intel se compromete a validar los **6 grupos de labels** contra los **5 CIFs del test set** del usuario Arroba (mantenido internamente por producto Arroba · lista compartida bajo petición) antes de dar el REQ por entregado? En concreto:

- ¿Cada uno de los 5 CIFs recibe `signal_label` en todos sus `signals.items[*]`?
- ¿Cada uno recibe `primary_driver_label` en `hero.primary_driver`?
- ¿`concentration_label_es` está poblado en al menos uno de los 5 CIFs (probable en Servier B28184687 según ejercicios anteriores)?
- ¿`cash_flow_labels_es` disponible cuando `cash_flow.available: true`?
- ¿`role_label_es` cubre todos los roles observados en los 5 CIFs?
- ¿`is_listed_label_es` en los 5 CIFs (todos deberían ser `"No cotizada"` — Arroba lo confirma tras la entrega)?

### 4.c · Idempotencia y versionado del vocabulario

Si Intel actualiza el enum (añade `role: "coo_regional"`, renombra `"Relevancia alta"` a `"Prioridad alta"`, etc.), ¿bumpea `labels_engine_version` (semver: `arroba-labels-es-v1` → `arroba-labels-es-v2`)?

**Regla propuesta por Arroba**:
- MINOR bump (`v1.0 → v1.1`): añadir enum nuevo, sin romper existentes.
- MAJOR bump (`v1 → v2`): renombrar label existente o cambiar semántica.
- Arroba invalida caché local en cada MAJOR bump; en MINOR bump se conserva compat.

### 4.d · Encaje con Fase B del canon narrativa

¿Los `narrative` (Mercado/Rankings/Concentración/Position · Fase B canon) se entregan en el **mismo deploy** que estos labels, o en **dos entregas separadas**?

**Preferencia Arroba**: **mismo deploy** (así se aplica Fase B canon completa en un solo commit frontend, sin `<Empty/>` intermedios que degraden UX).

### 4.e · Anglicismos y estilo

¿Intel respeta las decisiones de estilo canon CF español?
- `"Free Cash Flow"` sin traducir (anglicismo canónico).
- `"EBITDA"`, `"CAGR"`, `"YoY"` sin traducir.
- El resto en español CF nativo (`"Consejero Delegado"`, no `"CEO"`).

### 4.f · Rendimiento (payload size)

Añadir 6 familias de labels puede aumentar el tamaño de `/ficha` en aprox. 1-3 KB (dependiendo del número de items en `signals` y `governance`). ¿Es aceptable para Intel? Alternativa: gzip lo absorbe fácilmente (~5x compresión sobre labels ES repetidos), así que Arroba lo asume como no-issue salvo que Intel indique lo contrario.

---

## 5. Prioridad en la cola Intel (según directiva usuario Arroba 2026-08-13)

| Posición | REQ | Estado |
|:-:|---|---|
| #1 | `control_graph` (Propiedad · grafo de control accionarial) | pendiente de emisión formal por Arroba (máxima prioridad) |
| **#2** | **`labels_es_batch` (este REQ)** | **emitido 2026-08-13** |
| #3 | `comparables` T5-T10 (`PARA_INTEL_comparables_T5_T10.md`) | emitido 2026-08-13 |
| #4 | `narrative` Mercado/Rankings/Concentración/Position (Fase B canon) | pendiente REQ formal específico si Intel lo requiere (previa `PARA_INTEL_market.md` cubre el bloque) |
| #5 | Sector & Roll-up E6/E7 | aparcado por Arroba, no emitido |

---

## 6. Checklist post-entrega (para Arroba · Fase B canon)

Cuando Intel entregue este batch **junto con** los `narrative` (§4.d = "mismo deploy"), Arroba debe:

- [ ] Consumir `narrative` **y** retirar rows enum **en el mismo commit** frontend (regla: nunca dejar `<Empty/>` intermedio · Fase B canon).
- [ ] Re-verificar visual y funcionalmente contra los **5 CIFs del test set** del usuario.
- [ ] Cerrar los `TODO CANON CF Fase B` sembrados en `MercadoSectorPanel`, `MercadoGeoPanel`, `MercadoConcentrationPanel`, `MercadoPositionPanel` en `CompanyFichaLayoutV2.tsx`.
- [ ] Retirar los mapas locales de traducción en el layout:
  - `SIG_SEVERITY_LABEL` → sustituir por `signal_label` del payload.
  - `SIG_DIM_LABEL` → sustituir por labels emitidos por Intel (fuera del alcance de este REQ · pendiente §Fase 2).
  - `_GOVERNANCE_ROLE_ES` → sustituir por `role_label_es` del payload.
  - `fmtYesNo` en `is_listed` → sustituir por `is_listed_label_es`.
- [ ] Aplicar `labels_engine_version` como header/log en cada request para trazabilidad (opcional pero recomendado).
- [ ] Actualizar `INVENTARIO_STRINGS_FICHA.md` marcando las filas afectadas como **CANON CF Fase 2 · COMPLETADA**.

---

## 7. Impacto para Arroba

- **Frontend**: se retiran ~7 mapas locales `Record<string, string>` en `CompanyFichaLayoutV2.tsx` (~40 líneas menos de código + cumplimiento estricto del §2 canon).
- **Backend**: aditivo passthrough (patrón `HARDENING-012` ya validado). Sin cambios en `arroba-company-ficha-v1` salvo bump de MINOR si `labels_engine_version` se añade al schema principal.
- **UX**: habilita cierre completo de Fase B canon (retirar rows técnicos de Mercado/Rankings) sin `<Empty/>` intermedios.
- **Deploy actual**: **NO bloqueante**. Este REQ se procesa en paralelo al deploy del bundle actual.

---

## 8. Formato de entrega esperado

- **Fase 1 (obligatoria)**: 6 familias `signal_label`, `primary_driver_label`, `concentration_label_es`, `cash_flow_labels_es` (cuando `cash_flow.available`), `role_label_es`, `is_listed_label_es` · **campo hermano** del token técnico · **cobertura 100% de los 5 CIFs test set**.
- **Fase 2 (recomendada)**: `labels_engine_version` a nivel top-level o por bloque, para versionado.
- **Fase 3 (opcional)**: `listing_market_label_es` cuando `identity.listing_market` esté poblado.

---

**REQ `labels_es_batch` emitido oficialmente el 2026-08-13.** Arroba queda a la espera de acuse de recibo y estimación de sprint objetivo por parte de Intel.

_Referencias cruzadas_:
- `CANON_NARRATIVA_CF_FICHA.md` §2 (prohibición de traducir enums en front), §5.bis (Fase B narrative + labels co-entrega).
- `INVENTARIO_STRINGS_FICHA.md` Fase 2 (strings pendientes de migrar a Intel).
- `PARA_INTEL_market.md`, `PARA_INTEL_comparables_T5_T10.md`, `PARA_INTEL_shareholder_type.md` (REQs paralelos ya emitidos).
