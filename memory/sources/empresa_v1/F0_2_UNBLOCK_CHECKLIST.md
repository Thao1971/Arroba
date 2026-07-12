# F0_2_UNBLOCK_CHECKLIST.md — Precondiciones para reanudar F0.2

Estado actual (2026-07-06): **🔴 BLOQUEADO por dependencia externa**.
La reanudación es automática (main agent puede continuar) en cuanto todas las precondiciones estén en 🟢.

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
| 3.1 | `POST /api/v1/financial-intelligence/analyze` responde 200 con `detail ≠ "company not found in Master Layer"` para ≥ 1 CIF real | 🔴 (0/13 CIFs sondeados el 2026-07-06 devuelven datos) |
| 3.2 | Cada cifra devuelta trazable a fuente pública o Agency Tool documentada (`data_source` field poblado) | 🔴 (no verificable · endpoint no devuelve datos) |
| 3.3 | Cobertura mínima 1-3 ejercicios por empresa, al menos para las partidas de Nivel 2 | 🔴 |
| 3.4 | `POST /api/v2/company-intelligence/identity` responde 200 con identidad completa (ya validado en F0.1 · sigue vacío en modo real) | 🔴 (0/13 CIFs devuelven identidad no vacía en modo real) |
| 3.5 | Endpoints Signal Intelligence + Semantic Intelligence al menos devuelven schema válido (aunque estén vacíos) | 🟢 (`semantic-intelligence/search` devuelve `count: 0` · schema OK · pero base semántica también vacía) |

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

| Precondición | 2026-07-06 (t=0) | próximo sondeo | veredicto GO/NO-GO |
|---|---|---|---|
| 3.1 · financial-analyze devuelve datos para ≥ 1 CIF | 🔴 | ⏳ | NO-GO |
| 3.2 · `data_source` trazable | 🔴 | ⏳ | NO-GO |
| 3.3 · cobertura ≥ 1 ejercicio · Nivel 2 | 🔴 | ⏳ | NO-GO |
| 3.4 · identity V2 devuelve identidad no vacía en modo real | 🔴 | ⏳ | NO-GO |
| 3.5 · schemas Signal/Semantic válidos | 🟢 | 🟢 | GO (subcondición) |

Veredicto global 2026-07-06: **NO-GO** (4/5 precondiciones críticas en rojo).

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
