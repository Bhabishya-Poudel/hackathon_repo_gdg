"""Single place that builds the LLM + embeddings clients from backend/.env.

Centralizes provider configuration and model fallback behavior.
"""
from __future__ import annotations

import os
import warnings
from pathlib import Path

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
# Flash-lite models ignore `temperature` and warn on every call; we only ever pass 0.
warnings.filterwarnings("ignore", message=".*fixed sampling defaults.*")


def _key() -> str:
    key = os.environ.get("LLM_API_KEY", "").strip()
    if not key:
        raise RuntimeError("LLM_API_KEY is empty. Put your key in backend/.env")
    return key


# Free-tier quotas are per model and a model can be overloaded (503): if the main model fails,
# the next one is tried. Override with LLM_MODEL / LLM_FALLBACK_MODELS (comma separated) in .env.
DEFAULT_MODEL = "gemini-3.5-flash-lite"
DEFAULT_FALLBACKS = "gemini-3.1-flash-lite,gemini-3.5-flash"


def llm_models() -> list[str]:
    main = os.environ.get("LLM_MODEL", "").strip() or DEFAULT_MODEL
    extra = os.environ.get("LLM_FALLBACK_MODELS", DEFAULT_FALLBACKS)
    return list(dict.fromkeys([main, *[m.strip() for m in extra.split(",") if m.strip()]]))


def get_llm(temperature: float = 0.0, model: str | None = None) -> ChatGoogleGenerativeAI:
    # Short timeout + one retry: the client's default is to retry overload (503) errors with
    # long backoff, which made one call take 10-30s. Fail fast and let the next model take over.
    return ChatGoogleGenerativeAI(model=model or llm_models()[0], google_api_key=_key(),
                                  temperature=temperature, timeout=20, max_retries=1)


EMBED_MODEL = "BAAI/bge-small-en-v1.5"  # ~130MB, runs locally, no key or quota


class LocalEmbeddings:
    """LangChain-style embeddings (embed_documents / embed_query) running on this machine."""

    def __init__(self, model: str = EMBED_MODEL):
        from fastembed import TextEmbedding  # imported lazily: first use downloads the model
        self._m = TextEmbedding(model_name=model)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [v.tolist() for v in self._m.embed(texts)]

    def embed_query(self, text: str) -> list[float]:
        return next(iter(self._m.query_embed(text))).tolist()


_embeddings: LocalEmbeddings | None = None


def get_embeddings() -> LocalEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = LocalEmbeddings()
    return _embeddings


def text_of(message) -> str:
    """Gemini 3.x returns content as a list of blocks; flatten to plain text."""
    c = message.content
    if isinstance(c, str):
        return c
    return "".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in c).strip()
