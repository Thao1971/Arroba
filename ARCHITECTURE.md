# ARCHITECTURE.md — Arroba Platform
## Documentación técnica del sistema

---

## 1. STACK TECNOLÓGICO

| Componente | Tecnología | Puerto |
|-----------|-----------|--------|
| Frontend | React 18 + Tailwind CSS + Shadcn/UI | 3000 |
| Backend | FastAPI (Python 3.11) | 8001 |
| Base de datos | MongoDB (Motor async) | 27017 |
| Storage | Emergent Object Storage | Cloud |
| AI | OpenAI GPT-5.2 (Emergent LLM Key) | Cloud |
| Auth | JWT + Sessions + Google OAuth (Emergent) | - |

---

## 2. ESTRUCTURA DE DIRECTORIOS

```
/app/
├── backend/
│   ├── config.py              # Variables de entorno y configuración
│   ├── database.py            # Conexión MongoDB + colecciones + índices
│   ├── server.py              # FastAPI app + CORS + routers
│   ├── seed_demo.py           # Script de seed data (10 deals, 10 buyers, 10 sellers)
│   ├── models/
│   │   ├── user.py            # UserInDB, BuyerProfile, RoleType, BuyerType
│   │   ├── company.py         # CompanyInDB, Financial, Valuation
│   │   ├── deal.py            # DealInDB, Teaser, Infomemo, DataRoom, Shortlist, Exclusivity
│   │   ├── engagement.py      # EngagementInDB (Interest + LOI unified)
│   │   └── transactions.py    # Payment transactions
│   ├── routers/
│   │   ├── auth.py            # Login, Register, Google OAuth, JWT, Sessions
│   │   ├── deals.py           # CRUD deals (seller)
│   │   ├── marketplace.py     # Public deal listing (buyer)
│   │   ├── engagements.py     # Interest, LOI, Shortlist, Exclusivity, Save
│   │   ├── companies.py       # CRUD companies
│   │   ├── dataroom.py        # Upload, Download, Permissions, Access Log
│   │   ├── tracking.py        # Time tracking + Intent scoring + Suggestions
│   │   ├── matching.py        # Buyer-Deal matching
│   │   ├── notifications.py   # In-app notifications CRUD
│   │   ├── teaser.py          # AI teaser generation
│   │   ├── infomemo.py        # AI infomemo generation
│   │   ├── taxonomy.py        # BUD taxonomy (CIS)
│   │   ├── cif_lookup.py      # CIF lookup (Iberinform)
│   │   ├── subscriptions.py   # Subscription management
│   │   └── users.py           # User profile management
│   ├── services/
│   │   ├── intent_service.py       # Time recording + Intent score (0-100)
│   │   ├── suggestion_service.py   # Auto-Shortlist Suggestion Engine
│   │   ├── matching_service.py     # Buyer-Deal matching engine
│   │   ├── events_service.py       # Event tracking (analytics)
│   │   ├── notification_service.py # In-app notification creation
│   │   ├── email_service.py        # Email placeholders (SendGrid scaffolded)
│   │   ├── storage_service.py      # Emergent Object Storage wrapper
│   │   ├── teaser_service.py       # AI teaser generation (GPT-5.2)
│   │   ├── infomemo_service.py     # AI infomemo generation (GPT-5.2)
│   │   ├── valuation_service.py    # EBITDA-based valuation
│   │   ├── taxonomy.py             # BUD sector taxonomy + mappings
│   │   ├── iberinform_service.py   # Iberinform API integration
│   │   ├── cif_lookup_service.py   # CIF validation service
│   │   └── match_alerts_service.py # Match alert generation
│   ├── utils/
│   │   ├── security.py        # Password hashing (bcrypt), JWT encode/decode
│   │   └── helpers.py         # Utility functions
│   └── tests/                 # Test files
├── frontend/
│   ├── src/
│   │   ├── App.js             # Router principal
│   │   ├── pages/             # Pages (Marketplace, DealPage, Dashboards)
│   │   ├── components/        # Components (LoiDetailedView, DataRoom, etc.)
│   │   ├── hooks/             # Custom hooks (useTimeTracker)
│   │   └── components/ui/     # Shadcn/UI components
│   └── .env                   # REACT_APP_BACKEND_URL
├── DEMO_SCENARIOS.md          # Escenarios de prueba con datos del seed
├── FLOWS.md                   # Flujos funcionales
└── ARCHITECTURE.md            # Este documento
```

