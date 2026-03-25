# MANUAL DE PLATAFORMA — ARROBA
## Estado actual, flujos funcionales y roadmap

---

## 1. QUE ES ARROBA

Plataforma M&A para comprar y vender agencias digitales. Conecta sellers (duenos de agencias) con buyers (PE, VC, Family Office, Holdings, Estrategicos) en un entorno confidencial y estructurado.

---

## 2. LO QUE ESTA HECHO Y FUNCIONA

### 2.1 AUTENTICACION
| Funcionalidad | Estado | Notas |
|---|---|---|
| Registro con email/password | FUNCIONAL | Roles: buyer, seller, advisor, admin |
| Login JWT + sessions | FUNCIONAL | Token refresh, session tracking |
| Google OAuth (Emergent) | FUNCIONAL | Boton "Continuar con Google" |
| Recuperacion de password | NO IMPLEMENTADO | — |

### 2.2 FLUJO SELLER (Vender agencia)

| Paso | Funcionalidad | Estado | Detalles |
|---|---|---|---|
| 1 | Registro como seller | FUNCIONAL | — |
| 2 | Crear empresa (datos basicos, CIF, sector, financieros) | FUNCIONAL | Wizard de 5 pasos. Lookup por CIF via Iberinform |
| 3 | Calcular valoracion | FUNCIONAL | Automatica basada en EBITDA + sector + crecimiento |
| 4 | Crear deal (tipo operacion, precio, condiciones) | FUNCIONAL | Estados: draft → published |
| 5 | Generar Teaser con IA | FUNCIONAL | GPT-5.2 genera headline, descripcion, highlights |
| 6 | Generar Infomemo con IA | FUNCIONAL | GPT-5.2 genera documento extenso |
| 7 | Publicar deal en marketplace | FUNCIONAL | Activacion con preview |
| 8 | Data Room (subir documentos) | FUNCIONAL | Upload chunked, carpetas, control de acceso |
| 9 | Gestionar interesados (ver buyers, shortlist, rechazar) | FUNCIONAL | Tabla cross-deal con acciones prescriptivas |
| 10 | Conceder exclusividad | FUNCIONAL | Con friccion real ("CONFIRMO" si buyer no cumple criterios) |
| 11 | Coaching prescriptivo (nudges) | FUNCIONAL | "Baja el precio un 15%", "Contacta al buyer mas activo" |
| 12 | Cerrar/abandonar deal | FUNCIONAL | — |

**Dashboard seller**: Nudges del coaching, metricas del deal (vistas, NDAs, LOIs), acceso rapido a gestion.

### 2.3 FLUJO BUYER (Comprar agencia)

| Paso | Funcionalidad | Estado | Detalles |
|---|---|---|---|
| 1 | Registro como buyer | FUNCIONAL | — |
| 2 | Onboarding (perfil inversor) | FUNCIONAL | Sectores, ticket, geografia, tipo buyer |
| 3 | Explorar marketplace | FUNCIONAL | Filtros: sector, tipo operacion, facturacion, pais |
| 4 | Ver teaser de deal | FUNCIONAL | Datos publicos de la agencia |
| 5 | Firmar NDA digital | FUNCIONAL | Firma con checkbox, registra fecha |
| 6 | Ver infomemo completo (post-NDA) | FUNCIONAL | Documento detallado de la agencia |
| 7 | Acceder al Data Room (post-NDA) | FUNCIONAL | Documentos financieros, legales, etc. |
| 8 | Expresar interes | FUNCIONAL | Tipo INTEREST (interes basico) |
| 9 | Enviar LOI (Letter of Intent) | FUNCIONAL | Tipo LOI con valoracion, estructura, condiciones |
| 10 | Guardar deal como favorito | FUNCIONAL | Bookmark para revision posterior |
| 11 | Ver "Mis procesos" | FUNCIONAL | Vista de todos los deals activos con proximo paso |
| 12 | Matching score | FUNCIONAL | Score 0-100 buyer-deal basado en perfil |

**Dashboard buyer**: Deals activos con proximo paso prescriptivo, deals recomendados por matching, stats del mercado.

### 2.4 MARKETPLACE

