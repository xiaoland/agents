"""Dependency with yield for resource cleanup."""
from contextlib import asynccontextmanager

# Database session management
async def get_db():
    """
    Dependency with cleanup.
    Code after yield runs after the response is sent.
    """
    db = AsyncSession()
    try:
        yield db
    finally:
        await db.close()

@app.get("/users")
async def get_users(db: AsyncSession = Depends(get_db)):
    """Database session automatically closed after response."""
    users = await db.execute(select(User))
    return users.scalars().all()


# Context manager pattern for Redis
@asynccontextmanager
async def get_redis():
    """Async context manager for Redis connection."""
    redis = await aioredis.create_redis_pool(REDIS_URL)
    try:
        yield redis
    finally:
        redis.close()
        await redis.wait_closed()

async def get_redis_dependency():
    """Dependency using context manager."""
    async with get_redis() as redis:
        yield redis

@app.get("/cache/{key}")
async def get_cache(
    key: str,
    redis = Depends(get_redis_dependency)
):
    value = await redis.get(key)
    return {"value": value}
