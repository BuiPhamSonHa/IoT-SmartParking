from __future__ import annotations
from fastapi import APIRouter
from ...db.database import db

router = APIRouter()

@router.get("/healthz")
def healthz():
    return {"ok": True}

@router.get("/readyz")
def readyz():
    with db() as conn:
        conn.execute("SELECT 1").fetchone()
    return {"ok": True}
