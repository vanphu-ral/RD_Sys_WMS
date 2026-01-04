
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class InventoryWHItem(BaseModel):
    """Schema for individual inventory item in WH request"""
    identifier: str = Field(..., max_length=20, description="Unique identifier for the inventory item")
    serial_pallet: str = Field(..., max_length=50, description="Serial pallet")
    location_id: int = Field(..., gt=0, description="Location ID")
    updated_by: str = Field(..., max_length=50, description="User who updated the inventory")
    initial_quantity: int = Field(..., ge=0, description="Initial quantity")
    name: str = Field(..., max_length=255, description="Inventory name")

    class Config:
        json_schema_extra = {
            "example": {
                "identifier": "INV-001",
                "serial_pallet": "PLT-001",
                "location_id": 1,
                "updated_by": "admin",
                "initial_quantity": 100,
                "name": "Product A"
            }
        }


class InventoriesWHRequest(BaseModel):
    """Request schema for bulk creating inventories via WH endpoint"""
    inventories: List[InventoryWHItem] = Field(..., min_length=1, description="List of inventory items to create")

    class Config:
        json_schema_extra = {
            "example": {
                "inventories": [
                    {
                        "identifier": "INV-001",
                        "serial_pallet": "PLT-001",
                        "location_id": 1,
                        "updated_by": "admin",
                        "initial_quantity": 100,
                        "name": "Product A"
                    },
                    {
                        "identifier": "INV-002",
                        "serial_pallet": "PLT-001",
                        "location_id": 1,
                        "updated_by": "admin",
                        "initial_quantity": 50,
                        "name": "Product B"
                    }
                ]
            }
        }


class InventoriesWHResponse(BaseModel):
    """Response schema for inventories WH creation"""
    success: bool
    created_count: int

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "created_count": 2,
            }
        }


class IWTRHeaderResponse(BaseModel):

    DocEntry: int
    DocNum: Optional[int] = None
    DocType: Optional[str] = None
    CANCELED: Optional[str] = None
    DocStatus: Optional[str] = None
    DocDate: Optional[datetime] = None
    DocDueDate: Optional[datetime] = None
    TaxDate: Optional[datetime] = None
    CardCode: Optional[str] = None
    CardName: Optional[str] = None
    BPLId: Optional[int] = None
    ToWhsCode: Optional[str] = None
    OwnerCode: Optional[int] = None
    Comments: Optional[str] = None
    JrnlMemo: Optional[str] = None
    
    # User Defined Fields
    U_CodeSerial: Optional[str] = None
    U_CodeInv: Optional[str] = None
    U_Docnum: Optional[str] = None
    U_InvCode: Optional[str] = None
    U_Description_vn: Optional[str] = None
    U_Pur_NVGiao: Optional[str] = None
    U_Pur_NVNhan: Optional[str] = None
    U_Category: Optional[str] = None
    U_hangmuc: Optional[str] = None
    U_OriginalNo: Optional[str] = None

    class Config:
        from_attributes = True


class IWTRCreateRequest(BaseModel):
    """Request schema for creating IWTR in WMS from External Apps data"""
    ma_yc_cknb: str = Field(..., description="Mã yêu cầu chuyển kho nội bộ")
    tu_kho: Optional[int] = Field(None, description="ID kho xuất")
    den_kho: Optional[int] = Field(None, description="ID kho nhận")
    don_vi_linh: Optional[str] = Field(None, description="Đơn vị lĩnh")
    don_vi_nhan: Optional[str] = Field(None, description="Đơn vị nhận")
    ly_do_xuat_nhap: Optional[str] = Field(None, description="Lý do xuất nhập")
    ngay_chung_tu: Optional[str] = Field(None, description="Ngày chứng từ")
    so_phieu_xuat: Optional[str] = Field(None, description="Số phiếu xuất")
    so_chung_tu: Optional[str] = Field(None, description="Số chứng từ")
    series_pgh: Optional[str] = Field(None, description="Series PGH")
    status: Optional[bool] = Field(None, description="trạng thái")
    note: Optional[str] = Field(None, description="Ghi chú")
    scan_status: Optional[bool] = Field(None, description="Trạng thái scan")
    updated_by: Optional[str] = Field(None, description="Người cập nhật")
    
    # External Apps specific fields
    external_apps_doc_entry: Optional[int] = Field(None, description="External Apps DocEntry")
    external_apps_doc_num: Optional[int] = Field(None, description="External Apps DocNum")
    to_whs_code: Optional[str] = Field(None, description="External Apps To Warehouse Code")


