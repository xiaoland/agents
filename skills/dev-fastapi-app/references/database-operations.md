# FastAPI Database Best Practices

## Code Assets

- [engine-setup.py](../assets/database/engine-setup.py) - Database engine with naming conventions
- [lifespan.py](../assets/database/lifespan.py) - Application lifespan with database
- [models-naming.py](../assets/database/models-naming.py) - Model naming conventions
- [sql-first-query.py](../assets/database/sql-first-query.py) - SQL-first complex queries
- [pydantic-sql-result.py](../assets/database/pydantic-sql-result.py) - Pydantic models for SQL results
- [migration-initial.py](../assets/database/migration-initial.py) - Initial Alembic migration
- [migration-data.py](../assets/database/migration-data.py) - Migration with data modification
- [transaction.py](../assets/database/transaction.py) - Database transaction pattern

## Database Setup

### Database Configuration with Naming Conventions

```python
# app/engine.py
from databases import Database
from sqlalchemy import MetaData, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.settings import settings

# Naming conventions for PostgreSQL
POSTGRES_INDEXES_NAMING_CONVENTION = {
    "ix": "%(column_0_label)s_idx",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ck": "%(table_name)s_%(constraint_name)s_check",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "pk": "%(table_name)s_pkey",
}

metadata = MetaData(naming_convention=POSTGRES_INDEXES_NAMING_CONVENTION)
Base = declarative_base(metadata=metadata)

# Async database connection (using databases library)
database = Database(str(settings.DATABASE_URL))

# SQLAlchemy engine (for migrations and sync operations)
engine = create_engine(
    str(settings.DATABASE_URL),
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

### Application Lifespan with Database

```python
# run.py
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.engine import database

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    # Startup
    await database.connect()
    yield
    # Shutdown
    await database.disconnect()

app = FastAPI(lifespan=lifespan)
```

## Database Naming Conventions

### Table and Column Naming Rules

```python
# All lowercase with underscores
# Singular form for table names
# Consistent prefixes for related tables

# ✅ GOOD Examples
class User(Base):
    __tablename__ = "user"

    id = Column(UUID(as_uuid=True), primary_key=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255))
    created_at = Column(DateTime(timezone=True))
    birth_date = Column(Date)

class Post(Base):
    __tablename__ = "post"

    id = Column(UUID(as_uuid=True), primary_key=True)
    title = Column(String(200))
    content = Column(Text)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("user.id"))
    published_at = Column(DateTime(timezone=True))

class PostLike(Base):
    __tablename__ = "post_like"

    id = Column(UUID(as_uuid=True), primary_key=True)
    post_id = Column(UUID(as_uuid=True), ForeignKey("post.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"))
    created_at = Column(DateTime(timezone=True))

# Payment module - grouped with prefix
class PaymentAccount(Base):
    __tablename__ = "payment_account"

class PaymentBill(Base):
    __tablename__ = "payment_bill"

class PaymentTransaction(Base):
    __tablename__ = "payment_transaction"
```

### Concrete vs Abstract Naming

```python
# Use profile_id everywhere as the default
class Post(Base):
    profile_id = Column(UUID, ForeignKey("profile.id"))

# But use specific naming when context matters
class Course(Base):
    creator_id = Column(UUID, ForeignKey("profile.id"))  # Specifically a creator

class Enrollment(Base):
    student_id = Column(UUID, ForeignKey("profile.id"))  # Specifically a student

# Use post_id for abstract relationships
class PostLike(Base):
    post_id = Column(UUID, ForeignKey("post.id"))

# Use specific IDs in domain modules
class Chapter(Base):
    course_id = Column(UUID, ForeignKey("course.id"))  # Not post_id
```

### DateTime and Date Suffixes

```python
class User(Base):
    # Use _at suffix for datetime fields
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))
    last_login_at = Column(DateTime(timezone=True))
    deleted_at = Column(DateTime(timezone=True))

    # Use _date suffix for date fields
    birth_date = Column(Date)
    registration_date = Column(Date)
