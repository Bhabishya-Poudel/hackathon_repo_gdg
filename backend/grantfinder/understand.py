"""Convert a free-text message into a structured grant request.

"I run a youth basketball camp in Atlanta and need money for jerseys"
  -> need="jerseys", category="youth sports", state="GA", business_type="nonprofit/camp" ...

One LLM call with structured output (Pydantic). The result is cleaned in plain Python
afterwards, so an invalid model value (state "Georgia", amount "$5k") cannot reach retrieval.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .llm import get_llm, llm_models

US_STATES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois",
    "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana",
    "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
    "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon",
    "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota",
    "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia",
    "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
}
_NAME_TO_CODE = {v.lower(): k for k, v in US_STATES.items()}

PROMPT = """You read text messages from small-business owners, artists and community organizers
who are looking for grants (free money, not loans). Extract what they are asking for.

Rules:
- intent: "grant_search" if they describe a business or project and want funding or grants;
  "greeting" for hello/start/thanks with no request; "other" for anything else, including loans,
  personal expenses with no business or project (rent, bills, debt, tuition, medical costs) and
  unrelated questions. A bare "I need money" / "any grants?" with no reason given is still
  "grant_search" (leave need, category and business_type empty).
- Write need, category, business_type and search_query in English, translating if the message is
  in another language.
- need: what the money is for, in a few words ("flower pots", "jerseys", "a food truck"). "" if unstated.
- category: the industry in 1-3 words ("nursery / horticulture", "youth sports", "food"). "" if the
  message does not say what the business does.
- business_type: what they are ("sole proprietor", "nonprofit", "small business", "farm"). "" if unstated.
- state: the US state they are in, as a 2-letter code. null if no place is given. Never guess.
- amount: dollars they want, as an integer ("$5k" -> 5000). null if no amount is given.
- audience: every group the OWNER says they belong to, using only these tags: black-owned,
  women-led, youth, faith-based, immigrant, veteran, lgbtq, rural, first-time,
  formerly-incarcerated, latino, asian, native-american, disability.
  Map what they say: Black/African American -> black-owned; woman/mother/Latina etc -> women-led for
  gender; Latino/Latina/Latinx/Hispanic or a Latin American origin (Mexican, Colombian...) -> latino;
  Asian American/AAPI or an Asian origin (Vietnamese, Korean, Chinese, Indian, Filipino...) -> asian;
  Native/Indigenous/tribal/American Indian -> native-american; deaf/blind/disabled/wheelchair -> disability;
  age under 25 -> youth. Use "youth" when the business or program serves young people.
  Empty list if none is stated. Only use what the message says; never infer a group from a name.
- search_query: one plain sentence describing the grant they need, written the way a grant
  description would read ("Grants for Black-owned plant nurseries buying pots and soil"). Mention
  the audience groups in it. Used for search.
Use only what the message says. Do not invent details.

Message: {message}"""


# First ten match AUDIENCES in src/data/grantTypes.ts, so the bot and the website filters agree.
# The last four are not website filters yet; they are needed for minority-owned business requests.
Audience = Literal["black-owned", "women-led", "youth", "faith-based", "immigrant", "veteran", "lgbtq",
                   "rural", "first-time", "formerly-incarcerated", "latino", "asian", "native-american",
                   "disability"]


class Request(BaseModel):
    intent: Literal["grant_search", "greeting", "other"] = "grant_search"
    need: str = ""
    category: str = ""
    business_type: str = ""
    audience: list[Audience] = Field(default_factory=list, description="groups the owner belongs to")
    state: str | None = Field(default=None, description="2-letter US state code")
    amount: int | None = Field(default=None, description="dollars wanted")
    search_query: str = ""


def clean_state(value: str | None) -> str | None:
    if not value:
        return None
    v = value.strip()
    if v.upper() in US_STATES:
        return v.upper()
    return _NAME_TO_CODE.get(v.lower())


def normalize(req: Request, message: str) -> Request:
    """Make the model output safe: valid state code, positive amount, non-empty search text."""
    req.state = clean_state(req.state)
    req.audience = list(dict.fromkeys(req.audience))  # drop duplicates, keep order
    if req.amount is not None and req.amount <= 0:
        req.amount = None
    if req.intent == "grant_search" and not req.search_query.strip():
        req.search_query = " ".join(
            p for p in [*req.audience, req.need, req.category, req.business_type] if p) or message
    return req


def _chain(llm=None):
    """Structured-output chain; with no `llm` given, tries each configured model in turn."""
    if llm is not None:
        return llm.with_structured_output(Request)
    chains = [get_llm(model=m).with_structured_output(Request) for m in llm_models()]
    return chains[0].with_fallbacks(chains[1:]) if len(chains) > 1 else chains[0]


def understand(message: str, llm=None) -> Request:
    """Message text -> Request. `llm` is injectable so tests do not need a network or key."""
    req = _chain(llm).invoke(PROMPT.format(message=message.strip()))
    return normalize(req, message)
