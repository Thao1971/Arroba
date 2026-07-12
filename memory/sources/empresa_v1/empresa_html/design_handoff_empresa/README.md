# Handoff: Ficha de Empresa (Empresa.html) — arroba.com

## Overview

Esta es la **ficha de empresa** de arroba.com: la vista central donde cualquier
usuario (comprador, inversor, advisor, propietario) analiza una compañía española
concreta. Cubre identidad, finanzas (P&L / balance / cash flow / ratios),
valoración por múltiplos, propiedad, gobierno corporativo, posición de mercado,
rankings, comparativa competitiva, señales de inteligencia, oportunidades,
registros públicos y documentos descargables — más un "Copilot" conversacional
transversal y un panel de "Operación activa" que cambia según si la compañía
está en venta, comprando, buscando financiación o fusionándose.

Los datos mostrados son los de una compañía real de validación —
**Grupo Olmedo Hoteles, S.L. / Castilla Termal Olmedo** — usados para comprobar
que el modelo de datos (Iberinform + KPIs calculados por Arroba + señales
inferidas) encaja con la arquitectura de la ficha. En producción, `company/ce-data.js`
y `company/cp-data.js` deben sustituirse por datos vivos desde el backend, con la
misma forma (shape) que se describe más abajo.

## About the Design Files

Los archivos de este paquete son **referencias de diseño construidas en HTML +
React (vía Babel standalone, sin build step)** — prototipos que muestran el
aspecto y comportamiento pretendidos, no código de producción para copiar
literalmente. La tarea es **recrear este diseño en el stack real del proyecto**
(React con bundler, Vue, etc., usando sus propios patrones, gestión de estado y
llamadas a API) — o, si no existe stack aún, elegir el más adecuado. No cargues
React/Babel por CDN en producción: aquí se usa así solo para poder previsualizar
sin build step.

## Fidelity

**Alta fidelidad (hifi)**: colores, tipografía, espaciados e interacciones son
los finales del sistema de diseño de arroba.com. Debe recrearse con precisión
visual, mapeando estos valores al sistema de componentes real del codebase de
destino.

## Cómo está montado (sin build step)

`Empresa.html` es un único punto de entrada que carga, en este orden:

1. React 18 + ReactDOM + Babel standalone (CDN, con SRI) — **sustituir por
   bundler real en producción**.
2. `company/cp-data.js` — datos maestros de la compañía (identidad, accionistas,
   participadas, gobierno). Namespace global: `window.CP_DATA`.
3. `company/ce-data.js` — datos extendidos específicos de esta ficha (finanzas,
   ratios, radar de mercado, rankings, comparativa, oportunidades, documentos,
   navegación). Namespace global: `window.CE_DATA`.
4. `company/cp-charts.jsx` — gráficos y utilidades compartidas (EvolutionChart,
   CompetitiveRadar, ScoreRing, RadarTip, AskAdvisor, iconos `CPIcon`).
5. `company/ce-advisor.jsx` — lógica del "Company Advisor" contextual (preguntas
   sugeridas por sección + contexto por estado de operación).
6. `company/ce-deal.jsx` — panel derecho "Operación activa" + banner superior;
   contiene los 5 escenarios de proceso M&A (`DEAL_SCENARIOS`).
7. `company/ce-sections1.jsx` — Resumen, Valoración (interactiva).
8. `company/ce-finanzas.jsx` — sección Finanzas completa (4 bloques × 4 niveles
   de disclosure).
9. `company/ce-sections2.jsx` — Propiedad, Gobierno, Mercado, Rankings,
   Transacciones.
10. `company/ce-comparativa.jsx` — sección Comparativa (universo de comparables,
    resumen, posicionamiento, hidden gems, targets, white space, mapa de
    oportunidades, brechas, matriz de diferencias, oportunidades de valor,
    conclusiones).
11. `company/ce-sections3.jsx` — Señales, Oportunidades, Registros públicos,
    Documentos.
