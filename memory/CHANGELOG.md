# CHANGELOG — ARROBA Platform

## 9 Abr 2026
- **Orquestador de Presentacion de Deals** — Fases 1-3 completadas
  - Contact Request System: POST/accept/reject + auto_accept/manual_review seller policy
  - 5 subagentes: Asset Analyzer, Access Rules, Layout Compositor, CTA Engine, Premium Intelligence (placeholder)
  - Endpoint: GET /api/deals/{dealId}/presentation — JSON estructurado completo
  - Frontend: DealOrchestratedView, DealActionPanel, DealTeaserPage, DealPreContactPage, DealListingCard, DealPremiumAnalysis
  - Hook: useDealPresentation(dealId)
  - 7 estados: LOCKED_CONTACT_REQUIRED, CONTACT_REQUESTED, CONTACT_ACCEPTED, TEASER_UNLOCKED, NDA_AVAILABLE, NDA_SIGNED, OPERATIVE_ACCESS
  - Reglas: Free (card → contactar → teaser sin NDA), Pro (teaser → NDA → operativo), Pro+ (prioridad + premium)
  - Testing: Backend 29/29, Frontend 100% (iteration_29)

## 7 Abr 2026
- **Seller Company Workspace** — P0 cerrado (7 bugs criticos corregidos)
  - company_id persistido al root del seller_company_profile (no en seller_overrides)
  - recalcPs sin closure stale (parametros explicitos)
  - Subcategoria partial matching CIS <-> taxonomia local
  - handleResolve rehidrata overrides/pricing/panel_status de perfiles existentes
  - Redirect automatico si perfil ya vinculado a empresa
  - Financials CIS nested → flat format para companies API
  - valuation_inputs null-safe en valuation_service
  - Testing: Backend 21/21, Frontend 95% (iteration_28)
- **Reconciliacion documental**
  - LOI Comparator: OPERATIVO (ruta /seller/deals/:dealId/interesados, endpoint /api/engagements/deal/{id}/loi-comparator)
  - Buyer Activity Panel: OPERATIVO (dentro de LOI detail view)
  - SellerWizard.js: CODIGO MUERTO — import eliminado de App.js
  - SellerWizardBoceto.js: CODIGO MUERTO — sin referencias activas

## 27 Mar 2026
- Buyer Dashboard: seccion "Mis procesos" con vista detalle y "Siguientes acciones"
- Backend: _compute_process_actions() con recommended/available/blocked
- CTA "COMPLETAR VERIFICACION" en certificacion buyer
- Criterios certificacion: COMPLETITUD vs CONFIANZA
- Plan card con "Desde Pro" / "Solo Pro+"

## 26 Mar 2026
- Buyer Dashboard Premium: Fases 1-3 completas (6 tabs, 6 KPIs, certificacion 3 niveles)
- NDA Mutuo Digital: texto legal, firma, PDF, audit trail
- Deep-link planes: /planes?role=buyer
- Planes y Precios V2: interacciones, advisor, toggle anual
- Modulo Valoracion Publica: motor configurable, 4 pasos, lead magnet
- Home: hero tabs, bloque valoracion, share menu

## 25 Mar 2026
- Seller Wizard V2: sidebar + 60/40 + live preview + 5 pasos
- Deal Readiness, Deal Health, Response Acceleration, Q&A Workspace
