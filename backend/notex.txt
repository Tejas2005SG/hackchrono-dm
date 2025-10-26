from fastapi import Request, HTTPException, Response, status, Depends, Cookie
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from bson import ObjectId
from src.schemas.auth_schema import CreateUser, LoginUser, UserResponse
from src.models.auth_model import User
from src.config.db import client
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import warnings

# Comprehensive warning suppression for bcrypt issues
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", message=".*bcrypt.*")
warnings.filterwarnings("ignore", module="passlib")
warnings.filterwarnings("ignore", module="bcrypt")

# Fix bcrypt version detection issue by monkey-patching
try:
    import bcrypt
    if not hasattr(bcrypt, '__about__'):
        # Create a mock __about__ module for older bcrypt versions
        class MockAbout:
            __version__ = getattr(bcrypt, '__version__', '4.0.0')
        bcrypt.__about__ = MockAbout()
except ImportError:
    pass

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret-key-here-make-this-secure-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# Robust bcrypt context initialization with multiple fallback strategies
def create_password_context():
    """Create password context with fallback strategies for bcrypt issues."""
    strategies = [
        # Strategy 1: Full configuration
        lambda: CryptContext(
            schemes=["bcrypt"], 
            deprecated="auto",
            bcrypt__rounds=12,
            bcrypt__ident="2b"
        ),
        # Strategy 2: Basic configuration
        lambda: CryptContext(
            schemes=["bcrypt"], 
            deprecated="auto"
        ),
        # Strategy 3: Minimal configuration
        lambda: CryptContext(schemes=["bcrypt"]),
        # Strategy 4: Alternative with argon2 fallback
        lambda: CryptContext(
            schemes=["bcrypt", "pbkdf2_sha256"], 
            deprecated="auto"
        )
    ]
    
    for i, strategy in enumerate(strategies, 1):
        try:
            context = strategy()
            # Test the context
            test_hash = context.hash("test_password_123")
            if context.verify("test_password_123", test_hash):
                print(f"Password context initialized successfully (strategy {i})")
                return context
        except Exception as e:
            print(f"Strategy {i} failed: {e}")
            continue
    
    # If all strategies fail, raise an error
    raise RuntimeError("Failed to initialize password context with any strategy")

# Initialize password context
pwd_context = create_password_context()

# Database connection
db = client.get_database("test")
users_collection = db.get_collection("user")

# Utility Functions
def hash_password(password: str):
    try:
        return pwd_context.hash(password)
    except Exception as e:
        print(f"Password hashing error: {e}")
        raise HTTPException(status_code=500, detail="Password processing failed")

def verify_password(plain_password: str, hashed_password: str):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Generated JWT token: {encoded_jwt[:50]}...")
    return encoded_jwt

# Controllers
async def signup_controller(request: Request):
    try:
        payload = await request.json()
        user_data = CreateUser(**payload)

        print(f"Received signup data: {user_data.username}, {user_data.email}")

        # Validate password confirmation
        if user_data.password != user_data.confirm_password:
            print("Password mismatch detected")
            raise HTTPException(status_code=400, detail="Passwords do not match")

        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=409, detail="Email already registered")

        # Hash password
        hashed_pw = hash_password(user_data.password)
        print("Password hashed successfully")

        # Create new user document
        new_user = {
            "username": user_data.username,
            "email": user_data.email,
            "password": hashed_pw,
            "created_at": datetime.now(timezone.utc)
        }

        # Insert user into database
        result = await users_collection.insert_one(new_user)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create user")

        print(f"User created with ID: {result.inserted_id}")

        # Prepare response (exclude password)
        user_response = {
            "id": str(result.inserted_id),
            "username": new_user["username"],
            "email": new_user["email"],
            "created_at": new_user["created_at"]
        }

        return {"msg": "User created successfully", "user": user_response}

    except Exception as e:
        print(f"Signup error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Internal server error during signup")

