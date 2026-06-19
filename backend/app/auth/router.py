from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole
from app.auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.auth.security import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/auth", tags=["auth"])

RESTRICTED_ROLES = {UserRole.staff, UserRole.manager, UserRole.admin}


@router.post("/register", response_model=UserResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    Create a new user account.
    Manager and admin roles can only be assigned by an existing admin
    via POST /auth/admin/register.
    """
    if body.role in RESTRICTED_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Cannot self-register as manager or admin"
        )

    # Check if email or username is already taken
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        department=body.department,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/admin/register", response_model=UserResponse, status_code=201)
def admin_register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.admin)),
):
    """Create any role account. Admins only."""
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
        department=body.department,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserResponse)
def me(current_user=Depends(get_current_user)):
    """Return the currently logged-in user's info."""
    return current_user


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Log in and receive a JWT token."""

    user = db.query(User).filter(User.email == body.email).first()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token)
