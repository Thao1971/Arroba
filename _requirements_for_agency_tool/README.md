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
