import asyncio
import json
import logging
import os
from collections import deque
from contextlib import asynccontextmanager, suppress
from pathlib import Path

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

load_dotenv(Path(__file__).resolve().parent / ".env")

from business_advisor import router as advisor_router  # noqa: E402


def process_grant_request(user_text, chat_id):
    # Keep the website API usable without the optional grant/embedding dependencies.
    from grantfinder.answer import process_grant_request as process
    return process(user_text, chat_id)

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
    try:
        res = await run_in_threadpool(
            requests.get,
            f"https://api.telegram.org/bot{token}/deleteWebhook",
            timeout=10
        )
    except Exception:
        log.exception("deleteWebhook failed (cannot reach Telegram?)")
    else:
        if res.ok:
            print("✅ Webhook deleted. Switched to Long Polling mode! Listening for messages...")
        else:
            log.error("deleteWebhook rejected: %s %s", res.status_code, res.text[:200])

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
                        log.warning("Telegram message from %s: %r", chat_id, user_text[:80])
                        await run_in_threadpool(handle_message, chat_id, user_text)
            else:
                # e.g. 401 = bad/revoked token, 409 = another process is polling this bot
                log.error("getUpdates failed: %s %s", res.status_code, res.text[:200])
        except asyncio.CancelledError:
            raise
        except Exception:
            log.exception("Telegram polling error")

        await asyncio.sleep(1)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    polling_task = None
    if os.environ.get("TELEGRAM_TOKEN", "").strip():
        from grantfinder.llm import get_embeddings
        await run_in_threadpool(get_embeddings)
        polling_task = asyncio.create_task(_poll_telegram())
    else:
        log.info("Telegram is disabled; website Business Coach is available independently.")
    try:
        yield
    finally:
        if polling_task is not None:
            polling_task.cancel()
            with suppress(asyncio.CancelledError):
                await polling_task

app = FastAPI(lifespan=lifespan)
app.include_router(advisor_router)

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

@app.post("/webhook")
async def receive_message(request: Request):
    if not os.environ.get("TELEGRAM_TOKEN", "").strip():
        raise HTTPException(503, "Telegram is not configured.")
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
