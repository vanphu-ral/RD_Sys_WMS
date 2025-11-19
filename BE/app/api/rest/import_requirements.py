
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import WarehouseImportService, IWTRService
from app.modules.inventory.schemas import WarehouseImportRequest, WarehouseImportResponse, WarehouseImportContainerResponse
from app.modules.inventory.models import WarehouseImportRequirement, WarehouseImportContainer
from datetime import datetime
from app.modules.inventory.service import InventoryService, ContainerInventoryService
from app.modules.inventory.schemas import ContainerInventoryCreate, ContainerInventoryResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[dict])
async def get_import_requirements(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return await WarehouseImportService.get_import_requirements(db)


@router.get("/{req_id}", response_model=dict)
async def get_import_requirement_details(
    req_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get detailed information for a specific import requirement including containers"""
    try:
        # Get the import requirement
        import_requirement = await WarehouseImportService.get_import_requirement_by_id(db, req_id)

        # Get the containers for this requirement
        from sqlalchemy import select
        from app.modules.inventory.models import WarehouseImportContainer

        result = await db.execute(
            select(WarehouseImportContainer).where(
                WarehouseImportContainer.warehouse_import_requirement_id == req_id
            )
        )
        containers = result.scalars().all()

        return {
            "data": {
                "import_requirement": {
                    "id": import_requirement.id,
                    "po_code": import_requirement.order_id,
                    "client_id": import_requirement.client_id,
                    "inventory_name": import_requirement.inventory_name,
                    "number_of_pallet": import_requirement.number_of_pallet,
                    "number_of_box": import_requirement.number_of_box,
                    "quantity": import_requirement.quantity,
                    "wo_code": import_requirement.wo_code,
                    "lot_number": import_requirement.lot_number,
                    "status": import_requirement.status,
                    "approved_by": import_requirement.approved_by,
                    "is_check_all": import_requirement.is_check_all,
                    "note": import_requirement.note,
                    "updated_by": import_requirement.updated_by,
                    "updated_date": import_requirement.updated_date.isoformat() if import_requirement.updated_date else None,
                    "deleted_at": import_requirement.deleted_at.isoformat() if import_requirement.deleted_at else None,
                    "deleted_by": import_requirement.deleted_by
                },
                "containers": [
                    {
                        "id": container.id,
                        "warehouse_import_requirement_id": container.warehouse_import_requirement_id,
                        "serial_pallet": container.serial_pallet,
                        "box_code": container.box_code,
                        "box_quantity": container.box_quantity,
                        "updated_by": container.updated_by,
                        "updated_date": container.updated_date.isoformat() if container.updated_date else None
                    }
                    for container in containers
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Import requirement with ID {req_id} not found: {str(e)}")


@router.post("/", response_model=dict)
async def create_warehouse_import(
    import_request: WarehouseImportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
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
                    "po_code": import_requirement.order_id,
                    "client_id": import_requirement.client_id,
                    "inventory_name": import_requirement.inventory_name,
                    "number_of_pallet": import_requirement.number_of_pallet,
                    "number_of_box": import_requirement.number_of_box,
                    "quantity": import_requirement.quantity,
                    "wo_code": import_requirement.wo_code,
                    "lot_number": import_requirement.lot_number,
                    "status": import_requirement.status,
                    "note": import_requirement.note,
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
    current_user: str = Depends(get_current_user)
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
    current_user: str = Depends(get_current_user)
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
    