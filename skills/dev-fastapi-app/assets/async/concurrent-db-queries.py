"""Concurrent database queries with asyncio.gather."""
import asyncio

async def get_user_dashboard(user_id: int):
    # If queries are independent
    user_task = database.fetch_one(
        "SELECT * FROM users WHERE id = :user_id",
        {"user_id": user_id}
    )

    posts_task = database.fetch_all(
        "SELECT * FROM posts WHERE user_id = :user_id",
        {"user_id": user_id}
    )

    comments_task = database.fetch_all(
        "SELECT * FROM comments WHERE user_id = :user_id",
        {"user_id": user_id}
    )

    user, posts, comments = await asyncio.gather(
        user_task,
        posts_task,
        comments_task
    )

    return {
        "user": user,
        "posts": posts,
        "comments": comments
    }
