# ARROBA - Product Requirements Document (PRD)

## Version: 1.5.0
## Last Updated: Marzo 2026

---

## 1. Original Problem Statement

Plataforma de compraventa y fusión de agencias digitales (Arroba).
- **Capa Discovery**: Marketplace con teasers anónimos + matching engine
- **Capa Transaccional**: NDA → Infomemo → Interest → LOI → Shortlist → Exclusivity → Data Room → Due Diligence
- **Capa de Acompañamiento**: Deal Manager (BUD Advisors)

---

## 2. Architecture

```
Frontend (React 18 + Tailwind + Shadcn)
├── Pages: Home, Marketplace, DealPage, Auth, BuyerDashboard, BuyerOnboarding, SellerDashboard, SellerWizard, DealManagement
├── Components: UI (shadcn), Layout, NDA Modal, Interest/LOI Forms, Comparator Table, DataRoomSellerTab, DataRoomBuyerView
├── Services: API client (deals, engagements, cif, teaser, infomemo, taxonomy, matching, dataroom)
└── Context: Auth (JWT + Google OAuth, refreshUser)

Backend (FastAPI + Motor)
├── Routers: auth, users, marketplace, companies, deals, infomemo, teaser, cif_lookup, taxonomy, engagements, matching, dataroom, subscriptions
├── Models: user (BuyerProfile), company, deal, engagement
├── Services: valuation, infomemo (GPT-5.2), teaser (GPT-5.2), cif_lookup, iberinform, events, taxonomy, matching_service, match_alerts_service, storage_service
└── Database: MongoDB (users, companies, deals, engagements, saved_deals, ndas, events, cis_financial_cache, teasers, match_alerts, dataroom_documents, dataroom_access_log, dataroom_permissions)
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
- CIF → CIS → Iberinform financial data flow

### v1.2 — Buyer Flow + Taxonomy
- Deal Page (pre/post NDA), NDA Flow, Marketplace, Taxonomy
- Event tracking

### v1.3 — Interest/LOI System
- Unified Engagement model, Seller Comparator Table
- Shortlist (max 3), Exclusivity, Save/Follow Deals

### v1.4 — Buyer Profile & Matching Engine
- Buyer Onboarding (Estratégico vs Financiero subtypes)
- Matching UI: affinity badges (Alta/Media/Baja), "Ordenar por relevancia"
- Profile protection (blocks Interest/LOI if incomplete)
- Match alerts scaffolding (NEW_MATCH_FOUND)

### v1.5 — Data Room (Current)
- **Document Upload** — Seller uploads files (PDF, Excel, Word, images) up to 50MB
  - Stored via Emergent Object Storage (real, not mocked)
  - Organized in 7 folders: Financiero (P&L, Balance, Cash Flow, KPIs), Legal (Estatutos, Contratos, Cap table), Fiscal (Impuestos, Declaraciones), Comercial (Clientes, Pipeline, Contratos), Operaciones (Procesos, Proveedores), Equipo/RRHH (Organigrama, Contratos clave), Otros
  - Subcategory support within each folder
- **Access Control** — Per-buyer, folder-level permissions
  - Base: NDA required to access Data Room
  - Seller can restrict specific buyers to specific folders
  - null = full access, list = restricted folders
- **Access Tracking** — Full audit trail
  - Events: DOCUMENT_UPLOADED, DOCUMENT_VIEWED, DOCUMENT_DOWNLOADED, DATA_ROOM_ACCESSED
  - Logs: buyer_id, deal_id, document_id, action, timestamp
  - Seller sees: buyer name, which document, which folder, when
- **Seller UI** (DealManagement → Data Room tab)
  - Sub-views: Documentos | Permisos | Seguimiento
  - Upload with folder/subcategory selection
  - File tree with expand/collapse per folder
  - Per-buyer permission toggles (folder grid)
  - Access log timeline
- **Buyer UI** (DealPage post-NDA)
  - DataRoomBuyerView with folder tree
  - Download and preview buttons
  - Only sees folders they have permission to access

---

## 4. Complete Loop

```
Register → Buyer Onboarding → Marketplace → Deal Page → NDA → Infomemo + Data Room → Interest → LOI → Shortlist → Exclusivity → Due Diligence
```

---

## 5. Prioritized Backlog

### P0 (Done)
- [x] Interest/LOI/Shortlist/Exclusivity
- [x] Buyer profile & matching engine
- [x] Data Room with access control & tracking

### P1 — Next
- [ ] LOI detailed view for seller
- [ ] Email notifications (SendGrid) — Transactional: NDA signed, Interest received, Shortlist, Exclusivity. Digest: weekly compatible deals
- [ ] TIME_SPENT_ON_DEAL tracking

### P2
- [ ] Request meeting flow
- [ ] Full deal state transitions UI
- [ ] Advisor dashboard
- [ ] Admin panel
- [ ] PDF export infomemo

---

## 6. Key API Endpoints

### Data Room (v1.5)
- `GET /api/dataroom/folders` — Default folder structure
- `POST /api/dataroom/deals/{dealId}/upload` — Upload document
- `GET /api/dataroom/deals/{dealId}/documents` — List documents by folder
- `DELETE /api/dataroom/documents/{docId}` — Soft-delete document
- `GET /api/dataroom/documents/{docId}/download` — Download with tracking
- `GET /api/dataroom/documents/{docId}/view` — View/preview with tracking
- `GET /api/dataroom/deals/{dealId}/permissions` — Get buyer permissions
- `PUT /api/dataroom/deals/{dealId}/permissions/{buyerId}` — Set folder permissions
- `GET /api/dataroom/deals/{dealId}/access-log` — Access audit log

---

*Documento mantenido por el equipo de desarrollo de Arroba*
