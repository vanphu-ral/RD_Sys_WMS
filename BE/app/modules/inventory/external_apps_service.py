
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.modules.inventory.external_apps_models import OWTR, WTR1, ORDR, RDR1
from app.modules.inventory.external_apps_schemas import (
    IWTRHeaderResponse,
    OSRHeaderResponse,
    RDR1LineResponse,
    OSRFullResponse,
    WTR1LineResponse,
    IWTRFullResponse,
    IWTRFullOWTRWTR1Response,
    OSRFullORDRRDR1Response,
    WTR1Response,
    FilterParams
)


class ExternalAppsIWTRService:

    
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

        result = await external_apps_db.execute(query)
        records = result.scalars().all()
        
        return [IWTRHeaderResponse.model_validate(record) for record in records]
    
    @staticmethod
    async def get_iwtr_by_doc_entry(
        external_apps_db: AsyncSession,
        doc_entry: int
    ) -> Optional[IWTRHeaderResponse]:

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

        return await ExternalAppsIWTRService.get_iwtr_from_external_apps(
            external_apps_db=external_apps_db,
            doc_status='O',
            canceled='N',
            limit=limit
        )

    @staticmethod
    async def get_wtr1_lines_by_doc_entry(
        external_apps_db: AsyncSession,
        doc_entry: int
    ) -> List[WTR1LineResponse]:

        query = select(WTR1).where(WTR1.DocEntry == doc_entry).order_by(WTR1.LineNum)
        result = await external_apps_db.execute(query)
        records = result.scalars().all()

        return [WTR1LineResponse.model_validate(record) for record in records]

    @staticmethod
    async def get_full_iwtr_by_doc_entry(
        external_apps_db: AsyncSession,
        doc_entry: int
    ) -> Optional[IWTRFullResponse]:
        header = await ExternalAppsIWTRService.get_iwtr_by_doc_entry(external_apps_db, doc_entry)
        if not header:
            return None

        # Get lines
        lines = await ExternalAppsIWTRService.get_wtr1_lines_by_doc_entry(external_apps_db, doc_entry)

        return IWTRFullResponse(
            main_information=header,
            detailed_information=lines
        )

    @staticmethod
    async def get_full_iwtr_by_doc_num(
        external_apps_db: AsyncSession,
        doc_num: int
    ) -> Optional[IWTRFullResponse]:

        query = select(OWTR).where(OWTR.DocNum == doc_num)
        result = await external_apps_db.execute(query)
        record = result.scalar_one_or_none()

        if record:
            header = IWTRHeaderResponse.model_validate(record)
            lines = await ExternalAppsIWTRService.get_wtr1_lines_by_doc_entry(external_apps_db, record.DocEntry)
            return IWTRFullResponse(
                main_information=header,
                detailed_information=lines
            )
        return None

    @staticmethod
    async def get_iwtr_owtr_wtr1_format(
        external_apps_db: AsyncSession,
        doc_entry: int
    ) -> Optional[IWTRFullOWTRWTR1Response]:

        # Get header (OWTR)
        header = await ExternalAppsIWTRService.get_iwtr_by_doc_entry(external_apps_db, doc_entry)
        if not header:
            return None

        # Get lines (WTR1)
        lines = await ExternalAppsIWTRService.get_wtr1_lines_by_doc_entry(external_apps_db, doc_entry)
        wtr1_lines = [WTR1Response.model_validate(line) for line in lines]

        return IWTRFullOWTRWTR1Response(
            OWTR=header,
            WTR1=wtr1_lines
        )


