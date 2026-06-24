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


---

### [REQ-004] Endpoint `valuation_engine`

- **Estado**: pending
- **Emisor**: arroba.com (Etapa 1.4)
- **Endpoint propuesto**: `POST /v1/valuation/indicative`
- **Payload (request)**:
  ```json
  {
    "master_company_id": "mc_xxx",
    "scope": "indicative" | "detailed",
    "context": {
      "locale": "es" | "en",
      "user_id": "user_xxx",
      "org_id": "org_yyy"
    }
  }
  ```
- **Respuesta esperada** (shape compatible con `ValuationBlock` actual):
  ```json
  {
    "company": { "master_company_id": "mc_xxx", "legal_name": "..." },
    "method": "ebitda_multiple" | "revenue_multiple" | "blended",
    "central_value": 9700000,
    "low_value": 7300000,
    "high_value": 12200000,
    "currency": "EUR",
    "multiple": { "label": "EV/EBITDA 6.0x", "value": 6.0 },
    "comparables": [
      {
        "master_company_id": "mc_comp_1",
        "legal_name": "Quickads Technologies, S.L.",
        "weight": 0.42,
        "rationale": "Mismo sector + tamaño + país"
      }
    ],
    "adjustments": [
      { "kind": "growth", "delta_pct": 8.0, "rationale": "CAGR 3y > 15%" },
      { "kind": "net_debt", "delta_eur": -1200000 },
      { "kind": "intangibles", "delta_eur": 800000 }
    ],
    "confidence_interval": { "p25": 8100000, "p75": 11200000 },
    "confidence": 0.74,
    "disclaimer": "Valoración indicativa. No constituye recomendación profesional ni asesoramiento financiero.",
    "lineage": "ai_generated" | "normalized" | "inferred",
    "valid_until": "2026-07-01T00:00:00Z",
    "source": "real"
  }
  ```
- **Reglas obligatorias del motor real**:
  1. **No revelar fuentes individuales** (lista de comparables OK con
     `master_company_id`, pero el detalle de cada compañía sigue el
     `EnrichedCompany` con su propio nivel de confidence).
  2. **Disclaimer regulatorio obligatorio** y devuelto siempre.
  3. **Intervalos de confianza p25/p75** (no solo `low`/`high` lineal).
  4. **Ajustes explicitados** uno a uno (`adjustments[]`) para auditabilidad.
- **Headers requeridos**: `X-Service-Key` (auth servicio-a-servicio).
- **Headers de respuesta**: `X-Source: real | mock`, `X-Valuation-Version: vN`.
- **SLA objetivo**:
  - `scope=indicative` → < 600 ms p95 (sin LLM, solo motor determinista).
  - `scope=detailed` → < 3 s p95 (puede invocar LLM interno para narrativa).
- **Cacheable**: sí, TTL configurable por compañía (sugerido 24 h salvo cambio
  significativo en los financials de origen).
- **Criterios de aceptación**:
  1. Devuelve valor central + rango + intervalo de confianza con datos reales,
     no fixtures.
  2. `comparables` no vacío para sectores con cobertura suficiente; explicar
     `confidence` bajo cuando no hay comparables (p. ej. < 3).
  3. `disclaimer` localizado por `context.locale`.
  4. El adapter arroba.com (`src/modules/copilot/skills/value.py → execute_value`)
     sustituye la fórmula simple `revenue * 1.5` por una llamada HTTPX al
     endpoint real **sin cambio de firma**.
  5. La forma del `ValuationBlock` que renderiza el frontend NO cambia: el
     motor real debe emitir los mismos campos canónicos (`central_value`,
     `low_value`, `high_value`, `multiple_label`, `disclaimer`).
- **Cuándo lo necesitamos**: Etapa E2 (cuando arroba.com habilite la valoración
  como Skill premium con planes Stripe).
- **Bloqueador para arroba.com**: No. Mientras tanto Value Skill emite la
  valoración indicativa simple `central = revenue * 1.5` con rango
  `[0.75x, 1.30x]` (deterministic, sin sector multiples ni comparables).

#### Trazabilidad
- Adapter mock (E1.4): `/app/backend/src/modules/copilot/skills/value.py`.
- Block contract Pydantic: `ValuationBlock` y `ValuationBlockProps` en
  `/app/backend/src/modules/copilot/models.py`.
