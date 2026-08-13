# scripts/

Utilidades operativas para arroba.com. No forman parte del bundle de la app; se
ejecutan a mano contra Prod tras eventos concretos (deploy, incidentes).

## `post_deploy.sh` (HARDENING-005 · 2026-08-13)

Orquesta el flujo post-deploy manual en un solo comando:

1. **Purga selectiva** del `intelligence_cache` (`{"engine":"ficha"}` via
   `POST /api/admin/cache/purge` protegido por `X-Admin-Token`).
2. **Smoke test** de 5 checks contra `https://beta.arroba.com`:
   - `#1` backend `/api/health` responde `status:ok`.
   - `#2` `/api/companies/{CIF}/ficha` anon devuelve HTTP 200 y `finances:null` (DPD).
   - `#3` `identity.legal_name` presente en el payload anon.
   - `#4` `/api/openapi.json` expone `/api/admin/cache/purge` (verifica que
     HARDENING-004 quedó registrado tras el deploy).
   - `#5` frontend `/es/empresa-f01/{CIF}` responde HTTP 200.
3. **Resumen** OK/FAIL por check con colores.
4. **Exit code 1** si CUALQUIER check falla (útil para CI/panel Emergent).

### Uso

```bash
export ARROBA_ADMIN_TOKEN='<token-del-panel-emergent>'
bash scripts/post_deploy.sh
```

### Overrides opcionales

| Variable            | Default                     | Uso                                  |
|:--------------------|:----------------------------|:-------------------------------------|
| `ARROBA_BASE_URL`   | `https://beta.arroba.com`   | Apunta a otro entorno (staging, dev) |
| `SMOKE_CIF`         | `B28184687`  (Servier)      | CIF de referencia para el smoke      |
| `SMOKE_TIMEOUT_S`   | `20`                        | Timeout de cada curl                 |

### Idempotencia

- La purga sobre cache vacío es no-op (`deleted:0`).
- Los 5 checks son read-only (excepto la purga inicial).
- Seguro re-ejecutar tras un fallo transitorio.

### Secuencia recomendada de deploy

```
1. Sync `ARROBA_ADMIN_TOKEN` en panel Emergent Prod.
2. Deploy del bundle.
3. bash scripts/post_deploy.sh
4. Verificar en UI: Resumen + Tips + srcdots + Propiedad + Signals con datos reales.
```
