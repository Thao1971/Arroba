# REQ-INTEL · Procedencia por métrica (`.srcdot` explicabilidad Fase 2)

**Emitido**: 2026-08-13 · turno HARDENING-021
**Prioridad**: P2 (bloquea Fase 2 explicabilidad — Fase 1 y Fase 3 pueden avanzar sin este REQ)
**Owner Intel**: pendiente asignación
**Consumidor Arroba**: `.srcdot` marker (mockup ficha-empresa-f01.html líneas 861-902) + `✦` sufijo para valores inferidos

---

## Contexto

El mockup canónico (`ficha-empresa-f01.html`) prescribe que **cada fila de ratio o KPI en Finanzas / Mercado / Rankings** vaya precedida por un pequeño punto de color que indique la procedencia del dato:

```html
<div class="rrow">
  <span class="rn">
    <span class="srcdot r" data-tip="Dato financiero verificado"></span>
    <span class="help" data-tip="ROE">ROE</span>
  </span>
  <span class="rv">18,4%</span>
  ...
</div>
```

CSS scopeado (ya portado en `fichaMockupCss.ts`):
```css
.srcdot{width:7px;height:7px;border-radius:50%;flex-shrink:0;cursor:help}
.srcdot.r{background:var(--ok)}   /* verificado */
.srcdot.c{background:var(--n300)} /* calculado por Arroba */
```

Y adicionalmente el sufijo `✦` para valores inferidos (mockup línea 732: `Ranking sector ✦ ... ✦ = valor inferido por Arroba`).

Copy CF canónico (glosario Fase 2 · usuario aprobado):
- `.srcdot.r` → **"Verificado en fuente"** — dato tomado directamente de cuentas o registros oficiales.
- `.srcdot.c` → **"Calculado por Arroba sobre datos verificados"** — métrica derivada de datos verificados en fuente.
- `✦` → **"Inferido por Arroba"** — valor deducido cuando no consta el dato directo.

## Estado actual del payload (2026-08-13, curl `/api/companies/B28184687/ficha?authenticated=true`)

El motor emite hoy **procedencia a nivel bloque** (no por métrica):

| Ruta | Tipo | Ejemplo real (Servier B28184687) |
|---|---|---|
| `finances.data_source` | `string` (bloque) | `"master_companies + norm_financials (Iberinform)"` |
| `finances.valuation.lineage.financials_source` | `string` (bloque) | `"master_companies.financials.latest"` |
| `finances.valuation.confidence` | `float` (bloque) | `0.6` |
| `finances.explainability.data_source` | `string` (bloque) | idem `finances.data_source` |
| `identity.provenance_fields` | `list[string]` (lista de campos) | `['capital_social', 'cnae_code', ...]` |

Ningún campo describe la procedencia **por métrica individual**. Sin ese descriptor, Arroba no puede pintar `.srcdot.r` vs `.srcdot.c` con criterio.

## Petición formal

Emitir por cada métrica del payload un descriptor de procedencia con vocabulario controlado.

### Opción A · Aditivo por métrica (recomendada · shape self-contained)

Cada valor pasa a ser un objeto con procedencia:

```json
{
  "finances": {
    "ratios": {
      "ebitda_margin": { "value": 0.292, "provenance": "verified" },
      "roe":          { "value": 0.184, "provenance": "verified" },
      "roa":          { "value": 0.091, "provenance": "calculated" },
      "roce":         { "value": 0.147, "provenance": "calculated" },
      "dn_ebitda":    { "value": 3.0,   "provenance": "calculated" }
    }
  }
}
```

Ventaja: self-describing por métrica, robusto a reordenaciones. Coste: cambio de shape breaking → requiere versionado.

### Opción B · Dict paralelo (retro-compatible)

Se preservan los valores como floats; se añade un dict `provenance` con las mismas claves:

```json
{
  "finances": {
    "ratios": { "ebitda_margin": 0.292, "roe": 0.184, ... },
    "provenance": {
      "ratios.ebitda_margin": "verified",
      "ratios.roe": "verified",
      "ratios.roa": "calculated",
      "ratios.roce": "calculated",
      "ratios.dn_ebitda": "calculated"
    }
  }
}
```

Ventaja: no breaking; los consumidores actuales siguen leyendo `ratios.ebitda_margin` como float. El dict es opcional. Coste: la clave de la ruta tiene que ser estable (contrato adicional a mantener).

### Vocabulario controlado (exactamente 3 valores)

```
"verified"    → dato tomado directamente de cuentas o registros oficiales
"calculated"  → derivado por el motor a partir de datos verificados (fórmula determinista)
"inferred"    → valor deducido cuando no consta el dato directo (con margen de error mayor)
```

Si hace falta un 4º (`estimated`, `imputed`, `benchmark`, etc.) — Intel documenta la semántica y añade el token; Arroba extenderá el mapa cliente.

### Cobertura mínima

| Bloque | Métricas mínimas con provenance |
|---|---|
| `finances.ratios` | todas las ratios emitidas (ebitda_margin, net_margin, roe, roa, roce, current_ratio, quick_ratio, autonomy_ratio, coverage_ratio, dn_ebitda, dn_ffpp, dso, dpo, ccc) |
| `finances.kpis` | revenue, ebitda, resultado_neto, revenue_cagr, revenue_growth_yoy, ebitda_growth_yoy, patrimonio_neto |
| `finances.cash_flow.rows[]` | cada row (OCF, Capex, FCF, Financiación, Variación neta) |
| `finances.valuation` | `multiple`, `enterprise_value`, `equity_value`, `range.{low,high}` |
| `market.sector`, `market.geo`, `market.concentration` | scores y `national_yoy_pct`, `hhi`, `market_actors_count` |
| `ranking` | `sector_revenue_percentile`, `market_position.rank`, `locality_position.rank` |

`identity.provenance_fields` ya cubre Identity parcialmente — se preserva su shape.

## DPD

La procedencia es **metadato agregado**, no PII. Passthrough en anon (no requiere anonimización). Regla defensiva: si un bloque completo se nulifica en anon (patrón HARDENING-016 · finances/etc.), su dict `provenance` también.

## Sub-preguntas abiertas para Intel

1. **Versionado**: ¿el vocabulario controlado tiene semver? Si Intel añade `"imputed"` o `"benchmark"`, ¿en qué versión Arroba tiene que actualizar el mapa cliente? ¿Es breaking o aditivo?
2. **Coste en payload**: aproximado en KB adicionales del contrato Ficha. Estimación con Opción A vs B para una empresa media (≈40 métricas cubiertas).
3. **Entrega**: ¿co-entrega con canon Fase 2 completo (`✦`, `hypotheses`, `benchmark_scope`) o entregable independiente aplicable ya sobre el contrato actual?
4. **Frontera calc vs inferred**: ¿"CAGR 3 años" (fórmula determinista) es `calculated` o `inferred` cuando faltan uno de los tres puntos? Regla de decisión Intel.

## Prioridad y orden en la cola

**P2 · en cola tras**:
1. REQ `PARA_INTEL_labels_es_batch.md` (Fase B canon — ya cerrado 2026-08-13 con HARDENING-019).
2. REQ `PARA_INTEL_comparables_T5_T10.md` (peers T5-T10 — WIP HARDENING-020, aparcado).
3. REQ `PARA_INTEL_opportunities_narrative_cf.md` (Anexo B Oportunidades — 2026-08-13).

No bloquea el push actual. Fase 1 (tooltips + micro-animaciones) y Fase 3 (metodología estática) avanzan sin este REQ.
