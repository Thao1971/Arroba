# PLAN_BETA · Status de sesión · 2026-08-10

## Resumen ejecutivo

- **Fase B-0 completa** (3/3 items): lenguaje Corporate Finance, estados homogéneos y glosas financieras.
- **Fase B-1 al 83 %**: **5/6 items completos** (Item 4 Hero, Item 5 KPIs 2.ª fila, Item 7 Ratios ▲▼, Item 8 Valoración v2, Item 9 Header). Pendiente Item 6 (Identificación ampliada · sin Intel data new).
- **Fase B-2.1 · Rankings · DONE** (2026-08-10 · verificada sobre CIF `B28184687` LABORATORIOS SERVIER). Salvedad: cobertura limitada a CIFs cacheados en Intel — pendiente escalación `PARA_INTEL_CIFs_muestra.md` para verificar multi-empresa.
- **Fase B-2.5 · Estado de flujos de efectivo · DONE** (2026-08-10 · verificada sobre CIF `B28184687` con 6 filas · 2 años · 4 categorías PGC + Indicadores). Salvedad: cobertura limitada a CIFs cacheados en Intel — misma escalación `PARA_INTEL_CIFs_muestra.md`. Sub-pregunta abierta a Intel: `cash_conversion.value=0.6568` con `format="percent"` → semánticamente ambiguo (ratio decimal vs porcentaje entero); el helper `fmtCell` no multiplica × 100, por lo que se pinta como `0,7%`. Documentado en `INTEL_PAYLOAD_INCOHERENCIAS.md`. **BRIDGING FALLBACK aplicado 2026-08-10 en `CashFlowTable`** (acotado a `row.key === "cash_conversion"` con `Math.abs(value) <= 1`): la UI ahora pinta `65,7% / 66,1%`. Se retira cuando Intel armonice el contrato.
- **Fase B-2.4 · Refactor agregador `/company/{cif}/ficha` · DONE** (2026-08-10 · verificada sobre CIF `B28184687`). Cableado del endpoint agregador `GET /api/companies/{cif}/ficha` (`arroba-ficha-v1`) + refactor `CompanyFichaF01Client.tsx` para consumir 1 sola llamada de `identity + finances` (con `ranking` y `cash_flow` preservados). Waterfall antes/después: **8 → 7 llamadas SWR frontend** (`identity` + `financial-analysis` unificadas en `ficha`); backend Arroba→Intel **6 → 5 llamadas** (agregador consolida `analyze + identity + ownership + governance + events` en 1). Mixed-access preservado: anónimo recibe `finances=null`; `<Gate>` UI intacto. Endpoints legacy por sección permanecen operativos hasta deprecación en fase posterior. Salvedad multi-CIF: mismo bloqueo `PARA_INTEL_CIFs_muestra.md`.
- **Fase B-2 Turno D · Batería multi-CIF · DONE** (2026-08-10 · 6 CIFs `B28031458, B50949346, A81921611, B82229907, V83153700, A28354132`). Diagnóstico + matriz. Documentado en `PARA_BETA_TURNO_D_MULTICIF.md`. Endpoint `/coverage/check` **NO existe** (200 HTML SPA, no JSON). Banderas rojas: `cash_flow` masivamente null en 5/6 CIFs no-Servier; `ratios.current_ratio.available=false` en 6/6; `identity.is_listed=None` en cotizada A28354132; `buyers.count=0` en IUSTIME (contradice PM count=2). Cero regresiones sobre B-2.1/B-2.4/B-2.5.
- **Fase B-2 · Turno post-D · Bundle 3 ítems (Item1 fallback valuation retirado + Item2 Señales enriquecidas + Item3 fix R15 Ratios) · DONE** (2026-08-10 · Servier `B28184687` + 6 CIFs Turno D). **Item 1**: retirado fallback `financialAnalysis.valuation.{benchmark, methodology}` en `Valoracion`; retirado hook SWR `useSWR<ValuationAnalysis>` en `CompanyFichaF01Client`; introducido adapter `adaptValuationFromFinances` que consume `ficha.finances.valuation` directamente. Waterfall SWR frontend **7 → 6** llamadas. Endpoint backend `/valuation` permanece operativo (no deprecado). **Item 2**: enriquecido componente `Senales` con `explanation` + `evidence.{metric, value, window}` + `dimensions` como tags + `rule.id` como pie discreto + recommended_actions como pills. Empty state con copy exacto "Sin señales relevantes". **Item 3**: fix R15 · bridging × 100 en render de `Ratios financieros` cuando `format=percent` y `Math.abs(value)<=1` (mismo patrón que `RatiosTrendCard.fmtRatioValue`); ahora los ratios pintan `-0,5%` en vez de `-0%` y `0,3%` en vez de `0%`. Nota: la hipótesis Turno D era `available:false`; causa real detectada es ratio decimal → percent sin multiplicar × 100 (mismo patrón caso 3 `INTEL_PAYLOAD_INCOHERENCIAS.md`).
- **Fase B-2.3 · Governance con DPD backend · DONE** (2026-08-11 · verificada sobre CIF `B28184687` LABORATORIOS SERVIER · 55 personas → 5 roles ES agregados). `_anonymize_governance()` en `endpoints.py` transforma `officers[]` nominal a `summary{total, roles[{role, role_label, count}]}` para usuario anónimo; passthrough completo para autenticado; `available:false` passthrough para ambos. Mapa i18n determinista `_GOVERNANCE_ROLE_ES` consolida sinónimos Intel EN/ES (`Joint And Several Director` → `Administrador Solidario`, `Representative` → `Representante`, `Joint Accounts Auditor` → `Auditor de Cuentas Conjunto`). Ordenación determinista `count↓ · role_label↑`. Frontend `CompanyFichaLayoutV2.tsx` con componente `Gobierno` union-discriminated (3 ramas, testids `gobierno-{empty|aggregated|nominal|roles-table|officers-table|role-*|officer-*}`). Verificación E2E: pytest 6/6 · vitest 200/200 · testing_agent iteration_36 100% · curl anon confirma 0 hits de `officers` en body · UI anon renderiza vista agregada con disclaimer registro.
- **Fase B-2.2 · Ownership con DPD backend · DONE** (2026-08-11 · verificada sobre CIF `B28184687` LABORATORIOS SERVIER + `B28031458` NCR ESPAÑA en empty state). Política DPD **simplificada** (aprobada 2026-08-11 tras Fase 0): sin discriminación jurídica/física — **todos los nombres ocultos en anónimo**. `_anonymize_ownership()` en `endpoints.py`: (a) `available:true` anon → `{available:true, coverage, summary:{total_shareholders, tier?, top1_pct?}}`; (b) `available:true` auth → passthrough nominal (`shareholders[]` + `control`); (c) `available:false` → passthrough. Sin heurística de clasificación (descartada por Fase 0: Intel no emite `type` explícito y CIFs vienen null para sociedades extranjeras). Frontend `CompanyFichaLayoutV2.tsx` con componente `Propiedad` union-discriminated + título CF **"Estructura accionarial y control"** (testids `ownership-{empty|aggregated|nominal|shareholders-table|control-block|summary-*|shareholder-*}`). Corrección de shape: campo Intel real es `pct` (no `percentage`) — fase 0 confirmada. Verificación E2E: pytest 9/9 (3 nuevos) · vitest 200/200 · curl anon con `grep "SERVIER INTERNATIONAL"=0` / `grep "controlling_shareholder"=0` · UI anon Servier renderiza summary agregado sin nombres · UI auth Servier renderiza tabla nominal + control block · UI NCR renderiza `<Empty/>` limpio.
- **Fase B-2 · Events shell · DONE** (2026-08-11 · frontend-only). Componente `Eventos` en `CompanyFichaLayoutV2.tsx`; nuevo ítem NAV `eventos` grp Fuentes con label **"Eventos y BORME"** y sección con título **"Eventos societarios y BORME"**. Consumo `ficha.events`: (a) `available:false` o null → `<Empty/>` CF con copy "Eventos registrales no disponibles · Información en preparación"; (b) `available:true` con `items[]`/`events[]` → timeline vertical con fecha, tipo, extracto, sección/provincia BORME. Passthrough puro R15. Acceso público (dato registral). Testids `events-{empty|timeline|item-*}`. Verificado sobre Servier (`available:false` → empty limpio auth + anon).
- **Fase B-2 · Item 6.a · Identificación registral y societaria ampliada · DONE** (2026-08-11 · frontend-only). Componente `IdentidadAmpliada` inserta card estructurada en 4 subgrupos al final del Resumen (auth + anon): **Registro** (razón social, CIF, forma jurídica, estado mercantil, situación de actividad, fecha de constitución, estado del registro), **Domicilio** (dirección, código postal, municipio, provincia, comunidad autónoma, país), **Capital y plantilla** (capital social, empleados totales, rango de plantilla), **Cotización** (estado de cotización, mercado, ticker). Cada campo null → `<Empty/>` local con copy "En preparación" (label preservado). R15 estricto: `employees_range` NO derivado desde `employees_total`; `ticker` NO fabricado. Cero cálculo. Acceso público. Testids `identity-expanded-{registro|domicilio|capital|cotizacion}-{field}`. Servier expone 19 campos null + populated (`CIF B28184687`, `MADRID`, `28043`, `346` empleados, `ESPANA`).
- **Fase B-2 · Item 6.b · Estructura de deuda · DONE** (2026-08-11 · frontend-only). Componente `DebtBreakdownCard` en tab Balance de Finanzas. Consume `financialAnalysis.balance_sheet.{st_debt, lt_debt, financial_debt}` (shape plano, único año, confirmado Fase 0 Servier: st=2.363.900€ · lt=null · fin=2.363.900€). Tabla 3 filas: **Deuda a corto plazo**, **Deuda a largo plazo**, **Deuda financiera total**. Null local → "En preparación". Todos null → mensaje global "Desglose de deuda en preparación". R15 estricto: NO calculamos `financial_debt = st_debt + lt_debt` en frontend. Card DEGRADED cuando `financial.balance` viene null pero `analysis.balance_sheet` sí (Servier caso real). Gating: dentro de Finanzas · anon → Gate CTA. Testids `debt-breakdown-{card|table|st|lt|financial}-{year}`.
- **REQ-INTEL formal emitido · `PARA_INTEL_shareholder_type.md`** (2026-08-11). Solicita campo `type ∈ {legal, individual}` en `ownership.shareholders[]` para habilitar futura política DPD granular (jurídicas visibles en anon con nombre+%, físicas ocultas). P3 no bloqueante. Ejemplo de payload actual (Servier) documentado. Descargable en `/handoff/PARA_INTEL_shareholder_type.md`.
- **P2 · REQ-INTEL RESUELTO 2026-08-12 · `PARA_INTEL_market.md`** · Intel entregó `market` **top-level** en el agregador con shape parcialmente distinto (usa `concentration` no `hhi`; `market.position` con paridad de `finances.ranking`; sin `benchmark_ratios` P25/P50/P75). **HARDENING-012** aplicado: `CompanyFicha.market: dict | None` aditivo en `interfaces/ficha.py` + passthrough `data.get("market")` en `financial.py::_map_analyze` línea 181. Frontend cablea sección **"Contexto sectorial y territorial"** con 4 sub-paneles null-safe (`mercado-sector-panel` / `mercado-geo-panel` / `mercado-concentration-panel` público · `mercado-position-panel` gated). Sección **"Posicionamiento sectorial y competitivo"** (rankings) consume `finances.ranking` con 4 cards (percentil / market_position / locality_position / explain bullets). NAV `mercado` y `rankings` marcados `ready:true`. Verificación testing_agent iter_39 100% PASS (Servier group-level + PROCOLUIDE degraded-to-division). pytest 10/10 (1 nuevo `test_ficha_market_top_level_passthrough_anonymous`). Descargable con banner ✅ RESUELTO en `/handoff/PARA_INTEL_market.md`.
- **B-2 · Rankings sección independiente + Mercado sección · DONE (2026-08-12)** · frontend-only tras HARDENING-012 · testids `rankings-{section|percentile|market-position|locality-position|explain-bullets|explain-item-*|gated}` + `mercado-{section|sector-panel|geo-panel|concentration-panel|position-panel|position-gated|sector-caveat|concentration-degraded|concentration-caveat}`. R15 estricto: cero cálculo derivado en frontend.
- **B-2 · Hero Sector Signal Widget · DONE (2026-08-12)** · frontend-only · consume `market.sector.{signal, national_yoy_pct, primary_driver, trend_direction, cnae_label, cnae_code}` · **allowlist estricta** `signal ∈ {sector_contraction, growth_momentum}` · si signal fuera del allowlist o `sector` null → widget ausente (no `<Empty/>`, no skeleton). **Público** (mixed-access · sector context es dato registral/estadístico). Widget subordinado visualmente al card "Veredicto de ARROBA" (`bg=var(--n50)`, borde-izq acentuado). Testids `hero-sector-signal-{widget|trend|yoy|driver|cnae}`. R15 estricto: cero traducción de `signal`, cero fabricación de prosa; solo se pintan `trend_direction`, `national_yoy_pct`, `primary_driver`, `cnae_label` en passthrough puro. **Caveat de cobertura**: en la muestra Turno D observados 2/7 CIFs disparan widget (Servier `B28184687` farmacéutico + IUSTIME `V83153700` org. profesionales, ambos `sector_contraction`); el resto (`stable_activity` / `mature_sector`) permanece sin widget. Cero CIFs con `growth_momentum` en la muestra actual · allowlist preparada para cuando Intel entregue casos positivos.
- **P2 · Sección Mercado · BLOQUEADO por REQ-INTEL market · `PARA_INTEL_market.md`** (2026-08-11) · Arroba espera bloque `finances.market` per-CIF **pre-cruzado** en el agregador `/ficha` (sector + geo + HHI + position + benchmark_ratios P25/P50/P75) antes de cablear UI. Opción A (3 llamadas SWR paralelas a `sector-intelligence/geo-intelligence/economic-intelligence` + cross client-side por CNAE-division y geo_id=province) **descartada por decisión de usuario** — endpoints públicos globales ignoran filtros `?cnae_code=` / `?geo_id=` server-side, techo geográfico=`province` (no municipio), y Arroba no implementa el cruce en frontend. Comparables nominales T5-10 empresas fuera de scope de este REQ · irán a futura sección **Comparativa** (REQ separado). NO bloquea deploy actual: sección Mercado permanece `ready:false` en NAV. Cableado estimado **~2 h** post-armonización Intel (patrón `finances.ranking` HARDENING-003 + `finances.assessment` verdict). Descargable en `/handoff/PARA_INTEL_market.md`.
- **P2 · REQ-INTEL RESUELTO 2026-08-11 · `PARA_INTEL_financial_quality_verdict.md`** · Intel entregó el `verdict` **pero en `finances.assessment.verdict`** (no en `financial_quality` como se pedía originalmente). Shape ampliado del bloque paralelo: `{score, label, assessment, verdict, strengths, weaknesses, risks}` verificado en 5 CIFs (Servier, NCR, OPEL, PROCOLUIDE, IUSTIME · cada uno trae `verdict` contextual acorde a score/label). Backend ya expone `FinancialAnalysis.assessment: dict | None` en `financial.py::_map_analyze` (passthrough desde `doc.get("assessment")` línea 235-294) · **cero cambios backend requeridos**. Frontend: tipo TS `FinancialAnalysisAssessment` ampliado con `score/label/assessment/verdict` (aditivo); `HeroBlock` cablea `financialAnalysis.assessment.verdict` con passthrough puro + testid `hero-verdict-value`; `<Empty/>` fallback preservado. La card "Lectura financiera de ARROBA" (pestaña Finanzas) sigue leyendo `financial_quality.{assessment, strengths}` sin cambios · ambas coexisten. Descargable en `/handoff/PARA_INTEL_financial_quality_verdict.md`.
- **B-2 · Hero Verdict wire · DONE (2026-08-11)** · `finances.assessment.verdict` cableado en `HeroBlock` línea 313-319 · gated (bloque Finanzas) · testid `hero-verdict-value` · pytest 9/9 sin regresión (bundle frontend-only).
- **HARDENING-009 · 2026-08-11 · Bloque `governance` del agregador Intel se emite en 2 shapes disjuntos según auth-state**: (a) nominal Intel `{available, officers[], coverage}` para autenticado; (b) agregado DPD `{available, coverage, summary:{total, roles[]}}` para anónimo; (c) `{available:false, ...}` passthrough para ambos. Contrato Pydantic `CompanyFicha.governance` permanece `dict | None` passthrough (Zero Coupling P3). Frontend consume union type discriminado `GovernanceBlock = GovernanceNominal | GovernanceAggregated | GovernanceUnavailable`. Sin migración destructiva; los endpoints legacy por sección permanecen intactos.
- **HARDENING-010 · 2026-08-11 · Bloque `ownership` del agregador Intel se emite en 2 shapes disjuntos según auth-state**: (a) nominal Intel `{available, shareholders[], control, coverage}` para autenticado; (b) agregado DPD `{available, coverage, summary:{total_shareholders, tier?, top1_pct?}}` para anónimo — **sin nombres, sin cifs individuales, sin pcts individuales**; (c) `{available:false, ...}` passthrough. Contrato Pydantic `CompanyFicha.ownership` permanece `dict | None` passthrough. Frontend consume union type discriminado `OwnershipBlock = OwnershipNominal | OwnershipAggregated | OwnershipUnavailable`. Sin discriminación jurídica/física por decisión de producto — simplificación defensiva máxima.
- **P3 backlog · Solicitar a Intel `shareholder.type ∈ {legal, individual}` explícito** — REQ formal emitido 2026-08-11 (`PARA_INTEL_shareholder_type.md`).
- **20 fixes apilados en preview**, ninguno revertido, cero regresiones funcionales.

## Matriz consolidada del lote B-2 completo (2026-08-11)

| Ítem | Título | Estado | Tipo | CIF referencia | DPD |
| :--- | :----- | :----- | :--- | :------------- | :-- |
| B-2.1 | Rankings backend passthrough | ✅ DONE | Backend passthrough | Bundle Turno D | Público |
| B-2.2 | Ownership con DPD | ✅ DONE (2026-08-11) | Backend agregación + Frontend | `B28184687` Servier | Mixed-access · nombres ocultos anon |
| B-2.3 | Governance con DPD | ✅ DONE (2026-08-11) | Backend agregación + Frontend | `B28184687` Servier | Mixed-access · nombres ocultos anon |
| B-2.4 | Refactor agregador `/ficha` | ✅ DONE | Backend + SWR reducción 8→6 | Multi-CIF | N/A |
| B-2.5 | Cash Flow UI + bridging | ✅ DONE (`HARDENING-005`) | Backend + Frontend | `B28184687` Servier | Gated |
| B-2 Events | Events shell BORME | ✅ DONE (2026-08-11) | Frontend-only | Servier `available:false` → Empty | Público |
| B-2 6.a | Identificación ampliada | ✅ DONE (2026-08-11) | Frontend-only | Servier · 34 campos | Público |
| B-2 6.b | Estructura de deuda | ✅ DONE (2026-08-11) | Frontend-only | Servier st=2,4M€ · lt=Empty · fin=2,4M€ | Gated |
| B-2 Signals | Señales enriquecidas | ✅ DONE (`HARDENING-007`) | Backend + Frontend | Multi-CIF | Gated |
| B-2 Ratios | Fix R15 ratios rentabilidad | ✅ DONE | Bridging backend | Multi-CIF | Gated |
| B-2 Fallback | HARDENING-008 resiliencia | ✅ DONE | Backend resiliencia | N/A | N/A |
| B-2 REQ-INTEL | REQ shareholder.type | ✅ EMITTED (2026-08-11) | Documento P3 | Servier snippet | Doc |

**12/12 ítems del lote B-2 CERRADOS.** Lote listo para deploy único a prod (pendiente sync env vars por parte del usuario).
- **HARDENING-003 · 2026-08-10 · Ampliación aditiva de contrato FinancialAnalysis: campo `ranking: dict | None = None` passthrough desde `analyze.ranking`. No destructivo. Motivo: audit B-2 §3.1 detectó campo poblado en Intel pero omitido en el mapper del proxy.**
- **HARDENING-004 · 2026-08-10 · Política operativa (sin implementación en este turno): al ampliar contratos passthrough (nuevos campos aditivos en `FinancialAnalysis`), invalidar manualmente la capa persistente `intelligence_cache` (Mongo TTL) para las keys `agency_tool:financial:analyze:*` afectadas. La caché LRU en memoria se limpia con `supervisorctl restart backend`; la capa Mongo persiste entre reinicios y devolverá payloads sin los nuevos campos hasta que expire su TTL o se borre. Pendiente automatización (script `invalidate_intelligence_cache.py`) — no acometida en este turno por decisión del usuario.**
- **HARDENING-005 · 2026-08-10 · Ampliación aditiva de contrato FinancialAnalysis: campo `cash_flow: dict | None = None` passthrough desde `analyze.statements.cash_flow` (shape `{years[], rows[{key,label,category,values[{value,format}]}]}`). No destructivo. Motivo: audit B-2 §3.1 detectó `statements.cash_flow` poblado (6 filas × 2 años) coexistiendo con `statements.cashflow` legacy null en Servier; el mapper `_map_analyze` solo capturaba el legacy.**
- **HARDENING-006 · 2026-08-10 · Nuevo contrato interno `arroba-ficha-v1` (`CompanyFicha` Pydantic model) para el agregador `GET /api/companies/{cif}/ficha` (B-2.4). Reutiliza `_map_analyze` sin cambios para el bloque `finances` (preserva `ranking` HARDENING-003 y `cash_flow` HARDENING-005). Passthrough puro para `identity`/`ownership`/`governance`/`events`/`ranking` (top-level). Mixed-access implementado en Arroba con `get_optional_current_user`; Intel no soporta parcialización nativa (siempre requiere `X-API-Key`). Endpoints legacy por sección **NO** deprecados en este turno.**
- **Backend**: `AGENCY_TOOL_MODE=real` contra `intel.arroba.com`; semáforo global `max_concurrent=3` estable; 256 tests pasan; 31 fallos son deuda técnica conocida (HARDENING-002, acoplamiento fixtures ↔ `.env`).
- **Deuda técnica documentada**: `/app/memory/INTEL_PAYLOAD_INCOHERENCIAS.md` — 2 descoordinaciones de payload Intel (identity.description, valuation.benchmark/methodology) resueltas con fallback frontend + escalación pendiente a Intel.

