from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Item, Transaction, ItemType, TransactionType, UserRole
from app.transactions.schemas import TransactionCreate, TransactionResponse
from app.auth.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/all", response_model=list[TransactionResponse])
def get_all_transactions(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.admin)),
):
    """Return every transaction across all users. Admins only."""
    return db.query(Transaction).order_by(Transaction.created_at.desc()).all()


@router.get("/mine", response_model=list[TransactionResponse])
def get_my_transactions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return all purchases made by the current user."""
    return db.query(Transaction).filter(Transaction.user_id == current_user.id).all()


@router.post("/", response_model=TransactionResponse, status_code=201)
def purchase_item(
    body: TransactionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Purchase a purchasable item. Any logged-in user can buy."""
    item = db.query(Item).filter(Item.id == body.item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.item_type != ItemType.purchasable:
        raise HTTPException(status_code=400, detail="This item is not purchasable")

    if item.available < body.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock available")

    total = (item.price or 0) * body.quantity

    if current_user.balance < total:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. You have ${current_user.balance:.2f} but need ${total:.2f}",
        )

    current_user.balance -= total
    item.available -= body.quantity

    transaction = Transaction(
        user_id=current_user.id,
        item_id=body.item_id,
        transaction_type=TransactionType.purchase,
        quantity=body.quantity,
        total_price=total,
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction
