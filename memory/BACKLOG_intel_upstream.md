# Backlog Intel upstream — ítems que NO requieren cambio en arroba, sí en Intel

Este fichero recoge hallazgos aguas arriba (Agency Tool / Intel) detectados durante la
integración pero que NO se resuelven modificando código en arroba. Sirve para acordarse
de contactarlos cuando toque coordinar cambios de contrato/recomendaciones con Intel.

## P2 · 2026-09-17 · Banda de tamaño en `recommendation-intelligence/comparables`

**Contexto**: durante la validación del smoke #3 de "Análisis Estratégico" (HEAD `6c078da`)
usando **JOCA INGENIERIA Y CONSTRUCCIONES** (CIF A06009104, revenue 49,6 M€, Badajoz),
el motor `POST /api/v1/recommendation-intelligence/comparables` devolvió 20 candidatas del
mismo CNAE ("Construction of residential buildings") pero **todas micro-empresas** con
revenue entre **0,01 M€ y 0,22 M€** — dos órdenes de magnitud por debajo del ancla.

**Efecto en UI**:
- El benchmark de tamaño queda **pobre**: la media del grupo comparable es ~0,12 M€ vs 49,6 M€ del ancla → `GAP DE ESCALA = +40.685%`, cifra visualmente correcta pero no informativa.
- La sub-pestaña "Comparables" muestra que las 6 comparables sobrevivientes son micro-constructoras muy alejadas del perfil del ancla en escala.

**Petición a Intel** (NO tocar código arroba):
Revisar la banda de tamaño (revenue / employees / total_assets) del resolver
`recommendation-intelligence/comparables` para que los peers pertenezcan a la **misma
banda de tamaño** además del mismo CNAE. Referencia: `fit_dimensions.financial_fit` ya
existe en el output; podría usarse para filtrar/re-rankear candidatas cuya diferencia
de escala supere un umbral (ej. > 10× revenue).

**Estado**: pendiente coordinación con Intel. Sin fecha. No bloquea nada en arroba.

**Cómo reproducir**:
```
POST https://intel.arroba.com/api/v1/recommendation-intelligence/comparables
Body: {"identifier": "mc_63e5ba63f17f", "limit": 20}
```
→ 20 recomendaciones con revenue medio ~0,12 M€ para un ancla de 49,6 M€.
