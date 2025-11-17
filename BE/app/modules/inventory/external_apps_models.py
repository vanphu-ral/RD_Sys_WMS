"""
External Apps Database Models for OWTR (Internal Warehouse Transfer) and ORDR (Sales Orders)
These models map to the External Apps database tables at 192.168.21.61:1433/BANHANG_Thang6
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Numeric, Text
from sqlalchemy.ext.declarative import declarative_base

ExternalAppsBase = declarative_base()


class OWTR(ExternalAppsBase):
    """
    SAP Internal Warehouse Transfer Request Header (Chuyển Kho Nội Bộ)
    Maps to OWTR table in SAP database
    """
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
    BPLId = Column(Integer)  # From Branch
    FromWhsCode = Column(String(8))  # From Warehouse
    ToWhsCode = Column(String(8))  # To Warehouse
    
    # Additional Information
    OwnerCode = Column(Integer)
    Comments = Column(Text)
    JrnlMemo = Column(String(50))
    
    # User Defined Fields (UDF)
    U_CodeSerial = Column(String(254))
    U_CodeInv = Column(String(254))
    U_Docnum = Column(String(254))
    U_InvCode = Column(String(254))
    U_Description_vn = Column(String(254))
    U_Pur_Nvgiao = Column(String(254))
    U_Pur_NvNhan = Column(String(254))
    U_Category = Column(String(254))
    U_hangmuc = Column(String(254))
    U_OriginalNo = Column(String(254))
    U_GRPO = Column(String(254))
    U_DNBH = Column(String(254))
    U_CTA = Column(String(254))
    U_SQDSX = Column(String(254))
    U_MaKH = Column(String(254))
    U_YCKH = Column(String(254))


class WTR1(ExternalAppsBase):
    """
    SAP Internal Warehouse Transfer Request Detail (Chi tiết Chuyển Kho)
    Maps to WTR1 table in SAP database
    """
    __tablename__ = "WTR1"
    
    # Composite Primary Key
    DocEntry = Column(Integer, primary_key=True)
    LineNum = Column(Integer, primary_key=True)
    
    # Item Information
    ItemCode = Column(String(50))
    Dscription = Column(String(100))
    
    # Base Document Reference
    BaseEntry = Column(Integer)
    BaseLine = Column(Integer)
    
    # Warehouse Information
    FromWhsCod = Column(String(8))
    WhsCode = Column(String(8))
    
    # Quantity and Unit
    Quantity = Column(Numeric(19, 6))
    UomCode = Column(String(100))
    
    # Additional Information
    ShipDate = Column(DateTime)
    FreeTxt = Column(Text)
    
    # User Defined Fields
    U_PO = Column(String(254))
    DateCode = Column(String(254))
    U_QDDNGH = Column(String(254))
    U_soPOPI = Column(String(254))
    WsCode = Column(String(8))


class ORDR(ExternalAppsBase):
    """
    SAP Sales Order Header (Đơn Hàng Bán)
    Maps to ORDR table in SAP database
    """
    __tablename__ = "ORDR"
    
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
    CntctCode = Column(Integer)
    
    # Sales Information
    SlpCode = Column(Integer)
    OwnerCode = Column(Integer)
    Comments = Column(Text)
    
    # User Defined Fields (UDF)
    U_CodeSerial = Column(String(254))
    U_CodeInv = Column(String(254))
    U_Docnum = Column(String(254))
    U_InvCode = Column(String(254))
    U_Description_vn = Column(String(254))
    U_Pur_Nvgiao = Column(String(254))
    U_Pur_NvNhan = Column(String(254))
    U_Category = Column(String(254))
    U_hangmuc = Column(String(254))
    U_OriginalNo = Column(String(254))
    U_GRPO = Column(String(254))
    U_DNBH = Column(String(254))
    U_CTA = Column(String(254))
    U_SQDSX = Column(String(254))
    U_MaKH = Column(String(254))
    U_YCKH = Column(String(254))


class RDR1(ExternalAppsBase):
    """
    SAP Sales Order Detail (Chi tiết Đơn Hàng Bán)
    Maps to RDR1 table in SAP database
    """
    __tablename__ = "RDR1"
    
    # Composite Primary Key
    DocEntry = Column(Integer, primary_key=True)
    LineNum = Column(Integer, primary_key=True)
    
    # Item Information
    ItemCode = Column(String(50))
    Dscription = Column(String(100))
    
    # Base Document Reference
    BaseEntry = Column(Integer)
    BaseLine = Column(Integer)
    
    # Quantity and Unit
    Quantity = Column(Numeric(19, 6))
    UomCode = Column(String(100))
    
    # Warehouse and Shipping
    WhsCode = Column(String(8))
    ShipDate = Column(DateTime)
    FreeTxt = Column(Text)
    
    # User Defined Fields
    U_PO = Column(String(254))
    DateCode = Column(String(254))
    U_QDDNGH = Column(String(254))
    U_soPOPI = Column(String(254))
    WsCode = Column(String(8))