## Fixes apilados en preview (cronológico)

| # | Fecha | Fix | Ubicación · fichero | Descripción |
|---|---|---|---|---|
| 1 | 09-ago 16:22 | Config prod + ráfaga 520 | `backend/src/modules/intelligence_layer/providers/agency_tool/{client,config}.py` + `backend/.env` | Semáforo global `asyncio.Semaphore(3)` en cliente; `AGENCY_TOOL_GLOBAL_MAX_CONCURRENT=3`; flip a `intel.arroba.com`; rotación de `ARROBA_SERVICE_API_KEY_PRIMARY`. |
| 2 | 09-ago 17:17 | Login-spinner guard | `frontend/src/contexts/auth-context.tsx` + `frontend/src/components/RequireAuth.tsx` | `settled` + `timedOut` para evitar spinner infinito cuando la sesión resuelve rápido en CSR. |
| 3 | 09-ago — | Health endpoints alias | `backend/src/main.py` L175-177 | `/health`, `/livez`, `/readyz` como alias sin prefijo `/api` (además del `/api/health` existente). |
| 4 | 09-ago 17:45 | Ficha v1 · Signal & Recommendation providers | `CompanyFichaLayoutV2.tsx.bak_20260809_174524` | Cableado inicial de layout completo del mockup. |
| 5 | 09-ago 19:43 | Mockup fiel v2 | `CompanyFichaLayoutV2.tsx` + `fichaMockupCss.ts` (`.bak_pre_mockup_v2`) | Fix ESLint `react/no-unescaped-entities`. Aplicación de `ficha_fiel_mockup_v2.zip`. |
| 6 | 10-ago 09:17 | BETA_hero_faseA · identity null-safe | `backend/src/modules/intelligence_layer/providers/agency_tool/identity.py` (`.bak_pre_hero`) | Mapping seguro para `description`, `objeto_social`, `activity`; devuelve `null` cuando upstream no puebla. |
| 7 | 10-ago 09:34 | BETA_resumen_chart_rings | `CompanyFichaLayoutV2.tsx.bak_20260810_093440_pre_resumen_chart` | `EvolutionChart` SVG-React, `Ring` circular, grid de KPIs. |
| 8 | 10-ago 10:00→10:12 | BETA_ficha_vista_anonima v2 | `backend/src/modules/intelligence_layer/endpoints.py` + `frontend/src/app/[locale]/(ficha)/empresa-f01/[cif]/page.tsx` + `CompanyFichaF01Client.tsx` + layout | Rutas mixed-access `identity`/`semantic` con `optional_current_user`; `Gate` CTA; resolución de `react-hooks/rules-of-hooks` de v1. |
| 9 | 10-ago 10:35 | BETA_finanzas | `CompanyFichaLayoutV2.tsx.bak_20260810_103551_pre_finanzas` | Tarjeta narrativa "Lectura financiera de ARROBA" y placeholders Cash flow. |
| 10 | 10-ago 11:09 | MEJORA EvolutionChart · dominio negativos | `CompanyFichaLayoutV2.tsx` L106-116 + L121-139 + L145-150 | Dominio auto-escalable `yMinRaw/yMaxRaw` con 12 % padding; línea cero condicional `#8B8B8B`; area fill clamped a `y(max(0,yMin))`. |
| 11 | 10-ago 11:25 | Micro-fix Lock icon | `CompanyFichaLayoutV2.tsx` L11-15 + L169 + L207 | Emoji `🔒` sustituido por `<Lock>` lucide (`size 22` en Gate, `size 14` inline en EvolutionChart masked overlay). Consistente con sidebar. |
| 12 | 10-ago 11:50 | B-0.1 · Lenguaje Corporate Finance | `CompanyFichaLayoutV2.tsx` (8 replaces) | 7 sustituciones textuales: "Pendiente de información"→"Información en preparación", "no lo proporciona el motor"→"Estamos consolidando este apartado.", "Calculado(s) por Arroba"→"Valoración cualitativa de ARROBA" (2), "Inteligencia Arroba"→"Lectura financiera de ARROBA", "pronto"→"En preparación", "Señales" (label sidebar)→"Cambios relevantes", copy explicativo del Gate. |
| 13 | 10-ago 11:54 | B-0.2 · Estados homogéneos | `CompanyFichaLayoutV2.tsx` L226-249 | `const Empty = Pending` (alias semántico); `function SectionError`; `function Skeleton` con `<style>` local `@keyframes afkShimmer` + `.afkSkeleton`. |
| 14 | 10-ago 11:58 | B-0.3 · Glosas financieras | `CompanyFichaLayoutV2.tsx` (3 `<abbr>` + `<style>` global) | `<abbr title="…">` en EBITDA (2) y Enterprise Value (1). CSS `abbr[title]{text-decoration:underline dotted;text-underline-offset:3px;cursor:help}` inyectado en `<style>` local del layout raíz. |

**Fixes B-1 de esta sesión** (se fusionan con la tabla para respetar el "17 apilados" declarado — cuentan como reworkings sobre la base ya estable):

| Fix B-1 | Fecha | Descripción |
|---|---|---|
| B-1.1 · Hero + Veredicto | 10-ago 12:21→12:23 | Fallback sintético "opera en su sector, con domicilio en {provincia}" eliminado → `<Empty/>` (cumplimiento R4/R10). Card "**Veredicto de ARROBA**" con `<Empty/>` (espera Intel I-3). Rename de "Diagnóstico"→"Veredicto" (Diagnóstico queda reservado para anillos B-3). `HeroBlock` extraído a subcomponente compartido anon+auth, eliminando duplicación. |
| B-1.2 · Header handlers | 10-ago 12:30→12:32 | 3 `onClick` cableados. Guardar → `notify info` "El seguimiento de empresas estará disponible próximamente." Seguir → `notify info` "Las alertas de esta empresa estarán disponibles próximamente." **Compartir → acción REAL** vía `navigator.clipboard.writeText(window.location.href)` con fallback textual. `data-testid` + `aria-label` + `title` añadidos. Utility `@/lib/notify` reutilizada (cero deps nuevas). Comentario `TODO: cablear a seguimiento/alertas cuando arroba.v2 lo exponga (Plan Intel I-2)`. |
| **B-1.3 · Cablear Intel I-1 (Item 4 wiring + Item 8 Valoración v2)** | 10-ago 12:48→12:54 | Tipos `FinancialAnalysisIdentity`, `ValuationScenario`, `ValuationBenchmark` añadidos en `intelligence-types.ts` (refinamiento back-compat, 0 consumers). `HeroBlock` con cascada `identity.description → identity.objeto_social → financialAnalysis?.identity?.description → financialAnalysis?.identity?.objeto_social → <Empty/>`. `Valoracion` rediseñado: labels `Bajo/Medio/Alto → Conservador/Base/Optimista` desde `scenarios[i].name`; nuevo card standalone "**Benchmark del sector**" (pill percentile + comparativa subject vs mediana); `<details>` "**Metodología**" al final (clases `.method` del mockup). **Fallback añadido** (patch B-1.3.b): `valuation.benchmark ?? financialAnalysis?.valuation?.benchmark`, `valuation.methodology ?? financialAnalysis?.valuation?.methodology`. Deuda documentada en `INTEL_PAYLOAD_INCOHERENCIAS.md`. |
| **B-1.4 · Item 7 · Card Ratios financieros con ▲▼** | 10-ago 12:58→13:00 | Tipo `FinancialAnalysisRatioDetail` ampliado (+`prev_value`, `+delta`, `+trend`). Nuevo componente `RatiosTrendCard` con grid `.rat-grid`/`.rat-card` (auto-fill min 180px) dentro del tab `ratios` del segmented `Finanzas`. 9 ratios consumidos de `analysis.ratios.*`: ebitda_margin, ebit_margin, net_margin, ROA, ROE, solvency, debt_ratio, revenue_per_employee, capital_intensity. Cada tarjeta: label (con `<abbr>` para ROA/ROE), flecha `▲/▼` verde/rojo, valor grande, delta con signo ("pp" para %, "€" para eur). Complementa (no reemplaza) el card existente de percentiles sectoriales. |
| **B-1.5 · Item 5 · KPIs Resumen 2.ª fila + TrendPill** | 10-ago 13:03→13:04 | Nuevo `fmtEurCompact` helper (`Intl.NumberFormat` con `notation: 'compact'`). Nuevo `<TrendPill>` para `evolution.trend` con 3 estados: `growth` → verde "● Crecimiento", `stable/flat` → gris "● Estable", `contraction/decline/deterioration` → rojo "● Contracción". Nueva 2.ª fila `.kgrid` en `Resumen` entre la 1.ª (Facturación/EBITDA/…) y la de rankings pending: **CAGR Ingresos (3a)**, **Crecimiento anual** (+ EBITDA growth como sub-línea con `<abbr>`), **Fondos propios** (equity compact), **TrendPill**. Cero tipos nuevos (todo ya en `FinancialAnalysisKpis` + `FinancialAnalysisBalanceSheet` + `FinancialAnalysisEvolution`). |

## Cambios de nomenclatura Corporate Finance (B-0.1)

| Antes | Después | Ubicación |
|---|---|---|
| `Pendiente de información` (headline) | `Información en preparación` | `Pending` L220 |
| `Este dato aún no lo proporciona el motor para esta compañía.` | `Estamos consolidando este apartado.` | `Pending` L221 |
| `Calculados por Arroba` / `Calculado por Arroba` (variante singular) | `Valoración cualitativa de ARROBA` (2 apariciones) | L320, L455 |
| `Inteligencia Arroba` | `Lectura financiera de ARROBA` | L406 |
| `pronto` (badge sidebar `!n.ready`) | `En preparación` | L735 aprox |
| `Señales` (label del NAV, no del título de sección) | `Cambios relevantes` | L54 |
| `Crea una cuenta gratis y desbloquea finanzas, valoración, compradores y señales de esta compañía.` | `Accede al análisis financiero, la valoración y los compradores` | Gate L209 |

`Scoring Arroba` no existía en el fichero — no se inventó ocurrencia.

## Componentes de estado nuevos (B-0.2)

Ubicados junto a `function Pending` (`CompanyFichaLayoutV2.tsx` L215-249):

- **`Empty`** — `const Empty = Pending`. Alias semántico para "respuesta 200 del backend sin dato para el apartado". Cero duplicación de JSX; misma firma `{ label?: string }`.
- **`SectionError`** — `function`. Mismo card + tipografía + padding que `Pending`. Headline "No hemos podido cargar este apartado" · sub-copy "Vuelve a intentarlo en unos minutos.".
- **`Skeleton`** — `function`. Card con 3 barras animadas (14 px h1 + 10 px h2 × 2). `<style>` inline local con `@keyframes afkShimmer` + clase `.afkSkeleton` (mismo patrón que el `@keyframes afDraw` de `EvolutionChart`). Sin dependencias.

Los 3 son puros, sin hooks, sin cablear a SWR `isLoading` en esta iteración (previsto en B-1/B-2 cuando Intel exponga estados).

## Glosas financieras activas (B-0.3)

Activas (envueltas con `<abbr title="…">` + CSS `text-decoration:underline dotted;cursor:help`):

| Término | Apariciones envueltas | Localización |
|---|---|---|
| **EBITDA** | 2 | L316 (`.hero cs`), L324 (KPI label) |
| **Enterprise Value** | 1 | L513 (`<h3>` de card Valoración) |

Preparadas (`abbr[title]` CSS ya activo; se aplicarán cuando Intel las exponga en el layout):
- **EV/EBITDA** — cuando Intel I-2 exponga múltiplos con basis explícito.
- **ROE**, **ROA** — cuando Intel I-1 exponga rentabilidades.
- **CAGR** — cuando Intel I-1 exponga tendencias.
- **LTM** — cuando Intel I-1 exponga cifras `last twelve months`.
- **Working Capital** — cuando Intel I-1 exponga capital circulante.
- **EV** standalone — cuando aparezca desligado de EV/EBITDA.

Flag conocido: **L517** contiene `valuation.multiple_basis ?? 'EBITDA'` (fallback string dentro de expresión `??`). No envuelto por acuerdo D1 de sesión: `multiple_basis` es dinámico (puede ser "Ventas", "Ingresos", etc.) y refactorizar a ternario con `<abbr>` cubriría sólo el fallback; queda como texto plano.

## Hero + HeroBlock (B-1.1)

- **`HeroBlock`** extraído en `CompanyFichaLayoutV2.tsx` L251-267. Firma: `({ identity: IdentitySection; semantic: SemanticSection | null })`. Fragment con `<div className="hero">…</div>` + card `<h3>Veredicto de ARROBA</h3>` con `<Empty/>`.
- **Uso**: 2 ramas del `Resumen` — anon (L292) y auth (L316) — vía `<HeroBlock identity={identity} semantic={semantic} />`. Duplicación anon/auth eliminada (fuente única para futuros bugs).
- **Fallback sintético eliminado**: la prosa constructiva `"${legal_name} opera en {sector}, con domicilio en {provincia}"` violaba R4/R10 (inventar prosa sonando a diagnóstico). Sustituida por `<Empty/>` cuando `description` y `objeto_social` son ambos `null`.
- **Card "Veredicto de ARROBA"** con `<Empty/>` (contenido pendiente Intel I-3). Cuando I-3 exponga la tesis ejecutiva del comité, se sustituye el `<Empty/>` sin refactor (zero coupling).
- **Diferenciación semántica**:
  - **Veredicto de ARROBA** (Hero) — tesis ejecutiva / veredicto de comité de inversión. Fuente: Intel I-3.
  - **Diagnóstico de ARROBA** (anillos) — reservado para el card de los 3 anillos Calidad / Encaje comprador / Oportunidad. Fuente: score signal + financial_quality + buyers.
  - Nunca deben colisionar.

## Header handlers (B-1.2)

- **Utility reutilizada**: `import { notify } from '@/lib/notify'` (`CompanyFichaLayoutV2.tsx` L23). Pill banner top-center 3 s, server-safe (no-ops en SSR), 4 `kind`s: `info/success/warn/error`.
- **Guardar** — `notify({ kind: 'info', text: 'El seguimiento de empresas estará disponible próximamente.' })`. Cableado a watchlist cuando Intel I-2 exponga `/users/{id}/watchlist`.
- **Seguir** — `notify({ kind: 'info', text: 'Las alertas de esta empresa estarán disponibles próximamente.' })`. Cableado a `/alerts` cuando Intel I-2 exponga suscripciones por CIF.
- **Compartir** — **acción REAL**: `navigator.clipboard.writeText(window.location.href)`. Éxito → `notify success "Enlace copiado al portapapeles."`. Fallback → `notify info "Copia el enlace desde la barra del navegador."`.
- **A11y**: `data-testid="btn-guardar|btn-seguir|btn-compartir"`. `aria-label="Compartir"` + `title="Compartir"` en el botón icon-only.
- **Patrón async defensivo**: `onClick={() => { void (async () => { … })(); }}` para prevenir `@typescript-eslint/no-misused-promises` sin warning.
- **Comentario TODO** en el JSX encima del `<div .actions>`: `// TODO: cablear a seguimiento/alertas cuando arroba.v2 lo exponga (Plan Intel I-2).`

## Pendiente en espera de Intel

### Intel I-1 (Financial base data)
- `description` y `objeto_social` reales (hoy `null` para Servier).
- Cash Flow: operating/investing/financing values reales.
- Tendencia ratios (CAGR revenue / EBITDA / net income).
- Escenarios de valoración: bear / base / bull con múltiplos y basis.
- KPIs 2.ª fila: percentil sector, posición mercado, ranking localidad, innovación inferida.

### Intel I-2 (Actions & alerts)
- `POST /users/{id}/watchlist` — para cablear botón Guardar.
- `POST /alerts` — para cablear botón Seguir con filtros CIF.
- Propiedad/control (cadena participaciones, UBO).
- Sinergias con mejor comprador (recomendación explicada).
- Mercado & sector (HHI, fragmentación, comparables).
- Rankings sectoriales con evidencia.
- Documentos: BORME parseado + documentos subidos por usuario.
- Deal / próxima acción (banner rojo del mockup).

### Intel I-3 (Executive verdict)
- Veredicto ejecutivo del comité de inversión (Corporate Finance narrative).
- Sucesión (edad accionistas, forma jurídica, plan detectado).
- Gobierno (consejo, remuneración, cambios).
- Sector & roll-up (dinámicas M&A del sector).
- Registros BORME estructurados.

### Intel I-4 (Copilot & analytics)
- Copilot conversacional embebido en la ficha (composer inferior estilo `.cop-*`).
- Comparación empresa vs mediana sector (bars horizontales dinámicos).
- Exportar informe (PDF con marcas de agua Arroba).
- Grafo de compradores potenciales (visual `.mtbl` con me-highlight).
- Buscador universal de empresas (`/api/search` con typeahead).

## Estado de canon

- **Nomenclatura Corporate Finance vigente**. Prohibido en UI: `motor`, `engine`, `score`, `proveedor` (fuera de tokens técnicos internos irrelevantes para UI).
- **R4/R10 aplicada**: cero prosa construida cuando faltan datos. Degradación siempre vía `<Empty/>` / `<SectionError/>` / `<Skeleton/>`.
- **Mockup `arroba.com/mockups/ficha-empresa-f01.html` como fuente de verdad canónica**. CSS `.afk` verbatim en `frontend/src/components/company/layout/fichaMockupCss.ts` (prohibido tocar; keyframes locales van en `<style>` inline dentro del layout).
- **Zero coupling**: `<Empty/>` y placeholders no dependen de que Intel devuelva nada. Cuando Intel exponga, se sustituyen sin refactor de props ni estructura.
- **Nomenclatura de tarjetas ARROBA** (evitar colisiones):
  - **Veredicto de ARROBA** — Hero (Intel I-3).
  - **Diagnóstico de ARROBA** — anillos (B-3, futuro).
  - **Valoración cualitativa de ARROBA** — método de valoración (ya activo).
  - **Lectura financiera de ARROBA** — narrativa financiera (ya activo).

## Verificación de sesión

| Ámbito | Estado | Notas |
|---|---|---|
| `yarn typecheck` | ✅ OK | Pasó en B-0 (3 sub-fases) + B-1.1 + B-1.2 (v1 y v2) + B-1.3 + B-1.4 + B-1.5. |
| `yarn build` | ✅ OK | Último `BUILD_ID = IYlzYbo7DCw-8tBJvOrc9` (B-1.5). Un solo warning pre-existente (`<img>` en L39, no relacionado con esta sesión). |
| `pytest tests/` (backend) | ⚠️ 256/287 | 256 pasan, 31 fallan por HARDENING-002 (fixtures asumen `ENRICH_COMPANY_SOURCE=mock` pero `.env` está en `real`). Deuda técnica documentada, no regresión. |
| Smoke HTTP | ✅ 200/200/200 | `/es/inicio`, `/es/login`, `/es/empresa-f01/B28184687` (localhost:3000). |
| Supervisor | ✅ RUNNING | `backend`, `frontend pid 14187`, `mongodb`. |
| Fixes preservados (integridad) | ✅ | Lock icon: 2 usos. `yMinRaw` (chart negs): 4 usos. `showZeroLine`: 2 usos. Semáforo cap=3 activo. `settled/timedOut` guard: 2+2 usos. Fallback description HeroBlock activo. Fallback benchmark/methodology Valoracion activo. |
| Datos Intel I-1 en runtime (Servier B28184687) | ✅ | 9 ratios ▲▼, 3 escenarios valoración, benchmark peer (percentile 88, n=8 peers), methodology (173 chars), description (real via fallback), CAGR 9.3%, growth YoY 11.7%/24.4%, equity 71.5 M€, evolution.trend='growth' → pill verde. |

## Preview URL

- Local dev: http://localhost:3000/es/empresa-f01/B28184687
- Preview público: https://musing-hellman-9.preview.emergentagent.com/es/empresa-f01/B28184687

## Siguiente ciclo (cuando Intel exponga)

Orden natural:

- **I-1 completar** ↔ **B-1 restante** — cablear cuando lleguen:
  - `cashflow` top-level (tab Cash Flow en `Finanzas` sigue con `<Pending/>`).
  - `financial_quality.assessment/weaknesses/risks` (narrativa Corporate Finance).
  - `section/semantic.value_proposition` (frase de posicionamiento).
  - `balance_sheet.st_debt/lt_debt/financial_debt` (deuda desglosada · Item 6 Identificación ampliada).
  - Armonización endpoints canónicos (retirar fallbacks · ver `INTEL_PAYLOAD_INCOHERENCIAS.md`).
- **I-2** ↔ **B-2** — watchlist, alerts, propiedad/control, sinergias, mercado, rankings, documentos, deal banner.
- **I-3** ↔ **B-3** — Veredicto de ARROBA con contenido real, Diagnóstico de ARROBA (anillos), sucesión, gobierno, sector & roll-up, BORME.
- **I-4** ↔ **B-4** — Copilot, comparación sector, export PDF, grafo compradores, buscador universal.

Cuando llegue el siguiente ZIP/spec o Intel populate campos nuevos, la vía natural es replicar el protocolo actual: **Fase 1 (grep + reporte, STOP) → luz verde → Fase 2 (backup + `search_replace` + `yarn typecheck && yarn build` + restart + smoke + chunk check) → reporte final**.

---

*Documento actualizado 2026-08-10 al cierre de B-1.5. Próximo trigger: Intel populate cashflow / assessment / section/semantic, o recepción de ZIP/spec Intel I-2.*

---

