# ARROBA — Product Requirements Document (PRD)
## Plataforma M&A para Agencias Digitales
**Última actualización:** 27 de marzo de 2026
**Titular:** BUD Advisors, S.L. · CIF B70821400

---

## 1. Problema y Visión

ARROBA es un marketplace confidencial de compraventa y fusión de agencias digitales del ecosistema MadTech en España. La plataforma conecta sellers (propietarios de agencias), buyers (compradores/inversores) y advisors (asesores de M&A) en un entorno estructurado, seguro y profesional.

**Objetivo:** Ofrecer un proceso M&A ordenado con percepción de mercado, coaching prescriptivo, valoración automatizada y herramientas de gestión de operaciones que transmitan seriedad, confidencialidad y criterio financiero.

---

## 2. Design System: "The Digital Artifact"

| Elemento | Valor |
|---|---|
| Tipografía | IBM Plex Sans (300-800) |
| Border radius | 0px globalmente |
| Surface-0 (fondo) | #f9f9f9 |
| Surface-1 | #f3f3f3 |
| Surface-2 | #e2e2e2 |
| Surface-lowest (cards) | #ffffff |
| Primary (arroba-coral) | #B6212A |
| Secondary (arroba-blue) | #006493 |
| Tertiary | #6F5D00 |
| On-surface | #191c1e |
| On-surface-variant | #45464d |
| Outline | #76777d |
| Labels | ALL CAPS, 0.05em letter-spacing, 10px, weight 700 |
| Hover cards | translateY(-2px), sombra sutil, 150-200ms |
| Layout dashboard | Sidebar izquierda fija + contenido central + rail derecho contextual |

---

## 3. Arquitectura Técnica

### Stack
- **Frontend:** React 18 + Tailwind CSS + Shadcn/UI + IBM Plex Sans
- **Backend:** FastAPI (Python) + MongoDB (Motor async)
- **Storage:** Emergent Object Storage (ficheros, PDFs)
- **AI:** OpenAI GPT-5.2 (vía Emergent LLM Key)
- **PDF:** reportlab (generación de NDA)

