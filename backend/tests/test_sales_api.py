from datetime import datetime, timedelta

import pytest

from app import create_app
from app.extensions import mongo


@pytest.fixture
def app():
    app = create_app("development")
    app.config.update({"TESTING": True, "ADMIN_BOOTSTRAP_SECRET": "test-secret"})
    with app.app_context():
        mongo.db.users.delete_many({})
        mongo.db.products.delete_many({})
        mongo.db.orders.delete_many({})
        mongo.db.admin_roles.delete_many({})
        mongo.db.admin_permissions.delete_many({})
        mongo.db.admin_user_roles.delete_many({})
        mongo.db.product_stream_meta.delete_many({})
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


def _bootstrap_admin(client, phone="18800008888", password="password123"):
    r = client.post(
        "/api/admin/bootstrap",
        headers={"X-Admin-Bootstrap-Secret": "test-secret"},
        json={"username": "admin", "phone": phone, "password": password},
    )
    assert r.status_code == 201
    login = client.post("/api/user/login", json={"phone": phone, "password": password})
    assert login.status_code == 200
    token = login.get_json()["data"]["tokens"]["access_token"]
    return token


def test_sales_series_and_detail(client):
    token = _bootstrap_admin(client)
    headers = {"Authorization": f"Bearer {token}"}

    p1 = mongo.db.products.insert_one({"name": "A", "category": "耳背式", "price": 10, "stock": 10}).inserted_id
    p2 = mongo.db.products.insert_one({"name": "B", "category": "耳内式", "price": 20, "stock": 10}).inserted_id

    now = datetime.now()
    mongo.db.orders.insert_one(
        {
            "user_id": mongo.db.users.find_one({"phone": "18800008888"})["_id"],
            "items": [{"product_id": p1, "quantity": 2, "unit_price": 10.0, "name": "A"}],
            "total_amount": 20.0,
            "shipping_address": "addr",
            "status": "paid",
            "payment": {"status": "paid", "method": "wechat", "paid_at": now},
            "created_at": now - timedelta(days=1),
            "updated_at": now - timedelta(days=1),
        }
    )
    mongo.db.orders.insert_one(
        {
            "user_id": mongo.db.users.find_one({"phone": "18800008888"})["_id"],
            "items": [{"product_id": p2, "quantity": 1, "unit_price": 20.0, "name": "B"}],
            "total_amount": 20.0,
            "shipping_address": "addr",
            "status": "paid",
            "payment": {"status": "paid", "method": "wechat", "paid_at": now},
            "created_at": now - timedelta(days=1),
            "updated_at": now - timedelta(days=1),
        }
    )

    series = client.get("/api/admin/sales/series?granularity=day", headers=headers)
    assert series.status_code == 200
    items = series.get_json()["data"]["items"]
    assert isinstance(items, list)
    assert len(items) >= 1

    bucket = items[-1]["bucket"]
    detail = client.get(f"/api/admin/sales/detail?granularity=day&bucket={bucket}", headers=headers)
    assert detail.status_code == 200
    assert isinstance(detail.get_json()["data"]["items"], list)

    series_cat = client.get("/api/admin/sales/series?granularity=day&category=耳背式", headers=headers)
    assert series_cat.status_code == 200
    assert isinstance(series_cat.get_json()["data"]["items"], list)

