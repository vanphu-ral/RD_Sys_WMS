from fastapi import  HTTPException
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.modules.inventory.models import (
    Area,
    Location,
    Inventory,
    WarehouseImportRequirement,
    InternalWarehouseTransferRequest,
    OutboundShipmentRequestOnOrder
)
from app.core.exceptions import NotFoundException


class InventoryService:

    @staticmethod
    def get_inventories(db: Session) -> List[Inventory]:
        result = db.execute(select(Inventory))
        return result.scalars().all()

    @staticmethod
    def get_inventory_by_id(db: Session, inventory_id: int) -> Inventory:
        result = db.execute(select(Inventory).where(Inventory.id == inventory_id))
        inventory = result.scalar_one_or_none()
        if not inventory:
            raise NotFoundException("Inventory", str(inventory_id))
        return inventory

    @staticmethod
    def get_inventory_by_identifier(db: Session, identifier: str) -> Inventory:
        result = db.execute(select(Inventory).where(Inventory.identifier == identifier))
        inventory = result.scalar_one_or_none()
        if not inventory:
            raise NotFoundException("Inventory", identifier)
        return inventory

    @staticmethod
    def update_inventory_quantity(db: Session, inventory_id: int, new_quantity: int) -> Inventory:
        with db.begin():
            inventory = InventoryService.get_inventory_by_id(db, inventory_id)
            inventory.quantity = new_quantity
            inventory.available_quantity = new_quantity
            db.commit()
            db.refresh(inventory)
            return inventory

    @staticmethod
    def update_inventory_location(db: Session, inventory_id: int, new_location_id: int) -> Inventory:
        with db.begin():
            inventory = InventoryService.get_inventory_by_id(db, inventory_id)
            inventory.last_location_id = inventory.location_id
            inventory.location_id = new_location_id
            db.commit()
            db.refresh(inventory)
            return inventory

    @staticmethod
    def create_inventory(db: Session, inventory_data: dict) -> Inventory:
        with db.begin():
            inventory = Inventory(**inventory_data)
            db.add(inventory)
            db.commit()
            db.refresh(inventory)
            return inventory

    @staticmethod
    def delete_inventory(db: Session, inventory_id: int) -> bool:
        with db.begin():
            inventory = InventoryService.get_inventory_by_id(db, inventory_id)
            db.delete(inventory)
            db.commit()
            return True


class AreaService:

    @staticmethod
    def get_areas(db: Session) -> List[dict]:
        result = db.execute(select(Area.id, Area.code, Area.name, Area.thu_kho, Area.description, Area.address, Area.is_active))
        return [{"id": area.id, "code": area.code, "name": area.name, "thu_kho": area.thu_kho, "description": area.description, "address": area.address, "is_active": area.is_active} for area in result]

    @staticmethod
    async def get_areas_paginated(
        db: AsyncSession,
        page: int = 1,
        size: int = 20,
        code: Optional[str] = None,
        name: Optional[str] = None,
        thu_kho: Optional[str] = None,
        description: Optional[str] = None,
        address: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> dict:
        from sqlalchemy import and_
        
        query = select(Area)
        
        # Apply filters
        filters = []
        if code:
            filters.append(Area.code.ilike(f"%{code}%"))
        if name:
            filters.append(Area.name.ilike(f"%{name}%"))
        if thu_kho:
            filters.append(Area.thu_kho.ilike(f"%{thu_kho}%"))
        if description:
            filters.append(Area.description.ilike(f"%{description}%"))
        if address:
            filters.append(Area.address.ilike(f"%{address}%"))
        if is_active is not None:
            filters.append(Area.is_active == is_active)
        
        if filters:
            query = query.where(and_(*filters))
        
        # Get total count
        count_query = select(func.count()).select_from(Area)
        if filters:
            count_query = count_query.where(and_(*filters))
        count_result = await db.execute(count_query)
        total_items = count_result.scalar() or 0
        
        query = query.order_by(Area.updated_date.desc())
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)
        
        result = await db.execute(query)
        areas = result.scalars().all()
        
        data = [
            {
                "id": area.id,
                "code": area.code,
                "name": area.name,
                "thu_kho": area.thu_kho,
                "description": area.description,
                "address": area.address,
                "is_active": area.is_active
            }
            for area in areas
        ]
        
        return {
            "data": data,
            "meta": {
                "page": page,
                "size": size,
                "total_items": total_items
            }
        }

    @staticmethod
    async def get_area_by_id(db: AsyncSession, area_id: int) -> Area:
        result = await db.execute(select(Area).where(Area.id == area_id))
        area = result.scalar_one_or_none()
        if not area:
            raise NotFoundException("Area", str(area_id))
        return area

    @staticmethod
    def create_area(db: Session, area_data: dict) -> Area:
        with db.begin():
            area = Area(**area_data)
            db.add(area)
            db.commit()
            db.refresh(area)
            return area

    @staticmethod
    async def update_area_status(db: AsyncSession, area_id: int, is_active: bool) -> Area:
        area = await AreaService.get_area_by_id(db, area_id)
        area.is_active = is_active
        await db.commit()
        await db.refresh(area)
        return area

    # @staticmethod
    # def update_location_status(db: Session, location_id: int, is_active: bool) -> Location:
    #     with db.begin():
    #         location = LocationService.get_location_by_id(db, location_id)
    #         location.is_active = is_active
    #         db.refresh(location)
    #         return location

    @staticmethod
    async def create_areas(db: AsyncSession, areas_data: List[dict]) -> List[Area]:
        async with db.begin(): # Giao dịch mở
            areas = [Area(**data) for data in areas_data]
            db.add_all(areas)
            await db.flush()
            for area in areas:
                await db.refresh(area)
            return areas
