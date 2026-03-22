# ARROBA - Product Requirements Document (PRD)

## Version: 1.7.0
## Last Updated: Marzo 2026

---

## 1. Original Problem Statement

Plataforma de compraventa y fusión de agencias digitales (Arroba).
- **Capa Discovery**: Marketplace con teasers anónimos + matching engine
- **Capa Transaccional**: NDA → Infomemo → Data Room → Interest → LOI → Shortlist → Exclusivity → DD
- **Capa de Señales**: Intención real = matching + engagement + actividad DR + tiempo invertido
- **Capa de Decisión**: Seller prioriza buyers automáticamente via buyer_intent_score

---

## 2. Architecture

```
Frontend (React 18 + Tailwind + Shadcn)
├── Pages: Home, Marketplace, DealPage, Auth, BuyerDashboard, BuyerOnboarding, SellerDashboard, SellerWizard, DealManagement
├── Components: UI (shadcn), Layout, NDA Modal, Interest/LOI Forms, Comparator Table, DataRoomSellerTab, DataRoomBuyerView, LoiDetailedView, NotificationBell
├── Hooks: useTimeTracker (visibility+activity-based time tracking)
├── Services: API client (deals, engagements, cif, teaser, infomemo, taxonomy, matching, dataroom, notifications, tracking)
└── Context: Auth (JWT + Google OAuth, refreshUser)

Backend (FastAPI + Motor)
├── Routers: auth, users, marketplace, companies, deals, infomemo, teaser, cif_lookup, taxonomy, engagements, matching, dataroom, notifications, tracking, subscriptions
├── Services: valuation, infomemo (GPT-5.2), teaser (GPT-5.2), cif_lookup, iberinform, events, taxonomy, matching_service, match_alerts_service, storage_service, notification_service, email_service, intent_service
└── Database: MongoDB (users, companies, deals, engagements, saved_deals, ndas, events, cis_financial_cache, teasers, match_alerts, dataroom_*, notifications, time_tracking)
```

---

## 3. What's Been Implemented

### v1.0-v1.3 — Foundation
- Auth, Design, 60+ endpoints, Stripe, Teaser/Infomemo AI, NDA, Taxonomy
- Interest/LOI, Comparator, Shortlist, Exclusivity

### v1.4 — Buyer Profile & Matching Engine
- Onboarding, affinity badges, profile protection

### v1.5 — Data Room
- Upload, folders, per-buyer access control, tracking

### v1.6 — Notifications & LOI Detail
- In-app notifications (high-signal), NotificationBell, email scaffolding

### v1.7 — Intent Scoring & Decision Support (Current)
- **TIME_SPENT_ON_DEAL**
  - `useTimeTracker` hook: visibility + activity detection (scroll/click/mousemove)
  - Only counts when tab visible AND user active (60s inactivity timeout)
  - Heartbeat every 30s, session cap 30min, unique session_id per tab
  - Sections: deal_page, infomemo, data_room
  - Backend accumulates per buyer+deal+section+session
- **buyer_intent_score (0-100)**
  - LOI enviada → +40
  - Descargas Data Room → +4 per download (cap +20)
  - Acceso Data Room (≥1) → +10
  - Tiempo en Data Room (≥15 min) → +15
  - Tiempo en Infomemo (≥10 min) → +10
  - Matching alto → +5
  - Levels: Alta (≥55), Media (≥25), Baja (<25)
  - Tooltip shows factor breakdown on click (transparencia)
- **Seller Decision View (LOIs tab)**
  - 3-column LOI cards: Oferta | Data Room | Tiempo invertido
  - Default sort by intent score (highest first)
  - Quick filters: Todos | Con LOI | Alta intención
  - Intent badges: Alta/Media/Baja intención
  - Inline actions: Shortlist | Rechazar | Exclusividad
  - "Intereses pendientes de LOI" section with intent + actions
- **Buyer Dashboard "Mis Procesos"**
  - Timeline per deal with current stage (Enviado → Visto → Shortlist → Rechazado → Exclusividad)
  - Suggested next step per deal (Revisar DR, Enviar LOI, Preparar DD, etc.)
  - Only shows deals with engagement (no ruido)
  - CTA directo a cada Deal Page
- **Events**: TIME_TRACKED, INTENT_SCORE_UPDATED (recalc on LOI/download/time thresholds)

---

## 4. Complete Signal Chain

```
Buyer Activity:
  View Deal → NDA → Read Infomemo → Browse Data Room → Download Docs → Send Interest → Send LOI
  ↓ all tracked ↓
Signals for Seller:
  matching_score + engagement_type + data_room_activity + time_invested
  ↓ combined into ↓
buyer_intent_score (0-100) → Alta/Media/Baja intención
  ↓ enables ↓
Seller Decision: Sort → Filter → Shortlist → Exclusivity → DD
```

---

## 5. Prioritized Backlog

### Done (all tested 100%)
- [x] Full engagement system (Interest/LOI/Shortlist/Exclusivity)
- [x] Buyer profile + matching engine
- [x] Data Room with access control + tracking
- [x] In-app notifications (high-signal events)
- [x] LOI detailed view with 3-column layout
- [x] TIME_SPENT_ON_DEAL tracking
- [x] buyer_intent_score with factor breakdown
- [x] Buyer Dashboard "Mis Procesos"
- [x] Email scaffolding (SendGrid ready, not active)

### P1 — Next
- [ ] Activate SendGrid (waiting for user credentials: SENDGRID_API_KEY + SENDGRID_FROM_EMAIL)
- [ ] Request meeting flow
- [ ] Advisor dashboard

### P2
- [ ] Full deal state transitions UI (Evaluation → DD → Close)
- [ ] Admin panel
- [ ] PDF export infomemo
- [ ] Document versioning in Data Room (v2)

---

## 6. Key API Endpoints

### Tracking & Intent (v1.7)
- `POST /api/tracking/time` — Record time (deal_page/infomemo/data_room)
- `GET /api/tracking/intent/{dealId}` — All buyers intent scores for a deal
- `GET /api/tracking/intent/{dealId}/{buyerId}` — Single buyer intent with factors

### Engagements (v1.7)
- `GET /api/engagements/my-processes` — Buyer's active deal processes with next steps

---

*Documento mantenido por el equipo de desarrollo de Arroba*
