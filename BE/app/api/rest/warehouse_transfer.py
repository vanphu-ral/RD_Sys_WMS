from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.modules.users.schemas import User
from app.modules.warehouse_transfer import repository as crud
from app.modules.warehouse_transfer.schemas import (
    WarehouseTransfer,
    WarehouseTransferApprovalUpdate, 
    WarehouseTransferCreate, 
    WarehouseTransferUpdate,
    WarehouseTransferInDB,
    WarehouseTransferPallet,
    WarehouseTransferPalletCreate,
    WarehouseTransferPalletUpdate,
    WarehouseTransferInventory,
    WarehouseTransferInventoryCreate,
    WarehouseTransferInventoryUpdate,
    WarehouseTransferWithDetails,
    WarehouseTransferPalletWithDetail,
    WarehouseTransferInventoryWithDetail,
    WarehouseTransferApproval,
    WarehouseTransferApprovalBase,
    WarehouseTransferApprovalCreate
)
from app.core.security import get_db, get_current_user 


router = APIRouter()

@router.get("/", response_model=List[WarehouseTransfer])
async def read_requirements(
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=1000, description="Số bản ghi trả về tối đa"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái"),
    source_warehouse: Optional[str] = Query(None, description="Lọc theo kho nguồn"),
    destination_warehouse: Optional[str] = Query(None, description="Lọc theo kho đích"),
    db: Session = Depends(get_db)
    # current_user: User = Depends(get_current_user)
):
    
    requirements = await crud.get_requirements(
        db=db,
        # tenant_id = current_user.get("branch"),
        skip=skip,
        limit=limit,
        status=status,
        source_warehouse=source_warehouse,
        destination_warehouse=destination_warehouse
    )
    return requirements

