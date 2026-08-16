# HARDENING-038 — Proxies JWT de la ficha hacia Intel

⚠️ Aditivo. En el bundle vivo, cambiar `intel_get`/`intel_post` por el **cliente canónico** (`get_agency_tool_client()`/`_intel_call_ff`), como el resto de llamadas a Intel. Los proxies NO exponen la service-key al navegador (van por ruta JWT). Todos cachean (TTL 1h) y devuelven None en fallo (empty honesto → UI degrada).

## Fichero (incluido, py_compile OK)
`backend/src/modules/copilot/intel_ficha_proxies.py` — funciones adapter:
- `committee_analyze(cif, lens)` → `investment-decision/analyze` (lente→buyer_profile: neutral=None, buyer=strategic, investor=private_equity). Cache (cif,lens).
- `committee_export(decision_id, fmt)` → `.../export-payload` (acción de créditos).
- `succession_profile(cif)` → `signal-intelligence/succession-profile/{cif}` (E2). Cache cif.
- `rollup_thesis(cif, cnae?)` → `investment-intelligence/rollup-thesis` (resuelve cnae por CIF si falta). Cache cnae.
- `market_reading(cif)` → `market.reading_ai` del bloque market. Cache cif.

## Rutas JWT (añadir al router de la ficha)
```python
from fastapi import Depends
from src.modules.copilot.intel_ficha_proxies import (
    committee_analyze, committee_export, succession_profile, rollup_thesis, market_reading)

@router.post("/api/company/{cif}/committee")            # ?lens=neutral|buyer|investor
async def _committee(cif: str, lens: str = "neutral", user=Depends(current_user)):
    return await committee_analyze(cif, lens) or {"error": "unavailable"}

@router.get("/api/company/{cif}/committee/export/{decision_id}")
async def _committee_export(cif: str, decision_id: str, user=Depends(current_user)):
    return await committee_export(decision_id)

@router.get("/api/company/{cif}/succession")
async def _succession(cif: str, user=Depends(current_user)):
    return await succession_profile(cif) or {}

@router.get("/api/company/{cif}/rollup")
async def _rollup(cif: str, cnae: str | None = None, user=Depends(current_user)):
    return await rollup_thesis(cif, cnae) or {}

@router.get("/api/company/{cif}/market-reading")
async def _market_reading(cif: str, user=Depends(current_user)):
    return {"reading": await market_reading(cif)}
```

## apiClient (frontend) — usados por el registro (HARDENING-037)
```ts
committee: (cif, lens) => request(`/api/company/${cif}/committee?lens=${lens}`, { method: 'POST' }),
committeeExport: (cif, id) => request(`/api/company/${cif}/committee/export/${id}`),
succession: (cif) => request(`/api/company/${cif}/succession`),
rollup: (cif) => request(`/api/company/${cif}/rollup`),
marketReading: (cif) => request(`/api/company/${cif}/market-reading`),
```
Con esto, el `FichaSectionContext` de HARDENING-037 se rellena y comité/mercado/oportunidades muestran datos reales. Requiere Intel desplegado (investment-decision, succession-profile, rollup-thesis, market_reading).
