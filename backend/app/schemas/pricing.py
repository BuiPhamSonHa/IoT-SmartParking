from __future__ import annotations
from pydantic import BaseModel, Field
from .common import VehicleType

class PricingOut(BaseModel):
    freeMinutes: int
    roundingVnd: int
    ratePerHour: dict[VehicleType, int]
    updatedAt: str

class PricingUpdateIn(BaseModel):
    freeMinutes: int = Field(ge=0, le=240)
    roundingVnd: int = Field(ge=1, le=100000)
    ratePerHour: dict[VehicleType, int]


# PATCH-friendly schema: allow clients (especially UI forms) to send partial updates.
# This prevents noisy 422 errors when the client sends only the changed fields.
class PricingPatchIn(BaseModel):
    freeMinutes: int | None = Field(default=None, ge=0, le=240)
    roundingVnd: int | None = Field(default=None, ge=1, le=100000)
    ratePerHour: dict[VehicleType, int] | None = None
