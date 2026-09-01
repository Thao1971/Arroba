# Fase 5 (Beta) · Cableado real de los 16 ratios Iberinform + 2 hero cards en "Ratios financieros"

**Fecha:** 2026-09-01
**Diseño de referencia (aprobado por Daniel, "perfecto"):** `fase5-ratios-iberinform-ficha-v3.html` (enviado como artefacto en el chat).

## Contexto — por qué este patch y no otro

La tarjeta real "Ratios financieros" que ve Daniel en producción (pestaña Finanzas > Ratios de la Ficha) **no** es el componente `components/company/finanzas/Ratios.tsx` (COMP-3004) — ese está muerto, no se importa desde ningún sitio. Es la función `Finanzas()` dentro de `frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx`, que lee `financial.ratios.items` (prop `financial`, tipo `FinancialSection`, viene de `intelligenceClient.financialSection(cif)` → `GET /api/companies/{cif}/section/financial`).

Ese endpoint **no vive en Intel** — lo sirve el backend ligero propio de Beta (`Beta-290826/backend/src/modules/intelligence_layer/`). Cadena completa:

1. Intel (`Intel-140826/backend/services/engines/financial/engine.py::analyze()`) — ya parcheado en la Fase 5 de Intel (ver `Intel-140826/memory/PENDIENTE_ENVIAR_A_NEO_INTEL.md`, punto 5) para incluir `"iberinform_ratios": {...}` en su respuesta. **Ese parche de Intel es prerrequisito de este.**
2. Beta backend (`providers/agency_tool/financial.py::_map_analyze()`) — construye el DTO interno `FinancialAnalysis` campo a campo desde el JSON de Intel. Hoy **descarta silenciosamente** cualquier campo no declarado explícitamente (mismo patrón que causó el bug ya resuelto de HARDENING-021 con `provenance`). Sin tocar este archivo, `iberinform_ratios` nunca llega ni al DTO ni al frontend, aunque Intel ya lo esté enviando.
3. Beta backend (`canonical_ui_adapter.py::to_financial_section()`) — traduce `FinancialAnalysis` → `FinancialSection.ratios.items[]`, que es lo que el frontend realmente pinta. Aquí se cura y se mezclan los 16 ratios nuevos dentro de las categorías existentes (Liquidez / Solvencia / Circulante-eficiencia).
4. Frontend (`CompanyFichaLayoutV2.tsx::Finanzas()`) — ya sabe pintar filas nuevas automáticamente (itera `financial.ratios.items` agrupando por `category`), así que **no hace falta tocar la lógica de la tabla**. Sólo hacen falta 3 añadidos pequeños: (a) un formato `"days"` que hoy no existe (por eso "Periodo medio de cobro" saldría con el mismo bug visual de "×" que ya tiene "Fondo de maniobra" — ver nota abajo), (b) un icono ámbar "verificar" en las 3 filas marcadas `verified:false`, y (c) las 2 hero cards "Calidad" / "Score de solvencia" arriba de la tabla.

**Nota sobre un bug preexistente, no tocado por este patch:** en producción, "Periodo medio de cobro (días)" y "Fondo de maniobra" (ratios propios de arroba, categoría `working_capital`) salen mal — como "7x" y "2.640.204,2x" en vez de "7 días" y "2.640.204 €" — porque `to_financial_section()` no reconoce la categoría `working_capital` (cae a "profitability" por defecto) y no existe un formato `"days"` (cae a `"ratio"`, que añade "×"). Este patch añade el formato `"days"` para que los 3 ratios NUEVOS de Iberinform (períodos medios) salgan bien, pero deliberadamente **no** toca los 4 ratios legacy de arroba (`dso`, `dpo`, `inventory_days`, `cash_conversion_cycle`, `working_capital`) — eso es un bug aparte, fuera del alcance de esta fase. Si Daniel quiere que se corrija también, es un punto de 10 minutos aparte.

