from http.client import HTTPException
from typing import List, Optional
from app.modules.inventory.service import AreaService
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select, func
from app.modules.warehouse_transfer.models import WarehouseTransferGCRequirement, WarehouseTransferGCRequirementApprove, WarehouseTransferPallet, WarehouseTransferInventory
from app.modules.warehouse_transfer.models import Tenant
from app.modules.warehouse_transfer.schemas import (
    WarehouseTransferCreate, WarehouseTransferUpdate, 
    WarehouseTransferPalletCreate, WarehouseTransferPalletUpdate, 
    WarehouseTransferInventoryCreate, WarehouseTransferInventoryUpdate, WarehouseTransferApprovalBase, WarehouseTransferApprovalCreate, WarehouseTransferApprovalUpdate
)
from app.modules.inventory.models import Inventory, ImportPalletInfo

from app.core.exceptions import NotFoundException, HTTPException

async def get_requirement(
    db: AsyncSession, 
    requirement_id: int, 
    tenant_id: str
) -> Optional[WarehouseTransferGCRequirement]:
    """Lấy một requirement bằng ID, đảm bảo thuộc về tenant hiện tại và chưa được xóa"""
    result = await db.execute(
        select(WarehouseTransferGCRequirement).where(
            and_(
                WarehouseTransferGCRequirement.id == requirement_id,
                WarehouseTransferGCRequirement.tenant_id == tenant_id,
                WarehouseTransferGCRequirement.deleted_at.is_(None)
            )
        )
    )
    return result.scalar_one_or_none()

async def get_requirements(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    source_warehouse: Optional[str] = None,
    destination_warehouse: Optional[str] = None
) -> List[WarehouseTransferGCRequirement]:
    """Lấy danh sách requirements bằng cú pháp Async chuẩn mã nguồn SQLAlchemy"""
    statement = select(WarehouseTransferGCRequirement).where(
        and_(
        )
    )
    
    if status:
        statement = statement.where(WarehouseTransferGCRequirement.status == status)
    if source_warehouse:
        statement = statement.where(WarehouseTransferGCRequirement.source_warehouse == source_warehouse)
    if destination_warehouse:
        statement = statement.where(WarehouseTransferGCRequirement.destination_warehouse == destination_warehouse)
        
    statement = statement.offset(skip).limit(limit)
    result = await db.execute(statement)
    
    return list(result.scalars().all())

async def create_requirement(
    db: AsyncSession, 
    requirement: WarehouseTransferCreate,
    tenant_id: str,
    created_by: str
) -> WarehouseTransferGCRequirement:
    """Tạo requirement mới, tự động fill tenant_id và created_by từ auth"""
    db_requirement = WarehouseTransferGCRequirement(
        **requirement.dict(),
        tenant_id=tenant_id,
        created_by=created_by
    )
    db.add(db_requirement)
    await db.commit()
    await db.refresh(db_requirement)
    return db_requirement

async def update_requirement(
    db: AsyncSession,
    requirement_id: int,
    requirement_update: WarehouseTransferUpdate,
    tenant_id: str,
    updated_by: str
) -> Optional[WarehouseTransferGCRequirement]:
    """Cập nhật requirement, tự động fill updated_by từ auth"""
    db_requirement = await get_requirement(db, requirement_id, tenant_id)
    if not db_requirement:
        return None
    
    update_data = requirement_update.dict(exclude_unset=True)
    update_data["updated_by"] = updated_by
    
    for field, value in update_data.items():
        setattr(db_requirement, field, value)
    
    await db.commit()
    await db.refresh(db_requirement)
    return db_requirement

async def delete_requirement(
    db: AsyncSession,
    requirement_id: int,
    tenant_id: str,
    deleted_by: str
) -> Optional[WarehouseTransferGCRequirement]:
    """Xóa mềm requirement, tự động fill deleted_by và deleted_at"""
    db_requirement = await get_requirement(db, requirement_id, tenant_id)
    if not db_requirement:
        return None
    
    db_requirement.deleted_at = func.now()
    db_requirement.deleted_by = deleted_by
    await db.commit()
    await db.refresh(db_requirement)
    return db_requirement

