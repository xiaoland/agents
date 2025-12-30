"""CRUD route tests with async client."""
# tests/posts/test_router.py
import pytest
from httpx import AsyncClient

from tests.factories import UserFactory, PostFactory

@pytest.mark.asyncio
async def test_create_post(client: AsyncClient, db_session):
    """Test creating a post."""
    # Arrange
    user = UserFactory.create()
    db_session.add(user)
    db_session.commit()

    post_data = {
        "title": "Test Post",
        "content": "Test content",
        "published": False
    }

    # Act
    response = await client.post(
        "/posts/",
        json=post_data,
        headers={"Authorization": f"Bearer {user.token}"}
    )

    # Assert
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == post_data["title"]
    assert data["content"] == post_data["content"]

@pytest.mark.asyncio
async def test_get_post(client: AsyncClient, db_session):
    """Test getting a post by ID."""
    # Arrange
    post = PostFactory.create()
    db_session.add(post)
    db_session.commit()

    # Act
    response = await client.get(f"/posts/{post.id}")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(post.id)
    assert data["title"] == post.title

@pytest.mark.asyncio
async def test_update_post(client: AsyncClient, db_session):
    """Test updating a post."""
    # Arrange
    user = UserFactory.create()
    post = PostFactory.create(creator_id=user.id)
    db_session.add_all([user, post])
    db_session.commit()

    update_data = {"title": "Updated Title"}

    # Act
    response = await client.put(
        f"/posts/{post.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {user.token}"}
    )

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == update_data["title"]

@pytest.mark.asyncio
async def test_delete_post(client: AsyncClient, db_session):
    """Test deleting a post."""
    # Arrange
    user = UserFactory.create()
    post = PostFactory.create(creator_id=user.id)
    db_session.add_all([user, post])
    db_session.commit()

    # Act
    response = await client.delete(
        f"/posts/{post.id}",
        headers={"Authorization": f"Bearer {user.token}"}
    )

    # Assert
    assert response.status_code == 204

@pytest.mark.asyncio
async def test_unauthorized_delete(client: AsyncClient, db_session):
    """Test that users cannot delete others' posts."""
    # Arrange
    owner = UserFactory.create()
    other_user = UserFactory.create()
    post = PostFactory.create(creator_id=owner.id)
    db_session.add_all([owner, other_user, post])
    db_session.commit()

    # Act
    response = await client.delete(
        f"/posts/{post.id}",
        headers={"Authorization": f"Bearer {other_user.token}"}
    )

    # Assert
    assert response.status_code == 403
