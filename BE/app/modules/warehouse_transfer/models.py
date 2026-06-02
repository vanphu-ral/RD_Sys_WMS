from sqlalchemy import Column, BigInteger, String, Integer, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class WarehouseTransferGCRequirement(Base):
    __tablename__ = "warehouse_transfer_gc_requirement"

    id = Column(BigInteger, primary_key=True, index=True)
    requirement_code = Column(String(30), index=True, nullable=False)
    number_of_pallet = Column(Integer, nullable=False)
    number_of_box = Column(Integer, nullable=False)
    total_quantity = Column(Integer, nullable=False)
    status = Column(String(50), index=True, nullable=False, default='Bản nháp')
    source_warehouse = Column(Integer, nullable=False)
    destination_warehouse = Column(Integer, nullable=False)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(String(50), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    updated_by = Column(String(50), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(String(50), nullable=True)
    tenant_id = Column(String(50), index=True, nullable=False) 

class WarehouseTransferPallet(Base):
    __tablename__ = "warehouse_transfer_pallet"

    id = Column(BigInteger, primary_key=True, index=True)
    warehouse_transfer_gc_requirement_id = Column(Integer, nullable=False)
    pallet_info_detail_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(String(50), nullable=False)


class WarehouseTransferInventory(Base):
    __tablename__ = "warehouse_transfer_inventory"

    id = Column(BigInteger, primary_key=True, index=True)
    warehouse_transfer_gc_requirement_id = Column(Integer, nullable=False)
    inventory_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(String(50), nullable=False)


class WarehouseTransferGCRequirementApprove(Base):
    __tablename__ = "warehouse_transfer_gc_requirement_approve"

    id = Column(BigInteger, primary_key=True, index=True)
    requirement_code = Column(String(30), index=True, nullable=False)
    number_of_pallet = Column(Integer, nullable=False)
    number_of_box = Column(Integer, nullable=False)
    total_quantity = Column(Integer, nullable=False)
    status = Column(String(50), index=True, nullable=False, default='Bản nháp')
    source_warehouse = Column(Integer, nullable=False)
    destination_warehouse = Column(Integer, nullable=False)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(String(50), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    updated_by = Column(String(50), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(String(50), nullable=True)
    tenant_id = Column(String(50), index=True, nullable=False) 


class Tenant(Base):
    __tablename__ = "tenant"

    id = Column(String(50), primary_key=True, index=True)
    company_name = Column(String(255), index=True, nullable=False)
    factory = Column(String(255), index=True, nullable=False)