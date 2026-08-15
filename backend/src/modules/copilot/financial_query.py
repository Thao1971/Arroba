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
_GTE = r"(?:mas del?|más del?|superior(?:es)? al?|mayor(?:es)? (?:que|al?|del?)|por encima del?|desde|a partir del?|>=?|min(?:imo)? de|al menos)"
_LTE = r"(?:menos del?|inferior(?:es)? al?|menor(?:es)? (?:que|al?|del?)|por debajo del?|hasta|como maximo|<=?|max(?:imo)? de)"

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


_EMP_TOK = ("emplead", "trabajad", "plantilla")
_REV_TOK = ("ingres", "factur", "ventas", "revenue", "cifra de negocio")
_MONEY_UNITS = ("millones", "millon", "mill", "mm", "m", "mil", "k")


def _classify(n: str, start: int, end: int, unit: str | None) -> str:
    """Assign a numeric predicate to a metric by its surrounding context.
    Spanish puts the noun after the number ("100 empleados", "1 millón de euros")
    and the metric keyword often before ("ingresos superiores a 50M")."""
    before = n[max(0, start - 30):start]
    after = n[end:end + 20]
    if any(t in after for t in _EMP_TOK) or any(t in before for t in _EMP_TOK):
        return "employees"
    if "ebitda" in before or "ebitda" in after:
        return "ebitda"
    if (any(t in before for t in _REV_TOK) or any(t in after for t in _REV_TOK)
            or "euro" in after or "€" in after):
        return "revenue"
    if (unit or "").lower() in _MONEY_UNITS:
        return "revenue"
    return "revenue"


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

    def _set(key: str, val: float) -> None:
        filters.setdefault(key, val)  # first predicate wins; never overwrite

    # --- porcentajes: margen EBITDA vs crecimiento, según contexto ---
    # "margen (de EBITDA) superior al 30%" → ebitda_margin_min; "crezca >20%" → growth_min.
    def _pct_metric(a: int, b: int) -> str | None:
        ctx = n[max(0, a - 32):b + 18]
        if "margen" in ctx or "rentabilidad" in ctx:
            return "ebitda_margin"
        if re.search(r"crec|crezc|growth", ctx) or re.search(r"crec|crezc|growth", n):
            return "growth"
        return None

    for m in re.finditer(rf"{_GTE}\s*{_NUM}\s*%", n):
        val = _to_number(m.group(1), None)
        met = _pct_metric(m.start(), m.end())
        if val is not None and met:
            _set("ebitda_margin_min" if met == "ebitda_margin" else "growth_min", round(val / 100.0, 4))
            consumed_spans.append(m.span())
    for m in re.finditer(rf"{_LTE}\s*{_NUM}\s*%", n):
        val = _to_number(m.group(1), None)
        met = _pct_metric(m.start(), m.end())
        if val is not None and met == "ebitda_margin":  # margen máximo; growth_max no existe
            _set("ebitda_margin_max", round(val / 100.0, 4))
            consumed_spans.append(m.span())

    # --- ranges: "entre X e Y (millones)" → classified by context ---
    for rng in re.finditer(rf"entre\s+{_NUM}\s*{_UNIT}\s+(?:y|e)\s+{_NUM}\s*{_UNIT}", n):
        unit = rng.group(4) or rng.group(2)
        metric = _classify(n, rng.start(), rng.end(), unit)
        lo = _to_number(rng.group(1), rng.group(2) or rng.group(4))
        hi = _to_number(rng.group(3), rng.group(4))
        if metric in ("revenue", "ebitda", "employees") and lo is not None and hi is not None:
            _set(f"{metric}_min", lo)
            _set(f"{metric}_max", hi)
            consumed_spans.append(rng.span())

    def _overlaps(span: tuple[int, int]) -> bool:
        return any(a < span[1] and span[0] < b for a, b in consumed_spans)

    # --- multi-metric comparators (each number classified independently) ---
    # gte → *_min ; the negative lookahead keeps "20%" out of the money branch.
    for m in re.finditer(rf"{_GTE}\s*{_NUM}\s*{_UNIT}(?!\s*%)", n):
        if _overlaps(m.span()):
            continue
        v = _to_number(m.group(1), m.group(2))
        metric = _classify(n, m.start(), m.end(), m.group(2))
        if v is not None and metric in ("revenue", "ebitda", "employees"):
            _set(f"{metric}_min", v)
            consumed_spans.append(m.span())
    # lte → *_max
    for m in re.finditer(rf"{_LTE}\s*{_NUM}\s*{_UNIT}(?!\s*%)", n):
        if _overlaps(m.span()):
            continue
        v = _to_number(m.group(1), m.group(2))
        metric = _classify(n, m.start(), m.end(), m.group(2))
        if v is not None and metric in ("revenue", "ebitda", "employees"):
            _set(f"{metric}_max", v)
            consumed_spans.append(m.span())

    # --- province: "en Valencia" ---
    for prov in _PROVINCES:
        if re.search(rf"\ben {re.escape(prov)}\b", n):
            filters["province"] = prov
            break

    # A bare province ("en Madrid") alone is a geo refine, not a financial screen.
    # Only treat as REQ-004 if there is at least one numeric predicate.
    if not any(k in filters for k in
               ("revenue_min", "revenue_max", "ebitda_min", "ebitda_max",
                "employees_min", "employees_max", "growth_min",
                "ebitda_margin_min", "ebitda_margin_max")):
        return None

    # Residual lexical text: drop consumed numeric spans, then strip metric/filler
    # words so what's left is a clean sector/name hint for lexical matching.
    residual = n
    for a, b in sorted(consumed_spans, reverse=True):
        residual = residual[:a] + " " + residual[b:]
    _FILLER = (list(_REVENUE_KW) + list(_EBITDA_KW) + list(_EMPLOYEE_KW) + list(_GROWTH_KW)
               + ["empresas", "empresa", "companias", "compania", "con", "que", "de", "un", "una",
                  "y", "e", "mas", "menos", "los", "las", "del", "para", "millones", "millon",
                  "mill", "mil", "euros", "euro", "€", "%",
                  "superior", "superiores", "inferior", "inferiores",
                  "mayor", "mayores", "menor", "menores", "entre",
                  "margen", "rentabilidad", "al", "del"])
    residual = " ".join(t for t in re.split(r"[^a-z0-9]+", residual) if t and t not in _FILLER)

    return {"filters": filters, "residual": residual.strip()}
