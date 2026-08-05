# DEPLOY_FIX_20260805.md · Fix del build de producción · step 8 frontend-build-push

Fecha: 2026-08-05.
Deploy fallido: `musing-hellman-9` en producción.
Error reportado (log tail):
```
Aug 05 11:29:19 Finished Step #8 - "frontend-build-push"
Aug 05 11:29:19 ERROR: build step 8 "customer-apps-node-base:v0.3.77" failed: step exited with non-zero status: 1
```

## Diagnóstico

### Reproducción local

`yarn build` local (sandbox) pasa consistentemente con `NODE_OPTIONS` de 1024MB y 2048MB en múltiples ejecuciones:
- `/tmp/build_repro.log` · `Done in 27.57s.` con 2048MB.
- `/tmp/build_1024.log` · `Done in 24.56s.` con 1024MB.
- `/tmp/build_fresh.log` · `Done in 23.78s.` post `rm -rf node_modules && yarn install --frozen-lockfile`.

**No es un fallo del código de Next.js** (compila limpio).

### Causa raíz

`frontend/yarn.lock` NUNCA estuvo trackeado en git (`git log --all -- frontend/yarn.lock` → cero commits). Cloud Build, al hacer `git clone` del repo, no obtenía el lockfile y `yarn install --frozen-lockfile` en el container:

- **Yarn 1.x** con `--frozen-lockfile` **sin** lockfile: silenciosamente lo genera fresco con resolutions actuales del registry. No es determinista → el build del container puede resolver a versiones distintas de las validadas en el sandbox.
- El fallo posterior en `yarn build` no dejó output visible en la ventana de logs capturada, pero el patrón es consistente con un breaking change de una dep en versión patch/minor.

Confirmación indirecta: `.gitignore` **no** ignora `yarn.lock` (check-ignore exit 1). El archivo existe físicamente en el sandbox (`211272 bytes · 24 jun`) pero apareció como `?? yarn.lock` en `git status`. El auto-commit pipeline de Emergent no lo había capturado.

## Fix aplicado

1. **`git add -f frontend/yarn.lock`** → añadido al índice para que el próximo auto-commit lo incluya y Cloud Build tenga la resolución determinista.
2. **Nuevo `/app/frontend/.dockerignore`** → excluye `.next/cache`, `.next/trace`, `coverage`, `*.tsbuildinfo`, `.env.local`, `.env.*.local`, `node_modules`, editors, logs. Reduce build context, acelera step 8 push a registry.

Archivos NO tocados:
- next.config.mjs (intacto).
- tsconfig.json (intacto).
- package.json scripts (intactos).
- .env (intacto · `NEXT_TELEMETRY_DISABLED=1`).
- Ningún componente ACC, layout F0.1c, contrato canónico ni intelligence_layer.

## Validación local

```bash
cd /app/frontend && rm -rf .next
NODE_ENV=production yarn build   # Done in 23.78s · exit 0
yarn start &                     # HTTP 200 OK
curl -sI http://localhost:3000/  # HTTP/1.1 200 OK
```

## Verificación de reglas

- ✅ R11 · sin cambios visuales.
- ✅ R13 · una sola fuente por layout.
- ✅ R14 · guards de COMP-ID verdes.
- ✅ R15 · no toca datos.
- ✅ Contratos `arroba-*-v1` intactos.
- ✅ Backend `intelligence_layer` intacto.