---

## 3. COLECCIONES MONGODB

| Colección | Descripción | Índices clave |
|-----------|------------|---------------|
| `users` | Usuarios (buyers, sellers, advisors, admin) | email (unique), user_id (unique), google_id (sparse) |
| `companies` | Empresas vendedoras | owner_id, cif (sparse) |
| `deals` | Deals/operaciones | company_id, owner_id, status, (status+created_at) |
| `engagements` | Intereses + LOIs | (deal_id+buyer_id), deal_id, buyer_id |
| `events` | Eventos de plataforma | deal_id, event_type |
| `notifications` | Notificaciones in-app | (user_id+read), notification_id |
| `time_tracking` | Tiempo por buyer/deal/section | (buyer_id+deal_id+section+session_id) |
| `dataroom_documents` | Documentos del Data Room | deal_id, document_id |
| `dataroom_access_log` | Log de accesos al DR | (buyer_id+deal_id+action) |
| `dataroom_permissions` | Permisos por buyer/carpeta | (deal_id+buyer_id) |
| `saved_deals` | Deals guardados por buyers | (user_id+deal_id) unique |
| `teasers` | Teasers generados | deal_id |
| `infomemos` | Infomemos generados | deal_id |
| `user_sessions` | Sesiones de login | session_token (unique), user_id |

---

## 4. MODELOS DE DATOS

### 4.1 User (users)
```
user_id: string (format: "user_{hex12}" o legible como "buyer_pe_madrid_01")
email: string (unique)
password_hash: string (bcrypt)
role: "buyer" | "seller" | "advisor" | "admin"
buyer_profile: {
    type: "strategic" | "financial_pe" | "financial_fo" | "financial_vc" | "financial_holding"
    operation_types: ["full_sale", "partial_sale", "merger"]
    ticket_min/max, revenue_range_min/max, ebitda_range_min/max: float
    sectors: [string]
    taxonomy_categories: [string]  # BUD taxonomy IDs
    geographies: [string]
    urgency: "low" | "medium" | "high"
    control_preference: "control" | "minority" | "flexible"
    profile_complete: boolean
}
```

### 4.2 Deal (deals)
```
deal_id: string (format: "deal_{hex12}" o legible)
company_id: string → companies
owner_id: string → users (seller)
status: "draft" | "published" | "nda" | "evaluation" | "intent" | "shortlist" | "exclusivity" | "due_diligence" | "closed" | "dropped" | "reopened"
asking_price: float
teaser: { headline, description, highlights[], revenue_display, ebitda_display, sector_display, geography_display }
infomemo: { content (markdown), generated_at, version }
ndas_signed: [{ buyer_id, signed_at }]
shortlist: { buyers: [buyer_id], max 3, created_at, created_by }
exclusivity: { buyer_id, granted_at, terms }
metrics: { views, teaser_views, ndas_signed_count, lois_received_count }
```

### 4.3 Engagement (engagements)
```
engagement_id: string
deal_id: string → deals
buyer_id: string → users
type: "INTEREST" | "LOI"
stage: "SUBMITTED" | "VIEWED" | "SHORTLISTED" | "REJECTED" | "EXCLUSIVITY"
valuation_range_min/max: float (Interest)
valuation_offer: float (LOI)
structure: "cash" | "earn_out" | "mixed" (LOI)
acquisition_percentage: float (LOI)
conditions: string (LOI)
buyer_name, buyer_type: string (denormalized)
```

