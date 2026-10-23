from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    frontend_base_url: str

    session_ttl_days: int = 30

    password_reset_ttl_minutes: int = 60

    login_window_minutes: int = 15
    login_max_failures_per_email: int = 5
    login_max_failures_per_ip: int = 20

    smtp_host: str
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: SecretStr | None = None
    smtp_security: Literal["none", "starttls", "ssl"] = "starttls"
    smtp_from: str


@lru_cache
def get_settings() -> Settings:
    return Settings()
