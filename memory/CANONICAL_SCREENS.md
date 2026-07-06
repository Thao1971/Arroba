# CANONICAL_SCREENS · Registro oficial de pantallas de arroba.com

> **Regla R13:** solo puede existir UNA Source of Truth por cada pantalla canónica.
> Cuando una pantalla queda sustituida, la anterior se **mueve** a `/app/_legacy/` o se elimina.
> Ningún mockup, componente o HTML obsoleto puede permanecer en el árbol activo.

Última actualización: `2026-02-06` (creado tras regresión R13 en Hito 1 de B.6.f).

Verificación automática: `/app/frontend/src/__tests__/canonical_screens_guard.test.ts` (guard de imports legacy).

**Referencias visuales canónicas:** ver `/app/memory/ARROBA_UI_VISUAL_REFERENCES.md` (v1). Registra las DOS referencias visuales separadas del producto (estructural = ficha de empresa · composer = Valora) y prohíbe explícitamente el layout antiguo de una columna. Debe respetarse en TODA implementación futura.

---

## Tabla 1 · Pantallas canónicas activas

| # | Pantalla | Source of Truth (ruta absoluta) | Estado | Última revisión |
|---|---|---|---|---|
| 1 | **Landing pública** | `/app/frontend/src/app/[locale]/(public)/page.tsx` | ✅ Activa | 2026-02-06 |
| 2 | **Login** | `/app/frontend/src/app/[locale]/(public)/login/page.tsx` | ✅ Activa | 2026-02-06 |
| 3 | **Registro** | `/app/frontend/src/app/[locale]/(public)/registro/page.tsx` | ✅ Activa | 2026-02-06 |
| 4 | **Recuperar contraseña** | `/app/frontend/src/app/[locale]/(public)/recuperar/page.tsx` | ✅ Activa | 2026-02-06 |
| 5 | **Home privada (Inicio)** | `/app/frontend/src/app/[locale]/(authenticated)/inicio/page.tsx` | ✅ Activa | 2026-02-06 |
| 6 | **Onboarding** | `/app/frontend/src/app/[locale]/(authenticated)/onboarding/page.tsx` | ✅ Activa | 2026-02-06 |
| 7 | **Organizaciones** | `/app/frontend/src/app/[locale]/(authenticated)/organizaciones/page.tsx` | ✅ Activa | 2026-02-06 |
| 8 | **Ajustes** | `/app/frontend/src/app/[locale]/(authenticated)/ajustes/page.tsx` | ✅ Activa | 2026-02-06 |
| 9 | **Perfil de usuario** | `/app/frontend/src/app/[locale]/(authenticated)/perfil/page.tsx` | ✅ Activa | 2026-02-06 |
| 10 | **Historial** | `/app/frontend/src/app/[locale]/(authenticated)/historial/page.tsx` | ✅ Activa | 2026-02-06 |
| 11 | **Workspace de empresa** | `/app/frontend/src/app/[locale]/(authenticated)/w/[workspace_id]/page.tsx` | ✅ Activa | 2026-02-06 |
| 12 | **Design System (admin · living)** | `/app/frontend/src/app/[locale]/(authenticated)/internal/design-system/page.tsx` | ✅ Activa | 2026-02-06 |
| 13 | **Ficha de empresa · mixed-access** (contenedor de datos) | `/app/frontend/src/app/[locale]/empresa/[cif]/page.tsx` + `/app/frontend/src/components/entity/CompanyPageClient.tsx` | ✅ Activa | 2026-02-06 |
| 14 | **Ficha de empresa · SoT visual R13** (layout canónico 3-col) | `/app/frontend/src/components/mockups/entity-canonical/CanonicalEntityMockupClient.tsx` | ✅ Activa · **inmutable** durante B.6.f | 2026-02-06 |

