# ARROBA · B.6.f Design Proposal · v1

> DEPRECADO 2026-07-06. Superseded por ACC_v0.1.md (`/app/memory/sources/empresa_v1/`). Diseño de la Ficha de Empresa reconstruido bajo Sprint F0. Mantenido por trazabilidad histórica.


> Nota canónica: los principios (P1 Explainability First, P2 Intelligence over Data, P3 Zero Coupling) y reglas (R11, R12, R13) referenciados en este documento están formalizados en 'ARROBA_ARCHITECTURAL_PRINCIPLES.md'. Puerta de entrada al canon: 'ARROBA_CANON.md'.

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

## §7 · Adaptación al Design System de arroba.com (v1.0.0)

_Añadido tras aprobación PARCIAL del usuario (estructural OK · visual pendiente).
Fuente de verdad del DS: `/app/memory/DESIGN_SYSTEM.md` v1.0.0, `/app/frontend/src/styles/tokens.css`, `/app/frontend/tailwind.config.ts`, `/app/frontend/src/components/ds/`, `/app/frontend/src/components/blocks/`, `/app/frontend/src/components/entity/`._
_R11 sigue activo: este documento describe la adaptación · **no se toca ningún archivo bajo `/app/frontend/**`**._

### §7.1 · Inventario del DS real (resumen)

#### Tokens (single source of truth: `src/styles/tokens.css`, mapeados en `tailwind.config.ts`)
| Familia | Tokens canónicos disponibles |
|---|---|
| **Brand** | `--brand-primary` `#E8001D` (arroba-red) · `--brand-primary-hover` `#C50019`/`#FF1A35` · `--brand-accent` `#0C0C0E` (arroba-black) |
| **Surface** | `--surface-primary` (page bg) · `--surface-elevated` (cards) · `--surface-muted` (footers, teasers) |
| **Text** | `--text-primary` · `--text-secondary` · `--text-muted` · `--text-disabled` · `--text-on-brand` |
| **Border** | `--border-default` · `--border-emphasis` |
| **Feedback** | `success` / `warning` / `danger` / `info` + variantes `-subtle` (bg tenue) |
| **Radios** | `--radius-sm/md/lg/xl/2xl/full` (4/8/12/16/24/pill). Cards principales = `rounded-2xl`. Cards internos = `rounded-xl`. Chips = `rounded-full`. |
| **Sombras** | `--shadow-sm/md/lg/xl` + `--focus-ring` (arroba-red 22% light / 32% dark). Cards por defecto **sin sombra**: solo `border-default`. |
| **Spacing** | Escala 4-based tokenizada `space-1..24` (Tailwind `p-4` = 16px = `--space-4`). Cero px arbitrarios. |
| **Tipografía** | 3 familias: `--font-display` = **Space Grotesk** (h1-h4, eyebrows) · `--font-body` = **DM Sans** (body, captions) · `--font-mono` = **JetBrains Mono** (números tabulares, CIF, IDs). |
| **Escala tipográfica** | `text-display` 72 · `text-h1` 36 · `text-h2` 28 · `text-h3` 22 · `text-h4` 18 · `text-body` 15 · `text-body-sm` 14 · `text-caption` 12 · `text-mono` 14. Cada uno con leading + tracking propios. |
| **Motion** | Duraciones `fast` 150ms / `normal` 250ms / `slow` 400ms. Easings `standard` / `emphasized` / `out`. Animaciones canónicas: `animate-section-pulse` (700ms rojo tras section update) · `animate-fade-in-up` (250ms). `prefers-reduced-motion` colapsa a 0.001ms. |
| **Z-index** | `z-base/dropdown/sticky/overlay/modal/toast/tooltip` (0/100/200/800/1000/1200/1300). |
| **Focus & a11y** | `:focus-visible` → `box-shadow: var(--focus-ring)` · Tap target min 44px. `aria-busy`, `aria-live=polite` para section updates, `assertive` sólo errores críticos. |
| **Breakpoints** | Tailwind default `sm:640 · md:768 · lg:1024 · xl:1280 · 2xl:1536`. |
| **Dark mode** | Driven por `[data-dark]` en `<html>` (no `.dark` class). Sólo tokens semánticos cambian; brand + neutral ramp constantes. |

