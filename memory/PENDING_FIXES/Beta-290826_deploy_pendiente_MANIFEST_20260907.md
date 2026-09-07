# Beta-290826 — pendiente de deploy

Copia de solo los archivos que han cambiado en `Beta-290826/` respecto a lo ya desplegado, con la misma
ruta relativa que el checkout real (`frontend/...`). Sirve para armar el próximo paquete de deploy sin
tener que subir todo el repo — cada archivo de aquí se copia tal cual sobre el checkout real (o sobre lo
que reciba Neo/Emergent) en el momento del deploy.

**No se ha desplegado nada de esto todavía.** Se actualiza cada vez que se cierra una tarea verificada,
no en cada edición individual.

**Nueva carpeta (2026-08-28):** Daniel confirmó que desplegó `Beta-160826_deploy_20260824_1735.zip` (todo
lo que estaba acumulado en `Beta-160826-deploy-pendiente/` hasta esa fecha, ver ese `MANIFEST.md` para el
detalle completo de qué incluía) — está en producción. `Beta-160826/` sigue siendo el checkout de trabajo
real, pero a partir de ahora el staging de "pendiente de desplegar" se lleva aquí, en
`Beta-290826-deploy-pendiente/`, para no mezclar lo que ya está en producción con lo nuevo. `Beta-290826/`
es una copia completa del checkout (`Beta-160826/` tal cual estaba en el momento de crear esta carpeta,
incluido lo de Mapa Empresarial de más abajo, que NO estaba en el zip ya desplegado).

## Archivos incluidos

| Archivo | Qué cambió | Estado |
|---|---|---|
| `backend/src/modules/market_map/__init__.py` | **Nuevo.** Módulo de proxies hacia geo-intelligence, sector-intelligence-v2, cross-intelligence y business-demography de Intel (todo público, sin `activeOrg`). | `py_compile` OK. |
| `backend/src/modules/market_map/service.py` | **Nuevo.** Mismo patrón que `copilot/intel_ficha_proxies.py`: `_get_json` vía `get_agency_tool_client()` + `_intel_call_ff`, `asyncio.wait_for(timeout=7.5)`, `except Exception` amplio, caché TTL en memoria (900s). Funciones: `national_overview`, `national_history`, `geo_territories`, `geo_territory_detail`, `sector_ranking`, `sector_emerging`, `cross_sectors_in`, `cross_territory_for`. | `py_compile` OK. |
| `backend/src/modules/market_map/router.py` | **Nuevo.** Router `/api/market-map` (7 endpoints: `/national`, `/territories`, `/territory/{level}/{code}`, `/sectors`, `/sectors/emerging`, `/cross/sectors-in/{geo_level}/{geo_code}`, `/cross/territory-for/{cnae_section}`). Normaliza la respuesta de Intel para `/territory/{level}/{code}` (Intel devuelve envelope distinto para CCAA que para provincia — aquí queda siempre `{level, code, territory, provinces}`). Sin auth (todo lo que consume es público en Intel). | `py_compile` OK. |
| `backend/src/main.py` | Import + `app.include_router(market_map_router)`. | `py_compile` OK. |
| `frontend/src/lib/api/client.ts` | Tipos `MarketMap*` (Kpi, NationalOverview/History/Response, TerritoryCard, TerritoriesResponse, TerritoryDetailResponse, SectorCard, SectorsResponse, EmergingResponse, CrossSector(s), CrossTerritory(ies)) + namespace `apiClient.marketMap` (`national`, `territories`, `territory`, `sectors`, `sectorsEmerging`, `crossSectorsIn`, `crossTerritoryFor`). | `tsc --noEmit` limpio (0 errores nuevos, mismos 3 preexistentes sin relación en `oportunidad/[masterId]/page.tsx` y `MandateForm.tsx`). |
| `frontend/src/app/[locale]/(public)/mapa-empresarial/page.tsx` | **Nuevo.** Página `/mapa-empresarial`: KPIs nacionales (altas/bajas/activas/balance, INE Sociedades Mercantiles), evolución 12/24/36 meses (barras, sin librería de charts nueva), ranking de territorios (CCAA/provincia × dinamismo/tamaño/crecimiento/actividad) con detalle al seleccionar (drill-down a provincias si es CCAA, sectores con más peso ahí), ranking de sectores (sección/división × mismas 4 métricas) con detalle (territorios donde más pesa ese sector), sectores emergentes (etiquetas CNAE reales, no nombres inventados), comparador simple (2 territorios del ranking ya cargado, sin llamada nueva), y panel de fuentes/metodología corregido (sin el bug de "Banco de España: real" ni "Iberinform: próximamente" que sí tenía el mockup). Todo campo con `partial_data=true` o que viene del cruce sector×territorio (estimado) lleva `Badge` "Estimado" + `Tooltip` explicando por qué. | `tsc --noEmit` limpio (mismo veredicto que la fila de arriba, corridos juntos). Sin tests de componente (no hay infra de testing de React en este sandbox para páginas nuevas) — verificado por lectura + tipado estricto de las respuestas del proxy. |

**Simplificaciones deliberadas de v1 (pendientes de validar con Daniel, no bloquean nada técnico):**
- Sin AIBar (banner narrativo generado por IA) — no existe ese generador en Intel hoy.
- Sin mapa SVG interactivo (el mockup tenía España pintable) — sustituido por ranking en lista. Mismos
  datos, sin la coreografía visual.
- Sin filtro "Periodo" (snapshots históricos) — Intel no expone histórico de geo/sector-intelligence,
  solo el estado actual.
- Comparador simplificado: solo compara 2 territorios ya presentes en el ranking cargado (no hace
  búsqueda libre ni trae sectores a comparar).

## Pendiente antes de desplegar de verdad

1. No se pudo levantar el backend real en este sandbox (sin credenciales de Intel) — verificado solo
   con `py_compile` + `tsc --noEmit`, no con una llamada HTTP real de extremo a extremo. Probar en
   preview/Emergent antes de dar por bueno el contrato de respuesta.
2. Revisión visual de Daniel del layout (no hay mockup pixel-perfect de esta versión simplificada,
   solo el wireframe original que sí tenía AIBar/mapa/periodo).
3. Decidir si las simplificaciones de v1 de arriba se quedan así o se amplían en una v2.

## Cómo usarlo en el deploy

1. Revisar que cada archivo de aquí siga siendo la versión final antes de empaquetar (por si hay ediciones
   posteriores en `Beta-290826/` que no se hayan vuelto a copiar aquí).
2. Copiar cada archivo de esta carpeta sobre la ruta equivalente del checkout real / del zip que se suba
   a Neo, respetando la estructura `frontend/...`.
3. Seguir el resto del proceso de `Beta-290826/DEPLOY_NOTES.md` (build + `sudo supervisorctl restart frontend`
   en el pod, o Save to GitHub → Deploy en el panel Emergent).

**Regla de siempre**: esto se prepara pero no se empaqueta ni se despliega hasta que Daniel lo pida
explícitamente (ver memoria `feedback_no_deploy_until_told`).

## 🚨 Hotfix urgente — desbloquear build del zip ya subido a Emergent (2026-08-28)

Neo/Emergent aplicó el bundle `Beta-160826` en su pod y reportó verificación en rojo: `yarn tsc --noEmit`
falla con 3 errores (bloquea `yarn build`, el preview sigue sirviendo el bundle 28 anterior) + 3 fallos en
`pytest tests/test_financial_query.py`. Diagnóstico de Neo confirmado exactamente correcto tras revisar el
código real — **no son bugs del refactor 30c ni del cableado de Mapa Empresarial**, son 2 problemas
distintos y ya identificados antes en este mismo repo (los 3 TS ya estaban documentados como "preexistentes
sin relación" en entradas anteriores de este MANIFEST — nunca se llegaron a arreglar de verdad, solo se
constató que no los introducía cada cambio nuevo). Corregidos aquí los 5, verificados:

| Archivo | Qué cambió | Estado |
|---|---|---|
| `frontend/src/app/[locale]/(authenticated)/oportunidad/[masterId]/page.tsx` | Línea 83: `entity_name: target.name \|\| undefined` → `entity_name: target.name ?? null`. `publish()` espera `entity_name: string \| null` (contrato de `CopilotProvider.tsx`); `\|\| undefined` producía `string \| undefined`, incompatible. | `tsc --noEmit` limpio. |
| `frontend/src/app/[locale]/(authenticated)/oportunidades/mandato/MandateForm.tsx` | 2 casts: `setMandateType(e.target.value as NonNullable<MandateCreatePayload['mandate_type']>)` (línea 84) y `setOwnership(e.target.value as NonNullable<MandateCreatePayload['ownership_preference']>)` (línea 133). El `<select>` nativo da `string`; el estado está tipado a la unión literal que `useState(initial?.campo ?? 'valor')` infiere de `MandateCreatePayload` (opcional, de ahí el `NonNullable`) — mismo patrón en los dos campos. | `tsc --noEmit` limpio (0 errores en todo el proyecto). |
| `backend/tests/test_financial_query.py` | (1) Import: `parse_financial_query as p` → `parse_financial_query` + `p = parse_financial_query` (alias explícito), porque 2 tests ya existentes en el fichero (`test_province_only_routes_to_structured_search`, `test_no_predicate_no_province_returns_none`) llaman `parse_financial_query(...)` sin alias — `NameError` porque nunca se importó ese nombre. (2) `test_non_financial_returns_none` afirmaba `p("clínicas dentales en Valencia") is None`, pero `financial_query.py` cambió de contrato a propósito (comentario propio en el código: "Antes una provincia sola se descartaba y el filtro geográfico se perdía") — sector+provincia sin predicado numérico ahora SÍ enruta a búsqueda estructurada. Se quitó esa aserción del test viejo y se añadió `test_sector_plus_province_no_predicate_routes_to_structured_search`, que prueba el comportamiento nuevo explícitamente (mismo patrón que los 2 tests ya existentes, sector delante en vez de detrás). Cero pérdida de cobertura. | 13/13 tests pasan (ejecutados directo con `importlib` porque `conftest.py` del backend requiere Python 3.11+ para `datetime.UTC`, y este sandbox solo tiene 3.10 — limitación de entorno ya documentada, no nueva; `financial_query.py` es un módulo puro sin ese problema, así que se pudo probar aislado con total fiabilidad). |

**Recomendación para Neo/Emergent: opción (a) de su reporte** — son exactamente los 5 cambios de arriba,
ya hechos y verificados aquí. Puede aplicarlos literalmente sin rehacer el diagnóstico.

## Ficha Sectorial — cableado real (2026-08-29)

Daniel auditó la pantalla "Ficha Sectorial" (`_design_intake/Ficha Sectorial.html` + `_design_intake/sector/`)
con el mismo semáforo 🟢/🟡/🔴 que Mapa Empresarial, leyendo `sector_intelligence_v2.py`. Verificado contra
el código real de Intel (`routes/sector_intelligence.py`, `routes/procurement.py`, `routes/signal_intelligence.py`,
`routes/cross_intelligence.py`) — su diagnóstico se confirma punto por punto. Pidió "¿la cableas?" y se
cableó ya, extendiendo el módulo `market_map` (mismo patrón que Mapa Empresarial, nada nuevo pedido a Intel):

