# PARA BETA · B-2 · FASE 0 · Auditoría de endpoints Intel

> Auditoría en modo lectura contra `intel.arroba.com` vía provider `intelligence_layer` (X-API-Key S2S).
> **NO se ha tocado código de la app**. Script one-shot en `/app/backend/scripts/b2_intel_audit.py` + `b2_intel_deep.py` (ephemeral, borrables).

---

## 1. Metadata

| Campo | Valor |
|---|---|
| Fecha ejecución | 2026-08-10 · sesión BETA B-2 Fase 0 |
| Base URL Intel real | `https://intel.arroba.com` (via `AGENCY_TOOL_BASE_URL`) |
| Auth mode | `X-API-Key` (primary + secondary fallback, semáforo global cap=3) |
| API Key primary | `***` (redactada) |
| Provider versión | `intelligence_layer` v2 con `agency_tool/client.py` (`R12 guard` activo) |
| Semáforo | `AGENCY_TOOL_GLOBAL_MAX_CONCURRENT=3` |
| `AGENCY_TOOL_MODE` | `real` (contra Intel prod, no mock) |
| Total probes ejecutados | 141 (135 iniciales + 6 deep dive) |
| Ficha `ficha-empresa-f01.html` versión | `arroba-company-ficha-v1` (agregador Intel) |

### 1.1 CIFs de muestra usados

Solo un CIF resulta cacheado/enriquecido en Intel en este entorno. Los otros 4 responden `404 not_found` en `analyze` (no están en el master index). **Elegimos ampliar la matriz solo con Servier** dado que era el único disponible; para la validación cruzada del schema esperaríamos ampliar muestra en un segundo turno con CIFs adicionales que sí estén enriquecidos.

| CIF | Descripción | Estado en Intel |
|---|---|---|
| **B28184687** | LABORATORIOS SERVIER · pharma · mid-large · MADRID · CNAE 2120 | ✅ Cacheado, todos endpoints responden |
| A08363419 | GRUPO PLANETA-DE AGOSTINI · media · large · BARCELONA | ❌ 404 en `analyze` (no en master) |
| A28017895 | IBERDROLA · utilities · IBEX · VIZCAYA | ❌ 404 en `analyze` |
| B65076193 | TECHNIP IBERIA · engineering · SME · BARCELONA | ❌ 404 en `analyze` |
| B95758389 | SME aleatorio microempresa | ❌ 404 en `analyze` |

> ⚠️ **Bandera roja de muestra**: la matriz refleja disponibilidad para 1 CIF. Estabilidad de schema entre CIFs se marca como `?` cuando no ha sido posible verificar. Recomendable pedir a Intel una lista de CIFs enriquecidos para pruebas antes de arrancar B-2.

---

## 2. Matriz maestra

