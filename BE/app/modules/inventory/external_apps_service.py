"""
External Apps Service Layer for fetching IWTR and OSR data from External Apps database
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.modules.inventory.external_apps_models import OWTR, WTR1, ORDR, RDR1
from app.modules.inventory.external_apps_schemas import (
    IWTRHeaderResponse,
    OSRHeaderResponse,
    FilterParams
)


class ExternalAppsIWTRService:
    """Service for fetching IWTR data from External Apps database (OWTR table)"""
    
    @staticmethod
    async def get_iwtr_from_external_apps(
        external_apps_db: AsyncSession,
        doc_entry: Optional[int] = None,
        doc_num: Optional[int] = None,
        doc_status: Optional[str] = None,
        canceled: str = 'N',
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[IWTRHeaderResponse]:
        """
        Fetch IWTR headers from External Apps OWTR table

        Args:
            external_apps_db: External Apps database session
            doc_entry: Filter by DocEntry
            doc_num: Filter by DocNum
            doc_status: Filter by DocStatus (O=Open, C=Closed)
            canceled: Filter by CANCELED flag (default: 'N')
            from_date: Filter from date
            to_date: Filter to date
            limit: Maximum records to fetch
            
        Returns:
            List of IWTR header records
        """
        query = select(OWTR)
        
        # Build filters
        filters = [OWTR.CANCELED == canceled]
        
        if doc_entry:
            filters.append(OWTR.DocEntry == doc_entry)
        
        if doc_num:
            filters.append(OWTR.DocNum == doc_num)
        
        if doc_status:
            filters.append(OWTR.DocStatus == doc_status)
        
        if from_date:
            filters.append(OWTR.DocDate >= from_date)
        
        if to_date:
            filters.append(OWTR.DocDate <= to_date)
        
        query = query.where(and_(*filters))
        query = query.order_by(OWTR.DocEntry.desc())
        query = query.limit(limit)
        
        result = await sap_db.execute(query)
        records = result.scalars().all()
        
        return [IWTRHeaderResponse.model_validate(record) for record in records]
    
    @staticmethod
    async def get_iwtr_by_doc_entry(
        external_apps_db: AsyncSession,
        doc_entry: int
    ) -> Optional[IWTRHeaderResponse]:
        """
        Get single IWTR by DocEntry

        Args:
            external_apps_db: External Apps database session
            doc_entry: Document entry number
            
        Returns:
            IWTR header record or None
        """
        query = select(OWTR).where(OWTR.DocEntry == doc_entry)
        result = await external_apps_db.execute(query)
        record = result.scalar_one_or_none()
        
        if record:
            return IWTRHeaderResponse.model_validate(record)
        return None
    
    @staticmethod
    async def get_open_iwtr_from_external_apps(
        external_apps_db: AsyncSession,
        limit: int = 100
    ) -> List[IWTRHeaderResponse]:
        """
        Get all open (not canceled, status = 'O') IWTR from External Apps

        Args:
            external_apps_db: External Apps database session
            limit: Maximum records to fetch
            
        Returns:
            List of open IWTR records
        """
        return await ExternalAppsIWTRService.get_iwtr_from_external_apps(
            external_apps_db=external_apps_db,
            doc_status='O',
            canceled='N',
            limit=limit
        )


class ExternalAppsOSRService:
    """Service for fetching OSR data from External Apps database (ORDR table)"""
    
    @staticmethod
    async def get_osr_from_external_apps(
        external_apps_db: AsyncSession,
        doc_entry: Optional[int] = None,
        doc_num: Optional[int] = None,
        doc_status: Optional[str] = None,
        canceled: str = 'N',
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        card_code: Optional[str] = None,
        limit: int = 100
    ) -> List[OSRHeaderResponse]:
        """
        Fetch OSR headers from External Apps ORDR table

        Args:
            external_apps_db: External Apps database session
            doc_entry: Filter by DocEntry
            doc_num: Filter by DocNum
            doc_status: Filter by DocStatus (O=Open, C=Closed)
            canceled: Filter by CANCELED flag (default: 'N')
            from_date: Filter from date
            to_date: Filter to date
            card_code: Filter by customer code
            limit: Maximum records to fetch
            
        Returns:
            List of OSR header records
        """
        query = select(ORDR)
        
        # Build filters
        filters = [ORDR.CANCELED == canceled]
        
        if doc_entry:
            filters.append(ORDR.DocEntry == doc_entry)
        
        if doc_num:
            filters.append(ORDR.DocNum == doc_num)
        
        if doc_status:
            filters.append(ORDR.DocStatus == doc_status)
        
        if from_date:
            filters.append(ORDR.DocDate >= from_date)
        
        if to_date:
            filters.append(ORDR.DocDate <= to_date)
        
        if card_code:
            filters.append(ORDR.CardCode == card_code)
        
        query = query.where(and_(*filters))
        query = query.order_by(ORDR.DocEntry.desc())
        query = query.limit(limit)
        
        result = await external_apps_db.execute(query)
        records = result.scalars().all()
        
        return [OSRHeaderResponse.model_validate(record) for record in records]
    
    @staticmethod
    async def get_osr_by_doc_entry(
        external_apps_db: AsyncSession,
        doc_entry: int
    ) -> Optional[OSRHeaderResponse]:
        """
        Get single OSR by DocEntry

        Args:
            external_apps_db: External Apps database session
            doc_entry: Document entry number
            
        Returns:
            OSR header record or None
        """
        query = select(ORDR).where(ORDR.DocEntry == doc_entry)
        result = await external_apps_db.execute(query)
        record = result.scalar_one_or_none()
        
        if record:
            return OSRHeaderResponse.model_validate(record)
        return None
    
    @staticmethod
    async def get_open_osr_from_external_apps(
        external_apps_db: AsyncSession,
        limit: int = 100
    ) -> List[OSRHeaderResponse]:
        """
        Get all open (not canceled, status = 'O') OSR from External Apps

        Args:
            external_apps_db: External Apps database session
            limit: Maximum records to fetch
            
        Returns:
            List of open OSR records
        """
        return await ExternalAppsOSRService.get_osr_from_external_apps(
            external_apps_db=external_apps_db,
            doc_status='O',
            canceled='N',
            limit=limit
        )


class ExternalAppsDataMapper:
    """Helper class to map External Apps data to WMS data structures"""
    
    @staticmethod
    def map_owtr_to_iwtr_create(owtr: IWTRHeaderResponse, updated_by: str = "system") -> dict:
        """
        Map External Apps OWTR data to WMS IWTR create request

        Args:
            owtr: External Apps OWTR header data
            updated_by: User who is creating the record
            
        Returns:
            Dictionary for creating IWTR in WMS
        """
        return {
            "ma_yc_cknb": f"IWTR-{owtr.DocNum or owtr.DocEntry}",
            "tu_kho": None,  # Will be mapped from FromWhsCode to area_id
            "den_kho": None,  # Will be mapped from ToWhsCode to area_id
            "don_vi_linh": owtr.U_Pur_Nvgiao or "",
            "don_vi_nhan": owtr.U_Pur_NvNhan or "",
            "ly_do_xuat_nhap": owtr.Comments or "",
            "ngay_chung_tu": owtr.DocDate.strftime("%Y-%m-%d") if owtr.DocDate else None,
            "so_phieu_xuat": str(owtr.DocNum) if owtr.DocNum else "",
            "so_chung_tu": owtr.U_Docnum or "",
            "series_PGH": owtr.U_CodeSerial or "",
            "status": "Mới tạo từ External Apps",
            "note": f"External Apps DocEntry: {owtr.DocEntry}, FromWhs: {owtr.FromWhsCode}, ToWhs: {owtr.ToWhsCode}",
            "scan_status": "Chưa scan",
            "updated_by": updated_by
        }
    
    @staticmethod
    def map_ordr_to_osr_create(ordr: OSRHeaderResponse, updated_by: str = "system") -> dict:
        """
        Map External Apps ORDR data to WMS OSR create request

        Args:
            ordr: External Apps ORDR header data
            updated_by: User who is creating the record
            
        Returns:
            Dictionary for creating OSR in WMS
        """
        return {
            "ma_yc_xk": f"OSR-{ordr.DocNum or ordr.DocEntry}",
            "kho_xuat": None,  # Will be mapped from warehouse code to area_id
            "xuat_toi": None,
            "don_vi_linh": ordr.U_Pur_Nvgiao or "",
            "don_vi_nhan": ordr.CardName or "",
            "ly_do_xuat_nhap": "Xuất hàng theo đơn bán",
            "ngay_chung_tu": ordr.DocDate.strftime("%Y-%m-%d") if ordr.DocDate else None,
            "so_phieu_xuat": str(ordr.DocNum) if ordr.DocNum else "",
            "so_chung_tu": ordr.U_Docnum or "",
            "series_PGH": ordr.U_CodeSerial or "",
            "status": "Mới tạo từ External Apps",
            "note": f"External Apps DocEntry: {ordr.DocEntry}, Customer: {ordr.CardCode} - {ordr.CardName}",
            "scan_status": "Chưa scan",
            "updated_by": updated_by
        }