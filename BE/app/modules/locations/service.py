
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.inventory.models import Location
from app.modules.locations.schemas import (
    LocationCreate,
    LocationUpdate,
    SubLocationCreate
)
from app.core.exceptions import NotFoundException


class LocationService:

    @staticmethod
    async def get_locations(db: AsyncSession) -> List[Location]:
        """Get all locations"""
        result = await db.execute(select(Location))
        return result.scalars().all()

    @staticmethod
    async def get_location_by_id(db: AsyncSession, location_id: int) -> Location:
        result = await db.execute(select(Location).where(Location.id == location_id))
        location = result.scalar_one_or_none()
        if not location:
            raise NotFoundException("Location", str(location_id))
        return location

    @staticmethod
    async def get_location_by_code(db: AsyncSession, code: str) -> Location:
        """Get location by code"""
        result = await db.execute(select(Location).where(Location.code == code))
        location = result.scalar_one_or_none()
        if not location:
            raise NotFoundException("Location", code)
        return location

    @staticmethod
    async def create_location(db: AsyncSession, location_data: LocationCreate) -> Location:
        """Create new location"""
        location = Location(**location_data.dict())
        db.add(location)
        await db.commit()
        await db.refresh(location)
        return location

    @staticmethod
    async def update_location(
        db: AsyncSession,
        location_id: int,
        location_data: LocationUpdate
    ) -> Location:
        """Update existing location"""
        location = await LocationService.get_location_by_id(db, location_id)
        update_data = location_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(location, field, value)
        await db.commit()
        await db.refresh(location)
        return location

    @staticmethod
    async def delete_location(db: AsyncSession, location_id: int) -> bool:
        """Delete location"""
        location = await LocationService.get_location_by_id(db, location_id)
        await db.delete(location)
        await db.commit()
        return True

    @staticmethod
    async def get_locations_by_area(db: AsyncSession, area_id: int) -> List[Location]:
        """Get locations by area"""
        result = await db.execute(select(Location).where(Location.area_id == area_id))
        return result.scalars().all()

    @staticmethod
    async def get_active_locations(db: AsyncSession) -> List[Location]:
        """Get active locations"""
        result = await db.execute(
            select(Location).where(Location.is_active == True)
        )
        return result.scalars().all()

    @staticmethod
    async def bulk_create_sub_locations(
        db: AsyncSession,
        parent_location_id: int,
        sub_locations_data: List[SubLocationCreate]
    ) -> List[Location]:
        parent_location = await LocationService.get_location_by_id(db, parent_location_id)

        locations_to_create = []
        for sub_data in sub_locations_data:
            location_data = {
                "code": sub_data.code,
                "name": sub_data.name,
                "area_id": sub_data.area_id if sub_data.area_id is not None else parent_location.area_id,  # ke thua tu parent neu khong co
                "parent_location_id": parent_location_id,
                "humidity": sub_data.humidity if sub_data.humidity is not None else parent_location.humidity,  # ke thua tu parent neu khong co
                "temperature": sub_data.temperature if sub_data.temperature is not None else parent_location.temperature,  # ke thua tu parent neu khong co
                "barcode": sub_data.barcode,
                "updated_by": sub_data.updated_by
            }
            locations_to_create.append(Location(**location_data))

        db.add_all(locations_to_create)
        await db.commit()

        for location in locations_to_create:
            await db.refresh(location)

        return locations_to_create