| Endpoint | Vivo | Status típico | Schema estable | Null-heavy | Recomendación | Notas |
|---|---|---|---|---|---|---|
| **Grupo A · Ownership + Governance + Events + Control-synergy** | | | | | | |
| `POST /api/v1/financial-intelligence/analyze` (ranking embebido) | ✅ | 200 (1 CIF), 404 (4 CIF) | Sí (1 CIF verificado) | 0 % en Servier | **CABLEAR YA** para ranking | Ya consumido para I-1; `analyze.ranking` cumple shape prometido. |
| `GET /api/v1/company/{cif}/ownership` | ✅ | 200 · 469 B | ? (1 CIF) | 0 % Servier | **CABLEAR YA** con toggle público | Shareholders (2, con `name/cif/pct/as_of_year`) + control (`controlling_shareholder`, `top1_pct`, `top1_name`, `tier`). Puede llevar personas físicas si `top1_name` es un particular. Anonimizar en UI si necesario. |
| `GET /api/v1/company/{cif}/governance` | ✅ | 200 · 5.2 KB · 55 officers | ? (1 CIF) | Baja (`available: true`) | **CABLEAR YA con salvedad DPD** | Contiene nombres de personas físicas (Administradores, Apoderados, Auditores). Bloque público según decisión de producto, pero mostrar SOLO `role + year` en UI mixed-access; el `name` gated hasta autenticado. Ver §5 bandera roja. |
| `GET /api/v1/company/{cif}/events` | ✅ | 200 · 105 B · `available: false` | ? | 100 % (Servier vacío) | **DEGRADAR A `<Empty/>`** hasta que Intel populate | Endpoint responde pero para Servier `available: false`. No hay `events[]` en el payload. Sí cablear pero mostrar `<Empty/>`. |
| `GET /api/v1/company/{cif}/control-synergy/{buyer_id}` | ⚠️ | No probado (buyer_id resulta null para Servier) | ? | ? | **BLOQUEAR HASTA muestra válida** | `recommendation-intelligence/buyers` devuelve `count: 0` para Servier → no hay buyer top. No he podido validar shape del endpoint. Necesita CIF con buyers > 0 en muestra. |
| `POST /api/v1/control-synergy-intelligence/analyze` | ❌ | 404 | — | — | NO EXISTE | Patrón alternativo también 404. |
| **Grupo B · sector / geo / economic intelligence** | | | | | | |
| `GET /api/v1/company/{cif}/sector-intelligence` | ❌ | 404 | — | — | NO EXISTE | Probado con Servier (CIF válido). |
| `POST /api/v1/sector-intelligence/analyze` | ❌ | 404 | — | — | NO EXISTE | |
| `GET /api/v1/company/{cif}/geo-intelligence` | ❌ | 404 | — | — | NO EXISTE | |
| `POST /api/v1/geo-intelligence/analyze` | ❌ | 404 | — | — | NO EXISTE | |
| `GET /api/v1/company/{cif}/economic-intelligence` | ❌ | 404 | — | — | NO EXISTE | |
| `POST /api/v1/economic-intelligence/analyze` | ❌ | 404 | — | — | NO EXISTE | |
| **Grupo C · Confirmar existencia (watchlist / alerts / company-state)** | | | | | | |
| `GET /api/v1/watchlist` | ⚠️ | **401** `Missing authorization header` | — | — | EXISTE pero **auth JWT usuario**, no X-API-Key S2S | Intel ha implementado el endpoint pero **no es S2S**. Requiere token JWT de usuario final. Esto obliga a resolver arquitectura Auth antes de cablear. |
| `GET /api/v2/watchlist` | ❌ | 404 | — | — | v2 no existe | |
| `GET /api/v1/alerts` | ❌ | 404 | — | — | NO EXISTE | |
| `GET /api/v2/alerts` | ❌ | 404 | — | — | NO EXISTE | |
| `GET /api/v1/company/{cif}/state` | ❌ | 404 | — | — | NO EXISTE | |
| `GET /api/v2/company-intelligence/state` | ❌ | 404 | — | — | NO EXISTE | |
| **Grupo D · Agregador `/ficha`** | | | | | | |
| **`GET /api/v1/company/{cif}/ficha`** | ✅ | **200 · 22.4 KB** | ? (1 CIF) | Bajo (estructura rica) | **RECOMENDADO usar como principal** | Combina `identity + finances + ranking + ownership + governance + events` en una sola llamada. `engine_version: 'arroba-company-ficha-v1'`. Sección `identity` tiene 34 campos (vs 6 en `analyze.identity`). Justificación detallada en §4. |
| `GET /api/v2/company-intelligence/ficha` | ❌ | 404 | — | — | v2 no existe | |
| `GET /api/v1/company/{cif}/dossier` | ❌ | 404 | — | — | NO EXISTE | Dossier antes propuesto en canon no existe en Intel; el agregador se llama `ficha`. |

---

## 3. Sección por endpoint

### 3.1 `analyze.ranking` (via `POST /api/v1/financial-intelligence/analyze`)

**Shape real observado (Servier)**:
```json
{
  "sector_revenue_percentile": 100,
  "market_position": { "rank": 2, "total": 9, "scope": "sector CNAE + banda de tamaño (0,3x–3x ingresos)" },
  "locality_position": { "rank": 1, "total": 34, "scope": "municipio" },
  "explain": [
    "En el percentil 100 por ingresos de su sector",
    "2ª de 9 en su universo de comparables (sector y tamaño)",
    "1ª de 34 en Madrid por ingresos de su sector"
  ]
}
```

**Diff vs `PARA_BETA_B2.md`**: no localizado el documento fuente en el repo (`find /app -name "PARA_BETA_B2*"` devuelve vacío). El shape observado coincide 1:1 con el descrito en el brief del usuario (`sector_revenue_percentile`, `market_position:{rank,total,scope}`, `locality_position:{rank,total,scope}`, `explain:[]`). Estable.

