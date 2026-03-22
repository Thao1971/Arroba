# ARROBA - Documento de Arquitectura y Plan de Desarrollo

## Version: 1.0
## Fecha: Enero 2026

---

# 1. RESUMEN EJECUTIVO

**Arroba** es una plataforma de compraventa y fusión de agencias digitales que opera como un sistema híbrido:
- **Capa Discovery (pública)**: Marketplace para exploración de oportunidades
- **Capa Transaccional (gestionada)**: Proceso estructurado para acceso a información sensible
- **Capa de Acompañamiento**: Deal Manager interno de BUD Advisors

### Objetivo Principal
Maximizar la calidad del dealflow, la generación de LOIs y los cierres.

### Objetivo Secundario
Crear una experiencia atractiva para que los sellers preparen su deal y los buyers paguen por interactuar.

---

# 2. STACK TECNOLÓGICO

## 2.1 Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React.js | 18.x | Framework principal |
| Tailwind CSS | 3.x | Sistema de estilos |
| React Router | 6.x | Navegación SPA |
| Zustand | 4.x | Estado global |
| React Query | 5.x | Cache y fetching |
| Recharts | 2.x | Gráficos y visualizaciones |
| Lucide React | - | Iconografía |

## 2.2 Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.11+ | Lenguaje principal |
| FastAPI | 0.109+ | Framework API REST |
| Motor | 3.x | MongoDB async driver |
| Pydantic | 2.x | Validación de datos |
| PyJWT | 2.x | Autenticación JWT |
| Authlib | 1.x | OAuth2 / Google Auth |

## 2.3 Base de Datos
| Tecnología | Propósito |
|------------|-----------|
| MongoDB | Base de datos principal (documentos) |
| GridFS | Almacenamiento de documentos Data Room |

## 2.4 Integraciones Externas
| Servicio | Propósito | Fase |
|----------|-----------|------|
| Stripe | Suscripciones y pagos | v1 |
| OpenAI GPT-5.2 | Generación de Infomemo con IA | v1 |
| Google OAuth | Autenticación social | v1 |
| Iberinform API | Importación datos financieros por CIF | v2 |
| SendGrid/Resend | Emails transaccionales | v1 |

---

# 3. ARQUITECTURA DEL SISTEMA

## 3.1 Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React SPA)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Marketplace│ │  Buyer   │ │  Seller  │ │ Advisor  │ │  Admin   │      │
│  │ Discovery │ │Dashboard │ │Workspace │ │Workspace │ │  Panel   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      API Gateway / Router                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │          │          │          │          │          │          │
│  ┌────┴────┐ ┌───┴───┐ ┌────┴────┐ ┌───┴───┐ ┌────┴────┐ ┌───┴───┐    │
│  │  Auth   │ │ Deals │ │Matching │ │ LOI/  │ │DataRoom │ │Billing│    │
│  │ Module  │ │Engine │ │ Engine  │ │Intent │ │ System  │ │Module │    │
│  └─────────┘ └───────┘ └─────────┘ └───────┘ └─────────┘ └───────┘    │
│       │          │          │          │          │          │          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Business Rules & Event Engine                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  MongoDB  │   │  GridFS   │   │  External │
            │ (Datos)   │   │(Docs/DR)  │   │   APIs    │
            └───────────┘   └───────────┘   └───────────┘
                                                  │
                            ┌─────────────────────┼─────────────────────┐
                            │                     │                     │
                       ┌────┴────┐          ┌─────┴─────┐         ┌─────┴─────┐
                       │ Stripe  │          │  OpenAI   │         │  Google   │
                       │ Payments│          │  GPT-5.2  │         │  OAuth    │
                       └─────────┘          └───────────┘         └───────────┘
