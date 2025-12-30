
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import WarehouseImportService
from app.modules.inventory.external_apps_schemas import UpdateImportStatusRequest
from app.modules.inventory.schemas import BulkUpdateContainerInventoryByIdRequest, BulkUpdateImportPalletInfoRequest, BulkSimpleContainerInventoryUpdate

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

# cập nhật tất cả các trường của container inventory thông qua ID
@router.patch("/container-inventories")
async def update_container_inventory(
    request: BulkUpdateContainerInventoryByIdRequest,
    db: AsyncSession = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):

    updates = []
    for update in request.updates:
        update_dict = {"id": update.id}
        if update.import_pallet_id is not None:
            update_dict["import_pallet_id"] = update.import_pallet_id
        if update.manufacturing_date is not None:
            update_dict["manufacturing_date"] = update.manufacturing_date
        if update.expiration_date is not None:
            update_dict["expiration_date"] = update.expiration_date
        if update.sap_code is not None:
            update_dict["sap_code"] = update.sap_code
        if update.po is not None:
            update_dict["po"] = update.po
        if update.lot is not None:
            update_dict["lot"] = update.lot
        if update.vendor is not None:
            update_dict["vendor"] = update.vendor
        if update.msd_level is not None:
            update_dict["msd_level"] = update.msd_level
        if update.comments is not None:
            update_dict["comments"] = update.comments
        if update.name is not None:
            update_dict["name"] = update.name
        if update.import_container_id is not None:
            update_dict["import_container_id"] = update.import_container_id
        if update.inventory_identifier is not None:
            update_dict["inventory_identifier"] = update.inventory_identifier
        if update.location_id is not None:
            update_dict["location_id"] = update.location_id
        if update.serial_pallet is not None:
            update_dict["serial_pallet"] = update.serial_pallet
        if update.quantity_imported is not None:
            update_dict["quantity_imported"] = update.quantity_imported
        if update.scan_by is not None:
            update_dict["scan_by"] = update.scan_by
        if update.confirmed is not None:
            update_dict["confirmed"] = update.confirmed
        if update.list_serial_items is not None:
            update_dict["list_serial_items"] = update.list_serial_items
        updates.append(update_dict)
    
    return await WarehouseImportService.update_container_inventory_by_id(
        db,
        updates
    )

# cập nhật trạng thái confirmed của container inventory thông qua ID (đơn giản hóa)
@router.patch("/container-inventories-simple")
async def update_container_inventory_simple(
    request: BulkSimpleContainerInventoryUpdate,
    db: AsyncSession = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):
    updates = []
    for update in request.updates:
        update_dict = {
            "id": update.id,
            "confirmed": update.confirmed
        }
        updates.append(update_dict)
    
    return await WarehouseImportService.update_container_inventory_simple(
        db,
        updates
    )

# cập nhật tất cả các trường của container inventory thông qua ID
@router.patch("/container-inventories-by-id")
async def update_container_inventory_by_id(
    request: BulkUpdateContainerInventoryByIdRequest,
    db: AsyncSession = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):

    updates = []
    for update in request.updates:
        update_dict = {"id": update.id}
        if update.manufacturing_date is not None:
            update_dict["manufacturing_date"] = update.manufacturing_date
        if update.expiration_date is not None:
            update_dict["expiration_date"] = update.expiration_date
        if update.sap_code is not None:
            update_dict["sap_code"] = update.sap_code
        if update.po is not None:
            update_dict["po"] = update.po
        if update.lot is not None:
            update_dict["lot"] = update.lot
        if update.vendor is not None:
            update_dict["vendor"] = update.vendor
        if update.msd_level is not None:
            update_dict["msd_level"] = update.msd_level
        if update.comments is not None:
            update_dict["comments"] = update.comments
        if update.name is not None:
            update_dict["name"] = update.name
        if update.location_id is not None:
            update_dict["location_id"] = update.location_id
        if update.serial_pallet is not None:
            update_dict["serial_pallet"] = update.serial_pallet
        if update.quantity_imported is not None:
            update_dict["quantity_imported"] = update.quantity_imported
        if update.scan_by is not None:
            update_dict["scan_by"] = update.scan_by
        if update.confirmed is not None:
            update_dict["confirmed"] = update.confirmed
        updates.append(update_dict)
    
    return await WarehouseImportService.update_container_inventory_by_id(
        db,
        updates
    )

# cập nhật thông tin của pallet trong bảng import_pallet_info
@router.patch("/import-pallet-info")
async def update_import_pallet_info(
    request: BulkUpdateImportPalletInfoRequest,
    db: AsyncSession = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):
    updates = []
    for update in request.updates:
        update_dict = {"id": update.id}
        if update.serial_pallet is not None:
            update_dict["serial_pallet"] = update.serial_pallet
        if update.quantity_per_box is not None:
            update_dict["quantity_per_box"] = update.quantity_per_box
        if update.num_box_per_pallet is not None:
            update_dict["num_box_per_pallet"] = update.num_box_per_pallet
        if update.total_quantity is not None:
            update_dict["total_quantity"] = update.total_quantity
        if update.po_number is not None:
            update_dict["po_number"] = update.po_number
        if update.customer_name is not None:
            update_dict["customer_name"] = update.customer_name
        if update.production_decision_number is not None:
            update_dict["production_decision_number"] = update.production_decision_number
        if update.item_no_sku is not None:
            update_dict["item_no_sku"] = update.item_no_sku
        if update.date_code is not None:
            update_dict["date_code"] = update.date_code
        if update.note is not None:
            update_dict["note"] = update.note
        if update.scan_status is not None:
            update_dict["scan_status"] = update.scan_status
        if update.confirmed is not None:
            update_dict["confirmed"] = update.confirmed
        updates.append(update_dict)
    
    return await WarehouseImportService.update_import_pallet_info_by_id(
        db,
        updates
    )

