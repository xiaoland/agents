"""Database engine setup with naming conventions."""
# app/engine.py
from databases import Database
from sqlalchemy import MetaData, create_engine
from sqlalchemy.ext.declarative import declarative_base

from app.settings import settings

# Naming conventions for indexes
POSTGRES_INDEXES_NAMING_CONVENTION = {
    "ix": "%(column_0_label)s_idx",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ck": "%(table_name)s_%(constraint_name)s_check",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "pk": "%(table_name)s_pkey",
}

metadata = MetaData(naming_convention=POSTGRES_INDEXES_NAMING_CONVENTION)
Base = declarative_base(metadata=metadata)

# Async database connection
database = Database(str(settings.DATABASE_URL))

# SQLAlchemy engine (for migrations)
engine = create_engine(str(settings.DATABASE_URL))
