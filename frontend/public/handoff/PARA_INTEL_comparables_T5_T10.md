# PARA INTEL · Solicitud REQ · Motor de comparables nominales T5-10 para la sección **Comparativa multi-empresa**

> **Emisor**: Arroba.com (equipo de producto).
> **Destinatario**: Equipo Intelligence Engine.
> **Fecha**: 2026-08-13.
> **Prioridad**: **P2 · bloqueante para el desarrollo de la sección Comparativa multi-empresa**. Arroba no puede cablear la sección hasta armonización del contrato.
> **Sprint objetivo sugerido**: próximo hueco de trabajo sobre el agregador `/company/{cif}/ficha` o endpoint dedicado nuevo.

---

## 1. Contexto de producto

La ficha de empresa (`/companies/{cif}`) contempla una sección **Comparativa** en el menú lateral (id `comparativa`, entre "Rankings" y "Cambios relevantes"). Su propósito es responder — en el mismo lenguaje Corporate Finance del resto de la ficha — a la pregunta:

> _"¿A qué otras compañías se parece esta empresa, y cómo se posiciona frente a ellas en las palancas económicas relevantes (facturación, EBITDA, deuda neta, plantilla)?"_

Hoy, la sección se muestra como `<Pending label="Comparativa" />` porque **no existe en el payload de Intel** ningún bloque que entregue una lista **nominal** (con `master_id` / `cif` / `name`) de compañías comparables a la empresa en cuestión, con métricas alineadas para tabla y para visualización.

El bloque existente `finances.comparables` de `financial-intelligence/analyze` sólo entrega **estadísticas agregadas** (medianas, percentiles del universo comparable) sin identificar a los miembros del universo — útil para Rankings, insuficiente para Comparativa nominal.

---

## 2. Petición formal · shape propuesto

Se solicita que Intel entregue, para cada CIF consultado, un bloque nominal con las **5 a 10 compañías comparables más cercanas** por sector y tamaño, junto con las métricas financieras necesarias para renderizar la sección.

### 2.1 Ruta preferida (aditivo, no rompe contratos)

**Opción A · integrada en `/company/{cif}/ficha`** (preferida por Arroba):

```json
{
  "cif": "B28184687",
  "master_id": "mc_36c100bcee4a",
  "engine_version": "arroba-company-ficha-v1",
  "finances": { "...": "..." },
  "market": { "...": "..." },
  "peers": {
    "available": true,
    "cnae_level": "group",
    "size_band": { "revenue_range_pct": [0.3, 3.0], "reference_metric": "revenue" },
    "count": 8,
    "companies": [ /* Peer object · ver 2.3 */ ],
    "engine_version": "arroba-peers-v1"
  }
}
```

**Opción B · endpoint dedicado** (aceptable si `peers` bloatea la ficha):

```
GET /api/v1/company/{cif}/peers?limit=8
```
con la misma estructura del objeto `peers` de la Opción A como respuesta top-level.

### 2.2 Semántica

- `cnae_level`: Nivel de sector usado para acotar el universo (`class` 4-dig → `group` 3-dig → `division` 2-dig → `section` 1-letra). Intel decide el nivel más granular con universo ≥ 5 compañías (mismo comportamiento que `market.concentration.cnae_level`).
- `size_band.revenue_range_pct`: Rango multiplicativo aplicado sobre la métrica de referencia. `[0.3, 3.0]` = compañías con `revenue` entre el 30 % y 300 % de la de la empresa consultada. Intel puede ajustar la banda si el universo es escaso.
- `size_band.reference_metric`: Métrica de tamaño empleada. Preferido `"revenue"`; alternativa `"employees_total"` para sectores capital-light. Intel decide.
- `count`: Número real de peers entregados en `companies[]` (≤ 10; ≥ 5 salvo universo insuficiente, en cuyo caso `count < 5` y `available: false` si `count == 0`).
- `available: false` cuando Intel no encuentra suficientes peers ni tras degradar `cnae_level` a `section`. Arroba renderiza `<Empty/>` en ese caso (R15).

### 2.3 Objeto `Peer` · campos requeridos