| Funcionalidad | Estado | Detalles |
|---|---|---|
| Listado de deals publicados | FUNCIONAL | Con paginacion y filtros |
| Soft Signals de mercado | FUNCIONAL | "2 LOIs recibidas", "Varios buyers evaluando", "En fase avanzada" |
| Internal Deal Score | FUNCIONAL | Score invisible 0-100 que ordena por actividad real |
| Ordenacion | FUNCIONAL | "Mayor actividad" (por defecto), "Mas recientes", "Por relevancia" |
| Filtros | FUNCIONAL | Sector, tipo operacion, facturacion, pais |
| Deals destacados en Home | FUNCIONAL | Top 6 por score con signals |

### 2.5 SISTEMA DE COACHING (Seller)

| Funcionalidad | Estado | Detalles |
|---|---|---|
| Nudges prescriptivos | FUNCIONAL | Acciones concretas, no diagnosticos |
| Warning exclusividad prematura | FUNCIONAL | Friccion real con confirmacion "CONFIRMO" |
| Buyers inactivos agrupados | FUNCIONAL | 1 nudge para N buyers inactivos |
| Action pills en nudges | FUNCIONAL | "Revisar precio", "Mejorar infomemo", "Contactar" |
| Nudges por deal y cross-deal | FUNCIONAL | En dashboard y en Interesados |

### 2.6 INTENT SCORING

| Funcionalidad | Estado | Detalles |
|---|---|---|
| Time tracking (heartbeat 30s) | FUNCIONAL | Mide tiempo real en cada deal |
| Intent score 0-100 por buyer | FUNCIONAL | Basado en tiempo, vistas, DR, NDA, LOI |
| Auto-shortlist suggestions | FUNCIONAL | RECOMMENDED / CONSIDER / LOW_PRIORITY |

### 2.7 NOTIFICACIONES

| Funcionalidad | Estado | Detalles |
|---|---|---|
| Notificaciones in-app | FUNCIONAL | Bell icon con contador unread |
| Eventos: NDA, interes, LOI, shortlist | FUNCIONAL | Se generan automaticamente |
| Marcar como leido | FUNCIONAL | Individual y "leer todas" |

### 2.8 DATA ROOM

| Funcionalidad | Estado | Detalles |
|---|---|---|
| Upload de documentos (chunked) | FUNCIONAL | Emergent Object Storage |
| Carpetas | FUNCIONAL | Organizacion por tipo |
| Control de acceso (per buyer) | FUNCIONAL | Seller decide quien ve que |
| Descarga de documentos | FUNCIONAL | — |
| Log de acceso | FUNCIONAL | Registra quien accede y cuando |

### 2.9 DISENO Y UX

| Funcionalidad | Estado | Detalles |
|---|---|---|
| Design System "The Digital Artifact" | IMPLEMENTADO | IBM Plex Sans, 0px radius, surface hierarchy |
| Navegacion role-based | FUNCIONAL | Public/Buyer/Seller/Advisor headers dinamicos |
| Responsive | PARCIAL | Desktop optimizado, mobile basico |
| Boceto nuevo Seller Wizard | SOLO BOCETO | En /boceto/seller — no funcional |

---

## 3. LO QUE ESTA PARCIAL O MOCKEADO

| Funcionalidad | Estado | Que falta |
|---|---|---|
| **Email (SendGrid)** | MOCKEADO | Solo logea a consola. Falta API key real + plantillas |
| **Stripe (pagos)** | SCAFFOLD | Endpoints existen, test key cargada. Sin flujo UI real |
| **Advisor dashboard** | PLACEHOLDER | Solo pagina "Proximamente". Sin logica de mandatos |
| **Admin panel** | NO EXISTE | Sin UI ni endpoints admin |
| **PDF export infomemo** | NO IMPLEMENTADO | Solo HTML/JSON, no PDF descargable |
| **Recuperacion password** | NO IMPLEMENTADO | — |
| **Seller Wizard V2** | SOLO BOCETO | Boceto visual en /boceto/seller. El wizard actual funciona pero con el diseno viejo |

---

## 4. LO QUE FALTA PARA ESTAR COMPLETAMENTE FUNCIONAL

### CRITICO (sin esto no puedes operar)

