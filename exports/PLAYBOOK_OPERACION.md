# PLAYBOOK DE OPERACION REAL
## Como se usa Arroba en una operacion M&A de principio a fin

> Este documento NO es documentacion tecnica. Es una validacion del producto como herramienta de trabajo real. Describe como un profesional usaria Arroba hoy, que decisiones toma, que senales recibe, y donde el sistema falla o no ayuda.

> Basado en los datos del seed (`python seed_demo.py`). Cada ejemplo referencia deals y buyers reales.

---

# PARTE I — PERSPECTIVA ADVISOR

El advisor es el usuario mas exigente de Arroba. Gestiona mandatos de venta para multiples sellers. Necesita control total del proceso, visibilidad sobre los buyers, y herramientas para tomar decisiones informadas.

---

## FASE 1: CAPTACION DEL SELLER

### Que pasa en la realidad
El advisor identifica un seller potencial (dueno de agencia digital). Le presenta Arroba como herramienta para gestionar la venta. El seller necesita entender que va a pasar con su informacion, quien la ve, y que control tiene.

### Acciones en Arroba
1. El advisor registra al seller en la plataforma (o el seller se auto-registra)
2. El advisor crea la empresa del seller: datos legales, sector, ubicacion, descripcion
3. Si tiene CIF, puede usar el lookup de Iberinform para pre-rellenar datos financieros

### Ejemplo del seed
```
Seller: Diego Martin (seller_seo_madrid_01)
Empresa: Ranking Digital S.L. (comp_ranking_digital)
Ciudad: Madrid | Tipo: digital_agency | 45 empleados
Revenue: 3.2M | EBITDA: 640K
```

### Decisiones
- Que informacion incluir en la descripcion publica (teaser) vs privada (infomemo)
- Precio de venta: basado en valoracion EBITDA (multiple 4-7x) o expectativa del seller
- Tipo de operacion permitida: full_sale, partial_sale, merger

### Senales del sistema
- **Readiness score**: Arroba calcula un score de preparacion (datos basicos, financials, descripcion, valoracion, precio). Ej: 80% si falta algo.
- **Valoracion automatica**: EBITDA 640K x 4-7 = rango 2.56M - 4.48M. Si el asking price (3.5M) esta dentro del rango, no se activa el flag `price_vs_valuation_flag`.

### FRICCION 1 — No hay flujo de advisor-gestiona-seller
> **Severidad: ALTA**
> Hoy el advisor no puede gestionar los deals de un seller directamente. El modelo `AdvisorProfile` tiene `mandate_ids` pero no hay UI ni logica de "advisor opera en nombre de seller". El advisor tendria que usar las credenciales del seller o pedirle que haga cada accion.
> **Recomendacion**: Implementar "advisor como operador" — el advisor ve los deals del seller en su dashboard y puede ejecutar acciones (publicar, shortlist, exclusividad) sin que el seller tenga que estar presente.

### FRICCION 2 — No hay checklist de preparacion accionable
> **Severidad: MEDIA**
> El readiness_checklist existe pero es automatico y basico (5 items). Un advisor necesita una checklist personalizable: "Documentos legales subidos", "Contrato de mandato firmado", "Precio acordado con seller", "Data room completado". Hoy no puede anadir items ni marcar manualmente.
> **Recomendacion**: Checklist editable por el advisor con items custom + items automaticos del sistema.

---

## FASE 2: PREPARACION DEL ACTIVO

### Que pasa en la realidad
El advisor prepara toda la documentacion antes de salir a mercado. Esto incluye: teaser anonimizado, infomemo completo, y data room con documentos financieros, legales y comerciales. Es la fase mas larga (2-4 semanas tipicamente).

### Acciones en Arroba
1. **Generar Teaser (AI)**: Arroba genera un teaser anonimizado via GPT-5.2. El advisor revisa y edita.
2. **Generar Infomemo (AI)**: Documento detallado con toda la informacion de la empresa. El advisor revisa.
3. **Preparar Data Room**: Subir documentos a las carpetas predefinidas (Financiero, Legal, Fiscal, Comercial, Operaciones, Equipo).
4. **Crear el Deal**: Vincular empresa, definir precio, tipo de operacion.

