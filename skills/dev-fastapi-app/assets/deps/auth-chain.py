"""Authentication dependency chain pattern."""
from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

async def parse_jwt_data(
    token: str = Depends(oauth2_scheme)
) -> dict[str, Any]:
    """Parse and validate JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    return {"user_id": payload["id"]}

async def get_current_user(
    token_data: dict = Depends(parse_jwt_data)
) -> dict[str, Any]:
    """Get current user from token."""
    user = await users_service.get_by_id(token_data["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

async def get_active_user(
    user: dict = Depends(get_current_user)
) -> dict[str, Any]:
    """Ensure user is active."""
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return user
