from datetime import datetime, timezone
from typing import Optional
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage
from config import EMERGENT_LLM_KEY
from utils.helpers import round_financial_display, round_to_range

logger = logging.getLogger(__name__)


async def generate_teaser(company: dict, deal: dict) -> dict:
    """
    Generate an anonymized teaser for marketplace discovery.
    The teaser must NOT reveal company identity.
    """
    financials = company.get("financials", [])
    latest = sorted(financials, key=lambda x: x.get("year", 0), reverse=True)[0] if financials else {}

    revenue = latest.get("revenue", 0)
    ebitda = latest.get("ebitda", 0)

    # Calculate ranges (anonymized)
    revenue_range = _build_range_display(revenue)
    ebitda_range = _build_range_display(ebitda)

    # Build location (city level, no exact address)
    location = company.get("city", "")
    country = company.get("country", "España")
    if location:
        location = f"{location}, {country}"
    else:
        location = country

    # Sectors
    sectors = company.get("sectors", [])
    sector_display = ", ".join(sectors[:3]) if sectors else "Agencia Digital"

    # Deal types
    deal_types = deal.get("operation_types_allowed", ["full_sale"])
    deal_type_labels = {
        "full_sale": "Venta total",
        "partial_sale": "Venta parcial",
        "merger": "Fusión"
    }
    deal_type_display = ", ".join([deal_type_labels.get(t, t) for t in deal_types])

    # Highlights (sanitized - remove identifying info)
    highlights = company.get("highlights", [])
    sanitized_highlights = [_sanitize_text(h) for h in highlights if h.strip()]

    # Try AI generation for description
    ai_description = await _generate_ai_description(company, latest, deal)

    teaser = {
        "title": f"Agencia de {sector_display} en {company.get('city', country)}",
        "short_description": ai_description or _generate_basic_description(company, latest),
        "highlights": sanitized_highlights[:5],
        "revenue_range": revenue_range,
        "ebitda_range": ebitda_range,
        "revenue_exact": None,  # Never expose exact
        "ebitda_exact": None,
        "location": location,
        "country": country,
        "sector_display": sector_display,
        "sectors": sectors,
        "deal_type": deal_type_display,
        "operation_types": deal_types,
        "year_founded": company.get("founded_year"),
        "employees_range": _build_employees_range(company.get("employees_count")),
        "company_type": company.get("company_type", "digital_agency"),
        "growth_indicator": _get_growth_indicator(latest.get("growth_rate")),
        "ebitda_margin_range": _build_margin_range(latest.get("ebitda_margin")),
        "recurring_revenue_indicator": _get_recurring_indicator(latest.get("recurring_revenue_pct")),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "version": 1,
        "is_anonymized": True
    }

    return teaser


async def _generate_ai_description(company: dict, financials: dict, deal: dict) -> Optional[str]:
    """Generate AI anonymized description"""
    if not EMERGENT_LLM_KEY:
        return None

    try:
        sectors = ", ".join(company.get("sectors", ["digital"]))
        city = company.get("city", "España")
        employees = company.get("employees_count", "N/D")
        revenue = financials.get("revenue", 0)
        company_type = company.get("company_type", "agencia digital")

        prompt = f"""Genera una descripción breve y profesional (máximo 3 frases) para un teaser anónimo de una oportunidad de inversión en el marketplace de M&A de agencias digitales.

DATOS (NO revelar nombres ni datos identificables):
- Tipo: {company_type}
- Sectores: {sectors}
- Ubicación: {city}
- Empleados: {employees}
- Facturación aproximada: {round_financial_display(revenue) if revenue else 'N/D'}
- Descripción original (ANONIMIZAR): {company.get('description', 'N/D')}

REGLAS ESTRICTAS:
- NO mencionar nombres propios de empresas
- NO mencionar URLs ni dominios
- NO incluir datos que identifiquen directamente a la empresa
- Usar lenguaje profesional de M&A
- Usar rangos en vez de valores exactos
- Máximo 3 frases concisas

Responde SOLO con la descripción, sin explicaciones."""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"teaser_{datetime.now().timestamp()}",
            system_message="Eres un experto en M&A que genera teasers anónimos para agencias digitales."
        )
        chat.with_model("openai", "gpt-5.2")

        response = await chat.send_message(UserMessage(text=prompt))
        if response and len(response) < 500:
            return response.strip()

    except Exception as e:
        logger.error(f"AI teaser generation error: {e}")

    return None


