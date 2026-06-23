from datetime import datetime, timezone
from typing import Dict, Optional
import os
from emergentintegrations.llm.chat import LlmChat, UserMessage
from config import EMERGENT_LLM_KEY


def _safe_format(value):
    """Safely format a numeric value for display"""
    if value is None:
        return "N/D"
    try:
        return f"{float(value):,.0f}"
    except (ValueError, TypeError):
        return "N/D"


def _safe_pct(value):
    """Safely format a percentage value"""
    if value is None:
        return "N/D"
    try:
        return f"{float(value):.1f}"
    except (ValueError, TypeError):
        return "N/D"

async def generate_infomemo(company: dict, deal: dict) -> dict:
    """
    Generate professional infomemo using AI (GPT-5.2)
    """
    if not EMERGENT_LLM_KEY:
        raise ValueError("EMERGENT_LLM_KEY not configured")
    
    # Build context from company data
    financials = company.get("financials", [])
    latest_financials = sorted(financials, key=lambda x: x.get("year", 0), reverse=True)[0] if financials else {}
    
    valuation = company.get("valuation", {})
    valuation_inputs = company.get("valuation_inputs", {})
    
    # Build the prompt
    company_context = f"""
DATOS DE LA COMPAÑÍA:
- Nombre Legal: {company.get('legal_name', 'N/D')}
- Nombre Comercial: {company.get('trade_name', 'N/D')}
- Tipo: {company.get('company_type', 'digital_agency')}
- Año de Fundación: {company.get('founded_year', 'N/D')}
- Empleados: {company.get('employees_count', 'N/D')}
- Ubicación: {company.get('city', '')}, {company.get('region', '')}, {company.get('country', 'España')}
- Sectores: {', '.join(company.get('sectors', []))}
- Especializaciones: {', '.join(company.get('specializations', []))}
- Descripción: {company.get('description', 'N/D')}
- Highlights: {', '.join(company.get('highlights', []))}

DATOS FINANCIEROS (Último año):
- Facturación: {_safe_format(latest_financials.get('revenue', 0))}€
- EBITDA: {_safe_format(latest_financials.get('ebitda', 0))}€
- Margen EBITDA: {_safe_pct(latest_financials.get('ebitda_margin', 0))}%
- Crecimiento: {_safe_pct(latest_financials.get('growth_rate', 0))}%
- % Ingresos Recurrentes: {_safe_pct(latest_financials.get('recurring_revenue_pct', 0))}%
- Concentración Top 5 Clientes: {_safe_pct(latest_financials.get('client_concentration_top5', 0))}%

DATOS DE VALORACIÓN:
- Dependencia del Fundador: {valuation_inputs.get('founder_dependency', 'medium')}
- Tipo de Recurrencia: {valuation_inputs.get('recurring_revenue_type', 'mixed')}
- Activos Tecnológicos: {'Sí' if valuation_inputs.get('tech_assets') else 'No'}
- Propiedad Intelectual: {'Sí' if valuation_inputs.get('proprietary_ip') else 'No'}
- Rango de Valoración: {_safe_format(valuation.get('valuation_min', 0))}€ - {_safe_format(valuation.get('valuation_max', 0))}€
- Múltiplo: {_safe_pct(valuation.get('multiple_min', 0))}x - {_safe_pct(valuation.get('multiple_max', 0))}x

DATOS DEL DEAL:
- Tipos de Operación Permitidos: {', '.join(deal.get('operation_types_allowed', []))}
- Precio Solicitado: {_safe_format(deal.get('asking_price'))}€ {'(Negociable)' if deal.get('price_negotiable') else ''}
"""

    system_message = """Eres un experto en M&A y banca de inversión especializado en agencias digitales. 
Tu tarea es generar un Information Memorandum (Infomemo) profesional y detallado para potenciales compradores.

El infomemo debe ser:
- Profesional y objetivo
- Bien estructurado con secciones claras
- Destacar los puntos fuertes sin exagerar
- Identificar riesgos de forma honesta
- Incluir recomendaciones de valoración fundamentadas

Formato: Usa Markdown con headers claros (##), bullets, y tablas donde sea apropiado.
Idioma: Español profesional de negocios."""

    user_prompt = f"""Genera un Information Memorandum profesional para la siguiente oportunidad de inversión:

{company_context}

El infomemo debe incluir las siguientes secciones:
1. Resumen Ejecutivo (máx. 200 palabras)
2. Descripción del Negocio
3. Propuesta de Valor y Diferenciación
4. Análisis Financiero (incluir tabla si hay datos)
5. Base de Clientes y Recurrencia
6. Equipo y Estructura Organizativa
7. Posicionamiento Competitivo
8. Oportunidades de Crecimiento
9. Factores de Riesgo
10. Términos de la Transacción y Valoración

Genera el documento completo en formato Markdown."""

    try:
        # Initialize LLM chat with GPT-5.2
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"infomemo_{company.get('company_id', 'unknown')}_{datetime.now().timestamp()}",
            system_message=system_message
        )
        chat.with_model("openai", "gpt-5.2")
        
        # Generate infomemo
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "content": response,
            "version": 1,
            "file_id": None
        }
        
    except Exception as e:
        # Return a basic template if AI fails
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "content": generate_basic_template(company, deal, latest_financials, valuation),
            "version": 1,
            "file_id": None,
            "error": str(e)
        }


