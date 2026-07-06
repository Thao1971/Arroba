# ARROBA · B.6.f Design Proposal · v1
**Diseño canónico para migración de `/empresa/{cif}` al pipeline `intelligence_layer` (B.6.a + B.6.b + B.6.c).**

_Versión: `b6f-design-proposal-v1` · 2026-07-07 · Estado: **PROPUESTA VISUAL · PENDIENTE APROBACIÓN EXPRESA DEL USUARIO (R11)**_
_Freeze `/app/frontend/**` activo. Este documento NO produce cambios de código._

---

## §0 · Resumen ejecutivo (TL;DR)

1. Base visual = mockup existente `/mockups/entity-canonical/{CIF}` (aprobado en Fase B). Layout 3-columnas 210 / 1fr / 360 con nav lateral izq, contenido central y Deal Panel derecha + Composer FAB.
2. La migración a `/empresa/{cif}` **reproduce ese layout sin cambios estructurales** — solo se sustituyen fuentes de datos (mocks locales → proxies `intelligence_layer`).
3. **Sección `resumen`** — sin nuevos bloques; consume `/identity` (§6.1) + `/financial-analysis` (§6.2) + `/profile` (§6.5) para los KPIs y la narrativa semántica.
4. **Sección `finanzas`** — introduce **4 renderers NUEVOS**: `PLBlock`, `BalanceBlock`, `RatiosGridBlock`, `RevenueEvolutionBlock`. Basados en `income_statement[]`, `balance_sheet[]`, `ratios{}`, `kpis.evolution` (§6.2).
5. **Sección `valoracion`** — `ValuationBlock` se **modifica** (no reescribe) para consumir `/valuation` (§6.3): EV + rango + peers reales.
6. **Sección `mercado`** — reusa `CompanyCardsGridBlock` existente; consume `/similar` (§6.5) en lugar del mock de comparables.
7. **Secciones `propiedad`, `gobierno`, `registros`, `documentos`** — se mantienen como `UnavailableBlock` con REQ-009/010/008/007 (Master Layer vacío + campos huérfanos del §6.1). Sin cambios visuales respecto al mockup actual.
8. **Sección `senales`, `oportunidades`** — permanecen como `UnavailableBlock` hasta B.6.e/B.6.g. Sin cambios en B.6.f.
9. **Deal Panel derecha** — sin cambios estructurales; el switcher `venta|compra|financiación|fusión|none` sigue local (backend de transacciones llega en B.6.h).
10. **11 componentes tocados** en total: 3 modificar + 5 crear + 3 sin cambios. Estimación total ~13 días efectivos + 1 día buffer R11.

---

## §1 · Base visual

### 1.1 Rutas del mockup existente (frontend en curso · sin modificar)
| CIF | URL preview | Estado datos backend |
|---|---|---|
| `B47820150` — Grupo Olmedo Hoteles | `/es/mockups/entity-canonical/B47820150` | mock local vía `master_companies_mock` |
| `B08540200` — Castilla Termal | `/es/mockups/entity-canonical/B08540200` | mock local |
| `A26320888` — Bodegas Riojana Norte | `/es/mockups/entity-canonical/A26320888` | mock local |

### 1.2 Screenshots Playwright (6 archivos)
Viewport `1440×900`, full-page, autenticado con `buyer@arroba.com`.

Ubicación (fuera de `/app/memory/`):
```
/tmp/b6f_screenshots/B47820150_light.png    117 255 bytes
/tmp/b6f_screenshots/B47820150_dark.png     117 319 bytes
/tmp/b6f_screenshots/B08540200_light.png    114 952 bytes
/tmp/b6f_screenshots/B08540200_dark.png     115 030 bytes
/tmp/b6f_screenshots/A26320888_light.png    118 200 bytes
/tmp/b6f_screenshots/A26320888_dark.png     118 289 bytes
```

### 1.3 Layout confirmado (via inspección del mockup)
```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ TopBar (arroba.com · Historial · Org · Theme · Avatar)                              │  56px
├─────────────┬────────────────────────────────────────────┬──────────────────────────┤
│ Nav Lateral │ Contenido central                          │ Deal Panel (sticky)      │
│   210px     │ 1fr (max ~750px)                           │   360px                  │
│             │                                            │                          │
│  Perfil     │  · Breadcrumb (Analizar / Empresas / …)    │ Escenario · demo         │
│   Resumen●  │  · CompanyHeader (BR · nombre · badges …)  │ [selector: En venta ▼]   │
│   Finanzas  │  · OportunidadesRail (Buy&Build/Cap/…)     │                          │
│   Valoración│  · Banner "En venta" (sticky si aplica)    │ OPERACIÓN ACTIVA         │
│   Propiedad │                                            │  → En venta              │
│   Gobierno  │  ┌──────────────────────────────────────┐  │                          │
│   Mercado   │  │ Sección activa · anchor scroll       │  │ Descripción proceso …    │
│             │  │  (Resumen / Finanzas / Valoración…)  │  │ Tipo · Participación     │
│  Inteligenc.│  └──────────────────────────────────────┘  │ Asesor · Rango           │
│   Señales   │                                            │                          │
│   Oportunid.│                                            │ [Descargar NDA]          │
│             │                                            │ [Solicitar cuaderno …]   │
│  Fuentes    │                                            │ [Hacer match …]          │
│   Registros │                                            │ [Indicar interés]        │
│   Documentos│                                            │                          │
└─────────────┴────────────────────────────────────────────┴──────────────────────────┘
                                                                         ┌─────────┐
                                                                         │Composer │  FAB
                                                                         │  (✨)   │
                                                                         └─────────┘
```

