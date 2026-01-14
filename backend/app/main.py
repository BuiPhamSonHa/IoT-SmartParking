from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .db.database import startup_db

from .api.routes.health import router as health_router
from .api.routes.dashboard import router as dashboard_router
from .api.routes.kiosks import router as kiosks_router
from .api.routes.pricing import router as pricing_router
from .api.routes.ingest import router as ingest_router
from .api.routes.sessions import router as sessions_router
from .api.routes.events import router as events_router
from .api.routes.simulator import router as simulator_router

def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def _startup():
        startup_db()

    app.include_router(health_router)

    # ------------------------------------------------------------------
    # Legacy compatibility endpoint
    # Some frontends/devices poll /api/state?after=... (older SmartPark API).
    # We keep a thin compatibility layer to avoid noisy 404s.
    # ------------------------------------------------------------------
    @app.get("/api/state")
    def legacy_state(after: int = 0, recentLimit: int = 40):
        from .services.kiosk_service import list_kiosks
        from .services.pricing_service import get_pricing
        from .services.session_service import active_sessions, recent_sessions, dashboard_kpis
        from .services.event_service import list_events
        from .services.utils import now_utc_iso

        events = list_events(after_id=after, limit=200)
        last_id = events[-1]["id"] if events else after
        return {
            "serverTime": now_utc_iso(),
            "kpis": dashboard_kpis(),
            "pricing": get_pricing(),
            "kiosks": list_kiosks(),
            "activeSessions": active_sessions(),
            "recentSessions": recent_sessions(limit=recentLimit),
            "events": events,
            "lastEventId": last_id,
        }

    from fastapi import APIRouter
    api = APIRouter(prefix=settings.api_prefix)
    api.include_router(dashboard_router)
    api.include_router(kiosks_router)
    api.include_router(pricing_router)
    api.include_router(ingest_router)
    api.include_router(sessions_router)
    api.include_router(events_router)
    api.include_router(simulator_router)

    app.include_router(api)
    return app

app = create_app()
