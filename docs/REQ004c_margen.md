# REQ-004c — Filtro por MARGEN de EBITDA (Intel + Beta)

⚠️ Aditivo, por diff, no borrar nada. Extiende el buscador financiero (REQ-004/004b) con la métrica **margen de EBITDA**. Dos repos.

## Problema
"empresas con margen de EBITDA superior al 30%" caía al semántico → 50 resultados con EBITDA negativo/"—". Faltaba: (1) la métrica margen, (2) el comparador "superior **al**/**del**", (3) el "%" se mapeaba solo a crecimiento.

## BETA · `backend/src/modules/copilot/financial_query.py`
- Comparadores `_GTE`/`_LTE` aceptan "al"/"del" ("superior al", "más del", "menor del"…).
- Los predicados con "%" se **clasifican por contexto**: `margen`/`rentabilidad` → `ebitda_margin_min/max`; `crec`/`crezc`/`growth` → `growth_min`.
- `ebitda_margin` como fracción (30% → 0,30). Residual limpio (margen/rentabilidad como filler).
- `tests/test_financial_query.py`: +1 test (`test_ebitda_margin`). **10/10**.

## INTEL · `routes/skills.py` + `services/skills_search.py`
- `SearchFilters`: `ebitda_margin_min/max`.
- `_num_screen` incluye margen; `_num_clauses` empuja `financials.latest.ebitda_margin` a Mongo; `_passes_filters` guarda con `_margin_of(doc)` (computa ebitda/revenue si no está almacenado; métrica desconocida no pasa). **pytest 9/9** + asserts de margen OK.

## Verificado (mi copia)
Beta pytest 10/10 · Intel pytest 9/9 · py_compile OK. Casos: "margen de EBITDA superior al 30%"→{ebitda_margin_min:0.30}; "margen inferior al 10%"→{ebitda_margin_max:0.10}; "crezcan más de 20%"→{growth_min:0.20} (sin confundir); combo margen+ingresos OK.

## Despliegue
Intel primero (redeploy con el margen), luego Beta. Reutilizar cliente canónico para skills/search (ya cubierto por service.py). Degrada con elegancia.
