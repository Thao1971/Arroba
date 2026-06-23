"""Session cookie helpers \u2014 detect X-Forwarded-Proto from the proxy and emit
`Secure` only on HTTPS. Keeps E0.3.1's working state when behind plain HTTP
(tests, local dev) and respects the production HTTPS contract on the preview /
prod ingress."""
from fastapi import Request, Response

SESSION_COOKIE = "arroba_session"
DEFAULT_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def _is_https(request: Request) -> bool:
    proto = request.headers.get("x-forwarded-proto", "http").split(",")[0].strip().lower()
    return proto == "https"


def set_session_cookie(
    response: Response,
    session_id: str,
    request: Request,
    *,
    max_age: int = DEFAULT_MAX_AGE,
) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_id,
        httponly=True,
        samesite="lax",
        secure=_is_https(request),
        max_age=max_age,
        path="/",
    )


def clear_session_cookie(response: Response, request: Request) -> None:
    # delete_cookie writes Set-Cookie with max-age=0; secure must match the set
    # call to ensure the browser correctly overrides the existing cookie.
    response.delete_cookie(
        SESSION_COOKIE,
        path="/",
        secure=_is_https(request),
    )