def _generate_basic_description(company: dict, financials: dict) -> str:
    """Generate a basic anonymized description without AI"""
    sectors = ", ".join(company.get("sectors", ["servicios digitales"]))
    city = company.get("city", "España")
    revenue = financials.get("revenue", 0)
    employees = company.get("employees_count")

    parts = [f"Agencia especializada en {sectors} con sede en {city}."]

    if revenue:
        parts.append(f"Facturación en el rango de {_build_range_display(revenue)}.")

    if employees:
        parts.append(f"Equipo de {_build_employees_range(employees)} profesionales.")

    return " ".join(parts)


def _build_range_display(value: float) -> str:
    """Build a range display from exact value (anonymized)"""
    if not value or value <= 0:
        return "N/D"

    if value >= 10_000_000:
        lower = int(value / 1_000_000 // 5 * 5)
        upper = lower + 5
        return f"{lower}M - {upper}M €"
    elif value >= 1_000_000:
        lower = round(value / 1_000_000 * 0.8, 1)
        upper = round(value / 1_000_000 * 1.2, 1)
        return f"{lower}M - {upper}M €"
    elif value >= 100_000:
        lower = int(value / 1000 // 100 * 100)
        upper = lower + 200
        return f"{lower}k - {upper}k €"
    else:
        lower = int(value * 0.7 / 1000) * 1000
        upper = int(value * 1.3 / 1000) * 1000
        return f"{lower:,} - {upper:,} €"


def _build_employees_range(count) -> str:
    """Build employee range"""
    if not count:
        return "N/D"
    count = int(count)
    if count <= 5:
        return "1-5"
    elif count <= 10:
        return "5-10"
    elif count <= 25:
        return "10-25"
    elif count <= 50:
        return "25-50"
    elif count <= 100:
        return "50-100"
    elif count <= 250:
        return "100-250"
    else:
        return "250+"


def _build_margin_range(margin) -> Optional[str]:
    """Build EBITDA margin range"""
    if not margin:
        return None
    margin = float(margin)
    if margin < 5:
        return "<5%"
    elif margin < 10:
        return "5-10%"
    elif margin < 15:
        return "10-15%"
    elif margin < 20:
        return "15-20%"
    elif margin < 30:
        return "20-30%"
    else:
        return ">30%"


def _get_growth_indicator(growth_rate) -> Optional[str]:
    """Get growth indicator text"""
    if growth_rate is None:
        return None
    rate = float(growth_rate)
    if rate > 30:
        return "Alto crecimiento"
    elif rate > 15:
        return "Crecimiento sólido"
    elif rate > 5:
        return "Crecimiento moderado"
    elif rate > 0:
        return "Crecimiento leve"
    elif rate > -5:
        return "Estable"
    else:
        return "En contracción"


def _get_recurring_indicator(pct) -> Optional[str]:
    """Get recurring revenue indicator"""
    if pct is None:
        return None
    pct = float(pct)
    if pct >= 80:
        return "Muy alta recurrencia"
    elif pct >= 60:
        return "Alta recurrencia"
    elif pct >= 40:
        return "Recurrencia media"
    elif pct >= 20:
        return "Baja recurrencia"
    else:
        return "Principalmente proyectos"


def _sanitize_text(text: str) -> str:
    """Remove identifying information from text"""
    import re
    # Remove URLs
    text = re.sub(r'https?://\S+', '', text)
    # Remove email addresses
    text = re.sub(r'\S+@\S+\.\S+', '', text)
    # Remove phone numbers
    text = re.sub(r'[\+]?[\d\s\-\(\)]{7,}', '', text)
    return text.strip()
