# CHANGELOG — ARROBA Platform

## 24 Jun 2026 — E1.3 Copilot Foundation

- **Backend** — nuevo módulo `src/modules/copilot/` con `POST /api/copilot/skills/search` (público, `X-Source: mock`). Discriminated union `Workspace.blocks[]` con tipos `search_results | empty_state | error | loading`. Service determinista sobre `master_companies_mock` con scoring textual + CIF + sector accent-insensitive. 10 nuevos tests `tests/test_copilot_search.py`. Backend total: **49/49 PASS**.
- **Frontend** — `components/copilot/` con `CopilotProvider`, `CopilotDock` (FAB minimizado / panel expandido, Cmd+K toggle, ESC cierra, autofocus composer, sr-announcer), `Composer` (textarea autoexpand, Enter envía, chips contextuales, slot adjuntos), `ConversationThread` con renderer inline del último workspace.
- **Block Library** — añadidos `SearchResultsBlock` (lista nombre/sector/CIF/score), `LoadingBlock` (skeleton 3 filas), `ErrorBlock` (icono danger + retry). EmptyStateBlock reusado.
- **`lib/orchestrator/`** — pipeline `text → routeIntent → executeSkill → Workspace`. Slash commands `/clear` y `/help` parseados. `nextBestActions` deterministas por pathname (port del `presetsFor` del intake).
- **Montaje** en `(public)/layout.tsx` y `(authenticated)/layout.tsx` con `<CopilotProvider><CopilotDock /></CopilotProvider>`.
- **REQ-003** emitido en `/app/_requirements_for_agency_tool/README.md` con payload, filtros, ranking, paginación y criterios de aceptación para el endpoint real del Agency Tool.
- **Tests frontend** — 16 nuevos (route-intent 5, next-best-actions 4, workspace-area 4, dock E2E 3). Frontend total: **67/67 PASS**.
- **Light + Dark verificados** vía screenshot tool con: dock minimizado, dock expandido con chips, workspace con `SearchResultsBlock` (≥3 resultados), EmptyState con sugerencias, ErrorBlock con retry, Loading typing indicator.
- **`ThemeSwitcher`** — añadido `data-testid="theme-toggle"` para tests automatizados.

## 9 Abr 2026
- **Premium Intelligence Agent — 3 capas para Pro+**
  - Premium Quant: 8 KPIs deterministas (endeudamiento, fondo maniobra, pasivo/EBITDA, EBITDA/activo, rev/empleado, EBITDA/empleado, deuda neta/EBITDA, margen EBITDA) con tooltips, formulas y niveles
  - Premium Benchmark: percentiles por categoria (facturacion, EBITDA, margen, crecimiento, eficiencia, quality score) con barras y comparacion vs mediana/P75
  - Premium AI (GPT-5.2): fortalezas, riesgos, preguntas DD, lectura estrategica, perfil comprador ideal — carga asincrona (no bloquea la ficha)
- **Ficha Canonica Integrada** — DealPageCanonical reemplaza todas las vistas de deal
  - Shell arroba (logo, nav, breadcrumb, badge plan)
  - Subnav sticky con scrollspy (Resumen, Financieros, Infomemo, Data Room, Proceso)
  - 14 bloques modulares con estado por modulo
  - Graficos recharts reales (barras ingresos/EBITDA, CAGR)
  - PnL completo CIS (cascada), Balance CIS, Activos visuales (logo, screenshots)
  - DataRoom integrado con DataRoomBuyerView funcional
  - Tooltips en estado del proceso, acciones clicables
  - Modulos bloqueados visibles con CTA comercial
- **Consolidacion PnL/Balance CIS** — orquestador prefiere datos CIS cuando tienen PnL+Balance
- **Cards marketplace con orquestador** — badges estado, CTA por plan, financials bloqueados Free
- **Orquestador de Presentacion de Deals** — Fases 1-3 con Contact Request System
- **Rutas unificadas** — /explorar/:dealId y /buyer/deal/:dealId → DealPageCanonical

## 7 Abr 2026
- **Seller Company Workspace** — P0 cerrado (7 bugs criticos corregidos)
- **Reconciliacion documental** — LOI Comparator y Buyer Activity Panel operativos, SellerWizard eliminado

## 26-27 Mar 2026
- Buyer Dashboard Premium, NDA Mutuo Digital, Planes V2, Valoracion Publica, Home
