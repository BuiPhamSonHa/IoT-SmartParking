from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, Literal
from .common import VehicleType

class TelemetryIn(BaseModel):
    ts: Optional[str] = None
    temperatureC: Optional[float] = None
    humidityPct: Optional[float] = None
    smoke: Optional[bool] = None
    cameraSnapshotUrl: Optional[str] = None

class VehicleEventIn(BaseModel):
    eventId: Optional[str] = None
    ts: Optional[str] = None
    type: Literal["ENTRY", "EXIT"]
    plate: Optional[str] = None
    vehicleType: Optional[VehicleType] = None
    cameraSnapshotUrl: Optional[str] = None
    plateSnapshotUrl: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
