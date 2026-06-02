"""
Pydantic schemas for users module
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserBase(BaseModel):
    """Base user schema"""
    username: str
    email: Optional[str] = None
    branch: Optional[str] = None
    preferred_username: Optional[str] = None

class UserCreate(UserBase):
    """User creation schema"""
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    password: Optional[str] = None


class User(UserBase):
    """User response schema"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token data schema"""
    username: Optional[str] = None


class UserCurrent(BaseModel):
    """Current authenticated user from Keycloak (dùng cho tenant_id)"""
    sub: Optional[str] = None
    preferred_username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    roles: list = []
    groups: list = []
    branch: Optional[str] = None

    class Config:
        from_attributes = True