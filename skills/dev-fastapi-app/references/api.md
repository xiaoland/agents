# API Best Practices

## REST Principles

RESTful design enables dependency reuse:

```python
# app/dependencies/profiles.py
async def valid_profile_id(profile_id: UUID4) -> Mapping:
    profile = await profiles_manager.get_by_id(profile_id)
    if not profile:
        raise ProfileNotFound()
    return profile

# app/dependencies/creators.py
async def valid_creator_id(profile: Mapping = Depends(valid_profile_id)) -> Mapping:
    if not profile["is_creator"]:
        raise ProfileNotCreator()
    return profile

# app/routes/profiles.py
@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
async def get_user_profile_by_id(profile: Mapping = Depends(valid_profile_id)):
    return profile

# app/routes/creators.py
@router.get("/creators/{profile_id}", response_model=ProfileResponse)
async def get_creator_profile(creator_profile: Mapping = Depends(valid_creator_id)):
    return creator_profile
```

**Key Point:** Use consistent variable names in paths (e.g., `profile_id` not `creator_id`) to enable dependency chaining.

## API Documentation

**1. Hide docs by default (non-public APIs):**

```python
from fastapi import FastAPI
from starlette.config import Config

config = Config(".env")
ENVIRONMENT = config("ENVIRONMENT")
SHOW_DOCS_ENVIRONMENT = ("local", "staging")

app_configs = {"title": "My Cool API"}
if ENVIRONMENT not in SHOW_DOCS_ENVIRONMENT:
    app_configs["openapi_url"] = None

app = FastAPI(**app_configs)
```

**2. Generate clear documentation:**

```python
from fastapi import APIRouter, status

router = APIRouter()

@router.post(
    "/endpoints",
    response_model=DefaultResponseModel,
    status_code=status.HTTP_201_CREATED,
    description="Description of the well documented endpoint",
    tags=["Endpoint Category"],
    summary="Summary of the Endpoint",
    responses={
        status.HTTP_200_OK: {
            "model": OkResponse,
            "description": "Ok Response",
        },
        status.HTTP_201_CREATED: {
            "model": CreatedResponse,
            "description": "Creates something from user request",
        },
        status.HTTP_202_ACCEPTED: {
            "model": AcceptedResponse,
            "description": "Accepts request and handles it later",
        },
    },
)
async def documented_route():
    pass
```
