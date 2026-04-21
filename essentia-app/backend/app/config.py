from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ─── App ─────────────────────────────────────
    app_env: str = "development"

    # ─── Database ────────────────────────────────
    database_url: str = "postgresql://postgres:postgres@db:5432/essentia"

    # ─── CORS ────────────────────────────────────
    cors_origins: str = "http://localhost:3000"

    # ─── Essentia モデル ──────────────────────────
    models_dir: str = "/app/models"
    essentia_model_pb: str = "discogs-effnet-bs64-1.pb"
    essentia_model_json: str = "discogs-effnet-bs64-1.json"
    essentia_model_name: str = "discogs-effnet"
    essentia_model_version: str = "bs64-1"
    max_audio_seconds: int = 20

    # ─── Spotify ─────────────────────────────────
    spotify_client_id: str = ""
    spotify_client_secret: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
