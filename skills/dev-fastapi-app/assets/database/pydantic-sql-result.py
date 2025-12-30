"""Pydantic models for SQL query results with nested JSON."""
# app/schemas/posts.py
from datetime import datetime
from pydantic import BaseModel, UUID4

class Creator(BaseModel):
    """Nested creator info from SQL json_build_object."""
    id: UUID4
    first_name: str
    last_name: str
    username: str
    avatar: str | None = None

class PostWithCreator(BaseModel):
    """Post with aggregated creator data."""
    id: UUID4
    slug: str
    title: str
    content: str
    published_at: datetime
    creator: Creator
    review_count: int
    avg_rating: float | None = None

    class Config:
        from_attributes = True


# Usage in routes
# app/routes/posts.py
from fastapi import APIRouter
from app.schemas import posts as posts_schemas
from app.managers import posts_manager

router = APIRouter()

@router.get("/creators/{creator_id}/posts", response_model=list[posts_schemas.PostWithCreator])
async def get_creator_posts(creator_id: UUID4, limit: int = 10, offset: int = 0):
    """
    Get posts with nested creator data.
    All aggregation done in SQL - efficient and clean.
    """
    posts = await posts_manager.get_posts_with_creators(
        creator_id,
        limit=limit,
        offset=offset
    )
    return posts
