import os
import tempfile

_fd, _path = tempfile.mkstemp(prefix="decidion-test-", suffix=".db")
os.close(_fd)
os.environ["DATABASE_URL"] = "sqlite:///" + _path
os.environ["DECIDION_LIVE_DEMO"] = "0"
os.environ["DECIDION_API_KEY"] = "test-key"
os.environ["DECIDION_SEED"] = "1"

import pytest


@pytest.fixture
def session():
    from decidion_api import models  # noqa: F401
    from decidion_api.db import Base, SessionLocal, engine
    from decidion_api.seed import install_defaults

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        install_defaults(db)
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    from decidion_api import models  # noqa: F401
    from decidion_api.db import Base, engine
    from decidion_api.main import app
    from fastapi.testclient import TestClient

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with TestClient(app) as test_client:
        yield test_client


AUTH = {"Authorization": "Bearer test-key"}
