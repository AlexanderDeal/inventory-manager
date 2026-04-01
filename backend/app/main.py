from fastapi import FastAPI
from app.database import engine, Base
from app import models  # noqa: F401 — registers models with SQLAlchemy

app = FastAPI(title="Peter's Procurement API")


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
