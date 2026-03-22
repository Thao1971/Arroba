# ARROBA - Product Requirements Document (PRD)

## Version: 1.8.0
## Last Updated: Marzo 2026

---

## 1. Problem Statement

Plataforma de compraventa y fusión de agencias digitales (Arroba).
- **Discovery**: Marketplace + matching engine
- **Transaccional**: NDA → Infomemo → Data Room → Interest → LOI → Shortlist → Exclusivity → DD
- **Señales**: Intención real = matching + engagement + actividad DR + tiempo invertido
- **Decisión asistida**: Auto-shortlist suggestion engine guía al seller

---

## 2. What's Been Implemented

### v1.0-v1.3 — Foundation
Auth, Design, 60+ endpoints, Stripe, Teaser/Infomemo AI, NDA, Taxonomy, Interest/LOI, Comparator, Shortlist, Exclusivity

### v1.4 — Buyer Profile & Matching
Onboarding (Estratégico/Financiero subtypes), affinity badges, profile protection

### v1.5 — Data Room
Upload (Emergent Object Storage), 7 folders + subcategories, per-buyer folder access control, tracking

### v1.6 — Notifications
In-app notifications (high-signal), NotificationBell, email scaffolding (SendGrid ready)

### v1.7 — Intent Scoring
TIME_SPENT_ON_DEAL (visibility+activity detection), buyer_intent_score (0-100), Buyer Dashboard "Mis Procesos"

### v1.8 — Auto-Shortlist Suggestion Engine (Current)
- **Classification engine** (strict criteria):
  - `RECOMMENDED_SHORTLIST`: LOI + alta intención + ≥1 DR download
  - `CONSIDER`: Alta sin LOI, o LOI con actividad limitada
  - `LOW_PRIORITY`: Baja intención
- **Exclusivity suggestion** (very strict): LOI + alta + ≥2 downloads + ≥20min DR time
- **System recommendation banner**: "Te recomendamos shortlistar X buyers" + CTA
- **Exclusivity banner**: "Candidato para exclusividad" + CTA
- **Badges with reason tooltips**: Click shows factor breakdown + score
- **Quick filters**: Todos | Con LOI | Recomendados | Alta intención
- **Inline actions**: Shortlist | Descartar | Exclusividad | Quitar
- **Suggested actions per buyer**: "Enviar a shortlist" / "Esperar más actividad" / "Descartar"
- **Shortlist limit**: Max 3, counter shows x/3
- **Never auto-applies** — always suggests
- **Events**: SHORTLIST_SUGGESTED, EXCLUSIVITY_SUGGESTED
- **Recalculates on**: new LOI, new download, time thresholds, shortlist changes

---

## 3. Complete Decision Chain

```
Buyer Activity → Signals → Intent Score → Classification → Suggestion → Seller Decision
                                                                          ↓
                                                              Shortlist → Exclusivity → DD → Close
```

---

## 4. Prioritized Backlog

### Done (all 100% tested)
- [x] Full engagement system
- [x] Buyer profile + matching
- [x] Data Room
- [x] Notifications
- [x] Intent scoring + time tracking
- [x] Auto-shortlist suggestion engine
- [x] Buyer Dashboard "Mis Procesos"
- [x] Email scaffolding (ready for SendGrid)

### P1 — Next
- [ ] Activate SendGrid (waiting for: SENDGRID_API_KEY + SENDGRID_FROM_EMAIL)
- [ ] Request meeting flow
- [ ] Advisor dashboard

### P2
- [ ] Deal state transitions UI (Evaluation → DD → Close)
- [ ] Admin panel
- [ ] PDF export infomemo
- [ ] Document versioning in Data Room (v2)

---

## 5. Key API Endpoints

### Suggestions (v1.8)
- `GET /api/tracking/suggestions/{dealId}` — Full classification + recommendation + exclusivity suggestion

### Tracking (v1.7)
- `POST /api/tracking/time` — Record time (deal_page/infomemo/data_room)
- `GET /api/tracking/intent/{dealId}` — All buyers intent scores

---

*Documento mantenido por el equipo de desarrollo de Arroba*
