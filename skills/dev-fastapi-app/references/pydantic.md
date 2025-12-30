# Pydantic Best Practices

## Code Assets

- [custom-base-model.py](../assets/pydantic/custom-base-model.py) - Custom base model with standardized serialization
- [settings-decoupled.py](../assets/pydantic/settings-decoupled.py) - Decoupled settings across modules

## Excessive Use of Pydantic Features

Leverage Pydantic's comprehensive validation toolkit:

```python
from enum import Enum
from pydantic import AnyUrl, BaseModel, EmailStr, Field

class MusicBand(str, Enum):
    AEROSMITH = "AEROSMITH"
    QUEEN = "QUEEN"
    ACDC = "AC/DC"

class UserBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=128)
    username: str = Field(min_length=1, max_length=128, pattern="^[A-Za-z0-9-_]+$")
    email: EmailStr
    age: int = Field(ge=18, default=None)
    favorite_band: MusicBand | None = None
    website: AnyUrl | None = None
```

## Custom Base Model

Create a global base model for standardization:

```python
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, ConfigDict

def datetime_to_gmt_str(dt: datetime) -> str:
    if not dt.tzinfo:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))
    return dt.strftime("%Y-%m-%dT%H:%M:%S%z")

class CustomModel(BaseModel):
    model_config = ConfigDict(
        json_encoders={datetime: datetime_to_gmt_str},
        populate_by_name=True,
    )

    def serializable_dict(self, **kwargs):
        """Return a dict with only serializable fields."""
        default_dict = self.model_dump()
        return jsonable_encoder(default_dict)
```

## Decouple BaseSettings

Split BaseSettings across modules instead of one global settings file:

```python
# app/settings/auth.py
from datetime import timedelta
from pydantic_settings import BaseSettings

class AuthConfig(BaseSettings):
    JWT_ALG: str
    JWT_SECRET: str
    JWT_EXP: int = 5  # minutes
    REFRESH_TOKEN_KEY: str
    REFRESH_TOKEN_EXP: timedelta = timedelta(days=30)
    SECURE_COOKIES: bool = True

auth_settings = AuthConfig()
```

```python
# app/settings.py
from pydantic import PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings
from app.constants import Environment

class Config(BaseSettings):
    DATABASE_URL: PostgresDsn
    REDIS_URL: RedisDsn
    SITE_DOMAIN: str = "myapp.com"
    ENVIRONMENT: Environment = Environment.PRODUCTION
    SENTRY_DSN: str | None = None
    CORS_ORIGINS: list[str]
    CORS_ORIGINS_REGEX: str | None = None
    CORS_HEADERS: list[str]
    APP_VERSION: str = "1.0"

settings = Config()
```

## FastAPI Response Serialization

- Don't return Pydantic objects directly - they get created twice
- FastAPI converts to dict → validates with response_model → serializes to JSON
- Return plain dicts for efficiency

```python
from pydantic import BaseModel, model_validator

class ProfileResponse(BaseModel):
    @model_validator(mode="after")
    def debug_usage(self):
        print("created pydantic model")
        return self

@app.get("/", response_model=ProfileResponse)
async def root():
    return ProfileResponse()  # Creates model TWICE!
```

## ValueError as ValidationError

`ValueError` raised in Pydantic schema returns detailed response to client:

```python
# app/schemas/profiles.py
from pydantic import BaseModel, field_validator

class ProfileCreate(BaseModel):
    username: str
    
    @field_validator("password", mode="after")
    @classmethod
    def valid_password(cls, password: str) -> str:
        if not re.match(STRONG_PASSWORD_PATTERN, password):
            raise ValueError(
                "Password must contain at least "
                "one lower character, "
                "one upper character, "
                "digit or special symbol"
            )
        return password
```
