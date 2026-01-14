from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from .common import VehicleType

class KioskOut(BaseModel):
    id: str
    name: str
    occupied: bool
    currentPlate: Optional[str] = None
    currentVehicleType: Optional[VehicleType] = None
    currentEntryAt: Optional[str] = None
    temperatureC: float = 0.0
    humidityPct: float = 0.0
    smokeWarning: bool = False
    cameraImageUrl: Optional[str] = None
    updatedAt: str
    envStatus: str

class KioskCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=40)

class KioskUpdateIn(BaseModel):
    name: str = Field(min_length=2, max_length=40)
