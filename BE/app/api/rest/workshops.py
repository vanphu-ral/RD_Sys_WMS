from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.workshop.service import WorkshopService

router = APIRouter()


@router.get("/hierarchy")
async def get_workshop_hierarchy(
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)  # uncomment if auth needed
):
    """Get hierarchical list of workshops with branches and production teams"""
    return await WorkshopService.get_workshop_hierarchy(db)
