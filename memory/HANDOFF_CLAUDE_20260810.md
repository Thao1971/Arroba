# HANDOFF · Contexto consolidado para agente sucesor (Claude)

## §0. Metadata

- **Versión**: 2026-08-11 · **supersede** todas las anteriores incluida `PLAN_BETA_ficha_HANDOFF.md`.
- **Autor**: main agent E1 (Emergent) · sesión con user real product owner de arroba.com.
- **Contexto**: arroba.com actúa como proxy + intelligence layer sobre el motor externo Intel Agency Tool. FastAPI backend + Next.js frontend (App Router) + Mongo caché. Deploy real activo en `beta.arroba.com`.
- **Idioma canónico**: español Corporate Finance (todos los copy UI y toda la comunicación del agente).
- **Alcance del handoff**: continuidad completa para un agente sucesor.

---

## §1. Resumen ejecutivo

- **Lote B-2 CERRADO 12/12** (Rankings, Ownership DPD, Governance DPD, Refactor agregador, Cash Flow bridging, Events shell, Identificación ampliada, Estructura de deuda, Signals enriquecidos, Fix R15 ratios, HARDENING-008 fallback, REQ-INTEL shareholder.type).
- **Hero Verdict cableado** post-B-2 · ruta `finances.assessment.verdict` (Intel resolvió el REQ vía bloque paralelo).
- **REQ-INTEL Market** emitido P2 · bloquea implementación sección Mercado hasta que Intel entregue `finances.market` pre-cruzado.
- **Prod desplegado** en `beta.arroba.com` (usuario ejecutó vía panel Emergent entre turnos). Estado **PARTIAL**: path crítico sano, 3 anomalías residuales aparcadas (ver `DEPLOY_PROD_20260810.md`).
- **Testing**: pytest backend 9/9 PASS · vitest frontend 200/200 PASS · testing_agent iter_36/37/38 100%.

---

## §2. Reglas vigentes que Claude debe respetar

- **R3 · Corporate Finance ES** · vocabulario sobrio, sin anglicismos evitables. Copy UI en español.
- **R4 / R10 · Null-safety total** · nunca renderizar `undefined`, `null`, `NaN`. Cada campo tiene `<Empty/>` local.
- **R11 · Frontend UI Freeze** · usar los primitivos del mockup (`fichaMockupCss.ts`, clases `.card`, `.rec`, `.tl`, `.idrow`). No crear CSS nuevo salvo excepción justificada.
- **R12 · Master admin bloqueado** · guard estructural en `client.py::request` rechaza `/api/v1/master/*` en origen.
- **R15 · Real data o `<Empty/>`** · cero derivadas cuando el dato no viene poblado. Cero prosa sintética. Ningún cálculo aritmético frontend (`financial_debt = st + lt` prohibido; usar bridging documentado backend cuando sea absolutamente necesario).
- **P1 · Explainability First** · toda cifra en la UI debe poder trazarse a Intel + fuente.
- **P2 · Intelligence over Data** · exponer scores/percentiles antes que raw values cuando aporte.
- **P3 · Zero Coupling** · frontend nunca consume raw payloads Intel; siempre passthrough validado por Pydantic o consumido como `dict|None` con union type discriminado en TS.
- **DPD · Data Protection Directive**:
  - Governance anon: `officers[]` nominal se agrega a `summary{total, roles[]}` con mapa i18n ES (`_anonymize_governance()`).
  - Ownership anon: **todos los nombres ocultos** (jurídicos y físicos) → `summary{total_shareholders, tier?, top1_pct?}` (`_anonymize_ownership()`).
  - `available:false` → passthrough para ambos modos (no hay PII que proteger).
- **Deploy discipline** · deploy solo lo dispara el usuario vía panel Emergent. Agente NUNCA ejecuta deploy.
- **`_KEY_ONETIME.txt`** · **BORRADO 2026-08-11 tras deploy exitoso**.

---

## §3. Items completados (cronológico desde §3.6 del handoff previo)

