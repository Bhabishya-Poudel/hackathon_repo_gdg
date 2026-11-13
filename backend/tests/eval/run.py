"""Run hand-written messages through the real pipeline (real Gemini, real grants.db) and report misses.

    python tests/eval/run.py tuned          # or: holdout, all
    python tests/eval/run.py all --pause 5

Not part of `pytest`: it makes about one LLM call per message, and the free tier allows 15 per minute per model,
hence the pause between messages (default 4s). Needs backend/.env and a built grants.db (ingest + index).
"""
import argparse
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # backend/, so `grantfinder` imports work
sys.path.insert(0, str(Path(__file__).resolve().parent))      # this folder, for `cases`

from cases import HOLDOUT, TUNED  # noqa: E402
from grantfinder import answer  # noqa: E402

logging.basicConfig(level=logging.ERROR, format="LOG %(message)s")

last: dict = {}
_orig_find, _orig_understand = answer.find_matches, answer.understand


def _find(conn, req, embeddings=None, min_score=answer.MIN_SCORE, text=""):
    """Record the best score even when it is below the cutoff, so near-misses are visible."""
    hits = _orig_find(conn, req, embeddings, 0.0, text)
    last["top"] = hits[0][0] if hits else None
    return [h for h in hits if h[0] >= min_score]


def _understand(text, llm=None):
    last["req"] = _orig_understand(text, llm)
    return last["req"]


answer.find_matches, answer.understand = _find, _understand


def classify(reply: str) -> tuple[str, str]:
    if reply == answer.WELCOME: return "GREETING", ""
    if reply == answer.OFF_TOPIC: return "OTHER", ""
    if reply == answer.TOO_VAGUE: return "VAGUE", ""
    if reply == answer.TROUBLE: return "TROUBLE", ""
    if reply.startswith("I couldn't find"): return "NONE", ""
    if reply.startswith("Best match"): return "MATCH", reply.split("\n\n")[1].split("\n")[0]
    return "?", reply[:60]


def run(name: str, cases: list, pause: float) -> int:
    print(f"== {name} ({len(cases)} messages)")
    failed = 0
    for i, (msg, ok) in enumerate(cases, 1):
        time.sleep(pause)
        last.clear()
        t = time.time()
        kind, title = classify(answer.process_grant_request(msg))
        good = kind in ok or (kind == "MATCH" and ("ANY" in ok or any(s in title for s in ok)))
        failed += not good
        score = f"{last['top']:.2f}" if last.get("top") is not None else " -- "
        print(f"{'PASS' if good else 'FAIL'} {i:2} {time.time() - t:4.1f}s | {msg[:56]:56} | {score} {kind} {title[:44]}", flush=True)
        if not good and last.get("req"):
            r = last["req"]
            print(f"       expected {ok} | understood: need={r.need!r} cat={r.category!r} aud={r.audience} "
                  f"state={r.state} amt={r.amount}", flush=True)
    print(f"{name}: {len(cases) - failed}/{len(cases)} passed\n")
    return failed


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("which", choices=["tuned", "holdout", "all"])
    ap.add_argument("--pause", type=float, default=4.0, help="seconds between messages (rate limit)")
    args = ap.parse_args()
    sets = {"tuned": TUNED, "holdout": HOLDOUT}
    chosen = list(sets) if args.which == "all" else [args.which]
    sys.exit(1 if sum(run(n, sets[n], args.pause) for n in chosen) else 0)
