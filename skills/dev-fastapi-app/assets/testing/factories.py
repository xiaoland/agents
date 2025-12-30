"""Test factories for creating test data."""
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
