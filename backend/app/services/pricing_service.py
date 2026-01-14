from __future__ import annotations
import math
from typing import Tuple
from ..db.database import db
from ..schemas.common import VehicleType
from .utils import now_utc_iso

def get_pricing() -> dict:
    with db() as conn:
        row = conn.execute("SELECT * FROM pricing WHERE id=1").fetchone()
        return {
            "freeMinutes": int(row["free_minutes"]),
            "roundingVnd": int(row["rounding_vnd"]),
            "ratePerHour": {
                "MOTORBIKE": int(row["rate_motorbike"]),
                "CAR": int(row["rate_car"]),
                "TRUCK": int(row["rate_truck"]),
            },
            "updatedAt": row["updated_at"],
        }

def update_pricing(free_minutes: int, rounding_vnd: int, rate_per_hour: dict[VehicleType, int]) -> dict:
    with db() as conn:
        conn.execute(
            "UPDATE pricing SET free_minutes=?, rounding_vnd=?, rate_motorbike=?, rate_car=?, rate_truck=?, updated_at=? WHERE id=1",
            (
                free_minutes,
                rounding_vnd,
                int(rate_per_hour["MOTORBIKE"]),
                int(rate_per_hour["CAR"]),
                int(rate_per_hour["TRUCK"]),
                now_utc_iso(),
            ),
        )
    return get_pricing()


def update_pricing_patch(patch: dict) -> dict:
    """Partially update pricing.

    Accepts a dict with optional keys: freeMinutes, roundingVnd, ratePerHour.
    Missing keys keep their current values.
    """
    current = get_pricing()
    free_minutes = int(patch.get("freeMinutes", current["freeMinutes"]))
    rounding_vnd = int(patch.get("roundingVnd", current["roundingVnd"]))

    rate_per_hour = current["ratePerHour"]
    if "ratePerHour" in patch and patch["ratePerHour"] is not None:
        # merge per-vehicle rates
        merged = dict(rate_per_hour)
        merged.update(patch["ratePerHour"])
        rate_per_hour = merged

    return update_pricing(free_minutes, rounding_vnd, rate_per_hour)

def calc_fee_vnd(vehicle_type: VehicleType, duration_minutes: int) -> Tuple[int, int]:
    p = get_pricing()
    free = int(p["freeMinutes"])
    rounding = int(p["roundingVnd"])
    rate = int(p["ratePerHour"][vehicle_type])
    chargeable = max(0, duration_minutes - free)
    hours = 0 if chargeable == 0 else int(math.ceil(chargeable / 60.0))
    fee = hours * rate
    if fee > 0 and rounding > 1:
        fee = int(math.ceil(fee / rounding) * rounding)
    return fee, hours
