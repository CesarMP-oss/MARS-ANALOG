import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from mars_analog.api.main import create_app
from mars_analog.settings import REPO_ROOT, Settings

SYNTHETIC = Path(__file__).parent / "fixtures" / "synthetic"


def make_client(data_dir: Path, results_dir: Path, allow_synthetic: bool) -> TestClient:
    settings = Settings(
        data_dir=data_dir,
        results_dir=results_dir,
        allow_synthetic=allow_synthetic,
        git_commit="test",
    )
    return TestClient(create_app(settings))


@pytest.fixture
def synthetic_client() -> TestClient:
    """API backed by clearly-labelled synthetic fixtures (tests only)."""
    return make_client(SYNTHETIC / "data", SYNTHETIC / "results", allow_synthetic=True)


@pytest.fixture
def production_view_of_synthetic() -> TestClient:
    """Same fixtures, but with production settings: synthetic records must be invisible."""
    return make_client(SYNTHETIC / "data", SYNTHETIC / "results", allow_synthetic=False)


@pytest.fixture
def synthetic_copy_client(tmp_path: Path):
    """Factory: copy synthetic results, apply ``edit(results_dir)``, serve in production mode."""

    def factory(edit) -> TestClient:
        results = tmp_path / "results"
        shutil.copytree(SYNTHETIC / "results", results)
        edit(results)
        return make_client(SYNTHETIC / "data", results, allow_synthetic=False)

    return factory


@pytest.fixture
def repo_client(tmp_path: Path) -> TestClient:
    """API over the real repository data directory with an empty results directory."""
    return make_client(REPO_ROOT / "data", tmp_path / "results", allow_synthetic=False)
