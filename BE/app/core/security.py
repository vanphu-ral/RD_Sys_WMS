"""
Security utilities for authentication and authorization
"""
import time
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt, jwk
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from cryptography.x509 import load_pem_x509_certificate

from app.core.config import settings
from app.core.database import get_db
from app.core.keycloak import get_keycloak_openid

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token scheme
security = HTTPBearer()

# JWKS cache for Keycloak token verification
_jwks_cache = None
_jwks_cache_time = 0
JWKS_CACHE_DURATION = 3600  # 1 hour

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def get_jwks() -> Dict:
    """Fetch and cache JWKS from Keycloak"""
    global _jwks_cache, _jwks_cache_time
    current_time = time.time()

    if _jwks_cache is None or (current_time - _jwks_cache_time) > JWKS_CACHE_DURATION:
        print("Fetching JWKS from Keycloak...")
        keycloak_openid = get_keycloak_openid()
        _jwks_cache = keycloak_openid.certs()
        print(f"JWKS fetched: {_jwks_cache}")
        _jwks_cache_time = current_time

    return _jwks_cache

def verify_keycloak_token(token: str) -> Optional[Dict]:
    """Verify Keycloak JWT token using JWKS"""
    try:
        print(f"Verifying token: {token[:50]}...")
        # Decode header để lấy kid
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        print(f"Token kid: {kid}")

        if not kid:
            print("No kid in header")
            return None

        # Decode payload manually to check claims
        try:
            import base64
            import json
            parts = token.split('.')
            if len(parts) != 3:
                print("Invalid JWT format")
                return None
            payload_b64 = parts[1]
            payload_bytes = base64.urlsafe_b64decode(payload_b64 + '==')
            payload_str = payload_bytes.decode('utf-8')
            print(f"Payload string: {payload_str}")
            unverified_payload = json.loads(payload_str)
            aud = unverified_payload.get('aud')
            iss = unverified_payload.get('iss')
            exp = unverified_payload.get('exp')
            print(f"Unverified payload - aud: {aud}, iss: {iss}, exp: {exp}")
        except Exception as e:
            print(f"Failed to decode payload manually: {e}")
            return None

        # Lấy JWKS
        jwks = get_jwks()
        print(f"JWKS keys count: {len(jwks.get('keys', []))}")
        key = None

        # Tìm key theo kid
        for jwk_key in jwks['keys']:
            if jwk_key['kid'] == kid:
                key = jwk_key
                break

        if not key:
            print(f"Key not found for kid: {kid}")
            return None

        # Construct the public key from JWK
        try:
            public_key = jwk.construct(key)
        except Exception as e:
            print(f"Failed to construct public key from JWK: {e}")
            return None

        # Verify token với public key
        expected_issuer = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}"
        payload = jwt.decode(
            token,
            public_key,
            algorithms=['RS256'],  # Keycloak thường dùng RS256
            audience='account',  # Audience is 'account' for public clients
            issuer=expected_issuer  # Verify issuer
        )
        print("Token verified successfully")

        return payload

    except JWTError as e:
        print(f"JWTError: {e}")
        return None
    except Exception as e:
        print(f"Other error in verify_keycloak_token: {e}")
        return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Verify token - support both internal JWT and Keycloak tokens"""
    # Thử verify Keycloak token trước
    keycloak_payload = verify_keycloak_token(token)
    if keycloak_payload:
        return keycloak_payload.get('preferred_username') or keycloak_payload.get('sub')

    # Fallback to internal JWT (nếu cần)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Dict:
    """Get current authenticated user from Keycloak token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = None
    if credentials:
        token = credentials.credentials
    else:
        # Check for token in cookies
        token = request.cookies.get("access_token")

    if not token:
        raise credentials_exception

    user_info = verify_keycloak_token(token)

    if user_info is None:
        raise credentials_exception

    # Return full user info from Keycloak
    return {
        "sub": user_info.get("sub"),
        "preferred_username": user_info.get("preferred_username"),
        "name": user_info.get("name"),
        "email": user_info.get("email"),
        "roles": user_info.get("realm_access", {}).get("roles", []),
        "groups": user_info.get("groups", [])
    }


async def authenticate_user(db: AsyncSession, username: str, password: str): # đang không sử dụng 

    if password:
        return username
    return False