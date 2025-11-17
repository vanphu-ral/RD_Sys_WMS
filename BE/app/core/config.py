
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str = "Warehouse Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlserver://sa:Admin!112358@localhost:1433/SYS_WMS_DB"
    DATABASE_URL_2: str = "mssql+aioodbc://ral_wms:Ral%402804%40@192.168.21.61:1433/BANHANG_Thang6?driver=ODBC+Driver+17+for+SQL+Server"

    SECRET_KEY: str = "secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Keycloak Configuration
    KEYCLOAK_URL: str = "http://localhost:9080/auth"
    KEYCLOAK_REALM: str = "wms-client"
    KEYCLOAK_CLIENT_ID: str = "wms-backend"
    KEYCLOAK_CLIENT_SECRET: str = "BXq009ttkCAYqQpczs4YqtaUFod4WlmI"
    KEYCLOAK_REDIRECT_URI: str = "http://localhost:8000/api/auth/keycloak/callback"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:4200", "http://localhost:3000", "http://localhost:8000"]

    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()