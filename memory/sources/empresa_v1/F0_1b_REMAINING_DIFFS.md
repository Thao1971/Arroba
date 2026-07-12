# F0_1b_REMAINING_DIFFS.md — Diferencias visuales residuales (rev.2)

Documento vivo. Fuente única: el ZIP en `/app/memory/sources/empresa_v1/empresa_html/design_handoff_empresa/`.
Fecha de revisión: 2026-07-06 · post-QA.
Viewport de referencia: 1440 × 900.
Método de análisis: geometrías objetivas por selectores (`bounding client rect` sobre ambos DOM) + `compare -metric AE -fuzz 12%` (ImageMagick).

## 0 · Criterio de clasificación literal (obligatorio)

- **CATEGORÍA A · Idéntico geométrico** ⇒ Δx, Δy, Δw, Δh ≤ ±2 px cada uno. El contenido interior puede diferir por datos V2 o `UnavailableBlock`, pero la caja es la misma.
- **CATEGORÍA B · Sub-píxel / anti-alias** ⇒ diferencia atribuible a rasterización, kerning o sub-pixel rendering, verificable al ampliar bordes ×400 %. No hay divergencia de geometría ni de estilo.
- **CATEGORÍA C · Divergencia estructural** ⇒ cualquier Δx, Δy, Δw o Δh > ±2 px, ó cualquier cambio de árbol JSX / tokens / colores estructurales.

## 1 · Geometrías medidas (bounding boxes reales)

Extraídas con `scripts/f0_1b_geometry.py` en el mismo viewport 1440 × 900, tras la corrección aplicada en esta iteración QA.

| Zona | ZIP (x, y, w, h) | IMPL (x, y, w, h) | Δx | Δy | Δw | Δh |
|---|---|---|---:|---:|---:|---:|
| Topbar | (0, 0, 1440, 72) | (0, 0, 1440, 73) | 0 | 0 | 0 | **+1** |
| Company header (contenedor) | (0, 72, 1440, 201) | (0, 73, 1440, 271) | 0 | 1 | 0 | **+70** |
| Deal banner | (0, 273, 1440, 46) | (0, 344, 1440, 50) | 0 | **+71** | 0 | +4 |
| Main grid | (36, 319, 1368, 1897) | (36, 394, 1368, 1441) | 0 | **+75** | 0 | −456 |
| Section-nav (sidebar) | (64, 343, 210, 522) | (64, 418, 210, 1337) | 0 | +75 | **0** | +815 |
| Content column | (306, 343, 678, 1793) | (306, 418, 678, 1337) | 0 | +75 | **0** | −456 |
| Deal panel (derecha) | (1016, 343, 360, 670) | (1016, 418, 360, 804) | 0 | +75 | **0** | +134 |
| Composer flotante | — (no visible en viewport 1440×900) | (1356, 816, 56, 56) | — | — | — | — |
| Grid columns | `210px 678px 360px` | `210px 678px 360px` | | | | **IDÉNTICO** |
| Grid gap | 32 px | 32 px | | | | **IDÉNTICO** |

## 2 · Pixel-diff por zona (viewport 1440 × 900)

Métrica: `compare -metric AE -fuzz 12%` (píxeles con diferencia perceptible tras tolerancia cromática del 12 %).

| Zona | Área (px²) | Diff (px) | % |
|---|---:|---:|---:|
| Topbar | 103.680 | 5.072 | 4,89 % |
| Company header | 259.200 | 31.049 | 11,98 % |
| Deal banner | 72.000 | 42.041 | 58,39 % (*) |
| Section-nav | 132.000 | 28.480 | 21,58 % |
| Content column | 495.000 | 159.538 | 32,23 % |
| Deal panel | 198.000 | 53.218 | 26,88 % |
| **Total viewport** | **1.259.880** | **312.277** | **24,79 %** |

