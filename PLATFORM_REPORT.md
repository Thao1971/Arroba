# ARROBA — Informe Completo de Plataforma
**Fecha:** 13 de abril de 2026
**Titular:** BUD Advisors, S.L. · CIF B70821400
**URL:** https://musing-hellman-9.preview.emergentagent.com

---

## 1. RESUMEN EJECUTIVO

| Metrica | Valor |
|---|---|
| Lineas de codigo backend (Python) | 15.307 |
| Lineas de codigo frontend (JS) | 13.527 |
| Total lineas produccion | 28.834 |
| Colecciones MongoDB | 37 |
| Documentos totales | 1.294 |
| Usuarios | 24 |
| Empresas | 14 |
| Deals | 11 |
| Seller Profiles (CIS) | 5 |
| NDAs firmados | 12 |
| Contact requests | 9 |
| Engagements | 19 |
| Planes configurados | 8 |
| Categorias taxonomia | 10 |
| Backend routers | 26 |
| Frontend pages | 24 |
| Frontend components | 13 |
| Test iterations | 31 |
| Test files pytest | 26 |

---

## 2. STACK TECNICO

| Capa | Tecnologia |
|---|---|
| Frontend | React 18 + Tailwind CSS + Shadcn/UI + Recharts |
| Backend | FastAPI (Python 3.11) + uvicorn, puerto 8001 |
| Base de datos | MongoDB 7 (Motor async) |
| Almacenamiento | Emergent Object Storage |
| IA | OpenAI GPT-5.2 (Emergent LLM Key) |
| Auth | JWT + Session cookies httpOnly + Google OAuth (Emergent Auth) |
| PDF | reportlab |
| Deploy | Kubernetes (Emergent preview) |

---

## 3. INTEGRACIONES

| Servicio | Estado | Detalle |
|---|---|---|
| CIS WeAreBUDAdvisors | **Activo** | Master Company Resolver, 3 cache entries, 5 profiles |
| OpenAI GPT-5.2 | **Activo** | Premium IA, 3 analyses cached |
| Emergent Object Storage | **Activo** | PDFs, documentos |
| Emergent Auth (Google) | **Activo** | OAuth social login |
| Iberinform | **Activo** | Fallback CIS |
| SendGrid | **Mockeado** | 7 templates, envios logueados |
| Stripe | **Mockeado** | Checkout scaffolded |

---

## 4. USUARIOS (24)

### Por rol
| Rol | Cantidad |
|---|---|
| Buyer | 11 |
| Seller | 11 |
| Advisor | 1 |
| Admin | 1 |

### Por plan (buyers)
| Plan | Cantidad |
|---|---|
| Free | 7 |
| Buyer Pro | 2 |
| Buyer Pro+ | 2 |

### Cuentas principales
| Email | Rol | Plan |
|---|---|---|
| admin@arroba.com | admin | — |
| diego.martin@rankingdigital.es | seller | — |
| nuria.costa@brillocreativo.cat | seller | — |
| carlos.ruiz@capitaliberica.es | buyer | Pro+ (cambiado) |
| iker.aguirre@familyoffice-norte.es | buyer | Pro |
| james.harris@techventures.co.uk | buyer | Pro |
| marta.font@groupdigital.cat | buyer | Pro+ |

Password universal demo: `demo2026` | Admin: `admin2026`

---

## 5. EMPRESAS (14)

| Company ID | Nombre | CIF | Ciudad | Sectores |
|---|---|---|---|---|
| comp_ranking_digital | Ranking Digital S.L. | — | Madrid | SEO, SEM, Performance |
| comp_brillo_creativo | Brillo Creativo | — | Barcelona | Branding, Creatividad |
| comp_consult_valencia | Consult Digital | — | Valencia | Consultoria |
| comp_data_analytics_mad | DataPulse Analytics | — | Madrid | Data, Analytics |
| comp_social_media_bcn | Social Buzz | — | Barcelona | Social Media |
| comp_ecommerce_bilbao | Norte Ecommerce | — | Bilbao | E-commerce |
| comp_content_sevilla | ContenidoSur Studio | — | Sevilla | Content |
| comp_ux_madrid | UX Atelier | — | Madrid | UX, Producto |
| comp_programatica_bcn | Programatica Digital | — | Barcelona | Programatica, AdTech |
| comp_e4ac88f79823 | P. Modernos Creativos | B67098228 | Barcelona | — (CIS) |
| comp_7f34b4aad10e | — | — | — | — (workspace test) |
| comp_f71fd75d78b8 | Saffron Brand | A82938614 | Madrid | — (CIS) |
| comp_41b82859f917 | — | — | — | — (workspace test) |
| comp_planta16 | Planta 16 | — | — | — |

