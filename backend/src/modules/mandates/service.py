"""Servicio del módulo `mandates`.

Beta es solo frontend + un proxy fino: todo el backend (persistencia, scoring,
lógica de negocio) vive en `Intel-140826`. Este módulo NO guarda mandatos ni
candidatas en la base de datos de Beta — cada función reenvía la petición a
`/api/v1/buyer-mandates/*` en Intel con `beta_user_id` para que Intel sepa
distinguir mandatos de distintos usuarios de Beta (ver nota de auth en
`config.py`). Si Intel no está accesible (token sin provisionar, red, 5xx),
esto falla explícitamente — no hay modo mock de respaldo.
"""
from __future__ import annotations

from src.core.logging import get_logger
from src.modules.mandates.client import MandatesHTTPError, get_mandates_client
from src.modules.mandates.models import (
    FitDimension,
    Mandate,
    MandateCreate,
    MandateTarget,
    MandateTargetsResponse,
    MandateUpdate,
)

log = get_logger("mandates.service")

_MANDATES_PATH = "/api/v1/buyer-mandates"


class MandateNotFoundError(LookupError):
    pass


class MandateProviderError(RuntimeError):
    def __init__(self, message: str, *, error_class: str = "server_5xx") -> None:
        super().__init__(message)
        self.error_class = error_class


def _class_for(status_code: int) -> str:
    if status_code in (401, 403):
        return "unauthorized"
    if 500 <= status_code < 600:
        return "server_5xx"
    return "client_4xx"


async def _request(method: str, path: str, *, json: dict | None = None, params: dict | None = None):
    client = get_mandates_client()
    try:
        return await client.request(method, path, json=json, params=params)
    except MandatesHTTPError as exc:
        raise MandateProviderError(str(exc), error_class=exc.error_class) from exc


def _mandate_from_intel(doc: dict, *, user_id: str, org_id: str | None) -> Mandate:
    # `doc` es la respuesta cruda de Intel — beta_user_id/beta_org_id no viajan
    # de vuelta desde ahí (Intel los guarda como created_by), se completan aquí
    # solo para que el DTO de Beta sea coherente con quien hizo la petición.
    return Mandate(**doc, beta_user_id=user_id, beta_org_id=org_id)


# ---------------------------------------------------------------- create/read/update

async def create_mandate(payload: MandateCreate, *, user_id: str, org_id: str | None) -> Mandate:
    body = {**payload.model_dump(exclude_none=True), "beta_user_id": user_id}
    resp = await _request("POST", _MANDATES_PATH, json=body)
    if resp.status_code >= 400:
        raise MandateProviderError(f"upstream {resp.status_code}", error_class=_class_for(resp.status_code))
    log.info("mandates.create", user_id=user_id)
    return _mandate_from_intel(resp.json(), user_id=user_id, org_id=org_id)


async def list_my_mandates(*, user_id: str, org_id: str | None, status: str | None = None) -> list[Mandate]:
    params: dict = {"beta_user_id": user_id}
    if status:
        params["status"] = status
    resp = await _request("GET", _MANDATES_PATH, params=params)
    if resp.status_code >= 400:
        raise MandateProviderError(f"upstream {resp.status_code}", error_class=_class_for(resp.status_code))
    rows = resp.json().get("mandates") or []
    return [_mandate_from_intel(r, user_id=user_id, org_id=org_id) for r in rows]


async def get_mandate(mandate_id: str, *, user_id: str) -> Mandate | None:
    resp = await _request("GET", f"{_MANDATES_PATH}/{mandate_id}")
    if resp.status_code == 404:
        return None
    if resp.status_code >= 400:
        raise MandateProviderError(f"upstream {resp.status_code}", error_class=_class_for(resp.status_code))
    return _mandate_from_intel(resp.json(), user_id=user_id, org_id=None)


async def update_mandate(mandate_id: str, patch: MandateUpdate, *, user_id: str) -> Mandate | None:
    resp = await _request(
        "PATCH", f"{_MANDATES_PATH}/{mandate_id}", json=patch.model_dump(exclude_unset=True)
    )
    if resp.status_code == 404:
        return None
    if resp.status_code >= 400:
        raise MandateProviderError(f"upstream {resp.status_code}", error_class=_class_for(resp.status_code))
    return _mandate_from_intel(resp.json(), user_id=user_id, org_id=None)


async def get_targets(mandate_id: str, *, user_id: str, limit: int = 20) -> MandateTargetsResponse:
    resp = await _request("GET", f"{_MANDATES_PATH}/{mandate_id}/targets", params={"limit": limit})
    if resp.status_code == 404:
        raise MandateNotFoundError(mandate_id)
    if resp.status_code >= 400:
        raise MandateProviderError(f"upstream {resp.status_code}", error_class=_class_for(resp.status_code))
    doc = resp.json()
    targets = [
        MandateTarget(
            master_id=t.get("master_id", ""),
            name=t.get("name"),
            score=t.get("score"),
            fit_dimensions={
                k: FitDimension(**v) if isinstance(v, dict) else FitDimension(value=v)
                for k, v in (t.get("fit_dimensions") or {}).items()
            },
            score_method=t.get("score_method"),
            explanation=t.get("explanation"),
            role=t.get("role"),
            role_label=t.get("role_label"),
        )
        for t in (doc.get("targets") or [])
    ]
    return MandateTargetsResponse(
        mandate_id=doc.get("mandate_id", mandate_id),
        mandate_name=doc.get("mandate_name"),
        candidates_scanned=doc.get("candidates_scanned", 0),
        count=doc.get("count", len(targets)),
        targets=targets,
        source="real",
    )


__all__ = [
    "create_mandate",
    "list_my_mandates",
    "get_mandate",
    "update_mandate",
    "get_targets",
    "MandateNotFoundError",
    "MandateProviderError",
]
