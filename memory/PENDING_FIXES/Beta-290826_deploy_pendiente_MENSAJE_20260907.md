# Mensaje para Neo (pod de Beta) — despliegue del backlog acumulado en `Beta-290826-deploy-pendiente`

> **Autorización de despliegue (Daniel, 2026-09-07):** aplicad y desplegad todo el contenido de
> `Beta-290826-deploy-pendiente/` (adjunto en el zip `Beta-290826_deploy_pendiente_20260907_092134.zip`).
> Es el backlog acumulado desde el 2026-08-28 — varios bloques distintos, cada uno ya verificado con
> `py_compile`/`tsc --noEmit`/`eslint` (y en algunos casos probado en vivo contra producción). El propio
> `MANIFEST.md` incluido en el zip tiene el detalle completo de cada cambio, archivo por archivo — este
> mensaje es solo el índice + las instrucciones de aplicación.

## Antes de nada — un aviso importante

Dos de los bloques de abajo (**"Modo oscuro de la ficha"** y **"DealAsideCard"**, ambos del 2026-09-05)
están confirmados HOY en vivo en producción (verificado con la sesión real de Daniel en Chrome), aunque
el MANIFEST los liste como "sin desplegar, pendiente del OK". Es decir: probablemente ya los tenéis
aplicados por otra vía y este envío sería un no-op para esos dos — **comparad primero contra vuestro HEAD
actual antes de sobrescribir nada** (misma disciplina que ya seguimos con Intel). Si vuestro HEAD ya
coincide con estos ficheros, saltáoslos sin problema. Si no coincide, avisadme antes de decidir cuál de
las dos versiones es la buena.

Para el resto de bloques no tengo confirmación en vivo de si ya están o no en producción — aplicad la
misma regla: comparad contra HEAD, y si algo ya está igual, no hace falta tocarlo.

## Índice del backlog (orden cronológico)

| # | Bloque (fecha) | Resumen |
|---|---|---|
| 1 | Hotfix urgente — build roto del zip `Beta-160826` (28/08) | 5 fixes puntuales (2 TS + 3 Python/tests) que desbloqueaban `yarn build` y `pytest` en el pod. Recomendación ya dada: aplicar literal, sin rehacer el diagnóstico. |
| 2 | Ficha Sectorial — cableado real (29/08) | Nueva página `/sector/[code]` + 3 endpoints nuevos en `market_map` (detalle de sector, empresas destacadas, radar de señales). Todo real contra Intel, sin datos inventados; huecos documentados en la propia pantalla. |
| 3 | 3 bugs de UX del preview de Neo (29/08) | "agencias marketing" sin resultados correctos (taxonomía), contador de resultados desincronizado durante la carga, columna "Actualizado" quitada del set visible por defecto. |
| 4 | Corrección — revertido el parche del bug de taxonomía (29/08, mismo día) | El bug de "agencias marketing" se arregló mejor en el origen (Intel, ver su MANIFEST) — se revirtió el parche duplicado en Beta para no tener dos sitios resolviendo lo mismo. |
| 5 | Verificación operativa Mapa Empresarial + Ficha Sectorial (29/08) | Re-chequeo tras los cambios del día — sin drift entre checkout y staging, router registrado en `main.py`, tipado limpio. Informativo, no añade código nuevo. |
| 6 | App Shell — sidebar real, sustituye a `AuthHeader` (29/08) | Sidebar persistente con 3 pilares + Mi espacio + tema/idioma + menú de identidad. 7 archivos nuevos/tocados. Incluye 3 sub-entregas el mismo día: sidebar NO en `/onboarding`, mapa SVG de España en Mapa Empresarial, y sidebar añadido también a Ficha de Empresa/Mapa/Sector/Resultados (con `mv` de esas rutas a `(authenticated)`). |
| 7 | Logo de la home + columna "Actualizado" persistida (29/08) | Logo real (`/brand/logo.png`) en vez de placeholder de texto; clave de `localStorage` subida a `v2` para descartar sets de columnas viejos que arrastraban "Actualizado". (Un tercer punto — buscador de la home para anónimos — quedó sin aplicar, pendiente de que Daniel elija entre 2 opciones de producto; no está en este paquete.) |
| 8 | Gráfico vacío en Resumen para empresas de un solo ejercicio (29/08) | Fix de una línea (`s.label` → `s.key`) en el mapeo a `singleExerciseFromEvolution`. |
| 9 | Loader de Oportunidades reutilizado en la Ficha (29/08) | Sustituye un `<Spinner/>` suelto por el loader ya existente de `/oportunidades` (opción A de 3, luego reemplazado por el loader oscuro del bloque 13). |
| 10 | Clases `bg-x/NN` transparentes + gráfico de altas/bajas en Mapa Empresarial (29/08) | Bug de Tailwind (variantes de opacidad sin soporte RGB) que afectaba a varios sitios de la app, no solo Mapa Empresarial. |
| 11 | Gráfico de un solo ejercicio, de verdad esta vez (30/08) | El fix del bloque 8 era correcto pero no cubría el caso real probado en vivo con 2 empresas concretas — fix adicional sobre el mismo componente. |
| 12 | Buscador con solo 1-5 resultados para sectores no listados, ej. "panaderías"/"aceros" (30/08) | Bug de cobertura en el buscador para sectores fuera de una lista corta. |
| 13 | Ficha Territorial nueva — `/territorio/[level]/[code]` (30/08) | El buscador ahora también resuelve territorios (no solo empresas/sectores), con su propia ficha de destino. |
| 14 | Loader oscuro "Cargando ficha" (30/08) | Precursor del `FichaLoadingScreen` que hoy (bloque 18) se ha retocado en 5 puntos — boceto aprobado, insignia + 3 pasos + barra de progreso. |
| 15 | `/resultados` con Empresas / Sectores / Territorios como secciones separadas (30/08) | Cierre del pedido de que el buscador categorice sus 3 tipos de resultado visiblemente, no solo con chips "Relacionado". |
| 16 | **Modo oscuro de la ficha (`.afk`) (05/09)** — **ver aviso arriba, probablemente ya en prod** | Override `[data-dark]` para la paleta de la ficha (antes ilegible en modo oscuro) + 5 colores hardcodeados corregidos en `CompanyFichaLayoutV2.tsx`. |
| 17 | **`DealAsideCard`, columna derecha "próxima acción" (05/09)** — **ver aviso arriba, probablemente ya en prod** | Puerto 1:1 del mockup aprobado el 22/08. Degrada a "Pendiente" (sin romper ni inventar datos) mientras el endpoint de Intel (`/transaction-intelligence/deal-aside`) no está desplegado — pendiente de cablear la llamada real desde Beta una vez Intel despliegue su parte. |
| 18 | Decisión — NO se añade `viewer_persona` de previsualización (06/09) | Informativo, sin código: Daniel decidió no construir el endpoint de previsualización por persona; no requiere ninguna acción de deploy. |
| 19 | Punto 6 — Territorios/Mercados no aparecían junto a Empresas en `/resultados` (07/09) | Bug de `related_entities` en `execute_search()` — territorios/mercados quedaban fuera cuando la búsqueda encontraba empresas. |
| 20 | Punto 9 — Facturación/EBITDA en blanco en resultados de búsqueda, ej. "servier" (07/09) | Nueva función `_enrich_disambiguation_with_financials()` en `copilot/service.py`: cuando una búsqueda de nombre resuelve a 1-5 candidatos, se enriquecen con una llamada adicional a `skills/search` filtrada por `master_company_ids` (sin tocar el matching de `/resolve`). 6 tests nuevos. |
| 21 | Pulido UI/UX "Cargando ficha" — 5 puntos (07/09, hoy) | `FichaLoadingScreen.tsx` ahora sigue el tema activo (antes siempre oscuro), reparte mejor los tiempos de los 3 pasos cosméticos, muestra el nombre real de la empresa en vez del CIF (nuevo uso de `GET /api/companies/{cif}/resolve`), destello más explícito en el icono de cabecera y en el del paso activo, y mensajes "Recuerda" configurables en bucle. Primera vez en todo este backlog que se ha podido correr `tsc --noEmit` real sobre el proyecto completo (0 errores) y `eslint` (0 avisos). |

