import httpx
import logging
from typing import Optional
from config import IBERINFORM_CLIENT_ID, IBERINFORM_CLIENT_SECRET, IBERINFORM_BASE_URL

logger = logging.getLogger(__name__)


async def search_organisation_by_cif(cif: str) -> Optional[dict]:
    """Search Iberinform for an organisation by CIF/NIF"""
    if not IBERINFORM_CLIENT_ID or not IBERINFORM_CLIENT_SECRET:
        logger.warning("Iberinform credentials not configured")
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{IBERINFORM_BASE_URL}/modules/organisations/",
                params={
                    "registeredOfficeCode": cif,
                    "country": "ES",
                    "maxOrgs": 1,
                    "lang": "es"
                },
                headers={
                    "X-IBM-Client-Id": IBERINFORM_CLIENT_ID,
                    "X-IBM-Client-Secret": IBERINFORM_CLIENT_SECRET,
                    "Accept": "application/json"
                }
            )

            if response.status_code == 200:
                data = response.json()
                organisations = data.get("organisations", [])
                if organisations:
                    return organisations[0]
            else:
                logger.warning(f"Iberinform search returned {response.status_code}: {response.text[:200]}")

    except Exception as e:
        logger.error(f"Iberinform search error: {e}")

    return None


async def get_identification_details(organisation_id: str) -> Optional[dict]:
    """Get identification details from Iberinform"""
    if not IBERINFORM_CLIENT_ID or not IBERINFORM_CLIENT_SECRET:
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{IBERINFORM_BASE_URL}/modules/identificationDetails/{organisation_id}",
                params={"language": "es"},
                headers={
                    "X-IBM-Client-Id": IBERINFORM_CLIENT_ID,
                    "X-IBM-Client-Secret": IBERINFORM_CLIENT_SECRET,
                    "Accept": "application/json"
                }
            )
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        logger.error(f"Iberinform identification error: {e}")

    return None


async def get_financial_data(organisation_id: str) -> Optional[dict]:
    """Get financial data (balance sheet & income statement) from Iberinform"""
    if not IBERINFORM_CLIENT_ID or not IBERINFORM_CLIENT_SECRET:
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{IBERINFORM_BASE_URL}/modules/ordinaryBalanceSheetAndIncomeStatement/{organisation_id}",
                params={"language": "es"},
                headers={
                    "X-IBM-Client-Id": IBERINFORM_CLIENT_ID,
                    "X-IBM-Client-Secret": IBERINFORM_CLIENT_SECRET,
                    "Accept": "application/json"
                }
            )
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        logger.error(f"Iberinform financial data error: {e}")

    return None


async def get_sales_data(organisation_id: str) -> Optional[dict]:
    """Get sales data from Iberinform"""
    if not IBERINFORM_CLIENT_ID or not IBERINFORM_CLIENT_SECRET:
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{IBERINFORM_BASE_URL}/modules/sales/{organisation_id}",
                params={"language": "es"},
                headers={
                    "X-IBM-Client-Id": IBERINFORM_CLIENT_ID,
                    "X-IBM-Client-Secret": IBERINFORM_CLIENT_SECRET,
                    "Accept": "application/json"
                }
            )
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        logger.error(f"Iberinform sales data error: {e}")

    return None


def parse_iberinform_financials(financial_data: dict, sales_data: dict = None) -> list:
    """Parse Iberinform response into our Financial model format"""
    financials = []

    try:
        wrapper_years = financial_data.get("wrapperYears", [])
        if not wrapper_years:
            wrapper_years = financial_data.get("notAvailable", [])
            if wrapper_years:
                return financials

        for year_data in wrapper_years:
            balance_info = year_data.get("balanceInformation", {})
            year_str = balance_info.get("year", "")
            try:
                year = int(year_str)
            except (ValueError, TypeError):
                continue

            income_statement = year_data.get("incomeStatement", {})

            revenue = _safe_float(income_statement.get("netTurnover") or income_statement.get("operatingIncome"))
            ebitda = _safe_float(income_statement.get("ebitda") or income_statement.get("operatingResult"))
            net_income = _safe_float(income_statement.get("netResult") or income_statement.get("profitBeforeTax"))

            ebitda_margin = 0.0
            if revenue and revenue > 0 and ebitda:
                ebitda_margin = round((ebitda / revenue) * 100, 2)

            financials.append({
                "year": year,
                "revenue": revenue or 0,
                "ebitda": ebitda or 0,
                "ebitda_margin": ebitda_margin,
                "net_income": net_income,
                "recurring_revenue_pct": None,
                "client_concentration_top5": None,
                "growth_rate": None,
                "data_source": "IBERINFORM",
                "source_details": {
                    "balance_type": balance_info.get("balanceType", {}).get("value", ""),
                    "close_date": balance_info.get("closeDate", ""),
                    "period": balance_info.get("period", "")
                }
            })

    except Exception as e:
        logger.error(f"Error parsing Iberinform financials: {e}")

    return sorted(financials, key=lambda x: x["year"], reverse=True)


def parse_iberinform_company_info(identification_data: dict) -> dict:
    """Parse Iberinform identification data into company fields"""
    result = {}
    try:
        result["legal_name"] = identification_data.get("companyName", "")
        result["cif"] = identification_data.get("taxId", "")

        commercial = identification_data.get("commercialTitle", {})
        if isinstance(commercial, dict):
            items = commercial.get("items", [])
            if items:
                result["trade_name"] = items[0]

        result["website"] = identification_data.get("web", "")

        legal_form = identification_data.get("legalForm", {})
        if isinstance(legal_form, dict):
            result["legal_form"] = legal_form.get("value", "")

        status = identification_data.get("status", {})
        if isinstance(status, dict):
            result["company_status"] = status.get("value", "")

    except Exception as e:
        logger.error(f"Error parsing Iberinform company info: {e}")

    return result


def _safe_float(value) -> Optional[float]:
    """Safely convert a value to float"""
    if value is None:
        return None
    try:
        return float(str(value).replace(",", ".").replace(" ", ""))
    except (ValueError, TypeError):
        return None