## Mapeo de los 16 ratios (Tier 1 sin R01/S01 + Tier 2 completo)

R01 (`rating_iberinform`) y S01 (`solvency_score`) **no** se añaden como filas — R01 queda fuera por decisión de Daniel ("no quiero poner el rating de iberinform"), S01 se usa como hero card, no como fila de tabla.

Dos claves colisionan con ratios que arroba ya calcula con la misma fórmula exacta (`ratios_library.py`): `working_capital` (Capital circulante / Fondo de maniobra, "Activo corriente − Pasivo corriente") e `interest_coverage` (Cobertura de intereses, "EBIT / Gastos financieros"). Para no duplicar la misma métrica dos veces en la tarjeta (Daniel: "no quiero hacer diferencia" de fuente — dos filas iguales con dos valores distintos sería peor, no mejor), Iberinform sólo rellena esas 2 claves **cuando arroba no tiene ya un valor** — nunca se muestran las dos a la vez.

| Código | Clave canónica | Categoría | Formato | Fórmula (tooltip) | Nota |
|---|---|---|---|---|---|
| SF003 | `immediate_liquidity` | liquidity | multiple | (Caja y equivalentes) / Pasivo corriente — excluye existencias | |
| SF004 | `treasury_ratio` | liquidity | multiple | (Caja + realizable a corto) / Pasivo corriente | |
| PRO001 | `working_capital` | liquidity | currency | Activo corriente − Pasivo corriente | fallback si arroba no lo tiene |
| SF021 | `avg_collection_period` | liquidity | days | (Saldo de clientes / Ventas) × 365 | verified:false (⚠ ver `IBERINFORM_RATIOS_PRIORITY.md`) |
| SF022 | `avg_payment_period` | liquidity | days | (Saldo de proveedores / Compras) × 365 | verified:false |
| SF023 | `avg_supply_period` | liquidity | days | (Existencias / Coste de ventas) × 365 | verified:false |
| SF025 | `interest_coverage` | solvency | multiple | EBIT / Gastos financieros | fallback si arroba no lo tiene |
| SF008 | `debt_quality` | solvency | percent | Deuda financiera a corto plazo / Deuda financiera total | |
| SF009 | `lt_debt_ratio` | solvency | multiple | Deuda financiera a largo plazo / Patrimonio neto | |
| SF010 | `st_debt_ratio` | solvency | multiple | Deuda financiera a corto plazo / Patrimonio neto | |
| EFI001 | `asset_turnover` | efficiency | multiple | Ingresos / Activo total | |
| EFI003 | `working_capital_turnover` | efficiency | multiple | Ingresos / Capital circulante | |
| EFI006 | `sales_per_employee` | efficiency | currency | Ingresos / Nº de empleados | |
| EFI008 | `personnel_expense_per_employee` | efficiency | currency | Gastos de personal / Nº de empleados | |
| PRO002 | `productivity` | efficiency | multiple | Valor añadido / Gastos de personal | |
| PRO005 | `leverage` | efficiency | multiple | Activo total / Patrimonio neto | |

**Nota (decisión ya tomada, no una pregunta abierta para Neo):** `sales_per_employee` (Iberinform, "Ventas por empleado") y el ratio propio `revenue_per_employee` de arroba ("Productividad (ingresos/empleado)", misma fórmula "Ingresos / Nº empleados") miden conceptualmente lo mismo bajo nombres distintos. Se ha decidido mostrar `sales_per_employee` como fila nueva, sin fallback — el mockup aprobado por Daniel ya lo mostraba así, y a diferencia de `working_capital`/`interest_coverage` (mismo código Y misma fórmula exacta que el ratio de arroba) aquí solo coincide el concepto, no la clave ni necesariamente el dato fuente (empleados de Iberinform puede no coincidir exactamente con el de arroba) — no se trata como duplicado.

