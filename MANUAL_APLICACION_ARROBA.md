# MANUAL MAESTRO — ARROBA vNext (Corregido)

**Plataforma M&A para Agencias Digitales**
Versión canónica reconciliada · Estado real verificado contra deployment
Fecha: 27 de marzo de 2026 · Titular: BUD Advisors, S.L. · CIF B70821400

---

## TABLA 1 — CONFLICTOS, DECISIONES Y FUENTE FINAL

| # | Conflicto | Decisión | Fuente final |
|---|---|---|---|
| 1 | Paleta UI: PRD (#B6212A) vs DESIGN.md (#FF5757) | UI canónica = PRD. Paleta DESIGN.md (#FF5757, #38B6FF, #DBB900, #82C359) = branding gráfico/campañas, no UI | PRD.md |
| 2 | Puerto backend: 8001 (operativo actual) vs 8000 (canónico objetivo) | Deploy real actual = 8001. Canónico objetivo = 8000. Conviven documentados por separado | Verificación deployment + decisión manual |
| 3 | Motor valoración: interno vs API agencias | Motor interno = transitorio, actualmente desplegado y operativo. Canónico objetivo = API de agencias.wearebudadvisors.com (no integrado aún) | Decisión manual |
| 4 | Generación PDF NDA: reportlab vs Document Engine agencias | reportlab = transitorio, actualmente desplegado y generando PDFs reales. Canónico objetivo = Document Engine de agencias.wearebudadvisors.com (no integrado aún) | Decisión manual |
| 5 | Engagement stage ACCEPTED: ¿canónico? | ACCEPTED existe en código desplegado (endpoint `/accept/{buyer_id}`, stage set, 1 doc en DB, lógica de acciones, trigger Q&A). Se documenta como operativo en deployment. Su inclusión formal como canónico requiere actualización explícita de la lista de decisiones | Código desplegado verificado |
| 6 | Deal statuses: lista dominio (11) vs uso real | Los 11 son del dominio canónico. En código: draft, published, shortlist, exclusivity, closed, dropped tienen endpoints/transiciones reales. nda y evaluation referenciados en queries de marketplace. intent, due_diligence, reopened no tienen transiciones implementadas | Código desplegado verificado |

---

## TABLA 2 — ESTADO FUNCIONAL

### Implementado (operativo en deployment verificado)

| Módulo | Matiz |
|---|---|
| Home | Hero tabs, valoración, deals destacados, share, cómo funciona |
| Marketplace | Filtros, señales, matching buyer, cards con share menu |
| Seller Wizard V2 | 5 pasos, sidebar + 60/40 + live preview, CIF/Iberinform, teaser/infomemo IA |
| Buyer Dashboard Premium | 6 secciones (Dashboard, Mis procesos, Seguimiento, Recomendados, Alertas, Perfil), certificación, plan differentiation, acciones por proceso |
| Seller Dashboard | Métricas, readiness, health, coaching |
| Deal Readiness | Checklist 8 obligatorios + 6 recomendados, status LISTO/MEJORABLE/DÉBIL |
| Deal Health | Semáforo VERDE/AMARILLO/ROJO, alertas NC-01 a NC-05, NC-QA, DH-NDA |
| Coaching prescriptivo | Nudges contextuales seller |
| Response Acceleration | Prioridad Q&A pendientes, nudges NC-QA-12 (12h) y NC-QA-24 (24h). Sin métricas de response time expuestas públicamente |
| NDA mutuo digital | Texto legal v2.0, firma electrónica, PDF generado (reportlab — transitorio), auditoría. Email post-firma mockeado |
| Q&A Workspace | Trigger ACCEPTED, bidireccional, urgencia temporal |
| Data Room | Carpetas base, upload, control acceso post-NDA, log descargas. Sin fases avanzadas de DD |
| Matching | Score afinidad, match_reason explicativo, recomendaciones buyer |
| Time tracking | Tiempo buyer en deal_page, infomemo, data_room |
| Intent scoring | Score intención basado en comportamiento buyer |
| Suggestion engine | Sugerencias contextuales por deal |
| Notificaciones in-app | Lista, unread count, mark read |
| Planes y precios | 8 planes, 3 fee rules, interacciones, toggle anual, FAQ, deep-link |
| Certificación buyer | 7 criterios ponderados, 3 niveles, diferenciación plan |
| LOI Comparator | Tab "LOIs" en DealManagement: tabla/cards comparativas, señales buyer, badges automáticos, sort/filter, acciones. Deep-link: `?tab=lois`. Endpoint: `GET /api/engagements/deal/{id}/loi-comparator` |
| Activity Dashboard por buyer | Panel de actividad detallada por buyer accesible desde LOI Comparator. Layout canónico seller-side (contenido + rail lateral). 6 bloques: snapshot, señal seriedad, actividad por sección, Data Room profundidad, hitos del proceso, acciones contextuales. Endpoint: `GET /api/engagements/deal/{id}/buyer-activity/{buyerId}` |
| Auth JWT + Google OAuth | Login, registro, sesiones Emergent Auth |

### Implementado con matiz específico

| Módulo | Estado exacto |
|---|---|
| Valoración pública | Flujo UX completo en ARROBA con motor interno operativo y generando resultados reales. Motor canónico objetivo = API agencias (no integrado). Interno = transitorio |
| Data Room | Módulo base operativo. Fases avanzadas de acceso por etapa y DD sofisticada = pendientes |
| NDA digital | Firma y PDF operativos en producción. Email transaccional post-firma = mockeado (logueado, no enviado) |
| Iberinform | Activo con credenciales test. Scope limitado a entorno pre-producción |
| OpenAI GPT-5.2 | Activo para teaser e infomemo. No extendido a otras capacidades |
| Emergent Object Storage | Activo. Almacena PDFs NDA y documentos Data Room |
| Google Auth | Activo vía Emergent Auth |

### Preparado / Mockeado

| Módulo | Estado |
|---|---|
| SendGrid / email transaccional | 7 templates preparados (NDA_SIGNED, INTEREST_SUBMITTED, LOI_SUBMITTED, DATA_ROOM_ACCESSED, DOCUMENT_DOWNLOADED, VALUATION_RESULT, NDA_BUYER_SIGNED). Envíos logueados a consola. No se envían realmente. Pendiente API key producción |
| Stripe / suscripciones | Infraestructura de checkout y webhooks scaffolded. Sin procesamiento de pagos real |

### Pendiente

| Módulo | Prioridad |
|---|---|
| Admin Console mínima | P2 |
| Admin Console / Panel UI canónico | P2 |
| Advisor Dashboard real | P2 |
| PDF export infomemo | P2 |
| Deal state transitions UI | P2 |
| Mobile responsive completo | P2 |
| Communication Layer completa | P2 |
| Fases avanzadas Data Room / DD | P2 |

---

## TABLA 3 — COMPONENTES TRANSITORIOS Y REEMPLAZO CANÓNICO

| Componente actual | Estado de transición | Reemplazo canónico objetivo | Operativo hoy |
|---|---|---|---|
| Motor valoración interno (`/modules/valuation/`) | Transitorio | API valoración de agencias.wearebudadvisors.com | **Sí** — genera resultados reales |
| Generación PDF NDA (reportlab) | Transitorio | Document Engine de agencias.wearebudadvisors.com | **Sí** — genera PDFs reales subidos a Object Storage |
| NDA legacy (`deals.ndas_signed` + colección `ndas`) | Legacy — compatibilidad | `nda_signatures` + `nda_events` (v2). Ambos sistemas coexisten | **Sí** — v2 escribe en ambos |
| Puerto 8001 (supervisor) | Histórico/operativo | Puerto canónico objetivo: 8000 | **Sí** — uvicorn en 8001 |
| `SellerWizardBoceto.js` | Residual | SellerWizard.js (V2). Archivo existe pero no está ruteado | **No** — sin ruta activa |

---

## TABLA 4 — ESTADOS DEL DOMINIO DEAL

| Estado dominio | Transición en código | Uso en queries marketplace | Soporte UI |
|---|---|---|---|
| `draft` | Sí (crear deal → draft) | No (excluido de marketplace) | Sí (SellerWizard, SellerDashboard) |
| `published` | Sí (activar deal → published) | Sí (visible en marketplace) | Sí (Marketplace, DealPage) |
| `nda` | Referenciado en query marketplace | Sí (incluido en filtro público) | No (sin transición UI dedicada) |
| `evaluation` | Referenciado en query marketplace + update check | Sí (incluido en filtro público) | No (sin transición UI dedicada) |
| `intent` | No implementado en código | No | No |
| `shortlist` | Sí (endpoint shortlist → status shortlist) | No (no incluido en filtro marketplace) | Parcial (badge seller) |
| `exclusivity` | Sí (grant_exclusivity → exclusivity) | Sí (visible en marketplace) | Sí (badges, bloqueos) |
| `due_diligence` | No implementado en código | No | No |
| `closed` | Sí (endpoint close → closed) | No (excluido, solo contado) | Parcial (conteo stats) |
| `dropped` | Sí (endpoint drop → dropped) | No (excluido) | No |
| `reopened` | No implementado en código | No | No |

---

## TABLA 5 — ENGAGEMENT STAGES (verificado en deployment)

| Stage | Implementado en código | En DB | Trigger |
|---|---|---|---|
| `SUBMITTED` | Sí | Sí | Envío de interés o LOI |
| `VIEWED` | Sí | Sí | Seller visualiza (auto) |
| `ACCEPTED` | Sí | Sí (1 doc) | Seller acepta interés. Crea Q&A. **Operativo en deployment. Inclusión formal como canónico pendiente de validación explícita** |
| `SHORTLISTED` | Sí | Sí | Seller añade a shortlist |
| `REJECTED` | Sí | — | Seller rechaza |
| `EXCLUSIVITY` | Sí | Sí | Seller otorga exclusividad |

Engagement types: `INTEREST`, `LOI`.

---

## 1. VISIÓN GENERAL

ARROBA es un marketplace confidencial de compraventa y fusión de agencias digitales del ecosistema MadTech en España. Conecta sellers (propietarios de agencias), buyers (inversores/compradores) y advisors (asesores M&A) en un entorno estructurado, seguro y profesional.

**Titular:** BUD Advisors, S.L. · CIF B70821400 · Paseo de la Castellana 178, 28046 Madrid.

| Entorno | URL | Estado |
|---|---|---|
| Beta | https://beta.arroba.com | Activo |
| Producción | https://www.arroba.com | Futuro |

El frontend determina el dominio API desde `window.location.origin`, sin dependencia de variables de entorno para el dominio.

---

## 2. ARQUITECTURA

### Stack

| Capa | Tecnología | Detalle |
|---|---|---|
| Frontend | React 18 + Tailwind + Shadcn/UI | IBM Plex Sans, Design System "The Digital Artifact" |
| Backend | FastAPI (Python) + uvicorn | Puerto operativo: 8001. Puerto canónico objetivo: 8000 |
| Base de datos | MongoDB (Motor async) | 31 colecciones activas |
| Almacenamiento | Emergent Object Storage | PDFs NDA, documentos Data Room |
| IA | OpenAI GPT-5.2 | Emergent LLM Key. Teaser e infomemo |
| PDF (transitorio) | reportlab | Generación NDA. Canónico objetivo: Document Engine agencias |
| Deploy | Kubernetes (Emergent Cloud) | supervisor, hot reload |

### Inicialización (lifespan del backend)

Secuencia al arrancar:
1. `init_db()` — Índices MongoDB.
2. `init_storage()` — Object Storage.
3. `seed_default_multiples()` + `seed_default_settings()` — Motor valoración (transitorio).
4. `seed_plans()` — 8 planes + 3 fee rules (idempotente, reseed si estructura cambia).
5. `seed_nda_template()` — Template NDA v2.0 (idempotente).

### Routers registrados en server.py (20)

auth, users, marketplace, companies, deals, infomemo, subscriptions, cif_lookup, teaser, taxonomy, engagements, matching, dataroom, notifications, tracking, coaching, conversations, valuation (módulo), plans, nda, buyer_certification.

---

## 3. ROLES CANÓNICOS

| Rol | Estado operativo | Rutas principales |
|---|---|---|
| **buyer** | Implementado | `/buyer/procesos` (dashboard 6 secciones), `/explorar`, `/valoracion` |
| **seller** | Implementado | `/seller/deals`, `/seller/onboarding` (wizard), `/seller/interesados` |
| **advisor** | Parcial/scaffolded | `/advisor/mandatos`, `/advisor/interesados`. Sin dashboard canónico propio |
| **admin** | Existente sin consola UI canónica | Acceso a rutas admin. Sin panel dedicado |

### Permisos buyer por plan

| Capacidad | Free | Pro | Pro+ |
|---|---|---|---|
| Exploración marketplace | Sí | Sí | Sí |
| Guardar oportunidades | Sí | Sí | Sí |
| Ver detalle completo | No | Sí | Sí |
| Gestionar interacciones | No | Sí | Sí |
| Acceso Data Room | No | Sí | Sí |
| Acceso prioritario | No | No | Sí |
| Interacciones/mes | 0 | 5 | Ilimitadas |

Fuente: `PLAN_CONFIG` en `buyer_certification.py`.

---

## 4. DESIGN SYSTEM CANÓNICO: "The Digital Artifact"

| Elemento | Valor canónico UI |
|---|---|
| Tipografía | IBM Plex Sans (300–800) |
| Border radius | 0px globalmente |
| Surface-0 (fondo) | #f9f9f9 |
| Surface-1 | #f3f3f3 |
| Surface-2 | #e2e2e2 |
| Surface-lowest (cards) | #ffffff |
| **Primary** | **#B6212A** |
| **Secondary** | **#006493** |
| **Tertiary** | **#6F5D00** |
| On-surface | #191c1e |
| On-surface-variant | #45464d |
| Outline | #76777d |
| Labels | ALL CAPS, 0.05em letter-spacing, 9–10px, weight 700 |
| Hover cards | translateY(-2px), sombra sutil, 150ms |
| Layout dashboard | Sidebar izquierda fija + contenido central + rail derecho contextual |

**Nota:** La paleta de DESIGN.md (#FF5757, #38B6FF, #DBB900, #82C359) queda relegada a branding gráfico/campañas. No se usa en UI de producto.

---

## 5. MÓDULOS FUNCIONALES (DETALLE)

### 5.1 Home (`/`)

Hero con 3 tabs configurables (Vender/Comprar/Fusionarse), cada uno con eyebrow, título, descripción, 2 CTAs. Tab por defecto: Vender.

Bloque valoración: "Descubre cuánto podría valer tu agencia" + card ejemplo (3,2M — 4,1M, confianza ALTA). CTA lleva a `/valoracion` (autenticado) o `/register?redirect=/valoracion`.

Deals destacados con share menu (copiar enlace + Web Share API + Open Graph dinámico por deal).

4 pasos "Cómo funciona": Regístrate → Explora → Entorno seguro → Cierra tu operación.

Navegación header (no autenticado): Explorar · Vender mi empresa · Planes · Acceder · Publicar mi empresa.

### 5.2 Marketplace (`/explorar`)

Filtros sidebar: sector, tipo operación, facturación (min/max), país. Ordenación: mayor actividad.

Cards: sector, tipo operación, afinidad buyer (si perfil completo), título, descripción, soft signals, highlights, ubicación, año, facturación, EBITDA, share menu.

Soft signals generados por `deal_score_service`: LOI > Competición > Proceso > Actividad DR > Freshness.

### 5.3 Ficha de deal (`/explorar/:dealId`)

Acceso escalonado: teaser público (sin NDA) → infomemo + Data Room (con NDA).

Open Graph dinámico: `document.title`, `og:title`, `og:description` actualizados con nombre de la agencia.

### 5.4 NDA mutuo digital

**Template v2.0:** 10 cláusulas. BUD Advisors S.L., CIF B70821400, jurisdicción Madrid, vigencia 2 años. Cláusulas: (1) Definición información confidencial, (2) Exclusiones, (3) Deber de confidencialidad, (4) Revelación a representantes, (5) Prohibición divulgación conversaciones, (6) Devolución/destrucción, (7) Titularidad, (8) Vigencia, (9) Legislación española / Madrid, (10) Firma electrónica.

**Flujo:** Preview desde API → modal con texto scrollable → formulario (nombre, empresa, cargo) → checkbox aceptación → firma.

**Backend:** Genera PDF con reportlab (transitorio), sube a Object Storage, crea `nda_signatures` + `nda_events`, actualiza `deal.ndas_signed` (compat legacy), notifica seller.

**Metadatos registrados:** nombre, email, empresa, cargo, fecha UTC, hora, IP, user-agent, signature_id, rendered_text.

**Email:** Template NDA_BUYER_SIGNED preparado. Envío mockeado.

### 5.5 Seller Wizard V2 (`/seller/onboarding`)

Layout: sidebar izquierda (5 pasos) + split 60/40 (formulario + live preview).

Pasos: (1) Datos básicos con CIF lookup (Iberinform), (2) Financieros + factores valoración, (3) Valoración automática, (4) Configuración deal, (5) Teaser & Infomemo (GPT-5.2).

### 5.6 Valoración pública (`/valoracion`)

**Estado:** Flujo UX completo operativo en ARROBA con motor interno transitorio.

**Motor interno (transitorio, actualmente generando resultados reales):**
- EBITDA > 0: `valuation = EBITDA × múltiplo_categoría × quality_factor`
- EBITDA ≤ 0: fallback revenue-based con confianza reducida.
- Quality factor (0.7–1.3): margen EBITDA (0.35), revenue/empleado (0.25), recurrencia (0.25), crecimiento (0.15).
- 10 categorías con múltiplos CIS seed.
- Confianza: alta (≥6 pts), media (≥3), baja (<3).

**Canónico objetivo:** API de agencias.wearebudadvisors.com (no integrado).

Wizard 4 pasos: Identificación → Compañía → Taxonomía → Momento + legales.

Resultado: rango, valor central, drivers, confianza, múltiplos, disclaimer BUD Advisors.

Persistencia: `valuation_leads`, `valuation_runs` (auditoría), `valuation_premium_requests`, `valuation_multiples` (10 categorías), `valuation_settings`.

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

Descuento anual 10% (sellers/buyers). Advisors: compromiso 6 o 12 meses. Toggle mensual/anual visible (oculto para advisors).

Secciones: cards planes, bloque comisión, comparativa funcionalidades, bloque interacciones, bloque estructura económica, FAQ (7 preguntas), placeholders legales, CTA.

Datos en MongoDB: `plans` (8 docs), `transaction_fee_rules` (3 docs). Parametrizables para futura admin.

### 5.8 Buyer Dashboard Premium (`/buyer/procesos`)

**Layout:** Sidebar izquierda fija + contenido central + rail derecho. Sin header global.

**Sidebar:** Logo "arroba", "Panel de Comprador", nombre, badge plan (FREE/PRO/PRO+) con indicador interacciones, badge certificación (BÁSICO/VERIFICADO/CERTIFICADO), 6 secciones, CTAs.

**6 secciones:**

**(1) Dashboard:** 6 KPIs (procesos activos, NDAs, seguimiento, deals disponibles, recomendados, interacciones), procesos activos con overlay Free sutil.

**(2) Mis procesos:** Lista → click abre detalle con bloque "Siguientes acciones" computado desde backend (`_compute_process_actions()`). Acciones: Firmar NDA, Ver infomemo, Data Room, Q&A, LOI, Guardar, Reunión seller, Reunión ARROBA, Retirar interés. Cada acción = recommended (destacada) / available (con enlace) / blocked (con motivo).

**(3) Seguimiento:** Watchlist con sector, financieros, fecha guardado.

**(4) Recomendados:** Deals con afinidad + match_reason (taxonomy, revenue, ticket, geography, operation).

**(5) Alertas:** Notificaciones in-app, mark read. Preferencias (placeholder).

**(6) Perfil:** Datos personales, tesis inversión, verificación.

**Rail derecho:** Card certificación (COMPLETITUD: 4 criterios / CONFIANZA: 3 criterios, barra progreso, CTA "Completar verificación"), card plan (features Lock/Check + "Desde Pro"/"Solo Pro+" + upgrade_message + CTA), card mercado.

### 5.9 Certificación buyer

Endpoint: `GET /api/buyer/certification`. Devuelve certificación + plan info + interacciones.

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

Niveles: Certificado (≥80%), Verificado (50–79%), Básico (<50%). Sellers ven etiqueta, no porcentaje. `seller_trust_text` generado por nivel.

### 5.10 Seller Dashboard + Coaching + Health + Readiness

**Readiness:** 8 obligatorios (teaser, infomemo, revenue, EBITDA, operación, precio, DR docs, taxonomía) + 6 recomendados. LISTO ≥90%, MEJORABLE ≥60%, DÉBIL <60%.

**Health:** VERDE/AMARILLO/ROJO. Alertas: NC-01 sin tracción, NC-02 sin conversión, NC-03 LOI sin DD, NC-04 buyer inactivo, NC-05 exclusividad estancada, NC-QA Q&A stale, DH-NDA NDA sin interest.

**Response Acceleration:** GET `/api/conversations/pending/seller` con prioridad. Nudges NC-QA-12 (12h) y NC-QA-24 (24h).

### 5.11 Q&A Workspace (`/qa/:conversationId`)

Trigger: ACCEPTED. Bidireccional buyer-seller. Urgencia temporal. Acceso desde dashboards.

---

## 6. TAXONOMÍA CANÓNICA

BUD Advisors MadTech España v2.0 — 10 categorías, 55 subcategorías.

| Categoría | Subs |
|---|---|
| Estrategia, Marca y Diseño | 4 |
| Creatividad y Producción | 5 |
| Comunicación, PR y Reputación | 5 |
| Experiencias y Activación (BTL) | 5 |
| Influencer & Creator Economy | 4 |
| Medios, Performance y Programmatic | 4 |
| Digital, Growth y Commerce | 7 |
| Data, AdTech y MarTech | 9 |
| Consultoría de Transformación | 5 |
| Soportes y Media Owners | 7 |

Fuente: `services/taxonomy.py`. Servida por `/api/taxonomy/categories` y `/api/valuation/taxonomy/categories`.

---

## 7. MODELO DE DATOS (31 colecciones verificadas)

| Colección | Docs | Estado |
|---|---|---|
| users | 22 | Operativa |
| companies | 11 | Operativa |
| deals | 10 | Operativa |
| engagements | 20 | Operativa |
| nda_signatures | 2 | Operativa (v2) |
| nda_events | 6 | Operativa (audit) |
| nda_templates | 1 | Operativa |
| ndas | 26 | Legacy (compatibilidad) |
| plans | 8 | Operativa |
| transaction_fee_rules | 3 | Operativa |
| valuation_leads | 21 | Transitoria |
| valuation_multiples | 10 | Transitoria |
| valuation_settings | 1 | Transitoria |
| valuation_runs | 21 | Transitoria |
| valuation_premium_requests | 2 | Transitoria |
| notifications | 31 | Operativa |
| events | 359 | Operativa |
| conversations | 1 | Operativa |
| qa_items | 10 | Operativa |
| saved_deals | 2 | Operativa |
| infomemos | 2 | Operativa |
| teasers | 1 | Operativa |
| match_alerts | 27 | Operativa |
| time_tracking | 120 | Operativa |
| dataroom_access_log | 90 | Operativa |
| user_sessions | 511 | Operativa |
| payment_transactions | 0 | Preparada (Stripe) |
| cis_financial_cache | 0 | Operativa (sin datos) |
| matches | 0 | Operativa (sin datos persistidos) |
| dataroom_documents | 0 | Operativa (sin uploads) |
| dataroom_permissions | 0 | Operativa (sin config) |

---

## 8. INTEGRACIONES

| Servicio | Estado actual | Canónico objetivo |
|---|---|---|
| OpenAI GPT-5.2 | **Activo** — teaser e infomemo | Mismo |
| Emergent Object Storage | **Activo** — PDFs, documentos | Mismo |
| Iberinform | **Activo** — credenciales test | Producción con scope completo |
| Google Auth (Emergent) | **Activo** | Mismo |
| SendGrid | **Mockeado** — 7 templates, sin envío | Activo con API key producción |
| Stripe | **Preparado** — scaffolded | Activo con procesamiento real |
| API valoración agencias | **No integrado** | Canónico para motor valoración |
| Document Engine agencias | **No integrado** | Canónico para generación PDF |

---

## 9. SEGURIDAD

- **JWT** con Bearer token en header Authorization.
- **Google OAuth** vía Emergent Auth (cookie de sesión).
- **bcrypt** para passwords.
- **ProtectedRoute** (frontend) valida rol + onboarding.
- **get_current_user** (backend) valida JWT/sesión por endpoint.
- **CORS:** `allow_origins=["*"]`, `allow_credentials=True`.
- **NDA:** IP, user-agent, timestamp, signature_id en cada firma.
- **Acceso escalonado:** Infomemo y Data Room solo post-NDA.

---

## 10. DATOS DE DEMOSTRACIÓN

22 usuarios (12 buyers, 10 sellers), 11 compañías, 10 deals. Password universal: `demo2026`.

Buyers principales: carlos.ruiz@capitaliberica.es, james.harris@techventures.co.uk.
Seller principal: diego.martin@rankingdigital.es.

---

*Fin del Manual Maestro ARROBA vNext (Corregido)*
*Documento autosuficiente. Única referencia canónica para producto, diseño, prompts y desarrollo.*
*Distingue con precisión entre: estado actual desplegado, arquitectura canónica objetivo, y componentes transitorios.*