### 1.4 Confirmación arquitectónica del layout
Reproduce el layout 3-columnas canónico (nav lateral izq + content center + Deal Panel dcha + Composer FAB). Sin cambios estructurales en B.6.f. Fuente: comentarios internos del `CanonicalEntityMockupClient.tsx` L14-L18.

---

## §2 · Mapping exhaustivo Contrato → Componente visual

Convenciones:
- **NUEVO** = componente a crear en B.6.f.
- **MOD** = componente existente a modificar (nueva fuente de datos, sin rediseño).
- **REUSAR** = componente existente sin cambios.
- Fallback `UnavailableBlock` respeta REQ codes canónicos.

### 2.1 · Header (top del contenido central)

| Campo del contrato interno arroba | Proxy | Componente | Ubicación | Formato | Fallback si null |
|---|---|---|---|---|---|
| `identity.legal_name` | `/identity` | `<CompanyHeader.legalName>` MOD | H1 hero | text-3xl bold serif | `cif_normalized` como texto plano |
| `identity.cif` / `cif_normalized` | `/identity` | `<CompanyHeader.cifBadge>` MOD | subtítulo · pill | mono uppercase | `—` |
| `classification.cnae_description` | `/identity` | `<CompanyHeader.sectorPill>` MOD | subtítulo · pill | text-sm | `—` |
| `classification.cnae_section` | `/identity` | `<CompanyHeader.sectionBadge>` MOD | tooltip on hover | letra | ocultar badge |
| `location.provincia` · `location.pais` | `/identity` | `<CompanyHeader.locationPill>` MOD | subtítulo · pill | `Provincia · ES` | `—` |
| `contact.web` | `/identity` | `<CompanyHeader.websiteLink>` MOD | subtítulo · icon-link | anchor `target=_blank` con icono | ocultar link |
| `status`  ∈ `{active, merged, deprecated}` | `/identity` | `<CompanyHeader.statusBadge>` MOD | pill top-right hero | badge (`Verificada`/`Fusionada`/`Deprecada`) | `Sin verificar` |
| `size.employees_total` | `/identity` (o `/financial-analysis`) | `<CompanyHeader.employeesPill>` MOD | pill secundaria | número + icono User | ocultar |
| `size.capital_social` | `/identity` | (**diferido a B.6.g** REQ-011) | — | — | — |
| `provenance.sources[]` | `/identity` | `<CompanyHeader.sourcesTooltip>` MOD | icono `i` con tooltip | lista de fuentes | ocultar icono |

Botones existentes: `Guardar`, `Seguir`, `Compartir` — sin cambios (features arroba locales, no dependen del contrato).

### 2.2 · Banner "En venta / En compra / …" (sticky si aplica)

| Campo | Proxy | Componente | Ubicación | Formato | Fallback |
|---|---|---|---|---|---|
| — | (deriva del Deal Panel local en B.6.f) | `<DealBanner>` REUSAR | debajo del OportunidadesRail | banner rojo full-width con label del escenario | ocultar si `scenario == 'none'` |

**Nota**: Banner sigue **local** en B.6.f. Se cablea a datos reales en B.6.h.

### 2.3 · OportunidadesRail (hero row justo debajo del header)

| Campo | Proxy | Componente | Formato | Fallback |
|---|---|---|---|---|
| Pills `Buy & Build`, `Captación de capital`, `Entrada de socio` | (**diferido a B.6.g** REQ-011) | `<OportunidadesRail>` MOD | 3 chips + botones `Activar oportunidad` + `Reclamar mi empresa` | mostrar chips hardcoded en B.6.f con nota "próximamente" |

### 2.4 · Sección `resumen`

