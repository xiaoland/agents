# FastAPI Dependencies Reference

## Code Assets

- [auth-chain.py](../assets/deps/auth-chain.py) - Authentication dependency chain pattern
- [resource-ownership.py](../assets/deps/resource-ownership.py) - Resource ownership validation
- [class-pagination.py](../assets/deps/class-pagination.py) - Class-based pagination dependency
- [permission-factory.py](../assets/deps/permission-factory.py) - Permission checking factory
- [yield-cleanup.py](../assets/deps/yield-cleanup.py) - Dependency with yield for cleanup

## Dependency Injection Patterns

### Basic Dependency

```python
from fastapi import Depends, FastAPI

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/users/")
async def read_users(db = Depends(get_db)):
    users = db.query(User).all()
    return users
```

## Advanced Validation Dependencies

### Validate Resource Exists

```python
# dependencies.py
from typing import Any
from pydantic import UUID4
from fastapi import HTTPException, status

from app.managers import posts_manager

async def valid_post_id(post_id: UUID4) -> dict[str, Any]:
    """Validate that post exists."""
    post = await posts_manager.get_by_id(post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    return post
```

```python
# router.py
from fastapi import APIRouter, Depends

router = APIRouter()

@router.get("/posts/{post_id}")
async def get_post(post: dict = Depends(valid_post_id)):
    """Get post by ID - validation handled by dependency."""
    return post

@router.put("/posts/{post_id}")
async def update_post(
    update_data: PostUpdate,
    post: dict = Depends(valid_post_id)
):
    """Update post - validation reused."""
    return await service.update(post["id"], update_data)

@router.get("/posts/{post_id}/reviews")
async def get_reviews(post: dict = Depends(valid_post_id)):
    """Get post reviews - validation reused."""
    return await reviews_service.get_by_post_id(post["id"])
```

## Chaining Dependencies

### Simple Chain

```python
# dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

async def parse_jwt_data(
    token: str = Depends(oauth2_scheme)
) -> dict[str, Any]:
    """Parse and validate JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    return {"user_id": payload["id"]}

async def get_current_user(
    token_data: dict = Depends(parse_jwt_data)
) -> dict[str, Any]:
    """Get current user from token."""
    user = await users_service.get_by_id(token_data["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

async def get_active_user(
    user: dict = Depends(get_current_user)
) -> dict[str, Any]:
    """Ensure user is active."""
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return user
```

```python
# router.py
@router.get("/profile")
async def get_profile(user: dict = Depends(get_active_user)):
    """Get current user profile - requires active user."""
    return user
```

### Complex Chain with Multiple Resources

```python
# dependencies.py
async def valid_post_id(post_id: UUID4) -> dict[str, Any]:
    """Validate post exists."""
    post = await posts_service.get_by_id(post_id)
    if not post:
        raise PostNotFound()
    return post

async def valid_owned_post(
    post: dict = Depends(valid_post_id),
    token_data: dict = Depends(parse_jwt_data),
) -> dict[str, Any]:
    """Validate user owns the post."""
    if post["creator_id"] != token_data["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not own this post"
        )
    return post

async def valid_active_creator(
    token_data: dict = Depends(parse_jwt_data),
) -> dict[str, Any]:
    """Validate user is an active creator."""
    user = await users_service.get_by_id(token_data["user_id"])
    
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is banned"
        )
    
    if not user["is_creator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a creator"
        )
    
    return user
```

```python
# router.py
from fastapi import BackgroundTasks

@router.get("/users/{user_id}/posts/{post_id}")
async def get_user_post(
    worker: BackgroundTasks,
    post: dict = Depends(valid_owned_post),
    user: dict = Depends(valid_active_creator),
):
    """
    Get post belonging to active creator.
    
    Note: parse_jwt_data is called only ONCE even though it's
    used by both valid_owned_post and valid_active_creator.
    FastAPI caches dependency results within request scope.
    """
    worker.add_task(notifications_service.send_email, user["id"])
    return post
```

## Dependency Caching

### Understanding Caching Behavior