async def get_requirement_with_details(
    db: AsyncSession, 
    requirement_id: int, 
    tenant_id: str
) -> Optional[dict]:
    """Lấy requirement kèm pallets và inventories đã được tối ưu cấu trúc phản hồi"""
    
    # 1. Truy vấn Requirement chính
    result = await db.execute(
        select(WarehouseTransferGCRequirement).where(
            and_(
                WarehouseTransferGCRequirement.id == requirement_id,
                WarehouseTransferGCRequirement.deleted_at.is_(None)
            )
        )
    )
    requirement = result.scalar_one_or_none()
    if not requirement:
        return None
    
    # 2. Get pallets với import_pallet_info detail
    pallets_result = await db.execute(
        select(WarehouseTransferPallet, ImportPalletInfo).outerjoin(
            ImportPalletInfo,
            WarehouseTransferPallet.pallet_info_detail_id == ImportPalletInfo.id
        ).where(
            WarehouseTransferPallet.warehouse_transfer_gc_requirement_id == requirement_id
        )
    )
    pallets_data = pallets_result.all()
    
    # 3. Get inventories với inventory detail
    inventories_result = await db.execute(
        select(WarehouseTransferInventory, Inventory).outerjoin(
            Inventory,
            WarehouseTransferInventory.inventory_id == Inventory.id
        ).where(
            WarehouseTransferInventory.warehouse_transfer_gc_requirement_id == requirement_id
        )
    )
    inventories_data = inventories_result.all()
    
    # --- XỬ LÝ DANH SÁCH PALLETS (Bắt buộc unpack tuple: p, import_pallet) ---
    pallets_list = []
    for p, import_pallet in pallets_data: 
        pallet_dict = {
            "id": p.id,
            "warehouse_transfer_gc_requirement_id": p.warehouse_transfer_gc_requirement_id,
            "pallet_info_detail_id": p.pallet_info_detail_id,
            "created_at": p.created_at,
            "created_by": p.created_by,
            
            # Khởi tạo các trường phẳng mặc định là None nếu outerjoin không tìm thấy bản ghi
            "import_pallet_id": None,
            "warehouse_import_requirement_id": None,
            "serial_pallet": None,
            "quantity_per_box": None,
            "num_box_per_pallet": None,
            "total_quantity": None,
            "note": None,
            "customer_name": None,
            "po_number": None,
            "date_code": None,
            "item_no_sku": None,
            "qdsx_no": None,
            "production_date": None,
            "scan_status": None,
            "confirmed": None,
            "location_id": None,
            "inventories": [],
        }
        
        # Nếu bảng liên kết ImportPalletInfo có dữ liệu, thực hiện gán vào cấu trúc phẳng
        if import_pallet:
            pallet_dict["import_pallet_id"] = import_pallet.id
            pallet_dict["warehouse_import_requirement_id"] = import_pallet.warehouse_import_requirement_id
            pallet_dict["serial_pallet"] = import_pallet.serial_pallet
            pallet_dict["quantity_per_box"] = import_pallet.quantity_per_box
            pallet_dict["num_box_per_pallet"] = import_pallet.num_box_per_pallet
            pallet_dict["total_quantity"] = import_pallet.total_quantity
            pallet_dict["note"] = import_pallet.note
            pallet_dict["customer_name"] = import_pallet.customer_name
            pallet_dict["po_number"] = import_pallet.po_number
            pallet_dict["date_code"] = import_pallet.date_code
            pallet_dict["item_no_sku"] = import_pallet.item_no_sku
            pallet_dict["qdsx_no"] = import_pallet.qdsx_no
            pallet_dict["production_date"] = import_pallet.production_date
            pallet_dict["scan_status"] = import_pallet.scan_status
            pallet_dict["confirmed"] = import_pallet.confirmed
            pallet_dict["location_id"] = import_pallet.location_id

            # Get inventories where serial_pallet matches this pallet's serial_pallet
            if import_pallet.serial_pallet:
                inv_result = await db.execute(
                    select(Inventory).where(
                        Inventory.serial_pallet == import_pallet.serial_pallet
                    )
                )
                inv_items = inv_result.scalars().all()
                pallet_dict["inventories"] = [
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
                        "workshop_code": inv.workshop_code,
                    }
                    for inv in inv_items
                ]

        pallets_list.append(pallet_dict)
    
    inventories_list = []
    for i, inv in inventories_data:
        inv_dict = {
            "id": i.id,
            "warehouse_transfer_gc_requirement_id": i.warehouse_transfer_gc_requirement_id,
            "inventory_id": i.inventory_id,
            "created_at": i.created_at,
            "created_by": i.created_by,
            
            # Khởi tạo các trường phẳng từ bảng Inventory
            "inventory_identifier": None,
            "inventory_serial_pallet": None,
            "inventory_location_id": None,
            "parent_location_id": None,
            "last_location_id": None,
            "parent_inventory_id": None,
            "expiration_date": None,
            "received_date": None,
            "updated_date": None,
            "updated_by": None,
            "calculated_status": None,
            "manufacturing_date": None,
            "initial_quantity": None,
            "available_quantity": None,
            "quantity": None,
            "inventory_name": None,
            "sap_code": None,
            "po": None,
            "lot": None,
            "vendor": None,
            "msd_level": None,
            "comments": None,
            "workshop_code": None,
        }
        
        if inv:
            inv_dict["inventory_identifier"] = inv.identifier
            inv_dict["inventory_serial_pallet"] = inv.serial_pallet
            inv_dict["inventory_location_id"] = inv.location_id
            inv_dict["parent_location_id"] = inv.parent_location_id
            inv_dict["last_location_id"] = inv.last_location_id
            inv_dict["parent_inventory_id"] = inv.parent_inventory_id
            inv_dict["expiration_date"] = inv.expiration_date.isoformat() if inv.expiration_date else None
            inv_dict["received_date"] = inv.received_date.isoformat() if inv.received_date else None
            inv_dict["updated_date"] = inv.updated_date.isoformat() if inv.updated_date else None
            inv_dict["updated_by"] = inv.updated_by
            inv_dict["calculated_status"] = inv.calculated_status
            inv_dict["manufacturing_date"] = inv.manufacturing_date.isoformat() if inv.manufacturing_date else None
            inv_dict["initial_quantity"] = inv.initial_quantity
            inv_dict["available_quantity"] = inv.available_quantity
            inv_dict["quantity"] = inv.quantity
            inv_dict["inventory_name"] = inv.name
            inv_dict["sap_code"] = inv.sap_code
            inv_dict["po"] = inv.po
            inv_dict["lot"] = inv.lot
            inv_dict["vendor"] = inv.vendor
            inv_dict["msd_level"] = inv.msd_level
            inv_dict["comments"] = inv.comments
            inv_dict["workshop_code"] = inv.workshop_code

        inventories_list.append(inv_dict)
    
    # 4. Trả về cấu trúc phản hồi hoàn chỉnh
    return {
        "id": requirement.id,
        "requirement_code": requirement.requirement_code,
        "number_of_pallet": requirement.number_of_pallet,
        "number_of_box": requirement.number_of_box,
        "total_quantity": requirement.total_quantity,
        "status": requirement.status,
        "source_warehouse": requirement.source_warehouse,
        "destination_warehouse": requirement.destination_warehouse,
        "note": requirement.note,
        "created_at": requirement.created_at,
        "created_by": requirement.created_by,
        "updated_at": requirement.updated_at,
        "updated_by": requirement.updated_by,
        "deleted_at": requirement.deleted_at,
        "deleted_by": requirement.deleted_by,
        "tenant_id": requirement.tenant_id,
        "pallets": pallets_list,
        "inventories": inventories_list
    }

