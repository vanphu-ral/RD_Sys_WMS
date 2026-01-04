
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from sqlalchemy import text

router = APIRouter()

@router.get("/status")
async def get_system_status():
    return {"status": "running", "version": "1.0.0"}

@router.get("/protected")
async def get_protected_data(current_user: dict = Depends(get_current_user)):
    return {
        "message": f"Hello {current_user['preferred_username']}, this is protected data",
        "user_info": current_user
    }

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check with database connection test"""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}