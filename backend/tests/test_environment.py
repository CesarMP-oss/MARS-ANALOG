
"""Checks that the geospatial stack can represent the datasets MARS-ANALOG relies on."""

import sys

import pyproj
import rasterio
from rasterio.crs import CRS as RasterioCRS


def _major_minor(version: str) -> tuple[int, int]:
    major, minor, *_ = version.split(".")
    return int(major), int(minor)


def test_python_version():
    assert sys.version_info[:2] == (3, 12)


def test_proj_supports_iau_mars_crs():
    assert _major_minor(pyproj.proj_version_str) >= (9, 0)

    crs = pyproj.CRS.from_user_input("IAU_2015:49900")

    assert "Mars" in crs.name
    assert crs.ellipsoid.semi_major_metre == 3396190.0
    assert "Mars" in RasterioCRS.from_user_input("IAU_2015:49900").to_wkt()


def test_rasterio_and_pyproj_have_supported_proj_versions():
    assert _major_minor(rasterio.__proj_version__) >= (9, 0)
    assert _major_minor(pyproj.proj_version_str) >= (9, 0)


def test_gdal_has_required_drivers():
    with rasterio.Env() as env:
        drivers = env.drivers()

    assert "PDS" in drivers, "GDAL PDS driver is required to read MOLA MEGDR labels"
    assert "SRTMHGT" in drivers, "GDAL SRTMHGT driver is required to read SRTMGL1 tiles"
    assert "GTiff" in drivers


def test_mola_sphere_differs_from_iau_2015():
    """MOLA MEGDR labels use R = 3396.0 km; IAU 2015 uses 3396.19 km (docs/science/datasets.md)."""

    mola_radius_m = 3_396_000.0
    iau = pyproj.CRS.from_user_input("IAU_2015:49900").ellipsoid.semi_major_metre

    assert iau - mola_radius_m == 190.0