async def login_controller(request: Request, response: Response):
    try:
        payload = await request.json()
        login_data = LoginUser(**payload)

        print(f"Login attempt for email: {login_data.email}")

        # Find user by email
        user = await users_collection.find_one({"email": login_data.email})
        if not user:
            print(f"User not found: {login_data.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        print(f"User found: {user['username']}")

        # Verify password
        if not verify_password(login_data.password, user["password"]):
            print("Password verification failed")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        print("Password verified successfully")

        # Create access token
        token_data = {"sub": str(user["_id"]), "email": user["email"]}
        access_token = create_access_token(
            data=token_data, 
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        print(f"Access token created: {access_token[:50]}...")

        # FIXED: Improved cookie setting with better configuration
        cookie_max_age = ACCESS_TOKEN_EXPIRE_MINUTES * 60
        print(f"Setting cookie with max_age: {cookie_max_age} seconds")
        
        # Set the cookie with explicit configuration
        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=cookie_max_age,
            expires=cookie_max_age,  # Also set expires for better compatibility
            path="/",
            domain=None,  # Let browser determine domain
            secure=False,  # Set to True in production with HTTPS
            httponly=True,  # Important for security
            samesite="lax"  # Allow cross-site requests for same-site navigation
        )

        print("Cookie set successfully")

        # Also include token in response body for debugging
        return {
            "msg": "Login successful", 
            "user_id": str(user["_id"]),
            "access_token": access_token,  # You can remove this in production
            "token_expires_in": f"{ACCESS_TOKEN_EXPIRE_MINUTES} minutes",
            "cookie_set": True
        }

    except Exception as e:
        print(f"Login error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Internal server error during login")

async def logout_controller(response: Response):
    try:
        print("Logout requested")
        
        # Clear the cookie by setting it with past expiration
        response.set_cookie(
            key="access_token",
            value="",
            max_age=0,
            expires=0,
            path="/",
            domain=None,
            secure=False,
            httponly=True,
            samesite="lax"
        )
        
        print("Cookie cleared successfully")
        return {"msg": "Logged out successfully"}
    except Exception as e:
        print(f"Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during logout")

async def profile_controller(request: Request):
    try:
        print("Profile request received")
        print(f"Request headers: {dict(request.headers)}")
        print(f"Request cookies: {dict(request.cookies)}")
        print(f"Available cookie keys: {list(request.cookies.keys())}")
        
        # FIXED: Better token extraction logic
        token = None
        
        # First try to get from cookies
        if "access_token" in request.cookies:
            token = request.cookies.get("access_token")
            print(f"Token found in cookies: {token[:50] if token else 'None'}...")
        
        # Fallback to Authorization header
        if not token:
            auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
            if auth_header:
                if auth_header.startswith("Bearer "):
                    token = auth_header.split(" ")[1]
                    print("Using token from Authorization header")
                elif auth_header.startswith("bearer "):  # Handle lowercase
                    token = auth_header.split(" ")[1]
                    print("Using token from authorization header (lowercase)")
        
        if not token:
            print("No access token found in cookies or headers")
            raise HTTPException(
                status_code=401, 
                detail="Not authenticated - no token found",
                headers={"WWW-Authenticate": "Bearer"}
            )

        print(f"Token found: {token[:50]}...")

        # Decode and verify token
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            if not user_id:
                print("No user ID in token")
                raise HTTPException(status_code=401, detail="Token invalid - no user ID")
        except jwt.ExpiredSignatureError:
            print("Token has expired")
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.JWTError as jwt_err:
            print(f"JWT decode error: {jwt_err}")
            raise HTTPException(status_code=401, detail="Token invalid")

        print(f"User ID from token: {user_id}")

        # Find user in database
        try:
            user = await users_collection.find_one({"_id": ObjectId(user_id)})
        except Exception as db_err:
            print(f"Database error: {db_err}")
            raise HTTPException(status_code=500, detail="Database error")
            
        if not user:
            print("User not found in database")
            raise HTTPException(status_code=404, detail="User not found")

        print(f"User profile retrieved: {user['username']}")

        # Return user profile
        return UserResponse(
            id=str(user["_id"]),
            username=user["username"],
            email=user["email"],
            created_at=user["created_at"]
        )

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"Profile error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ADDED: Dependency function for easier token validation in routes
async def get_current_user(request: Request):
    """
    Dependency function to get current user from JWT token.
    Can be used with FastAPI's Depends() in route definitions.
    """
    token = None
    
    # Try to get token from cookies first
    if "access_token" in request.cookies:
        token = request.cookies.get("access_token")
    
    # Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalid")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token invalid")
    
    # Get user from database
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user