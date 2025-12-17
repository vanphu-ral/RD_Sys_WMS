
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import WarehouseImportService
from app.modules.inventory.external_apps_schemas import UpdateImportStatusRequest
from app.modules.inventory.schemas import UpdateContainerInventoryRequest, BulkUpdateContainerInventoryRequest

router = APIRouter()
logger = logging.getLogger(__name__)

@router.patch("/requirements/{requirement_id}/confirm-location")
async def confirm_import_requirement_location(
    requirement_id: int,
    location_id: int,
    db: AsyncSession = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):
    return await WarehouseImportService.confirm_import_requirement_location(db, requirement_id, location_id)


@router.patch("/requirements/{requirement_id}/status")
async def update_import_requirement_status(
    requirement_id: int,
    status: bool,
    db: AsyncSession = Depends(get_db),
    # #current_user: str = Depends(get_current_user)
):
    return await WarehouseImportService.update_import_requirement_status(db, requirement_id, status)


@router.post("/scan-inventories")
async def scan_inventories(
    scan_data: List[dict],
    db: AsyncSession = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):
    return WarehouseImportService.scan_inventories(db, scan_data)


@router.get("/scan-pallets/{warehouse_import_requirement_id}/{serial_pallet}")
async def get_inventory_by_identifier(
    serial_pallet: str,
    warehouse_import_requirement_id: int,
    db: AsyncSession = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):
    try:
        result = await WarehouseImportService.scan_pallets(db, warehouse_import_requirement_id,serial_pallet)
        return result
    except Exception as e:
        logger.error(f"Lỗi lấy thông tin chi tiết của {serial_pallet} trong {warehouse_import_requirement_id}: {str(e)}", exc_info=True)
        raise



@router.patch("/import_wh_status")
async def update_import_wh_status(
    requirement_id: int,
    request: UpdateImportStatusRequest,
    db: AsyncSession = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):
    return await WarehouseImportService.update_import_requirement_status(db, requirement_id, request.status)

# cập nhật trạng thái của mã vật tư đã scan trong bảng container inventory
@router.patch("/container-inventories")
async def update_container_inventory(
    request: BulkUpdateContainerInventoryRequest,
    db: AsyncSession = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):

    updates = [
        {
            "import_container_id": update.import_container_id,
            "inventory_identifier": update.inventory_identifier,
            "quantity_imported": update.quantity_imported,
            "confirmed": update.confirmed,
            "location_id": update.location_id
        }
        for update in request.updates
    ]
    return await WarehouseImportService.update_container_inventory_by_identifier(
        db,
        updates
    )

