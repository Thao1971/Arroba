"""
Official BUD Advisors Taxonomy - MadTech España v2.0 2026
Hierarchical structure: Category → Subcategories
"""

TAXONOMY = [
    {
        "id": "estrategia_marca_diseno",
        "name": "Estrategia, Marca y Diseño",
        "subcategories": [
            {"id": "brand_strategy", "name": "Brand strategy"},
            {"id": "naming_arquitectura", "name": "Naming y arquitectura de marca"},
            {"id": "identidad_visual", "name": "Identidad visual y diseño"},
            {"id": "research_insights", "name": "Research & Consumer Insights"},
        ]
    },
    {
        "id": "creatividad_produccion",
        "name": "Creatividad y Producción",
        "subcategories": [
            {"id": "agencia_creativa", "name": "Agencia creativa (ATL / TTL)"},
            {"id": "content_studio", "name": "Content studio"},
            {"id": "produccion_audiovisual", "name": "Producción audiovisual"},
            {"id": "motion_3d_craft", "name": "Motion / 3D / craft"},
            {"id": "experiencias_inmersivas", "name": "Experiencias inmersivas (AR/VR)"},
        ]
    },
    {
        "id": "comunicacion_pr_reputacion",
        "name": "Comunicación, PR y Reputación",
        "subcategories": [
            {"id": "pr_corporativo", "name": "PR corporativo"},
            {"id": "comunicacion_digital", "name": "Comunicación digital"},
            {"id": "public_affairs", "name": "Public affairs"},
            {"id": "comunicacion_interna", "name": "Comunicación interna"},
            {"id": "crisis_issues", "name": "Crisis & issues management"},
        ]
    },
    {
        "id": "experiencias_activacion",
        "name": "Experiencias y Activación (BTL)",
        "subcategories": [
            {"id": "eventos_produccion", "name": "Eventos y producción"},
            {"id": "experiential_marketing", "name": "Experiential marketing"},
            {"id": "trade_marketing", "name": "Trade marketing"},
            {"id": "field_marketing", "name": "Field marketing"},
            {"id": "retail_activation", "name": "Retail activation"},
        ]
    },
    {
        "id": "influencer_creator",
        "name": "Influencer & Creator Economy",
        "subcategories": [
            {"id": "influencer_marketing", "name": "Influencer marketing (campañas)"},
            {"id": "talent_management", "name": "Talent management"},
            {"id": "creator_production", "name": "Creator production"},
            {"id": "social_amplification", "name": "Social amplification"},
        ]
    },
    {
        "id": "medios_performance_programmatic",
        "name": "Medios, Performance y Programmatic",
        "subcategories": [
            {"id": "agencia_medios", "name": "Agencia de medios"},
            {"id": "performance_paid", "name": "Performance / Paid media"},
            {"id": "programmatic_trading", "name": "Programmatic / Trading desk"},
            {"id": "retail_media_buying", "name": "Retail media buying"},
        ]
    },
    {
        "id": "digital_growth_commerce",
        "name": "Digital, Growth y Commerce",
        "subcategories": [
            {"id": "desarrollo_web", "name": "Desarrollo web y plataformas"},
            {"id": "producto_digital_ux", "name": "Producto digital / UX-UI"},
            {"id": "seo", "name": "SEO"},
            {"id": "geo", "name": "GEO (Generative Engine Optimization)"},
            {"id": "crm_automation", "name": "CRM y automation"},
            {"id": "cro", "name": "CRO"},
            {"id": "ecommerce_marketplaces", "name": "Ecommerce y marketplaces"},
        ]
    },
    {
        "id": "data_adtech_martech",
        "name": "Data, AdTech y MarTech",
        "subcategories": [
            {"id": "dsp", "name": "DSP"},
            {"id": "ssp", "name": "SSP"},
            {"id": "ad_exchange", "name": "Ad Exchange"},
            {"id": "cdp_dmp", "name": "CDP / DMP"},
            {"id": "data_clean_rooms", "name": "Data Clean Rooms"},
            {"id": "medicion_attribution", "name": "Medición / Attribution"},
            {"id": "ad_verification", "name": "Ad verification / Brand safety"},
            {"id": "anti_fraud", "name": "Anti-fraud"},
            {"id": "mmp", "name": "MMP"},
        ]
    },
    {
        "id": "consultoria_transformacion",
        "name": "Consultoría de Transformación",
        "subcategories": [
            {"id": "consultoria_tech", "name": "Consultoría tecnológica (MarTech)"},
            {"id": "data_strategy_privacy", "name": "Data strategy & privacy"},
            {"id": "consultoria_ia", "name": "Consultoría de IA"},
            {"id": "innovacion", "name": "Innovación"},
            {"id": "estrategia_crecimiento", "name": "Estrategia de crecimiento"},
        ]
    },
    {
        "id": "soportes_media_owners",
        "name": "Soportes y Media Owners",
        "subcategories": [
            {"id": "ooh_tradicional", "name": "OOH tradicional"},
            {"id": "dooh", "name": "DOOH"},
            {"id": "transporte", "name": "Transporte (metro, aeropuertos, etc.)"},
            {"id": "indoor_advertising", "name": "Indoor advertising"},
            {"id": "retail_media_owner", "name": "Retail media owner"},
            {"id": "ctv_owner", "name": "CTV owner"},
            {"id": "audio_network", "name": "Audio network"},
        ]
    },
]

# Legacy mapping from old sector IDs to new taxonomy
LEGACY_SECTOR_MAPPING = {
    "seo": "digital_growth_commerce",
    "sem": "medios_performance_programmatic",
    "social": "influencer_creator",
    "content": "creatividad_produccion",
    "programmatic": "medios_performance_programmatic",
    "creative": "creatividad_produccion",
    "development": "digital_growth_commerce",
    "data": "data_adtech_martech",
    "ecommerce": "digital_growth_commerce",
    "performance": "medios_performance_programmatic",
    "branding": "estrategia_marca_diseno",
    "fullservice": "digital_growth_commerce",
    "video": "creatividad_produccion",
    "influencer": "influencer_creator",
    "pr": "comunicacion_pr_reputacion",
    "automation": "digital_growth_commerce",
}


def get_category_by_id(category_id: str) -> dict:
    for cat in TAXONOMY:
        if cat["id"] == category_id:
            return cat
    return None


def get_subcategory_by_id(subcategory_id: str) -> dict:
    for cat in TAXONOMY:
        for sub in cat["subcategories"]:
            if sub["id"] == subcategory_id:
                return {**sub, "parent_id": cat["id"], "parent_name": cat["name"]}
    return None


def map_legacy_sector(old_sector_id: str) -> str:
    return LEGACY_SECTOR_MAPPING.get(old_sector_id, "digital_growth_commerce")


def get_flat_subcategories() -> list:
    result = []
    for cat in TAXONOMY:
        for sub in cat["subcategories"]:
            result.append({
                "id": sub["id"],
                "name": sub["name"],
                "category_id": cat["id"],
                "category_name": cat["name"]
            })
    return result
