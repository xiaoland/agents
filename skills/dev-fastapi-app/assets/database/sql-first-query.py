"""SQL-first approach with complex queries and JSON aggregation."""
# app/managers/posts_manager.py
from typing import Any
from pydantic import UUID4
from sqlalchemy import desc, func, select, text
from sqlalchemy.sql.functions import coalesce

from app.engine import database, posts, profiles, post_review

async def get_posts_with_creators(
    creator_id: UUID4,
    *,
    limit: int = 10,
    offset: int = 0
) -> list[dict[str, Any]]:
    """
    Get posts with creator info aggregated as JSON.
    SQL does the heavy lifting - faster than Python.
    """
    select_query = (
        select(
            posts.c.id,
            posts.c.slug,
            posts.c.title,
            posts.c.content,
            posts.c.published_at,
            # Aggregate creator data as JSON object
            func.json_build_object(
                text("'id', profiles.id"),
                text("'first_name', profiles.first_name"),
                text("'last_name', profiles.last_name"),
                text("'username', profiles.username"),
                text("'avatar', profiles.avatar"),
            ).label("creator"),
            # Count reviews
            func.count(post_review.c.id).label("review_count"),
            # Average rating
            func.avg(post_review.c.rating).label("avg_rating"),
        )
        .select_from(
            posts
            .join(profiles, posts.c.owner_id == profiles.c.id)
            .outerjoin(post_review, post_review.c.post_id == posts.c.id)
        )
        .where(posts.c.owner_id == creator_id)
        .group_by(
            posts.c.id,
            posts.c.slug,
            posts.c.title,
            posts.c.content,
            posts.c.published_at,
            profiles.c.id,
            profiles.c.first_name,
            profiles.c.last_name,
            profiles.c.username,
            profiles.c.avatar,
        )
        .order_by(
            desc(coalesce(posts.c.updated_at, posts.c.published_at, posts.c.created_at))
        )
        .limit(limit)
        .offset(offset)
    )

    return await database.fetch_all(select_query)
