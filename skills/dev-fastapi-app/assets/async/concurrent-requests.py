"""Concurrent async requests with asyncio.gather - fast pattern."""
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
