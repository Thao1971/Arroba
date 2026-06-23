from fastapi import APIRouter, HTTPException, Request, Response, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
import httpx
import uuid

from database import users_collection, user_sessions_collection
from models.user import (
    UserCreate, UserInDB, UserResponse, UserLogin, TokenResponse,
    UpdateUserProfile, UpdateBuyerProfile, BuyerProfile, SellerProfile, AdvisorProfile
)
from utils.security import hash_password, verify_password, create_jwt_token, decode_jwt_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
SESSION_EXPIRY_DAYS = 7


# ─── Auth helpers (extracted for testability) ───

async def _resolve_jwt(token: str) -> Optional[UserResponse]:
    """Validate JWT and return user if valid."""
    try:
        payload = decode_jwt_token(token)
        user_id = payload.get("sub")
        user_doc = await users_collection.find_one({"user_id": user_id}, {"_id": 0})
        if user_doc:
            return UserResponse(**user_doc)
    except ValueError:
        pass
    return None


async def _resolve_session(session_token: str) -> UserResponse:
    """Validate session token and return user."""
    session_doc = await user_sessions_collection.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await users_collection.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")

    return UserResponse(**user_doc)


def _extract_token(request: Request) -> tuple:
    """Extract session_token and jwt_token from request."""
    session_token = request.cookies.get("session_token")
    jwt_token = None

    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            if token.startswith("sess_"):
                session_token = token
            else:
                jwt_token = token

    return session_token, jwt_token


async def _create_session(user_id: str, response: Response, emergent_token: str = None) -> str:
    """Create a new session and set cookie."""
    session_token = emergent_token or f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRY_DAYS)

    await user_sessions_collection.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/",
        max_age=SESSION_EXPIRY_DAYS * 24 * 60 * 60
    )
    return session_token


async def _fetch_google_user_data(session_id: str) -> dict:
    """Call Emergent Auth to get Google user data."""
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id})
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            return auth_response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Auth service error: {str(e)}")


async def _find_or_create_google_user(auth_data: dict) -> dict:
    """Find existing user by email or create new one from Google data."""
    email = auth_data.get("email")
    google_id = auth_data.get("id")
    name = auth_data.get("name", "")
    picture = auth_data.get("picture")

    user_doc = await users_collection.find_one({"email": email}, {"_id": 0})

    if user_doc:
        await users_collection.update_one(
            {"email": email},
            {"$set": {"google_id": google_id, "avatar_url": picture, "last_login": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return await users_collection.find_one({"email": email}, {"_id": 0})

    name_parts = name.split(" ", 1)
    new_user = UserInDB(
        email=email, google_id=google_id,
        first_name=name_parts[0] if name_parts else "",
        last_name=name_parts[1] if len(name_parts) > 1 else "",
        avatar_url=picture, role="buyer", email_verified=True
    )
    new_user.buyer_profile = BuyerProfile()

    user_dict = new_user.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    await users_collection.insert_one(user_dict)
    return await users_collection.find_one({"email": email}, {"_id": 0})


# ─── Main auth dependency ───

async def get_current_user(request: Request) -> UserResponse:
    """Get current user from JWT or session token."""
    session_token, jwt_token = _extract_token(request)

    if jwt_token:
        user = await _resolve_jwt(jwt_token)
        if user:
            return user

    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return await _resolve_session(session_token)


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, response: Response):
    """Register a new user with email/password"""
    # Check if email exists
    existing = await users_collection.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_in_db = UserInDB(
        email=user_data.email,
        password_hash=hash_password(user_data.password) if user_data.password else None,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        role=user_data.role
    )
    
    # Initialize profile based on role
    if user_data.role == "buyer":
        user_in_db.buyer_profile = BuyerProfile()
    elif user_data.role == "seller":
        user_in_db.seller_profile = SellerProfile()
    elif user_data.role == "advisor":
        user_in_db.advisor_profile = AdvisorProfile()
    
    user_dict = user_in_db.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    await users_collection.insert_one(user_dict)

    # Create session via helper
    await _create_session(user_in_db.user_id, response)

    access_token = create_jwt_token(user_in_db.user_id, user_in_db.email, user_in_db.role)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**user_in_db.model_dump())
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    user_doc = await users_collection.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Please use Google login for this account")
    
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    await users_collection.update_one(
        {"user_id": user_doc["user_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )

    await _create_session(user_doc["user_id"], response)
    access_token = create_jwt_token(user_doc["user_id"], user_doc["email"], user_doc["role"])

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(**user_doc)
    )


@router.post("/session")
async def process_google_session(request: Request, response: Response):
    """Process Google OAuth session from Emergent Auth"""
    body = await request.json()
    session_id = body.get("session_id")

    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    auth_data = await _fetch_google_user_data(session_id)
    user_doc = await _find_or_create_google_user(auth_data)

    # Clean old sessions
    await user_sessions_collection.delete_many({"user_id": user_doc["user_id"]})

    # Create new session
    emergent_token = auth_data.get("session_token")
    await _create_session(user_doc["user_id"], response, emergent_token)

    return UserResponse(**user_doc)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get current authenticated user"""
    return current_user


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await user_sessions_collection.delete_one({"session_token": session_token})
    
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return {"message": "Logged out successfully"}