class LocationService:

    @staticmethod
    def get_locations(db: Session) -> List[Location]:
        result = db.execute(select(Location))
        return result.scalars().all()

    @staticmethod
    def get_location_by_id(db: Session, location_id: int) -> Location:
        result = db.execute(select(Location).where(Location.id == location_id))
        location = result.scalar_one_or_none()
        if not location:
            raise NotFoundException("Location", str(location_id))
        return location

    @staticmethod
    def get_minimal_locations(db: Session) -> List[dict]:
        result = db.execute(select(Location.id, Location.code, Location.name))
        return [{"id": loc.id, "code": loc.code} for loc in result]

    @staticmethod
    def create_location(db: Session, location_data: dict) -> Location:
        location = Location(**location_data)
        db.add(location)
        db.commit()
        db.refresh(location)
        return location

    @staticmethod
    def update_location(db: Session, location_id: int, location_data: dict) -> Location:
        with db.begin():
            location = LocationService.get_location_by_id(db, location_id)
            for key, value in location_data.items():
                setattr(location, key, value)
            db.refresh(location)
            return location

    @staticmethod
    def update_location_status(db: Session, location_id: int, is_active: bool) -> Location:
        location = LocationService.get_location_by_id(db, location_id)
        location.is_active = is_active
        db.commit()
        db.refresh(location)
        return location

    
    @staticmethod
    def clear_sub_locations(db: Session, location_id: int) -> bool:
        with db.begin():
            # Find all sub-locations
            result = db.execute(
                select(Location).where(Location.parent_location_id == location_id)
            )
            sub_locations = result.scalars().all()

            # Clear their parent reference
            for sub_loc in sub_locations:
                sub_loc.parent_location_id = None

            db.commit()
            return True

    @staticmethod
    def bulk_create_locations(db: Session, locations_data: List[dict]) -> List[Location]:
        locations = [Location(**data) for data in locations_data]
        db.add_all(locations)
        db.commit()
        for location in locations:
            db.refresh(location)
        return locations

    @staticmethod
    def get_locations_paginated(
        db: Session,
        page: int = 1,
        size: int = 20,
        code: Optional[str] = None,
        name: Optional[str] = None,
        area_id: Optional[int] = None,
        address: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> dict:
        """Get paginated and filtered locations"""
        from sqlalchemy import and_

        query = select(Location)

        # Apply filters
        filters = []
        if code:
            filters.append(Location.code.ilike(f"%{code}%"))
        if name:
            filters.append(Location.name.ilike(f"%{name}%"))
        if area_id:
            filters.append(Location.area_id == area_id)
        if address:
            filters.append(Location.address.ilike(f"%{address}%"))
        if description:
            filters.append(Location.description.ilike(f"%{description}%"))
        if is_active is not None:
            filters.append(Location.is_active == is_active)

        if filters:
            query = query.where(and_(*filters))

        # Get total count
        count_query = select(func.count()).select_from(Location)
        if filters:
            count_query = count_query.where(and_(*filters))
        count_result = db.execute(count_query)
        total_items = count_result.scalar() or 0

        query = query.order_by(Location.updated_date.desc())
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        result = db.execute(query)
        locations = result.scalars().all()

        data = [
            {
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
                "is_active": location.is_active
            }
            for location in locations
        ]

        return {
            "data": data,
            "meta": {
                "page": page,
                "size": size,
                "total_items": total_items
            }
        }


class WarehouseImportService:

    @staticmethod
    async def get_import_requirements(db: AsyncSession) -> List[WarehouseImportRequirement]:
        result = await db.execute(select(WarehouseImportRequirement))
        return result.scalars().all()

    @staticmethod
    def get_import_requirement_by_id(db: Session, req_id: int) -> WarehouseImportRequirement:
        result = db.execute(select(WarehouseImportRequirement).where(WarehouseImportRequirement.id == req_id))
        req = result.scalar_one_or_none()
        if not req:
            raise NotFoundException("ImportRequirement", str(req_id))
        return req

    @staticmethod
    def create_import_requirement_from_sap(db: Session, sap_data: dict) -> WarehouseImportRequirement:
        with db.begin():
            req = WarehouseImportRequirement(**sap_data)
            db.add(req)
            db.commit()
            db.refresh(req)
            return req

    @staticmethod
    def update_import_requirement_status(db: Session, req_id: int, status: str) -> WarehouseImportRequirement:
        with db.begin():
            req = WarehouseImportService.get_import_requirement_by_id(db, req_id)
            req.status = status
            db.commit()
            db.refresh(req)
            return req

    @staticmethod
    def confirm_import_requirement_location(db: Session, req_id: int, location_id: int) -> WarehouseImportRequirement:
        with db.begin():
            req = WarehouseImportService.get_import_requirement_by_id(db, req_id)
            # Logic to confirm location
            req.status = "Location Confirmed"
            db.commit()
            db.refresh(req)
            return req

    @staticmethod
    def scan_inventories(db: Session, scan_data: List[dict]) -> List[dict]:
        # Implement scanning logic
        return scan_data


class IWTRService:

    @staticmethod
    async def get_iwtr_requests(db: AsyncSession) -> List[dict]:
        result = await db.execute(select(InternalWarehouseTransferRequest))
        requests = result.scalars().all()
        return [
            {
                "id": req.id,
                "ma_yc_cknb": req.ma_yc_cknb,
                "tu_kho": req.tu_kho,
                "den_kho": req.den_kho,
                "don_vi_linh": req.don_vi_linh,
                "don_vi_nhan": req.don_vi_nhan,
                "ly_do_xuat_nhap": req.ly_do_xuat_nhap,
                "ngay_chung_tu": req.ngay_chung_tu,
                "so_phieu_xuat": req.so_phieu_xuat,
                "so_chung_tu": req.so_chung_tu,
                "series_PGH": req.series_PGH,
                "status": req.status,
                "note": req.note,
                "scan_status": req.scan_status,
                "updated_by": req.updated_by,
                "updated_date": req.updated_date
            }
            for req in requests
        ]

    @staticmethod
    async def get_iwtr_request_by_id(db: AsyncSession, req_id: int) -> InternalWarehouseTransferRequest:
        result = await db.execute(select(InternalWarehouseTransferRequest).where(InternalWarehouseTransferRequest.id == req_id))
        req = result.scalar_one_or_none()
        if not req:
            raise NotFoundException("IWTR", str(req_id))
        return req

    @staticmethod
    async def create_iwtr_request(db: AsyncSession, iwtr_data: dict) -> InternalWarehouseTransferRequest:
        async with db.begin():
            req = InternalWarehouseTransferRequest(**iwtr_data)
            db.add(req)
            await db.flush()
            await db.refresh(req)
            return req

    @staticmethod
    async def confirm_iwtr_location(db: AsyncSession, req_id: int, location_id: int) -> InternalWarehouseTransferRequest:
        async with db.begin():
            req = await IWTRService.get_iwtr_request_by_id(db, req_id)
            # Logic to confirm location
            req.status = "Location Confirmed"
            await db.flush()
            await db.refresh(req)
            return req

    @staticmethod
    async def scan_iwtr(db: AsyncSession, req_id: int, scan_data: dict) -> dict:
        # Implement scanning logic for IWTR
        return scan_data


class OSRService:

    @staticmethod
    async def get_osr_requests(db: AsyncSession) -> List[dict]:
        result = await db.execute(select(OutboundShipmentRequestOnOrder))
        requests = result.scalars().all()
        return [
            {
                "id": req.id,
                "ma_yc_xk": req.ma_yc_xk,
                "kho_xuat": req.kho_xuat,
                "xuat_toi": req.xuat_toi,
                "don_vi_linh": req.don_vi_linh,
                "don_vi_nhan": req.don_vi_nhan,
                "ly_do_xuat_nhap": req.ly_do_xuat_nhap,
                "ngay_chung_tu": req.ngay_chung_tu,
                "so_phieu_xuat": req.so_phieu_xuat,
                "so_chung_tu": req.so_chung_tu,
                "series_PGH": req.series_PGH,
                "status": req.status,
                "note": req.note,
                "scan_status": req.scan_status,
                "updated_by": req.updated_by,
                "updated_date": req.updated_date
            }
            for req in requests
        ]

    @staticmethod
    async def get_osr_request_by_id(db: AsyncSession, req_id: int) -> OutboundShipmentRequestOnOrder:
        result = await db.execute(select(OutboundShipmentRequestOnOrder).where(OutboundShipmentRequestOnOrder.id == req_id))
        req = result.scalar_one_or_none()
        if not req:
            raise NotFoundException("OSR", str(req_id))
        return req

    @staticmethod
    async def create_osr_request(db: AsyncSession, osr_data: dict) -> OutboundShipmentRequestOnOrder:
        async with db.begin():
            req = OutboundShipmentRequestOnOrder(**osr_data)
            db.add(req)
            await db.flush()
            await db.refresh(req)
            return req

    @staticmethod
    async def confirm_osr_location(db: AsyncSession, req_id: int, location_id: int) -> OutboundShipmentRequestOnOrder:
        async with db.begin():
            req = await OSRService.get_osr_request_by_id(db, req_id)
            # Logic to confirm location
            req.status = "Location Confirmed"
            await db.flush()
            await db.refresh(req)
            return req

    @staticmethod
    async def scan_osr(db: AsyncSession, req_id: int, scan_data: dict) -> dict:
        # Implement scanning logic for OSR
        return scan_data


class External_Apps_Service:

    @staticmethod
    def get_external_apps_import_requirements(db: Session) -> List[WarehouseImportRequirement]:
        return WarehouseImportService.get_import_requirements(db)

    @staticmethod
    async def get_external_apps_iwtr(db: AsyncSession) -> List[dict]:
        return await IWTRService.get_iwtr_requests(db)

    @staticmethod
    async def get_external_apps_osr(db: AsyncSession) -> List[dict]:
        return await OSRService.get_osr_requests(db)

class UIService:

    @staticmethod
    def get_ui_areas(db: Session) -> List[dict]:
        result = db.execute(select(Area.id, Area.code, Area.name,Area.thu_kho, Area.description,Area.address ,Area.is_active))
        return [{"id": area.id, "code": area.code, "name": area.name,"thu_kho": area.thu_kho,"description": area.description,"address": area.address, "is_active": area.is_active} for area in result]

    @staticmethod
    def get_ui_locations(db: Session) -> List[dict]:
        result = db.execute(select(Location.id, Location.code, Location.name, Location.is_active))
        return [{"id": loc.id, "code": loc.code, "name": loc.name, "is_active": loc.is_active} for loc in result]