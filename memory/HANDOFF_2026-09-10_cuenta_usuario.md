# Handoff — Cuenta de Usuario (Perfil #9 + Ajustes #8)

**Fecha**: 2026-09-10
**Owner del cambio**: Daniel (implementación vía Claude/Cowork sobre checkout Mac local)
**Origen**: NO se implementó desde este pod. Este pod (Beta-7926 en `musing-hellman-9`) NO tiene los cambios aplicados.
**HEAD de este pod al momento del handoff**: `401c5fa` (Home nueva ronda 2)

## Rutas "ajenas" a este pod hasta reconciliar

**No tocar desde este pod sin coordinar con Daniel primero** — riesgo de pisar el trabajo hecho en su Mac local:

- `frontend/src/app/[locale]/(authenticated)/perfil/page.tsx`
- `frontend/src/app/[locale]/(authenticated)/ajustes/page.tsx`
- `frontend/src/components/account/` (10 componentes nuevos):
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
- `frontend/src/lib/api/types.ts` — nuevos: `UpdateMePayload`, `InvitationPublic`, `InvitePayload`
- `frontend/src/lib/api/client.ts` — nuevos métodos: `users.updateMe`, `organizations.members`, `organizations.invite`

## Spec canónica

`memory/sources/cuenta_v1/ACC_CUENTA_v0.1.md` (elevado a v0.2 "Implementado" por Daniel).

## Estado real de cada componente (R15 honesto)

**Real y cableado** (endpoints existentes en backend, solo faltaba UI):
- IdentityCard → PATCH `/users/me`
- ProfileCompleteness
- CriteriaThesis → reutiliza sistema de mandatos existente (`/oportunidades/mandato/*`)
- LanguageTheme → reutiliza `useTheme`/`ThemeSwitcher` + toggle de locale del Sidebar
- OrganizationTeam → GET members + POST invite (validación server-side: `role_in_org` owner|admin)

**Parcial**:
- AccountSecurity → solo logout es real. Cambio de contraseña y sesiones activas mostrados como "Próximamente" (sin endpoint backend).

**"Próximamente" honesto** (sin endpoint backend disponible):
- NotificationPreferences
- PlanBilling (Stripe solo tiene stub `/api/billing/health`)
- PrivacyData
- DangerZone (enlaza a mailto soporte en vez de simular borrado)

## Verificación pre-handoff (por parte de Daniel)

- `tsc --noEmit` limpio
- `eslint` limpio
- Sin regresiones (`org-switcher.test.tsx` verde)

## Hallazgo pendiente (para futuro paquete)

Las invitaciones a organización se pueden crear (endpoint validado server-side) **pero**:
- No existe página `/invitaciones/[token]` para aceptarlas
- No hay servicio de email que las envíe

El propio componente `OrganizationTeam.tsx` deja esto explícito (no finge que el flujo esté completo). Candidato a próximo paquete si Daniel lo prioriza.

## Instrucción para próximos agentes en este pod

**No intentar aplicar diffs de Cuenta de Usuario desde este pod.** La reconciliación la hace Daniel manualmente desde su Mac local cuando toque. Si un futuro paquete toca las rutas listadas arriba, PARAR y preguntar antes.
