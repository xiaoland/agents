"""Database transaction pattern for atomic operations."""
# app/managers/posts_manager.py
from app.engine import database

async def create_post_with_tags(
    post_data: PostCreate,
    tags: list[str],
    creator_id: UUID4
) -> dict:
    """
    Create post with tags in a transaction.
    All or nothing - if tag creation fails, post creation rolls back.
    """
    async with database.transaction():
        # Create post
        post_query = posts.insert().values(
            **post_data.dict(),
            creator_id=creator_id
        )
        post_id = await database.execute(post_query)

        # Create tags
        for tag_name in tags:
            tag_query = tags_table.insert().values(
                post_id=post_id,
                name=tag_name
            )
            await database.execute(tag_query)

        # Return created post
        return await get_post_by_id(post_id)
