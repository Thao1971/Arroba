# ARROBA - Product Requirements Document (PRD)

## Version: 1.3.0
## Last Updated: Marzo 2026

---

## 1. Original Problem Statement

Plataforma de compraventa y fusión de agencias digitales (Arroba).
- **Capa Discovery**: Marketplace con teasers anónimos
- **Capa Transaccional**: NDA → Infomemo → Interest → LOI → Shortlist → Exclusivity
- **Capa de Acompañamiento**: Deal Manager (BUD Advisors)

---

## 2. Architecture

```
Frontend (React 18 + Tailwind + Shadcn)
├── Pages: Home, Marketplace, DealPage, Auth, Dashboards, SellerWizard, DealManagement
├── Components: UI (shadcn), Layout, NDA Modal, Interest Form, LOI Form, Comparator Table
├── Services: API client (dealsAPI, engagementsAPI, cifAPI, teaserAPI, infomemoAPI, taxonomyAPI)
└── Context: Auth (JWT + Google OAuth)

Backend (FastAPI + Motor)
├── Routers: auth, users, marketplace, companies, deals, infomemo, teaser, cif_lookup, taxonomy, engagements, subscriptions
├── Models: user, company, deal, engagement, transactions
├── Services: valuation, infomemo (GPT-5.2), teaser (GPT-5.2), cif_lookup, iberinform, events, taxonomy
└── Database: MongoDB (users, companies, deals, engagements, saved_deals, ndas, events, cis_financial_cache, teasers)
```

---

## 3. What's Been Implemented

### v1.0 — MVP Core
- ✅ JWT + Google OAuth authentication
- ✅ Frontend design system, Navigation, Homepage
- ✅ ~60+ backend endpoints, Stripe integration
- ✅ OpenAI GPT-5.2 via Emergent LLM Key

### v1.1 — Seller Flow + Teaser/CIF
- ✅ Teaser vs Infomemo separation (AI anonymized)
- ✅ CIF → CIS → Iberinform financial data flow (source tracking)
- ✅ Fixed infomemo update (JSON body), Markdown rendering

### v1.2 — Buyer Flow + Taxonomy
- ✅ Deal Page (pre/post NDA), NDA Flow (no friction, legal tracking)
- ✅ Marketplace cards (operation badges, max 2 highlights, teaser_full)
- ✅ BUD Advisors Taxonomy (10 hierarchical categories)
- ✅ Event tracking (DEAL_VIEWED, NDA_SIGNED, INFO_MEMO_VIEWED)
- ✅ Seller Activation Preview with basic buyer matching

### v1.3 — Interest/LOI System (Current)
- ✅ **Unified Engagement model** — Single model for Interest + LOI
  - Type: INTEREST | LOI
  - Stage: SUBMITTED → VIEWED → SHORTLISTED → REJECTED → EXCLUSIVITY
  - LOI always born from existing Interest (upgrade path)
- ✅ **Interest Form** — Rango valoración, tipo operación, mensaje, checkbox legal
  - Only buyers with NDA can submit (enforced)
  - Blocks duplicates
- ✅ **LOI Upgrade** — Valoración propuesta, estructura (cash/earn-out/mixto), % adquisición, condiciones, vinculante flag
- ✅ **Seller Comparator** — Table view with:
  - Columns: Buyer (tipo), Estado, Rango/Oferta, Operación, Fecha, Acciones
  - Sortable by date or valuation
  - Auto-marks SUBMITTED → VIEWED on seller view
- ✅ **Shortlist** — Max 3 buyers, add/remove, visible in buyer status
- ✅ **Exclusivity** — Blocks new interests/LOIs, changes deal status
- ✅ **Buyer Status Tracking** — Visible stages (Enviado, Visto, Shortlist, Rechazado, Exclusividad)
- ✅ **Save/Follow Deals** — Bookmark button, saved deals list
- ✅ **Events**: INTEREST_SUBMITTED, LOI_SUBMITTED, BUYER_SHORTLISTED, BUYER_REJECTED, EXCLUSIVITY_GRANTED, INTEREST_VIEWED, DEAL_SAVED

---

## 4. Complete Loop

```
Marketplace → Deal Page → NDA → Infomemo → Interest → LOI → Shortlist → Exclusivity
```

---

## 5. Prioritized Backlog

### P0
- [x] Interest/LOI flow
- [x] Save/Follow deals
- [x] Seller Comparator table
- [x] Shortlist + Exclusivity

### P1 — Next
- [ ] Buyer profile (tipo: estratégico/financiero, sectores, ticket)
- [ ] LOI detailed view for seller
- [ ] Data room (post-NDA document sharing)
- [ ] Email notifications (NDA signed, interest received, LOI received)
- [ ] TIME_SPENT_ON_DEAL tracking

### P2
- [ ] Request meeting flow
- [ ] Full deal state transitions UI (Evaluation → Intent → DD → Close)
- [ ] Advisor dashboard
- [ ] Admin panel
- [ ] PDF export infomemo

---

## 6. Key API Endpoints

### Engagements (v1.3)
- `POST /api/engagements/interest` — Submit interest (requires NDA)
- `POST /api/engagements/{id}/upgrade-to-loi` — Upgrade to LOI
- `GET /api/engagements/my-status/{dealId}` — Buyer engagement status
- `GET /api/engagements/deal/{dealId}` — Seller comparator view
- `POST /api/engagements/deal/{id}/shortlist/{buyerId}` — Add to shortlist
- `DELETE /api/engagements/deal/{id}/shortlist/{buyerId}` — Remove from shortlist
- `POST /api/engagements/deal/{id}/reject/{buyerId}` — Reject buyer
- `POST /api/engagements/deal/{id}/exclusivity/{buyerId}` — Grant exclusivity
- `POST /api/engagements/save/{dealId}` — Save deal
- `DELETE /api/engagements/save/{dealId}` — Unsave deal
- `GET /api/engagements/saved` — List saved deals

---

*Documento mantenido por el equipo de desarrollo de Arroba*
