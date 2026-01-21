"""
Chat Bubble API Router
======================

REST endpoints for embeddable chat bubble functionality.
Provides streaming chat responses for external website integration.
"""

from pathlib import Path
import sys
from urllib.parse import urlparse
from wsgiref import headers

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

# from src.agents.chat import ChatAgent
# from src.logging import get_logger
# from src.services.config import load_config_with_main
# from src.services.llm.config import get_llm_config

# Initialize logger
# project_root = Path(__file__).parent.parent.parent.parent
# config = load_config_with_main("solve_config.yaml", project_root)
# log_dir = config.get("paths", {}).get("user_log_dir") or config.get("logging", {}).get("log_dir")
# logger = get_logger("ChatBubbleAPI", level="INFO", log_dir=log_dir)

router = APIRouter()

LLM_URL = "http://192.168.10.99:3001/api/v1/workspace/nw/chat"

class ChatRequest(BaseModel):
    message: str

# async def generate_streaming_response(message: str):
#     """Generate streaming response using DeepTutor's ChatAgent"""
#     try:
#         # Get system language for agent
#         language = config.get("system", {}).get("language", "en")

#         # Initialize ChatAgent
#         llm_config = get_llm_config()
#         api_key = llm_config.api_key
#         base_url = llm_config.base_url
#         api_version = getattr(llm_config, "api_version", None)

#         agent = ChatAgent(
#             language=language,
#             config=config,
#             api_key=api_key,
#             base_url=base_url,
#             api_version=api_version,
#         )

#         # Process with streaming (simple mode for chat bubble)
#         stream_generator = await agent.process(
#             message=message,
#             history=[],  # No history for chat bubble
#             kb_name="",  # No knowledge base
#             enable_rag=False,  # Disable RAG
#             enable_web_search=False,  # Disable web search
#             stream=True,
#         )

#         async def stream_wrapper():
#             try:
#                 async for chunk_data in stream_generator:
#                     if chunk_data["type"] == "chunk":
#                         # Format as Ollama-style JSON lines for compatibility
#                         content = chunk_data["content"].replace('"', '\\"').replace('\n', '\\n')
#                         yield f'{{"message":{{"content":"{content}"}}}}\n'
#                     elif chunk_data["type"] == "complete":
#                         # Send final completion signal if needed
#                         pass
#             except Exception as e:
#                 logger.error(f"Streaming error: {e}")
#                 yield f'{{"error":"{str(e)}"}}\n'

#         return stream_wrapper()

#     except Exception as e:
#         logger.error(f"Chat processing error: {e}")
#         async def error_stream():
#             yield f'{{"error":"{str(e)}"}}\n'
#         return error_stream()



@router.post("/chat")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint for chat bubble.

    Accepts a simple message and proxies to the local LLM model.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(LLM_URL, json=request.dict(), 
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer 44MEZFA-SQHM1HY-K231HMZ-H9Y3ZKA",
                    "Accept": "application/json"
          })
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return StreamingResponse(
                response.aiter_bytes(),
                media_type=response.headers.get('content-type', 'application/json')
            )
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Error connecting to LLM: {str(e)}")

@router.get("/embed")
async def get_embed_script():
    """
    Return the embeddable chat bubble script.

    This endpoint serves the HTML code that can be embedded
    in external websites to show the chat bubble.
    """
    from fastapi.responses import HTMLResponse
    import os
    # from src.services.setup import get_backend_port

    # Determine API base URL
    # backend_port = get_backend_port(project_root)
    backend_port = 9030

    # api_base_url = os.environ.get("NEXT_PUBLIC_API_BASE") or f"http://localhost:{backend_port}"
    api_base_url = os.environ.get("NEXT_PUBLIC_API_BASE") or f"https://ral-wms-logistic.rangdong.com.vn:9004"


    # Create the embed HTML with proper script tag
    embed_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>DeepTutor Chat Bubble</title>
</head>
<body>
    <script>
        // Configuration
        window.DeepTutorConfig = {{
            apiUrl: "{api_base_url}/api/v1/workspace/nw/chat",
            logoUrl: "{api_base_url}/static/chat-bubble/IconRangDong.png",
            styleUrl: "{api_base_url}/static/chat-bubble/style.css"
        }};
    </script>
    <script src="{api_base_url}/static/chat-bubble/chat-bubble.js"></script>
</body>
</html>"""

    return HTMLResponse(content=embed_html)