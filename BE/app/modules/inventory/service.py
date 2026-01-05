from fastapi import  HTTPException, APIRouter
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import datetime
from app.modules.inventory.models import (
     Area,
     Location,
     Inventory,
     WarehouseImportRequirement,
     InternalWarehouseTransferRequest,
     OutboundShipmentRequestOnOrder,
     WarehouseImportContainer,
     ImportPalletInfo,
     ContainerInventory,
     ProductsInIWTR,
     InventoriesInIWTR,
     ProductsInOSR,
     InventoriesInOSR,
     WarehouseNoteInfoApproval
)
from app.core.exceptions import NotFoundException, HTTPException


class InventoryService:

    @staticmethod
    async def get_inventories(db: AsyncSession) -> List[Inventory]:
        result = await db.execute(select(Inventory))
        return result.scalars().all()

    @staticmethod
    async def get_inventory_by_id(db: AsyncSession, inventory_id: int) -> Inventory:
        result = await db.execute(select(Inventory).where(Inventory.id == inventory_id))
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
    async def get_inventory_by_identifier_async(db: AsyncSession, identifier: str) -> Inventory:
        result = await db.execute(select(Inventory).where(Inventory.identifier == identifier))
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
    async def bulk_create_inventories_async(db: AsyncSession, inventories_data: List[dict]) -> List[Inventory]:
        """Bulk create inventories from list of data dictionaries (async version)"""
        async with db.begin():
            inventories = [Inventory(**data) for data in inventories_data]
            db.add_all(inventories)
            await db.flush()
            for inventory in inventories:
                await db.refresh(inventory)
            return inventories

    @staticmethod
    def delete_inventory(db: Session, inventory_id: int) -> bool:
        with db.begin():
            inventory = InventoryService.get_inventory_by_id(db, inventory_id)
            db.delete(inventory)
            db.commit()
            return True

    @staticmethod
    async def get_inventory_dashboard(
        db: AsyncSession,
        page: int = 1,
        size: int = 20,
        name: Optional[str] = None,
        client_id: Optional[str] = None,
        serial_pallet: Optional[str] = None,
        identifier: Optional[str] = None,
        po: Optional[str] = None,
        location_id: Optional[int] = None,
        area_id: Optional[int] = None,
        status: Optional[str] = None,
        updated_by: Optional[str] = None
    ) -> dict:
        """Get inventory dashboard with pagination and filters"""
        from sqlalchemy import and_, or_, func, text
        from sqlalchemy.orm import joinedload

        # Base query with joins
        query = select(
            Inventory.id,
            Inventory.name,
            WarehouseImportRequirement.client_id,
            Inventory.serial_pallet,
            Inventory.identifier,
            Inventory.po,
            Inventory.available_quantity,
            Inventory.initial_quantity,
            Inventory.location_id,
            Area.code.label("area_code"),
            Area.name.label("area_name"),
            Inventory.calculated_status.label("status"),
            Inventory.updated_by,
            Inventory.received_date,
            Inventory.updated_date
        ).select_from(
            Inventory
        ).join(
            Location, Inventory.location_id == Location.id
        ).join(
            Area, Location.area_id == Area.id
        ).outerjoin(
            ContainerInventory, ContainerInventory.inventory_identifier == Inventory.identifier
        ).outerjoin(
            WarehouseImportContainer, WarehouseImportContainer.id == ContainerInventory.import_container_id
        ).outerjoin(
            WarehouseImportRequirement, WarehouseImportRequirement.id == WarehouseImportContainer.warehouse_import_requirement_id
        )

        # Apply filters
        filters = []

        if name:
            filters.append(Inventory.name.ilike(f"%{name}%"))
        if client_id:
            filters.append(WarehouseImportRequirement.client_id == client_id)
        if serial_pallet:
            filters.append(Inventory.serial_pallet.ilike(f"%{serial_pallet}%"))
        if identifier:
            filters.append(Inventory.identifier.ilike(f"%{identifier}%"))
        if po:
            filters.append(Inventory.po.ilike(f"%{po}%"))
        if location_id:
            filters.append(Inventory.location_id == location_id)
        if area_id:
            filters.append(Area.id == area_id)
        if status:
            if status.lower() == "available":
                filters.append(Inventory.available_quantity > 0)
            elif status.lower() == "unavailable":
                filters.append(Inventory.available_quantity == 0)
            else:
                filters.append(Inventory.calculated_status.ilike(f"%{status}%"))
        if updated_by:
            filters.append(Inventory.updated_by.ilike(f"%{updated_by}%"))

        if filters:
            query = query.where(and_(*filters))

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await db.execute(count_query)
        total_items = count_result.scalar() or 0

        # Apply pagination
        query = query.order_by(Inventory.updated_date.desc())
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        # Execute query
        result = await db.execute(query)
        rows = result.all()

        # Convert to dict format
        data = []
        for row in rows:
            data.append({
                "id": row.id,
                "name": row.name,
                "client_id": row.client_id,
                "serial_pallet": row.serial_pallet,
                "identifier": row.identifier,
                "po": row.po,
                "available_quantity": row.available_quantity,
                "initial_quantity": row.initial_quantity,
                "location_id": row.location_id,
                "area_code": row.area_code,
                "area_name": row.area_name,
                "status": "available" if row.available_quantity > 0 else "unavailable",
                "updated_by": row.updated_by,
                "received_date": row.received_date.isoformat() if row.received_date else None,
                "updated_date": row.updated_date.isoformat() if row.updated_date else None
            })

        total_pages = (total_items + size - 1) // size if total_items > 0 else 1

        return {
            "data": data,
            "meta": {
                "page": page,
                "size": size,
                "total_items": total_items,
                "total_pages": total_pages
            }
        }

    @staticmethod
    async def get_inventory_dashboard_grouped(
        db: AsyncSession,
        group_by: str = None,
        page: int = 1,
        size: int = 20,
        name: Optional[str] = None,
        client_id: Optional[int] = None,
        serial_pallet: Optional[str] = None,
        identifier: Optional[str] = None,
        po: Optional[str] = None,
        location_id: Optional[int] = None,
        area_id: Optional[int] = None,
        status: Optional[str] = None,
        updated_by: Optional[str] = None
    ) -> dict:
        from sqlalchemy import and_, or_, func, text, distinct

        base_query = select(
            Inventory.id,
            Inventory.name,
            WarehouseImportRequirement.po_number.label("po_number"),
            WarehouseImportRequirement.client_id,
            Inventory.serial_pallet,
            Inventory.identifier,
            Inventory.po,
            Inventory.available_quantity,
            Inventory.initial_quantity,
            Inventory.location_id,
            Area.code.label("area_code"),
            Area.name.label("area_name"),
            Inventory.calculated_status.label("status"),
            Inventory.updated_by,
            Inventory.received_date,
            Inventory.updated_date
        ).select_from(
            Inventory
        ).join(
            Location, Inventory.location_id == Location.id
        ).join(
            Area, Location.area_id == Area.id
        ).outerjoin(
            ContainerInventory, ContainerInventory.inventory_identifier == Inventory.identifier
        ).outerjoin(
            WarehouseImportContainer, WarehouseImportContainer.id == ContainerInventory.import_container_id
        ).outerjoin(
            WarehouseImportRequirement, WarehouseImportRequirement.id == WarehouseImportContainer.warehouse_import_requirement_id
        )

        # Apply filters
        filters = []

        if name:
            filters.append(Inventory.name.ilike(f"%{name}%"))
        if client_id:
            filters.append(WarehouseImportRequirement.client_id == client_id)
        if serial_pallet:
            filters.append(Inventory.serial_pallet.ilike(f"%{serial_pallet}%"))
        if identifier:
            filters.append(Inventory.identifier.ilike(f"%{identifier}%"))
        if po:
            filters.append(Inventory.po.ilike(f"%{po}%"))
        if location_id:
            filters.append(Inventory.location_id == location_id)
        if area_id:
            filters.append(Area.id == area_id)
        if status:
            if status.lower() == "available":
                filters.append(Inventory.available_quantity > 0)
            elif status.lower() == "unavailable":
                filters.append(Inventory.available_quantity == 0)
            else:
                filters.append(Inventory.calculated_status.ilike(f"%{status}%"))
        if updated_by:
            filters.append(Inventory.updated_by.ilike(f"%{updated_by}%"))

        if filters:
            base_query = base_query.where(and_(*filters))

        if group_by == "area":
            group_column = Area.code
            group_name_column = Area.name
            group_key = "area_code"
        elif group_by == "po":
            group_column = Inventory.po
            group_name_column = Inventory.po
            group_key = "po"
        elif group_by == "client":
            group_column = WarehouseImportRequirement.client_id
            group_name_column = WarehouseImportRequirement.client_id
            group_key = "client_id"
        elif group_by == "sap_code":
            group_column = Inventory.sap_code
            group_name_column = Inventory.name  # Use name as display name for sap_code groups
            group_key = "sap_code"
        else:
            # Default to area
            group_column = Area.code
            group_name_column = Area.name
            group_key = "area_code"

        base_subquery = base_query.subquery()
            
        # Khai báo các cột thống kê mới
        total_clients = func.count(distinct(base_subquery.c.client_id)).label("total_clients")
        total_pos = func.count(distinct(base_subquery.c.po)).label("total_pos")
        total_locations = func.count(distinct(base_subquery.c.location_id)).label("total_locations")
        total_pallets = func.count(distinct(base_subquery.c.serial_pallet)).label("total_pallets")
        total_containers = func.count(distinct(base_subquery.c.identifier)).label("total_containers") # coi identifier là thùng/mã duy nhất
        
        # Lấy thông tin ngày cập nhật/nhập mới nhất/lớn nhất trong nhóm
        last_updated = func.max(base_subquery.c.updated_date).label("last_updated")
        last_received = func.max(base_subquery.c.received_date).label("last_received")

        grouped_query = select(
                group_column.label("group_value"),
                func.sum(base_subquery.c.available_quantity).label("total_available_quantity"),
                func.sum(base_subquery.c.initial_quantity).label("total_initial_quantity"),
                func.count(base_subquery.c.id).label("item_count"), # Số dòng tồn kho chi tiết
                
                # Thống kê mới
                total_clients,
                total_pos,
                total_locations,
                total_pallets,
                total_containers,
                last_updated,
                last_received,
                
            ).select_from(
                base_subquery
            ).group_by(
                group_column
            ).having(
                func.sum(base_subquery.c.available_quantity) > 0 # Chỉ lấy nhóm có tồn kho > 0
            )

        count_query = select(func.count()).select_from(grouped_query.subquery())
        count_result = await db.execute(count_query)
        total_items = count_result.scalar() or 0

        grouped_query = grouped_query.order_by(func.sum(base_subquery.c.available_quantity).desc())

        result = await db.execute(grouped_query)
        rows = result.all()

        data = []
        for row in rows:
            data.append({
                "group_key": group_key,
                "group_value": str(row.group_value) if row.group_value is not None else "Unknown",
                "total_available_quantity": row.total_available_quantity or 0,
                "total_initial_quantity": row.total_initial_quantity or 0,
                "item_count": row.item_count or 0,
                
                # Thêm các trường thống kê mới
                "total_clients": row.total_clients or 0, # Tổng k.hàng (mã khách hàng duy nhất)
                "total_pos": row.total_pos or 0, # Số PO (PO duy nhất)
                "total_pallets": row.total_pallets or 0, # Số pallet (serial_pallet duy nhất)
                "total_containers": row.total_containers or 0, # Số thùng (identifier duy nhất)
                "total_locations": row.total_locations or 0, # Số vị trí (location_id duy nhất)
                "last_updated": row.last_updated.isoformat() if row.last_updated else None, # Ngày cập nhật
                "last_received": row.last_received.isoformat() if row.last_received else None, # Ngày nhập gần nhất
            })

        total_pages = (total_items + size - 1) // size if total_items > 0 else 1

        return {
            "data": data,
            "meta": {
                "page": page,
                "size": size,
                "total_items": total_items,
                "total_pages": total_pages
            }
        }
    @staticmethod
    async def get_inventories_paginated(
        db: AsyncSession,
        page: int = 1,
        size: int = 20,
        name: Optional[str] = None,
        identifier: Optional[str] = None,
        sap_code: Optional[str] = None,
        po: Optional[str] = None,
        lot: Optional[str] = None,
        vendor: Optional[str] = None,
        location_id: Optional[int] = None,
        available_quantity_gt: Optional[int] = None,
        available_quantity_lt: Optional[int] = None
    ) -> dict:
        """Get inventories with pagination and filtering"""
        from sqlalchemy import and_, or_, func

        query = select(Inventory)

        # Apply filters
        filters = []
        if name:
            filters.append(Inventory.name.ilike(f"%{name}%"))
        if identifier:
            filters.append(Inventory.identifier.ilike(f"%{identifier}%"))
        if sap_code:
            filters.append(Inventory.sap_code.ilike(f"%{sap_code}%"))
        if po:
            filters.append(Inventory.po.ilike(f"%{po}%"))
        if lot:
            filters.append(Inventory.lot.ilike(f"%{lot}%"))
        if vendor:
            filters.append(Inventory.vendor.ilike(f"%{vendor}%"))
        if location_id:
            filters.append(Inventory.location_id == location_id)
        if available_quantity_gt is not None:
            filters.append(Inventory.available_quantity > available_quantity_gt)
        if available_quantity_lt is not None:
            filters.append(Inventory.available_quantity < available_quantity_lt)

        if filters:
            query = query.where(and_(*filters))

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await db.execute(count_query)
        total_items = count_result.scalar() or 0

        # Apply pagination
        query = query.order_by(Inventory.updated_date.desc())
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        # Execute query
        result = await db.execute(query)
        inventories = result.scalars().all()

        # Convert to dict format
        data = []
        for inv in inventories:
            data.append({
                "id": inv.id,
                "identifier": inv.identifier,
                "serial_pallet": inv.serial_pallet,
                "location_id": inv.location_id,
                "parent_location_id": inv.parent_location_id,
                "last_location_id": inv.last_location_id,
                "parent_inventory_id": inv.parent_inventory_id,
                "expiration_date": inv.expiration_date.isoformat() if inv.expiration_date else None,
                "received_date": inv.received_date.isoformat() if inv.received_date else None,
                "updated_date": inv.updated_date.isoformat() if inv.updated_date else None,
                "updated_by": inv.updated_by,
                "calculated_status": inv.calculated_status,
                "manufacturing_date": inv.manufacturing_date.isoformat() if inv.manufacturing_date else None,
                "initial_quantity": inv.initial_quantity,
                "available_quantity": inv.available_quantity,
                "quantity": inv.quantity,
                "name": inv.name,
                "sap_code": inv.sap_code,
                "po": inv.po,
                "lot": inv.lot,
                "vendor": inv.vendor,
                "msd_level": inv.msd_level,
                "comments": inv.comments
            })

        total_pages = (total_items + size - 1) // size if total_items > 0 else 1

        return {
            "data": data,
            "meta": {
                "page": page,
                "size": size,
                "total_items": total_items,
                "total_pages": total_pages
            }
        }

    @staticmethod
    async def get_inventories_by_scan_pallets(db: AsyncSession, serial_pallet: str) -> List[dict]:
        from sqlalchemy import select

        result = await db.execute(
            select(Inventory).where(
                Inventory.serial_pallet == serial_pallet
            )
        )
        inventories = result.scalars().all()
        if not inventories:
            raise NotFoundException("Không tìm thấy thông tin của hàng hóa trong pallet trên hệ thống")

        return [
            {
                "id": inv.id,
                "identifier": inv.identifier,
                "serial_pallet": inv.serial_pallet,
                "location_id": inv.location_id,
                "parent_location_id": inv.parent_location_id,
                "last_location_id": inv.last_location_id,
                "parent_inventory_id": inv.parent_inventory_id,
                "expiration_date": inv.expiration_date.isoformat() if inv.expiration_date else None,
                "received_date": inv.received_date.isoformat() if inv.received_date else None,
                "updated_date": inv.updated_date.isoformat() if inv.updated_date else None,
                "updated_by": inv.updated_by,
                "calculated_status": inv.calculated_status,
                "manufacturing_date": inv.manufacturing_date.isoformat() if inv.manufacturing_date else None,
                "initial_quantity": inv.initial_quantity,
                "available_quantity": inv.available_quantity,
                "quantity": inv.quantity,
                "name": inv.name,
                "sap_code": inv.sap_code,
                "po": inv.po,
                "lot": inv.lot,
                "vendor": inv.vendor,
                "msd_level": inv.msd_level,
                "comments": inv.comments,
            }
            for inv in inventories
        ]

