"""Single source of truth for scientific limitations exposed by the API and the UI."""

from __future__ import annotations

from mars_analog.schemas import Limitation

_CATALOG: tuple[Limitation, ...] = (
    Limitation(
        code="TOPOGRAPHY_ONLY",
        severity="critical",
        title="Topographic similarity only",
        message=(
            "Results compare terrain shape derived from elevation models. They do not assess "
            "habitability, geology, mineralogy, climate, or complete planetary-analog suitability."
        ),
    ),
    Limitation(
        code="ACI_EXPERIMENTAL",
        severity="critical",
        title="ACI 0.1 is experimental",
        message=(
            "The Analog Compatibility Index is an experimental, explainable topographic "
            "similarity indicator. Inspect the per-metric differences, not only the score."
        ),
    ),
    Limitation(
        code="SCALE_DEPENDENCE",
        severity="warning",
        title="Scale dependence",
        message=(
            "Terrain metrics depend on grid spacing. Earth data are compared only after "
            "aggregation to the MOLA MEGDR grid (~463 m); finer-scale terrain is not represented."
        ),
    ),
    Limitation(
        code="MOLA_INTERPOLATED_BINS",
        severity="warning",
        title="Interpolated MOLA bins",
        message=(
            "MOLA MEGDR supplies interpolated values where no laser shot fell in a bin. Near the "
            "equator only about 55% of bins contain a shot and gaps between profiles reach 12 km "
            "(product label). Effective resolution is coarser than the 463 m grid."
        ),
    ),
    Limitation(
        code="MEGDR_GDAL_PIXEL_SCALE",
        severity="info",
        title="MEGDR georeferencing check",
        message=(
            "GDAL derives a 463.00 m pixel from the rounded MAP_SCALE label value; the exact "
            "spacing for 128 px/deg on a 3396 km sphere is 463.058 m. MARS-ANALOG builds and "
            "tests its own geotransform before clipping regions."
        ),
    ),
    Limitation(
        code="SRTM_VOID_FILL",
        severity="warning",
        title="SRTM void-filled pixels",
        message=(
            "SRTMGL1 v003 voids were filled with ASTER GDEM2, GMTED2010 or NED. Filled pixels are "
            "identified with SRTMGL1N and are not treated as SRTM measurements."
        ),
    ),
    Limitation(
        code="GMTED_SOUTH_AMERICA_SHIFT",
        severity="info",
        title="GMTED2010 offset in South America",
        message=(
            "The SRTM v3 user guide reports a georeferencing offset in GMTED2010 fill over parts "
            "of South America. Pixels filled from GMTED2010 are excluded from statistics."
        ),
    ),
    Limitation(
        code="DEM_NOISE_FLAT_TERRAIN",
        severity="warning",
        title="DEM noise on flat terrain",
        message=(
            "On very flat surfaces such as the Salar de Uyuni, slope and curvature can be "
            "dominated by elevation-model noise. Such metrics are flagged when below the noise "
            "floor."
        ),
    ),
    Limitation(
        code="DIFFERENT_VERTICAL_REFERENCES",
        severity="info",
        title="Different vertical references",
        message=(
            "SRTM heights refer to the EGM96 geoid and MOLA heights to the GMM3 areoid. Only "
            "relative, derived metrics are compared, never absolute elevations."
        ),
    ),
    Limitation(
        code="AOI_DEFINITION_DEPENDENCE",
        severity="warning",
        title="Dependence on region boundaries",
        message=(
            "Results depend on how each fixed region is delineated. Boundaries and their sources "
            "are versioned and shown with every result."
        ),
    ),
)

LIMITATIONS: dict[str, Limitation] = {item.code: item for item in _CATALOG}

GLOBAL_CODES: tuple[str, ...] = ("TOPOGRAPHY_ONLY",)


def get(codes: list[str] | tuple[str, ...]) -> list[Limitation]:
    """Return catalog entries for ``codes``, always including global limitations first."""
    ordered = list(dict.fromkeys([*GLOBAL_CODES, *codes]))
    unknown = [code for code in ordered if code not in LIMITATIONS]
    if unknown:
        raise KeyError(f"Unknown limitation codes: {unknown}")
    return [LIMITATIONS[code] for code in ordered]


def all_limitations() -> list[Limitation]:
    return list(_CATALOG)
