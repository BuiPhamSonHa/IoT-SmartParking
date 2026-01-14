from __future__ import annotations
from fastapi import APIRouter, Body
from ...schemas.pricing import PricingOut, PricingUpdateIn, PricingPatchIn
from ...services.pricing_service import get_pricing, update_pricing, update_pricing_patch
from ...services.event_service import emit

router = APIRouter(prefix="/pricing", tags=["pricing"])

@router.get("", response_model=PricingOut)
def get_one():
    return get_pricing()

@router.put("", response_model=PricingOut)
def put_one(
    payload: PricingPatchIn | PricingUpdateIn | None = Body(None)
):
    # Allow no-body PUT to behave like a "refresh" (prevents noisy 422 spam from some UIs)
    if payload is None:
        return get_pricing()

    # PricingUpdateIn is "full" update; PricingPatchIn is partial update.
    if isinstance(payload, PricingUpdateIn):
        updated = update_pricing(payload.freeMinutes, payload.roundingVnd, payload.ratePerHour)
    else:
        patch = payload.model_dump(exclude_none=True)
        updated = update_pricing_patch(patch)

    emit("PRICING_UPDATED", {"pricing": updated})
    return updated
