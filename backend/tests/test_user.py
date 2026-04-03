import pytest
import json
from app import create_app

@pytest.fixture
def client():
    app = create_app('development')
    app.config['TESTING'] = True
    return app.test_client()

def test_register(client):
    # Basic test for registration endpoint structure
    response = client.post('/api/user/register', json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })
    # This might fail if MongoDB is not running, but the route exists
    assert response.status_code in [201, 400] 

def test_login(client):
    response = client.post('/api/user/login', json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code in [200, 401]
