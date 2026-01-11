from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
from redis import asyncio as aioredis
from app.core.config import settings

async def init_cache():
    redis = aioredis.from_url(
        f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}",
        # password=settings.REDIS_PASSWORD,
        db=settings.REDIS_DB
    )
    FastAPICache.init(RedisBackend(redis), prefix="wms-cache")

async def close_cache():
    await FastAPICache.clear()