from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator


class ProductBase(BaseModel):
    """Base product schema"""
    name: str
    description: Optional[str] = None
    sku: str
    category: Optional[str] = None
    price: float
    quantity: int = 0
    min_quantity: int = 0


class ProductCreate(ProductBase):
    """Product creation schema"""
    pass


class ProductUpdate(BaseModel):
    """Product update schema"""
    name: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    min_quantity: Optional[int] = None


class Product(ProductBase):
    """Product response schema"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventoryItemBase(BaseModel):
    """Base inventory item schema"""
    product_id: int
    location_id: int
    quantity: int = 0
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None


class InventoryItemCreate(InventoryItemBase):
    """Inventory item creation schema"""
    pass


class InventoryItemUpdate(BaseModel):
    """Inventory item update schema"""
    quantity: Optional[int] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None


class InventoryItem(InventoryItemBase):
    """Inventory item response schema"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AreaResponse(BaseModel):
    """Area response schema"""
    id: int
    code: str
    name: str
    thu_kho: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    updated_by: Optional[str] = None
    updated_date: datetime = None

    class Config:
        from_attributes = True


class AreaUpdate(BaseModel):
    """Area update schema"""
    code: Optional[str] = None
    name: Optional[str] = None
    thu_kho: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class AreaListMeta(BaseModel):
    """Metadata for paginated area list"""
    page: int
    size: int
    total_items: int


class AreaListResponse(BaseModel):
    """Paginated area list response"""
    data: list[AreaResponse]
    meta: AreaListMeta


class LocationResponse(BaseModel):
    """Location response schema"""
    id: int
    code: str
    name: str
    area_id: int
    address: Optional[str] = None
    description: Optional[str] = None
    is_multi_location: Optional[bool] = None
    number_of_rack: Optional[int] = None
    number_of_rack_empty: Optional[int] = None
    parent_location_id: Optional[int] = None
    prefix_name: Optional[str] = None
    prefix_separator: Optional[str] = None
    child_location_row_count: Optional[int] = None
    child_location_column_count: Optional[int] = None
    suffix_separator: Optional[str] = None
    suffix_digit_len: Optional[int] = None
    humidity: Optional[float] = None
    temperature: Optional[float] = None
    barcode: str
    is_active: bool
    updated_by: str = None
    updated_date: datetime = None

    class Config:
        from_attributes = True


class LocationListMeta(BaseModel):
    """Metadata for paginated location list"""
    page: int
    size: int
    total_items: int


class LocationListResponse(BaseModel):
    """Paginated location list response"""
    data: list[LocationResponse]
    meta: LocationListMeta


class WarehouseImportRequirementUpdate(BaseModel):
    """Schema for updating warehouse import requirement - only fields provided will be updated"""
    po_number: Optional[str] = None
    client_id: Optional[str] = None
    inventory_code: Optional[str] = None
    inventory_name: Optional[str] = None
    number_of_pallet: Optional[int] = None
    number_of_box: Optional[int] = None
    quantity: Optional[int] = None
    box_scan_progress: Optional[int] = None
    wo_code: Optional[str] = None
    lot_number: Optional[str] = None
    production_date: Optional[str] = None
    branch: Optional[str] = None
    production_team: Optional[str] = None
    production_decision_number: Optional[str] = None
    item_no_sku: Optional[str] = None
    status: Optional[bool] = None
    approver: Optional[str] = None  # Max 10 chars to fit database String(10)
    is_check_all: Optional[bool] = None
    note: Optional[str] = None
    destination_warehouse: Optional[int] = None
    pallet_note_creation_session_id: Optional[int] = None
    inventory_code: Optional[str] = None
    created_by: Optional[str] = None  # Max 10 chars to fit database String(10)
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None  # Max 10 chars to fit database String(10)
    updated_by: Optional[str] = None  # Max 10 chars to fit database String(10)

    @field_validator('approver', 'created_by', 'deleted_by', 'updated_by')
    def validate_string_10(cls, v):
        """Validate that string fields with 10 char limit don't exceed it"""
        if v is not None and len(v) > 10:
            raise ValueError(f'Value must be 10 characters or less, got {len(v)} characters')
        return v