#### Primitivas del DS (`src/components/ds/*` — 9 primitivas)
| Componente | Path | Uso relevante para B.6.f |
|---|---|---|
| `Card` | `ds/Card.tsx` | Contenedor canónico. `bg-surface border border-border rounded-lg shadow-sm`. Slots `header` (con `border-b`), children (padded p-5), `footer` (con `border-t` + `bg-surface-2`). |
| `Button` | `ds/Button.tsx` | 4 variantes (`primary`/`secondary`/`ghost`/`danger`), 3 sizes (`sm/md/lg`). Soporta `loading` (spinner `Loader2`), `leftIcon`/`rightIcon`, `aria-busy`. Tap target 44px min. |
| `Badge` | `ds/Badge.tsx` | Pills `default`/`success`/`warning`/`danger`/`info`. `bg-{feedback}/10 text-{feedback} border-{feedback}/30`. `rounded-full` `h-6 px-2 text-xs`. |
| `Alert` | `ds/Alert.tsx` | 4 variantes (`info`/`success`/`warning`/`danger`). Icono `lucide` por variante. `role="status"`. Slot `action`. |
| `Avatar`, `ConfidenceBadge`, `Divider`, `Input`, `Spinner`, `ThemeSwitcher` | `ds/*` | Complementarios (Avatar en header, ConfidenceBadge probable candidato para Valuation confidence). |

#### Blocks canónicos (`src/components/blocks/*` — 19 blocks)
- **Datos**: `HeroBlock`, `MetricsBlock` (título+eyebrow+grid), `MetricsGrid` (grid puro 1/2/3/4 cols), `ValuationBlock` (con `ValueRangeBar` interno), `NarrativeBlock`, `CompanyCardBlock`, `CompanyCardsGridBlock` (subtypes: `similar_to_company`/`opportunities_by_sector`/`list_by_sector`/`generic`), `IdentityCard`, `SignalsTimeline`, `DocumentList`, `ActivityTimeline`, `SearchResultsBlock`, `FeatureCardBlock`, `CTABlock`.
- **Estados**: `LoadingBlock` (skeleton con `animate-pulse`), `EmptyStateBlock`, `ErrorBlock` (con `RefreshCw` + `onRetry`), `UnavailableBlock` (`Construction` icon + `req`/`eta`/`cta`) — canónicos para los 5 estados.
- **Acciones**: `RefreshButton` (idle/loading/cooldown/disabled con `data-state` para QA).

#### Entity (`src/components/entity/*`)
- `CompanyHeader` (re-export = `EntityHeader`) · `EntitySectionWrapper` (re-export = `EntitySection`) · `LockedSectionBlur` · `CompanyPageClient` (orquestador) · sub-carpeta `entity/base/` con `EntitySections`/`EntitySignals`/`EntityMetrics`/`EntityHero`/etc. como wrappers polimórficos entidad-agnósticos.

#### Iconografía
- **Única fuente**: **`lucide-react`** v0.577.0 (confirmado en `package.json` y consumido en 20+ archivos). Tamaños canónicos 12/14/16/18/20 con `strokeWidth={1.5-1.8}`. **Cero SVG hardcoded** salvo el sparkline determinístico interno de `CompanyEvolutionChart` (SVG inline `<svg viewBox>` sin lib externa — patrón canónico del DS: §3.1 y §3.11).

#### Estados canónicos (patrón unificado §3.10)
| Estado | Componente canónico | Cuándo |
|---|---|---|
| Loading | `LoadingBlock` (skeleton con `animate-pulse`) | Dato pidiéndose ahora |
| Datos | Block correspondiente | Render normal |
| Empty | `EmptyStateBlock` | Existe pero sin registros |
| Locked | `LockedSectionBlur` | Requiere auth/upgrade |
| Unavailable | `UnavailableBlock` | Depende de REQ-XXX externo |
| Error | `ErrorBlock` | 5xx runtime, recuperable con `onRetry` |

**Regla del DS**: nunca renderizar un block vacío sin explicación. Siempre uno de los 6 estados.

#### Tono editorial detectado (para D5)
Muestras del codebase (`UnavailableBlock` docstring, `MetricsBlock` copy, `CompanyHeader` "Próximamente — REQ-008 pendiente", mockup "Vista previa canónica · ruta aislada · pendiente de aprobación visual"):
- Uso frecuente del separador **`·`** (punto medio) para meta-info.
- Frases en presente, 1ª persona plural implícita ("sabemos", "estamos consolidando").
- Verbos de acción diferida naturales: *"se actualizará automáticamente"*, *"cuando entregue"*, *"pendiente de"*, *"todavía no está"*.
- Cero exclamaciones. Cero marketese. Cero emojis (sólo `✦` en Copilot, contexto agente).
- Longitud objetivo: 1-2 frases cortas.

---

### §7.2 · Mapping DS por cada uno de los 9 componentes NUEVOS

