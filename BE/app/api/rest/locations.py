
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import ValidationError
# from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import LocationService
from app.modules.inventory.schemas import LocationListResponse, LocationResponse
from app.modules.locations.schemas import SubLocationCreate, LocationWithSubLocationsResponse, LocationUpdate, LocationCreate, LocationUpdateWithFullData
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
    parent_location_id: Optional[int] = Query(None, description="Filter by parent location ID. Leave empty to get parent locations only."),
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return await LocationService.get_locations_paginated(
        db,
        page=page,
        size=size,
        code=code,
        name=name,
        area_id=area_id,
        address=address,
        description=description,
        is_active=is_active,
        parent_location_id=parent_location_id
    )


@router.post("/", response_model=LocationResponse)
async def create_location(
    location_data: dict = Body(..., description="Location data for creation"),
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Create a new location with validation"""
    try:
        required_fields = ["code", "name", "area_id", "barcode", "updated_by"]
        missing_fields = []
        
        for field in required_fields:
            if not location_data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required fields: {', '.join(missing_fields)}"
            )
        
        location_dict = location_data.copy()
        
        if "is_active" not in location_dict:
            location_dict["is_active"] = True
        

        if "parent_location_id" not in location_dict:
            location_dict["parent_location_id"] = None
        
        location = await LocationService.create_location_async(db, location_dict)
        return location
    except ValidationError as e:
        # Convert Pydantic validation errors to readable format
        error_details = []
        for error in e.errors():
            field = ".".join(str(x) for x in error["loc"])
            error_details.append(f"{field}: {error['msg']}")
        raise HTTPException(status_code=422, detail="; ".join(error_details))
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging and provide a user-friendly message
        error_msg = str(e) if str(e).strip() else "Unknown error occurred"
        raise HTTPException(status_code=400, detail=f"Failed to create location: {error_msg}")


@router.get("/minimal", response_model=List[dict])
async def get_minimal_locations(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return await LocationService.get_minimal_locations(db)


@router.get("/{location_id}", response_model=LocationWithSubLocationsResponse)
async def get_location(
    location_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get full information of a location and its sub-locations"""
    from app.modules.locations.service import LocationService as LocationsLocationService
    return await LocationsLocationService.get_location_with_sub_locations(db, location_id)


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: int,
    location_data: LocationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Update location information by ID"""
    return await LocationService.update_location(db, location_id, location_data.model_dump(exclude_unset=True))


@router.put("/update-full/{location_id}", response_model=LocationResponse)
async def update_location_full_data(
    location_id: int,
    location_data: dict = Body(..., description="Full location data for update"),
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Update location with full data by ID - accepts the specified body format"""
    try:
        # Convert to dict for service
        location_dict = location_data.copy()
        
        
        location = await LocationService.update_location(db, location_id, location_dict)
        return location
    except ValidationError as e:
        # Convert Pydantic validation errors to readable format
        error_details = []
        for error in e.errors():
            field = ".".join(str(x) for x in error["loc"])
            error_details.append(f"{field}: {error['msg']}")
        raise HTTPException(status_code=422, detail="; ".join(error_details))
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging and provide a user-friendly message
        error_msg = str(e) if str(e).strip() else "Unknown error occurred"
        raise HTTPException(status_code=400, detail=f"Failed to update location: {error_msg}")


@router.post("/{location_id}/clear-sub-locations")
async def clear_sub_locations(
    location_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    deleted_count = await LocationService.clear_sub_locations(db, location_id)
    return {"success": True, "deleted_count": deleted_count}


@router.patch("/{location_id}/status")
async def update_location_status(
    location_id: int,
    is_active: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return await LocationService.update_location_status_async(db, location_id, bool(is_active))


@router.post("/{location_id}/sub-locations/bulk", response_model=List[dict])
async def bulk_create_sub_locations(
    location_id: int,
    sub_locations_data: List[SubLocationCreate],
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
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