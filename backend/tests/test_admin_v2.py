import json
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
        mongo.db.admin_audit_logs.delete_many({})
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


def _bootstrap_admin(client, phone="18800000001", password="password123"):
    resp = client.post(
        "/api/admin/bootstrap",
        headers={"X-Admin-Bootstrap-Secret": "test-secret"},
        json={"username": "admin", "phone": phone, "password": password},
    )
    assert resp.status_code == 201
    payload = json.loads(resp.data)
    return payload["data"]["user_id"], phone, password


def _login(client, phone, password):
    resp = client.post("/api/admin/login", json={"phone": phone, "password": password})
    assert resp.status_code == 200
    payload = json.loads(resp.data)
    return payload["data"]["tokens"]["access_token"]


def _login_user(client, phone, password):
    resp = client.post("/api/user/login", json={"phone": phone, "password": password})
    assert resp.status_code == 200
    payload = json.loads(resp.data)
    return payload["data"]["tokens"]["access_token"]



def test_admin_stats_and_audit(client):
    _, phone, password = _bootstrap_admin(client)
    token = _login(client, phone, password)

    resp = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200

    resp2 = client.get("/api/admin/audit", headers={"Authorization": f"Bearer {token}"})
    assert resp2.status_code == 200
    data = json.loads(resp2.data)["data"]
    assert "logs" in data
    assert len(data["logs"]) >= 1


def test_rbac_denies_without_permission(client):
    _, phone, password = _bootstrap_admin(client)
    super_token = _login(client, phone, password)

    resp = client.post(
        "/api/user/register",
        json={"username": "a2", "phone": "18800000002", "password": "password123"},
    )
    assert resp.status_code == 201
    user_id = json.loads(resp.data)["data"]["user_id"]

    resp = client.put(
        f"/api/admin/users/{user_id}/role",
        headers={"Authorization": f"Bearer {super_token}"},
        json={"role": "admin"},
    )
    assert resp.status_code == 200

    role_resp = client.post(
        "/api/admin/rbac/roles",
        headers={"Authorization": f"Bearer {super_token}"},
        json={"name": "limited", "description": "limited", "perm_names": ["admin.stats.read"]},
    )
    assert role_resp.status_code == 201
    role_id = json.loads(role_resp.data)["data"]["role_id"]

    resp = client.put(
        f"/api/admin/users/{user_id}/rbac_roles",
        headers={"Authorization": f"Bearer {super_token}"},
        json={"role_ids": [role_id]},
    )
    assert resp.status_code == 200

    limited_token = _login(client, "18800000002", "password123")

    denied = client.get("/api/admin/users", headers={"Authorization": f"Bearer {limited_token}"})
    assert denied.status_code == 403


def test_admin_login_rejects_non_admin(client):
    resp = client.post(
        "/api/user/register",
        json={"username": "u1", "phone": "18800000003", "password": "password123"},
    )
    assert resp.status_code == 201

    denied = client.post("/api/admin/login", json={"phone": "18800000003", "password": "password123"})
    assert denied.status_code == 403

    user_token = _login_user(client, "18800000003", "password123")
    denied2 = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {user_token}"})
    assert denied2.status_code == 403


def test_audit_viewer_can_read_audit_only(client):
    _, phone, password = _bootstrap_admin(client)
    super_token = _login(client, phone, password)

    resp = client.post(
        "/api/user/register",
        json={"username": "aud1", "phone": "18800000004", "password": "password123"},
    )
    assert resp.status_code == 201
    user_id = json.loads(resp.data)["data"]["user_id"]

    resp = client.put(
        f"/api/admin/users/{user_id}/role",
        headers={"Authorization": f"Bearer {super_token}"},
        json={"role": "admin"},
    )
    assert resp.status_code == 200

    role = mongo.db.admin_roles.find_one({"name": "audit_viewer"})
    assert role is not None

    resp = client.put(
        f"/api/admin/users/{user_id}/rbac_roles",
        headers={"Authorization": f"Bearer {super_token}"},
        json={"role_ids": [str(role["_id"])]},
    )
    assert resp.status_code == 200

    audit_token = _login(client, "18800000004", "password123")

    ok = client.get("/api/admin/audit", headers={"Authorization": f"Bearer {audit_token}"})
    assert ok.status_code == 200

    denied = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {audit_token}"})
    assert denied.status_code == 403