**Decisión**: **CABLEAR YA en la 3.ª fila `.kgrid` del Resumen** — sustituye los 4 rankings pending que hoy pintan "—" (Ranking mercado, Ranking sector, Localidad, Innovación). El `innovation_score` **NO existe** en el payload → mantener `<Empty/>` para esa 4.ª celda.

---

### 3.2 `GET /api/v1/company/{cif}/ownership`

**Shape real (Servier, anonimizado)**:
```json
{
  "identifier": "B28184687",
  "cif": "B28184687",
  "available": true,
  "shareholders": [
    { "name": "SERVIER INTERNATIONAL, BV", "cif": null, "pct": 73.35, "as_of_year": 2024 },
    { "name": "<REDACTED-SHAREHOLDER-2>", "cif": null, "pct": 26.65, "as_of_year": 2024 }
  ],
  "control": {
    "controlling_shareholder": "SERVIER INTERNATIONAL, BV",
    "top1_pct": 73.35,
    "top1_name": "<REDACTED>",
    "tier": "Control mayoritario"
  },
  "coverage": { "shareholders_count": 2 },
  "engine_version": "arroba-company-ficha-v1"
}
```

**Diff vs asumido**: el brief asume shape `{shareholders, control, coverage}`. **Coincide 1:1**. Bonus: `engine_version` incluido.

**Decisión**: **CABLEAR YA en mixed-access público** (BORME es público). El `top1_name` puede ser una persona física — si `controlling_shareholder` termina en `S.A.`/`S.L.`/`BV`/etc. mostrar libre; si es un particular (regex sobre el patrón nombre+apellidos sin sufijo empresarial), gated hasta autenticado.

---

### 3.3 `GET /api/v1/company/{cif}/governance`

**Shape real (Servier, anonimizado)**:
```json
{
  "identifier": "B28184687",
  "cif": "B28184687",
  "available": true,
  "officers": [
    { "name": "<REDACTED-PERSON-1>", "role": "Administrador Solidario", "since": "<DATE>", "year": 2024 },
    { "name": "<REDACTED-PERSON-2>", "role": "Apoderado", "since": "<DATE>", "year": 2024 },
    { "name": "<REDACTED-PERSON-3>", "role": "Auditor", "since": "<DATE>", "year": 2024 }
  ],
  "coverage": { "officers_count": 55 },
  "engine_version": "arroba-company-ficha-v1"
}
```

**Diff vs asumido**: coincide con lo prometido. **Volumen alto (55 officers) para Servier** — puede requerir paginado/summary en UI.

**Roles únicos observados**: `Administrador Solidario`, `Apoderado`, `Auditor`, `Auditor Cuentas Conjunto`, `Joint Accounts Auditor`, `Joint And Several Director`, `Representative`.

**⚠️ Bandera de datos personales**: los 55 registros son personas físicas nominadas. Aunque BORME es público, mostrar 55 nombres de personas físicas en la vista **anónima** de la ficha puede generar fricción DPD/GDPR y percepción de exceso.

**Decisión matizada**: **CABLEAR YA con degradación DPD**:
- **Vista anónima (mixed-access)**: mostrar SOLO `role` + `year` agregados (contadores por rol). NO exponer nombres.
- **Vista autenticada**: mostrar la lista completa con `name/role/since/year`.

---

### 3.4 `GET /api/v1/company/{cif}/events`

**Shape real (Servier)**:
```json
{
  "identifier": "B28184687",
  "cif": "B28184687",
  "available": false,
  "engine_version": "arroba-company-ficha-v1"
}
```

**Diff vs asumido**: endpoint responde 200 pero sin `events[]`. `available: false` es el flag canónico Intel para "no hay data".

**Decisión**: **cablear pero degradar a `<Empty/>`**. Cuando Intel populate, el shape aparecerá con `events: [...]` (previsible: BORME entries, ampliaciones de capital, cambios de sede, etc.).

---

### 3.5 `GET /api/v1/company/{cif}/control-synergy/{buyer_id}`

**No probado**: `recommendation-intelligence/buyers` para Servier devuelve `count: 0`, sin buyer top. Necesitaría CIF con recomendaciones activas.

**Decisión**: **BLOQUEAR HASTA MUESTRA VÁLIDA**. Pedir a Intel/PM 2-3 CIFs con `buyers.count > 0` para reintentar la auditoría. Alternativa: mockear buyer_id con un `master_id` conocido y ver el 404/200.

