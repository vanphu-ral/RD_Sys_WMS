from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True)
    code = Column(String(20), unique=True)
    name = Column(String(20), unique=True)
    thu_kho = Column(String(255))
    description = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    updated_by = Column(String(10), nullable=True)
    updated_date = Column(DateTime, default=func.now())


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True)
    code = Column(String(50), unique=True)
    name = Column(String(50), unique=True)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    address = Column(String(255), nullable=True)
    description = Column(String(255), nullable=True)
    is_multi_location = Column(Boolean, nullable=True)
    number_of_rack = Column(Integer, nullable=True)
    number_of_rack_empty = Column(Integer, nullable=True)
    parent_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    prefix_name = Column(String(20), nullable=True)
    prefix_separator = Column(String(5), nullable=True)
    child_location_row_count = Column(Integer, nullable=True)
    child_location_column_count = Column(Integer, nullable=True)
    suffix_separator = Column(String(5), nullable=True)
    suffix_digit_len = Column(Integer, nullable=True)
    humidity = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    barcode = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    updated_by = Column(String(10), nullable=False)
    updated_date = Column(DateTime, default=func.now())


class Inventory(Base):
    __tablename__ = "inventories"

    id = Column(BigInteger, primary_key=True)
    identifier = Column(String(20), unique=True)
    serial_pallet = Column(String(50), nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    parent_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    last_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    parent_inventory_id = Column(Integer, nullable=True)
    expiration_date = Column(DateTime, nullable=True)
    received_date = Column(DateTime, nullable=True)
    updated_date = Column(DateTime, nullable=True)
    updated_by = Column(String(50), nullable=True)
    calculated_status = Column(String(50), nullable=True)
    manufacturing_date = Column(DateTime, nullable=True)
    initial_quantity = Column(Integer, nullable=False)
    available_quantity = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=True)
    name = Column(String(255), nullable=True)
    sap_code = Column(String(20), nullable=True)
    po = Column(String(50), nullable=True)
    lot = Column(String(50), nullable=True)
    vendor = Column(String(50), nullable=True)
    msd_level = Column(String(50), nullable=True)
    comments = Column(String(255), nullable=True)


class WarehouseImportRequirement(Base):
    __tablename__ = "warehouse_import_requirements"

    id = Column(Integer, primary_key=True)
    order_id = Column(String(255), nullable=True)
    client_id = Column(String(255), nullable=True)
    inventory_name = Column(String(255), nullable=True)
    number_of_pallet = Column(Integer, nullable=True)
    number_of_box = Column(Integer, nullable=True)
    quantity = Column(Integer, nullable=True)
    wo_code = Column(String(15), nullable=False)
    sap_wo = Column(String(15), nullable=False)
    lot_number = Column(String(50), nullable=False)
    industry = Column(String(255), nullable=True)
    production_team = Column(String(255), nullable=True)
    production_decision_number = Column(String(255), nullable=True)
    item_no_sku = Column(String(255), nullable=True)
    status = Column(Boolean, default=False)
    approved_by = Column(String(10), nullable=True)
    is_check_all = Column(Boolean, default=False)
    note = Column(String(255), nullable=True)
    destination_warehouse = Column(Integer, nullable=True)
    pallet_note_creation_session_id = Column(BigInteger, nullable=True)
    updated_by = Column(String(10), nullable=True)
    updated_date = Column(DateTime, default=func.now())
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(10), nullable=True)


class WarehouseImportContainer(Base):
    __tablename__ = "warehouse_import_containers"

    id = Column(Integer, primary_key=True)
    warehouse_import_requirement_id = Column(Integer, ForeignKey("warehouse_import_requirements.id"), nullable=False)
    serial_pallet = Column(String(50), nullable=True)
    box_code = Column(String(255), nullable=False)
    box_quantity = Column(Integer, nullable=False)
    list_serial_items = Column(Text, nullable=True)
    updated_by = Column(String(10), nullable=False)
    updated_date = Column(DateTime, default=func.now())


class ContainerInventory(Base):
    __tablename__ = "container_inventories"

    id = Column(Integer, primary_key=True)
    manufacturing_date = Column(DateTime, nullable=True)
    expiration_date = Column(DateTime, nullable=True)
    sap_code = Column(String(20), nullable=True)
    po = Column(String(50), nullable=True)
    lot = Column(String(50), nullable=True)
    vendor = Column(String(50), nullable=True)
    msd_level = Column(String(50), nullable=True)
    comments = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    import_container_id = Column(Integer, ForeignKey("warehouse_import_containers.id"), nullable=False)
    inventory_identifier = Column(String(20), nullable=False)
    location_id = Column(Integer, nullable=True)
    serial_pallet = Column(String(50), nullable=True)
    quantity_imported = Column(Integer, nullable=True)
    scan_by = Column(String(10), nullable=True)
    time_checked = Column(DateTime, default=func.now())
    confirmed = Column(Boolean, default=False)

