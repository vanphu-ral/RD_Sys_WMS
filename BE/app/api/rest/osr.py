
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_external_apps_db
from app.core.security import get_current_user
from app.modules.inventory.service import OSRService
from app.modules.inventory.external_apps_service import ExternalAppsOSRService, ExternalAppsDataMapper
from app.modules.inventory.schemas import OSRResponse
from app.modules.inventory.external_apps_schemas import (
    OSRHeaderResponse,
    OSRCreateRequest,
    OSRFullResponse,
    ExternalAppsSyncResponse,
    OSRCreateResponse,
    OSRInventoriesCreateRequest,
    OSRInventoriesCreateResponse,
    InventoryInOSRResponse,
    OSRScanDetailRequest,
    OSRScanDetailResponse
)
from app.modules.inventory.schemas import BulkUpdateInventoriesInOSRRequest

router = APIRouter()


@router.get("/sap/osr", response_model=List[OSRHeaderResponse])
async def get_osr_from_external_apps(
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    doc_entry: Optional[int] = Query(None, description="Filter by DocEntry"),
    doc_num: Optional[int] = Query(None, description="Filter by DocNum"),
    doc_status: Optional[str] = Query(None, description="Filter by DocStatus (O=Open, C=Closed)"),
    canceled: str = Query('N', description="Filter by CANCELED flag (Y/N)"),
    from_date: Optional[datetime] = Query(None, description="Filter from date"),
    to_date: Optional[datetime] = Query(None, description="Filter to date"),
    card_code: Optional[str] = Query(None, description="Filter by customer code"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to fetch"),
    current_user: str = Depends(get_current_user)
):

    try:
        osr_list = await ExternalAppsOSRService.get_osr_from_external_apps(
            external_apps_db=external_apps_db,
            doc_entry=doc_entry,
            doc_num=doc_num,
            doc_status=doc_status,
            canceled=canceled,
            from_date=from_date,
            to_date=to_date,
            card_code=card_code,
            limit=limit
        )
        return osr_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching OSR from SAP: {str(e)}")


@router.get("/sap/osr/{doc_entry}", response_model=OSRHeaderResponse)
async def get_osr_by_doc_entry(
    doc_entry: int,
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    current_user: str = Depends(get_current_user)
):

    try:
        osr = await ExternalAppsOSRService.get_osr_by_doc_entry(external_apps_db, doc_entry)
        if not osr:
            raise HTTPException(status_code=404, detail=f"OSR with DocEntry {doc_entry} not found in SAP")
        return osr
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching OSR from SAP: {str(e)}")


@router.get("/sap/osr/open", response_model=List[OSRHeaderResponse])
async def get_open_osr_from_external_apps(
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to fetch"),
    current_user: str = Depends(get_current_user)
):

    try:
        osr_list = await ExternalAppsOSRService.get_open_osr_from_external_apps(external_apps_db, limit)
        return osr_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching open OSR from SAP: {str(e)}")


@router.get("/sap/osr/full/{doc_entry}", response_model=OSRFullResponse)
async def get_full_osr_by_doc_entry(
    doc_entry: int,
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    current_user: str = Depends(get_current_user)
):

    try:
        full_osr = await ExternalAppsOSRService.get_full_osr_by_doc_entry(external_apps_db, doc_entry)
        if not full_osr:
            raise HTTPException(status_code=404, detail=f"OSR with DocEntry {doc_entry} not found in SAP")
        return full_osr
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching full OSR from SAP: {str(e)}")


@router.get("/requests", response_model=List[dict])
async def get_osr_requests(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get all OSR requests from WMS database
    """
    return await OSRService.get_osr_requests(db)


@router.post("/requests", response_model=OSRResponse)
async def create_osr_request(
    osr_data: OSRCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    try:
        osr = await OSRService.create_osr_request(db, osr_data.model_dump())
        return osr
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating OSR: {str(e)}")



@router.patch("/requests/{request_id}/confirm-location")
async def confirm_osr_location(
    request_id: int,
    location_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    return await OSRService.confirm_osr_location(db, request_id, location_id)


@router.post("/requests/{request_id}/scan", response_model=OSRScanDetailResponse)
async def scan_osr(
    request_id: int,
    scan_request: OSRScanDetailRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    try:
        # Convert Pydantic models to dict for service layer
        scan_details = [item.model_dump() for item in scan_request.scan_details]
        result = await OSRService.scan_osr(db, request_id, scan_details)
        return OSRScanDetailResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scanning OSR: {str(e)}")


@router.get("/requests/{product_in_ors_id}/scan", response_model=List[dict])
async def get_osr_scan_details(
    product_in_ors_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get all scan details for a specific product in OSR by product_in_ors_id (no pagination)
    """
    try:
        scan_details = await OSRService.get_scan_details_by_product_in_osr_id(db, product_in_ors_id)
        return scan_details
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching OSR scan details: {str(e)}")


@router.post("/requests/with-items", response_model=OSRCreateResponse)
async def create_osr_with_items(
    request_data: OSRCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    try:
        # Prepare OSR header data
        osr_data = request_data.model_dump()

        # Create OSR only
        osr = await OSRService.create_osr_request(db, osr_data)

        return OSRCreateResponse(
            success=True,
            message="OSR created successfully",
            osr_id=osr.id
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating OSR: {str(e)}"
        )


@router.post("/requests/{request_id}/inventories", response_model=OSRInventoriesCreateResponse)
async def create_osr_inventories(
    request_id: int,
    request_data: OSRInventoriesCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):

    try:
        async with db.begin():
            # Verify OSR exists
            osr = await OSRService.get_osr_request_by_id(db, request_id)
            if not osr:
                raise HTTPException(status_code=404, detail=f"OSR with ID {request_id} not found")

            # Convert inventories to dict list
            inventories_data = [inv.model_dump() for inv in request_data.inventories]

            # Create inventories in OSR
            inventories = await OSRService.create_products_in_osr(
                db=db,
                osr_id=request_id,
                inventories_data=inventories_data
            )

            # Format response
            inventories_response = [
                InventoryInOSRResponse(
                    id=inv.id,
                    outbound_shipment_request_on_order_id=inv.outbound_shipment_request_on_order_id,
                    product_code=inv.product_code,
                    product_name=inv.product_name,
                    total_quantity=inv.total_quantity,
                    dvt=inv.dvt,
                    updated_by=inv.updated_by,
                    updated_date=inv.updated_date
                )
                for inv in inventories
            ]

            return OSRInventoriesCreateResponse(
                success=True,
                inventories=inventories_response
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating inventories in OSR: {str(e)}"
        )


@router.get("/requests/{request_id}/items", response_model=List[InventoryInOSRResponse])
async def get_osr_inventories_by_request_id(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get all inventories for a specific OSR request by ID
    """
    try:
        inventories = await OSRService.get_inventories_by_osr_request_id(db, request_id)
        return inventories
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching OSR inventories: {str(e)}")


# cập nhật trạng thái của mã vật tư đã scan trong bảng inventories_in_osr
@router.patch("/inventories_in_osr")
async def update_inventories_in_osr(
    request: BulkUpdateInventoriesInOSRRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    updates = [
        {
            "product_in_osr_id": update.product_in_osr_id,
            "inventory_identifier": update.inventory_identifier,
            "quantity_imported": update.quantity_imported,
            "confirmed": update.confirmed
        }
        for update in request.updates
    ]
    return await OSRService.update_inventories_in_osr(
        db,
        updates
    )