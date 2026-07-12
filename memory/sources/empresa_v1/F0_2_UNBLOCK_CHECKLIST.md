# F0_2_UNBLOCK_CHECKLIST.md — Precondiciones para reanudar F0.2

Estado actual (2026-07-12 21:54 UTC): **🟢 DESBLOQUEADO** · Caso canónico `A87803862` (TOTALENERGIES) validado en producción · flujo `resolve → identity → financial-analyze` operativo con datos reales. Evidencia en `F0_2_SMOKE_20260712_03.md`.

Estados previos:
- 2026-07-06 · 🔴 sondeo inicial NO-GO (13/13 CIFs 404).
- 2026-07-12 21:04 · 🔴 sondeo #1 post-primer aviso NO-GO (13/13 CIFs 404).
- 2026-07-12 21:18 · 🔴 sondeo #2 post-redeploy NO-GO (13/13 CIFs 404 · descubrimiento del identificador `master_id`).
- 2026-07-12 21:54 · 🟢 sondeo #3 (Paso 0 F0.2) GO con caso canónico `A87803862`.

---

## 1 · Condición externa de desbloqueo

Agency Tool debe poblar su Master Layer con datos financieros verificables para al menos **1 CIF real**, con las siguientes garantías:

- Cada cifra trazable a fuente pública o Agency Tool documentada (`data_source` field poblado en la respuesta).
- Cobertura mínima aceptable: **1-3 ejercicios** por empresa, al menos para las partidas de **Nivel 2** (7 categorías Cuenta de Resultados · 5 categorías Balance · 5 categorías Ratios). Cash Flow puede seguir BLOCKED sin bloquear F0.2 (COMP-3005 permanece stub).

El desbloqueo lo confirma el **usuario** cuando Agency Tool comunique que su Master Layer ya sirve datos. Arroba no puede desbloquear F0.2 unilateralmente.

---

## 2 · Script de sondeo automatizado (a documentar aquí · no implementar todavía)

Cuando el usuario dé el "ok", ejecutar el siguiente sondeo antes de tocar código de producción:

```
Herramienta: script Bash + curl + python3.
Ubicación futura: scripts/f0_2_agency_sondeo.py
Entradas:
  - AGENCY_TOOL_BASE_URL (leído de backend/.env)
  - ARROBA_SERVICE_API_KEY_PRIMARY (leído de backend/.env)
Salidas:
  - /app/memory/sources/empresa_v1/F0_2_SONDEO_<timestamp>.md con:
      · tabla de 5 CIFs vs endpoint (identity V2 + financial-intelligence/analyze V1)
      · HTTP status por endpoint
      · presencia de data_source
      · years cubiertos por empresa
      · veredicto de desbloqueo: GO / NO-GO / PARTIAL

Reglas de validación (todas deben pasar para GO):
  1. Al menos 1 CIF devuelve HTTP 200 en identity V2 + financial-intelligence/analyze V1.
  2. La respuesta financial contiene evolution.years con longitud ≥ 1.
  3. Cada cifra tiene `data_source` no vacío o metadata.source ≠ null.
  4. Aparecen al menos 4 de las 7 categorías canónicas de Cuenta de Resultados o 3 de las 5 de Balance.
  5. Los data_source son URLs públicas o identificadores institucionales verificables (BORME, CNMV, InfoCIF, Registro Mercantil, etc.).
```

## 3 · Criterios que Agency Tool debe cumplir

