"""Load hand-curated grants: data/seed_grants.json (verified or sample) and data/listed_grants.json
(unverified third-party listings, stored with source "listing")."""
from __future__ import annotations

import json
from pathlib import Path

from ..config import DATA_DIR
from ..models import Grant

SEED_PATH = DATA_DIR / "seed_grants.json"
LISTED_PATH = DATA_DIR / "listed_grants.json"


def _load(path: Path, source: str) -> list[Grant]:
    if not path.exists():
        return []
    return [Grant(source=source, **item) for item in json.loads(path.read_text())]


def load_seed(path: Path = SEED_PATH, listed_path: Path = LISTED_PATH) -> list[Grant]:
    return _load(path, "seed") + _load(listed_path, "listing")
