from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    APP_NAME: str = "MedVision AI"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    SQLALCHEMY_ECHO: bool = False
    CORS_ORIGINS: str = ""
    FRONTEND_URL: str | None = None
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str | None = None
    UPLOAD_DIR: str | None = None
    REPORTS_DIR: str | None = None

    @property
    def cors_origins(self) -> list[str]:
        configured = [origin.strip().rstrip("/") for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        if self.FRONTEND_URL and self.FRONTEND_URL.strip():
            configured.append(self.FRONTEND_URL.strip().rstrip("/"))

        if not configured:
            configured = ["http://localhost:5173", "http://127.0.0.1:5173"]

        return list(dict.fromkeys(configured))

    def _storage_path(self, configured: str | None, default_name: str) -> Path:
        path = Path(configured).expanduser() if configured else PROJECT_ROOT / default_name
        if not path.is_absolute():
            path = PROJECT_ROOT / path
        return path.resolve()

    @property
    def upload_path(self) -> Path:
        return self._storage_path(self.UPLOAD_DIR, "uploads")

    @property
    def reports_path(self) -> Path:
        return self._storage_path(self.REPORTS_DIR, "reports")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
