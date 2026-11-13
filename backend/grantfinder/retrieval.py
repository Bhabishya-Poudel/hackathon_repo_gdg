"""Embed grant records and retrieve matches for a query.

Only open/forecasted grants are embedded (closed ones are ~85% of rows and are not
what a user can apply to today). Vectors live in SQLite; cosine search is numpy,
which is instant at this scale (~1.5k vectors).
"""
from __future__ import annotations

import json
import re
import sqlite3
import time
from datetime import datetime, timezone

import numpy as np

from .llm import EMBED_MODEL, get_embeddings
from .models import Grant

MODEL = EMBED_MODEL
BATCH = 200
PAUSE = 0


def _grant_from_row(r: sqlite3.Row) -> Grant:
    return Grant(source=r["source"], external_id=r["external_id"], title=r["title"], url=r["url"],
                 funder=r["funder"], description=r["description"][:1500], amount_min=r["amount_min"],
                 amount_max=r["amount_max"], deadline=r["deadline"], status=r["status"],
                 eligibility=r["eligibility"][:500], categories=json.loads(r["categories"]),
                 states=json.loads(r["states"]))


def index_grants(conn: sqlite3.Connection, embeddings=None) -> dict[str, int]:
    """Embed grants that are new or changed since their vector was built."""
    embeddings = embeddings or get_embeddings()
    todo = conn.execute(
        """SELECT g.* FROM grants g LEFT JOIN embeddings e ON e.grant_id = g.id
           WHERE g.status != 'closed' AND (e.grant_id IS NULL OR e.content_hash != g.content_hash OR e.model != ?)""",
        (MODEL,)).fetchall()
    for i in range(0, len(todo), BATCH):
        chunk = todo[i:i + BATCH]
        texts = [_grant_from_row(r).search_text for r in chunk]
        for attempt in range(5):
            try:
                vecs = embeddings.embed_documents(texts)
                break
            except Exception as e:  # rate limit: wait and retry; give up after 5 tries
                if "RESOURCE_EXHAUSTED" not in str(e) or attempt == 4:
                    raise
                time.sleep(45)
        conn.executemany(
            "INSERT OR REPLACE INTO embeddings (grant_id, content_hash, model, vector) VALUES (?,?,?,?)",
            [(r["id"], r["content_hash"], MODEL, np.asarray(v, dtype=np.float32).tobytes())
             for r, v in zip(chunk, vecs)])
        conn.commit()
        print(f"  embedded {min(i + BATCH, len(todo))}/{len(todo)}", flush=True)
        if i + BATCH < len(todo):
            time.sleep(PAUSE)
    return {"embedded": len(todo)}


def search(conn: sqlite3.Connection, query: str, k: int = 5, embeddings=None,
           state: str | None = None) -> list[tuple[float, sqlite3.Row]]:
    """Top-k open grants by cosine similarity. `state` keeps nationwide + that state."""
    today = datetime.now(timezone.utc).date().isoformat()
    rows = conn.execute(
        """SELECT g.*, e.vector FROM grants g JOIN embeddings e ON e.grant_id = g.id
           WHERE g.status != 'closed' AND (g.deadline IS NULL OR g.deadline >= ?)""", (today,)).fetchall()
    if state:
        rows = [r for r in rows if not json.loads(r["states"]) or state in json.loads(r["states"])]
    if not rows:
        return []
    q = np.asarray((embeddings or get_embeddings()).embed_query(query), dtype=np.float32)
    m = np.vstack([np.frombuffer(r["vector"], dtype=np.float32) for r in rows])
    sims = (m @ q) / (np.linalg.norm(m, axis=1) * np.linalg.norm(q) + 1e-9)
    top = np.argsort(-sims)[:k]
    return [(float(sims[i]), rows[i]) for i in top]


