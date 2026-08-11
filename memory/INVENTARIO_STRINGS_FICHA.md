# Inventario de strings de cara al usuario · Ficha ARROBA v1

## Metadata

- **Fecha**: 2026-08-12.
- **Autor**: main agent E1 (Emergent) · sesión con user real product owner de arroba.com.
- **Objetivo**: base para canon de narrativa CF antes de reescritura de copy. Este documento **NO** propone redacción nueva · solo inventaría lo que hoy aparece en pantalla y clasifica el origen del texto.
- **Alcance**: `CompanyFichaLayoutV2.tsx` + subcomponentes hijos + `fichaMockupCss.ts` + helpers de formato. Cubre modo autenticado y anónimo.

## Convenciones de la tabla

- **Fuente**:
  - `BETA` · el frontend redacta el string (candidato a canon CF).
  - `INTEL` · passthrough puro del payload Intel (respeta R15; no debe reescribirse).
  - `COMPUESTA` · Beta compone frase con valores de Intel · **candidata a migrar a `narrative` de Intel** cuando se armonice el motor.
- **Categoría**:
  - `Título` (sec-h, h3, h5) · `Etiqueta` (label de row / campo) · `Scope` (contexto de comparación · Intel passthrough) · `Tooltip` (abbr) · `Estado` (Empty / Pending / caveat) · `Composición` (frase interpolada) · `Prosa` (texto libre).
- **Ubicación**: sección UI + testid o número de línea aproximado.
- **Notas**: caveat, if-branch o placeholder.

---

## 1. Hero (identidad ampliada + Veredicto + Contexto sectorial)

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| H1 | BETA | Título | `hero .t` | Resumen de compañía | — |
| H2 | INTEL | Prosa | `hero > p` | `identity.description ?? identity.objeto_social ?? financialAnalysis.identity.description ?? financialAnalysis.identity.objeto_social` | passthrough encadenado con 4 fallbacks · si todos null → `<Empty/>` |
| H3 | INTEL | Prosa | `hero > p` | `semantic.value_proposition` | passthrough · solo si presente |
| H4 | BETA | Título | Card Veredicto · h3 | Veredicto de ARROBA | — |
| H5 | INTEL | Prosa | `hero-verdict-value` | `finances.assessment.verdict` | passthrough puro Intel (resuelto 2026-08-11) |
| H6 | BETA | Estado | Card Veredicto · Empty | Información en preparación · Estamos consolidando este apartado. | fallback si `verdict==null` |
| H7 | BETA | Título | Widget contexto sectorial · label uppercase | Contexto sectorial | — |
| H8 | INTEL | Composición | `hero-sector-signal-trend` | Badge de `sector.trend_direction` con label CF (`Al alza` / `A la baja` / `Estable`) + arrow (↑↓→) | ⚠️ **COMPUESTA** · Beta traduce el enum `up/down/stable` a etiqueta CF · candidata a migrar a `narrative.trend_label` de Intel |
| H9 | COMPUESTA | Composición | `hero-sector-signal-yoy` | `YoY <b>{national_yoy_pct}%</b>` con signo + toLocaleString es-ES 1 decimal | Beta compone la frase; el valor viene de Intel |
| H10 | BETA + INTEL | Composición | `hero-sector-signal-driver` | `Impulsor principal · <b>{primary_driver}</b>` | ⚠️ `primary_driver` viene como slug técnico Intel (`activity`, `size`); Beta pega el label CF antes; candidato a `primary_driver_label` de Intel |
| H11 | INTEL | Composición | `hero-sector-signal-cnae` | `{cnae_label} · CNAE {cnae_code}` | passthrough Intel con formateo minor |

---