12. `company/ce-app.jsx` — shell de la app: navegación superior, cabecera de
    compañía, navegación lateral por secciones, orquestación de todas las
    secciones anteriores. Punto de montaje: `ReactDOM.createRoot(#root)`.
13. `assets/arroba-composer.js` — Copilot flotante transversal a toda la
    plataforma (vanilla JS, no React). Se auto-inyecta en el `<body>`.

Todos los componentes se registran en `window` al final de cada archivo
(`Object.assign(window, {...})`) porque cada `<script type="text/babel">` tiene
su propio scope aislado. **Al recrear esto con un bundler real, esto debe
convertirse en imports/exports de módulos ES normales** — el uso de `window` es
solo un artefacto de la falta de build step en el prototipo.

## Screens / Views (secciones dentro de la ficha)

La ficha es una **single-page app con navegación por estado interno**
(`section`, en `ce-app.jsx`), no rutas de URL reales. Cada sección es un
componente que recibe los datos globales (`C` = `CP_DATA`, `E` = `CE_DATA`) y a
veces `go` (función para navegar a otra sección).

### 1. Resumen (`resumen`, `SecResumen` en ce-sections1.jsx)
- **Propósito**: responder en <10s "¿quién es, dónde está, cuánto factura,
  cuánto gana" + veredicto de Arroba.
- **Layout**: hero oscuro con resumen generado ("Resumen de compañía"), bloque
  de evolución financiera (gráfico barras+línea + CAGR), grid de 4 KPI cards
  (Ventas/EBITDA/Beneficio neto/Empleados, cada uno con variación YoY ▲/▼),
  grid de 4 KPIs de posicionamiento (ranking mercado/sector/localidad/
  innovación, marcados ✦ inferidos), card de Identificación (razón social, CIF,
  forma jurídica, CNAE, domicilio, capital social, web, teléfono...), 4 Scores
  de inteligencia (Quality/Growth/Risk/Opportunity) como anillos SVG animados
  (se rellenan progresivamente al montar, con tooltip explicando el cálculo de
  cada score).
- **Interacción clave**: hover en cualquier card = halo rojo sutil + elevación
  (`.ce-card:hover` en `<style>` de Empresa.html).

### 2. Finanzas (`finanzas`, `SecFinanzas` en ce-finanzas.jsx)
- **Progressive Disclosure en 2 ejes**: selector de **bloque** (Cuenta de
  resultados / Balance / Cash Flow / Ratios) × selector de **nivel** (1
  Ejecutiva, 2 Negocio, 3 Detalle, 4 Evolución).
- Selector de **ejercicio** (año) arriba a la derecha — hoy solo 2024 es real
  (auditado); 2020-2023 son una serie **ilustrativa** claramente marcada, para
  que el selector ya funcione cuando lleguen más años reales.