```

## 3.2 Estructura de Carpetas

```
/app
├── backend/
│   ├── server.py                 # Entry point FastAPI
│   ├── config.py                 # Configuración y variables de entorno
│   ├── database.py               # Conexión MongoDB
│   ├── .env                      # Variables de entorno
│   │
│   ├── models/                   # Modelos Pydantic
│   │   ├── user.py
│   │   ├── company.py
│   │   ├── deal.py
│   │   ├── mandate.py
│   │   ├── subscription.py
│   │   ├── nda.py
│   │   ├── loi.py
│   │   ├── document.py
│   │   ├── match.py
│   │   └── notification.py
│   │
│   ├── routers/                  # Endpoints API
│   │   ├── auth.py               # Autenticación JWT + Google
│   │   ├── users.py              # Gestión usuarios
│   │   ├── companies.py          # Gestión compañías
│   │   ├── deals.py              # Deal Engine
│   │   ├── marketplace.py        # Discovery público
│   │   ├── matching.py           # Motor de matching
│   │   ├── loi.py                # LOIs e Intents
│   │   ├── dataroom.py           # Data Room
│   │   ├── documents.py          # Gestión documentos
│   │   ├── infomemo.py           # Generación Infomemo IA
│   │   ├── valuation.py          # Motor de valoración
│   │   ├── subscriptions.py      # Stripe billing
│   │   ├── notifications.py      # Alertas y emails
│   │   └── admin.py              # Panel administración
│   │
│   ├── services/                 # Lógica de negocio
│   │   ├── auth_service.py
│   │   ├── deal_service.py
│   │   ├── matching_service.py
│   │   ├── valuation_service.py
│   │   ├── infomemo_service.py   # Integración OpenAI
│   │   ├── stripe_service.py
│   │   ├── email_service.py
│   │   └── event_service.py      # Motor de eventos
│   │
│   ├── middleware/
│   │   ├── auth_middleware.py
│   │   └── rate_limiter.py
│   │
│   └── utils/
│       ├── security.py
│       └── helpers.py
│
├── frontend/
│   ├── public/
│   │   └── assets/               # Logo, favicon, etc.
│   │
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.css
│   │   │
│   │   ├── components/
│   │   │   ├── ui/               # Componentes base (Button, Input, Card, etc.)
│   │   │   ├── layout/           # Header, Footer, Sidebar, Layout
│   │   │   ├── marketplace/      # Cards de deals, filtros, listados
│   │   │   ├── deals/            # Componentes de deal (teaser, detail)
│   │   │   ├── dashboard/        # Widgets dashboard
│   │   │   ├── dataroom/         # Visualizador documentos
│   │   │   ├── forms/            # Formularios complejos
│   │   │   └── shared/           # Componentes compartidos
│   │   │
│   │   ├── pages/
│   │   │   ├── public/           # Home, Marketplace, DealTeaser
│   │   │   ├── auth/             # Login, Register, OAuth callback
│   │   │   ├── buyer/            # Dashboard, Deals, LOIs
│   │   │   ├── seller/           # Dashboard, Company, Deal wizard
│   │   │   ├── advisor/          # Dashboard, Mandatos, Pipeline
│   │   │   └── admin/            # Panel administración
│   │   │
│   │   ├── hooks/                # Custom hooks
│   │   ├── context/              # React context providers
│   │   ├── services/             # API calls
│   │   ├── store/                # Zustand stores
│   │   └── utils/                # Helpers, formatters
│   │
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
│
└── docs/
    ├── ARQUITECTURA_ARROBA.md    # Este documento
    └── API_DOCS.md               # Documentación API
