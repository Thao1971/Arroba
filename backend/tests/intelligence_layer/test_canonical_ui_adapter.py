"""Tests del `to_financial_section` adapter — Sprint F0.2.

Verifica que el adapter propaga correctamente el shape actual del Intelligence
Engine (`statements` wrapper + `evolution.points` + ratios como dict con
metadatos) al contrato canónico UI `FinancialSection` (`arroba-financial-v1`).

Reglas críticas verificadas:
  * R15: sin interpolación · años ausentes → `None` (nunca dato inventado).
  * R5: `metadata.engine_version=arroba-financial-v1`, `metadata.source` no
    menciona proveedor externo.
  * P1 explainability first: `data_source` disponible en `FinancialAnalysis`
    (aún fuera del contrato UI; se accede vía Tooltip en F0.2).
"""
from __future__ import annotations

import pytest

from src.modules.intelligence_layer.canonical_ui_adapter import to_financial_section
from src.modules.intelligence_layer.interfaces.financial import (
    BalanceSheet,
    FinancialAnalysis,
    FinancialKpis,
    IncomeStatement,
)


def _totalenergies_analysis() -> FinancialAnalysis:
    """Fixture representativo del caso canónico F0.2 (TOTALENERGIES A87803862)."""
    return FinancialAnalysis(
        master_id="mc_80e03f1e1627",
        cif_normalized="A87803862",
        identity={"name": "TOTALENERGIES ELECTRICIDAD Y GAS ESPAÑA"},
        cnae_code="3515",
        cnae_section="D",
        provincia="MADRID",
        has_financials=True,
        data_source="master_companies + norm_financials (Iberinform)",
        source_version="iberinform",
        basis="individual",
        year=2024,
        years=[2024, 2023, 2022],
        kpis=FinancialKpis(revenue=933267000.0, ebitda=36544000.0, ebitda_margin=0.0392),
        income_statement=IncomeStatement(
            revenue=933267000.0,
            supplies=-868893000.0,
            personnel_costs=-6320000.0,
            operating_income=35519000.0,
            ebitda=36544000.0,
            ebit=35519000.0,
            net_income=25017000.0,
        ),
        balance_sheet=BalanceSheet(
            non_current_assets=7670000.0,
            current_assets=180533000.0,
            total_assets=188203000.0,
            equity=30531000.0,
            current_liabilities=153483000.0,
            non_current_liabilities=4189000.0,
            total_liabilities=157672000.0,
            financial_debt=904000.0,
        ),
        cashflow=None,
        ratios={
            "ebitda_margin": {
                "value": 0.0392,
                "name": "Margen EBITDA",
                "category": "profitability",
                "formula": "EBITDA / Ingresos",
                "explanation": "Rentabilidad operativa antes de amortizaciones.",
                "source": "Iberinform statements (Normalized Layer)",
                "available": True,
            },
            "current_ratio": {
                "value": 1.1762,
                "name": "Ratio de liquidez",
                "category": "liquidity",
                "formula": "Activo corriente / Pasivo corriente",
                "available": True,
            },
            "solvency": {
                "value": 0.1622,
                "name": "Solvencia",
                "category": "solvency",
                "available": True,
            },
        },
        evolution={
            "trend": "deterioration",
            "years": 3,
            "anomaly": False,
            "points": [
                {"year": 2024, "revenue": 933267000.0, "ebitda": 36544000.0, "net_income": 25017000.0},
                {"year": 2023, "revenue": 1288562000.0, "ebitda": 23984000.0, "net_income": 14425000.0},
                {"year": 2022, "revenue": 2229436000.0, "ebitda": 1009000.0, "net_income": -460000.0},
            ],
        },
        engine_version="arroba-financial-v1",
    )


def test_financial_section_evolution_uses_real_points_no_interpolation():
    """R15: 3 puntos reales del proveedor, `years` ascendente, sin interpolar."""
    section = to_financial_section(_totalenergies_analysis())
    assert section.evolution is not None
    assert section.evolution.years == [2022, 2023, 2024]
    # 3 series canónicas
    series_by_key = {s.key: s for s in section.evolution.series}
    assert set(series_by_key.keys()) == {"revenue", "ebitda", "net_income"}
    # Valores REALES del proveedor, alineados a años ascendentes
    assert series_by_key["revenue"].values == [2229436000.0, 1288562000.0, 933267000.0]
    assert series_by_key["ebitda"].values == [1009000.0, 23984000.0, 36544000.0]
    assert series_by_key["net_income"].values == [-460000.0, 14425000.0, 25017000.0]
    assert section.metadata.coverage.evolution is True