**Formato `percent` (SF008):** el bridging existente en `CompanyFichaLayoutV2.tsx` (`if (r.format === 'percent' && Math.abs(displayValue) <= 1) displayValue *= 100`) ya cubre las dos convenciones posibles sin necesitar verificación aparte: si Iberinform manda `0.42`, se multiplica a `42` (correcto); si manda ya `42`, `Math.abs(42) <= 1` es falso y se deja tal cual (también correcto). Solo fallaría si `debt_quality` viniera por debajo de 1% para una empresa real, lo cual no es un caso realista para este ratio — no hace falta ninguna comprobación extra de Neo.

---

## Paso 1 — `Beta-290826/backend/src/modules/intelligence_layer/interfaces/financial.py`

Añadir el campo nuevo al DTO `FinancialAnalysis` (si no se declara aquí, Pydantic lo descarta aunque Intel lo mande — `model_config = ConfigDict(extra="ignore")`).

**Buscar:**
```python
    cashflow: dict | None = None  # F0.2 · null cuando el motor no expone el bloque
    ratios: dict = Field(default_factory=dict)  # ratios clave-valor dinámicos (ver catalog)
    financial_quality: FinancialQuality | None = None
```

**Sustituir por:**
```python
    cashflow: dict | None = None  # F0.2 · null cuando el motor no expone el bloque
    ratios: dict = Field(default_factory=dict)  # ratios clave-valor dinámicos (ver catalog)
    # Fase 5 (2026-09-01) · 16 ratios curados de Iberinform (Tier 1+2, sin R01/S01),
    # campo distinto a `ratios` a propósito para no pisar los propios de arroba.
    # Shape: {nombre_canónico: {value, label_es, code, tier, verified}} — ver
    # Intel `services/engines/financial/iberinform_ratios.py::curate()`.
    iberinform_ratios: dict | None = None
    financial_quality: FinancialQuality | None = None
```

---

## Paso 2 — `Beta-290826/backend/src/modules/intelligence_layer/providers/agency_tool/financial.py`

`_map_analyze()` construye `FinancialAnalysis(...)` campo a campo — hay que pasar el nuevo campo explícitamente o se pierde igual que si no estuviera en el modelo.

**Buscar:**
```python
            cashflow=cashflow_raw if isinstance(cashflow_raw, dict) else None,
            ratios=doc.get("ratios") or {},
            financial_quality=FinancialQuality(**fq_kwargs) if fq_kwargs else None,
```

**Sustituir por:**
```python
            cashflow=cashflow_raw if isinstance(cashflow_raw, dict) else None,
            ratios=doc.get("ratios") or {},
            # Fase 5 (2026-09-01) · passthrough puro, mismo patrón que HARDENING-021
            # con `provenance` (antes se descartaba en silencio por `extra="ignore"`).
            iberinform_ratios=doc.get("iberinform_ratios") if isinstance(doc.get("iberinform_ratios"), dict) else None,
            financial_quality=FinancialQuality(**fq_kwargs) if fq_kwargs else None,
```

---

## Paso 3 — `Beta-290826/backend/src/modules/intelligence_layer/interfaces/canonical_ui.py`

Dos cambios puntuales: nuevo formato `"days"`, y campo `verified` en `FinancialRatioItem` para el icono ámbar de "pendiente de verificar" (SF021/SF022/SF023).

**Buscar:**
```python
RatioFormat = Literal["percent", "ratio", "currency", "multiple"]
```

**Sustituir por:**
```python
RatioFormat = Literal["percent", "ratio", "currency", "multiple", "days"]
```

**Buscar:**
```python
class FinancialRatioItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    name: str
    value: float | None = None
    format: RatioFormat = "ratio"
    category: RatioCategory
    formula: str | None = None
    benchmark: Benchmark | None = None
```

