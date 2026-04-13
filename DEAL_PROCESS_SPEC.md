# ARROBA — Especificacion Tecnica: Flujo Agentico Orquestado
## Evolucion canonica buyer-seller-advisor

**Fecha:** 13 de abril de 2026
**Version:** 1.0
**Para:** Implementacion real en Emergent

---

## INDICE

1. Arquitectura del Deal Orchestrator
2. Modelo de datos
3. Estados canonicos y transiciones
4. Endpoints backend
5. Rutas frontend
6. Componentes React
7. Plan de implementacion por fases
8. Microcopy por modulo
9. Reutilizacion vs creacion
10. Que no tocar

---

## 1. ARQUITECTURA DEL DEAL ORCHESTRATOR

### Principio

Un unico `DealOrchestrator` central que:
- Recibe eventos (buyer_action, seller_response, arroba_decision, system_timeout)
- Delega a subagentes por modulo
- Actualiza el estado canonico del deal-buyer
- Emite efectos (notificaciones, emails, bloqueos, desbloqueos)
- Mantiene el timeline de hitos

### Estructura

```
DealOrchestrator (central)
├── BuyerAgent        — valida permisos, perfil minimo, plan gating
├── SellerAgent       — valida respuestas, gobernanza seller
├── ArrobaAgent       — mediacion, confirmaciones, gobernanza final
└── Subagentes por modulo:
    ├── InterestAgent           — mostrar interes + match
    ├── MeetingAgent            — propuesta, negociacion slots, confirmacion
    ├── QAAgent                 — reutiliza Q&A existente, extiende
    ├── DataRoomAccessAgent     — solicitud, aprobacion parcial
    ├── DocumentRequestAgent    — solicitud, preparacion, entrega
    ├── ExclusivityAgent        — solicitud, contraoferta, bloqueo
    ├── PreliminaryOfferAgent   — wizard 6 pasos, respuesta seller
    ├── FormalLOIAgent          — precarga oferta, negociacion, hito
    ├── DueDiligenceAgent       — checklist compartida, estados
    └── ClosingAgent            — cierre, gobernanza ARROBA
```

### Persistencia

```python
# Coleccion: deal_processes
{
    "process_id": "proc_xxxx",
    "deal_id": "deal_xxx",
    "buyer_id": "buyer_xxx",
    "seller_id": "seller_xxx",
    "state": "INTEREST_ACCEPTED",       # estado canonico
    "sub_states": {                      # subestados por modulo
        "meeting": "MEETING_CONFIRMED",
        "dataroom": "DATA_ROOM_PARTIALLY_GRANTED",
        "exclusivity": null,
        "offer": null,
    },
    "timeline": [                        # hitos inmutables
        {"event": "NDA_SIGNED", "at": "...", "by": "buyer"},
        {"event": "INTEREST_SUBMITTED", "at": "...", "data": {...}},
        {"event": "INTEREST_ACCEPTED", "at": "...", "by": "seller"},
    ],
    "buyer_profile_snapshot": {...},     # ficha estatica buyer
    "created_at": "...",
    "updated_at": "...",
}
```

### Flujo de un evento

```
1. Frontend envia accion (POST /api/deal-process/{dealId}/action)
2. DealOrchestrator recibe {action, payload, actor}
3. BuyerAgent valida: perfil minimo, plan gating, estado valido
4. Subagente correspondiente ejecuta logica
5. Orquestador actualiza estado + timeline
6. Emite efectos: notificaciones, emails, desbloqueos
7. Retorna nuevo estado al frontend
```

### Backend: ficheros

```
/app/backend/
├── services/deal_process/
│   ├── __init__.py
│   ├── orchestrator.py          — DealOrchestrator central
│   ├── buyer_agent.py           — validacion buyer
│   ├── seller_agent.py          — validacion seller
│   ├── arroba_agent.py          — mediacion ARROBA
│   ├── interest_agent.py
│   ├── meeting_agent.py
│   ├── dataroom_access_agent.py
│   ├── document_request_agent.py
│   ├── exclusivity_agent.py
│   ├── preliminary_offer_agent.py
│   ├── formal_loi_agent.py
│   ├── due_diligence_agent.py
│   └── closing_agent.py
├── routers/
│   └── deal_process.py          — router unificado
```

