# ARROBA - Product Requirements Document (PRD)

## Version: 1.4.0
## Last Updated: Marzo 2026

---

## 1. Original Problem Statement

Plataforma de compraventa y fusión de agencias digitales (Arroba).
- **Capa Discovery**: Marketplace con teasers anónimos
- **Capa Transaccional**: NDA → Infomemo → Interest → LOI → Shortlist → Exclusivity
- **Capa de Acompañamiento**: Deal Manager (BUD Advisors)
- **Capa de Matching**: Buyer Profile → Affinity Engine → Recommended Deals

---

## 2. Architecture

```
Frontend (React 18 + Tailwind + Shadcn)
├── Pages: Home, Marketplace, DealPage, Auth, BuyerDashboard, BuyerOnboarding, SellerDashboard, SellerWizard, DealManagement
├── Components: UI (shadcn), Layout, NDA Modal, Interest Form, LOI Form, Comparator Table
├── Services: API client (dealsAPI, engagementsAPI, cifAPI, teaserAPI, infomemoAPI, taxonomyAPI, matchingAPI)
└── Context: Auth (JWT + Google OAuth, refreshUser)

Backend (FastAPI + Motor)
├── Routers: auth, users, marketplace, companies, deals, infomemo, teaser, cif_lookup, taxonomy, engagements, matching, subscriptions
├── Models: user (BuyerProfile with profile_complete), company, deal, engagement
├── Services: valuation, infomemo (GPT-5.2), teaser (GPT-5.2), cif_lookup, iberinform, events, taxonomy, matching_service, match_alerts_service
└── Database: MongoDB (users, companies, deals, engagements, saved_deals, ndas, events, cis_financial_cache, teasers, match_alerts)
```

---

## 3. What's Been Implemented

### v1.0 — MVP Core
- JWT + Google OAuth authentication
- Frontend design system, Navigation, Homepage
- ~60+ backend endpoints, Stripe integration
- OpenAI GPT-5.2 via Emergent LLM Key

### v1.1 — Seller Flow + Teaser/CIF
- Teaser vs Infomemo separation (AI anonymized)
- CIF → CIS → Iberinform financial data flow (source tracking)
- Fixed infomemo update (JSON body), Markdown rendering

### v1.2 — Buyer Flow + Taxonomy
- Deal Page (pre/post NDA), NDA Flow (no friction, legal tracking)
- Marketplace cards (operation badges, max 2 highlights, teaser_full)
- BUD Advisors Taxonomy (10 hierarchical categories)
- Event tracking (DEAL_VIEWED, NDA_SIGNED, INFO_MEMO_VIEWED)
- Seller Activation Preview with basic buyer matching

### v1.3 — Interest/LOI System
- Unified Engagement model (Interest + LOI)
- Interest Form, LOI Upgrade
- Seller Comparator Table
- Shortlist (max 3), Exclusivity
- Buyer Status Tracking, Save/Follow Deals

### v1.4 — Buyer Profile & Matching Engine (Current)
- **Buyer Onboarding** — Two-step type selection (Estratégico vs Financiero [PE, VC, FO, Holding])
  - Required fields: type, operation_types, taxonomy_categories, ticket_min, revenue_range_min, ebitda_range_min
  - Optional: ticket_max, revenue_range_max, ebitda_range_max, geographies
  - Progress indicator (4 steps)
- **Profile Protection** — Buyers with profile_complete=false redirected to /buyer/onboarding
  - Blocks Interest & LOI submission (backend + frontend)
  - DealPage shows "Perfil incompleto" block instead of Interest form
- **Matching Engine UI**
  - BuyerDashboard: Recommended deals with affinity badges (Alta/Media/Baja afinidad)
  - Marketplace: "Ordenar por relevancia" sort (only for logged-in buyers with complete profile)
  - Marketplace: Affinity badges on deal cards
  - NO numeric scores exposed to frontend — qualitative labels only
- **Seller Activation** — Uses real matching engine data
  - Shows "X buyers altamente compatibles" / "Y buyers potencialmente compatibles"
- **Match Alerts Scaffolding** — NEW_MATCH_FOUND event tracking
  - Triggers on: deal publish, deal update, buyer profile complete/update
  - Weekly digest structure (pending → sent)
  - NO actual email sending (SendGrid not integrated yet)

---

## 4. Complete Loop

```
Register → Buyer Onboarding (if incomplete) → Marketplace → Deal Page → NDA → Infomemo → Interest → LOI → Shortlist → Exclusivity
```

---

## 5. Prioritized Backlog

### P0
- [x] Interest/LOI flow
- [x] Save/Follow deals
- [x] Seller Comparator table
- [x] Shortlist + Exclusivity
- [x] Buyer profile onboarding
- [x] Matching engine UI integration

### P1 — Next
- [ ] Deal Room / Advanced Data Room (post-NDA document sharing)
- [ ] LOI detailed view for seller
- [ ] Email notifications (real SendGrid — NDA signed, interest received, LOI received)
- [ ] TIME_SPENT_ON_DEAL tracking

### P2
- [ ] Request meeting flow
- [ ] Full deal state transitions UI (Evaluation → Intent → DD → Close)
- [ ] Advisor dashboard
- [ ] Admin panel
- [ ] PDF export infomemo

---

## 6. Key API Endpoints

### Matching (v1.4)
- `GET /api/matching/deals` — Recommended deals for buyer (requires auth + profile_complete)
- `GET /api/matching/buyers/{dealId}` — Compatible buyers for seller
- `POST /api/matching/click/{dealId}` — Track match click

### Users (v1.4)
- `PUT /api/users/me/buyer-profile` — Update buyer profile (auto-sets profile_complete)

### Engagements (v1.3)
- `POST /api/engagements/interest` — Submit interest (requires NDA + profile_complete)
- `POST /api/engagements/{id}/upgrade-to-loi` — Upgrade to LOI
- `GET /api/engagements/my-status/{dealId}` — Buyer engagement status
- `GET /api/engagements/deal/{dealId}` — Seller comparator view

---

*Documento mantenido por el equipo de desarrollo de Arroba*
