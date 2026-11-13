from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "grants.db"

# Topics for `ingest --source web` (Google-grounded web search). Edit freely.
WEB_SEARCH_QUERIES = [
    "small business grants open for applications",
    "grants for Black-owned and minority-owned businesses",
    "grants for women-owned businesses",
    "grants for veteran-owned small businesses",
    "grants for farmers, nurseries and urban agriculture",
    "grants for artists, musicians and creative businesses",
    "grants for nonprofits and community organizations",
    "grants for food businesses, restaurants and food trucks",
    "local and state small business relief grants",
]

# Broad ingestion queries; retrieval applies request-specific ranking.
GRANTS_GOV_QUERIES = [
    "small business",
    "minority business",
    "nursery horticulture",
    "agriculture farm",
    "urban agriculture",
    "microenterprise",
    "rural business",
    "entrepreneur",
]
