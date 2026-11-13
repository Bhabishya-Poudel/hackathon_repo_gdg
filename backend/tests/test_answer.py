"""Phase 4 tests: process_grant_request with a fake LLM and a fake embedder (no network, no model download)."""
import re
import zlib

import numpy as np
import pytest

from grantfinder import answer, db, retrieval
from grantfinder.fallback import SBIR_SMS
from grantfinder.models import Grant
from grantfinder.understand import Request


class FakeLLM:
    def __init__(self, req=None, boom=False):
        self.req, self.boom = req, boom

    def with_structured_output(self, _schema):
        return self

    def invoke(self, _prompt):
        if self.boom:
            raise RuntimeError("503 UNAVAILABLE")
        return self.req


class FakeEmbeddings:
    """Hashes words into 64 buckets: texts sharing words get a high cosine. Good enough for plumbing."""

    def _vec(self, text):
        v = np.zeros(64)
        for w in re.findall(r"[a-z]+", text.lower()):
            v[zlib.crc32(w.encode()) % 64] += 1
        return v.tolist()

    def embed_documents(self, texts):
        return [self._vec(t) for t in texts]

    def embed_query(self, text):
        return self._vec(text)


GRANTS = [
    Grant(source="seed", external_id="pots", title="Green Thumb Microgrant", url="https://x.org/pots",
          funder="Garden Fund", description="Pots, planters and soil for flower shops and nurseries. More text.",
          amount_min=1000, amount_max=7500, deadline=None, eligibility="Small nurseries."),
    Grant(source="seed", external_id="bake", title="Bakery Oven Grant", url="https://x.org/bake",
          description="Ovens and mixers for home bakeries.", amount_min=500, amount_max=2000,
          deadline="2099-01-31", states=["GA"]),
    Grant(source="seed", external_id="old", title="Expired Flower Grant", url="https://x.org/old",
          description="Flower pots.", deadline="2001-01-01"),
]


@pytest.fixture()
def conn(tmp_path):
    c = db.connect(tmp_path / "t.db")
    db.upsert_grants(c, GRANTS)
    retrieval.index_grants(c, embeddings=FakeEmbeddings())
    return c


def ask(conn, text, req, chat_id=None, min_score=0.3, **kw):
    return answer.process_grant_request(text, chat_id, conn=conn, llm=FakeLLM(req),
                                        embeddings=FakeEmbeddings(), min_score=min_score, **kw)


def test_terms_drops_generic_words():
    assert retrieval.terms("Small business for the pots and nurseries") == {"pot", "nursery"}


def test_terms_match_different_spellings_of_one_word():
    t = retrieval.terms
    assert t("flowers") == t("flower")
    assert t("plumbing") == t("plumbers")
    assert t("license") == t("licensing")
    assert t("woman") == t("women") and t("Latina") == t("Latinx") == t("Latino")


def test_match_reply_uses_stored_facts(conn):
    req = Request(need="flower pots", category="nursery", search_query="grants for flower pots nursery")
    reply = ask(conn, "I sell flowers", req)
    assert "Green Thumb Microgrant" in reply
    assert "$1,000 to $7,500" in reply and "rolling / no set deadline" in reply
    assert "https://x.org/pots" in reply
    assert "Expired Flower Grant" not in reply  # past deadline is never offered


def test_grant_without_eligibility_shows_view_more_details(conn):
    db.upsert_grants(conn, [Grant(source="listing", external_id="l1", title="Mural Artist Fund", url="https://x.org/l1",
                                  funder="Arts Fund", description="Mural Artist Fund.", amount_max=3000)])
    retrieval.index_grants(conn, embeddings=FakeEmbeddings())
    reply = ask(conn, "mural artist", Request(need="mural artist", search_query="mural artist grants"))
    assert "View more details: https://x.org/l1" in reply
    assert "Who can apply" not in reply and "Apply:" not in reply and "third-party" not in reply
    assert reply.count("Mural Artist Fund") == 1  # the repeated title line is dropped