class IWTRResponse(BaseModel):
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
    status: str
    note: Optional[str] = None
    scan_status: Optional[bool] = None
    updated_by: Optional[str] = None
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True



class OSRHeaderResponse(BaseModel):
    """Response schema for OSR header from External Apps (ORDR table)"""
    DocEntry: int
    DocNum: Optional[int] = None
    DocType: Optional[str] = None
    CANCELED: Optional[str] = None
    DocStatus: Optional[str] = None
    DocDate: Optional[datetime] = None
    DocDueDate: Optional[datetime] = None
    TaxDate: Optional[datetime] = None
    CardCode: Optional[str] = None
    CardName: Optional[str] = None
    CntctCode: Optional[int] = None
    SlpCode: Optional[int] = None
    OwnerCode: Optional[int] = None
    Comments: Optional[str] = None
    
    # User Defined Fields
    U_CodeSerial: Optional[str] = None
    U_CodeInv: Optional[str] = None
    U_Docnum: Optional[str] = None
    U_InvCode: Optional[str] = None
    U_Description_vn: Optional[str] = None
    U_Pur_NVGiao: Optional[str] = None
    U_Pur_NVNhan: Optional[str] = None
    U_Category: Optional[str] = None
    U_hangmuc: Optional[str] = None
    U_OriginalNo: Optional[str] = None
    U_GRPO: Optional[str] = None
    U_DNBH: Optional[str] = None
    U_CTA: Optional[str] = None
    U_SQDSX: Optional[str] = None
    U_MaKH: Optional[str] = None
    U_YCKH: Optional[str] = None

    class Config:
        from_attributes = True


class OSRCreateRequest(BaseModel):
    ma_yc_xk: str = Field(..., description="Mã yêu cầu xuất kho")
    kho_xuat: Optional[int] = Field(None, description="ID kho xuất")
    xuat_toi: Optional[int] = Field(None, description="Xuất tới")
    don_vi_linh: Optional[str] = Field(None, description="Đơn vị lĩnh")
    don_vi_nhan: Optional[str] = Field(None, description="Đơn vị nhận")
    ly_do_xuat_nhap: Optional[str] = Field(None, description="Lý do xuất nhập")
    ngay_chung_tu: Optional[str] = Field(None, description="Ngày chứng từ")
    status: Optional[bool] = Field(None, description="Trạng thái")
    series_pgh: Optional[str] = Field(None, description="Series PGH")
    note: Optional[str] = Field(None, description="Ghi chú")
    updated_by: Optional[str] = Field(None, description="Người cập nhật")

    # External Apps specific fields
    external_apps_doc_entry: Optional[int] = Field(None, description="External Apps DocEntry")
    external_apps_doc_num: Optional[int] = Field(None, description="External Apps DocNum")
    card_code: Optional[str] = Field(None, description="External Apps Customer Code")
    card_name: Optional[str] = Field(None, description="External Apps Customer Name")

    class Config:
        json_schema_extra = {
            "example": {
                "ma_yc_xk": "ORS-2024-001",
                "kho_xuat": 1,
                "xuat_toi": 2,
                "don_vi_linh": "Phòng kỹ thuật",
                "don_vi_nhan": "Phòng sản xuất",
                "ly_do_xuat_nhap": "Chuyển kho nội bộ",
                "ngay_chung_tu": "2024-01-15",
                "status": False,
                "series_pgh": "s",
                "note": "notesss",
                "updated_by": "admin"
            }
        }


class OSRResponse(BaseModel):
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
    status: str
    note: Optional[str] = None
    scan_status: Optional[bool] = None
    updated_by: Optional[str] = None
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class RDR1LineResponse(BaseModel):
    DocEntry: int
    LineNum: int
    ItemCode: Optional[str] = None
    Dscription: Optional[str] = None
    BaseEntry: Optional[int] = None
    BaseLine: Optional[int] = None
    ShipDate: Optional[datetime] = None
    U_PO: Optional[str] = None
    U_QDDNGH: Optional[str] = None
    U_soPOPI: Optional[str] = None
    Quantity: Optional[float] = None
    UomCode: Optional[str] = None
    FreeTxt: Optional[str] = None

    class Config:
        from_attributes = True


