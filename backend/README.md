# CivicText grant service

Python service for grant ingestion, semantic retrieval, and Telegram responses. Grant records and embedding vectors are stored in SQLite; request understanding uses Gemini through LangChain.

## Setup

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
| `LLM_API_KEY` | Gemini API key for request understanding and chat |
| `LLM_MODEL` | Optional primary model override |
| `LLM_FALLBACK_MODELS` | Optional comma-separated fallback models |
| `LLM_BASE_URL` | Optional provider base URL override |
| `TELEGRAM_TOKEN` | Bot token required for API startup and Telegram delivery |

Local embeddings and semantic search do not require an LLM API key. Initial indexing downloads the embedding model and can take several minutes on CPU.

## Grant database

Run from `backend/`:

```bash
python -m grantfinder.cli ingest --source seed
python -m grantfinder.cli index
python -m grantfinder.cli stats
python -m grantfinder.cli ask "flower pots and nursery plants"
```

`--source seed` loads curated records and available third-party listings. `--source all` also downloads the Grants.gov bulk extract. The generated database, model cache, and downloaded extracts are excluded from version control. Repeating ingestion and indexing processes new or changed records.

```bash
python -m grantfinder.cli understand "I run a bakery in Georgia"
python -m grantfinder.cli chat "I run a bakery in Georgia and need equipment"
```

The `understand` and `chat` commands require `LLM_API_KEY`.

## API

```bash
python -m uvicorn main:app --reload
```

The service runs at `http://127.0.0.1:8000`. Startup validates the Telegram token and loads the embedding model.

| Endpoint | Purpose |
| --- | --- |
| `GET /` | Service response |
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
