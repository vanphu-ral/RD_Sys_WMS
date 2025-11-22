
import strawberry
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.types import Info

from app.modules.inventory.schemas import (
    InventoryItem,
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryResponse
)
from app.modules.inventory.service import InventoryService
from app.modules.inventory.dashboard_resolver import InventoryDashboardResponse, FullInventoryResponse, FullInventoryItem


@strawberry.experimental.pydantic.type(model=InventoryItem, all_fields=True)
class InventoryItemType:
    pass

@strawberry.experimental.pydantic.type(model=InventoryResponse, all_fields=True)
class InventoryType:
    pass

@strawberry.experimental.pydantic.input(model=InventoryItemCreate, all_fields=True)
class InventoryItemCreateInput:
    pass

@strawberry.experimental.pydantic.input(model=InventoryItemUpdate, all_fields=True)
class InventoryItemUpdateInput:
    pass


@strawberry.type
class InventoryQuery:

    @strawberry.field
    async def inventory_items(self, info: Info) -> List[InventoryItemType]:
        """Get all inventory items"""
        from app.core.database import AsyncSessionLocal
        from app.modules.inventory.schemas import InventoryItem as InventoryItemSchema
        async with AsyncSessionLocal() as db:
            items = await InventoryService.get_inventories(db)
            return [InventoryItemSchema.from_orm(item) for item in items]

    @strawberry.field
    async def inventory_item(self, info: Info, id: int) -> InventoryItemType:
        """Get inventory item by ID"""
        from app.core.database import AsyncSessionLocal
        from app.modules.inventory.schemas import InventoryItem as InventoryItemSchema
        async with AsyncSessionLocal() as db:
            item = await InventoryService.get_inventory_item_by_id(db, id)
            return InventoryItemSchema.from_orm(item)

    @strawberry.field
    async def allInventories(
        self,
        info: Info,
        page: int = 1,
        size: int = 20,
        name: Optional[str] = None,
        identifier: Optional[str] = None,
        sap_code: Optional[str] = None,
        po: Optional[str] = None,
        lot: Optional[str] = None,
        vendor: Optional[str] = None,
        location_id: Optional[int] = None,
    ) -> FullInventoryResponse:
        from app.core.database import AsyncSessionLocal
        from app.modules.inventory.dashboard_resolver import PaginationMeta

        async with AsyncSessionLocal() as db:
            result = await InventoryService.get_inventories_paginated(
                db=db,
                page=page,
                size=size,
                name=name,
                identifier=identifier,
                sap_code=sap_code,
                po=po,
                lot=lot,
                vendor=vendor,
                location_id=location_id
            )

            data = []
            for item in result["data"]:
                data.append(FullInventoryItem(
                    id=item["id"],
                    identifier=item["identifier"],
                    serial_pallet=item["serial_pallet"],
                    location_id=item["location_id"],
                    parent_location_id=item["parent_location_id"],
                    last_location_id=item["last_location_id"],
                    parent_inventory_id=item["parent_inventory_id"],
                    expiration_date=item["expiration_date"],
                    received_date=item["received_date"],
                    updated_date=item["updated_date"],
                    updated_by=item["updated_by"],
                    calculated_status=item["calculated_status"],
                    manufacturing_date=item["manufacturing_date"],
                    initial_quantity=item["initial_quantity"],
                    available_quantity=item["available_quantity"],
                    quantity=item["quantity"],
                    name=item["name"],
                    sap_code=item["sap_code"],
                    po=item["po"],
                    lot=item["lot"],
                    vendor=item["vendor"],
                    msd_level=item["msd_level"],
                    comments=item["comments"]
                ))

            meta = PaginationMeta(
                page=result["meta"]["page"],
                size=result["meta"]["size"],
                total_items=result["meta"]["total_items"],
                total_pages=result["meta"]["total_pages"]
            )

            return FullInventoryResponse(data=data, meta=meta)

    @strawberry.field
    async def inventory(self, info: Info, id: int) -> InventoryType:
        """Get inventory by ID with full details"""
        from app.core.database import AsyncSessionLocal
        from app.modules.inventory.schemas import InventoryResponse as InventorySchema
        async with AsyncSessionLocal() as db:
            inv = await InventoryService.get_inventory_by_id(db, id)
            return InventorySchema.from_orm(inv)


@strawberry.type
class InventoryMutation:
    """GraphQL mutations for inventory"""

    @strawberry.mutation
    async def create_inventory_item(self, info: Info, input: InventoryItemCreateInput) -> InventoryItemType:
        """Create new inventory item"""
        from app.core.database import AsyncSessionLocal
        from app.modules.inventory.schemas import InventoryItem as InventoryItemSchema
        async with AsyncSessionLocal() as db:
            item = await InventoryService.create_inventory_item(db, input)
            return InventoryItemSchema.from_orm(item)

    @strawberry.mutation
    async def update_inventory_item(self, info: Info, id: int, input: InventoryItemUpdateInput) -> InventoryItemType:
        """Update existing inventory item"""
        from app.core.database import AsyncSessionLocal
        from app.modules.inventory.schemas import InventoryItem as InventoryItemSchema
        async with AsyncSessionLocal() as db:
            item = await InventoryService.update_inventory_item(db, id, input)
            return InventoryItemSchema.from_orm(item)

    @strawberry.mutation
    async def delete_inventory_item(self, info: Info, id: int) -> bool:
        """Delete inventory item"""
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            return await InventoryService.delete_inventory_item(db, id)