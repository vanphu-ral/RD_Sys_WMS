from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class WarehouseTransferBase(BaseModel):
    requirement_code: str = Field(..., max_length=30)
    number_of_pallet: int = Field(..., ge=0)
    number_of_box: int = Field(..., ge=0)
    total_quantity: int = Field(..., ge=0)
    status: str = Field(..., max_length=50)
    source_warehouse: int = Field(..., gt=0)
    destination_warehouse: int = Field(..., gt=0)
    note: Optional[str] = Field(None, max_length=255)

class WarehouseTransferCreate(WarehouseTransferBase):
    # Không bao gồm created_by, updated_by, tenant_id - sẽ được fill từ auth
    pass

class WarehouseTransferUpdate(BaseModel):
    requirement_code: Optional[str] = Field(None, max_length=30)
    number_of_pallet: Optional[int] = Field(None, ge=0)
    number_of_box: Optional[int] = Field(None, ge=0)
    total_quantity: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None, max_length=50)
    source_warehouse: Optional[int] = Field(None, gt=0)
    destination_warehouse: Optional[int] = Field(None, gt=0)
    note: Optional[str] = Field(None, max_length=255)

class WarehouseTransferInDBBase(WarehouseTransferBase):
    id: int
    created_at: datetime
    created_by: str
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    tenant_id: str
    
    class Config:
        orm_mode = True

class WarehouseTransfer(WarehouseTransferInDBBase):
    pass

class WarehouseTransferInDB(WarehouseTransferInDBBase):
    pass

# WarehouseTransferPallet schemas
class WarehouseTransferPalletBase(BaseModel):
    warehouse_transfer_gc_requirement_id: int = Field(..., gt=0)
    pallet_info_detail_id: int = Field(..., gt=0)

class WarehouseTransferPalletCreate(WarehouseTransferPalletBase):
    pass

class WarehouseTransferPalletUpdate(BaseModel):
    warehouse_transfer_gc_requirement_id: Optional[int] = Field(None, gt=0)
    pallet_info_detail_id: Optional[int] = Field(None, gt=0)

class WarehouseTransferPalletInDBBase(WarehouseTransferPalletBase):
    id: int
    created_at: datetime
    created_by: str
    
    class Config:
        orm_mode = True
        from_attributes = True

class WarehouseTransferPallet(WarehouseTransferPalletInDBBase):
    pass

class WarehouseTransferPalletInDB(WarehouseTransferPalletInDBBase):
    pass


# WarehouseTransferInventory schemas
class WarehouseTransferInventoryBase(BaseModel):
    warehouse_transfer_gc_requirement_id: int = Field(..., gt=0)
    inventory_id: int = Field(..., gt=0)

class WarehouseTransferInventoryCreate(WarehouseTransferInventoryBase):
    pass

class WarehouseTransferInventoryUpdate(BaseModel):
    warehouse_transfer_gc_requirement_id: Optional[int] = Field(None, gt=0)
    inventory_id: Optional[int] = Field(None, gt=0)

class WarehouseTransferInventoryInDBBase(WarehouseTransferInventoryBase):
    id: int
    created_at: datetime
    created_by: str
    
    class Config:
        orm_mode = True
        from_attributes = True

class WarehouseTransferInventory(WarehouseTransferInventoryInDBBase):
    pass

class WarehouseTransferInventoryInDB(WarehouseTransferInventoryInDBBase):
    pass


# Inventory detail for nested in pallet
class InventoryDetail(BaseModel):
    id: int
    identifier: Optional[str] = None
    serial_pallet: Optional[str] = None
    location_id: Optional[int] = None
    parent_location_id: Optional[int] = None
    last_location_id: Optional[int] = None
    parent_inventory_id: Optional[int] = None
    expiration_date: Optional[datetime] = None
    received_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None
    updated_by: Optional[str] = None
    calculated_status: Optional[str] = None
    manufacturing_date: Optional[datetime] = None
    initial_quantity: Optional[int] = None
    available_quantity: Optional[int] = None
    quantity: Optional[int] = None
    name: Optional[str] = None
    sap_code: Optional[str] = None
    po: Optional[str] = None
    lot: Optional[str] = None
    vendor: Optional[str] = None
    msd_level: Optional[str] = None
    comments: Optional[str] = None
    workshop_code: Optional[str] = None

    class Config:
        from_attributes = True


