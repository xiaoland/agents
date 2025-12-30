"""Resource ownership validation dependency chain."""
from typing import Any
from pydantic import UUID4
from fastapi import Depends, HTTPException, status

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


# Usage in router
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
