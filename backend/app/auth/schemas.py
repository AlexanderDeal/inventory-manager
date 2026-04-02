from pydantic import BaseModel, EmailStr
from app.models import UserRole


class RegisterRequest(BaseModel):
    """Data required to create a new account."""
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.student
    department: str | None = None


class LoginRequest(BaseModel):
    """Data required to log in."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """What the server sends back after a successful login."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Safe user data to return in responses (no password)."""
    id: int
    username: str
    email: str
    role: UserRole
    department: str | None

    class Config:
        from_attributes = True
