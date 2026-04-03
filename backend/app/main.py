from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import models  # noqa: F401 — registers models with SQLAlchemy
from app.auth.router import router as auth_router
from app.items.router import router as items_router
from app.loans.router import router as loans_router

app = FastAPI(title="Inventory Manager API")

# Allow the React frontend to make requests to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(items_router)
app.include_router(loans_router)


@app.on_event("startup")
def on_startup():
    # Creates tables for any models imported before this runs.
    # Alembic will take over this job in Step 2.
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "Peter's Procurement API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
