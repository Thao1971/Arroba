# Credenciales de Test — arroba.com (E0.3)

> **Reset E0**: el backend nuevo (FastAPI monolito modular) NO importa datos del
> repo legacy. Las cuentas que aparecían en versiones anteriores de este archivo
> (admin@arroba.com, sellers/buyers demo) viven solo en el código legacy en
> `/app/_legacy/` y NO existen en la base de datos `arroba_com` del backend E0.3.

## Estado real del backend E0.3

- **No hay seed automático de admin** en esta etapa. La spec de E0.3 explícitamente
  acota a auth + users + orgs + billing health, sin pre-seed de usuarios.
- Cualquier test que necesite un usuario lo crea via `POST /api/auth/register`.

## Cómo autenticar para tests

### Crear un usuario nuevo
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt \
  -d '{"email":"tester@arrobatest.com","password":"Test1234!","full_name":"Tester"}'
# → 201, cookie httpOnly `arroba_session` en /tmp/cookies.txt
```

### Login con usuario existente
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt \
  -d '{"email":"tester@arrobatest.com","password":"Test1234!"}'
# → 200
```

### Usar sesión
```bash
curl -b /tmp/cookies.txt http://localhost:8001/api/auth/me
# → 200, { user: {...}, memberships: [...] }
```

### Logout
```bash
curl -X POST -b /tmp/cookies.txt http://localhost:8001/api/auth/logout
```

## Usuarios de smoke test ya creados (E0.3 + E0.3.1)

Durante la verificación quedaron persistidos en MongoDB usuarios funcionales
que el tester puede reusar para pruebas exploratorias:

| Email | Password | Role | Notas |
|---|---|---|---|
| `smoke_e0_3@example.com` | `SmokeTest123!` | `subscriber` | Legacy E0.3 (pre-fix). Tiene `google_id: null` en doc por el bug. Existe pero NO crear más con dominio `@example.com`. |
| `smoke_e031_1@arrobatest.com` | `Smoke123!` | `subscriber` | Post-fix E0.3.1. Sin `google_id` en doc. |
| `smoke_e031_2@arrobatest.com` | `Smoke123!` | `subscriber` | Post-fix E0.3.1. |
| `smoke_e031_3@arrobatest.com` | `Smoke123!` | `subscriber` | Post-fix E0.3.1. |

## Roles disponibles (enum `Role`)

`anonymous`, `subscriber` (default al registrar), `corporate`, `investor`, `advisor`, `admin`.

E0.3 no expone endpoint para cambiar de rol; se hará en E0.4+.

## Convenciones internas

- Cookie de sesión: `arroba_session` (httpOnly, SameSite=Lax, `max_age=7d`).
- Header de request tracking: `X-Request-ID` (auto-generado si no se envía).
- Header en errores: response `code` estable (`invalid_credentials`,
  `email_already_registered`, `invitation_email_mismatch`, etc.).