### Ejemplo del seed
```
Deal: deal_hot_seo_01 (Agencia SEO Madrid)
Teaser: "Agencia SEO lider en Madrid — Alta rentabilidad"
Highlights: EBITDA 640K (20%), 45 empleados, Clientes Fortune 500
Infomemo: Generado (version 1)
Asking price: 3.5M EUR
```

### Decisiones
- Cuanto revelar en el teaser (debe atraer sin identificar la empresa)
- Que documentos subir al data room y en que fase (algunos se liberan post-NDA, otros post-LOI)
- Estructura de carpetas: usar la predefinida o necesita custom

### Senales del sistema
- **AI quality**: El teaser generado es un punto de partida, no el resultado final. El advisor siempre edita.
- **Data Room completeness**: Hoy no hay indicador visual de "data room listo" vs "data room incompleto".

### FRICCION 3 — No hay fases de acceso en el Data Room
> **Severidad: ALTA**
> En M&A real, hay documentos que se liberan en fases: Fase 1 (post-NDA) = financieros basicos. Fase 2 (post-LOI) = contratos, cap table. Fase 3 (exclusividad) = informacion sensible. Hoy el Data Room tiene permisos por carpeta/buyer pero NO por fase del deal. Un buyer con NDA ve todo lo que el seller haya subido.
> **Recomendacion**: Implementar `access_level` por documento/carpeta (nda, intent, dd) que se desbloquea automaticamente segun el stage del engagement del buyer.

### FRICCION 4 — Data Room sin indicador de completeness
> **Severidad: MEDIA**
> El advisor no sabe si el data room esta "listo para salir a mercado". No hay un checklist tipo "Financiero: 3/5 documentos minimos". El edge case `deal_dr_vacio_09` muestra este problema: el deal esta publicado, el buyer firma NDA, accede al Data Room... y no hay nada.
> **Recomendacion**: Data Room readiness checklist: documentos minimos por carpeta antes de publicar.

---

## FASE 3: SALIDA A MERCADO

### Que pasa en la realidad
El advisor publica el deal. El matching engine identifica buyers compatibles. Los buyers ven el teaser en el marketplace. Empieza el interes.

### Acciones en Arroba
1. **Preview antes de publicar**: `/api/deals/{id}/activation-preview` muestra cuantos buyers compatibles hay.
2. **Publicar**: Deal pasa de DRAFT a PUBLISHED. Visible en marketplace.
3. **Matching automatico**: El engine calcula afinidad buyer-deal (0-100) basada en taxonomia, tamano, geografia, tipo de operacion.

### Ejemplo del seed
```
deal_hot_seo_01: Publicado hace 28 dias → 312 teaser views, 156 views, 3 NDAs
deal_dead_tech_04: Publicado hace 15 dias → 18 teaser views, 5 views, 0 NDAs
```

### Decisiones
- Cuando publicar (data room listo? infomemo revisado?)
- Precio visible o no en teaser (hoy el precio solo se ve post-NDA)

### Senales del sistema
- **Compatible buyers count**: En el activation preview, Arroba muestra cuantos buyers de alta/media/baja afinidad existen.
- **Metricas post-publicacion**: views, teaser_views. Si pasan dias sin NDAs (como `deal_dead_tech_04`), algo falla.

### FRICCION 5 — No hay alerta de "deal sin traccion"
> **Severidad: MEDIA**
> `deal_dead_tech_04` lleva 15 dias publicado con 0 NDAs. El seller/advisor no recibe ninguna alerta. En una operacion real, despues de 7-10 dias sin traccion el advisor revisaria el teaser, el precio, o la segmentacion.
> **Recomendacion**: Alerta automatica: "Tu deal lleva X dias sin NDAs. Revisa el teaser o ajusta el precio."

### FRICCION 6 — No hay "campana de contacto" proactiva
> **Severidad: BAJA**
> Hoy Arroba espera que los buyers encuentren el deal en el marketplace. En M&A real, el advisor envia el teaser directamente a buyers seleccionados. No hay funcion de "enviar teaser a buyer_pe_madrid_01".
> **Recomendacion**: Feature "Compartir teaser" — el advisor selecciona buyers compatibles y les envia una notificacion/email con el teaser.

