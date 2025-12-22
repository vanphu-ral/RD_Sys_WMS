
import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=9030,
        reload=True,
        log_level="info",
        ssl_certfile="C:/Users/Administrator/Desktop/Backup/Cert/192.168.68.77.pem",
        ssl_keyfile="C:/Users/Administrator/Desktop/Backup/Cert/192.168.68.77-key.pem"
        # reload=True,
    )