| # | Funcionalidad | Impacto | Esfuerzo |
|---|---|---|---|
| 1 | **Email real (SendGrid)** | Sin emails, seller no recibe alertas de nuevos interesados, buyer no recibe confirmacion de NDA | Medio (necesita API key + templates) |
| 2 | **Comunicacion buyer-seller** | No hay forma de que las partes hablen dentro de la plataforma. Hoy dependen de email externo | Alto |
| 3 | **Deal state transitions completas** | Faltan transiciones claras: published → nda → evaluation → shortlist → exclusivity → DD → closed | Medio |
| 4 | **Due Diligence como fase formal** | Hoy "exclusividad" es el ultimo estado visible. No hay fase DD con checklist | Medio |

### IMPORTANTE (mejora mucho la experiencia)

| # | Funcionalidad | Impacto | Esfuerzo |
|---|---|---|---|
| 5 | **Seller Wizard V2** | El wizard actual funciona pero es largo y poco visual. El boceto mejora mucho la UX | Alto |
| 6 | **LOI Comparator visual** | Seller necesita comparar LOIs lado a lado facilmente | Medio |
| 7 | **Deal Health System** | Alertas automaticas: "deal estancado", "buyer inactivo 7 dias" | Medio |
| 8 | **Deal Readiness checklist** | Pre-publicacion: "tienes financieros? tienes teaser? data room tiene docs?" | Bajo |
| 9 | **PDF export** | Seller/buyer necesitan PDF del infomemo para compartir offline | Medio |
| 10 | **Responsive mobile** | Mobile esta basico. Muchos sellers/buyers consultan desde movil | Alto |

### NICE TO HAVE (diferencial pero no bloqueante)

| # | Funcionalidad | Impacto | Esfuerzo |
|---|---|---|---|
| 11 | Advisor como operador (gestionar deals de seller) | Abre el canal B2B con advisors | Alto |
| 12 | Admin panel | Gestion de usuarios, deals, metricas globales | Alto |
| 13 | Q&A integrado en Data Room | Buyer pregunta, seller responde, todo trazado | Medio |
| 14 | Analytics dashboard (seller) | Graficos de actividad, conversion, funnel | Medio |
| 15 | Stripe (monetizacion) | Planes de pago para sellers/buyers premium | Medio |

---

## 5. BASE DE DATOS (Estado actual)

| Coleccion | Documentos | Descripcion |
|---|---|---|
| users | 22 | Usuarios registrados (sellers, buyers, advisors) |
| companies | 11 | Empresas/agencias registradas |
| deals | 10 | Deals (operaciones de compraventa) |
| engagements | 20 | Intereses y LOIs de buyers |
| ndas | 25 | NDAs firmados |
| events | 146 | Eventos del sistema (NDA, interes, LOI, shortlist...) |
| time_tracking | 65 | Sesiones de tiempo de buyers en deals |
| notifications | 15 | Notificaciones in-app |
| dataroom_access_log | 60 | Log de acceso al data room |
| saved_deals | 2 | Deals guardados como favorito |
| match_alerts | 21 | Alertas de matching buyer-deal |
| user_sessions | 281 | Sesiones de usuario |

---

## 6. STACK TECNICO

| Capa | Tecnologia |
|---|---|
| Frontend | React 18 + Tailwind CSS + Shadcn/UI |
| Backend | FastAPI (Python 3.11) + Motor (async MongoDB) |
| Base de datos | MongoDB |
| Storage | Emergent Object Storage (S3-compatible) |
| IA | OpenAI GPT-5.2 (Emergent LLM Key) |
| Auth | JWT + Sessions + Google OAuth (Emergent) |
| Design System | IBM Plex Sans, 0px radius, surface hierarchy |
| Lookup CIF | Iberinform API (test credentials) |
| Email | SendGrid (MOCKEADO — solo logs) |
| Pagos | Stripe (scaffold — test key cargada) |

---

## 7. CREDENCIALES DE TEST (Seed Data)

**Password universal**: `demo2026`

### Sellers
| Email | Nombre | Agencia |
|---|---|---|
| diego.martin@rankingdigital.es | Diego Martin | Ranking Digital (SEO Madrid) |
| nuria.costa@brillocreativo.cat | Nuria Costa | Brillo Creativo (Barcelona) |

### Buyers
| Email | Nombre | Tipo |
|---|---|---|
| carlos.ruiz@capitaliberica.es | Carlos Ruiz | PE (Private Equity) |
| marta.font@llavor.vc | Marta Font Puig | VC (Venture Capital) |
| james.harris@expansiongroup.com | James Harris | Estrategico (UK) |

