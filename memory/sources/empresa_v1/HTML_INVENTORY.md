# HTML Inventory · `sources/empresa_v1/empresa_html/`

Contenido descomprimido del ZIP oficial `empresa.zip` entregado por el usuario el 2026-07-06.

## Estructura completa (paths + tamaño KB)

```
design_handoff_empresa/
├── Empresa.html                              (4 KB)   ← entry point monolítico
├── README.md                                 (24 KB)  ← handoff detallado (tokens, componentes, preguntas abiertas)
├── assets/
│   └── arroba-composer.js                    (16 KB)  ← Copilot flotante (vanilla JS)
├── company/
│   ├── ce-advisor.jsx                        (20 KB)
│   ├── ce-app.jsx                            (12 KB)  ← shell canónico (top bar + cabecera + nav lateral + montaje React)
│   ├── ce-comparativa.jsx                    (36 KB)
│   ├── ce-data.js                            (24 KB)  ← CE_DATA (finanzas, ratios, radar, rankings, comparativa, oportunidades, docs)
│   ├── ce-deal.jsx                           (20 KB)
│   ├── ce-finanzas.jsx                       (44 KB)  ← el más grande, 4 bloques × 4 niveles
│   ├── ce-sections1.jsx                      (40 KB)  ← Resumen, Valoración
│   ├── ce-sections2.jsx                      (32 KB)  ← Propiedad, Gobierno, Mercado, Rankings, Transacciones
│   ├── ce-sections3.jsx                      (20 KB)  ← Señales, Oportunidades, Registros públicos, Documentos
│   ├── cp-charts.jsx                         (24 KB)  ← gráficos + helpers + CP_ICON_PATHS + AskAdvisor
│   └── cp-data.js                            (8 KB)   ← CP_DATA (identidad, accionistas, participadas, gobierno)
├── screenshots/                              (~1.1 MB total)
│   ├── 01-empresa.png (100 KB)   ← Header + Vista Ejecutiva
│   ├── 02-empresa.png (108 KB)   ← Copilot / Next Step Panel
│   ├── 03-empresa.png (104 KB)   ← Perfil (Resumen)
│   ├── 04-empresa.png (100 KB)   ← Finanzas (Cuenta de Resultados)
│   ├── 05-empresa.png (96 KB)    ← Finanzas (Balance + Ratios)
│   ├── 06-empresa.png (96 KB)    ← Valoración
│   ├── 07-empresa.png (92 KB)    ← Propiedad / Gobierno
│   ├── 08-empresa.png (100 KB)   ← Mercado / Rankings
│   ├── 09-empresa.png (100 KB)   ← Comparativa
│   ├── 10-empresa.png (100 KB)   ← Señales / Oportunidades
│   └── 11-empresa.png (100 KB)   ← Registros públicos / Documentos
└── uploads/
    └── logo.png                              (256 KB) ← logo arroba
```

**Total**: 25 archivos · ~1.5 MB descomprimidos.

## `Empresa.html` — análisis detallado

| Campo | Valor |
|---|---|
| Título HTML | `<title>Empresa</title>` (inferido del handoff) |
| Nº líneas | 59 |
| Tipo | **Shell monolítico** — carga React 18 + Babel Standalone (CDN) + los 12 archivos JSX/JS canónicos |
| `<section>` tags | 0 (la UI se monta 100 % desde React en `<div id="root">`) |
| `<header>` tags | 0 (idem) |
| `data-section=` atributos | 0 |
| Comentarios `<!-- Sección -->` | 0 |
| IDs y clases relevantes | `#root` (mount point único) |

**Conclusión sobre segmentación semántica**: el HTML NO segmenta secciones por tags HTML nativos. Toda la ontología de secciones vive en el árbol React de los JSX (`ce-sections1.jsx` = Resumen+Valoración; `ce-finanzas.jsx` = Finanzas; `ce-sections2.jsx` = Propiedad+Gobierno+Mercado+Rankings+Transacciones; `ce-comparativa.jsx` = Comparativa; `ce-sections3.jsx` = Señales+Oportunidades+Registros+Documentos). El shell (`ce-app.jsx`) declara el layout 3-col + nav lateral.

## Assets externos que carga