## 2. Rankings (sección independiente)

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| R1 | BETA | Título | `rankings-section .sec-h` | Posicionamiento sectorial y competitivo | — |
| R2 | BETA | Prosa | `rankings-section .sec-s` | Ranking por ingresos frente al universo Intel de comparables. | — |
| R3 | BETA | Título | h3 Percentil card | Percentil sectorial | — |
| R4 | BETA | Prosa | h3 Percentil `.cs` | Posición relativa por ingresos dentro del sector CNAE | — |
| R5 | BETA | Etiqueta | `rankings-percentile` row | Percentil | — |
| R6 | COMPUESTA | Composición | `rankings-percentile v` | `{sector_revenue_percentile}º` | Beta compone `{value}º`; valor Intel |
| R7 | BETA | Título | h3 Universo comparable | Universo comparable · mismo sector y banda de tamaño | — |
| R8 | INTEL | Scope | `rankings-market-position-scope` | `market_position.scope` (ej. `sector CNAE + banda de tamaño (0,3x–3x ingresos)`) | passthrough puro |
| R9 | COMPUESTA | Composición | `rankings-market-position v` | `#{rank} de {total}` | Beta compone; valores Intel |
| R10 | BETA | Título | h3 Local | Posición local · municipio | — |
| R11 | INTEL | Scope | `rankings-locality-position-scope` | `locality_position.scope` (ej. `municipio`) | passthrough puro |
| R12 | COMPUESTA | Composición | `rankings-locality-position v` | `#{rank} de {total}` | idem R9 |
| R13 | BETA | Título | h3 Lectura CF | Lectura CF | — |
| R14 | INTEL | Prosa | `rankings-explain-item-{i}` | `ranking.explain[i]` · bullet list literal Intel | passthrough puro (typical: "En el percentil 100 por ingresos de su sector") |
| R15 | BETA | Estado | Empty gated (anon) | Regístrate para acceder a **tu posición en el sector, la posición local y la lectura CF** | — |
| R16 | BETA | Estado | Empty ranking null | Posicionamiento en preparación | — |
| R17 | BETA | Estado | Empty row null | Sin datos | fallback si `rank/total` null |

---

## 3. Mercado

### 3.1 · Sector

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| M-S1 | BETA | Título | h3 sector | `Contexto sectorial · {cnae_label}` seguido de `<span>({cnae_code} · {cnae_level})</span>` | COMPUESTA con 3 valores Intel |
| M-S2 | BETA | Estado | caveat degraded | Cobertura Intel a nivel <b>{'división CNAE (2 dígitos)' si division, 'sección CNAE' si section}</b> — nivel más granular no disponible para este sector. | ⚠️ Beta compone caveat según `cnae_level`; ideal migrar a `sector.coverage_caveat` de Intel |
| M-S3 | BETA | Etiqueta | row size_score | Tamaño (size) | — |
| M-S4 | BETA | Etiqueta | row dynamism_score | Dinamismo | — |
| M-S5 | BETA | Etiqueta | row growth_score | Crecimiento | — |
| M-S6 | BETA | Etiqueta | row activity_score | Actividad | — |
| M-S7 | BETA | Etiqueta | row trend | Tendencia nacional | — |
| M-S8 | COMPUESTA | Composición | trend value | Badge `TrendBadge` + `{national_yoy_pct > 0 ? '+' : ''}{national_yoy_pct}% YoY` | idem H8+H9 |
| M-S9 | INTEL | Prosa | row signal | `sector.signal.replace(/_/g, ' ')` (ej. "sector contraction") | ⚠️ Beta desslug con regex; slug Intel · candidato a `signal_label` |
| M-S10 | INTEL | Prosa | row primary_driver | `sector.primary_driver` literal | idem H10 |
| M-S11 | BETA | Etiqueta | row active_companies | Empresas activas | — |
| M-S12 | BETA | Estado | Empty sector null | Contexto sectorial | via `<Empty label>` |

### 3.2 · Geo

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| M-G1 | BETA | Título | h3 geo | `Contexto territorial · {geo_name}` seguido de `<span>({geo_level})</span>` | COMPUESTA |
| M-G2..M-G4 | BETA | Etiqueta | rows | Tamaño (size) / Dinamismo / Crecimiento / Tendencia | idem sector |
| M-G5 | INTEL | Prosa | row signal | `geo.signal.replace(/_/g, ' ')` | idem M-S9 |
| M-G6 | BETA | Etiqueta | row active_companies | Empresas activas | — |
| M-G7 | BETA | Etiqueta | row net_creation | Creación neta de empresas | — |
| M-G8 | COMPUESTA | Composición | net_creation value | `{value > 0 ? '+' : ''}{fmtNum(value)}` | Beta compone signo |
| M-G9 | BETA | Estado | Empty geo null | Contexto territorial | via `<Empty label>` |

