"""Runtime settings read from environment variables."""

from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _env_path(name: str, default: Path) -> Path:
    value = os.environ.get(name)
    return Path(value).expanduser().resolve() if value else default


def _env_list(name: str) -> list[str]:
    return [item.strip() for item in os.environ.get(name, "").split(",") if item.strip()]


def _git_commit() -> str | None:
    if value := os.environ.get("MARS_ANALOG_GIT_COMMIT"):
        return value
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=5,
            check=True,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    return result.stdout.strip() or None


@dataclass(frozen=True)
class Settings:
    data_dir: Path = REPO_ROOT / "data"
    results_dir: Path = REPO_ROOT / "data" / "results"
    cors_origins: list[str] = field(default_factory=list)
    allow_synthetic: bool = False
    git_commit: str | None = None

    @property
    def manifest_path(self) -> Path:
        return self.data_dir / "manifest.yaml"

    @property
    def aoi_dir(self) -> Path:
        return self.data_dir / "aoi"

    @classmethod
    def from_env(cls) -> Settings:
        data_dir = _env_path("MARS_ANALOG_DATA_DIR", REPO_ROOT / "data")
        return cls(
            data_dir=data_dir,
            results_dir=_env_path("MARS_ANALOG_RESULTS_DIR", data_dir / "results"),
            cors_origins=_env_list("MARS_ANALOG_CORS_ORIGINS"),
            git_commit=_git_commit(),
        )


@lru_cache
def get_settings() -> Settings:
    return Settings.from_env()