class WTR1LineResponse(BaseModel):
    DocEntry: int
    LineNum: int
    ItemCode: Optional[str] = None
    Dscription: Optional[str] = None
    BaseEntry: Optional[int] = None
    BaseLine: Optional[int] = None
    ShipDate: Optional[datetime] = None
    U_PO: Optional[str] = None
    ToWhsCode: Optional[str] = None
    Quantity: Optional[float] = None
    UomCode: Optional[str] = None
    FreeTxt: Optional[str] = None

    class Config:
        from_attributes = True


class OSRFullResponse(BaseModel):
    main_information: OSRHeaderResponse
    detailed_information: List[RDR1LineResponse]

    class Config:
        from_attributes = True


class IWTRFullResponse(BaseModel):
    main_information: IWTRHeaderResponse
    detailed_information: List[WTR1LineResponse]

    class Config:
        from_attributes = True



class ExternalAppsSyncResponse(BaseModel):
    success: bool
    message: str
    records_fetched: int = 0
    records_created: int = 0
    records_updated: int = 0
    records_failed: int = 0
    errors: Optional[List[str]] = None


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number")
    size: int = Field(default=20, ge=1, le=100, description="Page size")


class FilterParams(BaseModel):
    doc_num: Optional[int] = Field(None, description="Document number")
    doc_status: Optional[str] = Field(None, description="Document status (O=Open, C=Closed)")
    canceled: Optional[str] = Field(None, description="Canceled flag (Y/N)")
    from_date: Optional[datetime] = Field(None, description="From date")
    to_date: Optional[datetime] = Field(None, description="To date")



class UpdateInventoryQuantityRequest(BaseModel):
    """Request schema for updating inventory quantity"""
    inventory_identifier: str = Field(..., description="Inventory identifier")
    available_quantity: int = Field(..., ge=0, description="New available quantity")
    updated_by: Optional[str] = Field(None, description="User who updated the inventory")

    class Config:
        json_schema_extra = {
            "example": {
                "inventory_identifier": "INV-001",
                "available_quantity": 100,
                "updated_by": "admin"
            }
        }


class UpdateInventoryLocationRequest(BaseModel):
    """Request schema for updating inventory location"""
    inventory_identifier: str = Field(..., description="Inventory identifier")
    location_id: int = Field(..., gt=0, description="New location ID")
    updated_by: Optional[str] = Field(None, description="User who updated the inventory")

    class Config:
        json_schema_extra = {
            "example": {
                "inventory_identifier": "INV-001",
                "location_id": 5,
                "updated_by": "admin"
            }
        }


class InventoryUpdateResponse(BaseModel):
    success: bool
    inventory: Optional[dict] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "inventory": {
                    "id": 1,
                    "identifier": "INV-001",
                    "available_quantity": 100,
                    "location_id": 5
                }
            }
        }

class InventoryInIWTRItem(BaseModel):
    product_code: str = Field(..., max_length=20, description="Mã sản phẩm")
    product_name: str = Field(..., max_length=255, description="Tên sản phẩm")
    total_quantity: int = Field(..., ge=0, description="Tổng số lượng")
    dvt: str = Field(..., max_length=20, description="Đơn vị tính")
    quantity_scanned: Optional[int] = Field(None, ge=0, description="Số lượng đã scan")
    updated_by: Optional[str] = Field(None, max_length=10, description="Người cập nhật")

    class Config:
        json_schema_extra = {
            "example": {
                "product_code": "P001",
                "product_name": "Sản phẩm A",
                "total_quantity": 100,
                "dvt": "Cái",
                "quantity_scanned": 0,
                "updated_by": "admin"
            }
        }


