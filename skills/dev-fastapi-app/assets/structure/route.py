"""Router module - core of each module containing all endpoints."""
# app/routes/posts.py
from fastapi import APIRouter, Depends, status
from app.schemas import posts as posts_schemas
from app.managers import posts_manager
from app.dependencies.posts import valid_post_id, valid_owned_post

router = APIRouter(prefix="/posts", tags=["posts"])

@router.get("/{post_id}", response_model=posts_schemas.PostResponse)
async def get_post(post: dict = Depends(valid_post_id)):
    """Get post by ID."""
    return post

@router.post("/", response_model=posts_schemas.PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(post_data: posts_schemas.PostCreate):
    """Create new post."""
    return await posts_manager.create_post(post_data)

@router.put("/{post_id}", response_model=posts_schemas.PostResponse)
async def update_post(
    post_data: posts_schemas.PostUpdate,
    post: dict = Depends(valid_owned_post)
):
    """Update existing post."""
    return await posts_manager.update_post(post["id"], post_data)

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post: dict = Depends(valid_owned_post)):
    """Delete post."""
    await posts_manager.delete_post(post["id"])