### 3.3 · Concentración

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| M-C1 | BETA | Título | h3 concentration | Concentración de mercado (HHI) `<span>Nivel: {level}</span>` | COMPUESTA · `level` Intel |
| M-C2 | BETA | Estado | badge degraded | Concentración calculada con muestra parcial (universo insuficiente para nivel más granular). | ⚠️ Beta compone; candidato a `concentration.degraded_label` |
| M-C3 | BETA | Etiqueta | row HHI | HHI | — |
| M-C4 | INTEL | Prosa | row concentration_label | `concentration_label.replace(/_/g, ' ')` (ej. "highly concentrated") | ⚠️ Beta desslug; ideal `label_es` |
| M-C5 | BETA | Etiqueta | row market_actors_count | Actores en el mercado | — |
| M-C6 | BETA | Etiqueta | row total_companies_in_universe | Empresas en el universo | — |
| M-C7 | INTEL | Prosa | caveat literal | `concentration.degraded_reason ?? concentration.caveat` | passthrough puro |
| M-C8 | INTEL | Prosa | metodología pie | `concentration.hhi_methodology` | passthrough puro |
| M-C9 | BETA | Estado | Empty concentration null | Concentración de mercado | via `<Empty label>` |

### 3.4 · Posición (gated anon)

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| M-P1 | BETA | Título | h3 position | Posición de la empresa en el sector | — |
| M-P2 | BETA | Etiqueta | row percentile | Percentil sectorial (ingresos) | — |
| M-P3 | COMPUESTA | Composición | percentile value | `{value}º` | idem R6 |
| M-P4 | INTEL | Scope | row market_position | `market_position.scope ?? 'Universo comparable'` | passthrough + fallback beta |
| M-P5 | INTEL | Scope | row locality_position | `locality_position.scope ?? 'Posición local'` | idem |
| M-P6 | BETA | Estado | Gate anon (`mercado-position-gated`) | Regístrate para acceder a **tu posición en el sector, la posición local y la lectura CF** | — |

### 3.5 · Mercado meta

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| M-M1 | BETA | Título | `mercado-section .sec-h` | Contexto sectorial y territorial | — |
| M-M2 | BETA | Prosa | `mercado-section .sec-s` | Sector CNAE, territorio, concentración de mercado y posición competitiva. | — |
| M-M3 | BETA | Estado | Empty market null | Contexto sectorial en preparación | via `<Empty label>` |

---

## 4. Finanzas

### 4.1 · Meta

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| F-M1 | BETA | Título | `.sec-h` | Finanzas | — |
| F-M2 | BETA | Prosa | `.sec-s` | Cuenta de resultados, balance y ratios — de la vista ejecutiva al detalle contable. | — |
| F-M3 | BETA | Etiqueta | tabs | Cuenta de resultados · Balance · Flujos de efectivo · Ratios · Indicadores financieros · Scores de inteligencia · Evolución financiera | 7 tabs literal beta |
| F-M4 | BETA | Etiqueta | slider label | Nivel de detalle | — |

### 4.2 · Cuenta de resultados / Balance

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| F-P1 | BETA | Título | h3 | Cuenta de resultados / Balance | — |
| F-P2 | BETA | Prosa | .cs | Arrastra "Nivel de detalle" para desplegar más partidas | — |
| F-P3 | INTEL | Etiqueta | rows P&L / Balance | `row.label` · nombre partida contable literal Intel | passthrough (Ingresos, EBITDA, Resultado neto, Activo, PN, etc.) |
| F-P4 | INTEL | Composición | valores rows | `fmtEUR(value)` con `format` Intel (EUR nativo o miles/millones) | Beta formatea con Intl es-ES |

### 4.3 · Cash Flow

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| F-CF1 | BETA | Título | h3 | Estado de flujos de efectivo | — |
| F-CF2 | BETA | Prosa | .cs | Fuente: cuentas depositadas (PGC) · flujos por actividad y resumen (FCF, conversión de caja). | — |
| F-CF3 | INTEL | Etiqueta | rows | `operating_activities`, `investing_activities`, `financing_activities`, `free_cash_flow`, `net_change_in_cash`, `cash_conversion` | ⚠️ slugs Intel · Beta traduce a etiquetas CF ("Actividades de explotación", etc.) → **COMPUESTA · candidata a `narrative.cash_flow_labels`** |
| F-CF4 | BETA | Estado | Empty | Estado de flujos de efectivo | via `<Empty label>` |