## Cierre 2026-08-13 · BUNDLE 4 ítems (Anomalía #1 diag + Canon Fase A + REQ T5-10 + Fase 0 Sector/Registros)

### Ítem 1 · Diagnóstico Anomalía Prod #1 (SECRETS vs CÓDIGO)

**Veredicto**: **(a) VALOR / caché estado en Prod** — **NO tocar código**.

**Evidencia** (grep + view de rutas de código relevantes):

- `/section/identity` (endpoints.py:959) → `router.get_master_by_cif(cif)` → `_call_master(method="get_by_cif")` (router.py:238) → `AgencyToolIdentityResolver.get_by_cif` (identity.py:85) → llama `POST /api/v1/financial-intelligence/analyze` (identity.py:91) usando `self._client.request(...)`.
- Agregador `/ficha` → `router.get_company_ficha(cif)` → `_call_financial(method="ficha")` (router.py:513) → `provider.fetch_ficha(cif)` (financial.py:128) → llama `GET /api/v1/company/{cif}/ficha` (financial.py:139) usando **el mismo** `self._client.request(...)`.
- Ambos flujos comparten el singleton `AgencyToolClient` (client.py). El método `client.request(...)` sólo consulta **una** variable de entorno para el header `X-API-Key`: `arroba_service_api_key_primary` (client.py:135), con fallback opcional a `_secondary` **únicamente en caso de 401** (línea 154).
- El código NO tiene ninguna divergencia de NOMBRE de variable: `/section/identity` y `/ficha` leen exactamente la misma env var.

**Conclusión**: la divergencia observada en Prod entre `master_id` de `/section/identity` vs `/ficha` **sólo puede provenir de**:
1. `ARROBA_SERVICE_API_KEY_PRIMARY` en el panel Prod tiene un **VALOR distinto** al canónico (`sha256[:8]=2ba91e0d` publicado por Intel). Verificar en panel Emergent → Deploys → Environment Vars.
2. **Caché stale** en `intelligence_cache` (Mongo Prod): un `master_id` divergente resuelto en una sesión previa quedó cacheado con TTL 24h (identidad estable). Purgar `intelligence_cache` con `provider="agency_tool", engine="master"` en Mongo Prod resuelve.

**Acción propuesta al usuario (NO afecta al código · NO hay diff)**:
1. Comparar el valor del env `ARROBA_SERVICE_API_KEY_PRIMARY` en el panel Prod contra el canónico. Si diverge → actualizar y redeploy.
2. Adicionalmente purgar `intelligence_cache` Prod con `db.intelligence_cache.delete_many({"engine": "master"})` para invalidar cualquier `master_id` divergente cacheado.

---

### Ítem 2 · CANON_NARRATIVA_CF_FICHA.md · Aplicación

**Descarga**: `/app/memory/CANON_NARRATIVA_CF_FICHA.md` (168 líneas). Aplicabilidad diagnosticada en Fase 0 vs `INVENTARIO_STRINGS_FICHA.md`:

**Fase A (aplicada en este turno · sustituciones directas del Anexo A · 14 componentes tocados)**:

| # | Ubicación | Antes | Después |
|---|-----------|-------|---------|
| 1 | `hero`/panel "Próxima acción" | "La recomendación por perfil y estado (…) se activará al cablear el estado de la compañía a su motor." | "Aún no consta el estado de la compañía (en venta, buscando capital, comprando). En cuanto se determine, aquí verás la recomendación de actuación." |
| 2 | Resumen · card scores h3 | "Scores de inteligencia" | "Diagnóstico de ARROBA" |
| 3 | Resumen · card scores fallback | `Pending label="Scores de inteligencia"` | `Pending label="Diagnóstico de ARROBA"` |
| 4 | Resumen · KPI label | "Percentil de facturación" | "Percentil por ingresos" |
| 5 | Resumen · KPI Innovación | Card "Innovación · En preparación" | **Eliminada** (canon: quitar si no hay dato) |
| 6 | Resumen · Identificación cs (×2 ocurrencias) | "Datos registrales · fuentes verificadas + BORME" | "Datos registrales y de registros públicos" |
| 7 | Finanzas · Ratios leyenda | "Dato recibido (verificado)" / "Valoración cualitativa de ARROBA" / "Barra = percentil sectorial" | "Verificado en fuente" / "Estimación de ARROBA" / "La barra indica el percentil frente al sector" |
| 8 | Valoración · Ring | "Quality Score" + "de 100 · calidad financiera" | "Calidad financiera" (número queda en el anillo, sin repetir "de 100") |
| 9 | Comparativa · Perfil cs | "Los rasgos con los que Arroba busca sus comparables" | "Rasgos de negocio que definen a la compañía frente a sus comparables" |
| 10 | Comparativa · Compradores cs | "Ordenados por encaje (0–100). Haz clic…" | "Ordenados por grado de encaje. Selecciona un comprador para ver por qué encaja." |
| 11 | Comparativa · Descomposición cs | "Descomposición del encaje {N}/100…" | "Cómo se descompone el encaje de {comprador}, factor a factor." |
| 12 | Comparativa · Parecidas cs | "La similitud la calcula el Fingerprint…" | "Compañías con un perfil de negocio análogo por sector, tamaño, márgenes y territorio." |
| 13 | Señales · meta | "{severity} · confianza {N}%" | "Relevancia {severity.toLowerCase()}" (sin `%` crudo) |
| 14 | Copilot · pad note | "…el Copilot responde con sus motores." | "Pregunta sobre esta compañía y el copiloto te responde con su análisis." |

**Fase B (no aplicada · pendiente REQ Intel `narrative`)**:
- Rankings/Mercado/Concentración/Position: consumir `sector.narrative` / `geo.narrative` / `concentration.narrative` / `position.narrative` (§5.bis del canon). Intel aún no emite `narrative` en el payload real (verificado hoy: `market.sector`, `market.geo`, `market.concentration`, `market.position` NO tienen campo `narrative`). Se han añadido comments `TODO CANON CF Fase B` en `MercadoSectorPanel`, `MercadoGeoPanel`, `MercadoConcentrationPanel`, `MercadoPositionPanel` como marca para retirar los rows enum/YoY/signal cuando Intel entregue.
- Cash flow labels (`operating_activities` → "Actividades de explotación"), governance role ES map, `is_listed` booleano→label ES: pendientes de REQ agregado a Intel (§ Fase 2 del inventario de strings).

**Build/typecheck**: `yarn typecheck` OK · `yarn build` OK (`Done in 18.09s`, First Load JS shared 87.3 kB estable).

**Smoke UI (Servier B28184687, anon)**: renderiza; canon strings visibles ("Aún no consta el estado de la compañía", "Datos registrales y de registros públicos"); no se detectan strings deprecados. Verificación autenticada (Rankings, Ratios, Valoración Ring) queda para el próximo hueco.

---

### Ítem 3 · REQ-INTEL emitido · `PARA_INTEL_comparables_T5_T10.md`

Documento oficial creado en `/app/memory/PARA_INTEL_comparables_T5_T10.md` y publicado en `/app/frontend/public/handoff/PARA_INTEL_comparables_T5_T10.md` (verificado HTTP 200 local).

Contenido:
- Contexto: sección Comparativa (`id=comparativa` en NAV) bloqueada por ausencia de peers nominales; hoy renderiza `<Pending/>`.
- Petición: bloque `peers` en `/company/{cif}/ficha` (Opción A · aditivo `dict | None` pattern HARDENING-012) con 5-10 compañías comparables por CNAE-group + banda tamaño 0,3x–3,0x revenue. Campos: `master_id`, `cif`, `name`, `province`, `cnae_code`, `cnae_label`, `revenue`, `ebitda`, `ebitda_margin`, `net_debt`, `employees`, `fiscal_year`, `distance_score`, `ranking_within_peer_group`, `narrative` (fase 2 canon CF).
- Ejemplo payload: Servier B28184687 con 3 peers ilustrativos (Rovi, Faes Farma, Almirall) y sus métricas fake.
- Sub-preguntas abiertas (5): banda de tamaño ajustable, peers extranjeros, criterio de similitud, TTL 24h, idempotencia cross-CIF.
- Prioridad: **P2 · bloquea Comparativa**. No bloqueante para deploy actual.

**URL descargable**: `/handoff/PARA_INTEL_comparables_T5_T10.md` (local HTTP 200 confirmado en preview).

---

### Ítem 4 · Fase 0 · Sector & Roll-up + Registros/Documentos (diagnóstico puro, NO se cablea)

**Metodología**: curl directo al agregador Intel autenticado con la clave canónica en preview:
```
curl -H "X-API-Key: $ARROBA_SERVICE_API_KEY_PRIMARY" https://intel.arroba.com/api/v1/company/B28184687/ficha
```
Payload: 29.8 KB, HTTP 200. Top-level keys: `['cif', 'engine_version', 'events', 'finances', 'governance', 'identifier', 'identity', 'market', 'master_id', 'ownership', 'ranking', 'signals']`.

#### Sector & Roll-up (E6/E7)

Scan recursivo buscando keys que contengan: `rollup`, `roll_up`, `fragment`, `consolidation`, `tesis`, `thesis`, `e6`, `e7`, `multiples`, `acquirer_universe`.

**Resultado**: **CERO matches en el payload real**. Única aparición: `identity.record_status` (mercantil status registral, NO relacionado con roll-up).

**Conclusión**: la sección Sector & Roll-up **no puede cablearse aún**. Requiere REQ-INTEL futuro (no emitido en este turno; documentado como pendiente).

**Shape sugerido para un futuro REQ** (para preparar sprint Intel):
```json
{
  "rollup": {
    "available": true,
    "fragmentation_index": 0.72,   // 0=monopolio, 1=fragmentado
    "acquirer_universe_size": 34,
    "multiples_recent": { "ev_ebitda_median": 7.8, "ev_ebitda_p25": 6.1, "ev_ebitda_p75": 9.4, "sample_size": 12 },
    "consolidation_thesis": "El sector se encuentra en fase temprana de consolidación...",
    "engine_version": "arroba-rollup-v1"
  }
}
```
Se emitirá REQ formal cuando Arroba priorice Sector & Roll-up (bloqueado hoy por Comparativa T5-10).

#### Registros/Documentos

Scan recursivo buscando: `documents`, `docs`, `cuentas`, `annual_accounts`, `registro`, `gacetas`, `boe`, `record`, `filings`, `reports`.

**Resultado**:
- `identity.record_status: "active"` — flag de estado del registro mercantil (NO documentos).
- Top-level `events` con `{available: false, identifier: "B28184687", engine_version: "arroba-company-ficha-v1"}` — sigue sin BORME (verificado ayer, sigue igual hoy).
- `finances.events` — NO existe (verificado explícitamente).
- **CERO** keys de documentos/cuentas/BORME/gacetas más allá del flag registral.

**Conclusión**: Registros públicos y Documentos siguen `<Pending/>` en Beta; sin dato en Intel. No REQ emitido aún (esperable en batch con Sector & Roll-up).

---

## Estado del bundle

| Ítem | Estado | Bloqueante para deploy actual? |
|---|---|---|
| 1 · Anomalía #1 diag | ✅ (a) VALOR — no toca código | No (info para el usuario) |
| 2 · Canon Fase A aplicada | ✅ 14 strings sustituidos + TODOs Fase B | No (mejoras UX, no rompe contratos) |
| 3 · REQ T5-10 emitido | ✅ URL 200 preview | No (bloquea Comparativa, no deploy) |
| 4 · Fase 0 Sector & Roll-up + Registros/Documentos | ✅ payload confirmado vacío | No (secciones ya en `<Pending/>`) |

**Deploy readiness**: sin cambios de infraestructura ni de contrato backend. Frontend build limpio. Se puede acumular al próximo push del usuario.

**Sub-preguntas al usuario**:
1. ¿Aplico Fase B del canon (retirar rows enum de Mercado/Rankings/Concentración cuando Intel confirme `narrative`) o esperamos a que Intel responda el REQ agregado de labels ES?
2. ¿Emitir REQ formal `PARA_INTEL_sector_rollup_E6_E7.md` ahora o esperar al cierre de Comparativa T5-10?

- **Doc emitido**: `/app/memory/PARA_INTEL_labels_es_batch.md` (17.9 KB · 6 familias de labels ES + §Sub-preguntas + §Checklist Fase B).
- **URL descargable**: `https://musing-hellman-9.preview.emergentagent.com/handoff/PARA_INTEL_labels_es_batch.md` · HTTP **200** ✅ (local `http://localhost:3000/handoff/…` también HTTP 200).
- **Cola Intel actualizada** (según directiva usuario 2026-08-13):
  1. `control_graph` (Propiedad) — máxima prioridad · REQ pendiente de emisión formal por Arroba.
  2. **`labels_es_batch`** — emitido hoy.
  3. `comparables` T5-T10 — emitido hoy.
  4. `narrative` Mercado/Rankings/Concentración/Position — Fase B canon · mismo lote de idioma que `labels_es_batch`.
  5. Sector & Roll-up E6/E7 — aparcado.
- **No hay más trabajo neto pendiente en el stream legacy**. **IDLE** a la espera de:
  - Intel emite `control_graph` → cablear Propiedad.
  - Intel emite `narrative` + `labels_es_batch` (co-entrega) → cerrar Fase B canon.
  - Intel emite `peers` (Comparables T5-10) → cablear sección Comparativa.

---

## 2026-08-13/14 · Fase B canon + Propiedad cableada + Amendment auth · listo para push

### Fase 0 · Diagnóstico (Bloque A + Bloque B) contra `/tmp/ficha_dumps/*.json`

Test set (según `PARA_INTEL_CIFs_muestra.md`): 5 CIFs; sólo Servier `B28184687` resuelve (200); los otros 4 (`A08363419`, `A28017895`, `B65076193`, `B95758389`) devuelven 404 upstream Intel — problema de cobertura conocido, no regresión.

**Bloque A · Fase B canon (Servier)**:
- `market.sector.narrative` ✓ "El sector de fabricación de especialidades farmacéuticas se…"
- `market.geo.narrative` ✓ "Madrid es una plaza empresarial de primer nivel…"
- `market.concentration.narrative` ✓ "Es un mercado muy concentrado, en manos de unos pocos operadores…"
- `market.position.narrative` ✓ "Se sitúa en cabeza por ingresos de su sector…"
- `market.concentration.concentration_label_es` ✓ "Muy concentrado"
- `signals.items[*].signal_label` ✗ (Servier `signals.items` está vacío · no falseable)
- `hero.primary_driver_label` / `market.primary_driver_label` ✗
- `ownership.concentration_label_es` ✗
- `finances.cash_flow_labels_es` ✗
- `governance.officers[*].role_label_es` ✗
- `identity.is_listed_label_es` ✗

→ **Gate A: STOP.** `narrative` presente (4/4) pero `labels_es` presente sólo 1/6 (`market.concentration_label_es`). No se puede retirar `SIG_SEVERITY_LABEL` / `_GOVERNANCE_ROLE_ES` / `fmtYesNo` / etc. sin dejar `<Empty/>` intermedios (regla: mismo commit, nunca `<Empty/>` intermedio). Se conservan los mapas locales y los TODOs `CANON CF Fase B` sembrados. Esperar co-entrega `narrative` + `labels_es_batch` de Intel.

**Bloque B · Propiedad · `control_graph` (Servier)**:
Shape completo y utilizable · keys: `['available', 'company', 'control', 'coverage', 'downstream', 'edges', 'engine_version', 'group_id', 'narrative', 'nodes', 'ubo', 'upstream']`.

- `upstream[2]` con name/pct/is_person/is_ubo/relationship (SERVIER INTERNATIONAL BV 73,35% UBO; ARTS ET TECHNIQUES DU PROGRES 26,65%).
- `downstream[2]` con name/cif/pct (DANVAL SA 100%; LABORATORIOS LESTRAL SA 100%).
- `ubo` (SERVIER INTERNATIONAL BV · jurídica).
- `nodes[5]` + `edges[4]` (grafo listo para tab Grafo).
- `control` con `controlling_shareholder`, `top1_pct` 73,35, `tier` "Control mayoritario".
- `narrative` CF: "Controlada por SERVIER INTERNATIONAL, BV (73,3%). Cabecera de un grupo con 2 participadas…".
- `coverage` truncated=false.

→ **Gate B: PROCEDIDO** (cobertura test set 1/5 por 404s Intel documentados, no regresión). Se implementa DPD backend + tabs Árbol/Distribución/Grafo + banner narrativo + UBO destacado + animaciones CSS puras (sin dependencias nuevas).

### Cambios · Bloque B · Propiedad cableada con `control_graph`

**Backend**:
- `interfaces/ficha.py`: añadido `control_graph: dict | None` en `CompanyFicha` (HARDENING-014 · passthrough puro con shape observado documentado).
- `providers/agency_tool/financial.py::fetch_ficha`: passthrough `data.get("control_graph")` en el mapper.
- `endpoints.py::get_company_ficha`: llamada a `_anonymize_control_graph()` en la rama anónima; header `X-Ficha-Auth`.
- `endpoints.py::_anonymize_control_graph` (nuevo, +73 líneas): elimina `upstream/downstream/ubo/nodes/edges`, emite `summary{shareholders_count, participations_count, tier?, top1_pct?}`, preserva `available/company/narrative/coverage/control.tier/group_id`. Consistente con `_anonymize_ownership`.

**Frontend**:
- `lib/companies/intelligence-types.ts`: añadido union type `ControlGraphBlock` = `ControlGraphNominal | ControlGraphAggregated | ControlGraphUnavailable` con interfaces por sub-bloque (~+90 líneas). `CompanyFicha.control_graph` añadido.
- `components/company/layout/CompanyFichaLayoutV2.tsx`:
  - Prop `controlGraph?: ControlGraphBlock | null` en `CompanyFichaLayoutV2Props`.
  - Sustituido `Propiedad` legacy: fallback a control_graph primario + ownership legacy secundario.
  - Componentes nuevos: `ControlGraphTabs`, `ControlGraphBanner`, `ControlGraphTreeView` (accionistas + UBO destacado + participadas), `ControlGraphDistributionView` (barras horizontales por pct), `ControlGraphGraphView` (SVG puro nodes/edges con marker arrow), `PropiedadControlGraph` (orquestador con union type guards).
  - Keyframes `@keyframes cg-fade-in` + `cg-scale-in` inline · sin dependencias externas.
  - Test-ids: `control-graph-tabs`, `control-graph-tab-{id}`, `control-graph-{arbol|distribucion|grafo}`, `control-graph-shareholders`, `control-graph-participations`, `control-graph-ubo`, `control-graph-shareholder-{i}`, `control-graph-participation-{i}`, `control-graph-node-{id}`, `control-graph-banner`, `control-graph-nominal|aggregated|empty|unknown`, `control-graph-summary-{shareholders|participations|tier|top1-pct}`.
- `components/company/CompanyFichaF01Client.tsx`: pasa `controlGraph={ficha?.control_graph ?? null}` al layout.

### Amendment · Fail-closed opt-in de auth (HARDENING-015)

**Backend `endpoints.py::get_company_ficha`**:
- Nuevo query param `authenticated: bool = Query(default=False)`.
- Regla `if user is None or authenticated is not True: → anon`. Fail-closed: cualquier combinación distinta de `user válido AND authenticated=true` cae a anon.
- Header nuevo `X-Ficha-Auth: authenticated | anonymous` (trazabilidad).

**Frontend**:
- `lib/companies/intelligence-client.ts::ficha`: nueva firma `ficha(cif, authenticated = false)` que añade `?authenticated=true` sólo si el flag es `true`. Anón por defecto.
- `components/company/CompanyFichaF01Client.tsx`: SWR key extendida a `['ficha-b24-aggregate', cifUpper, isAuthenticated]` (revalida al loguearse/desloguearse); pasa `isAuthenticated` al fetcher.

**Cache-key discriminator**:
- Verificado en `cache.py::build_key` y `router.py::get_company_ficha`. El caché almacena el `CompanyFicha` **pre-DPD** (shape completo tal como Intel lo entrega). La anonimización se aplica **post-caché** en `endpoints.py::get_company_ficha`. **No hay colisión posible** entre respuestas auth y anon: ambas se derivan del mismo objeto cacheado y luego se transforman. No requiere discriminador en la key. Documentado en el endpoint.

### Tests · 4 curls amendment (Servier · localhost:8001)

| # | Comando | X-Ficha-Auth | finances | ranking | ownership.shareholders | cg.upstream | cg.nodes | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | sin cookie sin flag | `anonymous` | ✗ | ✗ | 0 | 0 | 0 | ✅ ANON |
| 2 | sin cookie `?authenticated=true` | `anonymous` | ✗ | ✗ | 0 | 0 | 0 | ✅ ANON (fail-closed) |
| 3 | con cookie sin flag | `anonymous` | ✗ | ✗ | 0 | 0 | 0 | ✅ ANON (opt-in requerido) |
| 4 | con cookie `?authenticated=true` | `authenticated` | ✓ | ✓ | 2 | 2 | 5 | ✅ AUTH completo |

**4/4 PASS**. Cero leaks. DPD respetada.

### Build/Typecheck

- `yarn typecheck` ✅ OK (3.99 s).
- `yarn build` ✅ OK (19.69 s). First Load JS shared **87.3 kB** — idéntico al baseline previo (no ha subido).

### Archivos modificados

- `/app/backend/src/modules/intelligence_layer/interfaces/ficha.py` (+23 líneas comment + campo).
- `/app/backend/src/modules/intelligence_layer/providers/agency_tool/financial.py` (+6 líneas passthrough).
- `/app/backend/src/modules/intelligence_layer/endpoints.py` (+82 líneas · Query param + `_anonymize_control_graph` + header + doc).
- `/app/frontend/src/lib/companies/intelligence-types.ts` (+94 líneas · union type `ControlGraphBlock`).
- `/app/frontend/src/lib/companies/intelligence-client.ts` (+13 líneas · doc + opt-in `authenticated`).
- `/app/frontend/src/components/company/CompanyFichaF01Client.tsx` (+2 líneas · pass `controlGraph`, revalida SWR con `isAuthenticated`).
- `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` (+~330 líneas · nuevos componentes control_graph + keyframes).