### Estructura del proyecto
```
/app/
├── backend/
│   ├── server.py                    # FastAPI app principal
│   ├── database.py                  # Motor MongoDB + colecciones + índices
│   ├── config.py                    # Variables de entorno
│   ├── models/
│   │   ├── user.py                  # UserCreate, UserResponse, BuyerProfile, SellerProfile
│   │   ├── company.py               # Company models
│   │   ├── deal.py                  # Deal models
│   │   ├── engagement.py            # Engagement models
│   │   └── transactions.py          # LOI, NDA, Mandate, Match, Notification, Subscription models
│   ├── routers/
│   │   ├── auth.py                  # JWT auth, Google OAuth, session management
│   │   ├── users.py                 # Profile CRUD
│   │   ├── companies.py             # Company CRUD + financials + valuation
│   │   ├── deals.py                 # Deal CRUD + teaser + NDA legacy
│   │   ├── marketplace.py           # Public marketplace + stats + featured
│   │   ├── engagements.py           # Interest, LOI, stages, my-processes, saved, actions
│   │   ├── conversations.py         # Q&A workspace
│   │   ├── matching.py              # Recommended deals + match_reason
│   │   ├── notifications.py         # In-app notifications + mark read
│   │   ├── nda.py                   # NDA mutuo digital: template, sign, PDF, email, audit
│   │   ├── plans.py                 # Planes y precios (seed + public API)
│   │   ├── buyer_certification.py   # Certificación buyer + plan enforcement
│   │   ├── taxonomy.py              # Taxonomía oficial BUD Advisors MadTech
│   │   ├── cif_lookup.py            # Búsqueda CIF/NIF
│   │   ├── teaser.py                # Generación teaser IA
│   │   ├── infomemo.py              # Generación infomemo IA
│   │   ├── dataroom.py              # Data Room
│   │   ├── coaching.py              # Coaching prescriptivo seller
│   │   ├── tracking.py              # Time tracking + intent scoring
│   │   └── subscriptions.py         # Stripe subscriptions (preparado)
│   ├── modules/
│   │   └── valuation/               # Dominio valoración independiente
│   │       ├── router.py            # API endpoints valoración
│   │       ├── service.py           # Orquestación
│   │       ├── engine.py            # Motor de cálculo
│   │       ├── scoring.py           # Quality score
│   │       ├── config_service.py    # Settings + multiples + seed
│   │       ├── repositories.py      # MongoDB operations
│   │       └── schemas.py           # Pydantic models
│   ├── services/
│   │   ├── email_service.py         # Templates email (MOCKEADO hasta SendGrid)
│   │   ├── matching_service.py      # Match scoring + match_reason
│   │   ├── valuation_service.py     # Valoración legacy (companies)
│   │   ├── coaching_service.py      # Nudges prescriptivos
│   │   ├── deal_health_service.py   # Deal Health semáforo
│   │   ├── deal_score_service.py    # Internal Deal Score + Soft Signals
│   │   ├── readiness_service.py     # Deal Readiness checklist
│   │   ├── taxonomy.py              # Taxonomía MadTech v2.0 (10 categorías)
│   │   ├── storage_service.py       # Emergent Object Storage
│   │   ├── notification_service.py  # Notificaciones in-app
│   │   ├── events_service.py        # Event tracking
│   │   └── ...
│   └── tests/                       # Pytest tests
├── frontend/
│   ├── src/
│   │   ├── App.js                   # Router principal
│   │   ├── pages/
│   │   │   ├── Home.js              # Landing + hero tabs + valoración
│   │   │   ├── Marketplace.js       # Explorar deals + share menu
│   │   │   ├── DealPage.js          # Ficha deal + NDA modal
│   │   │   ├── BuyerDashboard.js    # Dashboard buyer premium (6 tabs)
│   │   │   ├── BuyerOnboarding.js   # Onboarding perfil buyer
│   │   │   ├── SellerDashboard.js   # Dashboard seller
│   │   │   ├── SellerWizard.js      # Wizard V2 (5 pasos + live preview)
│   │   │   ├── DealManagement.js    # Gestión deal seller
│   │   │   ├── SellerInteresados.js # Gestión interesados
│   │   │   ├── PlansPage.js         # Planes y precios
│   │   │   ├── ValuationWizard.js   # Valoración pública (4 pasos)
│   │   │   ├── ConversationPage.js  # Q&A workspace
│   │   │   └── ...
│   │   ├── services/api.js          # Axios API services
│   │   ├── context/AuthContext.js   # Auth state management
│   │   └── components/
│   │       ├── layout/              # Header, Footer, Layout
│   │       └── ui/                  # Shadcn/UI components
│   └── public/
│       ├── index.html               # OG meta tags + título
│       └── og-image.png             # Open Graph image
```

---

## 4. Colecciones MongoDB

| Colección | Descripción |
|---|---|
| `users` | Usuarios (buyer, seller, advisor, admin) |
| `companies` | Compañías registradas por sellers |
| `deals` | Operaciones/deals |
| `engagements` | Interacciones buyer-deal (interest, LOI) |
| `lois` | Letters of Intent |
| `ndas` | NDAs legacy (embebido en deals) |
| `nda_signatures` | NDA mutuo digital v2 (firma, PDF, audit) |
| `nda_events` | Audit trail de firma NDA |
| `nda_templates` | Templates NDA versionados |
| `notifications` | Notificaciones in-app |
| `events` | Event tracking general |
| `matches` | Match scores buyer-deal |
| `saved_deals` | Deals guardados por buyers |
| `infomemos` | Information Memorandums generados |
| `teasers` | Teasers generados |
| `plans` | Planes y precios (8 planes seed) |
| `transaction_fee_rules` | Reglas de comisión (3 rules) |
| `valuation_leads` | Leads de valoración pública |
| `valuation_multiples` | Múltiplos por categoría (10 categorías CIS) |
| `valuation_settings` | Configuración motor valoración |
| `valuation_runs` | Auditoría de cálculos |
| `valuation_premium_requests` | Solicitudes valoración experta |
| `buyer_interactions` | Tracking interacciones mensuales buyer |
| `cis_financial_cache` | Cache datos financieros CIS |
| `subscriptions` | Suscripciones (preparado para Stripe) |
| `payment_transactions` | Transacciones de pago |
| `mandates` | Mandatos de advisors |
| `user_sessions` | Sesiones de usuario |

