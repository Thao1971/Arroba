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
                    "country": "ESP",
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
                    org = organisations[0]
                    # Extract org ID from nested structure
                    org_ident = org.get("orgIdent", {})
                    org_id = org_ident.get("orgIdentId")
                    if org_id:
                        org["organisationId"] = str(org_id)
                    return org
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
                params={"language": "ES"},
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
                params={"language": "ES"},
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
                params={"language": "ES"},
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
            return financials

        for year_data in wrapper_years:
            balance_info = year_data.get("balanceInformation", {})
            year_str = balance_info.get("year", "")
            try:
                year = int(year_str)
            except (ValueError, TypeError):
                continue

            # Parse fullIncomeStatement accounts by code
            income_accounts = year_data.get("fullIncomeStatement", {}).get("accounts", [])
            account_map = {}
            for acc in income_accounts:
                code = acc.get("description", {}).get("code", "")
                balance_str = acc.get("balance", "0")
                account_map[code] = _safe_float(balance_str)

            # Map to ARROBA fields
            revenue = account_map.get("4010015ES")  # Importe neto cifra de negocios
            operating_result = account_map.get("4910015ES")  # Resultado de explotación
            depreciation = abs(account_map.get("4080015ES", 0) or 0)  # Amortización (negative in P&L)
            net_income = account_map.get("4950015ES")  # Resultado del ejercicio
            staff_costs = account_map.get("4060015ES")  # Gastos de personal

            # EBITDA = Resultado explotación + Amortización
            ebitda = None
            if operating_result is not None:
                ebitda = (operating_result or 0) + depreciation

            ebitda_margin = 0.0
            if revenue and revenue > 0 and ebitda:
                ebitda_margin = round((ebitda / revenue) * 100, 2)

            financials.append({
                "year": year,
                "revenue": revenue or 0,
                "ebitda": ebitda or 0,
                "ebitda_margin": ebitda_margin,
                "net_income": net_income,
                "operating_result": operating_result,
                "staff_costs": staff_costs,
                "depreciation": -depreciation if depreciation else None,
                "recurring_revenue_pct": None,
                "client_concentration_top5": None,
                "growth_rate": None,
                "data_source": "IBERINFORM",
                "source_details": {
                    "balance_type": balance_info.get("balanceType", {}).get("code", ""),
                    "close_date": balance_info.get("closeDate", ""),
                    "period": balance_info.get("period", ""),
                    "document_link": balance_info.get("documentLink", "")
                }
            })

    except Exception as e:
        logger.error(f"Error parsing Iberinform financials: {e}")

    return sorted(financials, key=lambda x: x["year"], reverse=True)


def parse_iberinform_company_info(identification_data: dict) -> dict:
    """Parse Iberinform identification + search data into company fields"""
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

        acronym = identification_data.get("acronym", {})
        if isinstance(acronym, dict):
            result["acronym"] = acronym.get("value", "")

        status = identification_data.get("status", {})
        if isinstance(status, dict):
            result["company_status"] = status.get("value", "")

        # Address from search data (if embedded)
        address = identification_data.get("nameAddress", {}).get("address", {})
        if address:
            result["city"] = address.get("city", "")
            result["province"] = address.get("countrySubident", "")
            result["postal_code"] = address.get("postCode", "")
            result["street"] = address.get("street", "")

        # CNAE from search data
        activity = identification_data.get("activity", {})
        if activity:
            result["cnae_code"] = activity.get("activityClassCode", "")
            result["cnae_description"] = activity.get("activityClassDesc", "")

    except Exception as e:
        logger.error(f"Error parsing Iberinform company info: {e}")

    return result


def _safe_float(value) -> Optional[float]:
    """Safely convert a value to float. Handles Spanish format: 6.429.000.000,00"""
    if value is None:
        return None
    try:
        s = str(value).strip()
        if not s or s == '0' or s == '0,00':
            return 0.0
        # Spanish format: dots for thousands, comma for decimal
        # Remove dots (thousands), replace comma with period (decimal)
        s = s.replace('.', '').replace(',', '.')
        return float(s)
    except (ValueError, TypeError):
        return None