### §3.7 · HARDENING-008 · Resiliencia agregador
Backend fallback en `endpoints.py::get_company_ficha`: si Intel devuelve 404/5xx/breaker en `/company/{cif}/ficha`, compone `CompanyFicha` desde legacy `router.get_master_by_cif` + `router.get_financial_analysis`. Header `X-Ficha-Source: aggregator | fallback_per_section`; `engine_version: arroba-ficha-v1-fallback` en fallback. Preserva 404 `ficha_not_found` sólo si `get_master_by_cif` también falla.

### §3.8 · B-2.3 · Governance con DPD backend
`_anonymize_governance()` transforma `officers[]` nominal a `summary{total, roles[{role, role_label, count}]}` para anónimo (mapa i18n `_GOVERNANCE_ROLE_ES` consolida `Joint And Several Director → Administrador Solidario`, `Representative → Representante`, etc. · ordenación determinista `count↓ · role_label↑`). Frontend union type `GovernanceBlock = GovernanceNominal | GovernanceAggregated | GovernanceUnavailable` con testids `gobierno-{empty|aggregated|nominal|roles-table|officers-table|role-*|officer-*}`. **HARDENING-009** documentado.

### §3.9 · B-2.2 · Ownership con DPD backend
Política DPD **simplificada** (aprobada tras Fase 0): sin discriminación jurídica/física — todos los nombres ocultos en anon. `_anonymize_ownership()`: anon → `summary{total_shareholders, tier?, top1_pct?}`. Auth → passthrough nominal (`shareholders[]` + `control{}`). `available:false` → passthrough. Componente `Propiedad` con título CF **"Estructura accionarial y control"** y testids `ownership-{empty|aggregated|nominal|shareholders-table|control-block|summary-*|shareholder-*}`. Campo real Intel es `pct` (no `percentage`) — Fase 0 confirmada. **HARDENING-010** documentado.

### §3.10 · Bundle post-Ownership · 4 ítems encadenados
- **Events shell** (frontend-only) · componente `Eventos` + NAV ítem `eventos` grupo `Fuentes` label "Eventos y BORME" · consumo `ficha.events` con timeline o `<Empty/>`. Público.
- **Item 6.a · Identificación ampliada** (frontend-only) · componente `IdentidadAmpliada` con 4 subgrupos (Registro/Domicilio/Capital y plantilla/Cotización) · 22 testids · null → `<Empty/>` local con label preservado. Público. R15: `employees_range` NO derivado desde `employees_total`; `ticker` NO fabricado.
- **Item 6.b · Estructura de deuda** (frontend-only) · componente `DebtBreakdownCard` en tab Balance de Finanzas · consume `finances.balance_sheet.{st_debt, lt_debt, financial_debt}` (shape plano un-año) · 3 filas · null local → "En preparación" · todos null → mensaje global · gated. R15: NO cálculo `financial_debt = st + lt` en frontend.
- **REQ-INTEL** `PARA_INTEL_shareholder_type.md` P3 no bloqueante.

### §3.11 · Hero Verdict wire
`finances.assessment.verdict` cableado en `HeroBlock` (aditivo `FinancialAnalysisAssessment` con `{score, label, assessment, verdict}`). Passthrough puro. Testid `hero-verdict-value`. **`PARA_INTEL_financial_quality_verdict.md` P2 CERRADO** — Intel entregó `verdict` en bloque paralelo `finances.assessment` (no en `financial_quality` como se pidió originalmente). La "Lectura financiera de ARROBA" (pestaña Finanzas) sigue leyendo `financial_quality.{assessment, strengths}` sin cambios · ambas coexisten.

### §3.12 · Fase 0 diagnóstica Rankings + Mercado
Diagnóstico sin código. Confirmado: `finances.ranking` idéntico al consumido por B-2.1 (sin campos adicionales); bloques `market/sector/geo/economic` NO presentes en `/ficha`. Endpoints públicos globales devuelven catálogos sin filtro server-side (`?cnae_code=` / `?geo_id=` **ignorados**); techo geográfico = `province` (no municipio). Endpoints de detalle por CIF/sector no existen (404).

