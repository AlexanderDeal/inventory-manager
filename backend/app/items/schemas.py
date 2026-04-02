from pydantic import BaseModel
from app.models import ItemType


class ItemCreate(BaseModel):
    """Data required to create a new item."""
    name: str
    description: str | None = None
    item_type: ItemType
    quantity: int
    department: str | None = None
    price: float | None = None  # only needed for purchasable items


class ItemUpdate(BaseModel):
    """All fields optional — only send what you want to change."""
    name: str | None = None
    description: str | None = None
    quantity: int | None = None
    available: int | None = None
    department: str | None = None
    price: float | None = None


class ItemResponse(BaseModel):
    """Item data returned in responses."""
    id: int
    name: str
    description: str | None
    item_type: ItemType
    quantity: int
    available: int
    department: str | None
    price: float | None

    class Config:
        from_attributes = True
