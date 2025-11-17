
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.inventory.service import UIService

router = APIRouter()


@router.get("/areas", response_model=List[dict])
async def get_ui_areas(
    db: Session = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return UIService.get_ui_areas(db)


@router.get("/locations", response_model=List[dict])
async def get_ui_locations(
    db: Session = Depends(get_db),
    # current_user: str = Depends(get_current_user)
):
    return UIService.get_ui_locations(db)