### §3.13 · REQ-INTEL Market emitido
`PARA_INTEL_market.md` P2 · pide `finances.market` pre-cruzado en el agregador con sector + geo + HHI + position + benchmark_ratios sectoriales P25/P50/P75. Opción A (3 SWR + cross client-side) descartada por decisión de usuario. Sección Mercado permanece `ready:false` en NAV hasta armonización Intel. Cableado post-armonización estimado ~2 h.

### §3.14 · Deploy prod post-factum
Usuario ejecutó deploy `beta.arroba.com` vía panel Emergent entre turnos. Estado **PARTIAL**. Verificación curl anon confirmó path crítico sano · governance/ownership DPD sin PII · 3 anomalías residuales aparcadas (ver `DEPLOY_PROD_20260810.md`). `_KEY_ONETIME.txt` borrado tras confirmación.

---

## §4. Arquitectura del backend

### §4.1 · Flujo de datos
Cliente → FastAPI `/api/companies/{cif}/ficha` → `IntelligenceRouter.get_company_ficha(cif, user)` → `AgencyToolClient.request()` (X-API-Key primary/secondary rotación) → Intel `/api/v1/company/{cif}/ficha` → mapper `financial.py::_map_analyze` + `interfaces/ficha.py::CompanyFicha` → **si `user is None`** aplicar `_anonymize_governance()` + `_anonymize_ownership()` + `finances=None` → JSON response con headers `X-Ficha-Source`, `X-Intelligence-Mode`, `X-Provider`.

### §4.2 · Endpoints backend expuestos
- `GET /api/companies/{cif}/ficha` · agregador canónico (fuente única SWR frontend).
- `GET /api/companies/{cif}/section/*` · endpoints legacy por sección · **VIVOS** para servir fallback HARDENING-008 · NO deprecar hasta próximo ciclo.
- `GET /api/companies/{cif}/valuation` · proxy a `POST /api/v1/financial-intelligence/valuation`.
- `POST /api/auth/login` · Emergent Auth JWT.
- `GET /api/health` · sanity check.

### §4.3 · Agregador `/ficha` · shape completo

```
CompanyFicha {
  cif_normalized, master_id, engine_version,
  identity: dict|None,           // 34 campos passthrough (registry_status, location, size, contact, classification, ...)
  finances: FinancialAnalysis|None,  // gated · nullificado en anon
    ├─ balance_sheet: { st_debt, lt_debt, financial_debt, equity, ...} (plano un-año)
    ├─ ratios: { *.{value, percentile, percentile_sample} }             (15+ ratios)
    ├─ ranking: { sector_revenue_percentile, market_position, locality_position, explain }
    ├─ cash_flow: { rows[], bridging }
    ├─ evolution: { points[] }
    ├─ signals[], valuation.{ebitda_margin_percentile, ...}
    ├─ financial_quality: { score, assessment, strengths[], weaknesses[], risks[] }   (5 campos · pestaña Finanzas "Lectura financiera")
    └─ assessment: { score, label, assessment, verdict, strengths[], weaknesses[], risks[] }   (7 campos · Hero "Veredicto de ARROBA")
  ownership: dict|None,           // union type · nominal / summary / unavailable
  governance: dict|None,          // union type · nominal / summary / unavailable
  events: dict|None,              // { available:bool, items[]? }
  ranking: dict|None,             // referencia al mismo objeto de finances.ranking
}
```

### §4.4 · Anonimización DPD (funciones nuevas en `endpoints.py`)
- `_anonymize_governance(governance)` líneas ~365-450 · aplica cuando `user is None`.
- `_anonymize_ownership(ownership)` líneas ~450-520 · aplica cuando `user is None`.
- `_slugify_role(label)` + `_GOVERNANCE_ROLE_ES` mapa i18n (Intel EN → ES CF).

### §4.5 · Mappers
- `providers/agency_tool/financial.py::_map_analyze` línea 235-294 · passthrough con extracción explícita de sub-bloques `assessment`, `financial_quality`, `ranking`, `cash_flow`, `balance_sheet`, `ratios`, `evolution`, `signals`, `valuation`. Cero transformación de contenido.

### §4.6 · Caché de 2 capas
- Mongo `intelligence_cache` (TTL manual · invalidación por `_id` regex).
- LRU in-memory por proceso (config.py).

