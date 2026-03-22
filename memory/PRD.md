# ARROBA - Product Requirements Document (PRD)

## Version: 1.0.0
## Last Updated: Enero 2026

---

## 1. Original Problem Statement

Construir una plataforma de compraventa y fusión de agencias digitales (Arroba) con las siguientes características:
- **Capa Discovery (pública)**: Marketplace para exploración de oportunidades
- **Capa Transaccional (gestionada)**: Proceso estructurado para NDA, infomemo, LOIs, data room
- **Capa de Acompañamiento**: Deal Manager interno de BUD Advisors

### User Choices
- Pagos: Stripe
- Auth: JWT + Google OAuth (Emergent)
- LLM: OpenAI GPT-5.2 (Emergent LLM Key)
- MVP: Core completo (16 módulos)
- Advisor: Incluido en v1
- Infomemo: Generación con IA

### Navigation Structure (Updated Jan 2026)
- Header: Logo "arroba" + tagline "Compra y vende agencias"
- Main Nav: Comprar | Vender | Fusionarse (each with mega-dropdown)
- Right: Mi cuenta
- Dropdown includes: Inversores, Listado de agencias, Planes, Footer links

---

## 2. User Personas

### Buyers
- **Estratégicos**: Agencias/grupos que buscan adquirir competidores o expandirse
- **Financieros**: PE, Family Office, Search Fund, Independent Sponsor, VC
- **Ticket**: Desde 500k€ hasta 20M€

### Sellers
- Propietarios de agencias digitales que quieren vender total o parcialmente
- Buscan confidencialidad y proceso estructurado

### Advisors
- Asesores M&A que representan múltiples compañías
- Necesitan gestión multi-mandato

---

## 3. Core Requirements (Static)

### Autenticación
- [x] JWT + Session-based auth
- [x] Google OAuth via Emergent
- [x] Roles: Buyer, Seller, Advisor, Admin

### Marketplace
- [x] Listado público de deals
- [x] Filtros: sector, operación, facturación, país
- [x] Deal teaser cards (acrónimo, sector, métricas)

### Companies
- [x] CRUD de compañías
- [x] Datos financieros (3 años)
- [x] Motor de valoración automático

### Deals
- [x] Máquina de estados (draft→published→...→closed)
- [x] Teaser generation
- [x] Readiness checklist

### Infomemo IA
- [x] Integración OpenAI GPT-5.2
- [x] Generación automática de documento profesional

### Pagos
- [x] Integración Stripe
- [x] Planes: Buyer (99€/mes), Seller (999€), Advisor (199€/mes)

---

## 4. What's Been Implemented

### Enero 2026 - MVP Core

#### Backend (FastAPI + MongoDB)
- ✅ Estructura completa de carpetas y modelos
- ✅ 10 modelos Pydantic: User, Company, Deal, LOI, NDA, Mandate, Match, Notification, Subscription
- ✅ Routers: auth, users, marketplace, companies, deals, infomemo, subscriptions
- ✅ Servicios: valuation_service, infomemo_service
- ✅ Auth dual: JWT + Session-based + Google OAuth
- ✅ ~60 endpoints API

#### Frontend (React + Tailwind)
- ✅ Design System con colores Arroba (coral, blue, yellow, green)
- ✅ Tipografía IBM Plex Sans + serif italic para headlines
- ✅ Logo pixelado/dots con tagline
- ✅ Componentes UI base (Button, Input, Select, Card, Navigation Menu)
- ✅ Layout (Header con mega-dropdowns, Footer)
- ✅ Páginas: Home (nuevo diseño), Marketplace, Login, Register, BuyerDashboard, SellerDashboard, AuthCallback
- ✅ Navigation: Comprar | Vender | Fusionarse con dropdowns
- ✅ Hero: Cards de agencia y contacto
- ✅ Context de autenticación

#### Integraciones
- ✅ Stripe (checkout sessions, webhooks)
- ✅ OpenAI GPT-5.2 via Emergent LLM Key
- ✅ Google OAuth via Emergent Auth

---

## 5. Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Company creation wizard (frontend)
- [ ] Financial data entry form
- [ ] Deal creation wizard
- [ ] Infomemo preview/edit UI
- [ ] NDA signing flow
- [ ] LOI submission form

### P1 - High Priority
- [ ] Buyer profile completion form
- [ ] Matching engine algorithm
- [ ] Deal detail page (post-NDA)
- [ ] Data room upload/view
- [ ] Subscription activation flow
- [ ] Notifications UI

### P2 - Medium Priority
- [ ] Advisor multi-mandate dashboard
- [ ] Admin panel
- [ ] Email notifications (SendGrid)
- [ ] PDF generation for infomemo
- [ ] Analytics dashboard

### P3 - Nice to Have
- [ ] Iberinform API integration (v2)
- [ ] Export to Excel
- [ ] Activity timeline
- [ ] Chat/messaging
- [ ] Multi-language support

---

## 6. Technical Architecture

```
Frontend (React 18)
├── Pages: Home, Marketplace, Auth, Dashboards
├── Components: UI, Layout, Forms
├── Services: API client
├── Context: Auth
└── Styling: Tailwind + Custom CSS

Backend (FastAPI)
├── Routers: auth, users, marketplace, companies, deals, infomemo, subscriptions
├── Models: Pydantic schemas
├── Services: valuation, infomemo (OpenAI)
├── Database: MongoDB (Motor async driver)
└── Integrations: Stripe, Emergent Auth, Emergent LLM

Database (MongoDB)
├── users
├── companies
├── deals
├── subscriptions
├── lois
├── ndas
├── matches
├── notifications
└── events
```

---

## 7. Next Tasks

1. **Implement Company Wizard** - Frontend form para crear/editar compañía con datos financieros
2. **Build Deal Creation Flow** - Formulario de creación de deal con checklist de readiness
3. **Add Infomemo Preview** - Visualización y edición del infomemo generado
4. **Create NDA Signing Flow** - Flujo completo de firma digital de NDA
5. **Implement LOI Submission** - Formulario para enviar Letter of Intent

---

## 8. Metrics & KPIs

| Metric | Target | Current |
|--------|--------|---------|
| Deals publicados | 20+ | 0 |
| Usuarios registrados | 100+ | 1 (test) |
| Conversion registro→suscripción | >15% | N/A |
| NDAs firmados / deal | >5 | N/A |

---

## 9. API Documentation

Base URL: `https://system-design-doc.preview.emergentagent.com/api`

### Auth
- POST `/auth/register` - Registro
- POST `/auth/login` - Login
- GET `/auth/me` - Usuario actual
- POST `/auth/session` - OAuth callback

### Marketplace
- GET `/marketplace/deals` - Listar deals
- GET `/marketplace/sectors` - Sectores
- GET `/marketplace/stats` - Estadísticas

### Companies
- POST `/companies` - Crear
- GET `/companies` - Listar propias
- PUT `/companies/:id` - Actualizar
- POST `/companies/:id/financials` - Datos financieros
- POST `/companies/:id/calculate-valuation` - Calcular valoración

### Deals
- POST `/deals` - Crear
- GET `/deals` - Listar propios
- POST `/deals/:id/activate` - Publicar
- POST `/deals/:id/sign-nda` - Firmar NDA

---

*Documento mantenido por el equipo de desarrollo de Arroba*