**Sustituir por:**
```python
class FinancialRatioItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    name: str
    value: float | None = None
    format: RatioFormat = "ratio"
    category: RatioCategory
    formula: str | None = None
    benchmark: Benchmark | None = None
    # Fase 5 (2026-09-01) · None/True = sin marcar (ratios propios de arroba,
    # siempre fiables). False = pendiente de verificar contra el diccionario
    # oficial de Iberinform (ver IBERINFORM_RATIOS_PRIORITY.md) — el frontend
    # pinta un icono "!" ámbar, nunca oculta la fila (R15: mostrar con aviso,
    # no fabricar ni esconder).
    verified: bool | None = None
```

---

## Paso 4 — `Beta-290826/backend/src/modules/intelligence_layer/canonical_ui_adapter.py`

Este es el cambio principal: cura y mezcla los 16 ratios de Iberinform en `to_financial_section()`.

**4a. Añadir la tabla de mapeo justo antes de `def to_financial_section(`.**

**Buscar:**
```python
def to_financial_section(
    analysis: FinancialAnalysis,
    ratios_catalog: RatiosCatalog | None = None,
) -> FinancialSection:
```

**Sustituir por:**
```python
# Fase 5 (2026-09-01) · Mapeo categoría/formato/fórmula para los 16 ratios de
# Iberinform (Tier 1 sin R01/S01 + Tier 2) que sí se muestran como fila nueva
# en la tarjeta "Ratios financieros" — ver FASE5_RATIOS_IBERINFORM_BETA_UI_PATCH.md
# para la tabla completa y el razonamiento. Claves = nombre canónico que emite
# `iberinform_ratios.py::curate()` en Intel.
_IBERINFORM_RATIO_META: dict[str, dict[str, Any]] = {
    "immediate_liquidity": {"category": "liquidity", "format": "multiple",
        "formula": "(Caja y equivalentes) / Pasivo corriente — excluye existencias"},
    "treasury_ratio": {"category": "liquidity", "format": "multiple",
        "formula": "(Caja + realizable a corto) / Pasivo corriente"},
    "working_capital": {"category": "liquidity", "format": "currency",
        "formula": "Activo corriente − Pasivo corriente"},
    "avg_collection_period": {"category": "liquidity", "format": "days",
        "formula": "(Saldo de clientes / Ventas) × 365"},
    "avg_payment_period": {"category": "liquidity", "format": "days",
        "formula": "(Saldo de proveedores / Compras) × 365"},
    "avg_supply_period": {"category": "liquidity", "format": "days",
        "formula": "(Existencias / Coste de ventas) × 365"},
    "interest_coverage": {"category": "solvency", "format": "multiple",
        "formula": "EBIT / Gastos financieros"},
    "debt_quality": {"category": "solvency", "format": "percent",
        "formula": "Deuda financiera a corto plazo / Deuda financiera total"},
    "lt_debt_ratio": {"category": "solvency", "format": "multiple",
        "formula": "Deuda financiera a largo plazo / Patrimonio neto"},
    "st_debt_ratio": {"category": "solvency", "format": "multiple",
        "formula": "Deuda financiera a corto plazo / Patrimonio neto"},
    "asset_turnover": {"category": "efficiency", "format": "multiple",
        "formula": "Ingresos / Activo total"},
    "working_capital_turnover": {"category": "efficiency", "format": "multiple",
        "formula": "Ingresos / Capital circulante"},
    "sales_per_employee": {"category": "efficiency", "format": "currency",
        "formula": "Ingresos / Nº de empleados"},
    "personnel_expense_per_employee": {"category": "efficiency", "format": "currency",
        "formula": "Gastos de personal / Nº de empleados"},
    "productivity": {"category": "efficiency", "format": "multiple",
        "formula": "Valor añadido / Gastos de personal"},
    "leverage": {"category": "efficiency", "format": "multiple",
        "formula": "Activo total / Patrimonio neto"},
}
# Claves donde arroba ya calcula el mismo ratio con idéntica fórmula
# (`services/engines/financial/ratios_library.py` en Intel) — Iberinform sólo
# rellena si arroba no tiene valor para esa empresa-año, nunca se duplica la fila.
_IBERINFORM_FALLBACK_ONLY = {"working_capital", "interest_coverage"}


def to_financial_section(
    analysis: FinancialAnalysis,
    ratios_catalog: RatiosCatalog | None = None,
) -> FinancialSection:
```

