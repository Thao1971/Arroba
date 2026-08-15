"""REQ-004 — Natural-language → financial/attribute filters.

Turns queries like "empresas con ingresos superiores a 50 millones" or
"agencias de marketing con EBITDA > 1M y más de 100 empleados" into the
`filters` dict consumed by Intel's `/api/v1/skills/search`
(revenue_min/max, ebitda_min/max, employees_min/max, growth_min, province).

Pure module — no I/O — so it is cheap to unit-test.
"""
from __future__ import annotations

import re
import unicodedata
from typing import Any


def _norm(s: str) -> str:
    return (
        "".join(
            c for c in unicodedata.normalize("NFD", s or "")
            if unicodedata.category(c) != "Mn"
        )
        .lower()
        .strip()
    )


# Comparator groups (normalized, no diacritics).
_GTE = r"(?:mas de|más de|superior(?:es)? a|mayor(?:es)? (?:que|a|de)|por encima de|desde|a partir de|>=?|min(?:imo)? de|al menos)"
_LTE = r"(?:menos de|inferior(?:es)? a|menor(?:es)? (?:que|a|de)|por debajo de|hasta|como maximo|<=?|max(?:imo)? de)"

_NUM = r"(\d[\d.,]*)"
_UNIT = r"(millones|millon|mill|mm|m|mil|k)?"

# Metric keyword → canonical metric.
_REVENUE_KW = ("ingresos", "ingreso", "facturacion", "facturas", "factura", "facturen",
               "ventas", "revenue", "cifra de negocio")
_EBITDA_KW = ("ebitda",)
_EMPLOYEE_KW = ("empleados", "empleadas", "trabajadores", "trabajadoras", "plantilla", "empleado")
_GROWTH_KW = ("crecimiento", "crece", "crecen", "creciendo", "crecer", "growth")


def _to_number(raw: str, unit: str | None) -> float | None:
    """Parse a Spanish-formatted number + scale by unit (millones/mil/k)."""
    t = raw.strip()
    if "," in t:            # comma = decimal → dots are thousands
        t = t.replace(".", "").replace(",", ".")
    elif t.count(".") == 1 and len(t.split(".")[1]) == 3:
        t = t.replace(".", "")  # single dot + 3 digits → thousands
    try:
        val = float(t)
    except ValueError:
        return None
    u = (unit or "").lower()
    if u in ("millones", "millon", "mill", "mm", "m"):
        val *= 1_000_000
    elif u in ("mil", "k"):
        val *= 1_000
    return val


def _metric_in(text: str) -> str | None:
    if any(k in text for k in _EBITDA_KW):
        return "ebitda"
    if any(k in text for k in _EMPLOYEE_KW):
        return "employees"
    if re.search(r"crec|crezc|growth", text):
        return "growth"
    if any(k in text for k in _REVENUE_KW):
        return "revenue"
    return None


_PROVINCES = (
    "madrid", "barcelona", "valencia", "sevilla", "zaragoza", "malaga", "murcia",
    "bilbao", "vizcaya", "alicante", "cordoba", "valladolid", "vigo", "gijon",
    "coruna", "granada", "pamplona", "navarra", "guipuzcoa", "asturias", "cantabria",
    "galicia", "cataluna", "andalucia", "pais vasco", "aragon", "baleares", "canarias",
    "toledo", "salamanca", "leon", "burgos", "tarragona", "girona", "lleida", "huelva",
    "cadiz", "almeria", "jaen", "badajoz", "caceres", "albacete", "castellon",
)


def parse_financial_query(query: str) -> dict[str, Any] | None:
    """Return {"filters": {...}, "residual": str} if the query carries a
    financial/attribute predicate, else None.
    """
    n = _norm(query)
    if not n:
        return None

    filters: dict[str, Any] = {}
    consumed_spans: list[tuple[int, int]] = []

    # --- growth: "que crezca más de 20%" / "crecimiento > 20%" ---
    for m in re.finditer(rf"{_GTE}\s*{_NUM}\s*%", n):
        val = _to_number(m.group(1), None)
        if val is not None and ("crec" in n or "growth" in n or "%" in n):
            filters["growth_min"] = round(val / 100.0, 4)
            consumed_spans.append(m.span())
            break

    # --- range: "entre X e Y (millones)" → applies to the metric in the query ---
    metric = _metric_in(n) or "revenue"
    rng = re.search(rf"entre\s+{_NUM}\s*{_UNIT}\s+(?:y|e)\s+{_NUM}\s*{_UNIT}", n)
    if rng and metric in ("revenue", "ebitda", "employees"):
        lo = _to_number(rng.group(1), rng.group(2) or rng.group(4))
        hi = _to_number(rng.group(3), rng.group(4))
        if lo is not None and hi is not None:
            filters[f"{metric}_min"] = lo
            filters[f"{metric}_max"] = hi
            consumed_spans.append(rng.span())

    # --- single comparator predicates (gte / lte) ---
    if metric in ("revenue", "ebitda", "employees") and f"{metric}_min" not in filters:
        gte = re.search(rf"{_GTE}\s*{_NUM}\s*{_UNIT}", n)
        if gte:
            v = _to_number(gte.group(1), gte.group(2))
            if v is not None:
                filters[f"{metric}_min"] = v
                consumed_spans.append(gte.span())
        lte = re.search(rf"{_LTE}\s*{_NUM}\s*{_UNIT}", n)
        if lte:
            v = _to_number(lte.group(1), lte.group(2))
            if v is not None:
                filters[f"{metric}_max"] = v
                consumed_spans.append(lte.span())

    # --- province: "en Valencia" ---
    for prov in _PROVINCES:
        if re.search(rf"\ben {re.escape(prov)}\b", n):
            filters["province"] = prov
            break

    # A bare province ("en Madrid") alone is a geo refine, not a financial screen.
    # Only treat as REQ-004 if there is at least one numeric predicate.
    if not any(k in filters for k in
               ("revenue_min", "revenue_max", "ebitda_min", "ebitda_max",
                "employees_min", "employees_max", "growth_min")):
        return None

    # Residual lexical text: drop consumed numeric spans, then strip metric/filler
    # words so what's left is a clean sector/name hint for lexical matching.
    residual = n
    for a, b in sorted(consumed_spans, reverse=True):
        residual = residual[:a] + " " + residual[b:]
    _FILLER = (list(_REVENUE_KW) + list(_EBITDA_KW) + list(_EMPLOYEE_KW) + list(_GROWTH_KW)
               + ["empresas", "empresa", "companias", "con", "que", "de", "un", "una",
                  "y", "e", "mas", "los", "las", "del", "para", "millones", "millon",
                  "euros", "€", "%"])
    residual = " ".join(t for t in re.split(r"[^a-z0-9]+", residual) if t and t not in _FILLER)

    return {"filters": filters, "residual": residual.strip()}
