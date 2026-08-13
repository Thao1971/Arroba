# DEPLOY_NOTES · bundle 2026-08-13

Bundle acumulado listo para push manual a Prod (`beta.arroba.com`). Todos los
cambios validados en dev pod contra Servier `B28184687` (auth + anon).

## Contenido del bundle

| ID              | Alcance                                              | Estado |
|:----------------|:-----------------------------------------------------|:------:|
| HARDENING-021   | Explicabilidad · Fase 1 (Tips) + Fase 2 (SrcDot) + Fase 3 (MethodDetails) | ✅ |
| HARDENING-004   | Backend · `POST /api/admin/cache/purge` (X-Admin-Token) | ✅ |
| HARDENING-022   | Redistribución Resumen · 7 bloques 1:1 spec           | ✅ |
| HARDENING-022b  | Wiring shapes reales Intel · retirado fallback verdict | ✅ |
| HARDENING-004b  | Pytest smoke `/purge` · 8/8 verdes en 50 ms          | ✅ |
| HARDENING-022c  | Cleanup Resumen · -177 L (5 items retirados)          | ✅ |
| GLOSARIO        | 5 keys nuevas (FACTURACION · ACTIVOS_TOTALES · QUALITY_SCORE · BUYER_FIT_SCORE · OPPORTUNITY_SCORE) | ✅ |
| HARDENING-005   | `scripts/post_deploy.sh` orquesta purge + smoke      | ✅ |
| HARDENING-022d  | Bundle correctivo · tooltips + rings sin focus azul + fallback verdict restaurado | ✅ |

Detalle completo por bloque: `/app/memory/PLAN_BETA_status_20260810.md`.

## Verificaciones pre-push

- `yarn typecheck` verde (1.9 s).
- `yarn build` verde (17.3 s) · First Load JS shared **87.3 kB** (baseline, sin regresión).
- `pytest tests/test_admin_cache_purge.py -m smoke` · **8/8 passed in 0.05 s**.
- Curl `/api/companies/B28184687/ficha?authenticated=true` responde con los shapes 022b (`identity.activity_es`, `verified`, `auditor`, `linkedin_url`, `description_source`, `finances.has_financials`, `finances.provenance.kpis.net_debt_ebitda`).

## Secuencia de deploy (5 pasos)

```bash
# 1. Sync token admin en panel Emergent Prod (env var ARROBA_ADMIN_TOKEN)
#    Generar valor con:  python3 -c "import secrets; print(secrets.token_urlsafe(48))"

# 2. Deploy del bundle desde el panel (Save to GitHub → Deploy).

# 3. Post-deploy automatizado:
export ARROBA_ADMIN_TOKEN='<valor-sincronizado-en-Prod>'
bash scripts/post_deploy.sh
# Exit 0 → OK. Exit 1 → revisar output y logs backend.

# 4. Smoke visual manual en https://beta.arroba.com/es/empresa-f01/B28184687:
#    (auth con test.arroba+neo@arroba.com según /app/memory/test_credentials.md)
#    ▸ Cabecera renovada con URL clicable + badges Verificada + Auditada · ERNST & YOUNG
#    ▸ 4 KPIs T2 (Facturación · EBITDA · DN/EBITDA · Activos totales) con sparklines + SrcDot
#    ▸ T3 Resumen prosa oscura con disclaimer "generada por IA"
#    ▸ T4 Tesis de oportunidad como prosa continua (opportunity.thesis.narrative en Prod)
#    ▸ Chips oportunidades en cabecera (opportunity.chips[] en Prod)
#    ▸ T5 Detalles de la compañía (rename Identificación) sin bloque legacy debajo
#    ▸ T6 Diagnóstico 3 rings sin card wrapper, tooltips activos (hover en labels)
#    ▸ T7 Evolución al final

# 5. Si algún check falla → rollback vía panel Emergent + reporte al equipo.
```

## Prerrequisitos ambiente Prod

- `MONGO_URL` sin cambios (misma base).
- `ARROBA_ADMIN_TOKEN` nuevo — **debe existir antes del deploy**, si no el
  endpoint `/api/admin/cache/purge` responde 503 (fail-safe) y `post_deploy.sh`
  falla en el paso (a).
- Resto de env vars sin tocar.

## Rollback

Vía panel Emergent · botón "Rollback" a checkpoint anterior. El endpoint
`/api/admin/cache/purge` es aditivo (nuevo router), no reemplaza nada: el
rollback no requiere cleanup adicional del cache (los `_id` legacy en Mongo
siguen siendo compatibles con el layout pre-022).

## Notas para el usuario

- El fallback legacy `finances.assessment.verdict` fue **retirado** en 022b.
  Si Intel Prod aún no emite `opportunity.thesis.narrative` para algún CIF,
  ese CIF verá "Información en preparación · Tesis de oportunidad" (R15
  estricto). No es un bug — es el comportamiento intencional post-canon CF.
- La pestaña **Comparativa** sigue stashed en
  `/tmp/wip_comparativa_20260813/comparativa_wip.diff` (no incluida en este bundle).
