from __future__ import annotations
import sqlite3
from datetime import datetime, timezone

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def init_db(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS kiosks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,

      occupied INTEGER NOT NULL DEFAULT 0,
      current_session_id INTEGER,
      current_plate TEXT,
      current_vehicle_type TEXT,
      current_entry_at TEXT,

      temperature_c REAL,
      humidity_pct REAL,
      smoke INTEGER NOT NULL DEFAULT 0,
      camera_snapshot_url TEXT,

      updated_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS pricing (
      id INTEGER PRIMARY KEY CHECK (id=1),
      free_minutes INTEGER NOT NULL,
      rounding_vnd INTEGER NOT NULL,
      rate_motorbike INTEGER NOT NULL,
      rate_car INTEGER NOT NULL,
      rate_truck INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS vehicle_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kiosk_id TEXT NOT NULL,
      plate TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      entry_at TEXT NOT NULL,
      exit_at TEXT,
      duration_minutes INTEGER,
      fee_vnd INTEGER,
      entry_camera_url TEXT,
      entry_plate_url TEXT,
      exit_camera_url TEXT,
      exit_plate_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
    """)

    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_kiosk_entry ON vehicle_sessions(kiosk_id, entry_at DESC)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_plate_entry ON vehicle_sessions(plate, entry_at DESC)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_exit ON vehicle_sessions(exit_at)")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      kind TEXT NOT NULL,
      kiosk_id TEXT,
      session_id INTEGER,
      payload TEXT NOT NULL
    )
    """)

    cur.execute("CREATE INDEX IF NOT EXISTS idx_events_id ON events(id)")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS ingested_events (
      event_id TEXT PRIMARY KEY,
      kiosk_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_ingested_events_kiosk ON ingested_events(kiosk_id, ts DESC)")


    # Seed pricing singleton
    cur.execute("SELECT id FROM pricing WHERE id=1")
    if cur.fetchone() is None:
        cur.execute(
            "INSERT INTO pricing (id, free_minutes, rounding_vnd, rate_motorbike, rate_car, rate_truck, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?)",
            (15, 1000, 3000, 5000, 8000, _now()),
        )

    # Seed kiosks (k1-k3)
    cur.execute("SELECT COUNT(*) as c FROM kiosks WHERE is_active=1")
    c = cur.fetchone()[0]
    if c == 0:
        now = _now()
        for i in range(1, 4):
            cur.execute(
                "INSERT INTO kiosks (id, name, updated_at) VALUES (?, ?, ?)",
                (f"k{i}", f"Kiot {i}", now),
            )

    conn.commit()
