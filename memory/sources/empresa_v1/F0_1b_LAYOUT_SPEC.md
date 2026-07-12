# Sprint F0.1b · Especificación técnica del layout canónico

Documento vivo. Fuente única: el ZIP en `/app/memory/sources/empresa_v1/empresa_html/design_handoff_empresa/`.
Renderizado como referencia: `http://127.0.0.1:8765/Empresa.html` (SimpleHTTP local).
Fecha: 2026-07-06.

## 1 · Árbol JSX del shell

```
<div>                                     ← Root único (min-height: 100vh · background: var(--bg))
├── <nav data-role="topbar">              ← [1] Topbar global · sticky top:0 z:300 h:72
│   ├── <a data-role="logo"><img h=55/></a>
│   ├── <div data-role="topbar-menu" flex gap=4>
│   │   ├── <a> Analiza (activo · fw 700)
│   │   ├── <a> Valora
│   │   └── <a> Compra-Vende
│   ├── <div flex-1/>                    ← spacer
│   ├── <button data-role="theme-toggle" 34x34/>
│   └── <div data-role="avatar" 32x32/>
│
├── <div data-role="company-header">      ← [2] bg var(--surface-2) · sin border-bottom
│   └── <div data-role="ch-container">    ← max-width: min(1760px, 95vw) · mx-auto · padding 20px 28px
│       ├── <div data-role="breadcrumb"   ← fs 12.5 · mb 14
│       │        flex align-center gap=6>
│       │   Analizar / Empresas / Grupo Olmedo Hoteles
│       ├── <div data-role="ch-row-1"     ← flex justify-between gap=20
│       │        flex align-start>
│       │   ├── <div flex align-center gap=20>
│       │   │   ├── <div data-role="ch-avatar"/>     52x52 · gradient · fw 900
│       │   │   └── <div>
│       │   │       ├── <h1 flex-inline gap=8 fs=28 fw=900>
│       │   │       │   Grupo Olmedo Hoteles · commercial · Verificada · Auditada
│       │   │       └── <sub fs=13 mt=8 muted>
│       │   │           legal-name · CIF · sector · location · web
│       │   └── <div data-role="ch-actions" flex gap=6>
│       │       ├── button "Guardar"
│       │       ├── button "Seguir"
│       │       └── button "⋯"
│       └── <div data-role="ch-row-2"     ← flex align-center gap=20 mt=18 pt=18 · borderTop 1
│                flex>
│           ├── <div data-role="ch-oportunidades" flex gap=8 flex-1>
│           │   ⨁OPORTUNIDADES · ✓Buy&Build · ✓Captación · ✓Entrada de socio
│           └── <div data-role="ch-cta" flex gap=8>
│               ├── button "+ Activar oportunidad" (red primary)
│               └── button "Reclamar empresa" (outline)
│
├── <div data-role="deal-banner">         ← [3] bg #e8001d · color white · h ~47
│   └── <div max-width min(1760,95vw) mx-auto padding 9 28 flex gap=13 flex-wrap>
│       ├── <span> ⚫ EN VENTA
│       ├── <span> Proceso de venta activo · esta compañía tiene…
│       └── <button ml-auto> Ver acciones →
│
├── <div data-role="main-grid">           ← [4] max-width min(1760,95vw) mx-auto · padding 24 28 80
│                                             display: grid
│                                             grid-template-columns: 210px minmax(0px, 1fr) 360px
│                                             gap: 32px
│   ├── <nav data-role="section-nav">     ← [4A] sticky top:78
│   │   ├── <div mb=18>                   ← grupo "PERFIL"
│   │   │   ├── <div uppercase fs=11 muted mb=8>PERFIL
│   │   │   ├── <a data-item="resumen"> ⚡Resumen (activo · pill primary bg)
│   │   │   ├── <a data-item="finanzas"> Finanzas
│   │   │   ├── <a data-item="valoracion"> Valoración
│   │   │   ├── <a data-item="propiedad"> Propiedad
│   │   │   ├── <a data-item="gobierno"> Gobierno
│   │   │   ├── <a data-item="mercado"> Mercado
│   │   │   ├── <a data-item="ranking"> Rankings
│   │   │   └── <a data-item="comparativa"> Comparativa
│   │   ├── <div mb=18>                   ← grupo "INTELIGENCIA"
│   │   │   ├── <div uppercase fs=11 muted mb=8>INTELIGENCIA
│   │   │   ├── <a data-item="senales"> Señales
│   │   │   └── <a data-item="oportunidades"> Oportunidades
│   │   └── <div mb=18>                   ← grupo "FUENTES"
│   │       ├── <div uppercase fs=11 muted mb=8>FUENTES
│   │       ├── <a data-item="registros"> Registros públicos
│   │       └── <a data-item="documentos"> Documentos
│   │
│   ├── <div data-role="content" min-width:0>  ← [4B] Columna central
│   │   └── <div flex flex-col gap=18>
│   │       ← Renderiza SECTIONS[section]
│   │       ← Para "resumen" (default): SecResumen()
│   │       ├── Card "Resumen de compañía"   (COMP-P-0001)
│   │       ├── Card "Evolución financiera"  (COMP-P-0002 · pero es card con chart + CAGRs)
│   │       ├── Grid 4 KPIs primarios        (COMP-P-0003)
│   │       ├── Grid 4 KPIs posicionamiento  (COMP-P-0004)
│   │       ├── Grid "Identificación" 4-col  (COMP-P-0005)
│   │       └── Grid "Scores inteligencia"   (COMP-P-0006)
│   │
│   └── <div data-role="deal-panel">      ← [4C] sticky top:78 align-self:start
│                                             flex-col gap=16
│                                             max-height: calc(100vh - 96px)
│       ├── <select> Escenario · demo (En venta / …)
│       ├── <div data-role="dp-active-op"> Card "OPERACIÓN ACTIVA" con En venta
│       ├── <div data-role="dp-process">   Card "PROCESO" con timeline vertical
│       └── <div data-role="dp-actions">   Card "ACCIONES" con 3 botones (Descargar NDA · Solicitar cuaderno · Hacer match)
│
└── <div data-role="composer">            ← [5] Composer flotante (arroba-composer.js)
    ← Script global window.ArrobaComposer
    ← Se monta como un floating widget (posición fixed bottom)
```

