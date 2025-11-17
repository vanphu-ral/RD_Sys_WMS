"""
CRUD operations for inventory module (REST API)
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.inventory.schemas import (
    Product,
    ProductCreate,
    ProductUpdate,
    InventoryItem,
    InventoryItemCreate,
    InventoryItemUpdate
)
from app.modules.inventory.service import InventoryService

router = APIRouter()



# Inventory  CRUD tam chua dung
@router.get("/inventory-items", response_model=List[InventoryItem])
async def get_inventory_items(db: AsyncSession = Depends(get_db)):
    """Get all inventory items"""
    return await InventoryService.get_inventory_items(db)

@router.get("/inventory-items/{item_id}", response_model=InventoryItem)
async def get_inventory_item(item_id: int, db: AsyncSession = Depends(get_db)):
    """Get inventory item by ID"""
    return await InventoryService.get_inventory_item_by_id(db, item_id)

@router.post("/inventory-items", response_model=InventoryItem)
async def create_inventory_item(
    item: InventoryItemCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new inventory item"""
    return await InventoryService.create_inventory_item(db, item)

@router.put("/inventory-items/{item_id}", response_model=InventoryItem)
async def update_inventory_item(
    item_id: int,
    item_update: InventoryItemUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update existing inventory item"""
    return await InventoryService.update_inventory_item(db, item_id, item_update)

@router.delete("/inventory-items/{item_id}")
async def delete_inventory_item(item_id: int, db: AsyncSession = Depends(get_db)):
    """Delete inventory item"""
    await InventoryService.delete_inventory_item(db, item_id)
    return {"message": "Inventory item deleted successfully"}