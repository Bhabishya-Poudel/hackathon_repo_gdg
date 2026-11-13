"""Ingest the FULL Grants.gov database from its daily XML extract (no API key).

https://www.grants.gov/xml-extract  ->  zip of one ~320MB XML file, rebuilt daily.
Stream-parsed so memory stays flat. Archived records (~73k, years old) are skipped;
open, forecasted and recently-closed ones are kept (many closed grants reopen yearly).
Uses the same "grants.gov:<OpportunityID>" ids as the keyword ingestor, so no duplicates.
"""
from __future__ import annotations

import html
import re
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterator

import httpx

from ..config import DATA_DIR
from ..models import Grant

EXTRACT_URL = "https://prod-grants-gov-chatbot.s3.amazonaws.com/extracts/GrantsDBExtract{d}v2.zip"
CACHE_DIR = DATA_DIR / "cache"

ELIGIBLE = {
    "00": "State governments", "01": "County governments", "02": "City or township governments",
    "04": "Special district governments", "05": "Independent school districts",
    "06": "Public and state-controlled higher education", "07": "Native American tribal governments",
    "08": "Public housing authorities", "11": "Native American tribal organizations",
    "12": "Nonprofits (501c3)", "13": "Nonprofits (non-501c3)", "20": "Private higher education",
    "21": "Individuals", "22": "For-profit organizations (not small businesses)",
    "23": "Small businesses", "25": "Others", "99": "Unrestricted (anyone)",
}
CATEGORY = {  # CategoryOfFundingActivity codes
    "AG": "Agriculture", "AR": "Arts", "BC": "Business and commerce", "CD": "Community development",
    "CP": "Consumer protection", "DPR": "Disaster prevention and relief", "ED": "Education",
    "ELT": "Employment, labor and training", "EN": "Energy", "ENV": "Environment",
    "FN": "Food and nutrition", "HL": "Health", "HO": "Housing", "HU": "Humanities",
    "ISS": "Income security and social services", "IS": "Information and statistics",
    "LJL": "Law, justice and legal services", "NR": "Natural resources", "RD": "Regional development",
    "ST": "Science and technology", "T": "Transportation", "O": "Other",
}


def _text(value: str | None) -> str:
    # The extract double-escapes HTML (&amp;lt;br/&amp;gt;), so unescape until stable.
    for _ in range(3):
        value = html.unescape(value or "")
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", value)).strip()


def _date(mmddyyyy: str | None) -> str | None:
    try:
        return datetime.strptime((mmddyyyy or "").strip(), "%m%d%Y").date().isoformat()
    except ValueError:
        return None


def _int(value: str | None) -> int | None:
    try:
        return int(float(value or ""))
    except ValueError:
        return None


def parse_record(el: ET.Element, today: str) -> Grant | None:
    """Pure function: one XML element -> Grant, or None if archived/unusable."""
    g = lambda k: (el.findtext("{*}" + k) or "").strip()
    is_forecast = el.tag.endswith("OpportunityForecastDetail_1_0")
    archive, close = _date(g("ArchiveDate")), _date(g("CloseDate"))
    if (archive and archive < today) or not g("OpportunityID"):
        return None
    status = "forecasted" if is_forecast else ("closed" if close and close < today else "open")
    codes = g("EligibleApplicants").split()
    eligibility = "; ".join(ELIGIBLE.get(c, c) for c in codes)
    extra = _text(g("AdditionalInformationOnEligibility"))
    if extra:
        eligibility = f"{eligibility}. {extra}" if eligibility else extra
    cat_code = g("CategoryOfFundingActivity")
    cats = [CATEGORY.get(cat_code, cat_code)] if cat_code else []
    if g("CategoryExplanation"):
        cats.append(_text(g("CategoryExplanation")))
    return Grant(
        source="grants.gov", external_id=g("OpportunityID"),
        title=_text(g("OpportunityTitle")),
        url=f"https://www.grants.gov/search-results-detail/{g('OpportunityID')}",
        funder=_text(g("AgencyName")), description=_text(g("Description")),
        amount_min=_int(g("AwardFloor")), amount_max=_int(g("AwardCeiling")),
        deadline=close, status=status, eligibility=eligibility, categories=cats,
        raw={"opportunityNumber": g("OpportunityNumber"), "eligibleCodes": codes,
             "cfda": g("CFDANumbers")},
    )


def download_latest(client: httpx.Client | None = None, days_back: int = 4) -> Path:
    """Download the newest extract (today's may not be published yet, so try back)."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    client = client or httpx.Client(timeout=None, follow_redirects=True)
    for back in range(days_back):
        day = (datetime.now(timezone.utc) - timedelta(days=back)).strftime("%Y%m%d")
        dest = CACHE_DIR / f"GrantsDBExtract{day}v2.zip"
        if dest.exists():
            return dest
        with client.stream("GET", EXTRACT_URL.format(d=day)) as r:
            if r.status_code != 200:
                continue
            tmp = dest.with_suffix(".part")
            with tmp.open("wb") as f:
                for chunk in r.iter_bytes(1 << 20):
                    f.write(chunk)
            tmp.rename(dest)
            for old in CACHE_DIR.glob("GrantsDBExtract*.zip"):  # keep only the newest
                if old != dest:
                    old.unlink()
            return dest
    raise RuntimeError(f"No Grants.gov extract found in the last {days_back} days")


def iter_grants(zip_path: Path) -> Iterator[Grant]:
    today = datetime.now(timezone.utc).date().isoformat()
    with zipfile.ZipFile(zip_path) as z:
        xml_name = next(n for n in z.namelist() if n.endswith(".xml"))
        with z.open(xml_name) as f:
            for _, el in ET.iterparse(f):
                if el.tag.endswith(("OpportunitySynopsisDetail_1_0", "OpportunityForecastDetail_1_0")):
                    grant = parse_record(el, today)
                    el.clear()
                    if grant:
                        yield grant
