# MANUAL DE APLICACIÓN — ARROBA

**Plataforma M&A para Agencias Digitales**
Documento maestro oficial · Estado real del deployment
Fecha del documento: 27 de marzo de 2026

---

## 1. VISIÓN GENERAL

### 1.1 Propósito

ARROBA es un marketplace confidencial de compraventa y fusión de agencias digitales del ecosistema MadTech en España. La plataforma conecta tres tipos de participantes en un entorno estructurado, seguro y profesional:

- **Sellers:** propietarios de agencias que quieren vender, fusionarse o explorar opciones.
- **Buyers:** inversores, grupos, holdings o empresarios que buscan adquirir agencias.
- **Advisors:** asesores de M&A que canalizan operaciones a través de la plataforma.

### 1.2 Titular

BUD Advisors, S.L. · CIF B70821400 · Paseo de la Castellana 178, 28046 Madrid.

### 1.3 Dominios

| Entorno | URL |
|---|---|
| Beta | https://beta.arroba.com |
| Producción (futuro) | https://www.arroba.com |

El frontend determina el dominio de API automáticamente a partir del origen del navegador (`window.location.origin`), sin dependencia de variables de entorno para el dominio. Esto permite que la misma build funcione en cualquier dominio sin reconfiguración.

### 1.4 Módulos principales

| Módulo | Descripción |
|---|---|
| Marketplace público | Exploración de oportunidades con filtros, señales y matching |
| Seller Wizard V2 | Alta de compañía y deal en 5 pasos con live preview |
| Valoración pública | Lead magnet: estimación automática del valor de una agencia |
| NDA mutuo digital | Firma electrónica de NDA con PDF, auditoría y email |
| Buyer Dashboard Premium | Panel operativo buyer con 6 secciones, certificación y plan |
| Seller Dashboard | Panel seller con readiness, health, coaching y gestión |
| Q&A Workspace | Preguntas y respuestas bidireccionales buyer-seller |
| Planes y precios | Monetización por suscripción + comisión de éxito |
| Data Room | Repositorio documental por deal |
| Matching inteligente | Recomendación de deals por afinidad con perfil buyer |

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18, Tailwind CSS, Shadcn/UI, IBM Plex Sans |
| Backend | FastAPI (Python), uvicorn con hot reload |
| Base de datos | MongoDB (Motor async) |
| Almacenamiento | Emergent Object Storage (ficheros, PDFs) |
| IA | OpenAI GPT-5.2 (Emergent LLM Key) |
| PDF | reportlab (generación NDA) |
| Despliegue | Kubernetes (Emergent Cloud), supervisor |

### 2.2 Estructura de directorios

```
/app/
├── backend/
│   ├── server.py              # App FastAPI, lifespan, CORS, routers
│   ├── database.py            # Motor client, colecciones, índices
│   ├── config.py              # Variables de entorno
│   ├── seed_demo.py           # Seed de datos demo
│   ├── models/                # Pydantic models
│   ├── routers/               # 18 routers API
│   ├── modules/valuation/     # Dominio valoración independiente (7 archivos)
│   ├── services/              # 15 servicios de negocio
│   ├── utils/                 # Helpers y seguridad
│   └── tests/                 # Tests pytest
├── frontend/
│   ├── src/
│   │   ├── App.js             # Router (33 rutas)
│   │   ├── pages/             # 18 páginas
│   │   ├── services/api.js    # Axios con 14 API services
│   │   ├── context/           # AuthContext
│   │   ├── components/        # Layout + UI (Shadcn)
│   │   └── hooks/             # useTimeTracker, use-toast
│   └── public/                # index.html, OG image
└── memory/                    # PRD, CHANGELOG, ROADMAP
```

### 2.3 Flujo de datos

1. El frontend hace peticiones a `/api/*` usando `axios` con JWT en header `Authorization: Bearer`.
2. El ingress Kubernetes dirige `/api/*` al backend (puerto 8001) y el resto al frontend (puerto 3000).
3. El backend consulta MongoDB, procesa lógica de negocio, y devuelve JSON.
4. Los archivos (PDFs NDA, documentos data room) se almacenan en Emergent Object Storage.
5. La generación de teaser e infomemo usa GPT-5.2 vía Emergent LLM Key.

