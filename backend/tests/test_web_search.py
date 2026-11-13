from types import SimpleNamespace

from grantfinder import db
from grantfinder.ingest import web_search as ws

TODAY = "2026-11-13"


def W(**kw):
    base = dict(title="Green Fund", url="https://www.example.org/green/", funder="Example Foundation")
    return ws.WebGrant(**{**base, **kw})


def test_to_grant_cleans_fields():
    g = ws.to_grant(W(amount_min=9000, amount_max=1000, deadline="2027-03-01",
                      states=["ga", "Georgia", "NY"], categories=["Food ", "food"]), "q", TODAY)
    assert (g.amount_min, g.amount_max, g.deadline) == (1000, 9000, "2027-03-01")
    assert g.states == ["GA", "NY"] and g.categories == ["food"]
    assert g.source == "web" and g.id.startswith("web:")


def test_to_grant_drops_unusable():
    assert ws.to_grant(W(deadline="2026-01-01"), "q", TODAY) is None   # expired
    assert ws.to_grant(W(url="not a url"), "q", TODAY) is None
    assert ws.to_grant(W(title="  "), "q", TODAY) is None
    assert ws.to_grant(W(deadline="rolling"), "q", TODAY).deadline is None


def test_url_key_ignores_noise():
    a = ws.url_key("https://www.Example.org/green/?utm=1#x")
    assert a == ws.url_key("http://example.org/green")
    assert a != ws.url_key("https://example.org/blue")


class FakeModels:
    def __init__(self):
        self.calls = 0

    def generate_content(self, model, contents, config):
        self.calls += 1
        if config.tools:  # search step
            chunk = SimpleNamespace(web=SimpleNamespace(uri="https://src.example/page"))
            cand = SimpleNamespace(grounding_metadata=SimpleNamespace(grounding_chunks=[chunk]))
            return SimpleNamespace(text="Green Fund ...", candidates=[cand])
        grants = [W(deadline="2027-01-01"), W(title="Dup", url="http://example.org/green"),
                  W(title="Old", url="https://x.org/old", deadline="2020-01-01")]
        return SimpleNamespace(parsed=ws.WebGrantList(grants=grants), text="")


def test_fetch_and_store(tmp_path, monkeypatch):
    monkeypatch.setattr(ws, "llm_models", lambda: ["m"])
    client = SimpleNamespace(models=FakeModels())
    grants = ws.fetch_grants(["one", "two"], verify_links=False, client=client)
    assert len(grants) == 1                      # dup URL + expired removed, repeat query deduped
    assert grants[0].raw["sources"] == ["https://src.example/page"]

    conn = db.connect(tmp_path / "t.db")
    assert db.upsert_grants(conn, grants)["new"] == 1
    assert db.upsert_grants(conn, grants)["unchanged"] == 1


def test_model_fallback(monkeypatch):
    monkeypatch.setattr(ws, "llm_models", lambda: ["bad", "good"])

    class M:
        def generate_content(self, model, contents, config):
            if model == "bad":
                raise RuntimeError("quota")
            return "ok"

    assert ws._generate(SimpleNamespace(models=M()), "x", None) == "ok"
