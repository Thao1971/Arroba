# PRD.md — Arroba Platform
## Product Requirements Document

---

## Problema Original
Construir "Arroba", una plataforma para comprar y vender agencias digitales. El enfoque ha estado en el flujo E2E del Buyer, optimizacion de conversion y herramientas de toma de decisiones. Reciente enfoque: crear percepcion de mercado que active comportamiento en buyers.

## Usuarios
- **Buyers**: PE, VC, Family Office, Estrategicos, Holdings que buscan adquirir agencias digitales
- **Sellers**: Duenos de agencias digitales que quieren vender
- **Advisors**: Asesores M&A que gestionan mandatos (scaffold)
- **Admin**: Gestion de plataforma (scaffold)

---

## Funcionalidades Implementadas

### Fase 1 — Core Platform
- [x] Auth (JWT + Sessions + Google OAuth via Emergent)
- [x] Buyer Profile & Onboarding
- [x] Seller Profile & Company Management
- [x] Deal CRUD (Draft -> Published)
- [x] AI Teaser Generation (GPT-5.2)
- [x] AI Infomemo Generation (GPT-5.2)
- [x] Marketplace (listado publico de deals)
- [x] NDA digital flow
- [x] Taxonomia oficial BUD (CIS)

### Fase 2 — Buyer E2E Flow
- [x] Interest/LOI unified engagement model
- [x] LOI Detailed View (comparador para seller)
- [x] Matching Engine (buyer-deal scoring 0-100)
- [x] Data Room (upload, download, folders, access control via Emergent Object Storage)
- [x] Time Tracking (useTimeTracker hook, heartbeat 30s)
- [x] Intent Scoring (0-100 basado en actividad)
- [x] Auto-Shortlist Suggestion Engine (RECOMMENDED_SHORTLIST, CONSIDER, LOW_PRIORITY)
- [x] In-App Notifications (high-signal events)
- [x] Decoupled Email Scaffolding (SendGrid placeholder)

### Fase 3 — Auditoria y Demo Data
- [x] Seed Script (`seed_demo.py`) — 10 historias completas con edge cases
- [x] DEMO_SCENARIOS.md, FLOWS.md, ARCHITECTURE.md
- [x] PLAYBOOK_OPERACION.md — Playbook de operacion real
- [x] MODULOS_SISTEMA.md — Diseno de 5 modulos

### Fase 4 — Seller Coaching System v2
- [x] Warning de exclusividad prematura con friccion real
- [x] Nudges PRESCRIPTIVOS con acciones especificas
- [x] Buyers inactivos agrupados con "mas prometedor" identificado
- [x] Action pills en cada nudge
- [x] Dashboard seller con nudges cross-deal + Comparador

### Fase 5 — Navegacion Role-Based + UX Validation
- [x] Header dinamico por rol
- [x] SellerInteresados.js: Centro de decision cross-deal prescriptivo
- [x] Endpoint optimizado GET /api/engagements/seller/interesados
- [x] SavedDeals.js + AdvisorMandatos.js
- [x] Todos los enlaces /marketplace actualizados a /explorar

### Fase 6 — Percepcion de Mercado + Soft Signals (COMPLETADA 23 Mar 2026)
- [x] Internal Deal Score (0-100, backend invisible) — LOIs(35pts), NDA holders(25pts), stages(10pts), freshness(15pts), actividad(15pts)
- [x] Soft Signals (max 2 por deal) con jerarquia estricta:
  1. LOI: "X LOIs recibidas" (rojo)
  2. Competition: "Varios buyers evaluando" / "Varias partes interesadas" (ambar)
  3. Process: "En fase avanzada" / "En negociacion" (ambar)
  4. DR Activity: "Revision activa de documentacion" (azul)
  5. Freshness: "Nuevo esta semana" / "LOI recibida esta semana" / "Interes reciente" (verde)
- [x] Signals en 3 superficies: Marketplace cards, Home featured, Deal detail page
- [x] Marketplace sorted by internal score (Mayor actividad por defecto)
- [x] Deals sin actividad = cards limpias (sin signals)
- [x] Reglas: lenguaje de accion ("evaluando", no "5 views"), sin precision falsa, NDA como umbral minimo para "evaluando"
- [x] Testing: 100% pass rate (16/16 backend, all frontend)

---

## Backlog Priorizado

### P1 — Deal Health System
- [ ] Intent score con decay temporal
- [ ] Alertas de estado en background (deal estancado, buyer inactivo)
- [ ] Deal status monitor (verde/amarillo/rojo)
- [ ] Freshness como factor de urgencia (no solo ordenacion)

### P1 — Buyer Signal Clarity
- [ ] LOI Comparator visual (tabla lado a lado)
- [ ] Activity dashboard por buyer con last_active
- [ ] Intent score con desglose visual

### P1 — Deal Readiness
- [ ] DR readiness check antes de publicar (checklist pre-publicacion)

### P1 — Otros
- [ ] Deal state transitions UI completa
- [ ] PDF export infomemo

### P2
- [ ] Contacto buyer desde Arroba (messaging o email pre-rellenado)
- [ ] Fases de acceso en Data Room (NDA/LOI/DD)
- [ ] Advisor como operador (gestionar deals del seller)
- [ ] Q&A integrado en DD
- [ ] Admin panel / Advisor dashboard
- [ ] Activar SendGrid real
- [ ] Dashboard analytics para seller

---

## Stack Tecnico
- Frontend: React 18 + Tailwind + Shadcn/UI
- Backend: FastAPI (Python 3.11) + MongoDB (Motor async)
- Storage: Emergent Object Storage
- AI: OpenAI GPT-5.2 (Emergent LLM Key)
- Auth: JWT + Sessions + Emergent Google OAuth

## Integraciones
- OpenAI GPT-5.2 (Emergent LLM Key) — Activo
- Emergent Object Storage — Activo
- Iberinform — Activo (test credentials)
- Stripe — Scaffold (test key)
- SendGrid — MOCKEADO (placeholder)
