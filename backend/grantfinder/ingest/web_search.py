"""Find grants by searching the open web, then store them in the grants database.

Two Gemini calls per search query (uses LLM_API_KEY from backend/.env):
  1. SEARCH   Gemini with Google Search grounding finds currently open grant programs and
              writes up what the live pages say.
  2. EXTRACT  A second call turns that write-up into structured records (JSON schema).
Records are then cleaned in plain Python (dates, amounts, states, URLs), expired ones are
dropped, links that are clearly dead are dropped, and the rest become `Grant`s with source
"web". The id is derived from the grant's URL, so re-running updates rather than duplicates.

Run from backend/:
    python -m grantfinder.ingest.web_search                       # default queries -> database
    python -m grantfinder.ingest.web_search "grants for food trucks in Texas"
    python -m grantfinder.ingest.web_search --dry-run --json      # print only, do not store
or via the CLI:  python -m grantfinder.cli ingest --source web [--query "..."]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import date, datetime, timezone
from urllib.parse import urlparse

import httpx
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from .. import db
from ..config import WEB_SEARCH_QUERIES
from ..llm import _key, llm_models
from ..models import Grant
from ..understand import US_STATES

SOURCE = "web"

SEARCH_PROMPT = """Today is {today}. Search the web for grants (free money that does not have to be
repaid; NOT loans, NOT scholarships, NOT contests that only give prizes) matching: {query}

Find up to {limit} real grant programs that are open for applications now, have a future deadline,
or accept applications on a rolling basis. Prefer official funder pages (government, foundations,
banks, corporations) over blog posts and listing sites. Skip anything already closed.

For each program report: the program name, the funder, what it pays for, award amount range,
the application deadline (exact date, or "rolling"), who is eligible, which US states it covers
(or nationwide), and the URL of the official page where one applies or reads the guidelines.
Only report what the pages say. Write "unknown" instead of guessing."""

EXTRACT_PROMPT = """Today is {today}. Below is a research write-up about grant programs. Convert it
into structured records. One record per distinct grant program. Rules:
- Use only facts present in the write-up. Never invent a URL, amount or date.
- url: the official page for the program. Skip a program that has no http(s) URL at all.
- deadline: ISO date YYYY-MM-DD, or null if rolling or unknown. Skip programs whose deadline is before {today}.
- amount_min / amount_max: whole US dollars, null if unknown. A single "up to $X" is amount_max only.
- states: 2-letter US state codes the grant is limited to. Empty list if nationwide or unstated.
- categories: 1-4 short lowercase tags such as small-business, agriculture, arts, food, youth, environment.
- Skip loans, scholarships and prize contests.

