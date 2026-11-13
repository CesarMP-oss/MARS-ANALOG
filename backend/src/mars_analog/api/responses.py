"""Helpers that wrap payloads in the API envelope and raise contract errors."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import Depends, Request

from mars_analog import API_VERSION, __version__, limitations
from mars_analog.results_store import ResultsStore
from mars_analog.schemas import Envelope, Meta, RunInfo
from mars_analog.settings import Settings


class APIError(Exception):
    def __init__(
        self, status_code: int, code: str, message: str, details: dict[str, Any] | None = None
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or {}


def get_store(request: Request) -> ResultsStore:
    return request.app.state.store


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


Store = Annotated[ResultsStore, Depends(get_store)]


def envelope[T](
    data: T,
    store: ResultsStore,
    limitation_codes: list[str] | tuple[str, ...] = (),
    provenance_ids: list[str | None] | None = None,
    run: RunInfo | None = None,
) -> Envelope[T]:
    run = run if run is not None else store.run()
    ids = [pid for pid in (provenance_ids or []) if pid]
    return Envelope[T](
        api_version=API_VERSION,
        data=data,
        meta=Meta(
            generated_at=datetime.now(UTC),
            run_id=run.run_id if run else None,
            software_version=__version__,
            git_commit=store.settings.git_commit,
            is_synthetic=bool(run and run.is_synthetic),
        ),
        limitations=limitations.get(limitation_codes),
        provenance_ids=list(dict.fromkeys(ids)),
    )
