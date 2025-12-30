"""Class-based pagination dependency with validation."""
from pydantic import BaseModel, Field, validator
from fastapi import Depends

class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")

    @validator("page_size")
    def validate_page_size(cls, v):
        if v > 100:
            raise ValueError("page_size cannot exceed 100")
        return v

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size

@app.get("/items/")
async def read_items(
    pagination: PaginationParams = Depends()
):
    items = await get_items(
        skip=pagination.skip,
        limit=pagination.limit
    )
    return {
        "items": items,
        "page": pagination.page,
        "page_size": pagination.page_size
    }