- **React 18** (CDN Babel Standalone) — cargado desde `<script>`.
- **Fonts**: Space Grotesk, DM Sans, JetBrains Mono (probablemente vía Google Fonts, según README del handoff §Tipografía).
- **`uploads/logo.png`** — logo con `filter: brightness(0) invert(1)` en dark mode.
- **Icons**: sistema propio `CPIcon` (SVG inline con `CP_ICON_PATHS` en `cp-charts.jsx` / `ce-sections1.jsx`). NO librería externa.
- **Emoji deliberados** como contenido semántico (💎 🎯 🚀 ✦ 🟢 🔴 🟡).

## Ontología semántica de secciones — mapeo canónico ZIP → ACC

Cruce entre archivos JSX del ZIP y capítulos del ACC:

| Archivo JSX | Secciones ACC cubiertas |
|---|---|
| `ce-app.jsx` | Shell (Header + Nav lateral + Layout 3-col + Composer FAB) |
| `ce-sections1.jsx` | Capítulo 4 (Header · COMP-1001-1010) + **Perfil / Resumen** + Capítulo 7 (Valoración · COMP-4001-4007 + COMP-0008) |
| `ce-finanzas.jsx` | Capítulo 6 (Finanzas · COMP-3001-3007) |
| `ce-sections2.jsx` | Capítulo 8 (Propiedad · COMP-5001-5006) + Capítulo 9 (Gobierno · COMP-6001-6007) + Capítulo 10 (Mercado · COMP-7001-7007) + Capítulo 11 (Rankings · COMP-8001-8002) + "Transacciones" (categoría sin COMP-ID en ACC · **atención**) |
| `ce-comparativa.jsx` | Capítulo 12 (Comparativa · COMP-9001-9007) |
| `ce-sections3.jsx` | Capítulo 13 (Señales · COMP-10001-10002) + Capítulo 14 (Oportunidades · COMP-11001) + Capítulo 15 (Registros+Documentos · COMP-12001-12005) |
| `ce-advisor.jsx` | Capítulo 5 (Executive Vista · COMP-2002 Arroba Copilot + COMP-2003 Next Step Panel · preguntas contextuales) |
| `ce-deal.jsx` | **Panel "Operación activa" / Deal Panel** (NO tiene COMP-ID explícito en ACC · **atención**) |
| `cp-charts.jsx` | Gráficos y helpers compartidos (utility · sin COMP-ID) |
| `cp-data.js` | Fixture data — identidad, accionistas, participadas, gobierno |
| `ce-data.js` | Fixture data — finanzas, ratios, radar, rankings, comparativa, oportunidades, docs |
| `arroba-composer.js` | Composer / Arroba Copilot (COMP-2002 · vanilla JS, no JSX) |

## Assets del ACC no directamente presentes en el ZIP

El ACC declara la Vista Ejecutiva (Capítulo 5) como **COMP-2001 Executive Metrics + COMP-2002 Arroba Copilot + COMP-2003 Next Step Panel**. En el ZIP la Vista Ejecutiva no tiene un archivo JSX dedicado — sus piezas viven distribuidas: métricas en `ce-sections1.jsx` (dentro de Resumen), Copilot en `ce-advisor.jsx` + `arroba-composer.js`, Next Step Panel en `ce-advisor.jsx`. Ver `CONTRADICTIONS.md`.

## Preguntas abiertas del handoff (README del ZIP)

El propio ZIP incluye 5 preguntas abiertas al equipo de backend que el usuario deberá aclarar antes o durante F0.1/F0.2:

1. Origen del campo `deal` (estado M&A): ¿tabla propia "Oportunidad/Mandato" o campo directo en ficha?
2. "Créditos" de acciones sensibles (Valoración avanzada, Memoria Mercantil, Rating morosidad): ¿saldo real-time por usuario/organización?
3. Universo de comparación en Comparativa: ¿persiste por usuario+empresa o se recalcula?
4. Datos 2020-2023 en Finanzas → Evolución son ilustrativos: ¿confirmar endpoint que traerá el histórico real?
5. Acciones sensibles (Descargar NDA, Hacer match, Contactar): confirmar flujo/modal + efectos backend.

Estas preguntas se recogen en `CONTRADICTIONS.md` como "Preguntas del handoff" y quedan pendientes de decisión humana antes de arrancar los sub-sprints correspondientes.

## SoT del ZIP para la implementación

Cualquier decisión visual/estructural durante Sprint F0.x debe partir de:
1. **Screenshots** (11 PNG) como referencia visual pixel-cercana.
2. **`Empresa.html` renderizado en un browser** con los JSX cargados como referencia interactiva.
3. **README.md del handoff** para tokens (colores, tipografía, radios, sombras).