**Nota sobre la ficha de empresa (#13 y #14):**
- `#14` es la **SoT visual R13** — layout canónico 3-columnas (Header · Nav izquierda · Contenido central · Deal Panel derecho · Composer FAB). Cualquier evolución visual de la ficha empresa debe partir literalmente de este archivo.
- `#13` es la **SoT de datos** — orquestación SWR, publicación de `EntityContext`, gestión de watchlist/share, sección updates. Durante B.6.f evoluciona su contenido para consumir el `intelligence_layer` (`arroba-*-v1`) **dentro del layout canónico 3-col** de `#14`, sin rediseño del AppShell.

---

## Tabla 2 · Pantallas deprecated / legacy

| # | Pantalla / Componente | Ubicación actual | Motivo de deprecación | Reemplazo canónico | Fecha movimiento |
|---|---|---|---|---|---|
| L1 | **CPApp** (identifier) | `/app/_legacy/design_intake/company-profile-cpapp/cp-app.jsx` | Layout 1-col regresivo · R13 | `CanonicalEntityMockupClient.tsx` (#14) | 2026-02-06 |
| L2 | **cp-app.jsx** | `/app/_legacy/design_intake/company-profile-cpapp/cp-app.jsx` | idem | `ce-app.jsx` (referencia histórica canónica) + `CanonicalEntityMockupClient.tsx` | 2026-02-06 |
| L3 | **cp-charts.jsx** | `/app/_legacy/design_intake/company-profile-cpapp/cp-charts.jsx` | Charts SVG del layout 1-col legacy | Charts SVG inline canónicos en `CanonicalEntityMockupClient.tsx` + DS pattern §3.11 | 2026-02-06 |
| L4 | **cp-profile.jsx** | `/app/_legacy/design_intake/company-profile-cpapp/cp-profile.jsx` | Main content sections legacy | Sub-componentes canónicos en `ce-sections{1,2,3}.jsx` + blocks canónicos DS | 2026-02-06 |
| L5 | **cp-sidebar.jsx** | `/app/_legacy/design_intake/company-profile-cpapp/cp-sidebar.jsx` | Right sidebar + agent del legacy | `CanonicalDealPanel` + `CopilotDock` en árbol activo | 2026-02-06 |
| L6 | **cp-journey.jsx** | `/app/_legacy/design_intake/company-profile-cpapp/cp-journey.jsx` | Decision journey del legacy | Substituido por `EntityAdvisor` + Copilot Advisor canónicos | 2026-02-06 |
| L7 | **cp-data.js** | `/app/_legacy/design_intake/company-profile-cpapp/cp-data.js` | Datos mock del layout 1-col legacy | `ce-data.js` (canónico) + `intelligence_layer` proxy (`arroba-*-v1`) | 2026-02-06 |
| L8 | **Company Profile.html** | `/app/_legacy/design_intake/company-profile-cpapp/Company Profile.html` | Mockup HTML del layout 1-col legacy | `Empresa.html` (canónico en `_design_intake/`) + `CanonicalEntityMockupClient.tsx` | 2026-02-06 |

### Guard automático activo

`/app/frontend/src/__tests__/canonical_screens_guard.test.ts` verifica que ningún `.ts`/`.tsx` en `frontend/src/` importe o mencione los patrones L1-L8. Falla la suite Vitest si detecta violación.

Patrones bloqueados actualmente por el guard:
- `CPApp`
- `cp-app`
- `Company Profile` (identificador de mockup HTML)

Cualquier nueva pantalla añadida a Tabla 2 DEBE actualizar la constante `LEGACY_PATTERNS` en el guard **en el mismo commit** que mueva los archivos a `/app/_legacy/`.

---

## Pantallas cuya SoT queda pendiente identificar

Durante el inventario del 2026-02-06 no se encontró una SoT clara para las siguientes pantallas mencionadas en la hoja de ruta del producto pero aún no implementadas:

| Pantalla | Estado | Nota |
|---|---|---|
| **Oportunidades** (E1.9) | `<pendiente identificar>` | No existe `page.tsx` dedicada; mockup en `_design_intake/opportunity/`, `_design_intake/Oportunidad.html`, `_design_intake/Mis Oportunidades.html`. Definir SoT al iniciar E1.9. |
| **Ficha Sectorial** (E1.6) | `<pendiente identificar>` | Mockup histórico en `_design_intake/Ficha Sectorial.html` + `_design_intake/sector/*.jsx`. Definir SoT al iniciar E1.6. |
| **Valoración avanzada** (E1.8) | `<pendiente identificar>` | Mockup histórico en `_design_intake/Valoracion Avanzada.html`, `_design_intake/valora/*.jsx`, `_design_intake/Resultado Valoracion.html`. Definir SoT al iniciar E1.8. |
| **Advisor Mandatos** | `<pendiente identificar>` | Mockup histórico en `_design_intake/Advisor Mandatos.html`, `_design_intake/Mandato.html`. Definir SoT cuando se aborde. |
| **Compra-Venta / M&A Intelligence** | `<pendiente identificar>` | Mockups históricos en `_design_intake/Compra-Vende.html`, `_design_intake/M&A Intelligence.html`. Definir SoT cuando se aborde. |
| **Data Room** | `<pendiente identificar>` | Mockup histórico en `_design_intake/Data Room.html`. Definir SoT cuando se aborde. |
| **Investor Intelligence** | `<pendiente identificar>` | Mockups en `_design_intake/Investor Intelligence.html`, `_design_intake/investor/*.jsx`. Definir SoT cuando se aborde. |
| **Mapa Empresarial / Territorio** (E1.7) | `<pendiente identificar>` | Mockup en `_design_intake/Mapa Empresarial.html`, `_design_intake/mapa/*.jsx`, `_design_intake/Workspace Territorio.html`. Definir SoT al iniciar E1.7. |
| **Universal Search** | `<pendiente identificar>` | Mockup histórico en `_design_intake/Universal Search.html`, `_design_intake/search/*.jsx`. Se implementará embebido en el Composer del Copilot (Regla 1 · Sprint 1). Documentar SoT cuando se cierre esa decisión. |
| **Analiza** | `<pendiente identificar>` | Mockup histórico en `_design_intake/Analiza.html`, `_design_intake/analiza/*.jsx`. |
| **Matching** | `<pendiente identificar>` | Mockup histórico en `_design_intake/Matching.html`. |
| **Planes** | `<pendiente identificar>` | Mockup histórico en `_design_intake/Planes.html`. |

**Riesgo residual:** cualquier PR futuro que introduzca una de estas pantallas DEBE actualizar la Tabla 1 en el mismo commit.

---

## Cómo actualizar este documento

1. **Nueva pantalla canónica** → añadir fila en Tabla 1.
2. **Pantalla sustituida** → mover fila de Tabla 1 a Tabla 2 + documentar reemplazo + mover archivos legacy a `/app/_legacy/` + añadir patrón a `LEGACY_PATTERNS` del guard.
3. **Pantalla identificada** (fila de "pendiente identificar" resuelta) → mover a Tabla 1 con la SoT correcta.
4. Toda PR que introduzca o modifique una pantalla debe actualizar este documento y el guard en el mismo commit.

## Reglas de gobernanza asociadas

- **R11 · Visual Governance**: cualquier cambio visual sobre una SoT de Tabla 1 requiere aprobación explícita del usuario.
- **R13 · Source of Truth única por pantalla**: enforced por este documento + el guard automatizado. Ver también `/app/memory/ARROBA_CONSUMER_INTEGRATION_PLAN_v1.md` §gobernanza.

## Verificación rápida

```bash
# ¿Cero imports/refs activas al legacy?
grep -rn "CPApp\|cp-app\|Company Profile" /app/frontend/src /app/backend/src /app/backend/tests /app/memory
# → cero hits

# Guard test verde:
cd /app/frontend && yarn test canonical_screens_guard
```
