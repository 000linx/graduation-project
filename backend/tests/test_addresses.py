import pytest

from app import create_app
from app.extensions import mongo


@pytest.fixture
def app():
    app = create_app("development")
    app.config.update({"TESTING": True})
    with app.app_context():
        mongo.db.users.delete_many({})
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


def _register_and_login(client, username="张三", phone="18800003001", password="password123"):
    r = client.post("/api/user/register", json={"username": username, "phone": phone, "password": password})
    assert r.status_code == 201
    l = client.post("/api/user/login", json={"phone": phone, "password": password})
    assert l.status_code == 200
    token = l.get_json()["data"]["tokens"]["access_token"]
    return token


def test_address_crud_and_default(client):
    token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    a1 = {
        "receiver": "张三",
        "phone": "18800003001",
        "province": "北京市",
        "city": "北京市",
        "district": "海淀区",
        "detail": "中关村大街1号",
        "label": "家",
        "is_default": True,
    }
    resp = client.post("/api/user/addresses", json=a1, headers=headers)
    assert resp.status_code == 201
    addr1_id = resp.get_json()["data"]["address_id"]

    a2 = {
        "receiver": "张三",
        "phone": "18800003001",
        "province": "上海市",
        "city": "上海市",
        "district": "浦东新区",
        "detail": "世纪大道88号",
        "label": "公司",
    }
    resp = client.post("/api/user/addresses", json=a2, headers=headers)
    assert resp.status_code == 201
    addr2_id = resp.get_json()["data"]["address_id"]

    resp = client.get("/api/user/addresses", headers=headers)
    assert resp.status_code == 200
    items = resp.get_json()["data"]["addresses"]
    assert len(items) == 2
    assert any(i["_id"] == addr1_id and i["is_default"] is True for i in items)

    resp = client.put(f"/api/user/addresses/{addr2_id}/default", headers=headers)
    assert resp.status_code == 200

    resp = client.get("/api/user/addresses", headers=headers)
    items = resp.get_json()["data"]["addresses"]
    assert any(i["_id"] == addr2_id and i["is_default"] is True for i in items)
    assert any(i["_id"] == addr1_id and i["is_default"] is False for i in items)

    resp = client.put(f"/api/user/addresses/{addr2_id}", json={"detail": "世纪大道99号"}, headers=headers)
    assert resp.status_code == 200

    resp = client.delete(f"/api/user/addresses/{addr2_id}", headers=headers)
    assert resp.status_code == 200

    resp = client.get("/api/user/addresses", headers=headers)
    items = resp.get_json()["data"]["addresses"]
    assert len(items) == 1
    assert items[0]["_id"] == addr1_id
    assert items[0]["is_default"] is True