### 2.4 Inicialización (lifespan)

Al arrancar, el backend ejecuta:
1. `init_db()` — Crea índices MongoDB.
2. `init_storage()` — Inicializa Object Storage.
3. `seed_default_multiples()` + `seed_default_settings()` — Múltiplos de valoración y settings.
4. `seed_plans()` — 8 planes + 3 fee rules.
5. `seed_nda_template()` — Template NDA v2.0.

---

## 3. ROLES Y PERMISOS

### 3.1 Roles del sistema

| Rol | Descripción | Rutas principales |
|---|---|---|
| **buyer** | Comprador/inversor | `/buyer/procesos`, `/explorar`, `/valoracion` |
| **seller** | Vendedor de agencia | `/seller/deals`, `/seller/onboarding`, `/seller/interesados` |
| **advisor** | Asesor M&A | `/advisor/mandatos`, `/advisor/interesados` |
| **admin** | Administrador | `/admin/dashboard` |

### 3.2 Permisos por rol

| Acción | Buyer | Seller | Advisor | Admin |
|---|---|---|---|---|
| Explorar marketplace | Sí | Sí | Sí | Sí |
| Firmar NDA | Sí | — | Sí | Sí |
| Enviar interés/LOI | Sí (con perfil completo) | — | — | — |
| Crear compañía/deal | — | Sí | — | Sí |
| Gestionar interesados | — | Sí | Sí | Sí |
| Valoración pública | Sí | Sí | Sí | Sí |
| Ver planes | Todos (público) | — | — | — |

### 3.3 Buyer — Diferenciación por plan

| Capacidad | Free | Pro | Pro+ |
|---|---|---|---|
| Exploración marketplace | Sí | Sí | Sí |
| Guardar oportunidades | Sí | Sí | Sí |
| Ver detalle completo | No | Sí | Sí |
| Gestionar interacciones | No | Sí | Sí |
| Acceso a Data Room | No | Sí | Sí |
| Acceso prioritario | No | No | Sí |
| Interacciones mensuales | 0 | 5 | Ilimitadas |

---

## 4. MÓDULOS FUNCIONALES

### 4.1 Home (`/`)

**Componentes:**

1. **Hero con tabs interactivos** — Tres pestañas: Vender / Comprar / Fusionarse. Cada tab muestra eyebrow, título, descripción y dos CTAs (primario + secundario). Tab activo por defecto: Vender. Contenido configurado como objeto `HERO_TABS` en el componente.

2. **Bloque de valoración** — "Descubre cuánto podría valer tu agencia". Layout 2 columnas: texto explicativo (izquierda) + card ejemplo de resultado (derecha, muestra 3,2M — 4,1M con confianza ALTA). CTA "Calcular valoración" lleva a `/valoracion` (autenticado) o `/register?redirect=/valoracion`.

3. **Deals destacados** — Grid de 3 columnas con las agencias con mayor actividad. Cada card incluye sector, descripción, señales (LOIs recibidas, varios buyers evaluando), highlights, ubicación, facturación, EBITDA, y menú de compartir (3 puntos: copiar enlace + Web Share API nativa).

4. **Cómo funciona** — 4 pasos: Regístrate gratis → Explora oportunidades → Trabaja en un entorno seguro → Cierra tu operación.

5. **CTA final** — "¿Preparado para dar el siguiente paso?" con Crear cuenta gratis + Hablar con el equipo.

**Navegación header (no autenticado):** Explorar · Vender mi empresa · Planes · Acceder · Publicar mi empresa.

### 4.2 Marketplace (`/explorar`)

**Objetivo:** Exploración pública de todas las oportunidades disponibles.

**Filtros (sidebar izquierda):** Sector, Tipo de operación (Venta Total / Parcial / Fusión), Facturación (min/max), País. Ordenación por mayor actividad.