```

---

# 4. MODELO DE DATOS (MongoDB Collections)

## 4.1 Users Collection
```javascript
{
  _id: ObjectId,
  email: String,                    // unique
  password_hash: String,            // nullable si OAuth
  google_id: String,                // nullable si email/pass
  
  role: "buyer" | "seller" | "advisor" | "admin",
  
  // Perfil común
  first_name: String,
  last_name: String,
  phone: String,
  avatar_url: String,
  
  // Datos específicos por rol
  buyer_profile: {
    type: "strategic" | "financial_pe" | "family_office" | "search_fund" | "independent_sponsor" | "vc",
    operation_types: ["acquisition_control", "minority", "merger", "investment"],
    ticket_min: Number,
    ticket_max: Number,
    revenue_range_min: Number,
    revenue_range_max: Number,
    ebitda_range_min: Number,
    ebitda_range_max: Number,
    sectors: [String],
    geographies: [String],
    urgency: "low" | "medium" | "high",
    control_preference: "control" | "minority" | "flexible"
  },
  
  seller_profile: {
    company_id: ObjectId            // referencia a Companies
  },
  
  advisor_profile: {
    firm_name: String,
    mandate_ids: [ObjectId]         // referencias a Mandates
  },
  
  // Deal Manager asignado (interno)
  deal_manager: {
    name: String,
    email: String,
    assigned_at: Date
  },
  
  // Suscripción
  subscription_id: ObjectId,
  
  // Metadata
  email_verified: Boolean,
  is_active: Boolean,
  created_at: Date,
  updated_at: Date,
  last_login: Date
}
```

## 4.2 Companies Collection
```javascript
{
  _id: ObjectId,
  owner_id: ObjectId,               // User (seller o advisor)
  owner_type: "seller" | "advisor",
  mandate_id: ObjectId,             // si owner_type = advisor
  
  // Datos básicos
  legal_name: String,
  trade_name: String,
  cif: String,
  acronym: String,                  // para teaser (ej: "AGN-2024-015")
  
  // Ubicación
  country: String,
  region: String,
  city: String,
  
  // Tipo y sector
  company_type: "digital_agency" | "creative_agency" | "media_agency" | "tech_studio" | "consultancy",
  sectors: [String],                // SEO, SEM, Social, Dev, etc.
  specializations: [String],
  
  // Datos de fundación
  founded_year: Number,
  employees_count: Number,
  
  // Financieros (últimos 3 años)
  financials: [{
    year: Number,
    revenue: Number,
    ebitda: Number,
    ebitda_margin: Number,
    net_income: Number,
    recurring_revenue_pct: Number,
    client_concentration_top5: Number,   // % de facturación en top 5 clientes
    growth_rate: Number
  }],
  
  // Datos para valoración
  valuation_inputs: {
    founder_dependency: "low" | "medium" | "high",
    recurring_revenue_type: "retainer" | "project" | "mixed",
    main_clients: Number,
    client_retention_rate: Number,
    tech_assets: Boolean,
    proprietary_ip: Boolean
  },
  
  // Valoración calculada
  valuation: {
    calculated_at: Date,
    ebitda_normalized: Number,
    multiple_min: Number,
    multiple_max: Number,
    valuation_min: Number,
    valuation_max: Number,
    drivers: [String]               // explicación de factores
  },
  
  // Descripción
  description: String,
  highlights: [String],
  
  // Credenciales y links
  website: String,
  linkedin: String,
  
  // Documentos base
  documents: [{
    type: "profile" | "financial" | "credentials",
    name: String,
    file_id: ObjectId,              // GridFS
    uploaded_at: Date
  }],
  
  // Metadata
  created_at: Date,
  updated_at: Date,
  imported_from_api: Boolean,
  api_import_date: Date
}
```

## 4.3 Deals Collection
```javascript
{
  _id: ObjectId,
  company_id: ObjectId,
  owner_id: ObjectId,               // User responsable
  
  // Estado del deal
  status: "draft" | "published" | "nda" | "evaluation" | "intent" | "shortlist" | "exclusivity" | "due_diligence" | "closed" | "dropped" | "reopened",
  status_history: [{
    status: String,
    changed_at: Date,
    changed_by: ObjectId,
    notes: String
  }],
  
  // Tipo de operación
  operation_types_allowed: ["full_sale", "partial_sale", "merger"],
  
  // Precio
  asking_price: Number,             // precio fijado por seller
  price_negotiable: Boolean,
  price_vs_valuation_flag: Boolean, // true si está fuera del rango calculado
  
  // Teaser (público/registrado)
  teaser: {
    headline: String,
    description: String,
    highlights: [String],
    revenue_display: String,        // "1-2M €" (redondeado)
    ebitda_display: String,         // "200-400k €" (redondeado)
    sector_display: String,
    geography_display: String,
    year_founded: Number
  },
  
  // Infomemo (post-NDA)
  infomemo: {
    generated_at: Date,
    content: String,                // HTML/Markdown generado por IA
    version: Number,
    file_id: ObjectId               // PDF en GridFS
  },
  
  // Data Room
  dataroom: {
    folders: [{
      name: String,                 // corporativo, financiero, legal, etc.
      documents: [{
        name: String,
        file_id: ObjectId,
        access_level: "nda" | "intent" | "dd",
        uploaded_at: Date
      }]
    }]
  },
  
  // Interacciones
  access_requests: [{
    buyer_id: ObjectId,
    requested_at: Date,
    status: "pending" | "approved" | "rejected"
  }],
  
  ndas_signed: [{
    buyer_id: ObjectId,
    signed_at: Date,
    document_id: ObjectId
  }],
  
  lois: [{
    loi_id: ObjectId                // referencia a LOIs collection
  }],
  
  // Shortlist
  shortlist: {
    buyers: [ObjectId],
    created_at: Date,
    created_by: ObjectId
  },
  
  // Exclusividad
  exclusivity: {
    buyer_id: ObjectId,
    granted_at: Date,
    expires_at: Date,
    terms: String
  },
  
  // Métricas
  metrics: {
    views: Number,
    teaser_views: Number,
    access_requests_count: Number,
    ndas_signed_count: Number,
    lois_received_count: Number
  },
  
  // Matching score precalculado
  matching_scores: [{
    buyer_id: ObjectId,
    score: Number,
    calculated_at: Date
  }],
  
  // Readiness score (qué tan completo está)
  readiness_score: Number,          // 0-100
  readiness_checklist: [{
    item: String,
    completed: Boolean
  }],
  
  // Deal Manager
  deal_manager: {
    name: String,
    email: String,
    assigned_at: Date
  },
  
  // Cierre
  closing: {
    closed_at: Date,
    final_price: Number,
    buyer_id: ObjectId,
    notes: String,
    evidence_documents: [ObjectId]
  },
  
  // Metadata
  created_at: Date,
  updated_at: Date,
  activated_at: Date,               // cuando pagó para publicar
  published_at: Date
}
```

## 4.4 Mandates Collection (Advisors)
```javascript
{
  _id: ObjectId,
  advisor_id: ObjectId,
  company_id: ObjectId,
  
  // Documento de mandato
  mandate_document: {
    file_id: ObjectId,
    uploaded_at: Date,
    validated: Boolean
  },
  
  // Términos
  start_date: Date,
  end_date: Date,
  exclusive: Boolean,
  
  // Estado
  status: "active" | "expired" | "terminated",
  
  created_at: Date,
  updated_at: Date
}
```

## 4.5 Subscriptions Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  
  plan_type: "buyer_monthly" | "seller_active" | "advisor_monthly",
  
  // Stripe
  stripe_customer_id: String,
  stripe_subscription_id: String,
  
  status: "active" | "cancelled" | "past_due" | "trialing",
  
  // Precios
  price_amount: Number,             // en céntimos
  currency: "eur",
  
  // Fechas
  current_period_start: Date,
  current_period_end: Date,
  
  // Historial de pagos
  payments: [{
    stripe_payment_id: String,
    amount: Number,
    status: String,
    paid_at: Date
  }],
  
  created_at: Date,
  updated_at: Date
}
```

