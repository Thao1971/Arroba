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

# Helper to get current user from session
async def get_current_user(request: Request) -> UserResponse:
    """Get current user from session token (cookie or header)"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check session in database
    session_doc = await user_sessions_collection.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await users_collection.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return UserResponse(**user_doc)


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
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRY_DAYS)
    
    await user_sessions_collection.insert_one({
        "session_token": session_token,
        "user_id": user_in_db.user_id,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=SESSION_EXPIRY_DAYS * 24 * 60 * 60
    )
    
    # Create JWT token as well
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
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRY_DAYS)
    
    await user_sessions_collection.insert_one({
        "session_token": session_token,
        "user_id": user_doc["user_id"],
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=SESSION_EXPIRY_DAYS * 24 * 60 * 60
    )
    
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
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            auth_data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Auth service error: {str(e)}")
    
    google_id = auth_data.get("id")
    email = auth_data.get("email")
    name = auth_data.get("name", "")
    picture = auth_data.get("picture")
    emergent_session_token = auth_data.get("session_token")
    
    # Check if user exists
    user_doc = await users_collection.find_one({"email": email}, {"_id": 0})
    
    if user_doc:
        # Update existing user
        await users_collection.update_one(
            {"email": email},
            {"$set": {
                "google_id": google_id,
                "avatar_url": picture,
                "last_login": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        user_doc = await users_collection.find_one({"email": email}, {"_id": 0})
    else:
        # Create new user
        name_parts = name.split(" ", 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        new_user = UserInDB(
            email=email,
            google_id=google_id,
            first_name=first_name,
            last_name=last_name,
            avatar_url=picture,
            role="buyer",  # Default role for Google sign-up
            email_verified=True
        )
        new_user.buyer_profile = BuyerProfile()
        
        user_dict = new_user.model_dump()
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        user_dict["updated_at"] = user_dict["updated_at"].isoformat()
        
        await users_collection.insert_one(user_dict)
        user_doc = await users_collection.find_one({"email": email}, {"_id": 0})
    
    # Create session with emergent token or generate new one
    session_token = emergent_session_token or f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRY_DAYS)
    
    # Remove old sessions for this user
    await user_sessions_collection.delete_many({"user_id": user_doc["user_id"]})
    
    await user_sessions_collection.insert_one({
        "session_token": session_token,
        "user_id": user_doc["user_id"],
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=SESSION_EXPIRY_DAYS * 24 * 60 * 60
    )
    
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