**Cards de deal:** Cada card muestra: badge sector, badges tipo operación, badge afinidad (si buyer autenticado con perfil), título, descripción, señales de mercado (LOIs recibidas, Varios buyers evaluando, Deal reciente), highlights, ubicación, año fundación, facturación, EBITDA, menú compartir.

**Señales de mercado (Soft Signals):** Generadas por el backend a partir de datos reales del deal. Prioridad: LOI > Competición > Proceso > Actividad DR > Freshness.

### 4.3 Ficha de Deal (`/explorar/:dealId`)

**Acceso escalonado:**
- Sin NDA: ve teaser público (sector, descripción anonimizada, métricas de rango).
- Con NDA firmado: accede a infomemo completo y Data Room.

**Modal NDA (v2.0):** Al pulsar "Firmar NDA" se abre un modal que:
1. Carga el texto legal completo desde `/api/nda/template/{dealId}` (10 cláusulas, BUD Advisors, CIF B70821400, jurisdicción Madrid, vigencia 2 años).
2. Muestra el documento como texto scrollable.
3. Pre-rellena nombre del firmante desde el perfil.
4. Solicita: nombre completo, empresa (opcional), cargo (opcional).
5. Requiere checkbox de aceptación.
6. Al firmar: genera PDF con reportlab, sube a Object Storage, crea `nda_signatures` + `nda_events`, actualiza `deal.ndas_signed`, envía notificación al seller, envía email al buyer (mockeado).

**Metadatos de firma registrados:** nombre, email, empresa, cargo, fecha, hora UTC, IP, user-agent, signature_id.

**Open Graph dinámico:** Al cargar la ficha, se actualizan `document.title`, `og:title` y `og:description` con el nombre y descripción de la agencia para compartir en redes/WhatsApp/email.

### 4.4 Seller Wizard V2 (`/seller/onboarding`)

**Layout:** Sidebar izquierda fija (5 pasos) + split 60/40 (formulario izquierda + live preview derecha).

**Pasos:**
1. **Datos básicos** — CIF/NIF con búsqueda en registro (Iberinform), denominación social, país, ciudad, web, nombre comercial, año fundación, empleados, tipo agencia, categorías taxonomía (máx. 3), descripción, highlights.
2. **Financieros** — Años financieros (facturación, EBITDA, % recurrentes, concentración top 5, crecimiento YoY), factores de valoración (dependencia fundador, tipo ingresos, clientes principales, retención, activos tech, IP).
3. **Valoración** — Cálculo automático con rango y múltiplo EBITDA.
4. **Acuerdo** — Tipo operación (venta total, parcial, fusión), precio solicitado, negociable.
5. **Teaser & Infomemo** — Generación con IA (GPT-5.2), editor markdown, preview, regenerar.

**Live preview:** Se actualiza en tiempo real con nombre, descripción, facturación, EBITDA, equipo, valoración, trust signals.

### 4.5 Valoración Pública (`/valoracion`)

**Objetivo:** Lead magnet premium para captar sellers cualificados.

**Backend:** Dominio independiente en `/modules/valuation/` con 7 archivos (router, service, engine, scoring, config_service, repositories, schemas).

**Motor de cálculo:**
- Si EBITDA > 0: `valuation = EBITDA × múltiplo × quality_factor`
- Si EBITDA ≤ 0: fallback revenue-based con confianza reducida.
- Múltiplos por categoría (10 categorías CIS seed). Fallback a categoría padre si no hay subcategoría.
- Quality factor (0.7–1.3) calculado a partir de: margen EBITDA (peso 0.35), revenue por empleado (0.25), recurrencia ingresos (0.25), crecimiento 12m (0.15).
- Niveles de confianza: alta (≥6 puntos), media (≥3), baja (<3).

**Múltiplos CIS por categoría:**

