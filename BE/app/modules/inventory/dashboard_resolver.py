"""
GraphQL resolvers for dashboard data
"""
import strawberry
from typing import List
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
class DashboardQuery:
    """GraphQL queries for dashboard"""

    @strawberry.field
    async def dashboard(self, info: Info) -> DashboardDataType:
        """Get dashboard data"""
        # Note: Using sync session for now, should be converted to async later
        from app.core.database import get_db
        db = next(get_db())

        # Get counts
        total_areas = len(AreaService.get_areas(db))
        total_locations = len(LocationService.get_locations(db))
        total_inventory_items = len(InventoryService.get_inventories(db))

        # Get active import requirements
        import_reqs = WarehouseImportService.get_import_requirements(db)
        active_import_requirements = len([req for req in import_reqs if req.status == 'Mới tạo'])

        # Get pending IWTR and OSR
        iwtr_requests = IWTRService.get_iwtr_requests(db)
        pending_iwtr = len([req for req in iwtr_requests if req.status != 'Hoàn thành'])

        osr_requests = OSRService.get_osr_requests(db)
        pending_osr = len([req for req in osr_requests if req.status != 'Hoàn thành'])

        # Mock recent activities (should be implemented with actual activity log)
        recent_activities = [
            ActivityType(
                id=1,
                type="IMPORT",
                description="New import requirement created",
                timestamp="2023-11-02T10:00:00Z",
                user="admin"
            ),
            ActivityType(
                id=2,
                type="TRANSFER",
                description="IWTR request processed",
                timestamp="2023-11-02T09:30:00Z",
                user="operator"
            )
        ]

        return DashboardDataType(
            total_areas=total_areas,
            total_locations=total_locations,
            total_inventory_items=total_inventory_items,
            active_import_requirements=active_import_requirements,
            pending_iwtr=pending_iwtr,
            pending_osr=pending_osr,
            recent_activities=recent_activities
        )