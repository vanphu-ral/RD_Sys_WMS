
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
        from app.core.database import AsyncSessionLocal
        from app.modules.locations.schemas import Location as LocationSchema
        async with AsyncSessionLocal() as db:
            locations = await LocationService.get_locations(db)
            return [LocationSchema.from_orm(loc) for loc in locations]

    @strawberry.field
    async def location(self, info: Info, id: int) -> LocationType:
        """Get location by ID"""
        from app.core.database import AsyncSessionLocal
        from app.modules.locations.schemas import Location as LocationSchema
        async with AsyncSessionLocal() as db:
            loc = await LocationService.get_location_by_id(db, id)
            return LocationSchema.from_orm(loc)

    @strawberry.field
    async def location_by_code(self, info: Info, code: str) -> LocationType:
        """Get location by code"""
        from app.core.database import AsyncSessionLocal
        from app.modules.locations.schemas import Location as LocationSchema
        async with AsyncSessionLocal() as db:
            loc = await LocationService.get_location_by_code(db, code)
            return LocationSchema.from_orm(loc)

    @strawberry.field
    async def locations_by_area(self, info: Info, area_id: int) -> List[LocationType]:
        """Get locations by area"""
        from app.core.database import AsyncSessionLocal
        from app.modules.locations.schemas import Location as LocationSchema
        async with AsyncSessionLocal() as db:
            locations = await LocationService.get_locations_by_area(db, area_id)
            return [LocationSchema.from_orm(loc) for loc in locations]

    @strawberry.field
    async def active_locations(self, info: Info) -> List[LocationType]:
        """Get active locations"""
        from app.core.database import AsyncSessionLocal
        from app.modules.locations.schemas import Location as LocationSchema
        async with AsyncSessionLocal() as db:
            locations = await LocationService.get_active_locations(db)
            return [LocationSchema.from_orm(loc) for loc in locations]


@strawberry.type
class LocationMutation:
    """GraphQL mutations for locations"""

    @strawberry.mutation
    async def create_location(self, info: Info, input: LocationCreateInput) -> LocationType:
        """Create new location"""
        from app.core.database import AsyncSessionLocal
        from app.modules.locations.schemas import Location as LocationSchema
        async with AsyncSessionLocal() as db:
            loc = await LocationService.create_location(db, input)
            return LocationSchema.from_orm(loc)

    @strawberry.mutation
    async def update_location(self, info: Info, id: int, input: LocationUpdateInput) -> LocationType:
        """Update existing location"""
        from app.core.database import AsyncSessionLocal
        from app.modules.locations.schemas import Location as LocationSchema
        async with AsyncSessionLocal() as db:
            loc = await LocationService.update_location(db, id, input)
            return LocationSchema.from_orm(loc)

    @strawberry.mutation
    async def delete_location(self, info: Info, id: int) -> bool:
        """Delete location"""
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            return await LocationService.delete_location(db, id)