class GeneralInfo(BaseModel):
    """Schema for general import information"""
    po_number: Optional[str] = None
    client_id: Optional[str] = None
    inventory_code: Optional[str] = None
    inventory_name: Optional[str] = None
    wo_code: Optional[str] = None
    lot_number: Optional[str] = None
    production_date: Optional[str] = None
    note: Optional[str] = None
    create_by: Optional[str] = None
    branch: Optional[str] = None
    production_team: Optional[str] = None
    production_decision_number: Optional[str] = None
    item_no_sku: Optional[str] = None
    approver: Optional[str] = None
    destination_warehouse: Optional[int] = None
    pallet_note_creation_session_id: Optional[int] = None


class Detail(BaseModel):
    """Schema for import detail items"""
    serial_pallet: Optional[str] = None
    box_code: Optional[str] = None
    quantity: Optional[int] = None
    list_serial_items: Optional[str] = None


class WarehouseImportRequest(BaseModel):
    """Schema for warehouse import request"""
    general_info: GeneralInfo
    detail: list[Detail]


class WarehouseImportResponse(BaseModel):
    """Response schema for warehouse import"""
    id: int
    po_number: Optional[str] = None
    po_code: Optional[int] = None
    client_id: Optional[str] = None
    inventory_name: Optional[str] = None
    number_of_pallet: Optional[int] = None
    number_of_box: Optional[int] = None
    quantity: Optional[int] = None
    box_scan_progress: Optional[int] = None
    wo_code: str
    lot_number: str
    status: bool
    approved_by: Optional[str] = None
    is_check_all: bool
    note: Optional[str] = None
    updated_by: Optional[str] = None
    updated_date: datetime
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    branch: Optional[str] = None
    box_scan_progress: Optional[int] = None
    production_team: Optional[str] = None
    production_decision_number: Optional[str] = None
    item_no_sku: Optional[str] = None

    class Config:
        from_attributes = True


class WarehouseImportContainerResponse(BaseModel):
    """Response schema for warehouse import containers"""
    id: int
    warehouse_import_requirement_id: int
    serial_pallet: Optional[str] = None
    box_code: str
    box_quantity: int
    list_serial_items: Optional[str] = None
    updated_by: str
    updated_date: datetime

    class Config:
        from_attributes = True


class ContainerInventoryCreate(BaseModel):
    """Create schema for container inventories"""
    manufacturing_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    sap_code: Optional[str] = None
    po: Optional[str] = None
    lot: Optional[str] = None
    vendor: Optional[str] = None
    msd_level: Optional[str] = None
    comments: Optional[str] = None
    name: Optional[str] = None
    import_container_id: int
    inventory_identifier: str
    location_id: Optional[int] = None
    serial_pallet: Optional[str] = None
    quantity_imported: Optional[int] = None
    scan_by: Optional[str] = None
    confirmed: bool = False


class ContainerInventoryUpdate(BaseModel):
    """Update schema for container inventories"""
    manufacturing_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    sap_code: Optional[str] = None
    po: Optional[str] = None
    lot: Optional[str] = None
    vendor: Optional[str] = None
    msd_level: Optional[str] = None
    comments: Optional[str] = None
    name: Optional[str] = None
    location_id: Optional[str] = None
    serial_pallet: Optional[str] = None
    quantity_imported: Optional[int] = None
    scan_by: Optional[str] = None
    confirmed: Optional[bool] = None


class ContainerInventoryResponse(BaseModel):
    """Response schema for container inventories"""
    id: int
    manufacturing_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    sap_code: Optional[str] = None
    po: Optional[str] = None
    lot: Optional[str] = None
    vendor: Optional[str] = None
    msd_level: Optional[str] = None
    comments: Optional[str] = None
    name: Optional[str] = None
    import_container_id: int
    inventory_identifier: str
    location_id: Optional[int] = None
    serial_pallet: Optional[str] = None
    quantity_imported: Optional[int] = None
    scan_by: Optional[str] = None
    time_checked: datetime
    confirmed: bool

    class Config:
        from_attributes = True