---

## 2. MODELO DE DATOS

### 2.1 deal_processes (coleccion nueva)

```python
{
    "process_id": str,              # "proc_{uuid12}"
    "deal_id": str,
    "buyer_id": str,
    "seller_id": str,
    "state": str,                   # estado canonico principal
    "sub_states": {
        "interest": str | None,
        "meeting": str | None,
        "qa": str | None,
        "dataroom": str | None,
        "documents": str | None,
        "exclusivity": str | None,
        "preliminary_offer": str | None,
        "formal_loi": str | None,
        "due_diligence": str | None,
        "closing": str | None,
    },
    "buyer_profile_snapshot": {     # capturado al firmar NDA
        "entity_name": str,
        "buyer_type": str,          # estrategico, financiero, family_office, corporativo
        "contact_person": str,
        "contact_role": str,
        "investment_ticket": str,
        "sectors_of_interest": [str],
        "geography": str,
        "investment_thesis": str,
        "certification_level": str,
        "website": str,
    },
    "timeline": [
        {
            "event": str,           # estado canonico
            "at": str,              # ISO timestamp
            "by": str,              # buyer_id | seller_id | "arroba"
            "data": dict | None,    # payload del evento
            "note": str | None,
        }
    ],
    "permissions": {
        "dataroom_folders": [str],  # carpetas autorizadas por seller
        "can_submit_offer": bool,
        "can_request_exclusivity": bool,
    },
    "created_at": str,
    "updated_at": str,
}
```

### 2.2 meetings (coleccion nueva)

```python
{
    "meeting_id": str,
    "process_id": str,
    "deal_id": str,
    "buyer_id": str,
    "seller_id": str,
    "status": str,                  # proposed, info_requested, counter_proposed, confirmed, rejected, completed
    "proposed_slots": [
        {"datetime": str, "duration_minutes": int}
    ],
    "counter_slots": [              # propuestos por seller/ARROBA
        {"datetime": str, "duration_minutes": int, "proposed_by": str}
    ],
    "confirmed_slot": {
        "datetime": str,
        "duration_minutes": int,
        "confirmed_by": "arroba",
    } | None,
    "purpose": str,                 # exploratorio, negociacion, due_diligence, post_oferta
    "label": str,                   # etiqueta buyer
    "message": str | None,
    "rejection_reason": str | None,
    "rejection_category": str | None,
    "meeting_brief": {              # generado al confirmar
        "attendees": [str],
        "objective": str,
        "deal_summary": str,
        "notes": str,
        "recommended_materials": [str],
    } | None,
    "created_at": str,
    "updated_at": str,
}
```

### 2.3 interest_expressions (coleccion nueva)

```python
{
    "interest_id": str,
    "process_id": str,
    "deal_id": str,
    "buyer_id": str,
    "interest_type": str,           # exploratory, serious, strategic, financial
    "message": str,
    "indicative_range": {
        "min": float | None,
        "max": float | None,
    } | None,
    "status": str,                  # submitted, accepted, rejected, responded
    "seller_response": {
        "action": str,              # accept, reject, respond
        "message": str | None,
        "rejection_reason": str | None,
        "guided_response": str | None,   # open_qa, request_meeting, request_dataroom, complete_profile, explain_fit
    } | None,
    "created_at": str,
    "updated_at": str,
}
```

### 2.4 document_requests (coleccion nueva)

```python
{
    "request_id": str,
    "process_id": str,
    "deal_id": str,
    "buyer_id": str,
    "category": str,                # financiero, legal, fiscal, comercial, operaciones, equipo, tecnologia
    "description": str,
    "message": str | None,
    "status": str,                  # requested, confirmed, preparing, sent, rejected, info_requested
    "seller_response": {
        "action": str,
        "message": str | None,
        "document_url": str | None,
        "added_to_dataroom": bool,
    } | None,
    "created_at": str,
    "updated_at": str,
}
```