## 4.6 LOIs Collection
```javascript
{
  _id: ObjectId,
  deal_id: ObjectId,
  buyer_id: ObjectId,
  
  type: "indicative" | "binding" | "preliminary_offer",
  
  // Términos
  offered_price: Number,
  price_structure: String,          // descripción de estructura
  conditions: [String],
  validity_days: Number,
  
  // Documento
  document_id: ObjectId,
  
  // Estado
  status: "submitted" | "under_review" | "accepted" | "rejected" | "expired" | "superseded",
  
  // Respuesta
  response: {
    responded_at: Date,
    responded_by: ObjectId,
    notes: String
  },
  
  submitted_at: Date,
  expires_at: Date,
  created_at: Date,
  updated_at: Date
}
```

## 4.7 NDAs Collection
```javascript
{
  _id: ObjectId,
  deal_id: ObjectId,
  buyer_id: ObjectId,
  
  // Documento
  template_version: String,
  signed_document_id: ObjectId,
  
  // Firma
  signed_at: Date,
  ip_address: String,
  
  // Validez
  valid_until: Date,
  
  created_at: Date
}
```

## 4.8 Matches Collection
```javascript
{
  _id: ObjectId,
  buyer_id: ObjectId,
  deal_id: ObjectId,
  
  // Scores
  total_score: Number,              // 0-100
  breakdown: {
    financial_fit: Number,          // 30%
    strategic_fit: Number,          // 25%
    operation_type_fit: Number,     // 20%
    deal_quality: Number,           // 15%
    buyer_behavior: Number          // 10%
  },
  
  // Filtros duros aplicados
  hard_filters_passed: Boolean,
  failed_filters: [String],
  
  // Display
  affinity_level: "high" | "medium" | "low",
  
  calculated_at: Date,
  updated_at: Date
}
```

