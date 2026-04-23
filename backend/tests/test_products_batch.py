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
        mongo.db.admin_roles.delete_many({})
        mongo.db.admin_permissions.delete_many({})
        mongo.db.admin_user_roles.delete_many({})
        mongo.db.product_stream_meta.delete_many({})
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


def _bootstrap_admin(client, phone="18800009999", password="password123"):
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


def test_admin_batch_create_products_and_list(client):
    token = _bootstrap_admin(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "products": [
            {
                "name": "批量商品A",
                "category": "耳背式",
                "price": 100,
                "stock": 10,
                "description": "描述A",
                "image_url": "https://example.com/a.webp",
                "status": "on_sale",
            },
            {
                "name": "批量商品B",
                "category": "耳内式",
                "price": 200,
                "stock": 20,
                "description": "描述B",
                "image_url": "https://example.com/b.webp",
                "status": "on_sale",
            },
        ]
    }

    resp = client.post("/api/admin/products/batch", headers=headers, json=payload)
    assert resp.status_code == 201
    ids = resp.get_json()["data"]["product_ids"]
    assert len(ids) == 2

    l = client.get("/api/product/list?page=1&page_size=20")
    assert l.status_code == 200
    products = l.get_json()["data"]["products"]
    names = [p.get("name") for p in products]
    assert "批量商品A" in names
    assert "批量商品B" in names