class IWTRWithInventoriesRequest(BaseModel):

    ma_yc_cknb: str = Field(..., max_length=50, description="Mã yêu cầu chuyển kho nội bộ")
    tu_kho: Optional[int] = Field(None, description="ID kho xuất")
    den_kho: Optional[int] = Field(None, description="ID kho nhận")
    don_vi_linh: Optional[str] = Field(None, max_length=50, description="Đơn vị lĩnh")
    don_vi_nhan: Optional[str] = Field(None, max_length=50, description="Đơn vị nhận")
    ly_do_xuat_nhap: Optional[str] = Field(None, max_length=50, description="Lý do xuất nhập")
    ngay_chung_tu: Optional[str] = Field(None, max_length=50, description="Ngày chứng từ")
    status: Optional[bool] = Field(None, description="Trạng thái")
    series_pgh: Optional[str] = Field(None, max_length=50, description="Series PGH")
    note: Optional[str] = Field(None, max_length=255, description="Ghi chú")
    updated_by: Optional[str] = Field(None, max_length=10, description="Người cập nhật")

    class Config:
        json_schema_extra = {
            "example": {
                "ma_yc_cknb": "IWTR-2024-001",
                "tu_kho": 1,
                "den_kho": 2,
                "don_vi_linh": "Phòng kỹ thuật",
                "don_vi_nhan": "Phòng sản xuất",
                "ly_do_xuat_nhap": "Chuyển kho nội bộ",
                "ngay_chung_tu": "2024-01-15",
                "status": False,
                "series_pgh": "s",
                "note": "notesss",
                "updated_by": "admin"
            }
        }


class IWTRSimpleRequest(BaseModel):
    """Simplified request schema for creating IWTR without inventories"""
    den_kho: int = Field(..., description="ID kho nhận")
    don_vi_linh: str = Field(..., max_length=50, description="Đơn vị lĩnh")
    don_vi_nhan: str = Field(..., max_length=50, description="Đơn vị nhận")
    ly_do_xuat_nhap: str = Field(..., max_length=50, description="Lý do xuất nhập")
    ma_yc_cknb: str = Field(..., max_length=50, description="Mã yêu cầu chuyển kho nội bộ")
    ngay_chung_tu: str = Field(..., max_length=50, description="Ngày chứng từ")
    note: str = Field(..., max_length=255, description="Ghi chú")
    series_pgh: str = Field(..., max_length=50, description="Series PGH")
    tu_kho: int = Field(..., description="ID kho xuất")
    updated_by: str = Field(..., max_length=15, description="Người cập nhật")
    so_phieu_xuat: Optional[str] = Field(None, max_length=50, description="Số phiếu xuất")
    so_chung_tu: Optional[str] = Field(None, max_length=50, description="Số chứng từ")
    scan_status: Optional[bool] = Field(None, description="Trạng thái scan")
    status: Optional[bool] = Field(None, description="Trạng thái")

    class Config:
        json_schema_extra = {
            "example": {
                "den_kho": 2,
                "don_vi_linh": "Phòng kỹ thuật",
                "don_vi_nhan": "Phòng sản xuất",
                "ly_do_xuat_nhap": "Chuyển kho nội bộ",
                "ma_yc_cknb": "IWTR-2024-001",
                "ngay_chung_tu": "2024-01-15",
                "note": "notesss",
                "series_pgh": "s",
                "tu_kho": 1,
                "updated_by": "admin"
            }
        }


class InventoryInIWTRResponse(BaseModel):
    """Response schema for inventory in IWTR"""
    id: int
    internal_warehouse_transfer_requests_id: int
    product_code: str
    product_name: str
    total_quantity: int
    dvt: str
    quantity_scanned: Optional[int] = None
    updated_by: Optional[str] = None
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class IWTRInventoriesCreateRequest(BaseModel):
    items: List[InventoryInIWTRItem] = Field(..., min_length=1, description="Danh sách hàng hóa")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "product_code": "P001",
                        "product_name": "Sản phẩm A",
                        "total_quantity": 100,
                        "dvt": "Cái",
                        "updated_by": "admin"
                    }
                ]
            }
        }


class IWTRInventoriesCreateResponse(BaseModel):
    success: bool
    inventories: List[InventoryInIWTRResponse]

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "items": [
                    {
                        "id": 1,
                        "internal_warehouse_transfer_requests_id": 1,
                        "product_code": "P001",
                        "product_name": "Sản phẩm A",
                        "total_quantity": 100
                    }
                ]
            }
        }


class IWTRWithInventoriesResponse(BaseModel):
    success: bool
    iwtr: IWTRResponse
    inventories: List[InventoryInIWTRResponse]

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "iwtr": {
                    "id": 1,
                    "ma_yc_cknb": "IWTR-2024-001",
                    "tu_kho": 1,
                    "den_kho": 2,
                    "status": False
                }
            }
        }