---

## FASE 4: GESTION DE INTERES

### Que pasa en la realidad
Los buyers empiezan a interactuar: firman NDA, leen el infomemo, acceden al Data Room. El advisor monitoriza quien esta activo y quien no. Es la fase donde se separa el interes real del turismo.

### Acciones en Arroba
1. **Recibir NDAs**: Buyer firma NDA digitalmente → acceso inmediato a infomemo + data room.
2. **Monitorizar actividad**: Time tracking muestra cuanto tiempo pasa cada buyer en cada seccion.
3. **Recibir Interests**: Buyers envian expresiones de interes con rango de valoracion y tipo de operacion.
4. **Data Room tracking**: Descargas, accesos, tiempo por carpeta.

### Ejemplo del seed — Contrastes
```
DEAL HOT (deal_hot_seo_01):
  buyer_pe_madrid_01: 180 min tiempo, 8 descargas DR → Interes serio
  buyer_vc_london_01: 5 min tiempo, 0 descargas DR → Turismo

DEAL CREATIVE (deal_interest_creative_02):
  5 NDAs, 5 Interests, 0 LOIs → Mucho interes, poca conversion
  Todos tienen ~9 min de tiempo, 0 descargas → Nadie profundiza

DEAL GHOST (deal_ghost_consult_03):
  buyer_holding_val_01: NDA + 2 min tiempo → Desaparecio
```

### Decisiones
- **Buyer fantasma**: Contactar directamente o esperar? `buyer_holding_val_01` en deal_ghost lleva 14 dias sin actividad.
- **Mucho interes sin conversion**: Revisar el precio? Mejorar el infomemo? `deal_interest_creative_02` tiene 5 interests pero 0 LOIs.
- **Controlar acceso al DR**: Restringir carpetas sensibles a buyers que demuestren interes real?

### Senales del sistema
- **Intent Score por buyer**: buyer_pe_madrid_01 en deal_hot = 95 (alta). buyer_vc_london_01 en deal_hot = 10 (baja).
- **Time tracking comparativo**: 180 min vs 5 min — la diferencia es evidente.
- **Notificaciones**: "X ha firmado NDA", "X descargo documentos del Data Room".

### FRICCION 7 — No hay forma de contactar al buyer desde Arroba
> **Severidad: ALTA**
> El advisor ve que `buyer_holding_val_01` desaparecio hace 14 dias pero no puede enviarle un mensaje tipo "Hemos visto tu interes, te podemos ayudar?". Tiene que salir de Arroba, buscar el email, y escribir manualmente.
> **Recomendacion**: Messaging integrado o al menos "boton de contacto" que abre el email pre-rellenado con contexto del deal.

### FRICCION 8 — No hay "last active" del buyer
> **Severidad: MEDIA**
> El advisor sabe cuanto tiempo total ha pasado un buyer, pero no sabe CUANDO fue la ultima vez. buyer_holding_val_01 podria haber estado activo hace 2 horas o hace 14 dias. El intent score no distingue entre actividad reciente y antigua.
> **Recomendacion**: Anadir `last_active_at` visible en el comparador + factor de "recencia" en el intent score.

---

## FASE 5: RECEPCION Y COMPARACION DE LOIs

### Que pasa en la realidad
Algunos buyers formalizan su interes con una LOI indicativa. El advisor compara las ofertas: valoracion, estructura (cash vs earn-out), porcentaje de adquisicion, condiciones. Es el momento clave de la operacion.

### Acciones en Arroba
1. **Buyer envia LOI**: Desde su engagement, upgradea de INTEREST a LOI con: valuation_offer, structure, acquisition_percentage, conditions.
2. **Advisor ve comparador**: GET /api/engagements/deal/{deal_id} devuelve todos los engagements lado a lado.
3. **Suggestion Engine**: El sistema clasifica automaticamente los buyers.