| Campo | Proxy | Componente | Ubicación | Formato | Fallback |
|---|---|---|---|---|---|
| Título "Análisis de empresa" · `identity.legal_name` | `/identity` | `<AnalisisHero>` REUSAR | card grande arriba | H2 + subtítulo con `sector · provincia · CIF` | skeleton |
| `financials.latest.revenue` | `/financial-analysis` | `<MetricsBlock.revenueKpi>` MOD | KPI row 2 · card 1 | EUR abreviado (`6.4M€`) + label "Ingresos" | `UnavailableBlock` REQ-012 |
| `financials.latest.ebitda` | `/financial-analysis` | `<MetricsBlock.ebitdaKpi>` MOD | KPI row 2 · card 2 | EUR abreviado + label "EBITDA" | idem |
| `financials.latest.ebitda_margin` (kpis.ebitda_margin) | `/financial-analysis` | `<MetricsBlock.marginKpi>` MOD | KPI row 2 · card 3 | `%` con 1 decimal | idem |
| `size.employees_total` / `kpis.employees_total` | `/identity` o `/financial-analysis` | `<MetricsBlock.employeesKpi>` MOD | KPI row 2 · card 4 | número entero + label "Empleados" | idem |
| `identity.aliases[]`, `identity.commercial_name` | `/identity` | `<IdentityGrid>` MOD | grid 2×N | key-value pairs | ocultar entrada si null |
| **`activities[]`**, **`products_services[]`**, **`markets[]`**, **`keywords[]`** | **`/profile`** | **`<SemanticProfileBlock>`** **NUEVO** | card debajo del hero, agrupada por dimensión | chips agrupados con label por dimensión (`Actividades`, `Productos y servicios`, `Mercados`, `Palabras clave`) | `UnavailableBlock` REQ-015 |
| `value_proposition`, `business_model` | `/profile` | `<SemanticNarrativeBlock>` NUEVO (parte del `SemanticProfileBlock`) | pie del card | texto narrativo 2 párrafos | ocultar párrafo |
| `objeto_social` | `/identity` | `<IdentityGrid.socialObject>` MOD | filas del grid identity | texto largo · line-clamp-3 · "ver más" | ocultar fila |

### 2.5 · Sección `finanzas` (donde vive la mayor parte del trabajo B.6.f)

| Campo | Proxy | Componente | Ubicación | Formato | Fallback |
|---|---|---|---|---|---|
| `kpis.evolution.{revenue[], ebitda[], net_income[]}` | `/financial-analysis` | **`<RevenueEvolutionBlock>`** **NUEVO** | primer card | sparkline multi-serie 5 años (área stack) · leyenda debajo | `UnavailableBlock` REQ-012 |
| `kpis.revenue_growth_yoy` · `kpis.revenue_cagr` | `/financial-analysis` | `<RevenueEvolutionBlock.footer>` NUEVO | pie del bloque anterior | badges `Δ YoY · +12%`, `CAGR 3y · +9%` | ocultar footer |
| `income_statement.{revenue, supplies, personnel_costs, depreciation, operating_income, financial_expenses, ebit, ebitda, net_income}` | `/financial-analysis` | **`<PLBlock>`** **NUEVO** | segundo card · sección Finanzas | tabla multi-año (`year` como columna, líneas P&L como filas) + toggle "años {2020..2024}" | `UnavailableBlock` REQ-012 |
| `balance_sheet.{current_assets, non_current_assets, total_assets, cash, current_liabilities, non_current_liabilities, total_liabilities, st_debt, lt_debt, financial_debt, equity}` | `/financial-analysis` | **`<BalanceBlock>`** **NUEVO** | tercer card debajo del PL | tabla multi-año agrupada por activo/pasivo/patrimonio | `UnavailableBlock` REQ-013 |
| `ratios{ebitda_margin, ebit_margin, net_margin, roe, roa, current_ratio, debt_ratio, debt_to_equity, interest_coverage, ...}` | `/financial-analysis` + `/intelligence/ratios/catalog` | **`<RatiosGridBlock>`** **NUEVO** | cuarto card | grid 3-4 columnas · cada celda `{name, valor, δ vs sector, tooltip con fórmula}` | `UnavailableBlock` REQ-014 |
| `financial_quality.{score, assessment, strengths[], weaknesses[], risks[]}` | `/financial-analysis` | `<FinancialQualityCard>` REUSAR (existente en mockup) | quinto card | score circular + listas | idem |
| `solvency.*` | `/financial-analysis` | `<SolvencyCard>` REUSAR | sexto card | pill nivel + score | idem |
| `trend.*` | `/financial-analysis` | (fusionado en `<RevenueEvolutionBlock.trendBadge>`) NUEVO | badge lateral sparkline | pill (`Creciente`/`Estable`/`Deteriorado`) | ocultar badge |
| `anomaly.*` | `/financial-analysis` | `<AnomalyBanner>` NUEVO minor | banner arriba de la sección si `anomaly.detected==true` | pill amarillo + texto corto | ocultar banner |
| `deterioration.*`, `size_band` | `/financial-analysis` | (parte de `<SolvencyCard>` o `<CompanyHeader.sizeBand>`) MOD | badge en header | pill | ocultar |
| `explainability.*` | `/financial-analysis` | Icono `i` en cada card con panel drawer | on-click | drawer lateral | ocultar icono |
| `years[]`, `year`, `basis`, `audited`, `data_source` | `/financial-analysis` | `<FinanzasHeader>` NUEVO minor | header de la sección | badges `Datos 2020-2024`, `Individual`, `Auditada por …`, `Fuente: Iberinform` | ocultar badges vacíos |

### 2.6 · Sección `valoracion`