class InternalWarehouseTransferRequest(Base):
    __tablename__ = "internal_warehouse_transfer_requests"

    id = Column(Integer, primary_key=True)
    ma_yc_cknb = Column(String(50), nullable=False)
    tu_kho = Column(Integer, nullable=True)
    den_kho = Column(Integer, nullable=True)
    don_vi_linh = Column(String(50), nullable=True)
    don_vi_nhan = Column(String(50), nullable=True)
    ly_do_xuat_nhap = Column(String(50), nullable=True)
    ngay_chung_tu = Column(String(50), nullable=True)
    so_phieu_xuat = Column(String(50), nullable=True)
    so_chung_tu = Column(String(50), nullable=True)
    series_pgh = Column(String(50), nullable=True)
    status = Column(Boolean, nullable=True)
    note = Column(String(255), nullable=True)
    scan_status = Column(Boolean, default=False)
    updated_by = Column(String(10), nullable=True)
    updated_date = Column(DateTime, default=func.now())
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(10), nullable=True)


class ProductsInIWTR(Base):
    __tablename__ = "products_in_iwtr"

    id = Column(Integer, primary_key=True)
    internal_warehouse_transfer_requests_id = Column(Integer, ForeignKey("internal_warehouse_transfer_requests.id"), nullable=False)
    product_code = Column(String(20), nullable=False)
    product_name = Column(String(255), nullable=True)
    tu_kho = Column(Integer, nullable=True)
    den_kho = Column(Integer, nullable=True)
    total_quantity = Column(Integer, nullable=True)
    dvt = Column(String(20), nullable=True)
    updated_by = Column(String(10), nullable=True)
    updated_date = Column(DateTime, default=func.now())


class InventoriesInIWTR(Base):
    __tablename__ = "inventories_in_iwtr"

    id = Column(Integer, primary_key=True)
    product_in_iwtr_id = Column(Integer, ForeignKey("products_in_iwtr.id"), nullable=False)
    inventory_identifier = Column(String(20), nullable=True)
    serial_pallet = Column(String(50), nullable=True)
    scan_by = Column(String(10), nullable=True)
    quantity_dispatched = Column(Integer, nullable=True)
    scan_time = Column(DateTime, default=func.now())
    confirmed = Column(Boolean, default=False)


class OutboundShipmentRequestOnOrder(Base):
    __tablename__ = "outbound_shipment_requests_on_order"

    id = Column(Integer, primary_key=True)
    ma_yc_xk = Column(String(50), unique=True, nullable=False)
    kho_xuat = Column(Integer, nullable=True)
    xuat_toi = Column(Integer, nullable=True)
    don_vi_linh = Column(String(50), nullable=True)
    don_vi_nhan = Column(String(50), nullable=True)
    ly_do_xuat_nhap = Column(String(255), nullable=True)
    ngay_chung_tu = Column(String(50), nullable=True)
    so_phieu_xuat = Column(String(50), nullable=True)
    so_chung_tu = Column(String(50), nullable=True)
    series_pgh = Column(String(50), nullable=True)
    status = Column(Boolean, nullable=True)
    note = Column(String(20), nullable=True)
    scan_status = Column(Boolean, default=False)
    updated_by = Column(String(10), nullable=True)
    updated_date = Column(DateTime, default=func.now())
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(10), nullable=True)


class ProductsInOSR(Base):
    __tablename__ = "products_in_osr"

    id = Column(Integer, primary_key=True)
    outbound_shipment_request_on_order_id = Column(Integer, ForeignKey("outbound_shipment_requests_on_order.id"), nullable=False)
    product_code = Column(String(20), nullable=False)
    product_name = Column(String(255), nullable=True)
    total_quantity = Column(Integer, nullable=True)
    dvt = Column(String(20), nullable=True)
    updated_by = Column(String(10), nullable=True)
    updated_date = Column(DateTime, default=func.now())


class InventoriesInOSR(Base):
    __tablename__ = "inventories_in_osr"

    id = Column(Integer, primary_key=True)
    product_in_osr_id = Column(Integer, ForeignKey("products_in_osr.id"), nullable=False)
    inventory_identifier = Column(String(20), nullable=False)
    serial_pallet = Column(String(50), nullable=False)
    scan_by = Column(String(10), nullable=False)
    quantity_dispatched = Column(Integer, nullable=False)
    scan_time = Column(DateTime, default=func.now())
    confirmed = Column(Boolean, default=False)