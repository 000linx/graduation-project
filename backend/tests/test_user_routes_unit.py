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


def test_register_missing_fields(client):
    resp = client.post("/api/user/register", json={})
    assert resp.status_code == 400


def test_register_phone_exists(client, monkeypatch):
    import app.routes.user as user_routes

    monkeypatch.setattr(user_routes.User, "find_by_phone", staticmethod(lambda _p: {"_id": "u"}))
    resp = client.post("/api/user/register", json={"username": "u", "phone": "1", "password": "p"})
    assert resp.status_code == 400


def test_register_success(client, monkeypatch):
    import app.routes.user as user_routes

    monkeypatch.setattr(user_routes.User, "find_by_phone", staticmethod(lambda _p: None))
    monkeypatch.setattr(user_routes.User, "create", staticmethod(lambda _u, _p, _pw: "uid1"))
    resp = client.post("/api/user/register", json={"username": "u", "phone": "1", "password": "p"})
    assert resp.status_code == 201


def test_login_missing_fields(client):
    resp = client.post("/api/user/login", json={"phone": "1"})
    assert resp.status_code == 400


def test_login_invalid_credentials(client, monkeypatch):
    import app.routes.user as user_routes

    monkeypatch.setattr(user_routes.User, "find_by_phone", staticmethod(lambda _p: {"_id": "u", "password_hash": "h", "username": "u"}))
    monkeypatch.setattr(user_routes.User, "verify_password", staticmethod(lambda _h, _p: False))
    resp = client.post("/api/user/login", json={"phone": "1", "password": "p"})
    assert resp.status_code == 401


def test_profile_user_not_found(client, app, monkeypatch):
    import app.routes.user as user_routes

    monkeypatch.setattr(user_routes.User, "find_by_id", staticmethod(lambda _uid: None))
    resp = client.get("/api/user/profile", headers=auth_headers(app))
    assert resp.status_code == 404


def test_change_password_validation_errors(client, app):
    r1 = client.post("/api/user/change_password", json={}, headers=auth_headers(app))
    assert r1.status_code == 400
    r2 = client.post(
        "/api/user/change_password",
        json={"old_password": "a", "new_password": "abcdef", "confirm_password": "x"},
        headers=auth_headers(app),
    )
    assert r2.status_code == 400
    r3 = client.post("/api/user/change_password", json={"old_password": "a", "new_password": "123"}, headers=auth_headers(app))
    assert r3.status_code == 400


def test_change_password_invalid_old_password(client, app, monkeypatch):
    import app.routes.user as user_routes

    monkeypatch.setattr(user_routes.User, "find_by_id", staticmethod(lambda _uid: {"_id": "u1", "password_hash": "h"}))
    monkeypatch.setattr(user_routes.User, "verify_password", staticmethod(lambda _h, _p: False))
    resp = client.post(
        "/api/user/change_password",
        json={"old_password": "a", "new_password": "abcdef"},
        headers=auth_headers(app),
    )
    assert resp.status_code == 401


def test_change_password_update_fail(client, app, monkeypatch):
    import app.routes.user as user_routes

    monkeypatch.setattr(user_routes.User, "find_by_id", staticmethod(lambda _uid: {"_id": "u1", "password_hash": "h"}))
    monkeypatch.setattr(user_routes.User, "verify_password", staticmethod(lambda _h, _p: True))
    monkeypatch.setattr(user_routes.User, "update_password", staticmethod(lambda _uid, _pw: _UpdateRes(matched_count=0)))
    resp = client.post(
        "/api/user/change_password",
        json={"old_password": "a", "new_password": "abcdef"},
        headers=auth_headers(app),
    )
    assert resp.status_code == 400


def test_change_password_success(client, app, monkeypatch):
    import app.routes.user as user_routes

    monkeypatch.setattr(user_routes.User, "find_by_id", staticmethod(lambda _uid: {"_id": "u1", "password_hash": "h"}))
    monkeypatch.setattr(user_routes.User, "verify_password", staticmethod(lambda _h, _p: True))
    monkeypatch.setattr(user_routes.User, "update_password", staticmethod(lambda _uid, _pw: _UpdateRes(matched_count=1)))
    resp = client.post(
        "/api/user/change_password",
        json={"old_password": "a", "new_password": "abcdef"},
        headers=auth_headers(app),
    )
    assert resp.status_code == 200


def test_addresses_crud_validations(client, app, monkeypatch):
    import app.routes.user as user_routes

    monkeypatch.setattr(user_routes.User, "list_addresses", staticmethod(lambda _uid: [{"id": "a1"}]))
    resp = client.get("/api/user/addresses", headers=auth_headers(app))
    assert resp.status_code == 200

    resp = client.post("/api/user/addresses", json={"receiver": "r"}, headers=auth_headers(app))
    assert resp.status_code == 400

    monkeypatch.setattr(user_routes.User, "add_address", staticmethod(lambda _uid, _d: "a1"))
    resp = client.post(
        "/api/user/addresses",
        json={"receiver": "r", "phone": "1", "province": "p", "city": "c", "district": "d", "detail": "x"},
        headers=auth_headers(app),
    )
    assert resp.status_code == 201

    resp = client.put("/api/user/addresses/a1", json={}, headers=auth_headers(app))
    assert resp.status_code == 400

    monkeypatch.setattr(user_routes.User, "update_address", staticmethod(lambda _uid, _aid, _u: True))
    resp = client.put("/api/user/addresses/a1", json={"label": "home"}, headers=auth_headers(app))
    assert resp.status_code == 200

    monkeypatch.setattr(user_routes.User, "delete_address", staticmethod(lambda _uid, _aid: False))
    resp = client.delete("/api/user/addresses/a1", headers=auth_headers(app))
    assert resp.status_code == 404


def test_hearing_profile_get_put(client, app, monkeypatch):
    import app.routes.user as user_routes

    monkeypatch.setattr(user_routes.User, "find_by_id", staticmethod(lambda _uid: {"_id": "u1", "hearing_profile": {"hearing_level": "中度"}}))
    resp = client.get("/api/user/hearing_profile", headers=auth_headers(app))
    assert resp.status_code == 200

    resp = client.put("/api/user/hearing_profile", json={}, headers=auth_headers(app))
    assert resp.status_code == 400

    called = {"ok": False}
    monkeypatch.setattr(user_routes.User, "set_hearing_profile", staticmethod(lambda _uid, _p: called.__setitem__("ok", True)))
    resp = client.put("/api/user/hearing_profile", json={"hearing_profile": {"hearing_level": "轻度"}}, headers=auth_headers(app))
    assert resp.status_code == 200
    assert called["ok"] is True


def test_logout_blacklists_tokens_best_effort(client, app, monkeypatch):
    import app.routes.user as user_routes

    class _Redis:
        def __init__(self):
            self.calls = []

        def setex(self, key, ttl, value):
            self.calls.append((key, ttl, value))

    r = _Redis()
    monkeypatch.setattr(user_routes.extensions, "redis_client", r)
    monkeypatch.setattr(user_routes, "decode_token", lambda _t: {"jti": "r1", "exp": 9999999999})

    with app.app_context():
        token = create_access_token(identity="u1")
    resp = client.post("/api/user/logout", json={"refresh_token": token}, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert any(k.startswith("bl:") for k, *_ in r.calls)

