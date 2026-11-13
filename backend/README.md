# CivicText grant service

Python service for grant ingestion, semantic retrieval, and Telegram responses. Grant records and embedding vectors are stored in SQLite; request understanding uses Gemini through LangChain.

## Setup

### Business Coach only (quick local setup)

The website's Business Coach works independently of Telegram, grant ingestion,
and embedding downloads. From the repository root:

```bash
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements-advisor.txt
cp backend/.env.example backend/.env
```

Create a key in [Google AI Studio](https://aistudio.google.com/apikey) and set
`GEMINI_API_KEY` in `backend/.env`. An existing `LLM_API_KEY` also works as a
fallback. Leave `TELEGRAM_TOKEN` empty for this setup. Never use a `VITE_` prefix
for the Gemini key: Vite exposes those variables to browsers.

```bash
cd backend
.venv/bin/python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal at the repository root, run `npm run dev` and open
`http://localhost:5173/business-coach`. Vite proxies `/api` to the Python service;
restart Vite after changing `VITE_BACKEND_URL`. Production Vercel routing already
forwards `/api/*` to this same service. For another static host, configure an
equivalent API reverse proxy.

`ADVISOR_MODEL` defaults to `gemini-3.5-flash-lite`, currently listed with free-tier
input and output. Free-tier eligibility and quotas depend on the project and can
change; check [pricing](https://aistudio.google.com/docs/pricing#gemini-3.5-flash-lite)
and [your active limits](https://aistudio.google.com/rate-limit). Use a free-tier
project to stay within free usage. A billing-enabled project can incur charges
even with this model; the application cannot force Google's billing tier.
There are no automatic retries, paid-model fallbacks, grounding tools, or web
searches. Each click makes one bounded model request. Quota exhaustion returns
an actionable error. This initial endpoint has no authentication or shared
rate limiter; add access controls before opening it to unrestricted public use.

Google may use free-tier submissions to improve its products. The form explains
this before submission; avoid sensitive data. Profiles and plans are not saved
by this application. Users can download their generated plan as text.

To run the advisor and Telegram transport tests without live API calls:

```bash
backend/.venv/bin/python -m pip install pytest
cd backend
.venv/bin/python -m pytest tests/test_business_advisor.py tests/test_telegram.py -q
```

### Full grant and Telegram service

Requires Python 3.10+. Run from the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

On Windows, activate the environment with `.venv\Scripts\activate` and copy the environment template with `copy .env.example .env`.

## Configuration

Set environment values in `backend/.env`, which is excluded from version control.

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Server-only Business Coach key; falls back to `LLM_API_KEY` |
| `ADVISOR_MODEL` | Business Coach model, default `gemini-3.5-flash-lite` |
| `LLM_API_KEY` | Gemini API key for request understanding and chat |
| `LLM_MODEL` | Optional primary model override |
| `LLM_FALLBACK_MODELS` | Optional comma-separated fallback models |
| `LLM_BASE_URL` | Optional provider base URL override |
| `TELEGRAM_TOKEN` | Enables the Telegram bot and embedding warmup; optional for Business Coach |

Local embeddings and semantic search do not require an LLM API key. Initial indexing downloads the embedding model and can take several minutes on CPU.

## Grant database

Run from `backend/`:

```bash
python -m grantfinder.cli ingest --source seed
python -m grantfinder.cli index
python -m grantfinder.cli stats
python -m grantfinder.cli ask "flower pots and nursery plants"
```

`--source seed` loads curated records, available third-party listings, and the web-research results in `data/web_grants.json`. `--source all` also downloads the Grants.gov bulk extract. The generated database, model cache, and downloaded extracts are excluded from version control. Repeating ingestion and indexing processes new or changed records.

### Web search ingestion

`--source web` searches the open web for grants (Gemini with Google Search grounding, using `LLM_API_KEY`), validates the results, and stores them with source `web`. It is not part of `--source all` because each run uses API quota.

```bash
python -m grantfinder.cli ingest --source web                        # topics from WEB_SEARCH_QUERIES in config.py
python -m grantfinder.cli ingest --source web --query "grants for food trucks in Texas"
python -m grantfinder.ingest.web_search --dry-run                    # print results, do not store
python -m grantfinder.cli index                                      # embed the new grants afterwards
```

Expired grants and links that return 404/410 are dropped. Records are keyed by URL, so repeating a run updates rather than duplicates. Results come from a model reading live pages, so treat them as unverified leads, like `listing` records.

```bash
python -m grantfinder.cli understand "I run a bakery in Georgia"
python -m grantfinder.cli chat "I run a bakery in Georgia and need equipment"
```

The `understand` and `chat` commands require `LLM_API_KEY`.

## API

```bash
python -m uvicorn main:app --reload
```

The service runs at `http://127.0.0.1:8000`. When `TELEGRAM_TOKEN` is set, startup loads the embedding model. With no token, the Business Coach API starts independently and Telegram webhooks return 503.

| Endpoint | Purpose |
| --- | --- |
| `GET /` | Service response |
| `GET /api/advisor/status` | Whether a Gemini key is configured (does not validate credentials) |
| `POST /api/advisor` | Validated business profile → Gemini growth plan |
| `POST /webhook` | Telegram text updates |
| `GET /stream` | Server-sent events for incoming requests |

Telegram delivery requires a publicly reachable HTTPS webhook registered with the bot. Grant processing runs in a worker thread to avoid blocking the event loop.

## Validation

```bash
python -m pytest tests -q -k "not live"
```

Live tests require an API key and make provider requests:

```bash
python -m pytest tests -q
python tests/eval/run.py all
```

See [system architecture](../docs/ARCHITECTURE.md) for component responsibilities, data sources, and current limitations.