# WarehouseTransfer with nested pallets and inventories
class WarehouseTransferPalletWithDetail(WarehouseTransferPalletInDBBase):
    import_pallet_id: Optional[int] = None
    warehouse_import_requirement_id: Optional[int] = None
    serial_pallet: Optional[str] = None
    quantity_per_box: Optional[int] = None
    num_box_per_pallet: Optional[int] = None
    total_quantity: Optional[int] = None
    note: Optional[str] = None
    customer_name: Optional[str] = None
    po_number: Optional[str] = None
    date_code: Optional[str] = None
    item_no_sku: Optional[str] = None
    qdsx_no: Optional[str] = None
    production_date: Optional[str] = None
    scan_status: Optional[bool] = None
    confirmed: Optional[bool] = None
    location_id: Optional[int] = None
    inventories: List[InventoryDetail] = []

class WarehouseTransferInventoryWithDetail(WarehouseTransferInventoryInDBBase):
    inventory_identifier: Optional[str] = None
    inventory_serial_pallet: Optional[str] = None
    inventory_location_id: Optional[int] = None
    parent_location_id: Optional[int] = None
    last_location_id: Optional[int] = None
    parent_inventory_id: Optional[int] = None
    expiration_date: Optional[datetime] = None
    received_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None
    updated_by: Optional[str] = None
    calculated_status: Optional[str] = None
    manufacturing_date: Optional[datetime] = None
    initial_quantity: Optional[int] = None
    available_quantity: Optional[int] = None
    quantity: Optional[int] = None
    inventory_name: Optional[str] = None
    sap_code: Optional[str] = None
    po: Optional[str] = None
    lot: Optional[str] = None
    vendor: Optional[str] = None
    msd_level: Optional[str] = None
    comments: Optional[str] = None
    workshop_code: Optional[str] = None


class WarehouseTransferWithDetails(WarehouseTransferInDBBase):
    pallets: List[WarehouseTransferPalletWithDetail] = []
    inventories: List[WarehouseTransferInventoryWithDetail] = []

    class Config:
        from_attributes = True
        orm_mode = True

class WarehouseTransferApprovalBase(BaseModel):
    id: int
    requirement_code: str = Field(..., max_length=30)
    number_of_pallet: int = Field(..., ge=0)
    number_of_box: int = Field(..., ge=0)
    total_quantity: int = Field(..., ge=0)
    status: str = Field(..., max_length=50)
    source_warehouse: int = Field(..., gt=0)
    destination_warehouse: int = Field(..., gt=0)
    note: Optional[str] = Field(None, max_length=255)

class WarehouseTransferApprovalCreate(WarehouseTransferApprovalBase):
    # Không bao gồm created_by, updated_by, tenant_id - sẽ được fill từ auth
    pass

class WarehouseTransferApprovalUpdate(BaseModel):
    requirement_code: Optional[str] = Field(None, max_length=30)
    number_of_pallet: Optional[int] = Field(None, ge=0)
    number_of_box: Optional[int] = Field(None, ge=0)
    total_quantity: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None, max_length=50)
    source_warehouse: Optional[int] = Field(None, gt=0)
    destination_warehouse: Optional[int] = Field(None, gt=0)
    note: Optional[str] = Field(None, max_length=255)


class WarehouseTransferApprovalInDBBase(WarehouseTransferApprovalBase):
    id: int
    created_at: datetime
    created_by: str
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    tenant_id: str
    
    class Config:
        orm_mode = True

class WarehouseTransferApproval(WarehouseTransferApprovalInDBBase):
    pass

class WarehouseTransferApprovalInDB(WarehouseTransferApprovalInDBBase):
    pass