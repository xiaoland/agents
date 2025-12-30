"""Performance testing for async vs sync routes."""
import asyncio
import time
from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()

@app.get("/sync-blocking")
def sync_blocking():
    time.sleep(1)
    return {"status": "done"}

@app.get("/async-blocking")
async def async_blocking():
    time.sleep(1)  # BAD!
    return {"status": "done"}

@app.get("/async-non-blocking")
async def async_non_blocking():
    await asyncio.sleep(1)  # GOOD!
    return {"status": "done"}

# Test concurrent requests
async def test_performance():
    import httpx

    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        start = time.time()

        # Make 10 concurrent requests
        tasks = [client.get("/async-non-blocking") for _ in range(10)]
        await asyncio.gather(*tasks)

        elapsed = time.time() - start
        print(f"10 requests took {elapsed:.2f}s")
        # Should be ~1s (concurrent)
        # vs ~10s if blocking
