from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Loan, Item, LoanStatus, UserRole
from app.loans.schemas import LoanCreate, LoanResponse
from app.auth.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/loans", tags=["loans"])


@router.post("/", response_model=LoanResponse, status_code=201)
def create_loan(
    body: LoanCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),  # any logged-in user can borrow
):
    """
    Borrow an item. Checks that:
    - The item exists
    - The item is loanable or rentable (not purchasable)
    - At least 1 is available
    """
    item = db.query(Item).filter(Item.id == body.item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.item_type.value == "purchasable":
        raise HTTPException(status_code=400, detail="Purchasable items cannot be loaned")

    if item.available < 1:
        raise HTTPException(status_code=400, detail="No units available for this item")

    # Reduce available count
    item.available -= 1

    loan = Loan(
        user_id=current_user.id,
        item_id=body.item_id,
        due_date=body.due_date,
        status=LoanStatus.active,
    )

    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


@router.get("/", response_model=list[LoanResponse])
def get_loans(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get loans. Managers and admins see all loans.
    Students and staff only see their own.
    """
    if current_user.role in (UserRole.manager, UserRole.admin):
        return db.query(Loan).all()

    return db.query(Loan).filter(Loan.user_id == current_user.id).all()


@router.get("/{loan_id}", response_model=LoanResponse)
def get_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get a single loan. Students can only view their own loans.
    Managers and admins can view any loan.
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if current_user.role not in (UserRole.manager, UserRole.admin):
        if loan.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only view your own loans")

    return loan


@router.patch("/{loan_id}/return", response_model=LoanResponse)
def return_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Mark a loan as returned. The borrower or a manager/admin can do this.
    Increases the item's available count back by 1.
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    # Students can only return their own loans
    if current_user.role not in (UserRole.manager, UserRole.admin):
        if loan.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only return your own loans")

    if loan.status == LoanStatus.returned:
        raise HTTPException(status_code=400, detail="This loan has already been returned")

    # Mark as returned and restore availability
    loan.status = LoanStatus.returned
    loan.returned_at = datetime.utcnow()
    loan.item.available += 1

    db.commit()
    db.refresh(loan)
    return loan
