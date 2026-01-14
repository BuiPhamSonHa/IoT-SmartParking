from __future__ import annotations
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

try:
    from zoneinfo import ZoneInfoNotFoundError  # py>=3.9
except Exception:  # pragma: no cover
    ZoneInfoNotFoundError = Exception  # type: ignore

def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def parse_iso_or_now(ts: str | None) -> datetime:
    if ts:
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(timezone.utc)
        except Exception:
            pass
    return datetime.now(timezone.utc)

def env_status(temp: float | None, hum: float | None, smoke: bool) -> str:
    if smoke:
        return "DANGER"
    t = temp if temp is not None else 0.0
    h = hum if hum is not None else 0.0
    if t >= 42 or t <= 12 or h >= 90 or h <= 25:
        return "DANGER"
    if t >= 38 or t <= 18 or h >= 85 or h <= 30:
        return "WARN"
    return "GOOD"

def start_of_day_utc(tz_name: str) -> datetime:
    """Return start-of-day (00:00) in UTC for the given IANA timezone name.

    On Windows, Python may not ship with the IANA tz database; we fall back to UTC
    if the timezone cannot be loaded (and you can install `tzdata` to enable IANA zones).
    """
    try:
        tz = ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, Exception):
        tz = timezone.utc
    now_local = datetime.now(tz)
    sod_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    return sod_local.astimezone(timezone.utc)
