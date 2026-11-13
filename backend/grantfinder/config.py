from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DATA_DIR / "grants.db"

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
