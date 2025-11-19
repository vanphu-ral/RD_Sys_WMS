
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.inventory.schemas import BulkUpdateInventoriesInIWTRRequest
from app.core.database import get_db, get_external_apps_db
from app.core.security import get_current_user
from app.modules.inventory.service import IWTRService
from app.modules.inventory.external_apps_service import ExternalAppsIWTRService, ExternalAppsDataMapper
from app.modules.inventory.external_apps_schemas import (
    IWTRHeaderResponse,
    IWTRCreateRequest,
    IWTRResponse,
    IWTRFullResponse,
    IWTRFullOWTRWTR1Response,
    ExternalAppsSyncResponse,
    IWTRWithInventoriesRequest,
    IWTRWithInventoriesResponse,
    InventoryInIWTRResponse,
    IWTRScanDetailRequest,
    IWTRScanDetailResponse,
    IWTRInventoriesCreateRequest,
    IWTRInventoriesCreateResponse,
    InventoryInIWTRItem,
    IWTRSimpleRequest
)

router = APIRouter()



@router.get("/sap/iwtr", response_model=List[IWTRHeaderResponse])
async def get_iwtr_from_external_apps(
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    doc_entry: Optional[int] = Query(None, description="Filter by DocEntry"),
    doc_num: Optional[int] = Query(None, description="Filter by DocNum"),
    doc_status: Optional[str] = Query(None, description="Filter by DocStatus (O=Open, C=Closed)"),
    canceled: str = Query('N', description="Filter by CANCELED flag (Y/N)"),
    from_date: Optional[datetime] = Query(None, description="Filter from date"),
    to_date: Optional[datetime] = Query(None, description="Filter to date"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to fetch"),
    current_user: str = Depends(get_current_user)
):

    try:
        iwtr_list = await ExternalAppsIWTRService.get_iwtr_from_external_apps(
            external_apps_db=external_apps_db,
            doc_entry=doc_entry,
            doc_num=doc_num,
            doc_status=doc_status,
            canceled=canceled,
            from_date=from_date,
            to_date=to_date,
            limit=limit
        )
        return iwtr_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching IWTR from SAP: {str(e)}")


@router.get("/sap/iwtr/{doc_entry}", response_model=IWTRFullOWTRWTR1Response)
async def get_iwtr_by_doc_entry(
    doc_entry: int,
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get single IWTR by DocEntry from SAP in OWTR/WTR1 format
    """
    try:
        iwtr = await ExternalAppsIWTRService.get_iwtr_owtr_wtr1_format(external_apps_db, doc_entry)
        if not iwtr:
            raise HTTPException(status_code=404, detail=f"IWTR with DocEntry {doc_entry} not found in SAP")
        return iwtr
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Error fetching IWTR from SAP: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/sap/iwtr/{doc_entry}/header", response_model=IWTRHeaderResponse)
async def get_iwtr_header_by_doc_entry(
    doc_entry: int,
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get single IWTR header by DocEntry from SAP (original format)
    """
    try:
        iwtr = await ExternalAppsIWTRService.get_iwtr_by_doc_entry(external_apps_db, doc_entry)
        if not iwtr:
            raise HTTPException(status_code=404, detail=f"IWTR with DocEntry {doc_entry} not found in SAP")
        return iwtr
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Error fetching IWTR from SAP: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/sap/iwtr/{doc_entry}/full", response_model=IWTRFullResponse)
async def get_full_iwtr_by_doc_entry(
    doc_entry: int,
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get full IWTR data (header + lines) by DocEntry from SAP
    """
    try:
        iwtr = await ExternalAppsIWTRService.get_full_iwtr_by_doc_entry(external_apps_db, doc_entry)
        if not iwtr:
            raise HTTPException(status_code=404, detail=f"IWTR with DocEntry {doc_entry} not found in SAP")
        return iwtr
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching full IWTR from SAP: {str(e)}")


@router.get("/sap/iwtr/open", response_model=List[IWTRHeaderResponse])
async def get_open_iwtr_from_external_apps(
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to fetch"),
    current_user: str = Depends(get_current_user)
):

    try:
        iwtr_list = await ExternalAppsIWTRService.get_open_iwtr_from_external_apps(external_apps_db, limit)
        return iwtr_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching open IWTR from SAP: {str(e)}")



@router.get("/requests", response_model=List[dict])
async def get_iwtr_requests(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    return await IWTRService.get_iwtr_requests(db)



@router.patch("/requests/{request_id}/confirm-location")
async def confirm_iwtr_location(
    request_id: int,
    location_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    return await IWTRService.confirm_iwtr_location(db, request_id, location_id)


@router.post("/requests/{request_id}/scan", response_model=IWTRScanDetailResponse)
async def scan_iwtr(
    request_id: int,
    scan_request: IWTRScanDetailRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    try:
        # Convert Pydantic models to dict for service layer
        scan_details = [item.model_dump() for item in scan_request.scan_details]
        result = await IWTRService.scan_iwtr(db, request_id, scan_details)
        return IWTRScanDetailResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scanning IWTR: {str(e)}")


@router.post("/requests/{request_id}/items", response_model=IWTRInventoriesCreateResponse)
async def create_products_in_iwtr(
    request_id: int,
    request_data: IWTRInventoriesCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    try:

        inventories_data = [
            {
                "internal_warehouse_transfer_requests_id": request_id,
                "product_code": inv.product_code,
                "product_name": inv.product_name,
                "total_quantity": inv.total_quantity,
                "dvt": inv.dvt,
                "updated_by": inv.updated_by
            }
            for inv in request_data.items
        ]

        # Create inventories
        inventories_result = await IWTRService.create_products_in_iwtr(db, inventories_data)

        return IWTRInventoriesCreateResponse(
            success=True,
            inventories=inventories_result
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating inventories in IWTR: {str(e)}"
        )


@router.get("/requests/{request_id}/items", response_model=List[InventoryInIWTRResponse])
async def get_iwtr_inventories_by_request_id(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    try:
        inventories = await IWTRService.get_inventories_by_iwtr_request_id(db, request_id)
        return inventories
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching IWTR inventories: {str(e)}"
        )


@router.get("/request/{product_in_iwtr_id}/scan", response_model=List[dict])
async def get_iwtr_scan_details_by_product_in_iwtr_id(
    product_in_iwtr_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    try:
        scan_details = await IWTRService.get_scan_details_by_product_in_iwtr_id(db, product_in_iwtr_id)
        return scan_details
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching IWTR scan details: {str(e)}"
        )



@router.post("/requests/with-items", response_model=IWTRResponse)
async def create_iwtr_with_inventories(
    request_data: IWTRSimpleRequest,
    db: AsyncSession = Depends(get_db),

):

    try:
        iwtr_data = {
            "ma_yc_cknb": request_data.ma_yc_cknb,
            "tu_kho": request_data.tu_kho,
            "den_kho": request_data.den_kho,
            "don_vi_linh": request_data.don_vi_linh,
            "don_vi_nhan": request_data.don_vi_nhan,
            "ly_do_xuat_nhap": request_data.ly_do_xuat_nhap,
            "ngay_chung_tu": request_data.ngay_chung_tu,
            "status": False,
            "series_pgh": request_data.series_pgh,
            "note": request_data.note,
            "updated_by": request_data.updated_by
        }

        # Create IWTR and return the result
        iwtr_result = await IWTRService.create_iwtr_request(db, iwtr_data)

        # Return the IWTR for frontend to use the ID
        return iwtr_result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating IWTR: {str(e)}"
        )

# cập nhật trạng thái của mã vật tư đã scan trong bảng inventories_in_iwtr
@router.patch("/inventories_in_iwtr")
async def update_inventories_in_iwrt(
    request: BulkUpdateInventoriesInIWTRRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    updates = [
        {
            "product_in_iwtr_id": update.product_in_iwtr_id,
            "inventory_identifier": update.inventory_identifier,
            "quantity_imported": update.quantity_imported,
            "confirmed": update.confirmed
        }
        for update in request.updates
    ]
    return await IWTRService.update_inventories_in_iwrt(
        db,
        updates
    )