### Ejemplo del seed — deal_hot_seo_01
```
LOI 1: buyer_pe_madrid_01 → 3.4M EUR, cash, 100%, "Sujeto a DD. Permanencia fundador 12 meses."
  Intent score: 95 | 8 descargas DR | 180 min tiempo
  Clasificacion: EXCLUSIVITY (ya otorgada)

LOI 2: buyer_estrategico_bcn_01 → 3.1M EUR, mixed (earn-out 20% a 3 anos), 100%
  Intent score: 82 | 3 descargas DR | 30 min tiempo
  Clasificacion: ALREADY_SHORTLISTED
```

### Decisiones
- **Precio vs estructura**: 3.4M cash vs 3.1M mixed. El cash es mas seguro, pero el mixed podria ser mejor si el earn-out es realista.
- **Actividad como indicador de seriedad**: Carlos (PE) = 180 min + 8 descargas. Marta (Estrategico) = 30 min + 3 descargas. La diferencia sugiere que Carlos ha hecho mas due diligence.
- **LOI sin actividad (edge case)**: `deal_loi_sin_act_05` — Carlos envio LOI de 2.3M pero tiene 0 descargas y 2 min de tiempo. Es una LOI "ciega".

### Senales del sistema
- **Suggestion Engine para deal_loi_sin_act_05**:
  ```
  Carlos Ruiz: CONSIDER (score 40) — "LOI enviada pero actividad limitada"
  ```
  El sistema detecta la incongruencia: LOI sin DD.

- **Suggestion Engine para deal_hot_seo_01**:
  ```
  Carlos Ruiz: EXCLUSIVITY (score 95) — Buyer en exclusividad
  Marta Font: ALREADY_SHORTLISTED (score 82) — Ya en shortlist
  James Harris: LOW_PRIORITY (score 10) — Baja actividad
  ```

### FRICCION 9 — No hay comparador visual de LOIs
> **Severidad: ALTA**
> La API devuelve los datos, pero el frontend del comparador (LoiDetailedView.js) no muestra una tabla comparativa clara tipo: "Buyer A ofrece X en cash, Buyer B ofrece Y en earn-out, el asking price es Z". El advisor necesita ver las ofertas lado a lado con el asking price como referencia.
> **Recomendacion**: Tabla comparativa de LOIs con columnas: Buyer, Oferta, % vs Asking Price, Estructura, Intent Score, Actividad DR.

### FRICCION 10 — El intent score no penaliza la inactividad reciente
> **Severidad: MEDIA**
> Un buyer que fue muy activo hace 20 dias pero no ha vuelto mantiene el mismo score que uno activo ayer. En deal_loi_sin_act_05, Carlos tiene score 40 por la LOI, pero el sistema no marca que lleva dias sin actividad.
> **Recomendacion**: Factor de "decay" temporal: el score deberia decrecer si no hay actividad reciente (ej: -5 pts por semana sin actividad).

---

## FASE 6: SHORTLIST

### Que pasa en la realidad
El advisor selecciona los 2-3 buyers mas fuertes para la fase final. Los demas son informados (en M&A real) de que no han sido seleccionados. Los shortlisted entran en fase de DD profunda.

### Acciones en Arroba
1. **Ver sugerencias**: GET /api/tracking/suggestions/{deal_id} → clasificacion por buyer.
2. **Shortlist**: POST /api/engagements/deal/{deal_id}/shortlist/{buyer_id} (max 3).
3. **Reject**: POST /api/engagements/deal/{deal_id}/reject/{buyer_id} → stage=REJECTED.

### Ejemplo del seed — deal_shortlist_full_07
```
Shortlist (3/3):
  buyer_vc_london_01 (James Harris) — LOI 4.8M, SHORTLISTED, score 85
  buyer_pe_sevilla_02 (Antonio Moreno) — LOI 4.8M, SHORTLISTED, score 85
  buyer_estrategico_mad_02 (Pablo Garcia) — LOI 4.8M, SHORTLISTED, score 85

4o buyer fuera:
  buyer_vc_bcn_02 (Anna Soler) — Interest, VIEWED, score 24
  Intentar shortlistar → 400 "Shortlist llena (max 3)"
```

