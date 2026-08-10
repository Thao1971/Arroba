# Incoherencias de payload Intel (deuda técnica)

## Contexto

Detectadas durante **B-1.3 (Intel I-1)** — algunos campos vienen poblados solo en un subset de endpoints canónicos, forzando fallbacks en frontend. La UI degrada correctamente sin datos, pero para maximizar el valor entregado hoy, hemos añadido cascadas de fallback que leen desde el endpoint donde SÍ está el dato.

## Casos detectados

### 1 · `identity.description` / `identity.objeto_social`

| Aspecto | Detalle |
|---|---|
| **Poblado en** | `GET /api/companies/{cif}/financial-analysis.identity.description` (y `.objeto_social`) |
| **NULL en** | `GET /api/companies/{cif}/section/identity.description` (el `objeto_social` sí llega aquí) |
| **CIF probado** | `B28184687` (Servier) |
| **Consumidor afectado** | `HeroBlock` en `frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` |
| **Fallback aplicado** | Sí (B-1.3 Fase 1) — cascada `identity.description → identity.objeto_social → financialAnalysis?.identity?.description → financialAnalysis?.identity?.objeto_social → <Empty/>` |
| **Contrato canónico** | `arroba-identity-v1` (según JSDoc de `intelligence-types.ts`) |

### 2 · `valuation.benchmark` / `valuation.methodology` · **RESUELTO 2026-08-10**

| Aspecto | Detalle |
|---|---|
| **Poblado en** | `GET /api/companies/{cif}/financial-analysis.valuation.benchmark` y `.methodology` |
| **NULL en** | `GET /api/companies/{cif}/valuation` (endpoint canónico `arroba-valuation-v1`) — verificado en Turno D · 7/7 CIFs siguen devolviendo null/vacío. |
| **CIF probado** | `B28184687` (Servier) + los 6 CIFs de Turno D (`B28031458, B50949346, A81921611, B82229907, V83153700, A28354132`) · **cobertura 6/6 poblada** en `ficha.finances.valuation.{benchmark, methodology}`. |
| **Consumidor afectado** | `Valoracion` en `frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` |
| **Estrategia final** | **2026-08-10 · retirada del fallback**: se retiró el hook SWR `intelligenceClient.valuation(cif)` y el fallback `?? financialAnalysis.valuation.*`. Ahora `Valoracion` consume `valuation` derivado del agregador `ficha.finances.valuation` vía adapter `adaptValuationFromFinances`. Reducción waterfall SWR 7→6. Endpoint backend `/valuation` **permanece operativo** por si otro consumidor lo necesita en el futuro. |
| **Contrato canónico** | `arroba-valuation-v1` (`ValuationAnalysis` interface) |

### 3 · `statements.cash_flow.cash_conversion.value` con `format="percent"`

