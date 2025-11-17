"""
GraphQL resolvers for users module
"""
import strawberry
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.types import Info

from app.modules.users.schemas import User, UserCreate, UserUpdate
from app.modules.users.service import UserService
from app.core.database import get_db


@strawberry.type
class UserQuery:
    """GraphQL queries for users"""

    @strawberry.field
    async def users(self, info: Info) -> List[User]:
        """Get all users"""
        db = next(get_db())
        return await UserService.get_users(db)

    @strawberry.field
    async def user(self, info: Info, id: int) -> User:
        """Get user by ID"""
        db = next(get_db())
        return await UserService.get_user_by_id(db, id)

    @strawberry.field
    async def user_by_username(self, info: Info, username: str) -> User:
        """Get user by username"""
        db = next(get_db())
        user = await UserService.get_user_by_username(db, username)
        if not user:
            raise ValueError(f"User with username {username} not found")
        return user


@strawberry.type
class UserMutation:
    """GraphQL mutations for users"""

    @strawberry.mutation
    async def create_user(self, info: Info, input: UserCreate) -> User:
        """Create new user"""
        db = next(get_db())
        return await UserService.create_user(db, input)

    @strawberry.mutation
    async def update_user(self, info: Info, id: int, input: UserUpdate) -> User:
        """Update existing user"""
        db = next(get_db())
        return await UserService.update_user(db, id, input)

    @strawberry.mutation
    async def delete_user(self, info: Info, id: int) -> bool:
        """Delete user"""
        db = next(get_db())
        return await UserService.delete_user(db, id)