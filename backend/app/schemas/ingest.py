from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from .common import VehicleType


class TelemetryIn(BaseModel):
    """Kiosk telemetry (sensor/health only).

    NOTE: We intentionally do NOT accept/store camera snapshots in telemetry.
    Devices should send images only in vehicle ENTRY/EXIT events.
    """

    model_config = ConfigDict(extra="ignore")

    ts: Optional[str] = None
    temperatureC: Optional[float] = None
    humidityPct: Optional[float] = None
    smoke: Optional[bool] = None


class VehicleEventIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    eventId: Optional[str] = None
    ts: Optional[str] = None
    type: Literal["ENTRY", "EXIT"]
    plate: Optional[str] = None
    vehicleType: Optional[VehicleType] = None

    # These are refs/URLs in legacy JSON mode, or saved media refs when uploaded via multipart.
    cameraSnapshotUrl: Optional[str] = None
    plateSnapshotUrl: Optional[str] = None

    confidence: Optional[float] = Field(default=None, ge=0, le=1)
