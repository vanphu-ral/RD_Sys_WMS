
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str = "Warehouse Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # DATABASE_URL: str = "mssql+aioodbc://sa:Admin!112358@localhost:1433/SYS_WMS_DB?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
    # DATABASE_URL_2: str = "mssql+aioodbc://ral_wms:Ral%402804%40@192.168.21.61:1433/BANHANG_Thang6?driver=ODBC+Driver+17+for+SQL+Server"
    DATABASE_URL_2: str = "mssql+aioodbc:///?odbc_connect=DRIVER%3D%7BODBC+Driver+18+for+SQL+Server%7D%3BSERVER%3D192.168.21.61%2C1433%3BDATABASE%3DBANGHANG_Thang6%3BUID%3Dral_wms%3BPWD%3DRal%402804%40%3BEncrypt%3Dno%3BTrustServerCertificate%3Dyes"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:admin123@localhost:5432/WMS_DB"

    SECRET_KEY: str = "secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Keycloak Configuration
    # KEYCLOAK_URL: str = "http://localhost:9000/auth"
    KEYCLOAK_URL: str = "https://ssosys.rangdong.com.vn:9002"
    KEYCLOAK_REALM: str = "rangdong"
    KEYCLOAK_CLIENT_ID: str = "RD_KHO"
    KEYCLOAK_CLIENT_SECRET: str = "BXq009ttkCAYqQpczs4YqtaUFod4WlmI"
    KEYCLOAK_REDIRECT_URI: str = "https://ssosys.rangdong.com.vn:9002"

# Tên miền :ssosys.rangdong.com.vn:9002
# realm: rangdong
# clientID : RD_KHO

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:4200", "http://192.168.20.101:4200","http://localhost:9004", "http://192.168.20.101:9004","https://ral.wms-logistic.rangdong.com.vn:9004" ]

    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True

#
# Global settings instance
settings = Settings()