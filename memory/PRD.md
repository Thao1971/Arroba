# PRD.md — Arroba Platform
## Product Requirements Document

---

## Problema Original
Construir "Arroba", plataforma M&A para comprar y vender agencias digitales. Enfoque en UX prescriptivo, percepcion de mercado y diseno institucional.

## Design System: "The Digital Artifact"
- Font: IBM Plex Sans (400-800)
- Border radius: 0px globally
- Surface hierarchy: #f9f9f9 (bg), #f3f3f3 (surface-1), #e2e2e2 (surface-2), #ffffff (cards)
- Primary: #B6212A, Secondary: #006493, Tertiary: #6F5D00
- Labels: ALL CAPS, 0.05em letter-spacing, 10px, weight 700

---

## Funcionalidades Implementadas

### Fase 1-3 — Core Platform, Buyer Flow, Demo Data
- [x] Auth, Profiles, Deal CRUD, AI Teaser, Marketplace, NDA, Seed data

### Fase 4-5 — Seller Coaching + Role-Based Nav
- [x] Nudges prescriptivos, action pills, header dinamico

### Fase 6 — Percepcion de Mercado
- [x] Internal Deal Score, Soft Signals (LOI > Competition > Process > DR > Freshness)

### Fase 7 — Rediseno Visual "The Digital Artifact"
- [x] Global CSS tokens, todos los componentes rediseñados

### Fase 8 — Q&A Workspace (25 Mar 2026)
- [x] Trigger: INTEREST_ACCEPTED (no SHORTLISTED)
- [x] Stage ACCEPTED en flujo de engagements
- [x] CRUD Q&A, ConversationPage, entradas en SellerInteresados/BuyerDashboard/DealManagement

### Fase 9 — Response Acceleration Layer (25 Mar 2026)
- [x] GET /api/conversations/pending/seller con prioridad
- [x] Bloque "Acciones Pendientes" en SellerDashboard
- [x] Badges pendientes con urgencia en SellerInteresados y DealManagement
- [x] "Hace Xh sin respuesta" en ConversationPage
- [x] Coaching nudge NC-QA-12 (12h) y NC-QA-24 (24h)

### Fase 10 — Deal Readiness (25 Mar 2026)
- [x] GET /api/deals/{deal_id}/readiness — score + checklist
- [x] Obligatorios (70%): teaser, infomemo, revenue, EBITDA, operacion, precio, DR min docs, taxonomia
- [x] Recomendados (30%): DR ampliado, credenciales, carpetas, equipo, matching, revision manual
- [x] Status: LISTO (>=90%), MEJORABLE (>=60%), DEBIL (<60%)
- [x] Readiness widget en DealManagement overview con CTAs directos
- [x] Publish warning modal (bloqueo suave, no duro)
- [x] Activate endpoint con force param: confirm_required si faltan obligatorios

### Fase 11 — Deal Health System (25 Mar 2026)
- [x] GET /api/deals/{deal_id}/health — semaforo VERDE/AMARILLO/ROJO
- [x] Alertas estructuradas: problema + causa probable + accion recomendada
- [x] NC-01 Sin traccion, NC-02 Sin conversion, NC-03 LOI sin DD, NC-04 Buyer inactivo
- [x] NC-05 Exclusividad estancada, NC-QA Q&A stale, DH-NDA NDA sin interest
- [x] Health indicator en header de DealManagement
- [x] Alert cards con severity borders, category badges, CTAs
- [x] Integrado con coaching system existente (no sistema separado)

---

## Backlog Priorizado

### P1 — SellerWizard V2
- [ ] Convertir boceto en wizard funcional (sidebar + steps + live preview)
- [ ] Reemplazar SellerWizard actual

### P1 — Buyer Signal Clarity
- [ ] LOI Comparator visual dashboard
- [ ] Activity dashboard por buyer

### P2
- [ ] Deal state transitions UI
- [ ] PDF export infomemo
- [ ] Advisor como operador, Admin panel
- [ ] Activar SendGrid real
- [ ] Response Time Score interno (solo coaching, no visible)

---

## Stack Tecnico
- Frontend: React 18 + Tailwind + Shadcn/UI + IBM Plex Sans
- Backend: FastAPI + MongoDB (Motor async)
- Storage: Emergent Object Storage
- AI: OpenAI GPT-5.2 (Emergent LLM Key)

## Integraciones
- OpenAI GPT-5.2 — Activo (Emergent LLM Key)
- Emergent Object Storage — Activo
- Iberinform — Activo (test credentials)
- SendGrid — MOCKEADO

## Engagement Stage Flow
SUBMITTED → VIEWED → ACCEPTED (crea Q&A) → SHORTLISTED → EXCLUSIVITY

## Cuentas de prueba
- Seller: diego.martin@rankingdigital.es / demo2026
- Buyer: carlos.ruiz@capitaliberica.es / demo2026
- Buyer: james.harris@techventures.co.uk / demo2026
- Password universal: demo2026