@router.get("/{requirement_id}", response_model=WarehouseTransfer)
async def read_requirement(
    requirement_id: int = Path(..., gt=0, description="ID của requirement"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy chi tiết một warehouse transfer requirement bằng ID.
    Yêu cầu authentication.
    Kiểm tra quyền truy cập (tenant_id phải khớp).
    """
    tenant_id = current_user.get("branch")
    requirement = await crud.get_requirement(
        db=db, 
        requirement_id=requirement_id, 
        tenant_id=tenant_id
    )
    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found or access denied"
        )
    return requirement

@router.get("/detail/{requirement_id}", response_model=WarehouseTransfer)
async def read_detail_requirement(
    requirement_id: int = Path(..., gt=0, description="ID của requirement"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy chi tiết một warehouse transfer requirement và các thông tin box pallet trong yêu cầu bằng ID.
    Yêu cầu authentication.
    Kiểm tra quyền truy cập (tenant_id phải khớp).
    """
    tenant_id = current_user.get("branch")
    requirement = await crud.get_requirement(
        db=db, 
        requirement_id=requirement_id, 
        tenant_id=tenant_id
    )
    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found or access denied"
        )
    return requirement


@router.post("/", response_model=WarehouseTransfer, status_code=status.HTTP_201_CREATED)
async def create_requirement(
    requirement: WarehouseTransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo mới warehouse transfer requirement.
    Yêu cầu authentication.
    Tự động gán tenant_id, created_by từ user hiện tại.
    """
    
    return await crud.create_requirement(
        db=db,
        requirement=requirement,
        tenant_id= current_user.get("branch") or "admin",
        created_by=current_user.get("preferred_username") 
    )

@router.put("/{requirement_id}", response_model=WarehouseTransfer)
async def update_requirement(
    requirement_update: WarehouseTransferUpdate,
    requirement_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    tenant_id = current_user.get("branch")
    updated_requirement = await crud.update_requirement(
        db=db,
        requirement_id=requirement_id,
        requirement_update=requirement_update,
        tenant_id=tenant_id,
        updated_by=current_user.get("preferred_username")
    )
    if not updated_requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found or access denied"
        )
    return updated_requirement

@router.get("/with-details/{requirement_id}", response_model=WarehouseTransferWithDetails)
async def read_requirement_with_details(
    requirement_id: int = Path(..., gt=0, description="ID của requirement"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy requirement kèm pallets và inventories.
    Yêu cầu authentication.
    Kiểm tra quyền truy cập (tenant_id phải khớp).
    """
    tenant_id = current_user.get("branch")
    result = await crud.get_requirement_with_details(
        db=db, 
        requirement_id=requirement_id, 
        tenant_id=tenant_id
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found or access denied"
        )
    return result

@router.get("/approvals/with-details/{requirement_id}", response_model=WarehouseTransferWithDetails)
async def read_requirement_approval_with_details(
    requirement_id: int = Path(..., gt=0, description="ID của requirement"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy requirement kèm pallets và inventories.
    Yêu cầu authentication.
    Kiểm tra quyền truy cập (tenant_id phải khớp).
    """
    tenant_id = current_user.get("branch")
    result = await crud.get_requirement_approval_with_details(
        db=db, 
        requirement_id=requirement_id, 
        tenant_id=tenant_id
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found or access denied"
        )
    return result

@router.delete("/{requirement_id}", response_model=WarehouseTransfer)
async def delete_requirement(
    requirement_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa mềm warehouse transfer requirement.
    Yêu cầu authentication.
    Tự động gán deleted_by từ user hiện tại.
    Kiểm tra quyền truy cập (tenant_id phải khớp).
    """
    tenant_id = current_user.get("branch")
    deleted_requirement = await crud.delete_requirement(
        db=db,
        requirement_id=requirement_id,
        tenant_id=tenant_id,
        deleted_by=current_user.username
    )
    if not deleted_requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found or access denied"
        )
    return deleted_requirement

# WarehouseTransferPallet CRUD endpoints
@router.get("/pallets/", response_model=List[WarehouseTransferPallet])
async def read_pallets(
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=1000, description="Số bản ghi trả về tối đa"),
    requirement_id: Optional[int] = Query(None, description="Lọc theo requirement ID"),
    db: AsyncSession = Depends(get_db)
):
    pallets = await crud.get_pallets(
        db=db,
        skip=skip,
        limit=limit,
        requirement_id=requirement_id,
        tenant_id=None
    )
    return pallets


@router.get("/pallets/{pallet_id}", response_model=WarehouseTransferPallet)
async def read_pallet(
    pallet_id: int = Path(..., gt=0, description="ID của pallet"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy chi tiết một warehouse transfer pallet bằng ID.
    Yêu cầu authentication.
    Kiểm tra quyền truy cập (tenant_id phải khớp).
    """
    tenant_id = current_user.get("branch")
    pallet = await crud.get_pallet(
        db=db, 
        pallet_id=pallet_id, 
        tenant_id=tenant_id
    )
    if not pallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pallet not found or access denied"
        )
    return pallet


@router.post("/pallets/", response_model=WarehouseTransferPallet, status_code=status.HTTP_201_CREATED)
async def create_pallet(
    pallet: WarehouseTransferPalletCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo mới warehouse transfer pallet.
    Yêu cầu authentication.
    Tự động gán created_by từ user hiện tại.
    """
    tenant_id = current_user.get("branch")
    return await crud.create_pallet(
        db=db,
        pallet=pallet,
        tenant_id=tenant_id,
        created_by=current_user.get("preferred_username")
    )


@router.put("/pallets/{pallet_id}", response_model=WarehouseTransferPallet)
async def update_pallet(
    pallet_update: WarehouseTransferPalletUpdate,
    pallet_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật warehouse transfer pallet.
    Yêu cầu authentication.
    Kiểm tra quyền truy cập (tenant_id phải khớp).
    """
    tenant_id = current_user.get("branch")
    updated_pallet = await crud.update_pallet(
        db=db,
        pallet_id=pallet_id,
        pallet_update=pallet_update,
        tenant_id=tenant_id,
        updated_by=current_user.get("preferred_username")
    )
    if not updated_pallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pallet not found or access denied"
        )
    return updated_pallet


@router.delete("/pallets/{pallet_id}", response_model=WarehouseTransferPallet)
async def delete_pallet(
    pallet_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa warehouse transfer pallet bằng ID.
    Yêu cầu authentication nhưng KHÔNG lọc theo tenant_id.
    """

    deleted_pallet = await crud.delete_pallet(
        db=db,
        pallet_id=pallet_id
    )
    
    if not deleted_pallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pallet not found"  
        )
        
    return deleted_pallet


# WarehouseTransferInventory CRUD endpoints
@router.get("/inventories/", response_model=List[WarehouseTransferInventory])
async def read_inventories(
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=1000, description="Số bản ghi trả về tối đa"),
    requirement_id: Optional[int] = Query(None, description="Lọc theo requirement ID"),
    db: AsyncSession = Depends(get_db)
):
    inventories = await crud.get_inventories(
        db=db,
        skip=skip,
        limit=limit,
        requirement_id=requirement_id,
        tenant_id=None
    )
    return inventories


@router.get("/inventories/{inventory_id}", response_model=WarehouseTransferInventory)
async def read_inventory(
    inventory_id: int = Path(..., gt=0, description="ID của inventory"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy chi tiết một warehouse transfer inventory bằng ID.
    Yêu cầu authentication.
    Kiểm tra quyền truy cập (tenant_id phải khớp).
    """
    tenant_id = current_user.get("branch")
    inventory = await crud.get_inventory(
        db=db, 
        inventory_id=inventory_id, 
        tenant_id=tenant_id
    )
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found or access denied"
        )
    return inventory


@router.post("/inventories/", response_model=WarehouseTransferInventory, status_code=status.HTTP_201_CREATED)
async def create_inventory(
    inventory: WarehouseTransferInventoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo mới warehouse transfer inventory.
    Yêu cầu authentication.
    Tự động gán created_by từ user hiện tại.
    """
    tenant_id = current_user.get("branch")
    return await crud.create_inventory(
        db=db,
        inventory=inventory,
        tenant_id=tenant_id,
        created_by=current_user.get("preferred_username")
    )


@router.put("/inventories/{inventory_id}", response_model=WarehouseTransferInventory)
async def update_inventory(
    inventory_update: WarehouseTransferInventoryUpdate,
    inventory_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật warehouse transfer inventory.
    Yêu cầu authentication.
    Kiểm tra quyền truy cập (tenant_id phải khớp).
    """
    tenant_id = current_user.get("branch")
    updated_inventory = await crud.update_inventory(
        db=db,
        inventory_id=inventory_id,
        inventory_update=inventory_update,
        tenant_id=tenant_id,
        updated_by=current_user.get("preferred_username")
    )
    if not updated_inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found or access denied"
        )
    return updated_inventory


@router.delete("/inventories/{inventory_id}", response_model=WarehouseTransferInventory)
async def delete_inventory(
    inventory_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa warehouse transfer inventory.
    Yêu cầu authentication.
    Kiểm tra quyền truy cập (tenant_id phải khớp).
    """
    tenant_id = current_user.get("branch")
    deleted_inventory = await crud.delete_inventory(
        db=db,
        inventory_id=inventory_id
    )
    if not deleted_inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory not found or access denied"
        )
    return deleted_inventory


@router.get("/approvals/", response_model=List[WarehouseTransferApproval])
async def read_requirement_approvals(
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=1000, description="Số bản ghi trả về tối đa"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái"),
    source_warehouse: Optional[str] = Query(None, description="Lọc theo kho nguồn"),
    destination_warehouse: Optional[str] = Query(None, description="Lọc theo kho đích"),
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_user)
):
    
    requirements = await crud.get_requirement_approvals(
        db=db,
        # tenant_id = current_user.get("branch"),
        skip=skip,
        limit=limit,
        status=status,
        source_warehouse=source_warehouse,
        destination_warehouse=destination_warehouse
    )
    return requirements


@router.post("/approvals/", response_model=WarehouseTransferApproval, status_code=status.HTTP_201_CREATED)
async def create_requirement_approval(
    requirement: WarehouseTransferApprovalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # tenant_id = requirement.tenant_id
    created_by = current_user.get("preferred_username")
    return await crud.create_requirement_approval(
        db=db,
        requirement=requirement,
        # tenant_id=tenant_id,
        created_by=created_by
    )


# @router.get("/approvals/{requirement_approval_id}", response_model=WarehouseTransferApproval)
# async def read_requirement_approval(
#     requirement_id: int = Path(..., gt=0, description="ID của requirement"),
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
    
#     requirements = await crud.get_requirement_approvals(
#         db=db,
#         # tenant_id = current_user.get("branch"),
#         skip=skip,
#         limit=limit,
#         status=status,
#         source_warehouse=source_warehouse,
#         destination_warehouse=destination_warehouse
#     )
#     return requirements

@router.get("/approvals/{requirement_id}", response_model=WarehouseTransferApproval)
async def read_requirement_approval(
    requirement_id: int = Path(..., gt=0, description="ID của requirement"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy chi tiết một warehouse transfer requirement bằng ID.
    Yêu cầu authentication.
    Kiểm tra quyền truy cập (tenant_id phải khớp).
    """
    tenant_id = current_user.get("branch")
    requirement = await crud.get_requirement_approval(
        db=db, 
        requirement_id=requirement_id, 
        tenant_id=tenant_id
    )
    if not requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found or access denied"
        )
    return requirement

@router.put("/approvals/{requirement_id}", response_model=WarehouseTransferApproval)
async def update_requirement_approval(
    requirement_approval_update: WarehouseTransferApprovalUpdate,
    requirement_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    tenant_id = current_user.get("branch")
    updated_requirement = await crud.update_requirement_approval(
        db=db,
        requirement_id=requirement_id,
        requirement_update=requirement_approval_update,
        tenant_id=tenant_id,
        updated_by=current_user.get("preferred_username")
    )
    if not updated_requirement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requirement not found or access denied"
        )
    return updated_requirement