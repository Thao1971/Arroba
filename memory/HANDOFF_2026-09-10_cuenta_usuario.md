# Handoff — Cuenta de Usuario (Perfil #9 + Ajustes #8)

**Fecha inicial**: 2026-09-10
**Fecha integración en pod**: 2026-09-11
**Status**: 🟢 **Integrado en este pod el 2026-09-11 sobre HEAD `401c5fa` (nuevo SHA: `19b42b7`).**
**Owner del cambio**: Daniel (implementación vía Claude/Cowork sobre checkout Mac local) — integrado en pod por E1.
**Verificado**: 8 checks OK, baselines pytest 327/37 y vitest 257/1 preservados, backend no tocado.

## Rutas ahora presentes en el pod

Estas rutas ya viven en el pod tras el commit `19b42b7`. Cualquier futura modificación se hace normalmente aquí.

- `frontend/src/app/[locale]/(authenticated)/perfil/page.tsx`
- `frontend/src/app/[locale]/(authenticated)/ajustes/page.tsx`
- `frontend/src/components/account/` (10 componentes):
  - `IdentityCard.tsx`
  - `ProfileCompleteness.tsx`
  - `CriteriaThesis.tsx`
  - `AccountSecurity.tsx`
  - `LanguageTheme.tsx`
  - `NotificationPreferences.tsx`
  - `OrganizationTeam.tsx`
  - `PlanBilling.tsx`
  - `PrivacyData.tsx`
  - `DangerZone.tsx`
- `frontend/src/lib/api/types.ts` — copia directa (aditivo puro): `UpdateMePayload`, `InvitationStatus`, `InvitationPublic`, `InvitePayload`.
- `frontend/src/lib/api/client.ts` — MERGE QUIRÚRGICO (ver "Hallazgos del merge"): `users.updateMe`, `organizations.members`, `organizations.invite`.

## Spec canónica

`memory/sources/cuenta_v1/ACC_CUENTA_v0.1.md` (v0.2 "Implementado" — copiada del ZIP tal cual).

## Estado real de cada componente (R15 honesto)

**Real y cableado** (endpoints existentes en backend, solo faltaba UI):
- **IdentityCard** → `PATCH /users/me` vía `apiClient.users.updateMe()`
- **ProfileCompleteness** → derivado de watchlist + membership + mandatos activos
- **CriteriaThesis** → reutiliza sistema de mandatos existente (`apiClient.mandates.listMine`)
- **LanguageTheme** → reutiliza `useTheme` / `<ThemeSwitcher />` + toggle de locale del Sidebar
- **OrganizationTeam** → `GET /organizations/{id}/members` + `POST /organizations/{id}/invitations` (validación server-side: `role_in_org` owner|admin)

**Parcial**:
- **AccountSecurity** → solo `logout` es real. Cambio de contraseña y sesiones activas mostrados como "Próximamente" (sin endpoint backend).

**"Próximamente" honesto** (sin endpoint backend disponible):
- **NotificationPreferences**
- **PlanBilling** (Stripe solo tiene stub `/api/billing/health`)
- **PrivacyData**
- **DangerZone** (enlaza a `mailto:soporte@arroba.com` en vez de simular borrado)

## Hallazgos del merge

### 1. `client.ts` del ZIP eliminaba `.suggest()` — regresión evitada

El `client.ts` del ZIP no contenía `apiClient.companies.suggest()` ni el import de `SuggestItem` (feature de la BATCH Beta 2026-09-09, que no estaba en el checkout de Daniel).

**Consumidor activo:** `frontend/src/app/[locale]/(authenticated)/resultados/page.tsx:688` (`await apiClient.companies.suggest(query, 8)`) + import del tipo `SuggestItem` en las líneas 45 y 348.

**Acción:** merge quirúrgico en vez de copia directa. Se aplicaron solo los 3 bloques nuevos (import de tipos + 2 métodos en `organizations` + `users.updateMe`). Se preservó intacto `.suggest()` y todo `marketMap.*` (Home ronda 2).

### 2. `types.ts` — copia directa segura

El `diff` mostró **solo `+++`** (aditivo puro). Se copió el fichero completo del ZIP sin riesgo.

### 3. 10 componentes + 2 pages — copia literal

Ningún componente consume APIs fantasma. Grep previo confirmó que todos los `apiClient.X.Y` invocados (`users.updateMe`, `organizations.members`/`invite`, `mandates.listMine`) existen tras el merge. Imports de `@/components/ds`, `@/lib/theme`, `@/lib/workspaces/useActiveOrg`, `@/contexts/auth-context`, `@/lib/api/types` (`Role`, `OrgRole`, `MembershipPublic`) todos verificados como existentes en el pod.

### 4. Backend NO tocado

Los 3 endpoints ya existían en Beta (`PATCH /users/me`, `GET /organizations/{id}/members`, `POST /organizations/{id}/invitations`). Cero cambios en Python. Smoke curls devuelven `401 no_session` (aceptable: rutas responden y exigen auth).

## Verificación pre-handoff (por parte de Daniel, sobre su Mac)

- `tsc --noEmit` limpio
- `eslint` limpio
- Sin regresiones (`org-switcher.test.tsx` verde)

## Verificación post-integración en pod (por parte de E1, 2026-09-11)

- `yarn tsc --noEmit` → 0 errores (`Done in 5.97s`)
- `yarn eslint` (14 ficheros del pack) → 0 warnings / 0 errores
- `python3 -m py_compile backend/src/modules/companies/router.py` → OK
- `pytest --tb=line -q` → **327 passed / 37 legacy failed** (baseline sagrado exacto)
- `yarn vitest run` → **257 passed / 1 legacy failed** (`r14_comp_id_declaration_guard.test.ts`, baseline sagrado exacto)
- `sudo supervisorctl restart backend frontend` → ambos RUNNING (pid 3559 / 3570)
- Smoke curls:
  - `PATCH /api/users/me` → `HTTP 401 {"detail":"no_session","code":"no_session"}` (aceptable)
  - `GET /api/organizations/{id}/members` → `HTTP 401 {"detail":"no_session","code":"no_session"}` (aceptable)
- Commit local: `19b42b7` sobre `401c5fa`. **NO push, NO deploy** (regla vigente).

## Hallazgo pendiente (para futuro paquete)

Las invitaciones a organización se pueden crear (endpoint validado server-side) **pero**:
- No existe página `/invitaciones/[token]` para aceptarlas.
- No hay servicio de email que las envíe.

El propio componente `OrganizationTeam.tsx` deja esto explícito (no finge que el flujo esté completo). Candidato a próximo paquete si Daniel lo prioriza.

## Instrucción para próximos agentes en este pod

**El paquete está integrado.** Se puede modificar cualquier fichero de la lista de rutas de forma habitual. Coordinar con Daniel cambios estructurales si acaso, pero ya no hay riesgo de pisar trabajo local (la reconciliación se hizo en este mismo pod).
