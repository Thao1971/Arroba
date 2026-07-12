# Contradicciones ZIP ↔ ACC (F0.0)

Matriz de contradicciones estructurales detectadas entre el ZIP oficial (`empresa.zip` → `empresa_html/`) y el ACC (`ACC_v0.1.md`) durante la ingesta canónica del 2026-07-06.

**Regla operativa del usuario**: las contradicciones SE DOCUMENTAN pero NO SE RESUELVEN aquí. Cada una requiere validación humana antes de arrancar el sub-sprint correspondiente.

---

## §1. Cobertura sección por sección (ACC → ZIP)

| Sección ACC | Capítulo | ¿Tiene reflejo visual en el ZIP? | Archivo(s) JSX del ZIP | Notas |
|---|---|---|---|---|
| Header | 4 | ✅ Sí | `ce-app.jsx` (top bar + cabecera) + `ce-sections1.jsx` | Reflejo directo |
| Executive Vista | 5 | ⚠️ **Distribuida, no dedicada** | Métricas en `ce-sections1.jsx` (dentro de Resumen); Copilot en `ce-advisor.jsx` + `arroba-composer.js`; Next Step Panel en `ce-advisor.jsx` | La Vista Ejecutiva NO tiene JSX propio. Sus piezas viven mezcladas con Resumen. Ver §3.a. |
| Perfil / Resumen | 6 (según Índice ACC — inconsistencia declarada) | ✅ Sí | `ce-sections1.jsx` (bloque Resumen) | El ACC declara "6. Perfil" en el Índice pero el capítulo 6 real es Finanzas (COMP-3xxx). "Perfil" en el ZIP existe como "Resumen". Ver §3.b. |
| Finanzas | 6 (cuerpo · COMP-3xxx) | ✅ Sí | `ce-finanzas.jsx` (44 KB · 4 bloques × 4 niveles) | Reflejo directo |
| Valoración | 7 (COMP-4xxx + COMP-0008) | ✅ Sí | `ce-sections1.jsx` (bloque Valoración) | Reflejo directo. COMP-0008 fuera de rango declarado por ACC. |
| Propiedad | 8 | ✅ Sí (visual) / ❌ No (backend) | `ce-sections2.jsx` (bloque Propiedad) | Reflejo visual OK. Backend BLOCKED — Ownership Engine no existe en V2. |
| Gobierno | 9 | ✅ Sí (visual) / ❌ No (backend) | `ce-sections2.jsx` (bloque Gobierno) | idem |
| Mercado | 10 | ✅ Sí | `ce-sections2.jsx` (bloque Mercado) | Reflejo directo |
| Rankings | 11 | ✅ Sí (visual) / ❌ No (backend) | `ce-sections2.jsx` (bloque Rankings) | Backend BLOCKED — Ranking Engine no existe en V2. |
| Comparativa | 12 | ✅ Sí | `ce-comparativa.jsx` (36 KB dedicado) | Reflejo directo |
| Señales | 13 | ✅ Sí | `ce-sections3.jsx` (bloque Señales) | Reflejo directo |
| Oportunidades | 14 | ✅ Sí | `ce-sections3.jsx` (bloque Oportunidades) | Reflejo directo |
| Registros Públicos | 15 | ✅ Sí (visual) / ❌ No (backend) | `ce-sections3.jsx` (bloque Registros) | Backend BLOCKED — Registry Engine no existe en V2. |
| Documentos | 15 | ✅ Sí (visual) / ❌ No (backend) | `ce-sections3.jsx` (bloque Documentos) | Backend BLOCKED — Document Engine dedicado no existe en V2. |
| Next Best Actions | 16 | ✅ Sí (parcial) | `ce-advisor.jsx` (preguntas contextuales + acciones) | Reflejo parcial; `ce-advisor.jsx` cubre parte de la funcionalidad NBA junto con el Copilot. |

**Conclusión §1**: 13 secciones del ACC tienen reflejo visual en el ZIP. La sección "Perfil" del Índice ACC no aparece con ese literal en el ZIP (está como "Resumen").

---

## §2. Componentes en el ZIP NO catalogados en el ACC

