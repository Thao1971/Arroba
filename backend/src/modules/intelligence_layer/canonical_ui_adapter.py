"""Adaptador canónico UI (D2 · B.6.f).

Traduce los DTOs internos del `intelligence_layer` (`MasterRecord`,
`FinancialAnalysis`, `Valuation`, `SemanticProfile`, `SimilarCompanies`)
a los `*Section` canónicos UI que consume el frontend (endpoints
`/api/companies/{cif}/section/*`).

Reglas aplicadas:
    * R4/R10: NO deriva `variation`, `benchmark`, `semantic`, `explanation`.
      Sólo mapea lo que existe. Cuando no existe → `None`.
    * R5: `metadata.engine_version` siempre `arroba-*-v1`. Nunca replica
      nombres del proveedor externo (`financial-intelligence-v1`, etc.).
    * `metadata.source` es user-facing (ej. "Iberinform · Registradores
      Mercantiles"). NUNCA menciona el nombre técnico del proveedor.
    * `metadata.coverage` es explícito y honesto (`False` cuando el
      Master Layer está vacío → el frontend degrada a `UnavailableBlock`).
    * `explainability` siempre `None` en B.6.f (se poblará por
      `arroba-explainability-v1` en fase futura).

Este módulo NO calcula. Sólo **transporta y estructura**.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from src.modules.intelligence_layer.interfaces.canonical_ui import (
    ConfidenceInfo,
    FinancialAnomaly,
    FinancialEvolutionBlock,
    FinancialRatioItem,
    FinancialRatiosBlock,
    FinancialSection,
    FinancialSeries,
    FinancialTableBlock,
    FinancialTableCell,
    FinancialTableRow,
    IdentityClassification,
    IdentityContact,
    IdentityLocation,
    IdentityRegistryStatus,
    IdentitySection,
    IdentitySectionCoverage,
    IdentitySize,
    SectionCoverage,
    SectionMetadata,
    SemanticSection,
    SemanticSectionCoverage,
    SemanticSimilarItem,
    ValuationPeer,
    ValuationRangeBar,
    ValuationSection,
    ValuationSectionCoverage,
)
from src.modules.intelligence_layer.interfaces.financial import (
    FinancialAnalysis,
    RatiosCatalog,
    Valuation,
)
from src.modules.intelligence_layer.interfaces.master import MasterRecord
from src.modules.intelligence_layer.interfaces.semantic import (
    SemanticProfile,
    SimilarCompanies,
)

# ---------- Etiquetas canónicas user-facing (nunca menciona proveedor externo) ----------
DEFAULT_FINANCIAL_SOURCE = "Registros oficiales · Cuentas depositadas"
DEFAULT_IDENTITY_SOURCE = "Registro Mercantil · Datos oficiales"
DEFAULT_SEMANTIC_SOURCE = "Análisis semántico arroba"
DEFAULT_VALUATION_SOURCE = "Modelo de valoración arroba"

FIN_ENGINE = "arroba-financial-v1"
IDENT_ENGINE = "arroba-identity-v1"
SEM_ENGINE = "arroba-semantic-v1"

# Etiquetas canónicas de filas P&L y Balance (arroba-financial-v1)
PL_ROWS = [
    ("revenue", "Ingresos", "total"),
    ("supplies", "Aprovisionamientos", "line"),
    ("personnel_costs", "Gastos de personal", "line"),
    ("depreciation", "Amortización", "line"),
    ("operating_income", "Resultado de explotación", "subtotal"),
    ("ebit", "EBIT", "subtotal"),
    ("ebitda", "EBITDA", "subtotal"),
    ("financial_expenses", "Gastos financieros", "line"),
    ("net_income", "Beneficio neto", "total"),
]

BALANCE_ROWS = [
    ("current_assets", "Activo corriente", "subtotal"),
    ("non_current_assets", "Activo no corriente", "subtotal"),
    ("total_assets", "Total activo", "total"),
    ("cash", "Tesorería", "line"),
    ("current_liabilities", "Pasivo corriente", "subtotal"),
    ("non_current_liabilities", "Pasivo no corriente", "subtotal"),
    ("total_liabilities", "Total pasivo", "total"),
    ("st_debt", "Deuda a corto plazo", "line"),
    ("lt_debt", "Deuda a largo plazo", "line"),
    ("financial_debt", "Deuda financiera total", "derived"),
    ("equity", "Patrimonio neto", "total"),
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _pick_confidence(*values: float | None) -> ConfidenceInfo | None:
    """Sin datos reales de confianza el proveedor no expone → devolvemos None."""
    return None


# ============================================================
# FinancialSection
# ============================================================


def _cell_from_value(value: float | None, fmt: str = "currency") -> FinancialTableCell:
    return FinancialTableCell(value=value, format=fmt)  # type: ignore[arg-type]


def _series_currency(key: str, label: str, values: list[float | None]) -> FinancialSeries:
    return FinancialSeries(key=key, label=label, values=values, format="currency")


def _extract_series_from_kpis_evolution(
    evolution: dict[str, Any] | None,
    key: str,
) -> list[float | None]:
    """Extrae array `[…]` de `kpis.evolution.{key}` respetando el orden."""
    if not evolution:
        return []
    raw = evolution.get(key)
    if not isinstance(raw, list):
        return []
    out: list[float | None] = []
    for item in raw:
        if isinstance(item, (int, float)):
            out.append(float(item))
        else:
            out.append(None)
    return out


def _detect_years_from_analysis(analysis: FinancialAnalysis) -> list[int]:
    """Devuelve el orden canónico de años a usar en evolution/pl/balance.

    Fuente única F0.2: `analysis.evolution.points[].year` (real, sin interpolar
    · R15). Fallback: `analysis.years`. Fallback final: `[analysis.year]`.
    """
    if analysis.evolution and isinstance(analysis.evolution.get("points"), list):
        ys = [int(p["year"]) for p in analysis.evolution["points"] if isinstance(p, dict) and p.get("year") is not None]
        if ys:
            return sorted(set(ys))
    if analysis.years:
        return sorted({y for y in analysis.years if isinstance(y, int)})
    if analysis.year is not None:
        return [analysis.year]
    return []


def _evolution_series_from_points(
    points: list[dict[str, Any]] | None, years: list[int]
) -> list[FinancialSeries]:
    """Construye las series canónicas revenue/EBITDA/net_income desde
    `evolution.points` alineadas a `years` (ascendente). Rellena con `None`
    los años donde el proveedor no aporte dato (R15 · no interpolamos)."""
    if not points:
        return []
    by_year: dict[int, dict[str, Any]] = {}
    for p in points:
        if not isinstance(p, dict) or p.get("year") is None:
            continue
        by_year[int(p["year"])] = p

    series: list[FinancialSeries] = []
    for key, label in (
        ("revenue", "Ingresos"),
        ("ebitda", "EBITDA"),
        ("net_income", "Beneficio neto"),
    ):
        vals: list[float | None] = []
        any_value = False
        for y in years:
            v = by_year.get(y, {}).get(key)
            if isinstance(v, (int, float)):
                vals.append(float(v))
                any_value = True
            else:
                vals.append(None)
        if any_value:
            series.append(_series_currency(key, label, vals))
    return series


def to_financial_section(
    analysis: FinancialAnalysis,
    ratios_catalog: RatiosCatalog | None = None,
) -> FinancialSection:
    """Traduce `FinancialAnalysis` → `FinancialSection` canónico UI.

    Regla clave: si `analysis.has_financials=False` → coverage.* = False. El
    frontend degrada cada sub-bloque a `UnavailableBlock`.

    F0.2: usa `evolution.points` (shape actual del Intelligence Engine) para
    poblar series multi-año. R15 estricta: sin interpolar, sin extrapolar.
    """
    years = _detect_years_from_analysis(analysis)
    last_year = analysis.year if analysis.year is not None else (years[-1] if years else None)

    # --- evolution: prioridad al shape F0.2 (`analysis.evolution.points`) ---
    evolution_block: FinancialEvolutionBlock | None = None
    if analysis.has_financials and years:
        series: list[FinancialSeries] = []
        if analysis.evolution and isinstance(analysis.evolution.get("points"), list):
            series = _evolution_series_from_points(analysis.evolution.get("points"), years)
        else:
            # Retrocompat B.6.b: `kpis.evolution` dict con arrays.
            ev = analysis.kpis.evolution if analysis.kpis else None
            if ev:
                for k, label in (("revenue", "Ingresos"), ("ebitda", "EBITDA"), ("net_income", "Beneficio neto")):
                    vals = _extract_series_from_kpis_evolution(ev, k)
                    if vals:
                        if len(vals) < len(years):
                            vals = [None] * (len(years) - len(vals)) + vals
                        elif len(vals) > len(years):
                            vals = vals[-len(years):]
                        series.append(_series_currency(k, label, vals))
        if series:
            evolution_block = FinancialEvolutionBlock(
                years=years,
                series=series,
                annotations=[],
            )

    # --- profit_loss (multi-año). Sólo poblable si el proveedor entrega history explícita.
    # El schema §6.2 actual sólo trae `income_statement` singular (último ejercicio).
    # Para no calcular años previos, sólo poblamos si hay ≥1 año y datos.
    pl_block: FinancialTableBlock | None = None
    if analysis.has_financials and analysis.income_statement and years:
        pl_rows: list[FinancialTableRow] = []
        for key, label, category in PL_ROWS:
            raw = getattr(analysis.income_statement, key, None)
            if raw is None:
                continue
            # 1 año → 1 celda. Si hay más años, el resto queda como None (no calculamos).
            cells: list[FinancialTableCell] = []
            for y in years:
                if y == (last_year or years[-1]):
                    cells.append(FinancialTableCell(value=float(raw), format="currency"))
                else:
                    cells.append(FinancialTableCell(value=None, format="currency"))
            pl_rows.append(
                FinancialTableRow(
                    key=key,
                    label=label,
                    category=category,  # type: ignore[arg-type]
                    values=cells,
                )
            )
        if pl_rows:
            pl_block = FinancialTableBlock(years=years, rows=pl_rows)

    # --- balance ---
    bal_block: FinancialTableBlock | None = None
    if analysis.has_financials and analysis.balance_sheet and years:
        bal_rows: list[FinancialTableRow] = []
        for key, label, category in BALANCE_ROWS:
            raw = getattr(analysis.balance_sheet, key, None)
            if raw is None:
                continue
            cells = []
            for y in years:
                if y == (last_year or years[-1]):
                    cells.append(FinancialTableCell(value=float(raw), format="currency"))
                else:
                    cells.append(FinancialTableCell(value=None, format="currency"))
            bal_rows.append(
                FinancialTableRow(
                    key=key,
                    label=label,
                    category=category,  # type: ignore[arg-type]
                    values=cells,
                )
            )
        if bal_rows:
            bal_block = FinancialTableBlock(years=years, rows=bal_rows)

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

    # --- anomaly ---
    anomaly_block: FinancialAnomaly | None = None
    if analysis.anomaly:
        a = analysis.anomaly
        detected = bool(a.get("detected", False))
        severity_raw = a.get("severity")
        severity = severity_raw if severity_raw in ("low", "medium", "high") else None
        anomaly_block = FinancialAnomaly(
            detected=detected,
            severity=severity,  # type: ignore[arg-type]
            title=a.get("title"),
            explanation=a.get("explanation"),
        )
    elif analysis.evolution and analysis.evolution.get("anomaly") is not None:
        # F0.2: `evolution.anomaly` es un boolean simple del proveedor.
        detected = bool(analysis.evolution.get("anomaly"))
        anomaly_block = FinancialAnomaly(detected=detected)

    coverage = SectionCoverage(
        evolution=evolution_block is not None,
        profit_loss=pl_block is not None,
        balance=bal_block is not None,
        ratios=ratios_block is not None,
    )

    metadata = SectionMetadata(
        source=DEFAULT_FINANCIAL_SOURCE,
        updated_at=analysis.generated_at,
        confidence=_pick_confidence(),
        engine_version=FIN_ENGINE,
        coverage=coverage,
        generated_at=_now(),
    )

    return FinancialSection(
        master_id=analysis.master_id,
        cif_normalized=analysis.cif_normalized,
        evolution=evolution_block,
        profit_loss=pl_block,
        balance=bal_block,
        ratios=ratios_block,
        anomaly=anomaly_block,
        annotations=[],
        explainability=None,
        metadata=metadata,
    )


# ============================================================
# IdentitySection
# ============================================================


def to_identity_section(record: MasterRecord) -> IdentitySection:
    identity = record.identity
    core_has_data = bool(identity.legal_name or identity.cif)
    ownership_has_data = bool(record.ownership.shareholders or record.ownership.parents)
    officers_has_data = record.officers_count is not None
    objeto_has_data = bool(record.objeto_social)

    # Registry status (F0.1) — sólo se instancia si al menos un campo tiene valor.
    registry_fields = (
        record.mercantile_status,
        record.record_status,
        record.activity_status,
        record.legal_form,
        record.incorporation_date,
        record.is_listed,
        record.listed_market,
    )
    registry_status: IdentityRegistryStatus | None = None
    if any(f is not None for f in registry_fields):
        registry_status = IdentityRegistryStatus(
            mercantile_status=record.mercantile_status,
            record_status=record.record_status,
            activity_status=record.activity_status,
            legal_form=record.legal_form,
            incorporation_date=record.incorporation_date,
            is_listed=record.is_listed,
            listed_market=record.listed_market,
        )

    return IdentitySection(
        master_id=record.master_id,
        cif_normalized=record.cif_normalized,
        status=record.status,
        legal_name=identity.legal_name,
        commercial_name=identity.commercial_name,
        aliases=list(identity.aliases),
        country=identity.country,
        classification=IdentityClassification(
            cnae_code=record.classification.cnae_code,
            cnae_description=record.classification.cnae_description,
            cnae_section=record.classification.cnae_section,
            cnae_division=record.classification.cnae_division,
        ),
        location=IdentityLocation(
            provincia=record.location.provincia,
            municipio=record.location.municipio,
            codigo_postal=record.location.codigo_postal,
            pais=record.location.pais,
        ),
        contact=IdentityContact(
            web=record.contact.web,
            domain=record.contact.domain,
        ),
        size=IdentitySize(
            employees_total=record.size.employees_total,
            capital_social=record.size.capital_social,
        ),
        objeto_social=record.objeto_social,
        officers_count=record.officers_count,
        coverage=IdentitySectionCoverage(
            core=core_has_data,
            ownership=ownership_has_data,
            officers=officers_has_data,
            objeto_social=objeto_has_data,
        ),
        explainability=None,
        metadata=SectionMetadata(
            source=DEFAULT_IDENTITY_SOURCE,
            updated_at=record.updated_at,
            confidence=_pick_confidence(),
            engine_version=IDENT_ENGINE,
            coverage=None,
            generated_at=_now(),
        ),
        # F0.1 · superficie ampliada
        activity=record.activity,
        sectors=list(record.sectors),
        address=record.address,
        autonomous_community=record.autonomous_community,
        description=record.description,
        registry_status=registry_status,
        data_coverage=dict(record.data_coverage),
    )


# ============================================================
# ValuationSection
# ============================================================


def to_valuation_section(v: Valuation) -> ValuationSection:
    val_details = v.valuation
    has_valuation = bool(
        val_details
        and (
            val_details.enterprise_value is not None
            or val_details.equity_value is not None
        )
    )
    peers = v.comparables.peers if v.comparables else []
    has_peers = len(peers) > 0

    range_bar: ValuationRangeBar | None = None
    if val_details and val_details.range:
        range_bar = ValuationRangeBar(
            low=val_details.range.low,
            central=val_details.enterprise_value or val_details.equity_value,
            high=val_details.range.high,
            currency="EUR",
        )

    ui_peers: list[ValuationPeer] = [
        ValuationPeer(
            master_id=p.master_id,
            name=p.name,
            cnae_section=p.cnae_section,
            same_province=p.same_province,
            ebitda_margin=p.ebitda_margin,
            multiple=p.multiple,
        )
        for p in peers
    ]

    confidence: ConfidenceInfo | None = None
    if isinstance(v.confidence, (int, float)):
        # Mapea numérico 0-1 a nivel canónico + score 0-100.
        score = float(v.confidence) * 100 if v.confidence <= 1.0 else float(v.confidence)
        if score < 33:
            level = "low"
        elif score < 66:
            level = "medium"
        else:
            level = "high"
        confidence = ConfidenceInfo(level=level, score=score)  # type: ignore[arg-type]

    return ValuationSection(
        master_id=v.master_id,
        cif_normalized=v.cif_normalized,
        method=val_details.method if val_details else None,
        multiple_label=val_details.multiple_basis if val_details else None,
        multiple_value=val_details.multiple if val_details else None,
        range=range_bar,
        peers=ui_peers,
        inputs=[],
        disclaimer="Valoración indicativa basada en múltiplos de mercado. No sustituye a un due diligence.",
        coverage=ValuationSectionCoverage(
            valuation=has_valuation,
            peers=has_peers,
        ),
        explainability=None,
        metadata=SectionMetadata(
            source=DEFAULT_VALUATION_SOURCE,
            updated_at=v.generated_at,
            confidence=confidence,
            engine_version=FIN_ENGINE,
            coverage=None,
            generated_at=_now(),
        ),
    )


# ============================================================
# SemanticSection
# ============================================================


def to_semantic_section(
    profile: SemanticProfile | None,
    similar: SimilarCompanies | None,
) -> SemanticSection:
    activities = list(profile.activities) if profile else []
    products = list(profile.products_services) if profile else []
    markets = list(profile.markets) if profile else []
    keywords = list(profile.keywords) if profile else []
    vp = profile.value_proposition if profile else None
    bm = profile.business_model if profile else None

    similar_items: list[SemanticSimilarItem] = []
    if similar and similar.items:
        for it in similar.items:
            similar_items.append(
                SemanticSimilarItem(
                    master_id=it.master_id,
                    cif=it.cif_normalized,
                    name=it.name or "—",
                    sector=it.cnae_section,
                    region=it.provincia,
                    score=float(it.similarity_score or 0.0),
                    matched_dimensions=[
                        md.dimension for md in (it.matched_dimensions or [])
                    ],
                )
            )

    has_profile = bool(activities or products or markets or keywords or vp or bm)

    return SemanticSection(
        master_id=(profile.master_id if profile else None)
        or (similar.master_id if similar else None),
        cif_normalized=(profile.cif_normalized if profile else None)
        or (similar.cif_normalized if similar else None),
        activities=activities,
        products_services=products,
        markets=markets,
        keywords=keywords,
        value_proposition=vp,
        business_model=bm,
        similar=similar_items,
        coverage=SemanticSectionCoverage(
            profile=has_profile,
            similar=len(similar_items) > 0,
        ),
        explainability=None,
        metadata=SectionMetadata(
            source=DEFAULT_SEMANTIC_SOURCE,
            updated_at=(profile.generated_at if profile else None)
            or (similar.generated_at if similar else None),
            confidence=_pick_confidence(),
            engine_version=SEM_ENGINE,
            coverage=None,
            generated_at=_now(),
        ),
    )


__all__ = [
    "to_financial_section",
    "to_identity_section",
    "to_valuation_section",
    "to_semantic_section",
    "FIN_ENGINE",
    "IDENT_ENGINE",
    "SEM_ENGINE",
    "DEFAULT_FINANCIAL_SOURCE",
    "DEFAULT_IDENTITY_SOURCE",
    "DEFAULT_SEMANTIC_SOURCE",
    "DEFAULT_VALUATION_SOURCE",
]
