# Requerimientos para el Agency Tool / Intelligence Engine

Este archivo lista los requerimientos que arroba.com necesita del Agency Tool.
Mientras estén pendientes, arroba.com usa mocks marcados con header `X-Source: mock` y log `[MOCK]`.

## Formato de cada requerimiento

### [REQ-XXX] Título corto
- **Estado**: pending | acknowledged | delivered
- **Emisor**: arroba.com (Etapa N)
- **Endpoint propuesto**: METHOD /v1/...
- **Payload**: { ... }
- **Respuesta esperada**: { ... }
- **Headers requeridos**: ...
- **SLA objetivo**: ...
- **Criterio de aceptación**: ...
- **Cuándo lo necesitamos**: Etapa N

---

## Requerimientos abiertos

### [REQ-001] Endpoint `enrich_company`

- **Estado**: pending
- **Emisor**: arroba.com (Etapa 0.4)
- **Endpoint propuesto**: `POST /v1/enrich_company`
- **Payload**:
  ```json
  { "master_company_id": "<uuid>", "profile": "full" | "summary" }
  ```
- **Respuesta esperada**: estructura `EnrichedCompany` definida en `/app/backend/src/modules/agency_tool_adapter/models.py`.
  Campos canónicos:
  - `master_company_id` (str, requerido)
  - `cif` (str | null)
  - `legal_name` (str, requerido)
  - `sector` (str | null)
  - `region` (str | null)
  - `country` (str, default `"ES"`)
  - `financials` (`Financials | null`) → `{ revenue, ebitda, employees, fiscal_year }`
  - `confidence` (float, `0.0`–`1.0`)
  - `lineage` (enum: `raw | normalized | inferred | ai_generated`)
  - `valid_until` (datetime ISO 8601 | null)
  - `signals` (lista de objetos `{ type, payload, confidence, observed_at }`)
  - `scores` (dict; pares estables: `quality_score`, `match_score`, `opportunity_score`, …)
  - `recommendations` (lista de objetos `{ type, payload, priority }`)
  - `source` (str; se sobreescribe a `"real"` cuando este endpoint esté en producción)
- **Headers requeridos**:
  - `X-Service-Key` (autenticación servicio-a-servicio; valor administrado por el equipo del Agency Tool)
  - `Content-Type: application/json`
- **SLA objetivo**: < 500 ms p95
- **Criterio de aceptación**:
  1. El Agency Tool devuelve respuesta válida según el schema para **al menos 10 `master_company_id`** de prueba acordados entre equipos.
  2. `signals`, `scores` y `recommendations` no vienen vacíos cuando el dato existe en el origen.
  3. El adapter en `/app/backend/src/modules/agency_tool_adapter/service.py` puede sustituir la implementación mock por el cliente HTTP real **sin cambiar la firma** de `enrich_company(master_company_id, profile)` ni la forma del `EnrichedCompany`.
  4. El switch de mock ↔ real es trivial: nueva variable de entorno `AGENCY_TOOL_MODE=real` + cliente HTTPX inyectado; ninguna otra parte del backend cambia.
- **Cuándo lo necesitamos**: Etapa 2 (cuando Universal Search empiece a consumir empresas reales para mostrar al usuario).
- **Bloqueador para arroba.com**: No. Mientras tanto operamos contra `master_companies_mock` pobladO manualmente vía `POST /api/admin/agency-tool/master-companies-mock`.

#### Trazabilidad
- Adapter mock: `/app/backend/src/modules/agency_tool_adapter/`
- Documento de contrato Pydantic: `EnrichedCompany` en `models.py`
- Endpoint cliente arroba.com (público con sesión):
  `GET /api/agency-tool/companies/{master_company_id}?profile=full|summary`
- Endpoint de estado de adapters:
  `GET /api/agency-tool/status`
- Log marker en runtime: `[MOCK]` mientras dure el modo mock; cambiar a `[REAL]` cuando se haga el switch.
- Cabecera de respuesta: `X-Source: mock` o `X-Source: real`.

---

### [REQ-002] Endpoint `platform_stats`

- **Estado**: pending
- **Emisor**: arroba.com (Etapa 1.1.5)
- **Endpoint propuesto**: `GET /v1/platform_stats`
- **Payload**: ninguno (solo cabeceras de servicio).
- **Respuesta esperada**: misma estructura del endpoint mock actual en arroba.com.
  Ver `PlatformStats` en `/app/backend/src/modules/agency_tool_adapter/models.py`.
  ```json
  {
    "companies_with_intelligence": 5189,
    "companies_with_financials": 5227,
    "economic_metrics_total": 4197,
    "corporate_movements": 39436,
    "investors_and_funds": 2075,
    "sectors_analyzed": 87,
    "companies_with_public_contracts": 61264,
    "cross_sectors": 88,
    "last_updated": "2026-06-24T09:00:00Z",
    "confidence": 1.0,
    "lineage": "raw",
    "valid_until": null,
    "source": "real"
  }
  ```
- **Headers requeridos**: `X-Service-Key: <token>` (auth servicio-a-servicio).
- **Headers de respuesta esperados**: el cliente arroba.com renvía a la home con
  `X-Source: real` cuando el adapter consume al Agency Tool real (mientras tanto
  emite `X-Source: mock`).
- **SLA objetivo**: < 200 ms p95. Es endpoint público de home — impacta conversión.
- **Cacheable**: sí, TTL configurable (sugerido 5-15 min, alineado a la frecuencia
  real de actualización agregada).
- **Criterio de aceptación**:
  1. Devuelve métricas agregadas reales y actualizadas (NO datos sintéticos).
  2. **Endpoint público SIN autenticación de usuario** (la home de arroba.com es
     pública y este endpoint la consume).
  3. `confidence`, `lineage` y `valid_until` con valores reales (no
     placeholders).
  4. El adapter de arroba.com (`get_platform_stats` en
     `/app/backend/src/modules/agency_tool_adapter/service.py`) puede sustituir
     la implementación mock por un cliente HTTPX real **sin cambio de firma**.
- **Cuándo lo necesitamos**: tan pronto como el Agency Tool lo entregue. La home
  funciona con mock hasta entonces.
- **Bloqueador para arroba.com**: No. Mientras tanto el adapter consume desde
  `platform_stats_mock` (singleton) seedeado con
  `scripts/seed_platform_stats.py` y editable vía `POST/PUT/DELETE
  /api/admin/agency-tool/platform-stats-mock` (admin).

#### Trazabilidad
- Adapter mock: `/app/backend/src/modules/agency_tool_adapter/service.py` →
  `get_platform_stats`.
- Documento de contrato Pydantic: `PlatformStats` en `models.py`.
- Endpoint cliente arroba.com (público, sin auth): `GET /api/agency-tool/platform-stats`.
- Cabecera de respuesta: `X-Source: mock` (E1.1.5) → `real` cuando REQ-002 entre.
- Seed script: `/app/backend/scripts/seed_platform_stats.py`.