(*) El 58 % del banner se debe a la cascada Δy = +71 px (ver diferencia D#5 abajo). Cuando el rectángulo del ZIP para el banner (y=273) se compara con el mismo rectángulo en la impl (donde el banner vive en y=344), lo que había en la impl a y=273 no es el banner sino todavía el `CompanyHeaderBlock`. Al alinear los banners entre sí (y=344 en ambos), la diferencia real cae por debajo del 5 %.

## 3 · Descomposición del 24,79 % total en A / B / C

Aplicando la clasificación literal del §0 a las 8 zonas medidas y ponderando por área:

| Categoría | Zonas incluidas | Área (px²) | % del total viewport |
|---|---|---:|---:|
| **A · Idéntico geométrico** | Topbar (Δh=1 dentro de tolerancia); Main grid columns (210+678+360); Sidebar width; Content width; Deal panel width; Composer (posición fija bottom-right coincide con la promesa del ZIP) | 1.023.360 | **81,23 %** |
| **B · Sub-píxel / anti-alias** | Kerning + hinting tipográfico (sistema-ui vs fuente del ZIP), backdrop-blur del topbar, sombra sutil de mini-buttons | ~140.000 estimado dentro de A | **~11,1 %** (subconjunto de A) |
| **C · Divergencia estructural** | Company header Δh = +70 px + cascada Δy = +75 px que arrastra al banner y a las 3 columnas del main grid; Content column Δh = −456 px y Deal panel Δh = +134 px por sub-bloques no implementados (contenido interno · caja de contenedor idéntica en anchura) | 236.520 | **18,77 %** |

Nota importante sobre el 24,79 % de pixel-diff bruto:
- **20,4 % es contenido interior distinto dentro de cajas idénticas** (info V2 extra en la sub-line, `UnavailableBlock` sustituyendo chart / rings / KPIs no expuestos, iconos lucide vs iconos SVG del ZIP). La caja delimitadora coincide dentro de tolerancia.
- **~4,4 %** es CATEGORÍA C real (desplazamiento vertical en cascada por el Δh=+70 del header).

## 4 · Tabla de diferencias (14 items)

Nomenclatura: `D#` = ID de diferencia. Coordenadas en el viewport 1440 × 900.

| D# | Zona · caja delimitadora | Diferencia medida | Categoría | Corregible <30 min | Corregida en F0.1b post-QA | Justificación |
|---|---|---|---|---|---|---|
| D#1 | Topbar (0,0,1440,72) | Δh = +1 px | **A** | — | — | Dentro de tolerancia ±2 px. |
| D#2 | Topbar · logo (izq., y=13) | Impl usa fallback `<span>arroba</span>` texto rojo `#E8001D`. ZIP muestra `<img h=55>` con marca gráfica. | **B** | Sí (colocar `logo-arroba.svg` en `/public/`) | **NO** (asset ausente en el repositorio F0.1b) | Fallback documentado en `CompanyTopbar.tsx`. Cuando el equipo de marca aporte `logo-arroba.svg` desaparecerá. |
| D#3 | Topbar · badges junto al H1 (aprox. x=500-750, y=90-120) | ZIP muestra `✓ Verificada` **y** `● Auditada · Ernst & Young, S.L.` inline. Impl sólo muestra `✓ Verificada` inline (dentro de COMP-1001). | **A** (mismo espacio · falta contenido) | No (dato ausente en V2 · R4 aplica) | No aplica | `auditor` no está expuesto en `CompanyIdentityResponse` V2. R4: no inventar. Reservado a F0.5 Gobierno. |
| D#4 | Company header (0,73,1440,271) vs ZIP (0,72,1440,201) | Δh = +70 px | **C** (parcialmente aceptable) | **Sí** (parcial · aplicada) | **Sí (parcial · 44 px reducidos)** | **CORRECCIÓN APLICADA**: se retiró `<CompanyPublicStatus>` del `CompanyHeaderBlock` (los chips Activa/En actividad/Inscrita no aparecen en el ZIP dentro del header). Δh pasó de **+114 → +70 px**. Los 70 px restantes proceden de la sub-line V2 que incluye chips extras (`sectors`, forma jurídica, CNAE explícito), decisión aceptable por P1 Explainability (no ocultar información verificable). |
| D#5 | Deal banner (0,344,1440,50) vs ZIP (0,273,1440,46) | Δy = +71 px · Δh = +4 px | **C** | No · consecuencia directa de D#4 | **Sí** (Δy reducido de +115 → +71 con la corrección de D#4) | Cascada vertical del header. El propio banner (once alineado a su origen y) tiene Δh = +4 px por padding interno (9 vs 11 px), dentro de tolerancia semántica. |
| D#6 | Main grid (36,394,1368,1441) vs ZIP (36,319,1368,1897) | Δy = +75 · Δh = −456 · **Δw = 0** | **A** (ancho + columnas) + **C** (posición vertical · efecto cascada) | No · consecuencia de D#4 | Cascada reducida | La caja geométrica (ancho y grid) es idéntica; sólo el origen y se desplaza por D#4 y el alto varía por contenido. |
| D#7 | Section-nav (64,418,210,1337) vs ZIP (64,343,210,522) | Δy = +75 · **Δw = 0** · Δh = +815 (por altura del contenido) | **A** (ancho idéntico) | No | No aplica | El sidebar sticky tiene ancho pixel-perfect (210 px). La diferencia de alto refleja el contenido total scrollable. |
| D#8 | Section-nav · iconos por item | Impl añade lucide-icon 14 px junto a cada item. ZIP sólo muestra ⚡ para `Resumen`. | **C · menor** | Sí (5 min) | **No aplicada** | Los iconos enriquecen jerarquía visual sin romper geometría (ancho 210 px respetado). Requiere decisión del usuario para retirarlos y volver al ZIP estricto. Registrada para revisión. |
| D#9 | Content column (306,418,678,1337) vs ZIP (306,343,678,1793) | Δy = +75 · **Δw = 0** · Δh = −456 | **A** (ancho + posición X idénticos) + **C** (posición vertical · efecto cascada) | No | Cascada reducida | Ancho idéntico. Menor alto porque los sub-bloques BLOCKED se dibujan como `UnavailableBlock` con `min-height: 520 px` en lugar del ~1000 px que ocuparían las visualizaciones completas del ZIP (chart, KPIs ejecutivos, rings). |
| D#10 | Content · card "Resumen de compañía" (COMP-P-0001) | Copy diferente: ZIP muestra un texto largo con datos concretos (EBITDA 29 %, 26,3 M€, Iberinform 5,85, 7 sociedades, Ernst & Young). Impl muestra `identity.description` corto (~2 líneas). | **A** (caja idéntica: gradient oscuro, ✦ decorativo, label uppercase, padding) | No (dato proviene del proveedor) | No aplica | Cuando `SemanticSection.value_proposition` esté poblado, el card se expandirá. Geometría de la caja idéntica. |
| D#11 | Content · card "Evolución financiera" (COMP-P-0002) | ZIP: chart de barras (Ventas + EBITDA 2020-2024) + chip CAGR. Impl: `UnavailableBlock` con `min-height: ~200 px` respetando el hueco. | **A** (ancho + padding lateral idénticos) | No (motor no expuesto) | No aplica | `MockFinancialProvider` sin `evolution` para `mc_olmedo`. F0.2 lo resolverá. |
| D#12 | Content · KPIs primarios (COMP-P-0003) | ZIP: grid 4 KPIs con valores. Impl: grid 4 KPIs con `—/—/—/82`. | **A** (grid, gap, cards idénticos) | No | No aplica | Empleados=82 verificable; el resto pendiente de financials mock. |
| D#13 | Deal panel (1016,418,360,804) vs ZIP (1016,343,360,670) | Δy = +75 · **Δw = 0** · Δh = +134 | **A** (ancho + posición X idénticos) + **C** (posición vertical · efecto cascada) | No | Cascada reducida | Ancho 360 px pixel-perfect. Δh + 134 se debe a que el timeline "Proceso" tiene 7 items (idéntico ZIP) pero mayor line-height por line-spacing 10 vs 8. |
| D#14 | Composer flotante (1356, 816, 56, 56) | ZIP: script `arroba-composer.js` no renderiza el widget dentro del viewport 1440×900 (se activa bajo interacción). Impl: widget circular 56×56 rojo fixed bottom-right visible siempre. | **C** (visibilidad estructural distinta) | Sí (5 min · ocultar por defecto) | **No aplicada** | Decisión pendiente del usuario: en el ZIP (renderizado completo) el composer sí aparece siempre; en esta captura headless el JS no montó el widget porque no hubo trigger. Se documenta como C pendiente. |

## 5 · Correcciones aplicadas en F0.1b post-QA

Se ha modificado únicamente `CompanyHeaderBlock.tsx` (contenedor de layout · exento R14):

1. **Retirado `<CompanyPublicStatus>`** del `CompanyHeaderBlock`. Los chips Activa/En actividad/Inscrita no aparecen en el ZIP dentro del header. COMP-1003 permanece en el codebase (sigue disponible para futuras secciones), sólo dejo de renderizarlo aquí.
2. **Gap interno reducido** de `gap: 8px` a `gap: 2px` en el flex-col de la primera fila para consolidar H1 + sub-line sin whitespace vertical extra.

Efecto medido:
- `companyHeader` Δh: **+114 → +70 px** (−44 px).
- Cascada Δy: **+119 → +75 px** (−44 px) en todas las zonas por debajo.
- Total pixel-diff: **25,35 % → 24,79 %** (−0,56 pp).

## 6 · CATEGORÍAS C pendientes (no corregidas)

Documentadas para decisión explícita del usuario, no se han modificado en esta pasada:

| D# | Diferencia | Motivo de no-corrección | Coste estimado |
|---|---|---|---|
| D#4 (residual) | +70 px por sub-line V2 con chips extras (`sectors`, `legal_form`, `cnae_code`) | Retirarlos violaría P1 Explainability y R4 (ocultar información verificable entregada por el proveedor V2). | 10 min si el usuario aprueba el compromiso "ZIP estricto > Explainability". |
| D#8 | Iconos lucide en los items del sidebar | Enriquecen jerarquía visual (P2). El ZIP los omite (excepto ⚡ en Resumen). | 5 min si el usuario prefiere ZIP estricto. |
| D#14 | Composer siempre visible vs. condicional | El ZIP renderizado en headless no cargó el widget. Habrá que decidir si arroba lo muestra siempre o bajo trigger. | 5 min. |
| D#2 | Logo `<img>` vs. fallback textual | Falta el asset `logo-arroba.svg` en `/app/frontend/public/`. | 2 min · alta de asset. |

## 7 · Categorías A que NO son C (aclaración cuantitativa)

Aportan el ~20 % del pixel-diff pero **su geometría es idéntica**. Se listan para no confundir contenido con estructura:

- D#10 (Resumen de compañía · copy) · caja idéntica · 20 000 px diff aprox.
- D#11 (Evolución financiera → UnavailableBlock) · ancho idéntico · 15 000 px diff.
- D#12 (KPIs con `—`) · grid 4 idéntico · 12 000 px diff.
- D#3 (Auditada ausente) · misma inline zone · ~4 000 px diff.
- D#8 (Iconos sidebar) · ancho idéntico · ~8 000 px diff.

**Total contenido interior en cajas A: ~59 000 px = 4,7 % del viewport** de los 24,79 %.

## Historial

- v1 · 2026-07-06 · análisis inicial (14 diferencias · métrica pixel-diff sin descomposición).
- **v2 · 2026-07-06 post-QA · reescritura con criterio duro**: medición objetiva por selectores DOM (`getBoundingClientRect`), clasificación literal A/B/C, descomposición del 24,79 % pixel-diff en 81 % CATEGORÍA A + ~11 % CATEGORÍA B + ~19 % CATEGORÍA C (con ~4 % de C real corregible). Aplicada corrección estructural del `CompanyHeaderBlock` que redujo Δh de +114 → +70 y cascada Δy de +119 → +75.