---

## 6. DEALS (11)

| Deal ID | Titulo | Status | Asking Price | Owner |
|---|---|---|---|---|
| deal_hot_seo_01 | Agencia SEO lider en Madrid | exclusivity | 3.500.000 | seller_seo_madrid_01 |
| deal_interest_creative_02 | Estudio creativo boutique en Barcelona | published | 2.800.000 | seller_creative_bcn_01 |
| deal_ghost_consult_03 | Consultora digital en Valencia | published | 1.200.000 | seller_consult_val_01 |
| deal_fresh_data_04 | Startup data analytics Madrid | published | 5.200.000 | seller_data_mad_01 |
| deal_cold_social_05 | Agencia social media Barcelona | published | 950.000 | seller_social_bcn_01 |
| deal_warm_ecommerce_06 | Plataforma e-commerce Bilbao | exclusivity | 3.800.000 | seller_ecom_bilbao_01 |
| deal_new_content_07 | Estudio de contenido Sevilla | published | 700.000 | seller_content_sev_01 |
| deal_hot_ux_08 | Estudio UX premium Madrid | published | 2.100.000 | seller_ux_mad_01 |
| deal_programatica_09 | Agencia programatica Barcelona | published | 4.500.000 | seller_prog_bcn_01 |
| deal_portfolio_10 | Portfolio agencia Aragon | draft | 350.000 | seller_aragon_01 |
| deal_cis_putos_modernos | Agencia creativa lider BCN | published | 4.000.000 | seller_seo_madrid_01 |

---

## 7. PLANES Y PRICING (8)

### Seller
| Plan | Precio/mes | Interacciones | Comision |
|---|---|---|---|
| Seller Free | Gratis | 0 | 2.9% |
| Seller Plus | 149€ | 5 | 2.5% |
| Seller Premium | 499€ | Ilimitadas | 1.5% |

### Buyer
| Plan | Precio/mes | Interacciones | Comision |
|---|---|---|---|
| Buyer Free | Gratis | 0 | 1% |
| Buyer Pro | 149€ | 5 | 0.5% |
| Buyer Pro+ | 349€ | Ilimitadas | 0% |

### Advisor
| Plan | Precio/mes | Comision |
|---|---|---|
| Advisor Free | Gratis | 15% |
| Advisor Pro | 250€ | 15% |

---

## 8. TAXONOMIA — 10 CATEGORIAS

| Categoria | Multiplo Min | Multiplo Mid | Multiplo Max |
|---|---|---|---|
| Estrategia y Management Consulting | 4.0x | 5.0x | 6.0x |
| Creatividad y Produccion | 3.0x | 4.0x | 5.0x |
| Medios, Planificacion y Compra | 3.5x | 4.5x | 5.5x |
| Data, AdTech y MarTech | 5.0x | 6.5x | 8.0x |
| CRM, Loyalty y Marketing Automation | 4.0x | 5.5x | 7.0x |
| Commerce y Retail Media | 4.0x | 5.0x | 6.5x |
| SEO, SEM y Performance | 3.5x | 4.5x | 5.5x |
| Social Media, Influencer y Content | 3.0x | 4.0x | 5.0x |
| UX, Producto y Desarrollo | 3.5x | 5.0x | 6.5x |
| PR, Comunicacion y Eventos | 3.0x | 4.0x | 5.0x |

---

## 9. NDAs FIRMADOS (12)

| Firmante | Deal | Estado |
|---|---|---|
| Carlos Ruiz | deal_hot_seo_01 | signed |
| James Harris | deal_hot_seo_01 | signed |
| Marta Font | deal_hot_seo_01 | signed |
| Marta Font | deal_interest_creative_02 | signed |
| James Harris | deal_cis_putos_modernos | signed |
| Marta Font | deal_cis_putos_modernos | signed |
| (+ 6 mas del seed) | | signed |

---

## 10. CONTACT REQUESTS (9)

| Buyer | Deal | Status | Plan |
|---|---|---|---|
| Carlos Ruiz | deal_hot_seo_01 | accepted | free |
| Iker Aguirre | deal_hot_seo_01 | accepted | pro |
| James Harris | deal_cis_putos_modernos | accepted | pro |
| Marta Font | deal_cis_putos_modernos | accepted | pro+ |
| Marta Font | deal_hot_seo_01 | accepted | pro+ |
| Marta Font | deal_interest_creative_02 | accepted | pro+ |
| (+ 3 mas) | | | |