### 2.5 exclusivity_requests (coleccion nueva)

```python
{
    "exclusivity_id": str,
    "process_id": str,
    "deal_id": str,
    "buyer_id": str,
    "requested_period_days": int,
    "rationale": str,
    "message": str | None,
    "status": str,                  # requested, granted, rejected, countered, expired
    "counter_period_days": int | None,
    "granted_start": str | None,
    "granted_end": str | None,
    "waitlist": [str],              # buyer_ids esperando fin exclusividad
    "created_at": str,
    "updated_at": str,
}
```

### 2.6 preliminary_offers (coleccion nueva)

```python
{
    "offer_id": str,
    "process_id": str,
    "deal_id": str,
    "buyer_id": str,
    "status": str,                  # draft, submitted, accepted, rejected, info_requested, upgraded_to_loi
    # Paso 1: Resumen
    "buyer_entity": str,
    "validity_date": str,
    "commitment_level": str,        # exploratory, indicative, binding_intent
    "executive_summary": str,
    # Paso 2: Perimetro
    "operation_type": str,
    "acquisition_pct": float,
    "target_structure": str,
    "exclusions": str | None,
    # Paso 3: Valoracion
    "enterprise_value": float,
    "equity_value": float | None,
    "valuation_basis": str,
    "valuation_comment": str | None,
    # Paso 4: Estructura de pago
    "cash_at_closing": float,
    "deferred_payment": float | None,
    "earnout": {
        "max_amount": float,
        "period_months": int,
        "metric": str,
        "description": str,
        "example": str,
    } | None,
    "equity_rollover": float | None,
    # Paso 5: Condiciones
    "subject_to_dd": bool,
    "subject_to_approval": bool,
    "subject_to_financing": bool,
    "requests_exclusivity": bool,
    "exclusivity_days": int | None,
    "founder_permanence": str | None,
    # Paso 6: Confirmacion
    "legal_accepted": bool,
    "completeness_score": int,
    # Respuesta seller
    "seller_response": {
        "action": str,
        "message": str | None,
    } | None,
    "created_at": str,
    "updated_at": str,
}
```

### 2.7 formal_lois (coleccion nueva)

Misma estructura que preliminary_offers + campos adicionales:

```python
{
    "loi_id": str,
    "source_offer_id": str | None,     # precarga desde oferta preliminar
    "exclusivity_requested": bool,
    "exclusivity_days": int,
    "formal_commitment_level": str,
    "legal_text": str,
    "buyer_explicit_acceptance": bool,
    # Contraoferta seller
    "counter_offer": {
        "enterprise_value": float | None,
        "cash_at_closing": float | None,
        "earnout": dict | None,
        "exclusivity_days": int | None,
        "conditions": str | None,
    } | None,
    "counter_status": str | None,       # buyer_accepted, buyer_rejected, buyer_clarification_requested
    # Hito formal
    "milestone": {
        "exclusivity_start": str,
        "exclusivity_end": str,
        "buyer_selected": str,
        "conditions_summary": str,
    } | None,
}
```

### 2.8 dd_checklists (coleccion nueva)

```python
{
    "checklist_id": str,
    "process_id": str,
    "deal_id": str,
    "status": str,                      # in_progress, completed, ready_to_close
    "blocks": [
        {
            "block_id": str,
            "name": str,                # financiero, legal, fiscal, comercial, operaciones, equipo, tecnologia
            "status": str,              # pending, in_progress, completed
            "items": [
                {
                    "item_id": str,
                    "label": str,
                    "status": str,      # pending, in_review, resolved, blocked
                    "blocked_reason": str | None,
                    "blocked_action": str | None,
                    "comments": [
                        {"author_id": str, "role": str, "text": str, "at": str, "internal": bool}
                    ],
                    "updated_by": str,
                    "updated_at": str,
                }
            ],
        }
    ],
    "created_at": str,
    "updated_at": str,
}
```

---

## 3. ESTADOS CANONICOS Y TRANSICIONES

### Estado principal (deal_processes.state)

