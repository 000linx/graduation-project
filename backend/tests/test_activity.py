from datetime import datetime, timedelta
import time

import pytest

from app import create_app
from app.extensions import mongo
from app.models.user_model import User
from app.admin_v2.services.rbac_service import RbacService
from app.admin_v2.daos.rbac_dao import RbacDao
from bson import ObjectId


@pytest.fixture
def app():
    app = create_app("development")
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def _iso(dt: datetime):
    return dt.isoformat(timespec="minutes")


def _admin_login(client, phone: str, password: str):
    resp = client.post("/api/admin/login", json={"phone": phone, "password": password})
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    token = data["tokens"]["access_token"]
    return token, data.get("permissions", [])

def _unique_phone(prefix: str = "139") -> str:
    tail = str(int(time.time() * 1000))[-8:]
    return f"{prefix}{tail}"


def test_admin_activities_requires_auth(client):
    resp = client.get("/api/admin/activities")
    assert resp.status_code == 401


def test_admin_activities_permission_denied(client, app):
    phone = _unique_phone("139")
    with app.app_context():
        RbacService.ensure_defaults()
        u = User.create(username="p0", phone=phone, password="pass123", role="admin")
        audit_viewer = RbacDao.get_role_by_name("audit_viewer")
        assert audit_viewer is not None
        RbacDao.set_user_roles(str(u), [str(audit_viewer["_id"])])

    token, _ = _admin_login(client, phone, "pass123")
    resp = client.get("/api/admin/activities", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_activity_create_save_publish_flow(client, app):
    phone = _unique_phone("139")
    with app.app_context():
        RbacService.ensure_defaults()
        User.create(username="a1", phone=phone, password="pass123", role="admin")
    token, perms = _admin_login(client, phone, "pass123")
    assert "admin.activities.manage" in perms or "*" in perms

    resp = client.post("/api/admin/activities", headers={"Authorization": f"Bearer {token}"}, json={})
    assert resp.status_code == 201
    activity_id = resp.get_json()["data"]["activity_id"]

    now = datetime.now()
    payload = {
        "name": "活动A",
        "subtitle": "副标题",
        "description": "详情",
        "cover": "",
        "location": {"address": "上海", "lat": None, "lng": None},
        "start_at": _iso(now + timedelta(days=2)),
        "end_at": _iso(now + timedelta(days=2, hours=2)),
        "signup_deadline": _iso(now + timedelta(days=1)),
        "capacity": 10,
        "tags": ["测试"],
        "fee_type": "free",
        "ticket_tiers": [],
        "form_fields": [{"field_id": "f1", "label": "姓名", "type": "text", "required": True, "options": []}],
    }
    resp = client.put(f"/api/admin/activities/{activity_id}", headers={"Authorization": f"Bearer {token}"}, json=payload)
    assert resp.status_code == 200

    resp = client.post(f"/api/admin/activities/{activity_id}/publish", headers={"Authorization": f"Bearer {token}"}, json={"mode": "now"})
    assert resp.status_code == 200

    with app.app_context():
        log_cnt = mongo.db["admin_activity_log"].count_documents({"activity_id": ObjectId(activity_id), "action": "publish"})
        assert log_cnt >= 1


def test_validation_time_conflict_on_save(client, app):
    phone = _unique_phone("139")
    with app.app_context():
        RbacService.ensure_defaults()
        User.create(username="a2", phone=phone, password="pass123", role="admin")
    token, _ = _admin_login(client, phone, "pass123")

    resp = client.post("/api/admin/activities", headers={"Authorization": f"Bearer {token}"}, json={})
    activity_id = resp.get_json()["data"]["activity_id"]

    now = datetime.now()
    payload = {
        "name": "活动B",
        "subtitle": "",
        "description": "",
        "cover": "",
        "location": {"address": "", "lat": None, "lng": None},
        "start_at": _iso(now + timedelta(days=2)),
        "end_at": _iso(now + timedelta(days=1)),
        "signup_deadline": _iso(now + timedelta(days=3)),
        "capacity": 10,
        "tags": [],
        "fee_type": "free",
        "ticket_tiers": [],
        "form_fields": [],
    }
    resp = client.put(f"/api/admin/activities/{activity_id}", headers={"Authorization": f"Bearer {token}"}, json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert "fields" in (data.get("data") or {})


def test_restrict_edit_when_paid_orders_exist(client, app):
    admin_phone = _unique_phone("139")
    user_phone = _unique_phone("138")
    with app.app_context():
        RbacService.ensure_defaults()
        admin_id = User.create(username="a3", phone=admin_phone, password="pass123", role="admin")
        activity_id = mongo.db.activities.insert_one(
            {
                "name": "活动C",
                "subtitle": "",
                "description": "",
                "cover": "",
                "location": {"address": "", "lat": None, "lng": None},
                "start_at": datetime.now() + timedelta(days=3),
                "end_at": datetime.now() + timedelta(days=3, hours=2),
                "signup_deadline": datetime.now() + timedelta(days=2),
                "capacity": 10,
                "tags": [],
                "fee_type": "paid",
                "ticket_tiers": [{"tier_id": "t1", "name": "票", "price": 10, "stock": 1, "sold": 1, "early_bird_price": None, "early_bird_until": None}],
                "form_fields": [],
                "status": "published",
                "publish_at": datetime.now(),
                "created_by": admin_id,
                "updated_by": admin_id,
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "version": 1,
            }
        ).inserted_id
        user_id = User.create(username="u1", phone=user_phone, password="u12345", role="user")
        mongo.db.activity_registrations.insert_one(
            {"activity_id": activity_id, "user_id": user_id, "ticket_tier_id": "t1", "status": "paid", "created_at": datetime.now()}
        )

    token, _ = _admin_login(client, admin_phone, "pass123")
    new_start = _iso(datetime.now() + timedelta(days=10))
    new_end = _iso(datetime.now() + timedelta(days=10, hours=2))
    payload = {
        "name": "活动C",
        "subtitle": "",
        "description": "changed",
        "cover": "x",
        "location": {"address": "x", "lat": None, "lng": None},
        "start_at": new_start,
        "end_at": new_end,
        "signup_deadline": _iso(datetime.now() + timedelta(days=9)),
        "capacity": 999,
        "tags": [],
        "fee_type": "paid",
        "ticket_tiers": [{"tier_id": "t1", "name": "票", "price": 10, "stock": 1}],
        "form_fields": [],
    }
    resp = client.put(f"/api/admin/activities/{str(activity_id)}", headers={"Authorization": f"Bearer {token}"}, json=payload)
    assert resp.status_code == 200
    with app.app_context():
        a = mongo.db.activities.find_one({"_id": activity_id})
        assert a["start_at"].date() != (datetime.fromisoformat(new_start).date())

