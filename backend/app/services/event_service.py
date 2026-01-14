from __future__ import annotations
import json
from typing import Any, Optional
from ..db.database import db
from .utils import now_utc_iso

def emit(kind: str, payload: dict[str, Any], kiosk_id: Optional[str] = None, session_id: Optional[int] = None) -> int:
    with db() as conn:
        conn.execute(
            "INSERT INTO events (ts, kind, kiosk_id, session_id, payload) VALUES (?, ?, ?, ?, ?)",
            (now_utc_iso(), kind, kiosk_id, session_id, json.dumps(payload, ensure_ascii=False)),
        )
        eid = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        return int(eid)

def list_events(after_id: int, limit: int = 200) -> tuple[list[dict], int]:
    limit = max(1, min(limit, 500))
    with db() as conn:
        rows = conn.execute(
            "SELECT id, ts, kind, kiosk_id, session_id, payload FROM events WHERE id > ? ORDER BY id ASC LIMIT ?",
            (after_id, limit),
        ).fetchall()
        events = []
        last = after_id
        for r in rows:
            last = int(r["id"])
            events.append(
                {
                    "id": int(r["id"]),
                    "ts": r["ts"],
                    "kind": r["kind"],
                    "kioskId": r["kiosk_id"],
                    "sessionId": r["session_id"],
                    "payload": json.loads(r["payload"]),
                }
            )
        return events, last
