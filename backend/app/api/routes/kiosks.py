from __future__ import annotations
from fastapi import APIRouter, HTTPException
from ...schemas.kiosks import KioskOut, KioskCreateIn, KioskUpdateIn
from ...services.kiosk_service import list_kiosks, create_kiosk, get_kiosk, update_kiosk_name, delete_kiosk
from ...services.event_service import emit

router = APIRouter(prefix="/kiosks", tags=["kiosks"])

@router.get("", response_model=list[KioskOut])
def get_kiosks():
    return list_kiosks()

@router.post("", response_model=KioskOut)
def post_kiosk(payload: KioskCreateIn):
    k = create_kiosk(payload.name)
    emit("KIOSK_CREATED", {"kiosk": k}, kiosk_id=k["id"])
    return k

@router.get("/{kiosk_id}", response_model=KioskOut)
def get_one(kiosk_id: str):
    k = get_kiosk(kiosk_id)
    if not k:
        raise HTTPException(404, "Kiosk not found")
    return k

@router.put("/{kiosk_id}", response_model=KioskOut)
def put_one(kiosk_id: str, payload: KioskUpdateIn):
    k = update_kiosk_name(kiosk_id, payload.name)
    if not k:
        raise HTTPException(404, "Kiosk not found")
    emit("KIOSK_UPDATED", {"kiosk": k}, kiosk_id=kiosk_id)
    return k

@router.delete("/{kiosk_id}")
def delete_one(kiosk_id: str):
    ok = delete_kiosk(kiosk_id)
    if not ok:
        raise HTTPException(404, "Kiosk not found")
    emit("KIOSK_DELETED", {"kioskId": kiosk_id}, kiosk_id=kiosk_id)
    return {"ok": True}