## 2 · Grid principal y espaciados

| Elemento | Valor exacto CSS |
|---|---|
| Body/Root `background` | `var(--bg)` (design token) |
| Topbar height | `72px` |
| Topbar `position` | `sticky; top: 0; z-index: 300` |
| Topbar `backdrop-filter` | `blur(14px)` |
| Topbar `background` | `color-mix(in srgb, var(--bg) 88%, transparent)` |
| Topbar `border-bottom` | `1px solid var(--border)` |
| Company header `background` | `var(--surface-2)` |
| Company header container `max-width` | `min(1760px, 95vw)` |
| Company header container `padding` | `20px 28px` |
| CH row-1 `gap` | `20px` |
| CH avatar | `52x52 · border-radius 12` |
| H1 font-size | `28px · fw 900` |
| Sub-line font-size | `13px · muted` |
| Row 2 `margin-top` | `18px` |
| Row 2 `padding-top` | `18px` |
| Row 2 `border-top` | `1px solid var(--border)` |
| Deal banner `background` | `#e8001d` |
| Deal banner container `padding` | `9px 28px` |
| Main-grid container `max-width` | `min(1760px, 95vw)` |
| Main-grid container `padding` | `24px 28px 80px` |
| Main-grid `display` | `grid` |
| Main-grid `grid-template-columns` | `210px minmax(0px, 1fr) 360px` |
| Main-grid `gap` | `32px` |
| Section-nav `position` | `sticky; top: 78px` |
| Content column `gap` | `18px` (vertical entre cards) |
| Deal-panel `position` | `sticky; top: 78px; align-self: start` |
| Deal-panel `flex-direction` | `column` |
| Deal-panel `gap` | `16px` |
| Deal-panel `max-height` | `calc(100vh - 96px)` |

## 3 · Design tokens (var(--*))

Definidos en `<style>` de `Empresa.html` (fuente única):

```css
:root {
  --bg: #F7F5F0;
  --surface: #FFFFFF;
  --surface-2: #F1EEE7;   /* company header bg */
  --text: #101010;
  --text-muted: #6B6B6B;
  --border: rgba(0,0,0,0.08);
  --brand-red: #E8001D;
  --brand-red-dark: #C0001A;
  --brand-green: #16A34A;
  --brand-blue: #1E40AF;
}
```

(El ZIP también soporta modo oscuro alternando `data-theme`, pero no lo replicamos en F0.1b.)

## 4 · Comportamiento sticky / floating

- **Topbar**: sticky top 0, backdrop-filter blur.
- **Section-nav (sidebar izq)**: sticky top 78 (= 72 topbar + 6 margen).
- **Deal-panel (col derecha)**: sticky top 78 · align-self start · max-height calc(100vh - 96px) → scroll interno si desborda.
- **Content column**: fluye normal.
- **Composer**: floating fixed (bottom · script `assets/arroba-composer.js` inserta un widget flotante).

## 5 · Placeholder de secciones no-resumen

`SECTIONS[section]` (según `ce-app.jsx`):

| section | Componente ZIP | Estado en F0.1b |
|---|---|---|
| `resumen` (default) | `SecResumen` (~6 sub-bloques) | REEMPLAZAR por `<CompanyPerfil>` existente (COMP-P-0001..0006) |
| `finanzas` | `SecFinanzas` (`ce-finanzas.jsx`) | Placeholder `UnavailableBlock` con altura equivalente |
| `valoracion` | `SecValoracion` | Placeholder |
| `propiedad` | `SecPropiedad` | Placeholder |
| `gobierno` | `SecGobierno` | Placeholder |
| `mercado` | `SecMercado` | Placeholder |
| `ranking` | `SecRanking` | Placeholder |
| `comparativa` | `SecComparativa` (`ce-comparativa.jsx`) | Placeholder |
| `senales` | `SecSenales` | Placeholder |
| `oportunidades` | `SecOportunidades` | Placeholder |
| `registros` | `SecRegistros` | Placeholder |
| `documentos` | `SecDocumentos` | Placeholder |