class ExternalAppsOSRService:
    
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

        return await ExternalAppsOSRService.get_osr_from_external_apps(
            external_apps_db=external_apps_db,
            doc_status='O',
            canceled='N',
            limit=limit
        )

    @staticmethod
    async def get_rdr1_lines_by_doc_entry(
        external_apps_db: AsyncSession,
        doc_entry: int
    ) -> List[RDR1LineResponse]:
 
        query = select(RDR1).where(RDR1.DocEntry == doc_entry).order_by(RDR1.LineNum)
        result = await external_apps_db.execute(query)
        records = result.scalars().all()

        return [RDR1LineResponse.model_validate(record) for record in records]

    @staticmethod
    async def get_full_osr_by_doc_entry(
        external_apps_db: AsyncSession,
        doc_entry: int
    ) -> Optional[OSRFullResponse]:
  
        # Get header
        header = await ExternalAppsOSRService.get_osr_by_doc_entry(external_apps_db, doc_entry)
        if not header:
            return None

        # Get lines
        lines = await ExternalAppsOSRService.get_rdr1_lines_by_doc_entry(external_apps_db, doc_entry)

        return OSRFullResponse(
            main_information=header,
            detailed_information=lines
        )

    @staticmethod
    async def get_full_osr_by_doc_num(
        external_apps_db: AsyncSession,
        doc_num: int
    ) -> Optional[OSRFullResponse]:

        query = select(ORDR).where(ORDR.DocNum == doc_num)
        result = await external_apps_db.execute(query)
        record = result.scalar_one_or_none()

        if record:
            header = OSRHeaderResponse.model_validate(record)
            lines = await ExternalAppsOSRService.get_rdr1_lines_by_doc_entry(external_apps_db, record.DocEntry)
            return OSRFullResponse(
                main_information=header,
                detailed_information=lines
            )
        return None

    @staticmethod
    async def get_osr_ordr_rdr1_format(
        external_apps_db: AsyncSession,
        doc_entry: int
    ) -> Optional[OSRFullORDRRDR1Response]:
 
        import logging
        
        # Setup logging
        logger = logging.getLogger(__name__)
        logger.info(f"ExternalAppsOSRService.get_osr_ordr_rdr1_format called with doc_entry={doc_entry}")
        
        try:
            # Get header (ORDR)
            logger.info(f"Getting OSR header for doc_entry={doc_entry}")
            header = await ExternalAppsOSRService.get_osr_by_doc_entry(external_apps_db, doc_entry)
            logger.info(f"Header result: {header}")
            
            if not header:
                logger.warning(f"No header found for doc_entry={doc_entry}")
                return None

            # Get lines (RDR1)
            logger.info(f"Getting RDR1 lines for doc_entry={doc_entry}")
            lines = await ExternalAppsOSRService.get_rdr1_lines_by_doc_entry(external_apps_db, doc_entry)
            logger.info(f"Lines result count: {len(lines) if lines else 0}")

            logger.info(f"Successfully created OSRFullORDRRDR1Response for doc_entry={doc_entry}")
            return OSRFullORDRRDR1Response(
                ORDR=header,
                RDR1=lines
            )
        except Exception as e:
            logger.error(f"Error in get_osr_ordr_rdr1_format for doc_entry={doc_entry}: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise


class ExternalAppsDataMapper:
    
    @staticmethod
    def map_owtr_to_iwtr_create(owtr: IWTRHeaderResponse, updated_by: str = "system") -> dict:

        return {
            "ma_yc_cknb": f"IWTR-{owtr.DocNum or owtr.DocEntry}",
            "tu_kho": None,  # Will be mapped from ToWhsCode to area_id
            "den_kho": None,  # Will be mapped from ToWhsCode to area_id
            "don_vi_linh": owtr.U_Pur_NVGiao or "",
            "don_vi_nhan": owtr.U_Pur_NVNhan or "",
            "ly_do_xuat_nhap": owtr.U_Category or "",
            "ngay_chung_tu": owtr.DocDate.strftime("%Y-%m-%d") if owtr.DocDate else None,
            "so_phieu_xuat": owtr.U_InvCode or "",
            "so_chung_tu": owtr.U_Docnum or "",
            "series_pgh": owtr.U_CodeSerial or "",
            "status": False,
            "note": f"External Apps DocEntry: {owtr.DocEntry}, ToWhs: {owtr.ToWhsCode}, Comments: {owtr.Comments or ''}",
            "scan_status": False,
            "updated_by": updated_by
        }
    
    @staticmethod
    def map_ordr_to_osr_create(ordr: OSRHeaderResponse, updated_by: str = "system") -> dict:

        return {
            "ma_yc_xk": f"OSR-{ordr.DocNum or ordr.DocEntry}",
            "kho_xuat": None,  # Will be mapped from warehouse code to area_id
            "xuat_toi": None,
            "don_vi_linh": ordr.U_Pur_NVGiao or "",
            "don_vi_nhan": ordr.U_Pur_NVNhan or ordr.CardName or "",
            "ly_do_xuat_nhap": ordr.U_Category or "Xuất hàng theo đơn bán",
            "ngay_chung_tu": ordr.DocDate.strftime("%Y-%m-%d") if ordr.DocDate else None,
            "so_phieu_xuat": ordr.U_InvCode or "",
            "so_chung_tu": ordr.U_Docnum or "",
            "series_pgh": ordr.U_CodeSerial or "",
            "status": False,
            "note": f"External Apps DocEntry: {ordr.DocEntry}, Customer: {ordr.CardCode} - {ordr.CardName}, Comments: {ordr.Comments or ''}",
            "scan_status": False,
            "updated_by": updated_by
        }


class InventoryUpdateService:
    
    @staticmethod
    async def update_inventory_quantity(
        db: AsyncSession,
        inventory_identifier: str,
        available_quantity: int,
        updated_by: str = "system"
    ) -> dict:

        from app.modules.inventory.models import Inventory
        from datetime import datetime
        
        # Find inventory by identifier
        query = select(Inventory).where(Inventory.identifier == inventory_identifier)
        result = await db.execute(query)
        inventory = result.scalar_one_or_none()
        
        if not inventory:
            raise ValueError(f"Inventory with identifier '{inventory_identifier}' not found")
        
        # Update quantity
        inventory.available_quantity = available_quantity
        inventory.updated_by = updated_by
        inventory.updated_date = datetime.now()
        
        await db.commit()
        await db.refresh(inventory)
        
        return {
            "id": inventory.id,
            "identifier": inventory.identifier,
            "quantity": inventory.quantity,
            "available_quantity": inventory.available_quantity,
            "location_id": inventory.location_id,
            "updated_by": inventory.updated_by,
            "updated_date": inventory.updated_date
        }
    
    @staticmethod
    async def update_inventory_location(
        db: AsyncSession,
        inventory_identifier: str,
        location_id: int,
        updated_by: str = "system"
    ) -> dict:
        """
        Update inventory location by identifier
        
        Args:
            db: Database session
            inventory_identifier: Inventory identifier
            location_id: New location ID
            updated_by: User who updated the inventory
            
        Returns:
            Updated inventory data
        """
        from app.modules.inventory.models import Inventory, Location
        from datetime import datetime
        
        # Verify location exists
        location_query = select(Location).where(Location.id == location_id)
        location_result = await db.execute(location_query)
        location = location_result.scalar_one_or_none()
        
        if not location:
            raise ValueError(f"Location with ID {location_id} not found")
        
        # Find inventory by identifier
        query = select(Inventory).where(Inventory.identifier == inventory_identifier)
        result = await db.execute(query)
        inventory = result.scalar_one_or_none()
        
        if not inventory:
            raise ValueError(f"Inventory with identifier '{inventory_identifier}' not found")
        
        # Update location
        inventory.last_location_id = inventory.location_id
        inventory.location_id = location_id
        inventory.updated_by = updated_by
        inventory.updated_date = datetime.now()
        
        await db.commit()
        await db.refresh(inventory)
        
        return {
            "id": inventory.id,
            "identifier": inventory.identifier,
            "quantity": inventory.quantity,
            "available_quantity": inventory.available_quantity,
            "location_id": inventory.location_id,
            "last_location_id": inventory.last_location_id,
            "updated_by": inventory.updated_by,
            "updated_date": inventory.updated_date
        }