## 4.9 Notifications Collection
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  
  type: String,                     // USER_REGISTERED, DEAL_PUBLISHED, etc.
  
  title: String,
  message: String,
  
  // Referencia
  reference_type: "deal" | "loi" | "user" | "subscription",
  reference_id: ObjectId,
  
  // Estado
  read: Boolean,
  read_at: Date,
  
  // Email
  email_sent: Boolean,
  email_sent_at: Date,
  
  created_at: Date
}
```

## 4.10 Events Collection (Audit/Tracking)
```javascript
{
  _id: ObjectId,
  
  event_type: String,               // Ver lista de eventos en spec
  
  actor_id: ObjectId,               // User que disparó
  actor_role: String,
  
  // Entidades afectadas
  entities: [{
    type: String,
    id: ObjectId
  }],
  
  // Datos del evento
  data: Object,                     // payload específico del evento
  
  // Trazabilidad
  ip_address: String,
  user_agent: String,
  
  created_at: Date
}
```

---

# 5. API ENDPOINTS

## 5.1 Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro email/password |
| POST | `/api/auth/login` | Login email/password |
| GET | `/api/auth/google` | Iniciar OAuth Google |
| GET | `/api/auth/google/callback` | Callback OAuth |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Recuperar contraseña |
| POST | `/api/auth/reset-password` | Reset contraseña |

## 5.2 Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users/me` | Perfil actual |
| PUT | `/api/users/me` | Actualizar perfil |
| PUT | `/api/users/me/buyer-profile` | Actualizar perfil buyer |
| PUT | `/api/users/me/seller-profile` | Actualizar perfil seller |
| PUT | `/api/users/me/advisor-profile` | Actualizar perfil advisor |

## 5.3 Marketplace (Público/Registrado)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/marketplace/deals` | Listar deals (con filtros) |
| GET | `/api/marketplace/deals/:id/teaser` | Ver teaser deal |
| GET | `/api/marketplace/sectors` | Listar sectores |
| GET | `/api/marketplace/stats` | Estadísticas marketplace |

## 5.4 Deals
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/deals` | Crear deal (draft) |
| GET | `/api/deals/:id` | Obtener deal completo |
| PUT | `/api/deals/:id` | Actualizar deal |
| POST | `/api/deals/:id/activate` | Activar deal (publicar) |
| POST | `/api/deals/:id/request-access` | Solicitar acceso (buyer) |
| POST | `/api/deals/:id/approve-access` | Aprobar acceso (seller) |
| POST | `/api/deals/:id/sign-nda` | Firmar NDA |
| GET | `/api/deals/:id/infomemo` | Obtener infomemo (post-NDA) |
| POST | `/api/deals/:id/shortlist` | Crear shortlist |
| POST | `/api/deals/:id/grant-exclusivity` | Conceder exclusividad |
| POST | `/api/deals/:id/close` | Cerrar deal |
| POST | `/api/deals/:id/drop` | Cancelar deal |
| POST | `/api/deals/:id/reopen` | Reabrir deal |

## 5.5 Companies
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/companies` | Crear compañía |
| GET | `/api/companies/:id` | Obtener compañía |
| PUT | `/api/companies/:id` | Actualizar compañía |
| POST | `/api/companies/:id/financials` | Actualizar financieros |
| POST | `/api/companies/:id/import-cif` | Importar por CIF (v2) |
| GET | `/api/companies/:id/valuation` | Obtener valoración |
| POST | `/api/companies/:id/calculate-valuation` | Calcular valoración |

## 5.6 Infomemo
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/infomemo/generate/:company_id` | Generar infomemo IA |
| GET | `/api/infomemo/:id` | Obtener infomemo |
| PUT | `/api/infomemo/:id` | Editar infomemo |
| GET | `/api/infomemo/:id/pdf` | Descargar PDF |

## 5.7 LOIs
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/lois` | Enviar LOI |
| GET | `/api/lois/:id` | Ver LOI |
| PUT | `/api/lois/:id/respond` | Responder LOI |
| GET | `/api/deals/:deal_id/lois` | LOIs de un deal |

