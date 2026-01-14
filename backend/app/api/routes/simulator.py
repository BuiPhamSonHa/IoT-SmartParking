from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import random
from ...schemas.common import VehicleType
from ...services.kiosk_service import update_telemetry, get_kiosk
from ...services.session_service import start_session, end_session
from ...services.event_service import emit

router = APIRouter(prefix="/simulator", tags=["simulator"])

plates = ["20A-29839","30A-12345","29B-88888","11A-99999","14C-77666"]
vtypes: list[VehicleType] = ["MOTORBIKE","CAR","TRUCK"]

class SimTelemetryIn(BaseModel):
    kioskId: str
    temperatureC: Optional[float] = None
    humidityPct: Optional[float] = None
    smoke: Optional[bool] = None

class SimEntryIn(BaseModel):
    kioskId: str
    plate: Optional[str] = None
    vehicleType: Optional[VehicleType] = None

class SimExitIn(BaseModel):
    kioskId: str

@router.post("/telemetry")
def sim_telemetry(payload: SimTelemetryIn):
    temp = payload.temperatureC if payload.temperatureC is not None else random.randint(20, 45)
    hum = payload.humidityPct if payload.humidityPct is not None else random.randint(25, 95)
    smoke = payload.smoke if payload.smoke is not None else (random.random() < 0.03)
    cam = f"/cameras/cam{random.randint(1,6)}.jpg"
    k = update_telemetry(payload.kioskId, temp, hum, smoke, cam)
    emit("SIM_TELEMETRY", {"kiosk": k}, kiosk_id=payload.kioskId)
    return {"ok": True, "kiosk": k}

@router.post("/vehicle-entry")
def sim_entry(payload: SimEntryIn):
    plate = payload.plate or random.choice(plates)
    vt: VehicleType = payload.vehicleType or random.choice(vtypes)
    cam = f"/cameras/cam{random.randint(1,6)}.jpg"
    plate_img = f"/cameras/cam{random.randint(1,6)}.jpg"
    s, err = start_session(payload.kioskId, plate, vt, None, cam, plate_img)
    if err:
        return {"ok": False, "error": err}
    k = get_kiosk(payload.kioskId)
    emit("SIM_ENTRY", {"kiosk": k, "session": s}, kiosk_id=payload.kioskId, session_id=s["id"])
    return {"ok": True, "kiosk": k, "session": s}

@router.post("/vehicle-exit")
def sim_exit(payload: SimExitIn):
    cam = f"/cameras/cam{random.randint(1,6)}.jpg"
    plate_img = f"/cameras/cam{random.randint(1,6)}.jpg"
    s, err = end_session(payload.kioskId, None, cam, plate_img)
    if err:
        return {"ok": False, "error": err}
    k = get_kiosk(payload.kioskId)
    emit("SIM_EXIT", {"kiosk": k, "session": s}, kiosk_id=payload.kioskId, session_id=s["id"])
    return {"ok": True, "kiosk": k, "session": s}
