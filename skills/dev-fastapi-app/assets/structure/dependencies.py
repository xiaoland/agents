"""Dependencies module - Router dependencies for validation and authorization."""
# app/dependencies/posts.py
from typing import Any
from pydantic import UUID4
from fastapi import Depends

from app.managers import posts_manager
from app.exceptions.posts import PostNotFound, UserNotOwner
from app.dependencies.auth import parse_jwt_data

async def valid_post_id(post_id: UUID4) -> dict[str, Any]:
    """Validate post exists."""
    post = await posts_manager.get_by_id(post_id)
    if not post:
        raise PostNotFound()
    return post

async def valid_owned_post(
    post: dict[str, Any] = Depends(valid_post_id),
    token_data: dict[str, Any] = Depends(parse_jwt_data),
) -> dict[str, Any]:
    """Validate user owns the post."""
    if post["creator_id"] != token_data["user_id"]:
        raise UserNotOwner()
    return post
