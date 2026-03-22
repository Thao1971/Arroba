# ARROBA - Product Requirements Document (PRD)

## Version: 1.2.0
## Last Updated: Marzo 2026

---

## 1. Original Problem Statement

Construir una plataforma de compraventa y fusión de agencias digitales (Arroba).
- **Capa Discovery**: Marketplace con teasers anónimos
- **Capa Transaccional**: NDA → Infomemo → LOI → Due Diligence
- **Capa de Acompañamiento**: Deal Manager (BUD Advisors)

---

## 2. Architecture

```
Frontend (React 18 + Tailwind + Shadcn)
├── Pages: Home, Marketplace, DealPage, Auth, Dashboards, SellerWizard, DealManagement
├── Services: API client (cifAPI, teaserAPI, infomemoAPI, taxonomyAPI, dealsAPI, etc.)
└── Context: Auth (JWT + Google OAuth)

Backend (FastAPI + Motor)
├── Routers: auth, users, marketplace, companies, deals, infomemo, teaser, cif_lookup, taxonomy, subscriptions
├── Services: valuation, infomemo (GPT-5.2), teaser (GPT-5.2), cif_lookup, iberinform, events, taxonomy
└── Database: MongoDB (users, companies, deals, ndas, events, cis_financial_cache, teasers)
```

---

## 3. What's Been Implemented

### v1.0 — MVP Core
- ✅ JWT + Google OAuth authentication
- ✅ Frontend design system (Tailwind + Arroba brand)
- ✅ ~60+ backend endpoints
- ✅ Stripe integration
- ✅ OpenAI GPT-5.2 via Emergent LLM Key

### v1.1 — Seller Flow + Teaser/CIF
- ✅ Teaser vs Infomemo separation
- ✅ CIF → CIS → Iberinform financial data flow
- ✅ Teaser generation (AI anonymized)
- ✅ Fixed infomemo update endpoint (JSON body)
- ✅ Markdown rendering (ReactMarkdown + remarkGfm)
- ✅ Financial data source tracking (CIS|IBERINFORM|MANUAL|MIXED)

### v1.2 — Buyer Flow + Taxonomy (Current)
- ✅ **Deal Page** — `/marketplace/:dealId`
  - Pre-NDA: teaser, operation badges, financial sidebar, "Solicitar Acceso" CTA
  - Post-NDA: infomemo (Markdown), company identity, activity log, next steps (LOI + meeting)
  - Price range/valuation visible pre-NDA, exact price only post-NDA
- ✅ **NDA Flow** — Simplified, no friction
  - Click → Modal → Checkbox → Accept → Immediate infomemo access
  - Legal tracking: nda_signed_at, ip, user_id, deal_id, user_agent
  - NDA_SIGNED event tracked
- ✅ **Marketplace Cards** — Updated
  - Operation type badges (Venta Total / Parcial / Fusión)
  - Max 2 highlights per card
  - Uses teaser_full data (revenue_range, ebitda_range)
  - Only Published deals visible (Draft hidden)
- ✅ **Seller Activation Preview**
  - Teaser preview + Infomemo preview
  - Basic buyer matching (by sector) with fallback message
  - Compatible buyers count
- ✅ **Event Tracking** — Basic metrics
  - DEAL_VIEWED, NDA_SIGNED, INFO_MEMO_VIEWED
  - Funnel endpoint: views → clicks → NDA → infomemo
- ✅ **Official BUD Advisors Taxonomy** — MadTech España v2.0
  - 10 hierarchical categories with subcategories
  - Replaces old flat sector list in SellerWizard and Marketplace filters
  - Category ID stored (not just text)
  - Multi-category support (max 3)
  - Legacy mapping for old sector IDs
- ✅ **Deal State Management** — Minimum viable
  - Draft (not visible in marketplace)
  - Published (visible)
  - NDA, Evaluation, Intent, Due Diligence states defined

---

## 4. Prioritized Backlog

### P0 — Next Sprint
- [ ] LOI flow (buyer → seller)
- [ ] Save/Follow deal functionality (buyer)
- [ ] TIME_SPENT_ON_DEAL tracking
- [ ] Buyer profile with taxonomy preference

### P1
- [ ] Data room (post-NDA document sharing)
- [ ] Matching visible in UI
- [ ] Full deal state transitions in UI
- [ ] Notifications (email via SendGrid)

### P2
- [ ] Advisor multi-mandate dashboard
- [ ] Admin panel
- [ ] PDF export for infomemo
- [ ] Advanced marketplace filtering

---

## 5. Key API Endpoints

### New in v1.2
- `GET /api/deals/{id}/page` — Buyer deal page (pre/post NDA)
- `POST /api/deals/{id}/sign-nda` — Frictionless NDA signing
- `GET /api/deals/{id}/activation-preview` — Seller activation preview
- `GET /api/deals/{id}/funnel` — Event funnel metrics
- `GET /api/taxonomy/categories` — BUD Advisors taxonomy
- `GET /api/taxonomy/subcategories` — Flat subcategory list

---

*Documento mantenido por el equipo de desarrollo de Arroba*