class InventoryInOSRItem(BaseModel):
    """Schema for inventory item in OSR"""
    product_code: str = Field(..., max_length=20, description="Mã sản phẩm")
    product_name: str = Field(..., max_length=255, description="Tên sản phẩm")
    total_quantity: int = Field(..., ge=0, description="Tổng số lượng")
    dvt: str = Field(..., max_length=20, description="Đơn vị tính")
    quantity_scanned: Optional[int] = Field(None, ge=0, description="Số lượng đã scan")
    updated_by: Optional[str] = Field(None, max_length=10, description="Người cập nhật")

    class Config:
        json_schema_extra = {
            "example": {
                "product_code": "P001",
                "product_name": "Sản phẩm A",
                "total_quantity": 100,
                "dvt": "Cái",
                "quantity_scanned": 0,
                "updated_by": "admin"
            }
        }


class OSRWithInventoriesRequest(BaseModel):
    """Request schema for creating OSR with inventories"""
    # OSR header fields
    ma_yc_xk: str = Field(..., max_length=50, description="Mã yêu cầu xuất kho")
    kho_xuat: Optional[int] = Field(None, description="ID kho xuất")
    xuat_toi: Optional[int] = Field(None, description="Xuất tới")
    don_vi_linh: Optional[str] = Field(None, max_length=50, description="Đơn vị lĩnh")
    don_vi_nhan: Optional[str] = Field(None, max_length=50, description="Đơn vị nhận")
    ly_do_xuat_nhap: Optional[str] = Field(None, max_length=50, description="Lý do xuất nhập")
    ngay_chung_tu: Optional[str] = Field(None, max_length=50, description="Ngày chứng từ")
    series_pgh: Optional[str] = Field(None, max_length=50, description="Series PGH")
    status: Optional[bool] = Field(None, description="Trạng thái")
    note: Optional[str] = Field(None, max_length=255, description="Ghi chú")
    updated_by: Optional[str] = Field(None, max_length=10, description="Người cập nhật")
    # Inventories
    inventories: List[InventoryInOSRItem] = Field(..., min_length=1, description="Danh sách hàng hóa")

    class Config:
        json_schema_extra = {
            "example": {
                "ma_yc_xk": "OSR-2024-001",
                "kho_xuat": 1,
                "xuat_toi": 2,
                "don_vi_linh": "Phòng kỹ thuật",
                "don_vi_nhan": "Khách hàng A",
                "ly_do_xuat_nhap": "Xuất hàng bán",
                "ngay_chung_tu": "2024-01-15",
                "so_phieu_xuat": "PX-001",
                "so_chung_tu": "CT-001",
                "series_pgh": "PGH-001",
                "status": False,
                "note": "Xuất hàng theo đơn",
                "scan_status": False,
                "updated_by": "admin"
            }
        }


class InventoryInOSRResponse(BaseModel):
    """Response schema for inventory in OSR"""
    id: int
    outbound_shipment_request_on_order_id: int
    product_code: str
    product_name: str
    tu_kho: Optional[int] = None
    den_kho: Optional[int] = None
    total_quantity: int
    dvt: str
    quantity_scanned: Optional[int] = None
    updated_by: Optional[str] = None
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class OSRCreateResponse(BaseModel):
    success: bool
    osr_id: int

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "osr_id": 1
            }
        }


class OSRInventoriesCreateRequest(BaseModel):

    inventories: List[InventoryInOSRItem] = Field(..., min_length=1, description="Danh sách hàng hóa")


class OSRInventoriesCreateResponse(BaseModel):
    success: bool
    inventories: List[InventoryInOSRResponse]

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "items": [
                    {
                        "id": 1,
                        "outbound_shipment_request_on_order_id": 1,
                        "product_code": "P001",
                        "product_name": "Sản phẩm A",
                        "total_quantity": 100
                    }
                ]
            }
        }

