# PARA INTEL · Solicitud REQ · Ampliación del agregador `/company/{cif}/ficha` con bloque `finances.market` per-CIF pre-cruzado

> **Emisor**: Arroba.com (equipo de producto).
> **Destinatario**: Equipo Intelligence Engine.
> **Fecha**: 2026-08-11.
> **Prioridad**: **P2 · bloquea implementación de la sección Mercado**. Arroba mantendrá la sección sin cablear hasta armonización.
> **Sprint objetivo sugerido**: próximo hueco de trabajo sobre el agregador `/company/{cif}/ficha`.

---

## 1. Contexto de producto

Arroba consume `GET /api/v1/company/{cif}/ficha` como source of truth de la ficha canónica de empresa. La sección **Mercado** requiere una vista específica de la empresa que cruce su `cnae_primary.code` y su `province` con el catálogo sectorial y geográfico global de Intel.

Los endpoints públicos actuales de Intel entregan **catálogos globales** sin filtrado server-side real:

| Endpoint | Comportamiento actual |
| :------- | :--------------------- |
| `GET /api/v1/public/sector-intelligence/overview` | Devuelve `sectors[]` global (21 secciones o 88 divisiones). Parámetros `?cnae_code=` / `?section=` **ignorados server-side**. |
| `GET /api/v1/public/geo-intelligence/overview` | Devuelve `territories[]` global (17 CCAA o 52 provincias). Parámetro `?geo_id=` **ignorado**. Nivel máximo = `province` (rechaza `municipality` con 422). |
| `GET /api/v1/economic-intelligence/overview` (sin `/public`) | Devuelve `cnae_divisions[]` global. Parámetro `?cnae_code=` **ignorado**. |

Endpoints de detalle por CIF/sector no existen (`sectors/{code}` / `companies/{cif}` → 404).

**Decisión de arquitectura Arroba (2026-08-11)**: Arroba **NO implementará el cruce client-side** (opción de 3 llamadas SWR paralelas + filter en frontend por CNAE-division y `geo_id=province` ha sido descartada explícitamente por el usuario). Arroba espera a que Intel entregue un bloque **pre-cruzado** dentro del agregador `/ficha`, coherente con el patrón que ya sigue `finances.ranking` (HARDENING-003) y `finances.assessment` (verdict, 2026-08-11).

## 2. Petición concreta

Añadir al agregador `GET /company/{cif}/ficha` un bloque `finances.market` (o `market` top-level, según convención Intel) con la siguiente estructura mínima. **Todos los campos son opcionales / nullable** en R15 estricto: Intel entrega `null` cuando no dispone del dato · Arroba muestra `<Empty/>` local sin fabricar.

### Shape propuesto

```json
"market": {
  "sector": {
    "cnae_code": "2120",
    "cnae_level": "division",
    "cnae_label": "Fabricación de productos farmacéuticos",
    "cnae_section": "C",
    "dynamism_score": <number|null>,
    "size_score": <number|null>,
    "growth_score": <number|null>,
    "activity_score": <number|null>,
    "trend_direction": <"up"|"stable"|"down"|null>,
    "signal": <string|null>,
    "primary_driver": <string|null>,
    "active_companies": <int|null>,
    "hhi_concentration": <number|null>,
    "position": {
      "sector_rank": <int|null>,
      "sector_total": <int|null>,
      "percentile_within_sector": <number|null>
    },
    "benchmark_ratios": {
      "ebitda_margin":  { "p25": <number|null>, "p50": <number|null>, "p75": <number|null> },
      "ebit_margin":    { "p25": <number|null>, "p50": <number|null>, "p75": <number|null> },
      "net_margin":     { "p25": <number|null>, "p50": <number|null>, "p75": <number|null> },
      "roa":            { "p25": <number|null>, "p50": <number|null>, "p75": <number|null> },
      "roe":            { "p25": <number|null>, "p50": <number|null>, "p75": <number|null> },
      "current_ratio":  { "p25": <number|null>, "p50": <number|null>, "p75": <number|null> },
      "debt_ratio":     { "p25": <number|null>, "p50": <number|null>, "p75": <number|null> }
    }
  },
  "geo": {
    "geo_id": "28",
    "geo_level": "province",
    "geo_name": "MADRID",
    "dynamism_score": <number|null>,
    "size_score": <number|null>,
    "growth_score": <number|null>,
    "activity_score": <number|null>,
    "trend_direction": <"up"|"stable"|"down"|null>,
    "signal": <string|null>,
    "primary_driver": <string|null>,
    "active_companies": <int|null>,
    "new_companies_ytd": <int|null>,
    "position": {
      "province_rank": <int|null>,
      "province_total": <int|null>
    }
  }
}
```

### Ejemplo esperado para Servier (`B28184687`, cnae=2120, province=MADRID)

