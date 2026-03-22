import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

# Auth
JWT_SECRET = os.environ.get('JWT_SECRET', 'arroba-jwt-secret-key-2026')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# OpenAI / Emergent LLM
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Iberinform
IBERINFORM_CLIENT_ID = os.environ.get('IBERINFORM_CLIENT_ID')
IBERINFORM_CLIENT_SECRET = os.environ.get('IBERINFORM_CLIENT_SECRET')
IBERINFORM_BASE_URL = os.environ.get('IBERINFORM_BASE_URL', 'https://apipre.iberinform.es')

# Subscription Plans
SUBSCRIPTION_PLANS = {
    "buyer_monthly": {
        "name": "Buyer Mensual",
        "price": 99.00,
        "currency": "eur",
        "description": "Acceso completo para compradores"
    },
    "seller_active": {
        "name": "Seller Activación",
        "price": 999.00,
        "currency": "eur",
        "description": "Publicación de deal en marketplace"
    },
    "advisor_monthly": {
        "name": "Advisor Mensual",
        "price": 199.00,
        "currency": "eur",
        "description": "Gestión multi-mandato para advisors"
    }
}

# CORS
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