### §4.7 · Semáforo global
`agency_tool_global_max_concurrent=3` para evitar 520 upstream por fan-out.

---

## §5. Arquitectura del frontend

### §5.1 · Source of truth
- `useCompanyFicha(cif)` SWR → `GET /api/companies/{cif}/ficha` · **6 llamadas SWR totales** (post-refactor B-2.4, antes 8).
- Adapters `adaptIdentityFromFicha`, `adaptFinancialAnalysisFromFicha`, etc. viven en `/app/frontend/src/lib/companies/`.

### §5.2 · Componente canónico
`/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` (1670 líneas · monolito por diseño para preservar R11 · sin refactor hasta que Intel armonice Mercado y Comparativa).

Sub-componentes:
- `HeroBlock` (Hero + Veredicto card).
- `Resumen` (auth vs anon).
- `IdentidadAmpliada` (card 4 subgrupos).
- `Finanzas` (tabs Cuenta/Balance/Flujos/Ratios · `FinTable`, `DebtBreakdownCard`, `CashFlowStatementCard`, `RatiosCards`).
- `Valoracion`, `Semantica`, `Senales`, `Oportunidades`, `Comparativa`.
- `Propiedad`, `Gobierno`, `Eventos` (todos union-discriminated · testids `{section}-{empty|aggregated|nominal|...}`).
- Placeholders `Pending` para NAV items con `ready:false` (Mercado, Rankings, Comité, Sucesión, Sector, Registros, Documentos).

### §5.3 · Union types discriminados (frontend DPD)
- `GovernanceBlock = GovernanceNominal | GovernanceAggregated | GovernanceUnavailable`.
- `OwnershipBlock = OwnershipNominal | OwnershipAggregated | OwnershipUnavailable`.
- `FinancialAnalysisAssessment` ampliado con `{score, label, assessment, verdict}` (aditivo).

### §5.4 · NAV actual
| Grupo | Item | Ready | Label |
| :---- | :--- | :---- | :---- |
| Perfil | resumen | ✅ | Resumen |
| Perfil | finanzas | ✅ | Finanzas |
| Perfil | valoracion | ✅ | Valoración |
| Perfil | propiedad | ✅ | Propiedad |
| Perfil | gobierno | ✅ | Gobierno |
| Perfil | mercado | ❌ | Mercado |
| Perfil | rankings | ❌ | Rankings *(cableado en Resumen y Finanzas ya · sección aparte no cableada)* |
| Perfil | comparativa | ✅ | Comparativa |
| Inteligencia | senales | ✅ | Cambios relevantes |
| Inteligencia | oportunidades | ✅ | Oportunidades |
| Inteligencia | comite | ❌ | Comité de inversión |
| Inteligencia | sucesion | ❌ | Sucesión |
| Inteligencia | sector | ❌ | Sector & Roll-up |
| Fuentes | eventos | ✅ | Eventos y BORME |
| Fuentes | registros | ❌ | Registros públicos |
| Fuentes | documentos | ❌ | Documentos |

---

## §6. HARDENING backlog

| ID | Descripción | Estado |
| :- | :---------- | :----- |
| HARDENING-001 | Bridging cash_conversion cuando Intel entrega null | ✅ RESUELTO |
| HARDENING-002 | 31 pytests backend con env coupling (mock vs real) | ⏸️ DESPRIORIZADO |
| HARDENING-003 | Rankings passthrough en `_map_analyze` | ✅ RESUELTO |
| HARDENING-004 | TTL automático caché Mongo | 🟡 backlog P2 |
| HARDENING-005 | Cash Flow UI + bridging | ✅ RESUELTO |
| HARDENING-006 | Retirada fallback benchmark/methodology | ✅ RESUELTO |
| HARDENING-007 | Signals shape enriquecido (explanation, evidence, dimensions, rule) | ✅ RESUELTO |
| HARDENING-008 | Resiliencia agregador con fallback per-section | ✅ RESUELTO |
| HARDENING-009 | `governance` shape ampliado con `summary{total, roles[]}` anon | ✅ RESUELTO (B-2.3) |
| HARDENING-010 | `ownership` shape ampliado con `summary{total_shareholders, tier?, top1_pct?}` anon | ✅ RESUELTO (B-2.2) |
| HARDENING-011 | Ampliación mapper para `assessment.verdict` | ❌ NO APLICÓ (mapper ya expone `assessment` completo) |