### Verificaciones pendientes de ejecución (no bloqueantes)

- Smoke visual UI autenticada con Playwright (screenshot login+navegar+click tab Propiedad) — falló por timeout del helper de coroutine del tool, pero los curls confirman el JSON completo llega al frontend. UI validable manualmente por el usuario en preview.
- Los 4 CIFs 404 no permiten validar `control_graph` en variedad (solo Servier). REQ `PARA_INTEL_CIFs_muestra.md` sigue abierto.

### Deploy

- **NO desplegado.** Cambios acumulados para el próximo push manual del usuario.

---

## 2026-08-13 · Pasada correctiva DPD sweep + Fix client crash (HARDENING-016/017)

### P0.1 · DPD SWEEP exhaustivo (HARDENING-016)

**Ley del turno** documentada en cada helper anon: _"si en anon oculto una lista o campo gateado, oculto también toda su prosa, resúmenes y KPIs derivados"_.

**Diagnóstico** (payload real Intel `/api/v1/company/B28184687/ficha` · 2026-08-13):
- Detectado cambio de shape en `control_graph`: Intel migró v1 (`upstream/downstream/nodes/edges/control`) a **v2** (`shareholders/subsidiaries/graph{nodes,edges}/distribution/ubo` con nombres ya anonimizados a `"Accionista principal"`, `"Beneficiario último"`, etc.).
- Campos que resumen datos gateados y estaban leakeando en anon: `control_graph.narrative`, `control_graph.control.*`, `control_graph.summary.top1_pct`, `control_graph.summary.tier`, `ownership.summary.top1_pct`, `ownership.summary.tier`.

**Cambios backend** (`/app/backend/src/modules/intelligence_layer/endpoints.py`):
- `_anonymize_ownership` (HARDENING-016): elimina `summary.top1_pct` y `summary.tier`. Preserva sólo `summary.total_shareholders`.
- `_anonymize_control_graph` (HARDENING-014 + HARDENING-016 + adaptación v2): elimina `shareholders`, `subsidiaries`, `ubo`, `graph`, `distribution`, `narrative`. Preserva `available`, `company`, `coverage`, `summary{shareholders_count, participations_count}`, `engine_version`.
- `_anonymize_market` (nuevo · HARDENING-016): elimina `position` completo + `concentration.explain` defensivo. Preserva `sector.narrative`, `geo.narrative`, `concentration.narrative`, `concentration.hhi`.

**Criterio de mantenimiento en anon** (documentado en docstrings):
- `market.sector.narrative` **MANTENER**: contexto CNAE público del sector.
- `market.geo.narrative` **MANTENER**: contexto territorial público.
- `market.concentration.narrative` **MANTENER**: concentración agregada del mercado (universo CNAE público).
- `market.concentration.hhi` **MANTENER**: índice del mercado, no de la empresa.
- `market.concentration.explain` **ELIMINAR** defensivo (por si Intel lo poblase con KPIs privados en futuro).

**Matrix API extendida (Servier B28184687 · localhost:8001)**:

| Campo | A (anon) | B (anon+flag) | C (auth-cookie s/flag) | D (auth+flag) |
|---|:-:|:-:|:-:|:-:|
| `control_graph.narrative` | null ✓ | null ✓ | null ✓ | populado ✓ |
| `control_graph.shareholders` | null ✓ | null ✓ | null ✓ | list[2] ✓ |
| `control_graph.subsidiaries` | null ✓ | null ✓ | null ✓ | list[2] ✓ |
| `control_graph.graph` | null ✓ | null ✓ | null ✓ | dict[2] ✓ |
| `control_graph.distribution` | null ✓ | null ✓ | null ✓ | list[2] ✓ |
| `control_graph.ubo` | null ✓ | null ✓ | null ✓ | dict[4] ✓ |
| `control_graph.summary.top1_pct` | null ✓ | null ✓ | null ✓ | null (Intel no emite) |
| `control_graph.summary.tier` | null ✓ | null ✓ | null ✓ | null (Intel no emite) |
| `control_graph.control` | null ✓ | null ✓ | null ✓ | null (Intel no emite) |
| `control_graph.summary.shareholders_count` | 2 ✓ | 2 ✓ | 2 ✓ | — (auth no usa summary) |
| `control_graph.summary.participations_count` | 2 ✓ | 2 ✓ | 2 ✓ | — |
| `ownership.summary.top1_pct` | null ✓ | null ✓ | null ✓ | null (auth no usa summary) |
| `ownership.summary.tier` | null ✓ | null ✓ | null ✓ | null |
| `ownership.summary.total_shareholders` | 2 ✓ | 2 ✓ | 2 ✓ | — |
| `ownership.shareholders` | null ✓ | null ✓ | null ✓ | list[2] ✓ |
| `ownership.control` | null ✓ | null ✓ | null ✓ | dict[4] ✓ |
| `market.position` | null ✓ | null ✓ | null ✓ | dict[6] ✓ |
| `market.concentration.narrative` | populado ✓ | populado ✓ | populado ✓ | populado ✓ |
| `market.concentration.hhi` | 10000.0 ✓ | 10000.0 ✓ | 10000.0 ✓ | 10000.0 ✓ |
| `market.concentration.explain` | null ✓ | null ✓ | null ✓ | null (Intel no emite) |
| `market.sector.narrative` | populado ✓ | populado ✓ | populado ✓ | populado ✓ |
| `market.geo.narrative` | populado ✓ | populado ✓ | populado ✓ | populado ✓ |
| `finances` | null ✓ | null ✓ | null ✓ | dict[33] ✓ |
| `finances.assessment.verdict` | null ✓ | null ✓ | null ✓ | populado ✓ |
| `ranking` | null ✓ | null ✓ | null ✓ | dict[5] ✓ |

**Verdict**: **A ✅ · B ✅ · C ✅ · D ✅ · ALL 4 PASS**. Cero leak PII en anon. Auth completo. Header `X-Ficha-Auth` refleja resolución server-side.

### P0.2 · Fix client crash (HARDENING-017)

**Root cause identificado** (dos vectores concurrentes):

1. **Cambio de shape Intel v1 → v2**: los componentes React asumían `upstream/downstream/nodes/edges` (v1). Intel migró a `shareholders/subsidiaries/graph.nodes/graph.edges` (v2). El `isControlGraphNominal(cg)` = `Array.isArray(cg.upstream)` era `false` → discriminador de union type caía a `unknown` → sección quedaba en `<Empty/>`. En el tab Grafo del código v1, `filter((n) => n.kind === 'participation')` no matcheaba `"participada"` español ni el nuevo `"subsidiary"` v2 → edges con `nodePos.get()` devolvía undefined → renders inconsistentes o crashes.
2. **Enum `kind` divergente**: v1 emitía `"participada"`, v2 emite `"subsidiary"`. Ninguno matcheaba el `"participation"` esperado.

**Fixes aplicados**:

- **Adaptación al shape v2 Intel** (`intelligence-types.ts` + `CompanyFichaLayoutV2.tsx`):
  - Union type `ControlGraphNominal` reescrito para v2: `shareholders[]`, `subsidiaries[]`, `graph{nodes[], edges[]}` con `id/label/kind` y `from/to/pct`, `distribution[]`, `ubo{name, type, kind, pct_effective}`.
  - Componentes `ControlGraphTreeView`, `ControlGraphDistributionView`, `ControlGraphGraphView` reescritos para consumir v2.
  - Enum `kind` ampliado defensivamente a `{'company', 'shareholder', 'ubo', 'subsidiary', 'participation', 'participada'}` para soportar cualquiera de las versiones.
- **Guards defensivos R15**:
  - `Array.isArray(cg.shareholders/subsidiaries/graph.nodes/graph.edges) ? … : []`.
  - `typeof x.pct === 'number' ? x.pct : null` en todos los accesos numéricos.
  - Optional chaining `n?.id`, `e?.from`, `e?.to`, `sh?.pct` en todos los mapas y sorts.
  - `nodePos.get()` con return null si no está el nodo (skip render sin crash).
- **`ControlGraphErrorBoundary` (nuevo · class component)**: envuelve `<Propiedad>` en el layout (línea 1929). En `componentDidCatch` loguea a consola en dev con `error + info`; muestra fallback `<Empty label="Estructura accionarial" />` en prod. NO silencia errores en dev.
- **`ControlGraphBanner`**: `subtitle` en vez de `tier` (v2 no expone tier en la banner). Muestra `as_of_year` como subtítulo cuando está poblado.

**Archivos frontend modificados**:
- `/app/frontend/src/lib/companies/intelligence-types.ts` (~110 líneas rework del union type v2).
- `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` (~330 líneas rework de componentes control_graph v2 + ErrorBoundary + guards).

**Verificación visual local Chrome**: pendiente de handoff al `e1_tester`. Los curls confirman que:
- Auth recibe el shape v2 completo con `shareholders[2]/subsidiaries[2]/graph{nodes[5],edges[4]}/distribution[2]/ubo{4 keys}/narrative`.
- Anon recibe el shape agregado sin PII (`available/company/coverage/summary{2 counts}`).
- Los guards evitan crashes por `undefined`.

### BUILD

- `yarn typecheck` ✅ verde (4.64 s).
- `yarn build` ✅ verde (18.71 s). First Load JS shared **87.3 kB** — idéntico al baseline, sin regresión.

### Archivos modificados en esta pasada correctiva

- `/app/backend/src/modules/intelligence_layer/endpoints.py` — HARDENING-016 en `_anonymize_ownership`, `_anonymize_control_graph` reescrito para shape v2, nuevo helper `_anonymize_market`. Reemplaza la lógica ad-hoc previa del `update_dict`.
- `/app/frontend/src/lib/companies/intelligence-types.ts` — union type `ControlGraphNominal` v2.
- `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` — `ControlGraphErrorBoundary` (class), componentes v2 (`ControlGraphTreeView`, `ControlGraphDistributionView`, `ControlGraphGraphView`), guards defensivos, banner con `subtitle`.

### Deploy

- **NO desplegado.** Acumulado sobre el bundle previo. Listo para el push manual del usuario tras luz verde de `e1_tester`.

---

## 2026-08-13 · Refactor Propiedad 1:1 mockup + Fase B canon (Gate STOP) · HARDENING-018

### Fase 0 · lectura del mockup `ficha-empresa-f01.html`

- **Descargado** desde `customer-assets-lqy194kg.emergentagent.net/.../1atdk9xz_ficha-empresa-f01.html` → `/tmp/mockup_propiedad.html` (2048 líneas).
- **Bloques identificados**:
  - `#ownSeg` (selector `.segtiny` con 3 tabs · iconos `network / bars / target`).
  - `#ownTree`: `.own-th` + `.ownbar2` + grid `.own-g` de `.onode` + `.own-stem` + `.own-ent .box` (nodo central gradient) + `.own-stem` + `.own-th` + grid `.own-g` de `.pnode` + `.own-impl` (banner + CTA).
  - `#ownList`: lista de `.owbar` con `.obn > .obtag`, `.obt > i data-w`, `.obp`.
  - `#ownGraph`: `<div id="controlGraph">` renderizado por `interactiveGraph(container, {nodes, edges, ...})`.
- **Keyframes**: `igIn .45s`, `rdIn .7s`, `revUp .5s`, `owbFill .9s`. Todas portadas literalmente en `propiedadMockupCss.ts`.
- **Sistema iconos**: `<span data-ic>` con `svgIcon()` → mapeado a `lucide-react`: `network → Network`, `bars → BarChart3`, `target → Target`, `layers → Network` (reutilizo Network para participadas al no estar `Layers` importado sin bump de bundle), `link → ExternalLink`.
- **Rail "Operación activa"** (`aside.deal#dealAside` del mockup): **NO portado** (directiva del usuario).

### Fase 0 · payload Fase B canon (Servier B28184687 · auth) · Gate

- `market.sector.narrative` ✅
- `market.geo.narrative` ✅
- `market.concentration.narrative` ✅
- `market.position.narrative` ✅
- `ranking.narrative` ✅ (extra)

**Labels_es · cobertura 3 de 6 confirmadas · 3 pendientes**:
- ✅ `market.concentration.concentration_label_es`
- ✅ `governance.governance_role_labels_es` (dict a nivel bloque, no `role_label_es` por officer)
- ✅ `identity.is_listed_label_es`
- ❌ `signal_label` (items=[] · no falseable)
- ❌ `primary_driver_label` (ni en hero ni en market)
- ❌ `cash_flow_labels_es` (ni en finances top ni en finances.cash_flow)
- ❌ `officers[*].role_label_es` (existe dict a nivel bloque, no como campo hermano)
- ❌ `ownership.concentration_label_es`

**Verdict Gate Fase B**: **STOP · parcialmente presente**. Regla del usuario: "mismo commit, nunca `<Empty/>` intermedio". Se aparca Fase B canon hasta co-entrega completa. Los mapas locales (`SIG_SEVERITY_LABEL`, `SIG_DIM_LABEL`, `_GOVERNANCE_ROLE_ES`, `fmtYesNo`) **permanecen** en el layout. TODOs `CANON CF Fase B` en `MercadoSectorPanel/GeoPanel/ConcentrationPanel/PositionPanel` **permanecen**.

### Bloque 1 · Refactor Propiedad 1:1 mockup

**Archivos creados**:
- `/app/frontend/src/components/company/layout/propiedadMockupCss.ts` — `PROPIEDAD_MOCKUP_CSS` (CSS calcado 1:1 del mockup: `.segtiny`, `.own-*`, `.onode`, `.pnode`, `.owbar`, `.ig-*`, keyframes `revUp/igIn/rdIn/owbFill`).

**Archivos modificados**:
- `/app/frontend/src/lib/companies/intelligence-types.ts` · union `ControlGraphBlock` ya alineado con shape v2 en pasada anterior.
- `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx`:
  - Reescritura completa del bloque Propiedad (~500 líneas nuevas, ~516 líneas legacy eliminadas).
  - Nuevos componentes: `OwnSegTabs`, `OwnTreeView`, `OwnListView`, `OwnGraphView`, `InteractiveControlGraph`, `PropiedadControlGraph`, `Propiedad` (fallback ownership legacy).
  - `ControlGraphErrorBoundary` preservado (HARDENING-017).
  - Motor `InteractiveControlGraph` (React + SVG imperativo via `useRef`/`useEffect`) portado literal del `interactiveGraph()` del mockup: pan/zoom/hover-highlight/drag/click-to-expand. Sin librerías nuevas.
  - Iconos: `Network`, `BarChart3`, `Target`, `ExternalLink` de `lucide-react` (ya en bundle).
  - Constante `OWN_STAKE_COLORS` extraída del mockup para la barra `.ownbar2`.
  - `initialsFromName()` para el avatar del nodo central.
  - Prop `identity` propagada de `props` para poblar `.own-ent .box` con `legal_name / CIF / city / province`.

**Comportamiento**:
- **Tab Árbol** (`#ownTree`): barra proporcional `.ownbar2` (con `title` HTML nativo por accionista) + grid 3 cols de `.onode` con dot color, tipo persona/jurídica, pct grande, `.hl` en el 1º y en UBO + nodo central gradient + grid 3 cols de `.pnode` con badge `.pp.ctrl` (≥50%) o `.pp.min` + banner `.own-impl` con `control_graph.narrative` + CTA "Explorar oportunidad" hacia `/es/oportunidades`.
- **Tab Distribución** (`#ownList`): lista de `.owbar` con separador visual accionistas/participadas + animación `owbFill` en las barras.
- **Tab Grafo** (`#ownGraph`): SVG interactivo pan+zoom con controles `+`/`−`/`⤢`. Nodos coloreados por tipo (`company` rojo brand · `ubo` negro · `shareholder`/`subsidiary` grises). Aristas curvas Bezier con labels de porcentaje. Hover-highlight (dim el resto). Click en nodo → si `expand[]` poblado despliega vecindario con animación `rdIn`; si no, muestra placeholder `.own-impl` **"Vecindario en preparación"** por 3.2s.

**Decisión anon** (HARDENING-018 documentada en código): en anon (`isControlGraphAggregated`) → NO fabricamos tarjetas anónimas. Se muestra **card compacta** con `Accionistas registrados: N` + `Participadas registradas: N` + CTA `<Lock/> "Iniciar sesión para ver accionistas, participadas y grafo de control"`. Consistente con el resto de la ficha (Ownership legacy hacía lo mismo).

**Fidelidad al mockup**:
- Estructura DOM · 1:1.
- Clases CSS · calcadas literalmente al mockup fuente.
- Colores · exactos (`OWN_STAKE_COLORS` extraído del inline `<i style="background:#FF5757">` etc.).
- Animaciones · portadas literal (`revUp`, `owbFill`, `igIn`, `rdIn`).
- Gaps documentados:
  - **Rail "Operación activa"** del mockup no portado (directiva).
  - **Iconos** portados desde `lucide-react` (equivalencias documentadas · sin bump bundle).
  - **Tooltip flotante** del mockup (`[data-tip]` con posicionamiento custom) sustituido por `title` HTML nativo por simplicidad (fase 2 · portar el `<div class="tip">` global si el usuario lo pide).

**REQ emitido** para Nivel 2 del Grafo (click-to-expand):
- `/app/memory/PARA_INTEL_control_graph_expand.md` (12.4 KB · shape completo + 5 sub-preguntas abiertas).
- URL descargable: `https://musing-hellman-9.preview.emergentagent.com/handoff/PARA_INTEL_control_graph_expand.md` · HTTP **200** ✅.
- Prioridad: cola Intel **#2** (tras Punto 1 = nombres reales).

### Bloque 2 · Fase B canon · **STOP**

Cobertura labels_es sólo 3/6. Se aparca. Sin cambios en Mercado / Rankings / Concentración / Position.

### BUILD

- `yarn typecheck` ✅ verde (3.26 s).
- `yarn build` ✅ verde (18.28 s). First Load JS shared **87.3 kB** — idéntico al baseline, sin regresión (motor SVG imperativo + `useRef`/`useEffect` sin dependencias nuevas).

### Deploy

- **NO desplegado.** Acumulado sobre el bundle previo. Listo para el push manual del usuario tras luz verde de `e1_tester`.

---

## 2026-08-13 · Retirada REQ `control_graph_expand` + Fase 0 `/connections` · STOP

### Tarea 1 · REQ retirado

- **Archivo movido** a `/app/memory/archive/PARA_INTEL_control_graph_expand.md` con cabecera `# [WITHDRAWN · 2026-08-13]` documentando la razón (Intel ya expone endpoint deduplicado; Arroba lo cableará directamente).
- **Handoff público retirado**: `/app/frontend/public/handoff/PARA_INTEL_control_graph_expand.md` eliminado. La URL antes servida devuelve **HTTP 400** en preview (verificado).
- **Cola Intel post-retirada** (actualizada):
  1. Nombres reales del `control_graph` (pendiente).
  2. `labels_es_batch` (3/6 confirmadas · 3/6 pendientes).
  3. `comparables` T5-T10 (emitido).
  4. Sector & Roll-up E6/E7 (aparcado).

### Tarea 2 · Fase 0 `/connections` · **STOP · endpoint no identificable**

Investigación exhaustiva del contrato upstream de Intel para localizar el endpoint deduplicado de conexiones que menciona el usuario:

- **Grep del backend Arroba** (`/app/backend/src/modules/intelligence_layer/`): **cero matches** para `connections`. Arroba no proxeya nada con ese nombre hoy.
- **12 patrones probados upstream Intel** (con `X-API-Key: ARROBA_SERVICE_API_KEY_PRIMARY`): TODOS **HTTP 404** (`/api/v1/company/{cif}/connections`, `/api/v1/connections?cif=`, `/api/v1/company/{cif}/neighborhood`, `/api/v1/company-connections/{cif}`, `/api/v1/company/{cif}/expand?node_id=`, `/api/v1/node/{id}/connections`, `/api/v1/entities/{id}/connections`, etc.).
- **OpenAPI Intel** (`/api/v1/openapi.json` · 646 paths totales · fetched hoy) · búsqueda por `connect`, `expand`, `neighbor`, `node_id`, `related`, `peer`: no aparece ningún path con `/connections` en el spec.
- **Dos candidatos** que pueden asemejarse a lo que el usuario describe:
  1. **`GET /api/v1/company/{identifier}/control-graph`** con `?authenticated=true` → devuelve exactamente el bloque `control_graph` que ya viene en `/ficha`. **NO es endpoint de vecindario**, es extractor del mismo bloque agregado.
  2. **`GET /api/v1/data-layer/graph/{master_id}/traverse`** (`?max_hops=1&max_nodes=8&relationship_types=`) → T3 Navigable Control Graph multi-hop BFS.
     - Auth exige `Authorization` header (no X-API-Key). Con Bearer + api-key → **401 Invalid credentials**. Con Authorization raw = api-key → **500 Internal Server Error**. Sin header → **401 Missing authorization header**.
     - Arroba **no dispone** del token JWT/Bearer que esta ruta espera.

**Problema adicional de mapping**:
- `control_graph.graph.nodes[]` de Servier usa IDs sintéticos `company / sh1 / sh2 / sub1 / sub2`. **NO son `master_id`** que el `traverse` requiere (`mc_...`).
- `shareholders[i].master_id` viene `null` en Servier (extranjeros: SERVIER INTERNATIONAL BV, ARTS ET TECHNIQUES DU PROGRES) → no hay `master_id` que pasar a un eventual `/traverse`.

### Verdict

**STOP Tareas 3-5** (wiring click-to-expand + DPD 3 curls + aviso banner warning):
- Sin ruta upstream identificada, cablear un proxy stub genera trabajo desechable cuando Intel confirme la ruta real (query params, shape, auth flow).
- Antes de codear el proxy Arroba + hook fetch + animación rdIn de expansión + retry, necesito del usuario:

