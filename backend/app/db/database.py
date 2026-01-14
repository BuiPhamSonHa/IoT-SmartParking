from __future__ import annotations
import sqlite3
from contextlib import contextmanager
from .migrations import init_db
from ..core.config import settings

def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

@contextmanager
def db():
    conn = _connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def startup_db():
    with db() as conn:
        init_db(conn)