**4b. Reestructurar el bloque de ratios para que `items` se construya siempre (no sólo dentro de `if analysis.ratios:`) y para añadir el merge de Iberinform al final.**

**Buscar (bloque completo, sin cambios en la parte de arroba — sólo se mueve la declaración de `items` fuera del `if` y se añade el tramo nuevo al final):**
```python
    # --- ratios: soporta 2 shapes del proveedor ---
    #   F0.2:  {key: {"value": float, "name": str, "category": str, "formula": str, ...}}
    #   B.6.b: {key: float}
    ratios_block: FinancialRatiosBlock | None = None
    if analysis.ratios:
        catalog_by_key: dict[str, Any] = {}
        if ratios_catalog and ratios_catalog.ratios:
            catalog_by_key = {r.key: r for r in ratios_catalog.ratios}
        items: list[FinancialRatioItem] = []
        valid = {"profitability", "liquidity", "solvency", "efficiency", "growth"}
        for k, v in analysis.ratios.items():
            # Shape F0.2: v es un dict con {value, name, category, formula, ...}
            if isinstance(v, dict):
                raw_value = v.get("value")
                if not isinstance(raw_value, (int, float)):
                    continue
                meta = catalog_by_key.get(k)
                name = v.get("name") or getattr(meta, "name", k)
                category_raw = v.get("category") or getattr(meta, "category", None) or "profitability"
                category = category_raw if category_raw in valid else "profitability"
                formula = v.get("formula") or getattr(meta, "formula", None)
                value = float(raw_value)
            # Shape B.6.b: v es un float
            elif isinstance(v, (int, float)):
                meta = catalog_by_key.get(k)
                name = getattr(meta, "name", k)
                category_raw = getattr(meta, "category", None) or "profitability"
                category = category_raw if category_raw in valid else "profitability"
                formula = getattr(meta, "formula", None)
                value = float(v)
            else:
                continue
            # Format heurístico
            fmt: str = "ratio"
            if k.endswith("_margin"):
                fmt = "percent"
            elif k in ("roe", "roa", "solvency", "debt_ratio"):
                fmt = "percent"
            items.append(
                FinancialRatioItem(
                    key=k,
                    name=name,
                    value=value,
                    format=fmt,  # type: ignore[arg-type]
                    category=category,  # type: ignore[arg-type]
                    formula=formula,
                    benchmark=None,
                )
            )
        if items:
            ratios_block = FinancialRatiosBlock(items=items)
```

