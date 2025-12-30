"""Integration test for complete post lifecycle workflow."""
# tests/integration/test_post_workflow.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_complete_post_workflow(client: AsyncClient, db_session):
    """Test complete post lifecycle: create, update, publish, delete."""
    # 1. Register user
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "SecurePass123!"
    }
    register_response = await client.post("/auth/register", json=user_data)
    assert register_response.status_code == 201

    # 2. Login
    login_response = await client.post(
        "/auth/token",
        data={"username": user_data["username"], "password": user_data["password"]}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create post
    post_data = {
        "title": "My First Post",
        "content": "This is my first post content",
        "published": False
    }
    create_response = await client.post("/posts/", json=post_data, headers=headers)
    assert create_response.status_code == 201
    post_id = create_response.json()["id"]

    # 4. Update post
    update_data = {"title": "My Updated Post"}
    update_response = await client.put(
        f"/posts/{post_id}",
        json=update_data,
        headers=headers
    )
    assert update_response.status_code == 200
    assert update_response.json()["title"] == update_data["title"]

    # 5. Publish post
    publish_response = await client.put(
        f"/posts/{post_id}",
        json={"published": True},
        headers=headers
    )
    assert publish_response.status_code == 200
    assert publish_response.json()["published"] is True

    # 6. Get post
    get_response = await client.get(f"/posts/{post_id}")
    assert get_response.status_code == 200

    # 7. Delete post
    delete_response = await client.delete(f"/posts/{post_id}", headers=headers)
    assert delete_response.status_code == 204

    # 8. Verify deletion
    get_deleted_response = await client.get(f"/posts/{post_id}")
    assert get_deleted_response.status_code == 404