| # | Criterio | Estado actual |
|---|---|---|
| 3.1 | `POST /api/v1/financial-intelligence/analyze` responde 200 con `detail ≠ "company not found in Master Layer"` para ≥ 1 CIF real | 🟢 `A87803862` (TOTALENERGIES · `mc_80e03f1e1627`) devuelve `has_financials=true` con 3 ejercicios · sondeo #3 · 2026-07-12 21:54 UTC |
| 3.2 | Cada cifra devuelta trazable a fuente pública o Agency Tool documentada (`data_source` field poblado) | 🟢 `explainability.data_source="master_companies + norm_financials (Iberinform)"` + cada ratio con `source="Iberinform statements (Normalized Layer)"` |
| 3.3 | Cobertura mínima 1-3 ejercicios por empresa, al menos para las partidas de Nivel 2 | 🟢 3 ejercicios (2022, 2023, 2024) · 7/7 CdR · 5/5 Balance · 13 ratios · Cash Flow BLOCKED (proveedor devuelve null) |
| 3.4 | `POST /api/v2/company-intelligence/identity` responde 200 con identidad completa | 🟢 identidad completa (legal_name, CNAE 3515 · sección D, MADRID, 79 empleados, capital 689136€, corporate_purpose, sources, updated_at) |
| 3.5 | Endpoints Signal Intelligence + Semantic Intelligence al menos devuelven schema válido (aunque estén vacíos) | 🟢 (`semantic-intelligence/search` devuelve `count=10` en todas las queries tras redeploy · schema OK · índice semántico poblado) |

**Todas** las filas 3.1-3.4 deben pasar a 🟢 para reanudar F0.2.

---

## 4 · Lista de CIFs de smoke test post-desbloqueo

Los 13 sondeados el 2026-07-06 + el mock `mc_olmedo`:

### Cotizadas IBEX35 (referencia pública inmediata)

1. `A28017895` — Iberdrola, S.A.
2. `A28660608` — Repsol, S.A.
3. `A48010615` — Banco Bilbao Vizcaya Argentaria, S.A.
4. `A78003662` — Telefónica, S.A.
5. `A08663619` — Grifols, S.A.
6. `A82743283` — Naturgy Energy Group, S.A.
7. `A80058069` — Industria de Diseño Textil, S.A. (Inditex)
8. `A08023908` — Aena, S.M.E., S.A.
9. `A83373119` — ACS, Actividades de Construcción y Servicios, S.A.
10. `A28031260` — Mapfre, S.A.
11. `A48127101` — Amadeus IT Group, S.A.
12. `U28472948` — Banco Santander, S.A. (u28…)

### PYME de referencia interna

13. `B47820150` — Grupo Olmedo Hoteles, S.L. (`mc_olmedo`)

**Umbral mínimo para GO**: ≥ 1 CIF de esta lista debe devolver datos financieros con las garantías del §3.

---

## 5 · Estado de cada precondición

Actualizar esta tabla en cada sondeo. Cambios de estado a 🟢 requieren el sondeo automatizado (§2).

