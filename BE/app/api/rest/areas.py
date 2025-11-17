
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import AreaService
from app.modules.inventory.models import Area
from app.modules.inventory.schemas import AreaListResponse, AreaResponse

router = APIRouter()


@router.get("/", response_model=AreaListResponse)
async def get_areas(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    code: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    thu_kho: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    address: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return await AreaService.get_areas_paginated(
        db,
        page=page,
        size=size,
        code=code,
        name=name,
        thu_kho=thu_kho,
        description=description,
        address=address,
        is_active=is_active
    )


@router.post("/", response_model=List[AreaResponse])
async def create_areas(
    areas_data: List[dict],
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    if len(areas_data) != 1:
        raise HTTPException(status_code=400, detail="Chỉ gửi thông tin 1 kho")
    return await AreaService.create_areas(db, areas_data)


@router.patch("/{area_id}/status", response_model=AreaResponse)
async def update_area_status(
    area_id: int,
    is_active: int,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return await AreaService.update_area_status(db, area_id, bool(is_active))

# @router.patch("/{location_id}/status")
# async def update_location_status(
#     location_id: int,
#     is_active: int,
#     db: Session = Depends(get_db),
#     # current_user: str = Depends(get_current_user)
# ):
#     return LocationService.update_location_status(db, location_id, bool(is_active))