---

### 3.6 Grupo B · sector / geo / economic intelligence

**Todos 404** en todos los patrones probados (v1 GET, v1 POST analyze, v2). **No existen en Intel** en el momento de esta auditoría.

**Decisión**: **BLOQUEAR B-2.5, B-2.6, B-2.7** (o sus equivalentes de sector/geo/economic) **hasta que Intel confirme ruta canónica o exponga endpoints**.

---

### 3.7 Watchlist (`GET /api/v1/watchlist`)

**Response**:
```
HTTP 401
{"detail": "Missing authorization header"}
```

**Interpretación**: el endpoint existe pero **NO es S2S**. Requiere JWT de usuario final, no X-API-Key. Esto significa que el flujo de watchlist es:
- **Frontend usuario** → JWT → `intel.arroba.com/api/v1/watchlist` **directamente** (bypass Arroba backend).
- O bien: Arroba backend hace pasarela con impersonation del usuario (necesita mecanismo de token exchange que **no está implementado** en el provider hoy).

**Decisión**: **NO CABLEAR AÚN.** Requiere decisión arquitectónica previa (bypass vs pasarela) y confirmación de PM sobre auth flow.

---

### 3.8 Agregador `GET /api/v1/company/{cif}/ficha`

**Shape completo (Servier)**:
```json
{
  "identifier": "B28184687",
  "cif": "B28184687",
  "master_id": "mc_36c100bcee4a",
  "identity": {
    "master_id": "...", "cif": "...", "legal_name": "LABORATORIOS SERVIER",
    "commercial_name": null, "aliases": [], "legal_form": null,
    "mercantile_status": null, "activity_status": null, "incorporation_date": null,
    "address": null, "postal_code": null, "locality": null,
    "province": null, "autonomous_community": null, "country": null,
    "website": null, "domain": null, "capital_social": null, "employees_total": null,
    "cnae_primary": null, "cnae_secondary": null, "activity": null, "corporate_purpose": null,
    "description": null, "sectors": [], "is_listed": null, "listed_market": null,
    "record_status": null, "updated_at": null, "sources": [],
    "provenance_fields": {}, "data_coverage": {}, "capability_version": "..."
  },
  "finances": { /* estructura idéntica a analyze_full */ },
  "ranking":  { /* estructura idéntica a analyze.ranking */ },
  "ownership": { /* estructura idéntica a /ownership */ },
  "governance": { /* estructura idéntica a /governance */ },
  "events":     { /* estructura idéntica a /events */ },
  "engine_version": "arroba-company-ficha-v1"
}
```

**Observaciones**:
- `identity` en `ficha` es MÁS RICA (34 campos vs 6 en `analyze.identity`) — incluye `activity_status`, `legal_form`, `mercantile_status`, `incorporation_date`, `address`, `postal_code`, `capital_social`, `employees_total`, `is_listed`, `listed_market`. Todos null hoy pero estructura preparada.
- `finances` interna es idéntica a `analyze_full` (18 ratios, kpis, ratios, evolution, valuation, comparables, assessment, financial_quality, statements con `cash_flow`).
- `ranking/ownership/governance/events` iguales a los endpoints separados.
- **1 llamada = 4-5 llamadas actuales**.

**Ver decisión en §4.**

---

## 4. Decisión sobre agregador `/company/{cif}/ficha`

### Recomendación: **USAR AGREGADOR COMO PRINCIPAL, mixed-access permitido.**

### Justificación

| Métrica | Suma llamadas individuales | Agregador `/ficha` |
|---|---|---|
| Latencia (network, sin retry) | 4 × ~450 ms = ~1800 ms (secuencial) o ~500 ms (paralelo con semáforo cap=3) | ~500 ms (una llamada) |
| Bytes total | ~19.5 KB (analyze + ownership + governance + events) | 22.4 KB (incluye identity rica) |
| Semáforo Intel | 4 slots consumidos | 1 slot |
| Coherencia interna | Cada llamada tiene su propia `generated_at` → posible drift | 1 `generated_at`, snapshot atómico |
| Cache granularidad | Fino: se puede invalidar por sección | Grueso: invalidar toda la ficha |
| Failure isolation | Un endpoint 5xx no tumba el resto | 1 fallo = ficha entera falla |

### Estrategia recomendada: **híbrida**

