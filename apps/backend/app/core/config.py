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
    invite_ttl_days: int = 7

    login_window_minutes: int = 15
    login_max_failures_per_email: int = 5
    login_max_failures_per_ip: int = 20

    smtp_host: str
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: SecretStr | None = None
    smtp_security: Literal["none", "starttls", "ssl"] = "starttls"
    smtp_from: str

    google_client_id: str | None = None
    google_client_secret: SecretStr | None = None
    google_redirect_uri: str | None = None
    google_state_ttl_minutes: int = 10

    llm_base_url: str | None = None
    llm_model: str | None = None
    llm_api_key: SecretStr | None = None
    llm_timeout_seconds: int = 120
    import_max_text_chars: int = 20000
    import_max_download_bytes: int = 2_000_000
    import_max_per_hour: int = 20

    photos_dir: str
    photo_max_bytes: int = 10 * 1024 * 1024
    unlinked_photo_ttl_hours: int = 24


@lru_cache
def get_settings() -> Settings:
    return Settings()
