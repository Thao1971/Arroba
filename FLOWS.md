# FLOWS.md — Arroba Platform
## Flujos funcionales completos

---

## 1. FLUJO BUYER (Comprador)

### 1.1 Registro y Onboarding
```
Landing → Registro (email/Google) → Selección de rol (Buyer)
→ Buyer Profile Form:
    - Tipo (PE, VC, Family Office, Estratégico, Holding)
    - Ticket min/max
    - Revenue range
    - EBITDA range
    - Sectores (taxonomía BUD)
    - Geografías
    - Urgencia (low/medium/high)
    - Control preference (control/minority/flexible)
→ Profile Complete → Acceso completo
```

### 1.2 Exploración (Marketplace)
```
Marketplace → Lista de deals publicados (filtros: sector, revenue, EBITDA, geografía)
→ Click en deal → Teaser público (headline, highlights, métricas display)
→ Si interesa → "Solicitar acceso" (requiere NDA)
```

### 1.3 NDA y Acceso
```
Buyer ve deal → Firma NDA digital
→ NDA registrado en deal.ndas_signed[]
→ Acceso a: Infomemo completo + Data Room (según permisos de carpeta)
→ Evento: NDA_SIGNED tracked
→ Notificación al seller
```

### 1.4 Due Diligence
```
Buyer accede al Data Room → Carpetas (Financiero, Legal, Fiscal, Comercial, Operaciones, Equipo)
→ Ver/Descargar documentos
→ Cada acción tracked (DATA_ROOM_ACCESSED, DOCUMENT_DOWNLOADED, DOCUMENT_VIEWED)
→ Time tracking activo (heartbeat 30s via useTimeTracker)
→ Todo alimenta el Intent Score (0-100)
```

### 1.5 Envío de Interés
```
Buyer decide → "Enviar Interés"
→ Requiere: NDA firmado + Profile completo
→ Formulario: valuation_range, operation_type, message
→ Engagement creado (type=INTEREST, stage=SUBMITTED)
→ Evento: INTEREST_SUBMITTED
→ Notificación al seller
```

### 1.6 Upgrade a LOI
```
Buyer quiere formalizar → "Enviar LOI indicativa"
→ Requiere: Engagement INTEREST existente
→ Formulario: valuation_offer, structure (cash/earn_out/mixed), % adquisición, condiciones, binding
→ Engagement actualizado (type=LOI)
→ Evento: LOI_SUBMITTED
→ Notificación al seller (alta prioridad)
```

### 1.7 Mis Procesos
```
Dashboard Buyer → "Mis Procesos"
→ Lista de todos los deals con engagement activo
→ Por cada deal: stage actual, next step sugerido, LOI info
→ Acceso directo al deal/data room
```

---

## 2. FLUJO SELLER (Vendedor)

### 2.1 Registro y Creación de Empresa
```
Landing → Registro → Selección de rol (Seller)
→ Crear empresa: legal_name, CIF, tipo, sectores, empleados, ubicación
→ Añadir financials (revenue, EBITDA por año)
→ Valoración automática (EBITDA * múltiplo)
```

### 2.2 Creación de Deal
```
Dashboard Seller → "Nuevo Deal"
→ Seleccionar empresa
→ Definir: asking_price, operation_types_allowed, price_negotiable
→ Deal creado en status DRAFT
```

### 2.3 Generación de Teaser (AI)
```
Deal Draft → "Generar Teaser" (GPT-5.2 vía Emergent LLM)
→ AI genera: headline, description, highlights, métricas display
→ Seller revisa y edita
→ Teaser guardado en deal.teaser
```

### 2.4 Generación de Infomemo (AI)
```
Deal con teaser → "Generar Infomemo"
→ AI genera infomemo detallado (markdown)
→ Seller revisa
→ Infomemo guardado en deal.infomemo
```

### 2.5 Publicación
```
Deal Draft → "Publicar"
→ Status cambia a PUBLISHED
→ Deal visible en Marketplace
→ Matching engine calcula scores para buyers compatibles
→ Alertas a buyers con alta afinidad
```

### 2.6 Data Room Management
```
Seller → Data Room del deal
→ Subir documentos a carpetas (Financiero, Legal, etc.)
→ Configurar permisos por buyer (qué carpetas puede ver cada uno)
→ Monitor: log de accesos, descargas, tiempo
```

### 2.7 Gestión de Engagements (Comparador)
```
Seller → "Intereses/LOIs" del deal
→ Vista comparativa: todos los engagements lado a lado
→ Por buyer: tipo (Interest/LOI), valoración, estructura, intent score
→ Acciones: Shortlist (máx 3), Reject, Grant Exclusivity
```

### 2.8 Auto-Shortlist Suggestions
```
Seller ve sugerencias automáticas:
→ RECOMMENDED_SHORTLIST: LOI + alta actividad DR → "Enviar a shortlist"
→ CONSIDER: Alta intención pero falta LOI, o LOI sin actividad → "Esperar"
→ LOW_PRIORITY: Poca actividad → "Descartar"
→ Banner de recomendación si hay candidatos claros
→ Sugerencia de exclusividad si un shortlisted cumple criterios estrictos
```

