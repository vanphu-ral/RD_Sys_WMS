
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
        stmt = select(Location).where(Location.parent_location_id.is_(None))
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_location_by_id(db: AsyncSession, location_id: int) -> Location:
        result = await db.execute(select(Location).where(Location.id == location_id))
        location = result.scalar_one_or_none()
        if not location:
            raise NotFoundException("Location", str(location_id))
        return location

    @staticmethod
    async def get_location_with_sub_locations(db: AsyncSession, location_id: int) -> dict:
        """Get location with all its sub-locations"""
 
        result = await db.execute(select(Location).where(Location.id == location_id))
        location = result.scalar_one_or_none()
        if not location:
            raise NotFoundException("Location", str(location_id))
        
 
        sub_result = await db.execute(
            select(Location).where(Location.parent_location_id == location_id)
        )
        sub_locations = sub_result.scalars().all()
        
 
        location_dict = {
            "id": location.id,
            "code": location.code,
            "name": location.name,
            "area_id": location.area_id,
            "address": location.address,
            "description": location.description,
            "is_multi_location": location.is_multi_location,
            "number_of_rack": location.number_of_rack,
            "number_of_rack_empty": location.number_of_rack_empty,
            "parent_location_id": location.parent_location_id,
            "prefix_name": location.prefix_name,
            "prefix_separator": location.prefix_separator,
            "child_location_row_count": location.child_location_row_count,
            "child_location_column_count": location.child_location_column_count,
            "suffix_separator": location.suffix_separator,
            "suffix_digit_len": location.suffix_digit_len,
            "humidity": location.humidity,
            "temperature": location.temperature,
            "barcode": location.barcode,
            "is_active": location.is_active,
            "updated_by": location.updated_by,
            "updated_date": location.updated_date,
            "sub_locations": [
                {
                    "id": sub.id,
                    "code": sub.code,
                    "name": sub.name,
                    "area_id": sub.area_id,
                    "address": sub.address,
                    "description": sub.description,
                    "is_multi_location": sub.is_multi_location,
                    "number_of_rack": sub.number_of_rack,
                    "number_of_rack_empty": sub.number_of_rack_empty,
                    "parent_location_id": sub.parent_location_id,
                    "humidity": sub.humidity,
                    "temperature": sub.temperature,
                    "barcode": sub.barcode,
                    "is_active": sub.is_active,
                    "updated_by": sub.updated_by,
                    "updated_date": sub.updated_date,
                }
                for sub in sub_locations
            ]
        }
        
        return location_dict

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
                "area_id": sub_data.area_id if sub_data.area_id is not None else (parent_location.area_id if parent_location.area_id else None),  # ke thua tu parent neu khong co va hop le
                "address": sub_data.address,
                "description": None,
                "is_multi_location": False,
                "number_of_rack": None,
                "number_of_rack_empty": None,
                "parent_location_id": parent_location_id,
                "prefix_name": None,
                "prefix_separator": None,
                "child_location_row_count": None,
                "child_location_column_count": None,
                "suffix_separator": None,
                "suffix_digit_len": None,
                "humidity": sub_data.humidity if sub_data.humidity is not None else parent_location.humidity,  # ke thua tu parent neu khong co
                "temperature": sub_data.temperature if sub_data.temperature is not None else parent_location.temperature,  # ke thua tu parent neu khong co
                "barcode": sub_data.barcode,
                "is_active": sub_data.is_active,
                "updated_by": sub_data.updated_by
            }
            locations_to_create.append(Location(**location_data))

        db.add_all(locations_to_create)
        await db.commit()

        for location in locations_to_create:
            await db.refresh(location)

        return locations_to_create