## 5.8 Data Room
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dataroom/:deal_id` | Listar estructura |
| POST | `/api/dataroom/:deal_id/upload` | Subir documento |
| GET | `/api/dataroom/:deal_id/document/:doc_id` | Descargar documento |
| DELETE | `/api/dataroom/:deal_id/document/:doc_id` | Eliminar documento |
| POST | `/api/dataroom/:deal_id/grant-access` | Dar acceso DD |

## 5.9 Matching
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/matching/buyer/recommendations` | Deals recomendados (buyer) |
| GET | `/api/matching/deal/:id/buyers` | Buyers potenciales (seller) |
| POST | `/api/matching/calculate` | Recalcular matches |

## 5.10 Subscriptions
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/subscriptions/create-checkout` | Crear sesión Stripe |
| POST | `/api/subscriptions/webhook` | Webhook Stripe |
| GET | `/api/subscriptions/status` | Estado suscripción |
| POST | `/api/subscriptions/cancel` | Cancelar suscripción |

## 5.11 Notifications
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/notifications` | Listar notificaciones |
| PUT | `/api/notifications/:id/read` | Marcar como leída |
| PUT | `/api/notifications/read-all` | Marcar todas leídas |

## 5.12 Admin
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/users` | Listar usuarios |
| GET | `/api/admin/deals` | Listar todos los deals |
| PUT | `/api/admin/deals/:id/validate` | Validar deal |
| GET | `/api/admin/stats` | Dashboard stats |
| PUT | `/api/admin/config` | Configuración sistema |

## 5.13 Mandates (Advisors)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/mandates` | Crear mandato |
| GET | `/api/mandates` | Listar mandatos |
| GET | `/api/mandates/:id` | Ver mandato |
| PUT | `/api/mandates/:id` | Actualizar mandato |
| POST | `/api/mandates/:id/upload-document` | Subir contrato |

---

# 6. FLUJOS DE NEGOCIO PRINCIPALES

## 6.1 Buyer Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Explora    │────▶│  Registra   │────▶│  Completa   │────▶│    Paga     │
│ Marketplace │     │   Cuenta    │     │   Perfil    │     │ Suscripción │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                    ┌─────────────────────────────────────────────┘
                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Solicita   │────▶│  Firma NDA  │────▶│  Ve Infomemo│────▶│  Evalúa /   │
│   Acceso    │     │             │     │  Identidad  │     │  Preguntas  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                    ┌─────────────────────────────────────────────┘
                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Envía LOI  │────▶│ Shortlist/  │────▶│ Due         │────▶│   Cierre    │
│             │     │ Exclusividad│     │ Diligence   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## 6.2 Seller Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Registra   │────▶│    Crea     │────▶│   Carga     │────▶│  Genera     │
│   Cuenta    │     │  Compañía   │     │ Financieros │     │ Valoración  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                    ┌─────────────────────────────────────────────┘
                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Genera    │────▶│    Carga    │────▶│    Paga     │────▶│  Publicado  │
│  Infomemo   │     │  Data Room  │     │ Activación  │     │  en Market  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                    ┌─────────────────────────────────────────────┘
                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Gestiona   │────▶│  Compara    │────▶│ Crea Short- │────▶│   Cierre    │
│  Intereses  │     │    LOIs     │     │ list / Excl │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

# 7. SISTEMA DE EVENTOS

| Evento | Trigger | Acciones |
|--------|---------|----------|
| `USER_REGISTERED` | Alta usuario | Email bienvenida, crear perfil vacío |
| `SUBSCRIPTION_STARTED` | Pago exitoso | Activar funcionalidades, asignar Deal Manager |
| `DEAL_CREATED` | Seller crea deal | Guardar draft, calcular readiness |
| `DEAL_ACTIVATED` | Seller paga | Publicar en marketplace |
| `INFO_MEMO_GENERATED` | Completar datos | Generar documento con IA |
| `ACCESS_REQUESTED` | Buyer solicita | Notificar seller, log actividad |
| `NDA_SIGNED` | Buyer firma | Revelar identidad + infomemo |
| `LOI_SUBMITTED` | Buyer envía LOI | Notificar seller, cambiar estado |
| `SHORTLIST_CREATED` | Seller selecciona | Notificar buyers elegidos |
| `EXCLUSIVITY_GRANTED` | Seller concede | Bloquear nuevas LOIs |
| `DATA_ROOM_ACCESS_GRANTED` | Aprobar DD | Abrir documentos confidenciales |
| `DEAL_CLOSED` | Cierre exitoso | Registrar, notificar, analytics |
| `DEAL_DROPPED` | Cancelación | Cerrar proceso, permitir reapertura |

