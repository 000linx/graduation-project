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


def test_cart_add_missing_product_id(client, app):
    resp = client.post("/api/cart/add", json={"quantity": 1}, headers=auth_headers(app))
    assert resp.status_code == 400


def test_cart_add_product_not_found(client, app, monkeypatch):
    import app.routes.cart as cart_routes

    monkeypatch.setattr(cart_routes.Product, "find_by_id", staticmethod(lambda _pid: None))

    resp = client.post("/api/cart/add", json={"product_id": "p1", "quantity": 1}, headers=auth_headers(app))
    assert resp.status_code == 400


def test_cart_add_insufficient_stock(client, app, monkeypatch):
    import app.routes.cart as cart_routes

    monkeypatch.setattr(cart_routes.Product, "find_by_id", staticmethod(lambda _pid: {"_id": "p1", "stock": 1}))
    monkeypatch.setattr(
        cart_routes.Cart,
        "get_cart",
        staticmethod(lambda _uid: {"items": [{"product_id": "p1", "quantity": 1}]}),
    )

    resp = client.post("/api/cart/add", json={"product_id": "p1", "quantity": 1}, headers=auth_headers(app))
    assert resp.status_code == 400


def test_cart_add_success(client, app, monkeypatch):
    import app.routes.cart as cart_routes

    add_called = {"ok": False}

    monkeypatch.setattr(cart_routes.Product, "find_by_id", staticmethod(lambda _pid: {"_id": "p1", "stock": 99}))
    monkeypatch.setattr(cart_routes.Cart, "get_cart", staticmethod(lambda _uid: {"items": []}))

    def _add(uid, pid, qty):
        add_called["ok"] = True
        assert str(uid) == "u1"
        assert pid == "p1"
        assert qty == 2

    monkeypatch.setattr(cart_routes.Cart, "add_item", staticmethod(_add))

    resp = client.post("/api/cart/add", json={"product_id": "p1", "quantity": 2}, headers=auth_headers(app))
    assert resp.status_code == 200
    assert add_called["ok"] is True


def test_cart_update_invalid_quantity(client, app):
    resp = client.put("/api/cart/update", json={"product_id": "p1", "quantity": "x"}, headers=auth_headers(app))
    assert resp.status_code == 400


def test_cart_update_product_not_found(client, app, monkeypatch):
    import app.routes.cart as cart_routes

    monkeypatch.setattr(cart_routes.Product, "find_by_id", staticmethod(lambda _pid: None))
    resp = client.put("/api/cart/update", json={"product_id": "p1", "quantity": 1}, headers=auth_headers(app))
    assert resp.status_code == 400


def test_cart_update_item_not_in_cart(client, app, monkeypatch):
    import app.routes.cart as cart_routes

    monkeypatch.setattr(cart_routes.Product, "find_by_id", staticmethod(lambda _pid: {"_id": "p1", "stock": 99}))
    monkeypatch.setattr(cart_routes.Cart, "update_item", staticmethod(lambda _uid, _pid, _q: False))

    resp = client.put("/api/cart/update", json={"product_id": "p1", "quantity": 1}, headers=auth_headers(app))
    assert resp.status_code == 400


def test_cart_update_success(client, app, monkeypatch):
    import app.routes.cart as cart_routes

    monkeypatch.setattr(cart_routes.Product, "find_by_id", staticmethod(lambda _pid: {"_id": "p1", "stock": 99}))
    monkeypatch.setattr(cart_routes.Cart, "update_item", staticmethod(lambda _uid, _pid, _q: True))

    resp = client.put("/api/cart/update", json={"product_id": "p1", "quantity": 1}, headers=auth_headers(app))
    assert resp.status_code == 200


def test_cart_remove_success(client, app, monkeypatch):
    import app.routes.cart as cart_routes

    called = {"pid": None}

    def _rm(_uid, pid):
        called["pid"] = pid

    monkeypatch.setattr(cart_routes.Cart, "remove_item", staticmethod(_rm))

    resp = client.delete("/api/cart/remove/p1", headers=auth_headers(app))
    assert resp.status_code == 200
    assert called["pid"] == "p1"


def test_cart_get_items_success(client, app, monkeypatch):
    import app.routes.cart as cart_routes

    monkeypatch.setattr(cart_routes.Cart, "find_by_user_id", staticmethod(lambda _uid: [{"product_id": "p1", "quantity": 1}]))
    resp = client.get("/api/cart/items", headers=auth_headers(app))
    assert resp.status_code == 200
    payload = resp.get_json()
    assert isinstance(payload.get("data", {}).get("items"), list)