---

## §7. Bridging fallbacks activos (backend)

| Bloque | Bridging | Motivo | Fuente |
| :----- | :------- | :----- | :----- |
| `finances.cash_flow.bridging.cash_conversion` | Cálculo backend cuando Intel `null` | Cash conversion ratio · fórmula CF operativo / EBIT | HARDENING-001 |
| `finances.ratios.{ebitda_margin, ebit_margin, net_margin, gross_margin}` | Extensión a `0.0` cuando ratio negativo cae a `-0%` | Evita R15 violation en UI | Bundle post-D |

Sin más bridging. Todo lo demás es passthrough puro.

---

## §8. Fallbacks retirados

- `valuation.benchmark` · Intel no lo entrega → sección ya lee `null` → `<Empty/>`.
- `valuation.methodology` · idem.

---

## §9. Escalaciones abiertas hacia Intel

| REQ | Fichero | Prioridad | Estado |
| :-- | :------ | :-------- | :----- |
| `shareholder.type` en `ownership.shareholders[]` | `PARA_INTEL_shareholder_type.md` | P3 | 🟡 pendiente entrega Intel |
| `verdict` en `financial_quality` | `PARA_INTEL_financial_quality_verdict.md` | P2 | ✅ **CERRADO** (Intel entregó vía ruta paralela `finances.assessment.verdict`) |
| `finances.market` pre-cruzado con sector + geo + HHI + position + benchmark_ratios | `PARA_INTEL_market.md` | P2 | 🟡 pendiente entrega Intel · **bloquea sección Mercado** |

---

## §10. Items aparcados (backlog priorizado)

- **P0 pendiente**: alineación env vars prod residuales (anomalías 1+2 del deploy PARTIAL · ver `DEPLOY_PROD_20260810.md`).
- **P1**: Sección Mercado (bloqueada por REQ-INTEL market).
- **P1**: Sección Comparativa multi-empresa (T5-10 nominales por CNAE-division + banda de tamaño · requiere futuro REQ-INTEL comparables).
- **P1**: Registros públicos (NAV item `registros` · fuente Intel pendiente de identificar).
- **P1**: Documentos (NAV item `documentos`).
- **P1**: Sector & Roll-up (NAV item `sector`).
- **P2**: control-synergy (`buyers.count=0` en target).
- **P2**: HARDENING-004 (TTL automático caché Mongo).
- **P2**: HARDENING-002 (31 pytests backend con env coupling · despriorizado).
- **P2**: Retirada fallback `identity.description` (cobertura Intel 1/6).
- **P2 cosmético**: NCR Balance cae al `<Pending>` genérico cuando no hay `analysis.balance_sheet` · unificar con `DebtBreakdownCard` empty state.
- **P3**: REQ-INTEL `shareholder.type` (esperando entrega Intel para reabrir política DPD granular).

---

## §11. Estado de deploy

- **Producción**: `https://beta.arroba.com` · **DESPLEGADO PARTIAL** (2026-08-11 verificado post-factum). Deploy ejecutado por el usuario vía panel Emergent entre turnos.
- **Preview**: `https://musing-hellman-9.preview.emergentagent.com` · **alineado con prod en el path crítico** (mismo tenant Intel `mc_36c100bcee4a` para Servier).
- **Anomalías residuales prod** (aparcadas al próximo ciclo por decisión de usuario):
  1. Legacy tenant divergente en `/section/identity` (`mc_908b00949ee2` vs canónico `mc_36c100bcee4a`) — impacto cero mientras HARDENING-008 fallback no se dispare.
  2. `ENVIRONMENT=development` en `/api/health` — cosmético, sin dependencias funcionales detectadas.
  3. Login test `test.arroba+neo@arroba.com` no sembrado en Mongo prod — E2E auth prod fuera de scope.
- **Verificación completa**: ver `DEPLOY_PROD_20260810.md`.

---

## §12. Cómo verificar (comandos rápidos)

