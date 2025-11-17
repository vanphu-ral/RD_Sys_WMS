"""
REST API endpoints for Warehouse Import management
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import WarehouseImportService

router = APIRouter()


@router.post("/requirements/from-sap")
async def create_import_requirement_from_sap(
    sap_data: dict,
    db: Session = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return WarehouseImportService.create_import_requirement_from_sap(db, sap_data)


@router.patch("/requirements/{requirement_id}/confirm-location")
async def confirm_import_requirement_location(
    requirement_id: int,
    location_id: int,
    db: Session = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return WarehouseImportService.confirm_import_requirement_location(db, requirement_id, location_id)


@router.patch("/requirements/{requirement_id}/status")
async def update_import_requirement_status(
    requirement_id: int,
    status: str,
    db: Session = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return WarehouseImportService.update_import_requirement_status(db, requirement_id, status)


@router.post("/scan-inventories")
async def scan_inventories(
    scan_data: List[dict],
    db: Session = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return WarehouseImportService.scan_inventories(db, scan_data)