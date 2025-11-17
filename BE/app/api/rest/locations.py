
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
# from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import LocationService
from app.modules.inventory.schemas import LocationListResponse, LocationResponse
from app.modules.locations.schemas import SubLocationCreate
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/", response_model=LocationListResponse)
async def get_locations(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    code: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    area_id: Optional[int] = Query(None),
    address: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return LocationService.get_locations_paginated(
        db,
        page=page,
        size=size,
        code=code,
        name=name,
        area_id=area_id,
        address=address,
        description=description,
        is_active=is_active
    )


@router.post("/", response_model=LocationResponse)
async def create_location(
    location_data: dict,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    # Ensure parent_location_id is None for parent locations
    location_data["parent_location_id"] = None
    location = LocationService.create_location(db, location_data)
    return location


@router.get("/minimal", response_model=List[dict])
async def get_minimal_locations(
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return LocationService.get_minimal_locations(db)


@router.get("/{location_id}")
async def get_location(
    location_id: int,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return LocationService.get_location_by_id(db, location_id)


@router.put("/{location_id}")
async def update_location(
    location_id: int,
    location_data: dict,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return LocationService.update_location(db, location_id, location_data)


@router.post("/{location_id}/clear-sub-locations")
async def clear_sub_locations(
    location_id: int,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return {"success": LocationService.clear_sub_locations(db, location_id)}


@router.patch("/{location_id}/status")
async def update_location_status(
    location_id: int,
    is_active: int,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return LocationService.update_location_status(db, location_id, bool(is_active))


@router.post("/{location_id}/sub-locations/bulk", response_model=List[dict])
async def bulk_create_sub_locations(
    location_id: int,
    sub_locations_data: List[SubLocationCreate],
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    from app.modules.locations.service import LocationService as LocationsLocationService

    created_locations = await LocationsLocationService.bulk_create_sub_locations(
        db, location_id, sub_locations_data
    )

    return [
        {
            "code": loc.code,
            "name": loc.name,
            "area_id": loc.area_id,
            "address": loc.address,
            "parent_location_id": loc.parent_location_id,
            "is_multi_location": 0,
            "humidity": loc.humidity,
            "temperature": loc.temperature,
            "barcode": loc.barcode,
            "updated_by": loc.updated_by
        }
        for loc in created_locations
    ]