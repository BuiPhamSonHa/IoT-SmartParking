from __future__ import annotations
from typing import Optional
from ..db.database import db
from .utils import now_utc_iso, env_status


def _row_to_kiosk(r) -> dict:
    temp = r["temperature_c"] if r["temperature_c"] is not None else 0.0
    hum = r["humidity_pct"] if r["humidity_pct"] is not None else 0.0
    smoke = bool(r["smoke"])
    return {
        "id": r["id"],
        "name": r["name"],
        "occupied": bool(r["occupied"]),
        "currentPlate": r["current_plate"],
        "currentVehicleType": r["current_vehicle_type"],
        "currentEntryAt": r["current_entry_at"],
        "temperatureC": float(temp),
        "humidityPct": float(hum),
        "smokeWarning": smoke,
        "updatedAt": r["updated_at"],
        "envStatus": env_status(temp, hum, smoke),
    }


def list_kiosks() -> list[dict]:
    with db() as conn:
        rows = conn.execute("SELECT * FROM kiosks WHERE is_active=1 ORDER BY id ASC").fetchall()
        return [_row_to_kiosk(r) for r in rows]


def get_kiosk(kiosk_id: str) -> Optional[dict]:
    with db() as conn:
        r = conn.execute("SELECT * FROM kiosks WHERE id=? AND is_active=1", (kiosk_id,)).fetchone()
        return _row_to_kiosk(r) if r else None


def create_kiosk(name: str) -> dict:
    with db() as conn:
        rows = conn.execute("SELECT id FROM kiosks").fetchall()
        used = set([r["id"] for r in rows])
        n = 1
        while True:
            kid = f"k{n}"
            if kid not in used:
                break
            n += 1
        now = now_utc_iso()
        conn.execute("INSERT INTO kiosks (id, name, updated_at) VALUES (?, ?, ?)", (kid, name, now))
    return get_kiosk(kid)  # type: ignore


def update_kiosk_name(kiosk_id: str, name: str) -> Optional[dict]:
    with db() as conn:
        conn.execute(
            "UPDATE kiosks SET name=?, updated_at=? WHERE id=? AND is_active=1",
            (name, now_utc_iso(), kiosk_id),
        )
    return get_kiosk(kiosk_id)


def delete_kiosk(kiosk_id: str) -> bool:
    with db() as conn:
        cur = conn.execute(
            "UPDATE kiosks SET is_active=0, updated_at=? WHERE id=? AND is_active=1",
            (now_utc_iso(), kiosk_id),
        )
        return cur.rowcount > 0


def update_telemetry(
    kiosk_id: str,
    temperature_c: float | None,
    humidity_pct: float | None,
    smoke: bool | None,
) -> Optional[dict]:
    """Update kiosk telemetry (no images).

    Telemetry is meant for sensor values / health only. We intentionally do NOT
    update any camera snapshot fields here.
    """
    with db() as conn:
        r = conn.execute("SELECT id FROM kiosks WHERE id=? AND is_active=1", (kiosk_id,)).fetchone()
        if not r:
            return None

        existing = conn.execute(
            "SELECT temperature_c, humidity_pct, smoke FROM kiosks WHERE id=?",
            (kiosk_id,),
        ).fetchone()

        temp = existing["temperature_c"] if temperature_c is None else temperature_c
        hum = existing["humidity_pct"] if humidity_pct is None else humidity_pct
        sm = existing["smoke"] if smoke is None else (1 if smoke else 0)

        conn.execute(
            "UPDATE kiosks SET temperature_c=?, humidity_pct=?, smoke=?, updated_at=? WHERE id=?",
            (temp, hum, sm, now_utc_iso(), kiosk_id),
        )

    return get_kiosk(kiosk_id)