```python
call_count = 0

async def expensive_dependency():
    """This dependency is called only once per request."""
    global call_count
    call_count += 1
    print(f"Called {call_count} times")
    
    # Expensive operation
    await asyncio.sleep(1)
    data = await fetch_from_database()
    
    return data

async def depends_on_expensive(
    data: dict = Depends(expensive_dependency)
):
    """Uses cached result."""
    return data

@app.get("/endpoint1")
async def endpoint1(
    data1: dict = Depends(expensive_dependency),
    data2: dict = Depends(expensive_dependency),
    data3: dict = Depends(depends_on_expensive),
):
    """
    expensive_dependency is called only ONCE for this request.
    All three parameters receive the same cached result.
    """
    return {"data1": data1, "data2": data2, "data3": data3}
```

### Disabling Cache

```python
from fastapi import Depends

async def no_cache_dependency():
    """This will be called every time."""
    return await fetch_fresh_data()

@app.get("/endpoint")
async def endpoint(
    # Use use_cache=False to disable caching
    data1: dict = Depends(no_cache_dependency, use_cache=False),
    data2: dict = Depends(no_cache_dependency, use_cache=False),
):
    """Both calls will execute the dependency."""
    return {"data1": data1, "data2": data2}
```

## Async vs Sync Dependencies

### ❌ Sync Dependency (Less Efficient)

```python
def get_current_user_sync(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Sync dependency - runs in thread pool.
    Uses more resources than necessary.
    """
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return {"user_id": payload["id"]}
```

### ✅ Async Dependency (Preferred)

```python
async def get_current_user_async(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Async dependency - runs in event loop.
    More efficient for non-blocking operations.
    """
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return {"user_id": payload["id"]}
```

### When Sync is Necessary

```python
def get_db_session():
    """Sync dependency when using sync database library."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# FastAPI handles this correctly by running in thread pool
@app.get("/users/")
def get_users(db = Depends(get_db_session)):
    return db.query(User).all()
```

## Class-Based Dependencies

### Simple Class Dependency

```python
from typing import Optional
from fastapi import Query

class CommonQueryParams:
    def __init__(
        self,
        skip: int = Query(0, ge=0),
        limit: int = Query(10, ge=1, le=100),
        q: Optional[str] = None
    ):
        self.skip = skip
        self.limit = limit
        self.q = q

@app.get("/items/")
async def read_items(commons: CommonQueryParams = Depends()):
    """Depends() with no argument automatically uses the class."""
    items = await get_items(
        skip=commons.skip,
        limit=commons.limit,
        search=commons.q
    )
    return items
```

### Advanced Class Dependency with Validation

```python
from pydantic import BaseModel, Field, validator

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")
    
    @validator("page_size")
    def validate_page_size(cls, v):
        if v > 100:
            raise ValueError("page_size cannot exceed 100")
        return v
    
    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        return self.page_size

@app.get("/items/")
async def read_items(
    pagination: PaginationParams = Depends()
):
    items = await get_items(
        skip=pagination.skip,
        limit=pagination.limit
    )
    return {
        "items": items,
        "page": pagination.page,
        "page_size": pagination.page_size
    }
```

## Router-Level Dependencies

### Apply to All Routes in Router

```python
from fastapi import APIRouter, Depends

async def verify_token(token: str = Header(None)):
    """Verify API token."""
    if token != VALID_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid token")

# All routes in this router require valid token
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(verify_token)]
)

@router.get("/users")
async def get_users():
    """Requires valid token (from router dependency)."""
    return await users_service.get_all()

@router.delete("/users/{user_id}")
async def delete_user(user_id: UUID4):
    """Requires valid token (from router dependency)."""
    await users_service.delete(user_id)
```

### Multiple Router Dependencies

```python
async def verify_api_key(api_key: str = Header(None)):
    """Verify API key."""
    if not is_valid_api_key(api_key):
        raise HTTPException(status_code=403)

async def rate_limit(request: Request):
    """Apply rate limiting."""
    client_ip = request.client.host
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests")

router = APIRouter(
    prefix="/api",
    dependencies=[
        Depends(verify_api_key),
        Depends(rate_limit)
    ]
)
```

## Application-Level Dependencies

### Global Dependencies

```python
from fastapi import FastAPI, Depends, Request

async def log_request(request: Request):
    """Log all incoming requests."""
    logger.info(f"{request.method} {request.url}")

app = FastAPI(
    dependencies=[Depends(log_request)]
)

# All routes in the application will log requests
@app.get("/users")
async def get_users():
    return {"users": []}
```

## Dependency with Yield

### Database Session Management

