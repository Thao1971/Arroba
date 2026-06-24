"""Copilot router. Public — works with or without a logged-in user. The
context passed by the frontend tells us who they are."""
from __future__ import annotations

from fastapi import APIRouter, Response

from src.modules.copilot import service
from src.modules.copilot.models import (
    AnalyzeSkillRequest,
    AnalyzeSkillResponse,
    RecommendSkillRequest,
    RecommendSkillResponse,
    SearchSkillRequest,
    SearchSkillResponse,
    ValueSkillRequest,
    ValueSkillResponse,
)
from src.modules.copilot.skills.analyze import execute_analyze
from src.modules.copilot.skills.recommend import execute_recommend
from src.modules.copilot.skills.value import execute_value

public_router = APIRouter(prefix="/copilot", tags=["copilot"])


@public_router.post(
    "/skills/search",
    response_model=SearchSkillResponse,
    responses={
        200: {
            "description": (
                "Search skill executed. Returns a Workspace with the materialised "
                "blocks (SearchResultsBlock / EmptyStateBlock). Header `X-Source` "
                "reports the source of truth (`mock` in E1.3+)."
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


@public_router.post(
    "/skills/analyze",
    response_model=AnalyzeSkillResponse,
    responses={
        200: {
            "description": (
                "Analyze skill executed. Returns a Workspace with Hero + Metrics "
                "+ CompanyCard + Narrative (LLM-powered). `X-Source` mock|real."
            )
        },
        422: {"description": "Invalid query (empty, too long, extra fields)."},
    },
)
async def post_analyze(
    payload: AnalyzeSkillRequest, response: Response
) -> AnalyzeSkillResponse:
    result = await execute_analyze(payload)
    response.headers["X-Source"] = result.source
    return result


@public_router.post(
    "/skills/value",
    response_model=ValueSkillResponse,
    responses={
        200: {
            "description": (
                "Value skill executed. Indicative valuation with central value + "
                "range (deterministic, simplified). The real Valuation Engine "
                "ships via REQ-004."
            )
        },
        422: {"description": "Invalid query (empty, too long, extra fields)."},
    },
)
async def post_value(payload: ValueSkillRequest, response: Response) -> ValueSkillResponse:
    result = await execute_value(payload)
    response.headers["X-Source"] = result.source
    return result


@public_router.post(
    "/skills/recommend",
    response_model=RecommendSkillResponse,
    responses={
        200: {
            "description": (
                "Recommend skill executed. LLM-assisted intent routing into "
                "subtypes similar_to_company | opportunities_by_sector | "
                "list_by_sector. Mock body until REQ-005 ships."
            )
        },
        422: {"description": "Invalid query (empty, too long, extra fields)."},
    },
)
async def post_recommend(
    payload: RecommendSkillRequest, response: Response
) -> RecommendSkillResponse:
    result = await execute_recommend(payload)
    response.headers["X-Source"] = result.source
    return result