| Categoría | Mín | Med | Máx |
|---|---|---|---|
| Estrategia, Marca y Diseño | 3.5 | 4.5 | 5.5 |
| Creatividad y Producción | 3.0 | 4.0 | 5.0 |
| Comunicación, PR y Reputación | 3.5 | 4.5 | 5.5 |
| Experiencias y Activación (BTL) | 2.5 | 3.5 | 4.5 |
| Influencer & Creator Economy | 3.0 | 4.0 | 5.5 |
| Medios, Performance y Programmatic | 4.0 | 5.0 | 6.5 |
| Digital, Growth y Commerce | 4.0 | 5.5 | 7.0 |
| Data, AdTech y MarTech | 5.0 | 6.5 | 8.0 |
| Consultoría de Transformación | 4.0 | 5.0 | 6.5 |
| Soportes y Media Owners | 3.0 | 4.0 | 5.0 |

**Wizard (4 pasos):**
1. Identificación — nombre, cargo, email (precargado).
2. Datos compañía — nombre, facturación, EBITDA, crecimiento, empleados, % recurrentes.
3. Taxonomía — selección categoría → subcategorías dinámicas.
4. Momento — intención de venta (4 opciones, no afecta al cálculo) + checkboxes legales.

**Resultado:** Rango valoración, valor central, confianza, drivers explicados, múltiplos, disclaimer legal BUD Advisors. CTAs: dar de alta agencia, valoración experta (1.950€), enviar email.

**Persistencia:** `valuation_leads`, `valuation_runs` (auditoría), `valuation_premium_requests`.

### 4.6 Planes y Precios (`/planes`)

**Acceso:** Público. Deep-link: `/planes?role=buyer` abre tab Buyers directamente.

**Estructura:**

| Plan | Precio | Interacciones | Comisión éxito |
|---|---|---|---|
| Seller Free | 0€ | 0 | 2,9% |
| Seller Plus | 149€/mes | 5/mes | 2,9% |
| Seller Premium | 499€/mes | Ilimitadas | 2,9% |
| Buyer Free | 0€ | 0 | 1% |
| Buyer Pro | 149€/mes | 5/mes | 1% |
| Buyer Pro+ | 349€/mes | Ilimitadas | 1% |
| Advisor Free | 0€ | — | 15% honorarios |
| Advisor Pro | 250€/mes | — | 15% honorarios |

**Advisors:** 1 mandato gratis (Free). 2+ mandatos requiere Pro (contratación 6 o 12 meses).

**Descuento anual:** 10% en sellers y buyers. No disponible para advisors.

**Toggle mensual/anual** visible para sellers y buyers, oculto para advisors.

**Secciones:** Cards planes + bloque comisión éxito + tabla comparativa funcionalidades + bloque interacciones + bloque pedagógico estructura económica + FAQ (7 preguntas) + placeholders legales + CTA final.

### 4.7 Buyer Dashboard Premium (`/buyer/procesos`)

**Layout:** Sidebar izquierda fija (logo + plan + certificación + 6 secciones + CTAs) + contenido central + rail derecho contextual. Sin header global — el dashboard tiene su propia shell.

**Sidebar:**
- Logo "arroba" + "Panel de Comprador" + nombre usuario.
- Badge plan (FREE / PRO / PRO+) con indicador interacciones.
- Badge certificación (COMPRADOR BÁSICO / VERIFICADO / CERTIFICADO).
- 6 secciones navegables: Dashboard, Mis procesos, Seguimiento, Recomendados, Alertas, Perfil.
- CTAs fijos: MEJORAR PLAN (si free) + EXPLORAR MARKETPLACE.

**4.7.1 Dashboard**
- 6 KPIs: procesos activos, NDAs firmados, en seguimiento, deals disponibles, recomendados, interacciones.
- Alerta perfil incompleto si aplica.
- Lista mis procesos activos con cards: estado, tipo, título, sector, ubicación, valoración (formato EU), siguiente paso, enlace Q&A.
- Overlay Free sutil: "Acceso limitado en plan Free · Ver planes".

