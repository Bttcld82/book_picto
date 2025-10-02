from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    APP_ENV: str = "dev"
    DB_URL: str = "sqlite:///./data.db"
    CORS_ORIGINS: str = "http://localhost:3000"
    MEDIA_DIR: str = "media"

settings = Settings()
os.makedirs(settings.MEDIA_DIR, exist_ok=True)