def test_grant_with_eligibility_keeps_apply_link(conn):
    reply = ask(conn, "flowers", Request(need="flower pots", category="nursery", search_query="flower pots nursery"))
    assert "Who can apply: Small nurseries" in reply and "Apply: https://x.org/pots" in reply
    assert "View more details" not in reply


def test_state_filter_hides_other_states(conn):
    req = Request(need="bakery oven", search_query="bakery oven grants", state="TX")
    assert "Bakery Oven Grant" not in ask(conn, "bakery in Texas", req)
    req.state = "GA"
    assert "Bakery Oven Grant" in ask(conn, "bakery in Georgia", req)


def test_no_match_without_chat_id_saves_nothing(conn):
    reply = ask(conn, "tattoo parlor", Request(need="tattoo parlor", search_query="tattoo parlor grants"))
    assert SBIR_SMS in reply and "saved your request" not in reply
    assert conn.execute("SELECT COUNT(*) FROM subscriptions").fetchone()[0] == 0


def test_no_match_with_chat_id_saves_one_subscription(conn):
    req = Request(need="tattoo parlor", search_query="tattoo parlor grants")
    for _ in range(2):  # same person repeating the ask must not add a second row
        reply = ask(conn, "tattoo parlor", req, chat_id=42)
    assert answer.SAVED in reply and SBIR_SMS in reply
    rows = conn.execute("SELECT contact, query_text FROM subscriptions").fetchall()
    assert [(r["contact"], r["query_text"]) for r in rows] == [("42", "tattoo parlor")]


def test_greeting_other_and_vague_never_search(conn):
    assert ask(conn, "hi", Request(intent="greeting")) == answer.WELCOME
    assert ask(conn, "weather?", Request(intent="other")) == answer.OFF_TOPIC
    # "I need money": the model may invent a search_query, but nothing specific was said
    assert ask(conn, "I need money", Request(search_query="grants for small businesses")) == answer.TOO_VAGUE
    assert conn.execute("SELECT COUNT(*) FROM subscriptions").fetchone()[0] == 0


def test_only_state_given_is_vague(conn):
    assert ask(conn, "any grants in Ohio?", Request(state="OH", business_type="new businesses",
                                                   search_query="grants for new businesses in Ohio")) == answer.TOO_VAGUE


def test_model_category_alone_cannot_open_the_gate(conn):
    # the user said "keyboards"; the model's paraphrase "nursery" must not drag in the nursery grant
    req = Request(need="keyboards", category="nursery", search_query="grants for keyboards")
    assert "Green Thumb Microgrant" not in ask(conn, "I need keyboards", req)


def test_government_only_federal_grants_are_skipped(conn):
    db.upsert_grants(conn, [Grant(source="grants.gov", external_id="g1", title="Tattoo Research Grant",
                                  url="https://g.gov/1", description="tattoo studies", eligibility="State governments."),
                            Grant(source="grants.gov", external_id="g2", title="Tattoo Artist Grant",
                                  url="https://g.gov/2", description="tattoo artists", eligibility="Small businesses.")])
    retrieval.index_grants(conn, embeddings=FakeEmbeddings())
    reply = ask(conn, "tattoo parlor", Request(need="tattoo parlor", search_query="tattoo grants"))
    assert "Tattoo Artist Grant" in reply and "Tattoo Research Grant" not in reply


def test_empty_message_gets_welcome(conn):
    assert answer.process_grant_request("  ", conn=conn) == answer.WELCOME


def test_llm_failure_returns_polite_error_not_exception(conn):
    reply = answer.process_grant_request("flower pots", conn=conn, llm=FakeLLM(boom=True))
    assert reply == answer.TROUBLE


def test_amount_prefers_grant_that_can_cover_it(conn):
    req = Request(need="flower bakery pots oven", search_query="flower pots bakery oven", amount=5000)
    reply = ask(conn, "need 5k", req)
    assert reply.index("Green Thumb Microgrant") < reply.index("Bakery Oven Grant")  # max 7500 covers 5000; 2000 doesn't


def test_money_and_sentence_helpers():
    assert answer._money(None, None) == "amount varies"
    assert answer._money(None, 500) == "up to $500"
    assert answer._first_sentence("One. Two.") == "One."
