"""
Deal Readiness Service
Evaluates a deal's readiness to publish using obligatory (70%) and recommended (30%) criteria.
Returns a structured checklist with actionable CTAs for each missing item.
"""
from database import deals_collection, db


async def compute_readiness(deal_id: str) -> dict:
    """
    Compute deal readiness score and checklist.
    Obligatory items (70% weight): must-haves for a quality publication.
    Recommended items (30% weight): improve buyer confidence.
    """
    deal = await deals_collection.find_one({"deal_id": deal_id}, {"_id": 0})
    if not deal:
        return {"error": "Deal not found"}

    company_id = deal.get("company_id")
    company = await db.companies.find_one({"company_id": company_id}, {"_id": 0}) if company_id else None

    teaser = deal.get("teaser_full") or deal.get("teaser", {})
    infomemo = deal.get("infomemo")
    dataroom = deal.get("dataroom", {})
    financials = company.get("financials", []) if company else []
    latest_fin = financials[0] if financials else {}

    # Data Room analysis
    dr_folders = dataroom.get("folders", [])
    dr_total_docs = sum(len(f.get("documents", [])) for f in dr_folders)
    dr_financial_docs = 0
    dr_legal_docs = 0
    dr_populated_folders = 0
    for f in dr_folders:
        docs = f.get("documents", [])
        if docs:
            dr_populated_folders += 1
        fname = (f.get("name") or "").lower()
        if "financ" in fname or "contab" in fname or "fiscal" in fname:
            dr_financial_docs += len(docs)
        if "legal" in fname or "jurid" in fname or "societ" in fname:
            dr_legal_docs += len(docs)

    # Taxonomy
    taxonomy = company.get("taxonomy") or company.get("cis_codes") or []
    has_taxonomy = bool(taxonomy) if isinstance(taxonomy, list) else bool(taxonomy)

    # ============ OBLIGATORY ITEMS (70%) ============
    obligatory = []

    # 1. Teaser generado
    has_teaser = bool(teaser and (teaser.get("headline") or teaser.get("title")))
    obligatory.append({
        "id": "teaser",
        "label": "Teaser generado y editable",
        "completed": has_teaser,
        "category": "obligatorio",
        "cta": "Generar teaser",
        "href": "teaser",
    })

    # 2. Infomemo generado
    has_infomemo = bool(infomemo and infomemo.get("content"))
    obligatory.append({
        "id": "infomemo",
        "label": "Infomemo generado",
        "completed": has_infomemo,
        "category": "obligatorio",
        "cta": "Generar infomemo",
        "href": "infomemo",
    })

    # 3. Facturacion
    has_revenue = bool(latest_fin.get("revenue"))
    obligatory.append({
        "id": "revenue",
        "label": "Facturacion registrada",
        "completed": has_revenue,
        "category": "obligatorio",
        "cta": "Completar financieros",
        "href": "company",
    })

    # 4. EBITDA
    has_ebitda = bool(latest_fin.get("ebitda"))
    obligatory.append({
        "id": "ebitda",
        "label": "EBITDA registrado",
        "completed": has_ebitda,
        "category": "obligatorio",
        "cta": "Completar financieros",
        "href": "company",
    })

    # 5. Tipo de operacion
    ops = deal.get("operation_types_allowed", [])
    has_operation = len(ops) > 0
    obligatory.append({
        "id": "operation_type",
        "label": "Tipo de operacion definido",
        "completed": has_operation,
        "category": "obligatorio",
        "cta": "Definir operacion",
        "href": "deal_edit",
    })

    # 6. Precio o rango de valoracion
    has_price = bool(deal.get("asking_price"))
    valuation = company.get("valuation", {}) if company else {}
    has_valuation_range = bool(valuation.get("valuation_min"))
    has_pricing = has_price or has_valuation_range
    obligatory.append({
        "id": "pricing",
        "label": "Precio o rango de valoracion definido",
        "completed": has_pricing,
        "category": "obligatorio",
        "cta": "Definir precio",
        "href": "deal_edit",
    })

    # 7. Documentacion minima en Data Room (1+ docs en Financiero o Legal)
    has_min_docs = (dr_financial_docs + dr_legal_docs) >= 1
    obligatory.append({
        "id": "dataroom_min",
        "label": "Documentacion minima en Data Room",
        "completed": has_min_docs,
        "detail": f"{dr_financial_docs} financieros, {dr_legal_docs} legales" if has_min_docs else "Sube al menos 1 documento financiero o legal",
        "category": "obligatorio",
        "cta": "Subir documento",
        "href": "dataroom",
    })

    # 8. Taxonomia / categoria
    obligatory.append({
        "id": "taxonomy",
        "label": "Taxonomia / categoria asignada",
        "completed": has_taxonomy,
        "category": "obligatorio",
        "cta": "Asignar categoria",
        "href": "company",
    })

    # ============ RECOMMENDED ITEMS (30%) ============
    recommended = []

    # 1. Data Room mas completo (3+ docs)
    recommended.append({
        "id": "dataroom_complete",
        "label": "Data Room ampliado (3+ documentos)",
        "completed": dr_total_docs >= 3,
        "detail": f"{dr_total_docs} documento{'s' if dr_total_docs != 1 else ''} subido{'s' if dr_total_docs != 1 else ''}",
        "category": "recomendado",
        "cta": "Subir mas documentos",
        "href": "dataroom",
    })

    # 2. Presentacion comercial / credenciales
    has_commercial = any(
        "comercial" in (f.get("name") or "").lower() or
        "credential" in (f.get("name") or "").lower() or
        "presentacion" in (f.get("name") or "").lower()
        for f in dr_folders if f.get("documents")
    )
    recommended.append({
        "id": "commercial_docs",
        "label": "Credenciales / presentacion comercial",
        "completed": has_commercial,
        "category": "recomendado",
        "cta": "Subir presentacion",
        "href": "dataroom",
    })

    # 3. Mas de una carpeta poblada
    recommended.append({
        "id": "dr_folders",
        "label": "Mas de una carpeta en Data Room",
        "completed": dr_populated_folders >= 2,
        "detail": f"{dr_populated_folders} carpeta{'s' if dr_populated_folders != 1 else ''} con documentos",
        "category": "recomendado",
        "cta": "Organizar Data Room",
        "href": "dataroom",
    })

    # 4. Info equipo
    has_team = bool(company.get("team") or company.get("employees_count"))
    recommended.append({
        "id": "team_info",
        "label": "Informacion de equipo / comercial",
        "completed": has_team,
        "category": "recomendado",
        "cta": "Completar informacion",
        "href": "company",
    })

    # 5. Buyer matches disponibles
    from services.matching_service import get_compatible_buyers_for_deal
    try:
        matches = await get_compatible_buyers_for_deal(deal_id)
        has_matches = matches.get("total", 0) > 0
    except Exception:
        has_matches = False
    recommended.append({
        "id": "buyer_matches",
        "label": "Buyers compatibles identificados",
        "completed": has_matches,
        "detail": f"{matches.get('total', 0)} buyers compatibles" if has_matches else "Completa el perfil para mejorar matching",
        "category": "recomendado",
        "cta": "Ver matching",
        "href": "overview",
    })

    # 6. Teaser / infomemo revisados manualmente
    infomemo_version = infomemo.get("version", 1) if infomemo else 0
    teaser_revised = has_teaser and teaser.get("description") and len(teaser.get("highlights", [])) >= 2
    recommended.append({
        "id": "manual_review",
        "label": "Teaser e infomemo revisados manualmente",
        "completed": teaser_revised and infomemo_version >= 2,
        "category": "recomendado",
        "cta": "Revisar contenido",
        "href": "teaser",
    })

    # ============ COMPUTE SCORE ============
    obligatory_completed = sum(1 for i in obligatory if i["completed"])
    obligatory_total = len(obligatory)
    obligatory_pct = (obligatory_completed / obligatory_total) * 100 if obligatory_total else 100

    recommended_completed = sum(1 for i in recommended if i["completed"])
    recommended_total = len(recommended)
    recommended_pct = (recommended_completed / recommended_total) * 100 if recommended_total else 100

    score = round((obligatory_pct * 0.7) + (recommended_pct * 0.3))

    # Status label
    if score >= 90:
        status = "LISTO"
    elif score >= 60:
        status = "MEJORABLE"
    else:
        status = "DEBIL"

    # Missing obligatory items (for publish warning)
    missing_obligatory = [i for i in obligatory if not i["completed"]]
    missing_recommended = [i for i in recommended if not i["completed"]]

    return {
        "deal_id": deal_id,
        "score": score,
        "status": status,
        "obligatory": {
            "items": obligatory,
            "completed": obligatory_completed,
            "total": obligatory_total,
            "pct": round(obligatory_pct),
        },
        "recommended": {
            "items": recommended,
            "completed": recommended_completed,
            "total": recommended_total,
            "pct": round(recommended_pct),
        },
        "missing_obligatory": missing_obligatory,
        "missing_recommended": missing_recommended,
        "can_publish": True,
        "publish_warning": len(missing_obligatory) > 0,
        "publish_warning_message": (
            f"Tu deal se puede publicar, pero esta saliendo con {len(missing_obligatory)} carencia{'s' if len(missing_obligatory) != 1 else ''} que pueden reducir el interes de compradores."
            if missing_obligatory else None
        ),
    }
