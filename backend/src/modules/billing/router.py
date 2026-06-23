from fastapi import APIRouter

from src.core.config import get_settings

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/health")
async def billing_health() -> dict:
    """E0 stub: confirm Stripe SDK availability and env presence."""
    settings = get_settings()
    try:
        import stripe  # noqa: F401
        sdk_ok = True
    except Exception:
        sdk_ok = False
    return {
        "stripe_sdk_installed": sdk_ok,
        "stripe_api_key_present": bool(settings.stripe_api_key),
        "stripe_webhook_secret_present": bool(settings.stripe_webhook_secret),
    }
