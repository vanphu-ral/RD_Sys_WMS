from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True)
    code = Column(String(20))
    name = Column(String(20))  # nvarchar(20)
    thu_kho = Column(String(255))  # nvarchar(255)
    description = Column(String(500))  # nvarchar(500)
    address = Column(String(255))  # nvarchar(255)
    is_active = Column(Boolean, default=True)
    updated_by = Column(String(10))
    updated_date = Column(DateTime, default=func.now())


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True)
    code = Column(String(50))  # nvarchar(50)
    name = Column(String(50))  # nvarchar(50)
    area_id = Column(Integer, ForeignKey("areas.id"))
    address = Column(String(255))  # nvarchar(255)
    description = Column(String(255))  # nvarchar(255)
    is_multi_location = Column(Boolean)
    number_of_rack = Column(Integer)
    number_of_rack_empty = Column(Integer)
    parent_location_id = Column(Integer, ForeignKey("locations.id"))
    prefix_name = Column(String(20))  # nvarchar(20)
    prefix_separator = Column(String(5))  # nvarchar(5)
    child_location_row_count = Column(Integer)
    child_location_column_count = Column(Integer)
    suffix_separator = Column(String(5))  # nvarchar(5)
    suffix_digit_len = Column(String(5))  # nvarchar(5)
    humidity = Column(Float)
    temperature = Column(Float)
    barcode = Column(String(50))
    is_active = Column(Boolean, default=True)
    updated_by = Column(String(10))
    updated_date = Column(DateTime, default=func.now())


class Inventory(Base):
    __tablename__ = "inventories"

    id = Column(BigInteger, primary_key=True)
    identifier = Column(String(20), unique=True)
    serial_pallet = Column(String(50))
    part_number = Column(String(50))  # nvarchar(50)
    quantity = Column(Integer)
    location_id = Column(Integer, ForeignKey("locations.id"))
    parent_location_id = Column(Integer, ForeignKey("locations.id"))
    last_location_id = Column(Integer, ForeignKey("locations.id"))
    expiration_date = Column(DateTime)
    received_date = Column(DateTime)
    updated_date = Column(DateTime)
    updated_by = Column(String(50))  # nvarchar(50)
    calculated_status = Column(String(50))  # nvarchar(50)
    initial_quantity = Column(Integer)
    available_quantity = Column(Integer)
    parent_inventory_id = Column(String(20))
    material_name = Column(String(255))  # nvarchar(255)
    manufacturing_date = Column(DateTime)
    vendor = Column(String(50))
    lot = Column(String(50))
    po = Column(String(50))
    msd_level = Column(String(50))
    comments = Column(String(255))  # nvarchar(255)
    external_apps_code = Column(String(10))


class WarehouseImportRequirement(Base):
    __tablename__ = "warehouse_import_requirements"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer)
    client_id = Column(Integer)
    inventory_identifier = Column(String(20))
    number_of_pallet = Column(Integer)
    number_of_box = Column(Integer)
    quantity = Column(Integer)
    wo_code = Column(String(10))
    lot_number = Column(String(50))
    status = Column(String(20), default='Mới tạo')  # nvarchar(20)
    approved_by = Column(String(10))
    is_check_all = Column(Boolean, default=False)
    note = Column(String(255))  # nvarchar(255)
    updated_by = Column(String(10))
    updated_date = Column(DateTime, default=func.now())
    deleted_at = Column(DateTime)
    deleted_by = Column(String(10))


class WarehouseImportContainer(Base):
    __tablename__ = "warehouse_import_containers"

    id = Column(Integer, primary_key=True)
    warehouse_import_requirement_id = Column(Integer, ForeignKey("warehouse_import_requirements.id"))
    pallet_code = Column(Integer)
    box_code = Column(Integer)
    box_quantity = Column(Integer)
    updated_by = Column(String(10))
    updated_date = Column(DateTime, default=func.now())
    deleted_at = Column(DateTime)
    deleted_by = Column(String(10))


class ContainerInventory(Base):
    __tablename__ = "container_inventories"

    id = Column(Integer, primary_key=True)
    import_container_id = Column(Integer, ForeignKey("warehouse_import_containers.id"))
    inventory_identifier = Column(String(20), ForeignKey("inventories.identifier"))
    location = Column(String(20))
    scan_by = Column(String(10))
    time_checked = Column(DateTime, default=func.now())


