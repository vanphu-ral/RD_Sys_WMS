
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
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

@router.get("/chat-bubble/embed")
async def get_embed_script():
    """
    Return the embeddable chat bubble script.
    
    This endpoint serves the HTML code that can be embedded
    in external websites to show the chat bubble.
    """
    # Create the embed HTML with proper script tag
    embed_html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>RD_Sys_WMS Chat Bubble</title>
</head>
<body>
    <script>
        // Configuration
        window.DeepTutorConfig = {
            apiUrl: "http://localhost:9030/api/v1/chat-bubble/chat",
            logoUrl: "http://localhost:9030/static/chat-bubble/IconRangDong.png",
            styleUrl: "http://localhost:9030/static/chat-bubble/style.css"
        };
    </script>
    <script src="http://localhost:9030/static/chat-bubble/chat-bubble.js"></script>
</body>
</html>"""

    return HTMLResponse(content=embed_html)


@router.post("/chat-bubble/chat")
async def chat_bubble_endpoint():
    """
    Endpoint for handling chat bubble messages.
    
    This endpoint receives messages from the chat bubble and returns responses.
    """
    # Placeholder implementation - replace with actual chat logic
    return {"message": {"content": "Xin chào! Tôi có thể giúp gì cho bạn?"}}