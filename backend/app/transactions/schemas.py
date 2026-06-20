from pydantic import BaseModel
from datetime import datetime
from app.models import TransactionType


class TransactionCreate(BaseModel):
    item_id: int
    quantity: int = 1


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    item_id: int
    transaction_type: TransactionType
    quantity: int
    total_price: float | None
    created_at: datetime

    class Config:
        from_attributes = True
