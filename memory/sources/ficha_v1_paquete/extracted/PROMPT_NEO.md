# PROMPT PARA NEO — Desplegar Ficha de empresa v1 (arroba.com / beta)

Hola Neo. Te paso el paquete de la **Ficha de empresa v1** ya cableada a datos reales, para subir a **producción del
producto (beta / `Arroba-70826`)**. **A intel NO se sube código** (solo se consume `arroba.v2`, que ya está vivo con
las 24.992 reales en Atlas). Sigue estos pasos exactamente.

## 0. Qué es esto
Ficha `empresa-f01` redibujada y conectada al `intelligence_layer` → `arroba.v2`. Añade dos providers nuevos
(**signal** y **recommendation**) siguiendo el patrón canónico del provider `financial` (interface + agency_tool + mock
+ router con caché/breaker/métricas + endpoint), y el nuevo front `CompanyFichaLayoutV2`. Secciones reales: Resumen +
3 anillos (Calidad/Encaje/Oportunidad), Finanzas, Valoración, Comparativa (compradores + parecidas), Señales,
Oportunidades. El resto (Propiedad, Gobierno, Mercado, Rankings, Comité) quedan como "Próximamente" a propósito.

## 1. Aplicar los archivos del zip
El zip respeta las rutas del repo. Cópialos dentro de `Arroba-70826/` (rama `70826`), respetando la estructura:

**Backend (`backend/src/modules/intelligence_layer/`):**
- `interfaces/signal.py` (nuevo)
- `interfaces/recommendation.py` (nuevo)
- `providers/agency_tool/signal.py` (nuevo)
- `providers/agency_tool/recommendation.py` (nuevo)
- `providers/mock/signal.py` (nuevo)
- `providers/mock/recommendation.py` (nuevo)
- `router.py` (SUSTITUYE — ya trae getters + `_call_signal`/`_call_recommendation` + `get_signal_analysis`/`get_buyers`/`get_opportunities`)
- `endpoints.py` (SUSTITUYE — añade `GET /api/companies/{cif}/signals`, `/buyers`, `/opportunities`)

**Frontend (`frontend/src/`):**
- `components/company/layout/CompanyFichaLayoutV2.tsx` (nuevo)
- `components/company/CompanyFichaF01Client.tsx` (SUSTITUYE)
- `lib/companies/intelligence-types.ts` (SUSTITUYE)
- `lib/companies/intelligence-client.ts` (SUSTITUYE)

> Importante: `router.py`, `endpoints.py`, `intelligence-types.ts`, `intelligence-client.ts` y `CompanyFichaF01Client.tsx`
> están **editados sobre la versión actual del repo**. Si el repo ha cambiado desde el clon de Daniel, haz **merge**
> revisando el diff en vez de sobrescribir a ciegas.

## 2. Variables de entorno en beta (flip mock→real)
```
AGENCY_TOOL_MODE=real
INTELLIGENCE_COMPANY_V2_ENABLED=true
AGENCY_TOOL_BASE_URL=https://preview-arroba-app.emergent.host   # host de intel (→ intel.arroba.com cuando el DNS esté)
ARROBA_SERVICE_API_KEY_PRIMARY=<service key válida contra intel>
```

## 3. Verificar ANTES de producción (imprescindible)
```
cd frontend && npm ci && npm run typecheck && npm run lint && npm run build
cd ../backend && pytest -q src/modules/intelligence_layer   # o la suite que uses
```
- **El typecheck del frontend es obligatorio**: el TSX no se ha podido type-checkear en el entorno de origen.
- Smoke real (con `AGENCY_TOOL_MODE=real`): abre `/es/empresa-f01/A87803862` (u otro CIF real) y comprueba que cargan
  Resumen, Finanzas, Valoración, Comparativa, Señales, Oportunidades y los 3 anillos.

## 4. Punto a vigilar
El mapeo de compradores en `providers/agency_tool/recommendation.py` (`_map`: `candidate` / `fit_dimensions`) es
**best-effort**, porque en el contrato `arroba.v2` ese campo es genérico (`Any`). Si en el smoke los compradores salen
con nombre o fit vacíos, ajusta ese `_map` contra la respuesta real de `POST /api/v1/recommendation-intelligence/buyers`.

## 5. Qué NO tocar
- No subas nada a intel (agency tool). Solo verifica que la service key es válida.
- No toques las secciones "Próximamente" (Propiedad, Gobierno, Mercado, Rankings, Comité): son de una entrega posterior.

Cuando esté verde el typecheck/build y el smoke real cargue, despliega beta. Gracias.