class AreaService:

    @staticmethod
    async def get_areas(db: AsyncSession) -> List[dict]:
        result = await db.execute(select(Area.id, Area.code, Area.name, Area.thu_kho, Area.description, Area.address, Area.is_active))
        rows = result.all()
        return [{"id": area.id, "code": area.code, "name": area.name, "thu_kho": area.thu_kho, "description": area.description, "address": area.address, "is_active": area.is_active} for area in rows]

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
        if is_active:
            filters.append(Area.is_activeilike(f"%{is_active}%"))
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

    @staticmethod
    async def update_area(db: AsyncSession, area_id: int, area_data: dict) -> Area:
        async with db.begin():
            area = await AreaService.get_area_by_id(db, area_id)
            for key, value in area_data.items():
                if value is not None:
                    setattr(area, key, value)
            await db.flush()
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
    async def get_locations(db: AsyncSession) -> List[Location]:
        result = await db.execute(select(Location))
        return result.scalars().all()

    @staticmethod
    def get_location_by_id(db: Session, location_id: int) -> Location:
        result = db.execute(select(Location).where(Location.id == location_id))
        location = result.scalar_one_or_none()
        if not location:
            raise NotFoundException("Location", str(location_id))
        return location

    @staticmethod
    async def get_location_by_id_async(db: AsyncSession, location_id: int) -> Location:
        result = await db.execute(select(Location).where(Location.id == location_id))
        location = result.scalar_one_or_none()
        if not location:
            raise NotFoundException("Location", str(location_id))
        return location

    @staticmethod
    async def get_minimal_locations(db: AsyncSession) -> List[dict]:
        result = await db.execute(select(Location.id, Location.code, Location.name))
        return [{"id": loc.id, "code": loc.code} for loc in result]

    @staticmethod
    def create_location(db: Session, location_data: dict) -> Location:
        # Validate that area_id exists if provided
        area_id = location_data.get('area_id')
        if area_id is not None:
            try:
                AreaService.get_area_by_id(db, area_id)
            except NotFoundException:
                raise HTTPException(
                    status_code=400,
                    detail=f"Area with ID {area_id} does not exist"
                )
        
        location = Location(**location_data)
        db.add(location)
        db.commit()
        db.refresh(location)
        return location

    @staticmethod
    async def create_location_async(db: AsyncSession, location_data: dict) -> Location:
        """Create new location (async version)"""
        try:
            async with db.begin():
                # Validate that area_id exists if provided
                area_id = location_data.get('area_id')
                if area_id is not None:
                    try:
                        await AreaService.get_area_by_id(db, area_id)
                    except NotFoundException:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Area with ID {area_id} does not exist"
                        )
                
                location = Location(**location_data)
                db.add(location)
                await db.flush()
                await db.refresh(location)
                return location
        except Exception as e:
            # Ensure we always provide a meaningful error message
            if isinstance(e, HTTPException):
                raise
            else:
                error_msg = str(e) if str(e).strip() else f"Database error while creating location"
                raise HTTPException(status_code=400, detail=error_msg)

    @staticmethod
    async def update_location(db: AsyncSession, location_id: int, location_data: dict) -> Location:
        async with db.begin():
            result = await db.execute(select(Location).where(Location.id == location_id))
            location = result.scalar_one_or_none()
            if not location:
                raise NotFoundException("Location", str(location_id))
            
            for key, value in location_data.items():
                setattr(location, key, value)
            
            await db.flush()
            await db.refresh(location)
            return location

    @staticmethod
    def update_location_status(db: Session, location_id: int, is_active: bool) -> Location:
        location = LocationService.get_location_by_id(db, location_id)
        location.is_active = is_active
        db.commit()
        db.refresh(location)
        return location

    @staticmethod
    async def update_location_status_async(db: AsyncSession, location_id: int, is_active: bool) -> Location:
        location = await LocationService.get_location_by_id_async(db, location_id)
        location.is_active = is_active
        await db.commit()
        await db.refresh(location)
        return location

    
    @staticmethod
    async def clear_sub_locations(db: AsyncSession, location_id: int) -> int:
        async with db.begin():
            # Validate that the location is a parent location (parent_location_id is None)
            parent_result = await db.execute(
                select(Location).where(Location.id == location_id)
            )
            parent_location = parent_result.scalar_one_or_none()
            if not parent_location:
                raise NotFoundException("Location", str(location_id))
            if parent_location.parent_location_id is not None:
                raise HTTPException(status_code=400, detail="Location must be a parent location (parent_location_id must be null)")

            # Find all sub-locations
            result = await db.execute(
                select(Location).where(Location.parent_location_id == location_id)
            )
            sub_locations = result.scalars().all()

            deleted_count = len(sub_locations)

            # Delete all sub-locations
            for sub_loc in sub_locations:
                await db.delete(sub_loc)

            await db.commit()
            return deleted_count

    @staticmethod
    def bulk_create_locations(db: Session, locations_data: List[dict]) -> List[Location]:
        locations = [Location(**data) for data in locations_data]
        db.add_all(locations)
        db.commit()
        for location in locations:
            db.refresh(location)
        return locations

    @staticmethod
    async def get_locations_paginated(
        db: AsyncSession,
        page: int = 1,
        size: int = 20,
        code: Optional[str] = None,
        name: Optional[str] = None,
        area_id: Optional[int] = None,
        address: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None,
        parent_location_id: Optional[int] = None
    ) -> dict:

        from sqlalchemy import and_

        query = select(Location)

        # Filter by parent location - if not specified, get only parent locations (parent_location_id is null)
        if parent_location_id is not None:
            query = query.where(Location.parent_location_id == parent_location_id)
        else:
            query = query.where(Location.parent_location_id == None)

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
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await db.execute(count_query)
        total_items = count_result.scalar() or 0

        query = query.order_by(Location.updated_date.desc())
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        result = await db.execute(query)
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
    async def create_warehouse_import_with_details(db: AsyncSession, import_data: dict) -> dict:
        """Create warehouse import requirement with details"""
        from app.modules.inventory.models import WarehouseImportContainer
        from datetime import datetime
        import json
        
        async with db.begin():
            # Step 1: Create the main import requirement
            general_info = import_data.get('general_info', {})
            details = import_data.get('detail', [])
            
            # Parse import date with better error handling
            import_date_str = general_info.get('ngay_nhap')
            if import_date_str:
                try:
                    # Handle different date formats
                    if import_date_str.endswith('Z'):
                        import_date_str = import_date_str[:-1] + '+00:00'
                    import_date = datetime.fromisoformat(import_date_str)
                except ValueError:
                    import_date = datetime.now()
            else:
                import_date = datetime.now()
            
            # Map the general_info to database columns
            warehouse_import_data = {
                'po_number': general_info.get('po_number'),
                'client_id': general_info.get('client_id'),
                'inventory_code': general_info.get('inventory_code'),
                'inventory_name': general_info.get('inventory_name'),
                'wo_code': general_info.get('wo_code'),
                'lot_number': general_info.get('lot_number'),
                'production_date': general_info.get('production_date'),
                'branch': general_info.get('branch'),
                'production_team': general_info.get('production_team'),
                'production_decision_number': general_info.get('production_decision_number'),
                'item_no_sku': general_info.get('item_no_sku'),
                'status': False,
                'approver': general_info.get('approver'),
                'note': general_info.get('note'),
                'destination_warehouse': general_info.get('destination_warehouse'),
                'pallet_note_creation_session_id': general_info.get('pallet_note_creation_session_id'),
                'created_by': str(general_info.get('create_by', '')),
                'updated_by': str(general_info.get('create_by', ''))
            }
            
            warehouse_import = WarehouseImportRequirement(**warehouse_import_data)
            db.add(warehouse_import)
            await db.flush()  # Get the ID
            await db.refresh(warehouse_import)
            
            # Step 2: Create the detail containers
            containers = []
            for detail in details:
                container = WarehouseImportContainer(
                    warehouse_import_requirement_id=warehouse_import.id,
                    serial_pallet=detail.get('serial_pallet'),
                    box_code=detail.get('box_code'),
                    box_quantity=detail.get('quantity'),
                    list_serial_items=detail.get('list_serial_items'),
                    updated_by=str(general_info.get('create_by', ''))
                )
                db.add(container)
                containers.append(container)
            
            await db.flush()
            
            # Refresh all containers to get their IDs
            for container in containers:
                await db.refresh(container)
            
            return {
                'import_requirement': warehouse_import,
                'containers': containers
            }

    @staticmethod
    async def get_import_requirements(db: AsyncSession) -> List[dict]:
        result = await db.execute(select(WarehouseImportRequirement))
        requirements = result.scalars().all()
        return [
            {
                "id": req.id,
                "po_number": req.po_number,
                "client_id": req.client_id,
                "inventory_code": req.inventory_code,
                "inventory_name": req.inventory_name,
                "number_of_pallet": req.number_of_pallet,
                "number_of_box": req.number_of_box,
                "box_scan_progress": req.box_scan_progress,
                "quantity": req.quantity,
                "wo_code": req.wo_code,
                "lot_number": req.lot_number,
                "production_date": req.production_date,
                "branch": req.branch,
                "production_team": req.production_team,
                "production_decision_number": req.production_decision_number,
                "item_no_sku": req.item_no_sku,
                "status": req.status,
                "approver": req.approver,
                "note": req.note,
                "destination_warehouse": req.destination_warehouse,
                "pallet_note_creation_session_id": req.pallet_note_creation_session_id,
                "created_by": req.created_by,
                "updated_by": req.updated_by,
                "updated_date": req.updated_date,
                "deleted_at": req.deleted_at,
                "deleted_by": req.deleted_by,
            }
            for req in requirements
        ]

    @staticmethod
    async def search_warehouse_import_requirement_by_query(db: AsyncSession, search_query: str) -> dict:

        from sqlalchemy import select
        
        if not search_query:
            raise HTTPException(status_code=400)
        
        warehouse_import_requirements = []

        if search_query.startswith('B'):

            result = await db.execute(
                select(ContainerInventory).where(
                    ContainerInventory.inventory_identifier == search_query
                )
            )
            container_inventories = result.scalars().all()
            
            if not container_inventories:
                raise HTTPException(status_code=404, detail=f"No container inventory found with inventory_identifier: {search_query}")

            for container_inventory in container_inventories:
                result = await db.execute(
                    select(ImportPalletInfo).where(
                        ImportPalletInfo.id == container_inventory.import_pallet_id
                    )
                )
                import_pallet = result.scalar_one_or_none()
                
                if import_pallet:
                    result = await db.execute(
                        select(WarehouseImportRequirement).where(
                            WarehouseImportRequirement.id == import_pallet.warehouse_import_requirement_id
                        )
                    )
                    warehouse_import_req = result.scalar_one_or_none()
                    
                    if warehouse_import_req:
                        warehouse_import_requirements.append({
                            "id": warehouse_import_req.id,
                            "po_number": warehouse_import_req.po_number,
                            "client_id": warehouse_import_req.client_id,
                            "inventory_code": warehouse_import_req.inventory_code,
                            "inventory_name": warehouse_import_req.inventory_name,
                            "number_of_pallet": warehouse_import_req.number_of_pallet,
                            "number_of_box": warehouse_import_req.number_of_box,
                            "box_scan_progress": warehouse_import_req.box_scan_progress,
                            "quantity": warehouse_import_req.quantity,
                            "wo_code": warehouse_import_req.wo_code,
                            "lot_number": warehouse_import_req.lot_number,
                            "production_date": warehouse_import_req.production_date,
                            "branch": warehouse_import_req.branch,
                            "production_team": warehouse_import_req.production_team,
                            "production_decision_number": warehouse_import_req.production_decision_number,
                            "item_no_sku": warehouse_import_req.item_no_sku,
                            "status": warehouse_import_req.status,
                            "approver": warehouse_import_req.approver,
                            "note": warehouse_import_req.note,
                            "destination_warehouse": warehouse_import_req.destination_warehouse,
                            "pallet_note_creation_session_id": warehouse_import_req.pallet_note_creation_session_id,
                            "created_by": warehouse_import_req.created_by,
                            "updated_by": warehouse_import_req.updated_by,
                            "updated_date": warehouse_import_req.updated_date,
                            "deleted_at": warehouse_import_req.deleted_at,
                            "deleted_by": warehouse_import_req.deleted_by,
                        })
        
        elif search_query.startswith('P'):
            result = await db.execute(
                select(ImportPalletInfo).where(
                    ImportPalletInfo.serial_pallet == search_query
                )
            )
            import_pallets = result.scalars().all()
            
            if not import_pallets:
                raise HTTPException(status_code=404, detail=f"No import pallet found with serial_pallet: {search_query}")
            
            for import_pallet in import_pallets:
                result = await db.execute(
                    select(WarehouseImportRequirement).where(
                        WarehouseImportRequirement.id == import_pallet.warehouse_import_requirement_id
                    )
                )
                warehouse_import_req = result.scalar_one_or_none()
                
                if warehouse_import_req:
                    warehouse_import_requirements.append({
                        "id": warehouse_import_req.id,
                        "po_number": warehouse_import_req.po_number,
                        "client_id": warehouse_import_req.client_id,
                        "inventory_code": warehouse_import_req.inventory_code,
                        "inventory_name": warehouse_import_req.inventory_name,
                        "number_of_pallet": warehouse_import_req.number_of_pallet,
                        "number_of_box": warehouse_import_req.number_of_box,
                        "box_scan_progress": warehouse_import_req.box_scan_progress,
                        "quantity": warehouse_import_req.quantity,
                        "wo_code": warehouse_import_req.wo_code,
                        "lot_number": warehouse_import_req.lot_number,
                        "production_date": warehouse_import_req.production_date,
                        "branch": warehouse_import_req.branch,
                        "production_team": warehouse_import_req.production_team,
                        "production_decision_number": warehouse_import_req.production_decision_number,
                        "item_no_sku": warehouse_import_req.item_no_sku,
                        "status": warehouse_import_req.status,
                        "approver": warehouse_import_req.approver,
                        "note": warehouse_import_req.note,
                        "destination_warehouse": warehouse_import_req.destination_warehouse,
                        "pallet_note_creation_session_id": warehouse_import_req.pallet_note_creation_session_id,
                        "created_by": warehouse_import_req.created_by,
                        "updated_by": warehouse_import_req.updated_by,
                        "updated_date": warehouse_import_req.updated_date,
                        "deleted_at": warehouse_import_req.deleted_at,
                        "deleted_by": warehouse_import_req.deleted_by,
                    })
        else:
            raise HTTPException(status_code=400, detail="Mã thùng phải bắt đầu bằng 'B', mã pallet bắt đầu bằng 'P'")
        
        if not warehouse_import_requirements:
            raise HTTPException(status_code=404, detail=f"Mã thùng/pallet chưa được tạo đơn nhập kho: {search_query}")
        
        return {
            "warehouse_import_requirements": warehouse_import_requirements,
            "count": len(warehouse_import_requirements)
        }

    @staticmethod
    async def get_import_requirement_by_id(db: AsyncSession, req_id: int) -> WarehouseImportRequirement:
        result = await db.execute(select(WarehouseImportRequirement).where(WarehouseImportRequirement.id == req_id))
        req = result.scalar_one_or_none()
        if not req:
            raise NotFoundException("ImportRequirement", str(req_id))
        return req

    @staticmethod
    async def get_wms_import_requirement_by_id(db: AsyncSession, req_id: int) -> dict:
        req = await WarehouseImportService.get_import_requirement_by_id(db, req_id)

        from app.modules.inventory.models import ImportPalletInfo, ContainerInventory
        pallets_result = await db.execute(
            select(ImportPalletInfo).where(ImportPalletInfo.warehouse_import_requirement_id == req_id)
        )
        pallets = pallets_result.scalars().all()

        list_pallet = []
        for pallet in pallets:
            boxes_result = await db.execute(
                select(ContainerInventory).where(ContainerInventory.import_pallet_id == pallet.id)
            )
            boxes = boxes_result.scalars().all()

            list_box = [
                {
                    "id": box.id,
                    "box_code": box.inventory_identifier,
                    "quantity": box.quantity_imported,
                    "note": box.comments,
                    "import_pallet_id": box.import_pallet_id,
                    "confirmed": box.confirmed,
                    "scan_by": box.scan_by,
                    "time_checked": box.time_checked,
                    "list_serial_items": box.list_serial_items,
                    "location_id": box.location_id,
                    "name": box.name,
                    "serial_pallet": box.serial_pallet,
                    "sap_code": box.sap_code,
                    "lot": box.lot,
                    "po": box.po
                }
                for box in boxes
            ]

            pallet_info = {
                "id": pallet.id,
                "serial_pallet": pallet.serial_pallet,
                "quantity_per_box": pallet.quantity_per_box,
                "num_box_per_pallet": pallet.num_box_per_pallet,
                "total_quantity": pallet.total_quantity,
                "po_number": pallet.po_number,
                "customer_name": pallet.customer_name,
                "production_decision_number": pallet.qdsx_no,
                "item_no_sku": pallet.item_no_sku,
                "date_code": pallet.date_code,
                "production_date": pallet.production_date,
                "note": pallet.note,
                "scan_status": pallet.scan_status,
                "confirmed": pallet.confirmed,
                "location_id": pallet.location_id,
                "list_box": list_box
            }
            list_pallet.append(pallet_info)

        # Construct general_info
        general_info = {
            "id": req.id,
            "client_id": req.client_id,
            "inventory_code": req.inventory_code,
            "inventory_name": req.inventory_name,
            "wo_code": req.wo_code,
            "lot_number": req.lot_number,
            "note": req.note,
            "created_by": req.created_by,
            "branch": req.branch,
            "production_team": req.production_team,
            "number_of_pallet": req.number_of_pallet,
            "number_of_box": req.number_of_box,
            "quantity": req.quantity,
            "destination_warehouse": req.destination_warehouse,
            "pallet_note_creation_id": req.pallet_note_creation_session_id,
            "list_pallet": list_pallet
        }

        return {
            "general_info": general_info
        }

    @staticmethod
    def create_import_requirement_from_sap(db: Session, sap_data: dict) -> WarehouseImportRequirement:
        with db.begin():
            req = WarehouseImportRequirement(**sap_data)
            db.add(req)
            db.commit()
            db.refresh(req)
            return req

    @staticmethod
    def _convert_to_boolean(value) -> bool:
        """Convert various types to boolean, handling string representations properly"""
        if isinstance(value, bool):
            return value
        elif isinstance(value, str):
            # Handle string representations of boolean values
            if value.lower() in ('true', '1', 'yes', 'on'):
                return True
            elif value.lower() in ('false', '0', 'no', 'off', ''):
                return False
            else:
                # For any other non-empty string, treat as truthy
                return bool(value)
        else:
            # For numbers, None, and other types
            return bool(value)

    @staticmethod
    async def update_import_requirement_status(db: AsyncSession, req_id: int, status: str, updated_by: Optional[str] = None) -> WarehouseImportRequirement:
        req = await WarehouseImportService.get_import_requirement_by_id(db, req_id)
        req.status = WarehouseImportService._convert_to_boolean(status)
        if updated_by:
            req.updated_by = updated_by
        await db.commit()
        await db.refresh(req)
        return req

    @staticmethod
    async def update_import_requirement(db: AsyncSession, req_id: int, update_data: dict) -> WarehouseImportRequirement:
        async with db.begin():
            req = await WarehouseImportService.get_import_requirement_by_id(db, req_id)
            
            # Only update fields that are provided in the request
            if 'po_number' in update_data:
                req.po_number = update_data.get('po_number')
            if 'client_id' in update_data:
                req.client_id = update_data.get('client_id')
            if 'inventory_code' in update_data:
                req.inventory_code = update_data.get('inventory_code')
            if 'inventory_name' in update_data:
                req.inventory_name = update_data.get('inventory_name')
            if 'number_of_pallet' in update_data:
                req.number_of_pallet = update_data.get('number_of_pallet')
            if 'number_of_box' in update_data:
                req.number_of_box = update_data.get('number_of_box')
            if 'quantity' in update_data:
                req.quantity = update_data.get('quantity')
            if 'box_scan_progress' in update_data:
                req.box_scan_progress = update_data.get('box_scan_progress')
            if 'wo_code' in update_data:
                req.wo_code = update_data.get('wo_code')
            if 'lot_number' in update_data:
                req.lot_number = update_data.get('lot_number')
            if 'production_date' in update_data:
                req.production_date = update_data.get('production_date')
            if 'branch' in update_data:
                req.branch = update_data.get('branch')
            if 'production_team' in update_data:
                req.production_team = update_data.get('production_team')
            if 'production_decision_number' in update_data:
                req.production_decision_number = update_data.get('production_decision_number')
            if 'item_no_sku' in update_data:
                req.item_no_sku = update_data.get('item_no_sku')
            if 'status' in update_data:
                req.status = update_data.get('status')
            if 'approver' in update_data:
                req.approver = update_data.get('approver')
            if 'is_check_all' in update_data:
                req.is_check_all = update_data.get('is_check_all')
            if 'note' in update_data:
                req.note = update_data.get('note')
            if 'destination_warehouse' in update_data:
                req.destination_warehouse = update_data.get('destination_warehouse')
            if 'pallet_note_creation_session_id' in update_data:
                req.pallet_note_creation_session_id = update_data.get('pallet_note_creation_session_id')
            if 'inventory_code' in update_data:
                req.inventory_code = update_data.get('inventory_code')
            if 'created_by' in update_data:
                req.created_by = update_data.get('created_by')
            if 'deleted_at' in update_data:
                req.deleted_at = update_data.get('deleted_at')
            if 'deleted_by' in update_data:
                req.deleted_by = update_data.get('deleted_by')
            if 'updated_by' in update_data:
                req.updated_by = update_data.get('updated_by')
            
            # Update the updated_date to current time
            req.updated_date = func.now()
            
            await db.flush()
            await db.refresh(req)
            return req

    @staticmethod
    async def confirm_import_requirement_location(db: AsyncSession, req_id: int, location_id: int) -> WarehouseImportRequirement:
        req = await WarehouseImportService.get_import_requirement_by_id(db, req_id)
        # Logic to confirm location
        req.status = True
        await db.commit()
        await db.refresh(req)
        return req

    @staticmethod
    async def scan_inventories(db: AsyncSession, scan_data: List[dict]) -> List[dict]:
        return scan_data

    @staticmethod
    async def scan_pallets(db: AsyncSession, warehouse_import_requirement_id: int, serial_pallet: str) -> List[dict]:
        from sqlalchemy import select


        result = await db.execute(
            select(WarehouseImportContainer).where(
                WarehouseImportContainer.warehouse_import_requirement_id == warehouse_import_requirement_id,
                WarehouseImportContainer.serial_pallet == serial_pallet
            )
        )
        if not result:
            raise NotFoundException("Mã pallet không tồn tại trong yêu cầu nhập kho")
        
        container_inventories_import = result.scalars().all()
        return [
            {
                "id": ci.id,
                "warehouse_import_requirement_id": ci.warehouse_import_requirement_id,
                "serial_pallet": ci.serial_pallet,
                "box_code": ci.box_code,
                "box_quantity": ci.box_quantity,
            }
            for ci in container_inventories_import
        ]
    


    @staticmethod
    async def update_container_inventory_by_identifier(
        db: AsyncSession,
        updates: List[dict]
    ) -> List[ContainerInventory]:

        from sqlalchemy import select

        updated_inventories = []

        async with db.begin():
            for update_data in updates:
                import_container_id = update_data.get('import_container_id')
                inventory_identifier = update_data.get('inventory_identifier')
                # Find the container inventory
                result = await db.execute(
                    select(ContainerInventory).where(
                        ContainerInventory.import_container_id == import_container_id,
                        ContainerInventory.inventory_identifier == inventory_identifier
                    )
                )
                container_inventory = result.scalar_one_or_none()

                if not container_inventory:
                    raise NotFoundException("ContainerInventory", f"import_container_id={import_container_id}, inventory_identifier={inventory_identifier}")

                # Only update fields that are provided in the request
                if 'quantity_imported' in update_data:
                    container_inventory.quantity_imported = update_data.get('quantity_imported')
                if 'confirmed' in update_data:
                    container_inventory.confirmed = update_data.get('confirmed')
                if 'location_id' in update_data:
                    container_inventory.location_id = update_data.get('location_id')

                updated_inventories.append(container_inventory)

            await db.flush()
            for inventory in updated_inventories:
                await db.refresh(inventory)

        return updated_inventories

    @staticmethod
    async def update_container_inventory_by_id(
        db: AsyncSession,
        updates: List[dict]
    ) -> List[ContainerInventory]:
        """Update container inventory by ID - supports partial updates"""
        from sqlalchemy import select

        updated_inventories = []

        async with db.begin():
            for update_data in updates:
                container_id = update_data.get('id')
                # Find the container inventory by ID
                result = await db.execute(
                    select(ContainerInventory).where(
                        ContainerInventory.id == container_id
                    )
                )
                container_inventory = result.scalar_one_or_none()

                if not container_inventory:
                    raise NotFoundException("ContainerInventory", f"id={container_id}")

                # Only update fields that are provided in the request
                if 'manufacturing_date' in update_data:
                    container_inventory.manufacturing_date = update_data.get('manufacturing_date')
                if 'expiration_date' in update_data:
                    container_inventory.expiration_date = update_data.get('expiration_date')
                if 'sap_code' in update_data:
                    container_inventory.sap_code = update_data.get('sap_code')
                if 'po' in update_data:
                    container_inventory.po = update_data.get('po')
                if 'lot' in update_data:
                    container_inventory.lot = update_data.get('lot')
                if 'vendor' in update_data:
                    container_inventory.vendor = update_data.get('vendor')
                if 'msd_level' in update_data:
                    container_inventory.msd_level = update_data.get('msd_level')
                if 'comments' in update_data:
                    container_inventory.comments = update_data.get('comments')
                if 'name' in update_data:
                    container_inventory.name = update_data.get('name')
                if 'location_id' in update_data:
                    container_inventory.location_id = update_data.get('location_id')
                if 'serial_pallet' in update_data:
                    container_inventory.serial_pallet = update_data.get('serial_pallet')
                if 'quantity_imported' in update_data:
                    container_inventory.quantity_imported = update_data.get('quantity_imported')
                if 'scan_by' in update_data:
                    container_inventory.scan_by = update_data.get('scan_by')
                if 'confirmed' in update_data:
                    container_inventory.confirmed = update_data.get('confirmed')

                updated_inventories.append(container_inventory)

            await db.flush()
            for inventory in updated_inventories:
                await db.refresh(inventory)

        return updated_inventories

    @staticmethod
    async def update_container_inventory_simple(
        db: AsyncSession,
        updates: List[dict]
    ) -> List[ContainerInventory]:
        """Update container inventory confirmed status by ID - simplified version"""
        from sqlalchemy import select

        updated_inventories = []

        async with db.begin():
            for update_data in updates:
                container_id = update_data.get('id')
                confirmed = update_data.get('confirmed')
                # Find the container inventory by ID
                result = await db.execute(
                    select(ContainerInventory).where(
                        ContainerInventory.id == container_id
                    )
                )
                container_inventory = result.scalar_one_or_none()

                if not container_inventory:
                    raise NotFoundException("ContainerInventory", f"id={container_id}")

                # Only update the confirmed field
                container_inventory.confirmed = confirmed
                updated_inventories.append(container_inventory)

            await db.flush()
            for inventory in updated_inventories:
                await db.refresh(inventory)

        return updated_inventories

    @staticmethod
    async def update_import_pallet_info_by_id(
        db: AsyncSession,
        updates: List[dict]
    ) -> List[ImportPalletInfo]:
        """Update import pallet info by ID"""
        from sqlalchemy import select

        updated_pallets = []

        async with db.begin():
            for update_data in updates:
                pallet_id = update_data.get('id')
                # Find the import pallet info
                result = await db.execute(
                    select(ImportPalletInfo).where(
                        ImportPalletInfo.id == pallet_id
                    )
                )
                pallet_info = result.scalar_one_or_none()

                if not pallet_info:
                    raise NotFoundException("ImportPalletInfo", f"id={pallet_id}")

                # Update fields if provided
                if 'serial_pallet' in update_data:
                    pallet_info.serial_pallet = update_data.get('serial_pallet')
                if 'quantity_per_box' in update_data:
                    pallet_info.quantity_per_box = update_data.get('quantity_per_box')
                if 'num_box_per_pallet' in update_data:
                    pallet_info.num_box_per_pallet = update_data.get('num_box_per_pallet')
                if 'total_quantity' in update_data:
                    pallet_info.total_quantity = update_data.get('total_quantity')
                if 'po_number' in update_data:
                    pallet_info.po_number = update_data.get('po_number')
                if 'customer_name' in update_data:
                    pallet_info.customer_name = update_data.get('customer_name')
                if 'production_decision_number' in update_data:
                    pallet_info.qdsx_no = update_data.get('production_decision_number')
                if 'item_no_sku' in update_data:
                    pallet_info.item_no_sku = update_data.get('item_no_sku')
                if 'date_code' in update_data:
                    pallet_info.date_code = update_data.get('date_code')
                if 'note' in update_data:
                    pallet_info.note = update_data.get('note')
                if 'scan_status' in update_data:
                    pallet_info.scan_status = update_data.get('scan_status')
                if 'confirmed' in update_data:
                    pallet_info.confirmed = update_data.get('confirmed')
                if 'location_id' in update_data:
                    pallet_info.location_id = update_data.get('location_id')

                updated_pallets.append(pallet_info)

            await db.flush()
            for pallet in updated_pallets:
                await db.refresh(pallet)

        return updated_pallets

    @staticmethod
    async def create_wms_import_with_nested_data(db: AsyncSession, import_data: dict) -> dict:
        """
        Create warehouse import requirement with nested pallet and box data
        Inserts into: warehouse_import_requirements -> import_pallet_info -> container_inventories
        """
        from app.modules.inventory.models import ImportPalletInfo, ContainerInventory
        from datetime import datetime
        
        async with db.begin():
            # Step 1: Extract general_info and list_pallet
            general_info = import_data.get('general_info', {})
            list_pallet = general_info.pop('list_pallet', [])
            
            # Step 2: Create warehouse_import_requirements record
            warehouse_import_data = {
                'po_number': general_info.get('po_number'),
                'client_id': general_info.get('client_id'),
                'inventory_code': general_info.get('inventory_code'),
                'inventory_name': general_info.get('inventory_name'),
                'wo_code': general_info.get('wo_code'),
                'sap_wo': general_info.get('wo_code'), 
                'lot_number': general_info.get('lot_number'),
                'production_date': general_info.get('production_date'),
                'branch': general_info.get('branch'),
                'production_team': general_info.get('production_team'),
                'number_of_pallet': general_info.get('number_of_pallet'),
                'number_of_box': general_info.get('number_of_box'),
                'quantity': general_info.get('quantity'),
                'status': False,
                'note': general_info.get('note'),
                'destination_warehouse': general_info.get('destination_warehouse'),
                'pallet_note_creation_session_id': general_info.get('pallet_note_creation_id'),
                'item_no_sku': general_info.get('item_no_sku'),
                'created_by': general_info.get('created_by'),
                'updated_by': general_info.get('created_by')
            }
            
            warehouse_import = WarehouseImportRequirement(**warehouse_import_data)
            db.add(warehouse_import)
            await db.flush()
            await db.refresh(warehouse_import)
            
            # Step 3: Create import_pallet_info records for each pallet
            total_pallets = 0
            total_boxes = 0
            
            for pallet_data in list_pallet:
                list_box = pallet_data.pop('list_box', [])
                
                # Create pallet record
                pallet_info = ImportPalletInfo(
                    warehouse_import_requirement_id=warehouse_import.id,
                    serial_pallet=pallet_data.get('serial_pallet'),
                    quantity_per_box=pallet_data.get('quantity_per_box'),
                    num_box_per_pallet=pallet_data.get('num_box_per_pallet'),
                    total_quantity=pallet_data.get('total_quantity'),
                    po_number=pallet_data.get('po_number'),
                    customer_name=pallet_data.get('customer_name'),
                    qdsx_no=pallet_data.get('production_decision_number'),
                    item_no_sku=pallet_data.get('item_no_sku'),
                    date_code=pallet_data.get('date_code'),
                    note=pallet_data.get('note'),
                    scan_status=False,
                    location_id=pallet_data.get('location_id'),
                    created_by=general_info.get('created_by')
                )
                db.add(pallet_info)
                await db.flush()
                await db.refresh(pallet_info)
                total_pallets += 1
                prod_date_str = pallet_data.get('production_date')
                if prod_date_str:
                    manufacturing_date = datetime.strptime(prod_date_str, '%d/%m/%Y')
                else:
                    manufacturing_date = None

                # Step 4: Create container_inventories records for each box
                for box_data in list_box:
                    container_inventory = ContainerInventory(
                        import_pallet_id=pallet_info.id,
                        po=pallet_data.get('po_number'),
                        lot=general_info.get('lot_number'),
                        sap_code=general_info.get('inventory_code'),
                        name=general_info.get('inventory_name'),
                        inventory_identifier=box_data.get('box_code'),
                        serial_pallet=pallet_data.get('serial_pallet'),
                        quantity_imported=box_data.get('quantity'),
                        comments=box_data.get('note'),
                        list_serial_items=box_data.get('list_serial_items'),
                        location_id=general_info.get('destination_warehouse') if general_info.get('destination_warehouse') else 1,
                        # msd_level=box_data.msd_level if box_data.msd_level else "1",
                        # vendor=box_data.vendor if box_data.vendor else "RD",
                        msd_level="1",
                        vendor="RD",
                        manufacturing_date=manufacturing_date,
                        confirmed=False,
                    )
                    db.add(container_inventory)
                    total_boxes += 1
                
                await db.flush()
            
            return {
                'warehouse_import_requirement_id': warehouse_import.id,
                'total_pallets': total_pallets,
                'total_boxes': total_boxes
            }

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
                "series_pgh": req.series_pgh,
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
            # Filter data to only include valid columns for InternalWarehouseTransferRequest
            valid_keys = {c.key for c in InternalWarehouseTransferRequest.__table__.columns}
            filtered_data = {k: v for k, v in iwtr_data.items() if k in valid_keys}
            
            # status and scan_status are boolean, no conversion needed
            
            req = InternalWarehouseTransferRequest(**filtered_data)
            db.add(req)
            await db.flush()
            await db.refresh(req)
            return req
    
    @staticmethod
    def _convert_to_boolean(value) -> bool:
        """Convert various types to boolean, handling string representations properly"""
        if isinstance(value, bool):
            return value
        elif isinstance(value, str):
            # Handle string representations of boolean values
            if value.lower() in ('true', '1', 'yes', 'on'):
                return True
            elif value.lower() in ('false', '0', 'no', 'off', ''):
                return False
            else:
                # For any other non-empty string, treat as truthy
                return bool(value)
        else:
            # For numbers, None, and other types
            return bool(value)

    @staticmethod
    async def confirm_iwtr_location(db: AsyncSession, req_id: int, location_id: int) -> InternalWarehouseTransferRequest:
        async with db.begin():
            req = await IWTRService.get_iwtr_request_by_id(db, req_id)
            # Logic to confirm location
            req.status = True
            await db.flush()
            await db.refresh(req)
            return req

    @staticmethod
    async def update_iwtr_request(db: AsyncSession, req_id: int, update_data: dict) -> InternalWarehouseTransferRequest:
        """Update IWTR request by ID - only fields provided will be updated"""
        async with db.begin():
            req = await IWTRService.get_iwtr_request_by_id(db, req_id)
            
            # Only update fields that are provided in the request
            if 'ma_yc_cknb' in update_data:
                req.ma_yc_cknb = update_data.get('ma_yc_cknb')
            if 'tu_kho' in update_data:
                req.tu_kho = update_data.get('tu_kho')
            if 'den_kho' in update_data:
                req.den_kho = update_data.get('den_kho')
            if 'don_vi_linh' in update_data:
                req.don_vi_linh = update_data.get('don_vi_linh')
            if 'don_vi_nhan' in update_data:
                req.don_vi_nhan = update_data.get('don_vi_nhan')
            if 'ly_do_xuat_nhap' in update_data:
                req.ly_do_xuat_nhap = update_data.get('ly_do_xuat_nhap')
            if 'ngay_chung_tu' in update_data:
                req.ngay_chung_tu = update_data.get('ngay_chung_tu')
            if 'so_phieu_xuat' in update_data:
                req.so_phieu_xuat = update_data.get('so_phieu_xuat')
            if 'so_chung_tu' in update_data:
                req.so_chung_tu = update_data.get('so_chung_tu')
            if 'series_pgh' in update_data:
                req.series_pgh = update_data.get('series_pgh')
            if 'status' in update_data:
                req.status = update_data.get('status')
            if 'note' in update_data:
                req.note = update_data.get('note')
            if 'scan_status' in update_data:
                req.scan_status = update_data.get('scan_status')
            if 'updated_by' in update_data:
                req.updated_by = update_data.get('updated_by')
            if 'deleted_at' in update_data:
                req.deleted_at = update_data.get('deleted_at')
            if 'deleted_by' in update_data:
                req.deleted_by = update_data.get('deleted_by')
            
            # Update the updated_date to current time
            req.updated_date = func.now()
            
            await db.flush()
            await db.refresh(req)
            return req

    @staticmethod
    async def scan_iwtr(db: AsyncSession, req_id: int, scan_details: list) -> dict:

        from datetime import datetime

        async with db.begin():
            # Verify IWTR exists
            iwtr = await IWTRService.get_iwtr_request_by_id(db, req_id)
            if not iwtr:
                raise HTTPException(status_code=404, detail=f"IWTR with ID {req_id} not found")

            # Create inventories_in_iwtr records
            created_details = []
            for detail in scan_details:
                inventories_in_iwtr = InventoriesInIWTR(
                    product_in_iwtr_id=detail.get('product_in_iwtr_id'),
                    inventory_identifier=detail.get('inventory_identifier'),
                    serial_pallet=detail.get('serial_pallet'),
                    scan_by=detail.get('scan_by'),
                    quantity_dispatched=detail.get('quantity_dispatched'),
                    scan_time=detail.get('scan_time', datetime.now()),
                    confirmed=detail.get('confirmed', False)
                )
                db.add(inventories_in_iwtr)
                created_details.append(inventories_in_iwtr)

            await db.flush()

            # Refresh all created records to get their IDs
            for detail in created_details:
                await db.refresh(detail)

            return {
                "success": True,
                "details": [
                    {
                        "id": detail.id,
                        "product_in_iwtr_id": detail.product_in_iwtr_id,
                        "inventory_identifier": detail.inventory_identifier,
                        "serial_pallet": detail.serial_pallet,
                        "scan_by": detail.scan_by,
                        "quantity_dispatched": detail.quantity_dispatched,
                        "scan_time": detail.scan_time,
                        "confirmed": detail.confirmed
                    }
                    for detail in created_details
                ]
            }

    @staticmethod
    async def create_products_in_iwtr(
        db: AsyncSession,
        iwtr_id: int,
        inventories_data: list
    ) -> list:

        from datetime import datetime

        async with db.begin():
            items = []
            for inv_data in inventories_data:
                inventory_item = ProductsInIWTR(
                    internal_warehouse_transfer_requests_id=iwtr_id,
                    product_code=inv_data.get('product_code'),
                    product_name=inv_data.get('product_name'),
                    tu_kho=inv_data.get('tu_kho'),
                    den_kho=inv_data.get('den_kho'),
                    total_quantity=inv_data.get('total_quantity'),
                    dvt=inv_data.get('dvt'),
                    quantity_scanned=inv_data.get('quantity_scanned', 0),
                    updated_by=inv_data.get('updated_by'),
                    updated_date=datetime.now()
                )
                db.add(inventory_item)
                items.append(inventory_item)

            await db.flush()

            # Refresh all inventory items to get their IDs
            for inv in items:
                await db.refresh(inv)

            return items

    @staticmethod
    async def get_inventories_by_iwtr_request_id(
        db: AsyncSession,
        request_id: int
    ) -> List[dict]:
        from app.modules.inventory.models import InventoriesInIWTR
        from app.core.exceptions import NotFoundException
        
        try:
            # First verify IWTR exists
            await IWTRService.get_iwtr_request_by_id(db, request_id)
        except NotFoundException:
            # If IWTR doesn't exist, return empty list
            return []
        
        # Query inventories in IWTR
        result = await db.execute(
            select(ProductsInIWTR).where(
                ProductsInIWTR.internal_warehouse_transfer_requests_id == request_id
            ).order_by(ProductsInIWTR.updated_date.desc())
        )
        inventories = result.scalars().all()

        return [
            {
                "id": inv.id,
                "internal_warehouse_transfer_requests_id": inv.internal_warehouse_transfer_requests_id,
                "product_code": inv.product_code,
                "product_name": inv.product_name,
                "tu_kho": inv.tu_kho,
                "den_kho": inv.den_kho,
                "total_quantity": inv.total_quantity,
                "dvt": inv.dvt,
                "quantity_scanned": inv.quantity_scanned,
                "updated_by": inv.updated_by,
                "updated_date": inv.updated_date
            }
            for inv in inventories
        ]

    @staticmethod
    async def create_iwtr_with_items(
        db: AsyncSession,
        iwtr_data: dict,
        items_data: list
    ) -> dict:

        from datetime import datetime

        async with db.begin():
            # Step 1: Create IWTR header
            iwtr = InternalWarehouseTransferRequest(**iwtr_data)
            db.add(iwtr)
            await db.flush()  # Flush to get the ID
            await db.refresh(iwtr)

            # Step 2: Create inventory items with the IWTR ID
            items = []
            for item_data in items_data:
                item = ProductsInIWTR(
                    internal_warehouse_transfer_requests_id=iwtr.id,
                    product_code=item_data.get('product_code'),
                    product_name=item_data.get('product_name'),
                    tu_kho=item_data.get('tu_kho'),
                    den_kho=item_data.get('den_kho'),
                    total_quantity=item_data.get('total_quantity'),
                    dvt=item_data.get('dvt'),
                    updated_by=item_data.get('updated_by'),
                    updated_date=datetime.now()
                )
                db.add(item)
                items.append(item)

            await db.flush()

            # Refresh all inventory items to get their IDs
            for item in items:
                await db.refresh(item)

            return {
                "iwtr": iwtr,
                "items": items
            }
        
    @staticmethod
    async def get_scan_details_by_iwtr_request_id(
        db: AsyncSession,
        request_id: int
    ) -> List[dict]:
        from app.modules.inventory.models import InventoriesInIWTR
        from app.core.exceptions import NotFoundException

        try:
            await IWTRService.get_iwtr_request_by_id(db, request_id)
        except NotFoundException:
            return []

        result = await db.execute(
            select(InventoriesInIWTR, ProductsInIWTR).join(
                ProductsInIWTR, InventoriesInIWTR.product_in_iwtr_id == ProductsInIWTR.id
            ).where(
                ProductsInIWTR.internal_warehouse_transfer_requests_id == request_id
            ).order_by(InventoriesInIWTR.scan_time.desc())
        )
        scan_details = result.all()

        return [
            {
                "id": detail.InventoriesInIWTR.id,
                "product_in_iwtr_id": detail.InventoriesInIWTR.product_in_iwtr_id,
                "product_code": detail.ProductsInIWTR.product_code,
                "product_name": detail.ProductsInIWTR.product_name,
                "inventory_identifier": detail.InventoriesInIWTR.inventory_identifier,
                "serial_pallet": detail.InventoriesInIWTR.serial_pallet,
                "scan_by": detail.InventoriesInIWTR.scan_by,
                "quantity_dispatched": detail.InventoriesInIWTR.quantity_dispatched,
                "scan_time": detail.InventoriesInIWTR.scan_time,
                "confirmed": detail.InventoriesInIWTR.confirmed
            }
            for detail in scan_details
        ]

    @staticmethod
    async def get_scan_details_by_product_in_iwtr_id(
        db: AsyncSession,
        product_in_iwtr_id: int
    ) -> List[dict]:
        from app.modules.inventory.models import InventoriesInIWTR

        # Query scan details (InventoriesInIWTR) for the specific product_in_iwtr_id
        result = await db.execute(
            select(InventoriesInIWTR).where(
                InventoriesInIWTR.product_in_iwtr_id == product_in_iwtr_id
            ).order_by(InventoriesInIWTR.scan_time.desc())
        )
        scan_details = result.scalars().all()

        return [
            {
                "id": detail.id,
                "product_in_iwtr_id": detail.product_in_iwtr_id,
                "inventory_identifier": detail.inventory_identifier,
                "serial_pallet": detail.serial_pallet,
                "scan_by": detail.scan_by,
                "quantity_dispatched": detail.quantity_dispatched,
                "scan_time": detail.scan_time,
                "confirmed": detail.confirmed
            }
            for detail in scan_details
        ]

    @staticmethod
    async def get_iwtr_request_details(
        db: AsyncSession,
        request_id: int
    ) -> dict:
        """Get full IWTR request details with nested products and inventories"""
        from app.modules.inventory.models import InventoriesInIWTR
        from app.core.exceptions import NotFoundException
        from sqlalchemy.orm import joinedload

        try:
            # Get the main IWTR request
            result = await db.execute(
                select(InternalWarehouseTransferRequest).where(
                    InternalWarehouseTransferRequest.id == request_id
                )
            )
            request = result.scalar_one_or_none()
            if not request:
                raise NotFoundException("IWTR", str(request_id))

            # Get products in IWTR with their inventories
            result = await db.execute(
                select(ProductsInIWTR).where(
                    ProductsInIWTR.internal_warehouse_transfer_requests_id == request_id
                ).order_by(ProductsInIWTR.updated_date.desc())
            )
            products = result.scalars().all()

            # Get all inventories for these products
            product_ids = [p.id for p in products]
            if product_ids:
                result = await db.execute(
                    select(InventoriesInIWTR).where(
                        InventoriesInIWTR.product_in_iwtr_id.in_(product_ids)
                    ).order_by(InventoriesInIWTR.scan_time.desc())
                )
                inventories = result.scalars().all()
            else:
                inventories = []

            # Convert to response format
            request_data = {
                "id": request.id,
                "ma_yc_cknb": request.ma_yc_cknb,
                "tu_kho": request.tu_kho,
                "den_kho": request.den_kho,
                "don_vi_linh": request.don_vi_linh,
                "don_vi_nhan": request.don_vi_nhan,
                "ly_do_xuat_nhap": request.ly_do_xuat_nhap,
                "ngay_chung_tu": request.ngay_chung_tu,
                "so_phieu_xuat": request.so_phieu_xuat,
                "so_chung_tu": request.so_chung_tu,
                "series_pgh": request.series_pgh,
                "status": request.status,
                "note": request.note,
                "scan_status": request.scan_status,
                "updated_by": request.updated_by,
                "updated_date": request.updated_date,
                "deleted_at": request.deleted_at,
                "deleted_by": request.deleted_by
            }

            products_data = [
                {
                    "id": p.id,
                    "internal_warehouse_transfer_requests_id": p.internal_warehouse_transfer_requests_id,
                    "product_code": p.product_code,
                    "product_name": p.product_name,
                    "tu_kho": p.tu_kho,
                    "den_kho": p.den_kho,
                    "total_quantity": p.total_quantity,
                    "dvt": p.dvt,
                    "quantity_scanned": p.quantity_scanned,
                    "updated_by": p.updated_by,
                    "updated_date": p.updated_date
                }
                for p in products
            ]

            inventories_data = [
                {
                    "id": inv.id,
                    "product_in_iwtr_id": inv.product_in_iwtr_id,
                    "inventory_identifier": inv.inventory_identifier,
                    "serial_pallet": inv.serial_pallet,
                    "scan_by": inv.scan_by,
                    "quantity_dispatched": inv.quantity_dispatched,
                    "scan_time": inv.scan_time,
                    "confirmed": inv.confirmed
                }
                for inv in inventories
            ]

            return {
                "request": request_data,
                "products": products_data,
                "inventories": inventories_data
            }

        except NotFoundException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching IWTR details: {str(e)}")

    @staticmethod
    async def update_inventories_in_iwrt(
        db: AsyncSession,
        updates: List[dict]
    ) -> List[InventoriesInIWTR]:

        from sqlalchemy import select

        updated_inventories = []

        async with db.begin():
            for update_data in updates:
                product_in_iwtr_id = update_data.get('product_in_iwtr_id')
                inventory_identifier = update_data.get('inventory_identifier')
                quantity_imported = update_data.get('quantity_imported')
                confirmed = update_data.get('confirmed')
                # Find the inventories in iwtr
                result = await db.execute(
                    select(InventoriesInIWTR).where(
                        InventoriesInIWTR.product_in_iwtr_id == product_in_iwtr_id,
                        InventoriesInIWTR.inventory_identifier == inventory_identifier
                    )
                )
                inventories_in_iwtr = result.scalar_one_or_none()

                if not inventories_in_iwtr:
                    raise NotFoundException("InventoriesInIWTR", f"product_in_iwtr_id={product_in_iwtr_id}, inventory_identifier={inventory_identifier}")

                inventories_in_iwtr.quantity_dispatched = quantity_imported
                inventories_in_iwtr.confirmed = confirmed
                updated_inventories.append(inventories_in_iwtr)

            await db.flush()
            for inventory in updated_inventories:
                await db.refresh(inventory)

        return updated_inventories

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
                "series_pgh": req.series_pgh,
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
            # Filter data to only include valid columns for OutboundShipmentRequestOnOrder
            valid_keys = {c.key for c in OutboundShipmentRequestOnOrder.__table__.columns}
            filtered_data = {k: v for k, v in osr_data.items() if k in valid_keys}
            
            # status and scan_status are now strings, no conversion needed
            
            req = OutboundShipmentRequestOnOrder(**filtered_data)
            db.add(req)
            await db.flush()
            await db.refresh(req)
            return req
    
    @staticmethod
    def _convert_to_boolean(value) -> bool:
        """Convert various types to boolean, handling string representations properly"""
        if isinstance(value, bool):
            return value
        elif isinstance(value, str):
            # Handle string representations of boolean values
            if value.lower() in ('true', '1', 'yes', 'on'):
                return True
            elif value.lower() in ('false', '0', 'no', 'off', ''):
                return False
            else:
                # For any other non-empty string, treat as truthy
                return bool(value)
        else:
            # For numbers, None, and other types
            return bool(value)

    @staticmethod
    async def confirm_osr_location(db: AsyncSession, req_id: int, location_id: int) -> OutboundShipmentRequestOnOrder:
        async with db.begin():
            req = await OSRService.get_osr_request_by_id(db, req_id)
            # Logic to confirm location
            req.status = True
            await db.flush()
            await db.refresh(req)
            return req

    @staticmethod
    async def update_osr_request(db: AsyncSession, req_id: int, update_data: dict) -> OutboundShipmentRequestOnOrder:
        """Update OSR request by ID - only fields provided will be updated"""
        async with db.begin():
            req = await OSRService.get_osr_request_by_id(db, req_id)
            
            # Only update fields that are provided in the request
            if 'ma_yc_xk' in update_data:
                req.ma_yc_xk = update_data.get('ma_yc_xk')
            if 'kho_xuat' in update_data:
                req.kho_xuat = update_data.get('kho_xuat')
            if 'xuat_toi' in update_data:
                req.xuat_toi = update_data.get('xuat_toi')
            if 'don_vi_linh' in update_data:
                req.don_vi_linh = update_data.get('don_vi_linh')
            if 'don_vi_nhan' in update_data:
                req.don_vi_nhan = update_data.get('don_vi_nhan')
            if 'ly_do_xuat_nhap' in update_data:
                req.ly_do_xuat_nhap = update_data.get('ly_do_xuat_nhap')
            if 'ngay_chung_tu' in update_data:
                req.ngay_chung_tu = update_data.get('ngay_chung_tu')
            if 'so_phieu_xuat' in update_data:
                req.so_phieu_xuat = update_data.get('so_phieu_xuat')
            if 'so_chung_tu' in update_data:
                req.so_chung_tu = update_data.get('so_chung_tu')
            if 'series_pgh' in update_data:
                req.series_pgh = update_data.get('series_pgh')
            if 'status' in update_data:
                req.status = update_data.get('status')
            if 'note' in update_data:
                req.note = update_data.get('note')
            if 'scan_status' in update_data:
                req.scan_status = update_data.get('scan_status')
            if 'updated_by' in update_data:
                req.updated_by = update_data.get('updated_by')
            if 'deleted_at' in update_data:
                req.deleted_at = update_data.get('deleted_at')
            if 'deleted_by' in update_data:
                req.deleted_by = update_data.get('deleted_by')
            
            # Update the updated_date to current time
            req.updated_date = func.now()
            
            await db.flush()
            await db.refresh(req)
            return req

    @staticmethod
    async def scan_osr(db: AsyncSession, req_id: int, scan_details: list) -> dict:

        from datetime import datetime

        async with db.begin():
            # Verify OSR exists
            osr = await OSRService.get_osr_request_by_id(db, req_id)
            if not osr:
                raise HTTPException(status_code=404, detail=f"OSR with ID {req_id} not found")

            # Create inventories_in_osr records
            created_details = []
            for detail in scan_details:
                inventories_in_osr = InventoriesInOSR(
                    product_in_osr_id=detail.get('product_in_osr_id'),
                    inventory_identifier=detail.get('inventory_identifier'),
                    serial_pallet=detail.get('serial_pallet'),
                    scan_by=detail.get('scan_by'),
                    quantity_dispatched=detail.get('quantity_dispatched'),
                    scan_time=detail.get('scan_time', datetime.now()),
                    confirmed=detail.get('confirmed', False)
                )
                db.add(inventories_in_osr)
                created_details.append(inventories_in_osr)

            await db.flush()

            # Refresh all created records to get their IDs
            for detail in created_details:
                await db.refresh(detail)

            return {
                "success": True,
                "details": [
                    {
                        "id": detail.id,
                        "product_in_osr_id": detail.product_in_osr_id,
                        "inventory_identifier": detail.inventory_identifier,
                        "serial_pallet": detail.serial_pallet,
                        "scan_by": detail.scan_by,
                        "quantity_dispatched": detail.quantity_dispatched,
                        "scan_time": detail.scan_time,
                        "confirmed": detail.confirmed
                    }
                    for detail in created_details
                ]
            }

    @staticmethod
    async def create_products_in_osr(
        db: AsyncSession,
        osr_id: int,
        inventories_data: list
    ) -> list:

        from datetime import datetime

        inventories = []
        for inv_data in inventories_data:
            inventory_item = ProductsInOSR(
                outbound_shipment_request_on_order_id=osr_id,
                product_code=inv_data.get('product_code'),
                product_name=inv_data.get('product_name'),
                total_quantity=inv_data.get('total_quantity'),
                dvt=inv_data.get('dvt'),
                quantity_scanned=inv_data.get('quantity_scanned', 0),
                updated_by=inv_data.get('updated_by'),
                updated_date=datetime.now()
            )
            db.add(inventory_item)
            inventories.append(inventory_item)

        await db.flush()

        # Refresh all inventory items to get their IDs
        for inv in inventories:
            await db.refresh(inv)
        return inventories

    @staticmethod
    async def get_inventories_by_osr_request_id(
        db: AsyncSession,
        request_id: int
    ) -> List[dict]:
        from app.modules.inventory.models import InventoriesInOSR
        from app.core.exceptions import NotFoundException

        try:
            # First verify OSR exists
            await OSRService.get_osr_request_by_id(db, request_id)
        except NotFoundException:
            # If OSR doesn't exist, return empty list
            return []

        # Query inventories in OSR
        result = await db.execute(
            select(ProductsInOSR).where(
                ProductsInOSR.outbound_shipment_request_on_order_id == request_id
            ).order_by(ProductsInOSR.updated_date.desc())
        )
        inventories = result.scalars().all()

        return [
            {
                "id": inv.id,
                "outbound_shipment_request_on_order_id": inv.outbound_shipment_request_on_order_id,
                "product_code": inv.product_code,
                "product_name": inv.product_name,
                "total_quantity": inv.total_quantity,
                "dvt": inv.dvt,
                "quantity_scanned": inv.quantity_scanned,
                "updated_by": inv.updated_by,
                "updated_date": inv.updated_date
            }
            for inv in inventories
        ]

    @staticmethod
    async def get_scan_details_by_osr_request_id(
        db: AsyncSession,
        request_id: int
    ) -> List[dict]:
        from app.modules.inventory.models import InventoriesInOSR
        from app.core.exceptions import NotFoundException

        try:
            # First verify OSR exists
            await OSRService.get_osr_request_by_id(db, request_id)
        except NotFoundException:
            # If OSR doesn't exist, return empty list
            return []

        # Query scan details (InventoriesInOSR) joined with ProductsInOSR
        result = await db.execute(
            select(InventoriesInOSR, ProductsInOSR).join(
                ProductsInOSR, InventoriesInOSR.product_in_osr_id == ProductsInOSR.id
            ).where(
                ProductsInOSR.outbound_shipment_request_on_order_id == request_id
            ).order_by(InventoriesInOSR.scan_time.desc())
        )
        scan_details = result.all()

        return [
            {
                "id": detail.InventoriesInOSR.id,
                "product_in_osr_id": detail.InventoriesInOSR.product_in_osr_id,
                "product_code": detail.ProductsInOSR.product_code,
                "product_name": detail.ProductsInOSR.product_name,
                "inventory_identifier": detail.InventoriesInOSR.inventory_identifier,
                "serial_pallet": detail.InventoriesInOSR.serial_pallet,
                "scan_by": detail.InventoriesInOSR.scan_by,
                "quantity_dispatched": detail.InventoriesInOSR.quantity_dispatched,
                "scan_time": detail.InventoriesInOSR.scan_time,
                "confirmed": detail.InventoriesInOSR.confirmed
            }
            for detail in scan_details
        ]

    @staticmethod
    async def get_scan_details_by_product_in_osr_id(
        db: AsyncSession,
        product_in_osr_id: int
    ) -> List[dict]:
        from app.modules.inventory.models import InventoriesInOSR

        # Query scan details (InventoriesInOSR) for the specific product_in_osr_id
        result = await db.execute(
            select(InventoriesInOSR).where(
                InventoriesInOSR.product_in_osr_id == product_in_osr_id
            ).order_by(InventoriesInOSR.scan_time.desc())
        )
        scan_details = result.scalars().all()

        return [
            {
                "id": detail.id,
                "product_in_osr_id": detail.product_in_osr_id,
                "inventory_identifier": detail.inventory_identifier,
                "serial_pallet": detail.serial_pallet,
                "scan_by": detail.scan_by,
                "quantity_dispatched": detail.quantity_dispatched,
                "scan_time": detail.scan_time,
                "confirmed": detail.confirmed
            }
            for detail in scan_details
        ]

    @staticmethod
    async def get_osr_request_details(
        db: AsyncSession,
        request_id: int
    ) -> dict:
        """Get full OSR request details with nested products and inventories"""
        from app.modules.inventory.models import InventoriesInOSR
        from app.core.exceptions import NotFoundException
        from sqlalchemy.orm import joinedload

        try:
            # Get the main OSR request
            result = await db.execute(
                select(OutboundShipmentRequestOnOrder).where(
                    OutboundShipmentRequestOnOrder.id == request_id
                )
            )
            request = result.scalar_one_or_none()
            if not request:
                raise NotFoundException("OSR", str(request_id))

            # Get products in OSR with their inventories
            result = await db.execute(
                select(ProductsInOSR).where(
                    ProductsInOSR.outbound_shipment_request_on_order_id == request_id
                ).order_by(ProductsInOSR.updated_date.desc())
            )
            products = result.scalars().all()

            # Get all inventories for these products
            product_ids = [p.id for p in products]
            if product_ids:
                result = await db.execute(
                    select(InventoriesInOSR).where(
                        InventoriesInOSR.product_in_osr_id.in_(product_ids)
                    ).order_by(InventoriesInOSR.scan_time.desc())
                )
                inventories = result.scalars().all()
            else:
                inventories = []

            # Convert to response format
            request_data = {
                "id": request.id,
                "ma_yc_xk": request.ma_yc_xk,
                "kho_xuat": request.kho_xuat,
                "xuat_toi": request.xuat_toi,
                "don_vi_linh": request.don_vi_linh,
                "don_vi_nhan": request.don_vi_nhan,
                "ly_do_xuat_nhap": request.ly_do_xuat_nhap,
                "ngay_chung_tu": request.ngay_chung_tu,
                "so_phieu_xuat": request.so_phieu_xuat,
                "so_chung_tu": request.so_chung_tu,
                "series_pgh": request.series_pgh,
                "status": request.status,
                "note": request.note,
                "scan_status": request.scan_status,
                "updated_by": request.updated_by,
                "updated_date": request.updated_date,
                "deleted_at": request.deleted_at,
                "deleted_by": request.deleted_by
            }

            products_data = [
                {
                    "id": p.id,
                    "outbound_shipment_request_on_order_id": p.outbound_shipment_request_on_order_id,
                    "product_code": p.product_code,
                    "product_name": p.product_name,
                    "total_quantity": p.total_quantity,
                    "dvt": p.dvt,
                    "quantity_scanned": p.quantity_scanned,
                    "updated_by": p.updated_by,
                    "updated_date": p.updated_date
                }
                for p in products
            ]

            inventories_data = [
                {
                    "id": inv.id,
                    "product_in_osr_id": inv.product_in_osr_id,
                    "inventory_identifier": inv.inventory_identifier,
                    "serial_pallet": inv.serial_pallet,
                    "scan_by": inv.scan_by,
                    "quantity_dispatched": inv.quantity_dispatched,
                    "scan_time": inv.scan_time,
                    "confirmed": inv.confirmed
                }
                for inv in inventories
            ]

            return {
                "request": request_data,
                "products": products_data,
                "inventories": inventories_data
            }

        except NotFoundException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching OSR details: {str(e)}")

    @staticmethod
    async def update_inventories_in_osr(
        db: AsyncSession,
        updates: List[dict]
    ) -> List[InventoriesInOSR]:

        from sqlalchemy import select

        updated_inventories = []

        async with db.begin():
            for update_data in updates:
                product_in_osr_id = update_data.get('product_in_osr_id')
                inventory_identifier = update_data.get('inventory_identifier')
                quantity_imported = update_data.get('quantity_imported')
                confirmed = update_data.get('confirmed')
                # Find the inventories in osr
                result = await db.execute(
                    select(InventoriesInOSR).where(
                        InventoriesInOSR.product_in_osr_id == product_in_osr_id,
                        InventoriesInOSR.inventory_identifier == inventory_identifier
                    )
                )
                inventories_in_osr = result.scalar_one_or_none()

                if not inventories_in_osr:
                    raise NotFoundException("InventoriesInOSR", f"product_in_osr_id={product_in_osr_id}, inventory_identifier={inventory_identifier}")

                inventories_in_osr.quantity_dispatched = quantity_imported
                inventories_in_osr.confirmed = confirmed
                updated_inventories.append(inventories_in_osr)

            await db.flush()
            for inventory in updated_inventories:
                await db.refresh(inventory)

        return updated_inventories