```python
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
```

### Context Manager Pattern

```python
from contextlib import asynccontextmanager

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
```

## RESTful Dependency Patterns

### Consistent Path Parameters

```python
# ✅ GOOD: Consistent parameter naming enables dependency reuse

# app/dependencies/profiles.py
async def valid_profile_id(profile_id: UUID4) -> dict:
    """Validate profile exists."""
    profile = await profiles_manager.get_by_id(profile_id)
    if not profile:
        raise ProfileNotFound()
    return profile

# app/dependencies/creators.py
async def valid_creator_id(
    profile: dict = Depends(valid_profile_id)
) -> dict:
    """Validate profile is a creator."""
    if not profile["is_creator"]:
        raise ProfileNotCreator()
    return profile

# app/routes/profiles.py
@router.get("/profiles/{profile_id}")
async def get_profile(profile: dict = Depends(valid_profile_id)):
    return profile

# app/routes/creators.py
@router.get("/creators/{profile_id}")  # Same param name!
async def get_creator(creator: dict = Depends(valid_creator_id)):
    return creator
```

```python
# ❌ BAD: Inconsistent naming prevents dependency reuse

@router.get("/profiles/{profile_id}")
async def get_profile(profile: dict = Depends(valid_profile_id)):
    return profile

@router.get("/creators/{creator_id}")  # Different param name
async def get_creator(creator_id: UUID4):
    # Can't reuse valid_profile_id dependency
    # Have to duplicate validation logic
    profile = await profiles_manager.get_by_id(creator_id)
    if not profile or not profile["is_creator"]:
        raise CreatorNotFound()
    return profile
```

## Background Task Dependencies

```python
from fastapi import BackgroundTasks, Depends

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from token."""
    return await decode_and_fetch_user(token)

def send_notification(user_id: str, message: str):
    """Send notification (runs in background)."""
    notification_service.send(user_id, message)

@app.post("/posts/")
async def create_post(
    post_data: PostCreate,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """Create post and send notification in background."""
    post = await posts_service.create(post_data, user["id"])
    
    # Add background task
    background_tasks.add_task(
        send_notification,
        user["id"],
        f"Post '{post['title']}' created successfully"
    )
    
    return post
```

## Security Dependencies

### Permission Checking

```python
from enum import Enum
from fastapi import Depends, HTTPException

class Permission(str, Enum):
    READ_POSTS = "read:posts"
    WRITE_POSTS = "write:posts"
    DELETE_POSTS = "delete:posts"

def require_permission(required_permission: Permission):
    """Factory function to create permission checking dependency."""
    async def check_permission(
        user: dict = Depends(get_current_user)
    ):
        if required_permission not in user.get("permissions", []):
            raise HTTPException(
                status_code=403,
                detail=f"Missing required permission: {required_permission}"
            )
        return user
    
    return check_permission

@router.get("/posts")
async def read_posts(
    user: dict = Depends(require_permission(Permission.READ_POSTS))
):
    """Requires read:posts permission."""
    return await posts_service.get_all()

@router.post("/posts")
async def create_post(
    post_data: PostCreate,
    user: dict = Depends(require_permission(Permission.WRITE_POSTS))
):
    """Requires write:posts permission."""
    return await posts_service.create(post_data)

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: UUID4,
    user: dict = Depends(require_permission(Permission.DELETE_POSTS))
):
    """Requires delete:posts permission."""
    await posts_service.delete(post_id)
```

## Testing Dependencies

### Override Dependencies in Tests

```python
# app.py
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/users")
def get_users(db = Depends(get_db)):
    return db.query(User).all()
```

```python
# test_app.py
from fastapi.testclient import TestClient

def override_get_db():
    """Test database dependency."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_get_users():
    response = client.get("/users")
    assert response.status_code == 200
```

## Best Practices

1. **Use async dependencies by default** - More efficient unless you need blocking operations
2. **Chain dependencies** - Compose small, reusable dependencies
3. **Leverage caching** - Dependencies are cached within request scope
4. **Keep consistent naming** - Use same path parameter names for dependency reuse
5. **Use yield for cleanup** - Ensure resources are properly released
6. **Apply at router level** - For common requirements across multiple routes
7. **Create factory functions** - For configurable dependencies (like permissions)
8. **Override in tests** - Use `app.dependency_overrides` for testing
