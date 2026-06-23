from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from config import MONGO_URL, DB_NAME

client: AsyncIOMotorClient = AsyncIOMotorClient(MONGO_URL)
db: AsyncIOMotorDatabase = client[DB_NAME]

# Collections — typed for IDE support
users_collection: AsyncIOMotorCollection = db.users
companies_collection: AsyncIOMotorCollection = db.companies
deals_collection: AsyncIOMotorCollection = db.deals
mandates_collection: AsyncIOMotorCollection = db.mandates
subscriptions_collection: AsyncIOMotorCollection = db.subscriptions
lois_collection: AsyncIOMotorCollection = db.lois
ndas_collection: AsyncIOMotorCollection = db.ndas
matches_collection: AsyncIOMotorCollection = db.matches
notifications_collection: AsyncIOMotorCollection = db.notifications
events_collection: AsyncIOMotorCollection = db.events
user_sessions_collection: AsyncIOMotorCollection = db.user_sessions
payment_transactions_collection: AsyncIOMotorCollection = db.payment_transactions
infomemos_collection: AsyncIOMotorCollection = db.infomemos
cis_collection: AsyncIOMotorCollection = db.cis_financial_cache
teasers_collection: AsyncIOMotorCollection = db.teasers
engagements_collection: AsyncIOMotorCollection = db.engagements
saved_deals_collection: AsyncIOMotorCollection = db.saved_deals

async def init_db() -> None:
    """Initialize database indexes"""
    # Users indexes
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("user_id", unique=True)
    await users_collection.create_index("google_id", sparse=True)
    
    # Companies indexes
    await companies_collection.create_index("owner_id")
    await companies_collection.create_index("cif", sparse=True)
    
    # Deals indexes
    await deals_collection.create_index("company_id")
    await deals_collection.create_index("owner_id")
    await deals_collection.create_index("status")
    await deals_collection.create_index([("status", 1), ("created_at", -1)])
    
    # Matches indexes
    await matches_collection.create_index([("buyer_id", 1), ("deal_id", 1)], unique=True)
    
    # Sessions indexes
    await user_sessions_collection.create_index("session_token", unique=True)
    await user_sessions_collection.create_index("user_id")
    await user_sessions_collection.create_index("expires_at")
    
    # Notifications indexes
    await notifications_collection.create_index([("user_id", 1), ("read", 1)])
    
    # CIS financial cache
    await cis_collection.create_index("cif", unique=True)
    await cis_collection.create_index("last_updated")

    # Engagements
    await engagements_collection.create_index([("deal_id", 1), ("buyer_id", 1)])
    await engagements_collection.create_index("deal_id")
    await engagements_collection.create_index("buyer_id")

    # Saved deals
    await saved_deals_collection.create_index([("user_id", 1), ("deal_id", 1)], unique=True)

    # Payment transactions
    await payment_transactions_collection.create_index("session_id", unique=True)
    await payment_transactions_collection.create_index("user_id")

    # Valuation module
    await db.valuation_leads.create_index("lead_id", unique=True)
    await db.valuation_leads.create_index("user_id")
    await db.valuation_leads.create_index("email")
    await db.valuation_multiples.create_index([("scope_type", 1), ("scope_id", 1)])
    await db.valuation_runs.create_index("lead_id")

    # Financial visuals
    await db.financial_visuals.create_index("company_id", unique=True)

    # Seller company profiles
    await db.seller_company_profiles.create_index("profile_id", unique=True)
    await db.seller_company_profiles.create_index("seller_id")
    await db.seller_company_profiles.create_index("company_master_id")

    # NDA
    await db.nda_signatures.create_index("signature_id", unique=True)
    await db.nda_signatures.create_index([("deal_id", 1), ("buyer_user_id", 1)])
    await db.nda_signatures.create_index("buyer_user_id")
    await db.nda_events.create_index("signature_id")

    # Contact requests
    await db.contact_requests.create_index("request_id", unique=True)
    await db.contact_requests.create_index([("deal_id", 1), ("buyer_id", 1)])
    await db.contact_requests.create_index("seller_id")

    # Seller settings
    await db.seller_settings.create_index("seller_id", unique=True)

async def close_db() -> None:
    """Close database connection"""
    client.close()
