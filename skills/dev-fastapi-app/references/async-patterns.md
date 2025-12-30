# FastAPI Async Patterns Reference

## Code Assets

- [cpu-intensive-process-pool.py](../assets/async/cpu-intensive-process-pool.py) - CPU-intensive tasks with ProcessPoolExecutor
- [concurrent-requests.py](../assets/async/concurrent-requests.py) - Concurrent HTTP requests with asyncio.gather
- [concurrent-db-queries.py](../assets/async/concurrent-db-queries.py) - Concurrent database queries
- [threadpool-config.py](../assets/async/threadpool-config.py) - Custom thread pool configuration
- [performance-test.py](../assets/async/performance-test.py) - Performance testing for async routes

## Understanding Async in FastAPI

FastAPI can handle both sync and async routes, but they behave differently:

- **Sync routes**: Run in threadpool, blocking I/O won't block event loop
- **Async routes**: Called via `await`, must only use non-blocking operations

## I/O Operations Patterns

### ❌ Anti-Pattern: Blocking I/O in Async Route

```python
import time
from fastapi import APIRouter

router = APIRouter()

@router.get("/terrible-ping")
async def terrible_ping():
    # WRONG: Blocks the entire event loop for 10 seconds
    # No other requests can be processed during this time
    time.sleep(10)
    return {"pong": True}
```

**What happens:**

1. FastAPI receives request
2. Event loop and ALL tasks wait for `time.sleep()`
3. Server cannot accept new requests
4. After 10s, response returned and server resumes

### ✅ Pattern: Blocking I/O in Sync Route

```python
import time
from fastapi import APIRouter

router = APIRouter()

@router.get("/good-ping")
def good_ping():
    # GOOD: Runs in separate thread, doesn't block event loop
    time.sleep(10)
    return {"pong": True}
```

**What happens:**

1. FastAPI receives request
2. Entire route sent to threadpool
3. Worker thread runs the function
4. Event loop continues processing other tasks
5. When thread finishes, response returned

### ✅ Best Pattern: Non-blocking Async I/O

```python
import asyncio
from fastapi import APIRouter

router = APIRouter()

@router.get("/perfect-ping")
async def perfect_ping():
    # BEST: Non-blocking I/O operation
    await asyncio.sleep(10)
    return {"pong": True}
```

**What happens:**

1. FastAPI receives request
2. Awaits `asyncio.sleep(10)`
3. Event loop processes other tasks while waiting
4. After 10s, route finishes and returns response

## Real-World Examples

### Database Operations

#### ❌ Wrong: Sync DB in Async Route

```python
import psycopg2
from fastapi import FastAPI

app = FastAPI()

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    # WRONG: Blocking database call in async route
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user
```

#### ✅ Correct: Async DB in Async Route

```python
from databases import Database
from fastapi import FastAPI

app = FastAPI()
database = Database(DATABASE_URL)

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    # CORRECT: Async database call
    query = "SELECT * FROM users WHERE id = :user_id"
    user = await database.fetch_one(query, {"user_id": user_id})
    return user
```

#### ✅ Alternative: Sync DB in Sync Route

```python
import psycopg2
from fastapi import FastAPI

app = FastAPI()

@app.get("/users/{user_id}")
def get_user(user_id: int):
    # CORRECT: Sync database call in sync route
    # FastAPI will run this in threadpool
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user
```

### HTTP Requests

#### ❌ Wrong: Sync HTTP in Async Route

```python
import requests
from fastapi import APIRouter

router = APIRouter()

@router.get("/external-api")
async def call_external_api():
    # WRONG: Blocking HTTP call
    response = requests.get("https://api.example.com/data")
    return response.json()
```

#### ✅ Correct: Async HTTP in Async Route

```python
import httpx
from fastapi import APIRouter

router = APIRouter()

@router.get("/external-api")
async def call_external_api():
    # CORRECT: Non-blocking HTTP call
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
    return response.json()
```

#### ✅ Alternative: Thread Pool for Sync SDK

