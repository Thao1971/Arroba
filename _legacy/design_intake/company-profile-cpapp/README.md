# Legacy · Company Profile (CPApp) — layout 1-col deprecated

**Motivo del movimiento:** Regresión arquitectónica detectada durante Hito 1 de B.6.f (2026-02-06). Estos archivos son referencias de diseño del **layout LEGACY de 1 columna** para la ficha de empresa. Quedan explícitamente deprecated por la regla canónica **R13 · Source of Truth única por pantalla**.

## Regla R13 (recordatorio)

> Solo puede existir UNA Source of Truth por cada pantalla canónica de arroba.com.
> Cuando una pantalla queda sustituida, la anterior se **mueve** a `/app/_legacy/` o se elimina.
> Ningún mockup, componente o HTML obsoleto puede permanecer en el árbol activo.

## Fecha de movimiento

`2026-02-06` (session B.6.f · Hito 1)

## Ruta canónica de reemplazo

| Componente legacy | Ruta canónica activa (reemplazo) |
|---|---|
| `cp-app.jsx` (CPApp shell) | `/app/_design_intake/company/ce-app.jsx` (referencia histórica canónica) |
| `cp-app.jsx` (implementación viva) | `/app/frontend/src/components/mockups/entity-canonical/CanonicalEntityMockupClient.tsx` |
| `Company Profile.html` (mockup HTML) | `/app/_design_intake/Empresa.html` |
| `cp-charts.jsx`, `cp-profile.jsx`, `cp-sidebar.jsx`, `cp-journey.jsx`, `cp-data.js` | Sustituidos por sub-componentes canónicos en `ce-*.jsx` y por los blocks canónicos del DS (`components/blocks/*`, `components/ds/*`) |

## Archivos preservados aquí

- `cp-app.jsx` — App shell del layout 1-col legacy. Define `CPApp` (single column, sin nav lateral ni deal panel).
- `cp-charts.jsx` — Charts SVG del legacy.
- `cp-data.js` — Datos mock del legacy.
- `cp-journey.jsx` — Decision journey del legacy.
- `cp-profile.jsx` — Main content sections del legacy.
- `cp-sidebar.jsx` — Right sidebar + agent del legacy.
- `Company Profile.html` — Mockup HTML del legacy (cargaba `company/cp-app.jsx`).

## Prohibición explícita de reintroducción

- Estos archivos NO deben ser usados como referencia para nuevo código.
- NO deben servir de inspiración visual.
- NO deben funcionar como mockup activo en `/mockups/*`.
- NO deben aparecer en ningún `import` del árbol activo (`/app/frontend/src`, `/app/backend`).

**Guard automatizado** en `/app/frontend/src/__tests__/canonical_screens_guard.test.ts` — falla la suite si alguien reintroduce un patrón legacy (`CPApp`, `cp-app`, `Company Profile`) en el árbol activo.

## Referencias intra-mockups no movidas (transparencia)

Existen 11 archivos en `/app/_design_intake/{home,sector,analiza,mapa,search,investor,valora}/` (y `Matching.html`) que contienen `href="Company Profile.html"` como enlaces entre mockups estáticos históricos. **Estos archivos NO son código activo** del producto arroba.com — son mockups de OTRAS pantallas (Home, Sector, Analiza, etc.), no de ficha empresa. Sus enlaces internos apuntan ahora a un archivo movido, pero ese impacto se limita a la navegación entre mockups estáticos abiertos en un browser local. No impacta al build ni al runtime del producto.

Si en el futuro esas otras pantallas se rediseñen y sus mockups históricos también se muevan a `/app/_legacy/`, este README debe actualizarse.

## Verificación

```bash
# Ningún import activo apunta aquí:
grep -rn "CPApp\|cp-app\|Company Profile" /app/frontend/src /app/backend/src /app/backend/tests /app/memory
#  → cero hits

# Los archivos están efectivamente aquí:
ls /app/_legacy/design_intake/company-profile-cpapp/
```