---

## 5. Endpoints API

### Auth y Usuarios
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro |
| POST | `/api/auth/login` | Login (JWT) |
| GET | `/api/auth/me` | Perfil actual |
| PUT | `/api/users/me` | Actualizar perfil |
| PUT | `/api/users/me/buyer-profile` | Actualizar perfil buyer |

### Marketplace
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/marketplace/deals` | Listar deals publicados |
| GET | `/api/marketplace/deals/{id}` | Detalle deal público |
| GET | `/api/marketplace/stats` | Estadísticas marketplace |
| GET | `/api/marketplace/featured` | Deals destacados |

### Companies y Deals
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/companies` | Crear compañía |
| PUT | `/api/companies/{id}` | Actualizar compañía |
| POST | `/api/companies/{id}/financials` | Actualizar financieros |
| POST | `/api/companies/{id}/calculate-valuation` | Calcular valoración |
| POST | `/api/deals` | Crear deal |
| GET | `/api/deals/{id}` | Detalle deal |
| GET | `/api/deals/{id}/readiness` | Deal Readiness score |
| GET | `/api/deals/{id}/health` | Deal Health semáforo |

### Engagements
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/engagements/interest` | Enviar interés |
| POST | `/api/engagements/{id}/upgrade-to-loi` | Convertir a LOI |
| GET | `/api/engagements/my-processes` | Mis procesos (con actions) |
| GET | `/api/engagements/saved` | Deals guardados |
| POST | `/api/engagements/save/{dealId}` | Guardar deal |

### NDA Mutuo Digital
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/nda/template/{dealId}` | Preview NDA con datos pre-rellenados |
| POST | `/api/nda/sign` | Firmar NDA (genera PDF + audit) |
| GET | `/api/nda/{signatureId}/pdf` | Descargar PDF firmado |
| POST | `/api/nda/{signatureId}/send-email` | Reenviar email confirmación |
| GET | `/api/nda/my-signatures` | Mis NDAs firmados |

### Valoración Pública
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/valuation/taxonomy/categories` | Categorías para valoración |
| GET | `/api/valuation/taxonomy/subcategories/{id}` | Subcategorías |
| GET | `/api/valuation/config/public` | Config pública (disclaimer, premium) |
| POST | `/api/valuation/estimate` | Ejecutar estimación |
| GET | `/api/valuation/my-valuations` | Mis valoraciones |
| POST | `/api/valuation/premium-request` | Solicitar valoración experta |

### Planes y Precios
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/plans/public` | Planes + fees + FAQ + interaction types |

### Buyer Certification
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/buyer/certification` | Estado certificación + plan + interacciones |

### Matching
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/matching/deals` | Deals recomendados con match_reason |

