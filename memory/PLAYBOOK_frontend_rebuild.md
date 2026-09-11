# Playbook · Rebuild del frontend tras cambios en `frontend/src/`

**Contexto**: El frontend del pod arranca con `next start` (production build cacheado en `.next/`), NO con `next dev` / hot reload. Por tanto, cualquier cambio en `frontend/src/**/*.tsx|.ts|.css` NO se refleja en la preview hasta que se reconstruya el build.

**Ritual obligatorio** tras cualquier commit que toque `frontend/src/`:

```bash
cd /app/frontend
yarn build   # ~20 s típicamente
sudo supervisorctl restart frontend
sudo supervisorctl status frontend
```

**Verificar**:
- `.next/BUILD_ID` debe reflejar timestamp reciente: `ls -la /app/frontend/.next/BUILD_ID`
- El proceso frontend debe tener un `pid` nuevo tras el restart
- Grep contra bundles servidos (no contra `.next/cache/webpack/*`) para confirmar que el código nuevo se sirve:
  ```
  grep -rl "SOME_NEW_STRING" /app/frontend/.next/server /app/frontend/.next/static 2>/dev/null | head -5
  ```

**Cuándo NO hace falta**:
- Cambios que solo tocan `backend/`
- Cambios que solo tocan `/app/memory/` o docs
- Cambios en ficheros de test que no van al bundle (`*.test.ts`, `*.spec.ts`)

**Regla de oro**: si un check `yarn build` falla, PARAR. NO reiniciar con build fallido — dejaría al frontend sin sitio que servir.

**Historia**: Detectado el 2026-09-11 tras la integración de Cuenta de Usuario (`19b42b7`). El paquete pasó los 8 checks estándar (tsc, eslint, vitest, pytest, supervisor restart, curls) pero la preview seguía sirviendo el placeholder viejo porque `supervisorctl restart frontend` reinicia el proceso sin reconstruir `.next/`. Solución: añadir `yarn build` como paso previo obligatorio.

**Impacto retroactivo**: Los paquetes anteriores (`460973b` click-to-expand, `c863782` fixes buscador, `401c5fa` Home nueva ronda 2, `19b42b7` Cuenta de Usuario) quedaron todos servidos correctos tras el `yarn build` completo del 2026-09-11 07:42 (build id `guzd0u-DmXXa42e53PCrF`).
