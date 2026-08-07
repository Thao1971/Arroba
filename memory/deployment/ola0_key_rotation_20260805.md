# Rotación de clave · Ola 0 · Flip a real

**Fecha (UTC)**: 2026-08-07T14:10:14Z
**Motivo**: HTTP 401 `{"detail":"Invalid API key"}` al hacer smoke test server-to-server contra el cerebro nuevo `https://intel.arroba.com` con la clave anterior. La clave anterior sólo era válida contra el cerebro `https://agencias.wearebudadvisors.com`.

**Acción**: rotación de `ARROBA_SERVICE_API_KEY_PRIMARY` en `/app/backend/.env`. La clave anterior queda invalidada localmente. La clave nueva se debe registrar en el proveedor del cerebro (intel.arroba.com) antes de reintentar smoke test.

**Clave nueva (registro interno · trazabilidad)**:
```
as_ace1afcc17a0901743f629b3cca64aa4314f433669
```

**Formato preservado**: prefijo `as_` + 42 hex chars (misma forma que la clave rotada, longitud 45).

**Servicios reiniciados**: backend (supervisor).

**Cambios env aplicados en esta rotación**: solo `ARROBA_SERVICE_API_KEY_PRIMARY`. `AGENCY_TOOL_BASE_URL`, `ENRICH_COMPANY_SOURCE`, `AGENCY_TOOL_MODE`, `INTELLIGENCE_COMPANY_V2_ENABLED` ya cambiados en el commit inicial de Ola 0.

**Estado**: pendiente de que el usuario registre la clave en `intel.arroba.com` (endpoint admin, R12 impide hacerlo desde Arroba).
