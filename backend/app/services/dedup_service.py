from __future__ import annotations
from ..db.database import db
from .utils import now_utc_iso, parse_iso_or_now

def seen_event(event_id: str, kiosk_id: str, ts: str | None) -> bool:
    """Return True if this event_id was already ingested (duplicate)."""
    if not event_id:
        return False
    t = parse_iso_or_now(ts).isoformat()
    with db() as conn:
        try:
            conn.execute(
                "INSERT INTO ingested_events (event_id, kiosk_id, ts, created_at) VALUES (?, ?, ?, ?)",
                (event_id, kiosk_id, t, now_utc_iso()),
            )
            return False
        except Exception:
            # sqlite constraint error -> duplicate
            return True
