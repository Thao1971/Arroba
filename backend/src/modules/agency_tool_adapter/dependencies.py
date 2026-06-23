"""Thin re-export of the admin gate. Keeps the agency_tool_adapter module's
router import surface self-contained per Boundary First."""
from src.modules.auth.dependencies import get_admin_user, get_current_user

__all__ = ["get_admin_user", "get_current_user"]