- **Primera carga (SSR/CSR inicial)**: llamar al **agregador `ficha`** para hidratar todo el árbol en una llamada. Reduce latencia perceptible + ahorra 3 slots del semáforo (importante para prevenir 520s bajo carga).
- **Refresh selectivo** (ejemplo: usuario cambia a tab Finanzas): mantener las llamadas por sección disponibles como fallback si necesitamos revalidar solo un bloque.
- **Cache SWR** en frontend: guardar tanto la `ficha` completa como sub-payloads por sección con la misma clave normalizada por CIF.

### Riesgo del agregador

- **Fallo atómico**: si Intel tumba la ficha entera, no vemos ownership/governance aunque estén cacheados. Mitigar con `<SectionError>` por bloque y toggle a llamadas individuales como fallback.
- **Bytes en el wire**: 22 KB gzipped ~ 6 KB; asumible.
- **Consistencia con `analyze_full`**: `ficha.finances` = `analyze_full`. Si un consumidor del backend Arroba mezcla ambos, riesgo de reprocesar dos veces. Documentar en el mapper.

---

## 5. Banderas rojas

1. **Muestra minúscula (1 CIF)**: solo Servier está enriquecido en Intel dentro de nuestra muestra. **No he podido validar estabilidad de schema entre CIFs**. Necesitamos 3-5 CIFs cacheados adicionales antes de considerar la matriz definitiva. Pedir a Intel/PM lista.

2. **Governance con nombres personas físicas**: 55 registros en Servier. Aunque BORME es público, mostrar 55 nombres en vista anónima genera fricción DPD y percepción de invasividad. Recomendación: **DEGRADAR a agregado por rol en anónimo, detalle solo autenticado**.

3. **Ownership `top1_name` puede ser persona física**: si el shareholder mayoritario es un particular (no BV/S.A./S.L.), aplicar la misma lógica de gating que en governance.

4. **`events` responde 200 pero `available: false` para Servier**: cablear el bloque como componente, pero degradar a `<Empty/>`. Cuando Intel populate, se sustituye automáticamente sin refactor.

5. **`control-synergy` no verificado**: no hay `buyers.count > 0` para Servier. **BLOQUEA B-2** para "Sinergias con mejor comprador". Pedir CIFs con buyers activos.

6. **Grupo B (sector/geo/economic) inexistente**: los 6 endpoints prometidos NO responden. **BLOQUEA B-2.4/B-2.5/B-2.6** (mercado/geo/económico) hasta que Intel exponga.

7. **Watchlist requiere JWT usuario, no S2S**: obliga a decisión de arquitectura Auth antes de cablear. Escalación a PM/Intel.

8. **`alerts` inexistente**: el botón Seguir del Header sigue en el estado "función en preparación" indefinidamente hasta que Intel exponga.

9. **`company-state` inexistente**: no hay endpoint que exponga estado (`en venta`, `capital`, `comprando`). Bloquea la insignia de estado del header prometida en el mockup.

10. **`multiple_basis` con valor `inferred_reference`**: no es un basis real como "EBITDA"/"Ingresos"/"EBIT". Sugiere que Intel no distingue el basis para Servier. Verificar con PM si es intencional o placeholder.

---

## 6. Sub-preguntas abiertas para PM/Intel

1. **¿Qué CIFs (mínimo 5) están enriquecidos en el entorno de test?** Necesario para validación cruzada de schema.
2. **¿Cuándo se expondrán los endpoints `sector/geo/economic-intelligence`?** O bien: ¿los datos vendrán embebidos en `ficha` (nuevas secciones) en vez de endpoints separados?
3. **Watchlist**: ¿el flujo previsto es que el frontend Arroba llame directamente a Intel con JWT usuario, o Arroba backend hace pasarela con token exchange? Impacta arquitectura Auth.
4. **`alerts`**: ¿existe roadmap o queda para más adelante? Impacta botón Seguir.
5. **`company-state`**: ¿el estado (en venta / capital / comprando) vendrá como campo dentro de `ficha.identity.record_status` o como endpoint independiente?
6. **`control-synergy`**: proporcionar un CIF con `buyers.count > 0` para verificar shape del endpoint.
7. **`ownership.top1_name` / `governance.officers[].name`**: ¿está bien mostrarlos en la vista anónima (BORME es público) o Intel espera que Arroba filtre/anonimize? Confirmar política DPD.
8. **`events.available: false` para Servier**: ¿es porque Servier no tiene eventos publicados, o porque el endpoint aún no está enriqueciendo? Impacta prioridad de cableado.
9. **Governance 55 officers**: ¿esperado que sea el snapshot histórico completo o solo el actual? Impacta UX (paginado, filtro por year, resumen).
10. **`ficha` vs llamadas separadas**: ¿es intencional que expongáis ambos? Si `ficha` es el canónico, ¿podéis marcar los individuales como legacy en el contrato?

