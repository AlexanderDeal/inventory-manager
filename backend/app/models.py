import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


# --- Enums (fixed sets of allowed values) ---

class UserRole(str, enum.Enum):
    student = "student"
    staff = "staff"
    manager = "manager"
    admin = "admin"


class ItemType(str, enum.Enum):
    rentable = "rentable"       # electronics
    loanable = "loanable"       # equipment
    purchasable = "purchasable" # food


class LoanStatus(str, enum.Enum):
    active = "active"
    returned = "returned"
    overdue = "overdue"


class TransactionType(str, enum.Enum):
    purchase = "purchase"
    rental = "rental"
    loan = "loan"


# --- Tables ---

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships — lets you do user.loans to get all loans for a user
    loans = relationship("Loan", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    item_type = Column(Enum(ItemType), nullable=False)
    quantity = Column(Integer, default=0)          # total stock
    available = Column(Integer, default=0)         # currently available
    department = Column(String, nullable=True)
    price = Column(Float, nullable=True)           # only used for purchasable items
    created_at = Column(DateTime, default=datetime.utcnow)

    loans = relationship("Loan", back_populates="item")
    transactions = relationship("Transaction", back_populates="item")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    status = Column(Enum(LoanStatus), default=LoanStatus.active, nullable=False)
    loaned_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    returned_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="loans")
    item = relationship("Item", back_populates="loans")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Integer, default=1)
    total_price = Column(Float, nullable=True)     # only for purchases
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    item = relationship("Item", back_populates="transactions")