### 4.4 Event (events)
```
event_type: string (NDA_SIGNED, INTEREST_SUBMITTED, LOI_SUBMITTED, DOCUMENT_DOWNLOADED, etc.)
deal_id: string
user_id: string
metadata: dict
created_at: ISO datetime
```

---

## 5. ENDPOINTS API PRINCIPALES

### Auth
| Method | Path | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro con email/password |
| POST | `/api/auth/login` | Login → JWT + Session |
| POST | `/api/auth/session` | Google OAuth (Emergent Auth) |
| GET | `/api/auth/me` | Usuario actual |
| POST | `/api/auth/logout` | Cerrar sesión |

### Marketplace (Buyer)
| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/marketplace/deals` | Listar deals publicados (público) |
| GET | `/api/marketplace/deals/{id}` | Detalle de deal (teaser) |
| GET | `/api/marketplace/deals/{id}/recommended` | Deals recomendados para buyer |

### Deals (Seller)
| Method | Path | Descripción |
|--------|------|-------------|
| POST | `/api/deals` | Crear deal |
| GET | `/api/deals` | Listar mis deals |
| GET | `/api/deals/{id}` | Detalle deal (privado seller) |
| PATCH | `/api/deals/{id}` | Actualizar deal |
| POST | `/api/deals/{id}/publish` | Publicar deal |

### Engagements
| Method | Path | Descripción |
|--------|------|-------------|
| POST | `/api/engagements/interest` | Enviar interés (buyer) |
| POST | `/api/engagements/{id}/upgrade-to-loi` | Upgrade a LOI (buyer) |
| GET | `/api/engagements/deal/{deal_id}` | Listar engagements (seller) |
| GET | `/api/engagements/my-status/{deal_id}` | Mi status en un deal (buyer) |
| GET | `/api/engagements/my-processes` | Mis procesos activos (buyer) |
| POST | `/api/engagements/deal/{deal_id}/shortlist/{buyer_id}` | Añadir a shortlist |
| DELETE | `/api/engagements/deal/{deal_id}/shortlist/{buyer_id}` | Quitar de shortlist |
| POST | `/api/engagements/deal/{deal_id}/reject/{buyer_id}` | Rechazar buyer |
| POST | `/api/engagements/deal/{deal_id}/exclusivity/{buyer_id}` | Otorgar exclusividad |

### Data Room
| Method | Path | Descripción |
|--------|------|-------------|
| POST | `/api/dataroom/deals/{deal_id}/upload` | Subir documento |
| GET | `/api/dataroom/deals/{deal_id}/documents` | Listar documentos |
| GET | `/api/dataroom/documents/{id}/download` | Descargar documento |
| GET | `/api/dataroom/deals/{deal_id}/access-log` | Log de accesos (seller) |
| PUT | `/api/dataroom/deals/{deal_id}/permissions/{buyer_id}` | Permisos de carpeta |

### Tracking & Intelligence
| Method | Path | Descripción |
|--------|------|-------------|
| POST | `/api/tracking/time` | Registrar tiempo (heartbeat) |
| GET | `/api/tracking/intent/{deal_id}` | Intent scores de todos los buyers |
| GET | `/api/tracking/intent/{deal_id}/{buyer_id}` | Intent score específico |
| GET | `/api/tracking/suggestions/{deal_id}` | Auto-shortlist suggestions |

### Notifications
| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/notifications` | Listar notificaciones |
| PATCH | `/api/notifications/{id}/read` | Marcar como leída |
| POST | `/api/notifications/read-all` | Marcar todas como leídas |

---

## 6. VARIABLES DE ENTORNO

### Backend (.env)
| Variable | Descripción | Requerido |
|----------|------------|-----------|
| `MONGO_URL` | MongoDB connection string | Si |
| `DB_NAME` | Nombre de la base de datos | Si |
| `JWT_SECRET` | Clave para JWT tokens | Si |
| `EMERGENT_LLM_KEY` | Clave para GPT-5.2 (Emergent) | Si (para AI features) |
| `STRIPE_API_KEY` | Stripe test key | No (subscripciones) |
| `IBERINFORM_CLIENT_ID` | Iberinform API | No (CIF lookup) |
| `IBERINFORM_CLIENT_SECRET` | Iberinform API | No |
| `SENDGRID_API_KEY` | SendGrid (NO configurado) | No |
| `CORS_ORIGINS` | CORS allowed origins | Si |