---

## 7. Recomendación de secuencia de ejecución B-2

### 7.1 ARRANCA SIN FRICCIÓN (data disponible ya)

| Sub-fase | Item | Data source | Notas |
|---|---|---|---|
| **B-2.1** | Ranking (3.ª fila kgrid del Resumen) | `analyze.ranking` — 3 sub-campos + 3 explain[] | Sustituir los 3 pending (Ranking mercado / Ranking sector / Localidad). Innovación → `<Empty/>`. |
| **B-2.2** | Ownership (bloque público) | `GET /company/{cif}/ownership` | Shareholders + control. Aplicar heurística persona física para `top1_name`. |
| **B-2.3** | Governance (bloque mixed-access con degradación DPD) | `GET /company/{cif}/governance` | Anónimo: agregado por rol. Autenticado: lista completa. |
| **B-2.4** | Refactorizar a agregador `ficha` | `GET /company/{cif}/ficha` | Sustituir waterfalls por 1 llamada. Fallbacks a llamadas individuales por sección. |
| **B-2.5** | Cash Flow tab (Finanzas) | `analyze.statements.cash_flow` (NO `cashflow`) | Rows con `key/label/category/values[]`. Existe hoy con 6 filas para Servier. Sustituir `<Pending/>` actual. |
| **B-2.6** | Identidad ampliada (Item 6) | `ficha.identity` (34 campos, la mayoría null) | Cablear estructura pero degradar a `<Empty/>` por campo. Cuando Intel populate, aparece automáticamente. |

### 7.2 ESPERA A CONFIRMACIÓN

| Sub-fase | Item | Bloqueo |
|---|---|---|
| B-2.7 | Events | `available: false` para Servier. Cablear como shell + `<Empty/>`. |
| B-2.8 | Control-synergy con mejor comprador | Necesita CIF con `buyers.count > 0`. |
| B-2.9 | Watchlist (Guardar real) | Decisión Auth JWT usuario vs S2S. |
| B-2.10 | Alerts (Seguir real) | Endpoint no existe. |
| B-2.11 | Company-state (badge estado) | Endpoint no existe. |
| B-2.12 | Sector / geo / economic | Endpoints no existen. |

### 7.3 Orden sugerido para el siguiente turno

1. **B-2.1 · Ranking** (impacto alto, 0 riesgo, data disponible).
2. **B-2.5 · Cash Flow** (unblock Item 5 del plan original, data disponible).
3. **B-2.4 · Refactor a agregador `ficha`** (arreglo arquitectónico, ahorra llamadas).
4. **B-2.2 · Ownership** con heurística DPD (bloque nuevo, chequeo con PM sobre política).
5. **B-2.3 · Governance** con degradación DPD (bloque nuevo, decisión producto).
6. **B-2.6 · Identity ampliada** con Empty (estructura preparada, cero riesgo).
7. **B-2.7 · Events shell** (mínimo, degradación esperada).
8. Escalación paralela a PM/Intel con las 10 sub-preguntas de §6.

---

## 8. Anexos técnicos

- Script principal: `/app/backend/scripts/b2_intel_audit.py` (135 probes, 5 CIFs × 27 candidates, EPHEMERAL).
- Script deep-dive: `/app/backend/scripts/b2_intel_deep.py` (payloads completos para Servier, EPHEMERAL).
- Raw output audit: `/tmp/b2_audit.json` + `/tmp/b2_audit.log` (borrable).
- Raw output deep: `/tmp/b2_deep.json` + `/tmp/b2_deep.log` (borrable).

Ambos scripts se pueden borrar tras esta auditoría sin impacto en la app.

---

*Documento generado 2026-08-10 · Sesión BETA · Fase 0 B-2 · Autor: agente Arroba. Documentos hermanos: `/app/memory/PLAN_BETA_ficha_HANDOFF.md`, `/app/memory/PLAN_BETA_status_20260810.md`, `/app/memory/INTEL_PAYLOAD_INCOHERENCIAS.md`.*