Convenciones aplicables a los 9:
- **Import de primitivas**: `import { Card, Badge, Button, Alert } from '@/components/ds'`.
- **Import de blocks**: `import { UnavailableBlock, LoadingBlock, ErrorBlock, MetricsGrid, RefreshButton } from '@/components/blocks'`.
- **Import de section wrapper**: `import { EntitySection } from '@/components/entity'`.
- **Fuentes**: `font-display` (Space Grotesk) para títulos y valores destacados · `font-body` (DM Sans) para copy · `font-mono` (JetBrains Mono) para números tabulares.
- **Nunca**: `text-xl` con `text-*` legacy fuera de escala canónica; nunca hex/rgba hardcoded; nunca `system-ui` fallback como primario; nunca `p-[16px]`.
- **Estados de todos**: `loading` → skeleton propio con `animate-pulse` respetando la forma del contenido (evita CLS) · `unavailable` → `UnavailableBlock` con REQ+ETA canónicos · `error` → `ErrorBlock` con `onRetry=mutate()` · `403` → `PermissionDenied` (nuevo, ver §7.4).

---

#### 1. Componente NUEVO · `RevenueEvolutionBlock`
- **Sección**: Finanzas (primer card).
- **Fuente de datos**: `/api/companies/{cif}/financial-analysis` → `kpis.evolution.{revenue[], ebitda[], net_income[]}` + `kpis.revenue_growth_yoy` + `kpis.revenue_cagr`.
- **Composición DS canónica**: `<Card padded={false} header={<FinanzasHeaderSlot title="Evolución 5 años" eyebrow="Ingresos · EBITDA · Beneficio neto" />}>` + body con **SVG inline** siguiendo patrón `CompanyEvolutionChart` del DS §3.1 (sparkline multi-serie 3 líneas + área stack sutil) + footer con 2 `<Badge>` (`Δ YoY +12%`, `CAGR 3y +9%`).
- **Tokens usados**:
  - Serie principal (revenue): `stroke="var(--brand-primary)"` (arroba-red)
  - Serie secundaria (ebitda): `stroke="var(--info)"`
  - Serie terciaria (net_income): `stroke="var(--text-muted)"` con `stroke-dasharray="4 2"`
  - Fondo card: `bg-surface-elevated`
  - Borde: `border-default`
  - Radio: `rounded-2xl` (card principal)
  - Título: `text-h3 font-display font-semibold text-text-primary`
  - Eyebrow: `text-caption uppercase tracking-caption font-semibold text-brand-primary`
  - Valores en tooltip hover: `font-mono text-body-sm tabular-nums`
- **Icono**: `TrendingUp` de `lucide-react` en el header (size 18, strokeWidth 1.8).
- **Estados**:
  - Loading: skeleton SVG placeholder + 3 líneas gris `bg-border-emphasis animate-pulse`
  - Datos: render normal
  - Unavailable: `<UnavailableBlock title="Evolución financiera no disponible" req="REQ-012" eta="Fase B.6.f" description="Estamos consolidando los datos de esta empresa · en cuanto el proveedor externo los entregue, esta sección se actualizará automáticamente." />`
  - Error: `<ErrorBlock title="No hemos podido cargar la evolución" onRetry={mutate} />`
- **Anti-patterns evitados**: no usar `recharts`/`visx`/`d3` (el DS canónico usa SVG inline determinístico); no hardcodear colores del gráfico (todos vía `var(--*)`); no usar `Chart.js`.

---

#### 2. Componente NUEVO · `PLBlock` (Cuenta de resultados multi-año)
- **Sección**: Finanzas (segundo card).
- **Fuente de datos**: `/api/companies/{cif}/financial-analysis` → `income_statement[]` (array con `year`, `revenue`, `supplies`, `personnel_costs`, `depreciation`, `operating_income`, `financial_expenses`, `ebit`, `ebitda`, `net_income`).
- **Composición DS canónica**: `<Card header={<h3>Cuenta de resultados</h3> + action toggle 3y/5y}>` + tabla renderizada con **grid CSS** (no `<table>` HTML) porque no existe primitiva `<Table>` canónica en el DS (ver §7.4 · gap). Estructura: `grid-cols-[minmax(180px,1fr)_repeat(auto-fit,minmax(90px,1fr))]`. Primera columna sticky con `sticky left-0 bg-surface-elevated`.
- **Tokens usados**:
  - Card: `rounded-2xl border-default bg-surface-elevated`
  - Header row: `bg-surface-muted border-b border-default`
  - Filas alternas: default `bg-surface-elevated`, hover `hover:bg-surface-muted transition-colors duration-fast`
  - Labels: `font-body text-body-sm text-text-secondary`
  - Números: `font-mono text-body-sm tabular-nums text-text-primary`
  - Fila destacada (EBITDA/Net income): `font-body font-semibold text-text-primary` + `border-y border-emphasis`
  - Toggle 3y/5y: pill `<Badge variant="default">` clickable con `data-active` (crea variante interactiva, ver §7.4 · gap Badge interactivo)
