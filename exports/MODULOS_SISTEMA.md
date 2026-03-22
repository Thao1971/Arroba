# MODULOS_SISTEMA.md — Arroba Platform
## Arquitectura de sistemas de inteligencia

> Principio rector: separar VER (clarity) — DECIDIR (coaching) — ACTUAR (communication)

---

## 1. SELLER COACHING SYSTEM (DECIDIR)

### Proposito
Ayudar al seller/advisor a tomar mejores decisiones en momentos criticos del proceso. No muestra datos — interpreta datos y sugiere acciones.

### Componentes

#### 1.1 Warning de Exclusividad
- **Trigger**: Seller intenta otorgar exclusividad a un buyer
- **Condicion**: buyer.intent_score < 55 OR buyer.dr_downloads == 0 OR buyer.total_time < 600s (10 min)
- **Output**: Dialog de confirmacion con datos del buyer:
  ```
  "Este buyer tiene [score] de intencion, [N] descargas y [X] min de tiempo.
  Los criterios recomendados son: score >= 55, al menos 1 descarga DR, y 10+ min de tiempo.
  ¿Confirmas la exclusividad?"
  ```
- **Accion**: No bloquea, solo informa. Seller puede confirmar.

#### 1.2 Nudges Contextuales
Mensajes que aparecen en el dashboard del seller basados en reglas simples:

| ID | Trigger | Condicion | Mensaje | Prioridad |
|----|---------|-----------|---------|-----------|
| NC-01 | Deal publicado >7 dias | ndas_signed_count == 0 | "Tu deal lleva {N} dias sin NDAs. Considera revisar el teaser o ajustar el precio." | ALTA |
| NC-02 | Deal con engagements | interests >= 3 AND lois == 0 | "{N} intereses recibidos pero ninguna LOI. Posibles causas: precio alto, infomemo poco convincente, o falta de urgencia." | ALTA |
| NC-03 | Buyer con LOI | buyer.loi AND buyer.dr_downloads == 0 | "{buyer_name} envio LOI pero no ha descargado documentos del Data Room. Considera pedirle que revise la documentacion antes de avanzar." | MEDIA |
| NC-04 | Buyer fantasma | buyer.nda_signed AND buyer.last_active > 7 dias AND buyer.engagement_stage != REJECTED | "{buyer_name} firmo NDA hace {N} dias pero no ha tenido actividad reciente." | BAJA |

#### 1.3 Recomendaciones de Decision
Mensajes en momentos de decision activa (cuando el seller esta en el comparador):

| Momento | Condicion | Mensaje |
|---------|-----------|---------|
| Pre-shortlist | Hay buyers RECOMMENDED_SHORTLIST | "El sistema recomienda shortlistar a {names}. Tienen LOI + alta actividad." |
| Pre-exclusividad | Buyer shortlisted cumple criterios estrictos | "El candidato mas fuerte para exclusividad es {name}: LOI {amount}, {downloads} descargas, {time} min." |
| Post-exclusividad sin progreso | Exclusividad activa >14 dias sin nuevas descargas | "La exclusividad con {name} lleva {N} dias activa sin progreso en Data Room." |

### Mapeo a fricciones del Playbook
- #13 Warning exclusividad → 1.1
- #18 Coaching seller sin advisor → 1.2 + 1.3
- #11 Notificacion buyer rechazado → Se resuelve via notification_service (no es coaching, es notificacion)

### Datos que consume
- intent_service.compute_intent_score()
- suggestion_service.get_suggestions()
- events (timestamps para calcular dias sin actividad)
- engagements (conteos de LOI/interest)
- dataroom_access_log (descargas por buyer)
- time_tracking (tiempo por buyer)

### NO incluye
- Visualizacion de datos (eso es Buyer Signal Clarity)
- Comunicacion con buyer (eso es Communication Layer futuro)
- Comparador de LOIs (eso es Buyer Signal Clarity)

---

## 2. BUYER SIGNAL CLARITY (VER)

### Proposito
Hacer visible y legible la actividad de los buyers. No sugiere acciones — presenta datos de forma clara para que el seller/advisor pueda interpretar.

### Componentes

#### 2.1 LOI Comparator
- Tabla visual lado a lado de todas las LOIs de un deal
- Columnas: Buyer, Oferta, % vs Asking Price, Estructura, Condiciones
- Referencia visual: asking price como linea base
- Sin recomendacion (eso es coaching)

#### 2.2 Activity Dashboard por Buyer
- Por cada buyer en un deal: timeline de actividad
- Metricas: tiempo total, descargas, accesos, ultima actividad
- Indicador visual: barra de intensidad (alta/media/baja)
- `last_active_at`: "Ultima actividad hace X dias"

#### 2.3 Intent Readability
- Intent score (0-100) presentado con contexto:
  - Nivel (alta/media/baja) con color
  - Factores que contribuyen (desglose visual)
  - Comparativa entre buyers del mismo deal

### Mapeo a fricciones
- #9 Comparador visual LOIs → 2.1
- #8 Last active del buyer → 2.2
- Intent score ya existe pero necesita mejor presentacion → 2.3

### NO incluye
- Interpretacion de los datos (eso es Seller Coaching)
- Contacto con buyer (eso es Communication Layer)

