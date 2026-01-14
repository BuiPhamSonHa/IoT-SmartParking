from __future__ import annotations
from pydantic import BaseModel
import os

class Settings(BaseModel):
    app_name: str = "SmartPark API"
    api_prefix: str = "/api/v1"
    db_path: str = os.getenv("SMARTPARK_DB", "parking.db")
    device_key: str | None = os.getenv("SMARTPARK_DEVICE_KEY")  # optional auth for ESP32 (X-DEVICE-KEY)
    timezone: str = os.getenv("SMARTPARK_TZ", "Asia/Bangkok")
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

settings = Settings()