**4.7.2 Mis procesos**
- Lista de todos los procesos activos del buyer.
- Click en un proceso abre **vista detalle** con:
  - Header: estado, tipo, NDA badge, oferta, facturación, link ficha completa.
  - **Bloque "Siguientes acciones"** computado desde backend (`_compute_process_actions()`):
    - **Acción recomendada** destacada (borde primario, flecha).
    - **Acciones disponibles** con enlace "Ir" o "Próximamente".
    - **Acciones bloqueadas** con motivo explicativo.
  - Acciones posibles: Firmar NDA, Ver infomemo, Acceder a Data Room, Hacer pregunta (Q&A), Enviar oferta/LOI, Guardar/seguir, Agendar reunión seller, Agendar reunión ARROBA, Retirar interés.
- Botón "Volver a mis procesos" para volver a la lista.

**4.7.3 Seguimiento**
- Deals guardados/watchlist con sector, financieros, fecha de guardado.

**4.7.4 Recomendados**
- Deals recomendados con badges afinidad (Alta/Media/Baja) y **match_reason** explicativo generado desde backend: "Encaja con tu sector de interés", "Coincide con el rango de facturación que buscas", "Compatible con tu ticket de inversión", "Ubicación compatible", "Tipo de operación compatible".

**4.7.5 Alertas**
- Lista de notificaciones in-app con estado read/unread.
- Botón "MARCAR TODO LEÍDO".
- Sección preferencias de notificación (placeholder): 3 tipos de evento × canales (Email / In-app).

**4.7.6 Perfil comprador**
- Datos personales: nombre, email, empresa, cargo.
- Tesis de inversión: tipo buyer, ticket objetivo, sectores interés, geografía, tipos operación.
- Verificación: checklist 4 items (email, perfil, empresa, tesis).
- CTA: EDITAR PERFIL DE COMPRADOR.

**Rail derecho (persistente):**
- **Card certificación:** nivel + barra progreso + criterios separados (COMPLETITUD: 4 items / CONFIANZA: 3 items) + texto explicativo + CTA "COMPLETAR VERIFICACIÓN" que redirige al primer requisito pendiente.
- **Card plan:** nombre plan + features con Lock/Check + "Desde Pro" / "Solo Pro+" + indicador interacciones + upgrade_message + CTA MEJORAR A PRO.
- **Card mercado:** deals activos + nuevos esta semana.

### 4.8 Certificación del comprador

**Endpoint:** `GET /api/buyer/certification`

**7 criterios ponderados (peso total 10):**

| Criterio | Categoría | Peso |
|---|---|---|
| Email verificado | Completitud | 1 |
| Perfil de comprador completo | Completitud | 2 |
| Cargo declarado | Completitud | 1 |
| Tesis de inversión definida | Completitud | 2 |
| Empresa declarada | Confianza | 2 |
| Email corporativo | Confianza | 1 |
| Al menos un NDA firmado | Confianza | 1 |

**Niveles:**
- **Certificado** (≥80%): "Comprador con verificación completa. Perfil, empresa e identidad validados."
- **Verificado** (50–79%): "Comprador con perfil verificado y actividad demostrada en la plataforma."
- **Básico** (<50%): "Comprador registrado. Aún no ha completado la verificación."

**Email corporativo:** Se excluyen gmail.com, hotmail.com, outlook.com, yahoo.com, live.com, icloud.com, protonmail.com.

Los sellers ven la etiqueta de confianza del buyer (no el porcentaje).

### 4.9 Seller Dashboard (`/seller/deals`)

**Funcionalidades:**
- Deal overview con métricas: vistas, NDAs firmados, LOIs recibidas, intereses.
- Deal Readiness: checklist obligatorio (8 items, 70%) + recomendado (6 items, 30%). Status: LISTO (≥90%), MEJORABLE (≥60%), DÉBIL (<60%).
- Deal Health: semáforo VERDE/AMARILLO/ROJO con alertas estructuradas (problema + causa + acción recomendada).
- Response Acceleration: pendientes con urgencia, nudges 12h/24h para Q&A.
- Coaching prescriptivo: nudges contextuales para mejorar el deal.

### 4.10 Q&A Workspace (`/qa/:conversationId`)

**Trigger:** Se crea cuando el seller acepta un interés (INTEREST_ACCEPTED).
**Funcionalidad:** Preguntas del buyer, respuestas del seller. Urgencia temporal visible ("Hace Xh sin respuesta"). Coaching nudges NC-QA-12 (12h) y NC-QA-24 (24h).

