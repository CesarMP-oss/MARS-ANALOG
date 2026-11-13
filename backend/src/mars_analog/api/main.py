"""FastAPI application: read-only access to precomputed, provenance-stamped results."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from mars_analog import __version__
from mars_analog.api.responses import APIError
from mars_analog.api.routers import (
    comparisons,
    datasets,
    health,
    limitations,
    metrics,
    provenance,
    regions,
)
from mars_analog.results_store import InvalidIdentifier, ResultsStore, StoreError
from mars_analog.schemas import ErrorDetail, ErrorResponse
from mars_analog.settings import Settings, get_settings

API_PREFIX = "/api/v1"


def _error(status_code: int, code: str, message: str, details: dict | None = None):
    body = ErrorResponse(error=ErrorDetail(code=code, message=message, details=details or {}))
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="MARS-ANALOG API",
        version=__version__,
        description=(
            "Read-only API for experimental topographic similarity between Earth regions and "
            "Mars reference regions. Not a measure of habitability or complete analog suitability."
        ),
    )
    app.state.settings = settings
    app.state.store = ResultsStore(settings)

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_methods=["GET"],
            allow_headers=["*"],
        )

    for router in (health, limitations, datasets, regions, metrics, comparisons, provenance):
        app.include_router(router.router, prefix=API_PREFIX)

    @app.exception_handler(APIError)
    async def _api_error(_: Request, exc: APIError):
        return _error(exc.status_code, exc.code, exc.message, exc.details)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException):
        code = {404: "not_found", 405: "method_not_allowed"}.get(exc.status_code, "http_error")
        return _error(exc.status_code, code, str(exc.detail))

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError):
        return _error(
            422, "invalid_request", "Invalid request parameters", {"errors": exc.errors()}
        )

    @app.exception_handler(InvalidIdentifier)
    async def _invalid_identifier(_: Request, exc: InvalidIdentifier):
        return _error(400, "invalid_identifier", str(exc))

    @app.exception_handler(StoreError)
    @app.exception_handler(ValidationError)
    async def _store_error(_: Request, exc: Exception):
        return _error(
            500, "results_store_invalid", "Stored data failed validation", {"reason": str(exc)}
        )

    return app


app = create_app()
