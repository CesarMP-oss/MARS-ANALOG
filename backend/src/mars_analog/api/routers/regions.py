from typing import Literal

from fastapi import APIRouter

from mars_analog.api.responses import APIError, Store, envelope
from mars_analog.results_store import ResultsStore
from mars_analog.schemas import Envelope, Region

router = APIRouter(tags=["regions"])

REGION_LIMITATIONS = ("AOI_DEFINITION_DEPENDENCE",)


def require_region(store: ResultsStore, region_id: str) -> Region:
    region = store.region(region_id)
    if region is None:
        raise APIError(404, "region_not_found", f"Region {region_id!r} not found")
    return region


@router.get("/regions", response_model=Envelope[list[Region]])
def list_regions(store: Store, body: Literal["earth", "mars"] | None = None):
    return envelope(store.regions(body), store, REGION_LIMITATIONS)


@router.get("/regions/{region_id}", response_model=Envelope[Region])
def get_region(region_id: str, store: Store):
    return envelope(require_region(store, region_id), store, REGION_LIMITATIONS)