### 4.4 · Ratios

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| F-R1 | BETA | Título | h3 | Ratios | — |
| F-R2 | BETA | Prosa | .cs | Valor · percentil sectorial. Pasa el ratón por cada ratio para su definición. | — |
| F-R3 | INTEL | Etiqueta | ratios labels | `ratio.label` · nombre CF Intel (EBITDA margin, ROA, ROE, etc.) | passthrough Intel |
| F-R4 | INTEL | Composición | valor + percentil | `{value}%` / `{percentile}º pctl` | Beta compone formato |
| F-R5 | INTEL | Tooltip | abbr tooltip | `ratio.tooltip` literal Intel (ej. "Beneficio antes de intereses, impuestos, depreciación y amortización.") | passthrough |

### 4.5 · Indicadores financieros / Scores / Evolución

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| F-K1 | BETA | Título | h3 | Indicadores financieros / Scores de inteligencia | — |
| F-K2 | BETA | Prosa | .cs | Valor y variación vs año anterior. Pasa el ratón por cada tarjeta para ver la definición. | — |
| F-K3 | BETA | Prosa | .cs | Comparativa contra el universo sectorial y territorial | — |
| F-E1 | BETA | Título | h3 | Evolución financiera | — |
| F-E2 | BETA | Prosa | .cs | `Facturación y <abbr>EBITDA</abbr> · {evo.years[0]}–{evo.years[N-1]}` | COMPUESTA |

### 4.6 · Lectura financiera (Quality)

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| F-Q1 | BETA | Título | h3 | Lectura financiera de ARROBA | — |
| F-Q2 | BETA | Prosa | .cs (pie score) | de 100 · calidad financiera | — |
| F-Q3 | INTEL | Prosa | assessment | `financial_quality.assessment` literal | passthrough |
| F-Q4 | INTEL | Prosa | strengths bullets | `financial_quality.strengths[]` literal | passthrough |
| F-Q5 | INTEL | Prosa | weaknesses bullets | `financial_quality.weaknesses[]` literal | passthrough |
| F-Q6 | INTEL | Prosa | risks bullets | `financial_quality.risks[]` literal | passthrough |

---

## 5. Valoración

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| V1 | BETA | Título | `.sec-h` | Valoración | — |
| V2 | BETA | Prosa | `.sec-s` | Aproximación de valor por múltiplos comparables. Estimación orientativa, no una valoración formal. | — |
| V3 | BETA | Título | h3 | Valoración cualitativa de ARROBA / Enterprise Value / Escenarios | — |
| V4 | BETA | Tooltip | abbr | Valor de la empresa: equity + deuda neta. Métrica de compra teórica. | tooltip beta |
| V5 | INTEL | Composición | rangos | `fmtEUR(low)` – `fmtEUR(high)` | Beta compone rangos con valores Intel |
| V6 | INTEL | Prosa | metodologia (retirada tras Turno D) | — | passthrough retirado 2026-08 · fallback `<Empty/>` |
| V7 | INTEL | Prosa | benchmark (retirada) | — | idem V6 |

---

## 6. Señales (`senales-section`)

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| S1 | BETA | Título | `.sec-h` | Cambios relevantes | — |
| S2 | BETA | Prosa | `.sec-s` | Hechos y eventos que Arroba ha detectado y que hacen a la compañía más (o menos) atractiva para una operación. | — |
| S3 | INTEL | Prosa | signal.title / explanation | `signal.explanation` literal | passthrough HARDENING-007 |
| S4 | INTEL | Prosa | signal.evidence | `signal.evidence.*` literal | passthrough |
| S5 | BETA | Estado | Empty | Sin señales relevantes | fallback beta |

---

## 7. Gobierno

### 7.1 · Meta

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| G-M1 | BETA | Título | `.sec-h` | Gobierno | — |
| G-M2 | BETA | Prosa | `.sec-s` | Órgano de administración y apoderamientos vigentes según registros públicos. | — |