| Elemento visual del ZIP | Archivo(s) JSX | Motivo de contradicción |
|---|---|---|
| **Panel "Operación activa" / Deal Panel** | `ce-deal.jsx` (20 KB) | No tiene COMP-ID declarado en el ACC. Aparece prominentemente en el layout canónico 3-col como columna derecha sticky. El ACC menciona "deal" en 5 preguntas abiertas del handoff pero no lo cataloga como componente. |
| **Sección "Transacciones"** | `ce-sections2.jsx` (bloque Transacciones) | Aparece renderizada en el ZIP dentro de `ce-sections2.jsx` (junto a Propiedad/Gobierno/Mercado/Rankings), pero el ACC NO lista un capítulo "Transacciones" ni componentes COMP-XXXX asociados. |
| **`AskAdvisor` inline helper** | `cp-charts.jsx` | Componente utility para preguntar al Advisor desde cualquier sección. El ACC menciona el Advisor genérico (COMP-2002 Arroba Copilot) pero no este helper específico. |
| **`CPIcon` system** | `cp-charts.jsx` (`CP_ICON_PATHS`) | Sistema propio de iconos SVG. El ACC no cataloga la iconografía como componente; probablemente es infraestructura visual, no funcional. |

**Conclusión §2**: 2 contradicciones estructurales relevantes (Deal Panel + Transacciones), 2 utilities que probablemente NO requieren COMP-ID.

---

## §3. Componentes en el ACC NO reflejados fielmente en el ZIP

### §3.a · Vista Ejecutiva sin JSX dedicado

El ACC declara la Vista Ejecutiva (Capítulo 5) como una sección compuesta por:
- COMP-2001 Executive Metrics
- COMP-2002 Arroba Copilot
- COMP-2003 Next Step Panel

En el ZIP la Vista Ejecutiva NO tiene un archivo JSX dedicado (no existe `ce-executive.jsx`). Sus piezas viven distribuidas:
- Métricas en `ce-sections1.jsx` (mezcladas con el bloque Resumen).
- Copilot en `ce-advisor.jsx` + `arroba-composer.js` (Composer FAB transversal, no ubicado en la Vista Ejecutiva).
- Next Step Panel en `ce-advisor.jsx`.

**Contradicción**: el ACC modela Vista Ejecutiva como sección independiente con 3 componentes agrupados; el ZIP la disuelve en varias piezas distribuidas. Requiere decisión humana: ¿la implementación agrupa físicamente los 3 componentes en una sección propia (ACC-strict) o los distribuye como el ZIP?

### §3.b · Capítulo "6. Perfil" declarado en Índice ACC pero ausente en cuerpo

El Índice del ACC (línea 108 en adelante) declara implícitamente "6. Perfil" como capítulo con contenido en subsecciones `6.x`. Sin embargo, en el cuerpo del ACC las secciones `6.x` corresponden a Finanzas (COMP-3xxx). Simultáneamente, en el ZIP existe un bloque visual llamado "Resumen" (dentro de `ce-sections1.jsx`) que probablemente es el "Perfil" que el ACC pretende definir.

**Contradicción**: ¿el "Perfil" del Índice ACC = "Resumen" del ZIP? Si sí, requiere que el equipo de producto renumere el Índice del ACC o escriba el capítulo "Perfil". El propio ACC admite esta inconsistencia en su Nota de normalización (línea 227-234).

### §3.c · COMP-5006 Ownership Network (grafo interactivo) sin equivalente pixel-cercano en el ZIP

El ACC declara COMP-5006 Ownership Network como "representación interactiva del Knowledge Graph societario" (línea 9706). En el ZIP el bloque Propiedad (`ce-sections2.jsx`) muestra accionistas y grupo corporativo como listas planas, sin grafo interactivo. La visualización de red podría estar ausente por la naturaleza estática del prototipo o porque la capacidad backend (Knowledge Graph Engine) no existe.

**Contradicción**: ¿el ZIP dejó fuera deliberadamente el grafo hasta que Knowledge Graph Engine esté disponible? Anotado.

### §3.d · COMP-6007 Governance Timeline sin reflejo temporal en el ZIP

