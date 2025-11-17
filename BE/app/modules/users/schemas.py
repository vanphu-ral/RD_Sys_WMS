"""
Pydantic schemas for users module
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema"""
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False


class UserCreate(UserBase):
    """User creation schema"""
    password: str


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = None
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