### 7.2 · Aggregated (anon)

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| G-A1 | BETA | Título | h3 | Composición del órgano | — |
| G-A2 | COMPUESTA | Composición | .cs | Vista agregada por cargo · `{total}` personas físicas identificadas en fuentes registrales | Beta compone |
| G-A3 | BETA | Etiqueta | th | Cargo · Personas | — |
| G-A4 | COMPUESTA | Composición | role_label | Backend `_GOVERNANCE_ROLE_ES` mapa i18n (Administrador Solidario / Apoderado / Auditor / etc.) | ⚠️ **COMPUESTA** en backend Arroba · candidata a `narrative.governance_role_labels_es` de Intel |
| G-A5 | BETA | Prosa | disclosure | Los nombres nominales están disponibles para usuarios registrados. | — |

### 7.3 · Nominal (auth)

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| G-N1 | BETA | Título | h3 | Cargos vigentes | — |
| G-N2 | COMPUESTA | Composición | .cs | `{n} personas físicas · fuentes registrales verificadas` | Beta compone |
| G-N3 | BETA | Etiqueta | th | Nombre · Cargo · Desde | — |
| G-N4 | INTEL | Prosa | officer.name / role | passthrough puro | — |
| G-N5 | COMPUESTA | Composición | since / year | `fmtDate(since)` o `String(year)` fallback | Beta compone |

### 7.4 · Empty

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| G-E1 | BETA | Estado | Empty | Órgano de administración | via `<Empty label>` |

---

## 8. Ownership

### 8.1 · Meta

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| O-M1 | BETA | Título | `.sec-h` | Estructura accionarial y control | — |
| O-M2 | BETA | Prosa | `.sec-s` | Accionariado y estructura de control según fuentes registrales. | — |

### 8.2 · Aggregated (anon)

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| O-A1 | BETA | Título | h3 | Vista agregada | — |
| O-A2 | BETA | Prosa | .cs | Datos no identificativos · el detalle nominal se muestra a usuarios registrados | — |
| O-A3 | BETA | Etiqueta | rows | Accionistas registrados · Estructura de control · Participación del accionista mayoritario | — |
| O-A4 | INTEL | Prosa | tier value | `summary.tier` literal Intel (ej. "Control mayoritario") | passthrough |
| O-A5 | COMPUESTA | Composición | top1_pct | `fmtPct(value)` con toLocaleString es-ES 2 decimales | Beta formato |
| O-A6 | BETA | Prosa | CTA login | Iniciar sesión para ver el detalle nominal completo. | — |

### 8.3 · Nominal (auth)

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| O-N1 | BETA | Título | h3 Control | Control | — |
| O-N2 | BETA | Prosa | .cs | Vector principal de control según el último ejercicio disponible | — |
| O-N3 | BETA | Etiqueta | rows | Accionista controlador · Accionista mayoritario · Participación mayoritaria · Nivel de control | — |
| O-N4 | INTEL | Prosa | values | `control.controlling_shareholder / top1_name / top1_pct / tier` literales | passthrough |
| O-N5 | BETA | Título | h3 Accionistas | Accionistas | — |
| O-N6 | COMPUESTA | Composición | .cs | `{n} accionista{s?} registrado{s?} · ordenados por participación descendente` | Beta compone plurales |
| O-N7 | BETA | Etiqueta | th | Nombre · CIF/NIF · Participación · Ejercicio | — |
| O-N8 | INTEL | Prosa | shareholder values | passthrough (name, cif, pct, as_of_year) | — |
| O-N9 | BETA | Estado | Empty | Accionistas | via `<Empty label>` |

### 8.4 · Empty

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| O-E1 | BETA | Estado | Empty | Estructura accionarial | via `<Empty label>` |

---

## 9. Events (BORME)

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| E1 | BETA | Título | `.sec-h` | Eventos societarios y BORME | — |
| E2 | BETA | Prosa | `.sec-s` | Cronología de hechos registrales publicados en el Boletín Oficial del Registro Mercantil. | — |
| E3 | BETA | Estado | Empty title | Eventos registrales no disponibles | — |
| E4 | BETA | Estado | Empty pie | Información en preparación. | — |
| E5 | INTEL | Prosa | ev.type | `event.type ?? 'Evento registral'` | passthrough + fallback beta |
| E6 | INTEL | Prosa | ev.extract | `event.extract` literal | passthrough |
| E7 | COMPUESTA | Composición | pie BORME | `BORME · {section} · {province}` | Beta compone |