1. **Ruta upstream real** que Intel ha publicado para `/connections` (path completo). Los 12 patrones probados devuelven 404 en OpenAPI 2026-08-13 · `sha256[:8]=2ba91e0d`. ¿Path exacto? ¿Query params? ¿Body/GET?
2. **Auth de esa ruta**. Si difiere de X-API-Key (como `/data-layer/graph/{master_id}/traverse` que exige Authorization) → ¿Arroba dispone del token? ¿Intel emite JWT nuevo para Arroba?
3. **ID pivote**. ¿El endpoint acepta el `node_id` sintético (`sh1`/`sub1`) o requiere `master_id`? Si `master_id`, en Servier `shareholders[i].master_id` viene `null` para los extranjeros — ¿Intel resolverá esa carencia antes o después del wiring?

Hasta luz verde con esos 3 puntos, el placeholder actual del frontend ("Vecindario en preparación") se mantiene intacto. Es la única implementación honesta bajo R15 sin fabricar datos.

### Sin cambios funcionales en backend/frontend este turno

- **Backend**: sin modificar. Sin proxy `/connections` añadido (esperar ruta real de Intel).
- **Frontend**: sin modificar. `InteractiveControlGraph` (HARDENING-018) ya está listo para consumir el fetch en cuanto el proxy Arroba conecte con la ruta upstream real.

### BUILD

- `yarn typecheck` ✅ verde (no hay cambios de código este turno).
- `yarn build` ✅ verde. First Load JS shared **87.3 kB** — sin regresión.

### Deploy

- **NO desplegado.** Cambios de este turno: sólo documentación (retirada REQ + PLAN_BETA_status). Todo lo demás intacto en preview.

---


---
## 2026-08-13 · HARDENING-019 Fase B canon + Gobierno ES + Verificación Propiedad 1:1 pre-push

### Contexto del turno
- **Comparativa (peers T5-T10)** CONGELADA en backup `/tmp/wip_comparativa_20260813/`. Diff completo + README con instrucciones para retomar mañana. Working tree limpio antes de arrancar Fase B.
- **`/connections`** APARCADO (esperando 3 respuestas Intel · sin cambios).
- **Fase B canon**: gate `Fase 0` verde (5/6 labels ES exactos + 6/6 semánticos con matices de ruta) + 4/4 narratives Mercado preservadas → **PROCEDER**.

### Fase 0 · Labels 6/6 (gate verde)
- `market.concentration.concentration_label_es` = "Muy concentrado" ✅
- `governance.governance_role_labels_es` (dict sección · Intel) ✅
- `identity.is_listed_label_es` = "No cotizada" ✅
- `market.{sector,geo}.primary_driver_label` (`"Actividad"` / `"Tamaño de mercado"`) ✅
- `governance.officers[].role_label_es` = `"Apoderado"` (+ bonus `role_es`) ✅
- `finances.cash_flow.cash_flow_labels_es` + `.category_labels_es` (dicts) ✅
  - Nota: ruta canónica final `finances.cash_flow.{cash_flow_labels_es,category_labels_es}` (dentro del sub-bloque, no top-level `finances.cash_flow_labels_es` como se esperaba). Semánticamente idéntico.
- Narratives 4/4: sector / geo / concentration / position ✅ (todas presentes en auth)

### Cambios frontend (Fase B canon aplicado)
- `intelligence-types.ts`:
  - `MarketSector`: + `primary_driver_label`, `narrative`
  - `MarketGeo`: + `primary_driver_label`, `narrative`
  - `MarketConcentration`: + `concentration_label_es`, `narrative`
  - `MarketPosition`: + `narrative`
  - `GovernanceOfficer`: + `role_es`, `role_label_es`
  - `IdentityRegistryStatus`: + `is_listed_label_es`
  - `CashFlowStatement`: + `cash_flow_labels_es`, `category_labels_es`
- `CompanyFichaLayoutV2.tsx`:
  - `MercadoSectorPanel`: renderiza `sector.narrative` + `primary_driver_label`.
  - `MercadoGeoPanel`: renderiza `geo.narrative` + `primary_driver_label`.
  - `MercadoConcentrationPanel`: renderiza `conc.narrative` + `concentration_label_es` (retirada `conc.concentration_label.replace(/_/g,' ')`).
  - `MercadoPositionPanel`: renderiza `pos.narrative` como bloque principal (rank/percentil se preservan como detalle numérico).
  - `Gobierno` (path nominal): `o.role_label_es ?? o.role_es ?? o.role`.
  - Hero widget sector driver: `sector.primary_driver_label ?? sector.primary_driver`.
  - Identity `is_listed`: `registry.is_listed_label_es ?? fmtYesNo(listed)`.
  - `CashFlowTable`: enum local `CF_CATEGORY_LABEL` RETIRADO; labels ES desde `cf.category_labels_es`.
- TODOs Fase B canon cerrados: 4 (Sector, Geo, Concentration, Position).

### Cambios backend (Fase B canon aplicado)
- `endpoints.py`:
  - `_anonymize_governance()`: fuente del label ES ahora es `officers[].role_label_es` (con fallback `role_es` → `role`). Mapa Python `_GOVERNANCE_ROLE_ES` (16 entradas) **RETIRADO**. `_slugify_role` conservado como helper interno para keys estables.

### DPD 4 curls post-Fase B
1. **Anon SIN flag**: `finances=None`, `market.position=None`, governance shape `summary` con `role_label` ES desde payload; **narratives sector/geo/concentration preservadas** (contexto CNAE público según ley HARDENING-016 documentada). ✅
2. **Anon CON flag** (fail-closed): idéntico a #1. `finances=None`. ✅
3. **Cookie SIN flag** (opt-in requerido): idéntico a #1. `finances=None`. ✅
4. **Cookie CON flag**: `finances` poblado, todas las narratives ES + labels ES presentes, officers nominales con `role_label_es`. ✅

### Verificación Propiedad 1:1 pre-push (HARDENING-018 regresión)
- **Anon**: `control_graph.available:true` con `summary:{shareholders_count:2, participations_count:2}` y NADA de shareholders/subsidiaries/narrative/graph/ubo. ✅
- **Auth**: `control_graph` completo — 2 shareholders + 2 subsidiaries + narrative + graph con 5 nodes. ✅

### Nota sobre efecto colateral (documentado, aceptado)
Al retirar el mapa Python de sinónimos, la agregación DPD ahora refleja fielmente las variantes de casing que Intel emite:
- Antes: 1 bucket "Auditor de Cuentas Conjunto"
- Ahora: 3 buckets separados por variantes exactas ("Auditor Cuentas Conjunto", "Auditor de cuentas", "Auditor de cuentas conjunto")

Fidelidad a la fuente (R12: cero cálculo local). Si Intel decide consolidar, lo hace en el motor; Arroba no reintroduce diccionarios de sinónimos locales.

### BUILD
- `yarn typecheck`: **verde** (4.24 s)
- `yarn build`: **verde** (17.36 s) · First Load JS shared **87.3 kB** (baseline preservado)
- Backend lint (`ruff` intelligence_layer/endpoints.py): **verde**
- ESLint frontend layout: **verde**

### DEPLOY
- **NO desplegado.** Bundle acumulado para push manual del usuario tras luz verde del tester (`e1_tester` visual Fase B + Gobierno ES + regresión Propiedad + regresión DPD).

### Estado global
- ✅ HARDENING-018 Propiedad 1:1 · verde pre-push
- ✅ HARDENING-019 Fase B canon CF + Gobierno ES · verde pre-tester
- ⏸️ Comparativa peers T5-T10 · congelada `/tmp/wip_comparativa_20260813/`
- ⏸️ `/connections` grafo Propiedad · aparcado (3 respuestas Intel pendientes)

---
## 2026-08-13 · Incidente OPS · cache stale post-push · HARDENING-004 sigue pendiente

### Contexto del incidente
Tras el push manual de HARDENING-018 (Propiedad 1:1) + HARDENING-019 (Fase B canon CF + Gobierno ES), `GET /api/companies/{cif}/ficha` en **producción** sigue devolviendo el payload viejo:
- `control_graph` ausente / con shape v1
- `market.*.narrative` no presentes
- Labels ES 6/6 no presentes

Root cause: la capa persistente Mongo `intelligence_cache` (§Decisión 0.1.2 · 2 capas + single-flight) mantiene el `value` serializado por el wrapper con contrato antiguo hasta que su `expires_at` supere el TTL. La aplicación de nuevos campos aditivos requiere **invalidación manual** (HARDENING-004 documentado 2026-08-10, sin automatizar por decisión del usuario).

### Inventario del cache (para operativa)
- **Colección Mongo**: `intelligence_cache` (constante `MongoCache.COLLECTION` en `cache.py:91`).
- **Shape del documento**:
  ```
  { _id: "<key>", value: <JSON serializable>, expires_at: <unix_epoch_float>, is_error: bool }
  ```
- **Cache key canónica** (`cache.py:31-39`):
  ```
  f"{provider}:{engine}:{method}:{master_id}:{payload_hash}"
  ```
  Ejemplos reales observados en local:
  - `agency_tool:financial:ficha:B28184687:-`
  - `agency_tool:financial:analyze:B28184687:-`
  - `agency_tool:master:get_by_cif:B28184687:-`
  - `agency_tool:semantic:profile:B28184687:-`
  - `agency_tool:semantic:similar:B28184687:ca502dec04523cdc` (con hash real cuando hay body)
  - `agency_tool:signal:analyze:B28184687:-`
  - `agency_tool:recommendation:buyers:10:B28184687:-` (incluye `limit=10` en `master_id`)
  - `agency_tool:recommendation:opportunities:10:B28184687:-`
  - `agency_tool:valuation:analyze_valuation:mc_80e03f1e1627:-` (aquí el `master_id` es el ID resuelto, NO el CIF).
- **TTL** (`config.py:59-69`):
  - default: `900s` (15 min)
  - `master`: `24h` (identidad estable)
  - `financial`, `signal`, `semantic`, `recommendation`, `strategy`: default (900s)
  - `transaction`: `0` (no cache · event-driven)
- **Engines cacheados**: master, financial (analyze / valuation / ficha / ratios_catalog), signal, semantic (profile / similar / schema / catalog), recommendation (buyers / opportunities), valuation, strategy.
- **Layer 1 (memory · LRU 1024 max)**: se limpia con `supervisorctl restart backend`.
- **Layer 2 (Mongo)**: persiste entre reinicios → requiere `deleteMany`.

### Prueba local (2026-08-13 · CIF B28184687)
Estado antes: 39 docs total · 7 con `B28184687` en `_id` (todos con `expires_at` en pasado por el `_id` viejo pero atravesando el gate `expires_at < now` en app-layer).

Comando ejecutado:
```
mongosh "mongodb://localhost:27017/arroba_com" \
  --eval 'db.intelligence_cache.deleteMany({ _id: /B28184687/ })'
```
Resultado: 7 documentos borrados.

Tras `curl /api/companies/B28184687/ficha?authenticated=true`:
- Se repuebla 1 entrada nueva: `agency_tool:financial:ficha:B28184687:-` con TTL 900s.
- Header `X-Ficha-Source: aggregator` (llamada fresca, no fallback).
- **12/12 checks del contrato nuevo verdes**:
  - `control_graph.shareholders` = 2 · `narrative` presente
  - `market.{sector,geo,concentration,position}.narrative` = 4/4 ✓
  - `market.concentration.concentration_label_es` = "Muy concentrado"
  - `market.sector.primary_driver_label` = "Actividad"
  - `identity.is_listed_label_es` = "No cotizada"
  - `governance.governance_role_labels_es` dict con 7 keys
  - `governance.officers[0].role_label_es` = "Apoderado"
  - `finances.cash_flow.cash_flow_labels_es` dict con 9 keys

**Conclusión**: purga = fix. Código en prod está bien; sólo Mongo tapaba con el shape viejo.

### Comandos para Daniel (Mongo de prod)

**Opción A · Purga total** (más agresiva, invalida TODOS los engines para TODOS los CIFs):
```
mongosh "$PROD_MONGO_URI" --eval 'db.intelligence_cache.deleteMany({})'
```
Trade-off: primera request por CIF cacheado → cache-miss → llamada fresca a Intel. Sin downtime. Coste breve de latencia para el primer usuario que toque cada ficha (~2–5s de round-trip Intel). Es la más simple y **la recomendada** para este incidente porque el contrato nuevo afecta transversalmente a ficha / control_graph / market / governance / cash_flow.

**Opción B · Purga por CIF específico** (`B28184687` de ejemplo · reemplazar por los CIFs afectados):
```
mongosh "$PROD_MONGO_URI" --eval 'db.intelligence_cache.deleteMany({ _id: /B28184687/ })'
```
Trade-off: quirúrgica; sólo invalida esa ficha. Buena si Daniel sabe que el usuario reportador consulta un CIF concreto. Menos eficaz si múltiples CIFs están cacheados con shape viejo.

**Opción C · Purga por engine** (sólo el agregador `ficha`, deja `master`/`identity`/`financial`/`semantic`/etc. intactos):
```
mongosh "$PROD_MONGO_URI" --eval 'db.intelligence_cache.deleteMany({ _id: /:financial:ficha:/ })'
```
Trade-off: mínima invasión — el fetch del agregador `/ficha` es el único que devuelve el contrato completo (`control_graph`, `market`, `governance`, `finances`). Preserva la caché de los legacy per-sección (que sirven al Copilot y otros consumidores). **Recomendada si Daniel prefiere invalidar sólo lo estrictamente necesario**.

**Recomendación operativa · orden de prueba**:
1. Empezar con **Opción C** (mínima invasión). Verificar con un curl a un CIF cualquiera que el nuevo contrato llega.
2. Si algún consumidor legacy sigue devolviendo shape viejo (por ejemplo Copilot vía `/financial-analysis`), escalar a **Opción A**.

**Verificación post-purga en prod** (Daniel debería ejecutar):
```
curl -s -H "Cookie: {sesión válida prod}" \
  "https://arroba.com/api/companies/B28184687/ficha?authenticated=true" \
  | jq '{
      cg: (.control_graph.shareholders | length),
      narr_sector: (.market.sector.narrative != null),
      narr_geo: (.market.geo.narrative != null),
      narr_conc: (.market.concentration.narrative != null),
      narr_pos: (.market.position.narrative != null),
      conc_label: .market.concentration.concentration_label_es,
      is_listed: .identity.is_listed_label_es,
      role0: .governance.officers[0].role_label_es,
      cf_labels: (.finances.cash_flow.cash_flow_labels_es | length),
    }'
```
Salida esperada:
```
{
  "cg": 2, "narr_sector": true, "narr_geo": true, "narr_conc": true, "narr_pos": true,
  "conc_label": "Muy concentrado", "is_listed": "No cotizada", "role0": "Apoderado", "cf_labels": 9
}
```

### HARDENING-004 · sigue pendiente

Este incidente confirma la deuda operativa registrada 2026-08-10.

**Propuesta mínima para el próximo turno** (no implementada hoy):
- Endpoint `POST /api/admin/cache/purge` protegido por header `X-Admin-Token` (env `ARROBA_ADMIN_TOKEN`).
  - Body: `{ "cif": "B28184687" }` → deleteMany por regex `_id: /:{cif}/`
  - Body: `{ "engine": "ficha" }` → deleteMany por regex `_id: /:financial:ficha:/`
  - Body: `{}` → deleteMany total (purga aggresiva, con confirmación `?force=true`).
- Log de la operación en `audit_log`. Retorno JSON con `{deleted: <int>, before: <int>, after: <int>}`.
- Efecto colateral: elimina la necesidad de `mongosh` en operativa post-deploy. Ejecutable desde cualquier consumer HTTP autenticado.

**Alternativa complementaria**: hook post-deploy CI/CD que invoque el endpoint automáticamente tras cada push. Fuera del alcance del proxy Arroba (responsabilidad del pipeline de deploy).

### Este turno: sin cambios de código

- Backend: sin modificar (sólo docs).
- Frontend: sin modificar.
- HARDENING-004: **NO implementado** — sólo documentado. Requiere autorización explícita del usuario para el próximo turno.
- Deploy: NO.

---
## 2026-08-13 · HARDENING-020 Canon Anexo B Señales + Oportunidades + barrida universal

### Contexto del turno
- Canon actualizado a `w15cn6ml_CANON_NARRATIVA_CF_FICHA.md` v2 (23 líneas nuevas · Anexo B "Señales + Oportunidades" añadido). Refrescado en `/app/memory/` + `/app/frontend/public/handoff/`.
- Foco: cerrar los dos bloques que aún mostraban payload crudo del motor. Sin tocar Comparativa (WIP `/tmp/wip_comparativa_20260813/`) ni `/connections`.

### Fase 0 · Payload verificado
- **Signals** endpoint `/api/companies/{cif}/signals` OK · 6 señales · shape con `explanation` (prosa Intel), `polarity`, `severity`, `category`, `dimensions{impact,confidence,urgency,persistence}`, `rule.id`, `recommended_actions`.
  - `title` = rule token técnico (`growth.ebitda_expansion`) → no usable como titular.
  - `explanation` sí es prosa CF ("EBITDA +24.4% interanual (> 20%).").
  - Intel NO emite `polarity_label`, `category_label_es`, `evidence_label`, ni `impact_band` explícitos → fallback local documentado.
- **Opportunities** endpoint `/api/companies/{cif}/opportunities?limit=N` OK · shape con `name` (prosa), `recommendation_type`, `score` (0-1), `reason` (prosa ES), `recommended_actions`, `fit_dimensions{}`.

### Fase 1 · Señales (Anexo B aplicado)
Componente `Senales` (`CompanyFichaLayoutV2.tsx`):
- Titular ← `s.explanation` (prosa CF Intel). `title`/`signal_type`/`rule.id` NO visibles.
- Polaridad ES canónica vía `SIG_POLARITY_LABEL_ES`: "Señal favorable/desfavorable/de alerta/informativa".
- **Retirado** el bloque de evidencia cruda (`ebitda_growth_yoy · 0,24 · yoy`).
- **Retirado** el chip `Urgencia`/`Persistencia`; sólo se renderizan `Impacto` + `Confianza` con bandas cualitativas (`muy alto` / `alto` / `moderado` / `bajo`) vía nuevo helper `qualitativeBand()`.
- **Retirado** `Regla · {rule.id}`; el `rule.id` pasa a `data-rule` en el DOM para debug.
- Acciones ES vía `SIG_ACTION_LABEL_ES` (`analyze→Analizar`, `add_to_watchlist→Añadir a seguimiento`, `compare→Comparar`, `contact→Contactar`, `value→Valorar`, `request_due_diligence→Solicitar due diligence`, +6 tokens más). Prefijo "→" retirado.
- Categoría ES vía `SIG_CATEGORY_LABEL_ES` (`growth→Crecimiento`, `market→Mercado`, `operational→Operativo`, `ownership→Propiedad`, +4 más). TODO documentado para migrar a `category_label_es` de Intel cuando lo emita.
- Subtítulo sección literal Anexo B: "Hechos y cambios recientes que afectan al atractivo de la compañía para una operación."

### Fase 2 · Oportunidades (Anexo B aplicado)
Componente `Oportunidades` (`CompanyFichaLayoutV2.tsx`):
- **Retirado** "Puntuación 0–100 de cada tesis para esta compañía". Nuevo copy: "Atractivo por tesis para esta compañía."
- Chip numérico `Math.round(v)` (0-100) → **retirado**. Sustituido por banda cualitativa (`qualitativeBand(v)`). Preservado el número real como `data-score` para debug.
- Tesis ← `o.name` (prosa Intel). `recommendation_type` NO visible.
- Acciones ES vía `OPP_ACTION_LABEL_ES` (superset de las de señales · +`prepare_teaser`, `find_buyer`, `save`). Estilo de badge coherente con Señales.

### Fase 3 · Barrida universal · residuos crudos
- **`sector.signal.replace(/_/g, ' ')`** (linea previa 1329) → RETIRADO. La `sector.narrative` ya lo cubre en prosa.
- **`geo.signal.replace(/_/g, ' ')`** (linea previa 1351) → RETIRADO. `geo.narrative` cubre.
- **"HHI"** como label suelto (línea 1379) → renombrado a "Índice de concentración" (número preservado como dato dentro de la fila, no como acrónimo etiqueta).
- **"(HHI)" + "Nivel: {conc.level}"** en header MercadoConcentrationPanel → RETIRADO (§Canon 3 · jerga codificada).
- **"({cnae_code} · {cnae_level})"** sufijo header MercadoSectorPanel → RETIRADO (§Canon 3 · nombre en claro).
- **"({geo_level})"** sufijo header MercadoGeoPanel → RETIRADO.
- **"YoY"** en hero widget + KPI chips → cambiado a "interanual" (§Canon 4 · cifra dentro de frase).
- **"CAGR Ingresos (3a)"** → "Crecimiento anualizado (3 años)".
- **"equity"** subtítulo Fondos propios → "patrimonio neto" (§Canon 4 · sin acrónimos ingleses sueltos).
- Preservados por criterio: `EBITDA` con `<abbr title="...">` (canon 4 permite acrónimo financiero con glosa), `ROE` con `abbr`, `CNAE {code}` en Identity registral (contexto legal registral, distinto del contexto de mercado).

### Fase 4 · Verificación
- `yarn typecheck`: **verde** (3.32 s).
- `yarn build`: **verde** (18.48 s) · First Load JS shared **87.3 kB** (baseline preservado).
- Curl `/api/companies/B28184687/signals` (auth): 6 señales con `explanation`, `polarity`, `category`, `dimensions`, `recommended_actions` — mapeados por el rework a bandas + labels ES.
- Curl `/api/companies/B28184687/opportunities?limit=4` (auth): 3 recomendaciones con `name`, `reason`, `recommended_actions` — bandas cualitativas + acciones ES aplicadas.
- Curl `/api/companies/B28184687/signals` (anon): retorna `{}` con `code: no_session` (fail-closed por diseño · sección gated).

