"""Phase 3 tests.

Offline tests check our own cleanup code with a fake LLM. The live test sends ~10 real
messages to Gemini and checks the key fields; it is skipped when there is no LLM_API_KEY.
"""
import os

import pytest

from grantfinder.understand import Request, clean_state, normalize, understand


class FakeLLM:
    def __init__(self, req: Request):
        self.req = req

    def with_structured_output(self, _schema):
        return self

    def invoke(self, _prompt):
        return self.req


def test_clean_state_accepts_codes_and_names():
    assert clean_state("ga") == "GA"
    assert clean_state("Georgia") == "GA"
    assert clean_state("  new york ") == "NY"
    assert clean_state("Atlantis") is None
    assert clean_state(None) is None


def test_normalize_fixes_bad_model_output():
    req = normalize(Request(state="Texas", amount=-5, need="pots", category="nursery"), "msg")
    assert (req.state, req.amount) == ("TX", None)
    assert req.search_query == "pots nursery"


def test_search_query_falls_back_to_message():
    assert normalize(Request(), "I need money").search_query == "I need money"


def test_audience_deduped_and_used_in_fallback_query():
    req = normalize(Request(audience=["black-owned", "women-led", "black-owned"], need="pots"), "msg")
    assert req.audience == ["black-owned", "women-led"]
    assert req.search_query == "black-owned women-led pots"


def test_audience_rejects_unknown_tag():
    with pytest.raises(ValueError):
        Request(audience=["martian"])


def test_greeting_keeps_empty_query():
    assert normalize(Request(intent="greeting"), "hi").search_query == ""


def test_understand_uses_injected_llm():
    fake = FakeLLM(Request(need="jerseys", state="Georgia", amount=500, search_query="youth sports grants"))
    req = understand("we need jerseys", llm=fake)
    assert (req.need, req.state, req.amount) == ("jerseys", "GA", 500)


# message, expected fields (substring match for text fields, exact for state/amount/intent)
LIVE_CASES = [
    ("I sell flowers and need money for flower pots", {"intent": "grant_search", "state": None, "amount": None}),
    ("I run a plant nursery in Ohio, looking for grants", {"intent": "grant_search", "state": "OH"}),
    ("youth basketball camp in Atlanta needs $2,500 for jerseys", {"state": "GA", "amount": 2500}),
    ("I want to start a food truck in Texas", {"state": "TX", "intent": "grant_search"}),
    ("home bakery, need an oven, about 5k", {"amount": 5000}),
    ("hi", {"intent": "greeting"}),
    ("/start", {"intent": "greeting"}),
    ("thanks!", {"intent": "greeting"}),
    ("what's the weather today?", {"intent": "other"}),
    ("black-owned hair salon in Detroit, Michigan, need funding to expand", {"state": "MI", "intent": "grant_search"}),
    ("I'm a Black woman starting a bakery, need an oven", {"audience": ["black-owned", "women-led"]}),
    ("army veteran running a landscaping company in Ohio", {"audience": ["veteran"], "state": "OH"}),
    ("I run a church food pantry", {"audience": ["faith-based"]}),
    ("I sell flowers and need money for flower pots", {"audience": []}),
]


@pytest.mark.skipif(not os.environ.get("LLM_API_KEY") and not os.path.exists(
    os.path.join(os.path.dirname(__file__), "..", ".env")), reason="no LLM key configured")
@pytest.mark.parametrize("message,expected", LIVE_CASES)
def test_live_extraction(message, expected):
    req = understand(message)
    for field, want in expected.items():
        got = sorted(req.audience) if field == "audience" else getattr(req, field)
        want = sorted(want) if field == "audience" else want
        assert got == want, f"{field}: got {getattr(req, field)!r}, want {want!r} for {message!r}"