| Archivo | Qué cambió | Estado |
|---|---|---|
| `backend/src/modules/market_map/service.py` | 3 funciones nuevas: `sector_detail(cnae_code)` → `/api/v1/public/sector-intelligence/detail/{code}` (scores + breakdown real de actividad: `procurement_contracts/amount`, `borme_events`, `iberinform_companies`, `activity_sub_scores` — todo per-sector real, no solo blend); `sector_companies(cnae_code, limit, offset)` → `/detail/{code}/companies` (empresas reales del universo ARROBA, ordenadas por facturación — "empresas destacadas", confirmado 🟢 real); `sector_signals(cnae_code, level, limit)` → `POST /api/v1/signal-intelligence/sector` (radar de señales, real, vía `require_service_key` — mismo `X-API-Key` que ya usa `AgencyToolClient`, confirmado que la ruta no-`/public/` también es alcanzable). Añadido `_post_json`/`_cached_post_json` (mismo patrón que `_get_json`, para el único endpoint que es POST). | `py_compile` OK. |
| `backend/src/modules/market_map/router.py` | 3 endpoints nuevos: `/api/market-map/sector/{cnae_code}`, `/sector/{cnae_code}/companies`, `/sector/{cnae_code}/signals`. | `py_compile` OK. |
| `frontend/src/lib/api/client.ts` | Tipos `MarketMapSectorDetail` (todos los campos crudos de `sector_intelligence_v2.py`, no solo la tarjeta compacta), `MarketMapSectorDetailResponse`, `MarketMapSectorCompany(Preview/Response)`, `MarketMapSectorSignal(Opportunity/sResponse)` + 3 métodos nuevos en `apiClient.marketMap` (`sectorDetail`, `sectorCompanies`, `sectorSignals`). | `tsc --noEmit` limpio (0 errores en todo el proyecto). |
| `frontend/src/app/[locale]/(public)/sector/[code]/page.tsx` | **Nuevo.** Ficha sectorial en `/sector/[code]`: breadcrumb sección→división→grupo, KPIs (dinamismo/tamaño/crecimiento/empresas activas, con "Estimado" donde corresponde), actividad real (contratación pública + BORME + Iberinform, con importes/contratos reales), radar de señales (real, en vivo), empresas destacadas paginadas (reales, ordenadas por facturación), territorios líderes (cruce sector×territorio reutilizado de Mapa Empresarial, con badge "Estimado" en la concentración), jerarquía CNAE (hijos clicables), y un bloque final explícito "Lo que esta ficha todavía no tiene" (deals privados, deltas históricos, series mensuales de creación/cierre y de BORME por sector, crecimiento real por subsector) — honestidad primero, nunca se rellena con datos inventados. | `tsc --noEmit` limpio (mismo veredicto, corrido junto con el resto). |
| `frontend/src/app/[locale]/(public)/mapa-empresarial/page.tsx` | `SectorRow` ahora enlaza a `/sector/{cnae_code}` ("Ficha →") — cruce entre las dos pantallas nuevas. Cambio mínimo: el `<button>` que envolvía toda la fila pasó a `<div>` con un `<button>` interno solo para el área de selección (necesario para poder anidar el `<Link>` sin `<a>` dentro de `<button>`, HTML inválido). | `tsc --noEmit` limpio. |

**Huecos reales confirmados por Daniel y NO rellenados (quedan fuera de v1, documentados en la propia
pantalla, sección "Lo que esta ficha todavía no tiene"):**
- Empresas activas reales por sector y por provincia — DIRCE solo da el nacional; el desglose es estimado.
- Series mensuales de creación/cierre por sector — no existen en Intel (DIRCE no viene por sector ni mes).
- **Serie MENSUAL de actividad BORME por sector — investigado y confirmado que tampoco está expuesta hoy**
  (`sector_intelligence_v2.py::_gather_borme()` solo agrega un TOTAL por división, no por mes; el endpoint
  `/api/v1/borme/events` no tiene parámetro de filtro por CNAE). Se muestra el total acumulado
  (`borme_events`, real), no la línea de evolución mensual que preveía el wireframe — matiz sobre el
  diagnóstico de Daniel, que la daba por disponible.
- Operaciones corporativas nombradas (deals con comprador/importe/fecha) — confirmado que no existe una
  base de M&A privado real (`transaction_intelligence`/`transaction_os` es el pipeline propio de ARROBA,
  no una base de comparables de mercado — no es lo mismo, verificado leyendo el código).
- Deltas vs. periodo anterior (+X pts) — los scores no se snapshotean, no hay histórico.
- Crecimiento (%) real por subsector — `growth_score` aplica el YoY nacional por igual a todos los CNAE.

**Sí confirmado real y ya cableado (contradiciendo o precisando el semáforo 🔴 de Daniel donde aplica):**
concentración sector×territorio (`concentration_index`, ya en `cross-intelligence`, no hace falta HHI
nuevo); radar de señales del sector (real, en vivo); empresas destacadas por facturación (real, con
recuento de señales activas por empresa); contratación pública por sector — SÍ está en el propio doc de
`sector_intelligence_v2` (`procurement_contracts`/`procurement_amount`), no hacía falta "agregarlo por
CNAE" como pensaba Daniel — ya estaba ahí, solo sin exponer en una pantalla. Lo que sí falta y no se
construyó (fuera de alcance de "wiring", sería trabajo nuevo de Intel): desglose de "organismos más
activos" (top compradores) por sector — existe a nivel nacional (`procurement/validation-report`), no
filtrado por CNAE.


## 3 bugs de UX encontrados por Daniel revisando el preview de Neo (2026-08-29) — cableados en Beta-290826

Daniel revisó visualmente `https://musing-hellman-9.preview.emergentagent.com/` (preview de Neo,
Bundle 160826) y reportó 3 problemas. Los verifique en vivo con el navegador contra ese mismo preview
antes de tocar nada (no son suposiciones), y los tres son arreglables en Beta sin depender de Intel.
Aplicados y verificados en `Beta-290826`; NO estan todavia en el pod de Neo (ese preview es una copia
separada) — hay que pasarselos igual que el hotfix de 5 bugs anterior.

| # | Problema (Daniel) | Diagnostico verificado | Fix aplicado |
|---|---|---|---|
| 1 | "agencias marketing" y "agencias de marketing" deberian dar el mismo numero de resultados | Confirmado en el preview: "agencias marketing" -> 62 resultados IRRELEVANTES (agencias de viajes, corredurias, hostelera -- nada de marketing). "agencias de marketing" -> 898 resultados correctos (publicidad, estudios de mercado). Causa raiz en `backend/src/modules/copilot/service.py`: el endpoint de taxonomia de Intel matchea por frase exacta; sin el conector "de" cae a un match laxo sobre la palabra suelta "agencias" (que tambien es como se llama la categoria "agencias de viajes"). Ya existia un mecanismo de reintento insertando "de" (`_taxonomy_retry_variant`), pero solo se disparaba si la busqueda directa devolvia 0 filas -- aqui devolvia 62 (no cero), asi que nunca llegaba a reintentar. | Se cambia la condicion: ahora SIEMPRE se prueba la variante con "de" cuando aplica (2+ palabras, sin conector ya presente), y nos quedamos con el total mas alto entre las dos, no solo cuando la directa da cero. Si la query ya trae conector (p.ej. "agencias de marketing" tecleada asi), no hay retry extra -- mismo comportamiento y mismo coste que antes. `py_compile` OK. |
| 2 | El loader no se ve cargar | Confirmado en el preview: al lanzar una busqueda nueva desde el buscador (sin recargar pagina), el titulo (`<h1>`) se actualiza al instante con la query nueva, pero el contador "N resultados" se quedaba con el numero de la busqueda ANTERIOR durante toda la carga (`setTotal`/`setRows` solo se actualizaban al terminar el fetch, nunca al empezar) -- se veia p.ej. "clinicas dentales" junto a "898 resultados" heredado de la busqueda de marketing previa. El skeleton de carga (barras `animate-pulse`) si existe y si se muestra, pero ese contador desincronizado hacia parecer que la pantalla no estaba cargando de verdad o mostraba datos incorrectos. | En `frontend/.../resultados/page.tsx`, `fetchResults` ahora resetea `rows` y `total` a vacio/cero en cuanto arranca la busqueda (antes del `await`), no solo al terminar. El contador queda coherente con el skeleton mientras carga. `tsc --noEmit` limpio. |
| 3 | Quitar la columna "Actualizado" de la tabla de resultados (larga, poco relevante en el listado); la fecha puede verse en rollover o dentro de la ficha | La columna ya formaba parte del sistema de columnas gestionables (boton "Columnas", con persistencia en localStorage) -- solo hacia falta sacarla del set visible por defecto, no borrarla del catalogo. Confirmado que `updated_at` ya se muestra en varios componentes de la ficha de empresa (`CompanyIdentity`, `ExecutiveSnapshot`, `IdentityFieldsGrid`, etc.), asi que la alternativa "verlo dentro de la ficha" que proponia Daniel ya existe -- no hacia falta construir nada ahi. | `defaultVisible: false` en la columna `actualizado` del catalogo `COLUMN_DEFS`. Sigue disponible para quien la quiera añadir desde "Columnas"; ya no aparece por defecto. No se construyo el icono con rollover (Daniel lo dejo como opcional con "si quieres") porque la fecha ya es visible en la ficha -- si Daniel prefiere el icono en la tabla en vez de (o ademas de) esto, lo añado. `tsc --noEmit` limpio. |

**Nota sobre alcance:** no se toco la sugerencia de Daniel de tratar "agencia publicidad"/"agencia de
publicidad" como sinonimo de "agencia de marketing" -- no hay evidencia en el codigo de que Intel las
trate como la misma categoria de taxonomia (son CNAE distintos: publicidad vs. marketing/estudios de
mercado), y unificarlas sin confirmarlo seria inventar una equivalencia. Si Daniel quiere esto, hace
falta que Intel confirme si son la misma categoria o no antes de tocar nada.


## Corrección 2026-08-29 (mismo día) — revertido el parche del punto 1 de la tabla anterior

Daniel preguntó si el problema de fondo no se podía arreglar en la taxonomía real de Intel en vez de con
un truco de texto en Beta. Se investigó y sí: el motor de taxonomía de Intel (`services/taxonomy/search.py`
+ `registry.py`) ya tenía un sistema de alias curados por categoría, solo le faltaba tolerar la ausencia
del conector "de" al comparar — arreglado en el origen, ver `Intel-290826-deploy-pendiente/MANIFEST.md`.

