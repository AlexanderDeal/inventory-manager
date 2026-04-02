from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Item, UserRole
from app.items.schemas import ItemCreate, ItemUpdate, ItemResponse
from app.auth.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=list[ItemResponse])
def get_items(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),  # any logged-in user can read
):
    """Return all inventory items."""
    return db.query(Item).all()


@router.get("/{item_id}", response_model=ItemResponse)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return a single item by ID."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/", response_model=ItemResponse, status_code=201)
def create_item(
    body: ItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.manager, UserRole.admin)),
):
    """Create a new item. Managers and admins only."""
    item = Item(
        name=body.name,
        description=body.description,
        item_type=body.item_type,
        quantity=body.quantity,
        available=body.quantity,  # starts fully available
        department=body.department,
        price=body.price,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int,
    body: ItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.manager, UserRole.admin)),
):
    """Update an item's fields. Managers and admins only."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Only update fields that were actually sent in the request
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.admin)),
):
    """Delete an item. Admins only."""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