class InventoryResponse(BaseModel):
    """Response schema for inventories"""
    id: int
    identifier: str
    serial_pallet: Optional[str] = None
    location_id: int
    parent_location_id: Optional[int] = None
    last_location_id: Optional[int] = None
    parent_inventory_id: Optional[str] = None
    expiration_date: Optional[datetime] = None
    received_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None
    updated_by: Optional[str] = None
    calculated_status: Optional[str] = None
    manufacturing_date: Optional[datetime] = None
    initial_quantity: int
    available_quantity: int
    quantity: Optional[int] = None
    name: Optional[str] = None
    sap_code: Optional[str] = None
    po: Optional[str] = None
    lot: Optional[str] = None
    vendor: Optional[str] = None
    msd_level: Optional[str] = None
    comments: Optional[str] = None

    class Config:
        from_attributes = True


class IWTRResponse(BaseModel):
    """Response schema for internal warehouse transfer requests"""
    id: int
    ma_yc_cknb: str
    tu_kho: Optional[int] = None
    den_kho: Optional[int] = None
    don_vi_linh: Optional[str] = None
    don_vi_nhan: Optional[str] = None
    ly_do_xuat_nhap: Optional[str] = None
    ngay_chung_tu: Optional[str] = None
    so_phieu_xuat: Optional[str] = None
    so_chung_tu: Optional[str] = None
    series_pgh: Optional[str] = None
    status: Optional[bool] = None
    note: Optional[str] = None
    scan_status: bool
    updated_by: Optional[str] = None
    updated_date: datetime
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None

    class Config:
        from_attributes = True


class IWTRUpdateRequest(BaseModel):
    """Schema for updating internal warehouse transfer requests - only fields provided will be updated"""
    ma_yc_cknb: Optional[str] = None
    tu_kho: Optional[int] = None
    den_kho: Optional[int] = None
    don_vi_linh: Optional[str] = None
    don_vi_nhan: Optional[str] = None
    ly_do_xuat_nhap: Optional[str] = None
    ngay_chung_tu: Optional[str] = None
    so_phieu_xuat: Optional[str] = None
    so_chung_tu: Optional[str] = None
    series_pgh: Optional[str] = None
    status: Optional[bool] = None
    note: Optional[str] = None
    scan_status: Optional[bool] = None
    updated_by: Optional[str] = None
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None


class ProductsInIWTRResponse(BaseModel):
    """Response schema for products in IWTR"""
    id: int
    internal_warehouse_transfer_requests_id: int
    product_code: str
    product_name: Optional[str] = None
    tu_kho: Optional[int] = None
    den_kho: Optional[int] = None
    total_quantity: Optional[int] = None
    dvt: Optional[str] = None
    quantity_scanned: Optional[int] = None
    updated_by: Optional[str] = None
    updated_date: datetime

    class Config:
        from_attributes = True


class InventoriesInIWTRResponse(BaseModel):
    """Response schema for inventories in IWTR"""
    id: int
    product_in_iwtr_id: int
    inventory_identifier: Optional[str] = None
    serial_pallet: Optional[str] = None
    scan_by: Optional[str] = None
    quantity_dispatched: Optional[int] = None
    scan_time: datetime
    confirmed: bool
    new_location: Optional[int] = None

    class Config:
        from_attributes = True


class IWTRFullDetailResponse(BaseModel):
    """Response schema for full IWTR details with nested products and inventories"""
    request: IWTRResponse
    products: List[ProductsInIWTRResponse]
    inventories: List[InventoriesInIWTRResponse]


class OSRResponse(BaseModel):
    """Response schema for outbound shipment requests on order"""
    id: int
    ma_yc_xk: str
    kho_xuat: Optional[int] = None
    xuat_toi: Optional[int] = None
    don_vi_linh: Optional[str] = None
    don_vi_nhan: Optional[str] = None
    ly_do_xuat_nhap: Optional[str] = None
    ngay_chung_tu: Optional[str] = None
    so_phieu_xuat: Optional[str] = None
    so_chung_tu: Optional[str] = None
    series_pgh: Optional[str] = None
    status: Optional[bool] = None
    note: Optional[str] = None
    scan_status: Optional[str] = None
    updated_by: Optional[str] = None
    updated_date: datetime
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None

    class Config:
        from_attributes = True