| Campo | Proxy | Componente | Ubicación | Formato | Fallback |
|---|---|---|---|---|---|
| `valuation.enterprise_value` | `/valuation` | `<ValuationBlock.enterprise>` MOD | central hero | EUR abreviado grande | `UnavailableBlock` REQ-016 |
| `valuation.equity_value` | `/valuation` | `<ValuationBlock.equity>` MOD | debajo del EV | EUR abreviado secundario | ocultar |
| `valuation.method`, `valuation.multiple`, `valuation.multiple_basis` | `/valuation` | `<ValuationBlock.methodBadge>` MOD | pill top-right | `Multiplicador EBITDA · 6.5x` | ocultar |
| `valuation.range.{low, high}` | `/valuation` | `<ValuationBlock.rangeBar>` MOD | barra horizontal debajo del EV | rango con marcador central | ocultar barra |
| `valuation.subject_ebitda_margin_percentile` | `/valuation` | `<ValuationBlock.percentileBadge>` MOD | pill secundaria | `Percentil 72 EBITDA` | ocultar |
| `comparables.peers[]` | `/valuation` | `<ValuationBlock.peersGrid>` MOD | grid debajo de la barra | mini-cards de peers (`name`, `ebitda_margin`, `multiple`, `same_province`) | ocultar grid |
| `comparables.count`, `comparables.criteria` | `/valuation` | `<ValuationBlock.peersFooter>` MOD | footer del bloque | `10 comparables · misma sección CNAE · mismo tramo tamaño` | ocultar |
| `assumptions`, `criteria` | `/valuation` | drawer "Ver metodología" | on-click | drawer lateral | ocultar |
| `confidence`, `explanation` | `/valuation` | `<ValuationBlock.confidenceBadge>` MOD | badge secundario | `Confianza 0.78 · ver más` | ocultar |
| `engine_version="arroba-financial-v1"` | `/valuation` | (metadata footer del bloque, no visible) | — | — | — |

### 2.7 · Sección `propiedad`

| Campo | Proxy | Componente | Fallback |
|---|---|---|---|
| `ownership.shareholders[]`, `ownership.parents[]`, `ownership.ultimate_parent`, `ownership.investees[]`, `ownership.group_id` | `/identity` (todos vienen huérfanos hoy) | **Diferido a B.6.g/B.6.d**. Se mantiene `<UnavailableBlock req="REQ-009" eta="Sprint 2">`. Sin cambios visuales respecto al mockup actual. | `UnavailableBlock` REQ-009 |
| `officers_count` | `/identity` (huérfano) | idem | idem |

### 2.8 · Sección `gobierno`

| Campo | Proxy | Componente | Fallback |
|---|---|---|---|
| Órganos de gobierno, apoderamientos, auditor | (huérfano en `/identity` §6.1) | **Diferido a B.6.g**. `<UnavailableBlock req="REQ-010">`. | `UnavailableBlock` REQ-010 |

### 2.9 · Sección `mercado`

| Campo | Proxy | Componente | Ubicación | Formato | Fallback |
|---|---|---|---|---|---|
| Array de `{master_id, cif_normalized, name, similarity_score, matched_dimensions[], cnae_section, provincia}` | **`/similar?limit=10`** | `<CompanyCardsGridBlock>` REUSAR (existente) | grid 2×5 o 3×N | cards con nombre + `Similitud 92%` + chips de dimensiones matched | `UnavailableBlock` REQ-017 |
| `matched_dimensions[]` | `/similar` | `<CompanyCardsGridBlock.dimensionChips>` (extensión menor) | pill dentro de cada card | chips small `activities · markets · products` | ocultar chips |
| Botón "Ver más comparables" | (state local) | REUSAR | footer del grid | anchor a modal con peers extendidos | ocultar botón si `count < limit` |

### 2.10 · Sección `senales`

| Campo | Proxy | Componente | Fallback |
|---|---|---|---|
| Señales, opportunities-signals, sector/territory | **Diferido a B.6.e** | `<UnavailableBlock req="REQ-006">` | REQ-006 |

### 2.11 · Sección `oportunidades`

| Campo | Proxy | Componente | Fallback |
|---|---|---|---|
| Comparables, buyers, sellers, opportunities | **Diferido a B.6.f (siguiente sub-fase de Recommendation)** | `<UnavailableBlock req="REQ-018">` | REQ-018 |

**Nota**: aunque el nombre coincide, este bloque `oportunidades` es distinto del Recommendation Engine completo, que se aborda en la sub-fase B.6.f-recommendation (posterior). En este documento B.6.f cubre **exclusivamente** la migración de identity/financial/valuation/semantic al mockup canónico.

### 2.12 · Sección `registros`

| Campo | Proxy | Componente | Fallback |
|---|---|---|---|
| BORME, contratación pública, cuentas depositadas | Huérfano (fuentes provenance/sources del §6.1) | **Diferido a B.6.g** | `UnavailableBlock` REQ-008 |

### 2.13 · Sección `documentos`

| Campo | Proxy | Componente | Fallback |
|---|---|---|---|
| Informe ejecutivo, memoria mercantil, teasers, IMs | (huérfano) | **Diferido a B.6.g** | `UnavailableBlock` REQ-007 |

### 2.14 · Deal Panel (derecha)

