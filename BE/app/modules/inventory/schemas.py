
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


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
    thu_kho: str
    description: Optional[str] = None
    address: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


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
    area_id: Optional[int] = None
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
    suffix_digit_len: Optional[str] = None
    humidity: Optional[float] = None
    temperature: Optional[float] = None
    barcode: Optional[str] = None
    is_active: bool

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