class OSRScanDetailItem(BaseModel):

    product_in_osr_id: int = Field(..., description="ID của inventory trong OSR")
    inventory_identifier: str = Field(..., max_length=20, description="Mã định danh inventory")
    serial_pallet: str = Field(..., max_length=50, description="Serial pallet")
    quantity_dispatched: int = Field(..., ge=0, description="Số lượng đã xuất")
    scan_time: datetime = Field(..., description="Thời gian scan")
    scan_by: str = Field(..., max_length=10, description="Người scan")

    class Config:
        json_schema_extra = {
            "example": {
                "product_in_osr_id": 1,
                "inventory_identifier": "INV-001",
                "serial_pallet": "PLT-001",
                "quantity_dispatched": 50,
                "scan_time": "2024-01-15T10:30:00",
                "scan_by": "admin"
            }
        }


class OSRScanDetailRequest(BaseModel):
    """Request schema for scanning OSR details"""
    scan_details: List[OSRScanDetailItem] = Field(..., min_length=1, description="Danh sách chi tiết scan")

    class Config:
        json_schema_extra = {
            "example": {
                "scan_details": [
                    {
                        "product_in_osr_id": 1,
                        "inventory_identifier": "INV-001",
                        "serial_pallet": "PLT-001",
                        "quantity_dispatched": 50,
                        "scan_time": "2024-01-15T10:30:00",
                        "scan_by": "admin"
                    },
                    {
                        "product_in_osr_id": 1,
                        "inventory_identifier": "INV-002",
                        "serial_pallet": "PLT-002",
                        "quantity_dispatched": 30,
                        "scan_time": "2024-01-15T10:35:00",
                        "scan_by": "admin"
                    }
                ]
            }
        }


class OSRScanDetailResponse(BaseModel):
    """Response schema for OSR scan operation"""
    success: bool
    details: Optional[List[dict]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "details": [
                    {
                        "id": 1,
                        "product_in_osr_id": 1,
                        "inventory_identifier": "INV-001",
                        "serial_pallet": "PLT-001",
                        "scan_time": "2024-01-15T10:30:00"
                    }
                ]
            }
        }


class IWTRScanDetailItem(BaseModel):
    product_in_iwtr_id: int = Field(..., description="ID của product trong IWTR")
    inventory_identifier: str = Field(..., max_length=20, description="Mã định danh inventory")
    serial_pallet: str = Field(..., max_length=50, description="Serial pallet")
    quantity_dispatched: int = Field(..., ge=0, description="Số lượng đã xuất")
    scan_time: datetime = Field(..., description="Thời gian scan")
    scan_by: str = Field(..., max_length=10, description="Người scan")

    class Config:
        json_schema_extra = {
            "example": {
                "product_in_iwtr_id": 1,
                "inventory_identifier": "INV-001",
                "serial_pallet": "PLT-001",
                "quantity_dispatched": 50,
                "scan_time": "2024-01-15T10:30:00",
                "scan_by": "admin"
            }
        }


class IWTRScanDetailRequest(BaseModel):
    """Request schema for scanning IWTR details"""
    scan_details: List[IWTRScanDetailItem] = Field(..., min_length=1, description="Danh sách chi tiết scan")

    class Config:
        json_schema_extra = {
            "example": {
                "scan_details": [
                    {
                        "product_in_iwtr_id": 1,
                        "inventory_identifier": "INV-001",
                        "serial_pallet": "PLT-001",
                        "quantity_dispatched": 50,
                        "scan_time": "2024-01-15T10:30:00",
                        "scan_by": "admin"
                    },
                    {
                        "product_in_iwtr_id": 1,
                        "inventory_identifier": "INV-002",
                        "serial_pallet": "PLT-002",
                        "quantity_dispatched": 30,
                        "scan_time": "2024-01-15T10:35:00",
                        "scan_by": "admin"
                    }
                ]
            }
        }


class IWTRScanDetailResponse(BaseModel):
    """Response schema for IWTR scan operation"""
    success: bool
    details: Optional[List[dict]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "details": [
                    {
                        "id": 1,
                        "product_in_iwtr_id": 1,
                        "inventory_identifier": "INV-001",
                        "serial_pallet": "PLT-001",
                        "scan_time": "2024-01-15T10:30:00"
                    }
                ]
            }
        }


class UpdateImportStatusRequest(BaseModel):
    """Request schema for updating import requirement status"""
    status: bool = Field(..., description="New status for the import requirement")
    updated_by: Optional[str] = Field(None, description="User updating the status")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "Đã xác nhận",
                "updated_by": "admin"
            }
        }


