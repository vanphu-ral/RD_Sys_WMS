
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import External_Apps_Service

router = APIRouter()


@router.get("/import-requirements", response_model=List[dict])
async def get_external_apps_import_requirements(
    db: Session = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return External_Apps_Service.get_external_apps_import_requirements(db)


@router.get("/iwtr", response_model=List[dict])
async def get_external_apps_iwtr(
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return await External_Apps_Service.get_external_apps_iwtr(db)


@router.get("/osr", response_model=List[dict])
async def get_external_apps_osr(
    db: AsyncSession = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):

    return await External_Apps_Service.get_external_apps_osr(db)