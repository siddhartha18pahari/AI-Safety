from decidion_api.db import database_url, normalize_database_url
from decidion_api.main import cors_settings


def test_render_postgres_urls_use_psycopg3():
    assert (
        normalize_database_url("postgresql://decidion:secret@dpg-abc/decidion")
        == "postgresql+psycopg://decidion:secret@dpg-abc/decidion"
    )
    assert (
        normalize_database_url("postgres://decidion:secret@dpg-abc:5432/decidion?sslmode=require")
        == "postgresql+psycopg://decidion:secret@dpg-abc:5432/decidion?sslmode=require"
    )
    compose = "postgresql+psycopg://decidion:decidion@db:5432/decidion"
    assert normalize_database_url(compose) == compose
    assert normalize_database_url("sqlite:///./decidion.db") == "sqlite:///./decidion.db"


def test_cors_settings_read_env(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", " https://decidion.vercel.app , https://console.example ")
    monkeypatch.setenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app")
    origins, regex = cors_settings()
    assert origins == ["https://decidion.vercel.app", "https://console.example"]
    assert regex == r"https://.*\.vercel\.app"

    monkeypatch.setenv("CORS_ORIGIN_REGEX", "  ")
    assert cors_settings()[1] is None


def test_default_cors_includes_vercel_and_localhost(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    monkeypatch.delenv("CORS_ORIGIN_REGEX", raising=False)
    origins, regex = cors_settings()
    assert "https://decidion.vercel.app" in origins
    assert "http://127.0.0.1:5173" in origins
    assert regex == r"https://.*\.vercel\.app"


def test_seed_applies_once(session):
    from decidion_api.models import Agent
    from decidion_api.seed import seed_if_empty
    from sqlalchemy import func, select

    assert seed_if_empty(session) is True
    assert session.scalar(select(func.count()).select_from(Agent)) == 7
    assert seed_if_empty(session) is False
    assert session.scalar(select(func.count()).select_from(Agent)) == 7


def test_vercel_browser_origins_pass_preflight(client):
    production = client.get("/health", headers={"Origin": "https://decidion.vercel.app"})
    assert production.headers["access-control-allow-origin"] == "https://decidion.vercel.app"

    preview = client.get(
        "/health",
        headers={"Origin": "https://decidion-git-deploy-team.vercel.app"},
    )
    assert preview.headers["access-control-allow-origin"] == "https://decidion-git-deploy-team.vercel.app"

    localhost = client.get("/health", headers={"Origin": "http://127.0.0.1:5173"})
    assert localhost.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"

    blocked = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in blocked.headers

    preflight = client.options(
        "/v1/agents",
        headers={
            "Origin": "https://decidion.vercel.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert preflight.status_code == 200
    assert preflight.headers["access-control-allow-origin"] == "https://decidion.vercel.app"
    assert "authorization" in preflight.headers["access-control-allow-headers"]


def test_database_url_from_env_is_normalized(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgres://user:pass@host/db")
    assert database_url() == "postgresql+psycopg://user:pass@host/db"