### Frontend (.env)
| Variable | Descripción |
|----------|------------|
| `REACT_APP_BACKEND_URL` | URL del backend (con /api prefix) |

---

## 7. REGLAS DE NEGOCIO

### 7.1 Shortlist
- Máximo 3 buyers por deal
- Solo buyers con engagement activo
- Seller añade/quita manualmente o acepta sugerencia
- Al añadir → engagement.stage = SHORTLISTED

### 7.2 Exclusividad
- Solo 1 buyer por deal
- Bloquea nuevos engagements
- Deal status → EXCLUSIVITY
- Engagement.stage → EXCLUSIVITY

### 7.3 NDA Required
- Buyer debe firmar NDA para: ver infomemo, acceder a Data Room, enviar interés
- NDA se registra en deal.ndas_signed[]

### 7.4 Profile Required
- Buyer debe tener profile_complete=true para enviar interés
- Previene engagements de perfiles incompletos

### 7.5 Intent Score (0-100)
- LOI: +40, DR downloads: +20 (cap), DR access: +10, DR time ≥15m: +15, Infomemo ≥10m: +10, Matching alta: +5
- Alta ≥55, Media 25-54, Baja <25

### 7.6 Suggestion Classification
- RECOMMENDED_SHORTLIST: LOI + intent alta + ≥1 descarga DR
- CONSIDER: Alta sin LOI, o LOI sin actividad
- LOW_PRIORITY: Baja actividad
- Exclusividad sugerida: shortlisted + LOI + alta + ≥2 descargas + ≥20min DR

---

## 8. INTEGRACIONES EXTERNAS

| Servicio | Uso | Estado |
|----------|-----|--------|
| OpenAI GPT-5.2 | Generación de teasers e infomemos | Activo (Emergent LLM Key) |
| Emergent Object Storage | Data Room (upload/download) | Activo |
| Emergent Google Auth | Login social | Activo |
| Iberinform | CIF lookup + datos financieros | Activo (test credentials) |
| Stripe | Subscripciones (buyer/seller/advisor) | Scaffold (test key) |
| SendGrid | Email notifications | MOCKEADO (placeholder) |

---

## 9. AUTENTICACIÓN

### Dual Auth System
1. **JWT Tokens**: Generados en login/register. Bearer token en header Authorization.
2. **Session Tokens**: Cookie httponly `session_token` (format: `sess_{hex}`). Backup para OAuth flow.

### Flow
```
Request → get_current_user()
  → Check Authorization header for JWT
  → If no JWT, check session_token cookie
  → Validate token/session
  → Return UserResponse
```

---

## 10. SEED SCRIPT

### Ejecución
```bash
cd /app/backend && python seed_demo.py
```

### Contenido
- 10 Buyers (PE, Estratégico, VC, Family Office, Holding)
- 10 Sellers (uno por deal)
- 10 Empresas con financials
- 10 Deals con historias completas
- 19 Engagements (12 Interests, 7 LOIs)
- 52 registros de time tracking
- 55 registros de data room access
- 57 eventos
- 10 notificaciones

### Password universal: `demo2026`

### Historias incluidas
1. Hot Deal (exclusividad, alta actividad)
2. Mucho interés, poca conversión (5 NDAs, 0 LOIs)
3. Buyer fantasma (desaparece tras primer contacto)
4. Deal muerto (0 actividad)
5. LOI sin actividad (edge case)
6. Alta actividad sin LOI (edge case)
7. Shortlist llena (edge case)
8. Exclusividad prematura (edge case)
9. Data Room vacío (edge case)
10. Borrador (no publicado)
