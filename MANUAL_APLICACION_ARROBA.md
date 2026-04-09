# MANUAL MAESTRO — ARROBA vNext

**Plataforma M&A para Agencias Digitales**
Version canonica reconciliada · Estado real verificado contra deployment
Fecha: 9 de abril de 2026 · Titular: BUD Advisors, S.L. · CIF B70821400

---

## TABLA 1 — CONFLICTOS, DECISIONES Y FUENTE FINAL

| # | Conflicto | Decision | Fuente final |
|---|---|---|---|
| 1 | Paleta UI: PRD (#B6212A) vs DESIGN.md (#FF5757) | UI canonica = PRD. Paleta DESIGN.md = branding grafico/campanas, no UI | PRD.md |
| 2 | Puerto backend: 8001 (operativo) vs 8000 (canonico objetivo) | Deploy real = 8001. Canonico objetivo = 8000 | Verificacion deployment |
| 3 | Motor valoracion: interno vs API agencias | Motor interno = transitorio, operativo. Canonico objetivo = API agencias.wearebudadvisors.com | Decision manual |
| 4 | Generacion PDF NDA: reportlab vs Document Engine agencias | reportlab = transitorio, operativo. Canonico objetivo = Document Engine agencias | Decision manual |
| 5 | Seller onboarding: SellerWizard vs SellerCompanyWorkspace | **SellerCompanyWorkspace es canonico.** SellerWizard.js = codigo muerto (import eliminado, sin ruta activa) | Verificacion 7 Abr 2026 |
| 6 | Resolucion empresa: Iberinform directo vs CIS | **CIS es la fuente maestra.** Iberinform = fallback interno transparente | Verificacion deployment |
| 7 | Presentacion deal buyer: vista unica vs orquestada por plan | **Orquestador de Presentacion = canonico.** Vista legacy coexiste temporalmente | Implementacion 9 Abr 2026 |

---

## TABLA 2 — ESTADO FUNCIONAL

### Implementado (operativo en deployment verificado)

| Modulo | Matiz |
|---|---|
| Home | Hero tabs, valoracion, deals destacados, share, como funciona |
| Marketplace | Filtros, senales, matching buyer, cards con share menu |
| **Seller Company Workspace** | **5 paneles modulares (Compania, Ficha, Financieros, Valoracion, Operacion). CIF resolve via CIS, persistencia dual (seller_company_profile + company), rehidratacion verificada. Reemplaza SellerWizard V2** |
| Buyer Dashboard Premium | 6 secciones, certificacion, plan differentiation, acciones por proceso |
| Seller Dashboard | Metricas, readiness, health, coaching |
| Deal Readiness | Checklist 8 obligatorios + 6 recomendados |
| Deal Health | Semaforo VERDE/AMARILLO/ROJO |
| Coaching prescriptivo | Nudges contextuales seller |
| Response Acceleration | Prioridad Q&A, nudges 12h/24h |
| NDA mutuo digital | Texto legal v2.0, firma electronica, PDF, auditoria. Email mockeado |
| Q&A Workspace | Trigger ACCEPTED, bidireccional |
| Data Room | Carpetas, upload, control acceso post-NDA, log descargas |
| Matching | Score afinidad, match_reason explicativo |
| LOI Comparator | Tab en SellerWorkspace. Endpoint: `GET /api/engagements/deal/{id}/loi-comparator` |
| Activity Dashboard buyer | Panel desde LOI Comparator. Endpoint: `GET /api/engagements/deal/{id}/buyer-activity/{buyerId}` |
| **Orquestador de Presentacion de Deals** | **Fases 1-3. 5 subagentes deterministas. Contact Request System. Endpoint: `GET /api/deals/{dealId}/presentation`. Frontend: DealOrchestratedView** |
| **CIS Master Data Layer** | **Centro de Inteligencia Sectorial como fuente maestra. `resolve-and-save` crea seller_company_profile con auto_prefilled del CIS** |
| **Financial Visuals** | **Graficos recharts generados y persistidos, vinculados al activo** |
| Planes y precios | 8 planes, 3 fee rules, interacciones, toggle anual, FAQ, deep-link |
| Certificacion buyer | 7 criterios, 3 niveles |
| Valoracion publica | Motor interno transitorio, 4 pasos, lead magnet |
| Formato numerico espanol | `formatES.js` global (puntos miles, comas decimales) |
| Auth JWT + Google OAuth | Login, registro, sesiones Emergent Auth |

### Preparado / Mockeado

| Modulo | Estado |
|---|---|
| SendGrid | 7 templates preparados. Envios logueados, no enviados |
| Stripe | Checkout y webhooks scaffolded. Sin pagos reales |
| Premium Intelligence Agent | Placeholder Fase 4. GPT-5.2 listo. Solo para Pro+ con NDA |

### Pendiente

| Modulo | Prioridad |
|---|---|
| Orquestador Fase 4 (Premium IA) | P1 |
| Admin Console | P2 |
| PDF export infomemo | P2 |
| Advisor Dashboard real | P2 |
| Deal state transitions UI | P2 |
| SendGrid real | P2 |
| Stripe real | P2 |

---

## TABLA 3 — COMPONENTES TRANSITORIOS Y REEMPLAZO

| Componente actual | Reemplazo canonico | Operativo hoy |
|---|---|---|
| Motor valoracion interno (`/modules/valuation/`) | API agencias.wearebudadvisors.com | Si |
| PDF NDA (reportlab) | Document Engine agencias | Si |
| NDA legacy (`deals.ndas_signed`) | `nda_signatures` + `nda_events` (v2) | Si (v2 activo) |
| SellerWizard.js (55KB) | SellerCompanyWorkspace | **No** — codigo muerto, sin ruta |
| SellerWizardBoceto.js | Eliminado | **No** — sin referencias |

---

## 1. VISION GENERAL

ARROBA es un marketplace confidencial de compraventa y fusion de agencias digitales del ecosistema MadTech en Espana. Conecta sellers, buyers y advisors en un entorno estructurado, seguro y profesional.

**Titular:** BUD Advisors, S.L. · CIF B70821400

---

## 2. ARQUITECTURA

### Stack

| Capa | Tecnologia |
|---|---|
| Frontend | React 18 + Tailwind + Shadcn/UI + Recharts |
| Backend | FastAPI (Python) + uvicorn, puerto 8001 |
| Base de datos | MongoDB (Motor async) |
| Almacenamiento | Emergent Object Storage |
| IA | OpenAI GPT-5.2 (Emergent LLM Key) |
| PDF | reportlab (transitorio) |

### Entidades Core

| Entidad | Coleccion | Rol |
|---|---|---|
| `seller_company_profile` | `seller_company_profiles` | Working space seller: auto_prefilled (CIS), seller_overrides, pricing, panel_status |
| `company` | `companies` | Entidad canonica ARROBA: financials planos, valuation, marketplace |
| `deal` | `deals` | Operacion comercial: publicacion, gating, visibilidad |
| `contact_request` | `contact_requests` | Solicitudes de contacto buyer->seller (Orquestador) |
| `seller_settings` | `seller_settings` | Politica contacto seller (auto_accept/manual_review) |

**Relaciones:**
- `seller_company_profile.company_id` → `companies.company_id`
- `deal.company_id` → `companies.company_id`
- `contact_request.deal_id` → `deals.deal_id`

### Routers registrados (22)

auth, users, marketplace, companies, deals, infomemo, subscriptions, cif_lookup, teaser, taxonomy, engagements, matching, dataroom, notifications, tracking, coaching, conversations, valuation, plans, nda, buyer_certification, billing, seller_profiles, **contact_requests**, **deal_presentation**.

---

## 3. ROLES Y PERMISOS

| Rol | Rutas principales |
|---|---|
| buyer | `/buyer/procesos`, `/explorar`, `/valoracion`, `/buyer/deal/:id/orchestrated` |
| seller | `/seller/deals`, `/seller/company/new`, `/seller/company/:id` |
| advisor | `/advisor/mandatos` (parcial) |
| admin | Acceso a todas las rutas |

### Permisos buyer por plan (Orquestador)

| Capacidad | Free | Pro | Pro+ |
|---|---|---|---|
| Ver card resumida | Si | Si | Si |
| Ver teaser anonimizado | Tras contacto aceptado | Desde inicio | Desde inicio |
| Solicitar contacto | Si | Si | Si (prioridad) |
| Firmar NDA | **No** | Tras contacto aceptado | Tras contacto aceptado |
| Acceso operativo (infomemo, dataroom) | **No** | Tras NDA | Tras NDA |
| Analisis premium IA | No | No | **Tras NDA (Fase 4)** |
| Interacciones/mes | 0 | 5 | Ilimitadas |

---

## 4. DESIGN SYSTEM: "The Digital Artifact"

| Elemento | Valor |
|---|---|
| Tipografia | IBM Plex Sans (300-800) |
| Border radius | 0px globalmente |
| Surface-0 | #f9f9f9 |
| Surface-1 | #f3f3f3 |
| Surface-2 | #e2e2e2 |
| Surface-lowest | #ffffff |
| Primary | #B6212A |
| Secondary | #006493 |
| On-surface | #191c1e |
| Labels | ALL CAPS, 0.05em, 9-10px, weight 700 |
| Layout | Sidebar izquierda fija + contenido central + rail contextual |

---

## 5. MODULOS FUNCIONALES

### 5.1 Seller Company Workspace (`/seller/company/:id`)

**Layout:** Sidebar izquierda fija + contenido central. 5 paneles modulares.

**Paneles:**
1. **Compania:** CIF resolve via CIS → datos registrales, cobertura, badges
2. **Ficha:** Taxonomia editable, senales cualitativas, descripcion
3. **Financieros:** Estados financieros CIS/manual, EBITDA ajustado
4. **Valoracion:** Calculo automatico + Financial Visuals (recharts)
5. **Operacion:** Tipo operacion, precio/margen, motivacion

**Persistencia dual:**
- `seller_company_profile`: auto_prefilled (CIS), seller_overrides, pricing, panel_status
- `company`: financials planos, valuation (para marketplace)

**Rehidratacion:** `GET /api/seller-profiles/by-company/{id}` → reconstruye workspace completo

### 5.2 Orquestador de Presentacion de Deals

**Endpoint:** `GET /api/deals/{dealId}/presentation`
**Frontend:** `/buyer/deal/:dealId/orchestrated`

**5 subagentes:**

| Subagente | Funcion | Output |
|---|---|---|
| Asset Analyzer | Analiza contenido real del deal | content_richness_score, visual_mode (lean/standard/rich), available_modules |
| Access Rules | Visibilidad por plan × contacto × NDA | visibility_state, allowed_actions, locked_actions, upgrade_prompts |
| Layout Compositor | Estructura visual segun riqueza | sections, layout_config |
| CTA Engine | Accion principal por estado | primary_cta, secondary_cta |
| Premium Intelligence | Analisis IA Pro+ (Fase 4) | premium_modules (placeholder) |

**Estados de visibilidad:**

| Estado | Descripcion |
|---|---|
| LOCKED_CONTACT_REQUIRED | Buyer debe solicitar contacto |
| CONTACT_REQUESTED | Solicitud pendiente de seller |
| TEASER_UNLOCKED | Teaser visible (Free cap) |
| NDA_AVAILABLE | Puede firmar NDA (Pro/Pro+) |
| NDA_SIGNED | NDA firmado |
| OPERATIVE_ACCESS | Acceso completo post-NDA |

**Contact Request System:**
- `POST /api/deals/{dealId}/contact-request` — buyer solicita
- `POST /api/deals/{dealId}/contact-request/{id}/accept` — seller acepta
- `POST /api/deals/{dealId}/contact-request/{id}/reject` — seller rechaza
- `PUT /api/seller/settings/contact-policy` — auto_accept / manual_review

### 5.3 CIS Master Data Layer

Centro de Inteligencia Sectorial como fuente maestra de datos empresariales.

- `POST /api/seller-profiles/resolve-and-save` → consulta CIS por CIF
- Devuelve: identity, taxonomy, financials (PnL + balance), enrichment, coverage
- Iberinform = fallback transparente si CIS falla
- Datos se almacenan en `seller_company_profiles.auto_prefilled`

### 5.4 NDA Mutuo Digital

Template v2.0, 10 clausulas, BUD Advisors S.L., jurisdiccion Madrid, 2 anos.
PDF generado con reportlab, subido a Object Storage.
Auditoria: nda_signatures + nda_events.

### 5.5 Buyer Dashboard Premium (`/buyer/procesos`)

6 secciones: Dashboard, Mis procesos, Seguimiento, Recomendados, Alertas, Perfil.
Certificacion: 7 criterios, 3 niveles (Basico/Verificado/Certificado).

### 5.6 Planes y Precios (`/planes`)

8 planes (3 seller + 3 buyer + 2 advisor). Toggle anual -10%. Deep-link por rol.

### 5.7 Valoracion Publica (`/valoracion`)

Motor interno transitorio. 4 pasos. Lead magnet. 10 categorias CIS.

---

## 6. TAXONOMIA

BUD Advisors MadTech Espana v2.0 — 10 categorias, 55 subcategorias.
Fuente: `services/taxonomy.py`. Endpoints: `/api/taxonomy/categories`, `/api/valuation/taxonomy/categories`.

---

## 7. MODELO DE DATOS

### Colecciones principales

| Coleccion | Funcion |
|---|---|
| users | Usuarios (buyer, seller, advisor, admin) |
| companies | Companias registradas |
| deals | Operaciones/deals |
| seller_company_profiles | Working space seller (CIS + overrides) |
| contact_requests | Solicitudes contacto buyer->seller |
| seller_settings | Configuracion seller (politica contacto) |
| engagements | Interacciones buyer-deal |
| nda_signatures | NDA mutuo digital v2 |
| nda_events | Audit trail NDA |
| plans | 8 planes + precios |
| transaction_fee_rules | 3 reglas comision |
| notifications | Notificaciones in-app |
| events | Event tracking |
| financial_visuals | Graficos generados |
| valuation_leads | Leads valoracion publica |
| valuation_multiples | Multiplos por categoria |
| user_sessions | Sesiones JWT |

---

## 8. INTEGRACIONES

| Servicio | Estado |
|---|---|
| CIS WeAreBUDAdvisors | **Activo** — Master Company Resolver |
| OpenAI GPT-5.2 | **Activo** — teaser, infomemo |
| Emergent Object Storage | **Activo** — PDFs, documentos |
| Iberinform | **Activo** — fallback CIS |
| Google Auth (Emergent) | **Activo** |
| SendGrid | **Mockeado** — templates listos |
| Stripe | **Preparado** — sin pagos reales |

---

## 9. SEGURIDAD Y CONFIDENCIALIDAD

- JWT Bearer token + Google OAuth via Emergent Auth
- bcrypt para passwords
- ProtectedRoute (frontend) + get_current_user (backend)
- **Confidencialidad absoluta:** telefono, email, direccion, web NUNCA expuestos en endpoints buyer-facing
- Sanitizacion en seller_profiles.py (`sanitize_for_buyer`) y orchestrator (`_build_deal_summary`)
- NDA: IP, user-agent, timestamp, signature_id en cada firma
- Acceso escalonado: teaser → NDA → infomemo/dataroom

---

## 10. TESTING

| Iteracion | Scope | Resultado |
|---|---|---|
| 20-27 | Seller Wizard, Valoracion, Planes, NDA, Buyer Dashboard | 100% |
| 28 | Seller Company Workspace P0 | Backend 21/21, Frontend 95% |
| **29** | **Orquestador de Presentacion** | **Backend 29/29, Frontend 100%** |

---

## 11. DATOS DE DEMOSTRACION

Password universal: `demo2026`

| Rol | Email | Plan |
|---|---|---|
| Seller | diego.martin@rankingdigital.es | — |
| Buyer Free | carlos.ruiz@capitaliberica.es | Free |
| Buyer Pro | iker.aguirre@familyoffice-norte.es | Pro |
| Buyer Pro (NDA) | james.harris@techventures.co.uk | Pro |
| Buyer Pro+ | marta.font@groupdigital.cat | Pro+ |

Deal principal de test: `deal_hot_seo_01`

---

*Fin del Manual Maestro ARROBA vNext*
*Documento autosuficiente. Unica referencia canonica para producto, diseno y desarrollo.*
*Ultima actualizacion: 9 de abril de 2026*