### Decisiones
- **Quien entra**: Los 3 con LOI + alta actividad. Anna (sin LOI) se queda fuera.
- **Cuando shortlistar**: Ahora que hay 3 LOIs solidas, o esperar a que Anna envie LOI?
- **Comunicacion a rechazados**: Arroba no notifica a los buyers rechazados. El advisor tiene que hacerlo fuera de la plataforma.

### Senales del sistema
- **Recommendation banner**: "Te recomendamos shortlistar X buyers" (cuando hay plazas disponibles y buyers RECOMMENDED_SHORTLIST).
- **Slots disponibles**: "0 plazas disponibles" (cuando esta llena).
- **Limite duro**: Maximo 3. No se puede saltar.

### FRICCION 11 — No hay notificacion al buyer rechazado
> **Severidad: MEDIA**
> Cuando el seller/advisor rechaza a un buyer (stage=REJECTED), el buyer no recibe ninguna notificacion. En su "Mis Procesos" simplemente desaparece o se queda congelado. El buyer no sabe que ha sido rechazado.
> **Recomendacion**: Notificacion: "El proceso de [deal] ha avanzado sin tu candidatura. Gracias por tu interes."

### FRICCION 12 — No hay flexibilidad en el tamano del shortlist
> **Severidad: BAJA**
> El limite de 3 es correcto para la mayoria de operaciones, pero en deals grandes (como `deal_shortlist_full_07` con asking price 5M) el advisor podria querer 4-5. Hoy es un hard limit.
> **Recomendacion**: Hacer el limite configurable por deal (default 3, max 5). O al menos permitir "shortlist extendido" con aprobacion explicita.

---

## FASE 7: EXCLUSIVIDAD

### Que pasa en la realidad
El advisor otorga exclusividad a 1 buyer (el mas fuerte). Durante el periodo de exclusividad (tipicamente 30-60 dias), solo ese buyer tiene acceso a DD profunda. Los demas buyers quedan "congelados".

### Acciones en Arroba
1. **Sugerencia de exclusividad**: El suggestion engine detecta si un buyer shortlisted cumple criterios estrictos (LOI + alta intencion + 2+ descargas + 20+ min DR).
2. **Otorgar exclusividad**: POST /api/engagements/deal/{deal_id}/exclusivity/{buyer_id}.
3. **Deal status → EXCLUSIVITY**: Nuevos engagements bloqueados.

### Ejemplo del seed — Bien vs Mal

**BIEN: deal_hot_seo_01**
```
Exclusividad a: buyer_pe_madrid_01 (Carlos Ruiz)
  LOI: 3.4M | Score: 95 | Descargas: 8 | Tiempo: 180 min
  → Exclusividad justificada. Buyer ha demostrado seriedad.
```

**MAL: deal_excl_prematura_08**
```
Exclusividad a: buyer_pe_sevilla_02 (Antonio Moreno)
  LOI: 650K | Score: ~40 | Descargas: 0 | Tiempo: 1 min
  → Exclusividad prematura. Buyer NO ha hecho DD.
  → Mientras, buyer_fo_malaga_02 (Carmen) tiene MAS actividad (6 min, no LOI).
```

### Decisiones
- **Exclusividad prematura**: El advisor deberia haber esperado a que Antonio hiciera DD. Pero Arroba no impide otorgar exclusividad a un buyer con baja actividad.
- **Duracion**: 30 dias? 60 dias? Hoy la expiracion existe en el modelo pero no se ejecuta automaticamente.

### Senales del sistema
- **Exclusivity candidate**: El suggestion engine sugiere exclusividad SOLO si el buyer cumple: shortlisted + LOI + alta + 2+ descargas + 20+ min DR. Para deal_excl_prematura_08, el sistema NO habria sugerido exclusividad (criterios no cumplidos).
- **El advisor ignoro la senal**: Arroba sugiere, pero no bloquea. El advisor otorgo exclusividad de todas formas.

