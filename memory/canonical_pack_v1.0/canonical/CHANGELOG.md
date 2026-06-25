# CHANGELOG — ARROBA Platform

## 🧊 25 Jun 2026 — v1.0-canonical-baseline (Sprint 0 + Sprint 0.5) — FROZEN

> **Canonical Baseline v1.0 congelada**. Sprint puramente documental: cero modificaciones en código de producto. Establece la capa 7 (*Engines & Specs*) y consolida el canon legacy con los specs del Sprint 0.

### Sprint 0 — Engines & Specs (6 specs canónicos en `/app/memory/specs/`)

- **`TRANSACTION_OS_SPEC.md` v1.2.0** — Sistema operativo de la transacción. 15 fases canónicas (`T1`…`T15`), estados, transiciones, journey M&A end-to-end.
- **`TRANSACTION_COPILOT_SPEC.md` v1.2.0** — Copilot orquestador. Contrato con OS, intents, herramientas, gobierno conversacional.
- **`COPILOTS_SPEC.md` v1.1.0** — Catálogo y contrato común de Copilots especializados por entidad.
- **`MEMORY_ENGINE_SPEC.md` v1.1.0** — Memoria: corto plazo, largo plazo, sintetización, hidratación, scopes.
- **`AGENTIC_LAYERS_SPEC.md` v1.1.0** — Capas agénticas (perception → reasoning → action → reflection), gobernanza, límites de autonomía.
- **`MONETIZATION_SPEC.md` v1.1.0** — Modelo de negocio: planes, gating funcional, fricciones de upgrade, métricas.

### Sprint 0.5 Ciclo A — Auditoría documental

- **`specs/CANON_AUDIT_REPORT.md`** — Inventario de contradicciones (15 originales canon ↔ legacy) e inconsistencias intra-spec.
- **`specs/OPEN_ITEMS_CLASSIFICATION.md`** — 4 grupos: G1 autocerrables · G2 decisiones canónicas pendientes · G3 input humano necesario · G4 backlog estratégico.

### Sprint 0.5 Ciclo B — Propagación + ensamblaje

**Decisiones canónicas confirmadas y propagadas**:
- **Match pasa a ser una entidad canónica de primer nivel** (decisión G2.M). Materializa el resultado del motor de matching con identidad propia, ciclo de vida observable (`detected → reviewed → contacted → engaged → converted_to_operation | discarded`), score y trazabilidad bidireccional. Ver `ENTITY_MODEL.md` §5.7 y `ENTITY_FRAMEWORK.md` §11.13.
- **Renombre `client → user`**: actor humano del producto, aplicado en todo el canon.
- **Renombre `team_arroba → arroba_team`**: nomenclatura interna del equipo, aplicado.
- **Fases del journey**: numeradas `T1`…`T15` (`TRANSACTION_OS_SPEC.md` §3).
- **Fases de `Operation.current_phase`**: orden canónico `nda → im → qa → loi → dd → negotiation → spa → closing → integration` (G2.O resuelto).
- **Catálogo abstraído**: el conjunto de tipos del producto se enumera y evoluciona por declaración, no por cardinalidad.
- **Capa 7 — Engines & Specs**: incorporada formalmente en `ARROBA_PHILOSOPHY.md` §13 entre *Entity Framework* y *Design System*.

**Documentos legacy actualizados**:
- `ARROBA_PHILOSOPHY.md` — §6, §7, §13 reconciliados; §13 ampliada a 7 capas; catálogo abstraído.
- `ENTITY_MODEL.md` v1.1.0 — `client → user`; `match` añadido como entidad canónica de primer nivel (§5.7); catálogo abstraído.
- `ENTITY_FRAMEWORK.md` v1.1.0 — `match` con anatomía propia (§11.13); §11.8 Operación con fases canónicas; catálogo abstraído.
- `PRD.md` — sección **🧊 CANONICAL BASELINE v1.0** añadida al inicio; cardinalidad eliminada del cuerpo.

**Nuevos documentos canónicos**:
- `CANON_INDEX.md` — Índice maestro navegable del canon completo.
- `ENGINE_ARCHITECTURE.md` — Cadena de inteligencia: Fuentes → Data Layer → KG → Embeddings → Signal → Matching → Recommendation → Valuation → Risk → Transaction → Copilots → UX.
- `SPRINT0_EXECUTIVE_SUMMARY.md` — Resumen ejecutivo del Sprint 0 + 0.5 para stakeholders.
- `ARCHITECTURE_MAP.md` — Mapa visual ASCII + tablas compactas.
- `canonical_pack_v1.0.zip` — Pack distribuible con README + `/canonical` + `/specs` + `/audit` + `/summary`.