**Sustituir por:**
```python
    # --- ratios: soporta 2 shapes del proveedor ---
    #   F0.2:  {key: {"value": float, "name": str, "category": str, "formula": str, ...}}
    #   B.6.b: {key: float}
    ratios_block: FinancialRatiosBlock | None = None
    items: list[FinancialRatioItem] = []
    if analysis.ratios:
        catalog_by_key: dict[str, Any] = {}
        if ratios_catalog and ratios_catalog.ratios:
            catalog_by_key = {r.key: r for r in ratios_catalog.ratios}
        valid = {"profitability", "liquidity", "solvency", "efficiency", "growth"}
        for k, v in analysis.ratios.items():
            # Shape F0.2: v es un dict con {value, name, category, formula, ...}
            if isinstance(v, dict):
                raw_value = v.get("value")
                if not isinstance(raw_value, (int, float)):
                    continue
                meta = catalog_by_key.get(k)
                name = v.get("name") or getattr(meta, "name", k)
                category_raw = v.get("category") or getattr(meta, "category", None) or "profitability"
                category = category_raw if category_raw in valid else "profitability"
                formula = v.get("formula") or getattr(meta, "formula", None)
                value = float(raw_value)
            # Shape B.6.b: v es un float
            elif isinstance(v, (int, float)):
                meta = catalog_by_key.get(k)
                name = getattr(meta, "name", k)
                category_raw = getattr(meta, "category", None) or "profitability"
                category = category_raw if category_raw in valid else "profitability"
                formula = getattr(meta, "formula", None)
                value = float(v)
            else:
                continue
            # Format heurístico
            fmt: str = "ratio"
            if k.endswith("_margin"):
                fmt = "percent"
            elif k in ("roe", "roa", "solvency", "debt_ratio"):
                fmt = "percent"
            items.append(
                FinancialRatioItem(
                    key=k,
                    name=name,
                    value=value,
                    format=fmt,  # type: ignore[arg-type]
                    category=category,  # type: ignore[arg-type]
                    formula=formula,
                    benchmark=None,
                )
            )

    # --- Fase 5 (2026-09-01): merge de los 16 ratios curados de Iberinform en
    # las mismas categorías/tarjeta, sin distinguir fuente (decisión de Daniel).
    # `working_capital`/`interest_coverage` sólo rellenan si arroba no tiene ya
    # ese ratio calculado (mismo key, misma fórmula en ambos lados — no duplicar).
    if analysis.iberinform_ratios:
        existing_keys = {it.key for it in items}
        for name, meta_r in analysis.iberinform_ratios.items():
            ratio_meta = _IBERINFORM_RATIO_META.get(name)
            if not ratio_meta:
                continue  # p.ej. solvency_score: es hero card, no fila de tabla
            if name in _IBERINFORM_FALLBACK_ONLY and name in existing_keys:
                continue  # arroba ya calcula este ratio — no duplicar la fila
            if not isinstance(meta_r, dict):
                continue
            raw_value = meta_r.get("value")
            if not isinstance(raw_value, (int, float)):
                continue
            items.append(
                FinancialRatioItem(
                    key=name,
                    name=meta_r.get("label_es") or name,
                    value=float(raw_value),
                    format=ratio_meta["format"],  # type: ignore[arg-type]
                    category=ratio_meta["category"],  # type: ignore[arg-type]
                    formula=ratio_meta["formula"],
                    benchmark=None,
                    verified=meta_r.get("verified", True),
                )
            )

    if items:
        ratios_block = FinancialRatiosBlock(items=items)
```

---

## Paso 5 — `Beta-290826/frontend/src/lib/companies/intelligence-types.ts`

**Buscar:**
```typescript
export type RatioFormat = 'percent' | 'ratio' | 'currency' | 'multiple';
```

**Sustituir por:**
```typescript
export type RatioFormat = 'percent' | 'ratio' | 'currency' | 'multiple' | 'days';
```

**Buscar:**
```typescript
export interface FinancialRatioItem {
  key: string;
  name: string;
  value: number | null;
  format: RatioFormat;
  category: RatioCategory;
  formula?: string | null;
  benchmark?: Benchmark | null;
}
```

**Sustituir por:**
```typescript
export interface FinancialRatioItem {
  key: string;
  name: string;
  value: number | null;
  format: RatioFormat;
  category: RatioCategory;
  formula?: string | null;
  benchmark?: Benchmark | null;
  /** Fase 5 (2026-09-01) · false = pendiente de verificar (icono "!" ámbar). */
  verified?: boolean | null;
}
```

**Buscar:**
```typescript
  ratios: Record<string, FinancialAnalysisRatioDetail | number> | Record<string, never>;
  financial_quality: FinancialAnalysisQuality | null;
```

**Sustituir por:**
```typescript
  ratios: Record<string, FinancialAnalysisRatioDetail | number> | Record<string, never>;
  /**
   * Fase 5 (2026-09-01) · 16 ratios curados de Iberinform expuestos como hero
   * cards (`solvency_score`) — el resto de claves se pintan como filas dentro
   * de `FinancialSection.ratios.items` (ver `section/financial`), no aquí.
   */
  iberinform_ratios?: Record<string, {
    value: number;
    label_es: string;
    code: string;
    tier: 1 | 2 | 3;
    verified: boolean;
  }> | null;
  financial_quality: FinancialAnalysisQuality | null;
```

