"""Exceptions module - Module-specific exceptions."""
# app/exceptions/posts.py
from fastapi import HTTPException, status

class PostNotFound(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

class UserNotOwner(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not own this post"
        )

class InvalidPostStatus(HTTPException):
    def __init__(self, status: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid post status: {status}"
        )
