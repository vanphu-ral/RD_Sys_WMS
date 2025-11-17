"""
REST API endpoints for Import Requirements management
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import WarehouseImportService

router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_import_requirements(
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):

    return await WarehouseImportService.get_import_requirements(db)