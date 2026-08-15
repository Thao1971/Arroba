"""REQ-004 — NL → financial filters parser (Beta side). Pure, no I/O."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from src.modules.copilot.financial_query import parse_financial_query as p  # noqa: E402


def _f(q):
    r = p(q)
    return r["filters"] if r else None


def test_screenshot_cases():
    assert _f("empresas con ingresos superiores a 50 millones") == {"revenue_min": 50_000_000}
    assert _f("empresas con facturación superior a 50 millones") == {"revenue_min": 50_000_000}
    assert _f("búscame empresas con EBITDA superior a 1 millón") == {"ebitda_min": 1_000_000}


def test_variants():
    assert _f("empresas de más de 10 millones de facturación") == {"revenue_min": 10_000_000}
    assert _f("compañías con más de 100 empleados") == {"employees_min": 100}
    assert _f("ingresos menores de 2 millones") == {"revenue_max": 2_000_000}
    assert _f("empresas con ingresos entre 5 y 20 millones") == {
        "revenue_min": 5_000_000, "revenue_max": 20_000_000}


def test_growth_percent_not_read_as_money():
    assert _f("empresas que crezcan más de 20%") == {"growth_min": 0.20}


def test_spanish_number_formats():
    assert _f("facturación superior a 1,5 millones") == {"revenue_min": 1_500_000}
    assert _f("facturación superior a 50.000 euros") == {"revenue_min": 50_000}


def test_sector_plus_numeric_residual():
    r = p("agencias de marketing con ebitda superior a 1 millón")
    assert r["filters"] == {"ebitda_min": 1_000_000}
    assert "agencias" in r["residual"] and "marketing" in r["residual"]


def test_province_only_with_numeric():
    r = p("empresas con ingresos superiores a 5 millones en Valencia")
    assert r["filters"] == {"revenue_min": 5_000_000, "province": "valencia"}


def test_non_financial_returns_none():
    assert p("agencias de marketing") is None
    assert p("clínicas dentales en Valencia") is None
    assert p("Servier") is None
    assert p("") is None