class InternalWarehouseTransferRequest(Base):
    __tablename__ = "internal_warehouse_transfer_requests"

    id = Column(Integer, primary_key=True)
    ma_yc_cknb = Column(String(50))
    tu_kho = Column(Integer, ForeignKey("areas.id"))
    den_kho = Column(Integer, ForeignKey("areas.id"))
    don_vi_linh = Column(String(50))
    don_vi_nhan = Column(String(50))
    ly_do_xuat_nhap = Column(String(50))  # nvarchar(50)
    ngay_chung_tu = Column(String(50))  # nvarchar(50)
    so_phieu_xuat = Column(String(50))
    so_chung_tu = Column(String(50))
    series_PGH = Column(String(50))
    status = Column(String(20))  # nvarchar(20)
    note = Column(String(255))  # nvarchar(255)
    scan_status = Column(String(20))  # nvarchar(20)
    updated_by = Column(String(10))
    updated_date = Column(DateTime, default=func.now())
    deleted_at = Column(DateTime)
    deleted_by = Column(String(10))


class InventoriesInIWTR(Base):
    __tablename__ = "inventories_in_IWTR"

    id = Column(Integer, primary_key=True)
    internal_warehouse_transfer_requests_id = Column(Integer, ForeignKey("internal_warehouse_transfer_requests.id"))
    product_code = Column(String(10))
    product_name = Column(String(255))  # nvarchar(255)
    tu_kho = Column(Integer)
    den_kho = Column(Integer)
    total_quantity = Column(Integer)
    DVT = Column(String(20))  # nvarchar(20)
    updated_by = Column(String(10))
    updated_date = Column(DateTime, default=func.now())
    deleted_at = Column(DateTime)
    deleted_by = Column(String(10))


class IWTRDetail(Base):
    __tablename__ = "IWTR_detail"

    id = Column(Integer, primary_key=True)
    products_in_IWTR_id = Column(Integer, ForeignKey("inventories_in_IWTR.id"))
    inventory_identifier = Column(String(20), ForeignKey("inventories.identifier"))
    serial_pallet = Column(String(50))
    scan_time = Column(DateTime, default=func.now())


class OutboundShipmentRequestOnOrder(Base):
    __tablename__ = "outbound_shipment_requests_on_order"

    id = Column(Integer, primary_key=True)
    ma_yc_xk = Column(String(50), unique=True)
    kho_xuat = Column(Integer, ForeignKey("areas.id"))
    xuat_toi = Column(Integer)
    don_vi_linh = Column(String(50))
    don_vi_nhan = Column(String(50))
    ly_do_xuat_nhap = Column(String(50))  # nvarchar(50)
    ngay_chung_tu = Column(String(50))  # nvarchar(50)
    so_phieu_xuat = Column(String(50))
    so_chung_tu = Column(String(50))
    series_PGH = Column(String(50))
    status = Column(String(20))
    note = Column(String(20))  # nvarchar(20) - note: DB schema shows nvarchar(20) not (255)
    scan_status = Column(String(20))  # nvarchar(20)
    updated_by = Column(String(10))
    updated_date = Column(DateTime, default=func.now())
    deleted_at = Column(DateTime)
    deleted_by = Column(String(10))


class InventoriesInOSR(Base):
    __tablename__ = "inventories_in_OSR"

    id = Column(Integer, primary_key=True)
    outbound_shipment_request_on_order_id = Column(Integer, ForeignKey("outbound_shipment_requests_on_order.id"))
    product_code = Column(String(10))
    product_name = Column(String(255))  # nvarchar(255)
    total_quantity = Column(Integer)
    DVT = Column(String(20))  # nvarchar(20)
    updated_by = Column(String(10))
    updated_date = Column(DateTime, default=func.now())
    deleted_at = Column(DateTime)
    deleted_by = Column(String(10))


class OSRDetail(Base):
    __tablename__ = "OSR_detail"

    id = Column(Integer, primary_key=True)
    inventories_in_OSR_id = Column(Integer, ForeignKey("inventories_in_OSR.id"))
    inventory_identifier = Column(String(20), ForeignKey("inventories.identifier"))
    serial_pallet = Column(String(50))
    scan_time = Column(DateTime, default=func.now())