# Words that say nothing about WHAT the user needs; they appear in almost every grant.
_GENERIC = {"a", "an", "and", "or", "the", "of", "for", "to", "in", "on", "with", "my", "our", "i",
            "grant", "grants", "fund", "funding", "money", "business", "businesses", "small", "company",
            "owner", "new", "startup", "start", "program", "support", "need", "needs", "help", "owned", "led",
            "open", "build", "expand", "based", "run", "sell", "get", "buy", "more", "some", "any", "very",
            "really", "want", "like", "going", "looking", "starting", "started", "make", "making",
            "have", "has", "that", "this", "from", "about", "out", "can", "all", "too", "just", "own",
            "person", "people", "pay", "operation", "management", "service", "work", "working"}


# Different spellings of the same group; the grant text and the user rarely use the same one.
_SYNONYMS = {"woman": "women", "womens": "women", "latina": "latino", "latinx": "latino", "latine": "latino",
             "hispanic": "latino", "aapi": "asian", "indigenous": "native", "disabled": "disability"}


def _stem(w: str) -> str:
    """Crude singulariser/stemmer: flowers->flower, nurseries->nursery, licensing/license->licens."""
    w = _SYNONYMS.get(w, w)
    if w.endswith("ies") and len(w) > 4:
        w = w[:-3] + "y"
    elif w.endswith("s") and not w.endswith("ss") and len(w) > 3:
        w = w[:-1]
    if w.endswith("ing") and len(w) > 5:
        w = w[:-3]
    elif w.endswith("er") and len(w) > 5:  # plumber/plumbing -> plumb, teacher/teaching -> teach
        w = w[:-2]
    elif w.endswith("e") and len(w) > 4:
        w = w[:-1]
    return _SYNONYMS.get(w, w)


def terms(*texts: str) -> set[str]:
    """Specific content words (lowercase, singularised, generic words removed)."""
    words = re.findall(r"[a-z]+", " ".join(texts).lower())
    return {_stem(w) for w in words if w not in _GENERIC and len(w) > 2}


# Bulk federal grants say who may apply in free text. Keep ones open to businesses, individuals or
# community groups; drop government/university-only and "Others." ones. Hand-written seed and listing grants always stay.
_ELIGIBLE = re.compile(r"business|individual|for[- ]?profit|non-?profit|unrestricted|anyone|organization", re.I)


def eligible_for_public(r: sqlite3.Row) -> bool:
    return r["source"] in ("seed", "listing") or bool(_ELIGIBLE.search(r["eligibility"] or ""))


def hybrid_search(conn: sqlite3.Connection, query: str, want: set[str], k: int = 3, pool: int = 40,
                  weight: float = 0.4, local_bonus: float = 0.03, embeddings=None, state: str | None = None,
                  extra: set[str] = frozenset()
                  ) -> list[tuple[float, float, sqlite3.Row]]:
    """Embedding search re-ranked by keyword overlap. Returns (score, overlap, row), best first.

    `want` = specific words the USER said. A grant must share at least one,
    because bge-small scores everything in a narrow 0.6-0.8 band, so cosine alone cannot
    tell a real match from junk. overlap saturates at 2 shared words (1 if the user gave only one):
    the model's paraphrase adds extra words ("florist", "retail") that must not dilute a real hit.
    `extra` = the model's own category words: a small bonus only, never enough to open the gate.
    """
    out = []
    for cos, r in search(conn, query, pool, embeddings, state):
        have = terms(r["title"], r["description"], r["eligibility"], " ".join(json.loads(r["categories"])))
        if not eligible_for_public(r):
            continue
        shared = len(want & have)
        overlap = min(1.0, shared / min(2, len(want))) if want else 0.0
        if overlap > 0:
            # Tie-breakers, small on purpose: more shared words beats fewer (the cap above hides that),
            # and a grant listing the user's own state edges out a nationwide one.
            local = local_bonus if state and state in json.loads(r["states"]) else 0.0
            bonus = 0.03 * min(shared, 6) + 0.02 * min(len(extra & have), 3)
            out.append((cos + weight * overlap + bonus + local, overlap, r))
    out.sort(key=lambda t: -t[0])
    return out[:k]
