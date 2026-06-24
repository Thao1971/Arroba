# CHANGELOG — ARROBA Platform

## 24 Jun 2026 — E1.4 Intelligence Skills

- **Backend** — adapter `EnrichCompanyAdapter` (Boundary First, Mock/Real + factory por `ENRICH_COMPANY_SOURCE`). Skills `analyze` / `value` / `recommend` con `POST /api/copilot/skills/{analyze,value,recommend}` (`X-Source: mock`). Discriminated union de bloques ampliada a 10 tipos: `search_results` · `empty_state` · `error` · `loading` · `hero` · `metrics` · `company_card` · `company_cards_grid` · `valuation` · `narrative`.
- **Value Skill simplificada** — fórmula determinista `central = revenue * 1.5`, rango `[0.75×, 1.30×]`. Sin múltiplos por sector. La inteligencia real llega vía REQ-004 (Agency Tool Valuation Engine).
- **Recommend Skill** — LLM-assisted intent router (Claude Sonnet 4.6 vía Emergent LLM Key) en 3 subtipos: `similar_to_company` / `opportunities_by_sector` / `list_by_sector`. Heuristic fallback cuando el LLM falla. Body devuelto por adapter mock; REQ-005 lo sustituirá.
- **Analyze Skill** — LLM-powered (Claude Sonnet 4.6). 1 reintento de JSON strict + fallback de narrativa. Workspace: Hero + Metrics + CompanyCard + Narrative.
- **Frontend** — `route-intent.ts` detecta verbos (analiza/valora/recomienda/empresas similares a/empresas en …) accent- y case-insensitive vía NFD. `dispatch.ts` rutea a `apiClient.copilot.{search,analyze,value,recommend}`. `CopilotProvider` persiste `lastQuery`; `ErrorBlock.onRetry` replay con `lastQuery` (no más fallback a `/help`).
- **Block Library E1.4** — `ValuationBlock` (valor central + rango + disclaimer), `NarrativeBlock` (summary + key_points + risks + opportunities), `CompanyCardBlock`, `CompanyCardsGridBlock` (3 subtipos). Tokens canónicos en Light + Dark.
- **REQ-004 + REQ-005** emitidos en `/app/_requirements_for_agency_tool/README.md`. Payloads, schemas, SLA y criterios de aceptación accionables.
- **Seed E1.4** — `scripts/seed_master_companies_e14.py` añade 12 empresas mock cubriendo los 8 sectores obligatorios (Software, Marketing, Hoteles, Industria, Salud, Alimentación, Servicios profesionales, Retail).
- **Tests** — Backend **84/84 PASS** (35 nuevos). Frontend **86/86 PASS** (19 nuevos). Tests pytest NUNCA pegan a Claude real — `MockLLMProvider` inyectado vía `set_override`.
- **`emergentintegrations`** — import path corregido a `emergentintegrations.llm.chat` (era `emergentintegrations.llmchat`).
- **Verificación visual** — capturas Light + Dark de Analyze, Value, Recommend, Error+Retry con Claude real respondiendo.

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
