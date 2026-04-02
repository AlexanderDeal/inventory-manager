from pydantic import BaseModel
from datetime import datetime
from app.models import LoanStatus


class LoanCreate(BaseModel):
    """Data required to borrow an item."""
    item_id: int
    due_date: datetime | None = None  # optional return deadline


class LoanResponse(BaseModel):
    """Loan data returned in responses."""
    id: int
    user_id: int
    item_id: int
    status: LoanStatus
    loaned_at: datetime
    due_date: datetime | None
    returned_at: datetime | None

    class Config:
        from_attributes = True
