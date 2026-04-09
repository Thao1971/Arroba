"""
Premium Intelligence Agent — Capa interpretativa IA (GPT-5.2).
Consume datos cuantitativos y benchmark para generar interpretacion.
GPT NO calcula ratios. Solo interpreta datos ya calculados.
"""
import os
import json
import logging

logger = logging.getLogger(__name__)


async def generate_premium_analysis(
    deal_summary: dict,
    premium_quant: dict,
    premium_benchmark: dict,
    qualitative_data: dict | None,
) -> dict:
    """Generate interpretive analysis using GPT-5.2."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            logger.warning("EMERGENT_LLM_KEY not configured")
            return _fallback_analysis()

        chat = LlmChat(
            api_key=api_key,
            session_id=f"premium_{deal_summary.get('title', 'deal')[:20]}",
            system_message=SYSTEM_PROMPT,
        ).with_model("openai", "gpt-5.2")

        # Build context from quantitative data
        context = _build_context(deal_summary, premium_quant, premium_benchmark, qualitative_data)

        user_message = UserMessage(text=context)
        response = await chat.send_message(user_message)

        # Parse structured response
        return _parse_response(response)

    except Exception as e:
        logger.error(f"Premium analysis generation failed: {e}")
        return _fallback_analysis()


SYSTEM_PROMPT = """Eres un analista senior de M&A especializado en agencias digitales y empresas MadTech en Espana. 
Tu rol es interpretar datos financieros y de posicionamiento ya calculados para dar al comprador una lectura estrategica clara.

REGLAS:
- NO inventes numeros ni calcules ratios. Los datos ya estan calculados.
- Interpreta los datos proporcionados con criterio de M&A.
- Responde SIEMPRE en espanol.
- Usa un tono profesional pero accesible.
- Se directo y accionable.

FORMATO DE RESPUESTA (JSON estricto):
{
  "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "risks": ["riesgo 1", "riesgo 2", "riesgo 3"],
  "dd_questions": ["pregunta DD 1", "pregunta DD 2", "pregunta DD 3", "pregunta DD 4"],
  "strategic_reading": "Parrafo de 2-3 frases con lectura estrategica del activo.",
  "buyer_fit": {
    "ideal_profile": "Descripcion del comprador ideal en 1-2 frases.",
    "synergy_areas": ["area sinergia 1", "area sinergia 2"]
  }
}"""


def _build_context(deal_summary, quant, benchmark, qualitative):
    parts = []

    parts.append(f"ACTIVO: {deal_summary.get('title', 'Agencia digital')}")
    parts.append(f"Sector: {deal_summary.get('sector', 'Digital')}")
    if deal_summary.get("city"):
        parts.append(f"Ciudad: {deal_summary['city']}")
    if deal_summary.get("employees"):
        parts.append(f"Empleados: {deal_summary['employees']}")
    if deal_summary.get("revenue"):
        parts.append(f"Facturacion: {deal_summary['revenue']:,.0f} EUR")
    if deal_summary.get("ebitda"):
        parts.append(f"EBITDA: {deal_summary['ebitda']:,.0f} EUR")
    if deal_summary.get("asking_price"):
        parts.append(f"Asking price: {deal_summary['asking_price']:,.0f} EUR")

    # KPIs
    if quant.get("available"):
        parts.append("\nKPIs FINANCIEROS AVANZADOS:")
        for kpi_id, kpi in quant.get("kpis", {}).items():
            level = kpi.get("level_label", "")
            parts.append(f"  {kpi['label']}: {kpi['value']} {kpi['unit']} ({level})")

    # Benchmark
    if benchmark.get("available"):
        parts.append(f"\nBENCHMARK vs categoria ({benchmark['category']}, {benchmark['peer_count']} peers):")
        for metric, data in benchmark.get("percentiles", {}).items():
            parts.append(f"  {metric}: percentil {data['percentile']} ({data['label']})")
        parts.append(f"\nPOSICION vs CATEGORIA:")
        for metric, pos in benchmark.get("vs_category", {}).items():
            parts.append(f"  {metric}: {pos}")

    # Qualitative
    if qualitative:
        parts.append("\nSENALES CUALITATIVAS:")
        for k, v in qualitative.items():
            if k != "tags":
                parts.append(f"  {k}: {v}")

    parts.append("\nGenera tu analisis premium en formato JSON.")

    return "\n".join(parts)


def _parse_response(response: str) -> dict:
    """Parse GPT response, handling potential JSON in markdown code blocks."""
    text = response.strip()

    # Try to extract JSON from code blocks
    if "```" in text:
        import re
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if match:
            text = match.group(1)

    try:
        data = json.loads(text)
        return {
            "available": True,
            "strengths": data.get("strengths", []),
            "risks": data.get("risks", []),
            "dd_questions": data.get("dd_questions", []),
            "strategic_reading": data.get("strategic_reading", ""),
            "buyer_fit": data.get("buyer_fit", {}),
            "source": "GPT-5.2",
        }
    except json.JSONDecodeError:
        # Fallback: return raw text as strategic reading
        return {
            "available": True,
            "strengths": [],
            "risks": [],
            "dd_questions": [],
            "strategic_reading": text[:500],
            "buyer_fit": {},
            "source": "GPT-5.2",
        }


def _fallback_analysis() -> dict:
    return {
        "available": False,
        "strengths": [],
        "risks": [],
        "dd_questions": [],
        "strategic_reading": "El analisis premium no esta disponible en este momento.",
        "buyer_fit": {},
        "source": "fallback",
    }
