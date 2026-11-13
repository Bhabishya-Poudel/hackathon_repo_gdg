from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from .config import DB_PATH
from .models import Grant

SCHEMA = """
CREATE TABLE IF NOT EXISTS grants (
    id           TEXT PRIMARY KEY,           -- "<source>:<external_id>"
    source       TEXT NOT NULL,
    external_id  TEXT NOT NULL,
    title        TEXT NOT NULL,
    funder       TEXT NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    amount_min   INTEGER,
    amount_max   INTEGER,
    deadline     TEXT,
    status       TEXT NOT NULL DEFAULT 'open',
    eligibility  TEXT NOT NULL DEFAULT '',
    categories   TEXT NOT NULL DEFAULT '[]', -- JSON list
    states       TEXT NOT NULL DEFAULT '[]', -- JSON list, [] = nationwide
    url          TEXT NOT NULL,
    raw          TEXT NOT NULL DEFAULT '{}',
    content_hash TEXT NOT NULL,
    first_seen   TEXT NOT NULL,              -- when WE first ingested it
    updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(status);
CREATE INDEX IF NOT EXISTS idx_grants_first_seen ON grants(first_seen);

-- Vector index, kept in sync with grants by content_hash.
CREATE TABLE IF NOT EXISTS embeddings (
    grant_id     TEXT PRIMARY KEY REFERENCES grants(id) ON DELETE CASCADE,
    content_hash TEXT NOT NULL,              -- grant hash this vector was built from
    model        TEXT NOT NULL,
    vector       BLOB NOT NULL               -- float32 array
);

-- Subscriptions recorded for requests without a matching grant.
CREATE TABLE IF NOT EXISTS subscriptions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    contact     TEXT NOT NULL,               -- phone number or chat session id
    query_text  TEXT NOT NULL,               -- original message
    extracted   TEXT NOT NULL DEFAULT '{}',  -- JSON from the extraction step
    created_at  TEXT NOT NULL,
    notified_at TEXT                         -- NULL until we've notified them
);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def connect(path: Path | str = DB_PATH) -> sqlite3.Connection:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def upsert_grants(conn: sqlite3.Connection, grants: list[Grant]) -> dict[str, int]:
    """Insert new grants, update changed ones, skip identical ones."""
    stats = {"new": 0, "updated": 0, "unchanged": 0}
    ts = now()
    for g in grants:
        row = conn.execute("SELECT content_hash FROM grants WHERE id = ?", (g.id,)).fetchone()
        values = (g.title, g.funder, g.description, g.amount_min, g.amount_max,
                  g.deadline, g.status, g.eligibility, json.dumps(g.categories),
                  json.dumps(g.states), g.url, json.dumps(g.raw), g.content_hash, ts)
        if row is None:
            conn.execute(
                """INSERT INTO grants (title, funder, description, amount_min, amount_max,
                   deadline, status, eligibility, categories, states, url, raw,
                   content_hash, updated_at, id, source, external_id, first_seen)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                values + (g.id, g.source, g.external_id, ts))
            stats["new"] += 1
        elif row["content_hash"] != g.content_hash:
            conn.execute(
                """UPDATE grants SET title=?, funder=?, description=?, amount_min=?,
                   amount_max=?, deadline=?, status=?, eligibility=?, categories=?,
                   states=?, url=?, raw=?, content_hash=?, updated_at=? WHERE id=?""",
                values + (g.id,))
            stats["updated"] += 1
        else:
            stats["unchanged"] += 1
    conn.commit()
    return stats


def open_grants(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    """Grants worth showing a user: not closed, deadline not already past."""
    today = datetime.now(timezone.utc).date().isoformat()
    return conn.execute(
        "SELECT * FROM grants WHERE status != 'closed' AND (deadline IS NULL OR deadline >= ?)",
        (today,)).fetchall()
