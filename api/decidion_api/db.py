import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def normalize_database_url(url: str) -> str:
    """Use the psycopg 3 driver for libpq-style Postgres URLs.

    Render's ``connectionString`` is ``postgresql://`` (some hosts still emit
    ``postgres://``). SQLAlchemy treats a bare ``postgresql://`` URL as psycopg2,
    which this service does not install. ``postgresql+psycopg://`` is left as-is.
    """
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


def database_url() -> str:
    raw = os.environ.get("DATABASE_URL", "sqlite:///./decidion.db")
    return normalize_database_url(raw)


def make_engine(url: str | None = None):
    url = url or database_url()
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    return create_engine(url, connect_args=connect_args, pool_pre_ping=True, future=True)


engine = make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True)


def init_db() -> None:
    from decidion_api import models  # noqa: F401

    Base.metadata.create_all(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