### Bugfix accidental encontrado durante el turno
Detectado y corregido bloque duplicado al final de `CompanyFichaLayoutV2.tsx` (líneas 2682-2691 fuera de la función `CompanyFichaLayoutV2` con contenido huérfano "uí verás la recomendación de actuación."). No commiteado antes (blame: "Not Committed Yet" · introducido en un merge/paste anterior de este turno). Retirado para restaurar la sintaxis.

### DEPLOY
- **NO desplegado.** Bundle acumulado para próximo push manual del usuario tras `e1_tester` verde.
- **Recordatorio operativo para el push**: incluir purga cache (`db.intelligence_cache.deleteMany({_id: /:financial:ficha:/})`) tras el deploy para invalidar los payloads viejos (HARDENING-004 sigue pendiente de automatización).

### Estado global (post-HARDENING-020)
- ✅ HARDENING-018 Propiedad 1:1 · verde pre-push (bundle acumulado)
- ✅ HARDENING-019 Fase B canon CF + Gobierno ES · verde pre-push
- ✅ HARDENING-020 Canon Anexo B Señales + Oportunidades + barrida · verde pre-tester
- ⏸️ Comparativa peers T5-T10 · congelada `/tmp/wip_comparativa_20260813/`
- ⏸️ `/connections` grafo Propiedad · aparcado (3 respuestas Intel pendientes)
- ❌ HARDENING-004 automated cache invalidation · sin implementar (documentado post-incidente cache-stale)

---
## 2026-08-13 · HARDENING-020 corrección post-tester · fix client-side exception

### Causa raíz identificada
Tras aplicar HARDENING-020 y ejecutar `yarn build`, los hashes de los chunks Webpack cambiaron (nuevos artefactos en `.next/static/chunks/`). El servidor `next start` (que el pod dev corre en modo production, no `next dev`) **mantiene el manifest de chunks en memoria hasta un restart**. Consecuencia:
- El servidor sirve HTML con `<script src="page-b296a8ee28ece354.js">` (hash del build previo).
- El filesystem tiene ya el nuevo bundle (hash distinto).
- El browser recibe `404` para el chunk viejo → `ChunkLoadError: Loading chunk 11 failed`.
- React 18 propaga el error como `#423` (**"There was an error while hydrating this Suspense boundary"**) → Next.js muestra el fallback global: `Application error: a client-side exception has occurred`.

**El código de HARDENING-020 no tiene bug**. Es un incidente operativo del workflow build ↔ hot-reload.

Stack trace capturado del test previo (`console_20260812_165214.log`):
```
error: Failed to load resource: 404 at
  http://localhost:3000/_next/static/chunks/app/%5Blocale%5D/(ficha)/empresa-f01/%5Bcif%5D/page-b296a8ee28ece354.js
error: ChunkLoadError: Loading chunk 11 failed
  at d.f.j (webpack-0a5c4b12ecd32c81.js)
  ...
PAGE ERROR: Minified React error #423
  → "There was an error while hydrating this Suspense boundary"
```

### Fix aplicado (defense in depth)
Aunque la causa raíz es operativa, se aplican tres refuerzos defensivos para blindar el UI contra edge cases futuros:

1. **`qualitativeBand()` reforzada** (`CompanyFichaLayoutV2.tsx`):
   - Firma cambia de `(rawScore: number) → string` a `(rawScore: number | null | undefined) → string | null`.
   - Guard early return si `null`/`undefined`/`NaN`/`Infinity` → retorna `null` (R15: no fabricar).

2. **`IntelligenceSectionErrorBoundary` genérico** (nueva clase, parametrizable con `label` + `sectionTestid`):
   - Aísla crashes de una sección para que la ficha completa siga montándose.
   - Loguea a consola en dev; degrada a `<Empty label={label} />` en cualquier entorno.
   - En dev muestra `.error.message` bajo el `<Empty/>` para debug.
   - Sigue el patrón de `ControlGraphErrorBoundary` (HARDENING-017).

3. **Envolvente de Señales + Oportunidades**:
   ```jsx
   <IntelligenceSectionErrorBoundary label="Señales" sectionTestid="senales-error-boundary">
     <Senales signal={props.signal} />
   </IntelligenceSectionErrorBoundary>
   ```
   Idem `Oportunidades`. Cero coste si no crashea.

4. **Guards Array.isArray**:
   - `s.recommended_actions` y `o.recommended_actions` → `?.length && Array.isArray(...)` antes de `.map()`. Previene crash si el payload trae shape no-array (defensa contra Intel shape shift).

### Verificación local (pod dev)
- `yarn typecheck`: **verde** (3.30 s).
- `yarn build`: **verde** (17.24 s) · First Load JS shared **87.3 kB** (baseline preservado).
- `sudo supervisorctl restart frontend` tras el build (crítico · sin el restart el server sirve manifest viejo).
- Screenshot `http://localhost:3000/es/empresa-f01/B28184687` sin sesión → carga "Empresa no encontrada" (ruta legítima cuando identity resolver falla en 404) SIN "Application error".
- Console log de Playwright: **cero** ChunkLoadError, cero React error #423.

### Workflow operativo endurecido (documentado)
Para próximos turnos con cambios en frontend + `yarn build`:
1. `yarn typecheck` verde.
2. `yarn build` verde.
3. **`sudo supervisorctl restart frontend`** (obligatorio · sin él el manifest queda stale).
4. Screenshot smoke local para verificar ausencia de crash.

### DEPLOY
- **NO desplegado.** Bundle acumulado. En el push manual del usuario, ejecutar tras deploy:
  1. Purga cache Mongo (`db.intelligence_cache.deleteMany({_id: /:financial:ficha:/})`).
  2. Restart de los pods de producción (asegura que sirven el manifest fresco).
- HARDENING-004 automatización sigue pendiente.

---
## 2026-08-13 · HARDENING-020-fix · Oportunidades reason CF + YoY residual

### Fix 1 · Oportunidades · reason con tokens técnicos
- **Payload inspeccionado** (`curl /api/companies/B28184687/opportunities?limit=4`):
  - `opportunity.reason` es texto crudo: `"INDUSTRIAS MORERA es opportunity (rol: acquisition_target) para LABORATORIOS SERVIER: semejanza semántica 0.083638, ajuste financiero 0.3, sector igual, no consolidador."`
  - **Campos estructurados disponibles** (Escenario A):
    - `recommendation_type: "opportunity"` (top-level)
    - `fit_dimensions.strategic_fit.{value, evidence[]}` con flags `same_sector`, `candidate_consolidator`, `same_group`.
    - `fit_dimensions.financial_fit.{value, evidence[]}` con floats `size_proximity`, `margin_proximity`.
    - `fit_dimensions.semantic_fit.{value, evidence[]}` con `embedding_cosine`, `same_section`.
    - `fit_dimensions.signal_fit`, `execution_fit`.
- **Escenario elegido**: **A** (Intel emite estructurados → construir prosa CF localmente).
- **Helper añadido**: `formatOpportunityReason(opp: BuyerItem): string | null` en `CompanyFichaLayoutV2.tsx` (~línea 2440). Vocabulario CF controlado con 3 bandas:
  - `strategic_fit.evidence` → "mismo sector" / "sector adyacente".
  - `semantic_fit.value` (0-1) → "alta afinidad estratégica" (≥0.70) / "afinidad moderada" (≥0.40) / "afinidad ligera" (<0.40).
  - `financial_fit.value` (0-1) → "buen encaje financiero" / "encaje financiero moderado" / "encaje financiero ajustado".
- **R15 respetado**: cero regex sobre `opportunity.reason`. Solo consumo de campos estructurados. Umbrales del canon Anexo B.
- **Ejemplo real de output CF** (Servier · INDUSTRIAS MORERA con `sem=0.0836, fin=0.2963, same_sector=True`):
  > "Mismo sector, afinidad ligera, encaje financiero ajustado."
- **Verificación local (unit-ish)**: 4/4 oportunidades del dataset Servier generan prosa CF sin `opportunity`, `acquisition_target`, `0.083638`, `0.3`. ✅
- **REQ-INTEL emitido**: `/app/memory/PARA_INTEL_opportunities_narrative_cf.md` (P2 · pide `opportunities[i].reason_narrative_cf` en prosa CF ES · reemplazará el helper local cuando Intel emita).
  - Copiado a `/app/frontend/public/handoff/PARA_INTEL_opportunities_narrative_cf.md` · HTTP 200 verificado.

### Fix 2 · YoY residual (barrida final)
- **Ocurrencia encontrada**: `CompanyFichaLayoutV2.tsx:359` — chip del hero widget de sector.
  ```
  YoY <b>{sector.national_yoy_pct > 0 ? '+' : ''}{...}%</b>
  ```
- **Sustitución aplicada**: `<b>{...}%</b> interanual` (número precede a la palabra en frase CF).
- Otros `YoY` detectados NO son runtime visible:
  - `home/copilot-demo-script.ts:116` · demo landing (fuera de ficha).
  - `blocks/design-system-primitives.test.tsx:129` · test.
  - `finanzas/FinancialEvolution.tsx:8, :78` · comentarios internos del código.
  - `.bak_*` · backups históricos.
- **Verificación local**: en la ficha visible (`/es/empresa-f01/B28184687`) no queda ningún "YoY" en JSX runtime. ✅

### BUILD
- `yarn typecheck`: **verde** (3.38 s).
- `yarn build`: **verde** (17.42 s) · First Load JS shared **87.3 kB** (baseline preservado).
- `sudo supervisorctl restart frontend`: aplicado tras build (workflow endurecido).

### DEPLOY
- **NO** — bundle acumulado (HARDENING-018 + 019 + 020 + fixes) para próximo push manual.
- Checklist post-push (documentado): purga cache (`db.intelligence_cache.deleteMany({_id: /:financial:ficha:/})`) + restart pods.

---
## 2026-08-13 · HARDENING-021 · Explicabilidad-primero (Fase 1 + Fase 3 + REQ Fase 2)

### Workstream A · REQ + Glosario
- **Glosario canónico** descargado en `/app/memory/GLOSARIO_EXPLICABILIDAD_FICHA.md` (5.1 kB · 74 líneas · 30+ términos). Copia public en `/app/frontend/public/handoff/GLOSARIO_EXPLICABILIDAD_FICHA.md` → **HTTP 200** verificado en preview URL.
- **REQ Fase 2 emitido** `PARA_INTEL_metric_provenance.md` (6.7 kB · 2 opciones de shape, vocabulario controlado 3 valores, cobertura mínima, DPD passthrough) → **HTTP 200** verificado. Prioridad P2 · en cola tras REQs labels/comparables/opportunities-narrative.

### Workstream B · Fase 1 · Explicabilidad + micro-animaciones
**Archivos nuevos**:
- `/app/frontend/src/lib/companies/glosario.ts` · **28 entradas** en 7 categorías (Rentabilidad+Resultado 6, Valor+Precio 3, Deuda+Solvencia 7, Caja+Circulante 6, Crecimiento 1, Posición+Mercado 3, Señales 2). Copy literal del glosario canónico, cero mención a "Intel" o internos. Helper `formatGlosarioTooltip()` para composición determinista.
- `/app/frontend/src/components/company/atoms/Tip.tsx` · **`TipProvider` global** (renderiza un único `.tip` fixed en `<body>` con listeners globales delegados a `[data-tip]`) + wrapper `<Tip term text>`. Accesibilidad completa: mouseenter/leave, focusin/focusout (teclado), touchstart (móvil, auto-hide 3s), `role="tooltip"`, `aria-describedby` dinámico, `Escape` para cerrar. Escape HTML defensivo XSS-safe. Layout defensivo con viewport clamp.
- `/app/frontend/src/hooks/useRevealOnScroll.ts` · 3 hooks: **`useRevealOnScroll`** (IntersectionObserver + animation `revUp .5s cubic-bezier(.2,.7,.3,1) forwards`), **`useCountUp`** (0 → target con `requestAnimationFrame` · ease-out cubic · respeta `prefers-reduced-motion`), **`useBarFill`** (width:0 → X% via transición CSS `transition:width .9s cubic-bezier(.3,.7,.3,1)` ya en `fichaMockupCss.ts`). Todos IntersectionObserver-based con `once: true` (disconnect tras primer trigger). SSR-safe.

**Wiring · TipProvider global**:
- `CompanyFichaF01Client.tsx` envuelve todo el layout con `<TipProvider>` — punto único de instalación.

**Wiring · `data-tip` en KPIs hero** (`CompanyFichaLayoutV2.tsx`, líneas 447-468):
- `EBITDA` chip → `data-tip="EBITDA"`
- `margen` (Margen EBITDA) → `data-tip="MARGEN_EBITDA"`
- `Resultado neto` → `data-tip="RESULTADO_NETO"`
- `Crecimiento anualizado (3 años)` → `data-tip="CAGR_3Y"`
- `EBITDA` growth chip → `data-tip="EBITDA"`
- `patrimonio neto` (Fondos propios subtitle) → `data-tip="AUTONOMIA_FINANCIERA"`
- `abbr title=` reemplazados por `span.help` (patrón mockup) con `tabIndex=0` para keyboard focus.

**Wiring · `data-tip` en Mercado Concentración**:
- `Índice de concentración` label → `data-tip="HHI"` (banda cualitativa + why-M&A).

**Términos SIN cobertura en el glosario** (candidatos futuros que el usuario debería redactar):
- `Enterprise Value` (existe `abbr title` legacy pero no está en el glosario canónico → dejar sin `data-tip` hasta que el usuario apruebe).
- `Equity value` (label Valoración) → idem.
- `Múltiplo` / `EV/EBITDA` cell → idem.
- `Percentil sectorial` label Rankings → NO usar `data-tip="PERCENTIL_SECTORIAL"` todavía porque el copy CF puede requerir versión CF-oriented.
- `Impacto` / `Confianza` chips de Señales → sí están en glosario (`SIGNAL_IMPACT`, `SIGNAL_CONFIDENCE`) pero el rework HARDENING-020 no dejó slot; se cablearán en un pase futuro por ergonomía visual (chip + tooltip sobre chip).

**Hooks disponibles pero NO cableados aún** (ready to use en próximo pase Fase 1-B por si el usuario aprueba tras el tester):
- `useRevealOnScroll` — para cards de sección al scrollear.
- `useCountUp` — para KPI hero facturación/EBITDA/patrimonio.
- `useBarFill` — para barras percentil/rank/gap.

Razón: el turno prioriza tooltips + MethodDetails (ROI visual inmediato) sobre micro-animaciones. Aplicación selectiva evita over-engineering y facilita revisión visual del tester sin ruido.

### Workstream C · Fase 3 · Metodología estática
**Archivo nuevo**:
- `/app/frontend/src/components/company/atoms/MethodDetails.tsx` · componente `<MethodDetails>` + 3 constantes con copy CF canónico redactado en prosa CF: `METHOD_VALORACION`, `METHOD_HHI`, `METHOD_RANKINGS`.

**Cableado**:
- **Valoración** (`CompanyFichaLayoutV2.tsx:961+`): retirado el `<details className="method">` genérico que sólo mostraba el string `methodology` del payload. Sustituido por `<MethodDetails>` con copy canónico (fórmula `EV = múltiplo × EBITDA − deuda neta + caja` + 4 pasos). El `methodology` original se preserva como nota metodológica del motor debajo (fuente estilística `.cs` italic).
  - `¿Por qué este valor?` ya consumía `valuation.hypotheses` (line 952) → intacto.
- **Mercado · Concentración** (`MercadoConcentrationPanel`, línea 1460+): añadido `<MethodDetails>` con fórmula `HHI = Σ(cuota_i)² × 10.000` + 3 pasos (bandas <1.500 / 1.500-2.500 / >2.500).
- **Rankings** (`Rankings`, línea 1319+): añadido `<MethodDetails>` con 3 pasos (universo comparable · orden por facturación · lectura de percentil).

**R15 respetado**: los `<MethodDetails>` describen método, no datos concretos de empresa. La sección "¿Por qué este valor?" sigue consumiendo `valuation.hypotheses` real de Intel (no fabrica hipótesis).

### BUILD
- `yarn typecheck`: **verde** (3.86 s).
- `yarn build`: **verde** (18.61 s) · First Load JS shared **87.3 kB** (baseline preservado). El glosario (~4 kB compacto) + Tip.tsx (~3 kB) + MethodDetails (~1 kB) + hooks (~2 kB) se comparten dinámicamente entre chunks de la ficha; no incrementan el shared del bundle inicial.
- `sudo supervisorctl restart frontend`: aplicado (workflow endurecido post-HARDENING-020-fix).

### DEPLOY
- **NO** — bundle acumulado (HARDENING-018 + 019 + 020 + 020-fix + 021) para próximo push manual.
- **Checklist post-push**: purga cache (`db.intelligence_cache.deleteMany({_id: /:financial:ficha:/})`) + restart pods prod para servir manifest fresco.

---
## 2026-08-13 · HARDENING-021 Fase 1 completa · 3 hooks + 4 tooltips + lvlIn revisado

### Tarea 1 · Tooltips restantes cableados (4/4)
Todos con el patrón `<span className="help" data-tip="{KEY}" tabIndex={0}>...</span>` (canon del mockup · líneas 615/616), consumiendo el glosario ya publicado.

| Término runtime | Key GLOSARIO | Ubicación exacta |
|---|---|---|
| Enterprise Value | `ENTERPRISE_VALUE` | `CompanyFichaLayoutV2.tsx:995` (h3 card Valoración) |
| Múltiplo (EV/EBITDA) | `EV_EBITDA` | `CompanyFichaLayoutV2.tsx:999` (idrow) |
| Equity value | `EQUITY_VALUE` | `CompanyFichaLayoutV2.tsx:1000` (idrow) |
| Percentil sectorial | `PERCENTIL_SECTORIAL` | `CompanyFichaLayoutV2.tsx:1378` (Rankings percentil grande) |

**Ajustes en `glosario.ts`**: ninguno. Las 4 keys ya coincidían exactas con el glosario canónico.

**`<abbr title>` legacy retirado**: 1 (Enterprise Value línea 995) — reemplazado por `<span className="help">` para consistencia con el resto del sistema `.tip`.

### Tarea 2 · 3 hooks cableados con mesura

**`useRevealOnScroll` (revUp)** aplicado a **cards con más valor de reveal** — mesura estricta, no cascada:
- `¿Por qué este valor?` (Valoración · `valuation-why-this-value`)
- `<MethodDetails>` Valoración (`valuation-method-wrap`)
- `<MethodDetails>` HHI (`hhi-method-wrap`)
- `<MethodDetails>` Rankings (`rankings-method-wrap`)

Envueltas con nuevo helper `<RevealCard>` (línea 306) que aplica `useRevealOnScroll` + estado inicial `opacity:0; transform:translateY(10px)` + `revUp .5s cubic-bezier(.2,.7,.3,1) forwards` cuando entra en viewport. `once: true`, respeta `prefers-reduced-motion` (fallback estado `opacity:1` inmediato en el hook).

**Decisión de mesura**: NO aplicado a las secciones `<section className="panel on">` porque ya usan la animación `fade .25s ease` heredada del mockup (línea 115 CSS) cuando cambia la tab. Duplicar `revUp` sobre ellas produce doble entrance.

**`useCountUp`** aplicado a 2 lugares:
- `Ring` (Diagnóstico rings de score, línea 218 refactorizado) · antes usaba `requestAnimationFrame` al mount; ahora se dispara al entrar en viewport vía `IntersectionObserver`. Respeta `prefers-reduced-motion` (muestra valor final directo). Una sola animación por elemento.
- `PercentileValue` (Rankings percentil grande, línea 282) · componente nuevo · anima `0 → pct` con formato `${Math.round(n)}º`. Si `pct` es null → renderiza guión (R15).

**Decisión de mesura**: NO aplicado a los KPIs del hero (Facturación/EBITDA/Empleados). Razón: son 6 KPIs simultáneos, animarlos todos genera ruido visual "wall of animation". Los rings de score y el percentil grande ya son puntos focales suficientes para transmitir "explicabilidad activa".

**`useBarFill`** aplicado a:
- `.owbar .obt i` (Propiedad · tab Distribución) vía nuevo componente `OwnBar` (línea 300). Anima `width:0 → pct%` al aparecer en viewport, aprovechando la transición CSS `.9s cubic-bezier(.3,.7,.3,1)` ya en `fichaMockupCss.ts`. Una animación por elemento; los ítems siguientes de la lista se animan escalonadamente porque cada uno tiene su propio observer.

**Decisión de mesura**: NO aplicado a `.rk .rb i` (barras Rankings) — la sección Rankings actual **no renderiza barras** (usa `.idrow` con números). Las `<PorQueEsteValor>` no tienen `.gaprow .gb i` en el shape actual (los `hypotheses` son strings, no ejes numéricos). Se re-cablearán cuando Intel emita eses estructurados.

**Reduced-motion honrado en los 3 hooks**: `useCountUp` verifica `matchMedia('(prefers-reduced-motion: reduce)').matches` y muestra valor final directo; `useRevealOnScroll` deja el elemento visible sin animación en SSR/legacy; `useBarFill` aplica el `width:pct%` inmediatamente sin transición cuando el observer no está disponible.

### Tarea 3 · lvlIn Finanzas
- Grep `Nivel de detalle` sólo devuelve resultados en `CompanyFichaLayoutV2.tsx.bak_*` (backups históricos).
- **El slider NO existe en la vista actual del layout V2**. Fue retirado en la refactorización del layout (probablemente en HARDENING-011 o previo, coincidiendo con la introducción de las tablas Balance/Cuenta con expand/collapse por row en vez de un slider global).
- **`lvlIn` no cableado** — no hay componente donde aplicarlo hoy. Cuando el usuario reintroduzca el slider (o un mecanismo equivalente de despliegue progresivo de rows), aplicaremos `.lvl-in-row` con `animation: lvlIn .28s ease both` + delays escalonados. Documentado aquí para retomar cuando aplique.