```
NDA_SIGNED
  → INTEREST_SUBMITTED          (buyer envia interes)
  → MEETING_REQUESTED           (buyer solicita reunion directa)

INTEREST_SUBMITTED
  → INTEREST_ACCEPTED           (seller acepta)
  → INTEREST_REJECTED           (seller rechaza)
  → INTEREST_RESPONDED          (seller responde con accion guiada)

INTEREST_ACCEPTED
  → MEETING_REQUESTED
  → DATA_ROOM_REQUESTED
  → DOCUMENT_REQUESTED
  → EXCLUSIVITY_REQUESTED
  → PRELIMINARY_OFFER_SUBMITTED
  → FORMAL_LOI_SUBMITTED

MEETING_REQUESTED
  → MEETING_INFO_REQUESTED      (seller/ARROBA pide mas info)
  → MEETING_COUNTER_PROPOSED    (seller propone alternativas)
  → MEETING_CONFIRMED           (ARROBA confirma)
  → MEETING_REJECTED            (seller rechaza)

DATA_ROOM_REQUESTED
  → DATA_ROOM_PARTIALLY_GRANTED
  → DATA_ROOM_REJECTED

EXCLUSIVITY_REQUESTED
  → EXCLUSIVITY_GRANTED
  → EXCLUSIVITY_COUNTERED
  → EXCLUSIVITY_REJECTED

PRELIMINARY_OFFER_SUBMITTED
  → PRELIMINARY_OFFER_ACCEPTED
  → PRELIMINARY_OFFER_REJECTED
  → PRELIMINARY_OFFER_INFO_REQUESTED
  → FORMAL_LOI_SUBMITTED        (seller invita a LOI)

FORMAL_LOI_SUBMITTED
  → FORMAL_LOI_ACCEPTED
  → FORMAL_LOI_COUNTERED
  → FORMAL_LOI_REJECTED

FORMAL_LOI_ACCEPTED
  → DD_IN_PROGRESS

DD_IN_PROGRESS
  → DD_COMPLETED_READY_TO_CLOSE

DD_COMPLETED_READY_TO_CLOSE
  → CLOSING_IN_PROGRESS

CLOSING_IN_PROGRESS
  → DEAL_CLOSED_SUCCESS
  → DEAL_CLOSED_FAILED
  → DEAL_CLOSED_PENDING_FORMALIZATION
```

### Plan gating por accion

| Accion | Free | Pro | Pro+ |
|---|---|---|---|
| Firmar NDA | No | Si (perfil basico) | Si |
| Mostrar interes | No | Si (perfil completo) | Si |
| Solicitar reunion | No | Si (perfil completo) | Si |
| Abrir Q&A | No | Si (post-NDA) | Si |
| Solicitar Data Room | No | Si (perfil completo) | Si |
| Solicitar documentos | No | Si (perfil completo) | Si |
| Pedir exclusividad | No | Si (perfil completo) | Si (prioridad) |
| Oferta preliminar | No | Si (perfil + datos corp.) | Si |
| LOI formal | No | Si (perfil + buyer identificado) | Si |

### Perfil minimo por accion

| Accion | Requisito |
|---|---|
| Firmar NDA | email verificado + nombre + empresa |
| Mostrar interes | + tipo buyer + ticket + sectores + geografia |
| Solicitar reunion | mismo que interes |
| Solicitar Data Room | mismo que interes |
| Enviar oferta preliminar | + datos corporativos (CIF, direccion, representante legal) |
| Enviar LOI formal | + identificacion completa buyer |

---

## 4. ENDPOINTS BACKEND

### Router: `/api/deal-process`

