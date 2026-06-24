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

---

### [REQ-003] Endpoint `copilot_search_real`

- **Estado**: pending
- **Emisor**: arroba.com (Etapa 1.3)
- **Endpoint propuesto**: `POST /v1/skills/search` (o `GET /v1/search`).
- **Payload (request)**:
  ```json
  {
    "query": "kitchen studio madrid",
    "filters": {
      "sectors": ["software", "construcción"],
      "cities": ["Madrid"],
      "size": { "min_revenue": 1000000, "max_revenue": 50000000 },
      "employees": { "min": 5, "max": 250 }
    },
    "context": {
      "locale": "es",
      "pathname": "/analizar",
      "user_id": "user_xxx",
      "org_id": "org_yyy"
    },
    "pagination": { "limit": 12, "offset": 0 },
    "ranking": "default"
  }
  ```
- **Respuesta esperada**: misma forma que `Workspace` actual:
  ```json
  {
    "workspace": {
      "workspace_id": "wsp_xxx",
      "intent": "search",
      "blocks": [
        {
          "type": "search_results",
          "id": "blk_xxx",
          "props": {
            "query": "kitchen studio madrid",
            "total": 47,
            "results": [
              {
                "master_company_id": "mc_xxx",
                "name": "Kitchen Studio",
                "legal_name": "Kitchen Studio, S.L.",
                "cif": "B86540112",
                "sector": "Tecnología y software",
                "city": "Madrid",
                "score": 0.91
              }
            ]
          }
        }
      ]
    },
    "source": "real",
    "query": "kitchen studio madrid"
  }
  ```
- **Ranking**: score normalizado [0,1] mezclando relevancia textual + popularidad
  + frescura de datos. Documentar el algoritmo en el response (header
  `X-Ranking-Version: v1` recomendado).
- **Paginación**: `limit` (default 12, max 50), `offset` (default 0). El campo
  `total` siempre refleja el conteo completo, no la página.
- **Filtros**: opcionales. El backend debe ser tolerante a filtros vacíos.
- **Headers requeridos**: `X-Service-Key` (auth servicio-a-servicio).
- **Headers de respuesta esperados**: `X-Source: real` cuando el adapter
  consume al Agency Tool real.
- **SLA objetivo**: < 400 ms p95 con texto + sin filtros; < 800 ms p95 con
  filtros complejos.
- **Cacheable**: parcial — query exacta + filtros en los últimos 60 s.
- **Endpoint público**: SÍ (sin auth de usuario). El context lleva el `user_id`
  para personalización, pero la búsqueda misma es pública.
- **Criterios de aceptación**:
  1. Devuelve resultados reales del Agency Tool (no fixtures).
  2. Compatible con el shape actual (`Workspace > Block[]` discriminated union
     por `type`).
  3. Empty state cuando no hay matches: devuelve `EmptyStateBlock` con
     sugerencias contextuales por sector/región.
  4. Errores recuperables (5xx, timeout) devueltos como `ErrorBlock` con
     `retry_intent: "search"`.
  5. El adapter (`src/modules/copilot/service.py → execute_search`) sustituye
     la query mongo por una llamada HTTPX al endpoint real **sin cambio de
     firma**.

#### Trazabilidad
- Adapter mock: `/app/backend/src/modules/copilot/service.py` → `execute_search`.
- Modelos del contrato Pydantic: `SearchSkillRequest`, `Workspace`, `BlockSpec`
  en `src/modules/copilot/models.py`.
- Endpoint cliente arroba.com: `POST /api/copilot/skills/search`.
- Header de respuesta: `X-Source: mock` (E1.3) → `real` cuando REQ-003 entre.

