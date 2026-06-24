"""Copilot router. Public — works with or without a logged-in user. The
context passed by the frontend tells us who they are."""
from __future__ import annotations

from fastapi import APIRouter, Response

from src.modules.copilot import service
from src.modules.copilot.models import (
    SearchSkillRequest,
    SearchSkillResponse,
)

public_router = APIRouter(prefix="/copilot", tags=["copilot"])


@public_router.post(
    "/skills/search",
    response_model=SearchSkillResponse,
    responses={
        200: {
            "description": (
                "Search skill executed. Returns a Workspace with the materialised "
                "blocks (SearchResultsBlock / EmptyStateBlock). Header `X-Source` "
                "reports the source of truth (`mock` in E1.3)."
            )
        },
        422: {"description": "Invalid query (empty, too long, or extra fields)."},
    },
)
async def post_search(
    payload: SearchSkillRequest, response: Response
) -> SearchSkillResponse:
    result = await service.execute_search(payload)
    response.headers["X-Source"] = result.source
    return result
