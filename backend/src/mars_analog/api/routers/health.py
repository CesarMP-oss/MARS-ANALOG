import platform

import pyproj
import rasterio
from fastapi import APIRouter

from mars_analog import API_VERSION, __version__
from mars_analog.api.responses import Store, envelope
from mars_analog.schemas import Envelope, Health

router = APIRouter(tags=["health"])


@router.get("/health", response_model=Envelope[Health])
def get_health(store: Store):
    run = store.run()
    data = Health(
        status="ok",
        api_version=API_VERSION,
        software_version=__version__,
        git_commit=store.settings.git_commit,
        python=platform.python_version(),
        gdal=rasterio.__gdal_version__,
        proj_rasterio=rasterio.__proj_version__,
        proj_pyproj=pyproj.proj_version_str,
        results_run_id=run.run_id if run else None,
    )
    return envelope(data, store, run=run)