def test_financial_section_profit_loss_reuses_evolution_series_for_matching_keys():
    """R15: P&L rellena años previos desde evolution.series para las filas que
    tienen serie real (revenue/ebitda/net_income); el resto de filas (sin
    serie en el proveedor) sigue con solo el último año en None."""
    section = to_financial_section(_totalenergies_analysis())
    assert section.profit_loss is not None
    assert section.profit_loss.years == [2022, 2023, 2024]
    rev_row = next(r for r in section.profit_loss.rows if r.key == "revenue")
    assert rev_row.values[0].value == 2229436000.0  # 2022 desde evolution.series
    assert rev_row.values[1].value == 1288562000.0  # 2023 desde evolution.series
    assert rev_row.values[2].value == 933267000.0  # 2024 = last_year desde income_statement
    assert section.metadata.coverage.profit_loss is True


def test_financial_section_ratios_extract_from_dict_shape():
    """F0.2: ratios con shape dict `{value,name,category,formula}` se propagan."""
    section = to_financial_section(_totalenergies_analysis())
    assert section.ratios is not None
    items_by_key = {i.key: i for i in section.ratios.items}
    assert set(items_by_key.keys()) == {"ebitda_margin", "current_ratio", "solvency"}
    ebm = items_by_key["ebitda_margin"]
    assert ebm.name == "Margen EBITDA"
    assert ebm.category == "profitability"
    assert ebm.formula == "EBITDA / Ingresos"
    assert ebm.format == "percent"
    assert ebm.value == 0.0392
    assert items_by_key["current_ratio"].category == "liquidity"
    assert items_by_key["solvency"].category == "solvency"
    assert section.metadata.coverage.ratios is True


def test_financial_section_ratios_backward_compat_flat_shape():
    """B.6.b: ratios `{key: float}` siguen funcionando (retrocompat)."""
    analysis = _totalenergies_analysis()
    analysis.ratios = {"ebitda_margin": 0.256, "current_ratio": 1.4}
    section = to_financial_section(analysis)
    assert section.ratios is not None
    keys = {i.key for i in section.ratios.items}
    assert keys == {"ebitda_margin", "current_ratio"}


def test_financial_section_anomaly_from_evolution_bool():
    """F0.2: `evolution.anomaly` (bool) → `anomaly.detected`."""
    section = to_financial_section(_totalenergies_analysis())
    assert section.anomaly is not None
    assert section.anomaly.detected is False


def test_financial_section_cashflow_null_produces_no_block():
    """COMP-3005: proveedor devuelve `cashflow: null` → adapter no expone bloque específico.

    El schema `FinancialSection` no tiene `cashflow` como sub-bloque; el frontend
    lee `analysis.cashflow` desde el endpoint `/financial-analysis` (legacy) y
    aplica `UnavailableBlock` cuando es `None`.
    """
    section = to_financial_section(_totalenergies_analysis())
    # La cobertura no incluye cashflow explícito (por diseño del contrato UI).
    # Verificamos que las otras coverages sí están OK.
    assert section.metadata.coverage.evolution is True
    assert section.metadata.coverage.profit_loss is True
    assert section.metadata.coverage.balance is True


def test_financial_section_metadata_r5_engine_version():
    """R5: `metadata.engine_version` siempre `arroba-financial-v1`. Nunca menciona proveedor."""
    section = to_financial_section(_totalenergies_analysis())
    assert section.metadata.engine_version == "arroba-financial-v1"
    # No debe filtrarse el nombre técnico del proveedor
    assert "iberinform" not in (section.metadata.source or "").lower()
    assert "agency" not in (section.metadata.source or "").lower()
    assert "financial-intelligence-v1" not in (section.metadata.source or "")


def test_financial_section_empty_analysis_all_coverage_false():
    """`has_financials=False` → coverage.* = False (UnavailableBlock en UI)."""
    empty = FinancialAnalysis(cif_normalized="A00000000", has_financials=False)
    section = to_financial_section(empty)
    assert section.metadata.coverage.evolution is False
    assert section.metadata.coverage.profit_loss is False
    assert section.metadata.coverage.balance is False
    assert section.metadata.coverage.ratios is False
