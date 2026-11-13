# System architecture

## Web application

The React application provides a Telegram entry point, sample grant filtering, fictional community stories, and a local development request monitor. Grant filtering runs in the browser against sample TypeScript records.

Grant conversations take place in Telegram through the Python service. The backend exposes a server-sent event stream for incoming Telegram requests; the website monitor is enabled only during local development.

## Grant service

```text
Telegram message → POST /webhook → request understanding
                                → grant retrieval and ranking
                                → response from stored grant fields
                                → Telegram sendMessage
```

| Component | Responsibility |
| --- | --- |
| `backend/main.py` | FastAPI lifecycle, Telegram webhook, duplicate-update tracking, and event stream |
| `grantfinder/understand.py` | Structured request extraction and normalization |
| `grantfinder/retrieval.py` | Local embeddings, semantic search, and keyword ranking |
| `grantfinder/answer.py` | Request routing and replies assembled from grant records |
| `grantfinder/llm.py` | Provider clients, model fallbacks, and embedding model |
| `grantfinder/db.py` | SQLite persistence and grant updates |
| `grantfinder/ingest/` | Curated JSON and Grants.gov ingestion |
| `grantfinder/cli.py` | Ingestion, indexing, search, and diagnostic commands |

Embeddings use `BAAI/bge-small-en-v1.5` through FastEmbed and are stored locally. Request understanding sends message text to the configured Gemini provider. Grant replies use stored titles, amounts, deadlines, and URLs.

## Data sources

- `backend/data/seed_grants.json`: curated grant records, including sample records where labeled.
- `backend/data/listed_grants.json`: unverified third-party listings, when present; stored with source `listing`.
- Grants.gov: federal opportunity records loaded through bulk extraction or keyword search.
- `backend/data/grant_leads.md`: research leads excluded from ingestion.

A stored listing does not establish current availability or eligibility. Official funder pages remain the source for application requirements.

## Operational limitations

The frontend sample grant search and backend maintain separate datasets and matching implementations.

Provider quotas and availability affect request extraction. Model fallbacks reduce disruption but do not guarantee availability. First-time indexing requires network access to download the embedding model.

Unmatched Telegram requests can be stored as subscriptions. Automatic notification delivery is not implemented; the current no-match response promises a future notification despite this limitation.

Duplicate Telegram update tracking is held in process memory. Webhook authentication and durable delivery tracking are not implemented. The event stream uses in-process subscriber queues.