| Campo | Proxy | Componente | Fallback |
|---|---|---|---|
| Escenario · demo `venta|compra|financiacion|fusion|none` | (state local en B.6.f) | `<CanonicalDealPanel>` REUSAR | — |
| `current_stage`, `state`, `next_action`, `timeline.events[]`, `risk` | (**diferido a B.6.h** Transaction OS) | `<CanonicalDealPanel>` seguirá mostrando escenario mock hasta B.6.h | — |

### 2.15 · Composer FAB (bottom-right)

| Campo | Proxy | Componente | Fallback |
|---|---|---|---|
| Búsqueda universal, prompts al Copilot | (parcial: usa `/api/entities/semantic-search` a partir de B.6.f) | `<Composer>` MOD (sin rediseño) | — |

**Cambio funcional en B.6.f**: el Composer al hacer "Buscar empresa" invoca `/api/entities/semantic-search` en lugar del legacy `/api/entities/lookup`. Sin cambio visual.

### 2.16 · Metadatos internos (no visibles)

| Campo | Proxy | Uso |
|---|---|---|
| `engine_version="arroba-identity-resolver-v1"` / `"arroba-financial-v1"` / `"arroba-semantic-v1"` | (todos los proxies) | Se registra en `data-engine-version` de cada bloque para debugging (visible en DevTools · nunca al usuario final) |
| `generated_at` | (todos los proxies) | Se muestra opcionalmente en footer del bloque como "Datos actualizados hace X min" — feature secundaria |
| `master_id`, `cif_normalized` | todos | Trazabilidad interna · nunca UI |
| `pipeline_version`, `source_hash`, `dirty` | `/identity` | Ignorados en B.6.f · reservados para B.6.g (badges de calidad de datos) |

---

## §3 · Comportamiento de estados por sección

Los 5 estados (Loading / Datos / Unavailable / Error / Permisos) se resuelven en 3 componentes atómicos que ya existen o se estandarizan en B.6.f:
- `<SectionSkeleton>` (existente en mockup) — para Loading.
- `<UnavailableBlock req eta>` (existente) — para Unavailable / Diferido.
- `<SectionErrorBoundary onRetry>` NUEVO — para Error 5xx con botón `Reintentar`.
- `<PermissionDenied>` NUEVO menor — para Permisos 403.

### 3.1 · Cuándo se dispara `Unavailable` en B.6.f
- Proxy devuelve `404` canónico (`master_not_found` / `financial_not_found` / `valuation_not_found` / `profile_not_found` / `similar_not_found`).
- Master Layer vacío en producción (§7.10 del plan de consumo) — estado esperado hoy.
- Feature flag `AGENCY_TOOL_MODE=mock` con provider mock que devuelve `NotFound` — dev/local.

### 3.2 · Tabla exhaustiva por sección

| Sección | Loading | Datos | Unavailable | Error 5xx | Permisos 403 |
|---|---|---|---|---|---|
| **Header** | skeleton pill · 200ms | render normal | mostrar cif + "Empresa sin nombre" · badge gris | banner error con botón `Reintentar identidad` (fetch retry) | copy: "No tienes acceso a esta empresa. Solicita acceso" + CTA |
| **Resumen · KPIs** | 4 cards skeleton (`animate-pulse`) · ~500ms | render 4 KPIs | `UnavailableBlock` REQ-012 con ETA + link a "reclamar mi empresa" | inline error compacto + `Reintentar` en el card fallado | ocultar KPIs, mensaje permisos |
| **Resumen · SemanticProfile** | skeleton chips · ~600ms | chips agrupados por dimensión | `UnavailableBlock` REQ-015 "Perfil semántico no disponible" | idem | idem |
| **Finanzas · Evolution** | skeleton curva ~800ms | sparkline multi-serie | `UnavailableBlock` REQ-012 | error compacto + retry | idem |
| **Finanzas · PL** | skeleton tabla ~600ms | tabla multi-año | `UnavailableBlock` REQ-012 | idem | idem |
| **Finanzas · Balance** | skeleton tabla ~600ms | tabla multi-año | `UnavailableBlock` REQ-013 | idem | idem |
| **Finanzas · Ratios** | grid skeleton ~500ms | grid 3-4 cols con tooltip | `UnavailableBlock` REQ-014 | idem | idem |
| **Finanzas · Quality/Solvency** | skeleton | render normal | `UnavailableBlock` REQ-014 | idem | idem |
| **Valoración** | skeleton central ~800ms | EV + rango + peers | `UnavailableBlock` REQ-016 | idem | idem |
| **Propiedad** | (no aplica — Unavailable siempre en B.6.f) | — | `UnavailableBlock` REQ-009 · ETA Sprint 2 | — | idem |
| **Gobierno** | idem | — | `UnavailableBlock` REQ-010 | — | idem |
| **Mercado · Comparables** | grid skeleton ~700ms | cards con score | `UnavailableBlock` REQ-017 · "Sin comparables reales aún" | idem | idem |
| **Señales** | (no aplica) | — | `UnavailableBlock` REQ-006 · ETA B.6.e | — | idem |
| **Oportunidades** | (no aplica) | — | `UnavailableBlock` REQ-018 · ETA B.6.f-Recommendation | — | idem |
| **Registros públicos** | (no aplica) | — | `UnavailableBlock` REQ-008 · ETA Sprint 2 | — | idem |
| **Documentos** | (no aplica) | — | `UnavailableBlock` REQ-007 · ETA Sprint 2 | — | idem |
| **Deal Panel** | skeleton compacto | selector local funciona · resto placeholder | (no aplica hasta B.6.h) | — | copy: "No tienes acceso a esta operación" |
| **Composer FAB** | siempre visible | funcional al abrir | (no aplica) | (silencioso · fallback a búsqueda local) | ocultar botón de submit si `!isAuthenticated` |

