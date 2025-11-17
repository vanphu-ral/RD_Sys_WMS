"""
GraphQL resolvers for inventory module
"""
import strawberry
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.types import Info

from app.modules.inventory.schemas import (
    InventoryItem,
    InventoryItemCreate,
    InventoryItemUpdate
)
from app.modules.inventory.service import InventoryService
from app.core.database import get_db


# Strawberry types for GraphQL
@strawberry.experimental.pydantic.type(model=InventoryItem, all_fields=True)
class InventoryItemType:
    pass

@strawberry.experimental.pydantic.input(model=InventoryItemCreate, all_fields=True)
class InventoryItemCreateInput:
    pass

@strawberry.experimental.pydantic.input(model=InventoryItemUpdate, all_fields=True)
class InventoryItemUpdateInput:
    pass


@strawberry.type
class InventoryQuery:
    """GraphQL queries for inventory"""

    @strawberry.field
    async def inventory_items(self, info: Info) -> List[InventoryItemType]:
        """Get all inventory items"""
        db = next(get_db())
        return await InventoryService.get_inventory_items(db)

    @strawberry.field
    async def inventory_item(self, info: Info, id: int) -> InventoryItemType:
        """Get inventory item by ID"""
        db = next(get_db())
        return await InventoryService.get_inventory_item_by_id(db, id)


@strawberry.type
class InventoryMutation:
    """GraphQL mutations for inventory"""

    @strawberry.mutation
    async def create_inventory_item(self, info: Info, input: InventoryItemCreateInput) -> InventoryItemType:
        """Create new inventory item"""
        db = next(get_db())
        return await InventoryService.create_inventory_item(db, input)

    @strawberry.mutation
    async def update_inventory_item(self, info: Info, id: int, input: InventoryItemUpdateInput) -> InventoryItemType:
        """Update existing inventory item"""
        db = next(get_db())
        return await InventoryService.update_inventory_item(db, id, input)

    @strawberry.mutation
    async def delete_inventory_item(self, info: Info, id: int) -> bool:
        """Delete inventory item"""
        db = next(get_db())
        return await InventoryService.delete_inventory_item(db, id)