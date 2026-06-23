"""Centralised settings (pydantic-settings). Single source of truth.
Reads ROOT/.env first; pod env vars override."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    mongo_url: str = "mongodb://localhost:27017"
    db_name: str = "arroba_com"

    # JWT / sessions
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    session_expiry_hours: int = 168

    # Emergent OAuth
    emergent_auth_url: str = "https://auth.emergentagent.com"
    emergent_auth_session_endpoint: str = "/api/auth/session"

    # Stripe (E0: only env presence checked)
    stripe_api_key: str = ""
    stripe_webhook_secret: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Runtime
    log_level: str = "INFO"
    env: str = "development"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def emergent_auth_full_url(self) -> str:
        return self.emergent_auth_url.rstrip("/") + self.emergent_auth_session_endpoint


@lru_cache
def get_settings() -> Settings:
    return Settings()