# WarehouseTransferPallet CRUD
async def get_pallet(
    db: AsyncSession,
    pallet_id: int
) -> Optional[WarehouseTransferPallet]:
    """Lấy một pallet bằng ID, đảm bảo thuộc về tenant hiện tại"""
    result = await db.execute(
        select(WarehouseTransferPallet).join(
            WarehouseTransferGCRequirement, 
            WarehouseTransferPallet.warehouse_transfer_gc_requirement_id == WarehouseTransferGCRequirement.id
        ).where(
            and_(
                WarehouseTransferPallet.id == pallet_id
            )
        )
    )
    return result.scalar_one_or_none()

async def get_pallets(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    requirement_id: Optional[int] = None,
    tenant_id: str = None
) -> List[WarehouseTransferPallet]:
    """Lấy danh sách pallets, có thể lọc theo requirement_id và tenant_id"""
    query = select(WarehouseTransferPallet).join(
        WarehouseTransferGCRequirement,
        WarehouseTransferPallet.warehouse_transfer_gc_requirement_id == WarehouseTransferGCRequirement.id
    ).filter(
        WarehouseTransferGCRequirement.tenant_id == tenant_id,
        WarehouseTransferGCRequirement.deleted_at.is_(None)
    )
    
    if requirement_id:
        query = query.filter(WarehouseTransferPallet.warehouse_transfer_gc_requirement_id == requirement_id)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())

