from __future__ import annotations
from fastapi import APIRouter
from ...services.kiosk_service import list_kiosks
from ...services.session_service import dashboard_kpis, recent_sessions
from ...services.pricing_service import get_pricing
from ...services.utils import now_utc_iso

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("")
def get_dashboard(recentLimit: int = 40):
    return {
        "serverTime": now_utc_iso(),
        "kpis": dashboard_kpis(),
        "pricing": get_pricing(),
        "kiosks": list_kiosks(),
        "recentSessions": recent_sessions(recentLimit),
    }
