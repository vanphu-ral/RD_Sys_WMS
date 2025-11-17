"""
REST API endpoints for Internal Warehouse Transfer Requests (IWTR)
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_external_apps_db
from app.core.security import get_current_user
from app.modules.inventory.service import IWTRService
from app.modules.inventory.external_apps_service import ExternalAppsIWTRService, ExternalAppsDataMapper
from app.modules.inventory.external_apps_schemas import (
    IWTRHeaderResponse,
    IWTRCreateRequest,
    IWTRResponse,
    ExternalAppsSyncResponse
)

router = APIRouter()


# ============================================================================
# SAP IWTR Endpoints (GET from SAP)
# ============================================================================

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
    # current_user: str = Depends(get_current_user)
):
    """
    Get IWTR (Internal Warehouse Transfer Requests) from SAP database (OWTR table)
    
    This endpoint fetches data directly from SAP without detail lines.
    """
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


@router.get("/sap/iwtr/{doc_entry}", response_model=IWTRHeaderResponse)
async def get_iwtr_by_doc_entry(
    doc_entry: int,
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    # current_user: str = Depends(get_current_user)
):
    """
    Get single IWTR by DocEntry from SAP
    """
    try:
        iwtr = await ExternalAppsIWTRService.get_iwtr_by_doc_entry(external_apps_db, doc_entry)
        if not iwtr:
            raise HTTPException(status_code=404, detail=f"IWTR with DocEntry {doc_entry} not found in SAP")
        return iwtr
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching IWTR from SAP: {str(e)}")


@router.get("/sap/iwtr/open", response_model=List[IWTRHeaderResponse])
async def get_open_iwtr_from_external_apps(
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to fetch"),
    # current_user: str = Depends(get_current_user)
):
    """
    Get all open IWTR from SAP (CANCELED='N', DocStatus='O')
    """
    try:
        iwtr_list = await ExternalAppsIWTRService.get_open_iwtr_from_external_apps(external_apps_db, limit)
        return iwtr_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching open IWTR from SAP: {str(e)}")


# ============================================================================
# WMS IWTR Endpoints (POST to WMS)
# ============================================================================

@router.get("/requests", response_model=List[dict])
async def get_iwtr_requests(
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    """
    Get all IWTR requests from WMS database
    """
    return await IWTRService.get_iwtr_requests(db)


@router.post("/requests", response_model=IWTRResponse)
async def create_iwtr_request(
    iwtr_data: IWTRCreateRequest,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    """
    Create new IWTR request in WMS database
    """
    try:
        iwtr = await IWTRService.create_iwtr_request(db, iwtr_data.model_dump())
        return iwtr
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating IWTR: {str(e)}")


@router.post("/sync-from-sap", response_model=ExternalAppsSyncResponse)
async def sync_iwtr_from_external_apps(
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    db: AsyncSession = Depends(get_db),
    doc_entry: Optional[int] = Query(None, description="Sync specific DocEntry"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to sync"),
    # current_user: str = Depends(get_current_user)
):
    """
    Sync IWTR from SAP to WMS database
    
    This endpoint:
    1. Fetches open IWTR from SAP (OWTR table)
    2. Maps SAP data to WMS format
    3. Creates new IWTR records in WMS database
    """
    try:
        # Fetch from SAP
        if doc_entry:
            external_apps_iwtr = await ExternalAppsIWTRService.get_iwtr_by_doc_entry(external_apps_db, doc_entry)
            external_apps_iwtr_list = [external_apps_iwtr] if external_apps_iwtr else []
        else:
            external_apps_iwtr_list = await ExternalAppsIWTRService.get_open_iwtr_from_external_apps(external_apps_db, limit)
        
        records_fetched = len(external_apps_iwtr_list)
        records_created = 0
        records_failed = 0
        errors = []
        
        # Create in WMS
        for external_apps_iwtr in external_apps_iwtr_list:
            try:
                # Map External Apps data to WMS format
                iwtr_data = ExternalAppsDataMapper.map_owtr_to_iwtr_create(external_apps_iwtr, "external_apps_sync")
                
                # Create in WMS
                await IWTRService.create_iwtr_request(db, iwtr_data)
                records_created += 1
            except Exception as e:
                records_failed += 1
                errors.append(f"DocEntry {external_apps_iwtr.DocEntry}: {str(e)}")
        
        return ExternalAppsSyncResponse(
            success=records_failed == 0,
            message=f"Synced {records_created} of {records_fetched} IWTR records from SAP",
            records_fetched=records_fetched,
            records_created=records_created,
            records_failed=records_failed,
            errors=errors if errors else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing IWTR from SAP: {str(e)}")


@router.patch("/requests/{request_id}/confirm-location")
async def confirm_iwtr_location(
    request_id: int,
    location_id: int,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):

    return await IWTRService.confirm_iwtr_location(db, request_id, location_id)


@router.post("/requests/{request_id}/scan")
async def scan_iwtr(
    request_id: int,
    scan_data: dict,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    """
    Scan IWTR request
    """
    return await IWTRService.scan_iwtr(db, request_id, scan_data)