import json
import time
from datetime import datetime

import pytest

from app import create_app
from app.extensions import mongo


@pytest.fixture
def app():
    app = create_app("development")
    app.config["TESTING"] = True
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


def _register(client, username: str, phone: str, password: str):
    resp = client.post("/api/user/register", json={"username": username, "phone": phone, "password": password})
    assert resp.status_code == 201
    data = json.loads(resp.data)
    return data["data"]["user_id"]


def _login(client, phone: str, password: str) -> str:
    resp = client.post("/api/user/login", json={"phone": phone, "password": password})
    assert resp.status_code == 200
    data = json.loads(resp.data)
    return data["data"]["tokens"]["access_token"]


def _auth(token: str):
    return {"Authorization": f"Bearer {token}"}


def _create_product(app, *, name: str, price: float, stock: int, category: str):
    with app.app_context():
        pid = mongo.db.products.insert_one(
            {
                "name": name,
                "description": "t",
                "price": float(price),
                "stock": int(stock),
                "category": category,
                "status": "on_sale",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }
        ).inserted_id
        return str(pid)


def _new_phone() -> str:
    v = int(time.time() * 1_000_000) % 10_000_000_000
    return f"1{v:010d}"


def test_payment_checkout_denies_non_owner(client, app):
    pid = _create_product(app, name="p1", price=10, stock=5, category="耳背式")

    p1 = _new_phone()
    _register(client, "u1", p1, "password123")
    token1 = _login(client, p1, "password123")
    p2 = _new_phone()
    _register(client, "u2", p2, "password123")
    token2 = _login(client, p2, "password123")

    create = client.post(
        "/api/order/create",
        headers=_auth(token1),
        json={"items": [{"product_id": pid, "quantity": 1}], "shipping_address": "addr"},
    )
    assert create.status_code == 201
    order_id = json.loads(create.data)["data"]["order_id"]

    denied = client.post(
        "/api/payment/checkout",
        headers=_auth(token2),
        json={"order_id": order_id, "payment_method": "wechat"},
    )
    assert denied.status_code == 403


def test_payment_checkout_owner_success_and_idempotency(client, app):
    pid = _create_product(app, name="p2", price=10, stock=5, category="耳背式")
    p3 = _new_phone()
    _register(client, "u3", p3, "password123")
    token = _login(client, p3, "password123")

    create = client.post(
        "/api/order/create",
        headers=_auth(token),
        json={"items": [{"product_id": pid, "quantity": 1}], "shipping_address": "addr"},
    )
    assert create.status_code == 201
    order_id = json.loads(create.data)["data"]["order_id"]

    ok = client.post(
        "/api/payment/checkout",
        headers=_auth(token),
        json={"order_id": order_id, "payment_method": "wechat"},
    )
    assert ok.status_code == 200

    again = client.post(
        "/api/payment/checkout",
        headers=_auth(token),
        json={"order_id": order_id, "payment_method": "wechat"},
    )
    assert again.status_code in (400, 409)


def test_order_create_reserves_stock_once_and_blocks_second_purchase(client, app):
    pid = _create_product(app, name="p3", price=10, stock=1, category="耳背式")

    p4 = _new_phone()
    _register(client, "u4", p4, "password123")
    token = _login(client, p4, "password123")

    first = client.post(
        "/api/order/create",
        headers=_auth(token),
        json={"items": [{"product_id": pid, "quantity": 1}], "shipping_address": "addr"},
    )
    assert first.status_code == 201

    second = client.post(
        "/api/order/create",
        headers=_auth(token),
        json={"items": [{"product_id": pid, "quantity": 1}], "shipping_address": "addr"},
    )
    assert second.status_code == 400

