"""
REST API endpoints for Outbound Shipment Requests (OSR)
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_external_apps_db
from app.core.security import get_current_user
from app.modules.inventory.service import OSRService
from app.modules.inventory.external_apps_service import ExternalAppsOSRService, ExternalAppsDataMapper
from app.modules.inventory.external_apps_schemas import (
    OSRHeaderResponse,
    OSRCreateRequest,
    OSRResponse,
    ExternalAppsSyncResponse
)

router = APIRouter()


# ============================================================================
# SAP OSR Endpoints (GET from SAP)
# ============================================================================

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
    # current_user: str = Depends(get_current_user)
):
    """
    Get OSR (Outbound Shipment Requests) from SAP database (ORDR table)
    
    This endpoint fetches sales order data directly from SAP without detail lines.
    """
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
    # current_user: str = Depends(get_current_user)
):
    """
    Get single OSR by DocEntry from SAP
    """
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
    # current_user: str = Depends(get_current_user)
):
    """
    Get all open OSR from SAP (CANCELED='N', DocStatus='O')
    """
    try:
        osr_list = await ExternalAppsOSRService.get_open_osr_from_external_apps(external_apps_db, limit)
        return osr_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching open OSR from SAP: {str(e)}")


# ============================================================================
# WMS OSR Endpoints (POST to WMS)
# ============================================================================

@router.get("/requests", response_model=List[dict])
async def get_osr_requests(
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    """
    Get all OSR requests from WMS database
    """
    return await OSRService.get_osr_requests(db)


@router.post("/requests", response_model=OSRResponse)
async def create_osr_request(
    osr_data: OSRCreateRequest,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    """
    Create new OSR request in WMS database
    """
    try:
        osr = await OSRService.create_osr_request(db, osr_data.model_dump())
        return osr
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating OSR: {str(e)}")


@router.post("/sync-from-sap", response_model=ExternalAppsSyncResponse)
async def sync_osr_from_external_apps(
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    db: AsyncSession = Depends(get_db),
    doc_entry: Optional[int] = Query(None, description="Sync specific DocEntry"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to sync"),
    # current_user: str = Depends(get_current_user)
):
    """
    Sync OSR from SAP to WMS database
    
    This endpoint:
    1. Fetches open OSR from SAP (ORDR table)
    2. Maps SAP data to WMS format
    3. Creates new OSR records in WMS database
    """
    try:
        # Fetch from SAP
        if doc_entry:
            external_apps_osr = await ExternalAppsOSRService.get_osr_by_doc_entry(external_apps_db, doc_entry)
            external_apps_osr_list = [external_apps_osr] if external_apps_osr else []
        else:
            external_apps_osr_list = await ExternalAppsOSRService.get_open_osr_from_external_apps(external_apps_db, limit)
        
        records_fetched = len(external_apps_osr_list)
        records_created = 0
        records_failed = 0
        errors = []
        
        # Create in WMS
        for external_apps_osr in external_apps_osr_list:
            try:
                # Map External Apps data to WMS format
                osr_data = ExternalAppsDataMapper.map_ordr_to_osr_create(external_apps_osr, "external_apps_sync")
                
                # Create in WMS
                await OSRService.create_osr_request(db, osr_data)
                records_created += 1
            except Exception as e:
                records_failed += 1
                errors.append(f"DocEntry {external_apps_osr.DocEntry}: {str(e)}")
        
        return ExternalAppsSyncResponse(
            success=records_failed == 0,
            message=f"Synced {records_created} of {records_fetched} OSR records from SAP",
            records_fetched=records_fetched,
            records_created=records_created,
            records_failed=records_failed,
            errors=errors if errors else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing OSR from SAP: {str(e)}")


@router.patch("/requests/{request_id}/confirm-location")
async def confirm_osr_location(
    request_id: int,
    location_id: int,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):

    return await OSRService.confirm_osr_location(db, request_id, location_id)


@router.post("/requests/{request_id}/scan")
async def scan_osr(
    request_id: int,
    scan_data: dict,
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):

    return await OSRService.scan_osr(db, request_id, scan_data)