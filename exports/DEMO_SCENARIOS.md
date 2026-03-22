# DEMO_SCENARIOS.md — Arroba Platform
## Escenarios de prueba mapeados al seed data

> Ejecutar primero: `cd /app/backend && python seed_demo.py`
> Password universal: `demo2026`

---

## 1. HOT DEAL — Agencia SEO Madrid

**Deal:** `deal_hot_seo_01`
**Seller:** `seller_seo_madrid_01` (diego.martin@rankingdigital.es)
**Estado:** EXCLUSIVITY

### Narrativo
Deal con máximo nivel de tracción. 3 buyers activos, 2 LOIs recibidos, 1 en exclusividad. El buyer PE de Madrid (Carlos Ruiz) es el más activo: 8 descargas en Data Room, 180 minutos de tiempo invertido, LOI de 3.4M EUR.

### Buyers involucrados
| Buyer | ID | Tipo | Engagement | Stage | Intent Score |
|-------|-----|------|------------|-------|-------------|
| Carlos Ruiz Martínez | `buyer_pe_madrid_01` | PE | LOI (3.4M) | EXCLUSIVITY | ~95 (alta) |
| Marta Font Puig | `buyer_estrategico_bcn_01` | Estratégico | LOI (3.1M) | SHORTLISTED | ~82 (alta) |
| James Harris | `buyer_vc_london_01` | VC | Interest | VIEWED | ~10 (baja) |

### Qué validar
- [ ] Login como seller → Dashboard muestra deal en exclusividad
- [ ] Suggestions engine: Carlos = EXCLUSIVITY, Marta = ALREADY_SHORTLISTED, James = LOW_PRIORITY
- [ ] Intent score de Carlos ≈ 95 (LOI + 8 descargas + 75min DR + 45min infomemo)
- [ ] Shortlist muestra 2/3 (Carlos + Marta)
- [ ] Login como buyer PE → "Mis Procesos" muestra deal_hot_seo_01 en EXCLUSIVITY

### API de verificación
```bash
# Intent score
GET /api/tracking/intent/deal_hot_seo_01/buyer_pe_madrid_01
# Suggestions
GET /api/tracking/suggestions/deal_hot_seo_01
# Engagements (seller view)
GET /api/engagements/deal/deal_hot_seo_01
```

---

## 2. MUCHO INTERÉS, POCA CONVERSIÓN — Creativa BCN

**Deal:** `deal_interest_creative_02`
**Seller:** `seller_creative_bcn_01` (nuria.costa@brillocreativo.cat)
**Estado:** PUBLISHED

### Narrativo
5 NDAs firmados, 5 intereses enviados, 0 LOIs. Es el clásico deal que genera curiosidad pero nadie da el paso. El seller debería ver esto como señal de alarma: o el precio está alto, o el infomemo no convence, o algo falla en la propuesta de valor.

### Buyers involucrados
| Buyer | ID | Stage | LOI |
|-------|-----|-------|-----|
| Marta Font Puig | `buyer_estrategico_bcn_01` | VIEWED | No |
| Iker Aguirre | `buyer_fo_bilbao_01` | VIEWED | No |
| Lucía Navarro | `buyer_holding_val_01` | VIEWED | No |
| Pablo García | `buyer_estrategico_mad_02` | SUBMITTED | No |
| Anna Soler | `buyer_vc_bcn_02` | SUBMITTED | No |

### Qué validar
- [ ] 5 engagements visibles en comparador del seller
- [ ] 0 LOIs → el sistema NO sugiere shortlist (nadie cumple criterios)
- [ ] 2 intereses SUBMITTED sin ver → notificaciones pendientes
- [ ] Marketplace muestra este deal al público
- [ ] Suggestion engine: Todos LOW_PRIORITY (sin LOI + poca actividad DR)

---

## 3. BUYER FANTASMA — Consultora Valencia

**Deal:** `deal_ghost_consult_03`
**Seller:** `seller_consult_val_01` (rafael.torres@consultdigital.es)
**Estado:** PUBLISHED

### Narrativo
Un solo buyer firmó NDA, vio el infomemo 1 minuto, y desapareció. 14 días sin actividad. Es el patrón "buyer fantasma" — persona que muestra interés inicial pero no ejecuta.

### Buyer
| Buyer | ID | Tiempo total | DR Downloads |
|-------|-----|-------------|-------------|
| Lucía Navarro | `buyer_holding_val_01` | 2 min | 0 |

### Qué validar
- [ ] Intent score de Lucía en este deal ≈ 0-5 (baja)
- [ ] Suggestion: LOW_PRIORITY
- [ ] Time tracking muestra 90s deal_page + 60s infomemo, luego nada
- [ ] Este patrón contrasta con la misma Lucía en deal 2 (más tiempo)

---

## 4. DEAL MUERTO — Tech Studio Sevilla

**Deal:** `deal_dead_tech_04`
**Seller:** `seller_tech_sev_01` (elena.romero@techstudio.es)
**Estado:** PUBLISHED

