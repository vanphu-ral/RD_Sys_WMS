"""
CRUD operations for users module (REST API)
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.users.schemas import User, UserCreate, UserUpdate
from app.modules.users.service import UserService

router = APIRouter()

# User CRUD endpoints
@router.get("/users", response_model=List[User])
async def get_users(db: AsyncSession = Depends(get_db)):
    """Get all users"""
    return await UserService.get_users(db)

@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Get user by ID"""
    return await UserService.get_user_by_id(db, user_id)

@router.post("/users", response_model=User)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create new user"""
    try:
        return await UserService.create_user(db, user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update existing user"""
    return await UserService.update_user(db, user_id, user_update)

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Delete user"""
    await UserService.delete_user(db, user_id)
    return {"message": "User deleted successfully"}