async def create_pallet(
    db: AsyncSession,
    pallet: WarehouseTransferPalletCreate,
    tenant_id: str,
    created_by: str
) -> WarehouseTransferPallet:
    """Tạo pallet mới, tự động fill created_by từ auth"""
    db_pallet = WarehouseTransferPallet(
        **pallet.dict(),
        created_by=created_by
    )
    db.add(db_pallet)
    await db.commit()
    await db.refresh(db_pallet)
    return db_pallet

async def update_pallet(
    db: AsyncSession,
    pallet_id: int,
    pallet_update: WarehouseTransferPalletUpdate,
    tenant_id: str,
    updated_by: str
) -> Optional[WarehouseTransferPallet]:
    """Cập nhật pallet, tự động fill updated_by từ auth"""
    db_pallet = await get_pallet(db, pallet_id, tenant_id)
    if not db_pallet:
        return None
    
    update_data = pallet_update.dict(exclude_unset=True)
    update_data["updated_by"] = updated_by
    for field, value in update_data.items():
        setattr(db_pallet, field, value)
    
    await db.commit()
    await db.refresh(db_pallet)
    return db_pallet

async def delete_pallet(
    db: AsyncSession,
    pallet_id: int
) -> Optional[WarehouseTransferPallet]:
    """Xóa pallet (hard delete) - Không lọc theo tenant_id"""
    
    db_pallet = await get_pallet(db, pallet_id) 
    
    if not db_pallet:
        return None
    
    await db.delete(db_pallet)
    await db.commit()
    return None


# WarehouseTransferInventory CRUD
async def get_inventory(
    db: AsyncSession,
    inventory_id: int,
) -> Optional[WarehouseTransferInventory]:
    """Lấy một inventory bằng ID, đảm bảo thuộc về tenant hiện tại"""
    result = await db.execute(
        select(WarehouseTransferInventory).join(
            WarehouseTransferGCRequirement,
            WarehouseTransferInventory.warehouse_transfer_gc_requirement_id == WarehouseTransferGCRequirement.id
        ).where(
            and_(
                WarehouseTransferInventory.id == inventory_id,
            )
        )
    )
    return result.scalar_one_or_none()

async def get_inventories(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    requirement_id: Optional[int] = None,
    tenant_id: str = None
) -> List[WarehouseTransferInventory]:
    """Lấy danh sách inventory, có thể lọc theo requirement_id và tenant_id"""
    query = select(WarehouseTransferInventory).join(
        WarehouseTransferGCRequirement,
        WarehouseTransferInventory.warehouse_transfer_gc_requirement_id == WarehouseTransferGCRequirement.id
    ).filter(
        WarehouseTransferGCRequirement.tenant_id == tenant_id,
        WarehouseTransferGCRequirement.deleted_at.is_(None)
    )
    
    if requirement_id:
        query = query.filter(WarehouseTransferInventory.warehouse_transfer_gc_requirement_id == requirement_id)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())

async def create_inventory(
    db: AsyncSession,
    inventory: WarehouseTransferInventoryCreate,
    tenant_id: str,
    created_by: str
) -> WarehouseTransferInventory:
    """Tạo inventory mới, tự động fill created_by từ auth"""
    db_inventory = WarehouseTransferInventory(
        **inventory.dict(),
        created_by=created_by
    )
    db.add(db_inventory)
    await db.commit()
    await db.refresh(db_inventory)
    return db_inventory

