from typing import Annotated

from fastapi import APIRouter, Query

from mars_analog.api.responses import APIError, Store, envelope
from mars_analog.api.routers.regions import require_region
from mars_analog.schemas import Envelope, MetricSummary, RegionMetrics

router = APIRouter(tags=["metrics"])

METRIC_UNITS: dict[str, str] = {
    "slope": "degree",
    "tri_riley": "m",
    "local_relief": "m",
    "profile_curvature": "1/m",
    "plan_curvature": "1/m",
}

BODY_LIMITATIONS: dict[str, tuple[str, ...]] = {
    "mars": ("MOLA_INTERPOLATED_BINS", "MEGDR_GDAL_PIXEL_SCALE"),
    "earth": ("SRTM_VOID_FILL", "GMTED_SOUTH_AMERICA_SHIFT", "DEM_NOISE_FLAT_TERRAIN"),
}


def not_computed(region_id: str) -> RegionMetrics:
    return RegionMetrics(
        region_id=region_id,
        metrics=[
            MetricSummary(region_id=region_id, metric=name, unit=unit, status="not_computed")
            for name, unit in METRIC_UNITS.items()
        ],
    )


@router.get("/regions/{region_id}/metrics", response_model=Envelope[RegionMetrics])
def get_region_metrics(
    region_id: str,
    store: Store,
    scale_m: Annotated[float | None, Query(gt=0)] = None,
):
    region = require_region(store, region_id)
    result = store.region_metrics(region_id) or not_computed(region_id)
    if scale_m is not None and result.scale_m is not None and abs(result.scale_m - scale_m) > 0.5:
        raise APIError(
            404,
            "scale_not_available",
            f"No metrics at scale {scale_m} m for {region_id!r}",
            {"available_scale_m": result.scale_m},
        )
    codes = [
        "SCALE_DEPENDENCE",
        "AOI_DEFINITION_DEPENDENCE",
        *BODY_LIMITATIONS[region.properties.body],
    ]
    return envelope(result, store, codes, [m.provenance_id for m in result.metrics])
