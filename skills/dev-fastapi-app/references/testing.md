# FastAPI Testing Best Practices

## Code Assets

- [conftest.py](../assets/testing/conftest.py) - Test configuration and fixtures
- [crud-routes.py](../assets/testing/crud-routes.py) - CRUD route tests
- [factories.py](../assets/testing/factories.py) - Test data factories
- [integration-workflow.py](../assets/testing/integration-workflow.py) - Integration workflow test

## Testing with Async Client

### Test Configuration

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from run import app
from app.engine import Base, get_db
from app.settings import settings

# Test database URL
TEST_DATABASE_URL = "postgresql://test:test@localhost/test_db"

# Test engine and session
test_engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session")
def setup_test_database():
    """Create test database tables."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
async def db_session(setup_test_database):
    """Provide a database session for tests."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()

def override_get_db():
    """Override database dependency for tests."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
async def client() -> AsyncClient:
    """Provide an async HTTP client for tests."""
    async with AsyncClient(
        transport=ASGITransport(app=app, client=("127.0.0.1", "9000")),
        base_url="http://test"
    ) as client:
        yield client
```

### Writing Tests

```python
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
```

### Test Factories

```python
# tests/factories.py
import factory
from factory.alchemy import SQLAlchemyModelFactory
from datetime import datetime
import uuid

from app.models.user import User
from app.models.post import Post
from tests.conftest import TestSessionLocal

class BaseFactory(SQLAlchemyModelFactory):
    """Base factory with test database session."""
    class Meta:
        sqlalchemy_session = TestSessionLocal()
        sqlalchemy_session_persistence = "commit"

class UserFactory(BaseFactory):
    """Factory for creating test users."""
    class Meta:
        model = User

    id = factory.LazyFunction(uuid.uuid4)
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    username = factory.Sequence(lambda n: f"user{n}")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    is_active = True
    is_creator = False
    created_at = factory.LazyFunction(datetime.utcnow)

class PostFactory(BaseFactory):
    """Factory for creating test posts."""
    class Meta:
        model = Post

    id = factory.LazyFunction(uuid.uuid4)
    title = factory.Faker("sentence")
    content = factory.Faker("text")
    published = False
    creator_id = factory.SubFactory(UserFactory)
    created_at = factory.LazyFunction(datetime.utcnow)
```

### Integration Test Example

```python
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
```

## Best Practices Summary

### Testing

1. **Use async test client** from day 0
2. **Set up test database** separate from development
3. **Use factories** for test data creation
4. **Override dependencies** for testing
5. **Write integration tests** for complete workflows
6. **Use transactions** in tests for isolation
