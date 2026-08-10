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

### 2 · `valuation.benchmark` / `valuation.methodology`

| Aspecto | Detalle |
|---|---|
| **Poblado en** | `GET /api/companies/{cif}/financial-analysis.valuation.benchmark` y `.methodology` |
| **NULL en** | `GET /api/companies/{cif}/valuation` (endpoint canónico `arroba-valuation-v1`) |
| **CIF probado** | `B28184687` (Servier) — payload real observado: `benchmark = null`, `methodology = ""` en `/valuation`; `benchmark = { peers_count: 8, ebitda_margin_percentile: 88, ... }` y `methodology = "Valoración por múltiplo EV/EBITDA (rango 4x–8x…)"` en `/financial-analysis.valuation` |
| **Consumidor afectado** | `Valoracion` en `frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` |
| **Fallback aplicado** | Sí (B-1.3 Fase 1 · patch) — `valuation.benchmark ?? financialAnalysis?.valuation?.benchmark ?? null` y `valuation.methodology ?? financialAnalysis?.valuation?.methodology ?? null` |
| **Contrato canónico** | `arroba-valuation-v1` (`ValuationAnalysis` interface) |

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