### BUILD
- `yarn typecheck`: **verde** (3.41 s) — 1 warning inicial de TS null-check en el observer intermitente del Ring, corregido explicitando el tipo `IntersectionObserver | null`.
- `yarn build`: **verde** (17.29 s) · First Load JS shared **87.3 kB** (baseline preservado — el wiring nuevo se comparte dinámicamente entre chunks de la ficha).
- `sudo supervisorctl restart frontend`: aplicado (workflow endurecido).

### DEPLOY
- **NO** — bundle acumulado (HARDENING-018 + 019 + 020 + 020-fix + 021 completo) para push manual del usuario.
- **Smoke manual Daniel**: verificación visual en pod dev antes del push.
- **Checklist post-push (recordatorio)**: purga cache Mongo (`db.intelligence_cache.deleteMany({_id: /:financial:ficha:/})`) + restart pods prod para servir manifest fresco.

### Estado global (post-HARDENING-021)
- ✅ HARDENING-018 Propiedad 1:1 · verde pre-push
- ✅ HARDENING-019 Fase B canon CF + Gobierno ES · verde pre-push
- ✅ HARDENING-020 Anexo B Señales + Oportunidades + barrida · verde pre-push
- ✅ HARDENING-020-fix Oportunidades reason CF + YoY residual · verde pre-push
- ✅ HARDENING-021 Fase 1 (tooltips + micro-animaciones) + Fase 3 (MethodDetails) · verde pre-push
- ⏸️ Fase 2 (procedencia por métrica `.srcdot`) · aparcada · REQ P2 emitido
- ⏸️ Comparativa peers T5-T10 · congelada `/tmp/wip_comparativa_20260813/`
- ⏸️ `/connections` grafo Propiedad · aparcado (3 respuestas Intel pendientes)
- ✅ HARDENING-004 automated cache invalidation · implementado (ver bloque abajo)
- ✅ HARDENING-022 redistribución Resumen (7 bloques + T1 cabecera renovada) · implementado (ver bloque abajo)

---

## 2026-08-13 · HARDENING-004 · Endpoint admin de purga de caché · DONE

Reemplaza el workflow manual `mongosh deleteMany({_id: /:financial:ficha:/})` que se ejecutaba post-deploy para invalidar `intelligence_cache` (capa Mongo persistente).

### Contrato

- **Ruta**: `POST /api/admin/cache/purge`
- **Auth**: header `X-Admin-Token` (env `ARROBA_ADMIN_TOKEN`). Fail-safe: si el env está vacío el endpoint responde 503; fail-closed: token ausente/incorrecto responde 401 con `{"error": "invalid admin token"}`.
- **Body** (exclusivo · exactamente una llave):
  - `{"cif": "B28184687"}` → regex `:{cif}:` sobre `_id` (borra todas las entries del CIF, cualquier motor)
  - `{"engine": "ficha"}` → regex `^[^:]+:{engine}:` sobre `_id` (restringe al 2º segmento canónico `provider:engine:...`)
  - `{"force": true}` → borrado total (requiere flag explícito · `false` no vale)
- **Response 200**: `{ok, mode, filter, before, deleted, after, duration_ms}`.
- **Errores**: 400 (body inválido), 401 (auth), 500 (Mongo), 503 (token no configurado).
- **Doble capa**: purga Mongo (`intelligence_cache` colección) + memoria LRU del pod (`MemoryCache._store`). El pod que atiende la request limpia SU capa 1; los otros pods del cluster limpian por TTL en el próximo hit.

### Archivos

- **Nuevo**: `/app/backend/src/modules/intelligence_layer/admin.py` (~220 líneas · `admin_router` + `PurgeRequest` + `PurgeResponse` + `purge_cache`).
- **Modificado**: `/app/backend/src/modules/intelligence_layer/config.py` (+7 líneas · `arroba_admin_token: str = ""`).
- **Modificado**: `/app/backend/src/main.py` (+2 líneas · import + `include_router` + tag OpenAPI `admin`).
- **Modificado**: `/app/backend/.env` (+1 línea · `ARROBA_ADMIN_TOKEN=<64-char urlsafe token>`).

### Verificación (6 curls · Servier B28184687 · localhost:8001)

| # | Escenario | HTTP | Body |
|---|-----------|-----:|------|
| 1 | sin header | 401 | `{"error":"invalid admin token"}` |
| 2 | token incorrecto | 401 | `{"error":"invalid admin token"}` |
| 3 | modo `cif` B28184687 | 200 | `{"ok":true,"mode":"cif","filter":"B28184687","before":1,"deleted":1,"after":0,"duration_ms":1}` |
| 3b | modo `cif` B59022921 | 200 | `{"ok":true,"mode":"cif","filter":"B59022921","before":3,"deleted":3,"after":0,"duration_ms":1}` |
| 4 | modo `engine` valuation | 200 | `{"ok":true,"mode":"engine","filter":"valuation","before":8,"deleted":8,"after":0,"duration_ms":2}` |
| 5 | modo `force` | 200 | `{"ok":true,"mode":"force","filter":null,"before":29,"deleted":29,"after":0,"duration_ms":5}` |
| 6 | body vacío `{}` | 400 | `{"error":"Value error, Body must contain exactly one of: cif, engine, force. Received: none"}` |
| 6b | dos llaves | 400 | `{"error":"Value error, Body must contain exactly one of: cif, engine, force. Received: ['cif', 'force']"}` |

Total colección tras `force`: 0 docs (verificado con `count_documents`).

### OpenAPI

- Endpoint expuesto en `/api/openapi.json`: `/api/admin/cache/purge` con tag `admin`, responses 200/400/401/422/500/503.

### Audit log

Cada request produce entrada estructurada en `intelligence_layer.admin`:
- Éxito: `admin.cache_purge.ok mode=... filter=... before=... deleted=... after=... memory_dropped=... duration_ms=... caller_ip=...`
- Auth failure: `admin.cache_purge.unauthorized caller_ip=... had_header=...`
- Config missing: `admin.cache_purge.no_token_configured caller_ip=...`

### Uso post-deploy

Reemplaza el `mongosh` manual:

```bash
# ANTES (manual):
mongosh "$PROD_MONGO_URI" --eval 'db.intelligence_cache.deleteMany({_id: /:financial:ficha:/})'

# DESPUÉS (HARDENING-004):
curl -X POST "https://beta.arroba.com/api/admin/cache/purge" \
  -H "X-Admin-Token: $ARROBA_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"engine":"ficha"}'
```

### Deploy

- **NO desplegado** · cambio backend acumulado en bundle HARDENING-021 + HARDENING-004 para push manual del usuario.
- Requiere sync de `ARROBA_ADMIN_TOKEN` en el panel Prod antes de que el endpoint sea utilizable en producción (si el env prod no lo lleva, el endpoint responde 503).

---

## 2026-08-13 · HARDENING-022 · Redistribución pestaña Resumen · DONE

Spec canónica: `/app/memory/PARA_RESUMEN_REDISTRIBUCION.md` (6.6 KB · descargable en `/handoff/PARA_RESUMEN_REDISTRIBUCION.md`).

### Orden previo → nuevo

**Antes** (JSX top-to-bottom):
1. HeroBlock (prosa + "Veredicto de ARROBA" + hero-sector-widget)
2. Evolución financiera
3. KPIs 1ª fila (Facturación, EBITDA, Resultado neto, Empleados)
4. KPIs 2ª fila (CAGR, Crecimiento anual, Fondos propios, TrendPill)
5. KPIs 3ª fila (Rankings)
6. Diagnóstico + Identificación (marco azul + row r2)
7. IdentidadAmpliada

**Después** (spec 1:1):
1. **T1 Cabecera** (top-level `chead`, aplica a todas las pestañas)
2. **T2 KPIs** · 4 KPIs nuevos (Facturación · EBITDA · DN/EBITDA · Activos totales) + sparklines + YoY
3. **T3 Resumen de compañía** (prosa · card oscura + disclaimer condicional)
4. **T4 Tesis de oportunidad** (rename "Veredicto de ARROBA" · card destacada roja)
5. **T5 Detalles de la compañía** (rename "Identificación" + Resultado neto + Empleados movidos)
6. **T6 Diagnóstico de ARROBA** (scores sin marco azul · explicación via tooltip)
7. **T7 Evolución financiera** (al final)

### T1 · Cabecera (`chead` top-level)

| Elemento | Estado | Campo payload | Nota |
|:--|:--|:--|:--|
| Título (razón social) | ✅ existente | `identity.legal_name` | intacto |
| URL clicable ↗ | ✅ cableado | `identity.contact.web` | `<a href target=_blank rel=noopener>` con `<ExternalLink size=11>` |
| Icono LinkedIn | ✅ cableado condicional | `identity.contact.linkedin` | NUNCA construida (regla spec) · Servier: null → icono ausente |
| Actividad ES | 🟡 fallback | `identity.activity_es → cnae_description → activity` (EN) | Intel no emite `activity_es` aún · fallback muestra EN literal |
| Subtítulo formato spec | ✅ | `RS · CIF · [actividad] · Localidad (Provincia) · URL ↗ · [LI]` | |
| Badge Verificada | ✅ condicional | `identity.verified === true AND has_financials === true` | Servier: ambos null → ausente (R15) |
| Badge Auditada · {nombre} | ✅ condicional | extraído de `governance.officers[]` con rol Auditor · fallback `identity.auditor_name` | Servier: sin rol auditor → ausente |
| Chips oportunidades | ✅ slot reservado | `opportunities.thesis_active[]` | Pendiente Intel · slot invisible si vacío |

### T2 · KPIs (4 nuevos con sparklines + YoY)

| KPI | Campo Intel | YoY | Sparkline | Nota |
|:--|:--|:--:|:--:|:--|
| Facturación | `finances.kpis.revenue` | `revenue_growth_yoy` (0.1173) | ✅ 3 puntos `evolution.points[i].revenue` | tooltip `FACTURACION` (TODO glosario) |
| EBITDA | `finances.kpis.ebitda` | `ebitda_growth_yoy` (0.2438) | ✅ 3 puntos `evolution.points[i].ebitda` | tooltip `EBITDA` (existe) |
| DN / EBITDA | `finances.ratios.net_debt_to_ebitda` (Intel no emite) | — | ausente | **Empty honesto** "Sin deuda neta" (R15) |
| Activos totales | `finances.balance_sheet.total_assets` (97.4 M€) | — | ausente | Intel no emite serie histórica · tooltip `ACTIVOS_TOTALES` (TODO glosario) |
| Empleados/Resultado neto | movidos a T5 | | | |

Sparkline: SVG minimalista, cero ejes, cero labels, color según YoY (verde `up` · rojo `down`). `prefers-reduced-motion` respetado (path estático, sin animación).

### T3 · Resumen de compañía (prosa · card oscura)

- Card con `background: linear-gradient(135deg, #1c1a18, #34302b)` (patrón del nodo central Propiedad).
- Fuente cascada: `identity.description → identity.objeto_social → financialAnalysis.identity.description → objeto_social`.
- Disclaimer condicional: sólo si `identity.description_source ∈ {'ai','web'}`. Servier: null → **no disclaimer** (R15).

### T4 · Tesis de oportunidad (rename Veredicto)

- Card `card` con `border-left: 3px solid var(--red)` + `background: linear-gradient(180deg, var(--red-tint), #fff)` · icono `<Sparkles size=13>` en h3.
- Fuente preferida: `opportunities.thesis_narrative` (Intel pendiente · REQ implícito).
- Fallback legacy: `finances.assessment.verdict` (Servier: "Perfil financiero sólido y consistente...").
- Contiene `<SectorSignalWidget>` (reutilizado del legacy HeroBlock) como contexto sectorial subordinado.
- CTA "Explorar oportunidad" · placeholder `notify.info` (bloqueado hasta que Intel exponga `opportunities.thesis_active[]`).

### T5 · Detalles de la compañía (rename + campos movidos)

- Rename "Identificación" → "Detalles de la compañía".
- Añadido: `Resultado neto` (con SrcDot + tooltip `RESULTADO_NETO` + margen) · `Empleados` movidos del hero.
- `<IdentidadAmpliada>` (34 campos) intacto abajo.
- Testids: `detalles-compania` (auth) · `detalles-compania-anon` · `detalles-net-income` · `detalles-employees`.

### T6 · Diagnóstico de ARROBA (sin marco azul)

- Retirado `<div className="cs">Valoración cualitativa de ARROBA</div>` (explicación via tooltip).
- Retirado `<div className="row r2">` (que agrupaba con Identificación) → ahora `<div>` simple.
- Anillos (Ring) intactos con `useCountUp` respetando `prefers-reduced-motion`.
- Testid: `diagnostico-arroba`.

### T7 · Evolución financiera (al final)

- `<div>` movido al final del JSX de Resumen.
- Testid: `evolucion-financiera`.
- `<abbr title="…">EBITDA` reemplazado por `<span className="help" data-tip="EBITDA" tabIndex={0}>` para consistencia con sistema `<Tip>` de Fase 1.

### Tipos extendidos (aditivos · zero breaking change)

- `IdentityContact.linkedin?: string | null` (nuevo)
- `IdentitySection.activity_es?: string | null`
- `IdentitySection.verified?: boolean | null`
- `IdentitySection.has_financials?: boolean | null`
- `IdentitySection.auditor_name?: string | null`
- `IdentitySection.description_source?: 'official' | 'ai' | 'web' | null`

Adapter `adaptIdentityFromFicha` en `CompanyFichaF01Client.tsx` mapea desde el shape crudo Intel (top-level: `linkedin`, `activity_es`/`cnae_activity_es`/`cnae_description_es`, `verified`, `has_financials`, `auditor_name`, `description_source`). Passthrough puro.

### Auditor extraction helper

`extractAuditorName(governance)` en `CompanyFichaLayoutV2`: escanea `governance.officers[]` con matching acento-insensitive de keywords (`auditor`, `auditoría`, etc.) sobre `role_label_es / role_label / role`. Cero fabricación. Servier: sin match → null.

### Glosario · TODO copy pendiente al usuario

| Key | Estado | Acción usuario |
|:--|:--|:--|
| `EBITDA` | ✅ existe | — |
| `DN_EBITDA` | ✅ existe | — |
| `RESULTADO_NETO` | ✅ existe | — |
| `PERCENTIL_SECTORIAL` | ✅ existe | — |
| `AUTONOMIA_FINANCIERA` | ✅ existe | — |
| `FACTURACION` | ❌ **falta** | Redactar copy CF (llano · 1-2 frases). Sugerencia estructura: definition + why_ma. |
| `ACTIVOS_TOTALES` | ❌ **falta** | Idem. |
| `QUALITY_SCORE` | ❌ falta | Copy anillo T6 Diagnóstico "Calidad" |
| `BUYER_FIT_SCORE` | ❌ falta | Copy anillo "Encaje comprador" |
| `OPPORTUNITY_SCORE` | ❌ falta | Copy anillo "Oportunidad" |

Sin la entrada glosario, `<Tip>` mostrará el `data-tip` literal (fallback defensivo). Zero-coupling: usuario sólo edita `glosario.ts`.

### Archivos modificados

| Archivo | Cambio |
|:--|:--|
| `/app/frontend/src/lib/companies/intelligence-types.ts` | +7 líneas · campos aditivos `IdentityContact.linkedin` + `IdentitySection.{activity_es,verified,has_financials,auditor_name,description_source}` |
| `/app/frontend/src/components/company/CompanyFichaF01Client.tsx` | +12 líneas · adapter passthrough de nuevos campos |
| `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` | Refactor completo: +Sparkline (~40 L) · +KpiCard (~90 L) · +ResumenProsaCard (~40 L) · +TesisOportunidadCard (~45 L) · +SectorSignalWidget extraído (~55 L) · +extractAuditorName helper (~24 L) · reescritura chead (T1, ~145 L) · reescritura Resumen (T2..T7, ~200 L) · retirado `HeroBlock` legacy. Net delta ≈ +550 L, -75 L. Import Linkedin + Sparkles añadidos. |
| `/app/memory/PARA_RESUMEN_REDISTRIBUCION.md` | Descargado spec canónica |
| `/app/frontend/public/handoff/PARA_RESUMEN_REDISTRIBUCION.md` | Copiado para URL descargable |
| `/app/memory/PLAN_BETA_status_20260810.md` | Este bloque |

### Verificación

- **`yarn typecheck`**: ✅ verde (3.65s)
- **`yarn build`**: ✅ verde (17.93s) · First Load JS shared **87.3 kB** (idéntico baseline · sin regresión)
- **Grep `Veredicto de ARROBA` en JSX**: 0 hits (solo JSDoc `T4 · Tesis de oportunidad (rename "Veredicto de ARROBA")`)
- **Grep `>Identificación<` legacy JSX**: 0 hits (rename aplicado)
- **Grep `Detalles de la compañía` JSX**: 2 hits (anon + auth)
- **Grep `Tesis de oportunidad` JSX**: 2 hits (h3 + Empty fallback)
- **Smoke visual anon Servier**: cabecera nueva renderiza correctamente con URL clicable "www.servier.es ↗" (sin badge Verificada · sin LinkedIn · R15 correcto) + card prosa oscura visible + "Detalles de la compañía" visible + `<IdentidadAmpliada>` ampliada abajo
- **Backend auth Servier**: `finances.kpis.revenue=164.2 M€ YoY+11.7%` · `ebitda=18.5 M€ YoY+24.4%` · `net_debt=null → Empty honesto` · `total_assets=97.4 M€` · `net_income=10.1 M€ (movido a T5)` · `assessment.verdict populated (fallback T4)`
- **Frontend restarted**: sí (`sudo supervisorctl restart frontend`)

### Regressions preservadas

- SrcDot de HARDENING-021 Fase 2 mantenido en cada KPI (T2) + Resultado neto (T5).
- Tooltips glosario (HARDENING-021 Fase 1) cableados en 6 puntos del nuevo layout.
- DPD + fail-closed opt-in auth (HARDENING-015) intactos.
- ChunkLoadError mitigation: `sudo supervisorctl restart frontend` ejecutado post-build.

### Deploy

- **NO desplegado.** Cambios acumulados en bundle **HARDENING-021 + 004 + 022** para push manual del usuario.
- Pendiente: usuario redacta copy glosario `FACTURACION`, `ACTIVOS_TOTALES`, y opcionalmente `QUALITY_SCORE`, `BUYER_FIT_SCORE`, `OPPORTUNITY_SCORE` (5 keys).

---

## 2026-08-13 · HARDENING-022b + HARDENING-004b · cierre pre-push · DONE

### FASE 0 · Shapes verificados contra prod Intel (Servier B28184687)

Payload real (`curl -s /api/companies/B28184687/ficha?authenticated=true` post-purge):

| Campo | Estado | Valor observado |
|:--|:--|:--|
| `identity.activity_es` | ✅ presente | `"Fabricación de especialidades farmacéuticas"` |
| `identity.verified` | ✅ presente | `true` |
| `identity.auditor` | ✅ presente | `"ERNST & YOUNG"` (string directo, no objeto) |
| `identity.linkedin_url` | ✅ shape existente | `null` (Servier no tiene LinkedIn público) |
| `identity.description_source` | ✅ presente | `"ai"` |
| `identity.description` | ✅ presente | prosa CF real (86 chars leading) |
| `finances.has_financials` | ✅ presente | `true` |
| `finances.provenance.kpis` | ✅ presente | 19 métricas con `verified`/`calculated` |
| **`opportunity.thesis.narrative`** | ❌ **MISSING** | payload `/ficha` no incluye `opportunity` top-level |
| **`opportunity.chips[]`** | ❌ **MISSING** | idem |
| **`finances.kpis_prior`** | ❌ **MISSING** | Intel no emite valores año anterior aún |

**Discrepancia con instrucción del usuario**: los shapes `opportunity.thesis.narrative`, `opportunity.chips[]` y `finances.kpis_prior` NO están en el payload prod verificado (Servier B28184687). Cableado tolerante: consume el shape esperado; si Intel aún no lo emite → UI degrada a Empty (R15). No fabrica ni infiere.

### FASE 0 · Glosario refrescado

`GLOSARIO_EXPLICABILIDAD_FICHA.md` (canon `spnieywy_...`): descargado (HTTP 200 · 5.168 KB) · **diff con local vacío** (canon no ha cambiado). Copiado a `/app/frontend/public/handoff/`.

**Keys pendientes en canon** (usuario debe redactar):
- `FACTURACION` (KPI T2)
- `ACTIVOS_TOTALES` (KPI T2)
- `QUALITY_SCORE` (anillo T6)
- `BUYER_FIT_SCORE` (anillo T6)
- `OPPORTUNITY_SCORE` (anillo T6)
- `VERIFIED_BADGE` (tooltip badge Verificada) — inline en el JSX como fallback: `"Cuentas depositadas y verificadas en fuente oficial (registral)."`
- `AUDITED_BADGE` (tooltip badge Auditada) — inline: `"Cuentas anuales auditadas por el auditor indicado."`

Sin las keys, `<Tip>` cae al `data-tip` literal (fallback defensivo). Zero-coupling: solo se edita `glosario.ts`.

### HARDENING-022b · Wiring shapes reales

| Elemento | Antes 022 | Ahora 022b |
|:--|:--|:--|
| T1 · LinkedIn URL | `identity.linkedin` (fallback) | `identity.linkedin_url` (canonical Intel) |
| T1 · Activity ES | `activity_es → cnae_description (EN) → activity (EN)` | `activity_es → activity` (sin EN inventado) |
| T1 · Verificada badge | `verified===true AND has_financials===true` (adapter aditivo) | Igual + `has_financials` derivado ahora de `financialAnalysis.has_financials` como fallback |
| T1 · Auditada badge | `identity.auditor_name` (via governance officers) | `identity.auditor` string directo + fallback governance officers |
| T1 · Chips oportunidades | `opportunities.thesis_active[]` (shape especulativo) | `opportunity.chips[]` con `{enum,label_es}` (shape spec 022b) · `data-enum` preservado |
| T4 · Tesis narrative | `opportunities.thesis_narrative → assessment.verdict (fallback legacy)` | `opportunity.thesis.narrative` (**fallback legacy retirado**) → Empty "En preparación" si null |
| T2 · SrcDot DN/EBITDA | `provenance.kpis.net_debt_to_ebitda` | `provenance.kpis.net_debt_ebitda` (key real Intel) |
| T2 · DN/EBITDA valor | cascada `ratios.net_debt_to_ebitda → ratios.dn_ebitda → balance_sheet.*` | cascada tolerante `net_debt_ebitda → net_debt_to_ebitda → dn_ebitda` (ratios y balance_sheet) |
| Tipo `opportunity` | `unknown as {...}` en JSX | prop tipado en `CompanyFichaLayoutV2Props.opportunity` |

