import pytest
from app import create_app


@pytest.fixture
def client():
    app = create_app("development")
    app.config["TESTING"] = True
    return app.test_client()


def test_slots_public_or_optional_auth(client):
    resp = client.get("/api/maintenance/slots?date=2026-05-02&limit=5")
    assert resp.status_code in [200, 400]


def test_maintenance_requires_auth(client):
    resp = client.get("/api/maintenance/eligible")
    assert resp.status_code == 401

    resp = client.get("/api/maintenance/appointments")
    assert resp.status_code == 401

    resp = client.get("/api/maintenance/records")
    assert resp.status_code == 401


def test_admin_maintenance_requires_admin_auth(client):
    resp = client.get("/api/admin/maintenance/appointments")
    assert resp.status_code == 401

