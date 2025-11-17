"""
REST API endpoints for authentication
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import RedirectResponse, JSONResponse
from typing import Optional

from app.core.database import get_db
from app.core.security import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password
)
from app.core.config import settings
from app.core.keycloak import (
    get_authorization_url,
    exchange_code_for_token,
    refresh_token as keycloak_refresh_token,
    get_user_info,
    logout_user as keycloak_logout_user
)

router = APIRouter()

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login endpoint to get access token"""
    # Here you would implement user authentication logic
    # For now, return a mock token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register")
async def register(user_data: dict, db: AsyncSession = Depends(get_db)):
    """Register new user"""
    # Here you would implement user registration logic
    return {"message": "User registered successfully"}

@router.get("/me")
async def read_users_me(current_user: str = Depends(get_current_user)):
    """Get current user information"""
    return {"username": current_user}

# Keycloak OIDC endpoints
@router.get("/keycloak/login")
async def keycloak_login():
    """Redirect to Keycloak login"""
    try:
        auth_url = get_authorization_url()
        return RedirectResponse(url=auth_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Keycloak connection failed: {str(e)}")

@router.get("/keycloak/callback")
async def keycloak_callback(
    response: Response,
    code: str = Query(...),
    state: str = Query(...)
):
    """Handle Keycloak callback and store tokens in HTTP-only cookies"""
    try:
        print(f"Received callback with code: {code[:20]}...")
        print(f"Attempting token exchange with client_id: {settings.KEYCLOAK_CLIENT_ID}")
        print(f"Redirect URI: {settings.KEYCLOAK_REDIRECT_URI}")
        
        token_response = exchange_code_for_token(code)
        
        print(f"Token exchange successful!")
        
        # Store tokens in HTTP-only cookies for security
        response.set_cookie(
            key="access_token",
            value=token_response["access_token"],
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=token_response.get("expires_in", 300)
        )
        
        if token_response.get("refresh_token"):
            response.set_cookie(
                key="refresh_token",
                value=token_response["refresh_token"],
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite="lax",
                max_age=token_response.get("refresh_expires_in", 1800)
            )
        
        # Redirect to frontend callback
        return RedirectResponse(url=f"http://localhost:4200/auth/callback?code={code}&state={state}")
    except Exception as e:
        print(f"Token exchange error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {str(e)}")

@router.post("/keycloak/refresh")
async def refresh_access_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None)
):
    """Refresh access token using refresh token from cookie"""
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token found")
    
    try:
        token_response = keycloak_refresh_token(refresh_token)
        
        # Update access token cookie
        response.set_cookie(
            key="access_token",
            value=token_response["access_token"],
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=token_response.get("expires_in", 300)
        )
        
        if token_response.get("refresh_token"):
            response.set_cookie(
                key="refresh_token",
                value=token_response["refresh_token"],
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite="lax",
                max_age=token_response.get("refresh_expires_in", 1800)
            )
        
        return {"access_token": token_response["access_token"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Token refresh failed: {str(e)}")

@router.get("/keycloak/userinfo")
async def get_keycloak_userinfo(
    access_token: Optional[str] = Cookie(None),
    token_param: Optional[str] = Query(None, alias="access_token")
):
    """Get user information from Keycloak using token from cookie or query param"""
    # Try to get token from cookie first, then from query parameter
    token = access_token or token_param
    
    if not token:
        raise HTTPException(status_code=401, detail="No access token found")
    
    try:
        user_info = get_user_info(token)
        # Add authorities from realm roles
        user_info["authorities"] = user_info.get("realm_access", {}).get("roles", [])
        return user_info
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Failed to get user info: {str(e)}")

@router.post("/keycloak/logout")
async def keycloak_logout_endpoint(
    response: Response,
    refresh_token: Optional[str] = Cookie(None)
):
    """Logout from Keycloak and clear cookies"""
    try:
        if refresh_token:
            keycloak_logout_user(refresh_token)
        
        # Clear authentication cookies
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")
        
        # Return logout URL for frontend redirect
        logout_url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/logout?redirect_uri=http://localhost:4200"
        
        return {"message": "Logged out successfully", "logoutUrl": logout_url}
    except Exception as e:
        # Still clear cookies even if Keycloak logout fails
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")
        raise HTTPException(status_code=400, detail=f"Logout failed: {str(e)}")

@router.get("/token")
async def get_token(access_token: Optional[str] = Cookie(None)):
    """Get access token from cookie"""
    if not access_token:
        raise HTTPException(status_code=401, detail="No access token found")
    return {"access_token": access_token}