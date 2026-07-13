# F0_3_LAYOUT_SPEC.md · Ubicación de Valoración en el ZIP y estructura

Fecha: 2026-07-13.
SoT canónico visual: `sources/empresa_v1/empresa_html/design_handoff_empresa/company/`.

## 1 · Ubicación en el ZIP

- Archivo: **`ce-sections1.jsx`** (mismo archivo que `SecResumen`).
- Función: **`SecValoracion({ C, go })`** · líneas 278–528.
- Registro global: `Object.assign(window, { …, SecValoracion })` (línea 529).
- Datos: `window.CE_DATA` (ver `ce-data.js` y `cp-data.js`).
- Helpers reutilizables: `CECard`, `CETitle`, `Eyebrow`, `CPIcon`, `AskAdvisor`, `mono` (font-mono + tabular-nums).

**No existe `ce-valoracion.jsx` estándalone** (confirmado por listado de directorio). Confirma la nota del brief F0.3 §"Fuente visual SoT".

## 2 · Estructura JSX (top-down)

```
SecValoracion
├── CETitle · "Valoración" + subtítulo
├── Disclaimer banner (aviso "Equity Value ajustado…")
├── Row 3 cols (grid 1fr 1.1fr 1.1fr):
│   ├── CECard "Posicionamiento"
│   │   ├── Quality Score card (82/100) + 1.002 comparables
│   │   └── 3 barras P88/P63/P90 (Margen EBITDA / Rev-empleado / Salud balance)
│   ├── CECard "Parámetros"  [INTERACTIVO en ZIP]
│   │   ├── Selector comprador (Financiero/Nacional/Internacional · factor 1/1.1/1.2x)
│   │   ├── Selector EBITDA base (Reportado/Ajustado/Media)
│   │   ├── Input Ajuste (M€) [solo modo Ajustado]
│   │   ├── Slider múltiplo (4x–11x · default 7.9x)
│   │   └── Botón "Recalcular" [pulse animation]
│   └── CECard "Enterprise Value"
│       ├── 3 barras Bajo/Medio/Alto proporcionales
│       └── 3 cards ancho completo (Bajo·EV / Medio·EV / Alto·EV)
├── CECard "Resumen de escenarios" (tabla escenario × múltiplo × EV × Equity)
├── CECard "Múltiplos de la categoría" (4 cards P25/Mediana/P75/Sugerido)
├── CECard "Benchmark frente a la categoría"
│   ├── BenchRadar SVG (Quality Score, Margen EBITDA, Rev/Empleado, Salud Balance)
│   └── Tabla comparativa Empresa vs Mediana + AskAdvisor
├── CECard "Metodología" (colapsible)
│   ├── Quality Score (0-100) definición
│   ├── Cálculo del múltiplo (fórmula)
│   ├── Factor comprador (tabla)
│   ├── Equity Value (aprox.) definición
│   └── EBITDA Ajustado y Media
└── CECard "Valoración avanzada" (dark CTA · gradiente #0C0C0E→#1A1A18)
```

## 3 · Elementos que la implementación F0.3 REEMPLAZA por lectura pura (R15)

Aplicando R15 · P3 · F0.2-OP1..OP6:

| ZIP interactivo | F0.3 implementación |
|---|---|
| Selector comprador (Financiero/Nacional/Internacional) | Eliminado. Motor no expone `buyer_factor`. |
| Selector EBITDA (Reportado/Ajustado/Media) | Eliminado. Motor sólo expone EBITDA reportado del último ejercicio. |
| Slider múltiplo | Read-only chip mostrando el múltiplo del motor (`multiple` + `multiple_basis`). |
| Botón "Recalcular" | Eliminado. Arroba no calcula. |
| Input "Ajustes (normalizaciones)" | Eliminado. |
| P25/Mediana/P75 categoría | UnavailableBlock. Motor no expone. |
| Quality Score global (82) | UnavailableBlock. Motor no expone `quality_score_global`. |
| BenchRadar | UnavailableBlock. Motor no expone `benchmarks[]`. |
| Tabla comparativa Empresa vs Mediana | UnavailableBlock. |
| Escenarios Bajo/Medio/Alto | READ-ONLY 3 puntos derivados de `range.{low, high}` + EV como central. Sin factor comprador. Sin sliders. |

## 4 · Elementos que se preservan tal cual (con datos reales del motor)

- Título "Valoración" + subtítulo.
- Disclaimer banner (aviso).
- CECard "Enterprise Value" · 3 barras Bajo/Medio/Alto proporcionales al `range.high` (COMP-4006 DEGRADED).
- Tabla "Resumen de escenarios" (3 filas · sin `Equity Value` por escenario si el motor sólo da uno).
- CECard "Metodología" (colapsible) · descripción derivada del `multiple_basis` + `hypotheses` + `lineage`.
- CECard "Valoración avanzada" (dark CTA).

## 5 · Layout: geometría preservada

- Grid principal: 3 columnas `1fr 1.1fr 1.1fr` · gap 14px.
- CECard con padding estándar (20-24px) · borderRadius 12-14px.
- Colores canónicos: EV verde `#1A8A4A` · Rango medio azul `#2164E3` · Rango bajo rojo `#E8001D`.
- Fuente monoespaciada para cifras (`ui-monospace` · `font-variant-numeric: tabular-nums`).

## 6 · COMP-0008 (contradicción C5 F0.0)

- El ACC declara COMP-0008 fuera de rango numérico dentro de Valoración.
- El ZIP `SecValoracion` no tiene un bloque visualmente aislado que corresponda a COMP-0008.
- **Decisión operativa**: ignorar COMP-0008 en F0.3. Si al terminar la ficha aparece un bloque visual sin COMP-ID asignado, se abrirá un COMP-P-XXXX provisional en un sub-sprint dedicado.

## 7 · Histórico

- v1 · 2026-07-13 · localización canónica de `SecValoracion` en `ce-sections1.jsx` + mapping ZIP → COMP-4001..4007.
