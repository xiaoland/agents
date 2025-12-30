"""Manager module - Module-specific business logic (domain orchestrators)."""
# app/managers/posts.py
from typing import Any
from pydantic import UUID4

from app.engine import database
from app.models import post as post_model
from app.schemas import posts as posts_schemas

async def get_by_id(post_id: UUID4) -> dict[str, Any] | None:
    """Get post by ID."""
    query = post_model.Post.__table__.select().where(post_model.Post.id == post_id)
    return await database.fetch_one(query)

async def create_post(post_data: posts_schemas.PostCreate) -> dict[str, Any]:
    """Create new post."""
    query = post_model.Post.__table__.insert().values(**post_data.dict())
    post_id = await database.execute(query)
    return await get_by_id(post_id)

async def update_post(
    post_id: UUID4,
    post_data: posts_schemas.PostUpdate
) -> dict[str, Any]:
    """Update post."""
    values = post_data.dict(exclude_unset=True)
    query = (
        post_model.Post.__table__
        .update()
        .where(post_model.Post.id == post_id)
        .values(**values)
    )
    await database.execute(query)
    return await get_by_id(post_id)

async def delete_post(post_id: UUID4) -> None:
    """Delete post."""
    query = post_model.Post.__table__.delete().where(post_model.Post.id == post_id)
    await database.execute(query)
