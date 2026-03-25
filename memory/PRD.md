# PRD.md — Arroba Platform
## Product Requirements Document

---

## Problema Original
Construir "Arroba", plataforma M&A para comprar y vender agencias digitales. Enfoque en UX prescriptivo, percepcion de mercado y diseno institucional.

## Design System: "The Digital Artifact"
- Font: IBM Plex Sans (400-800)
- Border radius: 0px globally (sharp edges)
- Surface hierarchy: #f9f9f9 (bg), #f3f3f3 (surface-1), #e2e2e2 (surface-2), #ffffff (cards)
- Primary: #B6212A (Rojo Coral oscuro)
- Secondary: #006493 (Blue)
- Tertiary: #6F5D00 (Gold)
- Labels: ALL CAPS, 0.05em letter-spacing, 10px, weight 700
- Inputs: Ghost borders (bottom-only), surface-2 background
- Buttons: 0px radius, primary bg, uppercase, shadow
- Cards: surface-lowest bg, ambient shadow, no visible borders
- No dividers — white space separation

---

## Funcionalidades Implementadas

### Fase 1 — Core Platform
- [x] Auth (JWT + Sessions + Google OAuth via Emergent)
- [x] Buyer/Seller Profile & Onboarding
- [x] Deal CRUD (Draft -> Published)
- [x] AI Teaser/Infomemo Generation (GPT-5.2)
- [x] Marketplace + NDA digital flow
- [x] Taxonomia oficial BUD (CIS)

### Fase 2 — Buyer E2E Flow
- [x] Interest/LOI engagement model
- [x] LOI Detailed View (comparador)
- [x] Matching Engine (0-100)
- [x] Data Room (Emergent Object Storage)
- [x] Time Tracking + Intent Scoring
- [x] Auto-Shortlist + Notifications
- [x] Decoupled Email (SendGrid placeholder)

### Fase 3 — Auditoria y Demo Data
- [x] Seed Script (10 historias), documentacion exportable

### Fase 4 — Seller Coaching System v2
- [x] Nudges prescriptivos, exclusividad con friccion, action pills

### Fase 5 — Navegacion Role-Based
- [x] Header dinamico por rol, SellerInteresados centro de decision

### Fase 6 — Percepcion de Mercado
- [x] Internal Deal Score (invisible, 0-100)
- [x] Soft Signals (max 2 por deal, jerarquia LOI > Competition > Process > DR > Freshness)
- [x] Signals en marketplace, Home, deal page

### Fase 7 — Rediseno Visual Completo (COMPLETADA 25 Mar 2026)
- [x] Design system "The Digital Artifact" aplicado a TODA la web
- [x] Global CSS tokens (index.css) + Tailwind config actualizado
- [x] Header.js: glassmorphism, IBM Plex Sans, role-based nav
- [x] Footer.js: dark bg, ALL CAPS section labels
- [x] Layout.js: surface-0 background
- [x] Home.js: hero editorial, social proof bar, featured deals con signals
- [x] Marketplace.js: header con label MARKETPLACE, filtros, cards con signals
- [x] Login.js: card-arroba, ghost inputs, btn-primary
- [x] SellerInteresados.js: summary cards actualizadas
- [x] SellerWizardBoceto.js: prototipo del nuevo wizard con sidebar + live preview
- [x] Testing: 100% pass rate (9/9 backend, all frontend)

---

## Backlog Priorizado

### P1 — Implementar SellerWizard V2
- [ ] Convertir boceto en wizard funcional real (sidebar + steps + live preview + web scraping)
- [ ] Reemplazar SellerWizard actual con el nuevo diseno

### P1 — Deal Health System
- [ ] Intent score con decay temporal
- [ ] Alertas (deal estancado, buyer inactivo)
- [ ] Monitor verde/amarillo/rojo

### P1 — Buyer Signal Clarity
- [ ] LOI Comparator visual
- [ ] Activity dashboard por buyer

### P1 — Deal Readiness
- [ ] Checklist pre-publicacion

### P2
- [ ] Contacto buyer (messaging), Deal state transitions UI
- [ ] PDF export infomemo, Q&A en DD
- [ ] Advisor como operador, Admin panel
- [ ] Activar SendGrid real

---

## Stack Tecnico
- Frontend: React 18 + Tailwind + Shadcn/UI + IBM Plex Sans
- Backend: FastAPI (Python 3.11) + MongoDB (Motor async)
- Storage: Emergent Object Storage
- AI: OpenAI GPT-5.2 (Emergent LLM Key)

## Integraciones
- OpenAI GPT-5.2 (Emergent LLM Key) — Activo
- Emergent Object Storage — Activo
- Iberinform — Activo (test credentials)
- SendGrid — MOCKEADO
