"""
Business logic for users module
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserUpdate
from app.core.exceptions import NotFoundException
from app.core.security import get_password_hash, verify_password


class UserService:
    """Service class for user operations"""

    @staticmethod
    async def get_users(db: AsyncSession) -> List[User]:
        """Get all users"""
        result = await db.execute(select(User))
        return result.scalars().all()

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: int) -> User:
        """Get user by ID"""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundException("User", str(user_id))
        return user

    @staticmethod
    async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
        """Get user by username"""
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        """Create new user"""
        # Check if username or email already exists
        existing_user = await UserService.get_user_by_username(db, user_data.username)
        if existing_user:
            raise ValueError("Username already exists")

        existing_email = await UserService.get_user_by_email(db, user_data.email)
        if existing_email:
            raise ValueError("Email already exists")

        # Hash password
        hashed_password = get_password_hash(user_data.password)

        # Create user
        user_dict = user_data.dict()
        user_dict.pop("password")  # Remove plain password
        user_dict["hashed_password"] = hashed_password

        user = User(**user_dict)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: int,
        user_data: UserUpdate
    ) -> User:
        """Update existing user"""
        user = await UserService.get_user_by_id(db, user_id)
        update_data = user_data.dict(exclude_unset=True, exclude={"password"})

        # Handle password update
        if user_data.password:
            update_data["hashed_password"] = get_password_hash(user_data.password)

        for field, value in update_data.items():
            setattr(user, field, value)

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def delete_user(db: AsyncSession, user_id: int) -> bool:
        """Delete user"""
        user = await UserService.get_user_by_id(db, user_id)
        await db.delete(user)
        await db.commit()
        return True

    @staticmethod
    async def authenticate_user(db: AsyncSession, username: str, password: str) -> Optional[User]: # đang không sử dụng

        user = await UserService.get_user_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user