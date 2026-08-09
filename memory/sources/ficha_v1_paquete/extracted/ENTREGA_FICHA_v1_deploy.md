# Entrega — Ficha de empresa v1 (para producción)

**Fecha:** 2026-08-08 · **Repo del producto:** `Arroba-70826` (beta) · **Cerebro:** arroba.v2 (intel).

## Qué se entrega
Ficha `empresa-f01` redibujada desde el mockup y **cableada a datos reales** vía `intelligence_layer` → `arroba.v2`.
Secciones **reales y funcionales**: Resumen (identidad + KPIs), **3 anillos de scoring** (Calidad, Encaje, Oportunidad),
Finanzas (P&L + balance + slider nivel de detalle + ratios con percentil + evolución), Valoración (EV + rango + hipótesis),
Comparativa (**compradores** con fit + razón, y empresas parecidas), **Señales** y **Oportunidades**.
Secciones en **"Próximamente"** (no bloquean; muestran estado limpio, sin inventar dato): Propiedad, Gobierno, Mercado,
Rankings, Comité.

---

## QUÉ SUBIR A INTEL (cerebro / arroba.v2)
**Nada nuevo de código.** La ficha consume endpoints de `arroba.v2` que **ya están vivos** con las 24.992 reales en Atlas:
`company-intelligence/identity`, `financial-intelligence/analyze|valuation|ratios`, `semantic-intelligence`,
`signal-intelligence/analyze`, `recommendation-intelligence/buyers|opportunities`.
- Única comprobación: que la **service API key** que use beta sea válida contra intel.
- (Los huecos que sí requerirán intel más adelante — ranking por fingerprint, estado/intención — NO son de esta entrega.)

## QUÉ SUBIR A BETA (producto `Arroba-70826`)
**Todo el cambio va aquí.** Desplegar el repo con estos ficheros:

**Backend (`backend/src/modules/intelligence_layer/`):**
- `interfaces/signal.py` *(nuevo)*
- `interfaces/recommendation.py` *(nuevo)*
- `providers/agency_tool/signal.py` *(nuevo)*
- `providers/agency_tool/recommendation.py` *(nuevo)*
- `providers/mock/signal.py` *(nuevo)*
- `providers/mock/recommendation.py` *(nuevo)*
- `router.py` *(editado: getters + `_call_signal` / `_call_recommendation` + `get_signal_analysis` / `get_buyers` / `get_opportunities`)*
- `endpoints.py` *(editado: `GET /api/companies/{cif}/signals` · `/buyers` · `/opportunities`)*

**Frontend (`frontend/src/`):**
- `components/company/layout/CompanyFichaLayoutV2.tsx` *(nuevo — la ficha)*
- `components/company/CompanyFichaF01Client.tsx` *(editado: usa V2 + fetch signal/buyers/opportunities)*
- `lib/companies/intelligence-types.ts` *(editado: `SignalAnalysis`, `RecommendationSet`)*
- `lib/companies/intelligence-client.ts` *(editado: `signalAnalyze`, `buyers`, `opportunities`)*

**Variables de entorno en beta (flip mock→real):**
```
AGENCY_TOOL_MODE=real
INTELLIGENCE_COMPANY_V2_ENABLED=true
AGENCY_TOOL_BASE_URL=https://preview-arroba-app.emergent.host   # host de intel (→ intel.arroba.com cuando el DNS esté)
ARROBA_SERVICE_API_KEY_PRIMARY=<service key>
```
Ruta pública de la ficha: `/{locale}/empresa-f01/{CIF}` (p. ej. `/es/empresa-f01/A87803862`).

---

## CHECKS ANTES DE PRODUCCIÓN (ejecutar en el entorno de beta — aquí no hay `node_modules`)
1. `cd frontend && npm ci && npm run typecheck` — **imprescindible** (el TSX no se ha podido type-checkear en el sandbox).
2. `npm run lint` y `npm run build`.
3. Backend: `pytest` de `intelligence_layer` (los nuevos providers siguen el patrón; añadir/pasar sus tests).
4. Smoke real: con `AGENCY_TOOL_MODE=real`, abrir la ficha de un CIF real y verificar que cargan Resumen/Finanzas/
   Valoración/Comparativa/Señales/Oportunidades y los 3 anillos.

## Caveats honestos
- **Frontend sin `tsc` en origen** (sandbox sin dependencias). El backend sí pasó `py_compile`.
- El mapeo de `candidate`/`fit_dimensions` de compradores es **best-effort**: en el contrato ese campo es genérico
  (`Any`); revisar contra la respuesta real y ajustar `providers/agency_tool/recommendation.py` si hiciera falta.
- Secciones Propiedad/Gobierno/Mercado/Rankings/Comité quedan como "Próximamente" hasta cablear su provider/hueco.