---

## 10. Identidad ampliada (4 subgrupos)

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| I-M1 | BETA | Título | h3 | Identificación registral y societaria | — |
| I-M2 | BETA | Prosa | .cs | Datos registrales, domicilio, capital y estado de cotización | — |
| I-M3 | BETA | Título | h5 uppercase | Registro / Domicilio / Capital y plantilla / Cotización | 4 subgrupos |
| I-R1 | BETA | Etiqueta | rows Registro | Razón social · CIF/NIF · Forma jurídica · Estado mercantil · Situación de actividad · Fecha de constitución · Estado del registro | 7 labels beta |
| I-D1 | BETA | Etiqueta | rows Domicilio | Dirección · Código postal · Municipio · Provincia · Comunidad autónoma · País | 6 labels |
| I-C1 | BETA | Etiqueta | rows Capital | Capital social · Empleados totales · Rango de plantilla | 3 labels |
| I-K1 | BETA | Etiqueta | rows Cotización | Estado de cotización · Mercado · Ticker | 3 labels |
| I-K2 | BETA | Composición | is_listed value | `fmtYesNo(is_listed)` → "Cotizada" / "No cotizada" | ⚠️ COMPUESTA · Beta traduce booleano; candidato a `identity.listed_label_es` |
| I-V1 | INTEL | Prosa | values | passthrough puro Intel de cada campo populated | — |
| I-V2 | BETA | Estado | fallback null | En preparación | inline italic beta |

---

## 11. Deuda desglosada

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| D1 | BETA | Título | h3 | Estructura de deuda | — |
| D2 | COMPUESTA | Composición | .cs | Deuda por horizonte temporal · fuente: cuentas depositadas`{year ? ' · ejercicio '+year : ''}` | Beta compone |
| D3 | BETA | Etiqueta | th | Concepto · `{year ?? 'Último ejercicio'}` | Beta fallback si year null |
| D4 | BETA | Etiqueta | rows | Deuda a corto plazo · Deuda a largo plazo · Deuda financiera total | 3 labels beta |
| D5 | INTEL | Composición | values | `fmtEUR(st_debt / lt_debt / financial_debt)` | Beta formato · valor Intel |
| D6 | BETA | Estado | inline null | En preparación | italic beta |
| D7 | BETA | Estado | Empty global | Desglose de deuda en preparación | fallback si 3 null |

---

## 12. NAV items y estados globales

### 12.1 · NAV items (16 total)

| # | Fuente | Categoría | Texto actual | Notas |
| :- | :----- | :-------- | :----------- | :---- |
| N1..N16 | BETA | Etiqueta | Resumen · Finanzas · Valoración · Propiedad · Gobierno · Mercado · Rankings · Comparativa · Cambios relevantes · Oportunidades · Comité de inversión · Sucesión · Sector & Roll-up · Eventos y BORME · Registros públicos · Documentos | Todos labels beta |
| N17 | BETA | Etiqueta | grp headers | Perfil · Inteligencia · Fuentes | 3 grupos |

### 12.2 · Estados globales · CTA

| # | Fuente | Categoría | Ubicación | Texto actual | Notas |
| :- | :----- | :-------- | :-------- | :----------- | :---- |
| GX1 | BETA | Composición | `<Pending label>` | `Información en preparación · {label}` | Beta compone con label |
| GX2 | BETA | Prosa | `<Pending>` pie | Estamos consolidando este apartado. | — |
| GX3 | BETA | Prosa | `<Empty>` sin label | Información en preparación · Estamos consolidando este apartado. | idem GX1+GX2 fallback |
| GX4 | BETA | Composición | `<Gate what>` heading | Accede al `{what}` | Beta compone |
| GX5 | BETA | Prosa | `<Gate>` pie | Vuelve a intentarlo en unos minutos. | ⚠️ copy revisar (no aplica a Gate; puede ser copy-paste de un Retry) |
| GX6 | BETA | Prosa | Chat/copilot | Pregunta al copilot… | placeholder input |
| GX7 | BETA | Etiqueta | Chat botón | Enviar | — |
| GX8 | BETA | Etiqueta | Header controls | Compartir · Adjuntar | 2 botones |
| GX9 | BETA | Etiqueta | Quality Score card | Quality Score | (composición KPI) |
| GX10 | BETA | Etiqueta | KPI innovation | (aún null) | `kpi-innovation-pending` |

