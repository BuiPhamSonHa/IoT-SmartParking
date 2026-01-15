from __future__ import annotations
from typing import Optional, Any
from ..db.database import db
from ..schemas.common import VehicleType
from .utils import parse_iso_or_now, now_utc_iso, start_of_day_utc
from .media_service import file_ref_to_data_url
from .pricing_service import calc_fee_vnd
from ..core.config import settings

def _clean_plate(p: str) -> str:
    return p.strip().upper().replace(" ", "")

def _row_to_session(r) -> dict:
    return {
        "id": int(r["id"]),
        "kioskId": r["kiosk_id"],
        "plate": r["plate"],
        "vehicleType": r["vehicle_type"],
        "entryAt": r["entry_at"],
        "exitAt": r["exit_at"],
        "durationMinutes": r["duration_minutes"],
        "feeVnd": r["fee_vnd"],
        "cameraImageUrl": r["entry_camera_url"] if r["exit_at"] is None else (r["exit_camera_url"] or r["entry_camera_url"]),
        "cameraImageDataUrl": file_ref_to_data_url(r["entry_camera_url"] if r["exit_at"] is None else (r["exit_camera_url"] or r["entry_camera_url"])),
        "entryPlateImageUrl": r["entry_plate_url"],
        "entryPlateImageDataUrl": file_ref_to_data_url(r["entry_plate_url"]),
        "exitPlateImageUrl": r["exit_plate_url"],
        "exitPlateImageDataUrl": file_ref_to_data_url(r["exit_plate_url"]),
    }

def start_session(kiosk_id: str, plate: str, vehicle_type: VehicleType, ts: str | None, camera_url: str | None, plate_url: str | None):
    plate = _clean_plate(plate or "")
    if not plate:
        return None, "Missing plate"
    entry_dt = parse_iso_or_now(ts)
    entry_iso = entry_dt.isoformat()
    now = now_utc_iso()
    with db() as conn:
        kiosk = conn.execute("SELECT * FROM kiosks WHERE id=? AND is_active=1", (kiosk_id,)).fetchone()
        if not kiosk:
            return None, "Kiosk not found"
        if int(kiosk["occupied"]) == 1:
            return None, "Kiosk already occupied"
        conn.execute(
            """INSERT INTO vehicle_sessions (kiosk_id, plate, vehicle_type, entry_at, entry_camera_url, entry_plate_url, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (kiosk_id, plate, vehicle_type, entry_iso, camera_url, plate_url, now, now),
        )
        session_id = int(conn.execute("SELECT last_insert_rowid()").fetchone()[0])
        conn.execute(
            """UPDATE kiosks
                 SET occupied=1, current_session_id=?, current_plate=?, current_vehicle_type=?, current_entry_at=?, updated_at=?
                 WHERE id=?""",
            (session_id, plate, vehicle_type, entry_iso, now, kiosk_id),
        )
        s = conn.execute("SELECT * FROM vehicle_sessions WHERE id=?", (session_id,)).fetchone()
    return _row_to_session(s), None

def end_session(kiosk_id: str, ts: str | None, camera_url: str | None, plate_url: str | None):
    exit_dt = parse_iso_or_now(ts)
    exit_iso = exit_dt.isoformat()
    now = now_utc_iso()
    with db() as conn:
        kiosk = conn.execute("SELECT * FROM kiosks WHERE id=? AND is_active=1", (kiosk_id,)).fetchone()
        if not kiosk:
            return None, "Kiosk not found"
        session_id = kiosk["current_session_id"]
        if session_id is None:
            r = conn.execute("SELECT * FROM vehicle_sessions WHERE kiosk_id=? AND exit_at IS NULL ORDER BY entry_at DESC LIMIT 1", (kiosk_id,)).fetchone()
            if not r:
                return None, "No active session"
            session_id = int(r["id"])
        s = conn.execute("SELECT * FROM vehicle_sessions WHERE id=?", (session_id,)).fetchone()
        if not s or s["exit_at"] is not None:
            return None, "No active session"
        entry_dt = parse_iso_or_now(s["entry_at"])
        duration_minutes = int((exit_dt - entry_dt).total_seconds() / 60.0)
        if duration_minutes < 0:
            duration_minutes = 0
        fee, _ = calc_fee_vnd(s["vehicle_type"], duration_minutes)
        conn.execute(
            """UPDATE vehicle_sessions
                 SET exit_at=?, duration_minutes=?, fee_vnd=?, exit_camera_url=?, exit_plate_url=?, updated_at=?
                 WHERE id=?""",
            (exit_iso, duration_minutes, fee, camera_url, plate_url, now, session_id),
        )
        conn.execute(
            """UPDATE kiosks
                 SET occupied=0, current_session_id=NULL, current_plate=NULL, current_vehicle_type=NULL, current_entry_at=NULL,
                     updated_at=?
                 WHERE id=?""",
            (now, kiosk_id),
        )
        s2 = conn.execute("SELECT * FROM vehicle_sessions WHERE id=?", (session_id,)).fetchone()
    return _row_to_session(s2), None

def list_sessions(kiosk_id: str | None, plate_contains: str | None, from_ts: str | None, to_ts: str | None, status: str | None, page: int, limit: int):
    page = max(1, page)
    limit = max(1, min(limit, 200))
    where = []
    params: list[Any] = []
    if kiosk_id and kiosk_id != "ALL":
        where.append("kiosk_id=?")
        params.append(kiosk_id)
    if plate_contains:
        where.append("plate LIKE ?")
        params.append(f"%{plate_contains.strip().upper().replace(' ', '')}%")
    if from_ts:
        where.append("entry_at >= ?")
        params.append(from_ts)
    if to_ts:
        where.append("entry_at <= ?")
        params.append(to_ts)
    if status == "ACTIVE":
        where.append("exit_at IS NULL")
    elif status == "DONE":
        where.append("exit_at IS NOT NULL")
    wh = (" WHERE " + " AND ".join(where)) if where else ""
    offset = (page - 1) * limit
    with db() as conn:
        total = int(conn.execute(f"SELECT COUNT(*) as c FROM vehicle_sessions{wh}", params).fetchone()["c"])
        rows = conn.execute(f"SELECT * FROM vehicle_sessions{wh} ORDER BY entry_at DESC LIMIT ? OFFSET ?", params + [limit, offset]).fetchall()
        return [_row_to_session(r) for r in rows], total

def dashboard_kpis():
    sod = start_of_day_utc(settings.timezone).isoformat()
    with db() as conn:
        active = int(conn.execute("SELECT COUNT(*) as c FROM vehicle_sessions WHERE exit_at IS NULL").fetchone()["c"])
        rows = conn.execute("SELECT fee_vnd FROM vehicle_sessions WHERE exit_at IS NOT NULL AND exit_at >= ?", (sod,)).fetchall()
        revenue = sum(int(r["fee_vnd"] or 0) for r in rows)
        kiosks = conn.execute("SELECT temperature_c, humidity_pct, smoke FROM kiosks WHERE is_active=1").fetchall()
    from .utils import env_status
    warn = 0
    for k in kiosks:
        st = env_status(k["temperature_c"], k["humidity_pct"], bool(k["smoke"]))
        if st in ("WARN", "DANGER"):
            warn += 1
    return {"activeVehicles": active, "revenueTodayVnd": int(revenue), "sensorWarnings": warn}

def recent_sessions(limit: int = 40):
    limit = max(1, min(limit, 200))
    with db() as conn:
        rows = conn.execute("SELECT * FROM vehicle_sessions ORDER BY entry_at DESC LIMIT ?", (limit,)).fetchall()
        return [_row_to_session(r) for r in rows]