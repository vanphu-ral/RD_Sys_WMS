"""
Pydantic schemas for External Apps IWTR and OSR API requests and responses
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ============================================================================
# IWTR (Internal Warehouse Transfer Request) Schemas
# ============================================================================

class IWTRHeaderResponse(BaseModel):
    """Response schema for IWTR header from External Apps"""
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
    FromWhsCode: Optional[str] = None
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
    U_Pur_Nvgiao: Optional[str] = None
    U_Pur_NvNhan: Optional[str] = None
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
    series_PGH: Optional[str] = Field(None, description="Series PGH")
    status: str = Field(default="Mới tạo", description="Trạng thái")
    note: Optional[str] = Field(None, description="Ghi chú")
    scan_status: Optional[str] = Field(None, description="Trạng thái scan")
    updated_by: Optional[str] = Field(None, description="Người cập nhật")
    
    # External Apps specific fields
    external_apps_doc_entry: Optional[int] = Field(None, description="External Apps DocEntry")
    external_apps_doc_num: Optional[int] = Field(None, description="External Apps DocNum")
    from_whs_code: Optional[str] = Field(None, description="External Apps From Warehouse Code")
    to_whs_code: Optional[str] = Field(None, description="External Apps To Warehouse Code")


class IWTRResponse(BaseModel):
    """Response schema for IWTR in WMS"""
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
    series_PGH: Optional[str] = None
    status: str
    note: Optional[str] = None
    scan_status: Optional[str] = None
    updated_by: Optional[str] = None
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# OSR (Outbound Shipment Request) Schemas
# ============================================================================

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
    U_Pur_Nvgiao: Optional[str] = None
    U_Pur_NvNhan: Optional[str] = None
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
    """Request schema for creating OSR in WMS from External Apps data"""
    ma_yc_xk: str = Field(..., description="Mã yêu cầu xuất kho")
    kho_xuat: Optional[int] = Field(None, description="ID kho xuất")
    xuat_toi: Optional[int] = Field(None, description="Xuất tới")
    don_vi_linh: Optional[str] = Field(None, description="Đơn vị lĩnh")
    don_vi_nhan: Optional[str] = Field(None, description="Đơn vị nhận")
    ly_do_xuat_nhap: Optional[str] = Field(None, description="Lý do xuất nhập")
    ngay_chung_tu: Optional[str] = Field(None, description="Ngày chứng từ")
    so_phieu_xuat: Optional[str] = Field(None, description="Số phiếu xuất")
    so_chung_tu: Optional[str] = Field(None, description="Số chứng từ")
    series_PGH: Optional[str] = Field(None, description="Series PGH")
    status: str = Field(default="Mới tạo", description="Trạng thái")
    note: Optional[str] = Field(None, description="Ghi chú")
    scan_status: Optional[str] = Field(None, description="Trạng thái scan")
    updated_by: Optional[str] = Field(None, description="Người cập nhật")
    
    # External Apps specific fields
    external_apps_doc_entry: Optional[int] = Field(None, description="External Apps DocEntry")
    external_apps_doc_num: Optional[int] = Field(None, description="External Apps DocNum")
    card_code: Optional[str] = Field(None, description="External Apps Customer Code")
    card_name: Optional[str] = Field(None, description="External Apps Customer Name")


class OSRResponse(BaseModel):
    """Response schema for OSR in WMS"""
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
    series_PGH: Optional[str] = None
    status: str
    note: Optional[str] = None
    scan_status: Optional[str] = None
    updated_by: Optional[str] = None
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# Common Schemas
# ============================================================================

class ExternalAppsSyncResponse(BaseModel):
    """Response schema for External Apps sync operations"""
    success: bool
    message: str
    records_fetched: int = 0
    records_created: int = 0
    records_updated: int = 0
    records_failed: int = 0
    errors: Optional[List[str]] = None


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number")
    size: int = Field(default=20, ge=1, le=100, description="Page size")


class FilterParams(BaseModel):
    """Common filter parameters"""
    doc_num: Optional[int] = Field(None, description="Document number")
    doc_status: Optional[str] = Field(None, description="Document status (O=Open, C=Closed)")
    canceled: Optional[str] = Field(None, description="Canceled flag (Y/N)")
    from_date: Optional[datetime] = Field(None, description="From date")
    to_date: Optional[datetime] = Field(None, description="To date")