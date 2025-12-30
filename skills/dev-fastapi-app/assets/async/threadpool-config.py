"""Configuring custom thread pool for async operations."""
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Create custom executor with more threads
executor = ThreadPoolExecutor(max_workers=100)

@app.on_event("startup")
async def startup():
    loop = asyncio.get_event_loop()
    loop.set_default_executor(executor)

@app.on_event("shutdown")
async def shutdown():
    executor.shutdown(wait=True)
