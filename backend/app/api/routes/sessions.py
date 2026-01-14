from __future__ import annotations
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from ...services.session_service import list_sessions
import csv, io

router = APIRouter(prefix="/vehicle-sessions", tags=["sessions"])

@router.get("")
def get_sessions(
    kioskId: str | None = None,
    plate: str | None = None,
    status: str | None = Query(default=None, description="ACTIVE or DONE"),
    fromTs: str | None = None,
    toTs: str | None = None,
    page: int = 1,
    limit: int = 50,
):
    items, total = list_sessions(kioskId, plate, fromTs, toTs, status, page, limit)
    return {"items": items, "total": total, "page": page, "limit": limit}

@router.get("/export")
def export_csv(kioskId: str | None = None, plate: str | None = None, status: str | None = None, fromTs: str | None = None, toTs: str | None = None):
    items, _ = list_sessions(kioskId, plate, fromTs, toTs, status, page=1, limit=5000)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id","kioskId","plate","vehicleType","entryAt","exitAt","durationMinutes","feeVnd"])
    for s in items:
        w.writerow([s["id"], s["kioskId"], s["plate"], s["vehicleType"], s["entryAt"], s.get("exitAt") or "", s.get("durationMinutes") or "", s.get("feeVnd") or ""])
    data = buf.getvalue().encode("utf-8")
    return StreamingResponse(iter([data]), media_type="text/csv", headers={"Content-Disposition":"attachment; filename=smartpark_history.csv"})
