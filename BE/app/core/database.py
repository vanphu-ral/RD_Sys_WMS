from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.ext.declarative import declarative_base

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

external_apps_engine = create_async_engine(
    settings.DATABASE_URL_2,
    echo=settings.DEBUG,
    future=True
)

ExternalAppsAsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=external_apps_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


Base = declarative_base()


# HÀM GET_DB BẤT ĐỒNG BỘ (Main WMS Database)
async def get_db():
    async with AsyncSessionLocal() as db:
        yield db


# HÀM GET_ASYNC_DB (Alias for get_db)
async def get_async_db():
    async with AsyncSessionLocal() as db:
        yield db


# HÀM GET_EXTERNAL_APPS_DB BẤT ĐỒNG BỘ (External Apps Database)
async def get_external_apps_db():
    async with ExternalAppsAsyncSessionLocal() as db:
        yield db


# HÀM TẠO BẢNG BẤT ĐỒNG BỘ
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)