```python
import requests
from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool

router = APIRouter()

@router.get("/external-api")
async def call_external_api():
    # CORRECT: Run blocking call in thread pool
    def make_request():
        response = requests.get("https://api.example.com/data")
        return response.json()
    
    data = await run_in_threadpool(make_request)
    return data
```

### File Operations

#### ❌ Wrong: Blocking File I/O in Async Route

```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/read-file")
async def read_file():
    # WRONG: Blocking file operation
    with open("large_file.txt", "r") as f:
        content = f.read()
    return {"content": content}
```

#### ✅ Correct: Async File I/O

```python
import aiofiles
from fastapi import APIRouter

router = APIRouter()

@router.get("/read-file")
async def read_file():
    # CORRECT: Non-blocking file operation
    async with aiofiles.open("large_file.txt", "r") as f:
        content = await f.read()
    return {"content": content}
```

#### ✅ Alternative: Sync Route for File I/O

```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/read-file")
def read_file():
    # CORRECT: Sync file operation in sync route
    with open("large_file.txt", "r") as f:
        content = f.read()
    return {"content": content}
```

## CPU-Intensive Tasks

### ❌ Wrong: CPU Task in Async Route

```python
from fastapi import APIRouter

router = APIRouter()

@router.post("/process-data")
async def process_data(data: list[int]):
    # WRONG: CPU-intensive task blocking event loop
    result = sum([x**2 for x in range(10_000_000)])
    return {"result": result}
```

### ❌ Still Wrong: CPU Task in Thread Pool

```python
from fastapi import APIRouter
from fastapi.concurrency import run_in_threadpool

router = APIRouter()

@router.post("/process-data")
async def process_data(data: list[int]):
    # STILL WRONG: GIL prevents true parallelism
    def heavy_computation():
        return sum([x**2 for x in range(10_000_000)])
    
    result = await run_in_threadpool(heavy_computation)
    return {"result": result}
```

### ✅ Correct: CPU Task in Separate Process

```python
from concurrent.futures import ProcessPoolExecutor
from fastapi import APIRouter

router = APIRouter()
process_pool = ProcessPoolExecutor(max_workers=4)

def heavy_computation(n: int) -> int:
    """CPU-intensive computation."""
    return sum([x**2 for x in range(n)])

@router.post("/process-data")
async def process_data(n: int):
    # CORRECT: Run in separate process to bypass GIL
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        process_pool,
        heavy_computation,
        n
    )
    return {"result": result}
```

### ✅ Better: Background Task Queue

```python
from fastapi import APIRouter, BackgroundTasks
from celery_app import process_heavy_task

router = APIRouter()

@router.post("/process-data")
async def process_data(data: dict, background_tasks: BackgroundTasks):
    # BEST: Offload to task queue (Celery, RQ, etc.)
    task = process_heavy_task.delay(data)
    return {
        "task_id": task.id,
        "status": "processing",
        "message": "Check /tasks/{task_id} for status"
    }
```

## Multiple Async Operations

### Sequential vs Concurrent

#### ❌ Sequential (Slow)

```python
from fastapi import APIRouter
import httpx

router = APIRouter()

@router.get("/user-data/{user_id}")
async def get_user_data(user_id: int):
    async with httpx.AsyncClient() as client:
        # Takes 3 seconds total (1s + 1s + 1s)
        profile = await client.get(f"https://api.example.com/profiles/{user_id}")
        posts = await client.get(f"https://api.example.com/posts?user_id={user_id}")
        comments = await client.get(f"https://api.example.com/comments?user_id={user_id}")
    
    return {
        "profile": profile.json(),
        "posts": posts.json(),
        "comments": comments.json()
    }
```

#### ✅ Concurrent (Fast)

```python
import asyncio
from fastapi import APIRouter
import httpx

router = APIRouter()

@router.get("/user-data/{user_id}")
async def get_user_data(user_id: int):
    async with httpx.AsyncClient() as client:
        # Takes 1 second total (all run concurrently)
        profile_task = client.get(f"https://api.example.com/profiles/{user_id}")
        posts_task = client.get(f"https://api.example.com/posts?user_id={user_id}")
        comments_task = client.get(f"https://api.example.com/comments?user_id={user_id}")
        
        profile, posts, comments = await asyncio.gather(
            profile_task,
            posts_task,
            comments_task
        )
    
    return {
        "profile": profile.json(),
        "posts": posts.json(),
        "comments": comments.json()
    }
```

