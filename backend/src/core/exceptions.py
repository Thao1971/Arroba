"""Domain exceptions + FastAPI exception handlers.
Keeps error responses uniform: { detail: str, code: str }."""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class DomainError(Exception):
    """Base error with a stable `code` and HTTP `status_code`."""
    code: str = "domain_error"
    status_code: int = 400

    def __init__(self, detail: str, code: str | None = None, status_code: int | None = None):
        super().__init__(detail)
        self.detail = detail
        if code:
            self.code = code
        if status_code:
            self.status_code = status_code


class NotFoundError(DomainError):
    code = "not_found"
    status_code = 404


class ConflictError(DomainError):
    code = "conflict"
    status_code = 409


class UnauthorizedError(DomainError):
    code = "unauthorized"
    status_code = 401


class ForbiddenError(DomainError):
    code = "forbidden"
    status_code = 403


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def _domain(request: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": exc.code},
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else "http_error"
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": detail, "code": f"http_{exc.status_code}"},
        )

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "detail": "validation_error",
                "code": "validation_error",
                "errors": exc.errors(),
            },
        )

    # --- Mongo write conflicts ------------------------------------------------
    # Translates pymongo / motor duplicate-key errors into a sanitized 409.
    # Without this, the default 500 path would try to JSON-serialise the
    # BulkWriteError (which contains BSON ObjectId / bytes) and crash with
    # "Object of type bytes is not JSON serializable", leaking a bare 500 to
    # the client and masking the real cause.
    try:  # pragma: no cover - pymongo is always present in this environment
        from pymongo.errors import DuplicateKeyError, BulkWriteError

        @app.exception_handler(DuplicateKeyError)
        async def _dup_key(request: Request, exc: DuplicateKeyError) -> JSONResponse:
            return JSONResponse(
                status_code=409,
                content={
                    "detail": "duplicate_key",
                    "code": "duplicate_key",
                },
            )

        @app.exception_handler(BulkWriteError)
        async def _bulk_write(request: Request, exc: BulkWriteError) -> JSONResponse:
            # `exc.details` contains BSON; never echo it raw to the response.
            err = (exc.details or {}).get("writeErrors", [{}])[0]
            code = err.get("code")
            status_code = 409 if code == 11000 else 500
            return JSONResponse(
                status_code=status_code,
                content={
                    "detail": "duplicate_key" if status_code == 409 else "bulk_write_error",
                    "code": "duplicate_key" if status_code == 409 else "bulk_write_error",
                },
            )
    except ImportError:
        pass

    # --- Catch-all (last resort) ----------------------------------------------
    # FastAPI/Starlette's default handler turns any unhandled exception into a
    # plain-text "Internal Server Error". For our front-end (which assumes JSON
    # bodies with `detail`/`code`) we want a uniform JSON 500 so the UI can
    # surface something better than "Internal Server Error (HTTP 500)".
    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        from src.core.logging import get_logger

        log = get_logger("exceptions")
        log.error(
            "unhandled_exception",
            path=str(request.url.path),
            method=request.method,
            error_type=type(exc).__name__,
            # Coerce non-JSON-safe args via repr() so we never crash here.
            error_repr=repr(exc)[:1024],
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "internal_server_error", "code": "internal_server_error"},
        )