- Cada bloque siempre muestra primero un **`IntelCard`** ("Inteligencia
  Arroba", fondo oscuro): resumen ejecutivo (máx. 3 líneas), aspectos
  positivos/atención, badge de tendencia (positiva/estable/negativa),
  comparación sectorial, y un toggle **"¿Por qué Arroba dice esto?"** que
  revela las evidencias/fórmulas.
- Nivel 1 (Ejecutiva): KPIs + 1-2 gráficos (waterfall para P&L/cashflow,
  composición para balance, barras de percentil para ratios). Nivel 2
  (Negocio): categorías grandes agrupadas, sin cuentas individuales. Nivel 3
  (Detalle): tabla contable completa fila a fila. Nivel 4 (Evolución): tabla
  comparativa multi-año lado a lado (individual y consolidado).
- Cada celda de detalle puede llevar un badge de **origen del dato**:
  Recibido / Calculado / Estimado ✦ (componente `SrcBadge`).
- CTA "Preguntar sobre las finanzas" (`AskAdvisor`) abre el Copilot con una
  pregunta precargada.

### 3. Valoración (`valoracion`, `SecValoracion` en ce-sections1.jsx)
- Aproximación de valor **interactiva por múltiplos**, no una calculadora fija.
- Controles: **Tipo de comprador** (Financiero ×1,00 / Estratégico nacional
  ×1,10 / Estratégico internacional ×1,20 — factor sobre el múltiplo),
  **EBITDA base** (Reportado / Ajustado con campo numérico editable de
  normalizaciones / Media de 3 ejercicios), slider de **múltiplo EV/EBITDA**
  (4x–11x).
- 3 cards de igual altura: Posicionamiento (Quality Score + percentiles),
  Parámetros, Enterprise Value (escenarios Bajo/Medio/Alto en filas, con
  pulso rojo al recalcular).
- Bloques adicionales: Múltiplos de la categoría (P25/Mediana/P75/Sugerido),
  Benchmark radar vs. mediana de categoría + tabla de diferencias, Metodología
  de valoración colapsable (fórmulas exactas), CTA final "Solicitar valoración
  avanzada" (75 créditos, fondo oscuro).
- **Regla de negocio**: NUNCA mostrar EV/DCF/comparables como si fuera una
  valoración formal ya realizada — todo lleva el disclaimer "estimación
  orientativa, no una valoración formal".

### 4. Propiedad (`propiedad`, `SecPropiedad` en ce-sections2.jsx)
- Accionistas (barra apilada + lista con %, destacando control ≥50%) y
  Participadas (grid de cards). **Toda empresa (no persona física) es un
  enlace clicable** a `Empresa.html` (hover rojo + icono de enlace).

### 5. Gobierno (`gobierno`, `SecGobierno` en ce-sections2.jsx)
- Separado visualmente en Consejo / Dirección / Apoderados / Auditor.
  Cada persona (no entidad) lleva un **icono de LinkedIn** que abre una
  búsqueda por nombre (no hay URLs de perfil reales en el dataset).

### 6. Mercado (`mercado`, `SecMercado` en ce-sections2.jsx)
- Radar competitivo (empresa vs. mediana del sector) + tooltips `RadarTip`
  explicando cómo se calcula cada dimensión (Calidad, Crecimiento, Salud
  financiera...) + minigráficos barra empresa vs. marca de mediana.

### 7. Rankings (`ranking`, `SecRanking` en ce-sections2.jsx)
- 4 cards (Mercado / Sector / Localidad / Nivel de innovación), cada una con
  anillo de progreso, tooltip de metodología, y un desplegable **"Ver top 10"**
  con el leaderboard completo — cada fila es un enlace a la ficha de esa
  empresa, y la propia compañía aparece resaltada en rojo como "(tú)" en su
  posición real (las listas están ordenadas descendentemente por valor).

### 8. Comparativa (`comparativa`, `SecComparativa` en ce-comparativa.jsx)
Sección más rica, con hilo narrativo: **¿con quién comparo? → ¿dónde estoy? →
¿en qué soy mejor o peor? → qué oportunidades tengo? → qué debería hacer?**
- **Universo de comparación**: por defecto ya viene construido por IA
  ("Universo de comparación: N empresas · Construido automáticamente por
  Arroba Intelligence" + botón "Modificar universo"). Al pulsarlo se despliega
  el selector de 5 modos: ✨ Comparables IA, 🎯 Competidores directos, 🚀
  Aspiracionales, ★ Empresas seguidas, ➕ Selección manual (con buscador +
  chips removibles + "Guardar universo").
- Resumen ejecutivo: percentiles clave + FODA (Fortalezas/Debilidades/
  Oportunidades).
- Posicionamiento competitivo frente al universo seleccionado (radar +
  comparables listados).
- Hidden Gems / Targets interesantes / White Space (3 cards).
- Mapa de oportunidades: scatter Revenue vs. Margen EBITDA con 4 cuadrantes de
  color (Oportunidad alta / Competido / Poco atractivo / Saturado), hover con
  tooltip por punto, la propia empresa destacada; leyenda "Cómo leer las
  zonas" al lado.
- Brechas de posicionamiento: barras por percentil + badge Alta/Media/Baja.
- Matriz de diferencias vs. tu empresa: tabla con celdas coloreadas
  (verde=mejor, rojo=peor, gris=similar).
- Comparativa financiera vs. Mediana/Top25/Top10/Líder.
- Gaps competitivos: cards 🟢 ventaja / 🔴 desventaja / 🟡 similar.
- Oportunidades en términos de valor ("Si alcanzara X → +N M€"), nunca en
  términos de carencia.
- Conclusiones del Copilot (qué mejor hace / qué preocuparía a un comprador /
  dónde hay potencial / de quién aprender / a quién adquirir) + CTA "Activar
  oportunidad".

### 9. Señales (`senales`, `SecSenales`), Oportunidades (`oportunidades`,
   `SecOportunidades`), Registros públicos (`registros`, `SecRegistros`),
   Documentos (`documentos`, `SecDocumentos`) — en ce-sections3.jsx
- Señales: lista de inferencias con confianza (Alta/Media/Baja) en lenguaje
  condicional ("podría presentar...").
- Oportunidades: cards con tipo de operación, confianza, valor potencial,
  "heat", descripción y origen de la señal (siempre trazable a datos reales).
- Registros públicos: BORME + estado de cuentas depositadas — **sin lenguaje
  técnico interno** visible al usuario.
- Documentos: lista descargable. Los gratuitos (Informe ejecutivo, Informe
  financiero, Aproximación de valor) y los premium marcados con precio en
  créditos ✦ (Memoria Mercantil 8,5, Rating de morosidad 8,5, Valoración
  avanzada 75).

## Cabecera de compañía y navegación (ce-app.jsx)

- **Top bar** (72px alto): logo (enlace a Home), nav Analiza/Valora/
  Compra-Vende, toggle de tema claro/oscuro (persistido en `localStorage`
  `arr-dark`), avatar de usuario.
- **Cabecera de compañía**: breadcrumb, logo/iniciales, nombre + nombre
  comercial + badge "✦ Verificada" + badge "Auditada · {auditor}", datos
  identificativos en una línea, acciones secundarias (Guardar/Seguir/
  Compartir — estado local, no persistido), fila de "✦ Oportunidades"
  (chips clicables que navegan a la sección Oportunidades), y los 2 CTAs
  primarios: **"✦ Activar oportunidad"** (rojo, siempre visible) y
  **"Reclamar empresa"** (outline, para el propietario/representante real).
- **Banner de proceso activo** (`DealBanner`, justo debajo de la cabecera):
  visible solo si `deal !== 'none'`; color y mensaje dependen del escenario
  actual.
- **Navegación lateral** (sticky, agrupada en "Perfil" / "Inteligencia" /
  "Fuentes", definida en `CE_DATA.nav`): resalta la sección activa en rojo.
- **Columna derecha** (`CEDeal`, sticky): panel de "Operación activa" — ver
  estados abajo. Aquí también vive, quitado del flujo, el switcher de
  `deal` usado solo para **validar el diseño** (no debe llegar a producción
  tal cual; el estado real debe venir del backend).

## Estados de "Operación activa" (lo más importante para el backend)

El estado se controla con una única variable `deal` (`ce-app.jsx`, hoy un
`useState` local con un switcher de validación — **en producción debe ser un
campo real de la entidad Compañía/Oportunidad en el backend**, con valores:

| valor          | Significado                                      | Contraparte    |
|----------------|---------------------------------------------------|----------------|
| `none`         | Sin proceso M&A activo (estado por defecto)        | —              |
| `venta`        | Proceso de venta / entrada de socio abierto        | "el vendedor"  |
| `compra`       | Mandato de compra (buy & build) activo             | "el comprador" |
| `financiacion` | Ronda de financiación (equity/deuda) abierta        | "el inversor"  |
| `fusion`       | Explorando una fusión con actor complementario      | "la contraparte" |

Cada estado (`DEAL_SCENARIOS` en `company/ce-deal.jsx`) define:
- `label`/`short`/`color`/`bg`/`bd`/`icon`: apariencia del banner y del panel.
- `headline`: texto explicativo del proceso.
- `terms`: pares clave-valor mostrados como ficha resumen (tipo de proceso,
  participación, asesor, rango orientativo...).
- `actions`: lista de CTAs contextuales (ej. Descargar NDA, Solicitar cuaderno
  de venta, Hacer match, Presentar una oportunidad, Solicitar dossier de
  inversión, Explorar encaje estratégico). Cada acción tiene un id, label,
  texto de confirmación tras ejecutarla (`done`), icono, y si es `primary`.
  **Acciones sensibles (NDA, match, compartir información) deben abrir un
  modal de confirmación humana explícita antes de ejecutarse** — en el
  prototipo se simulan con un cambio de estado local, en producción deben
  llamar al backend real.
- `timeline`: pasos del proceso con estado `done`/`active`/`todo`, mostrados
  como línea de tiempo vertical.

Cuando `deal === 'none'`, el panel derecho muestra en su lugar las acciones
"frías" de descubrimiento: Crear oportunidad, Valoración avanzada (75
créditos), Descargar informe del registro, Descargar informe de riesgo,
Comparar con similares, Contactar con la compañía (con tooltip explicando que
dispara un email automatizado invitando a la empresa a la plataforma, y
badge "✦ Posible match"), bloque "Qué haría arroba" con recomendación
condicional, y "Reclamar mi empresa".

## Company Advisor / Copilot (dos capas — no confundir)

1. **`company/ce-advisor.jsx`**: lógica de preguntas sugeridas *específicas de
   esta ficha* según la sección activa y el estado de `deal` (`DEAL_CTX`,
   `DEAL_Q`). Se usa vía el componente `AskAdvisor` (en `cp-charts.jsx`), que
   dispara un evento `arr-advisor-ask` con la pregunta precargada.
2. **`assets/arroba-composer.js`**: el Copilot flotante **transversal a toda
   la plataforma** (un único composer, no uno por página). Escucha los
   eventos `arr-advisor-focus`/`arr-advisor-ask` disparados por (1). Si la
   página expone `window.CP_DATA`/`window.CE_DATA` (como esta ficha), el
   composer construye automáticamente un resumen real de la compañía (nombre,
   sector, ventas, EBITDA, margen, empleados, scores) y lo inyecta como
   contexto del sistema antes de llamar a `window.claude.complete(...)` — en
   producción esto debe sustituirse por una llamada real al backend/LLM con
   ese mismo contexto. Contraído por defecto (icono `@` en la esquina), se
   expande al usarlo o al recibir un evento.

## State Management (resumen para recrear en un framework real)

- `section` (string): sección activa de la ficha. Controla qué componente se
  renderiza y qué item del nav lateral está resaltado. Candidato a reflejarse
  en la URL (`?section=finanzas`) en producción para deep-linking.
- `deal` (string enum, ver tabla arriba): estado del proceso M&A de la
  compañía. Debe venir del backend, no ser editable por el usuario común (el
  switcher visible hoy es solo una herramienta de validación de diseño).
- `dark` (boolean): tema, persistido en `localStorage` bajo `arr-dark`
  (compartido con el resto de la plataforma).
- `saved`/`following` (boolean, locales): estado de "Guardada"/"Siguiendo" —
  en producción debe persistir por usuario en backend.
- Dentro de Finanzas: `blockId` (pnl/balance/cashflow/ratios), `level`
  (1-4), `year` (ejercicio seleccionado).
- Dentro de Valoración: `ebitdaMode`, `ajuste` (número editable), `buyer`,
  `mult` (slider), `showMethod` (toggle metodología).
- Dentro de Comparativa: `grupo` (universo seleccionado), `editing` (si el
  panel de universo está expandido).
- Dentro de Rankings: `open` por card (si el top 10 está expandido).

## Design Tokens

Definidos como CSS custom properties en `<style>` de `Empresa.html`
(`:root` y `[data-dark]` para modo oscuro):

- **Color**: `--red: #E8001D` (marca, constante en ambos temas), `--text:
  #0C0C0E` / `#FAFAF8` (claro/oscuro), `--bg`, `--surface`, `--surface-2`,
  `--border`, `--border-strong`, `--text-muted`, `--text-subtle`. Semánticos
  usados inline: éxito `#1A8A4A`, aviso `#D97708`, info `#2164E3`, violeta
  `#7C3AED` (para acentos secundarios en gráficos).
- **Tipografía**: Space Grotesk (`--font-display`, títulos), DM Sans
  (`--font-body`, cuerpo), JetBrains Mono (`--font-mono`, todas las cifras
  financieras, con `font-variant-numeric: tabular-nums`).
- **Radios**: 8-9px inputs/botones, 11-15px cards, full para pills/avatares.
- **Sombras**: sutiles, nunca de color (excepto el halo rojo de hover en
  `.ce-card:hover`).
- **Formato de datos**: miles con punto, decimales con coma, fechas
  DD/MM/AAAA (`toLocaleString('es-ES')`).

## Assets

- `uploads/logo.png`: logo de arroba (fondo transparente); se invierte con
  `filter: brightness(0) invert(1)` en modo oscuro.
- Iconos: sistema propio `CPIcon` (SVG inline, stroke 1.5-2px, en
  `cp-charts.jsx`/`ce-sections1.jsx` — buscar `CP_ICON_PATHS`), no es una
  librería externa.
- Emoji usados deliberadamente como parte del contenido (💎 🎯 🚀 ✦ 🟢 🔴 🟡),
  no como iconografía de UI genérica.

## Files

```
Empresa.html                  — entry point, monta <div id="root">
company/cp-data.js            — CP_DATA: identidad, accionistas, participadas, gobierno
company/ce-data.js            — CE_DATA: finanzas, ratios, radar, rankings, comparativa,
                                 oportunidades, documentos, nav
company/cp-charts.jsx         — gráficos y helpers compartidos (charts, iconos, AskAdvisor)
company/ce-advisor.jsx        — preguntas sugeridas contextuales por sección/estado de deal
company/ce-deal.jsx           — DEAL_SCENARIOS + panel "Operación activa" + DealBanner
company/ce-sections1.jsx      — Resumen, Valoración
company/ce-finanzas.jsx       — Finanzas (4 bloques × 4 niveles)
company/ce-sections2.jsx      — Propiedad, Gobierno, Mercado, Rankings, Transacciones
company/ce-comparativa.jsx    — Comparativa (universo, resumen, posicionamiento, gaps...)
company/ce-sections3.jsx      — Señales, Oportunidades, Registros públicos, Documentos
company/ce-app.jsx            — shell: top bar, cabecera, nav lateral, montaje React
assets/arroba-composer.js     — Copilot flotante transversal (vanilla JS)
uploads/logo.png              — logo
```

## Preguntas abiertas para el equipo de backend

1. ¿De dónde viene el campo `deal` (estado del proceso M&A) — tabla propia de
   "Oportunidad/Mandato" vinculada a la compañía, o campo directo en la ficha
   de empresa?
2. ¿Los "créditos" (Valoración avanzada 75, Memoria Mercantil 8,5, Rating de
   morosidad 8,5) se descuentan de un saldo por usuario/organización en
   tiempo real? ¿Dónde se valida el saldo antes de permitir la acción?
3. ¿El "universo de comparación" en Comparativa (IA/directos/aspiracionales/
   seguidas/manual) se persiste por usuario y compañía, o se recalcula en cada
   visita?
4. Los datos 2020-2023 en Finanzas → Evolución son **ilustrativos** (marcados
   en el propio diseño); confirmar el endpoint que traerá el histórico real
   por ejercicio de Iberinform.
5. Acciones sensibles (Descargar NDA, Hacer match, Contactar con la compañía)
   deben disparar confirmación humana explícita — confirmar el flujo/modal
   exacto y los efectos secundarios en backend (envío de email, creación de
   registro de interés, etc.).