### Reglas vivas tras la baseline

1. Los 6 specs del Sprint 0 son **fuente de verdad** sobre la arquitectura del producto. En conflicto con código heredado, **gana el spec**.
2. El canon legacy queda alineado con los specs (cero contradicciones canon ↔ legacy verificadas en el informe final).
3. Cualquier evolución posterior empieza por modificar el spec correspondiente + bumpear versión + reflejar en este CHANGELOG.
4. Sprint 1 (Identidad + Roles + Planes + Billing) **no se inicia hasta aprobación explícita del usuario**.

---

## 24 Jun 2026 — E1.5 Workspaces Persistentes

- **Modelo de datos** (3 colecciones MongoDB): `workspaces`, `workspace_messages`, `workspace_blocks`. Índices por `organization_id+state+updated_at`, `created_by+updated_at`, `workspace_id+order`. Visibilidades soportadas en schema: `private | team | organization | public`. UI E1.5 solo expone `private ↔ team`.
- **6 endpoints** bajo `/api/workspaces`: `POST /` (create) · `GET /` (list filtrado por org + state) · `GET /{id}` (detail con access control) · `POST /{id}/messages` (extend — el orchestrator backend decide la skill via `intent_router.py`) · `POST /{id}/share` (toggle private↔team) · `PATCH /{id}` (title) · `DELETE /{id}` (soft archive). Todos requieren auth; `X-Active-Org` header opcional para multi-org.
- **`intent_router.py` espejo** del TS — única fuente de verdad de la lista de verbos. Test `test_intent_router.py::test_parity_with_frontend_verb_list` impide derivas silenciosas.
- **Frontend**:
  - Página `/es/w/[workspace_id]` (client + SWR): renderiza Workspace persistente, header con título inline editable, badge tipo + visibility, botón `Compartir con mi equipo` / `Hacer privado`, botón `Archivar`.
  - Página `/es/historial`: lista con filtros tipo (`Todos | Análisis | Valoraciones | Recomendaciones | Búsquedas | Mixto`) + estado (`Activos | Archivados`). Empty state contextual.
  - `OrgSwitcher`: dropdown en el header autenticado. Estático cuando hay 1 membership; dropdown con marcas cuando ≥2. Persiste `arroba.active_org_id` en localStorage. Emite `arroba:active-org-changed` cuando cambia.
  - `CopilotProvider` modo "anchored": detecta `/w/{id}` por URL, llama a `POST /workspaces/{id}/messages` y mergea el delta. Modo ephemeral E1.4 intacto en cualquier otra ruta.
  - `OpenWorkspaceButton` ("Seguir trabajando"): aparece en el dock efímero cuando hay ≥1 par user/assistant. Click → POST `/api/workspaces` → router.push(`/es/w/{id}`). Anónimo → `/es/login?next=/es/historial`.
  - `RecentWorkspacesPanel`: dropdown en el header del dock con los 10 últimos workspaces de la org activa + link a `/es/historial`.
- **Auto-título determinista**: primera query del user, sin verbo de comando, primer carácter capitalizado, truncado a 80 chars en el último espacio. Sin LLM, sin coste.
- **Cross-org safety**: si el user accede a `/es/w/{id}` de una org a la que no pertenece, redirect a `/es/historial` con toast. Si pertenece pero la activa es otra, se ajusta `activeOrgId` automáticamente.
- **Compartición team** verificada E2E: buyer crea workspace privado → comparte team → seller (otra cuenta misma org) lo ve en `/es/historial` y puede leerlo (lectura sí, extender no).
- **Limpieza de rutas obsoletas**: borradas `/es/analizar`, `/es/valorar`, `/es/comprar-vender` (prohibidas por Copilot First).
- **Demo users seed**: `scripts/seed_demo_users.py` crea 4 usuarios + 1 org "ARROBA Demo Org" (B99999999) idempotente. Credenciales en `/app/memory/test_credentials.md`.
- **Tests**: Backend **110/110 PASS** (24 nuevos: 16 workspaces + 8 intent_router parity). Frontend **97/97 PASS** (11 nuevos: 5 OpenWorkspaceButton + 3 OrgSwitcher + 3 HistoryPage). Lint + typecheck + build verde.
- **Housekeeping E1.4**: 2 tests añadidos a `test_copilot_recommend.py` (cobertura sectorial baja → fallback con sectores adyacentes; cobertura alta → solo estrictos). +1 empresa al seed (`mc_lacteos`, Lácteos del Atlántico). Smoke E2E real contra preview: `oportunidades en alimentación` → 3 cards Alimentación.

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
