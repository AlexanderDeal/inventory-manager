from pydantic import BaseModel
from app.models import UserRole


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    department: str | None
    is_active: bool
    balance: float

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserActiveUpdate(BaseModel):
    is_active: bool


class BalanceUpdate(BaseModel):
    balance: float


class TopUpRequest(BaseModel):
    amount: float