- Endpoint cliente arroba.com: `POST /api/copilot/skills/value`.
- Header runtime: `X-Source: mock` hoy → `real` cuando REQ-004 entre.

---

### [REQ-005] Endpoint `recommendation_engine`

- **Estado**: pending
- **Emisor**: arroba.com (Etapa 1.4)
- **Endpoint propuesto**: `POST /v1/recommendations`
- **Payload (request)**:
  ```json
  {
    "subtype": "similar_to_company" | "opportunities_by_sector" | "list_by_sector",
    "reference": {
      "master_company_id": "mc_xxx",
      "sector": "Software"
    },
    "filters": {
      "regions": ["Madrid", "Cataluña"],
      "size": { "min_revenue": 1000000, "max_revenue": 50000000 },
      "stage": ["growth", "mature"]
    },
    "context": {
      "locale": "es" | "en",
      "user_id": "user_xxx",
      "org_id": "org_yyy"
    },
    "pagination": { "limit": 12, "offset": 0 },
    "ranking": "default"
  }
  ```
  Reglas del payload:
  - Si `subtype=similar_to_company`, `reference.master_company_id` es
    obligatorio.
  - Si `subtype=opportunities_by_sector` o `list_by_sector`,
    `reference.sector` es obligatorio.
- **Respuesta esperada** (shape compatible con `CompanyCardsGridBlock` actual):
  ```json
  {
    "subtype": "similar_to_company",
    "reference": { "master_company_id": "mc_kitchen", "legal_name": "Kitchen Studio, S.L." },
    "items": [
      {
        "master_company_id": "mc_quickads",
        "legal_name": "Quickads Technologies, S.L.",
        "sector": "Software",
        "region": "Cataluña",
        "score": 0.91,
        "rationale": "Similitud por sector, tamaño y geografía",
        "signals": [
          { "type": "revenue_growth_3y", "value": "+22%" },
          { "type": "hiring_velocity", "value": "+18%" }
        ]
      }
    ],
    "total": 47,
    "ranking_version": "v1",
    "disclaimer": "Recomendaciones basadas en datos públicos y agregados; no constituyen recomendación de inversión.",
    "source": "real"
  }
  ```
- **Reglas obligatorias**:
  1. Para `opportunities_by_sector` el motor debe priorizar empresas con
     **señales reales** de oportunidad (intención de venta, eventos
     corporativos, crecimiento atípico, cambio de management).
  2. Para `similar_to_company` el motor debe combinar **al menos** 3 criterios
     (sector + tamaño + geografía) y reflejarlos en `rationale`.
  3. `score` ∈ [0, 1] normalizado; pondera distintos criterios.
  4. `disclaimer` siempre devuelto y localizado por `context.locale`.
  5. `items[].signals` opcional, pero cuando exista debe ser auditable
     (no inventar señales).
- **Ranking**: documentar el algoritmo y versionarlo
  (`X-Ranking-Version: v1`).
- **Paginación**: `limit` (default 12, max 50), `offset` (default 0).
- **Headers requeridos**: `X-Service-Key` (auth servicio-a-servicio).
- **Headers de respuesta**: `X-Source: real | mock`, `X-Ranking-Version: vN`.
- **SLA objetivo**:
  - `similar_to_company` con `limit=12` → < 600 ms p95.
  - `opportunities_by_sector` con señales → < 1 s p95.
  - `list_by_sector` → < 400 ms p95.
- **Cacheable**: parcial (60–300 s por combinación de subtype + reference).
- **Endpoint público**: SÍ (sin auth de usuario), pero el motor real puede
  exigir `X-Service-Key`. El context lleva el `user_id` para personalización
  (futura: planes premium).
- **Criterios de aceptación**:
  1. Devuelve resultados reales del Agency Tool (no fixtures).
  2. Compatible con el shape del `CompanyCardsGridBlock` actual
     (`master_company_id`, `name`, `sector`, `region`, `score`, `reason`).
  3. Empty state cuando no hay matches: devuelve lista vacía + sugerencias
     contextuales por sector.
  4. Errores recuperables (5xx, timeout) devueltos como `ErrorBlock` con
     `retry_intent: "recommend"`.
  5. El adapter (`src/modules/copilot/skills/recommend.py → execute_recommend`)
     sustituye el filtrado mongo por una llamada HTTPX al endpoint real
     **sin cambio de firma**.