Con ese fix, la llamada directa de Beta a `/api/v1/company-taxonomy/search?q=agencias+marketing` ya
devuelve el total correcto (898, igual que "agencias de marketing") sin necesitar ninguna segunda
llamada. Mantener el parche de Beta (reintentar SIEMPRE con "de" y quedarse con el total más alto) habría
significado dos sitios resolviendo el mismo problema de formas distintas — Daniel: "no quiero que cada
uno haga una cosa". Revertido: `backend/src/modules/copilot/service.py` vuelve a reintentar solo cuando
la búsqueda directa devuelve CERO filas (comportamiento original, antes del parche de hoy), que sigue
siendo una red de seguridad razonable para categorías que Intel de verdad no reconoce — pero ya no
duplica la responsabilidad de Intel de decidir qué es "la misma categoría". `py_compile` OK.
Verificado que `_taxonomy_retry_variant` (la función pura, sin tocar) sigue pasando sus 8 asserts
existentes en `tests/test_taxonomy_retry_variant.py`.

**Contrato Beta↔Intel verificado, coordinado:** Beta manda `q`, `primary_only=true`, `limit`, `offset` a
`/api/v1/company-taxonomy/search`; Intel (`routes/company_taxonomy.py::search`) acepta exactamente esos
parámetros y devuelve `{"count", "results", "limit", "offset", ...}` — Beta ya contemplaba ambas claves
posibles (`total` o `count`) en `tax.get("total") or tax.get("count")`, así que no hubo que tocar nada del
lado del parseo. `_row_to_item` sigue siendo el único punto de aplanado del shape de Intel, sin lógica de
categorización propia en Beta (comprobado: no hay ninguna lista de sectores/taxonomía hardcodeada en
`backend/src`, todo pasa por Intel).


## Verificación operativa de Mapa Empresarial + Ficha Sectorial (2026-08-29, re-chequeo)

Daniel pidió confirmar que Mapa Empresarial/Ficha Sectorial está operativo antes de darlo por listo para
subir. Re-verificado tras todos los cambios de hoy (hotfix, 3 bugs de UX, revert del parche de taxonomía):

- Los 6 archivos de esta pieza (`market_map/service.py`, `market_map/router.py`, `market_map/__init__.py`,
  `lib/api/client.ts`, `sector/[code]/page.tsx`, `mapa-empresarial/page.tsx`) siguen byte-a-byte iguales
  entre `Beta-290826/` (checkout activo) y esta carpeta de staging — sin drift.
- `market_map_router` confirmado registrado en `src/main.py` (`app.include_router(market_map_router)`) —
  no es código huérfano, está enchufado a la app real.
- `py_compile` OK en `market_map/service.py`, `market_map/router.py` y `src/main.py` juntos.
- `tsc --noEmit` limpio en TODO el proyecto frontend (0 errores), incluyendo `sector/[code]/page.tsx` y
  `mapa-empresarial/page.tsx` junto con el resto de cambios de hoy.
- No requiere ningún cambio en Intel: todos los endpoints que consume (`geo-intelligence`,
  `sector-intelligence`, `cross-intelligence`, `business-demography`, `procurement`,
  `signal-intelligence/sector`) ya existían y fueron verificados leyendo el código real de Intel antes de
  escribir los proxies — por eso no hay nada de Mapa Empresarial en `Intel-290826-deploy-pendiente/`, no
  es un olvido.

Sigue **sin desplegar** — listo para subir cuando Daniel dé el ok, junto con el resto de lo acumulado hoy
en esta carpeta.

## App Shell — sidebar de navegación real, sustituye a AuthHeader (2026-08-29)

Construido el componente real (no solo el borrador HTML de revisión) tras el visto bueno de Daniel sobre
contenido, comportamiento e integración de AuthHeader. Especificación completa en
`memory/project_app_shell_navegacion.md`.

Archivos nuevos/modificados (7, todos verificados byte-a-byte iguales entre `Beta-290826/` y esta carpeta):

- `frontend/src/components/layout/Sidebar.tsx` — **nuevo**. Sidebar persistente (240px↔72px plegable, con
  hover-expand), 3 pilares con acordeón (Analizar/Valorar/Comprar y vender), sección "Mi espacio", tema/
  idioma, y menú de identidad (organización activa + cambiar, Perfil, Ajustes, Cerrar sesión) bajo el
  nombre de usuario — sustituyendo a `AuthHeader` (confirmado por Daniel: "que se mueva todo dentro del
  sidebar bajo el nombre de usuario"). Reutiliza hooks reales existentes (`useAuth`, `useActiveOrg`,
  `useTheme`) — nada mockeado. Enlaces sin página real todavía (Valorar completo, Empresas en venta, Mi
  pipeline, Lista de seguimiento, Alertas, Señales, Búsquedas guardadas, Mis tesis) se muestran inertes con
  etiqueta "Pronto" en vez de apuntar a una URL que daría 404 — honesto sobre lo que existe hoy. El icono
  del logo colapsado es el mosaico animado de la arroba (mismo mark que el Copilot en los mockups); NO abre
  el Copilot real al pulsarlo — Daniel confirmó "solo marca visual".
- `frontend/src/app/[locale]/(authenticated)/layout.tsx` — `AuthHeader` sustituido por `<Sidebar>`.
- `frontend/src/styles/tokens.css` — nueva sección "11 — Layout (App Shell)": `--sb-w:240px`,
  `--sb-w-collapsed:72px` (regla del propio design system: token que falta se añade aquí primero).
- `frontend/tailwind.config.ts` — `spacing.sb` / `spacing['sb-collapsed']` mapeados a esos tokens (clases
  `w-sb`, `ml-sb`, etc.).
- `frontend/src/app/globals.css` — animación `.cm-px`/`@keyframes cmSweep` del mosaico (ya respeta
  `prefers-reduced-motion`, que el archivo ya colapsa globalmente).
- `frontend/src/messages/es.json` + `en.json` — namespace `sidebar` completo (pilares, subcategorías, Mi
  espacio, roles, organización) + `common.soon`.

Verificado: `tsc --noEmit` limpio en TODO el proyecto (0 errores) y `eslint` limpio en los 2 archivos
tocados directamente. Pendiente de decidir en una fase posterior: dónde exponer Perfil/Ajustes dentro de
la propia página de Configuración (Daniel pidió ambos sitios: menú de usuario Y dentro de Configuración —
lo segundo depende de que esa página exista, que aún no está construida).

Sigue **sin desplegar** — listo para subir cuando Daniel dé el ok, junto con el resto de lo acumulado hoy
en esta carpeta.

### Ajuste — sidebar NO en /onboarding (2026-08-29, mismo día)

Confirmado con Daniel: home pública (`(public)/page.tsx`, sigue con `PublicHeader`) sin sidebar — ya era
así, sin cambios. Home privada (`/inicio`) SÍ lleva sidebar — ya era así también. Añadida una excepción
más, de iniciativa propia (recomendada, con el razonamiento explicado a Daniel): `/onboarding` tampoco
lleva sidebar — es un flujo lineal guiado sin nada aún que navegar; un menú lleno de "Pronto" ahí sería
ruido. `(authenticated)/layout.tsx` ahora comprueba el pathname y renderiza sin `<Sidebar>` para esa ruta.
`tsc --noEmit` y `eslint` limpios. Copiado a esta carpeta.

### Añadido — Mapa SVG de España en /mapa-empresarial (2026-08-29, mismo día)

Daniel comparó el JPG de la página real contra el mock (`_design_intake/Mapa Empresarial.html` +
`_design_intake/mapa/mapa-charts.jsx`/`mapa-data.js`) y pidió el mapa interactivo tal cual estaba en el
diseño — el propio comentario de cabecera de `page.tsx` ya dejaba anotado que la v1 lo sustituía por un
ranking en tabla "a validar con Daniel antes de sumar esta pantalla al deploy".

- `frontend/src/components/mapa-empresarial/SpainMap.tsx` — **NUEVO**. Réplica visual 1:1 de
  `SpainMapDetailed`/`heatColor` del mock: mismas 15 formas "blob" por CCAA (mismo `d` de cada path) +
  Baleares como 2 puntos (el mock tampoco les daba forma propia). Los `ccaaCode` de cada forma son los
  códigos INE reales (`Intel-140826/backend/services/geo_catalog.py` → `CCAA[].code`), que es el mismo
  valor que Intel devuelve como `geo_id` a nivel "ccaa" — el color de cada forma sale siempre de un dato
  real (`dynamism_score` de `apiClient.marketMap.territories`), nunca de un número de mock. Canarias/
  Ceuta/Melilla siguen sin forma (igual que en el mock); sus datos, si Intel los da, solo aparecen en el
  ranking de al lado, nunca inventados en el mapa.
- `frontend/src/app/[locale]/(public)/mapa-empresarial/page.tsx` — el bloque "Territorios" ahora, cuando
  `geoLevel==='ccaa'`, muestra el mapa a la izquierda (con una tarjeta flotante réplica del popup del
  mock — empresas activas, nuevas empresas, índice de dinamismo, tamaño/crecimiento/actividad, sector
  líder) y el ranking en lista a la derecha; con `geoLevel==='provincia'` sigue el ranking-lista solo
  (las formas del mapa son por comunidad, no por provincia). Comentario de cabecera actualizado.

Verificado: `tsc --noEmit` limpio (0 errores) y `eslint` limpio en los 2 ficheros. Probado visualmente con
datos de muestra en una ruta de scratch descartada después (Intel no es alcanzable desde este entorno para
probar con datos reales — el resto de la pantalla ya se comprobó antes en modo "empty honesto"). Copiado
a esta carpeta. Sigue **sin desplegar**.

### Añadido — Sidebar en Ficha de Empresa, Mapa Empresarial, Ficha Sectorial y Resultados (2026-08-29, mismo día)

Daniel observó que el App Shell no se estaba aplicando ni a la Ficha de Empresa ni al Mapa — correcto:
ambas páginas vivían en grupos de rutas (`(public)`, `(ficha)`) donde el `<Sidebar>` nunca se montaba (solo
está cableado en `(authenticated)/layout.tsx`). Confirmado por Daniel ("ambas con sidebar"): las cuatro
pasan a llevarlo. `/resultados` se suma de oficio por consistencia — vive en la misma familia pública sin
`RequireAuth` que mapa-empresarial/sector y Daniel confirmó que tenía sentido.

- `frontend/src/app/[locale]/(ficha)/layout.tsx` — ahora envuelve `children` en `<Sidebar>`. Corregido
  también el comentario de cabecera, que estaba desactualizado: decía que la Ficha traía su propio
  `CompanyTopbar` "como marca el ZIP", pero el shell que realmente se usa (`CompanyFichaLayoutV2`, el que
  consume `CompanyFichaF01Client`) nunca lo renderiza — eso pertenece al `CompanyFichaLayout` v1, retirado
  y sin importar en ningún sitio. La Ficha sigue siendo mixed-access (sin `RequireAuth` en `page.tsx`), y
  `Sidebar` ya soporta usuario anónimo (`role: 'anonymous'`), así que añadirlo no fuerza login.