---

# 8. MOTOR DE MATCHING

## 8.1 Algoritmo de Scoring

```python
def calculate_match_score(buyer, deal):
    # Hard filters (eliminatorios)
    if not check_ticket_compatibility(buyer, deal):
        return 0
    if not check_operation_type_compatibility(buyer, deal):
        return 0
    if not check_geography_restriction(buyer, deal):
        return 0
    
    # Soft scoring
    score = 0
    
    # Fit financiero (30%)
    score += calculate_financial_fit(buyer, deal) * 0.30
    
    # Fit estratégico/sectorial (25%)
    score += calculate_strategic_fit(buyer, deal) * 0.25
    
    # Tipo de operación (20%)
    score += calculate_operation_fit(buyer, deal) * 0.20
    
    # Calidad del deal (15%)
    score += calculate_deal_quality(deal) * 0.15
    
    # Comportamiento buyer (10%)
    score += calculate_buyer_behavior(buyer) * 0.10
    
    return score
```

## 8.2 Niveles de Afinidad
| Score | Nivel | Display |
|-------|-------|---------|
| 80-100 | Alta | "Alta afinidad" (verde) |
| 50-79 | Media | "Media afinidad" (amarillo) |
| 0-49 | Baja | "Baja afinidad" (gris) |

---

# 9. MOTOR DE VALORACIÓN

## 9.1 Cálculo de Múltiplo

```python
def calculate_valuation(company):
    # Base múltiple según tipo y tamaño
    base_multiple = get_base_multiple(company.type, company.revenue)
    
    # Ajustes positivos
    if company.recurring_revenue_pct > 70:
        base_multiple += 0.5
    if company.growth_rate > 20:
        base_multiple += 0.3
    if company.client_concentration < 30:
        base_multiple += 0.2
    
    # Ajustes negativos
    if company.founder_dependency == "high":
        base_multiple -= 0.5
    if company.client_concentration > 50:
        base_multiple -= 0.3
    
    # Rango
    multiple_min = base_multiple * 0.85
    multiple_max = base_multiple * 1.15
    
    # Valoración
    ebitda = company.financials[-1].ebitda
    valuation_min = ebitda * multiple_min
    valuation_max = ebitda * multiple_max
    
    return {
        "multiple_min": multiple_min,
        "multiple_max": multiple_max,
        "valuation_min": valuation_min,
        "valuation_max": valuation_max,
        "drivers": explain_drivers(...)
    }
```

---

# 10. GENERACIÓN DE INFOMEMO CON IA

## 10.1 Flujo de Generación

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Datos     │────▶│  Construir  │────▶│   Llamada   │────▶│  Guardar    │
│  Compañía   │     │   Prompt    │     │  OpenAI API │     │  Resultado  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## 10.2 Estructura del Infomemo
1. Resumen Ejecutivo
2. Descripción del Negocio
3. Propuesta de Valor
4. Métricas Financieras Clave
5. Análisis de Clientes
6. Equipo y Estructura
7. Posicionamiento Competitivo
8. Oportunidades de Crecimiento
9. Riesgos Identificados
10. Términos de la Transacción

---

# 11. DISEÑO VISUAL (Brand Guidelines)

## 11.1 Paleta de Colores
| Color | HEX | Uso |
|-------|-----|-----|
| Rojo Coral | `#FF5757` | Principal corporativo, CTAs primarios |
| Azul Cielo | `#38B6FF` | Alternativo, botones secundarios |
| Amarillo | `#DBB900` | Acentos, highlights |
| Verde | `#82C359` | Estados positivos, confirmaciones |
| Negro | `#000000` | Texto principal |
| Gris Oscuro | `#333333` | Texto secundario |
| Blanco | `#FFFFFF` | Fondos |