*(Este paso sustituye/amplía el patch anterior "sólo tipos" — `FASE5_RATIOS_IBERINFORM_BETA_TYPES_PATCH.md` queda obsoleto, no aplicar los dos a la vez.)*

---

## Paso 6 — `Beta-290826/frontend/src/components/company/layout/CompanyFichaLayoutV2.tsx`

**6a. Formato `"days"` en `fmtCell`.**

**Buscar:**
```typescript
function fmtCell(value: number | null, format: string): string {
  if (value === null || value === undefined) return '—';
  if (format === 'percent') return `${value.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%`;
  if (format === 'ratio' || format === 'multiple') return `${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })}×`;
  if (format === 'currency') return fmtEUR(value);
  return value.toLocaleString('es-ES');
}
```

**Sustituir por:**
```typescript
function fmtCell(value: number | null, format: string): string {
  if (value === null || value === undefined) return '—';
  if (format === 'percent') return `${value.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%`;
  if (format === 'ratio' || format === 'multiple') return `${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })}×`;
  if (format === 'currency') return fmtEUR(value);
  if (format === 'days') return `${value.toLocaleString('es-ES', { maximumFractionDigits: 0 })} días`;
  return value.toLocaleString('es-ES');
}
```

**6b. Hero cards "Calidad" + "Score de solvencia" arriba de la tabla, e icono ámbar de verificación en las filas que lo necesiten.**

**Buscar:**
```typescript
      {tab === 'ratios' && (fams.length ? (
        <div className="card">
          <h3><span className="k" />Ratios financieros</h3>
          <div className="cs">Valor · percentil sectorial. Pasa el ratón por cada ratio para su definición.</div>
          <div className="rfams">
            {fams.map((f) => (
              <div key={f.key} className="rfam">
                <h5><span className="k" />{f.label}</h5>
                {ratios.filter((r) => r.category === f.key).map((r) => {
                  const pct = r.benchmark?.percentile;
                  // ÍTEM 3 · Turno post-D · fix R15: `FinancialRatioItem.value` viene
                  // como ratio decimal `[−1,1]` cuando `format="percent"`. El helper
                  // global `fmtCell` no multiplica × 100 (uso compartido con Cash
                  // Flow, currency, ratio), así que aplicamos bridging local
                  // acotado al render de ratios de esta card. Coherente con
                  // `fmtRatioValue` del `RatiosTrendCard` (que ya × 100). Cero
                  // efecto sobre `ratio`, `multiple`, o `value=null` (sigue `—`).
                  let displayValue: number | null = r.value;
                  if (
                    r.format === 'percent' &&
                    typeof displayValue === 'number' &&
                    Math.abs(displayValue) <= 1
                  ) {
                    displayValue = displayValue * 100;
                  }
                  return (
                    <div key={r.key} className="rrow">
                      <span className="rn" title={r.formula ?? undefined}>{r.name}</span>
                      <span className="rv">{fmtCell(displayValue, r.format)}</span>
                      {pct != null ? <span className="rp"><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></span> : <span className="rp na">—</span>}
                      <span className="rt f">▬</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="rleg">
            <span><span className="srcdot r" /> Verificado en fuente</span>
            <span><span className="srcdot c" /> Estimación de ARROBA</span>
            <span>La barra indica el percentil frente al sector</span>
          </div>
        </div>
      ) : <Pending label="Ratios" />)}
```