Write-up:
{text}"""


class WebGrant(BaseModel):
    title: str
    funder: str = ""
    description: str = Field("", description="1-3 sentences: what the grant pays for")
    url: str
    amount_min: int | None = None
    amount_max: int | None = None
    deadline: str | None = None
    eligibility: str = ""
    categories: list[str] = Field(default_factory=list)
    states: list[str] = Field(default_factory=list)


class WebGrantList(BaseModel):
    grants: list[WebGrant]


# ---------------------------------------------------------------- Gemini calls

def _generate(client: genai.Client, contents: str, config: types.GenerateContentConfig):
    """Try each configured model in turn (free-tier quota is per model)."""
    last: Exception | None = None
    for model in llm_models():
        try:
            return client.models.generate_content(model=model, contents=contents, config=config)
        except Exception as e:  # quota, overload, model without grounding: try the next one
            last = e
            print(f"  model {model} failed: {str(e)[:160]}", file=sys.stderr)
    raise RuntimeError(f"all models failed: {last}")


def search_web(client: genai.Client, query: str, limit: int, today: str) -> tuple[str, list[str]]:
    """Grounded search. Returns (write-up text, source page URLs Gemini consulted)."""
    resp = _generate(
        client, SEARCH_PROMPT.format(today=today, query=query, limit=limit),
        types.GenerateContentConfig(tools=[types.Tool(google_search=types.GoogleSearch())],
                                    temperature=0.0))
    sources: list[str] = []
    meta = resp.candidates[0].grounding_metadata if resp.candidates else None
    for chunk in (meta.grounding_chunks or []) if meta else []:
        if chunk.web and chunk.web.uri:
            sources.append(chunk.web.uri)
    return resp.text or "", sources


def extract_grants(client: genai.Client, text: str, today: str) -> list[WebGrant]:
    resp = _generate(
        client, EXTRACT_PROMPT.format(today=today, text=text),
        types.GenerateContentConfig(response_mime_type="application/json",
                                    response_schema=WebGrantList, temperature=0.0))
    if isinstance(resp.parsed, WebGrantList):
        return resp.parsed.grants
    return WebGrantList.model_validate_json(resp.text or '{"grants": []}').grants


# ------------------------------------------------------------- cleaning (pure)

def _iso_date(value: str | None) -> str | None:
    try:
        return date.fromisoformat((value or "").strip()[:10]).isoformat()
    except ValueError:
        return None


def _clean_url(url: str) -> str | None:
    url = (url or "").strip()
    p = urlparse(url)
    return url if p.scheme in ("http", "https") and "." in p.netloc else None


def url_key(url: str) -> str:
    """Stable id part: host + path, ignoring scheme, www, query, fragment and trailing slash."""
    p = urlparse(url)
    norm = f"{p.netloc.lower().removeprefix('www.')}{p.path.rstrip('/').lower()}"
    return hashlib.sha1(norm.encode()).hexdigest()[:16]


def to_grant(w: WebGrant, query: str, today: str) -> Grant | None:
    """Validate one extracted record. Returns None for anything unusable or already expired."""
    url, title = _clean_url(w.url), w.title.strip()
    if not url or not title:
        return None
    deadline = _iso_date(w.deadline)
    if deadline and deadline < today:
        return None
    lo, hi = w.amount_min, w.amount_max
    lo, hi = (lo if lo and lo > 0 else None), (hi if hi and hi > 0 else None)
    if lo and hi and lo > hi:
        lo, hi = hi, lo
    states = sorted({s.strip().upper() for s in w.states if s.strip().upper() in US_STATES})
    return Grant(
        source=SOURCE, external_id=url_key(url), title=title, url=url,
        funder=w.funder.strip(), description=w.description.strip(),
        amount_min=lo, amount_max=hi, deadline=deadline, status="open",
        eligibility=w.eligibility.strip(),
        categories=sorted({c.strip().lower() for c in w.categories if c.strip()}),
        states=states, raw={"query": query, "found_at": datetime.now(timezone.utc).isoformat(timespec="seconds")})


def link_is_dead(client: httpx.Client, url: str) -> bool:
    """True only when the server says the page is gone. Timeouts and 403/429 (bot blocking) are
    not proof of a dead link, so those grants are kept."""
    try:
        r = client.get(url, follow_redirects=True)
        return r.status_code in (404, 410)
    except httpx.InvalidURL:
        return True
    except httpx.HTTPError:
        return False


# ----------------------------------------------------------------- entrypoint

def fetch_grants(queries: list[str] | None = None, per_query: int = 10,
                 verify_links: bool = True, client: genai.Client | None = None) -> list[Grant]:
    """Search the web for each query and return deduplicated, validated grants (no DB writes)."""
    queries = queries or WEB_SEARCH_QUERIES
    client = client or genai.Client(api_key=_key())
    today = date.today().isoformat()
    found: dict[str, Grant] = {}
    with httpx.Client(timeout=10, headers={"User-Agent": "Mozilla/5.0 (grant-finder link check)"}) as http:
        for q in queries:
            try:
                text, sources = search_web(client, q, per_query, today)
                if not text.strip():
                    print(f"  '{q}': empty result")
                    continue
                records = extract_grants(client, text, today)
            except Exception as e:  # one failed query must not lose the rest of the run
                print(f"  '{q}': skipped ({type(e).__name__}: {e})", file=sys.stderr)
                continue
            added = 0
            for w in records:
                g = to_grant(w, q, today)
                if g is None or g.id in found:
                    continue
                if verify_links and link_is_dead(http, g.url):
                    print(f"  dropped dead link: {g.url}")
                    continue
                g.raw["sources"] = sources[:10]
                found[g.id] = g
                added += 1
            print(f"  '{q}': {len(records)} extracted, {added} new ({len(found)} total)")
    return list(found.values())


def ingest(queries: list[str] | None = None, per_query: int = 10, verify_links: bool = True,
           store: bool = True) -> list[Grant]:
    """Search, store in the database (unless store=False) and return the grants."""
    grants = fetch_grants(queries, per_query, verify_links)
    if store:
        conn = db.connect()
        print("web:", db.upsert_grants(conn, grants))
        conn.close()
    return grants


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(description="Search the web for grants and store them in the database.")
    ap.add_argument("queries", nargs="*", help="search topics (default: WEB_SEARCH_QUERIES in config.py)")
    ap.add_argument("--per-query", type=int, default=10, help="max grants to ask for per query")
    ap.add_argument("--no-verify", action="store_true", help="skip the dead-link check")
    ap.add_argument("--dry-run", action="store_true", help="print results, do not write the database")
    ap.add_argument("--json", action="store_true", help="print full records as JSON")
    args = ap.parse_args(argv)

    grants = ingest(args.queries or None, args.per_query, not args.no_verify, store=not args.dry_run)
    if args.json:
        print(json.dumps([{**g.__dict__, "id": g.id} for g in grants], indent=2))
    else:
        for g in grants:
            amt = f"${g.amount_max:,}" if g.amount_max else "amount n/a"
            print(f"- [{g.deadline or 'rolling'}] {g.title} ({g.funder}) {amt} {g.url}")
    print(f"{len(grants)} grants found" + (" (not stored: dry run)" if args.dry_run else ""))


if __name__ == "__main__":
    main()
