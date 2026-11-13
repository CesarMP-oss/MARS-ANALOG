"""Pydantic models for the MARS-ANALOG API contract v1 (see docs/api/contract.md)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Body = Literal["earth", "mars"]
Severity = Literal["info", "warning", "critical"]
MetricStatus = Literal["ok", "insufficient_data", "not_computed", "below_noise_floor"]
AciStatus = Literal["ok", "insufficient_data", "not_computed"]
MetricName = Literal["slope", "tri_riley", "local_relief", "profile_curvature", "plan_curvature"]

# Geographic CRS expected for region coordinates on each body.
BODY_CRS: dict[str, str] = {"earth": "EPSG:4326", "mars": "IAU_2015:49900"}

ACI_DISCLAIMER = (
    "Experimental topographic similarity. Not a measure of habitability or complete "
    "planetary-analog suitability."
)


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


# --- Envelope -----------------------------------------------------------------------------


class Limitation(StrictModel):
    code: str
    severity: Severity
    title: str
    message: str


class Meta(StrictModel):
    generated_at: datetime
    run_id: str | None = None
    software_version: str
    git_commit: str | None = None
    is_synthetic: bool = False


class Envelope[T](StrictModel):
    api_version: str
    data: T
    meta: Meta
    limitations: list[Limitation]
    provenance_ids: list[str] = Field(default_factory=list)


class ErrorDetail(StrictModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(StrictModel):
    error: ErrorDetail


# --- Health -------------------------------------------------------------------------------


class Health(StrictModel):
    status: Literal["ok"]
    api_version: str
    software_version: str
    git_commit: str | None
    python: str
    gdal: str
    proj_rasterio: str
    proj_pyproj: str
    results_run_id: str | None


# --- Datasets -----------------------------------------------------------------------------


class DatasetFile(StrictModel):
    name: str
    role: str
    bytes: int | None = None
    sha256: str | None = Field(default=None, pattern=r"^[0-9a-f]{64}$")
    url: str | None = None


class Dataset(StrictModel):
    id: str
    body: Body
    name: str
    product_id: str
    product_version: str | None = None
    doi: str | None = None
    source_url: str
    documentation_urls: list[str] = Field(default_factory=list)
    nominal_resolution_m: float = Field(gt=0)
    horizontal_reference: str
    vertical_reference: str
    citation: str
    known_limitations: list[str] = Field(default_factory=list)
    files: list[DatasetFile] = Field(default_factory=list)
    is_synthetic: bool = False


class DatasetManifest(StrictModel):
    manifest_version: str
    datasets: list[Dataset]


# --- Regions (GeoJSON Feature, coordinates in degrees on the stated body) -----------------


class Geometry(StrictModel):
    type: Literal["Polygon", "MultiPolygon"]
    coordinates: list[Any]

    def iter_positions(self) -> list[list[float]]:
        polygons = [self.coordinates] if self.type == "Polygon" else self.coordinates
        return [pos for polygon in polygons for ring in polygon for pos in ring]

    @model_validator(mode="after")
    def _check_positions(self) -> Geometry:
        positions = self.iter_positions()
        if not positions:
            raise ValueError("geometry has no positions")
        for pos in positions:
            if len(pos) != 2:
                raise ValueError("positions must be [longitude, latitude]")
            lon, lat = pos
            if not (-180.0 <= lon <= 180.0 and -90.0 <= lat <= 90.0):
                raise ValueError(f"position {pos} outside lon [-180, 180] / lat [-90, 90]")
        return self


class RegionProperties(StrictModel):
    name: str
    body: Body
    crs: str
    role: Literal["reference", "candidate"]
    dataset_id: str
    aoi_version: str
    boundary_source: str
    rationale: str
    area_km2: float | None = Field(default=None, gt=0)
    is_synthetic: bool = False

    @model_validator(mode="after")
    def _crs_matches_body(self) -> RegionProperties:
        expected = BODY_CRS[self.body]
        if self.crs != expected:
            raise ValueError(f"{self.body} regions must use crs {expected!r}, got {self.crs!r}")
        return self


class Region(StrictModel):
    type: Literal["Feature"]
    id: str
    geometry: Geometry
    properties: RegionProperties


# --- Metrics ------------------------------------------------------------------------------


class SourceQuality(StrictModel):
    earth_filled_fraction: float | None = Field(default=None, ge=0, le=1)
    mars_interpolated_fraction: float | None = Field(default=None, ge=0, le=1)


class NoiseFloor(StrictModel):
    value: float | None = None
    unit: str | None = None
    method: str | None = None
    signal_above_noise: bool | None = None


class DistributionSummary(StrictModel):
    p05: float | None = None
    p25: float | None = None
    median: float | None = None
    p75: float | None = None
    p95: float | None = None
    mean: float | None = None
    std: float | None = None
    iqr: float | None = None

    def is_empty(self) -> bool:
        return all(value is None for value in self.model_dump().values())

    def is_complete(self) -> bool:
        return all(value is not None for value in self.model_dump().values())


class Histogram(StrictModel):
    bin_edges: list[float] = Field(default_factory=list)
    counts: list[int] = Field(default_factory=list)

    @model_validator(mode="after")
    def _consistent(self) -> Histogram:
        if self.counts and len(self.bin_edges) != len(self.counts) + 1:
            raise ValueError("bin_edges must have len(counts) + 1 entries")
        if not self.counts and self.bin_edges:
            raise ValueError("bin_edges given without counts")
        return self


class MetricSummary(StrictModel):
    region_id: str
    metric: MetricName
    unit: str
    method: str | None = None
    parameters: dict[str, Any] = Field(default_factory=dict)
    scale_m: float | None = Field(default=None, gt=0)
    status: MetricStatus
    n_valid: int | None = Field(default=None, ge=0)
    valid_fraction: float | None = Field(default=None, ge=0, le=1)
    source_quality: SourceQuality = Field(default_factory=SourceQuality)
    noise_floor: NoiseFloor = Field(default_factory=NoiseFloor)
    summary: DistributionSummary = Field(default_factory=DistributionSummary)
    histogram: Histogram = Field(default_factory=Histogram)
    flags: list[str] = Field(default_factory=list)
    provenance_id: str | None = None

    @model_validator(mode="after")
    def _values_match_status(self) -> MetricSummary:
        has_values = not self.summary.is_empty() or bool(self.histogram.counts)
        if self.status in ("not_computed", "insufficient_data"):
            if has_values:
                raise ValueError(f"status {self.status!r} must not carry metric values")
        else:
            if not self.summary.is_complete():
                raise ValueError(f"status {self.status!r} requires a complete summary")
            if self.provenance_id is None:
                raise ValueError("computed metrics require a provenance_id")
        if self.status == "below_noise_floor" and "DEM_NOISE_FLAT_TERRAIN" not in self.flags:
            raise ValueError("below_noise_floor requires the DEM_NOISE_FLAT_TERRAIN flag")
        return self


class RegionMetrics(StrictModel):
    region_id: str
    scale_m: float | None = None
    metrics: list[MetricSummary]


# --- ACI ----------------------------------------------------------------------------------


class ScoreInterval(StrictModel):
    low: float | None = Field(default=None, ge=0, le=1)
    high: float | None = Field(default=None, ge=0, le=1)
    level: float = Field(default=0.9, gt=0, lt=1)
    method: str = "spatial_block_bootstrap"


class AciComponent(StrictModel):
    metric: MetricName
    unit: str
    distance: float | None = Field(default=None, ge=0)
    normalized_distance: float | None = Field(default=None, ge=0)
    similarity: float | None = Field(default=None, ge=0, le=1)
    weight: float = Field(ge=0, le=1)
    included: bool = True
    exclusion_reason: str | None = None


class AciResult(StrictModel):
    aci_version: str
    reference_region_id: str
    candidate_region_id: str
    scale_m: float | None = Field(default=None, gt=0)
    status: AciStatus
    interpretation: Literal["topographic_similarity_only"] = "topographic_similarity_only"
    score: float | None = Field(default=None, ge=0, le=1)
    score_interval: ScoreInterval = Field(default_factory=ScoreInterval)
    weights_scheme: str = "equal"
    components: list[AciComponent] = Field(default_factory=list)
    disclaimer: Literal[ACI_DISCLAIMER] = ACI_DISCLAIMER  # type: ignore[valid-type]
    limitations: list[str] = Field(default_factory=list)
    provenance_id: str | None = None

    @model_validator(mode="after")
    def _values_match_status(self) -> AciResult:
        component_values = [
            v
            for c in self.components
            for v in (c.distance, c.normalized_distance, c.similarity)
            if v is not None
        ]
        if self.status != "ok":
            if self.score is not None or component_values or self.score_interval.low is not None:
                raise ValueError(f"status {self.status!r} must not carry a score or components")
        else:
            if self.score is None or self.provenance_id is None:
                raise ValueError("status 'ok' requires score and provenance_id")
            included = [c for c in self.components if c.included]
            if not included or any(c.similarity is None for c in included):
                raise ValueError("status 'ok' requires similarity for every included component")
            if abs(sum(c.weight for c in included) - 1.0) > 1e-9:
                raise ValueError("weights of included components must sum to 1")
        for c in self.components:
            if not c.included and not c.exclusion_reason:
                raise ValueError(f"excluded component {c.metric!r} needs an exclusion_reason")
        return self


# --- Provenance ---------------------------------------------------------------------------


class ProvenanceFile(StrictModel):
    name: str
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    bytes: int | None = Field(default=None, ge=0)


class ProvenanceInput(StrictModel):
    dataset_id: str
    product_id: str
    product_version: str | None = None
    doi: str | None = None
    files: list[ProvenanceFile]
    accessed_at: datetime | None = None


class ProvenanceStep(StrictModel):
    name: str
    function: str
    parameters: dict[str, Any] = Field(default_factory=dict)


class ProvenanceOutput(StrictModel):
    path: str
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")


class ProvenanceSoftware(StrictModel):
    mars_analog: str
    git_commit: str | None
    git_dirty: bool
    python: str
    packages: dict[str, str] = Field(default_factory=dict)


class Provenance(StrictModel):
    provenance_id: str = Field(pattern=r"^prov_[0-9a-f]{8,64}$")
    run_id: str
    created_at: datetime
    software: ProvenanceSoftware
    inputs: list[ProvenanceInput]
    steps: list[ProvenanceStep]
    crs: dict[str, str] = Field(default_factory=dict)
    nodata_policy: Literal["propagate_never_fill"] = "propagate_never_fill"
    outputs: list[ProvenanceOutput] = Field(default_factory=list)
    is_synthetic: bool = False

    @property
    def reproducible(self) -> bool:
        return not self.software.git_dirty and self.software.git_commit is not None


class RunInfo(StrictModel):
    run_id: str
    created_at: datetime
    is_synthetic: bool = False
    pipeline_version: str
    git_commit: str | None = None
    git_dirty: bool = False
