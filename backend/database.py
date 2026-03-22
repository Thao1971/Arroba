from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URL, DB_NAME

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db.users
companies_collection = db.companies
deals_collection = db.deals
mandates_collection = db.mandates
subscriptions_collection = db.subscriptions
lois_collection = db.lois
ndas_collection = db.ndas
matches_collection = db.matches
notifications_collection = db.notifications
events_collection = db.events
user_sessions_collection = db.user_sessions
payment_transactions_collection = db.payment_transactions
infomemos_collection = db.infomemos
cis_collection = db.cis_financial_cache
teasers_collection = db.teasers
engagements_collection = db.engagements
saved_deals_collection = db.saved_deals

async def init_db():
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

async def close_db():
    """Close database connection"""
    client.close()
