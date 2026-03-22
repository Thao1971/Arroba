# ARROBA - Product Requirements Document (PRD)

## Version: 1.1.0
## Last Updated: Marzo 2026

---

## 1. Original Problem Statement

Construir una plataforma de compraventa y fusión de agencias digitales (Arroba) con las siguientes características:
- **Capa Discovery (pública)**: Marketplace con teasers anónimos para exploración
- **Capa Transaccional (gestionada)**: Proceso estructurado para NDA, infomemo, LOIs, data room
- **Capa de Acompañamiento**: Deal Manager interno de BUD Advisors

### User Choices
- Pagos: Stripe
- Auth: JWT + Google OAuth (Emergent)
- LLM: OpenAI GPT-5.2 (Emergent LLM Key)
- MVP: Core completo (16 módulos)
- Advisor: Incluido en v1
- Infomemo: Generación con IA
- Teaser: Generación anonimizada con IA
- Datos Financieros: CIF → CIS → Iberinform → Manual

---

## 2. User Personas

### Buyers
- **Estratégicos**: Agencias/grupos que buscan adquirir
- **Financieros**: PE, Family Office, Search Fund, VC
- **Ticket**: 500k€ - 20M€

### Sellers
- Propietarios de agencias digitales
- Buscan confidencialidad y proceso estructurado

### Advisors
- Asesores M&A multi-mandato

---

## 3. Core Architecture

```
Frontend (React 18)
├── Pages: Home, Marketplace, Auth, Dashboards, SellerWizard, DealManagement
├── Components: UI (shadcn), Layout
├── Services: API client (cifAPI, teaserAPI, infomemoAPI, etc.)
├── Context: Auth
└── Styling: Tailwind + Custom CSS

Backend (FastAPI)
├── Routers: auth, users, marketplace, companies, deals, infomemo, teaser, cif_lookup, subscriptions
├── Models: Pydantic schemas (Financial with data_source tracking)
├── Services: valuation, infomemo (GPT-5.2), teaser (GPT-5.2), cif_lookup, iberinform
├── Database: MongoDB (Motor async driver)
└── Integrations: Stripe, Emergent Auth, Emergent LLM, Iberinform API

Database (MongoDB)
├── users, companies, deals, subscriptions, lois, ndas, matches
├── notifications, events, user_sessions, payment_transactions
├── infomemos, cis_financial_cache, teasers
```

---

## 4. What's Been Implemented

### Enero 2026 - MVP Core
- ✅ Base project structure, FastAPI + MongoDB
- ✅ JWT + Google OAuth authentication
- ✅ Frontend design system (Tailwind + Arroba colors)
- ✅ Navigation (Comprar | Vender | Fusionarse)
- ✅ Homepage, Marketplace, Auth pages
- ✅ ~60 backend endpoints
- ✅ Stripe integration
- ✅ OpenAI GPT-5.2 via Emergent LLM Key

### Marzo 2026 - Seller Flow + Teaser/CIF
- ✅ **Teaser vs Infomemo separation** — Two distinct content pieces
  - Teaser: anonymized public discovery content with AI generation
  - Infomemo: detailed post-NDA document with AI generation
- ✅ **CIF → CIS → Iberinform flow** — Financial data lookup with source tracking
  - CIS internal cache (MongoDB collection)
  - Iberinform API integration (identification, financial data)
  - Manual fallback
  - Data source tracking: CIS | IBERINFORM | MANUAL | MIXED
- ✅ **Teaser generation service** — AI-powered anonymized teaser
  - Removes company names, URLs, identifying info
  - Uses ranges instead of exact values (revenue, EBITDA, employees)
  - Includes growth indicators, recurring revenue indicators
- ✅ **Fixed infomemo update endpoint** — JSON body instead of query params
- ✅ **Markdown rendering** — ReactMarkdown + remarkGfm for infomemo preview
- ✅ **SellerWizard rewrite** — 5-step wizard with:
  - Step 0: CIF lookup with auto-populate
  - Step 1: Financial data with data source badges
  - Step 4: Teaser + Infomemo with preview/edit toggle
- ✅ **DealManagement update** — Markdown infomemo, teaser preview
- ✅ All backend tests passing (22/22)

---

## 5. Prioritized Backlog

### P0 - Critical (Next Sprint)
- [x] Teaser generation service
- [x] Teaser vs Infomemo separation
- [x] CIF → CIS → Iberinform flow
- [x] Fix infomemo update endpoint
- [ ] NDA signing flow (buyer side: request access → approval → sign NDA → view infomemo)
- [ ] Deal state management UI (transitions from Published onward)

### P1 - High Priority
- [ ] Buyer profile completion form
- [ ] Marketplace teaser cards (show anonymized teasers)
- [ ] Deal detail page for buyers (pre-NDA: teaser, post-NDA: infomemo)
- [ ] Subscription activation flow
- [ ] Notifications UI

### P2 - Medium Priority
- [ ] Advisor multi-mandate dashboard
- [ ] Admin panel
- [ ] Email notifications (SendGrid)
- [ ] PDF generation for infomemo
- [ ] Analytics dashboard

### P3 - Nice to Have
- [ ] Export to Excel
- [ ] Activity timeline
- [ ] Chat/messaging
- [ ] Multi-language support

---

## 6. API Documentation

Base URL: `https://deal-flow-hub-28.preview.emergentagent.com/api`

### Auth
- POST `/auth/register` — Registro
- POST `/auth/login` — Login
- GET `/auth/me` — Usuario actual

### CIF Lookup
- GET `/cif/{cif}/lookup` — Buscar datos por CIF (CIS → Iberinform → Manual)

### Companies
- POST `/companies` — Crear
- GET `/companies` — Listar propias
- PUT `/companies/:id` — Actualizar
- POST `/companies/:id/financials` — Datos financieros (con data_source)
- POST `/companies/:id/calculate-valuation` — Calcular valoración

### Deals
- POST `/deals` — Crear
- GET `/deals` — Listar propios
- POST `/deals/:id/activate` — Publicar

### Teaser
- POST `/teaser/generate/{company_id}` — Generar teaser anonimizado
- GET `/teaser/{deal_id}` — Obtener teaser (público para deals publicados)
- PUT `/teaser/{deal_id}` — Actualizar teaser

### Infomemo
- POST `/infomemo/generate/{company_id}` — Generar infomemo con IA
- GET `/infomemo/{deal_id}` — Obtener infomemo (requiere NDA)
- PUT `/infomemo/{deal_id}` — Actualizar infomemo (JSON body: {content: string})

### Marketplace
- GET `/marketplace/deals` — Listar deals
- GET `/marketplace/sectors` — Sectores
- GET `/marketplace/stats` — Estadísticas

---

*Documento mantenido por el equipo de desarrollo de Arroba*