### Q&A, Notificaciones, Coaching
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/conversations/{id}` | Conversación Q&A |
| GET | `/api/notifications` | Notificaciones |
| POST | `/api/notifications/read-all` | Marcar todas leídas |
| GET | `/api/conversations/pending/seller` | Q&A pendientes seller |

---

## 6. Páginas Frontend

| Ruta | Página | Descripción |
|---|---|---|
| `/` | Home | Landing con hero tabs (Vender/Comprar/Fusionarse) + valoración |
| `/explorar` | Marketplace | Explorar deals con filtros + share menu |
| `/explorar/:dealId` | DealPage | Ficha deal + NDA modal + OG dinámico |
| `/valoracion` | ValuationWizard | Valoración pública 4 pasos (protegida) |
| `/planes` | PlansPage | Planes y precios con tabs + deep-link (?role=) |
| `/login` | Login | Acceso |
| `/register` | Register | Registro |
| `/buyer/procesos` | BuyerDashboard | Dashboard buyer premium 6 tabs |
| `/buyer/onboarding` | BuyerOnboarding | Onboarding perfil buyer |
| `/buyer/guardados` | SavedDeals | Deals guardados |
| `/seller/deals` | SellerDashboard | Dashboard seller |
| `/seller/onboarding` | SellerWizard | Wizard V2 (5 pasos) |
| `/seller/deal/:dealId` | DealManagement | Gestión deal |
| `/seller/interesados` | SellerInteresados | Gestión interesados |
| `/qa/:conversationId` | ConversationPage | Q&A workspace |

---

## 7. Funcionalidades Implementadas (Detalle)

### 7.1 Home Page
- Hero con tabs interactivos: Vender / Comprar / Fusionarse (config driven)
- Bloque valoración: "Descubre cuánto podría valer tu agencia" + ejemplo visual
- Deals destacados con menú compartir (3 puntos: copiar URL + Web Share API)
- Open Graph dinámico por deal (og:title, og:description)
- Cómo funciona: 4 pasos (Regístrate → Explora → Entorno seguro → Cierra operación)
- CTA final

### 7.2 Seller Wizard V2
- Layout: sidebar izquierda + 60/40 split (formulario + live preview)
- 5 pasos: Datos básicos (CIF lookup) → Financieros → Valoración → Acuerdo → Teaser/Infomemo
- Generación IA de teaser e infomemo (GPT-5.2)
- Live preview dinámico con métricas

### 7.3 Módulo de Valoración Pública (Lead Magnet)
- Backend dominio independiente: `/modules/valuation/`
- Motor: múltiplos CIS por categoría × quality_factor (margen, eficiencia, recurrencia, crecimiento)
- 4 pasos: Identificación → Compañía → Taxonomía → Momento
- Resultado: rango valoración, valor central, drivers, confianza, disclaimer legal
- Persistencia: leads, runs (auditoría), premium requests
- Email post-resultado (mockeado)
- Upsell valoración experta 1.950€

### 7.4 Planes y Precios
- 8 planes en MongoDB: 3 seller + 3 buyer + 2 advisor
- **Sellers:** Free (0 inter.) → Plus (149€, 5/mes) → Premium (499€, ilimitadas) + 2,9% éxito
- **Buyers:** Free (0 inter.) → Pro (149€, 5/mes) → Pro+ (349€, ilimitadas) + 1% éxito
- **Advisors:** Free (1 mandato) → Pro (250€/mes, 2+ mandatos, 6-12 meses) + 15% honorarios
- Toggle mensual/anual con 10% descuento
- Interacciones como palanca de monetización
- FAQ 7 preguntas, bloque pedagógico comisiones
- Deep-link: `/planes?role=buyer` abre tab correcto

### 7.5 NDA Mutuo Digital
- Texto legal: 10 cláusulas, BUD Advisors S.L., CIF B70821400, jurisdicción Madrid, vigencia 2 años
- Firma electrónica: nombre, email, empresa, cargo, fecha, hora, IP, signature_id
- PDF generado con reportlab, subido a Object Storage
- Auditoría: nda_signatures + nda_events (NDA_SIGNED, EMAIL_SENT)
- Email confirmación NDA_BUYER_SIGNED (mockeado)
- Modal frontend: texto legal scrollable + formulario firmante + checkbox aceptación

### 7.6 Buyer Dashboard Premium
- **Layout:** Sidebar izquierda fija (logo + plan + certificación + 6 secciones + CTAs) + contenido central + rail derecho contextual
- **6 secciones:** Dashboard, Mis procesos, Seguimiento, Recomendados, Alertas, Perfil
- **Dashboard:** 6 KPIs, procesos activos con overlay Free sutil
- **Mis procesos:** Lista con estado/tipo/valoración → detalle con bloque "Siguientes acciones" desde backend
- **Acciones por proceso:** Recommended/Available/Blocked con motivo (firmar NDA, infomemo, data room, Q&A, LOI, reuniones, guardar, retirar)
- **Seguimiento:** Watchlist/guardados con sector, financieros, fecha
- **Recomendados:** Deals con badges afinidad + match_reason explicativo
- **Alertas:** Notificaciones + preferencias (Email/In-app)
- **Perfil:** Datos personales, tesis de inversión, verificación
- **Certificación:** 7 criterios ponderados (COMPLETITUD: email, perfil, cargo, tesis / CONFIANZA: empresa, email corp, NDA)
- **Niveles:** Básico (<50%), Verificado (50-79%), Certificado (≥80%)
- **CTA "COMPLETAR VERIFICACIÓN"** redirige al primer requisito pendiente
- **Plan diferenciación:** Features con Lock/Check + "Desde Pro" / "Solo Pro+"
- **Backend:** GET /api/buyer/certification + _compute_process_actions()

### 7.7 Seller Dashboard y Gestión
- Deal Readiness: checklist obligatorio/recomendado, score, CTAs directos
- Deal Health: semáforo VERDE/AMARILLO/ROJO con alertas prescriptivas
- Response Acceleration: prioridad Q&A, nudges 12h/24h
- Coaching prescriptivo seller con nudges
- Internal Deal Score + Soft Signals

### 7.8 Q&A Workspace
- Trigger: INTEREST_ACCEPTED
- CRUD preguntas/respuestas
- Pendientes con urgencia
- Acceso desde buyer y seller dashboards

---

## 8. Integraciones

| Servicio | Estado | Detalle |
|---|---|---|
| OpenAI GPT-5.2 | Activo | Emergent LLM Key — teaser, infomemo |
| Emergent Object Storage | Activo | PDFs NDA, documentos data room |
| Iberinform | Activo | CIF lookup (test credentials) |
| SendGrid | MOCKEADO | Templates listos, envío logueado |

---

## 9. Modelo de Monetización

### Suscripciones
| Plan | Precio | Interacciones | Destacado |
|---|---|---|---|
| Seller Free | 0€ | 0 | Publicación básica |
| Seller Plus | 149€/mes | 5/mes | Dashboard operación |
| Seller Premium | 499€/mes | Ilimitadas | Soporte prioritario |
| Buyer Free | 0€ | 0 | Exploración básica |
| Buyer Pro | 149€/mes | 5/mes | Acceso operativo |
| Buyer Pro+ | 349€/mes | Ilimitadas | Acceso prioritario |
| Advisor Free | 0€ | — | 1 mandato |
| Advisor Pro | 250€/mes | — | 2+ mandatos, 6-12 meses |

### Comisiones
| Perfil | Tipo | Porcentaje |
|---|---|---|
| Seller | Éxito (sobre transacción) | 2,9% |
| Buyer | Éxito (sobre transacción) | 1% |
| Advisor | Revenue share (sobre honorarios) | 15% |

---

## 10. Cuentas de Prueba

| Rol | Email | Password |
|---|---|---|
| Seller | diego.martin@rankingdigital.es | demo2026 |
| Buyer | carlos.ruiz@capitaliberica.es | demo2026 |
| Buyer | james.harris@techventures.co.uk | demo2026 |

---

## 11. Backlog Pendiente

### P1
- [ ] LOI Comparator — Dashboard visual para comparar LOIs recibidas
- [ ] Activity dashboard por buyer

### P2
- [ ] Consola Admin — Gestión planes, múltiplos, taxonomía, settings
- [ ] Deal state transitions UI
- [ ] PDF export infomemo
- [ ] Advisor dashboard real
- [ ] Activar SendGrid real
- [ ] Response Time Score interno
- [ ] Validación documental de empresa (criterio certificación avanzado)

---

## 12. Testing

| Iteración | Scope | Resultado |
|---|---|---|
| 20 | Seller Wizard V2 | 100% (18/18 backend + frontend) |
| 21 | Módulo Valoración | 100% (21/21 backend + frontend) |
| 22 | Planes y Precios v1 | 100% (11/11 backend + frontend) |
| 23 | Planes y Precios v2 | 100% (23/23 backend + 33 frontend) |
| 24 | NDA + Deep-link | 100% (24/24 backend + 16 frontend) |
| 25 | Buyer Dashboard F1 | 100% (14/14 frontend) |
| 26 | Buyer Dashboard F2 | 100% (10/10 backend + 17 frontend) |
| 27 | Buyer Dashboard F3 | 100% (16/16 backend + 15 frontend) |