### 2.9 Shortlist y Exclusividad
```
Shortlist:
→ Máximo 3 buyers
→ Seller añade manualmente (o acepta sugerencia)
→ Engagement stage → SHORTLISTED

Exclusividad:
→ Seller otorga a 1 buyer
→ Deal status → EXCLUSIVITY
→ Nuevos engagements bloqueados
→ Engagement stage → EXCLUSIVITY
```

---

## 3. FLUJO ADVISOR (Asesor) — Scaffold

### 3.1 Registro
```
Landing → Registro como Advisor
→ Datos de firma (firm_name)
→ Gestión multi-mandato (mandate_ids[])
```

### 3.2 Gestión de Mandatos
```
Dashboard Advisor → Crear mandato para seller
→ Vincular empresa del seller al mandato
→ Gestionar deals del mandato como si fuera el seller
→ Acceso a: Dashboard, Comparador, Data Room, Suggestions
```

> **Nota**: El flujo advisor está scaffolded pero no completamente implementado en UI.

---

## 4. FLUJO ADMIN — Scaffold

### 4.1 Acceso
```
Login con role=admin
→ Acceso total a todos los deals, users, engagements
→ Puede ver métricas globales de la plataforma
```

> **Nota**: No hay UI de admin dedicada. Se accede vía API o roles.

---

## 5. FLUJO DE MATCHING

```
Buyer completa perfil → Matching Engine calcula score (0-100) vs cada deal publicado

Factores:
1. Taxonomy match (30pts): solapamiento de sectores/categorías
2. Size match (25pts): revenue/EBITDA del deal vs ticket del buyer
3. Geography match (20pts): ubicación compatible
4. Operation type match (15pts): full_sale/partial_sale/merger
5. Buyer type fit (10pts): estratégico vs financiero

Output:
→ Alta afinidad (≥65): Deal aparece primero en marketplace
→ Media (40-64): Aparece con indicador de afinidad
→ Baja (<40): Aparece al final o sin indicador
```

---

## 6. FLUJO DE INTENT SCORING

```
Cada acción del buyer alimenta el intent score (0-100):

LOI enviada:          +40 pts
DR descargas (máx):   +20 pts (4pts por descarga, cap 20)
DR acceso (≥1):       +10 pts
DR tiempo ≥15min:     +15 pts (proporcional desde 5min)
Infomemo ≥10min:      +10 pts (proporcional desde 3min)
Alta afinidad match:  +5 pts

Niveles:
→ Alta (≥55): Buyer con intención seria
→ Media (25-54): Buyer evaluando, necesita seguimiento
→ Baja (<25): Buyer casual o inactivo
```

---

## 7. FLUJO DE SUGGESTION ENGINE

```
Para cada deal, clasifica todos los buyers:

Inputs: intent_score + has_loi + dr_downloads + dr_time + stage actual

RECOMMENDED_SHORTLIST: LOI + intent alta + ≥1 descarga DR
→ Acción sugerida: "Enviar a shortlist"

CONSIDER: Alta intención sin LOI, o LOI sin actividad
→ Acción sugerida: "Esperar más actividad"

LOW_PRIORITY: Baja actividad
→ Acción sugerida: "Descartar"

Overrides:
→ ALREADY_SHORTLISTED: Ya en shortlist (no se sugiere nada)
→ EXCLUSIVITY: Ya en exclusividad
→ REJECTED: Descartado por seller

Exclusividad suggestion (criterios estrictos):
→ Buyer en shortlist + LOI + intent alta + ≥2 descargas + ≥20min DR
```

---

## 8. FLUJO DE NOTIFICACIONES

```
Eventos que generan notificaciones in-app (para seller):
- INTEREST_SUBMITTED: "X ha enviado interés"
- LOI_SUBMITTED: "X ha enviado LOI por Y EUR"
- NDA_SIGNED: "X ha firmado NDA"
- DOCUMENT_DOWNLOADED: "X descargó documento del Data Room"
- DATA_ROOM_ACCESSED: "X accedió al Data Room" (primera vez)
- SHORTLIST_SUGGESTED: "Sistema sugiere shortlistar X buyers"

Agrupación: mismo evento + mismo deal + mismo actor dentro de 60s → se agrupa
Email: Scaffolded (email_service.py con placeholders, SendGrid no configurado)
```

---

## 9. FLUJO DE TIME TRACKING

```
Frontend:
- useTimeTracker hook en DealPage, Infomemo, DataRoom
- Detecta visibilitychange (pestaña activa/inactiva)
- Heartbeat cada 30 segundos → POST /api/tracking/time
- Payload: {deal_id, section, duration_seconds, session_id}

Backend:
- Acumula por buyer+deal+section+session
- Cap 1800s (30min) por sesión
- Alimenta compute_intent_score()
```
