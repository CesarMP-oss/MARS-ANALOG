import pytest

from mars_analog.limitations import LIMITATIONS
from mars_analog.schemas import ACI_DISCLAIMER

ENDPOINTS = [
    "/api/v1/health",
    "/api/v1/limitations",
    "/api/v1/datasets",
    "/api/v1/datasets/synthetic_dem",
    "/api/v1/regions",
    "/api/v1/regions?body=mars",
    "/api/v1/regions/synthetic_reference",
    "/api/v1/regions/synthetic_candidate_a/metrics",
    "/api/v1/regions/synthetic_candidate_b/metrics",
    "/api/v1/comparisons?reference=synthetic_reference",
    "/api/v1/comparisons/synthetic_reference/synthetic_candidate_a",
    "/api/v1/comparisons/synthetic_reference/synthetic_candidate_b",
    "/api/v1/provenance/prov_00000000000000aa",
]


@pytest.mark.parametrize("path", ENDPOINTS)
def test_every_success_response_uses_the_envelope(synthetic_client, path):
    response = synthetic_client.get(path)
    assert response.status_code == 200, response.text
    body = response.json()
    assert set(body) == {"api_version", "data", "meta", "limitations", "provenance_ids"}
    assert body["api_version"] == "1.0"
    assert body["limitations"][0]["code"] == "TOPOGRAPHY_ONLY"
    assert all(item["code"] in LIMITATIONS for item in body["limitations"])
    assert body["meta"]["is_synthetic"] is True
    assert body["meta"]["run_id"] == "synthetic-run-0001"


def test_api_is_read_only(synthetic_client):
    paths = synthetic_client.app.openapi()["paths"]
    methods = {method for operations in paths.values() for method in operations}
    assert methods == {"get"}
    response = synthetic_client.post("/api/v1/regions")
    assert response.status_code == 405
    assert response.json()["error"]["code"] == "method_not_allowed"


def test_health_reports_geospatial_versions(synthetic_client):
    data = synthetic_client.get("/api/v1/health").json()["data"]
    assert data["status"] == "ok"
    assert data["gdal"] and data["proj_rasterio"] and data["proj_pyproj"]


def test_limitations_catalog_is_complete(synthetic_client):
    codes = {item["code"] for item in synthetic_client.get("/api/v1/limitations").json()["data"]}
    assert codes == set(LIMITATIONS)


def test_region_is_geojson_feature_with_body_crs(synthetic_client):
    mars = synthetic_client.get("/api/v1/regions?body=mars").json()["data"]
    assert [r["id"] for r in mars] == ["synthetic_reference"]
    assert mars[0]["type"] == "Feature"
    assert mars[0]["properties"]["crs"] == "IAU_2015:49900"


def test_metrics_status_semantics(synthetic_client):
    body = synthetic_client.get("/api/v1/regions/synthetic_candidate_a/metrics").json()
    metrics = {m["metric"]: m for m in body["data"]["metrics"]}
    assert metrics["slope"]["status"] == "ok"
    assert metrics["tri_riley"]["status"] == "insufficient_data"
    assert metrics["tri_riley"]["summary"]["median"] is None
    assert metrics["local_relief"]["status"] == "below_noise_floor"
    assert "DEM_NOISE_FLAT_TERRAIN" in metrics["local_relief"]["flags"]
    assert body["provenance_ids"] == ["prov_00000000000000aa"]
    codes = {item["code"] for item in body["limitations"]}
    assert {"SRTM_VOID_FILL", "DEM_NOISE_FLAT_TERRAIN", "SCALE_DEPENDENCE"} <= codes


def test_missing_results_are_not_computed_never_filled(synthetic_client):
    body = synthetic_client.get("/api/v1/regions/synthetic_candidate_b/metrics").json()
    for item in body["data"]["metrics"]:
        assert item["status"] == "not_computed"
        assert all(value is None for value in item["summary"].values())
        assert item["histogram"]["counts"] == []
    aci = synthetic_client.get(
        "/api/v1/comparisons/synthetic_reference/synthetic_candidate_b"
    ).json()["data"]
    assert aci["status"] == "not_computed"
    assert aci["score"] is None
    assert aci["components"] == []


def test_aci_responses_always_carry_disclaimer(synthetic_client):
    body = synthetic_client.get("/api/v1/comparisons?reference=synthetic_reference").json()
    assert len(body["data"]) == 1
    result = body["data"][0]
    assert result["disclaimer"] == ACI_DISCLAIMER
    assert result["interpretation"] == "topographic_similarity_only"
    assert {"ACI_EXPERIMENTAL", "TOPOGRAPHY_ONLY"} <= {i["code"] for i in body["limitations"]}
    assert [c["metric"] for c in result["components"]] == ["slope", "local_relief", "tri_riley"]


@pytest.mark.parametrize(
    ("path", "status", "code"),
    [
        ("/api/v1/regions/unknown", 404, "region_not_found"),
        ("/api/v1/regions/unknown/metrics", 404, "region_not_found"),
        ("/api/v1/datasets/unknown", 404, "dataset_not_found"),
        ("/api/v1/provenance/prov_ffffffff", 404, "provenance_not_found"),
        ("/api/v1/comparisons?reference=synthetic_candidate_a", 400, "not_a_reference_region"),
        (
            "/api/v1/comparisons/synthetic_reference/synthetic_reference",
            400,
            "not_a_candidate_region",
        ),
        ("/api/v1/regions?body=moon", 422, "invalid_request"),
        ("/api/v1/regions/synthetic_candidate_a/metrics?scale_m=30", 404, "scale_not_available"),
        ("/api/v1/provenance/prov%20x", 400, "invalid_identifier"),
        ("/api/v1/does-not-exist", 404, "not_found"),
    ],
)
def test_errors_use_the_error_format(synthetic_client, path, status, code):
    response = synthetic_client.get(path)
    assert response.status_code == status, response.text
    body = response.json()
    assert set(body) == {"error"}
    assert body["error"]["code"] == code


def test_synthetic_data_is_invisible_with_production_settings(production_view_of_synthetic):
    client = production_view_of_synthetic
    assert client.get("/api/v1/regions").json()["data"] == []
    health = client.get("/api/v1/health").json()
    assert health["data"]["results_run_id"] is None
    assert health["meta"]["is_synthetic"] is False
    assert client.get("/api/v1/provenance/prov_00000000000000aa").status_code == 404


def test_repository_data_serves_no_results_yet(repo_client):
    assert repo_client.get("/api/v1/health").json()["data"]["results_run_id"] is None
    assert repo_client.get("/api/v1/regions").json()["data"] == []
