"""
REST API endpoints for Inventories management
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import InventoryService

router = APIRouter()


@router.get("/{identifier}")
async def get_inventory_by_identifier(
    identifier: str,
    db: Session = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    """Get inventory by identifier"""
    return InventoryService.get_inventory_by_identifier(db, identifier)