### 4.11 Data Room (`/explorar/:dealId`)

Repositorio documental por deal. Carpetas: Financiero, Legal, Fiscal, Comercial, Operaciones, Equipo, Otros. Upload de documentos, control de acceso post-NDA, log de descargas.

---

## 5. UX/UI — DESIGN SYSTEM

### 5.1 "The Digital Artifact"

| Elemento | Especificación |
|---|---|
| Font | IBM Plex Sans, pesos 300–800 |
| Border radius | 0px en todos los componentes |
| Surface-0 | #f9f9f9 (fondo general) |
| Surface-1 | #f3f3f3 (sidebar, secciones secundarias) |
| Surface-2 | #e2e2e2 (inputs, separadores) |
| Surface-lowest | #ffffff (cards, modales) |
| Primary | #B6212A (CTAs principales, acentos) |
| Secondary | #006493 (Q&A, info) |
| Labels | ALL CAPS, 0.05em letter-spacing, 9–10px, weight 700 |
| Hover cards | translateY(-2px), sombra sutil, duración 150ms |
| Sombras cards | `0 2px 8px rgba(25,28,30,0.04)` |
| Ghost inputs | border-bottom 2px, background surface-2, focus border primary |

### 5.2 Layout del dashboard

- **Sidebar izquierda fija** (w-60, 240px): logo, plan, certificación, navegación, CTAs.
- **Contenido central**: sección activa según navegación sidebar.
- **Rail derecho contextual** (w-260): certificación, plan, mercado, soporte.

### 5.3 Navegación

**Header (no autenticado):** Explorar · Vender mi empresa · Planes · Acceder · Publicar mi empresa.

**Header (buyer):** Explorar · Mis procesos · Guardados.

**Header (seller):** Mis deals · Interesados · Explorar.

**Footer:** Plataforma (Marketplace, Planes, Vender mi empresa) · Compañía (BUD Advisors, Contacto) · Legal (Privacidad, Términos de uso).

---

## 6. MODELO DE DATOS

### 6.1 Colecciones MongoDB (31 colecciones activas)

#### `users` (22 docs)
| Campo | Tipo | Descripción |
|---|---|---|
| user_id | string | Identificador único |
| email | string | Email (unique index) |
| password_hash | string | Hash bcrypt |
| role | string | buyer / seller / advisor / admin |
| first_name, last_name | string | Nombre |
| buyer_profile | object | profile_complete, company_name, job_title, buyer_type, acquisition_thesis, sectors, taxonomy_categories, investment_range, preferred_regions, operation_types |
| seller_profile | object | Perfil seller |
| subscription | object | plan_type, status (preparado para Stripe) |

#### `companies` (11 docs)
| Campo | Tipo | Descripción |
|---|---|---|
| company_id | string | Identificador |
| owner_id | string | user_id del seller |
| legal_name, trade_name | string | Nombres |
| cif | string | CIF/NIF (sparse index) |
| financials | array | [{year, revenue, ebitda, ebitda_margin, recurring_revenue_pct, client_concentration_top5, growth_rate, data_source}] |
| valuation_inputs | object | founder_dependency, recurring_revenue_type, main_clients, client_retention_rate, tech_assets, proprietary_ip |
| valuation | object | Resultado último cálculo |

#### `deals` (10 docs)
| Campo | Tipo | Descripción |
|---|---|---|
| deal_id | string | Identificador |
| company_id | string | Referencia company |
| owner_id | string | user_id seller |
| status | string | draft / published / exclusivity |
| ndas_signed | array | [{buyer_id, signed_at, ip, document_id}] |
| metrics | object | ndas_signed_count, lois_received_count, interests_count, views_count |
| teaser, teaser_full | object | Datos del teaser público |
| operation_types_allowed | array | [full_sale, partial_sale, merger] |
| asking_price | number | Precio solicitado |

