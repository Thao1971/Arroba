"""REQ-004 — NL → financial filters parser (Beta side). Pure, no I/O."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from src.modules.copilot.financial_query import parse_financial_query  # noqa: E402

p = parse_financial_query  # shorthand used throughout this file


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


def test_multi_metric_revenue_and_employees():
    # Daniel's example: revenue + employees in one query.
    assert _f("empresas de más de 1 millón de euros con menos de 100 empleados") == {
        "revenue_min": 1_000_000, "employees_max": 100}


def test_sector_plus_multi_metric_residual():
    r = p("agencias de marketing con más de 1 millón de euros y menos de 100 empleados")
    assert r["filters"] == {"revenue_min": 1_000_000, "employees_max": 100}
    assert "agencias" in r["residual"] and "marketing" in r["residual"]


def test_ebitda_margin():
    # margen de EBITDA con "%" y comparador "al/del" (el caso del screenshot)
    assert _f("empresas con margen de EBITDA superior al 30%") == {"ebitda_margin_min": 0.30}
    assert _f("empresas con margen EBITDA superior a 30%") == {"ebitda_margin_min": 0.30}
    assert _f("margen inferior al 10%") == {"ebitda_margin_max": 0.10}
    # crecimiento con "%" sigue siendo growth, no margen
    assert _f("empresas que crezcan más de 20%") == {"growth_min": 0.20}
    # combo margen + ingresos
    assert _f("empresas con más del 30% de margen y más de 5M de ingresos") == {
        "ebitda_margin_min": 0.30, "revenue_min": 5_000_000}


def test_non_financial_returns_none():
    assert p("agencias de marketing") is None
    assert p("Servier") is None
    assert p("") is None


def test_sector_plus_province_no_predicate_routes_to_structured_search():
    """Sector + provincia sin predicado numerico tambien enruta a busqueda
    estructurada (mismo contrato que test_province_only_routes_to_structured_search,
    con sector delante en vez de detras) — antes se descartaba (return None)."""
    out = p("clínicas dentales en Valencia")
    assert out is not None
    assert out["filters"] == {"province": "valencia"}
    assert "clinicas" in out["residual"] and "dentales" in out["residual"]


def test_province_only_routes_to_structured_search():
    """Provincia sola (sin número) debe devolver filters con province y residual
    sectorial limpio (sin 'en madrid') — antes se descartaba (return None)."""
    out = parse_financial_query("agencias inmobiliarias en madrid")
    assert out is not None
    assert out["filters"].get("province") == "madrid"
    assert "madrid" not in out["residual"]
    assert "agencias" in out["residual"] and "inmobiliarias" in out["residual"]


def test_no_predicate_no_province_returns_none():
    assert parse_financial_query("agencias inmobiliarias") is None