- **Icono**: `Table2` en header (18/1.8) + `ChevronDown` en toggle.
- **Estados**: idénticos al patrón, `REQ-012`, description Copy D5 aplicado.
- **Anti-patterns evitados**: no usar `<table>` HTML sin estilización DS · no fijar column widths en px · no hardcodear números de decimales (usar helper `formatEUR` del `ValuationBlock` como referencia).

---

#### 3. Componente NUEVO · `BalanceBlock` (Balance multi-año)
- **Sección**: Finanzas (tercer card).
- **Fuente de datos**: `/api/companies/{cif}/financial-analysis` → `balance_sheet[]` (con `year`, `current_assets`, `non_current_assets`, `total_assets`, `cash`, `current_liabilities`, `non_current_liabilities`, `total_liabilities`, `st_debt`, `lt_debt`, `financial_debt`, `equity`).
- **Composición DS canónica**: mismo patrón que `PLBlock`: `<Card>` + grid CSS con primera columna sticky. Diferencia clave: **3 grupos visuales** separados por `<Divider>` (`ds/Divider`) con eyebrow por grupo (`Activo` / `Pasivo` / `Patrimonio neto`).
- **Tokens usados** (mismos que PL) + adicional:
  - Eyebrow de grupo: `text-caption uppercase tracking-caption font-semibold text-text-secondary` sobre `bg-surface-muted h-8 px-4`
  - Totales por grupo (fila destacada): `font-semibold border-t border-emphasis`
- **Icono**: `Scale` en header.
- **Estados**: idénticos, `REQ-013`.
- **Anti-patterns evitados**: no mostrar cifras negativas con "-" prefijado sin color; usar `text-danger` para negativos + prefijo "(" ")" contable si aplica.

---

#### 4. Componente NUEVO · `RatiosGridBlock`
- **Sección**: Finanzas (cuarto card).
- **Fuente de datos**: `/api/companies/{cif}/financial-analysis` → `ratios{ebitda_margin, ebit_margin, net_margin, roe, roa, current_ratio, debt_ratio, debt_to_equity, interest_coverage, ...}` + `/api/intelligence/ratios/catalog` para las fórmulas.
- **Composición DS canónica**: reutiliza **`<MetricsGrid columns={3} showTrends={true} />`** del DS con extensión: cada `MetricItem` recibe `hint` = valor + `tooltip` (crear extensión leve · ver §7.4). Como `MetricsGrid.MetricItem` ya soporta `label`, `value`, `hint`, `trend`, el mapping es directo. El **tooltip con fórmula** requiere primitiva `<Tooltip>` que **no existe** en el DS (gap · §7.4).
- **Tokens usados**: los del `MetricsGrid` canónico (`rounded-xl border-default bg-surface-elevated`, `text-h3 font-display tabular`, `text-caption uppercase tracking-caption text-muted`, hover `border-emphasis transition duration-fast`).
- **Icono**: `Percent` en el header del `<EntitySection>` externo (no dentro del grid).
- **Estados**: idénticos, `REQ-014`.
- **Anti-patterns evitados**: no colorear ratios por umbral hardcoded (delegar al catálogo del backend); no mostrar ratio sin decimal fijo (2 decimales para porcentajes, 2 para ratios).

---

#### 5. Componente NUEVO · `AnomalyBanner` (banner condicional en Finanzas)
- **Sección**: Finanzas (top de sección, sólo si `financial-analysis.anomaly.detected === true`).
- **Composición DS canónica**: **reusa `<Alert variant="warning" title="Anomalía detectada en los estados financieros" />`** del DS `ds/Alert.tsx`. Icono automático `AlertTriangle`. Slot `action` para link "Ver detalles" que abre drawer con `anomaly.explanation` del backend.
- **Tokens usados**: los propios del `Alert` canónico (`bg-warning/10 text-warning border-warning/30`).
- **Icono**: automático de `Alert` (`AlertTriangle` lucide, size 20, strokeWidth 1.5).
- **Estados**: sólo se monta si el flag está true; no tiene sus propios estados de loading/error (heredados del `financial-analysis`).
- **Anti-patterns evitados**: no usar banner rojo (`danger`) para anomalías detectadas — reservar rojo para errores destructivos; anomalía = `warning`.

---

#### 6. Componente NUEVO · `FinanzasHeader` (header interno de la sección)
- **Sección**: Finanzas (bajo el título del `EntitySection`, sobre el primer card).
- **Composición DS canónica**: fila horizontal de **4-5 `<Badge>`** con metadatos: `Datos 2020-2024` (variant `default`), `Individual` (variant `default`), `Auditada por [Auditor]` (variant `info` si audited=true, `default` si false), `Fuente: Iberinform` (variant `default`), `Última actualización: hace N días` (variant `default`).
- **Tokens usados**: los del `Badge` canónico (`rounded-full h-6 px-2 text-xs font-medium border font-body`).
- **Icono**: opcionalmente `ShieldCheck` (lucide) dentro del badge "Auditada" como `icon` slot.
- **Estados**: badges vacías se ocultan (nunca badge con "—").
- **Anti-patterns evitados**: no hacer sub-header con h2/h3 (compite con el título de la sección); usar solo badges horizontales.

