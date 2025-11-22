
import strawberry
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.types import Info

from app.modules.inventory.service import (
    AreaService,
    LocationService,
    InventoryService,
    WarehouseImportService,
    IWTRService,
    OSRService
)


@strawberry.type
class ActivityType:
    id: int
    type: str
    description: str
    timestamp: str
    user: str = None


@strawberry.type
class DashboardDataType:
    total_areas: int
    total_locations: int
    total_inventory_items: int
    active_import_requirements: int
    pending_iwtr: int
    pending_osr: int
    recent_activities: List[ActivityType]


@strawberry.type
class InventoryDashboardItem:
    id: int
    name: Optional[str]
    client_id: Optional[int]
    serial_pallet: Optional[str]
    identifier: str
    po: Optional[str]
    available_quantity: int
    initial_quantity: int
    location_id: int
    area_code: Optional[str]
    area_name: Optional[str]
    status: str
    updated_by: Optional[str]
    received_date: Optional[str]
    updated_date: Optional[str]


@strawberry.type
class InventoryDashboardGroupItem:
    group_key: str
    group_value: str
    total_available_quantity: int
    total_initial_quantity: int
    item_count: int 
    
    total_unique_products: int
    total_clients: int
    total_pos: int
    total_pallets: int
    total_containers: int
    total_locations: int
    
    last_updated: Optional[str]
    last_received: Optional[str]


@strawberry.type
class PaginationMeta:
    page: int
    size: int
    total_items: int
    total_pages: int


@strawberry.type
class InventoryDashboardResponse:
    data: List[InventoryDashboardItem]
    meta: PaginationMeta


@strawberry.type
class InventoryDashboardGroupResponse:
    data: List[InventoryDashboardGroupItem]
    meta: PaginationMeta


@strawberry.type
class DashboardQuery:

    @strawberry.field
    async def dashboard(self, info: Info) -> DashboardDataType:

        from app.core.database import get_db
        db = next(get_db())

        total_areas = len(AreaService.get_areas(db))
        total_locations = len(LocationService.get_locations(db))
        total_inventory_items = len(InventoryService.get_inventories(db))

        import_reqs = WarehouseImportService.get_import_requirements(db)
        active_import_requirements = len([req for req in import_reqs if req.get('status') == 'False'])

        iwtr_requests = IWTRService.get_iwtr_requests(db)
        pending_iwtr = len([req for req in iwtr_requests if req.get('status') != 'Hoàn thành'])

        osr_requests = OSRService.get_osr_requests(db)
        pending_osr = len([req for req in osr_requests if req.get('status') != 'Hoàn thành'])


        return DashboardDataType(
            total_areas=total_areas,
            total_locations=total_locations,
            total_inventory_items=total_inventory_items,
            active_import_requirements=active_import_requirements,
            pending_iwtr=pending_iwtr,
            pending_osr=pending_osr,
        )

    @strawberry.field
    async def inventoryDashboard(
        self,
        info: Info,
        page: int = 1,
        size: int = 20,
        name: Optional[str] = None,
        client_id: Optional[int] = None,
        serial_pallet: Optional[str] = None,
        identifier: Optional[str] = None,
        po: Optional[str] = None,
        location_id: Optional[int] = None,
        area_id: Optional[int] = None,
        status: Optional[str] = None,
        updated_by: Optional[str] = None
    ) -> InventoryDashboardResponse:
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            result = await InventoryService.get_inventory_dashboard(
                db=db,
                page=page,
                size=size,
                name=name,
                client_id=client_id,
                serial_pallet=serial_pallet,
                identifier=identifier,
                po=po,
                location_id=location_id,
                area_id=area_id,
                status=status,
                updated_by=updated_by
            )

        # Convert to Strawberry types
        data = [
            InventoryDashboardItem(
                id=item["id"],
                name=item["name"],
                client_id=item["client_id"],
                serial_pallet=item["serial_pallet"],
                identifier=item["identifier"],
                po=item["po"],
                available_quantity=item["available_quantity"],
                initial_quantity=item["initial_quantity"],
                location_id=item["location_id"],
                area_code=item["area_code"],
                area_name=item["area_name"],
                status=item["status"],
                updated_by=item["updated_by"],
                received_date=item["received_date"],
                updated_date=item["updated_date"]
            )
            for item in result["data"]
        ]

        meta = PaginationMeta(
            page=result["meta"]["page"],
            size=result["meta"]["size"],
            total_items=result["meta"]["total_items"],
            total_pages=result["meta"]["total_pages"]
        )

        return InventoryDashboardResponse(data=data, meta=meta)
    

    @strawberry.field
    async def inventoryDashboardGrouped(
        self,
        info: Info,
        group_by: str = None,
        page: int = 1,
        size: int = 20,
        name: Optional[str] = None,
        client_id: Optional[int] = None,
        serial_pallet: Optional[str] = None,
        identifier: Optional[str] = None,
        po: Optional[str] = None,
        location_id: Optional[int] = None,
        area_id: Optional[int] = None,
        status: Optional[str] = None,
        updated_by: Optional[str] = None
    ) -> InventoryDashboardGroupResponse:
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            result = await InventoryService.get_inventory_dashboard_grouped(
                db=db,
                group_by=group_by,
                page=page,
                size=size,
                name=name,
                client_id=client_id,
                serial_pallet=serial_pallet,
                identifier=identifier,
                po=po,
                location_id=location_id,
                area_id=area_id,
                status=status,
                updated_by=updated_by
            )

        # Convert to Strawberry types - Sử dụng các trường thống kê mới
        data = [
            InventoryDashboardGroupItem(
                group_key=group["group_key"],
                group_value=group["group_value"],
                total_available_quantity=group["total_available_quantity"],
                total_initial_quantity=group["total_initial_quantity"],
                item_count=group["item_count"],
                
                # Ánh xạ các trường thống kê mới từ service layer
                total_unique_products=group["total_unique_products"],
                total_clients=group["total_clients"],
                total_pos=group["total_pos"],
                total_pallets=group["total_pallets"],
                total_containers=group["total_containers"],
                total_locations=group["total_locations"],
                last_updated=group["last_updated"], # Giá trị ISO string hoặc None
                last_received=group["last_received"], # Giá trị ISO string hoặc None
                
                # Đã loại bỏ: area_codes, area_names, client_ids, part_numbers, pos (các trường array_agg cũ)
            )
            for group in result["data"]
        ]

        meta = PaginationMeta(
            page=result["meta"]["page"],
            size=result["meta"]["size"],
            total_items=result["meta"]["total_items"],
            total_pages=result["meta"]["total_pages"]
        )

        return InventoryDashboardGroupResponse(data=data, meta=meta)