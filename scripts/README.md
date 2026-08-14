# scripts/

Utilidades operativas para arroba.com. No forman parte del bundle de la app; se
ejecutan a mano contra Prod tras eventos concretos (deploy, incidentes).

## `post_deploy.sh` (HARDENING-005 · 2026-08-13 · HARDENING-028 · 2026-08-14)

Orquesta el flujo post-deploy manual en un solo comando:

0. **[HARDENING-028] Rebuild+restart local del frontend (dev pod)**: `yarn build`
   fresco en `/app/frontend` + `sudo supervisorctl restart frontend`. Previene el
   patrón "next-server crash-loop tras `yarn build`" (Next.js `next start` cachea
   el manifest en memoria del proceso Node y no hot-reloadea con nuevos builds
   sin restart). Idempotente; saltable con `SKIP_LOCAL_REBUILD=1`.
1. **Purga selectiva** del `intelligence_cache` (`{"engine":"ficha"}` via
   `POST /api/admin/cache/purge` protegido por `X-Admin-Token`).
2. **Smoke test** de 5 checks contra `https://beta.arroba.com`:
   - `#1` backend `/api/health` responde `status:ok`.
   - `#2` `/api/companies/{CIF}/ficha` anon devuelve HTTP 200 y `finances:null` (DPD).
   - `#3` `identity.legal_name` presente en el payload anon.
   - `#4` `/api/openapi.json` expone `/api/admin/cache/purge` (verifica que
     HARDENING-004 quedó registrado tras el deploy).
   - `#5` frontend `/es/empresa-f01/{CIF}` responde HTTP 200.
3. **[HARDENING-028] Smoke retry backoff** contra `/api/platform/stats` con
   reintentos exponenciales (5s → 10s → 20s → 40s → 80s → 160s ≈ 5 min total).
   Detecta la ventana de crash-loop de arranque del container Prod tras deploy
   antes de que un usuario lo vea. Sale con `exit 1` si tras 6 intentos sigue
   en 5xx.
4. **Resumen** OK/FAIL por check con colores.
5. **Exit code 1** si CUALQUIER check falla (útil para CI/panel Emergent).

### Uso

```bash
export ARROBA_ADMIN_TOKEN='<token-del-panel-emergent>'
bash scripts/post_deploy.sh
```

### Overrides opcionales

| Variable             | Default                     | Uso                                                        |
|:---------------------|:----------------------------|:-----------------------------------------------------------|
| `ARROBA_BASE_URL`    | `https://beta.arroba.com`   | Apunta a otro entorno (staging, dev)                       |
| `SMOKE_CIF`          | `B28184687`  (Servier)      | CIF de referencia para el smoke                            |
| `SMOKE_TIMEOUT_S`    | `20`                        | Timeout de cada curl                                       |
| `SKIP_LOCAL_REBUILD` | `0`                         | Pon a `1` para saltar el Paso 0 (rebuild + restart local)  |

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