### URLs principales
| Pagina | URL |
|---|---|
| Home | `/` |
| Marketplace | `/explorar` |
| Deal detalle | `/explorar/{deal_id}` |
| Login | `/login` |
| Registro | `/register` |
| Seller dashboard | `/seller/deals` |
| Seller interesados | `/seller/interesados` |
| Seller gestion deal | `/seller/deal/{deal_id}` |
| Buyer procesos | `/buyer/procesos` |
| Buyer guardados | `/buyer/guardados` |
| Boceto wizard V2 | `/boceto/seller` |

---

## 8. ENDPOINTS API (90 endpoints)

### Auth (5)
`POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `POST /api/auth/session`

### Users (3)
`GET /api/users/me` · `PUT /api/users/me` · `PUT /api/users/me/buyer-profile`

### Companies (6)
`POST /api/companies` · `GET /api/companies` · `GET /api/companies/{id}` · `PUT /api/companies/{id}` · `POST /api/companies/{id}/financials` · `POST /api/companies/{id}/calculate-valuation`

### Deals (13)
`POST /api/deals` · `GET /api/deals` · `GET /api/deals/{id}` · `PUT /api/deals/{id}` · `GET /api/deals/{id}/page` · `POST /api/deals/{id}/activate` · `POST /api/deals/{id}/sign-nda` · `POST /api/deals/{id}/request-access` · `POST /api/deals/{id}/shortlist` · `POST /api/deals/{id}/grant-exclusivity/{buyer}` · `POST /api/deals/{id}/approve-access/{buyer}` · `POST /api/deals/{id}/close` · `POST /api/deals/{id}/drop`

### Engagements (13)
`POST /api/engagements/interest` · `GET /api/engagements/deal/{id}` · `GET /api/engagements/my-processes` · `GET /api/engagements/my-status/{id}` · `POST /api/engagements/deal/{id}/shortlist/{buyer}` · `DELETE /api/engagements/deal/{id}/shortlist/{buyer}` · `POST /api/engagements/deal/{id}/exclusivity/{buyer}` · `POST /api/engagements/deal/{id}/reject/{buyer}` · `POST /api/engagements/{id}/upgrade-to-loi` · `POST /api/engagements/save/{id}` · `DELETE /api/engagements/save/{id}` · `GET /api/engagements/saved` · `GET /api/engagements/seller/interesados`

### Marketplace (5)
`GET /api/marketplace/deals` · `GET /api/marketplace/deals/{id}/teaser` · `GET /api/marketplace/featured` · `GET /api/marketplace/sectors` · `GET /api/marketplace/stats`

### Coaching (3)
`GET /api/coaching/nudges` · `GET /api/coaching/nudges/deal/{id}` · `GET /api/coaching/exclusivity-check/{deal}/{buyer}`

### Data Room (7)
`POST /api/dataroom/deals/{id}/upload` · `GET /api/dataroom/deals/{id}/documents` · `GET /api/dataroom/documents/{id}/download` · `GET /api/dataroom/documents/{id}/view` · `DELETE /api/dataroom/documents/{id}` · `GET /api/dataroom/deals/{id}/permissions` · `PUT /api/dataroom/deals/{id}/permissions/{buyer}`

### Teaser/Infomemo (6)
`POST /api/teaser/generate/{company}` · `GET /api/teaser/{deal}` · `PUT /api/teaser/{deal}` · `POST /api/infomemo/generate/{company}` · `GET /api/infomemo/{deal}` · `PUT /api/infomemo/{deal}`

### Tracking/Intent (5)
`POST /api/tracking/time` · `GET /api/tracking/time/{deal}/{buyer}` · `GET /api/tracking/intent/{deal}` · `GET /api/tracking/intent/{deal}/{buyer}` · `GET /api/tracking/suggestions/{deal}`

### Matching (3)
`GET /api/matching/deals` · `GET /api/matching/buyers/{deal}` · `POST /api/matching/click/{deal}`

### Notifications (4)
`GET /api/notifications` · `GET /api/notifications/unread-count` · `POST /api/notifications/{id}/read` · `POST /api/notifications/read-all`

### Otros (11)
Taxonomy (3) · Subscriptions/Stripe (7) · CIF Lookup (1)