En F0.1b sólo `resumen` es interactivo (contiene COMP-P-0001..0006). Los demás se marcan visualmente inactivos en el section-nav y su `content` renderiza un `UnavailableBlock` a pantalla completa dentro de la columna central.

## 6 · Integración de COMP existentes en el nuevo shell

| Slot del ZIP | Componente arroba existente |
|---|---|
| Topbar (logo + menu + toggle + avatar) | **NUEVO** en `layout/CompanyTopbar.tsx` — sólo estructura visual, no interactivo más allá de linkear a `/analiza`, `/valora`, `/compra-vende` |
| Company header row 1 (izquierda) | `header/CompanyIdentity.tsx` **existente** COMP-1001 |
| Company header row 1 (derecha) | `header/CompanyQuickActions.tsx` **existente** COMP-1004 (versión "3 botones" del ZIP · botones ya disabled). Se reduce el set a 3 (Guardar · Seguir · ⋯) para respetar el ZIP |
| Company header row 1 · badges (Verificada · Auditada) | Ya dentro de COMP-1001 (Verificada) + COMP-1003 (Auditada quedará como stub — no expuesto) |
| Company header row 1 · sub-line | `header/CompanyContext.tsx` **existente** COMP-1002 |
| Company header row 2 (Oportunidades chips + CTAs) | **NUEVO** en `layout/CompanyOpportunityRow.tsx` — 4 chips + 2 CTAs. `UnavailableBlock` embebido si no hay datos de oportunidades |
| Deal banner top (rojo) | **NUEVO** en `layout/CompanyDealBanner.tsx` — placeholder estructural (contradicción C7 · Deal Panel sin COMP-ID en ACC) |
| Section-nav (sidebar izq) | **NUEVO** en `layout/CompanySectionNav.tsx` — 3 grupos con 12 items. Sólo `resumen` es activo. Los demás son links de navegación estilizados según ZIP |
| Content column · resumen | `perfil/CompanyPerfil.tsx` **existente** (6 COMP-P) |
| Content column · KPIs primarios | Ya dentro de `perfil/CompanyPerfil.tsx` (COMP-P-0003) |
| Content column · Identificación | Ya dentro de `perfil/CompanyPerfil.tsx` (COMP-P-0005) |
| Executive Snapshot COMP-1005 (KPIs del Header en F0.1) | **QUITAR del Header**. El ZIP no muestra KPIs en el Header — los KPIs viven en el Perfil (COMP-P-0003). COMP-1005 se mantiene en el registro como stub `UnavailableBlock` inline (o se oculta del layout hasta que ACC v0.2 lo formalice como bloque distinto) |
| COMP-1010 User Relationship | Fuera del layout visible. Su stub `UnavailableBlock` no aparece en el ZIP — se anida dentro del bloque "Acciones" del Deal Panel |
| Deal Panel derecho (Operación activa · Proceso · Acciones) | **NUEVO** en `layout/CompanyDealPanel.tsx` — 3 sub-cards. Cada card usa `UnavailableBlock` cuando el motor asociado no está disponible (Deal engine no expuesto V2 · C7) |
| Composer flotante | **NUEVO** en `layout/CompanyComposerStub.tsx` — floating widget rojo circular en `bottom-right`. Stub visual sin interacción |

## 7 · Regla R14 y contenedores

Los siguientes archivos son **contenedores de layout** (no cuentan como COMP del ACC · exentos R14 según el guard existente):

- `layout/CompanyTopbar.tsx`
- `layout/CompanyOpportunityRow.tsx`
- `layout/CompanyDealBanner.tsx`
- `layout/CompanySectionNav.tsx`
- `layout/CompanyDealPanel.tsx`
- `layout/CompanyComposerStub.tsx`
- `layout/CompanyFichaLayout.tsx` (shell principal)
- `header/CompanyHeader.tsx` **queda deprecado** (será eliminado o vaciado — su función pasa al nuevo layout)

Se actualiza el guard R14 para añadir estos paths a `LAYOUT_CONTAINERS`.

## 8 · Fidelidad al ZIP (criterio de aceptación)

- Los estilos inline literales del ZIP (`style={{...}}`) se traducen a Tailwind + tokens equivalentes.
- Cuando Tailwind no cubra un token exacto (ej. `min(1760px, 95vw)`), se usa `style={{}}` inline en el JSX para reproducir literal.
- El grid `210px minmax(0,1fr) 360px` NO se aproxima con clases Tailwind (`grid-cols-[210px_minmax(0,1fr)_360px]` funciona en JIT). Se aplica tal cual.
- Todos los tokens `var(--*)` se replican en `tokens.css` (o se añaden si faltan).