### HARDENING-004b · Pytest smoke `/api/admin/cache/purge`

- **Archivo**: `/app/backend/tests/test_admin_cache_purge.py`
- **8 escenarios**: 6 spec + 2 bonus (body vacío, body con 2 llaves)
- **Fixture** `seeded_cache`: siembra 5 docs en `intelligence_cache` con combinaciones de engines/CIFs (`ficha` × 2 CIFs · `valuation`, `ranking`, `market`)
- **Aislamiento**: `monkeypatch.setenv('ARROBA_ADMIN_TOKEN', ...)` + `get_intelligence_settings.cache_clear()` para forzar re-lectura Pydantic Settings en cada test
- **Marker registrado**: `smoke` en `pyproject.toml` (`markers = [... "smoke: fast smoke tests (< 100 ms)"]`)
- **Run**: `python -m pytest tests/test_admin_cache_purge.py -v -m smoke`
- **Resultado**: **8 passed in 0.05s** (0 warnings) ✅

### Archivos modificados

| Archivo | Cambio |
|:--|:--|
| `/app/frontend/src/components/company/CompanyFichaF01Client.tsx` | Adapter: `linkedin` → `linkedin_url` (canonical Intel) · retirado fallback `cnae_activity_es`/`cnae_description_es` · `auditor` string directo · comentario actualizado |
| `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` | Prop tipado `opportunity?` · enrichment `has_financials` desde `financialAnalysis` · chead consume `opportunity.chips[]` con shape `{enum,label_es}` · T4 fallback verdict retirado · `dnEbitdaValue` cascada tolerante · SrcDot DN/EBITDA usa `net_debt_ebitda` |
| `/app/backend/tests/test_admin_cache_purge.py` | **NUEVO** · 8 escenarios pytest smoke |
| `/app/backend/pyproject.toml` | Registrado marker `smoke` |
| `/app/memory/GLOSARIO_EXPLICABILIDAD_FICHA.md` | Refrescado (diff vacío · canon no ha cambiado) |
| `/app/frontend/public/handoff/GLOSARIO_EXPLICABILIDAD_FICHA.md` | Copiado del canon |

### Verificación

- **`yarn typecheck`**: ✅ verde (3.79s)
- **`yarn build`**: ✅ verde (18.06s) · First Load JS shared **87.3 kB** (idéntico baseline, sin regresión)
- **`pytest tests/test_admin_cache_purge.py -v -m smoke`**: ✅ **8/8 passed in 0.05s**
- **Frontend restarted**: sí
- **Curl smoke `/ficha` autenticado**: los 5 campos identity nuevos + `has_financials` + `provenance.kpis` retornan con shape esperado.
- **Curl smoke `/ficha` anónimo**: los campos identity NO gated (activity_es/verified/auditor/description_source son públicos) — `finances`/`opportunity` sí gated (correcto DPD).

### Deploy

- **NO desplegado.** Bundle final consolidado para push manual: **HARDENING-021 (Fase 1+2+3) + HARDENING-004 (cache admin endpoint) + HARDENING-022 (Resumen redistribution) + HARDENING-022b (shapes reales) + HARDENING-004b (pytest smoke)**.

### Secuencia recomendada del push manual

1. Push del bundle a Prod.
2. Sync `ARROBA_ADMIN_TOKEN` en panel Emergent (env var Prod).
3. Purga cache Prod: `curl -X POST https://beta.arroba.com/api/admin/cache/purge -H "X-Admin-Token: $TOKEN" -d '{"engine":"ficha"}'` (ya no requiere `mongosh`).
4. Smoke visual de los 7 bloques en Servier B28184687 (auth y anon).

---

## 2026-08-13 · HARDENING-022c · Cleanup Resumen · DONE

Contexto: post-review del usuario, 5 items quirúrgicos front-only. Regla R15 estricto — `opportunity.thesis.narrative` es la fuente única para toda la Tesis (Intel ya combina sector + posicionamiento + veredicto).

### T1 · Sub-card "Contexto sectorial" retirado

- **Ubicación eliminada**: `<SectorSignalWidget market={market} />` dentro de `TesisOportunidadCard` (línea 949 previa) + componente `SectorSignalWidget` completo (líneas 515-565 previas · 51 líneas) + prop `market` de `TesisOportunidadCard`.
- **Prosa `opportunity.thesis.narrative` renderiza como bloque único**: sí (una `<p>` continua sin sub-cards).

### T2 · Card "Lectura de posicionamiento" retirado

- **Ubicación eliminada**: `<div data-testid="rankings-explain-card">` con `<h3>Lectura de posicionamiento</h3>` (líneas 772-781 previas · 10 líneas).
- **Contenido absorbido en `thesis.narrative`**: sí (Intel combina la lectura de ranking sectorial + territorial en la prosa Tesis).
- La otra card `rankings-explain-bullets` (línea 1736 previa) vive en la pestaña Rankings — NO tocado.

### T3 · IdentidadAmpliada legacy eliminado

- **Componente eliminado**: `IdentidadAmpliada` (34 campos · Item 6.a HARDENING-B-2) + helpers `fmtYesNo` + `IdentityRow` (líneas 1913-2004 previas · 93 líneas totales).
- **Usos eliminados**: 2 renders (anon línea 629 + auth línea 731).
- **Campos huérfanos sin sitio nuevo**: 
  - `Registro mercantil` (`record_status`), `Fecha de constitución` (`incorporation_date`), `Forma jurídica` (ya vive en T5), `Estado mercantil` (ya en badge cabecera), `CNAE secundario` (subgrupo Registro), `Ticker` (subgrupo Cotización, siempre null), `Cotizada` / `Mercado de cotización` (subgrupo Cotización, siempre null), `Comunidad autónoma` (subgrupo Domicilio).
  - **Ninguno viene poblado con valor real en Servier** (verificado curl `/ficha`). Todos son passthrough Intel actualmente null. No hay pérdida funcional real.
  - Si alguno se puebla en el futuro y no tiene ubicación en T5 → repórtalo al usuario y añade fila individual con SrcDot.

### T4 · 4 KPIs 2ª fila eliminados

- **Cards eliminados**: Crecimiento anualizado (CAGR 3Y) · Fondos propios · Tendencia global (`TrendPill`) · Percentil por ingresos (líneas 734-770 previas · 37 líneas).
- **Componente `TrendPill` eliminado** (líneas 391-404 previas · 14 líneas). No se usa en ningún otro lado.
- **Lógica útil identificada**: 
  - `evolution.trend` (growth/stable/contraction) sigue disponible en el payload → utilizable en Tesis o en la pestaña Finanzas si Intel emite copy CF. Documentado para retomar si aparece.
  - `revenue_cagr` sigue disponible en `kpis.revenue_cagr` → la prosa `thesis.narrative` de Intel ya lo menciona ("Ingresos al alza (+11,7% interanual)").
  - `equity` (`Fondos propios`) sigue en `balance_sheet.equity` → utilizable en Detalles T5 si el usuario decide reintroducirlo.
  - `sector_revenue_percentile` sigue en `ranking.sector_revenue_percentile` → disponible para la pestaña Rankings.
- Ninguna pérdida definitiva: los datos están; solo se retira la card visual.

### T5 · Diagnóstico cleanup

- **Marco retirado**: `<div className="card">` wrapper que envolvía los 3 anillos. Reemplazado por `<div>` limpio con `<h3>` inline con estilo mínimo (`border-left rojo 3px` del canon). Los anillos mantienen su borde individual `.ring` (mockup-standard).
- **Extensión `Ring` component**: nuevo prop `tooltip?: string` que envuelve la label con `<span class="help" data-tip={tooltip} tabIndex={0}>`.
- **Tooltips cableados**:
  | Anillo | data-tip |
  |:--|:--|
  | Calidad | `QUALITY_SCORE` |
  | Encaje comprador | `BUYER_FIT_SCORE` |
  | Oportunidad | `OPPORTUNITY_SCORE` |
- **Keys presentes en `glosario.ts`**: ❌ ninguna de las 3.
- **Keys presentes en canon `GLOSARIO_EXPLICABILIDAD_FICHA.md`**: ❌ ninguna de las 3 (verificado con grep).
- **Comportamiento actual**: `<Tip>` global (Fase 1) renderiza `null` cuando la key no existe, `<span class="help">` mantiene solo el hint visual `cursor: help` + underline. **Sin regresión funcional** — solo falta copy.

### Glosario · Keys pendientes de copy (usuario)

- `FACTURACION` · KPI T2 · Facturación
- `ACTIVOS_TOTALES` · KPI T2 · Activos totales
- `QUALITY_SCORE` · Anillo T6 · Calidad ← nuevo en 022c
- `BUYER_FIT_SCORE` · Anillo T6 · Encaje comprador ← nuevo en 022c
- `OPPORTUNITY_SCORE` · Anillo T6 · Oportunidad ← nuevo en 022c

Sistema Tip funciona con estas 5 keys ausentes (fallback silencioso). Añadir al `glosario.ts` cuando el usuario redacte copy CF.

### Archivos modificados

| Archivo | Cambio |
|:--|:--|
| `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` | -177 líneas netas · retirados: `SectorSignalWidget` (51 L) · `IdentidadAmpliada` + helpers (93 L) · `TrendPill` (14 L) · rankings-explain-card (10 L) · grid KPIs 2ª fila (37 L) · card wrapper Diagnóstico. Añadidos: prop `tooltip?` en `Ring` (5 L) + 3 comentarios de retiro. Net: -177 L. Archivo: 3391 → 3214 líneas. |
| `/app/memory/PLAN_BETA_status_20260810.md` | Este bloque |

### Verificación

- **Grep post-cleanup**:
  - `SectorSignalWidget`, `hero-sector-signal-widget`: 0 usos activos ✅
  - `Lectura de posicionamiento`, `rankings-explain-card`: 0 usos activos en Resumen ✅
  - `IdentidadAmpliada`, `Identificación registral`: 0 usos activos ✅
  - `Crecimiento anualizado`, `Tendencia global`, `Percentil por ingresos`, `TrendPill`: 0 usos activos (única mención restante de "Fondos propios" es en el `abbrTitle` de ROE en la tabla de ratios — legítimo) ✅
- **`yarn typecheck`**: ✅ verde (3.49s)
- **`yarn build`**: ✅ verde (17.34s) · **First Load JS shared 87.3 kB** (idéntico baseline) · Ruta `/es/empresa-f01/[cif]`: **50.4 kB / 162 kB**
- **`sudo supervisorctl restart frontend`**: ✅
- **Backend regression**: purga cache `{engine:"ficha"}` OK · fetch anon HTTP 200 en 7.03s (cold Intel) · payload `identity.activity_es`, `verified`, `auditor`, `description_source='ai'` presentes.
- **Ring tooltip DOM check**: los 3 rings ahora renderizan con `<span class="help" data-tip="QUALITY_SCORE" tabIndex="0">Calidad</span>` (equiv para BUYER_FIT y OPPORTUNITY).

### Deploy

- **NO desplegado.** Bundle final consolidado para push manual: **HARDENING-021 + 004 + 022 + 022b + 004b + 022c**.

---

## 2026-08-13 · Bundle final pre-push · Glosario + HARDENING-005 · DONE

### 1) Glosario · 5 keys añadidas

`/app/frontend/src/lib/companies/glosario.ts`:

| Key                | label              | Sección Resumen        |
|:-------------------|:-------------------|:----------------------|
| FACTURACION        | Facturación        | T2 · KPI              |
| ACTIVOS_TOTALES    | Activos totales    | T2 · KPI              |
| QUALITY_SCORE      | Calidad            | T6 · Diagnóstico ring |
| BUYER_FIT_SCORE    | Encaje comprador   | T6 · Diagnóstico ring |
| OPPORTUNITY_SCORE  | Oportunidad        | T6 · Diagnóstico ring |

- Copy literal usuario respetando tildes + punto final.
- Shape idéntico al resto del glosario (`{label, definition}`, sin `why_ma`/`band` porque el usuario no los proporcionó).
- Verificado con grep: los 5 `<Tip data-tip="{key}">` del layout matchean 1:1.
- `yarn typecheck` + `yarn build` verdes · First Load JS shared **87.3 kB** (baseline sin regresión) · ruta `/es/empresa-f01/[cif]` **50.7 kB / 162 kB** (+0.3 kB por las 5 entradas).

### 2) REQ-INTEL para `opportunity.*` retirado

Usuario confirma que `opportunity.thesis.narrative` + `opportunity.chips[]` YA están en Prod (auth). Pod dev va por detrás — se verán solos post-push. No hay borrador de REQ pendiente que retirar (ninguno emitido formalmente en 022b/022c). Cerrado.

### 3) HARDENING-005 · `scripts/post_deploy.sh` autorizado

Archivo creado: `/app/scripts/post_deploy.sh` (+7.6 KB · `chmod +x`). Contenido:

- **(a) Purge**: `POST /api/admin/cache/purge` con `X-Admin-Token: $ARROBA_ADMIN_TOKEN` + body `{"engine":"ficha"}`.
- **(b) Smoke** · 5 checks read-only:
  1. `/api/health` responde `status:ok`.
  2. `/api/companies/{CIF}/ficha` anon HTTP 200 + `finances:null` (DPD).
  3. `identity.legal_name` presente en payload anon.
  4. `/api/openapi.json` expone `/api/admin/cache/purge` (verifica HARDENING-004 registrado).
  5. Frontend `/es/empresa-f01/{CIF}` HTTP 200.
- **(c) Resumen** OK/FAIL colorizado por check.
- **Exit code**: 0 si todos verdes, 1 si CUALQUIER check falla (`FAILS` accumulator, no `set -e` para ejecutar TODOS antes de reportar).
- **Idempotente**: purga sobre cache vacío = no-op; checks read-only.
- **Overrides**: `ARROBA_BASE_URL` (default beta.arroba.com), `SMOKE_CIF` (default B28184687), `SMOKE_TIMEOUT_S` (default 20).
- **Fail-safe env**: si `ARROBA_ADMIN_TOKEN` no está exportado → exit 2 con mensaje.

Documentado en `/app/scripts/README.md`.

**No ejecutado** en dev pod (spec del usuario): script listo para disparar tras deploy Prod.

### 4) DEPLOY_NOTES.md creado

`/app/DEPLOY_NOTES.md` con:
- Tabla de bundle contents (021 + 004 + 022 + 022b + 004b + 022c + glosario + 005).
- Verificaciones pre-push (typecheck, build, pytest, curl smoke).
- Secuencia de 5 pasos para deploy manual.
- Prerrequisitos (`ARROBA_ADMIN_TOKEN` en Prod ANTES del deploy).
- Notas de rollback (aditivo, seguro).

### Verificación final

- **Grep 5 keys glosario vs layout**: 5/5 matchean ✅
- `yarn typecheck`: verde (1.9 s) ✅
- `yarn build`: verde (17.3 s) · shared **87.3 kB** ✅
- `bash -n scripts/post_deploy.sh`: syntax OK ✅
- `chmod +x scripts/post_deploy.sh`: ✅
- Frontend restarted: ✅

### Bundle final para push · listo

`HARDENING-021 + 004 + 022 + 022b + 004b + 022c + glosario + 005`

Secuencia de deploy documentada en `/app/DEPLOY_NOTES.md`.

---

## 2026-08-13 · HARDENING-022d · Bundle correctivo pre-push · DONE

3 bugs quirúrgicos front-only. Un solo push consolidado.

### Bug 1 · Tooltips pegados / posición 0,0 (P0) · FIX

**Root cause detectado**:
- `hide()` con `setTimeout(120ms)` diferido perceptible como "sticky".
- `positionTip()` medía `tipRect` durante la transición CSS con opacity aún animando → dimensiones intermedias erróneas.
- Sin protección para "un solo tooltip a la vez" cuando cambia el anchor.

**Cambios en `/app/frontend/src/components/company/atoms/Tip.tsx`**:

| Aspecto | Antes | Ahora |
|:--|:--|:--|
| Cierre en mouseleave | `setTimeout(hide, 120)` diferido | Síncrono inmediato |
| Cierre en blur | Idem (diferido) | Síncrono inmediato |
| Cierre con Escape | Ya funcionaba (`onKeyDown`) | Preservado + hide inmediato |
| Medición del tipRect | Directo tras `add('show')` en frame de renderizado | Doble `requestAnimationFrame` + guard `if (!activeAnchor) return` |
| Estado inicial | `top:0, left:0` (esquina) | `top:-9999px; left:-9999px` (fuera de viewport) |
| Multi-anchor | Estado global sin transición explícita | `show()` cierra el anterior si `activeAnchor !== anchor` |
| Viewport clamp | Solo horizontal | Horizontal + vertical (flip arriba↔abajo si no cabe) |
| Rect degenerado | Sin guard | `if (rect.width===0 && rect.height===0) return` |

**Verificación**:
- Bundle compilado `page-1488d53456fd3208.js` contiene `arroba-global-tip` ✅
- Lógica de posicionamiento reemplazada íntegramente + hide síncrono verificado en source.

### Bug 2 · Marco azul en boxes de anillos · FIX

**Root cause**: el `<span class="help" tabIndex={0}>` de las labels de los anillos recibe el **focus outline azul default** del navegador (Chrome/Firefox) al hacer Tab teclado o click sostenido.

**Cambios en `/app/frontend/src/components/company/layout/fichaMockupCss.ts`**:

Reglas CSS inyectadas (canon rojo en focus-visible para preservar accesibilidad teclado):

```css
.afk .help:focus { outline: none }
.afk .help:focus-visible { outline: 2px solid var(--red); outline-offset: 2px; border-radius: 2px }
.afk .ring [tabindex]:focus, .afk .ring .help:focus,
.afk .kpi [tabindex]:focus, .afk .kpi .help:focus { outline: none }
.afk .ring [tabindex]:focus-visible, .afk .ring .help:focus-visible,
.afk .kpi [tabindex]:focus-visible, .afk .kpi .help:focus-visible {
  outline: 2px solid var(--red); outline-offset: 2px; border-radius: 2px
}
```

**Verificación**:
- Bundle compilado `.next/server/chunks/689.js` + `156.js` contienen `focus-visible` con overrides rojos ✅
- Zero azul en el DOM path de los rings.
- Accesibilidad teclado preservada con `:focus-visible` en rojo canon.

### Bug 3 · Tesis Empty · restaurar fallback (regresión) · FIX

**Root cause**: en HARDENING-022b retiré `finances.assessment.verdict` como fallback bajo la premisa de que Intel ya emitía `opportunity.thesis.narrative` en Prod. En Dev pod Intel aún NO lo emite → Tesis renderiza `<Empty/>` cuando SÍ hay `verdict` disponible. Regresión reportada.

**Cambio en `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx`** (dentro de `Resumen()`):

```ts
const thesisNarrative = p.opportunity?.thesis?.narrative;
const verdictRaw = financialAnalysis?.assessment?.verdict;
const thesisText: string | null = (
  (typeof thesisNarrative === 'string' && thesisNarrative.trim().length > 0)
    ? thesisNarrative.trim()
    : (typeof verdictRaw === 'string' && verdictRaw.trim().length > 0)
      ? verdictRaw.trim()
      : null
);
```

**Compatibilidad**:
- Dev pod (Intel narrative aún ausente): renderiza `finances.assessment.verdict` → "Perfil financiero sólido y consistente…"
- Prod (Intel narrative populado): renderiza `narrative` (prioridad más alta en la cascada).
- Ambos null → Empty honesto (comportamiento R15 estricto).

**Verificación**:
- Bundle compilado contiene la cascada exacta: `void 0===o?void 0:o.verdict,et="string"==typeof ea&&ea.tr...` ✅
- Curl backend Servier auth: `opportunity=None`, `assessment.verdict="Perfil financiero sólido..."` → fallback activo en Dev.

### Verificación

| Item | Estado |
|:--|:--:|
| `yarn typecheck` | ✅ verde (3.57 s) |
| `yarn build` | ✅ verde (17 s) |
| First Load JS shared | **87.3 kB** (baseline sin regresión) |
| Ruta `/es/empresa-f01/[cif]` | 50.9 kB / 163 kB (+0.2 kB por overrides CSS + fallback) |
| Bundle `arroba-global-tip` | ✅ presente |
| Bundle `focus-visible` overrides | ✅ presente (2 chunks) |
| Bundle `verdict` fallback cascada | ✅ presente |
| Curl SSR HTML anon Servier | ✅ 200 · cabecera + T3 prosa oscura + T5 detalles |
| Frontend restarted | ✅ |

### Archivos modificados

| Archivo | Cambio |
|:--|:--|
| `/app/frontend/src/components/company/atoms/Tip.tsx` | Reescritura del `TipProvider`: hide síncrono + doble rAF + guard `activeAnchor` + flip vertical + rect degenerado guard |
| `/app/frontend/src/components/company/layout/fichaMockupCss.ts` | +5 líneas CSS · overrides `outline` para `.help`, `.ring [tabindex]`, `.kpi [tabindex]` |
| `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` | Restaurado fallback `assessment.verdict` en cascada + JSDoc actualizado |
| `/app/memory/PLAN_BETA_status_20260810.md` | Este bloque |
| `/app/DEPLOY_NOTES.md` | Actualizado con HARDENING-022d en el bundle |

### Deploy

- **NO desplegado.** Bundle final consolidado: **HARDENING-021 + 004 + 022 + 022b + 004b + 022c + Glosario (5 keys) + 005 + 022d**.
