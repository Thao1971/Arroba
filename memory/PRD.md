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

---

## Funcionalidades Implementadas

### Fase 1-3 — Core Platform, Buyer Flow, Demo Data
- [x] Auth, Profiles, Deal CRUD, AI Teaser, Marketplace, NDA, Taxonomia, Seed

### Fase 4 — Seller Coaching System v2
- [x] Nudges prescriptivos, exclusividad con friccion, action pills

### Fase 5 — Navegacion Role-Based
- [x] Header dinamico por rol, SellerInteresados centro de decision

### Fase 6 — Percepcion de Mercado
- [x] Internal Deal Score, Soft Signals, Market signals en UI

### Fase 7 — Rediseno Visual Completo
- [x] Design system "The Digital Artifact" aplicado a TODA la web

### Fase 8 — Q&A Workspace / Conversaciones (COMPLETADA 25 Mar 2026)
- [x] Trigger: INTEREST_ACCEPTED (no SHORTLISTED)
- [x] Nuevo stage "ACCEPTED" en flujo de engagements
- [x] Backend CRUD Q&A completo (preguntas, respuestas, cierre)
- [x] UI: DealManagement (boton Aceptar, tab Q&A), SellerInteresados (badge Q&A), BuyerDashboard (link Q&A)
- [x] ConversationPage workspace estructurado
- [x] Testing: 100% (18/18 backend, all frontend) — Iteracion 16

### Fase 9 — Response Acceleration Layer (COMPLETADA 25 Mar 2026)
- [x] GET /api/conversations/pending/seller — preguntas pendientes con prioridad (oldest → intent → stage)
- [x] Bloque "Acciones Pendientes" en SellerDashboard: count + buyers waiting + CTA + preview items
- [x] Notificacion mejorada: "X esta esperando tu respuesta" (no generico)
- [x] Badges pendientes con urgencia en SellerInteresados (count + "urgente" si >24h)
- [x] Badges pendientes en DealManagement: tab Q&A con count, comparator Q&A link con pendientes
- [x] "Hace Xh sin respuesta" indicador en ConversationPage por pregunta PENDING
- [x] Ordenacion por prioridad: PENDING oldest → ANSWERED → CLOSED
- [x] Coaching nudge automatico: NC-QA-12 (12h), NC-QA-24 (24h) — no repetitivo
- [x] Enriquecimiento: interesados, deal engagements, my-processes con pending_questions/urgency
- [x] Testing: 100% (14/14 backend, all frontend) — Iteracion 17

---

## Backlog Priorizado

### P1 — Deal Health System
- [ ] Intent score con decay temporal
- [ ] Alertas (deal estancado, buyer inactivo)
- [ ] Monitor verde/amarillo/rojo

### P1 — Deal Readiness
- [ ] Checklist pre-publicacion

### P1 — SellerWizard V2
- [ ] Convertir boceto en wizard funcional real

### P1 — Buyer Signal Clarity
- [ ] LOI Comparator visual
- [ ] Activity dashboard por buyer

### P2
- [ ] Deal state transitions UI
- [ ] PDF export infomemo
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

## Engagement Stage Flow
SUBMITTED → VIEWED → ACCEPTED (crea conversacion Q&A) → SHORTLISTED → EXCLUSIVITY

## Cuentas de prueba
- Seller: diego.martin@rankingdigital.es / demo2026
- Buyer: carlos.ruiz@capitaliberica.es / demo2026
- Buyer: james.harris@techventures.co.uk / demo2026
