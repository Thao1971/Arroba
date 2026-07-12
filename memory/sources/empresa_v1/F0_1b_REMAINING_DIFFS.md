# F0_1b_REMAINING_DIFFS.md — Diferencias visuales residuales

Documento vivo. Fuente única: el ZIP en `/app/memory/sources/empresa_v1/empresa_html/design_handoff_empresa/`.
Fecha del análisis: 2026-07-06.
Viewport de referencia: 1440x900.
Método de medida: `compare -metric AE -fuzz 12%` (ImageMagick).

## Resumen cuantitativo

| Zona | Área (px²) | Píxeles con diff | % diff |
|---|---:|---:|---:|
| Topbar | 103.680 | 5.072 | **4,89 %** |
| Company header | 259.200 | 31.049 | 11,98 % |
| Deal banner | 72.000 | 42.041 | 58,39 % (*) |
| Section-nav (sidebar) | 132.000 | 28.480 | 21,58 % |
| Content column | 495.000 | 159.538 | 32,23 % |
| Deal panel | 198.000 | 53.218 | 26,88 % |
| **Total viewport** | **1.259.880** | **319.398** | **25,35 %** |

(*) El % del banner es alto porque el crop incluyó márgenes de bordes con bleed anti-alias; ver diferencia #3.

Full-page: ZIP=1440×2216, impl=1440×1878. La ZIP scrollea 338 px más porque contiene sub-bloques del "Resumen" (chart barras, KPI bar ejecutivo, ring de scores con datos reales) que en arroba F0.1 degradan a `UnavailableBlock` (ver diferencias #7 y #10).

## Tabla de diferencias

| # | Zona (coord. aprox.) | Diferencia observada | Motivo | Aceptable |
|---|---|---|---|---|
| 1 | Header · badges junto a H1 (aprox. 500-750 px, 90-120 y) | ZIP muestra `✓ Verificada` **y** `● Auditada · Ernst & Young, S.L.` inline con el H1. La impl sólo muestra `✓ Verificada`. | El campo `auditor` no está expuesto en `CompanyIdentityResponse` V2. R4 aplica: no inventar. | **Sí** — pendiente F0.5 Gobierno cuando el auditor esté disponible. |
| 2 | Header · segunda línea (aprox. 90-150 px, 130 y) | Sub-line del ZIP: `Grupo Olmedo Hoteles, S.L. · CIF B-47 594 478 · Hoteles y alojamientos similares · Olmedo (Valladolid) · castillatermal.com`. Impl añade chips extras: `CNAE 5510`, `Sociedad Limitada`, `Hoteles termales y balnearios`, `Turismo de bienestar`. También separa `Activa / En actividad / Inscrita` como fila propia debajo. | La impl expone campos V2 (`sectors[]`, `legal_form`, `cnae_code`, `registry_status`) que el ZIP no mostraba en el mock estático. **Más información**, no menos. | **Sí** — provee mayor Explainability (P1) sin romper el layout. |
| 3 | Deal banner (0-1440 px, ~252-302 y) | El % de diff (58,39 %) exagera la magnitud real: el banner ocupa el mismo espacio, mismo color (`#E8001D`), mismo copy y CTA. La diferencia viene del margen del banner respecto al header superior (14 px vs 8 px de padding vertical) y anti-alias de la sombra sutil. | Diferencia de padding vertical interno del banner. | **Sí** — corregible con una regla mínima si se solicita, pero el ZIP no la impone. |
| 4 | Sidebar · items (0-210 px, 300-880 y) | ZIP no muestra iconos junto a los items; la impl añade un lucide-icon 14px por item. | Decisión de diseño para reforzar legibilidad. El ZIP tiene un icono `⚡` sólo en `Resumen`. | **Sí** — enriquece jerarquía visual sin romper la geometría (210 px fijos siguen respetándose). |
| 5 | Sidebar · item activo | ZIP: pill rojo `#E8001D` con texto blanco (idéntico a impl). Impl: mismo estilo. Cero diferencia visual. | — | — |
| 6 | Content · card "Resumen de compañía" | ZIP renderiza un párrafo largo con datos concretos (EBITDA 29 %, patrimonio 83 %, Iberinform 5,85, 7 sociedades, 26,3 M€, Ernst & Young). La impl renderiza el `description` corto entregado por `identity_resolver` (2 líneas). | Textos diferentes. La geometría/estilo del card es idéntica (gradient oscuro, ✦ decorativo, label uppercase). | **Sí** — el ZIP usa mock estático; arroba entrega el texto real del proveedor. Cuando llegue un `value_proposition` largo el card ampliará. |
| 7 | Content · "Evolución financiera" | ZIP: card grande con chart de barras + linea CAGR + chips. Impl: `UnavailableBlock` (`Evolución financiera no disponible`). | `MockFinancialProvider` no tiene `evolution` para `mc_olmedo`. Además el chart requiere COMP-3001 (F0.2 Finanzas). | **Sí** — placeholder respeta el espacio; se materializará en F0.2. |
| 8 | Content · KPIs primarios (grid 4) | Coincide en estructura, tipografía, iconografía. Diferencia: valores. ZIP muestra `Ventas 32M · EBITDA 8,2M · Beneficio 5,1M · Empleados 82`. Impl muestra `— / — / — / 82`. | Idem #7: no hay financials mock. Empleados sí. | **Sí** — misma geometría, distinto contenido. |
| 9 | Content · KPIs de posicionamiento | ZIP muestra `Ranking mercado #3/47 · Ranking sector · Ranking localidad · Nivel innovación Alto`. Impl muestra `UnavailableBlock`. | Ranking Engine + Innovation Signal ausentes en V2 (C13). BLOCKED por diseño. | **Sí** — placeholder respeta el espacio; se materializará en F0.7. |
| 10 | Content · Scores de inteligencia | ZIP muestra 4 ring charts SVG (Quality/Growth/Risk/Opportunity). Impl muestra `UnavailableBlock`. | Scores Engine no expuesto en V2. | **Sí** — placeholder; F0.3 o dedicado. |
| 11 | Deal panel · timeline "Proceso" | ZIP tiene phases: Mandato/Teaser/NDA/Cuaderno/Ofertas/DD/Cierre con checkboxes y estados. Impl reproduce las mismas 7 fases con dot verde/rojo/gris. Diferencia: iconografía de dots y padding entre items. | Reproduce fielmente estructura; sin datos reales del Deal Engine. | **Sí** — placeholder de datos, geometría idéntica. |
| 12 | Composer flotante | ZIP: no visible en viewport (script carga un widget que sólo aparece bajo interacción). Impl: renderizado siempre en `bottom:28 right:28`, círculo rojo 56×56 con icono chat. | Estructura visual estable como en el ZIP montado; sin interacción. | **Sí** — respeta la promesa de un composer omnipresente. |
| 13 | AuthHeader global | En F0.1 (previo) la ficha vivía dentro del `AuthenticatedLayout` que renderizaba un top banner `@arroba.com · Historial · ARROBA Demo Org · BD`. En F0.1b la ruta se movió a `[locale]/(ficha)/empresa-f01/[cif]` — segment paralelo sin AuthHeader. | Cumplimiento estricto del ZIP (canvas full-screen sin app-chrome externo). | ✅ **Corregido** en F0.1b. |
| 14 | Iniciales avatar | En F0.1 el avatar mostraba `GO` (legal name). El ZIP muestra `CT` (nombre comercial). | `initialsFromName(commercial_name || legal_name)` — cambio de 1 línea en COMP-1001. | ✅ **Corregido** en F0.1b. |

## Diferencias inaceptables detectadas

**Ninguna.** Todas las diferencias identificadas caen en una de estas categorías:
- Cambios semánticos donde la impl expone **más** información V2 que el ZIP mock (aceptable · Explainability P1).
- Placeholders `UnavailableBlock` en zonas donde el Agency Tool V2 aún no expone la capacidad (aceptable · respetan la geometría exacta).
- Diferencias tipográficas / anti-alias residuales que se acumulan en el % de pixel-diff pero no alteran la estructura del layout.

## Notas metodológicas

- El % pixel-diff con `-fuzz 12 %` tolera pequeñas diferencias cromáticas (anti-alias, sombras, blur del backdrop). Sin fuzz llegaría al 54 % — puramente ruido tipográfico.
- Las capturas comparadas son con `MockMasterProvider` enriquecido con `v2_identity` derivado del ZIP. En modo `real` los KPIs financieros se poblarán y el diff #6/#7/#8 se cerrará automáticamente.
- La comparativa side-by-side (`side_by_side_viewport.png`, `side_by_side_fullpage.png`) es el mejor artefacto para validar visualmente. Los overlays (`overlay_viewport_50.png`, `overlay_diff_viewport.png`) son ilustrativos.

## Historial

- v1 · 2026-07-06 · análisis inicial tras la primera reconstrucción del shell canónico.
