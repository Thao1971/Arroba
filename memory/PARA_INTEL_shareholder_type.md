# PARA INTEL · Solicitud REQ · `ownership.shareholders[].type`

> **Emisor**: Arroba.com (equipo de producto).
> **Destinatario**: Equipo Intelligence Engine.
> **Fecha**: 2026-08-11.
> **Prioridad**: **P3 · no bloqueante** (Arroba ya opera con la política conservadora simplificada).
> **Sprint objetivo sugerido**: próximo hueco de mantenimiento del agregador `/company/{cif}/ficha`.

---

## 1. Contexto de producto

Arroba integra el bloque `ownership` del agregador Intel `GET /api/v1/company/{cif}/ficha` para renderizar la sección "Estructura accionarial y control" de la ficha canónica de empresa. El bloque contiene datos registrales públicos (BORME) por lo que se emite en modo **mixed-access**: visitantes anónimos ven una versión reducida, usuarios autenticados ven la versión nominal completa.

La política DPD (Data Protection Directive) canónica de Arroba distingue dos tipos de accionistas:

- **Personas jurídicas** (sociedades, entidades corporativas): nombre + % de participación son **datos públicos** (BORME, chain of control, transparencia societaria). **Se deben mostrar** tanto en anon como en auth.
- **Personas físicas**: nombre + % individual son **PII débilmente identificadora**. Solo se muestran a usuarios autenticados. En anon se agrega a contadores por tramo o se omite.

## 2. Estado actual · limitación observada

En la implementación B-2.2 · Ownership DPD (2026-08-11), tras la Fase 0 sobre `B28184687` LABORATORIOS SERVIER, se detectó que **el shape actual del agregador no permite discriminar tipo de forma fiable**:

- `ownership.shareholders[]` **NO incluye campo `type`** explícito.
- `shareholders[].cif` viene `null` para **sociedades extranjeras** (Servier tiene una BV holandesa y una sociedad civil francesa; ambas jurídicas con `cif=null`).
- Los sufijos societarios (S.A., S.L., BV, GmbH, SAS, SRL…) presentes en el `name` sirven para clasificar mayoritariamente, pero **no cubren todos los casos** (p. ej., "ARTS ET TECHNIQUES DU PROGRES" es una sociedad francesa sin sufijo evidente; una heurística por sufijo la clasifica erróneamente como física).

**Consecuencia**: Arroba adoptó una **política simplificada** que oculta **todos** los nombres (jurídicos y físicos) en el modo anónimo. Esta política protege PII correctamente pero **sacrifica valor CF** (la cadena de control societaria, dato público de alto valor para prospecting M&A, queda invisible para visitantes anónimos).

## 3. Petición

**Añadir un campo `type` a cada elemento de `ownership.shareholders[]`** en la respuesta del agregador `/company/{cif}/ficha`:

```json
{
  "name": "SERVIER INTERNATIONAL, BV",
  "type": "legal",
  "cif": null,
  "pct": 73.35,
  "as_of_year": 2024
}
```

```json
{
  "name": "JOSÉ MARÍA GARCÍA LÓPEZ",
  "type": "individual",
  "cif": null,
  "pct": 12.5,
  "as_of_year": 2024
}
```

### Valores esperados

- `type = "legal"` → persona jurídica (sociedad, fundación, cooperativa, entidad administrativa, mutua, sindicato, etc.).
- `type = "individual"` → persona física (particular con NIF/DNI/pasaporte).
- **Opcional**: `type = "unknown"` cuando Intel no pueda determinarlo con certeza. Arroba lo tratará como `"individual"` (política defensiva).

### Ámbito

- Solo bloque `ownership.shareholders[]` del agregador `/ficha` (y del endpoint dedicado `/api/v1/company/{cif}/ownership` si existiera).
- No requerido en `governance.officers[]` (todos son personas físicas nominadas por definición).

## 4. Snippet real del payload actual (Servier · `B28184687`)

```json
"ownership": {
  "identifier": "B28184687",
  "cif": "B28184687",
  "available": true,
  "shareholders": [
    { "name": "SERVIER INTERNATIONAL, BV",       "cif": null, "pct": 73.35, "as_of_year": 2024 },
    { "name": "ARTS ET TECHNIQUES DU PROGRES",   "cif": null, "pct": 26.65, "as_of_year": 2024 }
  ],
  "control": {
    "controlling_shareholder": "SERVIER INTERNATIONAL, BV",
    "top1_pct":  73.35,
    "top1_name": "SERVIER INTERNATIONAL, BV",
    "tier":      "Control mayoritario"
  },
  "coverage": { "shareholders_count": 2 },
  "engine_version": "arroba-company-ficha-v1"
}
```

Ambos accionistas de Servier son personas jurídicas. Con el campo `type` propuesto, Arroba podría mostrarlos con nombre + % también en la vista anónima, mejorando materialmente el valor CF de la ficha.

## 5. Consecuencia positiva del cambio

Con `shareholder.type` disponible, Arroba podría re-abrir una **política DPD granular**:

- Anon → shareholders **jurídicos** visibles con nombre + %; shareholders **físicos** solo en count agregado.
- Auth → passthrough nominal completo (sin cambios).

Beneficios cuantificables:

- ↑ Valor prospecting M&A anónimo (chain of control visible).
- ↑ Transparencia societaria (dato registral público, alineado con BORME).
- ↔ Cero riesgo PII (personas físicas siguen protegidas).

## 6. Prioridad y no-bloqueo

- **P3 · no bloqueante**. Arroba tiene una implementación funcional con la política simplificada actual.
- Verificado E2E en preview (`https://musing-hellman-9.preview.emergentagent.com/es/empresa-f01/B28184687`).
- Cuando Intel entregue el campo, Arroba amplía en un turno (~2 h de trabajo estimado) para re-abrir la política granular.

## 7. Retrocompatibilidad

- La adición de `type` al shape es **aditiva** (no destructiva). Arroba lo consumirá con `dict.get("type")` en el mapper backend; ausencia → mantiene la política simplificada actual (fallback seguro).
- No requiere cambios en el contrato Pydantic interno de Arroba (`OwnershipBlock` es passthrough puro tipo `dict | None`).

---

**Contacto Arroba**: main agent E1 / código de referencia en `/app/backend/src/modules/intelligence_layer/endpoints.py::_anonymize_ownership()` líneas 360-430.