**Preview**:
```bash
curl -s https://musing-hellman-9.preview.emergentagent.com/api/companies/B28184687/ficha | jq .
```

**Prod anon**:
```bash
curl -s -D - https://beta.arroba.com/api/companies/B28184687/ficha | grep -iE "x-ficha-source|x-intelligence-mode|x-provider"
# esperado: X-Ficha-Source: aggregator · X-Intelligence-Mode: real · X-Provider: agency_tool
```

**Prod health**:
```bash
curl -s https://beta.arroba.com/api/health
# esperado: {"status":"ok","mongo":"connected", ...}
```

**Pytest backend**:
```bash
cd /app/backend && python -m pytest tests/intelligence_layer/test_ficha_endpoint.py -v
# esperado: 9 passed
```

**Vitest frontend**:
```bash
cd /app/frontend && yarn test --run
# esperado: 200 passed
```

**Invalidación caché Mongo (dev)**:
```bash
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
async def go():
    db = AsyncIOMotorClient('mongodb://localhost:27017').arroba_com
    r = await db.intelligence_cache.delete_many({'_id': {'\$regex': 'B28184687'}})
    print(f'invalidated {r.deleted_count}')
asyncio.run(go())
"
```

---

## §13. Documentos descargables (todos en `/handoff/`, HTTP 200 en preview)

| Fichero | Propósito | Estado |
| :------ | :-------- | :----- |
| `HANDOFF_CLAUDE_20260810.md` | Este documento · state canónico | ✅ vivo |
| `PLAN_BETA_status_20260810.md` | Status detallado de sprints · matriz consolidada B-2 12/12 | ✅ vivo |
| `DEPLOY_PROD_20260810.md` | Cierre post-factum del deploy · estado PARTIAL · 3 anomalías | ✅ vivo (NUEVO) |
| `PARA_INTEL_shareholder_type.md` | REQ P3 · discriminación tipo accionista | ✅ vivo |
| `PARA_INTEL_financial_quality_verdict.md` | REQ P2 · verdict en financial_quality | ✅ vivo con banner "RESUELTO" (Intel entregó vía `finances.assessment.verdict`) |
| `PARA_INTEL_market.md` | REQ P2 · bloque `finances.market` pre-cruzado | ✅ vivo (NUEVO) |
| `PARA_BETA_TURNO_D_MULTICIF.md` | Matriz coverage multi-CIF diagnóstica | ✅ vivo |
| `PARA_BETA_B24_FICHA_SHAPE.md` | Contrato del agregador `/ficha` | ✅ vivo |
| `PARA_BETA_B2_FASE0_AUDIT.md` | Auditoría Fase 0 endpoints Intel | ✅ vivo |
| `_KEY_ONETIME.txt` | Secreto one-shot para deploy manual | ❌ **BORRADO 2026-08-11 tras deploy exitoso** (HTTP 404 confirmado) |

---

## §14. Próximo paso recomendado para Claude sucesor

**Priorización sugerida** (respetar el orden salvo instrucción explícita del usuario):

1. **P0 · Alineación env vars prod residuales** — actuar sobre las 3 anomalías del deploy PARTIAL (ver `DEPLOY_PROD_20260810.md` § 7). Coordinar con el usuario para tocar el panel Emergent (sustituir key secundaria por canónica `sha256[:8]=2ba91e0d`; setear `ENVIRONMENT=production`; decidir política user test).
2. **P1 · Cablear sección Mercado** cuando Intel armonice el REQ `PARA_INTEL_market.md` (patrón HARDENING-003 ranking + assessment verdict · ~2 h · union type discriminado análogo a `Propiedad`/`Gobierno`).
3. **P1 · Arrancar sección Comparativa multi-empresa**: requiere REQ-INTEL separado para T5-10 comparables nominales por CNAE-division + banda de tamaño.
4. **P1 · Cablear Registros públicos + Documentos + Sector & Roll-up** — 3 items NAV con `ready:false` hoy · pendientes de fuente Intel + copy CF.
5. **P2 · NCR Balance cosmetic** — unificar el fallback semántico cuando no hay `analysis.balance_sheet` con el empty state de `DebtBreakdownCard` (`<Empty/>` "Desglose de deuda en preparación" en lugar del `<Pending>` genérico del tab Balance).
6. **P2 · Backlog HARDENING-004 / retirada fallback identity.description**.

