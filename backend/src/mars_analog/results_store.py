"""Read-only access to versioned regions, the dataset manifest and pipeline results.

Layout (see docs/api/contract.md):

    data/manifest.yaml
    data/aoi/<region_id>.geojson
    data/results/LATEST                       -> text file with the current run_id
    data/results/<run_id>/run.json
    data/results/<run_id>/regions/<region_id>/metrics.json
    data/results/<run_id>/comparisons/<reference>__<candidate>.json
    data/results/<run_id>/provenance/<provenance_id>.json

Synthetic records (``is_synthetic: true``) are ignored unless ``allow_synthetic`` is set,
which only the automated tests do.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

import yaml

from mars_analog.schemas import (
    AciResult,
    Dataset,
    DatasetManifest,
    Provenance,
    Region,
    RegionMetrics,
    RunInfo,
)
from mars_analog.settings import Settings

logger = logging.getLogger(__name__)

_SAFE_ID = re.compile(r"^[A-Za-z0-9_\-:.]+$")


class StoreError(Exception):
    """Raised when stored files are present but invalid."""


class InvalidIdentifier(ValueError):
    """Raised when an identifier could escape the results directory."""


def _read_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def _safe(identifier: str) -> str:
    if not _SAFE_ID.match(identifier) or identifier in {".", ".."}:
        raise InvalidIdentifier(f"invalid identifier: {identifier!r}")
    return identifier


class ResultsStore:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    # --- datasets and regions ---------------------------------------------------------

    def datasets(self) -> list[Dataset]:
        path = self.settings.manifest_path
        if not path.is_file():
            return []
        with path.open(encoding="utf-8") as fh:
            raw = yaml.safe_load(fh) or {}
        datasets = DatasetManifest.model_validate(raw).datasets
        if not self.settings.allow_synthetic:
            datasets = [d for d in datasets if not d.is_synthetic]
        return datasets

    def dataset(self, dataset_id: str) -> Dataset | None:
        return next((d for d in self.datasets() if d.id == dataset_id), None)

    def regions(self, body: str | None = None) -> list[Region]:
        aoi_dir = self.settings.aoi_dir
        if not aoi_dir.is_dir():
            return []
        regions = []
        for path in sorted(aoi_dir.glob("*.geojson")):
            region = Region.model_validate(_read_json(path))
            if region.properties.is_synthetic and not self.settings.allow_synthetic:
                logger.warning("Ignoring synthetic region %s", path)
                continue
            if body is None or region.properties.body == body:
                regions.append(region)
        return regions

    def region(self, region_id: str) -> Region | None:
        return next((r for r in self.regions() if r.id == region_id), None)

    # --- results ----------------------------------------------------------------------

    def run(self) -> RunInfo | None:
        latest = self.settings.results_dir / "LATEST"
        if not latest.is_file():
            return None
        run_id = _safe(latest.read_text(encoding="utf-8").strip())
        run_file = self.settings.results_dir / run_id / "run.json"
        if not run_file.is_file():
            raise StoreError(f"LATEST points to {run_id!r} but {run_file} is missing")
        info = RunInfo.model_validate(_read_json(run_file))
        if info.run_id != run_id:
            raise StoreError(f"run.json run_id {info.run_id!r} does not match LATEST {run_id!r}")
        if info.is_synthetic and not self.settings.allow_synthetic:
            logger.warning("Ignoring synthetic results run %s", run_id)
            return None
        return info

    def _run_dir(self) -> Path | None:
        info = self.run()
        return self.settings.results_dir / info.run_id if info else None

    def region_metrics(self, region_id: str) -> RegionMetrics | None:
        run_dir = self._run_dir()
        if run_dir is None:
            return None
        path = run_dir / "regions" / _safe(region_id) / "metrics.json"
        return RegionMetrics.model_validate(_read_json(path)) if path.is_file() else None

    def comparisons(self, reference_id: str) -> list[AciResult]:
        run_dir = self._run_dir()
        if run_dir is None:
            return []
        directory = run_dir / "comparisons"
        if not directory.is_dir():
            return []
        pattern = f"{_safe(reference_id)}__*.json"
        return [AciResult.model_validate(_read_json(p)) for p in sorted(directory.glob(pattern))]

    def comparison(self, reference_id: str, candidate_id: str) -> AciResult | None:
        run_dir = self._run_dir()
        if run_dir is None:
            return None
        name = f"{_safe(reference_id)}__{_safe(candidate_id)}.json"
        path = run_dir / "comparisons" / name
        return AciResult.model_validate(_read_json(path)) if path.is_file() else None

    def provenance(self, provenance_id: str) -> Provenance | None:
        run_dir = self._run_dir()
        if run_dir is None:
            return None
        path = run_dir / "provenance" / f"{_safe(provenance_id)}.json"
        if not path.is_file():
            return None
        record = Provenance.model_validate(_read_json(path))
        if record.is_synthetic and not self.settings.allow_synthetic:
            logger.warning("Ignoring synthetic provenance record %s", path)
            return None
        return record
