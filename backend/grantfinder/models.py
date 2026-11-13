from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field


@dataclass
class Grant:
    """Source-agnostic grant record. Every ingestor must produce these."""

    source: str                 # e.g. "grants.gov", "seed"
    external_id: str            # id within that source
    title: str
    url: str
    funder: str = ""
    description: str = ""
    amount_min: int | None = None
    amount_max: int | None = None
    deadline: str | None = None  # ISO date (YYYY-MM-DD); None = rolling/unknown
    status: str = "open"         # open | forecasted | closed
    eligibility: str = ""
    categories: list[str] = field(default_factory=list)
    states: list[str] = field(default_factory=list)  # empty = nationwide
    raw: dict = field(default_factory=dict)

    @property
    def id(self) -> str:
        return f"{self.source}:{self.external_id}"

    @property
    def content_hash(self) -> str:
        """Hash of the fields that matter; used to detect real updates."""
        payload = json.dumps(
            [self.title, self.funder, self.description, self.amount_min,
             self.amount_max, self.deadline, self.status, self.eligibility,
             self.categories, self.states, self.url],
            sort_keys=True,
        )
        return hashlib.sha256(payload.encode()).hexdigest()

    @property
    def search_text(self) -> str:
        """Grant text used for semantic indexing."""
        return " . ".join(p for p in [self.title, self.funder, self.description,
                                      self.eligibility, " ".join(self.categories)] if p)
