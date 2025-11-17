
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class LocationBase(BaseModel):
    """Base location schema - based on actual DDL"""
    code: str  # NOT NULL, UNIQUE
    name: str  # NOT NULL, UNIQUE
    area_id: int  # NOT NULL (ForeignKey)
    address: Optional[str] = None  # NULL
    description: Optional[str] = None  # NULL
    is_multi_location: Optional[bool] = None  # NULL
    number_of_rack: Optional[int] = None  # NULL
    number_of_rack_empty: Optional[int] = None  # NULL
    parent_location_id: Optional[int] = None  # NULL (ForeignKey)
    prefix_name: Optional[str] = None  # NULL
    prefix_separator: Optional[str] = None  # NULL
    child_location_row_count: Optional[int] = None  # NULL
    child_location_column_count: Optional[int] = None  # NULL
    suffix_separator: Optional[str] = None  # NULL
    suffix_digit_len: Optional[int] = None  # NULL (SMALLINT) - must be integer, not string
    humidity: Optional[float] = None  # NULL (DOUBLE PRECISION)
    temperature: Optional[float] = None  # NULL (DOUBLE PRECISION)
    barcode: str  # NOT NULL
    is_active: bool = True
    updated_by: str  # NOT NULL
    
    # Data type conversion handled in API endpoint before reaching database
    pass


class LocationCreate(LocationBase):
    """Location creation schema"""
    pass  # Inherits all fields from LocationBase


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
    suffix_digit_len: Optional[int] = None
    humidity: Optional[float] = None
    temperature: Optional[float] = None
    barcode: Optional[str] = None
    is_active: Optional[bool] = None
    updated_by: Optional[str] = None


class LocationUpdateWithFullData(BaseModel):
    """Location update schema with full data fields"""
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
    suffix_digit_len: Optional[int] = None 
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


class SubLocationResponse(BaseModel):
    """Sub-location response schema"""
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
    humidity: Optional[float] = None
    temperature: Optional[float] = None
    barcode: Optional[str] = None
    is_active: bool = True
    updated_by: Optional[str] = None
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class LocationWithSubLocationsResponse(BaseModel):
    """Location response with sub-locations"""
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
    suffix_digit_len: Optional[int] = None
    humidity: Optional[float] = None
    temperature: Optional[float] = None
    barcode: Optional[str] = None
    is_active: bool = True
    updated_by: Optional[str] = None
    updated_date: Optional[datetime] = None
    sub_locations: list[SubLocationResponse] = []

    class Config:
        from_attributes = True