---

## 3. DEAL HEALTH SYSTEM (MONITORIZAR)

### Proposito
Monitorizar el estado de salud de cada deal en tiempo real. Detecta problemas y genera alertas. No decide — senala.

### Componentes

#### 3.1 Alertas de Estado
| Alerta | Condicion | Destinatario | Frecuencia |
|--------|-----------|-------------|------------|
| Deal sin traccion | published >7d AND ndas == 0 | seller | Una vez, luego cada 7d |
| Deal estancado | published >14d AND lois == 0 AND interests > 0 | seller | Una vez |
| Exclusividad sin progreso | exclusivity activa >14d AND buyer sin nuevas descargas en 14d | seller | Una vez |
| Buyer inactivo | nda_signed AND 0 actividad en 7d | seller | Una vez por buyer |

#### 3.2 Intent Score con Decay
- Score actual usa actividad historica total (sin peso temporal)
- Mejora: factor de recencia
  - Actividad en ultimos 7 dias: peso 1.0x
  - Actividad de 7-14 dias: peso 0.75x
  - Actividad de 14-30 dias: peso 0.5x
  - Actividad >30 dias: peso 0.25x
- El score refleja "intencion actual", no "intencion historica"

#### 3.3 Deal Status Monitor
- Vista global de todos los deals del seller con indicadores de salud:
  - Verde: actividad reciente, progreso normal
  - Amarillo: estancado (>7d sin cambio de estado o actividad)
  - Rojo: sin traccion (>14d) o exclusividad sin progreso (>14d)

### Importante sobre exclusividad
- **NO auto-expira**. En M&A real, la exclusividad se renegocia.
- El sistema **alerta** si no hay progreso, pero no ejecuta cambios de estado.
- Ejemplo: "La exclusividad con buyer_pe_sevilla_02 en deal_excl_prematura_08 lleva 14 dias activa. El buyer tiene 0 descargas desde que se otorgo."

### Mapeo a fricciones
- #5 Alerta deal sin traccion → 3.1
- #10 Intent score con decay → 3.2
- #14 Exclusividad sin expiracion auto → 3.1 (alerta, no auto-expiracion)
- #8 Last active → 3.1 (buyer inactivo alert)

---

## 4. DEAL READINESS (PREPARAR)

### Proposito
Asegurar que un deal esta preparado antes de salir a mercado, y que el acceso a informacion se controla correctamente durante el proceso.

### Sub-modulos

#### 4.1 Pre-publicacion (Gating)
- **Checklist de publicacion**: items automaticos + editables por seller/advisor
  - Datos empresa completos (auto)
  - Financials subidos (auto)
  - Teaser generado (auto)
  - Infomemo generado (auto)
  - Data Room con minimo 1 doc en Financiero y Legal (auto)
  - Items custom del advisor (manual)
- **Bloqueo suave**: si checklist <80%, warning antes de publicar (no bloqueo duro)

#### 4.2 Post-publicacion (Control de acceso)
- **Fases de acceso al Data Room** (futuro, no Fase 1):
  - Nivel 1 (post-NDA): Financieros basicos, descripcion comercial
  - Nivel 2 (post-LOI): Contratos, cap table, detalles legales
  - Nivel 3 (exclusividad): Informacion sensible, due diligence completa
- Hoy: acceso todo-o-nada por carpeta/buyer
- Futuro: acceso por nivel vinculado al stage del engagement

### Mapeo a fricciones
- #4 DR readiness check → 4.1
- #3 Fases de acceso DR → 4.2 (futuro)
- #2 Checklist editable → 4.1
- #12 Shortlist configurable → No es readiness, se resuelve como config de deal
- #17 Gestion cierre → Post-MVP, no es readiness

---

## 5. COMMUNICATION LAYER (ACTUAR) — FUTURO

### Proposito
Permitir comunicacion estructurada entre las partes sin salir de Arroba.

### Componentes (NO implementar ahora)
- Chat seller-buyer por deal
- Q&A estructurado durante DD
- Outreach: compartir teaser con buyers seleccionados
- Notificacion a buyer rechazado (esto SI se puede hacer ahora via notification_service)

### Mapeo a fricciones
- #7 Contacto buyer → Chat/email
- #15 Q&A integrado → Q&A module
- #6 Campana proactiva → Outreach
- #16 Indicador DD completada → Se resuelve parcialmente con Deal Health 3.3

---

## PLAN DE IMPLEMENTACION

### FASE 1 — Seller Coaching v1 (AHORA)
Scope estricto:
1. Warning exclusividad (backend endpoint + frontend dialog)
2. 3 nudges criticos (NC-01, NC-02, NC-03)
3. 1 alerta deal sin traccion (backend + notificacion)

### FASE 2 — Deal Health + Readiness basico
1. Intent score con decay temporal
2. DR readiness check (pre-publicacion)
3. Alertas de estado (deal estancado, buyer inactivo)

### FASE 3 — Buyer Signal Clarity
1. LOI Comparator visual
2. Activity dashboard por buyer con last_active
3. Intent score con desglose visual

### FASE 4 — Communication Layer
1. Notificacion buyer rechazado
2. Outreach (compartir teaser)
3. Q&A (post-MVP)