- `frontend/src/app/[locale]/(public)/mapa-empresarial/` → movida a `(authenticated)/mapa-empresarial/`.
- `frontend/src/app/[locale]/(public)/sector/` → movida a `(authenticated)/sector/`.
- `frontend/src/app/[locale]/(public)/resultados/` → movida a `(authenticated)/resultados/`.
  Los tres son `mv` mecánicos: los grupos de rutas no cambian la URL, y ninguna de las tres tenía imports
  relativos hacia `(public)/_components`. Comprobado que ni las páginas ni el guard de
  `(authenticated)/layout.tsx` (`OnboardingGuard`, que solo fuerza `/onboarding` si `isAuthenticated &&
  memberships.length === 0`) usan `RequireAuth` aquí, así que el visitante anónimo sigue entrando igual
  que antes, ahora con el sidebar.

Verificado: `tsc --noEmit` limpio (0 errores) y `eslint` limpio en los 4 ficheros tocados, en el propio
`Beta-290826/` (no solo en el checkout desechable). Probado visualmente con servidor local (backend +
frontend en checkout desechable, Intel no alcanzable desde este entorno — degrade "empty honesto" ya
conocido, no relacionado con este cambio): las cuatro páginas muestran el sidebar correctamente. Copiado a
esta carpeta. Sigue **sin desplegar**.

### Arreglado — logo de la home y columna "Actualizado" persistida (2026-08-29, mismo día)

Daniel reportó tres cosas usando la preview: logo de la home mal, "loader" invisible al buscar en la
home, y la columna "Actualizado" seguía saliendo en Resultados a pesar del fix de hoy. Investigado a
fondo: los tres tenían causa raíz distinta. Se aplican los dos de bajo riesgo (Daniel: "aplica 1 y 3");
el del buscador de la home queda pendiente de una decisión de producto (ver más abajo, no aplicado).

**1 — Logo de la home** (`frontend/src/app/[locale]/(public)/layout.tsx`): `PublicHeader` pintaba un
placeholder de texto (`@` + "arroba.com") en vez del logo real. El resto del chrome (`Sidebar`,
`BrandPanel` de login/registro) ya usa `/brand/logo.png` — se alinea el header público con eso. Cambio de
2 nodos de texto por un `<img src="/brand/logo.png">`, mismo patrón que `Sidebar.tsx`.

**3 — Columna "Actualizado" en `/resultados`** (`frontend/src/app/[locale]/(authenticated)/resultados/page.tsx`):
no era un bug de código — el fix de hoy (`defaultVisible: false`) es correcto, pero el set de columnas
visibles se persiste en `localStorage` bajo la clave `arroba.resultados.columnas.v1`, y cualquier
navegador que ya hubiera visitado la página antes del fix seguía arrastrando el set viejo (con
"Actualizado" dentro), que gana sobre el nuevo default. Se sube la clave a `v2` para que ese set viejo se
descarte una vez — quien quiera volver a activar "Actualizado" sigue pudiendo hacerlo a mano desde el
botón Columnas.

**2 — Buscador de la home no hace nada visible para un visitante sin cuenta** (NO aplicado, pendiente de
Daniel): el buscador del hero (`¿Cuánto vale mi empresa?`) llama a `openDock()` + `send()` del Copilot,
pero `CopilotDock.tsx` tiene `if (!isAuthenticated) return null` — el Copilot entero no se monta para
anónimos. Como la home pública es la única superficie donde ese buscador vive y es visible sin login, el
resultado es que el buscador no hace nada en absoluto para un visitante sin cuenta (ni barra, ni error, ni
respuesta). Dos caminos posibles, cada uno con implicaciones de producto distintas: (a) dejar que el
Copilot responda también a anónimos desde ahí, o (b) mantener el Copilot solo-autenticado y hacer que el
buscador de la home redirija a `/registro` o `/resultados` cuando quien busca no tiene sesión. Pendiente
de que Daniel elija.

Verificado (1 y 3): `tsc --noEmit` limpio (0 errores) y `eslint` limpio en los 2 ficheros, en el propio
`Beta-290826/`. Visual: capturado el logo real ya renderizado en la home; para la columna, confirmado
programáticamente (Playwright) que con un valor viejo `v1` (con "actualizado" dentro) ya preexistente en
`localStorage`, la página arranca igualmente con el set nuevo — el fallback a datos reales de Resultados
no se pudo probar con contenido real porque Intel no es alcanzable desde este entorno (limitación de
sandbox ya conocida, no relacionada con este cambio). Copiado a esta carpeta. Sigue **sin desplegar**.

### Arreglado — gráfico vacío en Resumen para empresas de un solo ejercicio (2026-08-29, mismo día)

Daniel reportó que las empresas con un solo ejercicio disponible no muestran gráfico en la pestaña
Resumen de la Ficha, y recordaba que ya se había arreglado en su día. Cierto: el componente dedicado
(`SingleExerciseChart`, HARDENING-037/038) existe y está cableado — el bug no es que falte, es que
renderiza vacío.

**Causa raíz** (`frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx`, función `Resumen`):
al construir el objeto que se pasa a `singleExerciseFromEvolution()`, se mapeaba
`series: evo.series.map((s) => ({ key: s.label, ... }))` — usando `s.label` (texto de UI en español,
p.ej. "Ingresos", "EBITDA") en vez de `s.key` (la clave real "revenue"/"ebitda" que emite
`to_financial_section` en el backend de Beta). `singleExerciseFromEvolution` busca internamente
`s.key === 'revenue' | 'ebitda'`, así que con las etiquetas nunca hay coincidencia: la función devuelve
un año válido pero `revenue: null, ebitda: null`. Como el año sí es válido, la cascada no cae al segundo
origen de datos (el punto único de `finances.evolution.points[]`, que sí tiene las claves correctas) —
se pinta la tarjeta `SingleExerciseChart` con barras a altura 0 y "—" en vez de las cifras: visualmente
indistinguible de "sin gráfico".

Fix de una línea: `key: s.label` → `key: s.key`. Confirmado con `grep` que este era el único sitio del
frontend con este patrón (no es un bug sistémico repetido en otro componente).

Verificado: `tsc --noEmit` limpio (0 errores) en `Beta-290826/`. Reproducido el bug y la corrección con
un script Node aislado que replica `singleExerciseFromEvolution` con el shape real que emite el backend
(`{key:'revenue', label:'Ingresos', values:[...]}` + `{key:'ebitda', label:'EBITDA', values:[...]}`):
con el código viejo devuelve `{year, revenue:null, ebitda:null}`; con el fix devuelve
`{year, revenue:4200000, ebitda:610000}` — confirma la causa raíz sin necesidad de una empresa real de
un ejercicio en el sandbox (Intel no alcanzable desde aquí, limitación ya conocida). Copiado a esta
carpeta. Sigue **sin desplegar**.

### Añadido — loader de Oportunidades reutilizado al cargar la Ficha (2026-08-29, mismo día)

Daniel recordaba que estaba previsto poner, al cargar la Ficha de Empresa (tarda, viene de varias
llamadas), el mismo loader que ya usa `/oportunidades` ("Mis Oportunidades") — le gustaba su forma.
Verificado: nunca se llegó a aplicar. `CompanyFichaF01Client.tsx` seguía mostrando un `<Spinner/>` suelto
+ "Cargando ficha…" mientras `fichaLoading` es `true`.

Se presentaron a Daniel 3 formas ya existentes en el código (capturas vía `/internal/blocks-preview`,
sección añadida temporalmente solo para la comparación, no forma parte del cambio real): (A) `LoadingBlock`
— la misma que usa `/oportunidades` hoy; (B) el `Skeleton()` ya escrito dentro de `CompanyFichaLayoutV2.tsx`
como "loading estándar de sección" pero sin usar en ningún sitio (barrido de brillo); (C) los rectángulos
con pulso genérico que ya usan `/resultados` y las tarjetas KPI de la propia Ficha. Daniel eligió (A).

**Cambio** (`frontend/src/components/company/CompanyFichaF01Client.tsx`): sustituido el bloque
`if (fichaLoading) { ... <Spinner/> ... }` por `<LoadingBlock testId="ficha-f01-loading" />` (mismo
`data-testid` que antes, para no romper tests existentes que lo referencien), importado desde
`@/components/blocks` — mismo barrel que usa `/oportunidades`. Se retira el import de `Spinner` (sin más
usos en el fichero).

Verificado: `tsc --noEmit` limpio (0 errores) en `Beta-290826/`. Confirmado visualmente con Daniel antes de
aplicar (capturas de las 3 opciones). Copiado a esta carpeta. Sigue **sin desplegar** y **sin enviar a
Neo** — pendiente del OK explícito de Daniel para el envío (ver `feedback_avisar_antes_de_enviar_a_emergent`).

### Arreglado — clases `bg-x/NN` transparentes en toda la app + gráfico de altas/bajas en Mapa Empresarial (2026-08-29, mismo día)

Daniel reportó que en el Mapa Empresarial (`musing-hellman-9.preview.emergentagent.com/mapa-empresarial`)
el gráfico "Evolución de altas y bajas" no se veía: la tarjeta pinta cabecera, subtítulo, selector de
periodo y leyenda, pero la zona de barras aparecía completamente en blanco.

Investigado en vivo (DOM/CSS reales sobre el preview, no solo lectura de código) — dos causas
independientes:

1. El contenedor de las columnas usaba `items-end` en vez de `items-stretch`. Las barras tienen altura
   en `%` vía `style`, y sin `items-stretch` la fila nunca les da una altura real de referencia: la
   columna se encoge a su contenido y el `%` se calcula sobre ~0, así que toda barra colapsaba a su
   `minHeight` (2px).
2. Aunque se arregle (1), las barras seguían invisibles: `bg-success/60` y `bg-danger/50` (más la
   leyenda "Altas"/"Bajas", mismas clases) se compilaban a `rgba(0,0,0,0)` — confirmado inspeccionando
   el CSS compilado real, no solo sospechado. Causa raíz: para que Tailwind genere variantes de opacidad
   (`bg-x/NN`) el color tiene que estar definido como `rgb(var(--x-rgb) / <alpha-value>)`; en
   `tailwind.config.ts` todos los colores (success, danger, warning, info, brand-primary, primary,
   surface*, border*, text*, bg, arroba-red, arroba-black...) estaban como `'var(--x)'` plano — un hex
   string normal, que no admite modificador de opacidad. Tailwind omite esa clase del CSS compilado sin
   avisar (ni build error ni warning), así que el bug es invisible salvo mirando el CSS resultante.

Antes de arreglar se hizo un grep de todo `frontend/src` para medir el alcance: el mismo patrón roto
aparecía en ~40 sitios más, repartidos en muchos componentes (badges, alertas, tooltips, bloques de IA de
empresa, comité de inversión, etc.) — no era un bug local de este gráfico, sino de la base del sistema de
diseño. Se preguntó a Daniel si arreglar solo estos dos puntos o el origen sistémico; eligió arreglar todo.