class OSRUpdateRequest(BaseModel):
    """Schema for updating outbound shipment requests on order - only fields provided will be updated"""
    ma_yc_xk: Optional[str] = None
    kho_xuat: Optional[int] = None
    xuat_toi: Optional[int] = None
    don_vi_linh: Optional[str] = None
    don_vi_nhan: Optional[str] = None
    ly_do_xuat_nhap: Optional[str] = None
    ngay_chung_tu: Optional[str] = None
    so_phieu_xuat: Optional[str] = None
    so_chung_tu: Optional[str] = None
    series_pgh: Optional[str] = None
    status: Optional[bool] = None
    note: Optional[str] = None
    scan_status: Optional[bool] = None
    updated_by: Optional[str] = None
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None


class ProductsInOSRResponse(BaseModel):
    """Response schema for products in OSR"""
    id: int
    outbound_shipment_request_on_order_id: int
    product_code: str
    product_name: Optional[str] = None
    total_quantity: Optional[int] = None
    dvt: Optional[str] = None
    quantity_scanned: Optional[int] = None
    updated_by: Optional[str] = None
    updated_date: datetime

    class Config:
        from_attributes = True


class InventoriesInOSRResponse(BaseModel):
    """Response schema for inventories in OSR"""
    id: int
    product_in_osr_id: int
    inventory_identifier: str
    serial_pallet: str
    scan_by: str
    quantity_dispatched: int
    scan_time: datetime
    confirmed: bool

    class Config:
        from_attributes = True


class OSRFullDetailResponse(BaseModel):
    """Response schema for full OSR details with nested products and inventories"""
    request: OSRResponse
    products: List[ProductsInOSRResponse]
    inventories: List[InventoriesInOSRResponse]


class UpdateContainerInventoryRequest(BaseModel):
    """Schema for updating container inventory - only fields provided will be updated"""
    import_container_id: int
    inventory_identifier: str
    quantity_imported: Optional[int] = None
    confirmed: Optional[bool] = None
    location_id: Optional[int] = None


class SimpleContainerInventoryUpdate(BaseModel):
    """Simplified schema for updating container inventory by ID with confirmed field"""
    id: int
    confirmed: bool


class UpdateContainerInventoryByIdRequest(BaseModel):
    """Schema for updating container inventory by ID - only fields provided will be updated"""
    id: int
    import_pallet_id: Optional[int] = None
    manufacturing_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    sap_code: Optional[str] = None
    po: Optional[str] = None
    lot: Optional[str] = None
    vendor: Optional[str] = None
    msd_level: Optional[str] = None
    comments: Optional[str] = None
    name: Optional[str] = None
    import_container_id: Optional[int] = None
    inventory_identifier: Optional[str] = None
    location_id: Optional[int] = None
    serial_pallet: Optional[str] = None
    quantity_imported: Optional[int] = None
    scan_by: Optional[str] = None
    confirmed: Optional[bool] = None
    list_serial_items: Optional[str] = None


class UpdateInventoriesInIWTRRequest(BaseModel):
    product_in_iwtr_id: int
    inventory_identifier: str
    quantity_imported: int
    confirmed: bool
    new_location: Optional[int] = None
    new_loaditon: Optional[int] = None
    sap_code: Optional[str] = None
    name: Optional[str] = None


class BulkUpdateContainerInventoryRequest(BaseModel):

    updates: list[UpdateContainerInventoryRequest]


class BulkSimpleContainerInventoryUpdate(BaseModel):
    """Bulk update schema for simplified container inventory updates"""
    updates: list[SimpleContainerInventoryUpdate]


class BulkUpdateContainerInventoryByIdRequest(BaseModel):
    """Schema for bulk updating container inventory by ID"""
    updates: list[UpdateContainerInventoryByIdRequest]


class UpdateImportPalletInfoRequest(BaseModel):
    """Schema for updating import pallet info"""
    id: int
    serial_pallet: Optional[str] = None
    quantity_per_box: Optional[int] = None
    num_box_per_pallet: Optional[int] = None
    total_quantity: Optional[int] = None
    po_number: Optional[str] = None
    customer_name: Optional[str] = None
    production_decision_number: Optional[str] = None
    item_no_sku: Optional[str] = None
    date_code: Optional[str] = None
    note: Optional[str] = None
    scan_status: Optional[bool] = None
    confirmed: Optional[bool] = None
    location_id: Optional[int] = None


