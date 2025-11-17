
import strawberry
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.types import Info

from app.modules.locations.schemas import (
    Location,
    LocationCreate,
    LocationUpdate
)
from app.modules.locations.service import LocationService
from app.core.database import get_db


# Strawberry types for GraphQL
@strawberry.experimental.pydantic.type(model=Location, all_fields=True)
class LocationType:
    pass

@strawberry.experimental.pydantic.input(model=LocationCreate, all_fields=True)
class LocationCreateInput:
    pass

@strawberry.experimental.pydantic.input(model=LocationUpdate, all_fields=True)
class LocationUpdateInput:
    pass


@strawberry.type
class LocationQuery:
    """GraphQL queries for locations"""

    @strawberry.field
    async def locations(self, info: Info) -> List[LocationType]:
        """Get all locations"""
        db = next(get_db())
        return await LocationService.get_locations(db)

    @strawberry.field
    async def location(self, info: Info, id: int) -> LocationType:
        """Get location by ID"""
        db = next(get_db())
        return await LocationService.get_location_by_id(db, id)

    @strawberry.field
    async def location_by_code(self, info: Info, code: str) -> LocationType:
        """Get location by code"""
        db = next(get_db())
        return await LocationService.get_location_by_code(db, code)

    @strawberry.field
    async def locations_by_area(self, info: Info, area_id: int) -> List[LocationType]:
        """Get locations by area"""
        db = next(get_db())
        return await LocationService.get_locations_by_area(db, area_id)

    @strawberry.field
    async def active_locations(self, info: Info) -> List[LocationType]:
        """Get active locations"""
        db = next(get_db())
        return await LocationService.get_active_locations(db)


@strawberry.type
class LocationMutation:
    """GraphQL mutations for locations"""

    @strawberry.mutation
    async def create_location(self, info: Info, input: LocationCreateInput) -> LocationType:
        """Create new location"""
        db = next(get_db())
        return await LocationService.create_location(db, input)

    @strawberry.mutation
    async def update_location(self, info: Info, id: int, input: LocationUpdateInput) -> LocationType:
        """Update existing location"""
        db = next(get_db())
        return await LocationService.update_location(db, id, input)

    @strawberry.mutation
    async def delete_location(self, info: Info, id: int) -> bool:
        """Delete location"""
        db = next(get_db())
        return await LocationService.delete_location(db, id)