---

#### 7. Componente NUEVO · `SemanticProfileBlock`
- **Sección**: Resumen (card debajo del hero).
- **Fuente de datos**: `/api/companies/{cif}/profile` → `activities[]`, `products_services[]`, `markets[]`, `keywords[]`, `value_proposition`, `business_model`.
- **Composición DS canónica**: `<Card header={<h3>Perfil de negocio</h3>}>` con dos zonas:
  1. **Chips agrupados**: 4 sub-secciones (Actividades · Productos y servicios · Mercados · Palabras clave). Cada sub-sección con eyebrow `text-caption uppercase tracking-caption` + flex-wrap de `<Badge variant="default">` (chips). Máx 12 chips por grupo con "+N más" al final (ver R.4 riesgo §6.4).
  2. **Narrativa**: dos párrafos `text-body font-body text-text-secondary leading-body max-w-prose` con headings `text-body-sm font-display font-semibold text-text-primary` para `Propuesta de valor` y `Modelo de negocio`.
- **Tokens usados**:
  - Card: `rounded-2xl border-default bg-surface-elevated p-6 md:p-8`
  - Eyebrows de grupo: `text-caption uppercase tracking-caption font-semibold text-text-secondary`
  - Chips: `<Badge variant="default">` (default = `bg-surface-muted text-text-muted border-border`)
  - Narrativa: `font-body text-body text-text-secondary leading-body`
- **Icono**: `Sparkles` (lucide) en header (usado en el codebase para AI/semántica, ver `CompanyCardsGridBlock`).
- **Estados**: idénticos, `REQ-015`.
- **Anti-patterns evitados**: no usar chips coloreados por dimensión (mantener consistencia visual); no truncar keywords sin CTA "+N más".

---

#### 8. Componente NUEVO · `SectionErrorBoundary`
- **Sección**: Global (envuelve cada sección de la ficha).
- **Composición DS canónica**: **reusa `<ErrorBlock>`** del DS (`blocks/ErrorBlock.tsx`) directamente. No es un componente visual nuevo, sino un React ErrorBoundary de clase que atrapa runtime errors y renderiza `<ErrorBlock title="No hemos podido cargar esta sección" message={err.message} onRetry={mutate} />`. Para errores de red 5xx del proxy `intelligence_layer`, se dispara vía SWR error handler (no ErrorBoundary).
- **Tokens usados**: los del `ErrorBlock` canónico (`rounded-xl border-danger/30 bg-danger/5`).
- **Icono**: automático `AlertCircle` del `ErrorBlock` (size 20, strokeWidth 1.6, `text-danger`).
- **Estados**: sólo se activa cuando hay error. Botón `Reintentar` dispara `mutate(sectionKey)` de SWR.
- **Anti-patterns evitados**: no capturar errores globalmente (romper granularidad por sección); no mostrar stack trace en producción.

---

#### 9. Componente NUEVO · `PermissionDenied`
- **Sección**: Global (renderizado cuando el backend devuelve 403).
- **Composición DS canónica**: **reusa `<Alert variant="danger" title="No tienes acceso a esta empresa" action={<Button variant="primary" size="sm">Solicitar acceso</Button>}>` + body con copy** — el patrón `Alert + action` está soportado por la primitiva `ds/Alert.tsx`. No requiere componente nuevo, sino wrapper de conveniencia.
- **Tokens usados**: los del `Alert variant="danger"` (`bg-danger/10 text-danger border-danger/30`) + `Button variant="primary"` (`bg-primary text-white hover:bg-primary-hover`).
- **Icono**: automático `AlertCircle` del `Alert danger`.
- **Estados**: sólo se activa cuando 403.
- **Anti-patterns evitados**: no usar `LockedSectionBlur` (ese es para "premium" no para "sin permisos"); no ocultar la sección sin explicación.

---

### §7.3 · Reglas de composición (obligatorias para los 9 nuevos)