class External_Apps_Service:

    @staticmethod
    async def get_external_apps_import_requirements(db: AsyncSession) -> List[dict]:
        return await WarehouseImportService.get_import_requirements(db)

    @staticmethod
    async def get_external_apps_iwtr(db: AsyncSession) -> List[dict]:
        return await IWTRService.get_iwtr_requests(db)

    @staticmethod
    async def get_external_apps_osr(db: AsyncSession) -> List[dict]:
        return await OSRService.get_osr_requests(db)

class ContainerInventoryService:

    @staticmethod
    async def create_container_inventory(db: AsyncSession, container_data: dict) -> ContainerInventory:
        """Create a new container inventory record"""
        async with db.begin():
            # Explicitly map fields to ensure correct assignment and prevent field misalignment
            container_inventory = ContainerInventory(
                manufacturing_date=container_data.get('manufacturing_date'),
                expiration_date=container_data.get('expiration_date'),
                sap_code=container_data.get('sap_code'),
                po=container_data.get('po'),
                lot=container_data.get('lot'),
                vendor=container_data.get('vendor'),
                msd_level=container_data.get('msd_level'),
                comments=container_data.get('comments'),
                name=container_data.get('name'),
                import_container_id=container_data.get('import_container_id'),
                inventory_identifier=container_data.get('inventory_identifier'),
                location_id=container_data.get('location_id'),
                serial_pallet=container_data.get('serial_pallet'),
                quantity_imported=container_data.get('quantity_imported'),
                # scan_by=container_data.get('scan_by'),
                scan_by=None,
                confirmed=container_data.get('confirmed', False)
            )
            db.add(container_inventory)
            await db.flush()
            await db.refresh(container_inventory)
            return container_inventory

    @staticmethod
    async def get_container_inventories_by_import_container_id(
        db: AsyncSession,
        import_container_id: int,
        page: int = 1,
        size: int = 20
    ) -> dict:
        """Get container inventories by import_container_id with pagination"""
        from sqlalchemy import and_

        # Base query
        query = select(ContainerInventory).where(
            ContainerInventory.import_container_id == import_container_id
        )

        # Get total count
        count_query = select(func.count()).select_from(ContainerInventory).where(
            ContainerInventory.import_container_id == import_container_id
        )
        count_result = await db.execute(count_query)
        total_items = count_result.scalar() or 0

        # Apply pagination
        query = query.order_by(ContainerInventory.time_checked.desc())
        offset = (page - 1) * size
        query = query.offset(offset).limit(size)

        # Execute query
        result = await db.execute(query)
        container_inventories = result.scalars().all()

        # Convert to dict format
        data = [
            {
                "id": ci.id,
                "manufacturing_date": ci.manufacturing_date.isoformat() if ci.manufacturing_date else None,
                "expiration_date": ci.expiration_date.isoformat() if ci.expiration_date else None,
                "sap_code": ci.sap_code,
                "po": ci.po,
                "lot": ci.lot,
                "vendor": ci.vendor,
                "msd_level": ci.msd_level,
                "comments": ci.comments,
                "name": ci.name,
                "import_container_id": ci.import_container_id,
                "inventory_identifier": ci.inventory_identifier,
                "location_id": ci.location_id,
                "serial_pallet": ci.serial_pallet,
                "quantity_imported": ci.quantity_imported,
                "scan_by": ci.scan_by,
                "time_checked": ci.time_checked.isoformat() if ci.time_checked else None,
                "confirmed": ci.confirmed
            }
            for ci in container_inventories
        ]

        total_pages = (total_items + size - 1) // size if total_items > 0 else 1

        return {
            "data": data,
            "meta": {
                "page": page,
                "size": size,
                "total_items": total_items,
                "total_pages": total_pages
            }
        }

    @staticmethod
    async def get_container_inventory_by_id(db: AsyncSession, container_inventory_id: int) -> ContainerInventory:
        """Get a container inventory by ID"""
        result = await db.execute(select(ContainerInventory).where(ContainerInventory.id == container_inventory_id))
        container_inventory = result.scalar_one_or_none()
        if not container_inventory:
            raise NotFoundException("ContainerInventory", str(container_inventory_id))
        return container_inventory

    @staticmethod
    async def update_container_inventory(
        db: AsyncSession,
        container_inventory_id: int,
        update_data: dict
    ) -> ContainerInventory:
        """Update a container inventory record"""
        async with db.begin():
            container_inventory = await ContainerInventoryService.get_container_inventory_by_id(db, container_inventory_id)

            for key, value in update_data.items():
                if value is not None:
                    setattr(container_inventory, key, value)

            await db.flush()
            await db.refresh(container_inventory)
            return container_inventory

    @staticmethod
    async def delete_container_inventory(db: AsyncSession, container_inventory_id: int) -> bool:
        """Delete a container inventory record"""
        async with db.begin():
            container_inventory = await ContainerInventoryService.get_container_inventory_by_id(db, container_inventory_id)
            await db.delete(container_inventory)
            return True


