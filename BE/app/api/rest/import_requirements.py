
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import WarehouseImportService, IWTRService
from app.modules.inventory.schemas import (
    WarehouseImportRequest,
    WarehouseImportResponse,
    WarehouseImportContainerResponse,
    WMSImportRequest,
    WMSImportResponse,
    ContainerInventoryCreate,
    ContainerInventoryResponse
)
from app.modules.inventory.models import WarehouseImportRequirement, WarehouseImportContainer
from datetime import datetime
from app.modules.inventory.service import InventoryService, ContainerInventoryService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[dict])
async def get_import_requirements(
    db: AsyncSession = Depends(get_db),
    # #current_user: str = Depends(get_current_user)
):
    return await WarehouseImportService.get_import_requirements(db)


@router.get("/{req_id}", response_model=dict)
async def get_import_requirement_details(
    req_id: int,
    db: AsyncSession = Depends(get_db),
    # #current_user: str = Depends(get_current_user)
):
    """Get detailed information for a specific import requirement in WMS structure"""
    try:
        # Get the import requirement in WMS structure
        wms_data = await WarehouseImportService.get_wms_import_requirement_by_id(db, req_id)

        return wms_data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Import requirement with ID {req_id} not found: {str(e)}")


@router.post("/", response_model=dict)
async def create_warehouse_import(
    import_request: WarehouseImportRequest,
    db: AsyncSession = Depends(get_db),
    # #current_user: str = Depends(get_current_user)s
):

    try:
        # Convert the Pydantic models to dict for the service
        import_data = {
            "general_info": import_request.general_info.model_dump(),
            "detail": [detail.model_dump() for detail in import_request.detail]
        }
        
        result = await WarehouseImportService.create_warehouse_import_with_details(db, import_data)
        
        import_requirement = result['import_requirement']
        containers = result['containers']
        
        return {
            "success": True,
            "data": {
                "import_requirement": {
                    "id": import_requirement.id,
                    "po_number": import_requirement.po_number,
                    "client_id": import_requirement.client_id,
                    "inventory_code": import_requirement.inventory_code,
                    "inventory_name": import_requirement.inventory_name,
                    "wo_code": import_requirement.wo_code,
                    "lot_number": import_requirement.lot_number,
                    "production_date": import_requirement.production_date,
                    "branch": import_requirement.branch,
                    "production_team": import_requirement.production_team,
                    "production_decision_number": import_requirement.production_decision_number,
                    "item_no_sku": import_requirement.item_no_sku,
                    "status": import_requirement.status,
                    "approver": import_requirement.approver,
                    "note": import_requirement.note,
                    "destination_warehouse": import_requirement.destination_warehouse,
                    "pallet_note_creation_session_id": import_requirement.pallet_note_creation_session_id,
                    "created_by": import_requirement.created_by,
                    "updated_by": import_requirement.updated_by,
                    "updated_date": import_requirement.updated_date.isoformat() if import_requirement.updated_date else None
                },
                "containers": [
                    {
                        "id": container.id,
                        "warehouse_import_requirement_id": container.warehouse_import_requirement_id,
                        "serial_pallet": container.serial_pallet,
                        "box_code": container.box_code,
                        "box_quantity": container.box_quantity,
                        "list_serial_items": container.list_serial_items,
                        "updated_by": container.updated_by,
                        "updated_date": container.updated_date.isoformat() if container.updated_date else None
                    }
                    for container in containers
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating warehouse import: {str(e)}")
    
@router.post("/container-inventories/scan", response_model=ContainerInventoryResponse)
async def create_container_inventory(
    request: ContainerInventoryCreate,
    db: AsyncSession = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):
    """Create a new container inventory record"""
    try:
        container_data = request.model_dump()
        created_container = await ContainerInventoryService.create_container_inventory(db, container_data)
        return ContainerInventoryResponse.model_validate(created_container)
    except Exception as e:
        logger.error(f"Error creating container inventory: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create container inventory: {str(e)}")


@router.get("/container-inventories/{import_container_id}/scan")
async def get_container_inventories_by_import_container_id(
    import_container_id: int,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):
    """Get container inventories by import_container_id"""
    try:
        result = await ContainerInventoryService.get_container_inventories_by_import_container_id(
            db, import_container_id, page, size
        )
        return result
    except Exception as e:
        logger.error(f"Error fetching container inventories for import_container_id {import_container_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch container inventories: {str(e)}")
    

@router.post("/wms", response_model=WMSImportResponse)
async def create_wms_import_requirement(
    request: WMSImportRequest,
    db: AsyncSession = Depends(get_db),
    # #current_user: str = Depends(get_current_user)
):
    try:
        import_data = request.model_dump()
        result = await WarehouseImportService.create_wms_import_with_nested_data(db, import_data)
        
        return WMSImportResponse(
            success=True
        )
    except Exception as e:
        logger.error(f"Gửi nhập kho WMS thất bại: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Gửi nhập kho WMS thất bại: {str(e)}")