1. **Card canónica** = `<Card>` de `@/components/ds` cuando se necesita chrome completo con header/footer. Para bloques más ligeros dentro de una sección, usar el patrón directo `rounded-2xl border border-default bg-surface-elevated p-6 md:p-8` (mismo que `UnavailableBlock`). **No mezclar** con `<div className="bg-white shadow-md">` estilo shadcn.
2. **Tabla financiera** (PL/Balance): no existe primitiva `<Table>` en el DS → usar **grid CSS** con `grid-cols-[minmax(180px,1fr)_repeat(auto-fit,minmax(90px,1fr))]` respetando spacing tokens. Marcado semántico: `<div role="table">`, `<div role="row">`, `<div role="cell">`. Sticky first column. **Ver §7.4 gap G1**.
3. **Chart** (RevenueEvolution): **SVG inline** con `viewBox`, sin librería externa. Consultar la implementación de `CompanyEvolutionChart` (`entity/CompanyPageClient.tsx` L800-830) como referencia. Colores exclusivamente via `stroke="var(--brand-primary)"` etc.
4. **Tooltip** (Ratios): **no existe primitiva `<Tooltip>` canónica** en el DS → **ver §7.4 gap G2**.
5. **Badge/Chip**: exclusivamente `<Badge>` de `@/components/ds`. Variantes limitadas a `default/success/warning/danger/info`. Si necesitamos chips agrupables o interactivos (toggle 3y/5y en PL), **ver §7.4 gap G3**.
6. **Botones y CTAs**: exclusivamente `<Button>` de `@/components/ds`. Variante `primary` para acciones principales (Reintentar, Reclamar), `secondary` para "Ver metodología", `ghost` para acciones tercearias, `danger` sólo para destructivas.
7. **Iconos**: **exclusivamente `lucide-react`** v0.577.0. Nombres canónicos ya en uso: `TrendingUp`, `Table2`, `Scale`, `Percent`, `Sparkles`, `ShieldCheck`, `AlertTriangle`, `AlertCircle`, `RefreshCw`, `Construction`, `ChevronDown`, `Info`. Sizes canónicos: 12/14/16/18/20. `strokeWidth` 1.5-1.8. **Cero SVG inline** salvo el sparkline del `RevenueEvolutionBlock`.
8. **Estados**: cada componente debe declarar los 5 estados canónicos (Loading/Datos/Unavailable/Error/Permisos) usando exclusivamente `LoadingBlock`/`UnavailableBlock`/`ErrorBlock`/`Alert` del DS. Nunca inventar un estado nuevo.
9. **Skeleton dimensions** replican la forma exacta del contenido final (evita CLS).
10. **Sección wrapper**: los 9 componentes viven dentro de `<EntitySection id="finanzas" title="Finanzas" description="...">` — nunca renderizar `<section>` propio.
11. **Motion**: pulsos y transiciones sólo con las animaciones canónicas `animate-section-pulse`, `animate-fade-in-up`, `animate-pulse` (skeleton). Duraciones vía tokens `duration-fast/normal/slow`. Ninguna animación custom.
12. **Focus**: cada elemento interactivo respeta `focus-visible:shadow-focus` (arroba-red glow). Tap target mínimo 44px.

---

### §7.4 · Gaps del DS · requieren decisión del usuario antes de codificar

_Marcados con evidencia del codebase que confirma que **no existe** primitiva canónica._

#### **G1 · Primitiva `<Table>` inexistente**
- **Contexto**: `PLBlock` y `BalanceBlock` requieren tabla multi-año con sticky first column, filas destacadas para totales, hover row.
- **Evidencia**: `find components/ds/` no devuelve ningún `Table.tsx`. `blocks/*` no tiene un `TableBlock`. El DS §2 (Nivel 2 componentes) tampoco menciona `Table`. La única primitiva tabular existente es `MetricsGrid` (grid puro, no tabla).
- **Propuesta**: **(b) reusar `<Card>` + composición grid CSS con roles ARIA** siguiendo estrictamente los tokens del DS. **No crear primitiva `<Table>` en `ds/`** — mantendría R11.5 y el patrón "no premature abstraction" del DS. Si en E1.6 (Sector Page) surge la necesidad de tabla reutilizable, se extrae entonces.
- **Alternativa propuesta al usuario**: (a) crear `<Table>`, `<THead>`, `<TBody>`, `<TR>`, `<TD>` en `ds/` como primitiva nueva del DS v1.1.0. Ventaja: reutilizable en Sector Page + Transaction OS. Coste: bump del DS + revisión canónica.
- **Escala al usuario**: sí. Recomendación E1: **(b)**, pero (a) es correcto arquitectónicamente para el largo plazo.

