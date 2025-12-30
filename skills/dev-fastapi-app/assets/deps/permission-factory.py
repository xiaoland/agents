"""Permission checking with factory function dependency."""
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
