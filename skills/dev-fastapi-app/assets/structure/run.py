"""Main application file with middleware and router setup."""
# run.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.settings import settings
from app.engine import database
from app.routes.auth import router as auth_router
from app.routes.posts import router as posts_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    openapi_url=settings.OPENAPI_URL,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# Include routers
app.include_router(auth_router)
app.include_router(posts_router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