## 11.2 Tipografía
- **Fuente:** IBM Plex Sans
- **H1:** Bold, 48pt, Rojo coral o Negro
- **H2:** Bold, 32pt
- **Subtítulos:** SemiBold, 24pt
- **Párrafo:** Regular, 14-16pt, Interlineado 1.4-1.6
- **Botones:** Medium, MAYÚSCULAS, texto blanco

## 11.3 Logo
- Estilo pixelado/dots retro
- Versiones en coral, azul, amarillo
- Isotipo "@" independiente para iconos

---

# 12. PLAN DE DESARROLLO POR FASES

## Fase 1: Core Foundation (Semanas 1-2)
- [ ] Setup proyecto (estructura carpetas, configs)
- [ ] Sistema de autenticación (JWT + Google OAuth)
- [ ] Modelos de datos base
- [ ] CRUD usuarios y perfiles
- [ ] Sistema de roles y permisos
- [ ] UI base (layout, componentes)

## Fase 2: Seller Workspace (Semanas 2-3)
- [ ] Crear/editar compañía
- [ ] Formulario de financieros
- [ ] Motor de valoración
- [ ] Generación infomemo con IA
- [ ] Dashboard seller
- [ ] Subida de documentos

## Fase 3: Marketplace & Discovery (Semanas 3-4)
- [ ] Home público
- [ ] Listado deals con filtros
- [ ] Deal teaser page
- [ ] Sistema de búsqueda

## Fase 4: Buyer Experience (Semanas 4-5)
- [ ] Dashboard buyer
- [ ] Perfil buyer completo
- [ ] Solicitud de acceso
- [ ] Firma NDA
- [ ] Visualización infomemo
- [ ] Motor de matching

## Fase 5: Deal Engine (Semanas 5-6)
- [ ] Máquina de estados
- [ ] Sistema de LOIs
- [ ] Shortlist
- [ ] Exclusividad
- [ ] Data Room
- [ ] Timeline del deal

## Fase 6: Payments & Subscriptions (Semana 6)
- [ ] Integración Stripe
- [ ] Planes de suscripción
- [ ] Webhooks y estados
- [ ] Bloqueo de features por pago

## Fase 7: Advisor Module (Semana 7)
- [ ] Dashboard advisor
- [ ] Gestión de mandatos
- [ ] Vista pipeline CRM
- [ ] Multi-compañía

## Fase 8: Admin & Notifications (Semana 8)
- [ ] Panel de administración
- [ ] Sistema de notificaciones
- [ ] Emails transaccionales
- [ ] Sistema de eventos/audit
- [ ] Analytics básicos

## Fase 9: Polish & Testing (Semanas 8-9)
- [ ] Testing E2E
- [ ] Optimización performance
- [ ] Responsive design
- [ ] Bug fixes
- [ ] Documentación

---

# 13. MÉTRICAS DE ÉXITO

| Métrica | Descripción | Target |
|---------|-------------|--------|
| Deals publicados | Total activos en marketplace | - |
| Conversion registro→suscripción | % que paga | >15% |
| NDAs firmados / deal | Engagement | >5 |
| LOIs por deal | Intención real | >2 |
| Tiempo draft→published | Onboarding seller | <7 días |
| Deals cerrados | Objetivo principal | - |

---

# 14. CONSIDERACIONES DE SEGURIDAD

1. **Autenticación:** JWT con refresh tokens, OAuth2 seguro
2. **Autorización:** RBAC estricto por rol
3. **Datos sensibles:** Encriptación en reposo y tránsito
4. **NDA tracking:** Registro inmutable de firmas
5. **Data Room:** Acceso controlado por estado del deal
6. **Audit log:** Todos los eventos críticos registrados
7. **Rate limiting:** Protección contra abuso
8. **HTTPS obligatorio:** Toda comunicación cifrada

---

# 15. DECISIONES TÉCNICAS CLAVE

1. **MongoDB sobre SQL:** Flexibilidad de esquema para deals complejos
2. **GridFS para documentos:** Integrado con MongoDB, simplifica arquitectura
3. **Zustand sobre Redux:** Más simple para esta escala
4. **FastAPI sobre Django:** Async nativo, mejor para integraciones
5. **Generación IA con GPT-5.2:** Máxima calidad en infomemos
6. **Stripe:** Estándar de la industria para suscripciones

---

**Documento preparado para el desarrollo de ARROBA**
**Versión 1.0 - Enero 2026**
