# Auth testing playbook — ARROBA Ficha F01

## Pre-flight
1. Ensure backend is up: `curl http://localhost:8001/health` → 200 `{"status":"ok"}`.
2. Read credentials from `/app/memory/test_credentials.md` (email + password + cookie contract).
3. Confirmar que la ficha objetivo requiere sesión: `curl -sI http://localhost:8001/api/companies/B28184687/resolve` → 401 `no_session` (comportamiento esperado sin cookie).

## Auth contract (verificado 2026-08-09T15:57Z)
- **Login**: `POST /api/auth/login` · body `{email, password}` · 200 → `Set-Cookie: arroba_session=sess_...; HttpOnly; Max-Age=604800; Path=/; SameSite=lax; Secure` (Secure sólo en HTTPS).
- **Verify**: `GET /api/auth/me` con cookie → 200 `{user:{...}, memberships:[...]}`; sin cookie → 401 `no_session`.
- **Cookie name**: `arroba_session`.

## Login flow for Playwright

### Preferred: API-driven login + storageState
```javascript
// Paso 1: obtener la cookie vía API
const loginRes = await request.post(
  'https://musing-hellman-9.preview.emergentagent.com/api/auth/login',
  { data: { email: 'test.arroba+neo@arroba.com', password: '<from test_credentials.md>' } }
);
if (loginRes.status() !== 200) throw new Error(`login failed: ${loginRes.status()}`);

// Paso 2: extraer arroba_session del set-cookie
const setCookie = loginRes.headers()['set-cookie']; // string o array de strings
const match = /arroba_session=([^;]+)/.exec(Array.isArray(setCookie) ? setCookie.join('\n') : setCookie);
const sessionValue = match[1];

// Paso 3: inyectar en el contexto Playwright
await context.addCookies([{
  name: 'arroba_session',
  value: sessionValue,
  domain: 'musing-hellman-9.preview.emergentagent.com',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'Lax'
}]);

// Paso 4: navegar a la ficha
await page.goto(
  'https://musing-hellman-9.preview.emergentagent.com/es/empresa-f01/B28184687',
  { waitUntil: 'networkidle', timeout: 60000 }
);
```

### Fallback: UI login
```javascript
await page.goto('https://musing-hellman-9.preview.emergentagent.com/es/login');
await page.fill('input[type="email"]', 'test.arroba+neo@arroba.com');
await page.fill('input[type="password"]', '<from test_credentials.md>');
await page.click('button[type="submit"]');
await page.waitForLoadState('networkidle', { timeout: 15000 });
// Después navegar a la ficha
await page.goto('https://musing-hellman-9.preview.emergentagent.com/es/empresa-f01/B28184687');
```

## Verification (obligatorio antes de correr TCs)
1. Después de inyectar la cookie, navegar a `/es/empresa-f01/B28184687`.
2. Confirmar que la URL NO redirige a `/es/login` (RequireAuth pasaría).
3. Confirmar que aparecen elementos de la ficha (título "LABORATORIOS SERVIER" o secciones Finanzas/Valoración).
4. Si redirige a `/login`, la cookie NO está pegada correctamente. Revisar domain, path, sameSite (Lax vs None) y secure.

## Caveats para la Fase H
- **Ráfaga de fetch al 1er render**: el frontend hace SWR en paralelo sobre `/api/companies/{cif}/{identity,financial-analysis,valuation,signals,buyers,opportunities}`. El origin `intel.arroba.com` es sensible a ráfagas y puede devolver 520 en algunos endpoints en el primer render; SWR revalida y suelen aparecer OK a los ~10-15s. Recomendación: `await page.waitForTimeout(15000)` tras la primera carga antes de capturar, para dejar que las secciones estabilicen.
- **CIF canónico Fase H**: `B28184687` (LABORATORIOS SERVIER, `master_id=mc_36c100bcee4a`). Es el único de los 5 CIFs baseline que tiene datos reales en el cerebro.
- **Buyers count=0**: la sección "Compradores" mostrará `UnavailableBlock` (regla R15). Es comportamiento esperado, NO es bug.
- **Identity con campos null**: el cerebro devuelve la mayoría de campos identity (legal_name, cnae_code, provincia, location, size) como `null`. El nombre de la empresa se recupera desde `/financial-analysis`. Header/Perfil (F0.1) puede mostrar campos vacíos legítimamente.

## Notas de dominio de la cookie para preview alternativos
- Si Playwright usa el otro preview URL (`bda5adf2-2809-4e4d-80da-4a47b994f2fe.preview.emergentagent.com`), cambiar el `domain` al inyectar la cookie.
- La cookie se emite bound al host del request de login. Si haces login vía `musing-hellman-9...` y navegas a `bda5adf2-...`, la cookie NO cruza (dominios distintos).