### 3.3 · Timeouts visuales
- Skeleton máximo antes de mostrar spinner con texto "cargando…": **2 segundos**.
- Skeleton máximo antes de considerar timeout y disparar Error: **10 segundos** (timeout del backend intelligence_layer es 30s, pero UX corta antes).
- Botón `Reintentar` es un skeleton con `retry-icon` que dispara refetch SWR.

### 3.4 · Reglas comunes (para todos los estados)
- **Nunca** invento datos si el proxy devuelve 404 → siempre `UnavailableBlock` (R11, R4).
- **Nunca** oculto una sección completa sin explicar por qué → mensaje canónico + CTA.
- **Skeletons** replican la forma exacta del contenido (evita CLS y "salto" visual).
- El pulso de refresh (700ms) del Sprint 1 (`animate-section-pulse`) se dispara al recargar una sección + registra `refreshes_total` en Prometheus (métrica adicional a añadir).

---

## §4 · Inventario de componentes

| # | Componente | Estado | Ubicación repo (si existe) | Motivo del cambio | Esfuerzo |
|---|---|---|---|---|---|
| 1 | `CompanyHeader` | **MOD** | `frontend/src/components/entity/CompanyHeader.tsx` | Consume `/identity` en vez de `master_companies_mock`. Añade `contact.web`, `provenance.sources` tooltip, `status` badge. | **M** (~1d) |
| 2 | `IdentityGrid` | **MOD** | `frontend/src/components/entity/IdentityGrid.tsx` | Consume `/identity` (aliases, objeto_social, capital_social). | **S** (~0.5d) |
| 3 | `MetricsBlock` | **MOD** | `frontend/src/components/blocks/MetricsBlock.tsx` | Consume `/financial-analysis` (KPIs) en vez de `sections.kpi_metrics` local. | **S** (~0.5d) |
| 4 | `AnalisisHero` | REUSAR | mockup existente | Sin cambios (dato ya proviene de identity). | 0d |
| 5 | `OportunidadesRail` | **MOD** menor | mockup existente | Añadir hook para B.6.g cuando llegue Recommendation. Sin cambio visual. | **S** (~0.3d) |
| 6 | `DealBanner` | REUSAR | mockup existente | Sin cambios. Sigue siendo local hasta B.6.h. | 0d |
| 7 | `RevenueEvolutionBlock` | **CREAR** | (nuevo) `frontend/src/components/blocks/finance/RevenueEvolutionBlock.tsx` | Sparkline multi-serie 5 años consumiendo `kpis.evolution.*`. Usa librería ya presente (recharts o similar del proyecto). | **M** (~1d) |
| 8 | `PLBlock` | **CREAR** | (nuevo) `frontend/src/components/blocks/finance/PLBlock.tsx` | Tabla multi-año P&L consumiendo `income_statement[]`. Header sticky con años; hover row highlight. | **L** (~2d) |
| 9 | `BalanceBlock` | **CREAR** | (nuevo) `frontend/src/components/blocks/finance/BalanceBlock.tsx` | Tabla multi-año Balance consumiendo `balance_sheet[]`. Agrupada por Activo / Pasivo / Patrimonio. | **L** (~2d) |
| 10 | `RatiosGridBlock` | **CREAR** | (nuevo) `frontend/src/components/blocks/finance/RatiosGridBlock.tsx` | Grid 3-4 columnas de ratios. Tooltip on-hover con `formula` del catálogo `/intelligence/ratios/catalog`. | **M** (~1.5d) |
| 11 | `AnomalyBanner` | **CREAR** minor | (nuevo) `frontend/src/components/blocks/finance/AnomalyBanner.tsx` | Banner condicional `financial-analysis.anomaly.detected==true`. | **S** (~0.3d) |
| 12 | `FinanzasHeader` | **CREAR** minor | (nuevo) `frontend/src/components/blocks/finance/FinanzasHeader.tsx` | Header sección con badges `basis`, `audited`, `data_source`, `years`. | **S** (~0.3d) |
| 13 | `FinancialQualityCard` | REUSAR | mockup existente | Sin cambios (dato ya viene en `financial-analysis.financial_quality`). | 0d |
| 14 | `SolvencyCard` | REUSAR | mockup existente | Sin cambios. | 0d |
| 15 | `ValuationBlock` | **MOD** | `frontend/src/components/blocks/ValuationBlock.tsx` | Consume `/valuation` (nuevo proxy) en vez de mock. Añade `range`, `peers`, `confidence`, `explanation` drawer. | **M** (~1d) |
| 16 | `CompanyCardsGridBlock` | **MOD** menor | `frontend/src/components/blocks/CompanyCardsGridBlock.tsx` | Consume `/similar?limit=10` en vez de mock. Añade chips `matched_dimensions`. | **S** (~0.5d) |
| 17 | `SemanticProfileBlock` | **CREAR** | (nuevo) `frontend/src/components/blocks/semantic/SemanticProfileBlock.tsx` | Chips agrupados por dimensión (`activities`, `products_services`, `markets`, `keywords`) + narrativa `value_proposition` + `business_model`. Consumidor de `/profile`. | **M** (~1.5d) |
| 18 | `UnavailableBlock` | REUSAR | `frontend/src/components/blocks/UnavailableBlock.tsx` | Sin cambios (ya soporta REQ + ETA). | 0d |
| 19 | `SectionErrorBoundary` | **CREAR** minor | (nuevo) `frontend/src/components/blocks/SectionErrorBoundary.tsx` | Error 5xx boundary genérico con botón `Reintentar` que dispara SWR mutate. | **S** (~0.5d) |
| 20 | `PermissionDenied` | **CREAR** minor | (nuevo) `frontend/src/components/blocks/PermissionDenied.tsx` | Copy canónico para 403 · CTA "Solicitar acceso". | **XS** (~0.2d) |
| 21 | `CanonicalDealPanel` | REUSAR | mockup existente | Sin cambios en B.6.f (llega en B.6.h). | 0d |
| 22 | `Composer` | **MOD** menor | `frontend/src/components/composer/*` | Solo cambia el endpoint que consume (`/entities/semantic-search`). Zero UI changes. | **S** (~0.3d) |
| 23 | `CompanyPageClient` | **MOD** ⭐ | `frontend/src/components/entity/CompanyPageClient.tsx` | Adopta layout canónico 3-columnas + orquesta los nuevos proxies con SWR. **Es el corazón de B.6.f**. | **L** (~2.5d) |