async def update_inventory(
    db: AsyncSession,
    inventory_id: int,
    inventory_update: WarehouseTransferInventoryUpdate,
    tenant_id: str,
    updated_by: str
) -> Optional[WarehouseTransferInventory]:
    """Cập nhật inventory, tự động fill updated_by từ auth"""
    db_inventory = await get_inventory(db, inventory_id, tenant_id)
    if not db_inventory:
        return None
    
    update_data = inventory_update.dict(exclude_unset=True)
    update_data["updated_by"] = updated_by
    for field, value in update_data.items():
        setattr(db_inventory, field, value)
    
    await db.commit()
    await db.refresh(db_inventory)
    return db_inventory

async def delete_inventory(
    db: AsyncSession,
    inventory_id: int,
) -> Optional[WarehouseTransferInventory]:
    """Xóa inventory (hard delete)"""
    db_inventory = await get_inventory(db, inventory_id)
    if not db_inventory:
        return None
    
    await db.delete(db_inventory)
    await db.commit()
    return None

async def create_requirement_approval(
    db: AsyncSession, 
    requirement: WarehouseTransferApprovalCreate,
    created_by: str
) -> WarehouseTransferGCRequirementApprove:

    requirement_data = requirement.dict()
    area_id = requirement_data.get('destination_warehouse')
    if area_id is not None:
        try:
            area = await AreaService.get_area_by_id(db, area_id)
            requirement_data["tenant_id"] = area.tenant_id
        except NotFoundException:
            raise HTTPException(
                status_code=400,
                detail=f"Area with ID {area_id} does not exist"
            )
    else:
        requirement_data["tenant_id"] = None
    db_requirement = WarehouseTransferGCRequirementApprove(
        **requirement_data,
        created_by=created_by
    )
    db.add(db_requirement)
    await db.commit()
    await db.refresh(db_requirement)
    return db_requirement


async def get_requirement_approval(
    db: AsyncSession, 
    requirement_id: int, 
    tenant_id: str
) -> Optional[WarehouseTransferGCRequirementApprove]:
    """Lấy một requirement bằng ID, đảm bảo thuộc về tenant hiện tại và chưa được xóa"""
    result = await db.execute(
        select(WarehouseTransferGCRequirementApprove).where(
            and_(
                WarehouseTransferGCRequirementApprove.id == requirement_id,
                WarehouseTransferGCRequirementApprove.tenant_id == tenant_id,
                WarehouseTransferGCRequirementApprove.deleted_at.is_(None)
            )
        )
    )
    return result.scalar_one_or_none()


async def get_requirement_approvals(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    source_warehouse: Optional[str] = None,
    destination_warehouse: Optional[str] = None
) -> List[WarehouseTransferGCRequirementApprove]:
    """Lấy danh sách requirement approvals"""
    statement = select(WarehouseTransferGCRequirementApprove).where(
        and_(
        )
    )
    
    if status:
        statement = statement.where(WarehouseTransferGCRequirementApprove.status == status)
    if source_warehouse:
        statement = statement.where(WarehouseTransferGCRequirementApprove.source_warehouse == source_warehouse)
    if destination_warehouse:
        statement = statement.where(WarehouseTransferGCRequirementApprove.destination_warehouse == destination_warehouse)
        
    statement = statement.offset(skip).limit(limit)
    result = await db.execute(statement)
    
    return list(result.scalars().all())


async def update_requirement_approval(
    db: AsyncSession,
    requirement_id: int,
    requirement_update: WarehouseTransferApprovalUpdate,
    tenant_id: str,
    updated_by: str
) -> Optional[WarehouseTransferGCRequirementApprove]:
    """Cập nhật requirement, tự động fill updated_by từ auth"""
    db_requirement = await get_requirement_approval(db, requirement_id, tenant_id)
    if not db_requirement:
        return None
    
    update_data = requirement_update.dict(exclude_unset=True)
    update_data["updated_by"] = updated_by
    
    for field, value in update_data.items():
        setattr(db_requirement, field, value)
    
    await db.commit()
    await db.refresh(db_requirement)
    return db_requirement