def generate_basic_template(company: dict, deal: dict, financials: dict, valuation: dict) -> str:
    """Generate a basic infomemo template without AI"""
    return f"""# Information Memorandum

## {company.get('trade_name') or company.get('legal_name', 'Compañía')}

---

## 1. Resumen Ejecutivo

**{company.get('trade_name') or company.get('legal_name')}** es una {company.get('company_type', 'agencia digital')} 
fundada en {company.get('founded_year', 'N/D')} con sede en {company.get('city', '')}, {company.get('country', 'España')}.

La compañía cuenta con {company.get('employees_count', 'N/D')} empleados y está especializada en: {', '.join(company.get('sectors', ['servicios digitales']))}.

**Métricas clave:**
- Facturación: {financials.get('revenue', 0):,.0f}€
- EBITDA: {financials.get('ebitda', 0):,.0f}€
- Margen EBITDA: {financials.get('ebitda_margin', 0):.1f}%

---

## 2. Descripción del Negocio

{company.get('description', 'Descripción pendiente de completar.')}

**Highlights:**
{chr(10).join(['- ' + h for h in company.get('highlights', [])])}

---

## 3. Análisis Financiero

| Métrica | Valor |
|---------|-------|
| Facturación | {financials.get('revenue', 0):,.0f}€ |
| EBITDA | {financials.get('ebitda', 0):,.0f}€ |
| Margen EBITDA | {financials.get('ebitda_margin', 0):.1f}% |
| Crecimiento | {financials.get('growth_rate', 0):.1f}% |
| Ingresos Recurrentes | {financials.get('recurring_revenue_pct', 0):.0f}% |

---

## 4. Valoración

- **Rango de Valoración:** {valuation.get('valuation_min', 0):,.0f}€ - {valuation.get('valuation_max', 0):,.0f}€
- **Múltiplo EBITDA:** {valuation.get('multiple_min', 0):.1f}x - {valuation.get('multiple_max', 0):.1f}x

---

## 5. Términos de la Transacción

- **Tipo de Operación:** {', '.join(deal.get('operation_types_allowed', ['venta total']))}
- **Precio Solicitado:** {deal.get('asking_price', 'Negociable'):,.0f}€
- **Negociable:** {'Sí' if deal.get('price_negotiable', True) else 'No'}

---

*Documento generado por Arroba - Plataforma de M&A para Agencias Digitales*
"""
