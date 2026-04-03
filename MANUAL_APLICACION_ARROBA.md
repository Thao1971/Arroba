# MANUAL MAESTRO — ARROBA vNext

**Plataforma M&A para Agencias Digitales**
Versión canónica reconciliada · Estado real del deployment
Fecha: 27 de marzo de 2026 · Titular: BUD Advisors, S.L. · CIF B70821400

---

## TABLA DE CONFLICTOS Y DECISIONES

| Conflicto | Decisión canónica | Fuente final |
|---|---|---|
| Paleta UI: PRD (#B6212A) vs DESIGN.md (#FF5757) | UI usa PRD. DESIGN.md (#FF5757, #38B6FF, #DBB900, #82C359) = solo branding gráfico/campañas | PRD.md |
| Puerto backend: 8001 (supervisor actual) vs 8000 (canónico declarado) | Deploy real usa 8001 vía supervisor. Documentación marca 8000 como canónico futuro. 8001 = histórico/operativo actual | Decisión manual |
| Motor valoración: interno (modules/valuation) vs externo (agencias API) | Motor interno = **legacy/transitorio**. Canónico = API externa agencias.wearebudadvisors.com. Interno se mantiene como fallback funcional | Decisión manual |
| Generación PDF NDA: reportlab interno vs Document Engine externo | reportlab interno = **legacy/transitorio**. Canónico = Document Engine de agencias.wearebudadvisors.com. Interno se mantiene como fallback | Decisión manual |
| Engagement stage ACCEPTED: existe en código pero no en lista canónica declarada | ACCEPTED existe y opera en el deployment real. Se añade a la lista canónica | Código desplegado |
| Deal statuses: lista canónica (11) vs implementados en código (draft, published, exclusivity, closed, dropped) | Código implementa 5 de los 11 declarados. Los 6 restantes (nda, evaluation, intent, shortlist, due_diligence, reopened) = **pendientes de implementación** | Código desplegado |

---

## TABLA DE ESTADO FUNCIONAL

### Implementado (operativo en deployment)

| Módulo | Detalle |
|---|---|
| Home | Hero tabs (Vender/Comprar/Fusionarse), bloque valoración, deals destacados, share menu, cómo funciona |
| Marketplace | Exploración pública, filtros, señales de mercado, matching buyer, cards con share |
| Seller Wizard V2 | 5 pasos, sidebar + 60/40 + live preview, CIF lookup, teaser/infomemo IA |
| Buyer Dashboard Premium | 6 secciones (Dashboard, Mis procesos, Seguimiento, Recomendados, Alertas, Perfil), sidebar izquierda, certificación, plan differentiation |
| Seller Dashboard | Métricas, readiness, health, coaching, gestión interesados |
| Deal Readiness | Checklist 8 obligatorios + 6 recomendados, status LISTO/MEJORABLE/DÉBIL |
| Deal Health | Semáforo VERDE/AMARILLO/ROJO, alertas prescriptivas (NC-01 a NC-05, NC-QA, DH-NDA) |
| Coaching prescriptivo | Nudges contextuales para seller |
| Response Acceleration | Prioridad Q&A, nudges 12h/24h (módulo funcional, sin métricas públicas de response time) |
| NDA mutuo digital | Texto legal 10 cláusulas, firma electrónica, generación PDF (reportlab — legacy/transitorio), auditoría |
| Q&A Workspace | Trigger INTEREST_ACCEPTED, preguntas/respuestas, urgencia temporal |
| Data Room | Carpetas, upload, control acceso post-NDA, log descargas |
| Matching | Score por afinidad, match_reason explicativo, recomendaciones buyer |
| Time tracking | Tiempo buyer en deal_page, infomemo, data_room |
| Intent scoring | Score de intención basado en comportamiento buyer |
| Notificaciones in-app | Lista, unread count, mark read/all |
| Planes y precios | 8 planes, 3 fee rules, interacciones, toggle anual, FAQ, deep-link |
| Certificación buyer | 7 criterios ponderados, 3 niveles, diferenciación plan |
| Acciones por proceso | Backend computa recommended/available/blocked por engagement |
| Auth JWT + Google OAuth | Login, registro, sesiones, perfil |

### Implementado con matiz

| Módulo | Matiz |
|---|---|
| Valoración pública | Flujo UX funcional en ARROBA con motor interno. Motor canónico = API externa agencias.wearebudadvisors.com. Interno = **legacy/transitorio/fallback** |
| Data Room | Módulo base implementado. Fases avanzadas de acceso por etapa del deal y DD sofisticada = **pendientes** |
| NDA digital | Firma y PDF operativos. Email transaccional post-firma = **mockeado** (logueado, no enviado) |
| Iberinform | Activo con credenciales de test. Scope limitado al entorno pre-producción |
| Google Auth | Activo vía Emergent Auth |
| Object Storage | Activo (PDFs NDA, documentos Data Room) |
| OpenAI GPT-5.2 | Activo para teaser e infomemo. No extendido a otras capacidades |

### Preparado / Mockeado

| Módulo | Estado |
|---|---|
| SendGrid / email transaccional | 7 templates preparados. Envíos logueados a consola, no enviados realmente. Pendiente API key producción |
| Stripe / suscripciones | Infraestructura de checkout y webhooks. Sin procesamiento de pagos real |

### Pendiente

| Módulo | Prioridad |
|---|---|
| LOI Comparator (visual dashboard seller) | P1 |
| Activity Dashboard por buyer (vista seller) | P1 |
| Admin Console / Panel UI | P2 |
| Advisor Dashboard real | P2 |
| PDF export infomemo | P2 |
| Deal state transitions UI | P2 |
| Mobile responsive completo | P2 |
| Communication Layer completa | P2 |
| Fases avanzadas Data Room / DD | P2 |

---

## TABLA DE COMPONENTES LEGACY / TRANSITORIOS

| Componente | Estado | Reemplazo canónico |
|---|---|---|
| Motor valoración interno (`/modules/valuation/`) | Legacy/transitorio — operativo como fallback | API valoración de agencias.wearebudadvisors.com |
| Generación PDF NDA (reportlab) | Legacy/transitorio — operativo como fallback | Document Engine de agencias.wearebudadvisors.com |
| NDA legacy (`deals.ndas_signed` + colección `ndas`) | Legacy — mantenido por compatibilidad | `nda_signatures` + `nda_events` (v2) |
| Puerto backend 8001 | Histórico/operativo | Puerto canónico declarado: 8000 |
| `SellerWizardBoceto.js` | Archivo residual (no ruteado) | SellerWizard.js (V2) |

---

## 1. VISIÓN GENERAL

ARROBA es un marketplace confidencial de compraventa y fusión de agencias digitales del ecosistema MadTech en España. Conecta sellers, buyers y advisors en un entorno estructurado con proceso M&A ordenado, confidencialidad y coaching prescriptivo.

**Titular:** BUD Advisors, S.L. · CIF B70821400 · Paseo de la Castellana 178, 28046 Madrid.

**Dominios:** Beta: https://beta.arroba.com · Producción futura: https://www.arroba.com

El frontend resuelve el dominio API automáticamente desde `window.location.origin`, sin dependencia de variables de entorno para el dominio.

---

## 2. ARQUITECTURA

### Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18, Tailwind CSS, Shadcn/UI, IBM Plex Sans |
| Backend | FastAPI (Python), uvicorn, puerto 8001 (operativo) |
| Base de datos | MongoDB vía Motor (async) |
| Almacenamiento | Emergent Object Storage |
| IA | OpenAI GPT-5.2 vía Emergent LLM Key |
| PDF (legacy/transitorio) | reportlab |
| Deploy | Kubernetes (Emergent Cloud), supervisor |

### Estructura

```
/app/backend/
├── server.py            # FastAPI app, lifespan (seeds), CORS, 20 routers
├── database.py          # Motor client, 31 colecciones, índices
├── routers/             # 18 routers (auth, users, companies, deals, engagements,
│                        #   marketplace, matching, conversations, notifications,
│                        #   nda, plans, buyer_certification, taxonomy, cif_lookup,
│                        #   teaser, infomemo, dataroom, coaching, tracking, subscriptions)
├── modules/valuation/   # Dominio valoración (legacy/transitorio): router, service,
│                        #   engine, scoring, config_service, repositories, schemas
├── services/            # 15 servicios: email, matching, valuation_legacy, coaching,
│                        #   deal_health, deal_score, readiness, taxonomy, storage,
│                        #   notification, events, intent, suggestion, iberinform, teaser, infomemo
└── models/              # Pydantic: user, company, deal, engagement, transactions

/app/frontend/src/
├── App.js               # 33 rutas
├── pages/               # 17 páginas activas (+ 1 archivo residual no ruteado)
├── services/api.js      # Axios, 15 API services, origin-based URL
├── context/AuthContext.js
├── components/layout/   # Header, Footer, Layout, NotificationBell
└── components/ui/       # Shadcn/UI
```

### Inicialización (lifespan)

Al arrancar el backend ejecuta secuencialmente:
1. `init_db()` — Índices MongoDB.
2. `init_storage()` — Object Storage.
3. `seed_default_multiples()` + `seed_default_settings()` — Valoración (legacy/transitorio).
4. `seed_plans()` — 8 planes + 3 fee rules (idempotente).
5. `seed_nda_template()` — Template NDA v2.0 (idempotente).

---

## 3. ROLES Y PERMISOS

### Roles canónicos

| Rol | Estado | Descripción |
|---|---|---|
| **buyer** | Implementado | Comprador/inversor. Dashboard premium con 6 secciones |
| **seller** | Implementado | Vendedor de agencia. Wizard, dashboard, gestión deal |
| **advisor** | Parcial/scaffolded | Asesor M&A. Rutas existen, dashboard no canónico |
| **admin** | Existente sin consola UI | Acceso a rutas admin, sin panel propio |

### Permisos por plan buyer

| Capacidad | Free | Pro | Pro+ |
|---|---|---|---|
| Exploración marketplace | Sí | Sí | Sí |
| Guardar oportunidades | Sí | Sí | Sí |
| Ver detalle completo | No | Sí | Sí |
| Gestionar interacciones | No | Sí | Sí |
| Acceso Data Room | No | Sí | Sí |
| Acceso prioritario | No | No | Sí |
| Interacciones/mes | 0 | 5 | Ilimitadas |

---

## 4. DESIGN SYSTEM CANÓNICO: "The Digital Artifact"

| Elemento | Valor canónico |
|---|---|
| Tipografía | IBM Plex Sans (300–800) |
| Border radius | 0px globalmente |
| Surface-0 | #f9f9f9 |
| Surface-1 | #f3f3f3 |
| Surface-2 | #e2e2e2 |
| Surface-lowest | #ffffff |
| **Primary** | **#B6212A** |
| **Secondary** | **#006493** |
| **Tertiary** | **#6F5D00** |
| On-surface | #191c1e |
| On-surface-variant | #45464d |
| Outline | #76777d |
| Labels | ALL CAPS, 0.05em letter-spacing, 9–10px, weight 700 |
| Hover cards | translateY(-2px), sombra sutil, 150ms |
| Layout dashboard | Sidebar izquierda fija + contenido central + rail derecho contextual |

**Paleta branding/campañas (NO UI):** #FF5757, #38B6FF, #DBB900, #82C359 — relegada a materiales gráficos.

---

## 5. MÓDULOS FUNCIONALES

### 5.1 Home (`/`)

Hero con 3 tabs configurables (Vender/Comprar/Fusionarse), bloque valoración con ejemplo de resultado, deals destacados con menú compartir (copiar enlace + Web Share API + Open Graph dinámico), 4 pasos "Cómo funciona", CTA final.

### 5.2 Marketplace (`/explorar`)

Exploración pública. Filtros: sector, tipo operación, facturación, país. Cards con: sector, tipo operación, afinidad buyer (si autenticado), título, descripción, señales de mercado (Soft Signals), highlights, ubicación, facturación, EBITDA, share menu.

**Soft Signals:** Generados por `deal_score_service`. Prioridad: LOI > Competición > Proceso > Actividad DR > Freshness.

### 5.3 Ficha de deal (`/explorar/:dealId`)

Acceso escalonado: teaser público (sin NDA) → infomemo + Data Room (con NDA). Open Graph dinámico por deal. Modal NDA v2.0 con texto legal completo, formulario firmante, firma electrónica.

### 5.4 NDA Mutuo Digital

**Texto legal v2.0:** 10 cláusulas. BUD Advisors S.L., CIF B70821400, jurisdicción Madrid, vigencia 2 años.

**Cláusulas:** (1) Definición información confidencial, (2) Exclusiones, (3) Deber de confidencialidad, (4) Revelación permitida a representantes, (5) Prohibición divulgación existencia conversaciones, (6) Devolución/destrucción, (7) Titularidad, (8) Vigencia 2 años, (9) Legislación española / tribunales Madrid, (10) Firma electrónica.

**Flujo de firma:**
1. `GET /api/nda/template/{dealId}` — Preview con datos pre-rellenados.
2. Modal muestra texto scrollable + campos: nombre, empresa, cargo.
3. `POST /api/nda/sign` — Crea `nda_signatures`, genera PDF (reportlab — legacy/transitorio), sube a Object Storage, crea `nda_events`, actualiza `deal.ndas_signed` (compat legacy), notifica seller.
4. Metadatos: nombre, email, empresa, cargo, fecha UTC, hora, IP, user-agent, signature_id.
5. Email confirmación buyer: template NDA_BUYER_SIGNED (mockeado).

### 5.5 Seller Wizard V2 (`/seller/onboarding`)

Sidebar izquierda (5 pasos) + split 60/40 (formulario + live preview).

**Pasos:** Datos básicos (CIF/Iberinform) → Financieros (años, métricas, factores valoración) → Valoración (cálculo automático) → Acuerdo (tipo operación, precio) → Teaser & Infomemo (generación GPT-5.2, editor markdown).

### 5.6 Valoración pública (`/valoracion`) — Motor legacy/transitorio

Flujo UX de 4 pasos funcional en ARROBA. **Motor de cálculo interno = legacy/transitorio.** El motor canónico será la API de agencias.wearebudadvisors.com.

**Motor interno (fallback):**
- EBITDA > 0: `valuation = EBITDA × múltiplo_categoría × quality_factor`.
- EBITDA ≤ 0: fallback revenue-based.
- Quality factor (0.7–1.3): margen EBITDA (0.35), revenue/empleado (0.25), recurrencia (0.25), crecimiento (0.15).
- 10 categorías con múltiplos CIS seed.
- Confianza: alta/media/baja.

**Persistencia:** `valuation_leads`, `valuation_runs`, `valuation_premium_requests`, `valuation_multiples`, `valuation_settings`.

### 5.7 Planes y precios (`/planes`)

Público. Deep-link: `/planes?role=buyer|seller|advisor`.

| Plan | Precio/mes | Interacciones | Comisión |
|---|---|---|---|
| Seller Free | 0€ | 0 | 2,9% éxito |
| Seller Plus | 149€ | 5/mes | 2,9% éxito |
| Seller Premium | 499€ | Ilimitadas | 2,9% éxito |
| Buyer Free | 0€ | 0 | 1% éxito |
| Buyer Pro | 149€ | 5/mes | 1% éxito |
| Buyer Pro+ | 349€ | Ilimitadas | 1% éxito |
| Advisor Free | 0€ | — | 15% honorarios |
| Advisor Pro | 250€ | — | 15% honorarios |

Descuento anual 10% (sellers/buyers). Advisors: contratación 6 o 12 meses.

### 5.8 Buyer Dashboard Premium (`/buyer/procesos`)

**Layout:** Sidebar izquierda fija + contenido central + rail derecho.

**Sidebar:** Logo, plan badge, certificación badge, 6 secciones (Dashboard, Mis procesos, Seguimiento, Recomendados, Alertas, Perfil), CTAs (Mejorar plan, Explorar).

**Dashboard:** 6 KPIs, procesos activos, overlay Free.

**Mis procesos:** Lista → detalle con bloque "Siguientes acciones" (`_compute_process_actions()`). Acciones: Firmar NDA, Ver infomemo, Data Room, Q&A, LOI, Guardar, Reunión seller, Reunión ARROBA, Retirar interés. Cada acción = recommended / available / blocked + motivo.

**Seguimiento:** Watchlist con sector, financieros, fecha guardado.

**Recomendados:** Deals con afinidad + match_reason desde backend (_generate_match_reason: taxonomy, revenue, ticket, geography, operation).

**Alertas:** Notificaciones in-app, marcar leído, preferencias (placeholder).

**Perfil:** Datos personales, tesis inversión, verificación.

**Rail derecho:** Certificación (criterios COMPLETITUD + CONFIANZA, CTA "Completar verificación"), Plan (features Lock/Check + "Desde Pro"/"Solo Pro+" + upgrade_message), Mercado.

### 5.9 Certificación buyer (`GET /api/buyer/certification`)

7 criterios ponderados (peso total 10):

| Criterio | Categoría | Peso |
|---|---|---|
| Email verificado | Completitud | 1 |
| Perfil completo | Completitud | 2 |
| Cargo declarado | Completitud | 1 |
| Tesis inversión | Completitud | 2 |
| Empresa declarada | Confianza | 2 |
| Email corporativo | Confianza | 1 |
| NDA firmado | Confianza | 1 |

**Niveles:** Certificado (≥80%), Verificado (50–79%), Básico (<50%).

Sellers ven la etiqueta (no el porcentaje). Emails corporativos: se excluyen gmail, hotmail, outlook, yahoo, live, icloud, protonmail.

### 5.10 Seller Dashboard + Coaching

Deal Readiness (LISTO/MEJORABLE/DÉBIL), Deal Health (VERDE/AMARILLO/ROJO con alertas NC-01 a NC-05, NC-QA, DH-NDA), Response Acceleration (nudges 12h/24h), coaching prescriptivo.

### 5.11 Q&A Workspace (`/qa/:conversationId`)

Trigger: INTEREST_ACCEPTED. Bidireccional buyer-seller. Urgencia temporal. Nudges NC-QA-12 y NC-QA-24.

---

## 6. ESTADOS CANÓNICOS

### Deal status

| Status | Implementado | Descripción |
|---|---|---|
| draft | Sí | Borrador, no visible |
| published | Sí | Publicado en marketplace |
| exclusivity | Sí | En exclusividad con un buyer |
| closed | Sí (endpoint) | Operación cerrada |
| dropped | Sí (endpoint) | Operación descartada |
| nda | **Pendiente** | Declarado canónico, no implementado como estado del deal |
| evaluation | **Pendiente** | Declarado canónico, no implementado |
| intent | **Pendiente** | Declarado canónico, no implementado |
| shortlist | **Pendiente** | Declarado canónico, no implementado |
| due_diligence | **Pendiente** | Declarado canónico, no implementado |
| reopened | **Pendiente** | Declarado canónico, no implementado |

### Engagement

| Campo | Valores activos |
|---|---|
| type | INTEREST, LOI |
| stage | SUBMITTED → VIEWED → ACCEPTED → SHORTLISTED → EXCLUSIVITY / REJECTED |

---

## 7. MODELO DE DATOS (31 colecciones)

| Colección | Docs | Descripción |
|---|---|---|
| users | 22 | Usuarios con buyer_profile/seller_profile |
| companies | 11 | Compañías de sellers |
| deals | 10 | Operaciones (draft/published/exclusivity) |
| engagements | 20 | Interacciones buyer-deal |
| nda_signatures | 2 | Firmas NDA v2.0 con PDF y auditoría |
| nda_events | 6 | Audit trail NDA |
| nda_templates | 1 | Template NDA v2.0 |
| ndas | 26 | NDA legacy (compatibilidad) |
| plans | 8 | Planes y precios |
| transaction_fee_rules | 3 | Reglas comisión éxito/revenue share |
| valuation_leads | 21 | Leads valoración (legacy/transitorio) |
| valuation_multiples | 10 | Múltiplos CIS por categoría (legacy/transitorio) |
| valuation_settings | 1 | Config motor valoración (legacy/transitorio) |
| valuation_runs | 21 | Auditoría cálculos (legacy/transitorio) |
| valuation_premium_requests | 2 | Solicitudes valoración experta |
| notifications | 31 | Notificaciones in-app |
| events | 359 | Event tracking |
| conversations | 1 | Conversaciones Q&A |
| qa_items | 10 | Preguntas/respuestas |
| saved_deals | 2 | Deals guardados por buyers |
| infomemos | 2 | Infomemos generados (GPT-5.2) |
| teasers | 1 | Teasers generados |
| match_alerts | 27 | Alertas de matching |
| time_tracking | 120 | Tiempo buyer en secciones |
| dataroom_access_log | 90 | Log acceso Data Room |
| user_sessions | 511 | Sesiones |
| payment_transactions | 0 | Transacciones Stripe (preparado) |
| cis_financial_cache | 0 | Cache Iberinform |
| matches | 0 | Match scores persistidos |
| dataroom_documents | 0 | Documentos Data Room |
| dataroom_permissions | 0 | Permisos Data Room |

---

## 8. TAXONOMÍA CANÓNICA

BUD Advisors MadTech España v2.0 — 10 categorías, 55 subcategorías.

Estrategia, Marca y Diseño (4) · Creatividad y Producción (5) · Comunicación, PR y Reputación (5) · Experiencias y Activación BTL (5) · Influencer & Creator Economy (4) · Medios, Performance y Programmatic (4) · Digital, Growth y Commerce (7) · Data, AdTech y MarTech (9) · Consultoría de Transformación (5) · Soportes y Media Owners (7).

---

## 9. INTEGRACIONES

| Servicio | Estado canónico |
|---|---|
| OpenAI GPT-5.2 | **Activo** — teaser e infomemo |
| Emergent Object Storage | **Activo** — PDFs NDA, documentos |
| Iberinform | **Activo** — credenciales test, scope limitado |
| Google Auth (Emergent) | **Activo** |
| SendGrid | **Mockeado** — 7 templates listos, no envía |
| Stripe | **Preparado** — sin pagos reales |
| API valoración agencias | **Canónico declarado** — aún no integrado, motor interno como fallback |
| Document Engine agencias | **Canónico declarado** — aún no integrado, reportlab como fallback |

---

## 10. SEGURIDAD

- **JWT** con Bearer token. Expiración configurable.
- **Google OAuth** vía Emergent Auth (cookie de sesión).
- **bcrypt** para hash de passwords.
- **ProtectedRoute** en frontend valida rol.
- **get_current_user** en backend valida JWT/sesión por endpoint.
- **CORS:** `allow_origins=["*"]` (permite cualquier dominio).
- **NDA:** IP, user-agent, timestamp registrados en cada firma.
- **Infomemo y Data Room:** acceso exclusivamente post-NDA.

---

## 11. DATOS DE DEMOSTRACIÓN

22 usuarios (12 buyers, 10 sellers), 11 compañías, 10 deals (1 draft, 7 published, 2 exclusivity), 20 engagements. Password universal: `demo2026`.

---

*Fin del Manual Maestro ARROBA vNext*
*Documento autosuficiente. Única referencia para producto, diseño, prompts y desarrollo.*
