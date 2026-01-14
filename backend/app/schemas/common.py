from __future__ import annotations
from pydantic import BaseModel
from typing import Literal, Optional, Any, Dict

VehicleType = Literal["MOTORBIKE", "CAR", "TRUCK"]

class KpiOut(BaseModel):
    activeVehicles: int
    revenueTodayVnd: int
    sensorWarnings: int

class EventOut(BaseModel):
    id: int
    ts: str
    kind: str
    kioskId: Optional[str] = None
    sessionId: Optional[int] = None
    payload: Dict[str, Any]
