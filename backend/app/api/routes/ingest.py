from __future__ import annotations
from fastapi import APIRouter, HTTPException, Header
from ...schemas.ingest import TelemetryIn, VehicleEventIn
from ...services.kiosk_service import update_telemetry, get_kiosk
from ...services.session_service import start_session, end_session
from ...services.event_service import emit
from ...services.dedup_service import seen_event
from ...core.config import settings

router = APIRouter(prefix="/kiosks", tags=["ingest"])

def _check_device_key(x_device_key: str | None):
    if settings.device_key and x_device_key != settings.device_key:
        raise HTTPException(401, "Invalid device key")

@router.post("/{kiosk_id}/telemetry")
def post_telemetry(kiosk_id: str, payload: TelemetryIn, x_device_key: str | None = Header(default=None, alias="X-DEVICE-KEY")):
    _check_device_key(x_device_key)
    k = update_telemetry(kiosk_id, payload.temperatureC, payload.humidityPct, payload.smoke, payload.cameraSnapshotUrl)
    if not k:
        raise HTTPException(404, "Kiosk not found")
    emit("TELEMETRY", {"kiosk": k, "telemetry": payload.model_dump()}, kiosk_id=kiosk_id)
    return {"ok": True, "kiosk": k}

@router.post("/{kiosk_id}/vehicle-events")
def post_vehicle_event(kiosk_id: str, payload: VehicleEventIn, x_device_key: str | None = Header(default=None, alias="X-DEVICE-KEY")):
    _check_device_key(x_device_key)
    if payload.eventId and seen_event(payload.eventId, kiosk_id, payload.ts):
        emit("DUPLICATE_EVENT", {"raw": payload.model_dump()}, kiosk_id=kiosk_id)
        return {"ok": True, "duplicate": True}

    if payload.type == "ENTRY":
        session, err = start_session(
            kiosk_id=kiosk_id,
            plate=payload.plate or "",
            vehicle_type=payload.vehicleType or "CAR",
            ts=payload.ts,
            camera_url=payload.cameraSnapshotUrl,
            plate_url=payload.plateSnapshotUrl,
        )
        if err:
            raise HTTPException(409, err)
        k = get_kiosk(kiosk_id)
        emit("VEHICLE_ENTRY", {"kiosk": k, "session": session, "raw": payload.model_dump()}, kiosk_id=kiosk_id, session_id=session["id"])
        return {"ok": True, "session": session, "kiosk": k}

    session, err = end_session(
        kiosk_id=kiosk_id,
        ts=payload.ts,
        camera_url=payload.cameraSnapshotUrl,
        plate_url=payload.plateSnapshotUrl,
    )
    if err:
        raise HTTPException(404, err)
    k = get_kiosk(kiosk_id)
    emit("VEHICLE_EXIT", {"kiosk": k, "session": session, "raw": payload.model_dump()}, kiosk_id=kiosk_id, session_id=session["id"])
    return {"ok": True, "session": session, "kiosk": k}