**Totales:**
- Sin cambios (REUSAR): **5** componentes.
- Modificar: **8** componentes (`M/L` totales ~7.6d).
- Crear: **10** componentes (`M/L/S/XS` totales ~10.6d).
- **Estimación cruda de esfuerzo B.6.f**: **~13 días efectivos** + 1 día buffer R11 + 1 día para tests visuales/e2e.

---

## §5 · Interacciones y transiciones

### 5.1 · Nav lateral izq (`<CanonicalNav>`)
- Click en item de sección → `setSection('finanzas')`.
- Efecto: `window.scrollTo({top:0,behavior:'smooth'})` + `history.replaceState(null,'',`?section=${id}`)`.
- SWR `mutate` **NO** se dispara — los datos están cacheados o loading persistente.
- Estado activo visual: pill izq con `bg-primary/10 text-primary`.

### 5.2 · Fetch on-demand (lazy loading)
- **Al montar `CompanyPageClient`**: fetch inmediato de `/identity` (crítico para header) + `/financial-analysis` (crítico para KPIs del resumen).
- **Al entrar a sección `finanzas`**: si no cacheado, fetch on-demand de `/valuation` (para "también podrías querer valorar").
- **Al entrar a sección `valoracion`**: fetch on-demand de `/valuation` + `/similar` (para peers).
- **Al entrar a sección `mercado`**: fetch on-demand de `/similar`.
- **Al entrar a sección `resumen` primera vez**: fetch on-demand de `/profile`.
- Ratios catalog `/intelligence/ratios/catalog` se carga **una sola vez** al abrir el módulo cliente (cache 24h en backend, cache SWR indefinido en frontend).

### 5.3 · Deal Panel derecha
- Sticky con `position:sticky; top:56px`.
- Selector `venta|compra|financiación|fusión|none` — cambio de escenario es state local en B.6.f. Los "Acciones" cambian según escenario (mock).
- Pulso al cambiar escenario: `animate-section-pulse` 700ms (reusa animación Sprint 1).

### 5.4 · Refresh de sección
- Botón `Reintentar` en Error → `mutate(sectionKey)` de SWR + pulso 700ms + Prometheus counter `intelligence_layer_frontend_refreshes_total{section}` (métrica nueva).
- Botón `Reintentar` en Unavailable → misma acción (el 404 puede convertirse en 200 tras ingesta).

### 5.5 · Composer FAB
- Sin cambios estructurales. Cambio interno: al buscar empresa, invoca `POST /api/entities/semantic-search` con `{query, limit:10}` en lugar de `/api/entities/lookup`.
- Legacy `/entities/lookup` sigue vivo hasta B.6.f completado + 2 semanas de gracia.

### 5.6 · Tema Light/Dark
- Toggle preserva (usa `next-themes` ya presente). Los renderers nuevos DEBEN respetar CSS variables ya definidas (`--surface`, `--text`, `--border-strong`). Sin hard-coded colores.

### 5.7 · Skeleton unfold
- Todos los skeletons usan `animate-pulse` de Tailwind + gradient overlay para consistencia con lo existente.

---

## §6 · Riesgos visuales anticipados

