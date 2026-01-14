from __future__ import annotations
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio, json
from ...services.event_service import list_events

router = APIRouter(prefix="/events", tags=["events"])

@router.get("")
def get_events(after_id: int = 0, limit: int = 200):
    events, last = list_events(after_id, limit)
    return {"events": events, "lastEventId": last}

@router.get("/stream")
async def stream(after_id: int = 0, heartbeat: int = 15):
    async def gen():
        last = after_id
        hb = max(5, min(heartbeat, 60))
        ticks = 0
        while True:
            events, last2 = list_events(last, 200)
            if events:
                for ev in events:
                    yield f"data: {json.dumps(ev, ensure_ascii=False)}\n\n"
                last = last2
                ticks = 0
            else:
                ticks += 1
                if ticks >= hb:
                    yield ": keep-alive\n\n"
                    ticks = 0
                await asyncio.sleep(1)
    return StreamingResponse(gen(), media_type="text/event-stream")