| Precondición | 2026-07-06 | 2026-07-12 21:04 (#1) | 2026-07-12 21:18 (#2) | 2026-07-12 21:54 (#3 · A87803862) | veredicto GO/NO-GO |
|---|---|---|---|---|---|
| 3.1 · financial-analyze devuelve datos para ≥ 1 CIF | 🔴 | 🔴 | 🔴 | 🟢 `A87803862` · has_financials=true · 3 ejercicios (2022-2024) | **GO** |
| 3.2 · `data_source` trazable | 🔴 | 🔴 | 🔴 | 🟢 explainability.data_source="master_companies + norm_financials (Iberinform)" + source por ratio | **GO** |
| 3.3 · cobertura ≥ 1 ejercicio · Nivel 2 | 🔴 | 🔴 | 🔴 | 🟢 7/7 CdR + 5/5 Balance + 13 ratios · 3 ejercicios evolution | **GO** |
| 3.4 · identity V2 devuelve identidad no vacía en modo real | 🔴 | 🔴 | 🟡 | 🟢 identidad completa (CIF, master_id, legal, CNAE, capital, empleados, corporate_purpose) | **GO** |
| 3.5 · schemas Signal/Semantic válidos | 🟢 | 🟢 | 🟢 | 🟢 | GO |

Veredicto global 2026-07-12 21:54 UTC (sondeo #3 Paso 0 F0.2): **🟢 GO** (5/5 precondiciones verdes con caso canónico `A87803862`).

---

## 6 · Protocolo de reanudación

Cuando el veredicto global pase a **GO**:

1. Ejecutar el sondeo (§2), guardar `F0_2_SONDEO_<timestamp>.md`.
2. Actualizar esta tabla a 🟢 con la fecha.
3. Notificar al main agent para reanudar F0.2 desde el `F0_2_PLAN.md`.
4. Iniciar la construcción de componentes por el orden ACC: COMP-3001 → 3002 → 3003 → 3004 → 3006 → 3007. COMP-3005 se materializa como stub desde el primer commit.
5. Verificación visual overlay pixel-diff contra `ce-finanzas.jsx` (Objetivo Δh ≤ ±2 px).
6. Entregable mínimo idéntico al de F0.1c (URL preview · captura full-page en `/public/_qa/f0_2/` · tests verdes).

---

## 7 · Comunicación externa

- El desbloqueo lo comunica **el equipo de Agency Tool** al **usuario**. Arroba no puede acelerarlo.
- Cuando el usuario informe del desbloqueo, ejecutar §2 antes de reanudar.
- Prohibido asumir "ya está" hasta que el sondeo lo confirme.

## Historial

- v1 · 2026-07-06 · creación durante la pausa oficial de F0.2.
- v2 · 2026-07-12 · 21:04-21:07 UTC · sondeo #1 tras primer aviso de despliegue. Veredicto: NO-GO idéntico. Detalle en `F0_2_SONDEO_20260712.md`.
- v3 · 2026-07-12 · 21:16-21:18 UTC · sondeo #2 tras nuevo despliegue (engine build `21:13:26Z`). Veredicto: NO-GO. Nuevo hallazgo: los endpoints esperan `master_id`, no CIF; `financial-analyze` devuelve `has_financials=false` incluso con `master_id` correcto. Detalle en `F0_2_SONDEO_20260712_02.md`.
- v4 · 2026-07-12 · 21:53-21:54 UTC · sondeo #3 (Paso 0 F0.2) con caso canónico `A87803862` (TOTALENERGIES). Veredicto: **🟢 GO**. Los 3 endpoints (`resolve`/`identity`/`financial-analyze`) responden 200 con datos reales. Detalle en `F0_2_SMOKE_20260712_03.md`.

---

## 8 · Escalada estándar hacia el equipo del Intelligence Engine

Texto listo para copiar-pegar (frase literal aprobada por el usuario):

> "Necesitamos que confirméis, para el consumidor externo con X-API-Key de Arroba, al menos 1 CIF (o identificador que espere el endpoint) que hoy devuelva: (a) identity 200 con datos, (b) financial-analyze 200 con datos y data_source trazable, (c) al menos 1 ejercicio con partidas de Nivel 2. Si el identificador esperado no es CIF (por ejemplo master_company_id), documentadlo. Si el dataset canónico aún no está expuesto para X-API-Key, decidnos cuándo estará."

Contexto técnico útil para el equipo (extraído del sondeo #2, 2026-07-12 21:16-21:18 UTC):

- `X-API-Key` usada: `ARROBA_SERVICE_API_KEY_PRIMARY` (perfil `arroba`, 16 fuentes).
- 13 CIFs probados en `POST /api/v2/company-intelligence/identity` y `POST /api/v1/financial-intelligence/analyze` con payload `{"identifier":"<CIF>"}` → 404 `company not found in Master Layer` en los 13.
- Muestreo con `master_id` (`mc_27b69a27a8dc` obtenido vía `semantic-intelligence/search`) → identity 200 con datos identitarios básicos; financial-analyze 200 con `has_financials=false` y `valuation.method="insufficient_data"`.
- Solicitud arroba: exposición pública para X-API-Key de arroba de al menos 1 CIF con Nivel 2 completo (7 categorías CdR / 5 Balance / 5 Ratios) + `data_source` trazable, o documentación del identificador esperado y ETA de disponibilidad.
