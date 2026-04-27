import pytest
from app import create_app


@pytest.fixture
def app():
    app = create_app("development")
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def test_product_list_invalid_query_params(client):
    resp = client.get("/api/product/list?page=bad")
    assert resp.status_code == 400


def test_product_list_success_calls_query(client, monkeypatch):
    import app.routes.product as product_routes

    called = {}

    def _query(**kwargs):
        called.update(kwargs)
        return ([{"_id": "p1"}], 1, kwargs["page"], kwargs["page_size"])

    monkeypatch.setattr(product_routes.Product, "query", staticmethod(_query))

    resp = client.get("/api/product/list?category=c&q=abc&page=2&page_size=10&sort=price_desc&min_price=1&max_price=9")
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["data"]["pagination"]["page"] == 2
    assert called["category"] == "c"
    assert called["q"] == "abc"
    assert called["sort"] == "price_desc"
    assert called["min_price"] == 1.0
    assert called["max_price"] == 9.0


def test_get_product_not_found(client, monkeypatch):
    import app.routes.product as product_routes

    monkeypatch.setattr(product_routes.Product, "find_by_id", staticmethod(lambda _pid: None))
    resp = client.get("/api/product/p1")
    assert resp.status_code == 404


def test_recommend_with_and_without_loss_degree(client, monkeypatch):
    import app.routes.product as product_routes

    called = {"by_loss": 0, "generic": 0}

    monkeypatch.setattr(
        product_routes.RecommenderService,
        "recommend_by_hearing_loss",
        staticmethod(lambda _d: (called.__setitem__("by_loss", called["by_loss"] + 1) or [{"_id": "p1"}])),
    )
    monkeypatch.setattr(
        product_routes.RecommenderService,
        "get_recommendations",
        staticmethod(lambda: (called.__setitem__("generic", called["generic"] + 1) or [{"_id": "p2"}])),
    )

    r1 = client.get("/api/product/recommend?loss_degree=轻度")
    assert r1.status_code == 200
    r2 = client.get("/api/product/recommend")
    assert r2.status_code == 200
    assert called["by_loss"] == 1
    assert called["generic"] == 1


def test_recommendations_v2_logs_event_best_effort(client, monkeypatch):
    import app.routes.product as product_routes

    monkeypatch.setattr(product_routes, "verify_jwt_in_request", lambda optional=True: (_ for _ in ()).throw(Exception("no token")))
    monkeypatch.setattr(product_routes, "get_jwt_identity", lambda: None)

    monkeypatch.setattr(
        product_routes.RecommenderService,
        "recommend_v2",
        staticmethod(lambda *_a, **_k: {"variant": "A", "items": [{"rank": 1, "score": 0.9, "reasons": [], "product": {"_id": "p1"}}]}),
    )

    logged = {"ok": False}

    def _log(event):
        assert event["event"] == "reco_response"
        logged["ok"] = True

    monkeypatch.setattr(product_routes.RecoEventService, "log_event", staticmethod(_log))

    resp = client.get("/api/product/recommendations?hearing_level=轻度&limit=3", headers={"X-Anonymous-Id": "a1", "X-Reco-Session": "s1"})
    assert resp.status_code == 200
    assert logged["ok"] is True


def test_reco_event_missing_fields(client):
    resp = client.post("/api/product/reco/event", json={"variant": "A"})
    assert resp.status_code == 400


def test_reco_event_failure_returns_500(client, monkeypatch):
    import app.routes.product as product_routes

    monkeypatch.setattr(product_routes.RecoEventService, "log_event", staticmethod(lambda _e: (_ for _ in ()).throw(Exception("x"))))
    resp = client.post("/api/product/reco/event", json={"event": "click"})
    assert resp.status_code == 500


def test_reco_event_success(client, monkeypatch):
    import app.routes.product as product_routes

    called = {"ok": False}
    monkeypatch.setattr(product_routes.RecoEventService, "log_event", staticmethod(lambda _e: called.__setitem__("ok", True)))
    resp = client.post("/api/product/reco/event", json={"event": "click", "meta": {"a": 1}}, headers={"X-Anonymous-Id": "a1"})
    assert resp.status_code == 200
    assert called["ok"] is True


def test_product_stream_emits_initial_event_and_ping(client, monkeypatch):
    import app.routes.product as product_routes

    v = {"n": 1}

    monkeypatch.setattr(product_routes.ProductStreamService, "get_version", staticmethod(lambda: v["n"]))

    t = {"now": 0.0}

    def _time():
        t["now"] += 60.0
        return t["now"]

    monkeypatch.setattr(product_routes.time, "time", _time)
    monkeypatch.setattr(product_routes.time, "sleep", lambda _s: None)

    resp = client.get("/api/product/stream", buffered=True)
    assert resp.status_code == 200
    data = resp.get_data(as_text=True)
    assert "event: products" in data
    assert "event: ping" in data