```
# Proceso principal
POST   /api/deal-process/{dealId}/init                  — inicia proceso tras NDA
GET    /api/deal-process/{dealId}                       — estado completo del proceso
GET    /api/deal-process/{dealId}/timeline               — timeline de hitos
POST   /api/deal-process/{dealId}/action                 — accion generica (el orchestrator delega)

# Interes
POST   /api/deal-process/{dealId}/interest               — buyer envia interes
POST   /api/deal-process/{dealId}/interest/{id}/respond   — seller responde

# Reuniones
POST   /api/deal-process/{dealId}/meeting                — buyer propone reunion
POST   /api/deal-process/{dealId}/meeting/{id}/respond    — seller/ARROBA responde
POST   /api/deal-process/{dealId}/meeting/{id}/confirm    — ARROBA confirma

# Data Room
POST   /api/deal-process/{dealId}/dataroom-request        — buyer solicita acceso
POST   /api/deal-process/{dealId}/dataroom-request/{id}/respond  — seller responde

# Documentos
POST   /api/deal-process/{dealId}/document-request        — buyer solicita documento
POST   /api/deal-process/{dealId}/document-request/{id}/respond  — seller responde

# Exclusividad
POST   /api/deal-process/{dealId}/exclusivity             — buyer solicita
POST   /api/deal-process/{dealId}/exclusivity/{id}/respond — seller responde

# Oferta preliminar
POST   /api/deal-process/{dealId}/preliminary-offer       — buyer envia (wizard completo)
POST   /api/deal-process/{dealId}/preliminary-offer/{id}/respond  — seller responde

# LOI formal
POST   /api/deal-process/{dealId}/formal-loi              — buyer envia
POST   /api/deal-process/{dealId}/formal-loi/{id}/respond  — seller responde
POST   /api/deal-process/{dealId}/formal-loi/{id}/counter-respond  — buyer responde a contraoferta

# Due Diligence
GET    /api/deal-process/{dealId}/dd-checklist             — checklist actual
POST   /api/deal-process/{dealId}/dd-checklist/{itemId}/update  — seller/ARROBA cambia estado
POST   /api/deal-process/{dealId}/dd-checklist/{itemId}/comment — buyer comenta

# Cierre
GET    /api/deal-process/{dealId}/closing                  — vista cierre
POST   /api/deal-process/{dealId}/closing/update-status    — solo ARROBA

# Buyer profile drawer (seller-side)
GET    /api/deal-process/{dealId}/buyer-profile             — ficha estatica buyer
```

---

## 5. RUTAS FRONTEND

### Nuevas rutas

```
/buyer/deal/:dealId/process                — vista principal del proceso buyer
/buyer/deal/:dealId/process/interest       — formulario interes
/buyer/deal/:dealId/process/meeting        — solicitar reunion
/buyer/deal/:dealId/process/dataroom       — solicitar acceso Data Room
/buyer/deal/:dealId/process/documents      — solicitar documentos
/buyer/deal/:dealId/process/exclusivity    — solicitar exclusividad
/buyer/deal/:dealId/process/offer          — wizard oferta preliminar (6 pasos)
/buyer/deal/:dealId/process/loi            — LOI formal
/buyer/deal/:dealId/process/dd             — vista due diligence
/buyer/deal/:dealId/process/closing        — vista cierre

/seller/deals/:dealId/process/:buyerId     — vista seller del proceso con un buyer
/seller/deals/:dealId/comparator           — comparador de buyers (ya existe, extender)
```

### Rutas que NO cambian

```
/explorar/:dealId                          — ficha canonica (ya existe)
/buyer/procesos                            — buyer dashboard (extiende con nuevos estados)
/seller/deals                              — seller dashboard (ya existe)
/qa/:conversationId                        — Q&A (reutilizar)
```

---

## 6. COMPONENTES REACT

### Nuevos componentes

```
/frontend/src/components/deal-process/
├── DealProcessView.js              — vista principal buyer del proceso
├── InterestForm.js                 — microformulario interes
├── MeetingRequestForm.js           — propuesta reunion (3 slots + motivo)
├── MeetingResponsePanel.js         — seller/ARROBA responde
├── DataRoomRequestForm.js          — solicitud acceso DR
├── DocumentRequestForm.js          — solicitud documentos concretos
├── ExclusivityRequestForm.js       — solicitud exclusividad
├── PreliminaryOfferWizard.js       — wizard 6 pasos
├── FormalLoiForm.js                — LOI formal (precarga oferta)
├── DueDiligenceView.js             — checklist DD + comentarios
├── ClosingView.js                  — vista cierre
├── ProcessTimeline.js              — timeline visual de hitos
├── BuyerProfileDrawer.js           — ficha estatica buyer (seller-side)
├── SellerResponsePanel.js          — panel respuesta seller generico
├── ProcessActionBar.js             — barra de acciones disponibles
├── MicrocopyHelper.js              — componente de ayuda contextual
```

