import pytest
from flask_jwt_extended import create_access_token
from app import create_app


@pytest.fixture
def app():
    app = create_app("development")
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def auth_headers(app, user_id="u1"):
    with app.app_context():
        token = create_access_token(identity=str(user_id))
    return {"Authorization": f"Bearer {token}"}


class _UpdateRes:
    def __init__(self, matched_count=1):
        self.matched_count = matched_count


def test_order_create_missing_info(client, app):
    resp = client.post("/api/order/create", json={"items": []}, headers=auth_headers(app))
    assert resp.status_code == 400


def test_order_create_missing_product_id(client, app):
    resp = client.post(
        "/api/order/create",
        json={"items": [{"quantity": 1}], "shipping_address": "addr"},
        headers=auth_headers(app),
    )
    assert resp.status_code == 400


def test_order_create_invalid_quantity(client, app):
    resp = client.post(
        "/api/order/create",
        json={"items": [{"product_id": "p1", "quantity": "x"}], "shipping_address": "addr"},
        headers=auth_headers(app),
    )
    assert resp.status_code == 400


def test_order_create_product_not_found(client, app, monkeypatch):
    import app.routes.order as order_routes

    monkeypatch.setattr(order_routes.Product, "find_by_ids", staticmethod(lambda _ids: []))

    resp = client.post(
        "/api/order/create",
        json={"items": [{"product_id": "p1", "quantity": 1}], "shipping_address": "addr"},
        headers=auth_headers(app),
    )
    assert resp.status_code == 400


def test_order_create_insufficient_stock(client, app, monkeypatch):
    import app.routes.order as order_routes

    monkeypatch.setattr(order_routes.Product, "find_by_ids", staticmethod(lambda _ids: [{"_id": "p1", "stock": 0, "price": 10, "name": "A"}]))

    resp = client.post(
        "/api/order/create",
        json={"items": [{"product_id": "p1", "quantity": 1}], "shipping_address": "addr"},
        headers=auth_headers(app),
    )
    assert resp.status_code == 400


def test_order_create_reserve_stock_fail_rolls_back(client, app, monkeypatch):
    import app.routes.order as order_routes

    release_calls = []

    monkeypatch.setattr(
        order_routes.Product,
        "find_by_ids",
        staticmethod(lambda _ids: [{"_id": "p1", "stock": 9, "price": 10, "name": "A"}]),
    )
    monkeypatch.setattr(order_routes.Product, "reserve_stock", staticmethod(lambda _pid, _q: _UpdateRes(matched_count=0)))
    monkeypatch.setattr(order_routes.Product, "release_stock", staticmethod(lambda pid, q: release_calls.append((pid, q))))

    resp = client.post(
        "/api/order/create",
        json={"items": [{"product_id": "p1", "quantity": 1}], "shipping_address": "addr"},
        headers=auth_headers(app),
    )
    assert resp.status_code == 400
    assert release_calls == []


def test_order_create_success_merges_and_clears_cart(client, app, monkeypatch):
    import app.routes.order as order_routes

    reserve_calls = []
    remove_calls = []

    monkeypatch.setattr(
        order_routes.Product,
        "find_by_ids",
        staticmethod(lambda _ids: [{"_id": "p1", "stock": 9, "price": 10, "name": "A"}]),
    )
    monkeypatch.setattr(
        order_routes.Product,
        "reserve_stock",
        staticmethod(lambda pid, q: (reserve_calls.append((pid, q)) or _UpdateRes(matched_count=1))),
    )
    monkeypatch.setattr(order_routes.Order, "create", staticmethod(lambda _uid, _items, _total, _addr: "oid1"))
    monkeypatch.setattr(order_routes.Cart, "remove_item", staticmethod(lambda _uid, pid: remove_calls.append(pid)))

    resp = client.post(
        "/api/order/create",
        json={"items": [{"product_id": "p1", "quantity": 1}, {"product_id": "p1", "quantity": 2}], "shipping_address": "addr"},
        headers=auth_headers(app),
    )
    assert resp.status_code == 201
    payload = resp.get_json()
    assert payload["data"]["order_id"] == "oid1"
    assert payload["data"]["total_amount"] == 30.0
    assert reserve_calls == [("p1", 3)]
    assert remove_calls == ["p1"]


def test_order_history_invalid_status(client, app):
    resp = client.get("/api/order/history?status=bad", headers=auth_headers(app))
    assert resp.status_code == 400


def test_get_order_permission_denied(client, app, monkeypatch):
    import app.routes.order as order_routes

    monkeypatch.setattr(order_routes.Order, "find_by_id", staticmethod(lambda _oid: {"_id": "o1", "user_id": "other"}))
    resp = client.get("/api/order/o1", headers=auth_headers(app, user_id="u1"))
    assert resp.status_code == 403


def test_cancel_order_already_requested(client, app, monkeypatch):
    import app.routes.order as order_routes

    monkeypatch.setattr(
        order_routes.Order,
        "find_by_id",
        staticmethod(lambda _oid: {"_id": "o1", "user_id": "u1", "status": "cancel_requested"}),
    )
    resp = client.put("/api/order/o1/cancel", json={"reason": "x"}, headers=auth_headers(app))
    assert resp.status_code == 400


def test_cancel_order_success(client, app, monkeypatch):
    import app.routes.order as order_routes

    monkeypatch.setattr(
        order_routes.Order,
        "find_by_id",
        staticmethod(lambda _oid: {"_id": "o1", "user_id": "u1", "status": "pending"}),
    )
    monkeypatch.setattr(order_routes.Order, "request_cancel", staticmethod(lambda _oid, _uid, _r: _UpdateRes(matched_count=1)))
    resp = client.put("/api/order/o1/cancel", json={"reason": "x"}, headers=auth_headers(app))
    assert resp.status_code == 200


def test_pay_order_missing_payment_method(client, app, monkeypatch):
    import app.routes.order as order_routes

    monkeypatch.setattr(order_routes.Order, "find_by_id", staticmethod(lambda _oid: {"_id": "o1", "user_id": "u1", "status": "pending"}))
    resp = client.post("/api/order/o1/pay", json={}, headers=auth_headers(app))
    assert resp.status_code == 400


def test_pay_order_success(client, app, monkeypatch):
    import app.routes.order as order_routes

    monkeypatch.setattr(order_routes.Order, "find_by_id", staticmethod(lambda _oid: {"_id": "o1", "user_id": "u1", "status": "pending"}))
    monkeypatch.setattr(order_routes.PaymentService, "process_payment", staticmethod(lambda _oid, _m: {"status": "success", "message": "ok"}))
    resp = client.post("/api/order/o1/pay", json={"payment_method": "mock"}, headers=auth_headers(app))
    assert resp.status_code == 200


def test_review_order_invalid_rating(client, app, monkeypatch):
    import app.routes.order as order_routes

    monkeypatch.setattr(order_routes.Order, "find_by_id", staticmethod(lambda _oid: {"_id": "o1", "user_id": "u1", "status": "delivered"}))
    resp = client.post("/api/order/o1/review", json={"rating": 10}, headers=auth_headers(app))
    assert resp.status_code == 400


def test_after_sale_invalid_type(client, app, monkeypatch):
    import app.routes.order as order_routes

    monkeypatch.setattr(order_routes.Order, "find_by_id", staticmethod(lambda _oid: {"_id": "o1", "user_id": "u1", "status": "paid"}))
    resp = client.post("/api/order/o1/after_sale", json={"type": "bad"}, headers=auth_headers(app))
    assert resp.status_code == 400