- `market.sector.cnae_code = "2120"` (o su división `21` si el nivel canónico es division).
- `market.sector.cnae_label = "Fabricación de productos farmacéuticos"`.
- `market.sector.dynamism_score / size_score / growth_score / activity_score` extraídos del catálogo `sector-intelligence/overview` para el nivel apropiado, pre-cruzados por Intel.
- `market.sector.position.sector_rank / sector_total` **específicos de Servier** dentro de su sector (comparable a lo que `finances.ranking.market_position` ya entrega, pero con scope explícito sector-only sin banda de tamaño).
- `market.sector.benchmark_ratios.ebitda_margin.{p25,p50,p75}` de las N empresas del CNAE-division, para poder pintar Servier vs percentiles del sector (hoy `finances.ratios.*.percentile` da un solo escalar; el shape ampliado permitiría boxplots).
- `market.geo.geo_id = "28"`, `geo_name = "MADRID"`, con todos los scores del catálogo geo.

## 3. Explicitación de lo que **NO** se pide en este REQ

- **T5-10 comparables nominales** (empresas concretas del mismo CNAE-division + banda de tamaño con `{name, ingresos, ebitda, deuda_neta, ...}`) → **fuera de scope**. Serán objeto de una **futura sección "Comparativa"** de la ficha Arroba, que consumirá otro endpoint separado (REQ distinto emitido cuando toque implementarla).
- Cross-currency, benchmarks internacionales fuera de España → **fuera de scope**.
- Nivel geográfico municipal → **fuera de scope actual** (Intel hoy rechaza `level=municipality`; provincia es suficiente para la primera iteración).
- Series temporales sector/geo (evolución 3-5 años de `dynamism_score`) → **fuera de scope** de este REQ; podría venir en una segunda iteración.

## 4. Prioridad y no-bloqueo del deploy actual

- **P2 · bloquea implementación de la sección Mercado** de la ficha Arroba.
- **NO bloquea deploy actual**: Arroba desplegará el lote B-2 completo con la sección Mercado en estado `<Empty/>` o simplemente no visible en el NAV (ítem `mercado` con `ready: false`).
- Cuando Intel entregue el bloque `finances.market`, Arroba lo cablea en **un turno** (~2 h estimadas): passthrough puro Pydantic + componente `Mercado` union-discriminated análogo a `Propiedad` / `Gobierno` (patrón B-2.2 / B-2.3).

## 5. Compatibilidad

- Cambio **aditivo**, no destructivo. Consumidores existentes no se ven afectados.
- Arroba consume `market` como `dict | None` passthrough (Zero Coupling P3 · sin modelado Pydantic estricto). La adición del campo no requiere cambios en contratos internos.
- Retrocompatible con ausencia: si Intel entrega `market: null` (empresa sin cobertura sector-intelligence), Arroba muestra `<Empty/>` global (R15 respetado).

## 6. Sub-preguntas abiertas para Intel

1. **Nivel canónico del cruce sectorial**: ¿debe Arroba esperar `cnae_level="division"` (2 dígitos, ej. `21`) o `cnae_level="4-dig"` (ej. `2120`)? Recomendación Arroba: division (más muestras estadísticas para benchmarks).
2. **Muestreo de `benchmark_ratios`**: ¿los percentiles P25/P50/P75 sectoriales usan el mismo `percentile_sample` que hoy expone `finances.ratios.*.percentile_sample` (387–599 empresas en Servier)? Coherencia deseada.
3. **HHI de concentración**: ¿lo calcula Intel hoy en algún endpoint interno, o requiere trabajo nuevo? Si es coste alto, es aceptable emitirlo como `null` en la v1 y añadirlo en una v2.
4. **Position rank dentro del sector**: `finances.ranking.market_position` ya expone `rank/total` con scope "sector CNAE + banda de tamaño (0,3x–3x ingresos)". El `market.sector.position` propuesto en este REQ debería usar scope **sector-only sin banda de tamaño** (más amplio). ¿Coherente con la lógica interna de Intel, o preferible unificar bajo un solo scope?
5. **Cobertura esperada**: en la muestra Turno D (6 CIFs), ¿qué % de compañías tendrán `market` poblado end-to-end vs. `available:false`? Se anticipa cobertura desigual (dinamismo económico de INE / procurement solo poblado en algunas divisiones).

## 7. Referencias internas Arroba

- Diagnóstico Fase 0 previo: `PARA_BETA_TURNO_D_MULTICIF.md` (sub-preguntas P0-5 · P0-6 sobre coverage sectorial).
- Reporte diagnóstico Fase 0 Rankings + Mercado (sesión 2026-08-11 · main agent E1).
- Endpoints públicos existentes que hoy sirven catálogo global (fuente de datos que Intel deberá pre-cruzar):
  * `GET /api/v1/public/sector-intelligence/overview` (contract_version 2.0)
  * `GET /api/v1/public/geo-intelligence/overview` (contract_version 1.0)
  * `GET /api/v1/economic-intelligence/overview` (contract_version 1.0 · sin prefijo `/public`)
- Patrón de referencia interno para agregación pre-cruzada per-CIF: `finances.ranking` (HARDENING-003) + `finances.assessment` (verdict · 2026-08-11).

---

**Contacto Arroba**: main agent E1 · sección Mercado del layout `CompanyFichaLayoutV2.tsx` ítem NAV `mercado` grupo `Perfil` · pendiente de cableado en cuanto Intel armonice.