### Componentes existentes que se extienden

```
BuyerDashboard.js                   — anadir nuevos estados en "Mis procesos"
SellerWorkspace.js                  — anadir tab "Proceso" con comparador
DealPageCanonical.js                — CTA conecta con /process
```

---

## 7. PLAN DE IMPLEMENTACION POR FASES

### FASE 1 (Core — Semana 1-2)

| Tarea | Tipo | Prioridad |
|---|---|---|
| Modelo deal_processes + orchestrator.py | Backend | P0 |
| buyer_agent.py (validacion perfil + plan gating) | Backend | P0 |
| interest_agent.py + endpoint | Backend | P0 |
| meeting_agent.py + endpoint | Backend | P0 |
| InterestForm.js + MeetingRequestForm.js | Frontend | P0 |
| ProcessTimeline.js | Frontend | P0 |
| DealProcessView.js (vista principal) | Frontend | P0 |
| BuyerProfileDrawer.js (seller-side) | Frontend | P0 |
| ProcessActionBar.js con acciones/blocked/reasons | Frontend | P0 |
| MicrocopyHelper.js | Frontend | P0 |
| Integracion con BuyerDashboard "Mis procesos" | Frontend | P0 |

### FASE 2 (Data Room + Documentos + Exclusividad — Semana 3)

| Tarea | Tipo | Prioridad |
|---|---|---|
| dataroom_access_agent.py | Backend | P0 |
| document_request_agent.py | Backend | P0 |
| exclusivity_agent.py + bloqueo competitivo | Backend | P0 |
| DataRoomRequestForm.js | Frontend | P0 |
| DocumentRequestForm.js | Frontend | P0 |
| ExclusivityRequestForm.js + estado visible | Frontend | P0 |
| SellerResponsePanel.js (generico para todas las respuestas) | Frontend | P0 |
| Waitlist post-exclusividad (otros buyers) | Frontend | P1 |

### FASE 3 (Ofertas — Semana 4-5)

| Tarea | Tipo | Prioridad |
|---|---|---|
| preliminary_offer_agent.py | Backend | P0 |
| formal_loi_agent.py + contraoferta | Backend | P0 |
| PreliminaryOfferWizard.js (6 pasos) | Frontend | P0 |
| FormalLoiForm.js (precarga + exclusividad) | Frontend | P0 |
| Seller comparator extension (ofertas lado a lado) | Frontend | P1 |

### FASE 4 (DD + Cierre — Semana 6)

| Tarea | Tipo | Prioridad |
|---|---|---|
| due_diligence_agent.py + checklist | Backend | P0 |
| closing_agent.py + gobernanza ARROBA | Backend | P0 |
| DueDiligenceView.js (checklist + comentarios) | Frontend | P0 |
| ClosingView.js (resumen + checklist cierre) | Frontend | P0 |
| Automatismos: bloque completado, DD completada | Backend | P1 |

### POSTERIOR

| Tarea | Prioridad |
|---|---|
| Google Calendar / Meet integration | P2 |
| Emails recordatorio reuniones (48h/24h/1h) | P2 |
| Resumenes IA avanzados | P2 |
| Advisor dashboard extendido | P2 |
| Closing juridico profundo | P2 |

---

## 8. MICROCOPY POR MODULO

### Interes

| Punto | Texto |
|---|---|
| Titulo | "Expresar interes en esta oportunidad" |
| Subtitulo | "El vendedor recibira tu expresion de interes y podra aceptar, responder o declinar." |
| Tipo de interes | "Selecciona el nivel de interes que mejor describe tu situacion actual." |
| Rango orientativo | "Opcional. Un rango orientativo ayuda al vendedor a evaluar el encaje, pero no es vinculante." |
| Mensaje | "Este mensaje sera visible por el vendedor y por ARROBA." |
| Post-envio | "Tu expresion de interes ha sido enviada. El vendedor la revisara y respondra." |
| Aceptado | "El vendedor ha aceptado tu interes. Se ha abierto un canal de Q&A para continuar." |

