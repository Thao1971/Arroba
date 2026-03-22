# ARROBA - Product Requirements Document (PRD)

## Version: 1.6.0
## Last Updated: Marzo 2026

---

## 1. Original Problem Statement

Plataforma de compraventa y fusión de agencias digitales (Arroba).
- **Capa Discovery**: Marketplace con teasers anónimos + matching engine
- **Capa Transaccional**: NDA → Infomemo → Data Room → Interest → LOI → Shortlist → Exclusivity → Due Diligence
- **Capa de Acompañamiento**: Deal Manager (BUD Advisors)
- **Capa de Señales**: In-app notifications + email alerts para decisiones de shortlist/exclusividad

---

## 2. Architecture

```
Frontend (React 18 + Tailwind + Shadcn)
├── Pages: Home, Marketplace, DealPage, Auth, BuyerDashboard, BuyerOnboarding, SellerDashboard, SellerWizard, DealManagement
├── Components: UI (shadcn), Layout, NDA Modal, Interest/LOI Forms, Comparator Table, DataRoomSellerTab, DataRoomBuyerView, LoiDetailedView, NotificationBell
├── Services: API client (deals, engagements, cif, teaser, infomemo, taxonomy, matching, dataroom, notifications)
└── Context: Auth (JWT + Google OAuth, refreshUser)

Backend (FastAPI + Motor)
├── Routers: auth, users, marketplace, companies, deals, infomemo, teaser, cif_lookup, taxonomy, engagements, matching, dataroom, notifications, subscriptions
├── Services: valuation, infomemo (GPT-5.2), teaser (GPT-5.2), cif_lookup, iberinform, events, taxonomy, matching_service, match_alerts_service, storage_service, notification_service, email_service
└── Database: MongoDB (users, companies, deals, engagements, saved_deals, ndas, events, cis_financial_cache, teasers, match_alerts, dataroom_documents, dataroom_access_log, dataroom_permissions, notifications)
```

---

## 3. What's Been Implemented

### v1.0-v1.3 — Foundation (Done)
- JWT + Google OAuth, Design system, 60+ endpoints, Stripe
- Teaser/Infomemo AI, CIF/Iberinform, NDA, Taxonomy
- Interest/LOI unified, Comparator, Shortlist, Exclusivity

### v1.4 — Buyer Profile & Matching Engine (Done)
- Buyer Onboarding (Estratégico vs Financiero subtypes)
- Matching UI: affinity badges (Alta/Media/Baja), "Ordenar por relevancia"
- Profile protection, Match alerts scaffolding

### v1.5 — Data Room (Done)
- Document Upload to Emergent Object Storage, 7 folders + subcategories
- Per-buyer folder-level access control
- Full access tracking (VIEW/DOWNLOAD/DATA_ROOM_ACCESSED)
- Seller UI (DealManagement tab) + Buyer UI (DealPage post-NDA)

### v1.6 — Notifications & LOI Detail (Current)
- **In-App Notifications (MVP)**
  - High-signal events: DOCUMENT_DOWNLOADED, DATA_ROOM_ACCESSED (first time), LOI_SUBMITTED, INTEREST_SUBMITTED, NDA_SIGNED
  - NotificationBell in header (sellers/admins only, hidden for buyers)
  - Panel with event list, unread badge counter
  - Mark as read / Mark all read
  - Event grouping within 60s window (same event+deal+actor)
  - Toast notifications for downloads + LOI
  - Polling every 30s for new notifications
- **LOI Detailed View (Seller)**
  - New "LOIs" tab in DealManagement
  - Comparative LOI cards with full financial details (valoración, estructura, %, condiciones, vinculante)
  - Data Room activity per buyer (descargas, visualizaciones, carpetas accedidas, último acceso)
  - Signal strength badges: Señal alta (score≥10), media (≥4), baja (<4)
  - Formula: downloads×3 + views×1 + accesses×2
  - "Intereses pendientes de LOI" section with activity signal
  - High-activity buyer insights (automatic flagging)
  - Sorted by signal strength (highest first)
- **Email Service Scaffolding (SendGrid ready, NOT active)**
  - Abstract email service with send_email interface
  - Templates: NDA_SIGNED, INTEREST_SUBMITTED, LOI_SUBMITTED, DATA_ROOM_ACCESSED, DOCUMENT_DOWNLOADED
  - Env vars: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL (empty placeholders)
  - Logs instead of sending when keys not configured
  - Events fire regardless of email status

---

## 4. Complete Loop

```
Register → Buyer Onboarding → Marketplace (matching) → Deal Page → NDA → Infomemo + Data Room → Interest → LOI → Shortlist → Exclusivity
↓ notifications at each step → seller sees signals → decides shortlist/exclusivity
```

---

## 5. Prioritized Backlog

### P0 (Done)
- [x] Full engagement system
- [x] Buyer profile + matching
- [x] Data Room
- [x] In-app notifications
- [x] LOI detailed view

### P1 — Next
- [ ] Activate SendGrid (when user provides API key + verified sender)
- [ ] TIME_SPENT_ON_DEAL tracking (duration metrics)
- [ ] Buyer dashboard: real-time engagement status updates

### P2
- [ ] Request meeting flow
- [ ] Full deal state transitions UI (Evaluation → DD → Close)
- [ ] Advisor dashboard
- [ ] Admin panel
- [ ] PDF export infomemo
- [ ] Document versioning in Data Room (v2)

---

## 6. Key API Endpoints

### Notifications (v1.6)
- `GET /api/notifications` — List notifications (supports unread_only filter)
- `GET /api/notifications/unread-count` — Unread count
- `POST /api/notifications/{id}/read` — Mark single as read
- `POST /api/notifications/read-all` — Mark all as read

### Data Room (v1.5)
- `POST /api/dataroom/deals/{dealId}/upload` — Upload document
- `GET /api/dataroom/deals/{dealId}/documents` — List by folder
- `GET /api/dataroom/documents/{docId}/download` — Download with tracking
- `PUT /api/dataroom/deals/{dealId}/permissions/{buyerId}` — Set folder access
- `GET /api/dataroom/deals/{dealId}/access-log` — Audit trail

---

## 7. SendGrid Integration (Prepared, Not Active)

**Env vars needed (from user):**
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL` (verified sender)

**When activated, sends for:**
- NDA firmado
- Interés recibido
- LOI enviada
- Primer acceso al Data Room
- Descarga de documento

---

*Documento mantenido por el equipo de desarrollo de Arroba*