---

## 11. SELLER PROFILES (CIS) — 5

| Profile ID | Seller | CIF | Company ID | Readiness |
|---|---|---|---|---|
| scp_0dc2ae66af76 | seller_seo_madrid_01 | B67098228 | comp_e4ac88f79823 | — |
| scp_a22c204b26c6 | seller_seo_madrid_01 | A82938614 | — | — |
| scp_6aab20f60e50 | seller_seo_madrid_01 | B67098228 | — | — |
| scp_be956912974b | seller_creative_bcn_01 | A82938614 | comp_f71fd75d78b8 | — |
| scp_3be0f413f178 | seller_creative_bcn_01 | B86462958 | — | — |

---

## 12. COLECCIONES MONGODB (37)

| Coleccion | Documentos |
|---|---|
| users | 24 |
| companies | 14 |
| deals | 11 |
| engagements | 19 |
| nda_signatures | 12 |
| nda_events | 18 |
| ndas (legacy) | 26 |
| notifications | 29 |
| events | 116 |
| contact_requests | 9 |
| seller_company_profiles | 5 |
| plans | 8 |
| valuation_multiples | 10 |
| valuation_leads | 21 |
| valuation_runs | 21 |
| qa_items | 10 |
| financial_visuals | 7 |
| match_alerts | 33 |
| time_tracking | 72 |
| dataroom_access_log | 62 |
| user_sessions | 751 |
| premium_analysis_cache | 3 |
| cis_financial_cache | 3 |
| transaction_fee_rules | 3 |
| valuation_premium_requests | 2 |
| conversations | 1 |
| nda_templates | 1 |
| seller_settings | 1 |
| valuation_settings | 1 |
| admin_audit_log | 1 |
| (7 colecciones vacias) | 0 |

---

## 13. RUTAS FRONTEND (35)

### Publicas
| Ruta | Pagina |
|---|---|
| / | Home |
| /explorar | Marketplace |
| /explorar/:dealId | DealPageCanonical (ficha canonica) |
| /valoracion | ValuationWizard |
| /planes | PlansPage |
| /login | Login |
| /register | Register |
| /auth/callback | AuthCallback (Google OAuth) |

### Buyer (requiere auth + role buyer)
| Ruta | Pagina |
|---|---|
| /buyer/onboarding | BuyerOnboarding |
| /buyer/procesos | BuyerDashboard |
| /buyer/guardados | SavedDeals |
| /buyer/deal/:dealId | DealPageCanonical |

### Seller (requiere auth + role seller)
| Ruta | Pagina |
|---|---|
| /seller/deals | SellerDashboard |
| /seller/company/new | SellerCompanyWorkspace |
| /seller/company/:companyId | SellerCompanyWorkspace |
| /seller/deals/:dealId/:section | SellerWorkspace (DealManagement) |