### FRICCION 13 — No hay validacion antes de otorgar exclusividad
> **Severidad: ALTA**
> Cualquier seller/advisor puede otorgar exclusividad a cualquier buyer, incluso si tiene 0 descargas. No hay "warning" tipo: "Este buyer tiene baja actividad. Estas seguro de otorgar exclusividad?"
> **Recomendacion**: Warning dialog antes de exclusividad si el buyer no cumple criterios minimos (score < 55 o 0 descargas DR). No bloquear, pero alertar.

### FRICCION 14 — La exclusividad no expira automaticamente
> **Severidad: MEDIA**
> El campo `expires_at` existe en el modelo pero no hay ningun job que revise si la exclusividad ha expirado. Si pasan 60 dias, el deal sigue en "exclusivity" indefinidamente.
> **Recomendacion**: Cron job o check en endpoint: si expires_at < now, revertir status a "shortlist" o "published" y notificar.

---

## FASE 8: DUE DILIGENCE

### Que pasa en la realidad
El buyer con exclusividad hace DD profunda. Accede a documentos sensibles, hace preguntas, solicita informacion adicional. Es la fase mas intensa en terminos de Data Room.

### Acciones en Arroba
1. **Buyer accede al DR**: Descargas masivas de documentos.
2. **Seller sube documentos adicionales**: Responde a solicitudes del buyer.
3. **Tracking intensivo**: Todas las acciones quedan registradas.
4. **Advisor monitoriza**: Ve que documentos descarga el buyer, cuanto tiempo pasa en cada carpeta.

### Ejemplo del seed — deal_hot_seo_01
```
buyer_pe_madrid_01 en exclusividad:
  8 descargas (financiero, legal, comercial, operaciones)
  5 accesos al Data Room
  75 min en Data Room, 45 min en Infomemo
  Total: 180 min de tiempo invertido
```

### Senales del sistema
- **Access log detallado**: GET /api/dataroom/deals/{deal_id}/access-log muestra cada descarga con timestamp, buyer y documento.
- **Intent score post-exclusividad**: Ya no es tan relevante (la decision ya se tomo), pero confirma que el buyer esta activo.

### FRICCION 15 — No hay Q&A integrado
> **Severidad: ALTA**
> En DD real, el buyer hace preguntas: "Cual es el contrato mas grande?", "Cual es la rotacion del equipo?". Hoy no hay canal de comunicacion dentro de Arroba. Todo se hace por email/WhatsApp fuera de la plataforma.
> **Recomendacion**: Modulo de Q&A por deal: buyer pregunta, seller/advisor responde, todo queda registrado y trackeado.

### FRICCION 16 — No hay indicador de "DD completada"
> **Severidad: MEDIA**
> El advisor no sabe cuando el buyer ha "terminado" su DD. No hay checklist tipo "Ha descargado financieros, legales, ha revisado contratos clave". Solo ve metricas crudas (8 descargas, 180 min).
> **Recomendacion**: Checklist de DD automatica: "Ha descargado al menos 1 doc de cada carpeta critica".

---

## FASE 9: CIERRE

### Que pasa en la realidad
Si la DD es satisfactoria, se negocia el precio final, se firma el SPA (Share Purchase Agreement), y se cierra la transaccion.

### Acciones en Arroba
1. **Close deal**: POST /api/deals/{deal_id}/close con final_price y buyer_id.
2. **Deal status → CLOSED**.

### Ejemplo del seed
Ningun deal del seed esta en estado CLOSED. Esto es correcto — el seed representa operaciones en progreso.

### Senales del sistema
- **Final price vs asking price vs LOI**: Permite analizar desviaciones.
- **Status history**: Todo el timeline queda registrado.

### FRICCION 17 — No hay gestion de cierre (SPA, condiciones, evidencias)
> **Severidad: BAJA** (para MVP, aceptable)
> El cierre en Arroba es un simple cambio de estado. En realidad hay: firma de SPA, deposito de garantia, condiciones de cierre (earn-out milestones), evidencias documentales. Esto es complejidad post-MVP.
> **Recomendacion**: Para V2: modulo de cierre con checklist, documentos de evidencia, y tracking de condiciones.

---

# PARTE II — PERSPECTIVA SELLER DIRECTO