class WTR1Response(BaseModel):
    """Response schema for WTR1 line items"""
    DocEntry: int
    LineNum: int
    ItemCode: Optional[str] = None
    Dscription: Optional[str] = None
    BaseEntry: Optional[int] = None
    BaseLine: Optional[int] = None
    ShipDate: Optional[datetime] = None
    U_PO: Optional[str] = None
    Quantity: Optional[float] = None
    UomCode: Optional[str] = None
    FreeTxt: Optional[str] = None

    class Config:
        from_attributes = True


class IWTRFullOWTRWTR1Response(BaseModel):
    """Response schema for IWTR with OWTR/WTR1 structure"""
    OWTR: IWTRHeaderResponse
    WTR1: List[WTR1Response]

    class Config:
        from_attributes = True


class OSRFullORDRRDR1Response(BaseModel):
    """Response schema for OSR with ORDR/RDR1 structure"""
    ORDR: OSRHeaderResponse
    RDR1: List[RDR1LineResponse]

    class Config:
        from_attributes = True


class TransactionDashboardItem(BaseModel):
    """Unified transaction dashboard item for all transaction types"""
    id: int
    transaction_type: str = Field(..., description="Loại giao dịch: IMPORT, TRANSFER, EXPORT")
    request_code: str = Field(..., description="Mã yêu cầu (wo_code cho IMPORT, ma_yc_cknb cho TRANSFER, ma_yc_xk cho EXPORT)")
    doc_entry: Optional[int] = Field(None, description="Mã doc_entry từ SAP (cho TRANSFER và EXPORT)")
    branch: Optional[str] = Field(None, description="Ngành")
    production_team: Optional[str] = Field(None, description="Tổ sản xuất")
    from_warehouse: Optional[int] = Field(None, description="Kho xuất/chuyển")
    to_warehouse: Optional[int] = Field(None, description="Kho nhận/đến")
    created_date: datetime = Field(..., description="Thời gian tạo")
    status: Optional[bool] = Field(None, description="Trạng thái")
    updated_by: Optional[str] = Field(None, description="Người cập nhật")
    updated_date: Optional[datetime] = Field(None, description="Thời gian cập nhật")
    
    # Additional fields
    po_number: Optional[str] = Field(None, description="PO number (IMPORT)")
    client_id: Optional[str] = Field(None, description="Mã khách hàng (IMPORT)")
    lot_number: Optional[str] = Field(None, description="Số lot (IMPORT)")
    don_vi_linh: Optional[str] = Field(None, description="Đơn vị lĩnh (TRANSFER/EXPORT)")
    don_vi_nhan: Optional[str] = Field(None, description="Đơn vị nhận (TRANSFER/EXPORT)")
    note: Optional[str] = Field(None, description="Ghi chú")

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "transaction_type": "IMPORT",
                "request_code": "WO-2024-001",
                "doc_entry": None,
                "branch": "Electronics",
                "production_team": "Team A",
                "from_warehouse": None,
                "to_warehouse": 1,
                "created_date": "2024-01-15T10:30:00",
                "status": True,
                "updated_by": "admin",
                "updated_date": "2024-01-15T14:30:00",
                "po_number": "PO-001",
                "po_number": "PO-001",
                "client_id": "CLIENT-001",
                "lot_number": "LOT-001",
                "don_vi_linh": None,
                "don_vi_nhan": None,
                "note": "Import request"
            }
        }


class TransactionDashboardMeta(BaseModel):
    """Metadata for transaction dashboard pagination"""
    page: int
    size: int
    total_items: int
    total_pages: int


class TransactionDashboardResponse(BaseModel):
    """Response schema for unified transaction dashboard"""
    data: List[TransactionDashboardItem]
    meta: TransactionDashboardMeta

    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {
                        "id": 1,
                        "transaction_type": "IMPORT",
                        "request_code": "WO-2024-001",
                        "branch": "Electronics",
                        "production_team": "Team A",
                        "to_warehouse": 1,
                        "created_date": "2024-01-15T10:30:00",
                        "status": True
                    }
                ],
                "meta": {
                    "page": 1,
                    "size": 20,
                    "total_items": 100,
                    "total_pages": 5
                }
            }
        }