**Cambios:**

- `frontend/src/styles/tokens.css` — añadido un triplete RGB (`--x-rgb: R G B`) junto a cada token de
  color sólido, tanto para los primitivos (`--neutral-*-rgb`, `--arroba-red-rgb`...) como para la paleta
  semántica y sus alias legacy, en claro (`:root`) y con los overrides que cambian en oscuro
  (`[data-dark]`). Los tokens `*-subtle` (`success-subtle`, `danger-subtle`...) se dejan tal cual: en
  oscuro ya son `rgba(...)` con una opacidad baja fija por diseño (no una "versión sólida"), así que
  meterles el patrón `<alpha-value>` encima habría hecho que cualquier uso sin modificador (la inmensa
  mayoría) pasara de un fondo sutil translúcido a un fondo sólido opaco — una regresión visual grande, no
  un arreglo.
- `frontend/tailwind.config.ts` — los 28 tokens de color sólido pasan de `'var(--x)'` a
  `'rgb(var(--x-rgb) / <alpha-value>)'`. Los 4 tokens `*-subtle` no se tocan.
- `frontend/src/app/[locale]/(authenticated)/mapa-empresarial/page.tsx` — `items-end` → `items-stretch`
  en el contenedor de las barras (causa 1).
- Dos usos que combinaban un modificador de opacidad con un token `*-subtle`
  (`bg-warning-subtle/40` en `internal/blocks-preview/page.tsx`, `bg-danger-subtle/40` en
  `InvestmentCommitteeBlock.tsx` — el error state del bloque de Comité de inversión) seguían rotos tras
  el arreglo de fondo, por la razón de arriba. Se alinearon a la convención que el propio código ya usa
  en ~9 sitios para fondos sutiles con opacidad (`bg-danger/10`, `bg-warning/10`): pasan a
  `bg-danger/10` y `bg-warning/10` respectivamente. Es un cambio visual menor (mismo color base, ligeramente
  distinto de intensidad), lo aviso aquí por transparencia aunque no cambia el comportamiento roto anterior.

Verificado: `tsc --noEmit` limpio (0 errores). Se generó el CSS real con la CLI de Tailwind usando cada
una de las 39 clases `bg|text|border...-x/NN` encontradas por el grep — antes del fix, ninguna se
compilaba; después, las 39 compilan con el valor de opacidad correcto (confirmado leyendo el CSS
generado, no solo asumido). Copiado a esta carpeta. Sigue **sin desplegar** y **sin enviar a Neo** —
pendiente del OK explícito de Daniel (ver `feedback_avisar_antes_de_enviar_a_emergent`).

### Arreglado — de verdad ahora: gráfico de un solo ejercicio seguía sin verse (2026-08-30)

El fix de ayer (`s.label` → `s.key`) era correcto pero no cubría el caso real. Daniel probó en vivo con
dos empresas (CIF A07632987 "MALLA DE SERVICIOS TECNICOS" y CIF A08698060 "PRM INTERNACIONAL", vistas con
su sesión en `beta.arroba.com`) y seguía viendo "Información en preparación · Evolución financiera" en vez
del gráfico.

Investigado en vivo contra `beta.arroba.com` con la sesión real de Daniel (compartida por cookie en la
misma pestaña de Chrome) para ver el dato tal cual llega, no solo el código: `GET
/api/companies/A08698060/section/financial` devuelve `evolution: null` — no un objeto con
`years.length===1`, directamente `null` — pero el mismo payload trae `profit_loss.years: [2024]` con
`revenue: 1.861.978,24 €` y `ebitda: 770.599,86 €` reales para ese único año. Es decir: Intel solo emite
`evolution` cuando hay una serie de años que comparar; con un único ejercicio no hay "evolución" que
calcular y el campo queda `null` — pero la cuenta de resultados de ese año (`profit_loss`) sigue estando
ahí, en el mismo endpoint. El componente (`Resumen()` en `CompanyFichaLayoutV2.tsx`) nunca miraba
`profit_loss`: su cascada de "un solo ejercicio" solo contemplaba (1) `financial.evolution.years.length
=== 1` y (2) el único punto de `financialAnalysis.evolution.points[]` — para estas empresas NINGUNA de las
dos tenía dato, así que caía siempre al estado "Información en preparación", indistinguible de "no hay
ningún dato financiero".

Comprobado que esto no es un caso aislado: de 4 CIFs probados con la sección financial real, 3 tienen
`evolution: null` con `profit_loss` de un solo año (A07632987, A08698060, y hasta TELEFONICA ESPAÑA
FILIALES A80945918) — parece ser el caso más común, no la excepción, así que el impacto de este fix es
amplio.

**Cambio** (`frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx`, función `Resumen()`):
añadida una tercera fuente en cascada, `singleFromProfitLoss`, que lee `financial.profit_loss` cuando
tiene exactamente 1 año y extrae `revenue`/`ebitda` de sus filas (`rows.find(r => r.key === 'revenue' |
'ebitda').values[0].value`). Se usa solo cuando las dos fuentes existentes (evolution / evolution.points)
no tienen dato — no cambia el comportamiento en ningún caso que ya funcionaba. Empresas sin ningún dato
financiero (ej. B63070684, sin `profit_loss` en absoluto) siguen cayendo honestamente a "Información en
preparación" (R15).

Verificado: `tsc --noEmit` limpio. La extracción se probó contra la respuesta real de
`/api/companies/A08698060/section/financial` (con sesión real, no simulada) — reproduce exactamente
`{year: 2024, revenue: 1861978.24, ebitda: 770599.86}`, los mismos números que trae el backend. Copiado a
esta carpeta. Sigue **sin desplegar** y **sin enviar a Neo** — pendiente del OK explícito de Daniel.

### Arreglado — el buscador solo devolvía 1-5 resultados para sectores no listados, ej. "panaderías", "aceros" (2026-08-30)

Daniel reportó que buscar "panaderías" o "aceros" en el buscador devolvía solo 5 (o menos) resultados,
cuando en realidad hay cientos de empresas en esos sectores. Investigado en vivo contra `beta.arroba.com`
con la sesión real de Daniel.

Causa: `_execute_search_real` (`backend/src/modules/copilot/service.py`) decide si una query es "concreta"
(nombre de empresa) o "categórica" (sector/territorio) con una heurística sintáctica (`is_concrete`): si
tiene ≤3 tokens alfanuméricos y ninguno está en la lista fija `_EXPLORATORY_TOKENS` (que ya incluye
"hoteles", "sector", "fintech", etc., a mano), se trata como nombre de empresa concreto. "panaderías" y
"aceros" no estaban en esa lista — así que la query se resolvía como intento de nombre de empresa: Intel
devolvía 1-3 coincidencias débiles por similitud de texto, y como eran ≤5 se mostraban directamente como
dropdown de "candidatos", nunca se llegaba a preguntarle a Intel por la taxonomía real de sectores, que sí
reconoce "panaderías" como sector con cientos de empresas reales. El bug no es que faltara "panaderías" en
la lista — es que la lista tendría que crecer para siempre cada vez que a alguien se le ocurriera buscar un
sector nuevo.

**Cambio**: nueva función `_try_taxonomy(q, offset)` que encapsula la llamada a taxonomía de Intel (con su
reintento de variante ya existente) y devuelve `None` limpio si Intel no reconoce `q` como categoría. En la
rama #4 de `_execute_search_real` (nombre concreto), justo después de comprobar si hay una coincidencia
fuerte y única de empresa (`navigate_to` — ese camino no cambia, sigue sin tocar taxonomía, cero coste
extra), y ANTES de armar el dropdown de candidatos: se prueba taxonomía primero. Si Intel reconoce la query
como sector/territorio, se devuelven los resultados reales y paginados; si no, se sigue igual que antes
(dropdown de candidatos o vacío). La rama #3 (queries ya detectadas como categóricas) usa la misma función,
sin cambio de comportamiento ahí.

