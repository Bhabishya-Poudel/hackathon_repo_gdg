import asyncio
import json
import logging
import os
from collections import deque
from contextlib import asynccontextmanager
from pathlib import Path

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

load_dotenv(Path(__file__).resolve().parent / ".env")

from grantfinder.answer import process_grant_request  # noqa: E402  (after load_dotenv: it reads the LLM key)

log = logging.getLogger("telegram")

TELEGRAM_MAX_CHARS = 4096  # Telegram rejects longer messages
_seen_updates: deque = deque(maxlen=500)  # Telegram re-sends an update if we answer slowly; reply only once

active_subscribers: list[asyncio.Queue] = []

def _send_url() -> str:
    token = os.environ.get("TELEGRAM_TOKEN", "").strip()
    if not token:
        raise RuntimeError("TELEGRAM_TOKEN is empty. Put the bot token in backend/.env")
    return f"https://api.telegram.org/bot{token}/sendMessage"

def send_message(chat_id, text: str) -> None:
    payload = {"chat_id": chat_id, "text": text[:TELEGRAM_MAX_CHARS], "disable_web_page_preview": True}
    resp = requests.post(_send_url(), json=payload, timeout=15)
    if not resp.ok:
        log.error("sendMessage failed: %s %s", resp.status_code, resp.text[:200])

def handle_message(chat_id, user_text: str) -> None:
    """Runs in a worker thread: the grant lookup blocks (LLM call + search), so it must not run on the event loop."""
    try:
        reply_text = process_grant_request(user_text, chat_id)
    except Exception:
        log.exception("process_grant_request crashed")
        reply_text = "Sorry, something went wrong on my side. Please try again in a minute."
    send_message(chat_id, reply_text)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    _send_url()  # fail at startup, not on the first user's message, if the token is missing
    from grantfinder.llm import get_embeddings
    await run_in_threadpool(get_embeddings)  # loads the local embedding model now so the first message is not slow
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "My server is awake!"}

@app.get("/stream")
async def stream_dashboard():
    client_queue = asyncio.Queue()
    active_subscribers.append(client_queue)

    async def event_stream():
        try:
            yield "data: {\"status\": \"Connected to stream\"}\n\n"
            while True:
                data = await client_queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError:
            active_subscribers.remove(client_queue)

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.post("/webhook")
async def receive_message(request: Request):
    data = await request.json()

    update_id = data.get("update_id")
    if update_id is not None:
        if update_id in _seen_updates:
            return {"status": "ok"}
        _seen_updates.append(update_id)

    message = data.get("message") or {}
    if "text" in message:
        chat_id = message["chat"]["id"]
        user_text = message["text"]

        # Publish incoming requests to dashboard subscribers before grant processing.
        dashboard_update = {
            "phone_id": chat_id,
            "text": user_text,
            "status": "New Request Received"
        }
        for sub in active_subscribers:
            await sub.put(dashboard_update)

        await run_in_threadpool(handle_message, chat_id, user_text)

    return {"status": "ok"}