### Admin (requiere auth + role admin)
| Ruta | Pagina |
|---|---|
| /admin/dashboard | AdminConsole |
| /admin/* | AdminConsole (11 secciones) |

---

## 14. BACKEND ROUTERS (26)

| Router | Prefijo | Funcionalidad |
|---|---|---|
| auth | /api/auth | Login, register, Google OAuth, sesiones |
| users | /api/users | Perfil usuario |
| marketplace | /api/marketplace | Listado deals publico |
| companies | /api/companies | CRUD empresas + financials + valoracion |
| deals | /api/deals | CRUD deals + matching + health |
| seller_profiles | /api/seller-profiles | CIS resolve, workspace, overrides |
| contact_requests | /api/deals | Contact request system (buyer→seller) |
| deal_presentation | /api/deals | Orquestador de presentacion + premium analysis |
| admin | /api/admin | Console admin (11 secciones) |
| engagements | /api/engagements | LOIs, interes, actividad, comparator |
| nda | /api/nda | NDA mutuo digital, firma, PDF |
| infomemo | /api/infomemo | Generacion infomemo (GPT-5.2) |
| teaser | /api/teaser | Generacion teaser (GPT-5.2) |
| dataroom | /api/dataroom | Data room, carpetas, documentos, acceso |
| matching | /api/matching | Score afinidad, recomendaciones |
| conversations | /api/conversations | Q&A bidireccional |
| coaching | /api/coaching | Nudges prescriptivos seller |
| notifications | /api/notifications | Notificaciones in-app |
| tracking | /api/tracking | Event tracking, time tracking |
| buyer_certification | /api/buyer | Certificacion 3 niveles |
| billing | /api/billing | Resumen facturacion |
| subscriptions | /api/subscriptions | Gestion suscripciones |
| plans | /api/plans | Planes y precios publicos |
| taxonomy | /api/taxonomy | Categorias y subcategorias |
| valuation | /api/valuation | Motor valoracion publica |
| cif_lookup | /api/cif | Busqueda CIF |

---

## 15. SERVICIOS BACKEND (25)

| Servicio | Fichero | Funcion |
|---|---|---|
| CIS Client | services/cis_client.py | Conexion al Centro de Inteligencia Sectorial |
| Company Resolution | services/company_resolution_service.py | Orquesta CIS + Iberinform fallback |
| Iberinform | services/iberinform_service.py | Adapter Iberinform API |
| Deal Presentation Orchestrator | services/deal_presentation/orchestrator.py | Orquestador ficha canonica |
| Asset Analyzer | services/deal_presentation/asset_analyzer.py | Subagente 1: analisis activos |
| Access Rules | services/deal_presentation/access_rules.py | Subagente 2: reglas acceso por plan |
| CTA Engine | services/deal_presentation/cta_engine.py | Subagente 4: CTA + acciones + timeline |
| Premium Quant | services/deal_presentation/premium_quant.py | KPIs financieros avanzados (8 metricas) |
| Premium Benchmark | services/deal_presentation/premium_benchmark.py | Percentiles por categoria |
| Premium Valuation | services/deal_presentation/premium_valuation.py | Quality score + escenarios EV |
| Premium Intelligence | services/deal_presentation/premium_intelligence.py | GPT-5.2 interpretacion IA |
| Coaching | services/coaching_service.py | Nudges prescriptivos |
| Deal Health | services/deal_health_service.py | Semaforo salud deal |
| Email | services/email_service.py | SendGrid (mockeado) |
| Financial Visuals | services/financial_visuals_service.py | Generacion graficos |
| Infomemo | services/infomemo_service.py | Generacion infomemo GPT |
| Intent | services/intent_service.py | Scoring interes buyer |
| Matching | services/matching_service.py | Score afinidad buyer-deal |
| Notifications | services/notification_service.py | Notificaciones in-app |
| Readiness | services/readiness_service.py | Deal readiness checklist |
| Storage | services/storage_service.py | Emergent Object Storage |
| Suggestion | services/suggestion_service.py | Sugerencias contextuales |
| Taxonomy | services/taxonomy.py | Categorias MadTech |
| Teaser | services/teaser_service.py | Generacion teaser GPT |
| Valuation | services/valuation_service.py | Lead gen valoracion |

---

## 16. ORQUESTADOR DE PRESENTACION DE DEALS

### Arquitectura
```
GET /api/deals/{dealId}/presentation
    |
    ├── Subagente 1: Asset Analyzer → content_richness_score, visual_mode
    ├── Subagente 2: Access Rules → per-module state (open/preview_locked/nda_required/...)
    ├── Subagente 3: Layout Compositor → sections
    ├── Subagente 4: CTA Engine → primary_cta, actions_panel, process_timeline
    └── Premium (Pro+ con NDA):
        ├── Premium Quant → 8 KPIs deterministas
        ├── Premium Benchmark → percentiles por categoria
        ├── Premium Valuation → quality_score, escenarios EV, equity, metodologia
        └── Premium Intelligence → GPT-5.2 (async, cached)
```

### Estados de visibilidad
```
LOCKED_CONTACT_REQUIRED → CONTACT_REQUESTED → TEASER_UNLOCKED (Free cap)
                                             → NDA_AVAILABLE (Pro/Pro+)
                                             → OPERATIVE_ACCESS (post-NDA)
```

### Reglas por plan
| Capacidad | Free | Pro | Pro+ |
|---|---|---|---|
| Card resumida | Si | Si | Si |
| Teaser anonimizado | Tras contacto | Siempre | Siempre (prioridad) |
| Firmar NDA | No | Tras contacto | Tras contacto |
| Acceso operativo | No | Tras NDA | Tras NDA |
| KPIs avanzados | No | No | Tras NDA |
| Valoracion premium | No | No | Tras NDA |
| Analisis IA GPT-5.2 | No | No | Tras NDA |

---

## 17. ADMIN CONSOLE (11/11 secciones)

| Seccion | Ruta | Funcionalidad |
|---|---|---|
| Salud plataforma | /admin/overview | KPIs, funnel conversion, alertas, deals estancados, Free stuck |
| Moderacion Deals | /admin/deals | Lista, checklist calidad, flags, aprobar/rechazar |
| Gestion Usuarios | /admin/users | Tabla, filtros, cambiar plan, activar/desactivar |
| Taxonomia | /admin/product/taxonomy | CRUD 10 categorias, multiplos, historial cambios |
| Planes y pricing | /admin/product/pricing | 8 planes, edicion precio/interacciones, comisiones |
| Integraciones | /admin/product/integrations | Estado CIS, GPT, Storage, SendGrid, Stripe |
| Emails y logs | /admin/comms/communications | Log notificaciones sistema |
| Soporte y Q&A | /admin/comms/tickets | Conversaciones, preguntas, pendientes |
| Integridad datos | /admin/control/data-audit | Huerfanos, PK faltantes, sesiones, audit log |
| Permisos | /admin/trust/permissions | Roles, planes, rutas protegidas, feature gates |
| NDAs y Data Room | /admin/trust/legal-dataroom | Tabla NDAs firmados, governance |

---

## 18. MODULOS IMPLEMENTADOS

### Completados y verificados
- Home Page con hero tabs + valoracion + deals destacados
- Marketplace con filtros + senales + matching + share menu + cards orquestadas
- Seller Company Workspace (5 paneles modulares, CIS resolve, persistencia dual)
- Buyer Dashboard Premium (6 tabs, certificacion 3 niveles)
- Buyer Onboarding (seleccion tipo, verificacion empresa, revision)
- Ficha Canonica de Deal (14 bloques, estado por modulo, subnav sticky, recharts)
- Orquestador de Presentacion (5 subagentes, contact request system)
- Premium Intelligence Agent (KPIs, benchmark, valoracion, GPT-5.2)
- NDA Mutuo Digital (texto legal v2.0, firma, PDF, audit)
- LOI Comparator
- Buyer Activity Panel
- Q&A Workspace bidireccional
- Data Room (carpetas, upload, control acceso, log descargas)
- Financial Visuals (recharts)
- CIS como Master Data Layer (+ Iberinform fallback)
- Planes y Precios (8 planes, 3 fee rules)
- Valoracion Publica (motor interno, lead magnet)
- Matching (score afinidad, match_reason)
- Coaching prescriptivo (nudges seller)
- Deal Readiness + Deal Health
- Admin Console (11 secciones)
- Formato numerico espanol global (formatES.js)
- Auth JWT + Google OAuth + httpOnly cookies

### Mockeado
- SendGrid (7 templates preparados)
- Stripe (checkout scaffolded)

---

## 19. HARDENING TECNICO APLICADO

| Fase | Scope | Estado |
|---|---|---|
| FASE 1 | Undefined vars, auth refactor, admin refactor, empty catches, console.* | Completado |
| FASE 2 | Hook deps, useMemo, index keys, component split (PremiumBlocks) | Completado |
| FASE 3 | Auth cookies httpOnly, type hints database, test .env.test | Completado |

---

## 20. TESTING

| Iteracion | Scope | Resultado |
|---|---|---|
| 20-27 | Seller Wizard, Valoracion, Planes, NDA, Buyer Dashboard | 100% |
| 28 | Seller Company Workspace P0 | Backend 21/21, Frontend 95% |
| 29 | Orquestador Fases 1-3 | Backend 29/29, Frontend 100% |
| 30 | Ficha Canonica Orquestada | Backend 41/41, Frontend 100% |
| 31 | Consolidacion 3 Planes | Backend 27/27, Frontend 100% |

---

## 21. DESIGN SYSTEM: "The Digital Artifact"

| Elemento | Valor |
|---|---|
| Tipografia | IBM Plex Sans (300-800) |
| Border radius | 0px globalmente |
| Surface-0 (fondo) | #f9f9f9 |
| Surface-1 | #f3f3f3 |
| Surface-2 | #e2e2e2 |
| Surface-lowest (cards) | #ffffff |
| Primary (arroba-coral) | #B6212A |
| Secondary (arroba-blue) | #006493 |
| On-surface | #191c1e |
| Labels | ALL CAPS, 0.05em letter-spacing, 9-10px, weight 700 |

---

*Fin del Informe Completo de Plataforma ARROBA*
*Generado: 13 de abril de 2026*