## Cómo aplicarlo

1. Descomprimid `Beta-290826_deploy_pendiente_20260907_092134.zip` — cada archivo mantiene la ruta
   relativa real del checkout (`frontend/...`, `backend/...`).
2. Para cada archivo, comparad contra vuestro HEAD actual antes de sobrescribir. Si hay diferencias que
   NO se explican por lo descrito en el `MANIFEST.md` incluido (por ejemplo, algo que hayáis tocado
   vosotros después de la fecha de esa entrada), parad y avisadme antes de decidir qué versión es la buena
   — no fusionéis a ciegas.
3. Los bloques 16 y 17 (modo oscuro, DealAsideCard) es muy probable que ya los tengáis — verificadlo antes
   de aplicar nada ahí (ver aviso arriba).
4. Tras aplicar: `py_compile` en los ficheros Python tocados, `yarn tsc --noEmit` en el frontend completo,
   `pytest` en los tests nuevos/tocados (bloque 1 y bloque 20 traen tests propios).
5. Build + `sudo supervisorctl restart frontend` en el pod, o "Save to GitHub → Deploy" en el panel
   Emergent (el proceso habitual, según `Beta-290826/DEPLOY_NOTES.md`).
6. Confirmadme cuando esté desplegado — lo compruebo en vivo en producción (misma disciplina que con
   Intel: nunca me fío de un reporte de "ya está" sin verlo yo mismo funcionando).

**Nota sobre el bloque 17 (`DealAsideCard`):** su cableado con Intel sigue incompleto por diseño — el
endpoint real de Intel (`POST /transaction-intelligence/deal-aside`) es un paquete de deploy aparte (ver
mensaje/paquete de Intel), y hasta que ese esté en producción, `DealAsideCard` seguirá degradando a
"Pendiente" sin mostrar nada roto ni inventado. No hace falta ni conviene esperar a Intel para desplegar
esto de Beta — son independientes.
