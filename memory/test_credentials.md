# Credenciales de Test — arroba.com (E0.4)

> **Reset E0**: el backend nuevo (FastAPI monolito modular) NO importa datos del
> repo legacy. Las cuentas que aparecían en versiones anteriores de este archivo
> (admin@arroba.com, sellers/buyers demo) viven solo en el código legacy en
> `/app/_legacy/` y NO existen en la base de datos `arroba_com` del backend E0.

## Cuenta admin oficial (E0.4)

| Email | Password | Role | Notas |
|---|---|---|---|
| **`admin@arroba.dev`** | **`Admin1234!`** | `admin` | Bootstrap admin sembrado por `python scripts/seed_admin.py`. Idempotente; se puede re-ejecutar sin duplicar. |

### Cómo regenerar / restaurar el admin
```bash
cd /app/backend
python scripts/seed_admin.py
# → [seed_admin] created admin user (o "updated")
```

### Por qué un script y no un endpoint
E0.4 explícitamente **no expone endpoint público para promover usuarios a admin**.
Razón: requiere un admin para crear admins (chicken-and-egg). El primer admin se
siembra siempre por script. Endpoints de promoción admin-to-admin llegan en etapas
posteriores cuando ya exista un admin.

## Estado real del backend

- Auth + register + login + Emergent OAuth session exchange operativos.
- Cookies httpOnly con `Secure` automático cuando hay `X-Forwarded-Proto: https`.
- Roles disponibles (enum `Role`): `anonymous`, `subscriber` (default al registrar),
  `corporate`, `investor`, `advisor`, `admin`.
- Agency Tool adapter en **mock**; admin CRUD sobre `master_companies_mock`.

## Cómo autenticar para tests

### Crear un usuario nuevo (subscriber)
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt \
  -d '{"email":"tester@arrobatest.com","password":"Test1234!","full_name":"Tester"}'
# → 201, cookie httpOnly `arroba_session` en /tmp/cookies.txt
```

### Login con usuario existente (admin)
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt \
  -d '{"email":"admin@arroba.dev","password":"Admin1234!"}'
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
# 200 always (idempotent)
```

## Smoke con el adapter (necesita admin)

```bash
# 1) login admin
curl -X POST http://localhost:8001/api/auth/login -c /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arroba.dev","password":"Admin1234!"}'

# 2) crear master_company_mock
curl -X POST http://localhost:8001/api/admin/agency-tool/master-companies-mock \
  -b /tmp/cookies.txt -H "Content-Type: application/json" \
  -d '{"legal_name":"Acme Agency","cif":"B12345678","sector":"Performance"}'

# 3) consultar via endpoint público (devuelve X-Source: mock)
curl -i -b /tmp/cookies.txt http://localhost:8001/api/agency-tool/companies/{id}

# 4) status de adapters
curl -b /tmp/cookies.txt http://localhost:8001/api/agency-tool/status
```

## Usuarios de smoke test ya creados

Durante E0.3/E0.3.1 y E1.1 quedaron persistidos en MongoDB usuarios funcionales
que el tester puede reusar para pruebas exploratorias:

| Email | Password | Role | Notas |
|---|---|---|---|
| `smoke_e031_2@arrobatest.com` | `Smoke123!` | `subscriber` | Sin memberships → al login va a `/onboarding`. Útil para probar el journey conversacional. |
| `smoke_e031_3@arrobatest.com` | `Smoke123!` | `subscriber` | Idem. |

Los usuarios `e11-flow*-<timestamp>@arrobatest.com` creados por el smoke test de
E1.1 quedan persistidos y ya tienen `Grupo Olmedo Hoteles, S.L.` como org. Para
**limpiar** datos de smoke:

```bash
mongosh arroba_com --eval "db.users.deleteMany({email: /e11-flow/}); db.organizations.deleteMany({legal_name: /Grupo Olmedo/, created_by: {\$ne: 'user_174ea4693938'}}); db.memberships.deleteMany({user_id: {\$in: db.users.find({email: /e11-flow/},{_id:0,user_id:1}).map(u=>u.user_id)}})"
```

## Convenciones internas

- Cookie de sesión: `arroba_session` (httpOnly, SameSite=Lax, `max_age=7d`).
- `Secure` activado automáticamente cuando el request llega con `X-Forwarded-Proto: https`.
- Header de request tracking: `X-Request-ID` (auto-generado si no se envía).
- Header en errores: response `code` estable (`invalid_credentials`,
  `email_already_registered`, `invitation_email_mismatch`, `admin_required`,
  `master_company_not_found`, `master_company_duplicate_unique_field`, etc.).
- Header en respuestas del Agency Tool adapter: `X-Source: mock` (en E0.4) o `X-Source: real` (post-REQ-001).
