# ARROBA Test Credentials (disposable — smoke Fase H)

## Auth type
email_password_cookie

## Base URL
- Backend (para curl S2S): http://localhost:8001
- Preview (para browser tests): https://musing-hellman-9.preview.emergentagent.com
- Preview alt (UUID-based): https://bda5adf2-2809-4e4d-80da-4a47b994f2fe.preview.emergentagent.com

## Endpoints
- Login: POST /api/auth/login
  - Body: { "email": "...", "password": "..." }
  - Content-Type: application/json
  - Response 200: { "user": {...}, "session_expires_at": "ISO-8601" }
- Register: POST /api/auth/register
  - Body: { "email": "...", "password": "..." (min 8 chars), "full_name": "..." (optional) }
  - Response 201: same shape as login
- Me/verify: GET /api/auth/me
  - Response 200: { "user": {...}, "memberships": [...] }
  - Response 401 sin sesión: { "detail": "no_session", "code": "no_session" }
- Cookie name: arroba_session
- Cookie attrs local (HTTP): HttpOnly=Y, SameSite=lax, Secure=N, Path=/, Max-Age=604800 (7d)
- Cookie attrs preview (HTTPS): HttpOnly=Y, SameSite=lax, Secure=Y, Path=/, Max-Age=604800 (7d)

## Test user
- Email: test.arroba+neo@arroba.com
- Password: YofQgBFAo1wuC0d#
- user_id: user_8bcce445ac69
- Role: subscriber
- email_verified: false (irrelevante para sesión: la cookie se emite en register/login sin verificación)
- session_expires_at: rolling +7d desde el último login

## How Playwright should inject the cookie
### Option A (preferred): API login + storageState
```js
const loginRes = await request.post('https://musing-hellman-9.preview.emergentagent.com/api/auth/login', {
  data: { email: 'test.arroba+neo@arroba.com', password: 'YofQgBFAo1wuC0d#' }
});
// La cookie viene en loginRes.headers()['set-cookie']. Extraerla, luego:
await context.addCookies([{
  name: 'arroba_session',
  value: '<sess_...>',
  domain: 'musing-hellman-9.preview.emergentagent.com',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'Lax'
}]);
await page.goto('https://musing-hellman-9.preview.emergentagent.com/es/empresa-f01/B28184687');
```

### Option B (fallback): UI login
Navegar a `/es/login`, rellenar email + password con selectors `input[name="email"]` (o `input[type="email"]`) y `input[name="password"]` (o `input[type="password"]`), submit, esperar redirección, luego navegar a la ficha.

## Notes
- Usuario desechable creado el 2026-08-09T15:58:33Z. No usar en prod. No usar para nada más allá del smoke Fase H.
- RequireAuth del frontend valida sesión llamando a GET /api/auth/me. Si devuelve 401 no_session, redirige a /login.
- La cookie `__cf_bm` que aparece en Set-Cookie es de Cloudflare Bot Management (no es de la app; ignorar).
- Para debug: `curl -b cookies.jar http://localhost:8001/api/auth/me` debe devolver 200 con user.email == "test.arroba+neo@arroba.com".