#### Trazabilidad
- Adapter mock (E1.4): `/app/backend/src/modules/copilot/skills/recommend.py`.
- Block contract Pydantic: `CompanyCardsGridBlock` y `CompanyCardsGridProps`
  en `/app/backend/src/modules/copilot/models.py`.
- Endpoint cliente arroba.com: `POST /api/copilot/skills/recommend`.
- Header runtime: `X-Source: mock` hoy → `real` cuando REQ-005 entre.




---

### [REQ-007] Endpoint `enrich_company_signals`

- **Estado**: pending
- **Emisor**: arroba.com (Etapa 1.5-REWORK)
- **Endpoint propuesto**: `GET /v1/signals/company/{master_company_id}`
- **Respuesta esperada**:
  ```json
  {
    "signals": [
      {
        "type": "financial_anomaly" | "contractual" | "legal_publication" |
                "procurement_award" | "executive_change" | "ownership_change" |
                "funding_round" | "news_event",
        "severity": "info" | "warn" | "critical",
        "source": "BORME" | "Iberinform" | "Datacontract" | "MITRE-BOE" | "PRO-press" | "internal",
        "detected_at": "<ISO-8601 UTC>",
        "description": "<= 240 chars",
        "evidence_url": "<https://...>" | null
      }
    ],
    "scores": {
      "opportunity": 0-100,
      "risk": 0-100,
      "growth": 0-100,
      "confidence": 0.0-1.0
    },
    "computed_at": "<ISO-8601 UTC>"
  }
  ```
- **Headers requeridos**: `X-Source: real` cuando el Agency Tool lo entregue.
- **SLA objetivo**: < 500ms p95, fresco hasta 24h.
- **Criterio de aceptación**:
  1. La sección 4 ("Score y señales") de `/empresa/{cif}` deja de mostrar
     el placeholder y muestra el bloque real.
  2. Las señales aparecen también como entrada de `section_updates` que el
     Company Advisor puede referenciar.
  3. Mientras esté pendiente, el adapter mock devuelve 0-3 señales sintéticas.
- **Cuándo lo necesitamos**: Etapa 1.5.5 / E1.6 (sector usa el mismo motor).

#### Trazabilidad
- Adapter mock (E1.5-REWORK): `/app/backend/src/modules/companies/service.py → build_score_placeholder`.
- Block contract Pydantic: `HeroBlock` (placeholder) + futuro `SignalsBlock`.

---

### [REQ-008] Endpoint `company_pdf_export`

- **Estado**: pending
- **Emisor**: arroba.com (Etapa 1.5-REWORK)
- **Endpoint propuesto**: `POST /v1/exports/company-memory`
- **Payload**:
  ```json
  { "master_company_id": "<uuid>", "user_id": "<uuid>", "fiscal_years": "all" | [2022, 2023, 2024] }
  ```
- **Respuesta esperada**:
  ```json
  {
    "available": true,
    "download_url": "<presigned-https-url>",
    "expires_at": "<ISO-8601 UTC>",
    "size_bytes": 1234567,
    "pages": 28
  }
  ```
  Cuando no esté listo:
  ```json
  { "available": false, "reason": "REQ-008 pendiente" }
  ```
- **Headers requeridos**: `X-Source: real`.
- **SLA objetivo**: < 8s para una memoria mercantil completa (peor caso).
- **Criterio de aceptación**:
  1. Acción "Descargar memoria mercantil" en la ficha pasa de toast
     "Próximamente — REQ-008 pendiente" a descarga real.
  2. URL firmada con caducidad ≤ 5 min.
  3. PDF auditado: contiene cuentas anuales + BORME + ratios + portada.
- **Cuándo lo necesitamos**: Etapa posterior a E1.9 (cuando los compradores
  empiezan a hacer due diligence rápido desde la ficha).

#### Trazabilidad
- Stub actual (E1.5-REWORK): toast "Próximamente — REQ-008 pendiente" en
  `/app/frontend/src/components/entity/CompanyHeader.tsx`.
