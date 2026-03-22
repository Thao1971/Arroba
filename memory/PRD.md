# PRD.md — Arroba Platform
## Product Requirements Document

---

## Problema Original
Construir "Arroba", una plataforma para comprar y vender agencias digitales. El enfoque ha estado en el flujo E2E del Buyer, optimización de conversión y herramientas de toma de decisiones.

## Usuarios
- **Buyers**: PE, VC, Family Office, Estratégicos, Holdings que buscan adquirir agencias digitales
- **Sellers**: Dueños de agencias digitales que quieren vender
- **Advisors**: Asesores M&A que gestionan mandatos (scaffold)
- **Admin**: Gestión de plataforma (scaffold)

---

## Funcionalidades Implementadas

### Fase 1 — Core Platform
- [x] Auth (JWT + Sessions + Google OAuth via Emergent)
- [x] Buyer Profile & Onboarding
- [x] Seller Profile & Company Management
- [x] Deal CRUD (Draft → Published)
- [x] AI Teaser Generation (GPT-5.2)
- [x] AI Infomemo Generation (GPT-5.2)
- [x] Marketplace (listado público de deals)
- [x] NDA digital flow
- [x] Taxonomía oficial BUD (CIS)

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

### Fase 3 — Auditoría y Demo Data (COMPLETADA 22 Mar 2026)
- [x] Seed Script (`seed_demo.py`) — 10 historias completas con edge cases
- [x] DEMO_SCENARIOS.md — Escenarios mapeados a datos reales del seed
- [x] FLOWS.md — Flujos funcionales completos (Buyer, Seller, Advisor, Admin)
- [x] ARCHITECTURE.md — Documentación técnica del sistema
- [x] PLAYBOOK_OPERACION.md — Playbook de operación real (Advisor + Seller directo) con 18 fricciones
- [x] MODULOS_SISTEMA.md — Diseño de 5 módulos (Coaching, Signal Clarity, Deal Health, Readiness, Communication)

### Fase 4 — Seller Coaching System v1 → v2 (COMPLETADA 22 Mar 2026)
- [x] Warning de exclusividad prematura con fricción real (CONFIRMO obligatorio si buyer no cumple criterios)
- [x] Nudges PRESCRIPTIVOS con acciones específicas: NC-01 análisis de vistas vs NDAs, NC-02 con buyer más activo identificado, NC-03 LOI sin DD con acción directa
- [x] Buyers inactivos agrupados en 1 nudge (no N tarjetas), con "más prometedor" identificado
- [x] Action pills en cada nudge ("Revisar precio", "Contactar", "Mejorar infomemo")
- [x] Dashboard seller con nudges cross-deal + Comparador con nudges por deal
- [x] Exportación documentación: ZIP descargable via /api/exports/documentacion

---

## Backlog Priorizado

### P0 (Próximo)
- [ ] Internal Deal Score — Score backend para ranking/matching (NO público)
- [ ] Soft Signals UI — Badges en marketplace: "Alta actividad", "Proceso avanzado"

### P1 — Deal Health System
- [ ] Intent score con decay temporal
- [ ] Alertas de estado en background (deal estancado, buyer inactivo)
- [ ] Deal status monitor (verde/amarillo/rojo)

### P1 — Deal Readiness
- [ ] DR readiness check antes de publicar (checklist pre-publicación)

### P1 — Buyer Signal Clarity
- [ ] LOI Comparator visual (tabla lado a lado)
- [ ] Activity dashboard por buyer con last_active
- [ ] Intent score con desglose visual

### P1 — Otros
- [ ] Deal state transitions UI completa
- [ ] PDF export infomemo

### P2
- [ ] #7 Contacto buyer desde Arroba (messaging o email pre-rellenado)
- [ ] #3 Fases de acceso en Data Room (NDA/LOI/DD)
- [ ] #1 Advisor como operador (gestionar deals del seller)
- [ ] #15 Q&A integrado en DD
- [ ] Admin panel / Advisor dashboard
- [ ] Activar SendGrid real
- [ ] Dashboard analytics para seller

---

## Stack Técnico
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