Verificado: `python3 -c "import ast; ast.parse(...)"` limpio. El backend no se pudo ejecutar completo en
este entorno (dependencias del `requirements.txt` como `numpy==2.4.2`/`pandas==3.0.1` necesitan Python
≥3.11, no disponible aquí sin permisos de sistema) — en su lugar, reproducción standalone del flujo de
decisión exacto (`_try_taxonomy` + rama #4) con Intel simulado, cubriendo 5 escenarios: "panaderías" (340
resultados reales en vez de dropdown de 3), "aceros" (58 en vez de dropdown de 1), "movistar" (nombre de
empresa con match fuerte — sigue yendo directo, taxonomía nunca se llama, cero coste extra confirmado),
"xyzcorpxyz" (sin match real — sigue devolviendo vacío, no rompe), "hoteles" (ya funcionaba por estar en la
lista fija — sigue funcionando igual, rama #3 sin cambios). Las 5 aserciones pasaron. Copiado a esta
carpeta. Sigue **sin desplegar** y **sin enviar a Neo** — pendiente del OK explícito de Daniel.

### Nuevo — Ficha Territorial (`/territorio/[level]/[code]`) (2026-08-30)

Contexto: Daniel pidió ("en su día ya lo dijimos") que el buscador busque también sectores y territorios,
no solo empresas, cada uno en su propia categoría. Antes de tocar el buscador se le preguntó a dónde debía
llevar cada tipo de resultado al pincharlo: para sectores, a la ficha sectorial ya existente (`/sector/
[code]`); para territorios, confirmó construir una ficha nueva (hoy solo existe el dashboard genérico de
Mapa Empresarial, sin página propia por comunidad/provincia).

Al investigar se confirmó que el backend y el cliente de API para esto YA estaban completamente
implementados y sin usar por ninguna pantalla: `apiClient.marketMap.territory(level, code)` →
`GET /api/market-map/territory/{level}/{code}` y `apiClient.marketMap.crossSectorsIn(geoLevel, geoCode,
limit)` → `GET /api/market-map/cross/sectors-in/{geo_level}/{geo_code}`, ambos con implementación real en
`backend/src/modules/market_map/router.py` y `service.py` (no son stubs). Esto redujo el alcance a una
página nueva de frontend, calcada del patrón ya real de `/sector/[code]/page.tsx`.

**Nuevo archivo**: `frontend/src/app/[locale]/(authenticated)/territorio/[level]/[code]/page.tsx`. Misma
convención visual y de honestidad (R15) que la ficha sectorial: cabecera con breadcrumb (Mapa Empresarial →
[CCAA padre, si es provincia] → nivel), KPIs (índice de dinamismo, empresas activas, tamaño, crecimiento —
este último marcado `Estimado` con tooltip explicando que se deriva del balance de altas/bajas, no de un
indicador económico directo), tarjeta de "Altas y bajas" (INE Demografía Empresarial, real), tarjeta de
"Sectores destacados" con cruce sector×territorio real (enlaza cada sector a su ficha sectorial existente
`/sector/{cnae_section}`), tarjeta de "Provincias" con drill-down solo cuando el nivel es CCAA (enlaza a
`/territorio/province/{geo_id}`), y cierre honesto "Lo que esta ficha todavía no tiene": sin lista de
empresas destacadas por territorio (no existe ese endpoint, a diferencia de sector), sin crecimiento de
EBITDA/ingresos/empleo (el backend reserva los campos pero vienen `null`), sin variación vs. periodo
anterior (los scores no se snapshotean todavía), sin operaciones corporativas nombradas.

Verificado: `tsc --noEmit` limpio sobre todo `frontend/`. Copiado a esta carpeta.

**Completado en el mismo lote** (no quedó pendiente): los chips "Relacionado" de `resultados/page.tsx` ya
navegan a la ficha propia de cada tipo en vez de relanzar una búsqueda de texto. `RelatedEntity.id` trae el
identificador con prefijo de tipo que ya devuelve `entities/service.py` (`cnae:{code}` para sector,
`ccaa:{code}`/`province:{code}` para territorio, el CIF tal cual para empresa) — nueva función
`relatedEntityHref(e)` lo traduce a `/sector/{code}`, `/territorio/{level}/{code}` o `/empresa-f01/{cif}`
según el tipo; para tipos sin ficha propia (ej. `investor`) o con un `id` que no tiene el shape esperado,
cae al comportamiento anterior (relanzar búsqueda) — nunca un enlace roto. Y en `mapa-empresarial/page.tsx`,
`TerritoryRow` ahora tiene el mismo enlace "Ficha →" que ya tenía `SectorRow`, apuntando a
`/territorio/{geo_level}/{geo_id}`.

Verificado: `tsc --noEmit` limpio sobre todo `frontend/` con los cuatro archivos de este lote (ficha
territorial nueva + fix de búsqueda + chips + enlace de fila) ya aplicados juntos. Copiado a esta carpeta.
Sigue **sin desplegar** y **sin enviar a Neo** — pendiente del OK explícito de Daniel.

### Nuevo — loader oscuro "Cargando ficha" (2026-08-30)

Pendiente de una sesión anterior: "íbamos a poner el loader que tenemos en Oportunidades" — se aplicó
primero `LoadingBlock` (skeleton de /oportunidades, opción A de 3 presentadas). Después Daniel pidió el
loader oscuro nuevo, del boceto tipo activación de Oportunidad (`loading_ficha_boceto.html`: insignia con
anillo pulsante, 3 pasos con check, barra de progreso, nota de descarga en PDF).

**Nuevo archivo**: `frontend/src/components/company/FichaLoadingScreen.tsx`. Mismo lenguaje visual que el
boceto, con un ajuste deliberado respecto a la demo: la Ficha carga hoy con UNA sola llamada
(`/api/companies/{cif}/ficha`, agregador B-2.4, identidad + finanzas juntas) — no son 3 llamadas
independientes que resuelven en momentos distintos, así que los 3 pasos no pueden hacer "check" cada uno
con su propia señal real (haría falta que Intel/Beta expusieran 3 endpoints separados, que hoy no existen).
Se mantiene el ritmo visual de 3 pasos por el valor que Daniel aprobó, pero es cosmético — ningún paso
afirma haber verificado nada por separado de los demás. Lo que sí es estrictamente real y se respeta a
rajatabla (mismo criterio que pedía el boceto): el swap a la ficha cargada ocurre en cuanto la llamada real
termina, nunca espera a que el ritmo cosmético complete su ciclo, y la pausa tras completarse es corta y
fija (220ms, solo para que el ojo lo registre) — nunca una espera artificial. Si hay error de carga, se
salta el settle por completo y se muestra el estado de error de inmediato (mostrar los 3 pasos "completos"
antes de un error habría sido falso).

**Cambio** (`CompanyFichaF01Client.tsx`): sustituido `<LoadingBlock/>` por `<FichaLoadingScreen/>` en la
puerta de carga (`fichaLoading`), con un flag `settled` que controla el instante exacto del swap descrito
arriba.

Verificado: `tsc --noEmit` limpio sobre todo `frontend/`. Además, dado que este componente introduce clases
`bg-x/NN`/`border-x/NN`/`text-x/NN` nuevas (`border-arroba-red/40`, `bg-white/10`, `border-white/15`,
`border-white/35`, `text-white/60`, `text-white/70`), se compiló con la CLI real de Tailwind contra este
archivo en concreto para confirmar que las 8 clases de opacidad, `animate-ping`/`animate-pulse` y
`text-balance` generan CSS real — las 8 aparecen, ninguna se pierde silenciosamente (mismo método de
verificación que el arreglo sistémico de Tailwind de arriba). No se pudo levantar un preview en vivo en
este entorno (el frontend no tiene backend local corriendo ni una URL de API configurada por variable de
entorno — depende de un backend propio que no está arrancado). Copiado a esta carpeta. Sigue **sin
desplegar** y **sin enviar a Neo** — pendiente del OK explícito de Daniel.

### Nuevo — `/resultados` con Empresas / Sectores / Territorios como secciones separadas (2026-08-30)

Cierre de lo que Daniel pidió ("en su día dijimos que el buscador también tenía que buscar sectores y
territorios... cada uno debe estar dividido, con categorías diferentes"): confirmó que la tira pequeña de
chips "Relacionado" no era suficiente — quería las tres categorías como secciones separadas y visibles.

**Cambio** (`frontend/src/app/[locale]/(authenticated)/resultados/page.tsx`): `relatedEntities` (que ya
traía sector/territorio/investor vía `entities_service.lookup`, sin cambios de backend) se separa por tipo
en `sectorMatches` / `territoryMatches` / `otherMatches`. Sustituida la tira única "Relacionado" por dos
secciones propias con su título ("Sectores" con icono, "Territorios" con icono), cada una como una lista de
filas (no chips pequeños) que navegan a la ficha real vía `relatedEntityHref` — mismo helper añadido en el
lote anterior. `otherMatches` (tipos sin ficha propia hoy, ej. `investor`) conserva el chip-strip antiguo
bajo el rótulo "Relacionado", para no perder esa información aunque no tenga sección propia. Se añadió
también un rótulo "Empresas" justo encima de la tabla de resultados de siempre, para que las tres
categorías queden visualmente paralelas cuando hay matches de sector/territorio junto a la tabla.

No fue necesario tocar el backend: `entities_service.lookup` ya devolvía los tres tipos con datos reales;
solo hacía falta separarlos y darles su propia sección en vez de una tira compartida.

Verificado: `tsc --noEmit` limpio sobre todo `frontend/`. Clases nuevas (`divide-y`, `divide-border`,
`rounded-[13px]`, `hover:bg-surface-2`) compiladas con la CLI real de Tailwind contra este archivo — las 4
generan CSS real. Copiado a esta carpeta. Sigue **sin desplegar** y **sin enviar a Neo** — pendiente del OK
explícito de Daniel.


## Modo oscuro de la ficha (`.afk`) — fusionado de verdad en el checkout real (2026-09-05)

**Origen:** QA de Daniel sobre la ficha en modo oscuro — la paleta de colores de la ficha
(`fichaMockupCss.ts`, ámbito `.afk`) no tenía ningún override para `[data-dark]`, a diferencia del resto
de la app que sí lo hereda de `tokens.css`. Resultado: textos y fondos ilegibles al activar modo oscuro
dentro de la ficha.

| Archivo | Cambio | Verificación |
|---|---|---|
| `frontend/src/components/company/layout/fichaMockupCss.ts` | Nuevo bloque `[data-dark] .afk{...}`: 11 neutros invertidos (`--n0`...`--n900`) + 4 tintas (`--red-tint`, `--red-tint2`, `--ok-tint`, `--warn-tint`, `--info-tint`), fusionado justo después de la regla `.afk .arrobamark svg{...}`. | `tsc --noEmit` y `eslint` limpios. |
| `frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx` | 5 puntos con color hardcodeado que no usaban `var(--n*)` y por tanto no heredaban el override de arriba: gradiente del shimmer del skeleton de carga, fondo de la tarjeta ".intel", botón de "sig-actions .a", los 2 banners de aviso (`#fff9e6` → `var(--warn-tint)`), y el pill con borde. Localizados por contenido exacto (no por número de línea, que había cambiado por el trabajo de `DealAsideCard` en el mismo fichero — ver más abajo). | `tsc --noEmit` y `eslint` limpios. |

**Pendiente:** solo una pasada visual (capturas con/sin modo oscuro) antes de darlo por cerrado del todo —
recomendable pero no bloqueante, el cambio es mecánico y de bajo riesgo. No desplegado, sin enviar a Neo —
pendiente del OK explícito de Daniel.

## Columna derecha de la ficha (`DealAsideCard`, "próxima acción") — construida y cableada (2026-09-05)

**Origen:** panel diseñado y aprobado con Daniel el 22/08 (mockup `ficha-empresa-f01.html`, `#dealAside`)
para mostrar, en la columna derecha de la ficha, la próxima acción recomendada según 5 perfiles
(Comprador/Vendedor/Busca capital/Asesor/Anónimo) y el checklist de las 8 etapas de `STAGES_V1` de Intel,
con botones de acción de coste en créditos que se bloquean/desbloquean según el paso. Nunca se portó del
mockup HTML al componente React real — la columna derecha real seguía siendo una tarjeta estática
"Pendiente".

**Cambio:** nuevo componente `DealAsideCard` (definido dentro de
`frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx`), puerto 1:1 de la lógica JS del mockup
(`applyPersona()`/`deal()`). Integrado vía un nuevo prop opcional `dealAside?: DealAsideState | null` en
`CompanyFichaLayoutV2`: si viene informado, se renderiza `DealAsideCard`; si no (el caso de hoy, siempre,
porque el endpoint de Intel que lo alimenta — `POST /transaction-intelligence/deal-aside` — todavía no está
desplegado), degrada sin ningún cambio visible a la tarjeta "Pendiente" que ya existía. Cero riesgo de
mostrar datos de ejemplo o rotos en producción mientras Intel no despliegue su parte. Añadidas las 3 reglas
CSS que faltaban en `fichaMockupCss.ts` para los estados de los botones (`.dbtn.locked`, `.locknote`,
`.reports`).

Verificado: `tsc --noEmit` y `eslint` limpios sobre `CompanyFichaLayoutV2.tsx` y `fichaMockupCss.ts`.
Confirmado en vivo (Chrome, sesión de Daniel) que la ficha de Servier sigue mostrando "Pendiente" hoy —
el fallback funciona exactamente como se diseñó, a la espera del endpoint de Intel (ver
`Intel-290826-deploy-pendiente/MANIFEST.md`, entrada 2026-09-05, para el lado de Intel de esta misma
funcionalidad).

**Pendiente:** el prop `dealAside` no tiene todavía quién se lo pase desde el agregador `/ficha` — cuando
Intel despliegue su endpoint, hace falta además cablear la llamada desde Beta (fetch + paso del resultado
como prop). No incluido en este lote porque depende de que el endpoint de Intel exista en producción
primero. No desplegado, sin enviar a Neo — pendiente del OK explícito de Daniel.

## 2026-09-06 · Decisión de Daniel: `viewer_persona` de previsualización — NO se añade

**Contexto:** el pod de Beta propuso (05/09, al cerrar `DealAsideCard`) un endpoint tipo
`/companies/{cif}/deal-aside?viewer_persona=...` en Intel — un adapter puro, sin cálculo, que
forzaría cualquiera de las 5 vistas de persona (comprador/vendedor/busca capital/asesor/anónimo)
sin depender de una transacción real, pensado para QA/demo y activable por feature flag por org.

**Lo que ya existe (independiente de esta propuesta):** Intel ya construyó y tiene listo para
desplegar `POST /api/v1/transaction-intelligence/deal-aside` (ver
`Intel-290826-deploy-pendiente/MANIFEST.md`, entrada 2026-09-05), que calcula la persona real desde
la transacción activa del usuario (`user_id`/`organization_id` → rol/lado real en el workflow) con
el checklist real de `STAGES_V1`. Esto cubre el caso de producción end-to-end; `DealAsideCard` en
Beta ya está cableado para consumirlo (degrada a "Pendiente" si no hay transacción activa).

**Decisión (Daniel, 2026-09-06):** NO añadir el `viewer_persona` de previsualización. El endpoint
real de Intel ya resuelve el caso de producción; el `viewer_persona` es una herramienta de QA/demo,
no una necesidad funcional actual. Se puede retomar más adelante si hace falta previsualizar las 5
vistas sin datos reales — no se descarta, solo se pospone sin fecha.

**Pendiente sigue siendo lo mismo que antes de esta propuesta:** cablear la llamada real desde Beta
al endpoint de Intel una vez esté desplegado (ver entrada anterior, "Columna derecha de la ficha").


## 2026-09-07 · Punto 6 — Territorios/Mercados nunca aparecían junto a Empresas en `/resultados`

**Contexto:** Daniel reportó que `/resultados` mostraba la sección "Sectores" cuando la query
coincidía con un sector, pero nunca "Territorios" (ej. buscar "Sevilla" no daba territorio). Diagnóstico
en vivo contra producción (vía e1_dev, con Intel primero caído — blackout Cloudflare 520 total, luego
recuperado) confirmó el patrón con datos reales: **todo topónimo de una sola palabra** (Madrid, Sevilla,
Cataluña, Andalucía, Barcelona) cae en la rama `disambiguation` de `copilot/service.py::execute_search`
porque también coincide con razón social de empresas reales, y en esa rama `related_entities` nunca se
calculaba — no por fallo de Intel ni del catálogo geo (`geo-intelligence/catalog` responde 200 con
Sevilla/Andalucía correctamente), sino porque el gate `if resp.workspace is not None` solo llamaba a
`_related_entities_chips()` cuando la respuesta primaria era `workspace` (exploratoria), nunca cuando
era `disambiguation`.

**Decisión de Daniel, más allá del parche mínimo:** en vez de solo arreglar el gate, la búsqueda pasa a
tratar Empresas / Territorios / Mercados como **tres preguntas independientes sobre la misma query**, no
como ramas excluyentes — se calculan siempre en paralelo (salvo en navegación directa a ficha exacta,
donde no hay dónde pintarlas). Para "Sevilla": Territorios → Andalucía + Sevilla (dos chips, no uno con
subtítulo); Mercados → vacío (no hay ningún sector llamado "Sevilla"); Empresas → la tabla de siempre,
sin cambios, con las empresas cuyo nombre contiene "Sevilla". "Mercados" es un renombrado puro de
"Sectores" en el UI (mismo dato/tipo `sector` interno vía CNAE, sin fusionar con `investor`).

| Archivo | Qué cambió | Estado |
|---|---|---|
| `backend/src/modules/copilot/service.py` | `execute_search()`: el gate que decidía si se calculaban `related_entities` pasa de `if resp.workspace is not None` a `if resp.navigate_to is None` — se sigue omitiendo solo en navegación directa a ficha exacta (CIF/nombre con 1 match fuerte), que es el único caso sin dónde mostrar chips. Sin cambios en `_execute_search_impl` ni en `_related_entities_chips`. | `ast.parse` OK. Test nuevo añadido (ver abajo) que ejercita exactamente el caso "Sevilla"-como-empresa-y-territorio. |
| `backend/src/modules/entities/service.py` | `_resolve_territory()`: cuando la query matchea una provincia, ahora también añade su comunidad autónoma como entidad `territory` independiente (antes solo aparecía como `secondary_label` de contexto, sin ser un chip navegable por su cuenta). Orden: CCAA primero, luego la provincia. Deduplica si varias provincias coincidentes comparten la misma CCAA, o si la CCAA ya matcheó por nombre propio. | `ast.parse` OK. |
| `frontend/.../resultados/page.tsx` | Renombrado visible "Sectores" → "Mercados" en el encabezado de esa sección (icono `Building2`). Sin cambios de `data-testid`, sin cambios en `sectorMatches`/tipo `sector` interno — es solo la etiqueta que ve el usuario. Comentario actualizado explicando el porqué. | Pendiente `tsc --noEmit` — no se pudo correr en este sandbox (sin deps instaladas ni red). |
| `backend/tests/test_entities_sector_territory.py` | Test `test_resolve_territory_matches_province_with_ccaa_as_secondary` (que asumía 1 solo resultado) renombrado a `test_resolve_territory_matches_province_also_returns_parent_ccaa` y actualizado a 2 resultados (CCAA + provincia, en ese orden). Añadidos `test_resolve_territory_does_not_duplicate_ccaa_for_multiple_provinces` y `test_resolve_territory_ccaa_direct_match_not_duplicated_by_province_loop` para cubrir los casos de deduplicación. | `ast.parse` OK. Pendiente correr con `pytest` de verdad (sin venv en este sandbox). |
| `backend/tests/test_copilot_search_related_entities.py` | Añadido `test_related_entities_present_when_disambiguation_wins`: mockea `entities_service.lookup` devolviendo Andalucía+Sevilla, lanza una query ("studio", substring no-prefijo de una de las 2 empresas sembradas → score 0.7, cae en `disambiguation` con 1 candidato, NO en `navigate_to`) y verifica que `related_entities` viene poblado exactamente con esos 2 resultados aunque `workspace` sea `None`. Docstring del módulo actualizado para reflejar el gate nuevo. | `ast.parse` OK. Pendiente correr con `pytest` de verdad. |

**Pendiente antes de desplegar:**

1. **No se pudo ejecutar el test suite real en este sandbox** (sin venv/deps instaladas, sin acceso a red
   desde el shell de este Mac) — todos los archivos están verificados solo con `ast.parse` (sintaxis
   válida) y revisión manual línea a línea contra el código real leído del checkout. Correr
   `pytest backend/tests/test_entities_sector_territory.py backend/tests/test_copilot_search_related_entities.py`
   (y el resto del suite, por si acaso) en un entorno con dependencias antes de dar esto por bueno.
2. `tsc --noEmit` del frontend tampoco se pudo correr aquí — el cambio es un rename de una palabra en un
   JSX literal, riesgo bajísimo, pero queda pendiente de verificación formal igual que el resto del
   pipeline de este repo.
3. Verificación visual en preview de que "Empresas" (tabla) + "Territorios" + "Mercados" aparecen
   correctamente separados y simultáneos para "Sevilla", "Madrid", etc., una vez desplegado a preview.

**Regla de siempre**: esto se prepara pero no se empaqueta en zip ni se despliega hasta que Daniel lo pida
explícitamente. No se ha enviado nada de esto a Neo/Emergent.


## 2026-09-07 · Punto 9 — Facturación/EBITDA en blanco en resultados de búsqueda (ej. "servier")

**Contexto:** Daniel reportó que buscar "servier" en `/resultados` no mostraba Facturación/EBITDA.
Verificado en vivo contra producción con la sesión real de Daniel (Chrome, ya autenticado): la API
(`POST /api/copilot/skills/search`) SÍ encuentra la empresa — devuelve un candidato de
`disambiguation` con CIF B28184687 — pero ese candidato no lleva ningún campo financiero
(`{master_company_id, cif, name, sector, region}`, nada de `summary`). La tabla de `/resultados` no
tiene de dónde sacar Facturación/EBITDA para esa fila.

**Causa raíz (no un simple olvido, es arquitectónico):** `DisambiguationItem` se diseñó a propósito
para el dropdown compacto del buscador rápido ("dock", `orchestrator/index.ts`) cuando una query de
nombre concreto resuelve a 2-5 candidatos — ahí nunca hicieron falta financials. El endpoint de Intel
que hace ese matching de nombre (`POST /api/v2/company-intelligence/resolve`) es un resolver de
identidad puro (cif, razón social, sector, provincia) — nunca ha devuelto financials, por diseño
(ver `interfaces/resolve.py`, `ResolveMatch`). `/resultados` reutiliza esos mismos candidatos para
pintar la tabla de resultados completa, donde sí hacen falta — de ahí el hueco.

**3 opciones evaluadas con Daniel, se eligió la C:**
- (A, descartada) Enriquecer cada candidato con una llamada individual a
  `financial-intelligence/analyze` — hasta 5 llamadas paralelas por búsqueda. Funciona pero caro.
- (B, descartada) Usar el buscador léxico de `skills/search` en vez de `/resolve` para el matching de
  nombre — una sola llamada, pero el propio código ya documenta (comentario BUGFIX-2026-08-30) que ese
  léxico "fallaba con sectores en inglés y con residuales cortos"; el equipo ya desconfía de él para
  texto libre, así que reutilizarlo para nombres arriesgaba peor precisión justo donde hoy funciona bien.
- (C, elegida) NO tocar `/resolve` (matching de nombre preciso y fiable, sin cambios). Con los 1-5
  `master_id` ya resueltos, una única llamada adicional a `skills/search` filtrando por
  `master_company_ids` (el mismo mecanismo fiable que REQ004b ya usa para acotar por sector, no el
  léxico) para traer sus financials. 1 llamada extra en vez de 5, cero riesgo de degradar el matching.

| Archivo | Qué cambió | Estado |
|---|---|---|
| `backend/src/modules/copilot/service.py` | `_execute_search_real()`: cuando la query resuelve a 1-5 candidatos por nombre (rama `disambiguation`) y `pathname == "/resultados"`, se llama a la nueva función `_enrich_disambiguation_with_financials(candidates)` antes de devolver la respuesta. Si devuelve datos, la respuesta pasa a ser un `workspace` normal con `SearchResultsBlock` (misma forma que cualquier otro resultado exploratorio) en vez de `disambiguation` — **el frontend no necesita ningún cambio**, `fetchResults()` en `/resultados/page.tsx` ya sabe pintar ese shape con `summary` (Facturación/EBITDA) desde que se implementó REQ003. Si `pathname` no es `/resultados` (el dock) o el enriquecimiento falla/no hay datos, el comportamiento es exactamente el de antes (`disambiguation` sin financials) — cero cambio para el dock. Nueva función `_enrich_disambiguation_with_financials()`: una llamada a `POST /api/v1/skills/search` con `query=""` + `filters.master_company_ids=[...]` + `has_domain: false`, mapea cada fila devuelta con `_row_to_item()` (reutilizado, sin duplicar lógica de mapeo). R15: si Intel no trae financials para alguno de los candidatos concretos, esa fila se queda con `summary=None` (la UI pinta "—" honesto) — nunca se fabrica un dato ni se descarta la fila. Si la llamada falla (HTTP error o excepción/timeout), devuelve `None` y el caller sigue con el `disambiguation` sin enriquecer — nunca rompe la búsqueda entera por un fallo de este enriquecimiento. | `ast.parse` OK. Revisión manual línea a línea contra el código real. Pendiente `pytest` real (ver más abajo). |
| `backend/tests/test_copilot_search_disambiguation_enrichment.py` | **Nuevo.** 6 tests para `_enrich_disambiguation_with_financials` mockeando `get_agency_tool_client()` (mismo patrón que `test_entities_investor.py`): caso feliz con 2 candidatos enriquecidos; caso parcial donde Intel no devuelve financials para uno de los dos (queda `summary=None`, R15, no se descarta la fila); fallo HTTP 5xx → `None`; fallo de red/timeout (`AgencyToolHTTPError`) → `None`; sin `master_id` en ningún candidato → `None` sin llamar a Intel; y que acepta tanto el shape plano (`results[]`) como el shape `workspace.blocks[]` que `skills/search` puede emitir (mismo doble-shape que ya tolera `_financial_search_results`). También verifica que la llamada real pide `query=""` + los `master_company_ids` exactos, nunca texto libre. | `ast.parse` OK. |

**Pendiente antes de desplegar:**

1. No se ha podido ejecutar `pytest` de verdad en este sandbox (sin venv/deps instaladas, sin red desde
   el shell del Mac) — verificado solo con `ast.parse` + revisión manual, mismo límite que el resto de
   este paquete. Correr `pytest backend/tests/test_copilot_search_disambiguation_enrichment.py` (y el
   resto del suite) en un entorno con dependencias antes de dar esto por bueno.
2. No se ha podido probar en vivo contra Intel real que `skills/search` con `filters.master_company_ids`
   devuelve financials para IDs sueltos de una búsqueda de nombre concreto (sí está probado que ese
   filtro funciona para scoping sectorial, vía REQ004b, ya en producción) — verificación pendiente una
   vez desplegado a preview: buscar "servier" en `/resultados` y confirmar que la tabla trae Facturación
   164,2 M€ / EBITDA 18,5 M€ (los valores reales, confirmados hoy en la ficha de Laboratorios Servier).
3. El frontend (`resultados/page.tsx`) no se ha tocado para este punto — a propósito, no hace falta,
   pero conviene confirmar visualmente en preview que no hay ninguna suposición implícita en el `Row`
   mapping que rompa con este nuevo shape (debería ser indistinguible de un resultado exploratorio
   normal para el usuario).

**Regla de siempre**: esto se prepara pero no se empaqueta en zip ni se despliega hasta que Daniel lo
pida explícitamente. No se ha enviado nada de esto a Neo/Emergent.


## 2026-09-07 · Pulido UI/UX "Cargando ficha" (FichaLoadingScreen) — 5 puntos

**Contexto:** Daniel adjuntó 2 capturas de `beta.arroba.com/empresa-f01/B91296129` y pidió 5
retoques sobre la pantalla de carga de la Ficha (`FichaLoadingScreen.tsx`, boceto aprobado
2026-08-30): (1) el loader estaba siempre oscuro, debía seguir el tema activo; (2) los dos
primeros pasos cosméticos ("Cargando identidad", "Calculando indicadores") pasan en un parpadeo
y luego se queda "parado" en el tercero, donde de verdad se espera la llamada real; (3) el
titular mostraba el CIF, debía mostrar el nombre de la empresa; (4) el destello del icono de
cabecera debía ser más explícito, y el mismo efecto debía aplicarse también al icono del paso
que está activo en cada momento; (5) el mensaje "Recuerda: ..." del pie era fijo, debía ser
configurable y rotar en bucle.

**Principio que NO se ha tocado (documentado en la cabecera del propio archivo desde 2026-08-30):**
el swap de esta pantalla a la ficha real ocurre en cuanto `ready` es real — nunca se añade una
espera artificial para "hacer que algo tarde más". Esto afecta directamente al punto 2: no se ha
alargado el tiempo real de espera del paso 3, se le ha dado vida visual (progreso que sigue
avanzando + destello) para que dejara de leerse como "parado", sin fingir un trabajo que no está
pasando.

| Archivo | Qué cambió | Estado |
|---|---|---|
| `frontend/src/components/company/FichaLoadingScreen.tsx` | Reescritura completa. **(1) Tema:** todos los colores hardcodeados oscuros (`var(--neutral-900/950)`, `text-white`, `border-white/N`, `bg-white/10`) sustituidos por los tokens semánticos ya existentes en `tokens.css` (`--surface-elevated`, `--surface-muted`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-default`) vía sus clases Tailwind — estos tokens ya cambian solos con `[data-dark]` en `<html>`, así que la tarjeta ahora seguirá el tema activo sin lógica nueva. El rojo de marca no cambia (por diseño, ver `tokens.css`). **(2) Ritmo:** `STAGE_DELAY_MS` pasó de `[900, 1400]` a `[1700, 2300]` (los dos primeros pasos ya no pasan en un parpadeo). Para el tercer paso (el que espera la llamada real) se añadió un progreso "reptante": la barra avanza desde un 70% hacia un techo del 93% con un `setInterval` de aproximación asintótica (nunca llega a fingir el 100%, R15), y el icono del paso activo pulsa con el nuevo efecto de destello — ataca la queja de "se queda parado" sin inventar una demora que no existe en el backend. **(3) Nombre de empresa:** nuevo prop opcional `companyName`; si viene informado se muestra como titular y el CIF pasa a ser una línea secundaria pequeña (no se pierde el dato); si no, cae al comportamiento anterior (CIF como titular). **(4) Destello explícito:** el aro pulsante de cabecera se reforzó (doble aro + mayor opacidad) y se añadió un nuevo efecto de "latido" (`animate-icon-glow`, ver `tailwind.config.ts`) tanto en el badge de cabecera como en el icono del paso activo — antes este último solo tenía un punto diminuto parpadeando; ahora muestra el icono real del paso en rojo de marca, con el mismo destello. **(5) Mensajes "Recuerda":** ya no hay un único texto fijo — nuevo prop opcional `tips` (array de strings) con valor por defecto exportado `DEFAULT_FICHA_LOADING_TIPS` (3 mensajes), que rota cada 3.2s en bucle mientras la pantalla está visible; respeta `prefers-reduced-motion` (si está activo, se queda fijo en el primer mensaje, igual que el resto de animaciones del componente). También se añadió un reset del ritmo cosmético (`stage`/`creepPct`/`tipIndex`) cuando cambia `cif`, por si el padre reutiliza el componente para navegar entre fichas sin desmontarlo (no estaba cubierto antes). | `tsc --noEmit -p tsconfig.json` sobre el proyecto completo: **0 errores** (tras un primer fallo por `noUncheckedIndexedAccess` en 3 accesos a `STAGE_MILESTONE_PCT[...]`, corregido con fallback `?? 0`). `eslint` sobre los 4 archivos tocados: **0 avisos**. Esta es la primera vez en este paquete de fixes que se ha podido correr el compilador TypeScript real completo (antes solo `ast.parse` para Python) — el Mac de Daniel sí tenía `node_modules` instalado para el frontend. |
| `frontend/src/components/company/CompanyFichaF01Client.tsx` | Punto (3): nuevo SWR hook `resolveInfo` que llama a `apiClient.companies.resolve(cifUpper)` (nuevo método, ver fila siguiente) — gateado solo por `isAuthenticated` (a propósito, NO por `deferredReady` como `marketReading`/`succession`/`rollup`: aquellas esperan a que la ficha termine porque no son críticas para el primer pintado, esta SÍ hace falta mientras todavía carga, es justo lo que alimenta el titular del loader). `.catch(() => null)` — un fallo aquí nunca bloquea ni retrasa la ficha real, en el peor caso se ve el CIF como antes. El nombre resuelto (`resolvedCompanyName`) se pasa como nuevo prop `companyName` a `<FichaLoadingScreen>`. | `tsc`/`eslint` limpios (ver arriba). |
| `frontend/src/lib/api/client.ts` | Nuevo método `companies.resolve(cif)` — llama a `GET /api/companies/{cif}/resolve`, endpoint YA EXISTENTE (Sprint F0.2, `PublicResolveResult`, cacheado, requiere sesión) — **sin cambios de backend**, es pura integración de frontend. | `tsc`/`eslint` limpios. |
| `frontend/src/lib/companies/types.ts` | Nueva interfaz `CompanyResolveResponse` (mismo shape que `PublicResolveResult` del backend: `cif`, `resolved`, `canonical_name`, `match_type`, `score`, `engine_version`). | `tsc`/`eslint` limpios. |
| `frontend/tailwind.config.ts` | Punto (4): nuevo keyframe `iconGlow` (pulso de sombra roja EN BUCLE, `infinite` — a diferencia de `sectionPulse`, que ya existía pero es de un solo disparo) y su utilidad `animate-icon-glow`, reutilizada en los dos icono (cabecera + paso activo) tal y como pidió Daniel ("no solo en ese icono, sino también en el icono en el que está en ese momento cargando"). | `tsc`/`eslint` limpios. |

**Pendiente antes de desplegar:**

1. Verificación visual en preview: confirmar en pantalla (no solo por código) que el loader se ve
   claro en tema claro y oscuro en tema oscuro, que los 3 pasos se sienten mejor repartidos, que
   el nombre de la empresa aparece (usuario autenticado) para un CIF real, que el destello se
   percibe claramente más explícito, y que los mensajes "Recuerda" rotan.
2. El nuevo hook `resolve` depende de que el usuario esté autenticado (`isAuthenticated`) — para
   un visitante anónimo, el titular seguirá mostrando el CIF (comportamiento anterior, sin
   regresión, pero conviene confirmarlo visualmente también en el flujo anónimo).
3. No se ha podido ejecutar la suite de tests de frontend (Jest/Vitest, si existe) en este
   sandbox — sí se ha corrido `tsc --noEmit` (proyecto completo, 0 errores) y `eslint` (archivos
   tocados, 0 avisos), que es más cobertura de la que se ha podido conseguir para cualquier fix
   anterior de este paquete, pero no sustituye a tests de comportamiento si existen.

**Regla de siempre**: esto se prepara pero no se empaqueta en zip ni se despliega hasta que Daniel
lo pida explícitamente. No se ha enviado nada de esto a Neo/Emergent (esta tarea es 100% Beta
frontend, no toca Intel).
