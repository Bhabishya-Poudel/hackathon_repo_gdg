"""Webhook tests: Telegram -> /webhook -> process_grant_request -> sendMessage, with both ends faked."""
import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture()
def bot(monkeypatch):
    sent = []
    monkeypatch.setattr(main, "process_grant_request", lambda text, chat_id: f"reply to {text!r} for {chat_id}")
    monkeypatch.setattr(main, "send_message", lambda chat_id, text: sent.append((chat_id, text)))
    main._seen_updates.clear()
    return TestClient(main.app), sent  # no `with`: skips startup (token check + model load)


def update(uid, text="grants for flower pots", chat_id=42):
    return {"update_id": uid, "message": {"message_id": 1, "chat": {"id": chat_id}, "text": text}}


def test_text_message_gets_grant_reply(bot):
    client, sent = bot
    assert client.post("/webhook", json=update(1)).json() == {"status": "ok"}
    assert sent == [(42, "reply to 'grants for flower pots' for 42")]


def test_same_update_is_answered_once(bot):
    client, sent = bot
    for _ in range(3):  # Telegram re-sends an update when we are slow
        client.post("/webhook", json=update(7))
    assert len(sent) == 1


def test_non_text_updates_are_ignored(bot):
    client, sent = bot
    client.post("/webhook", json={"update_id": 2, "message": {"chat": {"id": 1}, "photo": []}})
    client.post("/webhook", json={"update_id": 3, "edited_message": {"chat": {"id": 1}, "text": "x"}})
    client.post("/webhook", json={"update_id": 4})
    assert sent == []


def test_crash_in_grant_code_still_replies(bot, monkeypatch):
    client, sent = bot
    def boom(text, chat_id): raise RuntimeError("db locked")
    monkeypatch.setattr(main, "process_grant_request", boom)
    assert client.post("/webhook", json=update(5)).status_code == 200
    assert sent and "something went wrong" in sent[0][1]


def test_long_reply_is_cut_to_telegram_limit(monkeypatch):
    posted = {}
    class R: ok = True
    monkeypatch.setenv("TELEGRAM_TOKEN", "abc")
    monkeypatch.setattr(main.requests, "post", lambda url, json, timeout: posted.update(url=url, json=json) or R())
    main.send_message(1, "x" * 10000)
    assert len(posted["json"]["text"]) == main.TELEGRAM_MAX_CHARS and posted["url"].endswith("botabc/sendMessage")


def test_missing_token_is_a_clear_error(monkeypatch):
    monkeypatch.setenv("TELEGRAM_TOKEN", "")
    with pytest.raises(RuntimeError, match="TELEGRAM_TOKEN"):
        main._send_url()
