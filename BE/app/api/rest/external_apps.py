
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from app.core.database import get_db, get_external_apps_db
from app.core.security import get_current_user
from app.modules.inventory.service import External_Apps_Service
from app.modules.inventory.external_apps_schemas import (
    UpdateInventoryQuantityRequest,
    UpdateInventoryLocationRequest,
    InventoryUpdateResponse,
    IWTRFullOWTRWTR1Response,
    IWTRHeaderResponse,
    OSRFullORDRRDR1Response
)
from app.modules.inventory.external_apps_service import InventoryUpdateService

router = APIRouter()


@router.get("/import-requirements", response_model=List[dict])
async def get_external_apps_import_requirements(
    db: Session = Depends(get_db),
    #current_user: str = Depends(get_current_user)
):
    return External_Apps_Service.get_external_apps_import_requirements(db)


@router.get("/iwtr", response_model=List[dict])
async def get_external_apps_iwtr(
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    #current_user: str = Depends(get_current_user)
):
    return await External_Apps_Service.get_external_apps_iwtr(external_apps_db)

@router.get("/iwtr/{doc_entry}", response_model=IWTRFullOWTRWTR1Response)
async def get_external_apps_iwtr_by_doc_entry(
    doc_entry: int,
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    #current_user: str = Depends(get_current_user)
):

    from app.modules.inventory.external_apps_service import ExternalAppsIWTRService

    iwtr = await ExternalAppsIWTRService.get_iwtr_owtr_wtr1_format(external_apps_db, doc_entry)
    if not iwtr:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"IWTR with doc_entry {doc_entry} not found in External Apps")

    return iwtr


@router.get("/iwtr/{doc_entry}/header", response_model=IWTRHeaderResponse)
async def get_external_apps_iwtr_header_by_doc_entry(
    doc_entry: int,
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    #current_user: str = Depends(get_current_user)
):
    """
    Get IWTR header only (original format) - for backward compatibility
    """
    from app.modules.inventory.external_apps_service import ExternalAppsIWTRService
    from app.modules.inventory.external_apps_schemas import IWTRHeaderResponse

    iwtr = await ExternalAppsIWTRService.get_iwtr_by_doc_entry(external_apps_db, doc_entry)
    if not iwtr:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"IWTR with doc_entry {doc_entry} not found in External Apps")

    return iwtr


@router.get("/osr", response_model=List[dict])
async def get_external_apps_osr(
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    #current_user: str = Depends(get_current_user)
):

    return await External_Apps_Service.get_external_apps_osr(external_apps_db)


@router.get("/osr/{doc_entry}", response_model=OSRFullORDRRDR1Response)
async def get_external_apps_osr_by_doc_entry(
    doc_entry: int,
    external_apps_db: AsyncSession = Depends(get_external_apps_db),
    #current_user: str = Depends(get_current_user)
):
    """
    Get OSR data in ORDR/RDR1 format by DocEntry from External Apps
    """
    from app.modules.inventory.external_apps_service import ExternalAppsOSRService
    import logging
    
    # Setup logging
    logger = logging.getLogger(__name__)
    logger.info(f"Starting get_external_apps_osr_by_doc_entry with doc_entry={doc_entry}")
    
    try:
        logger.info(f"Calling ExternalAppsOSRService.get_osr_ordr_rdr1_format with doc_entry={doc_entry}")
        osr = await ExternalAppsOSRService.get_osr_ordr_rdr1_format(external_apps_db, doc_entry)
        logger.info(f"Service call completed, osr result: {osr}")
        
        if not osr:
            logger.warning(f"OSR with DocEntry {doc_entry} not found in External Apps")
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail=f"OSR with DocEntry {doc_entry} not found in External Apps")

        logger.info(f"Successfully retrieved OSR data for doc_entry={doc_entry}")
        return osr
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log full error details for debugging
        import traceback
        logger.error(f"Error in get_external_apps_osr_by_doc_entry for doc_entry={doc_entry}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Return detailed error information for debugging
        from fastapi import HTTPException
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "error_type": type(e).__name__,
                "doc_entry": doc_entry,
                "message": f"Error retrieving OSR data for DocEntry {doc_entry}"
            }
        )




