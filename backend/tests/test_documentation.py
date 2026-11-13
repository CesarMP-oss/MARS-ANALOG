"""Keeps the repository's scientific documentation and manifest consistent with the code."""

import yaml

from mars_analog.limitations import LIMITATIONS
from mars_analog.schemas import DatasetManifest
from mars_analog.settings import REPO_ROOT


def test_dataset_manifest_is_valid_and_uses_known_limitations():
    raw = yaml.safe_load((REPO_ROOT / "data" / "manifest.yaml").read_text(encoding="utf-8"))
    manifest = DatasetManifest.model_validate(raw)
    ids = {d.id for d in manifest.datasets}
    assert {"srtmgl1_v003", "srtmgl1n_v003", "mola_megdr_128"} <= ids
    for dataset in manifest.datasets:
        assert set(dataset.known_limitations) <= set(LIMITATIONS)
        for file in dataset.files:
            assert file.sha256 is None, "checksums are only recorded after verified download (H1)"


def test_every_limitation_is_documented():
    text = (REPO_ROOT / "docs" / "science" / "limitations.md").read_text(encoding="utf-8")
    missing = [code for code in LIMITATIONS if f"`{code}`" not in text]
    assert not missing


def test_repository_datasets_endpoint(repo_client):
    body = repo_client.get("/api/v1/datasets").json()
    assert {d["id"] for d in body["data"]} >= {"mola_megdr_128", "srtmgl1_v003"}
    codes = {item["code"] for item in body["limitations"]}
    assert {"MOLA_INTERPOLATED_BINS", "SRTM_VOID_FILL"} <= codes