### 6.1 · Master Layer vacío en prod → **90% de secciones en Unavailable**
- **Riesgo**: la ficha real en producción se verá "vacía" (5 secciones con UnavailableBlock). Puede parecer un bug visual.
- **Mitigación**:
  - `UnavailableBlock` debe explicar claramente el motivo: "Estamos consolidando los datos de esta empresa. En unos días esta sección tendrá información real." (copy revisable).
  - Añadir CTA "Reclamar mi empresa" cuando aplique (link a formulario de reclamación existente).
  - Mostrar `X-Intelligence-Mode: real` en DevTools no basta — hace falta un banner leve informativo dev-only.
  - Considerar añadir estado `demo` global cuando el 90% viene vacío: banner top informativo "Datos en fase de consolidación · algunas secciones aparecerán vacías temporalmente".

### 6.2 · Densidad visual cuando SÍ hay datos ricos
- **Riesgo**: la sección `finanzas` con 5 años de PL + balance + 10 ratios + evolution puede volverse **muy larga** (~2000px de scroll).
- **Mitigación**:
  - Introducir sub-anchor scroll dentro de `finanzas` (mini-nav `Evolución · P&L · Balance · Ratios · Calidad · Solvencia`) sticky bajo el header.
  - Tablas PL/Balance con toggle "mostrar todos los años / últimos 3".
  - Ratios en grid colapsable con "ver más".

### 6.3 · Deal Panel derecha 360px fijos
- **Riesgo**: en viewport 1280 (que existe en portátiles pequeños), la columna central queda con ~600px de ancho útil. Tablas PL/Balance pueden cortar contenido o forzar scroll horizontal.
- **Mitigación**:
  - Breakpoint `< 1280px`: Deal Panel se colapsa a icono lateral con drawer on-click (reusa patrón mobile).
  - Tablas usan `overflow-x-auto` con sticky first-column.
  - Test visual mandatorio a viewports 1280 / 1440 / 1920 antes de merge.

### 6.4 · Chips semánticas con listas largas
- **Riesgo**: `SemanticProfileBlock` puede recibir `keywords[]` con 30+ elementos, rompiendo el layout de card.
- **Mitigación**: limitar a los primeros 12 chips + "ver más (+N)" que expande el bloque en un modal o inline.

### 6.5 · Peers del Valuation vs Comparables del Mercado
- **Riesgo**: `/valuation` devuelve `comparables.peers[]` (para valoración) y `/similar` devuelve peers semánticos. **Distintos criterios, pueden solaparse**.
- **Mitigación**: dejar claro en UI qué tipo de peer es: "Peers de valoración (mismo sector + tamaño)" vs "Empresas similares (perfil semántico)". Sin unir listas.

### 6.6 · Contract drift entre `arroba-financial-v1` interno y `financial-intelligence-v1` externo
- **Riesgo**: si el proveedor cambia el schema §6.2 sin bump, arroba puede empezar a mapear campos vacíos.
- **Mitigación**: los DTOs Pydantic backend (`interfaces/financial.py`) ya son estrictos con `extra="ignore"`. En frontend, TypeScript sobre el response del proxy garantiza validación estática. Además, se añaden 3 tests visuales por sección (Loading/Datos/Unavailable) que rompen si el shape cambia.

### 6.7 · Freeze frontend R11 vs iteración natural
- **Riesgo**: durante la implementación, aparecerán 10-15 "micro-decisiones visuales" no cubiertas por este doc (padding exacto, exact color de un chip, animation curve).
- **Mitigación**: cualquier micro-decisión que MODIFIQUE el mockup canónico existente pasa por consulta al orquestador (R11.5). Las decisiones que solo afectan a componentes NUEVOS creados en B.6.f pueden decidirse en el momento siempre que respeten el design system.

---

## §7 · Checklist de aprobación

Antes de arrancar código B.6.f, el usuario debe aprobar expresamente:
- [ ] Layout 3-columnas reproducido tal cual (sin rediseño estructural).
- [ ] 4 KPIs del resumen: `Ingresos · EBITDA · Margen EBITDA · Empleados`. ¿Añadir un 5º? (candidato: `Crecimiento YoY`).
- [ ] Tablas PL/Balance multi-año con toggle 3-años / 5-años. ¿Preferís vista tarjeta compacta en lugar de tabla?
- [ ] Grid de ratios 3-columnas con tooltip hover de fórmula. ¿O prefiere accordion agrupado por categoría (`profitability`, `liquidity`, `solvency`, `efficiency`)?
- [ ] Sección `mercado`: se llama "Empresas similares" o "Comparables". Consenso: **Empresas similares** (evita colisión con Valuation Comparables).
- [ ] Mensaje de banner "datos en consolidación" cuando Master Layer vacío. ¿Copy sugerido OK?
- [ ] REQ codes finales: `REQ-012` (financials), `REQ-013` (balance), `REQ-014` (ratios), `REQ-015` (semantic), `REQ-016` (valuation), `REQ-017` (similar), `REQ-018` (opportunities). Verificar que no colisionan con existentes (`REQ-006`/`007`/`008`/`009`/`010`).

---

_Fin del documento. Cualquier micro-decisión visual no cubierta se consulta al orquestador antes de tocar código (R11)._
