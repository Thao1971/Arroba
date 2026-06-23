"""
Test configuration — loads credentials from .env.test
Import this in test files instead of hardcoding credentials.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load test env
_test_env = Path(__file__).parent.parent / '.env.test'
if _test_env.exists():
    load_dotenv(_test_env)

# API URL
API_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://musing-hellman-9.preview.emergentagent.com')
API_BASE = f"{API_URL}/api"

# Test accounts
SELLER = {
    "email": os.environ.get("TEST_SELLER_EMAIL", "diego.martin@rankingdigital.es"),
    "password": os.environ.get("TEST_SELLER_PASSWORD", "demo2026"),
}
BUYER_FREE = {
    "email": os.environ.get("TEST_BUYER_FREE_EMAIL", "carlos.ruiz@capitaliberica.es"),
    "password": os.environ.get("TEST_BUYER_FREE_PASSWORD", "demo2026"),
}
BUYER_PRO = {
    "email": os.environ.get("TEST_BUYER_PRO_EMAIL", "iker.aguirre@familyoffice-norte.es"),
    "password": os.environ.get("TEST_BUYER_PRO_PASSWORD", "demo2026"),
}
BUYER_PROPLUS = {
    "email": os.environ.get("TEST_BUYER_PROPLUS_EMAIL", "marta.font@groupdigital.cat"),
    "password": os.environ.get("TEST_BUYER_PROPLUS_PASSWORD", "demo2026"),
}
ADMIN = {
    "email": os.environ.get("TEST_ADMIN_EMAIL", "admin@arroba.com"),
    "password": os.environ.get("TEST_ADMIN_PASSWORD", "admin2026"),
}
TEST_DEAL_ID = os.environ.get("TEST_DEAL_ID", "deal_hot_seo_01")
TEST_CIS_DEAL_ID = os.environ.get("TEST_CIS_DEAL_ID", "deal_cis_putos_modernos")
