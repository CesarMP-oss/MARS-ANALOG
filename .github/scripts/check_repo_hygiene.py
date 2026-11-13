"""Fail if large files or raw geospatial data are tracked by git (data never goes in the repo)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

MAX_BYTES = 5 * 1024 * 1024
DATA_SUFFIXES = {".hgt", ".img", ".tif", ".tiff", ".zip", ".num", ".nc", ".dat", ".cub"}
ALLOWED_PREFIX = "backend/tests/fixtures/"


def main() -> int:
    files = subprocess.run(
        ["git", "ls-files", "-z"], capture_output=True, text=True, check=True
    ).stdout.split("\0")
    problems = []
    for name in filter(None, files):
        path = Path(name)
        if not path.is_file():
            continue
        size = path.stat().st_size
        if size > MAX_BYTES:
            problems.append(f"{name}: {size / 1e6:.1f} MB exceeds {MAX_BYTES / 1e6:.0f} MB")
        if path.suffix.lower() in DATA_SUFFIXES and not name.startswith(ALLOWED_PREFIX):
            problems.append(f"{name}: raw data file outside {ALLOWED_PREFIX}")
        if path.name in {".env", ".netrc", "_netrc"}:
            problems.append(f"{name}: credentials/environment file must not be committed")
    for problem in problems:
        print(f"::error::{problem}")
    print(f"Checked {len(files) - 1} tracked files; {len(problems)} problem(s).")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
