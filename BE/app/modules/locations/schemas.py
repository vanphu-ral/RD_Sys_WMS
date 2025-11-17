
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class LocationBase(BaseModel):
    """Base location schema"""
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
    is_active: bool = True


class LocationCreate(LocationBase):
    """Location creation schema"""
    pass


class LocationUpdate(BaseModel):
    """Location update schema"""
    code: Optional[str] = None
    name: Optional[str] = None
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
    is_active: Optional[bool] = None
    updated_by: Optional[str] = None


class Location(LocationBase):
    """Location response schema"""
    id: int
    updated_by: Optional[str] = None
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class AreaBase(BaseModel):
    code: str
    name: str
    thu_kho: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True


class Area(AreaBase):
    id: int
    updated_by: Optional[str] = None
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class SubLocationCreate(BaseModel):
    """Sub-location creation schema for bulk operations"""
    code: str
    name: str
    area_id: Optional[int] = None
    address: Optional[str] = None
    is_multi_location: Optional[bool] = None
    humidity: Optional[float] = None
    temperature: Optional[float] = None
    barcode: Optional[str] = None
    is_active: bool = True
    updated_by: Optional[str] = None
     