| Campo | Tipo | Requerido | Descripción |
|---|---|:-:|---|
| `master_id` | `string` | ✅ | Identificador canónico Intel del peer. |
| `cif` | `string` | ✅ | CIF/NIF normalizado del peer. |
| `name` | `string` | ✅ | Razón social o denominación comercial. Emitido por Intel con el criterio de la ficha (legal_name preferente). |
| `province` | `string \| null` | ✅ | Provincia (nombre en claro, no código INE). |
| `cnae_code` | `string` | ✅ | CNAE primario del peer (4 dígitos). |
| `cnae_label` | `string` | ✅ | Nombre en claro del CNAE (no código). |
| `revenue` | `number \| null` | ✅ | Ingresos último ejercicio (EUR nativos). |
| `ebitda` | `number \| null` | ✅ | EBITDA último ejercicio (EUR nativos). |
| `ebitda_margin` | `number \| null` | ✅ | EBITDA / Revenue (fracción, no %). |
| `net_debt` | `number \| null` | ✅ | Deuda financiera neta último ejercicio (EUR nativos). |
| `employees` | `number \| null` | ✅ | Empleados totales último ejercicio. |
| `fiscal_year` | `number \| null` | ✅ | Año del ejercicio de referencia (para trazabilidad · pueden coexistir peers con años distintos). |
| `distance_score` | `number` | ✅ | Similitud multi-dimensional [0, 1]. `1.0` = idéntico; ordenación descendente. Intel decide la métrica (Mahalanobis, cosine, weighted-euclidean...). |
| `ranking_within_peer_group` | `integer` | ✅ | Posición del peer por `revenue` dentro del grupo devuelto (1-indexed). Sirve para alinear la tabla sin recalcular en front. |
| `narrative` | `string \| null` | ⚠️ | (**Fase 2 CANON**) Prosa CF de 1 línea que resume la diferencia clave frente a la empresa consultada. Ej.: _"Compañía similar en tamaño con margen EBITDA 4 pp inferior."_ Null-safe. |

### 2.4 Ejemplo de payload (Servier, `B28184687`)

Empresa consultada: Servier · CNAE 2120 · Madrid · Revenue 152 M€ · EBITDA 17 M€.

```json
{
  "peers": {
    "available": true,
    "cnae_level": "group",
    "size_band": {
      "revenue_range_pct": [0.3, 3.0],
      "reference_metric": "revenue"
    },
    "count": 6,
    "companies": [
      {
        "master_id": "mc_a11c2f4901aa",
        "cif": "A28028915",
        "name": "Laboratorios Rovi",
        "province": "Madrid",
        "cnae_code": "2120",
        "cnae_label": "Fabricación de especialidades farmacéuticas",
        "revenue": 187000000, "ebitda": 34000000, "ebitda_margin": 0.1818,
        "net_debt": -22000000, "employees": 1420, "fiscal_year": 2024,
        "distance_score": 0.94, "ranking_within_peer_group": 1,
        "narrative": "Peer líder por tamaño con margen EBITDA superior y balance sin deuda financiera neta."
      },
      {
        "master_id": "mc_b22d3f5622bb",
        "cif": "A82312223",
        "name": "Faes Farma",
        "province": "Bizkaia",
        "cnae_code": "2120",
        "cnae_label": "Fabricación de especialidades farmacéuticas",
        "revenue": 142000000, "ebitda": 28000000, "ebitda_margin": 0.1972,
        "net_debt": 45000000, "employees": 1180, "fiscal_year": 2024,
        "distance_score": 0.91, "ranking_within_peer_group": 2,
        "narrative": "Tamaño equivalente, margen 6 pp por encima; apalancamiento moderado."
      },
      {
        "master_id": "mc_c33e4f6733cc",
        "cif": "A08000123",
        "name": "Almirall (unidad España)",
        "province": "Barcelona",
        "cnae_code": "2120",
        "cnae_label": "Fabricación de especialidades farmacéuticas",
        "revenue": 98000000, "ebitda": 11000000, "ebitda_margin": 0.1122,
        "net_debt": 62000000, "employees": 830, "fiscal_year": 2024,
        "distance_score": 0.86, "ranking_within_peer_group": 3,
        "narrative": "Peer menor en tamaño, margen inferior y balance apalancado."
      }
      /* ... resto de peers hasta count=6 */
    ],
    "engine_version": "arroba-peers-v1"
  }
}
```