## Database Query Patterns

### Single Query

```python
from databases import Database

async def get_user(user_id: int):
    query = "SELECT * FROM users WHERE id = :user_id"
    return await database.fetch_one(query, {"user_id": user_id})
```

### Multiple Sequential Queries

```python
async def get_user_with_posts(user_id: int):
    # If second query depends on first
    user = await database.fetch_one(
        "SELECT * FROM users WHERE id = :user_id",
        {"user_id": user_id}
    )
    
    posts = await database.fetch_all(
        "SELECT * FROM posts WHERE user_id = :user_id",
        {"user_id": user_id}
    )
    
    return {"user": user, "posts": posts}
```

### Multiple Concurrent Queries

```python
import asyncio

async def get_user_dashboard(user_id: int):
    # If queries are independent
    user_task = database.fetch_one(
        "SELECT * FROM users WHERE id = :user_id",
        {"user_id": user_id}
    )
    
    posts_task = database.fetch_all(
        "SELECT * FROM posts WHERE user_id = :user_id",
        {"user_id": user_id}
    )
    
    comments_task = database.fetch_all(
        "SELECT * FROM comments WHERE user_id = :user_id",
        {"user_id": user_id}
    )
    
    user, posts, comments = await asyncio.gather(
        user_task,
        posts_task,
        comments_task
    )
    
    return {
        "user": user,
        "posts": posts,
        "comments": comments
    }
```

## Thread Pool Considerations

### When to Use Thread Pool

- Blocking I/O operations (file, network) when async library unavailable
- Third-party sync SDKs
- Legacy code integration

### Thread Pool Limitations

```python
from fastapi import FastAPI
from fastapi.concurrency import run_in_threadpool

app = FastAPI()

# Default thread pool size is usually small (e.g., 40 threads)
# Be careful not to exhaust the pool

@app.get("/heavy-io")
async def heavy_io_operation():
    # Each call uses one thread from the pool
    # If pool exhausted, requests will queue
    result = await run_in_threadpool(blocking_operation)
    return result
```

### Configuring Thread Pool

```python
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
```

## Common Mistakes

### Mistake 1: Mixing Sync and Async Carelessly

```python
# ❌ WRONG
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    # Mix of async and sync operations
    user = await async_db_call(user_id)  # Async
    posts = sync_db_call(user_id)  # Blocks event loop!
    return {"user": user, "posts": posts}

# ✅ CORRECT
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await async_db_call(user_id)
    posts = await run_in_threadpool(sync_db_call, user_id)
    return {"user": user, "posts": posts}
```

### Mistake 2: Not Awaiting Coroutines

```python
# ❌ WRONG
@app.get("/data")
async def get_data():
    result = fetch_data()  # Returns coroutine, not data!
    return result

# ✅ CORRECT
@app.get("/data")
async def get_data():
    result = await fetch_data()
    return result
```

### Mistake 3: Creating Unnecessary Async Routes

```python
# ❌ UNNECESSARY
@app.get("/simple")
async def simple_endpoint():
    # No I/O operations, no await calls
    # Using async adds overhead for no benefit
    return {"message": "Hello"}

# ✅ BETTER
@app.get("/simple")
def simple_endpoint():
    return {"message": "Hello"}
```

## Performance Testing Example

```python
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
```

## Best Practices Summary

1. **Use async routes for I/O operations**: Database calls, HTTP requests, file I/O
2. **Use sync routes for CPU-bound work**: Heavy calculations (or better, offload to process/queue)
3. **Don't mix blocking code in async routes**: Use `run_in_threadpool` for sync SDK
4. **Prefer async libraries**: `httpx` over `requests`, `aiofiles` over built-in `open`, etc.
5. **Use `asyncio.gather()` for concurrent operations**: When tasks are independent
6. **Be mindful of thread pool size**: Don't exhaust the pool
7. **Don't make routes async unnecessarily**: If no I/O, sync is fine