class UIService:

    @staticmethod
    def get_ui_areas(db: Session) -> List[dict]:
        result = db.execute(select(Area.id, Area.code, Area.name,Area.thu_kho, Area.description,Area.address ,Area.is_active))
        return [{"id": area.id, "code": area.code, "name": area.name,"thu_kho": area.thu_kho,"description": area.description,"address": area.address, "is_active": area.is_active} for area in result]

    @staticmethod
    def get_ui_locations(db: Session) -> List[dict]:
        result = db.execute(select(Location.id, Location.code, Location.name, Location.is_active))
        return [{"id": loc.id, "code": loc.code, "name": loc.name, "is_active": loc.is_active} for loc in result]


class TransactionDashboardService:
    """Service for unified transaction dashboard across all transaction types"""

    @staticmethod
    async def get_transactions_dashboard(
        db: AsyncSession,
        page: int = 1,
        size: int = 20,
        transaction_type: Optional[str] = None,
        request_code: Optional[str] = None,
        industry: Optional[str] = None,
        production_team: Optional[str] = None,
        from_warehouse: Optional[int] = None,
        to_warehouse: Optional[int] = None,
        status: Optional[bool] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        updated_by: Optional[str] = None
    ) -> dict:
        """
        Get unified dashboard of all transactions (IMPORT, TRANSFER, EXPORT)
        
        Transaction types:
        - IMPORT: WarehouseImportRequirement (uses wo_code as request_code)
        - TRANSFER: InternalWarehouseTransferRequest (uses ma_yc_cknb as request_code, doc_entry from SAP)
        - EXPORT: OutboundShipmentRequestOnOrder (uses ma_yc_xk as request_code, doc_entry from SAP)
        """
        from sqlalchemy import union_all, literal, cast, String, Integer
        from datetime import datetime

        transactions = []

        # Build IMPORT query
        if not transaction_type or transaction_type.upper() == "IMPORT":
            import_query = select(
                WarehouseImportRequirement.id,
                literal("IMPORT").label("transaction_type"),
                WarehouseImportRequirement.wo_code.label("request_code"),
                literal(None).cast(Integer).label("doc_entry"),
                WarehouseImportRequirement.branch,
                WarehouseImportRequirement.production_team,
                literal(None).cast(Integer).label("from_warehouse"),
                literal(None).cast(Integer).label("to_warehouse"),
                WarehouseImportRequirement.updated_date.label("created_date"),
                WarehouseImportRequirement.status,
                WarehouseImportRequirement.updated_by,
                WarehouseImportRequirement.updated_date,
                WarehouseImportRequirement.client_id,
                WarehouseImportRequirement.lot_number,
                literal(None).cast(String).label("don_vi_linh"),
                literal(None).cast(String).label("don_vi_nhan"),
                WarehouseImportRequirement.note
            ).where(WarehouseImportRequirement.deleted_at.is_(None))

            # Apply filters for IMPORT
            if request_code:
                import_query = import_query.where(WarehouseImportRequirement.wo_code.ilike(f"%{request_code}%"))
            if industry:
                import_query = import_query.where(WarehouseImportRequirement.branch.ilike(f"%{industry}%"))
            if production_team:
                import_query = import_query.where(WarehouseImportRequirement.production_team.ilike(f"%{production_team}%"))
            if status is not None:
                import_query = import_query.where(WarehouseImportRequirement.status == status)
            if updated_by:
                import_query = import_query.where(WarehouseImportRequirement.updated_by.ilike(f"%{updated_by}%"))
            if from_date:
                try:
                    from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                    import_query = import_query.where(WarehouseImportRequirement.updated_date >= from_dt)
                except:
                    pass
            if to_date:
                try:
                    to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                    import_query = import_query.where(WarehouseImportRequirement.updated_date <= to_dt)
                except:
                    pass

            result = await db.execute(import_query)
            transactions.extend(result.all())

        # Build TRANSFER query
        if not transaction_type or transaction_type.upper() == "TRANSFER":
            transfer_query = select(
                InternalWarehouseTransferRequest.id,
                literal("TRANSFER").label("transaction_type"),
                InternalWarehouseTransferRequest.ma_yc_cknb.label("request_code"),
                literal(None).cast(Integer).label("doc_entry"),
                literal(None).cast(String).label("industry"),
                literal(None).cast(String).label("production_team"),
                InternalWarehouseTransferRequest.tu_kho.label("from_warehouse"),
                InternalWarehouseTransferRequest.den_kho.label("to_warehouse"),
                InternalWarehouseTransferRequest.updated_date.label("created_date"),
                InternalWarehouseTransferRequest.status,
                InternalWarehouseTransferRequest.updated_by,
                InternalWarehouseTransferRequest.updated_date,
                literal(None).cast(String).label("client_id"),
                literal(None).cast(String).label("lot_number"),
                InternalWarehouseTransferRequest.don_vi_linh,
                InternalWarehouseTransferRequest.don_vi_nhan,
                InternalWarehouseTransferRequest.note
            ).where(InternalWarehouseTransferRequest.deleted_at.is_(None))

            # Apply filters for TRANSFER
            if request_code:
                transfer_query = transfer_query.where(InternalWarehouseTransferRequest.ma_yc_cknb.ilike(f"%{request_code}%"))
            if from_warehouse:
                transfer_query = transfer_query.where(InternalWarehouseTransferRequest.tu_kho == from_warehouse)
            if to_warehouse:
                transfer_query = transfer_query.where(InternalWarehouseTransferRequest.den_kho == to_warehouse)
            if status is not None:
                transfer_query = transfer_query.where(InternalWarehouseTransferRequest.status == status)
            if updated_by:
                transfer_query = transfer_query.where(InternalWarehouseTransferRequest.updated_by.ilike(f"%{updated_by}%"))
            if from_date:
                try:
                    from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                    transfer_query = transfer_query.where(InternalWarehouseTransferRequest.updated_date >= from_dt)
                except:
                    pass
            if to_date:
                try:
                    to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                    transfer_query = transfer_query.where(InternalWarehouseTransferRequest.updated_date <= to_dt)
                except:
                    pass

            result = await db.execute(transfer_query)
            transactions.extend(result.all())

        # Build EXPORT query
        if not transaction_type or transaction_type.upper() == "EXPORT":
            export_query = select(
                OutboundShipmentRequestOnOrder.id,
                literal("EXPORT").label("transaction_type"),
                OutboundShipmentRequestOnOrder.ma_yc_xk.label("request_code"),
                literal(None).cast(Integer).label("doc_entry"),
                literal(None).cast(String).label("industry"),
                literal(None).cast(String).label("production_team"),
                OutboundShipmentRequestOnOrder.kho_xuat.label("from_warehouse"),
                OutboundShipmentRequestOnOrder.xuat_toi.label("to_warehouse"),
                OutboundShipmentRequestOnOrder.updated_date.label("created_date"),
                OutboundShipmentRequestOnOrder.status,
                OutboundShipmentRequestOnOrder.updated_by,
                OutboundShipmentRequestOnOrder.updated_date,
                literal(None).cast(String).label("client_id"),
                literal(None).cast(String).label("lot_number"),
                OutboundShipmentRequestOnOrder.don_vi_linh,
                OutboundShipmentRequestOnOrder.don_vi_nhan,
                OutboundShipmentRequestOnOrder.note
            ).where(OutboundShipmentRequestOnOrder.deleted_at.is_(None))

            # Apply filters for EXPORT
            if request_code:
                export_query = export_query.where(OutboundShipmentRequestOnOrder.ma_yc_xk.ilike(f"%{request_code}%"))
            if from_warehouse:
                export_query = export_query.where(OutboundShipmentRequestOnOrder.kho_xuat == from_warehouse)
            if to_warehouse:
                export_query = export_query.where(OutboundShipmentRequestOnOrder.xuat_toi == to_warehouse)
            if status is not None:
                export_query = export_query.where(OutboundShipmentRequestOnOrder.status == status)
            if updated_by:
                export_query = export_query.where(OutboundShipmentRequestOnOrder.updated_by.ilike(f"%{updated_by}%"))
            if from_date:
                try:
                    from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                    export_query = export_query.where(OutboundShipmentRequestOnOrder.updated_date >= from_dt)
                except:
                    pass
            if to_date:
                try:
                    to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                    export_query = export_query.where(OutboundShipmentRequestOnOrder.updated_date <= to_dt)
                except:
                    pass

            result = await db.execute(export_query)
            transactions.extend(result.all())

        # Sort by created_date descending
        transactions.sort(key=lambda x: x.created_date if x.created_date else datetime.min, reverse=True)

        # Calculate pagination
        total_items = len(transactions)
        total_pages = (total_items + size - 1) // size if total_items > 0 else 1
        start_idx = (page - 1) * size
        end_idx = start_idx + size
        paginated_transactions = transactions[start_idx:end_idx]

        # Convert to dict format
        data = []
        for txn in paginated_transactions:
            data.append({
                "id": txn.id,
                "transaction_type": txn.transaction_type,
                "request_code": txn.request_code,
                "doc_entry": txn.doc_entry,
                "industry": txn.industry,
                "production_team": txn.production_team,
                "from_warehouse": txn.from_warehouse,
                "to_warehouse": txn.to_warehouse,
                "created_date": txn.created_date.isoformat() if txn.created_date else None,
                "status": txn.status,
                "updated_by": txn.updated_by,
                "updated_date": txn.updated_date.isoformat() if txn.updated_date else None,
                "po_number": txn.po_number,
                "client_id": txn.client_id,
                "lot_number": txn.lot_number,
                "don_vi_linh": txn.don_vi_linh,
                "don_vi_nhan": txn.don_vi_nhan,
                "note": txn.note
            })

        return {
            "data": data,
            "meta": {
                "page": page,
                "size": size,
                "total_items": total_items,
                "total_pages": total_pages
            }
        }