### Narrativo
Publicado hace 15 días. 0 NDAs, 0 intereses, 0 actividad. El deal simplemente no genera tracción.

### Qué validar
- [ ] Dashboard del seller muestra 0 engagements
- [ ] Marketplace lo muestra (está publicado)
- [ ] Metrics: 5 views, 18 teaser views → la gente ve pero no actúa
- [ ] Suggestions engine devuelve lista vacía
- [ ] Comparar con deal_hot_seo_01 para ver contraste de métricas

---

## 5. EDGE CASE: LOI SIN ACTIVIDAD — Media Bilbao

**Deal:** `deal_loi_sin_act_05`
**Seller:** `seller_media_bil_01` (aitor.etxebarria@mediapais.es)
**Estado:** PUBLISHED

### Narrativo
Carlos Ruiz (PE Madrid) envió una LOI de 2.3M pero tiene 0 descargas en Data Room y solo 2 minutos de tiempo total. La LOI existe, pero la actividad sugiere que no ha hecho due diligence real. **Caso incómodo para el suggestion engine.**

### Buyer
| Buyer | LOI | DR Downloads | Tiempo | Intent Score |
|-------|-----|-------------|--------|-------------|
| Carlos Ruiz | 2.3M | 0 | 2 min | ~40 (media) |

### Qué validar
- [ ] Clasificación: **CONSIDER** (LOI enviada pero actividad limitada)
- [ ] Intent score ≈ 40 (solo LOI +40, sin bonificación de DR ni tiempo)
- [ ] El sistema NO lo recomienda para shortlist (falta actividad)
- [ ] Contraste: el mismo Carlos en deal_hot_seo_01 tiene score 95

### Lección de negocio
Una LOI sin due diligence debería levantar banderas. El seller debería presionar al buyer para que entre al Data Room.

---

## 6. EDGE CASE: ALTA ACTIVIDAD SIN LOI — Performance Málaga

**Deal:** `deal_alta_act_06`
**Seller:** `seller_perf_mal_01` (rosa.jimenez@clicksur.es)
**Estado:** PUBLISHED

### Narrativo
Iker Aguirre (FO Bilbao) tiene 12 descargas en Data Room y 320 minutos de tiempo. Es el buyer más activo de toda la plataforma en términos de due diligence... pero NO ha enviado LOI. **¿Está haciendo DD para un tercero? ¿Está esperando el momento? ¿Es indeciso?**

### Buyers
| Buyer | LOI | DR Downloads | Tiempo | Intent Score |
|-------|-----|-------------|--------|-------------|
| Iker Aguirre | No | 12 | 320 min | ~55 (alta) |
| Jorge Lázaro | No | 1 | 2 min | ~4 (baja) |

### Qué validar
- [ ] Iker clasificado como **CONSIDER** (alta intención, pendiente de LOI)
- [ ] Jorge clasificado como **LOW_PRIORITY**
- [ ] El sistema sugiere "Esperar más actividad" para Iker
- [ ] Intent score Iker ≈ 55 (DR downloads +20, DR accessed +10, DR time +15, infomemo time +10)

### Lección de negocio
Altísima actividad sin LOI = o el buyer es cauteloso (buena señal) o nunca va a dar el paso (mala señal). El seller debería contactar directamente.

---

## 7. EDGE CASE: SHORTLIST LLENA — Strat Consulting Madrid

**Deal:** `deal_shortlist_full_07`
**Seller:** `seller_strat_mad_01` (fernando.ruiz@stratconsulting.es)
**Estado:** PUBLISHED

### Narrativo
3 buyers en shortlist (máximo). Un 4to buyer (Anna Soler, VC BCN) ha mostrado interés y tiene buena actividad, pero no puede entrar al shortlist. El seller debe decidir si elimina a alguien para hacer sitio.

### Shortlist (3/3)
| Buyer | ID | LOI | Stage |
|-------|-----|-----|-------|
| James Harris | `buyer_vc_london_01` | 4.8M | SHORTLISTED |
| Antonio Moreno | `buyer_pe_sevilla_02` | 4.8M | SHORTLISTED |
| Pablo García | `buyer_estrategico_mad_02` | 4.8M | SHORTLISTED |

### 4to buyer (fuera)
| Buyer | ID | LOI | Stage |
|-------|-----|-----|-------|
| Anna Soler | `buyer_vc_bcn_02` | No | VIEWED |

### Qué validar
- [ ] Shortlist muestra 3/3, 0 slots disponibles
- [ ] Intentar añadir 4to buyer → HTTP 400 "Shortlist llena (máx 3)"
- [ ] Suggestion engine: 3 ALREADY_SHORTLISTED, Anna = LOW_PRIORITY
- [ ] Si se elimina un shortlisted, la plaza se libera

### API de verificación
```bash
# Intentar añadir 4to
POST /api/engagements/deal/deal_shortlist_full_07/shortlist/buyer_vc_bcn_02
→ Esperado: 400 "Shortlist llena"
```

