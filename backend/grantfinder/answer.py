"""Transport-independent grant request processing and response formatting.

    process_grant_request("I sell flowers and need pots", chat_id="12345") -> str

Flow: understand -> (greeting / off-topic / too vague answered without searching)
      -> hybrid search -> reply built from the stored grant's own fields (no LLM-written
      facts, so it cannot invent a deadline or amount) -> no match: save a subscription
      and show the SBIR fallback.
"""
from __future__ import annotations

import logging
import re
import sqlite3

from . import db, retrieval
from .fallback import SBIR_SMS
from .understand import US_STATES, Request, understand

log = logging.getLogger(__name__)

# cosine + 0.4 * keyword overlap. On the sample data real matches scored >= 1.00 and junk <= 0.86;
# re-check with `python -m grantfinder.cli chat ...` after adding real grants.
MIN_SCORE = 0.93
EXTRA_MATCHES = 2     # more grants listed under the best one

WELCOME = ("Hi! I help small businesses and community groups find grants (free money, not loans).\n\n"
           "Tell me about your business and what you need the money for. For example:\n"
           "\"I sell flowers and need money for pots\" or \"youth basketball camp in Atlanta, need jerseys\".")
OFF_TOPIC = ("I can only help find grants, which is free funding, not loans. "
             "Tell me about your business or project and what you need the money for.")
TOO_VAGUE = ("Happy to help! What kind of business or project do you have, and what do you need "
             "the money for? A state helps too, for example: \"bakery in Georgia, need an oven\".")
TROUBLE = "Sorry, I'm having trouble right now. Please try again in a minute."
SAVED = "I've saved your request and will message you here if a matching grant is added."


# Plain greetings/commands are answered without an LLM call: faster, free, and works when the LLM is down.
_GREETING = re.compile(r"^\s*(/start|/help|start|help|hi+|hello+|hey+|yo|hola|thanks?|thank you|menu)\W*$", re.I)


def _money(lo: int | None, hi: int | None) -> str:
    if lo and hi and lo != hi:
        return f"${lo:,} to ${hi:,}"
    if hi or lo:
        return f"up to ${hi:,}" if hi else f"from ${lo:,}"
    return "amount varies"


def _first_sentence(text: str, limit: int = 220) -> str:
    s = text.strip().split(". ")[0].rstrip(".")
    return (s[: limit - 1] + "…" if len(s) > limit else s) + "." if s else ""


def format_grant(r: sqlite3.Row) -> str:
    deadline = r["deadline"] or "rolling / no set deadline"
    if r["status"] == "forecasted":
        deadline += " (not open yet)"
    desc = _first_sentence(r["description"])
    if desc.rstrip(".") == r["title"]:  # one-line listings repeat their title as the description
        desc = ""
    who = _first_sentence(r["eligibility"]) if len(r["eligibility"]) > 15 else ""
    lines = [r["title"], r["funder"] or None, f"Amount: {_money(r['amount_min'], r['amount_max'])}",
             f"Deadline: {deadline}", desc or None, f"Who can apply: {who}" if who else None,
             f"Apply: {r['url']}" if who else f"View more details: {r['url']}"]
    return "\n".join(l for l in lines if l)


def _save_subscription(conn: sqlite3.Connection, chat_id: str, text: str, req: Request) -> None:
    """One open subscription per (person, message): repeating the same ask does not add rows."""
    dup = conn.execute("SELECT 1 FROM subscriptions WHERE contact=? AND query_text=? AND notified_at IS NULL",
                       (str(chat_id), text)).fetchone()
    if not dup:
        conn.execute("INSERT INTO subscriptions (contact, query_text, extracted, created_at) VALUES (?,?,?,?)",
                     (str(chat_id), text, req.model_dump_json(), db.now()))
        conn.commit()


def is_vague(req: Request) -> bool:
    return not (req.need or req.category or req.business_type or req.audience)


_STATE_TERMS = retrieval.terms(*US_STATES.values())  # the state has its own filter; its name is not a topic


def keywords(req: Request, text: str) -> tuple[set[str], set[str]]:
    """(core, extra): core = what the user said, extra = the model's paraphrase (bonus only)."""
    core = retrieval.terms(req.need, " ".join(req.audience), text) - _STATE_TERMS
    extra = retrieval.terms(req.category, req.business_type) - _STATE_TERMS - core
    return core, extra


def find_matches(conn: sqlite3.Connection, req: Request, embeddings=None, min_score: float = MIN_SCORE,
                 text: str = ""):
    want, extra = keywords(req, text)
    hits = retrieval.hybrid_search(conn, req.search_query, want, k=1 + EXTRA_MATCHES,
                                   embeddings=embeddings, state=req.state, extra=extra)
    hits = [h for h in hits if h[0] >= min_score]
    if req.amount:  # small bonus for grants that can cover the amount; never outweighs a better match
        hits.sort(key=lambda h: -(h[0] + (0.05 if h[2]["amount_max"] is None or h[2]["amount_max"] >= req.amount else 0)))
    return hits


def process_grant_request(user_text: str, chat_id: str | int | None = None, *, conn=None, llm=None,
                          embeddings=None, min_score: float = MIN_SCORE) -> str:
    text = (user_text or "").strip()
    if not text or _GREETING.match(text):
        return WELCOME
    try:
        req = understand(text, llm=llm)
    except Exception:
        log.exception("understand failed")
        return TROUBLE
    if req.intent == "greeting":
        return WELCOME
    if req.intent == "other":
        return OFF_TOPIC
    if is_vague(req):
        return TOO_VAGUE

    if not keywords(req, text)[0]:  # e.g. "any grants in Ohio?": nothing specific to search for
        return TOO_VAGUE

    conn = conn or db.connect()
    try:
        hits = find_matches(conn, req, embeddings, min_score, text)
    except Exception:
        log.exception("search failed")
        return TROUBLE
    if hits:
        reply = "Best match for you:\n\n" + format_grant(hits[0][2])
        if len(hits) > 1:
            reply += "\n\nAlso worth a look:\n" + "\n".join(f"- {h[2]['title']}: {h[2]['url']}" for h in hits[1:])
        return reply

    reply = "I couldn't find a grant that fits that yet.\n\n"
    if chat_id is not None:
        _save_subscription(conn, str(chat_id), text, req)
        reply += SAVED + "\n\n"
    return reply + SBIR_SMS
