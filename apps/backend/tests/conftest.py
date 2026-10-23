from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from email.message import EmailMessage
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.core.clock import get_clock
from app.core.config import Settings, get_settings
from app.db import get_db
from app.main import app
from app.services.email_sender import get_email_sender

BACKEND_DIR = Path(__file__).resolve().parents[1]
FRONTEND_BASE_URL = "https://bis.test"


class TestSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    test_database_url: str


class FakeClock:
    def __init__(self) -> None:
        self.current = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)

    def now(self) -> datetime:
        return self.current

    def advance(self, delta: timedelta) -> None:
        self.current += delta


class Outbox:
    def __init__(self) -> None:
        self.messages: list[EmailMessage] = []

    def send(self, message: EmailMessage) -> None:
        self.messages.append(message)


def _ensure_database(url: str) -> None:
    parsed = make_url(url)
    admin_engine = create_engine(parsed.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as connection:
        exists = connection.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": parsed.database}
        )
        if not exists:
            connection.execute(text(f'CREATE DATABASE "{parsed.database}"'))
    admin_engine.dispose()


@pytest.fixture(scope="session")
def database_url() -> str:
    return TestSettings().test_database_url


@pytest.fixture(scope="session")
def engine(database_url: str) -> Iterator[Engine]:
    _ensure_database(database_url)
    config = Config(BACKEND_DIR / "alembic.ini")
    config.attributes["database_url"] = database_url
    config.attributes["configure_logger"] = False
    command.upgrade(config, "head")
    test_engine = create_engine(database_url)
    yield test_engine
    test_engine.dispose()


@pytest.fixture
def db_session(engine: Engine) -> Iterator[Session]:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(
        bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
    )
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()


@pytest.fixture
def outbox() -> Outbox:
    return Outbox()


@pytest.fixture
def settings(database_url: str) -> Settings:
    return Settings(
        database_url=database_url,
        frontend_base_url=FRONTEND_BASE_URL,
        smtp_host="localhost",
        smtp_from="Bis <noreply@bis.test>",
    )


@pytest.fixture
def client(
    db_session: Session, clock: FakeClock, outbox: Outbox, settings: Settings
) -> Iterator[TestClient]:
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_clock] = lambda: clock
    app.dependency_overrides[get_email_sender] = lambda: outbox
    app.dependency_overrides[get_settings] = lambda: settings
    with TestClient(app, base_url="https://testserver") as test_client:
        yield test_client
    app.dependency_overrides.clear()