class BulkUpdateImportPalletInfoRequest(BaseModel):
    """Schema for bulk updating import pallet info"""
    updates: list[UpdateImportPalletInfoRequest]


class BulkUpdateInventoriesInIWTRRequest(BaseModel):

    updates: list[UpdateInventoriesInIWTRRequest]


class UpdateInventoriesInOSRRequest(BaseModel):
    product_in_osr_id: int
    inventory_identifier: str
    quantity_imported: int
    confirmed: bool


class BulkUpdateInventoriesInOSRRequest(BaseModel):

    updates: list[UpdateInventoriesInOSRRequest]


# Schemas for WMS Import Requirements API


class BoxInfo(BaseModel):
    """Schema for box information in pallet"""
    box_code: str
    quantity: int
    note: Optional[str] = None
    list_serial_items: Optional[str] = None


class PalletInfo(BaseModel):
    """Schema for pallet information"""
    serial_pallet: str
    quantity_per_box: Optional[int] = None
    num_box_per_pallet: Optional[int] = None
    total_quantity: Optional[int] = None
    po_number: Optional[str] = None
    customer_name: Optional[str] = None
    production_decision_number: Optional[str] = None
    item_no_sku: Optional[str] = None
    date_code: Optional[str] = None
    note: Optional[str] = None
    location_id: Optional[int] = None
    list_box: list[BoxInfo]


class WMSGeneralInfo(BaseModel):
    """Schema for WMS general import information"""
    client_id: Optional[str] = None
    inventory_code: Optional[str] = None
    inventory_name: Optional[str] = None
    wo_code: str
    production_date: Optional[str] = None
    lot_number: str
    note: Optional[str] = None
    created_by: Optional[str] = None
    branch: Optional[str] = None
    production_team: Optional[str] = None
    number_of_pallet: Optional[int] = None
    number_of_box: Optional[int] = None
    quantity: Optional[int] = None
    destination_warehouse: Optional[int] = None
    pallet_note_creation_id: Optional[int] = None
    item_no_sku: Optional[str] = None
    list_pallet: list[PalletInfo]


class WMSImportRequest(BaseModel):
    """Schema for WMS warehouse import request"""
    general_info: WMSGeneralInfo


class WMSImportResponse(BaseModel):
     """Response schema for WMS warehouse import"""
     success: bool


class WarehouseNoteInfoApprovalCreate(BaseModel):
     """Create schema for warehouse note info approval"""
     ma_lenh_san_xuat: Optional[str] = None
     so_phieu_xuat: Optional[str] = None
     so_chung_tu: Optional[str] = None
     series_pgh: Optional[str] = None
     ngay_chung_tu: Optional[str] = None
     ly_do_xuat_nhap: Optional[str] = None
     don_vi_linh: Optional[str] = None
     don_vi_nhan: Optional[str] = None
     note: Optional[str] = None
     status: Optional[bool] = None
     approved_by: Optional[str] = None
     created_by: Optional[str] = None
     updated_by: Optional[str] = None


class WarehouseNoteInfoApprovalResponse(BaseModel):
     """Response schema for warehouse note info approval"""
     id: int
     ma_lenh_san_xuat: Optional[str] = None
     so_phieu_xuat: Optional[str] = None
     so_chung_tu: Optional[str] = None
     series_pgh: Optional[str] = None
     ngay_chung_tu: Optional[str] = None
     ly_do_xuat_nhap: Optional[str] = None
     don_vi_linh: Optional[str] = None
     don_vi_nhan: Optional[str] = None
     note: Optional[str] = None
     status: Optional[bool] = None
     approved_by: Optional[str] = None
     created_by: Optional[str] = None
     updated_by: Optional[str] = None
     updated_date: datetime
     deleted_at: Optional[datetime] = None
     deleted_by: Optional[str] = None

     class Config:
         from_attributes = True