**Sustituir por:**
```typescript
      {tab === 'ratios' && (fams.length ? (
        <div className="card">
          <h3><span className="k" />Ratios financieros</h3>
          <div className="cs">Valor · percentil sectorial. Pasa el ratón por cada ratio para su definición.</div>
          {(clamp100(fq?.score ?? null) != null || clamp100(analysis?.iberinform_ratios?.solvency_score?.value ?? null) != null) && (
            <div className="scores" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: 220, marginBottom: 18 }}>
              {clamp100(fq?.score ?? null) != null && (
                <div title="Score de calidad financiera de ARROBA (márgenes, solvencia y tendencia).">
                  <Ring val={clamp100(fq?.score ?? null)!} label="Calidad" color={OK} />
                </div>
              )}
              {clamp100(analysis?.iberinform_ratios?.solvency_score?.value ?? null) != null && (
                <div title="Score de solvencia (Iberinform), 0-100.">
                  <Ring val={clamp100(analysis?.iberinform_ratios?.solvency_score?.value ?? null)!} label="Score de solvencia" color={OK} />
                </div>
              )}
            </div>
          )}
          <div className="rfams">
            {fams.map((f) => (
              <div key={f.key} className="rfam">
                <h5><span className="k" />{f.label}</h5>
                {ratios.filter((r) => r.category === f.key).map((r) => {
                  const pct = r.benchmark?.percentile;
                  // ÍTEM 3 · Turno post-D · fix R15: `FinancialRatioItem.value` viene
                  // como ratio decimal `[−1,1]` cuando `format="percent"`. El helper
                  // global `fmtCell` no multiplica × 100 (uso compartido con Cash
                  // Flow, currency, ratio), así que aplicamos bridging local
                  // acotado al render de ratios de esta card. Coherente con
                  // `fmtRatioValue` del `RatiosTrendCard` (que ya × 100). Cero
                  // efecto sobre `ratio`, `multiple`, o `value=null` (sigue `—`).
                  let displayValue: number | null = r.value;
                  if (
                    r.format === 'percent' &&
                    typeof displayValue === 'number' &&
                    Math.abs(displayValue) <= 1
                  ) {
                    displayValue = displayValue * 100;
                  }
                  return (
                    <div key={r.key} className="rrow">
                      <span className="rn" title={r.formula ?? undefined}>
                        {r.name}
                        {r.verified === false && (
                          <span
                            title="Pendiente de verificar antes de publicar"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                              background: 'var(--warning-subtle)', color: 'var(--warning)',
                              fontSize: 10, fontWeight: 800, cursor: 'help',
                            }}
                          >!</span>
                        )}
                      </span>
                      <span className="rv">{fmtCell(displayValue, r.format)}</span>
                      {pct != null ? <span className="rp"><i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></span> : <span className="rp na">—</span>}
                      <span className="rt f">▬</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="rleg">
            <span><span className="srcdot r" /> Verificado en fuente</span>
            <span><span className="srcdot c" /> Estimación de ARROBA</span>
            <span>La barra indica el percentil frente al sector</span>
          </div>
        </div>
      ) : <Pending label="Ratios" />)}
```

No hace falta ningún otro cambio en este archivo: `Ring`, `OK`, `clamp100`, `useState` y `.scores`/`.rn` ya existen y se usan con este mismo patrón en otras tarjetas de la propia Ficha (p.ej. `Valoracion()`, línea ~1358).

---

## Verificación pedida a Neo (antes de dejarlo en preview)

1. `tsc`/build de `frontend` limpio.
2. `pytest`/lo que exista de `backend` (Beta) limpio — en particular si hay test de `canonical_ui_adapter.py` o `test_section_endpoints.py`.
3. Visual en preview con una empresa con datos de Iberinform completos (verificar antes con Intel qué CIF tiene `norm_financials.ratios_source == "iberinform"` poblado — ver nota de backfill en la Fase 5 de Intel): confirmar que aparecen las 2 hero cards, las nuevas filas en Liquidez/Solvencia/Circulante-eficiencia, el icono "!" ámbar sólo en los 3 períodos medios, y que `working_capital`/`interest_coverage` no salen duplicados.
4. Confirmar con una empresa SIN datos de Iberinform (o con `iberinform_ratios=null`) que la tarjeta se ve exactamente igual que hoy — cero regresión cuando no hay dato nuevo (R15).