### Reunion

| Punto | Texto |
|---|---|
| Titulo | "Solicitar videoconferencia" |
| Subtitulo | "Las reuniones siempre incluyen buyer, seller y un representante de ARROBA." |
| Slots | "Propone 3 franjas horarias. El vendedor y ARROBA confirmaran la mas viable." |
| Motivo | "Indica el motivo de la reunion para que todos los asistentes puedan prepararse." |
| Rechazada | "El vendedor ha declinado la reunion. Motivo: {reason}. Puedes solicitar otra o continuar por Q&A." |
| Confirmada | "Reunion confirmada por ARROBA para {date}. Se enviaran recordatorios a 48h, 24h y 1h." |

### Data Room

| Punto | Texto |
|---|---|
| Titulo | "Solicitar acceso al Data Room" |
| Subtitulo | "Esta solicitud no abre automaticamente todo el Data Room. El vendedor seleccionara las carpetas a las que te da acceso." |
| Post-solicitud | "Tu solicitud ha sido enviada. El vendedor decidira que carpetas compartir contigo." |
| Aprobado parcial | "El vendedor te ha dado acceso a {n} carpetas. Puedes solicitar acceso adicional." |

### Documentos

| Punto | Texto |
|---|---|
| Titulo | "Solicitar un documento concreto" |
| Subtitulo | "Describe el documento que necesitas. El vendedor podra enviartelo directamente o anadirlo al Data Room." |
| Categoria | "Selecciona la categoria para que el vendedor ubique tu solicitud." |
| En preparacion | "El vendedor ha confirmado tu solicitud y esta preparando el documento." |
| Entregado | "El documento ha sido entregado. Puedes consultarlo en el Data Room o en la seccion de documentos." |

### Exclusividad

| Punto | Texto |
|---|---|
| Titulo | "Solicitar exclusividad" |
| Subtitulo | "La exclusividad bloqueara otras acciones competitivas hasta la fecha indicada. Otros compradores veran que hay un proceso exclusivo activo." |
| Plazo | "Indica el plazo que solicitas. El vendedor puede aceptar, rechazar o proponer un plazo alternativo." |
| Concedida | "Exclusividad concedida hasta {date}. Otros compradores no podran enviar ofertas durante este periodo." |
| Expirada | "La exclusividad ha expirado. El deal vuelve a estar abierto a otros compradores." |

### Oferta preliminar

| Paso 1 | "Resumen de tu oferta. Estos datos ayudan al vendedor a entender rapidamente tu propuesta." |
| Paso 2 | "Define el perimetro de la operacion: que quieres comprar y como." |
| Paso 3 | "Indica tu valoracion. Puedes anadir un comentario para contextualizar la cifra." |
| Paso 4 | "Estructura el pago. Si incluyes earn-out, explica como se calcula." |
| Paso 5 | "Condiciones. Indica si la oferta esta sujeta a due diligence, aprobacion interna o financiacion." |
| Paso 6 | "Revisa tu oferta. Una vez enviada, el vendedor la evaluara y respondera." |

### LOI formal

| Punto | Texto |
|---|---|
| Precarga | "Los datos de tu oferta preliminar se han precargado. Revisa y completa los campos adicionales." |
| Exclusividad | "La LOI formal requiere una peticion explicita de exclusividad." |
| Legal | "Al enviar esta LOI, aceptas los terminos indicados. Este documento tiene caracter indicativo y no vinculante salvo las clausulas de exclusividad y confidencialidad." |
| Contraoferta | "El vendedor ha enviado una contraoferta. Puedes aceptar, rechazar o solicitar reunion para negociar." |

### Due Diligence

