"""Application lifespan with database connection management."""
# run.py
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.engine import database

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    # Startup
    await database.connect()
    yield
    # Shutdown
    await database.disconnect()

app = FastAPI(lifespan=lifespan)