#### `engagements` (20 docs)
| Campo | Tipo | Descripción |
|---|---|---|
| engagement_id | string | Identificador |
| deal_id, buyer_id, seller_id | string | Referencias |
| type | string | INTEREST / LOI |
| stage | string | SUBMITTED → VIEWED → ACCEPTED → SHORTLISTED → EXCLUSIVITY / REJECTED |
| operation_type | string | full_sale / partial_sale / merger |
| valuation_offer | number | Oferta del buyer |

#### `nda_signatures` (2 docs)
| Campo | Tipo | Descripción |
|---|---|---|
| signature_id | string | nda_sig_XXXX |
| deal_id, buyer_user_id, company_id | string | Referencias |
| template_version | string | "2.0" |
| signer_name, signer_email, signer_company, signer_title | string | Datos firmante |
| signed_at, signed_timezone, signed_ip, user_agent | string | Metadatos firma |
| rendered_text | string | Texto NDA completo renderizado |
| pdf_url | string | URL del PDF en Object Storage |
| email_sent | boolean | Si se envió email confirmación |
| status | string | "signed" |

#### `nda_events` (6 docs)
| Campo | Tipo | Descripción |
|---|---|---|
| event_id | string | nda_evt_XXXX |
| signature_id | string | Referencia firma |
| event_type | string | NDA_SIGNED / EMAIL_SENT / PDF_DOWNLOADED / EMAIL_RESENT |
| metadata | object | Detalles del evento |

#### `plans` (8 docs)
| Campo | Tipo | Descripción |
|---|---|---|
| plan_id | string | seller_free, buyer_pro, advisor_pro, etc. |
| role_type | string | seller / buyer / advisor |
| plan_name, plan_tagline | string | Nombre y descripción corta |
| billing_type | string | free / recurring / revenue_share |
| monthly_price, annual_price | number | Precios |
| annual_discount_pct | number | 10 (sellers/buyers) |
| monthly_interaction_limit | number | 0 / 5 / -1 (ilimitadas) |
| success_fee_pct, revenue_share_pct | number | Comisiones |
| features | array | Lista de features del plan |
| conditions | array | Condiciones (solo advisors) |
| advisor_rules | object | max_active_mandates, min_active_mandates, allowed_commitment_months |
| badge | string | RECOMENDADO / PARTNER / null |
| is_highlighted | boolean | Destacar visualmente |

#### `valuation_leads` (21 docs)
Leads de valoración pública con todos los inputs, resultado, quality_score, quality_factor, múltiplos, confianza, legal_acceptance_snapshot.

#### `valuation_multiples` (10 docs)
Múltiplos por categoría: scope_type (category), scope_id, multiple_min/mid/max, source (CIS), is_active.

#### `valuation_settings` (1 doc)
Configuración del motor: weights, thresholds, fallback_rules, disclaimer, email_copy, premium_price.

#### `valuation_runs` (21 docs)
Auditoría de cálculos: lead_id, input_snapshot, config_snapshot, output_snapshot.

Otras colecciones: `notifications`, `events`, `conversations`, `qa_items`, `saved_deals`, `infomemos`, `teasers`, `matches`, `match_alerts`, `time_tracking`, `dataroom_access_log`, `user_sessions`, `ndas` (legacy), `transaction_fee_rules`.

---

## 7. TAXONOMÍA OFICIAL

BUD Advisors MadTech España v2.0 — 10 categorías, 55 subcategorías.

