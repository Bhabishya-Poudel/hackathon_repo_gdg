import asyncio
import json
import logging
import os
from collections import deque
from contextlib import asynccontextmanager
from pathlib import Path

import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

load_dotenv(Path(__file__).resolve().parent / ".env")

from grantfinder.answer import process_grant_request  # noqa: E402

log = logging.getLogger("telegram")

TELEGRAM_MAX_CHARS = 4096
_seen_updates: deque = deque(maxlen=500)
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
    try:
        reply_text = process_grant_request(user_text, chat_id)
    except Exception:
        log.exception("process_grant_request crashed")
        reply_text = "Sorry, something went wrong on my side. Please try again in a minute."
    send_message(chat_id, reply_text)

async def _poll_telegram():
    """Background loop that asks Telegram for new messages without needing webhooks."""
    token = os.environ.get("TELEGRAM_TOKEN", "").strip()
    
    # 1. Delete the webhook so Telegram allows Long Polling
    await run_in_threadpool(
        requests.get, 
        f"https://api.telegram.org/bot{token}/deleteWebhook", 
        timeout=10
    )
    print("✅ Webhook deleted. Switched to Long Polling mode! Listening for messages...")
    
    offset = 0
    while True:
        try:
            # 2. Fetch new messages
            url = f"https://api.telegram.org/bot{token}/getUpdates"
            res = await run_in_threadpool(
                requests.get, 
                url, 
                params={"offset": offset, "timeout": 2}, 
                timeout=5
            )
            
            if res.ok:
                data = res.json()
                for update in data.get("result", []):
                    offset = update["update_id"] + 1
                    
                    if update["update_id"] in _seen_updates:
                        continue
                    _seen_updates.append(update["update_id"])
                    
                    message = update.get("message") or {}
                    if "text" in message:
                        chat_id = message["chat"]["id"]
                        user_text = message["text"]

                        # Broadcast to Dashboard
                        dashboard_update = {
                            "phone_id": chat_id,
                            "text": user_text,
                            "status": "New Request Received"
                        }
                        for sub in active_subscribers:
                            await sub.put(dashboard_update)

                        # Process via AI
                        await run_in_threadpool(handle_message, chat_id, user_text)
        except Exception:
            pass # Ignore temporary network blips
        
        await asyncio.sleep(1)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Start checking Telegram in the background as soon as the server boots
    asyncio.create_task(_poll_telegram())
    
    from grantfinder.llm import get_embeddings
    await run_in_threadpool(get_embeddings)
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
    return {"message": "My server is awake and checking Telegram!"}

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