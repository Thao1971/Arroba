# PRD.md — Arroba Platform
## Product Requirements Document

---

## Problema Original
Construir "Arroba", una plataforma para comprar y vender agencias digitales. El enfoque ha estado en el flujo E2E del Buyer, optimizacion de conversion y herramientas de toma de decisiones.

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

### Fase 3 — Auditoria y Demo Data (COMPLETADA 22 Mar 2026)
- [x] Seed Script (`seed_demo.py`) — 10 historias completas con edge cases
- [x] DEMO_SCENARIOS.md — Escenarios mapeados a datos reales del seed
- [x] FLOWS.md — Flujos funcionales completos (Buyer, Seller, Advisor, Admin)
- [x] ARCHITECTURE.md — Documentacion tecnica del sistema
- [x] PLAYBOOK_OPERACION.md — Playbook de operacion real (Advisor + Seller directo) con 18 fricciones
- [x] MODULOS_SISTEMA.md — Diseno de 5 modulos (Coaching, Signal Clarity, Deal Health, Readiness, Communication)

### Fase 4 — Seller Coaching System v2 (COMPLETADA 22 Mar 2026)
- [x] Warning de exclusividad prematura con friccion real (CONFIRMO obligatorio si buyer no cumple criterios)
- [x] Nudges PRESCRIPTIVOS con acciones especificas: NC-01 analisis de vistas vs NDAs, NC-02 con buyer mas activo identificado, NC-03 LOI sin DD con accion directa
- [x] Buyers inactivos agrupados en 1 nudge (no N tarjetas), con "mas prometedor" identificado
- [x] Action pills en cada nudge ("Revisar precio", "Contactar", "Mejorar infomemo")
- [x] Dashboard seller con nudges cross-deal + Comparador con nudges por deal
- [x] Exportacion documentacion: ZIP descargable via /api/exports/documentacion

### Fase 5 — Navegacion Role-Based + UX Validation (COMPLETADA 23 Mar 2026)
- [x] Header dinamico por rol: Publico (Explorar/Vender/Como funciona), Buyer (Explorar/Mis procesos/Guardados), Seller (Mis deals/Interesados/Explorar), Advisor (Mandatos/Interesados/Explorar)
- [x] Dropdown usuario: nombre, rol, Mi panel, Configuracion, Cerrar sesion
- [x] Home.js: enlaces actualizados (/explorar en vez de /marketplace), texto duplicado corregido
- [x] SellerInteresados.js: Centro de decision cross-deal con:
  - Summary cards (Total buyers, LOIs recibidas, Alta intencion, Requieren accion)
  - Nudges prescriptivos con action pills
  - Tabla con columna "Que hacer" prescriptiva por buyer
  - Dots de urgencia (rojo/ambar/gris)
  - Barras de intencion (verde/ambar/gris)
  - Ultima actividad relativa
  - Leyenda de urgencia en footer
- [x] Endpoint optimizado GET /api/engagements/seller/interesados (una sola llamada)
- [x] SavedDeals.js: Vista de deals guardados con datos enriquecidos
- [x] Endpoint GET /api/engagements/saved devuelve datos completos (no solo IDs)
- [x] AdvisorMandatos.js: Placeholder "Proximamente" con features preview
- [x] Rutas publicas actualizadas en api.js interceptor (/explorar, /como-funciona, /vender)
- [x] Testing: 100% pass rate (16/16 backend, all frontend flows)

---

## Backlog Priorizado

### P0 (Proximo)
- [ ] Internal Deal Score — Score backend para ranking/matching (NO publico)
- [ ] Soft Signals UI — Badges en marketplace: "Alta actividad", "Proceso avanzado"

### P1 — Deal Health System
- [ ] Intent score con decay temporal
- [ ] Alertas de estado en background (deal estancado, buyer inactivo)
- [ ] Deal status monitor (verde/amarillo/rojo)

### P1 — Deal Readiness
- [ ] DR readiness check antes de publicar (checklist pre-publicacion)

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
