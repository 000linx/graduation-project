import pytest

from app import create_app
from app.extensions import mongo


@pytest.fixture
def app():
    app = create_app("development")
    app.config.update({"TESTING": True})
    with app.app_context():
        mongo.db.users.delete_many({})
        mongo.db.products.delete_many({})
        mongo.db.reco_events.delete_many({})
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


def _create_user_and_login(client, phone="13800138001", password="password123"):
    r = client.post("/api/user/register", json={"username": "u", "phone": phone, "password": password})
    assert r.status_code in (201, 200)
    login = client.post("/api/user/login", json={"phone": phone, "password": password})
    assert login.status_code == 200
    return login.get_json()["data"]["tokens"]["access_token"]


def test_recommendations_public_endpoint_returns_explanations(client, app):
    with app.app_context():
        mongo.db.products.insert_many(
            [
                {
                    "name": "隐形助听器A",
                    "description": "轻便 隐形 适合日常交流",
                    "price": 1999,
                    "stock": 10,
                    "category": "隐形式",
                    "status": "on_sale",
                },
                {
                    "name": "大功率耳背式B",
                    "description": "大功率 适合重度听损",
                    "price": 3999,
                    "stock": 10,
                    "category": "耳背式",
                    "status": "on_sale",
                },
                {
                    "name": "辅听设备C",
                    "description": "远程麦克风 课堂 会议 FM",
                    "price": 999,
                    "stock": 10,
                    "category": "辅听设备",
                    "status": "on_sale",
                },
            ]
        )

    resp = client.get(
        "/api/product/recommendations?hearing_level=%E8%BD%BB%E5%BA%A6&scenes=%E6%97%A5%E5%B8%B8%E4%BA%A4%E6%B5%81&budget_min=1000&budget_max=2500&limit=5",
        headers={"X-Anonymous-Id": "anon-1", "X-Reco-Session": "s1"},
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["variant"] in ("A", "B")
    assert isinstance(data["items"], list)
    assert len(data["items"]) >= 1
    first = data["items"][0]
    assert "product" in first
    assert isinstance(first.get("reasons"), list)
    assert first["product"].get("_id")


def test_recommendations_variant_is_stable_for_same_anon(client, app):
    with app.app_context():
        mongo.db.products.insert_one(
            {
                "name": "耳背式D",
                "description": "智能 降噪",
                "price": 2999,
                "stock": 10,
                "category": "耳背式",
                "status": "on_sale",
            }
        )

    r1 = client.get("/api/product/recommendations?hearing_level=moderate", headers={"X-Anonymous-Id": "anon-stable"})
    r2 = client.get("/api/product/recommendations?hearing_level=moderate", headers={"X-Anonymous-Id": "anon-stable"})
    assert r1.status_code == 200 and r2.status_code == 200
    v1 = r1.get_json()["data"]["variant"]
    v2 = r2.get_json()["data"]["variant"]
    assert v1 == v2


def test_user_can_save_hearing_profile(client, app):
    token = _create_user_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "hearing_profile": {
            "hearing_level": "severe",
            "scenes": ["会议", "电话"],
            "budget_min": 2000,
            "budget_max": 6000,
            "brands": ["测试品牌"],
        }
    }

    put = client.put("/api/user/hearing_profile", headers=headers, json=payload)
    assert put.status_code == 200
    get = client.get("/api/user/hearing_profile", headers=headers)
    assert get.status_code == 200
    saved = get.get_json()["data"]["hearing_profile"]
    assert saved["hearing_level"] == "severe"