async def get_requirement_approval_with_details(
    db: AsyncSession, 
    requirement_id: int, 
    tenant_id: str
) -> Optional[dict]:
    """Lấy requirement kèm pallets và inventories đã được tối ưu cấu trúc phản hồi"""
    
    # 1. Truy vấn Requirement chính
    result = await db.execute(
        select(WarehouseTransferGCRequirementApprove).where(
            and_(
                WarehouseTransferGCRequirementApprove.id == requirement_id,
                # WarehouseTransferGCRequirementApprove.tenant_id == tenant_id,
                WarehouseTransferGCRequirementApprove.deleted_at.is_(None)
            )
        )
    )
    requirement = result.scalar_one_or_none()
    if not requirement:
        return None
    
    # 2. Get pallets với import_pallet_info detail
    pallets_result = await db.execute(
        select(WarehouseTransferPallet, ImportPalletInfo).outerjoin(
            ImportPalletInfo,
            WarehouseTransferPallet.pallet_info_detail_id == ImportPalletInfo.id
        ).where(
            WarehouseTransferPallet.warehouse_transfer_gc_requirement_id == requirement_id
        )
    )
    pallets_data = pallets_result.all()
    
    # 3. Get inventories với inventory detail
    inventories_result = await db.execute(
        select(WarehouseTransferInventory, Inventory).outerjoin(
            Inventory,
            WarehouseTransferInventory.inventory_id == Inventory.id
        ).where(
            WarehouseTransferInventory.warehouse_transfer_gc_requirement_id == requirement_id
        )
    )
    inventories_data = inventories_result.all()
    
    # --- XỬ LÝ DANH SÁCH PALLETS (Bắt buộc unpack tuple: p, import_pallet) ---
    pallets_list = []
    for p, import_pallet in pallets_data: 
        pallet_dict = {
            "id": p.id,
            "warehouse_transfer_gc_requirement_id": p.warehouse_transfer_gc_requirement_id,
            "pallet_info_detail_id": p.pallet_info_detail_id,
            "created_at": p.created_at,
            "created_by": p.created_by,
            
            # Khởi tạo các trường phẳng mặc định là None nếu outerjoin không tìm thấy bản ghi
            "import_pallet_id": None,
            "warehouse_import_requirement_id": None,
            "serial_pallet": None,
            "quantity_per_box": None,
            "num_box_per_pallet": None,
            "total_quantity": None,
            "note": None,
            "customer_name": None,
            "po_number": None,
            "date_code": None,
            "item_no_sku": None,
            "qdsx_no": None,
            "production_date": None,
            "scan_status": None,
            "confirmed": None,
            "location_id": None,
            "inventories": [],
        }
        
        # Nếu bảng liên kết ImportPalletInfo có dữ liệu, thực hiện gán vào cấu trúc phẳng
        if import_pallet:
            pallet_dict["import_pallet_id"] = import_pallet.id
            pallet_dict["warehouse_import_requirement_id"] = import_pallet.warehouse_import_requirement_id
            pallet_dict["serial_pallet"] = import_pallet.serial_pallet
            pallet_dict["quantity_per_box"] = import_pallet.quantity_per_box
            pallet_dict["num_box_per_pallet"] = import_pallet.num_box_per_pallet
            pallet_dict["total_quantity"] = import_pallet.total_quantity
            pallet_dict["note"] = import_pallet.note
            pallet_dict["customer_name"] = import_pallet.customer_name
            pallet_dict["po_number"] = import_pallet.po_number
            pallet_dict["date_code"] = import_pallet.date_code
            pallet_dict["item_no_sku"] = import_pallet.item_no_sku
            pallet_dict["qdsx_no"] = import_pallet.qdsx_no
            pallet_dict["production_date"] = import_pallet.production_date
            pallet_dict["scan_status"] = import_pallet.scan_status
            pallet_dict["confirmed"] = import_pallet.confirmed
            pallet_dict["location_id"] = import_pallet.location_id

            # Get inventories where serial_pallet matches this pallet's serial_pallet
            if import_pallet.serial_pallet:
                inv_result = await db.execute(
                    select(Inventory).where(
                        Inventory.serial_pallet == import_pallet.serial_pallet
                    )
                )
                inv_items = inv_result.scalars().all()
                pallet_dict["inventories"] = [
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
                        "workshop_code": inv.workshop_code,
                    }
                    for inv in inv_items
                ]

        pallets_list.append(pallet_dict)
    
    inventories_list = []
    for i, inv in inventories_data:
        inv_dict = {
            "id": i.id,
            "warehouse_transfer_gc_requirement_id": i.warehouse_transfer_gc_requirement_id,
            "inventory_id": i.inventory_id,
            "created_at": i.created_at,
            "created_by": i.created_by,
            
            # Khởi tạo các trường phẳng từ bảng Inventory
            "inventory_identifier": None,
            "inventory_serial_pallet": None,
            "inventory_location_id": None,
            "parent_location_id": None,
            "last_location_id": None,
            "parent_inventory_id": None,
            "expiration_date": None,
            "received_date": None,
            "updated_date": None,
            "updated_by": None,
            "calculated_status": None,
            "manufacturing_date": None,
            "initial_quantity": None,
            "available_quantity": None,
            "quantity": None,
            "inventory_name": None,
            "sap_code": None,
            "po": None,
            "lot": None,
            "vendor": None,
            "msd_level": None,
            "comments": None,
            "workshop_code": None,
        }
        
        if inv:
            inv_dict["inventory_identifier"] = inv.identifier
            inv_dict["inventory_serial_pallet"] = inv.serial_pallet
            inv_dict["inventory_location_id"] = inv.location_id
            inv_dict["parent_location_id"] = inv.parent_location_id
            inv_dict["last_location_id"] = inv.last_location_id
            inv_dict["parent_inventory_id"] = inv.parent_inventory_id
            inv_dict["expiration_date"] = inv.expiration_date.isoformat() if inv.expiration_date else None
            inv_dict["received_date"] = inv.received_date.isoformat() if inv.received_date else None
            inv_dict["updated_date"] = inv.updated_date.isoformat() if inv.updated_date else None
            inv_dict["updated_by"] = inv.updated_by
            inv_dict["calculated_status"] = inv.calculated_status
            inv_dict["manufacturing_date"] = inv.manufacturing_date.isoformat() if inv.manufacturing_date else None
            inv_dict["initial_quantity"] = inv.initial_quantity
            inv_dict["available_quantity"] = inv.available_quantity
            inv_dict["quantity"] = inv.quantity
            inv_dict["inventory_name"] = inv.name
            inv_dict["sap_code"] = inv.sap_code
            inv_dict["po"] = inv.po
            inv_dict["lot"] = inv.lot
            inv_dict["vendor"] = inv.vendor
            inv_dict["msd_level"] = inv.msd_level
            inv_dict["comments"] = inv.comments
            inv_dict["workshop_code"] = inv.workshop_code

        inventories_list.append(inv_dict)
    
    # 4. Trả về cấu trúc phản hồi hoàn chỉnh
    return {
        "id": requirement.id,
        "requirement_code": requirement.requirement_code,
        "number_of_pallet": requirement.number_of_pallet,
        "number_of_box": requirement.number_of_box,
        "total_quantity": requirement.total_quantity,
        "status": requirement.status,
        "source_warehouse": requirement.source_warehouse,
        "destination_warehouse": requirement.destination_warehouse,
        "note": requirement.note,
        "created_at": requirement.created_at,
        "created_by": requirement.created_by,
        "updated_at": requirement.updated_at,
        "updated_by": requirement.updated_by,
        "deleted_at": requirement.deleted_at,
        "deleted_by": requirement.deleted_by,
        "tenant_id": requirement.tenant_id,
        "pallets": pallets_list,
        "inventories": inventories_list
    }


async def get_tenant(
    db: AsyncSession, 
) -> List[Tenant]:

    result = await db.execute(
        select(Tenant)
        )
    return result.scalars().all()