#### **G2 · Primitiva `<Tooltip>` inexistente**
- **Contexto**: `RatiosGridBlock` requiere tooltip on-hover con la fórmula del ratio (viene de `/intelligence/ratios/catalog`).
- **Evidencia**: `find components/ds/` sin `Tooltip.tsx`. `blocks/*` sin `Tooltip`. El DS §2 no lo enumera. Grep `role="tooltip"` en `src/**` = 0 hits.
- **Propuesta**: **(a) crear primitiva `<Tooltip>` en `ds/Tooltip.tsx`** usando `<button>` con `aria-describedby` + un `<div role="tooltip">` posicionado absolutamente. Sin dependencia externa (Radix, headlessUI). Diseño consistente con `Alert/Badge` (`bg-surface-elevated border-emphasis rounded-md shadow-md p-3 text-body-sm max-w-xs`). Z-index `--z-tooltip` (1300).
- **Alternativa**: (b) reusar `title=""` HTML nativo. Descartado: no permite estilización canónica ni multi-línea.
- **Escala al usuario**: sí. Recomendación E1: **(a)** — es una extensión evidente del DS que el propio §1.7 z-index ya anticipa (`--z-tooltip`). Beneficia también a `IdentityCard`, `CompanyHeader.sourcesTooltip`, etc.

#### **G3 · Variante interactiva de `<Badge>` inexistente**
- **Contexto**: toggle 3y/5y en `PLBlock`/`BalanceBlock` (pills clickables).
- **Evidencia**: `ds/Badge.tsx` es un `<span>` puro, sin `onClick`, sin `data-active`.
- **Propuesta**: **(b) reusar `<Button variant="ghost" size="sm">`** con `data-active={year===5}` para el toggle. Semántica correcta (botón, no badge). Mantiene el DS sin ampliación.
- **Alternativa**: (a) extender `<Badge>` con `onClick` + `data-active`. Riesgo: mezcla `<span>` con semántica de botón (accesibilidad).
- **Escala al usuario**: sí, pero es una decisión de bajo riesgo. Recomendación E1: **(b)**.

#### **G4 · Copy canónico para banner global "Datos en consolidación"**
- **Contexto**: cuando Master Layer está vacío (~90% de secciones), banner leve top de la ficha (R.1 §6.1).
- **Evidencia de tono**: `MetricsBlock` L108, `UnavailableBlock` docstring, mockup L1279.
- **Propuesta de copy** (D5, revisado al tono del codebase):
  > *"Estamos consolidando los datos de esta empresa · en cuanto el proveedor externo los entregue, esta sección se actualizará automáticamente."*
  - Versión larga (para el banner global): *"Datos en consolidación · algunas secciones aparecerán vacías temporalmente mientras el proveedor externo termina de consolidar la información. Se actualizarán automáticamente cuando estén disponibles."*
- **Escala al usuario**: sí — copy es tono editorial, no técnico.

#### **G5 · Sub-nav sticky intra-sección (Finanzas)**
- **Contexto**: R.2 (densidad Finanzas ~2000px scroll). Propuesto en D7: mini-nav sticky con anchors `Evolución · P&L · Balance · Ratios · Calidad · Solvencia`.
- **Evidencia**: grep `Tabs\|role="tablist"` en `src/**` = 0 hits. No existe primitiva Tabs en el DS. Sí existe el patrón `sticky top-[78px]` para la nav lateral y para el `DealPanel` (mockup L692/774/796). Anchor scroll ya usado por `EntitySectionWrapper.scroll-mt-24`.
- **Propuesta**: **(a) crear componente ligero `<FinanzasSubNav>` interno a Finanzas** (no primitiva DS) siguiendo el patrón visual de la nav lateral del mockup (pills con `data-active`, `bg-brand-primary/10 text-brand-primary` cuando activo, hover `bg-surface-muted`). Sticky bajo el header de sección con `sticky top-[128px]` (56 topbar + 72 section header). Anchors `#finanzas-evolucion`, `#finanzas-pl`, etc.
- **Alternativa**: (c) no introducir sub-nav; confiar en scroll natural. Riesgo: mala UX en viewport pequeño.
- **Escala al usuario**: sí. Es un elemento estructural nuevo. Recomendación E1: **(a)**.

---

### §7.5 · Cómo se traduce visualmente

Comparativa entre el mockup genérico "estilo dashboard" y el DS real de arroba.com:

#### Colores
- **Antes (mockup genérico)**: teals, purples, hex hardcoded, gradientes suaves multi-color.
- **Después (DS arroba)**: **rojo arroba `#E8001D`** como único acento cromático + neutrales cálidos (`#FAFAF8`, `#F4F4F0`, `#E8E8E2`) en light; **negro arroba `#0C0C0E`** + neutrales fríos (`#1A1A18`, `#2E2E2C`) en dark. Feedback bandas (`success/warning/danger/info`) sólo en estados, nunca decorativos. Los charts usan **rojo arroba** para la serie principal (revenue), `info` (azul) para la secundaria (ebitda), `text-muted` (gris) dasheado para la terciaria (net income).