---

## 8. EDGE CASE: EXCLUSIVIDAD PREMATURA — Contenidos Zaragoza

**Deal:** `deal_excl_prematura_08`
**Seller:** `seller_content_zar_01` (silvia.marco@contenidoszgz.es)
**Estado:** EXCLUSIVITY

### Narrativo
Antonio Moreno (PE Sevilla) recibió exclusividad con solo 0 descargas de Data Room y 1 minuto de tiempo total. Es una exclusividad otorgada prematuramente — sin evidencia de due diligence real. **Esto debería generar una alerta del sistema.**

### Buyers
| Buyer | LOI | DR Downloads | Tiempo | Stage |
|-------|-----|-------------|--------|-------|
| Antonio Moreno | 650K | 0 | 1 min | EXCLUSIVITY |
| Carmen Delgado | No | 0 | 6 min | VIEWED |

### Qué validar
- [ ] Antonio en EXCLUSIVITY pero con intent score bajo (~40)
- [ ] Carmen tiene MÁS actividad que Antonio (6 min vs 1 min)
- [ ] El sistema muestra exclusividad activa
- [ ] Suggestion engine: Antonio = EXCLUSIVITY, Carmen = LOW_PRIORITY

### Lección de negocio
Otorgar exclusividad sin evidencia de DD es arriesgado. El Internal Deal Score futuro debería penalizar esto.

---

## 9. EDGE CASE: DATA ROOM VACÍO — Digital Asturias

**Deal:** `deal_dr_vacio_09`
**Seller:** `seller_digital_ast_01` (marcos.fernandez@asturdigital.es)
**Estado:** PUBLISHED

### Narrativo
Carmen Delgado (FO Málaga) firmó NDA y quiere ver el Data Room... pero está vacío. 0 documentos subidos. El seller no ha preparado la documentación.

### Qué validar
- [ ] NDA firmado, engagement activo
- [ ] Data Room devuelve 0 documentos
- [ ] Buyer puede acceder pero no hay nada que descargar
- [ ] Readiness score del deal debería ser bajo (sin documentación)

---

## 10. BORRADOR — Mobile Canarias

**Deal:** `deal_borrador_10`
**Seller:** `seller_mobile_can_01` (alba.hernandez@islasapp.es)
**Estado:** DRAFT

### Narrativo
Deal en borrador. No visible en marketplace. Solo el seller lo ve en su dashboard.

### Qué validar
- [ ] NO aparece en marketplace (filtro status=published excluye draft)
- [ ] Seller ve el deal en su dashboard
- [ ] 0 métricas, 0 actividad
- [ ] Puede editarse y publicarse

---

## MATRIZ DE COMPARACIÓN CROSS-DEAL

| Deal | NDAs | Interests | LOIs | DR Downloads | Shortlist | Exclusividad | Estado |
|------|------|-----------|------|-------------|-----------|-------------|--------|
| Hot SEO | 3 | 1 | 2 | 11 | 2/3 | Si (PE) | EXCLUSIVITY |
| Creativa BCN | 5 | 5 | 0 | 0 | - | No | PUBLISHED |
| Fantasma | 1 | 1 | 0 | 0 | - | No | PUBLISHED |
| Muerto | 0 | 0 | 0 | 0 | - | No | PUBLISHED |
| LOI sin act | 1 | 0 | 1 | 0 | - | No | PUBLISHED |
| Alta act | 2 | 2 | 0 | 13 | - | No | PUBLISHED |
| Short llena | 4 | 1 | 3 | 11 | 3/3 | No | PUBLISHED |
| Excl prematura | 2 | 1 | 1 | 0 | - | Si (PE Sev) | EXCLUSIVITY |
| DR vacío | 1 | 1 | 0 | 0 | - | No | PUBLISHED |
| Borrador | 0 | 0 | 0 | 0 | - | No | DRAFT |

---

## BUYER CROSS-REFERENCE

| Buyer | Deals activos | Edge case |
|-------|--------------|-----------|
| buyer_pe_madrid_01 | Hot (EXCL), LOI sin act (CONSIDER) | Score 95 vs Score 40 — mismo buyer, comportamientos opuestos |
| buyer_estrategico_bcn_01 | Hot (SHORT), Creative (VIEWED) | Alta actividad en un deal, exploratoria en otro |
| buyer_fo_bilbao_01 | Creative (VIEWED), Alta act (CONSIDER) | 320min sin LOI — buyer cauteloso o indeciso |
| buyer_holding_val_01 | Creative (VIEWED), Fantasma (VIEWED) | Patrón fantasma: desaparece tras primer contacto |
| buyer_pe_sevilla_02 | Short (SHORT), Excl prem (EXCL) | En shortlist de un deal top + exclusividad prematura en otro |
| buyer_fo_malaga_02 | Excl prem (VIEWED), DR vacío (VIEWED) | Siempre encuentra obstáculos: DR vacío, excl prematura |
