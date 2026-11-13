import copy

import pytest
from pydantic import ValidationError

from mars_analog.schemas import ACI_DISCLAIMER, AciResult, MetricSummary, Region

SUMMARY = {k: 1.0 for k in ["p05", "p25", "median", "p75", "p95", "mean", "std", "iqr"]}


def metric(**overrides):
    base = {"region_id": "r", "metric": "slope", "unit": "degree", "status": "not_computed"}
    return {**base, **overrides}


def test_not_computed_metric_cannot_carry_values():
    with pytest.raises(ValidationError):
        MetricSummary.model_validate(metric(summary=SUMMARY))


def test_insufficient_data_metric_cannot_carry_values():
    MetricSummary.model_validate(metric(status="insufficient_data", valid_fraction=0.3))
    with pytest.raises(ValidationError):
        MetricSummary.model_validate(
            metric(status="insufficient_data", histogram={"bin_edges": [0, 1], "counts": [3]})
        )


def test_computed_metric_requires_complete_summary_and_provenance():
    with pytest.raises(ValidationError):
        MetricSummary.model_validate(metric(status="ok", summary=SUMMARY))
    with pytest.raises(ValidationError):
        MetricSummary.model_validate(
            metric(status="ok", summary={**SUMMARY, "iqr": None}, provenance_id="prov_00000000")
        )
    MetricSummary.model_validate(
        metric(status="ok", summary=SUMMARY, provenance_id="prov_00000000")
    )


def test_below_noise_floor_requires_flag():
    base = metric(status="below_noise_floor", summary=SUMMARY, provenance_id="prov_00000000")
    with pytest.raises(ValidationError):
        MetricSummary.model_validate(base)
    MetricSummary.model_validate({**base, "flags": ["DEM_NOISE_FLAT_TERRAIN"]})


def test_histogram_shape():
    with pytest.raises(ValidationError):
        MetricSummary.model_validate(
            metric(
                status="ok",
                summary=SUMMARY,
                provenance_id="prov_00000000",
                histogram={"bin_edges": [0, 1], "counts": [1, 2]},
            )
        )


def aci(**overrides):
    base = {
        "aci_version": "0.1-experimental",
        "reference_region_id": "ref",
        "candidate_region_id": "cand",
        "status": "not_computed",
    }
    return {**base, **overrides}


def test_aci_disclaimer_and_interpretation_are_fixed():
    result = AciResult.model_validate(aci())
    assert result.disclaimer == ACI_DISCLAIMER
    assert result.interpretation == "topographic_similarity_only"
    assert "habitability" in result.model_dump()["disclaimer"]
    with pytest.raises(ValidationError):
        AciResult.model_validate(aci(disclaimer="Habitability score"))
    with pytest.raises(ValidationError):
        AciResult.model_validate(aci(interpretation="analog_suitability"))


def test_aci_without_ok_status_has_no_score():
    with pytest.raises(ValidationError):
        AciResult.model_validate(aci(score=0.7))
    with pytest.raises(ValidationError):
        AciResult.model_validate(aci(status="insufficient_data", score=0.7))
    with pytest.raises(ValidationError):
        AciResult.model_validate(
            aci(components=[{"metric": "slope", "unit": "degree", "similarity": 0.5, "weight": 1}])
        )


def test_aci_ok_requires_consistent_components():
    ok = aci(
        status="ok",
        score=0.5,
        provenance_id="prov_00000000",
        components=[{"metric": "slope", "unit": "degree", "similarity": 0.5, "weight": 1.0}],
    )
    AciResult.model_validate(ok)
    bad_weights = copy.deepcopy(ok)
    bad_weights["components"][0]["weight"] = 0.5
    with pytest.raises(ValidationError):
        AciResult.model_validate(bad_weights)
    with pytest.raises(ValidationError):
        AciResult.model_validate({**ok, "score": 1.2})
    with pytest.raises(ValidationError):
        AciResult.model_validate({**ok, "provenance_id": None})


def test_excluded_component_needs_reason():
    with pytest.raises(ValidationError):
        AciResult.model_validate(
            aci(components=[{"metric": "slope", "unit": "degree", "weight": 0, "included": False}])
        )


def region(body, crs, coordinates=None):
    ring = coordinates or [[77.27, 18.01], [78.11, 18.01], [78.11, 18.81], [77.27, 18.01]]
    return {
        "type": "Feature",
        "id": "x",
        "geometry": {"type": "Polygon", "coordinates": [ring]},
        "properties": {
            "name": "x",
            "body": body,
            "crs": crs,
            "role": "reference",
            "dataset_id": "d",
            "aoi_version": "1.0.0",
            "boundary_source": "s",
            "rationale": "r",
        },
    }


def test_mars_regions_must_not_use_earth_crs():
    """Mars coordinates must never be labelled as WGS84 (Earth) coordinates."""
    Region.model_validate(region("mars", "IAU_2015:49900"))
    with pytest.raises(ValidationError):
        Region.model_validate(region("mars", "EPSG:4326"))
    with pytest.raises(ValidationError):
        Region.model_validate(region("earth", "IAU_2015:49900"))


def test_region_longitudes_use_minus_180_to_180():
    """MOLA uses 0-360 east longitudes; the API contract uses -180..180."""
    ring = [[277.0, 18.0], [278.0, 18.0], [278.0, 19.0], [277.0, 18.0]]
    with pytest.raises(ValidationError):
        Region.model_validate(region("mars", "IAU_2015:49900", ring))
