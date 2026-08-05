# F0.4 — Scout de Layout · Propiedad (Ownership)

**Fecha**: 2026-02-13
**Tipo**: Scouting documental. Cero código. Cero implementación.
**Estado**: Preparatorio · a la espera de autorización explícita del usuario para arrancar Sprint F0.4.
**Regla vigente**: R11 (visual freeze). No se implementa nada sin ZIP mockup + aprobación explícita.

---

## 1 · Ubicación en el ZIP canónico

**Archivo fuente**: `/app/memory/sources/empresa_v1/empresa_html/design_handoff_empresa/company/ce-sections2.jsx`

**Rango de líneas**: L57 – L159 (bloque `SecPropiedad` + auxiliares `OwnerNode`, `Stem`, constante `OWN_COLORS`).

**Registro en `ce-app.jsx`**: L25 · router de secciones
```
propiedad: <SecPropiedad C={C} E={E} go={setSection}/>
```

**Uso de datos (contract shape)**: `C.ownership.shareholders[]`, `C.ownership.participadas[]`, más `C.company.legal`, `C.company.cif`, `C.company.location.city`, `C.company.location.province` (para el nodo central del holding).

---

## 2 · Estructura geométrica del bloque (según JSX)

```
<CETitle sub="Estructura accionarial y empresas participadas..."/>
<CECard pad={24}>
  ├── Row: Eyebrow "Estructura societaria" + AskAdvisor
  ├── TIER 1 · Accionistas
  │     ├── label "Accionistas" + badge count + "· participan en"
  │     ├── Barra proporcional horizontal (height 12, radius 6) — 1 segmento por accionista
  │     └── Grid 4 columnas — OwnerNode (name, sub=role, pct, color, kind, highlight=i===0)
  ├── Stem (h=26)
  ├── CENTRO · Holding node
  │     └── Card gradient (#0C0C0E → #1A1A18) con inicial CT, legal, CIF, ciudad, provincia
  ├── Stem (h=26)
  ├── TIER 2 · Participadas
  │     ├── label "controla a · Empresas participadas" + badge count
  │     └── Grid 4 columnas — card con icono layers, name, activity, % (rojo si ≥50%, ámbar si <50%)
  └── <Implies text="..." cta="Explorar oportunidad" onAction={() => go('oportunidades')}/>
</CECard>
```

---

## 3 · Propuesta de mapeo COMP-XXXX (ACC v0.1)

> El handoff refería `COMP-5001..5007 según F0.0 report`. **No existe F0_0 report en `/app/memory`**. Se propone la siguiente asignación por analogía con F0.2 (`COMP-30xx`) y F0.3 (`COMP-40xx`), sujeta a validación del PM antes de codificar.

| COMP ID    | Componente React (propuesto)             | Fuente JSX (líneas) | Contrato Arroba (requerido)                                              |
|------------|------------------------------------------|---------------------|--------------------------------------------------------------------------|
| COMP-5001  | `PropiedadHeader` (CETitle + sub)        | L91                 | `identity.company.legal`, cadena estática de sub-title                   |
| COMP-5002  | `PropiedadEstructuraCard` (contenedor)   | L93 · L155          | Wrapper — sin datos                                                       |
| COMP-5003  | `PropiedadAccionistasTier` (barra + grid)| L98 – L112          | `ownership.shareholders[] { name, role, stake, kind }`                    |
| COMP-5004  | `PropiedadHoldingNode` (nodo central)    | L116 – L125         | `identity.company.{legal, cif, location.city, location.province}`         |
| COMP-5005  | `PropiedadParticipadasTier` (grid)       | L129 – L154         | `ownership.participadas[] { name, activity, stake }`                      |
| COMP-5006  | `PropiedadImpliesCTA`                    | L155                | `arroba-signals-v1` inferencia + link a sección `oportunidades`           |
| COMP-5007  | `PropiedadDebugSourcesFooter` (convención F0.2/F0.3) | (no en JSX) | Footer estándar Arroba con `sources`, `req_ids`, `timestamp` |

> **Nota (R14)**: cada componente listado arriba debe declarar `@comp COMP-50xx` en su JSDoc si se implementa.

---

## 4 · Contrato de datos requerido — `arroba-ownership-v1` (borrador)

**No existe hoy en el backend**. Estimación de forma mínima basada en el JSX:

```jsonc
{
  "shareholders": [
    {
      "name": "string",
      "role": "string",           // p.ej. "Presidencia", "Familia fundadora"
      "stake": 0.0,               // %
      "kind": "persona | entidad" // controla renderizado de OwnerNode
    }
  ],
  "participadas": [
    {
      "name": "string",
      "activity": "string",
      "stake": 0.0
    }
  ],
  "provenance": {
    "sources": ["registro_mercantil", "..."],
    "as_of": "ISO-8601",
    "req_ids": ["REQ-009"]
  }
}
```

---

## 5 · Estado de disponibilidad en el Agency Tool (a verificar)

- Referencias históricas en `ARROBA_B6F_DESIGN_PROPOSAL_v1.md`:
  - L23: "Secciones `propiedad`, `gobierno`, `registros`, `documentos` — se mantienen como `UnavailableBlock` con REQ-009…".
  - L172 – L176: sección `propiedad` marcada como **diferida a B.6.g/B.6.d** con `<UnavailableBlock req="REQ-009" eta="Sprint 2">`.
  - L271: en la tabla resumen, Propiedad → `UnavailableBlock` REQ-009 · ETA Sprint 2.

**Implicación P0 (bloqueante)**: si el Agency Tool **hoy** no expone accionistas y participadas reales, F0.4 no puede renderizar con datos reales (R15). Escenarios posibles:

1. **A — datos disponibles**: mapear + implementar UI completa.
2. **B — datos parciales**: renderizar tramos disponibles + `UnavailableBlock` en tramos huérfanos.
3. **C — datos ausentes**: sección entera degrada a `UnavailableBlock` REQ-009 hasta que el proveedor lo suministre.

**Acción requerida antes del sprint**: sondeo (equivalente a `F0_2_SONDEO_*.md`) contra `intelligence_layer` para verificar qué expone el Agency Tool en `real` sobre `shareholders` / `participadas`.

---

## 6 · Riesgos y dependencias

1. **Ausencia de F0_0 report**: los IDs COMP-5001..5007 son propuesta, no canon. Requiere ack del PM.
2. **Datos huérfanos (REQ-009)**: alta probabilidad de que la sección degrade en real-mode. R15 aplica.
3. **Links a fichas de participadas**: el JSX enlaza a `Empresa.html`. En Arroba equivale a `/empresa/{cif}`, requiere resolución CIF → fichas hijas (nueva llamada a `ResolverService`).
4. **AskAdvisor**: reutiliza el pattern F0.2/F0.3, sin cambios de contrato.
5. **`Implies` CTA "Explorar oportunidad"**: depende de la existencia del router de sección `oportunidades`, que hoy no está implementado en Arroba.

---

## 7 · Prerrequisitos que aún deben cumplirse

- [ ] Aprobación explícita de F0.3 por el usuario.
- [ ] Decisión sobre sliders del ZIP en Valoración (a/b/c).
- [ ] Decisión sobre bookmark de rango (backlog o descartado).
- [ ] Confirmación del deploy tras `.dockerignore` + `yarn.lock`.
- [ ] Autorización explícita para arrancar F0.4.
- [ ] (Recomendado) Sondeo de disponibilidad de datos `shareholders` / `participadas` en Agency Tool `real`.

---

**Fin del scout**. No se ha modificado ningún componente, contrato, endpoint ni test.