El seller que usa Arroba sin advisor sigue el mismo proceso pero con menos sofisticacion. Las diferencias clave:

---

## DIFERENCIAS CON EL ADVISOR

### 1. Preparacion
El seller hace todo el: crear empresa, subir financials, generar teaser, preparar data room. Sin un advisor, es probable que:
- El teaser sea menos profesional (depende mas del AI)
- El data room este incompleto (el seller no sabe que documentos son criticos)
- El precio no este bien calibrado

**Senal del seed**: `deal_dr_vacio_09` — seller publico sin preparar el Data Room. Un advisor nunca habria permitido esto.

### 2. Gestion de interes
El seller ve las notificaciones pero puede no entender las senales:
- "5 NDAs y 0 LOIs" — que significa? Un advisor sabe que es alarma. Un seller puede pensar que es bueno.
- Intent score = 40 para un buyer con LOI — un seller puede no saber que es bajo.

**Senal del seed**: `deal_interest_creative_02` — 5 intereses, 0 conversiones. Sin advisor, la seller (Nuria Costa) no tiene feedback de por que nadie da el paso.

### 3. Shortlist y exclusividad
El seller toma decisiones sin experiencia M&A:
- Shortlistear al primero que envie LOI (sin comparar)
- Otorgar exclusividad prematura (como `deal_excl_prematura_08`)
- No saber que el shortlist tiene limite de 3

**Senal del seed**: `deal_excl_prematura_08` — exclusividad otorgada a un buyer con 0 descargas. Un advisor habria esperado.

### 4. Comunicacion con buyers
El seller no tiene experiencia negociando. No sabe como responder a una LOI, como pedir mas actividad a un buyer fantasma, o como gestionar multiples ofertas.

---

## FLUJO SIMPLIFICADO DEL SELLER

```
1. Registrarse → Crear empresa → Subir datos
2. Crear deal → Generar teaser (AI) → Generar infomemo (AI) → Subir docs al DR
3. Publicar → Esperar
4. Ver notificaciones: "X firmo NDA", "X envio interes"
5. Ver comparador: engagements lado a lado
6. Ver sugerencias: "Recomendamos shortlistar a X"
7. Shortlist → Exclusividad → Cierre
```

### Donde el seller necesita MAS ayuda que el advisor

| Fase | Necesidad | Existe hoy? |
|------|-----------|-------------|
| Preparacion | "Tu data room esta incompleto, sube X" | No |
| Publicacion | "Tu deal lleva 10 dias sin traccion, revisa el precio" | No |
| Interes | "5 NDAs y 0 LOIs — posibles causas" | No |
| LOI | "Esta LOI esta por debajo del mercado" | No |
| Exclusividad | "Este buyer no ha hecho DD suficiente" | No (solo suggestion) |
| Cierre | "Checklist de documentos para cierre" | No |

### FRICCION 18 — No hay "coach" para el seller sin advisor
> **Severidad: ALTA** (para la audiencia seller-sin-advisor)
> Un seller sin experiencia M&A no interpreta correctamente las senales del sistema. Necesita mensajes contextuales tipo: "Tu deal tiene 5 intereses pero 0 LOIs. Esto puede significar que el precio esta alto o que el infomemo no convence. Considera: [accion 1] [accion 2]."
> **Recomendacion**: Sistema de "nudges" contextuales basados en el estado del deal y la actividad de los buyers. No generico — basado en los datos reales del deal.

---

# PARTE III — MAPA DE FRICCIONES

## Priorizacion por impacto

