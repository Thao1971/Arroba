# ARROBA — Product Requirements Document (PRD)
## Plataforma M&A para Agencias Digitales
**Última actualización:** 7 de abril de 2026
**Titular:** BUD Advisors, S.L. · CIF B70821400

---

## 1. Problema y Visión

ARROBA es un marketplace confidencial de compraventa y fusión de agencias digitales del ecosistema MadTech en España. La plataforma conecta sellers (propietarios de agencias), buyers (compradores/inversores) y advisors (asesores de M&A) en un entorno estructurado, seguro y profesional.

**Objetivo:** Ofrecer un proceso M&A ordenado con percepción de mercado, coaching prescriptivo, valoración automatizada y herramientas de gestión de operaciones que transmitan seriedad, confidencialidad y criterio financiero.

---

## 2. Design System: "The Digital Artifact"

| Elemento | Valor |
|---|---|
| Tipografía | IBM Plex Sans (300-800) |
| Border radius | 0px globalmente |
| Surface-0 (fondo) | #f9f9f9 |
| Surface-1 | #f3f3f3 |
| Surface-2 | #e2e2e2 |
| Surface-lowest (cards) | #ffffff |
| Primary (arroba-coral) | #B6212A |
| Secondary (arroba-blue) | #006493 |
| On-surface | #191c1e |
| Labels | ALL CAPS, 0.05em letter-spacing, 10px, weight 700 |
| Layout dashboard | Sidebar izquierda fija + contenido central + rail derecho contextual |

---

## 3. Arquitectura Técnica

### Stack
- **Frontend:** React 18 + Tailwind CSS + Shadcn/UI + IBM Plex Sans + Recharts
- **Backend:** FastAPI (Python) + MongoDB (Motor async)
- **Storage:** Emergent Object Storage
- **AI:** OpenAI GPT-5.2 (vía Emergent LLM Key)

### Entidades Core del Seller Flow

| Entidad | Colección MongoDB | Rol |
|---|---|---|
| `seller_company_profile` | `seller_company_profiles` | Working space del seller: auto_prefilled (CIS), seller_overrides, pricing, panel_status |
| `company` | `companies` | Entidad canónica ARROBA: financials (formato plano), valuation, datos para marketplace |
| `deal` | `deals` | Operación comercial: publicación, gating, visibilidad buyer |

**Relación**: `seller_company_profile.company_id` → `companies.company_id`

---

## 4. Seller Company Workspace — Flujo Validado

### Paneles
1. **Compañía**: CIF resolve vía CIS → datos registrales
2. **Ficha**: Taxonomía editable, señales cualitativas
3. **Financieros**: Estados financieros (CIS o manual), EBITDA ajustado
4. **Valoración**: Cálculo automático + Financial Visuals
5. **Operación**: Tipo de operación, precio, motivación

### Persistencia
- **CIF Resolve** → `POST /api/seller-profiles/resolve-and-save` → crea `seller_company_profile`
- **Guardar** → `POST /api/companies` (o PUT) + `PUT /api/seller-profiles/{id}/overrides` (con `company_id` al root) + `PUT /api/seller-profiles/{id}/pricing` + `PUT /api/seller-profiles/{id}/panel-status`
- **Financials Sync** → CIS nested format se transforma a flat antes de enviar a `POST /api/companies/{id}/financials`
- **Rehidratación** → `GET /api/seller-profiles/by-company/{id}` → hydrate overrides, pricing, panel_status

### Bugs Corregidos (7 abril 2026)
1. ✅ `company_id` ahora se persiste al root del document (no dentro de seller_overrides)
2. ✅ `recalcPs` ya no usa closure stale — recibe valuation y overrides como parámetros
3. ✅ Subcategoría partial matching CIS ↔ taxonomía local
4. ✅ handleResolve rehidrata overrides/pricing/panel_status de perfiles existentes
5. ✅ Redirect automático si perfil ya vinculado a empresa
6. ✅ Financials CIS format → flat format para companies API
7. ✅ `valuation_inputs` null-safe en valuation_service

---

## 5. Funcionalidades Implementadas

### Completadas
- Home Page con hero tabs + valoracion
- Marketplace con filtros + share menu
- Seller Wizard V2 (legacy, reemplazado por Workspace)
- **Seller Company Workspace** (modular, 5 paneles) — VALIDADO
- Modulo de Valoracion Publica (lead magnet)
- Planes y Precios (8 planes)
- NDA Mutuo Digital (PDF + audit)
- Buyer Dashboard Premium (6 tabs)
- Buyer Onboarding
- LOI Comparator
- CIS como Master Data Layer
- Financial Visuals (recharts)
- Buyer Deal View con gating estricto
- Formato numerico espanol (formatES.js) global
- **Orquestador de Presentacion de Deals** (Fases 1-3)
  - Contact Request System (manual_review + auto_accept)
  - 5 subagentes: Asset Analyzer, Access Rules, Layout Compositor, CTA Engine, Premium Intelligence (placeholder)
  - Endpoint: `GET /api/deals/{dealId}/presentation`
  - Frontend: DealOrchestratedView, DealActionPanel, DealTeaserPage, DealPreContactPage, DealListingCard, DealPremiumAnalysis
  - Hook: `useDealPresentation(dealId)`
  - Estados: LOCKED_CONTACT_REQUIRED → CONTACT_REQUESTED → TEASER_UNLOCKED / NDA_AVAILABLE → OPERATIVE_ACCESS

### MOCKEADO
- Stripe (pagos)
- SendGrid (emails)

---

## 6. Testing

| Iteración | Scope | Resultado |
|---|---|---|
| 20 | Seller Wizard V2 | 100% |
| 21 | Módulo Valoración | 100% |
| 22 | Planes v1 | 100% |
| 23 | Planes v2 | 100% |
| 24 | NDA + Deep-link | 100% |
| 25 | Buyer Dashboard F1 | 100% |
| 26 | Buyer Dashboard F2 | 100% |
| 27 | Buyer Dashboard F3 | 100% |
| **28** | **Seller Workspace P0** | **100% backend (21/21), 95% frontend** |
| **30** | **Ficha Canonica Orquestada** | **Backend 41/41, Frontend 100%** |

---

## 7. Backlog Pendiente

### P1 (en progreso)
- [x] Orquestador de Presentacion de Deals — Fases 1-3 completadas
- [ ] Orquestador Fase 4 — Premium Intelligence Agent (GPT-5.2 para analisis IA Pro+)

### P2
- [ ] Admin Console — Gestion planes, multiplos, taxonomia
- [ ] PDF export infomemo
- [ ] Activar SendGrid real
- [ ] Advisor dashboard real
- [ ] Deal state transitions UI

### P3
- [ ] Response Time Score interno
- [ ] Validacion documental de empresa

### Limpieza completada (7 abril 2026)
- [x] Eliminado import muerto de `SellerWizard` y `SellerWizardBoceto` de App.js
- [x] LOI Comparator y Buyer Activity Panel reclasificados como OPERATIVOS