| Categoría | Subcategorías |
|---|---|
| Estrategia, Marca y Diseño | Brand strategy, Naming y arquitectura de marca, Identidad visual y diseño, Research & Consumer Insights |
| Creatividad y Producción | Agencia creativa (ATL/TTL), Content studio, Producción audiovisual, Motion/3D/craft, Experiencias inmersivas (AR/VR) |
| Comunicación, PR y Reputación | PR corporativo, Comunicación digital, Public affairs, Comunicación interna, Crisis & issues management |
| Experiencias y Activación (BTL) | Eventos y producción, Experiential marketing, Trade marketing, Field marketing, Retail activation |
| Influencer & Creator Economy | Influencer marketing, Talent management, Creator production, Social amplification |
| Medios, Performance y Programmatic | Agencia de medios, Performance/Paid media, Programmatic/Trading desk, Retail media buying |
| Digital, Growth y Commerce | Desarrollo web, Producto digital/UX-UI, SEO, GEO, CRM y automation, CRO, Ecommerce y marketplaces |
| Data, AdTech y MarTech | DSP, SSP, Ad Exchange, CDP/DMP, Data Clean Rooms, Medición/Attribution, Ad verification, Anti-fraud, MMP |
| Consultoría de Transformación | Consultoría tecnológica, Data strategy & privacy, Consultoría de IA, Innovación, Estrategia de crecimiento |
| Soportes y Media Owners | OOH tradicional, DOOH, Transporte, Indoor advertising, Retail media owner, CTV owner, Audio network |

---

## 8. INTEGRACIONES ACTIVAS

| Servicio | Estado | Uso |
|---|---|---|
| **OpenAI GPT-5.2** | Activo | Generación teaser e infomemo vía Emergent LLM Key |
| **Emergent Object Storage** | Activo | PDFs NDA, documentos Data Room |
| **Iberinform** | Activo (test credentials) | Búsqueda CIF/NIF y datos de empresa |
| **SendGrid** | **Mockeado** | 7 templates preparados. Envíos logueados a consola pero no enviados. Pendiente API key real |
| **Stripe** | Preparado (no activo) | Infraestructura de suscripciones lista. Sin procesamiento de pagos real |

**Templates de email preparados:** NDA_SIGNED (a seller), INTEREST_SUBMITTED, LOI_SUBMITTED, DATA_ROOM_ACCESSED, DOCUMENT_DOWNLOADED, VALUATION_RESULT, NDA_BUYER_SIGNED (a buyer).

---

## 9. SEGURIDAD

### 9.1 Autenticación
- **JWT** con token en header `Authorization: Bearer`. Expiración configurable.
- **Google OAuth** vía Emergent Auth (sesión por cookie).
- Passwords hasheados con bcrypt.

### 9.2 Protección de rutas
- `ProtectedRoute` en frontend valida rol y redirecciona.
- `get_current_user` en backend valida JWT/sesión en cada endpoint protegido.
- Buyers con perfil incompleto redirigidos a onboarding.

### 9.3 Datos sensibles
- Infomemo y Data Room solo accesibles post-NDA.
- Nombre legal de la compañía oculto hasta NDA.
- IP, user-agent, timestamp registrados en firma NDA.

### 9.4 CORS
- Configuración: `allow_origins=["*"]`, `allow_credentials=True`. Permite funcionamiento en cualquier dominio.

---

## 10. DATOS DE DEMOSTRACIÓN

### 10.1 Usuarios
22 usuarios: 12 buyers, 10 sellers. Password universal: `demo2026`.

### 10.2 Deals
10 deals en distintos estados: 1 draft, 7 published, 2 exclusivity.

### 10.3 Engagement flow de referencia
`SUBMITTED → VIEWED → ACCEPTED (crea Q&A) → SHORTLISTED → EXCLUSIVITY`

---

## 11. RENDIMIENTO Y OPERACIÓN

### 11.1 Índices MongoDB
- `users`: email (unique), user_id (unique), google_id (sparse).
- `companies`: owner_id, cif (sparse).
- `deals`: company_id, owner_id, status, [status + created_at].
- `engagements`: [deal_id + buyer_id], deal_id, buyer_id.
- `nda_signatures`: signature_id (unique), [deal_id + buyer_user_id], buyer_user_id.
- `valuation_leads`: lead_id (unique), user_id, email.
- `plans`: plan_id implícito.

### 11.2 Seeds automáticos
Al arrancar el backend, se ejecutan seeds idempotentes para: múltiplos de valoración (10), settings de valoración (1), planes (8), fee rules (3), template NDA (1).

### 11.3 Hot reload
Frontend y backend tienen hot reload habilitado. Solo se requiere restart de supervisor para cambios en `.env` o instalación de dependencias.