```

## SQL-First Approach

### Complex Queries in Database Layer

```python
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
```

### Pydantic Models for SQL Results

```python
# app/schemas/posts.py
from datetime import datetime
from pydantic import BaseModel, UUID4

class Creator(BaseModel):
    """Nested creator info from SQL json_build_object."""
    id: UUID4
    first_name: str
    last_name: str
    username: str
    avatar: str | None = None

class PostWithCreator(BaseModel):
    """Post with aggregated creator data."""
    id: UUID4
    slug: str
    title: str
    content: str
    published_at: datetime
    creator: Creator
    review_count: int
    avg_rating: float | None = None

    class Config:
        from_attributes = True
```

### Using in Routes

```python
# app/routes/posts.py
from fastapi import APIRouter
from app.schemas import posts as posts_schemas
from app.managers import posts_manager

router = APIRouter()

@router.get("/creators/{creator_id}/posts", response_model=list[posts_schemas.PostWithCreator])
async def get_creator_posts(creator_id: UUID4, limit: int = 10, offset: int = 0):
    """
    Get posts with nested creator data.
    All aggregation done in SQL - efficient and clean.
    """
    posts = await posts_manager.get_posts_with_creators(
        creator_id,
        limit=limit,
        offset=offset
    )
    return posts
```

## Alembic Migrations

### Configuration

```ini
# alembic.ini
[alembic]
script_location = alembic
file_template = %%(year)d-%%(month).2d-%%(day).2d_%%(slug)s
```

### Migration File Structure

```text
alembic/
├── versions/
│   ├── 2024-01-15_initial_schema.py
│   ├── 2024-01-20_add_user_email_index.py
│   ├── 2024-02-01_create_posts_table.py
│   └── 2024-02-15_add_post_published_at.py
├── env.py
└── script.py.mako
```

### Creating Migrations

```bash
# Auto-generate migration from models
alembic revision --autogenerate -m "add user table"

# Manual migration
alembic revision -m "add custom index"
```

### Migration Best Practices

```python
# 2024-01-15_initial_schema.py
"""initial schema

Revision ID: abc123
Revises:
Create Date: 2024-01-15 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'abc123'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    """
    Upgrade schema.
    Keep migrations static and revertable.
    Don't depend on dynamic data for structure.
    """
    # Create table
    op.create_table(
        'user',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Create indexes
    op.create_index('user_email_idx', 'user', ['email'], unique=True)
    op.create_index('user_username_idx', 'user', ['username'], unique=True)

def downgrade():
    """
    Revert changes.
    Always ensure migrations are reversible.
    """
    op.drop_index('user_username_idx', table_name='user')
    op.drop_index('user_email_idx', table_name='user')
    op.drop_table('user')
```

### Migration with Data

```python
# 2024-02-10_add_user_roles.py
"""add user roles

Revision ID: def456
Revises: abc123
Create Date: 2024-02-10 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'def456'
down_revision = 'abc123'

def upgrade():
    # Add column
    op.add_column('user', sa.Column('role', sa.String(50), nullable=True))

    # Update existing data (dynamic data, static structure)
    op.execute("UPDATE \"user\" SET role = 'member' WHERE role IS NULL")

    # Make column non-nullable after setting defaults
    op.alter_column('user', 'role', nullable=False)

    # Add check constraint
    op.create_check_constraint(
        'user_role_check',
        'user',
        "role IN ('member', 'creator', 'admin')"
    )

def downgrade():
    op.drop_constraint('user_role_check', 'user')
    op.drop_column('user', 'role')
```

## Database Transaction Patterns

### Using Database Transactions

```python
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
```

## Best Practices Summary

### Database

1. **Set explicit naming conventions** for indexes and constraints
2. **Use lowercase_snake_case** for all database names
3. **Suffix `_at` for datetime** and `_date` for date fields
4. **Group related tables** with module prefixes
5. **Keep migrations static and revertable**
6. **Use descriptive migration filenames** with dates and slugs

### SQL-First

1. **Do complex joins in SQL** not Python
2. **Aggregate nested data in SQL** using JSON functions
3. **Use database functions** for calculations and transformations
4. **Let Pydantic validate** SQL results