---

## §15. Anexos · snippets de payload real (redactados)

### §15.1 · `finances.assessment` (5 CIFs autenticados · verdicts variados)

```json
Servier (B28184687)   · score=100 · label="Sólida"    · verdict="Perfil financiero sólido y consistente; candidato atractivo para operaciones corporativas."
NCR (B28031458)       · score=70  · label="Aceptable" · verdict="Perfil aceptable apoyado en liquidez holgada (ratio corriente ≥1,5)."
OPEL (B50949346)      · score=60  · label="Aceptable" · verdict="Perfil aceptable apoyado en liquidez holgada (ratio corriente ≥1,5). Vigilar: resultado neto negativo."
PROCOLUIDE (A81921611)· score=85  · label="Sólida"    · verdict="Perfil financiero sólido y consistente; candidato atractivo para operaciones corporativas."
IUSTIME (V83153700)   · score=50  · label="Frágil"    · verdict="Perfil frágil: resultado neto negativo. Requiere análisis y due diligence adicionales."
```

### §15.2 · `finances.ranking` (Servier)

```json
{
  "sector_revenue_percentile": 100,
  "market_position": { "rank": 2, "total": 9, "scope": "sector CNAE + banda de tamaño (0,3x–3x ingresos)" },
  "locality_position": { "rank": 1, "total": 34, "scope": "municipio" },
  "explain": [
    "En el percentil 100 por ingresos de su sector",
    "2ª de 9 en su universo de comparables (sector y tamaño)",
    "1ª de 34 en Madrid por ingresos de su sector"
  ]
}
```

### §15.3 · `governance.summary` (Servier · anon prod)

```json
{
  "available": true,
  "coverage": { "officers_count": 55 },
  "summary": {
    "total": 55,
    "roles": [
      { "role": "apoderado",                "role_label": "Apoderado",                "count": 24 },
      { "role": "representante",            "role_label": "Representante",            "count": 24 },
      { "role": "administrador_solidario",  "role_label": "Administrador Solidario",  "count": 4  },
      { "role": "auditor_de_cuentas_conjunto", "role_label": "Auditor de Cuentas Conjunto", "count": 2 },
      { "role": "auditor",                  "role_label": "Auditor",                  "count": 1  }
    ]
  }
}
```

Nombres nominales de las 55 personas físicas: **omitidos** (DPD).

### §15.4 · `ownership.summary` (Servier · anon prod)

```json
{
  "available": true,
  "coverage": { "shareholders_count": 2 },
  "summary": {
    "total_shareholders": 2,
    "tier": "Control mayoritario",
    "top1_pct": 73.35
  }
}
```

Nombres de accionistas (jurídicos y físicos): **omitidos en anon** (DPD política simplificada).

### §15.5 · `finances.cash_flow` (Servier · autenticado)

Shape multi-año con 6 filas (`operating_activities`, `investing_activities`, `financing_activities`, `free_cash_flow`, `net_change_in_cash`, `cash_conversion`) y 3 columnas (2024/2023/2022). Bridging `cash_conversion` calculado backend (HARDENING-001) cuando Intel entrega `null` en la fila.

### §15.6 · Deploy prod headers (Servier anon)

```
X-Ficha-Source: aggregator
X-Intelligence-Mode: real
X-Provider: agency_tool
X-Content-Type-Options: nosniff
```

---

## Pendientes de confirmación (transparencia)

- **Timestamp exacto del deploy prod**: no disponible desde el agente (Emergent no expone hooks al filesystem). Marcado como "entre 2026-08-10 y 2026-08-11 UTC".
- **sha256 de la key secundaria divergente**: no expuesto (agente no ha leído `.env` prod ni panel).
- **Cobertura Mercado post-armonización Intel**: sub-preguntas P0-5/P0-6 abiertas en `PARA_INTEL_market.md`.
- **Login test prod**: pendiente decisión del usuario sobre siembra en Mongo prod (ver `DEPLOY_PROD_20260810.md § 7.3`).
