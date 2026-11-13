# CivicText

CivicText helps small-business owners and community organizers discover funding opportunities through Telegram. The project includes a React website and a Python service for grant ingestion, request understanding, and retrieval.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

The website runs at `http://localhost:5173`. Telegram links point to [@CivicS123_bot](https://t.me/CivicS123_bot). `VITE_BACKEND_URL` defaults to `http://127.0.0.1:8000` for the local request monitor. Restart Vite after changing configuration.

Run the backend separately using [backend/README.md](backend/README.md). Backend secrets belong in `backend/.env`.

## Development

```bash
npm run build    # TypeScript checks and production build
npm run lint     # Source linting
npm run preview  # Preview the production build
```

## Repository structure

| Directory | Purpose |
| --- | --- |
| `src/pages/` | Landing page, Telegram entry point, sample grant search, stories, and request monitor |
| `src/components/` | Shared UI and feature components |
| `src/data/` | Sample grant listings, fictional stories, and shared data types |
| `src/lib/` | Grant filtering and platform configuration |
| `public/` | Static assets |
| `backend/grantfinder/` | Grant ingestion, storage, request understanding, and retrieval |
| `backend/tests/` | Backend tests and retrieval evaluation cases |
| `docs/` | System architecture |

## Telegram bot

`/demo` introduces the bot and links to Telegram when a username is configured. Messages are processed by the Python backend, which extracts the request, searches stored grant records, and replies through Telegram. The website does not simulate a conversation or generate application drafts.

Request understanding sends message text to Google Gemini. Grant details come from stored records; applicants should confirm eligibility and deadlines with the official funder.

## Sample content

`/grants` filters fictional sample listings in the browser. Its dataset is separate from the backend catalog. Search filters are stored in the URL for bookmarking and sharing.

`/stories` contains fictional community scenarios, labeled as illustrations rather than verified awards or customer testimonials.

Backend sources include curated records, unverified third-party listings, and Grants.gov. See [system architecture](docs/ARCHITECTURE.md) for provenance and operational limitations.

## Local request monitor

In Vite development mode, `/dashboard` displays incoming Telegram messages and chat IDs from a localhost backend's `/stream` endpoint. The monitor is disabled in production builds and for non-local backend URLs. The backend stream currently has no authentication.

## Deployment

```bash
npm run build
```

The production website is generated in `dist/`. Static hosting requires an `index.html` fallback for application routes. The root `vercel.json` declares separate Vite and FastAPI services with routing for `/api/*` and the website.

Backend deployment requires `TELEGRAM_TOKEN`, LLM configuration, database ingestion, and indexing. Fonts load from Google Fonts; the hero image loads from Unsplash.

## License

The root [vercel.json](./vercel.json) configures Vercel as a multi-service
project: the Vite app is served by the `app` service, `/api/*` requests are
forwarded to the FastAPI `backend` service, and all other paths go to the app.
Configure the backend's `TELEGRAM_TOKEN` and LLM settings as Vercel environment
variables. Website Telegram links point to [@CivicS123_bot](https://t.me/CivicS123_bot).

The Grants page uses bundled sample listings and does not require a hosted
database or backend connection.
