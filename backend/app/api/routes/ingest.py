from __future__ import annotations

from fastapi import APIRouter, HTTPException, Header, Request, UploadFile
from starlette.datastructures import UploadFile as StarletteUploadFile
from pydantic import ValidationError

from ...schemas.ingest import TelemetryIn, VehicleEventIn
from ...services.kiosk_service import update_telemetry, get_kiosk
from ...services.session_service import start_session, end_session
from ...services.event_service import emit
from ...services.dedup_service import seen_event
from ...services.media_service import save_upload
from ...core.config import settings

router = APIRouter(prefix="/kiosks", tags=["ingest"])


def _check_device_key(x_device_key: str | None):
    if settings.device_key and x_device_key != settings.device_key:
        raise HTTPException(401, "Invalid device key")


def _to_float(v) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except Exception:
        return None


def _to_bool(v) -> bool | None:
    if v is None or v == "":
        return None
    if isinstance(v, bool):
        return v
    s = str(v).strip().lower()
    if s in ("1", "true", "t", "yes", "y", "on"):
        return True
    if s in ("0", "false", "f", "no", "n", "off"):
        return False
    return None


async def _parse_payload(request: Request, model_cls):
    """Parse request body as JSON OR form-data (multipart/x-www-form-urlencoded)."""
    ct = (request.headers.get("content-type") or "").lower()
    if "application/json" in ct:
        try:
            data = await request.json()
        except Exception:
            data = {}
        try:
            return model_cls.model_validate(data), {}
        except ValidationError as e:
            raise HTTPException(422, e.errors())
    # form / multipart
    form = await request.form()
    files = {}
    data = {}
    for k, v in form.multi_items():
        if isinstance(v, StarletteUploadFile):
            files[k] = v
        else:
            data[k] = v
    # Model-specific coercion happens at callers.
    try:
        return model_cls.model_validate(data), files
    except ValidationError as e:
        raise HTTPException(422, e.errors())


@router.post("/{kiosk_id}/telemetry")
async def post_telemetry(
    kiosk_id: str,
    request: Request,
    x_device_key: str | None = Header(default=None, alias="X-DEVICE-KEY"),
):
    """Accepts either JSON (legacy) or form-data for kiosk telemetry (NO images).

    JSON fields: { temperatureC, humidityPct, smoke, ts }
    Form-data fields: temperatureC, humidityPct, smoke, ts

    Any image fields (cameraSnapshotUrl/cameraSnapshot) are ignored on purpose.
    Images should be sent only via vehicle ENTRY/EXIT events.
    """
    _check_device_key(x_device_key)

    payload, _files = await _parse_payload(request, TelemetryIn)

    # If form-data, coerce primitives (pydantic validated strings otherwise)
    ct = (request.headers.get("content-type") or "").lower()
    if "application/json" not in ct:
        payload = TelemetryIn.model_validate(
            {
                "ts": getattr(payload, "ts", None) or None,
                "temperatureC": _to_float(getattr(payload, "temperatureC", None)),
                "humidityPct": _to_float(getattr(payload, "humidityPct", None)),
                "smoke": _to_bool(getattr(payload, "smoke", None)),
            }
        )

    k = update_telemetry(kiosk_id, payload.temperatureC, payload.humidityPct, payload.smoke)
    if not k:
        raise HTTPException(404, "Kiosk not found")

    emit(
        "TELEMETRY",
        {"kiosk": k, "telemetry": payload.model_dump()},
        kiosk_id=kiosk_id,
    )
    return {"ok": True, "kiosk": k}



@router.post("/{kiosk_id}/vehicle-events")
async def post_vehicle_event(
    kiosk_id: str,
    request: Request,
    x_device_key: str | None = Header(default=None, alias="X-DEVICE-KEY"),
):
    """Accepts either JSON (legacy) or multipart/form-data.

    JSON: VehicleEventIn (cameraSnapshotUrl/plateSnapshotUrl are URLs or refs)
    Form-data fields: type (ENTRY/EXIT), plate, vehicleType, ts, eventId, confidence
    File fields: cameraSnapshot, plateSnapshot
    """
    _check_device_key(x_device_key)

    payload, files = await _parse_payload(request, VehicleEventIn)
    # If form-data, coerce primitives (pydantic may otherwise keep strings)
    ct = (request.headers.get("content-type") or "").lower()
    if "application/json" not in ct:
        payload = VehicleEventIn.model_validate(
            {
                "eventId": getattr(payload, "eventId", None) or None,
                "ts": getattr(payload, "ts", None) or None,
                "type": getattr(payload, "type", None),
                "plate": getattr(payload, "plate", None) or None,
                "vehicleType": getattr(payload, "vehicleType", None) or None,
                # URLs are legacy-only; multipart upload is recommended
                "cameraSnapshotUrl": None,
                "plateSnapshotUrl": None,
                "confidence": _to_float(getattr(payload, "confidence", None)),
            }
        )

    if payload.eventId and seen_event(payload.eventId, kiosk_id, payload.ts):
        emit("DUPLICATE_EVENT", {"raw": payload.model_dump()}, kiosk_id=kiosk_id)
        return {"ok": True, "duplicate": True}

    # Save uploaded images (if present)
    camera_ref = payload.cameraSnapshotUrl
    plate_ref = payload.plateSnapshotUrl

    cam_file = (
        files.get("cameraSnapshot")
        or files.get("cameraSnapshotFile")
        or files.get("camera")
        or files.get("cameraImage")
    )
    plate_file = (
        files.get("plateSnapshot")
        or files.get("plateSnapshotFile")
        or files.get("plate")
        or files.get("plateImage")
    )

    if isinstance(cam_file, StarletteUploadFile):
        kind = "entry_camera" if payload.type == "ENTRY" else "exit_camera"
        camera_ref = save_upload(cam_file, kiosk_id=kiosk_id, kind=kind)

    if isinstance(plate_file, StarletteUploadFile):
        kind = "entry_plate" if payload.type == "ENTRY" else "exit_plate"
        plate_ref = save_upload(plate_file, kiosk_id=kiosk_id, kind=kind)

    payload_for_emit = payload.model_copy(
        update={"cameraSnapshotUrl": camera_ref, "plateSnapshotUrl": plate_ref}
    )

    if payload.type == "ENTRY":
        session, err = start_session(
            kiosk_id=kiosk_id,
            plate=payload.plate or "",
            vehicle_type=payload.vehicleType or "CAR",
            ts=payload.ts,
            camera_url=camera_ref,
            plate_url=plate_ref,
        )
        if err:
            raise HTTPException(409, err)
        k = get_kiosk(kiosk_id)
        emit(
            "VEHICLE_ENTRY",
            {"kiosk": k, "session": session, "raw": payload_for_emit.model_dump()},
            kiosk_id=kiosk_id,
            session_id=session["id"],
        )
        return {"ok": True, "session": session, "kiosk": k}

    session, err = end_session(
        kiosk_id=kiosk_id,
        ts=payload.ts,
        camera_url=camera_ref,
        plate_url=plate_ref,
    )
    if err:
        raise HTTPException(404, err)
    k = get_kiosk(kiosk_id)
    emit(
        "VEHICLE_EXIT",
        {"kiosk": k, "session": session, "raw": payload_for_emit.model_dump()},
        kiosk_id=kiosk_id,
        session_id=session["id"],
    )
    return {"ok": True, "session": session, "kiosk": k}