| Punto | Texto |
|---|---|
| Titulo | "Due Diligence en curso" |
| Subtitulo | "Checklist compartida. El vendedor y ARROBA gestionan los estados. Tu puedes comentar en cada item." |
| Bloqueado | "Este item esta bloqueado. Motivo: {reason}. Accion para desbloquear: {action}." |
| Completado | "Todos los items de este bloque estan resueltos. Bloque completado automaticamente." |
| DD completada | "Todos los bloques de due diligence estan completados. El proceso avanza a fase de cierre." |

### Cierre

| Punto | Texto |
|---|---|
| Titulo | "Cierre de la operacion" |
| Subtitulo | "Vista de seguimiento del cierre. Solo ARROBA gestiona los estados de esta fase." |
| Cerrado exito | "Operacion cerrada con exito. Enhorabuena." |
| Cerrado fallido | "Operacion cerrada sin ejecutar." |

---

## 9. REUTILIZACION VS CREACION

### REUTILIZAR (no reescribir)

| Modulo | Fichero | Como reutilizar |
|---|---|---|
| NDA mutuo digital | routers/nda.py | Sin cambios. El NDA inicia el deal_process |
| Q&A Workspace | routers/conversations.py, ConversationPage.js | Extender: vincular a process_id |
| Data Room | routers/dataroom.py, DataRoomBuyerView.js | Extender: permisos por carpeta desde deal_process |
| Notifications | services/notification_service.py | Usar para todos los eventos del proceso |
| Tracking | routers/tracking.py, services/events_service.py | Trackear cada accion del proceso |
| Buyer Dashboard | BuyerDashboard.js | Extender "Mis procesos" con nuevos estados |
| Buyer Certification | routers/buyer_certification.py | Usar para validar perfil minimo por accion |
| Auth | routers/auth.py | Sin cambios |
| Layout | components/layout/ | Sin cambios |
| formatES | utils/formatES.js | Sin cambios |
| Presentations | deal_presentation/ | CTA de la ficha canonica conecta con /process |

### CREAR NUEVO

| Modulo | Justificacion |
|---|---|
| deal_processes coleccion | Estado central del proceso buyer-seller |
| orchestrator.py | Logica central de transiciones |
| 10 subagentes | Logica de negocio por modulo |
| meetings coleccion | Reunion es un flujo nuevo |
| interest_expressions coleccion | Interes estructurado es nuevo |
| document_requests coleccion | Solicitud documental es nueva |
| exclusivity_requests coleccion | Exclusividad con bloqueo es nueva |
| preliminary_offers coleccion | Wizard 6 pasos es nuevo |
| formal_lois coleccion | LOI formal con contraoferta es nueva |
| dd_checklists coleccion | Due diligence estructurada es nueva |
| 16 componentes React | Formularios y vistas del proceso |

---

## 10. QUE NO TOCAR

| Modulo | Razon |
|---|---|
| Branding (IBM Plex Sans, colores, 0px radius) | Instruccion explicita |
| Layout sidebar izquierda | Instruccion explicita |
| Home Page | No afectada por el flujo de proceso |
| Valoracion publica | Modulo independiente |
| Seller Company Workspace | Flujo seller de preparacion de activo |
| Marketplace | Solo se extiende el CTA de la ficha |
| Admin Console | Independiente |
| Planes y Precios page | Solo se consulta para gating |
| Auth flow | Refactorizado en FASE 3 hardening |
| seed_demo.py | Datos de demo |
| SellerWizard.js / SellerWizardBoceto.js | Codigo muerto |

---

## 11. COMPATIBILIDAD CON DATOS EXISTENTES

### Migracion de engagements actuales

Los 19 engagements existentes mantienen su estructura. El nuevo deal_processes convive con engagements. Para deals pre-existentes con NDA:

```python
# Al acceder a un deal con NDA pero sin deal_process:
# El sistema crea automaticamente un deal_process con state=NDA_SIGNED
# y migra la info del engagement existente al timeline.
```

### NDAs existentes

Los 12 NDAs firmados se respetan. Al acceder al deal, si hay NDA pero no deal_process, se inicializa automaticamente.

---

*Fin de la Especificacion Tecnica*
*Documento para implementacion real en Emergent*
*ARROBA · BUD Advisors, S.L.*
