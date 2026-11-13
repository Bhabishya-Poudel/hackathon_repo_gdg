"""Ingest from the public Grants.gov API (no API key needed).

search2        -> list of hits for a keyword (id, title, agency, dates)
fetchOpportunity -> full detail for one hit (description, award amounts, eligibility)
"""
from __future__ import annotations

import html
import re
import time
from datetime import datetime

import httpx

from ..config import GRANTS_GOV_QUERIES
from ..models import Grant

BASE = "https://api.grants.gov/v1/api"
PAGE_SIZE = 25


def _strip_html(text: str | None) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def _to_int(value) -> int | None:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _iso_date(value: str | None) -> str | None:
    """Grants.gov uses 'MM/DD/YYYY' in search hits and 'Oct 31, 2026 12:00:00 AM EDT' in detail."""
    if not value:
        return None
    value = value.strip()
    for fmt, size in (("%m/%d/%Y", None), ("%b %d, %Y", 12)):
        try:
            return datetime.strptime(value[:size] if size else value, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def parse_opportunity(hit: dict, detail: dict) -> Grant:
    """Pure function (no network) so it is easy to unit test."""
    syn = detail.get("synopsis") or {}
    top = (detail.get("topAgencyDetails") or {}).get("agencyName") or hit.get("agency", "")
    applicants = ", ".join(sorted(a.get("description", "") for a in syn.get("applicantTypes") or []))  # API order is nondeterministic
    eligibility = _strip_html(syn.get("applicantEligibilityDesc"))
    if applicants:
        eligibility = f"Eligible applicants: {applicants}. {eligibility}".strip()
    categories = [c.get("description", "") for c in syn.get("fundingActivityCategories") or []]
    status = "forecasted" if hit.get("oppStatus") == "forecasted" else (
        "closed" if hit.get("oppStatus") in ("closed", "archived") else "open")
    return Grant(
        source="grants.gov",
        external_id=str(hit["id"]),
        title=_strip_html(hit.get("title")),
        url=f"https://www.grants.gov/search-results-detail/{hit['id']}",
        funder=_strip_html(top),
        description=_strip_html(syn.get("synopsisDesc")),
        amount_min=_to_int(syn.get("awardFloor")),
        amount_max=_to_int(syn.get("awardCeiling")),
        deadline=_iso_date(syn.get("responseDate")) or _iso_date(hit.get("closeDate")),
        status=status,
        eligibility=eligibility,
        categories=[c for c in categories if c],
        raw={"opportunityNumber": hit.get("number"), "agencyCode": hit.get("agencyCode")},
    )


def fetch_grants(queries: list[str] | None = None, per_query: int = 25,
                 delay: float = 0.3, client: httpx.Client | None = None) -> list[Grant]:
    queries = queries or GRANTS_GOV_QUERIES
    own = client is None
    client = client or httpx.Client(timeout=30)
    seen: dict[str, Grant] = {}
    try:
        for q in queries:
            fetched = 0
            while fetched < per_query:
                r = client.post(f"{BASE}/search2", json={
                    "keyword": q, "oppStatuses": "forecasted|posted",
                    "rows": min(PAGE_SIZE, per_query - fetched), "startRecordNum": fetched})
                r.raise_for_status()
                hits = r.json().get("data", {}).get("oppHits", [])
                if not hits:
                    break
                for hit in hits:
                    if str(hit["id"]) in seen:
                        continue
                    try:
                        d = client.post(f"{BASE}/fetchOpportunity",
                                        json={"opportunityId": int(hit["id"])})
                        d.raise_for_status()
                        seen[str(hit["id"])] = parse_opportunity(hit, d.json().get("data", {}))
                    except (httpx.HTTPError, ValueError) as e:
                        print(f"  skip {hit['id']}: {e}")  # one bad record must not kill the run
                    time.sleep(delay)
                fetched += len(hits)
            print(f"  '{q}': {len(seen)} unique so far")
    finally:
        if own:
            client.close()
    return list(seen.values())
