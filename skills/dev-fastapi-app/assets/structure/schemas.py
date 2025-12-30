"""Schemas module - Pydantic models for request/response validation."""
# app/schemas/posts.py
from datetime import datetime
from pydantic import UUID4, BaseModel, Field

class PostBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    published: bool = False

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    content: str | None = Field(None, min_length=1)
    published: bool | None = None

class PostResponse(PostBase):
    id: UUID4
    creator_id: UUID4
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
