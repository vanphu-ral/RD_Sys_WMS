
import logging
from fastapi import APIRouter, Depends
from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.external_apps_schemas import InventoryUpdateResponse, UpdateInventoryLocationRequest, UpdateInventoryQuantityRequest, InventoriesWHRequest, InventoriesWHResponse
from app.modules.inventory.external_apps_service import InventoryUpdateService
from app.modules.inventory.service import InventoryService, ContainerInventoryService
from app.modules.inventory.schemas import ContainerInventoryCreate, ContainerInventoryResponse
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{identifier}")
async def get_inventory_by_identifier(
    identifier: str,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    logger.info(f"Fetching inventory with identifier: {identifier}")
    try:
        result = await InventoryService.get_inventory_by_identifier_async(db, identifier)
        logger.info(f"Successfully fetched inventory: {result}")
        return result
    except Exception as e:
        logger.error(f"Error fetching inventory {identifier}: {str(e)}", exc_info=True)
        raise

@router.put("/inventory/update-location", response_model=InventoryUpdateResponse)
async def update_inventory_location(
    request: UpdateInventoryLocationRequest,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    try:
        updated_inventory = await InventoryUpdateService.update_inventory_location(
            db=db,
            inventory_identifier=request.inventory_identifier,
            location_id=request.location_id,
            updated_by=request.updated_by or "system"
        )
        
        return InventoryUpdateResponse(
            success=True,
            message=f"Inventory '{request.inventory_identifier}' location updated successfully",
            inventory=updated_inventory
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update inventory location: {str(e)}")
    
@router.put("/inventory/update-quantity", response_model=InventoryUpdateResponse)
async def update_inventory_quantity(
    request: UpdateInventoryQuantityRequest,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):

    try:
        updated_inventory = await InventoryUpdateService.update_inventory_quantity(
            db=db,
            inventory_identifier=request.inventory_identifier,
            available_quantity=request.available_quantity,
            updated_by=request.updated_by or "system"
        )
        
        return InventoryUpdateResponse(
            success=True,
            inventory=updated_inventory
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update inventory quantity: {str(e)}")


@router.put("/inventories_wh", response_model=InventoriesWHResponse)
async def create_inventories_wh(
    request: InventoriesWHRequest,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):

    try:

        inventories_data = []
        for item in request.inventories:
            inventory_data = {
                "identifier": item.identifier,
                "part_number": item.part_number,
                "name": item.name,
                "serial_pallet": item.serial_pallet,
                "quantity": item.quantity,
                "available_quantity": item.available_quantity,
                "initial_quantity": item.initial_quantity,
                "location_id": item.location_id,
                "sap_code": item.sap_code,
                "po": item.po,
                "lot": item.lot,
                "vendor": item.vendor,
                "msd_level": item.msd_level,
                "comments": item.comments,
                "expiration_date": item.expiration_date,
                "manufacturing_date": item.manufacturing_date,
                "updated_by": "system"
            }
            inventories_data.append(inventory_data)

        created_inventories = await InventoryService.bulk_create_inventories_async(db, inventories_data)

        return InventoriesWHResponse(
            success=True,
            created_count=len(created_inventories),
            message=f"Successfully created {len(created_inventories)} inventories"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create inventories: {str(e)}")


@router.get("/scan-pallets/{serial_pallet}")
async def get_inventories_by_serial_pallet(
    serial_pallet: str,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    try:
        result = await InventoryService.get_inventories_by_scan_pallets(db,serial_pallet)
        return result
    except Exception as e:
        logger.error(f"Không tìm thấy thông tin của hàng hóa trong pallet trên hệ thống", exc_info=True)
        raise