El ACC declara COMP-6007 Governance Timeline como "histórico de eventos de gobernanza + eventos BORME". El bloque Gobierno del ZIP (`ce-sections2.jsx`) muestra board members + executives + representatives como listas planas, sin timeline temporal. Similar a §3.c.

### §3.e · COMP-4005 Enterprise Value Bridge / COMP-4006 Scenarios / COMP-4007 Sensitivity

El ACC declara estos 3 componentes de Valoración avanzada. En el ZIP (`ce-sections1.jsx` bloque Valoración) aparece la valoración básica (methods + summary) pero NO se detecta un waterfall/bridge de EV, ni scenarios paralelos, ni matriz de sensibilidad. Consistente con el estado BLOCKED por falta de exposición V2.

### §3.f · Rankings dedicados (COMP-8001, COMP-8002)

El bloque Rankings del ZIP (`ce-sections2.jsx`) muestra rankings sectoriales/regionales. El ACC modela COMP-8001 Rankings Section + COMP-8002 Ranking Cards, pero NO existe endpoint dedicado en V2 (Ranking Engine ausente). La UI puede existir con datos ilustrativos en el ZIP, pero al conectar contra V2 requerirá degradar a UnavailableBlock hasta que el backend exponga capacidad de ranking.

---

## §4. Contradicciones documentales adicionales

### §4.a · Recuento 64 vs 66 declarado por el ACC

El ACC declara "66 componentes" en dos puntos de su Nota de normalización (líneas 208 y 246). La SoT autoritativa (bloques `id: COMP-XXXX`) devuelve **64**. Diferencia +2.

Hipótesis (no validadas):
- Los 2 desaparecidos podrían haber sido eliminados durante la normalización y no actualizado el conteo.
- Podrían corresponder a componentes referidos pero sin bloque de metadata completo (ej. duplicado COMP-9003 se cuenta dos veces).
- Requiere validación humana antes de F0.1.

### §4.b · Reaparición parcial de archivos `cp-*` en el ZIP oficial

Durante el Hito 1 (R13) se movieron a `/app/_legacy/design_intake/company-profile-cpapp/` los archivos `cp-app.jsx`, `cp-charts.jsx`, `cp-data.js`, `cp-journey.jsx`, `cp-profile.jsx`, `cp-sidebar.jsx`, `Company Profile.html` (7 archivos).

El nuevo ZIP oficial de la Ficha de Empresa contiene:
- `cp-charts.jsx` ✅ reaparece como canónico (gráficos + iconografía)
- `cp-data.js` ✅ reaparece como canónico (fixture data)

**Los otros 5 (`cp-app.jsx`, `cp-journey.jsx`, `cp-profile.jsx`, `cp-sidebar.jsx`, `Company Profile.html`) NO reaparecen** — mantienen su estatus legacy. `Empresa.html` es el nuevo entry (no `Company Profile.html`).

**Impacto R13/guard**: la lista `LEGACY_PATTERNS` del guard (`'CPApp'`, `'cp-app'`, `'Company Profile'`) sigue siendo consistente — los patrones bloqueados NO aparecen en el nuevo ZIP. Los nombres `cp-charts` y `cp-data` NO están en la lista, así que su reintroducción como parte del prototipo canónico NO viola el guard. Cuando se reimplementen como componentes React reales, deberán respetar R14 (Un COMP = un componente React) y por tanto se renombrarán a nombres canónicos con COMP-ID.

### §4.c · Preguntas abiertas del handoff (README del ZIP)

El propio ZIP incluye 5 preguntas abiertas del equipo de diseño al backend que requieren respuesta ANTES o durante los sub-sprints correspondientes:

1. **Origen del campo `deal`** (estado M&A): ¿tabla propia "Oportunidad/Mandato" o campo directo en ficha? — bloqueante para Deal Panel (`ce-deal.jsx`).
2. **"Créditos" de acciones sensibles** (Valoración avanzada 75, Memoria Mercantil 8,5, Rating morosidad 8,5): ¿saldo real-time por usuario/organización? ¿Dónde se valida el saldo? — bloqueante para acciones COMP-1004.
3. **Universo de comparación en Comparativa** (IA/directos/aspiracionales/seguidas/manual): ¿persiste por usuario+empresa o se recalcula? — bloqueante para COMP-9001.
4. **Datos 2020-2023 en Finanzas → Evolución** marcados como ilustrativos: confirmar el endpoint que traerá el histórico real por ejercicio.
5. **Acciones sensibles** (Descargar NDA, Hacer match, Contactar): confirmar flujo/modal + efectos backend (envío email, registro de interés, etc.).