---

## Resumen ejecutivo

### Recuento total

| Fuente | # Strings inventariados | % del total |
| :----- | :---------------------- | :---------- |
| **BETA** (frontend redacta) | ~112 | ~63% |
| **INTEL** (passthrough puro) | ~34 | ~19% |
| **COMPUESTA** (Beta compone con valor Intel) | ~32 | ~18% |
| **Total** | **~178** | 100% |

_Nota: recuento aproximado · cada entrada de la tabla puede cubrir 1-5 strings visibles (labels de row, etc.). El desglose fino requiere iteración manual UI cuando se aborde la reescritura._

### Highlights para el canon CF futuro

**Strings BETA que deben pasar por canon CF nuevo** (prioridad alta):
- Todos los títulos de sección (`.sec-h`) y de card (`h3`) — 30+ strings.
- Todas las descripciones de sección (`.sec-s`) — 12 strings.
- Todas las etiquetas de row (`.k`) — 60+ strings.
- Estados `Empty` con y sin label — 20+ strings.
- CTAs `Gate` / `Pending` compuestas.

**Strings COMPUESTA candidatos a migrar a `narrative` de Intel** (prioridad alta · reduce mantenimiento Beta):
- H8 · Trend labels ES (`Al alza` / `A la baja` / `Estable`) desde `sector.trend_direction` — hoy en `TrendBadge`.
- H10 · `primary_driver` slug → label ES ("activity" / "size" / etc.).
- M-S9, M-G5 · `signal` slug → label CF (`sector_contraction` → "Contracción sectorial", etc.).
- M-C4 · `concentration_label` slug → label CF.
- M-S2, M-C2 · Caveats de degradación cobertura.
- F-CF3 · Etiquetas categorías cash flow (`operating_activities` → "Actividades de explotación").
- I-K2 · `is_listed` booleano → "Cotizada" / "No cotizada".
- G-A4 · `_GOVERNANCE_ROLE_ES` mapa i18n en backend Arroba.

**Strings INTEL passthrough puro · NO tocar** (respetan R15):
- H5 · `finances.assessment.verdict`.
- H2/H3 · `identity.description` / `objeto_social` / `semantic.value_proposition`.
- R14 · `ranking.explain[]` bullets.
- F-Q3..F-Q6 · `financial_quality.{assessment, strengths, weaknesses, risks}`.
- S3, S4 · `signal.explanation` / `evidence`.
- M-C7, M-C8 · `concentration.{caveat, degraded_reason, hhi_methodology}`.
- E5, E6 · `event.type` / `event.extract`.

### Recomendación explícita

1. **Fase 1 (canon CF Beta)**: reescritura de los ~112 strings BETA para dotar la ficha de tono corporate finance sobrio uniforme. Sprint dedicado. Sin dependencia de Intel.
2. **Fase 2 (armonización COMPUESTA → Intel)**: emitir REQ-INTEL agregado que pida ~10-12 campos `*_label` / `*_label_es` para eliminar la traducción manual Beta (allowlist de enums). Cierra el legacy de mapas i18n en el frontend y el `_GOVERNANCE_ROLE_ES` en backend.
3. **Fase 3 (validación INTEL)**: peinar los ~34 strings passthrough para confirmar que Intel emite en el tono CF esperado. Si algún string Intel es débil en tono (ej. `assessment` demasiado template), coordinar con Intel para reescritura de la fuente, NO cablear reescritura Beta (violaría R15).

---

## Pendientes de confirmación

- **Recuento exacto**: aproximación · una iteración manual daría número exacto ±5%.
- **Cobertura de subcomponentes CopilotChat, Adjuntar, Compartir**: parciales; requiere inspección directa si se abordan como sección.
- **Copy del `<Gate>` GX5** ("Vuelve a intentarlo en unos minutos") posiblemente sea copy-paste erróneo (aplica más a un Retry/Error que a un Gate registro). Recomendación: revisar en fase 1.
