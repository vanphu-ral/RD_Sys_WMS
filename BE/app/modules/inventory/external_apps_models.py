
from sqlalchemy import Column, Integer, String, Float, DateTime, Numeric, Text
from sqlalchemy.ext.declarative import declarative_base

ExternalAppsBase = declarative_base()


class OWTR(ExternalAppsBase):
    """OWTR - Phiếu chuyển kho nội bộ (Header)"""
    __tablename__ = "OWTR"
    
    # Primary Key
    DocEntry = Column(Integer, primary_key=True)
    
    # Document Information
    DocNum = Column(Integer)
    DocType = Column(String(1))
    CANCELED = Column(String(1))
    DocStatus = Column(String(1))
    DocDate = Column(DateTime)
    DocDueDate = Column(DateTime)
    TaxDate = Column(DateTime)
    
    # Business Partner Information
    CardCode = Column(String(15))
    CardName = Column(String(100))
    
    # Warehouse Information
    BPLId = Column(Integer)  # Từ chi nhánh
    ToWhsCode = Column(String(8))  # Đến kho
    
    # Additional Information
    OwnerCode = Column(Integer)
    Comments = Column(Text)
    JrnlMemo = Column(Text)  # Ghi chú nhật ký chuyển kho
    
    # User Defined Fields (UDF)
    U_CodeSerial = Column(String(254))  # Số hoá đơn điện tử
    U_CodeInv = Column(String(254))  # Số seri điện tử
    U_Docnum = Column(String(254))  # Số chứng từ
    U_InvCode = Column(String(254))  # Số phiếu giao hàng
    U_Description_vn = Column(String(254))  # Diễn giải
    U_Pur_NVGiao = Column(String(254))  # Forwarder
    U_Pur_NVNhan = Column(String(254))  # Đơn vị lĩnh
    U_Category = Column(String(254))  # Lý do nhập/xuất
    U_hangmuc = Column(String(254))  # Hạng mục công trình
    U_OriginalNo = Column(String(254))  # Số hợp đồng gốc


class WTR1(ExternalAppsBase):
    """WTR1 - Chi tiết phiếu chuyển kho nội bộ (Detail)"""
    __tablename__ = "WTR1"
    
    # Composite Primary Key
    DocEntry = Column(Integer, primary_key=True)
    LineNum = Column(Integer, primary_key=True)
    
    # Item Information
    ItemCode = Column(String(50))  # Mã hàng hoá
    Dscription = Column(String(100))  # Tên hàng hoá
    
    # Base Document Reference
    BaseEntry = Column(Integer)  # Tham chiếu chứng từ gốc
    BaseLine = Column(Integer)  # Dòng chứng từ gốc
    
    # Quantity and Unit
    Quantity = Column(Numeric(19, 6))  # Số lượng sản phẩm
    UomCode = Column(String(100))  # Mã đơn vị tính
    
    # Additional Information
    ShipDate = Column(DateTime)  # Ngày giao hàng
    FreeTxt = Column(Text)  # Ghi chú sản phẩm trong phiếu
    
    # User Defined Fields
    U_PO = Column(String(254))  # Mã PO theo sản phẩm


class ORDR(ExternalAppsBase):
    """ORDR - Đơn hàng bán (Header)"""
    __tablename__ = "ORDR"
    
    # Primary Key
    DocEntry = Column(Integer, primary_key=True)
    
    # Document Information
    DocNum = Column(Integer)
    DocType = Column(String(1))
    CANCELED = Column(String(1))
    DocStatus = Column(String(1))
    DocDate = Column(DateTime)  # Ngày nhập
    DocDueDate = Column(DateTime)  # Ngày giao hàng
    TaxDate = Column(DateTime)  # Ngày chứng từ
    
    # Business Partner Information
    CardCode = Column(String(15))  # Mã khách hàng
    CardName = Column(String(100))  # Tên khách hàng
    CntctCode = Column(Integer)  # Người đại diện
    
    # Sales Information
    SlpCode = Column(Integer)  # Nhân viên kinh doanh
    OwnerCode = Column(Integer)  # Người tạo đơn hàng bán
    Comments = Column(Text)  # Ghi chú
    
    # User Defined Fields (UDF)
    U_CodeSerial = Column(String(254))  # Số hoá đơn điện tử
    U_CodeInv = Column(String(254))  # Số seri điện tử
    U_Docnum = Column(String(254))  # Số chứng từ
    U_InvCode = Column(String(254))  # Số phiếu giao hàng
    U_Description_vn = Column(String(254))  # Diễn giải
    U_Pur_NVGiao = Column(String(254))  # Forwarder
    U_Pur_NVNhan = Column(String(254))  # Đơn vị lĩnh
    U_Category = Column(String(254))  # Lý do nhập/xuất
    U_hangmuc = Column(String(254))  # Hạng mục công trình
    U_OriginalNo = Column(String(254))  # Số hợp đồng gốc
    U_GRPO = Column(String(254))  # Đến mã kho
    U_DNBH = Column(String(254))  # Đề nghị xuất kho
    U_CTA = Column(String(254))  # Chứng từ ảo
    U_SQDSX = Column(String(254))  # Số quyết định sản xuất
    U_MaKH = Column(String(254))  # Mã khách hàng 2 (khách hàng phụ)
    U_YCKH = Column(String(254))  # Yêu cầu khách hàng về đóng hàng


class RDR1(ExternalAppsBase):
    """RDR1 - Chi tiết đơn hàng bán (Detail)"""
    __tablename__ = "RDR1"
    
    # Composite Primary Key
    DocEntry = Column(Integer, primary_key=True)
    LineNum = Column(Integer, primary_key=True)
    
    # Item Information
    ItemCode = Column(String(50))  # Mã hàng hoá
    Dscription = Column(String(100))  # Tên hàng hoá
    
    # Base Document Reference
    BaseEntry = Column(Integer)  # Tham chiếu chứng từ gốc (nếu có)
    BaseLine = Column(Integer)  # Dòng chi tiết trong chứng từ gốc
    
    # Quantity and Unit
    Quantity = Column(Numeric(19, 6))  # Số lượng sản phẩm
    UomCode = Column(String(100))  # Mã đơn vị tính
    
    # Warehouse and Shipping
    ShipDate = Column(DateTime)  # Ngày giao hàng
    FreeTxt = Column(Text)  # Ghi chú sản phẩm trong đơn hàng
    
    # User Defined Fields
    U_PO = Column(String(254))  # Mã PO theo sản phẩm trong đơn hàng bán
    U_QDDNGH = Column(String(254))  # Quyết định đề nghị giao hàng
    U_soPOPI = Column(String(254))  # Số hợp đồng theo sản phẩm