| Aspecto | Detalle |
|---|---|
| **Poblado en** | `GET /api/companies/{cif}/financial-analysis.statements.cash_flow.rows` (fila `key="cash_conversion"`) |
| **Payload observado** | Ambos años vienen `{"value": 0.6568, "format": "percent"}` y `{"value": 0.6608, "format": "percent"}` (Servier `B28184687`) — semánticamente ambiguo: valores en el rango `[0,1]` sugieren **ratio decimal**, pero `format: percent` fuerza al helper `fmtCell` a suffix `%` sin multiplicar × 100, pintándose como `0,7%` en vez de `65,7%` que es la convención Corporate Finance para "Conversión de caja (OCF/EBITDA)". |
| **Consumidor afectado** | `CashFlowTable` en `frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` (B-2.5) |
| **Fallback aplicado** | **NO** — R15 estricto, se pinta lo que llega. El helper `fmtCell(value, 'percent')` no multiplica × 100 (contrato compartido con las tablas de Ratios y KPIs, donde los porcentajes ya vienen en base 100). |
| **Contrato canónico** | `arroba-financial-v1` — passthrough (`HARDENING-005`) |
| **Impacto UX** | Bajo · celda numéricamente correcta bajo la interpretación literal del formato; interpretación semántica confusa para el analista Corporate Finance. Aplicable únicamente a la fila `cash_conversion` (rows `cf_operating`, `cf_capex`, `cf_financing`, `cf_net_change`, `free_cash_flow` vienen con `format: currency` y se pintan correctamente). |
| **Decisión Intel esperada** | (a) Multiplicar × 100 en origen y devolver `65.68` con `format: percent`; o (b) devolver `0.6568` con `format: ratio` (que el helper renderiza como `0,66×`) — cualquiera de las dos armoniza con el contrato existente. |
| **BRIDGING APLICADO EN FRONTEND · 2026-08-10** | Aplicado bridging acotado en `CashFlowTable` (Tarea 1): `if (row.key === "cash_conversion" && format === "percent" && typeof value === "number" && Math.abs(value) <= 1) value = value * 100`. **Solo afecta a la fila `cash_conversion`**; el resto del cash-flow (5/6 filas + KPIs, ratios) sigue passthrough puro. **Retirar cuando Intel armonice el contrato** (opción a o b arriba). |
| **BRIDGING EXTENDIDO · 2026-08-10 · Ratios rentabilidad (post-Turno D · Item 3)** | Mismo patrón aplicado en la card `Ratios financieros` (`CompanyFichaLayoutV2.tsx` L648-655) para todos los `FinancialRatioItem` con `format === "percent" && Math.abs(value) <= 1`. Coherente con `RatiosTrendCard.fmtRatioValue`. **Borde teórico**: un ratio `percent` legítimamente base 100 con valor absoluto ≤ 1 (ej. 0,8 %) también se multiplicaría × 100 → pintaría 80 %. Improbable en payloads reales de rentabilidad; si Intel armoniza contrato (opción a o b), este bridging desaparece automáticamente. |

## Recomendación

Escalar a equipo Intel para **armonizar los contratos canónicos** entre endpoints. Idealmente:

- `/section/identity` debería exponer los mismos campos `description`/`objeto_social` que `/financial-analysis.identity.*`.
- `/valuation` debería exponer los mismos campos `benchmark`/`methodology` que `/financial-analysis.valuation.*`.

Cuando Intel armonice, **los fallbacks frontend pueden retirarse** — no rompen nada, sólo dejarán de ser necesarios (los operadores `??` degradarán silenciosamente al primer no-null).

## Riesgo si no se armoniza

**Bajo**. Los fallbacks funcionan correctamente. El único coste es:

- Duplicación de lógica en frontend (2 lugares que la resuelven).
- Llamadas SWR paralelas cargando la misma información desde 2 endpoints distintos (waterfall innecesario si la ficha ya carga `/financial-analysis` de todas formas).
- Acoplamiento implícito: el `Valoracion` ahora depende de que `/financial-analysis` esté cargado antes de mostrar el card Benchmark, cuando conceptualmente sólo debería depender de `/valuation`.

## Cómo retirar los fallbacks cuando Intel armonice

1. `grep -rnE "financialAnalysis\?\.(identity|valuation)" frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx`.
2. Sustituir el operador `??` por el valor canónico solo (`identity.description`, `valuation.benchmark`, `valuation.methodology`).
3. Eliminar los cast `as { benchmark?: ValuationBenchmark | null } | null` (ya no son necesarios cuando `ValuationAnalysis.benchmark` está bien tipado y siempre viene del endpoint canónico).
4. `yarn typecheck && yarn build` verde.

## Fecha

**2026-08-10** · Sesión BETA · B-1.3 Fase 1.

## Referencias cruzadas

- `/app/memory/PLAN_BETA_status_20260810.md` — status general de sesión.
- `/app/frontend/src/lib/companies/intelligence-types.ts` — `ValuationBenchmark`, `ValuationScenario`, `FinancialAnalysisIdentity` (tipos añadidos en esta iteración).
- `/app/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx.bak_20260810_124808_pre_b13_intel_i1` — snapshot pre B-1.3.
