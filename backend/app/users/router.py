from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole
from app.users.schemas import UserResponse, UserRoleUpdate, UserActiveUpdate, BalanceUpdate, TopUpRequest
from app.auth.dependencies import require_roles, get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.admin)),
):
    """Return all users. Admins only."""
    return db.query(User).all()


@router.patch("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    body: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.admin)),
):
    """Change a user's role. Admins only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = body.role
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/active", response_model=UserResponse)
def update_user_active(
    user_id: int,
    body: UserActiveUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.admin)),
):
    """Activate or deactivate a user. Admins only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = body.is_active
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/balance", response_model=UserResponse)
def set_user_balance(
    user_id: int,
    body: BalanceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.admin)),
):
    """Set a user's balance directly. Admins only."""
    if body.balance < 0:
        raise HTTPException(status_code=400, detail="Balance cannot be negative")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.balance = body.balance
    db.commit()
    db.refresh(user)
    return user


@router.post("/me/topup", response_model=UserResponse)
def topup_balance(
    body: TopUpRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Add funds to the current user's balance. Simulated — no real payment."""
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    if body.amount > 500:
        raise HTTPException(status_code=400, detail="Cannot add more than $500 at once")
    current_user.balance += body.amount
    db.commit()
    db.refresh(current_user)
    return current_user
