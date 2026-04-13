# ARROBA — Contrato Canónico del Deal Process
## Referencia única de estados, eventos, actores, permisos y transiciones

**Fecha:** 13 de abril de 2026 · Versión 1.0

---

## 1. ESTADOS CANÓNICOS

| Estado | Descripción | Actor que activa |
|---|---|---|
| NDA_SIGNED | NDA firmado, proceso iniciado | buyer |
| INTEREST_SUBMITTED | Interés enviado | buyer |
| INTEREST_ACCEPTED | Interés aceptado, Q&A abierto | seller |
| INTEREST_REJECTED | Interés rechazado | seller |
| INTEREST_RESPONDED | Respuesta guiada del seller | seller |
| MEETING_REQUESTED | Reunión solicitada (3 slots) | buyer |
| MEETING_CONFIRMED | Reunión confirmada | arroba |
| MEETING_REJECTED | Reunión rechazada | seller |
| DATA_ROOM_REQUESTED | Acceso al DR solicitado | buyer |
| DATA_ROOM_PARTIALLY_GRANTED | DR concedido (carpetas) | seller |
| DOCUMENT_REQUESTED | Documento específico solicitado | buyer |
| EXCLUSIVITY_REQUESTED | Exclusividad solicitada | buyer |
| EXCLUSIVITY_GRANTED | Exclusividad concedida | seller |
| EXCLUSIVITY_COUNTERED | Contraoferta de plazo | seller |
| PRELIMINARY_OFFER_SUBMITTED | Oferta preliminar enviada | buyer |
| PRELIMINARY_OFFER_ACCEPTED | Oferta preliminar aceptada | seller |
| FORMAL_LOI_SUBMITTED | LOI formal enviada | buyer |
| FORMAL_LOI_ACCEPTED | LOI formal aceptada | seller |
| FORMAL_LOI_COUNTERED | Contraoferta sobre LOI | seller |
| DD_IN_PROGRESS | Due Diligence en curso | auto (tras LOI accepted) |
| DD_COMPLETED_READY_TO_CLOSE | DD completada | auto (todos ítems resueltos) |
| CLOSING_IN_PROGRESS | Cierre en proceso | arroba |
| DEAL_CLOSED_SUCCESS | Operación cerrada con éxito | arroba |
| DEAL_CLOSED_FAILED | Operación caída | arroba |

---

## 2. SUBESTADOS POR MÓDULO

| Módulo | Subestados posibles |
|---|---|
| interest | submitted, accepted, rejected, responded |
| meeting | proposed, info_requested, counter_proposed, slot_accepted, confirmed, rejected |
| qa | active, closed |
| dataroom | requested, partially_granted, rejected, info_requested |
| documents | requested, preparing, sent, rejected, info_requested |
| exclusivity | requested, granted, countered, rejected, expired |
| preliminary_offer | submitted, accepted, rejected, info_requested, upgraded_to_loi |
| formal_loi | submitted, accepted, rejected, countered, clarification_requested |
| due_diligence | started, en_curso, bloqueada, completada |
| closing | preparado, en_documentación, firmado, cerrado_éxito, cerrado_caído |

---

## 3. PERMISOS POR ROL

### Buyer puede:
- Enviar interés
- Solicitar reunión (proponer 3 slots)
- Solicitar acceso Data Room
- Solicitar documentos concretos
- Solicitar exclusividad
- Enviar oferta preliminar
- Formalizar LOI
- Comentar en ítems de DD (no cambiar estado)
- Responder a contraoferta seller
- Ver timeline y estado del proceso
- Ver ficha del deal (según plan)

### Seller puede:
- Aceptar/rechazar/responder interés
- Aceptar/rechazar/proponer alternativa reunión
- Aprobar/rechazar acceso Data Room (seleccionar carpetas)
- Confirmar/rechazar/preparar documentos
- Aceptar/rechazar/contraofertar exclusividad
- Aceptar/rechazar/pedir info oferta preliminar
- Invitar a LOI formal
- Aceptar/rechazar/contraofertar/pedir aclaración LOI
- Gestionar estados ítems DD (pendiente → en_revisión → resuelto → bloqueado)
- Iniciar DD
- Ver buyer profile snapshot

### Advisor puede:
- TODO lo que puede seller en deals bajo su mandato
- Ver panel transversal de mandatos
- Ver alertas críticas multi-deal
- Operar en nombre del seller (mismos permisos)

### ARROBA (admin) puede:
- Confirmar reuniones
- Gestionar estados DD
- Iniciar y gestionar cierre
- Cambiar estado final del deal (cerrado/caído)
- Acceso total a todos los procesos

---

## 4. TRANSICIONES VÁLIDAS

```
NDA_SIGNED
  → INTEREST_SUBMITTED (buyer)
  → MEETING_REQUESTED (buyer)

INTEREST_SUBMITTED
  → INTEREST_ACCEPTED (seller) [side-effect: crear Q&A]
  → INTEREST_REJECTED (seller)
  → INTEREST_RESPONDED (seller)

INTEREST_ACCEPTED
  → MEETING_REQUESTED (buyer)
  → DATA_ROOM_REQUESTED (buyer)
  → DOCUMENT_REQUESTED (buyer)
  → EXCLUSIVITY_REQUESTED (buyer)
  → PRELIMINARY_OFFER_SUBMITTED (buyer)

PRELIMINARY_OFFER_SUBMITTED
  → PRELIMINARY_OFFER_ACCEPTED (seller)
  → PRELIMINARY_OFFER_REJECTED (seller)
  → FORMAL_LOI_SUBMITTED (buyer, tras invite_loi del seller)

FORMAL_LOI_SUBMITTED
  → FORMAL_LOI_ACCEPTED (seller) [side-effect: iniciar DD, exclusividad si solicitada]
  → FORMAL_LOI_COUNTERED (seller)
  → FORMAL_LOI_REJECTED (seller)

FORMAL_LOI_ACCEPTED
  → DD_IN_PROGRESS (automático)

DD_IN_PROGRESS
  → DD_COMPLETED_READY_TO_CLOSE (automático, todos ítems resueltos)

DD_COMPLETED_READY_TO_CLOSE
  → CLOSING_IN_PROGRESS (arroba)

CLOSING_IN_PROGRESS
  → DEAL_CLOSED_SUCCESS (arroba)
  → DEAL_CLOSED_FAILED (arroba)
```

---

## 5. SIDE EFFECTS

| Evento | Efecto |
|---|---|
| INTEREST_ACCEPTED | Crear conversación Q&A buyer-seller |
| EXCLUSIVITY_GRANTED | Bloquear acciones competitivas en deal, actualizar deal.exclusivity |
| FORMAL_LOI_ACCEPTED + exclusivity | Generar milestone formal, activar exclusividad |
| FORMAL_LOI_ACCEPTED | Transición automática a DD_IN_PROGRESS |
| DD todos ítems resueltos | Transición automática a DD_COMPLETED |
| DEAL_CLOSED_SUCCESS | Actualizar deal.status = "closed" |
| DEAL_CLOSED_FAILED | Actualizar deal.status = "dropped" |
| Cada acción | Notificación al otro actor + evento en timeline |

---

## 6. COLECCIONES MONGODB

| Colección | Propósito |
|---|---|
| deal_processes | Estado central + timeline + buyer snapshot |
| interest_expressions | Expresiones de interés |
| meetings | Reuniones (slots, confirmación) |
| dataroom_requests | Solicitudes acceso DR |
| document_requests | Solicitudes documentos |
| exclusivity_requests | Exclusividad (plazo, contraoferta, waitlist) |
| preliminary_offers | Ofertas preliminares |
| formal_lois | LOIs formales (contraoferta, milestone) |
| dd_checklists | Checklist DD (7 áreas, 39 ítems) |
| closing_records | Registro de cierre |

---

## 7. ENDPOINTS

Total: 40+ endpoints bajo `/api/deal-process/`

### Core
- POST /init, GET /{dealId}, GET /timeline, GET /available-actions

### Buyer actions
- POST /interest, /meeting, /dataroom-request, /document-request, /exclusivity, /preliminary-offer, /loi/formalize

### Seller responses
- POST /interest/{id}/respond, /meeting/{id}/respond, /dataroom-request/{id}/respond, /document-request/{id}/respond, /exclusivity/{id}/respond, /preliminary-offer/{id}/respond, /loi/{id}/respond

### DD + Closing
- POST /dd/start, GET /dd/dashboard, POST /dd/checklist/{id}/update
- GET /closing, POST /closing/init, POST /closing/update

### Data
- GET /interests, /meetings, /offers, /lois, /buyer-profile, /seller-dashboard

---

*Documento canónico único del Deal Process ARROBA*
*Sustituye contradicciones entre PRD, roadmap y changelog*