---

## §5. Resumen ejecutivo de contradicciones

| # | Contradicción | Severidad | Bloquea sub-sprint |
|---|---|---|---|
| C1 | Recuento 64 vs 66 componentes | Baja | Ninguno |
| C2 | "6. Perfil" en Índice ACC ≠ contenido de capítulo 6 (Finanzas) | Media | F0.2 Perfil |
| C3 | Vista Ejecutiva distribuida en múltiples JSX vs sección dedicada en ACC | Media | F0 futuro (Vista Ejecutiva no está en F0.1) |
| C4 | `COMP-9003` duplicado (Comparable Companies vs Competitive Positioning) | Baja (ACC declara resolución: Competitive Positioning) | F0 futuro Comparativa |
| C5 | `COMP-0008` fuera de rango (aparece en Valoración con id 0008) | Baja | F0 futuro Valoración |
| C6 | `status: Draft` en COMP-2001 (Executive Metrics · aislado) | Baja | F0 futuro Vista Ejecutiva |
| C7 | Deal Panel (`ce-deal.jsx`) sin COMP-ID en ACC | Alta | Cualquier sub-sprint que incluya Deal Panel |
| C8 | "Transacciones" bloque en `ce-sections2.jsx` sin COMP-ID en ACC | Alta | F0 futuro sección Transacciones (fuera de las 13 secciones canónicas) |
| C9 | COMP-5006 Ownership Network sin grafo visual en ZIP | Media | F0 futuro Propiedad (además está BLOCKED por V2) |
| C10 | COMP-6007 Governance Timeline sin timeline visual en ZIP | Media | F0 futuro Gobierno (además está BLOCKED por V2) |
| C11 | COMP-4005/4006/4007 avanzados no visibles en ZIP | Media | F0 futuro Valoración avanzada (además están BLOCKED por V2) |
| C12 | Reaparición de `cp-charts.jsx` + `cp-data.js` en ZIP canónico | Baja | Ninguno (los patrones del guard no chocan) |
| C13 | Rankings visibles en ZIP pero Ranking Engine ausente en V2 | Alta | F0 futuro Rankings |
| C14 | Preguntas abiertas del handoff (5, ver §4.c) | Alta | Deal Panel, Créditos, Universo Comparativa, Histórico Finanzas, Acciones sensibles |

## §6. Regla de resolución

Ninguna contradicción se resuelve en F0.0. Cada sub-sprint F0.x debe:

1. Revisar las contradicciones aplicables a su alcance (columna "Bloquea sub-sprint").
2. Escalar al usuario aquellas de severidad Alta antes de arrancar.
3. Documentar la decisión en el sub-sprint correspondiente.
4. Para contradicciones de severidad Media/Baja no resueltas: implementar el componente como stub `UnavailableBlock` (regla R14 · Un COMP = un componente React) con explicación textual del bloqueante.

## §7. Sub-sprint F0.1 · impacto

Alcance F0.1 = Header + Perfil.

Contradicciones aplicables a F0.1:
- **C2** (Perfil vs capítulo 6 Finanzas) — media · **requiere validación** antes de arrancar F0.1.
- **C14.5** (Acciones sensibles COMP-1004 Quick Actions) — alta · **requiere validación** antes de arrancar F0.1.
- **COMP-1010 User Relationship** BLOCKED por V2 (data interna arroba) — el componente vive en Header pero requiere backend arroba propio.

Recomendación: F0.1 arranca con los COMP-1001, 1002, 1003, 1005 (Header · READY) + Perfil/Resumen. Deja COMP-1004 (Quick Actions) y COMP-1010 (User Relationship) como stubs `UnavailableBlock` hasta validación de C14.5 y provisión de backend arroba.