| # | Friccion | Severidad | Impacto en operacion | Esfuerzo estimado |
|---|---------|-----------|---------------------|-------------------|
| 1 | Advisor no puede operar en nombre de seller | ALTA | Bloquea uso real por advisors | Alto |
| 7 | No hay contacto buyer desde Arroba | ALTA | Obliga a salir de la plataforma | Medio |
| 3 | DR sin fases de acceso (NDA/LOI/DD) | ALTA | Informacion sensible expuesta | Alto |
| 9 | No hay comparador visual de LOIs | ALTA | Decisiones clave sin herramienta | Medio |
| 13 | Sin validacion antes de exclusividad | ALTA | Exclusividades prematuras | Bajo |
| 15 | No hay Q&A integrado | ALTA | DD se hace fuera de Arroba | Alto |
| 18 | No hay coaching para seller directo | ALTA | Seller toma malas decisiones | Medio |
| 2 | Checklist de preparacion no editable | MEDIA | Advisor pierde control | Bajo |
| 4 | DR sin indicador de completeness | MEDIA | Deals publicados sin docs | Bajo |
| 5 | No hay alerta de deal sin traccion | MEDIA | Deals muertos sin reaccion | Bajo |
| 8 | No hay "last active" del buyer | MEDIA | No se detecta buyer fantasma rapido | Bajo |
| 10 | Intent score sin decay temporal | MEDIA | Scores inflados por actividad vieja | Bajo |
| 11 | No hay notificacion al buyer rechazado | MEDIA | Buyer queda en limbo | Bajo |
| 14 | Exclusividad no expira auto | MEDIA | Deals congelados indefinidamente | Bajo |
| 16 | No hay indicador de DD completada | MEDIA | Advisor no sabe cuando cerrar | Medio |
| 6 | No hay campana proactiva de contacto | BAJA | Pierde oportunidades | Medio |
| 12 | Shortlist max 3 no configurable | BAJA | Limita deals grandes | Bajo |
| 17 | Cierre sin gestion de SPA/condiciones | BAJA | Post-MVP aceptable | Alto |

---

## Las 5 fricciones que resolveria PRIMERO

1. **#13 — Warning antes de exclusividad** (Bajo esfuerzo, alto impacto). Un simple dialog que diga "Este buyer tiene score X y Y descargas. Continuar?" previene exclusividades prematuras como `deal_excl_prematura_08`.

2. **#5 + #8 — Alerta de deal sin traccion + last active** (Bajo esfuerzo). Un cronjob que revise deals con >7 dias sin NDAs y buyers con >7 dias sin actividad, y envie notificacion al seller/advisor.

3. **#4 — DR readiness** (Bajo esfuerzo). Antes de publicar, verificar que el Data Room tiene al menos 1 documento en carpetas criticas (Financiero, Legal).

4. **#9 — Comparador visual de LOIs** (Medio esfuerzo). Tabla frontend que muestre todas las LOIs lado a lado con asking price como referencia. Esto ya esta en LoiDetailedView pero necesita refinamiento.

5. **#18 — Nudges contextuales para seller** (Medio esfuerzo). Mensajes basados en reglas simples: "5 NDAs + 0 LOIs = revisa precio", "Buyer con LOI pero 0 descargas = pide que entre al DR".

---

# PARTE IV — CONCLUSION

## Arroba como herramienta real: donde esta hoy

Arroba cubre correctamente:
- **Captacion y preparacion** (con AI para teaser/infomemo)
- **Publicacion y matching** (engine funciona bien)
- **Tracking de actividad** (time tracking + DR logs son excelentes)
- **Intent scoring** (0-100 bien calibrado, detecta edge cases)
- **Suggestion engine** (clasificaciones correctas, suggestions conservadoras)
- **Shortlist con limites** (max 3 funciona bien)

Arroba falla en:
- **Comunicacion** (ni buyer-seller ni advisor-buyer dentro de la plataforma)
- **Coaching** (el seller sin advisor esta solo ante las senales)
- **Fases de acceso** (DR todo-o-nada en vez de por fases)
- **Advisor como operador** (el flujo profesional no existe realmente)
- **Proactividad** (el sistema observa pero no alerta)

## Veredicto
Arroba es una herramienta valida para un **seller con experiencia M&A** o un **advisor que complemente con comunicacion externa**. Para un seller sin experiencia que depende solo de la plataforma, faltan las capas de coaching y comunicacion que conviertan datos en decisiones.

El camino de "herramienta" a "metodo" requiere cerrar las fricciones de comunicacion (#7, #15) y coaching (#18). El camino de "metodo" a "ventaja competitiva" requiere cerrar las de inteligencia (#10 decay, #5 alertas, #8 last active).