#### Tipografía
- **Antes**: Inter/Roboto/system-ui genéricos, mismo peso.
- **Después**: **Space Grotesk** para h1-h4 (`--font-display`, jerarquía clara con display 72 / h1 36 / h2 28 / h3 22 / h4 18) · **DM Sans** para body (`--font-body`, 15px con leading 1.60) · **JetBrains Mono** para números tabulares y CIF (`--font-mono`, `tabular-nums`). Contraste inmediato de identidad.

#### Espaciados
- **Antes**: `p-3`, `p-4`, `p-6` con valores rem arbitrarios de Tailwind default.
- **Después**: **Todos los spacings son tokens `--space-N`** con valores px explícitos (`space-4 = 16px`, `space-6 = 24px`, `space-8 = 32px`). Tailwind config sobrescribe los defaults. Padding cards principales `p-6 md:p-8`. Gap entre bloques `gap-6` a `gap-10`.

#### Sombras y bordes
- **Antes**: `shadow-md`, `shadow-lg` liberalmente en cards.
- **Después**: **Cards por defecto SIN sombra**, sólo `border border-default` (border-only aesthetic). Sombra sólo aparece en hover de cards interactivas (`hover:border-emphasis`), en popovers (`shadow-md`), modales (`shadow-lg`) y dock (`shadow-xl`). Radios canónicos `rounded-2xl` (cards principales), `rounded-xl` (cards internos), `rounded-full` (chips y CTAs pill).

#### Comportamiento hover/active
- **Antes**: `hover:scale-105` genérico o cambios de color arbitrarios.
- **Después**: exclusivamente `hover:border-emphasis` en cards, `hover:bg-surface-muted` en botones ghost, `active:translate-y-[1px]` en botones primary. Cero scale. Cero shadow-jumps. Todo con `transition-colors duration-fast` (150ms).

#### Dark mode
- **Antes**: filtro inverso genérico.
- **Después**: **overrides quirúrgicos** en `[data-dark]` sólo de tokens semánticos (surface, text, border, feedback subtles). Brand + neutral ramp constantes. El rojo arroba es **el mismo** en light y dark; sólo el hover se calienta a `#FF1A35` en dark. Focus ring más pronunciado (32% opacity vs 22%).

#### Motion
- **Antes**: `transition-all` con duraciones arbitrarias.
- **Después**: transiciones sólo en propiedades específicas (`transition-colors`, `transition-opacity`, `transition-transform`). Duraciones tokenizadas `duration-fast/normal/slow`. Section pulse rojo sutil 700ms tras refresh (`animate-section-pulse`, define en `tailwind.config.ts` L156-170). Reduce-motion respetado automáticamente.

#### Identidad visual global
La ficha resultante deja de leerse como dashboard genérico y pasa a leerse como **producto arroba**: rojo cuando importa (CTAs, foco, evolución de ingresos), negro/blanco cálido en superficies, tipografía display con carácter (Space Grotesk), números mono impecables (JetBrains), spacing amplio (24-32px cards), border-only chrome sin sombras decorativas. Cualquier usuario reconoce arroba en 2 segundos.

---

## §8 · Checklist de aprobación

Antes de arrancar código B.6.f, el usuario debe aprobar expresamente:
- [ ] Layout 3-columnas reproducido tal cual (sin rediseño estructural).
- [ ] 4 KPIs del resumen: `Ingresos · EBITDA · Margen EBITDA · Empleados`. ¿Añadir un 5º? (candidato: `Crecimiento YoY`).
- [ ] Tablas PL/Balance multi-año con toggle 3-años / 5-años. ¿Preferís vista tarjeta compacta en lugar de tabla?
- [ ] Grid de ratios 3-columnas con tooltip hover de fórmula. ¿O prefiere accordion agrupado por categoría (`profitability`, `liquidity`, `solvency`, `efficiency`)?
- [ ] Sección `mercado`: se llama "Empresas similares" o "Comparables". Consenso: **Empresas similares** (evita colisión con Valuation Comparables).
- [ ] Mensaje de banner "datos en consolidación" cuando Master Layer vacío. ¿Copy sugerido OK?
- [ ] REQ codes finales: `REQ-012` (financials), `REQ-013` (balance), `REQ-014` (ratios), `REQ-015` (semantic), `REQ-016` (valuation), `REQ-017` (similar), `REQ-018` (opportunities). **Verificado sin colisión con los ya en uso** (`REQ-001..REQ-011`, ver §7 y evidencia en `entity/base/types.ts`, `components/entity/base/EntitySignals.tsx`, `backend/src/modules/companies/models.py`).
- [ ] **§7 Adaptación DS**: aprobación de gaps G1-G5 según recomendaciones (G1:b, G2:a, G3:b, G4 copy propuesto, G5:a).

---

_Fin del documento. Cualquier micro-decisión visual no cubierta se consulta al orquestador antes de tocar código (R11)._
