# arroba.com — Design System v1.0.0

> **5ª capa canónica del proyecto.** Ver [`ARROBA_PHILOSOPHY.md` §13](./ARROBA_PHILOSOPHY.md).
> Última actualización: 2026-06-24 (E1.5.5 — canonización).
>
> **Regla de oro**: si hay conflicto entre este documento y la implementación, **gana este documento**. El código se actualiza para alinearse, no al revés.
>
> Este documento describe **qué** (tokens, componentes, patrones). El **por qué** estratégico vive en `ARROBA_PHILOSOPHY.md`. El **cómo** del código está en `/app/frontend/src/styles/tokens.css`, `tailwind.config.ts` y los componentes referenciados.

---

## Índice

- [Nivel 1 — Visual (tokens)](#nivel-1--visual-tokens)
  - [1.1 Color](#11-color)
  - [1.2 Spacing](#12-spacing)
  - [1.3 Typography](#13-typography)
  - [1.4 Radius](#14-radius)
  - [1.5 Shadows](#15-shadows)
  - [1.6 Transitions / Motion](#16-transitions--motion)
  - [1.7 Z-index](#17-z-index)
  - [1.8 Focus & Accessibility](#18-focus--accessibility)
  - [1.9 Breakpoints](#19-breakpoints)
- [Nivel 2 — Componentes reutilizables](#nivel-2--componentes-reutilizables)
- [Nivel 3 — Page Patterns](#nivel-3--page-patterns)

---

# Nivel 1 — Visual (tokens)

Single source of truth: `/app/frontend/src/styles/tokens.css`.
Mapping a utilidades Tailwind: `/app/frontend/tailwind.config.ts`.

## 1.1 Color

### Paleta semántica obligatoria

Todos los componentes consumen estos tokens. **Cero hex/rgba hardcoded**.

| Token | Light | Dark | Uso recomendado |
|---|---|---|---|
| `--brand-primary` | `#E8001D` (arroba-red) | `#E8001D` | CTAs primarios, AI marker, foco, score badges |
| `--brand-primary-hover` | `#C50019` | `#FF1A35` (más cálido) | Hover state del primary |
| `--brand-accent` | `#0C0C0E` (arroba-black) | `#0C0C0E` | Bandas oscuras, hero dark variant, dock FAB |
| `--surface-primary` | `#FAFAF8` | `#0C0C0E` | Fondo de página |
| `--surface-elevated` | `#FFFFFF` | `#1A1A18` | Cards, popovers, modals, dock panel |
| `--surface-muted` | `#F4F4F0` | `#2E2E2C` | Footers de card, info panels, locked teasers |
| `--text-primary` | `#0C0C0E` | `#FAFAF8` | Body & headings principales |
| `--text-secondary` | `#4A4A47` | `#D4D4CC` | Subtítulos, microcopy importante |
| `--text-muted` | `#636360` | `#ADADAA` | Breadcrumbs, hints, captions |
| `--text-disabled` | `#ADADAA` | `#858580` | Inputs disabled, placeholders, locked text |
| `--text-on-brand` | `#FFFFFF` | `#FFFFFF` | Texto sobre `--brand-primary` |
| `--border-default` | `#E8E8E2` | `#2E2E2C` | Bordes neutros (cards, inputs) |
| `--border-emphasis` | `#D4D4CC` | `#4A4A47` | Hover/focus state de bordes |
| `--success` | `#15803D` | `#22C55E` | Toasts success, watchlist activo |
| `--success-subtle` | `#DCFCE7` | rgba 16% | Badges success bg |
| `--warning` | `#C2410C` | `#FB923C` | Toasts warning, cooldown badges, "Próximamente" |
| `--warning-subtle` | `#FFEDD5` | rgba 16% | Bg de UnavailableBlock icon, banners |
| `--danger` | `#B91C1C` | `#EF4444` | Errores destructivos, ErrorBlock |
| `--danger-subtle` | `#FEE2E2` | rgba 16% | ErrorBlock bg |
| `--info` | `#1D4ED8` | `#3B82F6` | Información neutral, link semánticos |
| `--info-subtle` | `#DBEAFE` | rgba 16% | Toast info bg, hint panels |
| `--locked-overlay` | rgba blanco 65% | rgba negro 55% | Capa de `LockedSectionBlur` |

### Gradientes
| Token | Definición | Uso |
|---|---|---|
| `--gradient-brand-dark` | `linear-gradient(135deg, var(--arroba-black), var(--neutral-800))` | Dock FAB, hero dark, branded surfaces |
| `--gradient-brand-red` | `linear-gradient(135deg, var(--arroba-red), var(--arroba-red-dark))` | FeatureCardBlock variante accent |

### Aliases legacy (mantenidos por retrocompat)
`--bg`, `--surface`, `--surface-2`, `--border`, `--border-strong`, `--text`, `--text-subtle`, `--primary`, `--primary-hover`. **No usar en código nuevo.** Migrar oportunisticamente cuando se toque el componente.

---

## 1.2 Spacing

Escala 4-based. Tailwind class `p-N`, `gap-N`, `mt-N`, etc.

| Token | Valor | Tailwind | Uso típico |
|---|---|---|---|
| `--space-1` | 4px  | `p-1` | Gap entre icono + label |
| `--space-2` | 8px  | `p-2` | Padding interior de chips |
| `--space-3` | 12px | `p-3` | Gap entre items en grid |
| `--space-4` | 16px | `p-4` | Padding cards normales |
| `--space-5` | 20px | `p-5` | Padding cards medianos |
| `--space-6` | 24px | `p-6` | Padding cards grandes, gap entre secciones |
| `--space-8` | 32px | `p-8` | Padding section wrappers |
| `--space-10` | 40px | `p-10` | Spacing entre bloques principales |
| `--space-12` | 48px | `p-12` | Padding hero, separador entre secciones grandes |
| `--space-16` | 64px | `p-16` | Padding vertical pages |
| `--space-20` | 80px | `p-20` | Hero padding |
| `--space-24` | 96px | `p-24` | Padding sección con eyebrow grande |

---

## 1.3 Typography

### Familias

| Token | Familia | Uso |
|---|---|---|
| `--font-display` | Space Grotesk | Headings (h1-h4), display, eyebrows |
| `--font-body`    | DM Sans       | Body, captions, labels |
| `--font-mono`    | JetBrains Mono | Números tabulares, CIF, IDs, code |

### Escala canónica

Todas con line-height y letter-spacing definidos. Tailwind: `text-display`, `text-h1`, ..., `text-caption`.

| Token | Size | Line-height | Tracking | Uso |
|---|---|---|---|---|
| `--text-display` | 72px | 1.05 | -0.02em | Hero principal, landing |
| `--text-h1`      | 36px | 1.15 | -0.015em | Page title (ficha de empresa) |
| `--text-h2`      | 28px | 1.20 | -0.01em | Section title |
| `--text-h3`      | 22px | 1.30 | -0.005em | Subsection title, MetricsGrid value |
| `--text-h4`      | 18px | 1.40 | 0 | Card title, UnavailableBlock title |
| `--text-body`    | 15px | 1.60 | 0 | Body por defecto |
| `--text-body-sm` | 14px | 1.60 | 0 | Microcopy, descripciones secundarias |
| `--text-caption` | 12px | 1.60 | 0.02em | Labels, hints, badges, breadcrumbs |
| `--text-mono`    | 14px | 1.60 | 0 | Tabulares, CIF, IDs |

### Pesos disponibles
`font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800).

---

## 1.4 Radius

| Token | Valor | Tailwind | Uso |
|---|---|---|---|
| `--radius-none` | 0 | `rounded-none` | Banners full-bleed |
| `--radius-sm`   | 4px | `rounded-sm` | Chips pequeños, focus ring |
| `--radius-md`   | 8px | `rounded-md` | Inputs, buttons compactos, dock icon container |
| `--radius-lg`   | 12px | `rounded-lg` | Default para mayoría de elementos |
| `--radius-xl`   | 16px | `rounded-xl` | Cards medianos, metrics cards |
| `--radius-2xl`  | 24px | `rounded-2xl` | Cards principales, hero, section wrappers, dock |
| `--radius-full` | 9999px | `rounded-full` | Pills, badges, RefreshButton, action buttons |

---

## 1.5 Shadows

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--shadow-none` | none | none | Default cards (border only) |
| `--shadow-sm`   | sutil 1px | más oscuro | Hover de cards |
| `--shadow-md`   | 4-8px desplazado | más diffuso | Popovers, dropdowns |
| `--shadow-lg`   | 12-24px difusa | profunda | Modals, dock |
| `--shadow-xl`   | 24-48px | muy profunda | Dock expanded, overlays |
| `--focus-ring`  | red 22% | red 32% | `:focus-visible` y `:focus-within` |

Tailwind: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-focus`.

---

## 1.6 Transitions / Motion

| Token | Valor | Uso |
|---|---|---|
| `--transition-fast`   | 150ms | Hover, focus, color changes |
| `--transition-normal` | 250ms | Slide, fade, dock open/close |
| `--transition-slow`   | 400ms | Section update highlight, hero fade |
| `--easing-standard`   | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Default natural easing |
| `--easing-emphasized` | `cubic-bezier(0.32, 0.72, 0, 1)` | Énfasis (modal open) |
| `--easing-out`        | `cubic-bezier(0, 0, 0.2, 1)` | Exits, fade out |

Tailwind: `duration-fast`, `duration-normal`, `duration-slow`. `ease-standard`, `ease-emphasized`, `ease-out`.

### Animaciones predefinidas
| Clase Tailwind | Efecto |
|---|---|
| `animate-section-pulse` | 700ms highlight rojo sutil tras section update |
| `animate-fade-in-up` | 250ms fade + 6px translateY entry |

### Reduced motion
`@media (prefers-reduced-motion: reduce)` colapsa todas las transitions a 0.001ms. Cero JS adicional necesario.

---

## 1.7 Z-index

| Token | Valor | Tailwind | Uso |
|---|---|---|---|
| `--z-base`     | 0    | `z-base` | Default |
| `--z-dropdown` | 100  | `z-dropdown` | Menús desplegables, popovers de acciones |
| `--z-sticky`   | 200  | `z-sticky` | Header sticky |
| `--z-overlay`  | 800  | `z-overlay` | Backdrops |
| `--z-modal`    | 1000 | `z-modal` | Dock panel, modals |
| `--z-toast`    | 1200 | `z-toast` | Toast host (`arroba-toast-host`) |
| `--z-tooltip`  | 1300 | `z-tooltip` | Tooltips por encima de modals |

---

## 1.8 Focus & Accessibility

- `:focus-visible` aplica `box-shadow: var(--focus-ring)` (definido en `globals.css`).
- Tap target mínimo: `--tap-target-min` = 44px.
- Microcopy de aria-live: usar `polite` para section updates, `assertive` solo para errores críticos.
- `aria-busy="true"` mientras una operación está en vuelo (ver `RefreshButton`).

---

## 1.9 Breakpoints

Tailwind defaults (sin override):

| Nombre | Min-width | Layout target |
|---|---|---|
| `(default)` | 0 | Mobile (1 columna, dock bottom-sheet) |
| `sm:` | 640px | Small tablet |
| `md:` | 768px | Tablet (2 columnas, dock lateral compacto) |
| `lg:` | 1024px | Desktop (layout completo) |
| `xl:` | 1280px | Large desktop (max-width content) |
| `2xl:` | 1536px | Wide desktop |

---

# Nivel 2 — Componentes reutilizables

Catálogo canónico. Cada componente se documenta con: **propósito · anatomía · props · variantes · cuándo usar · cuándo no usar · composición**.

Imports estables:
- Bloques: `import { ... } from '@/components/blocks';`
- Entidad: `import { ... } from '@/components/entity';`

---

## 2.1 `EntityHeader`

> Implementación actual: re-export de `CompanyHeader`. La API canónica permanecerá idéntica cuando E1.6 generalice.

- **Propósito**: cabecera global de una página de entidad. Render del nombre + score + acciones tipificadas + ID legal.
- **Anatomía**: avatar inicial + bloque nombre/sector/región + score badge (opcional) + fila de acciones (`watchlist`, `share`, `request-valuation`, `activate-opportunity`, `download-memory`, `claim` + dropdown "Más").
- **Props clave**: `cif`, `info`, `authenticated`, `initialInWatchlist`, `initialVisibility`.
- **Variantes**: con/sin score badge, anónimo (sin actions row), autenticado (actions row completa).
- **Cuándo NO usarlo**: para tarjetas internas (usar `CompanyCardBlock`), para previews compactos (futuro `EntityChipBadge`, no canonizado todavía).

## 2.2 `EntitySection`

> Implementación actual: re-export de `EntitySectionWrapper`.

- **Propósito**: contenedor visual + semántico para una sección de la ficha.
- **Anatomía**: `<section>` con `id` (anchor link), `<header>` con título + subtítulo opcional + slot `action` (right-aligned) + slot `children` (contenido).
- **Props**: `id`, `title`, `description?`, `action?`, `children`.
- **Variantes**: con/sin action button (típicamente `RefreshButton`), con/sin description.
- **Cuándo NO usarlo**: para containers que no son secciones canónicas de entidad (usar `<section>` o `<div>` simple).

## 2.3 `LockedSectionBlur`

- **Propósito**: teaser cuando una sección es premium-only para usuarios anónimos.
- **Anatomía**: caja con `aria-hidden` blur + overlay con título + descripción + 2 CTAs ("Crear cuenta" → /registro, "Iniciar sesión" → /login).
- **Variantes**: con `children` (renderiza el contenido detrás del blur) o sin `children` (placeholder vacío).
- **Cuándo NO usarlo**: si el dato simplemente no existe → `EmptyStateBlock`. Si hubo error → `ErrorBlock`. Si depende de REQ-XXX → `UnavailableBlock`.

## 2.4 `RefreshButton`

- **Propósito**: botón canónico para refrescar una sección dependiente de un endpoint rate-limited.
- **Estados**: `idle` | `loading` | `cooldown` | `disabled` (atributo `data-state` para QA).
- **Props**: `label`, `loadingLabel?`, `cooldownSeconds?`, `loading?`, `disabled?`, `onClick`.
- **Comportamiento**: NO arranca su propio countdown — eso es responsabilidad del caller (el cooldown depende del backend Retry-After o de un optimistic 60s).
- **Cuándo NO usarlo**: si el flujo no es rate-limited → botón normal.

## 2.5 `MetricsGrid`

- **Propósito**: grid responsive de tarjetas KPI con valor + label + opcional trend + opcional hint.
- **Props**: `items[]`, `columns` (1/2/3/4), `showTrends`.
- **Variantes**: 1-col (vertical, micro), 2-col (default tablet), 3-col, 4-col (default desktop financials).
- **Cuándo NO usarlo**: para una sola métrica destacada → composición ad-hoc; para gráfico complejo → `EntityEvolutionChart` o un block dedicado.

## 2.6 `MetricsBlock`

- **Propósito**: bloque completo con título + grid de métricas (composición de `MetricsGrid`).
- **Diferencia con `MetricsGrid`**: incluye título de sección + microcopy + estilo de bloque.

## 2.7 `LoadingBlock`

- **Propósito**: skeleton placeholder mientras un block está cargando.
- **Variantes**: `block_type` `hero` | `metrics` | `narrative` | `comparables` | `valuation` (skeletons específicos).
- **Cuándo NO usarlo**: para spinner inline en un botón → `<Loader2 className="animate-spin" />`.

## 2.8 `EmptyStateBlock`

- **Propósito**: estado vacío con microcopy explicativa y CTA opcional.
- **Cuándo NO usarlo**: si el dato puede llegar más tarde via REQ-XXX → `UnavailableBlock`. Si la sección es premium → `LockedSectionBlur`.

## 2.9 `ErrorBlock`

- **Propósito**: error de runtime con replay opcional.
- **Anatomía**: icono danger + título + detail + botón "Reintentar".

## 2.10 `UnavailableBlock` ✨ nuevo en v1.0.0

- **Propósito**: placeholder explícito para capacidades pendientes de un REQ externo (Agency Tool real, BORME, etc.).
- **Props**: `title`, `description?`, `req?` (ej. "REQ-008"), `eta?` (ej. "E1.8"), `cta?` (link a doc).
- **Diferencia con Empty/Locked/Error**: hace explícito qué falta y cuándo llegará.

## 2.11 `Toast` (helper `notify()`)

- **Propósito**: feedback transitorio (3s) bottom-right slide-in.
- **API**: `notify({ kind: 'success' | 'warn' | 'error' | 'info', text })`. NO es un componente React — es un helper que mantiene un host único `arroba-toast-host`.
- **Test ids**: `arroba-toast-success`, `arroba-toast-warn`, `arroba-toast-error`, `arroba-toast-info`.
- **Cuándo NO usarlo**: para feedback persistente → banner inline. Para errores críticos → `ErrorBlock` en página.

---

# Nivel 3 — Page Patterns

Los **Page Patterns** son el alma del DS canónico: definen cómo se ensamblan los componentes del Nivel 2 para formar una página completa. Cada futura entidad (Sector, Territorio, etc.) heredará el patrón sin reinventar.

> Convenciones de estado:
> - ✅ **implementado** — código en producción.
> - 🟡 **parcial** — base existe, falta polish o cobertura completa.
> - 🔵 **template** — solo documentado; se implementa cuando llegue su fase.

---

## 3.1 Company Page — ✅ canónico de referencia

> **Esta es la plantilla maestra.** Cualquier futura entidad (Sector, Territorio, Valoración, Oportunidad, Transacción) debe respetar esta estructura.
> Implementación: `/app/frontend/src/components/entity/CompanyPageClient.tsx`.

### Anatomía (orden de lectura top-to-bottom)

1. **Breadcrumb** (`<nav data-testid="company-breadcrumb">`): Inicio › Analizar › Empresas › {Nombre}.
2. **`EntityHeader`**: nombre + sector/región + CIF + score badge + acciones tipificadas (6 visibles + dropdown "Más").
3. **Sección 1 — Resumen** (`#resumen`, **pública**): `HeroBlock` + `MetricsBlock` (4 KPIs principales).
4. **Sección 2 — Identidad** (`#identidad`, **pública**): `IdentityCard` (razón social, CIF, sector, sede, empleados, año constitución).
5. **Sección 3 — Financieros** (`#financieros`, **pública resumida**): `MetricsBlock` resumido + `EntityEvolutionChart` (sparkline 8 ejercicios).
6. **Sección 4 — Score y señales** (`#score`, **locked anon**): score sectorial + señales BORME (futuro vía `UnavailableBlock` con REQ-008).
7. **Sección 5 — Posición de mercado** (`#comparables`, **locked anon**): `CompanyCardsGridBlock` 3-5 comparables.
8. **Sección 6 — Valoración indicativa** (`#valoracion`, **locked anon**): `ValuationBlock` (banda central + min/max + multiplo).
9. **Sección 7 — Análisis del Copilot** (`#analisis`, **locked anon**): `NarrativeBlock` + `RefreshButton` en el slot `action`.
10. **Sección 8 — Próximas mejores acciones** (`#acciones`, **locked anon**): 3 cards de capacidades (compárala, analiza riesgos, detecta oportunidades).

### Auth gating

- **Anónimo**: secciones 1-3 visibles. Secciones 4-8 reemplazadas por `LockedSectionBlur` con CTAs `/registro` + `/login`.
- **Autenticado**: 8 secciones completas. Refresh button visible. Acciones tipificadas activas.

### Estados

- **Loading**: SSR-first, `LoadingBlock` para hidratación parcial (raro porque el server entrega todo).
- **Empty** (`master_company_id` no existe): página 404 propia con mensaje "No tenemos en arroba.com una empresa con el identificador {CIF}".
- **Error** (HTTP 5xx al hidratar): `ErrorBlock` con replay.
- **Unavailable** (REQ-XXX pendiente, ej. BORME): `UnavailableBlock` dentro de la sección afectada.

### Responsive

| Breakpoint | Layout |
|---|---|
| `<640px` (mobile) | 1 columna; `EntityHeader` stack vertical; MetricsGrid 1-col; ComparablesGrid 1-col; dock como **bottom-sheet 50% altura** |
| `640-768px` (small tablet) | 1-2 columnas; MetricsGrid 2-col; dock lateral compacto |
| `768-1024px` (tablet) | 2 columnas; MetricsGrid 2-col; ComparablesGrid 2-col; dock lateral compacto |
| `≥1024px` (desktop) | layout completo; MetricsGrid 4-col; ComparablesGrid 3-col; dock lateral expandible |
| `≥1280px` (large) | max-width content (`max-w-7xl`) + espacios laterales |

### Microinteracciones

- **Section update** (via `arroba:company-section-update`): la sección afectada recibe `animate-section-pulse` (700ms highlight rojo sutil).
- **Toast** "Sección «narrative» actualizada" con `kind=success` (3s).
- **Card hover**: `transition-colors duration-fast hover:border-border-emphasis`.
- **RefreshButton**: idle → loading (spinner) → cooldown ("Espera Ns") → idle.
- **Dock open/close**: `animate-fade-in-up` 250ms.

### Composición con Nivel 2

```
EntityHeader
EntitySection #resumen
  ├─ HeroBlock
  └─ MetricsBlock (sobre MetricsGrid)
EntitySection #identidad
  └─ IdentityCard (composición ad-hoc, no canonizada todavía)
EntitySection #financieros
  ├─ MetricsBlock
  └─ EntityEvolutionChart (SVG inline, sin lib externa)
EntitySection #score
  └─ LockedSectionBlur (anon) | HeroBlock (auth)
EntitySection #comparables
  └─ LockedSectionBlur (anon) | CompanyCardsGridBlock (auth)
EntitySection #valoracion
  └─ LockedSectionBlur (anon) | ValuationBlock (auth)
EntitySection #analisis
  action: RefreshButton
  └─ LockedSectionBlur (anon) | NarrativeBlock (auth)
EntitySection #acciones
  └─ LockedSectionBlur (anon) | CompanyNextBestActions (auth)
```

---

## 3.2 Sector Page — 🔵 template para E1.6

Hereda Company Page con estos ajustes:

- **Sección 1 — Resumen del sector**: hero + descripción del sector + scope geográfico.
- **Sección 2 — Empresas líderes** (top N por score, locked anon resumido a 3): `CompanyCardsGridBlock`.
- **Sección 3 — Métricas agregadas**: `MetricsGrid` 4-col (volumen, growth, fragmentación, multiples medios).
- **Sección 4 — Evolución del sector**: `EntityEvolutionChart` con tendencia agregada.
- **Sección 5 — Comparativa territorial** (locked anon): heatmap regional o lista de regiones top.
- **Sección 6 — Análisis del Sector Analyst** (locked anon): `NarrativeBlock` + `RefreshButton`.
- **Sección 7 — Oportunidades en el sector** (locked anon): lista de empresas con señales activas.
- **Sección 8 — Próximas mejores acciones**: ver competidores, descargar informe, activar alerta.

**Componentes nuevos a crear en E1.6** (no antes): `SectorScoreBadge`, `RegionalHeatmap`, `SectorFunnelChart`. Documentados aquí solo como plantilla.

---

## 3.3 Territory Page — 🔵 template para E1.7

Hereda Sector Page con foco geográfico:

- Hero con mapa de la región (estático SVG, no Leaflet inicial).
- Métricas agregadas por sector + tabla de sectores más representativos.
- Comparativa con territorios vecinos.
- `Territory Analyst` advisor (mismo patrón que `Company Advisor`).

---

## 3.4 Valuation Page — 🔵 template para E1.8

> **Decisión arquitectónica**: una valoración puede vivir embebida (`ValuationBlock` en `/empresa/{cif}` sección 6) **o** tener página propia `/valoracion/{val_id}` cuando es avanzada / personalizada.

### Estructura de la página dedicada

- **EntityHeader** adaptado: nombre de la empresa valorada + fecha + autor + método.
- **Sección 1 — Resumen ejecutivo**: `HeroBlock` con valor central + banda + multiplo.
- **Sección 2 — Inputs**: tabla de datos usados (ingresos, EBITDA, ajustes).
- **Sección 3 — Comparables aplicados**: `CompanyCardsGridBlock` con los comparables que justifican el multiplo.
- **Sección 4 — Escenarios** (locked sin plan avanzado): grid con baseline / optimistic / pessimistic.
- **Sección 5 — Sensibilidad**: gráfico de sensibilidad (multiplo vs valor).
- **Sección 6 — Análisis del Valuation Advisor**: `NarrativeBlock` con justificación cualitativa.
- **Acciones**: descargar PDF, compartir con el equipo, marcar como "definitiva".

---

## 3.5 Opportunity Page — 🔵 template para E1.9

- **EntityHeader**: título de la oportunidad + tipo (buy-side / sell-side) + scope.
- **Sección 1 — Tesis**: `HeroBlock` con copy de la tesis (editable por el usuario).
- **Sección 2 — Empresas candidatas**: `CompanyCardsGridBlock` filtrable.
- **Sección 3 — Señales activas**: lista de signals (BORME, contratación pública, cambios societarios).
- **Sección 4 — Pipeline**: tabla con estados (identificada → contactada → conversación → propuesta).
- **Sección 5 — Análisis del Opportunity Advisor**: `NarrativeBlock`.
- **Sección 6 — Acciones**: activar matching, enviar teaser anónimo, escalar a transacción.

---

## 3.6 Transaction Page — 🔵 template para E2.0 (Transaction OS)

> La transacción es el último estadio: un proceso M&A formal con múltiples fases.

- **EntityHeader**: nombre de la transacción + fase actual + counterparts (sin identificar si NDA no firmado).
- **Tabs de fases**: `Matching → Teaser → NDA → Information Memorandum → IOI → LOI → Due Diligence → Q&A → SPA → Cierre`.
- Cada tab renderiza un sub-pattern propio (a definir en E2.0).
- **Acciones**: avanzar de fase, invitar contraparte, abrir Data Room.

---

## 3.7 Dashboard (Home autenticado) — 🟡 parcial

Hoy: placeholder. Target documentado:

- **Hero** con saludo personalizado + 3 acciones rápidas.
- **Cartera (watchlist)**: `CompanyCardsGridBlock` con las empresas guardadas.
- **Señales recientes**: lista de updates de empresas en cartera.
- **Pipelines activos**: oportunidades + transacciones en curso.
- **Recientes**: workspaces/conversaciones recientes.

---

## 3.8 Search Results — 🟡 parcial

Hoy: el dock ya muestra un `SearchResultsBlock` cuando hay ambigüedad de búsqueda. Target ampliado:

- Página `/buscar?q=...` con filtros laterales (sector, región, tamaño).
- Disambiguador inline cuando hay <5 resultados.
- Redirección automática a `/empresa/{cif}` cuando match exacto (Entity Resolution).

---

## 3.9 Assistant (Copilot Dock) — 🟡 parcial

Hoy: implementado en `CopilotDock`. Target documentado:

- **Identidad contextual**: header del dock cambia según contexto (Arroba Copilot / Company Advisor de X / Sector Analyst / etc.).
- **Composer** con chips de sugerencias.
- **Section updates**: cuando el chat actualiza una sección, el dock muestra solo `response_text` (philosophy §12); la ficha se actualiza in-place via `CustomEvent("arroba:company-section-update")`.
- **Persistencia**: la conversación se hidrata desde `GET /api/companies/{cif}/conversation` (entity context) o `GET /api/workspaces/{id}` (legacy).

---

## 3.10 Empty / Error / Loading / Unavailable States — patrón unificado

Cuatro estados, una jerarquía clara:

| Estado | Componente | Cuándo |
|---|---|---|
| **Loading** | `LoadingBlock` | Dato pidiéndose ahora mismo |
| **Empty** | `EmptyStateBlock` | Dato existe en concepto pero no hay registros en este contexto |
| **Error** | `ErrorBlock` | Fallo de runtime, recuperable con replay |
| **Locked** | `LockedSectionBlur` | Dato existe pero requiere auth/upgrade |
| **Unavailable** | `UnavailableBlock` | Dato depende de REQ-XXX externo (Agency Tool real) |

Regla: **siempre** uno de estos. **Nunca** mostrar un block vacío sin explicación.

---

## 3.11 Valuation Result — 🟡 parcial

`ValuationBlock` ya existe. Plantilla canónica de presentación:

- **Top**: valor central destacado (`text-h1` o `text-display`).
- **Banda**: min - central - max con barra visual.
- **Inputs**: pequeño grid con los datos usados (ingresos, multiplo, ajustes).
- **Disclaimer**: caption en italic + `text-text-muted`.

---

## 3.12 Marketplace Flows — 🔵 futuro lejano (post-E2.0)

Sin estructura cerrada. Stub para evitar omisión.

---

# Apéndices

## Catálogo de tests Vitest del DS

| Suite | Cobertura |
|---|---|
| `blocks/blocks.test.tsx` | Suite legacy de blocks pre-v1.0.0 |
| `blocks/design-system-primitives.test.tsx` | `UnavailableBlock` (3), `RefreshButton` (4), `MetricsGrid` (4) — nuevo en v1.0.0 |
| `entity/locked-section-blur.test.tsx` | LockedSectionBlur (4) |
| `entity/company-page-client.test.tsx` | Page pattern Company end-to-end (6) |
| `entity/company-header.test.tsx` | EntityHeader actions row (7) |
| `lib/api/companies-client.test.ts` | SDK shape (7) |

## Roadmap del DS

| Versión | Alcance | Estado |
|---|---|---|
| **v1.0.0** | Tokens completos + 11 componentes canónicos + 12 Page Patterns documentados | ✅ E1.5.5 |
| **v1.1.0** | Generalización real de `EntityHeader` y `EntitySection` cuando Sector Page lo demande | 🔵 E1.6 |
| **v1.2.0** | Componentes específicos de Valoración avanzada | 🔵 E1.8 |
| **v1.3.0** | Patrón completo del Transaction OS | 🔵 E2.0 |

---

> **Living version**: `/internal/design-system` (admin-gated) renderiza este catálogo en vivo.
> **Fuente de verdad**: este markdown + `tokens.css` + componentes referenciados.