---

## 3. Comportamiento esperado y edge cases

- **Universo escaso** (`count < 5` tras degradar hasta `section`): Intel emite `available: true` con `count` real y un caveat en `narrative` del bloque. Arroba muestra la tabla y un badge "lectura orientativa" (canon CF).
- **Universo cero** (`count == 0` incluso tras degradar): `available: false`. Arroba renderiza `<Empty label="Comparativa no disponible" />`.
- **DPD**: peers **nominales** se entregan **igual** a usuarios anónimos y autenticados. La sensibilidad DPD de shareholder/officers **no aplica** a peers (Intel ya cruza universo público). Confirmar por Intel.
- **Consistencia con `finances.comparables`**: los estadísticos agregados (mediana, P25, P75) de `finances.comparables` deben calcularse sobre el **mismo universo** que alimenta `peers.companies[]`. Si el universo diverge, Intel debe indicarlo con un campo `universe_alignment: "same" | "divergent"` en `peers`.

---

## 4. Sub-preguntas abiertas (respuesta requerida por Intel)

1. **Banda de tamaño ajustable**: ¿Intel expone la posibilidad de recibir `?size_band_pct=0.5,2.0` como override por request? Arroba prefiere fijo `[0.3, 3.0]` para consistencia UX. ¿Confirmado?
2. **Peers extranjeros**: ¿El universo incluye compañías extranjeras del mismo CNAE (matrices europeas con actividad en España, subsidiarias)? Arroba prefiere **sólo compañías con `country == "ES"`** para evitar peers no comparables por régimen contable. ¿Confirmado?
3. **Criterio de similitud (`distance_score`)**: ¿Intel usa consenso de N métricas o pico de una única métrica? Arroba pide **documentar en `peers.methodology` (string · opcional)** la fórmula empleada (sin exponerla al usuario · sólo trazabilidad interna).
4. **Actualización**: ¿Los peers se cachean 24 h como `resolve`/`identity`, o tienen TTL específico? Arroba propone TTL 24 h (universo comparable estable a corto plazo).
5. **Cross-CIF idempotencia**: Si `B28184687` es peer de `A28028915` y viceversa, ¿el `distance_score` es simétrico? Arroba asume que sí (grafo no dirigido); confirmar.

---

## 5. Impacto para Arroba

- Se cablearía la sección **Comparativa** de la ficha (P1 en el roadmap Arroba, actualmente bloqueada).
- No requiere cambios contractuales adicionales en `arroba-company-ficha-v1` si se opta por la Opción A (aditivo bajo `peers`); Arroba añade `CompanyFicha.peers: dict | None` passthrough (patrón `HARDENING-012`).
- Habilita cableado inmediato de la tabla comparativa (columnas: `name`, `province`, `revenue`, `ebitda`, `ebitda_margin`, `net_debt`, `employees`) y de la lectura CF ("La empresa se sitúa en la banda media del universo por margen EBITDA, con apalancamiento superior a la mediana del grupo…") en el momento en que Intel entregue el bloque.

---

## 6. Formato de entrega esperado

- **Fase 1 (obligatoria)**: campos requeridos ✅ del §2.3 · Opción A (aditivo en `/ficha`) o Opción B (endpoint dedicado).
- **Fase 2 (canon CF)**: `narrative` por peer (§2.3 último campo). Sin esta prosa, Arroba se limita a la tabla numérica y una lectura genérica.
- **Fase 3 (opcional)**: enriquecimiento con `shareholder_tier` del peer (control mayoritario / dispersión), útil para filtrar por "peers privados vs cotizados". No bloqueante.

---

## 7. Estado actual en Arroba (para trazabilidad)

- Sección Comparativa en menú lateral: **existe** (`nav-comparativa`, línea ≈1900 de `CompanyFichaLayoutV2.tsx`).
- Render actual: `<Pending label="Comparativa" />`.
- Consumo en frontend: **no cableado**; espera contrato Intel.
- Backend Arroba: **no altera** el bloque; passthrough `dict | None` estará listo en cuanto Intel emita.

---

**REQ Comparables T5-10 emitido oficialmente el 2026-08-13.** Arroba queda a la espera de acuse de recibo y estimación de sprint objetivo por parte de Intel.
