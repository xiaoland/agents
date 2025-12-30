"""Test configuration with async client and database fixtures."""
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
